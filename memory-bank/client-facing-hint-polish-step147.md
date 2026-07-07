# Step 147 - Client-facing hint polish

Date: 2026-07-07

## Result

PASS.

This step softened ordinary business-page guidance so the local Docker UI reads
more like a client-facing business system and less like an acceptance/debug
surface.

## Scope

- Changed ordinary `PermissionHint` rendering to a lightweight inline hint.
- Kept warning-style permission hints available for no-user, no-context,
  forbidden, risk, and security-sensitive states.
- Replaced the large import precheck info panel with a compact `导入说明`
  block.
- Updated visible copy on the main navigation pages touched by the screenshots:
  achievements, workflow tasks, fees, search, dashboard, custom reports, audit
  logs, settings, secret authorization, account management, department
  management, and workbench.
- Updated Web tests whose assertions intentionally covered the old copy.

## Browser Acceptance

- Rebuilt and replaced the compose-managed `web` container only:
  - `docker compose -f docker-compose.production.yml build web`
  - `docker compose -f docker-compose.production.yml up -d --no-deps web`
- Reused the existing local Docker API/Postgres stack.
- Active web assets on `http://127.0.0.1:18081`:
  - `index-BH7dkdba.js`
  - `index-DFsEfUiS.css`
- `GET http://127.0.0.1:14001/api/health`: 200.

Authenticated browser scan after manual user login covered:

- 成果管理
- 审批管理
- 账号管理
- 部门维护
- 涉密授权管理

Visible-text scan found no hits for:

- `权限与边界提示`
- `dry-run`
- `Internal server error`
- `undefined`
- `null`
- `GET /`
- `POST /`
- `debug`
- `export`
- `download`
- `batch mutation`

Observed API mutation requests during the authenticated scan were only the
manual login request. No business mutation, grant mutation, export, download,
debug, or batch request was observed while navigating the checked pages.

Screenshot evidence directory:

- `.local-step147-client-facing-hint-polish/`

## Verification

- `corepack pnpm --filter @research-ip/web test -- App Achievements WorkflowTasks Fees Search Dashboard CustomReports AuditLogs SettingsApiIntegrations SecretAuthorization AccountManagement DepartmentManagement`: PASS, 13 files / 262 tests.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.
- `git diff --check`: PASS, only Windows LF-to-CRLF warnings.
- `git diff --cached --check`: PASS.

## Boundaries

- No API behavior, guards, permissions, schema, migration, or seed data changed.
- No `.env` or `.env.production` content read.
- No password, Cookie, Token, connection string, API key, or secret was read,
  displayed, logged, or committed.
- No production/VPS/production DB access.
- No real external-system call.
- No Docker prune, volume deletion, `down -v`, orphan cleanup, or local file
  deletion.
- This is local Docker production-like / synthetic UI polish acceptance, not
  production acceptance.
