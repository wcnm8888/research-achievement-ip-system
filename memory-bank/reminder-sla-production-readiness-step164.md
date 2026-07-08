# Step164 - 提醒/SLA 生产部署前只读验收清单

## 结论

提醒/SLA 增强线已经具备 local-demo / local Docker production-like 的闭环演示与上线前只读验收基础，包括提醒中心、站内催办、频控、升级 fallback、SLA 策略、扫描队列、定时 enqueue、并发锁/幂等、执行记录、指标看板、健康检查和告警预案。

当前不应直接宣称为真实生产能力。真实生产上线前仍需要人工确认外部通知渠道、scheduler/worker 运行模式、生产监控平台、权限账号、迁移执行和运维手册。

## API 验收矩阵

| 能力 | API | 权限 | 验收点 | 当前结论 |
| --- | --- | --- | --- | --- |
| 提醒中心 | `GET /reminders/center` | `reminder:read_department` | 只返回当前接收人/合法上下文内的提醒与待办摘要 | 已实现，测试覆盖 |
| SLA 队列 | `GET /reminders/sla-queue` | `reminder:read_department` | 当前用户可查看与自己相关的 SLA 队列项 | 已实现，测试覆盖 |
| SLA 策略读取 | `GET /reminders/sla-policy` | `reminder:read_department` | 返回当前启用策略或默认策略 | 已实现，测试覆盖 |
| SLA 策略更新 | `PUT /reminders/sla-policy` | `system:config` | 校验策略字段、级别、角色和 scope | 已实现，测试覆盖 |
| 当前用户 SLA 扫描 | `POST /reminders/sla-scan/run` | `reminder:read_department` | 只处理当前接收人范围，不绕过接收人限制 | 已实现，测试覆盖 |
| 全量 SLA 扫描 | `POST /reminders/sla-scan/run-all` | `system:config` | 管理员触发全量扫描并记录执行结果 | 已实现，测试覆盖 |
| 扫描入队 | `POST /reminders/sla-scan/enqueue` | `system:config` | 创建 `QUEUED` 任务，支持 `idempotencyKey` | 已实现，测试覆盖 |
| 处理下一条扫描 | `POST /reminders/sla-scan/process-next` | `system:config` | claim 成功后才扫描；锁冲突、抢占失败不发送通知 | 已实现，测试覆盖 |
| 扫描执行记录 | `GET /reminders/sla-scan/runs` | `system:config` | 返回安全执行记录，不暴露 raw error | 已实现，测试覆盖 |
| 扫描指标 | `GET /reminders/sla-scan/metrics` | `system:config` | 返回样本数、成功率、队列、失败摘要等安全指标 | 已实现，测试覆盖 |
| 健康检查 | `GET /reminders/sla-scan/health` | `system:config` | 返回 `HEALTHY/WARNING/CRITICAL`、原因和处置建议 | 已实现，测试覆盖 |
| 催办确认 | `POST /reminders/:id/confirm` | `reminder:read_department` | 当前接收人确认提醒，状态转换受控 | 已实现，测试覆盖 |
| 站内催办 | `POST /reminders/:id/escalate` | `reminder:read_department` | 受频控限制，避免重复催办 | 已实现，测试覆盖 |
| 部门升级 | `POST /reminders/:id/escalate-to-department` | `reminder:read_department` | 优先解析部门角色，缺候选人时 fallback | 已实现，测试覆盖 |
| 升级历史 | `GET /reminders/:id/escalation-history` | `reminder:read_department` | 返回安全升级摘要，不返回 raw audit JSON | 已实现，测试覆盖 |

## 前端入口验收矩阵

| 入口 | 页面/文件 | 展示/操作 | 验收点 | 当前结论 |
| --- | --- | --- | --- | --- |
| 提醒中心 | `Reminders.tsx` | 摘要卡片、提醒列表 | 展示提醒类型、状态、治理说明、可操作按钮 | 已实现 |
| 站内催办 | `Reminders.tsx` | 催办按钮 | loading/error 状态完整，错误经安全归一化 | 已实现 |
| 部门升级 | `Reminders.tsx` | 升级到部门按钮 | 仅在后端允许时可操作，前端不绕过后端权限 | 已实现 |
| 升级历史 | `Reminders.tsx` | 最近升级记录 | 展示安全摘要字段 | 已实现 |
| SLA 队列 | `Reminders.tsx` | SLA 队列表格 | 展示 SLA 状态、目标、下一次可升级时间 | 已实现 |
| SLA 策略 | `Reminders.tsx` | 策略摘要与保存按钮 | 保存走后端校验和 `system:config` | 已实现 |
| 手动扫描 | `Reminders.tsx` | 运行扫描、全量扫描 | 操作后刷新页面数据 | 已实现 |
| 异步队列 | `Reminders.tsx` | 加入扫描队列、处理下一条任务 | 展示执行结果与最近 runs | 已实现 |
| 扫描执行记录 | `Reminders.tsx` | 最近执行记录 | 展示 status、triggerType、attemptCount、时间和 failureReason | 已实现 |
| 指标看板 | `Reminders.tsx` | SLA 指标区块 | 展示样本数、队列、运行中、成功率、失败数、升级数 | 已实现 |
| 健康检查 | `Reminders.tsx` | 健康状态区块 | 展示正常/预警/严重、原因和建议动作 | 已实现 |

## 权限与安全边界检查

- 所有 reminders controller 路由位于 `UserContextGuard` / `PermissionGuard` 下。
- 普通提醒中心、当前用户 SLA 队列、当前用户扫描、确认、催办、部门升级、升级历史使用 `reminder:read_department`。
- 策略更新、全量扫描、扫描入队、处理下一条任务、执行记录、指标、健康检查使用 `system:config`。
- current-user 路径不得导出或处理其他接收人的提醒。
- 全量扫描只允许系统管理员级权限触发。
- 扫描队列使用 `idempotencyKey` 防重复入队。
- 扫描 worker 只有 claim 成功后才执行扫描和站内通知。
- 存在活跃锁时队列任务跳过，不重复发送通知。
- 过期锁会被安全标记后再处理后续任务。
- `failureReason` 仅使用安全枚举，例如 `SCAN_FAILED`、`LOCK_ACTIVE`、`LOCK_EXPIRED_REPLACED`、`CLAIM_CONFLICT`。
- 指标和健康检查不返回 `safeSummary`、raw JSON、raw audit oldValue/newValue、异常堆栈、通知正文、附件原文。
- 不返回 Cookie、Token、password、passwordHash、tokenHash、session、连接串、密钥。
- 前端错误展示使用安全归一化，不展示 raw error body。

## 生产环境需要人工确认的配置项

- 是否已执行并审计相关 Prisma migrations。
- `REMINDER_SLA_SCHEDULER_ENABLED` 是否按部署策略启用。
- `REMINDER_SLA_SCHEDULER_INTERVAL_MS` 是否符合生产扫描频率。
- 是否有明确 worker 运行方式：应用内手动 `process-next`、定时 worker、独立进程或队列消费者。
- scheduler 只 enqueue，不负责执行扫描；必须确认 worker 消费链路。
- `system:config` 权限只授予受控管理员账号。
- `reminder:read_department` 权限与部门 scope 是否与组织权限模型一致。
- SLA 策略级别、角色码和 GLOBAL/DEPARTMENT scope 是否经业务负责人确认。
- 部门升级接收人角色是否在生产数据中可解析。
- 站内通知是否满足上线阶段要求；如需真实外部通知，必须另行接入和验收。
- 扫描运行记录保留周期、排障流程和人工处理 SOP。
- 监控告警接入方案：当前仅提供 API/页面健康摘要，不接真实监控平台。

## 上线前必须跑的命令

- `corepack pnpm --filter @research-ip/api test -- reminders`
- `corepack pnpm --filter @research-ip/web test -- reminders App`
- `corepack pnpm --filter @research-ip/api typecheck`
- `corepack pnpm --filter @research-ip/web typecheck`
- `git diff --check`
- 如涉及迁移验收，使用 dummy/local DB URL 跑 `corepack pnpm prisma validate`，不得读取生产 `.env` 或连接生产数据库。

## 本次只读验证结果

- `corepack pnpm --filter @research-ip/api test -- reminders`：通过，7 files / 107 tests。
- `corepack pnpm --filter @research-ip/web test -- reminders App`：通过，3 files / 21 tests。
- `corepack pnpm --filter @research-ip/api typecheck`：通过。
- `corepack pnpm --filter @research-ip/web typecheck`：通过。
- `git diff --check`：通过。

## 当前不能上线为真实生产能力的限制

- 无真实外部通知渠道。
- scheduler 默认关闭。
- worker 仍是应用内 MVP。
- 无生产监控平台接入。
- 无 Prometheus / OpenTelemetry。
- 无自动修复 stuck lock。
- 无外部 worker 健康监测。
- 无长期趋势持久化和容量告警。
- 无真实短信、邮件、企微通道失败重试治理。
- 当前定位仍是 local-demo / local Docker production-like 验收。

## 安全确认

- 本 Step 未读取 `.env` / `.env.production`。
- 本 Step 未读取、展示、记录 Cookie、Token、密码、连接串、密钥。
- 本 Step 未访问 production / VPS / 生产 DB。
- 本 Step 未调用真实邮件、短信、企微、HR、SSO、财务、DOI、专利等外部系统。
- 本 Step 未修改生产配置。
- 本 Step 未修改 schema / migration。
- 本 Step 未删除文件或目录。
- 本 Step 未提交。
