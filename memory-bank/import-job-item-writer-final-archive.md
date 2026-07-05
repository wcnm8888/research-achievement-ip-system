# ImportJobItem Writer Final Archive

## Purpose

Step 77E archives the Step 77A-D `ImportJobItem` row-level safe history delivery line.

This archive is documentation-only. It does not authorize backend read DTOs, API routes/controllers, Web UI, migration apply/deploy/reset, database access, production/VPS access, production DB access, `.env` / `.env.production` reads, real import execution, real data writes, seed, backfill, fixture rows, retry/delete/cleanup/rollback/download/export behavior, or handling existing untracked local artifacts.

## Delivered Scope

### Step 77A - Schema And Migration

- Added the `ImportJobItem` Prisma schema.
- Added the additive migration for `import_job_items`.
- Added item-specific enums and required relations to `ImportJob` and `ImportRun`.
- Kept item fields limited to the approved allowlist.
- Did not execute migration apply, deploy, or reset.

### Step 77B - Department Writer

- Added Department `CREATE_ONLY` success-path item writing.
- Rows are written with `plannedAction: CREATE`, `status: APPLIED`, and `targetType: DEPARTMENT`.
- Rejected, failed, replayed success, and in-progress paths do not write item rows.

### Step 77C - Achievement Writer

- Added Achievement `CREATE_DRAFT_ONLY` success-path item writing.
- Covered `PAPER`, `SOFTWARE_COPYRIGHT`, and `PATENT`.
- Rows are written with `plannedAction: CREATE_DRAFT`, `status: APPLIED`, and `targetType: ACHIEVEMENT`.
- `achievementType` is not duplicated on `ImportJobItem`; it remains inherited from `ImportJob`.
- Rejected, failed, replayed success, and in-progress paths do not write item rows.

### Step 77D - User Account Writer

- Added User account `CREATE_ONLY_PENDING_NO_CREDENTIAL` success-path item writing.
- Rows are written with `plannedAction: CREATE_PENDING_USER`, `status: APPLIED`, and `targetType: USER`.
- Rejected, failed, replayed success, and in-progress paths do not write item rows.

## Common Writer Boundary

- Item rows are written only for `RUNNER` + successful `EXECUTED` paths.
- Item writes occur in the same Prisma transaction as business object creation, audit writes, and `ImportRun` / `ImportJob` success updates.
- Repositories inject `jobId` and `runId` from the success input.
- Item sub-inputs do not accept `jobId` or `runId`.
- Rejected, failed, replayed success, and in-progress paths do not write item rows.

## Persisted Field Allowlist

`ImportJobItem` persistence is limited to:

- `jobId`
- `runId`
- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`
- `targetId`

## Forbidden Content

`ImportJobItem` must not store raw CSV, row values, email, `employeeNo`, names, department codes, roles, titles, DOI, registration numbers, patent numbers, contributors, credentials, invites, passwords, `safeSummary`, `auditLogIds`, connection strings, or any equivalent raw source/imported values.

## targetId Boundary

`targetId` remains internal-only persistence. It must not enter DTOs, API responses, Web UI, logs, evidence examples, exports, copyable fields, or business-object drilldown.

## Non-Authorized Surfaces

Step 77A-D completed schema/migration-only plus three success-path backend writers. The following remain unauthorized until separate Steps approve them:

- Backend read DTOs.
- Backend read APIs.
- Web row-level history.
- Migration apply/deploy/reset.
- Database or production access.
- Real import execution or real-data writes.
- Retry, delete, cleanup, rollback, download, or export behavior.

## Suggested Next Steps

- Step 78A: backend read DTO plan, docs-only.
- Step 78B: backend read DTO/API implementation, only if the Step 78A plan is accepted.
- Step 78C: Web row-level read plan, or an explicit decision to remain aggregate-only.
- Step 78D: local synthetic acceptance, only if later read/API/Web implementation requires it.

## Verification Boundary

Step 77E does not rerun runtime tests, typecheck, or build because it is docs-only and does not change runtime code, Prisma schema, API/Web files, package files, lockfiles, or config.
