<script setup lang="ts">
import type { PropType } from "vue";
import type { Task } from "@/types/task";
import { computed } from "vue";
import { taskImages } from "@/CONST/const";


const percent = computed(() => {
  const all = Number(data.value.allRate) || 0
  const got = Number(data.value.rate) || 0
  if (all <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((got / all) * 100)))
})

const bubbleStyle = computed(() => {
  const p = percent.value
  return {
    left: p + '%',
    transform: p === 0 ? 'translateX(0)' : 'translateX(-50%)'
  }
})


const props = defineProps({
  data: {
    type: Object as PropType<Task>,
    required: true,
    default: () => ({} as Task),
  },
  firmId: {
    type: String,
    required: true,
    default: "",
  },
  showEvaluate: {
    type: Boolean,
    default: true,
  },

  keyunitType: {
    type: String,
    default: "01",
  },
});

const data = computed(() => props.data);

// 点击评估
const handleEvaluate = (id: string, disabled: boolean) => {
	console.log('TaskCard props.keyunitType =', props.keyunitType);
  console.log("📌 传递 Items:", data.value.Items);
  

  const items = encodeURIComponent(JSON.stringify(data.value.Items || []));

  const ut = String(props.keyunitType || "01").padStart(2, "0");

  uni.navigateTo({
    url:
      `/pages/evaluate/components/Detail`
      + `?id=${id}`
      + `&firmId=${props.firmId}`       
      + `&disabled=${disabled}`
      + `&items=${items}`
      + `&keyunitType=${encodeURIComponent(ut)}`,
  });
};
</script>


<template>
  <view class="card-container">
    <view class="content">
      <!-- 左侧图片 -->
      <image
        :src="taskImages.get(data.type) || '/static/evaluate/default.png'"
        class="photo"
        mode="aspectFill"
      ></image>

      <!-- 中间信息 -->
      <view class="info">
        <view class="info-header">
          <view class="title">{{ data.name }}</view>
        </view>

        <view class="info-content">
         <view class="content-item progress-row">
           <view class="label">评分：</view>
         
           <view class="slider-container">
             <span class="slider-value" :style="bubbleStyle">
               {{ Number(data.rate) + '′' }}
             </span>
             <u-line-progress
               :key="data.id + '-' + percent"
               :percentage="percent"
               :activeColor="'#2979ff'"
               :showText="false"
               height="6"
             />
           </view>
         
          <view class="rate-number" :class="{ placeholder: !(Number(data.allRate) > 0) }">
              {{ Number(data.allRate) > 0 ? (Number(data.allRate) + '分') : '' }}
            </view>
         </view>

          <view class="content-item">
            <view class="label">时间：</view>
            {{ data.time }}
          </view>
        </view>
      </view>
    </view>

    <!-- 否决标识 -->
    <image
      v-if="data.isVeto"
      class="img-veto"
      src="/static/evaluate/veto.png"
    ></image>

    <!-- 底部按钮 -->
    <view class="footer">
      <image
        v-if="props.showEvaluate"
        :src="data.doLaw ? '/static/task/look-detail.svg' : '/static/task/evaluate.svg'"
        @click="handleEvaluate(data.id, data.doLaw)"
      ></image>
    </view>
  </view>
</template>

<style scoped lang="scss">
.card-container {
  width: calc(100vw - 80rpx);
  background-color: #fff;
  border-radius: 20px;
  padding: 20rpx 40rpx 30rpx;
  position: relative;

  .content {
    display: flex;
    width: 100%;
    margin-top: 20rpx;

    .photo {
      width: calc(22vh - 120rpx);
      height: calc(22vh - 120rpx);
      background-color: #4cd964;
      border-radius: 30rpx;
      flex: 0 0 auto;
    }

    .info {
      margin-left: 20rpx;
      flex: 1;        /* 让中部信息区吃满剩余空间 */
      min-width: 0;   /* 防止文本把容器撑宽，确保进度条列宽一致 */

      .info-header {
        margin-bottom: 20rpx;
        display: flex;
        justify-content: space-between;

        .title {
          font-size: 30rpx;
          font-weight: bold;
        }
      }

      .info-content {
        position: relative;
        top: 35rpx;

        /* 其它行仍然是横向排布 */
        .content-item {
          margin-bottom: 14rpx;
          display: flex;
          justify-content: flex-start;
          align-items: center;

          .label { white-space: nowrap; }
        }

        .content-item:last-child { margin-top: 35rpx; }

        /* ✅ 评分这一行固定三列：左=标签，中=进度条，右=总分（占位） */
        .content-item.progress-row {
          display: grid !important;                 /* 覆盖上面的 flex */
          grid-template-columns: 80rpx 1fr 100rpx;  /* 固定列宽 */
          align-items: center;
          column-gap: 16rpx;
        }

        /* 中列容器充满这一列 */
        .content-item.progress-row .slider-container {
          position: relative;
          width: 100%;
          min-width: 0;
        }

        /* 进度条组件强制100%宽 */
        .content-item.progress-row .slider-container :deep(.u-line-progress){
          width: 100%;
        }
        /* 某些版本还需要把背景轨道也拉满 */
        .content-item.progress-row .slider-container :deep(.u-line-progress__background){
          width: 100%;
        }

        /* 右列：无分数时隐藏文字但保留列宽 */
        .content-item.progress-row .rate-number{
          margin-left: 0;
          text-align: right;
          font-size: 28rpx;
          white-space: nowrap;
        }
        .content-item.progress-row .rate-number.placeholder{
          visibility: hidden;
        }

        /* 小蓝气泡（位置跟随脚本里的 bubbleStyle） */
        .content-item.progress-row .slider-value{
          position: absolute;
          top: -25px;
          font-size: 24rpx;
          background-color: #2979ff;
          color: #fff;
          padding: 2px 5px;
          border-radius: 10px;
          white-space: nowrap;
        }
      }
    }
  }

  .footer {
    background-color: #fff;
    display: flex;
    justify-content: flex-end;

    image { width: 164rpx; height: 66rpx; }
  }

  .img-veto {
    position: absolute;
    right: 0; top: 0;
    width: 124rpx; height: 106rpx;
    transform: rotate(20deg);
    opacity: 0.4;
  }
}

</style>
