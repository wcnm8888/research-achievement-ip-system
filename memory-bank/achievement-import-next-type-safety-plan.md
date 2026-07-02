# Achievement Import Next Type Safety Plan

## Step 69A Scope

- Date: 2026-07-02.
- Purpose: evaluate the second achievement import apply type after Step 68 completed the `PAPER` `CREATE_DRAFT_ONLY` local backend and Web closure.
- This is a planning-only Step. It does not implement API/Web code, call an apply API, run Docker/browser acceptance, write database rows, access production/VPS, read `.env` / `.env.production`, clean local artifacts, delete files, reset state, drop data, prune Docker, or authorize real-data import.

## Starting Evidence Reviewed

- Current HEAD: `d3dd10d test: add achievement import web acceptance`.
- Tracked diff was empty at start.
- Existing untracked local artifacts were present and left untouched.
- Step 68A-68F established and accepted:
  - backend-only `POST /api/achievements/import/apply`;
  - mode limited to `CREATE_DRAFT_ONLY`;
  - existing write support limited to `PAPER`;
  - `DRAFT` only, create-only, all-or-nothing transaction;
  - server-side CSV re-parse/revalidate;
  - normalized DOI required for `PAPER` duplicate-apply safety;
  - safe audit evidence;
  - local production-like API and Web acceptance with synthetic data only;
  - no workflow, attachment/storage, fee, reminder, notification, search, resource grant, import job, or state-machine side effects.

## Decision

The second achievement import apply type should be `SOFTWARE_COPYRIGHT`, not `PATENT`.

Recommended next implementation Step:

- Add backend-only `SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` apply support.
- Keep existing `PAPER` support unchanged.
- Allow either an all-`PAPER` batch or an all-`SOFTWARE_COPYRIGHT` batch.
- Reject mixed-type apply batches in the second-type slice, even if each individual row is otherwise valid.
- Continue to reject `PATENT` rows with safe unsupported-type apply errors.
- Defer Web apply expansion until backend API tests and local API acceptance have passed for `SOFTWARE_COPYRIGHT`.

## Why SOFTWARE_COPYRIGHT First

`SOFTWARE_COPYRIGHT` is the safer second type because:

- It has a single durable normalized identifier: `registrationNoNormalized`.
- The dry-run parser already normalizes the identifier from `softwareRegistrationNo` or `registrationNo`.
- Prisma has a unique constraint on `software_copyright_details.registration_no_normalized`.
- Its detail table is narrow and does not overlap with fee/reminder semantics:
  - `registrationNo`;
  - `softwareVersion`;
  - `softwareType`;
  - `publishDate`;
  - `registerDate`;
  - `runEnv`.
- Contributor type-fit is already distinct and simple: software copyright rows expect `COPYRIGHT_OWNER` contributors.
- It extends the already-proven `PAPER` transaction pattern without requiring new workflow, fee, reminder, search, or permission decisions.

## Why PATENT Remains Deferred

`PATENT` should remain deferred until a separate patent fee/reminder boundary plan exists.

Reasons:

- The detail model has two durable normalized identifier candidates:
  - `applicationNoNormalized`;
  - `grantNoNormalized`.
- The dry-run conflict logic already checks both patent application number and grant/patent number, but apply duplicate safety would need a deliberate rule for rows with one, both, or neither.
- Patent detail includes `nextFeeDate` and `feeAmount`.
- The Prisma schema also has `FeeRecord` with patent fee types and `ReminderTask` for due-date reminders. Even if the first patent slice forbids those side effects, the field names can be confused with fee/reminder import semantics.
- Patent annual fees, application fees, reminder tasks, fee review history, notifications, and dashboard/search side effects require a separate explicit non-goal and acceptance matrix.

Deferred does not mean unsupported forever. It means `PATENT` needs its own plan before apply writes are enabled.

## Minimum Safe SOFTWARE_COPYRIGHT Slice

The minimum safe second-type slice should keep these boundaries:

- backend-only first;
- mode exactly `CREATE_DRAFT_ONLY`;
- `DRAFT` only;
- create-only;
- all-or-nothing request transaction;
- no partial success;
- no client-supplied dry-run result trust;
- no workflow instance/task/action;
- no attachment/storage object or metadata;
- no fee record or fee review history;
- no reminder task;
- no notification;
- no search log/index write;
- no resource access grant;
- no import job history or durable idempotency key;
- no production/VPS access;
- no real-data import;
- no `.env` / `.env.production` content read.

Allowed data effects for a successful all-`SOFTWARE_COPYRIGHT` batch:

- Create `Achievement` rows with:
  - `type=SOFTWARE_COPYRIGHT`;
  - `status=DRAFT`;
  - target department resolved from active `departmentCode`;
  - owner resolved from active `ownerEmail`;
  - `createdById` and `updatedById` set to the apply actor.
- Create exactly one `SoftwareCopyrightDetail` row per imported achievement.
- Create `AchievementContributor` rows.
- Create safe audit evidence inside the same transaction.

## Durable Duplicate Boundary

The second-type apply boundary should require a normalized software registration number for every `SOFTWARE_COPYRIGHT` apply row.

Use:

- source columns: `softwareRegistrationNo` preferred, `registrationNo` alias accepted by existing dry-run parser;
- normalized field: `registrationNoNormalized`;
- Prisma unique field: `software_copyright_details.registration_no_normalized`;
- dry-run duplicate code: `DUPLICATE_IN_FILE`;
- database conflict warning/error code: `DB_CONFLICT`.

Rows without a normalized software registration number may remain previewable in dry-run, but apply must reject them because repeated exact apply cannot be proven create-only without a durable identifier.

## Apply Validation Rules

The second-type backend apply implementation should:

- Reuse the server-side parse/validation plan from dry-run.
- Reject before opening writes when any row has dry-run errors or warnings.
- Reject when `mode` is not `CREATE_DRAFT_ONLY`.
- Reject any row whose candidate action is not `CREATE_DRAFT`.
- Reject any row whose status is not `VALID`.
- Reject any `SOFTWARE_COPYRIGHT` row missing `registrationNoNormalized`.
- Reject mixed `PAPER` + `SOFTWARE_COPYRIGHT` batches in this slice.
- Reject `PATENT` rows with `UNSUPPORTED_TYPE`.
- Preserve existing `PAPER` DOI behavior.

Transaction-time rechecks for `SOFTWARE_COPYRIGHT`:

- active non-archived department still exists by `departmentCode`;
- active non-archived owner still exists by `ownerEmail`;
- owner still belongs to the target department;
- contributor users with `userEmail` still resolve to active non-archived users;
- normalized software registration number is still absent;
- row still satisfies `SOFTWARE_COPYRIGHT`, `DRAFT`, `CREATE_DRAFT`, and normalized-registration requirements.

The repository must map Prisma unique conflicts on `registration_no_normalized` / `registrationNoNormalized` to a safe `DB_CONFLICT` response.

## Audit Boundary

Recommended audit operation may reuse the existing import operation code:

- `operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT"`;
- `importType: "ACHIEVEMENT"`;
- `mode: "CREATE_DRAFT_ONLY"`;
- `type: "SOFTWARE_COPYRIGHT"`;
- `status: "DRAFT"`;
- `identifierFieldsPresent: ["registrationNo"]`;
- row number, created achievement id, department id, owner user id, and contributor count.

Audit must not record:

- raw CSV content;
- local file path;
- title;
- owner email;
- contributor names or emails;
- raw or normalized software registration number;
- `runEnv`;
- storage keys, checksums, workflow payloads, fee payloads, reminder payloads, raw payloads;
- credentials, cookies, tokens, passwords, private keys, connection strings, AccessKeys, or `.env` content.

## Test And Acceptance Plan

Step 69B backend implementation should run focused API verification:

- Service tests:
  - valid all-`SOFTWARE_COPYRIGHT` apply creates draft inputs with resolved owner/department/contributors;
  - apply re-parses uploaded CSV and rejects client-result-only assumptions;
  - dry-run errors and warnings block apply;
  - missing normalized registration number is rejected for apply;
  - `PATENT` remains rejected;
  - mixed `PAPER` + `SOFTWARE_COPYRIGHT` batch is rejected in the second-type slice;
  - active department, active owner, owner department, contributor user, and registration-number conflicts are rechecked;
  - audit failure rolls back the full transaction.
- Repository tests:
  - one transaction writes only `Achievement`, `SoftwareCopyrightDetail`, `AchievementContributor`, and audit rows;
  - no workflow, attachment, fee, reminder, notification, search, or resource grant writes are called;
  - Prisma unique conflict on `registrationNoNormalized` maps to safe `DB_CONFLICT`.
- Controller/AppModule tests:
  - existing auth, permission, multipart, file, mode, and route wiring behavior remain intact.

Step 69C local production-like API acceptance may follow only after Step 69B:

- Use synthetic `S69C_*` local data only.
- Verify created `DRAFT` software copyright achievements, software detail rows, contributor rows, and audit operation counts.
- Verify repeated exact apply returns safe `DB_CONFLICT` and creates no additional business rows.
- Verify forbidden side-effect deltas remain 0 for workflow, attachment, fee, reminder, notification, search, and resource grant tables.
- Record only status codes, counts, safe error codes, and redacted IDs if needed.

Web should wait:

- Step 69D should design Web expansion only after backend API acceptance.
- Step 69E may implement Web expansion.
- Step 69F may run local production-like Web acceptance.
- Web should not add `SOFTWARE_COPYRIGHT` apply eligibility before backend API acceptance proves repeat-apply and forbidden-side-effect behavior.

## Recommended Follow-Up Steps

1. Step 69B: implement backend-only `SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` apply support with focused API tests.
2. Step 69C: run local production-like API acceptance for synthetic software copyright import.
3. Step 69D: design Web expansion for software copyright apply eligibility and confirmation copy.
4. Step 69E: implement Web expansion and Web Vitest.
5. Step 69F: run local production-like Web acceptance with synthetic data only.
6. Later: write a separate `PATENT` import fee/reminder boundary plan before enabling patent apply.

## Docs-Only Verification

This Step does not run typecheck/test/build because no runtime source, schema, API, Web, package, lockfile, configuration, migration, or script code is changed.

Required closure checks:

- `git diff --check`.
- Added-lines sensitive-value scan.
- Commit with message `docs: plan achievement import next type`.
- Confirm tracked diff is empty after commit.
- Confirm existing untracked local artifacts remain untouched.
