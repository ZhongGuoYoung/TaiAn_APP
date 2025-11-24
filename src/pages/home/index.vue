<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import CustomTabbar from '@/components/CustomTabbar.vue';


type Fn = () => void;

interface FunctionItem {
  name: string;
  icon: string;
  function?: Fn;
  desc?: string;     
  [key: string]: any;
}

const userInfo = ref({
  avatarUrl: "../../static/home/tx2.png",
  nickName: "",    
  phone: "",
});

onMounted(() => {
  userInfo.value.phone = uni.getStorageSync("phone") || "未知手机号";
  userInfo.value.nickName = uni.getStorageSync("nickName") || "";
});

//权限与模式 
const permitStr = String(uni.getStorageSync("user_app_permit") || "");
const perms = new Set(permitStr.split(/[,\s，]+/).map(s => s.trim()).filter(Boolean));
const isDual = perms.has("采样") && perms.has("执法");

// 当前模式（sampling | enforce | ''）
const appMode = computed(() => {
  const m = uni.getStorageSync("app_mode");
  return m === 'sampling' || m === 'enforce' ? m : '';
});
const appModeText = computed(() => appMode.value === 'sampling' ? '采样' : appMode.value === 'enforce' ? '执法' : '未设置');

/** ===== 菜单列表 ===== */
const functionList = ref<FunctionItem[]>([
  // 双权限时：放在最上面
  // 会在下面 if (isDual) 时 unshift 进来
  {
    name: "当前版本",
    icon: "../../static/home/version.svg",
    function: () => {
      uni.showToast({ title: "当前版本: 2.0.0", icon: "none", duration: 2000 });
    },
    desc: "2.0.0",
  },
  {
    name: "清除缓存",
    icon: "../../static/home/clean.svg",
    function: () => {
      uni.clearStorageSync();
      uni.showToast({ title: "缓存已清除", icon: "none" });
    },
    desc: "arrow",
  },
]);

// 双权限用户：加入“配置主界面”
if (isDual) {
  functionList.value.unshift({
    name: "配置主界面",
    icon: "../../static/home/switch.png", // 自备一个图标
    function: () => {
      uni.navigateTo({ url: "/pages/login/components/choose-mode" });
    },
    desc: "arrow",
  });
}

//退出登录
const handleLogout = async () => {
  try {

  } catch (e) {}
  uni.clearStorageSync();
  uni.reLaunch({ url: "/pages/login/index" });
};

</script>

<template>
  <view class="container">
    <view class="header">
      <view class="information">
        <!-- 头像 -->
        <view class="profile">
          <image :src="userInfo.avatarUrl" mode="aspectFill"></image>
        </view>
        <!-- 信息 -->
        <view class="info">
          <view class="name">
            {{ userInfo.nickName || ' ' }}
          </view>
          <view class="phone">
            {{ userInfo.phone }}
          </view>
          <view class="mode-line">
            当前主界面：<text class="mode">{{ appModeText }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="content">
      <view v-for="(item, index) in functionList" :key="index">
        <view
          class="item"
          :class="{ 'item-last': index === functionList.length - 1 }"
          @click="item.function && item.function()"
        >
          <image :src="item.icon" />
          <view class="item-right">
            <view>{{ item.name }}</view>
            <view v-if="item.desc !== 'arrow'">{{ item.desc }}</view>
            <view v-else><u-icon name="arrow-right" size="22"></u-icon></view>
          </view>
        </view>
      </view>    
    </view>

    <view class="footer">
      <u-button
        size="large"
        type="warning"
        shape="circle"
        @click="handleLogout"
        text="退出登录"
      ></u-button>
    </view>
  </view>

  <CustomTabbar/>
</template>

<style scoped lang="scss">
.container {
  height: 100vh;
  width: 100vw;
  background-color: #f5f7f8;
  display: flex;
  flex-direction: column;

  .header {
    height: 30vh;
    width: 100vw;
    background-image: url("../../static/home/home-bg.webp");
    background-size: 100% 100%;

    .information {
      width: 85vw;
      height: 13vh;
      margin: 10vh auto 0 auto;
      display: flex;

      .profile {
        width: 130rpx;
        height: 130rpx;
        border-radius: 50%;
        margin-top: 5vh;
        image {
          width: 90%;
          height: 90%;
          border-radius: 50%;
        }
      }

      .info {
        width: 65vw;
        height: 12vh;
        margin: 6vh 0 0 0.5rem;
        color: #1f1f1f;

        .name {
          width: 60vw;
          height: 1.5rem;
          line-height: 1.5rem;
          font-size: 1.5rem;
        }
        .phone {
          width: 60vw;
          height: 1rem;
          line-height: 1.2rem;
          font-size: 1rem;
          margin-top: 0.3rem;
        }
        .mode-line {
          margin-top: 0.3rem;
          font-size: 26rpx;
          color: #666;
          .mode { color: #1677ff; margin-left: 6rpx; }
        }
      }
    }
  }

  .content {
    position: absolute;
    top: 472rpx;
    width: calc(100vw - 94rpx);
    background-color: white;
    padding: 30rpx 54rpx 30rpx 42rpx;
    border-radius: 20rpx 20rpx 0 0;

    .item {
      display: flex;
      height: 108rpx;
      align-items: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      image {
        width: 50rpx;
        height: 50rpx;
        border-radius: 50%;
        margin-left: 20rpx;
      }
      .item-right {
        margin-left: 30rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 78%;
        font-size: 32rpx;
      }
    }

    .item-last {
      border-bottom: none;
    }

    .quick-switch {
      margin-top: 24rpx;
    }
  }

  .footer {
    position: absolute;
    top: 80vh;
    left: 50%;
    transform: translateX(-50%);
    .u-button {
      width: 70vw;
    }
  }
}
</style>
