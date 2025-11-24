// src/types/well.ts
export interface AddWellPayload {
  // ===== 必填（置顶） =====
  pkiaa: string;     // 监测井编码
  district: string;  // 区县
  chahba: number;    // 监测井中心经度(十进制度) numeric(18,6)
  chahbb: number;    // 监测井中心纬度(十进制度) numeric(18,6)

  // ===== 非必填（放在下面“更多信息”里） =====
  ysbh?: string;
  province?: string;
  city?: string;
  saasdm?: string;
  wellName?: string;
  longitude?: string;   // 经度-度分秒（展示/可改）
  latitude?: string;    // 纬度-度分秒（展示/可改）
  xCoordinateCgcs2000?: number; // numeric(18,3)
  yCoordinateCgcs2000?: number; // numeric(18,3)
  zCoordinate?: number;         // numeric(18,3)
  locationDescription?: string;
  isNewWell?: string;
  serialNumber?: string;
  projectName?: string;
  equipmentCode?: string;
  watershed?: string;
  waterPartition?: string;
  levelSwdzCode?: string;
  oneLevelSwdzCode?: string;
  twoLevelSwdzCode?: string;
  aquiferStratumCode?: string;
  aquiferLithology?: string;
  jcdx?: string;
  isGjdxsjcgc?: string;
  isGjkh?: string;
  isCityKh?: string;
  isRegionalMonitor?: string;
  regionalMonitorType?: string;
  isPollutionMonitor?: string;
  sswryCode?: string;
  wryName?: string;
  pollutionMonitorType?: string;
  isWaterSource?: string;
  sssydCode?: string;
  waterSourceName?: string;
  waterSourceMonitorType?: string;
  isPollutionDiffusion?: string;
  isPollutionInternal?: string;
  cjsj?: string; // 成井时间 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss
  initialWaterLevel?: number; // numeric(18,3)
  jswms?: number;             // numeric(18,3)
  jkgc?: number;              // numeric(18,3)
  jknj?: number;              // numeric(18,3)
  cjsd?: number;              // numeric(18,3)
  jgcz?: string;
  mctj?: string;
  hsjjlx?: string;
  hasMultipleScreens?: string;
  screenLength?: number;        // numeric(18,3)
  screenTopDepth?: number;      // numeric(18,3)
  screenBottomDepth?: number;   // numeric(18,3)
  sealingMaterial?: string;
  sealingStartDepth?: number;   // numeric(18,3)
  sealingEndDepth?: number;     // numeric(18,3)
  meetsStandards?: string;
  boreholeLogDiagramFileData?: string; // base64（不带 data: 前缀）
  boreholeLogDiagramFileName?: string; // 与上配套
  managementUnit?: string;
  jcjSsdw?: string;
  currentCondition?: string;
  wellNature?: string;
  monitoringMethod?: string;
  monitoringContent?: string;
  monitoringType?: string;
  currentDepth?: number;        // numeric(18,3)
  isMaintained?: string;
  maintenanceUnit?: string;
  siltationStatus?: string;
  isLongTerm?: string;
  needSealing?: string;
  isSealed?: string;
  monitoringStartDate?: string; // yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss
  monitoringEndDate?: string;   // yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss
  waterExtraction?: string;
  monitoringFrequency?: string;
  monitoringParameters?: string; // text
  contactPerson?: string;
  contactPhone?: string;
  remark?: string;
}
