<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  getUserCommentsAPI,
  deleteUgcCommentAPI,
  getUserGoodsReviewsAPI,
  deleteGoodsReviewAPI,
  getSeafoodItemByIdAPI,
} from '@/services/seafood'
import type { UgcComment } from '@/services/seafood'
import type { Review, SeafoodItem } from '@/types/seafood'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

// Tab 类型：ugc=UGC评论，goods=商品评价
type TabType = 'ugc' | 'goods'
const activeTab = ref<TabType>('ugc')

const comments = ref<UgcComment[]>([])
const goodsReviews = ref<(Review & { goodsInfo?: SeafoodItem })[]>([])
const loading = ref(false)

// 格式化时间
const formatTime = (iso: string): string => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`
  return d.toLocaleDateString('zh-CN')
}

// 加载 UGC 评论
const loadUgcComments = async () => {
  loading.value = true
  try {
    const res = await getUserCommentsAPI()
    comments.value = res.result
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
}

// 加载商品评价
const loadGoodsReviews = async () => {
  loading.value = true
  try {
    const res = await getUserGoodsReviewsAPI()
    // 并行加载商品信息
    const reviewsWithGoods = await Promise.all(
      res.result.map(async (review) => {
        const goodsRes = await getSeafoodItemByIdAPI(review.goodsId)
        return { ...review, goodsInfo: goodsRes.result || undefined }
      }),
    )
    goodsReviews.value = reviewsWithGoods
  } catch {
    goodsReviews.value = []
  } finally {
    loading.value = false
  }
}

// 切换 Tab
const switchTab = (tab: TabType) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  if (tab === 'ugc') {
    loadUgcComments()
  } else {
    loadGoodsReviews()
  }
}

// 删除 UGC 评论
const onDeleteUgc = (comment: UgcComment) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条评价吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await deleteUgcCommentAPI(comment.ugcId, comment.id)
        if (result.code === '0') {
          comments.value = comments.value.filter((c) => c.id !== comment.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
        } else {
          uni.showToast({ title: result.msg, icon: 'none' })
        }
      } catch {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
  })
}

// 删除商品评价
const onDeleteGoodsReview = (review: Review) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条商品评价吗？删除后不可恢复。',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await deleteGoodsReviewAPI(review.id)
        if (result.code === '0') {
          goodsReviews.value = goodsReviews.value.filter((r) => r.id !== review.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
        } else {
          uni.showToast({ title: result.msg, icon: 'none' })
        }
      } catch {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
  })
}

// 跳转 UGC 详情
const onGoUgcDetail = (ugcId: string) => {
  uni.navigateTo({ url: `/pages/ugc-detail/ugc-detail?id=${ugcId}` })
}

// 跳转商品详情
const onGoGoods = (goodsId: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

// 预览评价图片
const onPreviewImage = (current: string, urls: string[]) => {
  uni.previewImage({ current, urls })
}

const goBack = () => uni.navigateBack()

onShow(() => {
  if (activeTab.value === 'ugc') {
    loadUgcComments()
  } else {
    loadGoodsReviews()
  }
})
</script>

<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="header" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">我的评价</text>
      <view class="header-placeholder"></view>
    </view>

    <!-- Tab 切换 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'ugc' }"
        @tap="switchTab('ugc')"
      >
        <text>分享评论</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'goods' }"
        @tap="switchTab('goods')"
      >
        <text>商品评价</text>
      </view>
    </view>

    <scroll-view scroll-y class="content" enable-back-to-top>
      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- UGC 评论列表 -->
      <template v-else-if="activeTab === 'ugc'">
        <view v-if="comments.length === 0" class="empty-state">
          <text class="empty-icon">💬</text>
          <text class="empty-text">暂无评价记录</text>
          <text class="empty-hint">在分享详情中发表评论后，会在这里显示</text>
        </view>
        <view v-else class="comment-list">
          <view v-for="item in comments" :key="item.id" class="comment-card">
            <view class="ugc-info" @tap="onGoUgcDetail(item.ugcId)">
              <image
                v-if="item.ugcGoodsImage"
                class="ugc-thumb"
                :src="item.ugcGoodsImage"
                mode="aspectFill"
              />
              <view class="ugc-meta">
                <text class="ugc-title">{{ item.ugcTitle || '分享内容' }}</text>
                <text class="ugc-link">查看分享详情 →</text>
              </view>
            </view>
            <view class="comment-body">
              <view class="comment-top">
                <view class="comment-avatar">
                  <text class="avatar-text">{{ item.userName.charAt(0) }}</text>
                </view>
                <view class="comment-info">
                  <text class="comment-user">{{ item.userName }}</text>
                  <text class="comment-time">{{ formatTime(item.createdAt) }}</text>
                </view>
                <view class="comment-delete-btn" @tap="onDeleteUgc(item)">
                  <text>删除</text>
                </view>
              </view>
              <text class="comment-content-text">{{ item.content }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 商品评价列表 -->
      <template v-else>
        <view v-if="goodsReviews.length === 0" class="empty-state">
          <text class="empty-icon">⭐</text>
          <text class="empty-text">暂无商品评价</text>
          <text class="empty-hint">在订单完成后评价商品，会在这里显示</text>
        </view>
        <view v-else class="comment-list">
          <view v-for="review in goodsReviews" :key="review.id" class="comment-card">
            <!-- 关联商品信息 -->
            <view v-if="review.goodsInfo" class="goods-info" @tap="onGoGoods(review.goodsId)">
              <image class="goods-thumb" :src="review.goodsInfo.image" mode="aspectFill" />
              <view class="goods-meta">
                <text class="goods-name">{{ review.goodsInfo.name }}</text>
                <text class="goods-link">查看商品 →</text>
              </view>
            </view>
            <!-- 评价内容 -->
            <view class="comment-body">
              <view class="comment-top">
                <image class="comment-avatar-img" :src="review.avatar" mode="aspectFill" />
                <view class="comment-info">
                  <text class="comment-user">{{ review.userName }}</text>
                  <view class="review-rating">
                    <text v-for="i in 5" :key="i" class="star" :class="{ active: i <= review.rating }">★</text>
                  </view>
                </view>
                <text class="comment-time">{{ formatTime(review.createdAt) }}</text>
              </view>
              <text class="comment-content-text">{{ review.content }}</text>
              <view v-if="review.images.length > 0" class="review-images">
                <image
                  v-for="(img, idx) in review.images"
                  :key="idx"
                  class="review-image"
                  :src="img"
                  mode="aspectFill"
                  @tap="onPreviewImage(img, review.images)"
                />
              </view>
              <view class="comment-actions">
                <view class="comment-delete-btn" @tap="onDeleteGoodsReview(review)">
                  <text>删除评价</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </template>

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
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx 20rpx;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);

  .header-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .back-icon {
      font-size: 40rpx;
      color: #fff;
    }
  }

  .header-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #fff;
  }

  .header-placeholder {
    width: 60rpx;
  }
}

/* Tab */
.tabs {
  display: flex;
  background: #fff;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;

  &.active {
    color: #0066cc;
    font-weight: bold;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 6rpx;
      background: #0066cc;
      border-radius: 3rpx;
    }
  }
}

/* 内容区 */
.content {
  flex: 1;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;

  .loading-text {
    font-size: 28rpx;
    color: #999;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 30rpx;
    color: #666;
    margin-bottom: 12rpx;
  }

  .empty-hint {
    font-size: 24rpx;
    color: #bbb;
  }
}

/* 卡片列表 */
.comment-list {
  padding: 20rpx;
}

.comment-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 关联 UGC 信息 */
.ugc-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-bottom: 1rpx solid #f0f0f0;

  &:active {
    background: #f0f4f8;
  }

  .ugc-thumb {
    width: 80rpx;
    height: 80rpx;
    border-radius: 10rpx;
    flex-shrink: 0;
  }

  .ugc-meta {
    flex: 1;
    margin-left: 16rpx;
    overflow: hidden;
  }

  .ugc-title {
    font-size: 26rpx;
    color: #555;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .ugc-link {
    font-size: 22rpx;
    color: #0066cc;
    margin-top: 6rpx;
  }
}

/* 关联商品信息 */
.goods-info {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-bottom: 1rpx solid #f0f0f0;

  &:active {
    background: #f0f4f8;
  }

  .goods-thumb {
    width: 80rpx;
    height: 80rpx;
    border-radius: 10rpx;
    flex-shrink: 0;
  }

  .goods-meta {
    flex: 1;
    margin-left: 16rpx;
    overflow: hidden;
  }

  .goods-name {
    font-size: 26rpx;
    color: #555;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .goods-link {
    font-size: 22rpx;
    color: #0066cc;
    margin-top: 6rpx;
  }
}

/* 评论内容 */
.comment-body {
  padding: 20rpx;
}

.comment-top {
  display: flex;
  align-items: center;
}

.comment-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .avatar-text {
    font-size: 24rpx;
    color: #fff;
    font-weight: bold;
  }
}

.comment-avatar-img {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-info {
  flex: 1;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 4rpx;

  .comment-user {
    font-size: 26rpx;
    font-weight: 600;
    color: #333;
  }
}

.review-rating {
  display: flex;
  gap: 2rpx;

  .star {
    font-size: 22rpx;
    color: #dfe6e9;

    &.active {
      color: #ffa502;
    }
  }
}

.comment-time {
  font-size: 22rpx;
  color: #aaa;
}

.comment-delete-btn {
  flex-shrink: 0;
  padding: 8rpx 20rpx;
  background: #fff0f0;
  border-radius: 8rpx;

  text {
    font-size: 24rpx;
    color: #ff6b6b;
  }

  &:active {
    opacity: 0.6;
  }
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16rpx;
}

.comment-content-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-top: 16rpx;
  display: block;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;

  .review-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 8rpx;
  }
}

.bottom-space {
  height: 60rpx;
}
</style>
