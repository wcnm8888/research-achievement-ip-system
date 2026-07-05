# Phase One Demo Checklist

Date: 2026-07-05

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
- [ ] Do not claim admin archive readiness unless the admin context can see a `PENDING_ARCHIVE` achievement and the archive action/result is screenshotable.
- [ ] Do not claim admin fee review readiness unless the admin context can load fee data and show the local fee review action; secretary fee visibility is not a substitute for the documented admin path.
- [ ] Do not claim conversion ledger readiness unless at least one archived achievement shows the ledger or safe create/update action for the selected persona.
- [ ] Import history may be screenshotable as an empty state, but aggregate-detail evidence requires at least one safe local ImportJob.
- [ ] Account lifecycle reset button visibility is not the same as successful delivery; use an eligible local account if delivery-summary evidence is required.

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
