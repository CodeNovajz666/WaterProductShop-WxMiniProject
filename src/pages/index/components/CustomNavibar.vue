<script setup lang="ts">
import { ref } from 'vue'
import { getSafeAreaInsets } from '@/utils/system'
import { getSeafoodItemsAPI } from '@/services/seafood'
import type { SeafoodItem } from '@/types/seafood'

const safeAreaInsets = getSafeAreaInsets()

// 下拉面板显示状态
const showDropdown = ref(false)
// 搜索关键词
const keyword = ref('')
// 是否已搜索
const hasSearched = ref(false)
// 搜索结果
const searchResults = ref<SeafoodItem[]>([])
// 全部商品
const allGoods = ref<SeafoodItem[]>([])
// 搜索历史
const searchHistory = ref<string[]>([])
// 热门搜索词
const hotKeywords = ['三文鱼', '大闸蟹', '龙虾', '扇贝', '带鱼', '基围虾', '生蚝', '鳕鱼']

// 预加载全部商品
const loadAllGoods = async () => {
  try {
    const res = await getSeafoodItemsAPI({ page: 1, pageSize: 100 })
    allGoods.value = res.result.items
    try {
      const adminProducts = uni.getStorageSync('admin_products')
      if (adminProducts) {
        const adminList: SeafoodItem[] = JSON.parse(adminProducts)
        allGoods.value = [...adminList, ...allGoods.value]
      }
    } catch {
      // ignore
    }
  } catch {
    allGoods.value = []
  }
}

// 打开下拉面板
const openDropdown = () => {
  showDropdown.value = true
  if (allGoods.value.length === 0) {
    loadAllGoods()
  }
  // 加载历史记录
  const stored = uni.getStorageSync('search_history')
  if (stored) {
    searchHistory.value = JSON.parse(stored)
  }
}

// 关闭下拉面板
const closeDropdown = () => {
  showDropdown.value = false
  keyword.value = ''
  hasSearched.value = false
  searchResults.value = []
}

// 执行搜索
const doSearch = (kw?: string) => {
  const searchKey = (kw || keyword.value).trim()
  if (!searchKey) return

  keyword.value = searchKey
  hasSearched.value = true

  // 保存搜索历史
  searchHistory.value = [searchKey, ...searchHistory.value.filter((h) => h !== searchKey)].slice(0, 10)
  uni.setStorageSync('search_history', JSON.stringify(searchHistory.value))

  // 本地搜索
  searchResults.value = allGoods.value.filter((item) => {
    return item.name.includes(searchKey) || (item.desc && item.desc.includes(searchKey))
  })
}

// 输入时实时搜索
const onInput = () => {
  if (keyword.value.trim()) {
    doSearch()
  } else {
    hasSearched.value = false
    searchResults.value = []
  }
}

// 清空输入
const clearKeyword = () => {
  keyword.value = ''
  hasSearched.value = false
  searchResults.value = []
}

// 点击历史/热门搜索
const onTagTap = (kw: string) => {
  keyword.value = kw
  doSearch(kw)
}

// 删除单条历史
const deleteHistoryItem = (kw: string) => {
  searchHistory.value = searchHistory.value.filter((h) => h !== kw)
  uni.setStorageSync('search_history', JSON.stringify(searchHistory.value))
}

// 清空历史
const clearHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistory.value = []
        uni.removeStorageSync('search_history')
      }
    },
  })
}

// 跳转商品详情
const onGoGoods = (goodsId: string) => {
  closeDropdown()
  uni.navigateTo({ url: `/pages/goods/goods?id=${goodsId}` })
}

// 遮罩点击
const onMaskTap = () => {
  closeDropdown()
}
</script>

<template>
  <view class="navbar" :style="{ paddingTop: safeAreaInsets.top + 'px' }">
    <!-- logo文字 -->
    <view class="logo">
      <image class="logo-image" src="@/static/images/logo.png"></image>
      <text class="logo-text">鲜鱼直供 · 产地直达</text>
    </view>
    <!-- 搜索条 -->
    <view class="search" @tap="openDropdown">
      <text class="search-icon">🔍</text>
      <text class="search-text">搜索海鲜水产</text>
      <text class="scan-icon">📷</text>
    </view>
  </view>

  <!-- 浮动下拉搜索面板 -->
  <view v-if="showDropdown" class="search-dropdown" :style="{ top: safeAreaInsets.top + 20 + 'px' }">
    <!-- 遮罩层 -->
    <view class="dropdown-mask" @tap="onMaskTap"></view>

    <!-- 搜索面板主体 -->
    <view class="dropdown-panel">
      <!-- 搜索输入框 -->
      <view class="dropdown-search-bar">
        <view class="input-wrapper">
          <text class="input-icon">🔍</text>
          <input
            v-model="keyword"
            class="dropdown-input"
            placeholder="搜索海鲜水产"
            confirm-type="search"
            :focus="true"
            @input="onInput"
            @confirm="doSearch()"
          />
          <view v-if="keyword" class="input-clear" @tap="clearKeyword">
            <text>×</text>
          </view>
        </view>
        <view class="cancel-btn" @tap="closeDropdown">
          <text>取消</text>
        </view>
      </view>

      <!-- 面板内容区 -->
      <scroll-view scroll-y class="dropdown-content">
        <!-- 未搜索：历史 + 热门 -->
        <view v-if="!hasSearched" class="pre-search">
          <!-- 搜索历史 -->
          <view v-if="searchHistory.length > 0" class="history-block">
            <view class="block-header">
              <text class="block-title">搜索历史</text>
              <view class="block-clear" @tap="clearHistory">
                <text>🗑</text>
              </view>
            </view>
            <view class="tag-list">
              <view
                v-for="item in searchHistory"
                :key="item"
                class="tag-item history-tag"
                @tap="onTagTap(item)"
              >
                <text class="tag-text">{{ item }}</text>
                <text class="tag-del" @tap.stop="deleteHistoryItem(item)">×</text>
              </view>
            </view>
          </view>

          <!-- 热门搜索 -->
          <view class="hot-block">
            <view class="block-header">
              <text class="block-title">🔥 热门搜索</text>
            </view>
            <view class="tag-list">
              <view
                v-for="item in hotKeywords"
                :key="item"
                class="tag-item hot-tag"
                @tap="onTagTap(item)"
              >
                <text class="tag-text">{{ item }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 搜索结果 -->
        <view v-else class="result-block">
          <view v-if="searchResults.length === 0" class="empty-result">
            <text class="empty-icon">🔍</text>
            <text class="empty-text">未找到"{{ keyword }}"相关商品</text>
            <text class="empty-hint">试试其他关键词吧~</text>
          </view>
          <view v-else class="result-list">
            <view class="result-header">
              <text class="result-count">找到 {{ searchResults.length }} 件商品</text>
            </view>
            <view
              v-for="item in searchResults"
              :key="item.id"
              class="goods-row"
              @tap="onGoGoods(item.id)"
            >
              <image class="goods-thumb" :src="item.image" mode="aspectFill" />
              <view class="goods-detail">
                <text class="goods-name">{{ item.name }}</text>
                <text class="goods-desc">{{ item.desc }}</text>
                <view class="goods-price-row">
                  <text class="goods-price">¥{{ item.price }}</text>
                  <text v-if="item.oldPrice" class="goods-old">¥{{ item.oldPrice }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss">
/* 自定义导航条 */
.navbar {
  background-image: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  background-size: cover;
  position: relative;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  z-index: 100;

  .logo {
    display: flex;
    align-items: center;
    height: 64rpx;
    padding-left: 30rpx;
    padding-top: 20rpx;

    .logo-image {
      width: 166rpx;
      height: 39rpx;
    }

    .logo-text {
      flex: 1;
      line-height: 28rpx;
      color: #fff;
      margin: 2rpx 0 0 20rpx;
      padding-left: 20rpx;
      border-left: 1rpx solid #fff;
      font-size: 26rpx;
    }
  }

  .search {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10rpx 0 26rpx;
    height: 64rpx;
    margin: 16rpx 20rpx;
    color: #fff;
    font-size: 28rpx;
    border-radius: 32rpx;
    background-color: rgba(255, 255, 255, 0.2);

    .search-icon {
      font-size: 24rpx;
      margin-right: 10rpx;
    }

    .search-text {
      flex: 1;
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
    }

    .scan-icon {
      font-size: 30rpx;
      padding: 15rpx;
    }

    &:active {
      background-color: rgba(255, 255, 255, 0.3);
    }
  }
}
</style>

<style lang="scss" scoped>
/* 浮动下拉面板 */
.search-dropdown {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 999;
}

/* 遮罩层 */
.dropdown-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
}

/* 面板主体 */
.dropdown-panel {
  position: relative;
  background: #fff;
  border-radius: 0 0 24rpx 24rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.25s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-30rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 搜索输入栏 */
.dropdown-search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    height: 72rpx;
    padding: 0 20rpx;
    background: #f5f7fa;
    border-radius: 36rpx;

    .input-icon {
      font-size: 28rpx;
      margin-right: 12rpx;
    }

    .dropdown-input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .input-clear {
      width: 40rpx;
      height: 40rpx;
      background: #e0e0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 28rpx;
        color: #999;
      }
    }
  }

  .cancel-btn {
    flex-shrink: 0;
    padding: 0 8rpx;

    text {
      font-size: 30rpx;
      color: #0066cc;
    }
  }
}

/* 内容区 */
.dropdown-content {
  flex: 1;
  max-height: 60vh;
}

.pre-search {
  padding: 24rpx;
}

/* 区块 */
.history-block {
  margin-bottom: 36rpx;
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .block-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
  }

  .block-clear {
    padding: 8rpx;

    text {
      font-size: 26rpx;
    }
  }
}

/* 标签列表 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 12rpx 28rpx;
  border-radius: 32rpx;

  &:active {
    transform: scale(0.95);
  }
}

.history-tag {
  background: #f0f4f8;

  .tag-text {
    font-size: 26rpx;
    color: #555;
  }

  .tag-del {
    font-size: 28rpx;
    color: #ccc;
    margin-left: 4rpx;
  }
}

.hot-tag {
  background: linear-gradient(135deg, #fff5f0 0%, #ffe6e0 100%);
  border: 1rpx solid #ffd0c0;

  .tag-text {
    font-size: 26rpx;
    color: #ff6b35;
    font-weight: 600;
  }
}

/* 搜索结果 */
.result-block {
  padding: 24rpx;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;

  .empty-icon {
    font-size: 72rpx;
    margin-bottom: 16rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 8rpx;
  }

  .empty-hint {
    font-size: 24rpx;
    color: #bbb;
  }
}

.result-header {
  margin-bottom: 16rpx;

  .result-count {
    font-size: 24rpx;
    color: #999;
  }
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.goods-row {
  display: flex;
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 16rpx;

  &:active {
    background: #f0f4f8;
  }
}

.goods-thumb {
  width: 130rpx;
  height: 130rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

.goods-detail {
  flex: 1;
  margin-left: 16rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.goods-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.goods-desc {
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goods-price-row {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-top: auto;
}

.goods-price {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff4444;
}

.goods-old {
  font-size: 22rpx;
  color: #bbb;
  text-decoration: line-through;
}
</style>
