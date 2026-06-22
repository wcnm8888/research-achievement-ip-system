# 4、Step 4

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 4。

当前状态：
- Step 1 memory-bank 已完成。
- Step 2 项目脚手架已完成，install/lint/typecheck/test/build 均通过。
- Step 3 数据库 schema、migration、seed 已完成，Step 3 整体 DONE。
- 当前只做 Step 4 前的计划确认，先不要写代码。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\use.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\07-database-production.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\product-brief.md
- E:\研究院科研成果管理系统\memory-bank\feature-brief.md
- E:\研究院科研成果管理系统\memory-bank\design-spec.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\tech-stack.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\prisma\schema.prisma

本次只做 Step 4 的执行计划确认。

请输出：
1. Step 4 的任务等级和风险判断。
2. Step 4 是否需要拆成 4A / 4B / 4C / 4D。
3. RBAC 权限模型实现方案。
4. 部门数据隔离策略。
5. 涉密资源访问策略。
6. 审计只读角色策略。
7. 后端 policy / guard / decorator / user context 的模块设计。
8. 权限测试矩阵。
9. 本 Step 的验证命令和质量门禁。
10. 需要我确认的问题。

要求：
- 先不要写代码。
- 不实现成果登记业务。
- 不实现审批、费用、提醒业务。
- 不做前端页面。
- 不接真实登录/SSO。
- 如果 Step 4 太大，请先拆分，等我确认后再执行。
~~~

## 划分任务

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目。

上一轮已经完成 Step 4 总体计划确认，但复查后发现它仍是方向稿，不足以直接开工。  
本次只做 Step 4A / 4B / 4C / 4D 的精确执行计划确认，先不要写代码、不要修改文件。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\07-database-production.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\product-brief.md
- E:\研究院科研成果管理系统\memory-bank\feature-brief.md
- E:\研究院科研成果管理系统\memory-bank\design-spec.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\tech-stack.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\prisma\seed.cjs
- E:\研究院科研成果管理系统\apps\api\package.json
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts

请重点补齐以下决策：
1. Step 4A / 4B / 4C / 4D 每一步的范围、文件边界、完成定义和验证命令。
2. 是否新增 DEPARTMENT_ADMIN 角色，以及它的权限边界。
3. 是否补充细粒度权限点，例如 attachment:download、secret:read、audit:read_masked、user_context:read。
4. 审计人员能看哪些日志、是否能看业务详情、oldValue/newValue 是否必须脱敏。
5. SYSTEM_ADMIN 是否拥有 audit:read、secret:grant，是否禁止超级管理员绕过。
6. 测试数据使用 seed 还是测试内 fixture；要求不要污染现有 seed，除非先说明原因。
7. Step 4D 是否需要新增 @nestjs/testing、supertest、@types/supertest，并说明用途。
8. 每个子步骤不允许进入哪些后续业务范围。

请输出：
1. Step 4 总体执行边界。
2. Step 4A 精确计划。
3. Step 4B 精确计划。
4. Step 4C 精确计划。
5. Step 4D 精确计划。
6. 权限点补充建议。
7. 角色补充建议。
8. 测试矩阵和测试数据策略。
9. 每一步验证命令。
10. 需要我最终确认的问题。

要求：
- 先不要写代码。
- 不修改 schema.prisma、seed、package.json 或任何源码。
- 不进入成果登记、审批、费用、提醒、附件存储、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

## 执行Step 4A

~~~
确认执行 Step 4A。

我确认以下决策：
- 新增 DEPARTMENT_ADMIN 角色，作用域仅 DEPARTMENT。
- 新增细粒度权限点：user_context:read、attachment:read_metadata、attachment:download、audit:read_masked、department:read_department、fee:read_department、resource_grant:create、resource_grant:revoke。
- 不新增全局 secret:read；涉密读取主要通过 resource_access_grants 的 SECRET_READ 授权。
- SYSTEM_ADMIN 拥有 system:config、achievement:archive、audit:read_masked，不默认拥有 secret:grant。
- 审计人员只能看脱敏日志，不能直接看业务详情。
- Step 4 测试场景数据使用测试内 fixture，不污染 seed。
- 4D 可以新增 @nestjs/testing、supertest、@types/supertest；但 Step 4A 先不新增这些依赖。

本次只执行 Step 4A，不进入 4B/4C/4D，也不进入 Step 5。

Step 4A 范围：
- 创建 API 侧 Prisma 基础服务/模块。
- 创建 UserContext 类型，包含 userId、departmentId、role codes、permission codes、role scopes、scoped department IDs。
- 创建角色码、权限码、资源类型、scope 类型、policy decision 等基础常量和类型。
- 创建 dev/test identity adapter，允许开发/测试环境使用 X-Demo-User-Id 加载演示用户上下文。
- 生产环境不得依赖 X-Demo-User-Id。
- 可修改 prisma/seed.cjs，但仅限补齐 DEPARTMENT_ADMIN 和权限主数据；不得写入测试场景数据。
- 为 4B/4C/4D 预留接口边界，但不实现完整 RBAC 决策、涉密授权、附件下载、审计策略或业务 API。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\prisma\seed.cjs
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts
- E:\研究院科研成果管理系统\apps\api\package.json

执行要求：
- 只修改与 Step 4A 直接相关的文件。
- 不修改已执行 migration。
- 不修改 schema.prisma。
- 不新增 4D 的 API 集成测试依赖。
- 不实现成果登记、审批、费用、提醒、附件存储、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后请运行：
- corepack pnpm prisma:validate
- corepack pnpm exec prisma db seed
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- 如有重要架构取舍，再更新 decisions.md / architecture.md / implementation-plan.md。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 4A 实现了什么。
3. seed 是否只补了权限主数据。
4. 明确没有进入哪些范围。
5. 哪些验证通过。
6. 哪些验证失败及原因。
7. 是否可以进入 Step 4B 前计划确认。
~~~

## Step 4B

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 4B。

当前状态：
- Step 4A 已完成。
- 已完成 Prisma 基础服务、UserContext、角色/权限/resource/scope 常量、PolicyDecision 类型、dev/test identity adapter。
- seed 已补 DEPARTMENT_ADMIN 和细粒度权限主数据。
- 旧 audit:read 和 secret:grant 已标记 ARCHIVED，未删除历史主数据。
- Step 4A 验证已通过：prisma:validate、db seed、api test、api typecheck、lint。
- 当前只做 Step 4B 前的计划确认，先不要写代码。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\prisma\seed.cjs
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\authorization

本次只做 Step 4B 的执行计划确认。

Step 4B 目标：
- 实现 RBAC 权限解析。
- 实现部门 scope 判断。
- 实现 policy decision 模型的实际判断服务。
- 实现 Prisma where 过滤条件工厂，避免先查全量再内存过滤。
- 编写单元测试覆盖正反例。

请输出：
1. Step 4B 的任务等级和风险判断。
2. Step 4B 的精确范围：做什么、不做什么。
3. 需要创建/修改的文件清单。
4. RBAC policy service 设计。
5. department scope service 设计。
6. policy query factory 设计。
7. 如何处理 ARCHIVED permission / role、revoked user role、disabled user。
8. 科研人员、科研秘书、部门管理员、领导、系统管理员的部门 scope 规则。
9. Step 4B 单元测试矩阵。
10. 测试数据策略：只用测试内 fixture，不污染 seed。
11. 验证命令。
12. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 4C/4D。
- 不实现涉密授权、附件下载、审计策略、guard/decorator 或 API 集成测试。
- 不实现成果登记、审批、费用、提醒、搜索、看板或前端页面。
- 不修改 schema.prisma。
- 不修改 migration。
- 不修改 seed，除非先停止并说明原因。
- 不新增依赖。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 4B。

我确认以下决策：
- Step 4B 的部门 scope 只做精确 departmentId，不做下级部门继承。
- 无权限 where 统一返回 { id: { in: [] } }，避免返回全量数据。
- Step 4B 可以创建 AuthorizationModule，但不接入 AppModule，留到 Step 4D 再接 guard/decorator。
- Step 4B query factory 只覆盖 achievement / fee / department 这类直接有 scope 字段的资源。
- attachment / audit / reminder / search 留到后续步骤处理。
- achievement:archive 在 Step 4B 只作为动作权限存在，不赋予系统管理员全量详情读取能力。

本次只执行 Step 4B，不进入 4C/4D，也不进入 Step 5。

Step 4B 范围：
- 实现 RbacPolicyService。
- 实现 DepartmentScopeService。
- 实现 PolicyQueryFactory。
- 如需要，可创建 AuthorizationModule，但不要接入 AppModule。
- 编写单元测试覆盖 RBAC、部门 scope、where factory 的正反例。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

执行要求：
- 只修改与 Step 4B 直接相关的文件。
- 不修改 schema.prisma。
- 不修改 migration。
- 不修改 seed.cjs。
- 不修改 package.json。
- 不新增依赖。
- 不接入 AppModule。
- 不实现涉密授权、附件下载、审计脱敏、guard/decorator 或 API 集成测试。
- 不实现成果登记、审批、费用、提醒、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- 如有重要取舍，再更新 decisions.md / architecture.md / implementation-plan.md。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 4B 实现了什么。
3. 明确没有进入哪些范围。
4. 哪些验证通过。
5. 哪些验证失败及原因。
6. 是否可以进入 Step 4C 前计划确认。
~~~

## Step 4C

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 4C。

当前状态：
- Step 4A 已完成：Prisma 基础服务、UserContext、角色/权限/resource/scope 常量、PolicyDecision 类型、dev/test identity adapter。
- Step 4B 已完成：RbacPolicyService、DepartmentScopeService、PolicyQueryFactory、AuthorizationModule。
- Step 4B 未接入 AppModule，未实现 guard/decorator/API 集成测试。
- Step 4B 验证已通过：api test、api typecheck、lint。
- 当前只做 Step 4C 前的计划确认，先不要写代码。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\07-database-production.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

本次只做 Step 4C 的执行计划确认。

Step 4C 目标：
- 实现涉密资源访问策略。
- 实现附件访问策略。
- 实现审计只读策略。
- 实现审计 oldValue/newValue 脱敏服务。
- 编写单元测试覆盖正反例。

请输出：
1. Step 4C 的任务等级和风险判断。
2. Step 4C 的精确范围：做什么、不做什么。
3. 需要创建/修改的文件清单。
4. SecretAccessPolicyService 设计。
5. AttachmentAccessPolicyService 设计。
6. AuditReadPolicyService 设计。
7. AuditRedactorService 设计。
8. resource_access_grants 的有效授权判断规则。
9. SECRET / CONFIDENTIAL 资源 owner 是否可读的规则。
10. attachment:download 与 SECRET_READ 的关系。
11. audit:read_masked 的脱敏范围和禁止返回字段。
12. Step 4C 单元测试矩阵。
13. 测试数据策略：只用测试内 fixture，不污染 seed。
14. 验证命令。
15. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 4D。
- 不实现 guard/decorator、API 集成测试、401/403 controller 测试。
- 不实现真实对象存储、真实附件下载流、审计页面或业务详情 API。
- 不实现成果登记、审批、费用、提醒、搜索、看板或前端页面。
- 不修改 schema.prisma。
- 不修改 migration。
- 不修改 seed.cjs，除非先停止并说明原因。
- 不新增依赖。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 4C。

我确认以下决策：
- 允许在 Step 4C 扩展 UserContext，增加 roleIds，用于正确支持 ROLE 类型 resource_access_grants。
- DEPARTMENT grant 只匹配用户当前 departmentId，不匹配 scopedDepartmentIds，避免把角色作用域误当组织成员关系。
- owner 对 SECRET / CONFIDENTIAL 资源不自动可读，仍需有效 SECRET_READ 授权。
- 涉密附件下载允许 ATTACHMENT_DOWNLOAD grant 作为单附件窄授权；该授权只允许下载指定附件，不代表可读业务详情，也不等于 SECRET_READ。
- 审计脱敏采用严格策略：默认隐藏值，只保留字段名、安全枚举、必要 ID、时间和脱敏摘要；不返回原始 oldValue/newValue。

本次只执行 Step 4C，不进入 Step 4D，也不进入 Step 5。

Step 4C 范围：
- 实现 resource_access_grants 有效授权判断。
- 实现 SecretAccessPolicyService。
- 实现 AttachmentAccessPolicyService。
- 实现 AuditReadPolicyService。
- 实现 AuditRedactorService。
- 必要时扩展 UserContext 和 dev/test identity adapter，以支持 roleIds。
- 更新 AuthorizationModule providers/exports。
- 编写单元测试覆盖涉密、附件、审计、脱敏的正反例。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\07-database-production.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\prisma\schema.prisma
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

执行要求：
- 只修改与 Step 4C 直接相关的文件。
- 不修改 schema.prisma。
- 不修改 migration。
- 不修改 seed.cjs。
- 不修改 package.json。
- 不新增依赖。
- 不接入 guard/decorator。
- 不实现 API 集成测试、401/403 controller 测试。
- 不实现真实对象存储、真实附件下载流、审计页面或业务详情 API。
- 不实现成果登记、审批、费用、提醒、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- 如有重要取舍，再更新 decisions.md / architecture.md / implementation-plan.md。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 4C 实现了什么。
3. UserContext 是否新增 roleIds。
4. ATTACHMENT_DOWNLOAD 窄授权如何生效。
5. 审计脱敏具体隐藏了哪些字段。
6. 明确没有进入哪些范围。
7. 哪些验证通过。
8. 哪些验证失败及原因。
9. 是否可以进入 Step 4D 前计划确认。
~~~

## Step 4D

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 4D。

当前状态：
- Step 4A 已完成：Prisma 基础服务、UserContext、角色/权限/resource/scope 常量、PolicyDecision 类型、dev/test identity adapter。
- Step 4B 已完成：RbacPolicyService、DepartmentScopeService、PolicyQueryFactory、AuthorizationModule。
- Step 4C 已完成：ResourceGrantPolicyService、SecretAccessPolicyService、AttachmentAccessPolicyService、AuditReadPolicyService、AuditRedactorService。
- Step 4C 已扩展 UserContext.roleIds。
- Step 4C 验证已通过：api test、api typecheck、lint。
- 当前只做 Step 4D 前的计划确认，先不要写代码。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\apps\api\package.json
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

本次只做 Step 4D 的执行计划确认。

Step 4D 目标：
- 实现 Nest decorator：@CurrentUser()、@RequirePermissions()。
- 实现 Nest guard：UserContextGuard、PermissionGuard。
- 必要时实现 ResourcePolicyGuard 的边界设计，但不接业务 API。
- 将 AuthorizationModule 按计划接入 AppModule。
- 使用 test-only controller 或最小 /me 验证 guard/decorator。
- 编写 HTTP 集成测试覆盖 401 / 403 / allow。
- 完成 Step 4 权限内核证据归档。

请输出：
1. Step 4D 的任务等级和风险判断。
2. Step 4D 的精确范围：做什么、不做什么。
3. 是否需要新增 @nestjs/testing、supertest、@types/supertest，分别说明用途。
4. 需要创建/修改的文件清单。
5. CurrentUser decorator 设计。
6. RequirePermissions decorator 设计。
7. UserContextGuard 设计。
8. PermissionGuard 设计。
9. test-only controller 或最小 /me 的测试方案。
10. HTTP 集成测试矩阵：401、403、allow、生产禁用 X-Demo-User-Id。
11. Step 4D 完成后如何收尾归档整个 Step 4。
12. 验证命令。
13. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 5。
- 不实现成果登记、审批、费用、提醒、附件存储、搜索、看板或前端页面。
- 不实现真实登录/SSO。
- 不实现真实对象存储、真实附件下载流、审计页面或业务详情 API。
- 不修改 schema.prisma。
- 不修改 migration。
- 不修改 seed.cjs。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 4D。

我确认以下决策：
- Step 4D 采用 test-only controller，放在 spec 文件内，不新增运行时 /me 或其他正式业务 API。
- guard 采用显式 @UseGuards，不注册全局 APP_GUARD。
- 同意新增 @nestjs/testing、supertest、@types/supertest 到 apps/api devDependencies，用于 Nest HTTP 集成测试。
- ResourcePolicyGuard 本步骤只记录边界，不实现，留到成果/附件/审计真实 API 时按资源接入。

本次只执行 Step 4D，不进入 Step 5。

Step 4D 范围：
- 新增 @CurrentUser()。
- 新增 @RequirePermissions()。
- 新增 UserContextGuard。
- 新增 PermissionGuard。
- 将 AuthorizationModule 接入 AppModule。
- 使用 test-only controller 验证 decorator/guard。
- 编写 HTTP 集成测试覆盖 401、403、allow、生产禁用 X-Demo-User-Id。
- 完成 Step 4D 和整个 Step 4 权限内核证据归档。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\apps\api\package.json
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

执行要求：
- 只修改与 Step 4D 直接相关的文件。
- 可以修改 apps/api/package.json 和 pnpm-lock.yaml，仅用于新增确认过的测试依赖。
- 不修改 schema.prisma。
- 不修改 migration。
- 不修改 seed.cjs。
- 不新增运行时业务 API。
- 不注册全局 APP_GUARD。
- 不实现 ResourcePolicyGuard。
- 不实现成果登记、审批、费用、提醒、附件存储、搜索、看板或前端页面。
- 不实现真实登录/SSO。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md。

收尾要求：
- 将 Step 4A / 4B / 4C / 4D 全部标记 DONE。
- 将 Step 4 整体标记 DONE。
- 明确 Step 5 仍是 TODO，未进入成果登记。
- 记录新增依赖、HTTP 集成测试矩阵、验证命令和结果。
- 记录未进入范围。

最后汇报：
1. 创建/修改了哪些文件。
2. 新增依赖有哪些。
3. Step 4D 实现了什么。
4. test-only controller 是否只存在于测试文件。
5. 是否接入 AppModule，是否未注册全局 APP_GUARD。
6. 明确没有进入哪些范围。
7. 哪些验证通过。
8. 哪些验证失败及原因。
9. Step 4 是否已完整 DONE。
10. 是否可以进入 Step 5 前计划确认。
~~~









## Prompt 2

~~~
我现在要继续整理 E:\研究院科研成果管理系统 的提示词手册，准备创建 Prompt 2。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\prompt.md

重点理解 prompt.md 最前面的：
- Prompt 1 - 项目启动与阶段推进编排

本次对话的定位：
Prompt 2 - [这里写你想整理的主题]

要求：
- 先不要修改文件。
- 先理解 Prompt 1 的定位、风格和结构。
- 再帮我判断 Prompt 2 应该如何定位、放在 prompt.md 的哪个位置、应该包含哪些模板。
- 不同步聊天全文，只沉淀可复用的流程、提示词模板、边界控制和验证方式。
- 如果后续我确认，再把 Prompt 2 写入 E:\研究院科研成果管理系统\prompt.md。
~~~



~~~
请对 Step 4 做最后收尾归档。

不要进入 Step 5，不要实现新的业务功能，不要写成果登记代码。

请检查并在必要时更新：
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\tech-stack.md

收尾目标：
1. 确认 Step 4A / 4B / 4C / 4D 均已标记 DONE。
2. 确认 Step 4 整体已标记 DONE。
3. 记录 Step 4 已完成的稳定事实：
   - UserContext / roleIds
   - RBAC policy
   - 部门 scope
   - PolicyQueryFactory
   - 涉密授权
   - 附件访问策略
   - 审计脱敏
   - guard / decorator
   - HTTP 集成测试
4. 记录关键决策：
   - SYSTEM_ADMIN 不超级绕过。
   - SECRET / CONFIDENTIAL owner 不自动可读。
   - ATTACHMENT_DOWNLOAD 是单附件窄授权。
   - DEPARTMENT grant 只匹配当前 departmentId。
   - guard 显式 @UseGuards，不注册全局 APP_GUARD。
   - test-only controller 不成为运行时 API。
5. 记录验证命令和最终结果。
6. 记录未进入 Step 5，成果登记仍是 TODO。
7. 写清下一步是 Step 5 前计划确认。

安全要求：
- 不同步聊天全文。
- 不记录 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。
- 不修改 schema.prisma、migration 或 seed.cjs，除非只是确认状态，不做内容改动。

完成后请汇报：
1. 哪些文件被检查或更新。
2. Step 4 是否已完整归档。
3. Step 5 新对话建议读取哪些文件。
4. 是否可以关闭本 Step 4 对话，另开新对话进入 Step 5 计划确认。
~~~





