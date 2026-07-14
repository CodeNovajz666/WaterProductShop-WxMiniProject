import type { ShopItem } from '@/types/shop'
import { seafoodItems } from '@/data/mock'

// 本地存储 key
const STORAGE_KEY = 'seafood_cart'

// 模拟网络延迟（极短，仅保留异步语义）
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

/** 读取本地购物车列表 */
const readCart = (): ShopItem[] => {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as ShopItem[]) : []
  } catch {
    return []
  }
}

/** 写入本地购物车列表 */
const writeCart = (items: ShopItem[]) => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(items))
}

/**
 * 加入购物车
 * @param data 请求体参数
 */
export const postMemberShopAPI = async (data: { skuId: string; count: number }) => {
  await delay()
  const items = readCart()

  // skuId 格式约定为 `${goodsId}-${attrsText}`，解析出 goodsId 与规格
  const sepIdx = data.skuId.lastIndexOf('-')
  const goodsId = sepIdx > -1 ? data.skuId.slice(0, sepIdx) : data.skuId
  const attrsText = sepIdx > -1 ? data.skuId.slice(sepIdx + 1) : '标准装'

  const goods = seafoodItems.find((g) => g.id === goodsId)
  const existing = items.find((i) => i.id === goodsId && i.attrsText === attrsText)

  if (existing) {
    existing.count += data.count
  } else {
    const newItem: ShopItem = {
      id: goodsId,
      skuId: data.skuId,
      name: goods?.name || '',
      picture: goods?.image || '',
      price: goods?.oldPrice || goods?.price || 0,
      nowPrice: goods?.price || 0,
      count: data.count,
      stock: 99,
      selected: true,
      attrsText,
      isEffective: true,
    }
    items.push(newItem)
  }

  writeCart(items)
  return { code: '0', msg: 'success', result: null }
}

/**
 * 获取购物车列表
 */
export const getMemberShopAPI = async () => {
  await delay()
  return { code: '0', msg: 'success', result: readCart() }
}

/**
 * 删除/清空购物车单品
 * @param data 请求体参数 ids SKUID 集合
 */
export const deleteMemberShopAPI = async (data: { ids: string[] }) => {
  await delay()
  const items = readCart()
  const filtered = items.filter((i) => !data.ids.includes(i.skuId))
  writeCart(filtered)
  return { code: '0', msg: 'success', result: null }
}

/**
 * 修改购物车单品
 * @param skuId SKUID
 * @param data selected 选中状态 count 商品数量
 */
export const putMemberShopBySkuIdAPI = async (
  skuId: string,
  data: { selected?: boolean; count?: number },
) => {
  await delay()
  const items = readCart()
  const target = items.find((i) => i.skuId === skuId)
  if (target) {
    if (typeof data.selected === 'boolean') target.selected = data.selected
    if (typeof data.count === 'number') target.count = data.count
    writeCart(items)
  }
  return { code: '0', msg: 'success', result: null }
}

/**
 * 购物车全选/取消全选
 * @param data selected 是否选中
 */
export const putMemberShopSelectedAPI = async (data: { selected: boolean }) => {
  await delay()
  const items = readCart()
  items.forEach((i) => {
    i.selected = data.selected
  })
  writeCart(items)
  return { code: '0', msg: 'success', result: null }
}
