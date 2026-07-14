/*
   *  HTTP 请求封装
      - 拦截 request / uploadFile
      - 统一拼接 baseUrl
      - 超时 3 秒快速失败
      - 自动附加 token
*/
import { useMemberStore } from '@/stores'
const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000'

// 递归替换接口返回中所有 http 图片地址为 https，消除小程序协议警告
const replaceHttpToHttps = (data: any): any => {
  if (typeof data === 'string') {
    return data.replace(/^http:\/\//, 'https://')
  }
  if (Array.isArray(data)) {
    return data.map(replaceHttpToHttps)
  }
  if (data && typeof data === 'object') {
    const result: any = {}
    for (const key in data) {
      result[key] = replaceHttpToHttps(data[key])
    }
    return result
  }
  return data
}

// 添加拦截器
const httpInterceptor = {
  invoke(options: UniApp.RequestOptions) {
    if (!options.url.startsWith('http')) {
      options.url = baseUrl + options.url
    }
    options.timeout = 3000
    options.header = {
      ...options.header,
      'source-client': 'miniapp',
    }
    const memberStore = useMemberStore()
    const token = memberStore.profile?.token
    if (token) {
      options.header.Authorization = token
    }
  },
}
uni.addInterceptor('request', httpInterceptor)
uni.addInterceptor('uploadFile', httpInterceptor)

type Data<T> = {
  code: string
  msg: string
  result: T
}

export const http = <T>(options: UniApp.RequestOptions) => {
  return new Promise<Data<T>>((resolve, reject) => {
    uni.request({
      ...options,
      timeout: 3000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = replaceHttpToHttps(res.data) as Data<T>
          resolve(data)
        } else if (res.statusCode === 401) {
          const memberStore = useMemberStore()
          memberStore.clearProfile()
          uni.reLaunch({ url: '/pages/login/login' })
          reject(res)
        } else {
          console.warn('[http] 响应异常:', res.statusCode)
          reject(res)
        }
      },
      fail(err) {
        // 不重试：后端不可用时服务层 .catch() 会立即降级到 mock 数据
        console.warn('[http] 请求失败:', err?.errMsg || err)
        reject(err)
      },
    })
  })
}
