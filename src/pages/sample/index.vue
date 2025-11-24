<template>
  <view class="sample-page">
    <!-- 固定顶部区域 -->
    <view class="fixed-header">
      <!-- 顶部搜索栏 -->
      <view class="search-bar">
        <u-icon name="arrow-left" size="22" color="#333" class="back-icon" @click="goBack" />
        <input
          v-model="search"
          class="search-input"
          placeholder="请输入您要查询的监测井"
          placeholder-style="color:#bbb;font-size:15px;"
          type="text"
		  @confirm="handleSearch"
		  @input="onInput"
        />
        <view class="search-btn" @click="handleSearch">搜索</view>
      </view>

      <!-- Tabs -->
      <view class="tabs-bar">
        <view
          v-for="(tab, idx) in tabList"
          :key="tab.name"
          :class="['tab-item', { active: activeTab === idx }]"
          @click="handleTabChange(idx)"
        >
          {{ tab.name }}
          <view v-if="idx < tabList.length - 1" class="tab-divider"></view>
        </view>
      </view>
    </view>

    <!-- 可滚动内容区域 -->
   <view class="scroll-content">
     <view class="sample-list">
       <view
         v-for="item in filteredList"
         :key="item.id"
         class="sample-card"
       >
         <view class="card-header">
           <u-icon name="info-circle" color="#2979ff" size="22" />
           <text class="card-title">{{ item.name || '监测井' }}</text>
           <text class="card-status" :style="{ color: statusColor(item.status) }">
             {{ item.status }}
           </text>
         </view>
         <view class="card-info">
           <view>编号：{{ item.code }}</view>
           <view>类型：{{ item.type }}</view>
           <view>位置：{{ item.location }}</view>
         </view>
         <view class="card-divider"></view>
         <view class="card-footer" @click="goDetail(item)">
           <text class="detail-btn">查看详情</text>
           <u-icon name="arrow-right" color="#3c9cff" size="18" />
         </view>
       </view>
   
       <!-- 加载状态提示 -->
       <view v-if="loading" class="list-hint">加载中…</view>
       <view v-else-if="!hasMore && sampleList.length" class="list-hint">没有更多了</view>
       <view v-if="!loading && filteredList.length === 0" class="empty-list">暂无数据</view>
     </view>
   </view>

	

  </view>
  <CustomTabbar/>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import CustomTabbar from '@/components/CustomTabbar.vue';
import "@/utils/http";
import { onLoad, onShow, onPullDownRefresh, onReachBottom  } from '@dcloudio/uni-app';

let firstShow = true;

 
onPullDownRefresh(async () => {
  await getSampleListApi(search.value, currentTabName(), true);
  fetchSampleCounts(search.value);              
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (!hasMore.value || loading.value) return
  loadMore()
})


const pageIndex = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);
const loading = ref(false);
let debounceTimer: number | null = null;

const STATUS_MAP: Record<string, '待采样'|'采样中'|'已完成'> = {
   '0': '待采样', '1': '采样中', '2': '已完成',
   '待采样': '待采样', '采样中': '采样中', '已完成': '已完成',
   '进行中': '采样中', '完成': '已完成'
 };
const counts = ref({ total: 0, doing: 0, done: 0 });
const currentTabName = () => tabList.value[activeTab.value]?.name ?? '全部';



// 定义返回的数据类型
interface Well {
  id: number;
  name: string;
  code: string;
  type: string;
  wryName: string;
  city: string;
  location: string;
  status: string;
  
}


const search = ref('');
const activeTab = ref(0);
const tabList = computed(() => [
  { name: `全部（${counts.value.total}）` },
  { name: `采样中（${counts.value.doing}）` },
  { name: `已完成（${counts.value.done}）` },
]);

// 以前: const fetchSampleCounts = async () => {
const fetchSampleCounts = async (kw = '') => {
  try {
    const list: any[] = await new Promise((resolve, reject) => {
      uni.request({
        url: 'api/AppInterface/GetWaterQualSampleList',
        method: 'GET',
        data: {
          keyword: (kw || '').trim(), // ← 关键：随搜索词统计
          pageIndex: 1,
          pageSize: 10000
        },
        header: { Authorization: `Bearer ${uni.getStorageSync('token')}` },
        success: (res) => {
          if (res.statusCode === 200 && res.data?.success) {
            resolve(res.data.response || []);
          } else reject(new Error('统计拉取失败'));
        },
        fail: reject
      });
    });

    let doing = 0, done = 0;
    for (const row of list) {
      const st = STATUS_MAP[String(row?.SampleStatus ?? '')] ?? '待采样';
      if (st === '采样中') doing++;
      else if (st === '已完成') done++;
    }
    counts.value = { total: list.length, doing, done };
  } catch (e) {
    counts.value = { total: 0, doing: 0, done: 0 };
  }
};




// 模拟数据
//const sampleList = ref([
  //{ id: 1, code: 'DPSX01', type: '水源地点位', location: '东平县自来水公司', status: '采样中' },
  //{ id: 2, code: 'DPSX01', type: '水源地点位', location: '东平县自来水公司', status: '已完成' },
  //{ id: 3, code: 'DPSX01', type: '水源地点位', location: '东平县自来水公司', status: '待采样' },
  //{ id: 4, code: 'DPSX01', type: '水源地点位', location: '东平县自来水公司', status: '采样中' },
  //{ id: 5, code: 'DPSX01', type: '水源地点位', location: '东平县自来水公司', status: '采样中' },
//]);


const onInput = (e: any) => {
  const kw = typeof e?.detail?.value === 'string' ? e.detail.value : search.value;
  search.value = kw;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchSampleCounts(search.value);             
    getSampleListApi(search.value, currentTabName(), true);
  }, 1500) as any;
};



// sampleList 初始化为空数组，类型为 Well[]
const sampleList = ref<Well[]>([]);


// 接口请求获取数据
// searchQuery：可传监测井编码或名称；status：全部/采样中/已完成；reset：是否重置分页
const getSampleListApi = async (searchQuery: string, status: string, reset = false) => {
  if (loading.value) return;
  loading.value = true;
  if (reset) {
    pageIndex.value = 1;
    hasMore.value = true;
    sampleList.value = [];
  }

  try {
    // 并发拿 采样记录 + 井列表（和你原来一致）
    const [sampleRes, wellRes] = await Promise.all([
      new Promise<any[]>((resolve, reject) => {
        uni.request({
          url: 'api/AppInterface/GetWaterQualSampleList',
          method: 'GET',
          data: {
            
            keyword: (searchQuery || '').trim(),   
            pageIndex: pageIndex.value,            
            pageSize: pageSize.value
          },
          header: { Authorization: `Bearer ${uni.getStorageSync("token")}` },
          success: (res) => {
            if (res.statusCode === 200 && res.data.success) {
              resolve(res.data.response || []);
            } else {
              reject('采样记录加载失败');
            }
          },
          fail: reject
        });
      }),
      new Promise<any[]>((resolve, reject) => {
        uni.request({
          url: 'api/AppInterface/GetAllMonitoringWellList',
          method: 'GET',
          header: { Authorization: `Bearer ${uni.getStorageSync("token")}` },
          success: (res) => {
            if (res.statusCode === 200 && res.data.success) {
              resolve(res.data.response || []);
            } else {
              reject('监测井信息加载失败');
            }
          },
          fail: reject
        });
      })
    ]);
	
	const statusMap: Record<string, string> = {
	  '0': '待采样',
	  '1': '采样中',
	  '2': '已完成',
	  '待采样': '待采样',
	  '采样中': '采样中',
	  '已完成': '已完成',
	  '进行中': '采样中',
	  '完成': '已完成'
	};


    // 建井 map
    const wellMap = new Map<string, any>();
    wellRes.forEach(well => wellMap.set(well.pkiaa, well));

    // 合并
    const mergedPage = sampleRes.map((item) => {
      const w = wellMap.get(item.jcjCode) || {};
      return {
        id: Number(item.id),
        code: item.jcjCode,
        name: item.jcjName || '未知名称',
        type: w.jcdxName || '未定义类型',
        location: w.locationDescription || '未知位置',
		wryName: w.wryName || '',
		city: w.city || '',
        status: statusMap[item.SampleStatus] || '待采样',  
        sampleId: item.id
      } as Well;
    });


    // 如果后端不分页，这里手动前端分页一次，避免首屏过大卡顿
    const pageStart = (pageIndex.value - 1) * pageSize.value;
    const pageMerged = mergedPage.slice(0, mergedPage.length); // 先复制
    const currentSlice = pageMerged.slice(pageStart, pageStart + pageSize.value);

    // 真实情况优先用 mergedPage 是否小于 pageSize 来判断 hasMore
    const appendList = mergedPage.length > pageSize.value ? currentSlice : mergedPage;

    sampleList.value = reset ? appendList : [...sampleList.value, ...appendList];
    // hasMore 判断：优先后端分页；否则用切片长度判断
    hasMore.value = appendList.length === pageSize.value && mergedPage.length >= pageSize.value;

    if (hasMore.value) pageIndex.value += 1;
  } catch (err) {
    uni.showToast({ title: '请刷新', icon: 'none' });
  } finally {
    loading.value = false;
  }
};


const loadMore = () => {
  if (!hasMore.value || loading.value) return;
  getSampleListApi(search.value, currentTabName(), false);
};







// 计算属性，根据 tab 和 search 来过滤数据
const filteredList = computed(() => {
  let list = sampleList.value;
  if (activeTab.value === 1) list = list.filter(i => i.status === '采样中');
  else if (activeTab.value === 2) list = list.filter(i => i.status === '已完成');
  if (search.value) {
    const keyword = search.value.toLowerCase();
    list = list.filter(i =>
      i.code?.toLowerCase().includes(keyword) ||
      i.name?.toLowerCase().includes(keyword) ||
      i.type?.toLowerCase().includes(keyword) ||
      i.location?.toLowerCase().includes(keyword)
    );
  }

  return list;
});



const handleSearch = () => {
  fetchSampleCounts(search.value);               
  getSampleListApi(search.value, currentTabName(), true);
};


let searchTimer: number | null = null;
const handleTabChange = (idx: number) => {
  activeTab.value = idx;
  
  // 清除上一次未执行的计时器（防止快速切换产生多个请求）
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  // 延迟 2 秒调用 handleSearch()
  searchTimer = setTimeout(() => {
    handleSearch(); // 2秒后执行搜索
  }, 1500); // 2000毫秒 = 2秒
};

const goDetail = (item: any) => {
uni.navigateTo({
     url: `/pages/sample/detail?id=${item.sampleId}&code=${item.code}&name=${item.name}&type=${item.type}&location=${item.location}&status=${item.status}&wryName=${item.wryName || ''}&city=${item.city|| ''}`
  });

};


const goBack = () => {
  uni.navigateBack();
};

const statusColor = (status: string) => {
  if (status === '采样中') return '#19be6b';
  if (status === '已完成') return '#2979ff';
  return '#999';
};

// TODO: 页面加载时获取采样列表
onShow(() => {
  if (firstShow) {
    firstShow = false;
    getSampleListApi(search.value, currentTabName(), true);
    fetchSampleCounts(search.value);            
  }
});

</script>

<style scoped lang="scss">
.sample-page {
  background: #f8f8f8;
  height: 100vh;
  display: flex;
  flex-direction: column;

 .fixed-header {
   position: fixed;
   top: 0;
   left: 0;
   right: 0;
   z-index: 100;
   background: #f8f8f8;
   padding-top: var(--status-bar-height); 
   padding-bottom: 8rpx;
 }


  .search-bar {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 10px 0 rgba(0,0,0,0.06);
    margin: 18rpx 18rpx 0 18rpx;
    padding: 0 12px 0 0;
    height: 44px;
    .back-icon {
      margin-left: 8px;
      margin-right: 4px;
    }
    .search-input {
      flex: 1;
      font-size: 15px;
      background: #f5f6fa;
      border: none;
      height: 32px;
      border-radius: 16px;
      padding: 0 10px;
      margin: 0 4px;
      outline: none;
    }
    .search-btn {
      color: #3c9cff;
      font-size: 15px;
      font-weight: bold;
      margin-left: 8px;
      padding: 0 8px;
      height: 44px;
      display: flex;
      align-items: center;
      border-radius: 0 12px 12px 0;
      background: transparent;
    }
  }
  .tabs-bar {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 10px 0 rgba(0,0,0,0.06);
    margin: 14rpx 18rpx 0 18rpx;
    height: 44px;
    .tab-item {
      flex: 1;
      font-size: 15px;
      color: #666;
      text-align: center;
      font-weight: 500;
      position: relative;
      height: 44px;
      line-height: 44px;
      border-radius: 12px;
      &.active {
        font-weight: bold;
        color: #3c9cff;
        background: #f5faff;
      }
    }
    .tab-divider {
      position: absolute;
      right: 0;
      top: 12px;
      width: 1px;
      height: 20px;
      background: #e5e5e5;
    }
  }

  .scroll-content {
      padding-top: 270rpx;
      padding-bottom: calc(60px + env(safe-area-inset-bottom)); 
  }


  .sample-list {
    padding: 18rpx 16rpx 0 16rpx;
    .sample-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 10px 0 rgba(0,0,0,0.06);
      margin-bottom: 18rpx;
      padding: 18px 18px 0 18px;
      .card-header {
        display: flex;
        align-items: center;
        .card-title {
          font-weight: bold;
          font-size: 18px;
          margin-left: 8px;
        }
        .card-status {
          margin-left: auto;
          font-size: 16px;
          font-weight: 500;
        }
      }
      .card-info {
        margin: 12px 0 0 0;
        font-size: 15px;
        color: #333;
        line-height: 24px;
      }
      .card-divider {
        height: 1px;
        background: #f0f0f0;
        margin: 12px 0 0 0;
      }
      .card-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 5px;
        padding: 0 0 12px 0;
        cursor: pointer;
        .detail-btn {
          color: #3c9cff;
          font-size: 15px;
          font-weight: 500;
          // margin-left: 10px;
          margin-right: 2px;
        }
      }
    }
    .empty-list {
      text-align: center;
      color: #bbb;
      font-size: 15px;
      margin-top: 80rpx;
    }
  }
}
.list-hint {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 16px 0 24px;
}
.sample-page {
  background: #f8f8f8;
  min-height: 100vh;    // 页面滚动
  display: flex;
  flex-direction: column;

  .fixed-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    background: #f8f8f8;
    padding-top: var(--status-bar-height);
    padding-bottom: 8rpx;
  }

  /* 页面滚动容器：不再用 scroll-view */
  .scroll-content {
    /* 预留出固定头部的高度（你的头部约 270rpx，可继续沿用/微调） */
    padding-top: 270rpx;
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }
}


</style> 