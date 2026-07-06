# Phase One Demo UI Preflight Report

Date: 2026-07-05

Scope: Step 91 local/demo UI evidence preflight before the phase-one formal demo. This report used localhost only and validates whether the Step 90 role paths have visible, reproducible, screenshotable UI evidence. It is not production acceptance.

## Step 92 Repair Addendum

Date: 2026-07-06

Step 92 repairs the three Step 91 blockers at the local/demo seed precondition level. This addendum does not convert the Step 91 screenshots into production evidence; it defines the repaired local seed path that must be re-screenshoted during the next local UI preflight.

Repaired local/demo preconditions:

1. Admin archive path: seeded admin `40000000-0000-4000-8000-000000000003` keeps `SYSTEM_ADMIN` and now also has local AI department-scoped `DEPARTMENT_ADMIN` and `FINANCE_REVIEWER` roles. This gives backend-scoped visibility into AI department demo achievements while preserving archive permission through `SYSTEM_ADMIN`.
2. Fee review action: the same admin local demo user has a real department-scoped `FINANCE_REVIEWER` role and a seeded pending `FEE_REVIEW` workflow task for fee `60000000-0000-4000-8000-000000000001`, so the Fees detail workflow-task section can show approve/reject actions and complete them through the existing backend fee review API.
3. Conversion ledger: seeded archived achievement `50000000-0000-4000-8000-000000000001` now has a safe local conversion ledger record `93000000-0000-4000-8000-000000000001`, and the admin local demo user's AI department scope can read the archived achievement and create/update conversion records through the existing conversion API.

Updated local/demo readiness classification after Step 92 repair:

| Decision | Count | Paths |
| --- | ---: | --- |
| PASS | 0 | None. The evidence remains local/demo/synthetic and still needs caveat wording. |
| PASS with caveat | 10 | Researcher submit, secretary review, admin archive, attachment/audit safe summary, admin local fee review action, conversion ledger, account lifecycle buttons and safety summary, external integration mock demo center, Dashboard fixed scoring summary, ImportJob history empty state. |
| BLOCKED | 0 | None after the Step 92 local seed/persona repair, assuming the database is re-seeded and new screenshots are captured locally. |

Safe wording: "Step 92 repairs local/demo seed and persona preconditions. The admin persona is a local composite demo user, not a production account, real HR/SSO identity, or production finance reviewer."

## 1. Environment Boundary

- Local Web: `http://127.0.0.1:5173`.
- Local API: `http://127.0.0.1:3000/api`.
- Local database: a Step 91 synthetic PostgreSQL container bound to `127.0.0.1:15432`; command reporting redacts the raw connection string.
- Browser automation: Playwright package with local Chrome executable. Playwright's bundled Chromium was not downloaded.
- Screenshot working directory: `.local-step91-ui-preflight/screenshots/` for local preflight only; screenshots are not intended for commit.
- No `.env` / `.env.production` content was read.
- No production, VPS, production DB, real external provider, real email/SMS, real HR/SSO, real finance/payment/invoice/reconciliation system, raw token, cookie, session, password, `DATABASE_URL`, connection string, API key, raw request/response, or secret-bearing value was accessed or captured.

## 2. Commands And Results

- `git log -1 --oneline` -> `dd14286 fix: align demo roles for phase one walkthrough`.
- `git status --short` -> existing untracked local artifacts only at start: `.learnings/`, `.local-step44h/`, `.local-step45c4/`, `.local-step46g/`, `.local-step47i/`, `.local-step62c/`, `apps/api/deploy/`, `local-prod-preview-proxy.cjs`.
- `git diff --stat` -> empty at start.
- `git diff --cached --stat` -> empty at start.
- Local port probes for `3000`, `5173`, `4173`, and `18080` -> no running local app before setup.
- `docker run --name research-step91-postgres ... postgres:16-alpine` -> local synthetic PostgreSQL started.
- `corepack pnpm prisma migrate deploy` with a redacted local-only `DATABASE_URL` -> PASS, 11 migrations applied.
- `corepack pnpm prisma db seed` with a redacted local-only `DATABASE_URL` -> PASS, seed created demo departments, roles, permissions, users, achievements, contributors, fees, reminders, and attachments.
- `corepack pnpm --filter @research-ip/api dev` -> PASS, local API started; `GET /api/health` returned `ok`.
- `corepack pnpm --filter @research-ip/web dev -- --host 127.0.0.1` -> PASS, local Vite app available at `http://127.0.0.1:5173`.

## 3. Decision Summary

| Decision | Count | Paths |
| --- | ---: | --- |
| PASS | 0 | None. All positive evidence remains local/demo/synthetic and should retain caveat wording. |
| PASS with caveat | 7 | Researcher submit, secretary review, attachment/audit safe summary, account lifecycle buttons and safety summary, external integration mock demo center, Dashboard fixed scoring summary, ImportJob history empty state. |
| BLOCKED | 3 | Admin archive, admin local fee review action, conversion ledger. |

Recommendation update after Step 92: the full phase-one route can proceed as `PASS with caveat` only after re-seeding a local synthetic database and capturing fresh localhost screenshots for the repaired archive, fee review, and conversion ledger paths. Do not reuse the Step 91 blocker screenshots as PASS evidence.

## 4. Path Findings

| # | Demo path | Decision | Screenshotable evidence | Caveat / block reason |
| ---: | --- | --- | --- | --- |
| 1 | Researcher submits achievement | PASS with caveat | `01-researcher-home.png`, `02-researcher-achievements.png`, `10-create-achievement-form.png`, `13-create-draft-result-3.png`, `14-new-draft-submit-result.png`. Capture role banner, Achievements list, create form boundary, new draft row, and submitted detail/status. | Existing seeded draft `Demo Research Asset Registry` is in the admin department and submit failed with `No active department research secretary is available for review assignment`; a new local/demo AI department draft was created through the UI and submitted successfully. |
| 2 | Secretary reviews achievement | PASS with caveat | `15-secretary-review-visible.png`, `16-secretary-task-detail-attempt.png`, `17-secretary-approve-modal.png`, `18-secretary-approve-result.png`. Capture secretary role banner, pending task, task detail, approve modal, and final "审批已通过" result. | Evidence depends on the synthetic achievement created during this preflight. It is local/demo only. |
| 3 | Admin archives achievement | BLOCKED | `19-admin-achievements.png` shows admin context and empty Achievements list. `20-researcher-after-approve.png` / `21-pending-archive-detail.png` show the achievement reached `PENDING_ARCHIVE`, but not under admin. | Step 90 documented admin as archive-capable, but the local backend-scoped admin view returned no achievements, so the admin archive action/result cannot be captured. Researcher detail showed a `归 档` button, but that is not the documented admin path and should not be used as substitute evidence. |
| 4 | Attachment/audit safety summary | PASS with caveat | `04-researcher-draft-view.png`, `21-pending-archive-detail.png`, `22-admin-audit-logs.png`, `25-secretary-fee-detail.png`. Capture attachment metadata panels and admin Audit Logs masked records. | Attachment metadata is visible on existing seeded records; the new preflight-created achievement had no attachment metadata. Audit page shows masked values and no unmasked export/download. |
| 5 | Admin local fee review action | BLOCKED | `24-admin-fees.png` shows admin context and `Required permissions are missing`. `23-secretary-fees.png` / `25-secretary-fee-detail.png` show secretary fee data only. | Admin fee page does not have backend permission and shows 0/403 state. Secretary can view the fee and attachment metadata, but the documented admin fee-review-capable path and approve/reject review action are not visible. |
| 6 | Conversion ledger | BLOCKED | `26-conversion-ledger-archived.png` shows archived achievement detail attempt under secretary and `Required permissions are missing`; prior researcher detail also showed conversion ledger access denied. Dashboard shows conversion count 0. | No tested persona provided a screenshotable conversion ledger record or create/update action. Admin cannot see achievements; secretary/researcher cannot access the ledger. |
| 7 | Account lifecycle invite/reset buttons and safety summary | PASS with caveat | `27-account-management.png`, `28-account-detail-researcher.png`, `29-account-reset-result.png`, `30-account-reset-confirmed.png`. Capture `Invite user`, `account:reset_password enabled`, `Issue reset`, `Revoke reset links`, and the warning that tokens/hashes/links/passwords/sessions are never shown. | Reset confirmation for the seeded researcher returned `User is not eligible for password reset` because the account has no local credential, so no successful delivery summary was produced. Button/safety-summary visibility is confirmed; delivery-success evidence is not. |
| 8 | External integration mock demo center | PASS with caveat | `31-settings-api-integrations.png`, `34-integration-created.png`, `36-integration-enabled.png`, `37-mock-success-logged.png`, `38-mock-failure-or-degraded.png`. Capture mock-only warning, metadata-only config reference, success result, failure result, and recent safe call logs. | Initial run was `UNAVAILABLE` because there was no integration metadata. A local DOI metadata record with non-sensitive config reference was created and enabled through UI; success and failure mock runs then wrote safe logs. No real provider was called. |
| 9 | Dashboard fixed scoring summary | PASS with caveat | `39-secretary-dashboard.png`, `40-admin-dashboard.png`. Capture scoring summary cards, department ranking, fee risk, workflow efficiency, mock integration overview, and fixed metric keys. | Secretary view has meaningful local data after the preflight; admin view is zero-scoped for achievements/fees/workflow but still shows mock counts. Conversion funnel remains empty. |
| 10 | ImportJob aggregate history | PASS with caveat | `31-settings-api-integrations.png`, `27-account-management.png`. Capture Settings import history overview and Account Management user import history empty states. | No ImportJob records exist after seed; no aggregate detail can be opened. Treat as empty-state caveat, not aggregate-detail PASS. |

## 5. Screenshot Area Guidance

- Role evidence: crop the top shell area containing active demo persona, `X-Demo-User-Id`, role tag, and side nav.
- Achievement evidence: crop Achievements list rows, detail drawer status area, submit/approve modal, and final toast/result area.
- Admin archive blocker: capture admin role banner plus `暂无成果` in Achievements.
- Attachment evidence: crop only metadata fields such as original name, attachment ID, version, status, uploader, relation ID, created/updated time. Do not capture raw file contents or downloads.
- Audit evidence: crop Audit Logs title, `masked only`, and masked old/new summary fields. Avoid raw exports and any raw request/response.
- Fee blocker: crop admin role banner plus Fees `Required permissions are missing`; for secretary caveat, crop fee detail fields and attachment metadata only.
- Account lifecycle: crop lifecycle buttons and safety summary. Do not capture links, tokens, hashes, password fields, sessions, or raw invite/reset payloads.
- Mock integration: crop mock-only warning, synthetic result summary, and recent safe call log table. Do not capture provider credentials because none should be entered.
- Dashboard: crop summary cards and fixed metric sections; state clearly this is not BI or production monitoring.
- ImportJob: crop empty state if no data exists; do not claim aggregate detail evidence.

## 6. Sensitive Information Review

No screenshoted page text contained raw token, cookie, session, password, password hash, `DATABASE_URL`, connection string, API key, provider credential, raw request/response, invite link, reset link, or `.env` content. The account lifecycle and settings pages explicitly warned that these values are not displayed.

Local preflight commands used a synthetic local database password and connection string, but this report intentionally redacts it and does not record it as reusable evidence.

## 7. Mock / Local / Synthetic Misstatement Risk

Risk is high unless the presenter changes wording. The positive evidence is local/demo/synthetic only. The formal demo must not say:

- production PASS;
- real HR/SSO;
- real email/SMS;
- real DOI/literature/patent/finance/HR provider integration;
- real payment, invoice, voucher settlement, or reconciliation;
- full BI/custom reporting;
- production monitoring;
- production DB or VPS evidence.

Safe wording: "This is local/demo/synthetic UI evidence. Mock runs used a local metadata record and synthetic adapter responses only. No production/VPS/production DB or real external system was contacted."

## 8. Formal Demo Recommendation

Do not enter the formal demo claiming production PASS. After Step 92, the local/demo route may be presented as `PASS with caveat` if fresh localhost screenshots show the repaired seed paths.

Minimum before formal demo:

1. Fix or document the archive-capable persona so the documented admin path can see and archive a `PENDING_ARCHIVE` achievement.
2. Fix or document the fee-review-capable persona/path so the documented admin fee review action is visible, or change the script to a role that actually has backend fee permissions and visible review actions.
3. Fix conversion ledger permissions/data so at least one archived achievement shows a ledger record or safe create/update action.
4. Seed or create a safe ImportJob if aggregate-detail evidence is required rather than an empty-state caveat.
5. For account lifecycle, use an eligible account if the demo needs successful reset delivery, or keep the claim limited to button and safety-summary visibility.

## 9. Final Preflight Statement

Step 91 found local/demo UI evidence for 7 of 10 checked paths, all with caveats, and 3 blockers. Step 92 repairs those blockers at the local seed/persona level, bringing the intended local/demo route to 10 PASS with caveat and 0 BLOCKED once a fresh local UI preflight captures new evidence. This remains local/demo/synthetic evidence only and is not production acceptance.
