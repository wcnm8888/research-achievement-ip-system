# User Account Import Apply Web Entry Design

## Step 66D Scope

- Date: 2026-07-02.
- Purpose: design the Web entry, permission boundary, interaction model, and risk controls for user/account import `CREATE_ONLY_PENDING_NO_CREDENTIAL` apply.
- This document is design-only. It does not implement a Web button, call the apply API, run Docker, write database rows, access production/VPS, modify account credentials, send email, or authorize achievement real-write import.

## Existing Web Baseline

- `apps/web/src/AccountManagement.tsx` gates the account management page with `hasSystemConfigPermission(authUser)`.
- Without `system:config`, the page renders a 403-style `DataState` and does not request account management APIs.
- Without a session/business context, the page keeps the existing no-request behavior.
- The current user/account import panel is `UserAccountImportDryRunPanel`.
- The current panel only calls `POST /users/import/dry-run` through `dryRunUserAccountImport`.
- The dry-run view shows safe parsed fields, status, candidate action, errors, warnings, and the `employeeNo` database-check boundary.
- `apps/web/src/importDryRunUi.tsx` provides the shared dry-run shell: file picker, `Run dry-run`, loading/disabled state, error alert, summary, and result table.
- `apps/web/src/api-client.ts` already has multipart form request patterns and a user/account dry-run helper; the future apply helper should mirror the department apply helper shape.
- Step 66C local production-like API acceptance used a temporary staging identity harness to avoid credentials and sessions; it is not production session-cookie auth acceptance.

## Permission Model

- The apply entry should be visible only inside the existing account management page and only when `hasSystemConfigPermission(authUser)` is true.
- Frontend visibility is only an affordance boundary; backend `system:config` through the existing guards remains the authority.
- Do not add department-admin, scoped account-import, invite, reset, audit-only, or lifecycle permissions for this first Web entry.
- `account:invite` and `account:reset_password` are not sufficient for import apply.
- If the apply request returns 401 or 403, show sanitized session/permission copy and leave the file and dry-run result available for review.
- Do not expose backend internals, request bodies, session material, or unmasked audit payloads in the browser.

## Apply Eligibility

The Web entry should enable apply only when all of the following are true:

- The selected file still exists in component state.
- The most recent dry-run result exists.
- The intended mode is exactly `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- `result.importType === "USER_ACCOUNT"`.
- `result.dryRun === true`.
- `result.summary.totalRows > 0`.
- `result.summary.errorRows === 0`.
- `result.summary.warningRows === 0`.
- `result.summary.createCandidates === result.summary.totalRows`.
- `result.summary.existingUserRows === 0`.
- `result.summary.existingRoleAssignmentRows === 0`.
- `result.summary.reactivationCandidateRows === 0`.
- `result.summary.employeeNoDbConflictCheck === "NOT_AVAILABLE"` is displayed as a schema boundary, not as a database uniqueness pass.
- Every row has `status === "VALID"`.
- Every row has `candidateAction === "CREATE_PENDING_USER"`.
- Every row has `parsed.status === "PENDING_ACTIVATION"`.
- Every row has `parsed.credentialAction === "NO_CREDENTIAL"`.
- Every row has `parsed.scopeType === "DEPARTMENT"` or an omitted scope that the backend dry-run normalized to the department default.
- No row has `parsed.roleCode === "SYSTEM_ADMIN"` or any future global high-privilege equivalent.
- The selected file has not changed since the successful dry-run.
- No dry-run or apply request is currently in flight.

Warnings must block Step 66E. Current user/account warnings include existing users, existing role assignments, and revoked role assignments. Those cases require product semantics beyond create-only pending records and must remain non-writable in the first Web entry.

## File Consistency

- The apply request must upload the same `File` object that produced the eligible dry-run result.
- Changing the file input must clear the dry-run result, apply result, apply error, and apply confirmation state.
- Step 66E should store a lightweight client-side file fingerprint at successful dry-run time: file name, size, lastModified, and the dry-run result file metadata.
- Before opening confirmation and before submit, recheck the current `File` metadata against that fingerprint.
- Do not persist uploaded file content in browser storage.
- Do not let users edit CSV content in the Web page.
- The server must still re-parse and revalidate the uploaded file; the client-side fingerprint only prevents stale-result and duplicate-submit mistakes.

## Confirmation Interaction

The apply control should remain secondary to dry-run. Recommended interaction:

- Keep `Run dry-run` as the first action.
- Show a secondary `Apply pending no-credential` button only after eligibility passes.
- If eligibility fails, show a disabled apply affordance or compact status text explaining the first blocking reason.
- Opening apply should present a confirmation modal with:
  - Operation: create pending user/account records only.
  - Mode: `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
  - Endpoint: `POST /users/import/apply`.
  - Requested create count from the eligible dry-run.
  - Statement that only `PENDING_ACTIVATION` users will be created.
  - Statement that only department-scoped initial `UserRole` rows will be created.
  - Statement that no `UserCredential` will be created.
  - Statement that no password is generated or reset.
  - Statement that no session, invite token, reset token, lifecycle token, or login activation is created.
  - Statement that no email is sent.
  - Statement that backend re-parses and revalidates the uploaded CSV and may still reject the request.
  - Environment boundary copy: local production-like acceptance is not production/VPS readiness, and Step 66C did not cover production session-cookie auth.
- The confirmation modal should require a deliberate confirm button. No typed confirmation is necessary unless product later requires it.

## In-Flight State

- Use a separate `applySubmitting` state from dry-run loading.
- Disable file input, dry-run button, and apply button while apply is in flight.
- Ignore or block duplicate submit while `applySubmitting` is true.
- Keep the confirmation modal confirm button in loading state while the request is active.
- Recompute eligibility before submit, not only before opening the modal.
- If the request fails, close nothing automatically unless the result is unambiguous; show sanitized error details in the panel or modal.
- If the request succeeds, close the modal, show the apply summary, clear apply error, and refresh the account list/detail only through existing safe account APIs.

## Error Handling

- 400: show a safe rejected summary from the apply response, including error codes and row counts. This covers server revalidation failures, stale dry-run assumptions, duplicates, warnings, inactive/missing departments, high-privilege roles, or conflict races.
- 401: show session-expired or sign-in copy. Do not mention or display session values.
- 403: show permission-denied copy tied to `system:config`.
- 409: treat as a create-only conflict if the backend later returns it separately.
- 5xx/network: show service unavailable/retry copy and state that no Web apply result was recorded.
- Do not display stack traces, raw request bodies, local paths, uploaded file content, credential material, cookies, tokens, connection strings, private keys, or mail payloads.

## Apply Result Display

After apply, show a compact result panel:

- `mode`: `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Created users count.
- Created roles count.
- Skipped / failed count if present.
- Safe error code / rejected summary when rejected.
- `auditOperation`: `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL`.
- A clear note that created users are `PENDING_ACTIVATION`.
- A clear note that imported users have no credential and no login capability.
- A short note that audit rows are written by the backend in the same transaction as user and role creation.
- A link or hint to the masked audit log page may be shown only as navigation; do not inline raw audit payloads.
- The successful apply result should not claim production/VPS readiness or production session-cookie auth acceptance.

## Deferred Boundaries

Step 66E must still defer:

- Production/VPS write execution.
- Production session-cookie auth acceptance for this endpoint.
- Browser/Docker acceptance unless separately requested.
- Existing-user update, merge, department change, or role assignment merge.
- Revoked role assignment reactivation.
- `ACTIVE` or `DISABLED` status import.
- `GLOBAL` role scope.
- `SYSTEM_ADMIN` or equivalent global high-privilege role import.
- Password creation, modification, or reset.
- Invite/reset/lifecycle token issuance.
- Session creation.
- DirectMail or real email.
- Employee-number schema work or database uniqueness claims.
- Persisted import job history or durable idempotency keys.
- Achievement import apply.
- Any claim that local production-like acceptance equals production readiness.

## Step 66E Implementation Recommendation

Step 66E should implement the smallest Web slice:

1. Add typed user/account apply request/response types matching the current backend summary.
2. Add `applyUserAccountImport({ file, mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL" })` to the API client using multipart form data.
3. Extend only `AccountManagement.tsx` and the user-account import panel with apply eligibility, same-file fingerprint, confirmation modal, in-flight state, sanitized error mapping, and safe result display.
4. Add Web Vitest coverage for permission gating, eligibility with no warnings/errors, warning/error disabled state, non-create candidate disabled state, file-change reset, duplicate-submit disabled state, sanitized 401/403/400/network handling, and successful summary rendering.
5. Run `corepack pnpm --filter @research-ip/web test -- AccountManagement api-client` and `corepack pnpm --filter @research-ip/web typecheck`.

Do not add production/VPS execution, invite/reset/email/activation flows, credentials, sessions, achievement apply, or browser/Docker acceptance in Step 66E unless explicitly authorized by a later Step.
