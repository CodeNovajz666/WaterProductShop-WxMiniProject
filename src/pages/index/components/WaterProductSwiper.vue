<script setup lang = "ts">
import { BannerItem } from '@/types/home';
import {ref} from 'vue'
const activeIndex = ref(0)
const onChange: UniHelper.SwiperOnChange = (ev) => {
    // console.log(ev.detail?.current)
    activeIndex.value = ev.detail?.current
}
//定义Props接受
defineProps<{
    list:BannerItem[]
}>()
console.log(defineProps)
// 当swiper
</script>

<template>
    <view class="carousel">
        <swiper 
            :circular="true" 
            :autoplay="true" 
            :interval="3000"
            @change="onChange"
        >
            <swiper-item v-for="item in list" :key="item.id">
                <navigator url="/pages/index/index" hover-class="none" class="navigator">
                    <image 
                        mode="aspectFill"
                        class="image"
                        :src="item.imgUrl">
                    </image>
                </navigator>
            </swiper-item>   
        </swiper>
        <!--指示点-->
        <view class="indicator">
            <text
                v-for="(item,index) in list"
                :key="item.id"
                class="dot"
                :class="{ active: index === activeIndex}"
            ></text>
        </view>
    </view>
</template>

<style lang = "scss">

</style>