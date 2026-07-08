# Step177 - 安全与合规负向验收补强计划

日期：2026-07-08

项目定位必须保持为：

`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

本计划不代表真实生产上线完成、真实外部系统联调完成、VPS/生产 DB 验收完成、生产备份恢复完成或生产合规审计完成。

## 目标

本 Step 只确认 7.4 安全与合规负向验收补强计划，不实现源码改动，不新增测试代码，不执行完整测试套件。

计划目标：

- 梳理一期本地可验证的安全与合规能力。
- 对齐已有测试和证据来源。
- 明确 Step178 建议复跑或新增的负向测试清单。
- 明确仍属于二期 / 生产待接入的内容。
- 固定安全边界，避免误读为真实生产验收完成。

## 本地一期可验证项

| 验收范围 | 本地一期可验证项 | 当前判断 |
| --- | --- | --- |
| RBAC 越权访问 | 未登录返回 401；缺少权限返回 403；生产模式不允许 `X-Demo-User-Id` 绕过鉴权；系统配置类接口仅系统管理员可用 | 已具备测试基础，Step178 建议复跑聚合 |
| 部门数据隔离 | 成果、费用、搜索、审批、部门视图通过 policy where / scoped department 控制访问范围 | 已具备单元和服务层测试基础，Step178 建议补负向矩阵 |
| 涉密成果访问 | 涉密成果在无有效授权时只返回脱敏摘要，不返回正文、内容字段或敏感附件信息 | 已具备 policy / service / search / secret authorization 测试基础 |
| 涉密附件未授权访问 | 附件列表、详情、下载、预览必须同时满足父资源读取、涉密策略和附件下载权限 | 已具备 service / controller 测试基础，Step178 建议聚焦 403/无 storage read |
| 附件下载 / 预览边界 | 下载和预览通过 API 权限边界；预览只允许 PDF/PNG/JPEG；不返回 storageKey、objectKey、checksum、内部路径 | 已具备 API / Web helper 测试基础 |
| 审计日志脱敏展示 | 审计查询只返回 masked/safe 字段；敏感键、token、password、storageKey、checksum 等不外露 | 已具备 service / repository / redactor 测试基础 |
| 审计导出脱敏 | CSV 导出只包含安全摘要字段；导出行为本身有安全事件摘要 | 已具备 audit service 测试基础 |
| 账号 / 角色 / 部门管理权限 | 账号、角色分配、部门创建/禁用/启用均需 `system:config`；非管理员 403；无上下文 401 | 已具备 controller / service / Web client 测试基础 |
| 错误态脱敏 | Web/API 错误展示不暴露 raw error、API path、route fallback、JSON、stack trace | 已具备 Step173 / Step176 证据和 Web 测试基础 |
| 登录 / 会话未认证访问 | `/api/auth/me` 无会话返回 401；登录不返回 raw token；logout 清理 cookie；生产模式只走 session cookie | 已具备 auth / identity 测试基础 |
| 本地备份 / 恢复链路 | 本地 PostgreSQL `pg_dump`、manifest、SHA-256 校验、恢复 dry-run 计划；附件备份 manifest 工具 | 已具备 Step170A 文档证据和附件备份测试 |

## 已有测试 / 证据来源

文档证据：

- `memory-bank/final-acceptance-coverage-step174.md`：最终验收覆盖矩阵，明确安全、审计、备份恢复和生产待接入边界。
- `memory-bank/final-demo-smoke-step176.md`：本地 Docker production-like 只读 smoke，覆盖未认证登录页、SPA fallback、受保护 API 401 和错误态脱敏。
- `memory-bank/testing-strategy.md`：测试分层、凭据边界、production-like 与 production/VPS 区分规则。
- `memory-bank/local-backup-restore-acceptance-step170a.md`：本地备份 / 恢复 MVP 证据。
- `memory-bank/local-backup-restore-commands-step170a.md`：本地备份和非破坏性校验命令边界。

相关测试索引：

- RBAC / guard / production demo header：`apps/api/src/authorization/guards/authorization-http.spec.ts`
- 权限策略 / 部门 scope / query where：`apps/api/src/authorization/policy/policy-services.spec.ts`
- 涉密策略 / 审计脱敏策略：`apps/api/src/authorization/policy/sensitive-policy-services.spec.ts`
- 登录 / 会话：`apps/api/src/auth/auth.controller.spec.ts`、`apps/api/src/auth/auth.service.spec.ts`、`apps/api/src/identity/session-identity.adapter.spec.ts`、`apps/api/src/identity/dev-identity.adapter.spec.ts`
- 附件权限下载 / 预览：`apps/api/src/attachments/attachment.controller.spec.ts`、`apps/api/src/attachments/attachment.service.spec.ts`、`apps/api/src/attachments/attachment.app-module.spec.ts`、`apps/web/src/attachment-preview.test.ts`
- 审计查询 / 导出 / 脱敏：`apps/api/src/audit/audit.service.spec.ts`、`apps/api/src/audit/audit.repository.spec.ts`、`apps/api/src/audit/audit.app-module.spec.ts`、`apps/web/src/AuditLogs.test.ts`
- 账号管理边界：`apps/api/src/account-management/account-management.controller.spec.ts`、`apps/api/src/account-management/account-management.service.spec.ts`、`apps/api/src/account-management/account-management.repository.spec.ts`
- 部门管理边界：`apps/api/src/department-management/department-management.controller.spec.ts`、`apps/api/src/department-management/department-management.service.spec.ts`、`apps/api/src/department-management/department-management.repository.spec.ts`
- 涉密授权管理只读边界：`apps/api/src/secret-authorization/secret-authorization.controller.spec.ts`、`apps/api/src/secret-authorization/secret-authorization.service.spec.ts`
- 错误态脱敏：`apps/web/src/error-display.test.ts`、`apps/web/src/api-client.test.ts`
- 附件备份 manifest：`apps/api/src/operations/attachment-binary-backup.spec.ts`

## Step178 建议复跑或新增的测试

优先复跑现有负向测试，先证明既有安全网仍稳定：

```powershell
corepack pnpm --filter @research-ip/api test -- authorization auth identity audit attachments account-management department-management secret-authorization
corepack pnpm --filter @research-ip/web test -- api-client error-display attachment-preview AuditLogs AccountManagement DepartmentManagement
git diff --check
git diff --cached --check
```

建议新增或补强的 Step178 聚焦测试：

1. RBAC API 负向矩阵：对安全关键接口统一覆盖 401、403、成功三态，接口至少包括成果、附件、审计、账号管理、部门管理、涉密授权、搜索。
2. 部门隔离矩阵：同部门可读、跨部门不可读、管理员可按权限读取、无 scope 不返回全量；重点覆盖成果、费用、搜索、审批任务。
3. 涉密成果与涉密附件矩阵：无授权只见脱敏摘要；无附件下载权限返回 403；直接附件 grant 不能泄露父成果正文；拒绝后不读取 storage。
4. 附件预览边界：PDF/PNG/JPEG 可预览；其他类型 415；预览与下载共用权限边界；错误响应不含 storageKey、objectKey、checksum、真实路径。
5. 审计查询与导出脱敏：查询、CSV 导出、导出事件摘要均不含 token、password、cookie、session、storageKey、checksum、raw IP、完整 user agent、连接串。
6. 账号 / 角色 / 部门管理边界：研究员、部门管理员、财务审阅等非系统管理员访问账号和部门管理接口全部 403；无会话全部 401。
7. 错误态脱敏浏览器 smoke：未认证入口和受保护 API 的 401/403/404/5xx 页面不出现 `Cannot GET`、API path、raw JSON、stack trace、raw error、debug。
8. 本地备份 / 恢复链路复核：只复核 Step170A 命令和 manifest 规则，不生成或提交新备份产物；若要执行真实备份或恢复，另开授权 Step。

## 不做的内容

本计划确认阶段不做：

- 不修改 API / Web 源码。
- 不新增测试代码。
- 不执行完整测试套件。
- 不访问 production / VPS / 生产 DB。
- 不读取 `.env`、`.env.production`、密钥文件、Cookie、Token、生产连接串。
- 不调用真实 DOI、Crossref、OpenAlex、Scopus、SMTP、短信、企微、HR、财务、专利服务商。
- 不执行数据库清空、迁移、覆盖、重置、真实恢复。
- 不生成、移动、删除、清理或提交备份文件、截图、性能日志、`.local-step*`、`.learnings`、`apps/api/deploy`、`deliverables`。

## 生产 / 二期待接入内容

以下仍属于二期或生产专项，不能纳入一期本地完成声明：

- 生产级每日自动备份调度。
- 备份保留 30 天的自动化策略、权限、监控和告警。
- 真实恢复演练，包括隔离恢复环境、恢复后应用健康检查、回滚和审计。
- RTO / RPO 验收。
- 生产审计日志防篡改、长期归档、留存策略、合规检索和合规销毁策略。
- 生产环境越权专项测试，包括真实 SSO/HR 权限同步后的角色、部门、离职/禁用、权限撤销验证。
- 真实对象存储、外部备份仓、异地备份、密钥托管和灾备演练。
- 真实外部 DOI / 文献库 / SMTP / 企微 / HR / 财务 / 专利服务商联调。
- VPS / 生产 DB 部署、迁移、监控、告警、审计和生产压测。

## 安全边界

Step177 和后续 Step178 应保持以下边界：

- 只使用本地 Docker production-like 或单元 / 集成测试环境。
- 凭据只允许用户显式授权的临时本地测试凭据；不得打印、保存、提交或写入 evidence。
- 对会话问题只记录布尔、状态码、计数和脱敏摘要，不记录 cookie、session、hash、secret。
- 对备份只记录 manifest 规则、大小、SHA-256 校验状态和 dry-run 结论；本地产物不提交。
- 对审计只记录脱敏字段和安全摘要，不记录完整 raw payload、IP、UA、连接串、凭据或业务正文。
- 对外汇报只能说“一期本地评审提交版已具备本地可演示和可测试的安全合规闭环，生产化专项仍待接入”。

## Step178 推荐执行顺序

1. 运行 API 安全负向聚合测试：authorization、auth、identity、audit、attachments、account-management、department-management、secret-authorization。
2. 运行 Web 安全展示和错误态测试：api-client、error-display、attachment-preview、AuditLogs、AccountManagement、DepartmentManagement。
3. 如现有测试缺少统一矩阵，新建最小 API negative acceptance spec，覆盖 401/403/脱敏/无 storage read 关键断言。
4. 复核 Step170A 本地备份文档和附件备份测试，确认仍只声明本地 MVP。
5. 运行 `git diff --check` 和 `git diff --cached --check`。
6. 更新 `memory-bank/progress.md` 与 `memory-bank/evidence.md`，只记录脱敏结果和生产待接入边界。
