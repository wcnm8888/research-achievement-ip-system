# Phase One Demo Rehearsal Plan

Date: 2026-07-06

Scope: Step 98-A docs-only formal-demo rehearsal plan for the archived phase-one localhost demo closure. This plan does not add runtime evidence, does not run the UI, and is not production acceptance.

## 1. Demo Judgment and Boundary

Formal rehearsal conclusion remains:

| Decision | Count | Meaning |
| --- | ---: | --- |
| PASS | 0 | No path is claimed as production-ready acceptance. |
| PASS with caveat | 10 | All 10 phase-one demo paths are screenshotable and explainable on localhost with local/demo/synthetic caveats. |
| BLOCKED | 0 | No Step 95/96 localhost demo blocker remains for the documented route. |

Allowed scope:

- `localhost` / local demo only.
- Synthetic DB and seeded/demo records only.
- Mock/adapter behavior only where the UI says mock, simulated, or local demo.
- Step 95 screenshot evidence and Step 96/97 documentation conclusions only.

Not covered:

- Production, VPS, production DB, production migration, production runbook, production monitoring, or real external-system acceptance.
- Real HR/SSO, email/SMS, finance/payment/invoice/reconciliation, DOI/literature/patent provider, or other real provider acceptance.

## 2. Opening Statement

Recommended opening script:

> This is a phase-one localhost demo using local demo personas and synthetic local data. The route demonstrates the reviewer-facing workflow captured in Step 95 screenshots and summarized in Step 96/97 documentation. It uses mock or adapter-only external behavior where noted, and it is not production, VPS, production DB, or real external-system acceptance.

Short version if time is tight:

> This is localhost/local-demo/synthetic-DB evidence only. Mock/adapter paths are mock only. No production acceptance is claimed.

## 3. Ten-Step Rehearsal Order

| Step | Demo user | Entry page | Operation action | Expected screen | Step 95 screenshot filename | Recommended talk track | Caveat sentence |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `researcher` | Side nav -> Achievements | Open creation flow and create a paper draft. | Draft form and created draft are visible. | `01-researcher-create-form.png`, `02-researcher-created-draft.png` | "The researcher starts by registering a research output as a local demo draft." | "This is a local synthetic record, not production workflow acceptance." |
| 2 | `researcher` | Achievement draft detail | Open the draft detail, submit it, and show the submit result. | Draft detail, submit confirmation, and submitted result are visible. | `03-researcher-draft-detail.png`, `04-researcher-submit-confirm.png`, `05-researcher-submit-result.png` | "The draft can move from researcher entry into the review workflow." | "The approval route is demonstrated only on localhost with synthetic data." |
| 3 | `secretary` | Side nav -> Workflow Tasks | Open the generated achievement task and approve it. | Task list, task detail, approval confirmation, and approval result are visible. | `06-secretary-workflow-task-list.png`, `07-secretary-workflow-task-detail.png`, `08-secretary-approve-confirm.png`, `09-secretary-approve-result.png` | "The secretary persona represents the local department-review step." | "This persona is not a real HR/SSO account or production permission acceptance." |
| 4 | `admin` | Side nav -> Achievements | Open seeded `PENDING_ARCHIVE` achievement detail and archive it. | Pending archive list/detail, archive confirmation, and archive result are visible. | `30-tail-admin-pending-archive-list.png`, `31-tail-admin-pending-archive-detail.png`, `32-tail-admin-archive-confirm.png`, `33-tail-admin-archive-result.png` | "The Step 94 detail blocker is repaired, so the archive outcome is screenshotable in the localhost route." | "This uses a local seeded achievement and is not production archive acceptance." |
| 5 | `admin` | Achievement or fee detail -> attachment/audit area | Show attachment metadata and masked audit/history summary. | Attachment metadata and masked audit summary are visible without raw payload. | `14-attachment-metadata.png`, `15-audit-masked-summary.png` | "The demo shows traceability through metadata and masked history without exposing sensitive raw data." | "This is not real object storage, raw audit export, or production retention evidence." |
| 6 | `admin` | Side nav -> Fees | Open local fee review detail and approve it. | Fee list, pending detail, approve confirmation, and approve result are visible. | `16-admin-fee-list.png`, `17-admin-fee-pending-detail.png`, `18-admin-fee-approve-confirm.png`, `19-admin-fee-approve-result.png` | "Fee review is visible as part of the phase-one reviewer-facing loop." | "The admin is only a local fee-review-capable demo context, not a production finance reviewer." |
| 7 | `admin` | Archived achievement detail -> conversion ledger panel | Show the seeded ledger panel and create a local conversion record. | Conversion ledger panel, create form, and create result are visible. | `34-tail-admin-conversion-ledger-panel.png`, `35-tail-admin-conversion-create-form.png`, `36-tail-admin-conversion-create-result.png` | "Archived achievements can connect to a local conversion MVP ledger." | "This is an MVP local ledger only, not real contract, legal, payment, or phase-two conversion completion." |
| 8 | `admin` | Side nav -> Account Management | Show lifecycle controls and simulated delivery state. | Invite/reset controls and simulated delivery summary are visible. | `37-tail-account-lifecycle-buttons.png` | "Account lifecycle controls are visible with safe simulated delivery wording." | "This is not real HR/SSO, email/SMS, token delivery, or production identity acceptance." |
| 9 | `admin` | Side nav -> Settings -> API integrations mock demo center | Run one mock scenario and show synthetic result. | Mock center controls and synthetic result are visible. | `38-tail-external-mock-center.png`, `39-tail-external-mock-result.png` | "The mock center demonstrates integration boundaries and safe success/degraded outcomes." | "This is mock/adapter-only and not real DOI, literature, patent, finance, or HR provider integration." |
| 10 | `admin` | Side nav -> Dashboard, then Settings or Account Management import history | Open Dashboard fixed scoring summary and ImportJob aggregate history. | Dashboard scoring summary and aggregate import-history state are visible. | `40-tail-dashboard-fixed-scoring.png`, `41-tail-import-job-history-overview.png` | "The close-out view summarizes phase-one status and aggregate import visibility for reviewers." | "This is fixed summary and aggregate history only, not full BI, production monitoring, production import execution, row-level retry/delete/cleanup/rollback/download/export, or raw JSON support." |

## 4. Demo Persona Switch Script

Use this explicit switch order:

1. `researcher` -> create and submit achievement.
2. `secretary` -> review the achievement workflow task.
3. `admin` -> archive, attachment/audit, fee review, conversion ledger, account lifecycle, mock demo center, Dashboard, and import history.

Say this before the first switch:

> I will switch between three local demo personas: researcher, secretary, and admin. These are local demo personas for the localhost route, not real HR/SSO users, not production accounts, and not a production finance-review identity.

Say this at the admin switch:

> The admin persona is the local archive-capable, fee-review-capable, and account-lifecycle demo context. It is not a broad production admin validation.

## 5. On-Site Fallback

If localhost is unavailable:

- Say: "The live localhost route is unavailable in this room, so I will use the Step 95 captured screenshots and Step 96/97 documentation conclusion."
- Continue with the 10-step order using screenshot filenames.
- Keep the conclusion as `PASS 0 / PASS with caveat 10 / BLOCKED 0` for localhost/local-demo/synthetic evidence only.
- Do not claim production/VPS/production DB acceptance.

If Docker is unavailable:

- Say: "Docker is not available for live local service support right now. I will not start, repair, or clean Docker during the presentation."
- Fall back to Step 95 screenshots and Step 96/97 conclusions only.
- Do not describe Step 95's local synthetic DB as production DB evidence.

If the browser cannot open:

- Say: "The browser cannot open the live local route right now, so I will present from the captured Step 95 evidence and presenter package."
- Use only screenshot filenames and documented conclusions.
- Do not switch to unrelated pages, private files, raw logs, or credential-bearing material.

If a UI action fails live:

- Say: "This live action failed in the room, so I will stop this live path and fall back to the Step 95 screenshot evidence for the documented localhost result."
- Mark the live action as a rehearsal/runtime interruption, not a new production result.
- Do not repair data, run migrations, access DB, edit code, or call external systems during the presentation.

## 6. Do-Not-Claim Checklist

Do not claim:

- Production, VPS, or production DB acceptance.
- Production migration execution.
- Real HR/SSO integration or acceptance.
- Real email/SMS delivery.
- Real finance payment, invoice, settlement, voucher, bank, or reconciliation integration.
- Real DOI, literature database, patent platform, or provider integration.
- Complete BI or custom report platform.
- Mobile client completion.
- Large-scale real load testing, disaster recovery drill, or production monitoring completion.
- ImportJobItem Web row-level display.
- Import retry, delete, cleanup, rollback, download, export, raw JSON, or raw CSV support.

## 7. Closing Line

Recommended closing script:

> The phase-one demo route is ready for formal presentation as localhost/local-demo/synthetic evidence: PASS 0, PASS with caveat 10, BLOCKED 0. The remaining work for production, real providers, production DB, full BI, mobile, load testing, monitoring, and ImportJobItem row-level Web capabilities remains separately scoped and separately authorized.
