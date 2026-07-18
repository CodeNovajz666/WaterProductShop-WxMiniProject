<script setup lang="ts">
import type { ProfileDetail, ProfileParams, Gender } from '@/types/member'
import { getMemberProfileAPI, putMemberProfileAPI, putMemberAvatarAPI } from '@/services/profile'
import { useMemberStore } from '@/stores'
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSafeAreaInsets } from '@/utils/system'

// 安全区域
const safeAreaInsets = getSafeAreaInsets()

// 获取个人信息
const profile = ref<ProfileDetail>()
const loading = ref(true)

// 表单数据（可编辑字段）
const formData = ref<ProfileParams>({
  nickname: '',
  gender: undefined,
  birthday: '',
  profession: '',
  fullLocation: '',
  provinceCode: undefined,
  cityCode: undefined,
  countyCode: undefined,
})

// 生日选择的最大日期（今天）
const maxBirthday = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

// 加载个人信息
const getMemberProfileData = async () => {
  loading.value = true
  try {
    const res = await getMemberProfileAPI()
    profile.value = res.result
    syncFormData()
  } catch {
    uni.showToast({ icon: 'none', title: '加载失败' })
  } finally {
    loading.value = false
  }
}

// 同步 profile 数据到表单
const syncFormData = () => {
  if (!profile.value) return
  formData.value = {
    nickname: profile.value.nickname || '',
    gender: profile.value.gender,
    birthday: profile.value.birthday || '',
    profession: profile.value.profession || '',
    fullLocation: profile.value.fullLocation || '',
    provinceCode: undefined,
    cityCode: undefined,
    countyCode: undefined,
  }
}

// 将图片转为 base64（跨平台兼容）
const fileToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(`data:image/png;base64,${res.data}`),
      fail: reject,
    })
    // #endif
    // #ifdef H5
    uni.request({
      url: filePath,
      method: 'GET',
      responseType: 'arraybuffer',
      success: (res) => {
        const base64 = arrayBufferToBase64(res.data as ArrayBuffer)
        resolve(`data:image/png;base64,${base64}`)
      },
      fail: reject,
    })
    // #endif
  })
}

// ArrayBuffer 转 base64（H5 环境）
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  // #ifdef H5
  return btoa(binary)
  // #endif
  // #ifndef H5
  return binary
  // #endif
}

// 修改头像
const onAvatarChange = () => {
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sizeType: ['compressed'],
    success: async (res) => {
      const tempFile = res.tempFiles[0]
      const tempFilePath = tempFile.tempFilePath

      uni.showLoading({ title: '上传中...' })

      try {
        // 将图片转为 base64 存储（解决临时路径失效问题）
        let avatarUrl = tempFilePath
        try {
          avatarUrl = await fileToBase64(tempFilePath)
        } catch {
          // 转 base64 失败时降级使用临时路径
          avatarUrl = tempFilePath
        }

        // 调用头像更新 API（保存到 localStorage）
        const res = await putMemberAvatarAPI(avatarUrl)
        profile.value = res.result

        // 同步更新 memberStore
        const memberStore = useMemberStore()
        if (memberStore.profile) {
          memberStore.profile.avatar = avatarUrl
        }

        uni.hideLoading()
        uni.showToast({ icon: 'success', title: '头像更新成功' })
      } catch {
        uni.hideLoading()
        uni.showToast({ icon: 'none', title: '头像更新失败' })
      }
    },
    fail: (err) => {
      // 用户取消选择不提示错误
      if (err.errMsg?.includes('cancel')) return
      uni.showToast({ icon: 'none', title: '选择图片失败' })
    },
  })
}

// 性别选择
const onGenderChange = (ev: any) => {
  formData.value.gender = ev.detail.value as Gender
}

// 生日选择
const onBirthdayChange = (ev: any) => {
  formData.value.birthday = ev.detail.value
}

// 省市区选择
const onRegionChange = (ev: any) => {
  const { detail } = ev
  const fullLocation = detail.value.join(' ')
  formData.value.fullLocation = fullLocation
  if (profile.value) {
    profile.value.fullLocation = fullLocation
  }
  formData.value.provinceCode = detail.code?.[0]
  formData.value.cityCode = detail.code?.[1]
  formData.value.countyCode = detail.code?.[2]
}

// 保存个人信息
const onSave = async () => {
  if (!formData.value.nickname?.trim()) {
    uni.showToast({ icon: 'none', title: '请填写昵称' })
    return
  }

  uni.showLoading({ title: '保存中...' })
  try {
    const res = await putMemberProfileAPI(formData.value)
    profile.value = res.result

    // 同步更新会员 Store 中的昵称/头像
    const memberStore = useMemberStore()
    if (memberStore.profile) {
      memberStore.profile.nickname = res.result.nickname
      memberStore.profile.avatar = res.result.avatar
    }

    uni.hideLoading()
    uni.showToast({ icon: 'success', title: '保存成功', duration: 500 })
    setTimeout(() => uni.navigateBack(), 300)
  } catch {
    uni.hideLoading()
    uni.showToast({ icon: 'none', title: '保存失败，请重试' })
  }
}

onLoad(() => {
  getMemberProfileData()
})
</script>

<template>
  <view class="viewport">
    <!-- 导航栏 -->
    <view class="navbar" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
      <navigator open-type="navigateBack" class="back icon-left" hover-class="none"></navigator>
      <view class="title">个人信息</view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <template v-else-if="profile">
      <!-- 头像 -->
      <view class="avatar">
        <view @tap="onAvatarChange" class="avatar-content">
          <image class="image" :src="profile.avatar" mode="aspectFill" />
          <text class="text">点击修改头像</text>
        </view>
      </view>

      <!-- 表单 -->
      <view class="form">
        <!-- 表单内容 -->
        <view class="form-content">
          <view class="form-item">
            <text class="label">账号</text>
            <text class="account">{{ profile.account }}</text>
          </view>
          <view class="form-item">
            <text class="label">昵称</text>
            <input class="input" type="text" placeholder="请填写昵称" v-model="formData.nickname" :maxlength="20" />
          </view>
          <view class="form-item">
            <text class="label">性别</text>
            <radio-group @change="onGenderChange">
              <label class="radio">
                <radio value="男" color="#27ba9b" :checked="formData.gender === '男'" />
                男
              </label>
              <label class="radio">
                <radio value="女" color="#27ba9b" :checked="formData.gender === '女'" />
                女
              </label>
            </radio-group>
          </view>
          <view class="form-item">
            <text class="label">生日</text>
            <picker
              class="picker"
              mode="date"
              :value="formData.birthday"
              start="1900-01-01"
              :end="maxBirthday"
              @change="onBirthdayChange"
            >
              <view v-if="formData.birthday">{{ formData.birthday }}</view>
              <view class="placeholder" v-else>请选择日期</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="label">城市</text>
            <picker
              class="picker"
              :value="profile.fullLocation ? profile.fullLocation.split(' ') : []"
              mode="region"
              @change="onRegionChange"
            >
              <view v-if="formData.fullLocation">{{ formData.fullLocation }}</view>
              <view class="placeholder" v-else>请选择城市</view>
            </picker>
          </view>
          <view class="form-item">
            <text class="label">职业</text>
            <input class="input" type="text" placeholder="请填写职业" v-model="formData.profession" :maxlength="20" />
          </view>
        </view>
        <!-- 提交按钮 -->
        <button class="form-button" @tap="onSave">保 存</button>
      </view>
    </template>
  </view>
</template>

<style lang="scss">
page {
  background-color: #f4f4f4;
}

.viewport {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background-image: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  background-size: auto 420rpx;
  background-repeat: no-repeat;
}

// 导航栏
.navbar {
  position: relative;

  .title {
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }

  .back {
    position: absolute;
    height: 40px;
    width: 40px;
    left: 0;
    font-size: 20px;
    color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

// 加载状态
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
}

// 头像
.avatar {
  text-align: center;
  width: 100%;
  height: 260rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .avatar-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background-color: #eee;
  }

  .text {
    display: block;
    padding-top: 20rpx;
    line-height: 1;
    font-size: 26rpx;
    color: #fff;
  }
}

// 表单
.form {
  flex: 1;
  background-color: #f4f4f4;

  &-content {
    margin: 20rpx 20rpx 0;
    padding: 0 20rpx;
    border-radius: 10rpx;
    background-color: #fff;
  }

  &-item {
    display: flex;
    height: 96rpx;
    line-height: 46rpx;
    padding: 25rpx 10rpx;
    background-color: #fff;
    font-size: 28rpx;
    border-bottom: 1rpx solid #ddd;

    &:last-child {
      border: none;
    }

    .label {
      width: 180rpx;
      color: #333;
    }

    .account {
      color: #666;
    }

    .input {
      flex: 1;
      display: block;
      height: 46rpx;
    }

    .radio {
      margin-right: 20rpx;
    }

    .picker {
      flex: 1;
    }
    .placeholder {
      color: #808080;
    }
  }

  &-button {
    height: 80rpx;
    text-align: center;
    line-height: 80rpx;
    margin: 30rpx 20rpx;
    color: #fff;
    border-radius: 80rpx;
    font-size: 30rpx;
    background-color: #27ba9b;

    &:active {
      opacity: 0.85;
    }
  }
}
</style>
