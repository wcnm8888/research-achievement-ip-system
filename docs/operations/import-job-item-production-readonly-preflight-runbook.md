# ImportJobItem Production Readonly Preflight Runbook

Date: 2026-07-05

## Step 79A Scope

- Purpose: define a production read-only preflight plan for `ImportJobItem`
  row-level safe history before any later production-readiness claim.
- This runbook is documentation-only. It does not perform or authorize
  production access, VPS access, production DB access, migration execution,
  real import execution, DB writes, Web row-level display, export/download,
  cleanup, rollback, retry, permission changes, credential reads, `.env` /
  `.env.production` reads, runtime changes, API changes, Web changes, schema
  changes, migration-file changes, package changes, lockfile changes, or config
  changes.
- This runbook must be executed only by an explicitly authorized human/operator
  in a separate production-readiness step. Step 79A itself is not that
  authorization.

## Current Capability Baseline

The current `ImportJobItem` capability line is:

- Step 77A-D: `ImportJobItem` schema plus three success-path writers for
  Department, Achievement, and User account imports.
- Step 78B: backend-only `GET /api/import-jobs/:id/items`.
- Step 78C: Web import history remains aggregate-only.
- Step 78D: local synthetic backend-only acceptance only.

Step 78D local acceptance is not production, VPS, production DB, real import,
real-data, or production-readiness evidence.

## Preflight Objectives

Use this runbook only to plan a future read-only production preflight that
verifies:

- migration status for `20260705120000_add_import_job_items`;
- `import_job_items` table structure exists;
- the item API route is reachable as GET-only;
- the item API response fields match the response allowlist;
- Web does not call or display row-level item history.

## Required Precondition: Backup Confirmation

Backup evidence must be confirmed before any production preflight check
continues.

Record only redacted status such as:

- `backupConfirmed=true/false`;
- redacted backup scope category;
- restore-readiness safe machine code.

Stop if backup evidence is not confirmed, is ambiguous, is expired, or requires
pasting credentials, paths containing secrets, database URLs, tokens, cookies,
passwords, private keys, or connection strings.

## Migration Status Check

Confirm only through an approved read-only migration-status mechanism or
operations dashboard:

- migration `20260705120000_add_import_job_items` is applied;
- migration status is known and consistent with the deployed application
  version.

Do not run:

- migration deploy;
- migration apply;
- migration reset;
- migration repair;
- seed;
- backfill;
- schema mutation.

Safe evidence:

- migration name;
- applied/not-applied/unknown safe code;
- timestamp or version marker only if already redacted by the approved channel.

Stop if migration state is unknown, the migration is missing, status requires a
write command to inspect, or anyone proposes applying a migration from this
runbook.

## DB Structure Readonly Check

Confirm through read-only schema metadata inspection, approved ORM metadata, or
an operations-owned DB metadata view:

- `import_job_items` table exists;
- persisted columns are limited to the accepted `ImportJobItem` structural and
  safe-fact allowlist: id, `job_id`, `run_id`, `row_number`,
  `planned_action`, `status`, `safe_code`, `target_type`, and internal-only
  `target_id` if present from the accepted Step 77A schema;
- no JSON or JSON-like row-values field exists;
- no raw CSV or imported source-value columns exist;
- foreign keys point to `import_jobs` and `import_runs`;
- foreign keys do not introduce cascade delete semantics;
- the application invariant remains that an item `run_id` belongs to the same
  parent job as item `job_id`.

Safe evidence:

- `import_job_items present=true/false`;
- allowlist status safe code;
- JSON/raw-value column absence safe code;
- FK target safe code;
- cascade-delete absence safe code.

Do not record connection strings, raw SQL output containing sensitive context,
table data, real row ids, real job ids, real run ids, raw item ids, source row
values, or production sample identifiers.

## API Readonly Check

Check only the backend route:

```text
GET /api/import-jobs/:id/items
```

Expected API behavior:

- route is GET-only for this preflight;
- authorized access requires `system:config`;
- no permission or insufficient permission returns HTTP 403;
- missing, unreadable, or non-existent parent job returns HTTP 404;
- an existing readable parent with no item rows may be checked safely and should
  return an empty list;
- if there is no explicitly safe production sample, skip real item-data reads
  rather than forcing a query against real rows.

Do not run POST, PATCH, PUT, DELETE, import apply, retry, cleanup, rollback,
download, export, raw JSON capture, or business-object drilldown checks from
this runbook.

Safe evidence:

- HTTP status;
- empty-list status if checked;
- allowlist-pass safe code;
- skipped reason such as `NO_SAFE_SAMPLE`;
- 403 and 404 behavior safe codes.

## Response Field Allowlist

Allowed top-level response fields:

- `items`
- `total`
- `page`
- `pageSize`

Allowed item fields:

- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`

Forbidden in responses, evidence, logs, screenshots, exports, copy controls, or
Web display:

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
- `safeSummary`
- `auditLogIds`
- fingerprints
- hashes
- operator ids
- tokens, cookies, passwords, private keys, connection strings, or equivalent
  secret material.

Stop immediately if the API response includes any forbidden field or source
value.

## Web Readonly Check

Production Web must remain aggregate-only:

- aggregate/list/detail import history may remain visible according to the
  existing `system:config` boundary;
- Web must not call `/api/import-jobs/:id/items`;
- Web must not add or expose an item table, drawer, list, row-detail view, or
  debug panel;
- Web must not provide download, export, raw JSON, copy, or business-object
  drilldown for item rows.

Safe evidence:

- aggregate/list/detail visibility summary;
- absence of `/api/import-jobs/:id/items` call if an authorized read-only
  network observation is performed;
- absence of item table/drawer/list/debug panel;
- absence of download/export/raw JSON/copy/drilldown controls.

Do not capture screenshots or network payloads that contain production data,
personal identifiers, source identifiers, raw headers, cookies, sessions, IP
addresses, or user agents.

## Stop Conditions

Stop the preflight immediately if any of the following occurs:

- backup is not confirmed;
- migration state is unclear;
- migration `20260705120000_add_import_job_items` is missing or unknown;
- checking status requires migration deploy/apply/reset/repair;
- `import_job_items` shape is missing, unknown, or contains forbidden raw-value
  fields;
- API route is not GET-only for this check;
- `system:config` boundary cannot be confirmed;
- API response contains any forbidden field;
- Web calls or displays row-level item history;
- a check requires a real import, real data repair, DB write, retry, delete,
  cleanup, rollback, download, or export;
- anyone asks to paste `DATABASE_URL`, passwords, tokens, cookies, connection
  strings, private keys, `.env` contents, raw sample ids, or raw production data.

After stopping, record only a safe stop code and redacted summary. Do not
remediate from this runbook.

## Explicit Non-Authorization

Step 79A and this runbook do not authorize:

- production access;
- production DB access;
- VPS access;
- migration execution;
- migration deploy/apply/reset/repair;
- real import;
- DB write;
- Web row-level display;
- export/download;
- raw JSON capture;
- source CSV inspection;
- retry/delete/cleanup/rollback;
- credential, token, cookie, password, connection-string, or `.env` reads.

## Safe Evidence Template

Use this template only in a future separately authorized execution step. Leave a
field as `not checked` when skipped.

```text
Runbook:
Execution date:
Operator role category:
Authorization reference:
Backup evidence confirmed:
Backup scope category:
Migration 20260705120000_add_import_job_items status:
Migration status source safe code:
import_job_items table presence:
Column allowlist status:
JSON/raw-value field absence:
FK import_jobs status:
FK import_runs status:
Cascade delete absence:
system:config confirmation:
GET /api/import-jobs/:id/items HTTP status:
No-permission HTTP status:
Missing/unreadable job HTTP status:
Empty-list check status:
Item-data sample status:
Response allowlist code:
Forbidden fields observed:
Web aggregate-only status:
Web item route call observed:
Web item UI observed:
Download/export/raw JSON/copy/drilldown controls observed:
Sensitive evidence observed:
Stop condition:
Final preflight result:
```

Template rules:

- Do not paste raw API responses.
- Do not paste raw production SQL output.
- Do not paste production table data or sample ids.
- Do not paste screenshots containing production data or identifiers.
- Do not paste headers, cookies, tokens, sessions, IPs, user agents, stack
  traces, database URLs, passwords, private keys, or exception bodies.
- Use safe machine codes and aggregate pass/fail summaries instead of raw data.

## Step 79A Closure Boundary

Step 79A creates this runbook only. It does not execute the runbook, access
production, inspect a production database, read secrets, start services, run
browser automation, perform migrations, run import apply, or modify runtime
code.
