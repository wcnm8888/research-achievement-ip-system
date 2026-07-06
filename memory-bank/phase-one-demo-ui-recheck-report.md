# Phase One Demo UI Recheck Report

Date: 2026-07-06

Scope: Step 93 local UI recheck after the Step 92 seed/persona repair. This report used localhost only and re-ran the phase-one demo UI preflight against a fresh synthetic local PostgreSQL database. It is not production acceptance.

## 1. Environment Boundary

- Local Web visited: `http://127.0.0.1:5173`.
- Local API visited: `http://127.0.0.1:3000/api` and Vite `/api` proxy only.
- Local database: synthetic PostgreSQL container `research-step93-postgres` bound to `127.0.0.1:15432`; `DATABASE_URL` was a one-time local-only value and is redacted from this report.
- Browser automation: Playwright with local Chrome executable.
- Screenshot/log working directory: `.local-step93-ui-preflight/`; not intended for commit.
- Docker Desktop startup also auto-started unrelated local containers with production-like names. They were observed through `docker ps` only and were not used or visited.
- Vite printed network URLs, but the recheck only visited `127.0.0.1`.
- No `.env` / `.env.production` content was read.
- No production, VPS, production DB, real external provider, real email/SMS, real HR/SSO, real finance/payment/invoice/reconciliation system, raw token, cookie, session, password, connection string, API key, raw request/response, or secret-bearing value was accessed or captured.

## 2. Commands And Local Setup Results

- `git log -1 --oneline` -> `b976966 fix: repair phase one demo ui blockers`.
- `git status --short` at start -> existing untracked local artifacts only.
- `git diff --stat` and `git diff --cached --stat` at start -> empty.
- Docker Desktop was initially unavailable; local Docker Desktop was started from `E:\Docker\DockerDesktop\Docker Desktop.exe`, then `docker version` returned server `29.5.2`.
- `docker run --name research-step93-postgres ... postgres:16-alpine` -> local synthetic PostgreSQL started.
- `pg_isready` and `Test-NetConnection 127.0.0.1:15432` -> PASS.
- `corepack pnpm prisma migrate deploy` with redacted local-only `DATABASE_URL` -> PASS, 11 migrations applied.
- `corepack pnpm prisma db seed` with redacted local-only `DATABASE_URL` -> PASS; seed summary included `workflowInstances:2`, `workflowTasks:1`, and `conversions:1`.
- Local API dev server -> PASS; `GET /api/health` returned `ok`.
- Local Web dev server -> PASS; `http://127.0.0.1:5173` returned HTTP 200.
- One early API launch command was misquoted and failed before the correct API start. The local-only synthetic connection string fragment in `.local-step93-ui-preflight/api.err.log` was redacted; that directory is not submitted.

## 3. Decision Summary

| Decision | Count | Paths |
| --- | ---: | --- |
| PASS | 0 | None. All evidence remains local/demo/synthetic and should retain caveat wording. |
| PASS with caveat | 8 | Researcher submit, secretary review, attachment/audit safe summary, admin local fee review action, account lifecycle buttons and safety summary, external integration mock demo center, Dashboard fixed scoring summary, ImportJob history empty state. |
| BLOCKED | 2 | Admin archive path, conversion ledger. |

Recommendation: do not enter the formal demo claiming the full 10-path phase-one route is ready. The fee-review blocker is repaired, but archive and conversion still need a code/seed/permission follow-up before the full route can be presented as `PASS with caveat`.

## 4. Path Findings

| # | Demo path | Decision | Screenshotable evidence | Caveat / block reason |
| ---: | --- | --- | --- | --- |
| 1 | Researcher submits achievement | PASS with caveat | `01-researcher-home.png`, `02-researcher-achievements.png`, `03-create-achievement-form.png`, `08-create-achievement-created.png`, `11-submit-achievement-result.png`. | A new local AI-department paper draft was created and submitted. Researcher sees expected 403 on workflow/conversion widgets outside role scope. |
| 2 | Secretary reviews achievement | PASS with caveat | `12-secretary-workflow-tasks.png`, `13-secretary-task-detail.png`, `14-secretary-approve-modal.png`, `15-secretary-approve-result.png`. | Secretary approved the newly submitted local/demo achievement; task list then showed no matching pending task. |
| 3 | Admin archives achievement | BLOCKED | `16-admin-achievements.png`, `17-admin-pending-archive-detail.png`, `18-admin-workflow-tasks.png`. | Admin can now see `PENDING_ARCHIVE` achievements in the list, including seeded `Demo Patent for Data Governance Method`, but opening the seeded detail returns `Required permissions are missing`; no archive button/action appears. Admin Workflow Tasks shows only fee review, not archive. |
| 4 | Attachment/audit safety summary | PASS with caveat | `20-admin-fee-detail-pending.png`, `22-admin-fee-approve-result.png`, `24-admin-audit-logs.png`. | Fee voucher attachment metadata and masked audit logs are visible. No raw attachment content, export, or unmasked audit view was used. |
| 5 | Admin local fee review action | PASS with caveat | `19-admin-fees.png`, `20-admin-fee-detail-pending.png`, `21-admin-fee-approve-modal.png`, `22-admin-fee-approve-result.png`. | Step 92 fee repair works: admin sees fee `60000000-0000-4000-8000-000000000001`, pending `FEE_REVIEW` action, and approval completes with history and completed task state. This remains a local demo composite persona, not production finance review. |
| 6 | Conversion ledger | BLOCKED | `23-admin-archived-paper-conversion-detail.png`. | Admin can see archived `Demo Paper on Knowledge Management` in the list, but opening detail returns `Required permissions are missing`; seeded ledger `93000000-0000-4000-8000-000000000001` and create/update controls are not visible. |
| 7 | Account lifecycle invite/reset buttons and safety summary | PASS with caveat | `25-admin-account-management.png`. | `Invite user`, `account:reset_password enabled`, no-credential state, and no token/link/password/session safety wording are visible. No raw lifecycle token/link was displayed. |
| 8 | External integration mock demo center | PASS with caveat | `26-admin-settings-initial.png`, `27-admin-settings-mock-run-no-metadata.png`, `33-integration-save-result.png`, `35-integration-enabled.png`, `36-mock-success-result.png`, `37-mock-failure-result.png`. | No metadata initially produced expected `UNAVAILABLE`. A local non-sensitive DOI metadata record was created and enabled, then success and failure mock runs wrote safe logs. No real provider was called. |
| 9 | Dashboard fixed scoring summary | PASS with caveat | `38-admin-dashboard.png`. | Dashboard shows fixed scoring sections, conversion funnel, fee risk, workflow efficiency, and mock overview from local synthetic data. It is not BI or production monitoring. |
| 10 | ImportJob aggregate history | PASS with caveat | `25-admin-account-management.png`, `26-admin-settings-initial.png`. | Settings and Account Management show import history empty states. No ImportJob aggregate detail exists in this seed. |

## 5. Sensitive Information Review

No committed report text or screenshots intentionally capture raw token, cookie, session, password, password hash, connection string, API key, provider credential, invite/reset link, raw payload, raw request/response, or `.env` content.

The local-only synthetic database connection string was used only as a process environment variable. A failed API startup log was redacted in `.local-step93-ui-preflight/`; the log directory remains untracked and is not part of the commit.

## 6. Formal Demo Recommendation

Not recommended for the full formal 10-path demo yet.

Safe partial wording: "Eight local/demo/synthetic UI paths are screenshotable with caveats. Fee review is repaired. Archive and conversion remain blocked because the admin composite demo user can list the target achievements but cannot open their detail pages, so archive and conversion controls are not screenshotable."

Do not claim:

- production/VPS/production DB acceptance;
- real HR/SSO;
- real email/SMS;
- real DOI/literature/patent/finance/HR provider integration;
- real payment, invoice, voucher settlement, or reconciliation;
- full BI/custom reporting;
- production monitoring;
- that Step 92 fully repaired the 10-path UI route.

## 7. Final Recheck Statement

Step 93 rechecked the Step 92 local seed/persona repair with Docker Desktop and a local synthetic DB available. Final local/demo classification is 0 PASS, 8 PASS with caveat, and 2 BLOCKED. The admin fee review path is repaired. The admin archive path and conversion ledger path remain blocked at the achievement detail permission/action layer.

## 8. Step 94 Repair Addendum

Step 94 repaired the permission/action layer blocker identified above.

Root cause:

- The Achievements list route required `user_context:read` and then used `achievementReadableWhere(...)`, so the local demo admin could list AI-department achievements through its department-scoped `DEPARTMENT_ADMIN` role.
- The achievement detail route statically required only `achievement:read_own`, so the same local demo admin was rejected by `PermissionGuard` before `AchievementService.getDetail(...)` could apply the existing department-scoped read policy.
- The seed was not missing owner grants for the admin, and the Web detail/conversion paths were not calling the wrong resource. The mismatch was a backend list/detail policy mismatch at the controller guard layer.

Repair:

- Added an explicit `RequireAnyPermission(...)` guard path and changed `GET /achievements/:id` to accept either `achievement:read_own` or `achievement:read_department`.
- Added a service-layer any-read assertion before detail repository access, then kept the existing `achievementReadableWhere(...)` department/owner scope and restricted-secret policy checks.
- Did not make the demo admin a superuser, did not add owner grants, and did not bypass department or restricted-secret boundaries.

Updated local/demo classification after code and automated tests:

| Decision | Count | Paths |
| --- | ---: | --- |
| PASS | 0 | None. This remains local/demo/synthetic readiness only. |
| PASS with caveat | 10 | Previous 8 caveated paths plus admin archive path and conversion ledger path. |
| BLOCKED | 0 | No remaining known code/permission blocker from Step 93. |

Caveat: Step 94 did not perform a fresh browser screenshot recheck. Before a formal presentation, rerun localhost-only UI evidence capture to show the admin pending-archive detail, archive action/result, archived detail, conversion ledger panel, and conversion create/update result. Do not present this as production/VPS/production DB acceptance.

Non-claims remain unchanged: local/demo/synthetic acceptance is not production acceptance; mock/adapter behavior is not real external system integration; BLOCKED findings must not be packaged as PASS if a future UI recheck finds a new blocker.
