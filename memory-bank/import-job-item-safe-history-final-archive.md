# ImportJobItem Safe History Final Archive

Date: 2026-07-05

Scope: Step 76B documentation-only archive for the Step 76A `ImportJobItem`
row-level safe history privacy and field-boundary plan.

This archive does not authorize Prisma schema changes, migrations, runtime API
changes, Web changes, package or lockfile changes, config changes, service
startup, database access, production/VPS access, production DB access, `.env`
or `.env.production` reads, migration execution, import apply, retry, cleanup,
delete, rollback, download, export, row-level API responses, row-level Web
display, target-id display, or business-object drilldown.

## Archived Completed Work

Step 76A completed `memory-bank/import-job-item-safe-history-plan.md` as a
docs-only privacy and field-boundary plan for a possible future
`ImportJobItem` capability.

The plan established:

- why `ImportJobItem` has remained deferred;
- the future safe-field allowlist;
- globally forbidden row-level values;
- family-specific boundaries for Department, User/account, and Achievement
  imports;
- `targetId` as internal-only;
- the relationship to `ImportJob` and `ImportRun`;
- the Web aggregate-only boundary;
- the required future Step split.

## Archived Safe Field Boundary

The only fields accepted by Step 76A for future planning are:

- `jobId`;
- `runId`;
- numeric `rowNumber`;
- machine `plannedAction`;
- machine `status`;
- machine `safeCode`;
- coarse `targetType`;
- optional internal-only `targetId` after creation.

These are planning boundaries only. They are not schema, migration, API DTO, or
Web implementation authorization.

## Archived Forbidden Field Boundary

Step 76A prohibits row-level storage or display of:

- raw CSV content;
- CSV excerpts;
- source row values;
- imported cell values;
- email;
- employee number;
- DOI;
- software registration number;
- patent application number;
- patent grant number;
- title;
- personnel names;
- contributor or owner names;
- raw identifiers;
- normalized identifiers;
- credential, session, token, cookie, password, private key, connection string,
  `.env`, storage key, mail payload, request header, user agent, IP address, or
  raw exception values.

The prohibition applies to persisted columns, JSON payloads, API DTOs, logs,
screenshots, memory-bank evidence, and Web display.

## Archived Family Boundary

Step 76A records that all import families inherit the global row-level
allowlist:

- Department `CREATE_ONLY` may use only the global allowlist and must not store
  department names, row department codes, hierarchy labels, manager names,
  descriptions, source cell values, or raw/normalized business identifiers.
- User/account `CREATE_ONLY_PENDING_NO_CREDENTIAL` may use only the global
  allowlist and must not store email, employee number, user name, phone,
  department name/code, role names from the row, invite/reset/lifecycle token
  data, credential/session/mail payload data, or account identity values.
- Achievement `CREATE_DRAFT_ONLY` for `PAPER`, `SOFTWARE_COPYRIGHT`, and
  `PATENT` may use only the global allowlist and must not store DOI,
  registration numbers, patent numbers, titles, abstracts, inventor/author/
  contributor/owner names, owner email, project metadata, fee/reminder fields,
  source paths, or raw/normalized identifiers.

Family, mode, and achievement type should be inherited from `ImportJob` where
possible instead of being duplicated on row items with source identifiers.

## Deferred Position

`ImportJobItem` remains deferred.

Step 76A is not a schema plan, migration plan, backend implementation plan, Web
plan, or acceptance result. Future work must not infer authorization to create a
table, write a migration, add API fields, expose Web row details, display
`targetId`, or drill into business objects from the Step 76A plan.

Current accepted import history surfaces remain aggregate-only:

- `ImportJob` is the logical request and aggregate summary record.
- `ImportRun` is the attempt ledger and safe run-summary record.
- Web list/detail and settings/system overview remain limited to safe aggregate
  fields, sanitized safe summaries, run metadata, audit counts, and
  user-understandable replay/in-flight/rejected/failed explanations.

## Required Future Step Split

If work continues, it must be split into separately authorized Steps:

1. Schema plan.
2. Backend implementation.
3. Web plan.
4. Acceptance.

Production/VPS execution, production DB reads, real-data import, real row-level
sample capture, and production Web acceptance remain blocked until separately
and explicitly authorized.

## Closure

Step 76B archives Step 76A as a privacy and field-boundary reference only. It
does not complete, authorize, or imply any `ImportJobItem` implementation.
