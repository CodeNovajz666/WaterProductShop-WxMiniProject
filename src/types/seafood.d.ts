export type SeafoodItem = {
  id: string
  name: string
  image: string
  price: number
  oldPrice?: number
  desc?: string
  soldCount?: number
}

export type SeafoodCategory = {
  id: string
  name: string
  icon: string
}

export type SeafoodBanner = {
  id: string
  imgUrl: string
  hrefurl?: string
  type?: number
}

export type UgcContent = {
  id: string
  userId: string
  userName: string
  avatar: string
  content: string
  images: string[]
  video?: string
  videoCover?: string
  goodsId: string
  goodsName: string
  goodsImage: string
  likes: number
  comments: number
  createdAt: string
  _liked?: boolean
  _collected?: boolean
}

export type CouponCode = {
  code: string
  discount: number
  discountType: 'percent' | 'fixed'
  minAmount: number
  description: string
  bindUserId?: string
  active: boolean
  // 适用商品 ID（空表示全场通用）
  goodsId?: string
  goodsName?: string
  // 有效期
  validFrom?: string
  validUntil?: string
  // 来源：分享获得 / 企业发放 / 活动领取
  source?: 'share' | 'enterprise' | 'activity'
  // 是否已使用
  used?: boolean
  // 使用时间
  usedAt?: string
  // 领取时间
  claimedAt?: string
}

export type Review = {
  id: string
  goodsId: string
  /** 评价用户 ID（mock 评价为空） */
  userId?: string
  /** 关联订单 ID（用户评价才有） */
  orderId?: string
  userName: string
  avatar: string
  /** 评分 1-5 */
  rating: number
  content: string
  images: string[]
  createdAt: string
  /** 是否为商家默认展示的种子评价 */
  isSeed?: boolean
}

/** 商品评价发布参数 */
export type PostReviewParams = {
  goodsId: string
  orderId: string
  rating: number
  content: string
  images?: string[]
}

// Order / OrderItem 类型已迁移至 ./order.d.ts，请从该文件导入