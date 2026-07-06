# ImportJobItem Web Local UI Acceptance

Date: 2026-07-06

Status: PASS with caveat.

## Scope

This Step verifies the Step 112 Web safe row display on localhost only. It is
local-demo/synthetic acceptance, not production import acceptance.

No production, VPS, production database, real external system, production
runbook, migration, `.env`, or `.env.production` access was used.

## Environment

- Starting HEAD: `396d1b7 feat: add import job item safe web display`.
- Existing local Docker stack was inspected and reused only as an already
  running local resource.
- No Docker container, volume, or stack was created, stopped, deleted, or
  cleaned.
- Existing production-auth Web container at `127.0.0.1:18081` was not suitable
  for demo-user UI acceptance because demo user switching is disabled there.
- Existing local API at `127.0.0.1:3000` was reused.
- A temporary Vite Web server for the current checkout was started on
  `127.0.0.1:5173` and stopped after acceptance.

## Synthetic Data Setup

- Created local synthetic Department import jobs through the existing local API
  with the system-admin demo user header.
- The successful acceptance job used 12 synthetic department rows so item
  pagination could be verified.
- One earlier local synthetic attempt was rejected by validation and remained a
  local import-history row; it was not used as acceptance success evidence.

## UI Acceptance Evidence

Evidence files were written under the untracked local directory:

- `.local-step113-import-job-item-web-acceptance/safe-row-history-detail.png`
- `.local-step113-import-job-item-web-acceptance/safe-row-history-filter-empty.png`
- `.local-step113-import-job-item-web-acceptance/safe-row-history-page2.png`
- `.local-step113-import-job-item-web-acceptance/researcher-no-system-config.png`
- `.local-step113-import-job-item-web-acceptance/vite-stdout.log`
- `.local-step113-import-job-item-web-acceptance/vite-stderr.log`

These files are local evidence only and must remain untracked.

## Results

- Opened current Web checkout at `127.0.0.1:5173`.
- Selected the system-admin demo user.
- Opened `Settings` / `Import history overview`.
- Confirmed no item API request happened before opening an import job detail.
- Opened an ImportJob detail drawer.
- Confirmed `Safe row history` appears inside the detail drawer.
- Confirmed item API requests are route-scoped to the opened job:
  `GET /api/import-jobs/:id/items`.
- Confirmed loading state appears while item API is delayed.
- Confirmed normal display with only five columns:
  - `Row`
  - `Planned action`
  - `Status`
  - `Safe code`
  - `Target type`
- Confirmed empty `safeCode` displays `Not returned`.
- Confirmed the panel boundary notice is visible:
  local/demo safe row view only; not raw CSV; not raw JSON; not production
  import acceptance; not retry, rollback, cleanup, export, or business-object
  drilldown.
- Confirmed `Refresh items` triggers a new route-scoped item request.
- Confirmed safe filters are serialized into item requests:
  `status`, `plannedAction`, `targetType`, and `safeCode`.
- Confirmed a no-match safe filter state shows the safe empty message.
- Confirmed pagination with a 12-row synthetic job:
  page 1 shows 10 rows, page 2 requests `page=2&pageSize=10` and shows the
  remaining rows.
- Confirmed a non-`system:config` demo user does not render Import History
  overview or Safe row history and does not request import-job item APIs.

## Safety Scan

The Safe row history panel area was scanned after excluding the required
boundary sentence. It did not show or provide:

- `targetId`
- raw payload
- source payload
- raw JSON
- raw CSV
- `safeSummary` as an item/debug field
- `auditLogIds`
- jobId/runId detail display
- operator id
- fingerprint/hash/checksum/object key
- email/phone/employee id/ID card
- password/token/cookie/session/`DATABASE_URL`/connection string/secret
- retry/repair/rollback/cleanup/delete/download/export/copy raw/debug
  panel/drilldown

## Caveats

- This is localhost/local-demo/synthetic UI acceptance only.
- The temporary Vite server was used because the already-running Web container
  was production-auth mode and not the current demo-user Web surface.
- Screenshots and logs are not committed.
- This does not authorize production import acceptance, production deployment,
  production database access, real external integration, retry/export/raw JSON,
  rollback, cleanup, or drilldown.
