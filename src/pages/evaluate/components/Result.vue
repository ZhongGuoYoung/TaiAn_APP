<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";

let firmId: string | undefined;
let name = "";

onLoad((options) => {
  firmId = options.firmid;  // 赋值给外层变量
  const encodedName = options.name || "";
  name = decodeURIComponent(encodedName); // 赋值给外层name变量
  console.log("firmId:", firmId);
  console.log("name:", name);
});

const handleFinish = () => {
uni.navigateBack({ delta: 1 });
};



</script>

<template>
  <view class="container">
    <view class="header">
      <view class="header-text" @click="handleFinish">完成</view>
    </view>
    <view class="content">
      <image class="photo" src="/static/evaluate/result.webp" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.container {
  width: 100vw;
  height: 100vh;
  background-color: #f9f9f9;
  .header {
    background-color: #fff;
    padding: 100rpx 54rpx 30rpx 600rpx;
    height: 58rpx;
    .header-text {
      text-align: center;
      line-height: 50rpx;
      height: 50rpx;
      font-size: 32rpx;
      font-weight: bold;
      color: #333333;
    }
  }
  .content {
    margin-top: 1vh;
    height: calc(99vh - 188rpx);
    background-color: #ffffff;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    .photo {
      margin-top: 150rpx;
      width: 376rpx;
      height: 376rpx;
    }
  }
}
</style>
