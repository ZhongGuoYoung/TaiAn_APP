// /src/api/dxsjg.ts
export interface DxsjgItem {
  pkiaa: string
  unitCode: string
  unitName: string
  unitNature?: string
  legarUrl?: string
  personScale?: string
  qualificationsUrl?: string
  fzr?: string
  contactWay?: string
  uscc?: string
  chahba?: string
  chahbb?: string
  unitExtent?: string
  labAddress?: string
  province?: string
  city?: string
  district?: number | string
  saasdm?: string
  sortNum?: number
  labType?: string
  labQualification?: string
  qualificationExpiry?: string
  labServiceRange?: string
  labPerformance?: string
  remark?: string
  Id: number
  Gid: string
}

export interface DxsjgQuery {
  keyword?: string
  uscc?: string
  unitName?: string
  district?: number
}

const ensureBearer = (t:string) => 'Bearer ' + t

// 与监测井 pkiaa 比对时统一：去空格 + 大写
export const normalizePkiaa = (s: unknown) =>
  String(s ?? '').replace(/\s+/g, '').toUpperCase()

// /src/api/dxsjg.ts
export async function fetchAllDxsjgList(q: DxsjgQuery = {}): Promise<DxsjgItem[]> {
  const token = String(uni.getStorageSync('token') || '')

  // 只传有值的查询项，避免出现 null/undefined
  const data: Record<string, any> = {}
  if (q.keyword)  data.keyword  = q.keyword
  if (q.uscc)     data.uscc     = q.uscc
  if (q.unitName) data.unitName = q.unitName
  if (typeof q.district === 'number') data.district = q.district

  const res = await uni.request({
    url: 'api/Dxsjgxxb/GetAllDxsjgxxbList',
    method: 'GET',
    data, // ← 让 uni 自动拼接查询串，跨端安全
    header: { Authorization: 'Bearer ' + token }
  })

  if (res.statusCode !== 200 || !res.data) throw new Error('获取监测机构失败')
  const ok = (res.data as any).success ?? true
  if (!ok) throw new Error((res.data as any).msg || '接口返回失败')

  const rows = (res.data as any).response || (res.data as any).data || []

  // 统一字段与类型：兼容 id/Gid 大小写、字符串数字
  return (Array.isArray(rows) ? rows : []).map((r: any) => ({
    ...r,
    pkiaa: String(r.pkiaa ?? r.PKIAA ?? r.Pkiaa ?? '').trim(),
    Id: Number(r.Id ?? r.id ?? 0),
    Gid: String(r.Gid ?? r.gid )
  }))
}

