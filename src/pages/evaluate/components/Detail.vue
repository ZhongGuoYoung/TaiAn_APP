<script setup lang="ts">
import { onLoad  } from "@dcloudio/uni-app";
import { ref } from "vue";
import type { Evaluate, HoleEvaluate } from "@/types/evaluateItem";
import { convertItemsToHoleEvaluate } from "@/utils/convert";
import "@/utils/http";

let id: string;
let firmId: string;
const unitType = ref<'01'|'02'|'03'>('01');

const data = ref<HoleEvaluate>({
  title: "",
  desc: "",
  allRate: 0,
  element: [],
});

const disabled = ref(false);

// 获取文件大小
const getFileSize = (path: string) => new Promise<number>((resolve, reject) => {
  plus.io.resolveLocalFileSystemURL(path, (entry) => {
    entry.getMetadata((meta) => resolve(meta.size), reject);
  }, reject);
});
// 二次压缩：默认转成 JPG、最长边 1280、质量 60（可按需调小到 50/40）
const compressLocalImage = (path: string, maxW = 1280, quality = 60) => new Promise<{ path: string; sizeKB: number }>((resolve, reject) => {
  // 获取压缩前文件大小
  getFileSize(path).then((beforeSize) => {
    console.log("[压缩前文件大小] =", beforeSize / 1024, "KB");

    // #ifdef APP-PLUS
    const dst = `_doc/uniapp_temp_${Date.now()}.jpg`;
    plus.zip.compressImage(
      { src: path, dst, quality, width: `${maxW}px`, format: 'jpg', overwrite: true },
      (res) => {
        // 获取压缩后文件大小
        getFileSize(res.target).then((afterSize) => {
          console.log("[压缩后文件大小] =", afterSize / 1024, "KB");
          resolve({ path: res.target, sizeKB: Math.round(afterSize / 1024) });
        }).catch(reject);
      },
      (err) => reject(err)
    );
    // #endif

    // #ifdef MP-WEIXIN
    uni.compressImage({
      src: path,
      quality,
      success: (r) => {
        getFileSize(r.tempFilePath).then((afterSize) => {
          console.log("[压缩后文件大小] =", afterSize / 1024, "KB");
          resolve({ path: r.tempFilePath, sizeKB: Math.round(afterSize / 1024) });
        }).catch(reject);
      },
      fail: reject
    });
    // #endif
  }).catch(reject);
});

// 压缩后再转 Base64（去掉 data: 头）
const toCompressedBase64 = async (path: string) => {
  console.log('[压缩前] path =', path);
  const { path: cpath, sizeKB } = await compressLocalImage(path, 1280, 60);
  console.log('[压缩后] path =', cpath, '约', sizeKB, 'KB');

  const base64Raw: string = await pathToBase64(cpath);      // 复用你原来的函数
  const cleanBase64 = base64Raw.replace(/^data:image\/\w+;base64,/, '');
  console.log('[Base64长度] =', cleanBase64.length);
  return cleanBase64;
};


onLoad(async (options) => {
  console.log("onLoad 接收到参数:", options);

  id = String(options.id || "");
  firmId = String(options.firmId || "");
  await fetchFirmNameById(firmId);
  disabled.value = options.disabled === "true";

 const raw = String(options.keyunitType ?? options.unitType ?? "01");
  const norm = raw.padStart(2, "0");
  unitType.value = (["01","02","03"].includes(norm) ? norm : "01") as typeof unitType.value;
	
  try {
      //用 unitType.value
      const reqData = { firmId, unitType: unitType.value };
      console.log("将要请求 EvaluateTasks:", reqData);
  
      const res = await uni.request({
        url: "api/UnitEvaluation/EvaluateTasks",
        method: "GET",
        data: reqData,
        header: { Authorization: "Bearer " + uni.getStorageSync("token") },
      });

    const taskList = res.data.response?.Tasks || [];
    const task = taskList.find((t:any) => String(t.Id) === String(id));

    if (!task) {
      throw new Error("未找到匹配的任务");
    }

    const rawItems = task.Items || [];

    // 处理评估项数据
    const holeData = convertItemsToHoleEvaluate(rawItems);

    if (!holeData.desc) {
      holeData.desc = "";
    }
	
	// 拼接完整图片 URL
	const getFullPhotoUrl = (url) => {
	  if (!url) return '';
	  if (url.startsWith('http')) return url;
	  return `http://geologygis.com:8864/${url}`;
	};

    // 建多图回填映射
 const photoMap = {};
 rawItems.forEach(item => {
   if (item.EvaluationType === 'photo' && item.PhotoUrl) {
     const code = item.EvaluationCode;
     if (!photoMap[code]) photoMap[code] = [];
     // 拼接完整 URL
     photoMap[code].push({ url: getFullPhotoUrl(item.PhotoUrl) });
   }
 });

    // 将 photoMap 中的图片填充进 holeData
    holeData.element.forEach(group => {
		console.log("各题照片数量：", holeData.element.flatMap(g => g.element).filter(i => i.type === 'photo').map(i => ({ id: i.id, count: i.photos?.length })));

      group.element.forEach(subItem => {
        if (subItem.type === 'photo' && photoMap[subItem.id]) {
          subItem.photos = photoMap[subItem.id];
        }
      });
    });

    data.value = holeData;
    console.log("最终回填后的 data.value:", data.value);
  } catch (e) {
    console.error("任务详情加载失败:", e);
    data.value = {
      title: "暂无数据",
      desc: "",
      element: [],
      allRate: 0,
    };
    uni.showToast({ title: "加载失败", icon: "none" });
  }
});


//判断是否有未选择的单选题
const hasUnansweredRadio = () => {
  for (const group of data.value.element) {
    for (const item of group.element) {
      if (item.type === 'radio' && (item.value === '' || item.value === null || item.value === undefined)) {
        return true;
      }
    }
  }
  return false;
};




// 选择照片
// 选择照片
const handleTakePhoto = (subItem) => {
  if (!subItem.photos) subItem.photos = [];
  console.log("打开图片选择器...");
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: async (res) => {
      console.log("已选择照片:", res.tempFilePaths);
      // ★ 二次压缩后再入库，预览更流畅、也防止后续遗漏压缩
      const { path: compressed } = await compressLocalImage(res.tempFilePaths[0], 1280, 45);
      if (!subItem.photos) subItem.photos = [];
      subItem.photos.push({ url: compressed });
      console.log("当前照片列表:", subItem.photos);
    },
    fail: (err) => {
      console.error("选择照片失败:", err);
    }
  }, 300);
};

// 删除照片
const handleDeletePhoto = (subItem, photoIndex) => {
  if (!subItem.photos) return;
  console.log(`删除索引 ${photoIndex} 的照片:`, subItem.photos[photoIndex].url);
  subItem.photos.splice(photoIndex, 1);
  console.log("删除后照片列表:", subItem.photos);
};

// 预览照片
const previewImage = (subItem, currentPhoto) => {
  console.log("预览照片:", currentPhoto);
  const urls = subItem.photos.map(p => p.url);  // 获取字符串数组
  uni.previewImage({
    urls,
    current: currentPhoto,   // 这里必须是字符串
  });
};


// 转base64
const pathToBase64 = (path) => {
  console.log("开始转换Base64:", path);
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.io.resolveLocalFileSystemURL(path, (entry) => {
      entry.file((file) => {
        const reader = new plus.io.FileReader();
        reader.onloadend = (e) => {
          console.log("APP端转换完成，Base64长度:", e.target.result?.length);
          resolve(e.target.result);
        };
        reader.onerror = (err) => {
          console.error("APP端读取失败:", err);
          reject(err);
        };
        reader.readAsDataURL(file);
      }, (err) => {
        console.error("读取文件失败:", err);
        reject(err);
      });
    }, (err) => {
      console.error("路径解析失败:", err);
      reject(err);
    });
    // #endif

    // #ifdef MP-WEIXIN
    uni.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success: (res) => {
        console.log("微信端转换完成，Base64长度:", res.data?.length);
        resolve('data:image/jpeg;base64,' + res.data);
      },
      fail: (err) => {
        console.error("读取文件失败:", path, err);
        reject(err);
      }
    });
    // #endif
  });
};


// 提交
const handleSubmit = async () => {
  // 校验是否有未选择的单选题
  if (hasUnansweredRadio()) {
    uni.showModal({
      title: '提示',
      content: '有单选题未选择，是否确认提交？',
      confirmText: '提交',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          // 用户点击了“提交”，继续执行原有逻辑
          await doSubmit();
        }
      }
    });
    return;
  }

  // 正常提交路径
  await doSubmit();
};


const firmName = ref("");

async function fetchFirmNameById(firmId: string) {
  try {
    const res = await uni.request({
      url: "api/UnitEvaluation/GetKeyUnitEvaluateList",
      method: "GET",
      data: {
        page: 0,
        size: 1000,
      },
      header: {
        Authorization: "Bearer " + uni.getStorageSync("token"),
      },
    });
    if (res.statusCode === 200 && res.data.success) {
      const list = res.data.response?.data || [];
      const firm = list.find((item) => item.id === firmId);
      if (firm) {
        firmName.value = firm.name;
      } else {
        console.warn("未找到对应firmId的企业");
        firmName.value = "";
      }
    }
  } catch (error) {
    console.error("请求企业列表失败", error);
    firmName.value = "";
  }
}


// 提交
const doSubmit = async () => {
  try {
    console.log("【开始提交】");
    uni.showLoading({ title: "提交中..." });

    const taskElements: any[] = [];

    console.log("遍历数据:", data.value);

    // 遍历所有分组
    for (const group of data.value.element) {
      console.log("处理分组:", group.title);

      for (const sub of group.element) {
        console.log("处理项:", sub.id, "类型:", sub.type, "值:", sub.value);

        // 单选
        if (sub.type === "radio") {
          taskElements.push({
            indicatorCode: sub.id,
            booleanResult: sub.value ?? ""
          });
        }
        // 评分
        else if (sub.type === "rate") {
          taskElements.push({
            indicatorCode: sub.id,
            scoreResult: sub.value ?? 0
          });
        }
        // 文本域
        else if (sub.type === "textarea") {
          taskElements.push({
            indicatorCode: sub.id,
            descResult: sub.value ?? ""   ?? ""
          });
        }
        // 照片上传
       else if (sub.type === "photo" && sub.photos?.length) {
         for (let i = 0; i < sub.photos.length; i++) {
           const p = sub.photos[i];
           const url = typeof p === 'string' ? p : p.url;
       
           const photoObj: any = {
             indicatorCode: sub.id,
             PhotoIndex: i
           };
       
           if (url.startsWith("http") || url.startsWith("uploads/")) {
             // 已上传图片：只需提供路径
             photoObj.photoUrl = url;
           } else {
             // 新图片：需提供 Base64 和文件名
             try {
               const cleanBase64 = await toCompressedBase64(url); 
       
               if (!cleanBase64 || cleanBase64.length < 50) {
                 console.warn("base64 数据异常，跳过:", cleanBase64);
                 continue;
               }
       
               photoObj.PhotoData = cleanBase64;
               photoObj.FileName = `photo_${Date.now()}_${i}.jpg`;
             } catch (err) {
               console.warn("转换失败:", url, err);
               continue;
             }
           }
       
           taskElements.push(photoObj);
         }
       }


      }
    }

    // 构建最终请求体
    const payload = {
      FirmId: firmId,
      TaskId: id,
      TaskName: data.value.title || "",
      TaskElements: taskElements
    };


    // 发起请求
    const res = await uni.request({
      url: "api/UnitEvaluation/EvaluateSubmit",
      method: "POST",
      data: payload,
      header: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + uni.getStorageSync("token"),
      },
    });

    console.log("接口返回:", res);

    if (res.statusCode === 200 && res.data?.success) {
      uni.showToast({ title: "提交成功", icon: "success" });
      setTimeout(() => {
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage?.$vm?.fetchTaskData) {
          prevPage.$vm.fetchTaskData();
        }
       uni.redirectTo({
         url: `/pages/evaluate/components/Result?firmid=${firmId}&name=${encodeURIComponent(firmName.value)}`,
       });


      }, 1000);
    } else {
      console.warn(" 提交失败:", res.data);
      uni.showToast({ title: res.data?.msg || "提交失败", icon: "none" });
    }
  } catch (error) {
    console.error("提交异常:", error);
    uni.showToast({ title: "提交出错", icon: "none" });
  } finally {
    uni.hideLoading();
    console.log("【提交结束】");
  }
};


</script>


<template>
  <view class="container">
    <view class="content">
      <view class="top-title">{{ data.title }}</view>
      <view class="content-elements">
        <view v-for="(group, gIndex) in data.element" :key="gIndex">
          <view class="title">{{ group.title }}</view>
      
          <view v-for="(subItem, subIndex) in group.element" :key="subItem.id">
            <view class="name">{{ subItem.name }}</view>
            <view class="item">
              <!-- 单选 -->
              <u-radio-group
                v-if="subItem.type === 'radio'"
                v-model="subItem.value"
                :disabled="disabled"
                style="margin-left: 30rpx"
              >
                <u-radio label="是" :name="'1'"></u-radio>
                <u-radio label="否" :name="'0'" style="margin-left: 200rpx"></u-radio>
              </u-radio-group>
      
              <!-- 滑块评分 -->
              <u-slider
                v-else-if="subItem.type === 'rate'"
                v-model="subItem.value"
                :disabled="disabled"
                :min="0"
                :max="subItem.totalRate || 5"
                showValue
                blockSize="18"
                height="6px"
                :useNative="false"
              ></u-slider>
      
              <!-- 文本域 -->
              <u-textarea
                v-else-if="subItem.type === 'textarea'"
                v-model="subItem.value"
                :disabled="disabled"
                placeholder="请输入描述"
              ></u-textarea>
      
              <!-- 照片上传 -->
              <view v-else-if="subItem.type === 'photo'" class="photo-container">
                <view
                  v-for="(photo, photoIndex) in subItem.photos"
                  :key="photoIndex"
                  style="position: relative"
                >
                  <image
                    :src="photo.url"
                    class="photo"
                    @click="previewImage(subItem, photo.url)"
                  ></image>
                  <image
                    class="delete"
                    src="/static/evaluate/delete-image.svg"
                    @click="handleDeletePhoto(subItem, photoIndex)"
                  ></image>
                </view>
                <image
                  v-if="!disabled"
                  class="photo"
                  src="/static/evaluate/photo.svg"
                  @click="handleTakePhoto(subItem)"
                ></image>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="footer">
      <u-button
        v-if="!disabled"
        type="primary"
        shape="circle"
        class="custom-button"
        @click="handleSubmit"
        >{{ disabled ? "确定" : "提交评价" }}</u-button
      >
    </view>
  </view>
</template>

<style scoped lang="scss">
.container {
  height: 94.5vh;
  width: 100vw;
  background-color: #f9f9f9;
  .content {
    position: relative;
    top: 1vh;
    //height: calc(93.5vh - 132rpx);
    max-height: 82vh;
    height: 82vh;
    width: calc(100vw - 64rpx);
    background-color: #ffffff;
    padding: 32rpx 32rpx 30rpx 32rpx;
    overflow-y: scroll;
    .top-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333333;
      margin-bottom: 30rpx;
    }
    .title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333333;
      padding-left: 10rpx;
      border-left: 6rpx solid #3c9cff;
      margin-bottom: 20rpx;
      // 不换行
      white-space: nowrap;
      // 超出省略号
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .content-elements {
      font-size: 28rpx;
      margin-left: 20rpx;
      margin-top: 20rpx;

      .item {
        margin: 15rpx 0;
      }
    }
    .description {
      //border: 1px solid #cccccc;
      height: 284rpx;
      background-color: #f9f9f9;
    }
    .photo-container {
      margin: 0 auto 20rpx auto;
      display: flex;
      justify-content: flex-start;
      flex-wrap: wrap;
      align-items: center;
      .photo {
        width: 131rpx;
        height: 126rpx;
        object-fit: cover;
        margin-left: 10rpx;
        margin-top: 10rpx;
      }
      .delete {
        position: absolute;
        top: 10rpx;
        right: 0;
        width: 30rpx;
        height: 30rpx;
        border-radius: 50%;
        cursor: pointer;
      }
    }
  }
  .footer {
    background-color: #ffffff;
    height: 11vh;
    .custom-button {
      position: fixed;
      bottom: 30rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 90vw;
      //margin-top: 100rpx;
      //margin-bottom: 20rpx;
      height: 88rpx;
      background: linear-gradient(180deg, #1a6cff 0%, #1a87fe 100%);
      font-size: 28rpx;
    }
  }
}
</style>
