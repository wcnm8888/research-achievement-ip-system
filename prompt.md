# Prompt 1 - 项目启动与阶段推进编排

## 定位

本节是“科研成果与知识产权管理系统”的项目级 Prompt Playbook，用来指导 Codex 按 `E:\Vibe coding` 方法论推进本项目。

它不是聊天全文归档，而是沉淀可复用的开发编排方式：如何启动新对话、如何确认计划、如何只执行当前 Step、如何处理阻塞、如何验证闭环、如何在 Step 完成后收尾归档。

## 适用场景

- 新开项目或新开 Step 对话。
- Step 执行前做计划确认。
- Step 执行中遇到依赖、数据库、Docker、环境变量等阻塞。
- Step 执行后做验证闭环和收尾归档。
- 防止 Codex 越界进入下一 Step 或提前实现业务功能。

## 核心推进规则

- 一个大 Step 一个新对话。
- 同一个 Step 内连续推进，不频繁换对话。
- Step 已完成并归档后，再新开对话进入下一个 Step。
- 高风险 Step 使用新对话 + 计划模式，例如数据库、权限、安全、架构、质量门禁。
- 每次只执行当前 Step；明确禁止进入后续 Step。
- Step 前先做计划确认，用户确认后再执行。
- Step 后必须收尾归档，更新 `progress.md`、`evidence.md`，必要时更新 `decisions.md`、`architecture.md`、`tech-stack.md`、`implementation-plan.md`。
- 不同步聊天全文，只沉淀稳定事实、决策、验证证据和后续可复用提示词。
- `memory-bank` 是项目上下文的唯一可信来源；新对话应从文件恢复上下文，不依赖上一轮聊天记忆。
- 涉及 `.env`、`DATABASE_URL`、密码、Token、密钥时，只确认存在和用途，不展示、不写入文档、不记录完整连接串。

## 新 Step 计划确认模板

用于进入新的大 Step，但还不写代码。

~~~text
我现在继续开发 E:\研究院科研成果管理系统 项目，准备进入 Step X。

当前状态：
- Step 1 memory-bank 已完成。
- Step 2 项目脚手架已完成，install/lint/typecheck/test/build 均通过。
- Step 3 数据库 schema、migration、seed 已完成，Step 3 整体 DONE。
- 当前只做 Step X 前的计划确认，先不要写代码。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\use.md
- E:\Vibe coding\vibe-methodology\04-architecture-rules.md
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

本次只做 Step X 的执行计划确认。

请输出：
1. Step X 的任务等级和风险判断。
2. Step X 是否需要拆成 XA / XB / XC / XD。
3. 本 Step 的范围：做什么、不做什么。
4. 涉及的模块、文件和数据边界。
5. 执行顺序。
6. 验证命令和质量门禁。
7. 需要我确认的问题。

要求：
- 先不要写代码。
- 不进入下一 Step。
- 不实现本 Step 范围外的业务功能。
- 如果 Step X 太大，请先拆分，等我确认后再执行。
~~~

## 执行当前 Step 模板

用于用户已经确认计划后，只执行当前小步。

~~~text
确认执行 Step XA。

本次只执行 Step XA，不进入 XB/XC/XD，也不进入下一大 Step。

请严格按刚才确认的计划执行：
- 只修改与 Step XA 直接相关的文件。
- 不实现计划外功能。
- 不读取或展示敏感信息。
- 如遇到环境、依赖、数据库、Docker 或权限阻塞，请停止并汇报，不要擅自切换方案。

完成后请运行本 Step 约定的验证命令。

完成后更新：
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- 如有重要取舍，再更新 decisions.md / architecture.md / tech-stack.md / implementation-plan.md。

最后汇报：
1. 创建/修改了哪些文件。
2. 哪些验证通过。
3. 哪些验证失败及原因。
4. 是否可以进入下一小步。
~~~

## 阻塞处理模板

用于遇到 pnpm、Docker、PostgreSQL、DATABASE_URL、迁移等问题。

~~~text
当前 Step 遇到阻塞，请不要进入后续 Step，也不要擅自切换技术方案。

请先做只读诊断：
- 说明阻塞发生在哪个命令或哪个环节。
- 判断是环境问题、依赖问题、配置问题、网络问题、数据库连接问题，还是设计问题。
- 不展示 .env、DATABASE_URL、密码、Token 或完整连接串。
- 不删除、不重置、不清空数据库。

请输出：
1. 阻塞原因。
2. 已经确认的事实。
3. 不建议做的危险操作。
4. 推荐的最小解决方案。
5. 需要我确认的下一步。
~~~

## Step 收尾归档模板

用于一个 Step 完成后，在原对话中收尾，再开新对话进入下一 Step。

~~~text
请对 Step X 做最后收尾归档。

不要进入下一 Step，不要实现新的业务功能。

请检查并在必要时更新：
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\tech-stack.md

收尾目标：
1. 确认 Step X 已标记 DONE。
2. 记录本 Step 已完成的稳定事实。
3. 记录关键决策和原因。
4. 记录验证命令和结果。
5. 记录未进入下一 Step。
6. 写清下一步是下一 Step 的计划确认。

安全要求：
- 不同步聊天全文。
- 不记录 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。

完成后请汇报：
1. 哪些文件被更新。
2. Step X 是否已完整归档。
3. 下一 Step 新对话建议读取哪些文件。
~~~

## 本项目已验证的推进方式

- Step 2 适合先确认脚手架计划，再执行初始化，再补依赖安装和门禁验证。
- `corepack pnpm install` 如因超时失败，应放宽超时继续当前 Step，不要擅自切换 npm/yarn。
- Step 3 适合拆成 3A/3B/3C/3D：
  - 3A：schema 边界确认，只更新文档。
  - 3B：Prisma schema 建模，不创建 migration。
  - 3C：生成并审查 migration，不 seed。
  - 3D：最小 seed 与数据库证据包。
- 本项目 PostgreSQL 使用独立开发容器，不能复用或影响 n8n / content-postgre 容器。
- 数据库相关 Step 必须特别强调：不 `migrate reset`，不清空数据，不记录连接串，不写入真实凭证。



# Prompt 2 - Vibe Coding 方法论推进指导

## 定位

本节是“科研成果与知识产权管理系统”的方法论推进 Prompt，用来让 Codex 先作为 Vibe Coding 推进教练，帮助判断“接下来应该怎么做”。

它不替代 Prompt 1。Prompt 1 负责具体 Step 的启动、执行、阻塞和收尾编排；Prompt 2 负责在进入具体执行前，按 `E:\Vibe coding` 方法论校准任务等级、上下文读取、风险边界、Step 拆分、验证方式和用户确认问题。

它不是聊天全文归档，也不是代码执行指令，而是沉淀可复用的方法论判断方式：如何把模糊需求转成可执行计划，如何判断一个 Step 是否已经能开工，如何在 token 中断或上下文不足后复查完成度，如何避免“方向稿当完成稿”，如何把阶段经验整理成后续可复用模板。

## 适用场景

- 用户只说“接下来怎么做”“帮我看下一步”，还没有明确执行范围。
- 准备进入新的 Step，但需要先判断任务等级、风险和拆分方式。
- Step 计划看起来合理，但还不确定是否已经足够可执行。
- token 消耗完、上下文压缩、中断恢复后，需要复查是否出现半成品、遗漏或假完成。
- 需求比较模糊，需要先整理成目标、非目标、范围、模块边界、执行顺序和验收标准。
- 阶段执行后，需要复盘是否符合 Vibe Coding 方法论，并沉淀可复用提示词。

## 核心指导规则

- 默认先做只读诊断；除非用户明确确认，不写代码、不修改文件。
- 先读取 `E:\Vibe coding\AGENTS.md`、必要的方法论文档和项目 `memory-bank`，再给推进建议。
- 先判断任务等级 XS / S / M / L，再决定流程重量、文档要求和质量门禁。
- 中大型或高风险任务必须先拆 Step，并明确每个小步的完成定义。
- 高风险领域包括数据库、权限、安全、架构、生产配置、CI/CD、数据迁移、审计和涉密访问。
- 对每次推进建议，都要写清楚做什么、不做什么、涉及哪些模块、哪些文件边界、哪些数据边界。
- 如果计划只是方向稿，要明确标注“尚不能直接开工”，并列出必须补齐的决策。
- `memory-bank` 是项目上下文的唯一可信来源；不依赖聊天记忆判断项目状态。
- 不同步聊天全文，只沉淀稳定事实、决策、验证证据、边界控制和后续可复用提示词。
- 不记录 `.env`、`DATABASE_URL`、密码、Token、密钥、Cookie 或完整连接串。

## 方法论推进诊断模板

用于用户不知道下一步怎么推进时，先让 Codex 做方法论判断，不直接写代码。

~~~text
我现在继续推进 E:\研究院科研成果管理系统 项目，但还不确定下一步应该怎么做。

请先只读，不要修改文件。

请先读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\use.md
- E:\Vibe coding\vibe-methodology\00-operating-protocol.md
- E:\Vibe coding\vibe-methodology\01-task-classification.md
- E:\Vibe coding\vibe-methodology\02-sdd-workflow.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\product-brief.md
- E:\研究院科研成果管理系统\memory-bank\architecture.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md

请按 Vibe Coding 方法论输出：
1. 当前项目状态判断。
2. 下一步最应该推进什么。
3. 该任务属于 XS / S / M / L 哪一级，原因是什么。
4. 是否需要 SDD、memory-bank 更新或新开 Step 对话。
5. 是否需要拆成 XA / XB / XC / XD。
6. 执行前必须补齐的决策。
7. 风险边界：明确做什么、不做什么。
8. 建议读取的文件清单。
9. 建议验证命令和质量门禁。
10. 可以直接复制到下一轮对话的 Prompt 草稿。

要求：
- 只做推进建议，不写代码。
- 不进入具体实现。
- 不同步聊天全文。
- 不记录敏感信息。
~~~

## Step 执行前可开工性诊断模板

用于检查一个 Step 的计划是否已经足够具体，避免把方向稿误当执行计划。

~~~text
我准备执行 E:\研究院科研成果管理系统 的 Step X。

请先做 Step X 的可开工性诊断，不要修改文件，不要写代码。

请读取：
- E:\Vibe coding\AGENTS.md
- E:\Vibe coding\vibe-methodology\01-task-classification.md
- E:\Vibe coding\vibe-methodology\08-quality-gates.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- 与 Step X 直接相关的代码或配置文件

请输出：
1. 当前 Step X 是“可执行计划”还是“方向稿”。
2. 如果还不能开工，缺少哪些决策、数据、依赖、测试或边界。
3. 是否存在越界风险，例如提前进入后续 Step 或实现计划外业务。
4. 本 Step 应该拆成哪些小步，每步完成定义是什么。
5. 每个小步需要修改的文件范围。
6. 每个小步不允许修改或实现的内容。
7. 测试数据或 fixture 应该如何准备，是否会污染 seed 或开发数据库。
8. 需要新增依赖时，列出依赖名称、用途和是否需要用户确认。
9. 推荐的验证命令和质量门禁。
10. 需要用户确认的问题清单。

要求：
- 只读诊断。
- 不修改 schema、migration、seed、代码或配置。
- 不展示 .env、DATABASE_URL、密码、Token 或密钥。
- 如果发现计划不足，请明确说“尚不能直接开工”。
~~~

## Token 中断后完成度复查模板

用于 token 消耗完、上下文压缩、执行中断或恢复对话后，确认是否出现遗漏、半成品或假完成。

~~~text
我上一轮推进 E:\研究院科研成果管理系统 的 Step X 时发生了 token 消耗完 / 上下文中断。

请帮我重新检查这一步有没有受到影响，先不要修改文件。

请只读检查：
- E:\Vibe coding\AGENTS.md
- E:\研究院科研成果管理系统\memory-bank\implementation-plan.md
- E:\研究院科研成果管理系统\memory-bank\progress.md
- E:\研究院科研成果管理系统\memory-bank\evidence.md
- E:\研究院科研成果管理系统\memory-bank\decisions.md
- 与 Step X 相关的源码、测试、配置和 package 文件

请输出：
1. Step X 在文档中是 TODO、IN PROGRESS 还是 DONE。
2. progress、evidence、implementation-plan 是否一致。
3. 是否存在新增但未完成的半成品文件。
4. 是否存在文档说完成、代码或测试没有支撑的情况。
5. 是否存在只写了方向稿、却被误认为可以执行或已经完成的情况。
6. 是否有计划外改动、敏感信息、临时文件或越界实现。
7. 已经确认完成的稳定事实。
8. 仍然缺失的任务、决策、测试或证据。
9. 下一步应该继续执行、回滚计划、补计划，还是先收尾归档。
10. 推荐的下一条 Prompt。

要求：
- 只读复查，不修复。
- 不运行破坏性命令。
- 不删除、不重置、不清空数据。
- 不读取或展示敏感凭证内容。
~~~

## 模糊需求转执行计划模板

用于把一句模糊需求整理成符合 Vibe Coding 方法论的可执行 Step 计划。

~~~text
我有一个新的需求，想放进 E:\研究院科研成果管理系统：

需求描述：
[在这里写需求]

请先不要写代码，先按 Vibe Coding 方法论把它整理成可执行计划。

请输出：
1. 目标：这次真正要解决什么。
2. 非目标：这次明确不做什么。
3. 任务等级 XS / S / M / L 和判断原因。
4. 是否需要更新 product-brief / feature-brief / design-spec / architecture / implementation-plan。
5. 是否需要拆成多个 Step 或子步骤。
6. 涉及的业务模块、代码模块、数据库边界和外部依赖。
7. 推荐实现顺序。
8. 每一步的完成定义。
9. 验证命令、测试范围和人工验收方式。
10. 需要我确认的问题。

要求：
- 先计划，后实现。
- 不越界实现需求外功能。
- 高风险操作必须单独列出并等待确认。
- 不同步聊天全文，不记录敏感信息。
~~~

## 执行前确认问题模板

用于让 Codex 在真正动手前，把必须由用户决策的问题一次性列清楚。

~~~text
请基于当前 Step 计划，整理执行前必须由我确认的问题。

要求：
- 只列会影响架构、数据、安全、权限、依赖、测试或范围边界的问题。
- 不询问可以通过读取项目文件自行确认的问题。
- 每个问题都给出推荐选项和理由。
- 标明如果不确认会导致什么风险。
- 不写代码，不修改文件。

请按以下格式输出：
1. 问题：
   推荐：
   原因：
   不确认的风险：
2. 问题：
   推荐：
   原因：
   不确认的风险：
~~~

## 方法论执行复盘模板

用于阶段结束后复查是否符合 Vibe Coding 方法论，并决定是否可以进入下一步。

~~~text
请对 E:\研究院科研成果管理系统 的 Step X 做一次方法论执行复盘。

请先只读检查，不要实现新功能。

请输出：
1. 本 Step 原定目标是否达成。
2. 是否只执行了当前 Step，没有进入后续 Step。
3. 是否遵守最小修改原则。
4. 是否有足够证据支撑完成结论。
5. 运行过哪些验证命令，结果如何。
6. memory-bank 哪些文件需要更新或已经更新。
7. 是否记录了稳定事实、关键决策和剩余风险。
8. 是否存在聊天全文、敏感信息或临时内容被写入文档。
9. 是否可以进入下一 Step 的计划确认。
10. 下一轮对话建议使用的 Prompt。

要求：
- 不同步聊天全文。
- 不记录 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
- 不执行删除、重置、清空、批量清理等破坏性操作。
~~~

## Prompt 沉淀模板

用于把一次已经验证有效的推进方式整理进本手册。

~~~text
请把本次对话中可复用的 Vibe Coding 推进经验整理到：

E:\研究院科研成果管理系统\prompt.md

定位为：
Prompt X - [主题名称]

要求：
- 不同步聊天全文。
- 只沉淀可复用的方法论流程、提示词模板、边界控制和验证方式。
- 保留对后续项目推进有帮助的模板。
- 不记录临时情绪、重复讨论、敏感信息或完整日志。
- 不记录 .env、DATABASE_URL、密码、Token、密钥或完整连接串。
- 放在正式 Prompt Playbook 区域，不要混入历史 prompt 记录。
- 写入前先说明建议位置、章节结构和包含哪些模板，等我确认后再修改文件。
~~~

## 本项目已验证的方法论补充

- 当用户只问“接下去怎么做”时，优先进入只读诊断，不直接执行代码。
- 如果上一轮因 token 消耗完中断，应先检查 `implementation-plan.md`、`progress.md`、`evidence.md` 和相关源码是否一致。
- 如果文档仍显示 Step TODO，而源码没有新增半成品文件，应明确说明“未发现假完成”，但仍要检查计划是否足够可执行。
- 高风险 Step 即使方向正确，也必须补齐角色、权限点、测试数据、依赖、验收定义等决策后再执行。
- 对权限、数据库、审计、涉密等 Step，测试矩阵不能只写场景，还要说明测试数据或 fixture 如何准备。
- 执行前新增依赖必须说明名称、用途和必要性，由用户确认后再安装或修改 package 文件。

# Prompt 11 - Step 14 编排收尾与 Prompt 12 交接

## 定位

Prompt 11 是 Prompt 编排对话，不是 Step 执行对话。它的职责是判断 Step 输出是否闭环、是否越界、证据是否充分，并为 Step 对话生成单一的计划确认 Prompt、执行 Prompt 或收尾归纳 Prompt。

Prompt 12 与 Prompt 11 保持同一定位：继续负责 Prompt 编排，不直接替 Step 对话实现功能。Step 对话只执行当前单一 Prompt，不生成下一步 Prompt。

## Prompt 11 推进结果

- Step 14A：DONE。确认 Step 14 方向为“审批任务联动成果详情”，D065 已记录。
- Step 14B：DONE。完成审批任务详情中的关联成果只读查看基础。
- Step 14B-API500 修复链路：DONE。清除真实 API 500，`health`、`achievements list`、`workflow tasks` 均恢复 HTTP 200。
- Step 14C：DONE。补齐状态、错误、空态、无关联成果边界和 390px 移动端体验。
- Step 14D：DONE。Step 14 overall 归档为 `DONE_WITH_DATAGAP_RISK`，D066 已记录。
- Step 14E：DONE。Backend DI Explicit Inject Audit 完成，D067 / D068 / D069 已记录。
- Step 15：未开始。

## 关键问题与纠偏

- Step 14B 前曾出现编排偏差：本应先生成 Step 14A 执行 Prompt，却误判为进入 Step 14B。后续已纠正为单步推进：计划确认、执行、收尾分别独立生成 Prompt。
- Step 14B 初次浏览器验收时后端未启动，只覆盖到后端不可用路径。用户指出应启动后端或先确认，后续补做 Step 14B-Verify。
- API500 不是数据缺失导致，而是 Nest provider 在 `tsx watch` dev runtime 下依赖注入不稳定，部分 constructor 依赖为 `undefined`。
- API500 修复必须分层推进，不能一次越界扩大范围。实际顺序为 service / policy factory -> repository -> SecretAccessPolicy。
- Step 14C 初次浏览器验收包含前端网络桩验证。用户要求真实后端复查，后续补做 Step 14C-Browser-Recheck。
- DataGap 被明确区分：`workflow tasks` 为空导致真实“任务详情 -> 查看关联成果详情”成功路径未覆盖；这不是 API500，也不是 Step 14 实现失败。
- Step 14E 被设为独立技术债 / 质量步骤，在 Step 14 完成后、Step 15 前执行。

## API500 根因与解决

根因：`api dev` 使用 `tsx watch src/main.ts` 时，部分 Nest provider 依赖 constructor type metadata 注入不稳定，运行时依赖为 `undefined`。

典型错误点：

- `WorkflowService.assertReviewContext` 中 `rbacPolicy` 为 `undefined`。
- `AchievementService.list` 中 `policyQueryFactory` 为 `undefined`。
- `AchievementRepository` / `WorkflowRepository` 中 `prisma` 为 `undefined`。
- `SecretAccessPolicyService` 中 `resourceGrantPolicy` 为 `undefined`。

解决方式：

- 对后端 provider 构造依赖补显式 `@Inject(...)`。
- 增加 metadata / DI 回归测试。
- 不改变业务语义、权限、脱敏、查询、workflow 状态机、DTO、schema、migration、seed。

扩展审计：

- Step 14E-1：repository `PrismaService` explicit inject audit。
- Step 14E-2：authorization policy explicit inject audit。
- Step 14E-3：service / controller / adapter explicit inject audit。
- Step 14E-4：final gates and readonly smoke。

## 质量证据归纳

- Step 14C web test：PASS，7 files / 66 tests。
- Web typecheck：PASS。
- Web build：PASS，仅 Vite chunk size warning。
- Lint：PASS。
- Step 14E-4 api test：PASS，51 files / 465 tests。
- API typecheck：PASS。
- API build：PASS。
- Lint：PASS。

Readonly smoke：

- `GET /api/health`：HTTP 200。
- `GET /api/achievements?page=1&pageSize=5`：HTTP 200，`items=2`。
- `GET /api/workflow/tasks/my?status=PENDING`：HTTP 200，`items=0`。
- `dashboard` / `search` / `fees` smoke：HTTP 200。
- `attachments metadata`：HTTP 403，作为权限边界记录。

浏览器验收：

- PASS：no-user 不发业务请求、真实后端空列表、后端不可用错误态、390px 无横向溢出。
- PARTIAL：真实“任务详情 -> 查看关联成果详情”成功路径因 DataGap 未覆盖。

## DataGap 归档

当前 `workflow tasks` 为空，`GET /api/workflow/tasks/my?status=PENDING` 返回 HTTP 200 但 `items=0`。因此无法打开真实审批任务，也无法完整覆盖“审批任务详情 -> 查看关联成果详情”的真实成功路径。

该问题归档为验收数据缺口，不是 API500、不是前端实现失败，也不是后端 DI 修复失败。Step 14 状态为 `DONE_WITH_DATAGAP_RISK`。

后续应在一期整体验收或单独数据路线中补。除非用户明确确认数据路线，否则不允许用 fake / mock / seed 数据冒充真实验收。

## 决策索引

- D065：审批上下文只读复用现有成果详情契约，使用 `GET /achievements/:id`，不带入 `submit` / `void` / `archive`。
- D066：Step 14 接受为 `DONE_WITH_DATAGAP_RISK`；真实成功路径留到一期整体验收或单独数据路线；Step 14E 优先于 Step 15。
- D067：repository 注入 `PrismaService` 时使用显式 `@Inject(PrismaService)`。
- D068：authorization policy provider 依赖其他 provider 时使用显式 `Inject(...)`。
- D069：service / controller / adapter provider 依赖其他 provider 时使用显式 `Inject(...)`，token provider 继续使用既有 token。

## Prompt 12 交接

Prompt 12 起点：

- Step 14 overall：`DONE_WITH_DATAGAP_RISK`。
- Step 14E：DONE。
- Step 15：未开始。

Prompt 12 首要任务应是 Step 15 计划确认，而不是 Step 15 执行。如果用户选择先补 Step 14 DataGap，应走单独数据路线确认，不混入 Step 15。

继续保持：

- 每次只推进一个计划确认或一个执行 Prompt，不跨多个子 Step。
- Prompt 对话负责生成 Prompt；Step 对话负责执行 Prompt。
- Step 输出必须检查目标、实现、门禁、浏览器/API 验收、边界、memory-bank 归档和下一步边界。
- 不把 Step 14 DataGap 说成已验收通过。



