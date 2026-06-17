import {WaterProductSwiper} from './components/WaterProductSwiper.vue';
declare module '@/vue/runtime-core'{
    export interface GlobalComponents{
        WaterProductSwiper: typeof WaterProductSwiper
    }
}