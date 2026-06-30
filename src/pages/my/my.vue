<script setup lang="ts">
import { ref } from 'vue'
import type { WaterProductGuessInstance } from '@/types/components'
import WaterProductGuess from '@/components/WaterProductGuess.vue'
import { useMemberStore } from '@/stores'

const { safeAreaInsets } = uni.getSystemInfoSync()

const orderTypes = [
  { type: 1, text: '待付款', icon: 'icon-currency' },
  { type: 2, text: '待发货', icon: 'icon-gift' },
  { type: 3, text: '待收货', icon: 'icon-check' },
  { type: 4, text: '待评价', icon: 'icon-comment' },
]

const menuItems = [
  { id: 1, icon: 'icon-location', text: '收货地址', url: '/pagesMember/address/address' },
  { id: 2, icon: 'icon-star', text: '我的收藏', url: '/pagesMember/favorites/favorites' },
  { id: 3, icon: 'icon-help', text: '帮助中心', url: '/pagesMember/help/help' },
]

const memberStore = useMemberStore()
const guessRef = ref<WaterProductGuessInstance>()

const onScrolltolower = () => {
  guessRef.value?.getMore()
}

const onMenuItemTap = (url: string) => {
  uni.navigateTo({ url })
}
</script>

<template>
  <scroll-view @scrolltolower="onScrolltolower" class="viewport" scroll-y enable-back-to-top>
    <view class="profile" :style="{ paddingTop: safeAreaInsets!.top + 'px' }">
      <view class="overview" v-if="memberStore.profile">
        <navigator url="/pagesMember/profile/profile" hover-class="none">
          <image
            class="avatar"
            mode="aspectFill"
            :src="memberStore.profile.avatar"
          ></image>
        </navigator>
        <view class="meta">
          <view class="nickname"> {{ memberStore.profile.nickname || memberStore.profile.account }} </view>
          <navigator class="extra" url="/pagesMember/profile/profile" hover-class="none">
            <text class="update">更新头像昵称</text>
          </navigator>
        </view>
      </view>
      <view class="overview" v-else>
        <navigator url="/pages/login/login" hover-class="none">
          <image
            class="avatar gray"
            mode="aspectFill"
            src="/static/images/logo_icon.png"
          ></image>
        </navigator>
        <view class="meta">
          <navigator url="/pages/login/login" hover-class="none" class="nickname">
            未登录
          </navigator>
          <view class="extra">
            <text class="tips">点击登录账号</text>
          </view>
        </view>
      </view>
      <navigator class="settings" url="/pagesMember/settings/settings" hover-class="none">
        设置
      </navigator>
    </view>

    <view class="orders">
      <view class="title">
        我的订单
        <navigator class="navigator" url="/pagesOrder/list/list?type=0" hover-class="none">
          查看全部订单<text class="icon-right"></text>
        </navigator>
      </view>
      <view class="section">
        <navigator
          v-for="item in orderTypes"
          :key="item.type"
          :class="item.icon"
          :url="`/pagesOrder/list/list?type=${item.type}`"
          class="navigator"
          hover-class="none"
        >
          {{ item.text }}
        </navigator>
        <button class="contact icon-handset" open-type="contact">售后</button>
      </view>
    </view>

    <view class="menu">
      <view
        v-for="item in menuItems"
        :key="item.id"
        class="menu-item"
        @tap="onMenuItemTap(item.url)"
      >
        <text :class="['menu-icon', item.icon]"></text>
        <text class="menu-text">{{ item.text }}</text>
        <text class="menu-arrow"></text>
      </view>
    </view>

    <view class="guess">
      <WaterProductGuess ref="guessRef" />
    </view>
  </scroll-view>
</template>

<style lang="scss">
page {
  height: 100%;
  overflow: hidden;
  background-color: #f7f7f8;
}

.viewport {
  height: 100%;
  background-repeat: no-repeat;
  background-image: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  background-size: 100% auto;
}

.profile {
  margin-top: 20rpx;
  position: relative;

  .overview {
    display: flex;
    height: 120rpx;
    padding: 0 36rpx;
    color: #fff;
  }

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    background-color: #eee;
    border: 4rpx solid rgba(255, 255, 255, 0.5);
  }

  .gray {
    filter: grayscale(100%);
  }

  .meta {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    line-height: 30rpx;
    padding: 16rpx 0;
    margin-left: 20rpx;
  }

  .nickname {
    max-width: 350rpx;
    margin-bottom: 16rpx;
    font-size: 32rpx;
    font-weight: bold;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .extra {
    display: flex;
    font-size: 20rpx;
  }

  .tips {
    font-size: 24rpx;
    opacity: 0.8;
  }

  .update {
    padding: 3rpx 10rpx 1rpx;
    color: rgba(255, 255, 255, 0.9);
    border: 1rpx solid rgba(255, 255, 255, 0.9);
    margin-right: 10rpx;
    border-radius: 30rpx;
    font-size: 22rpx;
  }

  .settings {
    position: absolute;
    bottom: 0;
    right: 40rpx;
    font-size: 30rpx;
    color: #fff;
  }
}

.orders {
  position: relative;
  z-index: 99;
  padding: 30rpx;
  margin: 50rpx 20rpx 0;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  .title {
    height: 40rpx;
    line-height: 40rpx;
    font-size: 30rpx;
    color: #333;
    font-weight: bold;

    .navigator {
      font-size: 24rpx;
      color: #0066cc;
      float: right;
    }
  }

  .section {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 40rpx 20rpx 10rpx;
    .navigator,
    .contact {
      text-align: center;
      font-size: 24rpx;
      color: #666;
      &::before {
        display: block;
        font-size: 56rpx;
        color: #0099cc;
        margin-bottom: 10rpx;
      }
    }
    .contact {
      padding: 0;
      margin: 0;
      border: 0;
      background-color: transparent;
      line-height: inherit;
    }
  }
}

.menu {
  position: relative;
  z-index: 99;
  margin: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .menu-icon {
      width: 48rpx;
      height: 48rpx;
      margin-right: 20rpx;
      font-size: 48rpx;
      color: #0099cc;
    }

    .menu-text {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .menu-arrow {
      font-size: 24rpx;
      color: #ccc;
    }
  }
}

.guess {
  background-color: #f7f7f8;
  margin-top: 20rpx;
}
</style>