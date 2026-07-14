<script setup lang="ts">
import { ref, computed } from 'vue'
import { postLoginWxMinAPI, postLoginWxMinSimpleAPI } from '@/services/login'
import { useMemberStore } from '@/stores'
import type { LoginResult, UserRole } from '@/types/member'
import { onLoad } from '@dcloudio/uni-app'
import { MOCK_USER, MOCK_ENTERPRISE } from '@/config/constants'

// 当前选中的登录角色
const activeRole = ref<UserRole>('user')

// 企业端手机号
const enterprisePhone = ref(MOCK_ENTERPRISE.PHONE)

// #ifdef MP-WEIXIN
// 获取code登录凭证
let code = ''
onLoad(async () => {
  const res = await uni.login()
  code = res.code
})
// #endif

// 切换角色
const switchRole = (role: UserRole) => {
  activeRole.value = role
}

// 获取用户手机号码-微信授权
const onGetPhoneNumber: UniHelper.ButtonOnGetphonenumber = async (ev) => {
  const encryptedData = ev.detail!.encryptedData!
  const iv = ev.detail?.iv!
  try {
    const res = await postLoginWxMinAPI({ code, encryptedData, iv }, activeRole.value)
    loginSuccess(res.result)
  } catch (e) {
    uni.showToast({ icon: 'none', title: '登录失败，请重试' })
  }
}

// 模拟快捷登录
const onGetPhoneNumberSimple = async () => {
  try {
    const phone = activeRole.value === 'enterprise' ? enterprisePhone.value : MOCK_USER.PHONE
    const res = await postLoginWxMinSimpleAPI(phone, activeRole.value)
    loginSuccess(res.result)
  } catch (e) {
    uni.showToast({ icon: 'none', title: '登录失败，请重试' })
  }
}

// 企业端登录
const onEnterpriseLogin = async () => {
  if (!enterprisePhone.value.trim()) {
    uni.showToast({ icon: 'none', title: '请输入企业账号手机号' })
    return
  }
  try {
    const res = await postLoginWxMinSimpleAPI(enterprisePhone.value, 'enterprise')
    loginSuccess(res.result)
  } catch (e) {
    uni.showToast({ icon: 'none', title: '登录失败，请重试' })
  }
}

// 登录成功
const loginSuccess = (profile: LoginResult) => {
  const memberStore = useMemberStore()
  memberStore.setProfile(profile)
  uni.showToast({
    icon: 'success',
    title: profile.role === 'enterprise' ? '企业端登录成功' : '登录成功',
  })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/index/index' })
  }, 30)
}

// 角色描述
const roleDesc = computed(() => {
  return activeRole.value === 'enterprise'
    ? '企业端可上架商品、管理优惠码、查看订单'
    : '用户端可浏览商品、下单购买、分享赚优惠'
})
</script>

<template>
  <view class="viewport">
    <view class="logo">
      <image src="/static/images/logo_icon.png"></image>
      <text class="app-name">鲜渔岛</text>
    </view>

    <!-- 角色切换 Tab -->
    <view class="role-tabs">
      <view
        class="role-tab"
        :class="{ active: activeRole === 'user' }"
        @tap="switchRole('user')"
      >
        <text class="tab-icon">👤</text>
        <text class="tab-text">用户端</text>
      </view>
      <view
        class="role-tab"
        :class="{ active: activeRole === 'enterprise' }"
        @tap="switchRole('enterprise')"
      >
        <text class="tab-icon">🏢</text>
        <text class="tab-text">企业端</text>
      </view>
    </view>

    <!-- 角色描述 -->
    <view class="role-desc">
      <text>{{ roleDesc }}</text>
    </view>

    <!-- 登录区 -->
    <view class="login">
      <!-- 用户端登录 -->
      <template v-if="activeRole === 'user'">
        <!-- #ifdef MP-WEIXIN -->
        <button class="button phone" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
          <text class="icon icon-phone"></text>
          手机号快捷登录
        </button>
        <!-- #endif -->
        <view class="extra">
          <view class="caption">
            <text>其他登录方式</text>
          </view>
          <view class="options">
            <button @tap="onGetPhoneNumberSimple">
              <text class="icon icon-phone">模拟快捷登录</text>
            </button>
          </view>
        </view>
      </template>

      <!-- 企业端登录 -->
      <template v-else>
        <view class="enterprise-form">
          <view class="form-item">
            <text class="form-label">企业账号手机号</text>
            <input
              v-model="enterprisePhone"
              class="form-input"
              type="number"
              placeholder="请输入企业账号手机号"
              :maxlength="11"
            />
          </view>
          <button class="button enterprise-btn" @tap="onEnterpriseLogin">
            <text class="icon">🔐</text>
            企业端登录
          </button>
          <!-- #ifdef MP-WEIXIN -->
          <button class="button phone" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
            <text class="icon icon-phone"></text>
            微信授权登录
          </button>
          <!-- #endif -->
        </view>
      </template>

      <view class="tips">登录/注册即视为你同意《服务条款》和《鲜渔岛隐私协议》</view>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
}

.viewport {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20rpx 40rpx;
}

.logo {
  text-align: center;
  margin-top: 10vh;

  image {
    width: 160rpx;
    height: 160rpx;
  }

  .app-name {
    display: block;
    font-size: 36rpx;
    font-weight: bold;
    color: #0066cc;
    margin-top: 16rpx;
  }
}

/* 角色切换 Tab */
.role-tabs {
  display: flex;
  margin: 40rpx 20rpx 0;
  background: #f0f4f8;
  border-radius: 16rpx;
  padding: 8rpx;
}

.role-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx 0;
  border-radius: 12rpx;
  transition: all 0.25s ease;

  .tab-icon {
    font-size: 36rpx;
  }

  .tab-text {
    font-size: 30rpx;
    font-weight: 600;
    color: #666;
  }

  &.active {
    background: #fff;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);

    .tab-text {
      color: #0066cc;
    }
  }
}

/* 角色描述 */
.role-desc {
  text-align: center;
  padding: 24rpx 40rpx;
  margin: 0 20rpx;

  text {
    font-size: 24rpx;
    color: #999;
  }
}

/* 登录区 */
.login {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20rpx;

  .button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 88rpx;
    font-size: 30rpx;
    border-radius: 72rpx;
    color: #fff;
    margin-bottom: 24rpx;

    .icon {
      font-size: 36rpx;
      margin-right: 10rpx;
    }
  }

  .phone {
    background-color: #28bb9c;
  }

  .enterprise-btn {
    background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  }

  .extra {
    flex: 1;
    padding: 70rpx 70rpx 0;
    .caption {
      width: 440rpx;
      line-height: 1;
      border-top: 1rpx solid #ddd;
      font-size: 26rpx;
      color: #999;
      position: relative;
      text {
        transform: translate(-40%);
        background-color: #fff;
        position: absolute;
        top: -12rpx;
        left: 50%;
      }
    }

    .options {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 70rpx;
      button {
        padding: 0;
        background-color: transparent;
        &::after {
          border: none;
        }
      }
    }

    .icon {
      font-size: 24rpx;
      color: #444;
      display: flex;
      flex-direction: column;
      align-items: center;

      &::before {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80rpx;
        height: 80rpx;
        margin-bottom: 6rpx;
        font-size: 40rpx;
        border: 1rpx solid #444;
        border-radius: 50%;
      }
    }
  }
}

/* 企业端表单 */
.enterprise-form {
  .form-item {
    margin-bottom: 30rpx;

    .form-label {
      display: block;
      font-size: 26rpx;
      color: #555;
      margin-bottom: 12rpx;
    }

    .form-input {
      width: 100%;
      height: 88rpx;
      font-size: 30rpx;
      border-radius: 16rpx;
      border: 2rpx solid #ddd;
      padding-left: 24rpx;
      box-sizing: border-box;
    }
  }
}

.tips {
  position: absolute;
  bottom: 80rpx;
  left: 20rpx;
  right: 20rpx;
  font-size: 22rpx;
  color: #999;
  text-align: center;
}
</style>
