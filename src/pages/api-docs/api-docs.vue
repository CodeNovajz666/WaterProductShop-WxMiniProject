<script setup lang="ts">
import { ref } from 'vue'

interface ApiItem {
  id: string
  method: string
  path: string
  title: string
  description: string
  params?: { name: string; type: string; required: boolean; desc: string }[]
  response?: { code: string; msg: string; data: string }[]
}

const activeCategory = ref('seafood')

const apiData: Record<string, ApiItem[]> = {
  seafood: [
    {
      id: '1',
      method: 'GET',
      path: '/seafood/banners',
      title: '获取轮播图',
      description: '获取首页食品安全检测报告轮播图数据',
      response: [
        { code: '0', msg: 'success', data: '[{id, imgUrl, hrefurl}]' }
      ]
    },
    {
      id: '2',
      method: 'GET',
      path: '/seafood/ugc',
      title: '获取UGC内容流',
      description: '获取用户分享的图文内容列表',
      response: [
        { code: '0', msg: 'success', data: '[{id, userId, userName, avatar, content, images, goodsId, goodsName, goodsImage, likes, comments, createdAt}]' }
      ]
    },
    {
      id: '3',
      method: 'GET',
      path: '/seafood/categories',
      title: '获取商品分类',
      description: '获取水产品分类列表',
      response: [
        { code: '0', msg: 'success', data: '[{id, name, icon}]' }
      ]
    },
    {
      id: '4',
      method: 'GET',
      path: '/seafood/items',
      title: '获取商品列表',
      description: '获取水产品商品列表，支持分页',
      params: [
        { name: 'page', type: 'number', required: true, desc: '页码，从1开始' },
        { name: 'pageSize', type: 'number', required: true, desc: '每页数量' },
        { name: 'categoryId', type: 'string', required: false, desc: '分类ID，不传则获取全部' }
      ],
      response: [
        { code: '0', msg: 'success', data: '{items: [{id, name, image, price, oldPrice, desc, soldCount}], total}' }
      ]
    },
    {
      id: '5',
      method: 'GET',
      path: '/seafood/items/:id',
      title: '获取商品详情',
      description: '根据商品ID获取商品详细信息',
      params: [
        { name: 'id', type: 'string', required: true, desc: '商品ID' }
      ],
      response: [
        { code: '0', msg: 'success', data: '{id, name, image, price, oldPrice, desc, soldCount, specs, images}' }
      ]
    }
  ],
  shop: [
    {
      id: '6',
      method: 'GET',
      path: '/shop/cart',
      title: '获取购物车列表',
      description: '获取当前用户的购物车商品列表',
      response: [
        { code: '0', msg: 'success', data: '[{id, goodsId, goodsName, goodsImage, spec, price, count, selected}]' }
      ]
    },
    {
      id: '7',
      method: 'POST',
      path: '/shop/cart',
      title: '添加商品到购物车',
      description: '将商品添加到购物车，相同规格自动合并数量',
      params: [
        { name: 'goodsId', type: 'string', required: true, desc: '商品ID' },
        { name: 'goodsName', type: 'string', required: true, desc: '商品名称' },
        { name: 'goodsImage', type: 'string', required: true, desc: '商品图片' },
        { name: 'spec', type: 'string', required: true, desc: '商品规格' },
        { name: 'price', type: 'number', required: true, desc: '商品价格' },
        { name: 'count', type: 'number', required: true, desc: '数量，默认1' }
      ],
      response: [
        { code: '0', msg: '添加成功', data: '{cartId, totalCount}' }
      ]
    },
    {
      id: '8',
      method: 'PUT',
      path: '/shop/cart/:id',
      title: '更新购物车商品',
      description: '更新购物车中商品的数量或选中状态',
      params: [
        { name: 'id', type: 'string', required: true, desc: '购物车记录ID' },
        { name: 'count', type: 'number', required: false, desc: '数量' },
        { name: 'selected', type: 'boolean', required: false, desc: '是否选中' }
      ],
      response: [
        { code: '0', msg: '更新成功', data: '{}' }
      ]
    },
    {
      id: '9',
      method: 'DELETE',
      path: '/shop/cart/:id',
      title: '删除购物车商品',
      description: '从购物车中删除指定商品',
      params: [
        { name: 'id', type: 'string', required: true, desc: '购物车记录ID' }
      ],
      response: [
        { code: '0', msg: '删除成功', data: '{}' }
      ]
    }
  ],
  member: [
    {
      id: '10',
      method: 'POST',
      path: '/member/login',
      title: '用户登录',
      description: '手机号验证码登录',
      params: [
        { name: 'mobile', type: 'string', required: true, desc: '手机号' },
        { name: 'code', type: 'string', required: true, desc: '验证码' }
      ],
      response: [
        { code: '0', msg: '登录成功', data: '{token, profile: {id, mobile, nickname, avatar}}' }
      ]
    },
    {
      id: '11',
      method: 'POST',
      path: '/member/sms',
      title: '发送验证码',
      description: '向指定手机号发送验证码',
      params: [
        { name: 'mobile', type: 'string', required: true, desc: '手机号' }
      ],
      response: [
        { code: '0', msg: '发送成功', data: '{}' }
      ]
    },
    {
      id: '12',
      method: 'GET',
      path: '/member/profile',
      title: '获取用户信息',
      description: '获取当前登录用户的个人信息',
      response: [
        { code: '0', msg: 'success', data: '{id, mobile, nickname, avatar}' }
      ]
    },
    {
      id: '13',
      method: 'PUT',
      path: '/member/profile',
      title: '更新用户信息',
      description: '更新用户昵称、头像等信息',
      params: [
        { name: 'nickname', type: 'string', required: false, desc: '昵称' },
        { name: 'avatar', type: 'string', required: false, desc: '头像URL' }
      ],
      response: [
        { code: '0', msg: '更新成功', data: '{id, mobile, nickname, avatar}' }
      ]
    }
  ],
  address: [
    {
      id: '14',
      method: 'GET',
      path: '/member/address',
      title: '获取收货地址列表',
      description: '获取当前用户的收货地址列表',
      response: [
        { code: '0', msg: 'success', data: '[{id, name, mobile, province, city, district, detail, isDefault}]' }
      ]
    },
    {
      id: '15',
      method: 'POST',
      path: '/member/address',
      title: '新增收货地址',
      description: '添加新的收货地址',
      params: [
        { name: 'name', type: 'string', required: true, desc: '收货人姓名' },
        { name: 'mobile', type: 'string', required: true, desc: '手机号' },
        { name: 'province', type: 'string', required: true, desc: '省份' },
        { name: 'city', type: 'string', required: true, desc: '城市' },
        { name: 'district', type: 'string', required: true, desc: '区县' },
        { name: 'detail', type: 'string', required: true, desc: '详细地址' },
        { name: 'isDefault', type: 'boolean', required: false, desc: '是否设为默认地址' }
      ],
      response: [
        { code: '0', msg: '添加成功', data: '{id, name, mobile, province, city, district, detail, isDefault}' }
      ]
    },
    {
      id: '16',
      method: 'PUT',
      path: '/member/address/:id',
      title: '更新收货地址',
      description: '更新指定的收货地址',
      params: [
        { name: 'id', type: 'string', required: true, desc: '地址ID' },
        { name: 'name', type: 'string', required: false, desc: '收货人姓名' },
        { name: 'mobile', type: 'string', required: false, desc: '手机号' },
        { name: 'province', type: 'string', required: false, desc: '省份' },
        { name: 'city', type: 'string', required: false, desc: '城市' },
        { name: 'district', type: 'string', required: false, desc: '区县' },
        { name: 'detail', type: 'string', required: false, desc: '详细地址' },
        { name: 'isDefault', type: 'boolean', required: false, desc: '是否设为默认地址' }
      ],
      response: [
        { code: '0', msg: '更新成功', data: '{id, name, mobile, province, city, district, detail, isDefault}' }
      ]
    },
    {
      id: '17',
      method: 'DELETE',
      path: '/member/address/:id',
      title: '删除收货地址',
      description: '删除指定的收货地址',
      params: [
        { name: 'id', type: 'string', required: true, desc: '地址ID' }
      ],
      response: [
        { code: '0', msg: '删除成功', data: '{}' }
      ]
    }
  ]
}

const categories = [
  { key: 'seafood', label: '商品管理', color: '#009966' },
  { key: 'shop', label: '购物车', color: '#ff6600' },
  { key: 'member', label: '用户管理', color: '#0066cc' },
  { key: 'address', label: '地址管理', color: '#9933cc' }
]

const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000'

const copyPath = (path: string) => {
  uni.setClipboardData({
    data: path,
    success: () => {
      uni.showToast({
        title: '已复制',
        icon: 'success'
      })
    }
  })
}
</script>

<template>
  <view class="api-docs">
    <view class="header">
      <view class="header-content">
        <text class="title">🐟 海鲜商城 API 文档</text>
        <text class="subtitle">Seafood Mall API Documentation</text>
        <view class="base-url">
          <text class="base-url-label">Base URL:</text>
          <text class="base-url-value">{{ baseUrl }}</text>
        </view>
      </view>
    </view>

    <scroll-view class="main-content" scroll-y>
      <view class="category-tabs">
        <view
          v-for="cat in categories"
          :key="cat.key"
          class="category-tab"
          :class="{ active: activeCategory === cat.key }"
          :style="{ '--active-color': cat.color }"
          @tap="activeCategory = cat.key"
        >
          <text class="category-tab-text">{{ cat.label }}</text>
        </view>
      </view>

      <view class="api-list">
        <view
          v-for="api in apiData[activeCategory]"
          :key="api.id"
          class="api-card"
        >
          <view class="api-header">
            <view class="api-method" :class="api.method.toLowerCase()">
              <text class="api-method-text">{{ api.method }}</text>
            </view>
            <view class="api-path-wrap" @tap="copyPath(api.path)">
              <text class="api-path">{{ api.path }}</text>
              <text class="api-copy-icon">📋</text>
            </view>
          </view>
          <view class="api-info">
            <text class="api-title">{{ api.title }}</text>
            <text class="api-description">{{ api.description }}</text>
          </view>

          <view class="api-section" v-if="api.params && api.params.length">
            <text class="section-title">📝 请求参数</text>
            <view class="params-table">
              <view class="params-header">
                <text class="param-name-col">参数名</text>
                <text class="param-type-col">类型</text>
                <text class="param-required-col">必填</text>
                <text class="param-desc-col">说明</text>
              </view>
              <view
                v-for="param in api.params"
                :key="param.name"
                class="params-row"
              >
                <text class="param-name">{{ param.name }}</text>
                <text class="param-type">{{ param.type }}</text>
                <text class="param-required" :class="{ yes: param.required }">
                  {{ param.required ? '是' : '否' }}
                </text>
                <text class="param-desc">{{ param.desc }}</text>
              </view>
            </view>
          </view>

          <view class="api-section" v-if="api.response && api.response.length">
            <text class="section-title">📤 返回示例</text>
            <view
              v-for="(resp, idx) in api.response"
              :key="idx"
              class="response-item"
            >
              <text class="response-code">{{ resp.code }}</text>
              <text class="response-msg">{{ resp.msg }}</text>
              <view class="response-data">
                <text class="response-data-text">{{ resp.data }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="footer">
        <text class="footer-text">🐟 海鲜商城 API Documentation</text>
        <text class="footer-version">Version 1.0.0</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss">
page {
  background-color: #f0f4f8;
  height: 100%;
}

.api-docs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  background: linear-gradient(135deg, #009966 0%, #00cc99 100%);
  padding: 60rpx 32rpx 40rpx;
  position: relative;
}

.header-content {
  position: relative;
  z-index: 1;
}

.title {
  font-size: 44rpx;
  font-weight: bold;
  color: #fff;
  display: block;
}

.subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-top: 8rpx;
}

.base-url {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.base-url-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.base-url-value {
  font-size: 26rpx;
  color: #fff;
  margin-left: 12rpx;
  font-family: monospace;
}

.main-content {
  flex: 1;
  padding: 20rpx;
}

.category-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  overflow-x: auto;
}

.category-tab {
  flex-shrink: 0;
  padding: 16rpx 28rpx;
  background: #fff;
  border-radius: 40rpx;
  border: 2rpx solid #e0e0e0;
  transition: all 0.3s ease;
}

.category-tab.active {
  background: var(--active-color);
  border-color: var(--active-color);
}

.category-tab-text {
  font-size: 26rpx;
  color: #666;
}

.category-tab.active .category-tab-text {
  color: #fff;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.api-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.api-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.api-method {
  width: 88rpx;
  height: 48rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.api-method.get {
  background: #e8f5e9;
}

.api-method.post {
  background: #e3f2fd;
}

.api-method.put {
  background: #fff3e0;
}

.api-method.delete {
  background: #ffebee;
}

.api-method-text {
  font-size: 24rpx;
  font-weight: bold;
  color: #009966;
}

.api-method.post .api-method-text {
  color: #1976d2;
}

.api-method.put .api-method-text {
  color: #ff9800;
}

.api-method.delete .api-method-text {
  color: #d32f2f;
}

.api-path-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8rpx;
  padding: 12rpx 20rpx;
}

.api-path {
  font-size: 28rpx;
  color: #333;
  font-family: monospace;
}

.api-copy-icon {
  margin-left: 12rpx;
  font-size: 28rpx;
}

.api-info {
  margin-bottom: 24rpx;
}

.api-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.api-description {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-top: 8rpx;
}

.api-section {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.params-table {
  background: #f8fafc;
  border-radius: 12rpx;
  overflow: hidden;
}

.params-header {
  display: flex;
  background: #e2e8f0;
  padding: 16rpx;
}

.param-name-col,
.param-type-col,
.param-required-col,
.param-desc-col {
  font-size: 24rpx;
  font-weight: bold;
  color: #64748b;
}

.param-name-col {
  width: 20%;
}

.param-type-col {
  width: 15%;
}

.param-required-col {
  width: 15%;
}

.param-desc-col {
  flex: 1;
}

.params-row {
  display: flex;
  padding: 16rpx;
  border-bottom: 1rpx solid #e2e8f0;
  &:last-child {
    border-bottom: none;
  }
}

.param-name {
  width: 20%;
  font-size: 26rpx;
  color: #333;
  font-family: monospace;
}

.param-type {
  width: 15%;
  font-size: 26rpx;
  color: #666;
}

.param-required {
  width: 15%;
  font-size: 26rpx;
  color: #999;
}

.param-required.yes {
  color: #ff4444;
}

.param-desc {
  flex: 1;
  font-size: 26rpx;
  color: #666;
}

.response-item {
  background: #f8fafc;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
}

.response-code {
  font-size: 28rpx;
  font-weight: bold;
  color: #009966;
}

.response-msg {
  font-size: 26rpx;
  color: #666;
  margin-left: 12rpx;
}

.response-data {
  margin-top: 12rpx;
  background: #fff;
  border-radius: 8rpx;
  padding: 16rpx;
}

.response-data-text {
  font-size: 24rpx;
  color: #333;
  font-family: monospace;
  word-break: break-all;
}

.footer {
  text-align: center;
  padding: 40rpx 0;
  margin-top: 20rpx;
}

.footer-text {
  font-size: 26rpx;
  color: #999;
  display: block;
}

.footer-version {
  font-size: 22rpx;
  color: #bbb;
  display: block;
  margin-top: 8rpx;
}
</style>