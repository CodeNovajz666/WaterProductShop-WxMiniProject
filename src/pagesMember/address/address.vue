<script setup lang="ts">
import { deleteMemberAddressByIdAPI, getMemberAddressAPI } from '@/services/address'
import { useAddressStore } from '@/stores/modules/address'
import type { AddressItem } from '@/types/address'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

// 获取收货地址列表数据
const addressList = ref<AddressItem[]>([])
const getMemberAddressData = async () => {
  const res = await getMemberAddressAPI()
  addressList.value = res.result
}

// 初始化调用(页面显示)
onShow(() => {
  getMemberAddressData()
})

// 删除收货地址
const onDeleteAddress = (id: string) => {
  // 二次确认
  uni.showModal({
    content: '删除地址?',
    success: async (res) => {
      if (res.confirm) {
        // 根据id删除收货地址
        await deleteMemberAddressByIdAPI(id)
        // 重新获取收货地址列表
        getMemberAddressData()
      }
    },
  })
}

// 修改收货地址
const onChangeAddress = (item: AddressItem) => {
  // 修改地址
  const addressStore = useAddressStore()
  addressStore.changeSelectedAddress(item)
  // 返回上一页
  uni.navigateBack()
}
</script>

<template>
  <view class="viewport">
    <!-- 地址列表 -->
    <scroll-view enable-back-to-top class="scroll-view" scroll-y>
      <view v-if="addressList.length" class="address">
        <uni-swipe-action class="address-list">
          <!-- 收货地址项 -->
          <uni-swipe-action-item class="item" v-for="item in addressList" :key="item.id">
            <view class="item-content" @tap="onChangeAddress(item)">
              <view class="user">
                <text class="user-name">{{ item.receiver }}</text>
                <text class="contact">{{ item.contact }}</text>
                <text v-if="item.isDefault" class="badge">默认</text>
              </view>
              <view class="locate">
                <text class="locate-icon">📍</text>
                <text>{{ item.fullLocation }} {{ item.address }}</text>
              </view>
              <navigator
                class="edit"
                hover-class="none"
                :url="`/pagesMember/address-form/address-form?id=${item.id}`"
                @tap.stop="() => {}"
              >
                修改
              </navigator>
            </view>
            <!-- 右侧插槽 -->
            <template #right>
              <button @tap="onDeleteAddress(item.id)" class="delete-button">删除</button>
            </template>
          </uni-swipe-action-item>
        </uni-swipe-action>
      </view>
      <view v-else class="blank">
        <view class="blank-icon">📍</view>
        <text class="blank-text">暂无收货地址</text>
      </view>
    </scroll-view>
    <!-- 添加按钮 -->
    <view class="add-btn">
      <navigator hover-class="none" url="/pagesMember/address-form/address-form">
        + 新建地址
      </navigator>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  overflow: hidden;
  background-color: #f7f7f8;
}

.delete-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 160rpx;
  height: 100%;
  font-size: 30rpx;
  color: #fff;
  border-radius: 0;
  padding: 0;
  background-color: #cf4444;
}

.viewport {
  display: flex;
  flex-direction: column;
  height: 100%;

  .scroll-view {
    flex: 1;
    padding: 20rpx;
  }
}

.address {
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  .item-content {
    display: flex;
    flex-direction: column;
    padding: 36rpx;
    border-bottom: 1rpx solid #f5f5f5;
    position: relative;

    .edit {
      position: absolute;
      top: 36rpx;
      right: 36rpx;
      padding: 8rpx 20rpx;
      font-size: 26rpx;
      color: #666;
      background-color: #f5f5f5;
      border-radius: 8rpx;
    }
  }

  .item:last-child .item-content {
    border: none;
  }

  .user {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;

    .user-name {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      margin-right: 20rpx;
    }

    .contact {
      font-size: 28rpx;
      color: #666;
      margin-right: 16rpx;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 6rpx 16rpx;
      font-size: 22rpx;
      color: #27ba9b;
      border-radius: 6rpx;
      border: 1rpx solid #27ba9b;
      background-color: rgba(39, 186, 155, 0.08);
    }
  }

  .locate {
    display: flex;
    align-items: flex-start;
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;

    .locate-icon {
      font-size: 28rpx;
      color: #27ba9b;
      margin-right: 8rpx;
      flex-shrink: 0;
    }
  }
}

.blank {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 200rpx;

  .blank-icon {
    width: 160rpx;
    height: 160rpx;
    background-color: #f0f0f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    color: #ccc;
    margin-bottom: 30rpx;
  }

  .blank-text {
    font-size: 30rpx;
    color: #999;
  }
}

.add-btn {
  height: 88rpx;
  text-align: center;
  line-height: 88rpx;
  margin: 30rpx 20rpx;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #27ba9b 0%, #1a8f78 100%);
  box-shadow: 0 6rpx 20rpx rgba(39, 186, 155, 0.4);
}
</style>
