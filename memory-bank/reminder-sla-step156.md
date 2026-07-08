# Step156: 正式升级接收人解析 + SLA 队列 / 升级历史

## 范围

- 不修改 schema / migration，复用现有 `users`、`roles`、`user_roles`、`reminder_tasks`、`audit_logs`。
- 将逾期提醒升级从固定本人 fallback，增强为同部门角色接收人解析。
- 新增 SLA 队列安全投影。
- 新增提醒升级历史安全投影。

## 新增 / 修改 API

- `POST /reminders/:id/escalate-to-department`
  - 优先解析同部门有效角色用户。
  - 角色优先级：`DEPARTMENT_ADMIN` -> `RESEARCH_SECRETARY` -> `LEADER`。
  - 找不到正式候选人时才使用 `SELF_MVP_FALLBACK`。
  - 响应新增 `resolverStrategy`。
- `GET /reminders/sla-queue`
  - 返回当前接收人的 SLA 队列安全摘要。
  - 包含 `slaStatus`、`escalationTarget`、治理字段和目标摘要。
- `GET /reminders/:id/escalation-history`
  - 从审计日志中提取升级相关安全摘要。
  - 仅提醒接收人可读取自己的提醒升级历史。

## 正式接收人解析

- 查询当前上下文部门内 `ACTIVE` 且未归档用户。
- 用户必须存在未撤销的部门角色。
- 角色本身必须 `ACTIVE` 且未归档。
- 只返回用户 ID、部门 ID、角色 code，不返回邮箱、姓名、凭证、联系方式等个人信息。
- 若无候选人，返回：
  - `escalationTarget: "SELF_MVP_FALLBACK"`
  - `resolverStrategy: "SELF_MVP_FALLBACK:NO_DEPARTMENT_ROLE_CANDIDATE"`

## SLA 队列

- `OVERDUE`：`remindLevel === OVERDUE`
- `DUE_SOON`：已发送但未确认
- `PENDING`：待处理提醒
- 队列不持久化新状态，完全由现有 ReminderTask 字段推导。

## 升级历史

- 历史来源为 `audit_logs` 安全摘要。
- 仅筛选 `operation` 以 `ESCALATE_REMINDER` 开头的审计记录。
- 返回字段包括 operation、escalationReceiverId、escalationTarget、resolverStrategy、notificationId、status、sentAt、nextEscalationAvailableAt、createdAt。
- 不返回 raw oldValue / newValue。

## 前端入口

- `Reminders.tsx`
  - 新增 SLA 队列卡片。
  - 新增最近升级历史卡片。
- `reminder-center.ts`
  - 新增 `fetchReminderSlaQueue`。
  - 新增 `fetchReminderEscalationHistory`。
  - 新增 SLA 状态和升级目标标签 helper。

## 安全边界

- 未读取 `.env`、密钥、Cookie、Token、密码、连接串。
- 未访问 production / VPS / 生产数据库。
- 未调用真实邮件、短信、企微、HR、SSO、财务、DOI、专利等外部系统。
- 未修改 schema / migration。
- 不返回通知正文、附件原文、raw JSON、raw oldValue/newValue。

## 验证命令

- `corepack pnpm --filter @research-ip/api test -- reminders`
- `corepack pnpm --filter @research-ip/web test -- reminders App`
- `corepack pnpm --filter @research-ip/api typecheck`
- `corepack pnpm --filter @research-ip/web typecheck`
- `git diff --check`

## 后续未实现项

- SLA 定时扫描任务。
- SLA 队列持久化。
- 升级策略可配置化。
- 多级升级链路。
- 邮件、短信、企微等外部渠道。
