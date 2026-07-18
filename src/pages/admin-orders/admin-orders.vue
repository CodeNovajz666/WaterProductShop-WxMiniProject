<script setup lang="ts">
import type { Order } from '@/types/order'
import {
  getAdminOrdersAPI,
  getAdminOrderStatsAPI,
  shipOrderAPI,
} from '@/services/order'
import { getLogisticsCompaniesAPI } from '@/services/logistics'
import { useMemberStore } from '@/stores'
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getSafeAreaInsets } from '@/utils/system'
import { ORDER_STATUS_COLORS, ORDER_CONFIG } from '@/config/constants'

const safeAreaInsets = getSafeAreaInsets()
const memberStore = useMemberStore()

// 权限校验
const hasPermission = ref(true)

// 订单列表
const orderList = ref<Order[]>([])
const loading = ref(false)
const refresherTriggered = ref(false)

// 当前选中的状态 Tab
const activeStatus = ref(0)

// 搜索关键词
const keyword = ref('')

// 统计数据
const stats = ref({
  total: 0,
  pendingPayment: 0,
  pendingShipment: 0,
  pendingReceipt: 0,
  pendingReview: 0,
  completed: 0,
  cancelled: 0,
  totalSales: 0,
})

// 物流公司列表
const logisticsCompanies = ref<{ code: string; name: string }[]>([])

// 发货弹窗
const showShipModal = ref(false)
const shipTarget = ref<Order | null>(null)
const selectedLogistics = ref('')

// 状态 Tab 配置
const tabs = computed(() => [
  { type: 0, text: '全部', count: stats.value.total },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_PAYMENT, text: '待付款', count: stats.value.pendingPayment },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_SHIPMENT, text: '待发货', count: stats.value.pendingShipment },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_RECEIPT, text: '待收货', count: stats.value.pendingReceipt },
  { type: ORDER_CONFIG.ORDER_STATUS.PENDING_REVIEW, text: '待评价', count: stats.value.pendingReview },
  { type: ORDER_CONFIG.ORDER_STATUS.COMPLETED, text: '已完成', count: stats.value.completed },
  { type: ORDER_CONFIG.ORDER_STATUS.CANCELLED, text: '已取消', count: stats.value.cancelled },
])

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

// 加载统计
const loadStats = async () => {
  try {
    const res = await getAdminOrderStatsAPI()
    stats.value = res.result
  } catch {
    // 静默失败
  }
}

// 加载订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getAdminOrdersAPI({
      orderState: activeStatus.value,
      keyword: keyword.value,
      page: 1,
      pageSize: 50,
    })
    orderList.value = res.result.items
  } catch {
    uni.showToast({ icon: 'none', title: '加载失败' })
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  refresherTriggered.value = true
  try {
    await Promise.all([loadStats(), loadOrders()])
  } finally {
    refresherTriggered.value = false
  }
}

// 切换 Tab
const switchTab = (type: number) => {
  activeStatus.value = type
  loadOrders()
}

// 搜索
const onSearch = () => {
  loadOrders()
}

// 打开发货弹窗
const openShipModal = async (order: Order) => {
  shipTarget.value = order
  // 加载物流公司列表
  if (logisticsCompanies.value.length === 0) {
    const res = await getLogisticsCompaniesAPI()
    logisticsCompanies.value = res.result
  }
  selectedLogistics.value = logisticsCompanies.value[0]?.name || '顺丰速运'
  showShipModal.value = true
}

// 选择物流公司
const onLogisticsChange = (ev: any) => {
  const idx = ev.detail.value
  selectedLogistics.value = logisticsCompanies.value[idx]?.name || '顺丰速运'
}

// 确认发货
const confirmShip = async () => {
  if (!shipTarget.value) return

  uni.showLoading({ title: '发货中...' })
  try {
    const res = await shipOrderAPI(shipTarget.value.id, selectedLogistics.value)
    if (res.code === '0') {
      uni.hideLoading()
      uni.showToast({ title: '发货成功', icon: 'success' })
      showShipModal.value = false
      shipTarget.value = null
      // 刷新列表和统计
      await Promise.all([loadStats(), loadOrders()])
    } else {
      uni.hideLoading()
      uni.showToast({ title: res.msg, icon: 'none' })
    }
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '发货失败，请重试', icon: 'none' })
  }
}

// 跳转订单详情
const goOrderDetail = (order: Order) => {
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

// 返回
const goBack = () => uni.navigateBack()

onLoad(() => {
  if (memberStore.profile?.role !== 'enterprise') {
    hasPermission.value = false
    uni.showModal({
      title: '无权限',
      content: '该页面仅企业端用户可访问，请先切换企业端登录',
      showCancel: false,
      success: () => uni.navigateBack(),
    })
    return
  }
  Promise.all([loadStats(), loadOrders()])
})

onShow(() => {
  if (hasPermission.value) {
    Promise.all([loadStats(), loadOrders()])
  }
})
</script>

<template>
  <view class="page" v-if="hasPermission">
    <!-- 顶部导航 -->
    <view class="header" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">订单管理</text>
      <view class="header-right"></view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">{{ stats.total }}</text>
        <text class="stat-label">总订单</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.pendingShipment }}</text>
        <text class="stat-label">待发货</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">¥{{ stats.totalSales.toFixed(2) }}</text>
        <text class="stat-label">总销售额</text>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-bar">
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索订单号或收件人"
        confirm-type="search"
        @confirm="onSearch"
      />
      <view class="search-btn" @tap="onSearch">
        <text>搜索</text>
      </view>
    </view>

    <!-- 状态 Tab -->
    <scroll-view scroll-x class="tabs-scroll" :show-scrollbar="false">
      <view class="tabs">
        <view
          v-for="tab in tabs"
          :key="tab.type"
          class="tab-item"
          :class="{ active: activeStatus === tab.type }"
          @tap="switchTab(tab.type)"
        >
          <text class="tab-text">{{ tab.text }}</text>
          <text v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <scroll-view
      scroll-y
      class="order-scroll"
      :refresher-enabled="true"
      :refresher-triggered="refresherTriggered"
      @refresherrefresh="onRefresh"
    >
      <view v-if="orderList.length > 0" class="order-list">
        <view v-for="order in orderList" :key="order.id" class="order-card" @tap="goOrderDetail(order)">
          <!-- 订单头部 -->
          <view class="order-header">
            <view class="order-info-left">
              <text class="order-no">{{ order.orderNo }}</text>
              <text class="order-time">{{ formatTime(order.createTime) }}</text>
            </view>
            <text class="order-status" :style="{ color: ORDER_STATUS_COLORS[order.status] || '#666' }">{{ order.statusText }}</text>
          </view>

          <!-- 收件人信息 -->
          <view class="receiver-info">
            <text class="receiver-name">{{ order.address.receiver }}</text>
            <text class="receiver-phone">{{ order.address.contact }}</text>
            <text class="receiver-address">{{ order.address.fullAddress }}</text>
          </view>

          <!-- 商品列表 -->
          <view class="goods-list">
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

          <!-- 物流信息（已发货） -->
          <view v-if="order.trackingNo && (order.status === 3 || order.status === 4 || order.status === 5)" class="logistics-info" @tap.stop="goLogistics(order)">
            <text class="logistics-icon">🚚</text>
            <view class="logistics-detail">
              <text class="logistics-company">{{ order.logisticsCompany }}：{{ order.trackingNo }}</text>
              <text class="logistics-hint">查看物流轨迹 ›</text>
            </view>
          </view>

          <!-- 金额信息 -->
          <view class="order-footer">
            <view class="order-amount">
              <text class="amount-label">实付</text>
              <text class="amount-value">¥{{ order.payAmount.toFixed(2) }}</text>
            </view>
            <view class="order-actions">
              <!-- 待发货状态显示发货按钮 -->
              <view v-if="order.status === 2" class="action-btn primary" @tap.stop="openShipModal(order)">
                <text>立即发货</text>
              </view>
              <!-- 待收货状态显示物流按钮 -->
              <view v-if="order.status === 3 || order.status === 4 || order.status === 5" class="action-btn secondary" @tap.stop="goLogistics(order)">
                <text>查看物流</text>
              </view>
              <view class="action-btn secondary" @tap.stop="goOrderDetail(order)">
                <text>订单详情</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无订单</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 发货弹窗 -->
    <view v-if="showShipModal" class="modal-overlay" @tap="showShipModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">确认发货</text>
          <view class="modal-close" @tap="showShipModal = false">
            <text>×</text>
          </view>
        </view>

        <view class="modal-body">
          <!-- 订单信息 -->
          <view v-if="shipTarget" class="ship-order-info">
            <text class="ship-order-no">订单号：{{ shipTarget.orderNo }}</text>
            <view class="ship-goods" v-for="item in shipTarget.items" :key="item.id">
              <image class="ship-goods-image" :src="item.image" mode="aspectFill" />
              <view class="ship-goods-info">
                <text class="ship-goods-name">{{ item.name }}</text>
                <text class="ship-goods-qty">x{{ item.count }}</text>
              </view>
            </view>
            <view class="ship-receiver">
              <text class="ship-receiver-label">收件人：</text>
              <text class="ship-receiver-value">{{ shipTarget.address.receiver }} {{ shipTarget.address.contact }}</text>
            </view>
            <view class="ship-receiver">
              <text class="ship-receiver-label">收货地址：</text>
              <text class="ship-receiver-value">{{ shipTarget.address.fullAddress }}</text>
            </view>
          </view>

          <!-- 物流公司选择 -->
          <view class="logistics-select">
            <text class="select-label">选择物流公司</text>
            <picker
              class="picker"
              :range="logisticsCompanies"
              range-key="name"
              @change="onLogisticsChange"
            >
              <view class="picker-value">
                <text>{{ selectedLogistics }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>

          <view class="ship-tip">
            <text>💡 发货后将自动生成物流单号，用户端将显示"待收货"状态并可查看物流轨迹</text>
          </view>
        </view>

        <view class="modal-footer">
          <view class="btn-cancel" @tap="showShipModal = false">
            <text>取消</text>
          </view>
          <view class="btn-confirm" @tap="confirmShip">
            <text>确认发货</text>
          </view>
        </view>
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

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx 20rpx;
  background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%);

  .header-back, .header-right {
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
    font-size: 34rpx;
    font-weight: bold;
    color: #fff;
  }
}

/* 统计卡片 */
.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 20rpx;
  padding: 28rpx 20rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  .stat-num {
    font-size: 40rpx;
    font-weight: bold;
    color: #0066cc;
  }

  .stat-label {
    font-size: 24rpx;
    color: #999;
    margin-top: 8rpx;
  }
}

.stat-divider {
  width: 1rpx;
  height: 56rpx;
  background: #e8e8e8;
}

/* 搜索框 */
.search-bar {
  display: flex;
  gap: 12rpx;
  padding: 0 20rpx 16rpx;

  .search-input {
    flex: 1;
    height: 72rpx;
    padding: 0 24rpx;
    background: #fff;
    border-radius: 36rpx;
    font-size: 28rpx;
  }

  .search-btn {
    width: 120rpx;
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0066cc;
    border-radius: 36rpx;

    text {
      font-size: 28rpx;
      color: #fff;
    }

    &:active {
      opacity: 0.8;
    }
  }
}

/* 状态 Tab */
.tabs-scroll {
  white-space: nowrap;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.tabs {
  display: inline-flex;
  padding: 0 16rpx;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  padding: 20rpx 24rpx;
  position: relative;

  .tab-text {
    font-size: 28rpx;
    color: #666;
  }

  .tab-badge {
    font-size: 20rpx;
    color: #fff;
    background: #ff6b6b;
    padding: 2rpx 10rpx;
    border-radius: 20rpx;
    margin-left: 8rpx;
    min-width: 28rpx;
    text-align: center;
  }

  &.active {
    .tab-text {
      color: #0066cc;
      font-weight: bold;
    }

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

/* 订单列表 */
.order-scroll {
  flex: 1;
  padding: 0 20rpx;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding-top: 20rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &:active {
    opacity: 0.95;
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f5f5f5;

  .order-info-left {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  .order-no {
    font-size: 26rpx;
    font-weight: 600;
    color: #2d3436;
  }

  .order-time {
    font-size: 22rpx;
    color: #b2bec3;
  }

  .order-status {
    font-size: 28rpx;
    font-weight: bold;
  }
}

.receiver-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;

  .receiver-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #2d3436;
  }

  .receiver-phone {
    font-size: 26rpx;
    color: #636e72;
  }

  .receiver-address {
    width: 100%;
    font-size: 24rpx;
    color: #636e72;
    line-height: 1.5;
  }
}

.goods-list {
  padding: 8rpx 0;
  border-top: 1rpx dashed #f0f0f0;
}

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
    margin-left: 16rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }

  .goods-name {
    font-size: 28rpx;
    color: #2d3436;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .goods-sku {
    font-size: 22rpx;
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

.logistics-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  margin-top: 16rpx;
  background: #f0f7ff;
  border-radius: 12rpx;

  &:active {
    opacity: 0.85;
  }

  .logistics-icon {
    font-size: 32rpx;
  }

  .logistics-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  .logistics-company {
    font-size: 24rpx;
    color: #2d3436;
  }

  .logistics-hint {
    font-size: 22rpx;
    color: #0066cc;
  }
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-amount {
  display: flex;
  align-items: baseline;
  gap: 8rpx;

  .amount-label {
    font-size: 24rpx;
    color: #636e72;
  }

  .amount-value {
    font-size: 32rpx;
    font-weight: bold;
    color: #ff6b6b;
  }
}

.order-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 28rpx;
  border-radius: 28rpx;
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

  .empty-icon {
    font-size: 100rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.bottom-space {
  height: 60rpx;
}

/* 发货弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-height: 80vh;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .modal-title {
    font-size: 34rpx;
    font-weight: bold;
    color: #2d3436;
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
}

.modal-body {
  padding: 24rpx 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.ship-order-info {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 24rpx;

  .ship-order-no {
    font-size: 26rpx;
    font-weight: 600;
    color: #2d3436;
    display: block;
    margin-bottom: 16rpx;
  }
}

.ship-goods {
  display: flex;
  align-items: center;
  padding: 12rpx 0;

  .ship-goods-image {
    width: 80rpx;
    height: 80rpx;
    border-radius: 8rpx;
    flex-shrink: 0;
  }

  .ship-goods-info {
    flex: 1;
    margin-left: 16rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ship-goods-name {
    font-size: 26rpx;
    color: #2d3436;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ship-goods-qty {
    font-size: 24rpx;
    color: #999;
  }
}

.ship-receiver {
  display: flex;
  padding: 8rpx 0;

  .ship-receiver-label {
    font-size: 24rpx;
    color: #636e72;
    flex-shrink: 0;
  }

  .ship-receiver-value {
    font-size: 24rpx;
    color: #2d3436;
    flex: 1;
  }
}

.logistics-select {
  margin-bottom: 24rpx;

  .select-label {
    font-size: 28rpx;
    font-weight: 600;
    color: #2d3436;
    display: block;
    margin-bottom: 12rpx;
  }
}

.picker {
  .picker-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 88rpx;
    padding: 0 24rpx;
    background: #f8f9fa;
    border-radius: 12rpx;

    text {
      font-size: 28rpx;
      color: #2d3436;
    }

    .picker-arrow {
      font-size: 32rpx;
      color: #b2bec3;
    }
  }
}

.ship-tip {
  padding: 20rpx;
  background: #fff8e1;
  border-radius: 8rpx;

  text {
    font-size: 24rpx;
    color: #8d6e63;
    line-height: 1.6;
  }
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;

  text {
    font-size: 30rpx;
    font-weight: 600;
  }
}

.btn-cancel {
  background: #f5f7fa;

  text {
    color: #666;
  }
}

.btn-confirm {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);

  text {
    color: #fff;
  }

  &:active {
    opacity: 0.9;
  }
}
</style>
