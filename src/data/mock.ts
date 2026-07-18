import type { SeafoodCategory, SeafoodItem, SeafoodBanner, UgcContent, CouponCode, Review } from '@/types/seafood'
import type { Order } from '@/types/order'
import { MOCK_COUPON_PRESETS } from '@/config/constants'

export const seafoodCategories: SeafoodCategory[] = [
  { id: '1', name: '鱼类', icon: 'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp' },
  { id: '2', name: '虾类', icon: 'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp' },
  { id: '3', name: '蟹类', icon: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp' },
  { id: '4', name: '贝类', icon: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp' },
  { id: '5', name: '刺身', icon: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp' },
  { id: '6', name: '海鲜礼盒', icon: 'https://preview.qiantucdn.com/58pic/73/26/95/36x58PICM7HjvjfuXQCwC_origin_PIC2018.jpg!qt_h320_webp' },
  { id: '7', name: '干货', icon: 'https://preview.qiantucdn.com/58pic/73/67/36/83F58PICimfWkYk49w58PICrK_origin_PIC2018.jpg!qt_w320_webp' },
  { id: '8', name: '火锅食材', icon: 'https://preview.qiantucdn.com/agency/dp/dp_thumbs/1006233/232617970/staff_1024.jpg!kuan320_webp' },
  { id: '9', name: '生鲜套餐', icon: 'https://preview.qiantucdn.com/agency/dp/dp_thumbs/1026029/147321705/staff_1024.jpg!kuan320_webp' },
  { id: '10', name: '限时特惠', icon: 'https://preview.qiantucdn.com/58pic/agency/dp/dp_thumbs/1026029/147321705/staff_1024.jpg!kuan320_webp' },
]

export const seafoodItems: SeafoodItem[] = [
  { id: '1', name: '新鲜三文鱼刺身', price: 128, oldPrice: 168, image: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp', desc: '挪威进口', soldCount: 2580 },
  { id: '2', name: '鲜活大闸蟹', price: 88, oldPrice: 128, image: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp', desc: '阳澄湖直供', soldCount: 3256 },
  { id: '3', name: '澳洲龙虾', price: 398, oldPrice: 498, image: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp', desc: '2斤左右', soldCount: 892 },
  { id: '4', name: '北海道扇贝', price: 48, oldPrice: 68, image: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp', desc: '6只装', soldCount: 1856 },
  { id: '5', name: '挪威三文鱼', price: 98, oldPrice: 128, image: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp', desc: '整块出售', soldCount: 2134 },
  { id: '6', name: '东海带鱼', price: 38, oldPrice: 48, image: 'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp', desc: '500g/份', soldCount: 4521 },
  { id: '7', name: '鲜活基围虾', price: 68, oldPrice: 88, image: 'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp', desc: '500g/份', soldCount: 2876 },
  { id: '8', name: '深海鳕鱼', price: 78, oldPrice: 98, image: 'https://preview.qiantucdn.com/agency/dp/dp_thumbs/1006233/232617970/staff_1024.jpg!kuan320_webp', desc: '肉质鲜嫩', soldCount: 1534 },
  { id: '9', name: '法式生蚝', price: 158, oldPrice: 198, image: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp', desc: '6只装', soldCount: 756 },
  { id: '10', name: '舟山梭子蟹', price: 58, oldPrice: 78, image: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp', desc: '500g/份', soldCount: 3124 },
  { id: '11', name: '新西兰青口贝', price: 38, oldPrice: 58, image: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp', desc: '1kg/份', soldCount: 1987 },
  { id: '12', name: '冰岛鳕鱼排', price: 88, oldPrice: 108, image: 'https://preview.qiantucdn.com/agency/dp/dp_thumbs/1006233/232617970/staff_1024.jpg!kuan320_webp', desc: '500g/份', soldCount: 1245 },
  { id: '13', name: '波士顿龙虾', price: 458, oldPrice: 558, image: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp', desc: '3斤左右', soldCount: 567 },
  { id: '14', name: '鲜活八爪鱼', price: 48, oldPrice: 68, image: 'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp', desc: '500g/份', soldCount: 1654 },
  { id: '15', name: '南极磷虾', price: 28, oldPrice: 38, image: 'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp', desc: '250g/份', soldCount: 5321 },
  { id: '16', name: '阿拉斯加帝王蟹', price: 688, oldPrice: 888, image: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp', desc: '4斤左右', soldCount: 342 },
]

export const ugcContents: UgcContent[] = [
  {
    id: '1',
    userId: 'u1',
    userName: '海鲜达人小王',
    avatar: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp',
    content: '今天收到的三文鱼刺身太新鲜了！肉质细腻，入口即化，家人都赞不绝口！强烈推荐给大家~',
    images: [
      'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp',
      'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp'
    ],
    goodsId: '1',
    goodsName: '新鲜三文鱼刺身',
    goodsImage: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp',
    likes: 256,
    comments: 32,
    createdAt: '2024-01-15 10:30'
  },
  {
    id: '2',
    userId: 'u2',
    userName: '美食家阿琳',
    avatar: 'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp',
    content: '大闸蟹到货啦！个头超大，蟹黄饱满，清蒸后味道鲜美，今年的蟹季太满足了~',
    images: [
      'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp'
    ],
    goodsId: '2',
    goodsName: '鲜活大闸蟹',
    goodsImage: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp',
    likes: 512,
    comments: 68,
    createdAt: '2024-01-14 18:20'
  },
  {
    id: '3',
    userId: 'u3',
    userName: '吃货小李',
    avatar: 'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp',
    content: '澳洲龙虾性价比超高！肉质Q弹，做法简单，蒜蓉蒸、芝士焗都好吃~',
    images: [
      'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp',
      'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp',
      'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp'
    ],
    goodsId: '3',
    goodsName: '澳洲龙虾',
    goodsImage: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp',
    likes: 389,
    comments: 45,
    createdAt: '2024-01-14 14:15'
  },
  {
    id: '4',
    userId: 'u4',
    userName: '厨房小白',
    avatar: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp',
    content: '扇贝超级新鲜！个头很大，蒜蓉粉丝蒸简直绝了，全家人都抢着吃~',
    images: [
      'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp'
    ],
    goodsId: '4',
    goodsName: '北海道扇贝',
    goodsImage: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp',
    likes: 187,
    comments: 23,
    createdAt: '2024-01-13 20:45'
  },
  {
    id: '5',
    userId: 'u5',
    userName: '美食探店',
    avatar: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp',
    content: '带鱼真的太新鲜了！没有腥味，肉质鲜嫩，红烧和清蒸都很好吃，以后就在这家买了~',
    images: [
      'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp',
      'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp'
    ],
    goodsId: '6',
    goodsName: '东海带鱼',
    goodsImage: 'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp',
    likes: 423,
    comments: 56,
    createdAt: '2024-01-13 16:30'
  }
]

export const seafoodBanners: SeafoodBanner[] = [
  { id: '1', imgUrl: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp' },
  { id: '2', imgUrl: 'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp' },
  { id: '3', imgUrl: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp' },
  { id: '4', imgUrl: 'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp' },
]

export const couponCodes: CouponCode[] = MOCK_COUPON_PRESETS.map(c => ({ ...c }))

export const reviews: Review[] = [
  {
    id: '1',
    goodsId: '1',
    userName: '海鲜达人小王',
    avatar: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp',
    rating: 5,
    content: '三文鱼非常新鲜，肉质细腻，入口即化！包装很精美，冷链配送，收到时还是冰的，非常满意！',
    images: ['https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp'],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    goodsId: '1',
    userName: '美食家阿琳',
    avatar: 'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp',
    rating: 5,
    content: '第二次购买了，品质一如既往的好！推荐给身边的朋友了，大家都说不错~',
    images: [],
    createdAt: '2024-01-14'
  },
  {
    id: '3',
    goodsId: '2',
    userName: '吃货小李',
    avatar: 'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp',
    rating: 5,
    content: '大闸蟹个头很大，蟹黄饱满，清蒸后味道鲜美，今年的蟹季太满足了！',
    images: ['https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp'],
    createdAt: '2024-01-14'
  },
  {
    id: '4',
    goodsId: '3',
    userName: '厨房小白',
    avatar: 'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp',
    rating: 5,
    content: '澳洲龙虾性价比超高！肉质Q弹，做法简单，蒜蓉蒸、芝士焗都好吃~',
    images: ['https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp'],
    createdAt: '2024-01-13'
  },
  {
    id: '5',
    goodsId: '1',
    userName: '美食探店',
    avatar: 'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp',
    rating: 4,
    content: '整体不错，就是分量希望能再多一点，好评！',
    images: [],
    createdAt: '2024-01-12'
  },
]

export const orders: Order[] = []

// 图片资源列表（集中管理）
export const seafoodImages = [
  'https://preview.qiantucdn.com/58pic/73/05/70/53K58PICch4vrq5jPmDIg_origin_PIC2018.jpg!qt_h320_webp',
  'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp',
  'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp',
  'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp',
  'https://preview.qiantucdn.com/58pic/73/96/17/24C58PICwyC6saIPHCSi4_origin_PIC2018.jpg!qt_w320_webp',
  'https://preview.qiantucdn.com/58pic/73/26/95/36x58PICM7HjvjfuXQCwC_origin_PIC2018.jpg!qt_h320_webp',
  'https://preview.qiantucdn.com/58pic/73/67/36/83F58PICimfWkYk49w58PICrK_origin_PIC2018.jpg!qt_h320_webp',
  'https://preview.qiantucdn.com/agency/dp/dp_thumbs/1006233/232617970/staff_1024.jpg!kuan320_webp',
  'https://preview.qiantucdn.com/agency/dp/dp_thumbs/1026029/147321705/staff_1024.jpg!kuan320_webp',
  'https://preview.qiantucdn.com/58pic/agency/dp/dp_thumbs/1026029/147321705/staff_1024.jpg!kuan320_webp',
  'https://preview.qiantucdn.com/58pic/73/26/95/36x58PICM7HjvjfuXQCwC_origin_PIC2018.jpg!qt_h320_webp',
  'https://preview.qiantucdn.com/58pic/73/67/36/83F58PICimfWkYk49w58PICrK_origin_PIC2018.jpg!qt_h320_webp',
  'https://preview.qiantucdn.com/58pic/73/96/17/22W58PICp4dWaPheE2UTz_origin_PIC2018.jpg!qt_w320_webp',
  'https://preview.qiantucdn.com/58pic/74/27/13/058PICU58PICZRmfigmgFmjeI_origin_PIC2018.png!qt_w320_webp',
  'https://preview.qiantucdn.com/58pic/agency/dp/dp_thumbs/1006233/232617970/staff_1024.jpg!kuan320_webp',
  'https://preview.qiantucdn.com/58pic/73/96/17/20I58PICsNvXvHpaApqWs_origin_PIC2018.jpg!qt_w320_webp',
]

export const seafoodNames = [
  '新鲜三文鱼刺身',
  '鲜活大闸蟹',
  '澳洲龙虾',
  '北海道扇贝',
  '挪威三文鱼',
  '东海带鱼',
  '鲜活基围虾',
  '深海鳕鱼',
  '法式生蚝',
  '舟山梭子蟹',
  '新西兰青口贝',
  '冰岛鳕鱼排',
  '波士顿龙虾',
  '鲜活八爪鱼',
  '南极磷虾',
  '阿拉斯加帝王蟹',
]

