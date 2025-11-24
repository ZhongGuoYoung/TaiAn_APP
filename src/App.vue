<template>
  <view>
    <router-view />  <!-- 用于 h5，小程序不需要 -->
    <CustomTabbar v-if="showTabbar" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomTabbar from '@/components/CustomTabbar.vue'
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import {
  initLicenseClockOnce,
  startLicenseTickerForUI,
  stopLicenseTickerForUI,
  licenseLocked,
  getDeadlineTs
} from '@/utils/licenseGuard'

const showTabbar = ref(true)


onLaunch(() => {
  initLicenseClockOnce()
  console.log('App 启动，许可证截止：', new Date(getDeadlineTs()).toLocaleString())
})

onShow(() => {
  startLicenseTickerForUI()
  if (licenseLocked.value) {
    console.log('App 已到期（全局判定）')
  }
})

// App 到后台：停掉日志用计时器
onHide(() => {
  stopLicenseTickerForUI()
})

if (uni.$on) {
  uni.$on('refreshTabbar', () => {
    showTabbar.value = false
    setTimeout(() => {
      showTabbar.value = true
    }, 50)
  })
}
</script>