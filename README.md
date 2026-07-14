# 鲜渔岛 - 海鲜直供微信小程序

基于 uni-app + Vue 3 + TypeScript 开发的海鲜电商微信小程序，面向消费者和企业端用户，提供商品浏览、下单购买、UGC 分享、优惠码分销等完整功能。

## 技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | uni-app 3.0 + Vue 3.4 |
| 语言 | TypeScript 4.9 |
| 状态管理 | Pinia 3.0 + pinia-plugin-persistedstate |
| 样式 | Sass / SCSS |
| UI 组件 | uni-ui、自定义组件 |
| 构建工具 | Vite 5.2 |
| 目标平台 | 微信小程序（主要）、H5、支付宝小程序等 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式（微信小程序）
pnpm dev:mp-weixin

# 生产构建（微信小程序）
pnpm build:mp-weixin

# 类型检查
pnpm type-check
```

构建产物输出至 `dist/build/mp-weixin`，使用微信开发者工具导入该目录即可预览。

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── WaterProductGuess.vue    # 猜你喜欢瀑布流
│   ├── WaterProductSwiper.vue   # 商品轮播
│   └── vk-data-*/               # SKU 弹窗、数量选择器
├── pages/               # 主包页面
│   ├── index/           # 首页（轮播、分类导航、UGC feed、推荐）
│   ├── shop/            # 购物车
│   ├── my/              # 我的（订单、菜单、角色标识）
│   ├── login/           # 登录（用户端/企业端切换）
│   ├── goods/           # 商品详情（SKU、优惠码、分享）
│   ├── checkout/        # 确认订单
│   ├── order/           # 订单列表
│   ├── hot/             # 热门推荐
│   ├── category/        # 分类浏览
│   ├── ugc-post/        # 发布分享（图文+视频）
│   ├── ugc-detail/      # 分享详情（点赞、评论、收藏、视频播放）
│   ├── my-comments/     # 我的评价
│   ├── my-coupons/      # 我的优惠码
│   ├── admin/           # 企业端管理（商品上架、优惠码管理）
│   └── api-docs/        # API 文档
├── pagesMember/         # 分包页面
│   ├── profile/         # 个人信息
│   ├── address/         # 地址管理
│   ├── address-form/    # 地址编辑
│   ├── favorites/       # 我的收藏
│   ├── settings/        # 设置
│   └── help/            # 帮助中心
├── services/            # API 服务层
│   ├── seafood.ts       # 商品、UGC、优惠码、评论等核心 API
│   ├── login.ts         # 登录服务（支持角色参数）
│   ├── order.ts         # 订单服务
│   ├── shop.ts          # 购物车服务
│   ├── address.ts       # 地址服务
│   ├── favorites.ts     # 收藏服务
│   ├── hot.ts           # 热门推荐服务
│   └── profile.ts       # 个人信息服务
├── stores/              # Pinia 状态管理
│   └── modules/
│       ├── member.ts    # 会员信息（含角色 role 字段）
│       └── address.ts   # 地址信息
├── types/               # TypeScript 类型定义
│   ├── seafood.d.ts     # 商品、UGC、优惠码、评论类型
│   └── member.d.ts      # 会员、登录类型（含 UserRole）
├── data/
│   └── mock.ts          # Mock 数据
└── utils/
    └── system.ts        # 系统工具（安全区域等）
```

## 核心功能

### 双角色登录

登录页面支持用户端和企业端两种角色切换，通过 `role` 字段区分权限：

| 角色 | 权限 |
| --- | --- |
| 用户端 (`user`) | 浏览商品、下单购买、发布分享、领取优惠码 |
| 企业端 (`enterprise`) | 上架/管理商品、配置优惠码、所有用户端功能 |

企业端管理入口仅在 `role === 'enterprise'` 时显示，且管理页面设有 `onLoad` 权限校验，非企业端用户访问时自动拦截并返回。

### 商品详情与优惠码

商品详情页支持 SKU 选择、数量调节、地址选择、微信分享：

- **优惠码系统**：用户输入优惠码后自动校验有效性、企业发放状态（`active` 字段）、最低消费门槛
- **微信分享**：底部分享按钮弹出面板，支持分享给微信好友（`open-type="share"`）和朋友圈（`open-type="shareTimeline"`）
- **分享码传递**：分享链接携带 `couponCode` 参数，接收方打开后自动应用优惠降价

### UGC 分享社区

用户可发布图文或视频分享，其他用户可点赞、评论、收藏：

- **发布分享**：支持上传图片（最多9张）和视频（60秒内），图文与视频互斥
- **视频播放**：详情页支持视频封面+点击播放，首页卡片显示视频标识
- **互动持久化**：点赞数、评论数、浏览量、收藏状态均存储在本地，操作后刷新保持一致
- **评论管理**：用户可删除自己的评论，评论数自动同步

### 我的优惠码

用户在商品详情页应用优惠码后，自动领取到个人优惠码列表：

- **可用/已用 Tab 切换**：区分未使用和已使用/已过期的优惠码
- **优惠码详情**：展示折扣额度、适用商品、使用门槛、有效期、来源、领取时间
- **过期提醒**：临近过期（3天内）显示红色提醒
- **一键使用**：跳转到对应商品并自动应用优惠码

### 企业端管理

企业端用户可管理商品和优惠码：

- **商品上架**：填写商品名称、价格、原价、图片、库存、分类等信息
- **优惠码管理**：创建优惠码（百分比折扣/固定减免）、设置最低消费门槛、控制发放状态（启用/停用）、删除优惠码
- **企业配置优先**：企业端配置的优惠码覆盖同 code 的预设优惠码

### 我的评价

展示当前用户在所有分享中发表过的评论：

- 每条评价卡片关联对应分享的缩略图和摘要
- 点击可跳转到分享详情页
- 支持删除自己的评价

## 数据架构

项目采用前端 Mock + 本地存储的方式模拟后端数据，所有动态数据持久化到微信小程序本地存储：

| 存储 Key | 内容 | 说明 |
| --- | --- | --- |
| `member_store` | 会员信息 | 包含 id、nickname、avatar、role、token |
| `user_ugc_posts` | 用户发布的分享 | UgcContent 数组 |
| `ugc_stats` | UGC 统计数据 | `{ [ugcId]: { likes, comments, views } }` |
| `ugc_comments` | UGC 评论 | `{ [ugcId]: UgcComment[] }` |
| `ugc_liked` | 已点赞列表 | UGC ID 数组 |
| `ugc_collected` | 已收藏列表 | UGC ID 数组 |
| `admin_coupons` | 企业端优惠码配置 | CouponCode 数组 |
| `user_coupons` | 用户领取的优惠码 | 含有效期、来源、使用状态 |
| `admin_products` | 企业端上架商品 | SeafoodItem 数组 |

## 开发说明

### 环境要求

- Node.js >= 16
- pnpm >= 8
- 微信开发者工具（用于预览和调试微信小程序）

### 代码规范

- 组件采用 Vue 3 `<script setup lang="ts">` 语法
- 样式使用 SCSS，支持 `scoped` 隔离
- API 服务统一放在 `src/services/` 下，返回 `{ code, msg, result }` 格式
- 类型定义统一放在 `src/types/` 下
- 页面路由配置在 `src/pages.json` 中，分包页面放在 `pagesMember/` 下

### 自定义组件

通过 `pages.json` 的 `easycom` 配置自动引入组件：

- `uni-*` 前缀映射到 `@dcloudio/uni-ui`
- `WaterProduct*` 前缀映射到 `@/components/WaterProduct*.vue`
