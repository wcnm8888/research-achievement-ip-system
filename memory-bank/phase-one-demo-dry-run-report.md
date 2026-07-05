# Phase One Demo Dry-Run Report

Date: 2026-07-05

Scope: Step 89 report-only dry run against `memory-bank/phase-one-demo-acceptance-script.md` and `memory-bank/phase-one-demo-checklist.md`. This report checks evidence gaps, misleading wording, route clarity, role prerequisites, screenshotability, and PASS/BLOCKED boundaries. No production, VPS, production DB, real external system, real email/SMS, real HR/SSO, real DOI/patent/finance provider, or secret-bearing file was accessed.

## 1. Executive Recommendation

Step 90 update: the three Step 89 formal-demo blockers have been converted from `BLOCKED` to `PASS with caveat` for local/demo preconditions.

The script, checklist, and local frontend demo permission projection now identify deterministic local/demo contexts for achievement review/archive, fee review, and account lifecycle invite/reset actions. This does not create production acceptance and does not prove live evidence by itself. Formal demo PASS still requires visible local/demo UI evidence and safe screenshots captured during the walkthrough.

Resolved preconditions:

1. Achievement submit/review/archive now has a fixed role path: researcher `40000000-0000-4000-8000-000000000001` submits, secretary `40000000-0000-4000-8000-000000000002` reviews, and admin `40000000-0000-4000-8000-000000000003` archives.
2. Fee online review now has a fixed local demo context: admin `40000000-0000-4000-8000-000000000003` is the local fee-review-capable context with `fee:review_department`. It must not be described as a production finance reviewer or real HR/SSO identity.
3. Account lifecycle now has a fixed local demo context: admin `40000000-0000-4000-8000-000000000003` has `system:config`, `account:invite`, and `account:reset_password` in the local frontend projection.

Do not work around any remaining data gap with production login, `.env` content, real tokens, production DB, or external systems.

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
| Local demo user context | Complete. | Yes: Step 90 names fixed researcher, secretary, and admin user IDs and storage key. | Yes: user panel/banner and changed page state. | PASS with caveat | Capture the exact preset/user IDs in presenter evidence so role switching is deterministic. |
| Achievement registration/review/archive | Complete with Step 90 role path. | Yes: researcher submits, secretary reviews, admin archives. | Yes if actions are visible and status changes occur. | PASS with caveat | Caveat: this is local/demo permission projection plus backend policy validation, not production permission acceptance. Capture researcher submit, secretary task result, admin archive, and final archived detail screenshots. |
| Attachment and audit basics | Complete enough. | Clear if a record with attachment metadata/history exists. | Yes: safe metadata and masked history fields. | PASS with caveat | Preselect one safe achievement or fee record with metadata and masked history. Avoid raw audit exports and raw payloads. |
| Fee online review loop | Complete in product terms. | Yes for local demo: admin `SYSTEM_ADMIN` is the fee-review-capable context with `fee:review_department`. | Yes if the fee task/action is reachable. | PASS with caveat | Caveat: do not describe this as production `FINANCE_REVIEWER` acceptance. Capture active admin context, fee review action/task, before/after detail, and history screenshots. |
| Achievement conversion MVP | Complete. | Clear if an archived achievement exists and is readable. | Yes: conversion ledger and Dashboard conversion metrics. | PASS with caveat | Preselect an archived local achievement; if creating one during the walkthrough, use the Step 90 researcher -> secretary -> admin path and label it local/demo. |
| Account activation and simulated notification | Complete with Step 90 admin context. | Yes: admin has `system:config`, `account:invite`, and `account:reset_password` in the local frontend projection. | Yes if action buttons are visible; safe delivery summary is screenshotable. | PASS with caveat | Caveat: local/simulated delivery only. Capture lifecycle permission tags/buttons, action result, safe delivery summary, and account status/login capability. Never screenshot raw token/link/password/session. |
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
| PASS | 0 | None, because this remains local/demo preflight documentation plus code-level projection verification, not live captured UI evidence. |
| PASS with caveat | 9 | Local demo context; achievement registration/review/archive; attachment/audit basics; fee online review loop; achievement conversion MVP; account activation/simulated notification action trigger; external mock demo center; Dashboard fixed scoring summary; ImportJob aggregate history. |
| BLOCKED | 0 | None after Step 90 local demo role/precondition fixes. |

Formal-demo rule:

- PASS requires visible local/demo evidence, not verbal claims.
- PASS with caveat is acceptable only when the caveat is stated before the reviewer sees the screen.
- BLOCKED means do not present that loop as completed. If any documented local action is not visible during preflight, downgrade that loop back to BLOCKED and omit it from the acceptance claim.

## 8. Highest-Risk Review-Room Items

1. Role/action mismatch could still reappear if the wrong local persona is selected.
   - Avoidance: use researcher `40000000-0000-4000-8000-000000000001` for submit, secretary `40000000-0000-4000-8000-000000000002` for review, and admin `40000000-0000-4000-8000-000000000003` for archive; capture the context banner before each action.
2. Fee review can be overstated as production finance acceptance.
   - Avoidance: use admin `40000000-0000-4000-8000-000000000003` only as the local fee-review-capable context and explicitly state that this is not production `FINANCE_REVIEWER` acceptance or real finance integration.
3. Account lifecycle evidence can expose unsafe values if the presenter captures raw links or tokens.
   - Avoidance: capture only Account lifecycle permission state, safe delivery summary, masked email, token status, timestamps, and account status/login capability.
4. Presenter overstates mock/synthetic evidence as real integration.
   - Avoidance: use the exact phrase "local mock/adapter demo only" on DOI, patent, finance, HR, email, SMS, and lifecycle delivery steps.
5. Evidence screenshot exposes unsafe values or cannot show a non-empty aggregate.
   - Avoidance: preselect records and screenshot zones; never capture raw token/link/password/session/payload/connection string; prepare replacement records for empty Dashboard/import sections.

## 9. Final Dry-Run Statement

Step 90 removes the three Step 89 formal-demo blockers at the local demo precondition level. The phase-one demo route is ready for a local formal walkthrough with caveats, provided the presenter captures visible local/demo evidence at the documented screenshot points and states all non-production boundaries before each affected loop.

This dry run did not perform production/VPS/production DB operations, did not read `.env` or `.env.production`, did not call real external systems, and did not send real email or SMS.
