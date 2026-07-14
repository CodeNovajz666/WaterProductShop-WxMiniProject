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
}

/** 订单信息 */
export type Order = {
  /** 订单 ID */
  id: string
  /** 订单编号 */
  orderNo: string
  /** 订单状态码 */
  status: number
  /** 订单状态文字 */
  statusText: string
  /** 订单商品列表 */
  items: OrderItem[]
  /** 订单总金额 */
  totalPrice: number
  /** 创建时间 */
  createTime: string
  /** 支付时间 */
  payTime?: string
  /** 发货时间 */
  shipTime?: string
  /** 送达时间 */
  deliverTime?: string
  /** 收货地址 */
  address?: string
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
}
