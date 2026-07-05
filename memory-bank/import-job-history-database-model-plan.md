# Import Job History Database Model Plan

## Step 72B Scope

- Date: 2026-07-04.
- Purpose: refine the Step 72A import job history and idempotency plan into a database model and migration plan.
- This plan is documentation-only. It does not authorize Prisma schema changes, migrations, runtime/source/API/Web/package/lockfile/config/script changes, Docker/browser execution, apply API execution, database writes, production/VPS access, production DB/config access, `.env` / `.env.production` content reads, real-data import, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

Source context reviewed:

- `memory-bank/import-job-history-idempotency-plan.md`.
- `memory-bank/import-real-write-final-archive.md`.
- `memory-bank/import-real-write-readiness-review.md`.
- Step 72A section in `memory-bank/progress.md`.
- Step 72A section in `memory-bank/evidence.md`.
- `prisma/schema.prisma` read-only for existing enum/model/index/relation style.

## Model Decision Summary

The recommended first migration slice should add `ImportJob` and `ImportRun` together. `ImportJob` is the main logical request table and owns the idempotency key. `ImportRun` is required at the same time because retry, replay, timeout explanation, and failure-stage evidence are attempt-level facts. `ImportJobItem` remains deferred.

The minimum migration should:

- Add import-specific enums.
- Add `import_jobs`.
- Add `import_runs`.
- Avoid changes to existing `Department`, `User`, `Achievement`, achievement detail, contributor, audit log, workflow, attachment, fee, reminder, notification, search, and resource grant tables.
- Avoid foreign keys to business objects.
- Prefer only an optional operator reference and optional latest-run pointer.
- Avoid seed and backfill.
- Keep all JSON fields constrained by application code to safe summaries only.

## Enum Design

Recommended new enums:

```prisma
enum ImportFamily {
  DEPARTMENT
  USER_ACCOUNT
  ACHIEVEMENT
}

enum ImportMode {
  CREATE_ONLY
  CREATE_ONLY_PENDING_NO_CREDENTIAL
  CREATE_DRAFT_ONLY
}

enum ImportJobStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  REJECTED
}

enum ImportRunStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  REJECTED
}

enum ImportRunTrigger {
  INITIAL_SUBMIT
  RETRY_AFTER_FAILED
  OPERATOR_REPLAY_CHECK
}

enum ImportFailureStage {
  ACCEPTANCE
  VALIDATION
  TRANSACTION
  RESPONSE
  POST_APPLY_RECONCILIATION
}
```

Achievement import type should reuse the existing nullable `AchievementType` enum on `ImportJob.achievementType`. This avoids a second achievement-type enum drifting from the product model. It must be nullable because department and user/account jobs do not have an achievement type.

Do not add a persisted `REPLAYED_SUCCESS` status. Replay is a response disposition for a request that finds an existing `SUCCESS` job. The durable job stays `SUCCESS`.

Do not add a first-slice `MANUAL_REVIEW` or `NEEDS_RECONCILIATION` status unless a later implementation cannot keep business commit and job/run success update in the same transaction. The first implementation should avoid that ambiguous state by design.

## ImportJob Table

Recommended Prisma-style shape for a later schema Step:

```prisma
model ImportJob {
  id                 String          @id @default(uuid()) @db.Uuid
  idempotencyKeyHash String          @map("idempotency_key_hash") @db.VarChar(128)
  importFamily       ImportFamily    @map("import_family")
  mode               ImportMode
  achievementType    AchievementType? @map("achievement_type")
  targetEnvironment  String          @map("target_environment") @db.VarChar(64)
  scopeType          String          @map("scope_type") @db.VarChar(64)
  scopeHash          String          @map("scope_hash") @db.VarChar(128)
  fileFingerprint    String          @map("file_fingerprint") @db.VarChar(128)
  fileSizeBytes      Int?            @map("file_size_bytes")
  operatorUserId     String?         @map("operator_user_id") @db.Uuid
  status             ImportJobStatus @default(PENDING)
  latestRunId        String?         @map("latest_run_id") @db.Uuid
  acceptedRowCount   Int             @default(0) @map("accepted_row_count")
  createdBusinessCount Int           @default(0) @map("created_business_count")
  createdCompanionCount Int          @default(0) @map("created_companion_count")
  auditCount         Int             @default(0) @map("audit_count")
  warningCount       Int             @default(0) @map("warning_count")
  errorCount         Int             @default(0) @map("error_count")
  safeErrorCodes     Json?           @map("safe_error_codes")
  safeSummary        Json?           @map("safe_summary")
  createdAt          DateTime        @default(now()) @map("created_at")
  updatedAt          DateTime        @updatedAt @map("updated_at")
  completedAt        DateTime?       @map("completed_at")

  runs ImportRun[]

  @@unique([targetEnvironment, scopeType, scopeHash, idempotencyKeyHash])
  @@index([importFamily, mode, status])
  @@index([operatorUserId, createdAt])
  @@index([createdAt])
  @@index([completedAt])
  @@index([latestRunId])
  @@map("import_jobs")
}
```

Field notes:

- `id`: internal UUID primary key.
- `idempotencyKeyHash`: hash of the normalized idempotency key, not the raw key material.
- `importFamily`: `DEPARTMENT`, `USER_ACCOUNT`, or `ACHIEVEMENT`.
- `mode`: one of the current first-slice modes only.
- `achievementType`: nullable existing `AchievementType`; required by application validation only when `importFamily=ACHIEVEMENT`.
- `targetEnvironment`: safe configured discriminator such as deployment environment code. Never store connection strings or hosts containing secrets.
- `scopeType`: string in the first migration to avoid premature enum churn. Recommended first values are `GLOBAL_OPERATOR_SCOPE` and `DEPARTMENT_SCOPE`.
- `scopeHash`: hash of the safe scope component used for idempotency. Do not store raw operator, department, or person fields when a hash is enough.
- `fileFingerprint`: normalized file fingerprint, not file contents.
- `fileSizeBytes`: safe optional file size.
- `operatorUserId`: optional actor reference. It may be indexed without adding import fields to the `users` table.
- `latestRunId`: optional scalar pointer for quick lookup. Prefer no first-slice foreign key to avoid cyclic FK complexity between job and run; add a relation later if needed.
- Count fields: aggregate safe counts only.
- `safeErrorCodes`: JSON array of machine codes only.
- `safeSummary`: JSON object for safe result summary only.

`fileNameRedacted` should not be added in the first migration. A file fingerprint and size are enough for idempotency and audit correlation. If operators later need a display label, add a nullable `fileNameRedacted String? @db.VarChar(255)` only after a redaction rule is specified.

## ImportRun Table

Recommended Prisma-style shape for a later schema Step:

```prisma
model ImportRun {
  id                             String             @id @default(uuid()) @db.Uuid
  jobId                          String             @map("job_id") @db.Uuid
  attemptNo                      Int                @map("attempt_no")
  trigger                        ImportRunTrigger   @default(INITIAL_SUBMIT)
  status                         ImportRunStatus    @default(PENDING)
  operatorUserId                 String?            @map("operator_user_id") @db.Uuid
  requestFingerprint             String?            @map("request_fingerprint") @db.VarChar(128)
  validationSummary              Json?              @map("validation_summary")
  applySummary                   Json?              @map("apply_summary")
  failureCode                    String?            @map("failure_code") @db.VarChar(120)
  failureStage                   ImportFailureStage? @map("failure_stage")
  auditLogIds                    Json?              @map("audit_log_ids")
  completedBusinessTransactionAt DateTime?          @map("completed_business_transaction_at")
  startedAt                      DateTime?          @map("started_at")
  finishedAt                     DateTime?          @map("finished_at")
  createdAt                      DateTime           @default(now()) @map("created_at")
  updatedAt                      DateTime           @updatedAt @map("updated_at")

  job ImportJob @relation(fields: [jobId], references: [id], onDelete: Restrict)

  @@unique([jobId, attemptNo])
  @@index([jobId, status])
  @@index([operatorUserId, createdAt])
  @@index([status, createdAt])
  @@index([createdAt])
  @@index([finishedAt])
  @@map("import_runs")
}
```

Field notes:

- `jobId`: required relation to `ImportJob`.
- `attemptNo`: starts at `1`; unique per job.
- `trigger`: why this run exists.
- `status`: run status independent of the latest job status.
- `operatorUserId`: optional actor reference; no business-object FK.
- `requestFingerprint`: hash of safe request shape, excluding raw CSV and sensitive business values.
- `validationSummary`: safe JSON counts and codes from validation.
- `applySummary`: safe JSON created counts, audit count, and forbidden side-effect zero-delta assertions.
- `failureCode`: safe machine code, never raw exception text with values.
- `failureStage`: safe enum describing where failure happened.
- `auditLogIds`: first-slice JSON array of audit UUID strings, not a relation.
- `completedBusinessTransactionAt`: set inside the business transaction only after business writes and audit writes are included.
- `startedAt` / `finishedAt`: nullable to support created-but-not-started and failed-before-start cases.

## ImportJobItem Deferred

Do not create `ImportJobItem` in the first migration.

Reasons:

- The first target slice is Department `CREATE_ONLY`; job/run summaries can explain success, replay, conflict, and in-flight cases without row-level persistence.
- Row-level item history increases privacy risk because row data is close to CSV content.
- A future row-level model needs a separate safe-field review for each import family.

If later authorized, `ImportJobItem` should store only `jobId`, `runId`, `rowNumber`, `plannedAction`, `status`, `safeCode`, `targetType`, and optionally internal `targetId` after creation. It must not store row values, raw identifiers, person fields, titles, contributor lists, CSV excerpts, or imported values.

## JSON Safe Summary Rules

Allowed in JSON safe summary fields:

- `family`, `mode`, and `achievementType` enum strings.
- Row counts: total, accepted, created, companion-created, skipped, failed, warnings, errors.
- Safe action counts such as `CREATE`, `CREATE_PENDING_USER`, or `CREATE_DRAFT`.
- Safe error or warning codes such as `EXISTING_CODE`, `EXISTING_USER`, `DB_CONFLICT`, `VALIDATION_ERROR_BLOCKED`, or `VALIDATION_WARNING_BLOCKED`.
- Audit operation names and counts.
- Forbidden side-effect zero-delta booleans or count deltas.
- Timestamps, durations, and internal job/run ids.

Forbidden in any JSON field:

- CSV raw content or row excerpts.
- Raw DOI, software registration number, patent application number, patent grant number.
- Raw email, employee number, person name, title, owner, contributor list, department name, or organization text.
- Credential material, password or password hash, session id/hash, token, cookie, private key, API key, connection string, `.env` value, storage key, mail payload, raw request headers, user agent raw value, IP address raw value, or raw exception text containing values.
- Patent `nextFeeDate` and `feeAmount` in apply success/error summaries for the first patent slice.

## Constraints And Indexes

Idempotency uniqueness:

- Use `@@unique([targetEnvironment, scopeType, scopeHash, idempotencyKeyHash])`.
- The hash itself should already include family, mode, achievement type, normalized file fingerprint, scope, and target environment.
- Keeping environment and scope in the unique key is a defensive guard and improves operator explainability.
- Do not include raw file name, raw operator values, or raw business identifiers.

Run attempt uniqueness:

- Use `@@unique([jobId, attemptNo])`.
- Create retry runs by incrementing `attemptNo` under a transaction that locks or atomically updates the job.

Query indexes:

- `ImportJob`: `[importFamily, mode, status]` for history/status filters.
- `ImportJob`: `[operatorUserId, createdAt]` for operator history.
- `ImportJob`: `[createdAt]` and `[completedAt]` for time-window queries.
- `ImportJob`: `[latestRunId]` for lookup convenience if retained as a scalar pointer.
- `ImportRun`: `[jobId, status]`.
- `ImportRun`: `[operatorUserId, createdAt]`.
- `ImportRun`: `[status, createdAt]`.
- `ImportRun`: `[createdAt]` and `[finishedAt]`.

Audit references:

- First migration should store `auditLogIds` as `Json?` on `ImportRun`.
- Do not add an `ImportRunAuditLog` join table or modify `AuditLog` in the first migration.
- A later audit-heavy Web history slice can add a relation table if querying by audit id becomes necessary.

## Transaction And Consistency Plan

Job/run claim:

- Compute the normalized idempotency hash server-side.
- In a short claim transaction, create `ImportJob` with `RUNNING` status and create `ImportRun` attempt `1` with `RUNNING` status.
- If the unique key already exists, read the existing job:
  - `SUCCESS`: return replay from stored safe summary.
  - `RUNNING`: return in-flight status.
  - `REJECTED`: return the stored safe rejection summary; do not write.
  - `FAILED`: allow retry only if failure code is retryable and the caller explicitly requested retry.
  - `PENDING`: either claim atomically or return pending status, depending on whether async worker support exists.

Concurrent same-key submissions:

- The composite unique constraint is the main concurrency guard.
- Only the transaction that successfully creates or claims the job may create a `RUNNING` run.
- The losing request must not open the business transaction.

Business transaction:

- The recommended first implementation should update job/run success inside the same Prisma transaction as department business writes and audit writes.
- For Department `CREATE_ONLY`, the transaction should include:
  - department creates;
  - audit rows;
  - import run `applySummary`, `auditLogIds`, `completedBusinessTransactionAt`, `status=SUCCESS`, `finishedAt`;
  - import job aggregate counts, `latestRunId`, `status=SUCCESS`, `completedAt`.
- If validation blocks before business writes, mark job/run `REJECTED` outside the business transaction with safe validation summary.
- If the business transaction throws and rolls back, catch the error and mark job/run `FAILED` with safe failure code, unless the process crashed before catch.

Crash and timeout behavior:

- If the process crashes before the business transaction starts, the job may remain `RUNNING` with no business writes. A later stale-run recovery design can mark it failed after manual review or a safe timeout policy.
- If the business transaction starts and rolls back, no business rows commit.
- If the business transaction commits, the job/run success summary commits with it, so a client timeout retry can return `REPLAYED_SUCCESS`.
- Avoid any design where business rows commit first and job/run success summary is persisted in a separate later transaction. That creates the exact response-timeout ambiguity this feature is meant to solve.

Recommended first transaction boundary:

- Use a two-phase pattern:
  - short claim transaction for idempotency visibility;
  - business transaction that includes business writes, audit writes, and final job/run success update.
- Do not hold a long transaction while parsing or reading raw upload content.
- Do not implement async workers in the first slice.

## Migration Slice Recommendation

The minimum migration slice should add only:

- New enums listed above.
- `import_jobs`.
- `import_runs`.

It should not:

- Modify existing business tables.
- Add columns to `Department`, `User`, `Achievement`, detail tables, contributor tables, `AuditLog`, workflow, attachment, fee, reminder, notification, search, or resource grant tables.
- Add foreign keys to imported business objects.
- Add `ImportJobItem`.
- Add seed data.
- Backfill historical imports.
- Store file names unless a redaction rule is separately approved.

Operator association:

- `operatorUserId` should be an optional indexed UUID.
- A later actual Prisma schema may add a relation to `User` if needed for type-safe query includes, but the database migration should not add any import column to the `users` table.

Latest run:

- `latestRunId` should start as an optional scalar UUID on `ImportJob`.
- Avoid a first-slice FK to `ImportRun` unless the implementation team accepts the cyclic relation complexity.

## Later Runtime Slice Order

Recommended order:

1. Step 72C: schema/migration-only implementation for enums, `ImportJob`, and `ImportRun`, plus generated Prisma client and typecheck. No runtime import behavior.
2. Step 72D: backend-only Department `CREATE_ONLY` job/run claim, replay, in-flight handling, safe summaries, and tests.
3. Step 72E: local synthetic production-like acceptance for Department idempotency.
4. Later: extend to achievement `PAPER`, then `SOFTWARE_COPYRIGHT`, then `PATENT`.
5. Later: extend to user/account after pending/no-credential and no-session/no-mail/lifecycle boundaries are covered.
6. Later: Web read-only history list after backend semantics are stable.

Reasoning:

- A schema/migration-only Step is easier to review and revert before runtime depends on it.
- Generated client/typecheck catches naming and relation mistakes before business logic is added.
- Department runtime is the safest first behavior slice because it has the smallest data graph and least sensitive key material.
- Web history should wait until replay and in-flight semantics are stable.

## Step 72B Position

Step 72B recommends a minimal additive database model: `ImportJob` as the idempotent logical request table and `ImportRun` as the attempt ledger, with `ImportJobItem` deferred. The first migration should be additive, no-backfill, no-seed, and isolated from business tables. It remains a plan only and does not authorize schema, migration, runtime, apply, database, or production work.

## Step 72C Implementation Addendum

- Date: 2026-07-04.
- Implemented the schema/migration-only minimum slice.
- Added Prisma enums:
  - `ImportFamily`.
  - `ImportMode`.
  - `ImportJobStatus`.
  - `ImportRunStatus`.
  - `ImportRunTrigger`.
  - `ImportFailureStage`.
- Added `ImportJob` model:
  - Uses `AchievementType?` for optional achievement import type.
  - Keeps `latestRunId` as a nullable scalar without a cyclic relation.
  - Uses `Json?` for `safeErrorCodes` and `safeSummary`.
  - Does not add `fileNameRedacted`.
  - Adds the planned idempotency unique constraint and query indexes.
- Added `ImportRun` model:
  - Requires `jobId` relation to `ImportJob`.
  - Uses `Json?` for `validationSummary`, `applySummary`, and `auditLogIds`.
  - Adds `jobId + attemptNo` uniqueness and query indexes.
- Added migration `prisma/migrations/20260704120000_add_import_job_history/migration.sql`.
- Migration is additive:
  - Creates only import enums, `import_jobs`, `import_runs`, indexes, unique constraints, and the `import_runs.job_id` foreign key to `import_jobs`.
  - Does not modify existing business tables.
  - Does not add `ImportJobItem`.
  - Does not add seed or backfill.
- No runtime import apply behavior, controller, service, repository, API route, Web UI, apply execution, business data write, Docker/browser run, production/VPS access, or production DB access was added.

## Step 72D Implementation Addendum

- Date: 2026-07-04.
- Implemented backend-only Department metadata `CREATE_ONLY` import job history and idempotency wiring.
- Added a Department import job repository for:
  - server-side same-key claim;
  - `RUNNING` job/run creation;
  - same-key success replay;
  - same-key in-flight response;
  - stored rejection replay;
  - failed-job retry blocking;
  - success, rejection, and failure status updates.
- Department apply now derives idempotency server-side from:
  - family `DEPARTMENT`;
  - mode `CREATE_ONLY`;
  - SHA-256 file fingerprint;
  - safe target environment discriminator;
  - `scopeType` and hashed scope.
- Department apply success keeps department creation, audit writes, `ImportRun` success summary, and `ImportJob` success summary in the same Prisma transaction.
- Persisted import summaries store only safe counts, safe error codes, operation code, internal job/run ids, file fingerprint hash, scope hash, status, and audit ids.
- Persisted import summaries do not store raw CSV content, department names, raw file paths, credentials, sessions, tokens, cookies, passwords, connection strings, `.env` values, storage keys, or mail payloads.
- Validation-blocked apply marks job/run `REJECTED` and stores a safe validation summary without writing department or audit rows.
- Same-key `SUCCESS`, `RUNNING`, `REJECTED`, and `FAILED` claims short-circuit before the business write transaction.
- No user/account import, achievement import, Web UI, schema/migration, apply API execution, Docker/browser, production/VPS, or real-data path was added.

## Step 72E Acceptance Addendum

- Date: 2026-07-04.
- Added local API/DB acceptance helper `memory-bank/step72e-department-import-job-acceptance.mjs`.
- Helper scope:
  - Department metadata `CREATE_ONLY` only.
  - Synthetic `S72E_*` data only.
  - Temporary local Nest API harness with `NODE_ENV=staging`.
  - Explicit local non-production `DATABASE_URL` required from the current process environment.
  - No Web, user/account import, achievement import, schema/migration, Docker/browser, production/VPS, or real-data path.
- Helper coverage:
  - first successful apply creates department rows, audit rows, `ImportJob`, and `ImportRun`;
  - success job/run statuses and safe summary counts match business/audit writes;
  - same-key `SUCCESS` replay returns `REPLAYED_SUCCESS` and does not add department/audit/job/run rows;
  - validation-blocked apply writes job/run `REJECTED` safe summary without partial department/audit writes;
  - same-key `REJECTED` replay returns stored safe rejection without extra job/run or business writes;
  - DB-helper seeded `RUNNING` job returns `IMPORT_IN_PROGRESS` without business writes;
  - persisted job/run JSON summaries are scanned for raw CSV, synthetic department names/codes, raw paths, credentials, sessions, tokens, cookies, passwords, connection strings, env values, storage keys, mail payloads, and URL-like values;
  - non-department side-effect tables are snapshotted after synthetic setup and checked for stability after the acceptance flows.
- Current local run status:
  - `node memory-bank/step72e-department-import-job-acceptance.mjs` was blocked because `DATABASE_URL` was not set in this shell.
  - The helper failed closed with sanitized `DATABASE_URL_NOT_SET` output.
  - No `.env` or `.env.production` content was read, no guessed connection string was used, and no production/VPS/database access was attempted.
- Regression gates during this Step:
  - `corepack pnpm --filter @research-ip/api test -- department-import imports.app-module`: PASS.
  - `corepack pnpm --filter @research-ip/api typecheck`: PASS.

## Step 72E-Resume Acceptance Addendum

- Date: 2026-07-04.
- Completed the previously blocked Department import job/idempotency local API/DB acceptance using the existing local Docker API/Postgres environment.
- Local Docker actions:
  - rebuilt the local API image;
  - updated/restarted the local API container;
  - applied existing Prisma migrations to local Docker Postgres;
  - copied and ran the committed Step 72E helper inside the API container.
- Acceptance result: PASS.
  - First Department `CREATE_ONLY` apply returned `EXECUTED`, created 2 department rows, wrote 2 audit rows, and persisted successful `ImportJob` / `ImportRun` records.
  - Same-key `SUCCESS` replay returned `REPLAYED_SUCCESS` with no extra department, audit, job, or run rows.
  - Validation-blocked `REJECTED` replay returned stored safe `EXISTING_CODE` rejection with no partial department/audit writes and no extra job/run rows.
  - DB-helper seeded `RUNNING` same-key claim returned `IMPORT_IN_PROGRESS` with no business writes.
  - Safe summary scan passed.
  - Non-target side-effect boundary passed.
- Boundary maintained:
  - no Web, user/account import, achievement import, schema, new migration, runtime source, package, lockfile, config, or script changes;
  - no `.env` / `.env.production` content read or printed;
  - no `DATABASE_URL` value printed or recorded;
  - no production/VPS access;
  - no Docker orphan cleanup, prune, or volume deletion.

## Step 72F Implementation Addendum

- Date: 2026-07-04.
- Implemented backend-only Achievement `PAPER` `CREATE_DRAFT_ONLY` import job history and idempotency wiring.
- Added an Achievement import job repository for PAPER-only:
  - server-side same-key claim;
  - `RUNNING` job/run creation;
  - same-key success replay;
  - same-key in-flight response;
  - stored rejection replay;
  - failed-job retry blocking;
  - success, rejection, and failure status updates.
- PAPER apply now derives idempotency server-side from:
  - family `ACHIEVEMENT`;
  - mode `CREATE_DRAFT_ONLY`;
  - achievement type `PAPER`;
  - SHA-256 file fingerprint;
  - safe target environment discriminator;
  - `scopeType` and hashed scope.
- PAPER apply success keeps achievement creation, `PaperDetail`, contributors, audit writes, `ImportRun` success summary, and `ImportJob` success summary in the same Prisma transaction.
- Persisted PAPER import summaries store only safe counts, safe error codes, operation code, status/type/mode fields, internal job/run metadata, file fingerprint hash, scope hash, and audit ids.
- Persisted PAPER import summaries do not store raw CSV content, raw DOI, normalized DOI, title, abstract, owner/contributor names or emails, raw file paths, credentials, sessions, tokens, cookies, passwords, connection strings, `.env` values, storage keys, or mail payloads.
- Validation-blocked PAPER apply marks job/run `REJECTED` and stores a safe validation summary without writing achievement/detail/contributor/audit rows.
- Same-key PAPER `SUCCESS`, `RUNNING`, `REJECTED`, and `FAILED` claims short-circuit before the business write transaction.
- `SOFTWARE_COPYRIGHT` and `PATENT` apply paths explicitly remain outside import job/idempotency wiring in this Step.
- No user/account import, Web UI, schema/migration, apply API execution, Docker/browser, production/VPS, or real-data path was added.

## Step 72G Acceptance Addendum

- Date: 2026-07-04.
- Added local API/DB acceptance helper `memory-bank/step72g-paper-import-job-acceptance.mjs`.
- Helper scope:
  - Achievement `PAPER` `CREATE_DRAFT_ONLY` only.
  - Synthetic `S72G_*` data only.
  - Temporary local Nest API harness with staging auth through `X-Demo-User-Id`.
  - Local Docker API/Postgres environment only.
  - No Web, `SOFTWARE_COPYRIGHT`, `PATENT`, user/account import, schema/migration, production/VPS, or real-data path.
- Acceptance result: PASS.
  - First PAPER apply returned `EXECUTED`, created 2 draft PAPER achievements, 2 paper details, 2 contributors, 2 audit rows, and persisted successful `ImportJob` / `ImportRun` records.
  - Same-key `SUCCESS` replay returned `REPLAYED_SUCCESS` with no extra achievement, paper detail, contributor, audit, job, or run rows.
  - Validation-blocked missing DOI flow stored one `REJECTED` job/run safe summary and replayed the stored safe rejection without business writes.
  - DB-helper seeded `RUNNING` same-key claim returned `IMPORT_IN_PROGRESS` with no business writes.
  - Safe summary scan passed.
  - Non-target side-effect boundary passed.
  - No `SOFTWARE_COPYRIGHT` or `PATENT` import job path was exercised.
- Boundary maintained:
  - no schema/migration/model change;
  - no Web, user/account, `SOFTWARE_COPYRIGHT`, or `PATENT` wiring;
  - no `.env` / `.env.production` content read or printed;
  - no `DATABASE_URL` value printed or recorded;
  - no production/VPS access;
  - no Docker orphan cleanup, prune, or volume deletion.

## Step 72H Implementation Addendum

- Date: 2026-07-04.
- Implemented backend-only Achievement `SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` import job history and idempotency wiring.
- Generalized the Achievement import job repository from PAPER-only claim naming to create-draft achievement job claim naming.
- Achievement job claim now supports:
  - `PAPER`;
  - `SOFTWARE_COPYRIGHT`.
- `SOFTWARE_COPYRIGHT` apply now derives idempotency server-side from:
  - family `ACHIEVEMENT`;
  - mode `CREATE_DRAFT_ONLY`;
  - achievement type `SOFTWARE_COPYRIGHT`;
  - SHA-256 file fingerprint;
  - safe target environment discriminator;
  - `scopeType` and hashed scope.
- `SOFTWARE_COPYRIGHT` apply success keeps achievement creation, `SoftwareCopyrightDetail`, contributors, audit writes, `ImportRun` success summary, and `ImportJob` success summary in the same Prisma transaction.
- Persisted `SOFTWARE_COPYRIGHT` import summaries store only safe counts, safe error codes, operation code, status/type/mode fields, internal job/run metadata, file fingerprint hash, scope hash, and audit ids.
- Persisted `SOFTWARE_COPYRIGHT` import summaries do not store raw CSV content, raw registration number, normalized registration number, title, owner/contributor names or emails, raw file paths, credentials, sessions, tokens, cookies, passwords, connection strings, `.env` values, storage keys, run environment values, or mail payloads.
- Validation-blocked `SOFTWARE_COPYRIGHT` apply marks job/run `REJECTED` and stores a safe validation summary without writing achievement/detail/contributor/audit rows.
- Same-key `SOFTWARE_COPYRIGHT` `SUCCESS`, `RUNNING`, `REJECTED`, and `FAILED` claims short-circuit before the business write transaction.
- PAPER job/idempotency behavior remains covered by regression tests.
- `PATENT` apply path explicitly remains outside import job/idempotency wiring in this Step.
- No user/account import, Web UI, schema/migration, apply API execution, Docker/browser, production/VPS, or real-data path was added.

## Step 72I Acceptance Addendum

- Date: 2026-07-04.
- Added local API/DB acceptance helper `memory-bank/step72i-software-import-job-acceptance.mjs`.
- Helper scope:
  - Achievement `SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` only.
  - Synthetic `S72I_*` data only.
  - Temporary local Nest API harness with staging auth through `X-Demo-User-Id`.
  - Local Docker API/Postgres environment only.
  - No Web, `PATENT`, user/account import, schema/migration, production/VPS, or real-data path.
- Acceptance result: PASS.
  - First `SOFTWARE_COPYRIGHT` apply returned `EXECUTED`, created 2 draft software copyright achievements, 2 software copyright details, 2 contributors, 2 audit rows, and persisted successful `ImportJob` / `ImportRun` records.
  - Same-key `SUCCESS` replay returned `REPLAYED_SUCCESS` with no extra achievement, software copyright detail, contributor, audit, job, or run rows.
  - Validation-blocked missing registration flow stored one `REJECTED` job/run safe summary and replayed the stored safe rejection without business writes.
  - DB-helper seeded `RUNNING` same-key claim returned `IMPORT_IN_PROGRESS` with no business writes.
  - Safe summary scan passed.
  - Non-target side-effect boundary passed.
  - No `PATENT` import job path was exercised.
- Boundary maintained:
  - no schema/migration/model change;
  - no Web, user/account, or `PATENT` wiring;
  - no `.env` / `.env.production` content read or printed;
  - no `DATABASE_URL` value printed or recorded;
  - no production/VPS access;
  - no Docker orphan cleanup, prune, or volume deletion.

## Step 72J Implementation Addendum

- Date: 2026-07-04.
- Implemented backend-only Achievement `PATENT` `CREATE_DRAFT_ONLY` import job history and idempotency wiring.
- Achievement job claim now supports:
  - `PAPER`;
  - `SOFTWARE_COPYRIGHT`;
  - `PATENT`.
- `PATENT` apply now derives idempotency server-side from:
  - family `ACHIEVEMENT`;
  - mode `CREATE_DRAFT_ONLY`;
  - achievement type `PATENT`;
  - SHA-256 file fingerprint;
  - safe target environment discriminator;
  - `scopeType` and hashed scope.
- `PATENT` apply success keeps achievement creation, `PatentDetail`, contributors, audit writes, `ImportRun` success summary, and `ImportJob` success summary in the same Prisma transaction.
- Persisted `PATENT` import summaries store only safe counts, safe error codes, operation code, status/type/mode fields, internal job/run metadata, file fingerprint hash, scope hash, and audit ids.
- Persisted `PATENT` import summaries do not store raw CSV content, raw application number, normalized application number, raw grant number, normalized grant number, title, owner/contributor names or emails, `nextFeeDate`, `feeAmount`, raw file paths, credentials, sessions, tokens, cookies, passwords, connection strings, `.env` values, storage keys, run environment values, or mail payloads.
- Patent fee/reminder validation field names are redacted before storing safe job summaries.
- Validation-blocked `PATENT` apply marks job/run `REJECTED` and stores a safe validation summary without writing achievement/detail/contributor/audit rows.
- Same-key `PATENT` `SUCCESS`, `RUNNING`, `REJECTED`, and `FAILED` claims short-circuit before the business write transaction.
- PATENT remains draft-only and all-or-nothing.
- PATENT still does not persist `nextFeeDate` / `feeAmount` and does not create fee, reminder, notification, search, resource grant, workflow, or attachment side effects.
- PAPER and `SOFTWARE_COPYRIGHT` job/idempotency behavior remains covered by regression tests.
- No user/account import, Web UI, schema/migration, apply API execution, Docker/browser, production/VPS, or real-data path was added.

## Step 72K Acceptance Addendum

- Date: 2026-07-04.
- Added local API/DB acceptance helper `memory-bank/step72k-patent-import-job-acceptance.mjs`.
- Helper scope:
  - Achievement `PATENT` `CREATE_DRAFT_ONLY` only.
  - Synthetic `S72K_*` data only.
  - Temporary local Nest API harness with staging auth through `X-Demo-User-Id`.
  - Local Docker API/Postgres environment only.
  - No Web, user/account import, schema/migration, production/VPS, or real-data path.
- Acceptance result: PASS.
  - First `PATENT` apply returned `EXECUTED`, created 2 draft patent achievements, 2 patent details, 2 contributors, 2 audit rows, and persisted successful `ImportJob` / `ImportRun` records.
  - Same-key `SUCCESS` replay returned `REPLAYED_SUCCESS` with no extra achievement, patent detail, contributor, audit, job, or run rows.
  - Validation-blocked grant-only missing application flow stored one `REJECTED` job/run safe summary and replayed the stored safe rejection without business writes.
  - DB-helper seeded `RUNNING` same-key claim returned `IMPORT_IN_PROGRESS` with no business writes.
  - Safe summary scan passed for raw CSV, patent identifiers, title, owner/contributor email/name, `nextFeeDate`, `feeAmount`, raw path, and credential/session/token/cookie/password/connection-string/storage/mail-payload terms.
  - Fee/reminder boundary passed: persisted `nextFeeDate` count 0, persisted `feeAmount` count 0, fee record delta 0, fee review history delta 0, reminder delta 0, notification delta 0.
  - Non-target side-effect boundary passed.
  - No PAPER, `SOFTWARE_COPYRIGHT`, or user/account import job path was exercised.
- Boundary maintained:
  - no schema/migration/model change;
  - no Web or user/account wiring;
  - no `.env` / `.env.production` content read or printed;
  - no `DATABASE_URL` value printed or recorded;
  - no production/VPS access;
  - no Docker orphan cleanup, prune, or volume deletion.

## Step 72L User Account Plan Addendum

- Date: 2026-07-04.
- Added docs-only plan `memory-bank/user-account-import-job-idempotency-plan.md`.
- The plan scopes User/account `CREATE_ONLY_PENDING_NO_CREDENTIAL` import job/idempotency separately because the import touches pending users, role assignment, employee-number readiness, and strict no-credential/no-session/no-lifecycle/no-mail boundaries.
- Recommended idempotency dimensions:
  - family `USER_ACCOUNT`;
  - mode `CREATE_ONLY_PENDING_NO_CREDENTIAL`;
  - normalized file fingerprint;
  - safe target environment discriminator;
  - `GLOBAL_OPERATOR_SCOPE` or equivalent operator-scope hash for the first slice;
  - no raw email, employee number, display name, role name, department name, CSV content, credential/session/token/cookie/password/connection string/env/storage/mail payload values.
- Recommended runtime behavior:
  - same-key `SUCCESS` returns `REPLAYED_SUCCESS` with stored safe counts;
  - same-key `RUNNING` returns `IMPORT_IN_PROGRESS`;
  - same-key `REJECTED` returns stored safe rejection;
  - same-key `FAILED` is not automatically retried in the first user/account slice.
- Recommended success transaction:
  - create `User`;
  - create `UserRole`;
  - write safe audit;
  - update `ImportRun` and `ImportJob` success summaries/statuses;
  - keep all of the above in one Prisma transaction.
- Safe summaries should contain only counts, status, operation, safe error codes, `NO_CREDENTIAL`, `PENDING_ACTIVATION`, and department-scope facts.
- Safe summaries must not store raw CSV, email, employee number, display name, role/department names, credentials, sessions, lifecycle token material, cookies, passwords, connection strings, `.env` values, storage keys, or mail payloads.
- Step 72M is recommended as backend-only user/account job/idempotency implementation.
- Step 72N is recommended as local Docker API/DB acceptance with synthetic `S72N_*` data.
- Web/history list remains deferred.
- This Step did not modify runtime/source/schema/API/Web/package/lockfile/config/script files, did not add migrations, did not execute apply, did not run Docker/browser, did not write a database, and did not access production/VPS.

## Step 72N User Account Acceptance Addendum

- Date: 2026-07-04.
- Verified the existing `ImportJob` / `ImportRun` schema supports User/account `CREATE_ONLY_PENDING_NO_CREDENTIAL` import history and idempotency without additional schema or migration changes.
- Local Docker API/DB acceptance used only synthetic `S72N_*` data.
- Verified `USER_ACCOUNT` `ImportJob` / `ImportRun` status transitions:
  - first same-key apply: `RUNNING` claim to `SUCCESS`;
  - same-key `SUCCESS`: replayed as `REPLAYED_SUCCESS`;
  - validation-blocked same-key: stored and replayed `REJECTED`;
  - DB-helper seeded in-flight same-key: returned `IMPORT_IN_PROGRESS`.
- Verified persisted safe summaries contain safe counts/status/code/operation plus `NO_CREDENTIAL`, `PENDING_ACTIVATION`, and `DEPARTMENT` facts only.
- Verified safe summaries do not contain raw CSV, raw/normalized email, employee number, display name, role/department names, raw path, credential/session/token/cookie/password/connection-string/env/storage/mail payload values.
- Verified no `UserCredential`, `UserSession`, `AccountLifecycleToken`, mail/notification, workflow, attachment, fee/reminder, search, resource grant, or non-user-account import job side effects.
- No schema/migration/model updates were made in this Step.

## Step 73A Web Read-Only History Entry Plan

- Date: 2026-07-04.
- Scope: documentation-only Web read-only entry design for `ImportJob` / `ImportRun` history.
- Non-scope: no Web implementation, no backend API implementation, no Prisma schema or migration changes, no apply API execution, no production/VPS/production DB access, and no retry/delete/cleanup/rollback behavior.

### Entry Location Options

Department import page:

- Add a small read-only "Import history" section near the existing Department CSV dry-run/apply card inside `DepartmentManagement`.
- Filter by `family = DEPARTMENT` and `mode = CREATE_ONLY`.
- Reason: this is the operator's task-local recovery path after department apply, replay, rejected validation, or in-flight response. It avoids sending operators to a global screen when they only need department import evidence.

User import page:

- Add the same read-only history section near the existing User account CSV dry-run/apply card inside `AccountManagement`.
- Filter by `family = USER_ACCOUNT` and `mode = CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Reason: user import has the strongest privacy boundary. Keeping the entry inside account management preserves the current `system:config` account-admin context and keeps the copy focused on pending/no-credential semantics.

Achievement import page:

- Add the same read-only history section near the existing Achievement CSV dry-run/apply card inside `Achievements`.
- Filter by `family = ACHIEVEMENT`, `mode = CREATE_DRAFT_ONLY`, and optionally `achievementType = PAPER | SOFTWARE_COPYRIGHT | PATENT`.
- Reason: achievement import history needs the achievement type visible for explainability, but must not expose row identifiers or achievement names. A task-local section can reuse existing achievement import copy and safe status language.

Unified settings/system configuration entry:

- Add a read-only "Import history" overview under the existing settings/system configuration boundary only after the family-local entries exist.
- The overview should default to the most recent safe records across all import families and support filters by `family`, `mode`, `achievementType`, `status`, and time range.
- It must not become a control center: no retry, delete, cleanup, rollback, CSV download, or raw-detail actions.
- Reason: support staff may need cross-family visibility, but a global entry first would increase privacy review scope and navigation ambiguity.

Recommended final entry combination:

- Step 73C should implement family-local read-only entries on all three import pages first.
- A later settings/system configuration overview is recommended only as a read-only secondary index, not as the sole entry.
- This combination keeps operator recovery close to the import task, avoids widening the initial Web privacy surface, and still leaves a path for support-wide history browsing once the backend read API and safe response DTOs are accepted.

### List Display Fields

The list should render only safe `ImportJob` aggregate fields plus latest-run status metadata:

- `family`: display `DEPARTMENT`, `USER_ACCOUNT`, or `ACHIEVEMENT`.
- `mode`: display `CREATE_ONLY`, `CREATE_ONLY_PENDING_NO_CREDENTIAL`, or `CREATE_DRAFT_ONLY`.
- `achievementType`: display only the enum for achievement jobs; show empty or `N/A` for department and user/account jobs.
- `status`: display `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`, or `REJECTED`.
- Created counts:
  - `acceptedRowCount`;
  - `createdBusinessCount`;
  - `createdCompanionCount`;
  - `auditCount`.
- Safe error code: display only machine codes from `safeErrorCodes` or latest run `failureCode`, capped to a small number with a count overflow indicator.
- `createdAt`.
- `completedAt`.

The list must not include operator display names, file names, file paths, raw identifiers, CSV excerpts, row values, or business-object names.

### Detail Display Fields

The detail drawer/page should show:

- Safe summary:
  - `ImportJob.safeSummary` after response DTO sanitization;
  - latest or selected `ImportRun.validationSummary` / `applySummary` after response DTO sanitization;
  - counts and safe booleans only.
- Run status:
  - `attemptNo`;
  - `trigger`;
  - `status`;
  - `failureCode`;
  - `failureStage`;
  - `startedAt`;
  - `finishedAt`;
  - `completedBusinessTransactionAt`.
- Audit count:
  - show `ImportJob.auditCount` and a count derived from `ImportRun.auditLogIds` length if the backend exposes it as a number;
  - do not show audit IDs in the first Web slice.
- User-understandable status explanations:
  - Replay: "This import request already completed successfully. The stored safe counts are shown; no new write was started for this same request."
  - In-flight: "This import request is already running or was claimed recently. No second write was started. Check again later or ask an administrator to inspect backend health."
  - Rejected: "This import request was blocked by validation or safety rules. The safe reason codes are shown; no business write was performed."
  - Failed: "This import attempt failed after being claimed. Automatic retry is not available from this page."

### Permission

- Continue to require `system:config` for every read-only history API and every Web entry.
- Do not add a broader import-history permission in Step 73A through 73D.
- Frontend visibility remains an affordance only; backend guards remain authoritative.
- This does not expand access to department admins, lifecycle/invite/reset users, audit-only users, achievement-state users, or support roles without `system:config`.

### Privacy And Safety Boundary

The Web history entry and backend read DTOs must not display or return:

- raw CSV content, CSV excerpts, imported row values, or the original CSV download;
- email, employee number, DOI, software registration number, patent application number, patent grant number, achievement name/title, personnel names, owner names, contributor names, role names, department names, organization text, or file paths;
- credential, credential hash, session id/hash, lifecycle token, API token, cookie, password, password hash, private key, storage key, mail payload, connection string, `.env` value, raw request header, raw user agent, raw IP address, or raw exception text containing values.

The Web history entry must not provide:

- retry;
- delete;
- cleanup;
- rollback;
- CSV download;
- raw audit id browsing in the first slice;
- links that reveal business-object detail from imported row identities.

### Backend Read API Constraints For 73B

- 73B should design or implement read-only endpoints only.
- Suggested shape:
  - `GET /api/import-jobs` with filters for `family`, `mode`, `achievementType`, `status`, `createdFrom`, `createdTo`, pagination, and sort by `createdAt`.
  - `GET /api/import-jobs/:id` returning one safe job plus safe run summaries.
- The API must whitelist response fields instead of returning Prisma records directly.
- The API must enforce `system:config` with existing user context and permission guards.
- The API must not expose idempotency key hash, scope hash, request fingerprint, file fingerprint, operator user id, raw audit ids, or any JSON key/value that fails the safe-summary allowlist.

### Step Split Recommendation

- 73B: backend read-only API query design or implementation. Prefer implementation only if response DTO sanitization, filters, pagination, and tests fit the Step scope.
- 73C: Web implementation for the three family-local read-only entries using 73B safe DTOs.
- 73D: local browser acceptance for permissions, empty state, list/detail display, no forbidden controls, no sensitive strings, and responsive layout.

### Step 73A Position

Step 73A recommends a family-local first Web history entry, with a later optional settings/system configuration overview. The first Web slice should be strictly read-only, `system:config`-guarded, backed by whitelisted safe DTOs, and limited to aggregate counts, statuses, safe machine codes, timestamps, and safe run explanations. It does not authorize Web code, backend API code, schema/migration work, production access, retry, delete, cleanup, rollback, or CSV download behavior.

## Step 73B Backend Read-Only API Implementation Addendum

- Date: 2026-07-04.
- Implemented backend read-only import job history APIs:
  - `GET /import-jobs`;
  - `GET /import-jobs/:id`.
- Added files:
  - `apps/api/src/imports/import-job-history-read.controller.ts`;
  - `apps/api/src/imports/import-job-history-read.service.ts`;
  - `apps/api/src/imports/import-job-history-read.repository.ts`;
  - matching targeted specs for controller, service, and repository.
- Wired `ImportJobHistoryReadController`, `ImportJobHistoryReadService`, and `ImportJobHistoryReadRepository` into `ImportsModule`.

### API Behavior

- `GET /import-jobs` supports:
  - `family`;
  - `mode`;
  - `achievementType`;
  - `status`;
  - `createdFrom`;
  - `createdTo`;
  - `page`;
  - `pageSize`.
- Default sort is `createdAt desc`, then `id desc`.
- Default pagination is `page = 1`, `pageSize = 20`; `pageSize` is capped at `100` by validation.
- Invalid enum, date, page, or pageSize query values return `400`.
- `GET /import-jobs/:id` parses UUID v4 ids and returns `404` when the job does not exist.

### DTO And Select Boundary

- Repository list/detail queries use Prisma `select` allowlists.
- List DTO returns:
  - `id`;
  - `family`;
  - `mode`;
  - `achievementType`;
  - `status`;
  - `acceptedRowCount`;
  - `createdBusinessCount`;
  - `createdCompanionCount`;
  - `auditCount`;
  - `safeErrorCodes`;
  - `createdAt`;
  - `completedAt`;
  - latest-run safe status metadata.
- Detail DTO adds:
  - sanitized `safeSummary`;
  - sanitized run `validationSummary` and `applySummary`;
  - run `attemptNo`, `trigger`, `status`, `failureCode`, `failureStage`, `startedAt`, `finishedAt`, `completedBusinessTransactionAt`;
  - `auditCount` number only.
- Detail repository reads `auditLogIds` only to count them and strips raw ids before returning data to the service.
- DTOs do not expose:
  - `idempotencyKeyHash`;
  - `scopeHash`;
  - `requestFingerprint`;
  - `fileFingerprint`;
  - `operatorUserId`;
  - raw audit ids;
  - raw Prisma records.

### Safe Summary Sanitizer

- Service sanitizes `ImportJob.safeSummary`, `ImportRun.validationSummary`, and `ImportRun.applySummary`.
- Only approved safe JSON keys are retained.
- Unsafe string values, non-allowlisted keys, raw identifier-like values, messages, raw CSV, person fields, credential/session/token/cookie/password/connection-string content, and arbitrary request metadata are removed.

### Permission And Non-Goals

- Both endpoints continue to require `system:config` through `UserContextGuard`, `PermissionGuard`, and `RequirePermissions(PermissionCode.systemConfig)`.
- No new permission code was added.
- No access was expanded to department admins, lifecycle/invite/reset users, audit-only users, achievement-state users, or other support roles without `system:config`.
- No Web UI, Prisma schema, migration, apply execution, production/VPS access, retry, delete, cleanup, rollback, CSV download, or write endpoint was added.

### Verification

- `corepack pnpm --filter @research-ip/api test -- import-job-history-read`: PASS, 3 files / 12 tests.
- `corepack pnpm --filter @research-ip/api typecheck`: PASS.
- `git diff --check`: PASS.

Step 73B provides the safe backend read DTO surface needed by Step 73C Web implementation. Step 73C should consume these DTOs without adding write controls. Step 73D should perform local browser acceptance for permission boundaries, empty/list/detail states, no forbidden controls, and no sensitive strings.

## Step 73C Web Read-Only Entry Implementation Addendum

- Date: 2026-07-04.
- Implemented family-local Web read-only import history entries:
  - Department import page: `family = DEPARTMENT`, `mode = CREATE_ONLY`.
  - User account import page: `family = USER_ACCOUNT`, `mode = CREATE_ONLY_PENDING_NO_CREDENTIAL`.
  - Achievement import page: `family = ACHIEVEMENT`, `mode = CREATE_DRAFT_ONLY`, with optional `achievementType` filter.
- Added reusable Web panel:
  - `apps/web/src/ImportJobHistoryPanel.tsx`.
  - Loading, empty, error, list, and detail states.
  - Detail drawer renders safe summary rows, run status metadata, audit count, and replay/in-flight/rejected/failed explanations.
- Added Web client/types:
  - `ImportJobHistoryListResponse`;
  - `ImportJobHistoryListItem`;
  - `ImportJobHistoryDetail`;
  - `ImportRunHistorySummary`;
  - `ImportJobHistoryListQuery`.
  - API client methods call `/import-jobs` and `/import-jobs/:id`, relying on the existing Web API base to produce `/api/import-jobs`.

### Step 73C Permission And Safety Boundary

- Web entries remain inside existing `system:config` visibility boundaries.
- Backend guards remain authoritative.
- Unauthorized Web states do not render the history panel and therefore do not request import-jobs.
- The Web entry does not provide retry, delete, cleanup, rollback, or source CSV download controls.
- Detail display keeps audit evidence to `auditCount` and does not display raw audit IDs.
- The Web panel is defensive about safe summary rendering and filters obviously unsafe summary keys/values before display.

### Step 73C Verification

- `corepack pnpm --filter @research-ip/web test -- api-client DepartmentManagement AccountManagement Achievements ImportJobHistory`: PASS, 5 files / 125 tests.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.
- `corepack pnpm --filter @research-ip/web build`: PASS, with only the existing Vite large chunk warning.
- `git diff --check`: PASS.

Step 73C completes the Web implementation slice for the three local import pages. Step 73D should run local browser acceptance for permission visibility, empty/list/detail behavior, achievementType filtering, and absence of forbidden controls or sensitive values.

## Step 73D Web Local Browser Acceptance Addendum

- Date: 2026-07-04.
- Ran local browser acceptance for Step 73C Web read-only import history entries.
- Local setup:
  - Web: `http://127.0.0.1:5173/`.
  - API shape: local read-only `/api` stub on port `3000` plus Playwright route fulfillment for deterministic import-history responses.
  - No `.env`, `.env.production`, `DATABASE_URL`, production/VPS, production DB, Docker, or real import apply path was used.

### Step 73D Acceptance Result

- Department page:
  - `system:config` user sees `Department import history`.
  - Verified loading, empty, list, and detail drawer states.
  - Verified fixed filters `DEPARTMENT` + `CREATE_ONLY`.
- User account page:
  - `system:config` user sees `User account import history`.
  - Verified error state and list state.
  - Verified fixed filters `USER_ACCOUNT` + `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Achievement page:
  - `system:config` user sees `Achievement import history`.
  - Verified fixed filters `ACHIEVEMENT` + `CREATE_DRAFT_ONLY`.
  - Verified `achievementType=PATENT` filter changes the list request and displayed rows.
- Permission:
  - Researcher demo user did not see history panels.
  - Switching to researcher did not trigger additional `/api/import-jobs` requests.
- Detail explanations:
  - Verified replay, in-flight, rejected, and failed explanations in the detail drawer.
- Network:
  - Import-history calls were GET-only:
    - `GET /api/import-jobs`;
    - `GET /api/import-jobs/:id`.
  - No import-history write endpoints or forbidden action URLs were called.
- Safety:
  - History controls were only `Refresh` and `Details`.
  - History panel/drawer scan passed for no forbidden controls, raw CSV, raw audit IDs, personal/business identifiers, or credential/session/token/cookie/password/connection-string values.

### Step 73D Small Web Fix

- Acceptance found that non-production demo mode selected a demo user id but did not derive an `authUser` permission context.
- Fixed `apps/web/src/App.tsx` to derive a frontend-only permission context from demo presets in non-production mode.
- Production auth remains session-backed and unchanged.
- Added App helper coverage for the derived demo permission context.

### Step 73D Verification

- Browser acceptance script: PASS, 22 assertions.
- `corepack pnpm --filter @research-ip/web test -- App api-client DepartmentManagement AccountManagement Achievements ImportJobHistory`: PASS, 7 files / 135 tests.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.
- `corepack pnpm --filter @research-ip/web build`: PASS, with only the existing Vite large chunk warning.

Step 73D completes local browser acceptance for the three Web read-only import history entries and records the small dev-mode permission-context fix needed to make those entries reachable in local browser testing.

## Step 73E Final Archive Addendum

- Date: 2026-07-04.
- Added `memory-bank/import-job-history-final-archive.md` as the closure archive for Step 72A through Step 73D.
- Archived completed capabilities:
  - `ImportJob` / `ImportRun` schema and migration;
  - Department `CREATE_ONLY` job/run/idempotency;
  - Achievement `PAPER`, `SOFTWARE_COPYRIGHT`, and `PATENT` `CREATE_DRAFT_ONLY` job/run/idempotency;
  - User/account `CREATE_ONLY_PENDING_NO_CREDENTIAL` job/run/idempotency;
  - backend read-only import job history API;
  - Web read-only history entries on Department, User account, and Achievement import pages;
  - local API/DB acceptance and local browser acceptance.
- Archived verified semantics:
  - `EXECUTED`;
  - `REPLAYED_SUCCESS`;
  - `IMPORT_IN_PROGRESS`;
  - `REJECTED` safe replay;
  - `FAILED` as non-automatic retry;
  - Web read-only list/detail;
  - `system:config` permission boundary;
  - GET-only history network boundary.
- Reconfirmed unsupported capabilities:
  - automatic retry;
  - cleanup/delete/rollback;
  - persisted `ImportJobItem`;
  - settings/system import-history overview;
  - production apply;
  - real-data import;
  - source CSV download;
  - raw audit identifier browsing.
- Reconfirmed safety boundaries:
  - no raw CSV display;
  - no personal or business identifier display;
  - no credential/session/token/cookie/password/connection-string display;
  - no production/VPS inference from local browser acceptance;
  - no production DB inference from route mock/stub acceptance.
- Recommended future routes:
  - Step 74A may design a settings/system unified read-only import-history overview.
  - Production readiness should be a separate read-only preflight runbook.
  - Real-environment acceptance requires separate explicit authorization and safe, de-identified evidence handling.

Step 73E closes the local import job history and idempotency delivery mainline as documentation-only. It does not authorize runtime/API/Web/schema/migration/package/lockfile/config changes, production/VPS access, production DB access, import apply, retry, cleanup, delete, rollback, or real-data import.

## Step 74A Settings/System Unified Read-Only Overview Plan

- Date: 2026-07-04.
- Scope: documentation-only design for a settings/system unified read-only import history overview.
- Added detailed plan:
  - `memory-bank/import-job-history-settings-overview-plan.md`.
- Non-scope: no Web implementation, no backend API implementation, no Prisma schema or migration changes, no package or lockfile changes, no service startup, no browser run, no database access, no production/VPS access, no import apply execution, and no retry/delete/cleanup/rollback/download behavior.

### Entry Position

- The overview belongs inside the existing settings/system configuration boundary.
- It is a secondary read-only index after the three family-local import history entries already accepted on Department, User account, and Achievement import pages.
- It does not replace the Department, User account, or Achievement page-local entries.
- It is for cross-family support visibility only and must not become an import control center.

### Filters And Ordering

- The list must support:
  - `family`;
  - `mode`;
  - `achievementType`;
  - `status`;
  - `createdFrom`;
  - `createdTo`;
  - `page`;
  - `pageSize`.
- Default ordering is `createdAt desc`.
- The first load should show the latest safe records across all import families unless the user narrows filters.

### Safe Display Contract

- Reuse the Step 73B / 73C safe DTO fields.
- List display should stay limited to family, mode, achievement type enum, status, aggregate counts, latest run status metadata, safe machine error codes, and timestamps.
- Detail display should show sanitized `safeSummary`, sanitized run summaries, run status rows, `auditCount`, and replay/in-flight/rejected/failed explanations.
- Opaque `ImportJob.id` may be used internally for row keys and detail requests, but should not be displayed, copied, linked as a shareable route, or treated as a business identifier.

### Permission And Prohibitions

- Continue to require `system:config`.
- Do not add an `import-history` permission.
- Backend guards remain authoritative; frontend visibility is only an affordance.
- Do not display raw CSV, email, employee number, DOI, registration number, patent number, achievement title, personnel names, credential/session/token/cookie/password/connection-string values, or raw audit IDs.
- Do not provide retry, delete, cleanup, rollback, source CSV download, export/download, raw JSON copy, raw audit ID browsing, or links to business-object details inferred from imported row identifiers.

### Follow-Up Split

- Step 74B: Web settings/system overview implementation, keeping the three local entries intact.
- Step 74C: local browser acceptance for permissions, filters, list/detail safe display, GET-only behavior, and absence of forbidden controls or strings.
- Production readiness remains a separate read-only preflight runbook and must not be merged into Step 74A.

Step 74A approves only the documentation design for the settings/system unified read-only import history overview. It does not authorize runtime/API/Web/schema/migration/package/lockfile/config changes, production/VPS access, production DB access, import apply, retry, cleanup, delete, rollback, download, or business-object drilldown behavior.

## Step 74B Settings/System Unified Read-Only Overview Web Implementation

- Date: 2026-07-04.
- Scope: Web-only implementation and tests for the settings/system unified read-only import history overview.
- Non-scope: no backend changes, no Prisma schema or migration changes, no package or lockfile changes, no config changes, no service startup, no browser run, no database access, no production/VPS access, and no import apply execution.

### Web Implementation

- Added `apps/web/src/SettingsImportJobHistoryOverview.tsx`.
- Added `apps/web/src/SettingsImportJobHistoryOverview.test.tsx`.
- Mounted the overview inside `apps/web/src/SettingsApiIntegrations.tsx`, keeping it within the existing settings/system configuration page.
- Kept the overview as a secondary read-only index; Department, User account, and Achievement page-local history entries remain unchanged and continue using fixed family/mode filters.
- Reused existing Web API client methods:
  - `listImportJobHistory`;
  - `getImportJobHistoryDetail`.
- Did not add backend routes. The client still calls `/import-jobs`, which the Web base composes to `/api/import-jobs`.

### Filters, Pagination, And Display

- Implemented filters for:
  - `family`;
  - `mode`;
  - `achievementType`;
  - `status`;
  - `createdFrom`;
  - `createdTo`.
- Implemented pagination through `page` and `pageSize`.
- Default query is `page = 1`, `pageSize = 20`, with no family/mode/status/achievementType filters.
- Non-pagination filter changes reset `page` to `1`.
- Pagination changes are limited to `page` and `pageSize`.
- The UI relies on backend default ordering by `createdAt desc` and does not display opaque import job ids.
- List display includes only safe DTO fields: family, mode, achievement type or `N/A`, status, accepted/business/companion/audit counts, safe machine error codes, `createdAt`, and `completedAt`.
- Detail display reuses the existing safe detail component for sanitized safe summary, run status, run `auditCount`, and replay/in-flight/rejected/failed explanations.

### Permission And Safety Boundary

- The overview is visible only to `system:config` users.
- Users without `system:config` do not render the overview and do not trigger import-history client calls from the overview component.
- No new permission was added.
- Backend guard remains authoritative.
- No retry, delete, cleanup, rollback, download, export, raw JSON copy, or bulk-action controls were added.
- No raw CSV, raw audit ids, personal identifiers, business object names, credential/session/token/cookie/password/connection-string values, or import-row-derived business detail links were added.

### Verification

- `corepack pnpm --filter @research-ip/web test -- SettingsImportJobHistory SettingsApiIntegrations App ImportJobHistory`: PASS, 5 files / 35 tests.
- `corepack pnpm --filter @research-ip/web typecheck`: PASS.
- `corepack pnpm --filter @research-ip/web build`: PASS, with the existing Vite large chunk warning.

Step 74B completes the Web implementation slice for the settings/system unified read-only import history overview. Step 74C should run local browser acceptance for visibility, GET-only requests, filter query behavior, pagination, list/detail safe display, and absence of forbidden controls or sensitive strings.

## Step 74C Settings/System Unified Read-Only Overview Local Browser Acceptance

- Date: 2026-07-04.
- Scope: local browser acceptance for the Step 74B settings/system unified read-only import history overview.
- Non-scope: no backend changes, no Prisma schema or migration changes, no package or lockfile changes, no config changes, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no import apply, and no retry/delete/cleanup/rollback/download/export behavior.

### Local Acceptance Setup

- Web URL: `http://127.0.0.1:5173/`.
- Web server: local Vite only.
- API behavior: Playwright route mock for read-only local acceptance.
- No real API server, Docker service, database, production/VPS host, or production data source was used.
- Playwright acceptance data included synthetic unsafe DTO values to verify the UI filters them before display.

### Acceptance Result

- `system:config` demo user:
  - Entered Settings.
  - Saw `Import history overview`.
  - Verified loading, empty, error, list, and detail drawer states.
- Non-`system:config` demo user:
  - Entered Settings.
  - Did not see `Import history overview`.
  - Did not trigger additional `/api/import-jobs` requests.
- Existing local entries remained present:
  - Achievement page: `Achievement import history`.
  - User account page: `User account import history`.
  - Department page: `Department import history`.

### Query And Network Acceptance

- Default settings overview request:
  - `GET /api/import-jobs?page=1&pageSize=20`.
  - No `family`, `mode`, `status`, or `achievementType` query value.
- Filter requests represented:
  - `family=ACHIEVEMENT`;
  - `mode=CREATE_DRAFT_ONLY`;
  - `achievementType=PATENT`;
  - `status=FAILED`;
  - `createdFrom=2026-07-01`;
  - `createdTo=2026-07-04`.
- Every non-pagination filter change reset `page` to `1`.
- Pagination changed only `page` / `pageSize`; accepted example kept the active filters and moved to `page=2&pageSize=20`.
- Error-state acceptance changed `status` after pagination and verified `page=1` reset.
- Detail drawer request was `GET /api/import-jobs/:id`.
- Import-history network traffic was GET-only.
- No import-history apply, dry-run, retry, delete, cleanup, rollback, download, export, raw-json, or bulk-action URL was observed.
- Other mocked local GETs were limited to existing page data dependencies such as dashboard summary, workflow tasks, settings API integrations, achievements, account users, and departments.

### Safety Acceptance

- List displayed only safe DTO fields: family, mode, achievement type, status, aggregate counts, safe machine error codes, `createdAt`, and `completedAt`.
- Detail displayed sanitized safe summary, run status, run `auditCount`, and failed-state explanation.
- Detail displayed `auditCount` only and did not display raw audit IDs.
- The overview did not display opaque import job ids as user-facing business fields.
- The overview did not render retry, delete, cleanup, rollback, download, export, raw JSON, or bulk-action controls.
- Synthetic unsafe response values for raw CSV, raw audit IDs, email, employee number, DOI, registration/patent numbers, title/person names, credential/session/token/cookie/password, and connection string were not visible in list or detail.
- No import-row-derived business object detail links were observed.

### Verification

- No Web code changes were needed, so Step 74C did not rerun Web test/typecheck/build.
- `git diff --check`: PASS.
- `git diff --stat`: PASS; docs-only files changed.
- `git diff --cached --stat`: PASS; empty before staging.
- `git status --short`: PASS; tracked changes limited to Step 74C docs plus existing untracked local artifacts.

Step 74C accepts the settings/system unified read-only import history overview locally with route-mocked read-only API data. This does not prove production readiness; production readiness still requires a separate read-only preflight runbook.

## Step 74D Settings/System Unified Read-Only Overview Final Archive

- Date: 2026-07-04.
- Scope: documentation-only final archive for the Step 74A through Step 74C settings/system unified read-only import history overview mini-line.
- Added final archive:
  - `memory-bank/import-job-history-settings-overview-final-archive.md`.
- Non-scope: no runtime/API/Web/schema/migration/package/lockfile/config changes, no service startup, no browser run, no database access, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no import apply, and no retry/delete/cleanup/rollback/download/export behavior.

### Archived Completed Work

- Step 74A: settings/system unified read-only overview design.
- Step 74B: Web implementation and targeted Web tests.
- Step 74C: local browser acceptance with local Vite and route-mocked read-only API responses.

### Archived Verified Capability

- The overview is inside the existing settings/system configuration area as a secondary read-only index.
- Department, User account, and Achievement page-local import history entries remain present and are not replaced.
- The overview reuses `GET /api/import-jobs` and `GET /api/import-jobs/:id`; no backend route was added.
- `system:config` users can see the overview.
- Users without `system:config` do not see the overview and do not trigger overview-owned import-history requests.
- The accepted behavior covers the default query, `family` / `mode` / `achievementType` / `status` / `createdFrom` / `createdTo` filters, page reset on filter changes, pagination limited to `page` / `pageSize`, loading/empty/error/list/detail drawer states, and GET-only import-history network traffic.

### Archived Unsupported Boundary

- No backend route, schema, or migration support was added.
- The overview does not support retry, delete, cleanup, rollback, download, export, raw JSON copy, bulk action, raw audit ID browsing, source CSV download, business-object drilldown, production/VPS acceptance, or real-data import.

### Archived Safety Boundary

- The overview does not display raw CSV, email, employee number, DOI, registration number, patent number, title, personnel names, credential/session/token/cookie/password/connection-string values, raw audit IDs, or opaque `ImportJob` ids as user-facing business fields.
- Step 74C route-mocked local browser acceptance is not production DB acceptance.

### Follow-Up Position

- Production readiness remains a separate read-only preflight runbook.
- Real-environment acceptance requires separate explicit authorization and must not place database URLs, passwords, tokens, cookies, or connection strings in chat, documentation, logs, or commits.

Step 74D closes the settings/system unified read-only import history overview mini-line as documentation-only. It does not authorize production access, production DB access, real-data import, write actions, export actions, cleanup, rollback, or broader permission changes.

## Step 75A Import Job History Production Read-Only Preflight Runbook

- Date: 2026-07-04.
- Scope: documentation-only production read-only preflight runbook for `ImportJob` / `ImportRun` and import history readiness.
- Added runbook:
  - `memory-bank/import-job-history-production-readonly-preflight-runbook.md`.
- Non-scope: no runtime/API/Web/schema/migration/package/lockfile/config changes, no service startup, no browser run, no database access, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no import apply, no real-data import, no migration execution, no permission modification, and no retry/delete/cleanup/rollback/download/export behavior.

### Runbook Coverage

- Preflight objectives cover migration state, API health, `system:config` permission, read-only history API, Web entries, and safety evidence boundaries.
- Read-only checks cover backup confirmation, migration state, `ImportJob` / `ImportRun` table-structure presence, `system:config` confirmation, API health, `GET /api/import-jobs`, conditional `GET /api/import-jobs/:id`, and Web visibility for three page-local entries plus the settings/system overview.
- Backup evidence rules require confirming production backup status first while recording only de-identified confirmation summaries.
- Safety evidence rules prohibit raw CSV, personal/business identifiers, credentials, raw audit IDs, full request headers, user agents, IP addresses, raw exception text, and raw production JSON payloads.
- Stop conditions cover unknown migration state, unconfirmed backup, unclear `system:config`, failed API health, sensitive history API fields, forbidden Web controls, unclear safe sample ids, credential-paste requests, and any request for write or mutation behavior.
- Explicit non-authorization covers production apply, real-data import, migration execution, retry/delete/cleanup/rollback, download/export, DB writes, permission modification, credential reads or propagation, and production/VPS access by Step 75A itself.

Step 75A documents the production read-only preflight path only. It does not execute the runbook or authorize production readiness, production access, real-data import, or any write behavior.

## Step 75B Production Runbook Reference Addendum

- Date: 2026-07-04.
- Scope: documentation-only link-in of the Step 75A import job history production read-only preflight runbook into the production cutover runbook and checklist discovery path.
- Updated:
  - `deploy/runbook-production.md`;
  - `deploy/checklist-production-cutover.md`;
  - `memory-bank/progress.md`;
  - `memory-bank/evidence.md`.
- Non-scope: no execution of the preflight runbook, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no migration execution, no import apply, no runtime/API/Web/schema/migration/package/lockfile/config changes, and no retry/delete/cleanup/rollback/download/export behavior.

### Reference Boundary

- The production runbook now points operators to `memory-bank/import-job-history-production-readonly-preflight-runbook.md` when import task history readiness is in scope.
- The production cutover checklist now records that the runbook is a read-only reference for backup/migration-state/API/Web visibility boundaries and GET-only smoke, where applicable.
- The added references explicitly state that the Step 75A runbook is not production apply authorization, production/VPS access authorization, production DB access authorization, migration execution authorization, real-data import authorization, or retry/delete/cleanup/rollback/download/export authorization.
- The added references preserve the safety boundary against recording `DATABASE_URL`, passwords, tokens, cookies, connection strings, raw production sample ids, raw audit ids, raw CSV, personal identifiers, or credentials.

Step 75B improves discoverability only. It does not execute the Step 75A runbook or expand production authority.

## Step 75C Production Read-Only Preflight Documentation Final Archive

- Date: 2026-07-05.
- Scope: documentation-only final archive for the Step 75A through Step 75B import job history production read-only preflight documentation line.
- Added final archive:
  - `memory-bank/import-job-history-production-preflight-final-archive.md`.
- Non-scope: no execution of the preflight runbook, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no service startup, no browser run, no migration execution, no import apply, no runtime/API/Web/schema/migration/package/lockfile/config changes, and no retry/delete/cleanup/rollback/download/export behavior.

### Archived Completed Work

- Step 75A created `memory-bank/import-job-history-production-readonly-preflight-runbook.md`.
- Step 75B linked that runbook from `deploy/runbook-production.md` and `deploy/checklist-production-cutover.md`.

### Archived Boundary

- The runbook is a read-only preflight reference only.
- It is not production apply authorization, production/VPS access authorization, production DB access authorization, migration execution authorization, DB write authorization, permission change authorization, or real-data import authorization.
- It must not be used to record `DATABASE_URL`, passwords, tokens, cookies, connection strings, credentials, raw production sample ids, raw audit ids, raw CSV, personal identifiers, raw request headers, user agents, IP addresses, raw exception bodies, or raw production JSON payloads.

### Archived Preflight Coverage

- Backup confirmation.
- Migration state.
- `ImportJob` / `ImportRun` structure presence.
- `system:config` permission confirmation.
- API health.
- `GET /api/import-jobs`.
- Conditional `GET /api/import-jobs/:id`.
- Web page-local entries and settings overview visibility.
- Safe evidence rules and stop conditions.

Step 75C closes the production read-only preflight documentation line as reference material only. Any real production preflight execution or real-environment acceptance remains blocked until separately authorized.

## Step 76A ImportJobItem Safe History Privacy Plan

- Date: 2026-07-05.
- Scope: documentation-only privacy and field-boundary plan for a possible future `ImportJobItem` row-level safe history model.
- Added plan:
  - `memory-bank/import-job-item-safe-history-plan.md`.
- Non-scope: no runtime/API/Web/schema/migration/package/lockfile/config changes, no service startup, no browser run, no database access, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no import apply, no migration execution, no retry/delete/cleanup/rollback/download/export behavior, and no row-level Web display.

### Safe History Boundary

- `ImportJobItem` remains deferred because row-level history is closest to source CSV/spreadsheet content and could expose row values, business identifiers, or people data if not strictly allowlisted.
- The future row-level allowlist is limited to `jobId`, `runId`, numeric `rowNumber`, machine `plannedAction`, machine `status`, machine `safeCode`, coarse `targetType`, and optional internal-only `targetId` after creation.
- Forbidden row-level values include raw CSV, CSV excerpts, row values, email, employee number, DOI, software registration number, patent application/grant number, title, personnel names, contributor/owner names, raw identifiers, normalized identifiers, credentials, tokens, cookies, passwords, connection strings, storage keys, mail payloads, request headers, user agents, IP addresses, and raw exception values.
- Department, User/account, and Achievement row-level plans may use only the global allowlist; family, mode, and achievement type should be inherited from `ImportJob` rather than duplicated with source identifiers.
- `targetId` is internal diagnostics only. It must not be displayed in Web, exposed as a copyable business field, or used for business-object drilldown from row history.

### Relationship And Web Position

- `ImportJob` remains the logical request and aggregate summary record.
- `ImportRun` remains the attempt ledger and safe run-summary record.
- A future `ImportJobItem` would be a child row-level safe outcome ledger for one run inside one job; it must not become a replay/rollback instruction set, CSV reconstruction cache, source of truth for business objects, or replacement for aggregate history.
- Web remains aggregate-only: list/detail and settings/system overview continue to show safe aggregate/status fields, sanitized safe summaries, run metadata, and audit counts.
- Row-level API and Web detail remain deferred until separate schema, backend, Web, and acceptance steps are explicitly authorized.

Step 76A documents privacy and field boundaries only. It does not authorize schema, migration, runtime, API, Web, database, production, import apply, or row-level display work.

## Step 76B ImportJobItem Safe History Final Archive

- Date: 2026-07-05.
- Scope: documentation-only final archive for the Step 76A `ImportJobItem` row-level safe history privacy and field-boundary plan.
- Added final archive:
  - `memory-bank/import-job-item-safe-history-final-archive.md`.
- Non-scope: no runtime/API/Web/schema/migration/package/lockfile/config changes, no service startup, no browser run, no database access, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no import apply, no migration execution, no retry/delete/cleanup/rollback/download/export behavior, no row-level API, no row-level Web display, no `targetId` display, and no business-object drilldown.

### Archived Position

- Step 76A completed the safe-field allowlist, forbidden-field boundary, family boundary, `targetId` internal-only rule, and Web aggregate-only boundary.
- `ImportJobItem` remains deferred.
- Step 76A must not be interpreted as schema, migration, backend, API, Web, production, database, import apply, or acceptance authorization.
- Any continuation must be split into separately authorized schema plan, backend implementation, Web plan, and acceptance Steps.

Step 76B archives the Step 76A plan as privacy and field-boundary reference material only. It does not authorize or imply `ImportJobItem` implementation.

## Step 76C ImportJobItem Schema Plan

- Date: 2026-07-05.
- Scope: documentation-only schema and migration plan for a possible future `ImportJobItem` row-level safe history table.
- Added plan:
  - `memory-bank/import-job-item-schema-plan.md`.
- Non-scope: no `prisma/schema.prisma` change, no migration generation, no runtime/API/Web/package/lockfile/config changes, no service startup, no browser run, no database access, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no import apply, no migration execution, no retry/delete/cleanup/rollback/download/export behavior, no row-level API, no row-level Web display, no `targetId` display, and no business-object drilldown.

### Schema Planning Position

- A future `ImportJobItem` would relate to `ImportJob` and `ImportRun` through required `jobId` and `runId` relations with conservative `onDelete: Restrict`; it must not cascade-delete history.
- Candidate fields are limited to the Step 76A allowlist: `jobId`, `runId`, `rowNumber`, `plannedAction`, `status`, `safeCode`, `targetType`, and internal-only `targetId`.
- Candidate enums are `ImportJobItemPlannedAction`, `ImportJobItemStatus`, and a narrow `ImportJobItemTargetType` rather than broad business-object drilldown types.
- Required constraints/indexes include `jobId`, `runId`, `jobId + rowNumber`, and `runId + rowNumber`; `status` / `safeCode` indexes are optional only if later read DTOs need safe internal diagnostics.
- The migration strategy must be additive, no-backfill, no-seed, no business-table changes, and no JSON fields for item row values.
- `targetId` remains internal-only and must not enter Web DTOs.
- Future work must be split into schema/migration, backend writer, backend read DTO, Web plan, and acceptance Steps.

Step 76C documents a future schema plan only. It does not authorize schema edits, migration files, backend/API/Web implementation, database access, production access, import apply, or acceptance execution.

## Step 76D ImportJobItem Schema Final Archive

- Date: 2026-07-05.
- Scope: documentation-only final archive for the Step 76C `ImportJobItem` schema and migration plan.
- Added final archive:
  - `memory-bank/import-job-item-schema-final-archive.md`.
- Non-scope: no `prisma/schema.prisma` change, no migration generation, no backend/API/Web/runtime/package/lockfile/config/script changes, no service startup, no browser run, no database access, no production/VPS access, no production DB access, no `.env` / `.env.production` read, no import apply, no migration execution, no retry/delete/cleanup/rollback/download/export behavior, no row-level API, no row-level Web display, no `targetId` display, and no business-object drilldown.

### Archived Position

- Step 76C completed a future schema/migration safety plan only.
- `ImportJobItem` remains deferred.
- Future fields remain limited to `jobId`, `runId`, `rowNumber`, `plannedAction`, `status`, `safeCode`, `targetType`, and optional internal-only `targetId`.
- Future implementation must preserve required `jobId` / `runId` relations, `onDelete: Restrict`, additive migration, no backfill, no seed, no business-table changes, and no cascade delete history.
- JSON row values, raw CSV, original imported values, email, employee number, `employeeNo`, DOI, registration number, patent number, title, personnel names, contributor lists, and other identifying row data remain forbidden.
- `targetId` remains internal-only and must not enter Web DTOs, Web display, or business-object drilldown.
- Any continuation must be separately authorized as schema/migration implementation, backend writer, backend read DTO, Web plan, and acceptance.

Step 76D archives the Step 76C schema plan as reference material only. It does not authorize Prisma schema edits, migration files, backend/API/Web implementation, database access, production access, import apply, or acceptance execution.

## Step 77A ImportJobItem Schema/Migration-Only Implementation

- Date: 2026-07-05.
- Scope: schema/migration-only implementation for `ImportJobItem`.
- Changed:
  - `prisma/schema.prisma`.
  - `prisma/migrations/20260705120000_add_import_job_items/migration.sql`.
- Non-scope: no backend service/controller/repository/import writer changes, no API route/DTO changes, no Web changes, no database access, no migration apply/deploy/reset, no production/VPS or production DB access, no `.env` / `.env.production` content read, no import apply, no seed, no backfill, no fixture row, no real data write, no retry/delete/cleanup/rollback/download/export behavior, and no existing untracked-artifact handling.

### Implemented Schema Boundary

- Added `ImportJobItemPlannedAction`, `ImportJobItemStatus`, and `ImportJobItemTargetType`.
- Added `ImportJobItem` with only the Step 76A/76C/76D allowlist fields: `jobId`, `runId`, `rowNumber`, `plannedAction`, `status`, `safeCode`, `targetType`, and internal-only `targetId`.
- Added `ImportJob.items` and `ImportRun.items` relation arrays.
- Both item relations use `onDelete: Restrict`.
- The additive migration creates item enum types, `import_job_items`, indexes, and foreign keys only.
- No JSON fields, raw CSV, row values, original imported values, email, employee number, `employeeNo`, DOI, registration number, patent number, title, personnel names, contributor lists, raw identifiers, normalized identifiers, credentials, or sensitive values were added.
- `targetId` remains internal-only persistence and was not added to DTOs, Web display, or business-object drilldown.

Step 77A implements only the previously planned schema/migration slice. Backend writer persistence, backend read DTOs, Web row-level planning, acceptance, migration execution, and production work remain separate future authorization boundaries.
