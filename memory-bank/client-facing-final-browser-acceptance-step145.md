# Step 145 - 本地演示 Web 刷新与甲方视角浏览器验收

日期：2026-07-07

起点 HEAD：`51f73e2 docs: prepare final client-facing acceptance prompt`

## 结论

结果：**PASS with caveat**。

已完成：

- 已按授权重建 `docker-compose.production.yml` 管理的 `web` 镜像。
- 已按授权执行 `docker compose -f docker-compose.production.yml up -d --no-deps web` 替换
  compose 管理的 Web 容器。
- `http://127.0.0.1:18081` 已从旧 bundle：

```text
assets/index-DTUeQ4MR.js
```

刷新为最新 bundle：

```text
assets/index-BDGa5WnL.js
```

- 未登录登录页浏览器验收通过：
  - 不显示 `已登录`。
  - 显示 `未登录`、`请先登录`、`系统登录`、`邮箱`、`密码`。
  - 截图时代旧工程化文案 DOM 扫描为 0。

Caveat：

- 新的无状态浏览器上下文没有登录态。
- 本 Step 没有读取、猜测或展示本地账号密码，也没有读取 Cookie/Token。
- 因此认证后逐页截图验收未完成，不能宣称完整 UI/code freeze。

## 执行的 Docker 操作

在用户明确授权范围内执行：

```text
docker compose -f docker-compose.production.yml build web
docker compose -f docker-compose.production.yml up -d --no-deps web
```

未执行：

- `docker system prune`
- `docker volume prune`
- `docker compose down -v`
- volume 删除
- orphan 清理
- 本地文件删除
- 其他 stack 新建

执行 `up -d --no-deps web` 时 Docker 提示存在 orphan containers；本 Step 只记录该提示，
没有清理 orphan。

## 服务与 bundle 证据

证据目录：

```text
.local-step145-final-client-facing-browser-acceptance/
```

关键文件：

- `baseline-checks.txt`
- `post-refresh-checks.txt`
- `active-18081-bundle-text-scan.txt`
- `01-login-page-after-web-refresh.png`
- `unauth-browser-scan.json`
- `unauth-browser-text.txt`
- `02-auth-state-check.png`
- `auth-state-check.txt`
- `auth-state-requests.json`

刷新后服务状态：

- `GET http://127.0.0.1:14001/api/health` -> 200。
- `GET http://127.0.0.1:18081` -> 200。
- compose `api`、`postgres`、`web` 均为 healthy。

## 禁用词扫描

未登录 DOM/HTML 扫描结果为 0：

- `Phase 1 frontend`
- `production auth`
- `GET /`
- `POST /`
- `X-Demo-User-Id`
- `dryRun=true`
- `dry-run`
- `Achievement CSV dry-run`
- `Safe preview`
- `Failed to fetch`
- `Network request failed`
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

实际 `18081` bundle 文本扫描中：

- `X-Demo-User-Id`：3 次。
- `dry-run`：6 次。

判断：

- 这些是内部请求头/接口路径字符串，不是未登录页面普通可见文案。
- 仍需在认证后页面 DOM/截图中确认不会作为普通页面文案出现。

## 网络请求边界

未登录浏览器扫描只观察到：

- `GET /`
- `GET /assets/index-BDGa5WnL.js`
- `GET /assets/index-BbTB0B2E.css`
- `GET /api/auth/me`

未观察到：

- POST/PUT/PATCH/DELETE
- export
- download
- debug
- batch mutation

## 未完成事项

完整冻结前仍需要：

1. 使用本地已授权账号登录 `18081`。
2. 逐页截图验收：
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
3. 对登录后 DOM、截图、请求摘要执行同一组禁用词扫描。

## 边界

- 未读取 `.env` 或 `.env.production` 内容。
- 未读取、展示或记录密码、Cookie、Token、连接串或密钥。
- 未访问 production/VPS/生产 DB。
- 未调用真实外部系统。
- 未修改 `apps/**` 源码。
- 未修改 `prisma/**`、schema 或 migration。
- 未执行 Docker prune、volume 删除、`down -v`、orphan 清理或本地文件删除。
- 本次是本地 Docker production-like / synthetic 演示入口刷新与未登录浏览器验收，
  不是 production/VPS/真实外部系统验收。
