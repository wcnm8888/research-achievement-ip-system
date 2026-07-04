# Import Job History And Idempotency Plan

## Step 72A Scope

- Date: 2026-07-04.
- Purpose: design the next import real-write product slice for durable import job history and idempotency behavior.
- This plan is documentation-only. It does not authorize runtime/source/schema/API/Web/package/lockfile/config/script changes, Prisma schema changes, migrations, Docker/browser execution, apply API execution, database writes, production/VPS access, production DB/config access, `.env` / `.env.production` content reads, real-data import, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

Covered import families:

- Department metadata import in `CREATE_ONLY` mode.
- User/account import in `CREATE_ONLY_PENDING_NO_CREDENTIAL` mode.
- Achievement import in `CREATE_DRAFT_ONLY` mode for homogeneous:
  - `PAPER`.
  - `SOFTWARE_COPYRIGHT`.
  - `PATENT`.

## Product Goals

Import job history is needed because the current first-slice apply paths prove no-new-data repeated apply through business conflicts only. After a successful import, a second submission of the same file is rejected by existing target rows, such as `EXISTING_CODE`, `EXISTING_USER`, or `DB_CONFLICT`. That is safe for data effect, but it is not a clear operator history, retry ledger, or audit trail for the import operation itself.

A durable import job record should give operators and support staff a safe answer to these production questions:

- Was this exact import request already accepted?
- Is an equivalent request currently running?
- Did the previous attempt finish successfully, fail before business writes, or get rejected by validation?
- Which import family, mode, safe file fingerprint, operator boundary, row counts, status, and safe error codes were involved?
- If the HTTP response timed out after a write, what durable result can be shown without re-applying the file?
- Which audit-log records belong to the import operation?

An idempotency key is needed to make duplicate submission behavior explicit. It should prevent accidental double-submit, browser retry, reverse-proxy retry, client timeout retry, and human re-click workflows from starting a second write path for the same logical request.

This slice does not solve:

- Update, merge, upsert, reactivation, hierarchy rewrite, revoked-role restore, account activation, invite/reset, or existing-achievement mutation.
- Rollback, automatic cleanup, automatic delete, automatic restore, or automatic forward repair.
- Warning/error override or partial success.
- Production write authorization, production dry-run authorization, or production/VPS preflight.
- Patent fee/reminder import.
- Web history browsing in the first backend-only slice unless a later Step authorizes it.

## Data Model Candidates

The recommended future schema shape has three durable concepts:

| Candidate | Purpose | Recommended first-slice decision |
| --- | --- | --- |
| `ImportJob` | One logical idempotent import request keyed by family/mode/fingerprint/scope/environment. | Add in a later schema Step before runtime wiring. |
| `ImportRun` | One execution attempt for a job, including status transitions and safe result summary. | Add with `ImportJob`; needed for retry history. |
| `ImportJobItem` | Optional per-row safe summary for operator explainability. | Defer unless the backend-only slice needs row-level history beyond existing safe result JSON. |

### ImportJob Fields

Recommended fields:

- `id`: generated internal id.
- `idempotencyKeyHash`: stable hash of the normalized idempotency key; unique per target environment and logical scope.
- `importFamily`: enum such as `DEPARTMENT`, `USER_ACCOUNT`, or `ACHIEVEMENT`.
- `mode`: `CREATE_ONLY`, `CREATE_ONLY_PENDING_NO_CREDENTIAL`, or `CREATE_DRAFT_ONLY`.
- `achievementType`: nullable enum for `PAPER`, `SOFTWARE_COPYRIGHT`, or `PATENT` when the family is achievement.
- `targetEnvironment`: safe environment discriminator, such as a configured deployment name or environment code. Do not store connection strings or host secrets.
- `scopeType`: safe scope discriminator, for example `GLOBAL_OPERATOR_SCOPE` or `DEPARTMENT_SCOPE`.
- `scopeHash`: hash of the department/operator scope component when it is needed for idempotency. Do not store raw person identifiers when a hash is enough.
- `fileFingerprint`: normalized file fingerprint produced from the uploaded file bytes after canonicalization rules are applied.
- `fileSizeBytes`: safe file size.
- `fileNameRedacted`: optional redacted display name or omitted file name.
- `operatorUserId`: internal user id if already non-sensitive in the system; otherwise store a safe actor reference used by audit logging.
- `status`: latest durable job status.
- `latestRunId`: optional pointer to the latest run.
- `acceptedRowCount`, `createdBusinessCount`, `createdCompanionCount`, `auditCount`: safe aggregate counts.
- `warningCount`, `errorCount`: safe aggregate counts.
- `safeErrorCodes`: small array of codes, not raw values.
- `createdAt`, `updatedAt`, `completedAt`.

Never store in `ImportJob`:

- CSV raw content.
- Raw person names, emails, employee numbers, DOI, software registration numbers, patent application numbers, patent grant numbers, titles, contributor lists, or owner names.
- Passwords, credential material, cookies, tokens, private keys, API keys, connection strings, `.env` values, storage keys, mail payloads, or raw audit payloads.

### ImportRun Fields

Recommended fields:

- `id`.
- `jobId`.
- `attemptNo`.
- `trigger`: `INITIAL_SUBMIT`, `RETRY_AFTER_FAILED`, or `OPERATOR_REPLAY_CHECK`.
- `status`: run-level status.
- `startedAt`, `finishedAt`.
- `operatorUserId` or safe actor reference.
- `requestFingerprint`: hash of safe request shape, excluding sensitive raw CSV fields.
- `validationSummary`: safe JSON containing counts, mode, family, action summary, warning count, error count, and safe codes only.
- `applySummary`: safe JSON containing created counts, companion counts, audit operation/count, and forbidden side-effect zero-delta assertions when available.
- `failureCode`: safe machine code, for example `VALIDATION_WARNING_BLOCKED`, `VALIDATION_ERROR_BLOCKED`, `BUSINESS_CONFLICT`, `TRANSACTION_ROLLBACK`, `UNEXPECTED_EXCEPTION`, or `TIMEOUT_RECOVERY_PENDING`.
- `failureStage`: `ACCEPTANCE`, `VALIDATION`, `TRANSACTION`, `RESPONSE`, or `POST_APPLY_RECONCILIATION`.
- `auditLogIds`: optional safe references to audit log rows created by this import.
- `completedBusinessTransactionAt`: timestamp set only after the business transaction commits.

Never store raw CSV rows or raw business identifiers in `validationSummary` or `applySummary`.

### ImportJobItem Fields

Defer `ImportJobItem` unless the first runtime slice needs row-level history. If added later, store only:

- `jobId`, `runId`, `rowNumber`.
- `plannedAction`: safe enum.
- `status`: safe enum.
- `safeCode`: safe machine code.
- `targetType`: safe enum.
- `targetId`: internal id only after creation, when already acceptable for audit reference.

Do not store row values, raw identifiers, person fields, titles, or CSV excerpts.

### Audit Log Relationship

Import job history should not replace existing audit evidence. It should link to audit logs in one of two safe ways:

- Store `importJobId` / `importRunId` on future audit metadata if the audit schema already permits safe metadata extension.
- Or store audit log ids on `ImportRun` after the transaction commits.

The audit log remains the record of business-row creation. `ImportJob` / `ImportRun` becomes the operational ledger for submit, retry, replay, and status recovery.

## Idempotency Key Design

The idempotency key should be derived server-side from safe, normalized dimensions:

- `importFamily`.
- `mode`.
- `achievementType` for achievement imports.
- Normalized file fingerprint.
- Operator or department scope, depending on the import contract.
- Target environment discriminator, so staging and production keys cannot collide.
- Optional schema/application version discriminator if import planning semantics change in a backward-incompatible way.

The key should not include:

- Raw CSV content.
- Raw DOI, software registration number, patent number, email, employee number, person name, title, contributor data, or department name.
- Credentials, cookies, tokens, private keys, connection strings, hostnames containing secrets, `.env` content, storage keys, or mail payloads.

Recommended behavior:

- Same key with an existing `SUCCESS` job: return a replay response with the safe stored summary, for example `REPLAYED_SUCCESS`, without re-running validation or writes.
- Same key with an existing `RUNNING` job: return `IMPORT_IN_PROGRESS` with safe job/run ids and status; do not start another transaction.
- Same key with `PENDING`: return `IMPORT_PENDING` or attempt to claim the job atomically, depending on the worker model.
- Same key with `REJECTED`: allow resubmission only if the request is identical and the operator wants the same safe rejection summary. A changed file should produce a different key.
- Same key with `FAILED`: allow an explicit retry that creates a new `ImportRun` under the same `ImportJob`, only after the failure is classified as retryable.
- Same key with an unknown or expired recovery state: return a safe blocking status and require manual review, not blind re-apply.

`REPLAYED_SUCCESS` should be a response disposition, not necessarily a persisted terminal status. The durable status can remain `SUCCESS`; the response can state that this HTTP request replayed an existing success.

## State Machine Design

Recommended durable job statuses:

- `PENDING`: job accepted, not yet executing.
- `RUNNING`: one run has claimed execution.
- `SUCCESS`: business transaction committed and safe result summary persisted.
- `FAILED`: execution failed unexpectedly or rolled back after acceptance.
- `REJECTED`: request was rejected before business writes because validation, warnings, mode, permission, or eligibility failed.

Recommended response-only dispositions:

- `REPLAYED_SUCCESS`: request matched an existing `SUCCESS` job and returned the stored safe summary.
- `IMPORT_IN_PROGRESS`: request matched a `RUNNING` job and did not execute.

Retry policy:

- Retryable: `FAILED` when the failure happened before commit or after a confirmed rollback, and the failure code is classified as retryable.
- Not retryable by automatic repeat: `SUCCESS`, `RUNNING`, `REJECTED` due validation/warning/error, permission denial, mode mismatch, unsupported columns, mixed achievement batch, existing business conflict, or any unsafe recovery state.
- Manual-review only: any state where business writes may have committed but the result summary was not persisted.

Transaction boundary:

- Create or claim `ImportJob` / `ImportRun` before opening the business transaction.
- Re-parse and revalidate server-side after claim; never trust client dry-run output.
- If validation has nonzero errors or warnings, mark the run/job `REJECTED` outside the business transaction and do not write business data.
- For apply, use the existing all-or-nothing business transaction for business rows, companion rows, and audit events.
- Persist the success summary and `SUCCESS` status immediately after the business transaction commits.
- If the business transaction rolls back, persist `FAILED` or `REJECTED` with safe failure code and no created counts.

Timeout recovery:

- If business writes commit but the HTTP response times out, the next same-key request should find the `SUCCESS` job and return `REPLAYED_SUCCESS` with safe counts and audit references.
- If the process crashes after commit but before marking `SUCCESS`, recovery needs either:
  - a transaction pattern that writes job/run success inside the same transaction as business rows; or
  - a reconciliation step that can identify audit rows by `importRunId` and safely complete the job record.
- The safer long-term design is to include job/run references in the same business transaction as created rows and audit events, so post-timeout explanation does not require reapplying the file.

## Compatibility With First-Slice Boundaries

This plan must preserve all existing first-slice semantics:

- Department import remains `CREATE_ONLY`.
- User/account import remains `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Achievement import remains `CREATE_DRAFT_ONLY` for homogeneous `PAPER`, `SOFTWARE_COPYRIGHT`, or `PATENT` batches.
- Apply still rejects nonzero warnings and errors.
- Apply still rejects stale files, unsupported columns, invalid actions, mixed achievement batches, missing required identifiers, and unsupported modes.
- Partial success remains forbidden.
- Client dry-run output remains untrusted.
- The backend remains the authority for parse, validation, permission, mode, and transaction-time rechecks.
- No workflow, attachment, storage, fee, reminder, notification, search, resource grant, credential, session, lifecycle token, invite/reset, email, activation, or state-machine side effect is introduced.
- `PATENT` still must not write `nextFeeDate` or `feeAmount`, and must not create fee records or reminders.

Import job history is an operational ledger only. It must not become a hidden workflow engine, permission expansion, update/merge mechanism, cleanup mechanism, or production apply authorization shortcut.

## Minimal Implementation Slice Recommendation

The safest first implementation slice is backend-only Department `CREATE_ONLY`.

Reasons:

- Smallest data graph: department rows plus audit evidence.
- Least sensitive idempotency inputs: department import does not require raw DOI, software registration number, patent number, personal email, employee number, owner, contributor, or title values.
- Existing acceptance already proves parent-before-child create, transaction rollback, repeated apply no-new-data, limited-user 403, and safe audit evidence.
- The import family has fewer forbidden side-effect categories than user/account or achievement.

Recommended sequence:

1. Schema-design Step: add an approved migration plan for `ImportJob` and `ImportRun` only, with `ImportJobItem` deferred.
2. Backend-only Department runtime Step: wire job claim, idempotency key hash, status transitions, success replay, in-flight duplicate handling, and tests.
3. Department local production-like acceptance Step with synthetic data only.
4. Extend to Achievement `PAPER` `CREATE_DRAFT_ONLY`, because it has a clear normalized duplicate boundary but higher multi-table risk.
5. Extend to `SOFTWARE_COPYRIGHT`.
6. Extend to `PATENT` only after fee/reminder non-write assertions are included in idempotency acceptance.
7. Extend to user/account after pending/no-credential and no-session/no-lifecycle/no-mail boundaries are covered by job/run tests.
8. Add Web history list later, after backend status semantics are stable.

Web history should be post-backend. The first UI can continue showing immediate apply results; a later Web slice can add a read-only import history list with status, family, mode, redacted file fingerprint, row counts, timestamps, operator-safe actor reference, and safe error codes.

## Acceptance Strategy

Backend unit tests:

- Key derivation excludes raw CSV values and sensitive business fields.
- Same logical request produces the same key.
- Changed family, mode, achievement type, file fingerprint, scope, or environment changes the key.
- `SUCCESS` replay returns stored safe summary without calling the business write path.
- `RUNNING` duplicate returns in-flight status without opening a business transaction.
- `FAILED` retry creates a new run only for retryable failure codes.
- `REJECTED` warning/error cases do not write business rows.

Transaction tests:

- Job/run claim is atomic under concurrent same-key submissions.
- Business rows, companion rows, audit rows, and job/run success status are consistent after commit.
- Rollback leaves no business rows and records a safe failure/rejection state.
- A simulated unique conflict maps to a safe code and does not partially apply.

Repeated apply tests:

- First apply succeeds.
- Same-key repeat after success returns `REPLAYED_SUCCESS`.
- Same-file but changed environment or scope does not collide with the original key.
- Existing business-conflict behavior remains safe for files that are not same-key replays.

In-flight and replay tests:

- Two concurrent same-key submissions produce one runner and one `IMPORT_IN_PROGRESS` or replay-safe response.
- Client timeout retry after a successful commit returns a stored success summary.
- Crash/recovery scenario is either handled by same-transaction job status update or blocked with manual-review status.

Local production-like acceptance:

- Run only in a separately authorized local non-production Step.
- Use synthetic data only.
- Record safe counts, statuses, ids where already audit-safe, and safe error codes.
- Confirm no forbidden side-effect deltas for the selected family.
- Do not touch production/VPS or production DB.

Sensitive-value scan:

- Scan new and staged docs/code for complete URLs, connection-string values, private-key material, access keys, bearer tokens, cookies, sessions, passwords, secrets, API keys, raw CSV content, and raw business identifiers.
- For achievement history UI or API responses, add explicit checks that raw DOI, software registration number, patent number, owner/contributor names, owner/contributor emails, CSV content, `nextFeeDate`, and `feeAmount` do not appear in replay/error panels.

Docs-only Step 72A does not run typecheck, tests, build, Docker, browser, apply API, or database commands because it changes only documentation and explicitly does not implement runtime behavior.

## Risks And Prohibited Items

Risks:

- A poorly designed key can conflate two distinct authorized imports or fail to catch a duplicate retry.
- Storing too much result detail can leak person data, research identifiers, patent/software identifiers, credential-adjacent material, or production context.
- Marking `SUCCESS` outside the business transaction without a recovery plan can create ambiguous timeout/crash states.
- A job history table can be mistaken for production apply approval unless documentation and UI copy clearly separate history from authorization.
- Retry support can accidentally become automatic re-apply unless retryability is explicit and narrow.

Prohibited for this plan and the first implementation slice:

- Do not save raw CSV content.
- Do not save raw DOI, software registration number, patent number, person email, person name, employee number, title, contributor list, credential, token, cookie, private key, API key, connection string, `.env` content, storage key, or mail payload.
- Do not expand real-data import permissions.
- Do not skip dry-run, warning blocking, error blocking, same-file gating, or human confirmation gates.
- Do not allow partial success.
- Do not add automatic cleanup, delete, rollback, restore, retry loops, or production apply.
- Do not create workflow, attachment, fee, reminder, notification, search, resource grant, credential, session, lifecycle, invite/reset, email, activation, or state-machine side effects.
- Do not implement schema, migration, runtime, API, Web, or package changes unless a later Step separately authorizes them.

## Step 72A Position

The next production-hardening direction should be durable import job history plus server-side idempotency, but only as a separately authorized implementation track. Step 72A establishes the product, data, state-machine, security, and acceptance boundaries. It does not change the current first-slice import behavior and does not authorize any production/VPS action.
