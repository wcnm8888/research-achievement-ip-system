# ImportJobItem Read Final Archive

Date: 2026-07-05

Scope: Step 78E documentation-only archive for the Step 78A-D
`ImportJobItem` row-level safe history read delivery line.

This archive records what is complete and what remains explicitly out of scope.
It does not modify Web code, backend runtime code, Prisma schema, migrations,
package files, lockfiles, config, runtime behavior, databases, production
systems, or import execution.

## Delivery Summary

Step 78A completed the backend read DTO/API plan:

- Recommended a backend-only internal support read API for safe row-level facts.
- Chose `GET /import-jobs/:id/items` under existing job context.
- Rejected a global `/import-job-items` list.
- Kept authorization on `UserContextGuard`, `PermissionGuard`, and
  `system:config`.
- Limited the item DTO allowlist to:
  - `rowNumber`
  - `plannedAction`
  - `status`
  - `safeCode`
  - `targetType`

Step 78B implemented the backend-only safe read API:

- Added `GET /import-jobs/:id/items` in the existing import job history read
  module.
- Kept `system:config` as the permission boundary.
- Added route-scoped validation and filtering for `runId`, `status`,
  `plannedAction`, `targetType`, `safeCode`, `page`, and `pageSize`.
- Checked the parent `ImportJob` first with a safe parent `select`.
- Queried items with a Prisma item `select` allowlist.
- Returned only `items`, `total`, `page`, `pageSize`, and the five approved item
  fields.
- Did not return `targetId`, `jobId`, `runId`, raw/source values, personal or
  source identifiers, credentials, summaries, audit ids, fingerprints, hashes,
  or operator ids.

Step 78C decided the Web boundary:

- Web import history remains aggregate-only.
- Web does not call `/api/import-jobs/:id/items`.
- Web does not add an item-history API client method.
- Web does not add an item table, drawer, list, debug panel, download/export
  control, raw JSON view, copy control, or business-object drilldown.
- Future Web row-level display, if needed, must begin with a new Step 79A Web
  row-level UI plan.

Step 78D completed local synthetic backend-only acceptance:

- Host-shell helper correctly returned `BLOCKED / DATABASE_URL_NOT_SET`; this
  was not counted as acceptance PASS.
- Local Docker API/DB synthetic acceptance passed after rebuilding/restarting the
  local API container and applying local `prisma migrate deploy`.
- The local rebuild/restart and local migration deploy were only for local
  non-production acceptance.
- The result is not production, VPS, production DB, or production readiness
  acceptance.

## Read Surface

The delivered read surface is:

```text
GET /api/import-jobs/:id/items
```

It is a child resource under the existing import job route. Row reads must stay
anchored to one parent import job. A global `/import-job-items` route remains
unsupported.

The API supports safe query filters and pagination only:

- `runId`
- `status`
- `plannedAction`
- `targetType`
- `safeCode`
- `page`
- `pageSize`

The default source-row ordering remains `rowNumber asc`, with `runId asc` as the
cross-run tie-breaker.

## Response Allowlist

Top-level response fields are limited to:

- `items`
- `total`
- `page`
- `pageSize`

Each item is limited to:

- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`

`ImportJobItem` has no created timestamp fields in the current schema, so no
created facts are exposed by the item read DTO.

## Safety Boundary

The row-level read line must not return, display, log as evidence, export, or
copy:

- `targetId`
- `jobId`
- `runId`
- raw CSV
- row values
- email
- `employeeNo`
- name
- `departmentCode`
- role
- title
- DOI
- registration number
- patent number
- contributors
- credentials
- invite values
- password
- token
- cookie
- connection string
- `safeSummary`
- `auditLogIds`
- `idempotencyKeyHash`
- `scopeHash`
- `fileFingerprint`
- `requestFingerprint`
- `operatorUserId`

This boundary applies to DTOs, API responses, repository `select` shapes,
testing/acceptance evidence, logs, Web display, copy controls, export/download
surfaces, and future documentation.

## Unsupported Capabilities

This delivery does not support:

- retry
- delete
- cleanup
- rollback
- download
- export
- raw JSON
- raw CSV
- business-object drilldown
- links from item rows to Departments, Users, Achievements, or typed
  achievement detail records

The API is a backend support diagnostic read surface only.

## Verification Archive

Step 78B verification:

- `corepack pnpm --filter @research-ip/api test -- import-job-history-read`:
  PASS; 3 files / 22 tests passed.
- `corepack pnpm --filter @research-ip/api typecheck`: PASS.

Step 78D local acceptance:

- Host shell helper: `BLOCKED / DATABASE_URL_NOT_SET`, correctly not counted as
  PASS.
- Local Docker API/container DB helper run: PASS.
- Verified `system:config` read, non-`system:config` 403, missing parent 404,
  empty list, filters, pagination, invalid UUID 400, invalid enum 400, and
  non-whitelisted query 400.
- Verified response fields are allowlist-only.
- Verified Web remains aggregate-only.

Step 78E does not rerun backend tests, typecheck, build, services, migration, DB
checks, or synthetic acceptance because it is docs-only.

## Future Work

If Web row-level display is ever needed, it must start with a new Step 79A Web
row-level UI plan. That plan must re-justify the UX, privacy, and product
boundary before any implementation.

If production readiness is needed, it must be a separate production read-only
preflight or updated runbook. Local synthetic acceptance must not be used as a
proxy for production, VPS, production DB, real import, or real-data readiness.

This archive closes the Step 78A-D backend read line without authorizing Web
row-level history, production execution, true import apply, export/download,
raw/source data access, or business-object drilldown.
