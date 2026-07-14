<script setup lang="ts">
import type { Order } from '@/types/order'
import { getMemberOrderAPI, putMemberOrderStatusAPI } from '@/services/order'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const orderType = ref(0)
const orderList = ref<Order[]>([])
// 加载状态
const loading = ref(false)

onLoad(async (options) => {
  orderType.value = parseInt(options?.type || '0')
  await filterOrders()
})

// 获取订单列表（按状态筛选）
const filterOrders = async () => {
  loading.value = true
  try {
    const res = await getMemberOrderAPI({ orderState: orderType.value })
    orderList.value = res.result.items
  } catch (error) {
    uni.showToast({ icon: 'none', title: '获取订单失败，请重试' })
  } finally {
    loading.value = false
  }
}

const statusColors: Record<number, string> = {
  1: '#ff6b6b',
  2: '#ffa502',
  3: '#00b894',
  4: '#00cec9',
  5: '#636e72'
}

// 立即付款：调用接口更新状态为待发货(2)
const handlePay = (order: Order) => {
  uni.showModal({
    title: '确认支付',
    content: `订单金额：¥${order.totalPrice}`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await putMemberOrderStatusAPI(order.id, { status: 2 })
          uni.showToast({ title: '支付成功', icon: 'success' })
          filterOrders()
        } catch (error) {
          uni.showToast({ icon: 'none', title: '支付失败，请重试' })
        }
      }
    }
  })
}

// 确认收货：调用接口更新状态为待评价(4)
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
        } catch (error) {
          uni.showToast({ icon: 'none', title: '确认收货失败，请重试' })
        }
      }
    }
  })
}

// 评价商品：调用接口更新状态为已完成(5)
const handleReview = (order: Order) => {
  uni.showModal({
    title: '评价商品',
    editable: true,
    placeholderText: '请输入您的评价...',
    success: async (res) => {
      if (res.confirm && res.content) {
        try {
          await putMemberOrderStatusAPI(order.id, { status: 5 })
          uni.showToast({ title: '评价成功', icon: 'success' })
          filterOrders()
        } catch (error) {
          uni.showToast({ icon: 'none', title: '评价失败，请重试' })
        }
      }
    }
  })
}

const handleAfterSale = (order: Order) => {
  uni.showModal({
    title: '售后服务',
    content: '请联系客服处理售后问题',
    showCancel: false
  })
}

const goGoods = (goodsId: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

// 返回上一页
const goBack = () => uni.navigateBack()

const getOrderBtnText = (status: number) => {
  const texts: Record<number, string> = {
    1: '立即付款',
    2: '查看物流',
    3: '确认收货',
    4: '去评价',
    5: '再来一单'
  }
  return texts[status] || '查看详情'
}

const handleOrderBtn = (order: Order) => {
  switch (order.status) {
    case 1:
      handlePay(order)
      break
    case 2:
      uni.showToast({ title: '正在查询物流...', icon: 'loading' })
      setTimeout(() => {
        uni.showToast({ title: '包裹已发出', icon: 'success' })
      }, 1000)
      break
    case 3:
      handleConfirm(order)
      break
    case 4:
      handleReview(order)
      break
    case 5:
      uni.showToast({ title: '已加入购物车', icon: 'success' })
      break
  }
}
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
        v-for="tab in [{ type: 0, text: '全部' }, { type: 1, text: '待付款' }, { type: 2, text: '待发货' }, { type: 3, text: '待收货' }, { type: 4, text: '待评价' }]"
        :key="tab.type"
        class="tab-item"
        :class="{ active: orderType === tab.type }"
        @tap="orderType = tab.type; filterOrders()"
      >
        <text>{{ tab.text }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="order-scroll">
      <view v-if="orderList.length > 0" class="orders-container">
        <view v-for="order in orderList" :key="order.id" class="order-card">
          <view class="order-header">
            <text class="order-no">订单号：{{ order.orderNo }}</text>
            <text class="order-status" :style="{ color: statusColors[order.status] }">{{ order.statusText }}</text>
          </view>

          <view class="order-items">
            <view
              v-for="item in order.items"
              :key="item.id"
              class="order-item"
              @tap="goGoods(item.goodsId)"
            >
              <image class="item-image" :src="item.image" mode="aspectFill" lazy-load />
              <view class="item-info">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-sku">{{ item.sku }}</text>
                <view class="item-bottom">
                  <text class="item-price">¥{{ item.price }}</text>
                  <text class="item-count">x{{ item.count }}</text>
                </view>
              </view>
            </view>
          </view>

          <view class="order-footer">
            <view class="order-total">
              <text class="total-label">合计：</text>
              <text class="total-price">¥{{ order.totalPrice }}</text>
            </view>
            <view class="order-actions">
              <view v-if="order.status === 4" class="action-btn secondary" @tap="handleAfterSale(order)">
                <text>售后</text>
              </view>
              <view class="action-btn primary" @tap="handleOrderBtn(order)">
                <text>{{ getOrderBtnText(order.status) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无订单</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.order-list-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 60rpx 30rpx 24rpx;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
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
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-no {
  font-size: 26rpx;
  color: #999;
}

.order-status {
  font-size: 28rpx;
  font-weight: bold;
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
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
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

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.order-total {
  display: flex;
  align-items: baseline;
}

.total-label {
  font-size: 26rpx;
  color: #666;
}

.total-price {
  font-size: 34rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.order-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  padding: 16rpx 32rpx;
  border-radius: 32rpx;

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
      color: #666;
    }
  }

  &:active {
    opacity: 0.85;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
}

.bottom-space {
  height: 80rpx;
}
</style>