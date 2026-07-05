# Phase One Demo Dry-Run Report

Date: 2026-07-05

Scope: Step 89 report-only dry run against `memory-bank/phase-one-demo-acceptance-script.md` and `memory-bank/phase-one-demo-checklist.md`. This report checks evidence gaps, misleading wording, route clarity, role prerequisites, screenshotability, and PASS/BLOCKED boundaries. No production, VPS, production DB, real external system, real email/SMS, real HR/SSO, real DOI/patent/finance provider, or secret-bearing file was accessed.

## 1. Executive Recommendation

Do not enter the formal phase-one demo yet.

The script and checklist have strong local/demo boundary wording, and no mock/local/synthetic path is currently described as production acceptance. However, the dry run found three blocking evidence gaps before the route should be presented live:

1. The achievement submit/review/archive loop names researcher, secretary, and admin personas, but the local Web demo permission projection does not grant the visible review/archive actions to those presets.
2. The fee online review loop requires `fee:review_department`, but the named local demo personas in the script do not identify a concrete fee reviewer context.
3. The account lifecycle loop requires invite/resend/reset actions, but the local admin demo projection exposes `system:config` without `account:invite` or `account:reset_password`, so the lifecycle action buttons may not be visible from the documented preset.

These are demo-readiness blockers, not production blockers. They should be resolved by documenting exact local demo user IDs/roles that have the required permissions, or by updating the demo script/checklist after a local preflight confirms the correct visible actions. Do not work around them with production login, `.env` content, real tokens, production DB, or external systems.

## 2. Sources Reviewed

- `memory-bank/phase-one-demo-acceptance-script.md`
- `memory-bank/phase-one-demo-checklist.md`
- Latest Step 83-88 slices from `memory-bank/progress.md`
- Latest Step 83-88 slices from `memory-bank/evidence.md`
- Read-only route/permission checks in:
  - `apps/web/src/App.tsx`
  - `apps/web/src/demo-users.ts`
  - `apps/web/src/WorkflowTasks.tsx`
  - `apps/web/src/Fees.tsx`
  - `apps/web/src/AccountManagement.tsx`
  - `apps/web/src/SettingsApiIntegrations.tsx`
  - `apps/web/src/SettingsImportJobHistoryOverview.tsx`
  - `prisma/seed.cjs`
  - `prisma/seed-foundation.cjs`

No `.env` or `.env.production` content was read.

## 3. Demo Route Completeness

The intended route is complete at the narrative level:

1. Local demo user context.
2. Achievement registration, review, and archive.
3. Attachment metadata and audit/history basics.
4. Fee online review loop.
5. Achievement conversion MVP ledger.
6. Account activation and simulated notification loop.
7. External interface mock demo center.
8. Dashboard fixed scoring summary.
9. ImportJob aggregate history.

Route clarity gap: the script uses page names such as "Achievements", "Workflow Tasks", "Settings -> API integrations", and "Import history". The Web app is primarily a single-page side-navigation app, and import history is also embedded inside module pages and the Settings page. For formal demo readiness, the presenter should carry a click path, not only a page name:

- Side nav: Workbench, Achievements, Workflow Tasks, Fees, Dashboard, Audit Logs, Settings, Account Management.
- Settings page sections: API integrations mock demo center and Import history overview.
- Account Management page sections: Account lifecycle and User account import history.
- Achievement/fee detail drawers or panels: attachment metadata, audit/history, and conversion ledger.

This is not a production-risk issue, but it is a live-review usability risk.

## 4. Loop-by-Loop Dry-Run Table

| Loop | Route completeness | Prerequisites clear? | Visible result screenshotable? | Dry-run status | Gap / required action |
| --- | --- | --- | --- | --- | --- |
| Local demo user context | Complete. | Mostly. It names researcher, secretary, admin and storage key. | Yes: user panel/banner and changed page state. | PASS with caveat | Add the exact preset/user IDs to the presenter notes so role switching is deterministic. |
| Achievement registration/review/archive | Narratively complete. | Not yet sufficient. Review/archive roles are described, but local Web demo permission projection does not grant reviewer/archive UI actions to the named presets. | Yes if actions are visible and status changes occur. | BLOCKED | Preflight and document the exact local reviewer/archive-capable context, or adjust demo permissions/docs. Do not claim this loop complete from verbal explanation only. |
| Attachment and audit basics | Complete enough. | Clear if a record with attachment metadata/history exists. | Yes: safe metadata and masked history fields. | PASS with caveat | Preselect one safe achievement or fee record with metadata and masked history. Avoid raw audit exports and raw payloads. |
| Fee online review loop | Complete in product terms. | Not sufficient for presenter execution: requires `fee:review_department`, but the script does not name a concrete local fee reviewer user/context. | Yes if the fee task/action is reachable. | BLOCKED | Name the local `FINANCE_REVIEWER` or other department-scoped reviewer ID, or preflight a safe custom demo context. Do not use production credentials. |
| Achievement conversion MVP | Complete. | Clear if an archived achievement exists and is readable. | Yes: conversion ledger and Dashboard conversion metrics. | PASS with caveat | Preselect an archived local achievement; if the core achievement archive loop remains blocked, use an existing archived local record and label it clearly. |
| Account activation and simulated notification | Complete in narrative. | Not sufficient for local Web preset execution: lifecycle actions require `account:invite` / `account:reset_password`, while the local admin projection checked in `App.tsx` only exposes `system:config`. | Yes if action buttons are visible; safe delivery summary is screenshotable. | BLOCKED | Preflight the exact local account-management context that exposes invite/resend/reset buttons, or limit demo to existing safe lifecycle summary and mark action trigger as not demonstrated. Never screenshot raw token/link/password/session. |
| External interface mock demo center | Complete. | Clear: admin/system config role, local metadata, no real credentials. | Yes: mock controls, synthetic result, safe call-log table. | PASS with caveat | Ensure local metadata exists or use missing/disabled state intentionally. Say "mock/adapter" every time; never "real integration". |
| Dashboard fixed scoring summary | Complete. | Clear if demo aggregate data exists. | Yes: ranking, fee risk, workflow efficiency, conversion funnel, mock overview. | PASS with caveat | Preflight data volume. Zero/unchanged counts are acceptable only if called out as a caveat. |
| Import history / ImportJob aggregate | Complete enough. | Clear if local ImportJob records exist and `system:config` can view the overview. | Yes: list/detail aggregate summary. | PASS with caveat | Preselect one local ImportJob. If list is empty, this loop becomes BLOCKED for evidence capture. |

## 5. Mock / Local / Synthetic Wording Check

No current wording in the Step 88 script or checklist was found that directly claims production acceptance for mock/local/synthetic results.

Safe wording already present:

- Local/demo/synthetic acceptance is not production acceptance.
- Mock/adapter demonstrations are not real external integrations.
- Runbook documents are not evidence that production runbooks were executed.
- Schema/migration files are not evidence that production migrations were applied.
- Local seed, fixture, or synthetic data is not production data.
- External interface mock success must not be described as real external-system success.

Wording risks to avoid live:

- Do not say "production PASS", "real HR/SSO", "real email", "real DOI/patent/finance integration", or "production dashboard".
- Do not say "payment/invoice/reconciliation completed"; say "local fee review workflow is visible".
- Do not say "account email was sent"; say "local/simulated lifecycle delivery summary was generated".
- Do not say "conversion transaction completed"; say "local conversion ledger MVP record is visible".

## 6. Secret / External Dependency Check

The dry run found no demo step that should require any of the following:

- Real secret, API key, token, cookie, session, password, SSH key, certificate, or provider credential.
- `DATABASE_URL` or production DB connection string.
- `.env` or `.env.production` content.
- Production/VPS access.
- Real external DOI/literature/patent/finance/HR/SSO/email/SMS system.
- Production migration, production runbook execution, or production monitoring access.

Token caveat: the local invite-accept flow may generate a local activation token/link internally. It must not be copied into the report, screenshot, chat, logs, docs, or demo script. Prefer showing the post-action safe lifecycle summary and account status only.

## 7. PASS / Caveat / BLOCKED Decision Table

| Decision | Count | Loops |
| --- | ---: | --- |
| PASS | 0 | None, because this was report-only and no live UI evidence was captured. |
| PASS with caveat | 6 | Local demo context; attachment/audit basics; achievement conversion MVP; external mock demo center; Dashboard fixed scoring summary; ImportJob aggregate history. |
| BLOCKED | 3 | Achievement registration/review/archive; fee online review loop; account activation/simulated notification action trigger. |

Formal-demo rule:

- PASS requires visible local/demo evidence, not verbal claims.
- PASS with caveat is acceptable only when the caveat is stated before the reviewer sees the screen.
- BLOCKED means do not present that loop as completed. Either resolve the blocker before the formal demo or explicitly omit the loop from the acceptance claim.

## 8. Highest-Risk Review-Room Items

1. Role/action mismatch blocks the live achievement workflow.
   - Avoidance: preflight the exact local user for create, review, and archive; keep user IDs/roles in presenter notes; capture the status transition screenshots before the formal session.
2. Fee review action is invisible because no documented local persona has `fee:review_department`.
   - Avoidance: identify a local department-scoped fee reviewer or finance reviewer context before the demo; otherwise mark the fee review action as BLOCKED.
3. Account lifecycle actions are hidden by frontend permission projection.
   - Avoidance: confirm invite/resend/reset buttons are visible from the selected local account-management context; if not, show only existing safe lifecycle summary and record the action trigger as not demonstrated.
4. Presenter overstates mock/synthetic evidence as real integration.
   - Avoidance: use the exact phrase "local mock/adapter demo only" on DOI, patent, finance, HR, email, SMS, and lifecycle delivery steps.
5. Evidence screenshot exposes unsafe values or cannot show a non-empty aggregate.
   - Avoidance: preselect records and screenshot zones; never capture raw token/link/password/session/payload/connection string; prepare replacement records for empty Dashboard/import sections.

## 9. Final Dry-Run Statement

The phase-one demo route is coherent but not yet ready for formal presentation. The current script/checklist should be treated as a strong outline with three unresolved demo execution blockers. Formal demo should proceed only after a local preflight confirms the exact role contexts and evidence screens for achievement review/archive, fee review, and account lifecycle action triggering.

This dry run did not perform production/VPS/production DB operations, did not read `.env` or `.env.production`, did not call real external systems, and did not send real email or SMS.
