# Department Import Apply Web Entry Design

## Step 65D Scope

- Date: 2026-07-02.
- Purpose: design the Web entry, permission boundary, interaction model, and risk controls for department metadata `CREATE_ONLY` apply.
- This document is design-only. It does not implement a Web button, call the apply API, run Docker, write database rows, access production/VPS, modify account credentials, send email, or authorize user/account or achievement real-write import.

## Existing Web Baseline

- `apps/web/src/DepartmentManagement.tsx` already gates the department maintenance page with `hasSystemConfigPermission(authUser)`.
- Without `system:config`, the page renders a 403-style `DataState` and does not request department management APIs.
- The current department import panel is `DepartmentImportDryRunPanel`.
- The current panel only calls `POST /imports/departments/dry-run` through `dryRunDepartmentImport`.
- `DepartmentManagement.test.tsx` explicitly asserts that no real import execution entry is rendered.
- `apps/web/src/importDryRunUi.tsx` provides the shared dry-run shell: file picker, `Run dry-run`, loading/disabled state, error alert, summary, and result table.
- `apps/web/src/api-client.ts` already has a generic `postForm<T>()` path plus the typed `dryRunDepartmentImport()` helper.
- Audit logs are a separate masked readonly page. Department apply should show a safe operation hint/result, not inline unmasked audit payloads.

## Permission Model

- The apply entry should be visible only inside the existing department maintenance page and only when `hasSystemConfigPermission(authUser)` is true.
- The frontend gate is only an affordance boundary; backend `system:config` through the existing guards remains the authority.
- Do not add department-scoped import permissions in this slice.
- Do not expose apply to department administrators, auditors, researchers, or users with only `audit:read` / `audit:read_masked`.
- If the current session is absent, the page should keep the existing no-request behavior.
- If the apply request returns 401 or 403, show a sanitized message and leave the selected file and dry-run result available for review; do not reveal backend internals.

## Apply Eligibility

The Web entry should enable apply only when all of the following are true:

- The selected file still exists in component state.
- The most recent dry-run result exists.
- The intended mode is exactly `CREATE_ONLY`.
- `result.importType === "DEPARTMENT_METADATA"`.
- `result.dryRun === true`.
- `result.summary.totalRows > 0`.
- `result.summary.errorRows === 0`.
- `result.summary.warningRows === 0`.
- `result.summary.createCandidates === result.summary.totalRows`.
- Every row has `status === "VALID"`.
- Every row has `candidateAction === "CREATE"`.
- The user has not changed the selected file since the successful dry-run.
- No apply request is currently in flight.

Warnings must not be allowed in Step 65E. Today department warnings include `EXISTING_CODE`, which means the file is no longer pure create-only. Allowing warnings would blur create-only semantics and make reruns/update-like behavior ambiguous. The backend already rejects dry-run warnings for apply; the Web should mirror that rule before showing the confirmation control.

## File Consistency

- The apply request must upload the same `File` object that produced the eligible dry-run result.
- Changing the file input must clear the dry-run result and apply state.
- Step 65E should store a lightweight client-side file fingerprint at dry-run time: file name, size, lastModified, and the dry-run result file metadata.
- Before opening the confirmation modal and before submit, recheck the current `File` metadata against that fingerprint.
- Do not persist uploaded file content in browser storage.
- Do not let users edit CSV content in the Web page.
- The server must still re-parse and revalidate the uploaded file; the client-side fingerprint is only duplicate-submit and stale-result prevention.

## Confirmation Interaction

The apply control should not appear as the primary action until an eligible dry-run result exists. Recommended interaction:

- Keep `Run dry-run` as the first action.
- Show a secondary `Apply create-only` button only after eligibility passes.
- If eligibility fails, show a disabled apply affordance or compact status text explaining the first blocking reason.
- Opening apply should present a confirmation modal with:
  - Operation: create department metadata only.
  - Mode: `CREATE_ONLY`.
  - Endpoint: `POST /imports/departments/apply`.
  - Created row count that will be requested.
  - Statement that update/upsert/delete/merge/reactivation are not supported.
  - Statement that backend revalidates the uploaded CSV and may still reject the request.
  - Environment boundary copy: local production-like acceptance is not production/VPS readiness; production use needs separate authorization.
- The confirmation modal should require a deliberate confirm button. No checkbox is necessary unless product later requires typed confirmation.

## In-Flight State

- Use a separate `applySubmitting` state from dry-run loading.
- Disable file input, dry-run button, and apply button while apply is in flight.
- Ignore or block duplicate submit while `applySubmitting` is true.
- Keep the confirmation modal confirm button in loading state while the request is active.
- If the request fails, close nothing automatically unless the result is clear; show sanitized error details in the panel or modal.
- If the request succeeds, close the modal, show the apply summary, clear apply error, and refresh department list/tree/detail views.

## Error Handling

- 400: show a safe rejected summary from the apply response, including error codes and row counts. This covers stale dry-run, duplicate code, unknown parent, or file inconsistency discovered by server revalidation.
- 401: show session-expired or re-authentication copy. Do not mention session values.
- 403: show permission-denied copy tied to `system:config`.
- 409: treat as create-only conflict or concurrent write conflict if returned by the backend.
- 5xx/network: show service unavailable/retry copy.
- Do not display stack traces, raw request bodies, local paths, credentials, cookies, tokens, connection strings, private keys, or uploaded file content.

## Apply Result Display

After apply, show a compact result panel:

- `mode`: `CREATE_ONLY`.
- `createdRows`.
- `skippedRows` / `failedRows` if present.
- `errorCount` and safe error codes when rejected.
- `auditOperation`: `DEPARTMENT_IMPORT_CREATE`.
- A short note that audit rows are written by the backend in the same transaction as department creation.
- Link or hint to the masked audit log page may be shown only as a navigation hint; do not inline raw audit payloads.
- The successful apply result should not claim production readiness.

## Deferred Boundaries

Step 65E must still defer:

- Web apply for user/account import.
- Web apply for achievement import.
- Department update/upsert/delete/merge/reactivation.
- Production/VPS write execution.
- Batch real-data import.
- Password creation, modification, or reset.
- Invite/reset token flow.
- DirectMail or real email.
- Persisted import job history or durable idempotency keys.
- Any claim that local production-like acceptance equals production readiness.

## Step 65E Implementation Recommendation

Step 65E should implement the smallest Web slice:

1. Add typed department apply request/response types matching the current backend summary.
2. Add `applyDepartmentImport({ file, mode: "CREATE_ONLY" })` to the API client using multipart form data.
3. Extend only `DepartmentImportDryRunPanel` / `DepartmentManagement.tsx` with apply eligibility, confirmation modal, in-flight state, safe result display, and stale-file reset.
4. Add Web Vitest coverage for permission gating, eligibility with no warnings/errors, warning/error disabled state, file-change reset, duplicate-submit disabled state, sanitized 401/403/400 handling, and successful summary rendering.
5. Run `corepack pnpm --filter @research-ip/web test -- DepartmentManagement api-client` and `corepack pnpm --filter @research-ip/web typecheck`.

Do not add browser or Docker acceptance in Step 65E unless explicitly requested; a later Step can do local production-like UI acceptance after the Web control lands.
