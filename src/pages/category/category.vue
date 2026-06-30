<script setup lang="ts">
import { ref, onMounted } from 'vue'

const safeAreaTop = ref(0)

onMounted(() => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    if (systemInfo.safeAreaInsets) {
      safeAreaTop.value = systemInfo.safeAreaInsets.top || 0
    }
  } catch (e) {
    console.error('获取系统信息失败:', e)
  }
})

const primaryCategories = ref([
  { id: 1, name: '鱼类' },
  { id: 2, name: '虾蟹' },
  { id: 3, name: '贝类' },
  { id: 4, name: '海鲜干货' },
  { id: 5, name: '冷冻水产' },
  { id: 6, name: '鲜肉类' },
  { id: 7, name: '果蔬' },
  { id: 8, name: '调料' },
])

const activeIndex = ref(0)

const secondaryCategoriesMap = ref<Record<number, {
  id: number
  title: string
  subtitle: string
  items: { id: number; name: string; price: number; image: string }[]
}[]>>({
  1: [
    {
      id: 101,
      title: '深海臻选',
      subtitle: '进口深海鱼·空运直达',
      items: [
        { id: 1, name: '深海三文鱼', price: 68, image: 'https://aka.doubaocdn.com/s/FmE21wgyho' },
        { id: 4, name: '挪威鳕鱼', price: 88, image: 'https://aka.doubaocdn.com/s/0uP11wgyho' },
        { id: 7, name: '挪威三文鱼', price: 88, image: 'https://aka.doubaocdn.com/s/FmE21wgyho' },
        { id: 8, name: '阿拉斯加鳕鱼', price: 78, image: 'https://aka.doubaocdn.com/s/0uP11wgyho' },
      ],
    },
    {
      id: 102,
      title: '国产鲜鱼',
      subtitle: '当日捕捞·新鲜到家',
      items: [
        { id: 3, name: '鲜活鲈鱼', price: 35, image: 'https://aka.doubaocdn.com/s/bI8m1wgyho' },
        { id: 201, name: '带鱼', price: 28, image: 'https://aka.doubaocdn.com/s/bI8m1wgyho' },
        { id: 202, name: '黄花鱼', price: 45, image: 'https://aka.doubaocdn.com/s/bI8m1wgyho' },
        { id: 204, name: '罗非鱼', price: 16, image: 'https://aka.doubaocdn.com/s/bI8m1wgyho' },
      ],
    },
  ],
  2: [
    {
      id: 201,
      title: '鲜虾直达',
      subtitle: '活冻锁鲜·Q弹饱满',
      items: [
        { id: 2, name: '渤海大虾', price: 58, image: 'https://aka.doubaocdn.com/s/yFKn1wgyho' },
        { id: 205, name: '厄瓜多尔白虾', price: 78, image: 'https://aka.doubaocdn.com/s/yFKn1wgyho' },
        { id: 206, name: '青虾仁', price: 45, image: 'https://aka.doubaocdn.com/s/yFKn1wgyho' },
        { id: 207, name: '皮皮虾', price: 68, image: 'https://aka.doubaocdn.com/s/yFKn1wgyho' },
      ],
    },
    {
      id: 202,
      title: '蟹中臻品',
      subtitle: '膏满黄肥·肉质鲜美',
      items: [
        { id: 5, name: '鲜活龙虾', price: 168, image: 'https://aka.doubaocdn.com/s/Itn71wgyho' },
        { id: 6, name: '帝王蟹', price: 298, image: 'https://aka.doubaocdn.com/s/ykpS1wgyho' },
        { id: 9, name: '大闸蟹', price: 128, image: 'https://aka.doubaocdn.com/s/ykpS1wgyho' },
        { id: 208, name: '红虾', price: 58, image: 'https://aka.doubaocdn.com/s/yFKn1wgyho' },
      ],
    },
  ],
  3: [
    {
      id: 301,
      title: '鲜活贝类',
      subtitle: '现捞现发·鲜嫩多汁',
      items: [
        { id: 10, name: '扇贝肉', price: 38, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
        { id: 210, name: '生蚝', price: 28, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
        { id: 209, name: '鲍鱼', price: 98, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
        { id: 213, name: '鱿鱼干', price: 45, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
      ],
    },
  ],
  4: [
    {
      id: 401,
      title: '海味干货',
      subtitle: '日晒风干·原汁原味',
      items: [
        { id: 211, name: '虾仁干', price: 68, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
        { id: 212, name: '墨鱼干', price: 58, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
        { id: 213, name: '鱿鱼干', price: 45, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
        { id: 214, name: '瑶柱', price: 128, image: 'https://aka.doubaocdn.com/s/zr6j1wgyho' },
      ],
    },
  ],
  5: [
    {
      id: 501,
      title: '速冻海鲜',
      subtitle: '急速锁鲜·留住营养',
      items: [
        { id: 215, name: '冷冻虾仁', price: 38, image: 'https://aka.doubaocdn.com/s/hCua1wgyho' },
        { id: 216, name: '冷冻三文鱼排', price: 58, image: 'https://aka.doubaocdn.com/s/hCua1wgyho' },
        { id: 217, name: '冷冻鳕鱼块', price: 45, image: 'https://aka.doubaocdn.com/s/hCua1wgyho' },
        { id: 218, name: '冷冻扇贝柱', price: 35, image: 'https://aka.doubaocdn.com/s/hCua1wgyho' },
      ],
    },
  ],
  6: [
    {
      id: 601,
      title: '新鲜肉类',
      subtitle: '精选好肉·品质保障',
      items: [
        { id: 219, name: '五花肉', price: 32, image: 'https://aka.doubaocdn.com/s/fmN31wgyho' },
        { id: 220, name: '排骨', price: 42, image: 'https://aka.doubaocdn.com/s/fmN31wgyho' },
        { id: 219, name: '五花肉', price: 32, image: 'https://aka.doubaocdn.com/s/fmN31wgyho' },
        { id: 220, name: '排骨', price: 42, image: 'https://aka.doubaocdn.com/s/fmN31wgyho' },
      ],
    },
  ],
  7: [
    {
      id: 701,
      title: '新鲜果蔬',
      subtitle: '产地直发·绿色健康',
      items: [
        { id: 221, name: '西兰花', price: 8, image: 'https://aka.doubaocdn.com/s/1g461wgyho' },
        { id: 222, name: '胡萝卜', price: 6, image: 'https://aka.doubaocdn.com/s/1g461wgyho' },
        { id: 221, name: '西兰花', price: 8, image: 'https://aka.doubaocdn.com/s/1g461wgyho' },
        { id: 222, name: '胡萝卜', price: 6, image: 'https://aka.doubaocdn.com/s/1g461wgyho' },
      ],
    },
  ],
  8: [
    {
      id: 801,
      title: '海鲜调料',
      subtitle: '烹饪好帮手·提鲜增香',
      items: [
        { id: 223, name: '海鲜酱油', price: 18, image: 'https://aka.doubaocdn.com/s/eouS1wgyho' },
        { id: 224, name: '蒸鱼豉油', price: 16, image: 'https://aka.doubaocdn.com/s/eouS1wgyho' },
        { id: 223, name: '海鲜酱油', price: 18, image: 'https://aka.doubaocdn.com/s/eouS1wgyho' },
        { id: 224, name: '蒸鱼豉油', price: 16, image: 'https://aka.doubaocdn.com/s/eouS1wgyho' },
      ],
    },
  ],
})

const currentSecondaryCategories = ref(secondaryCategoriesMap.value[1] || [])

const selectPrimary = (index: number) => {
  activeIndex.value = index
  const categoryId = primaryCategories.value[index]?.id
  currentSecondaryCategories.value = secondaryCategoriesMap.value[categoryId] || secondaryCategoriesMap.value[1] || []
}
</script>

<template>
  <view class="viewport">
    <view class="search" :style="{ paddingTop: safeAreaTop + 'px' }">
      <view class="input">
        <text class="search-icon"></text>
        <text class="search-text">搜索海鲜水产</text>
      </view>
    </view>
    <view class="categories">
      <scroll-view class="primary" scroll-y>
        <view
          v-for="(item, index) in primaryCategories"
          :key="item.id"
          class="item"
          :class="{ active: index === activeIndex }"
          @tap="selectPrimary(index)"
        >
          <text class="name">{{ item.name }}</text>
        </view>
      </scroll-view>
      <scroll-view class="secondary" scroll-y>
        <view class="goods-list">
          <template v-for="panel in currentSecondaryCategories" :key="panel.id">
            <view class="panel">
              <view class="title">
                <view class="title-left">
                  <text class="title-text">{{ panel.title }}</text>
                  <text class="title-sub">{{ panel.subtitle }}</text>
                </view>
              </view>
              <view class="panel-items">
                <navigator
                  v-for="goods in panel.items"
                  :key="goods.id"
                  class="goods-card"
                  hover-class="none"
                  :url="`/pages/goods/goods?id=${goods.id}`"
                >
                  <image class="goods-image" mode="aspectFill" :src="goods.image"></image>
                  <view class="goods-info">
                    <text class="goods-name">{{ goods.name }}</text>
                    <text class="goods-price">¥{{ goods.price }}</text>
                  </view>
                </navigator>
              </view>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  height: 100%;
}
.viewport {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.search {
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #0099cc 0%, #0066ff 100%);
  flex-shrink: 0;
}
.search .input {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding-left: 26rpx;
  color: #fff;
  font-size: 28rpx;
  border-radius: 36rpx;
  background-color: rgba(255, 255, 255, 0.2);
}
.search-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 12rpx;
  opacity: 0.8;
}
.search-text {
  font-size: 28rpx;
}
.categories {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.primary {
  width: 180rpx;
  flex: none;
  background-color: #e6f7ff;
}
.primary .item {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 96rpx;
  font-size: 26rpx;
  color: #336699;
  position: relative;
}
.primary .item::after {
  content: '';
  position: absolute;
  left: 42rpx;
  bottom: 0;
  width: 96rpx;
  border-top: 1rpx solid #cceeff;
}
.primary .item.active {
  background-color: #fff;
}
.primary .item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 8rpx;
  height: 100%;
  background-color: #0066cc;
}
.primary .item.active .name {
  color: #0066cc;
  font-weight: bold;
}
.primary .item:last-child::after,
.primary .item.active::after {
  display: none;
}
.secondary {
  flex: 1;
  background-color: #fff;
}
.goods-list {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}
.panel {
  margin-bottom: 30rpx;
}
.panel-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.title {
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #e6f7ff;
}
.title-left {
  display: flex;
  align-items: baseline;
}
.title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #0066cc;
}
.title-sub {
  font-size: 22rpx;
  color: #999;
  margin-left: 12rpx;
}
.goods-card {
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.goods-image {
  width: 100%;
  height: 280rpx;
  border-radius: 12rpx 12rpx 0 0;
}
.goods-info {
  padding: 15rpx;
}
.goods-name {
  font-size: 24rpx;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8rpx;
}
.goods-price {
  font-size: 26rpx;
  color: #ff6600;
  font-weight: bold;
}
</style>
