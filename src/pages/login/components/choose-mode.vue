<template>
  <view class="wrap">
    <!-- 装饰元素 -->
    <view class="decor top-left"></view>
    <view class="decor bottom-right"></view>
    
    <view class="container">
      <view class="title">请选择主界面模式</view>
      <view class="subtitle">根据您的工作需求选择相应模式</view>
      
      <view class="button-group">
        <button 
          class="mode-btn sampling" 
          @click="choose('sampling')"
        >
          <i class="iconfont icon-sampling"></i>
          <span>进入采样模式</span>
        </button>
        
        <button 
          class="mode-btn enforce" 
          @click="choose('enforce')"
        >
          <i class="iconfont icon-enforce"></i>
          <span>进入执法模式</span>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

// 与登录页里保持一致
const WRITE_PERMISSIONS = (mode: 'sampling'|'enforce') =>
  mode === 'sampling'
    ? ["tabbar_home_sampl", "tabbar_sample", "tabbar_user"]
    : ["tabbar_home", "tabbar_evaluate", "tabbar_user"]

function choose(mode: 'sampling'|'enforce') {
  // 1) 记住模式 & 权限菜单
  uni.setStorageSync('app_mode', mode)
  uni.setStorageSync('permissions', JSON.stringify(WRITE_PERMISSIONS(mode)))

  // 2) 刷新自定义 TabBar（你 App.vue 里已监听 refreshTabbar 重新挂载）
  uni.$emit?.('refreshTabbar')

  // 3) 进对应首页
  const url = mode === 'sampling'
    ? '/pages/sample/samplehome'
    : '/pages/index/index'
  console.log('>>> 选择完成，进入：', url)
  uni.reLaunch({ url })
}

// 可选：如果不是双权限，直接兜底回首页（防止误进）
onLoad(() => {
  const permitStr = String(uni.getStorageSync('user_app_permit') || '')
  const set = new Set(permitStr.split(/[,\s，]+/).map(s => s.trim()).filter(Boolean))
  if (!(set.has('采样') && set.has('执法'))) {
    const m = uni.getStorageSync('app_mode')
    const url = m === 'sampling' ? '/pages/sample/samplehome' : '/pages/index/index'
    if (url) uni.reLaunch({ url })
  }
})
</script>

<style scoped>
/* 基础样式 */
.wrap {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f5 100%);
  position: relative;
  overflow: hidden;
}

/* 装饰元素 */
.decor {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  opacity: 0.15;
  z-index: 0;
}

.top-left {
  top: -150rpx;
  left: -150rpx;
  background: #1677ff;
}

.bottom-right {
  bottom: -150rpx;
  right: -150rpx;
  background: #36cbcb;
}

/* 容器样式 */
.container {
  position: relative;
  z-index: 1;
  max-width: 600rpx;
  margin: 200rpx auto 0;
  text-align: center;
}

/* 标题样式 */
.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  letter-spacing: 1rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 80rpx;
  opacity: 0.8;
}

/* 按钮组 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  padding: 0 40rpx;
}

/* 按钮样式 */
.mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding: 36rpx 20rpx;
  width: 100%;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

/* 按钮图标 */
.mode-btn .iconfont {
  font-size: 40rpx;
}

/* 采样模式按钮 */
.sampling {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

/* 执法模式按钮 */
.enforce {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #fff;
}

/* 按钮悬停效果 */
.mode-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mode-btn:active::after {
  opacity: 1;
}

.mode-btn:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.12);
}

/* 引入图标库 */
@import url("//at.alicdn.com/t/c/font_3828245_5c37z3c4q5.css");

/* 图标定义 - 假设使用了iconfont */
.icon-sampling::before {
  content: "\e600"; /* 替换为实际的采样图标代码 */
}

.icon-enforce::before {
  content: "\e601"; /* 替换为实际的执法图标代码 */
}
</style>
