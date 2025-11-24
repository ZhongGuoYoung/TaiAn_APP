<template>
  <view class="page">
    <!-- 顶部：基本信息 -->
    <view class="card">
      <view class="row"><text class="label">评估单ID：</text>{{ form.Id }}</view>
      <view class="row"><text class="label">评估单编号：</text>{{ form.EvaluationCode }}</view>
      <view class="row">
        <text class="label">整改日期：</text>
        <picker mode="date" @change="onPickDate">
          <view class="picker">{{ form.RectifyDeadline || '请选择整改日期' }}</view>
        </picker>
      </view>
    </view>

    <!-- 监管部门签字 -->
    <view class="card">
      <view class="title">监管部门签字</view>

      <!-- 画板 -->
     <canvas
       canvas-id="sig-supervisor"
       id="sig-supervisor"
       class="sig-canvas"
       @touchstart="onStart('super', $event)"
       @touchmove="onMove('super', $event)"
       @touchend="onEnd('super')"
     ></canvas>

      <view class="tools">
        <button size="mini" @click="clear('super')">清空</button>
        <button size="mini" type="primary" @click="exportSign('super')">使用此签名</button>
      </view>

      <!-- 预览 -->
      <image v-if="preview.super" :src="preview.super" class="preview" mode="aspectFit" />
      <view class="hint" v-else>未确认签名</view>
    </view>

    <!-- 企业单位签字 -->
    <view class="card">
      <view class="title">企业单位签字</view>

      <canvas
        canvas-id="sig-enterprise"
        id="sig-enterprise"
        class="sig-canvas"
        @touchstart="onStart('ent', $event)"
        @touchmove="onMove('ent', $event)"
        @touchend="onEnd('ent')"
      ></canvas>

      <view class="tools">
        <button size="mini" @click="clear('ent')">清空</button>
        <button size="mini" type="primary" @click="exportSign('ent')">使用此签名</button>
      </view>

      <image v-if="preview.ent" :src="preview.ent" class="preview" mode="aspectFit" />
      <view class="hint" v-else>未确认签名</view>
    </view>

    <!-- 底部提交栏 -->
    <view class="footer safe-area-inset-bottom">
      <button class="btn ghost" @click="goBack">返回</button>
      <button class="btn" type="primary" @click="onSubmit">提交签字</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad , onReady} from '@dcloudio/uni-app'
import { reactive, ref, onMounted,getCurrentInstance } from 'vue'

/** —— 表单数据 —— */
const form = reactive({
  Id: '',                 // ← 来自上页 query.Id （= EvaluationId）
  EvaluationCode: '',     // ← 来自上页 query.EvaluationCode
  RectifyDeadline: '',    // YYYY-MM-DD
  SupervisorSignData: '', // 纯 base64（确认后写入）
  EnterpriseSignData: ''  // 纯 base64（确认后写入）
})

onLoad((q:any) => {
  form.Id = String(q?.Id || '')
  form.EvaluationCode = String(q?.EvaluationCode || '')
})

function onPickDate(e:any){
  form.RectifyDeadline = e.detail.value // 已是 YYYY-MM-DD
}

/** —— 画板：两个上下文 —— */
let ctxSuper: UniApp.CanvasContext | null = null
let ctxEnt: UniApp.CanvasContext | null = null
const drawing = reactive({ super:false, ent:false })
let last = { x:0, y:0 }

onReady(() => {
  const inst = getCurrentInstance()?.proxy   // 关键：把上下文传进去
  // 背景刷白：导出不透明
  ctxSuper = uni.createCanvasContext('sig-supervisor', inst as any)
  ctxSuper.setFillStyle('#fff'); ctxSuper.fillRect(0,0,2000,2000); ctxSuper.draw()

  ctxEnt = uni.createCanvasContext('sig-enterprise', inst as any)
  ctxEnt.setFillStyle('#fff'); ctxEnt.fillRect(0,0,2000,2000); ctxEnt.draw()
})


function getPoint(e:any){
  const t = (e?.touches && e.touches[0]) || (e?.changedTouches && e.changedTouches[0]) || e || {}
  // App-Plus 通常有 x/y；H5 可能没有，就退回 clientX/pageX
  const x = t.x ?? t.clientX ?? t.pageX ?? 0
  const y = t.y ?? t.clientY ?? t.pageY ?? 0
  return { x, y }
}


function safeStopDefault(e:any){
  if (e && typeof e.preventDefault === 'function') e.preventDefault()
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
}

function onStart(which:'super'|'ent', e:any){
  safeStopDefault(e)
  drawing[which] = true
  const p = getPoint(e)
  last.x = p.x; last.y = p.y
}

function onMove(which:'super'|'ent', e:any){
  safeStopDefault(e)
  if (!drawing[which]) return
  const p = getPoint(e)
  const ctx = which==='super' ? ctxSuper : ctxEnt
  if (!ctx) return
  ctx.setStrokeStyle('#111')
  ctx.setLineWidth(3)
  ctx.setLineCap('round'); ctx.setLineJoin('round')
  ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke()
  ctx.draw(true)
  last.x = p.x; last.y = p.y
}
function onEnd(which:'super'|'ent'){ drawing[which] = false }
function clear(which:'super'|'ent'){
  const ctx = which==='super' ? ctxSuper : ctxEnt
  if (!ctx) return
  ctx.setFillStyle('#fff'); ctx.fillRect(0,0,2000,2000); ctx.draw()
  // 同时清空已确认的预览与表单字段
  if (which==='super'){ preview.super = ''; form.SupervisorSignData = '' }
  else { preview.ent = ''; form.EnterpriseSignData = '' }
}

/** —— 导出为 base64 —— */
const preview = reactive<{super:string, ent:string}>({ super:'', ent:'' })

function pureBase64(s:string){
  const v = String(s||''); const i = v.indexOf('base64,')
  return i>=0 ? v.slice(i+7) : v
}
function readAsDataURL(localPath:string):Promise<string>{
  return new Promise((resolve,reject)=>{
    if (typeof plus==='undefined' || !plus.io) return reject(new Error('仅支持APP-PLUS'))
    plus.io.resolveLocalFileSystemURL(localPath, (entry:any) => {
      entry.file((file:any)=>{
        const reader = new plus.io.FileReader()
        reader.onloadend = (e:any)=> resolve(String(e.target.result||''))
        reader.onerror = (err:any)=> reject(err)
        reader.readAsDataURL(file) // 返回 data:image/jpeg;base64,...
      })
    }, reject)
  })
}

async function exportSign(which:'super'|'ent'){
  const canvasId = which==='super' ? 'sig-supervisor' : 'sig-enterprise'
  try{
    const r:any = await uni.canvasToTempFilePath({ canvasId, fileType:'jpg', quality:0.85 })
    const dataURL = await readAsDataURL(r.tempFilePath)
    if (which==='super'){
      preview.super = dataURL
      form.SupervisorSignData = pureBase64(dataURL)
    }else{
      preview.ent = dataURL
      form.EnterpriseSignData = pureBase64(dataURL)
    }
    uni.showToast({ title: '已确认签名', icon:'success' })
  }catch(e){
    console.error('[exportSign] fail:', e)
    uni.showToast({ title: '导出签名失败', icon:'none' })
  }
}

/** —— 提交：POST application/json —— */
async function onSubmit(){
  if (!form.Id || !form.EvaluationCode) {
    uni.showToast({ title:'缺少评估单参数', icon:'none' }); return
  }
  if (!form.RectifyDeadline) {
    uni.showToast({ title:'请选择整改日期', icon:'none' }); return
  }

  const payload = {
    Id: Number(form.Id),
    EvaluationCode: form.EvaluationCode,
    RectifyDeadline: form.RectifyDeadline,        // YYYY-MM-DD
    SupervisorSignData: form.SupervisorSignData || undefined,
    EnterpriseSignData: form.EnterpriseSignData || undefined
  }

  try{
    uni.showLoading({ title:'提交中...' })

    // APP 端优先使用 plus.net.XMLHttpRequest（最接近 Postman）
    if (typeof plus !== 'undefined' && plus.net && plus.net.XMLHttpRequest){
      const resp = await new Promise<any>((resolve,reject)=>{
        const xhr = new plus.net.XMLHttpRequest()
        xhr.timeout = 120000
        xhr.responseType = 'json'
        xhr.onreadystatechange = () => {
          if (xhr.readyState !== 4) return
          const status = xhr.status || 0
          try {
            const data = xhr.response || JSON.parse(xhr.responseText || '{}')
            status>=200 && status<300 ? resolve(data) : reject(new Error(`HTTP ${status} ${data?.msg||''}`))
          } catch(e){ reject(e) }
        }
        xhr.open('POST', `http://geologygis.com:8864/api/UnitEvaluation/EvaluateSignSubmit`)
        xhr.setRequestHeader('Authorization', 'Bearer ' + (uni.getStorageSync('token')||''))
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(JSON.stringify(payload))
      })
      uni.hideLoading()
      if (resp?.success){
        uni.showToast({ title:'提交成功', icon:'success' })
        setTimeout(()=> uni.navigateBack(), 600)
      }else{
        uni.showToast({ title: resp?.msg || '提交失败', icon:'none' })
      }
      return
    }

    // 兜底：uni.request
    const res:any = await uni.request({
      url: `http://geologygis.com:8864/api/UnitEvaluation/EvaluateSignSubmit`,
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + (uni.getStorageSync('token')||''),
        'Content-Type': 'application/json'
      },
      data: payload,
      timeout: 120000
    })
    uni.hideLoading()
    if (res.statusCode===200 && res.data?.success){
      uni.showToast({ title:'提交成功', icon:'success' })
      setTimeout(()=> uni.navigateBack(), 600)
    }else{
      uni.showToast({ title: res.data?.msg || '提交失败', icon:'none' })
    }
  }catch(e:any){
    uni.hideLoading()
    uni.showToast({ title: e?.message || '提交异常', icon:'none' })
    console.error('[EvaluateSignSubmit] error:', e)
  }
}

function goBack(){ uni.navigateBack() }
</script>

<style scoped lang="scss">
.page{ padding: 12px 12px calc(90px + env(safe-area-inset-bottom)); background:#f7f8fa; min-height:100vh; }
.card{ background:#fff; border-radius:12px; padding:12px; box-shadow:0 2px 12px rgba(0,0,0,.04); margin-bottom:12px; }
.row{ display:flex; align-items:center; gap:6px; margin-bottom:8px; font-size:28rpx; }
.label{ color:#666; }
.picker{ background:#f6f7fa; border-radius:6px; padding:10rpx 16rpx; display:inline-block; }

.title{ font-weight:600; margin-bottom:8px; }
.sig-canvas{ width: 100%; height: 280px; background:#fff; border:1px dashed #ddd; border-radius:8px; }
.tools{ display:flex; gap:10px; margin:8px 0 4px; }
.preview{ width:100%; height:120px; background:#fafafa; border-radius:6px; }
.hint{ color:#999; font-size:24rpx; }

.footer{
  position: fixed; left:0; right:0; bottom:0;
  background:#fff; box-shadow: 0 -4px 12px rgba(0,0,0,.06);
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  display:flex; gap:12px; z-index:9;
}
.btn{ flex:1; height:88rpx; line-height:88rpx; border-radius:12rpx; font-weight:600; }
.btn.ghost{ background:#fff; color:#2979ff; border:1px solid #2979ff; }
.sig-canvas{
  width: 100%; height: 280px;
  background:#fff; border:1px dashed #ddd; border-radius:8px;
  touch-action: none;        /* 关键：禁用默认手势 */
  position: relative; z-index: 1;
}


</style>
