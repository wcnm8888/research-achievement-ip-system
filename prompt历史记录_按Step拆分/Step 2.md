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



