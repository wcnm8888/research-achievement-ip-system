# Import Job History Production Preflight Final Archive

Date: 2026-07-05

## Scope

This archive closes the Step 75A through Step 75B documentation line for the
`ImportJob` / `ImportRun` production read-only preflight path.

This archive is documentation-only. It does not execute the runbook, access
production/VPS, access a production database, read `.env` or `.env.production`,
start services, run browser automation, run migrations, run import apply, change
permissions, write to the database, or change runtime/API/Web/schema/migration/
package/lockfile/config files.

## Completed Work

Step 75A added:

- `memory-bank/import-job-history-production-readonly-preflight-runbook.md`.

The runbook defines a production read-only preflight reference path for:

- `ImportJob`;
- `ImportRun`;
- import-history list and detail API readiness;
- `system:config` permission confirmation;
- Web read-only visibility for page-local import history entries and the
  settings/system overview;
- safe evidence and stop-condition handling.

Step 75B linked the Step 75A runbook from:

- `deploy/runbook-production.md`;
- `deploy/checklist-production-cutover.md`.

The Step 75B links improve discoverability from the production runbook/checklist
without turning the runbook into an execution step.

## Established Boundaries

The archived documentation line establishes that the import history production
preflight runbook is a read-only preflight reference.

It is not:

- production apply authorization;
- production/VPS access authorization;
- production database access authorization;
- migration execution authorization;
- DB write authorization;
- permission change authorization;
- real-data import authorization;
- retry, delete, cleanup, rollback, download, or export authorization.

The runbook must not be used to paste or record `DATABASE_URL`, passwords,
tokens, cookies, connection strings, credentials, raw production sample ids, raw
audit ids, raw CSV, personal identifiers, raw request headers, user agents, IP
addresses, raw exception bodies, or raw production JSON payloads into chat,
documentation, logs, screenshots, commits, or memory-bank evidence.

## Preflight Coverage

The read-only preflight reference covers:

- backup confirmation before any further production check;
- migration state confirmation without executing migrations;
- `ImportJob` / `ImportRun` table-structure presence without changing tables;
- `system:config` permission confirmation without granting or editing
  permissions;
- API health;
- `GET /api/import-jobs`;
- conditional `GET /api/import-jobs/:id` only when a safe sample alias is
  separately authorized;
- Department, User/account, and Achievement page-local import history entries;
- settings/system import history overview visibility;
- safe evidence rules;
- stop conditions for unknown migration state, unconfirmed backup, unclear
  permission boundary, failed API health, sensitive API fields, forbidden Web
  controls, unclear detail sample authorization, credential-paste requests, and
  any requested write or mutation behavior.

## Follow-Up Recommendations

- Real execution of the production read-only preflight must be a separate,
  explicitly authorized Step.
- Any real-environment acceptance must be a separate Step with its own
  authorization, operator boundary, safe evidence plan, and stop conditions.
- Do not paste `DATABASE_URL`, passwords, tokens, cookies, connection strings,
  credentials, raw sample ids, raw audit ids, raw CSV, or personal identifiers
  into chat, documentation, logs, screenshots, commits, or memory-bank evidence.
- If production preflight is later authorized, record only aggregate status,
  counts, HTTP status, safe machine codes, and de-identified pass/fail summaries.

## Closure

Step 75C closes the import task history production read-only preflight
documentation line. The line is ready as reference material for a later,
separately authorized production read-only preflight, but it is not itself
production readiness evidence, production access approval, migration approval,
production apply approval, or real-environment acceptance.
