# Next Phase Options

Date: 2026-07-06

Scope: Step 97 documentation-only next-route refresh after phase-one localhost demo closure.

This document summarizes the archived phase-one localhost demo state and lays
out optional next routes for user selection. It is not authorization to execute
production work, database work, migrations, imports, runbooks, Web row-level
display, real external-system calls, or local artifact cleanup.

## Current Default State

- No DB, production, VPS, or production DB access is authorized or performed.
- No migration, import, production runbook, service startup, or real-data apply
  is authorized or performed.
- `.env` and `.env.production` content remains unread.
- The phase-one localhost demo loop is archived as `PASS 0 / PASS with caveat
  10 / BLOCKED 0`, limited to localhost / local demo / synthetic DB.
- Mock/local/demo evidence is not real external integration or production
  acceptance.
- Existing untracked local artifacts remain untouched, unclassified, unmoved,
  unstaged, undeleted, and uncleaned.
- Runtime/API/Web/schema/migration/package/lockfile/config files remain out of
  scope for this Step.
- Route A formal demo preparation is now finally handed off in
  `阶段一档案/process-records/current-main-memory-bank/phase-one-route-a-final-handoff.md`; by default, do not add more
  demo-preparation documents unless the user asks for them.
- The next phase should be selected by the user as Route B, Route C, or Route D.

## Archived Mainline

The current archived mainline includes:

- Phase-one scoring/demo closure from Step 82B through Step 97:
  - Fee online review loop.
  - Achievement conversion MVP.
  - Account lifecycle and simulated notification loop.
  - External interface mock demo center.
  - Dashboard fixed scoring summary.
  - Demo script, final localhost UI recheck, presenter brief, and final archive.
- Import real-write first phase archive, with production execution and real-data
  apply kept as separate authorization decisions.
- `ImportJob` / `ImportRun` history and idempotency for Department,
  Achievement, and User account import families.
- Web aggregate-only import-history entries and settings/system overview.
- `ImportJobItem` safe row-level history line:
  - Safe-field allowlist and forbidden-field boundary.
  - Schema plan and additive schema/migration archive.
  - Department, Achievement, and User account success-path item writers.
  - Backend-only safe item read DTO and `GET /api/import-jobs/:id/items`.
  - Web aggregate-only history decision before Step 112.
  - Web route-scoped safe row display in ImportJob detail, limited to
    `rowNumber`, `plannedAction`, `status`, `safeCode`, and `targetType`.
  - Local synthetic backend-only acceptance.
  - Local synthetic Web UI acceptance and closure.
  - Production read-only preflight documentation.
- Prompt 39 handoff archive in `阶段一档案/process-records/current-main-memory-bank/prompt-39-handoff.md`.
- Phase-one final archive in `阶段一档案/process-records/current-main-memory-bank/phase-one-final-archive.md`.

## Route A - Formal Demo Rehearsal

Status: complete and handed off by Step 100.

### Goal

Prepare for a formal phase-one localhost presentation without changing runtime
scope. This route is limited to read-only rehearsal, caveat wording, presenter
order, evidence references, and fallback preparation.

### Risk

- Rewording local/demo/synthetic evidence as production acceptance.
- Depending on live localhost availability without the Step 95 screenshot and
  Step 96 presenter fallback.
- Accidentally opening unrelated private files, credentials, or raw logs during
  rehearsal.

### Required Authorization

- User confirmation that the next activity is rehearsal/presentation prep.
- Separate explicit approval for any service startup, UI rerun, screenshot
  capture, production access, real external-system call, or environment change.

### First Suggested Step

Completed:

- Step 98-A: `阶段一档案/process-records/current-main-memory-bank/phase-one-demo-rehearsal-plan.md`.
- Step 99-A: `阶段一档案/process-records/current-main-memory-bank/phase-one-demo-onsite-card.md`.
- Step 100: `阶段一档案/process-records/current-main-memory-bank/phase-one-route-a-final-handoff.md`.

Default next action: stop adding Route A demo-preparation docs unless the user
explicitly asks for more.

### Explicitly Forbidden

- Do not access DB, production, VPS, production DB, or remote hosts.
- Do not read `.env`, `.env.production`, credentials, tokens, cookies, private
  keys, raw logs, or connection strings.
- Do not run migrations, imports, runbooks, service startup commands, or
  production queries.
- Do not call real external systems.
- Do not describe `PASS with caveat` as production PASS.

## Route B - Phase-Two Feature Enhancement

Status: selected for Step 101-B planning. Current recommended first slice is
custom reports / advanced reports MVP, documented in
`阶段一档案/process-records/current-main-memory-bank/phase-two-feature-priority-plan.md`.
Step 102-B adds the executable technical plan and interface contract in
`阶段一档案/process-records/current-main-memory-bank/custom-reports-mvp-technical-plan.md`.
Steps 103-B to 105-B close the first custom reports MVP loop with the backend
read-only API, Web `Custom Reports` page, and closure archive in
`阶段一档案/process-records/current-main-memory-bank/custom-reports-mvp-closure.md`.
Step 106-B-A adds localhost/local-demo/synthetic UI/browser acceptance evidence
in `阶段一档案/process-records/current-main-memory-bank/custom-reports-local-ui-acceptance.md`; screenshots and logs
are archived under `阶段一档案/qa-evidence/raw-local-artifacts/current-main/.local-step106-custom-reports-acceptance/`.
Step 107-B-C adds the docs-only technical plan for the next Route B line,
achievement conversion deepening MVP, in
`阶段一档案/process-records/current-main-memory-bank/conversion-deepening-mvp-technical-plan.md`.
Steps 108-B-C to 110-B-C close that local/demo MVP loop with additive
schema/backend fields, Web display/edit fields, Dashboard/Custom Reports
aggregate enhancement, and localhost/local-demo/synthetic UI acceptance in
`阶段一档案/process-records/current-main-memory-bank/conversion-deepening-local-ui-acceptance.md` and
`阶段一档案/process-records/current-main-memory-bank/conversion-deepening-mvp-closure.md`.
Step 111 adds the docs-only safety and UX plan for optionally connecting the
existing backend-only `ImportJobItem` read API to Web as a strictly allowlisted
safe row display in
`阶段一档案/process-records/current-main-memory-bank/import-job-item-web-row-display-plan.md`.
Steps 112-113 implement and locally accept that safe display in the current Web
  detail drawer, archived in
`阶段一档案/process-records/current-main-memory-bank/import-job-item-web-local-ui-acceptance.md` and
`阶段一档案/process-records/current-main-memory-bank/import-job-item-web-display-closure.md`.
Step 114 reselects the next Route B product slice as more complete account
lifecycle local/demo enhancement, with the next recommended step documented in
`阶段一档案/process-records/current-main-memory-bank/route-b-next-slice-selection.md`.
Step 115 adds the docs-only account lifecycle enhancement technical plan in
`阶段一档案/process-records/current-main-memory-bank/account-lifecycle-enhancement-technical-plan.md`; it recommends
Step 116 as API projection hardening with no schema/migration for the first MVP.
Steps 116-118 close the account lifecycle local/demo loop with API projection
hardening, Web management display, and local UI acceptance archived in
`阶段一档案/qa-evidence/raw-local-artifacts/current-main/.local-step118-account-lifecycle-acceptance/`. The result is local/demo
synthetic PASS with caveat, not production identity acceptance.
Step 119 reselects the next Route B slice in
`阶段一档案/process-records/current-main-memory-bank/route-b-next-slice-selection-after-account-lifecycle.md`; the
recommended product next step is a docs-only Secret authorization management
enhancement safety plan.
Step 120 adds that docs-only safety plan in
`docs/operations/secret-authorization-management-safety-plan.md`; it recommends a
read-only safe projection MVP before any grant mutation workflow and keeps
schema/migration changes out of the first slice.

### Goal

Start a product enhancement line after the phase-one demo archive. Recommended
first themes are custom reports, mobile needs assessment, fuller achievement
conversion, revenue distribution/post-evaluation, and richer scheduled reports.

### Risk

- Expanding a feature into production, real-provider, or sensitive-data work
  without a separate boundary.
- Overbuilding a full platform when a scoped phase-two slice is enough.
- Treating existing mock/local demo behavior as real integration.

### Required Authorization

- User-selected feature theme and desired outcome.
- Explicit scope for allowed runtime/API/Web/schema work and verification.
- Separate explicit approval for production, DB, migration, credential, real
  provider, or sensitive-data work.

### First Suggested Step

Step 101-B completed the Route B feature priority plan and recommends custom
reports / advanced reports MVP as the first implementation slice.

Completed first implementation loop:

- Step 103-B: backend read-only reports API.
- Step 104-B: Web Custom Reports page.
- Step 105-B: custom reports MVP closure and archive.
- Step 106-B-A: Custom Reports local UI/browser acceptance with screenshots.

Recommended next Route B choices:

- Start Step 121 - Secret authorization read-only API projection hardening
  using the Step 120 safety plan. Keep it no-schema/no-migration and do not add
  grant mutation endpoints in the first implementation slice.
- Keep the account lifecycle line closed as local/demo/synthetic PASS with
  caveat only; do not describe it as production identity acceptance.
- If the user's priority is local environment sprawl instead of a product
  feature, run a Docker/untracked artifact read-only inventory as housekeeping
  only. Do not clean, stop, delete, move, archive, or prune anything.
- Add deferred aggregate templates such as ImportJob aggregate history or
  external mock overview.
- Run a separate mobile/responsive review only if the user explicitly wants
  browser viewport acceptance beyond the current desktop local-demo path.

Keep real contract/legal/payment/finance integration, saved templates,
scheduled delivery, raw CSV/raw JSON export, production monitoring, and
sensitive drilldowns out of the completed MVP unless separately authorized.

### Explicitly Forbidden

- Do not infer permission for production/VPS/production DB, real providers, or
  credentials.
- Do not implement broad exports, raw JSON, raw CSV, or sensitive drilldowns
  without a separate safety design.

## Route C - Real External-System Integration Preparation

### Goal

Prepare for real DOI/literature/patent/finance/HR/SSO/email/SMS integration
only when real systems, credentials, test environment, integration contacts,
and written authorization exist. This route starts with readiness and safety
documentation, not provider calls.

### Risk

- Exposing credentials, provider payloads, production identifiers, or personal
  data.
- Calling real systems before test-environment and authorization boundaries are
  explicit.
- Treating the Step 86 mock demo center as completed real integration.

### Required Authorization

- Explicit user approval to prepare real integration.
- Named provider/system, test environment, data boundary, credential owner, and
  allowed evidence format.
- Separate explicit approval before reading credentials or making any real
  provider call.

### First Suggested Step

Step 98-C: docs-only integration readiness checklist that defines providers,
test-environment gates, credential handling, redaction, retry/failure behavior,
audit evidence, rollback, and final go/no-go.

### Explicitly Forbidden

- Do not call real DOI/literature/patent/finance/HR/SSO/email/SMS systems.
- Do not read `.env`, `.env.production`, credentials, tokens, cookies, private
  keys, or connection strings without separate approval.
- Do not use production data as test evidence unless explicitly authorized and
  redaction rules are approved.

## Route D - Production Readiness

### Goal

Prepare production readiness only when the user explicitly asks for it and
authorizes scope. This route starts with read-only preflight preparation,
backup/rollback criteria, migration-window criteria, monitoring criteria, and
human confirmation gates.

### Risk

- Confusing documentation readiness with authorization to access production.
- Running production migration/runbook/preflight commands too early.
- Recording production identifiers, source values, credentials, connection
  strings, or personal data in evidence.

### Required Authorization

- Explicit user approval for production readiness preparation.
- Separate explicit approval before any DB, production, VPS, production DB,
  credential, connection-string, runbook, migration, or production query step.
- Explicit confirmation of safe evidence and redaction rules.

### First Suggested Step

Step 98-D: create a production readiness preflight package that remains
docs-only unless the user separately authorizes execution.

### Explicitly Forbidden

- Do not access DB, production, VPS, production DB, or remote hosts.
- Do not read `.env`, `.env.production`, credentials, tokens, cookies, private
  keys, or connection strings.
- Do not run migrations, imports, runbooks, service startup commands,
  production queries, Docker cleanup, or destructive cleanup.
- Do not treat localhost PASS-with-caveat as production acceptance.

## Selection Guidance

- Route A is complete for formal phase-one demo preparation and should not be
  the default next step after Step 100.
- Route B is now the active product-enhancement planning route; the current
  custom reports / advanced reports MVP, achievement conversion deepening MVP,
  ImportJobItem safe row Web display, and account lifecycle enhancement are
  closed for localhost/local-demo/synthetic acceptance. Step 120 documents the
  Secret authorization management safety plan; the next recommended product
  slice is read-only API projection hardening with no schema/migration and no
  grant mutation endpoint. Treat Docker/untracked artifact inventory as
  optional housekeeping only if the user prioritizes local environment control.
- Choose Route C if real external providers are available and the user wants
  integration readiness planning before any call.
- Choose Route D if the user explicitly wants production readiness, with all
  production execution still separately gated.
