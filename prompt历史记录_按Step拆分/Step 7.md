# 7、Step 7

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 7。

本次只做 Step 7 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 1 memory-bank DONE。
- Step 2 项目脚手架 DONE。
- Step 3 数据库 schema / migration / seed DONE。
- Step 4 RBAC 与部门隔离 DONE。
- Step 5 成果登记一期后端流程 DONE。
- Step 6 基础审批流 DONE：
  - Step 6A：workflow domain / DTO / repository 基础完成。
  - Step 6B：submit 创建 workflow、部门 approve/reject、系统管理员 archive workflow 收口完成。
  - Step 6C：workflow approve/reject HTTP、我的待办列表、待办详情完成。
  - Step 6D：WorkflowModule 已显式接入 root AppModule，AppModule-level HTTP wiring 测试通过。
- Step 7 仍为 TODO，尚未开始。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\07-database-production.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\product-brief.md
- E:\研究院科研成果管理系统\memory-bank\feature-brief.md
- E:\研究院科研成果管理系统\memory-bank\design-spec.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts

Step 7 目标草案：
- 实现附件与审计基础能力。
- 覆盖附件元数据、版本、上传/下载鉴权边界、成果关联、涉密附件访问策略。
- 覆盖核心业务操作的审计事件记录与查询预留。
- 复用 Step 4 的权限、涉密授权、附件访问策略和审计脱敏规则。
- 复用 Step 5 Achievement 业务边界和 Step 6 workflow 关键状态变更事实。
- 不直接暴露真实对象存储，优先设计 storage adapter 边界。
- 不做前端页面，除非计划确认后另拆步骤。
- 不做费用、提醒、搜索、看板。
- 不改已执行 migration，除非先明确 schema 缺口、提出新增 migration 计划并等待确认。

请输出：
1. Step 7 的任务等级和风险判断。
2. Step 7 是否需要拆成 7A / 7B / 7C / 7D。
3. 每个子步骤的范围、文件边界、完成定义和验证命令。
4. 当前 schema 是否已足够支持附件与审计；如果不足，说明是否需要新增 migration。
5. Attachment 模块目录结构建议。
6. Audit 模块目录结构建议。
7. 附件 metadata、version、storage key、download 鉴权的边界。
8. 如何复用 Step 4 的附件访问策略、涉密授权和审计脱敏规则。
9. 如何避免附件下载绕过 Achievement 详情权限。
10. 审计日志应记录哪些稳定事实，不记录哪些敏感信息。
11. storage adapter 是否先做 fake/local/mock，是否需要新增依赖。
12. 测试矩阵和 fake/mock/provider override 策略。
13. 是否需要真实数据库、migration、seed 或对象存储。
14. 验证命令和边界检查命令。
15. 需要我确认的问题。

要求：
- 先不要写代码。
- 不修改文件。
- 不直接实现 Step 7。
- 不访问真实数据库。
- 不运行 migrate、seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。
- 不实现费用、提醒、搜索、看板。
- 不实现前端页面。
- 不修改已执行 migration。
- 如果 Step 7 太大，请先拆分，等我确认后再执行。
~~~

## Step 7A

~~~
先不要执行 Step 7A。

请先做 Step 7A 的执行计划确认，只读诊断，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前准备进入 Step 7A：Audit foundation。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\workflow

当前状态：
- Step 6 整体 DONE。
- Step 7 仍为 TODO，尚未开始。
- Step 7 已初步建议拆为：
  - 7A：Audit foundation
  - 7B：Attachment foundation + storage adapter
  - 7C：Attachment HTTP upload/download/list boundary
  - 7D：Core audit integration
- 本次只确认 7A，不执行。

Step 7A 目标草案：
- 建立 audit domain / repository / service / DTO / tests。
- 复用现有 AuthorizationModule 中的 AuditRedactorService / AuditReadPolicyService。
- 支持 append-only 审计事件写入。
- 支持 masked audit 查询预留。
- 为后续 7D 预留 createInTransaction(client, input)，避免业务事务和审计事务分裂。
- repository 测试使用 fake Prisma，不访问真实数据库。
- 不创建 audit controller，不暴露 HTTP API。
- 不接入 root AppModule。
- 不接入 AchievementService / WorkflowService 业务事务。

请输出：
1. Step 7A 的精确目标。
2. Step 7A 的风险等级和风险点。
3. Step 7A 是否需要再拆成 7A-1 / 7A-2。
4. 允许创建/修改的文件清单。
5. 明确禁止修改的文件清单。
6. Audit 模块目录结构建议。
7. Audit domain 层应包含哪些类型、常量、mapper、错误。
8. AuditRepository 应包含哪些方法，是否需要 InTransaction 版本。
9. AuditService 应包含哪些方法，如何复用 AuditRedactorService / AuditReadPolicyService。
10. 审计写入应记录哪些稳定事实。
11. 审计写入和 masked DTO 必须排除哪些敏感信息。
12. 当前 schema 是否足够支持 7A，是否需要新增 migration。
13. 是否需要新增依赖。
14. 单元测试 / fake Prisma repository 测试矩阵。
15. 验证命令和边界检查命令。
16. 需要我确认的问题。

要求：
- 只读诊断。
- 不写代码。
- 不修改文件。
- 不进入 7B / 7C / 7D。
- 不实现附件模块。
- 不创建 apps/api/src/attachments。
- 不创建 controller 或 HTTP route。
- 不接入 root AppModule。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 main.ts。
- 不修改 AchievementService / WorkflowService。
- 不修改 schema.prisma、migration、seed、package.json 或 lockfile。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不记录聊天全文、临时讨论或完整命令日志。
~~~

~~~
确认执行 Step 7A。

本次只执行 Step 7A：Audit foundation。
不进入 7B / 7C / 7D，不实现附件模块，不创建 controller，不暴露 HTTP API，不接入 root AppModule，不接 Achievement/Workflow 业务事务，不访问真实数据库，不运行 migrate/seed。

我确认：
- Step 7A 不拆外部步骤，一次完成；但内部按 7A-1 / 7A-2 顺序实现：
  - 7A-1：domain + mapper + repository + fake Prisma tests。
  - 7A-2：service + redaction/read-policy tests + module wiring。
- Step 7A 完成后允许更新 memory-bank：
  - E:\研究院科研成果管理系统\memory-bank\progress.md
  - E:\研究院科研成果管理系统\memory-bank\evidence.md
  - E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
  - 如有重要取舍，再更新 decisions.md / architecture.md。
- masked 查询预留在 7A 只返回 items，不做分页总数 count；count 留到后续 HTTP API 或真实查询需要时再补。
- 未来 7D 的默认策略是：审计写入在同一业务事务内执行；审计失败则业务回滚。7A 只预留 recordEventInTransaction / createInTransaction，不接入业务事务。
- Step 7A 不新增 migration，不修改 schema.prisma，不修改 migration，不修改 seed。
- Step 7A 不新增依赖，不修改 package.json / pnpm-lock.yaml。
- Step 7A 复用现有 AuthorizationModule 中的 AuditRedactorService / AuditReadPolicyService。
- 当前 schema 足够支持 7A。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

执行范围：
- 创建 apps/api/src/audit/**。
- 新增 AuditModule。
- 新增 AuditRepository。
- 新增 AuditService。
- 新增 audit domain 类型、常量、mapper、错误类型。
- 新增 masked audit 查询预留类型或 DTO。
- 支持 append-only 审计事件写入。
- 支持 masked audit 查询预留。
- 提供 createInTransaction(client, input)，供后续 7D 在 Achievement/Workflow 业务事务内调用。
- 提供 recordEventInTransaction(client, input)，供后续 7D service 编排使用。
- repository 测试使用 fake Prisma，不访问真实数据库。
- service 测试覆盖审计事件构造、脱敏输出、不暴露敏感字段、append-only 写入语义。

建议目录结构：
- apps/api/src/audit/audit.module.ts
- apps/api/src/audit/audit.repository.ts
- apps/api/src/audit/audit.repository.spec.ts
- apps/api/src/audit/audit.service.ts
- apps/api/src/audit/audit.service.spec.ts
- apps/api/src/audit/domain/audit-action-code.ts
- apps/api/src/audit/domain/audit-target-type-code.ts
- apps/api/src/audit/domain/audit-event.types.ts
- apps/api/src/audit/domain/audit-repository.types.ts
- apps/api/src/audit/domain/audit-prisma.mapper.ts
- apps/api/src/audit/domain/audit-errors.ts
- apps/api/src/audit/dto/audit-query.dto.ts 或等价查询预留类型

Repository 建议方法：
- create(input): Promise<AuditLogRecord>
- createInTransaction(client, input): Promise<AuditLogRecord>
- findMany(input): Promise<AuditLogRecord[]>
- 暂不实现 count。
- transaction client 类型使用 Pick<Prisma.TransactionClient, "auditLog">。
- createInTransaction 只调用 client.auditLog.create，不嵌套 transaction。
- repository 不实现 update/delete/deleteMany/updateMany。

Service 建议方法：
- recordEvent(input)
- recordEventInTransaction(client, input)
- listMasked(context, query)
- listMasked 必须先调用 AuditReadPolicyService.canReadMaskedAudit(context)。
- listMasked 必须用 AuditRedactorService.redactAuditLog(record) 返回 masked 结果。
- AuditService 不返回 unmasked audit DTO。

审计写入只记录稳定事实：
- actorUserId
- actorDepartmentId
- action
- targetType
- targetId
- targetDepartmentId
- targetSecretLevel
- traceId
- oldValue / newValue 中仅允许状态、版本、目标 ID、动作枚举、时间、workflow task/instance id、attachment id/version/fileName 等稳定摘要。

禁止记录或暴露：
- 密码、Token、Cookie、API key、证书、私钥、完整连接串。
- .env、DATABASE_URL、认证 header。
- 附件内容、真实对象存储路径、storageKey、checksum。
- 原始 IP、完整 User-Agent。
- 论文摘要全文、审批意见全文中的敏感内容、外部接口完整响应。
- 未脱敏 oldValue / newValue。

禁止修改：
- prisma/schema.prisma
- prisma/migrations/**
- prisma/seed.cjs
- package.json
- pnpm-lock.yaml
- apps/api/src/app.module.ts
- apps/api/src/main.ts
- apps/api/src/achievements/achievement.service.ts
- apps/api/src/workflow/workflow.service.ts
- apps/api/src/attachments/**
- 任何 controller 或 HTTP route 文件
- 任何全局 APP_GUARD / useGlobalPipes / useGlobalGuards

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "Controller\\(|@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/audit
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "deleteMany|delete\\(|updateMany|update\\(" apps/api/src/audit
- rg -n "storageKey|DATABASE_URL|process\\.env|password|token|cookie|apiKey|privateKey" apps/api/src/audit
- rg -n "AuditModule" apps/api/src/app.module.ts

完成后更新 memory-bank，并最后汇报：
1. 创建/修改了哪些文件。
2. Step 7A 实现了什么。
3. 明确没有进入哪些范围。
4. 审计记录哪些稳定事实、哪些敏感信息不会记录。
5. 哪些验证通过。
6. 哪些验证失败及原因。
7. 是否可以进入 Step 7B 前计划确认。
~~~

## Step 7B

~~~
Step 7A 已完成并归档。现在进入 Step 7B 前计划确认。

本次只做 Step 7B 执行计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

请精确读取与 Step 7B 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7A 最新归档、Step 7 当前状态、附件/审计相关架构和决策。如需扩大读取范围，请先说明原因。

当前状态：
- Step 6 整体 DONE。
- Step 7A DONE：Audit foundation 已完成。
- Step 7A 新增 AuditModule / AuditRepository / AuditService / domain / DTO / tests。
- Step 7A 已支持 append-only 审计写入、masked audit 查询预留、recordEventInTransaction / createInTransaction。
- Step 7A 未创建 controller / HTTP route，未接入 root AppModule，未接入 AchievementService / WorkflowService。
- Step 7A 未修改 schema、migration、seed、package、lockfile。
- Step 7A 验证通过：
  - corepack pnpm --filter @research-ip/api test：21 files / 210 tests
  - corepack pnpm --filter @research-ip/api typecheck
  - corepack pnpm --filter @research-ip/api build
  - corepack pnpm lint
  - corepack pnpm prisma:validate
- Step 7B 仍为 TODO。

Step 7B 目标草案：
- 实现 Attachment foundation + storage adapter。
- 建立附件 domain / repository / service / DTO / storage adapter interface。
- 使用 fake storage provider，不接真实对象存储。
- 支持附件 metadata 创建、版本号计算、storage key 生成。
- 复用 Step 4 附件访问策略和涉密边界，为后续 7C HTTP upload/download/list 做准备。
- 不创建 controller，不暴露 HTTP API。
- 不接入 root AppModule。
- 不实现真实上传/下载流。
- 不进入 7C / 7D。
- 不修改 schema/migration/seed，除非先确认确实需要新增 migration。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7 / 7A 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7A 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7A 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中附件、审计、Step 7 相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Attachment / Audit / 安全权限相关段落
- E:\研究院科研成果管理系统\prisma\schema.prisma 中 Attachment 相关模型和枚举
- E:\研究院科研成果管理系统\apps\api\src\authorization 中附件访问、涉密授权、权限常量相关文件
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 7B 的精确目标。
2. Step 7B 的风险等级和风险点。
3. Step 7B 是否需要拆成 7B-1 / 7B-2。
4. 当前 Attachment schema 是否足够；是否必须新增 migration。
5. 是否确认 7B 先不补 contentType / sizeBytes / storageProvider / storageKey unique。
6. 允许创建/修改的文件清单。
7. 明确禁止修改的文件清单。
8. Attachment 模块目录结构建议。
9. Attachment domain 应包含哪些类型、状态、mapper、错误。
10. AttachmentRepository 应包含哪些方法，是否需要 InTransaction 版本。
11. AttachmentService 应包含哪些方法。
12. storage adapter interface / fake storage adapter 如何设计。
13. storage key 生成规则和不得暴露规则。
14. 版本号计算规则。
15. 如何复用 Step 4 AttachmentAccessPolicyService / SecretAccessPolicyService。
16. 如何预留 Step 7C upload/download/list HTTP 边界。
17. 如何预留 Step 7D audit integration，但不在 7B 接入。
18. 测试矩阵和 fake Prisma / fake storage 策略。
19. 验证命令和边界检查命令。
20. 需要我确认的问题。

要求：
- 只读计划确认。
- 不写代码。
- 不修改文件。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不实现 controller 或 HTTP route。
- 不接入 root AppModule。
- 不实现真实对象存储。
- 不实现前端页面。
- 不进入 7C / 7D。
~~~

~~~
确认执行 Step 7B。

本次只执行 Step 7B：Attachment foundation + storage adapter。
不进入 7C / 7D，不创建 controller，不暴露 HTTP API，不接入 root AppModule，不实现真实上传/下载流，不接真实对象存储，不访问真实数据库，不运行 migrate/seed。

请精确读取与 Step 7B 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7A 最新归档、Step 7 当前状态、附件/审计相关架构和决策。如需扩大读取范围，请先说明原因。

我确认：
- Step 7B 外部不拆分，一次完成；内部按 7B-1 / 7B-2 顺序实现：
  - 7B-1：domain + mapper + repository + fake Prisma tests + storage adapter interface / fake。
  - 7B-2：service + access-policy preparation + module wiring + service / fake storage tests。
- 7B 不新增 migration。
- 7B 暂不补 contentType / sizeBytes / storageProvider / storageKey unique。
- 7B 只支持 ACHIEVEMENT relation 的 service 业务预留；FEE_RECORD / WORKFLOW_ACTION 只保留 domain/schema 常量，不实现业务编排。
- fake storage 只做内存或纯 fake，不落盘、不生成本地文件、不访问网络、不接对象存储。
- 7B 允许创建 apps/api/src/attachments/**。
- 7B 完成后允许更新：
  - E:\研究院科研成果管理系统\memory-bank\progress.md
  - E:\研究院科研成果管理系统\memory-bank\evidence.md
  - E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
  - 如有重要取舍，再更新 decisions.md / architecture.md。
- 7B 不接入 AuditService，不调用 recordEvent / recordEventInTransaction。
- 7B 不修改 schema.prisma、migration、seed、package.json、pnpm-lock.yaml。
- 7B 不修改 AchievementService / WorkflowService / AuditService。
- 7B 不接入 root AppModule。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7 / 7A 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7A 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7A 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中附件、审计、Step 7 相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Attachment / Audit / 安全权限相关段落
- E:\研究院科研成果管理系统\prisma\schema.prisma 中 Attachment 相关模型和枚举
- E:\研究院科研成果管理系统\apps\api\src\authorization 中附件访问、涉密授权、权限常量相关文件
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\audit 仅用于确认 7B 不接入审计

执行范围：
- 创建 apps/api/src/attachments/**。
- 新增 AttachmentsModule。
- 新增 AttachmentRepository。
- 新增 AttachmentService。
- 新增 attachment domain 类型、常量、mapper、错误类型、storage key 工具。
- 新增 attachment DTO / query 预留类型。
- 新增 storage adapter interface / token / fake storage adapter。
- 支持附件 metadata 创建。
- 支持同一 relationType + relationId + fileName 下版本号递增。
- 支持 storage key 生成。
- 支持 ACHIEVEMENT relation 的 service 业务预留。
- repository 测试使用 fake Prisma，不访问真实数据库。
- storage fake 测试不访问文件系统、不访问网络。
- service 测试覆盖版本计算、storage key 生成、不返回 storageKey、policy 调用顺序预留、fake storage 调用。

建议目录结构：
- apps/api/src/attachments/attachments.module.ts
- apps/api/src/attachments/attachment.repository.ts
- apps/api/src/attachments/attachment.repository.spec.ts
- apps/api/src/attachments/attachment.service.ts
- apps/api/src/attachments/attachment.service.spec.ts
- apps/api/src/attachments/domain/attachment-relation-type-code.ts
- apps/api/src/attachments/domain/attachment-status-code.ts
- apps/api/src/attachments/domain/attachment-event.types.ts
- apps/api/src/attachments/domain/attachment-repository.types.ts
- apps/api/src/attachments/domain/attachment-prisma.mapper.ts
- apps/api/src/attachments/domain/attachment-errors.ts
- apps/api/src/attachments/domain/storage-key.ts
- apps/api/src/attachments/dto/attachment-create.dto.ts
- apps/api/src/attachments/dto/attachment-query.dto.ts
- apps/api/src/attachments/storage/attachment-storage.adapter.ts
- apps/api/src/attachments/storage/attachment-storage.token.ts
- apps/api/src/attachments/storage/fake-attachment-storage.adapter.ts
- apps/api/src/attachments/storage/fake-attachment-storage.adapter.spec.ts

Repository 建议方法：
- create(input): Promise<AttachmentRecord>
- createInTransaction(client, input): Promise<AttachmentRecord>
- findLatestVersion(input): Promise<number | null>
- findManyByRelation(input): Promise<AttachmentRecord[]>
- findById(id): Promise<AttachmentRecord | null>
- transaction client 类型使用 Pick<Prisma.TransactionClient, "attachment">。
- 不实现 update/delete/deleteMany/updateMany。
- archive/block 不在 7B 做。
- findResourceGrantsForAttachmentAndParent 不在 7B 做，留到 7C 按 HTTP 鉴权需要补。

Service 建议方法：
- createMetadata(input)
- createMetadataInTransaction(client, input)
- prepareStorageObject(input) 或等价内部方法生成 storage key
- listMetadataForRelation(context, query) 作为 7C list 预留，不暴露 HTTP
- getMetadataForAccessCheck(context, attachmentId) 作为 7C download 前置准备
- 不返回 storageKey 给上层 public DTO。
- 不接 AuditService。

Storage adapter 设计：
- putObject(input): Promise<{ storageKey: string; checksum?: string | null }>
- getObject(input) 可只定义接口，不实现真实流。
- 不提供 deleteObject。
- 不提供 getSignedUrl。
- fake adapter 使用内存 Map 或纯 fake result。
- fake adapter 不落盘、不访问网络、不接对象存储。

storage key 规则：
- 格式建议：attachments/{relationType}/{relationId}/{uuid}/v{version}/{safeFileName}
- relationType 使用固定枚举值。
- relationId 必须是 UUID。
- 中间使用 crypto.randomUUID() 避免碰撞。
- fileName 只用于可读尾部，必须 basename + 清理路径字符。
- 不使用用户原始路径。
- 不把 storageKey 暴露给 public DTO、controller 预留返回值或审计 oldValue/newValue。

版本号规则：
- 同一 relationType + relationId + fileName 下递增。
- nextVersion = latestVersion + 1；无历史则 1。
- Repository 查询按 version desc 取最新。
- 当前 schema 的唯一约束防止同文件同版本重复。
- 并发上传同名文件的唯一冲突映射为 AttachmentVersionConflictError；事务重试留到 7C 或后续步骤。

权限预留：
- 7B 不做 HTTP，但 service 层应预留父资源访问决策 -> AttachmentAccessPolicyService 的调用顺序。
- metadata 读取后续使用 AttachmentAccessPolicyService.canReadMetadata(...)。
- download 后续使用 AttachmentAccessPolicyService.canDownload(...)。
- 父资源使用 SecretResourceDescriptor 或现有等价类型。
- 父资源访问决策必须来自 Achievement/Fee/WorkflowAction 自己的资源权限，不允许附件服务直接绕过父资源详情权限。
- 涉密/机密附件沿用 Step 4：owner 不自动可读，必须 SECRET_READ 或单附件下载窄授权。

7C 预留：
- upload route 后续只调用 service，不直接碰 storage adapter。
- download route 后续必须先做 metadata + parent access + attachment policy，再从 storage adapter 取对象。
- list route 后续只返回 metadata masked/public shape。
- 7B 不创建 controller，不注册 route。

7D 预留：
- 7B 不接 AuditService。
- service 返回足够稳定事实，供 7D 写审计：
  - attachment id
  - relationType / relationId
  - fileName
  - version
  - status
  - secretLevel
  - uploaderId
  - traceId 可作为未来 input 预留
- 不传 storageKey / checksum 到审计 input。

禁止：
- 不创建 controller 或 HTTP route。
- 不接入 root AppModule。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 main.ts。
- 不修改 prisma/schema.prisma。
- 不修改 prisma/migrations/**。
- 不修改 prisma/seed.cjs。
- 不修改 package.json / pnpm-lock.yaml。
- 不修改 apps/api/src/audit/**。
- 不修改 apps/api/src/achievements/achievement.service.ts。
- 不修改 apps/api/src/workflow/workflow.service.ts。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不记录或暴露 storageKey、真实对象存储路径、附件内容、checksum、认证 header、完整连接串、环境变量值。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "Controller\(|@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/attachments
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "deleteMany|delete\(|updateMany|update\(" apps/api/src/attachments
- rg -n "storageKey|DATABASE_URL|process\.env|password|token|cookie|apiKey|privateKey" apps/api/src/attachments
- rg -n "AttachmentsModule|AttachmentModule" apps/api/src/app.module.ts
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/attachments

完成后更新 memory-bank，并最后汇报：
1. 创建/修改了哪些文件。
2. Step 7B 实现了什么。
3. 明确没有进入哪些范围。
4. 当前 attachment schema 足够支撑哪些能力，哪些生产级字段/约束留到后续。
5. storage key 如何生成，如何保证不暴露。
6. fake storage 如何保证不访问文件系统、网络或真实对象存储。
7. 哪些验证通过。
8. 哪些验证失败及原因。
9. 是否可以进入 Step 7C 前计划确认。
~~~



## Step 7c

~~~
Step 7B 已完成并归档。现在进入 Step 7C 前计划确认。

本次只做 Step 7C 执行计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

请精确读取与 Step 7C 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7A / 7B 最新归档、Step 7 当前状态、附件/审计/权限相关架构和决策。如需扩大读取范围，请先说明原因。

当前状态：
- Step 6 整体 DONE。
- Step 7A DONE：Audit foundation 已完成。
- Step 7B DONE：Attachment foundation + fake storage adapter 已完成。
- Step 7B 新增 standalone AttachmentsModule，但未接入 root AppModule。
- Step 7B 新增 AttachmentRepository / AttachmentService / storage adapter interface / fake in-memory adapter。
- Step 7B 支持 ACHIEVEMENT relation 的 metadata 创建预留、版本号递增、object key 生成、fake storage 调用、metadata-only 返回。
- Step 7B 未创建 controller / HTTP route。
- Step 7B 未接入真实对象存储、文件系统或网络。
- Step 7B 未接入 AuditService。
- Step 7B 未修改 schema、migration、seed、package、lockfile。
- Step 7B 验证通过：
  - corepack pnpm --filter @research-ip/api test：24 files / 228 tests passed
  - corepack pnpm --filter @research-ip/api typecheck：passed
  - corepack pnpm --filter @research-ip/api build：passed
  - corepack pnpm lint：passed
  - corepack pnpm prisma:validate：passed
- Step 7C 仍为 TODO。

Step 7C 目标草案：
- 实现 Attachment HTTP upload/download/list boundary。
- 在 AttachmentsModule 内创建 controller，不先接 root AppModule。
- 暴露 Achievement 附件相关 HTTP 边界：
  - 上传附件 metadata / fake object 写入入口
  - 查询成果附件列表
  - 查询附件详情或下载准备边界
  - 下载接口必须先鉴权，再通过 storage adapter 获取对象
- 显式使用 UserContextGuard / PermissionGuard / @CurrentUser() / @RequirePermissions()。
- 复用 Step 4 AttachmentAccessPolicyService / SecretAccessPolicyService / PolicyQueryFactory。
- 复用 Step 5 Achievement 资源可见性边界，避免附件接口绕过 Achievement 详情权限。
- 不接真实对象存储。
- 不接 root AppModule；root AppModule wiring 留到后续子步骤，除非计划判断必须拆出 7C-2 / 7C-3。
- 不接 AuditService；附件 upload/download 审计留到 7D。
- 不实现前端页面。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7 / 7A / 7B 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7A / 7B 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7A / 7B 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中附件、审计、权限相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Attachment / Audit / 安全权限相关段落
- E:\研究院科研成果管理系统\apps\api\src\attachments
- E:\研究院科研成果管理系统\apps\api\src\authorization 中附件访问、涉密授权、权限常量、guard/decorator 相关文件
- E:\研究院科研成果管理系统\apps\api\src\achievements 中 controller/service/repository 的 HTTP 与资源权限边界
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\prisma\schema.prisma 中 Attachment / Achievement / ResourceGrant 相关模型和枚举

请输出：
1. Step 7C 的精确目标。
2. Step 7C 的风险等级和风险点。
3. Step 7C 是否需要拆成 7C-1 / 7C-2 / 7C-3。
4. 本步是否只做 module-local controller，root AppModule integration 是否后置。
5. 需要暴露哪些 HTTP routes，各自权限和 DTO 边界。
6. 上传接口在没有真实对象存储的情况下如何处理 fake storage。
7. 下载接口如何保证先鉴权、后取对象。
8. 如何避免附件接口绕过 Achievement 详情权限。
9. 单附件 ATTACHMENT_DOWNLOAD direct grant 是否作为下载例外；如果是，如何保证不暴露 Achievement 业务详情。
10. 附件 list / detail / download 的 public response shape。
11. 是否需要新增 DTO、param pipe、error mapping。
12. 是否需要修改 AttachmentService / AttachmentRepository。
13. 是否需要修改 AchievementsModule / AttachmentsModule 的 imports/providers。
14. 是否需要接入 root AppModule。
15. 是否需要接入 AuditService；如果不接，如何为 7D 保留稳定事实。
16. 测试矩阵和 provider override 策略。
17. 是否需要真实数据库、migration、seed、依赖或真实对象存储。
18. 验证命令和边界检查命令。
19. 需要我确认的问题。

要求：
- 只读计划确认。
- 不写代码。
- 不修改文件。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不接真实对象存储。
- 不实现前端页面。
- 不进入 Step 7D。
- 不接入 AuditService。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 main.ts。
~~~

~~~
确认执行 Step 7C。

本次只执行 Step 7C：AttachmentsModule 内部的附件 HTTP 边界。
只执行 7C-1 / 7C-2，不执行 7C-3；root AppModule integration 单独留到后续确认。

请精确读取与 Step 7C 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7A / 7B 最新归档、Step 7 当前状态、附件/审计/权限相关架构和决策。如需扩大读取范围，请先说明原因。

我确认：
- Step 7C 只做 module-local controller，不修改 root AppModule。
- Step 7C 不接真实对象存储，不使用文件系统，不访问网络。
- Step 7C 不接 AuditService，不调用 recordEvent / recordEventInTransaction。
- Step 7C 不修改 schema、migration、seed、package、lockfile。
- Step 7C 不进入前端、不进入 Step 7D。
- 上传 route 静态权限采用 `achievement:update_own`。
- 上传 route 不额外要求 `attachment:read_metadata`。
- fake download 响应允许返回 `body` 字段，用于 fake storage / HTTP 边界测试；但绝不返回 object key、checksum、真实路径或父 Achievement 业务详情。
- direct `ATTACHMENT_DOWNLOAD` grant 只允许作为 download route 的下载例外；不能授权 list/detail，不能返回 Achievement 业务详情。
- 7C 内部按以下顺序实现：
  - 7C-1：补 service/repository 的父资源鉴权、grant 查询、download preparation 能力。
  - 7C-2：新增 module-local controller、HTTP DTO、错误映射、controller tests。
- 7C-3 root AppModule wiring 后置，需另行确认。

当前状态：
- Step 7A DONE：Audit foundation 已完成。
- Step 7B DONE：Attachment foundation + fake storage adapter 已完成。
- AttachmentsModule standalone，未接 root AppModule。
- AttachmentService / AttachmentRepository / fake in-memory storage adapter 已存在。
- Step 7B 已支持 ACHIEVEMENT relation 的 metadata 创建预留、版本号递增、object key 生成、fake storage 调用、metadata-only 返回。
- Step 7B 未接 AuditService、未接真实对象存储、未创建 controller/HTTP。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7 / 7A / 7B 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7A / 7B 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7A / 7B 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中附件、审计、权限相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Attachment / Audit / 安全权限相关段落
- E:\研究院科研成果管理系统\apps\api\src\attachments
- E:\研究院科研成果管理系统\apps\api\src\authorization 中附件访问、涉密授权、权限常量、guard/decorator 相关文件
- E:\研究院科研成果管理系统\apps\api\src\achievements 中 controller/service/repository 的 HTTP 与资源权限边界
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\prisma\schema.prisma 中 Attachment / Achievement / ResourceGrant 相关模型和枚举

执行范围：
- 在 AttachmentsModule 内新增 AttachmentController。
- 只做 module-local HTTP tests。
- 为 HTTP guard 依赖补齐必要 module imports，例如 IdentityModule；不要接 root AppModule。
- 不 import AchievementsModule，避免模块耦合；使用 PrismaService + PolicyQueryFactory + SecretAccessPolicyService 读取父 Achievement 最小事实。
- 小幅扩展 AttachmentRepository / AttachmentService 支持父资源鉴权、grant 查询、download preparation。
- 新增 HTTP class DTO：
  - upload-achievement-attachment.dto.ts
  - attachment-list-query.dto.ts
  - 如需要，可新增 download 相关 DTO / response type。
- 使用 controller-local ValidationPipe。
- 使用 ParseUUIDPipe({ version: "4" }) 校验 route params。
- 显式使用 UserContextGuard、PermissionGuard、@CurrentUser()、@RequirePermissions()。

HTTP routes：
- POST /achievements/:achievementId/attachments
  - 静态权限：achievement:update_own
  - Body：fileName, secretLevel?, checksum?, objectBody?
  - 不允许 body 传 relationId / uploaderId / objectKey / storageKey。
  - 返回 metadata-only DTO。
- GET /achievements/:achievementId/attachments
  - 静态权限：attachment:read_metadata
  - 必须先验证 Achievement 可读，再返回当前用户可读 metadata list。
- GET /achievements/:achievementId/attachments/:attachmentId
  - 静态权限：attachment:read_metadata
  - 必须验证 attachment 属于该 achievement，且父 Achievement 可读。
- GET /achievements/:achievementId/attachments/:attachmentId/download
  - 静态权限：attachment:download
  - 必须先完成鉴权，再调用 storage adapter getObject。
  - direct ATTACHMENT_DOWNLOAD grant 可作为下载例外，但不返回 Achievement 业务详情。

固定下载鉴权顺序：
1. 读取 attachment metadata。
2. 校验 path achievementId 与 attachment relation match。
3. 查询父 Achievement 最小资源事实和相关 grants。
4. 调用 AttachmentAccessPolicyService.canDownload(...)。
5. ALLOW 后才调用 storage adapter getObject。
6. 测试必须断言 DENY 时 storage adapter 未被调用。

避免绕过 Achievement 详情权限：
- list/detail 默认必须复刻 AchievementService.getDetail 的边界：
  - PolicyQueryFactory.achievementReadableWhere(context)
  - minimal achievement lookup
  - SecretAccessPolicyService.canReadResource(...)
- 只取父 Achievement 最小字段：
  - id
  - departmentId
  - ownerUserId
  - secretLevel
- 不返回 Achievement title、详情、部门、contributors 或 typed detail。

Public response shape：
- metadata/list/detail 只返回：
  - id
  - relationType
  - relationId
  - fileName
  - version
  - uploaderId
  - secretLevel
  - status
  - createdAt
  - updatedAt
  - archivedAt
- download 返回：
  - id
  - fileName
  - version
  - body 或 fake download payload
- 禁止返回：
  - object key / storageKey
  - checksum
  - 真实存储路径
  - 父 Achievement 业务详情

错误映射：
- 403 access denied
- 404 not found
- 409 version conflict
- 422 invalid payload / unsupported relation
- 502 或 503 storage error

7D 预留但不接入：
- 不调用 AuditService。
- 不写 audit event。
- 只确保 service 可返回后续审计需要的稳定事实：
  - actorUserId
  - actorDepartmentId
  - action=UPLOAD_ATTACHMENT / DOWNLOAD_ATTACHMENT
  - targetType=ATTACHMENT
  - attachmentId
  - achievementId
  - fileName
  - version
  - secretLevel
  - traceId?

禁止：
- 不接 root AppModule。
- 不修改 apps/api/src/app.module.ts。
- 不修改 apps/api/src/main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不接 AuditService。
- 不修改 apps/api/src/audit/**。
- 不修改 AchievementService / WorkflowService。
- 不修改 prisma/schema.prisma。
- 不修改 prisma/migrations/**。
- 不修改 prisma/seed.cjs。
- 不修改 package.json / pnpm-lock.yaml。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实对象存储。
- 不使用 S3 / MinIO / multer / FileInterceptor / diskStorage / createReadStream / writeFile / readFile。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。

测试要求：
- controller tests：
  - 401 无用户
  - 403 缺静态权限
  - UUID 校验
  - body/query validation
  - route 成功调用 service
  - service 错误映射
- service tests：
  - list/detail 必须父资源可读
  - restricted secret 需要 grant
  - download direct grant 可绕过父详情但只下载
  - DENY 不调用 storage
  - path achievementId 与 attachment relation mismatch 拒绝
- repository tests：
  - fake Prisma grant 查询
  - findById/list 不访问真实 DB
- provider override：
  - controller tests import AttachmentsModule
  - override PrismaService 给 identity fake user
  - override AttachmentService 做 HTTP 边界
  - service tests 用 fake repository / fake storage / fake policies

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "AttachmentsModule|AttachmentModule" apps/api/src/app.module.ts
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/attachments
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "deleteMany|delete\\(|updateMany|update\\(" apps/api/src/attachments
- rg -n "S3|MinIO|FileInterceptor|multer|diskStorage|createReadStream|writeFile|readFile" apps/api/src/attachments
- rg -n "DATABASE_URL|process\\.env|password|token|cookie|apiKey|privateKey" apps/api/src/attachments

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 7C 实现了什么。
3. 明确没有进入哪些范围。
4. HTTP routes、权限和响应边界。
5. 下载鉴权顺序如何保证。
6. 如何避免绕过 Achievement 详情权限。
7. direct ATTACHMENT_DOWNLOAD grant 的限制。
8. 哪些验证通过。
9. 哪些验证失败及原因。
10. 是否可以进入 Step 7C-3 root AppModule wiring 前计划确认，或是否建议另命名为 Step 7D 前置收口。
~~~

~~~
确认执行 Step 7C-3。

本次只执行 Step 7C-3：AttachmentsModule root AppModule wiring。
只做 root wiring 收口，不改变附件业务语义，不进入 Step 7D。

请精确读取与 Step 7C-3 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7C 最新归档、Step 7 当前状态、root AppModule wiring 相关架构和决策。如需扩大读取范围，请先说明原因。

我确认：
- Step 7C-3 只改 apps/api/src/app.module.ts，只新增 apps/api/src/attachments/attachment.app-module.spec.ts。
- AppModule-level tests 中 override AttachmentService、PrismaService，并 inert override AchievementService / WorkflowService。
- 保持真实 UserContextGuard / PermissionGuard / RbacPolicyService / decorator metadata 链路。
- 完成 Step 7C-3 后，把 Step 7C 整体标记为 root reachable DONE。
- Step 7D 仍保持 TODO，不能开始。
- 不接 AuditService。
- 不修改 attachment controller/service/repository 业务实现。
- 不修改 AchievementService / WorkflowService。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 schema/migration/seed/package/lockfile。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不接真实对象存储、文件系统、网络、multipart、stream。

当前状态：
- Step 7A DONE：Audit foundation 已完成。
- Step 7B DONE：Attachment foundation + fake storage adapter 已完成。
- Step 7C DONE at module-local level：AttachmentsModule 内部附件 HTTP 边界已完成。
- Step 7C 已有 4 条 module-local routes：
  - POST /achievements/:achievementId/attachments
  - GET /achievements/:achievementId/attachments
  - GET /achievements/:achievementId/attachments/:attachmentId
  - GET /achievements/:achievementId/attachments/:attachmentId/download
- Step 7C routes 已显式使用 UserContextGuard、PermissionGuard、@CurrentUser()、@RequirePermissions()。
- 当前 AttachmentsModule 尚未接入 root AppModule。
- Step 7D 仍未开始。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7C 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7C 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7C 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中 root wiring / AppModule / 附件相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Attachment / AppModule / 安全权限相关段落
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts
- E:\研究院科研成果管理系统\apps\api\src\attachments
- E:\研究院科研成果管理系统\apps\api\src\authorization 中 guard/decorator 相关文件
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database
- 现有 app-module wiring 测试文件，例如 achievement.app-module.spec.ts / workflow.app-module.spec.ts

执行范围：
- 修改 apps/api/src/app.module.ts：
  - import { AttachmentsModule } from "./attachments/attachments.module";
  - 在 imports 中显式加入 AttachmentsModule。
- 新增 apps/api/src/attachments/attachment.app-module.spec.ts。
- AppModule-level tests 覆盖：
  1. GET /health 返回 200 和既有 health body。
  2. POST /achievements/:achievementId/attachments root reachable，返回 201。
  3. GET /achievements/:achievementId/attachments root reachable，返回 200。
  4. GET /achievements/:achievementId/attachments/:attachmentId root reachable，返回 200。
  5. GET /achievements/:achievementId/attachments/:attachmentId/download root reachable，返回 200。
  6. 不带 X-Demo-User-Id 请求任一附件 route 返回 401，且 AttachmentService 未被调用。
  7. 带 demo user 但无对应权限，请求任一附件 route 返回 403，且 AttachmentService 未被调用。
- 如测试成本可控，可额外覆盖 upload 与 download 两类静态权限缺失。

Provider override 策略：
- override PrismaService：
  - 只提供 user.findFirst，返回测试 user fixture。
  - 不提供 $connect，不连接真实数据库。
- override AttachmentService：
  - mock createAchievementAttachmentForUser
  - mock listAchievementMetadata
  - mock getAchievementAttachmentMetadata
  - mock downloadAchievementAttachment
- inert override AchievementService。
- inert override WorkflowService。
- 不 override UserContextGuard。
- 不 override PermissionGuard。
- 不 override AttachmentController。
- 保持真实 guard / decorator / permission metadata 链路。

禁止：
- 不修改 apps/api/src/main.ts。
- 不修改 apps/api/src/attachments/attachment.controller.ts。
- 不修改 apps/api/src/attachments/attachment.service.ts。
- 不修改 apps/api/src/attachments/attachment.repository.ts。
- 不修改 apps/api/src/audit/**。
- 不修改 apps/api/src/achievements/** 业务实现。
- 不修改 apps/api/src/workflow/** 业务实现。
- 不修改 prisma/schema.prisma。
- 不修改 prisma/migrations/**。
- 不修改 prisma/seed.cjs。
- 不修改 package.json / pnpm-lock.yaml。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不接 AuditService。
- 不接真实对象存储。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "AttachmentsModule" apps/api/src/app.module.ts
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/attachments apps/api/src/app.module.ts
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "S3|MinIO|FileInterceptor|multer|diskStorage|createReadStream|writeFile|readFile" apps/api/src/attachments
- rg -n "DATABASE_URL|process\\.env|password|token|cookie|apiKey|privateKey" apps/api/src/attachments
- rg -n "migrate|seed|schema.prisma" apps/api/src/app.module.ts apps/api/src/attachments

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md

memory-bank 记录要求：
- progress.md：Step 7C-3 DONE，Step 7C overall/root reachable DONE，Step 7D TODO。
- evidence.md：记录文件变更、测试结果、边界扫描结果。
- implementation-plan.md：记录 Step 7C-3 execution override。
- architecture.md：记录 root AppModule 现已显式暴露 attachment routes。
- decisions.md：新增类似 D038 - Step 7C-3 explicitly imports AttachmentsModule in root AppModule。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 7C-3 实现了什么。
3. 哪些 root routes 已验证可达。
4. 401 / 403 是否仍由真实 guard 保护。
5. 明确没有进入哪些范围。
6. 哪些验证通过。
7. 哪些验证失败及原因。
8. Step 7C 是否已整体 root reachable DONE。
9. Step 7D 是否仍为 TODO。
~~~

## Step 7D

Step 7D-1

~~~
Step 7C-3 已完成并归档。现在进入 Step 7D 前计划确认。

本次只做 Step 7D 执行计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

请精确读取与 Step 7D 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7A / 7B / 7C / 7C-3 最新归档、Step 7 当前状态、审计集成、附件、成果、workflow 相关架构和决策。如需扩大读取范围，请先说明原因。

当前状态：
- Step 7A DONE：Audit foundation 已完成。
  - AuditRepository / AuditService / AuditModule 已存在。
  - 已支持 append-only 审计写入、masked audit 查询预留、recordEventInTransaction / createInTransaction。
- Step 7B DONE：Attachment foundation + fake storage adapter 已完成。
- Step 7C DONE：AttachmentsModule 内部 HTTP 边界已完成。
- Step 7C-3 DONE：AttachmentsModule 已显式接入 root AppModule，附件 routes root reachable。
- Step 7C-3 验证通过：
  - corepack pnpm --filter @research-ip/api test：26 files / 251 tests passed
  - corepack pnpm --filter @research-ip/api typecheck：passed
  - corepack pnpm --filter @research-ip/api build：passed
  - corepack pnpm lint：passed
  - corepack pnpm prisma:validate：passed
- Step 7D 仍为 TODO，尚未开始。

Step 7D 目标草案：
- 将审计写入接入核心业务操作。
- 优先覆盖 Step 5 Achievement 核心动作：
  - create draft
  - update draft
  - submit
  - void
  - archive
- 覆盖 Step 6 Workflow 核心动作：
  - approve department review
  - reject department review
  - archive workflow closure
- 覆盖 Step 7 Attachment 核心动作：
  - upload attachment
  - download attachment
- 使用 Step 7A 的 AuditService / recordEventInTransaction。
- 对已经有业务事务的方法，审计写入应在同一事务内执行；审计失败则业务回滚。
- 只记录稳定事实和脱敏摘要，不记录敏感内容。
- 不新增 HTTP route。
- 不修改 root AppModule。
- 不修改 schema/migration/seed/package/lockfile。
- 不接真实数据库、不运行 migrate/seed。
- 不接真实对象存储。
- 不做前端页面。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7 / 7A / 7B / 7C 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7C-3 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7C-3 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中审计、附件、workflow、transaction 相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Audit / Attachment / Achievement / Workflow 相关段落
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\attachments
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 7D 的精确目标。
2. Step 7D 的风险等级和风险点。
3. Step 7D 是否需要拆成 7D-1 / 7D-2 / 7D-3。
4. 哪些业务动作应纳入本步审计，哪些应后置。
5. AchievementService 应如何接入 AuditService，事务边界如何处理。
6. WorkflowService 应如何接入 AuditService，事务边界如何处理。
7. AttachmentService 应如何接入 AuditService，事务边界如何处理。
8. recordEventInTransaction / createInTransaction 应如何使用，避免嵌套事务。
9. 审计失败时是否统一让业务回滚。
10. 每类动作应记录哪些稳定事实。
11. 每类动作必须排除哪些敏感信息。
12. 是否需要新增 audit action / target type 常量。
13. 是否需要修改 AuditService / AuditRepository。
14. 是否需要修改 controller 或 HTTP response。
15. 是否需要修改 schema/migration/seed/package/lockfile。
16. 测试矩阵和 fake/mock/provider override 策略。
17. 验证命令和边界检查命令。
18. 完成后 memory-bank 应更新哪些内容。
19. 需要我确认的问题。

要求：
- 只读计划确认。
- 不写代码。
- 不修改文件。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不新增 HTTP route。
- 不修改 root AppModule。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不接真实对象存储。
- 不实现前端页面。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
~~~

~~~
确认执行 Step 7D-1。

本次只执行 Step 7D-1：Achievement audit integration。
不进入 7D-2 / 7D-3，不修改 WorkflowService，不修改 AttachmentService，不新增 HTTP route，不修改 root AppModule，不访问真实数据库，不运行 migrate/seed。

请精确读取与 Step 7D-1 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7A / 7C-3 最新归档、Step 7D 计划确认、Achievement 与 Audit 相关架构和决策。如需扩大读取范围，请先说明原因。

我确认：
- Step 7D 按 7D-1 / 7D-2 / 7D-3 拆分执行：
  - 7D-1：Achievement audit integration。
  - 7D-2：Workflow approve/reject/archive-closure audit integration。
  - 7D-3：Attachment upload/download audit integration。
- 本次只执行 7D-1。
- Achievement create/update/submit/void/archive 应接入 AuditService.recordEventInTransaction。
- 审计写入必须在同一业务事务内执行。
- 审计失败时，Achievement 业务写入应回滚。
- archive 时是否写 workflowInstance/archive 审计留到 7D-2，不在 7D-1 实现。
- 不新增 audit action / target type 常量。
- 不修改 AuditRepository。
- 尽量不修改 AuditService；只有确有必要才改，并说明原因。
- 不修改 controller，不改变 HTTP response shape。
- 不修改 schema/migration/seed/package/lockfile。

当前状态：
- Step 7A DONE：Audit foundation 已完成。
- AuditService 已支持 recordEvent / recordEventInTransaction / listMasked。
- AuditRepository 已支持 create / createInTransaction / findMany。
- Step 7B DONE：Attachment foundation 已完成。
- Step 7C DONE：Attachment HTTP + root wiring 已完成。
- Step 7D 仍为 TODO，尚未开始。
- 本次只做 AchievementService 审计集成。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7 / 7D 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7C-3 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7C-3 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中审计、事务、Achievement 相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Audit / Achievement / 事务相关段落
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\database

执行范围：
- 在 AchievementsModule 中引入 AuditModule。
- 在 AchievementService 中注入 AuditService。
- 为以下 Achievement 动作写入审计：
  - create draft
  - update draft
  - submit
  - void
  - archive
- 只记录稳定事实和脱敏摘要：
  - actorUserId
  - actorDepartmentId
  - action
  - targetType=achievement
  - targetId=achievementId
  - targetDepartmentId
  - targetSecretLevel
  - oldValue / newValue 中只放 status、version、achievementId、action、时间等稳定摘要
- 不记录：
  - 论文摘要全文
  - 作废原因全文
  - 审批意见全文
  - 附件内容
  - storageKey / objectKey
  - checksum
  - token / cookie / password / apiKey / privateKey
  - DATABASE_URL / .env / 连接串
  - 未脱敏 oldValue / newValue
- submitDraft / archiveAchievement 已有外层事务，应在现有事务内调用 recordEventInTransaction。
- createDraft / updateDraft / voidAchievement 如当前使用会自行开事务的 public repository 方法，应改为 service 层外层事务，并调用 repository 的 InTransaction 方法，保证业务写入和审计写入同事务。
- 避免嵌套事务：外层业务事务内只调用 AuditService.recordEventInTransaction(tx, input)，不调用 recordEvent。
- 更新对应 AchievementService 单元测试，覆盖审计 payload 和审计失败回滚语义。
- 更新必要 fake repository / fake Prisma 测试支持，但不访问真实数据库。

禁止：
- 不修改 WorkflowService。
- 不修改 AttachmentService。
- 不修改 AuditRepository，除非发现 7D-1 必需且先说明原因。
- 不新增 controller 或 HTTP route。
- 不修改 AchievementController response shape。
- 不修改 root AppModule。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 prisma/schema.prisma。
- 不修改 prisma/migrations/**。
- 不修改 prisma/seed.cjs。
- 不修改 package.json / pnpm-lock.yaml。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实对象存储。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不进入 7D-2 / 7D-3。

测试要求：
- createDraft 成功时写 achievement create 审计。
- updateDraft 成功时写 achievement update 审计。
- submitDraft 成功时写 achievement submit 审计。
- voidAchievement 成功时写 achievement void 审计。
- archiveAchievement 成功时写 achievement archive 审计。
- 审计 payload 只包含稳定事实，不包含摘要全文、原因全文、storage key、checksum、凭证或连接串。
- 审计失败时业务事务回滚或测试能证明同事务失败语义。
- 权限失败、状态失败、校验失败时不写审计。
- 不访问真实数据库。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/achievements apps/api/src/audit
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/workflow apps/api/src/attachments
- rg -n "Controller\\(|@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/audit
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "DATABASE_URL|process\\.env|password|token|cookie|apiKey|privateKey|storageKey|objectKey|checksum" apps/api/src/achievements apps/api/src/audit
- rg -n "migrate|seed|schema.prisma" apps/api/src/achievements apps/api/src/audit

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如确认“Achievement 审计失败回滚”为正式策略，更新 decisions.md。
- 如记录 Achievement -> Audit module dependency，更新 architecture.md。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 7D-1 实现了什么。
3. 每个 Achievement 动作写入哪些审计稳定事实。
4. 如何保证审计失败时业务回滚。
5. 明确没有进入哪些范围。
6. 哪些验证通过。
7. 哪些验证失败及原因。
8. 是否可以进入 Step 7D-2 前计划确认。
~~~

Step 7D-2 

~~~
Step 7D-1 已完成并归档。现在进入 Step 7D-2 前计划确认。

本次只做 Step 7D-2 执行计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

请精确读取与 Step 7D-2 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7D-1 最新归档、Step 7D 当前状态、Workflow / Audit / transaction 相关架构和决策。如需扩大读取范围，请先说明原因。

当前状态：
- Step 7D-1 DONE：Achievement audit integration 已完成。
- AchievementsModule 已接入 AuditModule。
- AchievementService 已注入 AuditService。
- createDraft / updateDraft / submitDraft / voidAchievement / archiveAchievement 已写入 ACHIEVEMENT 审计。
- Achievement 审计全部使用 recordEventInTransaction(...)。
- Achievement 写操作审计失败会导致同一 Prisma transaction reject，业务写入不提交。
- Step 7D-2 仍为 TODO。
- WorkflowService 目前尚未接入 AuditService。
- AttachmentService 目前尚未接入 AuditService。
- Step 7D-3 仍为 TODO。

Step 7D-2 目标草案：
- 将审计写入接入 Workflow 核心动作。
- 覆盖：
  - department review approve
  - department review reject
  - system-admin archive workflow closure
- Workflow approve/reject 审计应写在同一业务事务内。
- archive workflow closure 目前由 AchievementService.archiveAchievement 持有外层事务；本步需要判断是否在该事务内额外写一条 workflowInstance/archive 审计。
- 只记录稳定事实和脱敏摘要。
- 不修改 Workflow HTTP response shape。
- 不新增 HTTP route。
- 不接 Attachment audit。
- 不修改 schema/migration/seed/package/lockfile。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7D / 7D-1 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7D-1 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7D-1 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中审计、Workflow、事务相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Audit / Workflow / Achievement 事务相关段落
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\achievements 仅读取 archiveAchievement 与 workflow closure 相关代码
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 7D-2 的精确目标。
2. Step 7D-2 的风险等级和风险点。
3. 是否需要拆成 7D-2A / 7D-2B。
4. WorkflowModule 应如何接入 AuditModule。
5. WorkflowService approve/reject 应如何注入和调用 AuditService。
6. approve/reject 审计写入点应放在哪个事务位置。
7. archive workflow closure 审计应放在 WorkflowService 还是 AchievementService，原因是什么。
8. archive 时是否写两条审计：ACHIEVEMENT/archive 已由 7D-1 完成，WORKFLOW_INSTANCE/archive 是否本步补充。
9. 每个 Workflow 动作应记录哪些稳定事实。
10. 每个 Workflow 动作必须排除哪些敏感信息。
11. 是否需要修改 AuditService / AuditRepository。
12. 是否需要修改 AchievementService.archiveAchievement。
13. 是否需要修改 WorkflowController 或 HTTP response。
14. 测试矩阵和 fake/mock 策略。
15. 是否需要真实数据库、migration、seed、依赖或真实对象存储。
16. 验证命令和边界检查命令。
17. 完成后 memory-bank 应更新哪些内容。
18. 需要我确认的问题。

要求：
- 只读计划确认。
- 不写代码。
- 不修改文件。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不修改 AttachmentService。
- 不进入 Step 7D-3。
- 不新增 HTTP route。
- 不修改 WorkflowController response shape。
- 不修改 root AppModule。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
~~~

~~~
确认执行 Step 7D-2。

本次只执行 Step 7D-2：Workflow audit integration。
不进入 Step 7D-3，不修改 AttachmentService，不新增 HTTP route，不修改 WorkflowController response shape，不修改 root AppModule，不访问真实数据库，不运行 migrate/seed。

请精确读取与 Step 7D-2 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7D-1 最新归档、Step 7D-2 计划确认、Workflow / Audit / Achievement archive 事务相关架构和决策。如需扩大读取范围，请先说明原因。

我确认：
- Step 7D-2 按内部 7D-2A / 7D-2B 连续执行：
  - 7D-2A：Workflow approve/reject audit integration。
  - 7D-2B：archive workflow closure audit integration。
- approveDepartmentReviewTask 写 WORKFLOW_TASK / APPROVE 审计。
- rejectDepartmentReviewTask 写 WORKFLOW_TASK / REJECT 审计。
- archiveAchievement 触发的 workflow closure 补写 WORKFLOW_INSTANCE / ARCHIVE 审计。
- archive 事务内允许存在两条审计：
  - 7D-1 已有 ACHIEVEMENT / ARCHIVE，记录成果状态归档。
  - 7D-2 补充 WORKFLOW_INSTANCE / ARCHIVE，记录审批流实例关闭。
- workflow closure 审计由 WorkflowService.completeAchievementArchiveInTransaction(...) 构造。
- AchievementService.archiveAchievement 继续持有外层事务，并向 workflow helper 传入同一个 transaction/audit client 和稳定 target facts。
- 所有审计写入使用 AuditService.recordEventInTransaction(...)。
- 审计失败时，同一业务事务 reject，业务写入不提交。
- 不记录 approve/reject comment 全文。
- 不新增 audit action / target type 常量。
- 不修改 AuditService / AuditRepository，除非发现 7D-2 必需且先说明原因。
- 不修改 WorkflowController 或 HTTP response。
- 不修改 schema/migration/seed/package/lockfile。

当前状态：
- Step 7D-1 DONE：Achievement audit integration 已完成。
- AchievementsModule 已接入 AuditModule。
- AchievementService 已注入 AuditService。
- Achievement create/update/submit/void/archive 已写 ACHIEVEMENT 审计。
- Achievement 审计失败会让同一 Prisma transaction reject。
- WorkflowService 尚未接入 AuditService。
- AttachmentService 尚未接入 AuditService。
- Step 7D-3 仍为 TODO。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7D / 7D-1 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7D-1 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7D-1 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中审计、Workflow、Achievement archive、事务相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Audit / Workflow / Achievement 事务相关段落
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\achievements 仅读取 archiveAchievement 与 workflow closure 相关代码
- E:\研究院科研成果管理系统\apps\api\src\database

执行范围：
- 在 WorkflowModule imports 中加入 AuditModule。
- 在 WorkflowService constructor 注入 AuditService。
- 在 approve/reject 现有事务内写 WORKFLOW_TASK 审计。
- 在 archive workflow closure helper 内写 WORKFLOW_INSTANCE / ARCHIVE 审计。
- 最小修改 AchievementService.archiveAchievement，使其向 WorkflowService.completeAchievementArchiveInTransaction(...) 传入同一个 tx/audit client 和稳定 target facts。
- 更新 WorkflowService tests。
- 更新 AchievementService archive tests。
- 如 fake 类型需要补稳定字段，可以仅补测试 fake，不访问真实数据库。
- 更新 memory-bank。

approve/reject 审计写入点：
- 在同一 Prisma transaction 中。
- 必须位于以下业务写入均成功之后、return 之前：
  1. task transition + workflow action 写入成功。
  2. workflow instance transition 写入成功。
  3. achievement status transition 写入成功。
  4. 写 audit event。
  5. return { task, achievement }。
- 审计失败必须让 approve/reject 事务 reject。

archive closure 审计写入点：
- AchievementService.archiveAchievement 继续作为事务 owner。
- WorkflowService.completeAchievementArchiveInTransaction(...) 完成：
  1. instance-level ARCHIVE workflow action 写入。
  2. workflow instance ACTIVE -> COMPLETED。
  3. 写 WORKFLOW_INSTANCE / ARCHIVE audit event。
- 审计失败必须让 archiveAchievement 事务 reject。

审计稳定事实：
- approve：
  - actorUserId / actorDepartmentId
  - targetType=WORKFLOW_TASK
  - targetId=taskId
  - workflowInstanceId
  - achievementId
  - action=APPROVE
  - task status PENDING -> APPROVED
  - instance status ACTIVE -> ACTIVE
  - currentStep DEPARTMENT_REVIEW -> ARCHIVE
  - achievement status PENDING_DEPARTMENT_REVIEW -> PENDING_ARCHIVE
  - reviewedAt
- reject：
  - actorUserId / actorDepartmentId
  - targetType=WORKFLOW_TASK
  - targetId=taskId
  - workflowInstanceId
  - achievementId
  - action=REJECT
  - task status PENDING -> REJECTED
  - instance status ACTIVE -> COMPLETED
  - currentStep DEPARTMENT_REVIEW -> null
  - achievement status PENDING_DEPARTMENT_REVIEW -> DEPARTMENT_REJECTED
  - reviewedAt
- archive closure:
  - actorUserId / actorDepartmentId
  - targetType=WORKFLOW_INSTANCE
  - targetId=workflowInstanceId
  - achievementId
  - action=ARCHIVE
  - instance status ACTIVE -> COMPLETED
  - currentStep ARCHIVE -> null
  - completedAt
  - taskId 为 null 或不记录 taskId

禁止记录：
- approve/reject comment 全文。
- 作废原因全文。
- 论文摘要、成果标题、detail payload。
- 附件内容、storageKey/objectKey、checksum。
- token、cookie、password、apiKey、privateKey。
- .env、DATABASE_URL、完整连接串。
- 原始 IP、完整 User-Agent。
- 未脱敏 oldValue/newValue。

禁止：
- 不修改 AttachmentService。
- 不进入 Step 7D-3。
- 不新增 controller 或 HTTP route。
- 不修改 WorkflowController response shape。
- 不修改 root AppModule。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 prisma/schema.prisma。
- 不修改 prisma/migrations/**。
- 不修改 prisma/seed.cjs。
- 不修改 package.json / pnpm-lock.yaml。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实对象存储。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。

测试要求：
- WorkflowService approve 成功写 WORKFLOW_TASK / APPROVE 审计。
- WorkflowService reject 成功写 WORKFLOW_TASK / REJECT 审计。
- approve/reject audit payload 不包含 comment 全文。
- audit 失败时 approve/reject reject，证明同事务失败语义。
- 权限失败、task missing、department scope miss、状态失败、blank reject comment 时不写 audit。
- completeAchievementArchiveInTransaction 写 workflow action、完成 instance 后写 WORKFLOW_INSTANCE / ARCHIVE 审计。
- archive workflow audit 失败时 helper reject。
- AchievementService archiveAchievement 调用 workflow closure helper 时传入同一个 tx/audit client 和稳定 target facts。
- 保留 7D-1 ACHIEVEMENT / ARCHIVE 审计断言。
- workflow archive audit 失败时 archive 请求失败，同事务 reject。
- 测试使用 vi mock / fake Prisma transaction client，不访问真实数据库。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/workflow apps/api/src/achievements apps/api/src/audit
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/attachments
- rg -n "Controller\\(|@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/audit
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "DATABASE_URL|process\\.env|password|token|cookie|apiKey|privateKey|storageKey|objectKey|checksum" apps/api/src/workflow apps/api/src/achievements apps/api/src/audit
- rg -n "migrate|seed|schema.prisma" apps/api/src/workflow apps/api/src/achievements apps/api/src/audit
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/app.module.ts

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md

memory-bank 记录要求：
- progress.md：Step 7D-2 DONE，7D-3 TODO。
- evidence.md：记录文件变更、测试结果、边界扫描结果。
- implementation-plan.md：记录 Step 7D-2 execution override。
- decisions.md：记录 Workflow audit 同事务策略和 archive 双审计语义。
- architecture.md：记录 WorkflowModule -> AuditModule 依赖与 archive closure audit 位置。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 7D-2 实现了什么。
3. approve/reject 分别写入哪些审计稳定事实。
4. archive workflow closure 写入哪些审计稳定事实。
5. 如何保证审计失败时 Workflow/Achievement 业务事务回滚。
6. archive 双审计语义如何区分。
7. 明确没有进入哪些范围。
8. 哪些验证通过。
9. 哪些验证失败及原因。
10. 是否可以进入 Step 7D-3 前计划确认。
~~~

Step 7D-3

~~~
Step 7D-2 已完成并归档。现在进入 Step 7D-3 前计划确认。

本次只做 Step 7D-3 执行计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

请精确读取与 Step 7D-3 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7D-1 / 7D-2 最新归档、Step 7D 当前状态、Attachment / Audit / transaction 相关架构和决策。如需扩大读取范围，请先说明原因。

当前状态：
- Step 7D-1 DONE：Achievement audit integration 已完成。
- Step 7D-2 DONE：Workflow audit integration 已完成。
- WorkflowModule 已接入 AuditModule。
- WorkflowService 已注入 AuditService。
- approve 写入 WORKFLOW_TASK / APPROVE 审计。
- reject 写入 WORKFLOW_TASK / REJECT 审计。
- archive workflow closure 写入 WORKFLOW_INSTANCE / ARCHIVE 审计。
- archive transaction 内已有双审计语义：
  - ACHIEVEMENT / ARCHIVE：成果状态归档。
  - WORKFLOW_INSTANCE / ARCHIVE：审批流实例关闭。
- Step 7D-3 仍为 TODO。
- AttachmentService 尚未接入 AuditService。
- Step 7D-2 验证通过：
  - corepack pnpm --filter @research-ip/api test：26 files / 260 tests passed
  - corepack pnpm --filter @research-ip/api typecheck：passed
  - corepack pnpm --filter @research-ip/api build：passed
  - corepack pnpm lint：passed
  - corepack pnpm prisma:validate：passed

Step 7D-3 目标草案：
- 将审计写入接入 Attachment 核心动作。
- 覆盖：
  - upload attachment
  - download attachment
- Attachment upload 审计应记录 ATTACHMENT / UPLOAD_ATTACHMENT。
- Attachment download 审计应记录 ATTACHMENT / DOWNLOAD_ATTACHMENT。
- upload 的 metadata DB 写入与审计写入应在同一 Prisma transaction 内。
- fake storage 写入当前仍在 DB transaction 外；需要明确顺序和失败策略。
- download 是读操作，无业务 DB mutation 可回滚；但应在鉴权通过、fake storage 读取成功后、返回内容前写审计。
- download 审计失败时，本次 download 请求应失败，不返回附件内容。
- 只记录稳定事实和脱敏摘要。
- 不记录 body、objectKey/storageKey、checksum、真实路径、附件内容。
- 不新增 HTTP route。
- 不修改 HTTP response shape，除非计划确认确实需要。
- 不接真实对象存储。
- 不修改 schema/migration/seed/package/lockfile。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7D / 7D-1 / 7D-2 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7D-2 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7D-2 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中审计、Attachment、事务相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Audit / Attachment 相关段落
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\attachments
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 7D-3 的精确目标。
2. Step 7D-3 的风险等级和风险点。
3. AttachmentModule 应如何接入 AuditModule。
4. AttachmentService 应如何注入和调用 AuditService。
5. upload attachment 审计写入点应放在哪里。
6. upload 中 fake storage 写入、metadata DB 写入、audit 写入的顺序和失败策略。
7. download attachment 审计写入点应放在哪里。
8. download 中鉴权、fake storage 读取、audit 写入、response 返回的顺序和失败策略。
9. download 审计失败是否应阻止返回 body。
10. upload/download 分别应记录哪些稳定事实。
11. upload/download 必须排除哪些敏感信息。
12. 是否需要修改 AuditService / AuditRepository。
13. 是否需要修改 AttachmentController 或 HTTP response。
14. 是否需要新增 audit action / target type 常量。
15. 测试矩阵和 fake/mock 策略。
16. 是否需要真实数据库、migration、seed、依赖或真实对象存储。
17. 验证命令和边界检查命令。
18. 完成后 memory-bank 应更新哪些内容。
19. 需要我确认的问题。

要求：
- 只读计划确认。
- 不写代码。
- 不修改文件。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不新增 HTTP route。
- 不修改 root AppModule。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不接真实对象存储。
- 不实现前端页面。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
~~~

~~~
确认执行 Step 7D-3。

本次只执行 Step 7D-3：Attachment upload/download audit integration。
不新增 HTTP route，不修改 AttachmentController response shape，不修改 root AppModule，不接真实对象存储，不访问真实数据库，不运行 migrate/seed。

请精确读取与 Step 7D-3 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7D-1 / 7D-2 最新归档、Step 7D-3 计划确认、Attachment / Audit 事务相关架构和决策。如需扩大读取范围，请先说明原因。

我确认：
- upload 写 ATTACHMENT / UPLOAD_ATTACHMENT 审计。
- download 写 ATTACHMENT / DOWNLOAD_ATTACHMENT 审计。
- upload 的 metadata DB 写入与 audit DB 写入必须在同一个 Prisma transaction 内。
- download 使用 AuditService.recordEvent(...)，因为 download 没有业务写事务。
- download 审计失败时不返回 body。
- upload 采用当前 fake storage 策略：fake object 写入成功后，如果 metadata/audit 失败，DB 会回滚但 fake in-memory object 可能残留；这个风险在 fake storage 阶段可接受，真实对象存储清理策略留到后续真实 storage 步骤。
- 不修改 AuditService / AuditRepository。
- 不新增 audit action / target type 常量。
- 不修改 AttachmentController 或 HTTP response shape。
- 不修改 schema/migration/seed/package/lockfile。
- 不接真实对象存储。

当前状态：
- Step 7D-1 DONE：Achievement audit integration 已完成。
- Step 7D-2 DONE：Workflow audit integration 已完成。
- AttachmentService 尚未接入 AuditService。
- Step 7D-3 仍为 TODO。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7D / 7D-1 / 7D-2 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7D-2 归档
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7D-2 证据
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中审计、Attachment、事务相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Audit / Attachment 相关段落
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\attachments
- E:\研究院科研成果管理系统\apps\api\src\database

执行范围：
- 在 AttachmentsModule imports 中加入 AuditModule。
- 在 AttachmentService constructor 注入 PrismaService 和 AuditService，如 PrismaService 已存在则复用。
- upload：在 createAchievementAttachmentForUser(...) 中写 ATTACHMENT / UPLOAD_ATTACHMENT 审计。
- download：在 downloadAchievementAttachment(...) 中写 ATTACHMENT / DOWNLOAD_ATTACHMENT 审计。
- 更新 AttachmentService tests。
- 必要时更新 module tests 的 provider override，避免构造缺失。
- 更新 memory-bank。

upload 固定顺序：
1. loadWritableAchievementParent(...) 做权限和涉密边界。
2. 父资源鉴权失败：不写 storage、不写 metadata、不写 audit。
3. fake storage 写入。
4. fake storage 写入失败：不写 metadata、不写 audit。
5. 开 this.prisma.$transaction(...)。
6. 事务中调用 createMetadataInTransaction(tx, ...)。
7. metadata 创建成功后，调用 auditService.recordEventInTransaction(tx, ...)。
8. 返回 metadata DTO。
9. audit 写入失败：metadata DB rollback；fake object 可能残留，按已确认 fake storage 阶段风险记录。

download 固定顺序：
1. 读取 attachment record 并校验 relation/path。
2. 读取 parent/minimum facts 和 grants。
3. 调用 AttachmentAccessPolicyService.canDownload(...)。
4. attachment 不存在、关系不匹配、parent 不存在或鉴权失败：不读 storage，不写 audit。
5. 鉴权通过后调用 storage adapter getObject。
6. fake storage 读取失败：不写 audit，不返回 body。
7. fake storage 读取成功后，调用 auditService.recordEvent(...)。
8. audit 写入成功后才 return { id, fileName, version, body }。
9. audit 写入失败：请求失败，不返回 body。

upload 审计稳定事实：
- actorUserId / actorDepartmentId
- targetType=ATTACHMENT
- targetId=attachmentId
- relationType / relationId
- achievementId
- fileName
- version
- secretLevel
- status
- uploaderId
- createdAt
- traceId 如已有

download 审计稳定事实：
- actorUserId / actorDepartmentId
- targetType=ATTACHMENT
- targetId=attachmentId
- achievementId
- relationType / relationId
- fileName
- version
- secretLevel
- status
- downloadedAt
- accessMode 可选；如果不能稳定区分 parent/direct grant，就不要记录

禁止记录：
- body / objectBody / attachment content
- objectKey / storageKey / real path
- checksum
- token / cookie / password / apiKey / privateKey
- .env / DATABASE_URL / full connection string
- raw IP / full User-Agent
- Achievement title/detail/abstract
- 未脱敏 oldValue/newValue

禁止：
- 不修改 AttachmentController。
- 不改变 HTTP response shape。
- 不新增 controller 或 HTTP route。
- 不修改 root AppModule。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增 useGlobalPipes / useGlobalGuards。
- 不修改 AuditService / AuditRepository。
- 不修改 AchievementService / WorkflowService。
- 不修改 prisma/schema.prisma。
- 不修改 prisma/migrations/**。
- 不修改 prisma/seed.cjs。
- 不修改 package.json / pnpm-lock.yaml。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实对象存储。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。

测试要求：
- upload 成功写 ATTACHMENT / UPLOAD_ATTACHMENT 审计。
- upload audit payload 不含 body/objectKey/storageKey/checksum。
- upload audit 失败时 metadata DB transaction reject。
- upload 鉴权失败不写 storage/metadata/audit。
- upload storage 失败不写 metadata/audit。
- download 成功写 ATTACHMENT / DOWNLOAD_ATTACHMENT 审计。
- download audit payload 不含 body/objectKey/storageKey/checksum。
- download audit 失败时请求失败，不返回 body。
- download 鉴权失败不读 storage、不写 audit。
- download storage 失败不写 audit。
- 测试使用 fake Prisma transaction client、fake storage adapter、mock AuditService。
- 不访问真实 DB。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/attachments apps/api/src/audit
- rg -n "Controller\\(|@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/audit
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "DATABASE_URL|process\\.env|password|token|cookie|apiKey|privateKey|storageKey|objectKey|checksum" apps/api/src/attachments apps/api/src/audit
- rg -n "migrate|seed|schema.prisma" apps/api/src/attachments apps/api/src/audit
- rg -n "AuditService|recordEvent|recordEventInTransaction" apps/api/src/app.module.ts

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md

memory-bank 记录要求：
- progress.md：Step 7D-3 DONE，Step 7D overall DONE，Step 7 overall 可准备收口。
- evidence.md：记录文件变更、测试结果、边界扫描结果。
- implementation-plan.md：记录 Step 7D-3 execution override。
- decisions.md：记录 upload DB/audit 同事务、download 审计失败不返回 body、fake storage 残留风险。
- architecture.md：记录 AttachmentsModule -> AuditModule 和附件审计边界。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 7D-3 实现了什么。
3. upload 审计写入顺序和失败策略。
4. download 审计写入顺序和失败策略。
5. 如何保证 download 审计失败不返回 body。
6. fake storage 残留风险如何记录。
7. 明确没有进入哪些范围。
8. 哪些验证通过。
9. 哪些验证失败及原因。
10. Step 7D 是否整体 DONE。
11. 是否可以进入 Step 7 最终收尾归档。
~~~



~~~
Step 7D-3 已完成并归档。现在进行 Step 7 最终收尾归档。

本次只做 Step 7 final closure，不写新业务代码，不进入 Step 8，不访问真实数据库，不运行 migrate/seed。

请精确读取与 Step 7 final closure 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取 Step 7A / 7B / 7C / 7D 最新归档、Step 7 当前状态、附件/审计相关架构和决策。如需扩大读取范围，请先说明原因。

当前状态：
- Step 7A DONE：Audit foundation。
- Step 7B DONE：Attachment foundation + fake storage adapter。
- Step 7C DONE：Attachment HTTP boundary + root AppModule wiring。
- Step 7D DONE：
  - 7D-1 Achievement audit integration。
  - 7D-2 Workflow audit integration。
  - 7D-3 Attachment upload/download audit integration。
- Step 7D-3 验证通过：
  - corepack pnpm --filter @research-ip/api test：26 files / 264 tests passed
  - corepack pnpm --filter @research-ip/api typecheck：passed
  - corepack pnpm --filter @research-ip/api build：passed
  - corepack pnpm lint：passed
  - corepack pnpm prisma:validate：passed
- Step 8 仍为 TODO，尚未开始。

请检查并在必要时更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md

归档目标：
1. 确认 Step 7 整体 DONE。
2. 确认 Step 7A / 7B / 7C / 7D 分别 DONE。
3. 记录 Step 7A 完成内容：
   - AuditModule / AuditRepository / AuditService / domain / DTO / tests。
   - append-only 审计写入。
   - masked audit 查询预留。
   - recordEventInTransaction / createInTransaction。
4. 记录 Step 7B 完成内容：
   - AttachmentsModule foundation。
   - AttachmentRepository / AttachmentService。
   - fake in-memory storage adapter。
   - metadata 创建、版本号递增、object key 生成。
   - 不接真实对象存储。
5. 记录 Step 7C 完成内容：
   - Attachment HTTP upload/list/detail/download routes。
   - root AppModule 显式接入 AttachmentsModule。
   - root app 下附件 routes 可达。
   - 401 / 403 仍由真实 guard 保护。
6. 记录 Step 7D 完成内容：
   - Achievement create/update/submit/void/archive 审计。
   - Workflow approve/reject/archive closure 审计。
   - Attachment upload/download 审计。
   - 审计失败回滚或阻止返回 body 的策略。
7. 记录最终验证命令和结果：
   - corepack pnpm --filter @research-ip/api test：26 files / 264 tests passed
   - corepack pnpm --filter @research-ip/api typecheck：passed
   - corepack pnpm --filter @research-ip/api build：passed
   - corepack pnpm lint：passed
   - corepack pnpm prisma:validate：passed
8. 记录边界检查结果：
   - 无新增全局 APP_GUARD。
   - 无 useGlobalPipes / useGlobalGuards。
   - main.ts 未修改。
   - schema/migration/seed/package/lockfile 未修改。
   - 未访问真实数据库。
   - 未运行 migrate/seed。
   - 未接真实对象存储、文件系统、网络、multipart、stream。
   - 未进入 Step 8。
9. 记录安全边界：
   - 审计只记录稳定事实和脱敏摘要。
   - 不记录附件内容、objectKey/storageKey、checksum、真实路径。
   - 不记录凭证、Token、Cookie、API key、私钥、连接串、env 值。
   - 不记录 raw IP、完整 User-Agent、Achievement 业务详情全文。
10. 记录已知后续风险：
   - fake storage 阶段若 upload fake object 成功但 metadata/audit transaction 失败，fake in-memory object 可能残留。
   - 真实对象存储阶段需设计 cleanup / compensation / outbox 或预写状态策略。
   - 附件 schema 仍未补 contentType / sizeBytes / storageProvider / object-key unique，生产级下载 header 和多后端存储需后续 schema hardening。
11. 明确 Step 8 仍为 TODO。
12. 明确下一步只能先做 Step 8 前计划确认，不直接实现费用或提醒代码。

安全要求：
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不进入 Step 8。

完成后请汇报：
1. 哪些 memory-bank 文件被更新。
2. Step 7 是否已完整归档为 DONE。
3. Step 8 是否仍为 TODO。
4. Step 8 前计划确认建议读取哪些文件。
~~~

