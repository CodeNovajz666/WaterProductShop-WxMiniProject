import type { SeafoodCategory, SeafoodItem, SeafoodBanner, UgcContent, CouponCode, Review } from '@/types/seafood'
import { seafoodCategories, seafoodItems, seafoodBanners, ugcContents, couponCodes, reviews } from '@/data/mock'
import { DEFAULT_AVATAR, ANONYMOUS_USERNAME, MOCK_UGC_COMMENTS, COUPON_LIMITS, UGC_LIMITS } from '@/config/constants'

/** UGC 评论类型 */
export type UgcComment = {
  id: string
  ugcId: string
  userId?: string
  userName: string
  avatar?: string
  content: string
  createdAt: string
  ugcTitle?: string
  ugcGoodsImage?: string
}

// 模拟网络延迟（极短，仅保留异步语义）
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

// ====== UGC 动态数据持久化工具 ======

const UGC_STATS_KEY = 'ugc_stats'      // { [ugcId]: { likes, comments, views } }
const UGC_COMMENTS_KEY = 'ugc_comments' // { [ugcId]: UgcComment[] }
const UGC_LIKED_KEY = 'ugc_liked'       // string[] 已点赞的 UGC ID 列表
const UGC_COLLECTED_KEY = 'ugc_collected' // string[] 已收藏的 UGC ID 列表

/** 读取单个 UGC 的统计数据（点赞数、评论数、浏览量） */
const readUgcStats = (ugcId: string): { likes: number; comments: number; views: number } => {
  try {
    const stored = uni.getStorageSync(UGC_STATS_KEY)
    if (stored) {
      const all = JSON.parse(stored)
      if (all[ugcId]) return all[ugcId]
    }
  } catch {
    // ignore
  }
  return { likes: 0, comments: 0, views: 0 }
}

/** 写入单个 UGC 的统计数据 */
const writeUgcStats = (ugcId: string, stats: { likes: number; comments: number; views: number }) => {
  try {
    let all: Record<string, any> = {}
    const stored = uni.getStorageSync(UGC_STATS_KEY)
    if (stored) all = JSON.parse(stored)
    all[ugcId] = stats
    uni.setStorageSync(UGC_STATS_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

/** 增加浏览量并返回最新统计 */
const incrementViews = (ugcId: string): number => {
  const stats = readUgcStats(ugcId)
  stats.views += 1
  writeUgcStats(ugcId, stats)
  return stats.views
}

/** 读取 UGC 评论列表（从本地存储） */
const readUgcComments = (ugcId: string): UgcComment[] => {
  try {
    const stored = uni.getStorageSync(UGC_COMMENTS_KEY)
    if (stored) {
      const all = JSON.parse(stored)
      if (all[ugcId]) return all[ugcId]
    }
  } catch {
    // ignore
  }
  return []
}

/** 写入 UGC 评论列表 */
const writeUgcComments = (ugcId: string, list: UgcComment[]) => {
  try {
    let all: Record<string, UgcComment[]> = {}
    const stored = uni.getStorageSync(UGC_COMMENTS_KEY)
    if (stored) all = JSON.parse(stored)
    all[ugcId] = list
    uni.setStorageSync(UGC_COMMENTS_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

/** 检查是否已点赞 */
const isUgcLiked = (ugcId: string): boolean => {
  try {
    const stored = uni.getStorageSync(UGC_LIKED_KEY)
    if (stored) {
      const list: string[] = JSON.parse(stored)
      return list.includes(ugcId)
    }
  } catch {
    // ignore
  }
  return false
}

/** 切换点赞状态，返回最新点赞数 */
const toggleUgcLike = (ugcId: string): { liked: boolean; likes: number } => {
  try {
    let list: string[] = []
    const stored = uni.getStorageSync(UGC_LIKED_KEY)
    if (stored) list = JSON.parse(stored)

    const stats = readUgcStats(ugcId)
    if (list.includes(ugcId)) {
      list = list.filter((id) => id !== ugcId)
      stats.likes = Math.max(0, stats.likes - 1)
    } else {
      list.push(ugcId)
      stats.likes += 1
    }
    uni.setStorageSync(UGC_LIKED_KEY, JSON.stringify(list))
    writeUgcStats(ugcId, stats)
    return { liked: list.includes(ugcId), likes: stats.likes }
  } catch {
    return { liked: false, likes: 0 }
  }
}

/** 检查是否已收藏 */
const isUgcCollected = (ugcId: string): boolean => {
  try {
    const stored = uni.getStorageSync(UGC_COLLECTED_KEY)
    if (stored) {
      const list: string[] = JSON.parse(stored)
      return list.includes(ugcId)
    }
  } catch {
    // ignore
  }
  return false
}

/** 切换收藏状态 */
const toggleUgcCollect = (ugcId: string): boolean => {
  try {
    let list: string[] = []
    const stored = uni.getStorageSync(UGC_COLLECTED_KEY)
    if (stored) list = JSON.parse(stored)

    if (list.includes(ugcId)) {
      list = list.filter((id) => id !== ugcId)
    } else {
      list.push(ugcId)
    }
    uni.setStorageSync(UGC_COLLECTED_KEY, JSON.stringify(list))
    return list.includes(ugcId)
  } catch {
    return false
  }
}

/** 获取商品分类列表 */
export const getSeafoodCategoriesAPI = async () => {
  await delay()
  return { code: '0', msg: 'success', result: seafoodCategories }
}

/** 获取商品列表（分页） */
export const getSeafoodItemsAPI = async (params?: { page?: number; pageSize?: number }) => {
  await delay()
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10

  // 合并企业端上架的新产品
  let allItems = [...seafoodItems]
  try {
    const adminProducts = uni.getStorageSync('admin_products')
    if (adminProducts) {
      const adminList: SeafoodItem[] = JSON.parse(adminProducts)
      allItems = [...adminList, ...seafoodItems]
    }
  } catch {
    // ignore
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    code: '0',
    msg: 'success',
    result: {
      items: allItems.slice(start, end),
      total: allItems.length,
    },
  }
}

/** 获取首页 Banner 列表 */
export const getSeafoodBannersAPI = async () => {
  await delay()
  return { code: '0', msg: 'success', result: seafoodBanners }
}

/** 获取 UGC 分享内容列表（合并动态数据） */
export const getUgcContentsAPI = async () => {
  await delay()
  let allUgc = [...ugcContents]
  try {
    const userPosts = uni.getStorageSync('user_ugc_posts')
    if (userPosts) {
      const userUgc: UgcContent[] = JSON.parse(userPosts)
      allUgc = [...userUgc, ...ugcContents]
    }
  } catch {
    // ignore
  }

  // 合并动态数据：每个 UGC 的 likes、comments 从本地存储读取
  allUgc = allUgc.map((item) => {
    const stats = readUgcStats(item.id)
    const liked = isUgcLiked(item.id)
    return {
      ...item,
      likes: stats.likes || item.likes,
      comments: stats.comments,
      _liked: liked,
    }
  })

  return { code: '0', msg: 'success', result: allUgc }
}

/** 根据 ID 获取商品详情 */
export const getSeafoodItemByIdAPI = async (id: string) => {
  await delay()
  let item = seafoodItems.find((i) => i.id === id)
  if (!item) {
    try {
      const adminProducts = uni.getStorageSync('admin_products')
      if (adminProducts) {
        const adminList: SeafoodItem[] = JSON.parse(adminProducts)
        item = adminList.find((i) => i.id === id)
      }
    } catch {
      // ignore
    }
  }
  return { code: '0', msg: 'success', result: item || seafoodItems[0] }
}

/** 获取优惠码列表 */
/** 获取优惠码列表（合并企业端配置） */
export const getCouponCodesAPI = async () => {
  await delay()
  // 读取企业端配置的优惠码（本地存储优先）
  let allCoupons = [...couponCodes]
  try {
    const stored = uni.getStorageSync('admin_coupons')
    if (stored) {
      const adminCoupons: CouponCode[] = JSON.parse(stored)
      // 企业端配置覆盖同 code 的预设优惠码
      const presetCodes = new Set(adminCoupons.map((c) => c.code))
      allCoupons = [
        ...adminCoupons,
        ...couponCodes.filter((c) => !presetCodes.has(c.code)),
      ]
    }
  } catch {
    // ignore
  }
  return { code: '0', msg: 'success', result: allCoupons }
}

/** 保存企业端优惠码配置 */
export const saveAdminCouponsAPI = async (coupons: CouponCode[]) => {
  await delay()
  uni.setStorageSync('admin_coupons', JSON.stringify(coupons))
  return { code: '0', msg: 'success', result: coupons }
}

// ====== 用户优惠码管理 ======

const USER_COUPONS_KEY = 'user_coupons'

/** 获取当前用户的所有优惠码 */
export const getUserCouponsAPI = async () => {
  await delay()
  try {
    const stored = uni.getStorageSync(USER_COUPONS_KEY)
    if (stored) {
      const coupons: CouponCode[] = JSON.parse(stored)
      // 检查过期状态
      const now = new Date()
      const processed = coupons.map((c) => {
        if (c.validUntil && !c.used) {
          const expired = new Date(c.validUntil) < now
          if (expired) {
            return { ...c, used: true, usedAt: '已过期' }
          }
        }
        return c
      })
      return { code: '0', msg: 'success', result: processed }
    }
  } catch {
    // ignore
  }
  return { code: '0', msg: 'success', result: [] }
}

/** 领取/绑定优惠码到当前用户 */
export const claimCouponAPI = async (
  code: string,
  source: 'share' | 'enterprise' | 'activity' = 'share',
  goodsId?: string,
  goodsName?: string,
) => {
  await delay()

  // 从优惠码列表中查找
  let allCoupons = [...couponCodes]
  try {
    const stored = uni.getStorageSync('admin_coupons')
    if (stored) {
      const adminCoupons: CouponCode[] = JSON.parse(stored)
      const presetCodes = new Set(adminCoupons.map((c) => c.code))
      allCoupons = [
        ...adminCoupons,
        ...couponCodes.filter((c) => !presetCodes.has(c.code)),
      ]
    }
  } catch {
    // ignore
  }

  const coupon = allCoupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase())
  if (!coupon) {
    return { code: '1', msg: '无效的优惠码', result: null }
  }
  if (coupon.active === false) {
    return { code: '1', msg: '该优惠码已停止发放', result: null }
  }

  // 读取已有用户优惠码
  let userCoupons: CouponCode[] = []
  try {
    const stored = uni.getStorageSync(USER_COUPONS_KEY)
    if (stored) userCoupons = JSON.parse(stored)
  } catch {
    // ignore
  }

  // 检查是否已领取
  if (userCoupons.some((c) => c.code.toUpperCase() === coupon.code.toUpperCase())) {
    return { code: '1', msg: '您已领取过该优惠码', result: null }
  }

  // 构建用户优惠码（附带有效期、来源等信息）
  const now = new Date()
  const validUntil = new Date(now)
  validUntil.setDate(validUntil.getDate() + COUPON_LIMITS.VALID_DAYS) // 有效期天数

  const userCoupon: CouponCode = {
    ...coupon,
    source,
    goodsId: goodsId || coupon.goodsId,
    goodsName: goodsName || coupon.goodsName,
    validFrom: now.toISOString().slice(0, 10),
    validUntil: validUntil.toISOString().slice(0, 10),
    claimedAt: now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    used: false,
  }

  userCoupons.unshift(userCoupon)
  uni.setStorageSync(USER_COUPONS_KEY, JSON.stringify(userCoupons))

  return { code: '0', msg: 'success', result: userCoupon }
}

/** 使用优惠码（标记为已使用） */
export const useCouponAPI = async (code: string) => {
  await delay()
  try {
    const stored = uni.getStorageSync(USER_COUPONS_KEY)
    if (!stored) return { code: '1', msg: '优惠码不存在', result: null }

    const coupons: CouponCode[] = JSON.parse(stored)
    const idx = coupons.findIndex((c) => c.code.toUpperCase() === code.toUpperCase())
    if (idx === -1) return { code: '1', msg: '优惠码不存在', result: null }

    if (coupons[idx].used) {
      return { code: '1', msg: '优惠码已使用', result: null }
    }

    coupons[idx].used = true
    coupons[idx].usedAt = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    uni.setStorageSync(USER_COUPONS_KEY, JSON.stringify(coupons))

    return { code: '0', msg: 'success', result: coupons[idx] }
  } catch {
    return { code: '1', msg: '操作失败', result: null }
  }
}

/** 删除用户优惠码 */
export const deleteUserCouponAPI = async (code: string) => {
  await delay()
  try {
    const stored = uni.getStorageSync(USER_COUPONS_KEY)
    if (!stored) return { code: '0', msg: 'success', result: null }

    const coupons: CouponCode[] = JSON.parse(stored)
    const filtered = coupons.filter((c) => c.code.toUpperCase() !== code.toUpperCase())
    uni.setStorageSync(USER_COUPONS_KEY, JSON.stringify(filtered))

    return { code: '0', msg: 'success', result: null }
  } catch {
    return { code: '1', msg: '删除失败', result: null }
  }
}

/** 获取用户优惠码数量（用于角标） */
export const getUserCouponCountAPI = async () => {
  await delay()
  try {
    const stored = uni.getStorageSync(USER_COUPONS_KEY)
    if (stored) {
      const coupons: CouponCode[] = JSON.parse(stored)
      // 只统计未使用且未过期的
      const now = new Date()
      const valid = coupons.filter((c) => {
        if (c.used) return false
        if (c.validUntil && new Date(c.validUntil) < now) return false
        return true
      })
      return { code: '0', msg: 'success', result: valid.length }
    }
  } catch {
    // ignore
  }
  return { code: '0', msg: 'success', result: 0 }
}

/** 根据商品 ID 获取评价列表 */
export const getReviewsByGoodsIdAPI = async (goodsId: string) => {
  await delay()
  return { code: '0', msg: 'success', result: reviews.filter((r) => r.goodsId === goodsId) }
}

/** 根据 ID 获取单条 UGC 内容（合并动态点赞数和评论数） */
export const getUgcContentByIdAPI = async (id: string) => {
  await delay()
  // 优先从默认数据查找
  let item = ugcContents.find((i) => i.id === id)
  // 再从用户发布的分享中查找
  if (!item) {
    try {
      const userPosts = uni.getStorageSync('user_ugc_posts')
      if (userPosts) {
        const userUgc: UgcContent[] = JSON.parse(userPosts)
        item = userUgc.find((i) => i.id === id)
      }
    } catch {
      // ignore
    }
  }
  if (!item) {
    return { code: '0', msg: 'success', result: ugcContents[0] }
  }

  // 合并动态数据：点赞数、评论数、收藏状态、浏览量递增
  const stats = readUgcStats(id)
  const liked = isUgcLiked(id)
  const collected = isUgcCollected(id)
  item = {
    ...item,
    likes: stats.likes || item.likes,
    comments: stats.comments,
    _liked: liked,
    _collected: collected,
  }

  return { code: '0', msg: 'success', result: item }
}

/** 发布分享的请求参数 */
export type PostUgcParams = {
  content: string
  images: string[]
  video?: string
  videoCover?: string
  goodsId: string
}

/** 发布 UGC 分享内容 */
export const postUgcContentAPI = async (data: PostUgcParams) => {
  await delay()
  const memberStore = uni.getStorageSync('member_store')
  const userName = memberStore?.nickname || memberStore?.account || ANONYMOUS_USERNAME
  const avatar = memberStore?.avatar || DEFAULT_AVATAR
  const goods = seafoodItems.find((g) => g.id === data.goodsId)

  const newUgc: UgcContent = {
    id: `user_${Date.now()}`,
    userId: memberStore?.id?.toString() || 'anonymous',
    userName,
    avatar,
    content: data.content,
    images: data.images,
    video: data.video,
    videoCover: data.videoCover,
    goodsId: data.goodsId,
    goodsName: goods?.name || '未知商品',
    goodsImage: goods?.image || '',
    likes: 0,
    comments: 0,
    createdAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }

  // 保存到本地存储
  const stored = uni.getStorageSync('user_ugc_posts')
  const posts: UgcContent[] = stored ? JSON.parse(stored) : []
  posts.unshift(newUgc)
  uni.setStorageSync('user_ugc_posts', JSON.stringify(posts))

  return { code: '0', msg: 'success', result: newUgc }
}

/** 获取 UGC 评论列表（从本地存储读取，预设 UGC 首次返回 mock 评论） */
export const getUgcCommentsAPI = async (ugcId: string) => {
  await delay()

  // 先从本地存储读取用户评论
  let comments = readUgcComments(ugcId)

  // 如果本地存储没有评论，且是预设 mock UGC，则生成初始 mock 评论
  if (comments.length === 0 && !ugcId.startsWith('user_')) {
    comments = MOCK_UGC_COMMENTS.map((c, i) => ({
      id: `mock_${i + 1}`,
      ugcId,
      ...c,
    }))
    writeUgcComments(ugcId, comments)
  }

  // 更新评论数到 stats
  const stats = readUgcStats(ugcId)
  if (stats.comments !== comments.length) {
    stats.comments = comments.length
    writeUgcStats(ugcId, stats)
  }

  return { code: '0', msg: 'success', result: comments }
}

/** 提交 UGC 评论（持久化到本地存储） */
export const postUgcCommentAPI = async (ugcId: string, data: { content: string }) => {
  await delay()

  const memberStore = uni.getStorageSync('member_store')
  const userName = memberStore?.nickname || memberStore?.account || ANONYMOUS_USERNAME
  const avatar = memberStore?.avatar || ''
  const userId = memberStore?.id?.toString() || 'anonymous'

  // 查找 UGC 关联信息
  let ugcTitle = ''
  let ugcGoodsImage = ''
  let ugcItem = ugcContents.find((i) => i.id === ugcId)
  if (!ugcItem) {
    try {
      const userPosts = uni.getStorageSync('user_ugc_posts')
      if (userPosts) {
        const userUgc: UgcContent[] = JSON.parse(userPosts)
        ugcItem = userUgc.find((i) => i.id === ugcId)
      }
    } catch {
      // ignore
    }
  }
  if (ugcItem) {
    ugcTitle = ugcItem.content.slice(0, UGC_LIMITS.TITLE_SLICE_LENGTH) + (ugcItem.content.length > UGC_LIMITS.TITLE_SLICE_LENGTH ? '...' : '')
    ugcGoodsImage = ugcItem.goodsImage || ugcItem.images[0] || ''
  }

  const newComment: UgcComment = {
    id: `comment_${Date.now()}`,
    ugcId,
    userId,
    userName,
    avatar,
    content: data.content,
    createdAt: '刚刚',
    ugcTitle,
    ugcGoodsImage,
  }

  // 保存到本地存储
  const comments = readUgcComments(ugcId)
  comments.push(newComment)
  writeUgcComments(ugcId, comments)

  // 更新评论数
  const stats = readUgcStats(ugcId)
  stats.comments = comments.length
  writeUgcStats(ugcId, stats)

  return { code: '0', msg: 'success', result: newComment }
}

/** UGC 点赞/取消点赞（切换状态，持久化） */
export const postUgcLikeAPI = async (ugcId: string) => {
  await delay()
  const result = toggleUgcLike(ugcId)
  return { code: '0', msg: 'success', result }
}

/** UGC 收藏/取消收藏（切换状态，持久化） */
export const postUgcCollectAPI = async (ugcId: string) => {
  await delay()
  const collected = toggleUgcCollect(ugcId)
  return { code: '0', msg: 'success', result: { collected } }
}

/** 检查 UGC 点赞状态 */
export const getUgcLikeStatusAPI = async (ugcId: string) => {
  await delay()
  return { code: '0', msg: 'success', result: { liked: isUgcLiked(ugcId) } }
}

/** 检查 UGC 收藏状态 */
export const getUgcCollectStatusAPI = async (ugcId: string) => {
  await delay()
  return { code: '0', msg: 'success', result: { collected: isUgcCollected(ugcId) } }
}

/** 增加浏览量并返回最新统计 */
export const postUgcViewAPI = async (ugcId: string) => {
  await delay()
  const views = incrementViews(ugcId)
  return { code: '0', msg: 'success', result: { views } }
}

/** 删除 UGC 评论（仅能删除自己的评论） */
export const deleteUgcCommentAPI = async (ugcId: string, commentId: string) => {
  await delay()

  const memberStore = uni.getStorageSync('member_store')
  const userId = memberStore?.id?.toString() || 'anonymous'

  const comments = readUgcComments(ugcId)
  const comment = comments.find((c) => c.id === commentId)

  if (!comment) {
    return { code: '1', msg: '评论不存在', result: null }
  }

  // 仅允许删除自己的评论（mock 评论 id 以 mock_ 开头，不可删除）
  if (comment.userId && comment.userId !== userId) {
    return { code: '1', msg: '只能删除自己的评论', result: null }
  }

  const filtered = comments.filter((c) => c.id !== commentId)
  writeUgcComments(ugcId, filtered)

  // 更新评论数
  const stats = readUgcStats(ugcId)
  stats.comments = filtered.length
  writeUgcStats(ugcId, stats)

  return { code: '0', msg: 'success', result: { comments: stats.comments } }
}

/** 获取当前用户的所有评论（跨 UGC） */
export const getUserCommentsAPI = async () => {
  await delay()

  const memberStore = uni.getStorageSync('member_store')
  const userId = memberStore?.id?.toString() || 'anonymous'

  const allComments: UgcComment[] = []

  // 遍历本地存储中所有 UGC 评论
  try {
    const stored = uni.getStorageSync(UGC_COMMENTS_KEY)
    if (stored) {
      const allMap = JSON.parse(stored)
      for (const ugcId in allMap) {
        const list: UgcComment[] = allMap[ugcId]
        // 只返回当前用户的评论
        const userComments = list.filter(
          (c) => c.userId === userId && !c.id.startsWith('mock_'),
        )
        allComments.push(...userComments)
      }
    }
  } catch {
    // ignore
  }

  // 按时间倒序（新的 comment id 更大）
  allComments.sort((a, b) => b.id.localeCompare(a.id))

  return { code: '0', msg: 'success', result: allComments }
}
