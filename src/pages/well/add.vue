<!-- pages/well/add.vue -->
<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { addMonitoringWell } from '@/api/well'
import type { AddWellPayload } from '@/types/well'

// —— 表单：包含全部字段 —— //
const form = reactive<AddWellPayload>({
  // ===== 必填（置顶） =====
  pkiaa: '',
  district: '',
  chahba: 0,
  chahbb: 0,

  // ===== 非必填（全部放在下面） =====
  ysbh: '',
  province: '',
  city: '',
  saasdm: '',
  wellName: '',
  longitude: '',
  latitude: '',
  xCoordinateCgcs2000: undefined,
  yCoordinateCgcs2000: undefined,
  zCoordinate: undefined,
  locationDescription: '',
  isNewWell: '',
  serialNumber: '',
  projectName: '',
  equipmentCode: '',
  watershed: '',
  waterPartition: '',
  levelSwdzCode: '',
  oneLevelSwdzCode: '',
  twoLevelSwdzCode: '',
  aquiferStratumCode: '',
  aquiferLithology: '',
  jcdx: '',
  isGjdxsjcgc: '',
  isGjkh: '',
  isCityKh: '',
  isRegionalMonitor: '',
  regionalMonitorType: '',
  isPollutionMonitor: '',
  sswryCode: '',
  wryName: '',
  pollutionMonitorType: '',
  isWaterSource: '',
  sssydCode: '',
  waterSourceName: '',
  waterSourceMonitorType: '',
  isPollutionDiffusion: '',
  isPollutionInternal: '',
  cjsj: '',
  initialWaterLevel: undefined,
  jswms: undefined,
  jkgc: undefined,
  jknj: undefined,
  cjsd: undefined,
  jgcz: '',
  mctj: '',
  hsjjlx: '',
  hasMultipleScreens: '',
  screenLength: undefined,
  screenTopDepth: undefined,
  screenBottomDepth: undefined,
  sealingMaterial: '',
  sealingStartDepth: undefined,
  sealingEndDepth: undefined,
  meetsStandards: '',
  boreholeLogDiagramFileData: '',
  boreholeLogDiagramFileName: '',
  managementUnit: '',
  jcjSsdw: '',
  currentCondition: '',
  wellNature: '',
  monitoringMethod: '',
  monitoringContent: '',
  monitoringType: '',
  currentDepth: undefined,
  isMaintained: '',
  maintenanceUnit: '',
  siltationStatus: '',
  isLongTerm: '',
  needSealing: '',
  isSealed: '',
  monitoringStartDate: '',
  monitoringEndDate: '',
  waterExtraction: '',
  monitoringFrequency: '',
  monitoringParameters: '',
  contactPerson: '',
  contactPhone: '',
  remark: ''
})

//必填校验
const errors = reactive<Record<string, string>>({
  pkiaa: '', district: '', saasdm: '',
  chahba: '', chahbb: '', longitude: '', latitude: ''
})

// 工具函数
const nonEmpty = (s: unknown) => String(s ?? '').trim().length > 0
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const validLon = (n: unknown) => isNum(n) && (n as number) >= -180 && (n as number) <= 180
const validLat = (n: unknown) => isNum(n) && (n as number) >= -90 && (n as number) <= 90
// DMS这里只要求“非空”，如果要严格到度分秒格式，再换更严格的正则
const validDms = (s: unknown) => nonEmpty(s)


// 单字段校验
function validateField(k: keyof typeof errors) {
  switch (k) {
    case 'pkiaa':     errors.pkiaa     = nonEmpty(form.pkiaa) ? '' : '请填写监测井编码'; break
    case 'district':  errors.district  = nonEmpty(form.district) ? '' : '请填写区县'; break
    case 'saasdm':    errors.saasdm    = nonEmpty(form.saasdm) ? '' : '请填写组织结构代码'; break
    case 'chahba':    errors.chahba    = validLon(form.chahba) ? '' : '请输入有效经度(-180~180)'; break
    case 'chahbb':    errors.chahbb    = validLat(form.chahbb) ? '' : '请输入有效纬度(-90~90)'; break
    case 'longitude': errors.longitude = validDms(form.longitude) ? '' : '请填写经度(DMS)'; break
    case 'latitude':  errors.latitude  = validDms(form.latitude) ? '' : '请填写纬度(DMS)'; break
  }
}

type DistrictOption = { label: string; value: string }

const districtOptions: DistrictOption[] = [
  { label: '泰山区',                 value: '370902' },
  { label: '新泰市',                 value: '370982' },
  { label: '肥城市',                 value: '370983' },
  { label: '宁阳县',                 value: '370921' },
  { label: '岱岳区',                 value: '370911' },
  { label: '东平县',                 value: '370923' },
  { label: '高新技术产业开发区',     value: '370991' },
]

// 根据 form.district(代码) 显示中文名
const selectedDistrictLabel = computed(() => {
  const opt = districtOptions.find(o => o.value === form.district)
  return opt ? opt.label : ''
})

// picker 选择事件：把代码写回表单 + 触发校验
function onDistrictChange(e: any) {
  const idx = Number(e?.detail?.value ?? -1)
  const opt = districtOptions[idx]
  if (!opt) return
  form.district = opt.value
  validateField('district')   // 你已有的单字段校验
}


// 全量校验
function validateAll() {
  (Object.keys(errors) as (keyof typeof errors)[]).forEach(validateField)
}

// 是否可提交（每次读取时都会跑一遍校验，保证禁用状态实时）
const canSubmit = computed(() => {
  validateAll()
  return Object.values(errors).every(v => !v)
})

const locLoading = reactive({ busy: false })
const moreOpen = ref(true) // 默认展开全部非必填区

// 选择定位坐标系（与你项目/后台保持一致）
const LOC_TYPE: 'wgs84' | 'gcj02' = 'wgs84'

// 十进制度 → DMS
function toDMS(v: number, isLon: boolean) {
  if (v == null || Number.isNaN(v)) return ''
  const abs = Math.abs(v)
  const d = Math.floor(abs)
  const mFloat = (abs - d) * 60
  const m = Math.floor(mFloat)
  const s = ((mFloat - m) * 60).toFixed(2)
  const hemi = isLon ? (v >= 0 ? 'E' : 'W') : (v >= 0 ? 'N' : 'S')
  return `${d}°${m}′${s}″${hemi}`
}

// 经/纬度变更时自动更新 DMS
watch(
  () => [form.chahba, form.chahbb],
  () => {
    const lon = Number(form.chahba)
    const lat = Number(form.chahbb)
    if (!Number.isNaN(lon)) form.longitude = toDMS(lon, true)
    if (!Number.isNaN(lat)) form.latitude  = toDMS(lat, false)
  },
  { immediate: true }
)

// 接收地图页传参
onLoad((q: any) => {
  const lon = Number(q?.lon)
  const lat = Number(q?.lat)
  if (!Number.isNaN(lon) && !Number.isNaN(lat)) {
    form.chahba = Number(lon.toFixed(6))
    form.chahbb = Number(lat.toFixed(6))
  }
 if (q?.district) {
   const raw = decodeURIComponent(String(q.district))
   const byCode  = districtOptions.find(o => o.value === raw)
   const byLabel = districtOptions.find(o => o.label === raw)
   form.district = (byCode?.value || byLabel?.value || '')
   validateField('district')
 }

})

// 一键获取当前位置
async function fillByCurrentLocation() {
  if (locLoading.busy) return
  locLoading.busy = true
  try {
    const pos: any = await new Promise((resolve, reject) => {
      uni.getLocation({
        type: LOC_TYPE,
        geocode: true,
        success: resolve,
        fail: reject
      })
    })
    let lon = Number(pos.longitude)
    let lat = Number(pos.latitude)
    if (Number.isNaN(lon) || Number.isNaN(lat)) throw new Error('定位数据异常')

    // 如需坐标系转换，可在此处理
    form.chahba = Number(lon.toFixed(6))
    form.chahbb = Number(lat.toFixed(6))

    const addr = pos.address || pos.addressComponent
    const districtGuess = addr?.district || addr?.city || addr?.province || ''
    if (!form.district && districtGuess) form.district = String(districtGuess)
  } catch (e: any) {
    console.error('[定位失败]', e)
    const msg = /auth|denied|permission/i.test(String(e?.errMsg || e?.message || ''))
      ? '定位权限未授权，请在系统设置中开启定位权限'
      : '获取定位失败，请稍后重试'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    locLoading.busy = false
  }
}

// 选择柱状图 → 转 base64
async function pickBoreholeLog() {
  try {
    const choose = await uni.chooseImage({ count: 1 })
    const path = choose.tempFilePaths?.[0]
    if (!path) return
    const { dataURL, fileName } = await readAsBase64(path)
    form.boreholeLogDiagramFileData = dataURL.replace(/^data:.*?,/, '')
    form.boreholeLogDiagramFileName = fileName || 'borehole.jpg'
    uni.showToast({ title: '已读取柱状图', icon: 'none' })
  } catch (e) {
    uni.showToast({ title: '读取柱状图失败', icon: 'none' })
  }
}
function readAsBase64(path: string): Promise<{ dataURL: string; fileName?: string }> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.io.resolveLocalFileSystemURL(path, (entry) => {
      (entry as any).file((file: any) => {
        const reader = new plus.io.FileReader()
        reader.onload = (e) => resolve({ dataURL: String((e as any).target.result), fileName: file.name })
        reader.onerror = reject
        reader.readAsDataURL(file)
      }, reject)
    }, reject)
    // #endif

    // #ifdef H5
    fetch(path)
      .then(r => r.blob())
      .then(blob => new Promise<{ dataURL: string; fileName?: string }>((res, rej) => {
        const fr = new FileReader()
        fr.onload = () => res({ dataURL: String(fr.result), fileName: (blob as any).name })
        fr.onerror = rej
        fr.readAsDataURL(blob)
      }))
      .then(resolve).catch(reject)
    // #endif
  })
}

function onStartDateChange(e: any) {
  form.monitoringStartDate = e?.detail?.value || ''
  if (form.monitoringEndDate && form.monitoringEndDate < form.monitoringStartDate) {
    uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
    form.monitoringEndDate = '' // 或者：form.monitoringEndDate = form.monitoringStartDate
  }
}

function onEndDateChange(e: any) {
  const val = e?.detail?.value || ''
  if (form.monitoringStartDate && val < form.monitoringStartDate) {
    uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
    return
  }
  form.monitoringEndDate = val
}

// 精度/时间/空字段处理
function fix6(n?: number) { return n == null ? n as any : Number(Number(n).toFixed(6)) }
function fix3(n?: number) { return n == null ? n as any : Number(Number(n).toFixed(3)) }
const n3Keys: (keyof AddWellPayload)[] = [
  'xCoordinateCgcs2000','yCoordinateCgcs2000','zCoordinate','initialWaterLevel','jswms','jkgc','jknj',
  'cjsd','screenLength','screenTopDepth','screenBottomDepth','sealingStartDepth','sealingEndDepth','currentDepth'
]
function padTime(s?: string) { return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s} 00:00:00` : s }
function compactPayload<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  Object.keys(obj).forEach(k => {
    const v = obj[k as keyof T]
    if (v !== '' && v !== null && v !== undefined) out[k as keyof T] = v
  })
  return out
}

// 提交
// 提交
async function submit() {
  try {
    // 先做前端强制校验
    validateAll()
    if (!canSubmit.value) {
      uni.showToast({ title: '请先完善所有必填项', icon: 'none' })
      return
    }

    // 数值精度与时间字段处理（你原有逻辑保留）
    form.chahba = fix6(form.chahba)
    form.chahbb = fix6(form.chahbb)
    n3Keys.forEach(k => (form[k] as any) = fix3(form[k] as any))
    form.cjsj = padTime(form.cjsj)
    form.monitoringStartDate = padTime(form.monitoringStartDate)
    form.monitoringEndDate   = padTime(form.monitoringEndDate)

    // 组装 payload（必填 + 你愿意带的非必填；compactPayload 会去掉空值）
    const payload = compactPayload(form)

    // 调用 API
    const id = await addMonitoringWell(payload as AddWellPayload)
    uni.showToast({ title: `新增成功(ID:${id})`, icon: 'success' })
    uni.$emit('well:add:done', { id, lon: form.chahba, lat: form.chahbb, pkiaa: form.pkiaa })
    setTimeout(() => uni.navigateBack(), 300)
  } catch (e: any) {
    console.error('[新增监测井]失败', e)
    uni.showToast({ title: e?.message || '提交失败', icon: 'none' })
  }
}

</script>

<template>
  <scroll-view scroll-y style="height:100vh">
    <view class="p-4">

      <!-- ===== 必填：置顶 ===== -->
      <view class="card">
        <view class="mb-2">
          <text class="lbl">监测井编码*</text>
          <input class="ipt" v-model.trim="form.pkiaa" :class="{ invalid: !!errors.pkiaa }" @blur="validateField('pkiaa')" />
          <text class="err" v-if="errors.pkiaa">{{ errors.pkiaa }}</text>
        </view>
      
        <view class="mb-2">
          <text class="lbl">区县*</text>
          
          <picker
            mode="selector"
            :range="districtOptions"
            range-key="label"
            @change="onDistrictChange"
          >
            <!-- 用一个 view 来长得像输入框 -->
            <view class="ipt select" :class="{ invalid: !!errors.district }">
              {{ selectedDistrictLabel || '请选择区县' }}
            </view>
          </picker>
          
          <text class="err" v-if="errors.district">{{ errors.district }}</text>

      
          <text class="lbl mt-2">组织结构代码*</text>
          <input class="ipt" v-model.trim="form.saasdm" placeholder="组织结构代码"
                 :class="{ invalid: !!errors.saasdm }" @blur="validateField('saasdm')" />
          <text class="err" v-if="errors.saasdm">{{ errors.saasdm }}</text>
        </view>
      
        <view class="row">
          <view class="col">
            <text class="lbl">经度(十进制)*</text>
            <input class="ipt" type="digit" v-model.number="form.chahba" placeholder="121.123456"
                   :class="{ invalid: !!errors.chahba }" @blur="validateField('chahba')" />
            <text class="err" v-if="errors.chahba">{{ errors.chahba }}</text>
          </view>
          <view class="col">
            <text class="lbl">纬度(十进制)*</text>
            <input class="ipt" type="digit" v-model.number="form.chahbb" placeholder="37.123456"
                   :class="{ invalid: !!errors.chahbb }" @blur="validateField('chahbb')" />
            <text class="err" v-if="errors.chahbb">{{ errors.chahbb }}</text>
          </view>
        </view>
      
        <view class="mt-2">
          <button class="btn-gps" :loading="locLoading.busy" :disabled="locLoading.busy" @click="fillByCurrentLocation">
            获取当前经纬度
          </button>
          <text class="tip">可手动输入，或点击按钮自动填入</text>
        </view>
      
        <view class="row mt-2">
          <view class="col">
            <text class="lbl">经度(DMS)*</text>
            <input class="ipt" v-model.trim="form.longitude" placeholder="118°0′0.00″E"
                   :class="{ invalid: !!errors.longitude }" @blur="validateField('longitude')" />
            <text class="err" v-if="errors.longitude">{{ errors.longitude }}</text>
          </view>
          <view class="col">
            <text class="lbl">纬度(DMS)*</text>
            <input class="ipt" v-model.trim="form.latitude" placeholder="32°0′0.00″N"
                   :class="{ invalid: !!errors.latitude }" @blur="validateField('latitude')" />
            <text class="err" v-if="errors.latitude">{{ errors.latitude }}</text>
          </view>
        </view>
      </view>

      <!-- ===== 非必填：全部字段，分组展示 ===== -->
      <view class="card mt-3">
        <view class="fold-hd" @click="moreOpen = !moreOpen">
          <text>更多信息（点击{{ moreOpen ? '收起' : '展开' }}）</text>
          <text>{{ moreOpen ? '▲' : '▼' }}</text>
        </view>

        <view v-show="moreOpen" class="fold-bd">

          <!-- 基础信息 -->
          <view class="group">
            <text class="g-title">基础信息</text>
            <input class="ipt" v-model="form.wellName" placeholder="监测井名称" />
            <input class="ipt" v-model="form.ysbh" placeholder="监测井原始编码" />
            <input class="ipt" v-model="form.locationDescription" placeholder="监测井位置" />
            <view class="row">
              <input class="ipt col" v-model="form.province" placeholder="省" />
              <input class="ipt col" v-model="form.city" placeholder="地市" />
            </view>
            <view class="row">
              <text class="ipt col" style="color: darkgray;">是否调查评估项目新建井</text><br>
              <u-radio-group v-model="form.isNewWell">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
            </view>
            <input class="ipt" v-model="form.projectName" placeholder="所属项目" />
			<input class="ipt col" v-model="form.serialNumber" placeholder="序号" />
            <input class="ipt" v-model="form.equipmentCode" placeholder="自动监测设备编码" />
          </view>

          <!-- 坐标/高程（CGCS2000） -->
          <view class="group">
            <text class="g-title">坐标/高程（CGCS2000）</text>
            <view class="row">
              <input class="ipt col" type="digit" v-model.number="form.xCoordinateCgcs2000" placeholder="X坐标" />
              <input class="ipt col" type="digit" v-model.number="form.yCoordinateCgcs2000" placeholder="Y坐标" />
            </view>
            <input class="ipt" type="digit" v-model.number="form.zCoordinate" placeholder="Z坐标" />
          </view>

          <!-- 水文地质/分区 -->
          <view class="group">
            <text class="g-title">水文地质条件</text>
            <view class="row">
              <input class="ipt col" v-model="form.watershed" placeholder="所属流域" />
              <input class="ipt col" v-model="form.waterPartition" placeholder="所属水系分区" />
            </view>
            <view class="row">
              <input class="ipt col" v-model="form.levelSwdzCode" placeholder="水文地质区" />
              <input class="ipt col" v-model="form.oneLevelSwdzCode" placeholder="水文地质亚区" />
            </view>
            <input class="ipt" v-model="form.twoLevelSwdzCode" placeholder="水文地质小区" />
            <input class="ipt" v-model="form.aquiferStratumCode" placeholder="含水层地层代号" />
            <input class="ipt" v-model="form.aquiferLithology" placeholder="含水层岩性" />
            <input class="ipt" v-model="form.jcdx" placeholder="监测对象" />
          </view>

          <!-- 点位属性（国家/市级/区域/污染源/水源） -->
          <view class="group">
            <text class="g-title" >监测井性质</text>
            <!-- 是否国家地下水监测工程点 -->
            <view class="row">
              <text class="label">是否国家地下水监测工程点</text>
              <u-radio-group v-model="form.isGjdxsjcgc">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
            </view>
            
            <!-- 国家考核点位 -->
            <view class="row">
              <text class="label">是否国家考核点位</text>
              <u-radio-group v-model="form.isGjkh">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
            </view>
            
            <!-- 市级考核点位 -->
            <view class="row">
              <text class="label">是否市级考核点位</text>
              <u-radio-group v-model="form.isCityKh">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
            </view>
            
            <!-- 区域监测点 -->
            <view class="row">
              <text class="label">是否区域监测点</text>
              <u-radio-group v-model="form.isRegionalMonitor">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
            </view>
            <input class="ipt" v-model="form.regionalMonitorType" placeholder="区域监测点类型" />
            <view class="row">
              <input class="ipt col" v-model="form.isPollutionMonitor" placeholder="污染源监测点" />
              <input class="ipt col" v-model="form.pollutionMonitorType" placeholder="污染源监测点类型" />
            </view>
            <view class="row">
              <input class="ipt col" v-model="form.sswryCode" placeholder="污染源代码" />
              <input class="ipt col" v-model="form.wryName" placeholder="污染源名称" />
            </view>
            <view class="row">
              <text class="label">是否水源监测点</text>
              <u-radio-group v-model="form.isWaterSource">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
              <input class="ipt col" v-model="form.waterSourceMonitorType" placeholder="水源监测点类型" />
            </view>
            <view class="row">
              <input class="ipt col" v-model="form.sssydCode" placeholder="水源代码" />
              <input class="ipt col" v-model="form.waterSourceName" placeholder="水源名称" />
            </view>
            <view class="row">
              <input class="ipt col" v-model="form.isPollutionDiffusion" placeholder="污染源扩散监测点" />
              <input class="ipt col" v-model="form.isPollutionInternal" placeholder="污染源内部监测点" />
            </view>
          </view>

          <!-- 建井参数/含水层 -->
          <view class="group">
            <text class="g-title">成井信息</text>
            <input class="ipt" v-model="form.cjsj" placeholder="成井时间" />
            <view class="row">
              <input class="ipt col" type="digit" v-model.number="form.initialWaterLevel" placeholder="初见水位埋深（m）" />
              <input class="ipt col" type="digit" v-model.number="form.jswms" placeholder="静水位埋深（m）" />
            </view>
            <view class="row">
              <input class="ipt col" type="digit" v-model.number="form.jkgc" placeholder="井口高程（m）" />
              <input class="ipt col" type="digit" v-model.number="form.jknj" placeholder="井口内径（m）" />
            </view>
            <view class="row">
              <input class="ipt col" type="digit" v-model.number="form.cjsd" placeholder="成井深度（m）" />
              <input class="ipt col" v-model="form.jgcz" placeholder="井管材质" />
            </view>
            <view class="row">
              <input class="ipt col" v-model="form.mctj" placeholder="埋藏条件" />
              <input class="ipt col" v-model="form.hsjjlx" placeholder="含水介质" />
            </view>
            <view class="row">
              <text class="label">是否多段筛管</text>
              <u-radio-group v-model="form.hasMultipleScreens">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
              <input class="ipt col" type="digit" v-model.number="form.screenLength" placeholder="筛管长度" />
            </view>
            <view class="row">
              <input class="ipt col" type="digit" v-model.number="form.screenTopDepth" placeholder="筛管上部埋深" />
              <input class="ipt col" type="digit" v-model.number="form.screenBottomDepth" placeholder="筛管下部埋深" />
            </view>
            <input class="ipt" v-model="form.sealingMaterial" placeholder="止水材料" />
            <view class="row">
              <input class="ipt col" type="digit" v-model.number="form.sealingStartDepth" placeholder="止水起始深度" />
              <input class="ipt col" type="digit" v-model.number="form.sealingEndDepth" placeholder="止水终止深度" />
            </view>
            <text class="label">是否满足监测井建设规范要</text>
            <u-radio-group v-model="form.meetsStandards">
              <u-radio name="1" label="是" />
              <u-radio name="0" label="否" />
            </u-radio-group>
          </view>

          <!-- 监测配置/管理 -->
          <view class="group">
            <text class="g-title">环境管理信息</text>
            <input class="ipt" v-model="form.managementUnit" placeholder="管理单位" />
            <input class="ipt" v-model="form.jcjSsdw" placeholder="监测井权属单位" />
            <input class="ipt" v-model="form.currentCondition" placeholder="监测井现状" />
            <view class="row">
              <input class="ipt col" v-model="form.wellNature" placeholder="监测井性质" />
              <input class="ipt col" v-model="form.monitoringType" placeholder="监测类型" />
            </view>
            <view class="row">
              <input class="ipt col" v-model="form.monitoringMethod" placeholder="监测手段" />
              <input class="ipt col" v-model="form.monitoringContent" placeholder="监测内容" />
            </view>
            <input class="ipt" type="digit" v-model.number="form.currentDepth" placeholder="现状井深" />
            <view class="row">
              <text class="label">是否开展监测井维护管理</text>
              <u-radio-group v-model="form.isMaintained">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
              <input class="ipt col" v-model="form.maintenanceUnit" placeholder="实际维护管理单位" />
            </view>
            <input class="ipt" v-model="form.siltationStatus" placeholder="淤堵情况" />
            <view class="row">
              <text class="label">是否长期监测井</text>
              <u-radio-group v-model="form.isLongTerm">
                <u-radio name="1" label="是" />
                <u-radio name="0" label="否" />
              </u-radio-group>
            </view>
			</view>
			
			<view class="group">
			<text class="g-title">监测信息</text>
            <view class="row">
              <!-- 监测开始时间 -->
              <text class="label">监测开始时间</text>
              <picker
                mode="date"
                :value="form.monitoringStartDate"
                @change="onStartDateChange"
              >
                <view class="ipt select">
                  {{ form.monitoringStartDate || '请选择开始日期' }}
                </view>
              </picker>
              
              <!-- 监测结束时间 -->
              <text class="label">监测结束时间</text>
              <picker
                mode="date"
                :value="form.monitoringEndDate"
                @change="onEndDateChange"
              >
                <view class="ipt select">
                  {{ form.monitoringEndDate || '请选择结束日期' }}
                </view>
              </picker>

            </view>
            <view class="row">
              <input class="ipt col" v-model="form.waterExtraction" placeholder="取水情况" />
              <input class="ipt col" v-model="form.monitoringFrequency" placeholder="监测频次" />
            </view>
            <textarea class="ipt" v-model="form.monitoringParameters" placeholder="监测指标"></textarea>
          </view>
		  

          <!-- 联系方式/备注/附件 -->
          <view class="group">
            <text class="g-title">联系方式/备注/附件</text>
            <view class="row">
              <input class="ipt col" v-model="form.contactPerson" placeholder="联系人" />
              <input class="ipt col" v-model="form.contactPhone" placeholder="联系电话" />
            </view>
            <textarea class="ipt" v-model="form.remark" placeholder="备注"></textarea>
            <view class="row">
              <input class="ipt col" v-model="form.boreholeLogDiagramFileName" placeholder="钻孔综合柱状图文件名" />
              <button class="btn" @click="pickBoreholeLog">选择柱状图</button>
            </view>
          </view>

        </view>
      </view>

      <button type="primary" class="mt-4" :disabled="!canSubmit" @click="submit">提交</button>
      <view style="height:40rpx"></view>
    </view>
  </scroll-view>
</template>

<style scoped>
.p-4{padding:24rpx}
.card{background:#fff;border-radius:12rpx;padding:20rpx}
.mb-2{margin-bottom:20rpx}
.mt-2{margin-top:20rpx}
.mt-3{margin-top:24rpx}
.mt-4{margin-top:32rpx}
.lbl{display:block;margin-bottom:8rpx;color:#333;font-size:28rpx}
.ipt{
  border:1px solid #e5e5e5;border-radius:10rpx;padding:16rpx;font-size:28rpx;background:#fff;
}
.row { display:flex; align-items:center; gap:16rpx; padding:8rpx 0; }
.col{flex:1}
.btn-gps{
  width:100%;background:#2db55d;color:#fff;border-radius:12rpx;padding:18rpx 0;font-size:30rpx
}
.tip{display:block;margin-top:8rpx;color:#999;font-size:24rpx}
.fold-hd{display:flex;justify-content:space-between;align-items:center;padding:8rpx 4rpx;font-size:28rpx}
.fold-bd{margin-top:8rpx}
.group{margin:18rpx 0}
.g-title{display:block;margin-bottom:8rpx;color:#666}
.btn{background:#1677ff;color:#fff;border-radius:12rpx;padding:14rpx 0;text-align:center}
.invalid { border-color: #ff4d4f !important; }
.err { color: #ff4d4f; font-size: 24rpx; display: block; margin-top: 6rpx; }
.mt-2 .lbl, .mt-3 .lbl, .lbl { display:block; margin-bottom: 8rpx; }
.mt-2 { margin-top: 20rpx; }
.label { width: 300rpx; flex-shrink:0; color:#909399; font-size:26rpx; }
u-radio-group { margin-left:auto; } /* 让选项在右侧 */
.ipt.select{
  display:flex; align-items:center;
  min-height:72rpx; padding:0 20rpx;
  border:1px solid #e5e6eb; border-radius:8rpx;
  color:#303133; background:#fff;
}

</style>
