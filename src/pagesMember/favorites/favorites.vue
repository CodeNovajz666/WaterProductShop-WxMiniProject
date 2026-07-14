<script setup lang="ts">
import type { FavoriteItem } from '@/types/favorites'
import { getFavoriteListAPI, removeFavoriteAPI } from '@/services/favorites'
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

const favoriteList = ref<FavoriteItem[]>([])
const loading = ref(false)

// 获取收藏列表
const getFavoriteList = async () => {
  loading.value = true
  try {
    favoriteList.value = await getFavoriteListAPI()
  } finally {
    loading.value = false
  }
}

// 取消收藏
const onRemoveFavorite = (item: FavoriteItem) => {
  uni.showModal({
    content: `确定取消收藏「${item.name}」?`,
    confirmColor: '#ff4757',
    success: async (res) => {
      if (res.confirm) {
        await removeFavoriteAPI(item.id)
        favoriteList.value = favoriteList.value.filter((i) => i.id !== item.id)
        uni.showToast({ title: '已取消收藏', icon: 'success' })
      }
    },
  })
}

// 跳转商品详情
const goGoods = (id: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${id}` })
}

// 返回上一页
const goBack = () => uni.navigateBack()

// 节流：2秒内不重复请求
let lastFetchTime = 0
onShow(() => {
  const now = Date.now()
  if (now - lastFetchTime < 2000) return
  lastFetchTime = now
  getFavoriteList()
})
</script>

<template>
  <view class="favorites-page" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
    <!-- 头部 -->
    <view class="page-header">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">我的收藏</text>
      <view class="header-right">
        <text class="count">{{ favoriteList.length }}件</text>
      </view>
    </view>

    <!-- 收藏列表 -->
    <scroll-view scroll-y class="favorite-scroll">
      <view v-if="loading" class="loading-tip">
        <text>加载中...</text>
      </view>

      <view v-else-if="favoriteList.length > 0" class="favorite-list">
        <view
          v-for="item in favoriteList"
          :key="item.id"
          class="favorite-card"
          @tap="goGoods(item.id)"
        >
          <view class="card-image-wrapper">
            <image class="card-image" :src="item.image" mode="aspectFill" lazy-load />
          </view>
          <view class="card-info">
            <text class="card-name">{{ item.name }}</text>
            <text v-if="item.desc" class="card-desc">{{ item.desc }}</text>
            <view class="card-bottom">
              <view class="card-price-area">
                <text class="card-price">¥{{ item.price }}</text>
                <text v-if="item.oldPrice" class="card-old-price">¥{{ item.oldPrice }}</text>
              </view>
              <view class="card-remove" @tap.stop="onRemoveFavorite(item)">
                <text class="remove-icon">🗑️</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <view class="empty-icon">💝</view>
        <text class="empty-title">暂无收藏商品</text>
        <text class="empty-desc">去首页发现更多新鲜海鲜吧~</text>
        <navigator class="empty-btn" url="/pages/index/index" open-type="switchTab" hover-class="none">
          <text>去逛逛</text>
        </navigator>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f5f7fa;
}
</style>

<style lang="scss" scoped>
.favorites-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx 24rpx;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);

  .header-back {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-icon {
    font-size: 40rpx;
    color: #fff;
  }

  .header-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #fff;
  }

  .header-right {
    min-width: 80rpx;
    text-align: right;
  }

  .count {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.2);
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
  }
}

.favorite-scroll {
  flex: 1;
  padding: 20rpx;
}

.loading-tip {
  text-align: center;
  padding: 100rpx 0;
  text {
    font-size: 28rpx;
    color: #999;
  }
}

.favorite-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.favorite-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }
}

.card-image-wrapper {
  width: 180rpx;
  height: 180rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background-color: #f8f9fa;
  flex-shrink: 0;

  .card-image {
    width: 100%;
    height: 100%;
  }
}

.card-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.card-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2d3436;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  font-size: 24rpx;
  color: #b2bec3;
  margin-top: 8rpx;
}

.card-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.card-price-area {
  display: flex;
  align-items: baseline;
  gap: 12rpx;

  .card-price {
    font-size: 34rpx;
    font-weight: bold;
    color: #ff6b6b;
  }

  .card-old-price {
    font-size: 24rpx;
    color: #b2bec3;
    text-decoration: line-through;
  }
}

.card-remove {
  padding: 8rpx;

  .remove-icon {
    font-size: 36rpx;
    opacity: 0.6;
  }

  &:active .remove-icon {
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #2d3436;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #b2bec3;
  margin-bottom: 48rpx;
}

.empty-btn {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  padding: 24rpx 64rpx;
  border-radius: 44rpx;

  text {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }

  &:active {
    opacity: 0.85;
  }
}

.bottom-space {
  height: 80rpx;
}
</style>
