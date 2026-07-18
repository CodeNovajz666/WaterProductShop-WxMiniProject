<script setup lang="ts">
import type { SeafoodItem, CouponCode, Review } from '@/types/seafood'
import type { AddressItem } from '@/types/address'
import type { CheckoutItem } from '@/types/order'
import { getSeafoodItemByIdAPI, getCouponCodesAPI, getReviewsByGoodsIdAPI, getReviewStatsAPI, claimCouponAPI } from '@/services/seafood'
import { postMemberShopAPI, getMemberShopAPI } from '@/services/shop'
import { isFavoritedAPI, toggleFavoriteAPI } from '@/services/favorites'
import { getMemberAddressAPI } from '@/services/address'
import { useAddressStore } from '@/stores/modules/address'
import { onLoad, onShow, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { PURCHASE_LIMITS, COUPON_CODES } from '@/config/constants'
import AddressPanel from './components/AddressPanel.vue'
import { getSafeAreaInsets } from '@/utils/system'
import { useLoginGuard } from '@/utils/loginGuard'

const safeAreaInsets = getSafeAreaInsets()
const { requireLogin } = useLoginGuard()

const goodsId = ref('')
const goods = ref<SeafoodItem>()
const isCollected = ref(false)
const cartCount = ref(0)
const buyCount = ref(1)
const couponCodeInput = ref('')
const appliedCoupon = ref<CouponCode | null>(null)
const goodsReviews = ref<Review[]>([])
const reviewStats = ref({ total: 0, avgRating: 0 })
const loading = ref(false)
const couponList = ref<CouponCode[]>([])

// 收货地址
const selectedAddress = ref<AddressItem>()
const showAddressPanel = ref(false)
const showShareModal = ref(false)

const currentPrice = computed(() => {
  if (!goods.value) return 0
  return goods.value.price
})

const discountPrice = computed(() => {
  if (!appliedCoupon.value) return currentPrice.value
  const total = currentPrice.value * buyCount.value
  if (total < appliedCoupon.value.minAmount) return currentPrice.value

  if (appliedCoupon.value.discountType === 'percent') {
    return Math.round(currentPrice.value * (100 - appliedCoupon.value.discount) / 100)
  } else {
    return Math.max(0, currentPrice.value - appliedCoupon.value.discount / buyCount.value)
  }
})

// 获取商品详情（优先加载，不阻塞渲染）
const getGoodsByIdData = async () => {
  if (!goodsId.value) return
  loading.value = true
  try {
    // 商品详情优先加载，立即渲染
    const goodsRes = await getSeafoodItemByIdAPI(goodsId.value)
    goods.value = goodsRes.result
  } finally {
    loading.value = false
  }
  // 评价列表、统计和收藏状态异步加载，不阻塞详情渲染
  getReviewsByGoodsIdAPI(goodsId.value).then((res) => {
    goodsReviews.value = res.result
  })
  getReviewStatsAPI(goodsId.value).then((res) => {
    reviewStats.value = res.result
  })
  isFavoritedAPI(goodsId.value).then((fav) => {
    isCollected.value = fav
  })
}

// 预览评价图片
const onPreviewReviewImage = (current: string, urls: string[]) => {
  uni.previewImage({ current, urls })
}

// 格式化评价时间
const formatReviewTime = (iso: string): string => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)}天前`
  return d.toLocaleDateString('zh-CN')
}

// 获取优惠券列表
const getCouponCodesData = async () => {
  const res = await getCouponCodesAPI()
  couponList.value = res.result
}

// 获取购物车商品数量（同步底部角标）
const loadCartCount = async () => {
  try {
    const res = await getMemberShopAPI()
    cartCount.value = res.result.reduce((sum, item) => sum + item.count, 0)
  } catch {
    // 降级：读取本地存储
    try {
      const stored = uni.getStorageSync('seafood_cart')
      if (stored) {
        const items = JSON.parse(stored)
        cartCount.value = items.reduce((sum: number, item: any) => sum + item.count, 0)
      } else {
        cartCount.value = 0
      }
    } catch {
      cartCount.value = 0
    }
  }
}

// 获取收货地址
const loadAddress = async () => {
  // 优先使用 addressStore 中已选择的地址
  const addressStore = useAddressStore()
  if (addressStore.selectedAddress) {
    selectedAddress.value = addressStore.selectedAddress
    return
  }
  try {
    const res = await getMemberAddressAPI()
    const list = res.result
    const defaultAddr = list.find((a) => a.isDefault === 1)
    selectedAddress.value = defaultAddr || list[0]
  } catch {
    // 静默失败
  }
}

// 打开地址面板
const onOpenAddressPanel = () => {
  showAddressPanel.value = true
}

// 关闭地址面板
const onCloseAddressPanel = () => {
  showAddressPanel.value = false
  // 从 addressStore 读取最新选中地址
  const addressStore = useAddressStore()
  if (addressStore.selectedAddress) {
    selectedAddress.value = addressStore.selectedAddress
  }
}

const autoApplyCoupon = () => {
  const storedCoupon = uni.getStorageSync('user_coupon')
  if (storedCoupon) {
    couponCodeInput.value = storedCoupon
    applyCoupon()
  }
}

onLoad((options) => {
  goodsId.value = options?.id || ''
  getGoodsByIdData()
  getCouponCodesData()
  loadAddress()

  if (options?.couponCode) {
    uni.setStorageSync('user_coupon', options.couponCode)
    couponCodeInput.value = options.couponCode
    setTimeout(() => {
      applyCoupon()
    }, 500)
  } else {
    autoApplyCoupon()
  }
})

// 页面显示时刷新购物车数量（节流：2秒内不重复请求）
let lastCartCountTime = 0
onShow(() => {
  const now = Date.now()
  if (now - lastCartCountTime < 2000) return
  lastCartCountTime = now
  loadCartCount()
})

const currentIndex = ref(0)
const onChange: UniHelper.SwiperOnChange = (ev) => {
  currentIndex.value = ev.detail.current
}

const onTapImage = (url: string) => {
  const imageUrl = goods.value?.image || ''
  uni.previewImage({
    current: url || imageUrl,
    urls: [imageUrl, imageUrl, imageUrl],
  })
}

const decreaseCount = () => {
  if (buyCount.value <= 1) return
  buyCount.value--
}

const increaseCount = () => {
  if (buyCount.value >= PURCHASE_LIMITS.MAX_BUY_COUNT) return
  buyCount.value++
}

// 加入购物车：优先调用后端 API，失败时降级到本地存储
const onAddCart = async () => {
  // 登录校验
  if (!requireLogin()) return

  const skuId = `${goods.value?.id}-标准装`
  const count = buyCount.value

  try {
    await postMemberShopAPI({ skuId, count })
    cartCount.value += count
    uni.showToast({ title: '添加成功', icon: 'success' })
  } catch {
    // API 失败降级：写入本地存储
    const STORAGE_KEY = 'seafood_cart'
    let cartItems: any[] = []
    try {
      const stored = uni.getStorageSync(STORAGE_KEY)
      if (stored) {
        cartItems = JSON.parse(stored)
      }
    } catch {
      cartItems = []
    }

    const existingItem = cartItems.find(
      (item) => item.id === goods.value?.id && item.attrsText === '标准装',
    )

    if (existingItem) {
      existingItem.count += count
    } else {
      cartItems.push({
        id: goods.value?.id || '',
        skuId,
        name: goods.value?.name || '',
        picture: goods.value?.image || '',
        price: goods.value?.oldPrice || goods.value?.price || 0,
        nowPrice: currentPrice.value,
        count,
        stock: 99,
        selected: true,
        attrsText: '标准装',
        isEffective: true,
      })
    }

    uni.setStorageSync(STORAGE_KEY, JSON.stringify(cartItems))
    cartCount.value += count
    uni.showToast({ title: '添加成功', icon: 'success' })
  }
}

// 立即购买：将商品信息存入 storage，跳转结算页
const onBuyNow = () => {
  // 登录校验
  if (!requireLogin()) return

  if (!goods.value) return
  const buyNowItems: CheckoutItem[] = [
    {
      goodsId: goods.value.id,
      skuId: `${goods.value.id}-标准装`,
      name: goods.value.name,
      image: goods.value.image,
      price: discountPrice.value,
      count: buyCount.value,
      sku: '标准装',
    },
  ]
  uni.setStorageSync('buy_now_items', JSON.stringify(buyNowItems))
  uni.navigateTo({ url: '/pages/checkout/checkout?source=buyNow' })
}

// 切换收藏状态（持久化到本地存储）
const toggleCollect = async () => {
  // 登录校验
  if (!requireLogin()) return

  if (!goods.value) return
  const isFav = await toggleFavoriteAPI({
    id: goods.value.id,
    name: goods.value.name,
    image: goods.value.image,
    price: goods.value.price,
    oldPrice: goods.value.oldPrice,
    desc: goods.value.desc,
  })
  isCollected.value = isFav
  uni.showToast({
    title: isFav ? '已收藏' : '取消收藏',
    icon: 'none',
  })
}

const formatSoldCount = (count: number) => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  return count.toString()
}

const applyCoupon = () => {
  // 登录校验
  if (!requireLogin()) return

  const code = couponCodeInput.value.trim().toUpperCase()
  if (!code) {
    uni.showToast({ title: '请输入优惠码', icon: 'none' })
    return
  }

  const coupon = couponList.value.find((c) => c.code.toUpperCase() === code)
  if (!coupon) {
    uni.showToast({ title: '无效的优惠码', icon: 'none' })
    return
  }

  // 校验优惠码是否已由企业方启用发放
  if (coupon.active === false) {
    uni.showToast({ title: '该优惠码已停止发放', icon: 'none' })
    return
  }

  const total = currentPrice.value * buyCount.value
  if (total < coupon.minAmount) {
    uni.showToast({ title: `满${coupon.minAmount}元可用`, icon: 'none' })
    return
  }

  appliedCoupon.value = coupon
  uni.showToast({ title: `优惠码绑定成功！${coupon.description}`, icon: 'success' })

  // 自动领取到用户优惠码列表（静默，不提示）
  claimCouponAPI(
    coupon.code,
    'share',
    goods.value?.id,
    goods.value?.name,
  ).catch(() => {
    // 已领取过则忽略
  })
}

const removeCoupon = () => {
  appliedCoupon.value = null
  couponCodeInput.value = ''
}

const onShare = () => {
  showShareModal.value = true
}

const closeShareModal = () => {
  showShareModal.value = false
}

// 微信分享给好友
onShareAppMessage(() => {
  return {
    title: `新鲜海鲜：${goods.value?.name || '海鲜直供'} 仅需¥${discountPrice.value}`,
    path: `/pages/goods/goods?id=${goodsId.value}&couponCode=${COUPON_CODES.SHARE}`,
    imageUrl: goods.value?.image || '',
  }
})

// 微信分享到朋友圈
onShareTimeline(() => {
  return {
    title: `新鲜海鲜：${goods.value?.name || '海鲜直供'} 仅需¥${discountPrice.value}`,
    query: `id=${goodsId.value}&couponCode=${COUPON_CODES.SHARE}`,
    imageUrl: goods.value?.image || '',
  }
})
</script>

<template>
  <view class="goods-page">
    <scroll-view enable-back-to-top scroll-y class="page-scroll">
      <view class="product-images">
        <swiper @change="onChange" circular class="image-swiper" indicator-dots indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
          <swiper-item v-for="i in 3" :key="i" class="swiper-item">
            <image class="product-image" @tap="onTapImage(goods?.image || '')" mode="aspectFill" :src="goods?.image" />
          </swiper-item>
        </swiper>
        <view class="image-counter">
          <text>{{ currentIndex + 1 }}/3</text>
        </view>
      </view>

      <view class="product-header">
        <view class="price-section">
          <view class="price-tag">
            <text class="price-symbol">¥</text>
            <text class="current-price">{{ currentPrice }}</text>
            <text v-if="goods?.oldPrice" class="original-price">¥{{ goods?.oldPrice }}</text>
          </view>
          <view class="sales-tag">已售{{ formatSoldCount(goods?.soldCount || 0) }}</view>
        </view>
        <view class="product-name">{{ goods?.name }}</view>
        <view class="product-desc">{{ goods?.desc }}</view>
      </view>

      <view class="coupon-section">
        <view class="section-title">
          <text class="title-icon">🎫</text>
          <text>优惠码</text>
        </view>
        <!-- 有优惠码时的展示 -->
        <view v-if="appliedCoupon" class="coupon-applied-box">
          <view class="coupon-info">
            <text class="coupon-code">已绑定: {{ appliedCoupon.code }}</text>
            <text class="coupon-desc">{{ appliedCoupon.description }}</text>
          </view>
          <view class="coupon-remove" @tap="removeCoupon">
            <text>×</text>
          </view>
        </view>
        <!-- 无优惠码时的输入区 -->
        <view v-else class="coupon-input-box">
          <input
            v-model="couponCodeInput"
            class="coupon-input"
            placeholder="输入优惠码（如001享95折）"
            @confirm="applyCoupon"
          />
          <view class="coupon-btn" @tap="applyCoupon">
            <text>绑定</text>
          </view>
        </view>
        <!-- 价格对比展示 -->
        <view class="coupon-price-comparison">
          <view class="price-row" v-if="appliedCoupon">
            <text class="price-label">原价:</text>
            <text class="price-original">¥{{ currentPrice }}</text>
          </view>
          <view class="price-row">
            <text class="price-label">{{ appliedCoupon ? '优惠后单价:' : '当前单价:' }}</text>
            <text class="price-discount" :class="{ 'has-discount': appliedCoupon }">¥{{ discountPrice }}</text>
          </view>
          <view class="price-row" v-if="appliedCoupon && buyCount > 1">
            <text class="price-label">优惠后总价:</text>
            <text class="price-total">¥{{ discountPrice * buyCount }}</text>
          </view>
        </view>
        <!-- 获取优惠码说明 -->
        <view class="coupon-guide" v-if="!appliedCoupon">
          <text class="guide-title">📋 如何获取优惠码？</text>
          <text class="guide-text">1. 浏览首页「用户分享」内容，点击进入分享详情</text>
          <text class="guide-text">2. 将分享内容转发给好友，好友打开即可获得优惠码</text>
          <text class="guide-text">3. 或直接输入优惠码 001 享受95折优惠</text>
          <text class="guide-text guide-highlight">💡 无优惠码用户按原价购买，享同样品质保障</text>
        </view>
      </view>

      <view class="count-section">
        <view class="section-title">
          <text class="title-icon">🔢</text>
          <text>购买数量</text>
        </view>
        <view class="count-control">
          <view class="count-btn" :class="{ disabled: buyCount <= 1 }" @tap="decreaseCount">
            <text>-</text>
          </view>
          <view class="count-input">
            <text>{{ buyCount }}</text>
          </view>
          <view class="count-btn" :class="{ disabled: buyCount >= 99 }" @tap="increaseCount">
            <text>+</text>
          </view>
        </view>
      </view>

      <!-- 收货地址 -->
      <view class="address-section" @tap="onOpenAddressPanel">
        <view class="section-title">
          <text class="title-icon">📍</text>
          <text>收货地址</text>
        </view>
        <view v-if="selectedAddress" class="address-display">
          <view class="address-user">
            <text class="address-name">{{ selectedAddress.receiver }}</text>
            <text class="address-phone">{{ selectedAddress.contact }}</text>
          </view>
          <text class="address-detail">{{ selectedAddress.fullLocation }} {{ selectedAddress.address }}</text>
        </view>
        <view v-else class="address-empty">
          <text class="empty-text">请选择收货地址</text>
        </view>
        <text class="address-arrow">›</text>
      </view>

      <view class="info-section">
        <view class="section-title">
          <text class="title-icon">📝</text>
          <text>商品详情</text>
        </view>
        <view class="info-content">
          <view class="info-row">
            <text class="info-label">商品名称</text>
            <text class="info-value">{{ goods?.name }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">商品描述</text>
            <text class="info-value">{{ goods?.desc || '精选优质水产品' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">当前价格</text>
            <text class="info-value price">¥{{ currentPrice }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">原价</text>
            <text class="info-value">¥{{ goods?.oldPrice || goods?.price }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">配送服务</text>
            <text class="info-value">冷链配送，24小时内送达</text>
          </view>
        </view>
        <image class="detail-image" mode="widthFix" :src="goods?.image"></image>
      </view>

      <view class="service-section">
        <view class="section-title">
          <text class="title-icon">🛡️</text>
          <text>服务保障</text>
        </view>
        <view class="service-grid">
          <view class="service-item">
            <view class="service-icon-box">✓</view>
            <text class="service-text">正品保证</text>
          </view>
          <view class="service-item">
            <view class="service-icon-box">✓</view>
            <text class="service-text">无忧退换</text>
          </view>
          <view class="service-item">
            <view class="service-icon-box">✓</view>
            <text class="service-text">急速退款</text>
          </view>
          <view class="service-item">
            <view class="service-icon-box">✓</view>
            <text class="service-text">冷链配送</text>
          </view>
          <view class="service-item">
            <view class="service-icon-box">✓</view>
            <text class="service-text">24小时发货</text>
          </view>
          <view class="service-item">
            <view class="service-icon-box">✓</view>
            <text class="service-text">品质保障</text>
          </view>
        </view>
      </view>

      <view class="reviews-section">
        <view class="section-title">
          <text class="title-icon">⭐</text>
          <text>商品评价</text>
          <text class="review-count">({{ reviewStats.total }})</text>
        </view>
        <!-- 评分汇总 -->
        <view v-if="reviewStats.total > 0" class="review-summary">
          <view class="summary-left">
            <text class="avg-rating">{{ reviewStats.avgRating }}</text>
            <view class="summary-stars">
              <text v-for="i in 5" :key="i" class="star" :class="{ active: i <= Math.round(reviewStats.avgRating) }">★</text>
            </view>
            <text class="summary-desc">综合评分</text>
          </view>
          <view class="summary-right">
            <text class="summary-total">{{ reviewStats.total }}条评价</text>
          </view>
        </view>
        <view v-if="goodsReviews.length > 0" class="reviews-list">
          <view v-for="review in goodsReviews" :key="review.id" class="review-item">
            <view class="review-header">
              <image class="review-avatar" :src="review.avatar" mode="aspectFill" />
              <view class="review-user-info">
                <text class="review-username">{{ review.userName }}</text>
                <view class="review-rating">
                  <text v-for="i in 5" :key="i" class="star" :class="{ active: i <= review.rating }">★</text>
                </view>
              </view>
              <text class="review-time">{{ formatReviewTime(review.createdAt) }}</text>
            </view>
            <text class="review-content">{{ review.content }}</text>
            <view v-if="review.images.length > 0" class="review-images">
              <image
                v-for="(img, idx) in review.images"
                :key="idx"
                class="review-image"
                :src="img"
                mode="aspectFill"
                @tap="onPreviewReviewImage(img, review.images)"
              />
            </view>
          </view>
        </view>
        <view v-else class="no-reviews">
          <text>暂无评价</text>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <view class="bottom-bar" :style="{ paddingBottom: safeAreaInsets?.bottom + 'px' }">
      <view class="bar-left">
        <view class="bar-icon" @tap="toggleCollect">
          <text class="icon-heart" :class="{ collected: isCollected }">❤️</text>
          <text>{{ isCollected ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="bar-icon" @tap="onShare">
          <text class="icon-share">🔗</text>
          <text>分享</text>
        </view>
        <!-- #ifdef MP-WEIXIN -->
        <view class="bar-icon" open-type="contact">
          <text class="icon-chat">💬</text>
          <text>客服</text>
        </view>
        <!-- #endif -->
        <navigator class="bar-icon" url="/pages/shop/shop" open-type="switchTab">
          <text class="icon-cart">🛒</text>
          <text>购物车</text>
          <view v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</view>
        </navigator>
      </view>
      <view class="bar-right">
        <view class="btn-add-cart" @tap="onAddCart">
          <text>加入购物车</text>
        </view>
        <view class="btn-buy-now" @tap="onBuyNow">
          <text>立即购买</text>
        </view>
      </view>
    </view>

    <!-- 地址选择弹窗 -->
    <view v-if="showAddressPanel" class="panel-overlay" @tap="onCloseAddressPanel">
      <view class="panel-container" @tap.stop>
        <AddressPanel @close="onCloseAddressPanel" />
      </view>
    </view>

    <!-- 分享弹窗 -->
    <view v-if="showShareModal" class="share-overlay" @tap="closeShareModal">
      <view class="share-modal" @tap.stop>
        <view class="share-title">分享给好友</view>
        <view class="share-options">
          <button class="share-option" open-type="share">
            <view class="option-icon wechat-friend">
              <text>💬</text>
            </view>
            <text class="option-text">微信好友</text>
          </button>
          <button class="share-option" open-type="shareTimeline">
            <view class="option-icon wechat-moments">
              <text>📱</text>
            </view>
            <text class="option-text">朋友圈</text>
          </button>
        </view>
        <view class="share-tip">
          <text>分享给好友，好友打开即可获得95折优惠码</text>
        </view>
        <view class="share-cancel" @tap="closeShareModal">
          <text>取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
page {
  height: 100%;
  background-color: #f5f7fa;
}
</style>

<style lang="scss" scoped>
.goods-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-scroll {
  flex: 1;
}

.product-images {
  position: relative;
  background-color: #000;

  .image-swiper {
    width: 100%;
    height: 750rpx;
  }

  .swiper-item {
    width: 100%;
    height: 100%;
  }

  .product-image {
    width: 100%;
    height: 100%;
  }

  .image-counter {
    position: absolute;
    bottom: 30rpx;
    right: 30rpx;
    background: rgba(0, 0, 0, 0.5);
    padding: 8rpx 20rpx;
    border-radius: 20rpx;

    text {
      color: #fff;
      font-size: 24rpx;
    }
  }
}

.product-header {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.price-section {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.price-tag {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.current-price {
  font-size: 56rpx;
  font-weight: bold;
  color: #ff6b6b;
}

.original-price {
  font-size: 28rpx;
  color: #b2bec3;
  text-decoration: line-through;
  margin-left: 16rpx;
}

.sales-tag {
  font-size: 26rpx;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
}

.product-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #2d3436;
  line-height: 1.4;
  margin-bottom: 12rpx;
}

.product-desc {
  font-size: 28rpx;
  color: #ff6b6b;
}

.count-section,
.info-section,
.service-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;

  .title-icon {
    font-size: 32rpx;
    margin-right: 12rpx;
  }

  text {
    font-size: 32rpx;
    font-weight: bold;
    color: #2d3436;
  }
}

.count-control {
  display: flex;
  align-items: center;
}

.count-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12rpx;
  transition: all 0.2s ease;

  text {
    font-size: 40rpx;
    color: #636e72;
    font-weight: 300;
  }

  &:active:not(.disabled) {
    background: #dfe6e9;
  }

  &.disabled {
    opacity: 0.4;
  }
}

.count-input {
  min-width: 100rpx;
  text-align: center;
  padding: 0 20rpx;

  text {
    font-size: 36rpx;
    font-weight: bold;
    color: #2d3436;
  }
}

.info-content {
  margin-bottom: 30rpx;
}

.info-row {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx dashed #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  width: 180rpx;
  font-size: 28rpx;
  color: #636e72;
}

.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #2d3436;

  &.price {
    color: #ff6b6b;
    font-weight: 600;
  }
}

.detail-image {
  width: 100%;
  border-radius: 12rpx;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.service-icon-box {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  border-radius: 50%;
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.service-text {
  font-size: 26rpx;
  color: #636e72;
}

.coupon-section,
.reviews-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.coupon-input-box {
  display: flex;
  gap: 16rpx;
}

.coupon-input {
  flex: 1;
  height: 88rpx;
  padding: 0 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.coupon-btn {
  padding: 0 32rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
  border-radius: 12rpx;

  text {
    font-size: 28rpx;
    font-weight: bold;
    color: #fff;
  }

  &:active {
    opacity: 0.85;
  }
}

.coupon-applied-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 184, 148, 0.1);
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  border: 2rpx solid #00b894;
}

.coupon-info {
  display: flex;
  flex-direction: column;
}

.coupon-code {
  font-size: 28rpx;
  font-weight: bold;
  color: #00b894;
}

.coupon-desc {
  font-size: 24rpx;
  color: #00b894;
  opacity: 0.8;
  margin-top: 4rpx;
}

.coupon-remove {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 184, 148, 0.2);
  border-radius: 50%;

  text {
    font-size: 32rpx;
    color: #00b894;
    line-height: 1;
  }

  &:active {
    opacity: 0.8;
  }
}

.coupon-price-comparison {
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;

  .price-row {
    display: flex;
    align-items: center;
    margin-bottom: 8rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .price-label {
    font-size: 26rpx;
    color: #636e72;
    min-width: 160rpx;
  }

  .price-original {
    font-size: 28rpx;
    color: #999;
    text-decoration: line-through;
  }

  .price-discount {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;

    &.has-discount {
      color: #ff6b6b;
    }
  }

  .price-total {
    font-size: 36rpx;
    font-weight: bold;
    color: #ff6b6b;
  }
}

.coupon-guide {
  margin-top: 16rpx;
  padding: 20rpx;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border-radius: 12rpx;
  border: 1rpx solid #d6e8ff;

  .guide-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #0066cc;
    margin-bottom: 12rpx;
  }

  .guide-text {
    display: block;
    font-size: 24rpx;
    color: #555;
    line-height: 1.8;

    &.guide-highlight {
      color: #009944;
      margin-top: 8rpx;
      font-weight: 600;
    }
  }
}

.review-count {
  font-size: 26rpx;
  color: #999;
  margin-left: 8rpx;
  font-weight: normal;
}

.review-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 20rpx;
  margin-bottom: 16rpx;
  background: linear-gradient(135deg, rgba(253, 203, 110, 0.12) 0%, rgba(255, 165, 2, 0.08) 100%);
  border-radius: 12rpx;

  .summary-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .avg-rating {
    font-size: 56rpx;
    font-weight: bold;
    color: #ffa502;
    line-height: 1;
  }

  .summary-stars {
    display: flex;
    flex-direction: column;
    gap: 4rpx;

    .star {
      font-size: 24rpx;
      color: #dfe6e9;

      &.active {
        color: #ffa502;
      }
    }
  }

  .summary-desc {
    font-size: 22rpx;
    color: #636e72;
    margin-top: 4rpx;
  }

  .summary-right {
    text-align: right;
  }

  .summary-total {
    font-size: 24rpx;
    color: #636e72;
  }
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.review-item {
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.review-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
}

.review-user-info {
  flex: 1;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
}

.review-username {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.review-rating {
  display: flex;
  margin-top: 4rpx;
}

.star {
  font-size: 24rpx;
  color: #ddd;
  margin-right: 4rpx;

  &.active {
    color: #ffd700;
  }
}

.review-time {
  font-size: 24rpx;
  color: #999;
}

.review-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.review-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
}

.no-reviews {
  text-align: center;
  padding: 40rpx 0;

  text {
    font-size: 28rpx;
    color: #999;
  }
}

/* 分享弹窗 */
.share-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.share-modal {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 24rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.share-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 32rpx;
}

.share-options {
  display: flex;
  justify-content: center;
  gap: 60rpx;
  margin-bottom: 24rpx;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  line-height: normal;

  &::after {
    border: none;
  }

  .option-icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12rpx;

    text {
      font-size: 48rpx;
    }
  }

  .wechat-friend {
    background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
  }

  .wechat-moments {
    background: linear-gradient(135deg, #2bb673 0%, #1e8c4e 100%);
  }

  .option-text {
    font-size: 24rpx;
    color: #333;
  }

  &:active {
    opacity: 0.8;
  }
}

.share-tip {
  text-align: center;
  padding: 16rpx 0;

  text {
    font-size: 22rpx;
    color: #999;
  }
}

.share-cancel {
  margin-top: 16rpx;
  padding: 24rpx 0;
  text-align: center;
  border-top: 1rpx solid #f0f0f0;

  text {
    font-size: 30rpx;
    color: #666;
  }

  &:active {
    background: #f5f5f5;
  }
}

.bottom-space {
  height: 180rpx;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.bar-left {
  flex: 1;
  display: flex;
  justify-content: space-around;
}

.bar-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  text {
    font-size: 24rpx;
    color: #636e72;
    margin-top: 4rpx;
  }

  .icon-heart,
  .icon-chat,
  .icon-cart {
    font-size: 40rpx;
  }

  .icon-heart.collected {
    color: #ff6b6b;
  }

  .cart-badge {
    position: absolute;
    top: -8rpx;
    right: -16rpx;
    min-width: 32rpx;
    height: 32rpx;
    line-height: 32rpx;
    text-align: center;
    background: #ff6b6b;
    color: #fff;
    font-size: 20rpx;
    border-radius: 16rpx;
    padding: 0 8rpx;
  }
}

.bar-right {
  display: flex;
  gap: 16rpx;
}

.btn-add-cart,
.btn-buy-now {
  padding: 24rpx 36rpx;
  border-radius: 44rpx;
  transition: all 0.2s ease;

  text {
    font-size: 30rpx;
    font-weight: bold;
    color: #fff;
  }

  &:active {
    transform: scale(0.95);
  }
}

.btn-add-cart {
  background: linear-gradient(135deg, #ffa868 0%, #ff9561 100%);
}

.btn-buy-now {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
}

/* 收货地址区域 */
.address-section {
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  position: relative;

  &:active {
    opacity: 0.9;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8rpx;
    min-width: 160rpx;

    .title-icon {
      font-size: 32rpx;
    }

    text:not(.title-icon) {
      font-size: 28rpx;
      font-weight: bold;
      color: #2d3436;
    }
  }

  .address-display {
    flex: 1;
    margin: 0 20rpx;

    .address-user {
      display: flex;
      align-items: center;
      gap: 16rpx;
      margin-bottom: 6rpx;

      .address-name {
        font-size: 28rpx;
        font-weight: 600;
        color: #2d3436;
      }

      .address-phone {
        font-size: 26rpx;
        color: #636e72;
      }
    }

    .address-detail {
      font-size: 24rpx;
      color: #636e72;
    }
  }

  .address-empty {
    flex: 1;
    margin: 0 20rpx;

    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }

  .address-arrow {
    font-size: 40rpx;
    color: #ccc;
  }
}

/* 地址弹窗遮罩 */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.panel-container {
  width: 100%;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  overflow: hidden;
  animation: panelSlideUp 0.3s ease;
}

@keyframes panelSlideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>