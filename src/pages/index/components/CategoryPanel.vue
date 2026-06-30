<script setup lang="ts">
import type { CategoryItem } from '@/types/home'

defineProps<{
  list: CategoryItem[]
}>()

const gradients = [
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
]

const getGradient = (index: number) => gradients[index % gradients.length]
</script>

<template>
  <view class="category">
    <navigator
      class="category-item"
      hover-class="none"
      url="/pages/category/category"
      v-for="(item, index) in list"
      :key="item.id"
    >
      <view class="icon-wrap" :style="{ background: getGradient(index) }">
        <image class="icon" :src="item.icon" mode="aspectFill"></image>
      </view>
      <text class="text">{{ item.name }}</text>
    </navigator>
  </view>
</template>

<style lang="scss">
.category {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);

  .category-item {
    width: calc(20% - 4rpx);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16rpx 0;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.95);
    }

    .icon-wrap {
      width: 110rpx;
      height: 110rpx;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14rpx;
      box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);
    }
    .icon {
      width: 65rpx;
      height: 65rpx;
    }
    .text {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
      text-align: center;
      line-height: 1.3;
    }
  }
}
</style>