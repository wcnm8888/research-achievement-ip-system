# 项目需求完成度矩阵

日期：2026-07-06

本文用于把项目最初的需求说明、项目计划书和当前仓库实现状态对齐，形成后续排期依据。

## 依据文档位置

- 原始需求说明：`E:\Vibe coding\production-github-main-20260626\研究院科研成果管理系统说明.html`
- 同名外部原始资料目录：`E:\研究院科研成果管理系统\研究院科研成果管理系统说明.html`
- 项目产品计划：`memory-bank/product-brief.md`
- 项目实施计划：`memory-bank/implementation-plan.md`
- 架构与模块记录：`memory-bank/architecture.md`
- 当前进度记录：`memory-bank/progress.md`
- 最新交接文档：`memory-bank/prompt-39-handoff.md`
- 下一阶段路线：`memory-bank/next-phase-options.md`
- 一期最终归档：`memory-bank/phase-one-final-archive.md`

说明：当前 HTML 与早期 memory-bank 文档存在编码显示问题，但章节结构和项目范围可对应到“科研成果与知识产权管理系统需求规格说明书”。后续如要正式对外交付，建议单独做一次文档编码修复或重新导出。

## 原始需求范围摘要

原始需求说明和 product brief 中，一期基础刚需版主要包括：

- 成果登记：论文、专利、软件著作权统一登记、详情字段、状态、唯一性校验、密级、附件。
- 基础审批流：科研人员提交，部门科研秘书初审，系统管理员归档。
- 权限与隔离：RBAC、部门数据隔离、涉密授权访问、附件下载控制。
- 费用台账与预警：专利/软著费用记录、截止日期、缴费状态、凭证附件、30/15/7 天和逾期提醒。
- 基础全文检索：标题、摘要、作者/发明人、DOI、申请号、登记号等字段检索，并按权限过滤。
- 基础统计看板：年度趋势、成果类型分布、部门排行、专利状态、费用汇总。
- 操作审计日志：核心写操作、审批、附件、费用处理均留痕。
- 附件管理：版本、权限、密级、存储 adapter。
- 外部接口预留：DOI、邮件、HR/SSO、财务、专利状态等 adapter。

二期或明确延后范围包括：

- 成果转化全流程、收益分配、后评估和转化漏斗。
- 完整费用线上审批、财务系统深度对接、批量缴费单。
- 高级组合检索、自定义报表、定时报表推送、引用分析。
- 真实 HR/SSO、真实专利状态、真实邮件、短信、财务接口联调。
- 移动端、运维监控大盘、灾备演练、十万级真实压测。

## 当前总体状态

当前最新核查 HEAD：

- `9bab53f docs: add phase one demo presenter brief`

当前仓库状态：

- tracked diff：为空。
- cached diff：为空。
- 既有 untracked 本地产物仍存在，尚未分类、清理、移动、暂存或删除。
- 本文不访问数据库、production、VPS、生产 DB，不读取 `.env` / `.env.production`。

总体判断：

- 一期核心业务骨架已经基本建成。
- 导入与导入历史能力明显超出最初一期基础需求，已经形成独立主线并归档。
- Step 83-Step 96 已把一期评分导向的 localhost 演示闭环归档为 `PASS 0 / PASS with caveat 10 / BLOCKED 0`。
- 当前仍不是生产上线完成态，生产执行、真实外部系统联调、完整二期功能和部分高级能力仍未完成。
- mock/local/demo 项只能说明 localhost / local demo / synthetic DB 演示可见，不等于真实联调或生产验收。

## 完成度矩阵

| 中文任务/需求点 | 当前状态 | 当前证据 | 后续安排 |
| --- | --- | --- | --- |
| 基础工程结构 | 已完成 | `apps/api`、`apps/web`、`packages/shared`、`prisma`、Docker/compose 文件均已存在 | 后续仅按新功能增量维护 |
| 数据库核心模型 | 已完成 | `prisma/schema.prisma` 已有 User、Department、Role、Achievement、Workflow、Fee、Reminder、Attachment、Audit、ImportJob 等模型 | 生产 migration 执行仍需单独授权 |
| 登录与会话 | 部分完成 | `apps/api/src/auth`、`UserSession`、Web 登录入口存在 | 真实 SSO/统一身份未联调 |
| RBAC 权限 | 已完成一期基础 | `apps/api/src/authorization`，Step 4 记录权限内核 DONE | 资源级策略仍需在每个新 API 持续接入 |
| 部门数据隔离 | 已完成一期基础 | `Department`、`UserRole`、scope policy、部门维护模块 | 复杂组织继承/跨部门规则如需扩展需另开 Step |
| 涉密授权访问 | 部分完成 | `ResourceAccessGrant`、secret access policy、涉密读策略 | 更完整涉密业务流、涉密附件加密和专门管理后台未完整闭环 |
| 成果登记：论文 | 已完成基础 | `PaperDetail`、成果 API、Web 成果表单/详情、导入 PAPER | DOI 真实自动补全未联调 |
| 成果登记：专利 | 已完成基础 | `PatentDetail`、成果 API、Web 成果表单/详情、导入 PATENT | 专利官方状态同步、年费自动节点未真实联调 |
| 成果登记：软件著作权 | 已完成基础 | `SoftwareCopyrightDetail`、成果 API、Web 成果表单/详情、导入 SOFTWARE_COPYRIGHT | 软著外部登记状态/材料流转未完整联调 |
| 成果唯一性校验 | 已完成基础 | schema normalized 字段、导入 dry-run/apply 冲突检测 | 更复杂跨来源合并/人工确认未做 |
| 成果状态生命周期 | 已完成基础 | draft、submit、review、archive、void 等 API 和状态机 | 成果注销/作废深度原因与全量归档流程可继续强化 |
| 基础审批流 | 已完成一期基础 | Step 6 记录：submit 创建 workflow，部门通过/驳回，管理员归档 | 可配置审批流设计器未做，属于延后范围 |
| 待办与审批 Web | 已完成基础 | `WorkflowTasks.tsx`、`workflow` API | 复杂会签/加签/转办未做 |
| 附件管理 | 已完成基础 | `apps/api/src/attachments`、`Attachment` 模型、Web 入口、审计 | 真实对象存储、复杂附件加密/预览/清理补偿未完整落地 |
| 操作审计日志 | 已完成基础 | `apps/api/src/audit`、`AuditLogs.tsx`，Step 7/18 记录 | 审计导出、原始未脱敏读取不提供；生产保留策略需部署确认 |
| 费用台账 | 已完成基础 | `apps/api/src/fees`、`FeeRecord`、`Fees.tsx` | 更完整财务审批和财务系统对接未完成 |
| 费用预警/提醒 | 已完成基础 | `ReminderTask`、`Notification`、`reminders`、`notifications` | scheduler/cron、真实邮件/短信、真实队列未完成 |
| 站内通知 mock | 已完成基础 | Notification mock/in-app 边界 | 真实邮件、短信通道未完成 |
| 基础搜索 | 已完成基础 | `apps/api/src/search`、`Search.tsx`，Step 9B DONE | 高级组合检索、真实 Meilisearch 生产索引运维需后续确认 |
| 基础统计看板 | 已完成基础 | `apps/api/src/dashboard`、`Dashboard.tsx`，Step 9 DONE | 自定义报表、定时推送、完整趋势分析未完成 |
| Dashboard 固定评分口径 | 已完成本地演示 | Step 87/95/96：Dashboard 展示部门、费用风险、审批效率、成果转化、mock 集成概览 | 固定评分摘要不是完整 BI、自定义报表、生产监控或真实生产数据验收 |
| 系统配置/API 集成配置 | 已完成基础 | `settings` API 与 `SettingsApiIntegrations.tsx`，Step 51D/E/F | 真实外部接口密钥/连接配置生产使用未授权 |
| 外部接口 mock demo center | 已完成本地演示 | Step 86/95/96：mock provider 场景、安全结果和调用日志摘要可见 | mock/adapter 演示不是 DOI、文献库、专利平台、财务、HR/SSO 真实联调 |
| 部门维护 | 已完成 | `department-management` API 与 `DepartmentManagement.tsx`，Step 37 完成 | 生产写验收仍需单独授权 |
| 账号管理 | 部分完成 | `account-management` API 与 `AccountManagement.tsx` | 当前偏只读/导入创建待激活账号；完整账号生命周期管理未完全展开 |
| 账号生命周期 | 已完成本地演示闭环 | Step 85/95/96：账号生命周期动作和模拟通知安全摘要可见 | 真实 HR/SSO、真实邮件/短信、真实 token 交付和生产身份验收未完成 |
| 部门导入真实写入 | 已完成本地 | Step 65B-F，`CREATE_ONLY` | 真实生产导入未授权 |
| 用户账号导入真实写入 | 已完成本地 | Step 66B-F，`CREATE_ONLY_PENDING_NO_CREDENTIAL` | 不创建凭证/邮件/登录激活；生产导入未授权 |
| 成果导入真实写入 | 已完成本地 | Step 68/69/70 覆盖 PAPER、SOFTWARE_COPYRIGHT、PATENT | 真实生产导入未授权 |
| 导入任务历史 ImportJob/ImportRun | 已完成 | Step 72A-73E，`GET /import-jobs`、`GET /import-jobs/:id` | 生产只读预检尚未执行 |
| Web 导入历史汇总展示 | 已完成 | Step 73/74，页内入口和 settings overview | 只展示 aggregate，不展示行级 item |
| ImportJobItem 行级安全历史后端写入 | 已完成 | Step 77A-E，Department/Achievement/User writer | targetId 仅内部持久化，不暴露 |
| ImportJobItem 后端只读 API | 已完成 backend-only | Step 78B/D，`GET /api/import-jobs/:id/items` | Web 行级展示未授权 |
| 一期 localhost 演示脚本/复验/讲解口径 | 已归档 | Step 88 checklist/script、Step 95 final UI recheck、Step 96 presenter brief、Step 97 final archive | 仅代表 localhost/local-demo/synthetic evidence，不是 production/VPS/生产 DB/真实外部系统验收 |
| 导入重试/删除/清理/回滚 | 未完成且当前不支持 | prompt-39 handoff 明确 unsupported | 如未来需要，必须先做安全方案 |
| 原 CSV 下载/导出/raw JSON | 未完成且当前禁止 | prompt-39 handoff 明确 forbidden | 默认不做，除非重新定义安全边界 |
| 生产部署执行 | 未完成 | runbook 存在，但 production/VPS/生产 DB 未访问 | 需用户单独授权，只读 preflight 先行 |
| 生产 migration 执行 | 未完成 | migration 文件存在，本地验收有记录 | 需生产备份、窗口、授权、只读预检后执行 |
| 真实 HR/SSO 接入 | 未完成 | adapter 方向存在，真实联调未做 | 二期/部署集成阶段 |
| 真实财务系统接入 | 未完成 | settings/adapter 方向存在，真实联调未做 | 二期/部署集成阶段 |
| 真实 DOI/文献库/专利状态接入 | 未完成 | adapter 方向存在，真实联调未做 | 二期/集成专项 |
| 费用线上审批闭环 | 已完成本地演示闭环 | Step 83/95/96：费用审批动作、结果、历史和讲解 caveat 已进入 10 路径演示 | 真实财务付款、发票、对账、批量缴费单和生产财务系统联调未完成 |
| 成果转化 MVP | 已完成本地演示闭环 | Step 84/95/96：归档成果的 conversion ledger 面板、创建结果和 Dashboard 指标可见 | 不等于成果转化全流程、真实合同、法务、付款、收益分配或后评估验收 |
| 成果转化全流程 | 未完成 | 原始需求列为二期深化；Step 84 仅完成 MVP local ledger | 二期功能线 |
| 高级报表/自定义报表 | 二期 P0 推荐首个切片 | 原始需求列为二期深化；Step 101-B 已新增 `memory-bank/phase-two-feature-priority-plan.md` | 推荐先做不依赖 production/真实外部系统/真实凭证的只读自定义报表 MVP |
| 移动端 | 未完成 | 原始需求明确第一版不做完整移动端 | 二期或独立项目 |
| 大规模性能压测 | 未完成 | 原始需求明确第一版不做十万级真实压测 | 生产前专项 |
| 灾备演练/生产监控大盘 | 未完成 | 有策略/文档方向，未执行演练 | 生产上线前专项 |
| 既有 untracked 本地产物处理 | 未完成且未授权 | `git status --short` 长期显示 8 项既有本地产物 | 可走单独安全审计 Step |

## 已完成内容归类

### 一期核心已基本完成

- 成果登记基础能力。
- 基础审批流。
- RBAC、部门隔离、涉密授权基础。
- 附件基础能力。
- 审计日志基础能力。
- 费用台账与基础提醒。
- 基础搜索。
- 基础看板。
- 部门维护。
- 系统配置基础页面。
- 一期 localhost 演示闭环：Step 95/96/97 已归档为 `PASS 0 / PASS with caveat 10 / BLOCKED 0`，仅限 local/demo/synthetic。

### 超出原一期但已经完成的增强

- 费用线上审批本地演示闭环。
- 成果转化 MVP 本地 ledger。
- 账号生命周期与模拟通知本地演示闭环。
- 外部接口 mock demo center。
- Dashboard 固定评分口径。
- 部门、用户、成果三类导入真实写入本地闭环。
- 导入任务历史和幂等。
- Web 导入历史汇总入口。
- ImportJobItem 行级安全历史后端持久化。
- ImportJobItem 后端只读 API。
- 多份生产只读预检 runbook。

## 未完成内容归类

### production / 上线前仍需补齐

1. 生产只读预检执行准备。
2. 生产环境 migration 与部署授权流程。
3. 生产备份、恢复、监控、回滚策略确认。
4. 真实 auth/session/cookie 行为验收。
5. 基础性能和安全验收。
6. 外部接口未接入时的降级策略确认。

### 一期演示后可选增强

1. Web 行级导入历史展示方案。
2. 导入任务 retry/repair/rollback 的安全方案。
3. 正式演示 rehearsal 和现场 fallback 准备。
4. 更完整账号生命周期、费用审批和成果转化产品深度。
5. untracked 本地产物安全审计。

### 二期功能

1. 成果转化全流程。
2. 收益分配和后评估。
3. 高级报表、自定义报表、定时推送。
4. 移动端。
5. 真实 HR/SSO、财务、邮件、短信、文献库、专利状态深度联调。
6. 十万级真实压测、灾备演练、运维监控大盘。

## 建议后续排期

### 阶段 1：正式演示 rehearsal

目标：在不重新扩大范围的前提下，复核一期 localhost 演示口径、顺序、fallback 和 caveat。

建议任务：

- 只读复核 `phase-one-final-archive.md`、Step 95 evidence、Step 96 presenter brief。
- 演练 `researcher` -> `secretary` -> `admin` 的现场讲解顺序。
- 准备 localhost 不可用时的截图/文档 fallback 说法。

禁止事项：

- 未授权不得访问 production/VPS/生产 DB。
- 不读取 `.env` / `.env.production` 内容。
- 不执行 migration/import/runbook，不调用真实外部系统，不把 caveat 改写成 production PASS。

### 阶段 2：二期功能增强

目标：在一期演示闭环之后，按产品价值扩展功能深度。

建议任务：

- P0：自定义报表 / 高级报表 MVP，优先做只读报表配置和结果展示，不依赖 production、真实外部系统或真实凭证。
- P1：成果转化深化 MVP，包含收益分配、后评价、合同/到账状态，但需要先做 schema-aware 方案。
- P1：ImportJobItem Web 行级安全只读展示，复用既有 backend-only API，严格禁止 raw payload/raw JSON/export/retry/rollback。
- P2/P3：移动端需求重评估、更完整账号生命周期、涉密授权管理增强、附件存储/下载增强、定时提醒/计划任务增强。

### 阶段 3：真实外部系统对接准备

目标：仅在具备真实系统、凭证、测试环境和授权后，准备 DOI/文献库/专利平台/财务/HR/SSO/邮件/短信等集成。

建议任务：

- 集成 readiness 清单。
- 凭证和脱敏证据边界。
- 测试环境、回滚和人工确认门禁。

### 阶段 4：production readiness

目标：仅在用户明确要求并授权后，进入生产就绪准备。

建议任务：

- production read-only preflight。
- 生产 migration 窗口、备份、回滚和监控方案。
- 基础性能、安全、灾备和生产可观测性验收。

## 当前最推荐下一步

建议下一步：

- Route B：二期功能增强，当前首个推荐实现切片是自定义报表 / 高级报表 MVP。
- Route C：真实外部系统对接准备，仅在有真实系统、凭证、测试环境和授权后启动。
- Route D：production readiness，仅在用户明确要求并授权后启动。

原因：

- 一期 localhost 演示闭环已经归档，不再建议继续以“补齐一期演示闭环”为默认主线。
- Route A 已在 Step 100 最终交接归档，后续不再默认补演示文档。
- 自定义报表 MVP 直接回应统计汇总耗时和院/部门决策需求，且可先保持只读、本地、无真实外部系统依赖。
- 如果进入真实系统或生产路线，必须先确认授权、环境、凭证、脱敏和人工 go/no-go 门禁。

## 当前明确不能推断为完成的事项

- 不能把本地 synthetic acceptance 等同于生产验收。
- 不能把 runbook 文档等同于 runbook 已执行。
- 不能把 adapter/mock 等同于真实外部系统联调。
- 不能把 ImportJobItem backend-only API 等同于 Web 行级展示。
- 不能把 Step 95 screenshotable localhost 路径等同于 production/VPS/生产 DB 验收。
- 不能把 schema/migration 文件存在等同于生产 migration 已应用。
- 不能把导入本地 apply 成功等同于真实生产数据导入已授权。
