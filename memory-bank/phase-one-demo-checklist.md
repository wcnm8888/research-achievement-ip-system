# Phase One Demo Checklist

Date: 2026-07-06

Scope: reviewer checklist for Step 88. Use together with `memory-bank/phase-one-demo-acceptance-script.md`.

## Environment Gate

- [ ] Confirm this is local/demo/synthetic acceptance, not production acceptance.
- [ ] Confirm no production/VPS/production DB access is planned.
- [ ] Confirm no real external provider call is planned.
- [ ] Confirm no `.env` / `.env.production` content will be read or shown.
- [ ] Confirm no password, token, cookie, session, `DATABASE_URL`, connection string, secret, or API key will be recorded.
- [ ] Confirm local demo persona storage key is `research-ip.demo-user-id`.
- [ ] Confirm researcher context: `RESEARCHER` / `40000000-0000-4000-8000-000000000001`.
- [ ] Confirm achievement reviewer context: `RESEARCH_SECRETARY` / `40000000-0000-4000-8000-000000000002`.
- [ ] Confirm archive-capable, fee-review-capable, and account lifecycle admin context: `SYSTEM_ADMIN` / `40000000-0000-4000-8000-000000000003`.
- [ ] Confirm local admin fee review is described only as a local demo fee-review-capable context, not as a production finance reviewer or real HR/SSO identity.

## Must-See Pages

- [ ] Local demo user/context selector or active user indicator.
- [ ] Side nav -> Achievements list/detail.
- [ ] Side nav -> Workflow Tasks.
- [ ] Attachment metadata area.
- [ ] Side nav -> Audit Logs or record history.
- [ ] Side nav -> Fees list/detail.
- [ ] Achievement conversion ledger panel.
- [ ] Side nav -> Account Management list/detail.
- [ ] Side nav -> Settings -> API integrations mock demo center.
- [ ] Side nav -> Dashboard fixed scoring summary.
- [ ] Side nav -> Settings import history and/or Account Management user account import history.

## Must-Do Actions

- [ ] Switch local demo persona from researcher to secretary to admin at the documented role-switch points.
- [ ] As researcher, submit an achievement from side nav -> Achievements.
- [ ] As secretary, approve or reject the achievement from side nav -> Workflow Tasks.
- [ ] As admin, archive the approved or `PENDING_ARCHIVE` achievement from side nav -> Achievements.
- [ ] Show attachment metadata and audit/history for a record.
- [ ] As admin local fee-review-capable context, approve or reject one local/demo fee review task from side nav -> Fees or side nav -> Workflow Tasks.
- [ ] Add or update one achievement conversion MVP ledger record.
- [ ] As admin, open side nav -> Account Management and confirm `account:invite` and `account:reset_password` are enabled.
- [ ] Trigger one account lifecycle simulated delivery action: Invite user, Resend invite, or Issue reset.
- [ ] Run one external mock scenario in success mode.
- [ ] Run one external mock scenario in failure or degraded mode.
- [ ] Open Dashboard and verify fixed scoring sections.
- [ ] Open one ImportJob aggregate summary.

## Must-Capture Evidence

- [ ] Active local/demo user context for researcher, secretary, and admin.
- [ ] Achievement lifecycle status/result.
- [ ] Workflow task result.
- [ ] Attachment metadata safe summary.
- [ ] Audit/history safe summary.
- [ ] Fee review before/after state plus visible fee-review-capable context.
- [ ] Conversion ledger record and Dashboard conversion metrics.
- [ ] Account lifecycle permission state and safe delivery summary with no raw token/link.
- [ ] External mock result and safe call-log summary.
- [ ] Dashboard department ranking, fee risk, workflow efficiency, conversion funnel, and mock integration overview.
- [ ] ImportJob aggregate summary.

## Common Failure Points

- [ ] Wrong persona selected for the action.
- [ ] Secretary used for archive even though the documented local archive-capable context is admin.
- [ ] Fee review described as production `FINANCE_REVIEWER` acceptance instead of local admin fee-review-capable demo context.
- [ ] Admin projection missing `account:invite` or `account:reset_password`, making lifecycle buttons unavailable.
- [ ] Missing local/demo data for the target flow.
- [ ] Integration metadata missing or disabled.
- [ ] Dashboard aggregate does not visibly change because existing data already contains the result.
- [ ] Browser cache or stale page state hides a recent update.
- [ ] Evidence screenshot accidentally includes raw secret/token/session/payload data.
- [ ] Presenter describes mock/adapter output as real external integration.
- [ ] Presenter describes local/demo validation as production PASS.

## Step 91 UI Preflight Notes

- [ ] Before formal demo, verify the seeded or newly created draft achievement belongs to a department with an active research secretary; the seeded `Demo Research Asset Registry` draft is not sufficient because submit can fail with no active department reviewer.
- [ ] After Step 92 seed repair, verify admin can see the AI department `PENDING_ARCHIVE` achievement `Demo Patent for Data Governance Method` and capture the archive action/result.
- [ ] After Step 92 seed repair, verify admin can load fee `60000000-0000-4000-8000-000000000001`, see its pending `FEE_REVIEW` task, and complete approve or reject.
- [ ] After Step 92 seed repair, verify admin can open archived achievement `Demo Paper on Knowledge Management`, see seeded conversion ledger record `93000000-0000-4000-8000-000000000001`, and create or update a safe local record.
- [ ] Import history may be screenshotable as an empty state, but aggregate-detail evidence requires at least one safe local ImportJob.
- [ ] Account lifecycle reset button visibility is not the same as successful delivery; use an eligible local account if delivery-summary evidence is required.
- [ ] Do not describe the Step 92 admin persona as a production account, real HR/SSO identity, production finance reviewer, or broad production admin data scope.

## Step 93 UI Recheck Notes

- [ ] Step 93 recheck result: final local/demo classification is PASS 0, PASS with caveat 8, BLOCKED 2.
- [ ] Admin fee review is repaired locally: admin can see fee `60000000-0000-4000-8000-000000000001`, approve it, and see completed review history/task state.
- [ ] Admin archive remains BLOCKED: admin can list `PENDING_ARCHIVE` achievements, but opening seeded `Demo Patent for Data Governance Method` detail returns `Required permissions are missing`, and no archive action is visible.
- [ ] Conversion ledger remains BLOCKED: admin can list archived `Demo Paper on Knowledge Management`, but opening detail returns `Required permissions are missing`, so seeded ledger and create/update controls are not visible.
- [ ] Formal full 10-path demo is not recommended until archive/detail and conversion/detail permission/action blockers are repaired and re-screenshoted locally.

## Step 94 Repair Notes

- [ ] Step 94 root cause: list used service-level department read policy, while detail was blocked early by a controller guard that required only `achievement:read_own`.
- [ ] Step 94 repair: `GET /achievements/:id` now accepts `achievement:read_own` or `achievement:read_department`, and service detail read still enforces achievement readable scope plus restricted-secret policy.
- [ ] Admin archive path is no longer a known code/permission blocker: local admin should be able to open `Demo Patent for Data Governance Method`, see the archive action for `PENDING_ARCHIVE`, and execute the local demo archive path.
- [ ] Conversion ledger is no longer a known code/permission blocker: local admin should be able to open `Demo Paper on Knowledge Management`, see conversion record `93000000-0000-4000-8000-000000000001`, and create or update a safe local ledger record.
- [ ] Latest code/test classification is PASS 0, PASS with caveat 10, BLOCKED 0, pending a fresh localhost-only UI screenshot recheck before formal demo use.
- [ ] Continue to state that local/demo/synthetic validation is not production acceptance, mock/adapter behavior is not real external integration, and any future blocker must remain BLOCKED rather than being described as PASS.

## Step 95 Final Localhost UI Recheck Notes

- [ ] Step 95 final localhost UI recheck result: PASS 0, PASS with caveat 10, BLOCKED 0.
- [ ] Admin archive path is screenshotable after Step 94: seeded `Demo Patent for Data Governance Method` detail opens, archive action appears, and archive confirmation/result were captured.
- [ ] Conversion ledger path is screenshotable after Step 94: admin opens archived `Demo Paper on Knowledge Management`, sees the seeded ledger, and captures local create-result evidence.
- [ ] Fee review remains screenshotable through the admin local fee-review-capable demo context and must not be described as production finance reviewer acceptance.
- [ ] Account lifecycle and external integration evidence remain local/simulated/mock only; do not claim real delivery, real HR/SSO, or real external provider integration.
- [ ] Local automation reruns created extra Step 95 synthetic achievement drafts/tasks in the Step 95 local DB; they were intentionally not cleaned up because this Step forbids deletion/cleanup.
- [ ] Formal phase-one demo is recommended only as localhost/local-demo/synthetic walkthrough with explicit caveats, not production acceptance.

## Step 96 Presenter Brief Notes

- [ ] Step 96 presenter brief completed: `memory-bank/phase-one-demo-presenter-brief.md`.
- [ ] Step 95 final classification remains PASS 0, PASS with caveat 10, BLOCKED 0.
- [ ] Before formal demo, presenter must orally state the boundary: localhost / local demo / synthetic DB only.
- [ ] Presenter must use the demo user switch order `researcher` -> `secretary` -> `admin`.
- [ ] If live localhost/Docker/browser setup fails on site, fall back only to Step 95 screenshot evidence and documentation conclusions; do not reclassify the result as production acceptance.
- [ ] Continue to describe the external interface page as a mock demo center, not real DOI/literature/patent/finance/HR provider integration.
- [ ] Do not show token, password, cookie, session, `DATABASE_URL`, connection string, raw payload, raw log, or complete email/SMS invite/reset links during presentation.

## Step 98-A Rehearsal Notes

- [ ] Step 98-A rehearsal plan completed: `memory-bank/phase-one-demo-rehearsal-plan.md`.
- [ ] Rehearsal conclusion remains PASS 0, PASS with caveat 10, BLOCKED 0.
- [ ] Opening statement must say localhost / local demo / synthetic DB only, mock/adapter only where applicable, and no production acceptance.
- [ ] Rehearsal user switch order remains `researcher` -> `secretary` -> `admin`.
- [ ] Each of the 10 rehearsal steps must name the demo user, entry page, action, expected screen, Step 95 screenshot filename, talk track, and caveat.
- [ ] If localhost, Docker, browser, or one live UI action fails, fall back only to Step 95 screenshots and Step 96/97 documentation conclusions.
- [ ] Do not repair data, run migrations, start or clean Docker, access DB, run UI rechecks, edit code, open unrelated files, or call real external systems during rehearsal.
- [ ] Do not restate the fallback as production/VPS/production DB or real external-system acceptance.

## PASS / BLOCKED Rules

- PASS: the local/demo page/action is reproducible, expected visible result is present, evidence is captured, and boundary wording is accurate.
- PASS with caveat: the path works locally but has limited data volume or a known non-production caveat that is explicitly recorded.
- BLOCKED: the path cannot be reached in local/demo environment.
- BLOCKED: required demo data cannot be created safely without production or destructive operations.
- BLOCKED: validation would require production/VPS/production DB, real external systems, real email/SMS, real HR/SSO, or real finance operations.
- BLOCKED: evidence would expose password, token, cookie, session, `DATABASE_URL`, connection string, secret, API key, raw payload, or `.env` content.

## Explicit Non-Claims

- [ ] Do not claim production/VPS/production DB acceptance.
- [ ] Do not claim real HR/SSO acceptance.
- [ ] Do not claim real email/SMS delivery.
- [ ] Do not claim real DOI/literature/patent platform integration.
- [ ] Do not claim real finance/payment/invoice/reconciliation integration.
- [ ] Do not claim full BI/custom report platform completion.
- [ ] Do not claim mobile completion.
- [ ] Do not claim large-scale real load testing, disaster recovery drill, or production monitoring completion.
- [ ] Do not claim ImportJobItem Web row-level display.
- [ ] Do not claim ImportJobItem retry/delete/cleanup/rollback/download/export/raw JSON support.
