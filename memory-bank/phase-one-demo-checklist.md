# Phase One Demo Checklist

Date: 2026-07-05

Scope: reviewer checklist for Step 88. Use together with `memory-bank/phase-one-demo-acceptance-script.md`.

## Environment Gate

- [ ] Confirm this is local/demo/synthetic acceptance, not production acceptance.
- [ ] Confirm no production/VPS/production DB access is planned.
- [ ] Confirm no real external provider call is planned.
- [ ] Confirm no `.env` / `.env.production` content will be read or shown.
- [ ] Confirm no password, token, cookie, session, `DATABASE_URL`, connection string, secret, or API key will be recorded.

## Must-See Pages

- [ ] Local demo user/context selector or active user indicator.
- [ ] Achievements list/detail.
- [ ] Workflow Tasks.
- [ ] Attachment metadata area.
- [ ] Audit Logs or record history.
- [ ] Fees list/detail.
- [ ] Achievement conversion ledger panel.
- [ ] Account Management list/detail.
- [ ] Settings -> API integrations mock demo center.
- [ ] Dashboard fixed scoring summary.
- [ ] Import history / ImportJob list/detail.

## Must-Do Actions

- [ ] Switch local demo persona between researcher, secretary, and admin where needed.
- [ ] Submit/review/archive an achievement, or show an existing completed local path.
- [ ] Show attachment metadata and audit/history for a record.
- [ ] Approve or reject one local/demo fee review task.
- [ ] Add or update one achievement conversion MVP ledger record.
- [ ] Trigger one account lifecycle simulated delivery action.
- [ ] Run one external mock scenario in success mode.
- [ ] Run one external mock scenario in failure or degraded mode.
- [ ] Open Dashboard and verify fixed scoring sections.
- [ ] Open one ImportJob aggregate summary.

## Must-Capture Evidence

- [ ] Active local/demo user context.
- [ ] Achievement lifecycle status/result.
- [ ] Workflow task result.
- [ ] Attachment metadata safe summary.
- [ ] Audit/history safe summary.
- [ ] Fee review before/after state.
- [ ] Conversion ledger record and Dashboard conversion metrics.
- [ ] Account lifecycle safe delivery summary with no raw token/link.
- [ ] External mock result and safe call-log summary.
- [ ] Dashboard department ranking, fee risk, workflow efficiency, conversion funnel, and mock integration overview.
- [ ] ImportJob aggregate summary.

## Common Failure Points

- [ ] Wrong persona selected for the action.
- [ ] Missing local/demo data for the target flow.
- [ ] Integration metadata missing or disabled.
- [ ] Dashboard aggregate does not visibly change because existing data already contains the result.
- [ ] Browser cache or stale page state hides a recent update.
- [ ] Evidence screenshot accidentally includes raw secret/token/session/payload data.
- [ ] Presenter describes mock/adapter output as real external integration.
- [ ] Presenter describes local/demo validation as production PASS.

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
