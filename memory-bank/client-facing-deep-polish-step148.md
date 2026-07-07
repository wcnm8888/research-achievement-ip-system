# Step 148 - Client-facing deep UI copy polish

Date: 2026-07-07

## Result

PASS with caveat.

This step continued the Step 147 UI polish by scanning authenticated pages,
drawers, detail panels, import records, and selected modal/form surfaces. The
goal was to remove ordinary client-facing development or acceptance wording
without changing backend behavior, permissions, API contracts, schema, or seed
data.

## Changed Areas

- Fees:
  - Reworked fee detail drawer guidance into lightweight business notes.
  - Reworded voucher attachment, review history, mark-paid, waive, and cancel
    guidance to avoid implementation language.
- Search:
  - Replaced the read-only boundary alert with a business note.
  - Reworded search-detail and redaction copy.
- Achievements:
  - Reworded readonly achievement detail, attachment detail, action confirmation,
    conversion, form, and import error text.
- Import history:
  - Changed `安全错误码` display labels to `处理代码`.
  - Reworded readonly import-history descriptions.
- Account / department / audit / dashboard / settings:
  - Reworded no-user/no-permission and management guidance from
    implementation-oriented language to client-facing business copy.
- Shared styles:
  - Added `.business-note` for compact informational guidance.

## Verification

- `corepack pnpm --filter @research-ip/web test -- App Achievements AchievementDetail AchievementForm WorkflowTasks Fees Search Dashboard AuditLogs SettingsApiIntegrations SettingsBoundary ImportJobHistoryPanel AccountManagement DepartmentManagement`: PASS, 15 files / 296 tests.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.
- Local Docker web refresh:
  - `docker compose -f docker-compose.production.yml build web`: PASS.
  - `docker compose -f docker-compose.production.yml up -d --no-deps web`: PASS.
  - Active assets on `http://127.0.0.1:18081`: `index-CN6K6Z45.js`, `index-CAZwwqOa.css`.
  - `GET http://127.0.0.1:14001/api/health`: 200.

## Browser Evidence

Authenticated browser screenshot sweep captured:

- Workbench
- Achievements list
- Achievement creation drawer
- Achievement detail drawer
- Workflow list
- Fees list
- Fee detail drawer
- Search
- Search detail drawer
- Dashboard
- Custom reports
- Audit logs
- Settings
- Secret authorization
- Account management
- Account creation drawer
- Account detail drawer
- Department management

Evidence directory:

- `.local-step148-client-facing-deep-polish/`

## Caveat

The automated browser sweep timed out before writing its JSON summary, but it
did capture the screenshot set above. This is not a proof that every possible
validation error, empty state, paginated row, or nested modal in the whole app is
exhaustively polished. It covers the main authenticated navigation and selected
deep surfaces visible to reviewers.

## Boundaries

- No API behavior, guards, permissions, Prisma schema, migration, or seed data
  changed.
- No `.env` or `.env.production` content read.
- No password, Cookie, Token, connection string, API key, or secret was read,
  displayed, logged, or committed.
- No production/VPS/production DB access.
- No real external-system call.
- Docker operation was limited to rebuilding and replacing compose-managed
  `web`; no prune, volume deletion, `down -v`, orphan cleanup, or local file
  deletion was performed.
- This is local Docker production-like / synthetic UI polish acceptance, not
  production acceptance.
