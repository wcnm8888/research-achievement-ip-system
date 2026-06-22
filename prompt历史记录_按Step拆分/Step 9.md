# 9、Step9

## Step 9A

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备执行 Step 9A。

本次只做 Step 9A - Search foundation：
数据库检索 + SearchAdapter boundary + repository/service/DTO/fake tests。
不做 HTTP route，不做 root AppModule wiring，不接 Meilisearch，不做 Dashboard，不做前端。

前置确认：
- Step 8 overall: DONE。
- Step 9 status: TODO。
- Step 9 已确认拆分为：
  - 9A Search foundation
  - 9B Search HTTP/root wiring
  - 9C Dashboard foundation
  - 9D Dashboard HTTP/root wiring + Step 9 closure
- Search 第一版只做数据库检索 + SearchAdapter boundary。
- 本次不接真实 Meilisearch。

请先只读必要上下文：
- E:\Vibe coding\AGENTS.md
  - 只读安全规则、上下文读取最小化规则、完成定义。
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
  - 只读顶部 Step 8 final closure / Step 9 状态，以及 Step 9 原始条目。
- E:\研究院科研成果管理系统\memory-bank\architecture.md
  - 只读 Step 8 final boundary、Search、RBAC、Achievement、Fee 相关段落。
- E:\研究院科研成果管理系统\memory-bank\decisions.md
  - 只读最新 Step 8 closure，以及 Step 4 RBAC / secret access / search 相关决策。
- E:\研究院科研成果管理系统\prisma\schema.prisma
  - 只定位读取 Achievement、PaperDetail、PatentDetail、SoftwareCopyrightDetail、FeeRecord、Department、User、SearchLog 相关 model。
- 必要代码：
  - apps/api/src/authorization/**
  - apps/api/src/achievements/**
  - apps/api/src/fees/**
  - apps/api/src/database/**

本次实现范围：
1. 新增 Search 模块基础结构。
2. 设计 SearchAdapter interface / DatabaseSearchAdapter 边界。
3. 实现最小搜索 DTO 和返回类型。
4. 实现基于 Prisma 的数据库检索 repository/service，但测试必须使用 fake Prisma/provider，不访问真实数据库。
5. 搜索必须复用 Step 4 RBAC / department scope / secret access policy。
6. Achievement 搜索必须基于 `PolicyQueryFactory.achievementReadableWhere(context)`。
7. Fee 搜索如纳入第一版，只能使用 `PolicyQueryFactory.feeReadableWhere(context)` 或明确的 fee scope。
8. 涉密 Achievement：无 SECRET_READ grant 时不得返回业务详情字段。
9. 不写 SearchLog；如果发现必须写日志，先暂停说明原因，等我确认。
10. 更新必要 memory-bank：implementation-plan.md、progress.md、evidence.md；如有新决策再更新 decisions.md / architecture.md。

明确不做：
- 不做 Search HTTP controller。
- 不做 root AppModule wiring。
- 不接 Meilisearch。
- 不做索引同步。
- 不做 queue / scheduler / cron。
- 不做 Dashboard。
- 不做前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不删除文件，不执行破坏性命令。

敏感字段边界：
不得返回或写入日志：
- .env / DATABASE_URL / Token / Cookie / 密钥 / 密码 hash / 完整连接串
- Achievement 完整 detail、abstract、contributors
- Fee amount、voucherNo
- Attachment object key / storage key / checksum / content
- AuditLog oldValue / newValue / raw IP / full user agent
- WorkflowAction comment
- Notification content

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

并做边界扫描：
- rg -n "Meilisearch|meilisearch|SMTP|Bull|Queue|scheduler|cron|EMAIL|DATABASE_URL|migrate|seed" apps/api/src/search apps/api/src
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/search
- rg -n "@Delete|deleteMany|delete\(" apps/api/src/search
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src

最后汇报：
1. 修改了哪些文件。
2. Search foundation 做了什么。
3. 明确哪些边界没有进入。
4. 测试和扫描结果。
5. 是否可以进入 Step 9B 计划确认。
~~~

## Step 9B

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 9B。

本次只做 Step 9B 前计划确认：
Search HTTP boundary / root AppModule wiring 计划确认。
先不要修改文件，不要写代码，不要进入实现。

前置状态：
- Step 8 overall: DONE。
- Step 9 已拆分为：
  - 9A Search foundation
  - 9B Search HTTP boundary / root AppModule wiring
  - 9C Dashboard foundation
  - 9D Dashboard HTTP/root wiring + Step 9 closure
- Step 9A 已完成。
- Step 9A 严格停在 Search foundation，没有进入 HTTP/root wiring 或真实搜索服务。

Step 9A 已完成事实：
- 新增 standalone SearchModule，未接入 root AppModule。
- 新增 SearchAdapter token 和 DatabaseSearchAdapter。
- 新增 SearchRepository。
- Achievement 搜索使用 caller-provided achievementReadableWhere。
- Fee 搜索使用 caller-provided feeReadableWhere。
- SearchService 复用 Step 4 RBAC / department scope / secret access policy。
- 涉密 Achievement 无有效 SECRET_READ 时只返回稳定事实，title 和 identifiers 会被 redacted。
- Fee 搜索结果不返回 amount / voucherNo。
- 未写 SearchLog。
- 未新增 Search HTTP controller。
- 未做 root AppModule wiring。
- 未接 Meilisearch。
- 未做索引同步、queue、scheduler、cron、Dashboard、前端。
- 未访问真实数据库。
- 未运行 migrate / seed。
- 未修改 schema / migration / seed / package / lockfile。

Step 9A 修改文件概况：
- 新增 apps/api/src/search 下 Search 模块基础文件：
  - search.module.ts
  - search.repository.ts
  - search.service.ts
  - dto/search-query.dto.ts
  - domain/*
  - adapters/*
  - 对应 fake tests
- 更新 memory-bank：
  - memory-bank/implementation-plan.md
  - memory-bank/progress.md
  - memory-bank/evidence.md
  - memory-bank/architecture.md
  - memory-bank/decisions.md

Step 9A 验证：
- corepack pnpm --filter @research-ip/api test: passed, 43 files / 388 tests
- corepack pnpm --filter @research-ip/api typecheck: passed
- corepack pnpm lint: passed
- 边界扫描通过：
  - 无 Meilisearch / 队列 / 调度 / EMAIL / DB env / migrate / seed
  - 无 search route decorators
  - 无 delete / deleteMany
  - 无 global guard / global pipes
- git status 不可用，因为项目目录不是 git repository。

本次上下文读取规则：
- 只精确读取与 Step 9B 计划确认直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9A closure / Step 9B 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9A archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9A evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9A Search foundation、Search boundary、RBAC / secret access、root AppModule wiring 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9A 决策，以及 Search HTTP permission / RBAC / secret access / root wiring 相关决策。
   - 不展开全部历史决策。

7. 必要代码：
   - apps/api/src/search
   - apps/api/src/authorization
   - apps/api/src/app.module.ts
   - 如需参考 HTTP/root wiring pattern，只读 Fees / Reminders 的 controller 和 app-module spec 小范围。

Step 9B 计划确认重点：
1. Step 9B 是否需要拆成：
   - 9B-1 Search module-local HTTP boundary
   - 9B-2 Search root AppModule wiring
2. Search HTTP route 应该暴露哪些 endpoint。
3. Search HTTP 的静态权限策略如何定：
   - 目前已有 `dashboard:read_institute`，但没有 `search:read`。
   - 是否复用 Achievement/Fee read 权限。
   - 是否需要新增 `search:read` 权限主数据。
   - 如果新增权限，是否必须另起 schema/seed/permission plan。
4. Controller 应如何复用：
   - UserContextGuard
   - PermissionGuard
   - @CurrentUser()
   - @RequirePermissions()
   - local ValidationPipe
   - service error mapping
5. Search HTTP response 是否继续保持 Step 9A 的脱敏边界：
   - 涉密 Achievement 无 SECRET_READ 不返回 title / identifiers。
   - Fee 不返回 amount / voucherNo。
   - 不返回 Achievement 完整 detail / abstract / contributors。
6. 是否写 SearchLog：
   - 默认不写。
   - 如果建议写，请说明风险和脱敏策略，等待我确认。
7. 是否接入 root AppModule：
   - 若需要，如何单独拆到 9B-2。
   - root wiring 测试如何使用 provider override，避免真实数据库和真实 SearchRepository 执行。
8. 是否需要 schema / migration / seed / package / lockfile / 真实数据库 / Meilisearch。
9. 测试矩阵和边界扫描命令。
10. 需要我确认的问题。

要求：
- 只做计划确认。
- 不修改文件。
- 不写代码。
- 不进入 Step 9B 实现。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接 Meilisearch 或其他外部搜索服务。
- 不生成大批量测试数据。
- 不实现 Dashboard。
- 不实现前端页面。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

请输出：
1. Step 9B 的任务等级和风险判断。
2. Step 9B 是否拆成 9B-1 / 9B-2。
3. Step 9B 精确范围：做什么 / 不做什么。
4. Search HTTP endpoint 建议。
5. Search HTTP 权限策略建议。
6. Controller / module-local test 设计。
7. Root AppModule wiring / AppModule-level test 设计。
8. SearchLog 是否进入本步。
9. 是否需要 schema / seed / package / lockfile / 真实数据库 / Meilisearch。
10. 验证命令和边界扫描。
11. 需要我确认的问题。
~~~

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备执行 Step 9B-1。

本次只做 Step 9B-1 - Search module-local HTTP boundary。
只在 SearchModule 内新增 SearchController 和 module-local HTTP tests。
不做 root AppModule wiring，不进入 9B-2。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B 前计划确认已完成。
- Step 9B 已确认拆成：
  - 9B-1 Search module-local HTTP boundary
  - 9B-2 Search root AppModule wiring
- Search 第一版只做数据库检索 + SearchAdapter boundary。
- 本次不接 Meilisearch，不写 SearchLog，不新增 search:read 权限，不改 seed。

Step 9A 已完成事实：
- 已新增 standalone SearchModule，未接入 root AppModule。
- 已新增 SearchAdapter token 和 DatabaseSearchAdapter。
- 已新增 SearchRepository / SearchService / SearchQueryDto / domain types / fake tests。
- Achievement 搜索使用 caller-provided achievementReadableWhere。
- Fee 搜索使用 caller-provided feeReadableWhere。
- SearchService 复用 Step 4 RBAC / department scope / secret access policy。
- 涉密 Achievement 无有效 SECRET_READ 时只返回稳定事实，title 和 identifiers 会被 redacted。
- Fee 搜索结果不返回 amount / voucherNo。
- 未写 SearchLog。
- 未新增 Search HTTP controller。
- 未做 root AppModule wiring。
- 未接 Meilisearch。
- 未访问真实数据库、未运行 migrate/seed、未修改 schema/migration/seed/package/lockfile。

Step 9B-1 已确认设计：
- 只暴露一个 module-local endpoint：GET /search。
- Query 使用 Step 9A 现有 SearchQueryDto：
  - keyword
  - targetTypes
  - achievementType
  - achievementStatus
  - feeType
  - payStatus
  - departmentId
  - take
- 静态权限使用 `user_context:read`。
- 资源可见性继续由 SearchService 内部复用 Step 4 policy 控制。
- 多资源搜索不在 PermissionGuard 层要求 achievement/fee read，因为 PermissionGuard 多权限是 AND，不适合 Search 的 OR 资源语义。
- 有 user_context:read 但没有 Achievement/Fee 读取权限时，返回 200 + 空结果或仅有权限资源。
- 不新增详情路由、suggest/autocomplete、search history、advanced search POST。
- 不写 SearchLog。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9A closure / Step 9B 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9A archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9A evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9A Search foundation、Search boundary、RBAC / secret access、HTTP boundary 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9A 决策，以及 Search HTTP permission / RBAC / secret access 相关决策。

7. 必要代码：
   - apps/api/src/search/**
   - apps/api/src/authorization/**
   - 如需参考 HTTP pattern，只读 Fees / Reminders controller 和 controller spec 小范围。

本次实现范围：
1. 新增 `apps/api/src/search/search.controller.ts`。
2. 在 `SearchModule` 内注册 SearchController。
3. 新增 module-local HTTP tests，例如 `search.controller.spec.ts`。
4. Controller 使用：
   - `@Controller("search")`
   - `@UseGuards(UserContextGuard, PermissionGuard)`
   - local `ValidationPipe`
   - `@Get()`
   - `@RequirePermissions(PermissionCode.userContextRead)`
   - `@CurrentUser()`
   - `@Query(searchQueryValidationPipe)`
   - delegate to `SearchService.search(currentUser, query)`
5. Error mapping：
   - `SearchAccessDeniedError` -> 403
   - DTO / pipe validation -> 400
   - 未知错误不吞，交给 Nest 默认处理。
6. Tests 覆盖：
   - 401 without user context。
   - 403 without `user_context:read`。
   - 200 delegates to `SearchService.search(currentUser, query)`。
   - invalid enum / invalid UUID / take > 50 -> 400。
   - response preserves Step 9A redacted result shape。
7. 更新必要 memory-bank：
   - implementation-plan.md
   - progress.md
   - evidence.md
   - 如有新决策或架构边界，再更新 decisions.md / architecture.md。

明确不做：
- 不做 root AppModule wiring。
- 不修改 apps/api/src/app.module.ts。
- 不接 Meilisearch。
- 不写 SearchLog。
- 不新增 search:read 权限。
- 不修改 seed。
- 不做 Dashboard。
- 不做前端。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、package、lockfile。
- 不新增 queue / scheduler / cron。
- 不新增 POST / PATCH / DELETE route。
- 不执行删除、重置、清空、批量清理等破坏性操作。

敏感字段边界：
不得返回或写入日志：
- .env / DATABASE_URL / Token / Cookie / 密钥 / 密码 hash / 完整连接串
- Achievement 完整 detail、abstract、contributors
- Fee amount、voucherNo
- Attachment object key / storage key / checksum / content
- AuditLog oldValue / newValue / raw IP / full user agent
- WorkflowAction comment
- Notification content
- 完整 Search query 日志

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

边界扫描：
- rg -n "Meilisearch|meilisearch|SMTP|Bull|Queue|scheduler|cron|EMAIL|DATABASE_URL|migrate|seed" apps/api/src/search apps/api/src
- rg -n "@Post|@Patch|@Delete" apps/api/src/search
- rg -n "@Delete|deleteMany|delete\(" apps/api/src/search
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "SearchModule" apps/api/src/app.module.ts

9B-1 边界要求：
- `SearchModule` 不应出现在 root `app.module.ts`。
- `apps/api/src/search` 里只允许 `@Get` 搜索入口，不允许 POST/PATCH/DELETE。
- 不应出现 Meilisearch、SearchLog 写入、queue/scheduler/cron、migrate/seed。

最后汇报：
1. 修改了哪些文件。
2. Search HTTP module-local boundary 做了什么。
3. 明确哪些边界没有进入。
4. 测试和边界扫描结果。
5. 是否可以进入 Step 9B-2 计划确认。
~~~

Step 9B-2

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 9B-2。

本次只做 Step 9B-2 前计划确认：
Search root AppModule wiring / AppModule-level tests 计划确认。
先不要修改文件，不要写代码，不要进入实现。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B-1 Search module-local HTTP boundary: DONE。
- Step 9B 已拆分为：
  - 9B-1 Search module-local HTTP boundary
  - 9B-2 Search root AppModule wiring
- 本次只能计划确认 9B-2，不能直接实现。

Step 9A 已完成事实：
- 已新增 standalone SearchModule，未接入 root AppModule。
- 已新增 SearchAdapter token 和 DatabaseSearchAdapter。
- 已新增 SearchRepository / SearchService / SearchQueryDto / domain types / fake tests。
- Achievement 搜索使用 caller-provided achievementReadableWhere。
- Fee 搜索使用 caller-provided feeReadableWhere。
- SearchService 复用 Step 4 RBAC / department scope / secret access policy。
- 涉密 Achievement 无有效 SECRET_READ 时只返回稳定事实，title 和 identifiers 会被 redacted。
- Fee 搜索结果不返回 amount / voucherNo。
- 未写 SearchLog。
- 未接 Meilisearch。
- 未访问真实数据库、未运行 migrate/seed、未修改 schema/migration/seed/package/lockfile。

Step 9B-1 已完成事实：
- 新增 module-local SearchController，只暴露 GET /search。
- 使用 UserContextGuard、PermissionGuard、@CurrentUser()、@RequirePermissions(PermissionCode.userContextRead)。
- SearchModule 本地注册 controller，并引入 IdentityModule 供 guard 解析 IDENTITY_ADAPTER。
- HTTP 层只做入口、校验、错误映射。
- RBAC / department scope / secret redaction 仍由 Step 9A SearchService 负责。
- DTO 增加单值 targetTypes query 归一化，保证 HTTP 查询能通过数组枚举校验。
- 新增 module-local HTTP tests：
  - 401
  - 403
  - 200 delegation
  - 400 invalid query
  - 脱敏 shape
  - service access denied -> 403
  - identity adapter context
- 未修改 root AppModule。
- 未做 AppModule-level Search route test。
- 未新增 search:read。
- 未写 SearchLog。
- 未接 Meilisearch / queue / scheduler / cron / Dashboard / frontend。
- 未修改 schema / migration / seed / package / lockfile。
- 未访问真实数据库，未运行 migrate / seed。

Step 9B-1 验证：
- corepack pnpm --filter @research-ip/api test: passed, 44 files / 395 tests。
- corepack pnpm --filter @research-ip/api typecheck: passed。
- corepack pnpm lint: passed。
- 边界扫描通过：
  - 外部搜索 / 队列 / 调度 / EMAIL / DB env / migrate / seed：无匹配。
  - apps/api/src/search 中 @Post / @Patch / @Delete：无匹配。
  - apps/api/src/search 中 delete / deleteMany：无匹配。
  - global guard / pipe wiring：无匹配。
  - root app.module.ts 中 SearchModule：无匹配。
- 项目目录 .git 不存在，所以没有可用 git status。

本次上下文读取规则：
- 只精确读取与 Step 9B-2 计划确认直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9B-1 closure / Step 9B-2 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9B-1 archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9B-1 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9B-1 Search HTTP boundary、Search root wiring、RBAC / secret access 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9B-1 决策，以及 Search root wiring / RBAC / secret access 相关决策。

7. 必要代码：
   - apps/api/src/search/**
   - apps/api/src/app.module.ts
   - 如需参考 root wiring pattern，只读 Fees / Reminders 的 app-module spec 小范围。

Step 9B-2 计划确认重点：
1. root AppModule 是否只做显式 import SearchModule。
2. 是否新增 Search AppModule-level HTTP test，例如 search.app-module.spec.ts。
3. AppModule-level tests 如何 override：
   - SearchService，避免真实 SearchRepository / Prisma / adapter 执行。
   - PrismaService 为 {}。
   - IDENTITY_ADAPTER，避免 dev identity 查真实库。
4. 是否保留真实 UserContextGuard / PermissionGuard / decorator metadata。
5. root tests 应覆盖：
   - /health 仍可用。
   - GET /search root reachable。
   - 401 without user context。
   - 403 without user_context:read。
   - 200 delegates to SearchService.search(currentUser, query)。
   - invalid query -> 400。
6. 是否继续不写 SearchLog、不接 Meilisearch、不新增 search:read。
7. 是否需要 schema / migration / seed / package / lockfile / 真实数据库。
8. 9B-2 完成后是否标记 Step 9B DONE，并明确 Step 9C 仍为 TODO，只能从 Dashboard foundation 计划确认开始。
9. 验证命令和边界扫描。
10. 需要我确认的问题。

要求：
- 只做计划确认。
- 不修改文件。
- 不写代码。
- 不进入 Step 9B-2 实现。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接 Meilisearch 或其他外部搜索服务。
- 不写 SearchLog。
- 不新增 search:read。
- 不生成大批量测试数据。
- 不实现 Dashboard。
- 不实现前端页面。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

请输出：
1. Step 9B-2 的任务等级和风险判断。
2. Step 9B-2 精确范围：做什么 / 不做什么。
3. root AppModule wiring 设计。
4. AppModule-level test 设计。
5. provider override 策略。
6. 是否标记 Step 9B DONE，以及 Step 9C 边界。
7. 是否需要 schema / seed / package / lockfile / 真实数据库 / Meilisearch / SearchLog。
8. 验证命令和边界扫描。
9. 需要我确认的问题。
~~~

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备执行 Step 9B-2。

本次只做 Step 9B-2 - Search root AppModule wiring。
范围仅限：
- root AppModule 显式 import SearchModule。
- 新增 Search AppModule-level HTTP tests。
- 更新 memory-bank，将 9B-2 标记 DONE，并在验证通过后标记 Step 9B overall DONE、Step 9C TODO。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B-1 Search module-local HTTP boundary: DONE。
- Step 9B-2 前计划确认已完成。
- Step 9B 拆分为：
  - 9B-1 Search module-local HTTP boundary
  - 9B-2 Search root AppModule wiring
- 本次执行 9B-2，不进入 Step 9C。

Step 9B-1 已完成事实：
- 新增 module-local SearchController，只暴露 GET /search。
- 使用 UserContextGuard、PermissionGuard、@CurrentUser()、@RequirePermissions(PermissionCode.userContextRead)。
- SearchModule 本地注册 controller，并引入 IdentityModule 供 guard 解析 IDENTITY_ADAPTER。
- HTTP 层只做入口、校验、错误映射。
- RBAC / department scope / secret redaction 仍由 Step 9A SearchService 负责。
- DTO 增加单值 targetTypes query 归一化。
- 未修改 root AppModule。
- 未做 AppModule-level Search route test。
- 未新增 search:read。
- 未写 SearchLog。
- 未接 Meilisearch / queue / scheduler / cron / Dashboard / frontend。
- 未修改 schema / migration / seed / package / lockfile。
- 未访问真实数据库，未运行 migrate / seed。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9B-1 closure / Step 9B-2 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9B-1 archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9B-1 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9B-1 Search HTTP boundary、Search root wiring、RBAC / secret access 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9B-1 决策，以及 Search root wiring 相关决策。

7. 必要代码：
   - apps/api/src/search/**
   - apps/api/src/app.module.ts
   - 如需参考 root wiring pattern，只读 Fees / Reminders app-module spec 小范围。

本次实现范围：
1. 修改 apps/api/src/app.module.ts：
   - import SearchModule。
   - 在 imports 数组中显式加入 SearchModule。
   - 建议放在 RemindersModule 后面，保持 Step 9 feature 顺序清晰。
2. 新增 apps/api/src/search/search.app-module.spec.ts。
3. AppModule-level tests 参考 Fee/Reminder root wiring 模式。
4. Tests 必须覆盖：
   - /health 仍返回 OK。
   - GET /search root reachable，带 user_context:read 时返回 200。
   - without user context 返回 401。
   - without user_context:read 返回 403。
   - 200 时调用 SearchService.search(currentUser, query)。
   - query validation / transform 生效，例如 take: "5" -> 5，targetTypes 单值归一化。
   - invalid query 返回 400，例如 invalid enum / invalid UUID / take=51，选 1-3 类覆盖。
5. Provider override 策略：
   - override SearchService，避免真实 SearchRepository / DatabaseSearchAdapter / Prisma 查询。
   - override PrismaService 为 {}，阻断真实数据库访问。
   - override IDENTITY_ADAPTER，避免 dev identity adapter 查库。
   - 保留真实 UserContextGuard / PermissionGuard / decorator metadata。
   - 不 override UserContextGuard / PermissionGuard。
6. 更新 memory-bank：
   - implementation-plan.md
   - progress.md
   - evidence.md
   - architecture.md
   - decisions.md 如有必要
7. 完成后标记：
   - Step 9B-2: DONE。
   - Step 9B overall: DONE。
   - Step 9C: TODO。
   - Step 9C 只能从 Dashboard foundation 计划确认开始。

明确不做：
- 不新增 endpoint。
- 不改 SearchController 行为，除非测试发现 9B-2 必须修正且属于 root wiring 必需。
- 不新增 search:read。
- 不写 SearchLog。
- 不接 Meilisearch。
- 不做索引同步。
- 不做 queue / scheduler / cron。
- 不做 Dashboard。
- 不做前端。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

敏感字段边界：
不得返回或写入日志：
- .env / DATABASE_URL / Token / Cookie / 密钥 / 密码 hash / 完整连接串
- Achievement 完整 detail、abstract、contributors
- Fee amount、voucherNo
- Attachment object key / storage key / checksum / content
- AuditLog oldValue / newValue / raw IP / full user agent
- WorkflowAction comment
- Notification content
- 完整 Search query 日志

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

边界扫描：
- rg -n "Meilisearch|meilisearch|SMTP|Bull|Queue|scheduler|cron|EMAIL|DATABASE_URL|migrate|seed|SearchLog" apps/api/src/search apps/api/src
- rg -n "@Post|@Patch|@Delete" apps/api/src/search
- rg -n "@Delete|deleteMany|delete\(" apps/api/src/search
- rg -n "APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src
- rg -n "SearchModule" apps/api/src/app.module.ts

9B-2 边界要求：
- `SearchModule` 在 app.module.ts 中应只出现 import 和 imports 注册。
- `apps/api/src/search` 里仍只允许 GET 搜索入口，不允许 POST/PATCH/DELETE。
- 不应出现 Meilisearch、SearchLog 写入、queue/scheduler/cron、migrate/seed。
- Step 9C 不得开始实现。

最后汇报：
1. 修改了哪些文件。
2. Search root AppModule wiring 做了什么。
3. 明确哪些边界没有进入。
4. 测试和边界扫描结果。
5. Step 9B 是否已 DONE。
6. 是否可以进入 Step 9C 前计划确认。
~~~

## Step 9C

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 9C。

本次只做 Step 9C 前计划确认：
Dashboard foundation 计划确认。
先不要修改文件，不要写代码，不要进入实现。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B Search HTTP/root wiring: DONE。
- Step 9B-1 Search module-local HTTP boundary: DONE。
- Step 9B-2 Search root AppModule wiring: DONE。
- Step 9C status: TODO。
- 本次只能做 Step 9C 前计划确认，不能直接实现 Dashboard。

Step 9A 已完成事实：
- 已新增 standalone SearchModule。
- 已新增 SearchAdapter token 和 DatabaseSearchAdapter。
- 已新增 SearchRepository / SearchService / SearchQueryDto / domain types / fake tests。
- Achievement 搜索使用 caller-provided achievementReadableWhere。
- Fee 搜索使用 caller-provided feeReadableWhere。
- SearchService 复用 Step 4 RBAC / department scope / secret access policy。
- 涉密 Achievement 无有效 SECRET_READ 时只返回稳定事实，title 和 identifiers 会被 redacted。
- Fee 搜索结果不返回 amount / voucherNo。
- 未写 SearchLog。
- 未接 Meilisearch。
- 未访问真实数据库、未运行 migrate/seed、未修改 schema/migration/seed/package/lockfile。

Step 9B 已完成事实：
- 新增 module-local SearchController，只暴露 GET /search。
- root AppModule 显式 import 并注册 SearchModule。
- Search HTTP 使用 UserContextGuard、PermissionGuard、@CurrentUser()、@RequirePermissions(PermissionCode.userContextRead)。
- Search HTTP 层只做入口、校验、错误映射。
- RBAC / department scope / secret redaction 仍由 SearchService 负责。
- Search AppModule-level tests 覆盖 /health、GET /search 200、401、403、query transform、invalid query 400。
- root tests override SearchService、PrismaService、IDENTITY_ADAPTER，避免真实 repository / adapter / Prisma / dev identity DB 查询。
- 未新增 search:read。
- 未写 SearchLog。
- 未接 Meilisearch / queue / scheduler / cron。
- 未做 Dashboard / frontend。
- 未修改 schema / migration / seed / package / lockfile。
- 未访问真实数据库，未运行 migrate / seed。

Step 9B 验证：
- corepack pnpm --filter @research-ip/api test: passed, 45 files / 400 tests。
- corepack pnpm --filter @research-ip/api typecheck: passed。
- corepack pnpm lint: passed。
- 边界扫描通过：
  - 外部搜索 / 队列 / 调度 / EMAIL / DB env / migrate / seed / SearchLog：无匹配。
  - apps/api/src/search 中 @Post / @Patch / @Delete：无匹配。
  - apps/api/src/search 中 delete / deleteMany：无匹配。
  - global guard / global pipe wiring：无匹配。
  - SearchModule 在 root app.module.ts 中只出现 import 和 imports 注册。
- 项目目录不是 git repository，.git 不存在，所以没有可用 git status。

本次上下文读取规则：
- 只精确读取与 Step 9C 计划确认直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9B closure / Step 9C 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9B archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9B evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9A/9B Search boundary、Dashboard、RBAC / department scope / secret access、Achievement / Fee / Reminder / Workflow 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9B 决策，以及 Dashboard / RBAC / secret access / statistics 相关决策。
   - 不展开全部历史决策。

7. E:\研究院科研成果管理系统\prisma\schema.prisma
   - 只定位读取与 Dashboard foundation 直接相关的 model / enum / index：
     - Achievement
     - FeeRecord
     - ReminderTask
     - WorkflowTask
     - WorkflowInstance
     - Department
     - User
   - 不读取或展示连接串。

8. 必要代码：
   - apps/api/src/authorization/**
   - apps/api/src/achievements/**
   - apps/api/src/fees/**
   - apps/api/src/reminders/**
   - apps/api/src/workflow/**
   - apps/api/src/database/**
   - 如需参考 foundation pattern，可只读 Search 9A repository/service/fake tests 小范围。

Step 9C 计划确认重点：
1. Step 9C 是否只做 Dashboard foundation：
   - DashboardModule
   - DashboardRepository
   - DashboardService
   - domain types / DTO / result types
   - fake Prisma/provider tests
   - 不做 HTTP route
   - 不做 root AppModule wiring
2. 是否需要再拆成：
   - 9C-1 Dashboard domain / metric contract
   - 9C-2 Dashboard repository/service foundation
   还是 9C 一步完成 foundation。
3. 最小指标范围：
   - Achievement 总数
   - Achievement type 分布
   - Achievement status 分布
   - Fee payStatus 分布
   - Fee overdue / due soon 概览
   - 当前用户 WorkflowTask 待办概览
   - 当前用户 ReminderTask 状态概览
4. 哪些指标第一版不做：
   - 部门排行
   - 年度趋势
   - 金额汇总
   - 专利深度指标
   - 全院大屏
   - 自定义报表
   - 缓存
5. Dashboard 权限策略：
   - 是否使用现有 `dashboard:read_institute`。
   - 是否同时复用 Step 4 PolicyQueryFactory 的 Achievement/Fee where。
   - 是否允许无 dashboard:read_institute 但有 achievement/fee/reminder/workflow 权限的用户看到个人/部门局部指标。
   - 或者 Step 9C 暂时不做 HTTP，因此 service 内只设计 context-aware scope，不确定 HTTP 静态权限留到 Step 9D。
6. Dashboard 如何避免统计侧信道：
   - 不返回涉密业务详情。
   - restricted Achievement 只参与当前用户已授权可见范围内的 count。
   - 不返回 title / identifiers / abstract / contributors。
   - 不返回 Fee amount / voucherNo。
   - Workflow 只统计当前 assignee 或授权范围，不返回 comment。
   - Reminder 只统计当前 receiver 或授权范围。
7. 是否需要 schema / migration / seed / package / lockfile / 真实数据库。
8. fake Prisma / provider override 测试矩阵。
9. 验证命令和边界扫描。
10. 需要我确认的问题。

要求：
- 只做计划确认。
- 不修改文件。
- 不写代码。
- 不进入 Step 9C 实现。
- 不做 Dashboard HTTP route。
- 不做 root AppModule wiring。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接 Meilisearch 或其他外部服务。
- 不写 SearchLog。
- 不生成大批量测试数据。
- 不实现前端页面。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

请输出：
1. Step 9C 的任务等级和风险判断。
2. Step 9C 是否需要拆成 9C-1 / 9C-2。
3. Step 9C 精确范围：做什么 / 不做什么。
4. Dashboard 最小指标范围建议。
5. Dashboard 权限策略建议。
6. Achievement / Fee / Reminder / Workflow 数据如何参与统计。
7. 如何避免统计侧信道和敏感字段泄露。
8. 是否需要 HTTP route / root AppModule wiring；如不需要，写清留到 Step 9D。
9. 是否需要 schema / seed / package / lockfile / 真实数据库。
10. 测试矩阵和 fake Prisma/provider 策略。
11. 验证命令和边界扫描。
12. 需要我确认的问题。
~~~

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备执行 Step 9C-1。

本次只做 Step 9C-1 - Dashboard domain / metric contract。
只建立 Dashboard foundation 的领域契约、DTO/result types、模块骨架和测试。
不做 Prisma 聚合查询，不做 DashboardRepository / DashboardService 业务实现，不做 HTTP route，不做 root AppModule wiring。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B Search HTTP/root wiring: DONE。
- Step 9B-1 Search module-local HTTP boundary: DONE。
- Step 9B-2 Search root AppModule wiring: DONE。
- Step 9C 前计划确认已完成。
- Step 9C 已确认拆成：
  - 9C-1 Dashboard domain / metric contract
  - 9C-2 Dashboard repository/service foundation
- 本次执行 9C-1，不进入 9C-2。

Step 9C 计划确认结论：
- Step 9C 是 M 级中型后端 foundation。
- Dashboard 横跨 Achievement / Fee / Reminder / Workflow，必须防止统计侧信道泄露。
- Step 9C 不做 HTTP route，不做 root AppModule wiring。
- Dashboard HTTP/root wiring 留到 Step 9D。
- Step 9C 不访问真实数据库，不运行 migrate/seed。
- 当前 schema 足够，不改 schema/migration/seed/package/lockfile。
- 不做前端、不做缓存、不做大屏、排行、趋势、自定义报表、金额汇总、专利深度指标。

本次上下文读取规则：
- 只精确读取与 Step 9C-1 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9B closure / Step 9C 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9B archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9B evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9 Search boundary、Dashboard、RBAC / department scope / secret access 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9B 决策，以及 Dashboard / RBAC / statistics boundary 相关决策。

7. 必要代码：
   - apps/api/src/authorization/constants/**
   - apps/api/src/achievements/domain/**
   - apps/api/src/fees/domain/**
   - apps/api/src/reminders/domain/**
   - apps/api/src/workflow/domain/**
   - 如需参考 foundation pattern，只读 Search 9A domain/module/test 小范围。

本次实现范围：
1. 新增 standalone DashboardModule skeleton：
   - apps/api/src/dashboard/dashboard.module.ts
   - 不接 root AppModule。
2. 新增 Dashboard domain / metric contract：
   - metric key / section / result types
   - achievement summary result
   - fee summary result
   - workflow task summary result
   - reminder task summary result
   - overall dashboard summary result
3. 新增 Dashboard query DTO 或 request options 类型：
   - 支持 fixed today / dueSoonDays 的服务层输入契约。
   - dueSoonDays 默认建议 30。
   - 不做 HTTP query DTO 也可以，但要为 9C-2 service tests 留出稳定输入。
4. 新增纯 domain/type tests：
   - metric contract shape 稳定。
   - dueSoonDays 默认值 / 合法范围。
   - bucket key 只允许 status/type/overview 这类非敏感枚举。
   - result shape 不包含敏感字段名。
5. 更新必要 memory-bank：
   - implementation-plan.md
   - progress.md
   - evidence.md
   - architecture.md
   - decisions.md 如有必要。
6. 完成后标记：
   - Step 9C-1: DONE。
   - Step 9C-2: TODO。
   - Step 9C overall: IN PROGRESS。
   - Step 9D: TODO。

Dashboard 最小指标契约：
- Achievement total count。
- Achievement type distribution。
- Achievement status distribution。
- Fee payStatus distribution。
- Fee overdue / due soon overview。
- Current user WorkflowTask pending/status overview。
- Current user ReminderTask status overview。

明确不做：
- 不实现 DashboardRepository。
- 不实现 DashboardService 业务聚合。
- 不写 Prisma 查询。
- 不访问真实数据库。
- 不做 HTTP controller。
- 不做 root AppModule wiring。
- 不修改 apps/api/src/app.module.ts。
- 不做 Dashboard frontend。
- 不做缓存。
- 不做部门排行、年度/月度趋势、金额汇总、专利深度指标、全院大屏、自定义报表。
- 不接 Meilisearch 或其他外部服务。
- 不写 SearchLog。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

敏感字段边界：
Dashboard contract 不得包含或返回：
- Achievement title / identifiers / abstract / contributors / full detail
- Fee amount / voucherNo
- WorkflowAction comment
- Notification content
- Attachment object key / storage key / checksum / content
- AuditLog oldValue / newValue / ipAddress / userAgent
- .env / DATABASE_URL / Token / Cookie / 密钥 / 密码 hash / 完整连接串
- 完整 Search query 日志

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

边界扫描：
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/dashboard
- rg -n "PrismaService|prisma\\.|groupBy|count\\(|aggregate\\(" apps/api/src/dashboard
- rg -n "Meilisearch|meilisearch|SMTP|Bull|Queue|scheduler|cron|EMAIL|DATABASE_URL|migrate|seed|SearchLog" apps/api/src/dashboard apps/api/src
- rg -n "@Delete|deleteMany|delete\\(" apps/api/src/dashboard
- rg -n "DashboardModule" apps/api/src/app.module.ts
- rg -n "amount|voucherNo|abstract|contributors|comment|content|oldValue|newValue|ipAddress|userAgent|title|identifier" apps/api/src/dashboard

9C-1 边界要求：
- dashboard 目录无 controller decorators。
- dashboard 目录无 PrismaService / Prisma query / groupBy / count / aggregate。
- root app.module.ts 无 DashboardModule。
- 无外部服务 / migrate / seed / SearchLog。
- 无 delete/deleteMany。
- 敏感字段名不应出现在 runtime dashboard source；如果出现在 tests，必须是“不包含敏感字段”的边界断言。
- 不得开始 9C-2 repository/service 实现。

最后汇报：
1. 修改了哪些文件。
2. Dashboard metric contract 做了什么。
3. 明确哪些边界没有进入。
4. 测试和边界扫描结果。
5. 是否可以进入 Step 9C-2 前计划确认。
~~~

Step 9C-2

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 9C-2。

本次只做 Step 9C-2 前计划确认：
Dashboard repository/service foundation 计划确认。
先不要修改文件，不要写代码，不要进入实现。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B Search HTTP/root wiring: DONE。
- Step 9C-1 Dashboard domain / metric contract: DONE。
- Step 9C overall: IN PROGRESS。
- Step 9C-2 status: TODO。
- 本次只能做 Step 9C-2 前计划确认，不能直接实现。

Step 9C-1 已完成事实：
- 新增 standalone DashboardModule skeleton，未接 root AppModule。
- 定义 Dashboard metric section/key、count/bucket/result contracts。
- 覆盖最小指标契约：
  - Achievement total
  - Achievement type distribution
  - Achievement status distribution
  - Fee payStatus distribution
  - Fee deadline overview
  - WorkflowTask status overview
  - ReminderTask status overview
- 新增 request options 契约：
  - 支持 fixed today
  - 支持 dueSoonDays
  - dueSoonDays 默认 30
  - dueSoonDays 允许 1-90 的整数
- 新增纯 domain tests：
  - 契约 shape
  - bucket key
  - 敏感字段不进入结果 shape
  - options normalize
- 未实现 DashboardRepository。
- 未实现 DashboardService 聚合。
- 未写 Prisma 查询 / groupBy / count / aggregate。
- 未做 HTTP controller。
- 未做 root AppModule wiring。
- 未做前端、缓存、排行、趋势、金额汇总、专利深度指标、自定义报表。
- 未改 schema / migration / seed / package / lockfile。
- 未访问真实数据库，未运行 migrate / seed。

Step 9C-1 验证：
- corepack pnpm --filter @research-ip/api test: passed, 46 files / 406 tests。
- corepack pnpm --filter @research-ip/api typecheck: passed。
- corepack pnpm lint: passed。
- 边界扫描通过：
  - Dashboard controller decorators：无匹配。
  - PrismaService / prisma / groupBy / count / aggregate：无匹配。
  - 外部服务 / scheduler / cron / EMAIL / DB env / migrate / seed / SearchLog：无匹配。
  - delete / deleteMany：无匹配。
  - root app.module.ts 中 DashboardModule：无匹配。
  - 敏感字段名只出现在纯 domain spec 的“不包含这些字段”断言中。
- Step 9C-1 已标记 DONE。
- Step 9C-2 仍为 TODO。
- Step 9C overall 为 IN PROGRESS。

本次上下文读取规则：
- 只精确读取与 Step 9C-2 计划确认直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9C-1 closure / Step 9C-2 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9C-1 archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9C-1 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9C-1 Dashboard contract、Dashboard foundation、RBAC / department scope / statistics side-channel 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9C-1 决策，以及 Dashboard repository/service / RBAC / statistics boundary 相关决策。

7. E:\研究院科研成果管理系统\prisma\schema.prisma
   - 只定位读取与 Dashboard repository/service foundation 直接相关的 model / enum / index：
     - Achievement
     - FeeRecord
     - ReminderTask
     - WorkflowTask
     - WorkflowInstance
     - Department
     - User
   - 不读取或展示连接串。

8. 必要代码：
   - apps/api/src/dashboard/**
   - apps/api/src/authorization/policy/**
   - apps/api/src/authorization/constants/**
   - apps/api/src/database/**
   - apps/api/src/achievements/domain/**
   - apps/api/src/fees/domain/**
   - apps/api/src/reminders/domain/**
   - apps/api/src/workflow/domain/**
   - 如需参考 foundation pattern，只读 Search 9A repository/service/fake tests 小范围。

Step 9C-2 计划确认重点：
1. 是否实现：
   - DashboardRepository
   - DashboardService
   - repository/service tests
   - DashboardModule providers
2. Repository 聚合边界：
   - Achievement count / groupBy type / groupBy status。
   - Fee groupBy payStatus。
   - Fee overdue / due soon count。
   - WorkflowTask 当前用户 assignee status count。
   - ReminderTask 当前用户 receiver status count。
3. Service 权限策略：
   - Achievement 使用 PolicyQueryFactory.achievementReadableWhere(context)。
   - Fee 使用 PolicyQueryFactory.feeReadableWhere(context) + archivedAt: null。
   - WorkflowTask 第一版只统计 assigneeId = context.userId。
   - ReminderTask 第一版只统计 receiverId = context.userId。
   - 不使用 dashboard:read_institute 作为 9C-2 service 唯一入口；HTTP 静态权限留到 Step 9D。
4. 日期规则：
   - fixed today 由 options 注入。
   - dueSoonDays 使用 Step 9C-1 契约，默认 30，允许 1-90。
   - overdue：dueDate < today 且 payStatus in PENDING / OVERDUE。
   - due soon：today <= dueDate <= today + dueSoonDays 且 payStatus = PENDING。
   - 需要明确 date-only / UTC 处理策略。
5. 返回边界：
   - 只返回 count / bucket key / status / type / overview。
   - 不返回业务对象列表。
   - 不返回敏感字段。
6. 是否需要处理涉密 Achievement 的统计侧信道：
   - 第一版是否仅按 achievementReadableWhere(context) 聚合。
   - 是否需要额外排除 SECRET / CONFIDENTIAL，或只统计 grant 可读资源。
   - 如果额外 grant-aware 聚合需要 DB grant join，是否推迟。
7. fake Prisma 测试矩阵：
   - 断言 repository where 使用 caller-provided policy where。
   - 断言不 select 敏感字段。
   - 断言无 delete/deleteMany。
   - 断言 dueSoon/overdue 日期条件。
   - 断言 workflow/reminder 只按 current user。
8. 是否需要 HTTP route / root AppModule wiring：
   - Step 9C-2 不需要，留到 Step 9D。
9. 是否需要 schema / migration / seed / package / lockfile / 真实数据库。
10. 验证命令和边界扫描。
11. 需要我确认的问题。

要求：
- 只做计划确认。
- 不修改文件。
- 不写代码。
- 不进入 Step 9C-2 实现。
- 不做 Dashboard HTTP route。
- 不做 root AppModule wiring。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接 Meilisearch 或其他外部服务。
- 不写 SearchLog。
- 不生成大批量测试数据。
- 不实现前端页面。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

请输出：
1. Step 9C-2 的任务等级和风险判断。
2. Step 9C-2 精确范围：做什么 / 不做什么。
3. DashboardRepository 设计建议。
4. DashboardService 设计建议。
5. Achievement / Fee / Workflow / Reminder 聚合规则。
6. 权限和统计侧信道控制策略。
7. 日期规则和 fixed today / dueSoonDays 策略。
8. fake Prisma / provider tests 设计。
9. 是否需要 HTTP route / root AppModule wiring；如不需要，写清留到 Step 9D。
10. 是否需要 schema / seed / package / lockfile / 真实数据库。
11. 验证命令和边界扫描。
12. 需要我确认的问题。
~~~

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备执行 Step 9C-2。

本次只做 Step 9C-2 - Dashboard repository/service foundation。
只实现 DashboardRepository + DashboardService + providers + fake tests。
不做 Dashboard HTTP route，不做 root AppModule wiring，不进入 Step 9D。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B Search HTTP/root wiring: DONE。
- Step 9C-1 Dashboard domain / metric contract: DONE。
- Step 9C overall: IN PROGRESS。
- Step 9C-2 前计划确认已完成。
- Step 9C 拆分为：
  - 9C-1 Dashboard domain / metric contract
  - 9C-2 Dashboard repository/service foundation
- 本次执行 9C-2，不进入 Step 9D。

Step 9C-1 已完成事实：
- 新增 standalone DashboardModule skeleton，未接 root AppModule。
- 定义 Dashboard metric section/key、count/bucket/result contracts。
- 覆盖最小指标契约：
  - Achievement total
  - Achievement type distribution
  - Achievement status distribution
  - Fee payStatus distribution
  - Fee deadline overview
  - WorkflowTask status overview
  - ReminderTask status overview
- 新增 request options 契约：
  - 支持 fixed today
  - 支持 dueSoonDays
  - dueSoonDays 默认 30
  - dueSoonDays 允许 1-90 的整数
- 新增纯 domain tests：
  - 契约 shape
  - bucket key
  - 敏感字段不进入结果 shape
  - options normalize
- 未实现 DashboardRepository。
- 未实现 DashboardService 聚合。
- 未写 Prisma 查询 / groupBy / count / aggregate。
- 未做 HTTP controller。
- 未做 root AppModule wiring。
- 未访问真实数据库，未运行 migrate / seed。

Step 9C-2 计划确认结论：
- 实现 DashboardRepository + DashboardService + providers + fake tests。
- Achievement 涉密统计第一版仅按 `achievementReadableWhere(context)` 聚合，不额外做 grant-aware 排除。
- Workflow / Reminder 第一版只统计当前用户 `assigneeId` / `receiverId`。
- HTTP/root wiring 全部留到 Step 9D。
- 不使用 `dashboard:read_institute` 作为 9C-2 service 唯一入口；HTTP 静态权限留到 Step 9D。

本次上下文读取规则：
- 只精确读取与 Step 9C-2 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9C-1 closure / Step 9C-2 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9C-1 archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9C-1 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9C-1 Dashboard contract、Dashboard foundation、RBAC / department scope / statistics side-channel 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9C-1 决策，以及 Dashboard repository/service / RBAC / statistics boundary 相关决策。

7. 必要代码：
   - apps/api/src/dashboard/**
   - apps/api/src/authorization/policy/**
   - apps/api/src/authorization/constants/**
   - apps/api/src/database/**
   - apps/api/src/achievements/domain/**
   - apps/api/src/fees/domain/**
   - apps/api/src/reminders/domain/**
   - apps/api/src/workflow/domain/**
   - 如需参考 foundation pattern，只读 Search 9A repository/service/fake tests 小范围。

本次实现范围：
1. 新增 DashboardRepository。
2. 新增 DashboardService。
3. 在 DashboardModule 中注册 providers。
4. 新增 repository fake Prisma tests。
5. 新增 service fake provider tests。
6. 使用 Step 9C-1 contract 组装 DashboardSummary。
7. 更新必要 memory-bank：
   - implementation-plan.md
   - progress.md
   - evidence.md
   - architecture.md
   - decisions.md 如有必要。
8. 完成后标记：
   - Step 9C-2: DONE。
   - Step 9C overall: DONE。
   - Step 9D: TODO。
   - Step 9D 只能从 Dashboard HTTP/root wiring 计划确认开始。

DashboardRepository 设计：
- Repository 只接受 caller-provided where，不自行判断权限。
- 建议方法：
  - countAchievements(policyWhere)
  - groupAchievementsByType(policyWhere)
  - groupAchievementsByStatus(policyWhere)
  - groupFeesByPayStatus(policyWhere)
  - countOverdueFees(policyWhere, todayDateOnly)
  - countDueSoonFees(policyWhere, todayDateOnly, dueSoonEndDateOnly)
  - groupWorkflowTasksByStatus(userId)
  - groupReminderTasksByStatus(userId)
- Repository 可使用 Prisma count / groupBy。
- Repository 只返回 `{ key, count }` 或 count 这类聚合事实。
- Repository 不 select 业务详情字段。

DashboardService 设计：
- 接收 UserContext 和 Dashboard options。
- 校验 context 必须有 userId / departmentId。
- 调用 normalizeDashboardOptions(options)。
- 构造：
  - achievementWhere = PolicyQueryFactory.achievementReadableWhere(context)
  - feeWhere = PolicyQueryFactory.feeReadableWhere(context)
- Fee repository 内合并 archivedAt: null。
- Workflow 使用 assigneeId = context.userId。
- Reminder 使用 receiverId = context.userId。
- 将 repository 聚合结果映射为 Step 9C-1 DashboardSummary。
- 无权限 where `{ id: { in: [] } }` 时返回 0 / 空 distribution，不扩大 scope。
- 不在 service 里使用 `dashboard:read_institute` 作为唯一入口权限。

聚合规则：
Achievement：
- total count = achievement.count({ where: policyWhere })
- type distribution = groupBy type
- status distribution = groupBy status

Fee：
- base where = caller feeReadableWhere(context) + archivedAt: null
- payStatus distribution = groupBy payStatus
- overdue = dueDate < todayDateOnly and payStatus in [PENDING, OVERDUE]
- due soon = todayDateOnly <= dueDate <= todayDateOnly + dueSoonDays and payStatus = PENDING
- 不 aggregate amount

Workflow:
- group by status
- where: { assigneeId: context.userId }

Reminder:
- group by status
- where: { receiverId: context.userId }

日期规则：
- 将 today normalize 为 UTC date-only midnight。
- due soon end = UTC date-only today + dueSoonDays。
- overdue 使用 < todayDateOnly。
- due soon 使用 >= todayDateOnly 且 <= dueSoonEnd。
- dueSoonDays 继续使用 9C-1 的 normalizeDashboardOptions，默认 30，范围 1-90。

明确不做：
- 不做 Dashboard HTTP controller。
- 不做 root AppModule wiring。
- 不修改 apps/api/src/app.module.ts。
- 不做 Dashboard frontend。
- 不做缓存。
- 不做部门排行、年度/月度趋势、金额汇总、专利深度指标、全院大屏、自定义报表。
- 不接 Meilisearch 或其他外部服务。
- 不写 SearchLog。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

敏感字段边界：
Dashboard repository/service 不得返回或写入：
- Achievement title / identifiers / abstract / contributors / full detail
- Fee amount / voucherNo
- WorkflowAction comment
- Notification content
- Attachment object key / storage key / checksum / content
- AuditLog oldValue / newValue / ipAddress / userAgent
- .env / DATABASE_URL / Token / Cookie / 密钥 / 密码 hash / 完整连接串
- 完整 Search query 日志

Tests 要求：
Repository fake Prisma tests：
- Achievement count/groupBy 使用 caller-provided policy where。
- Fee groupBy/count 合并 caller-provided fee where + archivedAt: null。
- overdue/dueSoon 日期条件正确。
- WorkflowTask 只按 assigneeId。
- ReminderTask 只按 receiverId。
- 不 select 敏感字段。
- repository 无 create/update/delete/deleteMany。

Service tests：
- 调用 PolicyQueryFactory.achievementReadableWhere(context)。
- 调用 PolicyQueryFactory.feeReadableWhere(context)。
- 调用 repository 所有聚合方法并组装 DashboardSummary。
- invalid context 抛稳定错误。
- today / dueSoonDays 传递和 normalize 生效。
- 无权限 where `{ id: { in: [] } }` 时返回空 / 0 聚合，不扩大 scope。

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

边界扫描：
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/dashboard
- rg -n "Meilisearch|meilisearch|SMTP|Bull|Queue|scheduler|cron|EMAIL|DATABASE_URL|migrate|seed|SearchLog" apps/api/src/dashboard apps/api/src
- rg -n "@Delete|deleteMany|delete\\(" apps/api/src/dashboard
- rg -n "DashboardModule" apps/api/src/app.module.ts
- rg -n "amount|voucherNo|abstract|contributors|comment|content|oldValue|newValue|ipAddress|userAgent|title|identifier" apps/api/src/dashboard

9C-2 边界要求：
- dashboard 目录无 controller decorators。
- root app.module.ts 无 DashboardModule。
- 无外部服务 / migrate / seed / SearchLog。
- 无 delete/deleteMany。
- 允许出现 PrismaService、groupBy、count、aggregate 类聚合词。
- 敏感字段名如果出现在 tests，必须是“不返回/不 select”的边界断言。
- 不得开始 Step 9D。

最后汇报：
1. 修改了哪些文件。
2. Dashboard repository/service foundation 做了什么。
3. 明确哪些边界没有进入。
4. 测试和边界扫描结果。
5. Step 9C 是否已 DONE。
6. 是否可以进入 Step 9D 前计划确认。
~~~

## Step 9D

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 9D。

本次只做 Step 9D 前计划确认：
Dashboard HTTP/root wiring + Step 9 closure 计划确认。
先不要修改文件，不要写代码，不要进入实现。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B Search HTTP/root wiring: DONE。
- Step 9C Dashboard foundation: DONE。
- Step 9C-1 Dashboard domain / metric contract: DONE。
- Step 9C-2 Dashboard repository/service foundation: DONE。
- Step 9D status: TODO。
- 本次只能做 Step 9D 前计划确认，不能直接实现。

Step 9A / 9B 已完成事实：
- Search foundation 已完成。
- Search HTTP/root wiring 已完成。
- root AppModule 已显式 import SearchModule。
- Search 只暴露 GET /search。
- Search HTTP 使用 UserContextGuard、PermissionGuard、@CurrentUser()、@RequirePermissions(PermissionCode.userContextRead)。
- Search 未写 SearchLog。
- Search 未接 Meilisearch。
- 未接 queue/scheduler/cron。

Step 9C 已完成事实：
- 新增 standalone DashboardModule，未接 root AppModule。
- Step 9C-1 完成 Dashboard metric contract：
  - Achievement total / type / status
  - Fee payStatus / deadline overview
  - WorkflowTask status overview
  - ReminderTask status overview
  - fixed today / dueSoonDays options，dueSoonDays 默认 30，范围 1-90
- Step 9C-2 完成 Dashboard repository/service foundation：
  - policy-scoped Achievement / Fee 聚合
  - 当前用户范围 WorkflowTask / ReminderTask 聚合
  - DashboardService 汇总映射
  - fake Prisma/provider tests
  - standalone DashboardModule provider 注册
- DashboardRepository / DashboardService 不返回业务详情。
- Dashboard 未新增 HTTP controller。
- Dashboard 未接 root AppModule。
- Dashboard 未访问真实数据库。
- Dashboard 未跑 migrate/seed。
- Dashboard 未改 schema/package/lockfile。
- Dashboard 未做前端、Meilisearch、SearchLog、queue/scheduler/cron。
- Step 9C overall: DONE。
- Step 9D: TODO。

Step 9C 验证：
- corepack pnpm --filter @research-ip/api test: passed, 48 files / 420 tests。
- corepack pnpm --filter @research-ip/api typecheck: passed。
- corepack pnpm lint: passed。
- 边界扫描通过：
  - dashboard 下无 @Controller / @Get / @Post / @Patch / @Delete。
  - 无 Meilisearch / SMTP / Bull / Queue / scheduler / cron / EMAIL / DATABASE_URL / migrate / seed / SearchLog。
  - dashboard 下无 @Delete / deleteMany / delete(。
  - root app.module.ts 中无 DashboardModule。
  - 敏感字段扫描仅命中 9C-1 domain spec 中“不得返回这些字段”的负向断言。

本次上下文读取规则：
- 只精确读取与 Step 9D 计划确认直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9C closure / Step 9D 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9C archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9C evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9 Search/Dashboard boundary、Dashboard HTTP/root wiring、RBAC / statistics side-channel 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9C 决策，以及 Dashboard HTTP/root wiring / permission strategy / statistics boundary 相关决策。

7. 必要代码：
   - apps/api/src/dashboard/**
   - apps/api/src/app.module.ts
   - apps/api/src/authorization/**
   - 如需参考 HTTP/root wiring pattern，只读 Search / Fees / Reminders 的 controller 和 app-module spec 小范围。

Step 9D 计划确认重点：
1. Step 9D 是否需要拆成：
   - 9D-1 Dashboard module-local HTTP boundary
   - 9D-2 Dashboard root AppModule wiring + Step 9 final closure
2. Dashboard HTTP endpoint 建议：
   - 是否只暴露 GET /dashboard/summary
   - 是否支持 query：today / dueSoonDays
   - 是否不暴露 detail / list / drilldown / export
3. Dashboard HTTP 静态权限策略：
   - 是否使用现有 `dashboard:read_institute`
   - 或是否使用 `user_context:read`，由 DashboardService 内部按资源 policy 返回当前用户可见指标
   - 是否允许无 dashboard:read_institute 的普通用户查看个人/部门范围 summary
   - Step 9D 是否不新增权限主数据、不改 seed
4. Controller 设计：
   - UserContextGuard
   - PermissionGuard
   - @CurrentUser()
   - @RequirePermissions(...)
   - local ValidationPipe
   - Dashboard options query validation
   - service error mapping
5. Module-local HTTP tests：
   - 401 without user context
   - 403 missing static permission
   - 200 delegates to DashboardService
   - invalid dueSoonDays / today -> 400
   - response shape 不包含敏感字段
6. Root AppModule wiring / AppModule-level tests：
   - root AppModule 显式 import DashboardModule
   - override DashboardService
   - override PrismaService
   - override IDENTITY_ADAPTER
   - 保留真实 guards/decorator metadata
   - 验证 /health
   - 验证 GET /dashboard/summary root reachable
   - 验证 401 / 403 / 200 / invalid query
7. Step 9 final closure：
   - Step 9A DONE
   - Step 9B DONE
   - Step 9C DONE
   - Step 9D DONE
   - Step 9 overall DONE
   - Step 10 TODO
   - Step 10 只能从质量门禁与证据包计划确认开始
8. 是否继续不做：
   - 前端
   - Meilisearch
   - SearchLog
   - queue / scheduler / cron
   - schema / migration / seed / package / lockfile
   - 真实数据库
   - 大批量测试数据
9. 验证命令和边界扫描。
10. 需要我确认的问题。

要求：
- 只做计划确认。
- 不修改文件。
- 不写代码。
- 不进入 Step 9D 实现。
- 不做 Dashboard HTTP route 实现。
- 不做 root AppModule wiring 实现。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接 Meilisearch 或其他外部服务。
- 不写 SearchLog。
- 不生成大批量测试数据。
- 不实现前端页面。
- 不修改 schema.prisma、migration、seed、package 或 lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

请输出：
1. Step 9D 的任务等级和风险判断。
2. Step 9D 是否拆成 9D-1 / 9D-2。
3. Step 9D 精确范围：做什么 / 不做什么。
4. Dashboard HTTP endpoint 建议。
5. Dashboard HTTP 权限策略建议。
6. Dashboard query validation / options mapping 设计。
7. Controller / module-local test 设计。
8. Root AppModule wiring / AppModule-level test 设计。
9. Step 9 final closure 设计。
10. 是否需要 schema / seed / package / lockfile / 真实数据库 / Meilisearch / SearchLog。
11. 验证命令和边界扫描。
12. 需要我确认的问题。
~~~

Step 9D-1

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备执行 Step 9D-1。

本次只做 Step 9D-1 - Dashboard module-local HTTP boundary。
只新增 DashboardController，并只在 DashboardModule 本地注册。
不做 root AppModule wiring，不进入 Step 9D-2，不做 Step 9 final closure。

前置状态：
- Step 8 overall: DONE。
- Step 9A Search foundation: DONE。
- Step 9B Search HTTP/root wiring: DONE。
- Step 9C Dashboard foundation: DONE。
- Step 9D 前计划确认已完成。
- Step 9D 已确认拆成：
  - 9D-1 Dashboard module-local HTTP boundary
  - 9D-2 Dashboard root AppModule wiring + Step 9 final closure
- 本次执行 9D-1，不进入 9D-2。

Step 9C 已完成事实：
- DashboardModule standalone 已存在，未接 root AppModule。
- Dashboard domain / metric contract 已完成。
- DashboardRepository / DashboardService 已完成。
- DashboardService 已按 PolicyQueryFactory.achievementReadableWhere(context) 和 feeReadableWhere(context) 做资源级过滤。
- Workflow / Reminder 统计为当前用户范围。
- Dashboard 不返回业务详情。
- 未做 Dashboard HTTP controller。
- 未接 root AppModule。
- 未访问真实数据库、未运行 migrate/seed、未修改 schema/migration/seed/package/lockfile。

Step 9D 前计划确认结论：
- Step 9D 拆成 9D-1 / 9D-2。
- 9D-1 只做 module-local HTTP boundary。
- 只暴露 GET /dashboard/summary。
- Query 只允许：
  - today
  - dueSoonDays
- 静态权限使用 `user_context:read`。
- 暂不使用 `dashboard:read_institute`。
- `dashboard:read_institute` 保留给未来 institute-wide / leadership dashboard scope。
- Step 9 final closure 放在 9D-2 验证全部通过后统一归档。

本次上下文读取规则：
- 只精确读取与 Step 9D-1 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围。
- 如果某次检索命中超过 80 行，请停止并换更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 9C closure / Step 9D 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 9C archive 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 9C evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 9C Dashboard foundation、Dashboard HTTP boundary、RBAC / statistics side-channel 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 只读最新 Step 9C 决策，以及 Dashboard HTTP boundary / permission strategy 相关决策。

7. 必要代码：
   - apps/api/src/dashboard/**
   - apps/api/src/authorization/**
   - 如需参考 HTTP pattern，只读 Search / Fees / Reminders controller 和 controller spec 小范围。

本次实现范围：
1. 新增 `apps/api/src/dashboard/dashboard.controller.ts`。
2. 新增 `apps/api/src/dashboard/dto/dashboard-summary-query.dto.ts` 或等价 DTO。
3. 在 `DashboardModule` 本地注册 DashboardController。
4. 新增 module-local HTTP tests，例如 `dashboard.controller.spec.ts`。
5. Controller 设计：
   - `@Controller("dashboard")`
   - `@UseGuards(UserContextGuard, PermissionGuard)`
   - local `ValidationPipe`
   - `@Get("summary")`
   - `@RequirePermissions(PermissionCode.userContextRead)`
   - `@CurrentUser()`
   - query DTO -> DashboardRequestOptions
   - delegate to `DashboardService.getDashboardSummary(currentUser, options)`
6. Query 支持：
   - `today?: string`
     - 支持 ISO date 或 ISO datetime
     - invalid date -> 400
     - controller 映射为 Date
   - `dueSoonDays?: number`
     - string transform to number
     - integer
     - min 1
     - max 90
     - invalid/out of range -> 400
7. Error mapping：
   - `DashboardAccessDeniedError` -> 403
   - DTO / pipe validation -> 400
   - 未知错误不吞，交给 Nest 默认处理。
8. Module-local tests 覆盖：
   - 401 without user context。
   - 403 missing `user_context:read`。
   - 200 delegates to `DashboardService.getDashboardSummary(currentUser, options)`。
   - today / dueSoonDays query transform 生效。
   - invalid today -> 400。
   - invalid dueSoonDays -> 400。
   - response shape 不包含敏感字段。
   - service DashboardAccessDeniedError -> 403。
   - provider override：DashboardService、PrismaService、IDENTITY_ADAPTER。
   - 保留真实 UserContextGuard / PermissionGuard。
9. 更新必要 memory-bank：
   - implementation-plan.md
   - progress.md
   - evidence.md
   - architecture.md
   - decisions.md 如有必要。
10. 完成后标记：
   - Step 9D-1: DONE。
   - Step 9D-2: TODO。
   - Step 9D overall: IN PROGRESS。
   - Step 9 overall: IN PROGRESS。
   - Step 10: TODO。

明确不做：
- 不做 root AppModule wiring。
- 不修改 apps/api/src/app.module.ts。
- 不新增 AppModule-level Dashboard tests。
- 不做 Step 9 final closure。
- 不使用 dashboard:read_institute。
- 不新增权限主数据。
- 不做 detail/list/drilldown/export。
- 不做 institute-wide dashboard。
- 不做前端。
- 不接 Meilisearch。
- 不写 SearchLog。
- 不做 queue / scheduler / cron。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不执行删除、重置、清空、批量清理等破坏性操作。

敏感字段边界：
Dashboard HTTP response 不得返回：
- Achievement title / identifiers / abstract / contributors / full detail
- Fee amount / voucherNo
- WorkflowAction comment
- Notification content
- Attachment object key / storage key / checksum / content
- AuditLog oldValue / newValue / ipAddress / userAgent
- .env / DATABASE_URL / Token / Cookie / 密钥 / 密码 hash / 完整连接串
- 完整 Search query 日志

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

边界扫描：
- rg -n "@Post|@Patch|@Delete" apps/api/src/dashboard
- rg -n "@Delete|deleteMany|delete\\(" apps/api/src/dashboard
- rg -n "Meilisearch|meilisearch|SMTP|Bull|Queue|scheduler|cron|EMAIL|DATABASE_URL|migrate|seed|SearchLog" apps/api/src/dashboard apps/api/src
- rg -n "DashboardModule" apps/api/src/app.module.ts
- rg -n "amount|voucherNo|abstract|contributors|comment|content|oldValue|newValue|ipAddress|userAgent|title|identifier" apps/api/src/dashboard

9D-1 边界要求：
- root app.module.ts 中应无 DashboardModule。
- dashboard 目录只允许 GET summary，不允许 POST/PATCH/DELETE。
- 不应出现 Meilisearch、SearchLog 写入、queue/scheduler/cron、migrate/seed。
- 敏感字段名如果出现在 tests，必须是“不返回这些字段”的边界断言。
- 不得开始 9D-2 或 Step 9 final closure。

最后汇报：
1. 修改了哪些文件。
2. Dashboard module-local HTTP boundary 做了什么。
3. 明确哪些边界没有进入。
4. 测试和边界扫描结果。
5. 是否可以进入 Step 9D-2 前计划确认。
~~~

~~~
确认执行 Step 9D-2。

本次只做：
- Dashboard root AppModule wiring
- Dashboard AppModule-level HTTP tests
- Step 9 final closure

精确范围：
1. root AppModule 显式 import DashboardModule。
   - 只在 apps/api/src/app.module.ts 中新增 DashboardModule import。
   - 在 imports 数组中加入 DashboardModule。
   - 建议放在 SearchModule 后面。
2. 新增 apps/api/src/dashboard/dashboard.app-module.spec.ts。
   - 验证 /health 仍可用。
   - 验证 GET /dashboard/summary root reachable。
   - 覆盖 401 without user context。
   - 覆盖 403 without user_context:read。
   - 覆盖 200 delegation。
   - 覆盖 query transform：today -> Date，dueSoonDays -> number。
   - 覆盖 invalid query -> 400。
3. AppModule-level tests 必须 override：
   - DashboardService，避免真实 repository / policy / Prisma 聚合执行。
   - PrismaService 为 {}，避免真实数据库访问。
   - IDENTITY_ADAPTER，避免 dev identity adapter 查真实库。
4. AppModule-level tests 必须保留真实：
   - UserContextGuard
   - PermissionGuard
   - @CurrentUser()
   - @RequirePermissions(PermissionCode.userContextRead) metadata
   - controller validation pipe
5. 验证通过后更新 memory-bank：
   - implementation-plan.md
   - progress.md
   - evidence.md
   - architecture.md
   - decisions.md 如确有新增长期决策再更新
6. Step 状态归档为：
   - Step 9A: DONE
   - Step 9B: DONE
   - Step 9C: DONE
   - Step 9D-1: DONE
   - Step 9D-2: DONE
   - Step 9D overall: DONE
   - Step 9 overall: DONE
   - Step 10: TODO
7. Step 10 边界写清：
   - Step 10 只能从“质量门禁与证据包计划确认”开始。
   - 不在 9D-2 中实现 Step 10。

禁止进入：
- 不新增 endpoint。
- 不改 DashboardController 行为，除非 root wiring 测试发现必要小修。
- 不使用 dashboard:read_institute。
- 不新增 permission seed。
- 不做 Step 10。
- 不做 frontend / Meilisearch / SearchLog / queue / scheduler / cron。
- 不改 schema / migration / seed / package / lockfile。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取 prompt历史记录.md。
- 不读取无关历史上下文。

实现后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

边界扫描：
- rg -n "@Post|@Patch|@Delete" apps/api/src/dashboard
- rg -n "@Delete|deleteMany|delete\(" apps/api/src/dashboard
- rg -n "Meilisearch|meilisearch|SMTP|Bull|Queue|scheduler|cron|EMAIL|DATABASE_URL|migrate|seed|SearchLog" apps/api/src/dashboard apps/api/src
- rg -n "DashboardModule" apps/api/src/app.module.ts
- rg -n "amount|voucherNo|abstract|contributors|comment|content|oldValue|newValue|ipAddress|userAgent|title|identifier" apps/api/src/dashboard

预期：
- DashboardModule 在 root app.module.ts 中只出现 import 和 imports 注册。
- dashboard 下仍无 POST/PATCH/DELETE。
- 无外部服务、DB env、migrate/seed、SearchLog。
- 敏感字段只允许出现在“不返回这些字段”的负向测试断言中。
~~~

