# 8、Step 8

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8。

本次只做 Step 8 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

请精确读取与 Step 8 直接相关的上下文；不要全量读取大型历史文件。对于 memory-bank，只读取最新 Step 7 final closure、Step 8 当前状态、费用/提醒/通知/权限/审计相关架构和决策。如需扩大读取范围，请先说明原因。

当前状态：
- Step 1 memory-bank DONE。
- Step 2 项目脚手架 DONE。
- Step 3 数据库 schema / migration / seed DONE。
- Step 4 RBAC 与部门隔离 DONE。
- Step 5 成果登记一期后端流程 DONE。
- Step 6 基础审批流 DONE。
- Step 7 附件与审计 DONE：
  - Step 7A：Audit foundation。
  - Step 7B：Attachment foundation + fake storage adapter。
  - Step 7C：Attachment HTTP boundary + root AppModule wiring。
  - Step 7D：Achievement / Workflow / Attachment 核心审计集成。
- Step 8 仍为 TODO，尚未开始。

请先读取必要上下文：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 中 Step 7 final closure 和 Step 8 相关段落
- E:\研究院科研成果管理系统\memory-bank\progress.md 最新 Step 7 final closure
- E:\研究院科研成果管理系统\memory-bank\evidence.md 最新 Step 7 final closure
- E:\研究院科研成果管理系统\memory-bank\decisions.md 中费用、提醒、通知、审计、权限相关决策
- E:\研究院科研成果管理系统\memory-bank\architecture.md 中 Fee / Reminder / Notification / Audit / RBAC 相关段落
- E:\研究院科研成果管理系统\prisma\schema.prisma 中 fee_records / reminders / notifications / achievements 相关模型和枚举
- E:\研究院科研成果管理系统\apps\api\src\authorization
- E:\研究院科研成果管理系统\apps\api\src\achievements
- E:\研究院科研成果管理系统\apps\api\src\audit
- E:\研究院科研成果管理系统\apps\api\src\database
- E:\研究院科研成果管理系统\apps\api\src\app.module.ts

Step 8 目标草案：
- 实现费用台账与基础预警。
- 覆盖 fee record 后端基础：费用记录、缴费状态、截止日期、凭证关联预留、权限边界。
- 覆盖 reminder/notification 基础：30/15/7 天和逾期预警规则、站内通知或 mock notification、提醒确认预留。
- 复用 Step 4 权限体系、Step 5 Achievement 资源边界、Step 7 Audit 审计能力。
- 先不做前端页面。
- 先不接真实邮件、真实队列、真实财务系统。
- 不修改已执行 migration，除非先明确 schema 缺口、提出新增 migration 计划并等待确认。
- 不访问真实数据库、不运行 migrate/seed。

请输出：
1. Step 8 的任务等级和风险判断。
2. Step 8 是否需要拆成 8A / 8B / 8C / 8D。
3. 每个子步骤的范围、文件边界、完成定义和验证命令。
4. 当前 schema 是否已足够支持 Step 8；如果不足，说明是否需要新增 migration。
5. Fee 模块目录结构建议。
6. Reminder / Notification 模块目录结构建议。
7. Fee domain / repository / service / controller 的边界。
8. Reminder rule / notification adapter / audit integration 的边界。
9. 缴费状态、逾期、提醒确认的状态机边界。
10. 如何复用 Step 4 权限策略，避免费用/提醒越权。
11. 如何复用 Step 5 Achievement 详情和部门 scope。
12. 如何复用 Step 7 AuditService 记录费用与提醒操作。
13. 是否需要真实数据库、migration、seed、依赖、队列或邮件服务。
14. 测试矩阵和 fake/mock/provider override 策略。
15. 验证命令和边界检查命令。
16. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、密钥、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。
- 不实现前端页面。
- 不接真实邮件服务。
- 不接真实队列。
- 不接真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile，除非先停止并说明原因。
- 如果 Step 8 太大，请先拆分，等我确认后再执行。
~~~

## Step 8A

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，确认执行 Step 8A。

本次只执行：

Step 8A - Fee domain / repository foundation

目标：
- 建立费用台账后端基础能力。
- 覆盖 Fee domain types、DTO、状态机、repository、Prisma mapper、fake Prisma 测试。
- 为后续 Step 8B 的 Fee service / controller / audit / AppModule wiring 做准备。

严格范围：
- 只做 Step 8A。
- 不进入 Step 8B / 8C / 8D。
- 不实现 Fee HTTP controller。
- 不修改 root AppModule。
- 不接 Reminder / Notification。
- 不接真实邮件、真实队列、真实财务系统。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改已执行 migration。
- 默认不修改 schema.prisma；如果发现 schema 不足，先停止并说明原因、影响和 migration 计划，等我确认。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8A 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 7 Final Closure 与 Step 8 条目。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 7 Final Archive。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 7 Final Archive evidence。

5. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取 D042。
   - 只补充读取与 Fee、RBAC、部门隔离、审计、Step 8 前置边界相关决策。
   - 不展开全部历史决策。

6. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读模块边界、费用预警数据流、安全与权限、测试策略、Step 7 Final Architecture Closure 中与 Fee / Reminder / Notification / Audit / RBAC 相关段落。

7. E:\研究院科研成果管理系统\prisma\schema.prisma
   - 只定位并读取 FeeRecord、ReminderTask、Notification、Achievement、Attachment relation 相关 model / enum / index。
   - 不读取或展示任何连接串。

8. 只读必要代码目录：
   - E:\研究院科研成果管理系统\apps\api\src\authorization
   - E:\研究院科研成果管理系统\apps\api\src\achievements
   - E:\研究院科研成果管理系统\apps\api\src\database
   - 如需参考 audit transaction pattern，只读取 E:\研究院科研成果管理系统\apps\api\src\audit 中相关 service/repository 边界。

本次实现建议：
- 新增 apps/api/src/fees/**。
- 建议包含：
  - fees.module.ts
  - fee.repository.ts
  - dto/create-fee-record.dto.ts
  - dto/update-fee-record.dto.ts
  - dto/mark-fee-paid.dto.ts
  - dto/fee-query.dto.ts
  - domain/fee-domain.types.ts
  - domain/fee-state-machine.ts
  - domain/fee-prisma.mapper.ts
  - domain/fee-repository.types.ts
  - domain/fee-errors.ts
  - 对应单元测试 / fake Prisma repository tests

实现边界：
- FeeRecord 支持基础创建、查询、状态读取、标记缴费所需 repository 能力。
- 状态机覆盖至少：未缴费、已缴费、逾期判断、取消/归档或不可操作边界。
- repository 测试使用 fake Prisma，不访问真实数据库。
- DTO 校验复用项目现有 class-validator / class-transformer 风格。
- 权限与部门隔离只做 Step 8A 所需的 repository / query 边界预留，不做 HTTP guard。
- 不写 AuditService 集成；audit 留到 Step 8B。
- 不写 Reminder 规则；reminder 留到 Step 8C。
- 不写 Notification adapter；notification 留到 Step 8D。

完成后请运行适合 Step 8A 的最小验证命令，例如：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- 如影响全局类型或 lint，再运行 corepack pnpm lint

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有新的架构取舍，再更新 decisions.md / architecture.md。

更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8A 实现了什么。
2. 创建/修改了哪些文件。
3. 没有进入哪些范围。
4. 验证命令和结果。
5. memory-bank 更新情况。
6. 是否可以进入 Step 8B 前计划确认。
~~~

## Step 8B

Step 8B-1

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8B。

本次只做 Step 8B 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

Step 8 当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B Fee service / controller / root AppModule wiring / audit: TODO。
- Step 8C Reminder rule foundation: TODO。
- Step 8D Notification mock / reminder confirm / audit: TODO。

Step 8A 已完成：
- 新增独立 `apps/api/src/fees/**`。
- 已有 `FeesModule`、Fee DTO、domain types、状态机、Prisma mapper、repository、fake Prisma tests。
- `FeeRepository` 支持创建、caller-provided transaction create、policy-scoped list/detail/state reads、乐观状态保护的缴费状态流转、Prisma unique conflict 识别、Achievement parent 窄事实查询预留。
- 状态机覆盖 `PENDING / OVERDUE / PAID / WAIVED / CANCELLED`，并支持按日期派生 overdue，不直接改库。
- 已验证：
  - `corepack pnpm --filter @research-ip/api test`: passed, 29 files / 283 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 未进入 HTTP、AppModule、Audit、Reminder、Notification、前端、真实邮件、真实队列、真实财务系统。
- 未修改 schema.prisma、migration、seed、package、lockfile。
- 未访问真实数据库，未运行 migrate/seed。

上下文读取规则：
- 只精确读取与 Step 8B 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8A closure / Step 8B 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8A 归档段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8A evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8A Fee Foundation、Step 7 Final Architecture Closure、模块边界、安全与权限中与 Fee / Achievement / Audit / RBAC 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 Step 8A 决策。
   - 只补充读取与 Fee HTTP、Achievement parent、Audit transaction、RBAC/部门隔离相关决策。
   - 不展开全部历史决策。

7. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\fees`
   - `E:\研究院科研成果管理系统\apps\api\src\achievements`
   - `E:\研究院科研成果管理系统\apps\api\src\authorization`
   - `E:\研究院科研成果管理系统\apps\api\src\audit`
   - `E:\研究院科研成果管理系统\apps\api\src\database`
   - `E:\研究院科研成果管理系统\apps\api\src\app.module.ts`
   - 只读与 Step 8B 直接相关的 service/controller/module/test patterns。

Step 8B 目标草案：
- 在 Step 8A foundation 之上实现 Fee service。
- 实现 Fee HTTP controller。
- 将 `FeesModule` 显式接入 root `AppModule`。
- 复用 Step 4 `UserContextGuard` / `PermissionGuard` / RBAC / department scope。
- 复用 Step 5 Achievement parent/resource 边界，避免跨部门或越权访问费用。
- 复用 Step 7 `AuditService`，让费用写操作记录稳定、脱敏 audit facts。
- 写操作如有业务事务，应让 Fee write 与 Audit write 共享同一 Prisma transaction。
- 添加 HTTP / service / AppModule wiring tests。

本次请输出：
1. Step 8B 的任务等级和风险判断。
2. Step 8B 是否还需要拆成 8B-1 / 8B-2 / 8B-3。
3. Step 8B 精确范围：做什么、不做什么。
4. FeeService 应包含哪些方法，每个方法的权限、事务和审计边界。
5. FeeController 应暴露哪些最小 HTTP routes。
6. 每条 route 所需的 static permission、resource policy、department scope 和错误映射。
7. 如何复用 Achievement parent 窄事实查询，避免返回 Achievement 详情或越权信息。
8. 如何接入 AuditService：记录哪些稳定事实，明确不记录哪些字段。
9. Fee write + audit write 的事务策略。
10. root AppModule wiring 和测试策略。
11. service / controller / AppModule tests 的测试矩阵。
12. 验证命令和边界扫描命令。
13. 是否需要 schema、migration、seed、package、lockfile、真实数据库、真实队列、真实邮件或真实财务系统。
14. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 8C / 8D。
- 不实现 Reminder / Notification。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实邮件、真实队列、真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，确认执行 Step 8B-1。

本次只执行：

Step 8B-1 - FeeService + audit transaction

目标：
- 在 Step 8A Fee foundation 之上实现 FeeService。
- 实现费用列表、详情、创建费用、标记缴费的 service 编排。
- 复用 Step 4 权限与部门 scope。
- 复用 Step 5 Achievement parent 窄事实边界。
- 复用 Step 7 AuditService，让 Fee 写操作和 audit 写操作共享同一个 Prisma transaction。
- 添加 FeeService 单元测试。

严格范围：
- 只做 Step 8B-1。
- 不进入 Step 8B-2 / 8B-3 / 8C / 8D。
- 不写 FeeController。
- 不修改 root AppModule。
- 不新增 HTTP route。
- 不实现 Reminder / Notification。
- 不实现前端页面。
- 不接真实邮件、真实队列、真实财务系统。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不做 DELETE、硬删除、archive、cancel、waive。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8B-1 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 8A closure / Step 8B 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 8A 归档段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 8A evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 8A Fee Foundation、Step 7 Audit transaction boundary、Fee / Achievement / RBAC 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取最新 Step 8A 决策。
   - 只补充读取 Fee、Achievement parent、Audit transaction、RBAC/部门隔离相关决策。

7. 必要代码：
   - E:\研究院科研成果管理系统\apps\api\src\fees
   - E:\研究院科研成果管理系统\apps\api\src\achievements
   - E:\研究院科研成果管理系统\apps\api\src\authorization
   - E:\研究院科研成果管理系统\apps\api\src\audit
   - E:\研究院科研成果管理系统\apps\api\src\database

实现要求：
- 新增或完善 FeeService。
- 新增 FeeService errors，如 access denied、not found、invalid transition、unique conflict 等，按项目现有风格处理。
- FeeService 最小方法：
  - listFees(context, query)
  - getFee(context, feeRecordId)
  - createFee(context, dto)
  - markFeePaid(context, feeRecordId, dto)

权限与 scope：
- listFees / getFee 使用 fee:read_department 语义和 PolicyQueryFactory fee readable scope。
- createFee 使用 fee:manage_department，并通过 Achievement parent 窄事实查询确认 achievement 可被当前用户管理。
- markFeePaid 使用 fee:manage_department，并通过 fee department scoped where 查找目标 Fee。
- 跨部门或不存在资源不得泄露业务详情。

Achievement parent 边界：
- createFee 只读取 Achievement 窄事实，例如 id、status、departmentId、ownerUserId、secretLevel。
- Fee departmentId 必须来自 Achievement parent，不信任前端传入。
- 不读取、不返回、不审计 Achievement title、详情、contributors、abstract、审批评论、附件信息。

Audit 边界：
- createFee 写 `FEE_RECORD / CREATE` audit。
- markFeePaid 写 `FEE_RECORD / MARK_FEE_PAID` audit。
- audit payload 只记录稳定事实：
  - actor user / department
  - feeRecordId
  - achievementId
  - target department id
  - action
  - feeType
  - payStatus
  - dueDate
  - paidDate
- audit payload 不记录：
  - amount
  - voucherNo
  - Achievement title/detail/contributors/abstract
  - 凭证附件内容或 storage key
  - raw IP / full user agent
  - token、cookie、密钥、连接串、环境变量

事务策略：
- createFee 和 markFeePaid 由 FeeService 持有 outer Prisma transaction。
- Fee write 和 AuditService.recordEventInTransaction(...) 必须在同一个 transaction 内。
- audit 失败时，Fee 写入应回滚。
- 读操作不写 audit。

测试要求：
- 添加 FeeService 单元测试。
- 覆盖：
  - list 使用 fee readable scope。
  - detail 使用 scoped where。
  - create 使用 Achievement parent 窄查询，并从 parent 写入 departmentId。
  - create + audit 同事务。
  - mark-paid: PENDING -> PAID 成功。
  - mark-paid: OVERDUE -> PAID 成功。
  - PAID / WAIVED / CANCELLED 再 mark-paid 返回冲突。
  - cross-department parent / fee 不泄露业务详情。
  - audit failure 导致写操作失败并走回滚路径。
  - audit payload 不包含 amount、voucherNo、Achievement detail、storage key 等敏感字段。

完成后请运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后做边界扫描：
- rg -n "Reminder|Notification|Queue|Bull|SMTP|Finance" apps/api/src/fees
- rg -n "DATABASE_URL|migrate|seed|APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src/fees
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/fees
- rg -n "deleteMany|delete\\(" apps/api/src/fees
- rg -n "amount|voucherNo|title|abstract|storageKey|checksum" apps/api/src/fees

最后一个扫描如果命中 DTO、domain 或 repository 的合法字段，请人工区分；重点确认 audit payload 不包含这些敏感/高风险字段。

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有重要事务或 audit 取舍，再更新 decisions.md / architecture.md。

memory-bank 更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8B-1 实现了什么。
2. 创建/修改了哪些文件。
3. 明确没有进入哪些范围。
4. 验证命令和结果。
5. 边界扫描结果。
6. memory-bank 更新情况。
7. 是否可以进入 Step 8B-2 前计划确认。
~~~

Step 8B-2

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8B-2。

本次只做 Step 8B-2 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B-1 FeeService + audit transaction: DONE。
- Step 8B-2 FeeController + module-local HTTP tests: TODO。
- Step 8B-3 root AppModule wiring + AppModule tests + memory-bank closure: TODO。
- Step 8C Reminder rule foundation: TODO。
- Step 8D Notification mock / reminder confirm / audit: TODO。

Step 8B-1 已完成：
- 新增 `FeeService`：
  - `listFees(context, query)`
  - `getFee(context, feeRecordId)`
  - `createFee(context, dto)`
  - `markFeePaid(context, feeRecordId, dto)`
- 新增 Fee service errors：access denied、permission denied、not found、conflict、invalid transition。
- `createFee` 使用 Achievement parent 窄事实查询，并从 parent 写入 `departmentId`。
- `createFee` 和 `markFeePaid` 由 `FeeService` 持有 outer Prisma transaction。
- Fee write 与 `AuditService.recordEventInTransaction(...)` 共用同一个 transaction callback。
- Audit 只记录稳定事实，不记录 amount、voucherNo、Achievement 详情或 storage key。
- `FeesModule` 仅补齐 service 依赖导入和 provider/export，没有接 root `AppModule`。
- 已验证：
  - `corepack pnpm --filter @research-ip/api test`: passed, 30 files / 298 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 边界扫描通过：
  - 无 Reminder / Notification / Queue / Bull / SMTP / Finance。
  - 无 DATABASE_URL / migrate / seed / APP_GUARD / useGlobalPipes / useGlobalGuards。
  - 无 controller / HTTP decorator。
  - 无 delete / deleteMany。
  - amount / voucherNo / title / abstract / storageKey / checksum 仅命中合法 DTO/domain/repository/write-input 和测试断言；audit payload builder 未包含这些字段。
- memory-bank 已记录 Step 8B-1 DONE、Step 8B IN PROGRESS、Step 8B-2 TODO，并新增 D043 记录 Fee write + audit shared transaction 取舍。

上下文读取规则：
- 只精确读取与 Step 8B-2 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8B-1 closure / Step 8B-2 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8B-1 归档段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8B-1 evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8A / Step 8B-1 Fee Service 相关段落、HTTP boundary / RBAC / Audit 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 D043。
   - 只补充读取与 Fee HTTP、guard、permission、error mapping、Audit boundary 相关决策。

7. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\fees`
   - `E:\研究院科研成果管理系统\apps\api\src\authorization`
   - `E:\研究院科研成果管理系统\apps\api\src\achievements`
   - `E:\研究院科研成果管理系统\apps\api\src\audit`
   - 只读与 Step 8B-2 直接相关的 controller/module/test patterns。
   - 可以参考已有 `AchievementController` / `WorkflowController` 的 HTTP pattern，但不要扩大到无关实现。

Step 8B-2 目标草案：
- 新增 FeeController。
- 只做 module-local HTTP boundary，不接 root AppModule。
- 暴露最小 Fee routes：
  - `GET /fees`
  - `GET /fees/:id`
  - `POST /fees`
  - `POST /fees/:id/mark-paid`
- 显式使用 `UserContextGuard` / `PermissionGuard` / `@CurrentUser()` / `@RequirePermissions()`。
- 复用 `FeeService`，controller 不直接访问 repository / Prisma / AuditService。
- 添加 module-local HTTP tests。
- 验证 401 / 403 / DTO validation / service error mapping / current user injection / route calls service。
- 不做 root AppModule wiring；root 可达留到 Step 8B-3。

本次请输出：
1. Step 8B-2 的任务等级和风险判断。
2. Step 8B-2 精确范围：做什么、不做什么。
3. FeeController 最小 route 设计。
4. 每条 route 的 static permission、DTO、service 调用和错误映射。
5. 是否需要 PATCH /fees/:id；如果不建议本步做，请明确说明。
6. module-local HTTP tests 测试矩阵。
7. `FeesModule` 在本步需要如何补 controller，不接 root AppModule。
8. 是否需要新增 DTO 或调整现有 DTO。
9. 是否需要新增依赖、schema、migration、seed、package、lockfile、真实数据库、真实队列、真实邮件或真实财务系统。
10. 验证命令和边界扫描命令。
11. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 8B-3 / 8C / 8D。
- 不修改 root AppModule。
- 不实现 Reminder / Notification。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实邮件、真实队列、真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

~~~
确认执行 Step 8B-2。

本次只执行：

Step 8B-2 - FeeController + module-local HTTP tests

确认事项：
- 按 4 条最小 routes 执行：
  - GET /fees
  - GET /fees/:id
  - POST /fees
  - POST /fees/:id/mark-paid
- POST /fees/:id/mark-paid 使用 HTTP 200。
- Step 8B-2 不做 PATCH /fees/:id，留到后续单独确认。
- 本步只做 module-local HTTP boundary，不接 root AppModule。

严格范围：
- 只做 Step 8B-2。
- 不进入 Step 8B-3 / 8C / 8D。
- 不修改 root AppModule。
- 不修改 main.ts。
- 不新增全局 APP_GUARD、global pipe、useGlobalPipes 或 useGlobalGuards。
- 不实现 Reminder / Notification。
- 不实现前端页面。
- 不接真实邮件、真实队列、真实财务系统。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不做 PATCH / DELETE / archive / cancel / waive。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8B-2 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 8B-1 closure / Step 8B-2 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 8B-1 归档段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 8B-1 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 8A / Step 8B-1 Fee Service、HTTP boundary / RBAC / Audit 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取最新 D043。
   - 只补充读取与 Fee HTTP、guard、permission、error mapping、Audit boundary 相关决策。

7. 必要代码：
   - E:\研究院科研成果管理系统\apps\api\src\fees
   - E:\研究院科研成果管理系统\apps\api\src\authorization
   - E:\研究院科研成果管理系统\apps\api\src\achievements
   - E:\研究院科研成果管理系统\apps\api\src\audit
   - 可以参考已有 AchievementController / WorkflowController 的 HTTP pattern，但不要扩大到无关实现。

实现要求：
- 新增 FeeController。
- 在 FeesModule 中注册 controllers: [FeeController]。
- 继续保持 FeesModule 不接 root AppModule。
- Controller 必须显式使用：
  - UserContextGuard
  - PermissionGuard
  - @CurrentUser()
  - @RequirePermissions()
- Controller 只调用 FeeService。
- Controller 不直接访问 repository / Prisma / AuditService。

Routes：
1. GET /fees
   - permission: fee:read_department
   - query: FeeQueryDto
   - service: feeService.listFees(currentUser, query ?? {})
   - expected: 200

2. GET /fees/:id
   - permission: fee:read_department
   - param: ParseUUIDPipe
   - service: feeService.getFee(currentUser, feeRecordId)
   - expected: 200

3. POST /fees
   - permission: fee:manage_department
   - body: CreateFeeRecordDto
   - service: feeService.createFee(currentUser, dto)
   - expected: 201

4. POST /fees/:id/mark-paid
   - permission: fee:manage_department
   - param: ParseUUIDPipe
   - body: MarkFeePaidDto
   - service: feeService.markFeePaid(currentUser, feeRecordId, dto ?? {})
   - expected: 200
   - use @HttpCode(200)

错误映射：
- FeeAccessDeniedError -> 403
- FeePermissionDeniedError -> 403
- FeeNotFoundError -> 404
- FeeConflictError -> 409
- FeeInvalidTransitionError -> 409
- DTO / pipe validation -> 400
- unknown error 按现有 controller pattern rethrow。

测试要求：
新增 module-local HTTP tests，例如 fee.controller.spec.ts。

测试导入 FeesModule，并 override：
- FeeService
- PrismaService
- IDENTITY_ADAPTER

保留真实：
- UserContextGuard
- PermissionGuard
- @RequirePermissions metadata
- @CurrentUser injection

测试矩阵：
- 无 user context -> 401。
- 缺 fee:read_department 读权限 -> 403。
- 缺 fee:manage_department 写权限 -> 403。
- GET /fees 调用 listFees(context, query)。
- GET /fees/:id 调用 getFee(context, id)。
- POST /fees 调用 createFee(context, dto)。
- POST /fees/:id/mark-paid 调用 markFeePaid(context, id, dto)。
- invalid UUID -> 400。
- invalid query/body / forbidden fields -> 400。
- FeeNotFoundError -> 404。
- FeeAccessDeniedError / FeePermissionDeniedError -> 403。
- FeeConflictError / FeeInvalidTransitionError -> 409。
- 确认 controller 不直接访问 repository / Prisma / AuditService。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后做边界扫描：
- rg -n "Reminder|Notification|Queue|Bull|SMTP|Finance" apps/api/src/fees
- rg -n "DATABASE_URL|migrate|seed|APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src/fees
- rg -n "AppModule|app.module|main.ts" apps/api/src/fees
- rg -n "@Delete|deleteMany|delete\\(" apps/api/src/fees

预期：
- 不出现 Reminder / Notification / 外部系统 / root wiring / delete 相关新增命中。
- 允许 FeeController 中出现 @Get / @Post / @Controller，因为本步就是 module-local HTTP boundary。

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如有新的 HTTP boundary / error mapping 决策，再更新 decisions.md / architecture.md。

memory-bank 更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8B-2 实现了什么。
2. 创建/修改了哪些文件。
3. 明确没有进入哪些范围。
4. 验证命令和结果。
5. 边界扫描结果。
6. memory-bank 更新情况。
7. 是否可以进入 Step 8B-3 前计划确认。
~~~

Step 8B-3

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8B-3。

本次只做 Step 8B-3 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B-1 FeeService + audit transaction: DONE。
- Step 8B-2 FeeController + module-local HTTP tests: DONE。
- Step 8B-3 root AppModule wiring + AppModule tests + Step 8B closure: TODO。
- Step 8C Reminder rule foundation: TODO。
- Step 8D Notification mock / reminder confirm / audit: TODO。

Step 8B-2 已完成：
- 新增 `fee.controller.ts`，提供 4 条 module-local Fee routes：
  - `GET /fees`
  - `GET /fees/:id`
  - `POST /fees`
  - `POST /fees/:id/mark-paid`
- `POST /fees/:id/mark-paid` 使用 HTTP 200。
- `fees.module.ts` 已注册 `FeeController`，并补入 `IdentityModule` 以支持本模块内显式 guard 依赖解析。
- `fee.controller.spec.ts` 覆盖 401、403、DTO/UUID validation、route 调用 service、current user injection、service error mapping。
- 未修改 root `AppModule` / `main.ts`。
- 未做 PATCH / DELETE / archive / cancel / waive。
- 未接 Reminder / Notification / 前端 / 真实邮件 / 真实队列 / 真实财务系统。
- 未修改 schema、migration、seed、package、lockfile。
- 未访问真实数据库，未运行 migrate/seed。
- 已验证：
  - `corepack pnpm --filter @research-ip/api test`: passed, 31 files / 309 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 边界扫描通过：
  - no Reminder / Notification / Queue / Bull / SMTP / Finance。
  - no DATABASE_URL / migrate / seed / APP_GUARD / useGlobalPipes / useGlobalGuards。
  - no AppModule / app.module / main.ts in `apps/api/src/fees`。
  - no @Delete / deleteMany / delete\(。
  - `apps/api/src/app.module.ts` 未命中 `FeesModule` / fees route wiring。
- memory-bank 已更新，并新增 D044、Step 8B-2 HTTP boundary 记录。

上下文读取规则：
- 只精确读取与 Step 8B-3 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8B-2 closure / Step 8B-3 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8B-2 归档段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8B-2 evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8B-2 HTTP boundary、Step 8B-1 Fee Service、Fee / RBAC / Audit / root wiring 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 D044 和 D043。
   - 只补充读取与 root AppModule wiring、guard、permission、error mapping、Audit boundary 相关决策。

7. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\app.module.ts`
   - `E:\研究院科研成果管理系统\apps\api\src\fees`
   - `E:\研究院科研成果管理系统\apps\api\src\authorization`
   - 可以参考已有 Achievement / Workflow / Attachment 的 AppModule-level HTTP wiring tests，但不要扩大到无关实现。

Step 8B-3 目标草案：
- 将 `FeesModule` 显式 import 到 root `AppModule`。
- 添加 AppModule-level HTTP tests。
- 验证 root app 下：
  - `/health` 仍可用。
  - `GET /fees` 可达。
  - `GET /fees/:id` 可达。
  - `POST /fees` 可达。
  - `POST /fees/:id/mark-paid` 可达并返回 HTTP 200。
  - 401 no user context 生效。
  - 403 missing static permission 生效。
- AppModule-level tests 应 override `FeeService` / `PrismaService` / identity provider，避免真实数据库和真实业务执行。
- 保留真实 `UserContextGuard` / `PermissionGuard` / decorator metadata。
- 不修改 `main.ts`。
- 不注册全局 `APP_GUARD`。
- 不新增 `useGlobalPipes` / `useGlobalGuards`。
- 不进入 Step 8C / 8D。
- 完成后对 Step 8B 做 closure：Step 8B DONE，Step 8C TODO。

本次请输出：
1. Step 8B-3 的任务等级和风险判断。
2. Step 8B-3 精确范围：做什么、不做什么。
3. root AppModule wiring 的最小改动设计。
4. AppModule-level HTTP tests 测试矩阵。
5. Provider override 策略，如何避免真实数据库执行。
6. 401 / 403 / route reachability / `/health` 验证方式。
7. 是否需要修改 `main.ts`、global guard、global pipe、schema、migration、seed、package、lockfile。
8. Step 8B closure 时 memory-bank 应更新哪些文件、记录哪些稳定事实。
9. 验证命令和边界扫描命令。
10. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 8C / 8D。
- 不实现 Reminder / Notification。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实邮件、真实队列、真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

Step 8C

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8C。

本次只做 Step 8C 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B Fee service / HTTP / root AppModule wiring / audit: DONE。
  - Step 8B-1 FeeService + audit transaction: DONE。
  - Step 8B-2 FeeController + module-local HTTP tests: DONE。
  - Step 8B-3 root AppModule wiring + AppModule tests + Step 8B closure: DONE。
- Step 8C Reminder rule foundation: TODO。
- Step 8D Notification mock / reminder confirm / audit: TODO。

Step 8B 已完成：
- `FeesModule` 已显式接入 root `AppModule`。
- Fee root routes 已可达：
  - `GET /fees`
  - `GET /fees/:id`
  - `POST /fees`
  - `POST /fees/:id/mark-paid`
- Fee 写操作已由 service 统一持有 outer transaction，并与 AuditService 共享 transaction callback。
- AppModule-level tests override `FeeService` / `PrismaService` / `IDENTITY_ADAPTER`，保留真实 guard、permission metadata、`@CurrentUser()` 注入链路。
- 验证通过：
  - `corepack pnpm --filter @research-ip/api test`: passed, 32 files / 315 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 边界扫描通过：
  - no APP_GUARD / useGlobalPipes / useGlobalGuards。
  - no Reminder / Notification / Queue / Bull / SMTP / Finance。
  - no DATABASE_URL / migrate / seed。
  - no @Delete / deleteMany / delete\(。
- 未修改 schema、migration、seed、package、lockfile。
- 未访问真实数据库，未运行 migrate/seed。
- memory-bank 已记录 Step 8B DONE、Step 8C TODO，并新增 D045。

上下文读取规则：
- 只精确读取与 Step 8C 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8B closure / Step 8C 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8B closure 段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8B evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8B root wiring、Fee module boundary、Fee / Reminder / Notification / Audit / RBAC 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 D045 / D044 / D043。
   - 只补充读取与 Reminder rule、Fee due date、Notification boundary、Audit boundary、RBAC/部门隔离相关决策。

7. `E:\研究院科研成果管理系统\prisma\schema.prisma`
   - 只定位并读取 ReminderTask、FeeRecord、Notification 相关 model / enum / index。
   - 不读取或展示连接串。

8. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\fees`
   - `E:\研究院科研成果管理系统\apps\api\src\authorization`
   - `E:\研究院科研成果管理系统\apps\api\src\database`
   - 如需参考 audit transaction pattern，只读 `apps/api/src/audit` 的 service/repository 边界。
   - 不展开无关模块。

Step 8C 目标草案：
- 实现 Reminder rule foundation。
- 基于 Fee due date 生成 30 / 15 / 7 天和 overdue reminder candidates/tasks。
- 支持幂等/去重规则，避免重复生成同一 target/date/level/receiver 的提醒。
- 先做 service/repository/domain/rule tests。
- 先不接真实 scheduler / queue。
- 先不发送 Notification。
- 先不做 HTTP route。
- 先不做 reminder confirm。
- Step 8D 再处理 Notification mock、reminder confirm、audit integration。

本次请输出：
1. Step 8C 的任务等级和风险判断。
2. Step 8C 是否需要拆成 8C-1 / 8C-2。
3. Step 8C 精确范围：做什么、不做什么。
4. Reminder domain / repository / service / rule engine 的目录结构建议。
5. 30 / 15 / 7 天和 overdue 规则如何定义，基于什么 today 输入，如何避免时区和边界日歧义。
6. 哪些 Fee status 应生成提醒，哪些不应生成。
7. receiverId 如何确定；如果现有 schema 或上下文不足，应如何在 Step 8C 中保守处理。
8. 幂等/去重策略如何设计，如何复用 schema 中已有唯一约束。
9. ReminderTask status 状态机边界。
10. 是否需要接 FeeRepository，还是新增 ReminderRepository 自己读取最小 Fee facts。
11. 是否需要 AuditService；如果建议留到 8D，请说明原因。
12. 是否需要 HTTP route、root AppModule wiring、scheduler、queue、notification adapter。
13. 是否需要 schema、migration、seed、package、lockfile、真实数据库。
14. 测试矩阵和 fake Prisma/provider override 策略。
15. 验证命令和边界扫描命令。
16. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 8D。
- 不实现 Notification。
- 不实现 reminder confirm。
- 不实现 HTTP route。
- 不修改 root AppModule。
- 不实现 scheduler / queue。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实邮件、真实队列、真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

~~~
确认执行 Step 8C-1。

本次只执行：

Step 8C-1 - Reminder domain / rule engine

确认事项：
- Step 8C 拆成：
  - 8C-1：Reminder domain / rule engine。
  - 8C-2：ReminderRepository + ReminderService foundation。
- 本次只做 8C-1，不接 Prisma。
- overdue 规则先采用“每天生成一次逾期提醒”：OVERDUE 的 remindDate 使用 normalized today date。
- receiverId 规则先采用确定性 fallback：
  - createdById ?? updatedById ?? achievement.ownerUserId
  - 如果仍为空，则跳过该 Fee 并返回 skipped reason。
- 不实现部门科研秘书 / fee manager 选择规则；该规则如需要，后续单独确认。

严格范围：
- 只做 Step 8C-1。
- 不进入 Step 8C-2 / 8D。
- 不写 repository。
- 不写 service。
- 不接 Prisma。
- 不做 HTTP route。
- 不修改 root AppModule。
- 不接 scheduler / queue。
- 不发送 Notification。
- 不做 reminder confirm。
- 不写 AuditService 集成。
- 不改 schema.prisma、migration、seed、package、lockfile。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8C-1 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 8B closure / Step 8C 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 8B closure 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 8B evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 8B root wiring、Fee module boundary、Fee / Reminder 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取最新 D045 / D044 / D043。
   - 只补充读取与 Reminder rule、Fee due date、Notification boundary 相关决策。

7. E:\研究院科研成果管理系统\prisma\schema.prisma
   - 只定位并读取 ReminderTask、ReminderLevel、ReminderStatus、FeeRecord 相关 model / enum。
   - 不读取或展示连接串。

8. 必要代码：
   - E:\研究院科研成果管理系统\apps\api\src\fees\domain
   - 可参考 Fee domain/state-machine/test 风格。
   - 不展开无关模块。

实现要求：
- 新增 apps/api/src/reminders/** 中的 domain-only 文件。
- 建议新增：
  - apps/api/src/reminders/domain/reminder-domain.types.ts
  - apps/api/src/reminders/domain/reminder-rule-engine.ts
  - apps/api/src/reminders/domain/reminder-state-machine.ts
  - apps/api/src/reminders/domain/reminder-errors.ts
  - apps/api/src/reminders/domain/reminder-rule-engine.spec.ts
  - apps/api/src/reminders/domain/reminder-state-machine.spec.ts
- 如本步需要 RemindersModule 空壳，可以先不新增；优先保持 8C-1 domain-only。

规则要求：
- 所有规则基于显式传入的 today: Date | string。
- today 和 dueDate 都规范化为 UTC date-only midnight。
- 只比较日期，不比较时分秒。
- DAYS_30：fee.dueDate - today === 30。
- DAYS_15：fee.dueDate - today === 15。
- DAYS_7：fee.dueDate - today === 7。
- OVERDUE：today > fee.dueDate。
- 对 30/15/7：remindDate 使用 normalized today date。
- 对 OVERDUE：remindDate 使用 normalized today date，表示逾期每日可生成一次。

Fee status 边界：
- 应生成提醒：
  - PENDING
  - OVERDUE
- 不生成提醒：
  - PAID
  - WAIVED
  - CANCELLED
  - archivedAt != null
- 注意：OVERDUE 可以是派生状态，不要求库里已写 OVERDUE。

receiverId 策略：
- 从 fee fact 中按顺序选择：
  - createdById
  - updatedById
  - achievement.ownerUserId
- 如果仍为空，则不生成 candidate，并返回 skipped reason。
- 不读取、不返回、不审计 Achievement title/detail/contributors/abstract。

ReminderTask 状态机：
- 8C-1 只定义状态机，不执行发送/确认。
- PENDING：生成后的默认状态。
- SENT：8D notification adapter 成功发送后进入。
- FAILED：8D 发送失败后进入。
- CONFIRMED：8D reminder confirm 后进入。
- CANCELLED：未来取消/归档策略使用。
- 8C-1 不从 PENDING 改状态，只定义合法 transition。

测试要求：
- due in 30 generates DAYS_30。
- due in 15 generates DAYS_15。
- due in 7 generates DAYS_7。
- due today 不生成 7/15/30，也不是 overdue。
- due yesterday generates OVERDUE。
- date-only normalization ignores time component。
- PENDING / OVERDUE 可生成。
- PAID / WAIVED / CANCELLED 不生成。
- archivedAt != null 不生成。
- missing receiver skipped。
- multiple fee facts produce deterministic candidates。
- receiver fallback 顺序正确。
- Reminder 状态机合法 transition 覆盖 SENT / FAILED / CONFIRMED / CANCELLED。
- 非法 transition 返回 false 或抛出明确 domain error，按项目现有状态机风格实现。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后做边界扫描：
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/reminders
- rg -n "Notification|Queue|Bull|SMTP|Finance|AuditService|recordEvent|PrismaService" apps/api/src/reminders
- rg -n "DATABASE_URL|migrate|seed|APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src/reminders
- rg -n "deleteMany|delete\\(" apps/api/src/reminders
- rg -n "RemindersModule" apps/api/src/app.module.ts

预期：
- 无 HTTP controller。
- 无 Notification / Queue / AuditService / PrismaService。
- 无 root AppModule wiring。
- 无 destructive delete。
- 无 schema/migration/seed/package/lockfile 修改。

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如日期规则、receiver fallback、overdue daily 规则需要留痕，再更新 decisions.md / architecture.md。

memory-bank 更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8C-1 实现了什么。
2. 创建/修改了哪些文件。
3. 明确没有进入哪些范围。
4. 验证命令和结果。
5. 边界扫描结果。
6. memory-bank 更新情况。
7. 是否可以进入 Step 8C-2 前计划确认。
~~~

Step 8C-2

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8C-2。

本次只做 Step 8C-2 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B Fee service / HTTP / root AppModule wiring / audit: DONE。
- Step 8C Reminder rule foundation: IN PROGRESS。
  - Step 8C-1 Reminder domain / rule engine: DONE。
  - Step 8C-2 ReminderRepository + ReminderService foundation: TODO。
- Step 8D Notification mock / reminder confirm / audit: TODO。

Step 8C-1 已完成：
- 新增 Reminder domain-only 基础：
  - reminder target / level / status / skip reason types。
  - Fee reminder candidate types。
  - 30 / 15 / 7 天和 overdue rule engine。
  - UTC date-only normalization。
  - receiver fallback：createdById ?? updatedById ?? achievement.ownerUserId。
  - Reminder status machine 与 invalid transition error。
- overdue 采用“每日可生成一次”语义：
  - OVERDUE.remindDate = normalized today。
- 只处理纯 domain/rule engine，没有接 Prisma。
- 未写 repository / service。
- 未接 Prisma、真实数据库、migrate/seed。
- 未做 HTTP route、root AppModule wiring。
- 未接 scheduler / queue / Notification。
- 未做 reminder confirm。
- 未写 AuditService 集成。
- 未修改 schema、migration、seed、package、lockfile。
- 已验证：
  - `corepack pnpm --filter @research-ip/api test`: passed, 34 files / 332 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 边界扫描通过：
  - no controller decorators。
  - no Notification / Queue / Bull / SMTP / Finance / AuditService / recordEvent / PrismaService。
  - no DATABASE_URL / migrate / seed / APP_GUARD / useGlobalPipes / useGlobalGuards。
  - no deleteMany / delete\(。
  - no root RemindersModule wiring。
- memory-bank 已记录 Step 8C-1 DONE、Step 8C IN PROGRESS、Step 8C-2 TODO，并新增 D046。

上下文读取规则：
- 只精确读取与 Step 8C-2 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8C-1 closure / Step 8C-2 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8C-1 归档段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8C-1 evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8C-1 Reminder rule foundation、Fee / Reminder / Notification boundary 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 D046。
   - 只补充读取与 Reminder repository/service、Fee due date、receiver fallback、idempotency、Notification/Audit boundary 相关决策。

7. `E:\研究院科研成果管理系统\prisma\schema.prisma`
   - 只定位并读取 ReminderTask、ReminderLevel、ReminderStatus、FeeRecord、Achievement 相关 model / enum / unique constraint。
   - 不读取或展示连接串。

8. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\reminders\domain`
   - `E:\研究院科研成果管理系统\apps\api\src\fees`
   - `E:\研究院科研成果管理系统\apps\api\src\database`
   - 可参考 FeeRepository / mapper / fake Prisma tests 风格。
   - 不展开无关模块。

Step 8C-2 目标草案：
- 新增 RemindersModule。
- 新增 ReminderRepository。
- 新增 ReminderService。
- 读取最小 eligible Fee facts。
- 基于 Step 8C-1 rule engine 和显式 today 生成 reminder candidates。
- 写入 ReminderTask。
- 实现幂等 / 去重策略，避免重复生成相同 targetType / targetId / remindDate / remindLevel / receiverId。
- 返回 created / skipped / duplicate summary。
- 使用 fake Prisma repository tests / service tests。
- 不接 Notification。
- 不接 AuditService。
- 不做 HTTP route。
- 不接 scheduler / queue。
- 不接 root AppModule。

本次请输出：
1. Step 8C-2 的任务等级和风险判断。
2. Step 8C-2 精确范围：做什么、不做什么。
3. RemindersModule / ReminderRepository / ReminderService 的目录结构。
4. ReminderRepository 应读取哪些最小 Fee facts，避免读取 Achievement title/detail/contributors/abstract。
5. ReminderRepository 写入 ReminderTask 的方法设计。
6. 幂等 / 去重策略：使用 createMany skipDuplicates 还是逐条 create 捕获 P2002；fake Prisma 如何测试。
7. ReminderService 方法设计，尤其是 generateFeeDueReminders(today) 的输入、输出、summary。
8. receiver fallback 与 skipped reason 如何从 8C-1 规则衔接到 service summary。
9. 是否需要依赖 FeeRepository；如果不需要，请说明 ReminderRepository 自己读取最小 Fee facts 的理由。
10. 是否需要 AuditService、Notification、HTTP route、scheduler、queue、root AppModule。
11. 是否需要 schema、migration、seed、package、lockfile、真实数据库。
12. 测试矩阵和 fake Prisma/provider override 策略。
13. 验证命令和边界扫描命令。
14. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 8D。
- 不实现 Notification。
- 不实现 reminder confirm。
- 不实现 HTTP route。
- 不修改 root AppModule。
- 不实现 scheduler / queue。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实邮件、真实队列、真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

~~~
确认执行 Step 8C-2。

本次只执行：

Step 8C-2 - ReminderRepository + ReminderService foundation

确认事项：
- 使用 `createMany + skipDuplicates` 作为 Step 8C-2 的幂等策略。
- `generateFeeDueReminders(...)` 只返回 summary counts 和 skipped，不返回已创建 task 列表。
- repository 查询默认加 `take: 500` 上限，后续 scheduler / pagination 再单独扩展。

严格范围：
- 只做 Step 8C-2。
- 不进入 Step 8D。
- 不实现 Notification。
- 不实现 reminder confirm。
- 不实现 HTTP route。
- 不修改 root AppModule。
- 不实现 scheduler / queue。
- 不实现前端页面。
- 不写 AuditService 集成。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实邮件、真实队列、真实财务系统。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8C-2 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 8C-1 closure / Step 8C-2 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 8C-1 归档段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 8C-1 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 8C-1 Reminder rule foundation、Fee / Reminder / Notification boundary 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取最新 D046。
   - 只补充读取与 Reminder repository/service、Fee due date、receiver fallback、idempotency、Notification/Audit boundary 相关决策。

7. E:\研究院科研成果管理系统\prisma\schema.prisma
   - 只定位并读取 ReminderTask、ReminderLevel、ReminderStatus、FeeRecord、Achievement 相关 model / enum / unique constraint。
   - 不读取或展示连接串。

8. 必要代码：
   - E:\研究院科研成果管理系统\apps\api\src\reminders\domain
   - E:\研究院科研成果管理系统\apps\api\src\fees
   - E:\研究院科研成果管理系统\apps\api\src\database
   - 可参考 FeeRepository / mapper / fake Prisma tests 风格。
   - 不展开无关模块。

实现要求：
- 新增 RemindersModule，但不接 root AppModule。
- 新增 ReminderRepository。
- 新增 ReminderService。
- 新增必要 mapper/types：
  - apps/api/src/reminders/domain/reminder-prisma.mapper.ts
  - apps/api/src/reminders/domain/reminder-repository.types.ts
- 保持 8C-1 domain/rule engine 作为规则来源。

ReminderRepository 要求：
- 方法建议：
  - findEligibleFeeFactsForReminder(today: Date | string, options?: { take?: number })
  - createTasksForCandidates(candidates)
- 默认 take 为 500。
- 只读取最小 Fee facts：
  - FeeRecord: id, achievementId, departmentId, dueDate, payStatus, createdById, updatedById, archivedAt
  - nested Achievement: ownerUserId
- 明确不读取：
  - Achievement title/detail/contributors/abstract
  - paper/patent/software detail
  - attachments、storage key、checksum
  - fee amount / voucherNo
- eligible Fee status：
  - PENDING
  - OVERDUE
- 过滤：
  - PAID
  - WAIVED
  - CANCELLED
  - archivedAt != null
- due date 查询应覆盖 30 / 15 / 7 / overdue 所需范围。
- 写入 ReminderTask 字段：
  - targetType = FEE_RECORD
  - targetId
  - remindDate
  - remindLevel
  - receiverId
  - status = PENDING
- 使用 createMany({ skipDuplicates: true })。
- duplicateCount = unique candidate count - createdCount。

ReminderService 要求：
- 方法建议：
  - generateFeeDueReminders(today: Date | string, options?: { take?: number })
- today 必须显式传入。
- 使用 8C-1 UTC date-only normalize / rule engine。
- 输出 summary：
  - today
  - scannedFeeCount
  - candidateCount
  - createdCount
  - duplicateCount
  - skipped
- 不返回已创建 task 列表。
- missing receiver 进入 skipped，reason 为 MISSING_RECEIVER。
- 无 candidate 时不调用 createMany 或 createTasksForCandidates。

测试要求：
Repository tests：
- 查询只包含 eligible fee：PENDING / OVERDUE。
- 过滤 PAID / WAIVED / CANCELLED / archived。
- due date 覆盖 30 / 15 / 7 / overdue。
- select 不包含 Achievement 详情字段。
- mapper 输出 rule engine 所需 facts。
- createMany skipDuplicates 统计 created / duplicate。
- 同 batch 重复 candidate 只创建一次。
- 第二次同批/重复调用 created 为 0。

Service tests：
- 显式 today normalize。
- candidates 被写入 task。
- missing receiver 进入 skipped。
- 无 candidate 时不写入。
- 重复生成返回 duplicate summary。
- 默认 take = 500。
- 自定义 take 可传递给 repository。
- 不依赖 Notification / Audit / HTTP。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后做边界扫描：
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/reminders
- rg -n "Notification|Queue|Bull|SMTP|Finance|AuditService|recordEvent" apps/api/src/reminders
- rg -n "DATABASE_URL|migrate|seed|APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src/reminders
- rg -n "deleteMany|delete\\(" apps/api/src/reminders
- rg -n "RemindersModule" apps/api/src/app.module.ts
- rg -n "title|abstract|contributors|paperDetail|patentDetail|softwareCopyrightDetail|storageKey|checksum|amount|voucherNo" apps/api/src/reminders

最后一条如果命中测试里的“不得选择这些字段”断言，人工区分即可；源码实现不应读取这些字段。

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如 createMany skipDuplicates、take 500、summary-only 输出需要留痕，再更新 decisions.md / architecture.md。

memory-bank 更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8C-2 实现了什么。
2. 创建/修改了哪些文件。
3. 明确没有进入哪些范围。
4. 验证命令和结果。
5. 边界扫描结果。
6. memory-bank 更新情况。
7. Step 8C 是否已 DONE。
8. 是否可以进入 Step 8D 前计划确认。
~~~

## Step 8D

Step 8D-1

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8D。

本次只做 Step 8D 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B Fee service / HTTP / root AppModule wiring / audit: DONE。
- Step 8C Reminder rule foundation: DONE。
  - Step 8C-1 Reminder domain / rule engine: DONE。
  - Step 8C-2 ReminderRepository + ReminderService foundation: DONE。
- Step 8D Notification mock / reminder confirm / audit: TODO。

Step 8C 已完成：
- 新增 `RemindersModule`，但未接入 root `AppModule`。
- 新增 `ReminderRepository`：
  - 扫描 eligible Fee facts，默认 `take: 500`。
  - 只读取 Fee 最小字段 + Achievement `ownerUserId`。
  - 使用 30 / 15 / 7 / overdue due-date 查询范围。
  - 使用 `createMany({ skipDuplicates: true })`。
  - 写入前按 ReminderTask 唯一键做内存去重。
- 新增 `ReminderService.generateFeeDueReminders(today, options)`：
  - 显式 today 输入。
  - 复用 8C-1 UTC date-only normalize 和 rule engine。
  - 只返回 summary counts + skipped，不返回 created task rows。
  - 无 candidate 时不写入。
- 未实现 Notification、reminder confirm、HTTP route、root AppModule wiring、scheduler、queue、前端、AuditService 集成。
- 未修改 schema、migration、seed、package、lockfile。
- 未访问真实数据库，未运行 migrate/seed。
- 已验证：
  - `corepack pnpm --filter @research-ip/api test`: passed, 36 files / 345 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 边界扫描通过：
  - no controller decorators。
  - no Notification / Queue / Bull / SMTP / Finance / AuditService / recordEvent。
  - no DATABASE_URL / migrate / seed / APP_GUARD / global pipes/guards。
  - no delete / deleteMany。
  - root AppModule 中无 RemindersModule。
  - 高风险字段扫描仅命中 repository 测试里的“不得选择这些字段”断言，源码实现未读取这些字段。
- memory-bank 已记录 Step 8C-2 DONE、Step 8C DONE、Step 8D TODO，并新增 D047。

上下文读取规则：
- 只精确读取与 Step 8D 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8C closure / Step 8D 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8C closure 段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8C evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8C Reminder foundation、Step 8B Fee audit、Notification / Reminder / Audit / RBAC 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 D047 / D046 / D045 / D043。
   - 只补充读取与 Notification mock、reminder confirm、audit integration、root wiring、ReminderTask status 相关决策。

7. `E:\研究院科研成果管理系统\prisma\schema.prisma`
   - 只定位并读取 ReminderTask、Notification、ReminderStatus、NotificationStatus、NotificationChannel、User、FeeRecord 相关 model / enum。
   - 不读取或展示连接串。

8. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\reminders`
   - `E:\研究院科研成果管理系统\apps\api\src\fees`
   - `E:\研究院科研成果管理系统\apps\api\src\audit`
   - `E:\研究院科研成果管理系统\apps\api\src\authorization`
   - `E:\研究院科研成果管理系统\apps\api\src\database`
   - `E:\研究院科研成果管理系统\apps\api\src\app.module.ts`
   - 不展开无关模块。

Step 8D 目标草案：
- 实现 Notification mock foundation。
- 实现 ReminderTask -> Notification 的 mock sending/creation flow。
- 实现 reminder confirm 预留或最小后端能力。
- 为 notification send / reminder confirm 写 audit。
- 根据需要将 RemindersModule 显式接入 root AppModule。
- 添加 service / HTTP / AppModule tests。
- 不接真实邮件。
- 不接真实 queue。
- 不接真实外部通知服务。
- 不实现 scheduler。
- 不实现前端。

本次请输出：
1. Step 8D 的任务等级和风险判断。
2. Step 8D 是否需要拆成 8D-1 / 8D-2 / 8D-3。
3. Step 8D 精确范围：做什么、不做什么。
4. Notification domain / repository / service / mock adapter 的目录结构建议。
5. ReminderService 是否应扩展 send/confirm 方法，还是新增独立 NotificationService 编排。
6. ReminderTask 状态流转：PENDING -> SENT / FAILED / CONFIRMED 的事务边界。
7. Notification mock 的最小行为：写 Notification 表还是只返回 mock result。
8. AuditService 应记录哪些稳定事实，不记录哪些字段。
9. notification send + reminder status update + audit 是否需要同一 transaction。
10. reminder confirm 的权限、HTTP route、audit、状态机边界。
11. 是否需要 root AppModule wiring；如果需要，应放在哪个子步骤。
12. 是否需要 schema、migration、seed、package、lockfile、真实数据库、真实队列、真实邮件。
13. 测试矩阵和 fake Prisma/provider override 策略。
14. 验证命令和边界扫描命令。
15. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 9。
- 不实现真实邮件。
- 不实现真实队列。
- 不实现 scheduler。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

~~~
确认执行 Step 8D-1。

本次只执行：

Step 8D-1 - Notification mock foundation + repository/adapter/service

确认事项：
- Step 8D 拆成：
  - 8D-1：Notification mock foundation + repository/adapter/service，不接 HTTP/root。
  - 8D-2：Reminder send/confirm service orchestration + audit transaction，仍不接 root。
  - 8D-3：Reminder HTTP controller + root AppModule wiring + AppModule tests + Step 8 closure。
- notification send audit 后续接受使用现有 enum，不新增 SEND_NOTIFICATION migration：
  - NOTIFICATION / CREATE
  - REMINDER_TASK / UPDATE
  - REMINDER_TASK / CONFIRM_REMINDER
- reminder confirm 后续默认限定为 receiver 本人确认。
- Step 8D mock notification 只做 IN_APP，不使用 EMAIL channel。
- 本次 8D-1 只做 Notification mock foundation，不进入 reminder send/confirm 编排。

严格范围：
- 只做 Step 8D-1。
- 不进入 Step 8D-2 / 8D-3 / Step 9。
- 不修改 root AppModule。
- 不写 Reminder HTTP controller。
- 不实现 reminder confirm。
- 不写 Reminder send orchestration。
- 不写 AuditService 集成。
- 不接真实邮件。
- 不接真实队列。
- 不实现 scheduler / cron。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8D-1 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 8C closure / Step 8D 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 8C closure 段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 8C evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 8C Reminder foundation、Notification / Reminder / Audit boundary 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取最新 D047 / D046。
   - 只补充读取与 Notification mock、ReminderTask status、Audit boundary 相关决策。

7. E:\研究院科研成果管理系统\prisma\schema.prisma
   - 只定位并读取 Notification、NotificationStatus、NotificationChannel、User 相关 model / enum。
   - 不读取或展示连接串。

8. 必要代码：
   - E:\研究院科研成果管理系统\apps\api\src\reminders
   - E:\研究院科研成果管理系统\apps\api\src\database
   - 可参考 Fee / Reminder repository、mapper、fake Prisma tests 风格。
   - 不展开无关模块。

实现要求：
- 新增 apps/api/src/notifications/**。
- 建议目录：
  - apps/api/src/notifications/notifications.module.ts
  - apps/api/src/notifications/notification.repository.ts
  - apps/api/src/notifications/notification.service.ts
  - apps/api/src/notifications/notification.repository.spec.ts
  - apps/api/src/notifications/notification.service.spec.ts
  - apps/api/src/notifications/domain/notification-domain.types.ts
  - apps/api/src/notifications/domain/notification-prisma.mapper.ts
  - apps/api/src/notifications/domain/notification-repository.types.ts
  - apps/api/src/notifications/domain/notification-errors.ts
  - apps/api/src/notifications/adapters/mock-notification.adapter.ts
- 如果更符合项目风格，mock adapter 也可以放在 domain 外的 adapters 目录。

Notification mock 行为：
- 只支持 IN_APP。
- 不使用 EMAIL channel。
- 不接真实邮件 provider。
- mock notification 最小写入 Notification 表：
  - receiverId
  - channel = IN_APP
  - title
  - content
  - status = SENT
  - sentAt = now
- 本步允许写入 content 到 Notification 表，因为这是业务通知正文；但不得把 content 写入 audit payload。
- 本步不做 Notification HTTP read API。
- 本步不做 reminderTaskId 关联，因为 schema 没有该字段，不能新增 migration。

Repository / Service 边界：
- NotificationRepository 只负责 Notification 表最小 create。
- NotificationService 负责 mock adapter + repository 的通知能力。
- ReminderService 的 send/confirm 编排留到 8D-2。
- 8D-1 不更新 ReminderTask 状态。
- 8D-1 不写 AuditService。

测试要求：
Repository tests：
- create mock IN_APP notification。
- 写入字段包含 receiverId、channel、title、content、status、sentAt。
- channel 固定 IN_APP。
- 不要求 reminderTaskId。
- fake Prisma only，不访问真实 DB。

Service tests：
- NotificationService 调用 mock adapter / repository。
- mock adapter 返回可预测成功结果。
- service 只支持 IN_APP。
- EMAIL 或外部 provider 不被使用。
- 不依赖 ReminderService / AuditService / HTTP。
- 不记录或输出敏感字段到 audit payload，因为本步没有 audit payload。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后做边界扫描：
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/notifications
- rg -n "SMTP|Bull|Queue|Finance|scheduler|cron|EMAIL" apps/api/src/notifications
- rg -n "AuditService|recordEvent|ReminderService|ReminderTask" apps/api/src/notifications
- rg -n "DATABASE_URL|migrate|seed|APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src/notifications
- rg -n "@Delete|deleteMany|delete\\(" apps/api/src/notifications
- rg -n "NotificationsModule" apps/api/src/app.module.ts

预期：
- 无 controller decorators。
- 无真实邮件、队列、scheduler、外部系统。
- 无 AuditService / ReminderService 编排。
- 无 root AppModule wiring。
- 无 destructive delete。
- 无 schema/migration/seed/package/lockfile 修改。

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如 IN_APP-only、no reminderTaskId、no SEND_NOTIFICATION migration 需要留痕，再更新 decisions.md / architecture.md。

memory-bank 更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8D-1 实现了什么。
2. 创建/修改了哪些文件。
3. 明确没有进入哪些范围。
4. 验证命令和结果。
5. 边界扫描结果。
6. memory-bank 更新情况。
7. 是否可以进入 Step 8D-2 前计划确认。
~~~

Step 8D-2

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8D-2。

本次只做 Step 8D-2 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B Fee service / HTTP / root AppModule wiring / audit: DONE。
- Step 8C Reminder rule foundation: DONE。
- Step 8D Notification mock / reminder confirm / audit: IN PROGRESS。
  - Step 8D-1 Notification mock foundation: DONE。
  - Step 8D-2 Reminder send/confirm service orchestration + audit transaction: TODO。
  - Step 8D-3 Reminder HTTP controller + root AppModule wiring + AppModule tests + Step 8 closure: TODO。

Step 8D-1 已完成：
- 新增独立 `NotificationsModule`，未接 root `AppModule`。
- 新增 `NotificationRepository`：
  - 最小写入 Notification 表。
  - 固定 `IN_APP`、`SENT`、`sentAt`。
- 新增 `NotificationService.sendInAppNotification(...)`：
  - 调用 mock adapter 后持久化通知。
- 新增 `MockNotificationAdapter`：
  - 只返回可预测的 in-app mock result。
  - 不接外部服务。
- 预留 `createInAppNotificationInTransaction(...)`，给 8D-2 的 Reminder send transaction 使用。
- 未写 Reminder send/confirm 编排。
- 未写 Reminder HTTP controller。
- 未接 AuditService。
- 未改 root AppModule。
- 未接真实邮件/队列/scheduler/前端。
- 未修改 schema、migration、seed、package、lockfile。
- 未访问真实数据库，未运行 migrate/seed。
- 已验证：
  - `corepack pnpm --filter @research-ip/api test`: passed, 38 files / 352 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 边界扫描通过：
  - no controller decorators。
  - no SMTP / Bull / Queue / Finance / scheduler / cron / EMAIL。
  - no AuditService / recordEvent / ReminderService / ReminderTask in notifications。
  - no DATABASE_URL / migrate / seed / global guard / global pipe。
  - no delete / deleteMany。
  - root AppModule 中无 `NotificationsModule`。
- memory-bank 已记录 Step 8D-1 DONE、Step 8D IN PROGRESS、Step 8D-2 TODO，并新增 D048。

上下文读取规则：
- 只精确读取与 Step 8D-2 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8D-1 closure / Step 8D-2 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8D-1 归档段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8D-1 evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8D-1 Notification mock foundation、Step 8C Reminder foundation、Step 7/8B audit transaction boundary 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 D048 / D047 / D046 / D043。
   - 只补充读取与 reminder send/confirm、Notification mock、Audit transaction、ReminderTask status 相关决策。

7. `E:\研究院科研成果管理系统\prisma\schema.prisma`
   - 只定位并读取 ReminderTask、ReminderStatus、ReminderLevel、Notification、NotificationStatus、NotificationChannel、AuditLog 相关 model / enum。
   - 不读取或展示连接串。

8. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\reminders`
   - `E:\研究院科研成果管理系统\apps\api\src\notifications`
   - `E:\研究院科研成果管理系统\apps\api\src\audit`
   - `E:\研究院科研成果管理系统\apps\api\src\database`
   - 可参考 FeeService + audit transaction、Attachment/Workflow audit transaction pattern。
   - 不展开无关模块。

Step 8D-2 目标草案：
- 扩展 ReminderRepository，使其支持 ReminderTask state reads / guarded transitions / transaction writes。
- 扩展 ReminderService，实现：
  - sendPendingReminder(context/systemContext, reminderTaskId)
  - confirmReminder(context, reminderTaskId)
- send success transaction：
  - create Notification row via NotificationService/Repository transaction method。
  - ReminderTask `PENDING -> SENT`。
  - Audit write。
- send failure transaction：
  - ReminderTask `PENDING -> FAILED`。
  - Audit write。
  - 是否创建 failed Notification 暂不做。
- confirm transaction：
  - ReminderTask `SENT -> CONFIRMED`。
  - Audit write。
- audit 失败则业务写入回滚，延续 Step 7 / Step 8B 策略。
- 不接 HTTP route。
- 不接 root AppModule。
- 不接真实邮件/queue/scheduler。
- 不进入 8D-3。

本次请输出：
1. Step 8D-2 的任务等级和风险判断。
2. Step 8D-2 精确范围：做什么、不做什么。
3. 是否需要将 `NotificationsModule` import 到 `RemindersModule`，但仍不接 root AppModule。
4. ReminderRepository 需要新增哪些方法。
5. ReminderService send / confirm 方法签名建议。
6. send success / send failure / confirm 的事务边界。
7. ReminderTask 状态机如何复用 8C-1。
8. confirm 是否限定 receiver 本人；如何处理非 receiver / 不存在资源。
9. AuditService 应记录哪些稳定事实，明确不记录哪些字段。
10. 现有 audit enum 是否足够，是否继续不做 schema/migration。
11. Notification content 如何生成；content 是否可以写入 Notification 表但不得写入 audit。
12. 是否需要 HTTP route、root AppModule wiring、scheduler、queue、真实邮件。
13. 测试矩阵和 fake/provider override 策略。
14. 验证命令和边界扫描命令。
15. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 8D-3 / Step 9。
- 不写 Reminder HTTP controller。
- 不修改 root AppModule。
- 不实现真实邮件。
- 不实现真实队列。
- 不实现 scheduler。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。	
~~~

~~~
确认执行 Step 8D-2。

本次只执行：

Step 8D-2 - Reminder send/confirm service orchestration + audit transaction

确认事项：
- 允许 RemindersModule import NotificationsModule 和 AuditModule，但不接 root AppModule。
- send failure 只更新 ReminderTask 为 FAILED 并写 audit，不创建 failed Notification。
- send actor 采用轻量 system actor 输入；confirm 继续使用真实 UserContext。
- 本步不写 HTTP controller，不接 root AppModule。

严格范围：
- 只做 Step 8D-2。
- 不进入 Step 8D-3 / Step 9。
- 不写 Reminder HTTP controller。
- 不修改 root AppModule。
- 不实现 scheduler / cron。
- 不接真实 queue。
- 不接真实邮件。
- 不使用 EMAIL channel。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实财务系统。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8D-2 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 8D-1 closure / Step 8D-2 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 8D-1 归档段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 8D-1 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 8D-1 Notification mock foundation、Step 8C Reminder foundation、Step 7/8B audit transaction boundary 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取最新 D048 / D047 / D046 / D043。
   - 只补充读取与 reminder send/confirm、Notification mock、Audit transaction、ReminderTask status 相关决策。

7. E:\研究院科研成果管理系统\prisma\schema.prisma
   - 只定位并读取 ReminderTask、ReminderStatus、ReminderLevel、Notification、NotificationStatus、NotificationChannel、AuditLog 相关 model / enum。
   - 不读取或展示连接串。

8. 必要代码：
   - E:\研究院科研成果管理系统\apps\api\src\reminders
   - E:\研究院科研成果管理系统\apps\api\src\notifications
   - E:\研究院科研成果管理系统\apps\api\src\audit
   - E:\研究院科研成果管理系统\apps\api\src\database
   - 可参考 FeeService + audit transaction、Attachment/Workflow audit transaction pattern。
   - 不展开无关模块。

实现要求：
1. RemindersModule
   - import NotificationsModule。
   - import AuditModule。
   - 仍不接 root AppModule。

2. ReminderRepository 新增方法：
   - findTaskStateById(reminderTaskId)
   - findTaskStateByIdInTransaction(client, reminderTaskId)
   - transitionTaskStatusInTransaction(client, input)

3. ReminderRepository 最小 state facts：
   - id
   - targetType
   - targetId
   - remindDate
   - remindLevel
   - receiverId
   - status
   - sentAt
   - confirmedAt

4. transitionTaskStatusInTransaction 要求：
   - 使用 optimistic guard。
   - where 包含 id + expectedStatus。
   - nextStatus 必须显式传入。
   - 可选 sentAt。
   - 可选 confirmedAt。
   - expected status 不匹配返回 conflict / stale write 语义。
   - 不暴露宽泛 delete 或无保护 update。

5. ReminderService 新增方法建议：
   - sendPendingReminder(actor, reminderTaskId, options?: { now?: Date })
   - confirmReminder(context, reminderTaskId, options?: { now?: Date })

6. send actor 类型：
   - 支持轻量 system actor，例如：
     {
       actorType: "SYSTEM",
       userId?: null,
       departmentId?: null
     }
   - 也可兼容 UserContext，但 scheduler/system actor 留后续使用。
   - confirm 必须使用真实 UserContext。

事务边界：
1. send success 同一 transaction：
   - find ReminderTask state。
   - assert PENDING -> SENT。
   - create Notification row via NotificationService / NotificationRepository transaction method。
   - transition ReminderTask to SENT with sentAt。
   - write REMINDER_TASK / UPDATE audit。
   - write NOTIFICATION / CREATE audit。
   - commit。
   - audit 失败则整体回滚。

2. send failure 同一 transaction：
   - find ReminderTask state。
   - assert PENDING -> FAILED。
   - transition ReminderTask to FAILED。
   - write REMINDER_TASK / UPDATE audit。
   - 不创建 failed Notification。
   - commit。
   - audit 失败则整体回滚。

3. confirm 同一 transaction：
   - find ReminderTask state。
   - assert receiverId === context.userId。
   - assert SENT -> CONFIRMED。
   - transition ReminderTask to CONFIRMED with confirmedAt。
   - write REMINDER_TASK / CONFIRM_REMINDER audit。
   - commit。
   - audit 失败则整体回滚。

状态机：
- 复用 8C-1 Reminder status machine。
- 允许：
  - PENDING -> SENT
  - PENDING -> FAILED
  - SENT -> CONFIRMED
- 禁止：
  - PENDING -> CONFIRMED
  - FAILED -> CONFIRMED
  - CONFIRMED -> *
  - CANCELLED -> *

confirm receiver 边界：
- 只允许 receiver 本人确认。
- receiverId !== context.userId 时，返回 not found 语义，避免泄露资源存在。
- 任务不存在：ReminderNotFoundError。
- 无 user context：ReminderAccessDeniedError。
- 状态不允许：ReminderConflictError 或 ReminderInvalidTransitionError，按现有错误风格实现。

Notification content：
- send success 可生成简短业务正文：
  - title: 费用提醒
  - content: 有一条费用提醒待处理。
- content 可以写入 Notification 表。
- audit payload 不写 content。
- 不额外读取 Fee/Achievement 详情生成富文本内容。

Audit 记录边界：
- 记录稳定事实：
  - actor user / department；system actor 可记录 actorType: SYSTEM，user/department 为空。
  - reminderTaskId
  - notificationId（send success）
  - targetType / targetId
  - receiverId
  - remindDate
  - remindLevel
  - oldStatus / newStatus
  - sentAt / confirmedAt
  - notification channel / status
- 不记录：
  - Notification content
  - Fee amount / voucherNo
  - Achievement title/detail/contributors/abstract
  - storageKey/checksum
  - raw IP/full user agent
  - token/cookie/密钥/连接串/env

Audit enum / schema：
- 不新增 SEND_NOTIFICATION。
- 不改 schema。
- 使用现有：
  - REMINDER_TASK / UPDATE
  - NOTIFICATION / CREATE
  - REMINDER_TASK / CONFIRM_REMINDER

测试要求：
Repository tests：
- find task state by id 返回最小 facts。
- transition PENDING -> SENT 设置 sentAt。
- transition PENDING -> FAILED。
- transition SENT -> CONFIRMED 设置 confirmedAt。
- expected status 不匹配返回 conflict。
- 不暴露 delete/updateMany 等宽泛方法，除内部 guarded transition 外。

Service tests：
- send success：Notification create + Reminder SENT + two audit writes 同 transaction。
- send failure：Reminder FAILED + audit，无 Notification create。
- invalid send status：conflict，不写 notification/audit。
- confirm success：receiver 本人，SENT -> CONFIRMED + audit。
- confirm non-receiver：not found/access denied，不写 audit。
- confirm invalid status：conflict。
- audit failure causes transaction rejection。
- audit payload 不含 content、amount、voucherNo、title、abstract、storageKey、checksum。
- fake repository、fake notification service/repository、fake audit service、fake Prisma transaction callback。
- 不访问真实 DB。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后做边界扫描：
- rg -n "@Controller|@Get|@Post|@Patch|@Delete" apps/api/src/reminders apps/api/src/notifications
- rg -n "SMTP|Bull|Queue|Finance|scheduler|cron|EMAIL" apps/api/src/reminders apps/api/src/notifications
- rg -n "DATABASE_URL|migrate|seed|APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src/reminders apps/api/src/notifications
- rg -n "@Delete|deleteMany|delete\\(" apps/api/src/reminders apps/api/src/notifications
- rg -n "RemindersModule|NotificationsModule" apps/api/src/app.module.ts
- rg -n "content|amount|voucherNo|title|abstract|contributors|storageKey|checksum" apps/api/src/reminders

最后一条人工区分：
- content/title 可以在 Notification 代码中出现。
- Reminder audit payload 不应包含 content 或 Achievement/Fee 敏感字段。

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- 如 system actor、send failure 不创建 failed Notification、audit enum 复用需要留痕，再更新 decisions.md / architecture.md。

memory-bank 更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8D-2 实现了什么。
2. 创建/修改了哪些文件。
3. 明确没有进入哪些范围。
4. 验证命令和结果。
5. 边界扫描结果。
6. memory-bank 更新情况。
7. 是否可以进入 Step 8D-3 前计划确认。
~~~



~~~
Step 8D-2 已完成，停在 service orchestration + audit transaction 范围内。
实现了：
RemindersModule 引入 NotificationsModule 和 AuditModule，但没有接 root AppModule。
ReminderRepository 新增 ReminderTask 最小状态读取和 optimistic guarded 状态流转。
ReminderService 新增：sendPendingReminder(...)
confirmReminder(...)

send success：Notification create + ReminderTask PENDING -> SENT + Reminder audit + Notification audit 同事务。
send failure：ReminderTask PENDING -> FAILED + Reminder audit 同事务，不创建 failed Notification。
confirm：receiver 本人限定，ReminderTask SENT -> CONFIRMED + audit 同事务。
audit payload 不包含通知正文、Fee 金额/凭证、Achievement 详情、storageKey/checksum 等敏感字段。
修改文件：
apps/api/src/reminders/**
apps/api/src/notifications/notification.service.ts
apps/api/src/notifications/domain/notification-repository.types.ts
memory-bank/implementation-plan.md
memory-bank/progress.md
memory-bank/evidence.md
memory-bank/architecture.md
memory-bank/decisions.md，新增 D049
明确未进入：
未写 Reminder HTTP controller。
未修改 root AppModule。
未实现 scheduler/cron、queue、真实邮件、EMAIL channel、前端。
未修改 schema、migration、seed、package、lockfile。
未访问真实数据库，未运行 migrate/seed。
验证结果：
corepack pnpm --filter @research-ip/api test: passed, 38 files / 366 tests
corepack pnpm --filter @research-ip/api typecheck: passed
corepack pnpm lint: passed
边界扫描：
controller decorators：无命中
SMTP/Bull/Queue/Finance/scheduler/cron/EMAIL：无命中
DATABASE_URL/migrate/seed/global guard/global pipe：无命中
delete/deleteMany：无命中
root AppModule 中 RemindersModule / NotificationsModule：无命中
敏感字段扫描仅命中测试断言和测试 fake 内容；非 spec 的 reminders 源码无命中。
memory-bank 已更新 Step 8D-2 DONE、Step 8D-3 TODO。可以进入 Step 8D-3 前计划确认。
~~~

Step 8D-3

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 8D-3。

本次只做 Step 8D-3 前计划确认，不修改文件、不写代码、不访问真实数据库、不运行 migrate/seed。

当前状态：
- Step 8 overall: IN PROGRESS。
- Step 8A Fee domain / repository foundation: DONE。
- Step 8B Fee service / HTTP / root AppModule wiring / audit: DONE。
- Step 8C Reminder rule foundation: DONE。
- Step 8D Notification mock / reminder confirm / audit: IN PROGRESS。
  - Step 8D-1 Notification mock foundation: DONE。
  - Step 8D-2 Reminder send/confirm service orchestration + audit transaction: DONE。
  - Step 8D-3 Reminder HTTP controller + root AppModule wiring + AppModule tests + Step 8 closure: TODO。

Step 8D-2 已完成：
- `RemindersModule` 已引入 `NotificationsModule` 和 `AuditModule`，但没有接 root `AppModule`。
- `ReminderRepository` 新增 ReminderTask 最小状态读取和 optimistic guarded 状态流转。
- `ReminderService` 新增：
  - `sendPendingReminder(...)`
  - `confirmReminder(...)`
- send success：
  - Notification create + ReminderTask `PENDING -> SENT` + Reminder audit + Notification audit 同事务。
- send failure：
  - ReminderTask `PENDING -> FAILED` + Reminder audit 同事务。
  - 不创建 failed Notification。
- confirm：
  - receiver 本人限定。
  - ReminderTask `SENT -> CONFIRMED` + audit 同事务。
- audit payload 不包含通知正文、Fee 金额/凭证、Achievement 详情、storageKey/checksum 等敏感字段。
- 未写 Reminder HTTP controller。
- 未修改 root `AppModule`。
- 未实现 scheduler/cron、queue、真实邮件、EMAIL channel、前端。
- 未修改 schema、migration、seed、package、lockfile。
- 未访问真实数据库，未运行 migrate/seed。
- 已验证：
  - `corepack pnpm --filter @research-ip/api test`: passed, 38 files / 366 tests。
  - `corepack pnpm --filter @research-ip/api typecheck`: passed。
  - `corepack pnpm lint`: passed。
- 边界扫描通过：
  - no controller decorators。
  - no SMTP / Bull / Queue / Finance / scheduler / cron / EMAIL。
  - no DATABASE_URL / migrate / seed / global guard / global pipe。
  - no delete / deleteMany。
  - root AppModule 中无 `RemindersModule` / `NotificationsModule`。
  - 敏感字段扫描仅命中测试断言和测试 fake 内容；非 spec 的 reminders 源码无命中。
- memory-bank 已更新 Step 8D-2 DONE、Step 8D-3 TODO，并新增 D049。

上下文读取规则：
- 只精确读取与 Step 8D-3 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
- 不要全量读取 `prompt.md`。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。
- 不读取或展示 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。

请先只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
   - 只读顶部 Step 8D-2 closure / Step 8D-3 状态相关段落。

3. `E:\研究院科研成果管理系统\memory-bank\progress.md`
   - 只读顶部最新 Step 8D-2 归档段落。

4. `E:\研究院科研成果管理系统\memory-bank\evidence.md`
   - 只读顶部最新 Step 8D-2 evidence 段落。

5. `E:\研究院科研成果管理系统\memory-bank\architecture.md`
   - 只读 Step 8D-2 Reminder send/confirm audit boundary、Step 8D-1 Notification mock、Step 8B Fee root wiring 相关段落。

6. `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 优先读取最新 D049 / D048 / D047 / D045。
   - 只补充读取与 Reminder HTTP、root AppModule wiring、receiver confirm boundary、guard/permission、Step 8 closure 相关决策。

7. 必要代码：
   - `E:\研究院科研成果管理系统\apps\api\src\reminders`
   - `E:\研究院科研成果管理系统\apps\api\src\notifications`
   - `E:\研究院科研成果管理系统\apps\api\src\authorization`
   - `E:\研究院科研成果管理系统\apps\api\src\app.module.ts`
   - 可参考 FeeController / Fee AppModule tests 的 HTTP/root wiring pattern。
   - 不展开无关模块。

Step 8D-3 目标草案：
- 新增 Reminder HTTP controller。
- 暴露最小 HTTP route：
  - `POST /reminders/:id/confirm`
- 本步不暴露 send route，send 仍留给后续 scheduler/internal trigger。
- 将 `RemindersModule` 和必要的 `NotificationsModule` root dependency 显式接入 root `AppModule`，具体以 module import 关系最小化为准。
- 添加 module-local HTTP tests。
- 添加 AppModule-level HTTP wiring tests。
- 验证：
  - `/health` 仍可用。
  - `POST /reminders/:id/confirm` root reachable。
  - 401 no user context。
  - 403 missing static permission。
  - invalid UUID -> 400。
  - service error mapping。
- 完成 Step 8D closure，并最终标记 Step 8 DONE、Step 9 TODO。

本次请输出：
1. Step 8D-3 的任务等级和风险判断。
2. Step 8D-3 精确范围：做什么、不做什么。
3. ReminderController 最小 route 设计。
4. `POST /reminders/:id/confirm` 的 static permission、guard、service 调用和错误映射。
5. confirm route 是否只需要 `reminder:read_department`，还是应新增/复用其他权限点；在不改 seed/schema 的前提下如何保守处理。
6. 是否暴露 send route；如果不暴露，请说明原因。
7. `RemindersModule` / `NotificationsModule` root AppModule wiring 的最小设计。
8. module-local HTTP tests 测试矩阵。
9. AppModule-level tests 测试矩阵。
10. Provider override 策略，如何避免真实数据库、真实 notification/audit 执行。
11. Step 8 closure 应更新哪些 memory-bank 文件，记录哪些稳定事实。
12. 是否需要 schema、migration、seed、package、lockfile、真实数据库、真实队列、真实邮件。
13. 验证命令和边界扫描命令。
14. 需要我确认的问题。

要求：
- 只做计划确认。
- 不写代码。
- 不修改文件。
- 不进入 Step 9。
- 不暴露 send HTTP route。
- 不实现 scheduler / cron。
- 不接真实 queue。
- 不接真实邮件。
- 不使用 EMAIL channel。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实财务系统。
- 不修改 schema.prisma、migration、seed、package 或 lockfile；如发现必须修改，先说明原因并等待我确认。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

~~~
确认执行 Step 8D-3。

本次只执行：

Step 8D-3 - Reminder HTTP controller + root AppModule wiring + AppModule tests + Step 8 closure

确认事项：
- 8D-3 只新增 `POST /reminders/:id/confirm`。
- 不暴露 send route。
- confirm route 使用现有 `reminder:read_department`。
- 资源边界由 `ReminderService.confirmReminder(...)` 的 receiver-only 规则保证。
- root AppModule 只 import `RemindersModule`，不直接 import `NotificationsModule`，除非实现中发现 Nest dependency resolution 必须显式 root import；如必须扩大，请先说明原因。

严格范围：
- 只做 Step 8D-3。
- 完成后对 Step 8 做 final closure。
- 不进入 Step 9。
- 不暴露 send HTTP route。
- 不实现 scheduler / cron。
- 不接真实 queue。
- 不接真实邮件。
- 不使用 EMAIL channel。
- 不实现前端页面。
- 不访问真实数据库。
- 不运行 migrate / seed。
- 不接真实财务系统。
- 不修改 schema.prisma、migration、seed、package、lockfile。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

上下文读取规则：
- 只精确读取与 Step 8D-3 直接相关的上下文。
- 不要全量读取大型历史文件。
- 不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不要全量读取 prompt.md。
- 对 memory-bank 先用标题、Step 编号、关键词定位，再精读命中的小范围内容。
- 如果某次检索命中超过 80 行，请停止并改用更窄关键词。
- 如需扩大读取范围，请先说明原因，等我确认。

请先读取必要上下文：
1. E:\Vibe coding\AGENTS.md
   - 只读安全规则、上下文读取最小化规则、完成定义相关段落。

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 只读顶部 Step 8D-2 closure / Step 8D-3 状态相关段落。

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 只读顶部最新 Step 8D-2 归档段落。

4. E:\研究院科研成果管理系统\memory-bank\evidence.md
   - 只读顶部最新 Step 8D-2 evidence 段落。

5. E:\研究院科研成果管理系统\memory-bank\architecture.md
   - 只读 Step 8D-2 Reminder send/confirm audit boundary、Step 8D-1 Notification mock、Step 8B Fee root wiring 相关段落。

6. E:\研究院科研成果管理系统\memory-bank\decisions.md
   - 优先读取最新 D049 / D048 / D047 / D045。
   - 只补充读取与 Reminder HTTP、root AppModule wiring、receiver confirm boundary、guard/permission、Step 8 closure 相关决策。

7. 必要代码：
   - E:\研究院科研成果管理系统\apps\api\src\reminders
   - E:\研究院科研成果管理系统\apps\api\src\notifications
   - E:\研究院科研成果管理系统\apps\api\src\authorization
   - E:\研究院科研成果管理系统\apps\api\src\app.module.ts
   - 可参考 FeeController / Fee AppModule tests 的 HTTP/root wiring pattern。
   - 不展开无关模块。

实现要求：
1. 新增 ReminderController
   - route: `POST /reminders/:id/confirm`
   - `@HttpCode(200)`
   - `@RequirePermissions(PermissionCode.reminderReadDepartment)`
   - `@UseGuards(UserContextGuard, PermissionGuard)`
   - `@CurrentUser()` 注入当前用户。
   - `ParseUUIDPipe` 校验 id。
   - 调用 `this.reminderService.confirmReminder(currentUser, reminderTaskId)`。
   - Controller 不直接访问 repository / Prisma / AuditService / NotificationService。

2. Error mapping
   - ReminderAccessDeniedError -> 403
   - ReminderNotFoundError -> 404
   - ReminderConflictError -> 409
   - ReminderInvalidTransitionError -> 409
   - invalid UUID -> 400，由 ParseUUIDPipe 处理
   - no user context -> 401，由 UserContextGuard 处理
   - missing static permission -> 403，由 PermissionGuard 处理
   - unknown error 按现有 controller pattern rethrow。

3. RemindersModule
   - 注册 ReminderController。
   - 补齐 HTTP guard 依赖：
     - AuthorizationModule
     - 如项目现有 controller module pattern 需要 IdentityModule，则显式 import IdentityModule。
   - 保持 NotificationsModule / AuditModule / DatabaseModule 作为内部依赖。
   - 不直接暴露 send route。

4. root AppModule
   - 显式 import `RemindersModule`。
   - 不直接 import `NotificationsModule`。
   - 不修改 main.ts。
   - 不注册 APP_GUARD。
   - 不新增 useGlobalPipes / useGlobalGuards。

5. Module-local HTTP tests
   - 新增 reminder.controller.spec.ts。
   - imports: [RemindersModule]
   - override ReminderService。
   - override PrismaService。
   - override IDENTITY_ADAPTER。
   - 保留真实 UserContextGuard / PermissionGuard / metadata / @CurrentUser()。
   - 覆盖：
     - no user context -> 401，service 不调用。
     - missing reminder:read_department -> 403，service 不调用。
     - invalid UUID -> 400，service 不调用。
     - valid confirm -> 200，调用 confirmReminder(currentUser, id)。
     - ReminderNotFoundError -> 404。
     - ReminderConflictError -> 409。
     - ReminderInvalidTransitionError -> 409。
     - ReminderAccessDeniedError -> 403。

6. AppModule-level tests
   - 新增 reminder.app-module.spec.ts。
   - imports: [AppModule]
   - override ReminderService。
   - override PrismaService。
   - override IDENTITY_ADAPTER。
   - 避免真实 DB、Notification、Audit transaction 执行。
   - 覆盖：
     - `/health` remains 200。
     - `POST /reminders/:id/confirm` root reachable with reminder:read_department -> 200。
     - no user context -> 401。
     - missing static permission -> 403。
     - invalid UUID -> 400。
     - service called exactly once on success。
     - service not called on guard/validation failure。

完成后运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm lint

完成后做边界扫描：
- rg -n "sendPendingReminder|scheduler|cron|SMTP|Bull|Queue|Finance|EMAIL" apps/api/src/reminders apps/api/src/notifications
- rg -n "DATABASE_URL|migrate|seed|APP_GUARD|useGlobalPipes|useGlobalGuards" apps/api/src/reminders apps/api/src/notifications apps/api/src/app.module.ts
- rg -n "@Delete|deleteMany|delete\\(" apps/api/src/reminders apps/api/src/notifications
- rg -n "RemindersModule|NotificationsModule" apps/api/src/app.module.ts
- rg -n "@Post\\(.*send|send route|/send" apps/api/src/reminders

预期：
- `sendPendingReminder` 可能在 service/tests 中命中，但 controller 不应暴露 send route。
- `RemindersModule` 在 root app.module.ts 应有 import/register。
- `NotificationsModule` 不应直接出现在 root app.module.ts。
- 无 scheduler / queue / true mail / EMAIL channel。
- 无 destructive delete。
- 无 schema/migration/seed/package/lockfile 修改。

完成后更新 memory-bank：
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
  - 顶部新增 Step 8D-3 / Step 8 final closure。
  - 标记 Step 8D DONE。
  - 标记 Step 8 DONE。
  - 标记 Step 9 TODO。
- E:\研究院科研成果管理系统\memory-bank\progress.md
  - 记录 8D-3 完成事实、Step 8 overall DONE。
- E:\研究院科研成果管理系统\memory-bank\evidence.md
  - 记录文件变更、验证命令、边界扫描。
- E:\研究院科研成果管理系统\memory-bank\architecture.md
  - 新增 Reminder HTTP/root reachability 与 Step 8 final boundary。
- E:\研究院科研成果管理系统\memory-bank\decisions.md
  - 如需留痕，新增 D050：
    - Reminder confirm HTTP uses existing reminder:read_department + receiver-only service boundary。
    - send route remains internal/deferred。
    - root AppModule imports RemindersModule only, not NotificationsModule directly。

memory-bank 更新要求：
- 只记录稳定事实、关键决策、验证证据、边界和下一步。
- 不同步聊天全文。
- 不记录完整日志。
- 不记录敏感信息。

最后请汇报：
1. Step 8D-3 实现了什么。
2. 创建/修改了哪些文件。
3. 明确没有进入哪些范围。
4. 验证命令和结果。
5. 边界扫描结果。
6. memory-bank 更新情况。
7. Step 8D 是否 DONE。
8. Step 8 是否 DONE。
9. 是否可以进入 Step 9 前计划确认。
~~~

