# Import Real-Write Production Readonly Preflight Runbook

## Step 71C Scope

- Date: 2026-07-04.
- Purpose: define the read-only production/VPS preflight runbook for the current import real-write mainline before any separately authorized production write.
- This runbook is documentation-only. It does not authorize production writes, VPS access, production DB access, production configuration access, `.env` / `.env.production` content reads, real business data import, Docker/browser execution, apply API execution, database writes, source/runtime/schema/API/Web/package/lockfile/config/script changes, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

## Applicability

This runbook applies only to the first-slice import modes already reviewed in the local synthetic readiness track:

- Department metadata import: `CREATE_ONLY`.
- User/account import: `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Achievement import: `CREATE_DRAFT_ONLY` for homogeneous `PAPER`, `SOFTWARE_COPYRIGHT`, or `PATENT` batches.

This runbook is not production write approval. Any production apply must be a separate, explicit authorization that names the import family, mode, exact file, operator, expected counts, backup evidence, dry-run evidence, and stop conditions.

## Operator Rules

- Treat every step before separately authorized apply as read-only.
- Do not read, print, copy, store, or commit production credentials, cookies, tokens, passwords, connection strings, private keys, or `.env` contents.
- Use only authorized and de-identified real CSV samples for dry-run review.
- Record only counts, booleans, timestamps, redacted filenames or fingerprints, safe error codes, and safe summary evidence.
- Stop immediately on any unexpected write, side-effect delta, permission mismatch, backup gap, dry-run warning, dry-run error, file mismatch, or operator uncertainty.

## Read-Only Preflight Sequence

Complete these gates in order before any production apply is considered:

1. Backup evidence check:
   - Confirm a restorable production database backup exists for the intended apply window.
   - Confirm attachment/storage backup evidence exists where the import family could otherwise be confused with attachment-capable workflows.
   - Record only redacted backup identifiers, timestamps, scope, and restore-readiness confirmation.
   - Do not execute restore, cleanup, delete, or mutation actions during this gate.
2. Migration/status check:
   - Confirm the target environment is on the expected application version and migration state for the import family.
   - For user/account import, explicitly confirm employee-number readiness if the file includes employee-number data.
   - Record status as read-only evidence only; do not run migration deploy, seed, backfill, or repair from this runbook.
3. Service health check:
   - Confirm Web/API health through read-only health endpoints or existing operations dashboards.
   - Confirm background mail, queue, search, workflow, and reminder systems are in a known state when they are part of the forbidden side-effect baseline.
   - Do not trigger mail, jobs, queue replays, search reindexing, or workflow transitions.
4. Permission/operator check:
   - Confirm the operator identity and intended permission boundary.
   - The import apply authority is `system:config`; lifecycle, invite/reset, credential, department-admin, audit-only, or achievement-state permissions are not substitutes.
   - Record only operator role/permission confirmation, not credential material or session values.
5. Target table before-count baseline:
   - Record before-counts for the target business rows and expected companion rows for the selected import family.
   - Use the family-specific baseline checklist below.
6. Forbidden side-effect before-count baseline:
   - Record before-counts for tables or subsystems that must remain unchanged.
   - Use the family-specific forbidden side-effect checklist below.
7. Dry-run result human review:
   - Run dry-run only through the authorized channel.
   - Require zero errors and zero warnings.
   - Record the review using the dry-run checklist in this file.
8. Apply-before manual confirmation:
   - Complete the apply confirmation template in this file.
   - The human confirmation must name the exact file, fingerprint, mode, expected rows, expected created counts, expected zero-delta side effects, backup evidence, dry-run timestamp/result, stop conditions, and operator identity/permission.
9. Apply-after count reconciliation:
   - After a separately authorized apply, perform read-only count comparisons using the post-apply template in this file.
   - Preserve safe evidence only.
10. Stop conditions:
   - Stop on any backup gap, permission ambiguity, migration mismatch, service health failure, file/fingerprint mismatch, row-count mismatch, dry-run warning, dry-run error, unsupported column, unexpected conflict code, unexpected created count, forbidden side-effect delta, unsafe evidence exposure, or operator uncertainty.
   - Do not auto retry, auto cleanup, auto delete, or batch another file after a stop condition.

## Department Read-Only Baselines

Use this checklist for department metadata import in `CREATE_ONLY` mode.

Target before-counts:

- Total department count.
- Candidate department-code conflict baseline:
  - Count matching every candidate `code` in the dry-run file.
  - Expected before apply: zero for rows intended to create.
- Department audit operation count:
  - Count `DEPARTMENT_IMPORT_CREATE` audit records before apply.

Forbidden side-effect before-counts:

- User/account count and role assignment count should not change because department import must not create users or roles.
- Achievement, achievement detail, and contributor counts should not change.
- Workflow, attachment/storage, fee, fee review, reminder, notification, search, resource grant, and import job counts should not change.
- No password, invite/reset, credential, session, mail, activation, update, merge, reactivation, delete, or hierarchy rewrite side effect is expected.

Post-apply expected deltas, if separately authorized:

- Department count increases by the expected created row count.
- Candidate department-code count moves from zero to one per created code.
- `DEPARTMENT_IMPORT_CREATE` audit count increases by the expected created row count.
- All forbidden side-effect counts remain unchanged.

## User/Account Read-Only Baselines

Use this checklist for user/account import in `CREATE_ONLY_PENDING_NO_CREDENTIAL` mode.

Target before-counts:

- Total user count.
- Candidate user baseline:
  - Count matching every candidate email and any authorized employee-number identifier.
  - Expected before apply: zero for rows intended to create.
- Role assignment count.
- Candidate role-assignment conflict baseline for each expected user/role/department scope where it can be checked without exposing sensitive values.
- Account import audit operation count for `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL`.

Forbidden side-effect before-counts:

- Credential count for candidate users must remain zero.
- Session count for candidate users must remain zero.
- Lifecycle token, invite token, reset token, activation evidence, and mail-delivery evidence counts must remain zero.
- DirectMail or real email evidence count must remain zero.
- Achievement, workflow, attachment/storage, fee, reminder, notification, search, resource grant, and import job counts should not change.

Employee-number readiness note:

- If the file includes employee-number data, confirm the target environment has the required employee-number schema/migration and uniqueness readiness before apply approval.
- Employee-number readiness is a production precondition, not proof that user import can update or merge existing accounts.

No credential/session/lifecycle boundary:

- User/account import must not create credentials, password hashes, initial passwords, sessions, invite tokens, reset tokens, lifecycle tokens, activation, invite email, reset email, or real email.
- Imported users remain `PENDING_ACTIVATION` no-credential account records until a separate lifecycle operation is authorized.

Post-apply expected deltas, if separately authorized:

- User count increases by the expected created pending-user count.
- Role assignment count increases by the expected department-scoped initial role count.
- `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL` audit count increases by the expected created-user count.
- Credential, session, lifecycle token, invite/reset, activation, and mail evidence counts remain zero for imported users.
- All unrelated forbidden side-effect counts remain unchanged.

## Achievement Read-Only Baselines

Use this checklist for achievement import in `CREATE_DRAFT_ONLY` mode. Each apply candidate must be a homogeneous batch: all `PAPER`, all `SOFTWARE_COPYRIGHT`, or all `PATENT`.

Target before-counts:

- Achievement count by `type` and `status`, at minimum:
  - `PAPER` / `DRAFT`.
  - `SOFTWARE_COPYRIGHT` / `DRAFT`.
  - `PATENT` / `DRAFT`.
- Candidate identifier conflict baseline:
  - For `PAPER`: normalized DOI candidates.
  - For `SOFTWARE_COPYRIGHT`: normalized software registration number candidates.
  - For `PATENT`: normalized application number candidates, plus normalized grant number where present.
- Detail table counts:
  - `PaperDetail`.
  - `SoftwareCopyrightDetail`.
  - `PatentDetail`.
- Contributor count.
- Achievement import audit operation count for `ACHIEVEMENT_IMPORT_CREATE_DRAFT`.

Forbidden side-effect before-counts:

- Workflow instances, workflow tasks, and workflow actions.
- Attachment metadata, storage object evidence, storage keys, and attachment content evidence.
- Fee records and fee review history.
- Reminder tasks.
- Notifications.
- Search logs, search index operation evidence, or external-search sync evidence.
- Resource access grants or secret-read grants.
- Import jobs or durable idempotency records.
- Approval submission, approval, rejection, archive, void, update, upsert, merge, delete, or other achievement state-machine transition evidence.

PATENT fee/reminder boundary:

- `nextFeeDate` and `feeAmount` are dry-run preview fields only for the first patent slice.
- They are not first-slice production write items.
- They must not create or update `PatentDetail` fee fields, `FeeRecord`, fee review history, reminders, notifications, search effects, resource grants, or import jobs.
- Post-apply evidence must show fee/reminder related counts have zero delta.

Post-apply expected deltas, if separately authorized:

- Achievement count for the selected type and `DRAFT` status increases by the expected created row count.
- Exactly one matching type-detail row is created per achievement.
- Contributor count increases by the expected contributor row count.
- `ACHIEVEMENT_IMPORT_CREATE_DRAFT` audit count increases by the expected created achievement count.
- Candidate identifier conflict baseline changes only for the imported identifiers.
- All forbidden side-effect counts remain unchanged.

## Dry-Run Human Review Checklist

Complete this checklist before any apply approval:

| Item | Required result | Evidence to record |
| --- | --- | --- |
| File authorization | CSV sample is authorized and de-identified | Redacted filename and approval note |
| File fingerprint | Same exact file is used for review and any later apply | Fingerprint, size, and timestamp without sensitive content |
| Row count | Row count matches operator expectation | Total rows and valid row count |
| Mode | Mode matches the intended import family | `CREATE_ONLY`, `CREATE_ONLY_PENDING_NO_CREDENTIAL`, or `CREATE_DRAFT_ONLY` |
| Errors | Zero dry-run errors | Error count only |
| Warnings | Zero dry-run warnings | Warning count only |
| Row actions | Every row action is the expected create/draft/pending action | Safe action summary |
| Duplicates/conflicts | Duplicate and conflict codes are understood and must not appear for apply | Safe code summary |
| Unsupported columns | No unsupported columns are present | Unsupported-column count and safe code summary |
| Sensitive columns | No credential, token, cookie, password, storage, workflow, fee-write, or raw-id columns are present | Safe rejection summary if applicable |
| Same-file gate | Apply candidate is the same reviewed file | Human same-file confirmation |

Any nonzero error or warning blocks apply. Any unsupported column, unexpected conflict, file mismatch, sensitive-column finding, or unclear row action blocks apply.

## Apply-Before Manual Confirmation Template

Use this template only after dry-run review passes and before a separately authorized apply:

```text
Import family:
Mode:
Exact file:
File fingerprint:
Expected total rows:
Expected created business rows:
Expected companion rows:
Expected audit operation and count:
Expected forbidden side-effect zero-delta checks:
Backup evidence available:
Backup timestamp/scope:
Dry-run timestamp/result id:
Dry-run errors:
Dry-run warnings:
Dry-run row action summary:
Operator identity:
Operator permission confirmation:
Stop conditions:
Human approver:
Approval timestamp:
```

Confirmation rules:

- The approver must state that backup evidence is available.
- The approver must state that dry-run produced zero errors and zero warnings.
- The approver must state that the exact file and fingerprint match the reviewed dry-run.
- The approver must state the expected created counts and forbidden side-effect zero-delta checks.
- The approver must state that automatic cleanup, automatic retry, and batch real-data import are not allowed.

## Apply-After Read-Only Reconciliation Template

Use this template only after a separately authorized apply has completed:

```text
Import family:
Mode:
Exact file:
File fingerprint:
Apply timestamp:
Operator identity:
Expected created business rows:
Actual created business rows:
Expected companion rows:
Actual companion rows:
Before target counts:
After target counts:
Before audit operation count:
After audit operation count:
Forbidden side-effect before counts:
Forbidden side-effect after counts:
Forbidden side-effect zero-delta result:
Safe evidence location:
Unexpected result:
Stop/remediation decision:
```

Safe evidence rules:

- Store only redacted count summaries, safe operation names, safe error codes, timestamps, file fingerprints, and non-sensitive row totals.
- Do not store raw production CSV contents, raw person data, raw identifiers beyond approved redacted forms, credentials, cookies, tokens, passwords, connection strings, private keys, `.env` contents, or production secrets.
- If any count differs from expectation or any forbidden side-effect count changes, stop immediately and enter a manual remediation plan.
- Remediation must start with affected-resource inventory and forward-repair or restore analysis. It must not auto delete imported rows or auto cleanup related records.

## Explicit Prohibitions

These actions remain prohibited for this runbook and for any first-slice production apply unless a later Step explicitly authorizes them:

- Do not skip dry-run.
- Do not apply any file with dry-run warnings or errors.
- Do not batch-import real production data.
- Do not automatically retry after an unexpected apply result.
- Do not automatically cleanup, delete, reset, restore, prune, or remove rows/files/resources.
- Do not record sensitive values.
- Do not write production credentials, cookies, tokens, passwords, connection strings, private keys, `.env` contents, or other secrets into documents, commits, evidence, or chat.
- Do not create credentials, sessions, invite/reset flows, lifecycle tokens, activation, real email, workflow tasks, attachments, fee records, reminders, notifications, search side effects, resource grants, or import jobs through these first-slice apply paths.
- Do not treat local synthetic acceptance, local production-like acceptance, or this runbook as production write authorization.
