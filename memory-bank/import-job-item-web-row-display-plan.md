# ImportJobItem Web Row Display Plan

Date: 2026-07-06

Status: PLAN ONLY. No runtime/API/Web/Prisma code is changed by this step.

## Decision

Recommend proceeding to a narrowly scoped Step 112 implementation for Web
row-level safe read display, because the existing backend-only API already
matches the required item-field allowlist:

- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`

The Web implementation must remain route-scoped to the currently opened
`ImportJob` detail and must not become a general row browser, debug panel,
export surface, retry tool, rollback tool, or business-object drilldown.

## Current State

- Web already displays `ImportJob` / `ImportRun` aggregate history in import
  history surfaces and settings/system overview.
- `ImportJobItem` write persistence is completed for Department, Achievement,
  and User account import success paths.
- Backend-only safe item read API exists:
  `GET /api/import-jobs/:id/items`.
- The current backend item DTO returns only:
  `rowNumber`, `plannedAction`, `status`, `safeCode`, and `targetType`, plus
  paging metadata.
- The backend route is under `system:config`.
- Web row-level item display was previously not authorized and is still not
  implemented as of this plan.

## Backend Contract Review

Reviewed files:

- `apps/api/src/imports/import-job-history-read.controller.ts`.
- `apps/api/src/imports/import-job-history-read.service.ts`.
- `apps/api/src/imports/import-job-history-read.repository.ts`.

Current useful contract:

- Route: `GET /api/import-jobs/:id/items`.
- Route scope: `:id` is the current import job ID.
- Permission: `system:config`.
- Query currently supports `status`, `plannedAction`, `targetType`,
  `safeCode`, `page`, and `pageSize`.
- Query also supports `runId`, but the first Web implementation should not
  expose a run ID filter or display run IDs.
- Repository select for item rows is already limited to:
  `rowNumber`, `plannedAction`, `status`, `safeCode`, `targetType`.

Minimum backend patch needed before Step 112: none.

Step 112 should still add Web-side tests proving the client and UI do not
render or depend on forbidden fields. If implementation discovers the API
returns extra item fields in a future branch, stop and add a minimal backend
allowlist patch in a separate authorized step.

## Web Display Field Allowlist

The Web row table may display only these item fields:

| Field | Display intent | Notes |
| --- | --- | --- |
| `rowNumber` | Row number from the import processing record. | Treat as a local processing index, not as a CSV reconstruction link. |
| `plannedAction` | Planned safe action label. | Render as text/tag. |
| `status` | Safe item processing status. | Render as text/tag. |
| `safeCode` | Safe outcome/error code. | Show `Not returned` when null. |
| `targetType` | High-level import target type. | No business-object link. |

Pagination metadata may be used:

- `total`
- `page`
- `pageSize`

The Web may support safe filters:

- `status`
- `plannedAction`
- `targetType`
- `safeCode`

The Web should defer server-side sorting unless a later step adds explicit
backend support. Initial display should use backend order.

## Forbidden Fields

The Web must not display, return through a new client type, copy, export, or
surface in debug UI:

- `targetId`
- raw/source payload
- raw JSON
- `safeSummary`
- `auditLogIds`
- `jobId` or `runId` internal ID detail display
- operator ID
- fingerprint/hash/checksum/object key
- email
- phone
- employee ID
- ID card / national identifier
- password
- token
- cookie
- session
- connection string
- key/secret material

Implementation note: an API client method will necessarily receive the parent
job ID as a function argument to build the route. That internal route parameter
must not be rendered as item-row content or made copyable in the item panel.

## Forbidden Capabilities

Do not add:

- retry
- repair
- rollback
- cleanup
- delete
- download
- export
- copy raw
- raw JSON view
- raw CSV view
- business-object drilldown
- links from item rows to departments, users, achievements, fees, audit logs, or
  import runs
- raw log/debug panel

The panel is read-only and explanatory only.

## UX Proposal

Add a safe read-only section inside the existing Import History detail view.

Recommended placement:

- Keep the existing import job detail summary and run summary as the primary
  view.
- Add a collapsed or secondary section titled `Safe row history`.
- Label the request as `GET /import-jobs/:id/items`.
- Include a boundary notice above the table:
  `Local/demo aggregate history support only. This safe row view shows only
  row number, planned action, status, safe code, and target type. It is not raw
  CSV, raw JSON, production import acceptance, retry, rollback, cleanup, export,
  or business-object drilldown.`

Table columns:

- Row
- Planned action
- Status
- Safe code
- Target type

Controls:

- Refresh items.
- Page / page size.
- Optional safe filters for `status`, `plannedAction`, `targetType`, and
  `safeCode`.

Avoid:

- copy buttons on cells or rows,
- expandable row details,
- drawer-per-row,
- raw response previews,
- links in table cells,
- showing parent job ID or run ID inside row content.

### Empty State

Show:

`No safe row history returned for this import job.`

Additional copy:

`This does not imply raw source rows are unavailable; raw source data is outside
this Web boundary.`

### Loading State

Use the existing page loading pattern for the section only. Do not block the
entire import job detail while item rows load.

### Error State

Use sanitized, generic messages:

- 401: select or switch demo user.
- 403: current role cannot read safe import item history.
- 404: import job not found or not visible to this route.
- 400/422: item filter parameters are invalid.
- 5xx/network: safe import item history service unavailable.

Do not show raw backend detail text if it contains request bodies, raw payloads,
tokens, connection strings, or source identifiers.

### Pagination State

- Show `page`, `pageSize`, and `total`.
- Disable previous/next when unavailable.
- Keep requests route-scoped to the current import job.
- Do not expose a global item search.

## Tests For Step 112

Recommended Web tests:

- API client builds `GET /import-jobs/:id/items` with only safe query params.
- Web type allows only item display fields and pagination metadata.
- Import history detail renders the safe row panel with the five allowlisted
  fields.
- Empty, loading, error, and pagination states render without leaking raw
  details.
- Forbidden text/entry point test verifies absence of:
  `targetId`, raw/source payload, raw JSON, `safeSummary`, `auditLogIds`,
  `jobId`, `runId`, operator ID, fingerprint/hash/checksum/object key, email,
  phone, employee ID, ID card, password, token, cookie, session, connection
  string, retry, repair, rollback, cleanup, delete, download, export, copy raw,
  business-object drilldown, and raw log/debug panel.

Recommended local acceptance for Step 113:

- Use localhost/local-demo/synthetic data only.
- Open an import history detail with seeded or synthetic item rows.
- Confirm the safe row panel displays only the five allowlisted columns.
- Confirm pagination/filter behavior stays scoped to the current job.
- Confirm no forbidden entry points or sensitive fields are visible.
- Archive screenshots/logs in an untracked `.local-step113-*` evidence
  directory.

## Step Split

Recommended next steps:

1. Step 112: Web API client/types + Import History safe row panel.
   - Modify only Web files and Web tests unless a newly discovered backend
     allowlist mismatch blocks implementation.
   - Do not add retry/export/raw JSON/rollback/drilldown.
2. Step 113: localhost/local-demo/synthetic UI acceptance and closure.
   - Capture local evidence.
   - Keep screenshots/logs untracked.

## Non-Claims

This plan does not implement Web row-level display.

This plan does not authorize production/VPS/production DB access, production
migrations, real-data import apply, retry/repair/rollback/cleanup/delete,
download/export/raw JSON, raw source access, business-object drilldown, or
credential/secret handling.
