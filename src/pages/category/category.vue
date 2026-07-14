<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSeafoodCategoriesAPI, getSeafoodItemsAPI } from '@/services/seafood'
import type { SeafoodCategory, SeafoodItem } from '@/types/seafood'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaTop = ref(0)
const categoryList = ref<SeafoodCategory[]>([])
const goodsList = ref<SeafoodItem[]>([])
const isLoading = ref(true)

onLoad(async () => {
  try {
    const safeAreaInsets = getSafeAreaInsets()
    safeAreaTop.value = safeAreaInsets.top || 0
  } catch (e) {
    console.error('获取系统信息失败:', e)
  }
  
  try {
    const [categoryRes, goodsRes] = await Promise.all([
      getSeafoodCategoriesAPI(),
      getSeafoodItemsAPI({ page: 1, pageSize: 8 })
    ])
    categoryList.value = categoryRes.result
    goodsList.value = goodsRes.result.items
  } catch (error) {
    console.error('分类数据加载失败:', error)
  } finally {
    isLoading.value = false
  }
})

const activeIndex = ref(0)

const currentSecondaryCategories = computed(() => {
  const category = categoryList.value[activeIndex.value]
  if (!category || goodsList.value.length === 0) return []
  
  const startIndex = activeIndex.value * 4
  const categoryGoods = goodsList.value.slice(startIndex, startIndex + 8)
  
  const panelCount = Math.ceil(categoryGoods.length / 4)
  return Array.from({ length: panelCount }, (_, idx) => ({
    id: Number(category.id) * 100 + idx + 1,
    title: `${category.name}精选`,
    subtitle: '深海直供·鲜享美味',
    items: categoryGoods.slice(idx * 4, idx * 4 + 4).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    })),
  }))
})

const selectPrimary = (index: number) => {
  activeIndex.value = index
}

const onGoSearch = () => {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="viewport">
    <view class="search" :style="{ paddingTop: safeAreaTop + 'px' }" @tap="onGoSearch">
      <view class="input">
        <text class="search-icon">🔍</text>
        <text class="search-text">搜索水产品</text>
      </view>
    </view>
    <view class="categories">
      <scroll-view class="primary" scroll-y>
        <view
          v-for="(item, index) in categoryList"
          :key="item.id"
          class="item"
          :class="{ active: index === activeIndex }"
          @tap="selectPrimary(index)"
        >
          <text class="name">{{ item.name }}</text>
        </view>
      </scroll-view>
      <scroll-view class="secondary" scroll-y>
        <view class="goods-list">
          <template v-for="panel in currentSecondaryCategories" :key="panel.id">
            <view class="panel">
              <view class="title">
                <view class="title-left">
                  <text class="title-text">{{ panel.title }}</text>
                  <text class="title-sub">{{ panel.subtitle }}</text>
                </view>
              </view>
              <view class="panel-items">
                <navigator
                  v-for="goods in panel.items"
                  :key="goods.id"
                  class="goods-card"
                  hover-class="none"
                  :url="`/pages/goods/goods?id=${goods.id}`"
                >
                  <image class="goods-image" mode="aspectFill" lazy-load :src="goods.image"></image>
                  <view class="goods-info">
                    <text class="goods-name">{{ goods.name }}</text>
                    <text class="goods-price">¥{{ goods.price }}</text>
                  </view>
                </navigator>
              </view>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  height: 100%;
}
.viewport {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.search {
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  flex-shrink: 0;
}
.search .input {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding-left: 26rpx;
  color: #fff;
  font-size: 28rpx;
  border-radius: 36rpx;
  background-color: rgba(255, 255, 255, 0.2);
}
.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 12rpx;
  opacity: 0.8;
}
.search-text {
  font-size: 28rpx;
}
.categories {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.primary {
  width: 180rpx;
  flex: none;
  background-color: #e6f7ff;
}
.primary .item {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 96rpx;
  font-size: 26rpx;
  color: #336699;
  position: relative;
}
.primary .item::after {
  content: '';
  position: absolute;
  left: 42rpx;
  bottom: 0;
  width: 96rpx;
  border-top: 1rpx solid #cceeff;
}
.primary .item.active {
  background-color: #fff;
}
.primary .item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 8rpx;
  height: 100%;
  background-color: #0066cc;
}
.primary .item.active .name {
  color: #0066cc;
  font-weight: bold;
}
.primary .item:last-child::after,
.primary .item.active::after {
  display: none;
}
.secondary {
  flex: 1;
  background-color: #fff;
}
.goods-list {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}
.panel {
  margin-bottom: 30rpx;
}
.panel-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.title {
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #e6f7ff;
}
.title-left {
  display: flex;
  align-items: baseline;
}
.title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #0066cc;
}
.title-sub {
  font-size: 22rpx;
  color: #999;
  margin-left: 12rpx;
}
.goods-card {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.goods-image {
  width: 100%;
  height: 280rpx;
  border-radius: 12rpx 12rpx 0 0;
}
.goods-info {
  padding: 15rpx;
}
.goods-name {
  font-size: 24rpx;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8rpx;
}
.goods-price {
  font-size: 26rpx;
  color: #ff6600;
  font-weight: bold;
}
</style>
