# Import Real-Write Local Acceptance Checklist

## Step 71B Scope

- Date: 2026-07-04.
- Purpose: audit the existing local import real-write acceptance helpers and evidence without rerunning them.
- This checklist is documentation-only. It does not authorize Docker/browser execution, apply API execution, database writes, production/VPS access, production DB/config access, `.env` / `.env.production` content reads, real-data import, runtime/source/schema/API/Web/package/lockfile/config/script changes, cleanup, deletion, reset, restore, checkout, drop, prune, or handling existing untracked local artifacts.

## Source Material Reviewed

- `memory-bank/import-real-write-readiness-review.md`.
- `memory-bank/testing-strategy.md`.
- Targeted `memory-bank/progress.md` sections for Steps 65C, 65F, 66C, 66F, 68C, 68F, 69C, 69G, 70C, and 70F.
- Targeted `memory-bank/evidence.md` sections for the same Steps.
- Helper files:
  - `memory-bank/step65c-department-import-acceptance.mjs`.
  - `memory-bank/step65f-db-helper.mjs`.
  - `memory-bank/step65f-browser-acceptance.js`.
  - `memory-bank/step65f-web-acceptance.mjs`.
  - `memory-bank/step66c-user-account-import-acceptance.mjs`.
  - `memory-bank/step66f-db-helper.mjs`.
  - `memory-bank/step66f-browser-acceptance.js`.
  - `memory-bank/step66f-web-acceptance.mjs`.
  - `memory-bank/step68c-achievement-import-acceptance.mjs`.
  - `memory-bank/step68f-db-helper.mjs`.
  - `memory-bank/step68f-browser-acceptance.js`.
  - `memory-bank/step68f-web-acceptance.mjs`.
  - `memory-bank/step69c-achievement-import-acceptance.mjs`.
  - `memory-bank/step69g-db-helper.mjs`.
  - `memory-bank/step69g-browser-acceptance.js`.
  - `memory-bank/step69g-web-acceptance.mjs`.
  - `memory-bank/step70c-patent-import-acceptance.mjs`.
  - `memory-bank/step70f-db-helper.mjs`.
  - `memory-bank/step70f-browser-acceptance.js`.
  - `memory-bank/step70f-web-acceptance.mjs`.

## Coverage Legend

- Covered: directly covered by the local acceptance helper/evidence for that row.
- Partial: covered for the relevant slice, but not a full general-purpose matrix.
- N/A: not applicable to that import family or Step.
- Gap: not covered by the local acceptance helper and worth considering in a follow-up.

## Department Metadata Import

| Step | Helper(s) | Synthetic data only | Success path | Repeated apply no new data | Limited user / 403 | Warning/error blocking | Missing required identifier | Mixed batch | Forbidden side-effect delta | Safe output / no sensitive fields | Not production/VPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 65C API | `step65c-department-import-acceptance.mjs` | Covered: `S65C_*` codes and generated local users | Covered: 2 rows, audit delta 2 | Covered: `EXISTING_CODE`, count 2 -> 2 | Covered | Covered: missing parent and duplicate file rollback | N/A for identifier; missing parent covered | N/A | Partial: department count/audit checked, broad unrelated-table deltas not checked | Covered: output status/count/error/audit only; no cookie/session values | Covered |
| 65F Web | `step65f-*` | Covered: `S65F_*` codes and generated local users | Covered: eligible dry-run, confirmation, apply, result, list/tree evidence | Covered: `EXISTING_CODE`, count 2 -> 2 | Covered: UI hidden and direct 403 | Covered: repeat warning rejection; Web implementation tests cover warning/error/non-create disabled states | N/A for identifier; not a dedicated local helper case | N/A | Partial: target department/audit counts checked, broad unrelated-table deltas not checked | Covered: browser/helper avoid printing session values; evidence is status/count/error/audit only | Covered |

### Department Notes

- The local acceptance helpers are intentionally department-scoped. They prove create-only behavior, duplicate replay safety, permission denial, rollback for invalid department hierarchy input, and sanitized evidence.
- Broad forbidden side-effect delta checks across user/account, achievement, workflow, attachment, fee, reminder, notification, search, resource grant, or import-job tables are not present in the department helpers. That is not an immediate blocker for the narrow department slice, but a future aggregate smoke could add a global no-unrelated-delta check.

## User/Account Import

| Step | Helper(s) | Synthetic data only | Success path | Repeated apply no new data | Limited user / 403 | Warning/error blocking | Missing required identifier | Mixed batch | Forbidden side-effect delta | Safe output / no sensitive fields | Not production/VPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 66C API | `step66c-user-account-import-acceptance.mjs` | Covered: `S66C_*` departments/roles/users/emails | Covered: 2 pending users and 2 roles | Covered: `EXISTING_USER`, user count unchanged | Covered | Covered: duplicate file, missing/archived department, high privilege, existing-user warning | Partial: duplicate email/employee and missing department covered; missing email/name not a local helper case | N/A | Covered for account lifecycle boundary: credentials 0, sessions 0, lifecycle tokens 0 | Covered: status/count/error/audit only; no raw credential/session/cookie values | Covered |
| 66F Web | `step66f-*` | Covered: `S66F_*` data | Covered: eligible dry-run, confirmation, apply, result, pending/no-credential summary | Covered: `EXISTING_USER`, count 2 -> 2 | Covered: UI hidden and direct 403 | Covered: repeat warning rejection; Web focused tests cover warning/error/stale-file blocks | Partial: no dedicated missing-email local browser case | N/A | Covered for account lifecycle boundary: credentials 0, sessions 0, lifecycle tokens 0, mail evidence 0 | Covered: no-session/no-credential harness; no credential/session/cookie values printed | Covered; explicitly not production session-cookie full acceptance |

### User/Account Notes

- Step 66C and 66F deliberately use no-credential/no-session harnesses because creating credentials and sessions is outside the import contract.
- These Steps prove pending/no-credential write behavior and side-effect absence for credentials, sessions, lifecycle tokens, and mail delivery.
- They do not prove production session-cookie full acceptance.
- A future synthetic-only review may add explicit missing required email/display-name local acceptance cases if local helper parity with focused API tests is desired.

## Achievement Import

| Type | Step | Helper(s) | Synthetic data only | Success path | Repeated apply no new data | Limited user / 403 | Warning/error blocking | Missing required identifier | Mixed batch | Forbidden side-effect delta | Safe output / no sensitive fields | Not production/VPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PAPER | 68C API | `step68c-achievement-import-acceptance.mjs` | Covered: `S68C_*` data | Covered: 2 draft papers, details, contributors, audit | Covered: `DB_CONFLICT`, no business/audit delta | Covered | Covered: dry-run error and unsupported type | Covered: missing DOI | Partial: first slice rejects non-`PAPER`; no separate `MIXED_TYPE_BATCH` expectation in this Step | Covered: workflow, attachment, fee, reminder, notification, search, resource grant deltas 0 | Covered: status/count/error/audit only; no cookie/session/password output | Covered |
| PAPER | 68F Web | `step68f-*` | Covered: `S68F_*` data | Covered: dry-run, confirmation, apply, safe result, list refresh | Covered: `DB_CONFLICT`, count unchanged | Covered: UI hidden and direct 403 | Covered: repeat warning, missing DOI, non-`PAPER`, dry-run error disabled | Covered: missing DOI | Partial: non-`PAPER` disabled; no separate mixed-batch label in first slice | Covered: workflow, attachment, fee, reminder, notification, search, resource grant deltas 0 | Covered: success/error panels checked for raw DOI, owner/contributor, CSV, cookie/session/token | Covered |
| SOFTWARE_COPYRIGHT | 69C API | `step69c-achievement-import-acceptance.mjs` | Covered: `S69C_*` data | Covered: 2 draft software copyrights, details, contributors, audit | Covered: `DB_CONFLICT`, no business/audit delta | Covered | Covered: missing registration, `PATENT`, dry-run error | Covered: missing registration number | Covered: `MIXED_TYPE_BATCH` for `PAPER` + `SOFTWARE_COPYRIGHT` | Covered: workflow, attachment, fee, reminder, notification, search, resource grant deltas 0 | Covered: status/count/error/audit only; no sensitive values | Covered |
| SOFTWARE_COPYRIGHT | 69G Web | `step69g-*` | Covered: `S69G_*` data | Covered: dry-run, confirmation, apply, safe result, list refresh | Covered: `DB_CONFLICT`, count unchanged | Covered: UI hidden and direct 403 | Covered: repeat warning, missing registration, `PATENT`, dry-run error disabled | Covered: missing registration number | Covered: mixed `PAPER` + `SOFTWARE_COPYRIGHT` disabled | Covered: workflow, attachment, fee, reminder, notification, search, resource grant deltas 0 | Covered: panels checked for registration identifiers, owner/contributor, CSV, cookie/session/token/password/secret/connection string | Covered |
| PATENT | 70C API | `step70c-patent-import-acceptance.mjs` | Covered: `S70C_*` data | Covered: 2 draft patents, details, contributors, audit | Covered: `DB_CONFLICT`, no business/audit delta | Covered | Covered: missing application, grant-only, no identifier, mixed batch, dry-run error | Covered: missing application, grant-only, no identifier | Covered: `MIXED_TYPE_BATCH` | Covered: workflow, attachment, fee, fee review history, reminder, notification, search, resource grant deltas 0 | Covered: status/count/error/audit only; no cookie/session output | Covered |
| PATENT | 70F Web | `step70f-*` | Covered: `S70F_*` data | Covered: dry-run, confirmation, apply, safe result, list refresh | Covered: `DB_CONFLICT`, count/audit unchanged | Covered: UI hidden and direct 403 | Covered: repeat warning, missing application, grant-only, no identifier, mixed batch, dry-run error disabled | Covered: missing application, grant-only, no identifier | Covered: mixed three-type batch disabled | Covered: workflow, attachment, fee, fee review history, reminder, notification, search, resource grant, import job deltas 0 | Covered: panels checked for patent identifiers, owner/contributor, CSV, `nextFeeDate`, `feeAmount`, cookie/session/token classes | Covered |

### Achievement Notes

- Achievement API and Web local helpers have the strongest side-effect delta coverage.
- `PAPER` Step 68C/68F predates homogeneous multi-type apply and therefore treats non-`PAPER` rows as unsupported rather than asserting a later `MIXED_TYPE_BATCH` code. This is expected for the first slice, not a regression.
- PATENT adds the most complete fee/reminder boundary checks: `nextFeeDate` and `feeAmount` are not persisted, and fee/review/reminder/notification/search/resource/import-job deltas stay 0.

## Cross-Cutting Findings

- All reviewed local helpers use synthetic Step-specific data prefixes (`S65C_*`, `S65F_*`, `S66C_*`, `S66F_*`, `S68C_*`, `S68F_*`, `S69C_*`, `S69G_*`, `S70C_*`, `S70F_*`) and generated local users.
- All reviewed acceptance evidence records that the result is local acceptance only and not production/VPS acceptance.
- Web helpers consistently include limited-user UI-hidden plus direct-apply 403 checks.
- Achievement Web helpers include explicit safe success/error panel redaction checks for raw identifiers and person fields.
- User/account helpers explicitly preserve the no-credential/no-session/no-lifecycle-token boundary.
- No reviewed helper is a single aggregate "run all import local acceptance" orchestrator. Each helper is Step-specific and assumes the matching Step environment and built assets are prepared.
- Several helper files contain historical mojibake in UI text selectors due earlier encoding state, but the accepted evidence indicates they worked for their recorded Step. This is not a runtime change request for Step 71B.

## Follow-Up Gaps

- Step 71B found no blocker-level gap in the recorded local acceptance evidence for the current docs-only readiness review.
- Optional Step 71B follow-up for a later synthetic-only Step:
  - Create a read-only checklist runner that inventories helper files and evidence coverage without executing Docker/browser/apply.
  - Add a synthetic aggregate local acceptance plan that can rerun all import families in a controlled non-production environment, if explicitly authorized.
  - Add explicit missing required email/display-name local user/account cases if local helper parity with focused API tests is required.
  - Add broad no-unrelated-table delta checks for department import if a future aggregate smoke wants all import families to share the same side-effect matrix.
  - Keep production session-cookie user/account acceptance as a separate authorization boundary because current user/account import intentionally forbids credential/session creation.

## Step 71B Conclusion

The existing local acceptance helpers and evidence are sufficient as a documented local synthetic acceptance baseline for import real-write readiness. They do not authorize production/VPS writes, production session-cookie full acceptance for user/account import, real-data batch import, or skipping dry-run.
