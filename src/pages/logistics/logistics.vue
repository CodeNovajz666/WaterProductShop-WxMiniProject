<script setup lang="ts">
import type { Order, LogisticsInfo } from '@/types/order'
import { getMemberOrderByIdAPI } from '@/services/order'
import { getLogisticsInfoAPI } from '@/services/logistics'
import { onLoad } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { getSafeAreaInsets } from '@/utils/system'
import { ORDER_STATUS_COLORS } from '@/config/constants'

const safeAreaInsets = getSafeAreaInsets()

const orderNo = ref('')
const order = ref<Order | null>(null)
const logistics = ref<LogisticsInfo | null>(null)
const loading = ref(true)

// 格式化时间
const formatTime = (iso: string): string => {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 物流状态颜色
const statusColor = computed(() => {
  if (!logistics.value) return '#636e72'
  const colors: Record<number, string> = {
    0: '#b2bec3',
    1: '#fdcb6e',
    2: '#0984e3',
    3: '#00b894',
    4: '#00b894',
  }
  return colors[logistics.value.status] || '#636e72'
})

// 物流状态图标
const statusIcon = computed(() => {
  if (!logistics.value) return '📦'
  const icons: Record<number, string> = {
    0: '📦',
    1: '🚚',
    2: '🚛',
    3: '🛵',
    4: '✅',
  }
  return icons[logistics.value.status] || '📦'
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 1. 先获取订单
    const orderRes = await getMemberOrderByIdAPI(orderNo.value)
    if (!orderRes.result) {
      uni.showToast({ title: '订单不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1000)
      return
    }
    order.value = orderRes.result

    // 2. 检查是否有物流信息
    if (!order.value.trackingNo || !order.value.shipTime) {
      uni.showToast({ title: '暂无物流信息', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1000)
      return
    }

    // 3. 获取物流轨迹（根据订单状态判断是否已签收）
    const isSigned = order.value.status === 4 || order.value.status === 5
    const receiverCity = order.value.address?.fullAddress?.split(' ')[0] || undefined

    const logisticsRes = await getLogisticsInfoAPI(
      order.value.trackingNo,
      order.value.logisticsCompany || '顺丰速运',
      order.value.shipTime,
      isSigned,
      receiverCity,
    )
    logistics.value = logisticsRes.result
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 复制物流单号
const copyTrackingNo = () => {
  if (!logistics.value) return
  uni.setClipboardData({
    data: logistics.value.trackingNo,
    success: () => uni.showToast({ title: '已复制单号', icon: 'success' }),
  })
}

// 联系快递
const contactCourier = () => {
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
}

const goBack = () => uni.navigateBack()

onLoad((options) => {
  orderNo.value = options?.orderNo || ''
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
      <text class="header-title">物流详情</text>
      <view class="header-right"></view>
    </view>

    <scroll-view v-if="!loading && logistics && order" scroll-y class="content-scroll">
      <!-- 物流状态卡片 -->
      <view class="status-card" :style="{ background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%)` }">
        <view class="status-icon">{{ statusIcon }}</view>
        <view class="status-info">
          <text class="status-text">{{ logistics.statusText }}</text>
          <text class="status-desc" v-if="logistics.currentLocation">当前所在：{{ logistics.currentLocation }}</text>
          <text class="status-desc" v-else-if="logistics.status === 4">快件已签收，签收人：本人签收</text>
          <text class="status-desc" v-else>物流单号：{{ logistics.trackingNo }}</text>
        </view>
      </view>

      <!-- 物流单号信息 -->
      <view class="section tracking-section" @tap="copyTrackingNo">
        <view class="tracking-row">
          <text class="tracking-label">物流公司</text>
          <text class="tracking-value">{{ logistics.companyName }}</text>
        </view>
        <view class="tracking-row">
          <text class="tracking-label">物流单号</text>
          <view class="tracking-value-wrap">
            <text class="tracking-value">{{ logistics.trackingNo }}</text>
            <text class="tracking-copy">复制</text>
          </view>
        </view>
      </view>

      <!-- 收件信息 -->
      <view class="section receiver-section">
        <view class="receiver-icon">📍</view>
        <view class="receiver-info">
          <view class="receiver-user">
            <text class="user-name">{{ order.address.receiver }}</text>
            <text class="user-phone">{{ order.address.contact }}</text>
          </view>
          <text class="receiver-address">{{ order.address.fullAddress }}</text>
        </view>
      </view>

      <!-- 物流轨迹 -->
      <view class="section tracks-section">
        <view class="section-header">
          <text class="section-title">物流轨迹</text>
          <text class="tracks-count">共{{ logistics.tracks.length }}条记录</text>
        </view>

        <view v-if="logistics.tracks.length > 0" class="tracks-list">
          <view
            v-for="(track, idx) in logistics.tracks"
            :key="idx"
            class="track-item"
            :class="{ first: idx === 0 }"
          >
            <view class="track-dot" :class="{ active: idx === 0 }"></view>
            <view class="track-line" v-if="idx < logistics.tracks.length - 1"></view>
            <view class="track-content">
              <text class="track-content-text">{{ track.content }}</text>
              <view class="track-meta">
                <text class="track-time">{{ formatTime(track.time) }}</text>
                <text v-if="track.location" class="track-location">{{ track.location }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-else class="tracks-empty">
          <text>暂无物流轨迹</text>
        </view>
      </view>

      <!-- 商品信息 -->
      <view class="section goods-section">
        <view class="section-header">
          <text class="section-title">订单商品</text>
          <text class="order-no">订单号：{{ order.orderNo }}</text>
        </view>
        <view v-for="item in order.items" :key="item.id" class="goods-item">
          <image class="goods-image" :src="item.image" mode="aspectFill" lazy-load />
          <view class="goods-info">
            <text class="goods-name">{{ item.name }}</text>
            <text class="goods-sku">{{ item.sku }}</text>
            <view class="goods-bottom">
              <text class="goods-price">¥{{ item.price.toFixed(2) }}</text>
              <text class="goods-qty">x{{ item.count }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 加载中 -->
    <view v-else-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 底部操作 -->
    <view v-if="!loading && logistics" class="action-bar" :style="{ paddingBottom: safeAreaInsets.bottom + 'px' }">
      <view class="action-btn secondary" @tap="contactCourier">
        <text>联系客服</text>
      </view>
      <view class="action-btn primary" @tap="goBack">
        <text>返回订单</text>
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

/* 状态卡片 */
.status-card {
  display: flex;
  align-items: center;
  margin: 20rpx;
  padding: 36rpx 30rpx;
  border-radius: 16rpx;
  color: #fff;

  .status-icon {
    font-size: 64rpx;
    margin-right: 24rpx;
  }

  .status-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .status-text {
    font-size: 36rpx;
    font-weight: bold;
  }

  .status-desc {
    font-size: 24rpx;
    opacity: 0.9;
  }
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

  .tracks-count, .order-no {
    font-size: 24rpx;
    color: #999;
  }
}

/* 物流单号信息 */
.tracking-section {
  &:active {
    opacity: 0.85;
  }
}

.tracking-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .tracking-label {
    font-size: 26rpx;
    color: #636e72;
  }

  .tracking-value-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .tracking-value {
    font-size: 28rpx;
    color: #2d3436;
    font-weight: 500;
  }

  .tracking-copy {
    font-size: 22rpx;
    color: #00b894;
    padding: 4rpx 12rpx;
    border: 1rpx solid #00b894;
    border-radius: 6rpx;
  }
}

/* 收件信息 */
.receiver-section {
  display: flex;
  align-items: flex-start;

  .receiver-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
    margin-top: 4rpx;
  }

  .receiver-info {
    flex: 1;
  }

  .receiver-user {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 8rpx;

    .user-name {
      font-size: 30rpx;
      font-weight: bold;
      color: #2d3436;
    }

    .user-phone {
      font-size: 28rpx;
      color: #636e72;
    }
  }

  .receiver-address {
    font-size: 26rpx;
    color: #636e72;
    line-height: 1.5;
  }
}

/* 物流轨迹 */
.tracks-list {
  padding-left: 8rpx;
}

.track-item {
  position: relative;
  padding-left: 44rpx;
  padding-bottom: 36rpx;

  &:last-child {
    padding-bottom: 0;
  }
}

.track-dot {
  position: absolute;
  left: 0;
  top: 8rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #dfe6e9;
  z-index: 1;

  &.active {
    background: #00b894;
    box-shadow: 0 0 0 6rpx rgba(0, 184, 148, 0.2);
  }
}

.track-line {
  position: absolute;
  left: 9rpx;
  top: 28rpx;
  width: 2rpx;
  height: 100%;
  background: #dfe6e9;
}

.track-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;

  .track-content-text {
    font-size: 28rpx;
    color: #2d3436;
    line-height: 1.5;
  }

  .track-meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .track-time {
    font-size: 22rpx;
    color: #b2bec3;
  }

  .track-location {
    font-size: 22rpx;
    color: #00b894;
    padding: 2rpx 10rpx;
    background: rgba(0, 184, 148, 0.08);
    border-radius: 6rpx;
  }
}

.track-item.first .track-content-text {
  font-weight: 600;
  color: #00b894;
}

.tracks-empty {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}

/* 商品信息 */
.goods-item {
  display: flex;
  padding: 16rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx dashed #f0f0f0;
  }

  .goods-image {
    width: 140rpx;
    height: 140rpx;
    border-radius: 10rpx;
    flex-shrink: 0;
  }

  .goods-info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
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

  .goods-sku {
    font-size: 24rpx;
    color: #999;
  }

  .goods-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .goods-price {
    font-size: 28rpx;
    font-weight: bold;
    color: #ff6b6b;
  }

  .goods-qty {
    font-size: 24rpx;
    color: #999;
  }
}

.bottom-space {
  height: 140rpx;
}

/* 底部操作栏 */
.action-bar {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-btn {
  flex: 1;
  padding: 22rpx 0;
  border-radius: 40rpx;
  text-align: center;

  text {
    font-size: 28rpx;
    font-weight: 500;
  }

  &.primary {
    background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);

    text {
      color: #fff;
    }
  }

  &.secondary {
    background: #f5f7fa;

    text {
      color: #636e72;
    }
  }

  &:active {
    transform: scale(0.97);
  }
}
</style>
