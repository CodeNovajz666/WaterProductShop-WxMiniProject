<script setup lang="ts">
import type { AddressItem } from '@/types/address'
import type { CheckoutItem } from '@/types/order'
import type { ShopItem } from '@/types/shop'
import { getMemberAddressAPI } from '@/services/address'
import { getMemberShopAPI, deleteMemberShopAPI } from '@/services/shop'
import { postMemberOrderAPI } from '@/services/order'
import { useAddressStore } from '@/stores/modules/address'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

// 结算商品列表
const checkoutItems = ref<CheckoutItem[]>([])
// 商品来源
const goodsSource = ref<'cart' | 'buyNow'>('cart')
// 地址列表
const addressList = ref<AddressItem[]>([])
// 选中的地址
const selectedAddress = ref<AddressItem>()
// 地址面板是否展开
const showAddressPanel = ref(false)
// 买家备注
const buyerMessage = ref('')
// 配送时间
const deliveryTime = ref('不限')
const deliveryOptions = ['不限', '工作日', '周末', '当日达']
// 提交中
const submitting = ref(false)

// 配送费
const shippingFee = computed(() => {
  const total = totalPrice.value
  if (total >= 88) return 0
  return total > 0 ? 10 : 0
})

// 商品总价
const totalPrice = computed(() => {
  return checkoutItems.value.reduce((sum, item) => sum + item.price * item.count, 0)
})

// 应付金额
const payAmount = computed(() => {
  return totalPrice.value + shippingFee.value
})

// 加载结算数据
const loadCheckoutData = async () => {
  try {
    if (goodsSource.value === 'cart') {
      // 从购物车获取选中的商品
      const res = await getMemberShopAPI()
      const cartItems: ShopItem[] = res.result
      checkoutItems.value = cartItems
        .filter((item) => item.selected)
        .map((item) => ({
          goodsId: item.id,
          skuId: item.skuId,
          name: item.name,
          image: item.picture,
          price: item.nowPrice,
          count: item.count,
          sku: item.attrsText,
        }))
    }
    // buyNow 模式下 checkoutItems 已从 storage 读取
  } catch {
    // API 失败降级：从本地存储读取
    const stored = uni.getStorageSync('seafood_cart')
    if (stored) {
      const cartItems: ShopItem[] = JSON.parse(stored)
      checkoutItems.value = cartItems
        .filter((item) => item.selected)
        .map((item) => ({
          goodsId: item.id,
          skuId: item.skuId,
          name: item.name,
          image: item.picture,
          price: item.nowPrice,
          count: item.count,
          sku: item.attrsText,
        }))
    }
  }
}

// 加载地址列表
const loadAddressList = async () => {
  try {
    const res = await getMemberAddressAPI()
    addressList.value = res.result
    // 优先使用 addressStore 中的选中地址
    const addressStore = useAddressStore()
    if (addressStore.selectedAddress) {
      selectedAddress.value = addressStore.selectedAddress
    } else {
      const defaultAddr = addressList.value.find((a) => a.isDefault === 1)
      selectedAddress.value = defaultAddr || addressList.value[0]
    }
  } catch {
    addressList.value = []
  }
}

// 选择地址
const onSelectAddress = (item: AddressItem) => {
  selectedAddress.value = item
  const addressStore = useAddressStore()
  addressStore.changeSelectedAddress(item)
  showAddressPanel.value = false
}

// 新建地址
const goNewAddress = () => {
  uni.navigateTo({ url: '/pagesMember/address-form/address-form' })
}

// 跳转商品详情
const goGoods = (goodsId: string) => {
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

// 返回上一页
const goBack = () => uni.navigateBack()

// 提交订单
const onSubmitOrder = async () => {
  if (!selectedAddress.value) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' })
    return
  }
  if (checkoutItems.value.length === 0) {
    uni.showToast({ title: '没有可结算的商品', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await postMemberOrderAPI({
      addressId: selectedAddress.value.id,
      deliveryTime: deliveryTime.value,
      buyerMessage: buyerMessage.value,
      goodsSource: goodsSource.value,
      items: checkoutItems.value,
    })

    // 清除直接购买的临时数据
    uni.removeStorageSync('buy_now_items')

    // 购物车清车操作后台执行，不阻塞跳转
    if (goodsSource.value === 'cart') {
      const skuIds = checkoutItems.value.map((item) => item.skuId)
      deleteMemberShopAPI({ ids: skuIds }).catch(() => {
        // 降级：清除本地存储中已结算的商品
        const stored = uni.getStorageSync('seafood_cart')
        if (stored) {
          const cartItems: ShopItem[] = JSON.parse(stored)
          const filtered = cartItems.filter((item) => !skuIds.includes(item.skuId))
          uni.setStorageSync('seafood_cart', JSON.stringify(filtered))
        }
      })
    }

    uni.showToast({ title: '下单成功', icon: 'success', duration: 500 })

    // 立即跳转，不等待清车操作完成
    setTimeout(() => {
      submitting.value = false
      uni.redirectTo({ url: '/pages/order/order-list?type=0' })
    }, 500)
  } catch {
    submitting.value = false
    uni.showToast({ title: '下单失败，请重试', icon: 'none' })
  }
}

onLoad((options) => {
  goodsSource.value = (options?.source as 'cart' | 'buyNow') || 'cart'

  if (goodsSource.value === 'buyNow') {
    // 直接购买模式：从 storage 读取商品信息
    const stored = uni.getStorageSync('buy_now_items')
    if (stored) {
      checkoutItems.value = JSON.parse(stored)
    }
  }
  // 地址列表在 onLoad 中加载一次
  loadAddressList()
})

// onShow 仅刷新结算商品数据（从地址管理页返回时可能地址变了）
let firstShow = true
onShow(() => {
  if (firstShow) {
    firstShow = false
    return // 首次显示由 onLoad 处理
  }
  loadCheckoutData()
  loadAddressList()
})
</script>

<template>
  <view class="checkout-page" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
    <!-- 头部 -->
    <view class="page-header">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">确认订单</text>
      <view class="header-right"></view>
    </view>

    <scroll-view scroll-y class="checkout-scroll">
      <!-- 收货地址 -->
      <view class="section address-section" @tap="showAddressPanel = !showAddressPanel">
        <view v-if="selectedAddress" class="address-card">
          <view class="address-icon">📍</view>
          <view class="address-info">
            <view class="address-user">
              <text class="user-name">{{ selectedAddress.receiver }}</text>
              <text class="user-phone">{{ selectedAddress.contact }}</text>
            </view>
            <text class="address-detail">{{ selectedAddress.fullLocation }} {{ selectedAddress.address }}</text>
          </view>
          <text class="address-arrow">›</text>
        </view>
        <view v-else class="address-empty">
          <text class="empty-text">请选择收货地址</text>
          <text class="address-arrow">›</text>
        </view>
      </view>

      <!-- 地址面板（展开式） -->
      <view v-if="showAddressPanel" class="address-panel-wrapper">
        <view v-if="addressList.length === 0" class="panel-empty">
          <text>暂无收货地址</text>
          <view class="panel-add-btn" @tap="goNewAddress">新建地址</view>
        </view>
        <view v-else class="panel-list">
          <view
            v-for="item in addressList"
            :key="item.id"
            class="panel-item"
            :class="{ active: selectedAddress?.id === item.id }"
            @tap="onSelectAddress(item)"
          >
            <view class="panel-item-info">
              <text class="panel-item-user">{{ item.receiver }} {{ item.contact }}</text>
              <text class="panel-item-address">{{ item.fullLocation }} {{ item.address }}</text>
              <text v-if="item.isDefault" class="panel-item-tag">默认</text>
            </view>
            <text v-if="selectedAddress?.id === item.id" class="panel-item-check">✓</text>
          </view>
          <view class="panel-add-btn" @tap="goNewAddress">+ 新建地址</view>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="section goods-section">
        <view class="section-title">
          <text>商品信息</text>
          <text class="goods-count">共{{ checkoutItems.length }}件</text>
        </view>
        <view v-if="checkoutItems.length > 0" class="goods-list">
          <view
            v-for="item in checkoutItems"
            :key="item.skuId"
            class="goods-item"
            @tap="goGoods(item.goodsId)"
          >
            <image class="goods-image" :src="item.image" mode="aspectFill" lazy-load />
            <view class="goods-info">
              <text class="goods-name">{{ item.name }}</text>
              <text class="goods-sku">{{ item.sku }}</text>
              <view class="goods-bottom">
                <text class="goods-price">¥{{ item.price }}</text>
                <text class="goods-qty">x{{ item.count }}</text>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="goods-empty">
          <text>没有可结算的商品</text>
        </view>
      </view>

      <!-- 配送时间 -->
      <view class="section delivery-section">
        <view class="section-title">
          <text>配送时间</text>
        </view>
        <view class="delivery-options">
          <view
            v-for="opt in deliveryOptions"
            :key="opt"
            class="delivery-option"
            :class="{ active: deliveryTime === opt }"
            @tap="deliveryTime = opt"
          >
            <text>{{ opt }}</text>
          </view>
        </view>
      </view>

      <!-- 买家备注 -->
      <view class="section remark-section">
        <view class="section-title">
          <text>买家备注</text>
        </view>
        <textarea
          class="remark-input"
          v-model="buyerMessage"
          placeholder="选填，给商家留言（50字以内）"
          :maxlength="50"
        />
      </view>

      <!-- 费用明细 -->
      <view class="section fee-section">
        <view class="fee-row">
          <text class="fee-label">商品金额</text>
          <text class="fee-value">¥{{ totalPrice.toFixed(2) }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">运费</text>
          <text class="fee-value">{{ shippingFee === 0 ? '免运费' : '¥' + shippingFee.toFixed(2) }}</text>
        </view>
        <view class="fee-row total-row">
          <text class="fee-label">实付款</text>
          <text class="fee-value total">¥{{ payAmount.toFixed(2) }}</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 底部提交栏 -->
    <view class="submit-bar" :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }">
      <view class="submit-left">
        <text class="submit-label">应付:</text>
        <text class="submit-amount">¥{{ payAmount.toFixed(2) }}</text>
      </view>
      <view
        class="submit-btn"
        :class="{ disabled: submitting || checkoutItems.length === 0 }"
        @tap="onSubmitOrder"
      >
        <text>{{ submitting ? '提交中...' : '提交订单' }}</text>
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
.checkout-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx 24rpx;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);

  .header-back,
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
}

.checkout-scroll {
  flex: 1;
}

.section {
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  text {
    font-size: 30rpx;
    font-weight: bold;
    color: #2d3436;
  }

  .goods-count {
    font-size: 26rpx;
    color: #999;
    font-weight: normal;
  }
}

/* 地址区域 */
.address-section {
  &:active {
    opacity: 0.9;
  }
}

.address-card {
  display: flex;
  align-items: center;

  .address-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
  }

  .address-info {
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

  .address-detail {
    font-size: 26rpx;
    color: #636e72;
  }

  .address-arrow {
    font-size: 40rpx;
    color: #ccc;
  }
}

.address-empty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;

  .empty-text {
    font-size: 30rpx;
    color: #999;
  }

  .address-arrow {
    font-size: 40rpx;
    color: #ccc;
  }
}

/* 地址面板 */
.address-panel-wrapper {
  background: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.panel-empty {
  text-align: center;
  padding: 40rpx 0;

  text {
    font-size: 28rpx;
    color: #999;
  }
}

.panel-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.panel-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;

  &.active {
    background: rgba(0, 184, 148, 0.08);
    border-color: #00b894;
  }

  &:active {
    transform: scale(0.98);
  }

  .panel-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  .panel-item-user {
    font-size: 28rpx;
    font-weight: 600;
    color: #2d3436;
  }

  .panel-item-address {
    font-size: 24rpx;
    color: #636e72;
  }

  .panel-item-tag {
    font-size: 20rpx;
    color: #fff;
    background: #00b894;
    padding: 2rpx 12rpx;
    border-radius: 6rpx;
    align-self: flex-start;
  }

  .panel-item-check {
    font-size: 36rpx;
    color: #00b894;
    font-weight: bold;
  }
}

.panel-add-btn {
  text-align: center;
  padding: 24rpx;
  font-size: 28rpx;
  color: #00b894;
  font-weight: 600;
  border-top: 1rpx solid #f0f0f0;
  margin-top: 8rpx;
}

/* 商品列表 */
.goods-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.goods-item {
  display: flex;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 20rpx;

  &:active {
    opacity: 0.9;
  }
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
  font-weight: 600;
  color: #2d3436;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goods-sku {
  font-size: 24rpx;
  color: #b2bec3;
}

.goods-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;

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

.goods-empty {
  text-align: center;
  padding: 40rpx 0;

  text {
    font-size: 28rpx;
    color: #999;
  }
}

/* 配送时间 */
.delivery-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.delivery-option {
  padding: 16rpx 32rpx;
  background: #f8f9fa;
  border-radius: 10rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;

  text {
    font-size: 26rpx;
    color: #636e72;
  }

  &.active {
    background: rgba(0, 184, 148, 0.1);
    border-color: #00b894;

    text {
      color: #00b894;
      font-weight: 600;
    }
  }

  &:active {
    transform: scale(0.95);
  }
}

/* 买家备注 */
.remark-input {
  width: 100%;
  min-height: 120rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #2d3436;
  box-sizing: border-box;
}

/* 费用明细 */
.fee-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
    font-weight: 600;
  }

  &.total-row {
    padding-top: 24rpx;

    .fee-label {
      font-size: 30rpx;
      font-weight: bold;
      color: #2d3436;
    }

    .fee-value {
      font-size: 40rpx;
      font-weight: bold;
      color: #ff6b6b;

      &.total {
        color: #ff6b6b;
      }
    }
  }
}

.bottom-space {
  height: 160rpx;
}

/* 底部提交栏 */
.submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.submit-left {
  display: flex;
  align-items: baseline;
  gap: 8rpx;

  .submit-label {
    font-size: 28rpx;
    color: #636e72;
  }

  .submit-amount {
    font-size: 44rpx;
    font-weight: bold;
    color: #ff6b6b;
  }
}

.submit-btn {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  padding: 24rpx 56rpx;
  border-radius: 44rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 184, 148, 0.4);
  transition: all 0.2s ease;

  text {
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
  }

  &:active:not(.disabled) {
    transform: scale(0.95);
  }

  &.disabled {
    background: #dfe6e9;
    box-shadow: none;

    text {
      color: #b2bec3;
    }
  }
}
</style>
