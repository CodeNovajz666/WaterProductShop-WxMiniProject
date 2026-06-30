<script setup lang="ts">
import { getHomeBannerAPI, getHomeCategoryAPI, getHomeHotAPI } from '@/services/home'
import type { BannerItem, CategoryItem, HotItem } from '@/types/home'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import CustomNavibar from './components/CustomNavibar.vue'
import CategoryPanel from './components/CategoryPanel.vue'
import HotPanel from './components/HotPanel.vue'
import PageSkeleton from './components/PageSkeleton.vue'
import WaterProductSwiper from '@/components/WaterProductSwiper.vue'
import WaterProductGuess from '@/components/WaterProductGuess.vue'
import { useGuessList } from '@/composables'

const bannerList = ref<BannerItem[]>([])
const getHomeBannerData = async () => {
  const res = await getHomeBannerAPI()
  const seafoodImages = [
    'https://aka.doubaocdn.com/s/Itn71wgyho',
    'https://aka.doubaocdn.com/s/ykpS1wgyho',
    'https://aka.doubaocdn.com/s/FmE21wgyho',
    'https://aka.doubaocdn.com/s/yFKn1wgyho',
    'https://aka.doubaocdn.com/s/bI8m1wgyho'
  ]
  bannerList.value = res.result.map((item, index) => ({
    ...item,
    imgUrl: seafoodImages[index % seafoodImages.length]
  }))
}

const categoryList = ref<CategoryItem[]>([])
const getHomeCategoryData = async () => {
  const res = await getHomeCategoryAPI()
  const seafoodIcons = [
    'https://aka.doubaocdn.com/s/whZ51wgyho',
    'https://aka.doubaocdn.com/s/ykpS1wgyho',
    'https://aka.doubaocdn.com/s/zr6j1wgyho',
    'https://aka.doubaocdn.com/s/hCua1wgyho',
    'https://aka.doubaocdn.com/s/fmN31wgyho',
    'https://aka.doubaocdn.com/s/1g461wgyho',
    'https://aka.doubaocdn.com/s/eouS1wgyho',
    'https://aka.doubaocdn.com/s/eUrc1wgyho',
    'https://aka.doubaocdn.com/s/8Uj61wgyho',
    'https://aka.doubaocdn.com/s/of9N1wgyho'
  ]
  const seafoodNames = ['深海鱼类', '虾蟹贝类', '海鲜干货', '冷冻水产', '新鲜肉类', '时令果蔬', '海鲜调料', '鲜活直供', '进口海产', '礼盒套餐']
  categoryList.value = res.result.map((item, index) => ({
    ...item,
    name: seafoodNames[index % seafoodNames.length],
    icon: seafoodIcons[index % seafoodIcons.length]
  }))
}

const hotList = ref<HotItem[]>([])
const getHomeHotData = async () => {
  const res = await getHomeHotAPI()
  const seafoodData = [
    { title: '新鲜直达', alt: '当日捕捞', pictures: ['https://aka.doubaocdn.com/s/U5FK1wgyho', 'https://aka.doubaocdn.com/s/AMVb1wgyho'] },
    { title: '限时特惠', alt: '特价秒杀', pictures: ['https://aka.doubaocdn.com/s/aKmP1wgyho', 'https://aka.doubaocdn.com/s/bI8m1wgyho'] },
    { title: '进口海产', alt: '品质甄选', pictures: ['https://aka.doubaocdn.com/s/UWyU1wgyho', 'https://aka.doubaocdn.com/s/4acv1wgyho'] },
    { title: '海鲜礼盒', alt: '送礼佳品', pictures: ['https://aka.doubaocdn.com/s/1rJW1wgyho', 'https://aka.doubaocdn.com/s/zJnA1wgyho'] }
  ]
  hotList.value = res.result.map((item, index) => ({
    ...item,
    title: seafoodData[index % seafoodData.length].title,
    alt: seafoodData[index % seafoodData.length].alt,
    pictures: seafoodData[index % seafoodData.length].pictures,
    target: '/pages/category/category'
  }))
}

const isLoading = ref(false)

onLoad(async () => {
  isLoading.value = true
  await Promise.all([getHomeBannerData(), getHomeCategoryData(), getHomeHotData()])
  isLoading.value = false
})

const { guessRef, onScrolltolower } = useGuessList()
const isTriggered = ref(false)
const onRefresherrefresh = async () => {
  isTriggered.value = true
  guessRef.value?.resetData()
  await Promise.all([
    getHomeBannerData(),
    getHomeCategoryData(),
    getHomeHotData(),
    guessRef.value?.getMore(),
  ])
  isTriggered.value = false
}
</script>

<template>
  <CustomNavibar />
  <scroll-view
    enable-back-to-top
    refresher-enabled
    @refresherrefresh="onRefresherrefresh"
    :refresher-triggered="isTriggered"
    @scrolltolower="onScrolltolower"
    class="scroll-view"
    scroll-y
  >
    <PageSkeleton v-if="isLoading" />
    <template v-else>
      <WaterProductSwiper :list="bannerList" />
      <CategoryPanel :list="categoryList" />
      <HotPanel :list="hotList" />
      <view class="fresh-section">
        <view class="section-header">
          <text class="section-title">新鲜直达</text>
          <text class="section-desc">当日捕捞 · 冷链配送</text>
        </view>
        <view class="fresh-list">
          <navigator
            v-for="item in [1, 2, 3, 4]"
            :key="item"
            class="fresh-item"
            :url="`/pages/goods/goods?id=${item}`"
          >
            <image class="fresh-image" mode="aspectFill" :src="`https://aka.doubaocdn.com/s/${['FmE21wgyho', 'yFKn1wgyho', 'bI8m1wgyho', '0uP11wgyho'][item - 1]}`"></image>
            <view class="fresh-info">
              <text class="fresh-name">{{ ['深海三文鱼', '渤海大虾', '鲜活鲈鱼', '挪威鳕鱼'][item - 1] }}</text>
              <view class="fresh-price">
                <text class="current-price">¥{{ [68, 58, 35, 88][item - 1] }}</text>
                <text class="original-price">¥{{ [88, 78, 45, 118][item - 1] }}</text>
              </view>
            </view>
          </navigator>
        </view>
      </view>
      <view class="flash-sale">
        <view class="flash-header">
          <text class="flash-title">限时特惠</text>
          <view class="flash-countdown">
            <text class="countdown-label">距结束</text>
            <view class="countdown-time">
              <text class="time-item">02</text>
              <text class="time-separator">:</text>
              <text class="time-item">30</text>
              <text class="time-separator">:</text>
              <text class="time-item">45</text>
            </view>
          </view>
        </view>
        <scroll-view scroll-x class="flash-scroll">
          <view class="flash-list">
            <navigator
              v-for="item in [101, 102, 103, 104, 105]"
              :key="item"
              class="flash-item"
              :url="`/pages/goods/goods?id=${item}`"
            >
              <image class="flash-image" mode="aspectFill" :src="`https://aka.doubaocdn.com/s/${['Itn71wgyho', 'ykpS1wgyho', 'bI8m1wgyho', 'FmE21wgyho', 'yFKn1wgyho'][item - 101]}`"></image>
              <view class="flash-info">
                <text class="flash-name">{{ ['鲜活龙虾', '帝王蟹', '银鳕鱼', '三文鱼礼盒', '海鲜大礼包'][item - 101] }}</text>
                <view class="flash-price-wrap">
                  <text class="flash-price">¥{{ [168, 298, 158, 298, 598][item - 101] }}</text>
                  <text class="flash-original">¥{{ [268, 498, 238, 398, 898][item - 101] }}</text>
                </view>
              </view>
            </navigator>
          </view>
        </scroll-view>
      </view>
      <WaterProductGuess ref="guessRef" />
    </template>
  </scroll-view>
</template>

<style lang="scss">
page {
  background-color: #f0f8ff;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.scroll-view {
  flex: 1;
}
.fresh-section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 20rpx;
  box-sizing: border-box;
}
.section-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #0066cc;
}
.section-desc {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}
.fresh-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.fresh-item {
  height: 400rpx;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.fresh-image {
  width: 100%;
  height: 100%;
}
.fresh-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15rpx;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}
.fresh-name {
  font-size: 28rpx;
  color: #fff;
}
.fresh-price {
  display: flex;
  align-items: baseline;
  margin-top: 8rpx;
}
.current-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffd700;
}
.original-price {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: line-through;
  margin-left: 10rpx;
}
.flash-sale {
  background-color: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  padding: 20rpx;
}
.flash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.flash-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #ff4444;
}
.flash-countdown {
  display: flex;
  align-items: center;
}
.countdown-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 10rpx;
}
.countdown-time {
  display: flex;
  align-items: center;
}
.time-item {
  background-color: #333;
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
}
.time-separator {
  color: #333;
  font-size: 28rpx;
  font-weight: bold;
  margin: 0 4rpx;
}
.flash-scroll {
  white-space: nowrap;
}
.flash-list {
  display: inline-flex;
}
.flash-item {
  width: 260rpx;
  margin-right: 20rpx;
  display: inline-block;
}
.flash-image {
  width: 260rpx;
  height: 260rpx;
  border-radius: 12rpx;
}
.flash-info {
  padding: 12rpx 0;
}
.flash-name {
  font-size: 26rpx;
  color: #333;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.flash-price-wrap {
  display: flex;
  align-items: baseline;
  margin-top: 8rpx;
}
.flash-price {
  font-size: 30rpx;
  font-weight: bold;
  color: #ff4444;
}
.flash-original {
  font-size: 22rpx;
  color: #999;
  text-decoration: line-through;
  margin-left: 8rpx;
}
</style>