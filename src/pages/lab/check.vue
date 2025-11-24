<!-- pages/sample/choose-lab.vue -->
<template>
  <view class="page">
    <!-- 顶部信息（随便展示，不参与勾选逻辑） -->
    <view class="top">
      <view class="sub">监测井：{{ baseCode }}</view>
    </view>

    <!-- 搜索 -->
    <view class="search-bar">
      <u-search
        v-model="keyword"
        placeholder="按名称/信用代码搜索"
        @search="reload"
        @custom="reload"
      />
    </view>

    <!-- 加载 / 空态 -->
    <u-loading-icon v-if="loading" text="加载中..." />
    <u-empty v-else-if="!labs.length" mode="list" text="暂无数据" />

    <!-- 列表（勾选只改变前端 selectedKeys，不与后端交互） -->
    <view v-else>
      <u-checkbox-group
        v-model="selectedKeys"
        :max="1"
        placement="column"
        @change="onCheckChange"
      >
        <u-cell-group>
          <u-cell
            v-for="(it, idx) in labs"
            :key="'cell_'+idx"               
            :title="it.unitName || '未命名机构'"
            :label="`统一社会信用代码：${it.uscc || '-'}`"
            isLink
            @click.stop="toggleRow(idx)"     
          >
            <template #value>
              <u-checkbox
                :key="'cb_'+idx"             
                :name="String(idx)"          
                @click.stop
              />
            </template>
          </u-cell>
        </u-cell-group>
      </u-checkbox-group>

    </view>

    <!-- 底部操作 -->
    <view class="footer">
      <u-button type="error" :plain="true" @click="goCreate">新增监测机构</u-button>

      <!-- 只有勾选后才可点 -->
      <u-button
        type="primary"
        :disabled="!selectedKeys.length || posting"
        :loading="posting"
        @click="confirm"
      >
        确认进入采样
      </u-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { fetchAllDxsjgList, type DxsjgItem } from '@/api/dxsjg'

/** 
 * 一键开关：
 * - true  => 点击“确认”会调用后端创建采样记录（原流程）
 * - false => 点击“确认”不调后端，只做前端演示/跳转
 */
const CREATE_ON_CONFIRM = true

// ===== 监测井基础信息（展示用，不参与勾选） =====
const rawPkiaa = ref('')     // 监测井编号
const wellName = ref('')     // 监测井名称
const wellType = ref('')     // 监测井类型
const wellLocation = ref('') // 监测井位置
const nextUrl     = ref('')
const baseCode    = ref('')
const baseName    = ref('')
const baseType    = ref('')
const baseLoc     = ref('')
const baseWryName = ref('')
const baseCity    = ref('')
const baseId = ref('')

// ===== 列表与选择状态（勾选只改前端）=====
const keyword = ref('')
const loading = ref(false)
const labs = ref<DxsjgItem[]>([])

// u-checkbox-group 的 v-model：单选也用数组（:max="1"）
const selectedKeys = ref<string[]>([])
const chosenKey = computed(() => selectedKeys.value[0] || '')
const pick = (v:any) => Array.isArray(v) ? v[0] : v // 拿第一个即可

onLoad((q:any) => {
  console.log('[check onLoad] raw query =', q)

  baseId.value      = String(pick(q?.id) || '')
  baseCode.value    = String(pick(q?.code) || '')
  baseName.value    = String(pick(q?.name) || '')
  baseType.value    = String(pick(q?.type) || '')
  baseLoc.value     = String(pick(q?.location) || '')
  baseWryName.value = String(pick(q?.wryName) || '')
  baseCity.value    = String(pick(q?.city) || '')

  console.log('[check onLoad] parsed =', {
    id: baseId.value, code: baseCode.value, name: baseName.value,
    type: baseType.value, location: baseLoc.value, wryName: baseWryName.value, city: baseCity.value
  })
})


onShow(() => reload())

// ===== 工具：唯一键（用于 :key 和 :name）=====
function rowKey(_: any, idx: number): string {
  return String(idx)
}

// ===== 交互：只在前端切换勾选状态（不调后端）=====
function toggleRow(idx: number) {
  const key = String(idx)
  // 单选语义：再次点击取消选择
  selectedKeys.value = selectedKeys.value[0] === key ? [] : [key]
}
function onCheckChange(val: string[]) {
  // 保险：一旦出现多个（例如历史“undefined”残留或组件 bug），只保留最后一个
  if (val.length > 1) {
    selectedKeys.value = [val[val.length - 1]]
  }
  console.log('[checkbox-group change] selectedKeys =', JSON.stringify(selectedKeys.value))
}

// ===== 加载列表（查询接口；与勾选无关）=====
async function reload() {
  loading.value = true
  try {
    labs.value = await fetchAllDxsjgList({ keyword: keyword.value?.trim() || undefined })
    // 清理任何非数字的脏 name（比如之前产生的 "undefined"）
    selectedKeys.value = []
  } catch (e:any) {
    uni.showToast({ title: e?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}


// ===== 新增机构（常驻可点）=====
function goCreate() {
  uni.navigateTo({
    url: `/pages/lab/create?pkiaa=${encodeURIComponent(rawPkiaa.value)}&wellName=${encodeURIComponent(wellName.value)}&next=detail`
  })
}

// ===== 确认进入采样 =====
const posting = ref(false)

// 完整 confirm() —— 支持：仅前端转发 / 后端创建；携带 wryname、city、labId、labName
// 依赖的响应式变量（在页面其它处已定义）：
// selectedKeys, labs, posting, nextUrl?, baseCode?, baseName?, baseType?, baseLoc?, baseWryName?, baseCity?
// （若未定义 base*，则回退到 rawPkiaa/wellName/wellType/wellLocation）
// 可选开关：CREATE_ON_CONFIRM（true=走后端创建；false=仅前端转发）

async function confirm() {
  if (!selectedKeys.value.length) {
    uni.showToast({ title: '请先勾选一个监测机构', icon: 'none' })
    return
  }

  // 取被勾选的机构（索引最稳）
  const idx = Number(selectedKeys.value[0])
  const chosen = labs.value[idx]
  if (!chosen) {
    uni.showToast({ title: '未找到勾选的机构', icon: 'none' })
    return
  }

  // 基础参数（从 onLoad 读到的顶层 query）
  const id       = baseId?.value ?? ''
  const code     = baseCode?.value ?? ''
  const name     = baseName?.value ?? ''
  const type     = baseType?.value ?? ''
  const location = baseLoc?.value ?? ''
  const wryName  = baseWryName?.value ?? ''
  const city     = baseCity?.value ?? ''

  // 原样拼接 query 的小工具（不编码；仅跳转页面时用）
  const buildQueryRaw = (p: Record<string, string | number | undefined | null>) => {
    const parts: string[] = []
    Object.keys(p).forEach(k => {
      const v = p[k]
      if (v === undefined || v === null) return   // undefined/null 跳过；空串保留: &city=
      parts.push(`${k}=${String(v)}`)
    })
    return parts.join('&')
  }

  // === 如果还保留了 nextUrl：只追加实验室信息（不编码），避免“穿两遍” ===
  if (typeof nextUrl !== 'undefined' && nextUrl.value) {
    const sep = nextUrl.value.includes('?') ? '&' : '?'
    const final = nextUrl.value + sep + buildQueryRaw({
      labId: (chosen as any).Id,
      labName: chosen.unitName || ''
    })
    console.log('[check -> detail via next] final =', final)
    uni.navigateTo({ url: final })
    return
  }

  // === A) 仅前端转发（不调后端创建）===
  if (typeof CREATE_ON_CONFIRM !== 'undefined' && CREATE_ON_CONFIRM === false) {
    const pairs: Record<string, string> = {}
    if (id) pairs.id = id
    Object.assign(pairs, { code, name, type, location, wryName, city })
    pairs.labId = String((chosen as any).Id ?? '')
    pairs.labName = String(chosen.unitName || '')

    const final = '/pages/sample/detail?' + buildQueryRaw(pairs)
    console.log('[check -> detail FE only] final =', final)
    uni.navigateTo({ url: final })
    return
  }

  // === B) 后端创建样品后再跳（接口仍需表单编码）===
  const jcjCode = code
  const jcjName = name
  if (!jcjCode || !jcjName) {
    uni.showToast({ title: '监测井信息缺失', icon: 'none' })
    return
  }
  if (posting.value) return
  posting.value = true

  try {
    // 1) 查询已有记录计算序号
    let maxIndex = 0
    try {
      const res = await uni.request({
        url: `api/AppInterface/GetWaterQualSampleList?jcjCode=${encodeURIComponent(jcjCode)}`,
        method: 'GET',
        header: { Authorization: `Bearer ${uni.getStorageSync('token')}` }
      })
      const data: any = res.data
      if (data?.success && Array.isArray(data?.response)) {
        const gceabbs = data.response
          .map((item: any) => item.gceabb)
          .filter((c: any) => typeof c === 'string' && c.startsWith(jcjCode))
        for (const c of gceabbs) {
          const numStr = c.slice(jcjCode.length)
          const num = parseInt(numStr)
          if (!isNaN(num) && num > maxIndex) maxIndex = num
        }
      }
    } catch (e) {
      console.error('获取已有采样记录失败：', e)
      uni.showToast({ title: '编号生成失败', icon: 'none' })
      return
    }

    // 2) 新编号
    const newIndex = maxIndex + 1
    const gceabb = jcjCode + String(newIndex).padStart(3, '0')

    // 3) 表单数据（接口这里要编码！）
    const now = new Date()
    const pad = (n:number) => (n < 10 ? '0' + n : String(n))
    const cysj =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    const formData: Record<string, string> = {
      jcjCode: jcjCode,
      jcjName: jcjName,
      gceabb,
      cysj,
      dataFromApp: '1'
    }

    await new Promise<void>((resolve, reject) => {
      uni.request({
        url: 'api/AppInterface/AddWaterQualSample',
        method: 'POST',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('token')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        // ✅ 接口用 encodeURIComponent，防止后端解析失败
        data: Object.keys(formData)
          .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(formData[k]))
          .join('&'),
        success: (res) => {
          const data: any = res.data
          if (data?.success) {
            const sampleId = data.response

            const pairs: Record<string, string> = {
              id: String(sampleId),
              code: jcjCode,
              name: jcjName,
              type,
              location,
              wryName,
              city,
              labId: String((chosen as any).Id ?? ''),
              labName: String(chosen.unitName || '')
            }
            const final = '/pages/sample/detail?' + buildQueryRaw(pairs)
            console.log('[check -> detail after create] final =', final)
            uni.navigateTo({ url: final })
            resolve()
          } else {
            uni.showToast({ title: data?.msg || '创建失败', icon: 'none' })
            reject(new Error(data?.msg || '创建失败'))
          }
        },
        fail: (err) => {
          console.error('提交失败：', err)
          uni.showToast({ title: '网络请求失败', icon: 'none' })
          reject(err)
        }
      })
    })
  } finally {
    posting.value = false
  }
}


</script>

<style scoped>
.page { padding: 12px; }
.top .title { font-size: 18px; font-weight: 600; }
.top .sub { color: #666; margin-top: 4px; }
.search-bar { margin: 10px 0; }

/* 底部操作区 */
.footer {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 10px 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* 兜底：防止全局样式把未选中画成选中态 */
:deep(.u-checkbox__icon-wrap) {
  background: transparent;
  border-color: #dcdfe6;
}
:deep(.u-checkbox__icon-wrap--checked) {
  background: #2979ff;
  border-color: #2979ff;
}
</style>
