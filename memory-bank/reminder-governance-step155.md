# Step155: 提醒治理与升级策略 MVP

## 范围

- 在不修改 schema 的前提下，为提醒催办增加 24 小时频率限制。
- 扩展提醒中心安全投影，返回最近催办时间、下次可催办时间和升级可用性。
- 新增逾期提醒的站内升级催办 MVP。

## 新增 / 修改 API

- `GET /reminders/center`
  - 新增治理字段：`canEscalateToDepartment`、`escalationBlockedReason`、`lastSentAt`、`nextEscalationAvailableAt`、`governanceNote`。
- `POST /reminders/:id/escalate`
  - 新增 24 小时频率限制。
  - 命中频控返回 409：`Reminder escalation is rate limited.`
  - 命中频控时不发送通知，仅写安全审计摘要。
- `POST /reminders/:id/escalate-to-department`
  - 仅支持 `OVERDUE` 且状态为 `PENDING` / `SENT` 的提醒。
  - MVP 使用 `SELF_MVP_FALLBACK`，升级通知仍发送给当前提醒接收人。

## 频率限制规则

- `sentAt` 作为最近站内发送/催办时间。
- 同一提醒任务 `sentAt + 24h` 之前不允许再次普通催办。
- `PENDING` 且无 `sentAt` 的提醒允许首次催办并转为 `SENT`。
- `SENT` 且超过 24 小时的提醒允许再次催办，并刷新 `sentAt`。
- 催办次数本 Step 不持久化；提醒中心通过 `governanceNote` 标明 MVP 边界。

## 升级策略 MVP 边界

- 本 Step 不硬造部门秘书/主管查找模型。
- `escalate-to-department` 成功响应包含：
  - `escalationTarget: "SELF_MVP_FALLBACK"`
  - `escalationReceiverId`
- 后续需要接入正式部门角色查找后，再把升级接收人切换到部门秘书/审核人/管理员。

## 前端入口

- `Reminders.tsx`
  - 展示最近催办时间。
  - 展示下次可催办时间。
  - 展示频控原因。
  - 对逾期提醒展示“升级催办”按钮。
- `reminder-center.ts`
  - 新增 `escalateReminderToDepartment`。
  - 新增治理原因和治理文案 helper。

## 安全边界

- 未修改 schema / migration。
- 未读取 `.env`、密钥、Cookie、Token、密码或连接串。
- 未访问 production / VPS / 生产数据库。
- 未调用真实邮件、短信、企微、HR、SSO、财务、DOI、专利等外部系统。
- 不返回通知正文、附件原文、raw JSON、raw oldValue/newValue。
- 审计只写安全摘要字段，包括 operation、reminderTaskId、targetType、targetId、receiverId、remindLevel、status、sentAt、escalationReceiverId。

## 验证命令

- `corepack pnpm --filter @research-ip/api test -- reminders`
- `corepack pnpm --filter @research-ip/web test -- reminders App`
- `corepack pnpm --filter @research-ip/api typecheck`
- `corepack pnpm --filter @research-ip/web typecheck`
- `git diff --check`

## 未实现项

- 真实部门秘书/主管/管理员查找。
- 邮件、短信、企微等外部渠道。
- 持久化催办次数。
- 定时 SLA 队列。
- 自定义提醒模板和订阅策略。
