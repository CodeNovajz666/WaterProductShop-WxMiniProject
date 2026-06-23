import WaterProductSwiper from '@/components/WaterProductSwiper.vue'
import WaterProductGuess from '@/components/WaterProductGuess.vue'

declare module 'vue' {
  export interface GlobalComponents {
    WaterProductSwiper: typeof WaterProductSwiper
    WaterProductGuess: typeof WaterProductGuess
  }
}

// 组件实例类型
export type WaterProductGuessInstance = InstanceType<typeof WaterProductGuess>
export type WaterProductSwiperInstance = InstanceType<typeof WaterProductSwiper>
