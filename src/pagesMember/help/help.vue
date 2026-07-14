<script setup lang="ts">
import { ref } from 'vue'
import { getSafeAreaInsets } from '@/utils/system'

const safeAreaInsets = getSafeAreaInsets()

// 常见问题列表
const faqList = ref([
  {
    id: 1,
    question: '如何下单购买海鲜？',
    answer:
      '在首页或分类页选择您喜欢的海鲜商品，进入商品详情页选择规格和数量，点击"加入购物车"或"立即购买"即可下单。',
    expanded: false,
  },
  {
    id: 2,
    question: '配送范围和时效是怎样的？',
    answer:
      '我们支持全国大部分地区配送，一线城市24小时内送达，其他地区1-3天送达。部分偏远地区可能需要额外时间。所有海鲜均采用冷链配送，确保新鲜。',
    expanded: false,
  },
  {
    id: 3,
    question: '如何使用优惠码？',
    answer:
      '在商品详情页找到"优惠码"输入框，输入您获得的优惠码（如001、SEAFOOD2024等），点击"绑定"即可享受对应折扣。分享商品给好友也可获得专属优惠码。',
    expanded: false,
  },
  {
    id: 4,
    question: '收到的海鲜不新鲜怎么办？',
    answer:
      '我们承诺无忧退换货服务。如果收到的海鲜存在质量问题，请在签收后30天内联系客服，我们将为您提供退换货或退款服务。',
    expanded: false,
  },
  {
    id: 5,
    question: '如何查看订单状态？',
    answer:
      '在"我的"页面点击"我的订单"，可以查看全部订单。订单状态包括：待付款、待发货、待收货、待评价、已完成。',
    expanded: false,
  },
  {
    id: 6,
    question: '支持哪些支付方式？',
    answer: '目前支持微信支付，后续将接入更多支付方式，敬请期待。',
    expanded: false,
  },
])

// 服务保障列表
const serviceList = ref([
  { icon: '🛡️', title: '正品保证', desc: '所有海鲜均为产地直供' },
  { icon: '📦', title: '无忧退换', desc: '30天内可退换货' },
  { icon: '💰', title: '快速退款', desc: '48小时内办理退款' },
  { icon: '❄️', title: '冷链配送', desc: '全程冷链保鲜送达' },
])

// 展开/折叠 FAQ
const toggleFaq = (id: number) => {
  const item = faqList.value.find((i) => i.id === id)
  if (item) {
    item.expanded = !item.expanded
  }
}

// 返回上一页
const goBack = () => uni.navigateBack()

// 联系客服
const onContactService = () => {
  // #ifdef MP-WEIXIN
  uni.showToast({ title: '请通过设置页面联系客服', icon: 'none' })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showModal({
    title: '联系客服',
    content: '客服热线：400-888-XXXX\n服务时间：09:00 - 22:00',
    showCancel: false,
  })
  // #endif
}
</script>

<template>
  <view class="help-page" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
    <!-- 头部 -->
    <view class="page-header">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">帮助中心</text>
      <view class="header-right"></view>
    </view>

    <scroll-view scroll-y class="help-scroll">
      <!-- 服务保障 -->
      <view class="service-section">
        <view class="section-title">服务保障</view>
        <view class="service-grid">
          <view v-for="item in serviceList" :key="item.title" class="service-item">
            <view class="service-icon">{{ item.icon }}</view>
            <view class="service-info">
              <text class="service-title">{{ item.title }}</text>
              <text class="service-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 常见问题 -->
      <view class="faq-section">
        <view class="section-title">常见问题</view>
        <view class="faq-list">
          <view
            v-for="item in faqList"
            :key="item.id"
            class="faq-item"
            @tap="toggleFaq(item.id)"
          >
            <view class="faq-header">
              <text class="faq-question">{{ item.question }}</text>
              <text class="faq-arrow" :class="{ expanded: item.expanded }">▾</text>
            </view>
            <view v-if="item.expanded" class="faq-answer">
              <text>{{ item.answer }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 联系客服 -->
      <view class="contact-section">
        <view class="section-title">联系我们</view>
        <view class="contact-card" @tap="onContactService">
          <view class="contact-icon">📞</view>
          <view class="contact-info">
            <text class="contact-title">在线客服</text>
            <text class="contact-desc">09:00 - 22:00 在线为您服务</text>
          </view>
          <text class="contact-arrow">›</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f5f7fa;
}
</style>

<style lang="scss" scoped>
.help-page {
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

.help-scroll {
  flex: 1;
  padding: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #2d3436;
  margin: 20rpx 10rpx 20rpx;
}

/* 服务保障 */
.service-section {
  margin-bottom: 10rpx;
}

.service-grid {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.service-item {
  display: flex;
  align-items: center;
  padding: 24rpx 10rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.service-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e3fff8 0%, #d4f5ee 100%);
  border-radius: 50%;
  font-size: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.service-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2d3436;
}

.service-desc {
  font-size: 24rpx;
  color: #b2bec3;
  margin-top: 4rpx;
}

/* 常见问题 */
.faq-section {
  margin-bottom: 10rpx;
}

.faq-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.faq-item {
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.faq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 24rpx;
}

.faq-question {
  flex: 1;
  font-size: 30rpx;
  color: #2d3436;
  font-weight: 500;
}

.faq-arrow {
  font-size: 28rpx;
  color: #b2bec3;
  transition: transform 0.3s ease;

  &.expanded {
    transform: rotate(180deg);
  }
}

.faq-answer {
  padding: 0 24rpx 30rpx;

  text {
    font-size: 28rpx;
    color: #636e72;
    line-height: 1.8;
  }
}

/* 联系客服 */
.contact-section {
  margin-bottom: 10rpx;
}

.contact-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  &:active {
    background: #f8f9fa;
  }
}

.contact-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e3fff8 0%, #d4f5ee 100%);
  border-radius: 50%;
  font-size: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.contact-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.contact-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2d3436;
}

.contact-desc {
  font-size: 24rpx;
  color: #b2bec3;
  margin-top: 4rpx;
}

.contact-arrow {
  font-size: 36rpx;
  color: #ccc;
}

.bottom-space {
  height: 80rpx;
}
</style>
