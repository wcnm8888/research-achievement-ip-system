# Step184 - 附件在线预览体验补强

日期：2026-07-08

项目定位：`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

本 Step 只做本地评审版附件预览 / 下载路径的低风险 Web 体验优化。不接真实对象存储，不实现全文预览引擎，不读取真实生产附件，不访问 production / VPS / 生产 DB。

## 目标

- 补强成果详情附件区和费用凭证附件区的在线预览状态。
- 对不支持在线预览、权限不足、未登录 / 授权过期、预览失败、空状态和加载态给出中文业务提示。
- 预览失败时提供下载兜底引导。
- 避免普通评审看到 raw error、API path、storageKey、stack、JSON、token 或 cookie。
- 保持附件权限和后端安全边界不变，不扩大可下载 / 可预览权限。

## 源码变更

- `apps/web/src/AttachmentPreviewModal.tsx`
  - 预览错误态增加下载兜底按钮和中文提示。
  - 401 / 403 / 415 / 422 使用 warning 展示，其余失败使用 error 展示。
  - 保留加载态、空态、PDF iframe 和图片预览展示。
- `apps/web/src/AchievementDetail.tsx`
  - 成果附件不支持在线预览时，不请求 preview API，直接展示“附件格式暂不支持在线预览”说明。
  - 成果附件预览失败时，弹窗提供“下载附件”兜底动作，仍复用原有下载权限边界。
  - `mapAttachmentPreviewErrorToDisplay` 改为只返回安全中文展示字段，不携带后端原始 `body`。
- `apps/web/src/Fees.tsx`
  - 费用凭证附件同步成果附件区的预览说明和下载兜底体验。
  - 不支持格式不请求 preview API；可预览格式仍走原有受权限保护的 preview route。
- `apps/web/src/api-client.ts`
  - `downloadBlob` 失败时不再把后端原始错误 `body` 暴露给调用方。
  - 普通 JSON API 错误结构保持不变，避免影响导入等依赖结构化错误体的页面。

## 测试变更

- `apps/web/src/AchievementDetail.test.ts`
  - 扩展附件预览错误映射测试，覆盖 401、403、415、500 和未知失败。
  - 验证映射后不携带 `body`，不暴露 raw path、API path、storageKey、stack、raw JSON、token、password、cookie。
  - 保留成果附件预览成功走 authenticated backend preview route 的测试。
- `apps/web/src/api-client.test.ts`
  - 新增 Blob preview 错误脱敏测试。
  - 验证 `downloadBlob` 的 preview 失败错误不携带 raw response body，且不暴露 API path、token、cookie、storageKey 或对象 key。
- `apps/web/src/Fees.test.ts`
  - 保留费用凭证附件预览成功走 authenticated route 的测试。
- `apps/web/src/attachment-preview.test.ts`
  - 保留 PDF / PNG / JPEG 支持和非支持格式识别测试。

## 验证

```powershell
corepack pnpm --filter @research-ip/web test -- AchievementDetail Fees attachment-preview api-client
```

结果：PASS，4 files / 157 tests。

```powershell
corepack pnpm --filter @research-ip/web typecheck
```

结果：PASS。

## 二期 / 生产待接入

- 真实对象存储接入。
- 全文预览引擎或 Office / CAD / 多媒体等更多格式的生产级在线预览。
- 生产附件安全扫描、转码队列、缓存、鉴权签名 URL 和对象存储权限验收。
- VPS / 生产 DB / 生产附件数据验收。
- 生产监控告警、失败重试、预览服务容量和可用性验收。

## 安全边界确认

- 未读取 `.env`、`.env.production`、密钥、Cookie、Token 或生产连接串。
- 未读取真实生产附件内容。
- 未访问 production / VPS / 生产 DB。
- 未接入真实对象存储。
- 未调用真实外部预览服务。
- 未扩大附件下载 / 预览权限。
- 未绕过涉密授权。
- 未执行数据库迁移、清空、覆盖或重置。
- 未删除文件或目录。
- 未执行 `git reset`、`git restore`、`git clean`、Docker prune 或 volume prune。
- 未提交 `.local-step*`、`.learnings`、`apps/api/deploy`、`deliverables`、截图、性能日志、备份文件、临时脚本或真实附件文件。
