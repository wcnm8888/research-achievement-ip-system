# 18、Step 18

## Step 18A

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 18A 执行。

本轮目标：
实现 Step 18A：后端 masked readonly audit-log API 契约，新增只读 `GET /audit-logs`，复用现有 `AuditService.listMasked(context, query)`，为后续 Step 18B 前端审计日志页面提供 API 基础。

前置状态：
- Step 18 计划确认：DONE。
- Step 18A 计划确认：DONE。
- 已确认目前缺少公开 `GET /audit-logs` controller。
- 已确认 audit 后端内核已有 service / repository / policy / redactor / query DTO 基础。
- 本轮只做后端 API 契约，不进入前端页面。

严格范围：
允许修改：
- `apps/api/src/audit/**`
- 必要时 `apps/api/src/app.module.ts`
- 必要时只读确认 `apps/api/src/authorization/**`
- 后端相关测试文件
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
- `memory-bank/evidence.md`
- `memory-bank/decisions.md`

禁止：
- 不修改 `apps/web/**`。
- 不实现前端审计日志页面。
- 不做系统配置、附件、Step 14 DataGap、Step 15 真实费用写入。
- 不做 seed / migrate / data backfill / data cleanup。
- 不新增导出、下载、unmasked 审计读取。
- 不读取 `.env`、密钥、Token、Cookie、证书、私钥。
- 不发起真实写请求。
- 不删除文件或目录。
- 不改变既有审计脱敏语义，除非发现明确漏洞并先停止说明。

实现要求：
1. 新增最小 `AuditController`，暴露 `GET /audit-logs`。
2. 使用 `UserContextGuard` + `PermissionGuard`。
3. 使用 `@CurrentUser()`。
4. 静态权限使用 `@RequirePermissions(PermissionCode.auditReadMasked)`。
5. Query 支持计划确认中列出的第一版字段：
   - `actorUserId`
   - `actorDepartmentId`
   - `action`
   - `targetType`
   - `targetId`
   - `targetDepartmentId`
   - `traceId`
   - `createdFrom`
   - `createdTo`
   - `take`
6. 将现有 query type 补成适合 HTTP 层使用的 validation / transform DTO，保留 service/repository 需要的输入形状。
7. `take` 必须限制范围，建议 1..100。
8. `createdFrom` / `createdTo` 必须校验 ISO date string 并安全转换。
9. 响应只能返回 masked audit list，不暴露 raw `oldValue`、`newValue`、`ipAddress`、`userAgent`。
10. 如 root AppModule 当前未挂载 AuditModule，请显式导入，避免依赖传递导入。
11. 保持 GET-only，不新增 POST / PATCH / DELETE。

测试要求：
新增或更新后端测试，至少覆盖：
- `GET /audit-logs` 成功调用 `AuditService.listMasked` 并返回 masked list。
- 无 `X-Demo-User-Id` 或无用户上下文返回 401。
- 缺少 `audit:read_masked` 权限返回 403。
- 非法 enum/date/take query 返回 400。
- 无权限或非法 query 时不调用 service。
- 响应不包含 `oldValue`、`newValue`、`ipAddress`、`userAgent`。
- masked value 不泄露 token/cookie/password/api key/storageKey/checksum/configRef 等敏感明文。
- 如修改 AppModule，补 root 可达性测试，并确认 `/health` 仍可用。

质量门禁：
实现后运行：
- `corepack pnpm --filter @research-ip/api test`
- `corepack pnpm --filter @research-ip/api typecheck`

如果项目存在并适用于 api build，则运行：
- `corepack pnpm --filter @research-ip/api build`

最后运行：
- `corepack pnpm lint`

如果某个命令无法运行，必须说明原因、替代验证和风险。

memory-bank 更新：
- `decisions.md` 新增 D082：Step 18A exposes only masked readonly audit-log API。
- `implementation-plan.md` 顶部记录 Step 18A 范围、边界、后续 Step 18B。
- `progress.md` 记录 Step 18A 执行状态。
- `evidence.md` 记录测试、typecheck、build/lint 证据，以及无 schema/seed/write/front-end 变更证据。
- 明确 Step 18A 不等于完整审计平台，不包含导出、unmasked、前端页面、配置、附件、真实写入、seed/migrate/data cleanup。

完成输出：
1. Step 18A 状态：DONE / PARTIAL / BLOCKED。
2. 修改文件列表。
3. 实现内容摘要。
4. 门禁命令和结果。
5. 未覆盖范围与剩余风险。
6. 下一步只建议回到 Prompt 编排对话，由 Prompt 编排对话生成 Step 18B，不要自行生成下一步 Prompt。
~~~



## Step 18B

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 18B 执行。

本轮目标：
实现 Step 18B：前端 masked readonly 审计日志页面，复用 Step 18A 已完成的后端 `GET /audit-logs`，把 `apps/web/src/App.tsx` 中的 `audit` 从 BoundaryPage 接入真实只读页面。

前置状态：
- Step 18 计划确认：DONE。
- Step 18A 计划确认：DONE。
- Step 18A 执行：DONE。
- Step 18B 计划确认：DONE。
- 后端已有 `GET /audit-logs`，使用 `audit:read_masked` 权限，返回 masked audit list。
- 本轮只做前端页面，不改后端 API contract。

严格范围：
允许修改：
- `apps/web/src/AuditLogs.tsx`
- `apps/web/src/AuditLogs.test.tsx` 或同类测试文件
- `apps/web/src/types.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/App.css`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
- `memory-bank/evidence.md`
- `memory-bank/decisions.md`

禁止：
- 不修改 `apps/api/**`。
- 不新增后端语义。
- 不新增 POST / PATCH / DELETE。
- 不做导出、下载、复制 raw JSON、unmasked 查看。
- 不做系统配置、附件、真实费用写入、Step 14 DataGap。
- 不做 seed / migrate / data backfill / data cleanup。
- 不读取 `.env`、密钥、Token、Cookie、证书、私钥。
- 不删除文件或目录。
- 不展示 raw `oldValue`、`newValue`、`ipAddress`、`userAgent`。

实现要求：
1. 新增 `AuditLogs` 页面。
2. 在 `App.tsx` 中将 `activeKey === "audit"` 接入 `AuditLogs`。
3. 更新 audit 导航文案为 Step 18B masked readonly audit-log 页面，不再说未实现。
4. 页面仅调用 `GET /audit-logs`。
5. 无 demo user 时不发起业务 API 请求。
6. 支持基础筛选：
   - `action`
   - `targetType`
   - `targetId`
   - `actorUserId`
   - `traceId`
   - `take`
7. 前端校验：
   - `take` 范围 1..100。
   - UUID 字段格式非法时阻止请求或显示明确校验状态。
   - traceId 过长时阻止请求或显示明确校验状态。
8. 展示 masked audit list，只渲染 masked 字段和安全摘要字段。
9. 即使响应意外携带 raw 字段，页面类型与渲染逻辑也必须忽略。
10. 覆盖加载、空、错误、权限不足、成功状态。
11. 页面不提供导出、下载、unmasked、写入入口。
12. 390px 下筛选区和日志内容可读，不出现 document-level 横向溢出。

测试要求：
新增或更新前端测试，至少覆盖：
- no-demo-user 不请求 `/audit-logs`。
- 有 demo user 时调用 `GET /audit-logs` 并渲染 masked list。
- query shaping 只包含允许字段。
- 非法 take / UUID / traceId 不发起无效请求或显示校验状态。
- 401 / 403 / 400 / 500 / network error 显示正确状态。
- 空数组显示空状态。
- 不渲染 raw `oldValue`、`newValue`、`ipAddress`、`userAgent`。
- token/cookie/password/api key/storageKey/checksum/configRef 等敏感词 fixture 不以明文展示。
- 页面无 POST / PATCH / DELETE / export / download / unmasked 入口。

质量门禁：
实现后运行：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器 / API 验收：
执行阶段请临时启动前端并在完成后收尾停止。验收：
- 无 demo user：进入审计日志页，不发业务 API 请求。
- 有 `audit:read_masked` 权限用户：只出现 `GET /api/audit-logs?...`。
- 无权限用户：显示 403 / 权限不足状态。
- 筛选 action、targetType、targetId、actorUserId、traceId、take 后请求参数正确。
- 页面无导出、下载、unmasked、写入入口。
- 390px 宽度无页面级横向溢出。

memory-bank 更新：
- `decisions.md` 新增 D083：Step 18B implements frontend masked readonly audit-log page over existing GET-only API。
- `implementation-plan.md` 顶部记录 Step 18B 范围、非目标、文件范围、门禁。
- `progress.md` 记录 Step 18B 执行状态。
- `evidence.md` 记录测试、typecheck、build、lint、浏览器验收，以及无后端/schema/seed/write/export/unmasked 变更证据。

完成输出：
1. Step 18B 状态：DONE / PARTIAL / BLOCKED。
2. 修改文件列表。
3. 实现内容摘要。
4. 门禁命令和结果。
5. 浏览器/API 验收结果。
6. 未覆盖范围与剩余风险。
7. 下一步回到 Prompt 编排对话，不要自行生成 Step 18C Prompt。
~~~

## Step 18C

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 18C 收尾归档执行。

本轮目标：
将 Step 18 归档为 masked readonly audit-log closure，汇总 Step 18A 后端 `GET /audit-logs` 与 Step 18B 前端 AuditLogs 页面证据、边界和剩余风险。

前置状态：
- Step 18 计划确认：DONE。
- Step 18A：DONE，后端 masked readonly `GET /audit-logs` API 已完成。
- Step 18B：DONE，前端 masked readonly 审计日志页面已完成，`audit` 已从 BoundaryPage 接入真实页面。
- Step 18C 计划确认：DONE。
- D082 / D083 已记录。
- Step 18A 门禁：api test / typecheck / build / lint 全 PASS。
- Step 18B 门禁：web test / typecheck / build / lint 全 PASS。
- Step 18B 浏览器验收覆盖 no-user、mock success、mock 403、筛选 query、无敏感入口、390px。
- 已知残余风险：Step 18B 浏览器 success/403 使用 Playwright route mock，不是 live DB 数据集。

严格范围：
只允许修改：
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
- `memory-bank/evidence.md`
- `memory-bank/decisions.md`

禁止：
- 不修改 `apps/api/**`。
- 不修改 `apps/web/**`。
- 不修改 Prisma/schema/migration/seed。
- 不修改配置、CI/CD、权限、环境文件。
- 不运行 seed / migrate / data cleanup。
- 不新增功能。
- 不删除或清理 `apps/api/dist/**`、`apps/web/dist/**`、`.playwright-cli/**`、日志文件或任何目录。
- 不读取 `.env`、密钥、Token、Cookie、证书、私钥。
- 不发起 POST / PATCH / DELETE。
- 不做导出、下载、unmasked、审计分析、系统配置、附件、真实费用写入。

执行要求：
1. 只读当前 memory-bank 顶部 Step 18A / 18B 记录，避免全量展开历史。
2. 在 `implementation-plan.md` 顶部新增 Step 18 Archive / Step 18C 归档记录。
3. 在 `progress.md` 顶部记录：
   - Step 18A：DONE。
   - Step 18B：DONE。
   - Step 18C：DONE。
   - Step 18 overall / Archive：DONE_WITH_MOCK_BROWSER_RISK。
4. 在 `evidence.md` 顶部汇总：
   - Step 18A 后端门禁证据。
   - Step 18B 前端门禁证据。
   - Step 18B 浏览器/API 验收摘要。
   - mock 浏览器验收残余风险。
   - 产物记录：`apps/api/dist/**`、`apps/web/dist/**`、`.playwright-cli/**`、后端 dev log 追加内容均为执行/验证副产物，本轮不删除。
   - 明确无 seed/migrate/data cleanup、无真实写请求、无导出/下载/unmasked。
5. 在 `decisions.md` 顶部新增 D084：
   - Step 18 archives masked readonly audit-log closure without expanding into full audit platform。
   - 说明 Step 18 不包含导出、下载、unmasked、审计分析、系统配置、附件、真实费用写入、Step 14 DataGap、seed/migrate/data cleanup。
6. 不强制复跑完整门禁，因为本轮只改 memory-bank 且 Step 18A/18B 最近门禁已全 PASS。
7. 可不做 live smoke；如果你认为必须补强，只允许只读 `GET /api/health` 和 `GET /api/audit-logs?take=50`，不得启动数据库、不得 seed/migrate、不得发写请求。若服务不可用，记录原因，不阻塞归档。

完成输出：
1. Step 18C 状态：DONE / PARTIAL / BLOCKED。
2. Step 18 overall / Archive 状态。
3. 修改文件列表。
4. 归档摘要。
5. 是否运行门禁或 smoke；如未运行，说明原因。
6. 剩余风险。
7. 下一步回到 Prompt 编排对话，不要自行生成下一步 Prompt。
~~~

