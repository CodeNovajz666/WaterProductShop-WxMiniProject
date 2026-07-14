/**
 * 类型声明
 * 首页 广告区域数据类型
 */
import type { GoodsItem } from './global'

export type BannerItem = {
    /**跳转链接 */
    hrefurl: string
    /**id */
    id: string
    /**图片链接 */
    imgUrl: string
    /**跳转类型 */
    type: number
}
export type CategoryItem = {
    icon: string
    id: string
    name: string
}
export type HotItem = {
    //说明
    alt: string
    //id
    id: string
    //图片集合
    pictures: string[]
    // 跳转路径
    target: string
    //标题
    title: string
    //推荐类型
    type: string
}
/** 猜你喜欢-商品类型 */
export type GuessItem = GoodsItem
