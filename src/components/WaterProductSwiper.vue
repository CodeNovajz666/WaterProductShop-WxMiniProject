<script setup lang="ts">
import type { BannerItem } from '@/types/home'
import { ref } from 'vue'

const activeIndex = ref(0)

const onChange: UniHelper.SwiperOnChange = (ev) => {
  activeIndex.value = ev.detail.current
}

defineProps<{
  list: BannerItem[]
}>()
</script>

<template>
  <view class="carousel">
    <swiper :circular="true" :autoplay="true" :interval="4000" @change="onChange">
      <swiper-item v-for="item in list" :key="item.id">
        <navigator :url="item.hrefurl" hover-class="none" class="navigator">
          <image mode="aspectFill" class="image" :src="item.imgUrl"></image>
        </navigator>
      </swiper-item>
    </swiper>
    <view class="indicator">
      <text
        v-for="(item, index) in list"
        :key="item.id"
        class="dot"
        :class="{ active: index === activeIndex }"
      ></text>
    </view>
  </view>
</template>

<style lang="scss">
.carousel {
  height: 320rpx;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  .indicator {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 20rpx;
    display: flex;
    justify-content: center;
    .dot {
      width: 36rpx;
      height: 8rpx;
      margin: 0 8rpx;
      border-radius: 8rpx;
      background-color: rgba(255, 255, 255, 0.4);
      transition: all 0.3s ease;
    }
    .active {
      background-color: #fff;
      width: 60rpx;
    }
  }
  .navigator,
  .image {
    width: 100%;
    height: 100%;
  }
}
</style>