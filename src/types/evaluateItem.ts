export interface EvaluateItem {
  id: string;
  type: string; // radio, rate, textarea, photo
  name: string;
  value: string | number | null;   // ✅ 改成兼容字符串
  totalRate?: number;
  photos?: string[];               // 接口返回的图片URL数组
  [key: string]: any;
}

export interface PhotoUpload {
  fileName: string;
  base64: string;
  remark?: string;
}

export interface Evaluate {
  title: string;
  element: EvaluateItem[];
  isWater?: boolean;
  isSoil?: boolean;
  photos?: PhotoUpload[]; // 提交时使用的base64
  [key: string]: any;
}

export interface HoleEvaluate {
  title: string;
  element: Evaluate[];   // 如果接口返回就是一层结构，可以简化成 EvaluateItem[]
  desc: string;
  allRate: number;
  [key: string]: any;
}
