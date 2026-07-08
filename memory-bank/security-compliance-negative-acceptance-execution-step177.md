# Step177 - 安全与合规负向测试复跑与证据收口

日期：2026-07-08

项目定位保持为：

`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

本执行证据不代表真实生产上线完成、真实外部系统联调完成、VPS/生产 DB 验收完成、生产备份恢复完成或生产合规审计完成。

## 执行目标

按 `memory-bank/security-compliance-negative-acceptance-plan-step177.md` 复跑安全与合规相关负向测试，并收口本地一期可验证证据。

本次未重新规划，未扩展真实生产功能，未接入任何真实外部系统，未修改 API/Web 源码。

## 本次测试范围

API 安全负向相关范围：

- `authorization`
- `auth`
- `identity`
- `audit`
- `attachments`
- `account-management`
- `department-management`
- `secret-authorization`

Web 安全展示相关范围：

- `api-client`
- `error-display`
- `attachment-preview`
- `AuditLogs`
- `AccountManagement`
- `DepartmentManagement`

类型检查范围：

- `@research-ip/api`
- `@research-ip/web`

## API 安全负向测试结果

命令：

```powershell
corepack pnpm --filter @research-ip/api test -- authorization auth identity audit attachments account-management department-management secret-authorization
```

结果：PASS。

- Test Files：28 passed / 28
- Tests：246 passed / 246
- 覆盖到的关键边界：
  - 未登录请求返回 401。
  - 缺少权限返回 403。
  - production 模式不允许 `X-Demo-User-Id` 绕过 session 鉴权。
  - 权限策略和部门 scope 不扩权。
  - 涉密资源无授权时保持脱敏或拒绝。
  - 附件上传、列表、详情、下载、预览均受权限和策略约束。
  - 附件下载 / 预览失败时不读取或返回不应暴露的存储内部信息。
  - 审计查询和导出保持 masked / safe 字段。
  - 账号、角色、部门管理接口要求 `system:config`。
  - 登录、logout、session identity 不返回或记录 raw token。

备注：测试输出包含 Vite CJS Node API deprecation warning，非本次安全负向验收阻塞项。

## Web 安全展示测试结果

命令：

```powershell
corepack pnpm --filter @research-ip/web test -- api-client error-display attachment-preview AuditLogs AccountManagement DepartmentManagement
```

结果：PASS。

- Test Files：6 passed / 6
- Tests：132 passed / 132
- 覆盖到的关键边界：
  - API 401 / 403 / route fallback / 5xx 等错误映射为安全用户文案。
  - Web 错误态不展示 raw error、API path、JSON、stack trace。
  - 附件预览仅允许受支持类型，并通过 API client 下载边界。
  - 审计日志页面展示 masked 数据和安全导出行为。
  - 账号管理页面不期待或展示凭据、token、session 等敏感字段。
  - 部门管理页面保留权限错误和冲突错误的安全展示路径。

## Typecheck 结果

命令：

```powershell
corepack pnpm --filter @research-ip/api typecheck
corepack pnpm --filter @research-ip/web typecheck
```

结果：

- API typecheck：PASS。
- Web typecheck：PASS。

## 覆盖到的 7.4 验收点

| 7.4 验收点 | 本地证据状态 |
| --- | --- |
| RBAC 越权访问 | API guard / controller / service 测试已复跑通过 |
| 部门数据隔离 | policy scope、department-management、附件/业务访问测试已复跑通过 |
| 涉密成果 / 涉密附件未授权访问 | sensitive policy、secret authorization、attachment service/controller 测试已复跑通过 |
| 附件下载 / 预览权限边界 | attachment service/controller/app-module 和 Web attachment preview 测试已复跑通过 |
| 审计日志脱敏展示 | audit service/repository/app-module 和 Web AuditLogs 测试已复跑通过 |
| 审计导出脱敏 | audit service CSV/export safe summary 测试已复跑通过 |
| 账号 / 角色 / 部门管理权限边界 | account-management 与 department-management API/Web 测试已复跑通过 |
| 错误态脱敏 | Web `error-display` 与 `api-client` 测试已复跑通过 |
| 登录 / 会话未认证访问 | auth / identity / authorization guard 测试已复跑通过 |
| 本地备份 / 恢复链路与生产待补边界 | Step170A 文档和附件备份测试索引已纳入证据；本次未生成新备份产物 |

## 未覆盖 / 二期 / 生产待接入内容

以下仍不属于本次本地一期验收完成声明：

- 生产级每日自动备份调度。
- 备份保留 30 天的自动清理、监控、告警和权限策略。
- 真实恢复演练、隔离恢复环境恢复后应用健康检查。
- RTO / RPO 验收。
- 生产审计日志防篡改、长期归档、合规检索和合规销毁策略。
- 生产环境越权专项测试。
- 真实 SSO/HR 权限同步、离职禁用、权限撤销联动。
- 真实对象存储、异地备份、密钥托管和灾备演练。
- 真实 DOI、Crossref、OpenAlex、Scopus、SMTP、短信、企微、HR、财务、专利服务商联调。
- VPS / 生产 DB 部署、迁移、监控、告警、审计和生产压测。

## 安全边界确认

- 未读取 `.env` 或 `.env.production`。
- 未读取密钥、Cookie、Token、生产连接串、密码、session value 或 raw browser session material。
- 未访问 production / VPS / 生产 DB。
- 未调用真实 DOI、Crossref、OpenAlex、Scopus。
- 未调用真实 SMTP、短信、企微、HR、财务、专利服务商。
- 未执行数据库清空、迁移、覆盖、重置或真实恢复。
- 未执行 Docker prune / volume prune。
- 未删除文件或目录。
- 未执行 `git reset`、`git restore`、`git clean`。
- 未提交 `.local-step*`、`.learnings`、`apps/api/deploy`、`deliverables`、截图、性能日志、备份文件或临时脚本。

## 结论

Step177 执行阶段 PASS。安全与合规负向测试在本地一期范围内形成可提交证据；本结论仅限 local-demo / local Docker production-like，不外推为生产上线、真实外部系统联调、VPS/生产 DB 或生产灾备合规验收完成。
