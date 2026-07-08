# Step181 - 审批流程与批量操作验收差距收口

日期：2026-07-08

起点 HEAD：`66fb544bcd8d1a0643b9ac316369ac4c3251c2bd`

项目定位必须保持为：

`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

本文档只收口 7.1 功能验收中“多级审批 / 差异化流程”和“批量操作”的可演示能力、不能宣称完成的内容、二期增强方向和演示问答口径。本文档不实现动态流程引擎，不新增批量写入能力，不执行真实导入 apply，不执行生产数据导入。

## 总体结论

当前版本适合表述为：

> 一期本地评审提交版已经具备成果提交、部门审核、驳回、管理员归档、待办列表和费用审核路径等审批主链路；也已经具备部门、用户账号、成果三类导入的 dry-run / apply / import job history / safe summary / 失败行与警告摘要能力。复杂动态流程引擎、任意多级流程配置、所有业务对象批量写入、批量审批、批量删除、批量回滚和生产级批量任务队列仍属于二期 / 生产化专项增强。

禁止表述为：

> 系统已经完成动态流程编排引擎，已经支持所有按成果类型 / 金额 / 部门 / 涉密等级动态分流的审批，已经支持所有批量操作场景完整生产可用，已经完成生产级失败重试、补偿、回滚和真实生产数据导入。

## 当前审批主链路

| 链路 | 当前已实现 / 可演示能力 | 证据索引 | 验收口径 |
| --- | --- | --- | --- |
| 成果提交 | 成果状态支持从 `DRAFT` 提交到 `PENDING_DEPARTMENT_REVIEW`；提交接口为 `POST /achievements/:id/submit`。 | `apps/api/src/achievements/domain/achievement-state-machine.ts`；`apps/api/src/achievements/achievement.controller.ts` | 可演示成果从草稿提交到待部门审核。 |
| 部门审核 | workflow target 支持 `ACHIEVEMENT`；workflow step 支持 `DEPARTMENT_REVIEW`；待办接口支持我的待办、详情、通过和驳回。 | `apps/api/src/workflow/domain/workflow-domain.types.ts`；`apps/api/src/workflow/workflow.controller.ts`；`apps/web/src/WorkflowTasks.tsx` | 可演示部门审核待办、审批通过、审批驳回。 |
| 驳回 | 成果状态支持 `PENDING_DEPARTMENT_REVIEW` 到 `DEPARTMENT_REJECTED`，驳回后可回到 `DRAFT` 或重新提交。 | `apps/api/src/achievements/domain/achievement-state-machine.ts`；`apps/api/src/achievements/domain/achievement-state-machine.spec.ts` | 可说明驳回后保留修改再提交路径。 |
| 管理员归档 | 成果状态支持 `PENDING_ARCHIVE` 到 `ARCHIVED`；归档接口为 `POST /achievements/:id/archive`。 | `apps/api/src/achievements/domain/achievement-state-machine.ts`；`apps/api/src/achievements/achievement.controller.ts` | 可演示部门通过后进入待归档，再由管理员归档。 |
| 待办 | Web 端默认筛选 `PENDING` 待处理任务，支持任务详情、通过、驳回和权限态展示。 | `apps/web/src/WorkflowTasks.tsx`；`apps/web/src/workflow-tasks.ts` | 可演示我的待办、任务状态和操作反馈。 |
| 费用审核路径 | workflow target 支持 `FEE_RECORD`，step 支持 `FEE_REVIEW`；费用审核接口支持 `POST /fees/:id/review/approve` 和 `POST /fees/:id/review/reject`；费用详情展示审核历史和审核待办。 | `apps/api/src/fees/fee.controller.ts`；`apps/api/src/fees/fee.service.ts`；`apps/web/src/Fees.tsx`；`apps/web/src/workflow-tasks.ts` | 可演示费用待审核、费用通过 / 驳回、审核历史。 |

## 当前异常状态流转

| 对象 | 状态 / 流转 | 当前口径 |
| --- | --- | --- |
| 成果草稿 | `DRAFT` 可保存草稿、提交为 `PENDING_DEPARTMENT_REVIEW`，也可作废为 `VOIDED`。 | 草稿和提交主路径已具备。 |
| 成果待审核 | `PENDING_DEPARTMENT_REVIEW` 可通过到 `PENDING_ARCHIVE`、驳回到 `DEPARTMENT_REJECTED`、作废到 `VOIDED`。 | 部门审核通过 / 驳回可演示；作废是状态机边界能力。 |
| 成果驳回 | `DEPARTMENT_REJECTED` 可回到 `DRAFT` 或重新进入 `PENDING_DEPARTMENT_REVIEW`，也可作废。 | 驳回后修改再提交路径可说明。 |
| 成果待归档 | `PENDING_ARCHIVE` 可归档为 `ARCHIVED` 或作废为 `VOIDED`。 | 管理员归档路径可演示。 |
| 成果已归档 | `ARCHIVED` 是终态。 | 不应宣称已归档成果支持任意流程回退。 |
| 成果作废 | `VOIDED` 是终态。 | 作废 / 取消类状态存在于成果状态机边界。 |
| Workflow 任务 | `PENDING` 可到 `CLAIMED`、`APPROVED`、`REJECTED`、`CANCELLED`；`CLAIMED` 可完成为审批通过、驳回或取消；通过、驳回、取消为终态。 | 任务状态机支持待处理、认领、通过、驳回、取消边界。 |
| Workflow 实例 | `ACTIVE` 可保持 active、完成为 `COMPLETED` 或取消为 `CANCELLED`；完成和取消为终态。 | 实例状态支持主链路和取消边界。 |
| 费用支付状态 | `PENDING` 可到 `PAID`、`OVERDUE`、`WAIVED`、`CANCELLED`；`OVERDUE` 可到 `PAID`、`WAIVED`、`CANCELLED`；已缴、减免、取消为终态。 | 费用台账状态和取消 / 减免边界已具备。 |
| 费用审核状态 | `PENDING`、`APPROVED`、`REJECTED`；服务层阻止已审核记录重复审核，缺失或已完成待办会返回冲突。 | 费用审核有冲突保护和审核历史。 |
| 导入任务状态 | `ImportJob` / `ImportRun` 支持 `PENDING`、`RUNNING`、`SUCCESS`、`FAILED`、`REJECTED`；`ImportJobItem` 支持 `PENDING`、`APPLIED`、`SKIPPED`、`BLOCKED`、`FAILED`。 | 导入任务具备安全历史和失败 / 拒绝状态，但不是生产级自动重试 / 回滚引擎。 |

## 当前批量 / 导入 / 批处理能力

| 能力 | 当前已实现 / 可演示范围 | 证据索引 | 验收口径 |
| --- | --- | --- | --- |
| 部门导入 | 支持 `DEPARTMENT` family，`CREATE_ONLY` 模式，dry-run 汇总错误行 / 警告行，apply 仅创建新部门。 | `apps/api/src/imports/department-import-dry-run.service.ts`；`memory-bank/import-real-write-final-archive.md` | 可说支持部门创建类导入和导入历史。 |
| 用户导入 | 支持 `USER_ACCOUNT` family，`CREATE_ONLY_PENDING_NO_CREDENTIAL` 模式，创建待激活无凭据账号和角色绑定，不创建密码、session、邮件、token。 | `apps/api/src/imports/user-account-import-dry-run.service.ts`；`memory-bank/import-real-write-final-archive.md` | 可说支持账号批量预导入，但不是完整 HR/SSO 生命周期联动。 |
| 成果导入 | 支持 `ACHIEVEMENT` family，`CREATE_DRAFT_ONLY` 模式，覆盖论文、软著、专利草稿导入；专利导入第一阶段不写费用 / 提醒。 | `apps/api/src/imports/achievement-import-dry-run.service.ts`；`memory-bank/import-real-write-final-archive.md` | 可说支持成果草稿批量导入和本地合成数据验收。 |
| import dry-run | dry-run 统一返回 `summary.totalRows`、`validRows`、`errorRows`、`warningRows`，行级 errors / warnings 在 rows 内展示；不使用顶层 conflicts 字段。 | `memory-bank/import-dry-run-contract.md`；`apps/web/src/importDryRunUi.tsx` | 可演示导入前校验、错误行、警告行和候选动作。 |
| import apply | apply 对非零错误 / 警告、模式不匹配、重复 / 冲突、混合类型等做阻断；成功写入安全摘要和审计证据。 | `apps/api/src/imports/*-import-dry-run.service.ts`；`memory-bank/import-real-write-final-archive.md` | 可说明 apply 仅限已授权、安全模式下的本地合成数据或后续单独授权数据。 |
| import job history | `ImportJob` / `ImportRun` 记录 family、mode、状态、safe summary、错误码、运行摘要；Web 有导入历史和详情。 | `apps/api/src/imports/import-job-history-read.controller.ts`；`apps/api/src/imports/import-job-history-read.service.ts`；`apps/web/src/ImportJobHistoryPanel.tsx`；`apps/web/src/SettingsImportJobHistoryOverview.tsx` | 可演示导入历史、状态、摘要、运行记录。 |
| import job item history | `ImportJobItem` 行级安全历史已具备后端和 Web 展示，字段限定为安全行号、计划动作、状态、安全码、目标类型等。 | `memory-bank/import-job-item-final-archive.md`；`apps/web/src/ImportJobHistoryPanel.tsx` | 可说明有安全行级解释能力，但不暴露 raw CSV、targetId 或业务明细。 |
| 失败行 / 警告 / 安全摘要 | dry-run 和 apply summary 包含 failedRows / warningCount / errorCount / safeSummary；Web 安全摘要过滤 raw/csv 等敏感键。 | `apps/api/src/imports/import-job-history-read.service.ts`；`apps/web/src/ImportJobHistoryPanel.tsx` | 可演示失败行数量、警告数量和安全摘要，不展示真实导入文件内容。 |
| 幂等边界 | `ImportJob` / `ImportRun` 使用同 key claim / replay / in-flight 保护；重复提交返回已存摘要或冲突 / 警告，不重新写入业务数据。 | `memory-bank/import-job-history-final-archive.md`；`memory-bank/import-job-history-idempotency-plan.md` | 可说已有导入 job 历史和幂等保护边界，但不是通用批量任务平台。 |
| conflict / duplicate / validation | 部门已有编码、用户已有邮箱 / 工号 / 角色、成果数据库冲突使用 warning / error / `DB_CONFLICT` 等安全码表达。 | `memory-bank/import-dry-run-contract.md`；`apps/api/src/imports/*-import-dry-run.service.ts` | 可说明失败行会在 dry-run 阶段暴露安全码和原因，不能绕过校验直接 apply。 |

## 当前不能宣称完成的内容

- 不能说已经完成复杂动态流程引擎。
- 不能说已经支持任意多级审批配置。
- 不能说已经支持按成果类型、金额、部门、涉密等级动态分流。
- 不能说已经支持会签、加签、转办、撤回、超时自动流转；当前未定位到这些能力作为可演示主链路。
- 不能说所有业务对象均支持批量写入、批量审批、批量删除或批量回滚。
- 不能说已经完成生产级批量任务队列、失败自动重试、补偿、回滚、清理或失败重放。
- 不能把导入 dry-run / apply 能力表述为所有批量操作完整生产可用。
- 不能把本地合成数据验收表述为真实生产数据导入或生产 DB 验收。
- 不能把 import job history 表述为生产运维平台、通用工作流引擎或生产 apply 授权机制。

## 二期增强建议

| 方向 | 建议内容 | 验收重点 |
| --- | --- | --- |
| 流程模板配置 | 为成果、费用和后续对象建立流程模板，区分启用状态、版本、适用对象和默认节点。 | 模板版本可审计；旧实例不被新模板破坏。 |
| 流程节点条件表达式 | 支持按成果类型、金额、部门、涉密等级、项目来源等条件选择节点。 | 条件表达式需可测试、可解释、可回放。 |
| 动态审批人解析 | 支持按部门负责人、角色、项目负责人、固定用户组解析审批人。 | 解析失败时有安全降级和管理员复核。 |
| 会签 / 加签 / 转办 / 撤回 | 作为独立流程能力建模，不混入当前静态审批。 | 每种动作都有权限、审计、状态机和冲突测试。 |
| 超时自动流转 | 接入调度器、SLA 规则、提醒升级和人工兜底。 | 不因调度失败造成静默跳审。 |
| 批量任务队列 | 建立异步 job 队列、状态机、限流、暂停 / 恢复和操作员视图。 | 大文件和长耗时任务不阻塞 API 请求。 |
| 幂等键 | 对批量审批、批量导入、批量修复建立稳定 idempotency key。 | 浏览器重试、代理重试、重复点击不会重复写入。 |
| 失败重放 | 只对明确可重试且未提交或已确认回滚的失败阶段开放重放。 | `REJECTED`、权限失败、校验失败和业务冲突不得自动重放。 |
| 审计留存 | 保存操作人、范围、审批意见、批量摘要、安全错误码和前后状态。 | 审计不泄露 raw CSV、凭证、个人敏感字段和生产连接信息。 |
| 管理员复核 | 对批量高风险动作引入二次确认、抽样预览、停止条件和复核记录。 | 复核记录与实际执行摘要一致。 |

## 2026-07-09 演示问答口径

**是否支持多级审批？**

建议回答：

> 当前一期本地评审版支持成果提交、部门审核、管理员归档和费用审核等主链路，也有待办、审批通过、驳回、归档和审核历史。严格意义上的任意多级可配置流程、会签 / 加签 / 转办等复杂流程能力会作为二期流程模板和动态节点增强。

**是否支持差异化流程？**

建议回答：

> 当前支持成果和费用两类对象的静态主链路，能演示部门审核、归档和费用审核路径。按成果类型、金额、部门、涉密等级动态分流还不是当前一期已完成能力，二期会通过流程模板、条件表达式和动态审批人解析补齐。

**是否支持批量操作？**

建议回答：

> 当前支持部门导入、用户账号导入和成果导入，具备 dry-run 校验、apply、导入历史、安全摘要、失败行和警告统计。这里的批量能力主要是导入和导入历史，不等于所有业务对象的批量审批、批量删除、批量回滚都已生产可用。

**失败行怎么处理？**

建议回答：

> dry-run 会先给出总行数、有效行、错误行、警告行，并在行级返回安全错误码和原因。存在错误或警告的导入不会直接 apply；需要修正文件或确认后续授权边界，再重新 dry-run。Web 历史只展示安全摘要，不展示 raw CSV 或敏感原文。

**能不能批量审批 / 批量回滚？**

建议回答：

> 当前不建议宣称已支持。现有审批以待办单条处理为主，导入能力也没有开放通用批量回滚。批量审批和批量回滚属于高风险生产能力，二期应通过批量任务队列、幂等键、失败重放、审计留存和管理员复核单独建设和验收。

**二期怎么增强？**

建议回答：

> 二期建议分两条线推进：审批侧做流程模板、条件表达式、动态审批人、会签 / 加签 / 转办 / 撤回和超时流转；批量侧做批量任务队列、幂等键、失败重放、补偿 / 回滚策略、审计留存和管理员复核。每条能力都要有权限、状态机、审计和失败场景验收。

## 安全边界

- 不把当前审批主链路说成动态流程引擎。
- 不把导入 / dry-run / import job history 说成所有批量操作完整生产可用。
- 不执行真实批量写入。
- 不执行生产数据导入。
- 不访问 production / VPS / 生产 DB。
- 不读取 `.env`、`.env.production`、密钥、Cookie、Token、生产连接串或真实导入文件内容。
- 不访问真实 HR、财务、专利、邮件、DOI 或其他外部系统。
- 不执行数据库迁移、数据库清空 / 覆盖 / 重置、批量删除、批量回滚、retry / cleanup / rollback 接入操作。
- 不提交 `.local-step*`、`.learnings`、`apps/api/deploy`、`deliverables`、真实导入文件、截图、性能日志、备份文件或临时脚本。

## 本次收口证据

- `memory-bank/final-acceptance-readiness-summary-step180.md`：7.1 将“多级审批 / 差异化流程”定位为主链路可演示、复杂配置待增强，将“批量操作”定位为部分导入 / 批处理可用。
- `memory-bank/final-acceptance-coverage-step174.md`：7.1 验收矩阵说明审批主链路已具备提交、部门审核、管理员归档、待办；批量操作没有宣称所有场景生产可用。
- `apps/api/src/achievements/domain/achievement-state-machine.ts`：成果状态流转。
- `apps/api/src/workflow/domain/workflow-state-machine.ts`：workflow task / instance 状态流转。
- `apps/api/src/fees/domain/fee-state-machine.ts`：费用支付状态流转。
- `apps/api/src/imports/*-import-dry-run.service.ts`：三类导入 dry-run / apply / safe summary / warning / error / conflict 边界。
- `apps/api/src/imports/import-job-history-read.service.ts`、`apps/web/src/ImportJobHistoryPanel.tsx`：导入历史和安全摘要展示边界。
