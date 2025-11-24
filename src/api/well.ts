// src/apis/well.ts
import type { AddWellPayload } from '@/types/well';

const withBearer = (t: string) => (t?.startsWith('Bearer ') ? t : (t ? `Bearer ${t}` : ''));

// 调试工具
const TAG = (m: string) => `[ADD-WELL] ${m}`;
const shorten = (v: unknown) => (typeof v === 'string' && v.length > 200 ? v.slice(0, 200) + `… (${v.length} chars)` : v);
const pretty = (o: unknown) => JSON.stringify(o, (_k, v) => shorten(v), 2);

export async function addMonitoringWell(body: AddWellPayload): Promise<string> {
  if (!body.pkiaa || !body.district || body.chahba == null || body.chahbb == null) {
    console.warn(TAG('缺少必填字段，请检查 pkiaa/district/chahba/chahbb'), body);
    throw new Error('缺少必填字段：pkiaa/district/chahba/chahbb');
  }

  // 不直接改入参，创建 payload
  const payload: AddWellPayload = {
    ...body,
    chahba: Number(Number(body.chahba).toFixed(6)),
    chahbb: Number(Number(body.chahbb).toFixed(6)),
  };

  const url = `http://geologygis.com:8864/api/AppInterface/AddTaianDxsjcjxxb`;
  const token = String(uni.getStorageSync('token') || '');
  const auth = withBearer(token);

  // ==== 调试：请求前打印 ====
  const t0 = Date.now();
  console.log(TAG('准备提交 JSON ↓↓↓'));
  console.log(TAG('URL ='), url);
  console.log(TAG('Authorization ='), auth ? auth.slice(0, 20) + '…' : '(空)');
  console.log(TAG('Headers ='), { 'Content-Type': 'application/json' });
  console.log(TAG('Body =\n') + pretty(payload));

  try {
    const res = await uni.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      data: payload,
    });

    // ==== 调试：响应后打印 ====
    const ms = Date.now() - t0;
    console.log(TAG(`响应 ← status=${res.statusCode}, 耗时=${ms}ms`));
    if (res?.header) console.log(TAG('响应头 ='), res.header);
    console.log(TAG('响应体 =\n') + pretty(res.data));

    if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
    const data = res.data as any;
    if (!data?.success) throw new Error(data?.msg || '新增监测井失败');

    const id = String(data.response ?? '');
    console.log(TAG('新增成功，返回ID ='), id);
    return id;
  } catch (err) {
    console.error(TAG('提交失败'), err);
    throw err;
  }
}
