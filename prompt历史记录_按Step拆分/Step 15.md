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

