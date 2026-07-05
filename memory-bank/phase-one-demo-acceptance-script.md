# Phase One Demo Acceptance Script

Date: 2026-07-05

Scope: Step 88 docs-only. This is the phase-one local/demo acceptance route for competition or reviewer walkthroughs. It is not production acceptance.

## 1. Environment Boundary

- Local/demo/synthetic acceptance is not production acceptance.
- Mock/adapter demonstrations are not real external system integrations.
- Runbook documents are not evidence that production runbooks were executed.
- Schema and migration files are not evidence that production migrations were applied.
- Local seed, fixture, or synthetic data is not production data.

Do not demonstrate or claim completion for production/VPS/production DB execution, real HR/SSO, real email/SMS, real DOI/literature/patent platforms, real finance/payment/invoice/reconciliation systems, full BI/custom reports, mobile client, large-scale real load testing, disaster recovery drills, or production monitoring.

Never record passwords, tokens, cookies, sessions, `DATABASE_URL`, connection strings, secrets, or API keys. Do not screenshot raw secret fields, raw request/response payloads, or unmasked sensitive data.

## 2. Demo User Context

Use the local demo user selector or the existing local demo context. `apps/web/src/demo-users.ts` defines the local storage key `research-ip.demo-user-id` and these demo personas:

- researcher: `RESEARCHER`
- secretary: `RESEARCH_SECRETARY`
- admin: `SYSTEM_ADMIN`

Suggested order: start as researcher, switch to secretary for review and department-scoped operations, then switch to admin only for account management or system settings. These are local/demo personas only, not production identities or real HR/SSO accounts.

## 3. Total Demo Route

1. Login or choose local demo user context.
2. Register, submit, approve, and archive an achievement.
3. Show attachment metadata and audit-log basics.
4. Run the fee online review loop.
5. Create or update achievement conversion MVP records.
6. Show account activation and simulated notification loop.
7. Run external interface mock demo center.
8. Open Dashboard fixed scoring summaries.
9. Open import history and ImportJob aggregate summaries.

Review framing: research output enters the system, is reviewed and archived, supporting records are auditable, fee and conversion workflows are visible, account and integration boundaries are demonstrable, and Dashboard/import history summarize the evidence.

## 4. Demo Paths

### 4.1 Login And Local Demo User Context

Demo goal: show role-aware local demo contexts.

Prerequisites: local/demo app is running; seed/demo data is available; no production account or real SSO is used.

Steps:

1. Open the web app in local/demo environment.
2. Select or confirm the researcher persona.
3. Open Achievements or Dashboard.
4. Switch to secretary or admin only when the later path requires that role.

Expected visible result: UI reflects the chosen persona; visible data and actions change by role/permission.

Evidence: screenshot the active role/user context and page state after switching persona. Do not capture credentials, cookies, sessions, local storage secrets, or raw tokens.

Risk boundary: not production login acceptance; not real HR/SSO validation.

### 4.2 Achievement Registration, Approval, And Archive

Demo goal: show the phase-one core flow from draft/registration to review and archive.

Prerequisites: researcher can create/view personal achievements; secretary/reviewer can process department workflow tasks; demo data has a suitable achievement.

Steps:

1. As researcher, open Achievements.
2. Create or open a draft achievement.
3. Submit it for review.
4. Switch to secretary/reviewer context.
5. Open Workflow Tasks or the achievement review area.
6. Approve the item for the acceptance route.
7. Archive the approved achievement where the role allows it.

Expected visible result: achievement status changes through the lifecycle; workflow result is visible; archived achievement can be used for conversion MVP.

Evidence: screenshots of achievement detail before/after transition and Workflow Tasks result.

Risk boundary: local/demo workflow acceptance only; not production permission validation or configurable workflow designer completion.

### 4.3 Attachment And Audit Basics

Demo goal: show records connected with attachment metadata and audit/history traces.

Prerequisites: demo achievement or fee record exists; attachment metadata and audit/history pages are available.

Steps:

1. Open an achievement or fee detail page with attachment metadata or an attachment entry point.
2. Show the attachment list/metadata area.
3. Open Audit Logs or the record history area.
4. Locate recent actions from the current demo path.

Expected visible result: attachment metadata is visible; audit/history entries show safe summaries.

Evidence: screenshots of attachment metadata and audit/history safe fields.

Risk boundary: not real object storage, encrypted preview, retention policy, raw audit export, or production audit retention.

### 4.4 Fee Online Review Loop

Demo goal: show the Step 83 fee application/review/status loop with workflow-task routing.

Prerequisites: local fee record exists; reviewer persona has fee review permission; no real finance, payment, invoice, or bank operation is involved.

Steps:

1. Open Fees.
2. Select a fee record with review action available.
3. Open Workflow Tasks and filter by fee target where useful.
4. Approve or reject the local fee review task.
5. Return to fee detail/history.

Expected visible result: fee review action routes to the fee review path; fee status/history/task state update visibly; attachment metadata and audit/history remain connected where available.

Evidence: screenshots of fee detail before/after review and Workflow Tasks fee target/action.

Risk boundary: not real payment, finance-system integration, invoice, voucher settlement, or reconciliation.

### 4.5 Achievement Conversion MVP

Demo goal: show the Step 84 MVP linking archived achievements to a local conversion ledger.

Prerequisites: archived achievement exists and is readable; user can create or edit conversion ledger records.

Steps:

1. Open an archived achievement detail page.
2. Locate the conversion ledger panel.
3. Add or update a conversion record with demo fields such as type, status, contract/revenue totals, date, and summary.
4. Open Dashboard and show conversion count, totals, and status funnel.

Expected visible result: conversion record appears under the achievement; Dashboard shows conversion metrics.

Evidence: screenshots of conversion ledger and Dashboard conversion metrics.

Risk boundary: not real contract signing, legal review, external transaction platform, invoice, payment, receipt, or finance integration. It is an MVP local ledger, not the complete phase-two conversion system.

### 4.6 Account Activation And Simulated Notification Loop

Demo goal: show Step 85 account lifecycle visibility: pending account, simulated delivery, activation status, and login capability summary.

Prerequisites: admin/account-management demo role is available; a pending activation account exists or can be created/imported locally without credentials.

Steps:

1. Open Account Management.
2. Select or create/import a `PENDING_ACTIVATION` demo account without credentials.
3. Use invite or resend invite action.
4. Confirm list/detail shows safe simulated delivery summary: purpose, status, adapter, masked email, token status, target user id, and timestamp.
5. If showing activation, use only the local demo invite-accept path and never record or screenshot raw token/link values.
6. Refresh account detail and show status/login capability summary.

Expected visible result: account list/detail shows latest simulated lifecycle delivery; activated demo account shows `ACTIVE` account and credential/login capability where applicable.

Evidence: screenshots of account detail safe delivery summary and status/login capability. Do not capture raw token, token hash, password, password hash, cookie, session token, connection string, or provider secret.

Risk boundary: not real email, SMS, HR, SSO, production identity, or production invite acceptance.

### 4.7 External Interface Mock Demo Center

Demo goal: show Step 86 integration boundaries, degradation behavior, and safe call-log summaries.

Prerequisites: admin/system configuration demo role is available; local API integration metadata exists or can be created for `DOI`, `PATENT`, `FINANCE`, or `HR`; no real provider credentials are used.

Steps:

1. Open Settings -> API integrations.
2. Confirm or create local metadata for a provider.
3. In the mock demo center, select DOI lookup, patent status sync, finance reconcile, or HR sync.
4. Run Success, Failure, and Degraded modes.
5. Review synthetic result summary and recent safe call-log table.
6. Disable or omit integration metadata to show unavailable/degraded behavior if useful.

Expected visible result: mock result summary and recent safe call logs are visible; no raw external payload or credential appears.

Evidence: screenshots of mock demo controls/result and recent safe call-log table.

Risk boundary: not real DOI, literature, patent platform, finance, HR, SSO, email, or SMS integration. Mock/adapter success must not be described as real external-system success.

### 4.8 Dashboard Fixed Scoring Summary

Demo goal: show Step 87 reviewer-facing fixed scoring dashboard without claiming full BI.

Prerequisites: demo data exists for achievements, fees, workflow tasks, conversions, and mock integration calls; current persona has scoped visibility.

Steps:

1. Open Dashboard.
2. Show achievement scale/type/status buckets.
3. Show department achievement ranking.
4. Show fee risk summary.
5. Show workflow approval efficiency summary.
6. Show conversion totals/funnel.
7. Show recent external mock integration overview.

Expected visible result: Dashboard shows fixed counts and distributions from one readonly summary endpoint, scoped by role/policy.

Evidence: screenshots of department ranking, fee risk, approval efficiency, conversion funnel, and mock integration overview.

Risk boundary: not full BI, custom report designer, production monitoring dashboard, raw log viewer, export system, or production acceptance evidence.

### 4.9 Import History And ImportJob Aggregate Summary

Demo goal: show existing import history and ImportJob aggregate visibility.

Prerequisites: local/demo ImportJob records exist; user has permission to view import history.

Steps:

1. Open import history or the settings overview link.
2. Open the ImportJob list.
3. Select an ImportJob detail where available.
4. Show aggregate status/counts and run metadata.
5. Explain that row-level item exposure is intentionally limited by the current safety boundary.

Expected visible result: import job history and aggregate summaries are visible without raw CSV download or unsafe row exposure.

Evidence: screenshots of ImportJob list/overview and aggregate detail.

Risk boundary: not production import execution; does not demonstrate retry, repair, rollback, delete, raw CSV download, raw JSON export, or production preflight execution.

## 5. Reviewer Checklist

Must-see pages: demo user context, Achievements, Workflow Tasks, attachment metadata, Audit Logs/history, Fees, conversion ledger, Account Management, Settings -> API integrations mock demo center, Dashboard, and ImportJob history.

Must-do actions: switch persona, submit/review/archive an achievement, show attachment/audit basics, approve or reject a fee review task, add/update conversion ledger record, trigger simulated account lifecycle delivery, run one successful and one failed/degraded external mock scenario, refresh Dashboard, and open one ImportJob aggregate summary.

Must-capture evidence: role context, achievement lifecycle, workflow result, attachment/audit safe summary, fee review before/after, conversion ledger and Dashboard conversion metrics, account lifecycle safe delivery, external mock result and safe call-log, Dashboard fixed scoring summary, and ImportJob aggregate summary.

Common failure points: missing demo data, wrong persona, missing/disabled integration metadata, stale browser state, dashboard aggregate not visibly changing, screenshot exposing raw secrets, mock described as real integration, or local/demo result described as production PASS.

PASS vs BLOCKED:

- PASS: local/demo path is reproducible, expected visible result is present, evidence is captured, and boundary wording is accurate.
- PASS with caveat: path works locally but data volume or visual count is limited; caveat is recorded and does not change the claim.
- BLOCKED: page/action cannot be reached, demo data cannot be prepared safely, permission blocks all valid personas, or evidence would require production/VPS/real external access.
- BLOCKED: proceeding would expose credentials, read `.env`, call a real external system, execute a production runbook, or touch production DB.
- Not PASS: any result that depends only on verbal claims without visible local/demo evidence.

## 6. Final Acceptance Statement Template

"Phase-one local/demo acceptance route was completed for achievement registration/review/archive, attachment and audit basics, fee online review, achievement conversion MVP, account lifecycle simulated delivery, external interface mock demo center, fixed scoring Dashboard, and ImportJob aggregate history. Evidence was captured from local/demo pages only. This is not production acceptance; no production/VPS/production DB, real external system, real email/SMS, real HR/SSO, real DOI/patent/finance provider, production migration, or production runbook execution was performed."
