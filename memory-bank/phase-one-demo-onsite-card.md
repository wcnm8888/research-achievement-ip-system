# Phase One Demo On-Site Card

Date: 2026-07-06

Scope: Step 99-A one-page on-site card for the formal phase-one localhost demo. This card compresses Step 96 presenter brief, Step 97 final archive, and Step 98-A rehearsal plan. It is docs-only, uses Step 95 screenshot evidence, and is not production acceptance.

## 30-Second Opening

> This is a phase-one `localhost` local demo using local demo personas and a synthetic DB. The demo status is `PASS 0 / PASS with caveat 10 / BLOCKED 0`: no path is claimed as production-ready, all 10 paths are screenshotable and explainable locally with caveats, and no documented localhost blocker remains. External-facing paths are mock/adapter only where shown. This is not production acceptance.

## 10-Step Run Card

| # | Demo persona | Page / entry | One-line action | Step 95 screenshot reference | One-line caveat |
| ---: | --- | --- | --- | --- | --- |
| 1 | `researcher` | Side nav -> Achievements | Open creation flow and create a paper draft. | `01-researcher-create-form.png`, `02-researcher-created-draft.png` | Local synthetic record only; not production workflow acceptance. |
| 2 | `researcher` | Achievement draft detail | Open the draft detail, submit it, and show the submit result. | `03-researcher-draft-detail.png`, `04-researcher-submit-confirm.png`, `05-researcher-submit-result.png` | Localhost synthetic approval route only; not production approval acceptance. |
| 3 | `secretary` | Side nav -> Workflow Tasks | Open the generated achievement task and approve it. | `06-secretary-workflow-task-list.png`, `07-secretary-workflow-task-detail.png`, `08-secretary-approve-confirm.png`, `09-secretary-approve-result.png` | Local demo reviewer only; not real HR/SSO or production permission acceptance. |
| 4 | `admin` | Side nav -> Achievements | Open seeded `PENDING_ARCHIVE` achievement detail and archive it. | `30-tail-admin-pending-archive-list.png`, `31-tail-admin-pending-archive-detail.png`, `32-tail-admin-archive-confirm.png`, `33-tail-admin-archive-result.png` | Local seeded archive only; not production archive acceptance. |
| 5 | `admin` | Achievement or fee detail -> attachment/audit area | Show attachment metadata and masked audit/history summary. | `14-attachment-metadata.png`, `15-audit-masked-summary.png` | Safe metadata and masked history only; not raw audit export or production retention evidence. |
| 6 | `admin` | Side nav -> Fees | Open local fee review detail and approve it. | `16-admin-fee-list.png`, `17-admin-fee-pending-detail.png`, `18-admin-fee-approve-confirm.png`, `19-admin-fee-approve-result.png` | Local fee-review-capable demo context only; not real finance/payment/invoice/reconciliation acceptance. |
| 7 | `admin` | Archived achievement detail -> conversion ledger panel | Show the seeded ledger panel and create a local conversion record. | `34-tail-admin-conversion-ledger-panel.png`, `35-tail-admin-conversion-create-form.png`, `36-tail-admin-conversion-create-result.png` | MVP local ledger only; not real contract, legal, payment, or phase-two conversion completion. |
| 8 | `admin` | Side nav -> Account Management | Show lifecycle controls and simulated delivery state. | `37-tail-account-lifecycle-buttons.png` | Simulated delivery only; not real HR/SSO, email/SMS, token delivery, or production identity acceptance. |
| 9 | `admin` | Side nav -> Settings -> API integrations mock demo center | Run one mock scenario and show the synthetic result. | `38-tail-external-mock-center.png`, `39-tail-external-mock-result.png` | Mock/adapter only; not real DOI, literature, patent, finance, or HR provider integration. |
| 10 | `admin` | Side nav -> Dashboard, then Settings or Account Management import history | Open Dashboard fixed scoring summary and ImportJob aggregate history. | `40-tail-dashboard-fixed-scoring.png`, `41-tail-import-job-history-overview.png` | Fixed summary and aggregate history only; not full BI, production monitoring, row-level retry/rollback/export, or raw JSON support. |

## Persona Switch Card

- `researcher` -> create and submit achievement.
- `secretary` -> review achievement workflow task.
- `admin` -> archive, attachment/audit, fee review, conversion ledger, account lifecycle, mock demo center, Dashboard, and import history.

Say before switching:

> These are local demo personas for the localhost route. They are not real HR/SSO users, not production accounts, and not production finance reviewers or approvers.

## Judge Q&A

| Question | Safe answer |
| --- | --- |
| Is this production live? | No. This is localhost / local demo / synthetic DB evidence only. The result is `PASS 0 / PASS with caveat 10 / BLOCKED 0` for the local demo route, not production acceptance. |
| Is real HR/SSO connected? | No. `researcher`, `secretary`, and `admin` are local demo personas only, not real HR/SSO users or production accounts. |
| Did it send real email or SMS? | No. Account lifecycle uses simulated delivery wording only. Do not show or claim real invite/reset delivery. |
| Is real finance/payment/reconciliation connected? | No. Fee review is a local demo workflow. It does not prove real finance, payment, invoice, settlement, voucher, bank, or reconciliation integration. |
| Is real DOI/literature database/patent platform connected? | No. The external interface page is a mock demo center / adapter-boundary demo with synthetic outcomes only. |
| Is Dashboard complete BI? | No. Dashboard is a fixed scoring summary for phase-one review. It is not complete BI, a custom report builder, raw log viewer, or production monitoring. |
| Does ImportJob support row-level view/retry/rollback/export? | No. The demo shows aggregate ImportJob history / empty-safe state only. It does not claim ImportJobItem row-level display, retry, repair, rollback, delete, cleanup, download, export, raw CSV, or raw JSON workflows. |
| What do the 10 PASS with caveat items mean? | They mean the 10 documented paths are screenshotable and explainable on localhost using local demo data, with explicit non-production caveats. They are not production PASS items. |
| What if localhost fails on site? | Stop live operation and present from Step 95 screenshots plus Step 96/97/98-A documentation conclusions. Keep the same local-only conclusion and do not reword it as production PASS. |

## Forbidden Answers

- Do not say production, VPS, or production DB has been accepted.
- Do not say production migration has been executed.
- Do not say real external systems have been integrated or jointly tested.
- Do not say mock/adapter output is a real provider connection.
- Do not say local synthetic acceptance equals production acceptance.
- Do not show token, password, cookie, session, `DATABASE_URL`, connection string, raw payload, or raw log.

## Failure Fallback Wording

- Localhost unavailable: "The live localhost route is unavailable in this room, so I will use the Step 95 captured screenshots and Step 96/97/98-A documentation conclusions. The conclusion remains local/demo/synthetic only: `PASS 0 / PASS with caveat 10 / BLOCKED 0`."
- Docker unavailable: "Docker is not available for live local support right now. I will not start, repair, or clean Docker during the presentation. I will fall back to Step 95 screenshots and Step 96/97/98-A conclusions only."
- Browser unavailable: "The browser cannot open the live local route right now, so I will present from the captured Step 95 evidence and presenter package. I will not open unrelated pages, private files, raw logs, or credential-bearing material."
- Single UI action fails live: "This live action failed in the room, so I will stop this live path and use the Step 95 screenshot evidence for the documented localhost result. This is a live interruption, not a production result."

In every fallback, keep the local-only classification and never convert it into production/VPS/production DB PASS.
