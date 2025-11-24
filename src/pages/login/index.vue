<template>
  <view class="content">
    <image class="logo" src="/static/login/login-bg.webp" mode="widthFix" />
    <view class="name">
      <view style="font-size: 40rpx">您好！欢迎使用</view>
      <view style="font-size: 56rpx; font-weight: bold">生态环境评估</view>
    </view>
    <view class="form">
      <u-form :model="formData" borderBottom lebelPosition="right">
        <view class="label">账号</view>
        <u-form-item labelWidth="80" prop="formData.username">
          <u-input v-model="formData.phone"
            placeholder="请输入您的账号"
            border="bottom"
            clearable
          ></u-input>
        </u-form-item>
        <view class="label">密码</view>
        <u-form-item labelWidth="80" prop="formData.password">
          <u-input
            v-model="formData.password"
            placeholder="请输入您的密码"
            border="bottom"
            :password="isPsw"
          >
            <template #suffix>
              <u-icon :name="eye" size="21" @click="handlePsw"></u-icon>
            </template>
          </u-input>
        </u-form-item>
      </u-form>
      <view class="rmb-psw">
        <u-checkbox-group v-model="isRememberPsw" @change="handleRememberPsw">
          <u-checkbox
            label="记住密码"
            name="rmb-psw"
            shape="square"
          ></u-checkbox>
        </u-checkbox-group>
        <view @click="handleForgetPsw">忘记密码?</view>
      </view>
      <u-button
        type="primary"
        shape="circle"
        class="custom-button"
        @click="handleLogin"
        >登录</u-button
      >
    </view>
    <view class="footer">
      <view>v 2.0.0</view>
      <view class="footer-bottom">技术支持：济南中安数码科技有限公司</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getSaltAndPublicKey, loginWithEncryption } from '@/api/login';
import { setStorage } from "@/utils/storage";
import { sm2EncryptPassword } from '@/utils/crypto';

const formData = ref({
  phone: "",     // 用 phone 登录
  password: "",
  rememberPsw: false,
});


const isRememberPsw = ref<string[]>([]);

const isPsw = ref(true);

const eye = ref("eye-off");

// 查看密码
const handlePsw = () => {
  isPsw.value = eye.value !== "eye-off";
  eye.value = eye.value === "eye-off" ? "eye" : "eye-off";
};

onMounted(() => {
  const phone = uni.getStorageSync("remembered_phone");
  const password = uni.getStorageSync("remembered_password");

  if (phone && password) {
    formData.value.phone = phone;
    formData.value.password = password;
    formData.value.rememberPsw = true;
    isRememberPsw.value = ['rmb-psw']; //勾选状态恢复
  }
});


const handleLogin = async () => {
  if (!formData.value.phone || !formData.value.password) {
    uni.showToast({ title: "请填写账号和密码", icon: "none" });
    return;
  }
  uni.showLoading({ title: "登录中" });

  // 小工具：切分权限与进入模块
  const parsePerms = (s: string | string[] | null | undefined) => {
    const raw = Array.isArray(s) ? s.join(',') : String(s || '');
    return new Set(raw.split(/[,\s，]+/).map(t => t.trim()).filter(Boolean));
  };
  const enterMode = (mode: 'sampling' | 'enforce') => {
    // 记住选择，触发 TabBar 重新渲染
    uni.setStorageSync('app_mode', mode);
    uni.$emit?.('refreshTabbar');
    const url = mode === 'sampling' ? '/pages/sample/samplehome' : '/pages/index/index';
    uni.reLaunch({ url });
  };

  try {
    // 1. 拉取盐值+公钥，加密登录
    const saltRes = await getSaltAndPublicKey();
    const { salt, publicKey } = saltRes.data.response;

    const encryptedPassword = sm2EncryptPassword(
      formData.value.password,
      salt,
      publicKey
    );

    const loginRes = await loginWithEncryption({
      username: formData.value.phone,
      password: encryptedPassword
    });

    const result = loginRes.data;

    if (result.success && result.status === 200) {
      const { token, uid, user_app_permit, saasdm } = result.response;

      console.log("登录完整返回结果:", result.response);
      console.log("登录返回 user_app_permit =", user_app_permit);

      // 2. 基础信息入库
      uni.setStorageSync("token", token);
      uni.setStorageSync("uid", uid);
      uni.setStorageSync("phone", formData.value.phone);
      uni.setStorageSync("role", user_app_permit);        // 原存法保留
      uni.setStorageSync("user_app_permit", user_app_permit); // 建议新增：保存原始权限字符串
      uni.setStorageSync("saasdm", saasdm);

      const REGION_MAP: Record<string, string> = {
        '370902': '泰山区',
        '370911': '岱岳区',
        '370921': '宁阳县',
        '370923': '东平县',
        '370982': '新泰市',
        '370983': '肥城市'
      };
      uni.setStorageSync('regionName', REGION_MAP[saasdm] || '');

      // 3. 解析权限
      const perms = parsePerms(user_app_permit);
      const hasSampling = perms.has('采样');
      const hasEnforce  = perms.has('执法');

      // 4. permissions（TabBar 菜单）根据“当前模式”动态生成
      //    注意：双权用户此处暂不落 permissions，等真正进入模式后在 choose-mode 或直达时再写入
      const writePermissionsFor = (mode: 'sampling' | 'enforce') => {
        const permissions =
          mode === 'sampling'
            ? ["tabbar_home_sampl", "tabbar_sample", "tabbar_user"]
            : ["tabbar_home", "tabbar_evaluate", "tabbar_user"];
        uni.setStorageSync("permissions", JSON.stringify(permissions));
      };

      // 5. 分流
      if (hasSampling && hasEnforce) {
        // 双权限：若已有历史选择，直达；否则进入选择页
        const saved = uni.getStorageSync('app_mode') as 'sampling' | 'enforce' | '';
        if (saved === 'sampling' || saved === 'enforce') {
          writePermissionsFor(saved);
          enterMode(saved); // 内部会 reLaunch
        } else {
          // 先去选择页，选择页中再 enterMode + 写 permissions
          uni.reLaunch({ url: '/pages/login/components/choose-mode' });
        }
      } else if (hasSampling) {
        writePermissionsFor('sampling');
        enterMode('sampling');
      } else if (hasEnforce) {
        writePermissionsFor('enforce');
        enterMode('enforce');
      } else {
        uni.showToast({ title: '无可用权限', icon: 'none' });
      }
    } else {
      uni.showToast({ title: result.msg || "账号或密码错误", icon: "none" });
    }
  } catch (err) {
    console.error("登录异常", err);
    uni.showToast({ title: "登录失败", icon: "none" });
  } finally {
    uni.hideLoading();
  }
};




// 选择记住密码
const handleRememberPsw = (detail: Array) => {
  formData.value.rememberPsw = !(detail.length === 0);
};


// 忘记密码
const handleForgetPsw = () => {
  uni.navigateTo({
    url: "/pages/login/components/ForgetPsw",
  });
};
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .name {
    position: absolute;
    top: 158rpx;
    left: 38rpx;
  }

  .logo {
    width: 100vw;
  }

  .form {
    position: absolute;
    top: 388rpx;
    background-color: white;
    width: 100vw;
    border-radius: 78rpx 78rpx 0 0;
    box-sizing: border-box;
    padding: 88rpx 68rpx;

    .label {
      font-size: 36rpx;
      font-weight: normal;
      margin-left: 20rpx;
      margin-top: 20rpx;
    }

    :deep(.u-input) {
      border-bottom: 1px solid #cccccc;
    }

    .custom-button {
      margin-top: 100rpx;
      height: 98rpx;
      background: linear-gradient(180deg, #60b9ff 0%, #0967e6 100%);
      font-size: 36rpx;
    }

    .rmb-psw {
      margin-top: 10rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #999999;
      font-size: 24rpx;
    }
  }
  .footer {
    position: absolute;
    bottom: 48rpx;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 20rpx;
    color: #999999;
    .footer-bottom {
      margin-top: 20rpx;
    }
  }
}
</style>
