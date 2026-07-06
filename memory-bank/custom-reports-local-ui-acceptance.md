# Custom Reports Local UI Acceptance

Date: 2026-07-06

Scope: Step 106-B-A localhost/local-demo/synthetic UI/browser acceptance for the Route B Custom Reports MVP. This verifies the Step 103-B backend read-only API and Step 104-B Web page through a local browser session. It is not production/VPS/production DB acceptance, not full BI, not production monitoring, and not real external-system integration evidence.

## 1. Acceptance Mode

- Runtime: localhost API and localhost Web only.
- Database: local synthetic PostgreSQL database only.
- Demo persona: local demo admin user `40000000-0000-4000-8000-000000000003`.
- Browser path: local Edge headless session controlled through Chrome DevTools Protocol.
- Evidence directory: `.local-step106-custom-reports-acceptance/`.
- Evidence directory status: local/untracked only; screenshots, logs, scripts, and browser profile are not intended for commit.

Boundaries:

- Not production acceptance.
- Not VPS acceptance.
- Not production DB acceptance.
- Not full BI.
- Not production monitoring.
- No real HR/SSO, email/SMS, finance/payment/reconciliation, DOI/literature/patent, or other real external-system call.
- No Prisma schema or migration file change.
- No export, download, saved template, scheduled report, raw JSON view, raw payload view, or sensitive drilldown was added.

## 2. Local Setup Used

Local synthetic services used for acceptance:

- PostgreSQL container: `research-step106-custom-reports-postgres`.
- PostgreSQL port: `127.0.0.1:17432`.
- Synthetic database: `research_step106_custom_reports`.
- API: `http://127.0.0.1:3000`.
- Web: `http://127.0.0.1:5173`.

Local database preparation:

- Ran Prisma migration deploy against the explicit local synthetic `DATABASE_URL` only.
- Ran `prisma db seed` against the explicit local synthetic `DATABASE_URL` only.
- This was not a production migration, production runbook, production DB operation, or real-data apply.

Local browser evidence files:

- `.local-step106-custom-reports-acceptance/acceptance-report.json`.
- `.local-step106-custom-reports-acceptance/01-custom-reports-nav.png`.
- `.local-step106-custom-reports-acceptance/02-achievement-distribution.png`.
- `.local-step106-custom-reports-acceptance/03-achievement-trend.png`.
- `.local-step106-custom-reports-acceptance/04-fee-risk-summary.png`.
- `.local-step106-custom-reports-acceptance/05-workflow-efficiency.png`.
- `.local-step106-custom-reports-acceptance/06-conversion-funnel.png`.
- `.local-step106-custom-reports-acceptance/browser-acceptance-run.log`.
- `.local-step106-custom-reports-acceptance/api-dev-2.log`.
- `.local-step106-custom-reports-acceptance/web-dev.log`.

## 3. Acceptance Matrix

| Template | UI selectable | Run result | Required sections | Special control | Screenshot | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `achievement-distribution` | Yes | Aggregate rows rendered | metadata, filters, scopeSummary, totals, rows, caveats | `groupBy` absent; `dueSoonDays` absent | `02-achievement-distribution.png` | PASS |
| `achievement-trend` | Yes | Aggregate rows rendered | metadata, filters, scopeSummary, totals, rows, caveats | `groupBy` visible; `dueSoonDays` absent | `03-achievement-trend.png` | PASS |
| `fee-risk-summary` | Yes | Aggregate rows rendered | metadata, filters, scopeSummary, totals, rows, caveats | `dueSoonDays` visible; `groupBy` absent | `04-fee-risk-summary.png` | PASS |
| `workflow-efficiency` | Yes | Aggregate rows or empty state rendered | metadata, filters, scopeSummary, totals, rows/empty state, caveats | `groupBy` absent; `dueSoonDays` absent | `05-workflow-efficiency.png` | PASS |
| `conversion-funnel` | Yes | Aggregate rows or empty state rendered | metadata, filters, scopeSummary, totals, rows/empty state, caveats | `groupBy` absent; `dueSoonDays` absent | `06-conversion-funnel.png` | PASS |

Navigation:

- `Custom Reports` navigation entry was visible.
- Browser acceptance entered the page from the Web navigation, not by only calling the API.
- Screenshot: `01-custom-reports-nav.png`.

## 4. UI Boundary and Safety Checks

Observed page boundary copy includes:

- `local/demo/custom report summary`.
- `not full BI`.
- `not production monitoring`.
- `not production acceptance`.
- `no raw export`.
- `no sensitive drilldown`.
- `no real external-system evidence`.

Forbidden feature entries checked as absent:

- `Export`.
- `Download`.
- `Raw JSON`.
- `Save template`.
- `Schedule`.
- Actionable drilldown/detail/raw payload entry.

Sensitive leakage terms checked as absent from the accepted page state:

- raw payload.
- token.
- cookie.
- password.
- connection string.
- `DATABASE_URL`.
- object key.
- checksum.

One small UI copy fix was made during this Step:

- `apps/web/src/CustomReports.tsx` now states `not production acceptance` in the boundary copy.
- `apps/web/src/CustomReports.test.tsx` now asserts that boundary text.
- No API behavior, Prisma schema, migration, seed, export, saved template, scheduled report, or drilldown feature was changed.

## 5. Result

- Overall UI/browser acceptance status: PASS.
- BLOCKED count: 0.
- Five templates are confirmed selectable and runnable from the Web page in localhost/local-demo/synthetic mode.
- The page remains aggregate-only and caveated.
- The local evidence directory remains untracked and must not be committed.

## 6. Remaining Non-Claims

Do not claim this Step as:

- Production/VPS/production DB acceptance.
- Production migration execution.
- Production monitoring acceptance.
- Full BI completion.
- Real external-system integration or joint testing.
- Real HR/SSO, email/SMS, finance/payment/reconciliation, DOI/literature/patent acceptance.
- Saved template, scheduled report, export/download, raw JSON, raw payload, or sensitive drilldown completion.
- Mobile acceptance or large-scale production performance acceptance.
