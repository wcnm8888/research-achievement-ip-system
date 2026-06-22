# 3、Step 3

## Step 3 的执行计划确认

~~~
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step 3。

当前状态：
- Step 1 memory-bank 已完成。
- Step 2 项目脚手架已完成。
- corepack pnpm install / lint / typecheck / test / build 全部通过。
- 现在只做 Step 3 的计划确认，先不要写代码，不要创建 Prisma model，不要创建 migration。

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

本次只做 Step 3 的执行计划确认。

请输出：
1. Step 3 的任务等级和风险判断。
2. Step 3 是否需要拆成 3A / 3B / 3C / 3D。
3. 一期数据库 schema 边界：包含哪些实体，不包含哪些二期实体。
4. 核心表设计草案：字段、唯一约束、索引、外键、状态字段、时间字段、软删除/归档策略。
5. 审计日志策略。
6. 权限与部门隔离在 schema 层需要预留的字段。
7. Prisma migration 策略。
8. seed 数据策略。
9. 验证命令和质量门禁。
10. 需要我确认的问题。

要求：
- 不进入 Step 4。
- 不实现 RBAC 逻辑。
- 不实现成果登记 API 或页面。
- 不接真实外部 API。
- 不写业务功能。
- 如果发现 Step 3 太大，请先建议拆分，等我确认后再执行。
~~~

## 执行 Step 3A

~~~
确认采用你建议的 Step 3 拆分：3A / 3B / 3C / 3D。

本次先执行 Step 3A，只做 schema 边界和数据库设计文档确认，不写 Prisma model，不创建 migration，不运行迁移，不进入 3B/3C/3D。

针对你的确认问题，我的决定如下：

1. 同意拆成 3A / 3B / 3C / 3D。
2. 数据库表名和字段名采用 snake_case；Prisma Model 和字段保持 TypeScript 友好的 PascalCase/camelCase，通过 @@map/@map 映射到数据库。
3. 本地账号一期需要预留，但不要实现登录逻辑。Step 3 可以设计独立的 user_credentials 或 auth_accounts 表，不要把 passwordHash 直接放在 users 表；Step 4 再实现 Auth/RBAC。
4. DOI、申请号、授权号、登记号都增加 normalized 字段，并基于 normalized 字段做唯一约束。
5. 涉密授权需要建独立 resource_access_grants 表，但 Step 3 只建数据结构，不实现授权逻辑。
6. Step 3 seed 只做小样本，1 万条数据延后到 Step 9。
7. 当前先不假设 DATABASE_URL 已准备好。3A/3B 可以先进行；到 3C 创建 migration 前，再检查本地 PostgreSQL 和 DATABASE_URL。

请执行 Step 3A，并输出：
- 一期 schema 边界最终版
- 实体分组
- 表设计清单
- 命名规范
- 软删除/归档策略
- 审计策略
- 权限隔离字段策略
- 3B 执行前需要我确认的事项

完成后可以更新 memory-bank 中必要的设计/决策文档，但不要修改 prisma/schema.prisma。
~~~

## Step 3B

~~~
确认进入 Step 3B。

本次只执行 3B：Prisma schema 建模。
可以修改 prisma/schema.prisma，创建 models/enums，但不要创建 migration，不要运行 migrate dev，不要 seed，不要进入 3C/3D，不要实现 API、RBAC、成果登记、审批或费用业务逻辑。

针对 3B 前的问题，我的确认如下：

1. Prisma enum 值采用全大写 snake case，确认。
2. PostgreSQL nullable unique 接受多个 NULL，只约束非空 normalized 值，确认。
3. resource_access_grants 需要保证“同一资源 + grantee + grant_type + 未撤销”唯一，但 Prisma schema 本身不强行用错误的 @@unique 表达。3B 先建模型和普通索引；3C migration 阶段通过 SQL partial unique index 实现 revoked_at IS NULL 的唯一约束，并在 evidence/DB checklist 记录。
4. workflow_instances 只允许同一成果存在一个 active 审批实例，确认。3B 先建字段和索引；如果需要 partial unique index，也放到 3C migration SQL 审查阶段处理。
5. fee_records 对 achievement_id + fee_type + due_date 做唯一约束，确认，用于防止重复缴费项。

请执行 3B，并完成：
- 在 prisma/schema.prisma 中创建一期 models/enums。
- 使用 @@map/@map 映射 snake_case 表名和字段名。
- 不写业务逻辑。
- 不创建 migration。
- 运行：
  - corepack pnpm prisma:validate
  - corepack pnpm lint
  - corepack pnpm typecheck
  - corepack pnpm test
  - corepack pnpm build

如果验证失败，请只修复 schema 或脚手架相关问题，不要扩大到 Step 4。

完成后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 如有新增重要数据库设计取舍，再更新 memory-bank/decisions.md

最后汇报：
1. 创建了哪些 models/enums
2. 哪些约束已能由 Prisma 表达
3. 哪些约束需要 3C 用 migration SQL 补充
4. 验证命令是否通过
5. 是否可以进入 3C
~~~

## Step 3C

~~~
确认进入 Step 3C。

本次只执行 3C：生成并审查初始业务 migration。
不要进入 3D，不要 seed，不要实现 API、RBAC、成果登记、审批、费用等业务逻辑。

执行前请先检查：
1. 是否存在 DATABASE_URL，但不要打印或展示 .env / DATABASE_URL 内容。
2. 确认目标数据库是本地开发数据库。
3. 如果 DATABASE_URL 不存在或无法确认是开发库，请停止并汇报，不要猜测、不创建真实 .env、不连接未知数据库。

允许执行：
- corepack pnpm prisma:validate
- corepack pnpm exec prisma migrate dev --name init_core_schema
- corepack pnpm exec prisma generate
- corepack pnpm lint
- corepack pnpm typecheck
- corepack pnpm test
- corepack pnpm build

禁止执行：
- prisma migrate reset
- 删除数据库
- 清空数据
- 修改 Step 4+ 业务逻辑
- seed
- 进入 3D

3C 重点完成：
1. 生成初始 migration。
2. 审查 migration SQL。
3. 补充 partial unique index：
   - resource_access_grants：同一资源 + grantee + grant_type + revoked_at IS NULL 唯一。
   - workflow_instances：同一成果只允许一个 active 审批实例。
4. 审查 FK、索引、唯一约束、nullable unique 是否符合 3A/3B 设计。
5. 更新 progress.md、evidence.md，如有重要迁移决策再更新 decisions.md。

完成后汇报：
- migration 是否生成成功
- migration 文件名
- 补充了哪些 SQL 约束
- 验证命令是否通过
- 是否可以进入 3D
~~~

## Q:本地PostgreSQL 环境准备

~~~
我本地有 Docker Desktop，但现有 PostgreSQL 容器是 n8n compose 使用的，请不要复用、不要修改、不要停止、不要读取它的敏感配置。

请为 E:\研究院科研成果管理系统 创建本项目专用的本地开发 PostgreSQL 方案，用于继续 Step 3C。

要求：
1. 不碰现有 n8n / content-postgre 容器。
2. 不删除、不停止任何现有容器。
3. 新增项目专用 Docker Compose 配置，例如 docker-compose.dev.yml。
4. 使用独立服务名、独立容器名、独立 volume。
5. 使用非默认宿主机端口，例如 55432:5432，避免和现有数据库冲突。
6. 创建本地开发数据库 DATABASE_URL，但不要在回复中展示真实密码。
7. 如果需要写 .env，只写本项目目录下的 .env，并确保 .gitignore 已忽略。
8. 先不要运行 prisma migrate dev，先完成数据库容器准备和连接验证。

请先输出执行计划，说明会新增/修改哪些文件，以及如何验证数据库可连接。等我确认后再执行。
~~~

~~~
确认执行本项目专用 PostgreSQL 准备方案。不要碰 n8n 相关容器。
~~~



~~~
确认继续执行 Step 3C。

本次只执行 3C：生成并审查 init_core_schema migration。
不要进入 3D，不要 seed，不要实现 API、RBAC、成果登记、审批、费用等业务逻辑。

允许执行：
- corepack pnpm prisma:validate
- corepack pnpm exec prisma migrate dev --name init_core_schema
- corepack pnpm exec prisma generate
- corepack pnpm lint
- corepack pnpm typecheck
- corepack pnpm test
- corepack pnpm build

禁止执行：
- prisma migrate reset
- 删除数据库
- 清空数据
- 修改 n8n / content-postgre 容器
- seed
- 进入 3D
- Step 4+ 业务逻辑

3C 重点：
1. 生成 init_core_schema migration。
2. 审查 migration.sql 中的表、FK、索引、唯一约束。
3. 补充并验证 partial unique index：
   - resource_access_grants：同一资源 + grantee + grant_type + revoked_at IS NULL 唯一。
   - workflow_instances：同一成果只允许一个 active 审批实例。
4. 确认 nullable unique 行为符合预期。
5. 确认没有敏感信息写入 migration、文档或输出。
6. 更新：
   - memory-bank/progress.md
   - memory-bank/evidence.md
   - 如有重要迁移决策，更新 decisions.md。

完成后汇报：
- migration 文件名
- 补充了哪些 SQL 约束
- 验证命令是否全部通过
- 是否可以进入 3D
~~~

## Step 3D

~~~
确认进入 Step 3D。

本次只执行 3D：最小 seed 与数据库证据包。
不要进入 Step 4，不要实现 RBAC 逻辑，不要实现 API、页面、成果登记、审批或费用业务功能。

3D 目标：
1. 创建最小确定性 seed。
2. seed 只使用演示数据，不使用真实人员、真实邮箱、真实凭证、真实附件路径、真实 API key。
3. seed 内容仅包含：
   - 部门树
   - 角色
   - 权限
   - 角色权限
   - 演示用户
   - 少量论文/专利/软著
   - 少量费用/提醒/附件元数据
4. seed 必须尽量幂等，可重复执行，不制造重复数据。
5. 1 万条检索性能 seed 延后到 Step 9。
6. 完成数据库 checklist / evidence 记录。

允许执行：
- corepack pnpm exec prisma db seed
- corepack pnpm prisma:validate
- corepack pnpm lint
- corepack pnpm typecheck
- corepack pnpm test
- corepack pnpm build

如果需要新增或修改 package.json 的 seed 配置，可以修改，但只限 seed 所需。

完成后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 如有必要，更新 memory-bank/decisions.md

完成后汇报：
- seed 文件位置
- seed 创建了哪些演示数据
- 幂等性如何保证
- 验证命令是否通过
- Step 3 是否可以整体标记 DONE
- 是否可以进入 Step 4 前的计划确认
~~~







## 收尾归纳

~~~
请对 Step 3 做最后收尾归档。

不要进入 Step 4，不要实现 RBAC、Auth、API、页面、审批、费用、提醒等业务逻辑。

请检查并在必要时更新：
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\tech-stack.md

收尾目标：
1. 确认 Step 3A / 3B / 3C / 3D 均已标记 DONE。
2. 记录 Step 3 整体已完成。
3. 记录 Prisma schema、migration、seed 已完成。
4. 记录 migration 名称：20260608080155_init_core_schema。
5. 记录已补充 partial unique index：
   - resource_access_grants_active_unique_idx
   - workflow_instances_active_target_unique_idx
6. 记录本项目专用 PostgreSQL 容器信息，但不要记录密码或完整 DATABASE_URL。
7. 记录 seed 文件位置：prisma/seed.cjs。
8. 记录 seed 幂等性验证：连续执行两次 seed，计数一致。
9. 记录验证命令全部通过：
   - corepack pnpm exec prisma db seed
   - corepack pnpm prisma:validate
   - corepack pnpm lint
   - corepack pnpm typecheck
   - corepack pnpm test
   - corepack pnpm build
10. 记录当前未进入 Step 4。
11. 写清下一步是 Step 4 的计划确认。

安全要求：
- 不展示、不写入 .env 内容。
- 不记录数据库密码。
- 不记录完整 DATABASE_URL。
- 不操作 n8n / content-postgre 容器。
- 不运行 migrate reset。
- 不删除或清空数据。

完成后请汇报：
1. 哪些文件被更新。
2. Step 3 是否已完整归档。
3. Step 4 新对话建议读取哪些文件。
~~~

## Prompt 1的收尾归纳

~~~
请把本次对话中关于“如何推进科研成果与知识产权管理系统项目”的稳定经验整理到：

E:\研究院科研成果管理系统\prompt.md

定位为：
Prompt 1 - 项目启动与阶段推进编排

要求：
- 不同步聊天全文。
- 只沉淀可复用的提示词、流程规则、边界控制方式和收尾归档方式。
- 保留关键提示词模板。
- 重点记录：一个大 Step 一个新对话、Step 前计划确认、Step 后收尾归档、只执行当前 Step、不越界进入下一 Step。
- 不记录敏感信息，不记录 .env、DATABASE_URL、密码或完整连接串。，然后内容写到prompt.md的最前面
~~~



