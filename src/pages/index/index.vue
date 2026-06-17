<script setup lang = "ts">
import { getHomeBannerAPI, getHomeHotAPI, getHomeCategoryAPI } from '@/services/home.js';
import CustomNavibar from './components/CustomNavibar.vue'
import WaterProductSwiper from './components/WaterProductSwiper.vue';
import { onLoad } from '@dcloudio/uni-app';
import {ref} from 'vue'
import { BannerItem, CategoryItem, HotItem} from '@/types/home.js'
import CategoryPanel from '@/components/CategoryPanel.vue'
import HotPanel from './components/HotPanel.vue';

// 获取轮播图数据
const bannerList = ref<BannerItem[]>([])
const getHomeBannerData = async() => {
    const res = await getHomeBannerAPI()
    console.log(res)
    bannerList.value = res.result
}

// 获取前台分类数据
const categoryList = ref<CategoryItem[]>([])
const getHomeCategoryData = async() =>{
    const res = await getHomeCategoryAPI()
    console.log(res)
    categoryList.value = res.result
}

// 获取热门推荐数据
const hotItemList = ref<HotItem[]>([])
const getHomeHotData = async()=>{
    const res = await getHomeHotAPI();
    console.log(res)
    hotItemList.value = res.result
}
// 页面加载
onLoad(() => {
    getHomeBannerData()
    getHomeCategoryData()
    getHomeHotData()
})
</script>

<template>
    <!--自定义导航栏-->
    <CustomNavibar />
    <!--水产品轮播图-->
    <WaterProductSwiper :list="bannerList"/>
    <!--分类面板-->
    <CategoryPanel :list="categoryList"/>
    <!--热门推荐-->
    <HotPanel :list="hotItemList"/>
    <view class = "index">index</view>
</template>

<style lang = "scss">
page{
    background-color: #f7f7f7;
}

</style>