# 项目证据记录

更新时间：2026-07-26

## 当前证据摘要

最新证据属于第二个垂直切片“部门审核成果”，结果以文末该切片章节为准；前面的阶段三和首个切片内容保留为历史证据。

## 阶段三 Step 1 证据

| 检查对象 | 结果 |
| --- | --- |
| 项目规则、README | 已读取，用于确认目录、质量门禁和安全边界 |
| Web 页面入口与组件 | 已读取，确认 `App.tsx` 的 `activeKey` 分支和当前 13 个主要入口 |
| API 模块目录 | 已读取，确认 Auth、Identity、RBAC、成果、流程、费用、提醒、附件、检索、报表、导入等边界 |
| Prisma Schema | 已读取，确认身份、授权、成果、工作流、费用、提醒、附件、审计、外部调用和导入模型 |
| 当前长期文档 | 已读取并以源码、测试和最新 Git 基线校正 |
| 架构/技术栈文档 | 已刷新 |
| UI 设计规格 | 已刷新为当前真实 UI 结构和状态边界 |
| 需求完成度矩阵 | 已补充本地/demo/mock/生产边界 |
| 项目管理记录 | 已标记阶段一、阶段二、阶段三 Step 0 和 Step 1 状态 |

## 最近质量门禁

最近基线的 API、Web、Shared 测试、typecheck、build 和 lint 均通过；build 保留 Web 大 bundle 警告。本文档刷新后另执行 `git diff --check` 和变更范围检查。

## 本 Step 明确未执行

- 未修改业务代码、测试代码、配置代码或数据库 Schema。
- 未执行数据库、migration、导入、生产、VPS 或真实外部系统操作。
- 未读取或写入 `.env`、Cookie、Token、密码、私钥或真实连接串。
- 未删除文件，未清理临时目录。
- 未提交、未推送、未合并。
- 未把自动化脚本结果写成独立浏览器视觉验收结果。

## 当前剩余风险

正式路由、API 状态管理、真实身份、外部系统、生产部署和生产数据仍需独立任务和授权；此前 UI 现状摸底记录见下文，不作为正式设计基线或完整视觉验收证据。

## 整改阶段六架构与 UI 基线证据

| 检查对象 | 结果 |
| --- | --- |
| Web 入口 | 通过源码确认 `App.tsx` 使用 `activeKey` 和条件分支管理页面，尚无正式路由和 URL 状态策略 |
| API 模块 | 通过目录确认 Auth、Identity、Authorization/RBAC、成果、流程、费用、提醒、附件、检索、报表、审计、账号、部门、涉密和导入边界 |
| 身份模式 | 通过源码确认开发/demo 身份适配器与生产 Session 身份适配器分开；真实 HR/SSO 仍未验收 |
| 数据模型 | 通过 `prisma/schema.prisma` 确认身份组织、授权、成果、流程、费用、提醒、附件、审计、外部调用和导入数据域 |
| UI 入口 | 通过源码确认 13 个主要导航入口、桌面侧栏、约 960px 平板行为和约 640px 移动行为 |
| UI 设计基线 | 五个核心页面、状态、响应式、安全展示和浏览器验收规则已形成；视觉方向、Token、字体候选和优先级已由用户确认 |
| 文档一致性 | 已更新架构、技术栈、设计、需求、路线、当前任务、实施计划、进度、证据、决策和下一阶段入口 |

### 阶段六结论

架构基线已收口，UI 规格已完成文档评审；本阶段不等同于 UI 实现、浏览器视觉通过、CI 完成或生产验收。现有 UI 摸底中的 `UI-STEP2-001`、`UI-STEP2-002` 和 `ENV-STEP2-001` 继续作为后续问题与环境阻塞记录。

### 本阶段未执行

- 未修改业务代码、测试、配置或数据库 Schema；
- 未执行数据库、migration、导入、生产、VPS 或真实外部系统操作；
- 未读取或写入 `.env`、Cookie、Token、密码、私钥或真实连接串；
- 未删除、移动、清理、提交、推送、合并或重置；
- 未把文档、脚本、截图或服务不可用页面写成浏览器视觉或生产验收通过。

## 工程基线与首个任务卡证据（2026-07-26）

| 检查对象 | 结果 |
| --- | --- |
| UI 决策 | 用户已确认视觉方向、Token 起点、字体候选和五个核心页面优先级 |
| GitHub Actions | 已创建并提交 `.github/workflows/quality-gates.yml`（`baa5f2c`），配置测试、typecheck、build 和 lint；等待 PR 触发远程运行 |
| PR 规范 | 已创建 `.github/pull_request_template.md`，包含范围、验收、门禁、浏览器证据、安全和回滚栏目 |
| 首个垂直切片 | 已写入并提交 `docs/project-management/current-task.md`（`3674ecb`），尚未建立功能实现分支或修改业务代码 |
| 远程状态 | `agent/engineering-baseline` 已推送并跟踪 `origin/agent/engineering-baseline`；尚未创建 PR、合并或配置分支保护 |

### 工程基线发布证据

- 发布分支：`agent/engineering-baseline`。
- 相对 `origin/main` 的新增提交：`340f715`、`baa5f2c`、`3674ecb`。
- 推送后本地与远程分支差异：`0 0`；工作区干净。
- 本地门禁：测试、typecheck、build、lint 和 `git diff --check` 均通过；Web 大 bundle 警告仍存在。
- 远程 CI：尚未因 PR 触发；当前工作流仅对 `main` push 和面向 `main` 的 PR 运行。

### 当前任务卡验收边界

首个切片只承诺 local/demo/synthetic 与受控测试数据场景；真实身份、生产数据、真实外部系统、生产部署和 Schema/migration 变更均不在范围内。任务卡规定：若无法使用可复现的本地数据库或测试 fixture 证明持久化，任务必须阻塞，不得用 mock 结果替代。

## 整改阶段四文档边界证据

### 资产分类结论

| 类别 | 当前结论 | 证据与处理边界 |
| --- | --- | --- |
| 当前事实文档 | 保留在 `README.md`、`AGENTS.md` 和 `docs/` | 架构、设计、测试、需求和项目管理文档按职责维护 |
| `docs/operations/` | 长期运行资产 | 包含生产就绪、备份、恢复、导入安全和授权运行手册，不作为垃圾或阶段日志处理 |
| 阶段归档 | 历史追溯/交接 | 外部阶段档案不是当前工作树、架构或任务权威来源 |
| Prompt/Step 历史 | 不进入当前长期文档 | 保持外部归档或已有删除候选状态，本 Step 不删除 |
| 完整终端输出、原始浏览器痕迹、临时构建物 | 不进入当前长期文档 | 只保留脱敏摘要和可复现结论 |
| Git 变更历史 | 由 Git 和 PR 承担 | 项目文档不重复记录每次操作流水账 |

### 当前入口

- 项目路线：`docs/project-management/roadmap.md`
- 当前任务：`docs/project-management/current-task.md`
- 当前架构：`docs/architecture/architecture.md`
- 当前 UI：`docs/design/design-spec.md`
- 测试策略：`docs/testing/testing-strategy.md`
- Git/GitHub 唯一规范：`E:\Vibe coding\vibe-methodology\07-git-delivery.md`

## 此前 UI 现状摸底记录（原阶段三 Step 2，现作为 Step 3 输入）

验收日期：2026-07-25

### 环境与范围

| 项目 | 结果 |
| --- | --- |
| Web 地址 | `http://localhost:5173/` |
| Web 服务 | 已启动并可访问 |
| API 服务 | 启动失败，原因是本地运行环境缺少 `DATABASE_URL`；没有执行数据库操作 |
| 角色 | 本地 demo 的科研人员、系统管理员 |
| 浏览器尺寸 | `1440 × 900`、`1024 × 768`、`390 × 844` |
| 截图证据 | 已在本次浏览器会话中即时查看；未将原始浏览器 Profile、Cookie、Token 或一次性截图写入仓库 |

### 页面覆盖

系统管理员角色下，以下 13 个导航入口均实际打开并读取了页面状态：

工作台、成果管理、审批管理、费用管理、提醒中心、检索中心、统计看板、自定义报表、审计日志、系统配置、涉密授权管理、账号管理、部门维护。

科研人员角色下验证了权限范围导航，以及系统配置页面的无权访问状态。

### 结果分类

#### 通过

- 桌面端应用外壳、身份区、左侧导航和主内容区可见。
- 平板端未观察到页面级横向溢出。
- 移动端切换为横向导航，核心导航入口可见并可切换。
- 角色切换后身份区和权限范围导航随角色变化。
- 服务不可用状态包含说明和重试按钮。
- 系统配置在科研人员角色下显示无权访问提示，没有暴露敏感内容。

#### 条件通过

- 移动端 `390 × 844` 出现页面级横向滚动迹象。横向导航本身是预期设计，但成果等长内容页面需要后续确认溢出是否被限制在正确容器。
- 多数业务页面可以打开，但由于 API 不可用，只能验收页面壳层、错误状态和权限状态。

#### 无法验收

- 正常 synthetic 数据列表和详情。
- 成果创建/编辑提交、审批动作、费用操作和提醒处理。
- 附件上传、下载和预览。
- 完整加载过程、真实空数据和成功反馈。
- 生产构建登录页和会话失效流程。
- 真实外部系统、真实通知和生产数据流程。

#### 后续问题

- `UI-STEP2-001`：工作台/成果入口仍显示“计划确认后再实现”，与当前页面实现不一致。
- `UI-STEP2-002`：移动端页面级横向滚动，需要区分导航/表格预期滚动与页面整体溢出。
- `ENV-STEP2-001`：本地 API 因缺少 `DATABASE_URL` 无法启动，阻塞真实业务流程验收。

## Step 2 结论

本 Step 的浏览器基线已部分建立，但不能标记为完整通过。应先恢复可验证的本地 API/demo 数据运行条件，并处理两个 UI 后续问题，再重新执行正常数据和核心业务流程验收。

## 第二个垂直切片：部门审核成果（2026-07-26）

### 验收范围

任务：部门审核人员查看分配任务，审核通过或驳回成果。

环境：本地 Docker Web、临时 staging API、本地 PostgreSQL、synthetic 身份和数据；`productionAcceptance: false`。没有访问生产数据、真实外部系统或真实身份系统。

### 真实数据库与权限闭环

验收运行器：`tests/acceptance/phase-1/department-review-achievement-acceptance.mjs`。

- 审核人员可以读取自己的待审核任务并打开关联成果详情；
- 审核通过后成果为 `PENDING_ARCHIVE`，工作流为 `ACTIVE/ARCHIVE`，任务为 `APPROVED`；
- 审核驳回后成果为 `DEPARTMENT_REJECTED`，工作流为 `COMPLETED`，任务为 `REJECTED`；
- 无关部门任务列表为空，同部门非指派人和跨部门访问被拒绝，未登录返回 `401`；
- 驳回原因为空返回 `422`；重复通过和重复驳回返回 `409`；
- 2 个审核任务分别只有 1 个审核动作和 1 个审核审计记录，未产生重复记录；
- 审核动作、任务、工作流和成果状态均在真实本地 PostgreSQL 中持久化。

### 浏览器证据

脚本：`tests/acceptance/phase-1/department-review-achievement-browser.js`。

| 尺寸 | 操作 | 结果 |
| --- | --- | --- |
| 1440 × 900 | 打开详情、查看关联成果、审核通过、刷新 | 通过；任务不再出现在待审核列表；无横向溢出 |
| 1024 × 768 | 打开详情、查看关联成果、检查操作区 | 通过；无横向溢出 |
| 390 × 844 | 空驳回原因拦截、填写原因驳回、刷新 | 通过；任务不再出现在待审核列表；无横向溢出 |

三种尺寸均无控制台错误和页面错误。截图证据：

- `output/playwright/department-review-desktop.png`；
- `output/playwright/department-review-tablet.png`；
- `output/playwright/department-review-mobile.png`。

### 全量质量门禁

- API 1031、Web 440、Shared 1 个测试通过；
- typecheck、lint、build 通过；
- Web 仍有既有主 bundle 约 1.5 MB 的构建警告，未扩大本切片范围处理；
- 三个验收脚本语法检查和 ESLint 通过；
- `git diff --check` 通过。

### 交付边界

本次只完成本地分支上的实现、验收脚本和长期证据更新，尚未提交、推送、创建 PR 或合并；本地临时 staging 容器停止后不作为长期资产，临时截图目录不加入 Git。
# 首个垂直切片本地验收证据（2026-07-26）

## 验收范围

任务：科研人员创建成果草稿并提交审批。

环境：本地 Docker Web、临时 staging API、本地 PostgreSQL、synthetic 身份和数据；`productionAcceptance: false`。没有访问生产数据、真实外部系统或真实身份系统。

## 真实数据库闭环

验收运行器：`tests/acceptance/phase-1/achievement-draft-submit-acceptance.mjs`。

- 创建成果草稿并返回持久化 ID：通过。
- 刷新页面后恢复成果：通过。
- 提交后状态为 `PENDING_DEPARTMENT_REVIEW`：通过。
- 审批实例、审批任务、提交动作、`SUBMIT` 审计记录各 1 条：通过。
- 重复提交返回 `409` 并未生成重复审批：通过。
- 跨部门读取和修改分别返回 `404`，未越权暴露资源：通过。

## 浏览器尺寸证据

浏览器脚本：`tests/acceptance/phase-1/achievement-draft-submit-browser.js`。

| 尺寸 | 操作 | 结果 |
| --- | --- | --- |
| 1440 × 900 | 创建、刷新恢复、打开详情、提交审批 | 通过；无页面级横向溢出 |
| 1024 × 768 | 进入成果页面并检查布局 | 通过；无页面级横向溢出 |
| 390 × 844 | 进入成果页面并检查移动端布局 | 通过；无页面级横向溢出 |

运行日志记录到部分权限接口返回 `403`。该结果与研究人员身份的权限边界一致，作为预期 permission-denied 证据，不作为页面崩溃；三种尺寸的 `pageErrors` 均为 0。

## 全量质量门禁

- `corepack pnpm test`：通过；API 1031、Web 440、Shared 1，共 1472 个测试通过。
- `corepack pnpm typecheck`：通过。
- `corepack pnpm lint`：通过。
- `corepack pnpm build`：通过；保留既有 Web 大 bundle 警告。
- `git diff --check`：通过。

## 证据边界

本次只保留结构化运行结果和长期摘要，不把 Cookie、Token、密码、私钥、连接串、完整错误堆栈或原始浏览器 Profile 写入项目。没有把本地临时容器、浏览器痕迹或旧输出目录作为本次提交内容。

## GitHub 远程交付

- 分支：`feat/achievement-draft-submit`，已推送。
- PR：`#4`，目标 `main`，当前为 Draft，未合并。
- 远程检查：`Quality Gates / Test, typecheck, build and lint` 通过；运行时间约 3 分 22 秒。
- 首轮远程失败原因：干净 CI 环境未生成 Prisma Client，导致 API 测试无法加载 `.prisma/client/default`。
- 修复提交：`510b9ff`，在依赖安装后执行 `corepack pnpm exec prisma generate`；第二轮 GitHub Actions 已通过。
- 本地 `output/` 临时目录未加入提交。
