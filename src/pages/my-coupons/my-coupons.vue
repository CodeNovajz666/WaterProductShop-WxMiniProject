<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { CouponCode } from '@/types/seafood'
import { getUserCouponsAPI, deleteUserCouponAPI } from '@/services/seafood'
import { getSafeAreaInsets } from '@/utils/system'
import { COUPON_LIMITS } from '@/config/constants'

const safeAreaInsets = getSafeAreaInsets()

const coupons = ref<CouponCode[]>([])
const loading = ref(false)
const activeTab = ref<'available' | 'used'>('available')

const loadCoupons = async () => {
  loading.value = true
  try {
    const res = await getUserCouponsAPI()
    coupons.value = res.result
  } catch {
    coupons.value = []
  } finally {
    loading.value = false
  }
}

// 可用优惠码（未使用且未过期）
const availableCoupons = computed(() => {
  return coupons.value.filter((c) => !c.used)
})

// 已使用/已过期
const usedCoupons = computed(() => {
  return coupons.value.filter((c) => c.used)
})

const currentList = computed(() => {
  return activeTab.value === 'available' ? availableCoupons.value : usedCoupons.value
})

// 格式化折扣
const formatDiscount = (coupon: CouponCode) => {
  if (coupon.discountType === 'percent') {
    return `${100 - coupon.discount}`
  }
  return coupon.discount.toString()
}

const discountUnit = (coupon: CouponCode) => {
  return coupon.discountType === 'percent' ? '折' : '元'
}

// 来源标签
const sourceText = (source?: string) => {
  const map: Record<string, string> = {
    share: '分享获得',
    enterprise: '企业发放',
    activity: '活动领取',
  }
  return source ? map[source] || '其他' : '其他'
}

// 有效期状态
const validityStatus = (coupon: CouponCode) => {
  if (coupon.used) {
    return { text: coupon.usedAt === '已过期' ? '已过期' : '已使用', color: '#999' }
  }
  if (coupon.validUntil) {
    const now = new Date()
    const expire = new Date(coupon.validUntil)
    const days = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= COUPON_LIMITS.EXPIRE_REMIND_DAYS) {
      return { text: `还剩${days}天过期`, color: '#ff6b6b' }
    }
    return { text: `有效期至 ${coupon.validUntil}`, color: '#00b894' }
  }
  return { text: '长期有效', color: '#00b894' }
}

const onDelete = (coupon: CouponCode) => {
  uni.showModal({
    title: '提示',
    content: `确定删除优惠码 ${coupon.code} 吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await deleteUserCouponAPI(coupon.code)
        coupons.value = coupons.value.filter((c) => c.code !== coupon.code)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
  })
}

const onUseCoupon = (coupon: CouponCode) => {
  if (coupon.goodsId) {
    uni.navigateTo({ url: `/pages/goods/goods?id=${coupon.goodsId}&couponCode=${coupon.code}` })
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

const onCopyCode = (code: string) => {
  uni.setClipboardData({
    data: code,
    success: () => {
      uni.showToast({ title: '已复制优惠码', icon: 'success' })
    },
  })
}

const goBack = () => uni.navigateBack()

onShow(() => {
  loadCoupons()
})
</script>

<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="header" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">我的优惠码</text>
      <view class="header-placeholder"></view>
    </view>

    <!-- Tab 切换 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'available' }"
        @tap="activeTab = 'available'"
      >
        <text>可用 ({{ availableCoupons.length }})</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'used' }"
        @tap="activeTab = 'used'"
      >
        <text>已用/过期 ({{ usedCoupons.length }})</text>
      </view>
    </view>

    <scroll-view scroll-y class="content" enable-back-to-top>
      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="currentList.length === 0" class="empty-state">
        <text class="empty-icon">🎫</text>
        <text class="empty-text">{{ activeTab === 'available' ? '暂无可用优惠码' : '暂无已使用优惠码' }}</text>
        <text class="empty-hint">分享商品给好友即可获得优惠码</text>
      </view>

      <!-- 优惠码列表 -->
      <view v-else class="coupon-list">
        <view
          v-for="coupon in currentList"
          :key="coupon.code"
          class="coupon-card"
          :class="{ disabled: coupon.used }"
        >
          <!-- 左侧折扣信息 -->
          <view class="coupon-left">
            <view class="discount-value">
              <text class="discount-num">{{ formatDiscount(coupon) }}</text>
              <text class="discount-unit">{{ discountUnit(coupon) }}</text>
            </view>
            <text class="coupon-min-amount">
              {{ coupon.minAmount > 0 ? `满${coupon.minAmount}元可用` : '无门槛' }}
            </text>
            <view class="coupon-semicircle left"></view>
          </view>

          <!-- 右侧详情 -->
          <view class="coupon-right">
            <view class="coupon-top">
              <text class="coupon-code-text">{{ coupon.code }}</text>
              <view class="copy-btn" @tap="onCopyCode(coupon.code)">
                <text>复制</text>
              </view>
            </view>
            <text class="coupon-desc-text">{{ coupon.description }}</text>

            <!-- 适用商品 -->
            <view class="coupon-info-row">
              <text class="info-label">适用商品:</text>
              <text class="info-value">{{ coupon.goodsName || '全场通用' }}</text>
            </view>

            <!-- 来源 -->
            <view class="coupon-info-row">
              <text class="info-label">来源:</text>
              <view class="source-tag">
                <text>{{ sourceText(coupon.source) }}</text>
              </view>
            </view>

            <!-- 有效期 -->
            <view class="coupon-info-row">
              <text class="info-label">有效期:</text>
              <text class="info-value" :style="{ color: validityStatus(coupon).color }">
                {{ validityStatus(coupon).text }}
              </text>
            </view>

            <!-- 领取时间 -->
            <view class="coupon-info-row" v-if="coupon.claimedAt">
              <text class="info-label">领取时间:</text>
              <text class="info-value">{{ coupon.claimedAt }}</text>
            </view>

            <!-- 使用时间 -->
            <view class="coupon-info-row" v-if="coupon.used && coupon.usedAt !== '已过期'">
              <text class="info-label">使用时间:</text>
              <text class="info-value">{{ coupon.usedAt }}</text>
            </view>

            <!-- 操作按钮 -->
            <view class="coupon-actions">
              <view
                v-if="!coupon.used"
                class="action-btn use-btn"
                @tap="onUseCoupon(coupon)"
              >
                <text>去使用</text>
              </view>
              <view class="action-btn delete-btn" @tap="onDelete(coupon)">
                <text>删除</text>
              </view>
            </view>

            <view class="coupon-semicircle right"></view>
          </view>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f5f7fa;
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
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);

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
    font-size: 34rpx;
    font-weight: bold;
    color: #fff;
  }

  .header-placeholder {
    width: 60rpx;
  }
}

/* Tab 切换 */
.tabs {
  display: flex;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  position: relative;

  text {
    font-size: 28rpx;
    color: #666;
  }

  &.active {
    text {
      color: #0066cc;
      font-weight: bold;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60rpx;
      height: 6rpx;
      background: #0066cc;
      border-radius: 3rpx;
    }
  }
}

/* 内容区 */
.content {
  flex: 1;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 100rpx 0;

  .loading-text {
    font-size: 28rpx;
    color: #999;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 30rpx;
    color: #666;
    margin-bottom: 12rpx;
  }

  .empty-hint {
    font-size: 24rpx;
    color: #bbb;
  }
}

/* 优惠码卡片 */
.coupon-list {
  padding: 20rpx;
}

.coupon-card {
  display: flex;
  margin-bottom: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

  &.disabled {
    opacity: 0.55;
  }
}

/* 左侧折扣区 */
.coupon-left {
  position: relative;
  width: 200rpx;
  flex-shrink: 0;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;

  .discount-value {
    display: flex;
    align-items: baseline;
  }

  .discount-num {
    font-size: 64rpx;
    font-weight: bold;
    color: #fff;
  }

  .discount-unit {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    margin-left: 4rpx;
  }

  .coupon-min-amount {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8rpx;
  }
}

.coupon-card.disabled .coupon-left {
  background: linear-gradient(135deg, #b0b0b0 0%, #909090 100%);
}

/* 右侧详情区 */
.coupon-right {
  flex: 1;
  background: #fff;
  padding: 20rpx 24rpx;
  position: relative;
}

.coupon-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;

  .coupon-code-text {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
    letter-spacing: 2rpx;
  }

  .copy-btn {
    padding: 6rpx 20rpx;
    background: #f0f4f8;
    border-radius: 8rpx;

    text {
      font-size: 22rpx;
      color: #0066cc;
    }

    &:active {
      opacity: 0.7;
    }
  }
}

.coupon-desc-text {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: block;
}

.coupon-info-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;

  .info-label {
    font-size: 22rpx;
    color: #999;
    width: 120rpx;
    flex-shrink: 0;
  }

  .info-value {
    font-size: 22rpx;
    color: #555;
    flex: 1;
  }
}

.source-tag {
  padding: 2rpx 12rpx;
  background: #e8f5e9;
  border-radius: 6rpx;

  text {
    font-size: 20rpx;
    color: #2e7d32;
  }
}

/* 操作按钮 */
.coupon-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.action-btn {
  padding: 12rpx 32rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 24rpx;
  }

  &:active {
    opacity: 0.8;
  }
}

.use-btn {
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);

  text {
    color: #fff;
  }
}

.delete-btn {
  background: #fff0f0;
  border: 1rpx solid #ffcaca;

  text {
    color: #ff6b6b;
  }
}

/* 半圆缺口装饰 */
.coupon-semicircle {
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  background: #f5f7fa;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);

  &.left {
    right: -12rpx;
  }

  &.right {
    left: -12rpx;
  }
}

.bottom-space {
  height: 60rpx;
}
</style>
