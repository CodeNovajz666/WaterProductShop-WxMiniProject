import { createSSRApp } from "vue";
import pinia from './stores'
import { setupLoginInterceptor } from '@/utils/loginGuard'

import App from "./App.vue";
export function createApp() {
  const app = createSSRApp(App);
  app.use(pinia)

  // 注册全局登录拦截器
  // 拦截 navigateTo/redirectTo/reLaunch/switchTab
  // 访问需要登录的页面时自动校验登录状态
  setupLoginInterceptor()

  return {
    app,
  };
}
