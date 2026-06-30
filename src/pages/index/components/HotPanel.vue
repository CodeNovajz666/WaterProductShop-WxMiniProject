<script setup lang="ts">
import type { HotItem } from '@/types/home'

defineProps<{
  list: HotItem[]
}>()
</script>

<template>
  <view class="hot-panel">
    <view class="hot-row">
      <view class="hot-item" v-for="item in list" :key="item.id">
        <view class="item-header">
          <text class="item-title">{{ item.title }}</text>
          <text class="item-subtitle">{{ item.alt }}</text>
        </view>
        <navigator hover-class="none" :url="`/pages/hot/hot?type=${item.type}`" class="item-images">
          <image
            v-for="src in item.pictures"
            :key="src"
            class="item-image"
            mode="aspectFill"
            :src="src"
          ></image>
        </navigator>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
.hot-panel {
  margin: 0 20rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
  border-radius: 16rpx;
  border: 2rpx solid #cceeff;
  padding: 20rpx;
}

.hot-row {
  display: flex;
  flex-wrap: wrap;
}

.hot-item {
  width: 50%;
  padding: 10rpx;
  box-sizing: border-box;
  
  .item-header {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
    
    .item-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #0066cc;
    }
    
    .item-subtitle {
      font-size: 22rpx;
      color: #6699cc;
      margin-left: 12rpx;
    }
  }
  
  .item-images {
    display: flex;
    width: 100%;
    gap: 12rpx;
  }
  
  .item-image {
    flex: 1;
    height: 180rpx;
    border-radius: 8rpx;
    background-color: #f0f8ff;
  }
}
</style>