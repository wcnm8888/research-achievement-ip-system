# User Account Identity Uniqueness And Employee Number Persistence Plan

## Step 67A Scope

- Date: 2026-07-02.
- Purpose: decide the user/account import identity uniqueness model and the next safe slice for durable `employeeNo` support.
- This Step is design and risk review only.
- This Step does not change Prisma schema, create a migration, change runtime code, run database writes, access production/VPS, create credentials, create sessions, create account lifecycle records, send mail, process achievement apply, clean local artifacts, stage, or commit known untracked local artifacts.

## Current Identity Facts

- `User.id` is the internal UUID primary key.
- `User.email` is the only persisted user-facing account identifier in the current schema:
  - Prisma: `User.email String @unique @db.VarChar(255)`.
  - Auth login normalizes email with `trim().toLowerCase()` and finds users by email.
  - Account management create also normalizes email before creating `User`.
- There is no persisted username, login name, account identifier, external user id, import source id, or equivalent user identity field in the current user/account schema.
- `employeeNo` exists only in the user/account CSV import contract:
  - Optional input column.
  - Trimmed and validated as ASCII letters, numbers, underscore, or hyphen, max length 64.
  - Current duplicate detection is file-local only.
  - Current dry-run summary reports `employeeNoDbConflictCheck: "NOT_AVAILABLE"`.
- `UserCredential`, `UserSession`, and `AccountLifecycleToken` are separate tables and must not become employee-number storage.
- `UserRole` uniqueness is assignment-level only: `(userId, roleId, scopeType, scopeKey)`.
- Department `code` and role `code` are reference identifiers, not user identity fields.

## Recommended Identity Model

- Keep email as the only login identifier for now.
- Treat `employeeNo` as a business identity attribute for account matching, import conflict detection, admin search, and future lifecycle review.
- Do not use `employeeNo` for login or account lifecycle token lookup without a separate security/product decision.
- Do not introduce a generic username/login-name field in the same change as employee-number persistence. That would create a second identity design problem and should be scoped separately.

## Employee Number Persistence Decision

- Persist employee number on `User`, not on credential, session, import job, role assignment, audit log, or a new import-only table.
- Store two fields:
  - `employeeNo`: optional display/source value after trim.
  - `employeeNoNormalized`: optional canonical value for lookup and uniqueness.
- Keep both fields nullable in the first migration.
- Recommended normalization:
  - Trim leading/trailing whitespace.
  - Reject empty strings as `null`.
  - Preserve display value in `employeeNo`.
  - Store `employeeNoNormalized` as uppercase ASCII because the existing accepted character set is `[A-Za-z0-9_-]`.
  - Use `employeeNoNormalized` for all duplicate checks and database lookup.
- Recommended length and format:
  - Keep max length 64.
  - Keep the existing letters/numbers/underscore/hyphen format unless product data proves that current HR numbers need a wider format.
- Do not make `employeeNo` required in the first persistence slice.

## Uniqueness Strategy

### Email

- Keep global `User.email` uniqueness.
- Continue lowercasing email before writes.
- Existing `archivedAt`, `DISABLED`, and `PENDING_ACTIVATION` users should still reserve their email.
- Do not let import create a new account with an email already held by an inactive or archived user. Reuse, merge, anonymization, or account transfer needs a separate reviewed workflow.

### Account Identifier / Username / Login Name

- No such field exists today.
- Step 67B should not add one.
- If future product requirements need a username/login name, define it as a separate normalized unique field with separate login, lifecycle, conflict, and display rules.

### Employee Number

- Recommended database uniqueness: global unique non-null `employeeNoNormalized` for the current single-organization schema.
- Rationale:
  - There is no tenant model today.
  - Department-scoped uniqueness is brittle because users can transfer departments.
  - Employee numbers are normally institution-level identifiers, not department-local identifiers.
- If a future tenant or organization model is introduced, the uniqueness scope should become `(tenantId, employeeNoNormalized)`.
- Allow multiple users with `employeeNoNormalized = null`.
- Existing `archivedAt`, `DISABLED`, and `PENDING_ACTIVATION` users should still reserve non-null employee numbers.
- Same-file duplicate `employeeNo` remains a hard error.
- Database duplicate `employeeNoNormalized` should become an import warning/error code `EXISTING_EMPLOYEE_NO` and must block apply.

## Migration Strategy

Recommended first migration shape:

- Add nullable `employee_no` and `employee_no_normalized` columns to `users`.
- Add a unique constraint/index on `employee_no_normalized`.
- Keep the fields nullable; do not add `NOT NULL`.
- Add application-level invariant tests that both values are set or both null.
- Optionally add a database check constraint in raw SQL if the project accepts hand-written migration SQL for this invariant.

Production rollout sequence:

1. Add nullable columns and unique normalized index.
2. Deploy code that writes normalized employee numbers for new imports and account management creates/updates that provide one.
3. Run read-only preflight queries before any backfill:
   - Count users with candidate employee numbers if a source exists.
   - Detect normalized duplicates.
   - Detect invalid values under the proposed format.
   - Detect null rate and department/status distribution.
4. Resolve conflicts manually or with a separately approved mapping file.
5. Backfill only after conflict review.
6. Keep nullable until product policy proves every active account must have an employee number.
7. Consider `NOT NULL` only in a later migration after backfill, validation, and a rollback plan.

Rollback / forward strategy:

- Prefer forward-only fixes after production migration.
- If the nullable columns are deployed but code needs rollback, old code can ignore them.
- If the unique index blocks a bad import, keep the index and fix data or code; do not drop uniqueness casually.
- Do not combine nullable column addition, backfill, and not-null enforcement in one migration.

## Import Behavior After Persistence

Dry-run should change as follows after schema support exists:

- Normalize `employeeNo` for conflict checks using the same canonical function used for writes.
- Query existing users by `employeeNoNormalized`.
- Report `EXISTING_EMPLOYEE_NO` on `field: "employeeNo"` when a non-null normalized employee number belongs to an existing user.
- Keep display sanitized:
  - Do not reveal the matched user's full email.
  - Do not reveal unrelated account fields.
  - It is acceptable to show the row's own parsed employee number because it came from the uploaded file, but avoid showing matched database identity details beyond a safe code/count.
- Update summary from `NOT_AVAILABLE` to an available/checked state only after dry-run actually performs the DB lookup.
- Existing email conflicts and employee-number conflicts should both block apply for create-only import.

Apply should change as follows after schema support exists:

- Re-parse and revalidate the uploaded file server-side as it does today.
- Recheck both email and `employeeNoNormalized` inside the same transaction before writes.
- Persist `employeeNo` and `employeeNoNormalized` on `User` creation.
- Map transaction-time employee-number conflicts to safe `EXISTING_EMPLOYEE_NO` apply errors.
- Keep Prisma unique conflicts as the final race-condition guard; map them to a generic identity conflict when the exact field cannot be determined safely.
- Do not write `employeeNo` to credential/session/lifecycle tables.
- Audit should not treat employee number as a secret, but should avoid using it as the authoritative target identifier. Prefer target user id plus masked email and counts. If recorded, record only the normalized conflict code or a masked/truncated employee number after a separate audit decision.

Web behavior should change as follows:

- Continue blocking apply on any warning/error.
- Show `EXISTING_EMPLOYEE_NO` as a safe row-level issue without matched-account details.
- Replace the current `employeeNo DB conflict check: NOT_AVAILABLE` copy only when backend summary confirms DB checking is available.
- Continue same-file dry-run fingerprint gating before apply.

## Soft Delete And Inactive Users

- `archivedAt` and inactive statuses should not release email or employee number for reuse in import.
- Reason: releasing identifiers can create audit ambiguity and account takeover risk.
- If a business process requires reusing an identifier, implement a separate identity transfer or anonymization workflow with explicit audit and approval.

## Risks And Mitigations

- Existing production data may already contain employee numbers outside the current import file. Mitigation: do not backfill until a read-only preflight identifies conflicts and invalid formats.
- Case sensitivity may create duplicates such as `e001` and `E001`. Mitigation: unique uppercase `employeeNoNormalized`.
- Department-scoped uniqueness can fail after employee transfer. Mitigation: use global uniqueness for the current schema.
- Nullable unique semantics can be misunderstood. Mitigation: tests must prove multiple null employee numbers are allowed and duplicate non-null normalized values are rejected.
- Existing apply currently maps Prisma unique conflicts to email wording. Mitigation: Step 67B should add explicit employee-number transaction rechecks and update generic unique-conflict copy.
- Import UI could overstate identity assurance. Mitigation: keep `NOT_AVAILABLE` until backend DB lookup is implemented and tested.

## Recommended Step 67B Slice

Implement the smallest local-code slice for employee-number persistence and import conflict detection:

- Add nullable `employeeNo` and `employeeNoNormalized` fields to `User` plus one migration.
- Generate/update Prisma client artifacts as required by the project workflow.
- Add a shared normalize function for employee numbers.
- Update user/account dry-run repository/service to query existing users by normalized employee number.
- Add `EXISTING_EMPLOYEE_NO` issue reporting and update summary wording from `NOT_AVAILABLE` only when the lookup is implemented.
- Update apply transaction rechecks to include normalized employee-number conflicts.
- Persist employee number fields on create-only pending no-credential import.
- Keep email as login identifier.
- Keep employee number optional.
- Do not backfill production data, access production/VPS, run production migrations, create credentials, create sessions, send mail, or process achievement apply.
- Add focused API tests for normalization, same-file duplicates, DB existing employee number, transaction-time employee number conflict, nullable creates, unique conflict mapping, and no credential/session/lifecycle side effects.

Recommended later slices:

- Step 67C: local migration/acceptance with synthetic data only.
- Step 67D: read-only production preflight plan if production rollout is considered.
- Step 67E or later: reviewed backfill/import of real employee numbers, only after conflict analysis and approval.
