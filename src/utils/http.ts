// 请求基本地址
import { useMemberStore } from "@/store/useMemberStore";

const baseUrl = import.meta.env.VITE_BASE_URL as string;

const httpInterceptor = {
  invoke(options: UniApp.RequestOptions) {
    // 1. 非 http 开头需拼接地址
    if (!options.url.startsWith('http')) {
      // 自动去除开头斜杠，防止双斜杠
      options.url = baseUrl + options.url.replace(/^\/?/, '');
    }

    // 2. 请求超时
    options.timeout = 10000;

    // 3. token 处理
    const memberStore = useMemberStore();
    const token = memberStore.profile?.token;
    if (token) {
      options.header = {
        ...options.header,
        Authorization: token
      };
    }
  }
};

uni.addInterceptor('request', httpInterceptor);
uni.addInterceptor('uploadFile', httpInterceptor);
