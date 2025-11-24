<script setup lang="ts">
import { computed, ref, onMounted } from "vue";


const phone = uni.getStorageSync('phone');
const STORAGE_KEY = `searchHistory:${phone || 'guest'}`;


const historyList = ref<Array<{id:string; name:string; isAlways?:boolean}>>([]);

function loadHistory() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    historyList.value = Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn('读取历史失败', e);
    historyList.value = [];
  }
}

function saveHistory() {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(historyList.value));
  } catch (e) {
    console.warn('保存历史失败', e);
  }
}

onMounted(loadHistory);


const selectedValue = ref<string[]>([]);
const selectAll = ref<string[]>([]);

const deleteColor = computed(() => selectedValue.value.length === 0 ? "#666666" : "#f00");

const handleSelectAll = () => {
  if (!selectAll.value.includes("all")) {
    selectedValue.value = historyList.value
      .filter(i => !i.isAlways)
      .map((item) => item.id);
  } else {
    selectedValue.value = [];
  }
};

const handleSelectItem = (detail: string[]) => {
  const deletableCount = historyList.value.filter(i => !i.isAlways).length;
  if (detail.length === deletableCount && deletableCount > 0) {
    selectAll.value = ["all"];
  } else {
    selectAll.value = [];
  }
};

const handleDelete = () => {
  if (selectedValue.value.length === 0) return;
  uni.showModal({
    title: "提示",
    content: "确定删除所选记录吗？",
    success(res) {
      if (res.confirm) {
        historyList.value = historyList.value.filter(
          (item) => !selectedValue.value.includes(item.id)
        );
        selectedValue.value = [];
        saveHistory();
        uni.showToast({ title: '已删除', icon: 'none' });
      }
    },
  });
};


const handleClearAll = () => {
  uni.showModal({
    title: '提示',
    content: '确定清空全部历史（保留常搜）？',
    success(res) {
      if (!res.confirm) return;
      historyList.value = historyList.value.filter(i => i.isAlways);
      selectedValue.value = [];
      selectAll.value = [];
      saveHistory();
      uni.showToast({ title: '已清空', icon: 'none' });
    }
  });
};

// —— 6) 完成并返回（让上一页 onShow 里 reload）——
const handleDone = () => {
  // 不必传值，上一页 onShow => loadHistory()
  uni.navigateBack();
};
</script>

<template>
  <view class="container">
    <view class="content">
      <u-checkbox-group v-model="selectedValue" @change="handleSelectItem">
        <view class="item" v-for="item in historyList" :key="item.id">
          <!-- 常搜项不可选中删除 -->
          <u-checkbox
            :name="item.id"
            :disabled="item.isAlways === true"
          />
          <view class="text">
            {{ item.name }}
            <text v-if="item.isAlways" style="margin-left: 8rpx; font-size: 22rpx; color:#2979ff">常搜</text>
          </view>
        </view>
      </u-checkbox-group>
    </view>

    <view class="footer">
      <u-checkbox-group v-model="selectAll" @change="handleSelectAll">
        <u-checkbox label="全选" name="all" />
      </u-checkbox-group>

      <view style="display:flex; align-items:center; gap: 24rpx;">
        <view style="color:#666" @click="handleClearAll">清空</view>
        <view :style="{ color: deleteColor }" @click="handleDelete">删除</view>
        <u-button type="primary" size="small" @click="handleDone">完成</u-button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.container {
  width: 92vw;
  height: 88.5vh;
  position: relative;
  padding: 1vh 4vw 1vh 4vw;

  .content {
    width: 92vw;
    height: 100%;
    max-height: 100%;
    overflow-y: scroll;

    .item {
      width: 92vw;
      height: 6vh;
      display: flex;
      align-items: center;

      .text {
        height: 100%;
        width: 75vw;
        margin-left: 4vw;
        display: flex;
        align-items: center;
        border-bottom: 1rpx solid #eeeeee;
      }
    }
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 4vw;
    right: 4vw;
    height: 6.5vh;
    width: 92vw;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #666666;
    background: #fff;
  }
}
</style>
