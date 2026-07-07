# Step 127 - Local API Config Recovery Handbook

Date: 2026-07-07

Scope: docs-only/read-only recovery handbook for the Secret Authorization local UI acceptance blocker.

This is not production authorization acceptance.

## Current Conclusion

Secret Authorization live UI acceptance is still BLOCKED.

Do not report Step 123, Step 125, or Step 126 as PASS or PASS with caveat. The local UI acceptance has not observed a working localhost API/Web path, page rendering, browser network traffic, DOM, console, or screenshot evidence for the Secret Authorization page.

## Evidence Chain

### Step 123 - Initial Local UI Acceptance

- Result: BLOCKED.
- Local API health was unavailable.
- Local Web ports were unavailable.
- Existing API watch processes were observed, but expected API/Web ports had no listener.
- Live Secret Authorization navigation, page content, and route observation were not verified.
- No source, schema, migration, production resource, real external system, or Docker operation was involved.

### Step 124 - Read-Only Readiness Diagnosis

- Result: DONE as docs-only diagnosis.
- Confirmed no listener on expected API/Web ports.
- Confirmed no active project API/Web dev process at diagnosis time.
- Confirmed script expectations:
  - root dev runs workspace dev scripts in parallel;
  - API dev script runs the API watch entrypoint;
  - Web dev script runs Vite;
  - API defaults to port `3000`;
  - Web dev proxy sends `/api` requests to local API port `3000`.
- Recommended a separately authorized non-Docker dev server startup step if Codex should attempt recovery.

### Step 125 - Rerun After Claimed Manual Recovery

- Result: BLOCKED.
- The restored-service precondition was not observable from this session.
- API and Web checks remained unavailable.
- No expected API/Web port listener existed.
- No live Secret Authorization UI acceptance evidence was captured.

### Step 126 - Authorized Non-Docker Dev Server Startup

- Result: BLOCKED.
- API dev server startup was attempted.
- API health did not become available.
- API failed before binding the expected port because required local database runtime configuration was missing from the process context.
- Web dev server was not started because the API readiness gate failed first.
- Only the API process tree started by Step 126 was stopped.
- Raw logs were kept local and excluded from Git after scan; committed evidence contains only sanitized summaries.

## What Must Not Be Claimed

- Do not claim production authorization acceptance.
- Do not claim localhost Secret Authorization UI acceptance passed.
- Do not claim browser network observation passed.
- Do not claim sensitive-field DOM/screenshot/console scans passed for a live page.
- Do not convert the current BLOCKED state into PASS or PASS with caveat.

## User-Side Recovery Prerequisites

Choose one of these before rerunning live acceptance.

### Option 1 - User Provides Local API Runtime Configuration

The user can make the required local API runtime configuration available to the shell or terminal that starts the API dev server.

Important safety rules:

- Do not paste secrets, connection strings, credentials, cookies, or private runtime values into chat.
- Do not commit local runtime configuration.
- Prefer a local-only development database and local-only credentials.
- Confirm the API health endpoint works before asking Codex to rerun UI acceptance.

Minimum observable readiness:

- API health at `http://127.0.0.1:3000/api/health` returns a healthy response.
- Web is reachable on the selected local port.
- The Web app can proxy `/api` to the API service.

### Option 2 - User Starts Existing Local API/Web Manually

The user can start their existing local API/Web workflow outside Codex, then ask Codex to rerun acceptance.

Before rerun, the user should verify:

- API health is reachable on local port `3000`.
- Web is reachable on `5173` or a clearly stated alternate local port.
- The same terminal/session context that runs the API has the required local runtime configuration.

### Option 3 - Separately Authorize Local Environment Read/Set Step

If the user wants Codex to inspect or set local runtime configuration, that must be a separate explicit authorization step.

That separate step must define:

- which local files or variables may be inspected;
- whether secret values may be read at all;
- how values must be redacted in logs and evidence;
- whether a temporary process-only setting is allowed;
- whether local database migration or seed commands are allowed;
- what must be stopped or cleaned afterward.

This Step 127 does not grant that authorization.

## Next Step Options

### A - Manual Restore Then Rerun Acceptance

Recommended path.

The user restores local API/Web manually, verifies local readiness, then reruns the Secret Authorization local/demo/synthetic acceptance.

Expected result after restore:

- `system:config` demo user sees the Secret Authorization entry.
- non-`system:config` demo user does not see the entry and does not call Secret Authorization APIs.
- page shows overview cards, resource table, and bounded detail sections.
- browser network shows only read-only Secret Authorization GET routes.
- no write, bulk, file-output, or file-retrieval controls or requests appear.
- DOM, console, screenshots, and evidence pass sensitive-field-family scans.

### B - Explicit Local Environment Configuration Step

Use this if the user wants Codex to help make the API boot.

This should be a separate prompt with explicit permission boundaries. It should not be hidden inside an acceptance step.

### C - Return To Product Development

Use this if local API/Web acceptance is not currently worth unblocking.

Secret Authorization API/Web implementation remains completed through Steps 121 and 122, but live local UI acceptance remains BLOCKED until local runtime readiness is restored.

## Forbidden Documentation Content

Do not record:

- `DATABASE_URL` or equivalent database URLs;
- passwords;
- Token values;
- Cookie values;
- connection strings;
- private keys or service keys;
- API keys;
- classified resource body text;
- private attachment content;
- raw runtime logs that include secret-bearing field names or values.

## Recommended Operator Checklist

Before asking Codex to rerun acceptance:

1. Start the local API in a terminal where the required local runtime configuration is available.
2. Confirm API health in the browser or terminal.
3. Start the Web dev server.
4. Confirm the Web app loads on the chosen local port.
5. Do not paste any secret or connection value into chat.
6. Tell Codex only the reachable local Web URL and whether API health is green.

After that, rerun the local/demo/synthetic Secret Authorization UI acceptance step.
