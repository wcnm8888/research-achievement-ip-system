# Achievement Import SOFTWARE_COPYRIGHT Web Entry Design

## Step 69E Scope

- Date: 2026-07-04.
- Purpose: design the smallest safe Web expansion after backend `SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` apply passed API tests and local production-like API acceptance.
- This is design-only. It does not implement Web/API code, call the apply API, run Docker/browser acceptance, write database rows, access production/VPS, read `.env` / `.env.production`, clean local artifacts, delete files, reset state, drop data, prune Docker, or authorize real-data import.

## Existing Web Baseline

- `apps/web/src/Achievements.tsx` already renders the achievement CSV dry-run panel for users with `system:config`.
- Existing Web apply entry is dry-run gated and file-fingerprint gated.
- Existing apply helper posts multipart form data to `POST /achievements/import/apply` with `mode=CREATE_DRAFT_ONLY`.
- Existing Web apply eligibility allows only all-`PAPER` rows and requires normalized DOI on every row.
- Existing confirmation/result copy is hard-coded to `PAPER`.
- Existing Web apply result type has `AchievementImportApplyRow.type: "PAPER"` and summary includes `createdPaperDetailsCount`, but not `createdSoftwareCopyrightDetailsCount`.
- Existing dry-run table previews normalized identifiers, owner/contributor fields, and type-specific status; the new apply result/error panel must remain stricter than dry-run preview and must not render raw or normalized registration numbers or person fields.

## Design Decision

Expand the existing Web apply entry from `PAPER`-only to type-homogeneous `PAPER` or `SOFTWARE_COPYRIGHT` batches.

Allowed after the Step 69E implementation:

- all-`PAPER` `CREATE_DRAFT_ONLY` batches;
- all-`SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` batches.

Still forbidden:

- mixed `PAPER` + `SOFTWARE_COPYRIGHT` batches;
- any `PATENT` apply;
- any row with dry-run errors or warnings;
- `SOFTWARE_COPYRIGHT` rows without `parsed.normalizedIdentifiers.registrationNo`;
- `PAPER` rows without `parsed.normalizedIdentifiers.doi`;
- any non-`CREATE_DRAFT` candidate;
- any non-`DRAFT` status;
- any workflow, attachment/storage, fee, reminder, notification, search, resource grant, import job, submit, approve, reject, archive, void, update, upsert, merge, delete, or existing achievement mutation.

## Permission And Placement

- Keep the same placement inside `AchievementImportDryRunPanel`.
- Keep the same permission affordance: show apply only for users with `system:config`.
- Keep backend guards as authoritative; Web gating is only an operator affordance.
- Do not add department-scoped import permission logic.
- Keep apply as a secondary action after successful dry-run, not as a standalone achievement creation path.

## Type Contract Changes

`apps/web/src/types.ts` should change the achievement apply contract to include software copyright rows and summary counts:

```ts
export type AchievementImportApplyRow = {
  rowNumber: number;
  status: "CREATED";
  createdAchievementId: string;
  type: "PAPER" | "SOFTWARE_COPYRIGHT";
  achievementStatus: "DRAFT";
  departmentId: string;
  ownerUserId: string;
  contributorCount: number;
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
};
```

`AchievementImportApplyResult.summary` should add:

```ts
createdSoftwareCopyrightDetailsCount: number;
```

The Web result panel may read that count, but should not render per-row created IDs, owner IDs, department IDs, raw identifiers, normalized identifiers, titles, owner email, contributor names/emails, `runEnv`, CSV content, local paths, cookies, sessions, tokens, credentials, stack traces, or connection strings.

## Eligibility Rules

Keep all existing generic blockers:

- current user has `system:config`;
- selected file exists;
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

- If any row has `parsed.type === "PATENT"`, block with safe copy: `PATENT apply is not enabled yet.`
- If all rows are `PAPER`, require every row to have `parsed.normalizedIdentifiers.doi`.
- If all rows are `SOFTWARE_COPYRIGHT`, require every row to have `parsed.normalizedIdentifiers.registrationNo`.
- If rows contain both `PAPER` and `SOFTWARE_COPYRIGHT`, block with safe copy: `Mixed PAPER and SOFTWARE_COPYRIGHT batches must be split before apply.`
- If rows include any other type or missing type, block with safe copy: `Only all-PAPER or all-SOFTWARE_COPYRIGHT batches can be applied.`

Recommended helper result shape:

```ts
type AchievementImportApplyEligibleType = "PAPER" | "SOFTWARE_COPYRIGHT";

type AchievementImportApplyEligibility = {
  eligible: boolean;
  reason: string;
  applyType: AchievementImportApplyEligibleType | null;
};
```

The `applyType` should be recomputed before opening confirmation and before submitting, not trusted from previous render state.

## Blocking Reason Priority

Use this priority to avoid confusing messages:

1. Missing `system:config`.
2. No selected CSV file.
3. No successful dry-run for the selected file.
4. File changed since dry-run.
5. Request in flight.
6. Dry-run has errors.
7. Dry-run has warnings, including `DB_CONFLICT`.
8. Non-`CREATE_DRAFT` candidate is present.
9. `PATENT` row is present.
10. Mixed `PAPER` + `SOFTWARE_COPYRIGHT` rows are present.
11. Unsupported or missing achievement type is present.
12. All-`PAPER` batch is missing normalized DOI.
13. All-`SOFTWARE_COPYRIGHT` batch is missing normalized software registration number.

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
- Does not create workflow instances, workflow tasks, attachments/storage objects, fee records, reminders, notifications, search records, resource grants, or import jobs.
- Local production-like Web acceptance uses `http://127.0.0.1:14001/api`; that is not production/VPS acceptance.

For `PAPER`:

- State that the action creates draft paper achievements and paper detail rows.
- State that normalized DOI is the duplicate-apply boundary.
- Primary button: `Create DRAFT PAPER achievements`.

For `SOFTWARE_COPYRIGHT`:

- State that the action creates draft software copyright achievements and software copyright detail rows.
- State that normalized software registration number is the duplicate-apply boundary.
- State that fee/reminder records are not created even though software copyright can be fee-related elsewhere in the product.
- Primary button: `Create DRAFT software copyright achievements`.

For `PATENT` and mixed batches, the modal must not open.

## Safe Success Display

The success panel should render type-aware but compact summary counts:

- `mode=CREATE_DRAFT_ONLY`;
- total rows;
- created achievement count;
- created paper detail count when greater than 0 or when the apply type is `PAPER`;
- created software copyright detail count when greater than 0 or when the apply type is `SOFTWARE_COPYRIGHT`;
- created contributor count;
- audit operation;
- `DRAFT only`;
- `No workflow`;
- `No attachment/storage`;
- `No fee/reminder`;
- `No notification/search/resource grant`;
- `No import job`.

The success panel must not render:

- raw DOI;
- raw or normalized software registration number;
- title;
- owner email;
- contributor email/name;
- CSV body;
- local file path;
- `runEnv`;
- cookie, session, token, password, secret, private key, AccessKey, or connection string material;
- per-row created IDs by default.

## Safe Error Display

Rejected apply display should remain code/count based:

- HTTP status category from `ApiError`.
- `summary.failedRows`, `summary.errorCount`, and `summary.warningCount` when present.
- unique safe error codes such as `REQUIRED`, `UNSUPPORTED_TYPE`, `MIXED_TYPE_BATCH`, `DB_CONFLICT`, `OWNER_NOT_FOUND`, `OWNER_DEPARTMENT_MISMATCH`, `CONTRIBUTOR_USER_NOT_FOUND`, and `UNKNOWN_DEPARTMENT`.
- one plain blocking reason.

Do not display backend row messages if they can echo user data. The current `AchievementImportApplyErrorView` already extracts codes only; keep that pattern.

For 401/403:

- show session/permission copy only;
- do not show raw backend detail.

For network or 5xx:

- say the request outcome is unknown;
- ask the operator to run dry-run again before retrying apply;
- do not encourage blind retry from stale preview.

## UI Text And Layout Notes

- Rename the generic action label from `Apply draft-only PAPER import` to a neutral label such as `Apply draft-only import`.
- If eligible, show a small type tag next to the action or inside the status area: `PAPER` or `SOFTWARE_COPYRIGHT`.
- Keep `Run dry-run` as the first workflow step.
- Keep status copy dense and operational; this is an admin tool, not a landing page.
- Keep confirmation content as short paragraphs or compact bullets. Do not add a new page, wizard, or marketing-style explanation.

## Test Plan For Step 69F Implementation

Recommended Web Vitest coverage:

- Existing `PAPER` eligible dry-run still enables apply.
- Eligible all-`SOFTWARE_COPYRIGHT` dry-run enables apply.
- `SOFTWARE_COPYRIGHT` eligibility requires `normalizedIdentifiers.registrationNo`.
- Mixed `PAPER` + `SOFTWARE_COPYRIGHT` dry-run disables apply with safe reason.
- `PATENT` row disables apply with safe reason.
- Warnings, `DB_CONFLICT`, errors, non-`CREATE_DRAFT`, stale fingerprint, missing file, and in-flight request still disable apply.
- `applyAchievementImport` still posts multipart form data with `mode=CREATE_DRAFT_ONLY`.
- Type contract accepts `AchievementImportApplyRow.type === "SOFTWARE_COPYRIGHT"`.
- Success result view renders software detail count and boundary tags.
- Success result view does not render raw or normalized software registration number, title, owner email, contributor email/name, CSV content, or created IDs.
- Error view renders safe codes/counts for `DB_CONFLICT`, `REQUIRED`, `MIXED_TYPE_BATCH`, and `UNSUPPORTED_TYPE`.
- Confirmation copy for `SOFTWARE_COPYRIGHT` includes `CREATE_DRAFT_ONLY`, `DRAFT`, software copyright detail rows, normalized registration duplicate boundary, no workflow, no attachment/storage, no fee/reminder, no notification/search/resource grant, no import job, and server-side CSV revalidation.
- Confirmation copy for `PAPER` remains correct.
- Successful apply still refreshes the achievement list.

Recommended commands for the implementation Step:

```powershell
corepack pnpm --filter @research-ip/web test -- Achievements api-client
corepack pnpm --filter @research-ip/web typecheck
```

No API tests are required for the Web-only implementation unless shared API contracts or backend code are changed.

## Local Production-Like Web Acceptance Recommendation

After Web implementation and Web tests pass, run a separate local production-like Web acceptance Step:

- Use local Docker production-like Web/API/DB only.
- Use `http://127.0.0.1:18081/` for Web and `http://127.0.0.1:14001/api` for API.
- Use synthetic `S69G_*` or next-Step-specific local data only.
- Do not read or output `.env` / `.env.production`.
- Do not use real data.
- Do not clean Docker or local artifacts.

Acceptance should verify:

- system-config user sees dry-run and apply entry;
- limited user cannot use apply and receives safe 403 if the backend is called;
- all-`SOFTWARE_COPYRIGHT` dry-run enables confirmation;
- missing registration, mixed `PAPER` + `SOFTWARE_COPYRIGHT`, `PATENT`, dry-run warning/error, and repeated `DB_CONFLICT` keep apply disabled or safely rejected;
- success creates only draft achievements, software copyright details, contributors, and audit rows;
- forbidden side-effect deltas stay 0 for workflow, attachment, fee, reminder, notification, search, and resource grant tables;
- UI success/error panels do not expose raw registration number, normalized registration number, owner/contributor email/name, CSV content, cookie, session, token, password, secret, private key, AccessKey, or connection string material.

## Recommended Follow-Up Steps

1. Step 69F: implement the Web expansion and Web Vitest coverage.
2. Step 69G: run local production-like Web acceptance with synthetic software copyright data.
3. Later: plan `PATENT` apply only after fee/reminder boundary design is complete.

## Docs-Only Verification

This Step does not run typecheck/test/build because it changes only documentation and memory-bank records, with no runtime source, API, Web, schema, migration, package, lockfile, configuration, or script code changes.

Required closure checks:

- `git diff --check`.
- Added-lines sensitive-value scan.
- Commit with message `docs: design software copyright import web entry`.
- Confirm tracked diff is empty after commit.
- Confirm existing untracked local artifacts remain untouched.
