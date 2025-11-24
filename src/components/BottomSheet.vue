<script setup lang="ts" name="BottomSheet">
import { computed, nextTick, ref } from "vue";

const emits = defineEmits(["open", "close"]);

const isOpen = ref(false);
const isHidden = ref(true);

const startY = ref(0);
const currentY = ref(0);
const translateY = ref(100);
const sheetHeight = ref(0);

// 是否添加过渡动画
const isTransition = ref(true);

// 绑定弹窗样式
const sheetStyle = computed(() => ({
  transform: `translateY(${translateY.value}%)`,
  transition: isTransition.value ? "transform 0.3s ease-in-out" : "none",
}));

// 打开面板
const openSheet = () => {
  isHidden.value = false;
  isOpen.value = true;
  nextTick(() => {
    const systemInfo = uni.getSystemInfoSync();
    sheetHeight.value = systemInfo.windowHeight;
    translateY.value = 40; // 打开到 40%
    isTransition.value = true;
    emits("open");
    uni.pageScrollTo({
      scrollTop: 0,
      duration: 0,
    });
  });
};

// 关闭面板
const closeSheet = () => {
  isOpen.value = false;
  isTransition.value = true;
  translateY.value = 100;
};

// 完全隐藏面板
const hideSheet = () => {
  isHidden.value = true;
  translateY.value = 100;
  emits("close");
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 0,
  });
};

// 手势拖动
const handleTouchStart = (event: TouchEvent) => {
  startY.value = event.touches[0].clientY;
  currentY.value = startY.value;
  isTransition.value = false;
};

const handleTouchMove = (event: TouchEvent) => {
  currentY.value = event.touches[0].clientY;
  let deltaY = currentY.value - startY.value;
  const movePercentage = (deltaY / sheetHeight.value) * 100;
  translateY.value = translateY.value + movePercentage;
  startY.value = currentY.value;
};

const handleTouchEnd = () => {
  isTransition.value = true;
  if (translateY.value < 40) {
    isOpen.value = true;
    translateY.value = 0;
  } else if (translateY.value > 40 && translateY.value < 80) {
    isOpen.value = true;
    translateY.value = 40;
  } else {
    isOpen.value = false;
    translateY.value = 100;
  }
  if (!isOpen.value && translateY.value >= 100) {
    hideSheet();
  }
};

defineExpose({ openSheet, isHidden, hideSheet });
</script>

<template>
  <view class="sheet-container" :style="sheetStyle">
    <!-- 头部 -->
    <view
      class="sheet-header"
      @touchstart="handleTouchStart"
      @touchmove.prevent="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <slot name="header"></slot>
    </view>

    <!-- 内容区域（支持滚动） -->
    <scroll-view scroll-y class="sheet-content">
      <slot />
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.sheet-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 95vh;
  width: 100vw;
  z-index: 3;
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  background-color: #fafafa;
  overflow-y: visible;

  .sheet-header {
    position: sticky;
    top: 0;
    z-index: 4;
    width: 100%;
    background-color: #fff;
  }

  .sheet-content {
    flex: 1;
    overflow-y: auto;
    max-height: calc(95vh - 100rpx);
    padding-bottom: 20rpx;
    -webkit-overflow-scrolling: touch;
	padding-bottom: 120rpx;
  }
}
</style>
