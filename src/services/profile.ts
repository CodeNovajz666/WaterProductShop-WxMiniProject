import type { ProfileDetail, ProfileParams } from '@/types/member'
import { MOCK_USER, DEFAULT_AVATAR } from '@/config/constants'

// 模拟网络延迟（极短，仅保留异步语义）
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

// 本地降级数据
const mockProfile: ProfileDetail = {
  id: MOCK_USER.ID,
  account: MOCK_USER.PHONE,
  nickname: MOCK_USER.NICKNAME,
  avatar: DEFAULT_AVATAR,
  gender: '男',
  birthday: '1995-01-01',
  profession: '美食博主',
}

/**
 * 获取个人信息
 */
export const getMemberProfileAPI = async () => {
  await delay()
  return { code: '0', msg: 'success', result: { ...mockProfile } }
}

/**
 * 修改个人信息
 * @param data 请求体参数
 */
export const putMemberProfileAPI = async (data: ProfileParams) => {
  await delay()
  const merged = { ...mockProfile, ...data }
  Object.assign(mockProfile, merged)
  return { code: '0', msg: 'success', result: merged }
}
