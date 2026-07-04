# Import Real-Write Readiness Review

## Step 71A Scope

- Date: 2026-07-04.
- Purpose: close the current import real-write mainline with a documentation-only readiness review before any production or VPS write work.
- This review does not authorize production writes, VPS access, production DB access, production configuration access, `.env` / `.env.production` content reads, real business data import, Docker/browser execution, apply API execution, database writes, source/runtime/schema/API/Web/package/lockfile/config/script changes, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

## Executive Readiness Summary

The real-write import mainline has local synthetic closure for three import families:

- Department metadata import: `CREATE_ONLY`.
- User/account import: `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Achievement import: `CREATE_DRAFT_ONLY` for `PAPER`, `SOFTWARE_COPYRIGHT`, and `PATENT`.

The closure is not production rollout approval. It means the backend, Web entry, and local production-like acceptance evidence are now organized enough to define production/VPS preflight gates. Any real production write must be separately authorized and must start from a fresh dry-run and human confirmation using sanitized real CSV samples.

## Department Metadata Import

### Current Capability

- Import family: department metadata.
- Apply mode: `CREATE_ONLY`.
- Permission: `system:config`; backend guard remains authoritative.
- Endpoint: `POST /api/imports/departments/apply`.
- Web entry: department maintenance import panel, dry-run gated, same-file gated, confirmation gated.
- Data effect on success:
  - create new department rows only;
  - create safe audit evidence with operation `DEPARTMENT_IMPORT_CREATE`;
  - no update, upsert, delete, merge, hierarchy rewrite, archived reactivation, or partial success.

### Acceptance State

- Backend implementation and tests: completed in Step 65B.
- Local production-like API acceptance: completed in Step 65C with synthetic `S65C_*` data.
- Web minimal slice: completed in Step 65E.
- Local production-like Web acceptance: completed in Step 65F with synthetic `S65F_*` data.
- Step 65F verified:
  - eligible dry-run enables apply;
  - confirmation modal appears before write;
  - successful apply creates 2 department rows and records `DEPARTMENT_IMPORT_CREATE`;
  - repeated apply is rejected with safe `EXISTING_CODE` and no net new rows;
  - limited user cannot see the apply UI and direct apply returns 403;
  - sanitized DB evidence confirms expected department and audit counts.

### Verified Side-Effect Boundary

The department path is limited to department creation plus audit evidence. The accepted boundary excludes:

- user/account import;
- achievement import;
- password creation/reset;
- invite/reset flow;
- DirectMail or real email;
- persisted import jobs or durable idempotency keys;
- production/VPS writes;
- batch real-data import;
- cleanup, deletion, reset, drop, or prune.

### Remaining Risks

- Local synthetic acceptance is not production/VPS acceptance.
- Real department CSVs may contain unexpected existing-code, hierarchy, inactive parent, naming, or ownership-policy cases that were not represented by synthetic fixtures.
- Create-only repeat behavior is conflict-based rather than persisted-job idempotency; operators need explicit count checks before and after apply.
- Department update/merge/reactivation remains out of scope and must not be inferred from this capability.

## User/Account Import

### Current Capability

- Import family: user/account.
- Apply mode: `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Permission: `system:config`; backend guard remains authoritative.
- Endpoint: `POST /api/users/import/apply`.
- Web entry: account management import panel, dry-run gated, same-file gated, confirmation gated.
- Data effect on success:
  - create new `User` rows as `PENDING_ACTIVATION`;
  - create department-scoped initial non-`SYSTEM_ADMIN` `UserRole` rows;
  - persist employee number only where the later employee-number slice has been migrated/accepted for that environment;
  - create safe audit evidence with operation `USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL`.

### Acceptance State

- Backend implementation and tests: completed in Step 66B.
- Local production-like API acceptance: completed in Step 66C with synthetic `S66C_*` data.
- Web design and implementation: completed in Steps 66D and 66E.
- Local production-like Web acceptance: completed in Step 66F with synthetic `S66F_*` data.
- Step 66F verified:
  - eligible dry-run enables `Apply pending no-credential`;
  - confirmation copy states pending/no-credential/no-email/no-login boundaries;
  - successful apply creates 2 pending users and 2 department-scoped roles;
  - imported users have zero credentials, zero sessions, zero lifecycle tokens, and zero mail-delivery evidence;
  - repeated apply is rejected with safe `EXISTING_USER` and no net user increase;
  - limited user cannot see the apply UI and direct apply returns 403.

### Credential And Lifecycle Boundary

This path explicitly does not create or trigger:

- `UserCredential`;
- password, password hash, initial password, password reset, or credential restore;
- `UserSession`;
- invite token, reset token, or account lifecycle token;
- account activation;
- DirectMail, real email, invite email, or reset email;
- login capability for imported users.

Imported users remain pending, no-credential account records. Lifecycle activation is a separate product operation under separate permissions and is not part of import apply.

### Acceptance Boundary

The following are not production session-cookie full acceptance:

- Step 66C local API acceptance used a staging-style synthetic auth context and no credentials or sessions.
- Step 66F local Web acceptance used a no-session/no-credential harness because creating credentials and sessions was forbidden by the Step.

Therefore, Step 66B-66F prove local write behavior, Web gating, permission denial, and no-credential side-effect counts. They do not prove a real production session-cookie operator flow against production infrastructure.

### Remaining Risks

- Production session-cookie full acceptance remains unproven for this endpoint.
- Real CSV data may surface existing-user, existing-role, revoked-role, employee-number, department, or role-scope conflicts that require human review rather than automatic apply.
- Employee-number persistence and uniqueness depend on the target environment having the later employee-number migration safely applied and verified; production migration/backfill remains separately authorized.
- Existing-user update/merge, revoked-role reactivation, activation, invite/resend/reset, and real email remain out of scope.

## Achievement Import

### Current Capability

- Import family: achievement.
- Apply mode: `CREATE_DRAFT_ONLY`.
- Permission: `system:config`; backend guard remains authoritative.
- Endpoint: `POST /api/achievements/import/apply`.
- Web entry: achievement import dry-run panel, dry-run gated, same-file gated, confirmation gated.
- Supported homogeneous apply batches:
  - all-`PAPER`;
  - all-`SOFTWARE_COPYRIGHT`;
  - all-`PATENT`.
- Mixed achievement-type batches remain rejected before writes.
- Data effect on success:
  - create `Achievement` rows in `DRAFT` status only;
  - create exactly one type-detail row per achievement;
  - create contributor rows;
  - create safe audit evidence with operation `ACHIEVEMENT_IMPORT_CREATE_DRAFT`.

### PAPER Acceptance State

- Backend implementation and tests: completed in Step 68B.
- Local production-like API acceptance: completed in Step 68C with synthetic `S68C_*` data.
- Web implementation: completed in Step 68E.
- Local production-like Web acceptance: completed in Step 68F with synthetic `S68F_*` data.
- Verified constraints:
  - normalized DOI required for apply;
  - repeated exact apply returns safe `DB_CONFLICT` and creates no additional rows;
  - limited user direct apply returns 403;
  - no workflow, attachment, fee, reminder, notification, search, resource grant, or state-machine side effects.

### SOFTWARE_COPYRIGHT Acceptance State

- Backend implementation and tests: completed in Step 69B.
- Local production-like API acceptance: completed in Step 69C with synthetic `S69C_*` data.
- Web implementation: completed in Step 69F.
- Local production-like Web acceptance: completed in Step 69G with synthetic `S69G_*` data.
- Verified constraints:
  - normalized software registration number required for apply;
  - repeated exact apply returns safe `DB_CONFLICT` and creates no additional rows;
  - `PATENT` and mixed batches were blocked before the later patent slice;
  - limited user direct apply returns 403;
  - no workflow, attachment, fee, reminder, notification, search, resource grant, or state-machine side effects.

### PATENT Acceptance State

- Fee/reminder boundary plan: completed in Step 70A.
- Backend implementation and tests: completed in Step 70B.
- Local production-like API acceptance: completed in Step 70C with synthetic `S70C_*` data.
- Web design and implementation: completed in Steps 70D and 70E.
- Local production-like Web acceptance: completed in Step 70F with synthetic `S70F_*` data.
- Verified constraints:
  - normalized application number is required for every patent apply row;
  - grant number is an optional second conflict boundary only when application number is present;
  - grant-only and no-identifier rows reject before writes;
  - repeated exact apply returns safe `DB_CONFLICT` and creates no additional rows;
  - `nextFeeDate` and `feeAmount` persisted counts stayed 0;
  - limited user direct apply returns 403.

### PATENT Fee And Reminder Boundary

For the first patent apply slice:

- `nextFeeDate` and `feeAmount` are dry-run preview fields only.
- They are not written to `PatentDetail`.
- They are not included in audit `newValue`.
- They are not displayed as imported fee/reminder data in Web apply success or error UI.
- No `FeeRecord`, `FeeReviewHistory`, `ReminderTask`, or `Notification` rows are created.

Any later decision to persist patent fee-like detail metadata, create fee records, or create reminders needs a separate plan, separate tests, and separate acceptance evidence.

### Verified Achievement Side-Effect Boundary

Across `PAPER`, `SOFTWARE_COPYRIGHT`, and `PATENT`, local acceptance recorded zero deltas or explicit negative assertions for:

- workflow instances, workflow tasks, and workflow actions;
- attachment metadata, storage objects, storage keys, and attachment content;
- fee records and fee review history;
- reminder tasks;
- notifications;
- search logs or search index effects;
- resource access grants or secret-read grants;
- import jobs or durable idempotency records;
- approval submission, approve, reject, archive, void, update, upsert, merge, delete, or other achievement state-machine transitions.

### Remaining Risks

- Local synthetic acceptance is not production/VPS acceptance.
- Real achievement CSVs may expose owner, contributor, department, identifier, duplicate, or historical-data cases not represented by synthetic fixtures.
- The apply path remains create-only and conflict-based; it does not provide update/merge/retry tracking through persisted import jobs.
- Achievement owner/contributor identity quality depends on real user and department data hygiene.
- Patent fee/reminder behavior is intentionally not imported; operators must not assume fee schedules or reminder tasks are created from patent imports.

## Production/VPS Pre-Apply Gates

Before any real production apply, complete all of the following gates in order:

1. Backup gate:
   - Verify production backup readiness for database and attachment/storage domains.
   - Capture a restorable database backup and the matching redacted backup evidence.
   - Confirm rollback/forward-repair limits before write execution.
2. Permission gate:
   - Confirm the operator has `system:config` intentionally and temporarily if needed.
   - Confirm no broader lifecycle, credential, email, or achievement-state permission is being used as import authority.
3. Real CSV sample dry-run gate:
   - Use only a small, representative, de-identified sample first.
   - Run dry-run only.
   - Require zero errors and zero warnings before apply is considered.
   - Review counts, row actions, duplicate/conflict codes, and unsupported-field warnings manually.
4. Staging or production-like smoke gate:
   - Prefer staging with production-shaped but sanitized data.
   - If staging is unavailable, run a production-like smoke against non-production infrastructure only.
   - Do not use real production data for smoke.
5. Read-only health gate:
   - Check service health, database migration status, queue/mail side-effect status where relevant, and current counts for target tables.
   - Read-only checks only; do not mutate production during this gate.
6. Human apply confirmation gate:
   - Require a human to approve the exact import family, exact mode, exact CSV, expected row counts, expected side-effect boundary, and stop conditions.
   - The approval must explicitly state that dry-run has passed and backup evidence is available.
7. Apply execution gate:
   - Apply only the approved file and mode.
   - Do not batch unrelated import families together.
   - Do not automate repeated apply attempts after any unexpected result.
8. Post-apply count gate:
   - Compare before/after counts for created business rows, type-detail rows, contributor or role rows, and audit operation rows.
   - Confirm forbidden side-effect counts remain unchanged for the relevant import family.
   - Preserve redacted evidence only.
9. Rollback and remediation gate:
   - Treat rollback as restore or forward repair, not automatic cleanup.
   - Do not delete imported production rows automatically.
   - If counts or side effects differ from expectation, stop and prepare a manual remediation plan with affected-resource inventory.

## Explicit Production Prohibitions

The following remain prohibited unless separately authorized in a later Step:

- automatic cleanup;
- real-data batch import;
- skipping dry-run;
- applying a file with any dry-run error or warning;
- applying without backup evidence;
- applying without human confirmation;
- production/VPS access during docs-only review;
- touching `.env` / `.env.production` contents;
- creating credentials, sessions, lifecycle tokens, invite/reset emails, real emails, workflow tasks, attachments, fee records, reminders, notifications, search effects, resource grants, or import jobs through these first-slice apply paths;
- deleting, resetting, restoring, pruning, or cleaning local or production resources as part of import apply.

## Recommended Next Steps

- Step 71B: local import overall acceptance checklist and script review, using synthetic data only. This can review existing helper coverage and identify gaps without production access or real data.
- Step 71C: production preflight read-only runbook. This should define read-only commands/checklists for backup evidence, permission confirmation, migration status, dry-run review, and count baselines.
- Real production write execution must be a separately authorized Step. It is not part of Step 71A, 71B, or 71C by default.

## Step 71B Addendum - Local Acceptance Coverage Checklist

- Date: 2026-07-04.
- Added `memory-bank/import-real-write-local-acceptance-checklist.md`.
- Reviewed existing local acceptance helpers and evidence for:
  - Department metadata Step 65C API and Step 65F Web acceptance.
  - User/account Step 66C API and Step 66F Web acceptance.
  - Achievement `PAPER` Step 68C API and Step 68F Web acceptance.
  - Achievement `SOFTWARE_COPYRIGHT` Step 69C API and Step 69G Web acceptance.
  - Achievement `PATENT` Step 70C API and Step 70F Web acceptance.
- Conclusion:
  - Existing local acceptance evidence is sufficient as a local synthetic baseline for the current readiness review.
  - It remains Step-specific helper coverage, not a unified rerunnable aggregate suite.
  - User/account Web acceptance remains no-session/no-credential harness acceptance, not production session-cookie full acceptance.
  - No production/VPS acceptance, real-data import, Docker/browser rerun, apply API execution, or database write was performed in Step 71B.
- Notable optional follow-ups:
  - Add a synthetic aggregate local acceptance plan if future work needs a single end-to-end rerun.
  - Add explicit user/account missing required email/display-name local helper cases if local-helper parity with focused API tests is required.
  - Add broad no-unrelated-table delta checks for department import if future aggregate smoke wants the same side-effect matrix across all import families.
