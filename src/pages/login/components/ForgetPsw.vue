<script setup lang="ts">
import { ref } from "vue";
import {
  sendCode as sendCodeApi,
  verifyCode as verifyCodeApi,
  resetPassword as resetPasswordApi,
} from "@/api/login";

const step = ref(1);   

const account = ref("");
const verificationCode = ref("");

// 发送验证码
const sendVerificationCode = async () => {
  if (!account.value) {
    uni.showToast({
      title: "请输入注册时的手机号或邮箱",
      icon: "none",
    });
    return;
  }

  const res = await sendCodeApi(account.value);
  if (res.success) {
    step.value = 2;
	startResendTimer();
  } else {
    uni.showToast({
      title: res.msg,
      icon: "none",
    });
  }
};

// 验证验证码
const verifyCode = async () => {
  if (!verificationCode.value) {
    uni.showToast({
      title: "请输入验证码",
      icon: "none",
    });
    return;
  }

  const res = await verifyCodeApi(account.value, verificationCode.value);
  if (res.success) {
    step.value = 3;
  } else {
    uni.showToast({
      title: res.msg,
      icon: "none",
    });
  }
};

const timer = ref(0);

// 重新发送验证码倒计时
const startResendTimer = () => {
  timer.value = 60;
  const interval = setInterval(() => {
    timer.value--;
    if (timer.value <= 0) {
      clearInterval(interval);
    }
  }, 1000);
};

// 重新发送验证码
const resendCode = async () => {
  if (timer.value > 0) return;
  await sendVerificationCode();    
};

// 新密码
const newPassword = ref("");
// 确认密码
const confirmPassword = ref("");

// 重新注册
const resetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({
      title: "两次密码不一致",
      icon: "none",
    });
    return;
  }
  const res = await resetPasswordApi(account.value, newPassword.value);
  if (res.success) {
    step.value = 4;
  } else {
    uni.showToast({
      title: res.msg,
      icon: "none",
    });
  }
};

// 跳转回登录页
const redirectToLogin = () => {
  uni.navigateTo({
    url: "/pages/login/index",
  });
};
</script>

<template>
  <view class="container">
    <view v-if="step === 1">
      <view class="title">请输入注册时的手机号或邮箱</view>
      <u-input v-model="account" placeholder="手机号或邮箱"></u-input>
      <u-button
        class="next-step-btn"
        @click="sendVerificationCode"
        text="下一步"
      ></u-button>
    </view>
    <view v-if="step === 2">
      <view class="title">我们已发送验证码至{{ account }},请查收</view>
      <u-code-input v-model="verificationCode" :maxlength="6"></u-code-input>
      <u-button
        class="next-step-btn"
        @click="verifyCode"
        text="下一步"
      ></u-button>
      <u-button @click="resendCode" :disabled="timer > 0"
        >重新发送验证码({{ timer }}秒)</u-button
      >
    </view>
    <view v-if="step === 3">
      <view class="title">请输入新的密码</view>
      <u-input
        v-model="newPassword"
        placeholder="新密码"
        type="password"
      ></u-input>
      <u-input
        v-model="confirmPassword"
        placeholder="确认密码"
        type="password"
      ></u-input>
      <u-button
        class="submit-btn"
        @click="resetPassword"
        text="提交"
      ></u-button>
    </view>
    <view v-if="step === 4">
      <view class="title">密码重置成功，请使用新密码登录</view>
      <u-button
        class="back-login-btn"
        @click="redirectToLogin"
        text="返回登录"
      ></u-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.container {
  width: 92vw;
  height: 90.5vh;
  padding: 2vh 4vw;
  .title {
    font-size: 32rpx;
    color: #333;
    margin-bottom: 32rpx;
  }

  .next-step-btn,
  .submit-btn,
  .back-login-btn {
    margin-top: 40rpx;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 12rpx;
  }
  .back-login-btn {
    background-color: yellowgreen;
    color: #666666;
  }

  :deep(.u-input) {
    border-bottom: 1px solid #cccccc;
  }
}
</style>
