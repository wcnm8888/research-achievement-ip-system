之前的prompts记录

# 1、新项目

~~~
我想用 E:\Vibe coding 的 Vibe Coding 方法论开发一个新项目：科研成果与知识产权管理系统。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\use.md
- E:\Vibe coding\vibe-methodology\README.md
- E:\Vibe coding\vibe-methodology\00-operating-protocol.md
- E:\Vibe coding\vibe-methodology\01-task-classification.md
- E:\Vibe coding\vibe-methodology\02-sdd-workflow.md
- E:\Vibe coding\vibe-methodology\03-context-bank.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
- E:\Vibe coding\vibe-methodology\07-database-production.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md

再读取需求规格说明书：
- E:\研究院科研成果管理系统\研究院科研成果管理系统说明.html

先不要写代码。请先做以下事情：

1. 理解需求规格说明书，提炼项目目标、用户角色、核心业务模块、非功能需求、外部 API、数据模型和验收标准。
2. 按 vibe coding 方法论判断任务等级：XS / S / M / L。
3. 判断是否需要创建 memory-bank，并说明原因。
4. 帮我创建第一版项目 memory-bank，至少包含：
   - product-brief.md
   - feature-brief.md
   - design-spec.md
   - architecture.md
   - tech-stack.md
   - implementation-plan.md
   - progress.md
   - decisions.md
   - evidence.md
5. 请把全量需求拆成“一期基础刚需版”和“二期深化版”。
6. 一期优先聚焦：
   - 成果登记：论文、专利、软著
   - 基础审批流
   - RBAC 权限与部门数据隔离
   - 费用台账与基础预警
   - 基础全文检索
   - 基础统计看板
   - 操作审计日志
   - 附件管理
   - DOI 自动补全和邮件通知可先用 Mock / Adapter 预留
7. 请明确第一版不要做什么，例如：
   - 暂不做完整移动端
   - 暂不做真实短信接口
   - 暂不做完整财务系统深度对接
   - 暂不做十万级数据真实压测
   - 暂不做复杂自定义报表引擎
8. 输出第一版：
   - product brief
   - feature brief
   - design spec
   - architecture plan
   - database/domain model draft
   - implementation plan
   - quality gates
   - 下一步开发计划

要求：
- 严格遵守 E:\Vibe coding\AGENTS.md 的安全规则。
- 先规划，后代码。
- 不要直接创建应用代码。
- 如果需要做技术栈选择，请先给出推荐方案和理由。
- 所有项目文档、memory-bank 和产物优先放在 E 盘项目目录中。
~~~

# 2、Step 2

## 先确认 Step 2 的执行计划

~~~
请继续开发 E:\研究院科研成果管理系统 项目。

先读取：
- E:\Vibe coding\AGENTS.md (Codex 每次开发都应该遵守的总规则。)
- E:\Vibe coding\use.md
- E:\研究院科研成果管理系统\memory-bank\product-brief.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\tech-stack.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md

本次只执行 implementation-plan.md 里的 Step 2：初始化项目脚手架。

要求：
- 先不要直接写代码，先确认 Step 2 的执行计划。
- 不要执行 Step 3 或后续内容。
- 完成后运行可用的验证命令。
- 完成后更新 progress.md 和 evidence.md。
~~~

## 确认执行 Step 2

~~~
确认执行 Step 2。

请严格按你上面的计划执行，只做项目脚手架初始化，不进入 Step 3，不创建业务领域模型、数据库业务表、RBAC、成果登记、审批、费用等功能。

如果 Corepack / pnpm 安装依赖失败，请停止并汇报，不要擅自切换 npm、yarn 或其他方案。

完成后请运行：
- corepack pnpm lint
- corepack pnpm typecheck
- corepack pnpm test
- corepack pnpm build

如果验证失败，请先修复脚手架自身问题；如无法修复，请说明原因。

最后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md

并汇报：
1. 创建/修改了哪些文件
2. 哪些验证通过
3. 哪些验证失败及原因
4. 下一步是否可以进入 Step 3
~~~

## 报错解决

~~~
继续处理 Step 2，但不要进入 Step 3。

当前 Step 2 只是脚手架文件已创建，依赖安装和验证门禁没有完成。请先解决 corepack pnpm install 超时问题。

请按以下顺序执行：

1. 先读取并检查：
   - package.json
   - pnpm-workspace.yaml
   - apps/web/package.json
   - apps/api/package.json
   - packages/shared/package.json
   - memory-bank/progress.md
   - memory-bank/evidence.md

2. 先做只读诊断：
   - corepack --version
   - node -v
   - npm -v
   - corepack pnpm --version

3. 如果 pnpm 可用，请重新运行依赖安装，但把命令超时时间放宽到 5-10 分钟：
   - corepack pnpm install

4. 如果仍然超时，请不要切换 npm/yarn，不要擅自改技术栈。请诊断是：
   - Corepack 拉取 pnpm 慢
   - pnpm 下载依赖慢
   - registry/network 问题
   - package 配置问题
   然后汇报原因和建议方案。

5. 如果 install 成功，再运行：
   - corepack pnpm lint
   - corepack pnpm typecheck
   - corepack pnpm test
   - corepack pnpm build

6. 如果验证失败，请只修复 Step 2 脚手架自身问题，不要实现业务功能，不要进入 Step 3。

7. 完成后更新：
   - E:\研究院科研成果管理系统\memory-bank\progress.md
   - E:\研究院科研成果管理系统\memory-bank\evidence.md

最后汇报：
- install 是否成功
- lint/typecheck/test/build 是否通过
- 修复了哪些脚手架问题
- Step 2 是否可以标记完成
- 是否可以进入 Step 3
~~~

## 收尾归档

~~~
请对 Step 2 做最后收尾归档。

不要进入 Step 3，不要创建业务代码，不要创建数据库 model 或迁移。

请检查并在必要时更新：
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\tech-stack.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md

收尾目标：
1. 确认 Step 2 已标记 DONE。
2. 记录 Step 2 已完成脚手架初始化。
3. 记录 corepack pnpm install 成功。
4. 记录 lint/typecheck/test/build 全部通过。
5. 记录 package.json 脚本改为显式使用 corepack pnpm 的原因。
6. 记录当前未进入 Step 3。
7. 写清下一步是 Step 3 的计划确认。

不要同步聊天全文，只沉淀稳定事实、决策和验证证据。
完成后请汇报哪些文件被更新，Step 3 新对话需要读取哪些文件。
~~~



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

# 10、Step 10







# 11、Step 11

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次 Step：
Step 11 - 前端应用基座、用户上下文与工作台执行。

本次目标：
- 按已确认的 Step 11 计划执行。
- 建立一期前端可运行基座。
- 完成演示用户上下文入口、主布局、导航、基础 API client、统一状态组件和工作台基础。
- 执行完成后更新 memory-bank 证据和归档。
- 不进入 Step 12/13/14/15。

当前权威状态：
- Step 9 overall DONE。
- Step 10 overall DONE。
- Step 10A/10B/10C/10D DONE。
- Step 10 已完成最终质量门禁、证据包整理和 memory-bank 归档。
- D058 要求后续 Step 仍为 TODO / not started，下一 Step 必须先计划确认。
- Step 11 计划确认已完成，本轮可以执行 Step 11。
- apps/web 当前仍是最小 Vite / React / Ant Design scaffold。
- apps/web 当前没有路由、API client、用户上下文、业务页面。
- Step 11 默认不新增 npm 依赖，不引入 React Router。
- Step 11 不访问真实数据库，不运行 migrate / seed。
- Step 11 执行收尾允许更新 memory-bank。

已确认项目事实：
- 后端已有 dev/test 用户上下文 header：X-Demo-User-Id。
- DevIdentityAdapter 在非 production 环境使用 x-demo-user-id 加载用户上下文。
- Step 11 可用后端入口包括：
  - GET /dashboard/summary
  - GET /workflow/tasks/my
  - GET /workflow/tasks/:taskId
  - GET /search
  - GET /fees
- Achievement 当前没有列表路由，因此 Step 11 不实现“我的成果列表”，只做入口和边界提示。
- Dashboard 当前只允许基础 summary，不伪造复杂趋势、排行、金额汇总等未完成指标。
- Search / Dashboard 权限过滤必须依赖后端，前端不承担最终鉴权。
- 未完成模块只能显示后续 Step 入口/边界提示，不能伪装为已完成能力。

执行范围：

1. Step 11A - Web 现状核查与边界确认
   - 只读确认 apps/web 当前结构、配置、入口文件。
   - 只读确认 Step 11 会使用的后端入口和 header。
   - 不修改后端。
   - 不运行 migrate / seed。
   - 不访问真实数据库。

2. Step 11B - 主布局、导航、统一状态组件
   - 替换当前 scaffold App。
   - 实现管理系统布局：
     - 顶部栏
     - 侧边导航
     - 内容区
     - 用户信息区
   - 建立统一状态组件：
     - loading
     - error
     - empty
     - permission hint
     - section header
   - 菜单包括：
     - 工作台
     - 成果管理
     - 审批管理
     - 费用管理
     - 检索中心
     - 统计看板
     - 审计日志
     - 系统配置
   - Step 11 只让“工作台”有主要内容，其余页面显示下一 Step 边界提示。

3. Step 11C - Dev/Test 用户上下文入口与 API Client
   - 建立前端 API client。
   - 所有 API 请求统一带 X-Demo-User-Id。
   - 用户选择或输入保存到 localStorage，刷新后恢复。
   - UI 明确标注这是“本地演示上下文 / 非真实 SSO”。
   - 统一错误映射：
     - 401：请选择或切换演示用户
     - 403：当前角色无权限
     - 400：请求参数错误
     - 5xx/network：服务不可用

4. Step 11D - 工作台基础
   - 工作台优先消费 GET /dashboard/summary。
   - 待办区域消费 GET /workflow/tasks/my。
   - “我的成果”只做入口卡片和 Step 12 边界提示，因为当前无成果列表 API。
   - “费用预警”使用 dashboard summary 中可用信息展示；不做费用 CRUD。
   - “系统消息”只展示 mock / in-app 边界提示；不接真实邮件。
   - 所有卡片都有空状态、错误状态、加载状态。

非目标：
- 不新增后端接口。
- 不实现成果完整登记表单。
- 不实现审批通过/驳回动作。
- 不实现费用台账 CRUD。
- 不实现附件上传/下载。
- 不实现搜索中心完整页面。
- 不实现统计看板完整页面。
- 不实现审计页面。
- 不接真实 SSO。
- 不接真实邮件、短信、对象存储、Meilisearch。
- 不运行 migrate / seed。
- 不访问真实数据库。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

上下文读取规则：
- 先索引，后精读。
- 只读取 Step 11 直接相关内容。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md 历史记录区。
- 对 memory-bank 文件只读取顶部最新状态和 Step 11 相关边界。
- 如果某次检索命中超过 80 行，停止并改用更窄关键词。

建议优先读取：
1. E:\Vibe coding\AGENTS.md
   - 默认开发流程
   - 任务分类
   - 上下文读取最小化规则
   - 专业级质量标准
   - 完成定义

2. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - 顶部 Current Step 10 Final Closure

3. E:\研究院科研成果管理系统\memory-bank\progress.md
   - 顶部 Step 10 final archive
   - Step 9 final archive 中 Search/Dashboard 后端边界
   - Step 5/6 final archive 中 Achievement/Workflow 后端能力摘要

4. E:\研究院科研成果管理系统\memory-bank\design-spec.md
   - 页面信息架构
   - 用户流程
   - 权限规则
   - 架构边界
   - 验收标准

5. apps/web 相关文件
   - package.json
   - vite.config.ts
   - tsconfig.json
   - src/App.tsx
   - src/App.css
   - src/main.tsx

实现要求：
- 优先复用现有 React + Vite + Ant Design。
- 不新增依赖。
- 不改后端。
- 不改 Prisma schema、migration、seed。
- 不修改 package.json / lockfile，除非发现 Step 11 无法完成且先说明原因。
- 前端 UI 要像管理系统，不做营销页。
- 保持页面信息密度适中。
- 所有文字不能溢出或重叠。
- UI 必须覆盖 loading、empty、error、permission denied 状态。
- 未完成模块只能显示“后续 Step 入口/边界提示”，不能伪装为已完成能力。

质量门禁：
执行完成后运行：
- corepack pnpm --filter @research-ip/web typecheck
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web build
- corepack pnpm lint

如某条命令无法运行，说明原因并记录风险。

浏览器验收：
- 启动前端 dev server。
- 打开页面并截图。
- 至少检查：
  - 无用户上下文状态
  - 科研人员上下文
  - 科研秘书上下文
  - 系统管理员上下文
- 检查导航、工作台、loading、empty、error、403 提示。
- 检查刷新后 demo user id 可恢复。

安全和边界扫描：
- 确认未展示敏感凭证。
- 确认未运行 migrate / seed。
- 确认未新增真实 SSO、真实邮件、真实对象存储、Meilisearch。
- 确认未进入 Step 12/13/14/15 实现。

memory-bank 收尾：
执行完成后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md

必要时更新：
- memory-bank/decisions.md

归档内容包括：
- Step 11A/11B/11C/11D 完成状态。
- 修改文件摘要。
- 运行的质量门禁结果。
- 浏览器验收截图或说明。
- Step 11 边界。
- 剩余风险。
- 下一步 Step 12 只能先做计划确认，不能直接实现。

最终输出：
1. 完成了什么。
2. 修改了哪些文件。
3. 跑了哪些门禁，结果如何。
4. 浏览器验收结果。
5. memory-bank 更新摘要。
6. 剩余风险。
7. 下一条 Step 12 计划确认 Prompt。
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次不进入 Step 12，也不新增功能代码。

本次目标：
对已经完成的 Step 11 做一次流程审计和补充归档，纠正 Step 11A/11B/11C/11D 被一次性执行的问题。

背景：
- 当前 memory-bank 显示 Step 11 overall DONE。
- Step 11A/11B/11C/11D 均被同一轮执行并归档为 DONE。
- 这不符合 E:\Vibe coding 的 Vibe Coding 方法论：每个子 Step 应该单独计划、执行、验证、记录，再进入下一步。
- 本轮不重做功能、不进入 Step 12、不删除文件、不回滚代码。

请按以下要求执行：

1. 读取规则与上下文
   - 读取 E:\Vibe coding\AGENTS.md
   - 读取 E:\Vibe coding\vibe-methodology\00-operating-protocol.md
   - 读取 E:\Vibe coding\vibe-methodology\01-task-classification.md
   - 读取 E:\Vibe coding\vibe-methodology\08-quality-gates.md
   - 只读取 memory-bank 顶部 Step 11 相关归档：
     - E:\研究院科研成果管理系统\memory-bank\progress.md
     - E:\研究院科研成果管理系统\memory-bank\evidence.md
     - E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
     - E:\研究院科研成果管理系统\memory-bank\decisions.md

2. 审计 Step 11 子步骤
   分别检查并输出：
   - Step 11A 原目标、实际证据、是否满足完成定义
   - Step 11B 原目标、实际证据、是否满足完成定义
   - Step 11C 原目标、实际证据、是否满足完成定义
   - Step 11D 原目标、实际证据、是否满足完成定义

3. 重新运行或补充最小验证
   在不访问真实数据库、不运行 migrate/seed、不读取 .env 内容的前提下，运行必要门禁：
   - corepack pnpm --filter @research-ip/web typecheck
   - corepack pnpm --filter @research-ip/web test
   - corepack pnpm --filter @research-ip/web build
   - corepack pnpm lint

4. 浏览器验收
   如可行，启动前端 dev server，验证：
   - 无用户上下文状态
   - 科研人员上下文
   - 科研秘书上下文
   - 系统管理员上下文
   - 刷新后 demo user id 恢复
   - 成果管理仍为 Step 12 边界页
   - 未进入 Step 12/13/14/15

5. 更新 memory-bank
   只允许补充审计记录，不新增业务功能：
   - 在 progress.md 增加 Step 11 process audit / remediation 记录
   - 在 evidence.md 增加按 11A/11B/11C/11D 分拆的验证证据
   - 在 decisions.md 增加一条流程决策：后续子 Step 必须逐个确认、逐个执行、逐个归档
   - 如 implementation-plan.md 需要，补充 next-step startup control：Step 12 不得直接实现，必须先做计划确认，且 Step 12A/12B/12C/12D 必须逐步推进

6. 输出
   - 流程偏差说明
   - 每个 11A/11B/11C/11D 的审计结果
   - 运行的门禁与结果
   - memory-bank 更新摘要
   - 是否仍可接受 Step 11 overall DONE
   - 下一步建议：Step 12 计划确认，但必须只确认 Step 12A，不一次性执行全部 Step 12
~~~

# 12、Step 12

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只做 Step 12 计划确认，不执行实现、不修改代码、不运行数据库 migrate/seed。

当前权威状态：
- Step 9 overall DONE。
- Step 10 overall DONE。
- Step 11 overall DONE。
- Step 11A/11B/11C/11D DONE。
- Step 11 已完成前端应用基座、演示用户上下文、API client、统一状态组件和工作台基础。
- Step 11 已更新 memory-bank/progress.md、evidence.md、implementation-plan.md、decisions.md，并新增 D059。
- 下一步 Step 12 仍为 TODO / not started。
- Step 12 必须先计划确认，不能直接实现。

当前已知边界：
- apps/web 已经有主布局、导航、工作台、demo user 选择、X-Demo-User-Id 注入、localStorage 恢复和统一错误映射。
- 成果管理当前仍是 Step 12 边界页。
- Achievement 后端已有：
  - POST /achievements
  - GET /achievements/:id
  - PATCH /achievements/:id
  - POST /achievements/:id/submit
  - POST /achievements/:id/void
  - POST /achievements/:id/archive
- Achievement 当前没有 GET /achievements 列表路由。
- 因此 Step 12 需要先判断是否补最小成果列表 API，还是只基于现有详情/登记 API 做前端能力。
- Search / Dashboard / Achievement 权限过滤必须以后端为准，前端不承担最终鉴权。
- 不得伪造已完成能力，不得用假数据冒充真实成果列表。

请按 E:\Vibe coding 的规则工作：
- 先索引，后精读。
- 只读取 Step 12 直接相关内容。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 对 memory-bank 只读取顶部最新状态、Step 11 归档、Step 12 相关边界。
- 不读取或展示 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。

建议优先读取：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\01-task-classification.md
3. E:\Vibe coding\vibe-methodology\05-ui-design-system.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 顶部 Step 11 closure
6. E:\研究院科研成果管理系统\memory-bank\progress.md 顶部 Step 11 closure
7. E:\研究院科研成果管理系统\memory-bank\evidence.md 顶部 Step 11 evidence
8. E:\研究院科研成果管理系统\memory-bank\decisions.md 顶部 D059
9. Step 12 相关代码：
   - apps/web/src/App.tsx
   - apps/web/src/Workbench.tsx
   - apps/web/src/api-client.ts
   - apps/web/src/types.ts
   - apps/web/src/components/StateBlocks.tsx
   - apps/api/src/achievements/achievement.controller.ts
   - apps/api/src/achievements/achievement.service.ts
   - apps/api/src/achievements/achievement.repository.ts
   - apps/api/src/achievements/dto/*
   - apps/api/src/authorization/policy/policy-query.factory.ts

本次输出请只给 Step 12 计划，不写代码：
1. 判断 Step 12 任务等级，并说明理由。
2. 明确 Step 12 目标。
3. 明确 Step 12 非目标。
4. 明确后端已有能力和缺口，尤其判断是否需要新增 GET /achievements 最小列表 API。
5. 给出推荐的 Step 12 子步骤，例如：
   - Step 12A：成果列表 API 最小后端切片
   - Step 12B：成果管理前端列表和筛选
   - Step 12C：成果登记/编辑表单
   - Step 12D：详情、动作入口、浏览器验收和 memory-bank 归档
6. 明确每个子步骤涉及文件范围。
7. 明确每个子步骤的验收标准。
8. 明确质量门禁命令。
9. 明确浏览器验收清单。
10. 明确 memory-bank 更新策略。
11. 明确安全边界：
    - 不改 Prisma schema
    - 不新增 migration
    - 不运行 migrate / seed
    - 不读取 .env 内容
    - 不接真实 SSO、邮件、对象存储、Meilisearch
    - 不进入 Step 13/14/15
12. 最后输出一条“Step 12A 执行 Prompt”，供下一轮直接复制执行。

注意：
- 本轮只是计划确认。
- 不执行实现。
- 不修改任何文件。
- 不运行测试、build、lint、migrate、seed。
~~~

## Step 12A

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只做 Step 12A 单步计划确认，不执行实现、不修改代码、不运行测试/build/lint、不运行数据库 migrate/seed。

当前权威状态：
- Step 9 overall DONE。
- Step 10 overall DONE。
- Step 11 overall DONE。
- Step 11A/11B/11C/11D 已完成并归档。
- 但后续必须严格按 Vibe Coding 方法论逐个子 Step 推进：单步计划确认 -> 单步执行 -> 单步验证 -> 单步归档。
- Step 12 overall 仍未开始。
- 本次只确认 Step 12A，不进入 Step 12B/12C/12D。

Step 12A 候选目标：
新增真实、最小、权限裁剪的 `GET /achievements` 成果列表 API，为后续 Step 12B 前端成果管理页提供真实数据入口。

已知后端能力：
- 已有 `POST /achievements`
- 已有 `GET /achievements/:id`
- 已有 `PATCH /achievements/:id`
- 已有 `POST /achievements/:id/submit`
- 已有 `POST /achievements/:id/void`
- 已有 `POST /achievements/:id/archive`
- 当前没有 `GET /achievements` 列表路由。
- `PolicyQueryFactory.achievementReadableWhere(context)` 已支持 own + department scope。
- `PermissionGuard` 使用 `hasAllPermissions`，不支持 `achievement:read_own OR achievement:read_department` 这种 OR 静态权限。

本次请按以下要求只做计划确认：

1. 读取规则与上下文
   - 读取 `E:\Vibe coding\AGENTS.md`
   - 读取 `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
   - 读取 `E:\Vibe coding\vibe-methodology\01-task-classification.md`
   - 读取 `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
   - 只读取 memory-bank 顶部与 Step 11 closure / Step 12 边界直接相关内容：
     - `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
     - `E:\研究院科研成果管理系统\memory-bank\progress.md`
     - `E:\研究院科研成果管理系统\memory-bank\evidence.md`
     - `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 只读确认 Step 12A 相关代码：
     - `apps/api/src/achievements/achievement.controller.ts`
     - `apps/api/src/achievements/achievement.service.ts`
     - `apps/api/src/achievements/achievement.repository.ts`
     - `apps/api/src/achievements/dto/*`
     - `apps/api/src/authorization/policy/policy-query.factory.ts`
     - `apps/api/src/authorization/guards/permission.guard.ts`
     - `apps/api/src/authorization/constants/permission-code.ts`

2. 上下文读取限制
   - 先索引，后精读。
   - 不读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
   - 不全量读取 `prompt.md`。
   - 不读取 `.env` 内容。
   - 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
   - 如果检索结果超过 80 行，停止并改用更窄关键词。

3. 输出 Step 12A 计划
   请只输出计划，不写代码。计划必须包含：
   - Step 12A 任务等级判断和理由。
   - Step 12A 目标。
   - Step 12A 非目标。
   - 推荐 API 契约：
     - `GET /achievements?status=&type=&keyword=&page=&pageSize=`
     - 响应形态建议：`{ items, total, page, pageSize }`
   - 静态权限方案：
     - 是否采用 `@RequirePermissions(PermissionCode.userContextRead)`。
     - 为什么不直接要求 `achievement:read_own` + `achievement:read_department`。
   - 数据权限方案：
     - service 层必须使用 `PolicyQueryFactory.achievementReadableWhere(context)`。
     - 无成果读取权限时应返回空列表还是 403，并说明理由。
     - own / department scope 如何生效。
   - 涉密与字段脱敏方案：
     - 列表 item 只允许返回哪些 summary 字段。
     - 不允许返回哪些详情字段。
     - `SECRET` / `CONFIDENTIAL` 且无有效授权时标题、编号、摘要、contributors 等如何处理。
   - 查询能力边界：
     - 支持哪些筛选。
     - 是否支持 keyword。
     - keyword 搜索哪些轻量字段。
     - 默认排序。
     - page/pageSize 范围。
   - 涉及文件范围。
   - 测试计划：
     - repository 测试。
     - service 测试。
     - controller 测试。
     - AppModule-level root reachability 测试。
     - 401 / 403 / 400 / 空权限 / own scope / department scope / 涉密脱敏测试。
   - 质量门禁命令。
   - memory-bank 更新计划。
   - 安全边界和不得做事项。
   - Step 12A 完成后下一步只能进入 Step 12B 计划确认，不能直接实现 Step 12B。

4. 明确禁止
   - 不执行实现。
   - 不修改任何文件。
   - 不运行测试、build、lint。
   - 不改 Prisma schema。
   - 不新增 migration。
   - 不运行 migrate / seed。
   - 不新增依赖。
   - 不修改 package.json / lockfile。
   - 不新增权限 seed。
   - 不接真实 SSO、邮件、对象存储、Meilisearch。
   - 不进入 Step 12B/12C/12D 或 Step 13/14/15。

最终输出格式：
1. 计划结论
2. Step 12A 目标与非目标
3. API 与权限方案
4. 数据字段与脱敏边界
5. 文件范围
6. 测试与质量门禁
7. memory-bank 更新计划
8. 风险与待确认点
9. 下一步：Step 12A 执行 Prompt 需要在用户确认后单独生成
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只执行 Step 12A：成果列表 API 最小后端切片。

必须严格按 Vibe Coding 方法论执行：
- 只执行 Step 12A。
- 不进入 Step 12B/12C/12D。
- 不做前端成果管理页。
- 不做登记/编辑表单。
- 不做详情/动作前端。
- 完成 Step 12A 后运行门禁、更新 memory-bank、停下来汇报。
- 下一步只能进入 Step 12B 计划确认，不能直接实现 Step 12B。

当前已确认 Step 12A 目标：
新增真实、最小、权限裁剪的 `GET /achievements` 成果列表 API，为后续 Step 12B 前端成果管理页提供真实数据入口。

当前已知后端能力：
- 已有 `POST /achievements`
- 已有 `GET /achievements/:id`
- 已有 `PATCH /achievements/:id`
- 已有 `POST /achievements/:id/submit`
- 已有 `POST /achievements/:id/void`
- 已有 `POST /achievements/:id/archive`
- 当前没有 `GET /achievements` 列表路由。
- `PolicyQueryFactory.achievementReadableWhere(context)` 已支持 own + department scope。
- `PermissionGuard` 使用 `hasAllPermissions`，不支持 `achievement:read_own OR achievement:read_department`。

请先只读确认上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md` 顶部最新 Step 状态
3. `E:\研究院科研成果管理系统\memory-bank\progress.md` 顶部最新 Step 状态
4. `E:\研究院科研成果管理系统\memory-bank\evidence.md` 顶部最新证据
5. `E:\研究院科研成果管理系统\memory-bank\decisions.md` 顶部最新决策号
6. Step 12A 相关代码：
   - `apps/api/src/achievements/achievement.controller.ts`
   - `apps/api/src/achievements/achievement.service.ts`
   - `apps/api/src/achievements/achievement.repository.ts`
   - `apps/api/src/achievements/dto/*`
   - `apps/api/src/achievements/domain/achievement-repository.types.ts`
   - `apps/api/src/authorization/policy/policy-query.factory.ts`
   - `apps/api/src/authorization/guards/permission.guard.ts`
   - `apps/api/src/authorization/constants/permission-code.ts`

读取限制：
- 先索引，后精读。
- 不读取 `prompt历史记录.md`。
- 不全量读取 `prompt.md`。
- 不读取 `.env` 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 如果检索结果过长，改用更窄关键词。

实现范围：
- 新增 `GET /achievements?status=&type=&keyword=&page=&pageSize=`
- 响应形态：
  `{ items, total, page, pageSize }`
- 新增列表 query DTO，支持：
  - `status`: AchievementStatusCode
  - `type`: AchievementTypeCode
  - `keyword`: 仅最小轻量搜索，建议只搜 title
  - `page`: 默认 1，最小 1
  - `pageSize`: 默认 20，范围 1-100
- 默认排序：`updatedAt desc, createdAt desc`

权限方案：
- Controller 静态权限使用 `@RequirePermissions(PermissionCode.userContextRead)`。
- 不新增权限码，不改 seed。
- 不直接要求 `achievement:read_own + achievement:read_department`，因为当前 PermissionGuard 是 AND 语义。
- Service 层必须使用 `PolicyQueryFactory.achievementReadableWhere(context)` 作为最终业务可见性边界。
- 无成果读取权限时返回空列表，而不是 403。
- 缺用户上下文返回 401。
- 缺 `user_context:read` 返回 403。
- own / department / own+department union 必须由测试覆盖。

字段与脱敏边界：
列表 item 只允许返回最小 summary 字段，例如：
- `id`
- `type`
- `status`
- `secretLevel`
- `departmentId`
- `ownerUserId`
- `title`
- `createdAt`
- `updatedAt`
- `submittedAt`
- `archivedAt`
- `voidedAt`
- `isRestricted`
- `isRedacted`

不得返回：
- abstract
- DOI / normalized DOI
- patent applicationNo / grantNo
- software registrationNo
- contributors
- typed detail objects
- fee amount / nextFeeDate
- audit payload
- resource grant details
- workflow comments
- attachment storage facts

涉密规则：
- PUBLIC / INTERNAL：在 policy 允许范围内可返回 summary title。
- SECRET / CONFIDENTIAL 且有有效读取授权：可返回同样 summary。
- SECRET / CONFIDENTIAL 但无有效授权：只保留最小稳定事实；`title` 返回 null 或脱敏值；不得返回任何编号、摘要、contributors 或 typed detail。
- 详情仍由现有 `GET /achievements/:id` 和 service 权限语义处理。

预计可改文件：
- `apps/api/src/achievements/achievement.controller.ts`
- `apps/api/src/achievements/achievement.service.ts`
- `apps/api/src/achievements/achievement.repository.ts`
- `apps/api/src/achievements/dto/achievement-list-query.dto.ts`
- `apps/api/src/achievements/domain/achievement-repository.types.ts`
- `apps/api/src/achievements/achievement.repository.spec.ts`
- `apps/api/src/achievements/achievement.service.spec.ts`
- `apps/api/src/achievements/achievement.controller.spec.ts`
- `apps/api/src/achievements/achievement.app-module.spec.ts`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
- `memory-bank/evidence.md`
- `memory-bank/decisions.md`

原则上只读、不改：
- `apps/api/src/authorization/policy/policy-query.factory.ts`
- `apps/api/src/authorization/guards/permission.guard.ts`
- `apps/api/src/authorization/constants/permission-code.ts`

测试要求：
- repository 测试：caller-provided policy where、status/type/keyword/page/pageSize、count、排序、summary select 不含详情字段。
- service 测试：调用 achievementReadableWhere、own scope、department scope、own+department union、无读取权限空列表、涉密授权通过、涉密无授权脱敏。
- controller 测试：query DTO transform/validation、200、400、401、403。
- AppModule-level 测试：root `GET /achievements` 可达；真实 guards 保持启用；provider override 避免真实数据库访问。

质量门禁：
- `corepack pnpm --filter @research-ip/api test`
- `corepack pnpm --filter @research-ip/api typecheck`
- `corepack pnpm --filter @research-ip/api build`
- `corepack pnpm lint`

禁止：
- 不改 Prisma schema。
- 不新增 migration。
- 不运行 migrate / seed。
- 不读取 `.env` 内容。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不新增权限 seed。
- 不接真实 SSO、邮件、对象存储、Meilisearch。
- 不删除文件，不批量清理。
- 不进入 Step 12B/12C/12D 或 Step 13/14/15。

memory-bank 收尾：
- `progress.md`：记录 Step 12A DONE，Step 12B/12C/12D TODO。
- `evidence.md`：记录改动文件、测试命令、结果、覆盖范围、未覆盖范围、边界。
- `implementation-plan.md`：顶部追加 Step 12A closure / current status。
- `decisions.md`：新增一条决策，编号使用当前文件的下一个可用编号，记录 Achievement list API 使用 `user_context:read` 静态权限 + service-layer policy filtering + 列表脱敏边界。

最终汇报：
1. 完成了什么。
2. 修改了哪些文件。
3. 跑了哪些门禁，结果如何。
4. 权限与涉密脱敏如何实现。
5. memory-bank 更新摘要。
6. 剩余风险。
7. 下一步只能做 Step 12B 计划确认，不能直接实现 Step 12B。
~~~

## Step 12B

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只做 Step 12B 单步计划确认，不执行实现、不修改代码、不运行测试/build/lint、不运行数据库 migrate/seed。

当前权威状态：
- Step 9 overall DONE。
- Step 10 overall DONE。
- Step 11 overall DONE。
- Step 12A DONE。
- Step 12A 已新增真实 `GET /achievements` 最小成果列表 API。
- Step 12A 已完成 repository / service / controller / AppModule 测试。
- Step 12A 门禁已通过：
  - `corepack pnpm --filter @research-ip/api test`
  - `corepack pnpm --filter @research-ip/api typecheck`
  - `corepack pnpm --filter @research-ip/api build`
  - `corepack pnpm lint`
- Step 12B/12C/12D 仍为 TODO / not started。
- 下一步只能确认 Step 12B 计划，不能直接实现 Step 12B。

Step 12B 候选目标：
把前端“成果管理”从 Step 11 边界页推进为真实成果列表页，消费 Step 12A 新增的 `GET /achievements`，提供筛选、分页、加载、空、错误、无用户、权限提示状态。

本次请按以下要求只做计划确认：

1. 读取规则与上下文
   - 读取 `E:\Vibe coding\AGENTS.md`
   - 读取 `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
   - 读取 `E:\Vibe coding\vibe-methodology\01-task-classification.md`
   - 读取 `E:\Vibe coding\vibe-methodology\05-ui-design-system.md`
   - 读取 `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
   - 只读取 memory-bank 顶部与 Step 12A closure / Step 12B 边界直接相关内容：
     - `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
     - `E:\研究院科研成果管理系统\memory-bank\progress.md`
     - `E:\研究院科研成果管理系统\memory-bank\evidence.md`
     - `E:\研究院科研成果管理系统\memory-bank\decisions.md`
   - 只读确认 Step 12B 相关代码：
     - `apps/web/src/App.tsx`
     - `apps/web/src/Workbench.tsx`
     - `apps/web/src/api-client.ts`
     - `apps/web/src/types.ts`
     - `apps/web/src/components/StateBlocks.tsx`
     - `apps/web/src/App.css`
     - `apps/web/package.json`
     - `apps/web/vite.config.ts`
   - 只读确认 Step 12A API 契约相关后端文件：
     - `apps/api/src/achievements/achievement.controller.ts`
     - `apps/api/src/achievements/dto/achievement-list-query.dto.ts`
     - `apps/api/src/achievements/domain/achievement-repository.types.ts`

2. 上下文读取限制
   - 先索引，后精读。
   - 只读取 Step 12B 直接相关内容。
   - 不读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
   - 不全量读取 `prompt.md`。
   - 不读取 `.env` 内容。
   - 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
   - 如果检索结果超过 80 行，停止并改用更窄关键词。

3. 输出 Step 12B 计划
   请只输出计划，不写代码。计划必须包含：
   - Step 12B 任务等级判断和理由。
   - Step 12B 目标。
   - Step 12B 非目标。
   - 前端页面信息架构：
     - 筛选区
     - 列表表格
     - 分页
     - 操作入口
     - 状态提示区
   - 数据流：
     - demo user context 如何传入。
     - `GET /achievements` 如何调用。
     - status/type/keyword/page/pageSize 如何维护。
     - loading / empty / error / forbidden / no-user 状态如何展示。
   - UI 状态清单：
     - 未选择 demo user
     - 首次加载
     - 加载中
     - 成功有数据
     - 成功空列表
     - 筛选无结果
     - 400 参数错误
     - 401 未选择或上下文失效
     - 403 无 `user_context:read`
     - 5xx/network 服务不可用
     - SECRET / CONFIDENTIAL 脱敏列表项
   - API client 是否需要扩展：
     - Step 12B 是否只需 GET。
     - 是否保留 POST/PATCH 给 Step 12C。
   - 类型定义计划：
     - AchievementListResult
     - AchievementListItem
     - AchievementTypeCode
     - AchievementStatusCode
     - SecretLevelCode
   - 组件拆分建议：
     - 是否新增 `apps/web/src/Achievements.tsx`
     - 是否新增局部组件或先放在单文件内
   - 涉及文件范围。
   - 测试计划：
     - API client / query serialization 测试。
     - 成果列表状态映射测试，如项目测试工具支持。
     - 如果缺少 React component testing 工具，说明不新增依赖，改用 typecheck/build/browser 验收。
   - 浏览器验收计划：
     - 无用户状态
     - 科研人员上下文
     - 科研秘书上下文
     - 系统管理员上下文
     - API 成功、空、错误、403 展示
     - 脱敏项展示不泄露标题
     - 刷新后 demo user 恢复
   - 质量门禁命令。
   - memory-bank 更新计划。
   - 安全边界和不得做事项。
   - Step 12B 完成后下一步只能进入 Step 12C 计划确认，不能直接实现 Step 12C。

4. 明确禁止
   - 不执行实现。
   - 不修改任何文件。
   - 不运行测试、build、lint。
   - 不改后端业务语义。
   - 不改 Prisma schema。
   - 不新增 migration。
   - 不运行 migrate / seed。
   - 不读取 `.env` 内容。
   - 不新增依赖。
   - 不修改 package.json / lockfile。
   - 不接真实 SSO、邮件、对象存储、Meilisearch。
   - 不进入 Step 12C/12D 或 Step 13/14/15。

最终输出格式：
1. 计划结论
2. Step 12B 目标与非目标
3. 页面信息架构
4. 数据流与状态设计
5. 类型与组件拆分计划
6. 文件范围
7. 测试、浏览器验收与质量门禁
8. memory-bank 更新计划
9. 风险与待确认点
10. 下一步：Step 12B 执行 Prompt 需要在用户确认后单独生成
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只执行 Step 12B：前端成果管理列表页。

必须严格按 Vibe Coding 方法论执行：
- 只执行 Step 12B。
- 不进入 Step 12C/12D。
- 不做成果登记/编辑表单。
- 不做详情页真实内容。
- 不调用 submit/void/archive 动作 API。
- 完成 Step 12B 后运行门禁、做浏览器验收、更新 memory-bank、停下来汇报。
- 下一步只能进入 Step 12C 计划确认，不能直接实现 Step 12C。

当前权威状态：
- Step 11 overall DONE。
- Step 12A DONE。
- Step 12A 已新增真实 `GET /achievements?status=&type=&keyword=&page=&pageSize=`。
- Step 12A 响应形态为 `{ items, total, page, pageSize }`。
- Step 12A 列表 item 只返回 summary 字段。
- `SECRET` / `CONFIDENTIAL` 且无有效授权时，后端会返回脱敏结果，`title` 可能为 null，并标记 `isRestricted` / `isRedacted`。
- Step 12B/12C/12D 中只有 Step 12B 可以执行；Step 12C/12D 仍为 TODO。

请先只读确认上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md` 顶部最新 Step 状态
3. `E:\研究院科研成果管理系统\memory-bank\progress.md` 顶部最新 Step 状态
4. `E:\研究院科研成果管理系统\memory-bank\evidence.md` 顶部最新证据
5. `E:\研究院科研成果管理系统\memory-bank\decisions.md` 顶部最新决策号
6. Step 12B 相关前端文件：
   - `apps/web/src/App.tsx`
   - `apps/web/src/Workbench.tsx`
   - `apps/web/src/api-client.ts`
   - `apps/web/src/api-client.test.ts`
   - `apps/web/src/types.ts`
   - `apps/web/src/components/StateBlocks.tsx`
   - `apps/web/src/App.css`
   - `apps/web/package.json`
   - `apps/web/vite.config.ts`
7. Step 12A API 契约只读参考：
   - `apps/api/src/achievements/achievement.controller.ts`
   - `apps/api/src/achievements/dto/achievement-list-query.dto.ts`
   - `apps/api/src/achievements/domain/achievement-repository.types.ts`

读取限制：
- 先索引，后精读。
- 不读取 `prompt历史记录.md`。
- 不全量读取 `prompt.md`。
- 不读取 `.env` 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 如果检索结果过长，改用更窄关键词。

实现目标：
- 将前端“成果管理”从 Step 11 边界页替换为真实成果列表页。
- 消费真实 `GET /achievements`。
- 支持筛选、分页、刷新。
- 覆盖无用户、加载、成功有数据、成功空列表、筛选无结果、400、401、403、5xx/network 状态。
- 正确展示后端脱敏项，不泄露 title 为 null 的敏感标题。
- 不使用假数据冒充成果列表。

页面信息架构：
- 顶部 SectionHeader：成果管理。
- 权限提示：最终权限以后端为准。
- 筛选区：
  - keyword 输入框
  - status 下拉
  - type 下拉
  - 查询 / 重置 / 刷新按钮
- 列表表格：
  - 标题
  - 类型
  - 状态
  - 密级
  - 所属部门
  - 负责人
  - 更新时间
  - 状态时间
  - 操作入口
- 分页：
  - 使用后端 total/page/pageSize。
  - 翻页保留筛选条件。
  - 筛选变化后回到 page=1。
- 操作入口：
  - “查看详情”只显示 Step 12D 边界提示或禁用态。
  - “登记成果”可以显示为 Step 12C 边界入口，但不实现表单、不调用 POST。

数据流：
- App.tsx 继续维护 demoUserId。
- `activeKey === "achievements"` 时渲染 `<Achievements demoUserId={demoUserId} />`。
- 未选择 demo user 时不发业务请求。
- 选择 demo user 后通过 `createApiClient(demoUserId)` 调用 `GET /achievements`。
- 参数为 status/type/keyword/page/pageSize。
- 空字符串参数不进入 query。
- demo user 变化时重新加载或进入 no-user 状态。

类型计划：
在 `apps/web/src/types.ts` 增加或补齐：
- `AchievementTypeCode`
- `AchievementStatusCode`
- `SecretLevelCode`
- `AchievementListItem`
- `AchievementListResult`
- 可选 `AchievementListQuery`

API client：
- Step 12B 只需要 GET。
- 不新增 POST/PATCH。
- 可新增 query serialization 测试或辅助函数测试。
- 保持现有错误映射。

组件拆分：
- 新增 `apps/web/src/Achievements.tsx`。
- 初期允许把筛选条、表格、脱敏标题渲染、分页处理放在同文件内。
- 不做过度抽象。

预计可改文件：
- `apps/web/src/App.tsx`
- `apps/web/src/Achievements.tsx`
- `apps/web/src/api-client.ts`
- `apps/web/src/api-client.test.ts`
- `apps/web/src/types.ts`
- `apps/web/src/App.css`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
- `memory-bank/evidence.md`
- `memory-bank/decisions.md`，仅当形成新关键决策时更新，编号使用当前文件下一个可用编号

原则上只读：
- `apps/web/src/components/StateBlocks.tsx`
- Step 12A 后端 API 契约相关文件

测试要求：
- 扩展或新增 Vitest，覆盖：
  - status/type/keyword/page/pageSize query serialization。
  - 空参数不进入 URL。
  - 400/401/403/5xx/network 错误映射保持正确。
  - 如抽出纯函数，测试脱敏标题渲染逻辑和筛选 query 构造。
- 不新增 React Testing Library 或其他依赖。
- 如果组件级交互无法自动化，用 typecheck/build/browser 验收补足，并记录风险。

质量门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器验收：
- 启动前端 dev server。
- 验证无用户状态：不发业务请求，显示选择 demo user 提示。
- 验证科研人员上下文。
- 验证科研秘书上下文。
- 验证系统管理员上下文。
- 验证筛选、重置、刷新、分页 UI。
- 验证 loading、empty、error、403 展示。
- 验证脱敏项展示不泄露标题；如果本地数据不足以产生脱敏项，记录为未覆盖风险。
- 验证刷新后 demo user 从 localStorage 恢复。
- 验证桌面与窄屏下筛选区、表格、分页不重叠。
- 如果本地后端未启动、数据库不可用或没有测试数据，不运行 migrate/seed，不造数据；用服务不可用/空状态作为替代验收，并在 evidence 中记录未覆盖范围。

禁止：
- 不改后端业务语义。
- 不改 Prisma schema。
- 不新增 migration。
- 不运行 migrate / seed。
- 不读取 `.env` 内容。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不接真实 SSO、邮件、对象存储、Meilisearch。
- 不使用假数据冒充真实成果列表。
- 不进入 Step 12C/12D 或 Step 13/14/15。

memory-bank 收尾：
- `progress.md`：记录 Step 12B DONE，Step 12C/12D TODO。
- `evidence.md`：记录改动文件、测试命令、结果、浏览器验收、未覆盖范围、边界。
- `implementation-plan.md`：顶部追加 Step 12B closure / current status。
- `decisions.md`：如形成新关键决策，新增一条决策，编号使用当前文件下一个可用编号；建议记录“前端成果列表只消费后端列表与脱敏结果，不自行鉴权、不伪造数据”。

最终汇报：
1. 完成了什么。
2. 修改了哪些文件。
3. 跑了哪些门禁，结果如何。
4. 浏览器验收结果。
5. 脱敏列表项如何展示。
6. memory-bank 更新摘要。
7. 剩余风险。
8. 下一步只能做 Step 12C 计划确认，不能直接实现 Step 12C。
~~~

## Step 12C

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只做 Step 12C 单步计划确认，不执行实现、不修改代码、不运行测试/build/lint、不运行数据库 migrate/seed。

当前权威状态：
- Step 11 overall DONE。
- Step 12A DONE：已新增真实 `GET /achievements` 最小成果列表 API。
- Step 12B DONE：前端“成果管理”已替换为真实列表页，消费 `GET /achievements`，支持筛选、分页配置、刷新、无用户、错误、空态与脱敏展示逻辑。
- Step 12B 已更新 memory-bank，并新增 D062。
- Step 12C/12D 仍为 TODO / not started。
- 下一步只能确认 Step 12C 计划，不能直接实现 Step 12C。

Step 12C 候选目标：
在前端实现成果登记 / 编辑草稿表单计划，基于现有后端 Achievement API：
- `POST /achievements`
- `GET /achievements/:id`
- `PATCH /achievements/:id`

本次请按以下要求只做计划确认：

1. 读取规则与上下文
   - 读取 `E:\Vibe coding\AGENTS.md`
   - 读取 `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
   - 读取 `E:\Vibe coding\vibe-methodology\01-task-classification.md`
   - 读取 `E:\Vibe coding\vibe-methodology\05-ui-design-system.md`
   - 读取 `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
   - 只读取 memory-bank 顶部与 Step 12A / Step 12B closure、Step 12C 边界直接相关内容：
     - `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
     - `E:\研究院科研成果管理系统\memory-bank\progress.md`
     - `E:\研究院科研成果管理系统\memory-bank\evidence.md`
     - `E:\研究院科研成果管理系统\memory-bank\decisions.md`

2. 只读确认 Step 12C 相关代码
   前端：
   - `apps/web/src/App.tsx`
   - `apps/web/src/Achievements.tsx`
   - `apps/web/src/Achievements.test.ts`
   - `apps/web/src/api-client.ts`
   - `apps/web/src/api-client.test.ts`
   - `apps/web/src/types.ts`
   - `apps/web/src/components/StateBlocks.tsx`
   - `apps/web/src/App.css`

   后端契约：
   - `apps/api/src/achievements/achievement.controller.ts`
   - `apps/api/src/achievements/achievement.service.ts`
   - `apps/api/src/achievements/dto/create-achievement.dto.ts`
   - `apps/api/src/achievements/dto/update-achievement.dto.ts`
   - `apps/api/src/achievements/dto/achievement-common.dto.ts`
   - `apps/api/src/achievements/dto/paper-detail.dto.ts`
   - `apps/api/src/achievements/dto/patent-detail.dto.ts`
   - `apps/api/src/achievements/dto/software-copyright-detail.dto.ts`
   - `apps/api/src/achievements/dto/contributor.dto.ts`
   - `apps/api/src/achievements/domain/achievement-domain.types.ts`

3. 上下文读取限制
   - 先索引，后精读。
   - 只读取 Step 12C 直接相关内容。
   - 不读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
   - 不全量读取 `prompt.md`。
   - 不读取 `.env` 内容。
   - 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
   - 如果检索结果超过 80 行，停止并改用更窄关键词。

4. 输出 Step 12C 计划
   请只输出计划，不写代码。计划必须包含：
   - Step 12C 任务等级判断和理由。
   - Step 12C 目标。
   - Step 12C 非目标。
   - 明确本步是否只做前端实现，是否不改后端业务语义。
   - 明确是否包含：
     - 新建成果草稿。
     - 编辑已有草稿。
     - 编辑部门驳回后的成果。
     - 从列表进入编辑。
     - 使用 `GET /achievements/:id` 预填表单。
     - 使用 `POST /achievements` 创建草稿。
     - 使用 `PATCH /achievements/:id` 更新草稿。
   - 明确不包含：
     - submit / void / archive 动作。
     - 审批 approve / reject。
     - 附件上传下载。
     - 真实详情页完整展示。
     - 费用、搜索、看板、审计扩展。

5. 表单范围规划
   请基于现有 DTO 规划三类表单字段：
   - PAPER
   - PATENT
   - SOFTWARE_COPYRIGHT

   需要规划：
   - 基础字段：type、title、secretLevel、departmentId。
   - 类型专属字段。
   - contributors 字段。
   - 必填、可选、格式、数字、日期校验。
   - 类型切换时如何处理已填写字段。
   - 后端 400/403/409/422 错误如何展示。
   - 成功创建 / 成功更新后的 UI 反馈。
   - 是否刷新成果列表。
   - 是否关闭弹窗或保留表单。

6. API client 计划
   - 是否扩展 `api-client.ts` 支持 POST / PATCH。
   - 是否保留现有 GET 行为。
   - 是否新增统一 JSON body handling。
   - 是否扩展测试覆盖 POST / PATCH、错误映射、空 body / 204 情况。

7. UI 与交互计划
   - 推荐使用弹窗、抽屉还是页面内表单，并说明理由。
   - “登记成果”入口如何从 Step 12B 边界按钮变成真实入口。
   - 列表项是否显示“编辑草稿”入口。
   - 哪些状态允许编辑：DRAFT、DEPARTMENT_REJECTED。
   - 其他状态如何展示禁用或边界提示。
   - 表单 loading、saving、success、error、permission denied、validation error 状态如何展示。
   - 桌面和窄屏布局如何避免重叠和溢出。

8. 组件拆分计划
   请判断是否新增：
   - `apps/web/src/AchievementForm.tsx`
   - 或将表单先放在 `Achievements.tsx` 内
   - 是否抽出纯函数用于测试：
     - DTO 构造
     - 表单初始值转换
     - 类型标签 / 状态标签
     - 可编辑状态判断

9. 测试计划
   - API client POST/PATCH 测试。
   - DTO 构造纯函数测试。
   - 可编辑状态判断测试。
   - 表单错误映射测试。
   - 如果没有 React component testing 依赖，不新增依赖，用 typecheck/build/browser 验收补足，并记录风险。

10. 浏览器验收计划
   至少规划：
   - 无用户状态不能提交。
   - 科研人员创建 PAPER/PATENT/SOFTWARE_COPYRIGHT 草稿入口和表单展示。
   - 编辑 DRAFT 或 DEPARTMENT_REJECTED 的入口与预填。
   - 400 validation error 展示。
   - 403 permission denied 展示。
   - 409 conflict 展示。
   - 422 unsupported / invalid payload 展示。
   - 成功创建或更新后的反馈。
   - 窄屏表单不重叠。
   - 如果后端未启动或数据库不可用，不运行 migrate/seed，不造数据；记录未覆盖范围。

11. 质量门禁命令
   计划中列出 Step 12C 执行后应运行：
   - `corepack pnpm --filter @research-ip/web test`
   - `corepack pnpm --filter @research-ip/web typecheck`
   - `corepack pnpm --filter @research-ip/web build`
   - `corepack pnpm lint`

   如 Step 12C 计划发现必须改后端测试，再说明原因；默认不改后端、不跑 api 门禁。

12. memory-bank 更新计划
   Step 12C 执行完成后应更新：
   - `memory-bank/progress.md`
   - `memory-bank/evidence.md`
   - `memory-bank/implementation-plan.md`
   - `memory-bank/decisions.md`，仅当形成新关键决策时更新，编号使用当前文件下一个可用编号

   必须记录：
   - Step 12C DONE。
   - Step 12D TODO。
   - 改动文件范围。
   - 表单能力边界。
   - 测试和浏览器验收结果。
   - 未覆盖风险。
   - 未进入 Step 12D/13/14/15。

13. 明确禁止
   - 不执行实现。
   - 不修改任何文件。
   - 不运行测试、build、lint。
   - 不改 Prisma schema。
   - 不新增 migration。
   - 不运行 migrate / seed。
   - 不读取 `.env` 内容。
   - 不新增依赖。
   - 不修改 package.json / lockfile。
   - 不改后端业务语义，除非计划中明确发现阻塞并先请求用户确认。
   - 不接真实 SSO、邮件、对象存储、Meilisearch。
   - 不进入 Step 12D 或 Step 13/14/15。

最终输出格式：
1. 计划结论
2. Step 12C 目标与非目标
3. 后端契约确认
4. 表单范围与字段计划
5. API client 扩展计划
6. UI / 组件拆分计划
7. 测试、浏览器验收与质量门禁
8. memory-bank 更新计划
9. 风险与待确认点
10. 下一步：Step 12C 执行 Prompt 需要在用户确认后单独生成
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只执行 Step 12C：前端成果登记 / 编辑草稿表单。

必须严格按 Vibe Coding 方法论执行：
- 只执行 Step 12C。
- 不进入 Step 12D。
- 不实现真实详情页完整展示。
- 不调用 submit / void / archive 动作 API。
- 不做审批 approve / reject。
- 不做附件上传下载。
- 不改后端业务语义。
- 完成 Step 12C 后运行门禁、做浏览器验收、更新 memory-bank、停下来汇报。
- 下一步只能进入 Step 12D 计划确认，不能直接实现 Step 12D。

当前权威状态：
- Step 12A DONE：后端已有真实 `GET /achievements` 列表 API。
- Step 12B DONE：前端成果管理页已消费 `GET /achievements`，支持列表、筛选、分页、刷新、错误/空态/脱敏展示。
- Step 12C/12D 中只有 Step 12C 可以执行；Step 12D 仍为 TODO。

Step 12C 已确认边界：
- 默认只做前端实现与 API client 扩展。
- 不改后端业务语义。
- 创建成果草稿：支持。
- 编辑已有 DRAFT：支持。
- 编辑 DEPARTMENT_REJECTED：当前后端不支持真实 PATCH，本步只显示不可编辑/后端不支持提示。
- 创建时 contributors：支持。
- 编辑时 contributors：默认只读或不提交，因为当前后端 PATCH 不支持更新 contributors。

请先只读确认上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md` 顶部最新 Step 状态
3. `E:\研究院科研成果管理系统\memory-bank\progress.md` 顶部最新 Step 状态
4. `E:\研究院科研成果管理系统\memory-bank\evidence.md` 顶部最新证据
5. `E:\研究院科研成果管理系统\memory-bank\decisions.md` 顶部最新决策号
6. Step 12C 相关前端文件：
   - `apps/web/src/App.tsx`
   - `apps/web/src/Achievements.tsx`
   - `apps/web/src/Achievements.test.ts`
   - `apps/web/src/api-client.ts`
   - `apps/web/src/api-client.test.ts`
   - `apps/web/src/types.ts`
   - `apps/web/src/components/StateBlocks.tsx`
   - `apps/web/src/App.css`
7. 后端契约只读参考：
   - `apps/api/src/achievements/achievement.controller.ts`
   - `apps/api/src/achievements/dto/create-achievement.dto.ts`
   - `apps/api/src/achievements/dto/update-achievement.dto.ts`
   - `apps/api/src/achievements/dto/achievement-common.dto.ts`
   - `apps/api/src/achievements/dto/paper-detail.dto.ts`
   - `apps/api/src/achievements/dto/patent-detail.dto.ts`
   - `apps/api/src/achievements/dto/software-copyright-detail.dto.ts`
   - `apps/api/src/achievements/dto/contributor.dto.ts`
   - `apps/api/src/achievements/domain/achievement-domain.types.ts`

读取限制：
- 先索引，后精读。
- 不读取 `prompt历史记录.md`。
- 不全量读取 `prompt.md`。
- 不读取 `.env` 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 如果检索结果过长，改用更窄关键词。

实现目标：
- 将 Step 12B 的“登记成果”边界入口变为真实创建草稿入口。
- 从列表中为 DRAFT 成果提供“编辑草稿”入口。
- 使用 `GET /achievements/:id` 预填编辑表单。
- 使用 `POST /achievements` 创建草稿。
- 使用 `PATCH /achievements/:id` 更新 DRAFT 草稿。
- 表单覆盖 PAPER / PATENT / SOFTWARE_COPYRIGHT 三类 DTO。
- 成功后给出反馈，并刷新成果列表。

API client 扩展：
- 保留现有 `get<T>` 行为。
- 新增 `post<T>(path, body?)`。
- 新增 `patch<T>(path, body?)`。
- 有 body 时设置 `Content-Type: application/json`。
- body 使用 `JSON.stringify`。
- 204 返回 `undefined`。
- 错误映射沿用现有机制。
- 补充错误文案：
  - 409：数据状态冲突
  - 422：提交内容不符合业务规则
  - 404：资源不存在，若实现时合适

表单 UI：
- 推荐新增 `apps/web/src/AchievementForm.tsx`。
- 使用 Drawer 抽屉表单，保留列表上下文。
- `Achievements.tsx` 负责列表、打开/关闭 Drawer、刷新列表。
- `AchievementForm.tsx` 负责表单 UI、详情加载、提交、错误展示。
- 创建成功：提示“草稿已创建”，关闭 Drawer 并刷新列表。
- 更新成功：提示“草稿已保存”，保留表单或关闭 Drawer；优先按计划保留表单，若交互复杂可关闭并刷新，但需记录选择。
- 窄屏 Drawer 不重叠、不溢出。

字段范围：
基础字段：
- `type`：创建必填，编辑只读。
- `title`：必填，1-500。
- `secretLevel`：可选，默认建议 INTERNAL。
- `departmentId`：创建时不暴露可编辑输入；如展示，只读显示当前上下文部门。

PAPER：
- doi
- journal
- issnCn
- publishYear
- includedType
- impactFactor
- partition
- abstract

PATENT：
- applicationNo
- grantNo
- patentType
- filingDate
- grantDate
- nextFeeDate
- feeAmount
- legalStatus

SOFTWARE_COPYRIGHT：
- registrationNo
- softwareVersion
- softwareType
- publishDate
- registerDate
- runEnv

contributors：
- 创建时至少 1 条。
- 字段：name、userId、organization、contributorType、contributorRole、sortOrder。
- 编辑模式默认只读或不提交 contributors，不能伪装支持编辑 contributors。

类型切换：
- 创建模式允许切换 type。
- 切换 type 时只保留基础字段和 contributors，清空旧类型 detail。
- 编辑模式不允许切换 type。

列表入口：
- “登记成果”按钮打开创建 Drawer。
- DRAFT：显示“编辑草稿”。
- DEPARTMENT_REJECTED：显示禁用编辑或提示“当前后端暂不支持驳回后编辑”。
- 其他状态：不可编辑，保留 Step 12D 详情边界提示。

可新增纯函数并测试：
- DTO 构造。
- 详情转表单初始值。
- type/status/secret/contributor 标签。
- `isEditableAchievementStatus(status)`。
- 错误提示映射。
- 空字符串转 undefined 或不提交。
- 数字/日期字段格式化。

预计可改文件：
- `apps/web/src/Achievements.tsx`
- `apps/web/src/AchievementForm.tsx`
- `apps/web/src/Achievements.test.ts`
- `apps/web/src/api-client.ts`
- `apps/web/src/api-client.test.ts`
- `apps/web/src/types.ts`
- `apps/web/src/App.css`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
- `memory-bank/evidence.md`
- `memory-bank/decisions.md`，仅当形成新关键决策时更新，编号使用当前文件下一个可用编号

原则上不改：
- 后端业务文件
- Prisma schema / migration / seed
- package.json / lockfile
- `.env`

测试要求：
- API client POST/PATCH method、header、body。
- 空 body。
- 204。
- 400/401/403/404/409/422/5xx/network 映射。
- DTO 构造：
  - PAPER 只提交 paperDetail。
  - PATENT 只提交 patentDetail。
  - SOFTWARE_COPYRIGHT 只提交 softwareCopyrightDetail。
- 可编辑状态：
  - DRAFT 可编辑。
  - DEPARTMENT_REJECTED 当前不可真实编辑。
  - 其他状态不可编辑。
- 表单初始值转换。
- 错误映射。
- 不新增 React Testing Library 或其他依赖；组件交互用 typecheck/build/browser 验收补足并记录风险。

质量门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

默认不跑 API 门禁；除非实现中不得不改后端，必须先停下来说明原因并等待用户确认。

浏览器验收：
- 启动前端 dev server。
- 无用户状态不能提交。
- 科研人员打开 PAPER / PATENT / SOFTWARE_COPYRIGHT 创建表单。
- DRAFT 从列表进入编辑，GET 预填，PATCH 保存。
- DEPARTMENT_REJECTED 显示禁用或后端不支持提示。
- 400 validation error 展示。
- 403 permission denied 展示。
- 409 conflict 展示。
- 422 unsupported / invalid payload 展示。
- 成功创建或更新后的反馈。
- 窄屏 Drawer 不重叠、不溢出。
- 如果后端未启动或数据库不可用，不运行 migrate/seed，不造数据；记录未覆盖范围。

禁止：
- 不改后端业务语义。
- 不改 Prisma schema。
- 不新增 migration。
- 不运行 migrate / seed。
- 不读取 `.env` 内容。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不接真实 SSO、邮件、对象存储、Meilisearch。
- 不调用 submit / void / archive。
- 不进入 Step 12D 或 Step 13/14/15。

memory-bank 收尾：
- `progress.md`：记录 Step 12C DONE，Step 12D TODO。
- `evidence.md`：记录改动文件、测试命令、结果、浏览器验收、未覆盖范围、边界。
- `implementation-plan.md`：顶部追加 Step 12C closure / current status。
- `decisions.md`：如形成新关键决策，新增一条决策，编号使用当前文件下一个可用编号；建议记录“Step 12C 前端表单遵循现有后端草稿契约，默认不扩展后端状态语义”。

最终汇报：
1. 完成了什么。
2. 修改了哪些文件。
3. 跑了哪些门禁，结果如何。
4. 浏览器验收结果。
5. 表单能力边界，尤其 DEPARTMENT_REJECTED 和 contributors 编辑限制。
6. memory-bank 更新摘要。
7. 剩余风险。
8. 下一步只能做 Step 12D 计划确认，不能直接实现 Step 12D。
~~~

## Step 12D 

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只做 Step 12D 单步计划确认，不执行实现、不修改代码、不运行测试/build/lint、不运行数据库 migrate/seed。

当前权威状态：
- Step 12A DONE：后端已新增真实 `GET /achievements` 列表 API。
- Step 12B DONE：前端成果管理页已消费真实列表 API，支持筛选、分页、刷新、空态、错误态和脱敏展示。
- Step 12C DONE：前端已实现真实“登记成果 / 编辑草稿”抽屉表单，接入：
  - `POST /achievements`
  - `GET /achievements/:id`
  - `PATCH /achievements/:id`
- Step 12C 已确认边界：
  - 未实现详情页。
  - 未调用 submit / void / archive。
  - 未实现审批、附件、费用、搜索、看板、审计扩展。
  - 未改后端业务语义。
  - DEPARTMENT_REJECTED 暂禁用编辑。
  - 编辑模式 contributors 只读且不进 PATCH payload。
- Step 12D 仍为 TODO / not started。
- 下一步只能确认 Step 12D 计划，不能直接实现 Step 12D。

Step 12D 候选目标：
完成成果管理第一版闭环的详情与动作入口：基于现有后端 API，规划前端成果详情查看，以及 submit / void / archive 动作入口与 Step 12 总体验收归档。

现有相关后端 API：
- `GET /achievements/:id`
- `POST /achievements/:id/submit`
- `POST /achievements/:id/void`
- `POST /achievements/:id/archive`

本次请按以下要求只做计划确认：

1. 读取规则与上下文
   - 读取 `E:\Vibe coding\AGENTS.md`
   - 读取 `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
   - 读取 `E:\Vibe coding\vibe-methodology\01-task-classification.md`
   - 读取 `E:\Vibe coding\vibe-methodology\05-ui-design-system.md`
   - 读取 `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
   - 只读取 memory-bank 顶部与 Step 12A / 12B / 12C closure、Step 12D 边界直接相关内容：
     - `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
     - `E:\研究院科研成果管理系统\memory-bank\progress.md`
     - `E:\研究院科研成果管理系统\memory-bank\evidence.md`
     - `E:\研究院科研成果管理系统\memory-bank\decisions.md`

2. 只读确认 Step 12D 相关代码
   前端：
   - `apps/web/src/App.tsx`
   - `apps/web/src/Achievements.tsx`
   - `apps/web/src/AchievementForm.tsx`
   - `apps/web/src/Achievements.test.ts`
   - `apps/web/src/AchievementForm.test.ts`
   - `apps/web/src/api-client.ts`
   - `apps/web/src/api-client.test.ts`
   - `apps/web/src/types.ts`
   - `apps/web/src/components/StateBlocks.tsx`
   - `apps/web/src/App.css`

   后端契约：
   - `apps/api/src/achievements/achievement.controller.ts`
   - `apps/api/src/achievements/achievement.service.ts`
   - `apps/api/src/achievements/dto/achievement-action.dto.ts`
   - `apps/api/src/achievements/domain/achievement-domain.types.ts`
   - `apps/api/src/workflow/workflow.controller.ts`，只读确认 Step 12D 不进入审批 approve/reject 页面

3. 上下文读取限制
   - 先索引，后精读。
   - 只读取 Step 12D 直接相关内容。
   - 不读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
   - 不全量读取 `prompt.md`。
   - 不读取 `.env` 内容。
   - 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
   - 如果检索结果超过 80 行，停止并改用更窄关键词。

4. 输出 Step 12D 计划
   请只输出计划，不写代码。计划必须包含：
   - Step 12D 任务等级判断和理由。
   - Step 12D 目标。
   - Step 12D 非目标。
   - 明确本步是否只做前端实现，是否不改后端业务语义。
   - 明确是否包含：
     - 从列表进入成果详情查看。
     - 使用 `GET /achievements/:id` 展示详情。
     - `DRAFT` 成果提交审批：`POST /achievements/:id/submit`。
     - 可作废状态的作废入口：`POST /achievements/:id/void`。
     - `PENDING_ARCHIVE` 成果归档入口：`POST /achievements/:id/archive`。
     - 动作成功后刷新列表 / 详情。
     - 动作失败后的 400/403/404/409/422/error 展示。
   - 明确不包含：
     - 审批 approve / reject。
     - 附件上传下载。
     - 费用 CRUD。
     - 搜索中心完整页面。
     - 统计看板扩展。
     - 审计日志页面。
     - 后端状态机修改。
     - Prisma schema / migration / seed。

5. 详情展示计划
   请规划详情 UI：
   - 使用 Drawer / Modal / 页面内面板，说明理由。
   - 基础字段展示。
   - PAPER / PATENT / SOFTWARE_COPYRIGHT 类型详情展示。
   - contributors 展示。
   - workflow / attachment / fee 信息是否显示边界提示。
   - SECRET / CONFIDENTIAL 无授权时如何处理后端 403。
   - title 被后端脱敏或详情不可读时如何展示。
   - loading / empty / error / forbidden / not found 状态。

6. 动作入口计划
   请基于当前成果状态规划动作：
   - DRAFT：允许提交审批。
   - DRAFT：可作废。
   - DEPARTMENT_REJECTED：是否只展示不可编辑/不可提交提示，还是允许作废，需按后端契约确认。
   - PENDING_DEPARTMENT_REVIEW：不可在 Step 12D 前端执行审批。
   - PENDING_ARCHIVE：系统管理员可尝试归档，最终以后端权限为准。
   - ARCHIVED / VOIDED：只读。
   - 所有按钮只做前端可见性提示，最终以后端拒绝为准。
   - 动作需要确认弹窗，避免误操作。
   - 作废是否需要 comment / reason，读取 `VoidAchievementDto` 后确认。

7. API client 计划
   - 是否需要扩展 `api-client.ts` 支持 action POST 无 body / 有 body。
   - 是否复用 Step 12C 的 post 方法。
   - 是否需要额外错误文案。
   - 是否需要统一 action helper。

8. 组件拆分计划
   请判断是否新增：
   - `apps/web/src/AchievementDetail.tsx`
   - 或将详情先放在 `Achievements.tsx` 内
   - 是否抽出纯函数：
     - action availability
     - detail formatting
     - status action labels
     - action error mapping

9. 测试计划
   - action availability 纯函数测试。
   - detail formatting / type-specific rendering model 测试。
   - API client action POST 测试，如已有覆盖不足。
   - 错误映射测试。
   - 如果没有 React component testing 依赖，不新增依赖，用 typecheck/build/browser 验收补足，并记录风险。

10. 浏览器验收计划
   至少规划：
   - 无用户状态不能查看详情或执行动作。
   - 从列表打开详情入口。
   - 后端不可用时详情错误态。
   - DRAFT 状态动作入口展示。
   - submit / void / archive 的确认弹窗。
   - 动作后端失败时错误展示。
   - 动作成功后刷新列表或详情。
   - SECRET / CONFIDENTIAL 403 时权限提示。
   - 窄屏详情抽屉/动作区不重叠。
   - 如果后端未启动或数据库不可用，不运行 migrate/seed，不造数据；记录未覆盖范围。

11. 质量门禁命令
   计划中列出 Step 12D 执行后应运行：
   - `corepack pnpm --filter @research-ip/web test`
   - `corepack pnpm --filter @research-ip/web typecheck`
   - `corepack pnpm --filter @research-ip/web build`
   - `corepack pnpm lint`

   默认不改后端、不跑 API 门禁。若计划发现必须改后端，说明原因并等待用户确认。

12. memory-bank 更新计划
   Step 12D 执行完成后应更新：
   - `memory-bank/progress.md`
   - `memory-bank/evidence.md`
   - `memory-bank/implementation-plan.md`
   - `memory-bank/decisions.md`，仅当形成新关键决策时更新，编号使用当前文件下一个可用编号

   必须记录：
   - Step 12D DONE。
   - Step 12 overall DONE 或是否仍有遗留。
   - 改动文件范围。
   - 详情和动作能力边界。
   - 测试和浏览器验收结果。
   - 未覆盖风险。
   - 未进入 Step 13/14/15。

13. 明确禁止
   - 不执行实现。
   - 不修改任何文件。
   - 不运行测试、build、lint。
   - 不改后端业务语义。
   - 不改 Prisma schema。
   - 不新增 migration。
   - 不运行 migrate / seed。
   - 不读取 `.env` 内容。
   - 不新增依赖。
   - 不修改 package.json / lockfile。
   - 不接真实 SSO、邮件、对象存储、Meilisearch。
   - 不进入 Step 13/14/15。

最终输出格式：
1. 计划结论
2. Step 12D 目标与非目标
3. 后端契约确认
4. 详情展示计划
5. 动作入口计划
6. API client 与组件拆分计划
7. 测试、浏览器验收与质量门禁
8. memory-bank 更新计划
9. 风险与待确认点
10. 下一步：Step 12D 执行 Prompt 需要在用户确认后单独生成
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只执行 Step 12D：成果详情查看、动作入口与 Step 12 收尾归档。

必须严格按 Vibe Coding 方法论执行：
- 只执行 Step 12D。
- 不进入 Step 13/14/15。
- 不实现审批 approve / reject。
- 不实现附件上传下载。
- 不实现费用 CRUD。
- 不扩展搜索中心、统计看板、审计日志。
- 不改后端业务语义。
- 不改 Prisma schema / migration / seed。
- 完成 Step 12D 后运行门禁、做浏览器验收、更新 memory-bank、停下来汇报。
- 下一步只能进入 Step 13 计划确认，不能直接实现 Step 13。

当前权威状态：
- Step 12A DONE：后端已新增真实 `GET /achievements` 列表 API。
- Step 12B DONE：前端成果管理页已消费真实列表 API，支持列表、筛选、分页、刷新、空态、错误态和脱敏展示。
- Step 12C DONE：前端已有真实“登记成果 / 编辑草稿”抽屉表单，接入：
  - `POST /achievements`
  - `GET /achievements/:id`
  - `PATCH /achievements/:id`
- Step 12D 仍为 TODO。
- Step 12D 执行完成后，需要判断并归档 Step 12 overall 是否 DONE。

Step 12D 已确认目标：
- 从成果列表进入真实成果详情。
- 使用 `GET /achievements/:id` 展示基础字段、类型详情和 contributors。
- 提供动作入口：
  - DRAFT：提交审批 `POST /achievements/:id/submit`
  - DRAFT：作废 `POST /achievements/:id/void`，reason 必填
  - PENDING_ARCHIVE：归档 `POST /achievements/:id/archive`
- 动作前确认。
- 动作后刷新详情和列表。
- 覆盖 loading / error / forbidden / not found / backend unavailable 状态。
- Step 12D 完成后更新 memory-bank 并收尾 Step 12。

请先只读确认上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md` 顶部最新 Step 状态
3. `E:\研究院科研成果管理系统\memory-bank\progress.md` 顶部最新 Step 状态
4. `E:\研究院科研成果管理系统\memory-bank\evidence.md` 顶部最新证据
5. `E:\研究院科研成果管理系统\memory-bank\decisions.md` 顶部最新决策号
6. Step 12D 相关前端文件：
   - `apps/web/src/App.tsx`
   - `apps/web/src/Achievements.tsx`
   - `apps/web/src/AchievementForm.tsx`
   - `apps/web/src/Achievements.test.ts`
   - `apps/web/src/AchievementForm.test.ts`
   - `apps/web/src/api-client.ts`
   - `apps/web/src/api-client.test.ts`
   - `apps/web/src/types.ts`
   - `apps/web/src/components/StateBlocks.tsx`
   - `apps/web/src/App.css`
7. 后端契约只读参考：
   - `apps/api/src/achievements/achievement.controller.ts`
   - `apps/api/src/achievements/achievement.service.ts`
   - `apps/api/src/achievements/dto/achievement-action.dto.ts`
   - `apps/api/src/achievements/domain/achievement-domain.types.ts`
   - `apps/api/src/workflow/workflow.controller.ts`，只读确认 Step 12D 不进入 approve/reject

读取限制：
- 先索引，后精读。
- 不读取 `prompt历史记录.md`。
- 不全量读取 `prompt.md`。
- 不读取 `.env` 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 如果检索结果过长，改用更窄关键词。

实现范围：
- 新增 `apps/web/src/AchievementDetail.tsx`，或如确认更合适，可在 `Achievements.tsx` 中实现但要避免文件过度膨胀。
- `Achievements.tsx` 负责列表、筛选、选中详情 ID、打开/关闭详情抽屉、刷新列表。
- `AchievementDetail.tsx` 负责详情加载、详情展示、动作入口、动作确认、错误展示。
- 复用 Step 12C 已有 `api-client.post<T>(path, body?)`。
- submit/archive 使用 POST 无 body。
- void 使用 POST body `{ reason }`。
- 详情展示字段必须以 `GET /achievements/:id` 实际返回为准，不伪造后端未返回的字段。

详情 UI：
- 使用 Drawer 抽屉。
- 展示基础字段：
  - title
  - type
  - status
  - secretLevel
  - departmentId
  - ownerUserId
  - createdAt / updatedAt / submittedAt / archivedAt / voidedAt 等实际返回字段
- 展示 PAPER / PATENT / SOFTWARE_COPYRIGHT 类型详情，字段以实际返回 DTO 为准。
- 展示 contributors，按 sortOrder。
- workflow / attachment / fee 只显示边界提示，不接新 API、不伪造数据。
- SECRET / CONFIDENTIAL 无授权时展示 403 权限不足，不泄露标题或详情。
- 列表 title 为 null / redacted 时，Drawer 标题使用“成果详情”或“已脱敏成果”；详情请求失败时不补造标题。

动作入口：
- DRAFT：显示“提交审批”和“作废”。
- 作废必须弹出确认，并要求填写 reason；空 reason 前端拦截，后端仍最终校验。
- DEPARTMENT_REJECTED：不显示 submit/void/archive；提示当前后端契约不支持该状态动作。
- PENDING_DEPARTMENT_REVIEW：只读，不提供审批按钮。
- PENDING_ARCHIVE：显示“归档”；最终以后端权限为准。
- ARCHIVED / VOIDED：只读。
- 所有动作按钮只是前端可见性提示，最终以后端拒绝为准。
- 动作成功后关闭确认弹窗，刷新详情，再刷新列表。
- 动作失败后保留详情抽屉，展示后端错误映射。

可新增纯函数并测试：
- `getAvailableAchievementActions(status)`
- `getActionConfirmConfig(action)`
- `buildVoidActionPayload(reason)`
- `getDetailDisplayTitle(detailOrListItem)`
- detail formatting / type-specific display model
- action error mapping，如需要

预计可改文件：
- `apps/web/src/Achievements.tsx`
- `apps/web/src/AchievementDetail.tsx`
- `apps/web/src/Achievements.test.ts`
- `apps/web/src/api-client.ts`，仅当现有 post 支持不足时修改
- `apps/web/src/api-client.test.ts`，仅当 api-client 修改或需要补 action POST 测试时修改
- `apps/web/src/types.ts`
- `apps/web/src/App.css`
- `memory-bank/implementation-plan.md`
- `memory-bank/progress.md`
- `memory-bank/evidence.md`
- `memory-bank/decisions.md`，仅当形成新关键决策时更新，编号使用当前文件下一个可用编号

原则上不改：
- 后端业务文件
- Prisma schema / migration / seed
- package.json / lockfile
- `.env`

测试要求：
- action availability 覆盖：
  - DRAFT
  - DEPARTMENT_REJECTED
  - PENDING_DEPARTMENT_REVIEW
  - PENDING_ARCHIVE
  - ARCHIVED
  - VOIDED
- detail formatting 覆盖：
  - PAPER
  - PATENT
  - SOFTWARE_COPYRIGHT
- title/redaction：title null + redacted 时不泄露。
- API action POST：
  - submit/archive 无 body
  - void 有 reason body
- 错误映射：
  - 403
  - 404
  - 409
  - 422
  - network
- 不新增 React Testing Library 或其他依赖；组件交互用 typecheck/build/browser 验收补足并记录风险。

质量门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

默认不跑 API 门禁；除非实现中不得不改后端，必须先停下来说明原因并等待用户确认。

浏览器验收：
- 启动前端 dev server。
- 无用户状态不能查看详情或执行动作。
- 从列表打开详情。
- 后端不可用时详情错误态。
- DRAFT 动作入口和确认弹窗。
- void reason 必填。
- archive 确认弹窗。
- 动作失败错误展示。
- 动作成功后刷新列表/详情。
- SECRET / CONFIDENTIAL 403 权限提示。
- 390px 窄屏详情抽屉和动作区不重叠。
- 如果后端未启动或数据库不可用，不运行 migrate/seed，不造数据；记录未覆盖范围。

禁止：
- 不改后端业务语义。
- 不改 Prisma schema。
- 不新增 migration。
- 不运行 migrate / seed。
- 不读取 `.env` 内容。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不接真实 SSO、邮件、对象存储、Meilisearch。
- 不实现 approve / reject。
- 不实现附件上传下载。
- 不实现费用 CRUD。
- 不扩展搜索中心、统计看板、审计日志。
- 不进入 Step 13/14/15。

memory-bank 收尾：
- `progress.md`：记录 Step 12D DONE，并明确 Step 12 overall DONE 或遗留项。
- `evidence.md`：记录改动文件、测试命令、结果、浏览器验收、未覆盖范围、边界。
- `implementation-plan.md`：顶部追加 Step 12D closure / Step 12 final closure。
- `decisions.md`：如形成新关键决策，新增一条决策，编号使用当前文件下一个可用编号；建议记录“Step 12D 前端详情与动作入口复用现有 Achievement API，不扩展后端状态机或审批边界”。

最终汇报：
1. 完成了什么。
2. 修改了哪些文件。
3. 跑了哪些门禁，结果如何。
4. 浏览器验收结果。
5. 详情与动作能力边界。
6. memory-bank 更新摘要。
7. Step 12 overall 是否 DONE。
8. 剩余风险。
9. 下一步只能做 Step 13 计划确认，不能直接实现 Step 13。
~~~

# 13、Step 13

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本次只做 Step 13 计划确认，不执行实现、不修改代码、不运行测试/build/lint、不运行数据库 migrate/seed。

当前权威状态：
- Step 11 overall DONE。
- Step 12 overall DONE。
- Step 12A DONE：后端新增真实 `GET /achievements` 列表 API。
- Step 12B DONE：前端成果管理真实列表页完成。
- Step 12C DONE：前端登记成果 / 编辑草稿抽屉表单完成。
- Step 12D DONE：前端成果详情抽屉与 submit / void / archive 动作入口完成。
- Step 12 final audit closure 已完成，确认 Step 12 overall DONE 可接受。
- Step 13 仍为 TODO / not started。
- 本次只能确认 Step 13 计划，不能直接实现 Step 13。

Step 13 候选方向：
围绕“审批管理”推进下一步能力。当前后端已有 Workflow 相关能力：
- `GET /workflow/tasks/my`
- `GET /workflow/tasks/:taskId`
- `POST /workflow/tasks/:taskId/approve`
- `POST /workflow/tasks/:taskId/reject`

请按以下要求只做计划确认：

1. 读取规则与上下文
   - 读取 `E:\Vibe coding\AGENTS.md`
   - 读取 `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
   - 读取 `E:\Vibe coding\vibe-methodology\01-task-classification.md`
   - 读取 `E:\Vibe coding\vibe-methodology\05-ui-design-system.md`
   - 读取 `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
   - 只读取 memory-bank 顶部与 Step 12 final audit closure、Step 13 边界直接相关内容：
     - `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md`
     - `E:\研究院科研成果管理系统\memory-bank\progress.md`
     - `E:\研究院科研成果管理系统\memory-bank\evidence.md`
     - `E:\研究院科研成果管理系统\memory-bank\decisions.md`

2. 只读确认 Step 13 相关代码
   前端：
   - `apps/web/src/App.tsx`
   - `apps/web/src/Workbench.tsx`
   - `apps/web/src/Achievements.tsx`
   - `apps/web/src/AchievementDetail.tsx`
   - `apps/web/src/api-client.ts`
   - `apps/web/src/types.ts`
   - `apps/web/src/components/StateBlocks.tsx`
   - `apps/web/src/App.css`

   后端契约：
   - `apps/api/src/workflow/workflow.controller.ts`
   - `apps/api/src/workflow/workflow.service.ts`
   - `apps/api/src/workflow/dto/workflow-task-query.dto.ts`
   - `apps/api/src/workflow/dto/workflow-action.dto.ts`
   - `apps/api/src/workflow/domain/workflow-domain.types.ts`
   - `apps/api/src/workflow/domain/workflow-state-machine.ts`
   - `apps/api/src/achievements/achievement.controller.ts`，只读确认审批与成果详情边界

3. 上下文读取限制
   - 先索引，后精读。
   - 只读取 Step 13 直接相关内容。
   - 不读取 `E:\研究院科研成果管理系统\prompt历史记录.md`。
   - 不全量读取 `prompt.md`。
   - 不读取 `.env` 内容。
   - 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
   - 如果检索结果超过 80 行，停止并改用更窄关键词。

4. 输出 Step 13 计划
   请只输出计划，不写代码。计划必须包含：
   - Step 13 任务等级判断和理由。
   - Step 13 目标。
   - Step 13 非目标。
   - 明确本步是否只做前端审批管理页面，是否不改后端业务语义。
   - 明确是否包含：
     - 审批管理页面替换 Step 11 边界页。
     - 我的待办列表。
     - 待办详情。
     - approve / reject 动作入口。
     - 审批意见输入。
     - 动作成功后刷新待办。
   - 明确不包含：
     - 自定义审批流设计器。
     - 批量审批。
     - 审批历史完整页面。
     - 审计日志页面。
     - 后端 workflow 状态机修改。
     - Prisma schema / migration / seed。
     - Step 14/15 能力。

5. 页面与数据流计划
   请规划：
   - 审批管理页面信息架构。
   - 与 Workbench “我的审批待办”卡片的关系。
   - `GET /workflow/tasks/my` 如何分页/筛选或按现有契约消费。
   - `GET /workflow/tasks/:taskId` 如何展示待办详情。
   - approve / reject 如何调用。
   - 审批意见 comment / reason 字段如何处理。
   - 成果详情是否只显示 workflow task 返回的 target 信息，还是跳转/打开 Step 12D 成果详情；不得越权读详情。

6. 状态与权限计划
   至少覆盖：
   - 未选择 demo user。
   - loading。
   - empty。
   - 400。
   - 401。
   - 403。
   - 404。
   - 409 状态冲突。
   - 422 业务规则错误。
   - network / 5xx。
   - approve / reject 成功。
   - approve / reject 失败。
   - 刷新后 demo user 恢复。

7. 组件拆分计划
   请判断是否新增：
   - `apps/web/src/WorkflowTasks.tsx`
   - 或其他更合适的审批页面组件
   - 是否抽出纯函数：
     - task status label
     - action availability
     - action payload builder
     - task detail display model
     - error display mapping

8. 测试计划
   - API client 是否已有 POST 能力可复用。
   - workflow task query / action payload 纯函数测试。
   - action availability 测试。
   - 错误映射测试。
   - 如果没有 React component testing 依赖，不新增依赖，用 typecheck/build/browser 验收补足，并记录风险。

9. 浏览器验收计划
   至少规划：
   - 无用户状态不发业务请求。
   - 科研秘书上下文查看待办入口。
   - 任务列表加载、空、错误态。
   - 打开任务详情。
   - approve 确认与成功/失败反馈。
   - reject 意见输入与成功/失败反馈。
   - 403/404/409/422 展示。
   - 窄屏布局不重叠。
   - 如果后端未启动或数据库不可用，不运行 migrate/seed，不造数据；记录未覆盖范围。

10. 质量门禁命令
   计划中列出 Step 13 执行后应运行：
   - `corepack pnpm --filter @research-ip/web test`
   - `corepack pnpm --filter @research-ip/web typecheck`
   - `corepack pnpm --filter @research-ip/web build`
   - `corepack pnpm lint`

   默认不改后端、不跑 API 门禁。若计划发现必须改后端，说明原因并等待用户确认。

11. memory-bank 更新计划
   Step 13 执行完成后应更新：
   - `memory-bank/progress.md`
   - `memory-bank/evidence.md`
   - `memory-bank/implementation-plan.md`
   - `memory-bank/decisions.md`，仅当形成新关键决策时更新，编号使用当前文件下一个可用编号

   必须记录：
   - Step 13 DONE 或子步骤状态。
   - 改动文件范围。
   - 审批页面和动作能力边界。
   - 测试和浏览器验收结果。
   - 未覆盖风险。
   - 未进入 Step 14/15。

12. 明确禁止
   - 不执行实现。
   - 不修改任何文件。
   - 不运行测试、build、lint。
   - 不改后端业务语义。
   - 不改 Prisma schema。
   - 不新增 migration。
   - 不运行 migrate / seed。
   - 不读取 `.env` 内容。
   - 不新增依赖。
   - 不修改 package.json / lockfile。
   - 不接真实 SSO、邮件、对象存储、Meilisearch。
   - 不进入 Step 14/15。

最终输出格式：
1. 计划结论
2. Step 13 目标与非目标
3. 后端 Workflow 契约确认
4. 页面信息架构与数据流计划
5. 动作入口与状态/权限计划
6. 组件拆分计划
7. 测试、浏览器验收与质量门禁
8. memory-bank 更新计划
9. 风险与待确认点
10. 下一步：Step 13 执行 Prompt 需要在用户确认后单独生成
~~~

## Step 13A

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本 Prompt 由 Prompt 对话生成。当前 Step 13 对话只负责执行本 Prompt 的要求，不负责生成后续 Prompt。

本轮只做 Step 13A 计划确认：
Workflow 前端契约与基础能力准备。

不要执行实现。
不要修改代码。
不要更新 memory-bank。
不要运行 test/build/lint。
不要运行 migrate/seed。
不要读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
不要全量读取 prompt.md。
不要新增依赖。
不要修改 package.json / lockfile。
不要进入 Step 13B/13C/13D。
不要生成 Step 13A 执行 Prompt 或任何后续 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13A 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

请先只读必要上下文，建议范围：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 顶部最新 Step 12 / Step 13 状态
6. E:\研究院科研成果管理系统\memory-bank\progress.md 顶部最新状态
7. E:\研究院科研成果管理系统\memory-bank\evidence.md 顶部最新证据
8. E:\研究院科研成果管理系统\memory-bank\decisions.md 顶部最新决策
9. Step 13A 相关代码契约的最小范围：
   - apps/web/src/api-client.ts
   - apps/web/src/types.ts
   - apps/web/src/api-client.test.ts
   - 后端 workflow controller / DTO / service 中与以下 API 直接相关的最小片段：
     - GET /workflow/tasks/my
     - GET /workflow/tasks/:taskId
     - POST /workflow/tasks/:taskId/approve
     - POST /workflow/tasks/:taskId/reject

Step 13A 计划确认范围：

目标：
- 确认 Step 13A 是否只做 Workflow 前端契约与基础能力。
- 规划 workflow task 前端类型补齐。
- 规划 API client workflow 方法。
- 规划 query builder。
- 规划 approve/reject payload builder。
- 规划 action availability 判断。
- 规划 workflow error mapping。
- 规划相关纯函数测试。

非目标：
- 不替换审批管理页面。
- 不实现待办列表 UI。
- 不实现详情抽屉。
- 不实现 approve/reject 弹窗。
- 不做浏览器主流程验收。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema/migration/seed。
- 不新增依赖。
- 不进入 Step 13B/13C/13D。

请输出 Step 13A 计划确认，必须包括：
1. 任务等级判断
2. Step 13A 目标
3. Step 13A 非目标
4. 已确认的后端 Workflow API 契约
5. 前端类型设计边界
6. API client 方法设计边界
7. 纯函数设计清单
8. 错误映射设计
9. 测试计划
10. 质量门禁计划
11. memory-bank 更新计划
12. 风险与待确认点
13. Step 13A 与 Step 13B 的边界

最后明确输出：
- 本轮只完成 Step 13A 计划确认。
- 未实现、未修改文件、未运行测试/build/lint、未运行 migrate/seed。
- Step 13A 执行 Prompt 应由 Prompt 对话在用户确认后单独生成。
- 当前 Step 13 对话不要生成后续 Prompt，只等待 Prompt 对话提供下一条 Prompt。
~~~



~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

本轮只执行 Step 13A：
Workflow 前端契约与基础能力准备。

只允许实现 Step 13A 已确认范围，不进入 Step 13B/13C/13D。

禁止事项：
- 不替换审批管理页面。
- 不实现待办列表 UI。
- 不实现详情抽屉。
- 不实现 approve/reject 弹窗。
- 不做浏览器主流程验收。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成后续 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13A 直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

开始前只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. memory-bank 顶部最新 Step 状态：
   - E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
   - E:\研究院科研成果管理系统\memory-bank\progress.md
   - E:\研究院科研成果管理系统\memory-bank\evidence.md
   - E:\研究院科研成果管理系统\memory-bank\decisions.md
6. Step 13A 直接相关代码：
   - apps/web/src/api-client.ts
   - apps/web/src/api-client.test.ts
   - apps/web/src/types.ts
   - 后端 workflow controller / DTO / service 中与以下 API 直接相关的最小片段：
     - GET /workflow/tasks/my
     - GET /workflow/tasks/:taskId
     - POST /workflow/tasks/:taskId/approve
     - POST /workflow/tasks/:taskId/reject

实现目标：
1. 补齐或收窄前端 Workflow 类型：
   - WorkflowTaskStatusCode
   - WorkflowInstanceStatusCode
   - WorkflowTargetTypeCode
   - WorkflowStepCode
   - WorkflowActionKind
   - WorkflowTaskQuery
   - ApproveWorkflowTaskPayload
   - RejectWorkflowTaskPayload
   - WorkflowTaskActionResult
   - WorkflowTaskListResult 需兼容后端 { items }，不能强依赖 total

2. 新增 workflow 前端基础 helper / API wrapper。
   可按项目现有风格选择合适位置；建议避免提前创建复杂目录。
   需要包含：
   - fetchMyWorkflowTasks(client, query)
   - fetchWorkflowTaskDetail(client, taskId)
   - approveWorkflowTask(client, taskId, comment)
   - rejectWorkflowTask(client, taskId, comment)

3. 实现纯函数：
   - buildWorkflowTaskQuery(input)
   - buildApproveWorkflowTaskPayload(comment)
   - buildRejectWorkflowTaskPayload(comment)
   - getWorkflowTaskStatusLabel(status)
   - getWorkflowStepLabel(stepCode)
   - getWorkflowInstanceStatusLabel(status)
   - getWorkflowTargetTypeLabel(targetType)
   - getWorkflowActionAvailability(task)
   - buildWorkflowTaskDetailDisplayModel(task)
   - mapWorkflowErrorToDisplay(error)

行为要求：
- buildWorkflowTaskQuery 只输出 status / achievementId。
- achievementId 需要 trim，空字符串省略。
- 不输出 page/pageSize。
- approve comment 可选，trim 后为空则不发送 comment 或返回空 payload，但策略必须统一。
- reject comment 必填，trim 后为空必须能被识别为无效，不得发送 reason 字段。
- approve/reject payload 字段只能是 comment。
- action availability 只作为前端体验保护，最终权限和状态以后端为准。
- 仅当 task.status=PENDING、stepCode=DEPARTMENT_REVIEW、instance.status=ACTIVE、instance.currentStep=DEPARTMENT_REVIEW、instance.targetType=ACHIEVEMENT 时允许 approve/reject。
- detail display model 只展示 task / instance 返回字段，不补造成果详情、审批历史或审计信息。
- workflow 层 error mapping 不改变 api-client.ts 的底层通用错误语义。

测试要求：
新增或扩展 Vitest 测试，不新增测试依赖，覆盖：
- query builder：
  - status 保留
  - achievementId trim
  - 空 achievementId 省略
  - 不输出 page/pageSize
- approve payload：
  - 空 comment 省略或空 payload
  - 非空 comment trim
- reject payload：
  - 空 comment 无效
  - 非空 comment 输出 { comment }
  - 不得使用 reason
- action availability：
  - pending department review achievement task 可操作
  - approved/rejected/cancelled 不可操作
  - 非 DEPARTMENT_REVIEW 不可操作
  - instance inactive / missing / targetType 非 achievement 不可操作
- label mapping：
  - 已知 status / step / instance status / target type 正常展示
  - 未知值有保底展示
- error mapping：
  - 400 / 401 / 403 / 404 / 409 / 422 / network / 5xx
- API wrapper：
  - GET /workflow/tasks/my 路径和 query 正确
  - GET /workflow/tasks/:taskId 路径正确
  - approve POST 路径和 comment body 正确
  - reject POST 路径和 comment body 正确
  - reject 不发送 reason

质量门禁：
执行完成后运行：
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web typecheck

如本轮实际改动影响 lint 或共享前端导出，也运行：
- corepack pnpm lint

不运行后端测试。
不运行 migrate/seed。
不做浏览器主流程验收；原因是 Step 13A 不挂页面。

memory-bank 更新：
执行完成后更新：
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md 仅当形成新关键决策时更新，使用下一个可用编号

memory-bank 必须记录：
- Step 13A 状态：DONE 或未完成原因
- 改动文件范围
- 已完成的类型、API wrapper、query/payload builder、action availability、label/display/error helper、测试
- 明确未挂页面
- 明确未替换审批管理边界页
- 明确未实现列表 UI、详情抽屉、approve/reject 弹窗
- 测试和类型检查结果
- 未运行浏览器主流程验收的原因
- 未进入 Step 13B/13C/13D
- 未改后端业务语义、workflow 状态机、Prisma schema/migration/seed、package/lockfile
- 未运行 migrate/seed，未读取 .env
- 项目不是 Git 仓库，不能依赖 git status/git diff 证据

如果执行中发现必须修改后端、schema、migration、seed、依赖、package/lockfile，立即暂停并说明原因，不要继续。

完成后只输出 Step 13A 执行结果审计所需信息，等待下一条 Prompt。
~~~

## Step 13B

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

前提：Step 13A 已完成、审计 PASS，并可接受为 DONE。
本轮只做 Step 13B 计划确认，不执行实现、不修改代码、不运行 test/build/lint、不运行 migrate/seed。

Step 13B 定位：
审批管理“我的待办列表”页面。

不要进入 Step 13C/13D。
不要实现待办详情抽屉。
不要实现 approve/reject 动作。
不要实现审批意见输入。
不要读取成果详情。
不要修改后端业务语义。
不要修改 workflow 状态机。
不要修改 Prisma schema / migration / seed。
不要运行 migrate / seed。
不要新增依赖。
不要修改 package.json / lockfile。
不要读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
不要全量读取 prompt.md。
不要生成 Step 13B 执行 Prompt 或任何后续 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13B 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

请先只读必要上下文，建议范围：
1. memory-bank/implementation-plan.md 顶部最新 Step 13A 状态
2. memory-bank/progress.md 顶部最新 Step 13A 状态
3. memory-bank/evidence.md 顶部最新 Step 13A 证据
4. memory-bank/decisions.md 顶部最新决策
5. apps/web/src/App.tsx
6. apps/web/src/Workbench.tsx
7. apps/web/src/types.ts
8. apps/web/src/api-client.ts
9. apps/web/src/workflow-tasks.ts
10. apps/web/src/workflow-tasks.test.ts
11. apps/web/src/App.css 中与页面布局、边界页、Workbench、成果管理页样式相关的最小片段

Step 13B 计划确认范围：

目标：
- 将 App.tsx 中“审批管理”边界页替换为真实 WorkflowTasks 页面。
- 新增或接入 apps/web/src/WorkflowTasks.tsx。
- 实现“我的待办列表”页面。
- 只消费 GET /workflow/tasks/my。
- 默认 status=PENDING。
- 支持 status 筛选。
- 支持 achievementId 精确筛选。
- 不发送 page/pageSize。
- 复用 Step 13A 的 workflow 类型、query builder、label/error helpers、API wrapper。
- 覆盖 no-user、loading、empty、error、refresh 状态。
- 更新 Workbench “我的审批待办”卡片入口或文案，让它指向审批管理页。
- 保持 demo user localStorage 恢复机制。

非目标：
- 不实现 GET /workflow/tasks/:taskId 详情抽屉。
- 不实现 approve/reject 弹窗或动作。
- 不实现审批意见输入。
- 不读取成果详情。
- 不做审批历史页。
- 不做审计日志页。
- 不做批量审批。
- 不做自定义审批流设计器。
- 不改后端。
- 不进入 Step 13C/13D。

请输出 Step 13B 计划确认，必须包括：
1. 任务等级判断
2. Step 13B 目标
3. Step 13B 非目标
4. 页面信息架构
5. 数据流与 API 契约
6. 状态与权限设计
7. 与 Step 13A helper/API wrapper 的复用方式
8. 与 Workbench “我的审批待办”卡片的关系
9. 文件与组件范围
10. 测试计划
11. 浏览器验收计划
12. 质量门禁计划
13. memory-bank 更新计划
14. 风险与待确认点
15. Step 13B 与 Step 13C 的边界

最后明确输出：
- 本轮只完成 Step 13B 计划确认。
- 未实现、未修改文件、未运行测试/build/lint、未运行 migrate/seed。
- Step 13B 执行 Prompt 应在用户确认后单独生成。
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

前提：
- Step 13A 已完成、审计 PASS，并可接受为 DONE。
- Step 13B 计划确认已完成。

本轮只执行 Step 13B：
审批管理“我的待办列表”页面。

只允许实现 Step 13B 已确认范围，不进入 Step 13C/13D。

禁止事项：
- 不实现 GET /workflow/tasks/:taskId 详情抽屉。
- 不实现 approve/reject 动作、弹窗或审批意见输入。
- 不读取成果详情。
- 不做审批历史页、审计日志页、批量审批、自定义审批流设计器。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成后续 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13B 直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

开始前只读必要上下文：
1. memory-bank 顶部最新 Step 13A / Step 13B 状态：
   - memory-bank/implementation-plan.md
   - memory-bank/progress.md
   - memory-bank/evidence.md
   - memory-bank/decisions.md
2. Step 13B 直接相关代码：
   - apps/web/src/App.tsx
   - apps/web/src/Workbench.tsx
   - apps/web/src/types.ts
   - apps/web/src/api-client.ts
   - apps/web/src/workflow-tasks.ts
   - apps/web/src/workflow-tasks.test.ts
   - apps/web/src/App.css 中与页面布局、边界页、Workbench、成果管理页样式相关的最小片段

实现目标：
1. 新增真实审批管理列表页：
   - 建议新增 apps/web/src/WorkflowTasks.tsx
   - 页面标题为“审批管理”
   - 展示当前演示用户的审批待办
   - 明确权限和状态以后端为准

2. 替换 App.tsx 中审批管理边界页：
   - activeKey === "workflow" 时渲染 WorkflowTasks
   - 更新审批管理 nav / 页面描述，不能再描述为未实现边界页

3. 只消费 GET /workflow/tasks/my：
   - 使用 Step 13A 的 fetchMyWorkflowTasks
   - 默认 query 为 status=PENDING
   - 支持 status 筛选
   - 支持 achievementId 精确筛选
   - achievementId trim，空值省略
   - 不发送 page/pageSize
   - 使用后端 { items } 兼容结果，不强依赖 total

4. 列表展示字段：
   - task id
   - stepCode label
   - task status label
   - createdAt
   - updatedAt
   - instance targetType label
   - instance targetId
   - instance status label
   - instance currentStep label
   - instance id
   - instance 缺失时有保底展示

5. 状态覆盖：
   - no-user：未选择 demo user 时不发业务请求
   - loading：首次加载、查询、刷新时展示加载态
   - empty：无待办时展示空状态
   - error：展示 mapWorkflowErrorToDisplay 结果
   - refresh：保留当前筛选条件刷新
   - 400：请求参数错误
   - 401：请选择或切换演示用户
   - 403：当前角色无权查看审批待办
   - network / 5xx：服务不可用，可重试

6. Workbench 更新：
   - 保留“我的审批待办”摘要卡片
   - 增加或更新“进入审批管理”入口，导航 key 使用 workflow
   - 可将 Workbench 待办加载逻辑复用 fetchMyWorkflowTasks，避免重复 query 逻辑
   - Workbench 不承载筛选、详情或审批动作

7. Step 13B 边界：
   - 列表页不出现可执行“通过”“驳回”动作
   - 不打开详情抽屉
   - 如需要占位，可用禁用提示说明“详情与处理留到 Step 13C”，但不得实现真实详情或动作

测试要求：
不新增测试依赖。新增或扩展 Vitest 测试，优先覆盖纯函数/页面辅助逻辑：
- 默认 status 为 PENDING
- status 筛选进入 query
- achievementId trim
- 空 achievementId 省略
- 不含 page/pageSize
- 列表 display model 复用 task/instance label
- 缺失 instance 有保底显示
- Workbench 入口导航 key 使用 workflow
- 不测试详情/approve/reject

质量门禁：
执行完成后运行：
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web typecheck
- corepack pnpm --filter @research-ip/web build
- corepack pnpm lint

不运行后端测试。
不运行 migrate/seed。

浏览器验收：
如已有前端 dev server 可用，进行浏览器验收：
- 未选择 demo user：审批管理页不发业务请求
- 刷新后 demo user 恢复
- 科研秘书上下文可进入审批管理页
- 后端不可用时展示服务不可用，不出现假数据
- loading / empty / error / refresh 状态
- status 筛选
- achievementId 精确筛选
- Workbench “我的审批待办”入口跳转到审批管理页
- 390px 窄屏布局不重叠、不横向溢出

如果后端未启动或数据库不可用：
- 不运行 migrate/seed
- 不造数据
- 只记录未覆盖真实 success/empty/error 状态的原因

memory-bank 更新：
执行完成后更新：
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md 仅当形成新关键决策时更新

memory-bank 必须记录：
- Step 13B DONE 或未完成原因
- 改动文件范围
- 审批管理边界页已替换为真实待办列表页
- 只消费 GET /workflow/tasks/my
- 默认 PENDING
- 支持 status / achievementId 筛选
- 不发送 page/pageSize
- Workbench 入口变化
- 测试、typecheck、build、lint 结果
- 浏览器验收结果或无法覆盖原因
- 未实现详情抽屉、approve/reject、审批意见、成果详情读取
- 未进入 Step 13C/13D
- 未改后端、Prisma、migration/seed、package/lockfile
- 未运行 migrate/seed，未读取 .env
- 项目不是 Git 仓库，不能依赖 git status/git diff 证据

如果执行中发现必须修改后端、schema、migration、seed、依赖、package/lockfile，立即暂停并说明原因，不要继续。

完成后只输出 Step 13B 执行结果所需信息，等待下一条 Prompt。
~~~

## Step 13C

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

前提：
- Step 13A 已完成并审计 PASS。
- Step 13B 已完成，审批管理“我的待办列表”页面为 DONE。

本轮只做 Step 13C 计划确认，不执行实现、不修改代码、不运行 test/build/lint、不运行 migrate/seed。

Step 13C 定位：
待办详情抽屉与 approve/reject 动作。

不要进入 Step 13D。
不要做审批历史完整页。
不要做审计日志页。
不要做批量审批。
不要做自定义审批流设计器。
默认不接入“打开成果详情”跨模块入口；如确有必要需单独确认。
不要修改后端业务语义。
不要修改 workflow 状态机。
不要修改 Prisma schema / migration / seed。
不要运行 migrate / seed。
不要新增依赖。
不要修改 package.json / lockfile。
不要读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
不要全量读取 prompt.md。
不要生成 Step 13C 执行 Prompt 或任何后续 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13C 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

请先只读必要上下文，建议范围：
1. memory-bank/implementation-plan.md 顶部最新 Step 13B 状态
2. memory-bank/progress.md 顶部最新 Step 13B 状态
3. memory-bank/evidence.md 顶部最新 Step 13B 证据
4. memory-bank/decisions.md 顶部最新决策
5. apps/web/src/WorkflowTasks.tsx
6. apps/web/src/workflow-tasks.ts
7. apps/web/src/types.ts
8. apps/web/src/api-client.ts
9. apps/web/src/WorkflowTasks.test.ts
10. apps/web/src/App.css 中与 WorkflowTasks 页面、drawer/modal、窄屏布局相关的最小片段
11. 后端 workflow controller / DTO / service 中与以下 API 直接相关的最小片段：
   - GET /workflow/tasks/:taskId
   - POST /workflow/tasks/:taskId/approve
   - POST /workflow/tasks/:taskId/reject

Step 13C 计划确认范围：

目标：
- 在 Step 13B 的审批管理列表页上增加待办详情抽屉。
- 点击列表任务后调用 GET /workflow/tasks/:taskId。
- 展示 task 与 workflow instance 稳定字段。
- 实现详情 loading/error/403/404 状态。
- 仅当 task status === PENDING 且 stepCode === DEPARTMENT_REVIEW 且 Step 13A action availability 判断允许时展示 approve/reject。
- 实现 approve 确认弹窗，comment 可选。
- 实现 reject 确认弹窗，comment 必填。
- approve/reject payload 只发送 comment，不发送 reason。
- 动作成功后显示成功反馈，关闭动作弹窗，刷新列表，并刷新或关闭当前详情。
- 动作失败时保留弹窗和输入，展示错误，允许重试。
- 复用 Step 13A 的 detail/action wrappers、payload builder、action availability、error mapping。
- 保持 Step 13B 的列表、筛选、no-user/loading/empty/error/refresh 能力不退化。

非目标：
- 不做审批历史完整页。
- 不做审计日志页。
- 不做批量审批。
- 不做自定义审批流设计器。
- 不读取或展示成果详情完整字段。
- 默认不实现“打开成果详情”跨模块入口。
- 不改后端。
- 不进入 Step 13D。

请输出 Step 13C 计划确认，必须包括：
1. 任务等级判断
2. Step 13C 目标
3. Step 13C 非目标
4. 详情抽屉信息架构
5. GET /workflow/tasks/:taskId 数据流与 API 契约
6. approve/reject 交互设计
7. approve/reject payload 设计
8. action availability 与权限边界
9. 错误状态设计：400/401/403/404/409/422/network/5xx
10. 成功后刷新策略
11. 文件与组件范围
12. 与 Step 13A helper/API wrapper 的复用方式
13. 与 Step 13B 列表页的集成方式
14. 测试计划
15. 浏览器验收计划
16. 质量门禁计划
17. memory-bank 更新计划
18. 风险与待确认点
19. Step 13C 与 Step 13D 的边界

最后明确输出：
- 本轮只完成 Step 13C 计划确认。
- 未实现、未修改文件、未运行测试/build/lint、未运行 migrate/seed。
- Step 13C 执行 Prompt 应在用户确认后单独生成。
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

前提：
- Step 13A 已完成并审计 PASS。
- Step 13B 已完成，审批管理“我的待办列表”页面为 DONE。
- Step 13C 计划确认已完成。

本轮只执行 Step 13C：
待办详情抽屉与 approve/reject 动作。

只允许实现 Step 13C 已确认范围，不进入 Step 13D。

禁止事项：
- 不做审批历史完整页。
- 不做审计日志页。
- 不做批量审批。
- 不做自定义审批流设计器。
- 不读取或展示成果详情完整字段。
- 默认不实现“打开成果详情”跨模块入口。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成后续 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13C 直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

开始前只读必要上下文：
1. memory-bank 顶部最新 Step 13B / Step 13C 状态：
   - memory-bank/implementation-plan.md
   - memory-bank/progress.md
   - memory-bank/evidence.md
   - memory-bank/decisions.md
2. Step 13C 直接相关代码：
   - apps/web/src/WorkflowTasks.tsx
   - apps/web/src/WorkflowTasks.test.ts
   - apps/web/src/workflow-tasks.ts
   - apps/web/src/types.ts
   - apps/web/src/api-client.ts
   - apps/web/src/App.css 中与 WorkflowTasks、drawer/modal、窄屏布局相关的最小片段
3. 后端 workflow controller / DTO / service 中与以下 API 直接相关的最小片段：
   - GET /workflow/tasks/:taskId
   - POST /workflow/tasks/:taskId/approve
   - POST /workflow/tasks/:taskId/reject

实现目标：
1. 在 Step 13B 的 WorkflowTasks 列表页增加待办详情抽屉：
   - 点击列表任务后调用 fetchWorkflowTaskDetail(client, taskId)
   - 展示 task 与 workflow instance 稳定字段
   - 展示 task id、instanceId、assigneeId、stepCode、status、createdAt、updatedAt、claimedAt、completedAt
   - 展示 instance targetType、targetId、status、currentStep、instance id
   - 不展示成果详情、审批历史、审计日志或跨模块详情入口

2. 实现详情状态：
   - detail loading
   - detail error
   - 403
   - 404
   - network / 5xx
   - 未选择 demo user 时不发 detail 请求

3. 实现 approve/reject 动作入口：
   - 仅当 getWorkflowActionAvailability(task) 允许时展示 approve/reject
   - 不可操作时显示只读提示或不可处理原因
   - 前端 availability 只做体验保护，最终权限和状态以后端为准

4. approve 交互：
   - 详情抽屉内点击“通过”打开确认弹窗
   - comment 可选
   - 空 comment 按 Step 13A 策略不发送 comment 或发送空 payload
   - 只发送 comment 字段，不发送 reason
   - 提交中按钮 loading，避免重复点击

5. reject 交互：
   - 详情抽屉内点击“驳回”打开确认弹窗
   - comment 必填
   - trim 后为空时前端阻止提交并展示校验错误
   - 非空时发送 { comment }
   - 不发送 reason
   - 提交中按钮 loading，避免重复点击

6. 成功与失败处理：
   - 动作成功后显示成功反馈
   - 关闭动作弹窗
   - 清理动作错误状态
   - 刷新当前筛选条件下的列表
   - 建议关闭当前详情抽屉，避免展示已处理任务的旧详情
   - 动作失败时不关闭弹窗，不清空 comment，展示错误并允许重试

7. 保持 Step 13B 不退化：
   - 列表页仍只通过 GET /workflow/tasks/my 加载
   - status / achievementId 筛选继续有效
   - refresh 保留当前筛选条件
   - no-user / loading / empty / error 状态继续有效
   - Workbench 入口不退化

复用要求：
- detail：fetchWorkflowTaskDetail
- approve：approveWorkflowTask
- reject：rejectWorkflowTask
- payload：buildApproveWorkflowTaskPayload、buildRejectWorkflowTaskPayload
- availability：getWorkflowActionAvailability
- display：buildWorkflowTaskDetailDisplayModel
- errors：mapWorkflowErrorToDisplay
- labels：status / step / instance / target label helpers

测试要求：
不新增测试依赖。扩展 Vitest 测试，覆盖：
- detail display model 在抽屉辅助逻辑中的使用边界
- 可操作任务映射为显示 approve/reject
- 不可操作任务映射为只读或禁用状态
- approve 空 comment 不发送 comment
- approve 非空 comment trim 后发送
- reject 空 comment 无效且不调用 API
- reject 非空 comment 发送 { comment }，不含 reason
- action success 后触发列表刷新并关闭动作状态/详情状态
- action failure 保留输入和弹窗状态
- Step 13B query/list helper 不退化
- 不测试审批历史、成果详情、批量审批

质量门禁：
执行完成后运行：
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web typecheck
- corepack pnpm --filter @research-ip/web build
- corepack pnpm lint

不运行后端测试。
不运行 migrate/seed。

浏览器验收：
如已有前端 dev server 可用，进行浏览器验收：
- 未选择 demo user：不发 detail/action 请求
- 点击任务打开详情抽屉，出现 loading 后展示 task/instance 字段
- 403/404/detail error 展示可理解错误
- 可操作任务显示 approve/reject
- 不可操作任务不显示或禁用 approve/reject，并展示原因
- approve 可空 comment 成功路径，如真实数据不可用则记录未覆盖原因
- reject 空 comment 阻止提交
- reject 非空 comment 成功路径，如真实数据不可用则记录未覆盖原因
- 动作失败时弹窗和输入保留
- 成功后列表刷新，详情关闭或刷新
- 390px 窄屏抽屉、弹窗、表单不重叠、不横向溢出

如果后端或数据不可用：
- 不运行 migrate/seed
- 不造数据
- 只记录无法覆盖真实成功态的原因

memory-bank 更新：
执行完成后更新：
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md 仅当形成新关键决策时更新

memory-bank 必须记录：
- Step 13C DONE 或未完成原因
- 改动文件范围
- detail drawer、approve/reject、payload、availability、error handling、刷新策略
- 测试、typecheck、build、lint 结果
- 浏览器验收结果或无法覆盖原因
- 未做审批历史、审计日志、批量审批、自定义审批流设计器、成果详情跨模块入口
- 未进入 Step 13D
- 未改后端、Prisma、migration/seed、package/lockfile
- 未运行 migrate/seed，未读取 .env
- 项目不是 Git 仓库，不能依赖 git status/git diff 证据

如果执行中发现必须修改后端、schema、migration、seed、依赖、package/lockfile，立即暂停并说明原因，不要继续。

完成后只输出 Step 13C 执行结果所需信息，等待下一条 Prompt。
~~~

## Step 13D

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

前提：
- Step 13A 已完成并审计 PASS。
- Step 13B 已完成，审批管理“我的待办列表”页面为 DONE。
- Step 13C 已完成，待办详情抽屉与 approve/reject 动作为 DONE。

本轮只做 Step 13D 计划确认，不执行功能实现、不修改业务代码、不运行 migrate/seed。

Step 13D 定位：
Step 13 最终审计闭环。

不要新增功能。
不要进入 Step 14/15。
不要修改后端业务语义。
不要修改 workflow 状态机。
不要修改 Prisma schema / migration / seed。
不要运行 migrate / seed。
不要新增依赖。
不要修改 package.json / lockfile。
不要读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
不要读取 E:\研究院科研成果管理系统\prompt历史记录.md。
不要全量读取 prompt.md。
不要生成 Step 13D 执行 Prompt 或任何后续 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13D 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

请先只读必要上下文，建议范围：
1. memory-bank/implementation-plan.md 顶部最新 Step 13A/13B/13C 状态
2. memory-bank/progress.md 顶部最新 Step 13A/13B/13C 状态
3. memory-bank/evidence.md 顶部最新 Step 13A/13B/13C 证据
4. memory-bank/decisions.md 顶部最新决策
5. apps/web/src/WorkflowTasks.tsx
6. apps/web/src/WorkflowTasks.test.ts
7. apps/web/src/workflow-tasks.ts
8. apps/web/src/types.ts
9. apps/web/src/App.tsx
10. apps/web/src/Workbench.tsx
11. apps/web/src/App.css 中与 workflow 页面、drawer/modal、窄屏布局相关的最小片段

Step 13D 计划确认范围：

目标：
- 审计 Step 13A/13B/13C 是否形成完整闭环。
- 核对 Step 13 整体目标是否完成：
  - Workflow 前端契约与基础能力
  - 审批管理我的待办列表
  - 待办详情抽屉
  - approve/reject 动作入口
  - comment 输入与校验
  - 成功/失败状态
  - 列表刷新
  - Workbench 入口
- 核对未越界：
  - 未做审批历史完整页
  - 未做审计日志页
  - 未做批量审批
  - 未做自定义审批流设计器
  - 未做成果详情跨模块入口
  - 未进入 Step 14/15
- 规划最终质量门禁。
- 规划最终浏览器验收。
- 规划 Step 13 overall DONE 的 memory-bank 归档。

非目标：
- 不新增功能。
- 不修 UI 小问题，除非发现阻塞 Step 13 DONE 的明确缺陷，并在计划中说明需单独确认。
- 不改后端。
- 不改 Prisma schema/migration/seed。
- 不运行 migrate/seed。
- 不造数据。
- 不补真实数据成功路径。

请输出 Step 13D 计划确认，必须包括：
1. Step 13D 审计范围
2. Step 13 overall DONE 判定标准
3. 需要核对的文件范围
4. Step 13A 核对项
5. Step 13B 核对项
6. Step 13C 核对项
7. 边界核对项
8. 质量门禁计划：
   - corepack pnpm --filter @research-ip/web test
   - corepack pnpm --filter @research-ip/web typecheck
   - corepack pnpm --filter @research-ip/web build
   - corepack pnpm lint
9. 浏览器验收计划：
   - no-user
   - demo user 恢复
   - Workbench 入口
   - 审批管理列表
   - 后端不可用状态
   - detail/action 无数据时的不可覆盖记录
   - 390px 窄屏
10. memory-bank 最终归档计划：
   - implementation-plan.md
   - progress.md
   - evidence.md
   - decisions.md 仅当形成新关键决策时更新
11. 未覆盖风险记录方式
12. Step 13D 与 Step 14/15 的边界

最后明确输出：
- 本轮只完成 Step 13D 计划确认。
- 未实现、未修改业务代码、未运行 test/build/lint、未运行 migrate/seed。
- Step 13D 执行 Prompt 应在用户确认后单独生成。
~~~

~~~
我现在继续推进 E:\研究院科研成果管理系统 项目。

前提：
- Step 13A 已完成并审计 PASS。
- Step 13B 已完成，审批管理“我的待办列表”页面为 DONE。
- Step 13C 已完成，待办详情抽屉与 approve/reject 动作为 DONE。
- Step 13D 计划确认已完成。

本轮只执行 Step 13D：
Step 13 最终审计闭环。

只允许做最终审计、质量门禁、浏览器验收、边界核对和 memory-bank 最终归档。
不要新增功能。
不要进入 Step 14/15。

禁止事项：
- 不新增审批历史完整页。
- 不新增审计日志页。
- 不新增批量审批。
- 不新增自定义审批流设计器。
- 不新增成果详情跨模块入口。
- 不修改后端业务语义。
- 不修改 workflow 状态机。
- 不修改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成后续 Prompt。

允许范围：
- 只读核对 Step 13A/13B/13C 相关代码与 memory-bank。
- 运行指定前端质量门禁。
- 做浏览器验收。
- 更新 memory-bank/implementation-plan.md、memory-bank/progress.md、memory-bank/evidence.md。
- memory-bank/decisions.md 仅当审计形成新关键决策时更新；如果只是确认 Step 13 完成，不更新 decisions。
- 如发现 App.tsx 或 Workbench 中存在明显过期文案，例如仍说“详情和处理动作留到 Step 13C”，先判断是否阻塞 Step 13 DONE；如果只是非功能文案风险，记录为风险，不要擅自修改。若你判断必须修正文案才能闭环，先暂停说明原因，等待确认。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 13D 直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

开始前只读必要上下文：
1. memory-bank 顶部最新 Step 13A/13B/13C 状态：
   - memory-bank/implementation-plan.md
   - memory-bank/progress.md
   - memory-bank/evidence.md
   - memory-bank/decisions.md
2. Step 13 直接相关代码：
   - apps/web/src/types.ts
   - apps/web/src/workflow-tasks.ts
   - apps/web/src/WorkflowTasks.tsx
   - apps/web/src/WorkflowTasks.test.ts
   - apps/web/src/App.tsx
   - apps/web/src/Workbench.tsx
   - apps/web/src/App.css 中与 workflow 页面、drawer/modal、窄屏布局相关的最小片段

审计目标：
1. 核对 Step 13A：
   - Workflow 类型齐全
   - WorkflowTaskListResult.total 兼容后端 { items }
   - buildWorkflowTaskQuery 只输出 status / achievementId，不输出 page/pageSize
   - approve/reject payload 只使用 comment，不使用 reason
   - reject 空 comment 无效
   - availability 只做前端体验保护
   - error mapping 未改变 api-client.ts 底层语义
   - API wrapper 路径正确
   - Step 13A 测试证据完整

2. 核对 Step 13B：
   - App.tsx 实际渲染 WorkflowTasks
   - 审批管理列表只消费 GET /workflow/tasks/my
   - 默认 query 为 status=PENDING
   - status / achievementId 筛选保留
   - achievementId trim，空值省略
   - 不发送 page/pageSize
   - no-user/loading/empty/error/refresh 可用
   - Workbench “进入审批管理”入口使用 workflow
   - 列表页没有 approve/reject 直接动作或详情外动作

3. 核对 Step 13C：
   - 点击列表任务打开详情抽屉并调用 fetchWorkflowTaskDetail
   - 详情只展示 task / instance 字段
   - 未展示成果详情、审批历史、审计日志
   - approve/reject 只在 getWorkflowActionAvailability 允许时展示
   - approve comment 可选
   - reject comment 必填并 trim
   - payload 只含 comment，不含 reason
   - 成功后关闭动作状态/详情并刷新当前列表
   - 失败后保留弹窗和输入
   - 测试覆盖 success/failure、payload、availability、列表回归

4. 核对边界：
   - 未做审批历史完整页
   - 未做审计日志页
   - 未做批量审批
   - 未做自定义审批流设计器
   - 未做成果详情跨模块入口
   - 未进入 Step 14/15
   - 未改后端业务语义
   - 未改 workflow 状态机
   - 未改 Prisma schema/migration/seed
   - 未改 package.json / lockfile
   - 未新增依赖
   - 未读取 .env 或敏感凭证
   - 项目不是 Git 仓库，不能用 git 证据

质量门禁：
运行：
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web typecheck
- corepack pnpm --filter @research-ip/web build
- corepack pnpm lint

不运行后端测试。
不运行 migrate/seed。

浏览器验收：
如已有前端 dev server 可用，进行浏览器验收：
- no-user：审批管理不发 workflow 业务请求
- demo user 恢复：localStorage 中 demo user 恢复后页面进入正确上下文
- Workbench 入口：点击“进入审批管理”跳转 workflow 页面
- 审批管理列表：默认请求 GET /workflow/tasks/my?status=PENDING
- 后端不可用状态：展示服务不可用，不出现假数据
- detail/action 无数据时：记录无法覆盖真实详情、approve/reject 成功路径的原因
- 390px 窄屏：页面、列表、抽屉/弹窗相关布局无横向溢出或重叠

如果后端或数据不可用：
- 不运行 migrate/seed
- 不造数据
- 不补真实成功路径
- 记录无法覆盖真实 detail/approve/reject 成功路径的原因

memory-bank 最终归档：
更新：
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md 仅当形成新关键决策时更新

归档必须记录：
- Step 13 overall DONE 或未完成原因
- Step 13A/13B/13C 子步骤完成摘要
- 最终门禁结果
- 浏览器验收结果
- 未覆盖真实 success/detail/action 的原因
- 未覆盖项是否阻塞 DONE
- 明确未越界
- 明确 Step 14/15 未开始
- 明确未改后端、workflow 状态机、Prisma schema/migration/seed、package/lockfile
- 明确未运行 migrate/seed，未读取 .env
- 项目不是 Git 仓库，不能依赖 git status/git diff 证据

DONE 判定：
如果 Step 13A/13B/13C 的实现、门禁、浏览器验收、边界和 memory-bank 证据足够支持整体完成，则归档 Step 13 overall DONE。
如果发现功能代码缺陷或门禁失败且无法在本审计范围内处理，则标记 NEEDS FIX，不要进入 Step 14/15。

完成后只输出 Step 13D 执行结果和 Step 13 overall 状态，等待下一条 Prompt。
~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Prompt 编排对话。

本次对话定位：
- 这是新的 Prompt 11 对话。
- 工作方式与上一轮 Prompt 10 保持一致。
- 本对话主要职责不是直接实现功能，而是：
  1. 根据 E:\Vibe coding 的 Vibe Coding 方法论验证 Step 对话输出是否闭环。
  2. 判断当前 Step 是否 DONE、是否越界、是否证据充分。
  3. 根据 Step 输出设计下一步计划确认 Prompt、执行 Prompt、收尾归纳 Prompt。
  4. 维持“Prompt 对话负责生成 Prompt，Step 对话负责按 Prompt 执行”的分工。
- 默认不要直接实现功能。
- 默认不要修改项目文件。
- 默认不要运行测试/build/lint，除非用户明确要求你在 Prompt 对话中做只读/验证型检查。
- 默认先读取必要上下文、确认当前状态、给出下一步单步 Prompt。

工作目录：
- 方法论工作区：E:\Vibe coding
- 项目目录：E:\研究院科研成果管理系统

必须遵守：
- 读取并遵守 E:\Vibe coding\AGENTS.md
- 遵守安全规则：不删除文件、不批量清理、不运行 destructive commands
- 不读取 .env 内容
- 不读取或展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md
- 不全量读取 prompt.md
- 先索引，后精读；只读取当前判断直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 不运行 migrate / seed，除非用户明确确认
- 不改 Prisma schema / migration / seed，除非当前 Step 明确计划并经用户确认
- 不新增依赖、不改 package.json / lockfile，除非先说明原因并等待确认
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据；需要用文件定点核对、测试、门禁、memory-bank 记录替代

当前已知进度：
- Step 11 overall DONE
- Step 12 overall DONE
- Step 13 overall DONE
- Step 13A DONE：Workflow 前端契约与基础能力
- Step 13B DONE：审批管理我的待办列表页
- Step 13C DONE：待办详情抽屉与 approve/reject 动作
- Step 13D DONE / PASS：Step 13 最终审计闭环
- Step 13E DONE：过期“留到 Step 13C”文案收尾修正
- Step 13E 已做收尾归纳
- 下一步应进入 Step 14 范围发现与计划确认，不能直接实现 Step 14

Step 13 最终验证摘要：
- web test 通过：7 files / 57 tests
- web typecheck 通过
- web build 通过，仅有既有 Vite large chunk warning
- lint 通过
- Step 13E typecheck 通过
- 真实 detail / approve / reject 成功路径因后端/data 不可用未在浏览器覆盖，已记录为非阻塞风险
- 未 migrate / seed / 造数据
- 未改后端、workflow 状态机、Prisma schema/migration/seed、package/lockfile
- 未读取 .env 或敏感凭证
- 未进入 Step 14/15

建议首先读取：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. E:\研究院科研成果管理系统\memory-bank\implementation-plan.md 顶部最新状态
6. E:\研究院科研成果管理系统\memory-bank\progress.md 顶部最新状态
7. E:\研究院科研成果管理系统\memory-bank\evidence.md 顶部最新证据
8. E:\研究院科研成果管理系统\memory-bank\decisions.md 顶部最新决策

如果用户要求“下一步 Prompt”，应优先给出 Step 14 范围发现与计划确认 Prompt，而不是 Step 14 执行 Prompt。

Step 14 下一步 Prompt 应覆盖：
- 当前状态确认：Step 13 / Step 13E DONE，Step 14 是否已开始
- 从 memory-bank 中发现 Step 14 是否已有定义
- 如果 Step 14 已定义，输出 Step 14 计划确认
- 如果 Step 14 未定义，只输出候选方向、推荐下一步和待确认问题
- 任务等级判断
- 目标与非目标
- 如为 M/L，拆成 Step 14A / 14B / 14C / 14D
- 质量门禁计划
- memory-bank 更新计划
- 风险与待确认点
- 最后明确：本轮只做范围发现/计划确认，不执行实现；执行 Prompt 需用户确认后单独生成

如果用户给出某一步执行结果，让你判断：
- 先检查是否形成闭环：目标、实现、测试/门禁、浏览器验收或替代验收、边界确认、memory-bank 归档、下一步边界
- 指出问题或风险
- 然后按用户要求给出下一步计划确认 Prompt、执行 Prompt 或收尾归纳 Prompt

请保持 Prompt 10 的工作方式：
- 不替 Step 对话执行代码
- 不让 Step 对话生成后续 Prompt
- Prompt 由本对话生成
- Step 对话只执行当前单一 Prompt
- 每次只推进一个计划确认或一个执行 Prompt，不跨多个子 Step
~~~



# 14、Step 14

~~~
~~~

Step 14A

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14A 计划确认。

Step 14 方向已由用户确认：
- 审批任务联动成果详情。
- 目标是补齐 Step 13 审批待办场景中“审批人查看关联科研成果信息”的能力。
- 本轮只做 Step 14A 范围、契约、边界和拆分计划确认，不执行实现。

本轮禁止：
- 不实现功能。
- 不修改任何文件。
- 不运行 test / build / lint。
- 不运行 migrate / seed。
- 不进入 Step 15。
- 不改后端业务语义。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成 Step 14 执行 Prompt；执行 Prompt 由 Prompt 编排对话后续单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取与 Step 14A 判断直接相关的内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. memory-bank/implementation-plan.md 顶部最新状态，以及 Step 12 / Step 13 / Step 14 相关小段
6. memory-bank/progress.md 顶部最新状态，以及 Step 12D / Step 13D / Step 13E 相关小段
7. memory-bank/evidence.md 顶部最新 Step 13E / Step 13D 证据
8. memory-bank/decisions.md 中 Step 12D、Step 13 相关最新决策
9. 如有必要，只读相关代码索引和小段：
   - apps/web/src/WorkflowTasks.tsx
   - apps/web/src/workflow-tasks.ts
   - apps/web/src/Achievements.tsx 或现有成果详情相关文件
   - apps/web/src/api-client.ts
   - apps/web/src/types.ts

本轮需要输出：

1. 当前状态确认
- Step 13 / Step 13E 是否 DONE。
- Step 14 是否已开始。
- Step 14 方向是否已确认。
- 是否存在阻塞项。

2. 现有能力盘点
- Step 13 已有审批待办、任务详情、approve/reject 哪些能力。
- Step 12D 或现有成果详情已有哪些可复用能力。
- 当前审批任务数据中是否已有 targetType / targetId / achievementId 等可用于联动成果详情的字段。
- 不要假设不存在的 API 或字段；必须基于文件证据说明。

3. Step 14A 范围确认
- 推荐 Step 14 的最小闭环目标。
- 明确用户流程：审批待办 -> 任务详情 -> 查看关联成果信息。
- 明确成果详情展示范围：只能使用现有后端/前端契约中已有的安全字段，不新增后端语义。
- 明确是否建议复用现有成果详情 API / display model / drawer 逻辑。
- 如发现现有能力不足，只记录缺口，不实现。

4. 非目标与边界
- 不做审批历史 full page。
- 不做 audit-log 页面。
- 不做附件上传/下载。
- 不做费用管理。
- 不做搜索中心/统计看板。
- 不做批量审批。
- 不做 custom workflow designer。
- 不改 workflow 状态机。
- 不改后端业务语义。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不造假数据、不用 mock 冒充真实能力。

5. 任务等级判断
- 判断 Step 14 整体是 XS / S / M / L。
- 判断 Step 14A 本轮计划确认是 XS / S。
- 说明依据：涉及前端审批页、成果详情复用、权限和真实数据验收，但暂不涉及 schema/migration/seed。

6. 建议拆分方式
如果判断 Step 14 是 M，请拆成：
- Step 14A：范围与契约确认
- Step 14B：审批任务详情中成果联动入口与只读展示基础
- Step 14C：状态、错误、权限、无关联成果、后端不可用等体验补齐
- Step 14D：审计、质量门禁、浏览器验收、memory-bank 归档

每个子 Step 只给：
- 名称
- 目标
- 非目标
- 边界
- 推荐验证方式

7. 质量门禁计划
后续执行时建议但本轮不运行：
- web 相关测试
- web typecheck
- web build
- lint
- 浏览器验收：无用户、后端不可用、关联成果可打开、403/404、移动端无横向溢出
- 如果真实后端/data 不可用，说明替代验收和非阻塞/阻塞风险

8. memory-bank 更新计划
- Step 14 执行后应更新 implementation-plan.md、progress.md、evidence.md。
- 如产生关键边界或复用决策，更新 decisions.md。
- 本轮计划确认默认不修改 memory-bank。

9. 风险与待确认点
必须单独列出：
- 成果详情 API 是否已经足够。
- 审批任务 targetId 与成果 id 的契约是否稳定。
- 权限/脱敏是否完全由后端控制。
- 浏览器真实成功路径是否依赖可用后端和真实数据。
- 是否继续禁止 schema/migration/seed/package/lockfile 改动。

最后明确输出：
- 本轮只完成 Step 14A 范围与计划确认。
- 未实现、未修改文件、未运行 test/build/lint、未运行 migrate/seed。
- 不生成执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Step 14B 执行 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14A。

Step 14A 定位：
- Step 14 方向已确认：审批任务联动成果详情。
- Step 14A 是“范围与契约确认”的执行归档步骤。
- 本轮只把 Step 14 的方向、范围、拆分、边界、质量门禁计划和风险确认正式写入 memory-bank。
- 本轮不实现 UI / API / 业务功能。

本轮允许：
- 只读必要上下文。
- 仅修改 memory-bank 相关文档：
  - memory-bank/implementation-plan.md
  - memory-bank/progress.md
  - memory-bank/evidence.md
  - 如产生关键复用/边界决策，可更新 memory-bank/decisions.md
- 记录 Step 14A DONE 证据。

本轮禁止：
- 不修改 apps/、packages/、prisma/、scripts/ 等业务代码目录。
- 不实现 Step 14B 功能。
- 不进入 Step 14B / Step 14C / Step 14D / Step 15。
- 不运行 test / build / lint。
- 不运行 migrate / seed。
- 不改后端业务语义。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成下一步 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 14A 归档直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. memory-bank/implementation-plan.md 顶部最新状态
6. memory-bank/progress.md 顶部最新状态
7. memory-bank/evidence.md 顶部最新 Step 13E / Step 14A 相关状态
8. memory-bank/decisions.md 顶部最新决策
9. 必要时只读以下代码小段，用于确认已在 Step 14A 计划中识别过的契约证据：
   - apps/web/src/types.ts 中 WorkflowTaskInstance / WorkflowTaskQuery / AchievementDetail 类型
   - apps/web/src/workflow-tasks.ts 中 workflow task API wrappers
   - apps/web/src/WorkflowTasks.tsx 中当前 Step 13 详情边界
   - apps/web/src/AchievementDetail.tsx 中现有成果详情读取与展示能力
   - apps/web/src/Achievements.tsx 中现有成果详情复用入口

执行目标：
1. 在 memory-bank/implementation-plan.md 顶部追加 Step 14A 计划归档：
   - Step 13 / Step 13E DONE。
   - Step 14 方向已确认：审批任务联动成果详情。
   - Step 14A 状态：DONE。
   - Step 14B / 14C / 14D 状态：TODO / not started。
   - Step 14 整体任务等级：M。
   - Step 14 最小闭环目标：
     审批待办列表 -> 打开任务详情 -> 当 workflow instance targetType 为 ACHIEVEMENT 且存在 targetId 时，可只读查看关联成果详情。
   - Step 14 非目标：
     不做审批历史 full page、audit-log 页面、附件、费用、搜索/看板、批量审批、自定义流程设计器、workflow 状态机变更、后端语义变更、schema/migration/seed、新依赖。
   - Step 14 拆分：
     Step 14A 范围与契约确认。
     Step 14B 审批任务详情中成果联动入口与只读展示基础。
     Step 14C 状态、错误、权限、无关联成果、后端不可用、移动端体验补齐。
     Step 14D 审计、质量门禁、浏览器验收、memory-bank 归档。

2. 在 memory-bank/progress.md 顶部追加 Step 14A 进度记录：
   - Status: DONE。
   - 本轮只做计划归档。
   - 记录已确认的现有能力：
     workflow task detail 有 targetType / targetId。
     workflow list query 有 achievementId。
     现有 AchievementDetail 使用 GET /achievements/:id。
   - 记录复用原则：
     前端优先复用现有成果详情读取与展示能力。
     审批上下文只读，不带入 submit / void / archive 等成果动作。
     权限、脱敏、403/404 以后端返回为准。
   - 记录边界：
     未实现 UI 功能。
     未修改业务代码。
     未运行 test/build/lint。
     未运行 migrate/seed。
     未改 schema/package/lockfile。
     未读取敏感凭证。

3. 在 memory-bank/evidence.md 顶部追加 Step 14A 证据记录：
   - Purpose：归档 Step 14 方向、范围、契约、拆分和边界。
   - Files changed：列出实际修改的 memory-bank 文件。
   - Read-only evidence：列出只读确认过的关键文件和字段/组件，不要粘贴大段代码。
   - Quality gate：本轮未运行 test/build/lint，原因是只改 memory-bank 计划文档。
   - Boundary evidence：确认未改业务代码、未进入 Step 14B、未运行 migrate/seed、未读 .env 或敏感信息。
   - Step closure：Step 14A DONE，Step 14B not started。

4. 如判断这是关键复用/边界决策，在 memory-bank/decisions.md 顶部追加一条新决策：
   - 标题建议：Step 14 approval-task achievement detail uses existing achievement detail contract in read-only approval context。
   - 决策内容：
     Step 14 审批任务联动成果详情复用现有 GET /achievements/:id 和成果详情类型/展示能力。
     仅在 targetType === ACHIEVEMENT 且 targetId 存在时启用。
     审批上下文保持只读。
     不带入成果 submit / void / archive 动作。
     不新增后端语义、schema、migration、seed 或依赖。
   - 如果你认为不需要 decisions.md，必须说明原因。

完成后输出：
1. Step 14A 是否 DONE。
2. 修改了哪些 memory-bank 文件。
3. 没有修改哪些禁止范围。
4. 未运行哪些门禁及原因。
5. Step 14B 是否仍未开始。
6. 剩余风险：
   - 真实成果详情成功路径依赖后端和真实 workflow/achievement 数据。
   - Step 14B 需要处理只有 targetId、没有完整 AchievementListItem 的组件契约。
   - 审批上下文必须只读，不能带入成果动作。
   - 权限/脱敏必须继续由后端控制。

最后明确：
- 本轮只完成 Step 14A 执行归档。
- 未实现功能。
- 未修改业务代码。
- 未运行 test/build/lint。
- 未运行 migrate/seed。
- 不生成下一步 Prompt。
~~~

## Step 14B

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B 计划确认。

前置状态：
- Step 13 overall DONE。
- Step 13E DONE。
- Step 14A DONE，已完成 Step 14 方向、范围、契约、拆分、边界和 D065 决策归档。
- Step 14 方向：审批任务联动成果详情。
- Step 14B 当前状态：TODO / not started。
- 本轮只做 Step 14B 计划确认，不执行实现。

Step 14B 预期主题：
- 审批任务详情中成果联动入口与只读展示基础。
- 目标是在 Step 13 的审批任务详情抽屉中，基于 workflow instance 的 targetType / targetId，为 ACHIEVEMENT 目标提供关联成果详情的只读查看能力。
- 本轮只确认 Step 14B 的可执行范围、文件影响、实现方案、边界和验证计划。

本轮禁止：
- 不实现功能。
- 不修改任何文件。
- 不运行 test / build / lint / typecheck。
- 不运行 migrate / seed。
- 不进入 Step 14C / Step 14D / Step 15。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成 Step 14B 执行 Prompt；执行 Prompt 由 Prompt 编排对话后续单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 14B 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录当前不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. memory-bank/implementation-plan.md 顶部 Step 14A 归档
6. memory-bank/progress.md 顶部 Step 14A 进度
7. memory-bank/evidence.md 顶部 Step 14A 证据
8. memory-bank/decisions.md 顶部 D065
9. 只读相关代码小段：
   - apps/web/src/WorkflowTasks.tsx
   - apps/web/src/workflow-tasks.ts
   - apps/web/src/AchievementDetail.tsx
   - apps/web/src/Achievements.tsx
   - apps/web/src/types.ts
   - apps/web/src/api-client.ts
   - apps/web/src/WorkflowTasks.test.ts
   - 如有必要，只读相关 CSS 小段：apps/web/src/App.css

本轮需要输出：

1. 当前状态确认
- Step 14A 是否 DONE。
- Step 14B 是否尚未开始。
- D065 决策是否已存在。
- 是否存在 Step 14B 启动阻塞。

2. Step 14B 现有代码契约确认
- WorkflowTasks 当前任务详情抽屉如何展示 task / instance。
- instance.targetType / targetId 在类型和展示模型中的来源。
- AchievementDetail 当前 props 和加载逻辑是什么。
- AchievementDetail 是否绑定了 submit / void / archive 动作。
- 是否存在只读复用难点，尤其是 workflow task 只有 targetId，没有完整 AchievementListItem。
- 只基于代码证据说明，不猜测不存在的 API。

3. Step 14B 推荐实现方案
- 说明最小可执行方案。
- 建议如何在审批任务详情中提供关联成果入口或只读展示基础。
- 建议如何复用 GET /achievements/:id。
- 建议如何避免带入 submit / void / archive 等成果动作。
- 建议是否拆出只读成果详情组件，或给现有 AchievementDetail 增加只读模式。
- 建议涉及哪些文件，尽量控制在 web 前端文件和测试文件范围内。

4. Step 14B 目标与非目标
目标应只包含：
- 当 task detail 的 instance.targetType === "ACHIEVEMENT" 且 targetId 存在时，审批任务详情中出现关联成果只读查看能力。
- 读取关联成果详情使用现有 GET /achievements/:id 契约。
- 审批上下文不暴露成果 submit / void / archive 动作。

非目标必须包括：
- 不做 Step 14C 的完整错误态/移动端体验补齐。
- 不做 Step 14D 审计归档。
- 不做审批历史 full page。
- 不做 audit-log 页面。
- 不做附件、费用、搜索/看板、批量审批、自定义流程设计器。
- 不改后端业务语义、workflow 状态机、Prisma schema/migration/seed、依赖、package/lockfile。
- 不使用 fake/mock 数据冒充真实后端能力。

5. 任务等级判断
- 判断 Step 14B 是 S / M 中哪一级。
- 说明依据：前端组件复用、跨页面契约、只读模式、测试覆盖、真实后端验收风险。

6. 文件影响范围计划
- 列出预计可能修改的文件。
- 每个文件说明为什么需要改。
- 明确不得修改的目录和文件类型。
- 因项目非 Git 仓库，说明后续执行如何用定点核对和 memory-bank 记录替代 git diff。

7. 验证计划
后续执行时建议运行，但本轮不运行：
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web typecheck
- 如改动影响 UI 或构建链路，再考虑 corepack pnpm --filter @research-ip/web build
- 如范围扩大，再考虑 corepack pnpm lint
- 浏览器验收先只规划，不执行：
  - 无用户状态不发业务请求
  - 后端不可用时不显示假数据
  - ACHIEVEMENT + targetId 显示关联成果入口或只读区域
  - 非 ACHIEVEMENT / 缺 targetId 显示边界状态或不显示入口
  - 成果详情动作按钮不出现在审批上下文

8. Step 14B 执行边界
- 明确 Step 14B 执行时是否允许修改 memory-bank。
- 明确 Step 14B 执行结束应记录哪些 evidence。
- 明确 Step 14C 仍只负责状态、错误、权限、无关联成果、后端不可用、移动端体验补齐。
- 明确 Step 14D 仍只负责最终审计和归档。

9. 风险与待确认点
必须列出：
- AchievementDetail 现有组件动作耦合风险。
- 只有 targetId、没有 AchievementListItem 的契约风险。
- 真实成功路径依赖后端和真实 workflow/achievement 数据。
- 权限和脱敏必须继续由后端控制。
- 是否继续禁止后端/schema/migration/seed/package/lockfile 改动。

最后明确输出：
- 本轮只完成 Step 14B 计划确认。
- 未实现、未修改文件、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- 不生成 Step 14B 执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Step 14B 执行 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B。

Step 14B 定位：
- Step 14 方向：审批任务联动成果详情。
- Step 14A 已 DONE，并已归档 D065 决策。
- 本轮执行 Step 14B：审批任务详情中成果联动入口与只读展示基础。
- 本轮允许实现前端功能、补测试、运行必要门禁、更新 memory-bank。
- 本轮不得进入 Step 14C / Step 14D / Step 15。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取和 Step 14B 直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

禁止事项：
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock 数据冒充真实后端能力。
- 不做 Step 14C 的完整错误态、权限态、后端不可用、无关联成果、移动端体验补齐。
- 不做 Step 14D 的最终审计归档。
- 不生成下一步 Prompt。

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14A 归档
2. memory-bank/progress.md 顶部 Step 14A 进度
3. memory-bank/evidence.md 顶部 Step 14A 证据
4. memory-bank/decisions.md 顶部 D065
5. apps/web/src/WorkflowTasks.tsx
6. apps/web/src/workflow-tasks.ts
7. apps/web/src/AchievementDetail.tsx
8. apps/web/src/Achievements.tsx
9. apps/web/src/types.ts
10. apps/web/src/api-client.ts
11. apps/web/src/WorkflowTasks.test.ts
12. 如存在，apps/web/src/AchievementDetail.test.ts
13. 必要时只读 apps/web/src/App.css 相关小段

执行目标：
1. 在审批任务详情抽屉中，当 workflow instance 满足：
   - targetType === "ACHIEVEMENT"
   - targetId 存在且非空
   提供关联成果详情只读查看能力。

2. 关联成果详情必须使用现有 GET /achievements/:id 契约。
   - id 使用 workflow instance targetId。
   - 权限、脱敏、403、404 和返回字段以后端响应为准。
   - 前端不得自行拼装成果详情。

3. 审批上下文必须只读。
   - 不显示 submit / void / archive 等成果动作。
   - 不调用 submit / void / archive API。
   - 不把成果管理页的 owner/action 语义带入审批任务详情。

4. 解决现有组件契约问题：
   - 不要伪造完整 AchievementListItem。
   - 优先拆出或新增按 achievementId 加载的只读成果详情展示能力。
   - 可以在 AchievementDetail.tsx 中拆出只读展示组件，或新增 readOnly / hideActions / byId 能力，但必须保持现有成果管理页行为不回退。
   - 如果调整现有 AchievementDetail props，必须同步更新既有调用和测试。

5. 可增加小型纯 helper，方便测试：
   - 例如判断 workflow instance 是否有可链接成果。
   - helper 应放在现有合适文件中，避免新建不必要抽象。

允许修改范围：
- apps/web/src/WorkflowTasks.tsx
- apps/web/src/workflow-tasks.ts
- apps/web/src/AchievementDetail.tsx
- apps/web/src/WorkflowTasks.test.ts
- apps/web/src/AchievementDetail.test.ts 或新增同目录相关测试文件
- apps/web/src/App.css，仅在样式确实需要时小范围修改
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md 仅当产生新的关键决策时更新

不得修改：
- packages/
- prisma/
- scripts/
- 后端业务代码
- Prisma schema / migration / seed
- package.json / lockfile
- 敏感配置文件

测试要求：
- 增加或更新测试，至少覆盖：
  - ACHIEVEMENT + targetId 时启用关联成果入口/只读能力。
  - 非 ACHIEVEMENT 不启用。
  - 缺 targetId 不启用。
  - 审批上下文不显示 submit / void / archive 动作。
  - 现有成果管理页详情行为不回退。
- 单元/组件测试可以使用测试夹具模拟接口响应，但不得把测试夹具描述成真实后端验收。

执行后运行门禁：
1. corepack pnpm --filter @research-ip/web test
2. corepack pnpm --filter @research-ip/web typecheck
3. corepack pnpm --filter @research-ip/web build
4. 如范围扩大或 lint 曾覆盖此类改动，再运行 corepack pnpm lint

如果门禁失败：
- 在 Step 14B 范围内修复。
- 重新运行失败的门禁。
- 不通过时不得声称 DONE，必须记录原因和阻塞。

浏览器验收：
- 如本地 dev server 可用，可做轻量浏览器检查。
- 本轮只需验证基础行为：
  - 无用户状态不发业务请求。
  - 后端不可用时不显示假数据。
  - 成果动作按钮不出现在审批上下文。
- 真实关联成果成功路径如果缺少可用后端和真实 workflow/achievement 数据，可以记录为未覆盖风险，不要 migrate/seed 或造假数据强行制造成功。

memory-bank 更新：
完成实现和验证后，更新：
- memory-bank/implementation-plan.md：记录 Step 14B 状态、交付内容、边界、下一步 Step 14C。
- memory-bank/progress.md：记录 Step 14B DONE 或未完成状态、文件范围、验证结果、边界。
- memory-bank/evidence.md：记录修改文件、测试/typecheck/build/lint 结果、浏览器验收或未覆盖原因、禁止范围未触碰证据。
- memory-bank/decisions.md：仅当产生 D065 之外的新关键决策时更新；否则说明未新增决策。

完成后输出：
1. Step 14B 是否 DONE。
2. 实际修改了哪些文件。
3. 实现了什么。
4. 测试和门禁结果。
5. 浏览器验收结果或未运行原因。
6. 未修改的禁止范围确认。
7. Step 14C 是否仍未开始。
8. 剩余风险，尤其：
   - 真实成功路径是否依赖可用后端和真实数据。
   - 权限/脱敏是否仍完全由后端控制。
   - 审批上下文是否确认没有成果 submit / void / archive 动作。

最后明确：
- 本轮只执行 Step 14B。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。
~~~

 **Step 14B-Verify Prompt**

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-Verify。

定位：
- 这是 Step 14B 的补充真实验收步骤。
- 目标是启动或连接真实后端，验证“审批任务详情 -> 查看关联成果详情”的真实成功路径。
- 本轮不实现新功能，不修改业务代码，不进入 Step 14C / Step 14D / Step 15。
- 如果真实后端、数据库或真实数据不可用，必须明确记录为阻塞或未覆盖风险，不得用 migrate/seed/mock/fake data 强行制造成功。

前置状态：
- Step 14A DONE。
- Step 14B 已完成实现和代码门禁。
- Step 14B 已通过：
  - web test
  - web typecheck
  - web build
  - lint
- Step 14B 浏览器只覆盖了后端不可用降级路径，真实成功路径尚未覆盖。
- 本轮要补真实成功路径验收。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取与 Step 14B-Verify 直接相关的上下文
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不修改业务代码。
- 不修改 memory-bank 以外文件，除非用户另行确认。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed，除非先说明原因、影响范围并等待用户明确确认。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 mock/fake/seed 数据冒充真实成功路径。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。

允许：
- 只读检查 package scripts、README、memory-bank 顶部记录、相关前端/后端启动说明。
- 检查 `.env` 或配置文件是否存在，但不得读取或展示敏感内容。
- 使用项目已有脚本启动前端/后端 dev server。
- 如果启动后端需要数据库连接、迁移、seed 或敏感配置，暂停并请求用户确认。
- 如果你启动了临时服务，记录命令和端口；验收完成后只停止你本轮启动的明确进程，不要批量杀进程。

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14B 记录
2. memory-bank/progress.md 顶部 Step 14B 记录
3. memory-bank/evidence.md 顶部 Step 14B 证据
4. memory-bank/decisions.md 顶部 D065
5. package.json / workspace 配置中与启动脚本有关的小段
6. README 或项目启动说明中与本地前后端启动有关的小段
7. 必要时只读相关 API/controller 路由文件，确认 backend 端口/API 前缀，不改代码

执行目标：
1. 确认当前前端 dev server 是否可用。
2. 确认后端是否已启动且可访问。
3. 如果后端未启动：
   - 先查项目已有启动脚本。
   - 说明将运行哪个启动命令。
   - 如启动不涉及 migrate/seed/DB 初始化/敏感配置读取，可尝试启动。
   - 如启动需要数据库、migrate、seed 或敏感环境配置，暂停并向用户确认，不得自行继续。
4. 后端可用后，用真实现有数据验证：
   - 进入审批管理。
   - 使用现有 demo 用户或项目已有认证方式。
   - 找到真实 workflow task。
   - 仅当任务 instance.targetType === "ACHIEVEMENT" 且 targetId 存在时，打开任务详情。
   - 点击“查看关联成果”。
   - 确认前端调用真实 GET /achievements/:id。
   - 确认只读成果详情能正常显示。
   - 确认审批上下文不显示成果 submit / void / archive 动作。
5. 如果没有符合条件的真实 workflow/achievement 数据：
   - 不运行 seed。
   - 不伪造数据。
   - 记录无法覆盖真实成功路径的具体原因。
   - 判断这是阻塞还是非阻塞风险，并说明依据。

验收重点：
- 真实后端联通。
- 真实 workflow task 数据。
- 真实 achievement detail 请求。
- 成功打开关联成果详情。
- 审批上下文只读。
- 不出现 submit / void / archive 成果动作。
- 权限、脱敏、403/404 以后端响应为准。

本轮可以运行的验证：
- 浏览器验收。
- 只读 API smoke check，例如 GET health endpoint 或相关本地接口；不得包含敏感 header/token 输出。
- 如发现 Step 14B 代码因真实后端暴露出小 bug，需要先汇报；未经确认不要扩大到实现修复。

memory-bank 更新：
- 如果真实验收完成或确认阻塞，允许只更新：
  - memory-bank/evidence.md
  - memory-bank/progress.md
  - 必要时 memory-bank/implementation-plan.md
- 记录：
  - 后端是否启动/可访问。
  - 使用了哪些启动命令。
  - 是否涉及数据库、migrate、seed。
  - 浏览器验收路径。
  - 成功覆盖和未覆盖项。
  - 是否仍可判定 Step 14B DONE。
- 不新增 decisions.md，除非产生新的关键边界决策。

完成后输出：
1. Step 14B-Verify 结果：PASS / BLOCKED / PARTIAL。
2. 后端是否已启动或已连接。
3. 是否运行了后端启动命令；如运行，命令是什么。
4. 是否触及数据库、migrate、seed；必须明确说明。
5. 真实成功路径是否覆盖。
6. 如果未覆盖，原因是什么。
7. 是否确认审批上下文没有成果 submit / void / archive 动作。
8. 修改了哪些 memory-bank 文件。
9. 是否仍建议 Step 14B 判定 DONE。
10. Step 14C 是否仍未开始。

最后明确：
- 本轮只执行 Step 14B-Verify。
- 未进入 Step 14C / Step 14D / Step 15。
- 未运行 migrate/seed，除非用户已明确确认。
- 不生成下一步 Prompt。
~~~

 **Step 14B-API500** 

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 调查计划确认。

定位：
- 这是 Step 14B-Verify 后的补充调查计划。
- Step 14B 前端实现和代码门禁已完成。
- Step 14B-Verify 结果为 PARTIAL：后端 health 正常，但真实业务接口返回 HTTP 500，导致真实关联成果成功路径无法覆盖。
- 本轮只做 API 500 调查计划确认，不修复代码、不修改文件、不运行 migrate/seed、不进入 Step 14C / Step 14D / Step 15。

已知现象：
- 后端可启动：`corepack pnpm --filter @research-ip/api dev`。
- `GET /api/health` 返回 ok。
- PostgreSQL 容器 `research-achievement-postgres-dev` 健康，发布在 `127.0.0.1:55432`。
- `GET /api/workflow/tasks/my?status=PENDING` 使用科研秘书 demo 用户返回 HTTP 500。
- `GET /api/achievements?page=1&pageSize=5` 使用同一 demo 用户返回 HTTP 500。
- 浏览器显示 `审批服务不可用` / `Internal server error`。
- 未运行 migrate/seed。
- 未读取 `.env` 内容或展示凭证。
- 未使用 fake/mock/seed 数据。

本轮禁止：
- 不修复代码。
- 不修改任何文件。
- 不运行 test / build / lint，除非只是只读调查计划中说明后续需要。
- 不运行 migrate / seed。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取 `.env` 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock/seed 数据冒充真实成功路径。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成修复执行 Prompt；后续 Prompt 由 Prompt 编排对话单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取和 API 500 调查计划直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部 Step 14B-Verify 记录
2. memory-bank/progress.md 顶部 Step 14B-Verify 记录
3. memory-bank/evidence.md 顶部 Step 14B-Verify 证据
4. memory-bank/decisions.md 顶部 D065
5. 后端与这两个接口直接相关的小范围文件：
   - workflow tasks controller / service / repository / policy 相关文件
   - achievements list controller / service / repository / policy 相关文件
   - demo user / user context / auth guard / permission guard 相关文件
   - Prisma schema 中与读取这些接口直接相关的 model 名称和关系
6. package scripts / README 中后端启动和日志查看相关小段
7. 不读取 `.env` 内容，只能确认其存在

本轮输出要求：

1. 当前状态确认
- Step 14B 是否 DONE。
- Step 14B-Verify 是否 PARTIAL。
- 哪些接口 500。
- 是否已确认 health ok。
- Step 14C 是否未开始。

2. 500 问题影响判断
- 这个问题是否阻塞真实成功路径验收。
- 是否影响 Step 14B 前端实现判定。
- 是否应在进入 Step 14C 前调查。
- 是否可能同时影响成果列表和 workflow 待办列表。

3. 初步假设列表
只列假设，不修复：
- 数据库 schema 与代码不一致。
- 数据缺失或 demo user 缺少关联部门/权限上下文。
- 权限 guard / user context 生成失败。
- Prisma 查询 include/select 关系异常。
- 后端服务依赖环境变量但当前配置不完整。
- list API 的 DTO / query parsing / policy where 条件异常。
- 其他从代码证据中发现的可能原因。

4. 调查计划
按安全顺序拆分：
- 只读日志观察：启动后端，复现两个 500，查看终端错误栈；不得展示敏感连接串。
- 只读代码定位：定位 controller -> service -> policy -> Prisma 查询链路。
- 只读数据库状态检查：仅允许表清单、必要行数、demo user 是否存在、权限/部门/角色关联是否存在；不得改数据。
- 接口 smoke：health、workflow tasks、achievements list；不带敏感信息输出。
- 判断是否需要后续修复 Prompt。

5. 允许与禁止的后续调查命令边界
- 允许启动后端 dev server。
- 允许 GET 本地 API。
- 允许只读数据库查询，例如 SELECT count(*) 或确认 demo user/role/department 是否存在。
- 禁止 INSERT / UPDATE / DELETE / TRUNCATE / DROP。
- 禁止 migrate / seed。
- 禁止读取或打印 `.env` 内容、DATABASE_URL 或完整连接串。
- 禁止改代码，除非后续用户确认进入修复执行。

6. 任务等级判断
- 判断 API500 调查是 S / M / L。
- 如果涉及后端、数据库只读检查、权限链路，通常至少 M。
- 如需要 schema/migration/seed 或业务语义修复，则升级后续修复为 L 或单独确认。

7. 后续可能分支
- A：只是环境/启动/缺少数据导致，记录阻塞并让用户决定是否允许 seed/migrate 或提供真实数据。
- B：是后端 bug，但不涉及 schema，后续生成 API500 修复执行 Prompt。
- C：是 schema/migration 不一致，必须暂停并请求用户确认是否允许 migration 相关操作。
- D：是权限/用户上下文问题，后续单独计划确认，避免顺手改权限模型。

8. memory-bank 计划
- 本轮计划确认默认不修改文件。
- 后续调查执行完成后，应更新 evidence/progress，必要时 implementation-plan。
- 如产生关键决策，再更新 decisions.md。

最后明确输出：
- 本轮只完成 Step 14B-API500 调查计划确认。
- 未修复、未修改文件、未运行 migrate/seed、未进入 Step 14C。
- 不生成修复执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Step 14B-API500 调查执行 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 调查执行。

定位：
- 这是 Step 14B-Verify 后的真实后端 500 根因调查。
- 目标：查清为什么以下两个真实业务接口返回 HTTP 500：
  1. GET /api/workflow/tasks/my?status=PENDING
  2. GET /api/achievements?page=1&pageSize=5
- 本轮只调查、复现、定位、记录证据。
- 不修复代码，不修改业务文件，不进入 Step 14C / Step 14D / Step 15。

前置事实：
- Step 14B 前端实现和代码门禁已完成。
- Step 14B-Verify 结果为 PARTIAL。
- 后端可启动：corepack pnpm --filter @research-ip/api dev。
- GET /api/health 返回 ok。
- PostgreSQL 容器 research-achievement-postgres-dev 健康，发布在 127.0.0.1:55432。
- 使用科研秘书 demo 用户请求 workflow tasks 和 achievements list 均返回 HTTP 500。
- 未运行 migrate/seed。
- 未读取 .env 内容或展示凭证。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取 API500 调查直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不修改业务代码。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock/seed 数据制造成功路径。
- 不执行 INSERT / UPDATE / DELETE / TRUNCATE / DROP。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。

允许：
- 启动后端 dev server。
- 请求本地 API。
- 查看后端终端错误栈，但必须脱敏，不复述连接串或凭证。
- 只读检查相关后端代码链路。
- 只读数据库状态检查，仅限 SELECT / 表清单 / 行数 / demo 用户、角色、权限、部门、workflow、achievement 关联存在性。
- 如直接数据库查询需要读取 .env 内容或完整连接串，立即停止并说明阻塞，不得读取。

建议只读上下文：
1. memory-bank/implementation-plan.md 顶部 Step 14B-Verify 记录
2. memory-bank/progress.md 顶部 Step 14B-Verify 记录
3. memory-bank/evidence.md 顶部 Step 14B-Verify 证据
4. memory-bank/decisions.md 顶部 D065
5. 与两个 500 接口直接相关的小范围后端文件：
   - workflow tasks controller / service / repository
   - achievement controller / service / repository
   - policy query factory
   - user context / dev identity / auth guard / permission guard
   - Prisma schema 中相关 model 小段
6. package scripts / README 中后端启动相关小段
7. 不读取 .env 内容，只能确认是否存在

执行步骤：

1. 状态复核
- 确认 Step 14B-Verify 为 PARTIAL。
- 确认 Step 14C / Step 14D / Step 15 未开始。
- 确认本轮只调查 500 根因。

2. 后端复现
- 检查后端端口是否已有服务。
- 如没有，使用项目已有脚本启动：
  corepack pnpm --filter @research-ip/api dev
- 记录启动命令和端口。
- 不打印 .env、DATABASE_URL 或连接串。
- 请求：
  GET http://127.0.0.1:3000/api/health
  GET http://127.0.0.1:3000/api/workflow/tasks/my?status=PENDING
  GET http://127.0.0.1:3000/api/achievements?page=1&pageSize=5
- 使用与 Step 14B-Verify 相同的科研秘书 demo 用户方式。
- 记录状态码和脱敏错误摘要。

3. 错误栈采集
- 查看后端终端中这两个 500 对应的错误栈。
- 输出时必须脱敏：
  - 不输出 DATABASE_URL。
  - 不输出密码、token、cookie、证书、私钥。
  - 不输出完整连接串。
- 重点记录：
  - 报错类型。
  - 报错文件/函数。
  - Prisma error code 或异常 message 的非敏感部分。
  - 是 user context、permission、policy、repository、Prisma 查询还是数据问题。

4. 代码链路定位
只读追踪：
- WorkflowController.listMyWorkflowTasks
- WorkflowService.listMyWorkflowTasks
- WorkflowRepository.findTasksForAssignee
- AchievementController.list
- AchievementService.list
- PolicyQueryFactory.achievementReadableWhere
- AchievementRepository.list
- UserContextGuard / DevIdentityAdapter / PermissionGuard
输出：
- 两个接口共享的链路点。
- 哪个位置最可能抛 500。
- 是否两个 500 有同一个根因。

5. 只读数据库状态检查
仅在不需要读取 .env 内容或展示连接串的前提下执行。
只允许 SELECT，例如：
- 关键表是否存在。
- demo user 是否存在且 ACTIVE。
- demo user 是否有关联 role。
- role 是否有关联 permission。
- demo user 是否有关联 department。
- achievements / workflow_tasks / workflow_instances 是否有行数。
- workflow task 是否存在 targetType = ACHIEVEMENT 且 targetId 非空的数据。
禁止任何写操作。
如果无法安全连接数据库，记录阻塞原因，不要绕过规则。

6. 根因判断
根据错误栈、代码链路、只读数据，给出结论：
- CONFIRMED：已有明确根因。
- LIKELY：高概率根因，但还缺一个验证点。
- UNKNOWN：证据不足。

根因分类只能选或组合：
- 环境/启动配置问题。
- 数据缺失或 demo 用户上下文不完整。
- 权限/用户上下文 bug。
- Prisma 查询 / include / select bug。
- schema/migration 与代码不一致。
- 业务代码未处理异常。
- 其他，并说明证据。

7. 后续建议
根据根因输出下一步建议，但不要生成修复 Prompt：
- 如果是缺数据/环境问题：说明是否需要用户提供真实数据，或是否需要用户确认 seed/migrate。
- 如果是后端 bug 且不涉及 schema：建议后续单独生成 API500 修复执行 Prompt。
- 如果涉及 schema/migration：必须建议暂停并让用户确认。
- 如果涉及权限模型：建议单独计划确认，不要顺手改权限。

memory-bank 更新：
调查完成后允许更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如产生关键决策，再更新 memory-bank/decisions.md
记录：
- 复现命令。
- 状态码。
- 脱敏错误摘要。
- 只读代码证据。
- 只读数据库证据或无法执行原因。
- 根因判断等级。
- 是否仍阻塞真实成功路径。
- 是否仍建议 Step 14B 保持 DONE。
- Step 14C 是否仍未开始。

完成后输出：
1. Step 14B-API500 调查结果：CONFIRMED / LIKELY / UNKNOWN。
2. 两个 500 是否复现。
3. health 是否仍 ok。
4. 脱敏错误栈摘要。
5. 最可能根因及证据。
6. 是否执行了只读数据库检查，检查了什么。
7. 是否触及 migrate/seed：必须明确说明。
8. 是否修改了业务代码：必须明确说明。
9. 更新了哪些 memory-bank 文件。
10. 是否仍阻塞 Step 14B 真实成功路径。
11. 是否建议进入修复计划确认，或需要用户先确认 seed/migration/数据问题。
12. Step 14C 是否仍未开始。

最后明确：
- 本轮只执行 Step 14B-API500 调查。
- 未修复、未进入 Step 14C / Step 14D / Step 15。
- 未运行 migrate/seed。
- 不生成下一步 Prompt。
~~~

Step 14B-API500 修复计划确认

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 修复计划确认。

定位：
- 这是 Step 14B-API500 调查后的修复计划确认。
- 调查结果已 CONFIRMED：两个真实后端业务接口 500 的直接原因是后端 Nest 依赖注入 / dev runtime wiring 异常。
- 本轮只做修复计划确认，不修复代码、不修改文件、不运行 migrate/seed、不进入 Step 14C / Step 14D / Step 15。

已确认事实：
- Step 14B 前端实现和代码门禁已完成，Step 14B 保持 DONE。
- Step 14B-Verify 为 PARTIAL。
- Step 14B-API500 调查结果为 CONFIRMED。
- `GET /api/health` 为 200 ok。
- `GET /api/workflow/tasks/my?status=PENDING` 返回 HTTP 500。
- `GET /api/achievements?page=1&pageSize=5` 返回 HTTP 500。
- workflow 500：`WorkflowService.assertReviewContext` 中访问 `hasPermission` 时依赖为 undefined。
- achievement list 500：`AchievementService.list` 中访问 `achievementReadableWhere` 时依赖为 undefined。
- 两个错误都发生在 repository / Prisma 查询之前。
- 数据库表存在，科研秘书 demo 用户 ACTIVE，具备相关角色和权限。
- 当前库中 workflow_instances = 0、workflow_tasks = 0，因此修复 API500 后真实关联成果成功路径仍可能缺 workflow task 数据。
- 未运行 migrate/seed，未读取 .env 内容，未展示凭证。

本轮禁止：
- 不修复代码。
- 不修改任何文件。
- 不运行 test / build / lint / typecheck。
- 不运行 migrate / seed。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock/seed 数据制造成功路径。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成修复执行 Prompt；后续 Prompt 由 Prompt 编排对话单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 API500 修复计划直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部 Step 14B-API500 记录
2. memory-bank/progress.md 顶部 Step 14B-API500 记录
3. memory-bank/evidence.md 顶部 Step 14B-API500 证据
4. memory-bank/decisions.md 顶部 D065
5. 只读相关后端代码小段：
   - apps/api/src/workflow/workflow.service.ts
   - apps/api/src/workflow/workflow.module.ts
   - apps/api/src/achievements/achievement.service.ts
   - apps/api/src/achievements/achievements.module.ts
   - apps/api/src/authorization/authorization.module.ts
   - apps/api/src/authorization/rbac-policy.service.ts
   - apps/api/src/policies/policy-query.factory.ts 或实际文件路径
   - apps/api/src/main.ts / app.module.ts 中与模块加载相关的小段
   - apps/api/tsconfig.json
   - package scripts 中 api dev 相关小段

本轮输出要求：

1. 当前状态确认
- Step 14B 是否 DONE。
- Step 14B-Verify 是否 PARTIAL。
- API500 调查是否 CONFIRMED。
- Step 14C 是否未开始。
- 当前修复计划是否只针对后端 DI/runtime wiring。

2. 根因复述
- 用脱敏、简短方式复述两个 500 的直接原因。
- 明确它们发生在 repository / Prisma 之前。
- 明确数据库和 demo 权限检查没有支持“缺数据/缺权限导致当前 500”的解释。
- 明确 workflow 数据缺失是另一个后续验收风险，不是当前 500 的直接原因。

3. 代码结构确认
- 确认 WorkflowService 如何声明/接收 RbacPolicyService。
- 确认 AchievementService 如何声明/接收 PolicyQueryFactory。
- 确认这些 provider 在对应 module 是否导入/导出。
- 确认 dev runtime 为什么可能让 constructor metadata / DI 失效。
- 只基于代码证据说明，不猜测超出证据的内容。

4. 修复目标
- 修复两个接口因依赖 undefined 导致的 500。
- 让 Nest 在 dev server 路径下稳定注入：
  - WorkflowService 所需的 RbacPolicyService。
  - AchievementService 所需的 PolicyQueryFactory。
- 不改变业务权限语义。
- 不改变 workflow 状态机。
- 不改变数据库 schema / migration / seed。
- 不新增依赖。
- 不改变接口契约。

5. 推荐修复方案
请给出最小安全方案，优先考虑：
- 使用明确的 `@Inject(...)` 或等价 Nest DI 显式注入方式，避免 dev runtime 下 metadata 丢失。
- 或调整 module provider export/import，只在证据显示 module wiring 不完整时。
- 不要用 new 手动实例化 service。
- 不要绕过 permission/policy service。
- 不要把权限判断改成默认放行。
- 不要改变 DTO、repository 查询或 Prisma schema。

6. 文件影响范围计划
列出可能修改的文件和原因，例如：
- workflow.service.ts：显式注入 RbacPolicyService。
- achievement.service.ts：显式注入 PolicyQueryFactory。
- 相关 module 文件：仅当 provider export/import 证据不足时修改。
- 相关后端测试文件：增加 DI / endpoint regression 覆盖。
- memory-bank/progress.md、evidence.md、implementation-plan.md：修复执行后记录证据。
明确不得修改：
- Prisma schema / migration / seed。
- package.json / lockfile。
- 前端 Step 14B 实现文件，除非执行中发现前端无关问题且另行确认。
- 敏感配置。

7. 验证计划
后续修复执行时建议运行，但本轮不运行：
- 后端相关测试。
- 如存在 targeted api test，运行覆盖 workflow list / achievement list。
- API typecheck / build，按项目脚本选择。
- 启动后端 dev server。
- GET /api/health。
- GET /api/achievements?page=1&pageSize=5。
- GET /api/workflow/tasks/my?status=PENDING。
- 验证修复后不再因依赖 undefined 返回 500。
- 若 workflow list 返回 200 但 items 为空，应记录为数据不足风险，而不是 500。
- 不运行 migrate/seed。

8. 任务等级判断
- 判断本次修复是 S / M / L。
- 如果只做后端 DI 显式注入和回归测试，通常为 M。
- 如果发现要改 schema/migration/权限业务语义，则升级并暂停确认。

9. 风险与边界
必须列出：
- 显式注入修复可能影响 dev/runtime DI，但不应改变业务行为。
- 如果 module export/import 不完整，修复需谨慎避免扩大模块耦合。
- 修复 500 后仍可能没有 workflow task 数据，因此真实关联成果成功路径仍可能无法完整覆盖。
- 不能用 seed/migrate/fake data 强行制造成功路径。
- 不能把权限判断默认放行。

10. memory-bank 计划
- 本轮计划确认默认不修改 memory-bank。
- 后续修复执行完成后更新:
  - memory-bank/progress.md
  - memory-bank/evidence.md
  - 必要时 memory-bank/implementation-plan.md
  - 如产生关键架构/DI 决策，再更新 memory-bank/decisions.md

最后明确输出：
- 本轮只完成 Step 14B-API500 修复计划确认。
- 未修复、未修改文件、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成修复执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Step 14B-API500 修复执行 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 修复执行。

定位：
- 这是 Step 14B-API500 调查后的后端 DI/runtime wiring 修复步骤。
- 目标：修复以下两个真实业务接口因 service 依赖 undefined 导致的 HTTP 500：
  1. GET /api/workflow/tasks/my?status=PENDING
  2. GET /api/achievements?page=1&pageSize=5
- 本轮只做最小后端 DI 修复、回归测试、真实接口验证和 memory-bank 记录。
- 不进入 Step 14C / Step 14D / Step 15。
- 不补 workflow 数据，不运行 migrate/seed。

前置事实：
- Step 14B 前端实现和代码门禁已 DONE。
- Step 14B-Verify 为 PARTIAL。
- Step 14B-API500 调查结果 CONFIRMED。
- 直接根因：
  - `WorkflowService.assertReviewContext` 中访问 `rbacPolicy.hasPermission` 时依赖为 undefined。
  - `AchievementService.list` 中访问 `policyQueryFactory.achievementReadableWhere` 时依赖为 undefined。
- 两个错误都发生在 repository / Prisma 查询之前。
- `AuthorizationModule` 已 provider/export `RbacPolicyService` 和 `PolicyQueryFactory`。
- `WorkflowModule` 与 `AchievementsModule` 已 import `AuthorizationModule`。
- 当前库中 `workflow_instances = 0`、`workflow_tasks = 0`，所以修复 500 后真实关联成果成功路径可能仍缺数据。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取与本次 DI 修复直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不改后端业务语义。
- 不绕过 permission / policy。
- 不把权限判断默认放行。
- 不改 workflow 状态机。
- 不改 DTO / repository 查询 / Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不补 workflow 数据。
- 不使用 fake/mock/seed 数据制造成功路径。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/api/src/workflow/workflow.service.ts
- apps/api/src/achievements/achievement.service.ts
- apps/api/src/authorization/policy/policy-query.factory.ts，仅当执行验证发现其内部依赖也有 undefined 风险时
- 相关后端测试文件
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当产生关键 DI/架构决策时

不得修改：
- apps/web/ 前端 Step 14B 实现文件
- packages/
- prisma/schema.prisma
- prisma/migrations/
- seed 文件
- scripts/
- package.json / lockfile
- 敏感配置

建议先只读：
1. memory-bank/implementation-plan.md 顶部 API500 记录
2. memory-bank/progress.md 顶部 API500 记录
3. memory-bank/evidence.md 顶部 API500 证据
4. apps/api/src/workflow/workflow.service.ts
5. apps/api/src/achievements/achievement.service.ts
6. apps/api/src/authorization/authorization.module.ts
7. apps/api/src/authorization/rbac-policy.service.ts
8. apps/api/src/authorization/policy/policy-query.factory.ts
9. apps/api/src/workflow/workflow.module.ts
10. apps/api/src/achievements/achievements.module.ts
11. 相关后端测试文件
12. package scripts 中 api test/typecheck/build/dev 相关小段

执行目标：
1. 修复 WorkflowService 构造依赖注入。
   - 使用 Nest 显式 `@Inject(...)` 或项目现有等价模式。
   - 至少覆盖 `RbacPolicyService`。
   - 建议覆盖同一 constructor 中所有 provider 依赖，避免修完一个 undefined 后暴露下一个 undefined。
   - 不改变 `assertReviewContext` 的权限语义。

2. 修复 AchievementService 构造依赖注入。
   - 使用显式 `@Inject(...)` 或项目现有等价模式。
   - 至少覆盖 `PolicyQueryFactory`。
   - 建议覆盖同一 constructor 中所有 provider 依赖。
   - 不改变 `AchievementService.list` 的 policy 语义。

3. 如验证发现 PolicyQueryFactory 内部依赖也出现 undefined：
   - 只做同类显式注入修复。
   - 不改变 policy 计算逻辑。

4. 添加或更新最小后端回归测试。
   - 覆盖 service 可以拿到关键依赖，不再因 undefined 抛错。
   - 如已有 controller/service 测试结构，优先沿用。
   - 不使用 fake 数据冒充真实后端验收；单元测试 mock 依赖可以用于 DI regression，但必须说清是测试替身。

5. 不做数据修复。
   - 不补 workflow task。
   - 不 seed。
   - 不 migrate。
   - 如果 API 修复后 workflow tasks 返回 200 且 items 为空，应记录为“数据不足风险”，不是本次 API500 修复失败。

验证要求：
1. 运行后端相关门禁：
   - corepack pnpm --filter @research-ip/api test
   - corepack pnpm --filter @research-ip/api typecheck
   - corepack pnpm --filter @research-ip/api build
2. 若范围扩大或 lint 适用，再运行：
   - corepack pnpm lint
3. 启动后端 dev server：
   - corepack pnpm --filter @research-ip/api dev
4. 验证本地接口：
   - GET http://127.0.0.1:3000/api/health
   - GET http://127.0.0.1:3000/api/achievements?page=1&pageSize=5
   - GET http://127.0.0.1:3000/api/workflow/tasks/my?status=PENDING
   使用与调查一致的科研秘书 demo 用户方式。
5. 成功标准：
   - health 仍为 200 ok。
   - achievements list 不再因 `achievementReadableWhere` undefined 返回 500。
   - workflow tasks 不再因 `hasPermission` undefined 返回 500。
   - 如 workflow tasks 返回 200 且 items 为空，记录当前库缺 workflow task 数据。
   - 不运行 migrate/seed，不造数据。

如果验证失败：
- 只在本次 DI 修复范围内继续排查。
- 若发现需要改业务语义、schema/migration/seed、package/lockfile，立即停止并报告，不得擅自继续。
- 不通过时不得声称 DONE。

memory-bank 更新：
修复和验证完成后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如产生关键 DI/架构决策，再更新 memory-bank/decisions.md
记录：
- 修改文件。
- 修复方式。
- 测试/typecheck/build/lint 结果。
- 本地 API smoke 结果。
- 是否仍有 workflow data 缺失风险。
- 禁止范围未触碰证据。
- Step 14C / 14D / 15 未开始。

完成后输出：
1. Step 14B-API500 修复是否 DONE。
2. 修改了哪些文件。
3. 修复了什么。
4. 后端测试/typecheck/build/lint 结果。
5. 本地 API smoke 结果。
6. 是否运行 migrate/seed：必须明确说明。
7. 是否修改 schema/package/lockfile：必须明确说明。
8. 是否仍有 workflow task 数据缺失风险。
9. 是否仍阻塞真实关联成果成功路径。
10. Step 14C 是否仍未开始。

最后明确：
- 本轮只执行 Step 14B-API500 修复。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。
~~~

Step 14B-API500 Repository DI 修复计划确认

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 Repository DI 修复计划确认。

定位：
- 这是 Step 14B-API500 修复执行后的补充计划确认。
- 上一轮修复执行未 DONE，当前 BLOCKED。
- 原 service / policy factory 层依赖 undefined 已通过显式 Inject(...) 修复。
- 后端测试/typecheck/build/lint 已通过。
- 真实 API smoke 仍 500，新栈已前进到 repository 层：
  - AchievementRepository.list 中 repository prisma 为 undefined。
  - WorkflowRepository.findTasksForAssigneeInTransaction 中 repository prisma 为 undefined。
- 本轮只做扩大修复范围的计划确认，不修复代码、不修改文件、不运行 migrate/seed、不进入 Step 14C / Step 14D / Step 15。

已知事实：
- 已修改并通过门禁：
  - WorkflowService 显式注入。
  - AchievementService 显式注入。
  - PolicyQueryFactory 显式注入。
  - 相关 metadata/DI 回归测试。
- `GET /api/health` 仍 200 ok。
- `GET /api/achievements?page=1&pageSize=5` 仍 500。
- `GET /api/workflow/tasks/my?status=PENDING` 仍 500。
- 新的直接失败点位于 repository 构造依赖 `PrismaService` 未稳定注入。
- 未运行 migrate/seed。
- 未修改 schema/package/lockfile。
- 未补 workflow 数据。
- Step 14C 未开始。

本轮禁止：
- 不修复代码。
- 不修改任何文件。
- 不运行 test / build / lint / typecheck。
- 不运行 migrate / seed。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 DTO / Prisma 查询语义。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不补 workflow 数据。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock/seed 数据制造成功路径。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成修复执行 Prompt；后续 Prompt 由 Prompt 编排对话单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Repository DI 修复计划直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部 API500 修复 BLOCKED 记录
2. memory-bank/progress.md 顶部 API500 修复 BLOCKED 记录
3. memory-bank/evidence.md 顶部 API500 修复 BLOCKED 证据
4. apps/api/src/achievements/achievement.repository.ts
5. apps/api/src/workflow/workflow.repository.ts
6. apps/api/src/prisma/prisma.service.ts 或实际 PrismaService 路径
7. achievements / workflow module 中 provider 注册相关小段
8. 已新增或更新的相关后端测试小段
9. package scripts 中 API 门禁命令小段

本轮输出要求：

1. 当前状态确认
- Step 14B 前端是否 DONE。
- API500 第一轮修复是否 BLOCKED。
- 原 service/policy factory undefined 是否已解决。
- 新失败点是否为 repository prisma undefined。
- Step 14C 是否未开始。

2. 根因范围确认
- 简述为什么现在需要扩大到 repository DI。
- 明确这不是业务语义问题，不是 schema/migration/seed 问题。
- 明确当前允许范围不足以继续修复，因此需要用户确认。

3. 代码结构确认
- AchievementRepository 如何声明/接收 PrismaService。
- WorkflowRepository 如何声明/接收 PrismaService。
- PrismaService 在哪个 module/provider 中注册和导出。
- AchievementsModule / WorkflowModule 是否能访问 PrismaService。
- 只基于代码证据，不猜测。

4. 推荐修复目标
- 让 repository 构造函数在 dev runtime 下稳定注入 PrismaService。
- 修复：
  - AchievementRepository.list 中 prisma undefined。
  - WorkflowRepository.findTasksForAssigneeInTransaction 中 prisma undefined。
- 不改变 repository 查询语义。
- 不改变业务权限、policy、workflow 状态机、DTO、schema/migration/seed。

5. 推荐修复方案
- 在受影响 repository 构造函数中使用显式 Inject(...) 注入 PrismaService，或项目现有等价 DI 显式注入方式。
- 如 repository 还有其他 provider 依赖，也建议同 constructor 一并显式注入，避免继续暴露同类 undefined。
- 不手动 new PrismaService。
- 不绕过 repository。
- 不改变 Prisma 查询。
- 不改 module，除非代码证据显示 PrismaService provider/export/import 缺失。

6. 文件影响范围计划
可能修改：
- apps/api/src/achievements/achievement.repository.ts
- apps/api/src/workflow/workflow.repository.ts
- 相关 repository/service 测试文件
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- decisions.md 仅当产生新的关键 DI 决策时
不得修改：
- Prisma schema / migrations / seed
- package.json / lockfile
- 前端文件
- DTO / controller / service 业务语义，除非用户后续另行确认
- 敏感配置

7. 验证计划
后续执行时建议运行，但本轮不运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- 启动后端 dev server
- GET /api/health
- GET /api/achievements?page=1&pageSize=5
- GET /api/workflow/tasks/my?status=PENDING
成功标准：
- 不再因 repository prisma undefined 返回 500。
- 如果出现新的 DI undefined，必须判断是否同类 repository/provider 问题并停下来或在授权范围内修。
- 如果 workflow tasks 返回 200 且 items 为空，记录为本地缺 workflow task 数据风险，不当作修复失败。
- 不运行 migrate/seed，不补数据。

8. 风险与边界
必须列出：
- 显式注入 repository 只应稳定 DI，不改变查询行为。
- 同类 dev runtime DI 问题可能还会继续暴露到其他 provider。
- 修复 API500 后，本地仍没有 workflow task 数据，真实关联成果成功路径可能仍无法完整覆盖。
- 不能通过 seed/migrate/fake data 制造成功路径。
- 不能绕过权限/policy 或把查询默认放行。

9. memory-bank 计划
- 本轮计划确认默认不修改 memory-bank。
- 后续执行完成后更新 progress/evidence，必要时 implementation-plan。
- 如形成“dev runtime 下后端 providers 需显式 Inject”的关键工程决策，可更新 decisions.md。

最后明确输出：
- 本轮只完成 Repository DI 修复计划确认。
- 未修复、未修改文件、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成修复执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Repository DI 修复执行 Prompt。
~~~

Step 14B-API500 Repository DI 修复执行 Prompt

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 Repository DI 修复执行。

定位：
- 这是 Step 14B-API500 第一轮修复 BLOCKED 后的补充修复步骤。
- 目标：修复 repository 层 PrismaService 注入为 undefined 导致的真实业务接口 500。
- 本轮只做最小 Repository DI 修复、回归测试、API smoke 和 memory-bank 记录。
- 不进入 Step 14C / Step 14D / Step 15。
- 不补 workflow 数据，不运行 migrate/seed。

前置事实：
- Step 14B 前端实现：DONE。
- Step 14B-API500 第一轮修复：BLOCKED / not DONE。
- WorkflowService / AchievementService / PolicyQueryFactory 层的依赖 undefined 已被显式 Inject(...) 推进，不再是最新 smoke 的失败点。
- 最新失败点：
  - AchievementRepository.list 中 `this.prisma` 为 undefined。
  - WorkflowRepository.findTasksForAssigneeInTransaction 中 `this.prisma` 为 undefined。
- AchievementRepository 当前构造函数为 `constructor(private readonly prisma: PrismaService) {}`，未显式 Inject。
- WorkflowRepository 当前构造函数为 `constructor(private readonly prisma: PrismaService) {}`，未显式 Inject。
- DatabaseModule provider/export PrismaService。
- AchievementsModule import DatabaseModule，provider 包含 AchievementRepository。
- WorkflowModule import DatabaseModule，provider 包含 WorkflowRepository。
- 当前库中 `workflow_instances = 0`、`workflow_tasks = 0`，所以修复 500 后真实关联成果成功路径可能仍缺数据。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取与 Repository DI 修复直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不改后端业务语义。
- 不绕过 permission / policy。
- 不把权限判断默认放行。
- 不改 workflow 状态机。
- 不改 DTO / repository 查询语义。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不补 workflow 数据。
- 不使用 fake/mock/seed 数据制造成功路径。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/api/src/achievements/achievement.repository.ts
- apps/api/src/workflow/workflow.repository.ts
- apps/api/src/achievements/achievement.repository.spec.ts
- apps/api/src/workflow/workflow.repository.spec.ts
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当形成新的关键 DI 决策时

不得修改：
- Prisma schema / migrations / seed
- package.json / lockfile
- 前端文件
- DTO / controller / service 业务语义
- 敏感配置
- 其他 repository/provider，除非验证显示仍是同一 DI undefined 且你先明确说明为什么仍在授权范围；否则停止并回报

建议先只读：
1. memory-bank/implementation-plan.md 顶部 API500 / Repository DI 记录
2. memory-bank/progress.md 顶部 API500 / Repository DI 记录
3. memory-bank/evidence.md 顶部 API500 / Repository DI 证据
4. apps/api/src/achievements/achievement.repository.ts
5. apps/api/src/workflow/workflow.repository.ts
6. apps/api/src/database/prisma.service.ts
7. apps/api/src/database/database.module.ts
8. apps/api/src/achievements/achievements.module.ts
9. apps/api/src/workflow/workflow.module.ts
10. 相关 repository 测试文件
11. package scripts 中 api test/typecheck/build/dev 相关小段

执行目标：
1. 修复 AchievementRepository 构造依赖注入。
   - 使用 Nest 显式 `@Inject(PrismaService)` 或项目现有等价模式。
   - 不改变任何查询、过滤、include/select、分页或排序逻辑。

2. 修复 WorkflowRepository 构造依赖注入。
   - 使用 Nest 显式 `@Inject(PrismaService)` 或项目现有等价模式。
   - 不改变任何查询、过滤、include/select、事务、状态语义或排序逻辑。

3. 补最小回归测试。
   - 覆盖 repository metadata / DI 显式注入，沿用上一轮 service/policy 测试模式。
   - 如果已有 repository 测试结构，优先小范围追加。
   - 单元测试可使用测试替身，但不得描述成真实后端验收。

4. 不做数据修复。
   - 不补 workflow task。
   - 不 seed。
   - 不 migrate。
   - 不写数据库。

验证要求：
1. 运行：
   - corepack pnpm --filter @research-ip/api test
   - corepack pnpm --filter @research-ip/api typecheck
   - corepack pnpm --filter @research-ip/api build
   - corepack pnpm lint
2. 启动后端 dev server：
   - corepack pnpm --filter @research-ip/api dev
3. 验证本地 API：
   - GET http://127.0.0.1:3000/api/health
   - GET http://127.0.0.1:3000/api/achievements?page=1&pageSize=5
   - GET http://127.0.0.1:3000/api/workflow/tasks/my?status=PENDING
   使用与前次调查一致的科研秘书 demo 用户方式。
4. 成功标准：
   - health 仍为 200 ok。
   - achievements list 不再因 repository prisma undefined 返回 500。
   - workflow tasks 不再因 repository prisma undefined 返回 500。
   - 如果 workflow tasks 返回 200 且 items 为空，记录当前库缺 workflow task 数据，不当作本轮修复失败。
   - 不运行 migrate/seed，不造数据。

如果验证失败：
- 如果仍是 AchievementRepository / WorkflowRepository 的 PrismaService undefined，在本轮范围内修复。
- 如果出现新的 provider undefined：
  - 先判断是否属于本轮两个 repository 内部同 constructor 依赖。
  - 如果超出本轮允许范围，停止并回报，不要继续扩大。
- 如果发现需要改业务语义、schema/migration/seed、package/lockfile，立即停止并报告。
- 不通过时不得声称 DONE。

memory-bank 更新：
修复和验证完成后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如形成关键 DI 工程决策，再更新 memory-bank/decisions.md
记录：
- 修改文件。
- 修复方式。
- 测试/typecheck/build/lint 结果。
- 本地 API smoke 结果。
- 是否仍有 workflow task 数据缺失风险。
- 禁止范围未触碰证据。
- Step 14C / 14D / 15 未开始。

完成后输出：
1. Repository DI 修复是否 DONE。
2. 修改了哪些文件。
3. 修复了什么。
4. 后端测试/typecheck/build/lint 结果。
5. 本地 API smoke 结果。
6. 是否运行 migrate/seed：必须明确说明。
7. 是否修改 schema/package/lockfile：必须明确说明。
8. 是否仍有 workflow task 数据缺失风险。
9. 是否仍阻塞真实关联成果成功路径。
10. Step 14C 是否仍未开始。

最后明确：
- 本轮只执行 Repository DI 修复。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。
~~~

Step 14B-API500 SecretAccessPolicy DI 修复计划确认

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 SecretAccessPolicy DI 修复计划确认。

定位：
- 这是 Repository DI 修复后的补充计划确认。
- Repository DI 修复已在授权范围内 DONE。
- Workflow list API 已从 500 变为 200 `{"items":[]}`。
- Achievement list API 仍为 500。
- 新失败点：`SecretAccessPolicyService.canReadResource` 中 `resourceGrantPolicy` 为 undefined。
- 本轮只做 SecretAccessPolicy 相关 DI 修复计划确认，不修复代码、不修改文件、不运行 migrate/seed、不进入 Step 14C / Step 14D / Step 15。

已知事实：
- Step 14B 前端：DONE。
- Service/PolicyFactory DI 修复：DONE。
- Repository DI 修复：DONE。
- `GET /api/health`: 200 ok。
- `GET /api/workflow/tasks/my?status=PENDING`: 200 `{"items":[]}`。
- `GET /api/achievements?page=1&pageSize=5`: 仍 500。
- 新的 achievements list 500 出现在 `SecretAccessPolicyService.canReadResource`。
- 直接原因：`resourceGrantPolicy` 为 undefined。
- 这是同类 dev runtime DI 问题，但超出上一轮 repository-only 授权范围。
- 本地仍无 workflow task 数据，因此即使修好 achievement list，真实审批任务 -> 关联成果详情成功路径仍可能缺数据。
- 未运行 migrate/seed，未补 workflow 数据，未读取 .env 或展示凭证。

本轮禁止：
- 不修复代码。
- 不修改任何文件。
- 不运行 test / build / lint / typecheck。
- 不运行 migrate / seed。
- 不改后端业务语义。
- 不绕过 permission / policy / secret access policy。
- 不把权限判断默认放行。
- 不改 workflow 状态机。
- 不改 DTO / repository 查询语义。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不补 workflow 数据。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock/seed 数据制造成功路径。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成修复执行 Prompt；后续 Prompt 由 Prompt 编排对话单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 SecretAccessPolicy DI 修复计划直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部最新 API500 / Repository DI 记录
2. memory-bank/progress.md 顶部最新 API500 / Repository DI 记录
3. memory-bank/evidence.md 顶部最新 API500 / Repository DI 证据
4. apps/api/src/authorization/secret-access-policy.service.ts 或实际文件路径
5. ResourceGrantPolicy 所在文件
6. authorization module / achievements module 中 provider 注册相关小段
7. 相关 policy/service 测试文件
8. package scripts 中 API 门禁命令小段

本轮输出要求：

1. 当前状态确认
- Step 14B 前端是否 DONE。
- Service/PolicyFactory DI 修复是否 DONE。
- Repository DI 修复是否 DONE。
- Workflow list API 是否已恢复到 200 空列表。
- Achievement list API 是否仍 500。
- 新失败点是否为 `SecretAccessPolicyService.canReadResource` 的 `resourceGrantPolicy` undefined。
- Step 14C 是否未开始。

2. 根因范围确认
- 说明为什么现在需要扩大到 SecretAccessPolicyService / ResourceGrantPolicy DI。
- 明确这不是 achievement list 查询语义问题，不是 schema/migration/seed 问题。
- 明确当前允许范围不足以继续修复，因此需要用户确认。

3. 代码结构确认
- SecretAccessPolicyService 如何声明/接收 ResourceGrantPolicy。
- ResourceGrantPolicy 是否为 injectable provider。
- ResourceGrantPolicy 在哪个 module 中 provider/export。
- SecretAccessPolicyService 所在 module 是否能访问该 provider。
- 是否存在同 constructor 其他 provider 依赖也可能受 metadata 影响。
- 只基于代码证据，不猜测。

4. 推荐修复目标
- 让 SecretAccessPolicyService 在 dev runtime 下稳定注入 ResourceGrantPolicy。
- 修复 achievement list 因 `resourceGrantPolicy` undefined 返回 500。
- 不改变 secret access、resource grant、脱敏、权限判断语义。
- 不改变 achievement list DTO、repository 查询、policy where、Prisma schema/migration/seed。

5. 推荐修复方案
- 在 SecretAccessPolicyService 构造函数中使用显式 `@Inject(ResourceGrantPolicy)` 或项目现有等价方式。
- 如果同 constructor 还有其他 provider 依赖，也建议一并显式注入，避免继续出现同类 undefined。
- 不手动 new ResourceGrantPolicy。
- 不绕过 SecretAccessPolicyService。
- 不把 secret access 默认放行。
- 不改变 canReadResource 逻辑。
- 不改 module，除非代码证据显示 provider/export/import 缺失。

6. 文件影响范围计划
可能修改：
- apps/api/src/authorization/secret-access-policy.service.ts 或实际路径
- ResourceGrantPolicy 相关测试文件或 policy service 测试文件
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- decisions.md 仅当形成新的关键 DI 决策
不得修改：
- Prisma schema / migrations / seed
- package.json / lockfile
- 前端文件
- achievement DTO / repository 查询语义
- workflow 状态机
- 敏感配置

7. 验证计划
后续执行时建议运行，本轮不运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- 启动 corepack pnpm --filter @research-ip/api dev
- API smoke:
  - GET /api/health
  - GET /api/achievements?page=1&pageSize=5
  - GET /api/workflow/tasks/my?status=PENDING
成功标准：
- health 仍 200。
- workflow tasks 仍 200，允许 items 为空。
- achievements list 不再因 `resourceGrantPolicy` undefined 返回 500。
- 如果 achievement list 返回 200，记录即可。
- 如果出现新的 provider undefined，判断是否仍是同 constructor / 同 policy DI 范围；超出则停止并回报。
- 不运行 migrate/seed，不补数据。

8. 风险与边界
必须列出：
- 显式注入只应稳定 DI，不改变 secret access 语义。
- 同类 dev runtime DI 问题可能继续暴露到其他 authorization provider。
- 修复 achievement list 后，本地 workflow tasks 仍为空，真实关联成果成功路径仍可能无法完整覆盖。
- 不能通过 seed/migrate/fake data 制造成功路径。
- 不能绕过权限、脱敏或 resource grant policy。

9. memory-bank 计划
- 本轮计划确认默认不修改 memory-bank。
- 后续执行完成后更新 progress/evidence，必要时 implementation-plan。
- 如形成“dev runtime 下 authorization providers 需显式 Inject”的关键工程决策，可更新 decisions.md。

最后明确输出：
- 本轮只完成 SecretAccessPolicy DI 修复计划确认。
- 未修复、未修改文件、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成修复执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 SecretAccessPolicy DI 修复执行 Prompt。
~~~

Step 14B-API500 SecretAccessPolicy DI 修复执行 Prompt

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-API500 SecretAccessPolicy DI 修复执行。

定位：
- 这是 Repository DI 修复后的补充修复步骤。
- 目标：修复 `SecretAccessPolicyService.canReadResource` 中 `resourceGrantPolicy` 为 undefined 导致 achievement list 仍返回 500。
- 本轮只做最小 SecretAccessPolicy DI 修复、回归测试、API smoke 和 memory-bank 记录。
- 不进入 Step 14C / Step 14D / Step 15。
- 不补 workflow 数据，不运行 migrate/seed。

前置事实：
- Step 14B 前端：DONE。
- Service / PolicyFactory DI 修复：DONE。
- Repository DI 修复：DONE。
- Workflow list API 已恢复到 HTTP 200，返回 `{"items":[]}`。
- Achievement list API 仍为 HTTP 500。
- 新失败点：`SecretAccessPolicyService.canReadResource` 中 `resourceGrantPolicy` 为 undefined。
- `SecretAccessPolicyService` 位于 `apps/api/src/authorization/policy/secret-access-policy.service.ts`。
- 当前构造函数为 `constructor(private readonly resourceGrantPolicy: ResourceGrantPolicyService) {}`，未显式 `@Inject(...)`。
- `ResourceGrantPolicyService` 有 `@Injectable()`。
- `AuthorizationModule` provider/export 了 `ResourceGrantPolicyService` 和 `SecretAccessPolicyService`。
- 本地 workflow tasks 仍为空，所以即使 achievement list 修复，真实关联成果成功路径可能仍缺 workflow task 数据。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取与 SecretAccessPolicy DI 修复直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不改后端业务语义。
- 不绕过 permission / policy / secret access policy。
- 不把权限判断默认放行。
- 不改脱敏、密级、resource grant 判断语义。
- 不改 workflow 状态机。
- 不改 DTO / repository 查询语义。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不补 workflow 数据。
- 不使用 fake/mock/seed 数据制造成功路径。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/api/src/authorization/policy/secret-access-policy.service.ts
- apps/api/src/authorization/policy/sensitive-policy-services.spec.ts
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当形成新的关键 DI 决策时

不得修改：
- Prisma schema / migrations / seed
- package.json / lockfile
- 前端文件
- achievement DTO / repository 查询语义
- workflow 状态机
- 敏感配置
- 其他 provider/service，除非验证显示仍是同 constructor / 同 policy DI 范围；否则停止并回报

建议先只读：
1. memory-bank/implementation-plan.md 顶部最新 API500 记录
2. memory-bank/progress.md 顶部最新 API500 记录
3. memory-bank/evidence.md 顶部最新 API500 证据
4. apps/api/src/authorization/policy/secret-access-policy.service.ts
5. apps/api/src/authorization/policy/resource-grant-policy.service.ts
6. apps/api/src/authorization/authorization.module.ts
7. apps/api/src/authorization/policy/sensitive-policy-services.spec.ts
8. package scripts 中 api test/typecheck/build/dev 相关小段

执行目标：
1. 修复 SecretAccessPolicyService 构造依赖注入。
   - 使用 Nest 显式 `@Inject(ResourceGrantPolicyService)` 或项目现有等价模式。
   - 不改变 `canReadResource` 逻辑。
   - 不改变 secret access、resource grant、脱敏、密级、权限判断语义。

2. 补最小回归测试。
   - 在相关 policy 测试文件中增加 metadata / DI 显式注入断言。
   - 单元测试可使用测试替身，但不得描述成真实后端验收。

3. 不做数据修复。
   - 不补 workflow task。
   - 不 seed。
   - 不 migrate。
   - 不写数据库。

验证要求：
1. 运行：
   - corepack pnpm --filter @research-ip/api test
   - corepack pnpm --filter @research-ip/api typecheck
   - corepack pnpm --filter @research-ip/api build
   - corepack pnpm lint
2. 启动后端 dev server：
   - corepack pnpm --filter @research-ip/api dev
3. 验证本地 API：
   - GET http://127.0.0.1:3000/api/health
   - GET http://127.0.0.1:3000/api/achievements?page=1&pageSize=5
   - GET http://127.0.0.1:3000/api/workflow/tasks/my?status=PENDING
   使用与前次调查一致的科研秘书 demo 用户方式。
4. 成功标准：
   - health 仍为 200 ok。
   - workflow tasks 仍为 200，允许 `items` 为空。
   - achievements list 不再因 `resourceGrantPolicy` undefined 返回 500。
   - 如果 achievement list 返回 200，记录即可。
   - 不运行 migrate/seed，不造数据。

如果验证失败：
- 如果仍是 SecretAccessPolicyService 同 constructor 的 `ResourceGrantPolicyService` undefined，在本轮范围内修复。
- 如果出现新的 provider undefined：
  - 判断是否仍属于同 constructor / 同 policy DI 范围。
  - 如果超出本轮允许范围，停止并回报，不要继续扩大。
- 如果发现需要改业务语义、schema/migration/seed、package/lockfile，立即停止并报告。
- 不通过时不得声称 DONE。

memory-bank 更新：
修复和验证完成后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如形成关键 DI 工程决策，再更新 memory-bank/decisions.md
记录：
- 修改文件。
- 修复方式。
- 测试/typecheck/build/lint 结果。
- 本地 API smoke 结果。
- 是否仍有 workflow task 数据缺失风险。
- 禁止范围未触碰证据。
- Step 14C / 14D / 15 未开始。

完成后输出：
1. SecretAccessPolicy DI 修复是否 DONE。
2. 修改了哪些文件。
3. 修复了什么。
4. 后端测试/typecheck/build/lint 结果。
5. 本地 API smoke 结果。
6. 是否运行 migrate/seed：必须明确说明。
7. 是否修改 schema/package/lockfile：必须明确说明。
8. 是否仍有 workflow task 数据缺失风险。
9. 是否仍阻塞真实关联成果成功路径。
10. Step 14C 是否仍未开始。

最后明确：
- 本轮只执行 SecretAccessPolicy DI 修复。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成下一步 Prompt。
~~~

 **Step 14B-DataGap 计划确认 Prompt**

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14B-DataGap 计划确认。

定位：
- 这是 Step 14B / API500 修复完成后的真实成功路径验收缺口处理计划。
- API500 DI blocker 已清除：
  - GET /api/health: 200
  - GET /api/achievements?page=1&pageSize=5: 200
  - GET /api/workflow/tasks/my?status=PENDING: 200 {"items":[]}
- 当前剩余问题不是 500，而是本地 workflow task 数据缺失。
- 本轮只确认如何处理“真实审批任务 -> 关联成果详情”成功路径缺口。
- 不创建数据、不导入数据、不运行 seed/migrate、不修改代码、不进入 Step 14C / Step 14D / Step 15。

已知事实：
- Step 14B 前端实现 DONE。
- Service / PolicyFactory DI 修复 DONE。
- Repository DI 修复 DONE。
- SecretAccessPolicy DI 修复 DONE。
- API test/typecheck/build/lint 均通过。
- Achievement list 已恢复 200。
- Workflow tasks endpoint 已恢复 200，但返回 empty items。
- 当前数据库 workflow_instances = 0，workflow_tasks = 0。
- 因没有真实 workflow task，无法打开真实审批任务，也无法点击“查看关联成果”完成真实成功路径验收。
- 未运行 migrate/seed，未补 workflow 数据，未使用 fake/mock/seed 数据制造成功路径。

本轮禁止：
- 不创建、不导入、不修改任何业务数据。
- 不运行 migrate / seed。
- 不执行 INSERT / UPDATE / DELETE / TRUNCATE / DROP。
- 不修改代码。
- 不修改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock/seed 数据冒充真实成功路径。
- 不进入 Step 14C / Step 14D / Step 15。
- 不生成执行 Prompt；后续 Prompt 由 Prompt 编排对话单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 DataGap 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部最新 Step 14B / API500 / SecretAccessPolicy DI 修复记录
2. memory-bank/progress.md 顶部最新 Step 14B / API500 / SecretAccessPolicy DI 修复记录
3. memory-bank/evidence.md 顶部最新 Step 14B / API500 / SecretAccessPolicy DI 修复证据
4. memory-bank/decisions.md 顶部 D065
5. 只读 workflow 相关创建/状态流转代码小段，用于判断是否已有安全的真实业务路径可产生 workflow task
6. 只读 seed / fixtures / scripts 的索引或文件名可以，但不要运行，不要全量读取大文件
7. 只读 README / memory-bank 中关于 demo 数据或验收数据的小段

本轮输出要求：

1. 当前状态确认
- Step 14B 是否 DONE。
- API500 是否已清除。
- Workflow endpoint 是否 200 empty items。
- Achievement endpoint 是否 200。
- Step 14C 是否未开始。

2. DataGap 定义
- 明确现在缺口是什么：
  - 缺真实 workflow task 数据。
  - 不是 API500。
  - 不是前端 Step 14B 实现失败。
- 明确缺口影响：
  - 不能打开真实审批任务。
  - 不能在真实任务详情里点击“查看关联成果”。
  - 不能完整覆盖真实成功路径。

3. 可选处理路线
至少列出以下路线，并说明风险：
A. 接受为非阻塞风险
- 条件：API 已恢复，代码门禁通过，前端逻辑和只读详情基础已有测试覆盖。
- 后续在 Step 14D 归档真实成功路径未覆盖原因。
- 风险：缺少 end-to-end 成功路径证据。

B. 使用已有真实业务流程自然产生 workflow task
- 只读调查是否已有“提交成果 -> 触发 workflow task”的真实流程。
- 如果存在，后续可生成单独验收执行 Prompt，通过 UI/API 正常业务动作产生数据。
- 风险：可能涉及业务状态变更，需要用户确认。

C. 用户提供已有真实 workflow task / achievement 数据
- 用户指定现有 task 或环境。
- 后续只做只读验收。
- 风险较低，但依赖用户数据。

D. 允许专门的数据 setup
- 例如 seed、脚本、手工 SQL 或测试夹具。
- 必须明确这是高风险/需确认路径。
- 当前不得执行。
- 如果涉及 migrate/seed/INSERT/UPDATE，需要用户单独明确确认。
- 风险：污染本地数据、改变验收环境、可能越界。

4. 推荐路线
- 给出推荐。
- 默认建议优先 B 或 C；如果用户不愿改数据，则 A。
- 不建议 D，除非用户明确接受数据 setup 风险。

5. 判断是否进入 Step 14C
- 如果选择 A：是否可以进入 Step 14C，但必须把真实成功路径缺口带到 Step 14D。
- 如果选择 B/C/D：应先生成单独 DataGap 验收执行 Prompt，不能直接进入 Step 14C。
- 明确不能把未覆盖真实成功路径说成已覆盖。

6. 任务等级判断
- 本轮计划确认：XS / S。
- 如果后续选择真实业务流程验收：S / M。
- 如果后续选择 seed/数据 setup：至少 M，涉及数据写入时需用户明确确认，可能升级 L。

7. 质量门禁 / 验收计划
- 不运行门禁。
- 后续若执行 DataGap 验收，应覆盖：
  - workflow tasks 非空。
  - 打开真实任务详情。
  - 点击查看关联成果。
  - achievement detail 真实返回。
  - 审批上下文无 submit / void / archive。
  - 权限/脱敏以后端返回为准。
- 如仍无数据，记录未覆盖原因。

8. memory-bank 计划
- 本轮计划确认默认不修改 memory-bank。
- 后续选择后应更新 progress/evidence，必要时 implementation-plan。
- 如用户决定接受非阻塞风险或允许数据 setup，应记录决策到 decisions.md。

9. 待用户确认问题
必须明确询问：
- 选择 A / B / C / D 哪条路线？
- 是否允许产生或修改业务数据？
- 是否允许 seed/migrate/脚本/SQL？默认不允许。
- 是否接受真实成功路径未覆盖作为非阻塞风险进入 Step 14C？

最后明确输出：
- 本轮只完成 Step 14B-DataGap 计划确认。
- 未创建/导入/修改数据。
- 未运行 migrate/seed。
- 未修改代码。
- 未进入 Step 14C / Step 14D / Step 15。
- 不生成执行 Prompt。
- 下一步必须等用户选择路线后，由 Prompt 编排对话生成对应单步 Prompt。
~~~

这个API500是什么错误，是因为什么引起的这个错误，然后这个错误是怎么解决的，这个API的内容之前设计/做的时候没有在验证环节的时候没有发现吗，请你根据之前的记录文档等上下文帮我看一下这个API是哪个STEP的内容，然后类似的错误是否还有，检查一下





## Step 14C

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14C 计划确认。

定位：
- 当前回到 Step 14 主线。
- Step 14 方向：审批任务联动成果详情。
- Step 14A：DONE，已归档方向、范围、拆分、边界和 D065。
- Step 14B：DONE，已实现审批任务详情中的关联成果只读查看基础。
- Step 14B-API500 DI 修复链路：DONE，真实 API 500 已清除。
- 当前剩余验收缺口：本地 workflow tasks 为空，真实“审批任务详情 -> 查看关联成果详情”成功路径暂未覆盖。
- 用户已说明：完整验收可以在一期整体测试流程中完善；当前继续 Step 14 主线。
- 本轮只做 Step 14C 计划确认，不执行实现。

Step 14C 预期主题：
- 状态、错误、权限、无关联成果、后端不可用、移动端体验补齐。
- 目标是在 Step 14B 基础上补齐用户体验和边界状态，而不是新增业务能力。

本轮禁止：
- 不实现功能。
- 不修改任何文件。
- 不运行 test / build / lint / typecheck。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不进入 Step 14D / Step 14E / Step 15。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不使用 fake/mock/seed 数据冒充真实成功路径。
- 不生成 Step 14C 执行 Prompt；执行 Prompt 由 Prompt 编排对话后续单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 14C 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部 Step 14A / 14B / API500 / DataGap 最新记录
2. memory-bank/progress.md 顶部 Step 14A / 14B / API500 / DataGap 最新记录
3. memory-bank/evidence.md 顶部 Step 14B / API500 最新证据
4. memory-bank/decisions.md 顶部 D065
5. apps/web/src/WorkflowTasks.tsx
6. apps/web/src/workflow-tasks.ts
7. apps/web/src/AchievementDetail.tsx
8. apps/web/src/WorkflowTasks.test.ts
9. apps/web/src/AchievementDetail.test.ts
10. apps/web/src/App.css 相关 workflow / drawer / responsive 小段
11. 必要时只读 API smoke 记录，不启动后端

本轮需要输出：

1. 当前状态确认
- Step 14A 是否 DONE。
- Step 14B 是否 DONE。
- API500 是否已清除。
- DataGap 是否仍存在。
- Step 14C 是否尚未开始。
- Step 14E 是否只作为 Step 14 完成后的后续质量步骤，不在本轮进入。

2. Step 14C 现有体验盘点
基于代码证据说明当前已有：
- 审批待办列表状态。
- 任务详情加载 / 错误 / 重试状态。
- 关联成果入口显示条件。
- ReadonlyAchievementDetail 的 loading / error / empty / retry 状态。
- 非 ACHIEVEMENT / 缺 targetId 当前如何表现。
- 移动端或窄屏当前样式基础。
只基于代码，不猜测。

3. Step 14C 推荐目标
目标应聚焦体验补齐：
- 明确非 ACHIEVEMENT 任务的边界提示或无入口行为。
- 明确 ACHIEVEMENT 但缺 targetId 的边界提示或无入口行为。
- 明确关联成果详情 403 / 404 / 500 / network error 的用户提示。
- 明确后端可用但 workflow tasks 为空的空状态。
- 明确后端不可用时不显示假数据。
- 明确移动端 390px 无横向溢出。
- 明确审批上下文仍不显示成果 submit / void / archive。

4. Step 14C 非目标
必须包括：
- 不创建 workflow task 数据。
- 不运行 seed/migrate。
- 不做真实成功路径数据 setup。
- 不做 Step 14D 最终审计。
- 不做 Step 14E Backend DI audit。
- 不做审批历史 full page、audit-log 页面、附件、费用、搜索/看板、批量审批、自定义流程设计器。
- 不改后端业务语义、workflow 状态机、Prisma schema/migration/seed、依赖、package/lockfile。

5. 任务等级判断
- 判断 Step 14C 是 S / M。
- 说明依据：前端状态/错误/响应式补齐、测试和浏览器验收；不涉及后端/schema/数据 setup。

6. 文件影响范围计划
列出可能修改：
- apps/web/src/WorkflowTasks.tsx
- apps/web/src/workflow-tasks.ts
- apps/web/src/AchievementDetail.tsx
- apps/web/src/WorkflowTasks.test.ts
- apps/web/src/AchievementDetail.test.ts
- apps/web/src/App.css
- memory-bank/progress.md、evidence.md、必要时 implementation-plan.md
明确不得修改：
- 后端业务代码
- prisma/
- packages/
- scripts/
- package.json / lockfile
- 敏感配置

7. 验证计划
后续执行时建议运行，但本轮不运行：
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web typecheck
- corepack pnpm --filter @research-ip/web build
- corepack pnpm lint，如范围扩大或样式/全局代码影响较广
- 浏览器验收：
  - 无用户状态不发业务请求。
  - workflow tasks 为空显示空状态。
  - 后端不可用显示错误，不显示假数据。
  - 非 ACHIEVEMENT / 缺 targetId 边界状态清晰。
  - 关联成果详情错误态可重试。
  - 审批上下文不显示成果 submit / void / archive。
  - 390px 移动端无横向溢出。
- 如无真实 workflow task 数据，真实成功路径仍记录为 DataGap，不能声称已覆盖。

8. memory-bank 更新计划
- 本轮计划确认默认不修改 memory-bank。
- Step 14C 执行后更新 progress/evidence。
- 必要时更新 implementation-plan。
- 如产生关键边界决策，再更新 decisions.md。

9. 风险与待确认点
必须列出：
- DataGap 仍存在，真实成功路径要到一期整体验收或用户确认数据路线后补。
- 状态补齐不能掩盖真实成功路径未覆盖。
- 错误提示不能泄露敏感后端信息。
- 移动端样式不能引入全局布局回归。
- Step 14E Backend DI audit 只是后续质量步骤，不属于 Step 14C。

最后明确输出：
- 本轮只完成 Step 14C 计划确认。
- 未实现、未修改文件、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- 未进入 Step 14D / Step 14E / Step 15。
- 不生成 Step 14C 执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Step 14C 执行 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14C。

定位：
- 当前回到 Step 14 主线。
- Step 14 方向：审批任务联动成果详情。
- Step 14A：DONE。
- Step 14B：DONE。
- API500 DI 修复链路：DONE，health / achievements list / workflow tasks 均已恢复 200。
- DataGap：仍存在。workflow tasks 当前为 200 但 items: []，真实“审批任务详情 -> 查看关联成果详情”成功路径暂未覆盖。
- 本轮执行 Step 14C：状态、错误、权限、无关联成果、后端不可用、移动端体验补齐。
- 不进入 Step 14D / Step 14E / Step 15。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取和 Step 14C 直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不创建、不导入、不修改业务数据。
- 不运行 migrate / seed。
- 不执行 INSERT / UPDATE / DELETE / TRUNCATE / DROP。
- 不补 workflow task 数据。
- 不使用 fake/mock/seed 数据冒充真实成功路径。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不做 Step 14D 最终审计归档。
- 不做 Step 14E Backend DI audit。
- 不进入 Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/web/src/WorkflowTasks.tsx
- apps/web/src/workflow-tasks.ts
- apps/web/src/AchievementDetail.tsx
- apps/web/src/WorkflowTasks.test.ts
- apps/web/src/AchievementDetail.test.ts
- apps/web/src/App.css
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当产生新的关键边界决策时

不得修改：
- 后端业务代码
- prisma/
- packages/
- scripts/
- package.json / lockfile
- 敏感配置文件

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14A / 14B / API500 / DataGap / Step 14C 计划记录
2. memory-bank/progress.md 顶部 Step 14A / 14B / API500 / DataGap / Step 14C 计划记录
3. memory-bank/evidence.md 顶部 Step 14B / API500 最新证据
4. memory-bank/decisions.md 顶部 D065
5. apps/web/src/WorkflowTasks.tsx
6. apps/web/src/workflow-tasks.ts
7. apps/web/src/AchievementDetail.tsx
8. apps/web/src/WorkflowTasks.test.ts
9. apps/web/src/AchievementDetail.test.ts
10. apps/web/src/components/StateBlocks.tsx
11. apps/web/src/App.css 中 workflow / drawer / responsive 小段

执行目标：
1. 补任务详情内关联成果边界体验。
   - 非 ACHIEVEMENT 任务：无关联成果入口时，边界说明要清晰。
   - ACHIEVEMENT 但缺 targetId：明确无法查看关联成果的原因。
   - 不能显示假入口，不能构造假 targetId。

2. 补只读关联成果详情错误体验。
   - 403 / 404 / 500 / network error 应显示清晰、脱敏、可重试的错误状态。
   - 不显示后端堆栈、内部实现、连接信息或敏感内容。
   - 保持权限、脱敏、返回字段完全以后端响应为准。

3. 保持后端不可用和空列表体验清晰。
   - workflow tasks 为空时显示明确空状态。
   - 后端不可用时显示错误态，不显示假数据。
   - 无 demo user 状态继续不发业务请求。

4. 补移动端 / 窄屏体验。
   - 重点检查 390px 宽度。
   - drawer、table、Descriptions、Alert、action 区不应横向溢出或挤压错位。
   - CSS 修改必须小范围，避免全局布局回归。

5. 保持审批上下文只读。
   - 不显示成果 submit / void / archive。
   - 不调用 submit / void / archive。
   - 不改变现有成果管理页动作能力。

6. 不解决 DataGap。
   - 不创建 workflow task。
   - 不 seed/migrate。
   - 不声称真实成功路径已覆盖。
   - memory-bank 中继续记录真实成功路径需在一期整体验收或用户确认数据路线后补。

测试要求：
- 增加或更新测试，至少覆盖：
  - 非 ACHIEVEMENT 任务的边界状态。
  - ACHIEVEMENT 但缺 targetId 的边界状态。
  - ACHIEVEMENT + targetId 时仍显示关联成果入口。
  - 只读成果详情错误/空态 helper 或组件行为。
  - 审批上下文仍不包含 submit / void / archive。
  - 现有成果管理页行为不回退。
- 单元/组件测试可以用测试夹具模拟接口响应，但不得描述为真实成功路径验收。

验证要求：
1. 运行：
   - corepack pnpm --filter @research-ip/web test
   - corepack pnpm --filter @research-ip/web typecheck
   - corepack pnpm --filter @research-ip/web build
2. 如范围扩大或 lint 适用，运行：
   - corepack pnpm lint
3. 浏览器验收：
   - 使用现有或启动前端 dev server。
   - 无用户状态不发业务请求。
   - workflow tasks 为空显示空状态。
   - 后端不可用显示错误，不显示假数据。
   - 审批上下文不显示 submit / void / archive。
   - 390px 移动端无横向溢出。
   - 如没有真实 workflow task 数据，不要求真实成功路径；必须记录 DataGap。
4. 不启动或修改后端，除非只是确认已有 API 可用且不需要数据写入；不得 seed/migrate。

如果验证失败：
- 在 Step 14C 前端范围内修复。
- 重新运行失败门禁。
- 如果发现需要后端、schema、seed、数据 setup、package/lockfile 改动，立即停止并报告，不得擅自扩大。

memory-bank 更新：
完成实现和验证后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- decisions.md 仅当产生新的关键边界决策时
记录：
- 实际修改文件。
- 实现内容。
- 测试/typecheck/build/lint 结果。
- 浏览器验收结果或未覆盖原因。
- DataGap 是否仍存在。
- 禁止范围未触碰证据。
- Step 14D / Step 14E / Step 15 未开始。

完成后输出：
1. Step 14C 是否 DONE。
2. 修改了哪些文件。
3. 实现了什么。
4. 测试/typecheck/build/lint 结果。
5. 浏览器验收结果。
6. DataGap 是否仍存在。
7. 是否运行 migrate/seed：必须明确说明。
8. 是否修改后端/schema/package/lockfile：必须明确说明。
9. Step 14D / Step 14E / Step 15 是否仍未开始。

最后明确：
- 本轮只执行 Step 14C。
- 未进入 Step 14D / Step 14E / Step 15。
- 不生成下一步 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14C-Browser-Recheck。

定位：
- 这是 Step 14C 完成后的浏览器验收复查。
- Step 14C 实现和代码门禁已完成。
- 本轮只做真实浏览器验收复查。
- 默认要检查并启动后端 dev server，因为本项目浏览器验收依赖真实 API。
- 不修改代码，除非发现明确前端问题后先停止并汇报。
- 不进入 Step 14D / Step 14E / Step 15。

前置状态：
- Step 14A：DONE。
- Step 14B：DONE。
- API500 DI 修复链路：DONE。
- Step 14C：实现和代码门禁已完成。
- DataGap：仍存在。真实本地 workflow tasks 为空，因此真实“审批任务详情 -> 查看关联成果详情”成功路径仍不能声称覆盖。
- 上一轮 Step 14C 浏览器验收使用了前端网络桩，因此只能算 UI 状态验证，不能算真实 API 验收。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取 Step 14C-Browser-Recheck 直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不修改代码。
- 不创建、不导入、不修改业务数据。
- 不运行 migrate / seed。
- 不执行 INSERT / UPDATE / DELETE / TRUNCATE / DROP。
- 不补 workflow task 数据。
- 不使用 fake/mock/seed 数据冒充真实成功路径。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14D / Step 14E / Step 15。
- 不生成下一步 Prompt。

允许：
- 检查前端 dev server 是否运行。
- 如果前端 dev server 未运行，使用项目已有脚本启动。
- 检查后端 dev server 是否运行。
- 如果后端 dev server 未运行，使用项目已有脚本启动：
  corepack pnpm --filter @research-ip/api dev
- 启动服务前可检查端口占用。
- 启动后端时不得读取或打印 .env 内容；如果启动需要 migrate/seed/写库，立即停止并请求用户确认。
- 只停止本轮启动的明确进程，不批量杀进程。
- 使用真实本地 API 做浏览器验收。
- 使用浏览器网络监听确认请求是否发生。
- 可以做只读 API smoke：
  - GET /api/health
  - GET /api/achievements?page=1&pageSize=5
  - GET /api/workflow/tasks/my?status=PENDING
  不输出敏感 header 或凭证。

建议先只读：
1. memory-bank/progress.md 顶部 Step 14C 记录
2. memory-bank/evidence.md 顶部 Step 14C 证据
3. memory-bank/implementation-plan.md 顶部 Step 14C 记录
4. apps/web/package.json 或根 package scripts 中前端 dev 命令小段
5. apps/api/package.json 中后端 dev 命令小段
6. 必要时只读 WorkflowTasks / AchievementDetail 相关小段确认页面入口和文案

验收步骤：

1. 服务准备
- 检查 5173 前端端口。
- 检查 3000 后端端口。
- 如后端未运行，启动后端 dev server。
- 如前端未运行，启动前端 dev server。
- 确认：
  - GET /api/health 返回 200。
  - GET /api/achievements?page=1&pageSize=5 返回 200。
  - GET /api/workflow/tasks/my?status=PENDING 返回 200，允许 items 为空。
- 不运行 migrate/seed。

2. 无用户状态验收
- 清除或切换到无 demo user 状态。
- 打开审批管理页面。
- 使用浏览器网络监听明确确认未请求：
  - /api/workflow/tasks/my
  - /api/workflow/tasks/:id
  - /api/achievements/:id
- 页面应显示无用户边界状态。
- 不能只写“未记录请求”，要明确写“监听期间未观察到这些业务请求”。

3. 真实后端空列表验收
- 切换到科研秘书 demo 用户。
- 打开审批管理页面。
- 确认实际请求：
  - /api/workflow/tasks/my?status=PENDING
- 确认返回 200 且 items 为空。
- 页面显示空状态，不显示假表格/假任务。
- 明确记录这是 DataGap，不是 API500。

4. 后端不可用验收
- 如果本轮启动了后端，可以临时停止本轮启动的后端进程，再刷新审批管理页面。
- 确认页面显示错误态。
- 确认不显示假数据。
- 完成后如需要恢复状态，可不重启后端，或记录后端已停止。
- 不停止不是本轮启动的后端进程。

5. 审批上下文动作边界
- 在当前无真实 workflow task 的条件下，不能打开真实任务详情。
- 因此只能验收页面当前状态下不出现成果 submit / void / archive 动作。
- 不得声称任务详情中的真实动作边界已完整验收。
- 如果使用前端网络桩或测试夹具验证 UI，不得记录为真实 API 验收。

6. 390px 移动端验收
- 设置 viewport 宽度 390px。
- 检查审批管理页面：
  - document 级无横向溢出。
  - 空状态 / 错误状态 / 无用户状态不挤压错位。
  - 可见区域无明显重叠。
- 若没有真实任务，不要求任务详情成功路径移动端验收；记录 DataGap。

memory-bank 更新：
验收完成后允许更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
记录：
- 启动了哪些服务和命令。
- 哪些端口已有服务，哪些是本轮启动。
- API smoke 结果。
- 浏览器网络监听结论。
- 哪些路径真实覆盖。
- 哪些路径因 DataGap 未覆盖。
- 是否停止了本轮启动的服务。
- Step 14D / Step 14E / Step 15 未开始。

完成后输出：
1. Step 14C-Browser-Recheck 结果：PASS / PARTIAL / BLOCKED。
2. 后端是否启动；如启动，命令是什么。
3. 前端是否启动；如启动，命令是什么。
4. API smoke 结果。
5. 无用户状态是否明确未发业务请求。
6. 真实后端空列表是否覆盖。
7. 后端不可用错误态是否覆盖。
8. 390px 移动端是否覆盖。
9. 哪些验收仍受 DataGap 限制。
10. 是否运行 migrate/seed：必须明确说明。
11. 是否修改代码/后端/schema/package/lockfile：必须明确说明。
12. 更新了哪些 memory-bank 文件。
13. Step 14D / Step 14E / Step 15 是否仍未开始。

最后明确：
- 本轮只执行 Step 14C-Browser-Recheck。
- 未进入 Step 14D / Step 14E / Step 15。
- 不生成下一步 Prompt。
~~~

## Step 14D

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14D 计划确认。

定位：
- 当前进入 Step 14 主线最终审计计划确认。
- Step 14 方向：审批任务联动成果详情。
- Step 14A：DONE，完成范围、契约、拆分、边界和 D065 归档。
- Step 14B：DONE，实现审批任务详情中关联成果只读查看基础。
- Step 14B-API500 DI 修复链路：DONE，真实后端 API500 已清除。
- Step 14C：DONE，完成状态、错误、空态、边界和移动端体验补齐。
- Step 14C-Browser-Recheck：PASS / PARTIAL。
  - PASS：真实 API no-user、真实后端空列表、后端不可用错误态、390px 移动端无横向溢出。
  - PARTIAL：DataGap 仍存在，真实 workflow tasks 为空，不能覆盖“任务详情 -> 查看关联成果详情”真实成功路径。
- Step 14D 目标：最终审计、质量门禁、浏览器验收证据归档、DataGap 风险归档。
- 本轮只做 Step 14D 计划确认，不执行审计、不修改文件、不运行门禁。

重要后续：
- Step 14E Backend DI Explicit Inject Audit 是 Step 14 完成后的后续质量步骤候选。
- Step 14D 不执行 Step 14E，不扩大到 Backend DI audit。
- Step 14D 完成后才考虑 Step 14E 计划确认，不能直接进入 Step 15。

本轮禁止：
- 不执行审计。
- 不修改任何文件。
- 不运行 test / build / lint / typecheck。
- 不启动前端或后端。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不进入 Step 14E / Step 15。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不生成 Step 14D 执行 Prompt；执行 Prompt 由 Prompt 编排对话后续单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 14D 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部 Step 14A / 14B / API500 / DataGap / 14C / Browser-Recheck 最新记录
2. memory-bank/progress.md 顶部 Step 14A / 14B / API500 / DataGap / 14C / Browser-Recheck 最新记录
3. memory-bank/evidence.md 顶部 Step 14B / API500 / 14C / Browser-Recheck 证据
4. memory-bank/decisions.md 顶部 D065
5. 只读 Step 14 相关前端文件小段：
   - apps/web/src/WorkflowTasks.tsx
   - apps/web/src/workflow-tasks.ts
   - apps/web/src/AchievementDetail.tsx
   - apps/web/src/WorkflowTasks.test.ts
   - apps/web/src/AchievementDetail.test.ts
   - apps/web/src/App.css
6. 只读 Step 14B API500 修复涉及的后端文件小段，仅用于审计范围确认：
   - WorkflowService / AchievementService / PolicyQueryFactory
   - AchievementRepository / WorkflowRepository
   - SecretAccessPolicyService
   - 相关测试
7. 不读取 .env 内容

本轮输出要求：

1. 当前状态确认
- Step 14A / 14B / 14C 是否 DONE。
- API500 是否已清除。
- Browser-Recheck 是否 PASS / PARTIAL。
- DataGap 是否仍存在。
- Step 14D 是否尚未开始。
- Step 14E 是否仅作为后续质量步骤候选。

2. Step 14D 审计范围确认
说明 Step 14D 后续执行应审计：
- Step 14A 计划与 D065 是否被遵守。
- Step 14B 关联成果只读查看基础是否符合范围。
- Step 14B-API500 DI 修复是否只修 DI，不改业务语义。
- Step 14C 状态/错误/空态/移动端体验是否补齐。
- Browser-Recheck 证据是否真实、清楚地区分 PASS 与 PARTIAL。
- DataGap 是否明确归档为验收数据缺口。
- Step 14E 是否未混入 Step 14D。

3. 质量门禁计划
Step 14D 执行时建议重新运行或复核：
- corepack pnpm --filter @research-ip/web test
- corepack pnpm --filter @research-ip/web typecheck
- corepack pnpm --filter @research-ip/web build
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
说明：
- 如果时间/范围原因不重新全跑，必须说明复用哪些最新门禁证据、哪些命令仍建议用户在一期整体验收前跑。
- 不运行 migrate/seed。
- 不创建数据。

4. 浏览器验收计划
Step 14D 执行时应复核或归档：
- Step 14C-Browser-Recheck 已覆盖的真实 API no-user、空列表、后端不可用、390px。
- 真实“任务详情 -> 查看关联成果详情”成功路径未覆盖，原因是 DataGap。
- 不能把 DataGap 下未覆盖路径说成 PASS。
- 如果要补真实成功路径，必须另走用户确认的数据路线，不能在 Step 14D 自行创建数据。

5. 边界审计计划
Step 14D 执行时应确认：
- 未改 Prisma schema / migration / seed。
- 未运行 migrate / seed。
- 未新增依赖。
- 未修改 package.json / lockfile。
- 未读取或展示敏感凭证。
- 未创建/修改业务数据。
- 未进入 Step 14E / Step 15。
- 后端 DI 修复未改变权限、脱敏、policy、repository 查询或 workflow 状态机语义。
- 前端审批上下文仍不显示成果 submit / void / archive。

6. memory-bank 归档计划
Step 14D 执行后应更新：
- memory-bank/implementation-plan.md：Step 14 overall final closure。
- memory-bank/progress.md：Step 14D DONE、Step 14 overall DONE 或 DONE_WITH_DATAGAP_RISK。
- memory-bank/evidence.md：最终门禁、浏览器验收、DataGap、边界审计证据。
- memory-bank/decisions.md：仅当需要记录“接受 DataGap 为非阻塞风险并留到一期整体验收”或“Step 14E 后续质量步骤”时更新。

7. Step 14 完成判定建议
请给出计划层面的判定规则：
- 如果门禁和边界审计通过，Step 14 可判定为 DONE_WITH_DATAGAP_RISK，而不是无条件 DONE。
- DataGap 必须作为剩余风险带入一期整体验收或后续数据路线。
- API500 已清除，不应再作为 Step 14 阻塞项。
- Step 14E 是后续质量步骤，不影响 Step 14 业务功能闭环，但应作为下一步候选。

8. 任务等级判断
- Step 14D 计划确认：XS / S。
- Step 14D 执行：S / M，取决于是否全量重跑 web/api 门禁和浏览器复查。
- 若涉及数据创建或 seed/migrate，必须升级并暂停确认，但 Step 14D 默认不涉及。

9. 风险与待确认点
必须列出：
- 是否接受 Step 14 最终状态为 DONE_WITH_DATAGAP_RISK。
- 是否需要 Step 14D 执行时全量重跑 web/api 门禁。
- 是否要在 Step 14D 后优先进入 Step 14E Backend DI Explicit Inject Audit，而不是 Step 15。
- 是否把真实成功路径留到一期整体验收。

最后明确输出：
- 本轮只完成 Step 14D 计划确认。
- 未执行审计、未修改文件、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- 未进入 Step 14E / Step 15。
- 不生成 Step 14D 执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Step 14D 执行 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14D。

定位：
- Step 14D 是 Step 14 主线最终审计与归档。
- 本轮执行轻量最终审计 + 复用最近门禁证据。
- 用户已确认：
  - 接受 Step 14 最终状态为 DONE_WITH_DATAGAP_RISK。
  - Step 14D 复用最近 web/api 门禁证据，不全量重跑。
  - Step 14D 后优先进入 Step 14E Backend DI Explicit Inject Audit，而不是 Step 15。
  - 真实“任务详情 -> 查看关联成果详情”成功路径留到一期整体验收，不在 Step 14D 造数据。
- 本轮不实现新功能，不创建数据，不运行 migrate/seed，不进入 Step 14E / Step 15。

前置状态：
- Step 14A：DONE。
- Step 14B：DONE。
- Step 14B-API500 DI 修复链路：DONE，API500 已清除。
- Step 14C：DONE。
- Step 14C-Browser-Recheck：PASS / PARTIAL。
  - PASS：真实 API no-user、真实后端空列表、后端不可用错误态、390px 无横向溢出。
  - PARTIAL：DataGap 仍存在，真实 workflow tasks 为空，无法覆盖“任务详情 -> 查看关联成果详情”真实成功路径。
- Step 14D：当前执行。
- Step 14E / Step 15：未开始。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取 Step 14D 审计归档直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不实现新功能。
- 不修改业务代码。
- 不创建、导入、修改业务数据。
- 不运行 migrate / seed。
- 不执行 INSERT / UPDATE / DELETE / TRUNCATE / DROP。
- 不补 workflow task 数据。
- 不使用 fake/mock/seed 数据冒充真实成功路径。
- 不改后端业务语义。
- 不改 workflow 状态机。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14E / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md，仅用于记录用户已确认：
  - Step 14 接受 DONE_WITH_DATAGAP_RISK。
  - DataGap 留到一期整体验收。
  - Step 14E 作为 Step 14 后优先质量步骤。
- 不修改 apps/、packages/、prisma/、scripts/、业务代码或配置文件。

建议只读范围：
1. memory-bank/implementation-plan.md 顶部 Step 14A / 14B / API500 / 14C / Browser-Recheck 最新记录
2. memory-bank/progress.md 顶部 Step 14A / 14B / API500 / 14C / Browser-Recheck 最新记录
3. memory-bank/evidence.md 顶部 Step 14B / API500 / 14C / Browser-Recheck 证据
4. memory-bank/decisions.md 顶部 D065
5. 必要时只读 Step 14 相关前端和后端文件小段，用于审计引用：
   - apps/web/src/WorkflowTasks.tsx
   - apps/web/src/workflow-tasks.ts
   - apps/web/src/AchievementDetail.tsx
   - apps/web/src/WorkflowTasks.test.ts
   - apps/web/src/AchievementDetail.test.ts
   - apps/web/src/App.css
   - API500 DI 修复涉及的后端 service/repository/policy 文件和测试
6. 不读取 .env 内容

执行目标：

1. 审计 Step 14 范围闭环
确认并归档：
- Step 14A 遵守 D065：复用现有 GET /achievements/:id，审批上下文只读。
- Step 14B 实现关联成果只读查看基础，不伪造 AchievementListItem，不带入 submit / void / archive。
- Step 14B-API500 只修后端 DI/runtime wiring，不改业务语义、权限、脱敏、policy、repository 查询或 workflow 状态机。
- Step 14C 补齐状态、错误、空态、无关联成果边界和移动端体验。
- Step 14C-Browser-Recheck 真实区分 PASS 与 PARTIAL。
- DataGap 明确是本地验收数据缺口，不是 API500 或 Step 14 实现失败。

2. 复用最近门禁证据
不要全量重跑门禁，归档最近证据：
- Step 14C：
  - web test PASS，7 files / 66 tests。
  - web typecheck PASS。
  - web build PASS，只有 Vite chunk size warning。
  - lint PASS。
- API500 DI 修复链路：
  - api test PASS，50 files / 450 tests。
  - api typecheck PASS。
  - api build PASS。
  - lint PASS。
- Step 14C-Browser-Recheck：
  - health 200。
  - achievements list 200。
  - workflow tasks 200 empty items。
  - no-user 不发业务请求。
  - empty list / backend unavailable / 390px covered.
说明：一期整体验收前仍建议全量重新跑 web/api 门禁。

3. 归档浏览器验收与 DataGap
记录：
- PASS 覆盖：
  - 真实 API no-user 状态。
  - 真实后端空列表状态。
  - 后端不可用错误态。
  - 390px 移动端无横向溢出。
- PARTIAL 原因：
  - workflow tasks 为空。
  - 无真实审批任务可打开。
  - 真实“任务详情 -> 查看关联成果详情”成功路径未覆盖。
- 用户已确认：
  - 接受 DONE_WITH_DATAGAP_RISK。
  - 真实成功路径留到一期整体验收或后续单独数据路线。
  - Step 14D 不创建数据、不 seed/migrate。

4. 边界审计
归档确认：
- 未改 Prisma schema / migration / seed。
- 未运行 migrate / seed。
- 未新增依赖。
- 未修改 package.json / lockfile。
- 未读取或展示敏感凭证。
- 未创建、导入、修改业务数据。
- 未进入 Step 14E / Step 15。
- 前端审批上下文仍只读，不显示成果 submit / void / archive。
- 后端 DI 修复只稳定注入，不改变业务语义。

5. 更新 memory-bank
更新：
- memory-bank/implementation-plan.md
  - 顶部新增 Step 14D final closure。
  - Step 14 overall status: DONE_WITH_DATAGAP_RISK。
  - Step 14E / Step 15 not started。
- memory-bank/progress.md
  - 顶部新增 Step 14D final audit closure。
  - 记录 DONE_WITH_DATAGAP_RISK、复用门禁、Browser-Recheck、DataGap、边界。
- memory-bank/evidence.md
  - 顶部新增 Step 14D evidence。
  - 记录复用门禁证据、浏览器证据、DataGap、边界审计。
- memory-bank/decisions.md
  - 如判断需要，新增一条决策：
    - Step 14 accepted as DONE_WITH_DATAGAP_RISK; real linked-achievement success path deferred to phase-one full acceptance or confirmed data route; Step 14E prioritized before Step 15.
  - 如果不更新 decisions.md，必须说明原因。

完成后输出：
1. Step 14D 是否 DONE。
2. Step 14 overall 是否为 DONE_WITH_DATAGAP_RISK。
3. 修改了哪些 memory-bank 文件。
4. 复用了哪些门禁证据。
5. 浏览器验收 PASS / PARTIAL 如何归档。
6. DataGap 如何归档。
7. 是否运行 test/build/lint/typecheck：应说明未重跑、复用最近证据。
8. 是否运行 migrate/seed：必须说明未运行。
9. 是否修改业务代码、后端、schema、package/lockfile：必须说明未修改。
10. Step 14E / Step 15 是否仍未开始。
11. 下一步建议：Step 14E Backend DI Explicit Inject Audit 计划确认，而不是 Step 15。

最后明确：
- 本轮只执行 Step 14D。
- 未进入 Step 14E / Step 15。
- 不生成下一步 Prompt。
~~~

## Step 14E Backend DI Explicit Inject Audit 计划确认

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14E Backend DI Explicit Inject Audit 计划确认。

定位：
- Step 14 主线已完成，overall status: DONE_WITH_DATAGAP_RISK。
- Step 14E 是 Step 14 后、Step 15 前的独立质量/技术债步骤。
- 目标：系统性审计后端 Nest provider 构造注入，避免其他模块在 `api dev` / `tsx watch` runtime 下继续出现 dependency undefined API500。
- 本轮只做 Step 14E 计划确认，不修复代码、不修改文件、不运行 test/build/lint/typecheck、不启动服务。

前置事实：
- Step 14D 已 DONE。
- Step 14 overall 已归档为 DONE_WITH_DATAGAP_RISK。
- D066 已记录：Step 14E Backend DI Explicit Inject Audit 优先于 Step 15。
- Step 14B-API500 中已修复过一批真实暴露的 DI 问题：
  - WorkflowService
  - AchievementService
  - PolicyQueryFactory
  - AchievementRepository
  - WorkflowRepository
  - SecretAccessPolicyService
- 真实 API smoke 已恢复：
  - GET /api/health：200
  - GET /api/achievements?page=1&pageSize=5：200
  - GET /api/workflow/tasks/my?status=PENDING：200 empty items
- 只读扫描曾发现其他潜在同类风险，例如：
  - attachments/attachment.repository.ts
  - audit/audit.repository.ts
  - fees/fee.repository.ts
  - reminders/reminder.repository.ts
  - notifications/notification.repository.ts
  - authorization/policy/department-scope.service.ts
  - authorization/policy/audit-read-policy.service.ts
- 这些是潜在风险，不是已确认 API500。

本轮禁止：
- 不修复代码。
- 不修改任何文件。
- 不运行 test / build / lint / typecheck。
- 不启动前端或后端服务。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不改后端业务语义。
- 不改 permission / policy / redaction / workflow / repository 查询语义。
- 不改 DTO。
- 不改 Prisma schema / migration / seed。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 15。
- 不生成 Step 14E 执行 Prompt；执行 Prompt 由 Prompt 编排对话后续单独生成。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 只读取 Step 14E 计划确认直接相关内容
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

建议只读范围：
1. memory-bank/implementation-plan.md 顶部 Step 14D / D066 相关状态
2. memory-bank/progress.md 顶部 Step 14D 状态
3. memory-bank/evidence.md 顶部 Step 14D 证据
4. memory-bank/decisions.md 顶部 D066
5. apps/api/package.json 中 dev/test/typecheck/build 命令小段
6. apps/api/tsconfig.json 中 decorator metadata 相关配置小段
7. 只读扫描 apps/api/src 下 Nest provider 构造函数：
   - service
   - repository
   - policy
   - guard
   - adapter
   - controller
   重点识别 constructor 参数依赖 provider，但缺少显式 @Inject(...) 的位置。
8. 不读取 .env 内容。

本轮输出要求：

1. 当前状态确认
- Step 14 overall 是否 DONE_WITH_DATAGAP_RISK。
- D066 是否存在。
- Step 14E 是否尚未开始。
- Step 15 是否未开始。
- API500 是否已清除。
- Step 14E 是否是独立质量步骤，不改变 Step 14 主线完成状态。

2. 问题背景复述
- 简述 Step 14B-API500 暴露的问题：
  - `tsx watch` / dev runtime 下部分 Nest provider 仅依赖 constructor type metadata，导致依赖 undefined。
  - 通过显式 `@Inject(...)` 修复了已暴露链路。
- 明确 Step 14E 是预防同类问题扩散，不是修复当前已知 API500。

3. 审计目标
- 找出后端所有仍依赖隐式类型注入、且在 dev runtime 下可能不稳定的 provider。
- 给出哪些 provider 应在执行阶段补显式 `@Inject(...)`。
- 计划补 metadata/DI 回归测试。
- 不改变业务逻辑。
- 不改变 module provider/export/import，除非证据显示 wiring 缺失。
- 不改变数据、schema、seed、依赖。

4. 风险扫描计划
说明后续执行时应扫描：
- `constructor(private readonly prisma: PrismaService)` 类型。
- `constructor(private readonly xxx: SomeService)` 类型。
- 多参数 constructor 中部分参数已有 @Inject、部分没有 @Inject 的情况。
- repository、service、policy、guard、adapter、controller。
- 已修复 provider 不重复改，只复核测试覆盖。
- 对纯 domain error / value object constructor 不处理。

5. 候选影响范围
基于只读扫描列出候选风险文件和优先级：
- 高优先级：真实业务 API 可直接触达、且依赖 PrismaService / policy service 的 repository/service。
- 中优先级：后台任务、通知、附件、费用、提醒、审计等尚未在真实 runtime smoke 中覆盖的 provider。
- 低优先级：测试-only、纯类型、domain errors、无 provider 注入的类。
候选中至少考虑：
- attachments/attachment.repository.ts
- audit/audit.repository.ts
- fees/fee.repository.ts
- reminders/reminder.repository.ts
- notifications/notification.repository.ts
- authorization/policy/department-scope.service.ts
- authorization/policy/audit-read-policy.service.ts
也可基于扫描补充其他候选。

6. 推荐执行策略
给出 Step 14E 执行建议：
- 小步、机械性补显式 `@Inject(...)`。
- 保持构造参数顺序和访问修饰符不变。
- 不改方法逻辑。
- 不改查询语义。
- 对每个被改 provider 添加或扩展 metadata/DI 测试。
- 如改动文件较多，可按子步骤拆分：
  - 14E-1 repository PrismaService explicit inject audit
  - 14E-2 authorization policy explicit inject audit
  - 14E-3 service/controller/adapter explicit inject audit
  - 14E-4 final gates and smoke
- 或者如果扫描候选较少，可单步执行，但必须说明理由。

7. 文件影响范围计划
可能修改：
- apps/api/src/** 中 provider 文件。
- 对应 *.spec.ts metadata/DI 测试。
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md
- memory-bank/decisions.md，仅当形成新的后端 DI 工程决策时。
不得修改：
- apps/web/
- prisma/schema.prisma
- prisma/migrations/
- seed 文件
- package.json / lockfile
- 业务 DTO / 查询 / 状态机 / 权限语义
- 敏感配置

8. 验证计划
后续执行时建议运行，但本轮不运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint
- 可选真实 API smoke：
  - GET /api/health
  - GET /api/achievements?page=1&pageSize=5
  - GET /api/workflow/tasks/my?status=PENDING
  - 其他已覆盖模块的只读 GET，如 search/dashboard/fees/reminders/attachments metadata 等，仅限安全只读接口，且不得创建/修改数据。
- 不运行 migrate/seed。

9. 任务等级判断
- Step 14E 计划确认：S。
- Step 14E 执行：M。
- 若扫描显示候选很多，建议拆 14E-1/14E-2/14E-3/14E-4。
- 若发现需要改 module wiring、package、runtime loader 或 schema，则暂停升级确认，不在 Step 14E 默认范围内处理。

10. 风险与边界
必须列出：
- 批量 mechanical DI 修改有回归风险，需要测试覆盖。
- 只补显式注入，不改业务行为。
- 同类问题可能存在但未被 smoke 触达。
- 不能因为 DI audit 顺手改权限、脱敏、查询、状态机。
- 不能运行 seed/migrate 或创建数据。
- Step 14E 不解决 Step 14 DataGap。
- Step 14E 完成后仍需一期整体验收覆盖真实成功路径。

11. memory-bank 计划
- 本轮计划确认默认不修改 memory-bank。
- 后续执行完成后更新 progress/evidence/implementation-plan。
- 如确认“后端 provider 在 tsx dev runtime 下统一采用显式 @Inject(...)”为工程规则，应更新 decisions.md。

最后明确输出：
- 本轮只完成 Step 14E Backend DI Explicit Inject Audit 计划确认。
- 未修复、未修改文件、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- 未进入 Step 15。
- 不生成 Step 14E 执行 Prompt。
- 下一步需要用户确认后，才能由 Prompt 编排对话生成 Step 14E 执行 Prompt 或 14E 子步骤执行 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14E-1：repository PrismaService explicit inject audit。

定位：
- Step 14E 是 Step 14 后、Step 15 前的独立质量/技术债步骤。
- Step 14E-1 聚焦 repository 层 PrismaService 显式注入审计。
- 目标：把仍依赖隐式 constructor type metadata 注入 PrismaService 的 repository 改为显式 `@Inject(PrismaService)`，降低 `api dev` / `tsx watch` runtime 下 dependency undefined 风险。
- 本轮只处理 repository PrismaService 显式注入和对应 metadata/DI 回归测试。
- 不进入 Step 14E-2 / 14E-3 / 14E-4 / Step 15。

前置状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- D066 已记录 Step 14E 优先于 Step 15。
- Step 14E 计划确认：PASS。
- 已修复过的 repository：
  - AchievementRepository
  - WorkflowRepository
- 仍需审计的 repository 候选包括：
  - attachments/attachment.repository.ts
  - audit/audit.repository.ts
  - fees/fee.repository.ts
  - reminders/reminder.repository.ts
  - notifications/notification.repository.ts
  - 以及扫描发现的其他 `constructor(private readonly prisma: PrismaService)` repository。
- 本轮不解决 Step 14 DataGap。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取和 Step 14E-1 直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不改业务语义。
- 不改 permission / policy / redaction / workflow / repository 查询语义。
- 不改 DTO。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14E-2 / 14E-3 / 14E-4 / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/api/src/**/**.repository.ts 中仅限 PrismaService 构造注入声明。
- 对应 repository *.spec.ts 或合适的 DI metadata 测试文件。
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当正式记录统一显式 Inject 工程规则时

不得修改：
- apps/web/
- prisma/schema.prisma
- prisma/migrations/
- seed 文件
- package.json / lockfile
- controller / service / policy 业务逻辑
- repository 查询逻辑、include/select/filter/order/transaction
- 敏感配置

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14D / D066 / Step 14E 计划相关记录
2. memory-bank/progress.md 顶部 Step 14D / Step 14E 计划相关记录
3. memory-bank/evidence.md 顶部 Step 14D 证据
4. memory-bank/decisions.md 顶部 D066
5. 全局扫描：
   - `constructor(private readonly prisma: PrismaService)`
   - repository 文件中 constructor 注入 PrismaService 但缺少 `@Inject(PrismaService)`
6. 已修复样例：
   - apps/api/src/achievements/achievement.repository.ts
   - apps/api/src/workflow/workflow.repository.ts
   - 对应 repository spec
7. 候选 repository 文件：
   - apps/api/src/attachments/attachment.repository.ts
   - apps/api/src/audit/audit.repository.ts
   - apps/api/src/fees/fee.repository.ts
   - apps/api/src/reminders/reminder.repository.ts
   - apps/api/src/notifications/notification.repository.ts
   - 其他扫描命中的 repository

执行目标：
1. 扫描 repository PrismaService 隐式注入
- 找出所有 repository 文件里 `constructor(private readonly prisma: PrismaService)` 或等价隐式 PrismaService 注入。
- 排除已经显式 `@Inject(PrismaService)` 的 repository，例如 AchievementRepository、WorkflowRepository，以及已显式注入的 Search/Dashboard repository。
- 列出实际需要修改的 repository。

2. 机械性补显式 Inject
对每个需要修改的 repository：
- 引入 `Inject`。
- 将 constructor 改为多行显式注入：
  `constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}`
  或项目现有等价格式。
- 保持 constructor 参数顺序和访问修饰符。
- 不改任何方法逻辑。
- 不改任何 Prisma 查询、include/select、filter/order、transaction 语义。

3. 补 metadata/DI 回归测试
- 为本轮修改的 repository 增加或扩展测试。
- 测试应断言显式 `PrismaService` 注入 token 存在。
- 优先沿用 AchievementRepository / WorkflowRepository 已有 metadata 测试模式。
- 不需要真实数据库。
- 单元测试可用测试替身，但不得描述成真实 API 验收。

4. 不处理非 repository provider
- 不处理 service / controller / policy / adapter 的隐式注入。
- 若扫描发现 service/policy 风险，只记录为 Step 14E-2/14E-3 候选，不在本轮改。

验证要求：
1. 运行：
   - corepack pnpm --filter @research-ip/api test
   - corepack pnpm --filter @research-ip/api typecheck
   - corepack pnpm --filter @research-ip/api build
   - corepack pnpm lint
2. 本轮默认不启动后端，不做 API smoke；API smoke 留给 14E-4 final gates and readonly smoke。
3. 不运行 migrate/seed。

如果验证失败：
- 只在 Step 14E-1 repository DI 范围内修复。
- 如果发现需要改业务逻辑、module wiring、schema/migration/seed、package/lockfile，立即停止并报告。
- 不通过时不得声称 DONE。

memory-bank 更新：
完成实现和验证后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如决定正式记录“repository PrismaService 在 tsx dev runtime 下统一显式 Inject”的工程规则，更新 memory-bank/decisions.md
记录：
- 扫描结果。
- 修改文件。
- 测试/typecheck/build/lint 结果。
- 未触碰业务语义、查询、schema、seed、package/lockfile的边界证据。
- Step 14E-2 / 14E-3 / 14E-4 / Step 15 未开始。
- Step 14 DataGap 仍不在本轮解决。

完成后输出：
1. Step 14E-1 是否 DONE。
2. 扫描发现哪些 repository 需要修改。
3. 实际修改了哪些文件。
4. 修复方式。
5. 测试/typecheck/build/lint 结果。
6. 是否运行 migrate/seed：必须明确说明。
7. 是否修改业务逻辑/query/schema/package/lockfile：必须明确说明。
8. 是否记录新的 decisions。
9. Step 14E-2 / 14E-3 / 14E-4 / Step 15 是否仍未开始。
10. 剩余候选风险给 Step 14E-2/14E-3。

最后明确：
- 本轮只执行 Step 14E-1 repository PrismaService explicit inject audit。
- 未进入 Step 14E-2 / 14E-3 / 14E-4 / Step 15。
- 不生成下一步 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14E-2：authorization policy explicit inject audit。

定位：
- Step 14E 是 Step 14 后、Step 15 前的独立质量/技术债步骤。
- Step 14E-1 已 DONE：repository PrismaService explicit inject audit。
- Step 14E-2 聚焦 authorization policy provider 的显式注入审计。
- 目标：把仍依赖隐式 constructor type metadata 的 authorization policy provider 改为显式 `@Inject(...)`，降低 `api dev` / `tsx watch` runtime 下 dependency undefined 风险。
- 本轮只处理 authorization policy provider 显式注入和对应 metadata/DI 回归测试。
- 不进入 Step 14E-3 / 14E-4 / Step 15。

前置状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- D066 已记录 Step 14E 优先于 Step 15。
- Step 14E-1：DONE。
- D067 已记录 repository PrismaService 显式注入工程规则。
- 已修复过的 policy/provider：
  - PolicyQueryFactory
  - SecretAccessPolicyService
- 候选 authorization policy provider 包括：
  - apps/api/src/authorization/policy/department-scope.service.ts
  - apps/api/src/authorization/policy/audit-read-policy.service.ts
  - apps/api/src/authorization/policy/attachment-access-policy.service.ts
  - 以及扫描发现的其他 authorization policy provider 中仍依赖隐式注入的位置。
- 本轮不解决 Step 14 DataGap。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取和 Step 14E-2 直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不改业务语义。
- 不改 permission / policy / redaction / workflow 语义。
- 不改 canRead / scope / grant / audit policy 逻辑。
- 不改 DTO。
- 不改 repository 查询语义。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14E-3 / 14E-4 / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/api/src/authorization/policy/**/*.ts 中 authorization policy provider 的 constructor 注入声明。
- 对应 authorization policy *.spec.ts 或合适的 DI metadata 测试文件。
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当正式记录 authorization policy 显式 Inject 工程规则时

不得修改：
- apps/web/
- prisma/schema.prisma
- prisma/migrations/
- seed 文件
- package.json / lockfile
- repository 查询逻辑
- service/controller/adapter 非 policy provider
- 权限、脱敏、scope、grant、audit policy 方法逻辑
- 敏感配置

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14E-1 / D067 最新记录
2. memory-bank/progress.md 顶部 Step 14E-1 最新记录
3. memory-bank/evidence.md 顶部 Step 14E-1 证据
4. memory-bank/decisions.md 顶部 D067 / D066
5. 全局扫描 authorization policy provider constructor：
   - `apps/api/src/authorization/policy`
   - constructor 参数依赖 provider 但缺少显式 `@Inject(...)`
6. 已修复样例：
   - policy-query.factory.ts
   - secret-access-policy.service.ts
   - 对应 policy spec
7. 候选文件：
   - department-scope.service.ts
   - audit-read-policy.service.ts
   - attachment-access-policy.service.ts
   - 其他扫描命中的 authorization policy provider

执行目标：
1. 扫描 authorization policy provider 隐式注入
- 找出 `apps/api/src/authorization/policy` 下 provider 构造函数中依赖其他 service/provider，但未显式 `@Inject(...)` 的参数。
- 排除已显式注入的 `PolicyQueryFactory`、`SecretAccessPolicyService`，但可复核其测试覆盖。
- 排除纯类型、domain error、无 provider 依赖的类。
- 列出实际需要修改的 policy provider。

2. 机械性补显式 Inject
对每个需要修改的 policy provider：
- 引入 `Inject`。
- 为 constructor 依赖添加显式 `@Inject(ProviderClass)`。
- 保持 constructor 参数顺序和访问修饰符。
- 不改任何方法逻辑。
- 不改 permission / scope / grant / redaction / audit 判断语义。

3. 补 metadata/DI 回归测试
- 为本轮修改的 policy provider 增加或扩展测试。
- 测试应断言显式注入 token 存在。
- 优先沿用 PolicyQueryFactory / SecretAccessPolicyService 已有 metadata 测试模式。
- 不需要真实数据库。
- 单元测试可用测试替身，但不得描述成真实 API 验收。

4. 不处理非 authorization policy provider
- 不处理 service / controller / repository / adapter 的隐式注入。
- 若扫描发现非 policy 风险，只记录为 Step 14E-3 候选，不在本轮改。

验证要求：
1. 运行：
   - corepack pnpm --filter @research-ip/api test
   - corepack pnpm --filter @research-ip/api typecheck
   - corepack pnpm --filter @research-ip/api build
   - corepack pnpm lint
2. 本轮默认不启动后端，不做 API smoke；API smoke 留给 14E-4 final gates and readonly smoke。
3. 不运行 migrate/seed。

如果验证失败：
- 只在 Step 14E-2 authorization policy DI 范围内修复。
- 如果发现需要改业务逻辑、module wiring、schema/migration/seed、package/lockfile，立即停止并报告。
- 不通过时不得声称 DONE。

memory-bank 更新：
完成实现和验证后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如决定正式记录“authorization policy providers 在 tsx dev runtime 下统一显式 Inject”的工程规则，更新 memory-bank/decisions.md
记录：
- 扫描结果。
- 修改文件。
- 测试/typecheck/build/lint 结果。
- 未触碰业务语义、权限、脱敏、policy 逻辑、schema、seed、package/lockfile 的边界证据。
- Step 14E-3 / Step 14E-4 / Step 15 未开始。
- Step 14 DataGap 仍不在本轮解决。

完成后输出：
1. Step 14E-2 是否 DONE。
2. 扫描发现哪些 authorization policy provider 需要修改。
3. 实际修改了哪些文件。
4. 修复方式。
5. 测试/typecheck/build/lint 结果。
6. 是否运行 migrate/seed：必须明确说明。
7. 是否修改业务逻辑/policy/schema/package/lockfile：必须明确说明。
8. 是否记录新的 decisions。
9. Step 14E-3 / Step 14E-4 / Step 15 是否仍未开始。
10. 剩余候选风险给 Step 14E-3。

最后明确：
- 本轮只执行 Step 14E-2 authorization policy explicit inject audit。
- 未进入 Step 14E-3 / Step 14E-4 / Step 15。
- 不生成下一步 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14E-3：service/controller/adapter explicit inject audit。

定位：
- Step 14E 是 Step 14 后、Step 15 前的独立质量/技术债步骤。
- Step 14E-1 已 DONE：repository PrismaService explicit inject audit。
- Step 14E-2 已 DONE：authorization policy explicit inject audit。
- Step 14E-3 聚焦 service / controller / adapter provider 的显式注入审计。
- 目标：把仍依赖隐式 constructor type metadata 的 service / controller / adapter provider 改为显式 `@Inject(...)`，降低 `api dev` / `tsx watch` runtime 下 dependency undefined 风险。
- 本轮只处理 service / controller / adapter 显式注入和对应 metadata/DI 回归测试。
- 不进入 Step 14E-4 / Step 15。

前置状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- D066 已记录 Step 14E 优先于 Step 15。
- Step 14E-1：DONE，D067 已记录 repository PrismaService 显式注入规则。
- Step 14E-2：DONE，D068 已记录 authorization policy provider 显式注入规则。
- 已修复过的相关 provider 包括：
  - WorkflowService
  - AchievementService
  - PolicyQueryFactory
  - AchievementRepository / WorkflowRepository
  - SecretAccessPolicyService
  - repository PrismaService providers from Step 14E-1
  - authorization policy providers from Step 14E-2
- 本轮不解决 Step 14 DataGap。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取和 Step 14E-3 直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不改业务语义。
- 不改 permission / policy / redaction / workflow 语义。
- 不改 service 方法逻辑。
- 不改 controller route / guard / decorator / DTO / response contract。
- 不改 adapter behavior。
- 不改 repository 查询语义。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14E-4 / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/api/src/**/*.service.ts 中 service provider 的 constructor 注入声明。
- apps/api/src/**/*.controller.ts 中 controller provider 的 constructor 注入声明。
- apps/api/src/**/adapters/**/*.ts 或 adapter provider 中的 constructor 注入声明。
- 对应 *.spec.ts 或合适的 DI metadata 测试文件。
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当正式记录 service/controller/adapter 显式 Inject 工程规则时

不得修改：
- apps/web/
- prisma/schema.prisma
- prisma/migrations/
- seed 文件
- package.json / lockfile
- repository 查询逻辑
- authorization policy 方法逻辑
- controller route decorators / guards / permissions / DTO contracts
- service business method bodies
- adapter behavior
- 敏感配置

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14E-1 / 14E-2 / D067 / D068 最新记录
2. memory-bank/progress.md 顶部 Step 14E-1 / 14E-2 最新记录
3. memory-bank/evidence.md 顶部 Step 14E-1 / 14E-2 证据
4. memory-bank/decisions.md 顶部 D067 / D068 / D066
5. 全局扫描 service/controller/adapter constructor：
   - apps/api/src/**/*.service.ts
   - apps/api/src/**/*.controller.ts
   - apps/api/src/**/adapters/**/*.ts
   - constructor 参数依赖 provider 但缺少显式 `@Inject(...)`
6. 已修复样例：
   - workflow.service.ts
   - achievement.service.ts
   - controllers already using explicit Inject
   - search adapter using explicit Inject
   - 对应 spec 测试模式
7. 不扫描/修改 repository 和 authorization/policy 已处理范围，除非只是确认已无遗漏。

执行目标：
1. 扫描 service / controller / adapter 隐式注入
- 找出 service / controller / adapter provider 构造函数中依赖其他 provider，但未显式 `@Inject(...)` 的参数。
- 排除已经显式注入的 provider。
- 排除纯 domain error、value object、无 provider 依赖的类。
- 排除 repository 和 authorization policy provider，除非只是复核不修改。
- 列出实际需要修改的 service/controller/adapter provider。

2. 机械性补显式 Inject
对每个需要修改的 provider：
- 引入 `Inject`。
- 为 constructor 依赖添加显式 `@Inject(ProviderClass)` 或项目现有 token。
- 保持 constructor 参数顺序和访问修饰符。
- 不改任何方法体。
- 不改 controller decorators、guards、permissions、DTO、response shape。
- 不改 adapter 行为。

3. 补 metadata/DI 回归测试
- 为本轮修改的 provider 增加或扩展测试。
- 测试应断言显式注入 token 存在。
- 优先沿用 Step 14E-1 / 14E-2 已有 metadata 测试模式。
- 不需要真实数据库。
- 单元测试可用测试替身，但不得描述成真实 API 验收。

4. 不处理其他类别
- 不处理 repository。
- 不处理 authorization policy provider。
- 若扫描发现 module wiring、runtime loader、package script 问题，只记录为未来候选，不在本轮改。

验证要求：
1. 运行：
   - corepack pnpm --filter @research-ip/api test
   - corepack pnpm --filter @research-ip/api typecheck
   - corepack pnpm --filter @research-ip/api build
   - corepack pnpm lint
2. 本轮默认不启动后端，不做 API smoke；API smoke 留给 14E-4 final gates and readonly smoke。
3. 不运行 migrate/seed。

如果验证失败：
- 只在 Step 14E-3 service/controller/adapter DI 范围内修复。
- 如果发现需要改业务逻辑、controller contract、adapter behavior、module wiring、schema/migration/seed、package/lockfile，立即停止并报告。
- 不通过时不得声称 DONE。

memory-bank 更新：
完成实现和验证后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如决定正式记录“service/controller/adapter providers 在 tsx dev runtime 下统一显式 Inject”的工程规则，更新 memory-bank/decisions.md
记录：
- 扫描结果。
- 修改文件。
- 测试/typecheck/build/lint 结果。
- 未触碰业务语义、controller contract、adapter behavior、schema、seed、package/lockfile 的边界证据。
- Step 14E-4 / Step 15 未开始。
- Step 14 DataGap 仍不在本轮解决。

完成后输出：
1. Step 14E-3 是否 DONE。
2. 扫描发现哪些 service/controller/adapter provider 需要修改。
3. 实际修改了哪些文件。
4. 修复方式。
5. 测试/typecheck/build/lint 结果。
6. 是否运行 migrate/seed：必须明确说明。
7. 是否修改业务逻辑/controller contract/adapter behavior/schema/package/lockfile：必须明确说明。
8. 是否记录新的 decisions。
9. Step 14E-4 / Step 15 是否仍未开始。
10. 剩余候选风险给 Step 14E-4。

最后明确：
- 本轮只执行 Step 14E-3 service/controller/adapter explicit inject audit。
- 未进入 Step 14E-4 / Step 15。
- 不生成下一步 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14E-3：service/controller/adapter explicit inject audit。

定位：
- Step 14E 是 Step 14 后、Step 15 前的独立质量/技术债步骤。
- Step 14E-1 已 DONE：repository PrismaService explicit inject audit。
- Step 14E-2 已 DONE：authorization policy explicit inject audit。
- Step 14E-3 聚焦 service / controller / adapter provider 的显式注入审计。
- 目标：把仍依赖隐式 constructor type metadata 的 service / controller / adapter provider 改为显式 `@Inject(...)`，降低 `api dev` / `tsx watch` runtime 下 dependency undefined 风险。
- 本轮只处理 service / controller / adapter 显式注入和对应 metadata/DI 回归测试。
- 不进入 Step 14E-4 / Step 15。

前置状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- D066 已记录 Step 14E 优先于 Step 15。
- Step 14E-1：DONE，D067 已记录 repository PrismaService 显式注入规则。
- Step 14E-2：DONE，D068 已记录 authorization policy provider 显式注入规则。
- 已修复过的相关 provider 包括：
  - WorkflowService
  - AchievementService
  - PolicyQueryFactory
  - AchievementRepository / WorkflowRepository
  - SecretAccessPolicyService
  - repository PrismaService providers from Step 14E-1
  - authorization policy providers from Step 14E-2
- 本轮不解决 Step 14 DataGap。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取和 Step 14E-3 直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不改业务语义。
- 不改 permission / policy / redaction / workflow 语义。
- 不改 service 方法逻辑。
- 不改 controller route / guard / decorator / DTO / response contract。
- 不改 adapter behavior。
- 不改 repository 查询语义。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 14E-4 / Step 15。
- 不生成下一步 Prompt。

允许修改范围：
- apps/api/src/**/*.service.ts 中 service provider 的 constructor 注入声明。
- apps/api/src/**/*.controller.ts 中 controller provider 的 constructor 注入声明。
- apps/api/src/**/adapters/**/*.ts 或 adapter provider 中的 constructor 注入声明。
- 对应 *.spec.ts 或合适的 DI metadata 测试文件。
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/implementation-plan.md，必要时
- memory-bank/decisions.md，仅当正式记录 service/controller/adapter 显式 Inject 工程规则时

不得修改：
- apps/web/
- prisma/schema.prisma
- prisma/migrations/
- seed 文件
- package.json / lockfile
- repository 查询逻辑
- authorization policy 方法逻辑
- controller route decorators / guards / permissions / DTO contracts
- service business method bodies
- adapter behavior
- 敏感配置

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14E-1 / 14E-2 / D067 / D068 最新记录
2. memory-bank/progress.md 顶部 Step 14E-1 / 14E-2 最新记录
3. memory-bank/evidence.md 顶部 Step 14E-1 / 14E-2 证据
4. memory-bank/decisions.md 顶部 D067 / D068 / D066
5. 全局扫描 service/controller/adapter constructor：
   - apps/api/src/**/*.service.ts
   - apps/api/src/**/*.controller.ts
   - apps/api/src/**/adapters/**/*.ts
   - constructor 参数依赖 provider 但缺少显式 `@Inject(...)`
6. 已修复样例：
   - workflow.service.ts
   - achievement.service.ts
   - controllers already using explicit Inject
   - search adapter using explicit Inject
   - 对应 spec 测试模式
7. 不扫描/修改 repository 和 authorization/policy 已处理范围，除非只是确认已无遗漏。

执行目标：
1. 扫描 service / controller / adapter 隐式注入
- 找出 service / controller / adapter provider 构造函数中依赖其他 provider，但未显式 `@Inject(...)` 的参数。
- 排除已经显式注入的 provider。
- 排除纯 domain error、value object、无 provider 依赖的类。
- 排除 repository 和 authorization policy provider，除非只是复核不修改。
- 列出实际需要修改的 service/controller/adapter provider。

2. 机械性补显式 Inject
对每个需要修改的 provider：
- 引入 `Inject`。
- 为 constructor 依赖添加显式 `@Inject(ProviderClass)` 或项目现有 token。
- 保持 constructor 参数顺序和访问修饰符。
- 不改任何方法体。
- 不改 controller decorators、guards、permissions、DTO、response shape。
- 不改 adapter 行为。

3. 补 metadata/DI 回归测试
- 为本轮修改的 provider 增加或扩展测试。
- 测试应断言显式注入 token 存在。
- 优先沿用 Step 14E-1 / 14E-2 已有 metadata 测试模式。
- 不需要真实数据库。
- 单元测试可用测试替身，但不得描述成真实 API 验收。

4. 不处理其他类别
- 不处理 repository。
- 不处理 authorization policy provider。
- 若扫描发现 module wiring、runtime loader、package script 问题，只记录为未来候选，不在本轮改。

验证要求：
1. 运行：
   - corepack pnpm --filter @research-ip/api test
   - corepack pnpm --filter @research-ip/api typecheck
   - corepack pnpm --filter @research-ip/api build
   - corepack pnpm lint
2. 本轮默认不启动后端，不做 API smoke；API smoke 留给 14E-4 final gates and readonly smoke。
3. 不运行 migrate/seed。

如果验证失败：
- 只在 Step 14E-3 service/controller/adapter DI 范围内修复。
- 如果发现需要改业务逻辑、controller contract、adapter behavior、module wiring、schema/migration/seed、package/lockfile，立即停止并报告。
- 不通过时不得声称 DONE。

memory-bank 更新：
完成实现和验证后更新：
- memory-bank/progress.md
- memory-bank/evidence.md
- 必要时 memory-bank/implementation-plan.md
- 如决定正式记录“service/controller/adapter providers 在 tsx dev runtime 下统一显式 Inject”的工程规则，更新 memory-bank/decisions.md
记录：
- 扫描结果。
- 修改文件。
- 测试/typecheck/build/lint 结果。
- 未触碰业务语义、controller contract、adapter behavior、schema、seed、package/lockfile 的边界证据。
- Step 14E-4 / Step 15 未开始。
- Step 14 DataGap 仍不在本轮解决。

完成后输出：
1. Step 14E-3 是否 DONE。
2. 扫描发现哪些 service/controller/adapter provider 需要修改。
3. 实际修改了哪些文件。
4. 修复方式。
5. 测试/typecheck/build/lint 结果。
6. 是否运行 migrate/seed：必须明确说明。
7. 是否修改业务逻辑/controller contract/adapter behavior/schema/package/lockfile：必须明确说明。
8. 是否记录新的 decisions。
9. Step 14E-4 / Step 15 是否仍未开始。
10. 剩余候选风险给 Step 14E-4。

最后明确：
- 本轮只执行 Step 14E-3 service/controller/adapter explicit inject audit。
- 未进入 Step 14E-4 / Step 15。
- 不生成下一步 Prompt。
~~~

~~~
你现在执行 E:\研究院科研成果管理系统 项目的 Step 14E-4：final gates and readonly smoke。

定位：
- Step 14E 是 Step 14 后、Step 15 前的独立质量/技术债步骤。
- Step 14E-1 已 DONE：repository PrismaService explicit inject audit。
- Step 14E-2 已 DONE：authorization policy explicit inject audit。
- Step 14E-3 已 DONE：service/controller/adapter explicit inject audit。
- Step 14E-4 是 Step 14E 最终门禁与只读 smoke。
- 本轮不改 DI 代码，不实现功能，只做最终验证、只读 smoke、memory-bank 归档。
- 不进入 Step 15。

前置状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- D066：Step 14E 优先于 Step 15。
- D067：repository PrismaService 显式注入规则。
- D068：authorization policy provider 显式注入规则。
- D069：service/controller/adapter provider 显式注入规则。
- Step 14E-1 / 14E-2 / 14E-3 均已通过 api test/typecheck/build/lint。
- Step 14 DataGap 仍存在，不在 Step 14E 解决。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 不删除文件，不执行 destructive commands
- 先索引，后精读
- 只读取和 Step 14E-4 直接相关的上下文
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 项目目录不是 Git 仓库，不能依赖 git status / git diff 作为证据

严格禁止：
- 不修改业务代码。
- 不修改 DI 代码。
- 不改业务语义。
- 不改 permission / policy / redaction / workflow 语义。
- 不改 controller route / DTO / response contract。
- 不改 repository 查询语义。
- 不改 Prisma schema / migration / seed。
- 不运行 migrate / seed。
- 不创建、不导入、不修改业务数据。
- 不执行 INSERT / UPDATE / DELETE / TRUNCATE / DROP。
- 不新增依赖。
- 不修改 package.json / lockfile。
- 不读取或打印 .env 内容。
- 不展示 DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量读取 prompt.md。
- 不进入 Step 15。
- 不生成下一步 Prompt。

允许：
- 运行最终门禁。
- 启动后端 dev server 做只读 API smoke。
- 检查端口占用。
- 使用项目已有脚本启动后端：
  corepack pnpm --filter @research-ip/api dev
- 只停止本轮启动的明确进程，不批量杀进程。
- 做只读 GET 请求。
- 更新 memory-bank：
  - implementation-plan.md
  - progress.md
  - evidence.md
  - decisions.md 仅当产生新的最终工程决策

建议先只读：
1. memory-bank/implementation-plan.md 顶部 Step 14E-1 / 14E-2 / 14E-3 最新记录
2. memory-bank/progress.md 顶部 Step 14E-1 / 14E-2 / 14E-3 最新记录
3. memory-bank/evidence.md 顶部 Step 14E-1 / 14E-2 / 14E-3 证据
4. memory-bank/decisions.md 顶部 D067 / D068 / D069 / D066
5. apps/api/package.json 中 dev/test/typecheck/build 命令小段
6. 安全只读 API 路径相关已有记录，不读取 .env 内容

执行目标：

1. 最终门禁
运行：
- corepack pnpm --filter @research-ip/api test
- corepack pnpm --filter @research-ip/api typecheck
- corepack pnpm --filter @research-ip/api build
- corepack pnpm lint

如果失败：
- 不改代码，先记录失败并判断是否需要后续修复 Prompt。
- 如果失败是明显测试期望或 lint 小问题，也不要擅自修，除非用户另行确认。
- 不通过不得声明 Step 14E DONE。

2. 只读 API smoke 准备
- 检查后端端口 3000 是否已有服务。
- 如果已有服务，记录它是既有服务，不停止它。
- 如果没有服务，启动：
  corepack pnpm --filter @research-ip/api dev
- 启动后不打印 .env 内容、DATABASE_URL 或连接串。
- 验收后只停止本轮启动的后端进程。
- 不运行 migrate/seed。

3. 必须 smoke 的只读接口
使用与前面一致的 demo user header / dev identity 方式，执行并记录状态码：
- GET /api/health
- GET /api/achievements?page=1&pageSize=5
- GET /api/workflow/tasks/my?status=PENDING

成功标准：
- health 200。
- achievements list 200。
- workflow tasks 200，允许 items 为空。
- 如果 workflow tasks items 为空，继续记录为 DataGap，不当作失败。

4. 可选 smoke 的安全只读接口
仅在可从已有代码/记录确认是 GET 且不会写数据时执行：
- dashboard summary
- search
- fees list
- reminders list / metadata
- attachments metadata list
要求：
- 只做 GET。
- 不带敏感信息输出。
- 如果接口需要额外参数或真实数据，缺数据可以记录为未覆盖，不造数据。
- 如果不确定接口是否安全只读，不执行。

5. Step 14E 总结归档
更新 memory-bank：
- implementation-plan.md
  - Step 14E overall status: DONE 或 PARTIAL/BLOCKED。
  - Step 14E-1/2/3/4 状态。
  - Step 15 not started。
- progress.md
  - Step 14E-4 final gates and smoke。
  - Step 14E overall closure。
- evidence.md
  - 最终门禁结果。
  - API smoke 结果。
  - 未覆盖项和原因。
  - 边界证据。
- decisions.md
  - 通常不需要新决策；D067/D068/D069 已覆盖 DI 工程规则。
  - 如新增最终工程规则，才更新。

6. 边界归档
确认：
- 未改代码。
- 未运行 migrate/seed。
- 未创建/修改业务数据。
- 未修改 schema/package/lockfile。
- 未读取或展示敏感凭证。
- Step 15 未开始。
- Step 14 DataGap 仍不在 Step 14E 解决。

完成后输出：
1. Step 14E-4 是否 DONE。
2. Step 14E overall 是否 DONE / PARTIAL / BLOCKED。
3. 运行了哪些门禁，结果是什么。
4. 后端是否启动；如启动，命令是什么；是否停止了本轮启动进程。
5. 必须 smoke 接口结果。
6. 可选 smoke 接口结果或未执行原因。
7. 是否运行 migrate/seed：必须明确说明。
8. 是否修改代码/schema/package/lockfile：必须明确说明。
9. 是否创建/修改业务数据：必须明确说明。
10. 更新了哪些 memory-bank 文件。
11. Step 15 是否仍未开始。
12. 下一步建议：Step 15 计划确认，或如 Step 14E 未完全通过则先处理阻塞。

最后明确：
- 本轮只执行 Step 14E-4 final gates and readonly smoke。
- 未进入 Step 15。
- 不生成下一步 Prompt。
~~~

~~~
你现在继续 E:\研究院科研成果管理系统 项目。

本轮任务：Step 14 收尾归纳。

背景：
- Step 14 overall 已归档为 DONE_WITH_DATAGAP_RISK。
- Step 14A DONE：范围与契约确认，D065 已记录。
- Step 14B DONE：审批任务详情中关联成果只读查看基础。
- Step 14B-API500 修复链路 DONE：后端 DI / runtime wiring 问题已修复，health / achievements list / workflow tasks 均恢复 200。
- Step 14C DONE：状态、错误、空态、无关联成果边界、390px 移动端体验补齐。
- Step 14D DONE：轻量最终审计，Step 14 归档为 DONE_WITH_DATAGAP_RISK。
- Step 14E DONE：Backend DI Explicit Inject Audit，D067 / D068 / D069 已记录。
- Step 15 尚未开始。

本轮只做归纳总结：
- 不实现功能。
- 不修改代码。
- 不运行 test/build/lint/typecheck。
- 不运行 migrate/seed。
- 不创建、导入或修改业务数据。
- 不进入 Step 15。
- 不生成 Step 15 执行 Prompt。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md
- 不全量读取 prompt.md
- 如果检索结果超过 80 行，停止并改用更窄关键词

建议只读：
1. memory-bank/implementation-plan.md 顶部 Step 14 / Step 14E 最新状态
2. memory-bank/progress.md 顶部 Step 14D / Step 14E 最新记录
3. memory-bank/evidence.md 顶部 Step 14D / Step 14E 最新证据
4. memory-bank/decisions.md 顶部 D065 / D066 / D067 / D068 / D069

请输出 Step 14 收尾归纳，包含：

1. Step 14 最终状态
- Step 14 overall 状态
- Step 14A / 14B / 14C / 14D / 14E 状态
- Step 15 是否已开始

2. Step 14 实现成果归纳
- 审批任务联动成果详情完成了什么
- 前端只读成果详情能力完成了什么
- 状态/错误/空态/移动端体验完成了什么
- 后端 API500 / DI 修复链路完成了什么
- Backend DI Explicit Inject Audit 完成了什么

3. 验证与证据归纳
- web test / typecheck / build / lint 结果
- api test / typecheck / build / lint 结果
- readonly API smoke 结果
- 浏览器验收 PASS / PARTIAL 情况
- 明确哪些证据是复用最近门禁，哪些是 Step 14E-4 新跑的门禁 / smoke

4. DataGap 归纳
- 说明 workflow tasks 当前为空，导致真实“审批任务详情 -> 查看关联成果详情”成功路径未覆盖
- 明确这不是 API500、不是 Step 14 实现失败
- 说明已归档为 DONE_WITH_DATAGAP_RISK
- 说明留到一期整体验收或后续单独数据路线

5. 边界确认
- 未运行 migrate/seed
- 未修改 Prisma schema / migration / seed
- 未修改 package.json / lockfile
- 未新增依赖
- 未读取或展示敏感凭证
- 未创建、导入或修改业务数据
- 未进入 Step 15

6. 决策归纳
- D065：审批上下文只读复用成果详情契约
- D066：Step 14 DONE_WITH_DATAGAP_RISK，Step 14E 优先于 Step 15
- D067：repository PrismaService 显式 Inject 规则
- D068：authorization policy provider 显式 Inject 规则
- D069：service/controller/adapter provider 显式 Inject 规则

7. 后续建议
- 下一步建议新对话进入 Step 15 计划确认
- 如果要补 Step 14 DataGap，应走单独数据路线确认
- 不要在本轮生成 Step 15 执行 Prompt

最后明确：
- 本轮只完成 Step 14 收尾归纳。
- 未实现、未修改代码、未运行 test/build/lint/typecheck、未运行 migrate/seed。
- Step 15 计划确认 Prompt 应由 Prompt 编排对话在用户确认后单独生成。
~~~

## Prompt 11

~~~
你现在继续 E:\研究院科研成果管理系统 项目。

本轮任务：Prompt 11 收尾归纳，并归档到：
E:\研究院科研成果管理系统\prompt.md

本轮定位：
- 这是 Prompt 编排对话的收尾归纳，不是功能实现 Step。
- 目标是把 Prompt 11 的工作方式、关键推进、遇到的问题、纠偏点、后续 Prompt 12 交接信息归档到 prompt.md。
- Prompt 12 与 Prompt 11 定位一致：负责 Step 输出闭环判断、计划确认 Prompt、执行 Prompt、收尾 Prompt，不直接替 Step 对话实现功能。

允许事项：
- 允许只修改 E:\研究院科研成果管理系统\prompt.md。
- 可以对 prompt.md 中 Prompt 编排记录部分做必要重构，使 Prompt 11 收尾内容清晰、便于 Prompt 12 读取。
- 可以新增 “Prompt 11 收尾归纳 / Prompt 12 交接” 小节。
- 可以压缩、整理、重排与本次 Prompt 编排相关的摘要，但不要展开完整聊天记录。

禁止事项：
- 不修改业务代码。
- 不修改 memory-bank。
- 不修改 apps/、packages/、prisma/、scripts/。
- 不运行 test/build/lint/typecheck。
- 不运行 migrate/seed。
- 不创建、导入或修改业务数据。
- 不读取 .env、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不读取 E:\研究院科研成果管理系统\prompt历史记录.md。
- 不全量展开无关历史。
- 不生成 Step 15 执行 Prompt。
- 不进入 Step 15 实现。

必须遵守：
- E:\Vibe coding\AGENTS.md
- Vibe Coding 方法论
- 先索引，后精读
- prompt.md 只读取和本次归档直接相关的小段；如结构不清，先读取目录/标题/末尾近期段落
- 如果检索结果超过 80 行，停止并改用更窄关键词
- 不暴露敏感信息

建议只读上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\03-context-bank.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. E:\研究院科研成果管理系统\prompt.md 的目录、标题或末尾近期 Prompt 记录
6. 必要时只读 memory-bank 顶部最新状态：
   - memory-bank/implementation-plan.md
   - memory-bank/progress.md
   - memory-bank/evidence.md
   - memory-bank/decisions.md

请归档以下内容：

1. Prompt 11 对话定位
- Prompt 11 是 Prompt 编排对话，不是 Step 执行对话。
- 负责判断 Step 输出是否闭环、是否越界、证据是否充分。
- 负责生成下一步计划确认 Prompt、执行 Prompt、收尾归纳 Prompt。
- Step 对话负责按单一 Prompt 执行，不能自行生成下一步 Prompt。

2. Prompt 11 推进结果
- Step 14A DONE：确认 Step 14 方向为“审批任务联动成果详情”，D065 已记录。
- Step 14B DONE：实现审批任务详情中的关联成果只读查看基础。
- Step 14B-API500 修复链路 DONE：清除真实 API 500，health / achievements list / workflow tasks 恢复 200。
- Step 14C DONE：补齐状态、错误、空态、无关联成果边界和 390px 移动端体验。
- Step 14D DONE：Step 14 overall 归档为 DONE_WITH_DATAGAP_RISK，D066 已记录。
- Step 14E DONE：Backend DI Explicit Inject Audit 完成，D067 / D068 / D069 已记录。
- Step 15 未开始。

3. 本轮遇到的关键问题与纠偏
- Step 14B 前曾发生“应该先生成 Step 14A 执行 Prompt，却误认为进入 Step 14B”的编排偏差；后续已纠正为单步推进。
- Step 14B 初次浏览器验收时后端未启动，导致只验证到后端不可用路径；用户指出应启动后端或先确认，后续补做 Step 14B-Verify。
- API500 问题不是数据缺失导致，而是 Nest provider 在 tsx watch dev runtime 下依赖注入不稳定，部分 constructor 依赖为 undefined。
- API500 修复是分层推进的：service/policy factory -> repository -> SecretAccessPolicy，不能一次越界扩大范围。
- Step 14C 初次浏览器验收里存在前端网络桩验证，用户要求真实后端复查，后续补做 Step 14C-Browser-Recheck。
- DataGap 被明确区分：workflow tasks 为空导致真实“任务详情 -> 查看关联成果详情”成功路径未覆盖；这不是 API500，也不是 Step 14 实现失败。
- Step 14E 被设为独立技术债/质量步骤，在 Step 14 完成后、Step 15 前执行。

4. API500 根因与解决归纳
- 根因：api dev 使用 tsx watch src/main.ts 时，部分 Nest provider 依赖 constructor type metadata 注入不稳定，运行时依赖为 undefined。
- 典型错误点：
  - WorkflowService.assertReviewContext 中 rbacPolicy undefined。
  - AchievementService.list 中 policyQueryFactory undefined。
  - AchievementRepository / WorkflowRepository 中 prisma undefined。
  - SecretAccessPolicyService 中 resourceGrantPolicy undefined。
- 解决方式：
  - 对后端 provider 构造依赖补显式 @Inject(...)。
  - 增加 metadata / DI 回归测试。
  - 不改变业务语义、权限、脱敏、查询、workflow 状态机、DTO、schema、migration、seed。
- 后续扩展：
  - Step 14E-1 repository PrismaService explicit inject audit。
  - Step 14E-2 authorization policy explicit inject audit。
  - Step 14E-3 service/controller/adapter explicit inject audit。
  - Step 14E-4 final gates and readonly smoke。

5. 质量证据归纳
- Step 14C web test PASS：7 files / 66 tests。
- web typecheck PASS。
- web build PASS，仅 Vite chunk size warning。
- lint PASS。
- Step 14E-4 api test PASS：51 files / 465 tests。
- api typecheck PASS。
- api build PASS。
- lint PASS。
- readonly smoke：
  - GET /api/health：200。
  - GET /api/achievements?page=1&pageSize=5：200，items=2。
  - GET /api/workflow/tasks/my?status=PENDING：200，items=0。
  - dashboard/search/fees smoke 200。
  - attachments metadata 403，作为权限边界。
- 浏览器验收：
  - no-user、空列表、后端不可用、390px 无横向溢出 PASS。
  - 真实任务详情 -> 关联成果详情成功路径因 DataGap PARTIAL。

6. DataGap 归档
- 当前 workflow tasks 为空，workflow tasks API 返回 200 但 items=0。
- 因此无法打开真实审批任务，无法完整覆盖“审批任务详情 -> 查看关联成果详情”的真实成功路径。
- 该问题归档为验收数据缺口，不是实现失败。
- Step 14 状态为 DONE_WITH_DATAGAP_RISK。
- 后续在一期整体验收或单独数据路线中补，不允许用 fake/mock/seed 冒充真实验收，除非用户明确确认数据路线。

7. 后续 Prompt 12 交接
- Prompt 12 与 Prompt 11 定位一致：Prompt 编排，不直接实现。
- Prompt 12 起点：
  - Step 14 overall：DONE_WITH_DATAGAP_RISK。
  - Step 14E：DONE。
  - Step 15：未开始。
- Prompt 12 首要任务应是 Step 15 计划确认，而不是 Step 15 执行。
- 如果用户选择先补 Step 14 DataGap，应走单独数据路线确认，不混入 Step 15。
- 继续保持：每次只推进一个计划确认或一个执行 Prompt，不跨多个子 Step。
- Step 对话只执行当前 Prompt，不生成下一步 Prompt。

8. 边界确认
- 本轮 Prompt 11 收尾归档只允许修改 prompt.md。
- 不运行任何门禁。
- 不读取敏感配置。
- 不进入 Step 15。
- 不把 Step 14 DataGap 说成已验收通过。

完成后请输出：
1. 修改了 prompt.md 的哪些部分。
2. 归档了哪些 Prompt 11 关键结论。
3. 是否遵守未运行 test/build/lint/typecheck、未运行 migrate/seed、未修改业务代码。
4. Prompt 12 的起点状态。
5. 下一步应由用户新开 Prompt 12 对话，再生成 Step 15 计划确认 Prompt。
~~~

# 15、Step 15

 Step 15A

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 15 计划确认。

本次是 Step 执行对话，但当前只做“计划确认”，不要直接实现 Step 15。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15：未开始。
- Step 14 DataGap 仍存在：本地 workflow tasks 为空，真实“审批任务详情 -> 查看关联成果详情”成功路径未覆盖；这不是 Step 14 实现失败，已留到一期整体验收或单独数据路线。
- 不要在 Step 15 中顺手解决 Step 14 DataGap，除非用户单独确认数据路线。

工作边界：
- 只读必要上下文。
- 不修改源代码。
- 不实现功能。
- 不运行 test / build / lint。
- 不启动或停止服务。
- 不执行 migrate / seed。
- 不读取 `.env` 内容、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不创建、修改、导入、删除业务数据。
- 不新增依赖，不改 package / lockfile。
- 如果发现 Step 15 范围需要数据写入、seed、迁移或高风险操作，只记录为风险和待确认项，不执行。

请按 E:\Vibe coding 的 Vibe Coding 方法论执行计划确认。建议只读：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. E:\研究院科研成果管理系统\prompt.md 中 Prompt 11 / Prompt 12 交接小节
6. memory-bank/implementation-plan.md 顶部最新状态
7. memory-bank/progress.md 顶部最新状态
8. memory-bank/evidence.md 顶部最新证据
9. memory-bank/decisions.md 顶部最新决策
10. product-brief / feature-brief / design-spec 中与 Step 15 候选范围直接相关的小节

计划确认目标：
- 先确认 Step 15 应选择的一期功能方向。
- 根据现有产品 IA 和已完成步骤，优先候选为“费用管理”前端/闭环计划确认：费用台账、预警列表、缴费记录、凭证附件入口等。
- 如果你读到的项目上下文明确指向其他 Step 15 方向，必须说明证据并停在计划确认，不要擅自实现。
- 明确 Step 15 不应混入 Step 14 DataGap、审批任务造数、workflow seed、真实数据补录或一期整体验收数据路线。

请输出：
1. 当前状态复核：Step 14 / Step 14E / Step 15 / DataGap。
2. Step 15 建议方向与依据。
3. 任务分类：按 Vibe Coding 标准判断 XS/S/M/L，并说明理由。
4. Step 15 目标、非目标、成功标准。
5. 建议拆分为哪些子步骤，例如 Step 15A / 15B / 15C，但只给计划，不执行。
6. 每个子步骤的文件范围、验证方式、浏览器/API 验收思路和风险。
7. 明确下一步只能进入用户确认后的 Step 15A 执行 Prompt，不能直接实现 Step 15。
8. 如需更新 memory-bank，请先说明建议更新内容；本轮不要直接改文件，除非用户明确授权。

输出最后请给出一句：
“等待用户确认 Step 15 计划后，再生成 Step 15A 执行 Prompt。”
~~~

## Step 15A 

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 15A 执行。

本次任务：实现 Step 15A - 费用管理只读前端基础。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15：已完成计划确认，方向为“费用管理前端/闭环”。
- Step 15A：未开始。
- Step 14 DataGap 仍存在：workflow tasks 为空导致真实“审批任务详情 -> 查看关联成果详情”成功路径未覆盖。不要在 Step 15A 中处理它。

工作目标：
- 将前端“费用管理”从占位页变成可用的只读费用台账基础页面。
- 接入现有后端 `GET /fees`。
- 展示费用列表、状态筛选、基础预警摘要。
- 覆盖加载、空态、错误态、无用户态。
- 适配桌面与 390px 移动端，不出现横向溢出。
- 更新必要 memory-bank 记录，说明 Step 15A 范围、证据和边界。

只读业务边界：
- Step 15A 不创建费用。
- 不标记缴费。
- 不上传/下载凭证附件。
- 不新增 `GET /fees/warnings`。
- 不新增后端 API。
- 不修改后端业务语义、schema、migration、seed、package、lockfile 或依赖。
- 不执行 migrate / seed。
- 不创建、修改、导入或删除业务数据。
- 不读取 `.env` 内容、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不解决 Step 14 DataGap。
- 不伪造费用、预警或附件能力。

建议先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. E:\研究院科研成果管理系统\prompt.md 中 Prompt 11 / Prompt 12 交接小节
6. memory-bank/implementation-plan.md 顶部最新状态
7. memory-bank/progress.md 顶部最新状态
8. memory-bank/evidence.md 顶部最新证据
9. memory-bank/decisions.md 顶部最新决策
10. 与费用前端直接相关的现有代码：
   - apps/web/src/App.tsx
   - apps/web/src/types.ts
   - apps/web/src/api-client 或等价 API helper
   - apps/web/src 中现有成果/审批页面组件和测试模式
   - apps/web/src 现有样式文件
11. 与费用 API 契约直接相关的后端 controller / DTO / 测试小范围文件，只读确认 `GET /fees` 响应形态，不展开无关后端历史。

实现范围：
- 在前端新增或扩展费用管理页面。
- 接入导航中的“费用管理”入口。
- 增加费用列表类型定义，必须匹配真实 `GET /fees` 响应形态；不要假设它和成果列表分页完全一致。
- 使用当前项目既有 API client、用户上下文和错误处理模式。
- 状态筛选至少覆盖：全部、待缴/逾期/已缴等后端已有 payStatus 值；如果后端状态枚举不同，以真实 DTO / 类型为准。
- 基础预警摘要可基于 `dueDate` 和 `payStatus` 从列表派生，例如逾期、即将到期、已完成；必须标注这是前端派生视图，不声称接入独立 warnings API。
- 无用户态不得发起业务请求。
- 后端不可用或接口错误时展示可理解错误态。
- 空列表时展示空态。
- 移动端 390px 不横向溢出。

测试与验证要求：
- 增加或更新前端测试，覆盖：
  - 无用户态不请求 `GET /fees`。
  - 有用户时请求 `GET /fees` 并渲染列表。
  - 加载态、空态、错误态。
  - 状态筛选。
  - 基于 dueDate/payStatus 的预警摘要派生。
- 运行并记录：
  - `corepack pnpm --filter @research-ip/web test`
  - `corepack pnpm --filter @research-ip/web typecheck`
  - `corepack pnpm --filter @research-ip/web build`
  - 如项目当前要求全局 lint，则运行 `corepack pnpm lint`
- 如能启动/复用前端进行浏览器验收，请验证：
  - no-user 不发业务请求。
  - 选择演示用户后费用列表可展示或空态正确。
  - 后端不可用错误态。
  - 390px 移动端无横向溢出。
- 如果浏览器验收或后端联调无法运行，必须说明原因、替代验证和剩余风险。

memory-bank 更新要求：
- 更新 `memory-bank/implementation-plan.md` 顶部，记录 Step 15A 当前状态、范围、边界、验证计划和下一步。
- 更新 `memory-bank/progress.md` 顶部，记录 Step 15A 实施结果、文件范围、门禁结果和边界。
- 更新 `memory-bank/evidence.md` 顶部，记录测试/build/lint/浏览器或替代验证证据。
- 必要时更新 `memory-bank/decisions.md`，记录：
  - Step 15A 费用前端只读基础复用现有 `GET /fees`。
  - 不新增 warnings API。
  - 不伪造凭证附件能力。
  - 不混入 Step 14 DataGap 或任何数据造数路线。

完成输出要求：
1. 说明 Step 15A 是否 DONE。
2. 列出修改文件。
3. 汇报测试、typecheck、build、lint 和浏览器验收结果。
4. 明确未覆盖范围和剩余风险。
5. 明确 Step 15B 只能在用户确认后继续，不能直接进入。
~~~

## Step 15B

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 15B 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15A：DONE，已完成费用管理只读前端基础。
- Step 15B：未开始。
- Step 14 DataGap 仍存在，但不得混入 Step 15B。

Step 15A 已交付：
- “费用管理”进入真实只读费用台账页面。
- 复用现有 `GET /fees`。
- 已有状态/类型/achievementId 筛选、前端派生预警摘要、no-user/loading/empty/error/list 状态、390px 响应式。
- 已记录 D070：不新增 warnings API、不伪造凭证附件、不混入 DataGap、不做写操作。

请只读必要上下文：
1. memory-bank/implementation-plan.md 顶部 Step 15A 状态。
2. memory-bank/progress.md 顶部 Step 15A 结果。
3. memory-bank/evidence.md 顶部 Step 15A 证据。
4. memory-bank/decisions.md 顶部 D070。
5. apps/web/src/Fees.tsx、Fees.test.ts、types.ts 中与 Step 15B 直接相关部分。
6. 后端 fees controller / DTO 中与 `GET /fees/:id` 直接相关的小范围契约。

请输出 Step 15B 计划确认：
- 建议目标：费用详情与预警列表体验。
- 明确是否只读；默认只读，不创建费用、不 mark-paid、不上传/下载凭证。
- 计划接入 `GET /fees/:id` 详情抽屉或详情区域。
- 基于现有 `GET /fees` 数据增强预警列表/分组体验，不新增 `GET /fees/warnings`。
- 补齐 403/404/500/network、空态、加载态、详情无权限、390px 移动端验收计划。
- 明确文件范围、测试范围、浏览器验收方式、memory-bank 更新建议。
- 明确 Step 15C 写操作必须单独确认本地业务数据写入边界，不能在 Step 15B 越界实现。

最后输出：
“等待用户确认 Step 15B 计划后，再生成 Step 15B 执行 Prompt。”
~~~



## Step 15C

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 15C 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15A：DONE，费用管理只读台账基础已完成。
- Step 15B：DONE，费用详情与前端派生预警分组已完成。
- Step 15C：未开始。
- Step 14 DataGap 仍存在，但不得混入 Step 15C。

Step 15B 已交付：
- 费用详情复用现有 `GET /fees/:id`。
- 详情入口使用 fee record `id`，不是 `achievementId`。
- 预警分组仍为当前 `GET /fees` 列表的前端派生。
- 未新增 `GET /fees/warnings`。
- 未实现费用创建、标记缴费、凭证上传/下载或任何写操作。

请只读必要上下文：
1. memory-bank/implementation-plan.md 顶部 Step 15B 状态。
2. memory-bank/progress.md 顶部 Step 15B 结果。
3. memory-bank/evidence.md 顶部 Step 15B 证据。
4. memory-bank/decisions.md 顶部 D070 / D071。
5. apps/web/src/Fees.tsx、Fees.test.ts、types.ts 中与 Step 15C 直接相关部分。
6. 后端 fees controller / DTO / service 中与 `POST /fees`、`POST /fees/:id/mark-paid` 直接相关的小范围契约。

请输出 Step 15C 计划确认：
- 建议目标：费用创建与标记缴费入口。
- 明确 Step 15C 涉及本地演示业务数据写入，执行前必须等待用户确认数据写入边界。
- 计划接入现有 `POST /fees` 和 `POST /fees/:id/mark-paid`，不新增后端 API。
- 明确是否允许浏览器/API 真实写入验收；如果用户未确认，只能计划组件/单元层验证，不能执行写入。
- 明确不做：凭证附件上传/下载、独立 warnings API、schema/migration/seed、财务系统对接、Step 14 DataGap。
- 说明表单字段、校验、错误语义、成功刷新、详情同步、移动端验收计划。
- 说明文件范围、测试范围、浏览器验收方式、memory-bank 更新建议。
- 明确 Step 15D 或后续凭证附件入口必须另行确认，不能在 Step 15C 越界实现。

最后输出：
“等待用户确认 Step 15C 计划及本地演示数据写入边界后，再生成 Step 15C 执行 Prompt。”
~~~

~~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 15C 执行。

本次任务：实现 Step 15C - 费用创建与标记缴费前端入口，但不允许真实写入本地业务数据。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15A：DONE，费用管理只读台账基础已完成。
- Step 15B：DONE，费用详情与前端派生预警分组已完成。
- Step 15C：未开始。
- Step 14 DataGap 仍存在，不得混入 Step 15C。

用户已确认写入边界：
- 不允许真实写入本地演示业务数据。
- 本步骤只能做前端实现 + 单元/组件层验证。
- 浏览器只允许做表单打开、填写校验、取消/关闭、响应式检查。
- 不允许点击最终提交导致真实 `POST /fees`。
- 不允许点击最终标记缴费导致真实 `POST /fees/:id/mark-paid`。
- 不允许 API 真实写入验收。
- 不允许 seed/migrate/数据补录/数据清理路线。

工作目标：
- 在费用管理页增加“新增费用”前端入口。
- 接入现有 `POST /fees` 的前端 helper、payload shaping、状态与错误展示模型，但真实浏览器验收不得发 POST。
- 在费用详情或列表中为 `PENDING` / `OVERDUE` 费用增加“标记缴费”前端入口。
- 接入现有 `POST /fees/:id/mark-paid` 的前端 helper、payload shaping、状态与错误展示模型，但真实浏览器验收不得发 POST。
- 成功路径通过单元/组件测试验证：成功后刷新 `GET /fees` 列表、前端派生预警分组；如详情打开，同步刷新 `GET /fees/:id`。
- 覆盖 no-user、loading、success、400、403、404、409、500/network 等状态。
- 390px 移动端下新增费用表单、标记缴费表单、详情抽屉无文档级横向溢出。
- 更新 memory-bank，明确 Step 15C 未进行真实写入。

严格禁止：
- 不得真实创建费用记录。
- 不得真实标记缴费。
- 不得发真实 `POST /fees` 或 `POST /fees/:id/mark-paid` 做浏览器/API 验收。
- 不得上传/下载凭证附件。
- 不得新增 `GET /fees/warnings`。
- 不得新增后端 API。
- 不得修改后端业务语义、controller contract、schema、migration、seed、package、lockfile 或依赖。
- 不得执行 migrate / seed。
- 不得创建、修改、导入、删除业务数据。
- 不得读取 `.env` 内容、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不得解决 Step 14 DataGap。
- 不得伪造成果标题、附件、审批、审计、凭证文件或独立 warnings API 能力。
- 不得自动清理或回滚数据，因为本步骤不应写入数据。

建议先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. memory-bank/implementation-plan.md 顶部 Step 15B 状态
6. memory-bank/progress.md 顶部 Step 15B 结果
7. memory-bank/evidence.md 顶部 Step 15B 证据
8. memory-bank/decisions.md 顶部 D070 / D071
9. apps/web/src/Fees.tsx
10. apps/web/src/Fees.test.ts
11. apps/web/src/types.ts
12. apps/web/src/App.css
13. 后端费用写接口契约小范围只读确认：
    - apps/api/src/fees/fee.controller.ts
    - apps/api/src/fees/fee.service.ts
    - apps/api/src/fees/dto 中与 create / mark-paid 直接相关文件
    - 只读确认字段与错误语义，不修改后端

实现范围：
1. 类型与 helper
   - 增加 `CreateFeeRecordInput`。
   - 增加 `MarkFeePaidInput`。
   - 增加 `createFeeRecord` helper，对应 `POST /fees`。
   - 增加 `markFeePaid` helper，对应 `POST /fees/:id/mark-paid`。
   - no-user / 空 id 时不得请求。
   - helper 测试可以使用 fake client / mocked request 验证 endpoint 与 payload，不访问真实后端。

2. 新增费用表单
   - 增加“新增费用”按钮与抽屉/弹窗表单。
   - 字段：
     - `achievementId`：必填 UUID。
     - `feeType`：必填，使用后端已有枚举。
     - `fundSource`：可选，使用后端已有枚举。
     - `amount`：必填，数字，最小 0，最多 2 位小数。
     - `dueDate`：必填，日期字符串。
     - `voucherNo`：可选，1-120 字符；仅凭证号，不上传文件。
   - 前端基础校验覆盖必填、UUID、金额、日期、voucherNo 长度。
   - 400 / 403 / 404 / 409 / 500 / network 显示可理解错误。
   - 单元/组件测试模拟成功后刷新列表；浏览器不点击最终提交。

3. 标记缴费表单
   - 仅对 `PENDING` / `OVERDUE` 展示“标记缴费”入口。
   - `PAID` / `WAIVED` / `CANCELLED` 等终态只读展示，不给写按钮。
   - 字段：
     - `paidDate`：可选日期字符串；不填交给后端。
     - `voucherNo`：可选，1-120 字符；仅登记凭证号，不上传文件。
   - 400 / 403 / 404 / 409 / 500 / network 显示可理解错误。
   - 单元/组件测试模拟成功后刷新列表、预警分组和当前详情；浏览器不点击最终标记缴费。

4. UI / 响应式
   - 保持费用页当前设计风格。
   - 按钮、表单、错误、成功提示、抽屉在桌面和 390px 下不造成文档级横向溢出。
   - 不使用落地页或说明页替代真实控件。
   - 不把“凭证附件上传/下载”伪装为可用能力；最多保留凭证号字段和后续边界说明。

测试与验证要求：
- 增加或更新前端测试，覆盖：
  - `POST /fees` endpoint 与 payload shaping。
  - `POST /fees/:id/mark-paid` endpoint 与 payload shaping。
  - no-user 不发写请求。
  - 空 fee id 不发 mark-paid。
  - 新增费用表单校验。
  - 标记缴费表单校验。
  - PENDING / OVERDUE 展示 mark-paid；PAID / WAIVED / CANCELLED 不展示。
  - 400 / 403 / 404 / 409 / 500 / network 错误展示模型。
  - 模拟成功后刷新列表；详情打开时刷新详情。
  - 不调用 `GET /fees/warnings`。
  - 不调用附件上传/下载接口。
- 运行并记录：
  - `corepack pnpm --filter @research-ip/web test`
  - `corepack pnpm --filter @research-ip/web typecheck`
  - `corepack pnpm --filter @research-ip/web build`
  - `corepack pnpm lint`
- 浏览器验收只允许：
  - no-user 费用页边界态。
  - demo user 打开“新增费用”表单，验证必填/格式校验，关闭；不得最终提交。
  - demo user 打开“标记缴费”表单，验证可见性、基础校验，关闭；不得最终提交。
  - 390px 下新增费用表单、标记缴费表单、详情抽屉无文档级横向溢出。
- 浏览器验收禁止：
  - 不点击会触发真实 `POST /fees` 的最终提交。
  - 不点击会触发真实 `POST /fees/:id/mark-paid` 的最终提交。
  - 不构造真实写入 API smoke。

memory-bank 更新要求：
- 更新 `memory-bank/implementation-plan.md` 顶部，记录 Step 15C 当前状态、范围、无真实写入边界、验证和下一步。
- 更新 `memory-bank/progress.md` 顶部，记录 Step 15C 实施结果、文件范围、门禁结果和边界。
- 更新 `memory-bank/evidence.md` 顶部，记录测试/build/lint/浏览器或替代验证证据，并明确没有真实 POST。
- 更新 `memory-bank/decisions.md`，新增 D072：
  - Step 15C 复用现有 `POST /fees` 与 `POST /fees/:id/mark-paid`。
  - 本轮不允许真实写入本地业务数据。
  - 写成功路径仅通过前端测试模拟验证。
  - 浏览器只验证表单打开、校验、取消和响应式。
  - 不新增后端 API、不做附件、不处理 DataGap。

完成输出要求：
1. 说明 Step 15C 是否 DONE。
2. 列出修改文件。
3. 汇报 test、typecheck、build、lint 和浏览器验收结果。
4. 明确没有真实 `POST /fees` 或 `POST /fees/:id/mark-paid`。
5. 明确未覆盖范围和剩余风险。
6. 明确任何真实写入验收、凭证附件入口或 Step 15D 都必须等待用户单独确认，不能直接进入。
~~~~

## Step 15D

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 15D 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15A：DONE，费用管理只读台账基础。
- Step 15B：DONE，费用详情与前端派生预警分组。
- Step 15C：DONE_WITHOUT_REAL_WRITE，费用创建与标记缴费前端入口已完成，但未做真实写入。
- Step 14 DataGap 仍存在，但不得混入 Step 15D。

请只读必要上下文：
1. memory-bank/implementation-plan.md 顶部 Step 15C 状态。
2. memory-bank/progress.md 顶部 Step 15C 结果。
3. memory-bank/evidence.md 顶部 Step 15C 证据。
4. memory-bank/decisions.md 顶部 D070 / D071 / D072。
5. apps/web/src/Fees.tsx、Fees.test.ts、types.ts 中与费用凭证边界和 Step 15 收尾直接相关部分。
6. 如需确认附件能力，只读现有 attachment API/前端入口的小范围契约，不修改后端。

请输出 Step 15D 计划确认：
- 建议目标：费用凭证附件边界入口与 Step 15 收尾归档。
- 默认不做真实附件上传/下载、不做真实费用写入、不做真实 mark-paid。
- 明确凭证附件在 Step 15D 中只能做“能力边界展示 / 后续入口说明 / 与 voucherNo 的关系说明”，除非上下文已有安全可用的现成附件只读入口。
- 不新增后端 API。
- 不新增 schema/migration/seed/dependency。
- 不新增 `GET /fees/warnings`。
- 不处理 Step 14 DataGap。
- 不伪造附件文件、下载链接、上传成功或审计详情。
- 计划检查 Step 15A/B/C 是否整体闭环：费用台账、详情、前端派生预警、创建/标记缴费前端入口、无真实写入边界。
- 说明是否需要补前端文案、测试、响应式、小范围收尾修正。
- 说明 Step 15 最终归档需要更新哪些 memory-bank 内容，如何记录 `DONE_WITHOUT_REAL_WRITE_RISK` 或等价状态。
- 明确如果用户希望真实写入验收，应另开“Step 15 Real Write Acceptance / Data Route”确认 demo user、achievementId、允许写入和数据保留策略，不能混入 Step 15D。

最后输出：
“等待用户确认 Step 15D 计划后，再生成 Step 15D 执行 Prompt。”
~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 15D 执行。

本次任务：实现 Step 15D - 费用凭证附件边界入口与 Step 15 收尾归档。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15A：DONE，费用台账只读基础。
- Step 15B：DONE，费用详情与前端派生预警分组。
- Step 15C：DONE_WITHOUT_REAL_WRITE，费用创建与标记缴费前端入口已完成，但未做真实写入。
- Step 15D：未开始。
- Step 14 DataGap 仍存在，不得混入 Step 15D。

工作目标：
- 收口费用凭证附件边界说明。
- 明确 `voucherNo` 是凭证编号字段，不等于附件上传/下载能力。
- 明确费用凭证附件能力需要后续单独确认，不在 Step 15D 实现。
- 清理 Step 15A/B/C 遗留或过期文案，例如仍写“等待 Step 15B/15C/15D 计划确认后实现”的提示。
- 补强边界测试：不调用附件接口、不调用 warnings API、不触发真实写入。
- 完成 Step 15 overall 收尾归档，建议状态为 `DONE_WITHOUT_REAL_WRITE_RISK`。
- 更新 memory-bank 证据与决策。

严格边界：
- 不新增后端 API。
- 不新增 schema / migration / seed / dependency。
- 不新增 `GET /fees/warnings`。
- 不做真实 `POST /fees`。
- 不做真实 `POST /fees/:id/mark-paid`。
- 不做真实附件上传。
- 不做真实附件下载。
- 不生成附件下载链接。
- 不显示“上传成功”或“可下载凭证文件”等伪能力。
- 不复用 achievement attachment API 冒充 fee voucher attachment。
- 不处理 Step 14 DataGap。
- 不读取 `.env` 内容、DATABASE_URL、密码、Token、Cookie、证书、私钥或完整连接串。
- 不创建、修改、导入、删除业务数据。
- 不执行 migrate / seed。
- 不清理或回滚数据。

建议先只读必要上下文：
1. E:\Vibe coding\AGENTS.md
2. E:\Vibe coding\vibe-methodology\00-operating-protocol.md
3. E:\Vibe coding\vibe-methodology\01-task-classification.md
4. E:\Vibe coding\vibe-methodology\08-quality-gates.md
5. memory-bank/implementation-plan.md 顶部 Step 15C 状态
6. memory-bank/progress.md 顶部 Step 15C 结果
7. memory-bank/evidence.md 顶部 Step 15C 证据
8. memory-bank/decisions.md 顶部 D070 / D071 / D072
9. apps/web/src/Fees.tsx
10. apps/web/src/Fees.test.ts
11. apps/web/src/types.ts
12. apps/web/src/App.css
13. 如需确认附件能力，只读现有 attachment API / 前端入口的小范围契约；不得修改后端，也不得扩大为附件实现任务。

实现范围：
1. 费用凭证附件边界文案收口
   - 在费用详情、创建费用表单、标记缴费表单中统一说明：
     - `voucherNo` 仅表示凭证编号。
     - Step 15 不提供凭证附件上传/下载。
     - 费用凭证附件需要后续单独确认接口与数据路线。
   - 移除或更新过期的 Step 15A/B/C/D 提示文案。
   - 不增加上传控件、下载链接或文件状态。

2. 边界测试补强
   - 更新 `Fees.test.ts`，覆盖：
     - 页面 / 表单不出现上传凭证文件、下载凭证文件、上传成功、可下载等伪能力文案。
     - helper 不调用 `/attachments` 或附件上传/下载相关 endpoint。
     - helper 不调用 `GET /fees/warnings`。
     - Step 15C fake-client 写路径仍只在测试中模拟，不代表真实浏览器/API 写入。
     - 终态费用仍不展示 mark-paid。
     - `voucherNo` 文案与字段含义为凭证编号。
   - 不新增真实 API 写入测试。

3. 响应式与浏览器只读验收
   - 如启动/复用前端：
     - no-user 费用页边界态。
     - demo user 费用详情展示凭证编号与附件边界说明。
     - demo user 打开新增费用表单，确认有凭证编号字段和附件能力边界说明，关闭，不提交。
     - demo user 打开标记缴费表单，确认有凭证编号字段和附件能力边界说明，关闭，不提交。
     - 390px 下费用页、费用详情、创建表单、标记缴费表单无文档级横向溢出。
   - 严禁点击真实提交。
   - 严禁上传/下载文件。

4. Step 15 收尾归档
   - 在 `memory-bank/implementation-plan.md` 顶部记录：
     - Step 15D 状态。
     - Step 15 overall 建议状态：`DONE_WITHOUT_REAL_WRITE_RISK`。
     - 已完成能力：费用台账、详情、前端派生预警、创建/标记缴费前端入口、凭证附件边界说明。
     - 未完成/风险：真实写入验收、真实凭证附件能力、独立 warnings API、Step 14 DataGap。
   - 在 `memory-bank/progress.md` 顶部记录实施结果、文件范围、门禁和浏览器验收。
   - 在 `memory-bank/evidence.md` 顶部记录测试/build/lint/浏览器证据，并明确：
     - 无真实 `POST /fees`。
     - 无真实 `POST /fees/:id/mark-paid`。
     - 无附件上传/下载。
     - 无 seed / migrate / 数据补录 / 数据清理。
   - 在 `memory-bank/decisions.md` 新增 D073：
     - Step 15D 只做凭证附件边界与 Step 15 收尾。
     - 不实现真实附件能力。
     - 不新增 API。
     - 不处理 DataGap。
     - Step 15 overall 归档为 `DONE_WITHOUT_REAL_WRITE_RISK`。

验证要求：
- 运行并记录：
  - `corepack pnpm --filter @research-ip/web test`
  - `corepack pnpm --filter @research-ip/web typecheck`
  - `corepack pnpm --filter @research-ip/web build`
  - `corepack pnpm lint`
- 浏览器只读验收如可行，按上述范围执行。
- 如果浏览器验收无法运行，说明原因、替代验证和剩余风险。

完成输出要求：
1. 说明 Step 15D 是否 DONE。
2. 说明 Step 15 overall 是否归档为 `DONE_WITHOUT_REAL_WRITE_RISK`。
3. 列出修改文件。
4. 汇报 test、typecheck、build、lint 和浏览器只读验收结果。
5. 明确没有真实 POST、没有附件上传/下载、没有 seed/migrate、没有处理 Step 14 DataGap。
6. 明确真实写入验收或真实凭证附件能力必须另开单独确认路线，不能直接进入。
~~~

~~~
# Step 15 收尾归纳 - 费用管理前端闭环

## 定位

Step 15 方向为“费用管理前端 / 一期费用管理闭环”。本轮仍遵守 Prompt 编排与 Step 执行分工：Prompt 对话负责计划确认、执行 Prompt、收尾判断；Step 对话负责按单一 Prompt 执行。

## 最终状态

- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15A：DONE。
- Step 15B：DONE。
- Step 15C：DONE_WITHOUT_REAL_WRITE。
- Step 15D：DONE。
- Step 15 overall：DONE_WITHOUT_REAL_WRITE_RISK。

## 已完成能力

- 费用管理从占位页变为真实前端页面。
- 接入现有 `GET /fees`，展示费用台账。
- 支持 pay status / fee type / achievementId 筛选。
- 基于当前 `GET /fees` 列表派生预警摘要与分组。
- 接入现有 `GET /fees/:id`，提供只读费用详情。
- 增加“新增费用”和“标记缴费”前端入口。
- 写操作只通过 fake-client 单元测试验证 endpoint、payload、错误语义和刷新逻辑。
- 收口 `voucherNo` 边界：它是“凭证编号”，不是附件上传/下载能力。
- 明确费用凭证附件能力未实现，不伪造上传、下载、成功态或下载链接。
- 完成 no-user、loading、empty、error、ready、390px 响应式等体验覆盖。

## 关键决策

- D070：Step 15A 费用前端只读基础复用现有 `GET /fees`，不新增 warnings API，不伪造附件能力。
- D071：Step 15B 费用详情复用 `GET /fees/:id`，预警分组仍为前端派生。
- D072：Step 15C 写入口仅前端实现，不做真实本地业务数据写入。
- D073：Step 15D 只做凭证附件边界与 Step 15 收尾，Step 15 overall 归档为 `DONE_WITHOUT_REAL_WRITE_RISK`。

## 验证证据

最终 Step 15D 记录：

- `corepack pnpm --filter @research-ip/web test`：PASS，8 files / 99 tests。
- `corepack pnpm --filter @research-ip/web typecheck`：PASS。
- `corepack pnpm --filter @research-ip/web build`：PASS，仅既有 Vite large chunk warning。
- `corepack pnpm lint`：PASS。
- 浏览器只读验收：PASS。
- 390px 下费用页、详情抽屉、新增费用表单、标记缴费表单无文档级横向溢出。

## 明确未做

- 未真实执行 `POST /fees`。
- 未真实执行 `POST /fees/:id/mark-paid`。
- 未做 API 写入 smoke。
- 未上传或下载凭证附件。
- 未新增 `GET /fees/warnings`。
- 未新增后端 API。
- 未改 schema / migration / seed / dependency / lockfile。
- 未做 seed、migrate、数据补录、数据清理。
- 未处理 Step 14 DataGap。

## 剩余风险 / 后续独立路线

- 真实费用创建与标记缴费的持久化验收仍未覆盖。
- 真实写接口 400 / 403 / 404 / 409 / 500 / network 响应仍未通过浏览器/API 验收。
- 真实费用凭证附件能力未实现，需要单独确认 API、授权、存储、审计与 UX。
- 独立 warnings API 未实现。
- Step 14 DataGap 仍存在，需一期整体验收或单独数据路线处理。

## 下一步建议

不要直接进入实现。下一步应做 Step 16 计划确认。

Step 16 不应混入：
- Step 14 DataGap。
- Step 15 真实写入验收。
- 真实费用凭证附件能力。
- seed / migrate / 数据补录。
~~~

# 16、Step 16

## Step 16A

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16A 执行。

本轮目标：实现“检索中心只读前端基础闭环”。

必须遵守：
- 这是 Step 执行对话，可以修改与 Step 16A 直接相关的项目文件。
- 不删除文件、不运行 seed/migrate、不做数据补录/清理。
- 不读取 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。
- 不发起任何写接口。
- 不实现 Step 14 DataGap。
- 不实现 Step 15 真实费用写入验收。
- 不实现真实费用凭证附件。
- 不实现独立 `GET /fees/warnings` 或 warnings API。
- 不改后端 `GET /search` 语义，不新增后端 API。
- 不实现 Meilisearch / 外部搜索引擎同步。
- 不实现 `search_logs` 写入。
- 不混入统计看板、审计日志、系统配置。

当前已确认：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15 overall：DONE_WITHOUT_REAL_WRITE_RISK。
- Step 15A/B/D：DONE。
- Step 15C：DONE_WITHOUT_REAL_WRITE。
- Step 16 计划确认：DONE，方向为“检索中心前端”。

后端搜索契约：
- 路由：`GET /search`。
- 查询参数：
  - `keyword?: string`，最大 120。
  - `targetTypes?: ACHIEVEMENT | FEE_RECORD`；后端支持数组，但 Step 16A 可先用单值筛选，避免扩展 API client 多值序列化。
  - `take?: number`，1-50。
  - 其他筛选如 `achievementType`、`achievementStatus`、`feeType`、`payStatus`、`departmentId` 留到 Step 16B，除非实现中自然需要且不扩大风险。
- 返回：
  - `{ items, total }`
  - `ACHIEVEMENT` item：`id,type,status,departmentId,secretLevel,title,identifiers,redacted,createdAt,updatedAt`
  - `FEE_RECORD` item：`id,achievementId,departmentId,feeType,payStatus,dueDate,paidDate,createdAt,updatedAt`
- 注意：
  - `redacted: true` 的成果 `title` 可能为 `null`，`identifiers` 可能为空，前端必须显示权限/脱敏提示，不能伪造标题或编号。
  - 费用搜索结果不包含 amount、voucherNo、附件能力，不要展示或暗示这些字段。

建议读取上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部最新状态。
6. `memory-bank/progress.md` 顶部 Step 15D 结果。
7. `memory-bank/evidence.md` 顶部 Step 15D 证据。
8. `memory-bank/decisions.md` 顶部 D070-D073。
9. `apps/web/src/App.tsx`
10. `apps/web/src/api-client.ts`
11. 现有前端页面模式：`Achievements.tsx`、`Fees.tsx`、`WorkflowTasks.tsx` 中与只读列表、状态块、错误处理、API client 使用相关的小范围。
12. 后端搜索小范围契约：`apps/api/src/search/dto/search-query.dto.ts`、`apps/api/src/search/domain/search-domain.types.ts`、`apps/api/src/search/search.service.ts`。

实现范围：
- 新增 `apps/web/src/Search.tsx`。
- 新增或按项目命名习惯添加 `apps/web/src/Search.test.tsx`。
- 更新 `apps/web/src/types.ts`，加入搜索查询、结果类型。
- 更新 `apps/web/src/App.tsx`：
  - 导入并渲染 `Search`。
  - 将 `search` 导航从边界页改为真实检索页。
  - 将检索中心 step/description 更新为 Step 16A。
- 更新 `apps/web/src/App.css`，补充检索页面、结果列表、移动端样式。
- 仅当确实需要时才修改 `api-client.ts` / `api-client.test.ts`；Step 16A 优先避免多值 query 扩展。

Step 16A 功能要求：
- 未选择 demo user 时：
  - 显示边界提示。
  - 不调用 `GET /search`。
- 选择 demo user 后：
  - 页面可输入关键词。
  - 支持结果类型筛选：全部 / 成果 / 费用。实现为单值 `targetTypes` 或不传值。
  - 默认 `take=20`，不要超过 50。
  - 调用 `GET /search`。
  - 展示 loading、empty、error、ready 状态。
  - 展示 total。
- 成果结果：
  - 显示成果类型、状态、密级、部门 ID、更新时间。
  - 未脱敏时展示 title 和 identifiers。
  - 脱敏时展示权限/脱敏提示，不展示空标题伪装内容。
- 费用结果：
  - 显示 fee id、achievementId、feeType、payStatus、dueDate、paidDate、departmentId。
  - 不展示 amount、voucherNo、附件上传/下载、凭证文件能力。
- UI：
  - 桌面与 390px 宽度不出现 document-level 横向溢出。
  - 不使用营销式落地页；这是工作型业务页面。
  - 保持现有 Ant Design 与项目页面风格。

测试要求：
- no-user 不请求搜索接口。
- demo user 请求 `GET /search`，包含 `keyword`、`take`，按筛选传或不传 `targetTypes`。
- 空 keyword 能安全请求或按页面设计显示默认检索，但行为必须清晰。
- loading / empty / error / ready 状态覆盖。
- 400 / 401 / 403 / 500 / network 错误文案覆盖。
- ACHIEVEMENT 和 FEE_RECORD 两类结果展示覆盖。
- redacted achievement 不泄露 title/identifiers。
- fee result 不展示 amount、voucherNo、附件能力。
- 不调用 `POST`、`PATCH`、`/fees/warnings`、附件上传/下载端点。

执行阶段门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器只读验收：
- 如需要浏览器验收，可临时启动前端 dev server；若已有后端在 3000，只能复用，不要停止既有后端。
- no-user 打开检索中心：确认无业务请求边界提示。
- demo user 打开检索中心：搜索安全关键词，如 `demo`，确认结果或空态可用。
- 切换 全部 / 成果 / 费用。
- 390px 检查无 document-level 横向溢出。
- 不做任何写入请求。

memory-bank 更新：
- `memory-bank/implementation-plan.md` 顶部新增 Step 16A 当前状态。
- `memory-bank/progress.md` 新增 Step 16A 结果。
- `memory-bank/evidence.md` 新增 Step 16A 证据。
- `memory-bank/decisions.md` 新增 D074：Step 16A 检索中心复用现有 `GET /search`，只读、不改后端、不写数据、不实现 Meilisearch/search_logs。

完成后汇报：
1. 修改了哪些文件。
2. 实现了哪些能力。
3. 跑了哪些门禁及结果。
4. 浏览器/API 只读验收结果。
5. 明确未覆盖和剩余风险。
6. 明确下一步建议是 Step 16B 计划确认，而不是自动继续实现。
~~~

## Step 16B

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16B 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15 overall：DONE_WITHOUT_REAL_WRITE_RISK。
- Step 15A/B/D：DONE。
- Step 15C：DONE_WITHOUT_REAL_WRITE。
- Step 16 计划确认：DONE，方向为检索中心前端。
- Step 16A：DONE，已完成只读检索中心前端基础闭环。

Step 16A 已完成：
- `search` 导航已接入真实 `Search` 页面。
- 复用现有 `GET /search`。
- no-user 不请求业务接口。
- demo user 默认请求 `GET /search?take=20`。
- 支持关键词与单值结果类型筛选：全部 / 成果 / 费用。
- 覆盖 loading / empty / error / ready。
- 保留成果 redacted 脱敏语义，不伪造 title / identifiers。
- 费用结果只展示后端返回的只读字段，不展示 amount、voucherNo、附件上传/下载能力。
- Step 16A 状态：DONE。

Step 16A 证据：
- `corepack pnpm --filter @research-ip/web test`: PASS，9 files / 112 tests。
- `corepack pnpm --filter @research-ip/web typecheck`: PASS。
- `corepack pnpm --filter @research-ip/web build`: PASS，仅既有 Vite large chunk warning。
- `corepack pnpm lint`: PASS。
- 浏览器/API 只读验收通过，390px 无 document-level 横向溢出。
- D074 已记录：Step 16A 只读复用 `GET /search`，不改后端、不写数据、不实现 search_logs / Meilisearch。

不得混入 Step 16B 的独立遗留路线：
- Step 14 DataGap。
- Step 15 真实费用写入验收。
- 真实费用凭证附件能力。
- 独立 `GET /fees/warnings` 或 warnings API。
- seed / migrate / 数据补录 / 数据清理。
- search_logs 写入。
- Meilisearch / 外部搜索引擎同步。
- 统计看板、审计日志、系统配置。
- 后端搜索语义改造或新增后端 API，除非计划确认明确发现 Step 16B 无法前端完成，并停下来说明原因。

请只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 16A 状态。
6. `memory-bank/progress.md` 顶部 Step 16A 结果。
7. `memory-bank/evidence.md` 顶部 Step 16A 证据。
8. `memory-bank/decisions.md` 顶部 D074。
9. `apps/web/src/Search.tsx`
10. `apps/web/src/Search.test.ts`
11. `apps/web/src/types.ts` 中 Search 类型。
12. `apps/api/src/search/dto/search-query.dto.ts` 和 `apps/api/src/search/domain/search-domain.types.ts` 中现有 `GET /search` 参数/返回契约。
13. 如需确认 UI 模式，只读 `Achievements.tsx`、`Fees.tsx` 中与筛选、列表、详情入口相关的小范围。

计划确认目标：
- 判断 Step 16B 是否应围绕“检索中心高级筛选与结果体验强化”推进。
- 明确 Step 16B 是否应包含：
  - achievementType / achievementStatus 筛选。
  - feeType / payStatus 筛选。
  - departmentId 手动筛选输入与 UUID 边界提示。
  - take 结果数量控制，限制 1-50。
  - 更清晰的结果分组、命中摘要、脱敏说明。
  - 从成果结果跳转或打开已有成果详情只读入口的可行性评估。
  - 从费用结果跳转或打开已有费用详情只读入口的可行性评估。
  - 是否需要扩展 api-client 支持数组 query；如不必要，应继续保持单值 targetTypes。
- 判断哪些内容应留到 Step 16C 或独立路线。

请输出：
1. 当前状态复核。
2. Step 16B 推荐方向与依据。
3. 任务分类：XS/S/M/L，并说明理由。
4. Step 16B 目标、非目标、成功标准。
5. 建议文件范围。
6. 建议验证门禁。
7. 浏览器/API 只读验收思路。
8. 风险与不得越界项。
9. memory-bank 更新建议。
10. 最后输出可交给执行对话的 “Step 16B 执行 Prompt”。

注意：
- 本轮只做计划确认，不实现。
- 如果发现 Step 16B 不适合继续做检索中心强化，必须说明证据并停在计划确认。
- 最后写明：等待用户确认 Step 16B 计划后，再生成或执行 Step 16B 执行 Prompt。
~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16B 执行。

本轮目标：实现“检索中心高级筛选与结果体验强化”。

允许修改：
- apps/web/src/Search.tsx
- apps/web/src/Search.test.ts
- apps/web/src/types.ts
- apps/web/src/App.css
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md

禁止：
- 删除文件。
- 运行 seed/migrate。
- 数据补录、数据清理。
- 读取 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。
- 发起任何写接口。
- 实现 Step 14 DataGap。
- 实现 Step 15 真实费用写入、真实费用凭证附件、独立 `GET /fees/warnings`。
- 实现 search_logs、Meilisearch / 外部搜索引擎同步。
- 实现统计看板、审计日志、系统配置。
- 修改后端 `GET /search` 语义或新增后端 API。
- 扩展 api-client 数组 query 序列化；继续保持单值 `targetTypes`。

当前状态：
- Step 16A：DONE。
- Search 页面已接入导航并复用 `GET /search`。
- 已支持 keyword、单值 targetTypes、take=20、loading/empty/error/ready、redacted 成果展示、费用只读字段展示。
- D074 已记录 Step 16A readonly boundary。

实现要求：
1. 增加高级筛选：
   - `achievementType`
   - `achievementStatus`
   - `feeType`
   - `payStatus`
   - `departmentId` 手动输入
   - `take` 控制，限制 1-50

2. `departmentId`：
   - 空值省略。
   - 非空必须是 UUID。
   - 非法时前端显示边界提示，不请求 `GET /search`。

3. Query：
   - `keyword` trim。
   - `targetTypes` 仍为单值或不传。
   - `take` clamp 到 1-50。
   - 只传现有 `GET /search` 支持的 query 参数。

4. 结果体验：
   - 显示 total、成果数、费用数、脱敏成果数。
   - 展示当前筛选摘要。
   - 按 `ACHIEVEMENT` / `FEE_RECORD` 分组或清晰分段。
   - redacted achievement 不泄露 title / identifiers。
   - fee result 不展示 amount、voucherNo、附件上传/下载、凭证文件能力。

5. 详情入口：
   - 本步只保留可行性/后续边界说明。
   - 不实现成果详情或费用详情打开。
   - 详情联动留到 Step 16C 或独立计划确认。

测试要求：
- no-user 不请求搜索接口。
- demo user 请求 `GET /search`，包含高级筛选 query。
- 覆盖 achievementType / achievementStatus / feeType / payStatus query shaping。
- departmentId 合法时传参，非法时不请求并显示/返回校验错误模型。
- take 限制 1-50。
- loading / empty / error / ready 仍覆盖。
- 400 / 401 / 403 / 500 / network 错误文案仍覆盖。
- 结果摘要统计覆盖。
- redacted achievement 不泄露 title / identifiers。
- fee result 不展示 amount、voucherNo、附件能力。
- 不调用 POST、PATCH、`/fees/warnings`、附件上传/下载端点。

执行门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器/API 只读验收：
- 可临时启动前端 dev server。
- 若后端 3000 已存在，只能复用，不要停止既有后端。
- no-user 打开检索中心：确认无业务请求边界提示。
- demo user 打开检索中心：搜索 `demo`。
- 测试成果筛选、费用筛选、合法 departmentId、非法 departmentId、take 控制。
- 390px 检查无 document-level 横向溢出。
- 确认请求只有 `GET /api/search`，无写请求、warnings、附件端点。

memory-bank 更新：
- `implementation-plan.md` 顶部新增 Step 16B 状态。
- `progress.md` 新增 Step 16B 结果。
- `evidence.md` 新增 Step 16B 证据。
- `decisions.md` 新增 D075：Step 16B 仅强化现有 `GET /search` 高级筛选与结果体验，继续单值 targetTypes，不实现详情联动、search_logs、Meilisearch 或后端改造。

完成后汇报：
1. 修改文件。
2. 实现能力。
3. 门禁结果。
4. 浏览器/API 只读验收结果。
5. 未覆盖与剩余风险。
6. 下一步建议为 Step 16C 计划确认，不自动继续实现。
~~~

## Step 16C

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16C 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15 overall：DONE_WITHOUT_REAL_WRITE_RISK。
- Step 15A/B/D：DONE。
- Step 15C：DONE_WITHOUT_REAL_WRITE。
- Step 16 方向：检索中心前端。
- Step 16A：DONE，完成只读检索中心基础闭环。
- Step 16B：DONE，完成高级筛选与结果体验强化。
- D074：Step 16A 只读复用 `GET /search`。
- D075：Step 16B 只做现有 `GET /search` 高级筛选与结果体验，详情联动 deferred。

Step 16B 已完成：
- 高级筛选：achievementType、achievementStatus、feeType、payStatus、departmentId、take。
- departmentId 前端 UUID 校验，非法不请求业务接口。
- targetTypes 继续单值或不传。
- 结果摘要：total、成果数、费用数、脱敏成果数。
- 成果 / 费用结果分组。
- 不实现成果详情或费用详情打开。
- 不改后端、不写数据、不做 search_logs / Meilisearch。

不得混入 Step 16C 的独立路线：
- Step 14 DataGap。
- Step 15 真实费用写入验收。
- 真实费用凭证附件能力。
- 独立 `GET /fees/warnings` 或 warnings API。
- seed / migrate / 数据补录 / 数据清理。
- search_logs 写入。
- Meilisearch / 外部搜索引擎同步。
- 统计看板、审计日志、系统配置。
- 后端搜索语义改造或新增后端 API。
- 数组 targetTypes / api-client 数组 query 扩展，除非计划确认明确证明必要并停下来让用户确认。

请只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 16B 状态。
6. `memory-bank/progress.md` 顶部 Step 16B 结果。
7. `memory-bank/evidence.md` 顶部 Step 16B 证据。
8. `memory-bank/decisions.md` 顶部 D074 / D075。
9. `apps/web/src/Search.tsx`
10. `apps/web/src/Search.test.ts`
11. `apps/web/src/AchievementDetail.tsx` 中只读详情组件/函数的小范围。
12. `apps/web/src/Fees.tsx` 中费用详情读取与 drawer 小范围。
13. `apps/web/src/types.ts` 中 Achievement / Fee / Search 类型。
14. 后端只读契约小范围：`GET /achievements/:id`、`GET /fees/:id` 的前端已用 helper 或相关类型；不要展开无关后端历史。

计划确认目标：
- 判断 Step 16C 应做什么： 
  1. 搜索结果只读详情联动。
  2. 或 Step 16 final archive。
  3. 或拆成 Step 16C/16D。
- 重点评估成果搜索结果打开只读成果详情是否可以复用现有只读能力。
- 重点评估费用搜索结果打开只读费用详情是否可以复用现有 Step 15B/15D 费用详情能力，是否需要小范围导出/抽取，是否会导致过大改动。
- 判断 Step 16C 是否应只做“成果详情联动”，把费用详情联动留到 Step 16D。
- 判断是否需要先修正 Search 页面中仍提到 Step 16A 的过期边界文案。
- 明确不得实现任何写操作或跨路线能力。

请输出：
1. 当前状态复核。
2. Step 16C 推荐方向与依据。
3. 任务分类：XS/S/M/L，并说明理由。
4. Step 16C 目标、非目标、成功标准。
5. 建议文件范围。
6. 建议验证门禁。
7. 浏览器/API 只读验收思路。
8. 风险与不得越界项。
9. memory-bank 更新建议。
10. 最后输出可交给执行对话的 “Step 16C 执行 Prompt”。

注意：
- 本轮只做计划确认，不实现。
- 如果详情联动会导致跨组件抽取过大，请建议拆分，不要硬推。
- 如果判断 Step 16 已可归档，也要说明为什么不做详情联动。
- 最后写明：等待用户确认 Step 16C 计划后，再生成或执行 Step 16C 执行 Prompt。
~~~

## Step 16D

~~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16D 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15 overall：DONE_WITHOUT_REAL_WRITE_RISK。
- Step 15A/B/D：DONE。
- Step 15C：DONE_WITHOUT_REAL_WRITE。
- Step 16 方向：检索中心前端。
- Step 16A：DONE，检索中心只读基础闭环。
- Step 16B：DONE，高级筛选与结果体验。
- Step 16C：DONE，ACHIEVEMENT 搜索结果已可打开只读成果详情。
- D074 / D075 / D076 已记录 Step 16 只读边界。

Step 16C 已完成：
- ACHIEVEMENT 搜索结果新增“查看详情”。
- 复用 `ReadonlyAchievementDetail` 与 `GET /achievements/:id`。
- 增加 search 只读语境。
- 费用结果仍不做详情联动。
- 请求边界保持为 `GET /search` 和 `GET /achievements/:id`。
- 无 POST/PATCH/warnings/附件/上传/下载端点。

请只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 16C 状态。
6. `memory-bank/progress.md` 顶部 Step 16C 结果。
7. `memory-bank/evidence.md` 顶部 Step 16C 证据。
8. `memory-bank/decisions.md` 顶部 D074-D076。
9. `apps/web/src/Search.tsx`
10. `apps/web/src/Search.test.ts`
11. `apps/web/src/Fees.tsx` 中费用详情、`fetchFeeDetail`、`loadFeeDetailForDemoUser`、`FeeDetailDrawer`、`FeeDetailContent`、mark-paid 相邻逻辑小范围。
12. `apps/web/src/Fees.test.ts` 中费用详情只读和 mark-paid 边界相关小范围。
13. `apps/web/src/types.ts` 中 Fee/Search 类型。

计划确认目标：
- 判断 Step 16D 是否应实现“搜索费用结果 -> 费用只读详情联动”。
- 判断费用详情联动是否能安全复用现有 `GET /fees/:id`，同时避免把 mark-paid 写入口、创建费用、凭证附件能力带入检索中心。
- 判断是否需要从 `Fees.tsx` 小范围导出/抽取真正只读的费用详情组件或只读 mode。
- 判断如果费用详情抽取风险过大，是否应跳过 Step 16D 直接做 Step 16 archive。
- 明确 Step 16D 不做真实费用写入、不做凭证附件、不做 warnings API、不做 seed/migrate/data route。

不得混入：
- Step 14 DataGap。
- Step 15 真实费用写入验收。
- 真实费用凭证附件能力。
- 独立 `GET /fees/warnings` 或 warnings API。
- seed / migrate / 数据补录 / 数据清理。
- search_logs。
- Meilisearch / 外部搜索引擎同步。
- 统计看板、审计日志、系统配置。
- 后端 API/语义改造。
- 数组 targetTypes / api-client 数组 query 扩展。
- 任何 POST/PATCH/DELETE。

请输出：
1. 当前状态复核。
2. Step 16D 推荐方向：费用只读详情联动，或 Step 16 archive，或拆分方案。
3. 推荐依据，特别是 `Fees.tsx` 中 mark-paid 写入口相邻风险。
4. 任务分类：XS/S/M/L，并说明理由。
5. Step 16D 目标、非目标、成功标准。
6. 建议文件范围。
7. 建议验证门禁。
8. 浏览器/API 只读验收思路。
9. 风险与不得越界项。
10. memory-bank 更新建议。
11. 最后输出可交给执行对话的 “Step 16D 执行 Prompt”。

注意：
- 本轮只做计划确认，不实现。
- 如果建议做费用详情联动，必须要求它是 readonly-only，不能暴露 mark-paid 按钮或任何写入口。
- 如果建议归档 Step 16，必须说明费用详情联动为什么不进入一期当前闭环。
- 最后写明：等待用户确认 Step 16D 计划后，再生成或执行 Step 16D 执行 Prompt。
~~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16D 执行。

本轮目标：实现“检索中心费用结果只读详情联动”。

允许修改：
- apps/web/src/Search.tsx
- apps/web/src/Search.test.ts
- apps/web/src/Fees.tsx
- apps/web/src/Fees.test.ts
- apps/web/src/App.css
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md

禁止：
- 删除文件。
- 运行 seed/migrate。
- 数据补录、数据清理。
- 读取 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。
- 发起任何写接口。
- 实现 Step 14 DataGap。
- 实现 Step 15 真实费用写入、真实费用凭证附件、独立 `GET /fees/warnings`。
- 实现 search_logs、Meilisearch / 外部搜索引擎同步。
- 实现统计看板、审计日志、系统配置。
- 修改后端 API 或语义。
- 扩展数组 targetTypes / api-client 数组 query。
- 调用或暴露任何 POST/PATCH/DELETE。

当前状态：
- Step 16A：DONE，只读检索基础闭环。
- Step 16B：DONE，高级筛选与结果体验。
- Step 16C：DONE，ACHIEVEMENT 搜索结果已可打开只读成果详情。
- D074/D075/D076 已记录只读边界。

实现要求：
1. 在 FEE_RECORD 搜索结果卡片增加“查看详情”只读入口。
2. 点击后仅复用现有 `GET /fees/:id` 能力。
3. 优先复用 `Fees.tsx` 中 `fetchFeeDetail`、`loadFeeDetailForDemoUser`、`mapFeeDetailErrorToDisplay`、`getFeeDetailState`。
4. 不得原样复用会显示 mark-paid 按钮的费用详情组件。
5. 必须新增/导出真正 readonly-only 的费用详情 Drawer，或给 `FeeDetailDrawer` / `FeeDetailContent` 加 readonly mode，并确保 Search 使用 readonly-only 模式。
6. readonly-only 费用详情不得显示：
   - 标记缴费按钮。
   - 创建费用入口。
   - POST /fees 或 POST /fees/:id/mark-paid 文案作为可执行能力。
   - 附件上传/下载、凭证文件能力。
   - 独立 warnings API。
7. 详情中可展示 `GET /fees/:id` 返回字段，包括 amount 和 voucherNo，但必须说明 voucherNo 仅为凭证编号，不是附件文件。
8. Search 费用结果卡片仍只展示搜索索引字段，不展示 amount、voucherNo、附件能力。
9. 成果详情联动保持 Step 16C 行为不回退。

测试要求：
- no-user 不请求 `GET /search`，也不请求 `GET /fees/:id`。
- demo user 搜索仍请求 `GET /search`。
- 点击 FEE_RECORD 结果后请求 `GET /fees/:id`。
- 费用只读详情 loading / ready / close / retry / error 路径覆盖。
- 401 / 403 / 404 / 500 / network 错误文案覆盖或复用现有只读错误映射测试。
- readonly-only 费用详情不暴露 mark-paid、create fee、POST/PATCH、warnings、附件上传/下载能力。
- Search 费用卡片仍不展示 amount、voucherNo、附件能力。
- 不调用 POST、PATCH、DELETE、`/fees/warnings`、附件上传/下载端点。
- ACHIEVEMENT 详情联动测试保持通过。

执行门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器/API 只读验收：
- 可临时启动前端 dev server。
- 若后端 3000 已存在，只能复用，不要停止既有后端。
- no-user 打开检索中心：确认无业务请求。
- demo user 打开检索中心，筛选或搜索得到 FEE_RECORD 结果。
- 点击费用结果查看详情：确认 readonly Drawer 可打开、关闭。
- 确认请求只有 `GET /api/search`、`GET /api/fees/:id`，以及既有成果详情路径如被操作时的 `GET /api/achievements/:id`。
- 390px 检查无 document-level 横向溢出。
- 确认无写请求、warnings、附件上传/下载端点。

memory-bank 更新：
- `implementation-plan.md` 顶部新增 Step 16D 状态。
- `progress.md` 新增 Step 16D 结果。
- `evidence.md` 新增 Step 16D 证据。
- `decisions.md` 新增 D077：Step 16D 仅实现 FEE_RECORD 搜索结果到现有 `GET /fees/:id` 的只读详情联动；隔离 mark-paid/create fee/voucher attachment/warnings/write routes；不改后端、不实现 search_logs / Meilisearch / 数组 targetTypes。

完成后汇报：
1. 修改文件。
2. 实现能力。
3. 门禁结果。
4. 浏览器/API 只读验收结果。
5. 未覆盖与剩余风险。
6. 下一步建议为 Step 16 archive 计划确认，不自动继续实现。
~~~



~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16 archive 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15 overall：DONE_WITHOUT_REAL_WRITE_RISK。
- Step 15A/B/D：DONE。
- Step 15C：DONE_WITHOUT_REAL_WRITE。
- Step 16 方向：检索中心前端。
- Step 16A：DONE，检索中心只读基础闭环。
- Step 16B：DONE，高级筛选与结果体验。
- Step 16C：DONE，ACHIEVEMENT 搜索结果只读成果详情联动。
- Step 16D：DONE，FEE_RECORD 搜索结果 readonly-only 费用详情联动。
- D074 / D075 / D076 / D077 已记录 Step 16 只读边界。

Step 16 已完成能力：
- 复用现有 `GET /search`，无后端改造。
- no-user 不请求业务接口。
- demo user 可执行 keyword 检索。
- 支持单值 targetTypes：全部 / ACHIEVEMENT / FEE_RECORD。
- 支持高级筛选：achievementType、achievementStatus、feeType、payStatus、departmentId、take。
- departmentId 前端 UUID 校验，非法不请求业务接口。
- 结果摘要：total、成果数、费用数、脱敏成果数。
- 结果按成果 / 费用分组。
- ACHIEVEMENT 搜索结果可打开只读成果详情，复用 `GET /achievements/:id`。
- FEE_RECORD 搜索结果可打开 readonly-only 费用详情，复用 `GET /fees/:id`。
- 费用详情隔离 mark-paid / create fee / voucher attachment / warnings / write routes。
- 搜索卡片仍保持索引字段边界：费用卡片不展示 amount、voucherNo 或附件能力。
- redacted achievement 不伪造 title / identifiers。

Step 16 明确未做且不得在 archive 中混入：
- Step 14 DataGap。
- Step 15 真实费用写入验收。
- 真实费用凭证附件能力。
- 独立 `GET /fees/warnings` 或 warnings API。
- seed / migrate / 数据补录 / 数据清理。
- search_logs 写入。
- Meilisearch / 外部搜索引擎同步。
- 统计看板、审计日志、系统配置。
- 后端 API / 语义改造。
- 数组 targetTypes / api-client 数组 query 扩展。
- 任何 POST / PATCH / DELETE。

请只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 16A-D 状态。
6. `memory-bank/progress.md` 顶部 Step 16A-D 结果。
7. `memory-bank/evidence.md` 顶部 Step 16A-D 证据。
8. `memory-bank/decisions.md` 顶部 D074-D077。
9. `apps/web/src/App.tsx` 中检索中心导航文案。
10. `apps/web/src/Search.tsx` 中 Step 16 最终边界文案。
11. 必要时小范围读取 `AchievementDetail.tsx` / `Fees.tsx` 中 search readonly context，不展开无关历史。

计划确认目标：
- 判断 Step 16 是否可以归档为 DONE。
- 判断是否需要一个 Step 16E final gates / archive 执行步骤。
- 明确 Step 16 archive 的目标、非目标、成功标准、验证方式和 memory-bank 更新范围。
- 明确 archive 不做新功能，只做最终门禁复跑、只读验收复核、文案/归档检查和 Step 16 overall 状态沉淀。
- 判断是否需要补充最终浏览器验收：
  - no-user search center。
  - demo user 搜索。
  - ACHIEVEMENT 详情打开。
  - FEE_RECORD 详情打开。
  - 390px 无横向溢出。
  - 请求边界只有 GET /api/search、GET /api/achievements/:id、GET /api/fees/:id。
- 判断是否需要补充最终门禁：
  - `corepack pnpm --filter @research-ip/web test`
  - `corepack pnpm --filter @research-ip/web typecheck`
  - `corepack pnpm --filter @research-ip/web build`
  - `corepack pnpm lint`

请输出：
1. 当前状态复核。
2. 是否建议进入 Step 16 archive / final gates。
3. 任务分类：XS/S/M/L，并说明理由。
4. Step 16 archive 目标、非目标、成功标准。
5. 建议文件范围。
6. 建议验证门禁。
7. 浏览器/API 只读验收思路。
8. 风险与不得越界项。
9. memory-bank 更新建议。
10. 最后输出可交给执行对话的 “Step 16 archive 执行 Prompt”。

注意：
- 本轮只做计划确认，不实现。
- 如果发现 Step 16A-D 证据不足，必须说明缺口，并建议补证据，不要直接归档。
- 如果证据充分，Step 16 archive 执行也只能做归档和验证，不得新增功能。
- 最后写明：等待用户确认 Step 16 archive 计划后，再生成或执行 Step 16 archive 执行 Prompt。
~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 16 archive 执行。

本轮目标：归档 Step 16 检索中心前端为 DONE。

本轮只做：
- 最终门禁复跑。
- 浏览器/API 只读验收复核。
- 最终文案检查。
- memory-bank 状态沉淀。

不得新增功能。

允许修改：
- apps/web/src/App.tsx
  - 仅限检索中心导航 step / description 文案。
- apps/web/src/Search.tsx
  - 仅当最终边界文案仍过期时修改。
  - 不改业务逻辑。
- memory-bank/implementation-plan.md
- memory-bank/progress.md
- memory-bank/evidence.md
- memory-bank/decisions.md

禁止：
- 删除文件。
- 运行 seed/migrate。
- 数据补录、数据清理。
- 读取 `.env`、`DATABASE_URL`、密码、Token、Cookie、证书、私钥或完整连接串。
- 发起任何写接口。
- 实现 Step 14 DataGap。
- 实现 Step 15 真实费用写入。
- 实现真实费用凭证附件。
- 实现独立 `GET /fees/warnings` 或 warnings API。
- 实现 search_logs。
- 实现 Meilisearch / 外部搜索引擎同步。
- 实现统计看板、审计日志、系统配置。
- 修改后端 API 或语义。
- 扩展数组 targetTypes / api-client 数组 query。
- 调用或暴露任何 POST / PATCH / DELETE。
- 新增检索功能。

当前服务状态：
- 后端 API 已启动：`http://localhost:3000`
- `GET /api/health` 已通过。
- PostgreSQL dev 容器已运行并 healthy。
- 前端如需浏览器验收，可临时启动 dev server。
- 不要停止既有后端。

当前 Step 16 状态：
- Step 16A：DONE，检索中心只读基础闭环。
- Step 16B：DONE，高级筛选与结果体验。
- Step 16C：DONE，ACHIEVEMENT 搜索结果只读成果详情联动。
- Step 16D：DONE，FEE_RECORD 搜索结果 readonly-only 费用详情联动。
- D074 / D075 / D076 / D077 已记录 Step 16 只读边界。

执行要求：
1. 小范围检查 `App.tsx` / `Search.tsx` 最终文案。
2. 修正仍停留在 Step 16C / Step 16D 子步骤的过期导航或边界文案，使其表达：
   - Step 16 overall readonly search center done。
   - 检索中心已完成只读搜索、筛选、成果详情、费用详情联动。
3. 不改业务逻辑，不新增功能。
4. 复跑最终门禁：
   - `corepack pnpm --filter @research-ip/web test`
   - `corepack pnpm --filter @research-ip/web typecheck`
   - `corepack pnpm --filter @research-ip/web build`
   - `corepack pnpm lint`
5. 浏览器/API 只读验收：
   - no-user 打开检索中心：确认无业务请求。
   - demo user 搜索 `demo`。
   - 打开 ACHIEVEMENT 只读详情。
   - 打开 FEE_RECORD readonly-only 费用详情。
   - 390px 检查无 document-level 横向溢出。
   - 请求边界只能有：
     - `GET /api/search`
     - `GET /api/achievements/:id`
     - `GET /api/fees/:id`
   - 确认无：
     - POST / PATCH / DELETE
     - `/fees/warnings`
     - 附件上传/下载端点
6. 更新 memory-bank：
   - `implementation-plan.md` 顶部新增 Step 16 Archive 状态，Step 16 overall = DONE。
   - `progress.md` 新增 Step 16 Archive 结果。
   - `evidence.md` 新增 Step 16 Archive 证据。
   - `decisions.md` 新增 D078：
     - Step 16 归档为 readonly search center frontend completion。
     - 不包含 search_logs、Meilisearch、数组 targetTypes、后端改造、写接口、真实费用写入、真实凭证附件、warnings API、Step 14 DataGap、seed/migrate/data route。

完成后汇报：
1. 修改文件。
2. 归档结论。
3. 门禁结果。
4. 浏览器/API 只读验收结果。
5. 未覆盖与剩余风险。
6. 下一步建议，不自动继续实现新 Step。
~~~

# 17、Step 17

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 17 计划确认。

本轮只做计划确认，不直接实现、不修改文件、不运行 test/build/lint、不启动服务。

重要分工：
- 本 Step 对话只负责完成 Step 17 计划确认并汇报结论。
- 不要在 Step 对话里生成下一步执行 Prompt。
- 下一步执行 Prompt 将由 Prompt 13 编排对话根据你的计划确认输出生成。

当前状态：
- Step 14 overall：DONE_WITH_DATAGAP_RISK。
- Step 14E：DONE。
- Step 15 overall：DONE_WITHOUT_REAL_WRITE_RISK。
- Step 16 overall：DONE。
- Step 16A-D：DONE。
- Step 16 Archive：DONE。
- D078 已记录：Step 16 归档为 readonly search center frontend completion。

当前服务状态：
- 后端 API 已启动：`http://localhost:3000`
- `GET /api/health` 已通过。
- PostgreSQL dev 容器已运行并 healthy。
- 本轮计划确认不需要启动前端。

Step 16 已完成能力：
- 检索中心只读前端闭环。
- `GET /search`、keyword、单值 targetTypes、高级筛选、结果摘要、成果/费用分组。
- 成果结果只读详情：`GET /achievements/:id`。
- 费用结果 readonly-only 详情：`GET /fees/:id`。
- 无写接口、无后端改造、无 search_logs、无 Meilisearch。

独立遗留路线，不能自动混入 Step 17：
- Step 14 DataGap：workflow tasks 为空，真实“审批任务详情 -> 查看关联成果详情”成功路径未覆盖。
- Step 15 真实费用写入验收：真实 `POST /fees`、`POST /fees/:id/mark-paid`。
- 真实费用凭证附件能力。
- 独立 `GET /fees/warnings` 或 warnings API。
- seed / migrate / 数据补录 / 数据清理。
- search_logs 写入。
- Meilisearch / 外部搜索引擎同步。
- 数组 targetTypes / api-client 数组 query 扩展。
- 后端 API / 语义改造。

建议优先候选：
- Step 17 可考虑“统计看板前端”。
- 理由：一期范围包含基础统计看板；当前 `apps/web/src/App.tsx` 中统计看板仍是占位/边界页；后端已有 `GET /dashboard/summary`，但完整统计看板页面尚未闭环。
- 但 Step 17 方向必须由你读取上下文后确认；如果项目上下文更明确指向审计日志、系统配置或其他方向，说明证据并停在计划确认。

请只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 16 Archive 状态。
6. `memory-bank/progress.md` 顶部 Step 16 Archive 结果。
7. `memory-bank/evidence.md` 顶部 Step 16 Archive 证据。
8. `memory-bank/decisions.md` 顶部 D078。
9. `product-brief.md`、`feature-brief.md`、`design-spec.md` 中一期剩余页面相关小节。
10. `apps/web/src/App.tsx` 当前导航、已实现页面、占位页面。
11. 如需确认候选能力，只读 dashboard / audit / settings 对应后端 API 小范围契约，不展开无关历史。

计划确认目标：
- 判断 Step 17 应选择的一期功能方向。
- 优先评估是否进入“统计看板前端”。
- 明确 Step 17 不处理 Step 14 DataGap、Step 15 真实写入、凭证附件、warnings API、seed/migrate/data route、search_logs、Meilisearch。
- 输出 Step 17 的计划确认结论，不生成下一步执行 Prompt。

请输出：
1. 当前状态复核。
2. Step 17 推荐方向与依据。
3. 任务分类：XS/S/M/L，并说明理由。
4. Step 17 目标、非目标、成功标准。
5. 建议拆分子步骤，例如 Step 17A / 17B / 17C，但只给计划，不执行。
6. 每个子步骤的文件范围、验证方式、浏览器/API 验收思路和风险。
7. memory-bank 更新建议。
8. 明确等待 Prompt 13 根据本轮输出生成下一步执行 Prompt。
~~~

## Step 17A

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 17A 执行。

本轮目标：
- 实现 Step 17A：统计看板前端基础页。
- 将前端“统计看板”从 BoundaryPage 升级为可用的只读 Dashboard 页面。
- 只复用现有后端 `GET /dashboard/summary`。
- 建立 Step 17 的只读 dashboard summary 前端基础闭环，为 Step 17B 的分布展示和筛选体验留接口。
- 本轮可以修改项目文件、补测试、运行必要门禁。
- 不实现 Step 17B / 17C，不跨步扩展。

当前状态：
- Step 16 overall / Archive: DONE。
- Step 17 计划确认：DONE。
- Step 17 推荐方向已确认：统计看板前端，只读 `GET /dashboard/summary` 闭环。
- 后端 API 当前已启动在 `http://localhost:3000`，此前 `GET /api/health` 通过。
- 前端默认未启动；如需浏览器验收，可临时启动并在验收后停止。

必须遵守：
- 不读取 `.env`、连接串、密钥、Token、Cookie、证书、私钥。
- 不执行删除、批量清理、reset、restore、clean 等破坏性命令。
- 不修改后端 API、后端 dashboard 语义、数据库 schema、seed、migration、依赖、lockfile。
- 不发起任何写接口。
- 不实现审计日志页面、系统配置页面、Step 14 DataGap、Step 15 真实费用写入、凭证附件、warnings API、search_logs、Meilisearch、数组 query 扩展。
- 不伪造后端未返回的年度趋势、部门排行、金额汇总、专利法律状态专项统计。

只读上下文建议：
1. `E:\Vibe coding\AGENTS.md`
2. `vibe-methodology/00-operating-protocol.md`
3. `vibe-methodology/01-task-classification.md`
4. `vibe-methodology/08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 16 Archive 与 Step 17 计划确认相关状态。
6. `memory-bank/progress.md` 顶部 Step 16 Archive。
7. `memory-bank/evidence.md` 顶部 Step 16 Archive。
8. `memory-bank/decisions.md` 顶部 D078。
9. `apps/web/src/App.tsx`
10. `apps/web/src/Workbench.tsx`
11. `apps/web/src/types.ts`
12. `apps/web/src/api-client.ts`
13. `apps/web/src/components/StateBlocks.tsx`
14. dashboard 后端小范围契约：
    - `apps/api/src/dashboard/dashboard.controller.ts`
    - `apps/api/src/dashboard/domain/dashboard-domain.types.ts`
    - `apps/api/src/dashboard/dto/dashboard-summary-query.dto.ts`

实现范围：
1. 新增或建立 `apps/web/src/Dashboard.tsx`。
2. 在 `apps/web/src/App.tsx` 中让 `activeKey === "dashboard"` 渲染 Dashboard 页面，而不是 BoundaryPage。
3. Dashboard 页面基础能力：
   - 无 demo user 时不请求业务接口。
   - 有 demo user 时请求 `GET /dashboard/summary`，默认 `dueSoonDays=30`。
   - 提供刷新按钮。
   - 展示加载、错误、权限错误、空/无数据友好状态。
   - 展示基础摘要指标：
     - 成果总量。
     - 费用逾期数。
     - 费用即将到期数。
     - 待处理审批任务数。
     - 待处理提醒数。
   - 展示 `generatedAt`、`scope.userId`、`scope.departmentId`。
   - 页面文案明确：当前只读读取 dashboard summary，权限裁剪以后端为准。
4. 可补充少量纯函数用于：
   - bucket 计数。
   - 日期格式化。
   - dashboard summary 基础指标提取。
5. 样式只做必要前端布局，优先复用现有 `shell-card`、`page-stack`、`summary-meta`、`DataState`、`PermissionHint`、`SectionHeader`。
6. 添加 `apps/web/src/Dashboard.test.tsx` 或合适的测试文件，覆盖：
   - 无 demo user 不请求 `GET /dashboard/summary`。
   - 有 demo user 时请求 `GET /dashboard/summary` 且默认 `dueSoonDays=30`。
   - 基础指标从 summary 中正确提取。
   - 401/403/错误状态映射可展示。
   - 不出现或不暗示年度趋势、部门排行、金额汇总等未返回能力。
7. 更新 memory-bank：
   - `implementation-plan.md` 顶部新增 Step 17A 当前状态。
   - `progress.md` 记录 Step 17A 实现内容。
   - `evidence.md` 记录测试与门禁证据。
   - `decisions.md` 新增 D079：Step 17A 选择只读 `GET /dashboard/summary` 前端基础页，不扩展后端、不伪造未返回统计。

建议门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器/API 只读验收：
- 如需验收，复用已启动后端 3000。
- 临时启动前端 `corepack pnpm --filter @research-ip/web dev`，完成后停止。
- 无 demo user 打开统计看板：不发起业务 API 请求。
- 选择 demo user 打开统计看板：只出现 `GET /api/dashboard/summary?dueSoonDays=30`。
- 点击刷新：仍只出现 `GET /api/dashboard/summary`。
- 确认无 POST / PATCH / DELETE。
- 确认无 `/audit-logs`、`/fees/warnings`、附件、search_logs、Meilisearch 相关请求。
- 390px 宽度检查无 document-level 横向溢出。

输出要求：
1. 说明 Step 17A 实现了什么。
2. 列出修改文件。
3. 给出门禁结果。
4. 给出浏览器/API 只读验收结果；如未做浏览器验收，说明原因和替代证据。
5. 明确边界：未做后端改造、未做写接口、未做 Step 17B/17C。
6. 给出剩余风险。
7. 最后停住，不生成 Step 17B Prompt；下一步由 Prompt 编排对话判断。
~~~

## Step 17B

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 17B 执行。

本轮目标：
- 在 Step 17A 已完成的只读 Dashboard 基础页上，实现“统计维度与筛选体验”。
- 继续限定为只读前端增强。
- 只复用现有 `GET /dashboard/summary`。
- 不实现 Step 17C 归档。
- 不生成下一步 Prompt；执行完成后停住并汇报。

当前状态：
- Step 17A：DONE。
- Step 17B 计划确认：DONE。
- Step 17B 推荐方向：展示现有 dashboard summary buckets，并增加 7 / 30 / 90 天 dueSoonDays 控制。
- Step 17B 不使用 today 自定义输入。
- Step 17B 不改后端 API / 语义。

必须遵守：
- 不读取 `.env`、连接串、密钥、Token、Cookie、证书、私钥。
- 不执行删除、批量清理、reset、restore、clean 等破坏性命令。
- 不修改后端 Dashboard API、后端 dashboard 语义、数据库 schema、seed、migration、依赖或 lockfile。
- 不发起任何写接口。
- 不实现审计日志页面、系统配置页面、Step 14 DataGap、Step 15 真实费用写入、凭证附件、warnings API、search_logs、Meilisearch、数组 query 扩展。
- 不实现年度趋势、部门排行、金额汇总、专利法律状态专项统计、钻取详情、导出、缓存或完整报表平台。
- 不加入新图表库或新依赖。

只读上下文建议：
1. `E:\Vibe coding\AGENTS.md`
2. `vibe-methodology/00-operating-protocol.md`
3. `vibe-methodology/01-task-classification.md`
4. `vibe-methodology/08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 17A 状态
6. `memory-bank/progress.md` 顶部 Step 17A 结果
7. `memory-bank/evidence.md` 顶部 Step 17A 证据
8. `memory-bank/decisions.md` 顶部 D079
9. `apps/web/src/Dashboard.tsx`
10. `apps/web/src/Dashboard.test.ts`
11. `apps/web/src/App.css`
12. `apps/web/src/types.ts`
13. dashboard 后端契约小范围：
    - `apps/api/src/dashboard/domain/dashboard-domain.types.ts`
    - `apps/api/src/dashboard/dto/dashboard-summary-query.dto.ts`

实现范围：
1. 在 `Dashboard.tsx` 增加 `dueSoonDays` 状态：
   - 默认 30。
   - 只提供 7 / 30 / 90 三档选择。
   - 切换后重新请求 `GET /dashboard/summary?dueSoonDays=<value>`。
   - 刷新时保留当前 dueSoonDays。
   - 不发送任意非法值。
2. 展示现有 summary 返回的 5 组分布：
   - `achievement.byType.value.buckets`
   - `achievement.byStatus.value.buckets`
   - `fee.byPayStatus.value.buckets`
   - `workflowTasks.byStatus.value.buckets`
   - `reminderTasks.byStatus.value.buckets`
3. 分布展示要求：
   - 使用轻量列表、条形或标签布局即可。
   - 空 buckets 显示明确空状态，例如“暂无该维度数据”。
   - 未知 bucket key 必须安全 fallback，不崩溃，可展示原始 key 或“未知状态”。
   - 不补造后端未返回的数据。
4. 页面边界文案：
   - 明确 Step 17B 只展示 dashboard summary 的 count/bucket 指标。
   - 明确不包含年度趋势、部门排行、金额汇总、专利法律状态专项统计、钻取详情、导出或完整报表平台。
5. 样式范围：
   - 优先复用 `shell-card`、`DataState`、`PermissionHint`、`SectionHeader`。
   - 可在 `App.css` 中增加 Dashboard 专用 class。
   - 保证 390px 移动端无 document-level 横向溢出。
6. 测试覆盖：
   - 无 demo user 不请求 dashboard summary。
   - 默认请求 `GET /dashboard/summary` 且 `dueSoonDays=30`。
   - 切换 7 / 90 后请求 query 正确。
   - 只允许 7 / 30 / 90 三档控制，不发送任意输入。
   - 5 组 buckets 能正确渲染或转换 display model。
   - 空 buckets 显示空态。
   - 未知 bucket key 安全 fallback。
   - 页面不出现年度趋势、部门排行、金额汇总、专利法律状态专项统计等未实现能力暗示。

建议门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器/API 只读验收：
- 复用后端 3000，可先只读检查 `GET /api/health`。
- 临时启动前端，验收后停止。
- 清空 localStorage，无用户进入统计看板，确认无业务 API 请求。
- 应用 demo user `40000000-0000-4000-8000-000000000002`，确认只请求 `GET /api/dashboard/summary?dueSoonDays=30`。
- 切换 7 / 90，确认只请求对应 dashboard summary GET。
- 点击刷新，确认保留当前 dueSoonDays。
- 请求日志中无 POST / PATCH / DELETE。
- 请求日志中无 `/audit-logs`、`/fees/warnings`、附件、search_logs、Meilisearch 相关请求。
- 390px 检查无 document-level 横向溢出。

memory-bank 更新：
- `implementation-plan.md` 顶部新增 Step 17B 状态、范围、边界、门禁。
- `progress.md` 记录 Step 17B 实现内容。
- `evidence.md` 记录测试、门禁、浏览器/API 请求边界。
- `decisions.md` 新增 D080：Step 17B 只展示现有 dashboard summary buckets 和 7/30/90 dueSoonDays 控制，不接 today、不扩展后端、不伪造未返回统计。

输出要求：
1. 说明 Step 17B 实现了什么。
2. 列出修改文件。
3. 给出门禁结果。
4. 给出浏览器/API 只读验收结果。
5. 明确边界：未做后端改造、未做写接口、未做 Step 17C 归档。
6. 给出剩余风险。
7. 最后停住，不生成 Step 17C Prompt；下一步由 Prompt 编排对话判断。
~~~

## Step  17C

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 17C 计划确认。

本轮只做计划确认：
- 不直接实现。
- 不修改文件。
- 不运行 test / typecheck / build / lint。
- 不启动前端。
- 不发起写请求。
- 只读必要上下文，判断 Step 17 是否已具备归档条件，以及 Step 17C 应如何收尾。
- 不生成下一步执行 Prompt；下一步由 Prompt 编排对话生成。

当前状态：
- Step 17A：DONE。
- Step 17B：DONE。
- Step 17A 完成只读 Dashboard 基础页：
  - 复用 `GET /dashboard/summary`
  - 默认 `dueSoonDays=30`
  - 无 demo user 不请求业务 API
  - 展示基础摘要指标、generatedAt、scope.userId、scope.departmentId
- Step 17B 完成统计维度与筛选体验：
  - 7 / 30 / 90 天 `dueSoonDays` 控制
  - 展示现有 summary buckets：
    - 成果类型
    - 成果状态
    - 费用缴费状态
    - 审批任务状态
    - 提醒任务状态
  - 切换窗口重新请求对应 query
  - 刷新保留当前窗口
  - 空 buckets 有空态
  - 未知 key 安全 fallback
- Step 17A/17B 均通过 web test/typecheck/build/lint。
- Step 17A/17B 浏览器/API 验收均确认 GET-only，无 POST/PATCH/DELETE，无无关业务请求，390px 无横向溢出。

只读上下文建议：
1. `E:\Vibe coding\AGENTS.md`
2. `vibe-methodology/00-operating-protocol.md`
3. `vibe-methodology/01-task-classification.md`
4. `vibe-methodology/08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 17A/17B 状态
6. `memory-bank/progress.md` 顶部 Step 17A/17B 结果
7. `memory-bank/evidence.md` 顶部 Step 17A/17B 证据
8. `memory-bank/decisions.md` 顶部 D079/D080
9. `apps/web/src/Dashboard.tsx`
10. `apps/web/src/Dashboard.test.ts`
11. `apps/web/src/App.tsx`
12. `apps/web/src/App.css`

计划确认目标：
- 判断 Step 17 是否已经具备归档条件。
- 判断 Step 17C 是否应作为“统计看板前端只读闭环归档”。
- 判断是否还需要补做额外执行内容，或仅做最终门禁、浏览器/API 只读验收、文案/状态收尾和 memory-bank 归档。
- 明确 Step 17C 不应引入新功能或扩展范围。

重点检查：
- Step 17A/17B 是否已覆盖 Step 17 目标：
  - Dashboard 页面不再是占位页。
  - 复用现有 `GET /dashboard/summary`。
  - 无 demo user 不请求业务 API。
  - 有 demo user 展示基础摘要和 buckets。
  - 支持 7/30/90 dueSoonDays。
  - 权限裁剪以后端为准。
  - 不伪造后端未返回统计。
- Step 17A/17B 证据是否足以支撑 Step 17 overall DONE。
- 是否需要 Step 17C 重新跑全套前端门禁和浏览器/API 只读验收作为最终归档证据。
- 是否需要把导航/页面文案从 Step 17A/17B 子步骤措辞更新为 Step 17 overall 措辞。

明确不能混入：
- 后端 Dashboard API 或语义改造。
- 新 dashboard endpoint。
- today 自定义输入。
- 审计日志页面。
- 系统配置页面。
- Step 14 DataGap。
- Step 15 真实费用写入。
- 凭证附件。
- warnings API。
- search_logs。
- Meilisearch / 外部搜索引擎。
- seed / migrate / 数据补录 / 数据清理。
- 年度趋势、部门排行、金额汇总、专利法律状态专项统计、钻取详情、导出、缓存、完整报表平台。
- 写请求或任何 POST / PATCH / DELETE。

请输出：
1. 当前状态复核：Step 17A/17B 是否 DONE、证据是否充分、是否越界。
2. Step 17 是否具备归档条件。
3. Step 17C 推荐方向：归档收尾 / 继续补实现 / 暂停，并说明依据。
4. Step 17C 目标、非目标、成功标准。
5. 建议文件范围。
6. 建议最终门禁。
7. 建议浏览器/API 只读验收方式。
8. memory-bank 更新建议。
9. 风险与待确认项。
10. 最后停住，等待 Prompt 编排对话生成 Step 17C 执行 Prompt。
~~~

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 17C 执行。

本轮目标：
- 执行 Step 17C：统计看板前端只读闭环归档。
- 不新增功能。
- 不继续补实现 Step 17A/17B 之外的能力。
- 只做归档收尾、文案统一、最终门禁、浏览器/API 只读验收和 memory-bank 更新。
- 执行完成后停住，不生成下一步 Prompt。

当前状态：
- Step 17A：DONE。
- Step 17B：DONE。
- Step 17C 计划确认：DONE。
- Step 17 已具备归档条件。
- Step 17C 推荐方向：归档收尾。
- Step 17A/17B 已完成：
  - 统计看板不再是占位页。
  - 复用现有 `GET /dashboard/summary`。
  - 默认 `dueSoonDays=30`。
  - 支持 7 / 30 / 90 天窗口。
  - 无 demo user 不请求业务 API。
  - 有 demo user 展示基础摘要、`generatedAt`、`scope.userId`、`scope.departmentId` 和五组 buckets。
  - 刷新保留当前窗口。
  - 空 buckets 有空态，未知 key 安全 fallback。
  - 权限裁剪以后端为准。
  - 不伪造年度趋势、部门排行、金额汇总、专利法律状态专项统计等未返回数据。
- Step 17A/17B 门禁和浏览器/API 只读验收均已通过。

必须遵守：
- 不读取 `.env`、连接串、密钥、Token、Cookie、证书、私钥。
- 不执行删除、批量清理、reset、restore、clean 等破坏性命令。
- 不修改后端 Dashboard API、后端 dashboard 语义、数据库 schema、seed、migration、依赖或 lockfile。
- 不发起任何写接口。
- 不实现 today 自定义输入。
- 不实现新 dashboard endpoint。
- 不实现审计日志页面、系统配置页面、Step 14 DataGap、Step 15 真实费用写入、凭证附件、warnings API、search_logs、Meilisearch、数组 query 扩展。
- 不实现年度趋势、部门排行、金额汇总、专利法律状态专项统计、钻取详情、导出、缓存或完整报表平台。
- 不加入新图表库或新依赖。

只读上下文建议：
1. `E:\Vibe coding\AGENTS.md`
2. `vibe-methodology/00-operating-protocol.md`
3. `vibe-methodology/01-task-classification.md`
4. `vibe-methodology/08-quality-gates.md`
5. `memory-bank/implementation-plan.md` 顶部 Step 17A/17B 状态
6. `memory-bank/progress.md` 顶部 Step 17A/17B 结果
7. `memory-bank/evidence.md` 顶部 Step 17A/17B 证据
8. `memory-bank/decisions.md` 顶部 D079/D080
9. `apps/web/src/App.tsx`
10. `apps/web/src/Dashboard.tsx`
11. `apps/web/src/Dashboard.test.ts`
12. `apps/web/src/App.css`

执行范围：
1. 文案统一：
   - 在 `App.tsx` 中将统计看板导航描述从 Step 17A/17B 子步骤措辞统一为 Step 17 overall。
   - 在 `Dashboard.tsx` 中将 no-user、header、boundary、只读提示等文案从 Step 17A/17B 子步骤措辞统一为 Step 17 overall。
   - 确保页面仍清楚说明：Step 17 是只读 dashboard summary 前端闭环，不是完整报表平台。
2. 测试同步：
   - 如 `Dashboard.test.ts` 中有文案断言或 boundary 文案相关测试，做最小同步。
   - 不扩大测试到新功能。
3. 不建议改 `App.css`，除非文案变化导致移动端布局问题。
4. memory-bank 更新：
   - `implementation-plan.md` 顶部新增 Step 17 Archive：
     - Step 17A DONE
     - Step 17B DONE
     - Step 17 overall DONE
     - 归档范围、边界、门禁、浏览器/API 验收摘要
   - `progress.md` 顶部记录 Step 17 统计看板前端只读闭环归档。
   - `evidence.md` 顶部记录最终门禁和浏览器/API 只读验收证据。
   - `decisions.md` 新增 D081：
     - Step 17 归档为 readonly dashboard frontend completion。
     - 包含 `GET /dashboard/summary`、7/30/90 dueSoonDays、基础摘要、五组 buckets、无用户 no-request、GET-only 请求边界。
     - 不包含后端扩展、today、完整报表平台、写接口、审计/设置等。

最终门禁：
- `corepack pnpm --filter @research-ip/web test`
- `corepack pnpm --filter @research-ip/web typecheck`
- `corepack pnpm --filter @research-ip/web build`
- `corepack pnpm lint`

浏览器/API 只读验收：
- 复用后端 3000，先只读检查 `GET /api/health`。
- 临时启动前端，验收后停止。
- 清空 localStorage。
- 无 demo user 进入统计看板：确认无业务 API 请求。
- 应用 demo user `40000000-0000-4000-8000-000000000002`：
  - 默认只请求 `GET /api/dashboard/summary?dueSoonDays=30`
  - 切换 7：只请求 `GET /api/dashboard/summary?dueSoonDays=7`
  - 切换 90：只请求 `GET /api/dashboard/summary?dueSoonDays=90`
  - 刷新：保留当前窗口
- 确认无 POST / PATCH / DELETE。
- 确认无 `/audit-logs`、`/fees/warnings`、附件、search_logs、Meilisearch 请求。
- 390px 检查无 document-level 横向溢出。
- 检查页面文本已统一为 Step 17 overall，不再出现 Step 17A/17B 子步骤措辞。

输出要求：
1. 说明 Step 17C 做了什么。
2. 列出修改文件。
3. 给出最终门禁结果。
4. 给出浏览器/API 只读验收结果。
5. 明确边界：未新增功能、未做后端改造、未做写接口、未做完整报表平台。
6. 给出剩余风险。
7. 最后停住，不生成下一步 Prompt；等待 Prompt 编排对话判断 Step 17 是否最终归档完成。
~~~

## Step 17D



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

# 19、Step 19

~~~
你现在接手 E:\研究院科研成果管理系统 项目的 Step 19 计划确认。

本轮只做计划确认：
- 不实现功能。
- 不修改项目文件。
- 不运行 test / typecheck / build / lint。
- 不启动前端。
- 不发起业务请求或写请求。
- 不读取 `.env`、密钥、Token、Cookie、证书、私钥。
- 只读必要上下文，重新判断 Step 19 应优先选择的一期剩余方向。

当前状态：
- Step 16 overall / Archive：DONE，readonly search center frontend completion。
- Step 17 overall / Archive：DONE，readonly dashboard frontend completion。
- Step 18 overall / Archive：DONE_WITH_MOCK_BROWSER_RISK，masked readonly audit-log closure。
- Step 18 dialogue wrap-up：DONE。
- D082 / D083 / D084 已记录。
- Step 19 尚未开始。

Step 18 已完成：
- 后端 `GET /audit-logs` masked readonly API。
- 前端 AuditLogs masked readonly 页面。
- `audit` 导航从 BoundaryPage 接入真实页面。
- 明确不包含完整审计平台、导出、下载、unmasked、审计分析。
- 残余风险：Step 18B 浏览器 success / 403 使用 Playwright route mock，不是 live backend/database dataset。

请只读必要上下文：
1. `E:\Vibe coding\AGENTS.md`
2. `E:\Vibe coding\vibe-methodology\00-operating-protocol.md`
3. `E:\Vibe coding\vibe-methodology\01-task-classification.md`
4. `E:\Vibe coding\vibe-methodology\08-quality-gates.md`
5. `E:\研究院科研成果管理系统\memory-bank\implementation-plan.md` 顶部 Step 18 Archive 状态
6. `E:\研究院科研成果管理系统\memory-bank\progress.md` 顶部 Step 18 收尾结果
7. `E:\研究院科研成果管理系统\memory-bank\evidence.md` 顶部 Step 18 证据
8. `E:\研究院科研成果管理系统\memory-bank\decisions.md` 顶部 D084
9. `product-brief.md`、`feature-brief.md`、`design-spec.md` 中一期剩余范围相关小节
10. `apps/web/src/App.tsx` 当前导航、已实现页面、占位页面
11. 如需确认候选方向，只读对应小范围契约，不展开无关历史。

请比较 Step 19 候选方向：
- 系统配置边界页 / 配置能力。
- 附件相关路线。
- Step 14 DataGap 收敛。
- Step 15 真实费用写入验收。
- 真实费用凭证附件能力。
- 独立 `GET /fees/warnings` 或 warnings API。
- search_logs 写入。
- Meilisearch / 外部搜索引擎同步。
- 数组 targetTypes / api-client 数组 query 扩展。
- 其他一期剩余明确缺口。

重点判断：
- 哪些方向已有后端契约、适合低风险闭环。
- 哪些方向涉及真实写请求、数据保留、seed/migrate/data cleanup，必须用户显式确认。
- 哪些方向只是边界页，不应伪造成已实现能力。
- Step 19 是否应继续优先低风险只读闭环，还是必须进入高风险遗留路线。
- 不得把 Step 14 DataGap、Step 15 真实写入、附件、系统配置、warnings、search_logs、Meilisearch 自动混在一个 Step。

请输出：
1. 当前状态复核。
2. 一期剩余范围证据摘要。
3. 候选方向比较。
4. Step 19 推荐方向与依据。
5. 任务分类 XS/S/M/L，并说明原因。
6. Step 19 目标、非目标、成功标准。
7. 建议拆分子步骤，例如 Step 19A / 19B / 19C，但只给计划，不执行。
8. 每个子步骤的文件范围、验证方式、浏览器/API 验收思路和风险。
9. memory-bank 更新建议。
10. 最终结论：`Step 19 plan confirmation: DONE / NOT DONE`。

本轮停止在计划确认，不要实现，不要生成执行 Prompt。
~~~

