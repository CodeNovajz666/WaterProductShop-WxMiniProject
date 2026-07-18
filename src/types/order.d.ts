import type { PageParams } from './global'

/** 订单商品项 */
export type OrderItem = {
  /** 商品项 ID */
  id: string
  /** 商品 ID */
  goodsId: string
  /** 商品名称 */
  name: string
  /** 商品图片 */
  image: string
  /** 商品单价 */
  price: number
  /** 购买数量 */
  count: number
  /** SKU 规格描述 */
  sku: string
}

/** 订单状态枚举 */
export enum OrderStatus {
  /** 待付款 */
  PendingPayment = 1,
  /** 待发货 */
  PendingShipment = 2,
  /** 待收货 */
  PendingReceipt = 3,
  /** 待评价 */
  PendingReview = 4,
  /** 已完成 */
  Completed = 5,
  /** 已取消 */
  Cancelled = 9,
}

/** 物流轨迹节点 */
export type LogisticsTrack = {
  /** 节点时间（ISO 格式） */
  time: string
  /** 节点描述 */
  content: string
  /** 节点位置 */
  location?: string
}

/** 物流信息 */
export type LogisticsInfo = {
  /** 物流单号 */
  trackingNo: string
  /** 物流公司编码 */
  companyCode: string
  /** 物流公司名称 */
  companyName: string
  /** 物流状态：0=待揽收, 1=已揽收, 2=运输中, 3=派送中, 4=已签收 */
  status: number
  /** 物流状态文字 */
  statusText: string
  /** 当前所在城市 */
  currentLocation?: string
  /** 轨迹节点列表（按时间倒序，最新在前） */
  tracks: LogisticsTrack[]
  /** 是否已签收 */
  isSigned: boolean
}

/** 订单地址快照（下单时冻结的地址信息） */
export type OrderAddress = {
  /** 收件人 */
  receiver: string
  /** 联系电话 */
  contact: string
  /** 完整地址（省市区+详细地址） */
  fullAddress: string
}

/** 订单时间轴节点 */
export type OrderTimelineNode = {
  /** 状态码 */
  status: number
  /** 状态文字 */
  statusText: string
  /** 时间（ISO 格式），未到达则为空 */
  time: string
  /** 是否已到达 */
  reached: boolean
  /** 描述 */
  description: string
}

/** 订单信息 */
export type Order = {
  /** 订单 ID */
  id: string
  /** 订单编号（对外展示，符合大厂规范） */
  orderNo: string
  /** 订单状态码 */
  status: number
  /** 订单状态文字 */
  statusText: string
  /** 订单商品列表 */
  items: OrderItem[]
  /** 商品总金额 */
  totalPrice: number
  /** 运费 */
  shippingFee: number
  /** 优惠金额 */
  discountAmount: number
  /** 实付金额 */
  payAmount: number
  /** 收货地址快照 */
  address: OrderAddress
  /** 买家备注 */
  buyerMessage?: string
  /** 配送时间要求 */
  deliveryTime?: string
  /** 支付方式：wechat=微信支付, alipay=支付宝 */
  payMethod?: string
  /** 物流单号（发货后填入） */
  trackingNo?: string
  /** 物流公司名称 */
  logisticsCompany?: string
  /** 订单时间轴 */
  timeline: OrderTimelineNode[]
  /** 创建时间 */
  createTime: string
  /** 支付时间 */
  payTime?: string
  /** 发货时间 */
  shipTime?: string
  /** 送达时间 */
  deliverTime?: string
  /** 完成时间 */
  completeTime?: string
  /** 取消时间 */
  cancelTime?: string
  /** 自动收货截止时间（待收货状态） */
  autoConfirmTime?: string
}

/** 订单查询参数 */
export type OrderQueryParams = PageParams & {
  /** 订单状态：0=全部 */
  orderState?: number
}

/** 订单状态更新参数 */
export type OrderStatusUpdateParams = {
  /** 目标状态 */
  status: number
  /** 物流单号（发货时必填） */
  trackingNo?: string
  /** 物流公司 */
  logisticsCompany?: string
  /** 支付方式 */
  payMethod?: string
}

/** 结算商品项（用于结算页传递） */
export type CheckoutItem = {
  /** 商品 ID */
  goodsId: string
  /** SKU ID */
  skuId: string
  /** 商品名称 */
  name: string
  /** 商品图片 */
  image: string
  /** 商品单价 */
  price: number
  /** 购买数量 */
  count: number
  /** SKU 规格描述 */
  sku: string
}

/** 创建订单请求参数 */
export type CreateOrderParams = {
  /** 收货地址 ID */
  addressId: string
  /** 配送时间 */
  deliveryTime?: string
  /** 买家备注 */
  buyerMessage?: string
  /** 商品来源：cart=从购物车结算, buyNow=直接购买 */
  goodsSource: 'cart' | 'buyNow'
  /** 结算商品列表 */
  items: CheckoutItem[]
  /** 优惠码 */
  couponCode?: string
  /** 优惠金额 */
  discountAmount?: number
}
