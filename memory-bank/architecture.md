# Architecture - 科研成果与知识产权管理系统

## 系统目标

建设一个生产级、可扩展、可审计的科研成果与知识产权管理系统。一期采用模块化单体后端和独立前端 SPA，优先保证业务闭环、权限安全、数据一致性和外部依赖可替换。

## 交付物类型

- 页面：登录、工作台、成果登记、审批待办、费用预警、检索、统计看板、审计、系统配置。
- API：认证、成果、审批、费用、附件、检索、看板、审计、外部接口 adapter。
- 服务：权限策略、成果状态机、审批状态机、费用预警、通知、审计、搜索索引同步。
- 脚本：数据库迁移、种子数据、基础检索验证、质量门禁。
- Agent：一期不引入业务 Agent。
- 数据：PostgreSQL 主数据、Meilisearch 搜索索引、S3-compatible 附件对象、Redis 队列状态。

## 技术栈

- 语言：TypeScript。
- 前端：React + Vite + Ant Design。
- 后端：NestJS。
- 数据库：PostgreSQL + Prisma。
- 搜索：Meilisearch。
- 队列：Redis + BullMQ。
- 附件：S3-compatible storage adapter，后续可接 MinIO 或院内对象存储。
- 测试：Vitest/Jest、Supertest、Playwright。
- 部署：一期先按 Docker Compose 或院内部署约束设计，最终以实际环境为准。

## 目录结构草案

```text
E:\研究院科研成果管理系统\
  memory-bank\
  apps\
    web\
    api\
  packages\
    domain\
    shared\
  prisma\
  tests\
  docs\
```

说明：本文件只是架构计划，不代表当前已经创建应用代码目录。

## 模块边界

| 模块 | 职责 | 输入 | 输出 | 依赖 |
| --- | --- | --- | --- | --- |
| Auth/RBAC | 登录、角色权限、部门范围、涉密授权 | 用户凭据、用户上下文 | session、permission set | User, Department |
| Achievement | 成果主数据、三类详情、状态机、唯一性校验 | 成果表单、动作 | 成果记录、状态变更 | RBAC, Audit |
| Workflow | 固定基础审批流、待办、审批动作 | 提交、审批、驳回 | 审批实例、任务状态 | Achievement, Audit |
| Fee | 费用台账、缴费状态、凭证关联 | 费用表单、缴费动作 | 费用记录、预警输入 | Achievement, Attachment |
| Reminder | 30/15/7 天和逾期预警、站内通知、邮件 mock | 费用截止日期、规则 | 提醒任务、通知 | Queue, Notification |
| Attachment | 附件元数据、版本、下载鉴权 | 文件、关联对象 | storage_key、下载响应 | Storage Adapter, RBAC |
| Search | 索引同步、基础全文检索、权限过滤 | keyword, filters | 搜索结果 | Meilisearch, RBAC |
| Dashboard | 统计指标、图表数据、权限视角 | time range, scope | 指标数据 | Achievement, Fee, RBAC |
| Audit | 操作日志、变更前后值、查询 | 业务事件 | append-only logs | Database |
| Integration | DOI、邮件、HR、财务、专利状态 adapter | 外部请求 | 标准化响应、调用日志 | API configs, Queue |

## 数据流

```text
User Action -> Frontend Form -> API Controller -> Use Case -> Domain Policy
  -> Repository / Adapter -> Database / External Service
  -> Audit Event -> Response -> UI State
```

搜索数据流：

```text
Achievement Changed -> Domain Event -> Queue Job -> Search Index Sync
  -> Search Query -> RBAC Filter -> Search Result
```

费用预警数据流：

```text
Fee Due Date -> Scheduled Job -> Reminder Rule -> Notification
  -> User Confirmation -> Audit Log
```

## 外部依赖

| 依赖 | 用途 | 隔离层 | 替换方案 | 风险 |
| --- | --- | --- | --- | --- |
| DOI provider | 论文字段自动补全 | `DoiLookupAdapter` | Crossref/OpenAlex/手工录入 | 接口限流、字段不一致 |
| Mail provider | 邮件通知 | `NotificationAdapter` | SMTP/邮件 API/站内信 | 发送失败、账号配置 |
| HR/SSO | 人员部门和登录 | `IdentityAdapter` | 本地账号/LDAP/OAuth | 数据同步延迟 |
| Finance API | 财务凭证和对账 | `FinanceAdapter` | 手工录入/导入 | 接口权限和字段映射 |
| Patent provider | 专利状态和年费同步 | `PatentStatusAdapter` | 手工维护/数据服务商 | 调用频次和数据可靠性 |
| Object storage | 附件存储 | `StorageAdapter` | MinIO/S3/院内对象存储 | 权限泄露、丢失、下载越权 |
| Meilisearch | 基础全文检索 | `SearchAdapter` | PostgreSQL FTS/Elastic | 索引延迟、权限过滤遗漏 |

## 状态管理

- 单一事实来源：PostgreSQL 中的业务主表和审计表。
- 派生状态：搜索索引、看板聚合和预警任务均可从主数据重建。
- 缓存策略：一期仅对低风险字典、权限集合、看板聚合做短期缓存。
- 失效策略：成果、费用、审批变更后触发相关缓存和搜索索引失效。

## Step 3 数据库落地状态

- 数据库表名和字段名采用 snake_case；Prisma Model 和字段采用 PascalCase/camelCase，并通过 `@@map`、`@map` 映射。
- Step 3 只建立一期核心数据结构，不实现 RBAC、Auth、成果登记 API、审批状态机、附件存储、外部接口或搜索同步业务逻辑。
- 本地账号凭证独立放入 `user_credentials`，不把 `password_hash` 放在 `users` 表；登录逻辑延后到 Step 4。
- DOI、专利申请号、授权号、软著登记号均保留 normalized 字段，并基于 normalized 字段设计唯一约束。
- 涉密和专项授权使用独立 `resource_access_grants` 表预留，Step 3 只建数据结构，不实现授权判断。
- 业务数据默认不硬删除；使用 `status`、`archived_at`、`voided_at`、`revoked_at` 等字段表达生命周期。
- `audit_logs`、`workflow_actions`、`api_call_logs` 原则上 append-only，不提供删除入口，不存储密钥、Token、密码或完整敏感响应。
- 费用、附件、提醒、审计等表保留 `department_id`、`owner_user_id`、`secret_level` 或目标对象字段，为 Step 4 统一权限策略提供查询基础。
- Step 3 seed 只做小样本基础数据；1 万条检索验证数据延后到 Step 9。
- Prisma schema 已完成：`prisma/schema.prisma`。
- 初始 migration 已完成：`20260608080155_init_core_schema`。
- migration SQL 已补充 `resource_access_grants_active_unique_idx` 和 `workflow_instances_active_target_unique_idx` 两个 partial unique index。
- 本项目专用本地 PostgreSQL 使用 `research-achievement-postgres-dev` 容器、`127.0.0.1:55432` 端口和 `research_achievement_pgdata_dev` volume；不记录密码或完整连接串。
- 最小 seed 已完成：`prisma/seed.cjs`，连续执行两次计数一致。
- Step 3 验证命令已通过：`corepack pnpm exec prisma db seed`、`corepack pnpm prisma:validate`、`corepack pnpm lint`、`corepack pnpm typecheck`、`corepack pnpm test`、`corepack pnpm build`。
- Step 4A 已完成：API 侧新增 `DatabaseModule` / `PrismaService`、`UserContext`、权限/角色/scope/resource 常量、`PolicyDecision` 基础类型和 dev/test identity adapter。
- Step 4A seed 仅补权限主数据：新增 `DEPARTMENT_ADMIN`、8 个细粒度权限点和角色权限映射；未新增测试场景数据。
- Step 4B 已完成：新增 RBAC 静态权限判断、精确部门 scope 判断和 achievement / fee / department 的 Prisma where 过滤工厂。
- Step 4C 已完成：新增 `resource_access_grants` 有效授权判断、涉密读取策略、附件元数据/下载策略、审计只读策略和审计脱敏服务。
- Step 4D 已完成：新增 `@CurrentUser()`、`@RequirePermissions()`、`UserContextGuard`、`PermissionGuard`，并将 `AuthorizationModule` 接入 `AppModule`。
- Step 4 请求链路采用显式 `@UseGuards`，未注册全局 `APP_GUARD`；test-only controller 仅存在于测试文件中，未新增运行时业务 API。
- Step 4 HTTP 集成测试已覆盖无上下文 401、缺权限 403、权限通过 allow、`@CurrentUser()` 注入和生产环境禁用 `X-Demo-User-Id`。
- `ResourcePolicyGuard` 尚未实现，后续成果、附件、审计真实 API 需要按具体资源读取、where 过滤和 policy 组合单独接入。
- Step 4 权限内核整体 DONE。
- Step 5 Achievement 后端一期 DONE：`AchievementsModule` 已接入根 `AppModule`，并暴露成果草稿创建、详情读取、草稿更新、提交边界、作废边界和归档边界 6 个后端 API。
- Step 5 后端 API 采用显式 `UserContextGuard` / `PermissionGuard`，未注册全局 `APP_GUARD`，未修改 `main.ts`，DTO 校验保持在 `AchievementController` 局部。
- Step 5 复用 Step 4 的 `PolicyQueryFactory` 和涉密授权策略；涉密可见但无 `SECRET_READ` 授权保持 403 语义。
- Step 5 仍未实现审批流实例、任务、动作、部门审核、驳回、通过或待办；这些仍属于 Step 6。

## Step 6A Workflow Foundation

- Step 6A is DONE as a backend-only workflow foundation slice.
- A standalone `WorkflowModule` exists under `apps/api/src/workflow`, but it is not imported by root `AppModule`.
- Step 6A added workflow domain constants, task/instance state-machine pure functions, action/query DTOs, `WorkflowRepository`, and fake Prisma tests.
- The Step 6 minimal model uses concrete `WorkflowTask.assigneeId` tasks for department research secretary users; role-pool or candidate-group tasks are not modeled in Step 6A.
- Current schema is sufficient for Step 6A and no migration was added.
- `WorkflowRepository` covers active achievement review instance creation, concrete department review task creation, submit action creation, active instance lookup, assignee task lookup, department research secretary lookup, guarded task transition with action, and guarded instance transition.
- Step 6A does not implement workflow service orchestration, controller, HTTP API, AppModule integration, actual Achievement submit integration, department approval/rejection, Achievement status advancement, audit log service, frontend pages, fees, reminders, attachments, search, dashboard, or real login/SSO.
- Step 6B must plan the transaction boundary between workflow writes and Achievement state transitions before implementation.

## Step 5 Achievement Backend Closure

- Step 5 is DONE as a backend-only phase-one achievement registration slice.
- `AchievementsModule` is imported by root `AppModule`.
- The achievement API exposes six backend routes for draft creation, detail read, draft update, submit boundary, void boundary, and archive boundary.
- The achievement API uses explicit `UserContextGuard` / `PermissionGuard`; no global `APP_GUARD` is registered and `main.ts` remains unchanged.
- Achievement detail visibility reuses Step 4 `PolicyQueryFactory` and secret access policy; visible secret resources without `SECRET_READ` keep 403 semantics.
- Step 5 did not implement workflow instance/task/action, department review, rejection, approval, todo, frontend pages, fees, reminders, attachments, search, dashboard, or real login/SSO.
- Step 6 is now DONE for the backend basic approval workflow; frontend pages, attachments/audit, fees, reminders, search, dashboard, and real login/SSO remain separate later steps.

## 安全与权限

- 后端统一执行 RBAC、部门隔离和涉密授权；前端只负责展示裁剪。
- `UserContext` 是后续后端鉴权的统一用户事实输入，包含用户、部门、角色 ID、角色码、权限、角色作用域和 scoped department IDs。
- dev/test identity adapter 仅允许非生产环境通过 `X-Demo-User-Id` 加载演示用户上下文；生产环境不得依赖该 header。
- `SYSTEM_ADMIN` 不走超级管理员绕过，仍必须通过显式权限判断。
- 不设置全局 `secret:read`；涉密读取通过 `resource_access_grants` 的有效 `SECRET_READ` 授权处理。
- Step 4B 部门 scope 只做精确 `departmentId` 匹配，不自动继承下级部门。
- Step 4B 无权限 Prisma where 统一返回 `{ id: { in: [] } }` 形态的空结果过滤，避免无意返回全量数据。
- Step 4B 的 `achievement:archive` 仅作为动作权限存在，不赋予系统管理员全量业务详情读取能力。
- Step 4C `DEPARTMENT` grant 只匹配用户当前 `departmentId`，不匹配 `scopedDepartmentIds`。
- Step 4C `SECRET` / `CONFIDENTIAL` 资源 owner 不自动可读，仍需有效 `SECRET_READ` 授权。
- Step 4C 单附件 `ATTACHMENT_DOWNLOAD` grant 只允许下载指定附件，不代表可读业务详情、附件元数据或其他附件。
- Step 4C 审计只读只允许脱敏结果，不返回原始 `oldValue` / `newValue`、IP 或 User-Agent。
- Step 4D 已提供请求级 401 / 403 / allow 验证链路，但不自动保护所有 API；业务 API 必须显式声明 guard 和权限。
- Step 4D 未实现资源级 guard；成果详情、附件下载、审计读取等后续接口必须继续叠加资源 policy。
- 所有列表、详情、搜索、看板、附件下载、审计查询均必须走权限策略。
- 附件不暴露真实存储路径，下载必须通过后端鉴权。
- 敏感接口配置通过环境变量或配置中心引用，不写入代码和文档。
- 业务数据不硬删除，注销、作废、撤回通过状态和审计记录表达。
- 审计日志不提供删除入口；导出和调试必须脱敏。

## 可观测性

- 日志：业务操作日志、接口调用日志、系统错误日志分离。
- trace_id / decision_id：API 请求、审批动作、外部接口调用、队列任务保留 trace_id。
- 指标：接口耗时、搜索耗时、队列积压、外部接口成功率、预警发送成功率。
- 告警：外部接口连续失败、预警任务失败、附件下载异常、权限拒绝异常峰值。

## 测试策略

- 单元测试：状态机、权限策略、唯一性校验、预警规则。
- 集成测试：成果提交审批、费用预警、附件鉴权、搜索权限过滤。
- E2E：科研人员登记 -> 科研秘书审核 -> 系统管理员归档 -> 看板/搜索可见。
- 数据库检查：唯一约束、索引、事务、审计 append-only。
- 安全检查：跨部门、涉密、附件下载、审计只读。

## 回滚与迁移

- 数据库 schema 变化必须通过新迁移，不修改已执行迁移。
- 大表变更需要兼容期、回填策略和回滚说明。
- 搜索索引可删除重建，但业务主数据不可丢失。
- 外部接口 adapter 可通过配置关闭并降级为手工录入。
- 业务状态变更不硬回滚，使用反向业务动作和审计记录处理。
## Step 6B-2 Submit Workflow Transaction Integration

- Step 6B-2 is DONE as a backend-only submit integration slice.
- `AchievementService.submitDraft` is the transaction owner for submit-time Achievement and Workflow consistency.
- `WorkflowService` is a no-HTTP application service under `apps/api/src/workflow`; it prepares submit workflow creation by checking active instance conflicts and selecting a department reviewer, then delegates creation of workflow instance/task/action to `WorkflowRepository`.
- `AchievementsModule` imports `WorkflowModule`, but root `AppModule` is unchanged.
- Submit-time workflow creation is ordered as owner-scoped state read, DRAFT validation, workflow precheck and assignee resolution, guarded Achievement transition to `PENDING_DEPARTMENT_REVIEW`, and workflow instance/task/action creation.
- Department reviewer assignment uses stable ordering by `createdAt asc` and `id asc`, and Step 6B-2 creates one concrete task for the first reviewer.
- Missing reviewer remains a business precondition failure and maps to 422-class semantics through existing achievement controller mapping.
- Existing active workflow instance remains a conflict and maps to 409-class semantics through existing achievement controller mapping.
- Step 6B-2 does not implement department approve/reject, workflow controller, todo API, root AppModule wiring, archive workflow completion, frontend pages, fees, reminders, attachments, search, dashboard, or audit log service.

## Step 6B-1 Workflow Transaction Foundation

- Step 6B-1 is DONE as a backend-only transaction and state-machine foundation slice.
- Achievement review status can now move from `PENDING_DEPARTMENT_REVIEW` to `PENDING_ARCHIVE` or `DEPARTMENT_REJECTED`; these transitions are prerequisites for later department approve/reject orchestration.
- Workflow instance status can now transition `ACTIVE -> ACTIVE`; this supports advancing `currentStep` to `ARCHIVE` after department approval while keeping the same workflow instance active until archive completion.
- Achievement and Workflow repositories now expose caller-provided transaction-client methods for the operations required by later service orchestration.
- Public repository methods remain transaction-owning wrappers for standalone use; future cross-repository orchestration should use the `...InTransaction` variants inside one outer Prisma transaction.
- Step 6B-1 does not connect `WorkflowModule` to `AppModule`, does not create controllers or HTTP APIs, and does not change `AchievementService.submitDraft`.
- Step 6B-2 should plan submit integration on top of this boundary; Step 6B-3 should plan approve/reject orchestration on the same boundary.

## Step 6B-4 Archive Workflow Closure

- Step 6B-4 is DONE as a backend-only service orchestration slice.
- System-admin archive remains under the existing `AchievementService.archiveAchievement` boundary because `achievement:archive` is an Achievement action permission and the existing Achievement controller route already owns the HTTP entry point.
- `AchievementService.archiveAchievement` owns one Prisma transaction across Achievement archive, workflow action write, and workflow instance completion.
- `WorkflowService` provides no-HTTP in-transaction archive helpers:
  - prepare archive by validating the active Workflow instance for the target Achievement.
  - complete archive by writing an instance-level `ARCHIVE` action and completing the Workflow instance.
- Archive readiness requires Workflow instance `ACTIVE`, `currentStep=ARCHIVE`, `targetType=ACHIEVEMENT`, and matching `targetId`.
- The archive action is instance-level with `taskId=null`; no archive task is created in Step 6B-4.
- Missing active Workflow instance, wrong step, wrong target, or transition conflicts use 409-class invalid-state semantics through existing Achievement error mapping.
- Step 6B is now complete at the service orchestration level: submit, department approve, department reject, and system-admin archive are all transaction-scoped.
- Step 6B-4 does not create workflow controller, new HTTP API, root `AppModule` wiring, frontend, fees, reminders, attachments, search, dashboard, migration, seed, dependency changes, or audit log service.

## Step 6C-1 Workflow Approve/Reject HTTP Boundary

- Step 6C-1 is DONE as a module-local HTTP controller slice.
- `WorkflowController` is registered only in `WorkflowModule`; root `AppModule` is unchanged until Step 6D.
- The controller exposes only:
  - `POST /workflow/tasks/:taskId/approve`
  - `POST /workflow/tasks/:taskId/reject`
- Both routes use explicit `UserContextGuard` and `PermissionGuard`, and require `achievement:review_department`.
- Both routes delegate to existing `WorkflowService` orchestration methods; no new service orchestration path was added.
- `WorkflowModule` imports `IdentityModule` directly because the local controller uses `UserContextGuard`, which requires the `IDENTITY_ADAPTER` provider.
- Step 6C-1 does not expose todo list/detail APIs, system-admin archive workflow API, root app wiring, frontend, fees, reminders, attachments, search, dashboard, migration, seed, dependency changes, or global `APP_GUARD`.

## Step 6C-2 Workflow Todo HTTP Boundary

- Step 6C-2 is DONE as a module-local workflow todo read API slice.
- `WorkflowController` now exposes:
  - `GET /workflow/tasks/my`
  - `GET /workflow/tasks/:taskId`
- Both routes remain registered only inside `WorkflowModule`; root `AppModule` is unchanged until Step 6D.
- Both routes use explicit `UserContextGuard` / `PermissionGuard` and require `achievement:review_department`.
- The list route defaults to pending tasks and allows explicit status-history filtering plus optional Achievement target id filtering.
- The query scope is always the current assignee: `assigneeId = currentUser.userId`.
- The detail route uses assignee-scoped lookup and treats missing/non-assignee tasks as access denied.
- Todo list/detail payloads include only workflow task fields and workflow instance target fields.
- Todo list/detail payloads do not include workflow actions and do not include Achievement business details such as title, type, secret level, contributors, owner, department, or typed detail records.
- If a client needs Achievement business details, it must call the Achievement detail API and pass through the Step 4/Step 5 Achievement resource policy boundary.
- Step 6C is now complete at the module-local controller level; Step 6D still owns root `AppModule` integration and Step 6 closure.

## Step 6D Workflow Root AppModule Integration

- Step 6D is DONE.
- Root `AppModule` explicitly imports `WorkflowModule`.
- `AchievementsModule` keeps its existing `WorkflowModule` import because Achievement submit/archive orchestration depends on `WorkflowService`.
- Workflow routes are reachable through the root API module:
  - `GET /workflow/tasks/my`
  - `GET /workflow/tasks/:taskId`
  - `POST /workflow/tasks/:taskId/approve`
  - `POST /workflow/tasks/:taskId/reject`
- `/health` remains available after workflow root integration.
- Workflow HTTP routes continue to use explicit controller-level `UserContextGuard` and `PermissionGuard`; no global `APP_GUARD`, global pipe, or global guard is registered.
- `main.ts` remains unchanged.
- AppModule-level tests use provider overrides for `WorkflowService`, `AchievementService`, and `PrismaService`; real guards remain active while avoiding real database and repository access.
- Step 6 overall is DONE for the backend basic workflow: submit creates workflow, department review approve/reject advances workflow and Achievement state, archive closes workflow, workflow HTTP action/read routes are exposed, and root app wiring is verified.
- Step 6 does not include frontend pages, Step 7 attachment/audit implementation, fees, reminders, search, dashboard, real login/SSO, complex multi-reviewer flow, candidate pools, transfer, claim, or reminder workflow.

## Step 6 Final Backend Workflow Boundary

- Step 6 is DONE as the backend basic approval workflow slice.
- Stable capabilities:
  - Researcher submit creates one active Workflow instance, one concrete department reviewer task, and a submit action.
  - Department reviewer approve moves the task to approved, advances the Workflow instance to archive step, and moves the Achievement to pending archive.
  - Department reviewer reject moves the task to rejected, completes the Workflow instance, and moves the Achievement to department rejected.
  - System-admin archive through the existing Achievement archive route writes an instance-level archive action and completes the Workflow instance.
  - Workflow HTTP exposes approve/reject actions and current-assignee task list/detail.
  - Root `AppModule` exposes workflow routes explicitly through `WorkflowModule`.
- Architecture boundaries:
  - Workflow todo APIs do not return Achievement business detail.
  - Achievement business detail remains behind the Achievement detail API and its Step 4/Step 5 resource policies.
  - No global guard or global validation pipe is introduced by Step 6.
  - No schema, migration, seed, dependency, or real database integration change is part of Step 6 closure.
  - Step 7 attachment/audit work is still TODO and requires plan confirmation before implementation.

## Step 7B Attachment Foundation

- Step 7A is DONE as the standalone audit foundation.
- Step 7B is DONE as the standalone attachment foundation and fake storage adapter slice.
- Step 7B created `AttachmentsModule` under `apps/api/src/attachments` as a standalone module; Step 7C-3 later imported it into root `AppModule`.
- The attachment repository supports metadata creation, caller-provided transaction creation, latest-version lookup, relation list, and id lookup.
- The attachment service currently orchestrates ACHIEVEMENT relation metadata only; FEE_RECORD and WORKFLOW_ACTION remain constants for later steps.
- Object keys are generated server-side with relation type, relation id, random UUID segment, version, and sanitized file name.
- Public metadata DTOs do not include object keys or checksums.
- Fake storage is in-memory only and performs no file system, network, or real object storage access.
- Step 7B prepares Step 7C policy sequencing through `AttachmentAccessPolicyService.canReadMetadata(...)`; download policy, HTTP routes, real streams, and real storage remain TODO.
- Step 7B does not integrate `AuditService`; audit event writes remain Step 7D.
- No schema, migration, seed, dependency, package, lockfile, real database, or root app wiring change is part of Step 7B.

## Step 7 Final Architecture Closure

- Step 7 is DONE.
- Step 7A Audit foundation, Step 7B Attachment foundation, Step 7C Attachment HTTP/root wiring, and Step 7D core audit integration are all DONE.
- Stable module boundaries after Step 7:
  - `AuditModule` owns append-only audit write/read foundations, masked query reservation, redaction, and caller-provided transaction write methods.
  - `AttachmentsModule` owns attachment metadata, fake storage adapter boundary, Achievement attachment HTTP routes, and upload/download audit integration.
  - `AchievementsModule` owns Achievement state-change semantics and writes Achievement audit facts for create/update/submit/void/archive.
  - `WorkflowModule` owns Workflow task/instance semantics and writes Workflow audit facts for approve/reject/archive closure.
- HTTP boundary after Step 7:
  - Attachment upload/list/detail/download routes are reachable through root `AppModule`.
  - Routes remain protected by explicit guards/decorators and root tests verify 401/403 behavior.
  - Public attachment responses do not include storage object keys, checksums, real paths, or parent Achievement business detail.
- Audit boundary after Step 7:
  - Audit records actor user/department, target type/id/department/secret level, action, ids, status/version/step facts, file name where needed, and timestamps.
  - Audit summaries are stable and redacted.
  - Audit does not record attachment content, object key, storage key, checksum, real storage path, credentials, token, cookie, API key, private key, connection string, environment value, raw IP, full user agent, or full Achievement business detail.
- Transaction boundary after Step 7:
  - Mutating Achievement, Workflow, and Attachment upload writes place audit writes in the same business transaction where a transaction exists.
  - Audit failure rejects the shared transaction for those write actions.
  - Attachment download has no business mutation; it writes audit after authorization and fake storage read, before returning body, and audit failure prevents body return.
- Storage boundary after Step 7:
  - Only fake in-memory storage is implemented.
  - No real object storage, file system storage, network storage, multipart upload, or stream download is implemented.
  - Known limitation: fake storage may retain an in-memory object if fake object write succeeds and the metadata/audit transaction later fails.
  - Real storage must plan cleanup/compensation/outbox/pre-write status before production integration.

## Step 8A Fee Foundation

- `FeesModule` is currently a standalone module and is not imported by root `AppModule`.
- `FeeRepository` owns FeeRecord persistence foundations only: create, caller-provided transaction create, policy-scoped reads, optimistic pay-status transition, unique-conflict detection, and narrow Achievement parent fact lookup.
- Fee service orchestration, HTTP routes, audit event writes, Reminder rules, Notification adapters, root `AppModule` wiring, frontend pages, real mail, real queue, and real finance integration remain outside Step 8A.
- Fee status semantics after Step 8A:
  - `PENDING` can become `PAID`, `OVERDUE`, `WAIVED`, or `CANCELLED`.
  - `OVERDUE` can become `PAID`, `WAIVED`, or `CANCELLED`.
  - `PAID`, `WAIVED`, and `CANCELLED` are terminal.
  - Date-derived overdue status is pure domain logic and does not mutate the database by itself.
  - Repository status transitions use an expected-status guard to avoid stale writes.
- Deferred production hardening:
  - Attachment schema still defers `contentType`, `sizeBytes`, `storageProvider`, object-key uniqueness, production download headers, and multi-backend storage support to a later confirmed migration plan.

## Step 8B-1 Fee Service Boundary

- `FeeService` owns Fee application orchestration for list, detail, create, and mark-paid.
- `FeesModule` provides `FeeService` and imports `AuditModule`, `AuthorizationModule`, and `DatabaseModule`, but root `AppModule` still does not import `FeesModule`.
- Fee reads use `PolicyQueryFactory.feeReadableWhere(...)`; Fee writes use `fee:manage_department` with department-scoped Fee or Achievement parent queries.
- Fee create reads only Achievement parent narrow facts: id, status, department id, owner user id, and secret level.
- Fee create writes the Fee department id from the Achievement parent; client-supplied department data is not accepted.
- Fee create and mark-paid are service-owned Prisma transactions. Fee repository writes and `AuditService.recordEventInTransaction(...)` share the same transaction callback.
- Fee audit summaries record only stable facts: fee record id, achievement id, action, fee type, pay status, due date, and paid date when present.
- Fee audit summaries do not record amount, voucher number, Achievement title/detail/contributors/abstract, attachment content, storage key, checksum, raw IP, full user agent, credentials, tokens, cookies, keys, connection strings, or environment values.
- Non-changes:
  - No `main.ts`, global `APP_GUARD`, `useGlobalPipes`, `useGlobalGuards`, schema, migration, seed, package, or lockfile change is part of Step 7 final closure.
- Next boundary:
  - Step 8 remains TODO and may only start with pre-plan confirmation.

## Step 7C Attachment HTTP Boundary

- Step 7C is DONE for attachment HTTP routes and root reachability.
- `AttachmentsModule` now owns `AttachmentController` and is explicitly imported by root `AppModule`.
- Achievement attachment routes are:
  - `POST /achievements/:achievementId/attachments`
  - `GET /achievements/:achievementId/attachments`
  - `GET /achievements/:achievementId/attachments/:attachmentId`
  - `GET /achievements/:achievementId/attachments/:attachmentId/download`
- Static permissions are explicit through guards and decorators:
  - Upload uses `achievement:update_own`.
  - List/detail use `attachment:read_metadata`.
  - Download uses `attachment:download`.
- Resource policy sequencing:
  - List/detail load minimum parent Achievement facts through `PolicyQueryFactory.achievementReadableWhere(...)`, then apply `SecretAccessPolicyService.canReadResource(...)`.
  - Download reads attachment metadata, validates relation/path match, loads minimum parent facts and grants, calls `AttachmentAccessPolicyService.canDownload(...)`, and only then reads fake storage.
  - Direct `ATTACHMENT_DOWNLOAD` grant is download-only and does not authorize list/detail or parent Achievement business detail.
- Public response boundary:
  - Metadata responses include only attachment metadata fields.
  - Fake download response includes attachment id, file name, version, and fake body.
  - Storage object keys, checksums, real paths, and parent Achievement details are not returned.
- Root AppModule-level tests verify `/health`, all four attachment routes, root 401, root 403, and separate upload/download static permissions with real guards active and provider overrides for business services.
- Step 7C still excludes real storage, stream/multipart upload, audit event writes, schema changes, migrations, seed, package changes, real database access, frontend, fee attachments, and workflow-action attachments.

## Step 7D-1 Achievement Audit Integration

- Step 7D is split into:
  - 7D-1 Achievement audit integration.
  - 7D-2 Workflow approve/reject/archive-closure audit integration.
  - 7D-3 Attachment upload/download audit integration.
- Step 7D-1 is DONE for Achievement actions only.
- `AchievementsModule` imports `AuditModule`; `AchievementService` depends on `AuditService`.
- Achievement create draft, update draft, submit, void, and archive write `ACHIEVEMENT` audit events.
- All Step 7D-1 audit writes use `AuditService.recordEventInTransaction(...)`.
- Create/update/void are now service-owned Prisma transactions so the business write and audit write commit or fail together.
- Submit/archive keep the existing cross-service transaction and append the audit write before transaction completion.
- Audit failure is treated as business failure for these Achievement write actions.
- Achievement audit summaries record only stable facts: actor user/department, target Achievement id/department/secret level, action, status, version, and relevant timestamps.
- Achievement audit summaries do not record titles, detail payloads, paper abstract text, void reason text, approval comments, attachment content, storage/object keys, checksum, credentials, environment values, or raw connection strings.
- Workflow audit events and Attachment audit events remain outside Step 7D-1.

## Step 7D-2 Workflow Audit Integration

- Step 7D-2 is DONE for Workflow actions.
- `WorkflowModule` imports `AuditModule`; `WorkflowService` depends on `AuditService`.
- Department review approve writes `WORKFLOW_TASK / APPROVE` audit after workflow task/action, workflow instance, and Achievement status writes succeed in the same transaction.
- Department review reject writes `WORKFLOW_TASK / REJECT` audit after workflow task/action, workflow instance, and Achievement status writes succeed in the same transaction.
- `WorkflowService.completeAchievementArchiveInTransaction(...)` writes `WORKFLOW_INSTANCE / ARCHIVE` audit after the instance-level archive workflow action and workflow instance completion succeed.
- `AchievementService.archiveAchievement` remains the archive transaction owner and passes the same transaction/audit client plus stable target facts into the workflow closure helper.
- Archive has two separate audit facts in one transaction:
  - `ACHIEVEMENT / ARCHIVE` records the Achievement state transition.
  - `WORKFLOW_INSTANCE / ARCHIVE` records the Workflow instance closure.
- Workflow audit summaries record only stable facts: actor user/department, task or instance target id, related workflow instance id, related Achievement id, action, status/step transitions, and timestamps.
- Workflow audit summaries do not record approve/reject comments, Achievement titles, detail payloads, attachment content, storage/object keys, checksum, credentials, environment values, raw IP, user agent, or raw connection strings.
- Attachment audit events remain outside Step 7D-2.

## Step 7D-3 Attachment Audit Integration

- Step 7D-3 is DONE for Achievement attachment upload/download actions.
- `AttachmentsModule` imports `AuditModule`; `AttachmentService` depends on `AuditService`.
- Upload writes `ATTACHMENT / UPLOAD_ATTACHMENT` audit with the metadata create in one Prisma transaction.
- Upload fake storage write remains before and outside the metadata/audit transaction.
- If fake storage succeeds and the metadata/audit transaction later fails, a fake in-memory object may remain without metadata; this is a known Step 7D-3 limitation for later real-storage cleanup/compensation design.
- Download preserves the Step 7C authorization sequence: relation/path match, parent facts, base Achievement visibility, grants, and attachment download policy all run before fake storage read.
- Download writes `ATTACHMENT / DOWNLOAD_ATTACHMENT` audit after fake storage read succeeds and before returning the fake body.
- Download audit failure prevents the response body from being returned.
- Attachment audit summaries record only stable facts: actor user/department, Attachment target id/department/secret level, related Achievement id, relation type/id, action, file name, version, status, uploader id for upload, and timestamps.
- Attachment audit summaries do not record fake body, object key, storage key, checksum, credentials, environment values, raw IP, user agent, connection strings, or parent Achievement business detail.
- Step 7D-3 does not change controllers, HTTP routes, HTTP response shapes, root `AppModule`, schema, migrations, seed, dependencies, or real storage.

## Step 6B-3 Department Review Orchestration

- Step 6B-3 is DONE as a backend-only service orchestration slice.
- Department review approve/reject lives in `WorkflowService`, not in `AchievementService`, because the operation is centered on workflow task/action/instance state while coordinating Achievement state atomically.
- `approveDepartmentReviewTask` and `rejectDepartmentReviewTask` each own one Prisma transaction.
- The consistency boundary is workflow task transition plus workflow action write, workflow instance transition, and Achievement status transition.
- Assignee ownership is enforced by assignee-scoped task lookup before any mutation.
- Department scope is enforced by Step 4 `PolicyQueryFactory.achievementDepartmentWhere(context, achievement:review_department)` before reading the target Achievement state.
- Approve moves task `PENDING -> APPROVED`, writes `APPROVE`, keeps workflow instance `ACTIVE`, advances `currentStep` to `ARCHIVE`, and moves Achievement `PENDING_DEPARTMENT_REVIEW -> PENDING_ARCHIVE`.
- Reject requires a trim-nonempty comment, moves task `PENDING -> REJECTED`, writes `REJECT`, completes the workflow instance with `currentStep=null`, and moves Achievement `PENDING_DEPARTMENT_REVIEW -> DEPARTMENT_REJECTED`.
- Non-assignee and cross-department misses use access-denied semantics to avoid leaking workflow or Achievement existence.
- `WorkflowModule` directly provides `AchievementRepository` and imports `AuthorizationModule`; root `AppModule` is unchanged.
- Step 6B-3 does not implement archive workflow closure, workflow controller, new HTTP API, todo API, frontend, fees, reminders, attachments, search, dashboard, or audit log service.
## Step 8B-2 Fee HTTP Boundary

- `FeeController` is registered only inside `FeesModule`; Fee routes are not root-app reachable until Step 8B-3 explicitly imports `FeesModule` into root `AppModule`.
- The module-local Fee HTTP surface is limited to `GET /fees`, `GET /fees/:id`, `POST /fees`, and `POST /fees/:id/mark-paid`.
- `POST /fees/:id/mark-paid` returns HTTP 200 with `@HttpCode(200)` because it updates an existing Fee payment state.
- Fee routes use explicit `UserContextGuard`, `PermissionGuard`, `@CurrentUser()`, and `@RequirePermissions()` rather than global guards.
- Static permissions are `fee:read_department` for read routes and `fee:manage_department` for create/mark-paid routes.
- Controller responsibilities are HTTP validation, parameter parsing, static permission declaration, current-user injection, service delegation, and Fee service error mapping.
- Resource-level department scope, Achievement parent scope, Fee write transactions, and audit writes remain in `FeeService`; the controller does not directly access repository, Prisma, or `AuditService`.
- `FeesModule` imports `IdentityModule` for guard dependency resolution, matching existing module-local HTTP boundary patterns.
- No PATCH, DELETE, archive, cancel, waive, Reminder, Notification, frontend, external mail, queue, finance, schema, migration, seed, package, or lockfile behavior is part of Step 8B-2.
## Step 8B-3 Fee Root AppModule Wiring

- Root `AppModule` now explicitly imports `FeesModule`.
- Fee routes are reachable through the root API module:
  - `GET /fees`
  - `GET /fees/:id`
  - `POST /fees`
  - `POST /fees/:id/mark-paid`
- `/health` remains available after Fee root integration.
- Fee HTTP routes continue to use explicit controller-level `UserContextGuard` and `PermissionGuard`; no global `APP_GUARD`, global pipe, or global guard is registered.
- `main.ts` remains unchanged.
- AppModule-level Fee tests override `FeeService`, `PrismaService`, and `IDENTITY_ADAPTER`; real guards and decorator metadata remain active while avoiding dev identity Prisma lookup, real database access, real Fee transactions, and audit writes.
- Step 8B is DONE for Fee backend service, audit transaction integration, module-local HTTP boundary, and root route reachability.
- Step 8B does not include Reminder rules, Notification adapters, frontend pages, real mail, real queue, real finance integration, PATCH/DELETE/archive/cancel/waive routes, schema changes, migrations, seed changes, package changes, or lockfile changes.
## Step 8C-1 Reminder Rule Boundary

- Step 8C-1 is DONE as a domain-only Reminder rule-engine slice.
- Reminder date rules use explicit `today` input and normalize both `today` and Fee `dueDate` to UTC date-only midnight.
- The rule engine generates `DAYS_30`, `DAYS_15`, and `DAYS_7` candidates when the normalized due date is exactly 30, 15, or 7 days after normalized today.
- The rule engine generates `OVERDUE` candidates when normalized today is after normalized due date.
- Overdue candidates use normalized today as `remindDate`, preserving the planned one-overdue-candidate-per-day behavior once Step 8C-2 applies the existing ReminderTask uniqueness key.
- Candidate generation is allowed only for Fee statuses `PENDING` and `OVERDUE`; `PAID`, `WAIVED`, `CANCELLED`, and archived Fee facts are skipped.
- Receiver resolution is deterministic and limited to Fee/Achievement narrow facts: Fee `createdById`, then Fee `updatedById`, then Achievement owner user id. If all are missing, the Fee is skipped with a missing-receiver reason.
- Reminder status-machine helpers define legal transitions for `PENDING`, `SENT`, `FAILED`, `CONFIRMED`, and `CANCELLED`; Step 8C-1 does not execute send, confirm, retry, or cancel behavior in a service.
- Step 8C-1 does not add Reminder repository, Reminder service, Prisma access, HTTP route, root `AppModule` wiring, scheduler, queue, Notification adapter, reminder confirm, AuditService integration, schema changes, migrations, seed changes, package changes, or lockfile changes.

## Step 8C-2 Reminder Repository And Service Boundary

- Step 8C-2 is DONE as a Reminder persistence and service-foundation slice.
- `RemindersModule` provides and exports `ReminderRepository` and `ReminderService`, imports only `DatabaseModule`, and is not wired into root `AppModule`.
- `ReminderRepository` owns the minimal persistence boundary for due-date reminder generation:
  - Reads active `FeeRecord` facts with `PENDING` or `OVERDUE` status.
  - Covers exact 30/15/7-day due-date windows and overdue Fee records.
  - Defaults scan size to `take: 500`.
  - Selects only Fee reminder facts and nested Achievement `ownerUserId`.
  - Does not select Fee amount, voucher number, Achievement title/detail/contributors/abstract, detail relations, attachment storage facts, or checksum facts.
- `ReminderRepository` writes `ReminderTask` rows with `targetType=FEE_RECORD`, target id, remind date, reminder level, receiver id, and `PENDING` status.
- Idempotency uses the existing `ReminderTask` uniqueness boundary: target type, target id, remind date, reminder level, and receiver id.
- Repository writes deduplicate candidates in memory before calling `createMany({ skipDuplicates: true })`; database duplicates are reported as duplicate summary counts.
- `ReminderService.generateFeeDueReminders(today, options)` requires explicit `today`, normalizes it through the 8C-1 UTC date-only helper, runs the 8C-1 rule engine, and returns summary counts plus skipped Fee facts only.
- Missing receiver facts remain skipped by the rule engine; the service does not synthesize department secretary or fee-manager recipients.
- Step 8C-2 does not add HTTP routes, root `AppModule` wiring, scheduler, queue, Notification adapter, reminder confirm, AuditService integration, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.

## Step 8D-1 Notification Mock Foundation

- Step 8D-1 is DONE as a Notification mock foundation slice.
- `NotificationsModule` provides and exports `NotificationRepository` and `NotificationService`, imports only `DatabaseModule`, and is not wired into root `AppModule`.
- `MockNotificationAdapter` supports only in-app mock notification results. It does not connect to external providers.
- `NotificationRepository` owns minimal Notification persistence:
  - Creates a Notification row with receiver id, `IN_APP` channel, title, content, `SENT` status, and `sentAt`.
  - Exposes a caller-provided transaction create method for the later Reminder send orchestration transaction boundary.
  - Does not store or require a reminder task id because the current schema has no Notification-to-ReminderTask relation.
- `NotificationService.sendInAppNotification(...)` validates nonblank receiver id, title, and content, calls the mock adapter, and persists the resulting in-app notification.
- Step 8D-1 intentionally produces no audit payload; Reminder send and confirm audit integration remain Step 8D-2.
- Step 8D-1 does not add HTTP routes, root `AppModule` wiring, scheduler, queue, external notification provider, Reminder send/confirm orchestration, AuditService integration, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.

## Step 8D-2 Reminder Send/Confirm Transaction Boundary

- Step 8D-2 is DONE as a Reminder service orchestration and audit transaction slice.
- `RemindersModule` imports `NotificationsModule` and `AuditModule`; root `AppModule` remains unchanged.
- `ReminderRepository` now supports minimal ReminderTask state reads and optimistic guarded status transitions.
- ReminderTask state facts for orchestration are limited to id, target type/id, remind date/level, receiver id, status, sent timestamp, and confirmed timestamp.
- `ReminderService.sendPendingReminder(...)` supports a light system actor and keeps scheduler/queue execution outside this step.
- Send success transaction:
  - Reads ReminderTask state.
  - Validates `PENDING -> SENT` through the Step 8C status machine.
  - Creates an in-app Notification through the Notification transaction boundary.
  - Transitions ReminderTask to `SENT`.
  - Writes `REMINDER_TASK / UPDATE` and `NOTIFICATION / CREATE` audit events.
- Send failure transaction:
  - Reads ReminderTask state.
  - Validates `PENDING -> FAILED`.
  - Transitions ReminderTask to `FAILED`.
  - Writes `REMINDER_TASK / UPDATE` audit.
  - Does not create a failed Notification row.
- `ReminderService.confirmReminder(...)` uses real `UserContext`, enforces receiver-only confirmation, validates `SENT -> CONFIRMED`, transitions ReminderTask, and writes `REMINDER_TASK / CONFIRM_REMINDER` audit in one transaction.
- Audit failure rejects the transaction and prevents partial business success.
- Reminder audit summaries record stable facts only: actor type, ReminderTask id, target type/id, receiver id, remind date/level, status transition, timestamps, and optional notification id.
- Notification audit summaries record stable facts only: notification id, related reminder task id, receiver id, channel, status, and sent timestamp.
- Audit summaries do not record Notification content, Fee amount or voucher number, Achievement title/detail/contributors/abstract, attachment storage key/checksum, credentials, environment values, raw IP, user agent, or connection strings.
- Step 8D-2 does not add HTTP routes, root `AppModule` wiring, scheduler, queue, real mail, EMAIL channel use, frontend pages, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.

## Step 8D-3 Reminder HTTP Root Reachability and Step 8 Final Boundary

- Step 8D-3 is DONE as the minimal Reminder HTTP/root reachability slice and Step 8 final closure.
- Step 8 final archive:
  - Step 8A Fee domain / repository foundation: DONE.
  - Step 8B Fee service / HTTP / root AppModule wiring / audit: DONE.
  - Step 8C Reminder rule foundation: DONE.
  - Step 8D Notification mock / reminder confirm / audit: DONE.
  - Step 8 overall: DONE.
  - Step 9 remains TODO and can only start from Step 9 pre-plan confirmation.
- `ReminderController` exposes only `POST /reminders/:id/confirm`.
- The confirm route uses explicit `UserContextGuard`, `PermissionGuard`, `@CurrentUser()`, and `@RequirePermissions(PermissionCode.reminderReadDepartment)`.
- `ParseUUIDPipe` validates the ReminderTask id at the HTTP boundary.
- The controller delegates to `ReminderService.confirmReminder(...)`; repository, Prisma, AuditService, and NotificationService remain behind service/module boundaries.
- Reminder service errors map to stable HTTP outcomes: access denied to 403, not found to 404, conflict and invalid transition to 409.
- Receiver-only confirmation remains a service-level resource boundary; the controller does not duplicate department or receiver policy logic.
- Root `AppModule` imports `RemindersModule` so the confirm route is reachable through the root API module.
- Root `AppModule` imports both `FeesModule` and `RemindersModule` after Step 8.
- Root `AppModule` does not directly import `NotificationsModule`; notification behavior remains an internal dependency of `RemindersModule`.
- Notification mock remains `IN_APP` only and does not use an EMAIL channel.
- AppModule-level tests override `ReminderService`, `PrismaService`, and `IDENTITY_ADAPTER` while preserving real guards and permission metadata.
- Step 8 final boundary remains free of Step 9 implementation, real search integration, send HTTP routes, scheduler/cron, queue, real mail, EMAIL channel use, frontend pages, real finance integration, schema changes, migrations, seed changes, package changes, lockfile changes, and real database execution.

## Step 9D-2 Dashboard Root AppModule Wiring And Step 9 Closure

- Step 9D-2 is DONE as the Dashboard root `AppModule` wiring and Step 9 final closure slice.
- Step 9D overall is DONE.
- Step 9 overall is DONE.
- Root `AppModule` now imports `DashboardModule` after `SearchModule`.
- `GET /dashboard/summary` is root reachable.
- Dashboard root tests override `DashboardService`, `PrismaService`, and `IDENTITY_ADAPTER` while preserving real `UserContextGuard`, `PermissionGuard`, route permission metadata, and controller validation.
- Root Dashboard tests cover `/health`, root `GET /dashboard/summary`, 401 without user context, 403 without `user_context:read`, 200 delegation, query transform, and invalid query 400.
- Dashboard HTTP remains the same current-user visible summary boundary from Step 9D-1 and still uses `PermissionCode.userContextRead`.
- `dashboard:read_institute` remains reserved for separately planned institute-wide Dashboard semantics.
- Step 9D-2 does not add new Dashboard endpoints, permission seed work, detail/list/drilldown/export routes, frontend pages, cache, ranking, trends, amount summaries, patent-depth metrics, institute screens, custom reports, Meilisearch, SearchLog writes, queue, scheduler, cron, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.
- Step 10 remains TODO and must start with quality gate and evidence package plan confirmation.

## Step 9D-1 Dashboard Module-Local HTTP Boundary

- Step 9D-1 is DONE as a module-local Dashboard HTTP boundary slice.
- `DashboardController` lives under `apps/api/src/dashboard` and exposes only `GET /dashboard/summary`.
- `DashboardModule` registers `DashboardController` locally and imports `IdentityModule` so `UserContextGuard` can resolve `IDENTITY_ADAPTER`.
- Root `AppModule` does not import `DashboardModule` in Step 9D-1; root reachability is deferred to Step 9D-2.
- Dashboard HTTP uses explicit route protection:
  - `UserContextGuard`.
  - `PermissionGuard`.
  - `@CurrentUser()`.
  - `@RequirePermissions(PermissionCode.userContextRead)`.
- `dashboard:read_institute` is not used for Step 9D-1 because the current endpoint represents a current-user visible summary backed by Step 9C resource-scoped service filters, not an institute-wide leadership dashboard.
- `DashboardSummaryQueryDto` accepts only:
  - `today`: optional ISO date/datetime.
  - `dueSoonDays`: optional integer from 1 through 90.
- Dashboard HTTP maps validated query values into `DashboardRequestOptions` and delegates all summary composition to `DashboardService`.
- Dashboard HTTP maps `DashboardAccessDeniedError` to 403 and leaves unknown errors to Nest's default error handling.
- Step 9D-1 tests override `DashboardService`, `PrismaService`, and `IDENTITY_ADAPTER` while preserving real guards and permission metadata.
- Dashboard HTTP output remains the Step 9C count/bucket summary shape and does not introduce business detail payloads.
- Step 9D-1 does not add root `AppModule` wiring, AppModule-level Dashboard tests, detail/list/drilldown/export routes, frontend pages, cache, ranking, trends, amount summaries, patent-depth metrics, institute screens, custom reports, Meilisearch, SearchLog writes, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.
- Step 9D-2 remains TODO and must separately handle root Dashboard reachability and Step 9 final closure.

## Step 9C-2 Dashboard Repository And Service Foundation

- Step 9C-2 is DONE as a backend-only Dashboard repository/service foundation slice.
- Step 9C overall is DONE.
- `DashboardModule` remains standalone under `apps/api/src/dashboard` and is not imported by root `AppModule`.
- `DashboardModule` now imports `DatabaseModule` and `AuthorizationModule`, provides `DashboardRepository` and `DashboardService`, and exports `DashboardService` for the later HTTP/root wiring step.
- `DashboardRepository` owns database aggregation boundaries only and accepts caller-provided policy `where` filters for Achievement and Fee metrics.
- Achievement dashboard metrics are count/bucket aggregations over `PolicyQueryFactory.achievementReadableWhere(context)`.
- Fee dashboard metrics are count/bucket/deadline aggregations over `PolicyQueryFactory.feeReadableWhere(context)` plus the active-record condition.
- WorkflowTask and ReminderTask dashboard metrics are scoped to the current user id in Step 9C-2; institute or department-wide dashboard scopes are deferred.
- `DashboardService` validates the user context, constructs policy filters, normalizes UTC date-only due-soon windows, calls repository aggregation methods, and maps results into the Step 9C-1 `DashboardSummary` contract.
- Dashboard output remains count/bucket only and does not return Achievement titles, identifiers, detail payloads, abstracts, contributors, Fee amounts, voucher numbers, WorkflowAction comments, Notification content, Attachment storage facts, Audit raw values, credentials, environment values, or connection strings.
- Step 9C-2 does not add Dashboard HTTP routes, controller decorators, root `AppModule` wiring, frontend pages, cache, ranking, trends, amount summaries, patent-depth metrics, institute screens, custom reports, Meilisearch, SearchLog writes, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.
- Step 9D remains TODO and must start with Dashboard HTTP/root wiring and Step 9 closure plan confirmation.

## Step 9C-1 Dashboard Domain Contract

- Step 9C-1 is DONE as a Dashboard domain / metric contract slice.
- `DashboardModule` exists under `apps/api/src/dashboard` and is not imported by root `AppModule`.
- `DashboardModule` has no controllers, providers, Prisma dependency, repository, or service aggregation in Step 9C-1.
- Dashboard metric contracts are count/bucket based only.
- Minimum Step 9C Dashboard metric contracts:
  - Achievement total count.
  - Achievement type distribution.
  - Achievement status distribution.
  - Fee pay-status distribution.
  - Fee overdue and due-soon overview.
  - Current-user WorkflowTask status overview.
  - Current-user ReminderTask status overview.
- Dashboard request options support fixed `today` and `dueSoonDays`.
- `dueSoonDays` defaults to 30 and is constrained to an integer range of 1 through 90.
- Dashboard contract result shapes do not include Achievement business details, Fee financial fields, Workflow action comments, Notification content, Attachment storage facts, Audit raw values, credentials, environment values, or connection strings.
- Step 9C-1 does not add DashboardRepository, DashboardService aggregation, Prisma queries, groupBy/count/aggregate calls, HTTP routes, root `AppModule` wiring, frontend, cache, department rankings, trends, amount summaries, patent depth metrics, institute screens, custom reports, Meilisearch, SearchLog writes, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.
- At Step 9C-1 closure, Step 9C-2 was deferred to a separate Dashboard repository/service foundation confirmation; current Step 9C-2 completion is recorded above.

## Step 9B-2 Search Root AppModule Wiring

- Step 9B-2 is DONE as the Search root reachability slice.
- Root `AppModule` explicitly imports `SearchModule`.
- Search routes are reachable through the root API module:
  - `GET /search`.
- `/health` remains available after Search root integration.
- Search HTTP routes continue to use explicit controller-level `UserContextGuard` and `PermissionGuard`; no global `APP_GUARD`, global pipe, or global guard is registered.
- `main.ts` remains unchanged.
- AppModule-level Search tests override `SearchService`, `PrismaService`, and `IDENTITY_ADAPTER` while preserving real guards and permission metadata.
- Root tests avoid real SearchRepository, DatabaseSearchAdapter, Prisma, dev identity database lookup, SearchLog writes, and external search execution.
- Step 9B is DONE for Search HTTP boundary and root route reachability.
- Step 9B does not include `search:read`, SearchLog writes, Meilisearch, index sync, scheduler, cron, queue, Dashboard, frontend pages, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.
- Step 9C remains TODO and must start with Dashboard foundation plan confirmation.

## Step 9B-1 Search Module-Local HTTP Boundary

- Step 9B-1 is DONE as a module-local Search HTTP boundary slice.
- `SearchController` lives under `apps/api/src/search` and exposes only `GET /search`.
- `SearchModule` registers `SearchController` locally and imports `IdentityModule` so `UserContextGuard` can resolve `IDENTITY_ADAPTER`.
- Root `AppModule` does not import `SearchModule` in Step 9B-1; root reachability is deferred to Step 9B-2.
- Search HTTP uses explicit route protection:
  - `UserContextGuard`.
  - `PermissionGuard`.
  - `@CurrentUser()`.
  - `@RequirePermissions(PermissionCode.userContextRead)`.
- Static HTTP permission is `user_context:read`; no `search:read` permission or seed change is introduced in Step 9B-1.
- Resource-level visibility remains inside `SearchService`:
  - Achievement search uses Step 4 policy where filters.
  - Fee search uses Step 4 policy where filters.
  - Restricted Achievement details remain redacted unless effective `SECRET_READ` is present.
- The HTTP response keeps the Step 9A safe shape:
  - Restricted Achievement title and identifiers are omitted.
  - Achievement contributors, abstract, and full detail payloads are not returned.
  - Fee amount and voucher number are not returned.
- `SearchQueryDto` performs local validation and normalizes single-value `targetTypes` query input to an array before enum validation.
- Step 9B-1 does not write `SearchLog`.
- Step 9B-1 does not add Meilisearch, index sync, scheduler, cron, queue, Dashboard, frontend pages, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.

## Step 9A Search Foundation

- Step 9A is DONE as a backend-only Search foundation slice.
- `SearchModule` exists under `apps/api/src/search` and is not imported by root `AppModule`.
- Step 9A adds no Search HTTP controller and no route decorators.
- `SearchAdapter` is the search boundary; `DatabaseSearchAdapter` is the first implementation and delegates to `SearchRepository`.
- `SearchRepository` performs policy-scoped database reads only:
  - Achievement search requires caller-provided `PolicyQueryFactory.achievementReadableWhere(...)` output.
  - Fee search requires caller-provided `PolicyQueryFactory.feeReadableWhere(...)` output and filters active Fee records.
  - Fee keyword matching is limited to UUID keywords for Fee id or Achievement id.
- `SearchService` builds policy where filters from Step 4 before calling the adapter.
- Restricted Achievement results pass through `SecretAccessPolicyService.canReadResource(...)`.
- Restricted Achievements without effective `SECRET_READ` return redacted search items: stable ids, target type, status/scope facts, secret level, and timestamps only; title and identifiers are omitted.
- Achievement search selects title and narrow identifiers only for mapping and redaction; it does not select contributors, paper abstract, full typed detail payloads, attachments, audit data, workflow comments, or notification content.
- Fee search result shape excludes amount and voucher number.
- Step 9A does not write `SearchLog`.
- Step 9A does not add Meilisearch, index sync, scheduler, cron, queue, Dashboard, frontend pages, schema changes, migrations, seed changes, package changes, lockfile changes, or real database execution.
