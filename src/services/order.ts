import type { Order, OrderQueryParams, OrderStatusUpdateParams, CreateOrderParams } from '@/types/order'
import type { PageResult } from '@/types/global'

// 本地存储 key
const STORAGE_KEY = 'user_orders'

// 模拟网络延迟（极短，仅保留异步语义）
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

/** 订单状态码 -> 状态文字 */
const statusTextMap: Record<number, string> = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '待评价',
  5: '已完成',
}

/** 读取本地订单列表 */
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

/** 写入本地订单列表 */
const writeOrders = (list: Order[]) => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}

/**
 * 获取订单列表
 * @param params 查询参数（分页 + 状态筛选）
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
 * @param id 订单 ID
 */
export const getMemberOrderByIdAPI = async (id: string) => {
  await delay()
  const all = readOrders()
  const order = all.find((o) => o.id === id)
  return { code: '0', msg: 'success', result: order || null }
}

/**
 * 更新订单状态（支付/确认收货/评价等）
 * @param id 订单 ID
 * @param data 状态更新参数
 */
export const putMemberOrderStatusAPI = async (id: string, data: OrderStatusUpdateParams) => {
  await delay()
  const all = readOrders()
  const target = all.find((o) => o.id === id)
  if (target) {
    target.status = data.status
    target.statusText = statusTextMap[data.status] || target.statusText
    // 标记关键时间节点
    const now = new Date().toLocaleString('zh-CN')
    if (data.status === 2) target.payTime = now
    if (data.status === 3) target.shipTime = now
    if (data.status === 4) target.deliverTime = now
    writeOrders(all)
    return { code: '0', msg: 'success', result: target }
  }
  return { code: '0', msg: 'success', result: null }
}

/**
 * 获取各状态订单数量统计
 * @returns 各状态订单数量映射
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
 * 创建订单（模拟下单）
 * @param data 订单参数
 * @returns 创建的订单信息
 */
export const postMemberOrderAPI = async (data: CreateOrderParams) => {
  await delay()
  const all = readOrders()

  const mockOrder: Order = {
    id: `ORD${Date.now()}`,
    orderNo: `YYD${Date.now().toString().slice(-10)}`,
    status: 1,
    statusText: '待付款',
    items: data.items.map((item, idx) => ({
      id: `${Date.now()}-${idx}`,
      goodsId: item.goodsId,
      name: item.name,
      image: item.image,
      price: item.price,
      count: item.count,
      sku: item.sku,
    })),
    totalPrice: data.items.reduce((sum, item) => sum + item.price * item.count, 0),
    createTime: new Date().toLocaleString('zh-CN'),
  }

  all.unshift(mockOrder)
  writeOrders(all)
  return { code: '0', msg: 'success', result: mockOrder }
}
