# Import Job History Settings Overview Plan

Date: 2026-07-04

Scope: Step 74A documentation-only design for a unified settings/system read-only import history overview.

Non-scope: no Web implementation, no API implementation, no schema or migration change, no package or lockfile change, no service startup, no browser run, no database access, no production or VPS access, and no import apply execution.

## Position

The unified overview belongs inside the existing settings/system configuration boundary. It should be reachable from the current Settings area as a secondary read-only index after the three family-local import history entries already available on:

- Department import: `DEPARTMENT` + `CREATE_ONLY`.
- User account import: `USER_ACCOUNT` + `CREATE_ONLY_PENDING_NO_CREDENTIAL`.
- Achievement import: `ACHIEVEMENT` + `CREATE_DRAFT_ONLY`.

The settings/system overview must not replace the Department, User account, or Achievement page-local entries. Those page-local entries remain the primary operator recovery path because they preserve task context and keep privacy review scoped to the import family the operator is already handling.

The settings/system overview is for cross-family support visibility only. It is not a control center and must not introduce write actions, row-level browsing, object drilldowns, or bulk operations.

## Data Source

Step 74B should reuse the Step 73B read-only safe DTO surface:

- `GET /api/import-jobs` for the list.
- `GET /api/import-jobs/:id` for the safe detail drawer or panel.

No new backend route is required by this design because the Step 73B list query already supports the required filters and pagination. If Step 74B discovers a gap, it should be treated as a separate API design decision rather than silently widening the Web scope.

The Web must rely on backend authorization as authoritative. Frontend visibility is only an affordance.

## Filters And Ordering

The settings/system overview should expose these list filters:

- `family`.
- `mode`.
- `achievementType`.
- `status`.
- `createdFrom`.
- `createdTo`.
- `page`.
- `pageSize`.

Default ordering is `createdAt desc`. If the backend applies a secondary stable tie-breaker such as `id desc`, the Web should treat that as backend-owned ordering detail and not display opaque ids to users.

Recommended Web defaults:

- no family filter selected, so the first load shows the latest safe records across all families;
- no mode filter selected unless family-specific narrowing has been applied;
- no achievement type filter selected by default;
- no status filter selected by default;
- `page = 1`;
- `pageSize = 20`.

Changing any non-pagination filter should reset `page` to `1`.

## List Display

The list should render only Step 73B / 73C safe DTO fields. Required list fields:

- import family;
- mode;
- achievement type enum or `N/A`;
- job status;
- aggregate counts:
  - `acceptedRowCount`;
  - `createdBusinessCount`;
  - `createdCompanionCount`;
  - `auditCount`;
- latest run status metadata when present;
- safe machine error codes from `safeErrorCodes` and latest run `failureCode`;
- timestamps:
  - `createdAt`;
  - `completedAt`;
  - latest run `startedAt` / `finishedAt` only if useful and still compact.

The list may use the opaque `ImportJob.id` internally as a row key and to request detail, but should not display it, copy it, place it in a shareable route, or present it as a business identifier.

## Detail Display

The detail view should remain a safe drawer or panel opened from a selected list row. It should show:

- `family`;
- `mode`;
- `achievementType`;
- job `status`;
- `acceptedRowCount`;
- `createdBusinessCount`;
- `createdCompanionCount`;
- `auditCount`;
- safe machine error codes;
- `createdAt`;
- `completedAt`;
- sanitized `safeSummary`;
- sanitized run `validationSummary` and `applySummary` when exposed by the Step 73B DTO;
- run status rows:
  - `attemptNo`;
  - `trigger`;
  - `status`;
  - `failureCode`;
  - `failureStage`;
  - `startedAt`;
  - `finishedAt`;
  - `completedBusinessTransactionAt`;
  - run-level `auditCount`.

The detail view should include plain-language read-only explanations:

- Replay: the request already completed successfully; stored safe counts are shown and no new write is started.
- In-flight: a request is pending or running; no second write was started and the operator should check again later or inspect backend health through a separate process.
- Rejected: validation or safety rules blocked the request; only safe reason codes and counts are shown.
- Failed: the claimed attempt failed; automatic retry is not available from this overview.

## Permission

The overview remains under `system:config`.

Do not add an `import-history` permission in Step 74A or the follow-up 74B implementation. Users without `system:config` must not see the overview and must not trigger `/api/import-jobs` requests from the Web. Backend guards remain authoritative even if the frontend hides the entry.

This design does not expand access to department admins, lifecycle/invite/reset users, audit-only users, achievement-state users, or support roles without `system:config`.

## Prohibited Display And Actions

The overview must not display:

- raw CSV content;
- CSV excerpts;
- imported row values;
- source file names or file paths;
- email;
- employee number;
- DOI;
- software registration number;
- patent application number;
- patent grant number;
- patent number;
- achievement title;
- personnel names;
- owner names;
- contributor names;
- role names;
- department names;
- organization text;
- credential values or hashes;
- session ids or hashes;
- lifecycle tokens;
- API tokens;
- cookies;
- passwords or password hashes;
- private keys;
- storage keys;
- mail payloads;
- connection strings;
- `.env` values;
- raw request headers;
- raw user agents;
- raw IP addresses;
- raw exception text;
- raw audit ids.

The overview must not provide:

- retry;
- delete;
- cleanup;
- rollback;
- source CSV download;
- export/download;
- bulk actions;
- raw JSON copy;
- raw audit id browsing;
- links to business object details inferred from imported row identifiers.

## 74B Implementation Notes

Step 74B should implement the settings/system overview only after keeping the existing three local entries intact.

Expected Web behavior:

- render under the existing Settings/system configuration area;
- keep `system:config` visibility checks aligned with the current settings page;
- reuse the existing API client methods for import job history;
- add filters, pagination, loading, empty, error, list, and detail states;
- keep list/detail copy read-only;
- do not add Web controls that imply writes or object recovery.

If the existing `ImportJobHistoryPanel` is reused, Step 74B should either generalize it without weakening the page-local fixed-filter behavior or create a settings-specific wrapper that keeps the original local panels unchanged.

## 74C Acceptance Notes

Step 74C local browser acceptance should verify:

- `system:config` user can see the settings/system overview;
- non-`system:config` user cannot see it and does not request `/api/import-jobs`;
- default list request is GET-only and sorted by backend default `createdAt desc`;
- every filter is represented in the query when set;
- pagination changes only `page` and `pageSize`;
- list and detail show only safe DTO fields;
- detail includes sanitized summary, run statuses, `auditCount`, and replay/in-flight/rejected/failed explanations;
- no forbidden controls or forbidden strings appear;
- existing Department, User account, and Achievement local entries remain present.

## Production Readiness Boundary

Production readiness remains a separate route. It must start with a new read-only preflight runbook covering migration state, permission grants, API health, backup status, and safe evidence handling. It must not be folded into Step 74A or treated as implied by the settings/system overview design.

## Step 74A Position

Step 74A approves only the documentation design for a settings/system unified read-only import history overview. It does not authorize Web implementation, API changes, schema changes, production access, database access, import apply, retry, cleanup, delete, rollback, download, or business-object drilldown behavior.
