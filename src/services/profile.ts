import type { ProfileDetail, ProfileParams } from '@/types/member'
import { MOCK_USER, DEFAULT_AVATAR } from '@/config/constants'

// 模拟网络延迟（极短，仅保留异步语义）
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

// 本地存储 key
const STORAGE_KEY = 'user_profile'

// 默认 profile 数据
const getDefaultProfile = (): ProfileDetail => ({
  id: MOCK_USER.ID,
  account: MOCK_USER.PHONE,
  nickname: MOCK_USER.NICKNAME,
  avatar: DEFAULT_AVATAR,
  gender: '男',
  birthday: '1995-01-01',
  profession: '美食博主',
  fullLocation: '',
})

/**
 * 从 localStorage 读取 profile
 */
const readProfile = (): ProfileDetail => {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as ProfileDetail
      // 合并默认值，防止字段缺失
      return { ...getDefaultProfile(), ...parsed }
    }
  } catch {
    // ignore
  }
  return getDefaultProfile()
}

/**
 * 写入 profile 到 localStorage
 */
const writeProfile = (profile: ProfileDetail) => {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // ignore
  }
}

/**
 * 获取个人信息
 */
export const getMemberProfileAPI = async () => {
  await delay()
  const profile = readProfile()
  return { code: '0', msg: 'success', result: { ...profile } }
}

/**
 * 修改个人信息
 * @param data 请求体参数
 */
export const putMemberProfileAPI = async (data: ProfileParams) => {
  await delay()
  const current = readProfile()
  const merged: ProfileDetail = {
    ...current,
    nickname: data.nickname ?? current.nickname,
    gender: data.gender ?? current.gender,
    birthday: data.birthday ?? current.birthday,
    profession: data.profession ?? current.profession,
    fullLocation: data.fullLocation ?? current.fullLocation,
  }
  writeProfile(merged)
  return { code: '0', msg: 'success', result: { ...merged } }
}

/**
 * 修改头像
 * 纯前端方案：直接保存图片路径到 localStorage
 * @param avatar 头像路径（临时路径或 base64）
 */
export const putMemberAvatarAPI = async (avatar: string) => {
  await delay()
  const current = readProfile()
  const updated: ProfileDetail = { ...current, avatar }
  writeProfile(updated)
  return { code: '0', msg: 'success', result: { ...updated } }
}
