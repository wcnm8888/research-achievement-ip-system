# Step162 - 提醒/SLA 生产化监控与告警预案 MVP

## 新增 API

- `GET /reminders/sla-scan/health`
  - 权限：`system:config`。
  - 复用现有 `UserContextGuard` / `PermissionGuard`。
  - 基于最近 200 条 SLA 扫描执行记录生成安全健康摘要。
  - 返回字段：
    - `generatedAt`
    - `status`: `HEALTHY` / `WARNING` / `CRITICAL`
    - `reasons`
    - `metricsSnapshot`
    - `recommendedActions`

## 健康状态规则

- 存在 `RUNNING` 且 `lockedUntil` 已过期：`CRITICAL / STALE_RUNNING_LOCK`。
- 排队任务数 `queuedCount >= 10`：`WARNING / QUEUE_BACKLOG_HIGH`。
- 最近失败数大于 0 且成功率低于 `0.8`：`WARNING / LOW_SUCCESS_RATE`。
- 最近失败数 `failed >= 3`：`CRITICAL / REPEATED_FAILURES`。
- 多条规则同时命中时取最高严重级别。
- 未命中任何规则时返回 `HEALTHY`，`reasons` 为空。

## 告警预案 MVP 边界

- 本 Step 不接入真实邮件、短信、企微、Prometheus、OpenTelemetry 或外部监控系统。
- `recommendedActions` 只返回面向管理员的安全处置建议：
  - 检查 scheduler 是否启用但 worker 未及时消费队列。
  - 检查 stuck `RUNNING` 任务和锁过期原因。
  - 检查最近失败原因是否为 `SCAN_FAILED` / `LOCK_ACTIVE` / `CLAIM_CONFLICT`。
  - 必要时由管理员人工触发处理下一条扫描任务。
- 本 Step 未强制新增健康检查审计事件；当前实现只提供只读安全健康投影。

## 前端入口

- `Reminders.tsx` 的 SLA 卡片新增“健康状态”区块。
- 展示健康状态 Tag、告警原因列表和推荐处理动作。
- `reminder-center.ts` 新增：
  - `fetchReminderSlaScanHealth`
  - `getReminderSlaHealthStatusLabel`
  - `getReminderSlaHealthStatusColor`
- `types.ts` 新增 `ReminderSlaScanHealthResponse` 等类型。

## 安全边界

- health API 不返回 `safeSummary`、raw JSON、通知正文、异常堆栈、附件原文。
- health API 不返回 Cookie、Token、password、session、连接串、密钥类字段。
- 前端错误展示继续使用 `normalizeReminderError`，不展示 raw error body。
- 未修改 schema / migration。
- 未读取 `.env` / `.env.production` / 密钥 / 凭证。
- 未访问 production / VPS / 生产 DB。
- 未调用真实邮件、短信、企微、HR、SSO、财务、DOI、专利等外部系统。

## 验证命令和结果

- `corepack pnpm --filter @research-ip/api test -- reminders`：通过，7 files / 107 tests。
- `corepack pnpm --filter @research-ip/web test -- reminders App`：通过，3 files / 21 tests。
- `corepack pnpm --filter @research-ip/api typecheck`：通过。
- `corepack pnpm --filter @research-ip/web typecheck`：通过。
- `git diff --check`：通过。

## 未实现项

- 真实邮件/短信/企微告警。
- Prometheus / OpenTelemetry 指标导出。
- 长期趋势持久化。
- 自动修复 stuck lock。
- 外部 worker 监控。
- 生产监控平台接入。
