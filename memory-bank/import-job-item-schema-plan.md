# ImportJobItem Schema Plan

Date: 2026-07-05

Scope: Step 76C documentation-only schema and migration plan for a possible
future `ImportJobItem` row-level safe history table.

This document does not modify `prisma/schema.prisma`, does not generate a
migration, and does not authorize backend, API, Web, package, lockfile, config,
database, production/VPS, production DB, `.env` or `.env.production` reads,
migration execution, import apply, retry, cleanup, delete, rollback, download,
export, row-level API, row-level Web display, target-id display, or
business-object drilldown work.

## Design Inputs

The plan is constrained by Step 76A and Step 76B:

- `ImportJobItem` is still deferred.
- The field set must come only from the Step 76A allowlist.
- Step 76A and this schema plan are not implementation authorization.
- A future implementation must be split into schema/migration, backend writer,
  backend read DTO, Web plan, and acceptance steps.

Current schema context:

- `ImportJob` is the logical import request and aggregate summary record.
- `ImportRun` is the attempt ledger and safe run-summary record.
- `ImportRun.job` already uses `onDelete: Restrict`, preserving history instead
  of cascading deletion.

## Relationship Model

Future `ImportJobItem` should be a child safe outcome ledger row for one source
row outcome inside one run and one job.

Recommended relationships:

- `ImportJob.items`: one job has many item rows.
- `ImportRun.items`: one run has many item rows.
- `ImportJobItem.jobId`: required relation to `ImportJob`.
- `ImportJobItem.runId`: required relation to `ImportRun`.

Both relations should use `onDelete: Restrict`. Do not cascade-delete item
history when a job or run is deleted. In practice, delete operations for
`ImportJob`, `ImportRun`, and `ImportJobItem` should remain unsupported unless a
separate retention and legal deletion policy is approved.

Application-level invariant:

- `ImportJobItem.runId` must refer to an `ImportRun` whose `jobId` equals
  `ImportJobItem.jobId`.
- Prisma cannot express that cross-row invariant with a normal relation alone;
  backend writer tests must enforce it if implementation is later authorized.

## Field Candidate Allowlist

Only these fields are eligible for a future schema:

| Field | Candidate type | Notes |
| --- | --- | --- |
| `jobId` | `String @map("job_id") @db.Uuid` | Required relation to `ImportJob`. |
| `runId` | `String @map("run_id") @db.Uuid` | Required relation to `ImportRun`. |
| `rowNumber` | `Int @map("row_number")` | Numeric source-row ordinal only. |
| `plannedAction` | `ImportJobItemPlannedAction @map("planned_action")` | Closed machine enum only. |
| `status` | `ImportJobItemStatus` | Closed machine enum only. |
| `safeCode` | `String? @map("safe_code") @db.VarChar(120)` | Optional approved machine code only. |
| `targetType` | `ImportJobItemTargetType @map("target_type")` | Coarse internal target enum. |
| `targetId` | `String? @map("target_id") @db.Uuid` | Internal-only target id after creation; not exposed in Web DTOs. |

Do not add JSON fields to `ImportJobItem`. JSON fields create pressure to store
row values, row excerpts, validation details, or source identifiers. Row-level
safe history should remain strictly columnar and allowlisted.

Do not add family, mode, achievement type, file fingerprint, operator, raw
identifier, normalized identifier, name, title, contact, role, department,
contributor, fee, reminder, source path, CSV, or free-text fields. Family, mode,
and achievement type should be read through `ImportJob` when needed.

## Enum Candidates

### Planned Action

Candidate enum:

```prisma
enum ImportJobItemPlannedAction {
  CREATE
  CREATE_PENDING_USER
  CREATE_DRAFT
  SKIP
  BLOCK
}
```

Notes:

- Values are machine actions only.
- Do not encode row values, target ids, names, identifiers, or free text in enum
  values.
- If a future import mode adds update/merge/reactivation, expand this enum only
  in that separately authorized feature step.

### Item Status

Candidate enum:

```prisma
enum ImportJobItemStatus {
  PENDING
  APPLIED
  SKIPPED
  BLOCKED
  FAILED
}
```

Notes:

- `APPLIED` means the row outcome was included in an accepted run result.
- `BLOCKED` covers validation or safety rejection before business write.
- `FAILED` should be rare in the current all-or-nothing first-slice import
  model; it is kept as an item-level technical status only if a future backend
  writer can prove it does not imply partial success semantics.

### Target Type

Prefer a new import-item-specific enum over reusing broad audit or search target
types.

Candidate enum:

```prisma
enum ImportJobItemTargetType {
  DEPARTMENT
  USER
  ACHIEVEMENT
}
```

Reasoning:

- Reusing existing audit/search target type strings could accidentally widen the
  item table toward unrelated business-object drilldown semantics.
- A narrow enum keeps the row item table tied to the accepted import families.
- This enum is internal persistence metadata. It is not a Web filter contract
  and does not authorize target-id display.

## Candidate Prisma Shape

This is a documentation-only candidate. Do not paste it into
`prisma/schema.prisma` without a separately authorized schema/migration Step.

```prisma
model ImportJobItem {
  jobId         String                     @map("job_id") @db.Uuid
  runId         String                     @map("run_id") @db.Uuid
  rowNumber     Int                        @map("row_number")
  plannedAction ImportJobItemPlannedAction @map("planned_action")
  status        ImportJobItemStatus        @default(PENDING)
  safeCode      String?                    @map("safe_code") @db.VarChar(120)
  targetType    ImportJobItemTargetType    @map("target_type")
  targetId      String?                    @map("target_id") @db.Uuid

  job ImportJob @relation(fields: [jobId], references: [id], onDelete: Restrict)
  run ImportRun @relation(fields: [runId], references: [id], onDelete: Restrict)

  @@id([runId, rowNumber])
  @@index([jobId])
  @@index([runId])
  @@index([jobId, rowNumber])
  @@index([status])
  @@index([safeCode])
  @@index([targetType])
  @@map("import_job_items")
}
```

If implemented, add relation arrays to existing models in the same schema step:

```prisma
model ImportJob {
  items ImportJobItem[]
}

model ImportRun {
  items ImportJobItem[]
}
```

The relation-array snippets above are illustrative only; the actual schema step
must merge them into the existing `ImportJob` and `ImportRun` definitions.

## Index And Constraint Plan

Required:

- `@@index([jobId])` for job detail and aggregate support checks.
- `@@index([runId])` for run detail and writer verification.
- `@@index([jobId, rowNumber])` to group attempt-level outcomes for the same
  logical job row without preventing future multi-run history.
- `@@id([runId, rowNumber])` to provide table identity and prevent duplicate
  row outcome records per attempt without adding fields outside the Step 76A
  allowlist.

Recommended if read APIs are later authorized:

- `@@index([status])` if support tooling needs status-filtered item counts or
  internal diagnostics.
- `@@index([safeCode])` if safe machine-code triage is needed.
- `@@index([targetType])` only for internal aggregate diagnostics, not Web
  business-object drilldown.

Do not index `targetId` in the first item schema. Indexing `targetId` would
encourage business-object lookup and Web drilldown, which remain out of scope.
Add it only after a separately authorized internal diagnostics need proves it
will not be exposed through Web DTOs.

## Migration Strategy

If a future schema/migration Step is authorized:

- Use an additive migration only.
- Add enums and `import_job_items` table without changing business tables.
- Add relation arrays on `ImportJob` and `ImportRun` only as schema navigation.
- Use `onDelete: Restrict`.
- Do not backfill existing historical jobs or runs.
- Do not seed any item rows.
- Do not change existing `ImportJob` / `ImportRun` semantics.
- Do not create production data, import data, sample row data, or fixture rows.
- Do not add JSON columns.
- Do not add Web DTO fields in the schema step.

No-backfill is required because existing job/run summaries are already accepted
as aggregate history. Backfilling row-level records would require reconstructing
row outcomes and risks recreating sensitive source data.

## API And Web Boundary

`targetId` is internal-only:

- not returned by Web DTOs;
- not shown in Web;
- not copyable;
- not a link target;
- not usable for business-object drilldown from import history.

Future backend read DTOs, if authorized, should start with aggregate counts or
row-number-only support data. They must not expose row values, source
identifiers, JSON payloads, raw machine internals beyond approved safe codes, or
`targetId`.

Current Web import history remains aggregate-only. A Web row-level plan must be
separate and must not be inferred from this schema plan.

## Future Implementation Split

Required future split:

1. Schema/migration step: add enums/table/relations only, no writer, no read
   DTOs, no Web, no production execution.
2. Backend writer step: persist item rows from safe in-memory outcomes only,
   prove `jobId` / `runId` consistency, and test forbidden-field exclusion.
3. Backend read DTO step: design allowlisted internal/support read DTOs without
   `targetId`, row values, or source identifiers.
4. Web plan: decide whether any row-level view is justified; keep current Web
   aggregate-only until separately accepted.
5. Acceptance: run local synthetic acceptance, schema checks, DTO allowlist
   tests, sensitive-field scans, and manual diff review.

Production/VPS execution, production DB reads, real-data import, migration
execution, and production Web acceptance remain blocked until separately and
explicitly authorized.

## Acceptance Criteria For This Plan

- The relationship to `ImportJob` and `ImportRun` is defined.
- Candidate fields come only from the Step 76A allowlist.
- Planned action, item status, and target type enum candidates are documented.
- Indexes and constraints cover `jobId`, `runId`, `jobId + rowNumber`, `runId +
  rowNumber`, and optional `status` / `safeCode` queries.
- `onDelete` is conservative and does not cascade-delete history.
- Migration strategy is additive, no-backfill, and no-seed.
- `targetId` is internal-only and excluded from Web DTOs.
- JSON fields are explicitly rejected for row-level item storage.
- Future implementation is split into schema/migration, backend writer, backend
  read DTO, Web plan, and acceptance steps.
