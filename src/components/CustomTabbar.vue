<template>
  <view class="custom-tabbar">
    <view
      v-for="item in visibleTabs"
      :key="item.path"
      class="tab-item"
      :class="{ active: isActive(item.path) }"
      @click="handleTabClick(item.path)"
    >
      <!-- 图片图标（支持选中态） -->
      <image
        v-if="item.icon.startsWith('/')"
        class="tabbar-icon"
        :src="isActive(item.path) && item.selectedIcon ? item.selectedIcon : item.icon"
        mode="aspectFit"
      />
      <!-- u-icon 图标（可选） -->
      <u-icon
        v-else
        :name="item.icon"
        :size="22"
        :color="isActive(item.path) ? '#007AFF' : '#8a8a8a'"
      />
      <text class="tab-text">{{ item.name }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref, computed, onMounted } from 'vue'

type Mode = 'sampling' | 'enforce' | ''

/** —— 1) 全量 Tab 定义（带 permission 键） —— */
const allTabs = [
  // 执法模式的首页
  { name: '首页',   icon: 'home',                         path: '/pages/index/index',        permission: 'tabbar_home' },
  // 采样模式的首页
  { name: '首页',   icon: '/static/cysy.png', selectedIcon: '/static/cysy2.png', path: '/pages/sample/samplehome', permission: 'tabbar_home_sampl' },
  // 执法主功能
  { name: '评估',   icon: 'file-text',                    path: '/pages/task/index',         permission: 'tabbar_evaluate' },
  // 采样主功能
  { name: '采样',   icon: '/static/cy.png', selectedIcon: '/static/cy2.png',     path: '/pages/sample/index',      permission: 'tabbar_sample' },
  // 统一的“我的”
  { name: '我的',   icon: 'account',                      path: '/pages/home/index',         permission: 'tabbar_user' },
]

/** —— 2) 读取/生成权限 —— */
const currentPath = ref('')
const mode = ref<Mode>('')

function readMode(): Mode {
  const m = uni.getStorageSync('app_mode')
  return m === 'sampling' || m === 'enforce' ? m : ''
}

function safeParsePermissions(): string[] {
  // 登录/选择主界面时建议已写入 permissions（字符串化的数组）
  const raw = uni.getStorageSync('permissions')
  if (raw) {
    try {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.every(x => typeof x === 'string')) return arr
    } catch {}
  }
  // 兜底：按 app_mode 生成
  const m = readMode()
  if (m === 'sampling') {
    return ['tabbar_home_sampl', 'tabbar_sample', 'tabbar_user']
  }
  if (m === 'enforce') {
    return ['tabbar_home', 'tabbar_evaluate', 'tabbar_user']
  }
  // 再兜底：若还没有 mode（极少数边界），先给最小集合，避免空白
  return ['tabbar_user']
}

const userPermissions = ref<string[]>(safeParsePermissions())

/** —— 3) 计算可见 tabs —— */
const visibleTabs = computed(() =>
  allTabs.filter(tab => userPermissions.value.includes(tab.permission))
)

/** —— 4) 高亮逻辑 —— */
function updateCurrentPath() {
  const pages = getCurrentPages()
  if (pages.length) {
    // @ts-ignore
    const route = pages[pages.length - 1].route
    currentPath.value = '/' + route
  }
}

function isActive(path: string) {
  return currentPath.value === path
}

/** —— 5) 点击切页 —— */
function handleTabClick(path: string) {
  if (currentPath.value === path) return
  uni.reLaunch({
    url: path,
    success: () => (currentPath.value = path),
  })
}

/** —— 6) 外部刷新（登录/选择主界面后触发） —— */
function refresh() {
  mode.value = readMode()
  userPermissions.value = safeParsePermissions()
  updateCurrentPath()
}

if (uni.$on) {
  uni.$on('refreshTabbar', refresh)
}

/** —— 7) 生命周期 —— */
onMounted(() => {
  try { uni.hideTabBar({ animation: false }) } catch (e) {}
  refresh()
})
onShow(() => {
  refresh()
})
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  height: 50px;
  display: flex;
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0,0,0,.06);
}
.tab-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 4px 0;
}
.tabbar-icon { width: 24px; height: 24px; }
.tab-text { font-size: 12px; color: #8a8a8a; margin-top: 2px; }
.tab-item.active .tab-text { color: #007AFF; }
</style>
