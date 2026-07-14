<script setup lang="ts">
import type { ProfileDetail, ProfileParams, Gender } from '@/types/member'
import { getMemberProfileAPI, putMemberProfileAPI } from '@/services/profile'
import { useMemberStore } from '@/stores'
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getSafeAreaInsets } from '@/utils/system'

// 安全区域
const safeAreaInsets = getSafeAreaInsets()

// 获取个人信息
const profile = ref<ProfileDetail>()
const getMemberProfileData = async () => {
  const res = await getMemberProfileAPI()
  profile.value = res.result
}

// 表单数据（可编辑字段）
const formData = ref<ProfileParams>({
  nickname: '',
  gender: undefined,
  birthday: '',
  profession: '',
  provinceCode: undefined,
  cityCode: undefined,
  countyCode: undefined,
})

// 同步 profile 数据到表单
const syncFormData = () => {
  if (!profile.value) return
  formData.value = {
    nickname: profile.value.nickname || '',
    gender: profile.value.gender,
    birthday: profile.value.birthday || '',
    profession: profile.value.profession || '',
    provinceCode: undefined,
    cityCode: undefined,
    countyCode: undefined,
  }
}

// 修改头像
const onAvatarChange = () => {
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    success: (res) => {
      const { tempFilePath } = res.tempFiles[0]
      uni.uploadFile({
        url: '/member/profile/avatar',
        name: 'file',
        filePath: tempFilePath,
        success: (res) => {
          if (res.statusCode === 200) {
            const avatar = JSON.parse(res.data).result.avatar
            profile.value!.avatar = avatar
            uni.showToast({ icon: 'success', title: '更新成功' })
          } else {
            uni.showToast({ icon: 'error', title: '更新失败' })
          }
        },
        fail: () => {
          uni.showToast({ icon: 'error', title: '上传失败' })
        },
      })
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
  if (profile.value) {
    profile.value.fullLocation = detail.value.join(' ')
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
  try {
    const res = await putMemberProfileAPI(formData.value)
    profile.value = res.result
    // 同步更新会员 Store 中的昵称/头像
    const memberStore = useMemberStore()
    if (memberStore.profile) {
      memberStore.profile.nickname = res.result.nickname
      memberStore.profile.avatar = res.result.avatar
    }
    uni.showToast({ icon: 'success', title: '保存成功', duration: 500 })
    setTimeout(() => uni.navigateBack(), 300)
  } catch {
    uni.showToast({ icon: 'none', title: '保存失败，请重试' })
  }
}

onLoad(() => {
  getMemberProfileData().then(() => {
    syncFormData()
  })
})
</script>

<template>
  <view class="viewport">
    <!-- 导航栏 -->
    <view class="navbar" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
      <navigator open-type="navigateBack" class="back icon-left" hover-class="none"></navigator>
      <view class="title">个人信息</view>
    </view>
    <!-- 头像 -->
    <view class="avatar">
      <view @tap="onAvatarChange" class="avatar-content">
        <image class="image" :src="profile?.avatar" mode="aspectFill" />
        <text class="text">点击修改头像</text>
      </view>
    </view>
    <!-- 表单 -->
    <view class="form">
      <!-- 表单内容 -->
      <view class="form-content">
        <view class="form-item">
          <text class="label">账号</text>
          <text class="account">{{ profile?.account }}</text>
        </view>
        <view class="form-item">
          <text class="label">昵称</text>
          <input class="input" type="text" placeholder="请填写昵称" v-model="formData.nickname" />
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
            :end="new Date()"
            @change="onBirthdayChange"
          >
            <view v-if="formData.birthday">{{ formData.birthday }}</view>
            <view class="placeholder" v-else>请选择日期</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="label">城市</text>
          <picker class="picker" :value="profile?.fullLocation?.split(' ')" mode="region" @change="onRegionChange">
            <view v-if="profile?.fullLocation">{{ profile?.fullLocation }}</view>
            <view class="placeholder" v-else>请选择城市</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="label">职业</text>
          <input class="input" type="text" placeholder="请填写职业" v-model="formData.profession" />
        </view>
      </view>
      <!-- 提交按钮 -->
      <button class="form-button" @tap="onSave">保 存</button>
    </view>
  </view>
</template>

<style lang="scss">
page {
  background-color: #f4f4f4;
}

.viewport {
  display: flex;
  flex-direction: column;
  height: 100%;
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

// 头像
.avatar {
  text-align: center;
  width: 100%;
  height: 260rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

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
  }
}
</style>
