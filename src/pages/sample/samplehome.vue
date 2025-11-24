<script type="module">
import HeaderSearch from "@/components/HeaderSearch.vue";
import { onMounted, ref, computed ,nextTick, onBeforeUnmount,watch, watchEffect} from "vue";
import BottomSheet from "@/components/BottomSheet.vue";
import FirmCard from "@/pages/task/components/FirmCard.vue";
import TaskCard from "@/pages/evaluate/components/TaskCard.vue";
import CustomTabbar from '@/components/CustomTabBar.vue';
import { onShow } from '@dcloudio/uni-app'
import axios from 'axios';
import "@/utils/http";
import regionData from "@/static/taian.json";

import {
  licenseLocked,             
  startLicenseTickerForUI,    
  stopLicenseTickerForUI,
  initLicenseClockOnce,    
  guardLicense                
} from '@/utils/licenseGuard';

export default {
  components: {
    TaskCard,
    FirmCard,
    BottomSheet,
    HeaderSearch,
	CustomTabbar,
  },
  mounted() {},
   setup(props, { expose , emit }) {
    const mapView = ref({
      layers: [],
    });
	
	//////////
	 const isDisabledByLicense = licenseLocked;
	
	    onMounted(() => {
	      initLicenseClockOnce();
	      startLicenseTickerForUI();  // 开始每秒 tick，让禁用态自动刷新
	    });
	    onBeforeUnmount(() => {
	      stopLicenseTickerForUI();
	    });

///////////

//登录对应区域
const mapRef = ref(null)
const regionAdcode = ref('')  

function onMapReady() {
  const adcode = String(uni.getStorageSync('saasdm') || '')
  console.log('[REGION] onMapReady -> showRegionBySaasdm', adcode)
  mapRef.value?.callMethod?.('showRegionBySaasdm', { adcode })   // 兜底再调一次
}

onMounted(() => {
  // 触发一次 map 初始化（你的 initMap 用的是 :change:mapView）
  mapView.value = { ...mapView.value, __boot: Date.now() }

  // 读取登录时存的 saasdm，直接绑定给 renderjs
  regionAdcode.value = String(uni.getStorageSync('saasdm') || '')

  // 兜底：有些端属性触发稍慢，延时再主动 call 一次
  nextTick(() => {
    setTimeout(() => {
      const adcode = regionAdcode.value
      if (mapRef.value?.callMethod && adcode) {
        console.log('[REGION] fallback call -> showRegionBySaasdm', adcode)
        mapRef.value.callMethod('showRegionBySaasdm', { adcode })
      }
    }, 200)
  })
})

 expose({ onMapReady }) 


    const positionIndex = ref({
      index: 0,
      isLocation: true,
      chahba: null,
      chahbb: null,
    });

    // 定位
    const handleLocation = () => {
      positionIndex.value.index = positionIndex.value.index + 1;
      positionIndex.value.isLocation = true;
    };
	
	
	
//模糊搜素
	const phone = uni.getStorageSync('phone');
	const STORAGE_KEY = `searchHistory:${phone || 'guest'}`;
    const showHistory = ref(false);
    const historyList = ref([]);
	const isFocused = ref(false);

function loadHistory() {
  try { historyList.value = JSON.parse(uni.getStorageSync(STORAGE_KEY) || '[]') } catch { historyList.value = [] }
}
function saveHistory() {
  try { uni.setStorageSync(STORAGE_KEY, JSON.stringify(historyList.value)) } catch {}
}
	
	
	onMounted(loadHistory)
	onShow && onShow(loadHistory)


function addSearchHistory(name, max = 30) {
  const n = (name || '').trim()
  if (!n) return
  const pinned = historyList.value.filter(i => i.isAlways)
  const normal = historyList.value.filter(i => !i.isAlways && i.name !== n)
  historyList.value = [...pinned, { id: Date.now().toString(), name: n }, ...normal].slice(0, max)
  saveHistory()
}

const closeSearchPanel = () => {
  isFocused.value = false;          // 让输入守卫失效
  showHistory.value = false;        // 关闭底部面板
  keyword.value = '';               // 可选：清空关键字
  uni.hideKeyboard && uni.hideKeyboard();  // 收起软键盘（小程序/H5/APP）
  try {
    // 如果 HeaderSearch 内部暴露了输入框实例，尝试失焦
    headerSearchRef.value?.blur?.();
    headerSearchRef.value?.$refs?.inputRef?.blur?.();
  } catch (e) {}
};
      
//清空搜索 + 收起面板 + 复原图标/视角
const resetSearchAndIcons = () => {
  // 1) 清空搜索框与联想/历史
  keyword.value = '';
  showHistory.value = false;
  isFocused.value = false;
  try {
    if (headerSearchRef.value) {
      // 你的 HeaderSearch 暴露了 input 字段，直接回写
      headerSearchRef.value.input = '';
      headerSearchRef.value.blur?.();
      headerSearchRef.value.$refs?.inputRef?.blur?.();
    }
  } catch (e) {}

  uni.hideKeyboard && uni.hideKeyboard();

  // 2) 让地图复位 + 图标复原（走 renderjs 方法）
  console.log('[RESET] call handleResetPosition')
  mapRef.value?.callMethod?.('handleResetPosition')

};

   // 清空搜索历史
function cleanHistory() {
  uni.showModal({
    title: '提示', content: '是否确定清空搜索历史?',
    success: (res) => {
      if (res.confirm) { historyList.value = []; saveHistory(); uni.showToast({ title: '已清空', icon: 'none' }) }
    }
  })
}

const onClickHistory = async (name) => {
  const q = (name || '').trim();
  if (!q) return;
  const nq = norm(q)
  const exact = (allWells.value || []).find(w => String(w.pkiaa) === q);
  const fuzzy = exact ? null : (allWells.value || []).find(w => {
      const id = norm(w.pkiaa), nm = norm(w.wellName), wr = norm(w.wryName)
      return id.includes(nq) || nm.includes(nq) || wr.includes(nq)
    });
  const target = exact || fuzzy;
  if (!target) { uni.showToast({ title: '未找到该记录', icon: 'none' }); return; }
  await handleSearch(target.pkiaa, true, String(target.pkiaa)); 
  closeSearchPanel();                                           
};
   
   // 管理搜索历史
   const manageHistory = () => {
     uni.navigateTo({
       url: "/pages/index/components/HistoryManage",
     });
   };
   
// —— 输入联动 —— //
const keyword = ref('')
const getInputText = (v) =>
  typeof v === 'string' ? v : (v?.detail?.value ?? v?.target?.value ?? v?.value ?? '')

const handleSearchInput = (v) => {
  const q = getInputText(v)
  keyword.value = q
  showHistory.value = isFocused.value && (q.trim().length > 0 || historyList.value.length > 0)
  console.log('[suggest] q=', q, ' size=', pkiaaSuggest.value.length)
}
// —— pkiaa 模糊联想 —— //
/** allWells：你已有的“GetAllMonitoringWellList”结果（确保包含 pkiaa 字段） */
const pkiaaSuggest = computed(() => {
  const q = norm(keyword.value)
  const list = (allWells.value || [])
  if (!q) return list.slice(0, 20)
  // 三字段打分：前缀>包含
  const score = (w) => {
    const id = norm(w.pkiaa)
    const nm = norm(w.wellName)
    const wr = norm(w.wryName)
    let s = 0
    if (id.startsWith(q)) s += 100
    if (nm.startsWith(q)) s += 60
    if (wr.startsWith(q)) s += 60
    if (id.includes(q)) s += 30
    if (nm.includes(q)) s += 20
    if (wr.includes(q)) s += 20
    return s
  }
  return list
    .map(w => [w, score(w)])
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 50)
})

const onPickSuggest = async (row) => {
  headerSearchRef.value && (headerSearchRef.value.input = row.pkiaa);
  await handleSearch(row.pkiaa, true, String(row.pkiaa));  
  closeSearchPanel();                                      
};


    // 聚焦方法
    const focusOrBlurFunction = (show) => {
      isFocused.value = !!show
      showHistory.value = isFocused.value && ((keyword.value || '').trim().length > 0 || historyList.value.length > 0)
      if (show) sheetRef.value?.hideSheet()
    };



    // 打开sheet
    const handleOpenSheet = () => {
      uni.hideTabBar({
        animation: false,
      });
      showFixedBottom.value = true;
      // sheetRef.value.openSheet();
    };

    // 关闭sheet
    const handleCloseSheet = () => {
      uni.showTabBar({
        animation: false,
      });
      showFixedBottom.value = false;
      // sheetRef.value.hideSheet();
    };

    const headerSearchRef = ref(null);
	watch(() => headerSearchRef.value?.input, (v) => {
	  if (!isFocused.value) return
	  if (v == null) return
	  handleSearchInput(v)
	})
	
     let isFetching = false;
	 
	 const allSamples = ref([]); // 保存所有采样记录
	 
	 const fetchAllSamples = async () => {
	   try {
	     const res = await uni.request({
	       url: 'api/AppInterface/GetWaterQualSampleList',
	       method: 'GET',
	       header: {
	         Authorization: `Bearer ${uni.getStorageSync('token')}`
	       }
	     });
	 
	     allSamples.value = res.data?.response || [];
	     console.log('获取全部采样记录:', allSamples.value.length, '条');
	   } catch (e) {
	     console.error('获取全部采样记录失败:', e);
	     uni.showToast({ title: '采样记录获取失败', icon: 'none' });
	   }
	 };

	 onMounted(async () => {
	   await fetchAllSamples(); // 页面加载时获取全部记录
	 });
	 
	 //根据 code 找出 sampleId 最大的一条
	const getLatestSampleIdByCode = (jcjCode) => {
	  const list = allSamples.value.filter(item => item.jcjCode?.trim() === jcjCode?.trim());
	
	  console.log(`监测井 ${jcjCode} 匹配记录数:`, list.length);
	
	  if (!list.length) return null;
	
	  const sorted = list.sort((a, b) => parseInt(b.id) - parseInt(a.id));
	  return sorted[0].id;
	};


    // 搜索方法
    // 改造这个方法，接收 id 参数（可选）
// 支持：handleSearch('ZDQ001', false, 'ZDQ001')
// 也支持：handleSearch({ name:'ZDQ001', isClick:true, id:'ZDQ001' })
const handleSearch = async (arg1, arg2 = false, arg3 = '') => {
  if (isFetching) { console.warn('等待上次请求完成'); return }

  // ① 统一入参
  let keyword = '', isClick = false, rawId = ''
  if (arg1 && typeof arg1 === 'object') {
    keyword = String(arg1.name || '').trim()
    isClick = !!arg1.isClick
    rawId   = arg1.id != null ? String(arg1.id) : ''
  } else {
    keyword = String(arg1 || '').trim()
    isClick = !!arg2
    rawId   = arg3 != null ? String(arg3) : ''
  }
  let wellId = rawId ? String(rawId) : null
  console.log('[SEARCH] normalize =>', { keyword, isClick, rawId })

  if (!keyword && !wellId) { uni.showToast({ title:'请输入关键字', icon:'none' }); return }

  isFetching = true
  try {
    await fetchAllSamples()

    // ② 用 pkiaa 精确→模糊（allWells 需包含 pkiaa）
    if (!wellId && keyword) {
      const exact = (allWells.value || []).find(w => String(w.pkiaa) === keyword)
      const fuzzy = exact ? null : (allWells.value || []).find(w => String(w.pkiaa).includes(keyword))
      if (exact) wellId = String(exact.pkiaa)
      else if (fuzzy) wellId = String(fuzzy.pkiaa)
    }
	
	if (!wellId && keyword) {
	      const nq = norm(keyword)
	      const byNameEq = (allWells.value || []).find(w => norm(w.wellName) === nq || norm(w.wryName) === nq)
	      const byNameIn = byNameEq ? null : (allWells.value || []).find(w => {
	        return norm(w.wellName).includes(nq) || norm(w.wryName).includes(nq)
	      })
	      if (byNameEq) wellId = String(byNameEq.pkiaa)
	      else if (byNameIn) wellId = String(byNameIn.pkiaa)
    }

    // ③ 再兜底：用 keyUnitList 的名称反查 pkiaa
    if (!wellId && keyword) {
      const ku = keyUnitList.value.find(it => it.unitName === keyword)
             || keyUnitList.value.find(it => it.unitName?.includes(keyword))
      if (ku?.id) wellId = String(ku.id)
    }

    if (!wellId) { uni.showToast({ title:'未找到匹配井', icon:'none' }); return }

    // ④ 输入回显 + 历史：只存 pkiaa，保证可点历史直达
    headerSearchRef.value && (headerSearchRef.value.input = wellId)
    addSearchHistory(wellId)

    // ⑤ 拉详情 + 采样步骤（fetchFirmData 已按 pkiaa 查）
    await fetchFirmData(wellId)
    const latestSampleId = getLatestSampleIdByCode(firmData.value.code)
    if (latestSampleId) {
      hasRecord.value = true
      await fetchSamplingSteps(latestSampleId)
    } else {
      hasRecord.value = false
      taskList.value = []
      uni.showToast({ title:'暂无采样记录', icon:'none' })
    }

    // ⑥ 关闭搜索面板 + 打开弹层
    closeSearchPanel()
    sheetRef.value?.openSheet?.()

    // 地图飞过去
    if (firmData.value && firmData.value.chahba && firmData.value.chahbb) {
          positionIndex.value = {
             index: 0,
             isLocation: false,
             chahba: firmData.value.chahba,
             chahbb: firmData.value.chahbb,
             name: firmData.value.unitName || firmData.value.name || '',
            jcdxName: firmData.value.jcdxName || '',
             id: firmData.value.code || wellId
           }
          
         }
  } catch (e) {
    console.error('handleSearch 出错:', e)
  } finally {
    isFetching = false
  }
};




  // 监测井详情数据
 const firmData = ref({}); // 井详情数据
 const allWells = ref([]); // 缓存所有井列表（在地图加载时赋值）
  
  // 弹窗引用
  const sheetRef = ref(null);

 
 // 获取接口数据函数
const fetchFirmData = async (wellId) => {
  try {
    const allWellsRes = await uni.request({
      url: `api/AppInterface/GetAllMonitoringWellList`,
      method: 'GET',
      data: { keyword: '' },
      header: { Authorization: `Bearer ${uni.getStorageSync('token')}` }
    });

    const well = allWellsRes.data?.response?.find(w => String(w.pkiaa) === String(wellId));
    if (!well) {
          console.warn('[DETAIL] 未在 GetAllMonitoringWellList 中找到井 =>', { wellId }); 
          return;
        }
		
		  console.log('[DETAIL] 接口井命中 =>', { id: well.pkiaa, name: well.wellName }); 

    firmData.value = {
      id: well.pkiaa,
      code: well.pkiaa,
      location: well.locationDescription,
      type: well.jcdxName,
      status: well.lastStatus,
	  wryName: well.wryName,
	  city: well.city,
      lastSampleID: well.lastSampleID,
	  name: well.wellName,
	  chahba: Number(well.chahba),
	  chahbb: Number(well.chahbb),
    };
	console.log('[DETAIL] firmData 已设置 =>', { id: firmData.value.id, name: firmData.value.name }); 
  } catch (err) {
    console.error("获取井信息失败：", err);
  }
};




// 弹窗打开前先拉取数据
const openPopup = async () => {
  await fetchFirmData();  // firmData.value.code 将被赋值

  const code = firmData.value.code;
  const latestSampleId = getLatestSampleIdByCode(code);

  console.log("openPopup 选中井 code =", code, ", 最新 sampleId =", latestSampleId);

  if (latestSampleId) {
    await fetchSamplingSteps(latestSampleId);  // 用 sampleId 调步骤详情
    sheetRef.value?.open(); // 打开弹窗
  } else {
    uni.showToast({ title: '暂无采样记录', icon: 'none' });
  }
};



// 状态颜色方法
const statusColor = (status) => {
  if (status === '已完成') return 'green-text';
  if (status === '采样中') return 'blue-text';
  return 'gray-text';
};

onMounted(async () => {
  await fetchAllSamples(); // 只加载采样数据列表
});

const form = ref({
  sampleName: '',
  sampleOrder: '',
  sampleCode: '',
  sampleMethod: '',
  sampleDepth: '',
  wellFlushMethod: '',
  burialCondition: '',
  aquiferMedia: '',
  sampleCount: ''
});


const sampleId = ref('');
const hasRecord = ref(false); 
const taskList = ref([]);
    // 公司的执法
const fetchSamplingSteps = async (id) => {
	console.log('[fetchSamplingSteps] 传入的 id =', id);

	
  if (!id) return;

  try {
    const res = await uni.request({
      url: 'api/AppInterface/GetWaterQualSampleDetails',
      method: 'GET',
      data: { id }, // 正确使用 id
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`
      }
    });
	

    if (res.statusCode !== 200 || !res.data?.success || !res.data?.response) {
      uni.showToast({ title: '获取采样详情失败', icon: 'none' });
      console.warn('返回异常:', res.data);
      return;
    }
	
	hasRecord.value = true;

    const detail = res.data.response || {};
    console.log('GetWaterQualSampleDetails 返回 detail:', detail);

    sampleDetail.value = detail;
    sampleId.value = Number(detail.id) || id; 

    // 表单字段
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

    // firmData
    if (detail.jcjCode) firmData.value.code = detail.jcjCode;
    if (detail.jcjName) firmData.value.name = detail.jcjName;
    if (detail.jcdxName) firmData.value.type = detail.jcdxName;
    if (detail.locationDescription) firmData.value.location = detail.locationDescription;
    if (detail.SampleStatus) {
      firmData.value.status =
        detail.SampleStatus === '已完成'
          ? '已完成'
          : (detail.SampleStatus === '采样中' ? '采样中' : '待采样');
    }

    // 构造 taskList
    const baseUrl = 'http://geologygis.com:8864/';
    const stepMap = [
      { name: '洗井', flag: 'isWashedWell' },
      { name: '取样', flag: 'isSampled' },
      { name: '保存运输', flag: 'isSaveTransport' },
      { name: '化验', flag: 'isDoneTest' }
    ];

    taskList.value = stepMap.map(step => {
      const submitted = detail[step.flag] === '1';
      const stepImages = detail.SampleProcessImages?.filter(img => img.processType === step.name) || [];

      const images = stepImages.map(img => `${baseUrl}${img.photoUrl}`);
      const shootTime = submitted && stepImages.length > 0 ? stepImages[0].shootTime : '';

      return {
        stepName: step.name,
        submitted,
        status: submitted ? 'done' : 'pending',
        statusText: submitted ? '已提交' : '待提交',
        imagePath: images,
        shootTime
      };
    });

    // 构造 SampleProcessImages
    SampleProcessImages.value = [];

    (detail.SampleProcessImages || []).forEach((img) => {
      const relative = img.photoUrl?.replace(/^https?:\/\/[^/]+\/?/, '') || '';
      SampleProcessImages.value.push({
        sampleId: sampleId.value,
        processType: img.processType,
        photoIndex: img.photoIndex ?? 1,
        shootLongitude: img.shootLongitude ?? 0,
        shootLatitude: img.shootLatitude ?? 0,
        shootTime: img.shootTime ?? formatTimeForApi(new Date()),
        remark: img.remark ?? '',
        photoUrl: relative,
        url: baseUrl + img.photoUrl
      });
    });

    console.log('构造完毕：taskList + SampleProcessImages + firmData');
  } catch (e) {
    console.error("异常捕获：", e);
    uni.showToast({ title: '网络错误', icon: 'none' });
  }
};


// ========== 水质监测弹窗状态 ==========
const waterSheetRef = ref(null)
const waterLoading  = ref(false)
const waterError    = ref(null)
const waterList = ref([])   // ✅ 直接数组，不用泛型

function openBS(ref)  { ref?.openSheet?.() || ref?.open?.() }
function closeBS(ref) { ref?.hideSheet?.() || ref?.close?.() }
const BS_ANIM_MS = 220


// 归一化工具
const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '')

// 预构建检索串：编号|井名|污染源名
function buildSearchKey(w) {
  return [w.pkiaa, w.wellName, w.wryName]
    .map(norm)
    .filter(Boolean)
    .join('|')
}

// 小工具：规范化后端返回的字段（Gid/gid 混用）
function normRow(raw) {
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    gid: String(raw.gid ?? raw.Gid ?? ''),
    jcjCode: String(raw.jcjCode ?? ''),
    jcjName: String(raw.jcjName ?? ''),
    gceabb: String(raw.gceabb ?? ''),
    cysj: String(raw.cysj ?? ''),
    szlb: raw.szlb ?? null,
    exceedThreshold: raw.exceedThreshold ?? null,
	wryName:  raw.wryName
  }
}

function mapSzlb(val) {
  const szlbMap = {
    '1': 'Ⅰ',
    '2': 'Ⅱ',
    '3': 'Ⅲ',
    '4': 'Ⅳ',
    '5': 'Ⅴ',
    '6': 'Ⅵ'
  }
  if (val == null) return null
  const key = String(val).trim()
  return szlbMap[key] || val
}


// ========== 打开“水质监测”二级弹窗并加载数据 ==========
async function openWaterSheet() {
  const pkiaa = String(firmData.value?.code || '').trim()
  if (!pkiaa) {
    uni.showToast({ title: '缺少监测井编号', icon: 'none' })
    return
  }

  waterLoading.value = true
  waterError.value = null
  waterList.value = []

  try {
    const res = await uni.request({
      url: 'api/AppInterface/GetWellWaterQualSample',
      method: 'GET',
      data: { pkiaa },
      header: { Authorization: `Bearer ${uni.getStorageSync('token')}` },
    })
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(res.data?.msg || '接口返回失败')
    }

    const rows = Array.isArray(res.data.response) ? res.data.response : []
    waterList.value = rows.map(normRow)
      .sort((a, b) => new Date(b.cysj).getTime() - new Date(a.cysj).getTime())

    // ✅ 打开二级前先收起一级，避免两个弹窗叠遮罩
    closeBS(sheetRef.value)
    // 稍等一级关闭动画结束再开二级
    setTimeout(() => openBS(waterSheetRef.value), BS_ANIM_MS)
  } catch (e) {
    console.error('[GetWellWaterQualSample] error:', e)
    waterError.value = e?.message || '加载失败'
    uni.showToast({ title: waterError.value, icon: 'none' })
  } finally {
    waterLoading.value = false
  }
}

// 点击“返回”按钮：先关二级 → 再开一级
function closeWaterSheet() {
  closeBS(waterSheetRef.value)
  setTimeout(() => openBS(sheetRef.value), BS_ANIM_MS)
}

// 如果用户通过手势/遮罩把二级关了，也要重开一级（在模板上用 @close 绑定这个）
function handleWaterClosed() {
  setTimeout(() => openBS(sheetRef.value), BS_ANIM_MS)
}






function formatTime(timeStr) {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  if (isNaN(date)) return '';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ` +
         `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}



    // 是否显示底部的执法按钮
    const showFixedBottom = ref(false);

    const buttonText = ref("开始执法");

    // 开始执法
    const handleLaw = () => {
      uni.navigateTo({
        url:
          "/pages/evaluate/index?id=" +
          firmData.value.id +
          "&name=" +
          firmData.value.name,
      });
    };
	
	
	//采样
// 采样入口（从当前页 -> /pages/lab/check）
const handleGoSample = () => {
  const code = String(firmData.value?.pkiaa || firmData.value?.code || '').trim()
  const name = String(firmData.value?.wellName || firmData.value?.name || '').trim()
  const type = String(firmData.value?.jcdxName || firmData.value?.type || '')
  const location = String(firmData.value?.location || firmData.value?.locationDescription || '')
  const wryName = String(firmData.value?.wryName ?? '').trim()
  const city = String(firmData.value?.city ?? firmData.value?.City ?? firmData.value?.districtCity ?? '').trim()

  if (!code) { uni.showToast({ title: '缺少监测井编号', icon: 'none' }); return }

  const id = String(firmData.value?.sampleId || firmData.value?.lastSampleID || '').trim()

  // 只传一次（不编码）
  const pairs = []
  if (id) pairs.push(['id', id])
  pairs.push(['code', code], ['name', name], ['type', type], ['location', location], ['wryName', wryName], ['city', city])

  const checkUrl = '/pages/lab/check?' + pairs.map(([k,v]) => `${k}=${v}`).join('&')

  console.log('[GoSample -> check] checkUrl =', checkUrl)
  console.log('[GoSample -> check] payload =', { id, code, name, type, location, wryName, city })

  uni.navigateTo({ url: checkUrl })
}


// 坐标系转换
function wgs84ToGcj02(lon, lat) {
  const PI = Math.PI, a = 6378245.0, ee = 0.00669342162296594323;
  function outOfChina(lon, lat) {
    return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
  }
  function transformLat(x, y) {
    let ret = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x));
    ret += (20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3;
    ret += (20*Math.sin(y*PI)+40*Math.sin(y/3*PI))*2/3;
    ret += (160*Math.sin(y/12*PI)+320*Math.sin(y*PI/30))*2/3;
    return ret;
  }
  function transformLon(x, y) {
    let ret = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x));
    ret += (20*Math.sin(6*x*PI)+20*Math.sin(2*x*PI))*2/3;
    ret += (20*Math.sin(x*PI)+40*Math.sin(x/3*PI))*2/3;
    ret += (150*Math.sin(x/12*PI)+300*Math.sin(x/30*PI))*2/3;
    return ret;
  }
  if (outOfChina(lon, lat)) return [lon, lat];
  let dLat = transformLat(lon - 105, lat - 35);
  let dLon = transformLon(lon - 105, lat - 35);
  const radLat = lat / 180 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180) / (a / sqrtMagic * Math.cos(radLat) * PI);
  return [lon + dLon, lat + dLat];
}
function gcj02ToBd09(lon, lat) {
  const x = lon, y = lat;
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * Math.PI * 3000.0 / 180.0);
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * Math.PI * 3000.0 / 180.0);
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006];
}

// 检测已安装地图
function getInstalledMapApps() {
  if (typeof plus === 'undefined') return [];
  const exist = pname => plus.runtime.isApplicationExist({ pname });
  const list = [];
  if (exist('com.autonavi.minimap')) list.push({ label: '高德地图', key: 'amap' });
  if (exist('com.baidu.BaiduMap')) list.push({ label: '百度地图', key: 'baidu' });
  if (exist('com.tencent.map')) list.push({ label: '腾讯地图', key: 'tencent' });
  if (exist('com.google.android.apps.maps')) list.push({ label: 'Google 地图', key: 'google' });
  return list;
}

// 打开地图 App
function openMapApp({ lon, lat, name, app }) {
  const title = encodeURIComponent(name || '目标位置');
  const [gcjLon, gcjLat] = wgs84ToGcj02(lon, lat);
  const [bdLon, bdLat] = gcj02ToBd09(gcjLon, gcjLat);
  let url = '';
  switch (app) {
    case 'amap':
      url = `amapuri://route/plan/?dlat=${gcjLat}&dlon=${gcjLon}&dname=${title}&t=0&dev=0`;
      break;
    case 'baidu':
      url = `baidumap://map/direction?destination=latlng:${bdLat},${bdLon}|name:${title}&mode=driving&coord_type=bd09ll`;
      break;
    case 'tencent':
      url = `qqmap://map/routeplan?type=drive&tocoord=${gcjLat},${gcjLon}&to=${title}&referer=testapp`;
      break;
    case 'google':
      url = `geo:${lat},${lon}?q=${lat},${lon}(${title})`;
      break;
  }
  plus.runtime.openURL(url, () => {
    const h5 = `https://uri.amap.com/navigation?to=${gcjLon},${gcjLat},${title}&mode=car&src=testapp&coordinate=gaode&callnative=1`;
    plus.runtime.openURL(h5);
  });
}

// 选择地图并导航
function chooseMapAndNavigate(lon, lat, name) {
  const apps = getInstalledMapApps();
  if (apps.length === 0) {
    uni.showModal({
      title: '未发现地图App',
      content: '将使用网页导航',
      showCancel: false,
      success: () => {
        const [gcjLon, gcjLat] = wgs84ToGcj02(lon, lat);
        const title = encodeURIComponent(name || '目标位置');
        const h5 = `https://uri.amap.com/navigation?to=${gcjLon},${gcjLat},${title}&mode=car&src=testapp&coordinate=gaode&callnative=1`;
        plus.runtime.openURL(h5);
      }
    });
    return;
  }
  uni.showActionSheet({
    itemList: apps.map(a => a.label),
    success: res => {
      openMapApp({ lon, lat, name, app: apps[res.tapIndex].key });
    }
  });
}




    // 导航
    const leadIndex = ref(0);
	
const handleLeading = () => {
  const lon = Number(firmData.value?.chahba || firmData.value?.longitude);
  const lat = Number(firmData.value?.chahbb || firmData.value?.latitude);

  if (isNaN(lon) || isNaN(lat)) {
    uni.showToast({ title: '坐标缺失', icon: 'none' });
    return;
  }

  chooseMapAndNavigate(lon, lat, firmData.value?.unitName || firmData.value?.name || '目标位置');
};


 const keyUnitList = ref([]);


onMounted(async () => {

  try {
    // 获取全部井数据
    const wellsRes = await uni.request({
      url: `api/AppInterface/GetAllMonitoringWellList`,
      method: 'GET',
      data: { keyword: '' },
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`
      }
    });
	
	console.log('返回井数据:', wellsRes); // 打印完整响应对象
	console.log('井列表内容（response字段）:', wellsRes.data?.response); // 打印实际井数据数组
	

    if (wellsRes.statusCode !== 200 || !wellsRes.data.success) {
      return uni.showToast({ title: '获取井数据失败', icon: 'none' });
    }

	// 现在直接用全部 wells 数据
	allWells.value = wellsRes.data.response || [];
	
	keyUnitList.value = allWells.value.map(item => ({
	  id: item.pkiaa.toString(),
	  unitName: item.wellName,
	  wryName: item.wryName || '',
	  chahba: item.chahba?.toString(),
	  chahbb: item.chahbb?.toString(),
	  lastSampleID: item.lastSampleID,
	   jcdxName: item.jcdxName || '',
	   jcdx: item.jcdx,
	  doLaw: false
	}));
	
	console.log("要加载到地图的点位列表:", keyUnitList.value);

	
	keyUnitList.value.forEach(p => {

	});

    

  } catch (err) {
    console.error('网络异常:', err);
    uni.showToast({ title: '请求失败', icon: 'none' });
  }
});

// 跳转到新增页（可把当前选中井或中心点坐标一起带过去）
const goAddWell = () => {
  const lon = Number(firmData.value?.chahba ?? 0) || 0
  const lat = Number(firmData.value?.chahbb ?? 0) || 0
  const district = encodeURIComponent(String(uni.getStorageSync('district') || ''))
  uni.navigateTo({ url: `/pages/well/add?lon=${lon}&lat=${lat}&district=${district}` })
}

    // 复位功能
    const resetPosition = ref(0);

    const handleClickReset = () => {
      resetPosition.value = resetPosition.value + 1; 
      resetSearchAndIcons();                        
    };

const clearActiveTick = ref(0);

    // 退出sheet
    // 返回按钮：只关面板
   const handleQuit = () => {
     clearActiveTick.value += 1;            
     handleCloseSheet();
     sheetRef.value?.hideSheet();
     headerSearchRef.value && (headerSearchRef.value.input = '');
     showHistory.value = false;
   };




    

    // 切换地图
    const showChangeMap = ref(false);

    // 图册列表
    const layerList = ref([
      {
        id: "0",
        name: "矢量图",
        imgSrc: "/static/index/tdtsl.svg",
      },
      {
        id: "1",
        name: "影像图",
        imgSrc: "/static/index/tdtyx.svg",
      },
    ]);

    // 切换地图按钮
    const handleClickChangeMap = () => {
      showChangeMap.value = !showChangeMap.value;
    };

    // 联动renderjs切换图层
    const handleChangeMap = (data) => {
      mapView.value = {
        layers: [data.name],
      };
      showChangeMap.value = false;
    };
	

     
	
	const previewImage = (images, index) => {
	  uni.previewImage({
	    urls: images,        // 所有图片
	    current: images[index]  // 当前点中的那张
	  });
	};
	
	const canvasWidth = ref(300)
	const canvasHeight = ref(150)
	
	function formatTime(input) {
	  const date = input instanceof Date ? input : new Date(input);
	  if (isNaN(date.getTime())) {
	    return '';
	  }
	  const y = date.getFullYear();
	  const m = String(date.getMonth() + 1).padStart(2, '0');
	  const d = String(date.getDate()).padStart(2, '0');
	  const h = String(date.getHours()).padStart(2, '0');
	  const min = String(date.getMinutes()).padStart(2, '0');
	  return `${y}-${m}-${d} ${h}:${min}`;
	}

	
	const formatTimeForApi = (date) => {
	  if (!(date instanceof Date)) {
	    console.warn('formatTimeForApi 参数不是 Date 对象:', date);
	    return '';
	  }
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
	
	const SampleProcessImages = ref([]);
	
	// stepName 可为 '洗井'、'取样'、'保存运输'、'化验'
	const takePhotoForStep = (stepName) => {
		////
		if (!guardLicense('拍照')) return;
		////
		
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
	        SampleProcessImages.value.push({
	          processType: stepName,
	          photoIndex: SampleProcessImages.value.length + 1,
	          shootTime,
	          shootLongitude: location.longitude,
	          shootLatitude: location.latitude,
	          localPath: finalPath
	        });
	
	        // 更新 UI 中 step.images 展示用
	       const step = taskList.value.find(s => s.stepName === stepName);
		   
	     if (step) {
	       step.imagePath.push(finalPath);
	       step.submitted = true;
	       step.status = 'pending';
	       step.statusText = '待上传';
	     }

	      });
	    }
	  });
	};
	
	const isReadonly = computed(() => sampleDetail.value.SampleStatus === '已完成');
	
	const deletedImageKeys = ref([]); // 存储所有被用户删除的图路径

	function extractFilename(url) {
	  if (!url || typeof url !== 'string') return '';
	  return url.split('/').pop();
	}
	
	const removeImage = (step, imageToRemove) => {
			console.log(' imageToRemove =', imageToRemove);
				console.log(' 当前 SampleProcessImages:', SampleProcessImages.value);
	  const imageKey = extractFilename(imageToRemove);
	
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
	        // 记录删除路径（如后续你想传 deletedImageKeys 给后端）
	        if (!deletedImageKeys.value.includes(imageKey)) {
	          deletedImageKeys.value.push(imageKey);
	        }
	
	        const before = step.imagePath.length;
	
	        //从步骤图片中移除（UI）
	        step.imagePath = step.imagePath.filter(img => extractFilename(img) !== imageKey);
	
	        //从上传缓存中移除
	        SampleProcessImages.value = SampleProcessImages.value.filter(img => {
	          return extractFilename(img.url || img.photoUrl || img.localPath) !== imageKey;
	        });
	
	        const after = step.imagePath.length;
	        console.log(`删除成功：${step.stepName || step.name} 从 ${before} 张变为 ${after} 张`);
	        console.log('当前 SampleProcessImages（剩余）:', SampleProcessImages.value.map(i => i.url || i.photoUrl || i.localPath));
	      }
	    }
	  });
	};


	
   const sampleDetail = ref({})
	
	
	
 const confirmAndUpload = () => {
	 ////
	 if (!guardLicense('保存')) return;
	 /////
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
 
 
 // 压缩图片函数（压成 JPG 格式，降低体积）
 function compressImage(path, quality = 0.6) {
   return new Promise((resolve, reject) => {
     uni.compressImage({
       src: path,
       quality: quality * 100, // 0.1~1
       format: 'jpg',
       success: (res) => {
         console.log(' 压缩成功:', res.tempFilePath);
         resolve(res.tempFilePath);
       },
       fail: (err) => {
         console.error(' 图片压缩失败:', err);
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
 
 // 2. 使用 canvas 强制导出 JPG 格式
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
 
 
 
 // 3. 上传函数：处理所有图片并上传
 const uploadAllStepImages = async () => {
   const total = SampleProcessImages.value.length;
   if (!total) {
     uni.showToast({ title: '无图片可上传', icon: 'none' });
     return;
   }
 
   uni.showLoading({ title: '上传中...' });
   console.log(`开始上传，总共 ${total} 张图片`);
 
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
       console.warn(` 第 ${index} 张图获取信息失败，跳过`, err);
       continue;
     }
 
     // 用 canvas 导出 JPG
     let jpegPath;
     try {
       jpegPath = await drawImageAsJPEG(filePath, info.width, info.height);
     } catch (err) {
       console.warn(`第 ${index} 张图 canvas 导出失败，跳过`, err);
       continue;
     }
 
     // 转 base64
     let base64;
     try {
       base64 = await filePathToBase64(jpegPath);
     } catch (err) {
       console.warn(`第 ${index} 张图 base64 转换失败，跳过`, err);
       continue;
     }
 
     if (!base64 || base64.length < 100) {
       console.warn(`第 ${index} 张图 base64 无效，跳过`);
       continue;
     }
 
    const stepName = img.processType?.replace(/\s/g, '') || 'step';
    
    if (!stepCounters[stepName]) stepCounters[stepName] = 1;
    else stepCounters[stepName] += 1;
    
    const stepIndex = stepCounters[stepName];
    const photoName = img.photoName || `photo_${sampleDetail.value.gceabb}_${stepName}_${stepIndex}.jpg`;
 
     const photoSize = Math.floor(base64.length * 3 / 4);
 
     console.log(`第 ${index} 张图片：`);
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
 console.log('所有本地图片步骤:', processTypes);
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
 
   console.log('最终上传 JSON（前 500 字符）:', JSON.stringify(requestData).slice(0, 500));
 
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
         fetchSamplingSteps(sampleId.value);
       } else {
         console.warn('上传失败:', res.data);
         uni.showToast({ title: res.data?.msg || '上传失败', icon: 'none' });
       }
     },
     fail: (err) => {
       uni.hideLoading();
       console.error(' 网络异常:', err);
       uni.showToast({ title: '网络异常', icon: 'none' });
     },
   });
 };
 
// 把一条卡片 row 规范成详情页需要的字段
function normalizeForDetail(row) {
  // firmData 若在外部已有（监测井信息），这里做兜底
  const firm = (typeof firmData !== 'undefined' && firmData?.value) ? firmData.value : (firmData || {})
  return {
    sampleId: String(row?.sampleId || row?.id || row?.gid || ''),   // id 兜底
    code:     String(row?.code || row?.jcjCode || firm.code || ''),  // 监测井编号
    name:     String(row?.name || row?.jcjName || firm.name || ''),
    type:     String(row?.type || firm.type || ''),
    location: String(row?.location || firm.location || ''),
    status:   String(row?.status ?? ''),                             // 没有就空串
    wryName:  String(row?.wryName || firm.wryName || ''),
    city:     String(row?.city || firm.city || '')
  }
}

// 拼装带所有参数的跳转 URL（注意编码）
function buildDetailUrl(item) {
  const q = [
    ['id',        item.sampleId],
    ['code',      item.code],
    ['name',      item.name],
    ['type',      item.type],
    ['location',  item.location],
    ['status',    item.status],
    ['wryName',   item.wryName || ''],
    ['city',      item.city || '']
  ].map(([k, v]) => `${k}=${v ?? ''}`).join('&')

  return `/pages/sample/detail?${q}`
}

// 点击卡片内“查看详情”按钮
function goDetailByRow(row) {
  const item = normalizeForDetail(row)
  if (!item.sampleId) {
    uni.showToast({ title: '缺少样品ID', icon: 'none' })
    return
  }

  // 打印要传的参数对象
  console.log('携带参数:', item)

  const url = buildDetailUrl(item)
  console.log('URL:', decodeURI(url))

  uni.navigateTo({ url })
}


// 点击卡片内“实验室信息”按钮（先占位）
function goLabByRow(row) {
  uni.showToast({ title: '实验室信息开发中', icon: 'none' })
}


    return {
		mapRef, 
		 regionAdcode,
      mapView,
      positionIndex,
      handleLocation,
      showHistory,
      historyList,
      cleanHistory,
      manageHistory,
      focusOrBlurFunction,
      sheetRef,
      headerSearchRef,
	  keyword, showHistory, historyList,
	    handleSearchInput, onPickSuggest, onClickHistory, cleanHistory,
	    pkiaaSuggest,
      handleSearch,
      handleOpenSheet,
      handleCloseSheet,
      firmData,
      taskList,
      showFixedBottom,
      buttonText,
      handleLaw,
	  handleGoSample,
      leadIndex,
      handleLeading,
      keyUnitList,
      resetPosition,
      handleClickReset,
      handleQuit,
      showChangeMap,
      layerList,
      handleClickChangeMap,
      handleChangeMap,
	  statusColor,
	  fetchSamplingSteps,
	  formatTime,
	  extractFilename,
	  previewImage,
	  CustomTabbar,
	  canvasWidth,
	  canvasHeight,
	  isReadonly,
	  formatTimeForApi,
	  getLocation,
	  SampleProcessImages,
	  takePhotoForStep,
	   removeImage,
	   confirmAndUpload,
	   uploadAllStepImages,
	   isDisabledByLicense,
	    hasRecord,
		clearActiveTick,
		waterSheetRef, waterLoading, waterError, waterList,
	    openWaterSheet, closeWaterSheet,handleWaterClosed,
		goAddWell,
		mapSzlb,
		goDetailByRow,
		goLabByRow,
		buildDetailUrl,
		normalizeForDetail
		
    };
  },
};
</script>

<script module="olmap" lang="renderjs">
import Map from "ol/Map";
import View from "ol/View";
import { Fill, Stroke, Style, Text, Circle as CircleStyle, Icon } from "ol/style";
import VectorSource from "ol/source/Vector";
import { GeoJSON } from "ol/format";
import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { LineString, Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import polyline from '@/utils/polyline';
import { toRaw } from 'vue';
import regionJson from '@/static/geoJson/370900.json'

export default {
  data() {
    return {
      map: null,
	  regionLayer: null, 
      positionLayer: null,
	  _isReady: false,
	  _pendingAdcode: null,
      // 天地图的key
      TDTKey: "71873fdb35a512c0fa8edcc792ac8fc9",
      // 当前定位
      location: [],
      // 选中的企业位置
      firmLocation: [],
      // 路线的图层
       defaultView: {
            center: [117.04, 36.19],
            zoom: 8,
            rotation: 0
          }
    }
  },
  methods: {
	  
	  
	  
	  clearAllActive() {
	    if (!this.positionLayer || !this.map) return;
	    const src = this.positionLayer.getSource();
	    if (!src) return;
	    const z = this.map.getView().getZoom();
	    src.getFeatures().forEach(f => {
	      if (f.get('active')) f.set('active', false);
	      const s = this.getFeatureStyle(f, z);
	      if (s) f.setStyle(s);
	    });
	    this.refreshAllFeatureStyles?.();
	  },

	  
	  snapshotDefaultFromView() {
	    if (!this.map) return;
	    const v = this.map.getView();
	    this.defaultView = {
	      center: v.getCenter().slice(),
	      zoom:   v.getZoom(),
	      rotation: v.getRotation()
	    };
	  },
	  
	   onRegionAdcodeChange(adcode) {
	      if (!adcode) return
	      if (!this._isReady || !this.map) {
	        this._pendingAdcode = String(adcode)
	        return
	      }
	      this.showRegionBySaasdm({ adcode: String(adcode) })
	    },
	  
	    showRegionBySaasdm(payload) {
	      if (!this._isReady || !this.map) {
	        this._pendingAdcode = String(payload?.adcode || '')
	        return
	      }
	      const adcode = String(payload?.adcode || '').trim()
	      if (!adcode) return
	      console.log('[region] showRegionBySaasdm', adcode)
	  
	      // 1) 用 GeoJSON 解析出所有要素（EPSG:4326 -> EPSG:4326）
	      const gj = new GeoJSON()
	      const all = gj.readFeatures(regionJson, {
	        dataProjection: 'EPSG:4326',
	        featureProjection: 'EPSG:4326'
	      })
	  
	      // 2) adcode 精确匹配
	      const feat = all.find(f => String(f.get('adcode')) === adcode)
	      if (!feat) {
	        console.warn('[region] feature not found for adcode:', adcode)
	        return
	      }
	  
	      // 3) 放入/更新高亮图层
	      if (!this.regionLayer) {
	        this.regionLayer = new VectorLayer({
	          source: new VectorSource({ features: [feat] }),
	          style: new Style({
	            stroke: new Stroke({ color: '#00ff00', width: 2.5 }),
	            fill: new Fill({ color: 'rgba(0, 255, 0, 0.2)' }),
	            
	          })
	        })
	        this.map.addLayer(this.regionLayer)
			this.regionLayer.setZIndex(999) 
	      } else {
	        const src = this.regionLayer.getSource()
	        src.clear()
	        src.addFeature(feat)
			 this.regionLayer.setStyle(new Style({
			   stroke: new Stroke({ color: '#00ff00', width: 2.5 }),
			   fill: new Fill({ color: 'rgba(0, 255, 0, 0.2)' }),
			   
			 }))
			 this.regionLayer.setZIndex(999)
	      }
	  
	      // 4) 缩放到该要素
	      const extent = feat.getGeometry().getExtent()
	      this.map.getView().fit(extent, {
	        padding: [60,60,60,60],
	        duration: 500,
	        maxZoom: 8        
	      })
	  
	      console.log('[region] ✅ zoom to', feat.get('name'))
		  this.map.getView().fit(extent, {
		    padding: [60,60,60,60],
		    duration: 500,
		    maxZoom: 8
		  });
		  
		  // 等动画结束回写基准（简单做法：延时执行）
		  setTimeout(() => this.snapshotDefaultFromView(), 520);
	    },
	  
	  //根据 zoom 计算图标缩放比例（可按需调参）
	  computeIconScale(zoom) {
	    // 以 9 级为基准 1.0，每放大一级 +0.12，限制在 0.6~2.0
	    const s = 1.0 + (zoom - 9) * 0.24;
	    return Math.max(0.6, Math.min(2.0, s));
	  },
	  
	  //两位字符串；同时支持从名称兜底
	  normalizeJcdx(code, name) {
	    let c = String(code ?? '').trim()
	    if (/^\d+$/.test(c)) c = c.padStart(2, '0')
	  
	    if (!['01','02','03'].includes(c)) {
	      const n = String(name || '').trim()
	      if (n.includes('区域')) c = '01'
	      else if (n.includes('水源地')) c = '03'
	      else if (n.includes('污染源')) c = '02'
	    }
	  
	    return c
	  },

	  
	    getJcdxIcons() {
	      return {
	        '01': { normal: './static/index/area.svg',      active: './static/index/area-active.svg' },
	        '03': { normal: './static/index/water.svg',     active: './static/index/water-active.svg' },
	        '02': { normal: './static/index/pollution.svg', active: './static/index/pollution-active.svg' },
	      }
	    },

	  
	  // 统一生成样式（根据 feature 是否激活 + 当前 zoom 选择图与缩放）
	getFeatureStyle(feature, zoom) {
	   const isActive = !!feature.get('active');
	   // 优先用 jcdx；没有就用名称兜底成代码
	   const code = this.normalizeJcdx(feature.get('jcdx'), feature.get('jcdxName'));
	   const icons = this.getJcdxIcons()[code];
	   if (!icons) return null;
	   const src = isActive ? icons.active : icons.normal;
	   return new Style({
	     image: new Icon({ anchor: [0.5, 1], src, scale: this.computeIconScale(zoom) * 1.2 }),
	   });
	 }
,


refreshAllFeatureStyles() {
  if (!this.positionLayer) return;
  const z = this.map.getView().getZoom();
  this.positionLayer.getSource().getFeatures().forEach(f => {
    const s = this.getFeatureStyle(f, z);
    if (s) f.setStyle(s);   // 记得判空
  });
},

	  
	  
	  
	  
    getLayerFromJson(path,name,filter = null) {
      const vectorSource = new VectorSource({
        url: path,
        format: new GeoJSON(),
      });

      if (filter) {
        const filterPro = filter.split("=")
        vectorSource.once("change", () => {
          if (vectorSource.getState() === "ready") {
            const filteredFeatures = vectorSource
              .getFeatures()
              .filter(
                (feature) =>
                  feature.getProperties()[filterPro[0]].indexOf(filterPro[1]) !==
                  -1,
              );
            vectorSource.clear();
            vectorSource.addFeatures(filteredFeatures);
          }
        });
      };

      vectorSource.forEachFeature((feature) => {
        feature.getGeometry().simplify(0.001);
      });

      return new VectorLayer({
        source: vectorSource,
        style: new Style({
          stroke: new Stroke({
            color: "rgba(0,0,0,0)",
            width: 1.5,
          }),
          fill: new Fill({
            color: "rgba(0,0,0,0)",
          }),
        }),
        properties: {
          name: name,
        },
      });
    },

    // 获取天地图
    getTDTLayer(key) {
      // 天地图影像
      const TDTUrl = `http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`;
      const TDTMarkUrl = `http://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`;

      // 天地图矢量
     const TDTVectorUrl = `http://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`;
     const TDTVectorMarkUrl = `http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`;

      const TDTSource = new XYZ({
        url: TDTUrl,
      });
      const TDTLayer = new TileLayer({
        source: TDTSource,
        title: "天地图影像",
        properties: {
          name: "天地图影像",
        },
        zIndex: 0,
      });
      const TDTMarkSource = new XYZ({
        url: TDTMarkUrl,
      });

      const TDTMarkLayer = new TileLayer({
        source: TDTMarkSource,
        title: "天地图影像注记",
        properties: {
          name: "天地图影像注记",
        },
        zIndex: 1,
      });

      const TDTVectorSource = new XYZ({
        url: TDTVectorUrl,
      });
      const TDTVectorLayer = new TileLayer({
        source: TDTVectorSource,
        title: "天地图矢量",
        properties: {
          name: "天地图矢量",
        },
        zIndex: 0,
      });
      const TDTVectorMarkSource = new XYZ({
        url: TDTVectorMarkUrl,
      });

      const TDTVectorMarkLayer = new TileLayer({
        source: TDTVectorMarkSource,
        title: "天地图矢量标注",
        properties: {
          name: "天地图矢量标注",
        },
        zIndex: 1,
      });

      return {
        TDTLayer,
        TDTMarkLayer,
        TDTVectorLayer,
        TDTVectorMarkLayer
      };
    },

    initMap(mapView) {
      const baseLayer = this.getLayerFromJson(
        "./static/geoJson/370900.json",
        "边界图"
      );
      const { TDTLayer, TDTMarkLayer, TDTVectorLayer, TDTVectorMarkLayer } = this.getTDTLayer(this.TDTKey);
      if (!this.map) {
        this.map = new Map({
          target: "map",
          layers: [TDTLayer, TDTMarkLayer, baseLayer],
          view: new View({
            projection: "EPSG:4326",
            center: this.defaultView.center.slice(),
			rotation: this.defaultView.rotation,
            zoom: this.defaultView.zoom, 
            minZoom: 1,
            maxZoom: 18,
          }),
          // 删除默认控制器
          controls: [],
        });
      } else {
        if (mapView.layers.includes("矢量图") && this.map.getLayers().getArray().findIndex(layer => layer.get("name") === "天地图影像") !== -1) {
          // this.map.removeLayer(TDTLayer);
          // this.map.removeLayer(TDTMarkLayer);
          // this.map.addLayer(TDTVectorLayer);
          // this.map.addLayer(TDTVectorMarkLayer);
          this.map.getLayers().setAt(0, TDTVectorLayer);
          this.map.getLayers().setAt(1, TDTVectorMarkLayer);
        }
        if (mapView.layers.includes("影像图") && this.map.getLayers().getArray().findIndex(layer => layer.get("name") === "天地图矢量") !== -1) {
          // this.map.removeLayer(TDTVectorLayer);
          // this.map.removeLayer(TDTVectorMarkLayer);
          // this.map.addLayer(TDTLayer);
          // this.map.addLayer(TDTMarkLayer);
          this.map.getLayers().setAt(0, TDTLayer);
          this.map.getLayers().setAt(1, TDTMarkLayer);
        }
      }
	  if (!this._bindZoomListener) {
	    this._bindZoomListener = true;
	    this.map.getView().on('change:resolution', () => {
	      if (!this.positionLayer) return;
	      const z = this.map.getView().getZoom();
	      this.positionLayer.getSource().getFeatures().forEach(f => {
	        const s = this.getFeatureStyle(f, z);
	        if (s) f.setStyle(s);   // 判空，避免清掉样式
	      });
	    });
	  }
	  this._isReady = true
	  
	  // 有排队的 adcode 就补做
	  if (this._pendingAdcode) {
	    const ad = this._pendingAdcode
	    this._pendingAdcode = null
	    this.showRegionBySaasdm({ adcode: ad })
	  }
	  
	  // 通知主线程 onMapReady
	  try { this.$ownerInstance?.callMethod?.('onMapReady') } catch(e) {}
	  



    },
	

    // 导航
    async handleLead(leadIndex) {
		if (leadIndex == null) {
		   console.warn('[map] handleLead 参数为空，已忽略');
		  return;
		 }
		 console.log(" handleLead 被触发:", leadIndex);
		  console.log(" 当前目标井位置 firmLocation =", toRaw(this.firmLocation));
		  console.log("当前定位:", toRaw(this.location));

      if (this.firmLocation.length === 0) return;
     if (this.location.length === 0) {
       this.handleMapLocation({ isLocation: true }, false);
       const checkReady = setInterval(() => {
         if (this.location.length > 0) {
           clearInterval(checkReady);
           console.log(" 当前定位:", this.location);
           this.drawRoute(this.location, this.firmLocation);
         }
       }, 300);
     } else {
       this.drawRoute(this.location, this.firmLocation);
     }

      // this.drawRoute([117.04, 36.19], [117.08644, 36.051265]);
    },

// 使用 OSRM 获取路线
async getRoute(start, end) {
  const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data?.routes?.length) {
      const coords = data.routes[0].geometry.coordinates; // [[lng, lat], ...]
      return coords;
    } else {
      throw new Error('无路线结果');
    }
  } catch (err) {
    console.warn('OSRM 路线获取失败:', err);
    return [start, end]; // fallback
  }
}

,


    // 绘制路线
   async drawRoute(start, end) {
     let routeCoordinates = [];
   
     try {
       routeCoordinates = await this.getRoute(start, end, this.TDTKey);
       if (!routeCoordinates || routeCoordinates.length === 0) {
         throw new Error("路线为空");
       }
     } catch (e) {
       console.warn("路线接口失败，绘制直线 fallback");
       routeCoordinates = [start, end]; // fallback：画直线
     }
   
     // 清除旧路线
     if (this.routeLayer) {
       this.map.removeLayer(this.routeLayer);
     }
   
     // 创建路线要素
     const routeFeature = new Feature({
       geometry: new LineString(routeCoordinates),
       name: "路线",
     });
   
     routeFeature.setStyle(new Style({
       stroke: new Stroke({
         color: "#ff0000",
         width: 3,
       }),
     }));
   
     const routeSource = new VectorSource({
       features: [routeFeature],
     });
   
     this.routeLayer = new VectorLayer({
       source: routeSource,
     });
   
     this.map.addLayer(this.routeLayer);
   
     // 缩放地图以适应路线
     const routeExtent = routeFeature.getGeometry().getExtent();
     this.map.getView().fit(routeExtent, {
       padding: [50, 50, 50, 50],
       projection: "EPSG:4326",
     });
   },


    // 判断坐标点是否存在Feature,如果存在则移除它
    // 只移除临时/定位点，保留原始井要素
    removeTempFeatureAtCoordinate(vectorLayer, targetCoordinate) {
      const features = vectorLayer.getSource().getFeatures();
      features.forEach(feature => {
        if (feature.getGeometry().getType() !== "Point") return;
        const [x, y] = feature.getGeometry().getCoordinates();
        const isSame = x === targetCoordinate[0] && y === targetCoordinate[1];
        if (isSame && (feature.get('isTemp') === true || feature.get('name') === '定位')) {
          vectorLayer.getSource().removeFeature(feature);
        }
      });
    },
	
	findExistingFeature({ id, coord, tolerance = 1e-6 }) {
	  if (!this.positionLayer) return null;
	  const feats = this.positionLayer.getSource().getFeatures();
	
	  // ① 优先用 id 精确匹配
	  if (id != null) {
	    const f = feats.find(ft => String(ft.get('unitId')) === String(id));
	    if (f) return f;
	  }
	
	  // ② 退化到按坐标匹配（加个很小的容差）
	  if (coord && Array.isArray(coord)) {
	    const [tx, ty] = coord;
	    return feats.find(ft => {
	      const g = ft.getGeometry();
	      if (!g || g.getType() !== 'Point') return false;
	      const [x, y] = g.getCoordinates();
	      return Math.abs(x - tx) <= tolerance && Math.abs(y - ty) <= tolerance;
	    });
	  }
	
	  return null;
	},


    // 定位
    async handleMapLocation(positionIndex, fly=true) {
		if (!positionIndex || typeof positionIndex !== 'object') {
		  console.warn('[map] handleMapLocation 参数异常，已忽略：', positionIndex);
		   return;
		 }
      let coordinate;
      let srcUrl;
      if (positionIndex.isLocation) {
        if (!this.map || !this.positionLayer) return;
        if (!navigator.geolocation) return;
        await navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("定位成功", position);
            const { latitude, longitude } = position.coords;
            coordinate = [longitude, latitude];
            this.location = coordinate;
            srcUrl = "./static/index/self-position.svg";
            if(fly) this.flyToPosition(coordinate, srcUrl, "定位");
          },
          (error) => {
            console.log("定位失败", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      } else {
       coordinate = [parseFloat(positionIndex.chahba), parseFloat(positionIndex.chahbb)];
         this.firmLocation = coordinate;
          // 只移除临时/定位点（保留原始井）
          this.removeTempFeatureAtCoordinate(this.positionLayer, coordinate);
          // 直接找到已有井要素并高亮
          const feature = this.findExistingFeature({
           id: positionIndex.id, // 如果你从上层能传 id，优先用
            coord: coordinate
          });
          if (feature) {
            // 清其它高亮
            const src = this.positionLayer.getSource();
			if (!src) return;
            const feats = src.getFeatures();
            feats.forEach(f => f.set('active', false));
           // 当前设为高亮并按当前 zoom 重绘
            feature.set('active', true);
            const z = this.map.getView().getZoom();
            feats.forEach(f => {
              const s = this.getFeatureStyle(f, z);
             if (s) f.setStyle(s);
           });
           // 飞过去
            const center = feature.getGeometry().getCoordinates();
            if (fly) {
              this.map.getView().animate({
                center: coordinate,
           zoom: 15,
               duration: 1000,
              });
            }
          } else {
            // 找不到（极端情况），再退回“临时点”方案
            this.flyToPosition(coordinate, "./static/index/firm-activate.svg", positionIndex.name, positionIndex.jcdxName || '');
          }
      }
    },

    // 平移到固定点位
   // flyToPosition 内
   flyToPosition(coordinate, srcUrl, name, jcdxNameOrCode = '') {
     this.map.getView().animate({ center: [coordinate[0], coordinate[1] - 0.005], zoom: 15, duration: 1000 });
     const jcdxCode = this.normalizeJcdx(jcdxNameOrCode, jcdxNameOrCode)
     const feature = new Feature({
       geometry: new Point(coordinate),
       name,
       jcdxName: jcdxNameOrCode,    
	   jcdx: jcdxCode, 
       active: name !== '定位',  
       isTemp: true,  
     });
   
     const z = this.map.getView().getZoom();
       if (name === '定位') {
          // ✅ 定位点专用样式，不走三类判断
         feature.setStyle(new Style({
            image: new Icon({ anchor: [0.5, 1], src: './static/index/self-position.svg', scale: 1.2 })
          }));
        } else {
          const style = this.getFeatureStyle(feature, z);
          if (style) feature.setStyle(style);  
       }
     this.positionLayer.getSource().addFeature(feature);
   },

    // 复位按钮
    // handleResetPosition 内
   // renderjs -> methods
 handleResetPosition() {
   if (!this.map || !this.positionLayer) return;
   const view = this.map.getView();
 
   this.clearAllActive(); // 先清一次，避免回调被打断时清理不到位
 
   view.animate({
     center: this.defaultView.center.slice(),
     zoom:   this.defaultView.zoom,
     rotation: this.defaultView.rotation || 0,
     duration: 400
   }, () => {
     // 动画结束再清一遍（幂等），确保样式完全复原
     this.clearAllActive();
   });
 },

    // 增添点位
    handleAddPosition(keyUnitList) {
      // 新建一个图层，而不是在positionLayer上，然后让点位加进去
      const vectorSource = new VectorSource();
	  const z = this.map.getView().getZoom();
      keyUnitList.forEach((item) => {
          const feature = new Feature({
            geometry: new Point([Number(item.chahba), Number(item.chahbb)]),
            name: item.unitName,
            unitId: item.id,
			jcdxName: item.jcdxName || '',
			jcdx: this.normalizeJcdx(item.jcdx, item.jcdxName),
            active: false, // 初始不高亮
          });
          feature.setStyle(this.getFeatureStyle(feature, z));
          vectorSource.addFeature(feature);
        });

      this.positionLayer = new VectorLayer({
        source: vectorSource,
      })
      this.map.addLayer(this.positionLayer)
      // 地图中心飞过去
      // this.map.getView().fit(vectorSource.getExtent())

      // 绑定点击事件
        this.map.on('click', (evt) => {
          this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
            if (layer !== this.positionLayer) return;               // 只处理点图层
            if (feature.get('name') === '定位') return;             // 排除“我的定位点”
        
            // 1) 确保 jcdxName 存在（没有就从属性或缓存补齐）
            let jcdxName = feature.get('jcdxName');
            if (!jcdxName) {
              // 从已有属性尝试兜一下（你在 handleAddPosition 里应已写入）
              jcdxName = feature.get('type') || '';
              if (jcdxName) feature.set('jcdxName', jcdxName);
            }
			if (!feature.get('jcdx')) {
			    feature.set('jcdx', this.normalizeJcdx(feature.get('jcdx'), feature.get('jcdxName')))
			 }
        
            // 2) 先把其他点的 active 清掉，并刷新样式
            const src = this.positionLayer.getSource();
			if (!src) return;
            const feats = src.getFeatures();
            feats.forEach(f => f.set('active', false));
        
            // 可选：把临时点（isTemp）清掉，避免叠加
            feats.filter(f => f.get('isTemp') === true).forEach(f => src.removeFeature(f));
        
            // 3) 当前点设为激活，并按当前 zoom 重绘所有点（确保换到 -active 图）
            feature.set('active', true);
            const z = this.map.getView().getZoom();
            feats.forEach(f => f.setStyle(this.getFeatureStyle(f, z)));
        
            // 4) 飞到该点
            const center = feature.getGeometry().getCoordinates();
            this.map.getView().animate({
              center: [center[0], center[1] - 0.005],
              zoom: 15,
              duration: 1000,
            });
            this.firmLocation = center;
        
            // 5) 最后再回调前端（带 id 的搜索）
            const name = feature.get('name');
            const id = feature.get('unitId');
			console.log(`[MAP CLICK] 命中井要素 => id=${id} name=${name}`);
            this.$ownerInstance.callMethod('handleSearch', { name, isClick: true, id });

          });
        });

      }
	
	
	
  },
  
}
</script>

<template>
  <view class="container">
    <view
      id="map"
	  ref="mapRef"
      :mapView="mapView"
      :change:mapView="olmap.initMap"
      :positionIndex="positionIndex"
      :change:positionIndex="olmap.handleMapLocation"
      :keyUnitList="keyUnitList"
      :change:keyUnitList="olmap.handleAddPosition"
      :leadIndex="leadIndex"
      :change:leadIndex="olmap.handleLead"
      :resetPosition="resetPosition"
      :change:resetPosition="olmap.handleResetPosition"
	  :regionAdcode="regionAdcode" 
	  :change:regionAdcode="olmap.onRegionAdcodeChange"
	  :clearActiveTick="clearActiveTick"
	  :change:clearActiveTick="olmap.clearAllActive"
	  
    >
	</view>
    <view class="header">
      <HeaderSearch
        ref="headerSearchRef"
        style="display: flex; align-items: flex-end; padding-bottom: 18rpx"
        :placeholder="'请输入关键字查询'"
		v-model="keyword"
		v-model:input="keyword"
		:value="keyword"
		  @update:modelValue="handleSearchInput"
		  @update:input="handleSearchInput"
		  @input="handleSearchInput"
		  @change="handleSearchInput"
		  @confirm="handleSearchInput"
        :focus-function="focusOrBlurFunction"
        @search="handleSearch"
      />
    </view>
	<!--    添加监测井-->
	<image
	  class="add-well-icon"
	  src="/static/index/add.svg"
	  @click="goAddWell"
	></image>
    <!--    切换图层-->
    <image
      class="layers-change"
      src="/static/index/layers.svg"
      @click="handleClickChangeMap"
    ></image>
    <!--    切换图层的容器-->
    <!--    定位-->
    <image
      class="location"
      src="/static/index/location.svg"
      @click="handleLocation"
    ></image>
    <!--    复位-->
    <image
      class="reset-btn"
      src="/static/index/reset-position.svg"
      @click="handleClickReset"
    ></image>
    <view v-show="showChangeMap" class="layers">
      <view
        v-for="item in layerList"
        :key="item.id"
        class="layers-item"
        @click="handleChangeMap(item)"
      >
        <image class="layer-img" :src="item.imgSrc"></image>
        <view class="layer-label">{{ item.name }}</view>
      </view>
    </view>
    <!--    搜索历史记录-->
   <view class="search-history" :class="{ 'slide-in': showHistory, 'slide-out': !showHistory }">
     <view class="history-header">
       <view class="history-header-left">{{ keyword ? '相关结果' : '历史记录' }}</view>
       <view class="history-header-right" v-if="!keyword">
         <view @click="cleanHistory">清空</view><view>|</view><view @click="manageHistory">管理</view>
       </view>
     </view>
   
     <view class="history-content">
       <!-- 联想列表（按 pkiaa 模糊） -->
       <!-- 联想列表（主：pkiaa+标签；副：wryName） -->
       <template v-if="keyword">
         <view
           class="history-item card"
           v-for="it in pkiaaSuggest"
           :key="it.pkiaa"
           @click="onPickSuggest(it)"
         >
           <view class="item">
             <!-- 左侧图标 -->
             <image class="item-icon" src="/static/index/position-icon.svg" />
       
             <!-- 中间内容 -->
             <view class="item-mid">
               <!-- 主标题：pkiaa + 标签 -->
               <view class="title">
                 <text class="id">{{ it.pkiaa }}</text>
                 <text class="tag">监测井</text>
               </view>
               <!-- 副标题：wryName（缺省用 wellName） -->
               <view class="sub one-line">{{ it.wryName || it.wellName || '-' }}</view>
             </view>
       
             <!-- 右侧箭头 -->
             <image class="item-arrow" src="/static/index/leading-default.svg" />
           </view>
         </view>
       
         <view v-if="!pkiaaSuggest.length" class="empty">未找到相关结果</view>
       </template>

   
       <!-- 历史列表 -->
       <template v-else>
         <view class="history-item" v-for="item in historyList" :key="item.id" @click="onClickHistory(item.name)">
           <view class="item">
             <image class="item-icon" src="/static/index/position-icon.svg"></image>
             <view class="item-right">
               <view style="display:flex;align-items:center">
                 {{ item.name }} <view class="item-always" v-if="item.isAlways">常搜</view>
               </view>
               <view><image class="item-icon" src="/static/index/leading-default.svg"></image></view>
             </view>
           </view>
         </view>
       </template>
     </view>
   </view>
    <!-- 底部弹框 -->
<BottomSheet
  ref="sheetRef"
  @open="handleOpenSheet"
  @close="handleCloseSheet"
>
  <template #header>
    <view class="well-card-new">
      <view class="well-header-new">
        <view class="well-left">
          <view class="well-icon-wrapper">
            <image src="/static/index/diamond-icon.svg" class="diamond-icon" />
          </view>
          <text class="well-title-new">{{ firmData.name || '监测井' }}</text>
        </view>
        <text class="well-status-new">{{ firmData.status || '待采样' }}</text>
      </view>
	  <view style="display:flex; gap: 12rpx; align-items:center;">
	          <u-button
	            size="mini"
	            type="primary"
	            shape="circle"
	            @click="openWaterSheet"
	            text="采样记录"
	          />
	        </view>
      <view class="well-info-new">
        <view class="info-row">编号：{{ firmData.code }}</view>
        <view class="info-row">类型：{{ firmData.type }}</view>
		<view class="info-row">污染源名称：{{ firmData.wryName }}</view>
		<view class="info-row">区县: {{firmData.city}}</view>
        <view class="info-row">位置：{{ firmData.location }}</view>
      </view>
    </view>
  </template>
  
  

  <scroll-view class="scroll-content-new" :scroll-y="true">
	  
	  <view v-if="hasRecord">
		    <view class="task-card-new" v-for="(item, idx) in taskList" :key="item.stepName || idx">
      <view class="task-header-row">
        <view class="step-line">
          <view class="step-dot" :class="item.submitted ? 'dot-blue' : 'dot-red'"></view>
        </view>
        <view class="task-main">
          <view class="task-title-row">
            <text class="step-name">{{ item.stepName }}</text>
           <!-- <view class="step-add-btn" @click="takePhotoForStep(item.stepName)">
              <u-icon name="plus" size="18" color="#999" />
            </view> -->
          </view>
          <view class="task-status-row">
            <text class="step-status" :class="item.submitted ? 'submitted' : 'wait'">
              {{ item.submitted ? '已提交 ' + formatTime(item.shootTime) : '待提交' }}
            </text>
          </view>

          <!-- 图片 -->
          <view v-if="item.imagePath && item.imagePath.length" class="photo-list">
            <view
              class="photo-item"
              v-for="(img, index) in item.imagePath"
              :key="index"
              @click="previewImage(item.imagePath, index)"
            >
			 <image :src="img" mode="aspectFill" class="photo-thumb" />
			 <view class="photo-info">
              <view class="photo-name">{{ extractFilename(img) }}</view>
              <view class="photo-size"></view>
			  </view>
            </view>
          </view>
      </view>
    </view>
	 </view>
	</view>
  </scroll-view>

</BottomSheet>

<!-- ✅ 新增：水质监测二级弹窗 -->
<BottomSheet
  ref="waterSheetRef"
  @close="handleWaterClosed"
>
  <!-- 头部 -->
  <template #header>
    <view class="sheet-header">
      <view class="sheet-header__left">
        <image src="/static/index/diamond-icon.svg" class="diamond-icon" />
        <text class="sheet-title">采样记录（{{ waterList.length }}）</text>
      </view>
      <u-button 
        size="mini" 
        shape="circle" 
        text="返回" 
        @click="closeWaterSheet" 
        style="width: 60rpx; height: 60rpx; font-size: 24rpx;"
      />
    </view>
  </template>

  <!-- 内容 -->
  <scroll-view class="sheet-body" :scroll-y="true">
    <view v-if="waterLoading" class="state">加载中...</view>
    <view v-else-if="waterError" class="state state--err">{{ waterError }}</view>
    <view v-else-if="!waterList.length" class="state">暂无监测记录</view>

    <view v-else>
      <view
        v-for="row in waterList"
        :key="row.gid || row.id"
        class="card"
      >
        <!-- 监测井 -->
        <view class="row">
          <text class="label">监测井</text>
          <text class="value">
            {{ row.jcjCode || firmData.code || '-' }}
          </text>
        </view>

        <!-- 采样时间 -->
        <view class="row">
          <text class="label">采样时间</text>
          <text class="value">{{ row.cysj }}</text>
        </view>

        <!-- 采样编号 -->
        <view class="row">
          <text class="label">采样编号</text>
          <text class="value value--strong">{{ row.gceabb || '-' }}</text>
        </view>

        <!-- 水质类别 -->
        <view class="row">
          <text class="label">水质类别</text>
          <view class="value">
            <text v-if="row.szlb" class="pill pill--info">{{ mapSzlb(row.szlb) }}</text>
            <text v-else class="muted">-</text>
          </view>
        </view>

        <!-- 超标情况 -->
        <view class="row">
          <text class="label">超标情况</text>
          <view class="value">
            <text v-if="row.exceedThreshold" class="pill pill--warn">{{ row.exceedThreshold }}</text>
            <text v-else class="muted">—</text>
          </view>
        </view>
		
		<view class="card-actions" @click.stop>
		  <u-button size="small" shape="circle" type="primary" text="查看详情" @click="goDetailByRow(row)" />
		</view>

		
      </view>
    </view>
  </scroll-view>
</BottomSheet>




    <view v-if="showFixedBottom" class="footer" >
      <u-button
        class="btn quit-btn"
        shape="circle"
        @click="handleQuit"
        text="返回"
      ></u-button>
      <view
        style="display: flex; justify-content: flex-start; align-items: center"
      >
        <u-button
          class="btn law-btn"
          shape="circle"
          @click="handleGoSample"
		  text="采样"
        ></u-button>
        <u-button
          class="btn lead-btn"
          shape="circle"
          @click="handleLeading"
          text="导航"
        ></u-button>
      </view>
    </view>
  </view>
<CustomTabbar/>

<canvas
   canvas-id="watermarkCanvas"
   id="watermarkCanvas"
   :style="`width: ${canvasWidth}px; height: ${canvasHeight}px; position: absolute; left: -9999px;`"
   :width="canvasWidth"
   :height="canvasHeight"
 ></canvas>
  
</template>

<style scoped lang="scss">
@import "ol/ol.css";

.image-card {
  width: 220rpx;
  margin: 10rpx 0;
  border-radius: 12rpx;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}
.image-thumb {
  width: 100%;
  height: 180rpx;
  object-fit: cover;
}
.file-info {
  padding: 8rpx 12rpx;
  font-size: 24rpx;
  color: #555;
}
.file-name {
  display: block;
  word-break: break-all;
}
.file-size {
  font-size: 20rpx;
  color: #999;
}


.container {
  position: relative;
  background-color: #cccccc;

  #map {
    width: 100vw;
    height: 100vh;
  }

  .header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 11vh;
    z-index: 1;
    //background-color: #ffffff;
  }

  .layers-change {
    width: 110rpx;
    height: 110rpx;
    position: absolute;
    right: 10rpx;
    bottom: 370rpx;
  }

  .layers {
    position: absolute;
    right: 120rpx;
    bottom: 370rpx;
    display: flex;
    justify-content: space-around;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8rpx;
    .layers-item {
      width: 130rpx;
      height: 130rpx;
      //display: flex;
      //flex-direction: column;
      //align-items: center;
      //justify-content: center;
      font-size: 18rpx;
      position: relative;
      .layer-img {
        width: 110rpx;
        height: 110rpx;
        position: absolute;
        top: 10rpx;
        left: 50%;
        transform: translateX(-50%);
      }
      .layer-label {
        background: rgba(0, 0, 0, 0.5);
        height: 20rpx;
        width: 110rpx;
        position: absolute;
        bottom: 10rpx; /* 定位到父容器的底部 */
        left: 50%;
        transform: translateX(-50%); /* 水平居中 */
        text-align: center;
        line-height: 20rpx;
        color: white;
      }
    }
  }

  .reset-btn {
    width: 110rpx;
    height: 110rpx;
    position: absolute;
    right: 10rpx;
    bottom: 275rpx;
  }
  .add-well-icon {
    position: absolute;
    right: 10rpx;
    bottom: 465rpx;  /* 放在切换图层之上 */
    width: 110rpx;
    height: 110rpx;     
  }

  .location {
    width: 110rpx;
    height: 110rpx;
    position: absolute;
    right: 10rpx;
    bottom: 180rpx;
  }
  

  .search-history {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    height: 84vh;
    padding: 32rpx 20rpx 32rpx 22rpx;
    width: calc(100vw - 42rpx);
    z-index: 2;
    background-color: white;
    transform: translateY(100%);
    transition:
      transform 0.3s ease-in-out,
      opacity 0.3s ease-in-out;
    opacity: 0;

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 24rpx;
      color: #666666;

      .history-header-left {
        font-size: 28rpx;
        color: #000000;
      }

      .history-header-right {
        display: flex;

        view {
          margin-left: 18rpx;
        }
      }
    }

    .item { display: flex; align-items: center; gap: 16rpx; }
    .item-icon { width: 36rpx; height: 36rpx; }
    .item-mid { flex: 1; min-width: 0; }
    
    .title { display: flex; align-items: center; gap: 12rpx;
      font-size: 30rpx; font-weight: 600; opacity: .95; }
    .id { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace; }
    
    .tag, .item-always {
      font-size: 22rpx; padding: 2rpx 8rpx; border-radius: 8rpx;
      background: rgba(255,255,255,.06); border: 1rpx solid rgba(255,255,255,.08);
    }
    
    .sub { margin-top: 6rpx; font-size: 26rpx; opacity: .8; }
    .one-line { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    
    .item-arrow { width: 28rpx; height: 28rpx; opacity: .7; }
  }

  .slide-in {
    transform: translateY(0);
    opacity: 1;
  }

  .slide-out {
    transform: translateY(100%);
    opacity: 0;
  }

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

  .scroll-content {
	  
    //margin-top: 10rpx;
    .scroll-item {
      margin-bottom: 10rpx;
    }
  }

  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 7vh;
    width: 100vw;
    background-color: white;
    z-index: 9999;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .btn {
      width: 25vw;
      margin: 0 20rpx 0 0;
      font-size: 28rpx;
    }

    .law-btn {
      background-color: #00aaff;
      color: white;
    }

    .lead-btn {
      color: #00aaff;
    }

    .quit-btn {
      margin-left: 20rpx;
      //background-color: #831010;
      color: #831010;
      border-color: #ce3c39;
    }
	
  }
  
  .well-card {
    background: #fff;
    padding: 20rpx;
    margin: 20rpx;
    border-radius: 12rpx;
    box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
  }
  .title {
    font-weight: bold;
    font-size: 32rpx;
    margin-bottom: 10rpx;
    display: flex;
    justify-content: space-between;
  }
  .status-tag {
    padding: 4rpx 10rpx;
    border-radius: 10rpx;
    font-size: 26rpx;
    font-weight: bold;
  }
  .green-text {
    color: #00b050;
  }
  .blue-text {
    color: #007aff;
  }
  .gray-text {
    color: #999;
  }
  .task-card {
    background-color: #fff;
    margin: 10px;
    padding: 10px;
    border-radius: 8px;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .preview-img {
    width: 100%;
    height: 180rpx;
    border-radius: 6px;
  }
  .submitted {
    color: green;
  }
  .pending {
    color: gray;
  }
  .shoot-time {
    font-size: 24rpx;
    color: #999;
    margin-top: 5px;
  }
  
  .image-card {
  width: 220rpx;
  margin: 10rpx 0;
  border-radius: 12rpx;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}
.image-thumb {
  width: 100%;
  height: 180rpx;
  object-fit: cover;
}
.file-info {
  padding: 8rpx 12rpx;
  font-size: 24rpx;
  color: #555;
}
.file-name {
  display: block;
  word-break: break-all;
}
.file-size {
  font-size: 20rpx;
  color: #999;
}

.image-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.image-row {
  display: flex;
  align-items: center;
  padding: 10rpx;
  border-radius: 12rpx;
  border: 1px solid #eee;
  background-color: #fff;
  margin-top: 10rpx;
}

.image-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  object-fit: cover;
}

.image-right {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 20rpx;
}

.filename {
  font-size: 26rpx;
  color: #333;
  word-break: break-all;
  flex: 1;
}

.delete-btn {
  color: #ff4d4f;
  font-size: 24rpx;
  padding: 6rpx 12rpx;
  border-radius: 8rpx;
  background: rgba(255, 77, 79, 0.1);
}

.upload-row {
  border-style: dashed;
  border-color: #ccc;
  justify-content: flex-start;
}

.upload-icon {
  width: 120rpx;
  height: 120rpx;
  background: #f2f2f2;
  color: #999;
  font-size: 60rpx;
  text-align: center;
  line-height: 120rpx;
  border-radius: 8rpx;
}
.upload-text {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #999;
}

.well-card-new {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx 0 rgba(0, 0, 0, 0.08);
  margin: 0 0 24rpx 0;
  padding: 32rpx 28rpx;

  .well-header-new {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24rpx;

    .well-left {
      display: flex;
      align-items: center;

      .well-icon-wrapper {
        width: 56rpx;
        height: 56rpx;
        background: #2979ff;
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16rpx;
        transform: rotate(45deg);

        .diamond-icon {
          width: 28rpx;
          height: 28rpx;
          transform: rotate(-45deg);
        }
      }

      .well-title-new {
        font-weight: bold;
        font-size: 36rpx;
        color: #333;
      }
    }

    .well-status-new {
      color: #19be6b;
      font-size: 28rpx;
      font-weight: 500;
      background: #f0f9ff;
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
    }
  }

  .well-info-new {
    .info-row {
      font-size: 28rpx;
      color: #666;
      line-height: 48rpx;
    }
  }
}

.scroll-content-new {
    padding: 0 24rpx 80rpx 15rpx;
    min-height: 100vh; /* 或 120vh、150vh 来加长滚动内容 */
}

.task-card-new {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.04);
  padding: 24rpx;
  margin: 0rpx 12rpx 20rpx 1rpx;
}

.task-header-row {
  display: flex;
  align-items: flex-start;
}

.step-line {
    width: 28rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 12rpx;

  .step-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    margin-bottom: 8rpx;
  }

  .dot-blue {
    background-color: #2979ff;
  }

  .dot-red {
    background-color: #ed4014;
  }
}

.task-main {
  flex: 1;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .step-name {
    font-size: 30rpx;
    font-weight: bold;
    color: #333;
  }

  .step-add-btn {
    width: 44rpx;
    height: 44rpx;
    border-radius: 8rpx;
    border: 1rpx solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.task-status-row {
  margin: 8rpx 0;

  .step-status {
    font-size: 26rpx;
  }

  .submitted {
    color: #2979ff;
  }

  .wait {
    color: #c0c4cc;
  }
}

.photo-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  
  .photo-thumb {
    width: 48rpx;
    height: 48rpx;
    border-radius: 8rpx;
    margin-right: 14rpx;
  }


.photo-item {
  background: #f5f6fa;
  border-radius: 12rpx;
  overflow: hidden;
  padding: 20rpx;
  margin-bottom: 12rpx;
  display: flex;
  align-items: center;
  position: relative;

  .photo-thumb {
    width: 48rpx;
    height: 48rpx;
    border-radius: 8rpx;
    object-fit: cover;
    margin-right: 14rpx;
  }

  .photo-info {
    flex: 1;
    display: flex;
    flex-direction: column;
	 min-width: 0;

    .photo-name {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
	  text-overflow: ellipsis;
    }

    .photo-size {
      font-size: 24rpx;
      color: #999;
      margin-top: 6rpx;
    }
  }
}

}

}
.disabled-btn { pointer-events: none; opacity: .5; }
.sheet-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20rpx 24rpx;
}
.sheet-header__left {
  display: flex; align-items: center; gap: 16rpx;
}
.diamond-icon {
  width: 32rpx; height: 32rpx;
}
.sheet-title {
  font-size: 30rpx; font-weight: 600; color: #303133;
}

.sheet-body {
  min-height: 40vh; padding: 16rpx 20rpx 24rpx;
}

/* 状态文案 */
.state {
  text-align: center; color: #909399; padding: 40rpx 0;
}
.state--err { color: #E54D42; }

/* 卡片样式 */
.card {
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.06);
  padding: 22rpx;
  margin-bottom: 16rpx;
}

/* 行：左标签右内容，对齐且可换行 */
.row {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 8rpx 0;
}

.label {
  width: 160rpx;
  flex-shrink: 0;
  color: #909399;
  font-size: 26rpx;
  line-height: 1.6;
}

.value {
  flex: 1;
  text-align: right;        /* 基础右对齐 */
  direction: rtl;           /* 让内容从右边开始往左排布 */
  unicode-bidi: plaintext;  /* 避免字符顺序错乱 */
  white-space: nowrap;      /* 强制单行 */
  color: #303133;
  font-size: 28rpx;
  line-height: 1.6;
  overflow: visible;        /* 不裁剪 */
}


/* 关键修改：让内容块内部左对齐 */
.value > span,
.value > text {
  display: inline-block;
  text-align: left;
  max-width: 100%;
}

.value--strong { font-weight: 600; }
.muted { color: #A8ABB2; }

/* 标签（pill） */
.pill {
  display: inline-block;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #f5f7fa;
  font-size: 24rpx;
  line-height: 1.4;
}
.pill--info { background: #EEF5FF; color: #2B6CB0; }
.pill--warn { background: #FDECEA; color: #E54D42; font-weight: 600; }
.card-actions {
  margin-top: 12rpx;
  display: flex;
  gap: 12rpx;
}
.card-actions .u-button { flex: 1; }

</style>
