<script setup lang="ts">
import type { Order } from '@/types/order'
import { getMemberOrderByIdAPI, putMemberOrderStatusAPI, cancelOrderAPI, deleteOrderAPI } from '@/services/order'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { getSafeAreaInsets } from '@/utils/system'
import { ORDER_STATUS_COLORS } from '@/config/constants'

const safeAreaInsets = getSafeAreaInsets()

const orderId = ref('')
const order = ref<Order | null>(null)
const loading = ref(true)
const submitting = ref(false)

// 格式化时间
const formatTime = (iso?: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 状态颜色
const statusColor = computed(() => {
  if (!order.value) return '#666'
  return ORDER_STATUS_COLORS[order.value.status] || '#666'
})

// 加载订单详情
const loadOrder = async () => {
  loading.value = true
  try {
    const res = await getMemberOrderByIdAPI(orderId.value)
    if (res.result) {
      order.value = res.result
    } else {
      uni.showToast({ title: '订单不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1000)
    }
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 立即付款
const handlePay = () => {
  if (!order.value) return
  uni.showModal({
    title: '确认支付',
    content: `订单金额：¥${order.value.payAmount.toFixed(2)}`,
    confirmText: '确认支付',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          await putMemberOrderStatusAPI(order.value!.id, { status: 2, payMethod: 'wechat' })
          uni.showToast({ title: '支付成功', icon: 'success' })
          await loadOrder()
        } catch {
          uni.showToast({ icon: 'none', title: '支付失败' })
        } finally {
          submitting.value = false
        }
      }
    },
  })
}

// 取消订单
const handleCancel = () => {
  if (!order.value) return
  uni.showModal({
    title: '取消订单',
    content: '确定取消此订单？取消后不可恢复',
    confirmText: '确认取消',
    confirmColor: '#ff6b6b',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          await cancelOrderAPI(order.value!.id)
          uni.showToast({ title: '订单已取消', icon: 'success' })
          await loadOrder()
        } catch {
          uni.showToast({ icon: 'none', title: '取消失败' })
        } finally {
          submitting.value = false
        }
      }
    },
  })
}

// 确认收货
const handleConfirm = () => {
  if (!order.value) return
  uni.showModal({
    title: '确认收货',
    content: '请确认已收到商品，确认后订单将进入待评价状态',
    confirmText: '确认收货',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          await putMemberOrderStatusAPI(order.value!.id, { status: 4 })
          uni.showToast({ title: '已确认收货', icon: 'success' })
          await loadOrder()
        } catch {
          uni.showToast({ icon: 'none', title: '操作失败' })
        } finally {
          submitting.value = false
        }
      }
    },
  })
}

// 评价（跳转到评价发布页）
const handleReview = () => {
  if (!order.value) return
  uni.navigateTo({
    url: `/pages/review-post/review-post?orderId=${order.value.id}`,
  })
}

// 删除订单
const handleDelete = () => {
  if (!order.value) return
  uni.showModal({
    title: '删除订单',
    content: '删除后订单将无法恢复，确定删除？',
    confirmText: '删除',
    confirmColor: '#ff6b6b',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          await deleteOrderAPI(order.value!.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 800)
        } catch {
          uni.showToast({ icon: 'none', title: '删除失败' })
        } finally {
          submitting.value = false
        }
      }
    },
  })
}

// 跳转物流详情
const goLogistics = () => {
  if (!order.value?.trackingNo) {
    uni.showToast({ title: '暂无物流信息', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/logistics/logistics?orderNo=${order.value.orderNo}`,
  })
}

// 跳转商品详情
const goGoods = (goodsId: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

// 复制订单号
const copyOrderNo = () => {
  if (!order.value) return
  uni.setClipboardData({
    data: order.value.orderNo,
    success: () => uni.showToast({ title: '订单号已复制', icon: 'success' }),
  })
}

// 联系客服
const contactService = () => {
  uni.showToast({ title: '客服功能开发中', icon: 'none' })
}

const goBack = () => uni.navigateBack()

onLoad((options) => {
  orderId.value = options?.id || ''
  loadOrder()
})

onShow(() => {
  if (orderId.value && order.value) {
    loadOrder()
  }
})
</script>

<template>
  <view class="page" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">订单详情</text>
      <view class="header-right"></view>
    </view>

    <scroll-view v-if="!loading && order" scroll-y class="content-scroll">
      <!-- 订单状态卡片 -->
      <view class="status-card" :style="{ background: `linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%)` }">
        <text class="status-text">{{ order.statusText }}</text>
        <text class="status-desc" v-if="order.status === 1">请尽快完成付款，超时订单将自动取消</text>
        <text class="status-desc" v-else-if="order.status === 2">商家正在备货，请耐心等待</text>
        <text class="status-desc" v-else-if="order.status === 3 && order.autoConfirmTime">
          预计 {{ formatTime(order.autoConfirmTime) }} 自动确认收货
        </text>
        <text class="status-desc" v-else-if="order.status === 4">快去评价分享您的购物体验吧</text>
        <text class="status-desc" v-else-if="order.status === 5">交易已完成，期待您的再次光临</text>
        <text class="status-desc" v-else-if="order.status === 9">订单已取消</text>
      </view>

      <!-- 物流信息（待收货/已完成状态显示） -->
      <view v-if="order.trackingNo && (order.status === 3 || order.status === 4 || order.status === 5)" class="section logistics-section" @tap="goLogistics">
        <view class="logistics-icon">🚚</view>
        <view class="logistics-info">
          <text class="logistics-company">{{ order.logisticsCompany }}：{{ order.trackingNo }}</text>
          <text class="logistics-hint">点击查看物流详情 ›</text>
        </view>
      </view>

      <!-- 收货地址 -->
      <view class="section address-section">
        <view class="address-icon">📍</view>
        <view class="address-detail">
          <view class="address-user">
            <text class="user-name">{{ order.address.receiver }}</text>
            <text class="user-phone">{{ order.address.contact }}</text>
          </view>
          <text class="address-text">{{ order.address.fullAddress }}</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="section goods-section">
        <view class="section-header">
          <text class="section-title">商品信息</text>
          <text class="goods-count">共{{ order.items.length }}件</text>
        </view>
        <view v-for="item in order.items" :key="item.id" class="goods-item" @tap="goGoods(item.goodsId)">
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

      <!-- 费用明细 -->
      <view class="section fee-section">
        <view class="fee-row">
          <text class="fee-label">商品金额</text>
          <text class="fee-value">¥{{ order.totalPrice.toFixed(2) }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">运费</text>
          <text class="fee-value">{{ order.shippingFee === 0 ? '免运费' : '¥' + order.shippingFee.toFixed(2) }}</text>
        </view>
        <view v-if="order.discountAmount > 0" class="fee-row">
          <text class="fee-label">优惠</text>
          <text class="fee-value discount">-¥{{ order.discountAmount.toFixed(2) }}</text>
        </view>
        <view class="fee-row total-row">
          <text class="fee-label">实付款</text>
          <text class="fee-value total">¥{{ order.payAmount.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 订单时间轴 -->
      <view class="section timeline-section">
        <view class="section-header">
          <text class="section-title">订单进度</text>
        </view>
        <view class="timeline">
          <view
            v-for="(node, idx) in order.timeline"
            :key="idx"
            class="timeline-item"
            :class="{ reached: node.reached, current: idx === 0 && node.reached }"
          >
            <view class="timeline-dot"></view>
            <view class="timeline-line" v-if="idx < order.timeline.length - 1"></view>
            <view class="timeline-content">
              <text class="timeline-title">{{ node.statusText }}</text>
              <text class="timeline-desc">{{ node.description }}</text>
              <text class="timeline-time" v-if="node.time">{{ formatTime(node.time) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="section info-section">
        <view class="info-row" @tap="copyOrderNo">
          <text class="info-label">订单编号</text>
          <view class="info-value-wrap">
            <text class="info-value">{{ order.orderNo }}</text>
            <text class="info-copy">复制</text>
          </view>
        </view>
        <view class="info-row">
          <text class="info-label">创建时间</text>
          <text class="info-value">{{ formatTime(order.createTime) }}</text>
        </view>
        <view v-if="order.payTime" class="info-row">
          <text class="info-label">付款时间</text>
          <text class="info-value">{{ formatTime(order.payTime) }}</text>
        </view>
        <view v-if="order.shipTime" class="info-row">
          <text class="info-label">发货时间</text>
          <text class="info-value">{{ formatTime(order.shipTime) }}</text>
        </view>
        <view v-if="order.deliverTime" class="info-row">
          <text class="info-label">收货时间</text>
          <text class="info-value">{{ formatTime(order.deliverTime) }}</text>
        </view>
        <view v-if="order.payMethod" class="info-row">
          <text class="info-label">支付方式</text>
          <text class="info-value">{{ order.payMethod === 'wechat' ? '微信支付' : '支付宝' }}</text>
        </view>
        <view v-if="order.deliveryTime" class="info-row">
          <text class="info-label">配送时间</text>
          <text class="info-value">{{ order.deliveryTime }}</text>
        </view>
        <view v-if="order.buyerMessage" class="info-row">
          <text class="info-label">买家备注</text>
          <text class="info-value">{{ order.buyerMessage }}</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 加载中 -->
    <view v-else-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 底部操作栏 -->
    <view v-if="!loading && order" class="action-bar" :style="{ paddingBottom: safeAreaInsets.bottom + 'px' }">
      <!-- 待付款 -->
      <template v-if="order.status === 1">
        <view class="action-btn secondary" @tap="contactService">
          <text>联系客服</text>
        </view>
        <view class="action-btn secondary" @tap="handleCancel">
          <text>取消订单</text>
        </view>
        <view class="action-btn primary" @tap="handlePay">
          <text>立即付款</text>
        </view>
      </template>
      <!-- 待发货 -->
      <template v-else-if="order.status === 2">
        <view class="action-btn secondary" @tap="contactService">
          <text>联系客服</text>
        </view>
      </template>
      <!-- 待收货 -->
      <template v-else-if="order.status === 3">
        <view class="action-btn secondary" @tap="goLogistics">
          <text>查看物流</text>
        </view>
        <view class="action-btn primary" @tap="handleConfirm">
          <text>确认收货</text>
        </view>
      </template>
      <!-- 待评价 -->
      <template v-else-if="order.status === 4">
        <view class="action-btn secondary" @tap="goLogistics" v-if="order.trackingNo">
          <text>查看物流</text>
        </view>
        <view class="action-btn primary" @tap="handleReview">
          <text>评价</text>
        </view>
      </template>
      <!-- 已完成 -->
      <template v-else-if="order.status === 5">
        <view class="action-btn secondary" @tap="handleDelete">
          <text>删除订单</text>
        </view>
        <view class="action-btn primary" @tap="goGoods(order.items[0]?.goodsId || '')">
          <text>再来一单</text>
        </view>
      </template>
      <!-- 已取消 -->
      <template v-else-if="order.status === 9">
        <view class="action-btn secondary" @tap="handleDelete">
          <text>删除订单</text>
        </view>
        <view class="action-btn primary" @tap="goGoods(order.items[0]?.goodsId || '')">
          <text>重新购买</text>
        </view>
      </template>
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
  margin: 20rpx;
  padding: 40rpx 30rpx;
  border-radius: 16rpx;
  color: #fff;

  .status-text {
    font-size: 40rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 12rpx;
  }

  .status-desc {
    font-size: 26rpx;
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

  .goods-count {
    font-size: 26rpx;
    color: #999;
  }
}

/* 物流信息 */
.logistics-section {
  display: flex;
  align-items: center;

  &:active {
    opacity: 0.85;
  }

  .logistics-icon {
    font-size: 48rpx;
    margin-right: 20rpx;
  }

  .logistics-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .logistics-company {
    font-size: 28rpx;
    color: #2d3436;
  }

  .logistics-hint {
    font-size: 24rpx;
    color: #00b894;
  }
}

/* 地址 */
.address-section {
  display: flex;
  align-items: flex-start;

  .address-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
    margin-top: 4rpx;
  }

  .address-detail {
    flex: 1;
  }

  .address-user {
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

  .address-text {
    font-size: 26rpx;
    color: #636e72;
    line-height: 1.5;
  }
}

/* 商品列表 */
.goods-item {
  display: flex;
  padding: 20rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx dashed #f0f0f0;
  }

  &:active {
    opacity: 0.85;
  }

  .goods-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
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
    margin-top: 8rpx;
  }

  .goods-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .goods-price {
    font-size: 30rpx;
    font-weight: bold;
    color: #ff6b6b;
  }

  .goods-qty {
    font-size: 26rpx;
    color: #999;
  }
}

/* 费用明细 */
.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .fee-label {
    font-size: 28rpx;
    color: #636e72;
  }

  .fee-value {
    font-size: 28rpx;
    color: #2d3436;
    font-weight: 500;

    &.discount {
      color: #ff6b6b;
    }

    &.total {
      font-size: 36rpx;
      font-weight: bold;
      color: #ff6b6b;
    }
  }

  &.total-row {
    padding-top: 24rpx;
  }
}

/* 时间轴 */
.timeline {
  padding-left: 8rpx;
}

.timeline-item {
  position: relative;
  padding-left: 40rpx;
  padding-bottom: 40rpx;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 8rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #dfe6e9;
  border: 4rpx solid #dfe6e9;
  z-index: 1;
}

.timeline-line {
  position: absolute;
  left: 9rpx;
  top: 28rpx;
  width: 2rpx;
  height: 100%;
  background: #dfe6e9;
}

.timeline-item.reached .timeline-dot {
  background: #00b894;
  border-color: #00b894;
}

.timeline-item.reached .timeline-line {
  background: #00b894;
}

.timeline-item.current .timeline-dot {
  background: #fff;
  border-color: #00b894;
  box-shadow: 0 0 0 6rpx rgba(0, 184, 148, 0.2);
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 6rpx;

  .timeline-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #2d3436;
  }

  .timeline-desc {
    font-size: 24rpx;
    color: #636e72;
  }

  .timeline-time {
    font-size: 22rpx;
    color: #b2bec3;
  }
}

/* 订单信息 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 26rpx;
    color: #636e72;
  }

  .info-value-wrap {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .info-value {
    font-size: 26rpx;
    color: #2d3436;
  }

  .info-copy {
    font-size: 22rpx;
    color: #00b894;
    padding: 4rpx 12rpx;
    border: 1rpx solid #00b894;
    border-radius: 6rpx;
  }
}

.bottom-space {
  height: 160rpx;
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
