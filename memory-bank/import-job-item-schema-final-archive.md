# ImportJobItem Schema Final Archive

Date: 2026-07-05

Scope: Step 76D documentation-only final archive for the Step 76C
`ImportJobItem` schema and migration plan.

This archive is a safety design reference only. It does not authorize changing
`prisma/schema.prisma`, generating a migration, modifying backend/API/Web/
runtime/package/lockfile/config/script files, starting services, accessing any
database, accessing production/VPS, reading `.env` or `.env.production`,
executing migration/import/apply, retry, delete, cleanup, rollback, download,
export, row-level API, row-level Web display, `targetId` display, or
business-object drilldown.

## Archived Completed Work

Step 76C completed `memory-bank/import-job-item-schema-plan.md` as a docs-only
future schema/migration design for `ImportJobItem`.

Archived Step 76C scope:

- relationship model for a future `ImportJobItem` under `ImportJob` and
  `ImportRun`;
- field candidates limited to the Step 76A safe allowlist;
- enum candidates for `plannedAction`, item `status`, and narrow `targetType`;
- index and constraint plan for `jobId`, `runId`, `jobId + rowNumber`,
  `runId + rowNumber`, and optional safe diagnostics;
- conservative relation behavior with `onDelete: Restrict`;
- additive migration, no backfill, no seed, and no business-table changes;
- explicit rejection of JSON row-value storage;
- `targetId` internal-only boundary;
- required future implementation split.

## Deferred Position

`ImportJobItem` remains deferred.

Step 76C and Step 76D are not:

- Prisma schema authorization;
- migration authorization;
- backend writer authorization;
- backend read DTO authorization;
- Web plan or Web implementation authorization;
- database access authorization;
- production/VPS authorization;
- import apply authorization;
- acceptance execution.

Future work must not infer permission to create an `ImportJobItem` table, write
a migration, add API fields, expose Web row details, or run database/import work
from Step 76C or Step 76D.

## Allowed Future Field Boundary

Future `ImportJobItem` schema work may consider only the safe allowlist:

- `jobId`;
- `runId`;
- `rowNumber`;
- `plannedAction`;
- `status`;
- `safeCode`;
- `targetType`;
- optional internal-only `targetId`.

No other row-level data fields are archived as eligible by this Step.

## Forbidden Data Boundary

Future `ImportJobItem` work must not store or expose:

- JSON row values;
- raw CSV;
- CSV excerpts;
- original imported values;
- row cell values;
- email;
- employee number;
- `employeeNo`;
- DOI;
- software registration number;
- patent number;
- title;
- personnel names;
- contributor lists;
- owner names;
- raw identifiers;
- normalized identifiers;
- credential, session, token, cookie, password, private key, connection string,
  `.env`, storage key, mail payload, request header, user agent, IP address, or
  raw exception values.

The prohibition covers schema fields, JSON columns, migration fixtures, backend
DTOs, logs, evidence, screenshots, and Web display.

## Relationship And Migration Boundary

If a future schema/migration implementation is separately authorized, it must
preserve these Step 76C principles:

- `jobId` is a required relation to `ImportJob`.
- `runId` is a required relation to `ImportRun`.
- relations use `onDelete: Restrict`;
- cascade deletion of import history is not allowed;
- migration is additive;
- no backfill;
- no seed;
- no business-table changes;
- no JSON columns for row values;
- no production data or sample row data creation.

The application-level invariant remains: `ImportJobItem.runId` must point to an
`ImportRun` whose `jobId` matches `ImportJobItem.jobId`. If implementation is
later authorized, backend writer tests must prove that invariant.

## TargetId Boundary

`targetId` is internal-only.

It must not:

- enter Web DTOs;
- be displayed in Web;
- be copyable as a business field;
- become a link target;
- enable business-object drilldown from import history;
- be treated as an external reference.

## Required Future Split

Any continuation must be separately authorized and split into:

1. schema/migration implementation;
2. backend writer;
3. backend read DTO;
4. Web plan;
5. acceptance.

The Web remains aggregate-only until a separate Web plan and acceptance Step are
explicitly authorized.

## Closure

Step 76D archives Step 76C as a future schema/migration safety reference only.
It does not implement, authorize, or imply schema, migration, backend, API, Web,
database, production, or import execution work.
