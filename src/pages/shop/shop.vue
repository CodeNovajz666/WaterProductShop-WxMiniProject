<script setup lang="ts">
import { ref, computed } from 'vue'
import { getMemberShopAPI, deleteMemberShopAPI, putMemberShopBySkuIdAPI, putMemberShopSelectedAPI } from '@/services/shop'
import type { ShopItem } from '@/types/shop'

const shopItems = ref<ShopItem[]>([])
const loading = ref(false)

// 获取购物车数据
const getShopData = async () => {
  loading.value = true
  try {
    const res = await getMemberShopAPI()
    shopItems.value = res.result
  } catch (e) {
    console.error('获取购物车失败', e)
  } finally {
    loading.value = false
  }
}

getShopData()

const selectedAll = computed(() => shopItems.value.length > 0 && shopItems.value.every(item => item.selected))

const toggleSelect = async (index: number) => {
  const item = shopItems.value[index]
  item.selected = !item.selected
  try {
    await putMemberShopBySkuIdAPI(item.skuId, { selected: item.selected })
  } catch (e) {
    item.selected = !item.selected // 回滚
  }
}

const toggleSelectAll = async () => {
  const newSelected = !selectedAll.value
  try {
    await putMemberShopSelectedAPI({ selected: newSelected })
    shopItems.value.forEach(item => {
      item.selected = newSelected
    })
  } catch (e) {
    console.error('全选失败', e)
  }
}

const decreaseQuantity = async (index: number) => {
  const item = shopItems.value[index]
  if (item.count <= 1) return
  const oldCount = item.count
  item.count--
  try {
    await putMemberShopBySkuIdAPI(item.skuId, { count: item.count })
  } catch (e) {
    item.count = oldCount // 回滚
  }
}

const increaseQuantity = async (index: number) => {
  const item = shopItems.value[index]
  const oldCount = item.count
  item.count++
  try {
    await putMemberShopBySkuIdAPI(item.skuId, { count: item.count })
  } catch (e) {
    item.count = oldCount // 回滚
  }
}

const deleteItem = async (index: number) => {
  const item = shopItems.value[index]
  uni.showModal({
    content: '删除商品?',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteMemberShopAPI({ ids: [item.skuId] })
          shopItems.value.splice(index, 1)
        } catch (e) {
          console.error('删除失败', e)
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

const goCheckout = () => {
  if (getSelectedCount.value === 0) {
    uni.showToast({ icon: 'none', title: '请选择商品' })
    return
  }
  uni.navigateTo({ url: '/pages/checkout/checkout' })
}
</script>

<template>
  <view class="viewport">
    <scroll-view class="scroll-view" scroll-y>
      <view v-if="shopItems.length" class="shop-list">
        <view
          v-for="(item, index) in shopItems"
          :key="item.skuId"
          class="shop-item"
        >
          <view class="checkbox" @tap="toggleSelect(index)">
            <view class="check" :class="{ checked: item.selected }"></view>
          </view>
          <navigator
            class="goods"
            hover-class="none"
            :url="`/pages/goods/goods?id=${item.id}`"
          >
            <image class="goods-image" mode="aspectFill" :src="item.picture"></image>
            <view class="goods-info">
              <text class="goods-name">{{ item.name }}</text>
              <view class="goods-price-row">
                <text class="current-price">¥{{ item.nowPrice }}</text>
                <text class="original-price">¥{{ item.price }}</text>
              </view>
              <text class="attrs-text">{{ item.attrsText }}</text>
            </view>
          </navigator>
          <view class="actions">
            <view class="quantity-control">
              <view class="qty-btn" @tap="decreaseQuantity(index)">-</view>
              <text class="qty-num">{{ item.count }}</text>
              <view class="qty-btn" @tap="increaseQuantity(index)">+</view>
            </view>
            <view class="delete-btn" @tap="deleteItem(index)">删除</view>
          </view>
        </view>
      </view>
      <view v-else class="empty-shop">
        <view class="empty-icon">🛒</view>
        <text class="empty-text">购物车是空的</text>
        <navigator class="empty-btn" hover-class="none" url="/pages/index/index">去逛逛</navigator>
      </view>
    </scroll-view>
    <view class="bottom-bar">
      <view class="select-all" @tap="toggleSelectAll">
        <view class="check" :class="{ checked: selectedAll }"></view>
        <text>全选</text>
      </view>
      <view class="total">
        <text class="total-label">合计:</text>
        <text class="total-price">¥{{ getTotalPrice.toFixed(2) }}</text>
      </view>
      <button class="checkout-btn" @tap="goCheckout">结算({{ getSelectedCount }})</button>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f7f7f8;
}
</style>

<style lang="scss" scoped>
.viewport {
  height: 100%;
}

.scroll-view {
  height: 100%;
  padding: 20rpx;
  padding-bottom: 140rpx;
}

.shop-list {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.shop-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .checkbox {
    margin-right: 20rpx;
  }

  .check {
    width: 44rpx;
    height: 44rpx;
    border: 2rpx solid #ddd;
    border-radius: 50%;

    &.checked {
      background-color: #27ba9b;
      border-color: #27ba9b;

      &::after {
        content: '✓';
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #fff;
        font-size: 24rpx;
      }
    }
  }

  .goods {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .goods-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    margin-right: 20rpx;
  }

  .goods-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .goods-name {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 12rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .goods-price-row {
    display: flex;
    align-items: baseline;
  }

  .current-price {
    font-size: 30rpx;
    font-weight: bold;
    color: #ff6600;
  }

  .original-price {
    font-size: 24rpx;
    color: #999;
    text-decoration: line-through;
    margin-left: 10rpx;
  }

  .attrs-text {
    font-size: 22rpx;
    color: #999;
    margin-top: 8rpx;
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .quantity-control {
    display: flex;
    align-items: center;
    margin-bottom: 12rpx;
  }

  .qty-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 8rpx;
    font-size: 32rpx;
    color: #333;
  }

  .qty-num {
    min-width: 60rpx;
    text-align: center;
    font-size: 28rpx;
    color: #333;
    padding: 0 12rpx;
  }

  .delete-btn {
    font-size: 24rpx;
    color: #999;
  }
}

.empty-shop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 200rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.empty-btn {
  padding: 16rpx 48rpx;
  background-color: #27ba9b;
  color: #fff;
  border-radius: 32rpx;
  font-size: 28rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-top: 1rpx solid #f0f0f0;
}

.select-all {
  display: flex;
  align-items: center;
  margin-right: 30rpx;
}

.select-all .check {
  margin-right: 10rpx;
}

.select-all text {
  font-size: 28rpx;
  color: #333;
}

.total {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.total-label {
  font-size: 26rpx;
  color: #666;
}

.total-price {
  font-size: 36rpx;
  font-weight: bold;
  color: #ff6600;
  margin-left: 8rpx;
}

.checkout-btn {
  padding: 20rpx 48rpx;
  background-color: #27ba9b;
  color: #fff;
  border-radius: 36rpx;
  font-size: 30rpx;
  font-weight: bold;
  border: none;
  line-height: 1;
}
</style>
