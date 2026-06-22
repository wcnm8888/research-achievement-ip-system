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



