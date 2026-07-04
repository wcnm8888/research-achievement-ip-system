# Patent Import Fee Reminder Boundary Plan

## Step 70D Web Entry Design Addendum

- Date: 2026-07-04.
- Added `memory-bank/patent-import-web-entry-design.md` as the Web-side design for enabling homogeneous all-`PATENT` apply after Step 70B backend implementation and Step 70C local API acceptance.
- Web apply may be expanded to homogeneous batches only:
  - all-`PAPER`;
  - all-`SOFTWARE_COPYRIGHT`;
  - all-`PATENT`.
- Mixed achievement-type batches must stay disabled before confirmation.
- `PATENT` Web eligibility must require normalized application number on every patent row.
- Grant-only patent rows remain disabled before confirmation.
- The patent Web confirmation must state `CREATE_DRAFT_ONLY`, `DRAFT` only, patent detail rows, contributors, safe audit evidence, backend CSV revalidation, no approval submission, and no workflow/attachment/storage/fee/fee review history/reminder/notification/search/resource grant/import job side effects.
- `nextFeeDate` and `feeAmount` remain excluded from the first Web-enabled patent apply slice; Web confirmation and success copy must not imply fee or reminder import.
- Safe success/error UI must not render raw or normalized patent identifiers, title, owner/contributor person fields, `nextFeeDate`, `feeAmount`, CSV body, credentials, sessions, tokens, secrets, or connection strings.
- Step 70E should be Web-only implementation and tests; Step 70F should be local production-like Web acceptance with synthetic `S70F_*` data.

## Step 70B Implementation Addendum

- Date: 2026-07-04.
- Implemented backend-only all-`PATENT` `CREATE_DRAFT_ONLY` apply support in the existing `POST /api/achievements/import/apply` service path.
- Preserved existing all-`PAPER` and all-`SOFTWARE_COPYRIGHT` apply behavior.
- Apply now allows homogeneous batches only:
  - all-`PAPER`;
  - all-`PATENT`;
  - all-`SOFTWARE_COPYRIGHT`.
- Mixed-type batches continue to reject before opening a transaction.
- `PATENT` apply requires `applicationNoNormalized` for every row.
- `grantNoNormalized` is treated only as an optional second conflict boundary when application number is present.
- Grant-only and no-identifier patent rows reject before writes.
- Transaction-time rechecks cover active non-archived department, active non-archived owner, owner department match, active non-archived contributor users, patent application-number conflicts, optional grant-number conflicts, and final Prisma unique conflict mapping to safe `DB_CONFLICT`.
- The patent transaction writes only:
  - `Achievement(type=PATENT, status=DRAFT)`;
  - `PatentDetail`;
  - `AchievementContributor`;
  - safe audit evidence.
- The import-specific patent detail mapper writes only allowed first-slice fields:
  - `applicationNo`;
  - `applicationNoNormalized`;
  - `grantNo`;
  - `grantNoNormalized`;
  - `patentType`;
  - `filingDate`;
  - `grantDate`;
  - `legalStatus`.
- `nextFeeDate` and `feeAmount` remain dry-run preview fields only in this slice and are not included in `PatentDetail` create data or audit `newValue`.
- Focused API tests and API typecheck passed.
- Still deferred:
  - Web expansion;
  - Docker/browser/local production-like acceptance;
  - production/VPS access;
  - real-data import;
  - workflow, attachment/storage, fee, fee review history, reminder, notification, search, resource grant, import job, submit, approve, reject, archive, void, update, upsert, merge, delete, or existing achievement mutation.

## Step 70A Scope

- Date: 2026-07-04.
- Purpose: design the first safe `PATENT` achievement import apply slice after `PAPER` and `SOFTWARE_COPYRIGHT` reached backend and Web local closure.
- This is a planning-only Step. It does not authorize API/Web implementation, apply API execution, Docker/browser operation, database writes, production/VPS access, production DB/config access, `.env` / `.env.production` content reads, real-data import, schema/migration/package/lockfile/config/script changes, cleanup, deletion, reset, drop, prune, or handling known untracked local artifacts.

## Starting Evidence Reviewed

- Current HEAD: `346b088 test: add software copyright import web acceptance`.
- Tracked diff was empty at start.
- Existing known untracked local artifacts were present and left untouched.
- Reviewed:
  - `memory-bank/testing-strategy.md`;
  - `memory-bank/achievement-import-next-type-safety-plan.md`;
  - `memory-bank/achievement-import-real-write-safety-plan.md`;
  - Step 68A through Step 69G snippets from `memory-bank/progress.md`;
  - `apps/api/src/imports/achievement-import-dry-run.service.ts`;
  - `apps/api/src/imports/achievement-import-dry-run.repository.ts`;
  - targeted Prisma schema snippets for `PatentDetail`, `FeeRecord`, `FeeReviewHistory`, `ReminderTask`, `Notification`, `WorkflowInstance`, `WorkflowTask`, `WorkflowAction`, `SearchLog`, and `ResourceAccessGrant`.

## Decision

The first `PATENT` import apply slice should remain backend-only `CREATE_DRAFT_ONLY`.

Keep the same first-write safety shape proven by `PAPER` and `SOFTWARE_COPYRIGHT`:

- backend-only first;
- mode exactly `CREATE_DRAFT_ONLY`;
- `DRAFT` only;
- create-only;
- all-or-nothing request transaction;
- no partial success;
- no client-supplied dry-run result trust;
- server-side CSV re-parse and revalidation before writes;
- transaction-time rechecks for owner, department, contributors, and normalized patent identifier conflicts;
- safe audit evidence inside the same transaction.

Allowed successful data effects:

- create `Achievement` with `type=PATENT` and `status=DRAFT`;
- create exactly one `PatentDetail`;
- create `AchievementContributor` rows;
- create safe audit evidence for each created achievement.

Everything else remains out of scope for the first `PATENT` slice.

## Durable Duplicate Boundary

Recommended conservative first-slice rule:

- Every `PATENT` apply row must have `applicationNoNormalized`.
- `grantNoNormalized` is optional and should be written/checked only when present.
- Rows with both identifiers must pass both conflict checks.
- Rows with only `applicationNoNormalized` may apply.
- Rows with only `grantNoNormalized` must be rejected in Step 70B.
- Rows with neither normalized identifier must be rejected.

Rationale:

- `PatentDetail.applicationNoNormalized` and `PatentDetail.grantNoNormalized` are separate nullable unique fields.
- The existing dry-run preview already normalizes and conflict-checks `applicationNo` and `patentNo` / `grantNo`.
- Application number is the earlier and more stable import anchor for draft patent records.
- Grant number can arrive later or may be absent for pending patents; requiring application number avoids treating a grant-only row as a durable duplicate proof before the product has explicitly accepted that semantic.
- Grant-only apply can be added later if a follow-up plan defines the operational source, collision handling, and acceptance evidence for historical granted patents without application numbers.

Conflict behavior:

- Same-file duplicate `applicationNoNormalized` remains a hard `DUPLICATE_IN_FILE` error.
- Same-file duplicate `grantNoNormalized` remains a hard `DUPLICATE_IN_FILE` error when grant number is present.
- Existing DB conflict on either normalized identifier remains a warning in dry-run and must block apply.
- Transaction-time recheck must query both `applicationNoNormalized` and `grantNoNormalized` for rows where values are present.
- Prisma unique conflicts on either patent unique field must map to safe `DB_CONFLICT`.
- Safe errors must identify only the field and code; they must not echo raw or normalized patent numbers.

## Fee And Reminder Boundary

`nextFeeDate` and `feeAmount` are `PatentDetail` fields in the current schema, but their names overlap with fee and reminder workflows.

First-slice recommendation:

- Dry-run may continue to preview and validate `nextFeeDate` and `feeAmount` as detail-field inputs.
- Step 70B should not write `nextFeeDate` or `feeAmount` into `PatentDetail`.
- Step 70B should return or display no guarantee that fee/reminder data has been imported.
- Step 70B must not create `FeeRecord`.
- Step 70B must not create `FeeReviewHistory`.
- Step 70B must not create `ReminderTask`.
- Step 70B must not create `Notification`.
- Step 70B audit `newValue` must not include `nextFeeDate`, `feeAmount`, raw fee payloads, or reminder payloads.

Reason for not writing those detail fields in the first patent apply slice:

- The first `PATENT` apply acceptance must prove duplicate safety and forbidden side-effect deltas before any fee-like value is persisted.
- Even though `PatentDetail.nextFeeDate` is not a `ReminderTask` and `PatentDetail.feeAmount` is not a `FeeRecord`, writing them would blur acceptance evidence for a Step whose main purpose is fee/reminder boundary separation.
- A later slice can explicitly decide whether these two detail fields should be persisted without creating fee/reminder side effects, and can add acceptance checks around detail-field deltas separately from `FeeRecord` / `ReminderTask` deltas.

If product needs these fields in Step 70B despite the conservative recommendation, the implementation must first document that they are pure detail metadata and still prove:

- no `FeeRecord` row is created;
- no `FeeReviewHistory` row is created;
- no `ReminderTask` row is created;
- no `Notification` row is created;
- audit does not record the date or amount values.

## Explicitly Forbidden Effects

Step 70B must not:

- create workflow instances, workflow tasks, or workflow actions;
- submit, approve, reject, archive, void, or otherwise move the achievement state machine;
- create or import attachments, storage objects, storage keys, checksums, or attachment metadata;
- create fee records, patent annual fee records, patent application fee records, agency fee records, or other fee rows;
- create fee review history;
- create reminder tasks;
- create notifications;
- write search logs or search index data;
- create resource access grants or secret-read grants;
- create durable import job history or idempotency keys;
- update, upsert, merge, reactivate, archive, void, or delete existing achievements;
- persist uploaded files or raw CSV bodies;
- import real production data;
- access VPS, production DB, production configuration, `.env`, or `.env.production`.

## Patent Detail Field Boundary

Allowed `PatentDetail` fields for Step 70B:

- `applicationNo`;
- `applicationNoNormalized`;
- `grantNo`;
- `grantNoNormalized`;
- `patentType`;
- `filingDate`;
- `grantDate`;
- `legalStatus`.

Deferred from first apply write even though currently present in dry-run preview and schema:

- `nextFeeDate`;
- `feeAmount`.

Required apply blockers:

- unsupported mode;
- dry-run errors;
- dry-run warnings;
- non-`VALID` row;
- non-`CREATE_DRAFT` candidate;
- row type not `PATENT` when Step 70B is implementing the patent-only slice;
- mixed batch with `PAPER`, `SOFTWARE_COPYRIGHT`, or `PATENT` combined with another type;
- missing `applicationNoNormalized`;
- only `grantNoNormalized` without `applicationNoNormalized`;
- transaction-time owner/department/contributor recheck failure;
- transaction-time patent identifier conflict.

## Audit Boundary

Use safe evidence similar to the previous import apply slices:

- `operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT"`;
- `importType: "ACHIEVEMENT"`;
- `mode: "CREATE_DRAFT_ONLY"`;
- `type: "PATENT"`;
- `status: "DRAFT"`;
- `rowNumber`;
- `achievementId`;
- `departmentId`;
- `ownerUserId`;
- `contributorCount`;
- `identifierFieldsPresent`, for example `["applicationNo"]` or `["applicationNo", "grantNo"]`.

Audit must not record:

- raw CSV content;
- local file path;
- title;
- owner email;
- contributor names or emails;
- raw or normalized application number;
- raw or normalized grant number;
- `nextFeeDate`;
- `feeAmount`;
- storage keys, checksums, workflow payloads, fee payloads, reminder payloads, raw payloads;
- credentials, cookies, tokens, passwords, private keys, connection strings, AccessKeys, or `.env` content.

## Step 70B Backend Minimal Implementation Recommendation

Recommended Step 70B:

- Add backend-only all-`PATENT` `CREATE_DRAFT_ONLY` apply support to the existing `POST /api/achievements/import/apply` path.
- Preserve existing all-`PAPER` and all-`SOFTWARE_COPYRIGHT` behavior unchanged.
- In the first patent implementation, reject mixed-type batches.
- Require `applicationNoNormalized` for every patent apply row.
- Allow optional `grantNoNormalized` only when `applicationNoNormalized` is also present.
- Recheck active non-archived department, active non-archived owner, owner department match, active non-archived contributor users, and patent identifier conflicts inside the same transaction.
- Add transaction-scoped repository method that writes only `Achievement`, `PatentDetail`, `AchievementContributor`, and audit rows.
- Map Prisma unique conflicts for `applicationNoNormalized` and `grantNoNormalized` to safe `DB_CONFLICT`.
- Keep `nextFeeDate` and `feeAmount` out of first-slice `PatentDetail` writes and audit evidence.

Focused tests should cover:

- valid all-`PATENT` apply with `applicationNoNormalized` creates draft patent rows;
- optional `grantNoNormalized` is persisted only when application number is present;
- missing application number rejects apply;
- grant-only patent row rejects apply in Step 70B;
- rows with both identifiers conflict if either identifier already exists;
- repeated exact apply returns safe `DB_CONFLICT` and creates no additional business rows;
- dry-run warnings/errors block apply;
- mixed-type batch rejects before writes;
- transaction-time department, owner, owner department, contributor, and patent conflict rechecks;
- audit failure rolls back the full transaction;
- no workflow, attachment, fee, fee review history, reminder, notification, search, resource grant, or import job writes are called.

Step 70C local production-like API acceptance may follow only after Step 70B:

- Use synthetic `S70C_*` local data only.
- Verify created `DRAFT` patent achievements, patent detail rows, contributor rows, and audit operation counts.
- Verify repeated exact apply returns safe `DB_CONFLICT`.
- Verify grant-only and no-identifier rows reject.
- Verify forbidden side-effect deltas remain 0 for workflow, attachment, fee, fee review history, reminder, notification, search, and resource access grant tables.
- Record only status codes, counts, safe error codes, and redacted IDs if needed.

Web expansion should wait:

- `PATENT` Web apply should not be enabled until backend API tests and local API acceptance prove duplicate behavior and forbidden fee/reminder/workflow side-effect deltas.
- A later Web design Step should define type-aware eligibility, confirmation copy, safe result/error display, and fee/reminder boundary text for patent rows.

## Docs-Only Verification

This Step does not run typecheck/test/build because no runtime source, schema, API, Web, package, lockfile, configuration, migration, or script code is changed.

Required closure checks:

- `git diff --check`.
- Added-lines sensitive-value scan.
- Commit with message `docs: plan patent import fee reminder boundary`.
- Confirm tracked diff is empty after commit.
- Confirm existing untracked local artifacts remain untouched.
