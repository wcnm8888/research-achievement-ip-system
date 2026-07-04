# User Account Import Job Idempotency Plan

## Step 72L Scope

- Date: 2026-07-04.
- Purpose: plan safe `ImportJob` / `ImportRun` history and idempotency wiring for User/account `CREATE_ONLY_PENDING_NO_CREDENTIAL` apply.
- This Step is documentation-only. It does not authorize runtime/source/schema/API/Web/package/lockfile/config/script changes, Prisma schema changes, migrations, Docker/browser execution, apply API execution, database writes, production/VPS access, production DB/config access, `.env` / `.env.production` content reads, real-data import, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

## Why User/Account Needs A Separate Scheme

User/account import is not just another create-only table write. It creates real `User` rows, assigns `UserRole`, touches account-management semantics, and sits next to authentication and account lifecycle features.

The idempotency design must preserve the existing Step 66/67 contract:

- Imported users are `PENDING_ACTIVATION`.
- Imported users receive only the initial department-scoped role assignment allowed by the CSV plan.
- `employeeNo` and `employeeNoNormalized` now exist and participate in readiness, duplicate detection, and apply-time uniqueness checks.
- The import must not create `UserCredential`.
- The import must not create `UserSession`.
- The import must not create `AccountLifecycleToken`.
- The import must not create invite/reset delivery, mail payload, activation link, password, password hash, or login-capable state.
- `SYSTEM_ADMIN`, `GLOBAL` scope, `ACTIVE` status, unknown/archived departments, unknown/archived roles, existing users, existing employee numbers, and warning/error plans remain blockers.

Production session-cookie full acceptance remains a separate boundary. Step 66C and Step 66F used local production-like environments and no-credential/no-session harnesses because the feature explicitly forbids creating credentials and sessions. Import job idempotency must not be used to claim production session-cookie readiness.

## Idempotency Key Design

The server should derive the idempotency key after upload acceptance and before any business writes.

Key material:

- `family = USER_ACCOUNT`.
- `mode = CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Normalized file fingerprint from uploaded bytes using the same canonicalization approach as existing import job families.
- Safe target environment discriminator, such as `staging`, `production`, or a configured deployment code. Never use a connection string, URL with secrets, host credential, or `.env` value.
- `scopeType`.
- `scopeHash`.
- Operator scope should be included in the hashed scope material for the first slice because current authorization is `system:config` and the semantic boundary is the operator's global account-import capability, not a specific target department. Recommended first value: `GLOBAL_OPERATOR_SCOPE` with a hash over internal `operatorUserId`, `operatorDepartmentId`, and the scope type.

The stored key must be `idempotencyKeyHash` only. It should not persist the raw key material.

The key and stored job/run fields must not include:

- Raw CSV content or row excerpts.
- Raw email or normalized email.
- Raw or normalized employee number.
- Display name, role display name, role name, department name, or scope department name.
- Credential/session/token/cookie/password/private-key/API-key/connection-string/env/storage/mail payload values.

Internal ids are acceptable only where existing audit and operator history already permit them, such as `operatorUserId`, job id, run id, and audit log ids.

## ImportJob / ImportRun Behavior

First same-key apply:

- Create `ImportJob` with `importFamily = USER_ACCOUNT`, `mode = CREATE_ONLY_PENDING_NO_CREDENTIAL`, nullable `achievementType = null`, safe target environment, scope fields, file fingerprint, file size, operator id, and `RUNNING`.
- Create `ImportRun` attempt `1` with `RUNNING`, `INITIAL_SUBMIT`, and safe request fingerprint.
- Continue to server-side parse and validation. Never trust client dry-run output.

Same key with `SUCCESS`:

- Return a safe replay result such as `REPLAYED_SUCCESS`.
- Return the stored safe summary counts and job/run ids.
- Do not re-run validation for write eligibility.
- Do not open the User/UserRole/audit business transaction.
- Do not create another `ImportRun` unless a later Step explicitly chooses to record replay checks. The current department and achievement acceptance pattern expects no extra run on replay.

Same key with `RUNNING`:

- Return `IMPORT_IN_PROGRESS` with safe job/run ids and status.
- Do not open the business transaction.
- Do not create `User`, `UserRole`, audit, credential, session, lifecycle token, or mail records.

Same key with `REJECTED`:

- Return the stored safe rejection using the existing apply rejection shape.
- Do not repeat business writes.
- Do not expose raw CSV values, emails, employee numbers, names, role names, or department names.

Same key with `FAILED`:

- Do not automatically retry in the first user/account job slice.
- Return a safe non-retryable failure response until a later retry policy explicitly classifies failures and adds retry handling.

Validation and warning blocked paths:

- Any dry-run/apply warning or error remains blocking.
- Existing user warnings should become stored safe rejection codes such as `EXISTING_USER`.
- Existing role assignment or revoked role assignment warnings should store safe codes such as `EXISTING_ROLE_ASSIGNMENT` or the existing code emitted by the service.
- Employee number duplicate/conflict should store only safe codes such as `DUPLICATE_IN_FILE` or `EXISTING_EMPLOYEE_NO`, never the employee number.
- High-privilege or unsafe authorization attempts should store safe codes such as `ROLE_NOT_IMPORTABLE` and `GLOBAL_SCOPE_NOT_ALLOWED`, never role display names or department names.
- Unknown/archived department and role blockers should store safe codes such as `UNKNOWN_DEPARTMENT`, `UNKNOWN_SCOPE_DEPARTMENT`, and `UNKNOWN_ROLE`.
- Sensitive column/header rejection should store a safe code only and must not persist the header value if it contains secret-like material.

## Successful Transaction Design

The existing apply path already performs business writes in one Prisma transaction. Step 72M should keep that shape and extend the final transaction contents.

The success transaction must include:

- `User` create.
- Nested or explicit `UserRole` create.
- Safe audit event for each created user.
- `ImportRun` success update:
  - `status = SUCCESS`;
  - `applySummary`;
  - `auditLogIds`;
  - `completedBusinessTransactionAt`;
  - `finishedAt`.
- `ImportJob` success update:
  - `status = SUCCESS`;
  - safe aggregate counts;
  - `safeSummary`;
  - `safeErrorCodes = []`;
  - `latestRunId`;
  - `completedAt`.

All of these must commit or roll back together. This is required so a response timeout after commit can be explained by the durable `SUCCESS` job and replayed as `REPLAYED_SUCCESS`.

The transaction must not include or trigger:

- `UserCredential` create/update/upsert.
- `UserSession` create/update.
- `AccountLifecycleToken` create/update/revoke.
- Password generation, password hashing, password reset, invite, activation, DirectMail, fake mail delivery, real mail delivery, lifecycle outbox, cookie creation, or session creation.
- Existing-user update, department change, role merge, revoked-role reactivation, or global-scope role assignment.

If validation blocks before writes, mark job/run `REJECTED` in a short non-business transaction with safe validation summary only. If the business transaction throws and rolls back, mark `FAILED` with a safe failure code and no created counts.

## Safe Summary Fields

Allowed persisted safe summary fields:

- `family = USER_ACCOUNT`.
- `mode = CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- `status` / response disposition.
- `operation = USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL`.
- `totalRows`.
- `acceptedRowCount`.
- `createdUsersCount`.
- `createdUserRolesCount`.
- `auditCount`.
- `warningCount`.
- `errorCount`.
- `safeErrorCodes`.
- `credentialMode = NO_CREDENTIAL`.
- `targetStatus = PENDING_ACTIVATION`.
- `roleScope = DEPARTMENT`.
- Optional safe booleans or zero deltas:
  - `credentialCreatedCount = 0`;
  - `sessionCreatedCount = 0`;
  - `lifecycleTokenCreatedCount = 0`;
  - `mailDeliveryCount = 0`.

Do not store in `ImportJob.safeSummary`, `ImportRun.validationSummary`, `ImportRun.applySummary`, or `ImportRun.auditLogIds` companion data:

- Raw CSV content or row excerpts.
- Raw email, normalized email, display name, employee number, normalized employee number.
- Role name, role display name, department name, scope department name.
- Password, password hash, credential status, session id/hash, token, cookie, secret, API key, private key, connection string, `.env` value, storage key, invite/reset link, mail subject/body, mail payload, raw request headers, raw user agent, IP address, or exception text containing values.

Implementation should convert existing apply errors into safe stored errors before persisting. Response errors may keep the current safe API shape, but persisted summaries should prefer field names and machine codes over row values.

## Acceptance Strategy

Backend tests for Step 72M should cover:

- First successful apply creates pending users, department-scoped roles, audit rows, `ImportJob`, and `ImportRun`.
- Success transaction updates business rows, audit rows, `ImportRun` success summary, and `ImportJob` success summary in the same Prisma transaction.
- Same-key `SUCCESS` replay returns `REPLAYED_SUCCESS` and does not call the user create or audit path.
- Same-key `RUNNING` returns `IMPORT_IN_PROGRESS` and does not open the business transaction.
- Same-key `REJECTED` returns stored safe rejection and does not open the business transaction.
- `FAILED` same-key does not automatically retry.
- Validation blockers store safe `REJECTED` summaries and create no user, role, audit, credential, session, lifecycle token, or mail records.
- Existing user, existing employee number, high-privilege role, global scope, invalid department, duplicate email, duplicate employee number, and sensitive-column cases are represented by safe codes only.
- Safe summary redaction excludes CSV, email, employee number, display name, role name, department name, credential/session/token/cookie/password/connection-string/env/storage/mail payload values.
- Existing AppModule/controller behavior does not regress.

Local API/DB acceptance for Step 72N should use only synthetic `S72N_*` data and verify:

- First apply creates `PENDING_ACTIVATION` users.
- First apply creates department-scoped roles.
- First apply creates audit rows, `ImportJob`, and `ImportRun`.
- `ImportJob.status = SUCCESS` and `ImportRun.status = SUCCESS`.
- Same-file same-scope replay returns `REPLAYED_SUCCESS` and creates no extra `User`, `UserRole`, audit, job, or run rows.
- Rejected replay for existing-user, existing employee number, invalid department, high-privilege role, global scope, or duplicate file input creates no partial user/role/audit rows and reuses the stored safe rejection.
- DB-helper-seeded `RUNNING` job returns `IMPORT_IN_PROGRESS` and creates no business rows.
- Credential/session/lifecycle/mail deltas are zero.
- Safe summary scan rejects raw CSV, email, employee number, display name, role/department names, raw path, and credential/session/token/cookie/password/connection-string/env/storage/mail payload terms.
- Production session-cookie full acceptance remains out of scope unless a later Step explicitly authorizes it.

## Minimal Implementation Recommendation

Recommended next sequence:

1. Step 72M: backend-only implementation for User/account `CREATE_ONLY_PENDING_NO_CREDENTIAL` import job idempotency.
   - Add a dedicated user/account import job repository or shared import job helper if it can stay simple.
   - Wire only `POST /users/import/apply`.
   - Keep Web behavior unchanged.
   - Reuse the current server-side plan builder and transaction-time rechecks.
   - Keep success job/run updates inside the existing Prisma business transaction.
2. Step 72N: local Docker API/DB acceptance using synthetic `S72N_*` data.
   - Rebuild/update local API only as needed.
   - Apply existing migrations only.
   - Run a memory-bank helper inside the local API container or against an explicitly local non-production DB.
   - Do not access production/VPS or real data.
3. Later Step: Web read-only import history list.
   - Defer until backend history semantics are stable across department, achievements, and user/account.
   - The current Web apply result display can keep using immediate safe summaries.

Do not add schema/migration in Step 72M unless a clear Step 72C bug is found and separately justified. The existing `ImportJob` / `ImportRun` model already includes `USER_ACCOUNT`, `CREATE_ONLY_PENDING_NO_CREDENTIAL`, nullable `achievementType`, safe summaries, and audit id JSON.

## Open Risks And Non-Goals

- This plan does not add update/merge/reactivation, existing-user role merge, revoked-role restore, department change, account activation, invite/reset issuance, cleanup/delete, rollback, or production apply authorization.
- This plan does not make imported users login-capable.
- This plan does not replace account lifecycle flows.
- This plan does not claim production session-cookie full acceptance.
- This plan does not store row-level import history; `ImportJobItem` remains deferred.
- This plan does not authorize reading `.env` / `.env.production`, accessing production/VPS, writing real business data, or using real user/account CSV data.
