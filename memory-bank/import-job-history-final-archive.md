# Import Job History Final Archive

Date: 2026-07-04

Scope: final documentation archive for Step 72A through Step 73D covering `ImportJob` / `ImportRun` import history, idempotency, replay protection, backend read-only history API, Web read-only entries, and local acceptance evidence.

This archive is documentation-only. It does not authorize production access, production apply, real-data import, schema changes, runtime changes, retry, cleanup, delete, rollback, or source CSV download.

## Completed Capability Archive

Step 72A established the import job history and idempotency direction:

- `ImportJob` represents the durable logical import request.
- `ImportRun` represents execution attempts and replay evidence.
- `ImportJobItem` was explicitly deferred until row-level safe history receives a separate privacy review.
- The first supported families and modes were scoped to department `CREATE_ONLY`, user/account `CREATE_ONLY_PENDING_NO_CREDENTIAL`, and achievement `CREATE_DRAFT_ONLY`.

Step 72B and Step 72C completed the database foundation:

- Added import-specific enums for family, mode, job status, run status, run trigger, and failure stage.
- Added the additive `ImportJob` schema and migration.
- Added the additive `ImportRun` schema and migration.
- Kept business tables unchanged.
- Kept `ImportJobItem` out of the first schema slice.

Step 72D through Step 72N completed backend job/run/idempotency wiring and local API/DB acceptance:

- Department import `CREATE_ONLY` writes `ImportJob` / `ImportRun`, claims same-key work, records success/rejection/failure summaries, and returns replay or in-flight responses without re-running writes.
- Achievement `PAPER` import `CREATE_DRAFT_ONLY` uses the same job/run/idempotency pattern.
- Achievement `SOFTWARE_COPYRIGHT` import `CREATE_DRAFT_ONLY` uses the same job/run/idempotency pattern.
- Achievement `PATENT` import `CREATE_DRAFT_ONLY` uses the same job/run/idempotency pattern while preserving the no-fee/no-reminder first-slice boundary.
- User/account import `CREATE_ONLY_PENDING_NO_CREDENTIAL` uses the same job/run/idempotency pattern while preserving pending activation, no credential, no session, no lifecycle token, and no mail side-effect boundaries.
- Local API/DB acceptance used synthetic data only and verified the core status transitions for department, achievement, and user/account imports.

Step 73A through Step 73D completed read-only history access:

- Step 73A designed the Web entry strategy and selected three family-local read-only entries first.
- Step 73B implemented backend read-only history API routes:
  - `GET /import-jobs`;
  - `GET /import-jobs/:id`.
- Step 73B kept the API under `system:config`, used allowlisted DTOs, returned safe aggregate and run summary fields, and exposed only `auditCount` instead of raw audit identifiers.
- Step 73C implemented Web read-only entries on:
  - Department import page: `DEPARTMENT` + `CREATE_ONLY`;
  - User/account import page: `USER_ACCOUNT` + `CREATE_ONLY_PENDING_NO_CREDENTIAL`;
  - Achievement import page: `ACHIEVEMENT` + `CREATE_DRAFT_ONLY`, with optional `achievementType` filtering.
- Step 73D completed local browser acceptance for the three Web entries and recorded one Web-only development-mode permission-context fix needed for browser acceptance.

## Verified Semantics

The mainline now has verified semantics for:

- `EXECUTED`: first successful same-key apply performs the authorized create-only write path and persists safe job/run success evidence.
- `REPLAYED_SUCCESS`: same-key apply after success returns the stored safe result and does not perform a second business write.
- `IMPORT_IN_PROGRESS`: same-key apply while a job is running returns an in-flight response and does not start a second transaction.
- `REJECTED` safe replay: validation or conflict rejection is persisted as safe summary evidence and replayed safely for the same key without business writes.
- `FAILED`: failed jobs are not automatically retried; retry remains unsupported in this delivery.
- Web read-only list/detail: the Web surfaces list aggregate fields and detail safe summaries, run statuses, audit counts, and plain-language replay/in-flight/rejected/failed explanations.
- `system:config` permission boundary: frontend visibility remains an affordance, and backend guards remain authoritative.
- GET-only history network boundary: local browser acceptance observed only `GET /api/import-jobs` and `GET /api/import-jobs/:id` for import-history traffic.

## Explicitly Still Unsupported

The completed delivery still does not support:

- automatic retry;
- cleanup, delete, or rollback;
- persisted `ImportJobItem`;
- settings/system import-history overview;
- production apply;
- real-data import;
- source CSV download;
- raw audit identifier browsing;
- update, merge, reactivation, partial success, or cross-family mixed-batch import behavior.

## Safety And Privacy Boundary

The archived delivery keeps the following boundaries:

- Do not display raw CSV content, CSV excerpts, imported row values, or source CSV download links.
- Do not display personal or business identifiers such as email, employee number, DOI, registration number, patent number, achievement title, or personnel names.
- Do not display credential, session, token, cookie, password, connection string, private key, raw request header, raw user agent, raw IP address, or raw exception values.
- Do not provide retry, delete, cleanup, rollback, or download controls in the Web history UI.
- Do not expose raw audit identifiers; the read surface exposes only audit counts.
- Do not treat local browser acceptance as production or VPS acceptance.
- Do not treat route mock/stub browser acceptance as real production database validation.
- Do not infer production readiness from local synthetic API/DB acceptance.

## Evidence Summary

Backend and database behavior were accepted locally with synthetic data for:

- department `CREATE_ONLY`;
- achievement `PAPER` `CREATE_DRAFT_ONLY`;
- achievement `SOFTWARE_COPYRIGHT` `CREATE_DRAFT_ONLY`;
- achievement `PATENT` `CREATE_DRAFT_ONLY`;
- user/account `CREATE_ONLY_PENDING_NO_CREDENTIAL`.

Backend read-only history API verification covered:

- list and detail routes;
- `system:config` guards;
- query validation;
- safe DTO allowlists;
- detail `auditCount` derivation without returning raw audit identifiers;
- absence of write routes or retry/delete/cleanup/rollback behavior.

Web verification covered:

- API client paths composed to `/api/import-jobs` and `/api/import-jobs/:id`;
- three page-local import history entries with fixed family/mode filters;
- achievement `achievementType` filtering;
- loading, empty, error, list, and detail states;
- permission visibility and no-request behavior for users without `system:config`;
- absence of forbidden controls and sensitive display fields.

Local browser acceptance covered:

- Department, User account, and Achievement pages at local Vite URL;
- system-admin demo visibility and researcher demo hidden/no-request behavior;
- loading, empty, list, detail, error, and `achievementType=PATENT` filter behavior;
- GET-only import-history network traffic;
- no forbidden controls or sensitive strings in the history panel/drawer.

## Future Recommendations

If continuing product capability:

- Step 74A can design a settings/system unified read-only import-history overview as a secondary index over the already accepted family-local entries.

If continuing production preparation:

- Create a separate production read-only preflight runbook for migration state, permissions, API health, backup status, and safe history-read readiness.
- Keep the runbook read-only unless a later step explicitly authorizes production writes.

If continuing real-environment acceptance:

- Require separate explicit authorization.
- Do not paste database URLs, passwords, tokens, cookies, connection strings, or other credentials into chat, documents, logs, or commits.
- Record only safe, de-identified evidence and do not use local route mock/stub evidence as a substitute for real production database validation.

## Archive Position

Step 72A through Step 73D close the import job history and idempotency mainline for local development acceptance. The delivery is ready for later product planning or production-readiness planning, but it is not itself production/VPS acceptance, production apply authorization, real-data import authorization, or authorization for retry/delete/cleanup/rollback behavior.
