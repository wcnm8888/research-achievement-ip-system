# Phase One Demo UI Final Recheck Report

Date: 2026-07-06

Scope: Step 95 localhost-only final UI recheck after Step 94 repaired the admin achievement detail permission blocker. This is evidence recheck and documentation only. It is not production acceptance.

## 1. Starting State

- `git log -1 --oneline` -> `fec0494 fix: repair demo achievement detail blockers`.
- `git status --short` at start showed only pre-existing untracked local artifacts listed by the user.
- `git diff --stat` -> empty.
- `git diff --cached --stat` -> empty.

## 2. Local Environment

- Local Web visited: `http://127.0.0.1:5173`.
- Local API visited: `http://127.0.0.1:3000/api` through Vite `/api` proxy and direct health check.
- Local database: new Step 95 synthetic PostgreSQL container `research-step95-postgres`, bound to `127.0.0.1:16432`, using local trust auth and no password.
- Migration: `corepack pnpm prisma migrate deploy` applied 11 migrations to the Step 95 synthetic DB.
- Seed: `corepack pnpm prisma db seed` ran against the Step 95 synthetic DB. Later reruns re-seeded the same local DB to reset the seeded archive/fee paths after partial automation attempts.
- Browser automation: Playwright through the bundled Codex runtime with local Microsoft Edge channel.
- Local evidence directory: `.local-step95-ui-preflight/`. It is untracked and not intended for commit.

Automation note: the first full script captured the front half plus fee review screenshots, then exceeded the outer command timeout before writing a JSON result. A shorter tail script then captured archive, conversion, account lifecycle, mock integration, dashboard, and import history evidence. The timeout was an automation duration issue, not a UI blocker.

Rerun note: repeated local UI attempts created extra `Step 95 UI Recheck Paper ...` synthetic drafts/tasks in the Step 95 local DB. They were not cleaned up because this Step forbids deletion/cleanup. They are local-only synthetic records.

## 3. Final Classification

| Decision | Count | Paths |
| --- | ---: | --- |
| PASS | 0 | None. This remains localhost/local-demo/synthetic evidence only. |
| PASS with caveat | 10 | All 10 phase-one demo paths were screenshotable on localhost with local/demo caveats. |
| BLOCKED | 0 | No Step 95 localhost UI blocker found. |

Recommendation: enter the formal phase-one demo only as a localhost/local-demo/synthetic walkthrough with the caveats below. Do not present this as production, VPS, production DB, real external integration, real HR/SSO, real email/SMS, or real finance acceptance.

## 4. Path Evidence

| # | Required path | Final status | Evidence files | Notes |
| ---: | --- | --- | --- | --- |
| 1 | Researcher creates and submits achievement | PASS with caveat | `01-researcher-create-form.png`, `02-researcher-created-draft.png`, `03-researcher-draft-detail.png`, `04-researcher-submit-confirm.png`, `05-researcher-submit-result.png` | Local researcher created a Step 95 paper draft and submitted it for department review. |
| 2 | Secretary reviews achievement | PASS with caveat | `06-secretary-workflow-task-list.png`, `07-secretary-workflow-task-detail.png`, `08-secretary-approve-confirm.png`, `09-secretary-approve-result.png` | Local secretary opened the generated workflow task and approved it. |
| 3 | Admin opens seeded `PENDING_ARCHIVE` achievement detail and captures archive action/result | PASS with caveat | `30-tail-admin-pending-archive-list.png`, `31-tail-admin-pending-archive-detail.png`, `32-tail-admin-archive-confirm.png`, `33-tail-admin-archive-result.png` | Step 94 blocker is repaired in localhost UI: admin can open the seeded patent detail and archive it locally. |
| 4 | Attachment metadata and audit log safe summary | PASS with caveat | `14-attachment-metadata.png`, `15-audit-masked-summary.png` | Captured attachment metadata and masked audit-log summary. No raw payload or secret-bearing field was recorded in committed docs. |
| 5 | Admin local/demo fee review action | PASS with caveat | `16-admin-fee-list.png`, `17-admin-fee-pending-detail.png`, `18-admin-fee-approve-confirm.png`, `19-admin-fee-approve-result.png` | Admin local fee-review-capable demo context approved the seeded local fee review. Not production finance acceptance. |
| 6 | Admin opens archived achievement detail and validates conversion ledger panel, seeded ledger, create/update | PASS with caveat | `34-tail-admin-conversion-ledger-panel.png`, `35-tail-admin-conversion-create-form.png`, `36-tail-admin-conversion-create-result.png` | Admin opened the archived paper, saw the seeded conversion ledger, and created a local conversion record. |
| 7 | Account lifecycle invite/reset buttons and simulated delivery safe summary | PASS with caveat | `37-tail-account-lifecycle-buttons.png` | Account lifecycle page and permission/action area were screenshotable. Local/simulated delivery only; no raw token/link/password captured. |
| 8 | External integration mock demo center representative path | PASS with caveat | `38-tail-external-mock-center.png`, `39-tail-external-mock-result.png` | Mock/adapter UI and result area were screenshotable. No real DOI/literature/patent/finance/HR provider was called. |
| 9 | Dashboard fixed scoring summary | PASS with caveat | `40-tail-dashboard-fixed-scoring.png` | Readonly local dashboard summary captured. Not full BI or production monitoring. |
| 10 | ImportJob aggregate history / empty state | PASS with caveat | `41-tail-import-job-history-overview.png` | Aggregate import history/empty state captured. No raw CSV, raw row dump, retry, repair, rollback, or production import execution. |

## 5. Boundaries Observed

- Did not read `.env` or `.env.production` contents.
- Did not access production, VPS, or production DB.
- Did not execute a production runbook or production migration.
- Did not call real DOI, literature, patent, finance, HR, SSO, email, SMS, or other external systems.
- Did not send real email or SMS.
- Did not capture raw token, cookie, session, password, password hash, `DATABASE_URL`, connection string, API key, provider credential, invite/reset link, raw request payload, or raw response payload in committed docs.
- Did not modify `apps/api/**`, `apps/web/**`, `prisma/schema.prisma`, `prisma/migrations/**`, or `prisma/seed.cjs`.
- Existing untracked local artifacts listed by the user were not modified.
