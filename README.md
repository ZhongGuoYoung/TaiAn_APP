# 泰安环境评估 App（TaiAn_APP）

基于 **Uni-app 3 + Vue 3 + TypeScript + Pinia + uView Plus + Vite** 的多端环境监管业务 App，主要面向泰安市的：

- 企业执法检查任务管理  
- 地下水监测井及采样流程管理  
- 实验室机构管理与送检  
- 企业环境评估打分与照片取证  
- 个人中心、模式切换（采样 / 执法）

支持 H5、小程序和 App 多端构建。

---

## 一、主要功能模块概览

> 以下对应 `src/pages` 目录下的页面文件。

### 1. 登录与应用入口（`pages/login`）

- **账号密码登录**，支持图形验证码与短信验证码：
  - `src/api/login.ts` 统一封装登录相关接口。
- 登录密码使用 **SM2 国密算法** 加密：
  - `src/utils/crypto.ts` 中 `sm2EncryptPassword` 会对 `password + salt` 进行加密；
  - `Login/GetSalt` 接口下发 salt 与公钥。
- 登录成功后会保存用户信息，并在 `src/main.ts` 中做自动登录跳转：
  - 若本地 `userInfo.token` 存在且解密成功，会自动进入首页 `/pages/index/index`。

### 2. 首页 / 任务总览（`pages/index/index.vue`）

- 顶部 **搜索框 + 历史记录**（`HeaderSearch` 组件）。
- 中部 **地图视图**（基于 `ol` / OpenLayers），用于展示企业或监测井空间分布。
- 下方任务列表：
  - 支持按污染类型（`soil`, `water`, `double`）等筛选；
  - 支持按区域（如“泰安市”、区县等）过滤；
  - 支持点击进入具体企业或任务详情。
- 底部统一使用 `CustomTabBar` 作为主导航（任务 / 采样 / 我的）。

### 3. 执法任务管理（`pages/task`）

- `pages/task/index.vue`：
  - 展示 **企业列表**（`FirmCard` 组件）。
  - 支持关键字搜索、分页、区县筛选（如默认 “泰安市”）。
  - 逻辑上会根据 `lawStatusList = ["all", "done", "pending"]` 区分：
    - 全部企业
    - 已执法企业
    - 待执法企业
  - 用 `@/types/firm.ts` 统一企业数据结构。
- 通过点击企业卡片可进入评估或采样等后续业务流程。

### 4. 企业评估模块（`pages/evaluate`）

- `pages/evaluate/index.vue`：
  - 使用 `TaskCard` 列出 **评估任务**：
    - Tab：`全部 / 已评估 / 待评估`。
  - 每个任务包含多组评估项（打分、单选、文本、照片）。
- 评估项类型定义在 `src/types/evaluateItem.ts`：
  - `type: "radio" | "rate" | "textarea" | "photo"`；
  - 支持 `photos` 列表及 `base64` 图片上传（`PhotoUpload`）。
- `src/CONST/const.ts`：
  - 预配置每个任务的封面图片，如 `pwxkgl`（排污许可管理）、`yhpc`（隐患排查）等；
  - 提供企业展示随机图 `firmImgList`。

### 5. 地下水采样模块（`pages/sample`）

#### 5.1 采样总览（`pages/sample/samplehome.vue`）

- 地图 + 列表视图，结合区域 GeoJSON（`src/static/geoJson/370900.json`）与 `taian.json` 区划数据，实现：
  - 区域维度筛选监测井或企业；
  - 切换、定位等互动。
- 引入 `licenseGuard` 做功能有效期控制：
  - 截止时间定义在 `src/utils/licenseGuard.ts`；
  - 通过 `licenseLocked`、`guardLicense` 统一在 UI 层拦截到期操作。

#### 5.2 采样详情（`pages/sample/detail.vue`）

这是项目中较为核心、逻辑最复杂的页面之一，主要功能包括：

1. **监测井信息展示**  
   - 展示监测井名称、编号、类型、污染源名称、区县、位置等（`well` 对象）。

2. **采样基本信息表单**
   - 采样编号、采样时间、样品名称/序号、采样方法、采样深度、井结构、埋藏条件、含水层介质等字段；
   - 支持自动保存、提交、只读状态（`isReadonly` 根据 `SampleStatus === '已完成'`）。

3. **采样流程进度（竖线 + 圆点样式）**
   - `progressSteps` 管理多个步骤（如“洗井”“取样”“保存运输”“化验”等）；
   - 圆点颜色含义：
     - **蓝色**：已提交；
     - **红色**：当前步骤可操作；
     - **灰色**：未启用。
   - 自动根据步骤提交情况推导采样状态（待采样 / 采样中 / 已完成）。

4. **步骤图片采集与管理**
   - 点击 `+` **拍照上传**，针对不同步骤分别管理照片列表；
   - 图片支持预览、删除、文件名展示；
   - 支持存储拍摄经纬度、时间、备注等元数据；
   - 将所有步骤图片整理为统一的 `SampleProcessImages` 数组，提交给后端接口：
     - 包含 `sampleId`, `processType`, `photoIndex`, `shootLongitude`, `shootLatitude`, `shootTime`, `remark`, `photoUrl` 等信息；
     - 图片 URL 根据后端返回绝对路径，转化为相对路径上送。

5. **水印与区块链存证**
   - 使用隐藏 `canvas`（`watermarkCanvas`）进行图片 **加水印处理**（时间、位置等）；
   - 支持显示 **区块链存证信息**：
     - 交易哈希 `chainTxHash`、区块高度、上链时间等；
     - 对应弹窗 `u-popup` 展示。

6. **接口交互**
   - 页面初始化通过 `getSampleDetail` 请求后端详情，合并前端路由参数和后端返回数据；
   - 提交采样信息时使用 `UpdateWaterQualSample` 等接口（在项目实际对接中实现）。

### 6. 实验室管理模块（`pages/lab`）

- `pages/lab/create.vue`：
  - 新增地下水监测机构；
  - 表单字段包括：机构名称、机构编号、统一编号、行政区划、联系方式等。
- `pages/lab/check.vue`：
  - 选择监测机构（单选），列表支持：
    - 按名称 / 信用代码搜索；
    - `u-checkbox-group` 勾选；
    - `u-empty` 空态提示。

### 7. 监测井管理模块（`pages/well/add.vue`）

- 用于 **新建监测井**，对应类型 `AddWellPayload`（详见 `src/types/well.ts`）。
- 字段非常完整，包含：
  - 必填：监测井编码 `pkiaa`、区县 `district`、经纬度 `chahba/chahbb`；
  - 选填：行政区划、项目名称、设备编号、含水层、水源地、污染状况、埋深、水位、井深、管径、监测内容与类型等。
- 表单校验逻辑：
  - 针对必填项在 `errors` 中记录错误信息；
  - 失焦时调用 `validateField` 校验；
  - 提交时进行整体验证，通过后调用 `addMonitoringWell` 接口。

### 8. 个人中心 / 模式切换（`pages/home/index.vue`）

- 展示当前用户手机号、昵称等基础信息。
- 支持 **采样 / 执法模式切换**：
  - 根据 `user_app_permit` 中是否同时包含 “采样” 与 “执法” 判定是否为“双权限”用户；
  - 缓存当前模式到 `app_mode`；
  - `appModeText` 显示为 “采样 / 执法 / 未设置”。
- 提供若干功能入口（FunctionItem）：
  - 当前版本信息；
  - 消息、设置、清除缓存等（可在此基础上扩展）。
- 退出登录：
  - 清空本地缓存；
  - 重启到登录页 `/pages/login/index`。

---

## 二、技术栈与核心依赖

- **框架与运行时**
  - `@dcloudio/uni-app`（H5 / App / 小程序统一工程）
  - `Vue 3` + `TypeScript`
  - `Pinia` 状态管理
  - `uview-plus` UI 组件库（`u-form`、`u-input`、`u-button`、`u-popup` 等）
  - `Vite 5` + `@dcloudio/vite-plugin-uni`

- **业务 & 工具库**
  - `axios` / `@escook/request-miniprogram`（部分请求）
  - `dayjs` 时间处理
  - `lodash` 常用辅助函数
  - `crypto-js` 本地加解密（如 `encryptData` / `decryptData`）
  - `gm-crypto` 实现 **SM2 加密**
  - `ol`（OpenLayers） 地图引擎
  - `mockjs` 本地 mock 数据（视情况使用）

---

## 三、项目结构说明

### 顶层结构（节选）

```text
TaiAn_APP-main/
├─ .env.development           # 开发环境接口地址（VITE_BASE_URL）
├─ .env.production            # 生产环境接口地址
├─ package.json               # 依赖与脚本
├─ vite.config.ts             # Vite + uni 配置与代理
├─ tsconfig.json              # TypeScript 配置
├─ src/
│  ├─ App.vue                 # 根组件，初始化 license、路由等
│  ├─ main.ts                 # 入口，注册 uView, Pinia, 拦截器与自动登录
│  ├─ manifest.json           # uni-app 应用配置（应用名：泰安环境评估）
│  ├─ pages.json              # 页面路由与 tabbar 定义
│  ├─ api/                    # 业务接口封装（login、well、dxsjg 等）
│  ├─ components/             # 公共组件（BottomSheet, CustomTabBar, HeaderSearch 等）
│  ├─ pages/                  # 各业务页面（login, index, task, sample, evaluate, lab, well, home）
│  ├─ store/                  # Pinia Store（useMemberStore 等）
│  ├─ types/                  # TypeScript 类型定义（task, firm, well, evaluateItem 等）
│  ├─ utils/                  # 工具函数（http 拦截、request 封装、加密、licenseGuard 等）
│  ├─ static/                 # 静态资源（图标、背景图、区划 GeoJSON、泰安区县 JSON 等）
│  ├─ uni.scss                # 全局样式、主题色等
│  └─ env.d.ts / shims-uni.d.ts 等类型声明
└─ unpackage/                 # HBuilderX / 打包产物（可忽略）
