# Step172 - 接口验收 Mock 闭环 MVP

## 目标

补齐演示环境允许使用 Mock 接口替代的验收短板，优先覆盖：

- DOI 自动补全预演：返回可用于成果登记人工带入的安全字段。
- 邮件通知预演：展示收件范围、主题、摘要、通道状态和降级路径。
- 接口治理：继续复用接口配置元数据、启用状态、超时配置、安全调用日志和降级结果。

本 Step 不接入真实 DOI/Crossref/OpenAlex/Scopus，不接入 SMTP、短信、企微或其他真实外部通知系统。

## 实现范围

- API:
  - 新增 `EMAIL_NOTIFICATION` Mock 场景。
  - DOI 预演请求支持传入当前 DOI 作为 `subject`，成功结果补充 `journal`、`publishYear`、`citationSource`、`citationSummary`、`fieldMapping` 等安全预览字段。
  - 邮件成功结果返回 `recipientScope`、`subject`、`summary`、`channel`、`deliveryStatus`、`retryPolicySummary`、`timeoutMs`、`fallback`、`sendsExternalMessage=false`。
  - 邮件降级结果返回站内/人工处理 fallback，不发送外部消息。
  - DOI、邮件、专利、财务、HR 预演结果统一为中文评审口径，避免页面出现 raw engineering 文案。
  - 继续写入 `ApiCallLog` 安全摘要，不保存外部原始请求/响应。
- Web:
  - 成果登记页 DOI 字段旁新增“自动补全预演”，展示题名、作者、期刊/会议、年份、引用摘要和字段建议，不自动覆盖用户已填内容。
  - 系统接口配置页的预演中心新增“邮件通知预演”。
  - 供应商筛选新增 EMAIL 预演入口。
  - 系统接口配置页的预演结果字段标签和状态标签改为中文。
  - Web 类型补齐 `EMAIL_NOTIFICATION` 和可选 `subject`。
- 测试:
  - 覆盖 API service DOI subject 预演和中文安全字段。
  - 覆盖 API service 邮件预演成功路径和安全字段。
  - 覆盖 API controller 接收 `EMAIL_NOTIFICATION` payload。
  - 覆盖 AchievementForm DOI 预演 payload 构造。
  - 覆盖 Web payload helper 支持邮件通知预演。

## 验证

- `corepack pnpm --filter @research-ip/api test -- settings`: PASS, 3 files / 19 tests.
- `corepack pnpm --filter @research-ip/web test -- SettingsApiIntegrations AchievementForm`: PASS, 2 files / 22 tests.
- `corepack pnpm --filter @research-ip/api typecheck`: PASS.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.

## 边界

- 未读取 `.env` 或 `.env.production` 内容。
- 未读取、打印、保存或提交密码、Cookie、Token、连接串、API Key 或 provider credential。
- 未访问 production/VPS/production DB。
- 未调用真实 DOI、文献库、SMTP、短信、企微、HR/SSO、财务或专利平台。
- 未修改 Prisma schema、迁移、seed、部署配置或生产配置。
- 当前结论只证明本地 Mock 演示闭环，不等同于真实外部接口联调完成。
