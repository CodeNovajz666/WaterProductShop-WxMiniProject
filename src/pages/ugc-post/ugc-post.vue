<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSeafoodItemsAPI, postUgcContentAPI } from '@/services/seafood'
import type { SeafoodItem } from '@/types/seafood'
import { useMemberStore } from '@/stores'
import { getSafeAreaInsets } from '@/utils/system'
import { UGC_LIMITS } from '@/config/constants'

const safeAreaInsets = getSafeAreaInsets()
const memberStore = useMemberStore()

// 表单数据
const content = ref('')
const images = ref<string[]>([])
const video = ref('')
const videoCover = ref('')
const selectedGoods = ref<SeafoodItem | null>(null)
const submitting = ref(false)

// 商品列表
const goodsList = ref<SeafoodItem[]>([])
const showGoodsPicker = ref(false)
const loadingGoods = ref(false)

// 加载商品列表
const loadGoods = async () => {
  loadingGoods.value = true
  try {
    const res = await getSeafoodItemsAPI({ page: 1, pageSize: 50 })
    goodsList.value = res.result.items
  } catch {
    goodsList.value = []
  } finally {
    loadingGoods.value = false
  }
}

// 选择商品
const onSelectGoods = (goods: SeafoodItem) => {
  selectedGoods.value = goods
  showGoodsPicker.value = false
}

// 选择图片
const chooseImages = () => {
  const remaining = UGC_LIMITS.MAX_IMAGES - images.value.length
  if (remaining <= 0) {
    uni.showToast({ title: `最多上传${UGC_LIMITS.MAX_IMAGES}张图片`, icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remaining,
    success: (res) => {
      images.value.push(...res.tempFilePaths)
    },
  })
}

// 删除图片
const removeImage = (index: number) => {
  images.value.splice(index, 1)
}

// 预览图片
const previewImage = (current: string) => {
  uni.previewImage({ current, urls: images.value })
}

// 选择视频
const chooseVideo = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: UGC_LIMITS.MAX_VIDEO_DURATION,
    compressed: true,
    success: (res) => {
      video.value = res.tempFilePath
      // 如果有缩略图就用缩略图，否则用第一帧
      // 注：thumbTempFilePath 在小程序/App 运行时存在，但 uni-app 类型定义未声明，故做断言
      videoCover.value =
        (res as { thumbTempFilePath?: string }).thumbTempFilePath || ''
    },
  })
}

// 删除视频
const removeVideo = () => {
  video.value = ''
  videoCover.value = ''
}

// 字数统计
const contentLength = computed(() => content.value.length)
const maxLength = UGC_LIMITS.MAX_TEXT_LENGTH

// 提交发布
const onSubmit = async () => {
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入分享内容', icon: 'none' })
    return
  }
  if (!selectedGoods.value) {
    uni.showToast({ title: '请选择关联商品', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true

  try {
    await postUgcContentAPI({
      content: content.value.trim(),
      images: images.value,
      video: video.value || undefined,
      videoCover: videoCover.value || undefined,
      goodsId: selectedGoods.value.id,
    })
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch {
    uni.showToast({ title: '发布失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const goBack = () => uni.navigateBack()

onLoad(() => {
  loadGoods()
})
</script>

<template>
  <view class="ugc-post-page">
    <!-- 顶部导航 -->
    <view class="header" :style="{ paddingTop: safeAreaInsets!.top + 'px' }">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">发布分享</text>
      <view class="header-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll" enable-back-to-top>
      <!-- 未登录提示 -->
      <view v-if="!memberStore.profile" class="login-tip">
        <text class="tip-icon">💡</text>
        <text class="tip-text">登录后发布分享，好友可以看到你的推荐</text>
      </view>

      <!-- 用户信息 -->
      <view class="user-card" v-if="memberStore.profile">
        <image class="user-avatar" :src="memberStore.profile.avatar" mode="aspectFill" />
        <view class="user-info">
          <text class="user-name">{{ memberStore.profile.nickname || memberStore.profile.account }}</text>
          <text class="user-hint">分享你的海鲜美食体验</text>
        </view>
      </view>

      <!-- 内容输入区 -->
      <view class="form-section">
        <view class="section-label">
          <text class="label-text">分享内容</text>
          <text class="char-count">{{ contentLength }}/{{ maxLength }}</text>
        </view>
        <textarea
          v-model="content"
          class="content-input"
          placeholder="说说你的美食体验吧~ 比如：今天收到的大闸蟹超新鲜，蟹黄饱满，清蒸最香！"
          :maxlength="maxLength"
          auto-height
        />
      </view>

      <!-- 视频上传区 -->
      <view class="form-section">
        <view class="section-label">
          <text class="label-text">添加视频</text>
          <text class="video-hint">可选，时长不超过{{ UGC_LIMITS.MAX_VIDEO_DURATION }}秒</text>
        </view>
        <view v-if="video" class="video-preview">
          <view class="video-cover">
            <image v-if="videoCover" class="cover-img" :src="videoCover" mode="aspectFill" />
            <view v-else class="cover-placeholder">
              <text class="cover-icon">📹</text>
            </view>
            <view class="play-overlay">
              <text class="play-icon">▶</text>
            </view>
          </view>
          <view class="video-delete" @tap="removeVideo">
            <text>×</text>
          </view>
        </view>
        <view v-else class="video-add" @tap="chooseVideo">
          <text class="add-icon">+</text>
          <text class="add-text">添加视频</text>
        </view>
      </view>

      <!-- 图片上传区 -->
      <view class="form-section">
        <view class="section-label">
          <text class="label-text">添加图片</text>
          <text class="img-count">{{ images.length }}/{{ UGC_LIMITS.MAX_IMAGES }}</text>
        </view>
        <view v-if="video" class="image-video-tip">
          <text>已添加视频，图片最多{{ UGC_LIMITS.MAX_IMAGES }}张</text>
        </view>
        <view v-else class="image-grid">
          <view
            v-for="(img, idx) in images"
            :key="idx"
            class="image-item"
          >
            <image class="preview-img" :src="img" mode="aspectFill" @tap="previewImage(img)" />
            <view class="image-delete" @tap.stop="removeImage(idx)">
              <text>×</text>
            </view>
          </view>
          <view v-if="images.length < UGC_LIMITS.MAX_IMAGES" class="image-add" @tap="chooseImages">
            <text class="add-icon">+</text>
            <text class="add-text">添加图片</text>
          </view>
        </view>
      </view>

      <!-- 关联商品 -->
      <view class="form-section">
        <view class="section-label">
          <text class="label-text">关联商品</text>
          <text class="label-required">*</text>
        </view>
        <view v-if="selectedGoods" class="selected-goods">
          <image class="goods-img" :src="selectedGoods.image" mode="aspectFill" />
          <view class="goods-info">
            <text class="goods-name">{{ selectedGoods.name }}</text>
            <text class="goods-price">¥{{ selectedGoods.price }}</text>
          </view>
          <view class="goods-change" @tap="showGoodsPicker = true">
            <text>更换</text>
          </view>
        </view>
        <view v-else class="goods-select-btn" @tap="showGoodsPicker = true">
          <text class="select-icon">📦</text>
          <text class="select-text">点击选择要推荐的商品</text>
        </view>
      </view>

      <!-- 发布按钮 -->
      <view class="submit-section">
        <view
          class="submit-btn"
          :class="{ disabled: submitting || !content.trim() || !selectedGoods }"
          @tap="onSubmit"
        >
          <text>{{ submitting ? '发布中...' : '发布分享' }}</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 商品选择弹窗 -->
    <view v-if="showGoodsPicker" class="modal-overlay" @tap="showGoodsPicker = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">选择商品</text>
          <view class="modal-close" @tap="showGoodsPicker = false">
            <text>×</text>
          </view>
        </view>
        <scroll-view scroll-y class="goods-scroll">
          <view v-if="loadingGoods" class="loading-state">
            <text>加载中...</text>
          </view>
          <view v-else-if="goodsList.length === 0" class="loading-state">
            <text>暂无商品</text>
          </view>
          <view v-else class="goods-list">
            <view
              v-for="item in goodsList"
              :key="item.id"
              class="goods-item"
              :class="{ active: selectedGoods?.id === item.id }"
              @tap="onSelectGoods(item)"
            >
              <image class="item-img" :src="item.image" mode="aspectFill" />
              <view class="item-info">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-price">¥{{ item.price }}</text>
              </view>
              <text v-if="selectedGoods?.id === item.id" class="item-check">✓</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f5f7fa;
}
</style>

<style lang="scss" scoped>
.ugc-post-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx 24rpx;
  background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%);
}

.header-back,
.header-placeholder {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 40rpx;
  color: #fff;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.content-scroll {
  flex: 1;
  padding: 24rpx;
}

.login-tip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background: #fff8e6;
  border-radius: 12rpx;
  margin-bottom: 20rpx;

  .tip-icon {
    font-size: 32rpx;
  }

  .tip-text {
    font-size: 26rpx;
    color: #b8860b;
  }
}

.user-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.user-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #eee;
}

.user-info {
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.user-hint {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

.form-section {
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .label-text {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
  }

  .label-required {
    color: #ff4444;
    font-size: 28rpx;
    margin-left: 4rpx;
  }

  .char-count,
  .img-count {
    font-size: 24rpx;
    color: #999;
  }
}

.content-input {
  width: 100%;
  min-height: 200rpx;
  padding: 16rpx 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 1.6;
  box-sizing: border-box;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    color: #fff;
    font-size: 28rpx;
  }
}

.image-add {
  width: 200rpx;
  height: 200rpx;
  background: #f0f4f8;
  border: 2rpx dashed #c0d0e0;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 56rpx;
  color: #b0c4d8;
}

.add-text {
  font-size: 22rpx;
  color: #99aabb;
  margin-top: 8rpx;
}

.image-video-tip {
  padding: 32rpx 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 26rpx;
    color: #999;
  }
}

.video-hint {
  font-size: 22rpx;
  color: #999;
}

.video-preview {
  position: relative;
  width: 100%;
  height: 360rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #000;
}

.video-cover {
  width: 100%;
  height: 100%;
  position: relative;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;

  .cover-icon {
    font-size: 80rpx;
  }
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);

  .play-icon {
    font-size: 80rpx;
    color: #fff;
  }
}

.video-delete {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    color: #fff;
    font-size: 32rpx;
  }
}

.video-add {
  width: 100%;
  height: 200rpx;
  background: #f0f4f8;
  border: 2rpx dashed #c0d0e0;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .add-icon {
    font-size: 56rpx;
    color: #b0c4d8;
  }

  .add-text {
    font-size: 26rpx;
    color: #99aabb;
    margin-top: 8rpx;
  }
}

.selected-goods {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #f0f9ff;
  border-radius: 12rpx;
  border: 1rpx solid #d6e8ff;
}

.goods-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.goods-info {
  flex: 1;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
}

.goods-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.goods-price {
  font-size: 30rpx;
  font-weight: bold;
  color: #ff4444;
  margin-top: 6rpx;
}

.goods-change {
  padding: 12rpx 24rpx;
  background: #0066cc;
  border-radius: 24rpx;

  text {
    font-size: 24rpx;
    color: #fff;
  }
}

.goods-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 40rpx;
  background: #f8f9fa;
  border: 2rpx dashed #d0d0d0;
  border-radius: 12rpx;

  .select-icon {
    font-size: 40rpx;
  }

  .select-text {
    font-size: 28rpx;
    color: #999;
  }
}

.submit-section {
  padding: 0 24rpx;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 102, 204, 0.3);

  text {
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
  }

  &.disabled {
    background: #ccc;
    box-shadow: none;
  }

  &:active {
    transform: scale(0.98);
  }
}

.bottom-space {
  height: 80rpx;
}

/* 商品选择弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  max-height: 75vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 40rpx;
    color: #999;
  }
}

.goods-scroll {
  max-height: 60vh;
  padding: 20rpx;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;

  text {
    font-size: 28rpx;
    color: #999;
  }
}

.goods-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.goods-item {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid transparent;

  &.active {
    border-color: #0066cc;
    background: #f0f9ff;
  }
}

.item-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.item-price {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff4444;
  margin-top: 6rpx;
}

.item-check {
  font-size: 36rpx;
  color: #0066cc;
  margin-right: 12rpx;
}
</style>
