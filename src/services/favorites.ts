import type { FavoriteItem } from '@/types/favorites'

const STORAGE_KEY = 'seafood_favorites'

/**
 * 获取收藏列表
 */
export const getFavoriteListAPI = (): Promise<FavoriteItem[]> => {
  return new Promise((resolve) => {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      resolve(stored ? JSON.parse(stored) : [])
    } catch {
      resolve([])
    }
  })
}

/**
 * 检查商品是否已收藏
 * @param id 商品 ID
 */
export const isFavoritedAPI = async (id: string): Promise<boolean> => {
  const list = await getFavoriteListAPI()
  return list.some((item) => item.id === id)
}

/**
 * 添加收藏
 * @param item 商品信息
 */
export const addFavoriteAPI = (item: Omit<FavoriteItem, 'collectTime'>): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      const list: FavoriteItem[] = stored ? JSON.parse(stored) : []
      if (!list.some((i) => i.id === item.id)) {
        list.unshift({ ...item, collectTime: Date.now() })
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
      }
      resolve(true)
    } catch {
      resolve(false)
    }
  })
}

/**
 * 取消收藏
 * @param id 商品 ID
 */
export const removeFavoriteAPI = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      const list: FavoriteItem[] = stored ? JSON.parse(stored) : []
      const filtered = list.filter((i) => i.id !== id)
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(filtered))
      resolve(true)
    } catch {
      resolve(false)
    }
  })
}

/**
 * 切换收藏状态
 * @param item 商品信息
 * @returns 是否已收藏
 */
export const toggleFavoriteAPI = async (
  item: Omit<FavoriteItem, 'collectTime'>,
): Promise<boolean> => {
  const isFavorited = await isFavoritedAPI(item.id)
  if (isFavorited) {
    await removeFavoriteAPI(item.id)
    return false
  } else {
    await addFavoriteAPI(item)
    return true
  }
}

/**
 * 获取收藏数量
 */
export const getFavoriteCountAPI = async (): Promise<number> => {
  const list = await getFavoriteListAPI()
  return list.length
}
