<script setup lang="ts">
import HeaderSearch from "@/components/HeaderSearch.vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { ref,computed } from "vue";
import type { FirmList } from "@/types/firm";
import FirmCard from "@/pages/task/components/FirmCard.vue";
import { cloneDeep } from "lodash";
import { watch } from "vue";
import CustomTabbar from '@/components/CustomTabBar.vue';
import "@/utils/http";


// 分页参数
const currentPage = ref(0);
const pageSize = ref(10);
const keyword = ref("");
const lawStatusList = ["all", "done", "pending"]; // 对应接口参数
const normalizeBool = (v:any) => v === true || v === 1 || v === '1' || v === 'true';
const mapFirm = (item:any) => ({
  id: item.id,
  gid: item.gid,
  uscc: item.uscc,
  name: item.name,
  rate: item.rate || 0,
  result: item.result || "待评估",
  address: item.address || "暂无地址",
  phone: item.phone || "暂无电话",
  town: item.town,
  doLaw: normalizeBool(item.doLaw),
  isVeto: item.isVeto,
  keyunitType: item.keyunitType,
  isWater: item.isWater,
  isSoil: item.isSoil,
  type: item.type,
  EvaluationId: item.EvaluationId,
  EvaluationCode: item.EvaluationCode,
  
});


const statusKey = computed(() => lawStatusList[currentIndex.value] as 'all'|'done'|'pending');

const masterList = ref<any[]>([])

const totals = computed(() => {
  const all = masterList.value.length
  const done = masterList.value.reduce((n, it) => n + (it?.doLaw ? 1 : 0), 0)
  return { all, done, pending: all - done }
})


const tabCounts = computed(() => ({
  all: totals.value.all,
  done: totals.value.done,
  pending: totals.value.pending
}))

const countByIndex = (idx: number) => {
  if (idx === 0) return tabCounts.value.all
  if (idx === 1) return tabCounts.value.done
  return tabCounts.value.pending
}

const buildCommonParams = () => {
  const pollutantTypesVal =
    waterOrSoil.value.length === 2 || waterOrSoil.value.length === 0
      ? ""
      : waterOrSoil.value[0]

  return {
    regionCode: filterItem.value === "3709" ? "" : filterItem.value,
    pollutantTypes: pollutantTypesVal,
    keyword: (keyword.value || "").trim(),
    sortBy: "",
    sortOrder: ""
  }
}

const fetchAllForTotals = async () => {
  masterList.value = []
  const pageSizeForTotals = 200
  let pageIndex = 0
  let total = Infinity

  while (masterList.value.length < total) {
    const res:any = await uni.request({
      url: 'api/UnitEvaluation/GetKeyUnitEvaluateList',
      method: 'GET',
      // ✅ 不传 lawStatus，只拉“全部”
      data: { ...buildCommonParams(), page: pageIndex, size: pageSizeForTotals },
      header: { Authorization: `Bearer ${uni.getStorageSync('token')}` }
    })
    if (!(res.statusCode === 200 && res.data?.success)) break

    const rows = (res.data.response?.data || []) as any[]
    total = Number(res.data.response?.dataCount ?? rows.length)
    console.log('[mapped page]', pageIndex, rows.map(mapFirm))
    // ✅ 统一成标准结构（含 doLaw 布尔化）
    const mapped = rows.map(mapFirm)
    masterList.value.push(...mapped)

    if (rows.length < pageSizeForTotals) break
    pageIndex += 1
  }
}




onShow(() => {
  currentPage.value = 0;
   noMore.value = false;
  //fetchFirmData();
});

const dataList = ref<FirmList[]>([
  { title: "全部", firms: [] },
  { title: "已执法", firms: [] },
  { title: "待执法", firms: [] },
]);

const showData = ref<FirmList[]>(cloneDeep(dataList.value));

const currentIndex = ref(0);
const isRefreshing = ref(false);

const sortIconSrc = ref("/static/task/sort.svg");
const isClickSort = ref(false);

const filterItem = ref("3709");
const filterTitle = ref("泰安市");
const filterIconSrc = ref("/static/task/filter.svg");
const showFilterPop = ref(false);
const waterOrSoil = ref(["soil", "water"]);

const refreshAfterKeywordChange = async () => {
  currentPage.value = 0
  noMore.value = false
  await fetchAllForTotals()   // 先重算上方数量（masterList/totals）
  await fetchFirmData()       // 再刷新下面的分页列表
}


const options = [
  { label: "泰安市", value: "3709" },
  { label: "泰山区", value: "370902" },
  { label: "新泰市", value: "370982" },
  { label: "肥城市", value: "370983" },
  { label: "宁阳县", value: "370921" },
  { label: "岱岳区", value: "370911" },
  { label: "东平县", value: "370923" },
  { label: "高新技术产业开发区", value: "370991" },
];

const noMore = ref(false);

// 请求接口
const fetchFirmData = async () => {
  try {
    if (currentPage.value === 0) noMore.value = false

    // 1) 取数据源（已是 mapFirm 过的标准结构）
    const key = statusKey.value  // 'all' | 'done' | 'pending'
    const sourceAll = masterList.value

    // 2) 先按 tab 过滤
    const filtered = key === 'done'
      ? sourceAll.filter(f => f.doLaw)
      : key === 'pending'
      ? sourceAll.filter(f => !f.doLaw)
      : sourceAll

    // 3) 本地分页
    const start = currentPage.value * pageSize.value
    const end   = start + pageSize.value
    const pageItems = filtered.slice(start, end)

    // 4) 三列数据（全部/已执法/待执法），“全部”就是本页数据本身
    const all = pageItems
    const done = pageItems.filter(f => f.doLaw)
    const pending = pageItems.filter(f => !f.doLaw)

    // 5) 是否没有更多
    if (end >= filtered.length) noMore.value = true

    // 6) 首页覆盖/下一页追加
    if (currentPage.value === 0) {
      dataList.value = [
        { title: "全部", firms: all },
        { title: "已执法", firms: done },
        { title: "待执法", firms: pending },
      ]
    } else {
      dataList.value[0].firms.push(...all)
      dataList.value[1].firms.push(...done)
      dataList.value[2].firms.push(...pending)
    }

    showData.value = cloneDeep(dataList.value)
  } catch (err) {
    console.error("获取企业列表失败:", err)
    uni.showToast({ title: "网络异常", icon: "none" })
  }
}
;

// 生命周期
onLoad(async () => { await refreshAfterKeywordChange(); })


// 立即搜索（输入框变化时）
const handleSearchInput = async (e:any) => {
  const val = typeof e === 'string' ? e : e?.detail?.value || ''
  keyword.value = val
  if (!val || val.trim() === '') {
    currentPage.value = 0
    noMore.value = false
    return await refreshAfterKeywordChange()
  }
}
;

const searchRef = ref(null);

watch(
  () => searchRef.value?.input,
  (newVal) => { 
    if (newVal === "" && keyword.value !== "") {
      keyword.value = "";
      currentPage.value = 0;
     refreshAfterKeywordChange();
    }
  }
);


// 搜索事件
const handleSearch = async (val:string) => {
  keyword.value = (val || '').trim()
  currentPage.value = 0
  noMore.value = false
  return await refreshAfterKeywordChange()
}
;



// 标签切换
const handleChangeData = (index: number) => {
  if (index !== currentIndex.value) {
    currentIndex.value = index;
    currentPage.value = 0;
	noMore.value = false;
    fetchFirmData();
  }
};

// 下拉刷新
const handleRefresh = () => {
  isRefreshing.value = true;
  currentPage.value = 0;
   noMore.value = false; 
  fetchFirmData().finally(() => {
    isRefreshing.value = false;
  });
};

// 加载更多
const isLoading = ref(false);

const handleLoadMore = () => {
  // 已经在加载中就不触发
  if (isLoading.value) return;

  // 没有更多数据时直接提示
  if (noMore.value) {
    uni.showToast({ title: "没有更多了", icon: "none" });
    return;
  }

  // 加载下一页
  isLoading.value = true;
  currentPage.value++;
  fetchFirmData().finally(() => {
    isLoading.value = false;
  });
};


// 排序
const handleSort = () => {
  const isAsc = !isClickSort.value;

  for (let i = 0; i < dataList.value.length; i++) {
    showData.value[i].firms.sort((a, b) => {
      const rateA = a.rate || 0;
      const rateB = b.rate || 0;
      return isAsc ? rateA - rateB : rateB - rateA;
    });
  }

  if (isAsc) {
    sortIconSrc.value = "/static/task/sort-activate.svg"; // 你可以准备一个升序图标
  } else {
    sortIconSrc.value = "/static/task/sort-activate.svg"; // 准备一个降序图标
  }

  isClickSort.value = !isClickSort.value;
};


// 地区筛选
const handelFilter = async (value: string) => {
  const selectedItem = options.find((item) => item.value === value)
  filterTitle.value = selectedItem?.label || '泰安市'
  filterItem.value = value
  currentPage.value = 0
  noMore.value = false
  await fetchAllForTotals()
  fetchFirmData()
};

// 打开污染类型筛选
const showFilterType = () => {
  showFilterPop.value = !showFilterPop.value;
  filterIconSrc.value = showFilterPop.value
    ? "/static/task/filter-activate.svg"
    : "/static/task/filter.svg";
};

// 选择污染类型
const handleFilterType = async (value: string[]) => {
  waterOrSoil.value = value
  currentPage.value = 0
  noMore.value = false
  await fetchAllForTotals()
  fetchFirmData()
};
</script>

<template>
  <view class="container">
    <view class="header">
      <view class="filter-icon">
        <u-dropdown>
          <u-dropdown-item
            v-model="filterItem"
            :title="filterTitle"
            :options="options"
            @change="handelFilter"
          ></u-dropdown-item>
        </u-dropdown>
      </view>
<HeaderSearch
  ref="searchRef"
  :placeholder="'请输入公司名称'"
  @search="handleSearch"
  @input="handleSearchInput"
/>



    </view>
    <view class="content">
      <view class="scroll-header">
        <view
          class="header-title"
          v-for="(item, index) in showData"
          :key="index"
        >
          <view
            :class="{ cur: index === currentIndex }"
            @click="handleChangeData(index)"
          >
            {{ item.title }}（{{ countByIndex(index) }}）
          </view>
          <image
            v-show="index === 1"
            class="icon"
            @click="handleSort"
            :src="sortIconSrc"
          ></image>
          <image
            v-show="index === 2"
            class="icon"
            :src="filterIconSrc"
            @click="showFilterType"
          ></image>
        </view>
        <view v-show="showFilterPop" class="filter-pop">
          <u-checkbox-group
            v-model="waterOrSoil"
            iconPlacement="right"
            placement="column"
            class="filter-item"
            @change="handleFilterType"
          >
            <u-checkbox label="土壤" name="soil"></u-checkbox>
            <u-checkbox label="地下水" name="water"></u-checkbox>
          </u-checkbox-group>
        </view>
      </view>
      <scroll-view
        class="scroll-content"
        :scroll-y="true"
        @scrolltolower="handleLoadMore"
        @refresherrefresh="handleRefresh"
        :refresher-enabled="true"
        :refresher-threshold="50"
        :refresher-default-style="'black'"
        :refresher-triggered="isRefreshing"
      >
        <view
          class="scroll-item"
          v-for="item in showData[currentIndex].firms"
          :key="item.id"
        >
          <FirmCard :data="item"></FirmCard>
        </view>
		
		  <view style="height: 90rpx;"></view>
		

      </scroll-view>
    </view>
	<CustomTabbar />
  </view>
</template>

<style scoped lang="scss">
.container {
  width: 100vw;
  height: 94vh;
  background-color: #f5f7f8;

  .header {
    padding-top: 4.5vh;
    width: 100vw;
    height: 5vh;
    background-color: white;
    display: flex;

    .filter-icon {
      width: 200rpx;
      margin-left: 20rpx;
      display: flex;
      align-items: center;
    }

    :deep(.u-flex-row) {
      display: flex;
      align-items: center;
    }

    :deep(.u-dropdown__content__mask) {
      background: transparent;
    }

    :deep(.u-cell) {
      box-shadow: 0 0 2rpx 2rpx inset rgba(0, 0, 0, 0.1);
    }

    :deep(.u-cell__title-text) {
      white-space: nowrap;
    }
	
    :deep(.u-dropdown__content){
	  width: 420rpx !important;   /* 你想要的展开面板宽度 */
	  left: 20rpx !important;     /* 从触发器左侧对齐，可以微调 */
	  right: auto !important;     /* 避免撑满屏幕 */
	  z-index: 999;               /* 防止被其它元素遮住 */
	  max-height: 60vh;           /* 如果选项很多，限制最大高度 */
	  overflow-y: auto;           /* 超出可滚动 */
	}
  }

  .content {
    width: 100vw;
    height: 85vh;

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

      .cur {
        color: #00aaff;
        border-bottom: 5rpx solid #3c9cff;
      }

      .header-title {
        display: flex;
        justify-content: center;
        align-items: center;

        .icon {
          width: 36rpx;
          height: 36rpx;
          margin-left: 10rpx;
          margin-top: 2rpx;
        }
      }

      .filter-pop {
        position: absolute;
        right: 5vw;
        bottom: -150rpx;
        z-index: 1;
        width: 23vw;
        height: 150rpx;
        display: flex;
        justify-content: space-around;
        flex-direction: column;
        align-items: center;
        background-color: #ffffff;
        box-shadow: 0 0 2rpx 2rpx inset rgba(0, 0, 0, 0.1);
        border-radius: 8px;

        .filter-item {
          width: 20vw;
          padding-left: 10%;
          padding-right: 10%;
        }
      }
    }

    .scroll-content {
      max-height: 84.5vh;
      overflow-y: auto;
	  padding-bottom: 20rpx;

      .scroll-item {
        margin-top: 1vh;
      }
    }
  }
}
</style>
