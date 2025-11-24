// Path: src/CONST/const.ts
import type { Evaluate, HoleEvaluate } from "@/types/evaluateItem";

// 每个任务对应的图片Map
export const taskImages: Map<string, string> = new Map([
  ["pwxkgl", "/static/evaluate/pwxkgl.webp"],
  ["yhpc", "/static/evaluate/yhpc.webp"],
  ["ydyhwzpf", "/static/evaluate/ydyhwzpf.webp"],
  ["dxcgba", "/static/evaluate/dxcgba.webp"],
  ["zxjc", "/static/evaluate/zxjc.webp"],
  ["ffcchdwr", "/static/evaluate/ffcchdwr.webp"],
  ["xcgl", "/static/evaluate/xcgl.webp"],      
  ["qjscgl", "/static/evaluate/qjscgl.webp"], 
]);


// 公司的照片列表,随机的
export const firmImgList = [
  "/static/firmImages/firm1.webp",
  "/static/firmImages/firm2.webp",
  "/static/firmImages/firm3.webp",
  "/static/firmImages/firm4.webp",
  "/static/firmImages/firm5.webp",
  "/static/firmImages/firm6.webp",
  "/static/firmImages/firm7.webp",
];

// 整体规范化的评价指标
export const evaluateMap: Map<string, HoleEvaluate> = new Map([
  [
    "ydyhwzpf",
    {
      title: "有毒有害物质排放",
      element: [
        {
          title: "按年度向生态环境主管部门报告有毒有害物质排放情况",
          element: [
            {
              id: "0",
              type: "radio",
              name: "未按年度报告有毒有害物质排放情况",
              value: null,
            },
            {
              id: "1",
              type: "rate",
              name: "报告中废气、废水及固体废物等有毒有害物质名称、排放量等内容缺项、漏项",
              value: null,
              totalRate: 3,
            },
          ],
          isSoil: true,
          isWater: false,
          photos: [],
        },
        {
          title: "防止有毒有害物质污染土壤和地下水",
          element: [
            {
              id: "2",
              type: "radio",
              name: "涉及有毒有害物质的生产装置、储罐和管道，或者建设污水处理池、应急池等存在土壤污染风险的设施，未按照国家有关标准和规范要求，设计、建设和安装有关防腐蚀、防泄漏设施和泄漏监测装置",
              value: null,
            },
            {
              id: "3",
              type: "rate",
              name: "未提供存在土壤污染风险的设施相关防渗证明材料",
              value: null,
              totalRate: 3,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 6,
    },
  ],
  [
    "yhpc",
    {
      title: "隐患排查",
      element: [
        {
          title: "建立土壤污染隐患排查制度",
          element: [
            {
              id: "0",
              type: "radio",
              name: "未建立土壤污染隐患排查制度",
              value: null,
            },
            {
              id: "1",
              type: "rate",
              name: "隐患排查制度缺少相应机构和人员队伍、组织实施形式、排查工作计划、隐患整改方案等内容",
              value: null,
              totalRate: 2,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
        {
          title: "编制隐患排查报告",
          element: [
            {
              id: "2",
              type: "radio",
              name: "未编制隐患排查报告",
              value: null,
            },
            {
              id: "3",
              type: "rate",
              name: "隐患排查报告缺少有毒有害物质清单、重点场所和重点设施设备清单、隐患排查过程记录、隐患排查台账、隐患整改方案及附件等内容",
              value: null,
              totalRate: 3,
            },
            {
              id: "4",
              type: "rate",
              name: "有毒有害物质清单缺项、漏项，用企业产品、原辅材料及衍生物一览表代替有毒有害物质",
              value: null,
              totalRate: 3,
            },
            {
              id: "5",
              type: "rate",
              name: "重点场所和重点设施设备清单缺项、漏项，遗漏地下、半地下、接地的储罐、池体、管道；未逐一列出设施设备规格、类型等基础信息",
              value: null,
              totalRate: 3,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
        {
          title: "开展现场排查，建立隐患排查台账",
          element: [
            {
              id: "6",
              type: "radio",
              name: "未开展现场排查，未建立隐患排查台账",
              value: null,
            },
            {
              id: "7",
              type: "rate",
              name: "重点场所和重点设施设备现场排查缺项、漏项，排查过程记录不全",
              value: null,
              totalRate: 4,
            },
            {
              id: "8",
              type: "rate",
              name: "风险隐患点识别不准确，未发现有毒有害物质渗漏、流失、扬散等潜在风险隐患点",
              value: null,
              totalRate: 4,
            },
            {
              id: "9",
              type: "rate",
              name: "隐患排查台账缺少问题描述、现场图片、整改建议等内容",
              value: null,
              totalRate: 3,
            },
            {
              id: "10",
              type: "radio",
              name: "未按要求开展隐患排查“回头看”",
              value: null,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
        {
          title: "落实隐患整改，形成隐患整改台账",
          element: [
            {
              id: "11",
              type: "radio",
              name: "未制定隐患整改方案，未形成隐患整改台账”",
              value: null,
            },
            {
              id: "12",
              type: "rate",
              name: "隐患整改台账缺少隐患问题描述、整改情况、整改后现场图片、整改完成时间等内容”",
              value: null,
              totalRate: 3,
            },
            {
              id: "13",
              type: "rate",
              name: "隐患问题现场整改情况与台账记录不一致",
              value: null,
              totalRate: 4,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 29,
    },
  ],
  [
    "ffcchdwr",
    {
      title: "防范拆除活动污染",
      element: [
        {
          title: "拆除方案备案",
          element: [
            {
              id: "0",
              type: "radio",
              name: "拆除设施、设备或者建筑物、构筑物，未制定、实施土壤污染防治工作方案",
              value: null,
            },
            {
              id: "1",
              type: "rate",
              name: "未按照规定将土壤污染防治工作方案报生态环境、工业和信息化主管部门备案",
              value: null,
              totalRate: 2,
            },
            {
              id: "2",
              type: "rate",
              name: "《企业拆除活动污染防治方案》内容缺项、漏项",
              value: null,
              totalRate: 3,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
        {
          title: "土壤污染状况调查",
          element: [
            {
              id: "3",
              type: "radio",
              name: "生产经营用地的用途变更或者在其土地使用权收回、转让前，未按照规定进行土壤污染状况调查",
              value: null,
            },
            {
              id: "4",
              type: "rate",
              name: "未按照规定将土壤污染状况调查报告报生态环境主管部门备案",
              value: null,
              totalRate: 2,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 7,
    },
  ],
  [
    "dxcgba",
    {
      title: "储罐备案",
      element: [
        {
          title: "地下储罐备案",
          element: [
            {
              id: "0",
              type: "radio",
              name: "未将地下储罐信息经县（市、区）生态环境部门预审后，报市生态环境局备案",
              value: null,
            },
            {
              id: "1",
              type: "rate",
              name: "地下储罐备案信息缺项、漏项",
              value: null,
              totalRate: 3,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 3,
    },
  ],
  [
    "pwxkgl",
    {
      title: "排污许可管理",
      element: [
        {
          title: "在申请、变更排污许可证时，需在排污许可证中载明“三项法定义务”",
          element: [
            {
              id: "0",
              type: "radio",
              name: "未在排污许可证中载明“三项法定义务”：严格控制有毒有害物质排放，并按年度向生态环境主管部门报告排放情况；建立土壤污染隐患排查制度，保证持续有效防止有毒有害物质渗漏、流失、扬散；制定、实施自行监测方案，并将监测数据报生态环境主管部门",
              value: null,
            },
          ],
          isWater: false,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 0,
    },
  ],
  [
    "zxjc",
    {
      title: "自行监测",
      element: [
        {
          title: "制定自行监测方案",
          element: [
            {
              id: "0",
              type: "radio",
              name: "未制定、实施自行监测方案",
              value: null,
            },
            {
              id: "1",
              type: "rate",
              name: "自行监测方案未通过专家评审，未通过县（市、区）生态环境部门备案",
              value: null,
              totalRate: 3,
            },
            {
              id: "2",
              type: "rate",
              name: "自行监测方案缺少章节",
              value: null,
              totalRate: 3,
            },
            {
              id: "3",
              type: "rate",
              name: "重点监测单元识别缺项、漏项",
              value: null,
              totalRate: 3,
            },
            {
              id: "4",
              type: "rate",
              name: "监测点数量不足，未布设对照点",
              value: null,
              totalRate: 3,
            },
          ],
          isWater: true,
          isSoil: true,
          photos: [],
        },
        {
          title: "开展自行监测",
          element: [
            {
              id: "5",
              type: "radio",
              name: "未开展自行监测",
              value: null,
            },
            {
              id: "6",
              type: "rate",
              name: "监测报告中缺项、漏项",
              value: null,
              totalRate: 3,
            },
            {
              id: "7",
              type: "rate",
              name: "未按监测频次开展监测",
              value: null,
              totalRate: 4,
            },
            {
              id: "8",
              type: "rate",
              name: "目标采样层无土壤可采或地下水埋藏条件不适宜采样的区域，未提供地勘资料予以说明",
              value: null,
              totalRate: 3,
            },
            {
              id: "9",
              type: "rate",
              name: "未提供实验室CMA检测报告",
              value: null,
              totalRate: 3,
            },
          ],
          isWater: true,
          isSoil: true,
          photos: [],
        },
        {
          title: "自行监测结果分析及运用",
          element: [
            {
              id: "10",
              type: "radio",
              name: "篡改、伪造监测数据",
              value: null,
            },
            {
              id: "11",
              type: "rate",
              name: "未开展自行监测数据异常分析",
              value: null,
              totalRate: 4,
            },
            {
              id: "12",
              type: "rate",
              name: "对于数据超标或异常的，未制定、落实整改措施",
              value: null,
              totalRate: 4,
            },
          ],
          isWater: true,
          isSoil: true,
          photos: [],
        },
        {
          title: "监测结果公开",
          element: [
            {
              id: "13",
              type: "radio",
              name: "未将自行监测数据报生态环境主管部门",
              value: null,
            },
            {
              id: "14",
              type: "rate",
              name: "自行监测结果未向社会公开；未提供公司网站、公众号或其他网站公开形式的佐证材料",
              value: null,
              totalRate: 4,
            },
          ],
          isWater: true,
          isSoil: true,
          photos: [],
        },
        {
          title: "自动监测",
          element: [
            {
              id: "15",
              type: "radio",
              name: "未安装水污染物排放自动监测设备；监测设备未与生态环境主管部门的监控设备联网；监测设备不正常运行",
              value: null,
            },
            {
              id: "16",
              type: "radio",
              name: "侵占、毁坏或者擅自移动地下水监测设施设备及其标志，干扰自动监测设施",
              value: null,
            },
          ],
          isWater: true,
          isSoil: false,
          photos: [],
        },
      ],
      desc: "",
      allRate: 37,
    },
  ],
  [
    "hjyxpj",
    {
      title: "环境影响评价",
      element: [
        {
          title: "依法进行环境影响评价，完成“三同时”验收",
          element: [
            {
              id: "0",
              type: "radio",
              name: "环境影响评价文件未对废水、废气、固体废物等产生种类、产生量、产生环节等进行描述；未对储存、利用、处置设施进行评价，未完成“三同时”验收",
              value: null,
            },
          ],
          isWater: true,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 0,
    },
  ],
  [
    "xcgl",
    {
      title: "现场管理",
      element: [
        {
          title: "治污设施正常运行，现场规范管理",
          element: [
            {
              id: "0",
              type: "radio",
              name: "利用渗井、渗坑、裂隙、溶洞，私设暗管，或者不正常运行水污染防治设施等逃避监管的方式排放水污染物",
              value: null,
            },
            {
              id: "1",
              type: "radio",
              name: "利用无防渗漏措施的沟渠、坑塘等输送或者存贮含有毒污染物的废水、含病原体的污水或者其他废弃物",
              value: null,
            },
            {
              id: "2",
              type: "rate",
              name: "废水收集处理设施建设运行不规范，现场雨污分流措施不到位",
              value: null,
              totalRate: 5,
            },
            {
              id: "3",
              type: "rate",
              name: "一般工业固体废物、危险废物储存场所地面硬化及防渗存在磨损，现场存在“跑、冒、滴、漏”情况",
              value: null,
              totalRate: 5,
            },
            {
              id: "4",
              type: "rate",
              name: "废气治理设施建设运行不规范，现场有异味",
              value: null,
              totalRate: 5,
            },
          ],
          isWater: true,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 15,
    },
  ],
  [
    "qjscgl",
    {
      title: "清洁生产管理",
      element: [
        {
          title: "实施清洁生产",
          element: [
            {
              id: "0",
              type: "rate",
              name: "未合理选择利用原材料、能源和其他资源；未采用先进生产工艺和设备，减少废物产生量，降低危害性",
              value: null,
              totalRate: 3,
            },
          ],
          isWater: true,
          isSoil: true,
          photos: [],
        },
      ],
      desc: "",
      allRate: 3,
    },
  ],
]);
