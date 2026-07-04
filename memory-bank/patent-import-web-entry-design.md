# Patent Import Web Entry Design

## Step 70F Local Web Acceptance Addendum

- Date: 2026-07-04.
- Added local production-like Web acceptance helpers:
  - `memory-bank/step70f-db-helper.mjs`;
  - `memory-bank/step70f-browser-acceptance.js`;
  - `memory-bank/step70f-web-acceptance.mjs`.
- Used local Docker production-like Web/API/Postgres with synthetic `S70F_*` data only.
- Verified system-config user can complete all-`PATENT` dry-run, apply eligibility, confirmation, `CREATE_DRAFT_ONLY` apply, safe result display, and list refresh.
- Verified success creates 2 `DRAFT` `PATENT` achievements, 2 `PatentDetail` rows, 4 contributors, and 2 `ACHIEVEMENT_IMPORT_CREATE_DRAFT` audit rows.
- Verified repeated exact apply returns safe `DB_CONFLICT` and creates no additional achievement/detail/contributor/audit data.
- Verified missing application number, grant-only, no identifier, mixed three-type batch, dry-run warning/`DB_CONFLICT`, and dry-run error keep apply disabled or safely rejected.
- Verified limited user cannot see apply UI and direct apply returns HTTP 403.
- Verified `nextFeeDate` and `feeAmount` persisted counts are 0.
- Verified forbidden side-effect deltas are 0 for workflow instance/task/action, attachment, fee record, fee review history, reminder task, notification, search log, resource access grant, and import job.
- Verification completed:
  - `node memory-bank/step70f-web-acceptance.mjs`: PASS.
  - `corepack pnpm --filter @research-ip/web test -- Achievements api-client`: PASS, 2 files / 63 tests.
  - `corepack pnpm --filter @research-ip/web typecheck`: PASS.
- No backend/API, Prisma schema/migration, package/lockfile/config, production/VPS, real-data, Docker orphan cleanup, or runtime source changes were made in Step 70F.

## Step 70E Implementation Addendum

- Date: 2026-07-04.
- Implemented the planned Web-only minimal slice.
- `AchievementImportApplyRow.type` now accepts `PAPER`, `SOFTWARE_COPYRIGHT`, or `PATENT`.
- `AchievementImportApplyResult.summary` now includes `createdPatentDetailsCount`.
- `AchievementImportApplyResult.summary.createdAuditEventsCount` is accepted as an optional Web field; when the backend does not return it, the success view falls back to the created row count because the backend contract creates one safe audit event per created row.
- Web apply eligibility now returns `applyType: "PAPER" | "SOFTWARE_COPYRIGHT" | "PATENT" | null`.
- Web apply allows:
  - all-`PAPER` rows with normalized DOI on every row;
  - all-`SOFTWARE_COPYRIGHT` rows with normalized registration number on every row;
  - all-`PATENT` rows with normalized application number on every row.
- Web apply still blocks:
  - mixed achievement-type batches;
  - missing paper DOI;
  - missing software registration number;
  - missing patent application number;
  - patent grant-only rows;
  - dry-run errors, warnings, or `DB_CONFLICT`;
  - non-`CREATE_DRAFT` candidates;
  - stale fingerprint;
  - in-flight requests.
- Confirmation copy is type-aware for `PATENT` and states `CREATE_DRAFT_ONLY`, `DRAFT` only, `PatentDetail` rows, contributors, safe audit evidence, `applicationNoNormalized` duplicate boundary, optional `grantNoNormalized` second conflict boundary only with application number, no approval submission, no workflow, no attachment/storage, no fee/reminder, no notification/search/resource grant, no import job, and no `nextFeeDate` / `feeAmount` import or write.
- Success display is type-aware and shows only safe counts, including created achievements, patent details, contributors, audit event count, mode, audit operation, and boundary tags.
- Error display remains code/count based and does not render backend row messages.
- Verification completed:
  - `corepack pnpm --filter @research-ip/web test -- Achievements api-client`: PASS, 2 files / 63 tests.
  - `corepack pnpm --filter @research-ip/web typecheck`: PASS.
- Still not implemented:
  - backend/API changes;
  - Prisma schema/migration changes;
  - package/lockfile/config changes;
  - Docker/browser/local production-like acceptance;
  - workflow, attachment/storage, fee, fee review history, reminder, notification, search, resource grant, import job, or achievement state-machine side effects.

## Step 70D Scope

- Date: 2026-07-04.
- Purpose: design the smallest safe Web expansion after backend `PATENT` `CREATE_DRAFT_ONLY` apply passed API tests and local production-like API acceptance.
- This is design-only. It does not implement Web/API code, call the apply API, run Docker/browser acceptance, write database rows, access production/VPS, read `.env` / `.env.production`, use real data, clean local artifacts, delete files, reset state, drop data, prune Docker, or authorize fee/reminder/workflow side effects.

## Starting Evidence Reviewed

- Current HEAD: `b0c7dcc test: add patent import acceptance`.
- Tracked diff was empty at start.
- Existing known untracked local artifacts were present and left untouched.
- Reviewed:
  - `memory-bank/testing-strategy.md`;
  - `memory-bank/patent-import-fee-reminder-boundary-plan.md`;
  - `memory-bank/achievement-import-software-web-entry-design.md`;
  - Step 70A through Step 70C snippets from `memory-bank/progress.md`;
  - `apps/web/src/Achievements.tsx`;
  - `apps/web/src/Achievements.test.ts`;
  - `apps/web/src/types.ts`;
  - `apps/web/src/api-client.ts`.

## Existing Web Baseline

- `AchievementImportDryRunPanel` already previews `PAPER`, `PATENT`, and `SOFTWARE_COPYRIGHT` rows without writes.
- The apply entry is shown only when the caller wires an apply action, and the page wires it for users with `system:config`.
- The browser apply helper posts multipart form data to `POST /achievements/import/apply` with `mode=CREATE_DRAFT_ONLY`.
- Apply is gated by the selected-file fingerprint so the submitted file must match the dry-run result.
- Current Web apply eligibility allows homogeneous all-`PAPER` and all-`SOFTWARE_COPYRIGHT` batches.
- Current Web eligibility explicitly blocks any `PATENT` row with `PATENT apply is not enabled yet.`
- Current success/error panels already follow the safe-count and safe-code pattern and avoid row messages.
- Current Web result types do not yet include `PATENT` apply rows or `createdPatentDetailsCount`.

## Design Decision

Expand the existing Web apply entry from homogeneous all-`PAPER` or all-`SOFTWARE_COPYRIGHT` to homogeneous all-`PAPER`, all-`SOFTWARE_COPYRIGHT`, or all-`PATENT`.

Allowed after Step 70E implementation:

- all-`PAPER` `CREATE_DRAFT_ONLY` batches;
- all-`SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` batches;
- all-`PATENT` `CREATE_DRAFT_ONLY` batches.

Still forbidden:

- mixed-type batches across `PAPER`, `SOFTWARE_COPYRIGHT`, and `PATENT`;
- `PATENT` rows without `parsed.normalizedIdentifiers.applicationNo`;
- grant-only patent rows, meaning a grant/patent number is present but normalized application number is missing;
- patent rows with neither normalized patent identifier;
- any row with dry-run errors or warnings, including `DB_CONFLICT`;
- any row that is not `VALID`;
- any row that is not a `CREATE_DRAFT` candidate;
- any workflow, attachment/storage, fee, fee review history, reminder, notification, search, resource grant, import job, submit, approve, reject, archive, void, update, upsert, merge, delete, or existing achievement mutation.

The backend remains authoritative. Web gating is an operator affordance and must not weaken backend server-side CSV re-parse and transaction-time rechecks.

## Type Contract Changes For Step 70E

`apps/web/src/types.ts` should add `PATENT` to apply rows:

```ts
export type AchievementImportApplyRow = {
  rowNumber: number;
  status: "CREATED";
  createdAchievementId: string;
  type: "PAPER" | "SOFTWARE_COPYRIGHT" | "PATENT";
  achievementStatus: "DRAFT";
  departmentId: string;
  ownerUserId: string;
  contributorCount: number;
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
};
```

`AchievementImportApplyResult.summary` should add:

```ts
createdPatentDetailsCount: number;
```

`AchievementImportApplyEligibleType` in `apps/web/src/Achievements.tsx` should become:

```ts
type AchievementImportApplyEligibleType = "PAPER" | "SOFTWARE_COPYRIGHT" | "PATENT";
```

No request payload type change is needed because `applyAchievementImport` already posts only the file and `mode=CREATE_DRAFT_ONLY`. The browser must not send a client-selected type as a write authority.

## Eligibility Rules

Keep all existing generic blockers:

- current user has `system:config`;
- selected CSV file exists;
- dry-run result exists;
- file fingerprint matches the selected file and returned dry-run metadata;
- no dry-run or apply request is in flight;
- `importType === "ACHIEVEMENT"`;
- `dryRun === true`;
- `summary.totalRows > 0`;
- `summary.validRows === summary.totalRows`;
- `summary.errorRows === 0`;
- `summary.warningRows === 0`;
- `summary.createDraftCandidates === summary.totalRows`;
- `summary.duplicateIdentifierRows === 0`;
- `summary.dbConflictRows === 0`;
- every row has `status === "VALID"`;
- every row has `candidateAction === "CREATE_DRAFT"`;
- no row has errors or warnings.

Then classify row types:

- all-`PAPER`: require every row to have `parsed.normalizedIdentifiers.doi`;
- all-`SOFTWARE_COPYRIGHT`: require every row to have `parsed.normalizedIdentifiers.registrationNo`;
- all-`PATENT`: require every row to have `parsed.normalizedIdentifiers.applicationNo`;
- all-`PATENT`: allow an optional normalized grant boundary only when application number is present;
- all-`PATENT`: reject grant-only rows before confirmation.

The current dry-run Web type names the grant-side normalized field `patentNo`. Step 70E should treat `parsed.normalizedIdentifiers.patentNo` as the Web contract's grant-number proxy only for eligibility, while all user-facing copy should call the durable requirement `applicationNoNormalized`. It must not display the raw or normalized application/grant values.

Recommended patent-specific blocking reasons:

- `Every PATENT row must have a normalized application number.`
- `PATENT grant-only rows must include a normalized application number before apply.`

Recommended type-mix blocking reason:

- `Mixed achievement type batches must be split before apply.`

## Blocking Reason Priority

Use this priority to avoid misleading messages:

1. Missing `system:config`.
2. No selected CSV file.
3. No successful dry-run for the selected file.
4. File changed since dry-run.
5. Request in flight.
6. Dry-run has errors.
7. Dry-run has warnings, including `DB_CONFLICT`.
8. Non-`CREATE_DRAFT` candidate is present.
9. Mixed achievement types are present.
10. Unsupported or missing achievement type is present.
11. All-`PAPER` batch is missing normalized DOI.
12. All-`SOFTWARE_COPYRIGHT` batch is missing normalized software registration number.
13. All-`PATENT` batch has grant-only rows.
14. All-`PATENT` batch is missing normalized application number.

Warnings must keep blocking apply. Existing or repeated identifiers surface as dry-run warnings and must not open the confirmation modal.

## Confirmation Modal

The modal should use the eligible type to render precise copy.

Shared required copy:

- Mode: `CREATE_DRAFT_ONLY`.
- Endpoint: `POST /achievements/import/apply`.
- The backend will re-read and revalidate the uploaded CSV; the browser dry-run result is not trusted as the write source.
- Creates only `DRAFT` achievements.
- Creates contributor rows.
- Writes safe audit evidence with operation `ACHIEVEMENT_IMPORT_CREATE_DRAFT`.
- Does not submit for approval.
- Does not approve, reject, archive, void, or otherwise move the achievement state machine.
- Does not create workflow instances, workflow tasks, workflow actions, attachments/storage objects, fee records, fee review history, reminder tasks, notifications, search records, resource grants, or import jobs.

For `PATENT`, the confirmation must additionally state:

- creates draft patent achievements and `PatentDetail` rows;
- duplicate-apply boundary requires `applicationNoNormalized`;
- optional grant number is only a second conflict boundary when an application number is present;
- `nextFeeDate` and `feeAmount` are not imported as fees or reminders;
- `nextFeeDate` and `feeAmount` are not written by the first Web-enabled patent apply slice;
- primary button: `Create DRAFT patent achievements`.

For mixed batches, missing application number, grant-only rows, and dry-run warning/error rows, the modal must not open.

## Safe Success Display

The success panel may render type-aware summary counts:

- `mode=CREATE_DRAFT_ONLY`;
- total rows;
- created achievement count;
- created paper detail count when the apply type is `PAPER` or the count is greater than 0;
- created software copyright detail count when the apply type is `SOFTWARE_COPYRIGHT` or the count is greater than 0;
- created patent detail count when the apply type is `PATENT` or the count is greater than 0;
- created contributor count;
- audit operation;
- `DRAFT only`;
- `No workflow`;
- `No attachment/storage`;
- `No fee/reminder`;
- `No notification/search/resource grant`;
- `No import job`.

The success panel must not render:

- raw application number;
- normalized application number;
- raw grant number;
- normalized grant number;
- title;
- owner email or name;
- contributor email or name;
- `nextFeeDate`;
- `feeAmount`;
- CSV body;
- local file path;
- `runEnv`;
- cookie, session, token, password, secret, private key, AccessKey, or connection string material;
- per-row created IDs by default.

## Safe Error Display

Rejected apply display should remain code/count based:

- HTTP status category from `ApiError`;
- `summary.failedRows`, `summary.errorCount`, and `summary.warningCount` when present;
- unique safe error codes such as `REQUIRED`, `UNSUPPORTED_TYPE`, `MIXED_TYPE_BATCH`, `DB_CONFLICT`, `OWNER_NOT_FOUND`, `OWNER_DEPARTMENT_MISMATCH`, `CONTRIBUTOR_USER_NOT_FOUND`, and `UNKNOWN_DEPARTMENT`;
- one plain blocking reason.

Do not display backend row messages if they can echo user data. Do not render raw or normalized patent identifiers, titles, owner/contributor person fields, `nextFeeDate`, `feeAmount`, CSV content, stack traces, local paths, cookies, sessions, tokens, secrets, credentials, or connection strings.

For 401/403:

- show session/permission copy only;
- do not show raw backend detail.

For network or 5xx:

- say the request outcome is unknown;
- ask the operator to run dry-run again before retrying apply;
- do not encourage blind retry from stale preview.

## Step 70E Minimal Implementation Scope

Recommended Step 70E:

- Change only Web runtime/tests needed for the apply entry.
- Add `PATENT` to `AchievementImportApplyEligibleType`.
- Add `PATENT` to `AchievementImportApplyRow.type`.
- Add `createdPatentDetailsCount` to the Web result type.
- Update `formatAchievementImportApplyType`, confirmation button text, result type inference, success count rendering, and confirmation copy for patent.
- Replace the current patent blocker with homogeneous all-`PATENT` eligibility.
- Keep all existing all-`PAPER` and all-`SOFTWARE_COPYRIGHT` behavior unchanged.
- Keep mixed batches disabled before confirmation.
- Require normalized application number for every patent apply row.
- Reject grant-only patent rows before confirmation.
- Preserve file-fingerprint gating and recompute eligibility immediately before submit.
- Preserve `mode=CREATE_DRAFT_ONLY` and do not send a client-chosen type.
- Keep error display code/count based.

Step 70E should not:

- change backend/API implementation;
- change Prisma schema/migrations/package/lockfile/config;
- run Docker/browser/local production-like acceptance;
- create workflow, attachment/storage, fee, fee review history, reminder, notification, search, resource grant, import job, or state-machine side effects;
- show raw or normalized patent identifiers, title, owner/contributor person fields, `nextFeeDate`, or `feeAmount` in apply success/error UI.

Recommended Web Vitest coverage:

- Existing eligible all-`PAPER` dry-run still enables apply.
- Existing eligible all-`SOFTWARE_COPYRIGHT` dry-run still enables apply.
- Eligible all-`PATENT` dry-run enables apply when every row has normalized application number.
- `PATENT` eligibility rejects missing application number.
- `PATENT` eligibility rejects grant-only rows.
- Mixed `PAPER` + `PATENT`, `SOFTWARE_COPYRIGHT` + `PATENT`, and three-type batches disable apply.
- Dry-run warnings/errors and `DB_CONFLICT` still disable apply.
- Stale file fingerprint and in-flight requests still disable apply.
- `applyAchievementImport` still posts multipart form data with `mode=CREATE_DRAFT_ONLY`.
- Confirmation copy for `PATENT` includes `CREATE_DRAFT_ONLY`, `DRAFT`, patent detail rows, application-number duplicate boundary, no approval submission, no workflow, no attachment/storage, no fee/reminder, no notification/search/resource grant, no import job, backend CSV revalidation, and `nextFeeDate` / `feeAmount` exclusion.
- Success result view renders patent detail count and boundary tags.
- Success/error views do not render patent identifiers, title, owner/contributor person fields, `nextFeeDate`, `feeAmount`, CSV content, created IDs, credentials, sessions, tokens, secrets, or connection strings.
- Successful apply still refreshes the achievement list.

Recommended commands for Step 70E:

```powershell
corepack pnpm --filter @research-ip/web test -- Achievements api-client
corepack pnpm --filter @research-ip/web typecheck
```

No API tests are required for Step 70E unless shared API/backend code changes.

## Step 70F Local Web Acceptance Scope

After Step 70E implementation and Web tests pass, run a separate local production-like Web acceptance Step:

- Use local Docker production-like Web/API/DB only.
- Use `http://127.0.0.1:18081/` for Web and `http://127.0.0.1:14001/api` for API.
- Use synthetic `S70F_*` local data only.
- Do not read or output `.env` / `.env.production`.
- Do not use real data.
- Do not clean Docker or local artifacts.

Acceptance should verify:

- system-config user sees dry-run and apply entry;
- limited user cannot use apply and receives safe 403 if the backend is called;
- all-`PATENT` dry-run with normalized application numbers enables confirmation;
- successful Web apply creates only `DRAFT` patent achievements, `PatentDetail` rows, contributors, and safe audit rows;
- repeated exact apply returns safe `DB_CONFLICT` and creates no additional achievement/detail/contributor/audit rows;
- missing application number, grant-only, no identifier, mixed batch, dry-run warning, and dry-run error disable or safely reject apply with no writes;
- `nextFeeDate` and `feeAmount` are not persisted by the first Web-enabled patent apply slice;
- forbidden side-effect deltas stay 0 for workflow instance/task/action, attachment, fee record, fee review history, reminder task, notification, search log, and resource access grant tables;
- UI success/error panels do not expose raw or normalized application number, raw or normalized grant number, title, owner/contributor email/name, `nextFeeDate`, `feeAmount`, CSV content, cookie, session, token, password, secret, private key, AccessKey, or connection string material.

Evidence should record only status codes, counts, safe error codes, and redacted IDs if needed.

## Recommended Follow-Up Steps

1. Step 70E: implement the Web expansion and Web Vitest coverage.
2. Step 70F: run local production-like Web acceptance with synthetic `S70F_*` patent data.
3. Later: explicitly decide whether `PatentDetail.nextFeeDate` and `PatentDetail.feeAmount` may be persisted as pure detail fields without creating fee/reminder rows.

## Docs-Only Verification

This Step does not run typecheck/test/build because it changes only documentation and memory-bank records, with no runtime source, API, Web, schema, migration, package, lockfile, configuration, or script code changes.

Required closure checks:

- `git diff --check`.
- Added-lines sensitive-value scan.
- Commit with message `docs: design patent import web entry`.
- Confirm tracked diff is empty after commit.
- Confirm existing untracked local artifacts remain untouched.
