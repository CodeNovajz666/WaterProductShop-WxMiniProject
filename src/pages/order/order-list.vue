<script setup lang="ts">
import type { Order } from '@/types/order'
import { getMemberOrderAPI, putMemberOrderStatusAPI, cancelOrderAPI } from '@/services/order'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { ORDER_STATUS_COLORS, ORDER_CONFIG } from '@/config/constants'

const orderType = ref(0)
const orderList = ref<Order[]>([])
const loading = ref(false)

// Tab 配置
const tabs = [
  { type: 0, text: '全部' },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_PAYMENT, text: '待付款' },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_SHIPMENT, text: '待发货' },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_RECEIPT, text: '待收货' },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_REVIEW, text: '待评价' },
]

onLoad(async (options) => {
  orderType.value = parseInt(options?.type || '0')
  await filterOrders()
})

onShow(() => {
  // 从详情页返回时刷新
  if (orderList.value.length > 0) {
    filterOrders()
  }
})

// 获取订单列表
const filterOrders = async () => {
  loading.value = true
  try {
    const res = await getMemberOrderAPI({ orderState: orderType.value })
    orderList.value = res.result.items
  } catch {
    uni.showToast({ icon: 'none', title: '获取订单失败' })
  } finally {
    loading.value = false
  }
}

// 切换 Tab
const switchTab = (type: number) => {
  orderType.value = type
  filterOrders()
}

// 立即付款
const handlePay = (order: Order) => {
  uni.showModal({
    title: '确认支付',
    content: `订单金额：¥${order.payAmount.toFixed(2)}`,
    confirmText: '确认支付',
    success: async (res) => {
      if (res.confirm) {
        try {
          await putMemberOrderStatusAPI(order.id, { status: 2, payMethod: 'wechat' })
          uni.showToast({ title: '支付成功', icon: 'success' })
          filterOrders()
        } catch {
          uni.showToast({ icon: 'none', title: '支付失败' })
        }
      }
    },
  })
}

// 取消订单
const handleCancel = (order: Order) => {
  uni.showModal({
    title: '取消订单',
    content: '确定取消此订单？',
    confirmColor: '#ff6b6b',
    success: async (res) => {
      if (res.confirm) {
        try {
          await cancelOrderAPI(order.id)
          uni.showToast({ title: '已取消', icon: 'success' })
          filterOrders()
        } catch {
          uni.showToast({ icon: 'none', title: '取消失败' })
        }
      }
    },
  })
}

// 确认收货
const handleConfirm = (order: Order) => {
  uni.showModal({
    title: '确认收货',
    content: '确认已收到商品？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await putMemberOrderStatusAPI(order.id, { status: 4 })
          uni.showToast({ title: '已确认收货', icon: 'success' })
          filterOrders()
        } catch {
          uni.showToast({ icon: 'none', title: '操作失败' })
        }
      }
    },
  })
}

// 跳转订单详情
const goDetail = (order: Order) => {
  uni.navigateTo({ url: `/pages/order-detail/order-detail?id=${order.id}` })
}

// 跳转物流详情
const goLogistics = (order: Order) => {
  if (!order.trackingNo) {
    uni.showToast({ title: '暂无物流信息', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/logistics/logistics?orderNo=${order.orderNo}` })
}

// 跳转商品详情
const goGoods = (goodsId: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

// 获取主操作按钮文字
const getPrimaryBtnText = (status: number): string => {
  const texts: Record<number, string> = {
    1: '立即付款',
    2: '提醒发货',
    3: '确认收货',
    4: '去评价',
    5: '再次购买',
    9: '重新购买',
  }
  return texts[status] || '查看详情'
}

// 主按钮点击
const handlePrimary = (order: Order) => {
  switch (order.status) {
    case 1:
      handlePay(order)
      break
    case 2:
      uni.showToast({ title: '已提醒商家发货', icon: 'success' })
      break
    case 3:
      handleConfirm(order)
      break
    case 4:
      goDetail(order)
      break
    case 5:
    case 9:
      goGoods(order.items[0]?.goodsId || '')
      break
  }
}

// 格式化时间
const formatTime = (iso?: string): string => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const goBack = () => uni.navigateBack()
</script>

<template>
  <view class="order-list-page">
    <view class="page-header">
      <view class="header-left" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">我的订单</text>
      <view class="header-right"></view>
    </view>

    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.type"
        class="tab-item"
        :class="{ active: orderType === tab.type }"
        @tap="switchTab(tab.type)"
      >
        <text>{{ tab.text }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="order-scroll" @refresherrefresh="filterOrders" :refresher-enabled="true" :refresher-triggered="loading">
      <view v-if="orderList.length > 0" class="orders-container">
        <view v-for="order in orderList" :key="order.id" class="order-card" @tap="goDetail(order)">
          <!-- 订单头部 -->
          <view class="order-header">
            <text class="order-no">订单号：{{ order.orderNo }}</text>
            <text class="order-status" :style="{ color: ORDER_STATUS_COLORS[order.status] || '#666' }">{{ order.statusText }}</text>
          </view>

          <!-- 订单创建时间 -->
          <view class="order-time">
            <text>下单时间：{{ formatTime(order.createTime) }}</text>
          </view>

          <!-- 商品列表 -->
          <view class="order-items">
            <view
              v-for="item in order.items"
              :key="item.id"
              class="order-item"
              @tap.stop="goGoods(item.goodsId)"
            >
              <image class="item-image" :src="item.image" mode="aspectFill" lazy-load />
              <view class="item-info">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-sku">{{ item.sku }}</text>
                <view class="item-bottom">
                  <text class="item-price">¥{{ item.price.toFixed(2) }}</text>
                  <text class="item-count">x{{ item.count }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 物流信息（待收货/已完成显示） -->
          <view v-if="order.trackingNo && (order.status === 3 || order.status === 4 || order.status === 5)" class="logistics-info" @tap.stop="goLogistics(order)">
            <text class="logistics-icon">🚚</text>
            <text class="logistics-text">{{ order.logisticsCompany }}：{{ order.trackingNo }}</text>
            <text class="logistics-arrow">查看物流 ›</text>
          </view>

          <!-- 金额信息 -->
          <view class="order-footer">
            <view class="order-amount">
              <text class="amount-label">共{{ order.items.length }}件商品 实付</text>
              <text class="amount-value">¥{{ order.payAmount.toFixed(2) }}</text>
            </view>
            <view class="order-actions">
              <view v-if="order.status === 1" class="action-btn secondary" @tap.stop="handleCancel(order)">
                <text>取消订单</text>
              </view>
              <view v-if="order.status === 3 || order.status === 4" class="action-btn secondary" @tap.stop="goLogistics(order)">
                <text>查看物流</text>
              </view>
              <view class="action-btn primary" @tap.stop="handlePrimary(order)">
                <text>{{ getPrimaryBtnText(order.status) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="!loading" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无订单</text>
        <view class="empty-btn" @tap="goGoods('1')">
          <text>去逛逛</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background: #f5f7fa;
}
</style>

<style lang="scss" scoped>
.order-list-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 30rpx 24rpx;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
}

.header-left, .header-right {
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

.tabs {
  display: flex;
  background: #fff;
  padding: 20rpx 0;
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
    color: #00b894;
    font-weight: bold;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 6rpx;
      background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
      border-radius: 3rpx;
    }
  }
}

.order-scroll {
  flex: 1;
  padding: 20rpx;
}

.orders-container {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  &:active {
    opacity: 0.95;
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12rpx;
}

.order-no {
  font-size: 24rpx;
  color: #999;
}

.order-status {
  font-size: 28rpx;
  font-weight: bold;
}

.order-time {
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;

  text {
    font-size: 22rpx;
    color: #b2bec3;
  }
}

.order-items {
  padding: 20rpx 0;
}

.order-item {
  display: flex;
  padding: 16rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx dashed #f0f0f0;
  }

  &:active {
    opacity: 0.85;
  }
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.item-sku {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.item-bottom {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.item-price {
  font-size: 30rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.item-count {
  font-size: 26rpx;
  color: #999;
}

.logistics-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  margin-bottom: 16rpx;

  &:active {
    opacity: 0.85;
  }

  .logistics-icon {
    font-size: 32rpx;
  }

  .logistics-text {
    flex: 1;
    font-size: 24rpx;
    color: #636e72;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logistics-arrow {
    font-size: 24rpx;
    color: #00b894;
    font-weight: 600;
  }
}

.order-footer {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.order-amount {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 8rpx;

  .amount-label {
    font-size: 24rpx;
    color: #636e72;
  }

  .amount-value {
    font-size: 34rpx;
    font-weight: bold;
    color: #ff6b6b;
  }
}

.order-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.action-btn {
  padding: 14rpx 32rpx;
  border-radius: 32rpx;
  border: 1rpx solid transparent;

  text {
    font-size: 26rpx;
    font-weight: 500;
  }

  &.primary {
    background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);

    text {
      color: #fff;
    }
  }

  &.secondary {
    background: #fff;
    border-color: #dfe6e9;

    text {
      color: #636e72;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 16rpx;
}

.empty-icon {
  font-size: 120rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.empty-btn {
  margin-top: 20rpx;
  padding: 16rpx 48rpx;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  border-radius: 32rpx;

  text {
    font-size: 28rpx;
    color: #fff;
    font-weight: 500;
  }
}

.bottom-space {
  height: 60rpx;
}
</style>
