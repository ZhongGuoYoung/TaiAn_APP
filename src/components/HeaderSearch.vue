<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  placeholder: {
    required: false,
    type: String,
    default: () => "请输入",
  },
  back: {
    required: false,
    type: Boolean,
    default: () => false,
  },
  focusFunction: {
    required: false,
    type: Function,
    default: () => undefined,
  },
  backFunction: {
    required: false,
    type: Function,
    default: () => undefined,
  },
  disabled: {
    required: false,
    type: Boolean,
    default: () => false,
  },
});

const emits = defineEmits(["search"]);

const inputRef = ref();

// 返回按钮
const goBack = () => {
  // 返回上一个
  if (props.backFunction) {
    props.backFunction();
    return;
  }
  if (props.back) uni.navigateBack();
  else inputRef.value.blur();
};

// 聚焦时显示返回
const focusBack = ref(false);

// 输入框聚焦
const handleFocus = () => {
  if (!props.back && props.focusFunction) focusBack.value = true;
  if (props.focusFunction) props.focusFunction(true);
};

// 输入框失去焦点
const handleBlur = () => {
  if (!props.back && props.focusFunction) focusBack.value = false;
  if (props.focusFunction) props.focusFunction(false);
};

// 输入框绑定
const input = ref("");

// 搜索
const handleSearch = () => {
  if (!input.value) return;
  emits("search", input.value);
};

defineExpose({ input });
</script>

<template>
  <view class="search-container">
    <view class="search-box">
      <u-icon
        v-if="props.back || focusBack"
        name="arrow-left"
        size="24"
        @click="goBack"
      ></u-icon>
      <u-input
        ref="inputRef"
        border="surround"
        shape="circle"
        :placeholder="props.placeholder"
        clearable
        :disabled="props.disabled"
        @focus="handleFocus"
        @blur="handleBlur"
        v-model="input"
      ></u-input>
      <u-button
        style="border: none; width: 18%; border-radius: 20rpx; color: #3c9cff"
        :hairline="false"
        text="搜索"
        @click="handleSearch"
      ></u-button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.search-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  .search-box {
    width: 92%;
    box-shadow: 0 0 10px #ccc;
    border-radius: 20rpx;
    display: flex;
  }
  :deep(.u-button:after) {
    border-top: none;
    border-bottom: none;
    border-right: none;
  }
}
</style>
