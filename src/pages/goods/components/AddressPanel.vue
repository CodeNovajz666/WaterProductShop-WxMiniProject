<script setup lang="ts">
import type { AddressItem } from '@/types/address'
import { getMemberAddressAPI } from '@/services/address'
import { useAddressStore } from '@/stores/modules/address'
import { ref, onMounted } from 'vue'

// 选中的地址 ID
const selectedId = ref<string>('')

// 地址列表
const addressList = ref<AddressItem[]>([])
const loading = ref(false)

// 获取地址列表
const getAddressList = async () => {
  loading.value = true
  try {
    const res = await getMemberAddressAPI()
    addressList.value = res.result
    // 默认选中默认地址或第一条
    const defaultAddr = addressList.value.find((a) => a.isDefault === 1)
    selectedId.value = defaultAddr?.id || addressList.value[0]?.id || ''
  } catch {
    addressList.value = []
  } finally {
    loading.value = false
  }
}

// 选择地址
const onSelectAddress = (item: AddressItem) => {
  selectedId.value = item.id
  const addressStore = useAddressStore()
  addressStore.changeSelectedAddress(item)
  emit('close')
}

// 新建地址
const onNewAddress = () => {
  uni.navigateTo({ url: '/pagesMember/address-form/address-form' })
}

// 关闭面板
const emit = defineEmits<{
  (e: 'close'): void
}>()

const onClose = () => {
  emit('close')
}

onMounted(() => {
  getAddressList()
})
</script>

<template>
  <view class="address-panel">
    <!-- 关闭按钮 -->
    <text class="close icon-close" @tap="onClose"></text>
    <!-- 标题 -->
    <view class="title">配送至</view>
    <!-- 内容 -->
    <view class="content">
      <view v-if="loading" class="loading-tip">
        <text class="tip-text">加载中...</text>
      </view>
      <view v-else-if="addressList.length === 0" class="empty-tip">
        <text class="tip-text">暂无收货地址</text>
      </view>
      <view v-else v-for="item in addressList" :key="item.id" class="item" @tap="onSelectAddress(item)">
        <view class="user">
          {{ item.receiver }} {{ item.contact }}
          <text v-if="item.isDefault" class="default-tag">默认</text>
        </view>
        <view class="address">{{ item.fullLocation }} {{ item.address }}</view>
        <text class="icon" :class="selectedId === item.id ? 'icon-checked' : 'icon-ring'"></text>
      </view>
    </view>
    <view class="footer">
      <view class="button primary" @tap="onNewAddress">新建地址</view>
    </view>
  </view>
</template>

<style lang="scss">
.address-panel {
  padding: 0 30rpx;
  border-radius: 10rpx 10rpx 0 0;
  position: relative;
  background-color: #fff;
}

.title {
  line-height: 1;
  padding: 40rpx 0;
  text-align: center;
  font-size: 32rpx;
  font-weight: normal;
  border-bottom: 1rpx solid #ddd;
  color: #444;
}

.close {
  position: absolute;
  right: 24rpx;
  top: 24rpx;
  font-size: 32rpx;
  color: #999;
  z-index: 1;
}

.content {
  min-height: 300rpx;
  max-height: 540rpx;
  overflow: auto;
  padding: 20rpx;
  .item {
    padding: 30rpx 50rpx 30rpx 60rpx;
    position: relative;
    &::before {
      content: '📍';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      font-size: 36rpx;
    }
  }
  .icon {
    color: #999;
    font-size: 40rpx;
    transform: translateY(-50%);
    position: absolute;
    top: 50%;
    right: 0;
  }
  .icon-checked {
    color: #27ba9b;
  }
  .icon-ring {
    color: #444;
  }
  .user {
    font-size: 28rpx;
    color: #444;
    font-weight: 500;
    display: flex;
    align-items: center;
  }
  .default-tag {
    font-size: 20rpx;
    color: #fff;
    background: #27ba9b;
    padding: 2rpx 12rpx;
    border-radius: 6rpx;
    margin-left: 16rpx;
  }
  .address {
    font-size: 26rpx;
    color: #666;
    margin-top: 8rpx;
  }
}

.loading-tip,
.empty-tip {
  text-align: center;
  padding: 60rpx 0;
  .tip-text {
    font-size: 28rpx;
    color: #999;
  }
}

.footer {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0 40rpx;
  font-size: 28rpx;
  color: #444;

  .button {
    flex: 1;
    height: 72rpx;
    text-align: center;
    line-height: 72rpx;
    margin: 0 20rpx;
    color: #fff;
    border-radius: 72rpx;
  }

  .primary {
    color: #fff;
    background-color: #27ba9b;
  }
}
</style>
