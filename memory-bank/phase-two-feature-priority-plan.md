# Phase Two Feature Priority Plan

Date: 2026-07-06

Scope: Step 101-B docs-only Route B priority plan. This plan starts phase-two feature enhancement after Route A final handoff. It does not continue Route A demo documentation, does not enter production/VPS/production DB, and does not call real external systems.

## 1. Route A Closure

Route A is closed and handed off.

| Decision | Count | Meaning |
| --- | ---: | --- |
| PASS | 0 | No path is claimed as production-ready acceptance. |
| PASS with caveat | 10 | All 10 phase-one demo paths are screenshotable and explainable on localhost with local/demo/synthetic caveats. |
| BLOCKED | 0 | No documented localhost demo blocker remains for the Route A handoff package. |

This status only represents `localhost` / local demo / synthetic DB evidence. It is not production acceptance, not VPS acceptance, not production DB acceptance, and not real external-system acceptance. After Step 100, do not add more demo-preparation documents by default unless the user explicitly asks.

## 2. Phase-Two Candidate Ranking

| Rank | Feature | Original requirement source | Current state | User / reviewer value | Implementation cost | Risk | Needs DB/schema? | Needs real external system? | Suitable as next Step? | Recommended priority |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Custom reports / advanced reports MVP | Product brief phase two: advanced search, custom reports, scheduled report push, citation analysis; product goal: reduce manual Excel and support decision dashboards. | Basic Dashboard and fixed scoring summary exist; custom report builder and scheduled reports are unfinished. | Very high: gives leaders and secretaries visible phase-two depth beyond fixed Dashboard and directly addresses slow manual statistics. | Medium if scoped to read-only configurable report views over existing data; higher if saved templates/export/scheduling are included. | Scope creep into full BI, raw exports, sensitive drilldowns, or production monitoring. | No for first MVP if templates are not persisted; yes later for saved templates/schedules. | No. | Yes. | P0 |
| 2 | Achievement conversion deepening: revenue distribution, post-evaluation, contract/payment status | Product brief phase two: full achievement conversion flow, revenue distribution, conversion funnel, post-evaluation. | Local conversion ledger MVP exists; full workflow, real contract/legal/payment, distribution, and post-evaluation are unfinished. | Very high: strongest business-depth story after phase one and directly extends the Step 84 demo path. | Medium-high because workflow/status model and UI depth likely grow. | May drift into real contract/legal/payment/finance acceptance if wording is not constrained. | Probably yes for distribution, post-evaluation, and status history. | No for local MVP; yes only if real finance/legal systems are later authorized. | Yes, but after a schema-aware spec. | P1 |
| 3 | ImportJobItem Web row-level safe read-only display | Requirement matrix: backend item writers and read API are complete; Web row-level display is not authorized. | Backend-only API exists; Web still shows aggregate import history only. | Medium-high for operators and reviewers because it exposes already-built safe history without raw payload. | Low-medium if strictly read-only and field-allowlisted. | Privacy and leakage risk around target IDs, raw rows, raw JSON/CSV, retry/delete/rollback/export expectations. | No if using existing backend API and fields. | No. | Yes as a narrow technical/product slice. | P1 |
| 4 | More complete account lifecycle | Product brief includes permissions, account management, HR/SSO adapter reservation; matrix says account management is partial and lifecycle is local-demo only. | Local lifecycle and simulated notification are visible; real HR/SSO, real email/SMS, token delivery, and production identity acceptance are unfinished. | Medium-high for administrators and onboarding workflows. | Medium. | Easy to imply real HR/SSO/email/SMS if not constrained; credential/token exposure risk. | Maybe, depending on lifecycle state depth. | No for local simulated MVP; yes for real HR/SSO/email/SMS later. | Yes only as simulated/local lifecycle enhancement. | P2 |
| 5 | Secret authorization management enhancement | Product brief phase one compliance goal: RBAC, department isolation, secret data authorization, audit. Matrix says secret access is partial. | `ResourceAccessGrant` and secret read policy exist; full secret workflow, secret attachment encryption, and admin console are unfinished. | High for compliance reviewers, but less visible than reports/conversion unless paired with UI. | Medium-high. | High security risk; must avoid over-broad grants and unmasked evidence. | Likely yes for richer grant workflow/audit state. | No. | Better after a dedicated security design. | P2 |
| 6 | Attachment storage/download capability enhancement | Product brief phase one: attachment versions, permissions, secret level, storage adapter. Matrix says real object storage and complex encryption/preview/cleanup are unfinished. | Basic attachment model/API/Web entry and audit exist. | Medium: improves operational completeness and compliance. | Medium-high. | Object storage, download headers, encryption, cleanup compensation, and retention rules can become production-sensitive quickly. | Maybe. | No for local adapter enhancement; yes if real object storage is used later. | Not first; needs storage/security design. | P3 |
| 7 | Scheduled reminders / planned task enhancement | Product brief: 30/15/7 day and overdue reminders; phase two can deepen scheduled delivery. Matrix says scheduler/cron, real email/SMS, real queue are unfinished. | ReminderTask, Notification, reminders, and mock/in-app boundaries exist. | Medium: reduces missed fee/payment deadlines and supports operations. | Medium. | Could drift into real email/SMS/queue or production scheduler work. | Maybe for schedule policy/history. | No for local scheduler design; yes for real email/SMS later. | Not first unless reminder reliability is the chosen theme. | P3 |
| 8 | Mobile demand reassessment | Product brief phase two: mobile complete experience; first version explicitly excludes full mobile. | No full mobile line exists. | Medium: may matter for researchers approving/entering on the go, but needs user validation. | Low for research/spec; high for implementation. | Risk of building a broad second client before core phase-two depth is decided. | No for reassessment; yes/no depends on later implementation. | No. | Yes as discovery, not implementation. | P3 |

## 3. Recommended First Implementation Slice

Recommended first Route B slice: **A. Custom reports / advanced reports MVP**.

Reasoning:

- It best matches the original pain point: manual Excel statistics, unclear institute-wide base numbers, and time-consuming reporting.
- It builds on existing Dashboard, achievements, fees, workflow, conversion, and import-history data without requiring production access or real external systems.
- It is more reviewer-visible than a narrow ImportJobItem Web table and less schema-heavy than full conversion revenue distribution.
- It can be scoped as read-only and local/demo-friendly, avoiding credential, provider, finance, and production dependencies.

Suggested next Step scope:

- Define a read-only custom report MVP with 3 to 5 predefined report templates or configurable dimensions.
- Use existing safe data domains first: achievements, departments, fees, workflow status, conversion MVP ledger, and import aggregate history.
- Keep the MVP inside localhost/local development scope.
- Avoid saved report templates, scheduled delivery, raw CSV/raw JSON export, production monitoring, and sensitive drilldowns in the first implementation slice.
- Decide explicitly whether the first implementation needs no DB/schema change by keeping configuration in Web state or static report presets; if persistence is desired, require a separate schema plan.

Acceptance boundary for the first slice:

- Demonstrate report configuration and read-only results locally.
- Preserve department/RBAC/secret-data boundaries.
- Do not expose raw payloads, raw logs, connection strings, tokens, cookies, or `.env` content.
- Do not claim full BI, production monitoring, or production acceptance.

## 4. Explicit Non-Entry Areas

This Route B plan does not enter:

- production / VPS / production DB.
- Real HR/SSO.
- Real email/SMS.
- Real finance payment, invoice, settlement, bank, or reconciliation integration.
- Real DOI, literature database, patent platform, CNIPA, Scopus, Dimensions, or provider joint testing.
- Production runbooks, production migrations, Docker cleanup, UI reruns, or real external-system calls.
