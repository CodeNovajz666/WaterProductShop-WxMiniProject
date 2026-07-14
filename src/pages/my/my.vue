<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { WaterProductGuessInstance } from '@/types/components'
import WaterProductGuess from '@/components/WaterProductGuess.vue'
import { useMemberStore } from '@/stores'
import { getOrderCountsAPI } from '@/services/order'
import { getFavoriteCountAPI } from '@/services/favorites'
import { getUserCouponCountAPI } from '@/services/seafood'
import { onShow } from '@dcloudio/uni-app'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

// 订单类型（角标数量动态获取）
const orderTypes = reactive([
  { type: 1, text: '待付款', icon: 'icon-currency', badge: 0 },
  { type: 2, text: '待发货', icon: 'icon-gift', badge: 0 },
  { type: 3, text: '待收货', icon: 'icon-check', badge: 0 },
  { type: 4, text: '待评价', icon: 'icon-comment', badge: 0 },
  { type: 6, text: '售后', icon: 'icon-help', badge: 0 },
])

// 菜单项（收藏数量动态获取）
const menuItems = reactive([
  { id: 1, icon: 'icon-location', text: '收货地址', url: '/pagesMember/address/address', badge: 0 },
  { id: 2, icon: 'icon-star', text: '我的收藏', url: '/pagesMember/favorites/favorites', badge: 0 },
  { id: 3, icon: 'icon-comment', text: '我的评价', url: '/pages/my-comments/my-comments', badge: 0 },
  { id: 4, icon: 'icon-currency', text: '我的优惠码', url: '/pages/my-coupons/my-coupons', badge: 0 },
  { id: 5, icon: 'icon-help', text: '帮助中心', url: '/pagesMember/help/help', badge: 0 },
  { id: 6, icon: 'icon-settings', text: '企业端管理', url: '/pages/admin/admin', badge: 0 },
])

const memberStore = useMemberStore()
const guessRef = ref<WaterProductGuessInstance>()

// 是否为企业端用户
const isEnterprise = computed(() => memberStore.profile?.role === 'enterprise')

// 根据角色过滤菜单项（企业端管理仅企业端可见）
const visibleMenuItems = computed(() => {
  return menuItems.filter((item) => {
    if (item.id === 6) return isEnterprise.value
    return true
  })
})

// 获取订单各状态数量
const loadOrderCounts = async () => {
  try {
    const counts = await getOrderCountsAPI()
    orderTypes.forEach((item) => {
      if (item.type >= 1 && item.type <= 4) {
        item.badge = counts[item.type] || 0
      }
    })
  } catch {
    // 静默失败，角标保持 0
  }
}

// 获取收藏数量
const loadFavoriteCount = async () => {
  try {
    const count = await getFavoriteCountAPI()
    const favItem = menuItems.find((i) => i.id === 2)
    if (favItem) favItem.badge = count
  } catch {
    // 静默失败
  }
}

// 获取可用优惠码数量
const loadCouponCount = async () => {
  try {
    const res = await getUserCouponCountAPI()
    const couponItem = menuItems.find((i) => i.id === 4)
    if (couponItem) couponItem.badge = res.result
  } catch {
    // 静默失败
  }
}

// 刷新页面数据
const refreshData = () => {
  loadOrderCounts()
  loadFavoriteCount()
  loadCouponCount()
  // 重置猜你喜欢列表并重新加载第一页数据
  guessRef.value?.resetData()
  guessRef.value?.getMore()
}

const onScrolltolower = () => {
  guessRef.value?.getMore()
}

const onMenuItemTap = (url: string) => {
  uni.navigateTo({ url })
}

// 页面显示时刷新数据
onShow(() => {
  refreshData()
})
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
          <view class="nickname-row">
            <view class="nickname"> {{ memberStore.profile.nickname || memberStore.profile.account }} </view>
            <view v-if="isEnterprise" class="role-badge enterprise">
              <text>企业端</text>
            </view>
            <view v-else class="role-badge user">
              <text>用户端</text>
            </view>
          </view>
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
        <navigator class="navigator" url="/pages/order/order-list?type=0" hover-class="none">
          查看全部订单<text class="icon-right"></text>
        </navigator>
      </view>
      <view class="section">
        <navigator
          v-for="item in orderTypes"
          :key="item.type"
          :class="item.icon"
          :url="`/pages/order/order-list?type=${item.type}`"
          class="navigator"
          hover-class="none"
        >
          <view class="navigator-content">
            {{ item.text }}
            <view v-if="item.badge > 0" class="badge">{{ item.badge }}</view>
          </view>
        </navigator>
      </view>
    </view>

    <view class="menu">
      <view
        v-for="item in visibleMenuItems"
        :key="item.id"
        class="menu-item"
        @tap="onMenuItemTap(item.url)"
      >
        <text :class="['menu-icon', item.icon]"></text>
        <text class="menu-text">{{ item.text }}</text>
        <text v-if="item.badge > 0" class="menu-badge">{{ item.badge }}</text>
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

  .nickname-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;
  }

  .nickname {
    max-width: 280rpx;
    font-size: 32rpx;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .role-badge {
    padding: 4rpx 16rpx;
    border-radius: 8rpx;
    flex-shrink: 0;

    text {
      font-size: 20rpx;
      color: #fff;
    }

    &.enterprise {
      background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
    }

    &.user {
      background: #28bb9c;
    }
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
    .navigator {
      text-align: center;
      font-size: 24rpx;
      color: #666;
      &::before {
        display: block;
        font-size: 56rpx;
        color: #0099cc;
        margin-bottom: 10rpx;
      }

      .navigator-content {
        position: relative;
        display: inline-flex;
        align-items: center;
      }

      .badge {
        position: absolute;
        top: -16rpx;
        right: -24rpx;
        min-width: 32rpx;
        height: 32rpx;
        padding: 0 8rpx;
        background: #ff6b6b;
        border-radius: 16rpx;
        font-size: 20rpx;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
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

    .menu-badge {
      min-width: 36rpx;
      height: 36rpx;
      padding: 0 10rpx;
      margin-right: 12rpx;
      background: #ff6b6b;
      border-radius: 18rpx;
      font-size: 22rpx;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
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