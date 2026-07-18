import type { Order, OrderQueryParams, OrderStatusUpdateParams, CreateOrderParams, OrderTimelineNode, OrderAddress } from '@/types/order'
import type { PageResult } from '@/types/global'
import type { AddressItem } from '@/types/address'
import { generateLogistics } from '@/services/logistics'
import { ORDER_CONFIG, ORDER_STATUS_MAP } from '@/config/constants'

// 本地存储 key
const STORAGE_KEY = 'user_orders'

// 模拟网络延迟
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

// 清除旧版播种的测试订单（ID 为 '1'~'5' 且 orderNo 以 SF 开头）
const cleanupLegacyOrders = () => {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (!stored) return
    const list: Order[] = JSON.parse(stored)
    const filtered = list.filter(
      (o) => !o.orderNo?.startsWith('SF') || !['1', '2', '3', '4', '5'].includes(o.id),
    )
    if (filtered.length !== list.length) {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(filtered))
    }
  } catch {
    // ignore
  }
}
cleanupLegacyOrders()

/**
 * 生成标准化订单号
 * 参考淘宝/京东规范：平台标识 + 日期(YYYYMMDD) + 时分秒 + 6位随机序列
 * 示例：YYD20260718143025123456（共 23 位）
 *
 * 结构拆解：
 *   YYD          - 平台标识（鲜渔岛）
 *   20260718     - 下单日期
 *   143025       - 下单时分秒
 *   123456       - 6位随机序列（防碰撞）
 */
const generateOrderNo = (): string => {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const time = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const seq = Math.floor(Math.random() * 1e6)
    .toString()
    .padStart(6, '0')
  return `${ORDER_CONFIG.ORDER_NO_PREFIX}${date}${time}${seq}`
}

/**
 * 生成订单时间轴
 * 根据订单状态和各阶段时间生成时间轴节点
 */
const generateTimeline = (
  status: number,
  times: {
    createTime?: string
    payTime?: string
    shipTime?: string
    deliverTime?: string
    completeTime?: string
    cancelTime?: string
  },
): OrderTimelineNode[] => {
  const nodes: OrderTimelineNode[] = [
    {
      status: 1,
      statusText: '提交订单',
      time: times.createTime || '',
      reached: !!times.createTime,
      description: '订单已提交，等待付款',
    },
    {
      status: 2,
      statusText: '付款成功',
      time: times.payTime || '',
      reached: !!times.payTime,
      description: '支付完成，等待商家发货',
    },
    {
      status: 3,
      statusText: '商家发货',
      time: times.shipTime || '',
      reached: !!times.shipTime,
      description: '商品已发出，正在运送中',
    },
    {
      status: 4,
      statusText: '确认收货',
      time: times.deliverTime || '',
      reached: !!times.deliverTime,
      description: '已签收，待评价',
    },
    {
      status: 5,
      statusText: '交易完成',
      time: times.completeTime || '',
      reached: !!times.completeTime,
      description: '交易已完成',
    },
  ]

  // 已取消订单显示取消节点
  if (status === 9 && times.cancelTime) {
    return [
      nodes[0],
      {
        status: 9,
        statusText: '订单取消',
        time: times.cancelTime,
        reached: true,
        description: '订单已取消',
      },
    ]
  }

  return nodes
}

/**
 * 读取本地订单列表
 */
const readOrders = (): Order[] => {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as Order[]
    }
    return []
  } catch {
    return []
  }
}

/**
 * 写入本地订单列表
 */
const writeOrders = (list: Order[]) => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}

/**
 * 计算运费
 * 满88免运费，否则10元
 */
const calcShippingFee = (totalPrice: number): number => {
  if (totalPrice >= ORDER_CONFIG.FREE_SHIPPING_THRESHOLD) return 0
  return totalPrice > 0 ? ORDER_CONFIG.SHIPPING_FEE : 0
}

/**
 * 获取订单列表
 */
export const getMemberOrderAPI = async (params?: OrderQueryParams) => {
  await delay()
  const orderState = params?.orderState ?? 0
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10

  const all = readOrders()
  const filtered = orderState === 0 ? all : all.filter((o) => o.status === orderState)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = filtered.slice(start, end)

  const result: PageResult<Order> = {
    items,
    counts: filtered.length,
    page,
    pages: Math.ceil(filtered.length / pageSize) || 1,
    pageSize,
  }
  return { code: '0', msg: 'success', result }
}

/**
 * 获取订单详情
 */
export const getMemberOrderByIdAPI = async (id: string) => {
  await delay()
  const all = readOrders()
  const order = all.find((o) => o.id === id || o.orderNo === id)
  return { code: '0', msg: 'success', result: order || null }
}

/**
 * 更新订单状态
 * - status=2 支付：记录支付时间、支付方式
 * - status=3 发货：记录发货时间、生成物流单号
 * - status=4 确认收货：记录送达时间
 * - status=5 完成：记录完成时间
 * - status=9 取消：记录取消时间
 */
export const putMemberOrderStatusAPI = async (id: string, data: OrderStatusUpdateParams) => {
  await delay()
  const all = readOrders()
  const target = all.find((o) => o.id === id)
  if (!target) {
    return { code: '1', msg: '订单不存在', result: null }
  }

  const now = new Date().toISOString()
  const nowText = new Date().toLocaleString('zh-CN')
  target.status = data.status
  target.statusText = ORDER_STATUS_MAP[data.status] || target.statusText

  if (data.status === 2) {
    // 支付
    target.payTime = now
    target.payMethod = data.payMethod || 'wechat'
    target.statusText = '待发货'
  } else if (data.status === 3) {
    // 发货
    target.shipTime = now
    const logistics = generateLogistics(data.logisticsCompany)
    target.trackingNo = logistics.trackingNo
    target.logisticsCompany = logistics.companyName
    target.statusText = '待收货'
    // 设置自动确认收货时间（7天后）
    const autoTime = new Date(Date.now() + ORDER_CONFIG.AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000)
    target.autoConfirmTime = autoTime.toISOString()
  } else if (data.status === 4) {
    // 确认收货
    target.deliverTime = now
    target.statusText = '待评价'
  } else if (data.status === 5) {
    // 完成
    target.completeTime = now
    target.statusText = '已完成'
  } else if (data.status === 9) {
    // 取消
    target.cancelTime = now
    target.statusText = '已取消'
  }

  // 重建时间轴
  target.timeline = generateTimeline(target.status, {
    createTime: target.createTime,
    payTime: target.payTime,
    shipTime: target.shipTime,
    deliverTime: target.deliverTime,
    completeTime: target.completeTime,
    cancelTime: target.cancelTime,
  })

  writeOrders(all)
  return { code: '0', msg: 'success', result: target }
}

/**
 * 获取各状态订单数量统计
 */
export const getOrderCountsAPI = async (): Promise<Record<number, number>> => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const statuses = [1, 2, 3, 4]
  const results = await Promise.all(
    statuses.map((status) => getMemberOrderAPI({ orderState: status, page: 1, pageSize: 1 })),
  )
  results.forEach((res, index) => {
    counts[statuses[index]] = res.result.counts
  })
  return counts
}

/**
 * 创建订单
 * - 生成标准化订单号
 * - 冻结地址快照
 * - 计算运费和实付金额
 * - 初始化时间轴
 */
export const postMemberOrderAPI = async (
  data: CreateOrderParams,
  addressSnapshot: AddressItem,
) => {
  await delay()
  const all = readOrders()

  const now = new Date()
  const nowIso = now.toISOString()
  const nowText = now.toLocaleString('zh-CN')

  const totalPrice = data.items.reduce((sum, item) => sum + item.price * item.count, 0)
  const shippingFee = calcShippingFee(totalPrice)
  const discountAmount = data.discountAmount || 0
  const payAmount = totalPrice + shippingFee - discountAmount

  // 冻结地址快照
  const address: OrderAddress = {
    receiver: addressSnapshot.receiver,
    contact: addressSnapshot.contact,
    fullAddress: `${addressSnapshot.fullLocation} ${addressSnapshot.address}`,
  }

  const orderId = `ORD${now.getTime()}`
  const orderNo = generateOrderNo()

  const newOrder: Order = {
    id: orderId,
    orderNo,
    status: 1,
    statusText: '待付款',
    items: data.items.map((item, idx) => ({
      id: `${now.getTime()}-${idx}`,
      goodsId: item.goodsId,
      name: item.name,
      image: item.image,
      price: item.price,
      count: item.count,
      sku: item.sku,
    })),
    totalPrice,
    shippingFee,
    discountAmount,
    payAmount,
    address,
    buyerMessage: data.buyerMessage,
    deliveryTime: data.deliveryTime,
    createTime: nowIso,
    timeline: generateTimeline(1, { createTime: nowIso }),
  }

  all.unshift(newOrder)
  writeOrders(all)
  return { code: '0', msg: 'success', result: newOrder }
}

/**
 * 取消订单
 */
export const cancelOrderAPI = async (id: string) => {
  return putMemberOrderStatusAPI(id, { status: 9 })
}

/**
 * 删除订单（仅已完成或已取消的订单可删除）
 */
export const deleteOrderAPI = async (id: string) => {
  await delay()
  const all = readOrders()
  const filtered = all.filter((o) => o.id !== id)
  writeOrders(filtered)
  return { code: '0', msg: 'success', result: null }
}

/**
 * 复制订单（再来一单）
 * 创建一个相同商品的新订单
 */
export const repurchaseOrderAPI = async (id: string, addressSnapshot: AddressItem) => {
  await delay()
  const all = readOrders()
  const source = all.find((o) => o.id === id)
  if (!source) {
    return { code: '1', msg: '订单不存在', result: null }
  }

  const now = new Date()
  const nowIso = now.toISOString()

  const totalPrice = source.items.reduce((sum, item) => sum + item.price * item.count, 0)
  const shippingFee = calcShippingFee(totalPrice)
  const payAmount = totalPrice + shippingFee

  const orderId = `ORD${now.getTime()}`
  const orderNo = generateOrderNo()

  const newOrder: Order = {
    id: orderId,
    orderNo,
    status: 1,
    statusText: '待付款',
    items: source.items.map((item, idx) => ({
      id: `${now.getTime()}-${idx}`,
      goodsId: item.goodsId,
      name: item.name,
      image: item.image,
      price: item.price,
      count: item.count,
      sku: item.sku,
    })),
    totalPrice,
    shippingFee,
    discountAmount: 0,
    payAmount,
    address: source.address,
    createTime: nowIso,
    timeline: generateTimeline(1, { createTime: nowIso }),
  }

  all.unshift(newOrder)
  writeOrders(all)
  return { code: '0', msg: 'success', result: newOrder }
}

// ====== 企业端订单管理 API ======

/**
 * 企业端获取全部订单
 * 支持按状态筛选、按订单号/收件人搜索
 */
export const getAdminOrdersAPI = async (params?: OrderQueryParams & { keyword?: string }) => {
  await delay()
  const orderState = params?.orderState ?? 0
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const keyword = params?.keyword?.trim() || ''

  let all = readOrders()

  // 按状态筛选
  if (orderState !== 0) {
    all = all.filter((o) => o.status === orderState)
  }

  // 按关键词搜索（订单号或收件人）
  if (keyword) {
    all = all.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(keyword.toLowerCase()) ||
        o.address.receiver.includes(keyword) ||
        o.address.contact.includes(keyword),
    )
  }

  // 按创建时间倒序
  all = all.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const items = all.slice(start, end)

  const result: PageResult<Order> = {
    items,
    counts: all.length,
    page,
    pages: Math.ceil(all.length / pageSize) || 1,
    pageSize,
  }
  return { code: '0', msg: 'success', result }
}

/**
 * 企业端发货
 * - 状态从 2(待发货) → 3(待收货)
 * - 生成物流单号和物流公司
 * - 记录发货时间
 * - 设置自动确认收货时间
 */
export const shipOrderAPI = async (
  orderId: string,
  logisticsCompany?: string,
) => {
  await delay()
  const all = readOrders()
  const target = all.find((o) => o.id === orderId)

  if (!target) {
    return { code: '1', msg: '订单不存在', result: null }
  }
  if (target.status !== 2) {
    return { code: '1', msg: `订单当前状态为${target.statusText}，无法发货`, result: null }
  }

  const now = new Date().toISOString()
  target.status = 3
  target.statusText = '待收货'
  target.shipTime = now

  // 生成物流信息
  const logistics = generateLogistics(logisticsCompany)
  target.trackingNo = logistics.trackingNo
  target.logisticsCompany = logistics.companyName

  // 设置自动确认收货时间（7天后）
  const autoTime = new Date(Date.now() + ORDER_CONFIG.AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000)
  target.autoConfirmTime = autoTime.toISOString()

  // 重建时间轴
  target.timeline = generateTimeline(target.status, {
    createTime: target.createTime,
    payTime: target.payTime,
    shipTime: target.shipTime,
    deliverTime: target.deliverTime,
    completeTime: target.completeTime,
    cancelTime: target.cancelTime,
  })

  writeOrders(all)
  return { code: '0', msg: 'success', result: target }
}

/**
 * 企业端获取订单统计
 * 返回各状态订单数量 + 总销售额
 */
export const getAdminOrderStatsAPI = async () => {
  await delay()
  const all = readOrders()

  const stats = {
    total: all.length,
    pendingPayment: all.filter((o) => o.status === 1).length,
    pendingShipment: all.filter((o) => o.status === 2).length,
    pendingReceipt: all.filter((o) => o.status === 3).length,
    pendingReview: all.filter((o) => o.status === 4).length,
    completed: all.filter((o) => o.status === 5).length,
    cancelled: all.filter((o) => o.status === 9).length,
    totalSales: all
      .filter((o) => o.status >= 2 && o.status <= 5)
      .reduce((sum, o) => sum + o.payAmount, 0),
  }

  return { code: '0', msg: 'success', result: stats }
}
