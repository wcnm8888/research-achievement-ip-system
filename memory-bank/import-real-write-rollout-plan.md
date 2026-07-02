# Import Real-Write Rollout Plan

## Step 65A Scope

- Date: 2026-07-02.
- Purpose: return from the backup track to the import track and plan how department, user/account, and achievement import can move from dry-run to a first real-write slice.
- This file is documentation-only. It does not authorize runtime code changes, real import writes, Docker operations, database mutation, production/VPS access, account password changes, invite/reset issuance, real email, Prisma schema changes, migrations, seed/backfill, cleanup, deletion, reset, drop, prune, or handling existing untracked artifacts.

## Current Dry-Run Coverage

| Import | Endpoint behind API prefix | Permission | Covered today | Still missing for real-write |
| --- | --- | --- | --- | --- |
| Department metadata | `POST /api/imports/departments/dry-run` | `system:config` | CSV-only upload, 1 MB limit, UTF-8 parser, strict `code` / `name` / `parentCode` columns, required fields, formula-like value rejection, uppercase code format, file duplicate detection, existing-code warning, active parent lookup, file-local parent cycle detection, safe summary and row preview. | Apply endpoint, transaction-scoped create, parent-before-child insertion, race-condition recheck, duplicate write handling, audit event, local production-like write acceptance. |
| User account | `POST /api/users/import/dry-run` | `system:config` | CSV-only upload, strict account columns, sensitive credential/token/session/link/header rejection, email/display name/department/role/scope/status validation, department and role lookup, existing user and role-assignment warnings, `GLOBAL` scope denial, `SYSTEM_ADMIN` denial, `ACTIVE` import denial, `NO_CREDENTIAL` preview. | User and role writes, lifecycle decision for pending users, credential-free account creation contract, account audit evidence, employee number schema decision, existing/revoked assignment handling, invite/reset separation. |
| Achievement | `POST /api/achievements/import/dry-run` | `system:config` | CSV-only upload, strict achievement/detail columns, sensitive/direct-id/storage/workflow/fee/raw-payload column rejection, `PAPER` / `PATENT` / `SOFTWARE_COPYRIGHT` field validation, contributor parsing, owner and contributor user lookup, owner department match, active department lookup, normalized identifier duplicate and DB conflict checks, `DRAFT`-only candidate boundary. | Multi-table draft writes, type-detail and contributor write mapping, normalized conflict race-condition handling, audit event, owner import semantics, workflow/attachment/fee exclusion guards, local production-like write acceptance. |

Common dry-run foundation now exists through `apps/api/src/imports/import-dry-run.shared.ts` and `apps/web/src/importDryRunUi.tsx`: shared file metadata, result shape, row status, issue shape, parser, header validation, formula-like detection, file-size constant, base summary, and read-only Web shell. All three dry-runs currently remain `system:config` only and expose no execute-import control.

## First-Slice Selection

Department metadata is the best first real-write slice.

Reasons:

- It is the smallest data graph: one business table plus audit log.
- It has no credential, session, lifecycle-token, email, attachment, fee, workflow, or secret-resource side effect.
- Existing `DepartmentManagementService.createDepartment` already demonstrates the required pattern: `system:config` permission, active parent validation, Prisma transaction, and audit event in the same transaction.
- Its CSV contract is already narrow and safe: `code`, `name`, and optional `parentCode`.
- Its biggest write-specific risks are manageable in a first slice: parent ordering, duplicate code races, and making re-runs data-effect idempotent.

User/account is not the first slice because it crosses user rows, role assignments, account lifecycle state, credential boundaries, employee-number gaps, and invite/reset policy. Achievement is not the first slice because it crosses achievement main rows, typed detail rows, contributors, normalized unique conflicts, owner/contributor identity, and later workflow/fee/attachment expectations.

## Step 65B Recommended Slice

Implement a backend-only department metadata real-write apply endpoint.

Recommended route:

- `POST /api/imports/departments/apply`.
- Multipart field: `file`.
- Static permission: `system:config`.
- Guard stack: existing `UserContextGuard` and `PermissionGuard`.
- Import mode: `CREATE_ONLY`.
- No Web execute button in Step 65B unless explicitly authorized later.

Recommended behavior:

- Reuse the dry-run parser and validation path server-side; never trust a client-supplied dry-run result.
- Reject the apply request before opening writes unless the freshly computed validation report has only `CREATE` candidates and no errors or warnings.
- Insert departments in dependency order so file-local parents are created before children.
- Keep the whole apply operation all-or-nothing inside one Prisma transaction.
- Recheck parent existence/status and code uniqueness inside the transaction before each insert.
- Write audit events in the same transaction.
- Return a write report with sanitized file metadata, total rows, created rows, skipped rows, and per-row status. Do not echo file content.

Recommended first-slice exclusions:

- No update/merge existing department.
- No archived department reactivation.
- No department disable/enable.
- No department hierarchy update for existing records.
- No partial success.
- No persisted import job table or idempotency key.
- No user/account or achievement apply endpoint.
- No Web execute-import control.

## Guarantees Required For First Slice

### Transaction Boundary

- Use one Prisma `$transaction` for all department creates and audit events.
- If any row fails revalidation or insertion, rollback the full batch.
- Do not create audit rows outside the same transaction.
- Do not persist uploaded files.

### Idempotency And Duplicate Handling

- File duplicates stay hard errors through the existing dry-run validation.
- Existing department codes stay non-writable in Step 65B. A file with any existing-code warning must not write.
- A repeated exact apply after a successful first apply must have no duplicate data effect. It may return a validation/apply conflict report because the codes now exist, but it must not create additional rows.
- Prisma unique conflicts remain a final race-condition guard and should map to a safe conflict response.
- Durable idempotency keys or import job history are deferred because they need a schema and product decision.

### Validation Consistency

- The apply path must call the same parsing and row-validation logic as dry-run.
- Step 65B should factor only the minimum shared department planning output needed for apply, keeping current dry-run JSON behavior stable.
- Tests must prove that a valid dry-run candidate file is the only file shape accepted by apply.
- Tests must cover missing required columns, unsupported columns, formula-like values, duplicate codes in file, unknown parent, file-local parent cycle, existing DB code, inactive parent, and parent-created-earlier-in-same-file.

### Permission And Role Scope

- Keep first-slice write permission as `system:config`.
- Do not add department-scoped import permission in Step 65B.
- Do not allow department administrators to run real-write import until a separate permission and exact scope model is designed.
- Require `UserContext` with `userId` and `departmentId` so audit actor facts are available.

### Audit Evidence

- Record safe audit events in the transaction.
- Recommended audit action: existing `configUpdate`.
- Recommended target: created department id under the existing system config target pattern.
- Recommended new value fields: operation `DEPARTMENT_IMPORT_CREATE`, import type, sanitized file name or file name omitted, row number, department id, code, name, parent id, and batch summary counts.
- Do not record file content, raw uploaded body, local path, operator environment values, credentials, tokens, cookies, private keys, connection strings, or external account data.

### Local Production-Like Acceptance

Step 65B should be acceptable locally before any production/VPS work:

- Unit tests for service, repository, controller, and `AppModule` route wiring.
- API acceptance in local production-like stack only when explicitly authorized for that Step.
- Synthetic local CSV fixtures for:
  - two-level department create success;
  - existing-code rejection;
  - parent-not-found rejection;
  - file duplicate rejection;
  - non-`system:config` caller rejection.
- Count checks before and after apply:
  - successful apply increases department count by expected rows and audit count by expected events;
  - rejected apply leaves department and audit counts unchanged.
- Re-run exact successful CSV and verify no additional department rows are created.
- Evidence must record only counts, status codes, safe codes/ids where needed, and redacted summaries.

## Deferred Operations

The following remain deferred after Step 65A and should not be included in Step 65B:

- Production/VPS write execution.
- Batch real-data import.
- Password creation, modification, or reset.
- Invite/reset token flow.
- DirectMail or real email.
- User/account real-write import.
- Achievement real-write import.
- Attachment, fee, workflow, search, or resource-grant import.
- Department update/merge/reactivation.
- Persisted import job history or durable idempotency keys.
- Prisma schema changes, migrations, seed/backfill, package changes, deployment, push, cleanup, deletion, reset, drop, or prune.

## Later Rollout Direction

After a department create-only apply slice is implemented and accepted, the next safe sequence should be:

1. Department apply local production-like acceptance, if not done in Step 65B.
2. Department existing-record review/update design as a separate docs-only Step.
3. User/account import write design, starting with pending users without credentials and without invite/reset issuance.
4. Achievement draft import write design, starting with one type or a strict all-type draft create mapper only after department/user write risks are settled.

## Step 65B Implementation Record

- Date: 2026-07-02.
- Implemented backend-only department metadata create-only apply.
- Added `POST /api/imports/departments/apply`.
- Apply mode:
  - Supports only `CREATE_ONLY`.
  - Rejects non-`CREATE_ONLY` mode before parsing or opening a transaction.
- Validation and write path:
  - Reuses the same server-side department import parsing and dry-run validation plan as `POST /api/imports/departments/dry-run`.
  - Rejects apply when any row has dry-run errors or warnings, including duplicate file codes, unknown parents, file-local parent cycles, unsupported columns, formula-like values, or existing department codes.
  - Inserts file-local parents before children.
  - Uses one Prisma transaction for all department creates and audit events.
  - Rechecks department code uniqueness and external parent active existence inside the transaction.
  - Maps Prisma unique conflicts to a safe apply rejection summary.
- Audit:
  - Records `CONFIG_UPDATE` audit events in the same transaction.
  - Uses operation `DEPARTMENT_IMPORT_CREATE`.
  - Audit metadata records stable row/department facts only.
- Response:
  - Successful apply returns `dryRun: false`, `mode: CREATE_ONLY`, sanitized file metadata, created/skipped/failed counts, error count, warning count, and created row ids/codes.
  - Rejected apply returns safe error summaries through a 400 response.
- Still deferred:
  - Web execute button.
  - Department update/upsert/delete/import merge.
  - User/account and achievement real-write import.
  - Production/VPS writes, batch real-data import, password operations, invite/reset flow, DirectMail/real email, attachment/fee/workflow/search/resource-grant import, persisted import jobs, durable idempotency keys, schema/migration work, deployment, cleanup, deletion, reset, drop, and prune.

## Step 65C Local Production-Like Acceptance Record

- Date: 2026-07-02.
- Scope:
  - Local production-like acceptance for `POST /api/imports/departments/apply`.
  - Synthetic CSV and synthetic local `S65C_*` auth/business rows only.
  - This record does not claim production/VPS acceptance.
- Acceptance helper:
  - Added `memory-bank/step65c-department-import-acceptance.mjs`.
  - Intended to run inside the local API container.
  - Posts multipart CSV to `/api/imports/departments/apply`.
  - Outputs only sanitized status codes, department count deltas, audit operation delta, and safe error codes.
  - Does not print cookie/session/credential/connection values.
- Covered checks:
  - Parent-before-child tree create succeeded with 2 created rows.
  - Repeated exact apply was rejected by `CREATE_ONLY` duplicate handling and produced no net new department rows.
  - Missing parent rejection left department counts unchanged.
  - Duplicate code in the file was rejected and left department counts unchanged.
  - Limited user without `system:config` was rejected and left department counts unchanged.
  - Audit operation `DEPARTMENT_IMPORT_CREATE` was written for the successful create path.
- Sanitized evidence:
  - Health status: 200.
  - Synthetic admin / limited login statuses: 200 / 200.
  - Success: status 201, created rows 2, department count 0 -> 2, audit operation delta 2.
  - Repeat apply: status 400, department count 2 -> 2, error code `EXISTING_CODE`.
  - Missing parent rollback: status 400, department count 0 -> 0, error code `UNKNOWN_PARENT`.
  - Duplicate file rollback: status 400, department count 0 -> 0, error code `DUPLICATE_IN_FILE`.
  - Permission denied: status 403, department count 0 -> 0.
- Verification:
  - `corepack pnpm --filter @research-ip/api test -- department-import-dry-run imports.app-module`: PASS, 4 files / 30 tests.
  - `corepack pnpm --filter @research-ip/api typecheck`: PASS.
- Still deferred:
  - Production/VPS write execution.
  - Batch real-data import.
  - Web apply button.
  - User/account real-write import.
  - Achievement real-write import.
  - Password changes/resets, invite/reset flow, and DirectMail/real email.

## Step 65D Web Entry Design Record

- Date: 2026-07-02.
- Scope:
  - Documentation-only design for a future department apply Web entry.
  - No Web button implementation, no apply API call, no Docker, no database write, and no production/VPS access.
- Design document:
  - Added `memory-bank/department-import-apply-web-entry-design.md`.
- Permission:
  - Reuse the existing department maintenance frontend gate: `hasSystemConfigPermission(authUser)`.
  - Backend `system:config` guard remains authoritative.
  - Do not add department-scoped import permission in the first Web entry.
- Eligibility:
  - Apply should be visible/enabled only after a same-file dry-run result is eligible.
  - Required conditions: `CREATE_ONLY`, `DEPARTMENT_METADATA`, `dryRun=true`, total rows > 0, zero errors, zero warnings, all rows `VALID`, all candidate actions `CREATE`, and no in-flight submit.
  - Warnings are not allowed because current department warnings include existing-code conflicts and therefore do not represent pure create-only work.
- Interaction:
  - Keep `Run dry-run` as the first action.
  - Show a secondary `Apply create-only` entry only after eligibility passes.
  - Require a confirmation modal that states this creates department metadata only and does not update/upsert/delete/merge/reactivate.
  - Use separate apply loading state, duplicate-submit protection, stale-file reset, and sanitized error/result display.
- Evidence display:
  - Show created count, skipped/failed count if present, safe error codes, and audit operation `DEPARTMENT_IMPORT_CREATE`.
  - Do not display raw uploaded content, local paths, credentials, cookies, tokens, private keys, connection strings, or unmasked audit payloads.
- Step 65E recommendation:
  - Implement the smallest Web slice: typed apply result/input, API client helper, panel/page state, confirmation modal, safe result view, and focused Web Vitest coverage.
  - Keep user/account apply, achievement apply, production/VPS writes, browser/Docker acceptance, and production rollout deferred unless separately authorized.
