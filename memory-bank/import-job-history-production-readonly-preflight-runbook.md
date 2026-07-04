# Import Job History Production Readonly Preflight Runbook

Date: 2026-07-04

## Step 75A Scope

- Purpose: define the production read-only preflight path for `ImportJob` / `ImportRun` import history readiness before any future rollout or real-environment acceptance decision.
- This runbook is documentation-only. It does not perform or authorize production/VPS access, production DB access, `.env` / `.env.production` reads, migration execution, production apply, real-data import, retry, delete, cleanup, rollback, download, export, DB writes, permission changes, credential reads, credential propagation, runtime changes, API changes, Web changes, schema changes, migration-file changes, package changes, lockfile changes, or config changes.
- This runbook must be executed only by an explicitly authorized human/operator in a separate production-readiness step. Step 75A itself is not that authorization.

## Preflight Objectives

Use this runbook to verify that the production environment has a safe read-only check path for import task history before enabling or accepting the capability in production.

The preflight covers:

- migration state readiness;
- `ImportJob` / `ImportRun` table-structure presence;
- `system:config` permission confirmation;
- API health;
- read-only history API list/detail behavior;
- Web visibility for the three page-local entries and the settings/system overview;
- safe evidence boundaries that do not expose production data, credentials, raw identifiers, or raw exception material.

## Applicability

This runbook applies to the import history and idempotency capability archived in Step 73E and the settings/system overview archived in Step 74D:

- `ImportJob` as the durable logical import request;
- `ImportRun` as execution attempt and replay evidence;
- `GET /api/import-jobs`;
- `GET /api/import-jobs/:id`;
- Department import page-local history entry for `DEPARTMENT` + `CREATE_ONLY`;
- User/account import page-local history entry for `USER_ACCOUNT` + `CREATE_ONLY_PENDING_NO_CREDENTIAL`;
- Achievement import page-local history entry for `ACHIEVEMENT` + `CREATE_DRAFT_ONLY`;
- settings/system import history overview for users with `system:config`.

This runbook does not authorize `ImportJobItem`, row-level history, raw CSV browsing, source CSV download, production writes, real-data import, retry, cleanup, delete, rollback, export, or raw JSON copy.

## Operator Rules

- Treat every check in this runbook as read-only.
- Use only approved operational channels that are already authorized for production read-only checks.
- Do not ask anyone to paste credentials, sessions, tokens, cookies, passwords, connection strings, private keys, `.env` contents, or production secret material into chat, documents, logs, tickets, or commits.
- Do not record production raw data or personal/business identifiers.
- Record only aggregate status, counts, HTTP status, safe machine codes, safe permission confirmations, and redacted pass/fail summaries.
- Stop immediately on any uncertainty, sensitive-data exposure, unexpected write affordance, failed health check, unknown migration state, missing backup evidence, or permission ambiguity.

## Required Precondition: Backup Confirmation

Backup evidence must be confirmed before any production preflight check continues.

Allowed evidence:

- `backup evidence confirmed`;
- `backup evidence not confirmed`;
- backup scope as a redacted category, such as database or storage coverage;
- restore-readiness status as a boolean or safe machine code.

Forbidden evidence:

- full backup file paths;
- storage bucket/object paths;
- database URLs;
- credentials, passwords, tokens, cookies, private keys, or connection strings;
- account names or secret-bearing operational notes.

If backup evidence is not confirmed, stop before migration, API, DB metadata, permission, or Web checks.

## Read-Only Check Sequence

Complete these gates in order. Each gate records only safe evidence.

| Gate | Read-only check method | Safe evidence to record | Stop condition |
| --- | --- | --- | --- |
| 1. Backup state | Confirm through the authorized backup evidence channel that restorable production backup evidence exists. Do not execute restore, delete, cleanup, or mutation actions. | `backupConfirmed=true/false`, redacted scope category, restore-readiness safe code. | Backup is not confirmed, ambiguous, expired, or requires exposing secret material. |
| 2. Migration state | Confirm the production migration state through an approved read-only migration-status mechanism or operations dashboard. Do not run migration deploy, migrate reset, seed, repair, backfill, or any schema mutation. | Expected app/version marker, migration state `known/unknown`, safe migration-status code, no raw connection data. | Migration state is unknown, mismatched, or requires executing a migration to inspect. |
| 3. Table structure | Confirm `ImportJob` and `ImportRun` exist through read-only schema metadata inspection, approved ORM metadata, or an operations-owned DB metadata view. Do not run `ALTER`, `CREATE`, `DROP`, `INSERT`, `UPDATE`, `DELETE`, backfill, or data repair. | `ImportJob present=true/false`, `ImportRun present=true/false`, expected enum/index/relationship status as safe machine codes. | Either table is missing, shape is unknown, or inspection requires table mutation or data writes. |
| 4. Permission boundary | Confirm the `system:config` permission grant is present and is the required authority for import-history list/detail and settings overview visibility. Use an approved permission manifest, admin read-only view, or non-secret operator role confirmation. Do not grant, revoke, edit, seed, or backfill permissions. | `systemConfigConfirmed=true/false`, operator role category, permission-source safe code. | `system:config` cannot be confirmed, non-equivalent permissions are proposed as substitutes, or permission changes are requested. |
| 5. API health | Perform a read-only health check through the approved production API health endpoint or operations dashboard. Do not include full request headers, user agent, IP, cookies, sessions, tokens, or raw exception text in evidence. | HTTP status, safe service-health code, timestamp, no raw headers. | API health fails, times out beyond the approved threshold, or exposes sensitive error material. |
| 6. History list API | With an authorized `system:config` session controlled by the human operator, check `GET /api/import-jobs` with a small page size. Do not use write methods, import apply routes, retry routes, delete routes, cleanup routes, rollback routes, download routes, export routes, or raw JSON capture. | HTTP status, item count, page metadata, allowlist-pass safe code, absence of forbidden fields. | Response includes sensitive fields, raw CSV, raw audit IDs, credentials, personal/business identifiers, raw headers, raw exception text, or any write affordance. |
| 7. History detail API | Execute `GET /api/import-jobs/:id` only when there is an approved safe sample id and authorization to inspect that sample. Do not record the raw id; record a redacted alias or safe machine code. Skip rather than improvise if no safe sample exists. | HTTP status, safe sample alias, run count, `auditCount` presence, allowlist-pass safe code. | No safe sample id is available, authorization is unclear, response exposes sensitive fields, or raw id recording is requested. |
| 8. Web read-only visibility | Check the three page-local Web entries and the settings/system overview with a `system:config` operator. Confirm non-`system:config` users do not see the overview or trigger overview-owned history requests if that check is authorized. Do not start unauthorized browser automation or capture sensitive page data. | Visible/hidden status, GET-only observation summary, forbidden-control absence, safe UI code. | Web shows retry/delete/cleanup/rollback/download/export/raw JSON/bulk action controls, sensitive fields, or unauthorized visibility/request behavior. |

## API Response Safety Expectations

`GET /api/import-jobs` and `GET /api/import-jobs/:id` are acceptable only when they remain read-only and allowlisted.

Allowed evidence categories:

- HTTP status;
- page size and aggregate item count;
- family/mode/status safe enum values;
- run count;
- `auditCount`;
- safe timestamps or time-window summaries;
- safe machine codes such as `HISTORY_LIST_ALLOWLIST_PASS`, `HISTORY_DETAIL_ALLOWLIST_PASS`, or `HISTORY_DETAIL_SKIPPED_NO_SAFE_SAMPLE`.

Forbidden evidence categories:

- raw CSV or CSV excerpts;
- email, employeeNo, employee number, DOI, registration number, patent number, title, or personnel names;
- credential, session, token, cookie, password, connection string, private key, or `.env` content;
- raw audit IDs;
- full request headers;
- user agent;
- IP address;
- raw exception text;
- raw production JSON payloads;
- source file download links or raw source paths.

## Web Visibility Checklist

Use this checklist only for read-only visibility and absence-of-affordance checks.

| Surface | Expected read-only check |
| --- | --- |
| Department import page-local entry | A `system:config` user can reach the import history entry filtered to `DEPARTMENT` + `CREATE_ONLY`; no retry/delete/cleanup/rollback/download/export/raw JSON/bulk action is visible. |
| User/account import page-local entry | A `system:config` user can reach the import history entry filtered to `USER_ACCOUNT` + `CREATE_ONLY_PENDING_NO_CREDENTIAL`; no credential, session, token, cookie, password, lifecycle, invite, or reset material is visible. |
| Achievement import page-local entry | A `system:config` user can reach the import history entry filtered to `ACHIEVEMENT` + `CREATE_DRAFT_ONLY`; no DOI, registration number, patent number, title, contributor, or person-name values are recorded. |
| Settings/system overview | A `system:config` user can see the secondary import history overview; a non-`system:config` user does not see it or trigger overview-owned history requests, if that negative check is authorized. |

The Web check records only pass/fail summaries, HTTP status where observed, safe filter-state codes, and forbidden-control absence.

## Stop Conditions

Stop the preflight immediately if any of the following occurs:

- migration state is unknown;
- backup evidence is not confirmed;
- `system:config` permission cannot be confirmed;
- API health fails;
- history API returns sensitive fields;
- history API returns raw CSV, raw audit IDs, raw headers, raw exception text, credential material, or personal/business identifiers;
- Web displays retry, delete, cleanup, rollback, download, export, raw JSON, or bulk action controls;
- Web visibility does not match the `system:config` boundary;
- a safe sample id for detail is unavailable or authorization is unclear;
- any person asks to paste credentials into chat or documentation;
- any step requires production writes, migration execution, permission edits, import apply, retry, cleanup, rollback, download, export, or direct secret handling.

After a stop condition, record only the stop code and safe summary. Do not retry automatically, broaden access, request credentials in chat, or perform remediation from this runbook.

## Explicit Non-Authorization

This runbook does not authorize:

- production apply;
- real-data import;
- migration execution;
- retry, delete, cleanup, or rollback;
- download or export;
- DB writes;
- permission modification;
- credential reading or propagation;
- `.env` or `.env.production` content reads;
- raw production JSON capture;
- source CSV inspection;
- production/VPS access by Step 75A itself.

Any future production write or real-environment acceptance must be a separate explicit step with its own authorization, backup confirmation, stop conditions, and safe evidence plan.

## Safe Evidence Template

Use this template for future execution evidence. Leave fields as `not checked` when a gate is intentionally skipped.

```text
Runbook:
Execution date:
Operator role category:
Authorization reference:
Backup evidence confirmed:
Backup scope category:
Migration state:
ImportJob table presence:
ImportRun table presence:
system:config confirmation:
API health HTTP status:
API health safe code:
GET /api/import-jobs HTTP status:
GET /api/import-jobs item count:
GET /api/import-jobs allowlist code:
GET /api/import-jobs/:id status:
Safe sample alias:
Detail allowlist code:
Detail skipped reason:
Web Department entry status:
Web User/account entry status:
Web Achievement entry status:
Web settings overview status:
Forbidden controls observed:
Sensitive evidence observed:
Stop condition:
Final preflight result:
```

Template rules:

- Do not paste raw API responses.
- Do not paste raw production SQL output.
- Do not paste raw browser screenshots if they contain production data or identifiers.
- Do not paste headers, cookies, tokens, sessions, IPs, user agents, stack traces, or exception bodies.
- Use safe machine codes and aggregate counts instead of raw data.

## Step 75A Closure Boundary

Step 75A creates the runbook only. It does not execute the runbook, access production, inspect a production database, read secrets, start services, run browser automation, perform migrations, run import apply, or modify runtime code.
