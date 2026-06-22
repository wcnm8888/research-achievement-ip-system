# 5、Step 5

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 5。

当前状态：
- Step 1 memory-bank 已完成。
- Step 2 项目脚手架已完成，install/lint/typecheck/test/build 均通过。
- Step 3 数据库 schema、migration、seed 已完成，Step 3 整体 DONE。
- Step 4 RBAC 与部门隔离已完成，Step 4A / 4B / 4C / 4D 均 DONE。
- Step 4 已实现 UserContext、RBAC、部门 scope、涉密授权、附件访问策略、审计脱敏、guard/decorator 和 HTTP 集成测试。
- Step 5 仍是 TODO。
- 当前只做 Step 5 前的计划确认，先不要写代码。

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
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts

本次只做 Step 5 的执行计划确认。

Step 5 目标：
- 实现成果登记一期流程的后端基础。
- 覆盖论文、专利、软著三类成果的创建草稿、读取详情、更新草稿、提交、作废、归档前置边界。
- 实现字段校验、normalized 唯一性校验、状态限制、权限接入和审计预留。
- 暂不做前端页面，暂不做审批流实际流转。

请输出：
1. Step 5 的任务等级和风险判断。
2. Step 5 是否需要拆成 5A / 5B / 5C / 5D。
3. 每个子步骤的范围、文件边界、完成定义和验证命令。
4. 成果模块的后端目录结构设计。
5. Achievement domain/service/controller/repository 的边界。
6. 论文、专利、软著三类详情的 DTO 与校验策略。
7. normalized 字段生成与唯一性校验策略。
8. 草稿、提交、作废、归档相关状态机边界。
9. 如何接入 Step 4 的权限 guard/policy。
10. 如何预留审计，不在 Step 5 重做完整审计模块。
11. 测试矩阵和测试数据策略。
12. 是否需要新增依赖，如 class-validator / class-transformer / zod，并说明用途。
13. 验证命令和质量门禁。
14. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 6 审批流。
- 不实现费用、提醒、附件存储、搜索、看板或前端页面。
- 不实现真实登录/SSO。
- 不修改已执行 migration。
- 不修改 schema.prisma，除非先停止并说明原因。
- 不修改 seed.cjs，除非先停止并说明原因。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

## Step 5A

~~~
先不要执行 Step 5A。

请先做 Step 5A 的执行计划确认，只读诊断，不修改文件、不写代码。

当前准备进入 Step 5A：Achievement 模块骨架、领域类型、DTO、normalized 纯函数、状态机纯函数与单元测试。

请读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\apps\api\package.json
- E:\研究院科研成果管理系统\apps\api\src
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity

本次只确认 Step 5A，不执行。

请输出：
1. Step 5A 的精确目标。
2. Step 5A 是否仍属于 M/L 项目中的高风险子步骤，风险点是什么。
3. 允许创建/修改的文件清单。
4. 明确禁止修改的文件清单。
5. Achievement 模块目录结构建议。
6. domain 层应包含哪些纯函数/类型/错误。
7. DTO 应包含哪些文件，各自职责是什么。
8. normalized 规则的精确定义。
9. 状态机规则的精确定义。
10. 单元测试矩阵。
11. 是否需要新增 class-validator / class-transformer；如果需要，说明是否放在 5A 执行时安装。
12. 验证命令。
13. 需要我确认的问题。

要求：
- 不写代码。
- 不修改文件。
- 不进入 5B/5C/5D。
- 不实现 repository/service/controller。
- 不接入 AppModule。
- 不修改 schema.prisma、migration、seed.cjs。
- 不实现审批流、费用、提醒、附件、搜索、看板、前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 5A。

我确认以下 5A 决策：
- 允许在 Step 5A 安装 class-validator / class-transformer，并仅因此修改 apps/api/package.json 和 pnpm-lock.yaml。
- 不安装 zod。
- DEPARTMENT_REJECTED -> DRAFT / PENDING_DEPARTMENT_REVIEW 只作为状态机预留规则；真实驳回产生逻辑留到 Step 6。
- normalized 规则中，专利号和软著号确认保留 /、.、括号等可能有业务含义的字符，不只保留字母数字；移除空白和常见连接符即可。
- Step 5A 暂不创建 achievements.module.ts，等 5B/5D 再建立 Nest module；本步只做 domain/DTO 无副作用部分。

本次只执行 Step 5A，不进入 5B/5C/5D，也不进入 Step 6。

Step 5A 范围：
- 创建 apps/api/src/achievements/domain/**
- 创建 apps/api/src/achievements/dto/**
- 定义 Achievement 相关领域类型、状态、动作、错误。
- 实现 normalized 纯函数。
- 实现状态机纯函数。
- 定义 create/update/action/detail/contributor DTO。
- 编写 domain/DTO 单元测试。

允许修改：
- apps/api/src/achievements/**
- apps/api/package.json，仅用于 class-validator / class-transformer
- pnpm-lock.yaml，仅用于 class-validator / class-transformer
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md

禁止修改：
- prisma/schema.prisma
- prisma/migrations/**
- prisma/seed.cjs
- apps/api/src/app.module.ts
- apps/api/src/main.ts
- apps/web/**
- apps/api/src/authorization/**
- apps/api/src/identity/**
- apps/api/src/database/**

执行要求：
- 不创建 repository。
- 不创建 service。
- 不创建 controller。
- 不创建路由。
- 不接入 AppModule。
- 不访问数据库。
- 不实现审批流、费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

如需新增依赖，先执行：
- corepack pnpm --filter @research-ip/api add class-validator class-transformer

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 5A 实现了什么。
3. 新增依赖及原因。
4. 明确没有进入哪些范围。
5. 哪些验证通过。
6. 哪些验证失败及原因。
7. 是否可以进入 Step 5B 前计划确认。
~~~

## Step 5B

~~~
Step 5A 已完成，现在准备进入 Step 5B 前计划确认。

本次只做 Step 5B 执行计划确认，不修改文件、不写代码。

当前状态：
- Step 5A 已完成。
- 已新增 Achievement domain/DTO/normalized/state-machine 单元测试。
- 已新增 class-validator / class-transformer。
- api test/typecheck/build/lint 均通过。
- 尚未创建 repository/service/controller/route。
- 尚未创建 achievements.module.ts。
- 尚未接入 AppModule。
- 尚未访问数据库。
- 未修改 schema.prisma、migration、seed.cjs。
- Step 6 审批流仍未开始。

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
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

Step 5B 目标草案：
- 创建 achievements.module.ts，但暂不接入 AppModule。
- 创建 AchievementRepository，封装 Prisma 读写。
- 创建 AchievementService，编排创建草稿、读取详情、更新草稿。
- 支持论文、专利、软著三类成果的草稿创建。
- 支持读取详情时复用 Step 4 的权限/可见性策略。
- 支持更新 DRAFT 草稿。
- 实现 normalized 唯一性预检查，并处理 Prisma P2002 唯一冲突。
- 使用事务写入 achievement 主表、对应 detail、contributors。
- 编写 repository/service 单元测试或最小数据库相关测试策略。

请输出：
1. Step 5B 的精确目标。
2. Step 5B 的风险判断。
3. 是否需要再拆成 5B-1 / 5B-2。
4. 允许创建/修改的文件清单。
5. 明确禁止修改的文件清单。
6. AchievementRepository 方法设计。
7. AchievementService 方法设计。
8. 创建草稿的数据写入事务边界。
9. 读取详情的权限策略如何复用 Step 4。
10. 更新草稿的状态、owner、权限边界。
11. normalized 唯一性预检查和 P2002 映射策略。
12. 测试数据策略：是否使用测试内 fixture，是否访问本地开发数据库。
13. 单元测试/集成测试矩阵。
14. 验证命令。
15. 需要我确认的问题。

要求：
- 只做计划确认，不写代码。
- 不进入 5C/5D。
- 不实现 submit/void/archive 状态动作。
- 不创建 controller/route。
- 不接入 AppModule。
- 不实现 Step 6 审批流。
- 不修改 schema.prisma。
- 不修改 migration。
- 不修改 seed.cjs，除非先停下说明原因。
- 不新增依赖，除非先说明用途并等待确认。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认拆分 Step 5B，先只执行 Step 5B-1，不执行 5B-2，不进入 5C/5D/Step 6。

我确认以下决策：
- Step 5B 更新草稿时暂不允许更新 contributors，不执行 deleteMany；contributors 更新留到后续单独确认。
- 创建成果时 departmentId 强制使用 context.departmentId，忽略/拒绝 DTO 中的 departmentId。
- 更新 DRAFT 草稿时 version += 1。
- 读取涉密成果时，如果基础可见但缺少 SECRET_READ grant，service 层使用 FORBIDDEN 语义；HTTP 403/404 映射留到 5D。
- Step 5B 不访问真实数据库，只使用 mock/fake repository 或 fake Prisma client 测试。
- 不新增依赖。

本次只执行 Step 5B-1：Repository + mapper + normalized conflict 预检查基础。

Step 5B-1 范围：
- 创建 achievements.module.ts，但不接入 AppModule。
- 创建 achievement.repository.ts。
- 必要时新增 domain 内部类型/错误/mapper 文件。
- 定义 repository 输入/输出类型。
- 实现 createDraft 的 Prisma transaction 写入形状：
  - achievement 主表
  - 对应一种 detail
  - contributors 创建
- 实现 findDetailById / findDetailByIdWhere。
- 实现 findResourceGrantsForAchievement。
- 实现 findNormalizedConflict。
- 实现 isPrismaUniqueConflict / P2002 基础识别。
- 编写 repository 单元测试或 fake Prisma 测试，验证调用形状和冲突识别。

允许修改：
- apps/api/src/achievements/**
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md

禁止修改：
- prisma/schema.prisma
- prisma/migrations/**
- prisma/seed.cjs
- apps/api/src/app.module.ts
- apps/api/src/main.ts
- apps/web/**
- apps/api/src/authorization/**
- apps/api/src/identity/**
- apps/api/src/database/**
- apps/api/package.json
- pnpm-lock.yaml

执行要求：
- 不创建 service。
- 不创建 controller/route。
- 不接入 AppModule。
- 不实现 create/read/update 业务编排。
- 不实现 submit/void/archive。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不实现审批流、费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 5B-1 实现了什么。
3. repository 方法有哪些。
4. 明确没有进入哪些范围。
5. 是否执行了任何真实数据库写入，预期应为没有。
6. 哪些验证通过。
7. 哪些验证失败及原因。
8. 是否可以进入 Step 5B-2 前计划确认。
~~~

~~~
Step 5B-1 已完成，现在准备进入 Step 5B-2 前计划确认。

本次只做 Step 5B-2 执行计划确认，不修改文件、不写代码。

当前状态：
- Step 5A 已完成：domain/DTO/normalized/state-machine 与测试完成。
- Step 5B-1 已完成：AchievementsModule、AchievementRepository、Prisma mapper、repository 类型/错误与 fake Prisma repository 测试完成。
- AchievementsModule 仅导入 DatabaseModule 并导出 repository，未接入 AppModule。
- 尚未创建 AchievementService。
- 尚未创建 controller/route。
- 尚未接入 AppModule。
- 未访问真实数据库。
- 未修改 schema.prisma、migration、seed.cjs。
- 未执行 deleteMany 或任何数据清理。
- api test/typecheck/build/lint/prisma:validate 均通过。

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
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

Step 5B-2 目标草案：
- 创建 AchievementService。
- 在 AchievementsModule 中注册并导出 service，但不接入 AppModule。
- 编排 createDraft(context, dto)。
- 编排 getDetail(context, achievementId)。
- 编排 updateDraft(context, achievementId, dto)。
- 创建草稿时 ownerUserId/createdById/updatedById 使用 context.userId，departmentId 强制使用 context.departmentId。
- 创建/更新时复用 Step 5A normalized 规则，并调用 repository.findNormalizedConflict 做预检查。
- 捕获 repository/Prisma 唯一冲突并映射为业务冲突错误。
- 读取详情时复用 PolicyQueryFactory 与 SecretAccessPolicyService。
- 更新草稿时只允许 owner、DRAFT、具备 achievement:update_own；version += 1。
- 不更新 contributors，不执行 deleteMany。
- 使用 repository mock 做 service 单元测试，不访问真实数据库。

请输出：
1. Step 5B-2 的精确目标。
2. 风险判断。
3. 允许创建/修改的文件清单。
4. 明确禁止修改的文件清单。
5. AchievementService 方法设计。
6. service 层错误类型设计。
7. createDraft 的权限、normalized、冲突、写入编排顺序。
8. getDetail 的基础可见性和涉密授权判断顺序。
9. updateDraft 的 owner、权限、状态、version、normalized 冲突判断顺序。
10. repository 错误/P2002 到 service 业务错误的映射策略。
11. service 单元测试矩阵。
12. 是否需要新增依赖，预期不需要。
13. 验证命令。
14. 需要我确认的问题。

要求：
- 只做计划确认，不写代码。
- 不进入 5C/5D。
- 不实现 submit/void/archive。
- 不创建 controller/route。
- 不接入 AppModule。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不修改 schema.prisma、migration、seed.cjs。
- 不修改 authorization/identity/database/web。
- 不新增依赖。
- 不实现审批流、费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 5B-2。

我确认以下决策：
- createDraft 中如果 DTO 传入 departmentId 且不同于 context.departmentId，直接拒绝；实际写入始终使用 context.departmentId。
- 允许 Step 5B-2 最小扩展 AchievementRepository.updateDraft，用于完成 service.updateDraft 编排。
- updateDraft 中如果 DTO 出现 contributors，直接拒绝并返回 unsupported operation；本步不更新 contributors，不执行 deleteMany。
- updateDraft 只允许 DRAFT、owner、具备 achievement:update_own。
- updateDraft 时 version += 1。
- 涉密成果基础可见但缺少 SECRET_READ grant 时，service 层使用 FORBIDDEN 语义。
- 本步不访问真实数据库，只使用 repository mock / fake 测试。
- 不新增依赖。

本次只执行 Step 5B-2，不进入 5C/5D，也不进入 Step 6。

Step 5B-2 范围：
- 创建 AchievementService。
- 在 AchievementsModule 注册并导出 AchievementService，但不接入 AppModule。
- 实现 createDraft(context, dto)。
- 实现 getDetail(context, achievementId)。
- 实现 updateDraft(context, achievementId, dto)。
- 必要时新增 achievement-service.errors.ts / achievement-service.types.ts。
- 最小扩展 AchievementRepository.updateDraft。
- 使用 repository mock 编写 service 单元测试。
- 如需同步更新 repository 测试，只限 updateDraft 调用形状和 P2002 映射。

允许修改：
- apps/api/src/achievements/achievement.service.ts
- apps/api/src/achievements/achievement.service.spec.ts
- apps/api/src/achievements/achievements.module.ts
- apps/api/src/achievements/achievement.repository.ts
- apps/api/src/achievements/achievement.repository.spec.ts
- apps/api/src/achievements/domain/**
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md

禁止修改：
- prisma/schema.prisma
- prisma/migrations/**
- prisma/seed.cjs
- apps/api/src/app.module.ts
- apps/api/src/main.ts
- apps/web/**
- apps/api/src/authorization/**
- apps/api/src/identity/**
- apps/api/src/database/**
- apps/api/package.json
- pnpm-lock.yaml

执行要求：
- 不创建 controller/route。
- 不接入 AppModule。
- 不实现 submit/void/archive。
- 不进入 Step 6 审批流。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不更新 contributors。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 5B-2 实现了什么。
3. service 方法有哪些。
4. repository 是否仅做了 updateDraft 最小扩展。
5. 明确没有进入哪些范围。
6. 是否访问真实数据库，预期应为没有。
7. 哪些验证通过。
8. 哪些验证失败及原因。
9. 是否可以进入 Step 5C 前计划确认。
~~~

## Step 5C

~~~
Step 5B-2 已完成，现在准备进入 Step 5C 前计划确认。

本次只做 Step 5C 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 5A 已完成：Achievement domain/DTO/normalized/state-machine 与测试完成。
- Step 5B-1 已完成：AchievementsModule、AchievementRepository、Prisma mapper、repository 类型/错误与 fake Prisma repository 测试完成。
- Step 5B-2 已完成：AchievementService createDraft/getDetail/updateDraft 与 service 单元测试完成。
- AchievementsModule 已注册并导出 repository/service，但未接入 AppModule。
- 尚未创建 controller/route。
- 尚未实现 submit/void/archive。
- 尚未进入 Step 6 审批流。
- 未访问真实数据库。
- 未修改 schema.prisma、migration、seed.cjs。
- api test/typecheck/build/lint/prisma:validate 均通过。

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
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

Step 5C 目标草案：
- 在 AchievementService 中实现成果自身状态动作：
  - submitDraft(context, achievementId)
  - voidAchievement(context, achievementId, dto)
  - archiveAchievement(context, achievementId)
- 最小扩展 AchievementRepository，支持状态字段更新。
- submitDraft：仅允许 owner + DRAFT + achievement:submit，将状态更新为 PENDING_DEPARTMENT_REVIEW，设置 submittedById/submittedAt，version += 1。
- voidAchievement：本阶段只允许 owner 作废自己的 DRAFT，设置 VOIDED、voidedById、voidedAt、voidReason，version += 1。
- archiveAchievement：只实现 PENDING_ARCHIVE -> ARCHIVED 的前置边界，要求 achievement:archive，设置 archivedById/archivedAt，version += 1。
- 编写 service/repository 单元测试或 fake Prisma 测试。
- 不创建 workflow instance/task/action。
- 不实现部门审核、驳回、通过、待办。
- 不创建 controller/route。
- 不接入 AppModule。
- 不访问真实数据库。

请输出：
1. Step 5C 的精确目标。
2. 风险判断。
3. 是否需要拆成 5C-1 / 5C-2。
4. 允许创建/修改的文件清单。
5. 明确禁止修改的文件清单。
6. AchievementService 状态动作方法设计。
7. AchievementRepository 状态更新方法设计。
8. submitDraft 的权限、状态、字段更新、冲突处理顺序。
9. voidAchievement 的权限、状态、字段更新、边界。
10. archiveAchievement 的权限、状态、字段更新、边界。
11. 如何确保不进入 Step 6 审批流。
12. service/repository 测试矩阵。
13. 是否需要新增依赖，预期不需要。
14. 验证命令。
15. 需要我确认的问题。

要求：
- 只做计划确认，不写代码。
- 不进入 5D。
- 不创建 controller/route。
- 不接入 AppModule。
- 不实现 Step 6 审批流。
- 不创建 workflow instance/task/action。
- 不实现部门审核、驳回、通过、待办。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不修改 schema.prisma、migration、seed.cjs。
- 不修改 authorization/identity/database/web。
- 不新增依赖。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 5C。

我确认以下决策：
- voidAchievement 使用 achievement:update_own 作为权限要求；当前不新增 achievement:void。
- 状态动作方法返回最小 AchievementStateResult，不返回完整 AchievementAggregate。
- repository 状态更新采用 expectedStatus 条件更新，防止重复提交、作废、归档的并发竞态。
- Step 5C 不拆分，一次完成 service/repository 状态动作和单元测试。
- 不新增依赖。
- 不访问真实数据库。

本次只执行 Step 5C，不进入 5D，也不进入 Step 6。

Step 5C 范围：
- 在 AchievementService 中实现：
  - submitDraft(context, achievementId)
  - voidAchievement(context, achievementId, dto)
  - archiveAchievement(context, achievementId)
- 最小扩展 AchievementRepository：
  - findStateByIdWhere
  - findStateById
  - transitionStatus
- submitDraft：
  - 要求 achievement:submit
  - 只允许 owner + DRAFT
  - 状态变为 PENDING_DEPARTMENT_REVIEW
  - 设置 submittedById/submittedAt/updatedById
  - version += 1
  - 不创建 workflow
- voidAchievement：
  - 要求 achievement:update_own
  - 只允许 owner + DRAFT
  - 状态变为 VOIDED
  - 设置 voidedById/voidedAt/voidReason/updatedById
  - version += 1
- archiveAchievement：
  - 要求 achievement:archive
  - 只允许 PENDING_ARCHIVE -> ARCHIVED
  - 设置 archivedById/archivedAt/updatedById
  - version += 1
  - 不产生 PENDING_ARCHIVE，不处理审批通过
- 编写 service/repository 单元测试或 fake Prisma 测试。

允许修改：
- apps/api/src/achievements/achievement.service.ts
- apps/api/src/achievements/achievement.service.spec.ts
- apps/api/src/achievements/achievement.repository.ts
- apps/api/src/achievements/achievement.repository.spec.ts
- apps/api/src/achievements/domain/achievement-repository.types.ts
- apps/api/src/achievements/domain/achievement-prisma.mapper.ts
- apps/api/src/achievements/domain/achievement-repository.errors.ts
- apps/api/src/achievements/domain/achievement-service.errors.ts
- apps/api/src/achievements/domain/achievement-state-machine.ts，仅在需要补 helper 时允许，不改变既有状态规则
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md

禁止修改：
- prisma/schema.prisma
- prisma/migrations/**
- prisma/seed.cjs
- apps/api/src/app.module.ts
- apps/api/src/main.ts
- apps/web/**
- apps/api/src/authorization/**
- apps/api/src/identity/**
- apps/api/src/database/**
- apps/api/package.json
- pnpm-lock.yaml

执行要求：
- 不创建 controller/route。
- 不接入 AppModule。
- 不创建 workflow 模块。
- 不写入 workflow_instances、workflow_tasks、workflow_actions。
- 不实现部门审核、驳回、通过、待办。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不更新 contributors。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

完成后做边界检查：
- 确认 achievements 目录下没有新增 controller/route。
- 确认没有出现 workflowInstance、workflowTask、workflowAction。
- 确认没有 deleteMany。
- 确认没有访问真实数据库。

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 5C 实现了什么。
3. 三个状态动作的权限和状态边界。
4. repository 是否使用 expectedStatus 条件更新。
5. 明确没有进入哪些范围。
6. 是否访问真实数据库，预期应为没有。
7. 边界检查结果。
8. 哪些验证通过。
9. 哪些验证失败及原因。
10. 是否可以进入 Step 5D 前计划确认。
~~~

## Step 5D

Step 5D-1

~~~
Step 5C 已完成，现在准备进入 Step 5D 前计划确认。

本次只做 Step 5D 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 5A 已完成：Achievement domain/DTO/normalized/state-machine 与测试完成。
- Step 5B-1 已完成：AchievementsModule、AchievementRepository、Prisma mapper、repository 类型/错误与 fake Prisma repository 测试完成。
- Step 5B-2 已完成：AchievementService createDraft/getDetail/updateDraft 与 service 单元测试完成。
- Step 5C 已完成：submitDraft/voidAchievement/archiveAchievement 与状态更新 repository 方法完成。
- AchievementsModule 已注册并导出 repository/service，但尚未接入 AppModule。
- 尚未创建 controller/route。
- 尚未暴露 HTTP API。
- 尚未访问真实数据库。
- 未修改 schema.prisma、migration、seed.cjs。
- api test/typecheck/build/lint/prisma:validate 均通过。

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
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts
- E:\研究院科研成果管理系统\apps\api\src\main.ts

Step 5D 目标草案：
- 创建 AchievementsController。
- 将 AchievementsModule 接入 AppModule。
- 显式使用 UserContextGuard / PermissionGuard，不注册全局 APP_GUARD。
- 使用 @CurrentUser() / @RequirePermissions()。
- 暴露最小后端 API：
  - POST /achievements
  - GET /achievements/:id
  - PATCH /achievements/:id
  - POST /achievements/:id/submit
  - POST /achievements/:id/void
  - POST /achievements/:id/archive
- 建立 HTTP 层错误映射：
  - 无用户上下文 -> 401
  - 权限不足 -> 403
  - 不存在/不可见 -> 404 或按计划确认
  - normalized 冲突 -> 409
  - 非法状态/不支持操作 -> 422 或 409，需确认
- 编写 HTTP 集成测试，使用 service mock 或 provider override，不访问真实数据库。
- 完成 Step 5 整体收尾归档。
- 不实现前端页面。
- 不进入 Step 6 审批流。
- 不实现真实 DB 集成测试。

请输出：
1. Step 5D 的精确目标。
2. 风险判断。
3. 是否需要拆成 5D-1 / 5D-2。
4. 允许创建/修改的文件清单。
5. 明确禁止修改的文件清单。
6. Controller 路由设计。
7. guard/decorator 接入设计。
8. HTTP 错误映射策略。
9. HTTP 集成测试策略：是否使用 service mock/provider override，如何避免真实数据库。
10. 每个路由的测试矩阵。
11. 如何确认没有进入 Step 6。
12. Step 5 整体收尾归档需要更新哪些 memory-bank 文件。
13. 是否需要新增依赖，预期不需要。
14. 验证命令。
15. 需要我确认的问题。

要求：
- 只做计划确认，不写代码。
- 不实现 Step 6 审批流。
- 不创建 workflow module。
- 不写入 workflow_instances、workflow_tasks、workflow_actions。
- 不实现部门审核、驳回、通过、待办。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不修改 schema.prisma、migration、seed.cjs。
- 不修改 authorization/identity/database/web。
- 不新增依赖，除非先说明原因并等待确认。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认拆分 Step 5D，先只执行 Step 5D-1，不执行 5D-2，不做 Step 5 整体收尾。

我确认以下决策：
- 同意拆成 5D-1 / 5D-2。
- AchievementInvalidStateError 映射为 409 Conflict。
- AchievementAccessDeniedError 映射为 403 Forbidden，不隐藏成 404。
- 不修改 main.ts；DTO 校验使用 controller 级 ValidationPipe。
- GET /achievements/:id 入口静态权限使用 achievement:read_own；资源可见性继续交给 service 内部 PolicyQueryFactory / secret policy。
- 不新增依赖。
- 不访问真实数据库。

本次只执行 Step 5D-1：controller、HTTP 错误映射、controller 级 ValidationPipe、HTTP 集成测试。
不接入 AppModule，不做 Step 5 整体 DONE 归档。

Step 5D-1 范围：
- 创建 apps/api/src/achievements/achievement.controller.ts。
- 创建 apps/api/src/achievements/achievement.controller.spec.ts。
- 在 AchievementsModule 中注册 controller，但不接入 AppModule。
- controller 显式使用 UserContextGuard / PermissionGuard。
- controller 使用 @CurrentUser() / @RequirePermissions()。
- controller 级使用 ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })。
- 暴露 6 个路由：
  - POST /achievements
  - GET /achievements/:id
  - PATCH /achievements/:id
  - POST /achievements/:id/submit
  - POST /achievements/:id/void
  - POST /achievements/:id/archive
- 使用 service mock / provider override 做 HTTP 集成测试，不使用真实 repository，不访问真实数据库。
- 完成 controller 层 service error 到 HTTP error 的映射测试。

错误映射确认：
- UserContextGuard 无上下文 -> 401。
- PermissionGuard 静态权限不足 -> 403。
- AchievementPermissionDeniedError -> 403。
- AchievementAccessDeniedError -> 403。
- AchievementNotFoundError -> 404。
- AchievementConflictError -> 409。
- AchievementInvalidStateError -> 409。
- AchievementUnsupportedOperationError -> 422。
- AchievementInvalidPayloadError -> 422。
- DTO ValidationPipe 错误 -> 400。

允许修改：
- apps/api/src/achievements/achievement.controller.ts
- apps/api/src/achievements/achievement.controller.spec.ts
- apps/api/src/achievements/achievements.module.ts
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md
- memory-bank/decisions.md，仅用于记录 HTTP 错误码决策

禁止修改：
- prisma/schema.prisma
- prisma/migrations/**
- prisma/seed.cjs
- apps/api/src/app.module.ts
- apps/api/src/main.ts
- apps/api/src/authorization/**
- apps/api/src/identity/**
- apps/api/src/database/**
- apps/web/**
- apps/api/package.json
- pnpm-lock.yaml

执行要求：
- 不执行 5D-2。
- 不接入 AppModule。
- 不注册全局 APP_GUARD。
- 不修改 main.ts。
- 不实现 Step 6 审批流。
- 不创建 workflow module。
- 不写入 workflow_instances、workflow_tasks、workflow_actions。
- 不实现部门审核、驳回、通过、待办。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

完成后做边界检查：
- rg -n "workflowInstance|workflowTask|workflowAction|workflow_instances|workflow_tasks|workflow_actions" apps/api/src/achievements
- rg -n "deleteMany" apps/api/src/achievements
- rg -n "APP_GUARD" apps/api/src

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 5D-1 实现了什么。
3. 6 个路由和权限映射。
4. HTTP 错误码映射结果。
5. controller 是否使用 service mock，是否访问真实数据库。
6. 明确没有进入哪些范围。
7. 边界检查结果。
8. 哪些验证通过。
9. 哪些验证失败及原因。
10. 是否可以进入 Step 5D-2 前计划确认。
~~~

Step 5D-2

~~~
注意：上一轮对话发生过上下文压缩，请不要依赖聊天记忆。请以 memory-bank 文件和下面我提供的状态为准。

Step 5D-1 已完成，现在准备进入 Step 5D-2 前计划确认。

本次只做 Step 5D-2 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 5A 已完成：Achievement domain/DTO/normalized/state-machine 与测试完成。
- Step 5B-1 已完成：AchievementsModule、AchievementRepository、Prisma mapper、repository 类型/错误与 fake Prisma repository 测试完成。
- Step 5B-2 已完成：AchievementService createDraft/getDetail/updateDraft 与 service 单元测试完成。
- Step 5C 已完成：submitDraft/voidAchievement/archiveAchievement 与状态更新 repository 方法完成。
- Step 5D-1 已完成：AchievementController、controller 局部 ValidationPipe、HTTP 错误映射、service mock HTTP 测试完成。
- AchievementsModule 已注册 controller/repository/service，但尚未接入 AppModule。
- app.module.ts / main.ts 中尚未出现 AchievementsModule / AchievementController。
- 尚未执行 5D-2。
- 尚未做 Step 5 整体收尾。
- 未访问真实数据库。
- 未修改 schema.prisma、migration、seed.cjs。
- api test/typecheck/build/lint/prisma:validate 均通过。

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
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts

Step 5D-2 目标草案：
- 将 AchievementsModule 接入 AppModule。
- 不注册全局 APP_GUARD。
- 不修改 main.ts。
- 补充 AppModule 级 HTTP 集成测试或最小运行时接入测试，使用 service mock/provider override，避免真实数据库。
- 复核 6 个 achievements API 已可通过模块接入。
- 做 Step 5 整体收尾归档：
  - Step 5A / 5B-1 / 5B-2 / 5C / 5D-1 / 5D-2 标记 DONE。
  - Step 5 整体标记 DONE。
  - 明确 Step 6 仍为 TODO，未进入审批流。
- 更新 progress.md / evidence.md / implementation-plan.md，必要时更新 architecture.md / decisions.md。

请输出：
1. Step 5D-2 的精确目标。
2. 风险判断。
3. 允许创建/修改的文件清单。
4. 明确禁止修改的文件清单。
5. AppModule 接入方式。
6. AppModule 级测试策略，如何避免真实数据库。
7. Step 5 整体收尾归档清单。
8. 如何确认没有进入 Step 6。
9. 验证命令。
10. 需要我确认的问题。

要求：
- 只做计划确认，不写代码。
- 不实现 Step 6 审批流。
- 不创建 workflow module。
- 不写入 workflow_instances、workflow_tasks、workflow_actions。
- 不实现部门审核、驳回、通过、待办。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不修改 schema.prisma、migration、seed.cjs。
- 不修改 main.ts。
- 不修改 authorization/identity/database/web。
- 不新增依赖。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 5D-2。

我确认以下决策：
- 允许修改 apps/api/src/app.module.ts，将 AchievementsModule 接入根 AppModule。
- AppModule 级测试文件命名为 apps/api/src/achievements/achievement.app-module.spec.ts。
- Step 5 整体收尾允许同步更新 architecture.md 和 decisions.md，但只记录稳定事实、架构边界和决策，不同步聊天全文。
- 不注册全局 APP_GUARD。
- 不修改 main.ts。
- 不新增依赖。
- 不访问真实数据库。

本次只执行 Step 5D-2，并完成 Step 5 整体收尾归档。
不进入 Step 6。

Step 5D-2 范围：
- 修改 apps/api/src/app.module.ts，导入 AchievementsModule。
- 新增 AppModule 级 HTTP 测试：
  - apps/api/src/achievements/achievement.app-module.spec.ts
- AppModule 级测试使用 AppModule + provider override：
  - override AchievementService 为 mock
  - override PrismaService 为 fake，只提供 identity adapter 读取测试用户上下文所需能力
- 保留真实 UserContextGuard / PermissionGuard。
- 验证通过 AppModule 可访问 6 个 achievements 路由。
- 验证 GET /health 仍可用。
- 验证无用户上下文为 401。
- 验证权限不足为 403。
- 完成 Step 5 整体收尾归档。

允许修改：
- apps/api/src/app.module.ts
- apps/api/src/achievements/achievement.app-module.spec.ts
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md
- memory-bank/architecture.md
- memory-bank/decisions.md

禁止修改：
- prisma/schema.prisma
- prisma/migrations/**
- prisma/seed.cjs
- apps/api/src/main.ts
- apps/api/src/authorization/**
- apps/api/src/identity/**
- apps/api/src/database/**
- apps/web/**
- apps/api/package.json
- pnpm-lock.yaml
- 任何 workflow module / workflow service / workflow controller 文件

执行要求：
- 不修改 achievement.controller.ts / achievement.service.ts / achievement.repository.ts，除非 AppModule 接入测试暴露必须修复的 wiring 问题；如发生，先停下说明原因。
- 不注册 APP_GUARD。
- 不引入全局 ValidationPipe。
- 不实现 Step 6 审批流。
- 不创建 workflow module。
- 不写入 workflow_instances、workflow_tasks、workflow_actions。
- 不实现部门审核、驳回、通过、待办。
- 不访问真实数据库。
- 不运行 migrate，不运行 seed。
- 不执行 deleteMany 或任何数据清理。
- 不实现费用、提醒、附件、搜索、看板或前端页面。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

完成后执行边界检查：
- rg -n "workflowInstance|workflowTask|workflowAction|workflow_instances|workflow_tasks|workflow_actions" apps/api/src/achievements apps/api/src/app.module.ts
- rg -n "WorkflowModule|workflow" apps/api/src
- rg -n "deleteMany" apps/api/src/achievements
- rg -n "APP_GUARD" apps/api/src
- rg -n "AchievementsModule|AchievementController" apps/api/src/main.ts

收尾归档要求：
- progress.md 标记 5D-2 DONE、Step 5 整体 DONE、Step 6 TODO。
- evidence.md 记录 5D-2 证据、Step 5 总体验证命令和边界检查。
- implementation-plan.md 标记 Step 5D-2 和 Step 5 DONE，保持 Step 6 TODO。
- architecture.md 记录 Achievement 后端一期 API 已接入根模块，审批流仍属于 Step 6。
- decisions.md 记录根模块接入但不注册全局 guard、不改 main.ts 的决策。

最后汇报：
1. 创建/修改了哪些文件。
2. AppModule 如何接入 AchievementsModule。
3. AppModule 级测试覆盖了什么。
4. 是否访问真实数据库，预期应为没有。
5. Step 5 是否已整体 DONE。
6. Step 6 是否仍为 TODO。
7. 边界检查结果。
8. 哪些验证通过。
9. 哪些验证失败及原因。
10. 下一步是否只能进入 Step 6 前计划确认。
~~~

~~~
请对 Step 5 做最终收尾归档复核。

注意：不要继续实现 Step 6，不要写业务代码，不要修改 apps/api 源码。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md

当前事实：
- Step 5A / 5B-1 / 5B-2 / 5C / 5D-1 / 5D-2 均已完成。
- Step 5 整体 DONE。
- Step 6 仍为 TODO，未开始。
- AchievementsModule 已接入 AppModule。
- 未实现审批流、workflow instance/task/action。
- 未实现前端页面、费用、提醒、附件、搜索、看板。
- 最新验证全部通过：
  - corepack pnpm --filter @research-ip/api test
  - corepack pnpm --filter @research-ip/api typecheck
  - corepack pnpm --filter @research-ip/api build
  - corepack pnpm lint
  - corepack pnpm prisma:validate

本次任务：
1. 复核 implementation-plan/progress/evidence/decisions/architecture 中 Step 5 状态是否一致。
2. 如果有遗漏，只更新 memory-bank 文档。
3. 明确记录 Step 5 已完成的稳定事实。
4. 明确记录 Step 5 未进入的范围。
5. 明确记录 Step 6 仍为 TODO。
6. 记录验证命令和边界检查结果。
7. 不同步聊天全文，只沉淀稳定事实、决策、证据和后续边界。

允许修改：
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md

禁止修改：
- apps/**
- prisma/**
- package.json
- pnpm-lock.yaml
- .env
- 任何源码、测试、配置、migration、seed

要求：
- 不运行 migrate。
- 不运行 seed。
- 不访问真实数据库。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
- 不进入 Step 6。
- 不实现任何新功能。

完成后汇报：
1. 哪些 memory-bank 文件被更新。
2. Step 5 是否已完整归档为 DONE。
3. Step 6 是否仍为 TODO。
4. 是否发现状态不一致。
5. 是否可以新开 Step 6 前计划确认。
~~~



