# Phase One Demo Presenter Brief

Date: 2026-07-06

Scope: Step 96 docs-only presenter package for the phase-one localhost demo. This brief packages the Step 95 final UI recheck evidence for competition/reviewer presentation. It does not add new runtime evidence and is not production acceptance.

## 1. Demo Judgment

Final phase-one localhost demo judgment from Step 95:

| Decision | Count | Meaning |
| --- | ---: | --- |
| PASS | 0 | No path is claimed as production-ready acceptance. |
| PASS with caveat | 10 | All 10 required phase-one demo paths were screenshotable on localhost with local/demo/synthetic caveats. |
| BLOCKED | 0 | No Step 95 localhost UI blocker remains for the demo route. |

Formal presentation is allowed only under this boundary:

- Environment: localhost / local demo / synthetic DB.
- Acceptance wording: local/demo/synthetic acceptance only.
- Not allowed: production/VPS/production DB acceptance, real external-system acceptance, or real HR/SSO/email/SMS/finance acceptance.

Recommended opening line:

> This is a phase-one localhost demo using synthetic local data. It demonstrates the complete reviewer-facing route and evidence from Step 95, but it is not production acceptance.

## 2. Demo User Switch Order

Use this order and keep it explicit during presentation:

1. `researcher` -> create and submit an achievement.
2. `secretary` -> review the achievement workflow task.
3. `admin` -> archive, fee review, conversion ledger, account lifecycle, mock demo center, Dashboard, and import history.

These are local/demo personas only. Do not describe them as production identities, real HR/SSO accounts, or a production finance reviewer.

## 3. Ten-Path Presenter Table

| # | Functional path | Demo user | Operation entry | Expected screen | Evidence file name | Presenter focus | Caveat |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Achievement creation and submission | `researcher` | Side nav -> Achievements -> create/open draft -> submit | Draft form, created draft, detail, submit confirmation, submit result | `01-researcher-create-form.png`, `02-researcher-created-draft.png`, `03-researcher-draft-detail.png`, `04-researcher-submit-confirm.png`, `05-researcher-submit-result.png` | Research output can enter the system and move from draft to review. | Local synthetic record only; not production workflow acceptance. |
| 2 | Achievement department review | `secretary` | Side nav -> Workflow Tasks -> open achievement task -> approve | Task list, task detail, approval confirmation, approval result | `06-secretary-workflow-task-list.png`, `07-secretary-workflow-task-detail.png`, `08-secretary-approve-confirm.png`, `09-secretary-approve-result.png` | Department reviewer can process achievement approval in the demo route. | Local demo reviewer only; not real HR/SSO or production permission acceptance. |
| 3 | Admin archive | `admin` | Side nav -> Achievements -> open seeded `PENDING_ARCHIVE` detail -> archive | Pending archive list/detail, archive confirmation, archive result | `30-tail-admin-pending-archive-list.png`, `31-tail-admin-pending-archive-detail.png`, `32-tail-admin-archive-confirm.png`, `33-tail-admin-archive-result.png` | Step 94 blocker is repaired; archived outcome is screenshotable in localhost UI. | Local seeded achievement only; not production archive acceptance. |
| 4 | Attachment metadata and audit summary | `admin` or current record owner/reviewer context | Achievement or fee detail -> attachment area -> Audit Logs/history | Attachment metadata and masked audit/history summary | `14-attachment-metadata.png`, `15-audit-masked-summary.png` | Supporting records are traceable without exposing raw sensitive payloads. | Not real object-storage, raw audit export, or production retention evidence. |
| 5 | Fee review loop | `admin` | Side nav -> Fees -> fee detail workflow task -> approve | Fee list, pending detail, approve confirmation, approve result | `16-admin-fee-list.png`, `17-admin-fee-pending-detail.png`, `18-admin-fee-approve-confirm.png`, `19-admin-fee-approve-result.png` | Fee approval workflow is visible as part of phase-one review coverage. | Local fee-review-capable admin context only; not real finance/payment/invoice/reconciliation acceptance. |
| 6 | Achievement conversion ledger | `admin` | Archived achievement detail -> conversion ledger panel -> create record | Ledger panel, create form, create result | `34-tail-admin-conversion-ledger-panel.png`, `35-tail-admin-conversion-create-form.png`, `36-tail-admin-conversion-create-result.png` | Archived achievements can connect to a local conversion MVP ledger. | MVP local ledger only; not real contract, legal, payment, or phase-two conversion completion. |
| 7 | Account lifecycle | `admin` | Side nav -> Account Management -> lifecycle actions | Invite/reset permission buttons and simulated delivery state | `37-tail-account-lifecycle-buttons.png` | Account lifecycle controls and safe simulated delivery are visible. | Simulated delivery only; not real HR/SSO, email/SMS, token delivery, or production identity acceptance. |
| 8 | External interface mock demo center | `admin` | Side nav -> Settings -> API integrations mock demo center -> run scenario | Mock center controls and synthetic result | `38-tail-external-mock-center.png`, `39-tail-external-mock-result.png` | External integration boundaries and degraded/success states can be demonstrated safely. | Mock demo center only; not real DOI/literature/patent/finance/HR provider integration. |
| 9 | Dashboard fixed scoring summary | `admin` | Side nav -> Dashboard | Fixed scoring summary with department, fee, workflow, conversion, and mock overview | `40-tail-dashboard-fixed-scoring.png` | Reviewers can see a single Dashboard view for phase-one status and evidence. | Fixed summary only; not full BI, custom report builder, raw log viewer, or production monitoring. |
| 10 | ImportJob history / empty state | `admin` | Side nav -> Settings import history or Account Management import history | ImportJob history overview / aggregate-safe state | `41-tail-import-job-history-overview.png` | Import history is visible at aggregate level without unsafe row exposure. | Local aggregate history only; not production import execution, retry, repair, rollback, raw CSV, or raw JSON export. |

## 4. Reviewer-Visible Value

The presentation should emphasize these visible phase-one values:

- Achievement registration, approval, and archive route.
- Fee approval route.
- Achievement conversion MVP ledger.
- Account lifecycle controls and simulated delivery.
- External interface mock demo center.
- Dashboard fixed scoring summary.
- Import history / ImportJob aggregate visibility.

One concise framing:

> The demo shows how research outputs enter review, become archived records, connect to fee and conversion workflows, and remain explainable through account, mock integration, Dashboard, and import-history evidence.

## 5. Required Caveats

Use these caveats consistently:

- Mock/adapter wording: this is a mock demo center. It demonstrates adapter boundaries and safe synthetic outcomes, not real external-system integration.
- Local acceptance wording: this is local/demo/synthetic acceptance. It does not equal production acceptance.
- Data wording: records are local synthetic demo data, not production data.
- Evidence wording: screenshots are Step 95 localhost evidence files under `.local-step95-ui-preflight/`; they are not committed runtime artifacts.

## 6. Explicit Non-Claims

Do not claim any of the following:

- Production/VPS/production DB validation or acceptance.
- Real HR/SSO integration.
- Real email/SMS delivery.
- Real finance payment, invoice, settlement, voucher, bank, or reconciliation integration.
- Real DOI, literature database, patent platform, or provider integration.
- Complete BI, custom report platform, raw log viewer, or production monitoring.
- Mobile client completion.
- Large-scale load testing, disaster recovery drill, or production observability coverage.

## 7. On-Site Failure Fallback

If localhost, Docker, browser, or local service startup fails during the live presentation:

- State that the live localhost walkthrough is unavailable at that moment.
- Fall back only to Step 95 screenshots and the Step 95/Step 96 documentation conclusion.
- Keep the exact conclusion: `PASS 0 / PASS with caveat 10 / BLOCKED 0` for localhost/local-demo/synthetic evidence.
- Do not reword the fallback as production acceptance.
- Do not claim that production, VPS, production DB, or real external systems were validated.

Suggested fallback wording:

> The live localhost route is not available in this room right now, so I will use the Step 95 captured screenshots and presenter brief. The conclusion remains local/demo/synthetic only: PASS 0, PASS with caveat 10, BLOCKED 0. This is not production acceptance.

## 8. Sensitive Information Protection

Never display or capture:

- Token, password, cookie, session, password hash, token hash, API key, provider credential, `DATABASE_URL`, connection string, or `.env` content.
- Raw payload, raw request, raw response, raw log, raw CSV row dump, raw JSON export, or unmasked audit detail.
- Complete email/SMS invite/reset links or one-time activation/reset links.

If a screen unexpectedly shows sensitive values, stop the presentation path and switch to the safe Step 95 screenshot/documentation fallback.
