<script type="module">
import HeaderSearch from "@/components/HeaderSearch.vue";
import { ref, computed, onMounted , onUnmounted} from "vue";
import { onShow } from "@dcloudio/uni-app";
import BottomSheet from "@/components/BottomSheet.vue";
import FirmCard from "@/pages/task/components/FirmCard.vue";
import TaskCard from "@/pages/evaluate/components/TaskCard.vue";
import CustomTabbar from '@/components/CustomTabBar.vue';
import soilIcon from '@/static/index/icon_soil.png';
import waterIcon from '@/static/index/icon_water.png';
import doubleIcon from '@/static/index/icon_double.png';
import firmIcon from '@/static/index/firm.svg';
import firmActiveIcon from '@/static/index/firm-activate.svg';
import "@/utils/http";



export default {
  components: {
    TaskCard,
    FirmCard,
    BottomSheet,
    HeaderSearch,
	CustomTabbar,
  },
  mounted() {},
  setup(props, { emits, ctx }) {
    const mapView = ref({
      layers: [],
    });

const positionIndex = ref({
  index: 0,
  isLocation: true,
  chahba: null,
  chahbb: null,
  name: ''
});

const activeFirmId = ref(null)


    // 定位
    const handleLocation = () => {
      positionIndex.value.index = positionIndex.value.index + 1;
      positionIndex.value.isLocation = true;
    };

    // 搜索历史
    const phone = uni.getStorageSync('phone');
    const STORAGE_KEY = `searchHistory:${phone || 'guest'}`;
    
    const showHistory = ref(false);
    const historyList = ref([]); // 初始化为空，启动时从本地加载
	
	function loadHistory() {
	  try {
	    const raw = uni.getStorageSync(STORAGE_KEY);
	    const arr = raw ? JSON.parse(raw) : [];
	    historyList.value = Array.isArray(arr) ? arr : [];
	  } catch {
	    historyList.value = [];
	  }
	}
	
	function saveHistory() {
	  try {
	    uni.setStorageSync(STORAGE_KEY, JSON.stringify(historyList.value));
	  } catch {}
	}
	
	onMounted(loadHistory);
	onShow(loadHistory);
	
	function addSearchHistory(name, max = 30) {
	  const n = (name || '').trim();
	  if (!n) return;
	  const pinned = historyList.value.filter(i => i.isAlways);
	  const normal = historyList.value.filter(i => !i.isAlways && i.name !== n);
	  historyList.value = [...pinned, { id: Date.now().toString(), name: n }, ...normal].slice(0, max);
	  saveHistory();
	}
	
	
	
	// ====== 模糊联想与统一清空 ======
	const keyword = ref('')  // 与 HeaderSearch 输入保持同步
	const clearSelectionTick = ref(0) // 驱动renderjs清空选中/路线
	
	const matches = (item, q) => {
	  const s = q.trim().toLowerCase()
	  if (!s) return false
	  const fields = [item.unitName, item.unitCode, item.uscc]
	  return fields.some(v => v && String(v).toLowerCase().includes(s))
	}



	
	const suggestList = computed(() => {
	  const q = (keyword.value || '').trim()
	  if (!q) return keyUnitList.value.slice(0, 20) // 没输入时给默认前20条
	  return keyUnitList.value.filter(it => matches(it, q)).slice(0, 20)
	})
	
	// HeaderSearch 如果暂未对外抛出 @input，这个 300ms 兜底同步一下输入值
	let syncTimer
	onMounted(() => {
	  syncTimer = setInterval(() => {
	    keyword.value = headerSearchRef.value?.input || ''
	  }, 300)
	})
	onUnmounted(() => { if (syncTimer) clearInterval(syncTimer) })
	
	function clearFirmAndTasks() {
	  firmData.value = { id: '', name: '', type: '', address: '', phone: '', doLaw: false }
	  taskList.value = []
	  showFixedBottom.value = false
	}
	
	// 让 renderjs 清空激活点、路线
	function clearSelectionOnMap() {
	  clearSelectionTick.value++
	}






    // 清空搜索历史
    const cleanHistory = () => {
      uni.showModal({
        title: "提示",
        content: "是否确定清空搜索历史?",
        success: (res) => {
          if (res.confirm) {
            historyList.value = [];
            saveHistory();
            uni.showToast({ title: "已清空", icon: "none" });
          }
        },
      });
    };


    // 管理搜索历史
    const manageHistory = () => {
      uni.navigateTo({
        url: "/pages/index/components/HistoryManage",
      });
    };

    // 聚焦方法
    const focusOrBlurFunction = (show) => {
      showHistory.value = show;
      sheetRef.value.hideSheet();
    };

    // 底部sheet
    const sheetRef = ref(null);

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
	
	function onClickHistory(name) {
	  const q = (name || '').trim()
	  if (!q) return
	
	  // 先找精确命中
	  let selected = keyUnitList.value.find(it => it.unitName === q)
	
	  // 没找到再模糊；多条时取第一条（也可弹出选择框）
	  if (!selected) {
	    const fuzzies = keyUnitList.value.filter(it => matches(it, q))
	    if (fuzzies.length === 0) {
	      uni.showToast({ title: '未找到该记录', icon: 'none' })
	      return
	    }
	    selected = fuzzies[0]
	  }
	
	  // 用 isClick=true + id 调统一搜索逻辑
	  handleSearch(selected.unitName, true, selected.id)
	};


	
    const headerSearchRef = ref(null);

    // 搜索方法
   // 搜索方法
const handleSearch = (name, isClick = false, id = '') => {
  const q = (name ?? keyword.value ?? '').trim()
  const byId = id ? keyUnitList.value.find(it => it.id === id) : null
  const exact = (!byId && q) ? keyUnitList.value.find(it => it.unitName === q) : null
  const fuzzies = (!byId && !exact && q) ? keyUnitList.value.filter(it => matches(it, q)) : []

  let selected = byId || exact || null

  // 多条 → 展示联想列表，不弹窗，不保留旧卡片
  if (!selected && fuzzies.length > 1) {
    showHistory.value = true
    clearFirmAndTasks()
    sheetRef.value?.hideSheet()
    clearSelectionOnMap()
    return
  }
  // 唯一 → 直接用
  if (!selected && fuzzies.length === 1) selected = fuzzies[0]

  // 没命中 → 清空，不弹窗
  if (!selected) {
    clearFirmAndTasks()
    sheetRef.value?.hideSheet()
    clearSelectionOnMap()
	uni.showToast({ title: '未找到企业', icon: 'none' });
    return
  }

  // 命中 → 展卡片 + 地图联动
  headerSearchRef.value.input = selected.unitName
  handleOpenSheet()
  sheetRef.value.openSheet()

  const firmId = selected.id
  const firmType = selected.keyunitType || '03'

  firmData.value = {
    id: firmId,
    name: selected.unitName,
    type: selected?.type || '暂未标注行业信息',
    address: selected?.dwdz || '暂无地址',
    phone: selected?.contactphone || '暂无电话',
    doLaw: !!selected?.doLaw,
	  isWater: (selected.isWater !== undefined && selected.isWater !== null)
	    ? Boolean(selected.isWater)
	    : selected.keyunitType === '02',
	  isSoil: (selected.isSoil !== undefined && selected.isSoil !== null)
	    ? Boolean(selected.isSoil)
	    : selected.keyunitType === '01'

  }
  buttonText.value = !selected?.doLaw ? '开始执法' : '查看评价'
  addSearchHistory(selected.unitName)

  
    if (!isClick) {
      const lon = Number(selected.chahba);
      const lat = Number(selected.chahbb);
      if (isNaN(lon) || isNaN(lat)) {
        uni.showToast({ title: '该单位缺少坐标', icon: 'none' });
      } else {
        positionIndex.value = {
          index: Date.now(),
          isLocation: false,
          chahba: lon,
          chahbb: lat,
          name: selected.unitName
        };
      }
    }

  
  loadEvaluateTasks(firmId, firmType)
  activeFirmId.value = selected.id 
};




    // 点击的公司详情
 const firmData = ref({
   id: '',
   name: '',
   type: '',
   address: '',
   phone: '',
   doLaw: false,
   isWater: false,
     isSoil: false
 });
 
 const currentIndex = ref(0);
 const isRefreshing = ref(false);
 
 const dataList = ref([
   { title: "全部", tasks: [] },
   { title: "已评估", tasks: [] },
   { title: "待评估", tasks: [] },
 ]);

 
 const taskList = ref([]);

// 获取企业执法情况
// 获取任务列表接口
const loadEvaluateTasks = async (firmId, unitType = "01") => {
  try {
    console.log("请求参数:", { firmId, unitType });

    const res = await uni.request({
      url: "api/UnitEvaluation/EvaluateTasks",
      method: "GET",
      data: { firmId, unitType },
      timeout: 10000,
      header: {
        Authorization: `Bearer ${uni.getStorageSync('token')}`
      }
    });

    console.log("接口完整返回:", res);

    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(res.data?.msg || "接口返回失败");
    }

    // 兼容不同返回结构
    const tasks = Array.isArray(res.data.response)
      ? res.data.response
      : (res.data.response?.Tasks || []);

    console.log("解析后的任务数据:", tasks);

    // 转换成前端模拟数据结构
    taskList.value = tasks.map((item) => ({
      id: item.Id,
      name: item.Name || "未命名任务",
      rate: item.Rate ?? 0,
      type: mapType(item.Id), // 类型映射
      time: item.EvaluateTime || "",
      doLaw: !!item.DoLaw,
      isVeto: !!item.IsVeto,
      allRate: item.AllRate ?? 0,
      Items: item.Items || []
    }));

    console.log("获取执法情况:", taskList.value);

  } catch (err) {
    console.error("获取执法情况失败:", err);
    
  }
};

// 类型映射表
const mapType = (id) => {
  const typeMap = {
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
  // 优先用点击点位时记录的坐标
  let lon = Number(positionIndex.value?.chahba || firmData.value?.chahba || firmData.value?.longitude);
  let lat = Number(positionIndex.value?.chahbb || firmData.value?.chahbb || firmData.value?.latitude);

  if (isNaN(lon) || isNaN(lat)) {
    uni.showToast({ title: '坐标缺失', icon: 'none' });
    return;
  }

  // 如果原始是 WGS84，可以先转成 GCJ-02
  const [gcjLon, gcjLat] = wgs84ToGcj02(lon, lat);

  chooseMapAndNavigate(gcjLon, gcjLat, firmData.value?.unitName || firmData.value?.name || '目标位置');
};

	
	
	// 重点单位列表（改为动态数据）
	const keyUnitList = ref([]);
	
	// 页面加载时请求数据
	  onMounted(() => {
	      loadKeyUnits();
	    });

    // 请求重点单位列表
const loadKeyUnits = () => {
  uni.request({
    url: 'api/UnitEvaluation/GetAllKeyUnitsMap',
    method: 'GET',
    header: {
      Authorization: `Bearer ${uni.getStorageSync('token')}`
    },
    success: (res) => {
      if (res.statusCode === 200 && res.data.success) {
        keyUnitList.value = (res.data.response || []).map(item => {
          let iconPath = '/static/index/firm.svg'; // 默认03
          if (item.keyunitType === "01") iconPath = '/static/task/soil.svg';
          else if (item.keyunitType === "02") iconPath = '/static/task/groundwater.svg';
          else if (item.keyunitType === "03") iconPath = '/static/index/firm.svg';

          return {
            id: item.id,
            gid: item.gid,
            unitName: item.unitName,
            unitCode: item.unitCode,
            uscc: item.uscc,
            keyunitType: item.keyunitType,
            isWater: item.isWater !== undefined && item.isWater !== null
                  ? Boolean(item.isWater)
                  : item.keyunitType === "02",
            isSoil: item.isSoil !== undefined && item.isSoil !== null
                  ? Boolean(item.isSoil)
                  : item.keyunitType === "01",
            saasdm: item.saasdm,
            dwdz: item.dwdz,
            chahba: item.chahba,
            chahbb: item.chahbb,
            environmentalcontact: item.environmentalcontact,
            contactphone: item.contactphone,
            industryclassification: item.industryclassification,
            characteristicPollutants: item.characteristicPollutants,
            doLaw: item.doLaw || false,
            iconSrc: iconPath
          };
        });
        console.log("地图落点数据:", keyUnitList.value);
      } else {
        uni.showToast({ title: res.data.msg || '获取重点单位失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error("获取重点单位失败:", err);
      uni.showToast({ title: '网络异常', icon: 'none' });
    }
  });
};



    // 复位功能
    const resetPosition = ref(0);
	
	

    const handleClickReset = () => {
      // 先清空当前查询/选中
      handleQuit()
      // 再触发 renderjs 的 fit-to-extent
      resetPosition.value = resetPosition.value + 1
    }

	
	

    // 退出sheet
   const handleQuit = () => {
     clearFirmAndTasks()
     clearSelectionOnMap()
     headerSearchRef.value && (headerSearchRef.value.input = '')
     keyword.value = ''
     showHistory.value = false
     handleCloseSheet()
     sheetRef.value?.hideSheet()
	 activeFirmId.value = null;
   }
;

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

    return {
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
      handleSearch,
      handleOpenSheet,
      handleCloseSheet,
      firmData,
      showFixedBottom,
      buttonText,
      handleLaw,
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
	  loadKeyUnits ,
	  loadEvaluateTasks,
	   taskList,
	   keyword,
	   suggestList,
	   clearSelectionTick,
	   activeFirmId, 
	   onClickHistory
	   
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
import Feature from 'ol/Feature';
import VectorLayer from "ol/layer/Vector";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { LineString, Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import polyline from '@/utils/polyline';
import { toRaw } from 'vue';
import { getCenter } from "ol/extent";   

export default {
  data() {
    return {
      map: null,
      positionLayer: null,
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
         },
		 homeView: null, 
    }
  },
  
  
  methods: {
	  
	  //根据 zoom 计算图标缩放比例（按需调整曲线和上下限）
	  computeIconScale(zoom) {
	    // 以 10 级 ≈ 0.6；18 级 ≈ 1.2；中间线性插值，限制 0.4~1.5
	    const s = 0.8 + (zoom - 8) * 0.5;
	    return Math.max(0.4, Math.min(1.5, s));
	  },
	  
	  //图标资源映射（普通/高亮）
	  getIconSrc(type, isActive) {
	    const iconMap = {
	      '01': './static/task/soil1.svg',          // 土壤
	      '02': './static/task/uwater.svg',   // 地下水
	      '03': './static/task/dou.svg',          // 双（默认）
	    };
	    const iconActiveMap = {
	      '01': './static/task/soil2.svg',
	      '02': './static/task/uwater2.svg',
	      '03': './static/task/dou2.svg',
	    };
	    const m1 = isActive ? iconActiveMap : iconMap;
	    return m1[type] || m1['03'];
	  },
	  
	  //返回某个 feature 在当前 zoom 下的样式
	  getFeatureStyle(feature, zoom) {
	    // “定位”点单独样式（如果你要固定蓝点，scale 也可用 computeIconScale）
	    if (feature.get('name') === '定位') {
	      return new Style({
	        image: new Icon({
	          anchor: [0.5, 1],
	          src: './static/index/self-position.svg',
	          scale: this.computeIconScale(zoom)
	        })
	      });
	    }
		
		
		  const isActive = !!feature.get('isActive');
		  const type = feature.get('type') || '03';
		  const src = this.getIconSrc(type, isActive);
		  const base = this.computeIconScale(zoom);
		  const scale = isActive ? base * 1.2 : base;
		  
		    return new Style({
		      image: new Icon({
		        anchor: [0.5, 1],
		        src,
		        scale
		      })
		    });
		  },
		  
		  //批量刷新整层所有图标样式（按当前 zoom）
		  updateAllIconStyles() {
		    if (!this.map || !this.positionLayer) return;
		    const z = this.map.getView().getZoom();
		    const features = this.positionLayer.getSource().getFeatures();
		    features.forEach(f => f.setStyle(this.getFeatureStyle(f, z)));
		  },
	  
	  
	  // 清空选中高亮与路线
	 clearSelection() {
	   if (this.positionLayer) {
	     const features = this.positionLayer.getSource().getFeatures()
	     features.forEach(f => {
	       if (f.get('name') !== '定位') f.set('isActive', false)
	     })
	     // ✅ 直接刷新样式
	     if (this._updateIcons) this._updateIcons()
	   }
	   this.firmLocation = []
	   if (this.routeLayer) {
	     this.map.removeLayer(this.routeLayer)
	     this.routeLayer = null
	   }
	   this.updateAllIconStyles && this.updateAllIconStyles();
	 },
	  
	  // 复位：缩放到“边界图”全范围，并清空选中/路线
	 // ✅ 更稳的复位：等待边界图就绪，再 fit；无数据则回默认视角
handleResetPosition() {
  if (!this.map) return;
  this.clearSelection && this.clearSelection();

  const view = this.map.getView();
  const home = this.homeView || this.defaultView; // 兜底

  view.cancelAnimations && view.cancelAnimations();
  view.animate({
    center: home.center,
    zoom: home.zoom,
    rotation: home.rotation,   // 回正北
    duration: 500
  });

  this.updateAllIconStyles && this.updateAllIconStyles();
}
,


handleActivateFirm(val) {
  if (!this.positionLayer || !val) return;
  const src = this.positionLayer.getSource();
  const features = src.getFeatures();

  // 全部取消激活
  features.forEach(f => {
    if (f.get('name') !== '定位') f.set('isActive', false);
  });

  // 高亮目标，并飞过去
  const target = features.find(f => f.get('unitId') === val);
  if (target) {
    target.set('isActive', true);

    const center = target.getGeometry().getCoordinates();
    this.firmLocation = center;
    this.map.getView().animate({
      center: [center[0], center[1] - 0.005],
      zoom: 15,
      duration: 800
    });
  }

  this.updateAllIconStyles && this.updateAllIconStyles();
},



getLayerFromJson(path, name, filter = null){
  const vectorSource = new VectorSource({
    url: path,
    format: new GeoJSON({
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:4326'
    })
  })

  if (filter) {
    const filterPro = filter.split('=')
    vectorSource.once('change', () => {
      if (vectorSource.getState() === 'ready') {
        const filteredFeatures = vectorSource
          .getFeatures()
          .filter((feature) =>
            feature.getProperties()[filterPro[0]].indexOf(filterPro[1]) !== -1
          )
        vectorSource.clear()
        vectorSource.addFeatures(filteredFeatures)
      }
    })
  }

  vectorSource.forEachFeature((feature) => {
    feature.getGeometry().simplify(0.001)
  })

  return new VectorLayer({
    source: vectorSource,
    style: new Style({
      stroke: new Stroke({
        color: '#3499ee',
        width: 2
      }),
      fill: new Fill({
        color: 'rgba(52, 153, 238, 0.1)'
      })
    }),
    properties: { name }
  })
}
,

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
            center: [117.04, 36.19],
			rotation: this.defaultView.rotation,
            zoom:   this.defaultView.zoom,
            minZoom: 1,
            maxZoom: 18,
          }),
          // 删除默认控制器
          controls: [],
        });
		 const v = this.map.getView();
		  this.homeView = {
		    center: v.getCenter().slice ? v.getCenter().slice() : v.getCenter(),
		    zoom: v.getZoom(),
		    rotation: v.getRotation()
		  };
		
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
	      this.updateAllIconStyles();
	    });
	  }
    },

    // 导航
    async handleLead(leadIndex) {
      console.log("handleLead 被触发:", leadIndex);
      console.log("当前目标企业位置 =", toRaw(this.firmLocation));
      console.log("当前定位:", toRaw(this.location));
    
      if (this.firmLocation.length === 0) {
        
        return;
      }
    
      // 确保定位
      if (this.location.length === 0) {
        this.handleMapLocation({ isLocation: true }, false);
        const checkReady = setInterval(() => {
          if (this.location.length > 0) {
            clearInterval(checkReady);
            this.drawRoute(this.location, this.firmLocation);
          }
        }, 300);
      } else {
        this.drawRoute(this.location, this.firmLocation);
      }
    },

    // 调用天地图路线规划服务
   async getRoute(start, end) {
     const url = `http://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
   
     try {
       const response = await fetch(url);
       const data = await response.json();
       return data;
     } catch (error) {
       console.error("获取路线失败:", error);
       return null;
     }
   },

    // 绘制路线
   drawRoute(start, end) {
  this.getRoute(start, end)
    .then(data => {
      if (!data || !data.routes || !data.routes[0]) {
        console.warn("未获取到路线");
        return;
      }

      const coordinates = data.routes[0].geometry.coordinates;

      // 删除旧路线
      if (this.routeLayer) {
        this.map.removeLayer(this.routeLayer);
      }

      // 创建新路线
      const lineFeature = new Feature({
        geometry: new LineString(coordinates),
      });

      this.routeLayer = new VectorLayer({
        source: new VectorSource({
          features: [lineFeature],
        }),
        style: new Style({
          stroke: new Stroke({
            color: '#FF0000',
            width: 4,
          }),
        }),
      });

      this.map.addLayer(this.routeLayer);

      // 缩放到路线范围
      this.map.getView().fit(lineFeature.getGeometry().getExtent(), {
        padding: [50, 50, 50, 50],
      });
    })
    .catch(err => console.error("获取路线失败:", err));
},


    // 判断坐标点是否存在Feature,如果存在则移除它
    removePointFeatureAtCoordinate(vectorLayer, targetCoordinate) {
      // 获取图层中所有的Feature
      const features = vectorLayer.getSource().getFeatures();

      // 遍历所有点Feature
      features.forEach(feature => {
        if (feature.getGeometry().getType() === "Point") {
          const pointCoordinate = feature.getGeometry().getCoordinates();
          if (pointCoordinate[0] === targetCoordinate[0] && pointCoordinate[1] === targetCoordinate[1]) {
            vectorLayer.getSource().removeFeature(feature);
          }
        }
      })
    },

    // 定位
    async handleMapLocation(positionIndex, fly = true) {
      let coordinate;
      let srcUrl;
    
      if (positionIndex.isLocation) {
        // 自己定位功能保留
        if (!this.map || !this.positionLayer) return;
        if (!navigator.geolocation) return;
        if (!positionIndex || typeof positionIndex !== 'object') return;
    
        await navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("定位成功", position);
            const { latitude, longitude } = position.coords;
            coordinate = [longitude, latitude];
            this.location = coordinate;
    
            // 使用蓝色定位图标
            srcUrl = "./static/index/self-position.svg";
            if (fly) this.flyToPosition(coordinate, srcUrl, "定位");
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
        // 点击企业，只平移，不添加新图标
        coordinate = [parseFloat(positionIndex.chahba), parseFloat(positionIndex.chahbb)];
        this.firmLocation = coordinate;
    
        if (fly) {
          this.map.getView().animate({
            center: [coordinate[0], coordinate[1] - 0.005],
            zoom: 15,
            duration: 1000,
          });
        }
      }
    },
    
    // 只在定位时添加蓝色图标
   flyToPosition(coordinate, srcUrl, name) {
     this.map.getView().animate({
       center: [coordinate[0], coordinate[1] - 0.005],
       zoom: 15,
       duration: 1000,
     });
   
     if (name === "定位") {
       // 清除之前同坐标的“定位”点（可保留你的 removePointFeatureAtCoordinate）
       this.removePointFeatureAtCoordinate(this.positionLayer, coordinate);
   
       const feature = new Feature({
         geometry: new Point(coordinate),
         name: name,
       });
   
       const z = this.map.getView().getZoom();
       feature.setStyle(this.getFeatureStyle(feature, z)); // ✅ 统一样式函数
       this.positionLayer.getSource().addFeature(feature);
     }
   },



    // 增添点位
handleAddPosition(keyUnitList) {
  const vectorSource = new VectorSource();
  const z = this.map.getView().getZoom();

  keyUnitList.forEach((item) => {
    const feature = new Feature({
      geometry: new Point([Number(item.chahba), Number(item.chahbb)]),
      name: item.unitName,
      unitId: item.id,
      type: item.keyunitType,     // 01/02/03
      isActive: false,            // 初始不高亮
    });
    feature.setStyle(this.getFeatureStyle(feature, z));
    vectorSource.addFeature(feature);
  });

  this.positionLayer = new VectorLayer({ source: vectorSource });
  this.map.addLayer(this.positionLayer);

  // 点击：只改 isActive，再统一刷新样式
  this.map.on("click", (evt) => {
    this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer !== this.positionLayer) return;
      if (feature.get("name") === "定位") return;

      const name = feature.get("name");
      const id = feature.get("unitId");
      this.$ownerInstance.callMethod("handleSearch", name, true, id);

      const features = this.positionLayer.getSource().getFeatures();
      features.forEach((it) => it.set('isActive', false));
      feature.set('isActive', true);

      this.updateAllIconStyles(); // ✅ 刷新全部，保证缩放/高亮一致

      const center = feature.getGeometry().getCoordinates();
      this.map.getView().animate({
        center: [center[0], center[1] - 0.005],
        zoom: 15,
        duration: 1000,
      });
      this.firmLocation = center;
    });
  });

  // 首次就按当前 zoom 刷一次
  this.updateAllIconStyles();
},




  }
}
</script>

<template>
  <view class="container">
    <view
      id="map"
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
      :clearSelection="clearSelectionTick"
      :change:clearSelection="olmap.clearSelection"
	   :activeFirmId="activeFirmId"
	   :change:activeFirmId="olmap.handleActivateFirm"
    ></view>

	
    <view class="header">
      <HeaderSearch
        ref="headerSearchRef"
        style="display: flex; align-items: flex-end; padding-bottom: 18rpx"
        :placeholder="'请输入关键字查询'"
        :focus-function="focusOrBlurFunction"
        @search="handleSearch"
      ></HeaderSearch>
    </view>
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
          <view @click="cleanHistory">清空</view>
          <view>|</view>
          <view @click="manageHistory">管理</view>
        </view>
      </view>
    
      <view class="history-content">
        <!-- 有关键字时显示联想结果 -->
        <template v-if="keyword">
          <view
            v-if="suggestList.length"
            class="history-item"
            v-for="it in suggestList"
            :key="it.id"
            @click="handleSearch(it.unitName, true, it.id)"
          >
            <view class="item">
              <image class="item-icon" src="/static/index/position-icon.svg"></image>
              <view class="item-right">
                <view style="display:flex;align-items:center">
                  {{ it.unitName }}
                  <view class="item-always" v-if="it.keyunitType==='03'">企业</view>
                  <view class="item-always" v-else>监测井</view>
                </view>
                <view>
                  <image class="item-icon" src="/static/index/leading-default.svg"></image>
                </view>
              </view>
            </view>
          </view>
          <view v-else style="padding:24rpx;color:#888;">未找到相关结果</view>
        </template>
    
        <!-- 没关键字时显示历史 -->
        <template v-else>
         <view class="history-item" v-for="item in historyList" :key="item.id" @click="onClickHistory(item.name)">
            <view class="item">
              <image class="item-icon" src="/static/index/position-icon.svg"></image>
              <view class="item-right">
                <view style="display:flex;align-items:center">
                  {{ item.name }}
                  <view class="item-always" v-if="item.isAlways">常搜</view>
                </view>
                <view><image class="item-icon" src="/static/index/leading-default.svg"></image></view>
              </view>
            </view>
          </view>
        </template>
      </view>
    </view>

    <!-- 底部弹框 -->
 <BottomSheet ref="sheetRef" @open="handleOpenSheet" @close="handleCloseSheet" >
	 <template #header> 
	 <FirmCard :data="firmData" :show-rate="false" :show-evaluate="false" ></FirmCard>
	  </template> <view class="law-condition-img"> 
	  <image class="law-img" src="/static/evaluate/law.svg">
		  
	  </image> 企业执法情况 </view> 
	  <scroll-view class="scroll-content" :scroll-y="true"> 
	  <view class="scroll-item" v-for="(item, index) in taskList" :key="item.id + '-' + index">
		  <TaskCard :data="item" :firm-id="firmData.id" :show-evaluate="false" ></TaskCard>
		   </view> 
		   </scroll-view>
			</BottomSheet>

    <view v-if="showFixedBottom" class="footer">
      <u-button
        class="btn quit-btn"
        shape="circle"
        @click="handleQuit"
        text="退出"
      ></u-button>
      <view
        style="display: flex; justify-content: flex-start; align-items: center"
      >
        <u-button
          class="btn law-btn"
          shape="circle"
          @click="handleLaw"
          :text="buttonText"
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
  <CustomTabbar />
</template>

<style scoped lang="scss">
@import "ol/ol.css";

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

  .location {
    width: 110rpx;
    height: 110rpx;
    position: absolute;
    right: 10rpx;
    bottom: 180rpx;
	  z-index: 3; 
	
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
	pointer-events: none; 

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

    .history-content {
      margin-top: 40rpx;

      .item {
        display: flex;
        align-items: center;
        padding-right: 20rpx;
        padding-bottom: 20rpx;
        padding-top: 20rpx;
        border-bottom: 1rpx solid #cccccc;

        .item-icon {
          width: 36rpx;
          height: 36rpx;
          margin-right: 10rpx;
        }

        .item-right {
          width: calc(100vw - 88rpx);
          display: flex;
          justify-content: space-between;
          align-items: center;

          .item-always {
            margin-left: 10rpx;
            font-size: 22rpx;
            color: #3479fa;
          }
        }
      }
    }
  }

  .slide-in {
    transform: translateY(0);
    opacity: 1;
	pointer-events: auto; 
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
      height: auto;
      max-height: 100%;
      overflow-y: auto;
	  padding-bottom: 350rpx;
	  
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
  
}
.sheet-header {
  position: relative;
}
.sheet-icons {
  position: absolute;
  top: 16rpx;      /* 视你的卡片内边距可微调 */
  right: 16rpx;
  display: flex;
  gap: 8rpx;
  align-items: center;
}
.sheet-icon {
  width: 36rpx;
  height: 36rpx;
}



</style>
