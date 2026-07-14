<script setup lang="ts">
import { getSeafoodItemsAPI } from '@/services/seafood'
import type { SeafoodItem } from '@/types/seafood'
import { onMounted, ref } from 'vue'

const pageParams = {
  page: 1,
  pageSize: 10,
}

const guessList = ref<SeafoodItem[]>([])
const finish = ref(false)

const getHomeGoodsGuessLikeData = async () => {
  if (finish.value === true) {
    return uni.showToast({ icon: 'none', title: '没有更多数据~' })
  }
  const res = await getSeafoodItemsAPI(pageParams)
  const newItems = res.result.items
  guessList.value.push(...newItems)
  if (pageParams.page * pageParams.pageSize < res.result.total) {
    pageParams.page++
  } else {
    finish.value = true
  }
}

const resetData = () => {
  pageParams.page = 1
  guessList.value = []
  finish.value = false
}

onMounted(() => {
  getHomeGoodsGuessLikeData()
})

defineExpose({
  resetData,
  getMore: getHomeGoodsGuessLikeData,
})
</script>

<template>
  <view class="caption">
    <text class="text">猜你喜欢</text>
  </view>
  <view class="guess">
    <navigator
      class="guess-item"
      v-for="item in guessList"
      :key="item.id"
      :url="`/pages/goods/goods?id=${item.id}`"
    >
      <image class="image" mode="aspectFill" lazy-load :src="item.image"></image>
      <view class="name">{{ item.name }}</view>
      <view class="price">
        <text class="small">¥</text>
        <text>{{ item.price }}</text>
      </view>
    </navigator>
  </view>
  <view class="loading-text">
    {{ finish ? '没有更多数据~' : '正在加载...' }}
  </view>
</template>

<style lang="scss">
:host {
  display: block;
}

.caption {
  display: flex;
  justify-content: center;
  line-height: 1;
  padding: 36rpx 0 40rpx;
  font-size: 32rpx;
  color: #0066cc;
  font-weight: bold;
  .text {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0 28rpx 0 30rpx;

    &::before,
    &::after {
      content: '';
      width: 20rpx;
      height: 20rpx;
      background-image: url(@/static/images/bubble.png);
      background-size: contain;
      margin: 0 10rpx;
    }
  }
}

.guess {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 0 20rpx;
  .guess-item {
    padding: 20rpx;
    border-radius: 12rpx;
    overflow: hidden;
    background-color: #fff;
    border: 1rpx solid #e6f7ff;
    box-shadow: 0 2rpx 8rpx rgba(0, 102, 204, 0.05);
    box-sizing: border-box;
  }
  .image {
    width: 100%;
    height: 300rpx;
    border-radius: 8rpx;
  }
  .name {
    height: 75rpx;
    margin: 10rpx 0;
    font-size: 26rpx;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .price {
    line-height: 1;
    padding-top: 4rpx;
    color: #ff6600;
    font-size: 26rpx;
    font-weight: bold;
  }
  .small {
    font-size: 80%;
  }
}

.loading-text {
  text-align: center;
  font-size: 28rpx;
  color: #6699cc;
  padding: 20rpx 0;
}
</style>