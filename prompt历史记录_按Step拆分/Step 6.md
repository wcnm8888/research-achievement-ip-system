# 6、Step 6

~~~
Step 5 已完成并归档为 DONE。现在准备进入 Step 6 前计划确认。

本次只做 Step 6 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 1 memory-bank DONE。
- Step 2 脚手架 DONE。
- Step 3 数据库 schema/migration/seed DONE。
- Step 4 RBAC 与部门隔离 DONE。
- Step 5 成果登记一期后端流程 DONE：
  - domain/DTO/normalized/state-machine
  - repository/service
  - submit/void/archive 成果自身状态动作
  - controller/HTTP 错误映射
  - AchievementsModule 已接入 AppModule
  - HTTP mock 测试通过
- Step 6 仍为 TODO，尚未开始。
- 当前没有实现审批流、workflow instance/task/action。
- 未实现部门审核、驳回、通过、待办。
- 未实现前端页面。
- 最新验证 test/typecheck/build/lint/prisma:validate 均通过。

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
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts

Step 6 目标草案：
- 实现基础审批流。
- 覆盖科研人员提交后，部门科研秘书初审，系统管理员归档的最小流程。
- 建立 workflow instance / task / action 的后端基础。
- 将 Step 5 的 PENDING_DEPARTMENT_REVIEW 与后续审批状态流转衔接。
- 支持通过、驳回、归档前置状态推进。
- 写入必要的审批记录和最小审计预留。
- 不做前端页面。
- 不做费用、提醒、附件、搜索、看板。
- 不改已执行 migration，除非先明确需要新增 migration 并说明原因。

请输出：
1. Step 6 的任务等级和风险判断。
2. Step 6 是否需要拆成 6A / 6B / 6C / 6D。
3. 每个子步骤的范围、文件边界、完成定义和验证命令。
4. 当前 schema 是否已足够支持 Step 6；如果不足，说明是否需要新增 migration。
5. workflow 模块目录结构建议。
6. workflow instance/task/action 的职责边界。
7. Achievement 状态与 workflow 状态如何衔接。
8. 部门科研秘书与系统管理员的权限边界。
9. 审批通过/驳回/归档的状态机边界。
10. 如何避免绕过 Step 4 权限体系。
11. 测试矩阵和测试数据策略。
12. 是否需要访问真实数据库；如果需要，如何避免破坏数据。
13. 是否需要新增依赖。
14. 验证命令和质量门禁。
15. 需要我确认的问题。

要求：
- 先不写代码。
- 不修改文件。
- 不直接实现 Step 6。
- 不修改已执行 migration。
- 不运行 migrate、seed。
- 不访问或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
- 不实现前端页面。
- 不实现费用、提醒、附件、搜索、看板。
- 如果 Step 6 太大，请先拆分，等我确认后再执行。
~~~

## Step 6A

~~~
确认执行 Step 6A。

本次只执行 Step 6A：Workflow domain / DTO / repository 基础。
不进入 6B / 6C / 6D，不接入 AppModule，不创建 controller，不实现 HTTP API，不访问真实数据库，不运行 migrate/seed。

我确认：
- Step 6 先采用“给部门内具体科研秘书用户生成待办”的最小模型。
- 当前不新增 migration。
- Step 6A 只做 workflow 无 HTTP 基础层和 fake Prisma repository 测试。
- 不做前端、费用、提醒、附件、搜索、看板。
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
- 如有重要取舍，再更新 decisions.md / architecture.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6A 实现了什么。
3. 明确没有进入哪些范围。
4. 哪些验证通过。
5. 哪些验证失败及原因。
6. 是否可以进入 Step 6B 前计划确认。
~~~

## Step 6B

~~~
Step 6A 已完成并归档。现在进入 Step 6B 前计划确认。

本次只做 Step 6B 执行计划确认，不修改文件、不写代码、不访问数据库。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity

请输出：
1. Step 6B 是否应拆成 6B-1 / 6B-2 / 6B-3。
2. 每个子步骤的范围、文件边界、完成定义。
3. submitDraft 与 workflow instance/task/action 如何衔接。
4. approve / reject 如何保证 task、workflow、achievement 状态一致。
5. 是否需要事务边界调整。
6. 如何避免绕过 Step 4 权限体系。
7. 测试矩阵和 mock/fake 策略。
8. 是否需要真实数据库、migration、seed 或新增依赖。
9. 验证命令。
10. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 6C/6D。
- 不创建 controller / HTTP API。
- 不接入 AppModule。
- 不访问真实数据库，不运行 migrate/seed。
- 不修改 schema/migration/seed/dependency。
- 不实现前端、费用、提醒、附件、搜索、看板。
~~~

Step 6B-1

~~~
确认执行 Step 6B-1。

本次只执行 Step 6B-1：Transaction boundary + state-machine foundation。
不进入 6B-2 / 6B-3 / 6C / 6D，不创建 service 编排，不创建 controller，不暴露 HTTP API，不接入 AppModule。

我确认：
- Step 6B 后续允许修改 AchievementService.submitDraft，让现有 submit route 开始创建 workflow。
- 同部门多个科研秘书时，先给稳定排序后的第一个科研秘书创建一个 task。
- approve 后 WorkflowInstance 保持 ACTIVE/currentStep=ARCHIVE，等待归档后再 COMPLETED。
- reject 后 WorkflowInstance 直接 COMPLETED，重新提交时创建新的 active instance。

Step 6B-1 范围：
- 补 Achievement 状态机允许：
  - PENDING_DEPARTMENT_REVIEW -> PENDING_ARCHIVE
  - PENDING_DEPARTMENT_REVIEW -> DEPARTMENT_REJECTED
- 给 AchievementRepository / WorkflowRepository 增加可在外部 Prisma transaction client 中调用的方法。
- 避免后续 service 双事务或嵌套事务。
- 更新对应 fake Prisma / 状态机测试。

禁止：
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
- 不实现 submit/approve/reject service 编排。
- 不实现前端、费用、提醒、附件、搜索、看板。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

并做边界检查：
- rg -n "Controller\(|@Controller|@Get|@Post|@Patch|@Delete|APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements
- rg -n "WorkflowModule" apps/api/src/app.module.ts apps/api/src/achievements

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6B-1 实现了什么。
3. 明确没有进入哪些范围。
4. 哪些验证通过。
5. 哪些验证失败及原因。
6. 是否可以进入 Step 6B-2 前计划确认。
~~~

Step 6B-2

~~~
Step 6B-1 已完成并归档。现在进入 Step 6B-2 前计划确认。

本次只做 Step 6B-2 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 6A DONE。
- Step 6B-1 DONE：状态机和外部 transaction client 方法已补齐。
- Step 6B-2 目标是 submitDraft 与 workflow instance/task/action 创建的单事务衔接。
- 不做 approve/reject，它们留到 Step 6B-3。
- 不做 controller/HTTP 新路由，不接入 AppModule。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 6B-2 的精确范围：做什么、不做什么。
2. 是否修改现有 AchievementService.submitDraft，还是新增 WorkflowService submit 方法并由 AchievementService 调用。
3. 单事务内的执行顺序。
4. 如何选择部门科研秘书 assignee。
5. 无部门科研秘书时的业务错误语义。
6. 已存在 active workflow instance 时的冲突语义。
7. 如何处理 achievement 状态冲突、重复 submit 和并发 submit。
8. 需要修改/创建的文件清单。
9. service 测试矩阵和 fake/mock 策略。
10. 是否需要真实数据库、migration、seed 或新增依赖。
11. 验证命令和边界检查命令。
12. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 6B-3 / 6C / 6D。
- 不实现 approve / reject。
- 不创建 controller 或 HTTP 新路由。
- 不接入 AppModule。
- 不访问真实数据库，不运行 migrate/seed。
- 不修改 schema/migration/seed/dependency。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 6B-2。

本次只执行 Step 6B-2：submitDraft 与 workflow instance/task/action 创建的单事务衔接。
不进入 Step 6B-3 / 6C / 6D，不实现 approve/reject，不创建 controller 或新 HTTP route，不修改 root AppModule。

我确认：
- 同意 AchievementsModule import WorkflowModule，但不修改 root AppModule。
- 无部门科研秘书按 422 类业务错误处理。
- 已存在 active workflow instance 按 409 conflict 处理。
- 新增 WorkflowService，但事务仍由 AchievementService.submitDraft 持有。
- 同部门多个科研秘书时，选择稳定排序后的第一个用户作为 assignee。

执行范围：
- 修改 AchievementService.submitDraft，让现有 submit 行为在一个 Prisma transaction 内完成：
  - 校验权限、owner、DRAFT 状态。
  - 检查 active workflow instance。
  - 查找部门科研秘书 assignee。
  - 推进 Achievement 到 PENDING_DEPARTMENT_REVIEW。
  - 创建 workflow instance、department review task、submit action。
- 新增无 HTTP 的 WorkflowService，封装 workflow 侧 submit 创建逻辑。
- 补充对应 service / repository fake 测试。
- 保持现有 submit HTTP route 不变，只改变其内部业务效果。

禁止：
- 不实现 approve/reject。
- 不创建 workflow controller。
- 不新增 HTTP route。
- 不接入 root AppModule。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "Controller\(|@Controller|@Get|@Post|@Patch|@Delete|APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements
- rg -n "WorkflowModule" apps/api/src/app.module.ts
- rg -n "approve|reject|APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6B-2 实现了什么。
3. submitDraft 现在如何创建 workflow。
4. 明确没有进入哪些范围。
5. 哪些验证通过。
6. 哪些验证失败及原因。
7. 是否可以进入 Step 6B-3 前计划确认。
~~~

~~~
Step 6B-2 已完成并归档。现在进入 Step 6B-3 前计划确认。

本次只做 Step 6B-3 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 6A DONE。
- Step 6B-1 DONE：状态机和外部 transaction client 方法已补齐。
- Step 6B-2 DONE：现有 submitDraft 已在单事务内创建 workflow instance/task/action。
- Step 6B-3 目标是部门科研秘书 approve/reject 的单事务编排。
- 不做 controller/HTTP 新路由，不接入 AppModule。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 6B-3 的精确范围：做什么、不做什么。
2. approve/reject 应放在 WorkflowService 还是 AchievementService，原因是什么。
3. approve 单事务内的执行顺序。
4. reject 单事务内的执行顺序。
5. 如何校验 assignee、部门 scope、achievement:review_department 权限。
6. task 状态、workflow instance 状态、achievement 状态如何保持一致。
7. reject comment 是否必填、approve comment 是否可选。
8. 重复审批、非 assignee、跨部门、状态冲突、并发冲突如何处理。
9. 需要修改/创建的文件清单。
10. service 测试矩阵和 fake/mock 策略。
11. 是否需要真实数据库、migration、seed 或新增依赖。
12. 验证命令和边界检查命令。
13. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 6C / 6D。
- 不创建 controller 或 HTTP 新路由。
- 不接入 root AppModule。
- 不访问真实数据库，不运行 migrate/seed。
- 不修改 schema/migration/seed/dependency。
- 不实现系统管理员归档 workflow 收口，除非你判断必须单独拆为 6B-4 或 6C 前置。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

Step 6B-3

~~~
确认执行 Step 6B-3。

本次只执行 Step 6B-3：无 HTTP 的部门初审 approve/reject service 编排。
不进入 Step 6C / 6D，不创建 controller 或新 HTTP route，不接入 root AppModule。

我确认：
- approve/reject service 入口命名为 approveDepartmentReviewTask / rejectDepartmentReviewTask。
- 非 assignee / 跨部门按 403 access denied 语义处理。
- 允许 WorkflowModule 直接提供/注入 AchievementRepository，避免引入 AchievementsModule 循环依赖。
- approve/reject 返回值保持最小：workflow task + achievement state，暂不设计完整详情 DTO。
- reject comment 必填且 trim 后非空；approve comment 可选。

执行范围：
- 在 WorkflowService 中实现部门科研秘书初审 approve/reject。
- approve 单事务内完成：
  - assignee-scoped 读取 task。
  - 校验 task PENDING、step=DEPARTMENT_REVIEW。
  - 校验 instance ACTIVE/currentStep=DEPARTMENT_REVIEW。
  - 用 Step 4 department policy 读取 achievement state。
  - 校验 achievement 为 PENDING_DEPARTMENT_REVIEW。
  - task -> APPROVED，写 APPROVE action。
  - workflow instance 保持 ACTIVE 并推进 currentStep=ARCHIVE。
  - achievement -> PENDING_ARCHIVE。
- reject 单事务内完成：
  - 校验 comment 非空。
  - assignee-scoped 读取 task。
  - 校验 task / instance / achievement 状态。
  - task -> REJECTED，写 REJECT action。
  - workflow instance -> COMPLETED，currentStep=null。
  - achievement -> DEPARTMENT_REJECTED。
- 补充 service fake/mock 测试。
- 更新 memory-bank 归档。

禁止：
- 不实现系统管理员归档 workflow 收口。
- 不创建 workflow controller。
- 不新增 HTTP route。
- 不接入 root AppModule。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "Controller\(|@Controller|@Get|@Post|@Patch|@Delete|APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements
- rg -n "WorkflowModule" apps/api/src/app.module.ts
- rg -n "archiveAchievement|achievement:archive|ARCHIVE" apps/api/src/workflow apps/api/src/achievements

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6B-3 实现了什么。
3. approve/reject 如何保证 task、workflow instance、achievement 状态一致。
4. 明确没有进入哪些范围。
5. 哪些验证通过。
6. 哪些验证失败及原因。
7. 是否可以进入下一步计划确认。
~~~

~~~
确认执行 Step 6B-3。

本次只执行 Step 6B-3：无 HTTP 的部门初审 approve/reject service 编排。
不进入 Step 6C / 6D，不创建 controller 或新 HTTP route，不接入 root AppModule。

我确认：
- approve/reject service 入口命名为 approveDepartmentReviewTask / rejectDepartmentReviewTask。
- 非 assignee / 跨部门按 403 access denied 语义处理。
- 允许 WorkflowModule 直接提供/注入 AchievementRepository，避免引入 AchievementsModule 循环依赖。
- approve/reject 返回值保持最小：workflow task + achievement state，暂不设计完整详情 DTO。
- reject comment 必填且 trim 后非空；approve comment 可选。

执行范围：
- 在 WorkflowService 中实现部门科研秘书初审 approve/reject。
- approve 单事务内完成：
  - assignee-scoped 读取 task。
  - 校验 task PENDING、step=DEPARTMENT_REVIEW。
  - 校验 instance ACTIVE/currentStep=DEPARTMENT_REVIEW。
  - 用 Step 4 department policy 读取 achievement state。
  - 校验 achievement 为 PENDING_DEPARTMENT_REVIEW。
  - task -> APPROVED，写 APPROVE action。
  - workflow instance 保持 ACTIVE 并推进 currentStep=ARCHIVE。
  - achievement -> PENDING_ARCHIVE。
- reject 单事务内完成：
  - 校验 comment 非空。
  - assignee-scoped 读取 task。
  - 校验 task / instance / achievement 状态。
  - task -> REJECTED，写 REJECT action。
  - workflow instance -> COMPLETED，currentStep=null。
  - achievement -> DEPARTMENT_REJECTED。
- 补充 service fake/mock 测试。
- 更新 memory-bank 归档。

禁止：
- 不实现系统管理员归档 workflow 收口。
- 不创建 workflow controller。
- 不新增 HTTP route。
- 不接入 root AppModule。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "Controller\(|@Controller|@Get|@Post|@Patch|@Delete|APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements
- rg -n "WorkflowModule" apps/api/src/app.module.ts
- rg -n "archiveAchievement|achievement:archive|ARCHIVE" apps/api/src/workflow apps/api/src/achievements

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6B-3 实现了什么。
3. approve/reject 如何保证 task、workflow instance、achievement 状态一致。
4. 明确没有进入哪些范围。
5. 哪些验证通过。
6. 哪些验证失败及原因。
7. 是否可以进入下一步计划确认。
~~~

Step 6B-4

~~~
Step 6B-3 已完成并归档。现在进入下一步计划确认。

本次只做 Step 6B-4 / Step 6C 前置判断，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 6A DONE。
- Step 6B-1 DONE：状态机和外部 transaction client 方法已补齐。
- Step 6B-2 DONE：submitDraft 已在单事务内创建 workflow instance/task/action。
- Step 6B-3 DONE：部门科研秘书 approve/reject 已在单事务内推进 task、workflow instance 和 achievement。
- approve 后 workflow instance 保持 ACTIVE/currentStep=ARCHIVE。
- 现有 AchievementService.archiveAchievement 可将 PENDING_ARCHIVE -> ARCHIVED，但尚未完成 workflow instance 收口。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\authorization

请输出：
1. 系统管理员归档 workflow 收口应作为 6B-4，还是并入 6C。
2. 如果作为 6B-4，精确范围是什么。
3. 是否修改现有 AchievementService.archiveAchievement，还是新增 WorkflowService archive 方法并由 AchievementService 调用。
4. 单事务内如何完成 achievement PENDING_ARCHIVE -> ARCHIVED、workflow instance ACTIVE/ARCHIVE -> COMPLETED、workflow action ARCHIVE。
5. 如何处理没有 active workflow instance、instance step 不对、achievement 状态不符、并发归档。
6. 系统管理员权限边界如何保持，不允许绕过 Step 4。
7. 需要修改/创建的文件清单。
8. 测试矩阵和 fake/mock 策略。
9. 是否需要真实数据库、migration、seed 或新增依赖。
10. 验证命令和边界检查命令。
11. 完成 6B-4 后是否可以把 Step 6B 整体标记 DONE，再进入 6C controller 计划确认。
12. 需要我确认的问题。

要求：
- 先不要写代码。
- 不创建 controller 或 HTTP 新路由。
- 不接入 root AppModule。
- 不访问真实数据库，不运行 migrate/seed。
- 不修改 schema/migration/seed/dependency。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 6B-4。

本次只执行 Step 6B-4：系统管理员归档 workflow 收口。
不进入 Step 6C / 6D，不创建 controller 或新 HTTP route，不接入 root AppModule。

我确认：
- 系统管理员归档 workflow 收口作为 Step 6B-4 执行。
- 缺失 active workflow instance / instance step 不对，统一按 409 conflict / invalid state，不自动补建、不跳过 workflow。
- ARCHIVE action 为 instance-level action，taskId = null。
- archive 返回值保持现有 achievement 最小结果，不新增 workflow 详情 DTO。
- 6B-4 只复用 achievement:archive 权限，不新增权限码或 policy scope。

执行范围：
- 修改现有 AchievementService.archiveAchievement，让现有 archive 行为在一个 Prisma transaction 内完成：
  - 校验 achievement:archive。
  - 读取 achievement state。
  - 校验 achievement 为 PENDING_ARCHIVE。
  - 查找 active workflow instance。
  - 校验 instance status=ACTIVE、currentStep=ARCHIVE、targetType=ACHIEVEMENT、targetId=achievementId。
  - 推进 achievement PENDING_ARCHIVE -> ARCHIVED。
  - 写 workflow ARCHIVE action，taskId=null。
  - 推进 workflow instance ACTIVE -> COMPLETED，currentStep=null。
- 新增或补充 WorkflowService in-transaction archive helper。
- 补充 WorkflowRepository 写入 instance-level ARCHIVE action 的方法。
- 补充 service/repository fake 测试。
- 更新 memory-bank 归档。
- 6B-4 完成后，如验证通过，将 Step 6B 标记为 DONE，并明确下一步是 Step 6C controller / HTTP API 计划确认。

禁止：
- 不创建 workflow controller。
- 不新增 HTTP route。
- 不接入 root AppModule。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "Controller\(|@Controller|@Get|@Post|@Patch|@Delete|APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements
- rg -n "WorkflowModule" apps/api/src/app.module.ts
- rg -n "archiveAchievement|achievement:archive|ARCHIVE" apps/api/src/workflow apps/api/src/achievements

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6B-4 实现了什么。
3. archive 如何保证 achievement、workflow action、workflow instance 一致。
4. 明确没有进入哪些范围。
5. 哪些验证通过。
6. 哪些验证失败及原因。
7. Step 6B 是否已整体 DONE。
8. 是否可以进入 Step 6C controller / HTTP API 计划确认。
~~~

## Step 6C

~~~
Step 6B 已完成并归档。现在进入 Step 6C 前计划确认。

本次只做 Step 6C 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 6A DONE：workflow domain / DTO / repository 基础完成。
- Step 6B DONE：submit、部门初审 approve/reject、系统管理员 archive workflow 收口均已完成 service 编排。
- Step 6C 目标是 workflow controller / HTTP API 暴露。
- 不接入 root AppModule，AppModule 收口留到 Step 6D。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 6C 的精确范围：做什么、不做什么。
2. 建议暴露哪些 workflow HTTP routes。
3. 每个 route 需要的静态权限和 guard。
4. approve/reject 的 HTTP 输入、输出和错误映射。
5. 待办列表 / 待办详情是否放入 6C，还是拆到 6C-1 / 6C-2。
6. 是否应先只注册 controller 到 WorkflowModule，不接 root AppModule。
7. service error 到 HTTP status 的映射。
8. 测试矩阵和 provider override 策略。
9. 是否需要真实数据库、migration、seed 或新增依赖。
10. 验证命令和边界检查命令。
11. Step 6C 完成后是否进入 Step 6D AppModule 接入和 Step 6 收尾。
12. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 6D。
- 不接入 root AppModule。
- 不注册全局 APP_GUARD。
- 不修改 main.ts。
- 不访问真实数据库，不运行 migrate/seed。
- 不修改 schema/migration/seed/dependency。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 6C-1。

本次只执行 Step 6C-1：workflow approve/reject HTTP controller boundary。
不进入 Step 6C-2 / 6D，不接入 root AppModule，不创建待办列表/详情 API。

我确认：
- Step 6C 拆为 6C-1 approve/reject HTTP 和 6C-2 todo list/detail HTTP。
- 先执行 6C-1，只暴露：
  - POST /workflow/tasks/:taskId/approve
  - POST /workflow/tasks/:taskId/reject
- 所有 Step 6C workflow route 都使用 achievement:review_department。
- Step 6C 不新增系统管理员 workflow archive route，归档继续走现有 achievement archive route。
- 6C-2 后续待办详情只返回 workflow task + instance target 信息，不返回 achievement 业务详情。

执行范围：
- 新增 WorkflowController。
- 只在 WorkflowModule 中注册 WorkflowController。
- 使用 UserContextGuard / PermissionGuard。
- 使用 @CurrentUser() / @RequirePermissions(PermissionCode.achievementReviewDepartment)。
- 使用 controller-local ValidationPipe。
- 实现：
  - POST /workflow/tasks/:taskId/approve
  - POST /workflow/tasks/:taskId/reject
- approve 调用 WorkflowService.approveDepartmentReviewTask。
- reject 调用 WorkflowService.rejectDepartmentReviewTask。
- 实现 controller-local service error 到 HTTP status 映射。
- 新增 controller HTTP 测试，使用 provider override，不访问真实数据库。
- 更新 memory-bank 归档。

错误映射：
- WorkflowAccessDeniedError -> 403
- WorkflowInvalidStateError -> 409
- WorkflowInvalidPayloadError -> 422
- InvalidWorkflowTaskTransitionError -> 409
- InvalidWorkflowInstanceTransitionError -> 409
- WorkflowTaskTransitionConflictError -> 409
- WorkflowInstanceTransitionConflictError -> 409
- ActiveWorkflowInstanceAlreadyExistsError -> 409
- DepartmentReviewerNotFoundError -> 422

禁止：
- 不创建 GET /workflow/tasks/my。
- 不创建 GET /workflow/tasks/:taskId。
- 不接入 root AppModule。
- 不注册全局 APP_GUARD。
- 不修改 main.ts。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "WorkflowModule" apps/api/src/app.module.ts
- rg -n "APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/workflow
- rg -n "migrate|seed|schema.prisma" apps/api/src/workflow apps/api/src/achievements

预期：
- workflow 目录会出现 WorkflowController 和 @Post route 装饰器。
- root AppModule 不应出现 WorkflowModule。
- 不应出现 APP_GUARD、deleteMany、migrate/seed/schema 修改痕迹。

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要取舍，再更新 decisions.md / architecture.md

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6C-1 实现了什么。
3. approve/reject HTTP 如何接入 WorkflowService。
4. 错误映射如何处理。
5. 明确没有进入哪些范围。
6. 哪些验证通过。
7. 哪些验证失败及原因。
8. 是否可以进入 Step 6C-2 前计划确认。
~~~

Step 6C-2 

~~~
Step 6C-1 已完成并归档。现在进入 Step 6C-2 前计划确认。

本次只做 Step 6C-2 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 6A DONE：workflow domain / DTO / repository 基础完成。
- Step 6B DONE：submit、部门 approve/reject、系统管理员 archive workflow 收口完成。
- Step 6C-1 DONE：workflow approve/reject HTTP controller 已注册在 WorkflowModule，但未接 root AppModule。
- Step 6C-2 目标是 workflow 待办列表 / 待办详情 HTTP。
- 不接入 root AppModule，AppModule 收口留到 Step 6D。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 6C-2 的精确范围：做什么、不做什么。
2. 是否暴露 GET /workflow/tasks/my 和 GET /workflow/tasks/:taskId。
3. 待办列表返回字段边界：是否只返回 workflow task + instance target 信息，不返回 Achievement 业务详情。
4. 待办详情返回字段边界。
5. service / repository 是否需要补 read methods。
6. 每个 route 的权限、guard 和查询 scope。
7. 如何避免绕过 Step 4 / Step 5 的成果详情权限。
8. HTTP 错误映射。
9. 测试矩阵和 provider override 策略。
10. 是否需要真实数据库、migration、seed 或新增依赖。
11. 验证命令和边界检查命令。
12. Step 6C-2 完成后是否可以标记 Step 6C DONE，并进入 Step 6D AppModule 接入。
13. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 6D。
- 不接入 root AppModule。
- 不注册全局 APP_GUARD。
- 不修改 main.ts。
- 不访问真实数据库，不运行 migrate/seed。
- 不修改 schema/migration/seed/dependency。
- 不返回 Achievement 业务详情，不实现成果详情聚合。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 6C-2。

本次只执行 Step 6C-2：workflow 待办列表 / 待办详情 HTTP。
不进入 Step 6D，不接入 root AppModule。

我确认：
- 暴露 GET /workflow/tasks/my 和 GET /workflow/tasks/:taskId。
- GET /workflow/tasks/my 默认只返回 PENDING，但允许 ?status=APPROVED/REJECTED/... 查询本人任务历史。
- 待办列表和详情只返回 workflow task + instance target 信息。
- 不返回 Achievement 业务详情，不聚合成果标题、类型、密级、作者、详情字段。
- 非 assignee / 查不到 task 按 403 access denied 语义处理。
- 如果前端需要成果详情，必须继续走 GET /achievements/:id。

执行范围：
- 扩展 WorkflowController：
  - GET /workflow/tasks/my
  - GET /workflow/tasks/:taskId
- 两个 route 都使用 UserContextGuard / PermissionGuard / @CurrentUser() / @RequirePermissions(PermissionCode.achievementReviewDepartment)。
- 使用 controller-local ValidationPipe。
- taskId 使用 UUID v4 校验。
- 新增或扩展 WorkflowService：
  - listMyWorkflowTasks(context, query)
  - getMyWorkflowTask(context, taskId)
- 新增或扩展 WorkflowRepository：
  - findTasksForAssignee({ assigneeId, status?, achievementId? })
  - 详情复用 assignee-scoped lookup。
- 补 controller HTTP 测试、service 测试、repository fake 测试。
- 更新 memory-bank 归档。
- 6C-2 完成后，如验证通过，将 Step 6C 标记为 DONE，并明确下一步是 Step 6D AppModule 接入计划确认。

返回字段边界：
- task: id, instanceId, assigneeId, stepCode, status, createdAt, updatedAt, claimedAt, completedAt
- instance: id, targetType, targetId, status, currentStep, createdAt, updatedAt, completedAt, cancelledAt
- 不 include actions。
- 不 include achievement 详情。

禁止：
- 不接入 root AppModule。
- 不注册全局 APP_GUARD。
- 不修改 main.ts。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不调用 AchievementRepository。
- 不调用 findDetailById / findDetailByIdWhere。
- 不实现成果详情聚合。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "WorkflowModule" apps/api/src/app.module.ts
- rg -n "APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/workflow
- rg -n "migrate|seed|schema.prisma" apps/api/src/workflow apps/api/src/achievements
- rg -n "AchievementRepository|findDetailById|findDetailByIdWhere" apps/api/src/workflow

预期：
- workflow 目录出现两个新的 @Get route。
- root AppModule 仍无 WorkflowModule。
- workflow controller 不出现 Achievement 详情读取。
- 不出现 APP_GUARD / deleteMany / migrate / seed 修改痕迹。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6C-2 实现了什么。
3. 待办列表/详情返回字段边界。
4. 如何避免绕过 Achievement 详情权限。
5. 明确没有进入哪些范围。
6. 哪些验证通过。
7. 哪些验证失败及原因。
8. Step 6C 是否已整体 DONE。
9. 是否可以进入 Step 6D AppModule 接入计划确认。
~~~

## Step 6D

~~~
Step 6C 已完成并归档。现在进入 Step 6D 前计划确认。

本次只做 Step 6D 执行计划确认，不修改文件、不写代码、不访问数据库。

当前状态：
- Step 6A DONE：workflow domain / DTO / repository 基础完成。
- Step 6B DONE：submit 创建 workflow、部门 approve/reject、系统管理员 archive workflow 收口完成。
- Step 6C DONE：WorkflowController 已在 WorkflowModule 内暴露 approve/reject、我的待办列表、待办详情；尚未接 root AppModule。
- Step 6D 目标是 WorkflowModule 接入 root AppModule、AppModule-level HTTP wiring 测试、Step 6 整体收尾归档。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts
- E:\研究院科研成果管理系统\apps\api\src\workflow
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\identity
- E:\研究院科研成果管理系统\apps\api\src\database

请输出：
1. Step 6D 的精确范围：做什么、不做什么。
2. WorkflowModule 接入 root AppModule 的最小改动方案。
3. AppModule-level HTTP 测试应覆盖哪些 route。
4. 如何使用 provider override，避免真实数据库和真实 repository。
5. 是否需要测试 /health 不受影响。
6. 是否需要验证 approve/reject/my/detail 四类 workflow route 在 root AppModule 下可达。
7. 如何确认没有注册全局 APP_GUARD、没有修改 main.ts。
8. Step 6 整体收尾归档需要更新哪些 memory-bank 文件。
9. Step 6 完成后哪些内容仍明确不属于本 Step。
10. 是否需要真实数据库、migration、seed 或新增依赖。
11. 验证命令和边界检查命令。
12. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入 Step 7。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不访问真实数据库，不运行 migrate/seed。
- 不修改 schema/migration/seed/dependency。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
~~~

~~~
确认执行 Step 6D。

本次只执行 Step 6D：WorkflowModule root AppModule 接入、AppModule-level HTTP wiring 测试、Step 6 整体收尾归档。
不进入 Step 7。

我确认：
- 在 root AppModule 中显式导入 WorkflowModule。
- 保留 AchievementsModule 内现有 WorkflowModule import。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不新增全局 pipe / guard。

执行范围：
- 修改 apps/api/src/app.module.ts，显式 import WorkflowModule 并加入 imports。
- 新增 AppModule-level HTTP wiring 测试，建议为 apps/api/src/workflow/workflow.app-module.spec.ts。
- 测试覆盖：
  - /health 仍返回 200。
  - GET /workflow/tasks/my 在 root AppModule 下可达。
  - GET /workflow/tasks/:taskId 在 root AppModule 下可达。
  - POST /workflow/tasks/:taskId/approve 在 root AppModule 下可达。
  - POST /workflow/tasks/:taskId/reject 在 root AppModule 下可达。
  - 无用户上下文返回 401。
  - 缺少 achievement:review_department 返回 403。
- 测试使用 provider override：
  - override WorkflowService 为 mock。
  - override PrismaService，只提供 user.findFirst 给 dev/test identity adapter，不连接真实 DB。
  - 如需要，override AchievementService 为 inert mock，避免误触真实服务。
  - 保留真实 UserContextGuard / PermissionGuard。
- 更新 memory-bank：
  - progress.md
  - evidence.md
  - implementation-plan.md
  - architecture.md
  - decisions.md
- 将 Step 6D 标记 DONE。
- 将 Step 6 overall 标记 DONE。
- 明确 Step 7 仍为 TODO。

禁止：
- 不进入 Step 7。
- 不修改 main.ts。
- 不注册全局 APP_GUARD。
- 不访问真实数据库。
- 不运行 migrate/seed。
- 不修改 schema.prisma、migration、seed、依赖。
- 不实现前端、费用、提醒、附件、搜索、看板。
- 不实现真实登录/SSO。
- 不实现复杂多审批人、候选池、转派、认领、提醒。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥或完整连接串。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- corepack pnpm prisma:validate

边界检查：
- rg -n "APP_GUARD|deleteMany" apps/api/src/workflow apps/api/src/achievements apps/api/src/app.module.ts
- rg -n "WorkflowModule" apps/api/src/app.module.ts apps/api/src/achievements/achievements.module.ts
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/workflow
- rg -n "migrate|seed|schema.prisma" apps/api/src/workflow apps/api/src/achievements apps/api/src/app.module.ts
- rg -n "useGlobalPipes|useGlobalGuards" apps/api/src

预期：
- app.module.ts 出现 WorkflowModule。
- achievements.module.ts 仍保留 WorkflowModule。
- 无 APP_GUARD。
- main.ts 无修改、无全局 pipe/guard 新增。
- workflow routes 在 root AppModule 下可达。
- /health 不受影响。

最后汇报：
1. 创建/修改了哪些文件。
2. Step 6D 实现了什么。
3. WorkflowModule 如何接入 root AppModule。
4. AppModule-level HTTP 测试覆盖了哪些路由。
5. 明确没有进入哪些范围。
6. 哪些验证通过。
7. 哪些验证失败及原因。
8. Step 6 是否已整体 DONE。
9. 是否可以进入 Step 7 前计划确认。
~~~

