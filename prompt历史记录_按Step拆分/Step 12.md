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

