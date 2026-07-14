import type { LoginResult, UserRole } from '@/types/member'
import { MOCK_USER, MOCK_ENTERPRISE, DEFAULT_AVATAR } from '@/config/constants'

type LoginParams = {
    code: string
    encryptedData: string
    iv: string
}

// 模拟网络延迟（极短，仅保留异步语义）
const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms))

// 用户端 mock 登录数据
const mockUserResult: LoginResult = {
    id: MOCK_USER.ID,
    account: MOCK_USER.PHONE,
    nickname: MOCK_USER.NICKNAME,
    avatar: DEFAULT_AVATAR,
    token: `mock_token_${Date.now()}`,
    mobile: MOCK_USER.PHONE,
    role: 'user',
}

// 企业端 mock 登录数据
const mockEnterpriseResult: LoginResult = {
    id: MOCK_ENTERPRISE.ID,
    account: MOCK_ENTERPRISE.PHONE,
    nickname: MOCK_ENTERPRISE.NICKNAME,
    avatar: DEFAULT_AVATAR,
    token: `mock_token_${Date.now()}`,
    mobile: MOCK_ENTERPRISE.PHONE,
    role: 'enterprise',
}

/**
 * 小程序登录（微信授权）
 * @param data 请求参数
 * @param role 登录角色：user=用户端，enterprise=企业端
 */
export const postLoginWxMinAPI = async (data: LoginParams, role: UserRole = 'user') => {
    await delay()
    const base = role === 'enterprise' ? mockEnterpriseResult : mockUserResult
    return {
        code: '0',
        msg: 'success',
        result: { ...base, token: `mock_token_${Date.now()}` },
    }
}

/**
 * 模拟手机号码快捷登录
 * @param phoneNumber 手机号
 * @param role 登录角色：user=用户端，enterprise=企业端
 */
export const postLoginWxMinSimpleAPI = async (phoneNumber: string, role: UserRole = 'user') => {
    await delay()
    const base = role === 'enterprise' ? mockEnterpriseResult : mockUserResult
    return {
        code: '0',
        msg: 'success',
        result: {
            ...base,
            account: phoneNumber,
            mobile: phoneNumber,
            token: `mock_token_${Date.now()}`,
        },
    }
}
