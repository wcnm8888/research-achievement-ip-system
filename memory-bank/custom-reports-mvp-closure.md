# Custom Reports MVP Closure

Date: 2026-07-06

Scope: Step 105-B closure for the Route B custom reports / advanced reports MVP. This archive verifies the Step 103-B backend read-only API and Step 104-B Web page as a local/demo aggregate reporting loop. It is not production acceptance and does not add business code, Prisma schema, migrations, exports, saved templates, scheduled delivery, raw JSON, or sensitive drilldown.

## 1. MVP Scope Conclusion

Completed:

- Backend endpoint `GET /reports/templates`.
- Backend endpoint `GET /reports/templates/:templateId/run`.
- Web `Custom Reports` page reachable from the main navigation near Dashboard.
- Web API client methods `listCustomReportTemplates(...)` and `runCustomReport(...)`.
- Web typed response handling for metadata, filters, scope summary, columns, aggregate rows, totals, and caveats.
- Five static templates:
  - `achievement-distribution`.
  - `achievement-trend`.
  - `fee-risk-summary`.
  - `workflow-efficiency`.
  - `conversion-funnel`.

MVP result:

- The custom reports MVP is closed as a backend + Web read-only aggregate summary loop.
- It consumes local/demo API data through the current user context and existing policy filters.
- It does not persist templates, schedule delivery, export raw files, or expose sensitive detail rows.

## 2. Safety Boundaries

Data shape:

- Aggregate-only output.
- No row-level sensitive drilldown.
- No raw payload, raw JSON, raw CSV, raw logs, complete external request/response, token, cookie, session, password, `DATABASE_URL`, connection string, secret, API key, attachment object key, checksum, invite/reset link, or raw ImportJob source.

Policy and scope:

- Controller requires existing `UserContextGuard`, `PermissionGuard`, and `user_context:read`.
- Achievement reports inherit `achievementReadableWhere(...)`.
- Conversion reports aggregate only through readable achievements.
- Fee report inherits `feeReadableWhere(...)`.
- `departmentId` filters narrow the backend policy result and do not replace it.
- Workflow first version is current-assignee aggregate only and does not expose unrelated users' tasks.

Feature omissions by design:

- No export or download.
- No saved templates.
- No scheduled reports.
- No raw JSON view.
- No sensitive drilldown.
- No production monitoring behavior.

## 3. Non-Completion Items

Do not claim this MVP as:

- Full BI.
- Production monitoring.
- Production/VPS/production DB acceptance.
- Real external-system integration or joint testing.
- Real DOI/literature/patent/finance/HR/SSO/email/SMS integration evidence.
- Persistent custom report-template management.
- Scheduled report delivery.
- Mobile support.
- Real large-scale performance test evidence.
- Production readiness or production observability acceptance.

## 4. Acceptance Matrix

| Template | API support | Web selectable | Key filters | Result shape | Caveat |
| --- | --- | --- | --- | --- | --- |
| `achievement-distribution` | Yes, `GET /reports/templates/:templateId/run` | Yes | `dateFrom`, `dateTo`, `departmentId`, `achievementType`, `status` | Department/type aggregate rows plus totals | Uses achievement readable policy; not sensitive detail drilldown. |
| `achievement-trend` | Yes, `GET /reports/templates/:templateId/run` | Yes | `dateFrom`, `dateTo`, `departmentId`, `achievementType`, `status`, `groupBy=year|month` | Period/type aggregate rows plus totals | Trend summary only; not full BI or production monitoring. |
| `fee-risk-summary` | Yes, `GET /reports/templates/:templateId/run` | Yes | `dateFrom`, `dateTo`, `departmentId`, `status`, `dueSoonDays` | Payment/risk aggregate rows plus totals | Uses fee readable policy; no voucher/raw finance data. |
| `workflow-efficiency` | Yes, `GET /reports/templates/:templateId/run` | Yes | `dateFrom`, `dateTo`, `departmentId`, `status` | Current-assignee task-status aggregate rows plus totals | First version aggregates current assignee only; no task detail rows. |
| `conversion-funnel` | Yes, `GET /reports/templates/:templateId/run` | Yes | `dateFrom`, `dateTo`, `departmentId`, `achievementType`, `status` | Conversion-status aggregate rows plus contract/revenue totals | Aggregates through readable achievements; not real contract/legal/payment acceptance. |

Shared caveats returned/displayed:

- `local/demo/custom report summary`.
- `not full BI`.
- `not production monitoring`.

## 5. Verification Summary

Step 103-B backend verification:

- `corepack pnpm --filter @research-ip/api test -- reports`: PASS.
- `corepack pnpm --filter @research-ip/api typecheck`: PASS in Step 103-B.

Step 104-B Web verification:

- `corepack pnpm --filter @research-ip/web test -- CustomReports api-client App`: PASS.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.

Step 105-B closure must rerun the backend and Web gates listed in `memory-bank/evidence.md` before commit.

## 6. Next Step Suggestions

Route B can continue with one of these user-selected follow-ups:

- A. Custom reports local UI/browser acceptance: run a localhost local/demo/synthetic browser walkthrough and capture evidence that the 5 templates render as expected.
- B. Custom reports enhancement: add deferred aggregate templates such as ImportJob aggregate history and external mock overview, still without raw export or sensitive drilldown unless separately authorized.
- C. Achievement conversion deepening MVP technical plan: design revenue distribution, post-evaluation, contract status, and revenue status extensions.

Route C/D gates remain separate:

- Any production/VPS/production DB work requires explicit separate authorization.
- Any real external-system integration requires explicit separate authorization, real test environment boundaries, credential-handling rules, and go/no-go checks.
- Do not default to reading `.env`, accessing production/VPS/production DB, or calling real external systems.
