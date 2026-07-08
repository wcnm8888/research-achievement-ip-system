# Step157: SLA 定时扫描任务 + 策略配置化 + 多级升级链路

## 范围

- 不修改 schema / migration。
- 提供可由外部调度器调用的 SLA 扫描任务入口。
- 将 SLA 策略配置化为后端默认策略对象，并通过 API 暴露。
- 支持三级升级链路。
- 升级历史补充策略、等级和 SLA 状态摘要。

## 新增 / 修改 API

- `GET /reminders/sla-policy`
  - 返回当前默认 SLA 策略。
- `POST /reminders/sla-scan/run`
  - 运行一次 SLA 扫描。
  - 当前 MVP 扫描当前业务用户作为 receiver 的提醒任务。
  - 返回 scanned / escalated / skipped 摘要。
- `GET /reminders/:id/escalation-history`
  - 历史项新增 `policyCode`、`escalationLevel`、`slaStatus`。

## 默认策略

- `policyCode`: `REMINDER_SLA_DEFAULT_MVP`
- `cooldownHours`: 24
- Level 1: `DEPARTMENT_COORDINATOR`
  - afterHours: 0
  - roles: `DEPARTMENT_ADMIN`, `RESEARCH_SECRETARY`
  - scope: `DEPARTMENT`
- Level 2: `DEPARTMENT_LEADER`
  - afterHours: 48
  - roles: `LEADER`
  - scope: `DEPARTMENT`
- Level 3: `SYSTEM_ADMIN`
  - afterHours: 72
  - roles: `SYSTEM_ADMIN`
  - scope: `GLOBAL`

## 扫描规则

- 只扫描 `PENDING` / `SENT` / `FAILED` 的当前接收人提醒。
- 非 `OVERDUE` 跳过。
- 24 小时冷却期内跳过，避免重复通知。
- `PENDING` 逾期提醒升级后转为 `SENT`。
- `SENT` 逾期提醒升级后刷新 `sentAt`。
- 每次扫描升级写入安全审计摘要：`ESCALATE_REMINDER_SLA_SCAN`。

## 多级升级链路

- 根据 `sentAt` 到当前时间的小时数选择最高满足条件的等级。
- 找不到角色候选人时保留 `SELF_MVP_FALLBACK`。
- 不返回用户姓名、邮箱、联系方式、凭证或通知正文。

## 前端入口

- `Reminders.tsx`
  - 新增 “SLA 策略与扫描” 卡片。
  - 展示策略摘要。
  - 支持手动运行扫描。
  - 显示扫描结果摘要。
- `reminder-center.ts`
  - 新增 `fetchReminderSlaPolicy`。
  - 新增 `runReminderSlaScan`。
  - 新增策略格式化 helper。

## 安全边界

- 未读取 `.env`、密钥、Cookie、Token、密码、连接串。
- 未访问 production / VPS / 生产数据库。
- 未调用真实邮件、短信、企微、HR、SSO、财务、DOI、专利等外部系统。
- 未新增依赖。
- 未在应用启动时自动运行扫描，避免不可控写库；当前扫描任务通过 API/服务方法触发，可由后续外部调度器调用。

## 验证命令

- `corepack pnpm --filter @research-ip/api test -- reminders`
- `corepack pnpm --filter @research-ip/web test -- reminders App`
- `corepack pnpm --filter @research-ip/api typecheck`
- `corepack pnpm --filter @research-ip/web typecheck`
- `git diff --check`

## 后续未实现项

- 真正的后台 cron/scheduler 模块。
- 扫描全量部门/全量用户的系统任务。
- SLA 策略数据库持久化和页面配置。
- 多级升级的人工确认/暂停/豁免。
- 外部通知渠道。
