# Step159 - SLA 扫描异步队列 + 定时触发 + 并发锁/幂等治理

## 新增 / 修改 API

- `POST /reminders/sla-scan/enqueue`
  - 需要 `system:config`。
  - 创建 `QUEUED` 的全量 SLA 扫描任务。
  - 支持 `idempotencyKey`；重复 key 返回已有任务，不重复创建。
  - 支持 `triggerType: MANUAL | API_QUEUE`，未传默认为 `API_QUEUE`。
- `POST /reminders/sla-scan/process-next`
  - 需要 `system:config`。
  - MVP worker 入口：从 `QUEUED` 中取一条任务，获取锁后执行全量扫描。
  - 无任务返回 `NO_TASK`。
  - 锁冲突时将当前排队任务标记为 `SKIPPED`，不发送通知、不升级。
- `GET /reminders/sla-scan/runs`
  - 保留 Step158 行为，并返回新增治理字段。

## 队列模型

复用 `reminder_sla_scan_runs`，新增字段：

- `triggerType`
- `idempotencyKey`
- `lockKey`
- `lockedAt`
- `lockedUntil`
- `attemptCount`
- `failureReason`
- `requestedAt`
- `queuedAt`

状态范围扩展为：

- `QUEUED`
- `RUNNING`
- `COMPLETED`
- `FAILED`
- `SKIPPED`

## 并发锁规则

- 同类全量扫描使用固定 `lockKey = REMINDER_SLA_FULL_SCAN`。
- migration 增加 partial unique index：同一时间只允许一个 `status = RUNNING` 的同类 lock。
- `process-next` 会先检查未过期 `RUNNING` 锁。
- 如锁未过期：当前排队任务标记 `SKIPPED / LOCK_ACTIVE`。
- 如存在过期 `RUNNING` 锁：先标记为 `SKIPPED / LOCK_EXPIRED_REPLACED`，再接管下一条排队任务。
- worker 只在 claim 成功后执行扫描和发送站内通知。

## 幂等规则

- `idempotencyKey` 在 DB 层唯一。
- 重复 enqueue 相同 key 时返回已有任务，行为为 `EXISTING`，不创建重复记录。
- 未提供 key 时允许正常创建独立任务。

## 定时触发默认关闭策略

- 新增 `ReminderSlaSchedulerProvider`。
- 默认关闭，不自动 enqueue。
- 只有 `REMINDER_SLA_SCHEDULER_ENABLED=true` 时才会按 interval enqueue。
- interval 配置名：`REMINDER_SLA_SCHEDULER_INTERVAL_MS`。
- scheduler 只 enqueue，不执行扫描。
- 测试使用注入配置和 mock service，不依赖真实环境变量内容。

## 前端入口

- `Reminders.tsx` 的 SLA 卡片新增：
  - `加入扫描队列`
  - `处理下一条任务`
- 最近执行记录展示：
  - status
  - triggerType
  - attemptCount
  - queuedAt
  - startedAt
  - completedAt
  - failureReason

## 安全边界

- 所有治理 API 均要求 `system:config`。
- 不接入真实邮件、短信、企微或其他外部通知渠道。
- 失败原因只保存安全枚举，如 `SCAN_FAILED`、`LOCK_ACTIVE`、`LOCK_EXPIRED_REPLACED`。
- 不保存 raw error stack、通知正文、Cookie、Token、password、session、连接串或密钥。
- 未读取 `.env` / `.env.production`。
- 未访问 production / VPS / 生产 DB。
- 未调用真实 HR、SSO、财务、DOI、专利等外部系统。

## 验证命令和结果

- `corepack pnpm --filter @research-ip/api test -- reminders`：通过，7 files / 98 tests。
- `corepack pnpm --filter @research-ip/web test -- reminders App`：通过，3 files / 21 tests。
- `corepack pnpm --filter @research-ip/api typecheck`：通过。
- `corepack pnpm --filter @research-ip/web typecheck`：通过。
- `git diff --check`：通过。
- `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/research_ip_validate'; corepack pnpm prisma validate`：通过，仅用于 schema 解析校验，未连接生产数据库。

## 未实现项

- 真正分布式队列。
- 外部 worker 进程。
- 生产 cron 配置。
- 监控告警。
- 邮件、短信、企微真实渠道。
