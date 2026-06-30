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
