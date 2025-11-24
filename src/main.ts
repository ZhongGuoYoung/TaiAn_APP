import { createSSRApp } from "vue";
import App from "./App.vue";
import uviewPlus, { setConfig } from "uview-plus";
import * as Pinia from "pinia";
import "./utils/http";
import { getStorage } from "@/utils/storage";
import { decryptData } from "@/utils/encrypt";

export function createApp() {
  const app = createSSRApp(App);
  app.use(uviewPlus);
  app.use(Pinia.createPinia());
  setConfig({
    config: {
      unit: "rpx",
    },
  });

  // 自动登录逻辑
  const userInfo = getStorage("userInfo");
  if (userInfo && userInfo.token) {
    const token = decryptData(userInfo.token);
    if (token) {
      uni.switchTab({
        url: "/pages/index/index",
      });
    }
  }
  return {
    app,
  };
}
