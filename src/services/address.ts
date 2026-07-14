import type { AddressItem, AddressParams } from '@/types/address'

// 本地存储 key
const STORAGE_KEY = 'user_addresses'

// 模拟网络延迟（极短，仅保留异步语义）
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

/** 读取本地地址列表 */
const readAddresses = (): AddressItem[] => {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as AddressItem[]) : []
  } catch {
    return []
  }
}

/** 写入本地地址列表 */
const writeAddresses = (list: AddressItem[]) => {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(list))
}

/**
 * 添加收货地址
 * @param data 请求参数
 */
export const postMemberAddressAPI = async (data: AddressParams) => {
  await delay()
  const list = readAddresses()

  // 若新增为默认地址，先取消其他默认
  if (data.isDefault === 1) {
    list.forEach((a) => (a.isDefault = 0))
  }

  const newItem: AddressItem = {
    ...data,
    id: `addr_${Date.now()}`,
    fullLocation: '',
  }
  list.push(newItem)
  writeAddresses(list)
  return { code: '0', msg: 'success', result: newItem }
}

/**
 * 获取收货地址列表
 */
export const getMemberAddressAPI = async () => {
  await delay()
  return { code: '0', msg: 'success', result: readAddresses() }
}

/**
 * 获取收货地址详情
 * @param id 地址id(路径参数)
 */
export const getMemberAddressByIdAPI = async (id: string) => {
  await delay()
  const list = readAddresses()
  const item = list.find((a) => a.id === id) || list[0]
  return { code: '0', msg: 'success', result: item }
}

/**
 * 修改收货地址
 * @param id 地址id(路径参数)
 * @param data 表单数据(请求体参数)
 */
export const putMemberAddressByIdAPI = async (id: string, data: AddressParams) => {
  await delay()
  const list = readAddresses()

  // 若修改为默认地址，先取消其他默认
  if (data.isDefault === 1) {
    list.forEach((a) => (a.isDefault = 0))
  }

  const target = list.find((a) => a.id === id)
  if (target) {
    Object.assign(target, data)
    writeAddresses(list)
    return { code: '0', msg: 'success', result: target }
  }
  return { code: '0', msg: 'success', result: null }
}

/**
 * 删除收货地址
 * @param id 地址id(路径参数)
 */
export const deleteMemberAddressByIdAPI = async (id: string) => {
  await delay()
  const list = readAddresses()
  const filtered = list.filter((a) => a.id !== id)
  writeAddresses(filtered)
  return { code: '0', msg: 'success', result: null }
}
