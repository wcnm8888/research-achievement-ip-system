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

