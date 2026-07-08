# Step 176 - Final Demo Read-Only Smoke Check

Date: 2026-07-08

Starting HEAD: `eb6d41ce4d6537b176705a17ff0d7c25f64ac000`

Project positioning remains:

`研究院科研成果与知识产权管理系统一期本地评审提交版 / local-demo / local Docker production-like`

This is not a real production launch, not a real external-system integration acceptance, and not VPS / production DB acceptance.

## Result

Status: `PASS_WITH_AUTHENTICATED_BROWSER_CAVEAT`.

The local Docker production-like stack, Web entry, SPA fallback paths, unauthenticated login page, and unauthenticated protected API error shape were checked read-only before the final demo.

The user opened the separately launched Edge window and confirmed manual login. The current automation tools could not attach to that already logged-in Edge session without reading or transferring browser session material, so this Step does not claim automated authenticated page-by-page browser acceptance.

## Read-Only Checks

### Local Stack

`docker compose -f docker-compose.production.yml ps` showed:

- `research-achievement-production-api-1`: `Up` and `healthy`, mapped to `127.0.0.1:14001->3000`.
- `research-achievement-production-postgres-1`: `Up` and `healthy`.
- `research-achievement-production-web-1`: `Up` and `healthy`, mapped to `127.0.0.1:18081->80`.

### Web And API Health

- `GET http://127.0.0.1:18081/`: HTTP `200`.
- Page title: `科研成果与知识产权管理系统`.
- `GET http://127.0.0.1:14001/api/health`: HTTP `200`, body summary `status=ok`.

### SPA Fallback

Direct local Web paths returned HTTP `200` and did not contain `Cannot GET`, `404 Not Found`, or `Internal Server Error`:

- `/`
- `/achievements`
- `/search`
- `/settings`
- `/audit`
- `/reports`

### Unauthenticated Browser Entry

`playwright-cli -s=step176` opened `http://127.0.0.1:18081/` and scanned the visible page text.

Observed expected login copy:

- `未登录`
- `请先登录`
- `系统登录`
- `邮箱`
- `密码`
- `登录`
- `忘记密码`

Observed:

- `hasLogin=true`
- `hasLoggedIn=false`
- Forbidden engineering-copy hits: `[]`

Forbidden visible-copy scan included:

- `Cannot GET`
- `raw error`
- `not production`
- `stack trace`
- `JSON`
- `endpoint`
- `API path`
- `mock/demo`

### Protected API Error Shape

Read-only GET checks without a session returned controlled authorization status and did not expose stack traces or raw server pages:

- `/api/reminders/center`: HTTP `401`, `rawStack=false`.
- `/api/reports/templates`: HTTP `401`, `rawStack=false`.
- `/api/search?q=demo`: HTTP `401`, `rawStack=false`.
- `/api/audit-logs`: HTTP `401`, `rawStack=false`.
- `/api/settings/api-integrations`: HTTP `401`, `rawStack=false`.
- `/api/achievements`: HTTP `401`, `rawStack=false`.

`/api/reports/scheduled-plans` returned HTTP `404`, `rawStack=false`; the checked frontend client uses `/reports/scheduled-plans` naming, but this endpoint should not be demo-clicked directly outside the UI route.

## Authenticated Browser Boundary

The user confirmed manual login in a separately launched Edge window at:

`http://127.0.0.1:18081/`

This Step did not read, display, store, or commit any password, cookie, token, session value, `SESSION_SECRET`, connection string, `.env`, `.env.production`, or production credential.

Because the automation session was not attached to the user-controlled Edge profile, authenticated page-by-page browser checks remain a manual final-show rehearsal item:

- Workbench.
- Achievements and DOI auto-fill preview.
- Reminders center.
- Custom reports.
- Audit logs.
- Settings / API integrations.
- Search.

## Boundaries

- No `.env` or `.env.production` content was read.
- No production, VPS, production DB, real DOI, Crossref, OpenAlex, Scopus, SMTP, SMS, enterprise WeChat, HR, finance, or patent service provider was accessed.
- No source code, configuration, migration, seed, production runtime setting, or deployment setting was changed.
- No files or directories were deleted.
- Existing untracked local artifacts, including `.local-step*`, `.learnings`, `apps/api/deploy`, `deliverables`, screenshots, performance logs, and backup artifacts, were left untouched and uncommitted.

## Final Demo Recommendation

Keep the already opened Edge window logged in for tomorrow's demo. Before showing each page, avoid direct API URLs and avoid opening browser devtools. If a page unexpectedly asks for login, refresh once on `/`; if the session is still missing, log in manually rather than trying to use headers, localStorage, cookies, or raw API calls.
