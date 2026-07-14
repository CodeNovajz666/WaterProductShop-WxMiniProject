<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  getMemberShopAPI,
  putMemberShopBySkuIdAPI,
  deleteMemberShopAPI,
  putMemberShopSelectedAPI,
} from '@/services/shop'
import type { ShopItem } from '@/types/shop'

// 上次请求购物车数据的时间戳（用于 onShow 节流，避免短时间内重复请求）
let lastShopFetchTime = 0

// 购物车数据
const shopItems = ref<ShopItem[]>([])
const loading = ref(false)

// 本地存储 key（API 不可用时降级使用）
const STORAGE_KEY = 'seafood_cart'

// 获取购物车列表（优先调用后端 API，失败时降级到本地存储）
const getShopData = async () => {
  loading.value = true
  try {
    const res = await getMemberShopAPI()
    shopItems.value = res.result
  } catch (e) {
    console.error('获取购物车列表失败，降级到本地存储:', e)
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      shopItems.value = stored ? JSON.parse(stored) : []
    } catch (err) {
      console.error('读取本地购物车数据失败:', err)
      shopItems.value = []
    }
  } finally {
    loading.value = false
  }
}

// 保存购物车数据到本地存储（降级兜底）
const saveShopData = () => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(shopItems.value))
}

// 页面显示时重新加载购物车数据（节流：距离上次请求 < 2 秒则跳过）
onShow(() => {
  const now = Date.now()
  if (now - lastShopFetchTime < 2000) return
  lastShopFetchTime = now
  getShopData()
})

const selectedAll = computed(() => shopItems.value.length > 0 && shopItems.value.every(item => item.selected))

// 切换单个商品选中状态（优先调用后端 API，失败时降级到本地存储）
const toggleSelect = async (index: number) => {
  const item = shopItems.value[index]
  const oldSelected = item.selected
  const newSelected = !oldSelected
  // 先更新本地状态（乐观更新）
  item.selected = newSelected
  try {
    await putMemberShopBySkuIdAPI(item.skuId, { selected: newSelected })
  } catch (e) {
    console.error('更新选中状态失败，降级到本地存储:', e)
    // 回滚乐观更新的本地状态
    item.selected = oldSelected
    saveShopData()
    uni.showToast({ icon: 'none', title: '操作失败，请重试' })
  }
}

// 全选/取消全选（优先调用后端 API，失败时降级到本地存储）
const toggleSelectAll = async () => {
  // 记录操作前的选中状态，用于失败回滚
  const oldStates = shopItems.value.map(item => item.selected)
  const newSelected = !selectedAll.value
  // 先更新本地状态（乐观更新）
  shopItems.value.forEach(item => {
    item.selected = newSelected
  })
  try {
    await putMemberShopSelectedAPI({ selected: newSelected })
  } catch (e) {
    console.error('全选/取消全选失败，降级到本地存储:', e)
    // 回滚乐观更新的本地状态
    shopItems.value.forEach((item, i) => {
      item.selected = oldStates[i]
    })
    saveShopData()
    uni.showToast({ icon: 'none', title: '操作失败，请重试' })
  }
}

// 减少商品数量（优先调用后端 API，失败时降级到本地存储）
const decreaseQuantity = async (index: number) => {
  const item = shopItems.value[index]
  if (item.count <= 1) return
  const oldCount = item.count
  const newCount = oldCount - 1
  // 先更新本地状态（乐观更新）
  item.count = newCount
  try {
    await putMemberShopBySkuIdAPI(item.skuId, { count: newCount })
  } catch (e) {
    console.error('减少数量失败，降级到本地存储:', e)
    // 回滚乐观更新的本地状态
    item.count = oldCount
    saveShopData()
    uni.showToast({ icon: 'none', title: '操作失败，请重试' })
  }
}

// 增加商品数量（优先调用后端 API，失败时降级到本地存储）
const increaseQuantity = async (index: number) => {
  const item = shopItems.value[index]
  // 库存上限校验
  if (item.count >= item.stock) {
    uni.showToast({ icon: 'none', title: '库存不足' })
    return
  }
  const oldCount = item.count
  const newCount = oldCount + 1
  // 先更新本地状态（乐观更新）
  item.count = newCount
  try {
    await putMemberShopBySkuIdAPI(item.skuId, { count: newCount })
  } catch (e) {
    console.error('增加数量失败，降级到本地存储:', e)
    // 回滚乐观更新的本地状态
    item.count = oldCount
    saveShopData()
    uni.showToast({ icon: 'none', title: '操作失败，请重试' })
  }
}

// 删除购物车单品（优先调用后端 API，失败时降级到本地存储）
const deleteItem = (index: number) => {
  uni.showModal({
    content: '确定删除该商品?',
    confirmColor: '#ff4757',
    success: async (res) => {
      if (res.confirm) {
        const item = shopItems.value[index]
        // 先从本地列表移除（乐观更新）
        shopItems.value.splice(index, 1)
        try {
          await deleteMemberShopAPI({ ids: [item.skuId] })
        } catch (e) {
          console.error('删除购物车商品失败，降级到本地存储:', e)
          saveShopData()
        }
      }
    }
  })
}

const getTotalPrice = computed(() => {
  return shopItems.value
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.nowPrice * item.count, 0)
})

const getSelectedCount = computed(() => {
  return shopItems.value.filter(item => item.selected).length
})

const getTotalCount = computed(() => {
  return shopItems.value.reduce((sum, item) => sum + item.count, 0)
})

const goCheckout = () => {
  if (getSelectedCount.value === 0) {
    uni.showToast({ icon: 'none', title: '请选择商品' })
    return
  }
  uni.navigateTo({ url: '/pages/checkout/checkout?source=cart' })
}

// 去逛逛：设置滚动标志后跳转首页，首页 onShow 检测标志后滚动到商品区域
const goShopping = () => {
  uni.setStorageSync('scroll_to_goods', true)
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="cart-container">
    <view class="cart-header">
      <text class="cart-title">🛒 我的购物车</text>
      <text class="cart-count">{{ getTotalCount }}件商品</text>
    </view>

    <scroll-view class="cart-list" scroll-y>
      <view v-if="shopItems.length" class="items-wrapper">
        <view
          v-for="(item, index) in shopItems"
          :key="item.skuId"
          class="cart-item-card"
        >
          <view class="select-box" @tap="toggleSelect(index)">
            <view class="select-circle" :class="{ active: item.selected }">
              <text v-if="item.selected" class="select-icon">✓</text>
            </view>
          </view>

          <navigator
            class="item-content"
            hover-class="none"
            :url="`/pages/goods/goods?id=${item.id}`"
          >
            <view class="item-image-wrapper">
              <image class="item-image" mode="aspectFill" lazy-load :src="item.picture"></image>
            </view>
            <view class="item-info">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-spec">{{ item.attrsText }}</text>
              <view class="item-price-area">
                <text class="item-price">¥{{ item.nowPrice }}</text>
                <text v-if="item.price !== item.nowPrice" class="item-old-price">¥{{ item.price }}</text>
              </view>
            </view>
          </navigator>

          <view class="item-actions">
            <view class="quantity-wrapper">
              <view class="qty-btn minus" @tap="decreaseQuantity(index)">
                <text>-</text>
              </view>
              <view class="qty-input">
                <text>{{ item.count }}</text>
              </view>
              <view class="qty-btn plus" @tap="increaseQuantity(index)">
                <text>+</text>
              </view>
            </view>
            <view class="delete-action" @tap="deleteItem(index)">
              <text class="delete-icon">🗑️</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-cart">
        <view class="empty-icon-wrapper">
          <view class="empty-icon">🐟</view>
          <view class="empty-wave"></view>
        </view>
        <text class="empty-title">购物车空空如也</text>
        <text class="empty-desc">快去挑选新鲜美味的海鲜吧~</text>
        <view class="empty-btn" @tap="goShopping">
          <text class="empty-btn-text">去逛逛</text>
          <text class="empty-btn-arrow">→</text>
        </view>
      </view>
    </scroll-view>

    <view class="cart-footer">
      <view class="footer-left">
        <view class="select-all" @tap="toggleSelectAll">
          <view class="select-circle" :class="{ active: selectedAll }">
            <text v-if="selectedAll" class="select-icon">✓</text>
          </view>
          <text>全选</text>
        </view>
      </view>
      <view class="footer-center">
        <view class="total-info">
          <text class="total-label">合计:</text>
          <text class="total-price">¥{{ getTotalPrice.toFixed(2) }}</text>
        </view>
      </view>
      <view class="footer-right">
        <button class="checkout-btn" :class="{ disabled: getSelectedCount === 0 }" @tap="goCheckout">
          <text>结算({{ getSelectedCount }})</text>
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f8f9fa;
}
</style>

<style lang="scss" scoped>
.cart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.cart-header {
  padding: 60rpx 30rpx 30rpx;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;

  .cart-title {
    font-size: 40rpx;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  }

  .cart-count {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.2);
    padding: 8rpx 20rpx;
    border-radius: 20rpx;
  }
}

.cart-list {
  flex: 1;
  padding: 20rpx;
}

.items-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.cart-item-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.08);
  }
}

.select-box {
  padding: 0 16rpx;
}

.select-circle {
  width: 48rpx;
  height: 48rpx;
  border: 3rpx solid #dfe6e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &.active {
    background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
    border-color: transparent;
  }

  .select-icon {
    color: #fff;
    font-size: 24rpx;
    font-weight: bold;
  }
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
}

.item-image-wrapper {
  width: 180rpx;
  height: 180rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background-color: #f8f9fa;
  margin-right: 20rpx;

  .item-image {
    width: 100%;
    height: 100%;
  }
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2d3436;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-spec {
  font-size: 24rpx;
  color: #b2bec3;
}

.item-price-area {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-top: 8rpx;

  .item-price {
    font-size: 34rpx;
    font-weight: bold;
    color: #ff6b6b;
  }

  .item-old-price {
    font-size: 24rpx;
    color: #b2bec3;
    text-decoration: line-through;
  }
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16rpx;
}

.quantity-wrapper {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 30rpx;
  padding: 6rpx;
}

.qty-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  text {
    font-size: 36rpx;
    font-weight: 300;
    color: #636e72;
  }

  &.minus:active {
    background: #dfe6e9;
  }

  &.plus {
    background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);

    text {
      color: #fff;
      font-size: 32rpx;
    }

    &:active {
      opacity: 0.8;
    }
  }
}

.qty-input {
  min-width: 72rpx;
  text-align: center;

  text {
    font-size: 30rpx;
    font-weight: 600;
    color: #2d3436;
  }
}

.delete-action {
  padding: 8rpx;

  .delete-icon {
    font-size: 36rpx;
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }

  &:active .delete-icon {
    opacity: 1;
  }
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
}

.empty-icon-wrapper {
  position: relative;
  margin-bottom: 40rpx;
}

.empty-icon {
  font-size: 160rpx;
  animation: float 3s ease-in-out infinite;
}

.empty-wave {
  width: 120rpx;
  height: 20rpx;
  background: rgba(0, 184, 148, 0.2);
  border-radius: 50%;
  position: absolute;
  bottom: -20rpx;
  left: 50%;
  transform: translateX(-50%);
  animation: wave 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

@keyframes wave {
  0%, 100% {
    transform: translateX(-50%) scaleX(1);
    opacity: 0.3;
  }
  50% {
    transform: translateX(-50%) scaleX(1.5);
    opacity: 0.6;
  }
}

.empty-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #2d3436;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #b2bec3;
  margin-bottom: 48rpx;
}

.empty-btn {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  padding: 24rpx 64rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 184, 148, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .empty-btn-text {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }

  .empty-btn-arrow {
    font-size: 32rpx;
    color: #fff;
    transition: transform 0.3s ease;
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 4rpx 12rpx rgba(0, 184, 148, 0.35);

    .empty-btn-arrow {
      transform: translateX(8rpx);
    }
  }
}

.cart-footer {
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.footer-left {
  flex: 0 0 auto;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 12rpx;

  text {
    font-size: 28rpx;
    color: #636e72;
  }

  .select-circle {
    width: 44rpx;
    height: 44rpx;
    border-width: 2rpx;
  }
}

.footer-center {
  flex: 1;
  padding: 0 30rpx;
}

.total-info {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;

  .total-label {
    font-size: 26rpx;
    color: #636e72;
  }

  .total-price {
    font-size: 40rpx;
    font-weight: bold;
    color: #ff6b6b;
    margin-left: 8rpx;
  }
}

.footer-right {
  flex: 0 0 auto;
}

.checkout-btn {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  padding: 24rpx 48rpx;
  border-radius: 44rpx;
  border: none;
  box-shadow: 0 6rpx 20rpx rgba(0, 184, 148, 0.4);
  transition: all 0.2s ease;

  text {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 3rpx 10rpx rgba(0, 184, 148, 0.4);
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