/**
 * 全局常量配置
 * 集中管理所有硬编码值，避免散落在各文件中
 */

// ====== 默认头像 ======
export const DEFAULT_AVATAR = '/static/images/logo_icon.png'

// ====== 匿名用户名 ======
export const ANONYMOUS_USERNAME = '匿名用户'

// ====== Mock 登录用户 ======
export const MOCK_USER = {
  ID: 1,
  PHONE: '13298745612',
  NICKNAME: '海鲜爱好者',
}

export const MOCK_ENTERPRISE = {
  ID: 100,
  PHONE: '13800001111',
  NICKNAME: '鲜渔岛企业号',
}

// ====== 优惠码 ======
export const COUPON_CODES = {
  SHARE: '001',        // 分享优惠码
  NEWUSER: 'SEAFOOD2024', // 新人优惠码
  VIP: 'VIP10',        // VIP优惠码
} as const

// ====== UGC 发布限制 ======
export const UGC_LIMITS = {
  MAX_IMAGES: 9,          // 最多上传图片数量
  MAX_VIDEO_DURATION: 60, // 视频最大时长（秒）
  MAX_TEXT_LENGTH: 500,   // 正文最大字数
  TITLE_SLICE_LENGTH: 30, // 标题截断长度
} as const

// ====== 优惠码配置 ======
export const COUPON_LIMITS = {
  VALID_DAYS: 30,       // 优惠码有效期（天）
  EXPIRE_REMIND_DAYS: 3, // 过期提醒阈值（天）
  DEFAULT_DISCOUNT: 5,  // 默认折扣值
} as const

// ====== 购买限制 ======
export const PURCHASE_LIMITS = {
  MAX_BUY_COUNT: 99, // 最大购买数量
} as const

// ====== Mock 评论模板 ======
export const MOCK_UGC_COMMENTS = [
  { userName: '海鲜爱好者', content: '看起来很好吃！', createdAt: '2小时前' },
  { userName: '美食达人', content: '这家店的海鲜确实不错', createdAt: '5小时前' },
  { userName: '吃货小王', content: '种草了，准备下单', createdAt: '1天前' },
] as const

// ====== Mock 优惠码预设 ======
export const MOCK_COUPON_PRESETS = [
  {
    code: COUPON_CODES.SHARE,
    discount: 5,
    discountType: 'percent' as const,
    minAmount: 100,
    description: '分销专属优惠码，享受95折',
    active: true,
  },
  {
    code: COUPON_CODES.NEWUSER,
    discount: 30,
    discountType: 'fixed' as const,
    minAmount: 200,
    description: '新人专享，满200减30',
    active: true,
  },
  {
    code: COUPON_CODES.VIP,
    discount: 10,
    discountType: 'percent' as const,
    minAmount: 500,
    description: 'VIP会员专属，享受9折',
    active: false,
  },
]

// ====== 订单配置 ======
export const ORDER_CONFIG = {
  ORDER_NO_PREFIX: 'YYD',           // 订单号前缀（平台标识）
  FREE_SHIPPING_THRESHOLD: 88,      // 包邮门槛（元）
  SHIPPING_FEE: 10,                 // 默认运费（元）
  AUTO_CONFIRM_DAYS: 7,             // 自动确认收货天数
  AUTO_CANCEL_MINUTES: 30,          // 待付款自动取消分钟数
  ORDER_STATUS: {
    PENDING_PAYMENT: 1,             // 待付款
    PENDING_SHIPMENT: 2,            // 待发货
    PENDING_RECEIPT: 3,             // 待收货
    PENDING_REVIEW: 4,              // 待评价
    COMPLETED: 5,                   // 已完成
    CANCELLED: 9,                   // 已取消
  } as const,
} as const

// 订单状态码 -> 状态文字
export const ORDER_STATUS_MAP: Record<number, string> = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '待评价',
  5: '已完成',
  9: '已取消',
}

// 订单状态颜色
export const ORDER_STATUS_COLORS: Record<number, string> = {
  1: '#ff6b6b',   // 待付款-红
  2: '#ffa502',   // 待发货-橙
  3: '#00b894',   // 待收货-绿
  4: '#00cec9',   // 待评价-青
  5: '#636e72',   // 已完成-灰
  9: '#b2bec3',   // 已取消-浅灰
}
