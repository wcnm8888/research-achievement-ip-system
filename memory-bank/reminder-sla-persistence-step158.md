# Step158 - SLA 策略持久化配置 + 全量系统扫描任务 + 扫描执行记录

## 新增能力

- 新增 SLA 策略持久化配置表：`reminder_sla_policy_configs`。
- 新增 SLA 扫描执行记录表：`reminder_sla_scan_runs`。
- `GET /reminders/sla-policy` 优先返回启用中的持久化策略；未配置时回退默认策略。
- `PUT /reminders/sla-policy` 保存 SLA 策略配置，需要 `system:config`。
- `POST /reminders/sla-scan/run-all` 执行全量提醒 SLA 扫描，需要 `system:config`。
- `GET /reminders/sla-scan/runs` 返回最近扫描执行记录，需要 `system:config`。
- 保留 `POST /reminders/sla-scan/run` 当前接收人范围扫描。

## 全量扫描规则

- 扫描范围：全系统 `PENDING`、`SENT`、`FAILED` 提醒任务，MVP 单次最多 500 条。
- 仅逾期提醒进入升级；非逾期、频控中、非可操作状态会写入跳过摘要。
- 部门级升级按提醒接收人所属部门解析角色接收人；全局级升级按全局角色解析。
- 每次全量扫描先创建 `RUNNING` 记录，完成后更新为 `COMPLETED`，失败时更新为 `FAILED`。

## 前端入口

- 提醒中心 SLA 卡片展示当前策略。
- 新增“保存策略”入口，将当前策略写入持久化配置。
- 新增“全量扫描”入口，调用全量扫描 API。
- 展示最近扫描执行记录的安全摘要。

## 安全边界

- 策略写入、全量扫描、扫描执行记录读取均要求 `system:config`。
- 扫描记录只保存计数、任务 ID、升级层级、接收人 ID、目标类型、跳过原因等安全摘要。
- 不保存通知正文、附件原文、raw oldValue/newValue、Cookie、Token、password、session、连接串、密钥。
- 未访问 production / VPS / 生产 DB。
- 未读取 `.env` / `.env.production` / 凭证。
- 未调用真实邮件、短信、企微、HR、SSO、财务、DOI、专利等外部系统。

## 验证结果

- `corepack pnpm --filter @research-ip/api test -- reminders`：通过，6 files / 88 tests。
- `corepack pnpm --filter @research-ip/web test -- reminders App`：通过，3 files / 21 tests。
- `corepack pnpm --filter @research-ip/api typecheck`：通过。
- `corepack pnpm --filter @research-ip/web typecheck`：通过。
- `git diff --check`：通过。
- `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/research_ip_validate'; corepack pnpm prisma validate`：通过，仅用于 schema 解析校验，未连接生产数据库。

## 未实现项

- 后台定时器/cron 自动触发全量扫描。
- 扫描任务异步队列和并发锁。
- 策略版本发布、回滚、审批流。
- 可视化多级升级链路编辑器。
- 邮件、短信、企微等外部通知渠道。
