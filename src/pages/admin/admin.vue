<script setup lang="ts">
import type { SeafoodItem, CouponCode } from '@/types/seafood'
import { ref, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { getSafeAreaInsets } from '@/utils/system'
import { getCouponCodesAPI, saveAdminCouponsAPI } from '@/services/seafood'
import { useMemberStore } from '@/stores'
import { COUPON_LIMITS } from '@/config/constants'

const safeAreaInsets = getSafeAreaInsets()
const memberStore = useMemberStore()

// 权限校验：非企业端用户不允许访问
const hasPermission = ref(true)

onLoad(() => {
  if (memberStore.profile?.role !== 'enterprise') {
    hasPermission.value = false
    uni.showModal({
      title: '无权限',
      content: '该页面仅企业端用户可访问，请先切换企业端登录',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      },
    })
  }
})

// 商品列表（从本地存储读取企业方上架的商品）
const productList = ref<SeafoodItem[]>([])
const loading = ref(false)

// 上新表单
const showAddForm = ref(false)
const formData = ref({
  name: '',
  image: '',
  price: 0,
  oldPrice: 0,
  desc: '',
})

// 从本地存储加载商品列表
const loadProductList = () => {
  loading.value = true
  try {
    const stored = uni.getStorageSync('admin_products')
    productList.value = stored ? JSON.parse(stored) : []
  } catch {
    productList.value = []
  } finally {
    loading.value = false
  }
}

// 上传图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      formData.value.image = res.tempFilePaths[0]
    },
  })
}

// 提交上新
const submitProduct = () => {
  const { name, image, price, oldPrice, desc } = formData.value

  if (!name.trim()) {
    uni.showToast({ title: '请输入商品名称', icon: 'none' })
    return
  }
  if (!image) {
    uni.showToast({ title: '请上传商品图片', icon: 'none' })
    return
  }
  if (price <= 0) {
    uni.showToast({ title: '请输入有效价格', icon: 'none' })
    return
  }

  const newItem: SeafoodItem = {
    id: `admin_${Date.now()}`,
    name: name.trim(),
    image,
    price: Number(price),
    oldPrice: oldPrice > 0 ? Number(oldPrice) : undefined,
    desc: desc.trim() || '企业直供，品质保障',
    soldCount: 0,
  }

  // 保存到本地存储
  const stored = uni.getStorageSync('admin_products')
  const list: SeafoodItem[] = stored ? JSON.parse(stored) : []
  list.unshift(newItem)
  uni.setStorageSync('admin_products', JSON.stringify(list))

  // 同步到全局商品存储（首页商品列表会读取）
  const allGoods = uni.getStorageSync('all_goods')
  const allList: SeafoodItem[] = allGoods ? JSON.parse(allGoods) : []
  allList.unshift(newItem)
  uni.setStorageSync('all_goods', JSON.stringify(allList))

  uni.showToast({ title: '上架成功', icon: 'success' })
  showAddForm.value = false
  formData.value = { name: '', image: '', price: 0, oldPrice: 0, desc: '' }
  loadProductList()
}

// 删除商品
const deleteProduct = (id: string) => {
  uni.showModal({
    title: '确认下架',
    content: '确定要下架该商品吗？',
    success: (res) => {
      if (res.confirm) {
        const stored = uni.getStorageSync('admin_products')
        const list: SeafoodItem[] = stored ? JSON.parse(stored) : []
        const filtered = list.filter((item) => item.id !== id)
        uni.setStorageSync('admin_products', JSON.stringify(filtered))
        uni.showToast({ title: '已下架', icon: 'none' })
        loadProductList()
      }
    },
  })
}

// 格式化价格
const formatPrice = (price: number) => {
  return price.toFixed(2)
}

// 统计信息
const totalProducts = computed(() => productList.value.length)
const totalValue = computed(() =>
  productList.value.reduce((sum, item) => sum + item.price, 0),
)

// ====== 优惠码管理 ======

const couponList = ref<CouponCode[]>([])
const showCouponForm = ref(false)
const couponForm = ref({
  code: '',
  discount: COUPON_LIMITS.DEFAULT_DISCOUNT,
  discountType: 'percent' as 'percent' | 'fixed',
  minAmount: 0,
  description: '',
  active: true,
})

// 加载优惠码列表
const loadCouponList = async () => {
  try {
    const res = await getCouponCodesAPI()
    couponList.value = res.result
  } catch {
    couponList.value = []
  }
}

// 切换优惠码启用/停用
const toggleCouponActive = async (coupon: CouponCode) => {
  const updated = couponList.value.map((c) =>
    c.code === coupon.code ? { ...c, active: !c.active } : c,
  )
  couponList.value = updated
  await saveAdminCouponsAPI(updated)
  uni.showToast({
    title: coupon.active ? '已停用发放' : '已启用发放',
    icon: 'none',
  })
}

// 删除优惠码
const deleteCoupon = (code: string) => {
  uni.showModal({
    title: '确认删除',
    content: `确定删除优惠码 ${code} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        const updated = couponList.value.filter((c) => c.code !== code)
        couponList.value = updated
        await saveAdminCouponsAPI(updated)
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    },
  })
}

// 提交新增优惠码
const submitCoupon = async () => {
  const { code, discount, minAmount, description } = couponForm.value
  if (!code.trim()) {
    uni.showToast({ title: '请输入优惠码', icon: 'none' })
    return
  }
  if (discount <= 0) {
    uni.showToast({ title: '请输入有效折扣', icon: 'none' })
    return
  }
  // 检查重复
  if (couponList.value.some((c) => c.code.toUpperCase() === code.trim().toUpperCase())) {
    uni.showToast({ title: '优惠码已存在', icon: 'none' })
    return
  }

  const newCoupon: CouponCode = {
    code: code.trim().toUpperCase(),
    discount: Number(discount),
    discountType: couponForm.value.discountType,
    minAmount: Number(minAmount),
    description: description.trim() || (couponForm.value.discountType === 'percent' ? `享受${100 - Number(discount)}折` : `立减${discount}元`),
    active: couponForm.value.active,
  }

  const updated = [newCoupon, ...couponList.value]
  couponList.value = updated
  await saveAdminCouponsAPI(updated)

  uni.showToast({ title: '创建成功', icon: 'success' })
  showCouponForm.value = false
  couponForm.value = {
    code: '',
    discount: COUPON_LIMITS.DEFAULT_DISCOUNT,
    discountType: 'percent',
    minAmount: 0,
    description: '',
    active: true,
  }
}

// 格式化优惠码折扣显示
const formatDiscount = (coupon: CouponCode) => {
  if (coupon.discountType === 'percent') {
    return `${100 - coupon.discount}折`
  }
  return `减${coupon.discount}元`
}

const goBack = () => uni.navigateBack()

onShow(() => {
  loadProductList()
  loadCouponList()
})
</script>

<template>
  <view class="admin-page" v-if="hasPermission">
    <!-- 顶部头部 -->
    <view class="header" :style="{ paddingTop: safeAreaInsets!.top + 'px' }">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <text class="header-title">企业端管理</text>
      <view class="header-add" @tap="showAddForm = true">
        <text class="add-icon">+</text>
      </view>
    </view>

    <scroll-view scroll-y class="content-scroll" enable-back-to-top>
      <!-- 统计卡片 -->
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-num">{{ totalProducts }}</text>
          <text class="stat-label">在售商品</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">¥{{ formatPrice(totalValue) }}</text>
          <text class="stat-label">商品总价</text>
        </view>
      </view>

      <!-- 上新按钮 -->
      <view class="action-section">
        <view class="add-btn" @tap="showAddForm = true">
          <text class="btn-icon">📦</text>
          <text class="btn-text">上新产品</text>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="section-header">
        <text class="section-title">商品管理</text>
        <text class="section-desc">上架商品会同步到首页</text>
      </view>

      <view v-if="productList.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无商品，点击上方按钮上架新产品</text>
      </view>

      <view v-else class="product-list">
        <view v-for="item in productList" :key="item.id" class="product-card">
          <image class="product-image" :src="item.image" mode="aspectFill" />
          <view class="product-info">
            <text class="product-name">{{ item.name }}</text>
            <text class="product-desc">{{ item.desc }}</text>
            <view class="product-price-row">
              <text class="product-price">¥{{ formatPrice(item.price) }}</text>
              <text v-if="item.oldPrice" class="product-old-price">¥{{ formatPrice(item.oldPrice) }}</text>
            </view>
          </view>
          <view class="product-actions">
            <view class="action-delete" @tap.stop="deleteProduct(item.id)">
              <text>下架</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <!-- 优惠码管理区 -->
    <view class="coupon-section">
      <view class="section-header">
        <text class="section-title">优惠码管理</text>
        <view class="coupon-add-btn" @tap="showCouponForm = true">
          <text>+ 新建</text>
        </view>
      </view>
      <text class="section-desc">企业方配置优惠码折扣，控制是否发放</text>

      <view v-if="couponList.length === 0" class="empty-coupon">
        <text>暂无优惠码</text>
      </view>

      <view v-else class="coupon-list">
        <view v-for="coupon in couponList" :key="coupon.code" class="coupon-card" :class="{ inactive: !coupon.active }">
          <view class="coupon-left">
            <text class="coupon-code">{{ coupon.code }}</text>
            <text class="coupon-discount">{{ formatDiscount(coupon) }}</text>
          </view>
          <view class="coupon-mid">
            <text class="coupon-desc">{{ coupon.description }}</text>
            <text class="coupon-min">满{{ coupon.minAmount }}元可用</text>
          </view>
          <view class="coupon-right">
            <view
              class="coupon-toggle"
              :class="{ on: coupon.active }"
              @tap="toggleCouponActive(coupon)"
            >
              <text>{{ coupon.active ? '发放中' : '已停用' }}</text>
            </view>
            <view class="coupon-delete" @tap="deleteCoupon(coupon.code)">
              <text>删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 上新表单弹窗 -->
    <view v-if="showAddForm" class="modal-overlay" @tap="showAddForm = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">上新产品</text>
          <view class="modal-close" @tap="showAddForm = false">
            <text>×</text>
          </view>
        </view>

        <scroll-view scroll-y class="form-scroll">
          <!-- 商品名称 -->
          <view class="form-item">
            <text class="form-label">商品名称 *</text>
            <input
              v-model="formData.name"
              class="form-input"
              placeholder="如：鲜活波士顿龙虾"
              :maxlength="30"
            />
          </view>

          <!-- 商品图片 -->
          <view class="form-item">
            <text class="form-label">商品图片 *</text>
            <view class="image-upload" @tap="chooseImage">
              <image v-if="formData.image" class="preview-image" :src="formData.image" mode="aspectFill" />
              <view v-else class="upload-placeholder">
                <text class="upload-icon">📷</text>
                <text class="upload-text">点击上传图片</text>
              </view>
            </view>
          </view>

          <!-- 商品价格 -->
          <view class="form-item">
            <text class="form-label">销售价格 (元) *</text>
            <input
              v-model="formData.price"
              class="form-input"
              type="digit"
              placeholder="如：128.00"
            />
          </view>

          <!-- 原价（可选） -->
          <view class="form-item">
            <text class="form-label">原价 (元) - 可选</text>
            <input
              v-model="formData.oldPrice"
              class="form-input"
              type="digit"
              placeholder="如：168.00（留空表示无原价）"
            />
          </view>

          <!-- 商品描述 -->
          <view class="form-item">
            <text class="form-label">商品描述</text>
            <textarea
              v-model="formData.desc"
              class="form-textarea"
              placeholder="如：深海捕捞，新鲜直达，肉质鲜嫩"
              :maxlength="100"
            />
          </view>
        </scroll-view>

        <view class="modal-footer">
          <view class="btn-cancel" @tap="showAddForm = false">
            <text>取消</text>
          </view>
          <view class="btn-submit" @tap="submitProduct">
            <text>确认上架</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 优惠码创建表单弹窗 -->
    <view v-if="showCouponForm" class="modal-overlay" @tap="showCouponForm = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">新建优惠码</text>
          <view class="modal-close" @tap="showCouponForm = false">
            <text>×</text>
          </view>
        </view>

        <scroll-view scroll-y class="form-scroll">
          <!-- 优惠码 -->
          <view class="form-item">
            <text class="form-label">优惠码 *</text>
            <input
              v-model="couponForm.code"
              class="form-input"
              placeholder="如：001、SUMMER2024"
              :maxlength="20"
            />
          </view>

          <!-- 折扣类型 -->
          <view class="form-item">
            <text class="form-label">折扣类型 *</text>
            <view class="type-selector">
              <view
                class="type-option"
                :class="{ active: couponForm.discountType === 'percent' }"
                @tap="couponForm.discountType = 'percent'"
              >
                <text>百分比折扣</text>
              </view>
              <view
                class="type-option"
                :class="{ active: couponForm.discountType === 'fixed' }"
                @tap="couponForm.discountType = 'fixed'"
              >
                <text>固定金额减免</text>
              </view>
            </view>
          </view>

          <!-- 折扣值 -->
          <view class="form-item">
            <text class="form-label">
              {{ couponForm.discountType === 'percent' ? '折扣值 (减百分之几) *' : '减免金额 (元) *' }}
            </text>
            <input
              v-model="couponForm.discount"
              class="form-input"
              type="digit"
              :placeholder="couponForm.discountType === 'percent' ? '如：5 表示95折' : '如：30 表示减30元'"
            />
          </view>

          <!-- 最低消费 -->
          <view class="form-item">
            <text class="form-label">最低消费 (元)</text>
            <input
              v-model="couponForm.minAmount"
              class="form-input"
              type="digit"
              placeholder="如：100（留0表示无门槛）"
            />
          </view>

          <!-- 描述 -->
          <view class="form-item">
            <text class="form-label">优惠码描述</text>
            <input
              v-model="couponForm.description"
              class="form-input"
              placeholder="如：分销专属优惠码"
              :maxlength="50"
            />
          </view>

          <!-- 是否启用 -->
          <view class="form-item">
            <text class="form-label">是否立即发放</text>
            <view class="type-selector">
              <view
                class="type-option"
                :class="{ active: couponForm.active }"
                @tap="couponForm.active = true"
              >
                <text>立即发放</text>
              </view>
              <view
                class="type-option"
                :class="{ active: !couponForm.active }"
                @tap="couponForm.active = false"
              >
                <text>暂不发放</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="modal-footer">
          <view class="btn-cancel" @tap="showCouponForm = false">
            <text>取消</text>
          </view>
          <view class="btn-submit" @tap="submitCoupon">
            <text>确认创建</text>
          </view>
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
.admin-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx 24rpx;
  background: linear-gradient(135deg, #0066cc 0%, #0099ff 100%);
}

.header-back,
.header-add {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 40rpx;
  color: #fff;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.add-icon {
  font-size: 44rpx;
  color: #fff;
}

.content-scroll {
  flex: 1;
  padding: 24rpx;
}

.stats-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  border-radius: 20rpx;
  padding: 36rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 44rpx;
  font-weight: bold;
  color: #0066cc;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #e8e8e8;
}

.action-section {
  margin-top: 24rpx;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 184, 148, 0.3);

  .btn-icon {
    font-size: 36rpx;
  }

  .btn-text {
    font-size: 32rpx;
    font-weight: bold;
    color: #fff;
  }

  &:active {
    transform: scale(0.98);
  }
}

.section-header {
  display: flex;
  align-items: center;
  margin-top: 36rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.section-desc {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.product-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.product-image {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.product-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  margin-top: 12rpx;
}

.product-price {
  font-size: 34rpx;
  font-weight: bold;
  color: #ff4444;
}

.product-old-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
  margin-left: 10rpx;
}

.product-actions {
  margin-left: 16rpx;
}

.action-delete {
  padding: 12rpx 20rpx;
  background: #fff0f0;
  border-radius: 24rpx;

  text {
    font-size: 24rpx;
    color: #ff4444;
  }

  &:active {
    background: #ffe0e0;
  }
}

.bottom-space {
  height: 80rpx;
}

/* 优惠码管理 */
.coupon-section {
  margin: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.coupon-add-btn {
  padding: 8rpx 24rpx;
  background: #0066cc;
  border-radius: 8rpx;

  text {
    font-size: 24rpx;
    color: #fff;
  }

  &:active {
    opacity: 0.8;
  }
}

.empty-coupon {
  text-align: center;
  padding: 40rpx 0;

  text {
    font-size: 26rpx;
    color: #999;
  }
}

.coupon-list {
  margin-top: 16rpx;
}

.coupon-card {
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 12rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  border-left: 6rpx solid #00b894;

  &.inactive {
    border-left-color: #ccc;
    opacity: 0.6;
  }
}

.coupon-left {
  flex-shrink: 0;
  width: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .coupon-code {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
  }

  .coupon-discount {
    font-size: 24rpx;
    color: #ff6b6b;
    margin-top: 4rpx;
  }
}

.coupon-mid {
  flex: 1;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;

  .coupon-desc {
    font-size: 24rpx;
    color: #555;
  }

  .coupon-min {
    font-size: 22rpx;
    color: #999;
    margin-top: 4rpx;
  }
}

.coupon-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.coupon-toggle {
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  background: #e0e0e0;

  text {
    font-size: 22rpx;
    color: #666;
  }

  &.on {
    background: #e8f5e9;

    text {
      color: #2e7d32;
    }
  }

  &:active {
    opacity: 0.7;
  }
}

.coupon-delete {
  padding: 6rpx 16rpx;

  text {
    font-size: 22rpx;
    color: #ff6b6b;
  }

  &:active {
    opacity: 0.7;
  }
}

/* 折扣类型选择器 */
.type-selector {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}

.type-option {
  flex: 1;
  padding: 20rpx 0;
  text-align: center;
  background: #f0f4f8;
  border-radius: 10rpx;
  border: 2rpx solid transparent;

  text {
    font-size: 26rpx;
    color: #666;
  }

  &.active {
    background: rgba(0, 102, 204, 0.1);
    border-color: #0066cc;

    text {
      color: #0066cc;
      font-weight: 600;
    }
  }

  &:active {
    opacity: 0.8;
  }
}

/* 弹窗样式 */
.modal-overlay {
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

.modal-content {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: 40rpx;
    color: #999;
  }
}

.form-scroll {
  flex: 1;
  padding: 24rpx 30rpx;
  max-height: 60vh;
}

.form-item {
  margin-bottom: 28rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 120rpx;
  padding: 20rpx 24rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.image-upload {
  width: 100%;
  height: 280rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f8f9fa;
  border: 2rpx dashed #d0d0d0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-icon {
  font-size: 56rpx;
  margin-bottom: 12rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #999;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}

.btn-cancel {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 44rpx;

  text {
    font-size: 30rpx;
    color: #666;
  }
}

.btn-submit {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  border-radius: 44rpx;

  text {
    font-size: 30rpx;
    font-weight: bold;
    color: #fff;
  }
}
</style>
