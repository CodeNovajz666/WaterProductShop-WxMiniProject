<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { getUgcContentsAPI, postUgcLikeAPI, postUgcViewAPI } from '@/services/seafood'
import type { UgcContent } from '@/types/seafood'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

const ugcList = ref<UgcContent[]>([])
const currentIndex = ref(0)
const loading = ref(true)

// 视频上下文管理
let videoContexts: Record<number, any> = {}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUgcContentsAPI()
    ugcList.value = res.result
    // 等待渲染完成后初始化视频上下文
    await nextTick()
    initVideoContexts()
    // 播放第一个视频（如果第一个是视频）
    playCurrentVideo()
    // 增加浏览量
    if (ugcList.value.length > 0) {
      postUgcViewAPI(ugcList.value[0].id).catch(() => {})
    }
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 初始化所有视频的上下文
const initVideoContexts = () => {
  videoContexts = {}
  ugcList.value.forEach((item, index) => {
    if (item.video) {
      const ctx = uni.createVideoContext(`ugc-video-${index}`)
      if (ctx) {
        videoContexts[index] = ctx
      }
    }
  })
}

// 播放当前视频
const playCurrentVideo = () => {
  const currentItem = ugcList.value[currentIndex.value]
  if (currentItem?.video && videoContexts[currentIndex.value]) {
    videoContexts[currentIndex.value].play()
  }
}

// 停止所有视频
const stopAllVideos = () => {
  Object.values(videoContexts).forEach((ctx) => {
    try {
      ctx.pause()
    } catch {
      // ignore
    }
  })
}

// swiper 切换事件
const onSwiperChange = (e: any) => {
  const newIndex = e.detail.current
  // 停止之前的视频
  stopAllVideos()
  currentIndex.value = newIndex

  // 播放当前视频
  nextTick(() => {
    playCurrentVideo()
    // 增加浏览量
    const currentItem = ugcList.value[newIndex]
    if (currentItem) {
      postUgcViewAPI(currentItem.id).catch(() => {})
    }
  })
}

// 点赞
const onLike = async (item: UgcContent) => {
  try {
    const res = await postUgcLikeAPI(item.id)
    item._liked = res.result.liked
    item.likes = res.result.likes
    if (res.result.liked) {
      uni.showToast({ title: '点赞成功', icon: 'none', duration: 800 })
    }
  } catch {
    // 降级
    if (!item._liked) {
      item.likes++
      item._liked = true
    }
  }
}

// 视频播放错误
const onVideoError = () => {
  uni.showToast({ title: '视频加载失败', icon: 'none', duration: 800 })
}

// 跳转到分享详情
const onGoDetail = (item: UgcContent) => {
  uni.navigateTo({ url: `/pages/ugc-detail/ugc-detail?id=${item.id}` })
}

// 跳转到商品详情
const onGoGoods = (goodsId: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

// 发布分享
const onGoPost = () => {
  uni.navigateTo({ url: '/pages/ugc-post/ugc-post' })
}

const goBack = () => uni.navigateBack()

onLoad(() => {
  loadData()
})

onShow(() => {
  // 页面重新显示时播放当前视频
  nextTick(() => {
    playCurrentVideo()
  })
})

onHide(() => {
  // 页面隐藏时停止所有视频
  stopAllVideos()
})
</script>

<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="header" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">用户分享</text>
      <view class="header-post" @tap="onGoPost">
        <text>✏️ 发布</text>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 全屏视频/图文 swiper -->
    <swiper
      v-else
      class="feed-swiper"
      vertical
      :circular="false"
      :autoplay="false"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(item, index) in ugcList" :key="item.id">
        <view class="feed-item">
          <!-- 视频内容 -->
          <view v-if="item.video" class="video-container">
            <video
              :id="`ugc-video-${index}`"
              class="feed-video"
              :src="item.video"
              :poster="item.videoCover"
              :controls="false"
              :autoplay="false"
              :loop="true"
              :show-center-play-btn="false"
              :show-play-btn="false"
              :show-fullscreen-btn="false"
              :show-progress="false"
              :enable-progress-gesture="false"
              object-fit="cover"
              @error="onVideoError"
              @tap="onGoDetail(item)"
            />
            <!-- 渐变遮罩 -->
            <view class="video-mask"></view>
          </view>

          <!-- 图片内容 -->
          <view v-else class="image-container" @tap="onGoDetail(item)">
            <image
              v-if="item.images.length > 0"
              class="feed-image"
              :src="item.images[0]"
              mode="aspectFill"
            />
            <view class="video-mask"></view>
          </view>

          <!-- 底部信息（覆盖在视频/图片上） -->
          <view class="feed-info" :style="{ paddingBottom: 'calc(20rpx + env(safe-area-inset-bottom))' }">
            <!-- 用户信息 -->
            <view class="feed-user">
              <image class="user-avatar" :src="item.avatar" mode="aspectFill" />
              <text class="user-name">{{ item.userName }}</text>
            </view>

            <!-- 分享文字 -->
            <text class="feed-text">{{ item.content }}</text>

            <!-- 关联商品 -->
            <view v-if="item.goodsId" class="feed-goods" @tap.stop="onGoGoods(item.goodsId)">
              <image class="goods-thumb" :src="item.goodsImage" mode="aspectFill" />
              <view class="goods-info">
                <text class="goods-name">{{ item.goodsName }}</text>
                <text class="goods-buy">查看商品 →</text>
              </view>
            </view>

            <!-- 操作栏 -->
            <view class="feed-actions">
              <view class="action-item" @tap.stop="onLike(item)">
                <text class="action-icon" :class="{ liked: item._liked }">❤️</text>
                <text class="action-text">{{ item.likes }}</text>
              </view>
              <view class="action-item" @tap.stop="onGoDetail(item)">
                <text class="action-icon">💬</text>
                <text class="action-text">{{ item.comments }}</text>
              </view>
              <view class="action-item" @tap.stop="onGoDetail(item)">
                <text class="action-icon">📖</text>
                <text class="action-text">详情</text>
              </view>
            </view>

            <!-- 发布时间 -->
            <text class="feed-time">{{ item.createdAt }}</text>
          </view>

          <!-- 右侧操作侧边栏（类似抖音风格） -->
          <view class="side-bar" :style="{ bottom: 'calc(180rpx + env(safe-area-inset-bottom))' }">
            <view class="side-avatar">
              <image class="side-avatar-img" :src="item.avatar" mode="aspectFill" />
            </view>
            <view class="side-action" @tap.stop="onLike(item)">
              <text class="side-icon" :class="{ liked: item._liked }">❤️</text>
              <text class="side-count">{{ item.likes }}</text>
            </view>
            <view class="side-action" @tap.stop="onGoDetail(item)">
              <text class="side-icon">💬</text>
              <text class="side-count">{{ item.comments }}</text>
            </view>
            <view class="side-action" @tap.stop="onGoGoods(item.goodsId)" v-if="item.goodsId">
              <text class="side-icon">🛒</text>
              <text class="side-count">商品</text>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 底部提示 -->
    <view class="swipe-hint" v-if="!loading && ugcList.length > 1">
      <text>上下滑动切换</text>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #000;
}
</style>

<style lang="scss" scoped>
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
}

/* 顶部导航 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx 20rpx;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);

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
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
  }

  .header-post {
    padding: 8rpx 24rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 30rpx;
    backdrop-filter: blur(10px);

    text {
      font-size: 24rpx;
      color: #fff;
    }

    &:active {
      opacity: 0.7;
    }
  }
}

/* 加载状态 */
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 28rpx;
    color: #999;
  }
}

/* 全屏 swiper */
.feed-swiper {
  flex: 1;
  height: 100vh;
}

.feed-item {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 视频容器 */
.video-container {
  width: 100%;
  height: 100%;
}

.feed-video {
  width: 100%;
  height: 100%;
}

/* 图片容器 */
.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
}

.feed-image {
  width: 100%;
  height: 100%;
}

/* 渐变遮罩 */
.video-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  pointer-events: none;
}

/* 底部信息 */
.feed-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 160rpx;
  padding: 20rpx 24rpx;
  z-index: 10;
}

.feed-user {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;

  .user-avatar {
    width: 56rpx;
    height: 56rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.3);
  }

  .user-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #fff;
    margin-left: 12rpx;
  }
}

.feed-text {
  font-size: 28rpx;
  color: #fff;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16rpx;
}

/* 关联商品 */
.feed-goods {
  display: flex;
  align-items: center;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12rpx;
  backdrop-filter: blur(10px);
  margin-bottom: 16rpx;

  &:active {
    opacity: 0.8;
  }

  .goods-thumb {
    width: 64rpx;
    height: 64rpx;
    border-radius: 8rpx;
    flex-shrink: 0;
  }

  .goods-info {
    flex: 1;
    margin-left: 12rpx;
    overflow: hidden;
  }

  .goods-name {
    font-size: 24rpx;
    color: #fff;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .goods-buy {
    font-size: 22rpx;
    color: #ffdd57;
    margin-top: 4rpx;
  }
}

/* 操作栏 */
.feed-actions {
  display: flex;
  gap: 32rpx;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 6rpx;

  .action-icon {
    font-size: 32rpx;

    &.liked {
      filter: hue-rotate(0deg);
    }
  }

  .action-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.9);
  }

  &:active {
    opacity: 0.7;
  }
}

.feed-time {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 12rpx;
}

/* 右侧侧边栏 */
.side-bar {
  position: absolute;
  right: 16rpx;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36rpx;
}

.side-avatar {
  .side-avatar-img {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    border: 3rpx solid #fff;
  }
}

.side-action {
  display: flex;
  flex-direction: column;
  align-items: center;

  .side-icon {
    font-size: 48rpx;

    &.liked {
      filter: brightness(1.2);
    }
  }

  .side-count {
    font-size: 22rpx;
    color: #fff;
    margin-top: 6rpx;
  }

  &:active {
    transform: scale(0.9);
  }
}

/* 滑动提示 */
.swipe-hint {
  position: fixed;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  padding: 8rpx 24rpx;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 20rpx;

  text {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>
