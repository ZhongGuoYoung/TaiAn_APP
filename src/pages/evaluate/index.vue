<script setup lang="ts">
import HeaderSearch from "@/components/HeaderSearch.vue";
import { onLoad,onShow } from "@dcloudio/uni-app";
import { nextTick, ref } from "vue";
import type { TaskList } from "@/types/task";
import TaskCard from "@/pages/evaluate/components/TaskCard.vue";
import "@/utils/http";

let firmId = "";
let firmName = "";
let keyunitType = "";

const headerSearchRef = ref(null);
const disabled = ref(false);

const currentIndex = ref(0);
const isRefreshing = ref(false);


onShow(() => {
  console.log("📌 页面重新显示，刷新数据");
  fetchTaskList(); // 重新调接口拉取最新数据
});

// 数据
const dataList = ref<TaskList[]>([
  { title: "全部", tasks: [] },
  { title: "已评估", tasks: [] },
  { title: "待评估", tasks: [] },
]);

const q = ref<{ EvaluationId?: string; EvaluationCode?: string }>({})

// 页面加载
onLoad((options:any) => {
  console.log("onLoad 接收到参数:", options);

  firmId = String(options.firmId || options.id || "");
  firmName = decodeURIComponent(options.name || "");
  keyunitType = String(options.keyunitType || "01").padStart(2, "0"); // ✅ 直接用 keyunitType
  q.value.EvaluationId = String(options.EvaluationId || '');
  q.value.EvaluationCode =String( options.EvaluationCode || '');
  nextTick(() => {
    headerSearchRef.value.input = firmName;
  });

  fetchTaskList();
});



// 获取任务列表接口
const fetchTaskList = async () => {
  try {
     console.log("请求参数:", { firmId, keyunitType });

    const res = await uni.request({
      url: "api/UnitEvaluation/EvaluateTasks",
      method: "GET",
      data: { firmId, unitType: keyunitType },
      timeout: 10000,
    });

    console.log("接口完整返回:", res.data);

    if (!res.data?.success) {
      throw new Error(res.data?.msg || "接口返回失败");
    }

    const tasks = res.data.response?.Tasks || [];

    // 转换成前端模拟数据结构
    const mappedTasks = tasks.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      rate: item.Rate,
      type: mapType(item.Id), // 类型映射
      time: item.EvaluateTime ,
      doLaw: item.DoLaw,
      isVeto: item.IsVeto,
      allRate: item.AllRate,
	  Items: item.Items || []  
    }));

    const done = mappedTasks.filter((t) => t.doLaw);
    const pending = mappedTasks.filter((t) => !t.doLaw);

    dataList.value = [
      { title: "全部", tasks: mappedTasks },
      { title: "已评估", tasks: done },
      { title: "待评估", tasks: pending },
    ];

  } catch (err) {
    console.error("获取评估任务失败", err);
    uni.showToast({ title: "加载失败", icon: "none" });
  }
};

// 类型映射表
const mapType = (id: string) => {
  const typeMap: Record<string, string> = {
    "05": "pwxkgl",
    "02": "yhpc",
    "04": "ydyhwzpf",
    "07": "dxcgba",
    "06": "zxjc",
    "01": "ydyhwzpf",
	"03": "ffcchdwr",
	"08": "xcgl",
	"09": "qjscgl"
  };
  return typeMap[id] || "other";
};

// 点击滑块处理
const handleChangeData = (index: number) => {
  if (index === currentIndex.value) return;
  currentIndex.value = index;
};

// 下拉刷新
const handleRefresh = async () => {
  isRefreshing.value = true;
  await fetchTaskList();
  isRefreshing.value = false;
  uni.showToast({ title: "刷新成功", icon: "success" });
};

// 触底加载更多（示例）
const handleLoadMore = () => {
  uni.showToast({
    title: "加载更多",
    icon: "none",
  });
};

// 返回方法
const backFunction = () => {
  uni.switchTab({
    url: "/pages/task/index",
  });
  uni.showTabBar({ animation: false });
};

// ========== 问题清单生成：获取 Base64 PDF 并保存 ==========
function pureBase64(s: string): string {
  const v = String(s || '').trim()
  const i = v.indexOf('base64,')
  return i >= 0 ? v.slice(i + 'base64,'.length) : v
}

function ts() {
  const d = new Date()
  const p = (n:number)=> String(n).padStart(2,'0')
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

// 传入 base64（可带/不带 data: 前缀），写到 _doc/ 下并返回 file:// 路径
async function writePdfToDoc(base64: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof plus === 'undefined') return reject(new Error('仅支持 APP-PLUS 环境'))

      // 1) 规范化 base64 与目标路径
      const b64 = pureBase64(base64) // 你已有的函数：去掉 data:image/...;base64, 前缀
      const localPath = `_doc/${filename}`                      // UniApp 本地沙盒
      const absPath = plus.io.convertLocalFileSystemURL(localPath) // 绝对物理路径

      if (plus.os.name === 'Android') {
        // ===== ANDROID：用 Java 写字节数组 =====
        const Base64 = plus.android.importClass('android.util.Base64')
        const FileOutputStream = plus.android.importClass('java.io.FileOutputStream')
        const fos = new FileOutputStream(absPath)
        const bytes = Base64.decode(b64, Base64.DEFAULT)
        fos.write(bytes)
        fos.flush()
        fos.close()

        // 转回 file:// URL 以便 openFile
        plus.io.resolveLocalFileSystemURL(localPath, (entry) => {
          resolve(entry.toURL())
        }, reject)

      } else if (plus.os.name === 'iOS') {
        // ===== iOS：用 NSData 写文件 =====
        const NSData = plus.ios.importClass('NSData')
        const data = NSData.alloc().initWithBase64EncodedStringOptions(b64, 0)
        // 写入
        data.writeToFileAtomically(absPath, true)
        // 释放
        plus.ios.deleteObject(data)

        plus.io.resolveLocalFileSystemURL(localPath, (entry) => {
          resolve(entry.toURL())
        }, reject)

      } else {
        reject(new Error('暂不支持的系统：' + plus.os.name))
      }
    } catch (e) {
      reject(e)
    }
  })
}


async function copyToDownloads(srcPath: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (plus.os.name !== 'Android') {
      // iOS 没有公共 Download 目录，直接返回 _doc 路径
      return resolve(srcPath)
    }
    try {
      plus.io.resolveLocalFileSystemURL(srcPath, (entry) => {
        plus.io.resolveLocalFileSystemURL('file:///storage/emulated/0/Download/', (dstDir) => {
          (entry as any).copyTo(dstDir as any, filename, (newEntry:any) => {
            resolve(newEntry.toURL())
          }, reject)
        }, reject)
      }, reject)
    } catch (e) {
      reject(e)
    }
  })
}

async function handleGenerateIssuePDF() {
  try {
    if (!firmId) {
      uni.showToast({ title: '缺少企业ID', icon: 'none' })
      return
    }

    uni.showLoading({ title: '生成中...' })

    // 1) 拉取 Base64 PDF
    const res:any = await uni.request({
      url: 'api/UnitEvaluation/GetEvaluateSignFile',
      method: 'GET',
      data: { firmId },                                // GET 用查询参数
      header: { Authorization: `Bearer ${uni.getStorageSync('token')}` },
      timeout: 180000
    })

    // 基本校验
    const ok = res.statusCode === 200 && res.data && res.data.success
    if (!ok) {
      uni.hideLoading()
      const msg = res.data?.msg || '接口返回失败'
      uni.showToast({ title: msg, icon: 'none' })
      console.error('[GetEvaluateSignFile] error:', res)
      return
    }

    const base64pdf = String(res.data.response || '').trim()
    if (!base64pdf) {
      uni.hideLoading()
      uni.showToast({ title: '未获取到PDF数据', icon: 'none' })
      return
    }

    // 2) 写入 _doc 目录
    const name = `监管检查单_${firmId}_${ts()}.pdf`
    const docPath = await writePdfToDoc(base64pdf, name)

    // 3) 可选：复制到 Android 公共下载目录（便于用户在文件管理器里找到）
    let finalPath = docPath
    try {
      finalPath = await copyToDownloads(docPath, name)
    } catch (e) {
      // 复制失败不阻塞流程，继续使用 _doc 路径
      console.warn('[copyToDownloads] failed:', e)
    }

    uni.hideLoading()

    // 4) 打开预览（调用系统应用）
    try {
      if (typeof plus !== 'undefined' && plus.runtime) {
        plus.runtime.openFile(finalPath, {}, (e:any) => {
          console.warn('openFile fail:', e)
          uni.showToast({ title: '已保存：无法自动打开，可到下载目录查看', icon: 'none' })
        })
      } else {
        // H5 降级：用 dataURL 打开新页
        const dataUrl = 'data:application/pdf;base64,' + pureBase64(base64pdf)
        window.open(dataUrl, '_blank')
      }
    } catch (e) {
      console.warn('openFile exception:', e)
    }

    uni.showToast({ title: '已保存到本地', icon: 'success' })
    console.log('📄 PDF 已保存：', finalPath)
  } catch (e:any) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '生成失败', icon: 'none' })
    console.error('[问题清单生成] 异常：', e)
  }
}

//签字
const handleOpenSign = () => {
  const id = String(q.value?.EvaluationId || '')
  const code = String(q.value?.EvaluationCode || '')

  if (!id || !code) {
    uni.showToast({ title: '缺少评估单参数', icon: 'none' }); return
  }
  uni.navigateTo({
    url:
      `/pages/evaluate/law/sign`
      + `?Id=${encodeURIComponent(id)}`
      + `&EvaluationCode=${encodeURIComponent(code)}`
  })
}
</script>

<template>
  <view class="container">
    <view class="header">
      <HeaderSearch
        ref="headerSearchRef"
        :back="true"
        :back-function="backFunction"
        :disabled="true"
      ></HeaderSearch>
    </view>
    <view class="content">
      <view class="scroll-header">
        <view
          v-for="(item, index) in dataList"
          :class="{ cur: index === currentIndex }"
          :key="index"
          @click="handleChangeData(index)"
        >
          <view style="position: relative; display: flex">
            {{ item.title }}
            <u-badge
              :value="dataList[index].tasks.length"
              style="height: 20rpx; line-height: 20rpx"
            ></u-badge>
          </view>
        </view>
      </view>
      <scroll-view
        class="scroll-content"
        :scroll-y="true"
        @refresherrefresh="handleRefresh"
        :refresher-enabled="true"
        :refresher-threshold="50"
        :refresher-default-style="'black'"
        :refresher-triggered="isRefreshing"
      >
        <view class="law-condition-img">
          <image class="law-img" src="/static/evaluate/law.svg"></image>
          企业执法情况
        </view>
        <view
          class="scroll-item"
          v-for="item in dataList[currentIndex].tasks"
          :key="item.id"
        >
          <TaskCard :data="item" :firm-id="firmId" :keyunit-type="keyunitType"></TaskCard>
        </view>	
		<view class="footer-spacer"></view>
      </scroll-view>
    </view>
  </view>
  
  <view class="issue-footer safe-area-inset-bottom">
	<button class="issue-btn ghost" type="default" @click="handleOpenSign">
	    现场签字
	  </button>
    <button class="issue-btn" type="primary" @click="handleGenerateIssuePDF">
      问题清单生成（预览/保存PDF）
    </button>
  </view>
  
</template>

<style scoped lang="scss">
.container {
  width: 100vw;
  height: 100vh;
  background-color: #f5f7f8;
  --card-gap: 10px; /* ← 卡片间距：调大=一次滑更多 */
    --footer-space: calc(88rpx + 32px + env(safe-area-inset-bottom)); 

  .header {
    padding-top: 4.5vh;
    width: 100vw;
    height: 5vh;
    background-color: white;
  }

  .content {
      width: 100%;
      height: calc(100vh - 5vh - 88rpx); /* 扣掉 header 高度和 footer 按钮高度 */
      overflow-y: auto;
    
      

    .scroll-header {
      height: 5vh;
      margin-top: 1vh;
      background-color: #ffffff;
      display: flex;
      justify-content: space-around;
      align-items: center;
      position: relative;
      white-space: nowrap;
      font-size: 32rpx;
      margin-bottom: 1vh;
    }

    .cur {
      color: #00aaff;
      border-bottom: 5rpx solid #3c9cff;
    }

    .scroll-content {
      height: 83vh;
      overflow-y: auto;

      /* ✅ 预留底部空间，避免被固定按钮挡住 */
      padding-bottom: var(--footer-space);

      /* ✅ 开启按卡片对齐的滚动；想更“卡顿对齐”可改为 mandatory */
      scroll-snap-type: y proximity;
      -webkit-overflow-scrolling: touch;

      .law-condition-img {
        margin-top: 10rpx;
        background-image: url("../../static/evaluate/task-bg.svg");
        display: flex;
        align-items: center;
        font-size: 28rpx;
        color: #333333;

        .law-img {
          position: relative;
          width: 42rpx;
          height: 50rpx;
          margin: 0 20rpx;
        }
      }

      .scroll-item {
        /* ✅ 每张卡都是一个“对齐点”，间距受 --card-gap 控制 */
        scroll-snap-align: start;
        margin-bottom: var(--card-gap);
      }

      /* 底部占位块：与固定按钮同高 */
      .footer-spacer {
        height: var(--footer-space);
      }
    }
  }
}

/* 固定底部按钮保持不变 */
.issue-footer {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4px 12px rgba(0,0,0,.06);
  z-index: 9;
}
.issue-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 12rpx;
  font-weight: 600;
}
</style>
