/*
   *  添加拦截器：
      拦截request请求
      拦截uploadFile请求
   *  TODO：
      1.非http开头需拼接地址
      2.请求超时
      3.添加小程序端请求头标识
      4.添加token请求头标识     
*/
import {useMemberStore} from '@/stores'
const baseUrl = 'https://pcapi-xiaotuxian-front-devtest.itheima.net';

//添加拦截器
const httpInterceptor = {
   // 拦截前触发
   invoke(options:UniApp.RequestOptions){
      // 1.非Http开头需要拼接地址
      if(!options.url.startsWith("http")){
         options.url = baseUrl + options.url;
      }
      // 2.请求超时 60s
      options.timeout = 10000;
      // 3.添加小程序端请求头标识
      options.header = {
         ...options.header,
         'source-client':'miniapp',
      }
      // 4.添加token请求头标识
      const memberStore = useMemberStore()
      const token = memberStore.profile?.token
      if(token){
         options.header.Authorization = token;
      }
      console.log(options);
   },
}
uni.addInterceptor('request', httpInterceptor);
uni.addInterceptor('uploadFile', httpInterceptor);


// 请求函数
/*
   * @param UniApp.RequestOptions options 请求配置项
   * @return Promise
   * 1、返回promise对象
   * 2、请求成功 2.1提取核心数据 res.data 2.2添加类型，支持泛型
   * 3、请求失败 3.1网络错误->提示用户切换网络 3.2 401错误->清理用户信息，跳转到登录页面
   *             3.3 其他错误->提示用户错误信息 
*/


type Data<T> = {
   code:string
   msg:string
   result:T
}
export const http = <T>(options: UniApp.RequestOptions) => {
   // 1、返回promise对象
   return new Promise<Data<T>>((resolve, reject) => {
      uni.request({
         ...options,
         //2、请求成功
         success(res){
            if(res.statusCode >=200 && res.statusCode < 300){
               // 2.1提取核心数据 res.data
               // 2.2添加类型，支持泛型
               resolve(res.data as Data<T>)
            }else if(res.statusCode === 401){
               //401 错误->清理用户信息，跳转到登陆页面
               const memberStore = useMemberStore()
               memberStore.clearProfile()
               uni.navigateTo({
                  url:'/pages/login/login'
               })
               reject(res)
            }
            else{
               uni.showToast({
                  icon:'none',
                  title: (res.data as Data<T>).msg || '请求失败，请稍后再试',
               })
               reject(res)
            }
         },
         // 3、请求失败
         fail(err){
            uni.showToast({
               icon: 'none',
               title: '请求失败，请检查网络'
            })
            reject(err)
         }
      });
   });
};