// 用于封存本地存储

/**
 * 封存本地存储
 * @param key
 * @param value
 */
export function setStorage(key: string, value: any) {
  if (typeof value === "object") {
    value = JSON.stringify(value);
  }
  uni.setStorageSync(key, value);
}

/**
 * 获取本地存储
 * @param key
 */
export function getStorage(key: string) {
  return uni.getStorageSync(key);
}

/**
 * 删除本地存储
 * @param key
 */
export function removeStorage(key: string) {
  uni.removeStorageSync(key);
}
