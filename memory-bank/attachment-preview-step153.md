# Step153 附件在线预览 MVP

## 实现范围

- 成果附件在线预览：
  - `GET /achievements/:achievementId/attachments/:attachmentId/preview`
  - Web 入口位于成果详情的附件列表，可预览附件显示“预览”，不可预览附件显示“不可预览”。
- 费用凭证附件在线预览：
  - `GET /fees/:feeRecordId/voucher-attachments/:attachmentId/preview`
  - Web 入口位于费用详情的费用凭证附件列表，可预览附件显示“预览”，不可预览附件显示“不可预览”。
- 前端预览通过后端受控 API 拉取 Blob，再生成 `blob:` URL；关闭预览弹窗时释放 object URL。

## 支持的 MIME 类型

- `application/pdf`
- `image/png`
- `image/jpeg`

不在 allowlist 内的附件预览请求返回 `415 Unsupported Media Type`。

## 权限、涉密与审计边界

- 预览接口复用现有下载权限边界、父资源可读策略、涉密授权策略和附件访问策略。
- 预览响应为二进制 `StreamableFile`，不 JSON 化附件内容。
- 响应头使用：
  - `Content-Type`: 附件 MIME 类型
  - `Content-Disposition: inline; filename="safe-name.ext"`
  - `Content-Length`
  - `X-Content-Type-Options: nosniff`
- 审计事件只记录安全摘要：
  - `operation: PREVIEW_ATTACHMENT`
  - `relationType: achievement | feeVoucher`
  - `attachmentId`
  - `fileName`
  - `mimeType`
  - `sizeBytes`
- 审计事件不记录附件 body、storageKey、objectKey、checksum、内部路径或原始对象存储信息。

## 不支持内容

- Office 在线预览。
- HTML/SVG 预览。
- 视频/音频预览。
- 外部对象存储直链。
- 预览水印/批注。
- 复杂文档转换。
- 附件原文导出或 raw JSON 展示。

## 验证结果

- `corepack pnpm --filter @research-ip/api test -- attachments`：通过，6 个文件、75 个测试。
- `corepack pnpm --filter @research-ip/web test -- Achievements Fees attachment-preview api-client`：通过，4 个文件、144 个测试。
- `corepack pnpm --filter @research-ip/web test -- AchievementDetail`：通过，1 个文件、35 个测试。
- `corepack pnpm --filter @research-ip/api typecheck`：通过。
- `corepack pnpm --filter @research-ip/web typecheck`：通过。

## Schema / Migration

- 未修改 schema。
- 未新增 migration。

## 安全确认

- 未读取 `.env` / `.env.production`。
- 未读取、展示、记录 Cookie、Token、密码、连接串或密钥。
- 未访问 production、VPS 或生产数据库。
- 未调用真实外部对象存储、HR/SSO、邮件短信、财务、DOI、专利等外部系统。
- 未执行删除、重置、清理、覆盖类 destructive 命令。
