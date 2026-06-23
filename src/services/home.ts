import {http} from '@/utils/http'
import type { PageResult, PageParams } from '@/types/global'
import type{ GuessItem, BannerItem, CategoryItem,HotItem } from '@/types/home'
 
// 首页广告区域
export const getHomeBannerAPI = (distributionSite = 1) => {
    return http<BannerItem[]>({
        method:'GET',
        url: '/home/banner',
        data: {
            distributionSite,
        },
    })
}

// 首页前台分类
// GET
// /home/category/mutil
export const getHomeCategoryAPI = () => {
    return http<CategoryItem[]>({
        method: 'GET',
        url: '/home/category/mutli'
    })
}

// 首页 热门推荐小程序
// GET
// /home/hot/mutli
export const getHomeHotAPI = () =>{
    return http<HotItem[]>({
        method:'GET',
        url:'/home/hot/mutli'
    })
}


/**
 * 猜你喜欢-小程序
 */
export const getHomeGoodsGuessLikeAPI = (data?: PageParams) => {
  return http<PageResult<GuessItem>>({
    method: 'GET',
    url: '/home/goods/guessLike',
    data,
  })
}
