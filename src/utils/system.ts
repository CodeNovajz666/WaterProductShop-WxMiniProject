/**
 * 获取安全区域 insets
 * 新版微信推荐使用 uni.getWindowInfo()，旧版回退到 uni.getSystemInfoSync()
 */
export const getSafeAreaInsets = (): { top: number; bottom: number } => {
  try {
    // 优先使用新 API（无弃用警告）
    const windowInfo = uni.getWindowInfo?.()
    if (windowInfo?.safeAreaInsets) {
      return {
        top: windowInfo.safeAreaInsets.top || 0,
        bottom: windowInfo.safeAreaInsets.bottom || 0,
      }
    }
    // 兼容设备信息（部分版本 safeAreaInsets 在 deviceInfo 中）
    const deviceInfo = uni.getDeviceInfo?.()
    if (deviceInfo) {
      // deviceInfo 不含 safeAreaInsets，继续回退
    }
  } catch {
    // 新 API 不存在，回退
  }
  // 旧版回退
  try {
    const systemInfo = uni.getSystemInfoSync()
    return {
      top: systemInfo.safeAreaInsets?.top || 0,
      bottom: systemInfo.safeAreaInsets?.bottom || 0,
    }
  } catch {
    return { top: 0, bottom: 0 }
  }
}
