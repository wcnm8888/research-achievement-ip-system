# Step 146 - 甲方视角登录后逐页验收与收尾修复

日期：2026-07-07

起点 HEAD：`c2a2de1 docs: archive final client-facing browser acceptance`

## 结论

结果：**PASS**。

本 Step 在用户手动登录本地浏览器后完成认证态逐页验收，并修复验收中发现的
甲方视角展示问题。

## 修复内容

- 前端不再展示服务端 500 的原始英文 detail。
  - `api-client` 对 500 错误不再保留后端原始 detail。
  - 通用 `ErrorState` 对服务端错误展示固定中文说明。
- 导入预检卡片 DOM className 不再包含 `dry-run`。
  - 成果导入预检、账号导入预检、部门导入预检改为 `precheck` 命名。
- 费用页面残留英文文案改为中文。
- 审计日志脱敏摘要中的 `null` 改为中文空值 `未返回`。
- Dashboard API 在本地旧 Docker DB 缺少 `achievement_conversions` 表时，
  转化统计安全降级为空统计，避免工作台/统计看板整体 500。
  - 没有修改 Prisma schema。
  - 没有新增 migration。
  - 没有运行 migration。

## 本地 Docker 刷新

为让本地 `18081/14001` 使用最新代码，执行了：

```text
docker compose -f docker-compose.production.yml build web
docker compose -f docker-compose.production.yml up -d --no-deps web
docker compose -f docker-compose.production.yml build api
docker compose -f docker-compose.production.yml up -d --no-deps api
```

未执行：

- `docker system prune`
- `docker volume prune`
- `docker compose down -v`
- volume 删除
- orphan 清理
- 本地文件删除
- 新建其他 stack

Docker 仍提示存在 orphan containers；本 Step 只记录提示，没有清理。

## 认证态浏览器验收

证据目录：

```text
.local-step146-authenticated-client-facing-acceptance/
```

关键证据：

- `final-build-text-scan.txt`
- `api-fixed-authenticated-page-sweep.json`
- `api-fixed-authenticated-request-summary.json`
- `api-fixed-authenticated-response-summary.json`
- `42-api-fixed-工作台.png`
- `43-api-fixed-成果管理.png`
- `44-api-fixed-审批管理.png`
- `45-api-fixed-费用管理.png`
- `46-api-fixed-检索中心.png`
- `47-api-fixed-统计看板.png`
- `48-api-fixed-自定义报表.png`
- `49-api-fixed-审计日志.png`
- `50-api-fixed-系统配置.png`
- `51-api-fixed-涉密授权管理.png`
- `52-api-fixed-账号管理.png`
- `53-api-fixed-部门维护.png`

最终服务状态：

- `GET http://127.0.0.1:14001/api/health` -> 200。
- `GET http://127.0.0.1:18081` -> 200。
- `18081` active bundle：`assets/index-7UX6IDF1.js`。
- compose `api`、`postgres`、`web` 均为 healthy。

最终认证态逐页扫描：

- 覆盖页面：
  - 工作台
  - 成果管理
  - 审批管理
  - 费用管理
  - 检索中心
  - 统计看板
  - 自定义报表
  - 审计日志
  - 系统配置
  - 涉密授权管理
  - 账号管理
  - 部门维护
- 12 个页面可见文本与 DOM 禁用词扫描均为 0。
- 观察到的请求方法只有 GET。
- 响应状态只有 200 / 304。
- 未观察到 POST/PUT/PATCH/DELETE、export、download、debug、batch mutation。

禁用词族覆盖：

- `Internal server error`
- `dry-run`
- `dryRun=true`
- `Phase 1 frontend`
- `production auth`
- `GET /`
- `POST /`
- `X-Demo-User-Id`
- `Achievement CSV dry-run`
- `Safe preview`
- raw network fallback wording
- `Custom Reports`
- `Secret Authorization`
- `local/demo`
- `not production`
- `raw JSON`
- `batch mutation`
- `Rejected codes`
- `Error count`
- `Achievement conversion ledger`
- `Fee review workflow task`
- `dashboard summary`
- `warnings API`
- `Task ID`
- `.env`
- `CRUD`
- `undefined`
- `null`

## 验证

- `corepack pnpm --filter @research-ip/web test -- App Achievements AccountManagement DepartmentManagement Dashboard Fees AuditLogs api-client`: PASS，9 files / 233 tests。
- `corepack pnpm --filter @research-ip/web typecheck`: PASS。
- `corepack pnpm --filter @research-ip/api test -- dashboard`: PASS，5 files / 42 tests。
- `corepack pnpm --filter @research-ip/api typecheck`: PASS。
- Local Web build output scan: PASS，最终 bundle `index-7UX6IDF1.js`。
- Final authenticated browser sweep: PASS。

## 边界

- 未读取 `.env` 或 `.env.production` 内容。
- 未读取、展示或记录密码、Cookie、Token、连接串或密钥。
- 登录由用户在可见浏览器中手动完成。
- 未访问 production/VPS/生产 DB。
- 未调用真实外部系统。
- 未修改 Prisma schema。
- 未新增 migration。
- 未运行 migration。
- 未执行 Docker prune、volume 删除、`down -v`、orphan 清理或本地文件删除。
- 本次是本地 Docker production-like / synthetic 甲方视角验收，不是
  production/VPS/真实外部系统验收。
