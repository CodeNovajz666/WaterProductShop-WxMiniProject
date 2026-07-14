<script setup lang="ts">
import type { UgcContent } from '@/types/seafood'
import type { UgcComment } from '@/services/seafood'
import { getUgcContentByIdAPI, getUgcCommentsAPI, postUgcCommentAPI, postUgcLikeAPI, postUgcCollectAPI, postUgcViewAPI, deleteUgcCommentAPI } from '@/services/seafood'
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { ref, reactive } from 'vue'
import { getSafeAreaInsets } from '@/utils/system'
import { COUPON_CODES, ANONYMOUS_USERNAME } from '@/config/constants'
import { useMemberStore } from '@/stores'

const safeAreaInsets = getSafeAreaInsets()
const memberStore = useMemberStore()

const ugcId = ref('')
const ugcItem = ref<UgcContent>()
const showShareModal = ref(false)
const receivedCoupon = ref<string>('')
const comments = ref<UgcComment[]>([])
const commentInput = ref('')
const isLiked = ref(false)
const isCollected = ref(false)
const viewCount = ref(0)
// 加载状态
const loading = ref(false)
// 视频播放状态
const videoPlaying = ref(false)
// 微信朋友圈分享需要基础库 2.11.3+
const canShareTimeline = ref(true)

// 企业方提供的分销分享码，对应 couponCodes 中的 "001"（95折优惠）
// 分享者分享后，接收者打开链接即可自动获得此优惠码
const SHARE_COUPON_CODE = COUPON_CODES.SHARE

onLoad(async (options) => {
  ugcId.value = options?.id || ''

  // 先加载 UGC 详情并立即渲染（不等待评论，加快首屏渲染）
  loading.value = true
  try {
    const detailRes = await getUgcContentByIdAPI(ugcId.value)
    ugcItem.value = detailRes.result
    // 从详情中读取点赞和收藏状态
    isLiked.value = detailRes.result._liked || false
    isCollected.value = detailRes.result._collected || false
  } finally {
    loading.value = false
  }

  // 增加浏览量（持久化）
  postUgcViewAPI(ugcId.value).then(res => {
    viewCount.value = res.result.views
  })

  // 评论列表异步加载，不阻塞详情渲染
  getUgcCommentsAPI(ugcId.value).then(res => {
    comments.value = res.result
    // 同步评论数
    if (ugcItem.value) {
      ugcItem.value.comments = res.result.length
    }
  })

  if (options?.couponCode) {
    receivedCoupon.value = options.couponCode
    uni.setStorageSync('user_coupon', options.couponCode)
    uni.showModal({
      title: '🎉 恭喜获得优惠码',
      content: `您获得了专属优惠码：${options.couponCode}\n\n使用方法：\n1. 点击下方商品卡片进入商品详情\n2. 优惠码将自动填充并享受95折优惠\n3. 没有优惠码的用户按原价购买`,
      showCancel: false
    })
  }
})

const toggleLike = async () => {
  if (!ugcItem.value) return
  try {
    const res = await postUgcLikeAPI(ugcId.value)
    isLiked.value = res.result.liked
    ugcItem.value.likes = res.result.likes
    if (res.result.liked) {
      uni.showToast({ title: '点赞成功', icon: 'none', duration: 1000 })
    }
  } catch {
    // 前端降级
    isLiked.value = !isLiked.value
    ugcItem.value.likes += isLiked.value ? 1 : -1
  }
}

const toggleCollect = async () => {
  try {
    const res = await postUgcCollectAPI(ugcId.value)
    isCollected.value = res.result.collected
    uni.showToast({ 
      title: res.result.collected ? '收藏成功' : '已取消收藏', 
      icon: 'none', 
      duration: 1000 
    })
  } catch {
    isCollected.value = !isCollected.value
  }
}

const submitComment = async () => {
  const content = commentInput.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }

  try {
    const res = await postUgcCommentAPI(ugcId.value, { content })
    comments.value.push(res.result)
    // 用实际评论列表长度更新评论数
    if (ugcItem.value) {
      ugcItem.value.comments = comments.value.length
    }
  } catch {
    // 前端降级
    comments.value.push({
      id: Date.now().toString(),
      ugcId: ugcId.value,
      userName: memberStore?.profile?.nickname || ANONYMOUS_USERNAME,
      content: content,
      createdAt: '刚刚'
    })
    if (ugcItem.value) {
      ugcItem.value.comments = comments.value.length
    }
  }

  commentInput.value = ''
  uni.showToast({ title: '评论成功', icon: 'success' })
}

onShareAppMessage(() => {
  const hasVideo = ugcItem.value?.video
  return {
    title: hasVideo 
      ? `${ugcItem.value?.userName}的视频分享：${ugcItem.value?.goodsName}`
      : `${ugcItem.value?.userName}分享了${ugcItem.value?.goodsName}`,
    path: `/pages/ugc-detail/ugc-detail?id=${ugcId.value}&couponCode=${SHARE_COUPON_CODE}`,
    imageUrl: ugcItem.value?.videoCover || ugcItem.value?.goodsImage || '',
  }
})

onShareTimeline(() => {
  return {
    title: `${ugcItem.value?.userName}分享了${ugcItem.value?.goodsName}`,
    query: `id=${ugcId.value}&couponCode=${SHARE_COUPON_CODE}`,
    imageUrl: ugcItem.value?.videoCover || ugcItem.value?.goodsImage || '',
  }
})

const onTapImage = (url: string) => {
  uni.previewImage({
    current: url,
    urls: ugcItem.value?.images || [],
  })
}

const goGoods = () => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${ugcItem.value?.goodsId}` })
}

// 返回上一页
const goBack = () => uni.navigateBack()

const openShareModal = () => {
  showShareModal.value = true
}

const closeShareModal = () => {
  showShareModal.value = false
}

const onVideoError = () => {
  uni.showToast({ title: '视频加载失败', icon: 'none' })
  videoPlaying.value = false
}

const onDeleteComment = (commentId: string) => {
  uni.showModal({
    title: '提示',
    content: '确定删除这条评论吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const result = await deleteUgcCommentAPI(ugcId.value, commentId)
        if (result.code === '0') {
          // 从列表中移除
          comments.value = comments.value.filter((c) => c.id !== commentId)
          // 更新评论数
          if (ugcItem.value) {
            ugcItem.value.comments = comments.value.length
          }
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
</script>

<template>
  <view class="ugc-detail-page">
    <view class="detail-header">
      <view class="header-left" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">分享详情</text>
      <view class="header-right" @tap="openShareModal">
        <text class="share-icon">⋯</text>
      </view>
    </view>

    <scroll-view enable-back-to-top scroll-y class="detail-scroll">
      <view class="ugc-card">
        <view class="ugc-header">
          <image class="ugc-avatar" :src="ugcItem?.avatar" mode="aspectFill" />
          <view class="ugc-user-info">
            <text class="ugc-username">{{ ugcItem?.userName }}</text>
            <text class="ugc-time">{{ ugcItem?.createdAt }} · {{ viewCount }}次浏览</text>
          </view>
          <view class="header-actions">
            <view class="action-btn" @tap="toggleCollect">
              <text class="action-icon" :class="{ collected: isCollected }">⭐</text>
            </view>
            <view class="share-btn" @tap="openShareModal">
              <text class="share-text">分享</text>
            </view>
          </view>
        </view>

        <text class="ugc-content">{{ ugcItem?.content }}</text>

        <!-- 视频展示 -->
        <view class="ugc-video" v-if="ugcItem?.video">
          <video
            v-if="videoPlaying"
            class="ugc-video-player"
            :src="ugcItem.video"
            controls
            autoplay
            object-fit="cover"
            @error="onVideoError"
          />
          <view v-else class="ugc-video-cover" @tap="videoPlaying = true">
            <image v-if="ugcItem.videoCover" class="video-cover-img" :src="ugcItem.videoCover" mode="aspectFill" />
            <view v-else class="video-cover-bg">
              <text class="cover-placeholder-icon">📹</text>
            </view>
            <view class="video-play-btn">
              <text class="play-icon">▶</text>
            </view>
            <view class="video-duration">点击播放</view>
          </view>
        </view>

        <view class="ugc-images" v-if="ugcItem?.images.length">
          <image
            v-for="(img, idx) in ugcItem?.images"
            :key="idx"
            class="ugc-image"
            :src="img"
            mode="aspectFill"
            @tap="onTapImage(img)"
          />
        </view>

        <view class="ugc-actions">
          <view class="action-item" @tap="toggleLike">
            <text class="action-icon" :class="{ liked: isLiked }">❤️</text>
            <text class="action-text">{{ ugcItem?.likes }}</text>
          </view>
          <view class="action-item">
            <text class="action-icon">💬</text>
            <text class="action-text">{{ ugcItem?.comments }}</text>
          </view>
          <view class="action-item" @tap="openShareModal">
            <text class="action-icon">🔗</text>
            <text class="action-text">分享</text>
          </view>
        </view>

        <view class="divider"></view>

        <view class="comments-section">
          <view class="comments-header">
            <text class="comments-title">评论 ({{ ugcItem?.comments }})</text>
          </view>
          <view class="comments-list">
            <view v-for="comment in comments" :key="comment.id" class="comment-item">
              <view class="comment-avatar">
                <text class="avatar-text">{{ comment.userName.charAt(0) }}</text>
              </view>
              <view class="comment-content">
                <view class="comment-header">
                  <text class="comment-user">{{ comment.userName }}</text>
                  <text class="comment-time">{{ comment.createdAt }}</text>
                </view>
                <text class="comment-text">{{ comment.content }}</text>
              </view>
              <view
                v-if="comment.userId && !comment.id.startsWith('mock_')"
                class="comment-delete"
                @tap="onDeleteComment(comment.id)"
              >
                <text>删除</text>
              </view>
            </view>
          </view>
          <view class="comment-input-box">
            <input
              v-model="commentInput"
              class="comment-input"
              placeholder="发表你的评论..."
              @confirm="submitComment"
            />
            <view class="comment-submit" @tap="submitComment">
              <text>发送</text>
            </view>
          </view>
        </view>

        <view class="divider"></view>

        <view class="related-goods" @tap="goGoods">
          <image class="goods-image" :src="ugcItem?.goodsImage" mode="aspectFill" />
          <view class="goods-info">
            <text class="goods-name">{{ ugcItem?.goodsName }}</text>
            <text class="goods-hint">点击查看商品 →</text>
          </view>
        </view>
      </view>

      <view class="share-bonus">
        <view class="bonus-icon">🎁</view>
        <view class="bonus-content">
          <text class="bonus-title">分享奖励</text>
          <text class="bonus-desc">分享给好友，好友打开即可获得专属优惠码</text>
        </view>
        <view class="bonus-btn" @tap="openShareModal">
          <text>立即分享</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <view class="share-modal" v-if="showShareModal" @tap="closeShareModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-title">选择分享方式</view>
        <view class="share-options">
          <button class="share-option" open-type="share">
            <view class="option-icon">💬</view>
            <text class="option-text">微信好友</text>
          </button>
          <button class="share-option" open-type="shareTimeline" v-if="canShareTimeline">
            <view class="option-icon">📱</view>
            <text class="option-text">朋友圈</text>
          </button>
        </view>
        <view class="share-tip">
          <text>分享给好友，好友打开即可获得专属优惠码</text>
        </view>
        <view class="modal-cancel" @tap="closeShareModal">
          <text>取消</text>
        </view>
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
.ugc-detail-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 30rpx 24rpx;
  background: linear-gradient(135deg, #ff6699 0%, #ff88aa 100%);
}

.header-left,
.header-right {
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

.share-icon {
  font-size: 36rpx;
  color: #fff;
}

.detail-scroll {
  flex: 1;
  padding: 24rpx;
}

.ugc-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.ugc-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.ugc-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 4rpx solid #ffccdd;
}

.ugc-user-info {
  flex: 1;
  margin-left: 20rpx;
}

.ugc-username {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.ugc-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;

  .action-icon {
    font-size: 28rpx;

    &.collected {
      color: #ffd700;
    }
  }
}

.share-btn {
  padding: 12rpx 24rpx;
  background: rgba(255, 102, 153, 0.1);
  border-radius: 24rpx;
}

.share-text {
  font-size: 26rpx;
  color: #ff6699;
  font-weight: 600;
}

.ugc-content {
  font-size: 32rpx;
  color: #333;
  line-height: 1.8;
  margin-bottom: 24rpx;
}

.ugc-video {
  width: 100%;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.ugc-video-player {
  width: 100%;
  height: 400rpx;
}

.ugc-video-cover {
  position: relative;
  width: 100%;
  height: 400rpx;
  background: #000;
}

.video-cover-img {
  width: 100%;
  height: 100%;
}

.video-cover-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}

.cover-placeholder-icon {
  font-size: 80rpx;
}

.video-play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100rpx;
  height: 100rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  .play-icon {
    font-size: 48rpx;
    color: #fff;
  }
}

.video-duration {
  position: absolute;
  bottom: 20rpx;
  right: 20rpx;
  padding: 6rpx 16rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #fff;
}

.ugc-images {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.ugc-image {
  width: calc(50% - 8rpx);
  height: 300rpx;
  border-radius: 16rpx;
}

.ugc-actions {
  display: flex;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 48rpx;
}

.action-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
  transition: all 0.2s ease;

  &.liked {
    color: #ff6b6b;
    transform: scale(1.2);
  }
}

.action-text {
  font-size: 28rpx;
  color: #666;
}

.comments-section {
  padding: 20rpx 0;
}

.comments-header {
  margin-bottom: 20rpx;
}

.comments-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.comment-item {
  display: flex;
  align-items: flex-start;
}

.comment-delete {
  flex-shrink: 0;
  padding: 8rpx 16rpx;

  text {
    font-size: 24rpx;
    color: #ff6b6b;
  }

  &:active {
    opacity: 0.6;
  }
}

.comment-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.comment-content {
  flex: 1;
  margin-left: 16rpx;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.comment-user {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.comment-time {
  font-size: 22rpx;
  color: #999;
}

.comment-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.comment-input-box {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.comment-input {
  flex: 1;
  height: 80rpx;
  padding: 0 24rpx;
  background: #f8f9fa;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.comment-submit {
  padding: 0 32rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6699 0%, #ff88aa 100%);
  border-radius: 40rpx;

  text {
    font-size: 28rpx;
    font-weight: bold;
    color: #fff;
  }
}

.divider {
  height: 20rpx;
  background: #f8f9fa;
  margin: 24rpx -30rpx;
}

.related-goods {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff0f3 0%, #ffe6eb 100%);
  border-radius: 16rpx;
  padding: 20rpx;
}

.goods-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
}

.goods-info {
  flex: 1;
  margin-left: 20rpx;
}

.goods-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.goods-hint {
  font-size: 26rpx;
  color: #ff6699;
  margin-top: 8rpx;
}

.share-bonus {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-top: 24rpx;
}

.bonus-icon {
  font-size: 56rpx;
  margin-right: 20rpx;
}

.bonus-content {
  flex: 1;
}

.bonus-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
}

.bonus-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
}

.bonus-btn {
  padding: 16rpx 32rpx;
  background: #fff;
  border-radius: 32rpx;

  text {
    font-size: 28rpx;
    font-weight: bold;
    color: #00b894;
  }
}

.bottom-space {
  height: 80rpx;
}

.share-modal {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 30rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.modal-title {
  text-align: center;
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.share-options {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30rpx;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  background: transparent;
  border: none;
  line-height: normal;

  &::after {
    border: none;
  }

  .option-icon {
    font-size: 56rpx;
    margin-bottom: 12rpx;
  }

  .option-text {
    font-size: 24rpx;
    color: #333;
  }
}

.share-tip {
  padding: 16rpx 24rpx;
  text-align: center;

  text {
    font-size: 22rpx;
    color: #999;
  }
}

.modal-cancel {
  text-align: center;
  padding: 20rpx;
  background: #f5f7fa;
  border-radius: 16rpx;

  text {
    font-size: 32rpx;
    color: #666;
  }
}
</style>