import { useMemberStore } from '@/stores'

/**
 * 需要登录才能访问的页面路径
 * 命中即拦截，未登录时自动跳转登录页
 */
const LOGIN_REQUIRED_PAGES: string[] = [
  // 主包页面
  'pages/shop/shop',                  // 购物车
  'pages/my/my',                      // 我的
  'pages/order/order-list',           // 订单列表
  'pages/order-detail/order-detail',  // 订单详情
  'pages/logistics/logistics',        // 物流详情
  'pages/review-post/review-post',    // 发表评价
  'pages/ugc-post/ugc-post',          // 发布分享
  'pages/my-comments/my-comments',    // 我的评价
  'pages/my-coupons/my-coupons',      // 我的优惠码
  'pages/checkout/checkout',          // 确认订单
  'pages/admin/admin',                // 企业端管理
  'pages/admin-orders/admin-orders',  // 订单管理
  // 分包页面
  'pagesMember/settings/settings',    // 设置
  'pagesMember/profile/profile',      // 个人信息
  'pagesMember/address/address',      // 地址管理
  'pagesMember/address-form/address-form', // 地址表单
  'pagesMember/favorites/favorites',  // 我的收藏
]

/**
 * 白名单页面（永远不需要登录）
 */
const WHITELIST_PAGES: string[] = [
  'pages/index/index',
  'pages/login/login',
  'pages/hot/hot',
  'pages/category/category',
  'pages/goods/goods',
  'pages/ugc-list/ugc-list',
  'pages/ugc-detail/ugc-detail',
  'pages/api-docs/api-docs',
  'pagesMember/help/help',
]

/**
 * 判断指定 URL 是否需要登录
 */
const isLoginRequired = (url: string): boolean => {
  // 提取纯路径（去掉 query 参数和 hash）
  const cleanUrl = url.split('?')[0].split('#')[0].replace(/^\//, '')

  // 白名单页面直接放行
  if (WHITELIST_PAGES.some((p) => cleanUrl.startsWith(p))) {
    return false
  }

  // 命中需要登录的页面
  return LOGIN_REQUIRED_PAGES.some((p) => cleanUrl.startsWith(p))
}

/**
 * 检查登录状态，未登录时跳转登录页
 * @returns 已登录返回 true，未登录返回 false
 */
export const checkLoginAndRedirect = (): boolean => {
  const memberStore = useMemberStore()
  if (memberStore.profile) {
    return true
  }

  // 未登录，提示并跳转
  uni.showToast({
    title: '请先登录',
    icon: 'none',
    duration: 1500,
  })

  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/login/login',
    })
  }, 500)

  return false
}

/**
 * 注册全局路由拦截器
 * 拦截 navigateTo、redirectTo、reLaunch、switchTab
 * 在跳转到需要登录的页面前自动校验登录状态
 */
export const setupLoginInterceptor = () => {
  const interceptors = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']

  interceptors.forEach((method) => {
    uni.addInterceptor(method, {
      invoke(args: any) {
        const url: string = args?.url || ''

        // 不需要登录的页面直接放行
        if (!isLoginRequired(url)) {
          return args
        }

        // 需要登录的页面校验登录状态
        const memberStore = useMemberStore()
        if (memberStore.profile) {
          return args
        }

        // 未登录，提示并跳转登录页
        uni.showToast({
          title: '请先登录后再访问',
          icon: 'none',
          duration: 1500,
        })

        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login',
          })
        }, 500)

        // 返回 false 阻止原跳转
        return false
      },
    })
  })
}

/**
 * 登录拦截 composable
 * 供页面内操作（如加入购物车、点赞、评论）调用
 *
 * @example
 * const { requireLogin } = useLoginGuard()
 * const onAddCart = () => {
 *   if (!requireLogin()) return
 *   // 已登录，继续操作
 * }
 */
export const useLoginGuard = () => {
  /**
   * 校验登录状态，未登录时弹窗引导登录
   * @returns 已登录返回 true，未登录返回 false
   */
  const requireLogin = (): boolean => {
    const memberStore = useMemberStore()
    if (memberStore.profile) {
      return true
    }

    uni.showModal({
      title: '需要登录',
      content: '此操作需要先登录，是否前往登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({ url: '/pages/login/login' })
        }
      },
    })

    return false
  }

  return { requireLogin }
}
