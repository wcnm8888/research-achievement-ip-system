# Achievement Import Real-Write Safety Plan

## Step 68A Scope

- Date: 2026-07-02.
- Purpose: design the first safe real-write slice for achievement import after department and user/account import write paths have completed local closure.
- This document is a safety and rollout plan only. It does not authorize implementation, API execution, database writes, Docker, production/VPS access, production DB access, schema changes, migrations, seed/backfill, package changes, deployment, cleanup, deletion, reset, drop, prune, or handling known untracked local artifacts.

## Current Starting Point

Achievement dry-run already validates a broad CSV contract:

- Import type: `ACHIEVEMENT`.
- Endpoint: `POST /api/achievements/import/dry-run`.
- Permission: `system:config`.
- File boundary: CSV only, 1 MB limit, UTF-8 parser, workbook-like body rejection, sanitized file metadata.
- Supported dry-run types: `PAPER`, `PATENT`, and `SOFTWARE_COPYRIGHT`.
- Existing no-write checks:
  - strict required columns: `type`, `title`, `departmentCode`, `contributors`;
  - forbidden sensitive, direct-id, storage, workflow, fee, and raw payload headers;
  - formula-like value rejection;
  - `DRAFT`-only status boundary;
  - type/detail mismatch validation;
  - contributor parsing, contributor type-fit validation, and active contributor user lookup when `userEmail` is present;
  - active department lookup by `departmentCode`;
  - active owner lookup by `ownerEmail`;
  - owner department must match target department;
  - `ownerEmployeeNo` lookup is explicitly not available;
  - same-file duplicate normalized identifier detection;
  - database normalized identifier conflict warnings for DOI, patent application number, patent grant number, and software registration number.

Existing achievement business writes support draft creation with:

- `Achievement` row with `DRAFT` status.
- One typed detail row: `PaperDetail`, `PatentDetail`, or `SoftwareCopyrightDetail`.
- `AchievementContributor` rows.
- Same-transaction audit event.

The regular `AchievementService.createDraft` is not a direct import apply fit because it binds `departmentId` and `ownerUserId` to the current user context. Achievement import must derive target department and owner from the CSV after server-side validation and transaction-time rechecks.

## First Slice Decision

The first achievement real-write slice should be backend-only `CREATE_DRAFT_ONLY`.

Recommended route:

- `POST /api/achievements/import/apply`.
- Multipart fields:
  - `file`: uploaded CSV.
  - `mode`: only `CREATE_DRAFT_ONLY`.
- Permission: keep `system:config`.
- Guard stack: existing `UserContextGuard` and `PermissionGuard`.
- No Web apply entry in Step 68B.
- No production/VPS execution in Step 68B.

Recommended first implementation support:

- Support `PAPER` only in Step 68B.
- Require a normalized DOI for every apply row.
- Continue dry-run support for all three types, but apply should reject `PATENT` and `SOFTWARE_COPYRIGHT` rows with a safe apply-only unsupported-type result until their write acceptance is planned separately.

Why `PAPER` only is safer:

- It is the smallest typed detail surface: one detail table and one durable normalized identifier, DOI.
- It avoids patent fields that are easy to confuse with fee/reminder import semantics, especially `nextFeeDate` and `feeAmount`.
- It avoids software copyright registration-number rollout before one type has proven the import transaction and audit pattern.
- It reduces race-condition and duplicate-apply proof to one normalized unique boundary before adding patent application/grant number and software registration number paths.
- It keeps Step 68B small enough for focused controller, service, repository, and AppModule tests.

Future steps may add `PATENT` and `SOFTWARE_COPYRIGHT` after `PAPER` local backend acceptance proves the shared apply plan, transaction boundary, race-condition rechecks, safe audit evidence, and duplicate-apply behavior.

## Apply Must Re-Parse And Revalidate

Apply must never accept or trust a client-supplied dry-run result.

The apply path must:

- Read the uploaded CSV again on the server.
- Reuse the same parser and validation semantics as dry-run.
- Produce a server-side apply plan that contains resolved IDs needed for writes but is not returned as raw client-controllable input.
- Reject before opening writes when any row has dry-run errors or warnings.
- Add apply-only blockers for Step 68B:
  - `mode` is not `CREATE_DRAFT_ONLY`;
  - row type is not `PAPER`;
  - row lacks normalized DOI;
  - any row is not `VALID`;
  - any candidate action is not `CREATE_DRAFT`.

The dry-run response remains a preview. It can inform the operator, but it must not be used as write authority.

## Allowed Data Effects

Step 68B should allow only these data effects inside one transaction:

- Create `Achievement` rows with:
  - `status=DRAFT`;
  - `type=PAPER`;
  - `title` from the parsed row;
  - `secretLevel` from the parsed row or existing default;
  - `departmentId` resolved from active `departmentCode`;
  - `ownerUserId` resolved from active `ownerEmail`;
  - `createdById` and `updatedById` set to the apply actor.
- Create exactly one `PaperDetail` row per imported achievement.
- Create `AchievementContributor` rows for the parsed contributors:
  - `userId` set only when contributor `userEmail` rechecks to an active user;
  - `userId=null` allowed for external-name contributors already accepted by dry-run;
  - stable `sortOrder` from CSV order.
- Write safe audit evidence for each created achievement, plus optionally one safe batch summary if the existing audit shape supports it without adding schema.

## Explicitly Forbidden Effects

Step 68B must not:

- Create workflow instances, workflow tasks, or workflow actions.
- Submit, approve, reject, archive, void, or otherwise change the achievement state machine.
- Create or import attachments, storage objects, storage keys, checksums, or attachment metadata.
- Create fee records, fee review history, reminders, notifications, search indexes, search logs, resource grants, or secret-read grants.
- Import patent or software copyright rows in the first implementation slice.
- Update, upsert, merge, reactivate, archive, or delete existing achievements.
- Persist uploaded files or raw CSV bodies.
- Create durable import job history or idempotency keys.
- Access VPS, production DB, production configuration, `.env`, or `.env.production`.
- Use real production data.

## Transaction Boundary

Use one Prisma `$transaction` for the whole apply request:

- The transaction owns all `Achievement`, `PaperDetail`, `AchievementContributor`, and audit writes.
- Any failed recheck, write error, or audit error must roll back the full batch.
- Partial success is not allowed in Step 68B.
- Audit writes must not happen outside the transaction.
- The service should return a sanitized rejection report on validation or conflict failure; it should not expose raw CSV content or internal lookup details.

## Race-Condition Rechecks

The dry-run conflict check is advisory only. Step 68B must recheck inside the transaction:

- Active department exists for each `departmentCode`, with `status=ACTIVE` and `archivedAt=null`.
- Active owner exists for each `ownerEmail`, with `status=ACTIVE` and `archivedAt=null`.
- Owner still belongs to the target department.
- Contributor user emails, when present, still resolve to active, non-archived users.
- Normalized DOI is still absent from `paper_details`.
- The row still satisfies `DRAFT`, `PAPER`, and normalized DOI apply-only constraints.

The repository must also map Prisma unique conflicts on `doi_normalized` to a safe apply conflict response. This is the final race-condition guard.

## Owner, Contributor, And Department Scope

Owner identity:

- `ownerEmail` is required for Step 68B because `ownerEmployeeNo` lookup is not available.
- The owner must be active, non-archived, and in the CSV target department at both dry-run and transaction-time recheck.
- The imported achievement owner is the resolved owner, not the apply actor.
- The apply actor is recorded only as `createdById`, `updatedById`, and audit actor.

Contributor identity:

- Contributors without `userEmail` remain external contributor rows with `userId=null`.
- Contributors with `userEmail` must resolve to active, non-archived users at transaction time.
- The first slice should not infer users by display name, employee number, or organization.
- The first slice should not create users or alter accounts.

Department scope:

- Keep first-slice write permission as `system:config`.
- Do not introduce department-admin or department-scoped achievement import permission in Step 68B.
- The target department comes from `departmentCode`, not from the apply actor's current department.
- The apply actor must still provide a valid `UserContext` with `userId` and `departmentId` so audit actor facts are available.

## Audit Evidence

Recommended audit behavior:

- Use existing `AuditActionCode.create`.
- Use target type `ACHIEVEMENT`.
- Target id is the created achievement id.
- Target department and target secret level come from the created achievement.
- `oldValue=null`.
- `newValue` should contain only safe, stable evidence:
  - `operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT"`;
  - `importType: "ACHIEVEMENT"`;
  - `mode: "CREATE_DRAFT_ONLY"`;
  - `rowNumber`;
  - `achievementId`;
  - `type`;
  - `status: "DRAFT"`;
  - `departmentId`;
  - `ownerUserId`;
  - `contributorCount`;
  - `identifierFieldsPresent: ["doi"]`;
  - optional sanitized file name if the audit redactor permits it safely.

Audit must not record:

- raw CSV content;
- local file path;
- title, abstract, contributor names, contributor emails, owner email, DOI values, normalized identifier values, patent/software registration values;
- storage keys, checksums, workflow payloads, fee payloads, raw payloads;
- credentials, cookies, tokens, passwords, private keys, connection strings, AccessKeys, or `.env` content.

## Duplicate Apply Behavior

Step 68B should be create-only and data-effect idempotent:

- A repeated exact apply after success must create no additional rows.
- For the `PAPER`-only first slice, requiring DOI gives a durable duplicate boundary.
- Repeated apply should fail safely with a normalized DOI conflict such as `DB_CONFLICT` or an apply-specific safe code, and the achievement count must remain unchanged.
- Files with duplicate DOI values in the same upload remain hard errors before writes.
- Rows without DOI are rejected in apply even if dry-run can preview them, because they cannot prove duplicate-apply safety in the first slice.
- Durable idempotency keys and persisted import jobs remain deferred because they require product and schema decisions.

## Partial Success

Partial success is not allowed in Step 68B.

Reasons:

- It avoids mixed batches where some achievements exist without a clear import job record.
- It keeps repeat-apply semantics simple.
- It makes audit evidence easier to reason about because every successful request has one complete transaction and every rejected request has no business writes.
- It matches the department and user/account first-slice pattern.

## Testing And Local Acceptance Plan

Step 68B implementation should run focused API verification:

- Service tests:
  - valid `PAPER` apply creates draft input with resolved owner/department/contributors;
  - apply re-parses uploaded CSV and rejects client-result-only assumptions;
  - warnings/errors block apply;
  - `PATENT` and `SOFTWARE_COPYRIGHT` are rejected in Step 68B;
  - missing DOI is rejected for apply;
  - active department, active owner, owner department, contributor user, and DOI conflicts are rechecked;
  - audit failure rolls back the whole transaction.
- Repository tests:
  - one transaction writes `Achievement`, `PaperDetail`, `AchievementContributor`, and `AuditLog` only;
  - no workflow, attachment, fee, reminder, notification, search, or resource grant writes are called;
  - Prisma unique conflict on `doi_normalized` maps to a safe conflict.
- Controller tests:
  - 401 without user context;
  - 403 without `system:config`;
  - rejects missing file, non-CSV, workbook-like body, oversize file, and unsupported mode;
  - delegates to apply service only after guard/file/mode checks.
- AppModule route wiring test:
  - `POST /achievements/import/apply` is exposed without weakening existing dry-run or achievement routes.

Local production-like API acceptance should be a later Step after Step 68B unless explicitly authorized:

- Use synthetic `S68C_*` local data only.
- Do not claim production/VPS acceptance.
- Confirm created achievement count, paper detail count, contributor count, audit operation count, and forbidden side-effect counts.
- Repeat exact apply and verify no additional achievement rows are created.
- Verify limited user receives 403.
- Record only counts, status codes, safe error codes, and redacted IDs where necessary.

Docs-only Step 68A does not run typecheck/test/build because no runtime, schema, API, Web, package, lockfile, or configuration file changes are made.

## Step 68B Recommended Scope

Implement the backend-only `PAPER` `CREATE_DRAFT_ONLY` apply endpoint.

Allowed Step 68B implementation files should be limited to API import/achievement modules and focused tests, if authorized in that future Step:

- Factor achievement dry-run into a shared server-side plan that apply can reuse.
- Add apply DTO/types/result shape for `CREATE_DRAFT_ONLY`.
- Add transaction-scoped repository write method for achievement import if the regular `AchievementService.createDraft` cannot safely support CSV owner/department semantics.
- Reuse existing achievement repository mapper functions where practical.
- Add safe audit event creation in the same transaction.
- Add targeted API tests.

Keep deferred:

- Web apply entry.
- `PATENT` and `SOFTWARE_COPYRIGHT` apply.
- Docker/browser/local production-like write acceptance.
- Production/VPS writes.
- Real data import.
- Workflow, attachment, fee, reminder, notification, search, resource grant, and import job history.
- Schema/migration/package/deployment work.

## Step 68B Implementation Addendum

- Date: 2026-07-02.
- Implemented backend-only `POST /api/achievements/import/apply`.
- Implemented only mode `CREATE_DRAFT_ONLY`.
- Implemented only `PAPER` apply; `PATENT` and `SOFTWARE_COPYRIGHT` remain rejected by apply-only blockers.
- Apply now re-parses the uploaded CSV and builds the same server-side validation plan used by dry-run.
- Dry-run errors and warnings block apply before any transaction is opened.
- Apply requires normalized DOI and maps repeated apply / DOI race conflicts to safe `DB_CONFLICT` evidence.
- One Prisma transaction covers only:
  - `Achievement` create with `DRAFT` status;
  - `PaperDetail` create;
  - `AchievementContributor` createMany;
  - audit event create through `AuditService.recordEventInTransaction`.
- Transaction-time rechecks cover:
  - active non-archived department by `departmentCode`;
  - active non-archived owner by `ownerEmail`;
  - owner department match;
  - active non-archived contributor users for contributor `userEmail`;
  - normalized DOI absence.
- Audit evidence intentionally excludes title, abstract, owner email, contributor email/name, DOI source value, and normalized DOI.
- Focused API tests and API typecheck passed.
- Still deferred to Step 68C or later:
  - local production-like API acceptance;
  - Web apply entry;
  - `PATENT` / `SOFTWARE_COPYRIGHT` apply;
  - production/VPS rollout;
  - real-data import;
  - workflow, attachment/storage, fee, reminder, notification, search, resource grant, import job history, and durable idempotency keys.
