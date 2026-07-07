# Step 145 - 刷新 18081 演示入口并做最终浏览器验收 Prompt

日期：2026-07-07

当前基线：`836490c fix: localize remaining client-facing copy`

## 当前阻塞

实际演示入口 `http://127.0.0.1:18081` 仍在服务旧前端包：

```text
assets/index-DTUeQ4MR.js
```

最新源码构建包为：

```text
.local-step144-client-facing-copy-polish/dist/assets/index-BDGa5WnL.js
```

所以当前仍不能冻结代码。下一步必须刷新实际演示入口，并做真实浏览器截图验收。

## 推荐给下一步 Codex 的 Prompt

```text
Step 145 - 刷新本地演示 Web 包并做甲方视角最终浏览器验收

工作目录：
E:\Vibe coding\production-github-main-20260626

起点 HEAD：
836490c fix: localize remaining client-facing copy

目标：
把当前本地演示入口 http://127.0.0.1:18081 刷新到最新前端 bundle，然后从甲方视角做真实浏览器验收。
本 Step 目标是本地演示 / 竞赛评审 / synthetic 数据交付版验收，不是 production/VPS/生产 DB/真实外部系统验收。

先做只读核查：
1. git log -1 --oneline
2. git status --short
3. git diff --stat
4. git diff --cached --stat
5. GET http://127.0.0.1:14001/api/health
6. GET http://127.0.0.1:18081
7. 记录 18081 当前 HTML 引用的 /assets/index-*.js

允许：
- 读取当前 Docker compose 状态。
- 只重建/替换 docker-compose.production.yml 管理的 web 容器。
- 可运行：
  docker compose -f docker-compose.production.yml build web
  docker compose -f docker-compose.production.yml up -d --no-deps web
- 复用现有 API、postgres 和 volume。
- 验证 14001 / 18081。
- 使用本地已授权账号做浏览器登录和只读页面验收。
- 只关闭本 Step 启动的浏览器会话。

禁止：
- 不读取 .env / .env.production 内容。
- 不访问 production/VPS/生产 DB。
- 不调用真实外部系统。
- 不执行 docker system prune。
- 不执行 docker volume prune。
- 不执行 docker compose down -v。
- 不删除 volume。
- 不删除本地文件。
- 不清理 orphan。
- 不新建其他 stack 名称。
- 不修改 prisma/schema.prisma。
- 不新增 migration。
- 不把 local/demo/synthetic 或本地 Docker production-like 验收写成 production acceptance。

验收范围：
1. 确认 18081 已加载最新 Web bundle，不再引用旧 index-DTUeQ4MR.js。
2. 登录页：
   - 未登录状态不显示“已登录”。
   - 显示中文业务文案：未登录、请先登录、系统登录、邮箱、密码、登录。
3. 登录后逐页检查并截图：
   - 工作台
   - 成果管理
   - 成果导入预检
   - 审批管理
   - 费用管理
   - 费用凭证附件
   - 检索中心
   - 统计看板
   - 自定义报表
   - 审计日志
   - 系统配置
   - 涉密授权管理
   - 账号管理
   - 部门维护
4. 页面普通可见文案不得出现：
   - Phase 1 frontend
   - production auth
   - GET /
   - POST /
   - X-Demo-User-Id
   - dryRun=true
   - dry-run
   - Achievement CSV dry-run
   - Safe preview
   - Failed to fetch
   - Network request failed
   - Custom Reports
   - Secret Authorization
   - local/demo
   - not production
   - raw JSON
   - debug
   - export/download/batch mutation 控件
   - Rejected codes
   - Error count
   - Achievement conversion ledger
   - Fee review workflow task
   - dashboard summary
   - warnings API
   - Task ID
   - Step 作为普通页面标签
   - Token / Cookie / .env 作为普通页面文案
5. 允许作为内部字段或数据值出现但不得作为普通页面文案：
   - CSV 列名，例如 email、departmentCode、roleCode
   - 安全错误码，例如 UNKNOWN_DEPARTMENT、DUPLICATE_IN_FILE
   - 业务标准缩写 DOI
   - 内部请求头或安全字段名只允许在源码/网络层，不应在页面可见文本中出现
6. 网络请求边界：
   - 记录 /api 请求方法和路径。
   - 不记录 Cookie、Token、密码、连接串、请求体或敏感 header。
   - 不出现 export/download/debug/batch mutation 请求。

证据归档：
- 可新增 .local-step145-final-client-facing-browser-acceptance/
- 存放截图、bundle 检查、请求方法摘要、DOM 禁用词扫描摘要。
- 更新 memory-bank/progress.md。
- 更新 memory-bank/evidence.md。
- 可新增 memory-bank/client-facing-final-browser-acceptance-step145.md。

验证：
- git diff --check
- git diff --cached --check
- 如果只刷新 Docker Web 和写文档，不必跑源码 test/typecheck。
- 如果发现并修改 apps/web 源码，必须跑：
  corepack pnpm --filter @research-ip/web test -- App AchievementDetail Fees AuditLogs Search Workbench Dashboard AccountManagement DepartmentManagement SettingsBoundary SecretAuthorization CustomReports
  corepack pnpm --filter @research-ip/web typecheck
- git diff --stat
- git diff --cached --stat
- git status --short

提交 message：
docs: archive final client-facing browser acceptance

收尾汇报必须包含：
- 实际 HEAD
- 18081 是否已加载最新 bundle
- local UI acceptance 结果：PASS / PASS with caveat / BLOCKED
- caveat 或 BLOCKED 原因，不得包装
- 是否仍不是 production/VPS/真实外部系统验收
- 页面禁用词扫描结果
- 是否出现 export/download/debug/batch mutation 请求
- 是否修改源码/schema/migration
- 明确未读取密钥、未访问 production、未调用真实外部系统、未执行 prune/down-v/volume 删除/orphan 清理
```

## 为什么需要用户授权

刷新 `18081` 的实际演示入口需要操作本地 Docker compose 管理的 Web 容器。
这虽然不是清理或删除操作，但会替换正在运行的本地 Web 容器，因此必须由用户明确授权后再执行。

## 当前不应宣称

在 Step 145 完成前，不应宣称：

- 前端 UI 已冻结。
- 甲方浏览器验收已完成。
- `18081` 已使用最新 bundle。
- production/VPS/生产 DB/真实外部系统验收通过。
