# Step161 - SLA 扫描运行指标看板 MVP

## 新增 API

- `GET /reminders/sla-scan/metrics`
  - 需要 `system:config` 权限。
  - 基于最近 200 条 SLA 扫描执行记录聚合运行指标。
  - 返回字段包括：
    - `generatedAt`
    - `sampleSize`
    - `latestRun`
    - `totals`
    - `triggerBreakdown`
    - `statusBreakdown`
    - `backlog`
    - `recentFailures`

## 指标口径

- `totals.queued/running/completed/failed/skipped`：按扫描执行记录状态统计。
- `totals.totalScanned`：最近样本内累计扫描提醒数。
- `totals.totalEscalated`：最近样本内累计升级数。
- `totals.totalSkippedItems`：最近样本内累计跳过数。
- `totals.successRate`：`COMPLETED / (COMPLETED + FAILED + SKIPPED)`，无终态记录时为 `0`。
- `backlog.queuedCount`：当前样本内排队任务数。
- `backlog.runningCount`：当前样本内运行中任务数。
- `backlog.oldestQueuedAt`：当前样本内最早排队时间。
- `recentFailures`：最近 5 条失败或带安全失败原因的记录。

## 前端入口

- `Reminders.tsx` 的 SLA 卡片新增运行指标区块。
- 展示：
  - 样本数
  - 排队数
  - 运行中数
  - 成功率
  - 已完成数
  - 失败数
  - 升级数
  - 最早排队时间
- `reminder-center.ts` 新增：
  - `fetchReminderSlaScanMetrics`
  - `formatReminderSlaSuccessRate`

## 安全边界

- 指标 API 仍走 `UserContextGuard` 和 `PermissionGuard`，需要 `system:config`。
- 指标只使用 SLA 扫描执行记录的安全字段。
- `recentFailures` 不返回 `safeSummary`、raw error、通知正文、附件原文、raw oldValue/newValue。
- 不读取或输出 Cookie、Token、password、session、连接串、密钥等敏感字段。
- 本 Step 未修改 schema / migration。
- 未接入真实邮件、短信、企微、HR、SSO、财务、DOI、专利等外部系统。
- 未访问 production / VPS / 生产 DB。

## 验证命令和结果

- `corepack pnpm --filter @research-ip/api test -- reminders`：通过，7 files / 100 tests。
- `corepack pnpm --filter @research-ip/web test -- reminders App`：通过，3 files / 21 tests。
- `corepack pnpm --filter @research-ip/api typecheck`：通过。
- `corepack pnpm --filter @research-ip/web typecheck`：通过。
- `git diff --check`：通过。

## 未实现项

- 长期趋势持久化。
- 图表化趋势分析。
- Prometheus / OpenTelemetry 指标导出。
- 生产级监控告警。
- 分布式 worker 维度的吞吐、延迟和错误率统计。
- 按部门、策略、升级层级拆分的 SLA 指标看板。
