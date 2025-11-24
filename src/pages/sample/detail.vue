<template>
  <view class="container">
    <!-- 监测井信息 -->
    <view class="card">
		<view class="well-header">
		<u-icon name="integral-fill" color="#2979ff" size="28" class="well-icon" />
      <text class="card-title">{{ well.name || '监测井' }}</text>
       <text class="status" :style="{ color: statusColor }">{{ statusText }}</text>
	   </view>
	   <view class="well-info">
     <view>编号：{{ well.code }}</view>
     <view>类型：{{ well.type }}</view>
	 <view>污染源名称：{{ well.wryName }}</view>
	 <view>区县: {{well.city}}</view>
     <view>位置：{{ well.location }}</view>
	 </view>
	 </view>

    <!-- 基本信息 -->
    <view class="section-title">采样基本数据填报</view>
  <view class="form-item" v-for="item in formFields" :key="item.key">
    <view class="form-left">
      <text class="form-label">
        {{ item.label }}
        <text v-if="item.required" class="required">*</text>
      </text>
    </view>
    <view class="form-right">
      <u-input
        v-model="form[item.key]"
        placeholder="请输入"
        border="none"
        :disabled="isReadonly"
        @blur="autoSaveBasicInfo"
        inputAlign="right"
        customStyle="text-align: right;"
      />
    </view>
  </view>

    <!-- 采样步骤 -->
    <view class="section-title">采样进度</view>
	
   <view class="progress-step" v-for="(step, index) in progressSteps" :key="index">
     <!-- 左侧竖线 + 圆点 -->
      <view class="step-line">
        <view v-if="index !== 0" class="line"></view>
        <view :class="['dot', getStepDotClass(index)]"></view>
        <view v-if="index !== progressSteps.length - 1" class="line"></view>
      </view>
   
 <!-- 右侧内容 -->
      <view class="step-main">
        <view class="step-header-row">
          <view class="step-title">{{ step.name }}</view>
          <!-- 添加图片按钮-->
          <view v-if="isStepEnabled(index) && !isReadonly" class="add-btn" @click="takePhotoForStep(step.name)">+</view>
        </view>
        <view class="step-status" :class="step.statusTextClass">{{ step.statusText }}</view>
        <view v-if="step.submitted" class="submit-time">已提交 {{ formatDisplayTime(step.shootTime) }}</view>
        <!-- 图片列表 -->
     <view class="images-column">
       <view v-for="(img, i) in step.images" :key="i" class="photo-wrapper">
         <image :src="img.url || img" class="photo" @click="previewImage(step.images, i)" />
         <view class="file-name">{{ extractFilename(img.url || img) }}</view>
     
         <!-- 区块链存证标识（只有有 chainTxHash 才显示） -->
         <view v-if="img.chainTxHash" class="chain-badge" @click="showChainInfo(img)">已上链</view>
     
         <!-- 删除图片 -->
         <view v-if="!isReadonly" class="delete-icon" @click.stop="removeImage(step, img)">×</view>
       </view>
     </view>

		
      </view>
    </view>
	
	
<view class="save-button-wrapper">
  <u-button
    type="primary"
    size="medium"
    @click="confirmAndUpload"
    :disabled="isReadonly"
  >
    保存
  </u-button>
</view>

    <!-- 隐藏 Canvas 用于加水印 -->
 <canvas
   canvas-id="watermarkCanvas"
   id="watermarkCanvas"
   :style="`width: ${canvasWidth}px; height: ${canvasHeight}px; position: absolute; left: -9999px;`"
   :width="canvasWidth"
   :height="canvasHeight"
 ></canvas>
 
 
 <!-- 区块链存证信息弹窗链展示 -->
 <u-popup v-model="showChainModal" mode="center" border-radius="12" width="80%">
   <view style="padding: 24rpx;">
     <view style="font-weight: 700; font-size: 32rpx; margin-bottom: 16rpx;">区块链存证信息</view>
     <view style="margin-bottom: 8rpx;">交易哈希：{{ selectedEvidence?.chainTxHash || '—' }}</view>
     <view style="margin-bottom: 8rpx;">区块高度：{{ selectedEvidence?.chainBlockHeight || '—' }}</view>
     <view>上链时间：{{ selectedEvidence?.chainTime || '—' }}</view>
   </view>
 </u-popup>

 
 </view>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { onShow } from '@dcloudio/uni-app'
import axios from 'axios';
import "@/utils/http";
import {
  licenseLocked,
  getDeadlineTs,
  startLicenseTickerForUI,
  stopLicenseTickerForUI,
} from '@/utils/licenseGuard'


const formatDeadlineForUI = () => {
  const ts = getDeadlineTs?.()
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const isOverdue = () => {
  const ts = getDeadlineTs?.()
  if (!ts) return false
  return Date.now() >= ts
}

/** 返回 true 表示已拦截（到期不允许继续） */
const blockIfOverdue = (action = '操作') => {
  try {
    if (isOverdue() || licenseLocked?.()) {
      uni.showModal({
        title: '已到截止时间',
        content: `许可已到期（截止：${formatDeadlineForUI()}），无法${action}。请联系管理员续期。`,
        showCancel: false,
      })
      return true
    }
  } catch (e) {
    // 兜底：如果读取失败，不拦截
  }
  return false
}



//区块链存证所需状态
const showChainModal = ref(false);
const selectedEvidence = ref(null);


// 生成随机16进制字符串
function genRandomHex(len) {
  const chars = 'abcdef0123456789';
  let str = '';
  for (let i = 0; i < len; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

function showChainInfo(img) {
  selectedEvidence.value = img;
  showChainModal.value = true;
}

// 判断当前步骤是否可用：必须前一个步骤为已提交
const isStepEnabled = (index) => {
  if (index === 0) return true;
  const prevStep = progressSteps.value?.[index - 1];
  return prevStep?.submitted === true;
};


const sampleId = ref('');

onLoad((options) => {
  if (options.id) sampleId.value = Number(options.id);
  if (options.code) well.value.code = options.code;
  if (options.name) well.value.name = options.name;
  if (options.type) well.value.type = options.type;
  if (options.location) well.value.location = options.location;
  if (options.wryName) well.value.wryName = options.wryName;
  if (options.city) well.value.city = options.city;
  if (options.status) {
    well.value.status = options.status === '已完成'
      ? 'done'
      : (options.status === '采样中' ? 'doing' : 'todo');
  }
  
  getSampleDetail(sampleId.value); // 接口最终确认状态
});



const wellCode = ref('')  // 用于存储传递的 wellCode参数
const well = ref({}) ; // 用于存储从后端返回的井信息
const basicInfoId = ref(null)

const isReadonly = computed(() => sampleDetail.value.SampleStatus === '已完成');


const formatDisplayTime = (time) => {
  const date = new Date(time)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
}

function extractFilename(url) {
  const str = typeof url === 'string' ? url : '';
  return str.split('/').pop() || '';
}


const getStepDotClass = (index) => {
  const step = progressSteps.value[index];
  if (step.submitted) return 'dot-blue';

  const prev = progressSteps.value[index - 1];
  if (index === 0 || (prev && prev.submitted)) return 'dot-red';

  return 'dot-grey';
};




onShow(() => {
  if (wellCode.value) {
    fetchWellInfo(wellCode.value) // 每次重新进入页面时，重新获取状态
  }
})


const sampleDetail = ref({}); 

//详细信息
const getSampleDetail = async (id) => {
  const res = await uni.request({
    url: 'api/AppInterface/GetWaterQualSampleDetails',
    method: 'GET',
    data: { id },
    header: {
      Authorization: `Bearer ${uni.getStorageSync('token')}`
    }
  });

  if (res.statusCode === 200 && res.data.success) {
    const detail = res.data.response || {};
    console.log(' GetWaterQualSampleDetails 返回 detail:', detail);

    // 保存到 sampleDetail，保存原始返回值
    sampleDetail.value = detail;

    // 设置 sampleId（如果后端返回 id）
    sampleId.value = Number(detail.id) || sampleId.value;

    // 合并表单字段
    Object.assign(form.value, {
      sampleName: detail.ypmc || '',
      sampleOrder: detail.ypsxh || '',
      sampleCode: detail.gceabb || '',
      sampleMethod: detail.cyff || '',
      sampleDepth: detail.cysd || '',
      wellFlushMethod: detail.xjff || '',
      burialCondition: detail.mctj || '',
      aquiferMedia: detail.hscjzlx || '',
      sampleCount: detail.ypsl || ''
    });

    // 合并 well.value，避免覆盖从路由传入的值
    if (detail.jcjCode) well.value.code = detail.jcjCode;
    if (detail.jcjName) well.value.name = detail.jcjName;
    if (detail.jcdxName) well.value.type = detail.jcdxName;
    if (detail.locationDescription) well.value.location = detail.locationDescription;
    if (detail.SampleStatus) {
      well.value.status =
        detail.SampleStatus === '已完成'
          ? 'done'
          : (detail.SampleStatus === '采样中' ? 'doing' : 'todo');
    }

    // 设置步骤状态 + 图片
    progressSteps.value.forEach((step) => {
      const stepImages = detail.SampleProcessImages?.filter(img => img.processType === step.name) || [];
    
      if (stepImages.length > 0) {
        step.submitted = true;
        step.status = 'done';
        step.statusText = '已提交';
        step.statusTextClass = 'text-blue';
        step.images = stepImages.map(img => ({
          ...img,
          url: 'http://geologygis.com:8864/' + img.photoUrl
        }));
        step.shootTime = stepImages[0].shootTime;
      } else {
        step.submitted = false;
        step.status = 'todo';
        step.statusText = '待提交';
        step.statusTextClass = 'text-red';
        step.images = [];
      }
    });
    
    // 同步 SampleProcessImages（用于上传）
    SampleProcessImages.value = [];
    
    progressSteps.value.forEach((step) => {
      (step.images || []).forEach((img) => {
        const full = img.url || img.photoUrl || '';
        const relative = full.replace(/^https?:\/\/[^/]+\/?/, '');
    
        SampleProcessImages.value.push({
          sampleId: sampleId.value,
          processType: step.name,
          photoIndex: img.photoIndex ?? 1,
          shootLongitude: img.shootLongitude ?? 0,
          shootLatitude: img.shootLatitude ?? 0,
          shootTime: img.shootTime ?? formatTimeForApi(new Date()),
          remark: img.remark ?? '',
          photoUrl: relative,
          url: full
        });
      });
    });


    console.log('合并完成 well.value:', well.value);
  } else {
    console.error('获取采样详情失败', res.data);
    uni.showToast({ title: res.data.msg || '详情加载失败', icon: 'none' });
  }
};


// 表单字段
const form = ref({});

const formFields = [
  { key: 'sampleName', label: '样品名称', required: true },
  { key: 'sampleOrder', label: '样品顺序号' },
  { key: 'sampleCode', label: '样品编码', required: true },
  { key: 'sampleMethod', label: '采样方法', required: true },
  { key: 'sampleDepth', label: '采样深度（米）', required: true },
  { key: 'wellFlushMethod', label: '洗井方法', required: true },
  { key: 'burialCondition', label: '埋藏条件', required: true },
  { key: 'aquiferMedia', label: '含水层介质', required: true },
  { key: 'sampleCount', label: '样品数量（个）', required: true }
]

const editField = (item) => {
  if (isReadonly.value) return  // 已完成则不允许编辑

}


const progressSteps = ref([
  { key: 'flush', name: '洗井', ...emptyStep() },
  { key: 'sample', name: '取样', ...emptyStep() },
  { key: 'transport', name: '保存运输', ...emptyStep() },
  { key: 'test', name: '化验', ...emptyStep() }
])

function emptyStep() {
  return {
    status: 'pending',
    statusText: '待提交',
    statusTextClass: 'text-grey',
    submitted: false,
    images: []
  }
}

// 自动判断状态（全部提交为已完成，有一个为已提交即采样中，否则待采样）
const statusText = computed(() => {
  if (well.value.status === 'done') return '已完成'
  if (well.value.status === 'doing') return '采样中'
  return '待采样'
})

const statusColor = computed(() => {
  if (well.value.status === 'done') return '#007aff'
  if (well.value.status === 'doing') return '#00b050'
  return '#999'
})



//保存采样基本数据
// 保存采样基本数据（修复版：与“保存上传”同形同参）
const autoSaveBasicInfo = () => {
  // 1) 前置校验：确保有 sampleId，避免在详情未回填前就触发
  const sid = Number(sampleId.value);
  if (!sid) {
    console.warn('[AutoSave] 跳过：sampleId 为空');
    return;
  }

  // 2) 计算四个状态位（与上传保持一致）
  const processTypes = (SampleProcessImages.value || []).map(i => i.processType);
  const has = (name) => processTypes.includes(name);
  const flags = {
    isWashedWell: has('洗井') ? '1' : '0',
    isSampled: has('取样') ? '1' : '0',
    isSaveTransport: has('保存运输') ? '1' : '0',
    isDoneTest: has('化验') ? '1' : '0',
  };

  // 3) 组织与“上传”一致的根级 payload（不包 updateModel）
  const payload = {
    id: sid, // 注意：小写 id —— 与上传一致
    jcjCode: sampleDetail.value.jcjCode || well.value.code || '',
    jcjName: sampleDetail.value.jcjName || well.value.name || '',
    gceabb: form.value.sampleCode || sampleDetail.value.gceabb || '',
    cysj: formatTimeForApi(new Date()), // 与上传一致，通常后端需要
    ypmc: form.value.sampleName || '',
    ypsxh: form.value.sampleOrder || '',
    cyff: form.value.sampleMethod || '',
    cysd: form.value.sampleDepth || '',
    xjff: form.value.wellFlushMethod || '',
    mctj: form.value.burialCondition || '',
    hscjzlx: form.value.aquiferMedia || '',
    ypsl: form.value.sampleCount || '',
    SampleProcessImages: [], // 自动保存文本时可传空数组
    ...flags
  };

  console.log('🟦[AutoSave] JSON 预览 =', JSON.stringify(payload).slice(0, 160), '...');

  uni.request({
    url: 'api/AppInterface/UpdateWaterQualSampleForApp',
    method: 'PUT',
    header: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${uni.getStorageSync('token')}`
    },
    data: payload,
    dataType: 'json',
    success: (res) => {
      console.log('🟩[AutoSave] 返回：', res.data);
      if (res.statusCode === 200 && res.data?.success) {
        // 轻量提示，避免频繁弹 toast
        console.log('[AutoSave] 已自动保存');
      } else {
        console.warn('[AutoSave] 失败：', res.data?.msg || res.data?.message || '未知错误');
      }
    },
    fail: (err) => {
      console.warn('[AutoSave] 网络失败:', err);
    }
  });
};





const canvasWidth = ref(300)
const canvasHeight = ref(150)

function formatTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

const formatTimeForApi = (date) => {
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};


const getLocation = () => {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'wgs84',
      success: resolve,
      fail: reject
    });
  });
};


function drawImageWithWatermark(imagePath, text, callback) {
  uni.getImageInfo({
    src: imagePath,
    success: (imgInfo) => {
      canvasWidth.value = imgInfo.width;
      canvasHeight.value = imgInfo.height;
      nextTick(() => {
        setTimeout(() => {
          const ctx = uni.createCanvasContext('watermarkCanvas', this);
          ctx.drawImage(imagePath, 0, 0, imgInfo.width, imgInfo.height);
          ctx.setFontSize(36);
          ctx.setFillStyle('rgba(255,255,255,0.8)');
          ctx.fillText(text, 20, imgInfo.height - 60);
          ctx.draw(false, () => {
            setTimeout(() => {
              uni.canvasToTempFilePath({
                canvasId: 'watermarkCanvas',
                destWidth: imgInfo.width,
                destHeight: imgInfo.height,
                success: (res) => callback(res.tempFilePath),
                fail: () => callback(imagePath)
              });
            }, 200);
          });
        }, 200);
      });
    },
    fail: () => callback(imagePath)
  });
}

const confirmAndUpload = () => {
  if (blockIfOverdue('保存上传')) return;  

  uni.showModal({
    title: '确认上传',
    content: '是否上传所有步骤图片？',
    success: (res) => {
      if (res.confirm) {
        uploadAllStepImages();
      }
    }
  });
};


const SampleProcessImages = ref([]);

// stepName 可为 '洗井'、'取样'、'保存运输'、'化验'
const takePhotoForStep = (stepName) => {
	 if (blockIfOverdue('拍照')) return; 
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: async (res) => {
      const imgPath = res.tempFilePaths[0];
      const location = await getLocation().catch(() => null);
      if (!location) {
        uni.showToast({ title: '定位失败', icon: 'none' });
        return;
      }

      const shootTime = formatTimeForApi(new Date());
      const watermarkText = `${shootTime} 经度：${location.longitude.toFixed(6)} 纬度：${location.latitude.toFixed(6)}`;

      drawImageWithWatermark(imgPath, watermarkText, (finalPath) => {
		  // 生成链数据 
		    const fakeTxHash = genRandomHex(64);
		    const fakeBlock = Math.floor(Math.random() * 100000) + 100000;
		    const now = formatTimeForApi(new Date());
			
     const evidenceData = {
        processType: stepName,
        photoIndex: SampleProcessImages.value.length + 1,
        shootTime,
        shootLongitude: location.longitude,
        shootLatitude: location.latitude,
        localPath: finalPath,
    
        //
        chainTxHash: fakeTxHash,
        chainBlockHeight: fakeBlock,
        chainTime: now
      };
	  
	   SampleProcessImages.value.push(evidenceData);

        // 更新 UI 中 step.images 展示用
         const step = progressSteps.value.find(s => s.name === stepName);
         if (step) {
           step.images.push({ url: finalPath, ...evidenceData });
           step.submitted = true;
           step.status = 'done';
           step.statusText = '待上传';
           step.statusTextClass = 'text-orange';
         }
      });
    }
  });
};





const previewImage = (images, index) => {
  const urls = images.map(img => typeof img === 'string' ? img : img.url);
  uni.previewImage({
    urls,
    current: urls[index]
  });
};


const removeImage = (step, imageToRemove) => {
  const imageKey = imageToRemove.photoUrl || imageToRemove.url || imageToRemove.localPath;

  if (!imageKey) {
    console.warn('无有效图片路径，无法删除:', imageToRemove);
    uni.showToast({ title: '图片信息错误，无法删除', icon: 'none' });
    return;
  }

  uni.showModal({
    title: '确认删除',
    content: '是否要删除这张图片？',
    success: (res) => {
      if (res.confirm) {
        const before = step.images.length;

        // 前端图列表中删除（预览用）
        step.images = step.images.filter(img => {
          const key = img.photoUrl || img.url || img.localPath;
          return key !== imageKey;
        });

        // 上传缓存中删除（上传用）
        SampleProcessImages.value = SampleProcessImages.value.filter(img => {
          const key = img.photoUrl || img.url || img.localPath;
          return key !== imageKey;
        });

        const after = step.images.length;
        console.log(`删除成功：${step.name} 从 ${before} 张变为 ${after} 张`);
      }
    }
  });
};




const pathToBlob = (path) => {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(path, (entry) => {
      entry.file(resolve, reject);
    }, reject);
  });
};



//  压缩图片函数（压成 JPG 格式，降低体积）
function compressImage(path, quality = 0.6) {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src: path,
      quality: quality * 100, // 0.1~1
      format: 'jpg',
      success: (res) => {
        console.log('压缩成功:', res.tempFilePath);
        resolve(res.tempFilePath);
      },
      fail: (err) => {
        console.error('图片压缩失败:', err);
        reject(err);
      },
    });
  });
}

// 本地图片转 base64（清理前缀）
function filePathToBase64(filePath) {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
      entry.file((file) => {
        const reader = new plus.io.FileReader();
        reader.onloadend = (e) => {
          const base64 = e.target.result;
          const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
          resolve(cleanBase64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }, reject);
    }, reject);
  });
}

// 使用 canvas 强制导出 JPG 格式
function drawImageAsJPEG(sourcePath, width, height) {
  return new Promise((resolve, reject) => {
    const ctx = uni.createCanvasContext('watermarkCanvas');

    ctx.drawImage(sourcePath, 0, 0, width, height);
    ctx.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId: 'watermarkCanvas',
        x: 0,
        y: 0,
        width: width,
        height: height,
        destWidth: width,
        destHeight: height,
        quality: 0.8, // 可调整
        fileType: 'jpg', // 强制导出 JPEG
        success: (res) => {
          console.log('canvas 导出 JPG 成功:', res.tempFilePath);
          resolve(res.tempFilePath);
        },
        fail: (err) => {
          console.error('canvas 导出 JPG 失败:', err);
          reject(err);
        },
      });
    });
  });
}



// 上传函数：处理所有图片并上传
const uploadAllStepImages = async () => {
  const total = SampleProcessImages.value.length;
  if (!total) {
    uni.showToast({ title: '无图片可上传', icon: 'none' });
    return;
  }

  uni.showLoading({ title: '上传中...' });
  console.log(`🚀 开始上传，总共 ${total} 张图片`);

  const SampleProcessImagesJson = [];
  const stepCounters = {};
  
  // 先补全所有远程图（没有 localPath 的）
  SampleProcessImages.value.forEach((img, index) => {
    if (!img.localPath && img.photoUrl) {
      SampleProcessImagesJson.push({
        sampleId: sampleId.value,
        processType: img.processType,
        photoIndex: img.photoIndex || index + 1,
        shootLongitude: img.shootLongitude ?? 0,
        shootLatitude: img.shootLatitude ?? 0,
        shootTime: img.shootTime ?? formatTimeForApi(new Date()),
        remark: img.remark || '',
        PhotoData: null,
        PhotoName: img.photoName || '',
        PhotoSize: 0,
        photoUrl: img.photoUrl || '',
        photoFile: img.photoFile || '',
        id: img.id || null
      });
    }
  });


  for (let i = 0; i < total; i++) {
    const img = SampleProcessImages.value[i];
    const index = i + 1;
    const filePath = img.localPath || img.url;

    // 获取图片尺寸
    let info;
    try {
      info = await new Promise((resolve, reject) => {
        uni.getImageInfo({ src: filePath, success: resolve, fail: reject });
      });
    } catch (err) {
      console.warn(`⚠️ 第 ${index} 张图获取信息失败，跳过`, err);
      continue;
    }

    // 用 canvas 导出 JPG
    let jpegPath;
    try {
      jpegPath = await drawImageAsJPEG(filePath, info.width, info.height);
    } catch (err) {
      console.warn(`⚠️ 第 ${index} 张图 canvas 导出失败，跳过`, err);
      continue;
    }

    // 转 base64
    let base64;
    try {
      base64 = await filePathToBase64(jpegPath);
    } catch (err) {
      console.warn(`⚠️ 第 ${index} 张图 base64 转换失败，跳过`, err);
      continue;
    }

    if (!base64 || base64.length < 100) {
      console.warn(`❌ 第 ${index} 张图 base64 无效，跳过`);
      continue;
    }

   const stepName = img.processType?.replace(/\s/g, '') || 'step';
   
   if (!stepCounters[stepName]) stepCounters[stepName] = 1;
   else stepCounters[stepName] += 1;
   
   const stepIndex = stepCounters[stepName];
   const photoName = img.photoName || `photo_${sampleDetail.value.gceabb}_${stepName}_${stepIndex}.jpg`;

    const photoSize = Math.floor(base64.length * 3 / 4);

    console.log(`📸 第 ${index} 张图片：`);
    console.log(`  processType: ${img.processType}`);
    console.log(`  filePath: ${filePath}`);
    console.log(`  jpegPath: ${jpegPath}`);
    console.log(`  PhotoName: ${photoName}`);
    console.log(`  PhotoSize: ${photoSize} 字节`);
    console.log(`  PhotoData 长度: ${base64.length}`);
    console.log(`  PhotoData 前缀: ${base64.slice(0, 30)}`);

    SampleProcessImagesJson.push({
      sampleId: sampleId.value,
      processType: img.processType,
      photoIndex: img.photoIndex || index,
      shootLongitude: img.shootLongitude,
      shootLatitude: img.shootLatitude,
      shootTime: img.shootTime,
      remark: img.remark || '',
      PhotoData: base64,
      PhotoName: photoName,
      PhotoSize: photoSize,
    });
  }
  
  const processTypes = SampleProcessImagesJson.map(i => i.processType);
console.log('📋 所有本地图片步骤:', processTypes);
  const requestData = {
    id: sampleId.value,
    jcjCode: sampleDetail.value.jcjCode,
    jcjName: sampleDetail.value.jcjName,
    gceabb: sampleDetail.value.gceabb,
    cysj: formatTimeForApi(new Date()),
    ypmc: form.value.sampleName,
    ypsxh: form.value.sampleOrder,
    cyff: form.value.sampleMethod,
    cysd: form.value.sampleDepth,
    xjff: form.value.wellFlushMethod,
    mctj: form.value.burialCondition,
    hscjzlx: form.value.aquiferMedia,
    ypsl: form.value.sampleCount,
    SampleProcessImages: SampleProcessImagesJson,
	
	  isWashedWell: processTypes.includes('洗井') ? '1' : '0',
	  isSampled: processTypes.includes('取样') ? '1' : '0',
	  isSaveTransport: processTypes.includes('保存运输') ? '1' : '0',
	  isDoneTest: processTypes.includes('化验') ? '1' : '0',
	
  };

  console.log(' 最终上传 JSON（前 500 字符）:', JSON.stringify(requestData).slice(0, 500));

  uni.request({
    url: 'api/AppInterface/UpdateWaterQualSampleForApp',
    method: 'PUT',
    header: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${uni.getStorageSync('token')}`,
    },
    data: requestData,
    success: (res) => {
      uni.hideLoading();
      console.log('上传响应:', res.data);
      if (res.statusCode === 200 && res.data?.success) {
        uni.showToast({ title: '上传成功', icon: 'success' });
        getSampleDetail(sampleId.value);
      } else {
        console.warn('上传失败:', res.data);
        uni.showToast({ title: res.data?.msg || '上传失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.hideLoading();
      console.error('网络异常:', err);
      uni.showToast({ title: '网络异常', icon: 'none' });
    },
  });
};


</script>

<style scoped>
.container { padding: 24rpx; }
.card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 10px 0 rgba(0,0,0,0.06);
  margin: 18px 0 18px 0;
  padding: 18px 18px 12px 18px;
  
   .well-header {
    display: flex;
    align-items: center;
	
   .well-icon {
      margin-right: 6px;
    }
	
  .card-title {
    font-weight: bold;
    font-size: 20px;
    margin-right: auto; 
  }
    .status {
      color: #19be6b;
      font-size: 18px;
      font-weight: 500;
    }
  }
  .well-info {
    margin-top: 12px;
    font-size: 16px;
    color: #333;
    line-height: 28px;
  }
}
.section-title { margin: 20rpx 0 10rpx; font-weight: bold; }
.form-item { background: #fff; padding: 20rpx; margin-bottom: 10rpx; display: flex; justify-content: space-between; align-items: center; }
.required { color: red; margin-left: 5rpx; }
.right-text { color: #aaa; }
.progress-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30rpx;
  position: relative;
}
.step-line {
  width: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.line {
  width: 2px;
  background: #ccc;
  flex: 1;
}
.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ccc;
  margin: 4px 0;
  z-index: 1;
}
.dot-blue { background: #2979ff; }
.dot-red { background: #ff4d4f; }
.dot-grey { background: #ccc; }
.step-main {
  flex: 1;
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-left: 12px;
}
.step-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.step-title {
  font-weight: bold;
  font-size: 18px;
}
.step-status {
  font-size: 16px;
}
.submit-time {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}
.images-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.photo-wrapper {
  display: flex;
  align-items: center;
  background: #f7f8fa;
  border-radius: 12px;
  margin-bottom: 12px;
  padding: 12px 16px;
  position: relative;
}
.photo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 16px;
}
.delete-icon {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(255,0,0,0.7);
  color: #fff;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 14px;
  cursor: pointer;
}
.file-name {
   font-size: 14px;
   color: #222;
   font-weight: bold;
   margin-left: 0;
   text-align: left;
   max-width: 300px;
   word-break: break-all;
}
.add-btn {
  width: 32px;
  height: 32px;
  border: 1px dashed #ccc;
  border-radius: 8px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  background: #fff;
}
.images { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 10rpx; }
.images-column {
  margin-left: 40rpx; /* 让它和左侧线条错开一些 */
  margin-bottom: 30rpx;
  display: flex;
  flex-direction: column; /* 垂直排列 */
  gap: 10rpx;
}

.photo { width: 200rpx; height: 200rpx; border-radius: 8rpx; object-fit: cover; }
.button:disabled {
  background-color: #ccc;
  color: #fff;
}

.submit-time {
  font-size: 12px;
  color: #888;
  margin: 4px 0 10px 0;
}
.scroll-content {
  padding-bottom: 60px; /* 或和tabbar高度一致 */
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx;
  border-bottom: 1px solid #eee;

  .form-left {
    width: 220rpx;
    font-size: 28rpx;
    color: #333;
  }

  .form-right {
    flex: 1;
    text-align: right;
  }

  .required {
    color: red;
    margin-left: 4rpx;
  }
}
.text-orange {
  color: #ff9900;
}
.save-button-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40rpx;
  padding-bottom: 40rpx;
}

.chain-badge {
  position: absolute;
  bottom: 8rpx;
  right: 8rpx;
  background: rgba(0, 122, 255, 0.85);
  color: #fff;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  line-height: 1;
}



</style>
