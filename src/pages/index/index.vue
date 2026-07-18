<script setup lang="ts">
import { getSeafoodBannersAPI, getSeafoodItemsAPI, getUgcContentsAPI } from '@/services/seafood'
import type { SeafoodBanner, SeafoodItem, UgcContent } from '@/types/seafood'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref, nextTick, watch, computed } from 'vue'
import CustomNavibar from './components/CustomNavibar.vue'
import WaterProductSwiper from '@/components/WaterProductSwiper.vue'

const bannerList = ref<SeafoodBanner[]>([])
const getHomeBannerData = async () => {
  const res = await getSeafoodBannersAPI()
  bannerList.value = res.result
}

const ugcList = ref<UgcContent[]>([])
const getUgcData = async () => {
  const res = await getUgcContentsAPI()
  ugcList.value = res.result
}

const goodsList = ref<SeafoodItem[]>([])
const goodsPage = ref(1)
const goodsPageSize = 6
const goodsFinished = ref(false)
const goodsLoading = ref(false)

const getGoodsData = async (reset = false) => {
  if (goodsLoading.value) return
  if (reset) {
    goodsPage.value = 1
    goodsFinished.value = false
  }
  if (goodsFinished.value) return
  goodsLoading.value = true
  try {
    const res = await getSeafoodItemsAPI({ page: goodsPage.value, pageSize: goodsPageSize })
    if (reset) {
      goodsList.value = res.result.items
    } else {
      goodsList.value = [...goodsList.value, ...res.result.items]
    }
    if (res.result.items.length < goodsPageSize) {
      goodsFinished.value = true
    }
    goodsPage.value++
  } finally {
    goodsLoading.value = false
  }
}

const bannerLoading = ref(true)
const ugcLoading = ref(true)

const isLoading = computed(() => bannerLoading.value && ugcLoading.value && goodsLoading.value)

// ===== 滚动锚点逻辑 =====
const scrollIntoView = ref('')
const pendingScrollToGoods = ref(false)
const goodsSectionHighlight = ref(false)
// 下拉刷新状态：必须绑定到 refresher-triggered，否则刷新不会自动停止
const refresherTriggered = ref(false)

// 执行滚动到商品区域
const scrollToGoodsSection = () => {
  nextTick(() => {
    setTimeout(() => {
      scrollIntoView.value = 'goods-section'
      // 清空 scrollIntoView 以允许重复触发
      setTimeout(() => {
        scrollIntoView.value = ''
      }, 1000)
      // 高亮商品区域引导视觉
      goodsSectionHighlight.value = true
      setTimeout(() => {
        goodsSectionHighlight.value = false
      }, 2000)
    }, 300)
  })
}

// 监听商品列表加载完成（兼容延迟加载场景）
watch(goodsList, (newVal) => {
  if (pendingScrollToGoods.value && newVal.length > 0) {
    pendingScrollToGoods.value = false
    scrollToGoodsSection()
  }
})

// 页面加载：三组数据独立加载，谁快谁先渲染
onLoad(() => {
  // Banner 优先加载（数据量小，渲染快）
  getHomeBannerData().finally(() => { bannerLoading.value = false })
  // UGC 和商品并行但不互相阻塞
  getUgcData().finally(() => { ugcLoading.value = false })
  getGoodsData(true)
})

// 页面显示时检测是否需要滚动到商品区域
onShow(() => {
  const scrollToGoods = uni.getStorageSync('scroll_to_goods')
  if (scrollToGoods) {
    uni.removeStorageSync('scroll_to_goods')
    if (goodsList.value.length > 0) {
      // 商品已加载，直接滚动
      scrollToGoodsSection()
    } else {
      // 商品尚未加载完成，设置标志等待 watch 触发
      pendingScrollToGoods.value = true
    }
  }
})

const onRefresh = async () => {
  // 触发下拉刷新动画
  refresherTriggered.value = true
  bannerLoading.value = true
  ugcLoading.value = true
  try {
    await Promise.all([
      getHomeBannerData().finally(() => { bannerLoading.value = false }),
      getUgcData().finally(() => { ugcLoading.value = false }),
      getGoodsData(true),
    ])
  } catch (error) {
    console.error('首页数据刷新失败:', error)
  } finally {
    // 关键：数据加载完成后关闭刷新状态，否则会一直转
    refresherTriggered.value = false
  }
}

const formatSoldCount = (count: number) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toString()
}

const onChange = () => {}

const onLike = (item: UgcContent) => {
  if (!item._liked) {
    item.likes++
    item._liked = true
    uni.showToast({ title: '点赞成功', icon: 'none', duration: 1000 })
  }
}

const onShareUgc = (item: UgcContent) => {
  const shareCode = `SHARE${Date.now().toString(36).toUpperCase()}`
  uni.showModal({
    title: '分享奖励',
    content: '分享给好友，好友打开即可获得专属优惠码！',
    confirmText: '去分享',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: `/pages/ugc-detail/ugc-detail?id=${item.id}` })
      }
    }
  })
}

const onGoGoods = (goodsId: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

const onGoUgcDetail = (ugcId: string) => {
  uni.navigateTo({ url: `/pages/ugc-detail/ugc-detail?id=${ugcId}` })
}

const onGoUgcList = () => {
  uni.navigateTo({ url: '/pages/ugc-list/ugc-list' })
}

const onGoPostUgc = () => {
  uni.navigateTo({ url: '/pages/ugc-post/ugc-post' })
}
</script>

<template>
  <CustomNavibar />
  <scroll-view
    enable-back-to-top
    refresher-enabled
    :refresher-triggered="refresherTriggered"
    @refresherrefresh="onRefresh"
    class="scroll-view"
    scroll-y
    :scroll-into-view="scrollIntoView"
    scroll-with-animation
    @scrolltolower="getGoodsData(false)"
  >
    <view v-if="isLoading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    <template v-else>
      <view class="section safety-section">
        <view class="section-header">
          <text class="section-title">🛡️ 食品安全与品牌背书</text>
          <text class="section-desc">品质保障 · 安心食用</text>
        </view>
        <WaterProductSwiper :list="bannerList" />
      </view>

      <view class="section ugc-section">
        <view class="section-header" @tap="onGoUgcList">
          <text class="section-title">📸 用户分享</text>
          <view class="section-header-right">
            <text class="section-desc">真实体验 · 好物推荐</text>
            <view class="ugc-post-btn" @tap.stop="onGoPostUgc">
              <text class="post-icon">✏️</text>
              <text class="post-text">发布分享</text>
            </view>
          </view>
        </view>
        <view class="ugc-swiper-wrap" @tap="onGoUgcList">
        <swiper
          class="ugc-swiper"
          vertical
          :circular="true"
          :autoplay="false"
          :interval="4000"
          @change="onChange"
          :previous-margin="'120rpx'"
          :next-margin="'120rpx'"
        >
          <swiper-item v-for="item in ugcList" :key="item.id">
            <view class="ugc-card" @tap="onGoUgcDetail(item.id)">
              <view class="ugc-header">
                <image class="ugc-avatar" :src="item.avatar" mode="aspectFill" />
                <view class="ugc-user-info">
                  <text class="ugc-username">{{ item.userName }}</text>
                  <text class="ugc-time">{{ item.createdAt }}</text>
                </view>
                <view class="ugc-share-btn" @tap.stop="onShareUgc(item)">
                  <text class="share-icon">↗</text>
                </view>
              </view>
              <text class="ugc-content">{{ item.content }}</text>
              <view class="ugc-media" v-if="item.video || item.images.length > 0">
                <!-- 视频封面 -->
                <view v-if="item.video" class="ugc-video-cover" @tap.stop="onGoUgcDetail(item.id)">
                  <image v-if="item.videoCover" class="video-thumb" :src="item.videoCover" mode="aspectFill" />
                  <view v-else class="video-thumb-placeholder">
                    <text class="placeholder-icon">📹</text>
                  </view>
                  <view class="video-play-icon">
                    <text>▶</text>
                  </view>
                  <view class="video-badge">
                    <text>视频</text>
                  </view>
                </view>
                <!-- 图片列表 -->
                <view class="ugc-images" v-if="!item.video && item.images.length > 0">
                  <image
                    v-for="(img, idx) in item.images"
                    :key="idx"
                    class="ugc-image"
                    :src="img"
                    mode="aspectFill"
                  />
                </view>
              </view>
              <view class="ugc-actions">
                <view class="ugc-action-item" @tap.stop="onLike(item)">
                  <text class="ugc-action-icon" :class="{ liked: item._liked }">❤️</text>
                  <text class="ugc-action-text">{{ item.likes }}</text>
                </view>
                <view class="ugc-action-item" @tap.stop>
                  <text class="ugc-action-icon">💬</text>
                  <text class="ugc-action-text">{{ item.comments }}</text>
                </view>
                <view class="ugc-action-item" @tap.stop="onShareUgc(item)">
                  <text class="ugc-action-icon">🔗</text>
                  <text class="ugc-action-text">分享</text>
                </view>
              </view>
              <view class="ugc-goods-card" @tap.stop="onGoGoods(item.goodsId)">
                <image class="ugc-goods-image" :src="item.goodsImage" mode="aspectFill" />
                <view class="ugc-goods-info">
                  <text class="ugc-goods-name">{{ item.goodsName }}</text>
                  <text class="ugc-goods-price">立即购买 →</text>
                </view>
              </view>
            </view>
          </swiper-item>
        </swiper>
        </view>
        <view class="ugc-hint" @tap="onGoUgcList">
          <view class="hint-arrow up"></view>
          <text class="ugc-hint-text">上下滑动查看更多 · 点击查看全部</text>
          <view class="hint-arrow down"></view>
        </view>
      </view>

      <view class="section goods-section" id="goods-section" :class="{ 'goods-highlight': goodsSectionHighlight }">
        <view class="section-header">
          <text class="section-title">🐟 精选好货</text>
          <text class="section-desc">品质甄选 · 新鲜直达</text>
        </view>
        <view class="goods-grid">
          <navigator
            v-for="item in goodsList"
            :key="item.id"
            class="goods-card"
            :url="`/pages/goods/goods?id=${item.id}`"
            hover-class="none"
          >
            <view class="goods-image-wrapper">
              <image class="goods-image" :src="item.image" mode="aspectFill" lazy-load />
              <view class="goods-badge" v-if="item.soldCount">
                <text class="goods-badge-text">已售{{ formatSoldCount(item.soldCount) }}</text>
              </view>
            </view>
            <view class="goods-info">
              <text class="goods-name">{{ item.name }}</text>
              <text class="goods-desc">{{ item.desc }}</text>
              <view class="goods-price-wrap">
                <text class="goods-price">¥{{ item.price }}</text>
                <text class="goods-old-price" v-if="item.oldPrice">¥{{ item.oldPrice }}</text>
              </view>
            </view>
          </navigator>
        </view>
      </view>

      <view class="footer">
        <text class="footer-text">优质海鲜 · 品质生活</text>
      </view>
    </template>
  </scroll-view>
</template>

<style lang="scss">
page {
  background-color: #f5f7fa;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.scroll-view {
  flex: 1;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}
.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid #00b894;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.loading-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}
.section {
  background-color: #fff;
  margin: 20rpx;
  border-radius: 20rpx;
  padding: 24rpx;
  box-sizing: border-box;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}
.section-header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.section-desc {
  font-size: 24rpx;
  color: #999;
}
.ugc-post-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 24rpx;
  background: linear-gradient(135deg, #ff6699 0%, #ff99cc 100%);
  border-radius: 30rpx;
  margin-left: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 102, 153, 0.3);

  .post-icon {
    font-size: 24rpx;
  }

  .post-text {
    font-size: 24rpx;
    font-weight: 600;
    color: #fff;
  }

  &:active {
    transform: scale(0.95);
  }
}

.safety-section {
  .section-header {
    .section-title {
      color: #0088cc;
    }
  }
}

.ugc-section {
  background: linear-gradient(180deg, #fff 0%, #f8faff 100%);
  padding: 24rpx 0;
  .section-title {
    color: #ff6699;
  }
  .ugc-swiper {
    height: 700rpx;
    margin: 0 20rpx;
  }
  .ugc-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 24rpx;
    padding: 30rpx;
    box-sizing: border-box;
    box-shadow: 0 8rpx 32rpx rgba(255, 102, 153, 0.12);
    transition: all 0.3s ease;
  }
  .ugc-header {
    display: flex;
    align-items: center;
    margin-bottom: 24rpx;
  }
  .ugc-avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    border: 4rpx solid #ffccdd;
  }
  .ugc-user-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
  }
  .ugc-username {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  .ugc-time {
    font-size: 24rpx;
    color: #999;
    margin-top: 6rpx;
  }
  .ugc-share-btn {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    border-radius: 50%;
    transition: all 0.2s ease;

    .share-icon {
      font-size: 28rpx;
      color: #666;
    }

    &:active {
      transform: scale(0.9);
      background: #ffeef0;
    }
  }
  .ugc-content {
    font-size: 30rpx;
    color: #333;
    line-height: 1.7;
    margin-bottom: 20rpx;
    flex: 1;
  }
  .ugc-images {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-bottom: 20rpx;
  }
  .ugc-image {
    width: calc(33.33% - 12rpx);
    height: 200rpx;
    border-radius: 16rpx;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.96);
    }
  }
  .ugc-video-cover {
    position: relative;
    width: 100%;
    height: 320rpx;
    border-radius: 16rpx;
    overflow: hidden;
    margin-bottom: 20rpx;
    background: #1a1a1a;

    .video-thumb {
      width: 100%;
      height: 100%;
    }

    .video-thumb-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .placeholder-icon {
        font-size: 64rpx;
      }
    }

    .video-play-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80rpx;
      height: 80rpx;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 36rpx;
        color: #fff;
      }
    }

    .video-badge {
      position: absolute;
      top: 12rpx;
      left: 12rpx;
      padding: 4rpx 16rpx;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 8rpx;

      text {
        font-size: 20rpx;
        color: #fff;
      }
    }
  }
  .ugc-actions {
    display: flex;
    margin-bottom: 20rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }
  .ugc-action-item {
    display: flex;
    align-items: center;
    margin-right: 40rpx;
    transition: opacity 0.2s ease;

    &:active {
      opacity: 0.6;
    }
  }
  .ugc-action-icon {
    font-size: 36rpx;
    margin-right: 10rpx;
    transition: all 0.2s ease;

    &.liked {
      color: #ff6699;
      transform: scale(1.2);
    }
  }
  .ugc-action-text {
    font-size: 28rpx;
    color: #666;
  }
  .ugc-goods-card {
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #fff0f3 0%, #ffe6eb 100%);
    border-radius: 16rpx;
    padding: 20rpx;
    border: 2rpx solid #ffccdd;
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.98);
      background: linear-gradient(135deg, #ffe6eb 0%, #ffd4dd 100%);
    }
  }
  .ugc-goods-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
  }
  .ugc-goods-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .ugc-goods-name {
    font-size: 28rpx;
    color: #333;
    font-weight: bold;
  }
  .ugc-goods-price {
    font-size: 24rpx;
    color: #ff6699;
    font-weight: 600;
    margin-top: 8rpx;
  }
  .ugc-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20rpx;
  }
  .hint-arrow {
    width: 24rpx;
    height: 24rpx;
    border-left: 3rpx solid #ccc;
    border-top: 3rpx solid #ccc;

    &.up {
      transform: rotate(-45deg);
      margin-bottom: 8rpx;
      animation: arrowUp 1.5s ease-in-out infinite;
    }

    &.down {
      transform: rotate(135deg);
      margin-top: 8rpx;
      animation: arrowDown 1.5s ease-in-out infinite;
    }
  }

  @keyframes arrowUp {
    0%, 100% {
      opacity: 0.4;
      transform: rotate(-45deg) translateY(0);
    }
    50% {
      opacity: 1;
      transform: rotate(-45deg) translateY(-10rpx);
    }
  }

  @keyframes arrowDown {
    0%, 100% {
      opacity: 0.4;
      transform: rotate(135deg) translateY(0);
    }
    50% {
      opacity: 1;
      transform: rotate(135deg) translateY(10rpx);
    }
  }

  .ugc-hint-text {
    font-size: 26rpx;
    color: #999;
  }
}

.goods-section {
  transition: background-color 0.6s ease, box-shadow 0.6s ease;
  border-radius: 16rpx;
  padding: 24rpx;
  margin: 20rpx 0;

  &.goods-highlight {
    animation: goodsHighlight 2s ease;
  }

  @keyframes goodsHighlight {
    0% {
      background-color: transparent;
      box-shadow: none;
    }
    20% {
      background-color: rgba(0, 184, 148, 0.12);
      box-shadow: 0 0 0 4rpx rgba(0, 184, 148, 0.3);
    }
    60% {
      background-color: rgba(0, 184, 148, 0.08);
      box-shadow: 0 0 0 2rpx rgba(0, 184, 148, 0.2);
    }
    100% {
      background-color: transparent;
      box-shadow: none;
    }
  }

  .section-title {
    color: #009966;
  }
  .goods-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
  }
  .goods-card {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease;
    &:active {
      transform: scale(0.98);
    }
  }
  .goods-image-wrapper {
    position: relative;
    width: 100%;
    height: 280rpx;
  }
  .goods-image {
    width: 100%;
    height: 100%;
  }
  .goods-badge {
    position: absolute;
    top: 12rpx;
    left: 12rpx;
    background: rgba(255, 87, 34, 0.9);
    border-radius: 20rpx;
    padding: 6rpx 16rpx;
  }
  .goods-badge-text {
    font-size: 22rpx;
    color: #fff;
    font-weight: bold;
  }
  .goods-info {
    padding: 16rpx;
  }
  .goods-name {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .goods-desc {
    font-size: 22rpx;
    color: #999;
    display: block;
    margin-top: 8rpx;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .goods-price-wrap {
    display: flex;
    align-items: baseline;
    margin-top: 12rpx;
  }
  .goods-price {
    font-size: 34rpx;
    font-weight: bold;
    color: #ff4444;
  }
  .goods-old-price {
    font-size: 24rpx;
    color: #999;
    text-decoration: line-through;
    margin-left: 10rpx;
  }
}

.footer {
  text-align: center;
  padding: 40rpx 0;
}
.footer-text {
  font-size: 24rpx;
  color: #999;
}
</style>