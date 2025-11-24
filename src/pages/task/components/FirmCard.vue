<script setup lang="ts">
import type { Firm } from "@/types/firm";
import { computed, ref } from "vue";
import { firmImgList } from "@/CONST/const";
import { random } from "lodash";

const props = defineProps({
  data: {
    required: true,
    type: Object as Firm,
    default: () => {},
  },
  showRate: {
    required: false,
    type: Boolean,
    default: true,
  },
  showEvaluate: {
    required: false,
    type: Boolean,
    default: true,
  },
});

// 直接使用后端数据，不再改 props
const data = computed(() => props.data)

// 颜色只根据“后端返回的 result 文本”决定；若后端已给 resultColor，则优先用它
const textColor = computed(() => {
  // 若后端有颜色字段，优先使用
  const fromApi = (data.value as any)?.resultColor
  if (typeof fromApi === 'string' && fromApi) return fromApi

  switch ((data.value?.result || '').trim()) {
    case '达标':
      return '#4cd964'
    case '基本达标':
      return '#45b8fb'
    case '未达标':
      return '#ED4F4F'
    default:
      return '#000000' // 待评估/空值
  }
})


// 点击评估
const handleEvaluateOrDetail = () => {
  const unitType = String(data.value.keyunitType ?? '01').padStart(2, '0'); // ✅
  uni.navigateTo({
    url:
      `/pages/evaluate/index`
      + `?id=${encodeURIComponent(String(data.value.id))}`
      + `&firmId=${encodeURIComponent(String(data.value.id))}`
      + `&name=${data.value.name || ''}`
      + `&keyunitType=${encodeURIComponent(unitType)}`
	  + `&EvaluationId=${encodeURIComponent(String(data.value.EvaluationId ?? ''))}`
	  + `&EvaluationCode=${encodeURIComponent(String(data.value.EvaluationCode ?? ''))}`,
  });
};

</script>

<template>
  <view class="card-container">
    <view class="content">
      <image
        :src="firmImgList[random(0, firmImgList.length - 1)]"
        class="photo"
        mode="heightFix"
      ></image>
      <view class="info">
        <view class="info-header">
          <view class="title">{{ data.name }} </view>
          <view class="icons">
            <image
              v-if="data.isWater"
              src="../../../static/task/groundwater.svg"
              class="img"
            ></image>
            <image
              v-if="data.isSoil"
              src="../../../static/task/soil.svg"
              class="img"
            ></image>
          </view>
        </view>
        <view class="info-content">
          <view v-if="props.showRate" class="content-item">
            <view class="label">评分结果：</view>
            <!--            <u-rate count="5" v-model="data.rate" readonly allowHalf></u-rate>-->
            <view :style="{ color: textColor }"
              >{{ data.result }}&nbsp;&nbsp;{{
                data.rate === 0 ? "" : data.rate + "分"
              }}</view
            >
          </view>
          <view v-else class="content-item">
            <view class="label">行业分类：</view>
            {{ data.type }}
          </view>
          <view class="content-item">
            <view class="label">单位地址：</view>
            {{ data.address }}
          </view>
          <view class="content-item">
            <view class="label">联系电话：</view>
            {{ data.phone }}
          </view>
        </view>
      </view>
    </view>
    <view class="footer">
      <image
        v-if="props.showEvaluate && !data.doLaw"
        src="../../../static/task/evaluate.svg"
        @click="handleEvaluateOrDetail"
      ></image>
      <image
        v-if="props.showEvaluate && data.doLaw"
        src="../../../static/task/look-detail.svg"
        @click="handleEvaluateOrDetail"
      ></image>
    </view>
  </view>
</template>

<style scoped lang="scss">
.card-container {
  width: calc(100vw - 60rpx);
  //height: calc(22vh - 120rpx);
  background-color: #ffffff;
  border-radius: 20px;
  padding: 50rpx 30rpx 30rpx 30rpx;

  .content {
    display: flex;
    width: 100%;

    .photo {
      height: calc(22vh - 120rpx);
      width: calc(22vh - 120rpx);
      //background-color: #4cd964;
      border-radius: 30rpx;
    }

    .info {
      margin-left: 20rpx;
      width: 13.625rem;

      .info-header {
        margin-bottom: 40rpx;
        display: flex;
        justify-content: space-between;

        .title {
          font-size: 32rpx;
          font-weight: bold;
        }
        .icons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .img {
            width: 36rpx;
            height: 36rpx;
            margin-left: 2rpx;
          }
        }
      }

      .info-content {
        .content-item {
          margin-bottom: 16rpx;
          display: flex;
          align-items: center;
          font-size: 28rpx;
      
          .label {
            color: #666666;
            width: 140rpx;       // ✅ 固定宽度
            flex-shrink: 0;      // ✅ 不压缩
            text-align: right;   // ✅ 靠右对齐
            margin-right: 12rpx;
          }
      
          // 让内容自动占满
          .value {
            flex: 1;
            white-space: nowrap;        // ✅ 一行显示
            overflow: hidden;           // ✅ 超出隐藏
            text-overflow: ellipsis;    // ✅ 超出显示省略号
          }
        }
      }

    }
  }

  .footer {
    background-color: white;
    display: flex;
    justify-content: flex-end;
    image {
      width: 164rpx;
      height: 66rpx;
    }
  }
}
</style>
