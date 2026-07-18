import type { LogisticsInfo, LogisticsTrack } from '@/types/order'

// 模拟网络延迟
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

// 物流公司列表
const LOGISTICS_COMPANIES = [
  { code: 'SF', name: '顺丰速运' },
  { code: 'JD', name: '京东物流' },
  { code: 'ZTO', name: '中通快递' },
  { code: 'YTO', name: '圆通速递' },
  { code: 'STO', name: '申通快递' },
  { code: 'YD', name: '韵达快递' },
] as const

// 物流状态映射
const LOGISTICS_STATUS_MAP: Record<number, string> = {
  0: '待揽收',
  1: '已揽收',
  2: '运输中',
  3: '派送中',
  4: '已签收',
}

// 中转城市列表（模拟物流轨迹）
const TRANSIT_CITIES = ['上海', '杭州', '南京', '苏州', '无锡', '宁波', '嘉兴', '湖州']

/**
 * 生成物流单号
 * 格式：公司编码 + 12位数字（参考顺丰/京东物流单号规范）
 * 如：SF1234567890123
 */
const generateTrackingNo = (companyCode: string): string => {
  const random = Math.floor(Math.random() * 1e12)
    .toString()
    .padStart(12, '0')
  return `${companyCode}${random}`
}

/**
 * 根据订单发货时间和签收状态生成物流轨迹
 * @param shipTime 发货时间（ISO 字符串）
 * @param isSigned 是否已签收
 * @param trackingNo 物流单号
 * @param companyName 物流公司名称
 */
const generateTracks = (
  shipTime: Date,
  isSigned: boolean,
  receiverCity?: string,
): LogisticsTrack[] => {
  const tracks: LogisticsTrack[] = []
  const now = new Date()
  const targetCity = receiverCity || '收件地'

  // 节点1：商家发货（发货时间）
  tracks.push({
    time: shipTime.toISOString(),
    content: `【发货地】商品已发出，等待快递员揽收`,
    location: '发货地',
  })

  // 节点2：揽收（发货后 1 小时）
  const pickupTime = new Date(shipTime.getTime() + 60 * 60 * 1000)
  if (pickupTime <= now) {
    tracks.push({
      time: pickupTime.toISOString(),
      content: `快递员已揽收，等待发往中转场`,
      location: '发货地',
    })
  }

  // 节点3：到达中转场（发货后 3 小时）
  const transitTime1 = new Date(shipTime.getTime() + 3 * 60 * 60 * 1000)
  if (transitTime1 <= now) {
    const city1 = TRANSIT_CITIES[Math.floor(Math.random() * TRANSIT_CITIES.length)]
    tracks.push({
      time: transitTime1.toISOString(),
      content: `快件已到达【${city1}】中转场`,
      location: city1,
    })
  }

  // 节点4：运输中（发货后 6 小时）
  const transitTime2 = new Date(shipTime.getTime() + 6 * 60 * 60 * 1000)
  if (transitTime2 <= now) {
    const city2 = TRANSIT_CITIES[Math.floor(Math.random() * TRANSIT_CITIES.length)]
    tracks.push({
      time: transitTime2.toISOString(),
      content: `快件离开【${city2}】发往下一站`,
      location: city2,
    })
  }

  // 节点5：到达目的地（发货后 12 小时）
  const arriveTime = new Date(shipTime.getTime() + 12 * 60 * 60 * 1000)
  if (arriveTime <= now) {
    tracks.push({
      time: arriveTime.toISOString(),
      content: `快件已到达【${targetCity}】分拣中心`,
      location: targetCity,
    })
  }

  // 节点6：派送中（发货后 18 小时）
  const deliveryTime = new Date(shipTime.getTime() + 18 * 60 * 60 * 1000)
  if (deliveryTime <= now) {
    tracks.push({
      time: deliveryTime.toISOString(),
      content: `【${targetCity}】快递员正在派送中，请保持电话畅通`,
      location: targetCity,
    })
  }

  // 节点7：已签收（发货后 24 小时，仅当 isSigned=true）
  if (isSigned) {
    const signTime = new Date(shipTime.getTime() + 24 * 60 * 60 * 1000)
    tracks.push({
      time: signTime.toISOString(),
      content: `快件已签收，签收人：本人签收`,
      location: targetCity,
    })
  }

  // 倒序排列（最新在前）
  return tracks.reverse()
}

/**
 * 计算当前物流状态
 */
const calcLogisticsStatus = (tracks: LogisticsTrack[]): number => {
  if (tracks.length === 0) return 0
  const latest = tracks[0]
  if (latest.content.includes('已签收')) return 4
  if (latest.content.includes('派送中')) return 3
  if (latest.content.includes('到达') || latest.content.includes('离开')) return 2
  if (latest.content.includes('揽收')) return 1
  return 0
}

/**
 * 获取物流信息
 * @param trackingNo 物流单号
 * @param shipTime 发货时间（ISO 字符串）
 * @param isSigned 是否已签收
 * @param receiverCity 收件城市
 */
export const getLogisticsInfoAPI = async (
  trackingNo: string,
  companyName: string,
  shipTime: string,
  isSigned: boolean,
  receiverCity?: string,
): Promise<{ code: string; msg: string; result: LogisticsInfo }> => {
  await delay()

  // 找到物流公司编码
  const company = LOGISTICS_COMPANIES.find((c) => c.name === companyName) || LOGISTICS_COMPANIES[0]

  const shipDate = new Date(shipTime)
  const tracks = generateTracks(shipDate, isSigned, receiverCity)
  const status = calcLogisticsStatus(tracks)
  const currentLocation = tracks[0]?.location

  const result: LogisticsInfo = {
    trackingNo,
    companyCode: company.code,
    companyName: company.name,
    status,
    statusText: LOGISTICS_STATUS_MAP[status],
    currentLocation,
    tracks,
    isSigned,
  }

  return { code: '0', msg: 'success', result }
}

/**
 * 生成物流单号（供订单发货时调用）
 */
export const generateLogistics = (companyName?: string) => {
  const company = companyName
    ? LOGISTICS_COMPANIES.find((c) => c.name === companyName) || LOGISTICS_COMPANIES[0]
    : LOGISTICS_COMPANIES[Math.floor(Math.random() * LOGISTICS_COMPANIES.length)]
  return {
    trackingNo: generateTrackingNo(company.code),
    companyName: company.name,
  }
}

/**
 * 获取物流公司列表
 */
export const getLogisticsCompaniesAPI = async () => {
  await delay(20)
  return {
    code: '0',
    msg: 'success',
    result: LOGISTICS_COMPANIES.map((c) => ({ code: c.code, name: c.name })),
  }
}
