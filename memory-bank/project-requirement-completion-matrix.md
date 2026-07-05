# 项目需求完成度矩阵

日期：2026-07-05

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

- `3d8154d docs: outline next phase options`

当前仓库状态：

- tracked diff：为空。
- cached diff：为空。
- 既有 untracked 本地产物仍存在，尚未分类、清理、移动、暂存或删除。
- 本文不访问数据库、production、VPS、生产 DB，不读取 `.env` / `.env.production`。

总体判断：

- 一期核心业务骨架已经基本建成。
- 导入与导入历史能力明显超出最初一期基础需求，已经形成独立主线并归档。
- 当前仍不是生产上线完成态，生产执行、真实外部系统联调、完整二期功能和部分高级能力仍未完成。

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
| 系统配置/API 集成配置 | 已完成基础 | `settings` API 与 `SettingsApiIntegrations.tsx`，Step 51D/E/F | 真实外部接口密钥/连接配置生产使用未授权 |
| 部门维护 | 已完成 | `department-management` API 与 `DepartmentManagement.tsx`，Step 37 完成 | 生产写验收仍需单独授权 |
| 账号管理 | 部分完成 | `account-management` API 与 `AccountManagement.tsx` | 当前偏只读/导入创建待激活账号；完整账号生命周期管理未完全展开 |
| 账号生命周期 | 部分完成 | `account-lifecycle` 模块存在 | 真实邮件、邀请、重置、激活生产闭环未完成 |
| 部门导入真实写入 | 已完成本地 | Step 65B-F，`CREATE_ONLY` | 真实生产导入未授权 |
| 用户账号导入真实写入 | 已完成本地 | Step 66B-F，`CREATE_ONLY_PENDING_NO_CREDENTIAL` | 不创建凭证/邮件/登录激活；生产导入未授权 |
| 成果导入真实写入 | 已完成本地 | Step 68/69/70 覆盖 PAPER、SOFTWARE_COPYRIGHT、PATENT | 真实生产导入未授权 |
| 导入任务历史 ImportJob/ImportRun | 已完成 | Step 72A-73E，`GET /import-jobs`、`GET /import-jobs/:id` | 生产只读预检尚未执行 |
| Web 导入历史汇总展示 | 已完成 | Step 73/74，页内入口和 settings overview | 只展示 aggregate，不展示行级 item |
| ImportJobItem 行级安全历史后端写入 | 已完成 | Step 77A-E，Department/Achievement/User writer | targetId 仅内部持久化，不暴露 |
| ImportJobItem 后端只读 API | 已完成 backend-only | Step 78B/D，`GET /api/import-jobs/:id/items` | Web 行级展示未授权 |
| 导入重试/删除/清理/回滚 | 未完成且当前不支持 | prompt-39 handoff 明确 unsupported | 如未来需要，必须先做安全方案 |
| 原 CSV 下载/导出/raw JSON | 未完成且当前禁止 | prompt-39 handoff 明确 forbidden | 默认不做，除非重新定义安全边界 |
| 生产部署执行 | 未完成 | runbook 存在，但 production/VPS/生产 DB 未访问 | 需用户单独授权，只读 preflight 先行 |
| 生产 migration 执行 | 未完成 | migration 文件存在，本地验收有记录 | 需生产备份、窗口、授权、只读预检后执行 |
| 真实 HR/SSO 接入 | 未完成 | adapter 方向存在，真实联调未做 | 二期/部署集成阶段 |
| 真实财务系统接入 | 未完成 | settings/adapter 方向存在，真实联调未做 | 二期/部署集成阶段 |
| 真实 DOI/文献库/专利状态接入 | 未完成 | adapter 方向存在，真实联调未做 | 二期/集成专项 |
| 成果转化全流程 | 未完成 | 原始需求列为二期深化 | 二期功能线 |
| 高级报表/自定义报表 | 未完成 | 原始需求列为二期深化 | 二期功能线 |
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

### 超出原一期但已经完成的增强

- 部门、用户、成果三类导入真实写入本地闭环。
- 导入任务历史和幂等。
- Web 导入历史汇总入口。
- ImportJobItem 行级安全历史后端持久化。
- ImportJobItem 后端只读 API。
- 多份生产只读预检 runbook。

## 未完成内容归类

### 一期上线前建议补齐

1. 生产只读预检执行准备。
2. 生产环境 migration 与部署授权流程。
3. 生产备份、恢复、监控、回滚策略确认。
4. 真实 auth/session/cookie 行为验收。
5. 基础性能和安全验收。
6. 外部接口未接入时的降级策略确认。

### 一期可选增强

1. Web 行级导入历史展示方案。
2. 导入任务 retry/repair/rollback 的安全方案。
3. 账号生命周期完整闭环。
4. 费用审批更完整闭环。
5. untracked 本地产物安全审计。

### 二期功能

1. 成果转化全流程。
2. 收益分配和后评估。
3. 高级报表、自定义报表、定时推送。
4. 移动端。
5. 真实 HR/SSO、财务、邮件、短信、文献库、专利状态深度联调。
6. 十万级真实压测、灾备演练、运维监控大盘。

## 建议后续排期

### 阶段 1：上线前只读核查与差距确认

目标：确认当前系统是否具备进入生产部署准备阶段的条件。

建议任务：

- Step 82B：生产上线差距核查清单。
- Step 82C：只读 production preflight 执行准备包。
- Step 82D：本地到生产配置差异核查，不读取密钥内容。
- Step 82E：安全与隐私证据包整理。

禁止事项：

- 未授权不得访问 production/VPS/生产 DB。
- 不读取 `.env` / `.env.production` 内容。
- 不执行 migration/import/runbook。

### 阶段 2：一期缺口补齐

目标：补齐一期上线所需但仍不足的产品与运维能力。

建议任务：

- 账号生命周期生产闭环计划。
- 费用审批闭环最小实现计划。
- 真实邮件/通知 adapter 选型与安全方案。
- 基础性能验收方案。
- 生产备份恢复演练方案。

### 阶段 3：导入能力决策

目标：决定是否把导入能力从“安全本地闭环”推进到“生产可执行能力”。

建议任务：

- 生产导入 apply 授权流程方案。
- 真实数据导入 dry-run 证据格式。
- ImportJobItem Web 行级展示方案。
- 导入 retry/repair/rollback 风险评估。

### 阶段 4：二期产品能力

目标：按原始需求二期范围扩展。

建议任务：

- 成果转化业务建模。
- 收益分配与合同台账。
- 高级报表/自定义报表。
- 移动端需求重评估。
- 外部系统真实联调专项。

## 当前最推荐下一步

建议下一步先做：

`Step 82B - 生产上线差距核查清单`

原因：

- 当前一期核心功能已有较多实现，继续盲目加功能容易扩大范围。
- 生产、DB、外部接口、备份恢复、性能安全这些是上线前关键风险。
- 该 Step 可以继续保持 docs-only，不访问生产，不读取密钥，只把上线差距和授权门槛列清楚。

## 当前明确不能推断为完成的事项

- 不能把本地 synthetic acceptance 等同于生产验收。
- 不能把 runbook 文档等同于 runbook 已执行。
- 不能把 adapter/mock 等同于真实外部系统联调。
- 不能把 ImportJobItem backend-only API 等同于 Web 行级展示。
- 不能把 schema/migration 文件存在等同于生产 migration 已应用。
- 不能把导入本地 apply 成功等同于真实生产数据导入已授权。
