# User Account Import Real-Write Safety Plan

## Step 66A Scope

- Date: 2026-07-02.
- Purpose: define the first safe real-write scope for user/account import and split the next implementation work.
- This document is planning-only. It does not authorize runtime code changes, apply API execution, database writes, email delivery, password creation/reset, account activation, Docker, production/VPS access, production database access, deployment, cleanup, deletion, reset, drop, or prune.

## Current Facts

- Current dry-run endpoint: `POST /api/users/import/dry-run`.
- Current permission: `system:config` through `UserContextGuard` plus `PermissionGuard`.
- Current CSV contract:
  - Required: `email`, `displayName`, `departmentCode`, `roleCode`.
  - Optional: `employeeNo`, `scopeType`, `scopeDepartmentCode`, `status`.
  - Sensitive credential, token, session, link, header, secret, AccessKey, and private-key columns are rejected.
- Current dry-run default behavior:
  - Normalizes email to lowercase.
  - Defaults `scopeType` to `DEPARTMENT`.
  - Defaults `scopeDepartmentCode` to `departmentCode`.
  - Defaults `status` to `PENDING_ACTIVATION`.
  - Always previews `credentialAction: NO_CREDENTIAL`.
- Current dry-run blockers:
  - `GLOBAL` scope is denied.
  - `SYSTEM_ADMIN` role import is denied.
  - `ACTIVE` status import is denied.
  - Unknown department, scope department, or role is denied.
  - Formula-like values and file duplicates are denied.
- Current warnings:
  - Existing user by email.
  - Existing active role assignment.
  - Matching revoked role assignment.
- Current schema facts:
  - `User.email` is unique.
  - `UserRole` is unique by `userId`, `roleId`, `scopeType`, `scopeKey`.
  - `UserCredential`, `UserSession`, and `AccountLifecycleToken` are separate tables.
  - There is no persisted `employeeNo` field for users today; dry-run can only detect file-local employee number duplicates.
- Current login facts:
  - Login requires `User.status = ACTIVE`.
  - Login also requires an existing active `UserCredential`.
  - A `PENDING_ACTIVATION` or `DISABLED` user with no credential is not login-capable.

## First Minimal Safe Slice

The first user/account real-write slice should be backend-only `CREATE_ONLY_PENDING_NO_CREDENTIAL`.

Allowed data effect:

- Create new `User` rows only when the email does not already exist.
- Set `User.status` to `PENDING_ACTIVATION` only.
- Set `User.departmentId` from an active `departmentCode`.
- Create initial `UserRole` rows only for active, non-`SYSTEM_ADMIN` roles.
- Restrict role scope to `DEPARTMENT` only, with `scopeKey` and `departmentId` resolved from an active `scopeDepartmentCode`.
- Write one safe audit event per created user in the same transaction.

Required non-login contract:

- Do not create `UserCredential`.
- Do not create `UserSession`.
- Do not create `AccountLifecycleToken`.
- Do not generate or hash any password.
- Do not activate the user.
- Do not send invite, reset, DirectMail, or any real email.
- Do not call account lifecycle invite/reset services from import apply.

This means the first slice creates credential-free, non-login account records. They are "account drafts" in product terms, but they are represented by real `User` rows with `PENDING_ACTIVATION` status and no credential, not by a new draft table.

## Explicit Exclusions

- No `ACTIVE` user import.
- No `DISABLED` user import in the first write slice; keep it out until product semantics are separately authorized.
- No existing-user update or merge.
- No existing-user department change.
- No active role assignment merge for existing users.
- No revoked role assignment reactivation.
- No `GLOBAL` role scope.
- No `SYSTEM_ADMIN` role assignment.
- No password creation, password reset, initial password, credential restore, or credential status write.
- No invite token, reset token, lifecycle token revocation, or email delivery.
- No employee number persistence or database conflict check until a schema decision exists.
- No Web apply button.
- No production/VPS or production database access.
- No achievement real-write work.

## Transaction Boundary

Use one Prisma transaction for the whole uploaded file:

- Re-parse and validate the uploaded CSV on the server.
- Reject before opening writes unless every row is a `CREATE_PENDING_USER` candidate with zero errors and zero warnings.
- Recheck inside the transaction:
  - Email uniqueness.
  - Department active status.
  - Scope department active status.
  - Role active status.
  - Role is not `SYSTEM_ADMIN`.
  - Scope is `DEPARTMENT`.
  - Status is exactly `PENDING_ACTIVATION`.
  - No matching user-role uniqueness conflict can be created by the planned rows.
- For each row, create:
  - `User`.
  - `UserRole` assignment.
  - Audit event.
- Roll back the entire file if any row fails revalidation or insert.
- Do not persist uploaded file content.
- Do not write audit outside the transaction.

Recommended audit shape:

- Action: existing `CREATE` or a new account-import-specific action only if a later implementation step explicitly adds one.
- Target: created `User`.
- Safe fields:
  - operation `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL`.
  - row number.
  - target user id.
  - masked email.
  - department id.
  - role code.
  - scope type.
  - scope department id.
  - credential mode `NO_CREDENTIAL`.
  - status `PENDING_ACTIVATION`.
  - batch summary counts.
- Forbidden audit fields:
  - Raw file content, local path, uploaded body, password, password hash, token, cookie, session value, secret, AccessKey, private key, connection string, invite/reset link, mail payload, or operator environment values.

## Idempotency And Duplicate Handling

First slice should be data-effect idempotent by strict rejection, not by upsert:

- Same-file duplicate email: hard error.
- Same-file duplicate employee number: hard error while `employeeNo` exists only as non-persisted input.
- Same-file duplicate `(email, roleCode, scopeDepartmentCode)`: hard error should be added before apply, even when duplicate emails already catch most cases.
- Existing user email: warning in dry-run and apply blocker.
- Existing active role assignment: warning in dry-run and apply blocker.
- Existing revoked role assignment: warning in dry-run and apply blocker.
- Re-running the exact successful file after creation should return an existing-user conflict report and create no additional rows.
- Prisma `User.email` unique conflicts and `UserRole` unique conflicts remain final race-condition guards and must map to safe 409/400-style conflict results.
- Durable idempotency keys and persisted import job history remain deferred because they require product and schema decisions.

Employee number decision:

- Do not treat `employeeNo` as a durable account identifier in Step 66B.
- Do not write `employeeNo` into audit as an authoritative identifier.
- Either keep it file-local only in Step 66B, or require a separate schema/design step before using it for database conflict handling.

## Permission Boundary

- Keep first write permission as `system:config`.
- Keep backend permission checks authoritative.
- Do not add department-admin or scoped account-import permission in the first slice.
- Require `UserContext.userId` and `UserContext.departmentId` for audit actor facts.
- Do not rely on Web visibility for enforcement.
- Do not call production/VPS or production database for permission checks.

`account:invite` and `account:reset_password` remain separate permissions for lifecycle operations. They must not be considered sufficient for import apply.

## Dry-Run And Apply Consistency

Apply must never trust a client-supplied dry-run result.

Step 66B implementation should:

- Factor the minimum shared planning output from `UserAccountImportDryRunService`.
- Keep the existing dry-run response stable.
- Have apply call the same parser and row validation path server-side.
- Reject apply when the freshly computed plan contains any error or warning.
- Return a sanitized apply result with file metadata, mode, counts, safe errors, and created row ids only.
- Avoid echoing raw uploaded CSV rows beyond the already-sanitized parsed fields needed for error reporting.

## Step 66B Recommended Implementation Slice

Recommended scope: backend-only user account import apply.

- Route: `POST /api/users/import/apply`.
- Multipart fields: `file`, optional `mode`.
- Only accepted mode: `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Guard stack: existing `UserContextGuard` and `PermissionGuard`.
- Static permission: `system:config`.
- Service behavior:
  - Reuse/factor user-account dry-run parser and validation into a server-side plan.
  - Add apply-only blocker for any warning.
  - Add explicit same-file duplicate assignment check if not already covered.
  - Recheck all references and uniqueness inside one Prisma transaction.
  - Create only `User` with `PENDING_ACTIVATION` and `UserRole`.
  - Omit `UserCredential`, `UserSession`, and `AccountLifecycleToken`.
  - Write safe audit event in the same transaction.
  - Map unique conflicts to safe conflict reports.
- Tests:
  - Controller 401/403/file validation/apply route.
  - Service success with two new pending no-credential users.
  - Missing/unknown department, unknown role, global scope, system admin role, active status, sensitive columns, formula-like values, duplicate email, duplicate employee number, existing user, existing role assignment, revoked role assignment.
  - Re-run exact successful file creates no additional rows.
  - Audit payload excludes credential/token/session/mail/link fields.
  - AppModule route wiring.
- Deferred after 66B:
  - Web apply button.
  - Local production-like write acceptance.
  - Existing-user handling.
  - Invite/reset issuance.
  - Employee number schema work.
  - Production/VPS rollout.

## Verification For Step 66A

Because Step 66A is documentation-only, full typecheck/test is not required. Required gates are:

- `git diff --check`.
- Added-lines sensitive keyword scan with only counts or redacted summary.
- Commit with tracked diff clean afterward.

## Step 66D Web Entry Addendum

- Design document: `memory-bank/user-account-import-apply-web-entry-design.md`.
- Web visibility should stay inside the existing account management page and existing `system:config` frontend gate.
- Backend `system:config` remains authoritative; Web visibility is not enforcement.
- Apply eligibility should require a same-file latest dry-run with mode `CREATE_ONLY_PENDING_NO_CREDENTIAL`, `USER_ACCOUNT`, `dryRun=true`, total rows > 0, zero errors, zero warnings, all rows `VALID`, all actions `CREATE_PENDING_USER`, `PENDING_ACTIVATION` status, `NO_CREDENTIAL`, and department scope.
- Step 66E confirmation must explicitly say the apply creates only pending users and department-scoped initial roles; it creates no `UserCredential`, password, session, invite/reset/lifecycle token, email, or login activation.
- Step 66C local production-like API acceptance remains local and synthetic; it did not cover production session-cookie auth.
- Step 66E should be a Web-only minimal implementation slice with typed API client, eligibility, confirmation, safe result display, and focused Web Vitest coverage.

## Step 66F Web Acceptance Addendum

- Step 66F accepted the Step 66E Web entry in a local production-like browser flow with synthetic `S66F_*` data.
- Because the Step explicitly forbids creating credentials and sessions, it used a no-session/no-credential local auth harness instead of a real production session-cookie login.
- The acceptance does not complete production/VPS acceptance or production session-cookie full acceptance.
- Accepted safety evidence:
  - Created users remain `PENDING_ACTIVATION`.
  - Created roles are department-scoped.
  - `UserCredential`, `UserSession`, and `AccountLifecycleToken` counts are zero for imported users.
  - Mail delivery evidence count is zero.
  - Audit operation is `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL`.
  - Duplicate repeat apply is rejected with safe `EXISTING_USER` evidence and no net user increase.

## Step 67A Identity / Employee Number Addendum

- Design document: `memory-bank/user-account-identity-employee-no-persistence-plan.md`.
- Current state remains unchanged: `employeeNo` is not persisted, so Step 66B-66F can only claim same-file employee-number duplicate rejection.
- Step 67A recommends a later implementation Step that persists optional `employeeNo` plus uppercase normalized nullable `employeeNoNormalized` on `User`.
- Email remains the only login identifier.
- Employee number should be treated as a business identity for import matching and admin review, not as an auth credential or account lifecycle identifier.
- For the current schema, non-null normalized employee numbers should be globally unique; inactive and archived users should still reserve identifiers.
- Future dry-run/apply behavior should add safe `EXISTING_EMPLOYEE_NO` reporting, keep Web apply blocked on that issue, and recheck employee-number uniqueness inside the apply transaction before writes.
- Step 67A does not authorize schema changes, migrations, runtime implementation, production/VPS access, production database access, real-data backfill, credential/session/lifecycle token creation, email, achievement apply, cleanup, deletion, reset, drop, or prune.
