# Step186 - 回执确认与通知闭环体验补强

## 定位

本 Step 服务于“研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like”。

本 Step 只补强本地评审版可演示闭环：

- 站内提醒 / 通知摘要。
- 本地回执状态展示。
- 通知失败后的人工跟进兜底。
- 邮件通知预演的回执边界说明。
- 安全中文错误态。

不做真实外部通知回执联调，不新增真实邮件、短信、企微或其他外部通知发送能力。

## Web 补强范围

- `apps/web/src/reminder-center.ts`
  - 新增本地回执状态映射：
    - 待确认。
    - 已确认。
    - 已读未确认。
    - 确认超时。
    - 确认失败。
    - 已转人工跟进。
  - 新增状态颜色和人工跟进建议。
- `apps/web/src/Reminders.tsx`
  - 提醒中心新增本地评审版通知闭环说明。
  - 待处理提醒表新增“回执状态”列。
  - 新增“回执状态”摘要卡片。
  - 操作失败时追加站内摘要核对和人工跟进建议。
- `apps/web/src/SettingsApiIntegrations.tsx`
  - 邮件通知预演场景新增回执边界说明。
  - 预演结果新增“本地回执状态预演”。
  - 邮件预演失败 / 降级时显示人工跟进建议。
  - 空结果显示“请选择场景并运行本地预演”。
  - 预演结果中的场景、接口类型、请求模式和调用状态显示为中文评审口径。
- `apps/web/src/api-client.test.ts`
  - 补充通知回执预演失败时的错误映射安全断言。

## 口径

当前可演示：

- 站内通知摘要和本地回执状态预演。
- 邮件通知本地预演，不真实外发。
- 通知失败时提示站内摘要核对、人工跟进和本地服务状态确认。

仍属二期 / 生产待接入：

- 真实邮件发送。
- 真实短信发送。
- 真实企微消息发送。
- 真实外部送达、退信、已读、供应商回执和失败码联调。
- 生产供应商账号、密钥托管、限流、告警、重放和送达审计。

## 验证

- `corepack pnpm --filter @research-ip/web test -- Notifications notification receipt SettingsApiIntegrations api-client`: PASS, 2 files / 68 tests.
- `corepack pnpm --filter @research-ip/web test -- reminders`: PASS, 1 file / 9 tests.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.

## 安全边界

- 未读取 `.env` 或 `.env.production`。
- 未读取、展示或保存密钥、Cookie、Token、生产连接串或真实通知数据。
- 未访问 production / VPS / 生产 DB。
- 未调用真实 SMTP、短信、企微、HR、SSO、财务、专利服务商或外部通知平台。
- 未发送真实邮件、短信或企微消息。
- 未做数据库迁移、生产配置修改或外部系统接入。
- 未删除文件或目录。
