# ImportJobItem Production Preflight Final Archive

Date: 2026-07-05

## Scope

This archive closes the Step 79A through Step 79B documentation line for the
`ImportJobItem` production read-only preflight reference path.

This archive is documentation-only. It does not execute the runbook, access
production/VPS, access a production database, read `.env` or `.env.production`,
start services, run browser automation, run migrations, run import apply, write
to the database, change permissions, open Web row-level display, export,
download, cleanup, rollback, or change runtime/API/Web/schema/migration/
package/lockfile/config files.

## Completed Work

Step 79A added:

- `memory-bank/import-job-item-production-readonly-preflight-runbook.md`.

The runbook defines a production read-only preflight reference path for:

- migration status for `20260705120000_add_import_job_items`;
- `import_job_items` table-structure presence and allowlist-only shape;
- absence of JSON/raw row-value fields;
- foreign-key targets to `import_jobs` and `import_runs` without cascade delete
  semantics;
- GET-only `GET /api/import-jobs/:id/items` behavior;
- response allowlist verification;
- Web aggregate-only boundary checks.

Step 79B linked the Step 79A runbook from:

- `deploy/runbook-production.md`;
- `deploy/checklist-production-cutover.md`.

The Step 79B links improve discoverability from the production runbook/checklist
without turning the runbook into an execution step.

## Boundary Distinction

The existing import-history production preflight runbook remains scoped to
aggregate import history:

- `memory-bank/import-job-history-production-readonly-preflight-runbook.md`
  covers `ImportJob` / `ImportRun` aggregate history readiness.

The new `ImportJobItem` runbook is separate:

- `memory-bank/import-job-item-production-readonly-preflight-runbook.md` covers
  `ImportJobItem` row-level safe history readiness only.

Local synthetic backend-only acceptance from Step 78D must not be extrapolated
to production readiness. It is not production/VPS, production DB, real import,
real-data, or production-readiness evidence.

## Established Boundaries

The archived documentation line establishes that the `ImportJobItem` production
preflight runbook is read-only reference material.

It does not authorize:

- production/VPS access;
- production DB access;
- migration execution;
- DB writes;
- real import;
- production-readiness claims;
- Web row-level display;
- export or download;
- retry, delete, cleanup, or rollback;
- raw JSON capture;
- source CSV inspection;
- credential, token, cookie, password, private-key, connection-string, or
  `.env` reads.

The runbook must not be used to paste or record:

- `DATABASE_URL`;
- passwords;
- tokens;
- cookies;
- connection strings;
- private keys;
- `.env` or `.env.production` contents;
- raw production sample ids;
- raw item ids;
- `targetId`;
- `jobId`;
- `runId`;
- raw CSV;
- personal identifiers;
- achievement identifiers;
- account identifiers;
- credentials or equivalent secret material.

## Preflight Coverage

The read-only preflight reference covers only:

- backup confirmation before further production checks;
- read-only migration-state confirmation for
  `20260705120000_add_import_job_items`;
- read-only `import_job_items` table-structure confirmation;
- read-only confirmation that no JSON/raw row-value fields exist;
- read-only FK and no-cascade-delete confirmation;
- GET-only `GET /api/import-jobs/:id/items` checks under `system:config`;
- 403 behavior without `system:config`;
- 404 behavior for missing/unreadable parent jobs;
- safe empty-list checks;
- response allowlist verification for `items`, `total`, `page`, `pageSize`,
  `rowNumber`, `plannedAction`, `status`, `safeCode`, and `targetType`;
- Web aggregate-only checks confirming no call to
  `/api/import-jobs/:id/items` and no item table/drawer/list/debug panel.

The preflight reference explicitly excludes migration execution, real imports,
data repair, DB writes, Web row-level display, export/download, retry/delete/
cleanup/rollback, raw item-data sampling without an explicitly safe authorized
sample, and any credential handling.

## Future Work

Real execution of the production read-only preflight must be a new separately
authorized Step.

That future Step must first confirm:

- backup evidence is available and safe to reference;
- operator authorization is explicit;
- evidence boundaries are accepted before any check begins;
- no credentials, connection strings, raw sample ids, item ids, source values,
  raw CSV, personal identifiers, achievement identifiers, or account identifiers
  will be recorded.

If any future production preflight needs real item rows, it must use a separately
approved safe sample alias. If no safe sample exists, item-data reads must be
skipped rather than improvised.

## Closure

Step 79C closes the `ImportJobItem` production read-only preflight documentation
line. The line is ready as reference material for a later separately authorized
production read-only preflight, but it is not itself production readiness
evidence, production access approval, production DB approval, migration
approval, DB write approval, Web row-level display approval, export/download
approval, or real-environment acceptance.
