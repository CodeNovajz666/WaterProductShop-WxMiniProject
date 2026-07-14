import type { PageParams } from '@/types/global'
import type { HotResult } from '@/types/hot'

type HotParams = PageParams & { subType?: string }

// 模拟网络延迟（极短，仅保留异步语义）
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

// 本地降级数据
const mockHotResult: HotResult = {
  id: '0',
  bannerPicture: '',
  title: '热门推荐',
  subTypes: [],
}

/**
 * 通用热门推荐类型
 * @param url 请求地址
 * @param data 请求参数
 */
export const getHotRecommendAPI = async (url: string, data?: HotParams) => {
  await delay()
  return { code: '0', msg: 'success', result: { ...mockHotResult } }
}
