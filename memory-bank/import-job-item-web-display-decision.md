# ImportJobItem Web Display Decision

Date: 2026-07-05

Scope: Step 78C documentation-only decision for whether Web should display
`ImportJobItem` row-level safe history.

This decision does not modify Web code, API code, Prisma schema, migrations,
package files, lockfiles, config, runtime behavior, databases, production
systems, or import execution.

## Current State

Step 77A-D delivered `ImportJobItem` persistence:

- Step 77A added the schema and additive migration.
- Step 77B added Department success-path item writing.
- Step 77C added Achievement success-path item writing.
- Step 77D added User account success-path item writing.

Step 78B delivered a backend-only safe read API:

- `GET /import-jobs/:id/items`
- `system:config` permission boundary
- route-scoped `jobId`
- optional safe filters
- DTO allowlist limited to `rowNumber`, `plannedAction`, `status`,
  `safeCode`, and `targetType`

Current Web import history remains aggregate-only. The existing Web surfaces use
only:

- `listImportJobHistory`
- `getImportJobHistoryDetail`
- aggregate counts
- sanitized safe summary
- run status
- `auditCount`

No Web API client method exists for `/api/import-jobs/:id/items`, and this Step
does not add one.

## Decision

Do not connect row-level `ImportJobItem` history to Web in the current phase.

Web should continue to be aggregate-only.

Keep the Step 78B backend item API as a backend support diagnostic surface only.

## Rationale

Even with a safe DTO, row-level history is close to source CSV or spreadsheet
structure. Showing it in Web creates product pressure and user interpretation
risks:

- `rowNumber` can be misused as a CSV reconstruction anchor.
- Users may treat row history as business-object detail or drilldown.
- A row list can become a support/debug panel that invites copy, export, or raw
  JSON workflows.
- Future requests may pressure the team to add `targetId`, titles, emails, DOI,
  patent numbers, registration numbers, or other source identifiers back into
  display.
- Existing aggregate counts, safe summary, run status, and `auditCount` already
  satisfy ordinary operations review without increasing row-level exposure.

The safer product boundary is: Web explains import outcomes at job/run level;
backend support can inspect row-level safe facts only when explicitly needed.

## Web Prohibitions

Current Web work must not:

- call `/api/import-jobs/:id/items`;
- add an API client method for item history;
- add an item table, drawer, list, debug panel, or row-level detail view;
- add download, export, raw JSON, copy, or debug controls;
- display `targetId`;
- display `jobId`;
- display `runId`;
- display raw CSV;
- display row values;
- display email, `employeeNo`, names, `departmentCode`, role, title, DOI,
  registration number, patent number, contributors, credentials, invite,
  password, token, cookie, or connection string values;
- add business-object links or drilldown from item rows.

## Future Web Option

If a future Step decides Web row-level history is truly necessary, it must start
with a new Web row-level UI plan, recommended as Step 79A.

That future plan may only consider these display fields:

- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`

It must still prohibit:

- `targetId`, `jobId`, and `runId`;
- links;
- copy controls;
- downloads;
- exports;
- raw JSON;
- raw CSV;
- business-object drilldown;
- source identifiers or personal data.

The future plan must also define UX copy that prevents users from interpreting
row history as a CSV reconstruction tool, row-level audit replacement, or
business-object detail page.

## Permission Boundary

No permission change is needed.

The backend item API remains under `system:config`. Web does not add a new
permission because Web does not add row-level item display in this decision.

## Follow-Up Split

- Step 78D may perform backend-only local synthetic acceptance if needed to
  validate the Step 78B API with synthetic item rows.
- Future Web work, if needed, must begin with a new Step 79A Web row-level UI
  plan before implementation.

Step 78C does not authorize Web row-level display, API client methods, API or
backend changes, database access, production access, migration execution, real
imports, exports, downloads, raw/source data access, or business-object
drilldown.
