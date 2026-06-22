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

