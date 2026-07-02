# Achievement Import Apply Web Entry Design

## Step 68D Scope

- Date: 2026-07-02.
- Purpose: design the smallest Web entry for the already implemented and locally accepted backend `PAPER` achievement import apply slice.
- This document is design-only. It does not implement Web code, call the apply API, run Docker, run browser acceptance, write database rows, access production/VPS, read production configuration, or authorize patent/software copyright import apply.

## Existing Web Baseline

- `apps/web/src/Achievements.tsx` already renders `AchievementImportDryRunPanel` above the achievement list when the current user has `system:config`.
- The current panel calls only `POST /achievements/import/dry-run` through `dryRunAchievementImport`.
- `AchievementImportDryRunResultView` displays dry-run summary, sanitized column metadata, row statuses, candidate actions, errors, warnings, contributor preview, and normalized identifier preview.
- `apps/web/src/importDryRunUi.tsx` provides the shared shell: CSV picker, `Run dry-run`, loading/disabled state, error alert, result summary, table rendering, `extraActions`, and `afterResult`.
- `apps/web/src/api-client.ts` already supports multipart form requests and typed import helpers for department and user/account apply.
- `apps/web/src/types.ts` currently has achievement dry-run types but no achievement apply request/response types.
- `Achievements.test.ts` currently asserts that the achievement import panel does not render a real execution entry.

The Web entry should be added adjacent to the existing achievement import dry-run controls, not as a separate page and not as a primary achievement creation action.

## Permission Model

- Show the achievement import apply affordance only when `authUser.permissionCodes` includes `system:config`.
- Reuse the same visibility boundary as `hasAchievementImportDryRunPermission(authUser)`.
- Frontend gating is only an affordance; backend `UserContextGuard` and `PermissionGuard` remain the final authority.
- Do not introduce department-scoped achievement import permissions in the Web slice.
- Do not show apply to users with only achievement create/update/read permissions, department admin permissions, auditor permissions, or fee/workflow permissions.
- If an apply request returns 401 or 403, show a sanitized session/permission message and keep the current file/dry-run result available for review.

## Web State Machine

Recommended state kept in `Achievements.tsx` or a small local helper:

- `importFile: File | null`.
- `importLoading: boolean` for dry-run only.
- `importError: ApiError | null` for dry-run errors.
- `importResult: AchievementImportDryRunResult | null`.
- `importFingerprint: AchievementImportFileFingerprint | null`, set only after a successful dry-run.
- `applySubmitting: boolean`.
- `applyConfirmOpen: boolean`.
- `applyError: AchievementImportApplySafeError | null`.
- `applyResult: AchievementImportApplyResult | null`.

State transitions:

- File selected:
  - validate CSV using existing `validateAchievementImportCsvFile`;
  - set `importFile`;
  - clear `importResult`, `importFingerprint`, `applyResult`, `applyError`, and `applyConfirmOpen`.
- Dry-run started:
  - block if no valid file or dry-run/apply is in flight;
  - clear apply result/error because the preview is being replaced.
- Dry-run success:
  - store result;
  - store fingerprint from the current `File` plus returned file metadata;
  - recompute apply eligibility.
- Dry-run failure:
  - clear result and fingerprint;
  - show existing dry-run error state.
- Apply confirmation opened:
  - recompute eligibility and fingerprint match immediately before opening;
  - if ineligible, keep modal closed and show the first blocking reason.
- Apply submitted:
  - recompute eligibility and fingerprint match again;
  - submit the same `File` object with `mode=CREATE_DRAFT_ONLY`;
  - disable file picker, dry-run, and apply controls while in flight.
- Apply success:
  - close confirmation;
  - set safe apply result;
  - clear apply error;
  - refresh the achievement list through existing `loadAchievements`.
- Apply failure:
  - close nothing automatically unless the UI has a clear result panel;
  - show safe rejected summary or sanitized API error;
  - do not clear the dry-run result unless the selected file changed.

## File Consistency

Step 68E should add a client-side fingerprint to prevent accidental dry-run/apply mismatch:

```ts
type AchievementImportFileFingerprint = {
  name: string;
  size: number;
  lastModified: number;
  resultFileName: string;
  resultFileSize: number;
  resultEncoding: string;
};
```

Fingerprint rules:

- Set fingerprint only after dry-run success.
- Compare current file `name`, `size`, and `lastModified` before opening confirmation and before submit.
- Compare dry-run result file `name`, `size`, and `encoding` with the stored result metadata.
- Changing the file input clears all apply state.
- Do not persist file content or fingerprint in browser storage.
- Do not let users edit CSV content in the Web page.
- The backend still re-parses and revalidates the uploaded CSV; the fingerprint is only a stale-result prevention control.

## Apply Eligibility

Enable apply only when all of these are true:

- Current user has `system:config`.
- `importFile` exists.
- `importResult` exists.
- `importFingerprint` matches the current file and the current dry-run result.
- Intended mode is exactly `CREATE_DRAFT_ONLY`.
- `importResult.importType === "ACHIEVEMENT"`.
- `importResult.dryRun === true`.
- `importResult.summary.totalRows > 0`.
- `importResult.summary.errorRows === 0`.
- `importResult.summary.warningRows === 0`.
- `importResult.summary.validRows === importResult.summary.totalRows`.
- `importResult.summary.createDraftCandidates === importResult.summary.totalRows`.
- `importResult.summary.duplicateIdentifierRows === 0`.
- `importResult.summary.dbConflictRows === 0`.
- Every row has `status === "VALID"`.
- Every row has `candidateAction === "CREATE_DRAFT"`.
- Every row has `parsed.type === "PAPER"`.
- Every row has `parsed.normalizedIdentifiers.doi`.
- No row has `parsed.type === "PATENT"` or `parsed.type === "SOFTWARE_COPYRIGHT"`.
- No row has errors or warnings.
- No dry-run or apply request is currently in flight.

Blocking reason priority:

1. Missing `system:config`.
2. No selected CSV file.
3. No successful dry-run for the selected file.
4. File changed since dry-run.
5. Dry-run has errors.
6. Dry-run has warnings, including `DB_CONFLICT`.
7. Non-`PAPER` rows are present.
8. One or more `PAPER` rows lack normalized DOI.
9. Non-`CREATE_DRAFT` candidates are present.
10. Request is in flight.

Warnings must block apply. Current `DB_CONFLICT` warnings mean repeated apply or existing normalized identifier review is needed; the backend rejects these and the Web should mirror that rule before confirmation.

## Confirmation Modal

Open a deliberate confirmation modal only after eligibility passes.

Required confirmation copy:

- Operation: create draft paper achievements from this CSV.
- Mode: `CREATE_DRAFT_ONLY`.
- Endpoint: `POST /achievements/import/apply`.
- Requested create count from the eligible dry-run.
- This will create `DRAFT` `PAPER` achievements.
- This will create matching paper detail rows.
- This will create contributor rows.
- This will write safe audit evidence.
- This will not submit achievements for approval.
- This will not approve, reject, archive, void, or otherwise move the achievement state machine.
- This will not create workflow instances, workflow tasks, attachments/storage objects, fee records, reminders, notifications, search records, resource grants, or import jobs.
- Patent and software copyright apply are not supported in this slice.
- The backend will re-read and revalidate the uploaded CSV and may still reject the request.
- Local production-like acceptance from Step 68C is not production/VPS acceptance.

The primary button should be explicit, such as `Apply draft-only PAPER import`. Keep `Run dry-run` as the first workflow step and keep apply as a secondary action after dry-run.

## API Client And Types

Step 68E should add Web types that mirror the backend result shape without exposing raw CSV content:

```ts
export type AchievementImportApplyMode = "CREATE_DRAFT_ONLY";

export type AchievementImportApplyInput = {
  file: File;
  mode: AchievementImportApplyMode;
};

export type AchievementImportApplyErrorSummary = {
  rowNumber: number | null;
  field: string;
  code: string;
  message: string;
};

export type AchievementImportApplyRow = {
  rowNumber: number;
  status: "CREATED";
  createdAchievementId: string;
  type: "PAPER";
  achievementStatus: "DRAFT";
  departmentId: string;
  ownerUserId: string;
  contributorCount: number;
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
};

export type AchievementImportApplyResult = {
  importType: "ACHIEVEMENT";
  dryRun: false;
  mode: AchievementImportApplyMode;
  file: AchievementImportDryRunResult["file"];
  summary: {
    totalRows: number;
    createdAchievementsCount: number;
    createdPaperDetailsCount: number;
    createdContributorsCount: number;
    skippedRows: number;
    failedRows: number;
    errorCount: number;
    warningCount: number;
    auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
  };
  errors: AchievementImportApplyErrorSummary[];
  rows: AchievementImportApplyRow[];
};
```

Add `applyAchievementImport(input)` to `AccountManagementApiClient` and `createApiClient`:

- Build `FormData`.
- Append `mode`.
- Append `file`.
- Call `requestForm("/achievements/import/apply", ...)`.
- Do not set a manual multipart content type.
- Keep `credentials: "include"` through existing `requestForm`.

## Safe Success Display

After a successful apply, display only a compact safe summary:

- `mode=CREATE_DRAFT_ONLY`.
- Created achievement count.
- Created paper detail count.
- Created contributor count.
- Audit operation `ACHIEVEMENT_IMPORT_CREATE_DRAFT`.
- Total rows.
- `DRAFT only`.
- `No workflow created`.
- `No attachment/storage created`.
- `No fee/reminder/notification/search/resource grant created`.
- `Patent/software apply not supported`.

Do not display in the apply result panel:

- raw CSV content;
- raw DOI values or normalized DOI values;
- title or abstract;
- owner email;
- contributor email/name;
- local file paths;
- session values or credential material;
- backend stack traces.

The backend currently returns created IDs and owner/department IDs in rows. The Web should avoid rendering per-row created IDs in the default result panel. If future troubleshooting needs IDs, use a masked/copy-protected diagnostics mode with a separate decision.

## Safe Error Display

For rejected apply responses, show:

- HTTP status category through existing `ApiError`.
- `summary.failedRows`, `summary.errorCount`, `summary.warningCount` when available.
- Unique safe error codes, such as:
  - `REQUIRED`;
  - `UNSUPPORTED_TYPE`;
  - `UNSUPPORTED_CANDIDATE_ACTION`;
  - `DB_CONFLICT`;
  - `OWNER_NOT_FOUND`;
  - `OWNER_DEPARTMENT_MISMATCH`;
  - `CONTRIBUTOR_USER_NOT_FOUND`;
  - `UNKNOWN_DEPARTMENT`.
- First blocking reason in plain business copy.

Do not show:

- raw DOI or normalized DOI values;
- owner or contributor email;
- contributor name;
- CSV cell values;
- uploaded file content;
- stack traces;
- local paths;
- credential/session/token/cookie/secret/connection-string/private-key material.

For 400 responses, prefer safe codes/counts over `detail` if the detail could echo row-specific user data. For 401/403, show permission/session copy. For network/5xx, say that the request outcome is unknown and the operator should dry-run again before retrying apply.

## State Refresh

- On apply success, call `loadAchievements()` after closing the modal.
- Keep filters/pagination unchanged; imported drafts may or may not appear depending on current filters.
- Show a compact note when current filters might hide newly created drafts, for example when the list is filtered to non-`DRAFT` status or non-`PAPER` type.
- Do not auto-open created achievement details.
- Do not submit, approve, archive, or attach files after apply success.

## Test Plan For Step 68E

Web Vitest should cover:

- `applyAchievementImport` posts multipart form data to `/achievements/import/apply` with `mode=CREATE_DRAFT_ONLY`.
- No manual multipart content type is set.
- Existing dry-run helper remains unchanged.
- Apply entry is hidden without `system:config`.
- Apply entry is not visible before a successful dry-run.
- Eligible `PAPER` dry-run enables apply.
- `PATENT` and `SOFTWARE_COPYRIGHT` rows disable apply and show a safe reason.
- Missing normalized DOI disables apply and shows a safe reason.
- Any dry-run errors disable apply.
- Any dry-run warnings disable apply.
- `DB_CONFLICT` warning disables apply.
- Non-`CREATE_DRAFT` candidate disables apply.
- File change after dry-run clears apply state or makes fingerprint mismatch block apply.
- Confirmation modal includes draft-only, no approval, no workflow, no attachment/storage, no fee, no notification/search/resource grant, and no patent/software apply copy.
- Duplicate submit is blocked while `applySubmitting` is true.
- Successful apply renders only summary counts and audit operation, not raw identifiers or person fields.
- 400 rejected apply renders safe error codes/counts.
- 401/403 errors render sanitized permission/session copy.
- Success refreshes the achievement list through existing `loadAchievements`.

Recommended commands for Step 68E:

```powershell
corepack pnpm --filter @research-ip/web test -- Achievements api-client
corepack pnpm --filter @research-ip/web typecheck
```

No Docker, browser acceptance, API typecheck, or backend tests are required for Step 68E unless the implementation unexpectedly changes shared API contracts.

## Step 68E Minimum Implementation Scope

Step 68E should implement only:

1. Achievement apply request/response types in `apps/web/src/types.ts`.
2. `applyAchievementImport({ file, mode: "CREATE_DRAFT_ONLY" })` in `apps/web/src/api-client.ts`.
3. Achievement import apply eligibility helper and file fingerprint helper, preferably exported for tests from `apps/web/src/Achievements.tsx` or a small Web-only helper.
4. `AchievementImportDryRunPanel` extension using existing `ImportDryRunPanelShell.extraActions` / `afterResult`.
5. Confirmation modal and safe result/error display.
6. `Achievements.test.ts` and `api-client.test.ts` coverage for the rules above.
7. Memory-bank progress/evidence updates.

Step 68E must not change:

- API backend code.
- Prisma schema or migrations.
- package or lockfile.
- Web routes outside the existing achievements import area.
- Achievement create/edit/detail business behavior.
- Docker or production-like acceptance.

## Step 68F Local Production-Like Web Acceptance Recommendation

After Step 68E lands, Step 68F can run local production-like Web acceptance if explicitly authorized:

- Use local Docker production-like Web/API/DB only.
- Use synthetic `S68F_*` local data only.
- Use a safe local session/proxy or synthetic harness that does not record credential/session values.
- Verify the visible Web flow:
  - system-config user sees dry-run and apply entry;
  - limited user does not see apply or receives 403 safely;
  - eligible `PAPER` CSV enables confirmation;
  - confirmation copy includes draft-only and forbidden-effect boundaries;
  - success shows safe counts and refreshes list;
  - repeated apply shows safe conflict and no extra row count;
  - warning/error/missing DOI/non-PAPER dry-runs keep apply disabled;
  - result and error UI do not show raw identifiers, person fields, uploaded CSV body, or credential/session material.
- Verify forbidden side-effect counts remain unchanged through an API/container helper, following Step 68C count categories.
- Record only status codes, counts, safe error codes, and redacted UI observations.

Step 68F should not claim production/VPS readiness and should not add patent/software copyright apply.
