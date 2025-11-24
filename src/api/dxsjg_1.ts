// /src/api/dxsjg.ts
export interface AddDxsjgPayload {
  pkiaa: string
  unitCode: string
  unitName: string
  unitNature?: string
  legarFileData?: string
  legarFileName?: string
  personScale?: string
  qualificationsFileData?: string
  qualificationsFileName?: string
  fzr?: string
  contactWay?: string
  uscc?: string
  chahba?: string
  chahbb?: string
  labAddress?: string
  province?: string
  city?: string
  district?: string
  saasdm?: string
  sortNum?: number
  labType?: string
  labQualification?: string
  qualificationExpiry?: string // ISO 字符串: "2025-09-16T07:08:22.723Z"
  labServiceRange?: string
  labPerformance?: string
  remark?: string
  unitExtent?: string
}

const ensureBearer = (t:string) => 'Bearer ' + t

// 统一 pkiaa：去空格 + 大写
export const normalizePkiaa = (s: unknown) => String(s ?? '').replace(/\s+/g,'').toUpperCase()

// 去除空值，避免传一堆 "" 和 undefined
export function pruneEmpty<T extends Record<string, any>>(obj: T): T {
  const r: any = {}
  Object.keys(obj || {}).forEach(k => {
    const v = (obj as any)[k]
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return
    r[k] = v
  })
  return r
}

export async function addDxsjgForApp(payload: AddDxsjgPayload): Promise<any> {
  const token = String(uni.getStorageSync('token') || '')
  const res = await uni.request({
    url: 'api/Dxsjgxxb/AddDxsjgxxbForApp',
    method: 'POST',
    data: payload,
    header: {
      Authorization: ensureBearer(token),
      'Content-Type': 'application/json'
    }
  })
  if (res.statusCode !== 200 || !res.data) throw new Error('新增监测机构失败')
  const ok = (res.data as any).success ?? true
  if (!ok) throw new Error((res.data as any).msg || '新增失败')
  return (res.data as any).response ?? (res.data as any).data ?? res.data
}

/** 跨端把本地文件路径读成纯 base64（不带 data: 前缀） */
export async function pathToBase64(path: string): Promise<string> {
  // 小程序 / H5（FileSystemManager可用）
  const fsm = (uni as any).getFileSystemManager?.()
  if (fsm) {
    return await new Promise<string>((resolve, reject) => {
      try {
        fsm.readFile({
          filePath: path,
          encoding: 'base64',
          success: (r:any) => resolve(r.data),
          fail: reject
        })
      } catch (e) { reject(e) }
    })
  }
  // H5（fetch blob）
  if (typeof window !== 'undefined') {
    const resp = await fetch(path)
    const blob = await resp.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = reject
      fr.readAsDataURL(blob)
    })
    return (dataUrl.split(',')[1]) || ''
  }
  // App-Plus 兜底
  // @ts-ignore
  if (typeof plus !== 'undefined' && plus.io) {
    return await new Promise<string>((resolve, reject) => {
      // @ts-ignore
      plus.io.resolveLocalFileSystemURL(path, (entry:any) => {
        entry.file((file:any) => {
          const reader = new FileReader()
          reader.onload = (e:any) => resolve(String(e.target.result).split(',')[1] || '')
          reader.onerror = reject
          reader.readAsDataURL(file)
        }, reject)
      }, reject)
    })
  }
  throw new Error('无法读取文件为 base64')
}
