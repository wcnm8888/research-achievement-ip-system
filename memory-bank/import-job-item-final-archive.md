# ImportJobItem Final Archive

Date: 2026-07-05

Scope: Step 80A documentation-only total archive for the `ImportJobItem`
row-level safe history line from Step 76A through Step 79C.

This archive summarizes the privacy boundary, schema and writer delivery, read
surface, local synthetic backend-only acceptance, and production read-only
preflight documentation state. It does not modify Web, backend runtime, API
code, Prisma schema, migrations, package files, lockfiles, config, production
runbooks, or deployment files.

This Step did not access any database, production/VPS host, production DB,
`.env`, `.env.production`, credential, token, cookie, password, private key, or
connection string. It did not run migrations, start services, execute imports,
execute a runbook, clean local artifacts, or handle synthetic data.

## Timeline Summary

### Step 76A/76B - Safe History Boundary

Step 76A defined `ImportJobItem` row-level safe history as privacy-sensitive
because row-level records sit close to CSV/spreadsheet source content and can
reveal row values, business identifiers, or people data if the field boundary is
not strict.

Step 76B archived that plan as a privacy and field-boundary reference only.
The archived safe-field planning allowlist was:

- `jobId`
- `runId`
- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`
- internal-only `targetId`

The same line established the forbidden-field boundary: no raw CSV, CSV
excerpts, source row values, imported cell values, email, employee number,
`employeeNo`, names, department codes, roles, titles, DOI, registration
numbers, patent numbers, contributors, credentials, invite/password/token/
cookie/connection string values, source identifiers, normalized identifiers, or
raw exception values may be stored, returned, logged as evidence, exported, or
displayed.

### Step 76C/76D - Schema Plan And Schema Archive

Step 76C planned a future `ImportJobItem` schema shape under `ImportJob` and
`ImportRun` with required `jobId` and `runId`, conservative `onDelete:
Restrict`, additive migration strategy, no backfill, no seed, no JSON row-value
columns, no business-table changes, and narrow import-item enums.

Step 76D archived that schema plan as reference material. At that point it
still did not authorize Prisma schema edits, migration files, backend/API/Web
implementation, database access, production access, import apply, or
acceptance execution.

### Step 77A-E - Persistence Delivery

Step 77A delivered the `ImportJobItem` Prisma schema plus an additive migration
for `import_job_items`. The schema stayed limited to `jobId`, `runId`,
`rowNumber`, `plannedAction`, `status`, `safeCode`, `targetType`, and
internal-only `targetId`. Migration apply/deploy/reset was not executed in that
Step.

Step 77B delivered Department `CREATE_ONLY` success-path item writing. Item
rows are written as `CREATE` / `APPLIED` / `DEPARTMENT`.

Step 77C delivered Achievement `CREATE_DRAFT_ONLY` success-path item writing
for `PAPER`, `SOFTWARE_COPYRIGHT`, and `PATENT`. Item rows are written as
`CREATE_DRAFT` / `APPLIED` / `ACHIEVEMENT`; `achievementType` is inherited from
`ImportJob` and is not duplicated on item rows.

Step 77D delivered User account `CREATE_ONLY_PENDING_NO_CREDENTIAL`
success-path item writing. Item rows are written as `CREATE_PENDING_USER` /
`APPLIED` / `USER`.

Step 77E archived the writer delivery line. All supported writers write items
only for the `RUNNER` + successful `EXECUTED` path, in the same Prisma
transaction as business object creation, audit writes, and `ImportRun` /
`ImportJob` success updates. Rejected, failed, replayed success, and
in-progress paths do not write item rows.

### Step 78A-E - Read Delivery

Step 78A planned the backend read DTO/API surface. It selected a job-scoped
child route, rejected a global `/import-job-items` route, kept the permission
boundary at `system:config`, and limited item DTO fields to `rowNumber`,
`plannedAction`, `status`, `safeCode`, and `targetType`.

Step 78B implemented backend-only `GET /api/import-jobs/:id/items` under the
existing import job history read surface. It verifies the parent job with a
safe parent select, scopes item queries by route `jobId`, uses Prisma item
select allowlists, supports safe filters and pagination, and returns only
`items`, `total`, `page`, `pageSize`, `rowNumber`, `plannedAction`, `status`,
`safeCode`, and `targetType`.

Step 78C kept Web import history aggregate-only. Web does not call
`/api/import-jobs/:id/items`, does not add an API client method, and does not
display row-level item tables, drawers, lists, debug panels, raw JSON, export,
copy controls, or business-object drilldown.

Step 78D completed local synthetic backend-only acceptance for the read API.
The host-shell helper was correctly blocked by `DATABASE_URL_NOT_SET` and was
not counted as PASS. Local Docker API/DB synthetic acceptance passed after a
local rebuild/restart and local migration deploy. This is local synthetic
backend-only evidence only; it is not production/VPS, production DB, real
import, real-data, or production-readiness evidence.

Step 78E archived the read delivery line as backend-only and aggregate-Web.

### Step 79A-C - Production Read-Only Preflight Documentation

Step 79A created
`memory-bank/import-job-item-production-readonly-preflight-runbook.md` as a
future production read-only preflight reference. It covers migration status,
`import_job_items` table structure, absence of JSON/raw row-value fields,
foreign-key and no-cascade checks, GET-only item API behavior, response
allowlist verification, and Web aggregate-only checks.

Step 79B linked that runbook from `deploy/runbook-production.md` and
`deploy/checklist-production-cutover.md`, while distinguishing it from the
aggregate `ImportJob` / `ImportRun` production preflight runbook.

Step 79C archived the production preflight documentation line. The reference
exists, but it has not been executed. It is not production readiness evidence
and does not authorize production/VPS access, production DB access, migration
execution, DB writes, real import, Web row-level display, export/download,
cleanup/rollback/retry/delete, raw JSON/raw CSV access, or credential reads.

## Current Supported State

- Department successful import apply paths write `ImportJobItem` rows.
- Achievement successful import apply paths write `ImportJobItem` rows.
- User account successful import apply paths write `ImportJobItem` rows.
- Backend-only item read API exists at `GET /api/import-jobs/:id/items`.
- Local synthetic backend-only acceptance passed in Step 78D.
- Production read-only preflight reference exists.
- Production read-only preflight has not been executed.

## Current Unsupported And Unauthorized State

The following remain unsupported and unauthorized:

- Web row-level display.
- `targetId` exposure outside internal persistence.
- Global `/import-job-items` route.
- Retry, delete, cleanup, rollback, or repair behavior.
- Download, export, raw JSON, or raw CSV access.
- Business-object drilldown from item rows.
- Production/VPS access.
- Production DB access.
- Migration execution as part of docs.
- Real import execution.
- Real-data use.
- Existing untracked local artifact cleanup or handling.

## Safe Field Boundaries

Persistence allowlist:

- `jobId`
- `runId`
- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`
- internal-only `targetId`

API response allowlist:

- `items`
- `total`
- `page`
- `pageSize`
- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`

## Forbidden Fields And Content

`ImportJobItem` persistence, API responses, logs, evidence, Web display, export
surfaces, and future documentation must not include:

- raw CSV
- row values
- email
- employeeNo
- name
- departmentCode
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
- safeSummary
- auditLogIds
- fingerprints
- hashes
- operator ids
- targetId outside internal persistence
- jobId/runId in item API responses
- raw production sample ids
- raw item ids
- personal identifiers
- achievement identifiers
- account identifiers

## Future Route

If Web row-level UI is needed, it must start with a new separately authorized
Step and a Web UI plan before implementation. That plan must re-justify the
privacy/product boundary and may consider only `rowNumber`, `plannedAction`,
`status`, `safeCode`, and `targetType`.

If production preflight execution is needed, it must start with a new
separately authorized Step. Before any check begins, that Step must confirm
backup evidence, safe evidence boundaries, operator authorization, and the rule
that no credentials, connection strings, raw sample ids, item ids, source
values, raw CSV, personal identifiers, achievement identifiers, or account
identifiers will be recorded.

If existing untracked local artifacts need cleanup, that must be handled in a
separate safety audit/handling Step. Step 80A does not touch, stage, clean,
move, delete, or classify those artifacts beyond reporting their presence.

## Step 80A Verification Boundary

Step 80A is docs-only. Runtime tests, typecheck, build, service startup,
browser checks, database checks, migration checks, production checks, and
runbook execution are intentionally not run because this Step changes only
memory-bank documentation.

The required verification for Step 80A is limited to diff checks, status checks,
and manual diff review confirming docs-only changes, no sensitive values, no
raw CSV, no personal identifiers, no credentials or connection strings, no
production access authorization, no migration execution authorization, no DB
write authorization, no Web row-level display authorization, and no `targetId`
exposure authorization.

## Closure

Step 80A closes the `ImportJobItem` row-level safe history historical archive
from Step 76A through Step 79C. The stable current position is:

- safe persistence exists for Department, Achievement, and User account success
  paths;
- backend-only allowlisted reads exist;
- Web remains aggregate-only;
- local synthetic backend-only acceptance passed;
- production read-only preflight documentation exists but is not executed;
- production access, real imports, migration execution, Web row-level display,
  target-id exposure, export/download, cleanup/rollback/retry/delete, raw data
  access, and business-object drilldown remain out of scope until separately
  authorized.
