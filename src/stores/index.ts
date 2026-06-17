import {createPinia} from 'pinia'
import persist from 'pinia-plugin-persistedstate'

//创建pinia实例
const pinia = createPinia()

//持久化存储插件
pinia.use(persist)

//默认导出给main.ts
export default pinia

//模块统一导出
export * from './modules/member'