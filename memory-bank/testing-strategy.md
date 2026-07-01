# Testing Strategy

本文件是后续 Step 选择测试方式的优先入口。涉及测试、浏览器验收、本地 production-like 验收时，先读本文件，再读具体 Step 的 evidence/progress 小段。

## 核心原则

- 项目内可重复门禁统一使用 `corepack pnpm`。
- 真实浏览器验收统一优先使用已安装的 `playwright-cli`。
- Docker production-like 只用于本地集成验收，不等于 production/VPS。
- 不优先手写 Chrome CDP；只有 `playwright-cli` 不可用或明确不适用时才考虑 CDP，并在 evidence 中说明原因。
- 不读取 `.env` / `.env.production` 内容。
- 不记录 cookie、token、密码、secret、连接串、AccessKey、私钥。

## 测试分层

| 场景 | 统一方法 | 说明 |
| --- | --- | --- |
| 纯业务规则、状态机、DTO、mapper | Vitest | 快、稳定，默认每个功能都应有 |
| Repository 查询 shape | Vitest + fake/mock Prisma | 默认不连真实 DB |
| API controller / guard / permission / route | Vitest + Supertest | 覆盖 401/403/404/成功路径 |
| Web client/helper/权限显示/状态文案 | Web Vitest | 不开浏览器，覆盖 route、payload、UI 状态逻辑 |
| 真实 UI 操作、上传、下载、drawer、表格、权限切换 | `playwright-cli` | 用浏览器验收真实交互 |
| API + Web + Postgres 闭环 | Docker production-like + API fetch + `playwright-cli` | 本地验收，不等于 production |
| production/VPS smoke | 单独授权后执行 | 默认只做只读健康检查，不混入本地验收 |

## 标准命令

开发中按变更范围运行：

```powershell
corepack pnpm --filter @research-ip/api test -- <相关 spec>
corepack pnpm --filter @research-ip/web test -- <相关 spec>
corepack pnpm --filter @research-ip/api typecheck
corepack pnpm --filter @research-ip/web typecheck
```

提交前门禁：

```powershell
corepack pnpm -r test
corepack pnpm -r typecheck
git diff --check
```

本地 production-like 验收：

```powershell
docker compose -f docker-compose.production.yml build api web
docker compose -f docker-compose.production.yml up -d api web
docker compose -f docker-compose.production.yml ps
```

UI 验收优先使用：

```powershell
playwright-cli -s=<step-name> open http://127.0.0.1:18081/
playwright-cli -s=<step-name> snapshot
playwright-cli -s=<step-name> run-code --filename=memory-bank/<step>-browser-acceptance.js
```

## Local Acceptance Credential Boundary

- Local production-like acceptance may use an explicitly authorized previously logged-in account password or an existing browser login session when the user grants that boundary for the current Step.
- Do not change, reset, print, store, or commit any account password, cookie, token, secret, connection string, private key, or AccessKey.
- Prefer transient local test sessions or synthetic local users for multi-role API matrices when that avoids handling a real password.
- Record only the credential handling boundary and redacted pass/fail evidence in `memory-bank/evidence.md`; never record the credential value or session value.

## Local Session / 401 Diagnostics

- In Docker production-like mode, `NODE_ENV=production` means API auth should be diagnosed through the production session-cookie path, not dev headers.
- When a local API request unexpectedly returns 401, first separate DB session validity from HTTP client cookie delivery.
- DB-side diagnostics must output only booleans or counts, such as session found, user status, credential status, role count, expiry valid, and revoked flag.
- HTTP diagnostics should use `curl.exe` on Windows when checking cookie behavior, and should output only status codes or redacted JSON summaries.
- Do not print the transient session value, cookie value, session hash, password, or `SESSION_SECRET`.
- If a tool command echoes a transient cookie/session value during experimentation, rotate or overwrite that transient local session before continuing, do not write the value to files, and do not include it in evidence or commits.
- For browser acceptance, prefer `playwright-cli` named sessions. If local HTTP plus production cookie attributes cause session issues, use an explicitly scoped transient local session or the existing local proxy pattern without recording cookie values.
- For future Step evidence, summarize the root cause class, such as "session valid, client cookie delivery issue", rather than preserving raw diagnostic output.

### Local proxy pattern for secure-cookie browser acceptance

- When production-like Web is served over local plain HTTP but auth cookies are `Secure`, do not force raw cookie values through `playwright-cli` command output.
- Prefer synthetic local users plus transient local login sessions held only in process memory.
- Use a short-lived local proxy with role-specific ports: forward Web asset requests to local Web and inject the matching session cookie only for `/api` requests to local API.
- Browser acceptance scripts should derive role from the proxy port or non-sensitive localStorage, and must not contain cookie/session/password values.
- In `playwright-cli run-code`, avoid relying on Node/browser globals that may be absent, such as global `URL`; use simple string parsing when needed.
- Prefer DOM-state waits and same-origin API polling over response-event waits when the app may already have completed the request before the script starts waiting.

## 浏览器验收规则

- 优先使用 `playwright-cli`。
- 复杂流程写成 `memory-bank/<step>-browser-acceptance.js`，沿用现有 `step21b`、`step23b`、`step24b` browser acceptance 模式。
- 使用 named session，例如 `-s=step56d-manager`，避免默认 session 混乱。
- 文件上传使用 `playwright-cli upload` 或 `run-code` 中的 Playwright API。
- 不记录 cookie、token、密码、连接串。
- 不读取 `.env` 内容。
- 验收结果写入 `memory-bank/evidence.md`，只记录状态码、功能结果和脱敏 ID。

## Step 56D 归类

- API 验收：Docker API + 合成数据 + fetch。
- UI 验收：后续同类场景应优先用 `playwright-cli`；Step 56D 当时因先判断项目内没有 Playwright 包而走了原生 Chrome CDP，此后不作为优先模式。
- 项目门禁：Vitest + typecheck + `git diff --check` + added-lines 敏感扫描。
