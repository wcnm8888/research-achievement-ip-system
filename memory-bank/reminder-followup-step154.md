# Step154: 提醒与催办闭环 MVP

## 范围

- 提供当前用户的提醒中心安全摘要。
- 支持费用提醒的确认闭环。
- 支持费用提醒的站内二次催办。
- 合并展示当前用户可访问的审批待办摘要。

## 新增后端能力

- `GET /reminders/center`
  - 返回当前用户的费用提醒和审批待办安全摘要。
  - 仅查询当前用户 `receiverId` 的未闭环提醒。
  - 工作流待办复用 `WorkflowService.listMyWorkflowTasks` 的权限判断。
- `POST /reminders/:id/escalate`
  - 仅允许提醒接收人催办自己的提醒。
  - `PENDING` 提醒会发送站内通知并转为 `SENT`。
  - `SENT` 提醒允许再次发送站内通知，不做无意义状态回写。
  - `CONFIRMED` / `CANCELLED` / 其他终态返回冲突语义。

## 新增前端入口

- `App.tsx` 新增导航项：`提醒中心`。
- `Reminders.tsx`
  - 展示闭环摘要。
  - 展示费用提醒和审批待办列表。
  - 对可处理费用提醒提供 `确认` 和 `催办` 操作。
  - 提供刷新、空状态、加载状态和错误状态。
- `reminder-center.ts`
  - 封装提醒中心 API 调用、状态标签、严重级别颜色、日期格式化和错误归一化。

## 安全边界

- 不修改 schema / migration。
- 不发送邮件、短信或真实外部通知。
- 不读取 `.env`、密钥、Cookie、Token、密码或连接串。
- 不访问 production / VPS / 生产数据库。
- 提醒中心不返回通知正文、附件原文、审计 raw JSON、`oldValue` / `newValue`。
- 催办审计仅写入安全摘要字段，并标记 `operation: "ESCALATE_REMINDER"`。

## 验证命令

- `corepack pnpm --filter @research-ip/api test -- reminders`
- `corepack pnpm --filter @research-ip/web test -- reminders App`
- `corepack pnpm --filter @research-ip/api typecheck`
- `corepack pnpm --filter @research-ip/web typecheck`
- `git diff --check`

## 后续边界

- 暂不支持邮件/短信/企微等外部渠道。
- 暂不支持催办频率限制、定时任务队列、升级到主管/管理员、SLA 配置。
- 暂不支持提醒模板配置和用户自定义订阅策略。
