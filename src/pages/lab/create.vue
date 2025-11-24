<template>
  <view class="page">
    <view class="card">
      <view class="title">新增地下水监测机构</view>

      <u-form ref="formRef" :model="formData" labelWidth="90">
        <!-- 机构名称 -->
        <u-form-item label="机构名称" required>
          <u-input v-model="formData.orgName" placeholder="请输入监测机构名称" />
        </u-form-item>
		
		<u-form-item label="机构编号" required>
		  <u-input v-model="formData.unitCode" placeholder="请输入监测机构编号" />
		</u-form-item>

        <!-- 统一编号（必填） -->
        <u-form-item label="统一编号" required>
          <u-input v-model="formData.pkiaa" placeholder="请输入统一编号" />
        </u-form-item>

        <!-- 省市区/行政区划 -->
        <u-form-item label="省" required>
          <u-input v-model="formData.province" placeholder="请输入省" />
        </u-form-item>
        <u-form-item label="市" required>
          <u-input v-model="formData.city" placeholder="请输入市" />
        </u-form-item>
        <u-form-item label="县区" required>
          <u-input v-model="formData.district" placeholder="请输入县区" />
        </u-form-item>
        <u-form-item label="行政区划" required>
          <u-input v-model="formData.regionCode" placeholder="请输入行政区划代码" />
        </u-form-item>

        <!-- 机构性质：下拉选择 -->
        <u-form-item label="机构性质">
          <u-input
            v-model="formData.orgType"
            readonly
            placeholder="请选择机构性质"
            suffixIcon="arrow-down"
            @click="showOrgTypePicker = true"
          />
        </u-form-item>
		
		<u-picker
		  v-model:show="showOrgTypePicker"
		  :columns="orgTypeColumns"
		  keyName="label"
		  @confirm="onOrgTypeConfirm"
		/>

        <!-- 人员规模 -->
        <u-form-item label="人员规模">
          <u-input v-model="formData.staffSize"  />
        </u-form-item>

        <u-form-item label="负责人">
          <u-input v-model="formData.leader"  />
        </u-form-item>

        <u-form-item label="联系方式">
          <u-input v-model="formData.contact" placeholder="手机号或座机" />
        </u-form-item>

        <u-form-item label="信用代码">
          <u-input v-model="formData.creditCode" placeholder="统一社会信用代码" />
        </u-form-item>

        <u-form-item label="实验室类型">
          <u-input v-model="formData.labType"  />
        </u-form-item>

        <u-form-item label="资质认证">
          <u-input v-model="formData.certification" />
        </u-form-item>

        <!-- 认证截至时间：时间选择器 -->
        <u-form-item label="认证截止">
          <u-input
            v-model="formData.certificationExpiry"
            readonly
            placeholder="请选择日期时间"
            suffixIcon="calendar"
            @click="showCertPicker = true"
          />
        </u-form-item>
		
        <u-datetime-picker
          v-model="certTs"
          v-model:show="showCertPicker"
          mode="datetime"
          @confirm="onCertConfirm"
        />

        <u-form-item label="服务范围">
          <u-textarea v-model="formData.serviceScope" />
        </u-form-item>

        <u-form-item label="业绩">
          <u-input v-model="formData.performance" type="digit"  />
        </u-form-item>

        <u-form-item label="详细地址">
          <u-input v-model="formData.address" placeholder="街道/门牌号" />
        </u-form-item>

        <u-form-item label="备注">
          <u-textarea v-model="formData.remarks"  />
        </u-form-item>
      </u-form>

      <view class="actions">
        <u-button :plain="true" @click="resetForm">重置</u-button>
        <u-button type="primary" :loading="submitting" @click="submit">提交</u-button>
      </view>
    </view>

  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'


const unitCode = ref('')
/** 只保留这组字段，并把 pkiaa 放进表单里 */
const makeDefaultForm = () => ({
  orgName: '',
  pkiaa: '',             
  unitCode:'',
  province: '',
  city: '',
  district: '',
  regionCode: '',
  orgType: '',
  staffSize: '',
  leader: '',
  contact: '',
  creditCode: '',
  labType: '',
  certification: '',
  certificationExpiry: '',  // 展示字符串：YYYY-MM-DD HH:mm:ss
  serviceScope: '',
  performance: '',
  address: '',
  remarks: ''
})
const formData = reactive(makeDefaultForm())
const formRef = ref(null)


onLoad((q) => {
  // 如果上页传过来，可预填
  formData.pkiaa = String(q?.pkiaa || formData.pkiaa || '').trim()
  formData.unitCode = String(q?.unitCode || formData.unitCode || '').trim()
})

/** 机构性质选项（示例，可按你实际枚举修改） */
const showOrgTypePicker = ref(false)

const orgTypeColumns = [[
  { label: '政府', value: '政府' },
  { label: '企业', value: '企业' },
  { label: '高校', value: '高校' },
  { label: '科研', value: '科研' },
  { label: '其他', value: '其他' },
]];

function onOrgTypeConfirm({ value }) {
  const item = Array.isArray(value) ? value[0] : value
  formData.orgType = typeof item === 'object'
    ? (item.label ?? item.value ?? '')
    : String(item ?? '')
  showOrgTypePicker.value = false
}



function openOrgTypePicker() {
  showOrgTypePicker.value = true
  console.log('[openOrgTypePicker] true')
}
function openCertPicker() {
  showCertPicker.value = true
  console.log('[openCertPicker] true')
}

/** 认证截至时间（时间选择器） */
const showCertPicker = ref(false)
const certTs = ref(Date.now())
function onCertConfirm({ value }) {
  const ts = Array.isArray(value) ? Number(value[0]) : Number(value)
  const finalTs = Number.isFinite(ts) ? ts : Date.now()
  certTs.value = finalTs
  formData.certificationExpiry = formatDateTime(finalTs)
  showCertPicker.value = false
}

function pad(n){ return n<10 ? '0'+n : ''+n }
function formatDateTime(t){
  const d=new Date(t)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 表单 -> 接口字段映射（application/json） */
const buildPayload = () => ({
  // 必填
  pkiaa: formData.pkiaa,         
   unitCode: formData.unitCode,    
  unitName: formData.orgName,

  // 可选映射
  unitNature: formData.orgType,
  personScale: formData.staffSize,
  fzr: formData.leader,
  contactWay: formData.contact,
  uscc: formData.creditCode,

  labType: formData.labType,
  labQualification: formData.certification,
  qualificationExpiry: formData.certificationExpiry, // 已是 YYYY-MM-DD HH:mm:ss
  labServiceRange: formData.serviceScope,
  labPerformance: formData.performance,
  labAddress: formData.address,

  province: formData.province,
  city: formData.city,
  district: formData.district,
  saasdm: formData.regionCode,

  remark: formData.remarks
})

/** 校验：新增了 pkiaa 检查 */
const validate = () => {
  if (!formData.pkiaa)        return '请填写统一编号（pkiaa）'
  if (!formData.unitCode)        return '缺少单位编号（unitCode）'
  if (!formData.orgName)      return '请填写机构名称'
  if (!formData.province)     return '请填写省'
  if (!formData.city)         return '请填写市'
  if (!formData.district)     return '请填写县区'
  if (!formData.regionCode)   return '请填写行政区划'
  return ''
}

/** 重置（包含 pkiaa） */
function resetForm() {
  Object.assign(formData, makeDefaultForm())
  formRef.value?.resetFields?.()
  formRef.value?.clearValidate?.()
}

/** 提交（application/json） */
const submitting = ref(false)
async function submit() {
  const err = validate()
  if (err) { uni.showToast({ title: err, icon: 'none' }); return }

  const payload = buildPayload()

  if (submitting.value) return
  submitting.value = true
  try {
    const res = await uni.request({
      url: 'api/Dxsjgxxb/AddDxsjgxxbForApp',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${uni.getStorageSync('token') || ''}`
      },
      data: payload
    })
    const data = res?.data
    if (data?.success) {
      uni.showToast({ title: '新增成功', icon: 'success' })
      // 成功后按需跳转
      // uni.navigateBack()
    } else {
      uni.showToast({ title: data?.msg || '新增失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: e?.message || '网络错误', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { padding: 20rpx; background: #f7f8fa; min-height: 100vh; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 6rpx 24rpx rgba(0,0,0,0.04); }
.title { font-size: 32rpx; font-weight: 600; margin-bottom: 20rpx; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 20rpx; margin-top: 24rpx; }
.picker-trigger { width: 100%; }
.picker-trigger :deep(.u-input) { pointer-events: none; } /* 确保点击落到外层 view 的 @tap */

</style>
