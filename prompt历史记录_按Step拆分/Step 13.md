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



