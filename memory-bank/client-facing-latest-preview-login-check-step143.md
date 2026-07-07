# Step 143 - 最新前端预览登录页甲方检查

日期：2026-07-07

审查基线：`bc9b101 docs: add client-facing code freeze punch list`

## 结论

本 Step 使用非 Docker 临时预览入口验证最新前端包，发现并修复一个真实甲方视角问题：

> 未登录页面同时显示“已登录”和“请先登录”。

修复后，最新预览登录页显示为：

- `未登录`
- `请先登录`
- `系统登录`
- `邮箱`
- `密码`
- `登录`
- `忘记密码`

不再在未认证状态展示“已登录”。

## 本次执行方式

为避免操作 Docker 或覆盖默认构建目录，本次使用新的本地证据目录：

```text
.local-step143-client-facing-preview-acceptance/
```

流程：

1. 启动临时 Node 静态预览服务，端口 `18141`。
2. 服务最新本地构建包。
3. 将 `/api/*` 只读代理到当前可用的本地 `14001` API。
4. 使用 Edge headless 访问 `http://127.0.0.1:18141`。
5. 截图并扫描页面文本。
6. 停止本 Step 启动的临时进程。

临时预览进程已停止，端口 `18141` 已释放。

## 修复内容

修改：

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`

修复点：

- 新增 `getProductionAuthStatusTag`。
- `authenticated` 才显示“已登录”。
- `anonymous` 显示“未登录”。
- `checking` 显示“检查中”。
- `error` 显示“需重新登录”。
- 补测试防止未认证状态错误显示“已登录”。

## 浏览器检查结果

截图证据：

```text
.local-step143-client-facing-preview-acceptance/02-login-fixed-latest-preview.png
```

扫描证据：

```text
.local-step143-client-facing-preview-acceptance/browser-fixed-forbidden-scan.json
.local-step143-client-facing-preview-acceptance/browser-login-fixed-text.txt
```

禁用词扫描结果：

- `Phase 1 frontend`：0。
- `production auth`：0。
- `GET /`：0。
- `POST /`：0。
- `X-Demo-User-Id`：0。
- `dryRun=true`：0。
- `Achievement CSV dry-run`：0。
- `Safe preview`：0。
- `Failed to fetch`：0。
- `Network request failed`：0。
- `Custom Reports`：0。
- `Secret Authorization`：0。
- `local/demo`：0。
- `not production`：0。
- `raw JSON`：0。
- `batch mutation`：0。

登录状态扫描结果：

- `已登录`：0。
- `未登录`：1。
- `请先登录`：1。

网络请求记录：

- `GET /`
- `GET /assets/index-BoKuPyi4.js`
- `GET /assets/index-BbTB0B2E.css`
- `GET /api/auth/me`

未观察到 POST/PUT/PATCH/DELETE、export、download、debug 或 batch mutation 请求。

`/api/auth/me` 返回 401 是未登录状态下的预期结果；页面未把该状态渲染成原始浏览器
错误。

## 验证命令

```text
corepack pnpm --filter @research-ip/web test -- App
```

结果：PASS，2 files / 14 tests。

```text
corepack pnpm --filter @research-ip/web typecheck
```

结果：PASS。

```text
corepack pnpm --filter @research-ip/web exec vite build --outDir ../../.local-step143-client-facing-preview-acceptance/dist --emptyOutDir false
```

结果：PASS。

## 剩余冻结门槛

本 Step 只验证了非 Docker 最新预览入口的登录页和静态禁用词扫描。

代码仍不能完全冻结，直到完成：

1. 刷新实际演示入口 `18081` 的 Web bundle。
2. 使用真实登录账号做完整页面浏览器截图验收。
3. 覆盖成果、导入预检、审批、费用、检索、看板、自定义报表、审计、系统配置、
   涉密授权、账号管理、部门维护等页面。

## 边界

- 未读取 `.env` 或 `.env.production` 内容。
- 未访问 production/VPS/生产 DB。
- 未调用真实外部系统。
- 未操作 Docker。
- 未修改 `prisma/**`、schema 或 migration。
- 只停止本 Step 启动的临时 Node 预览进程。
