# Import Real-Write Final Archive

## Step 71D Scope

- Date: 2026-07-04.
- Purpose: final documentation archive for the import real-write mainline so a later thread can continue from a single overview.
- This archive is documentation-only. It does not authorize production execution, VPS access, production DB access, production configuration access, `.env` / `.env.production` content reads, Docker/browser execution, apply API execution, database writes, real business data import, source/runtime/schema/API/Web/package/lockfile/config/script changes, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

## Completed Capabilities

### Department Metadata

- Import family: department metadata.
- Apply mode: `CREATE_ONLY`.
- Permission: `system:config`.
- Endpoint: `POST /api/imports/departments/apply`.
- Web entry: department maintenance import panel with dry-run, same-file, eligibility, confirmation, apply, and safe result handling.
- Write effect when authorized and eligible:
  - Creates new department rows only.
  - Creates safe audit evidence with operation `DEPARTMENT_IMPORT_CREATE`.
  - Does not update, merge, delete, reactivate, rewrite hierarchy, or partially apply rows.

### User/Account

- Import family: user/account.
- Apply mode: `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Permission: `system:config`.
- Endpoint: `POST /api/users/import/apply`.
- Web entry: account management import panel with dry-run, same-file, eligibility, confirmation, apply, and safe result handling.
- Write effect when authorized and eligible:
  - Creates new `PENDING_ACTIVATION` users only.
  - Creates department-scoped initial non-`SYSTEM_ADMIN` role assignments.
  - Creates safe audit evidence with operation `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL`.
  - Does not create credentials, sessions, lifecycle tokens, activation, invite/reset flows, or email.

### Achievement

- Import family: achievement.
- Apply mode: `CREATE_DRAFT_ONLY`.
- Permission: `system:config`.
- Endpoint: `POST /api/achievements/import/apply`.
- Web entry: achievement import panel with dry-run, same-file, eligibility, confirmation, apply, and safe result handling.
- Supported homogeneous apply batches:
  - `PAPER`.
  - `SOFTWARE_COPYRIGHT`.
  - `PATENT`.
- Write effect when authorized and eligible:
  - Creates `DRAFT` achievements only.
  - Creates exactly one matching type-detail row per achievement.
  - Creates contributor rows.
  - Creates safe audit evidence with operation `ACHIEVEMENT_IMPORT_CREATE_DRAFT`.
  - Does not submit to workflow or create attachment, fee, reminder, notification, search, resource grant, or import job side effects.

## Completed Acceptance Chain

| Import family | Backend tests | Web tests | Local production-like API acceptance | Local production-like Web acceptance |
| --- | --- | --- | --- | --- |
| Department `CREATE_ONLY` | Step 65B | Step 65E | Step 65C | Step 65F |
| User/account `CREATE_ONLY_PENDING_NO_CREDENTIAL` | Step 66B | Step 66E | Step 66C | Step 66F |
| Achievement `PAPER` `CREATE_DRAFT_ONLY` | Step 68B | Step 68E | Step 68C | Step 68F |
| Achievement `SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY` | Step 69B | Step 69F | Step 69C | Step 69G |
| Achievement `PATENT` `CREATE_DRAFT_ONLY` | Step 70B | Step 70E | Step 70C | Step 70F |

Documentation closure chain:

- Step 71A: `memory-bank/import-real-write-readiness-review.md`.
  - Summarized current capability, acceptance state, side-effect boundaries, remaining risks, and production/VPS pre-apply gates.
- Step 71B: `memory-bank/import-real-write-local-acceptance-checklist.md`.
  - Audited existing local helper/evidence coverage without rerunning Docker/browser/apply flows.
- Step 71C: `memory-bank/import-real-write-production-readonly-preflight-runbook.md`.
  - Defined production/VPS read-only preflight sequence, family-specific baselines, dry-run review checklist, apply-before confirmation template, and apply-after reconciliation template.
- Step 71D: this archive.
  - Consolidates the import real-write mainline into one handoff document.

## Key Boundaries

- Permission:
  - All first-slice apply paths require `system:config`.
  - Department-admin, lifecycle, invite/reset, credential, audit-only, or achievement-state permissions are not substitutes for import apply authority.
- Write modes:
  - Department: create-only.
  - User/account: pending-user create-only with no credential.
  - Achievement: draft-only create for supported homogeneous types.
- Dry-run and same-file gates:
  - Apply must re-parse and revalidate server-side.
  - Apply must not trust a client-supplied dry-run result.
  - Web apply requires the selected file to match the latest eligible dry-run file.
  - Nonzero warnings or errors block apply.
  - Unsupported columns, duplicate/conflict warnings, missing required identifiers, mixed achievement batches, stale files, and invalid row actions block apply.
- Repeated apply behavior:
  - Repeating the same file after success creates no new business data.
  - The expected safe result is a conflict/warning/error response such as `EXISTING_CODE`, `EXISTING_USER`, or `DB_CONFLICT`, with unchanged target counts.
  - There is no persisted import job or durable idempotency key in the first-slice implementation.
- User/account no-credential boundary:
  - No `UserCredential`.
  - No password hash, initial password, password reset, credential restore, or login capability.
  - No `UserSession`.
  - No invite token, reset token, lifecycle token, account activation, invite email, reset email, DirectMail, or real email.
- Achievement side-effect boundary:
  - No workflow instance, task, or action.
  - No attachment metadata, storage object, storage key, or attachment content.
  - No fee record or fee review history.
  - No reminder task.
  - No notification.
  - No search log, search indexing side effect, or external-search sync effect.
  - No resource access grant or secret-read grant.
  - No import job or durable idempotency record.
  - No submit, approve, reject, archive, void, update, upsert, merge, delete, or state-machine transition.
- PATENT fee/reminder boundary:
  - `nextFeeDate` and `feeAmount` are dry-run preview fields only for the first patent slice.
  - They are not written to `PatentDetail`.
  - They are not included as imported fee/reminder data in audit or Web success/error evidence.
  - They do not create `FeeRecord`, fee review history, reminders, notifications, search effects, resource grants, or import jobs.

## Remaining Risks

- No production/VPS acceptance has been performed for the import real-write mainline.
- User/account Step 66C/66F acceptance is not production session-cookie full acceptance; it used no-session/no-credential local harness boundaries.
- Real CSV data can expose production-only data quality issues:
  - department code or hierarchy conflicts;
  - inactive or missing parents;
  - existing users, revoked role assignments, role/scope conflicts, or employee-number readiness gaps;
  - owner, contributor, department, DOI, registration, application number, or grant number conflicts;
  - unsupported columns, encoded data, or operationally ambiguous identifiers.
- First-slice apply paths are conflict-based create flows, not persisted import job workflows.
- There is no durable idempotency key, import-job history, import retry ledger, or automatic resume capability.
- There is no update, merge, reactivation, hierarchy rewrite, revoked-role restore, activation, invite/reset, or existing-achievement mutation capability.
- Patent fee/reminder import remains out of scope.
- Production write execution must be separately authorized and must not be inferred from local synthetic acceptance, Step 71A readiness, Step 71B coverage audit, Step 71C runbook, or this final archive.

## Follow-Up Route

Production readiness route:

- A read-only production preflight may be separately authorized using `memory-bank/import-real-write-production-readonly-preflight-runbook.md`.
- A real production dry-run may be separately authorized, using only authorized and de-identified real CSV samples and recording safe evidence only.
- A real production apply must be separately authorized and must specify:
  - import family;
  - mode;
  - exact file and fingerprint;
  - operator identity and permission boundary;
  - expected row counts;
  - expected created business/detail/contributor/role/audit counts;
  - expected forbidden side-effect zero-delta checks;
  - backup evidence;
  - dry-run timestamp/result;
  - stop conditions;
  - remediation owner and boundary.

Product capability route:

- Add import job history if operators need durable import records.
- Add durable idempotency keys if repeated apply should return stable replay semantics instead of conflict-based no-new-data behavior.
- Add update/merge/reactivation as separate product slices with explicit data ownership and rollback plans.
- Add production session-cookie full acceptance for user/account import only under a separately authorized credential/session boundary.
- Add patent fee/reminder import as a separate slice with its own data model, workflow, notification, reminder, fee, audit, and Web acceptance plan.

## Step 72A Addendum - Import Job History And Idempotency Plan

- Date: 2026-07-04.
- Added `memory-bank/import-job-history-idempotency-plan.md` as a documentation-only product/engineering plan for durable import job history and idempotency behavior.
- The plan covers department `CREATE_ONLY`, user/account `CREATE_ONLY_PENDING_NO_CREDENTIAL`, and achievement `CREATE_DRAFT_ONLY` for homogeneous `PAPER`, `SOFTWARE_COPYRIGHT`, and `PATENT` batches.
- Recommended future model:
  - `ImportJob` as the durable logical request keyed by family, mode, safe file fingerprint, scope/operator boundary, and target environment.
  - `ImportRun` as the execution attempt ledger for status transitions, retry decisions, safe counts, safe error codes, and audit references.
  - `ImportJobItem` deferred unless row-level safe history becomes necessary.
- Recommended future idempotency behavior:
  - Same key after success returns a safe replay result such as `REPLAYED_SUCCESS` without re-running writes.
  - Same key while running returns an in-flight status and does not start another transaction.
  - Failed jobs may retry only through explicit retryable failure codes and a new run record.
  - Rejected warning/error/mode/permission cases remain blocked and must not become write retries.
- Recommended first implementation slice, if separately authorized later: backend-only Department `CREATE_ONLY`, before achievement and user/account expansion.
- The plan does not authorize schema/migration/runtime implementation, production/VPS access, production apply, database writes, Docker/browser execution, real-data import, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

## Final Archive Position

The import real-write mainline is locally implemented, locally accepted with synthetic data, and documented through production-readiness gates. It is ready for a later separately authorized read-only production preflight or dry-run planning step. It is not ready for unapproved production apply, batch real-data import, warning/error apply, automatic retry, automatic cleanup, or any production action without the explicit family/mode/file/operator/count/backup/stop-condition authorization described above.
