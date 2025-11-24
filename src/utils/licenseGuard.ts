// /src/utils/licenseGuard.ts
import { ref, computed } from 'vue'

// ===== 配置：固定绝对截止时间（月份从0开始，6代表7月！）=====
const DEADLINE_TS = new Date(2026, 6, 1, 10, 0, 0).getTime();

// 轻量防“系统时间回拨”（可选）
const LAST_SEEN_KEY = '__lastSeenTs';
const MANUAL_LOCK_KEY = '__licenseLocked';

// 全局滴答，用于驱动 UI 刷新 & 仅打印日志
const nowTick = ref(Date.now());
let _timer: any = null;

export function initLicenseClockOnce() {
  const now = Date.now();
  const last = Number(uni.getStorageSync(LAST_SEEN_KEY) || 0);
  // 如果系统时间被回拨超过 2 分钟，永久锁死（存一位）
  if (last && now + 2 * 60 * 1000 < last) {
    uni.setStorageSync(MANUAL_LOCK_KEY, '1');
  }
  uni.setStorageSync(LAST_SEEN_KEY, String(now));
}

/** 仅用于“日志输出 + 驱动 licenseLocked 响应式更新”，不在页面展示 */
export function startLicenseTickerForUI() {
  stopLicenseTickerForUI();
  _timer = setInterval(() => {
    nowTick.value = Date.now(); // 驱动 computed 重算
    const remain = Math.floor((DEADLINE_TS - nowTick.value) / 1000);
    if (remain <= 0) stopLicenseTickerForUI();
  }, 1000);
}

export function stopLicenseTickerForUI() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

/** 到期判定（关键）：看“手动锁”或“当前时刻 >= 截止时间” */
export const licenseLocked = computed(() => {
  const manualLocked = uni.getStorageSync(MANUAL_LOCK_KEY) === '1';
  // 依赖 nowTick 才能在页面打开的情况下，按秒刷新禁用态
  return manualLocked || nowTick.value >= DEADLINE_TS;
});

/** 统一拦截器：到期则 toast 并阻断 */
export function guardLicense(verb = '执行此操作') {
  if (licenseLocked.value) {
    uni.showToast({ title: `功能已到期，无法${verb}`, icon: 'none' });
    return false;
  }
  return true;
}

// 可选导出：需要时可打印/记录截止时间
export function getDeadlineTs() {
  return DEADLINE_TS;
}
