# ImportJobItem Safe History Plan

Date: 2026-07-05

Scope: Step 76A docs-only privacy and field-boundary plan for a possible
future `ImportJobItem` row-level safe history model.

This document does not authorize Prisma schema changes, migrations, runtime API
changes, Web changes, package or lockfile changes, service startup, database
access, production/VPS access, production DB access, `.env` or
`.env.production` reads, import apply execution, retry, cleanup, delete,
rollback, download, export, or row-level Web display.

## Why ImportJobItem Stayed Deferred

`ImportJobItem` has remained deferred since the first import job history model
because row-level persistence sits closest to source spreadsheet or CSV content.
`ImportJob` and `ImportRun` can already explain the accepted first-slice
behaviors with aggregate counts, safe statuses, safe summary codes, replay
status, in-flight status, and failure-stage evidence. They do not require
persisting one record per imported row.

The first accepted import history line intentionally stores:

- logical request history in `ImportJob`;
- attempt history in `ImportRun`;
- aggregate counts and safe machine codes only;
- no row-level persisted `ImportJobItem`.

Row-level history needs a separate privacy review because a careless row item
could reconstruct input files, expose business identifiers, reveal people data,
or turn history pages into a searchable index of imported values.

## Global Row-Level Field Allowlist

If a later schema step is explicitly authorized, `ImportJobItem` may only be
planned from this allowlist:

| Field | Boundary |
| --- | --- |
| `jobId` | Required internal relation to `ImportJob`; not a user-facing business identifier. |
| `runId` | Required internal relation to the `ImportRun` attempt that produced the row outcome. |
| `rowNumber` | Allowed only as a numeric source-row ordinal for support correlation; no row values or cell excerpts. |
| `plannedAction` | Allowed only as an enum-like machine action such as create, create pending user, create draft, skip, or blocked. |
| `status` | Allowed only as a row outcome enum-like machine status; no human-entered reason text. |
| `safeCode` | Allowed only as an approved machine code from the import validation/result code allowlist. |
| `targetType` | Allowed only as a coarse internal target category, for example department, user, or achievement. |
| `targetId` | Optional internal created-target id after creation; internal diagnostics only and never displayed in Web. |

No other row-level fields are approved by this plan.

## Globally Forbidden Row-Level Values

A future `ImportJobItem` must not store or expose:

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
- contributor names;
- owner names;
- raw identifiers;
- normalized identifiers;
- credential, session, token, cookie, password, private key, connection string,
  `.env`, storage key, mail payload, request header, user agent, IP address, or
  raw exception values.

The prohibition covers persisted columns, JSON payloads, API DTOs, logs,
screenshots, memory-bank evidence, and Web display.

## Family-Specific Safe Boundaries

The per-family rule is to inherit family, mode, and achievement type from
`ImportJob` whenever possible. `ImportJobItem` should not duplicate source
business identifiers or row values to make filtering easier.

| Import family | Allowed row-level safety fields | Forbidden family-specific row data |
| --- | --- | --- |
| `DEPARTMENT` / `CREATE_ONLY` | Global allowlist only. `targetType` may be the internal department target category. `plannedAction` may describe create, skip, or blocked by machine code. `targetId` may exist only after creation as an internal id. | Department names, department codes from the row, hierarchy labels, manager names, descriptions, source cell values, or any raw/normalized business identifier. |
| `USER_ACCOUNT` / `CREATE_ONLY_PENDING_NO_CREDENTIAL` | Global allowlist only. `targetType` may be the internal user target category. `plannedAction` may describe pending-user creation, skip, or blocked by machine code. `targetId` may exist only after creation as an internal id. | Email, employee number, user name, phone, department name/code, role names from the row, invite/reset/lifecycle token data, credential/session/mail payload data, or any account identity value. |
| `ACHIEVEMENT` / `CREATE_DRAFT_ONLY` with `PAPER` | Global allowlist only. `targetType` may be the internal achievement target category. `plannedAction` may describe draft creation, skip, or blocked by machine code. `targetId` may exist only after draft creation as an internal id. | DOI, title, abstract, author/contributor/owner names, owner email, journal/project metadata, source path, or any raw/normalized identifier. |
| `ACHIEVEMENT` / `CREATE_DRAFT_ONLY` with `SOFTWARE_COPYRIGHT` | Global allowlist only, using the same achievement target boundary as above. | Software registration number, title, owner/contributor names, owner email, project metadata, source path, or any raw/normalized identifier. |
| `ACHIEVEMENT` / `CREATE_DRAFT_ONLY` with `PATENT` | Global allowlist only, using the same achievement target boundary as above. | Patent application number, patent grant number, title, inventor/owner/contributor names, owner email, fee/reminder fields, source path, or any raw/normalized identifier. |

## Field Decisions

- `rowNumber`: allowed as a number only. It is useful for operator support but
  must not be paired with row values in stored history or Web UI.
- `plannedAction`: allowed as a closed machine value only. It must not contain
  free-text explanations or input-derived values.
- `status`: allowed as a closed machine value only.
- `safeCode`: allowed as a machine code only. It must not include raw values in
  the code, message, or parameters.
- `targetType`: allowed as a coarse internal category only.
- `targetId`: allowed only as an internal id after target creation. It must not
  be shown in Web row-level UI, used as a business drilldown affordance, exposed
  as a copyable value, or treated as an external reference.

## Relationship To ImportJob And ImportRun

`ImportJob` remains the logical import request and owns family, mode, optional
achievement type, safe file fingerprint, scope hash, idempotency status,
aggregate counts, latest-run status, and safe summaries.

`ImportRun` remains the attempt ledger and owns attempt number, trigger, run
status, failure stage, safe run summary, audit count/reference handling, and
transaction-completion evidence.

A future `ImportJobItem` would be a child row-level safe outcome ledger for one
`ImportRun` inside one `ImportJob`. It must not become:

- the source of truth for business objects;
- a replay or rollback instruction set;
- a replacement for `ImportRun` safe summaries;
- a CSV reconstruction cache;
- a Web drilldown index over imported row values.

Aggregate counts in `ImportJob` / `ImportRun` must remain authoritative for the
currently accepted Web history surfaces.

## Web Boundary

Current Web import history remains aggregate-only:

- list views show safe aggregate/status fields;
- detail views show sanitized safe summaries, run metadata, audit count, and
  plain-language replay/in-flight/rejected/failed explanations;
- settings/system overview remains a secondary read-only aggregate index.

Row-level Web detail remains deferred. This Step does not authorize row-level
API responses, row-level drawers, row-level tables, business-object drilldown,
target-id display, CSV download, export, raw JSON copy, retry, cleanup, delete,
rollback, or bulk actions.

If row-level Web is ever planned, it must have its own Web plan and acceptance
criteria after schema and backend privacy boundaries are accepted.

## Future Step Split

Recommended future slices, each separately authorized:

1. Schema plan: define `ImportJobItem` enum fields, relations, indexes,
   retention, and privacy constraints without writing a migration.
2. Backend implementation: add schema/migration and backend write/read behavior
   only after the schema plan is accepted, with tests proving the allowlist and
   forbidden-field exclusions.
3. Web plan: design whether any row-level aggregate or row-number-only support
   view is justified; keep target ids internal and keep row values forbidden.
4. Acceptance: run local synthetic acceptance, sensitive-field scans, DTO
   allowlist tests, and manual diff review before any production-readiness
   discussion.

Production/VPS execution, production DB reads, real-data import, real row-level
sample capture, and production Web acceptance remain separately blocked until
explicitly authorized.

## Acceptance Criteria For This Plan

- The plan explains why `ImportJobItem` stayed deferred.
- Every supported import family has an explicit row-level safe-field boundary.
- Raw CSV, row values, email, employee number, DOI, registration number, patent
  number, title, and personnel names are forbidden.
- `rowNumber`, `plannedAction`, `status`, `safeCode`, and `targetType` are
  allowed only as safe machine/ordinal fields.
- `targetId` is internal only and not a Web display field.
- `ImportJobItem` is positioned as a child of `ImportJob` and `ImportRun`, not
  as a replacement for aggregate history.
- Web remains aggregate-only and row-level detail remains deferred.
- Future work is split into schema plan, backend implementation, Web plan, and
  acceptance steps.
