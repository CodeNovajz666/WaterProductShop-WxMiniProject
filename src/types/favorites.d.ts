/** 收藏商品类型 */
export type FavoriteItem = {
  /** 商品 ID */
  id: string
  /** 商品名称 */
  name: string
  /** 商品图片 */
  image: string
  /** 商品价格 */
  price: number
  /** 商品原价 */
  oldPrice?: number
  /** 商品描述 */
  desc?: string
  /** 收藏时间戳 */
  collectTime: number
}
