<script setup lang="ts">
import type { Order } from '@/types/order'
import type { SeafoodItem } from '@/types/seafood'
import { getMemberOrderByIdAPI, putMemberOrderStatusAPI } from '@/services/order'
import { postGoodsReviewAPI, checkOrderReviewedAPI, getSeafoodItemByIdAPI } from '@/services/seafood'
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

const orderId = ref('')
const order = ref<Order | null>(null)
const goodsList = ref<SeafoodItem[]>([])
const loading = ref(true)
const submitting = ref(false)

// 评分（每个商品一个评分，简化为统一评分）
const rating = ref(5)
// 评价内容
const content = ref('')
// 已选图片
const images = ref<string[]>([])
// 是否已评价
const alreadyReviewed = ref(false)

// 评分文案
const ratingTexts = ['', '非常差', '差', '一般', '好', '非常好']
const ratingText = computed(() => ratingTexts[rating.value] || '')

// 星星列表
const stars = [1, 2, 3, 4, 5]

// 加载订单和商品信息
const loadData = async () => {
  loading.value = true
  try {
    // 获取订单
    const orderRes = await getMemberOrderByIdAPI(orderId.value)
    if (!orderRes.result) {
      uni.showToast({ title: '订单不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1000)
      return
    }
    order.value = orderRes.result

    // 校验订单状态（仅待评价状态可评价）
    if (order.value.status !== 4) {
      uni.showToast({ title: '当前订单状态不可评价', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1000)
      return
    }

    // 检查是否已评价
    const reviewedRes = await checkOrderReviewedAPI(order.value.id)
    alreadyReviewed.value = reviewedRes.result.reviewed
    if (alreadyReviewed.value) {
      uni.showToast({ title: '该订单已评价', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1000)
      return
    }

    // 并行加载所有商品详情
    const goodsPromises = order.value.items.map((item) => getSeafoodItemByIdAPI(item.goodsId))
    const goodsResults = await Promise.all(goodsPromises)
    goodsList.value = goodsResults
      .map((r) => r.result)
      .filter((g): g is SeafoodItem => !!g)
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 选择评分
const onRatingChange = (value: number) => {
  rating.value = value
}

// 选择图片
const onChooseImages = () => {
  const remaining = 6 - images.value.length
  if (remaining <= 0) {
    uni.showToast({ title: '最多上传6张图片', icon: 'none' })
    return
  }
  uni.chooseMedia({
    count: remaining,
    mediaType: ['image'],
    sizeType: ['compressed'],
    success: (res) => {
      const newImages = res.tempFiles.map((f) => f.tempFilePath)
      images.value = [...images.value, ...newImages]
    },
    fail: (err) => {
      if (err.errMsg?.includes('cancel')) return
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    },
  })
}

// 删除图片
const onDeleteImage = (index: number) => {
  images.value.splice(index, 1)
}

// 预览图片
const onPreviewImage = (current: string) => {
  uni.previewImage({
    current,
    urls: images.value,
  })
}

// 提交评价
const onSubmit = async () => {
  if (!content.value.trim()) {
    uni.showToast({ title: '请填写评价内容', icon: 'none' })
    return
  }
  if (content.value.trim().length < 5) {
    uni.showToast({ title: '评价内容至少5个字', icon: 'none' })
    return
  }
  if (!order.value || goodsList.value.length === 0) {
    uni.showToast({ title: '订单信息异常', icon: 'none' })
    return
  }

  submitting.value = true
  uni.showLoading({ title: '提交中...' })

  try {
    // 对订单中每个商品提交评价（统一评分和内容）
    const reviewPromises = goodsList.value.map((goods) =>
      postGoodsReviewAPI({
        goodsId: goods.id,
        orderId: order.value!.id,
        rating: rating.value,
        content: content.value.trim(),
        images: images.value,
      }),
    )
    const results = await Promise.all(reviewPromises)

    // 检查是否有失败
    const failed = results.find((r) => r.code !== '0')
    if (failed) {
      uni.hideLoading()
      uni.showToast({ title: failed.msg, icon: 'none' })
      return
    }

    // 更新订单状态为已完成
    await putMemberOrderStatusAPI(order.value.id, { status: 5 })

    uni.hideLoading()
    uni.showToast({ title: '评价成功', icon: 'success', duration: 800 })
    setTimeout(() => {
      submitting.value = false
      uni.redirectTo({ url: `/pages/order-detail/order-detail?id=${order.value!.id}` })
    }, 800)
  } catch {
    uni.hideLoading()
    submitting.value = false
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  }
}

const goBack = () => uni.navigateBack()

onLoad((options) => {
  orderId.value = options?.orderId || ''
  loadData()
})
</script>

<template>
  <view class="page" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">发表评价</text>
      <view class="header-right"></view>
    </view>

    <scroll-view v-if="!loading && order" scroll-y class="content-scroll">
      <!-- 商品列表 -->
      <view class="section goods-section">
        <view class="section-header">
          <text class="section-title">评价商品</text>
          <text class="goods-count">共{{ goodsList.length }}件</text>
        </view>
        <view v-for="goods in goodsList" :key="goods.id" class="goods-item">
          <image class="goods-image" :src="goods.image" mode="aspectFill" lazy-load />
          <view class="goods-info">
            <text class="goods-name">{{ goods.name }}</text>
            <text class="goods-price">¥{{ goods.price.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- 评分 -->
      <view class="section rating-section">
        <text class="section-title">整体评分</text>
        <view class="rating-stars">
          <view
            v-for="star in stars"
            :key="star"
            class="star"
            :class="{ active: star <= rating }"
            @tap="onRatingChange(star)"
          >
            <text class="star-icon">{{ star <= rating ? '★' : '☆' }}</text>
          </view>
          <text class="rating-text">{{ ratingText }}</text>
        </view>
      </view>

      <!-- 评价内容 -->
      <view class="section content-section">
        <text class="section-title">评价内容</text>
        <textarea
          class="content-input"
          v-model="content"
          placeholder="分享您的真实体验，帮助其他用户做出更好的选择（至少5个字）"
          :maxlength="500"
          :auto-height="true"
          :show-confirm-bar="false"
          :adjust-position="true"
        />
        <view class="content-counter">
          <text>{{ content.length }}/500</text>
        </view>
      </view>

      <!-- 上传图片 -->
      <view class="section images-section">
        <text class="section-title">上传图片（可选）</text>
        <view class="images-list">
          <view v-for="(img, idx) in images" :key="idx" class="image-item">
            <image class="preview-image" :src="img" mode="aspectFill" @tap="onPreviewImage(img)" />
            <view class="image-delete" @tap="onDeleteImage(idx)">
              <text>×</text>
            </view>
          </view>
          <view v-if="images.length < 6" class="image-add" @tap="onChooseImages">
            <text class="add-icon">+</text>
            <text class="add-text">{{ images.length }}/6</text>
          </view>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 加载中 -->
    <view v-else-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 底部提交按钮 -->
    <view v-if="!loading && order && !alreadyReviewed" class="action-bar" :style="{ paddingBottom: safeAreaInsets.bottom + 'px' }">
      <view
        class="action-btn primary"
        :class="{ disabled: submitting || !content.trim() }"
        @tap="onSubmit"
      >
        <text>{{ submitting ? '提交中...' : '发布评价' }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background: #f5f7fa;
}
</style>

<style lang="scss" scoped>
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx 24rpx;

  .header-back, .header-right {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-icon {
    font-size: 40rpx;
    color: #2d3436;
  }

  .header-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #2d3436;
  }
}

.content-scroll {
  flex: 1;
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

/* 通用 section */
.section {
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: bold;
    color: #2d3436;
  }

  .goods-count {
    font-size: 26rpx;
    color: #999;
  }
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #2d3436;
  display: block;
  margin-bottom: 20rpx;
}

/* 商品列表 */
.goods-item {
  display: flex;
  padding: 16rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx dashed #f0f0f0;
  }

  .goods-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 10rpx;
    flex-shrink: 0;
  }

  .goods-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .goods-name {
    font-size: 28rpx;
    color: #2d3436;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .goods-price {
    font-size: 28rpx;
    color: #ff6b6b;
    font-weight: bold;
    margin-top: 8rpx;
  }
}

/* 评分 */
.rating-stars {
  display: flex;
  align-items: center;
  gap: 12rpx;

  .star {
    padding: 8rpx;

    .star-icon {
      font-size: 48rpx;
      color: #dfe6e9;
    }

    &.active .star-icon {
      color: #fdcb6e;
    }

    &:active {
      transform: scale(0.9);
    }
  }

  .rating-text {
    margin-left: 16rpx;
    font-size: 28rpx;
    color: #636e72;
  }
}

/* 评价内容 */
.content-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #2d3436;
  background: #f8f9fa;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.content-counter {
  text-align: right;
  margin-top: 12rpx;

  text {
    font-size: 24rpx;
    color: #b2bec3;
  }
}

/* 图片上传 */
.images-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 180rpx;
  height: 180rpx;

  .preview-image {
    width: 100%;
    height: 100%;
    border-radius: 12rpx;
  }

  .image-delete {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
  }
}

.image-add {
  width: 180rpx;
  height: 180rpx;
  border: 2rpx dashed #dfe6e9;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;

  .add-icon {
    font-size: 48rpx;
    color: #b2bec3;
  }

  .add-text {
    font-size: 22rpx;
    color: #b2bec3;
  }

  &:active {
    opacity: 0.7;
  }
}

.bottom-space {
  height: 160rpx;
}

/* 底部操作栏 */
.action-bar {
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  padding: 24rpx 0;
  border-radius: 40rpx;
  text-align: center;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);

  text {
    font-size: 30rpx;
    font-weight: 500;
    color: #fff;
  }

  &.disabled {
    opacity: 0.5;
  }

  &:active:not(.disabled) {
    transform: scale(0.97);
  }
}
</style>
