# 当前架构

更新时间：2026-07-26

本文档以当前工作树源码、数据库 Schema、测试和最新 Git 基线为准，是项目当前架构的权威说明。历史 Step 记录和阶段档案仅用于追溯，不作为当前实现结论。

## 当前交付边界

当前系统已经形成可在本地运行、测试和演示的科研成果管理系统主流程，覆盖成果、审批、费用、提醒、检索、看板、报表、审计、附件、账号、部门和涉密授权等模块。当前结论主要适用于本地、demo 和 synthetic 数据场景。

以下事项不能据此声称生产完成：生产部署、VPS 运维、生产数据库、真实身份系统、真实 HR/SSO、真实邮件或短信、真实财务/文献/专利/DOI 系统、生产 migration 应用、灾备和大规模性能验收。

## 真实目录结构

```text
E:\研究院科研成果管理系统
├─ apps/
│  ├─ api/                 NestJS API 与业务模块
│  └─ web/                 React/Vite 前端单页应用
├─ packages/
│  └─ shared/              前后端共享类型、DTO 和常量
├─ prisma/
│  └─ schema.prisma       当前数据库模型与枚举
├─ tests/
│  └─ acceptance/          可复用的本地验收脚本与证据生成脚本
├─ docs/                   当前长期文档
├─ scripts/                项目辅助脚本
├─ deploy/                 部署相关模板或说明，不代表已部署
├─ AGENTS.md
├─ package.json
└─ pnpm-workspace.yaml
```

## 技术形态

- 后端是 TypeScript + NestJS 的模块化单体应用。
- 前端是 React + Vite + Ant Design 的单页应用。
- 数据访问使用 Prisma，目标数据库为 PostgreSQL。
- 共享包承载前后端可复用的类型、DTO、枚举和业务常量。
- 测试使用 Vitest、Nest Testing、Supertest，以及用于浏览器验收的 Playwright CLI 脚本。
- 工作区使用 pnpm/Corepack 管理。

## 后端模块边界

| 模块 | 当前职责和边界 |
| --- | --- |
| Auth / Identity | 登录、会话、当前用户身份、开发/demo 身份与生产构建登录边界；不等于真实 SSO。 |
| Authorization / RBAC | 角色、权限、资源访问判断、部门范围和 guard/policy；当前覆盖应用内授权，不代表组织级 IAM 已接入。 |
| Achievements | 成果主数据、论文/专利/软件著作权等详情、贡献者和成果转化。 |
| Workflow | 审批实例、任务、动作和状态流转；当前是应用内固定业务流程。 |
| Fees | 费用记录和费用审核历史；当前以本地业务数据和规则为边界。 |
| Reminders | 提醒任务、SLA 配置、扫描记录和通知记录；当前不承诺真实邮件/短信投递。 |
| Attachments | 附件元数据、访问控制和上传/下载边界；存储适配器是否连接真实对象存储需另行验收。 |
| Search | 应用内检索、搜索日志和查询边界；不等于外部文献或专利检索服务。 |
| Dashboard | 工作台和固定聚合指标；不等于完整 BI 平台。 |
| Audit | 审计日志和可追溯记录；不等于生产级不可抵赖审计系统。 |
| Reports | 固定报表和自定义报表 MVP；不等于完整 BI、定时推送和复杂导出平台。 |
| Account Management | 用户账号、角色或生命周期管理的应用内能力；不等于 HR/SSO 主数据同步。 |
| Department Management | 部门及其范围管理；当前以系统内组织数据为准。 |
| Secret Authorization | 涉密访问授权和边界检查；当前能力有明确限制，不能声称已完成完整保密管理体系。 |
| Imports | 导入任务、运行记录和条目状态；当前支持本地/demo 边界，不等于生产数据迁移和回滚体系。 |

## 数据访问分层与数据流

```text
React 页面
  → Web API client / 请求状态
  → NestJS Controller
  → Auth guard / RBAC / 资源策略
  → Service / 业务编排
  → Repository 或 Prisma 数据访问
  → PostgreSQL
```

Controller 负责协议和输入输出，guard/policy 负责身份与权限边界，Service 负责业务规则和事务编排，Repository/Prisma 负责持久化。部分模块仍直接在 Service 中组合 Prisma 查询，后续可按真实复杂度继续收敛 Repository 边界；本 Step 不进行代码重构。

## 认证、身份和访问边界

### 开发、本地 demo 身份

开发模式可以使用代码内的 demo 身份控制和 synthetic 数据，便于本地开发与测试。它只代表应用内权限路径可被演示，不代表真实用户认证已经完成。

### 生产构建登录身份

生产构建使用登录和会话接口（包括当前用户 `/me` 路径），不应依赖开发 demo 控件或 demo header。当前生产构建登录链路可以作为应用边界使用，但真实身份提供方、SSO、HR 主数据和生产部署尚未验收。

### 权限、部门、涉密和附件

- 角色与权限由应用内 RBAC 模型表达。
- 部门隔离由用户部门、资源范围和授权策略共同决定，具体效果仍需系统级角色和业务流程验收。
- 涉密访问需要通过 Secret Authorization 相关边界；当前不能把页面可见或接口可调用等同于完整涉密合规。
- 附件访问必须同时考虑资源归属、部门范围、涉密授权和附件自身权限；当前本地流程可验收，真实对象存储、病毒扫描、生命周期和外链安全尚未完成。

## 数据模型概览

Schema 当前主要分为以下数据域：

- 身份与组织：`Department`、`User`、`UserCredential`、`UserSession`、`LoginAttempt`、`AccountLifecycleToken`。
- 授权：`Role`、`Permission`、`RolePermission`、`UserRole`、`ResourceAccessGrant`。
- 成果：`Achievement`、论文/专利/软件著作权详情、`AchievementContributor`、`AchievementConversion`。
- 流程：`WorkflowInstance`、`WorkflowTask`、`WorkflowAction`。
- 费用与提醒：`FeeRecord`、`FeeReviewHistory`、`ReminderTask`、`ReminderSlaPolicyConfig`、`ReminderSlaScanRun`、`Notification`。
- 文件与审计：`Attachment`、`AuditLog`。
- 外部与检索：`ApiIntegration`、`ApiCallLog`、`SearchLog`。
- 导入：`ImportJob`、`ImportRun`、`ImportJobItem`。

Schema 中存在模型不等于相关生产基础设施已经部署，也不等于 migration 已在生产应用。

## 外部适配器与 mock 边界

外部系统接口、通知发送、搜索扩展、文件存储和导入能力应通过适配器或配置边界隔离。当前测试和本地演示使用 fake/mock/in-memory 或 synthetic 依赖的部分，只能证明应用编排和错误边界，不证明真实外部系统可用。真实邮件、短信、财务、文献、专利、DOI、HR/SSO、对象存储和生产数据库必须单独授权、配置和验收。

## 前端架构边界

`apps/web/src/App.tsx` 当前通过 `activeKey` 和条件分支管理主要页面入口，尚未形成正式路由、深链接、浏览器返回和 URL 状态策略。页面多数使用本地请求状态和组件级状态，尚无统一的全局数据缓存策略。`StateBlocks.tsx` 提供加载、错误、空状态、权限提示和边界提示等共享状态组件。

当前主要入口为：工作台、成果、审批、费用、提醒、检索、看板、自定义报表、审计、系统配置、涉密授权、账号管理、部门管理。

## 测试分层与验收能力

- Shared：共享类型、常量和基础逻辑测试。
- API 单元/集成边界：Service、Repository/fake、DTO、guard、controller、权限和业务规则测试。
- Web：页面状态、组件交互、请求映射和表单行为测试。
- 验收脚本：Node/浏览器脚本可生成本地验收证据，但脚本执行成功不等于完成独立浏览器视觉验收。
- 仓库门禁：测试、typecheck、build、lint 和 `git diff --check`。

## 当前已完成能力与明确缺口

当前已形成可本地验证的主流程和对应测试基线，但仍有以下缺口：

- `App.tsx` 的 `activeKey` 页面切换策略尚未完成正式路由决策。
- UI 尚未建立独立的桌面、平板、移动浏览器视觉基线。
- API 请求、缓存、错误和重试策略仍分散在页面和模块中。
- 真实外部系统、生产身份、生产部署、生产 migration、灾备和大规模性能尚未验收。
- Web 构建仍存在大 bundle 警告，需要后续专项优化。

## 阶段六架构基线评审结论

- 当前采用模块化单体、Web/API/Shared/Prisma 分层和适配器边界，能够作为后续功能任务的架构基线。
- 当前模块清单、数据域、认证/授权边界和本地 demo/生产构建身份边界与源码及 Schema 一致；本阶段不复制为第二套架构、数据模型或安全模型文档。
- `App.tsx` 使用 `activeKey` 和条件分支管理页面入口，正式路由、深链接、浏览器返回和 URL 状态策略仍是待决架构决策；本阶段不修改代码。
- Web 请求状态、缓存和重试仍以页面/模块局部实现为主，尚未形成统一策略；后续应作为独立架构决策或功能任务处理。
- 真实身份、外部系统、生产数据库、生产 migration、对象存储、灾备和大规模性能仍不属于当前生产完成结论。

上述缺口是明确的后续任务，不在本阶段修改代码。
