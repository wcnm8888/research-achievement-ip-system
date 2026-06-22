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

