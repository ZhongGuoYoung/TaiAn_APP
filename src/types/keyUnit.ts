export interface KeyUnit {
  // 基本信息
  unitCode: string; // 单位编号
  unitName: string; // 单位名称
  uscc: string; // 统一社会信用代码
  keyUnitType: string; // 重点单位类别
  emissionpermitCode: string; // 排污许可证编号
  province: string; // 省
  city: string; // 市
  district: string; // 县区
  township: string; // 乡镇
  saasdm: string; // default value "370000" // 组织机构代码
  industryClassification: string; // 行业分类
  otherIndustryClassification: string; // 其他行业类别
  chahba: string; // 中心经度（十进制度）
  chahbb: string; // 中心纬度（十进制度）
  jddfs: string; // 中心经度（度分秒）
  weidfs: string; // 中心纬度（度分秒）
  environmentalContact: string; // 环保联系人
  contactMobile: string; // 联系人手机号
  contactPhone: string; // 联系人电话
  faxNumber: string; // 传真号码
  email: string; // 电子邮箱
  operationYears: string; // 运营年限
  firstIncludedTime?: Date; // 首次纳入名录时间
  isInProductionHighRisk: string; // 是否在产高风险企业
  mainMaterials: string; // 主要原辅材料
  mainProducts: string; // 主要产品
  characteristicPollutants: string; // 特征污染物
  modificationDescription: string; // 修改说明
  basicInformationState: string; // 基本信息审核状态
  selfMonitoringState: string; // 自行监测审核状态
  dangerInvestigationState: string; // 隐患排查审核状态
  otherLegalObligationsState: string; // 其他法定义务审核状态
  year: number; // 年份
  isFilled: string; // 是否填报完成
  isSubmitted: string; // 是否提交
  [key: string]: any;
}
