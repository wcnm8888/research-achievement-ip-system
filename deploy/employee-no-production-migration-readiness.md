# Employee Number Production Migration Readiness Runbook

## Scope

This runbook prepares a future production migration for nullable `User.employeeNo` and unique nullable `User.employeeNoNormalized`.

It is a readiness document only. It does not authorize or perform production migration, VPS access, production database access, production backup execution, real-data preflight, real-data backfill, credential/session/token creation, real email, or achievement apply.

The implemented migration under review is:

- `prisma/migrations/20260702090000_add_user_employee_number/migration.sql`
- Adds nullable `users.employee_no`.
- Adds nullable `users.employee_no_normalized`.
- Adds unique index `users_employee_no_normalized_key` on `users(employee_no_normalized)`.

## Required Manual Authorization Before Production Work

Do not start any production activity until the user explicitly authorizes each boundary:

- Accessing the VPS or production database.
- Confirming the production database target.
- Creating and validating a production backup set.
- Running `prisma migrate deploy` against production.
- Running real-data employee-number preflight queries.
- Backfilling or changing real employee-number values.
- Running production API/Web acceptance beyond read-only health checks.

This Step does not provide a production readiness conclusion. The only valid status from this document alone is `RUNBOOK_READY`.

## Backup Preconditions

Before any production employee-number migration is considered:

- Review `deploy/production-backup-readiness-checklist.md`.
- Confirm a production backup Step is explicitly authorized.
- Confirm the backup target is the intended production VPS and production database using a redacted target summary only.
- Create a backup set that includes the Postgres dump and attachment binary artifacts, or record the missing category as `NO_GO` / `CONDITIONAL_GO`.
- Record backup set id, timestamp, artifact categories, manifest status, encryption status, offsite status, restore-plan status, and operator confirmation.
- Do not record passwords, tokens, cookies, secrets, AccessKeys, private keys, full connection strings, `.env` contents, raw storage object keys, or business-upload filenames.
- Keep the pre-migration backup under rollback-window hold until production migration and post-migration checks are accepted.

Stop condition: if backup evidence is missing, incomplete, unencrypted when encryption is required, partially uploaded offsite, or restore path is unknown, do not run the migration.

## Production Preflight Plan

The current production schema may not have employee-number columns before this migration. Preflight therefore has two phases.

### Phase 1: Before Migration

Confirm only safe, structural facts:

- The target is production, using a redacted summary.
- The migration file to apply is exactly the reviewed employee-number migration.
- Production backup evidence is accepted.
- Application release includes Step 67B/67C behavior:
  - dry-run returns `employeeNoDbConflictCheck=AVAILABLE`;
  - dry-run reports `EXISTING_EMPLOYEE_NO`;
  - apply rechecks `employeeNoNormalized` inside the transaction;
  - apply persists `employeeNo` and `employeeNoNormalized` for pending no-credential imports.

Do not attempt to query `users.employee_no` or `users.employee_no_normalized` before confirming whether the migration has already been applied.

### Phase 2: After Migration, Before Any Backfill

Run read-only checks and record only booleans/counts:

- `users.employee_no` exists.
- `users.employee_no_normalized` exists.
- `users_employee_no_normalized_key` exists and is unique.
- Count of rows with non-null `employee_no`.
- Count of rows with non-null `employee_no_normalized`.
- Count of rows where exactly one of the two fields is null.
- Count of duplicate non-null normalized values, expected `0` because the unique index should prevent duplicates.
- Count of values that do not match the accepted import format, if any source data is present.
- Distribution by user status and archived state, as aggregate counts only.

Do not output raw employee numbers, full emails, user names, department names, or matched-account details.

## Migration Risk Review

The migration is additive but still needs a production window:

- Nullable columns are low risk for old application code because old code can ignore them.
- The unique nullable normalized index can fail if the table already has duplicate non-null values from a previous manual or partial rollout.
- Creating a unique index may briefly lock or slow writes on the `users` table.
- Multiple `NULL` values are allowed by PostgreSQL unique indexes; this is expected.
- The migration does not backfill and must not be combined with a backfill or `NOT NULL` enforcement.
- If application code is deployed before migration, writes that include employee-number fields may fail until migration is applied.
- If migration is deployed before code, old code should continue to run because fields are nullable and unused.

Preferred sequence for this feature:

1. Confirm backup readiness and migration authorization.
2. Apply the nullable-column plus unique-index migration in a planned window.
3. Run structural post-migration checks.
4. Deploy or confirm application code that understands employee-number persistence.
5. Run application-level synthetic or carefully scoped production acceptance only under separate authorization.
6. Plan any real employee-number backfill as a separate reviewed Step.

## Migration Window And Human Confirmation Points

Before the window:

- Confirm authorized operator.
- Confirm backup set id and accepted backup status.
- Confirm migration file name and checksum or review status.
- Confirm production target summary.
- Confirm no real-data backfill is included.
- Confirm stop/rollback contact and decision owner.

During the window:

- Pause unrelated production writes if the operator judges `users` table writes risky.
- Run only the reviewed migration command through the production Compose/API image as described in `deploy/runbook-production.md`.
- Preserve migration command category result and migration name only.
- Do not print environment variables or connection strings.

After the window:

- Run structural checks.
- Run application-level dry-run/apply acceptance only if separately authorized.
- Record final status as `MIGRATION_APPLIED`, `MIGRATION_BLOCKED`, or `MIGRATION_FAILED_NEEDS_REVIEW`.

## Forward-only Strategy

Prefer forward-only recovery:

- If migration succeeds and application code has an issue, roll application code forward or back while keeping nullable columns and the unique index.
- If a bad import is blocked by the unique index, keep the index and fix the import data or application behavior.
- Do not drop the employee-number unique index as a quick rollback unless a separate reviewed rollback plan proves data safety.
- Do not remove nullable columns while any deployed code may read or write them.
- Do not combine rollback with real-data cleanup.

Database restore from backup is reserved for explicit emergency rollback authorization and must follow `deploy/production-backup-readiness-checklist.md`.

## Failure And Stop Conditions

Stop immediately and do not retry automatically if any condition occurs:

- Production target cannot be confirmed without exposing secrets.
- Backup set is missing, incomplete, failed, or lacks an accepted restore path.
- Migration history shows an unexpected pending or failed migration.
- The employee-number migration file differs from the reviewed repository state.
- `prisma migrate deploy` fails.
- Unique index creation fails.
- API or Web cannot start after migration.
- Structural post-migration checks do not confirm both columns and the unique index.
- Application dry-run does not report `employeeNoDbConflictCheck=AVAILABLE`.
- Application conflict handling does not produce safe `EXISTING_EMPLOYEE_NO`.
- Evidence would require printing secrets or raw production personal data.

After stopping:

- Preserve redacted command category, migration name, status, and timestamps.
- Do not run backfill, seed, cleanup, reset, drop, prune, or restore.
- Ask for human review before any retry or rollback.

## Post-migration Structural Acceptance

Record only pass/fail booleans and aggregate counts:

- Migration history includes `20260702090000_add_user_employee_number`.
- `users.employee_no` exists.
- `users.employee_no_normalized` exists.
- `users_employee_no_normalized_key` exists and is unique.
- Non-null normalized duplicate count is `0`.
- Pair mismatch count between display and normalized fields is `0` unless a separately approved backfill Step intentionally leaves staged gaps.
- No unexpected table, credential, session, lifecycle token, or mail-delivery schema change was introduced by this migration.

## Application-level Acceptance

Run only after separate production acceptance authorization.

Minimum safe checks:

- API dry-run for an employee number already present in production returns safe code `EXISTING_EMPLOYEE_NO`.
- Web dry-run displays `employeeNoDbConflictCheck=AVAILABLE`.
- Web displays employee-number conflicts as business-identifier conflicts and does not reveal matched-account details.
- Web disables apply when `EXISTING_EMPLOYEE_NO` is present.
- API apply rechecks `employeeNoNormalized` inside the transaction and rejects a conflict with safe code `EXISTING_EMPLOYEE_NO`.
- A successful create-only pending import persists `employeeNo` and uppercase `employeeNoNormalized`.
- Imported users remain `PENDING_ACTIVATION`.
- Imported users have zero `UserCredential`, zero `UserSession`, zero account lifecycle token, zero real email delivery, and no login activation.

Use synthetic or explicitly approved production-safe data only. Do not create, modify, or reset account passwords.

## Backfill Boundary

This migration does not backfill real employee numbers.

Any future real-data backfill needs a separate plan that includes:

- Data source owner and authorization.
- Mapping format and validation.
- Duplicate normalized employee-number report.
- Invalid value report.
- Existing user matching policy.
- Conflict resolution workflow.
- Dry-run evidence with only counts and safe codes.
- Backup and rollback/forward-fix plan.
- Audit evidence format.

Do not make `employeeNo` required and do not add `NOT NULL` until a later Step proves active-account coverage and rollback safety.

## Evidence Template

Use redacted evidence only:

- Step name.
- Operator confirmation.
- Target summary alias.
- Backup set id.
- Migration name.
- Migration result category.
- Column/index existence booleans.
- Aggregate counts.
- Safe error codes such as `EXISTING_EMPLOYEE_NO`.
- Audit operation `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL` if an authorized application acceptance runs.
- Explicit statement that production migration, production DB preflight, backup execution, and real-data backfill were either completed under separate authorization or remain blocked.

Never include passwords, tokens, cookies, secrets, AccessKeys, private keys, full connection strings, `.env` content, raw employee numbers, raw matched account details, or production personal data.

## Current Status

- Step 67B implemented local schema/runtime support.
- Step 67C aligned Web display.
- Step 67D completed local synthetic migration/API/Web acceptance.
- Step 67E provides this runbook only.
- Production migration readiness is not claimed.
- Production migration, production backup acceptance, real production preflight, and real-data backfill remain blocked until explicitly authorized.
