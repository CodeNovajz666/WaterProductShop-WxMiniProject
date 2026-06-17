import { LoginResult } from '@/types/member'
import {http} from '@/utils/http'

type LoginParams = {
    code: string
    encryptedData: string
    iv: string
}

/**
 * 小程序登录
 * @param data 请求参数
 * @returns 
 * 
 */
export const postLoginWxMinAPI = (data:LoginParams) => {
    return http<LoginResult>({
        method: 'POST',
        url: '/login/wxMin',
        data,
    })
}

/**
 * 模拟手机号码快捷登录
 * 
 * @param phoneNumber
 */
export const postLoginWxMinSimpleAPI = (phoneNumber: string) => {
    return http<LoginResult>({
        method: 'POST',
        url: '/login/wxMin/simple',
        data: {
            phoneNumber,
        }
    })
}