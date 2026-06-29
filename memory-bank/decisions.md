# Decisions

## D172 - Step 49C accepts the local Step48C department-review approve path

- Date: 2026-06-29.
- Context: Step 48C left a local production-like paper achievement in `PENDING_DEPARTMENT_REVIEW` with a pending Step48C research-secretary workflow task. Step 48D confirmed the current exact-scope permission behavior. Step 49C was opened to exercise one local workflow action without production/VPS work.
- Decision:
  - Accept the Step48C department-review approve path locally.
  - Treat the expected business result as:
    - achievement `PENDING_DEPARTMENT_REVIEW -> PENDING_ARCHIVE`.
    - workflow task `PENDING -> APPROVED`.
    - workflow instance remains `ACTIVE` and moves to current step `ARCHIVE`.
    - dashboard reflects `PENDING_DEPARTMENT_REVIEW=0`, `PENDING_ARCHIVE=1`, workflow `PENDING=0`, workflow `APPROVED=1` for the secretary scope.
  - Treat `/api/audit-logs` returning HTTP 403 for the research secretary as expected permission behavior, not an audit failure.
  - Treat local DB audit summary as sufficient to prove an append-only `APPROVE` audit event was recorded for the workflow task because the acting secretary lacks masked audit-read permission.
  - Record that a temporary local Step48C secretary password was rotated and used only in-process for a real session; do not record the value.
- Not complete:
  - Reject path.
  - Archive closure.
  - Multi-level approval.
  - Richer fee/reminder/attachment/search sample expansion.
  - Authenticated browser state beyond route shell checks.
  - VPS/production acceptance and production write acceptance.
- Boundaries:
  - This decision does not authorize source-code changes, schema/migration changes, Docker/compose/deploy changes, dependency changes, migration, seed/backfill, large sample creation, Step48C data deletion, deploy, push, VPS access, production DB access, real email, DirectMail runtime switching, cleanup, deletion, reset, drop, restore, prune, or secret access.

## D171 - Step 49A refreshes Phase 2 readiness and replaces old Step 41B with a narrower Step 49B entry

- Date: 2026-06-29.
- Context: Step 47 completed local production-like stack/readiness acceptance. Step 48C accepted a minimal local production-like business sample. Step 48D accepted the current permission-scope behavior for the Step 48C sample. VPS production acceptance, Step 38 production acceptance, and DirectMail production runtime enablement remain deferred.
- Decision:
  - Record Step 49A as local documentation-only production-readiness refresh and closeout.
  - Do not classify Step 49A as production acceptance, production deploy, production write acceptance, DirectMail runtime enablement, or Phase 2 completion.
  - Treat local production-like stack/readiness and authenticated admin API checks from Step 47, minimal local business sample creation / submit / pending workflow task from Step 48C, permission-scope / dashboard / workflow count classification from Step 48D, and local DirectMail no-send/dry-run adapter readiness as completed locally.
  - Treat Docker Compose production-like local stack evidence, authenticated local-admin API acceptance, local minimal business sample and permission-scope acceptance, and local DirectMail harness/no-send readiness as local-only accepted and not production accepted.
  - Keep VPS production acceptance, Step 38 production acceptance, DirectMail production runtime enablement, production write acceptance, production migration/seed/bootstrap/deploy, real email, and production cleanup deferred.
  - Do not reuse old Step 41B directly because it targeted an older Step 41A deploy candidate and combined production deploy with GET-only smoke. The correct next production entry is a new, narrower Step 49B authorization focused on VPS production GET-only acceptance.
- Recommended next:
  - Use `Step 49B - VPS production GET-only acceptance authorization`.
  - Require explicit authorization naming the production target/domain and allowing read-only VPS/production GET-only smoke.
  - Explicitly forbid deploy, restart, migration, seed/backfill, bootstrap, production writes, POST/PATCH/PUT/DELETE, production DB shell, cleanup, deletion, reset, drop, prune, real email, DirectMail runtime changes, and sensitive-config output.
  - Keep any production write acceptance or DirectMail runtime enablement as later separate steps.
- Gate decision:
  - Step 49A itself needs documentation checks only: tracked diff review, `git diff --check`, sensitive scan, and commit.
  - Full lint/typecheck/test/build gates are not required unless code, schema, package/lockfile, compose/deploy config, migration, or runtime behavior changes after Step 48D.
- Boundaries:
  - This decision does not authorize source-code changes, schema/migration changes, Docker/compose/deploy changes, dependency changes, migration, seed/backfill, data creation/modification/deletion, deploy, push, VPS access, production DB access, real email, DirectMail runtime switching, cleanup, deletion, reset, drop, restore, prune, or secret access.

## D170 - Step 48D classifies local-admin achievement total 0 as current scope policy behavior

- Date: 2026-06-29.
- Context: Step 48C created a local Step48C department, researcher, research secretary, paper achievement, and pending department-review workflow task. Researcher and research secretary scopes saw the achievement, while local-admin saw achievement/dashboard count `0`. Step 48D compared runtime behavior across local-admin, researcher, and secretary and read the relevant RBAC/scope/dashboard/workflow code.
- Decision:
  - Classify local-admin achievement count `0` as expected under the current exact-scope permission model.
  - Classify local-admin dashboard achievement total `0` as the same policy scope behavior, because dashboard achievement metrics reuse `achievementReadableWhere(context)`.
  - Classify local-admin workflow pending count `0` as expected assignee-scope behavior, because workflow task aggregation and `/workflow/tasks/my` are current-user-assignee scoped.
  - Do not patch business code in Step 48D.
- Basis:
  - `SYSTEM_ADMIN` has broad permissions but no `scopedDepartmentIds` in the observed local-admin context.
  - `achievementReadableWhere` grants visibility through own achievements and exact scoped departments, not through global admin role alone.
  - The Step 48C achievement belongs to the researcher and Step48C department.
  - The Step 48C workflow task is assigned to the research secretary.
  - Account/departments admin routes require `system:config`, which local-admin has and researcher/secretary do not.
- Product note:
  - If system admins, institute leaders, or `dashboard:read_institute` users should see all achievements or institute-wide dashboard counts, that is a separate product/authorization design change. It should define global/institute read semantics and tests before code changes.
- Boundaries:
  - This decision does not authorize source-code changes, schema/migration changes, Docker/compose/deploy changes, dependency changes, seed/backfill/migration, data creation/modification/deletion, real email, DirectMail runtime changes, push/deploy, VPS access, production DB access, cleanup, deletion, reset, drop, restore, prune, or secret access.

## D169 - Step 48C accepts a minimal local production-like business sample

- Date: 2026-06-29.
- Context: Step 48B was blocked because no authenticated local session or usable password was available. The user then supplied the local-admin test credential in the active chat and authorized Step 48C to create/modify minimal local production-like test business data.
- Decision:
  - Accept Step 48C as a local-only minimal business-data acceptance, not production/VPS data work.
  - Keep the sample intentionally small:
    - one Step 48C acceptance department.
    - one researcher test account.
    - one research secretary test account.
    - one paper achievement.
    - one submitted department-review workflow task.
  - Do not run full demo seed.
  - Do not create fee, reminder, or attachment samples unless a later Step explicitly needs those flows.
  - Do not delete or clean up the local sample in this Step.
- Accepted behavior:
  - Local-admin login succeeded.
  - Account and department creation paths worked locally.
  - Researcher-created achievement became visible under researcher scope.
  - Submitting the achievement moved it to `PENDING_DEPARTMENT_REVIEW`.
  - Research secretary saw one pending `DEPARTMENT_REVIEW` task.
  - Secretary dashboard reflected the one visible achievement and one pending workflow task.
  - Admin achievement/dashboard counts remained `0` for this sample because achievement visibility is scope/policy-dependent; this is not treated as a creation failure.
- Next:
  - A later Step can execute approve/reject acceptance against the pending task if authorized.
  - Fees, reminders, attachment metadata/download, and populated search acceptance remain separate sample-expansion candidates.
  - Browser-authenticated rendering may need HTTPS or a controlled cookie/header harness because production-like cookies are `Secure` while the local preview is plain HTTP.
- Boundaries:
  - This decision does not authorize reading secrets, full demo seed, backfill, migration, real email, DirectMail runtime switching, source-code changes, schema/migration changes, Docker/compose/deploy changes, dependency changes, push/deploy, VPS access, production DB access, cleanup, deletion, reset, drop, restore, prune, or test-data deletion.

## D168 - Step 48B blocks authenticated empty-state acceptance without a usable local-admin login

- Date: 2026-06-29.
- Context: Step 48B attempted read-only local production-like empty-state acceptance after Step 48A decided against running the full demo seed. The local compose stack was healthy and Web routes served the SPA shell, but no usable local-admin password or authenticated session value was available in the active execution context.
- Decision:
  - Do not read `.env.production`, historical sensitive notes, cookies, tokens, or connection strings to recover credentials.
  - Do not guess or brute-force the local-admin password.
  - Treat unauthenticated HTTP 401 responses from protected business APIs as normal authentication boundary evidence, not as empty-state business acceptance.
  - Mark Step 48B as blocked until a usable ephemeral local-admin test password is provided in the active chat or an authenticated local session is made available without exposing secret values.
- Observed read-only results:
  - Local `postgres`, `api`, and `web` services were running / healthy.
  - Web/API health returned HTTP 200.
  - Main Web routes returned HTTP 200 SPA shell.
  - Main business APIs returned HTTP 401 without a session.
- Next:
  - Resume Step 48B authenticated empty-state API/browser checks after the local-admin login precondition is satisfied.
  - Keep Step 48C minimal business sample creation separate and unauthorized until Step 48B empty-state acceptance is completed or deliberately superseded.
- Boundaries:
  - This decision does not authorize reading secrets, source-code changes, schema/migration changes, Docker/compose/deploy changes, dependency changes, business data creation/modification/deletion, seed/backfill/migration execution, API writes beyond an explicitly authorized login, real email, push/deploy, VPS access, production DB access, cleanup, deletion, reset, drop, restore, or prune.

## D167 - Step 48A uses empty-state-first acceptance and defers minimal business samples

- Date: 2026-06-29.
- Context: Step 47 closed with the local production-like Docker Compose stack accepted, foundation/admin state present, and authenticated API acceptance passing. Business records such as achievements, workflow tasks, fees, reminders, and attachments remain empty because Step 47 did not create demo/business data. Step 48A was opened to design local production-like business-data and empty-state acceptance only.
- Decision:
  - Start Step 48 with read-only empty-state acceptance before creating business samples.
  - Treat these pages as usable in empty business-data state:
    - app shell / authenticated navigation.
    - workbench summary and empty approval tasks.
    - achievements list and empty table / filter state.
    - workflow my tasks empty list.
    - fees list, warning groups, and empty detail prompt.
    - search no-result state.
    - dashboard zero totals and empty distributions.
    - audit logs page, including filter-driven empty results.
    - account and department management foundation-data lists.
    - settings boundary page.
  - Treat these flows as requiring controlled business samples before meaningful acceptance:
    - achievement detail and state actions.
    - workflow task detail / approve / reject.
    - fee detail and status transitions.
    - reminder confirmation / reminder status acceptance.
    - attachment metadata and any download path.
    - search result grouping / drill-in.
    - dashboard non-zero distributions and warnings.
  - Do not run full `prisma/seed.cjs` by default in the production-like local environment.
  - Prefer a separately authorized minimal business sample over demo seed pollution.
- Minimal sample shape if later authorized:
  - Reuse an existing active foundation department where possible; create one local acceptance department only if necessary.
  - Use two active local acceptance users in the same department: researcher / submitter and research secretary / reviewer.
  - Use one achievement, one pending workflow task, one fee, optional one reminder, and optional one attachment metadata record.
  - Prefer creating workflow tasks through the real submit path when write acceptance is authorized, rather than direct task fabrication.
  - Attachment download acceptance requires a real local object fixture or must be scoped to metadata-only acceptance.
- Next:
  - Step 48B: read-only local production-like empty-state browser/API acceptance.
  - Step 48C: explicit minimal business sample creation plan and authorization gate.
  - Step 48D: post-sample business flow acceptance.
  - Full demo seed may only be considered in a separate explicit authorization Step.
- Boundaries:
  - This decision does not authorize source-code changes, schema/migration changes, Docker/compose/deploy changes, dependency changes, business data creation/modification/deletion, seed/backfill/migration execution, API writes, real email, push/deploy, VPS access, production DB access, cleanup, deletion, reset, drop, restore, prune, or secret access.

## D166 - Step 47 closes with local production-like acceptance and Step 48 business entry

- Date: 2026-06-29.
- Context: Step 47 moved from password reset/invite migration readiness through DirectMail provider readiness and local production-like stack acceptance. The latest local authenticated acceptance passed for local-admin against the Docker Compose production-like stack.
- Decision:
  - Close Step 47 as `STEP_47_CLOSED_LOCAL_PRODUCTION_LIKE_ACCEPTANCE_READY_FOR_STEP_48`.
  - Treat local production-like stack readiness as accepted:
    - Local production-like database migration deploy completed.
    - Local foundation/admin state is present for acceptance.
    - Web `/api/` proxy is fixed.
    - Authenticated local-admin API acceptance passed.
    - Main SPA shells are reachable.
  - Treat achievements and workflow task empty lists as Step 48 business data / empty-state acceptance input, not a Step 47 blocker.
  - Keep runtime delivery on `LOCAL_SAFE_STUB`; DirectMail controlled harness success does not mean production/runtime real delivery is enabled.
  - Keep VPS production acceptance incomplete and Step 38 production acceptance deferred.
- Next:
  - Step 48 should start from local production-like business page/data acceptance.
  - Any production/VPS work, real email delivery enablement, migration, seed/backfill, deploy/push, production DB access, or cleanup must be separately authorized.
- Boundaries:
  - This decision does not authorize code changes, Docker Compose execution, migration, seed/backfill, real email, DirectMail runtime switching, deploy, push, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or secret access.

## D165 - Step 47AD-Resume accepts local production-like authenticated flow with Secure-cookie caveat

- Date: 2026-06-29.
- Context: The user explicitly authorized use of an ephemeral local-admin test password in the active chat after Step 47AD had previously been blocked. The local production-like stack was healthy and the goal was authenticated local acceptance without recording credentials or changing runtime configuration.
- Decision:
  - Record `LOCAL_PRODUCTION_LIKE_AUTHENTICATED_ACCEPTANCE_PASSED_WITH_HTTP_SECURE_COOKIE_NOTE`.
  - Treat the server-side authenticated local production-like path as accepted:
    - Login API returned HTTP 200.
    - `/api/auth/me` returned HTTP 200.
    - Main authenticated APIs and SPA routes were reachable.
  - Record that the production-like session cookie is `Secure`; local plain HTTP browser persistence has a known limitation and was validated with an in-process transient cookie header instead.
  - Do not record the ephemeral password, cookie value, token, secret, connection string, or full reset/invite link.
  - Do not create business data, run seed/backfill/migration, send real email, modify DirectMail defaults, push/deploy, access VPS, or access production DB.
- Evidence:
  - Authenticated user matched `local-admin@wzunew.uk`.
  - Role count: 1.
  - Permission count: 21.
  - Dashboard, achievements, workflow tasks, audit logs, account users, and departments APIs returned HTTP 200.
  - Requested Web routes returned HTTP 200 with the SPA shell.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.
  - This is not VPS production acceptance.

## D164 - Step 47AD remains blocked without usable ephemeral local-admin password

- Date: 2026-06-29.
- Context: Step 47AD was opened to complete authenticated local-admin acceptance. The prompt authorized use of an ephemeral local test password said to have been provided in chat, but no usable password value was available in the active execution context.
- Decision:
  - Record `BLOCKED_BY_EPHEMERAL_LOCAL_ADMIN_PASSWORD_NOT_AVAILABLE_IN_CONTEXT`.
  - Do not read `.env.production`, inspect password storage, search for passwords, output credentials, or infer a password.
  - Do not attempt login without credentials.
  - Do not claim authenticated administrator page acceptance without completing login.
  - Keep real email delivery, DirectMail strategy changes, seed/backfill/migration, push/deploy/VPS access/production DB access, and cleanup out of scope.
- Next:
  - Continue with a safe credential handoff method, preferably user-entered password in a local browser session.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.

## D163 - Step 47AC blocks authenticated acceptance without local-admin password

- Date: 2026-06-29.
- Context: Step 47AC checked the running local production-like stack after the Web API proxy fix. The stack was healthy and local Web/API endpoints were reachable, but the local-admin password was not available to the agent.
- Decision:
  - Record `BLOCKED_BY_LOCAL_ADMIN_PASSWORD_UNAVAILABLE`.
  - Do not read `.env.production`, inspect password storage, search for passwords, output credentials, or infer a password.
  - Do not claim administrator login/session/page acceptance without completing login.
  - Keep real email delivery, DirectMail strategy changes, push/deploy/VPS access/production DB access, and cleanup out of scope.
- Next:
  - Continue with a safe credential handoff method, preferably user-entered password in a local browser session.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.

## D162 - Step 47AA local production-like database migration and startup accepted

- Date: 2026-06-28.
- Context: Step 47AA ran after the user manually corrected local `.env.production` so `POSTGRES_DB` and `DATABASE_URL` target the same local production-like database name. Values were not read or recorded.
- Decision:
  - Create the missing local production-like target database inside the local compose Postgres service.
  - Run `prisma migrate deploy` against the local production-like compose database.
  - Record `LOCAL_PRODUCTION_LIKE_MIGRATION_AND_STARTUP_ACCEPTED`.
  - Do not run seed/backfill.
  - Do not send real email.
  - Do not push, deploy, access VPS, or access production DB.
  - Do not clean up the successful one-off migration container or old local artifacts in this Step.
- Evidence:
  - Four migrations were applied successfully.
  - `postgres`, `api`, and `web` are running / healthy.
  - API health and Web root returned HTTP 200.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.
  - DirectMail default sending strategy remains unchanged.

## D161 - Step 47Z classifies Prisma P1003 as local database target mismatch

- Date: 2026-06-28.
- Context: Step 47Z diagnosed the API container's Prisma `P1003` startup blocker after Step 47Y fixed attachment storage DI. The local `.env.production` file existed but its values were not read or recorded.
- Decision:
  - Record `BLOCKED_BY_LOCAL_PRODUCTION_DATABASE_CONFIG`.
  - Treat the immediate blocker as local production-like DB configuration / target database readiness mismatch.
  - Do not run migration deploy in this Step because the API `DATABASE_URL` target differs from the reachable `POSTGRES_DB` target and is missing or not connectable.
  - Do not create databases, run migration, seed/backfill, real email smoke, push, deploy, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or artifact removal.
  - Next authorization should either correct/create the intended local database target or explicitly authorize local production-like database creation, followed by a separate migration deploy Step.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.
  - DirectMail default sending strategy remains unchanged.

## D160 - Step 47Y fixes attachment storage DI and stops on database availability blocker

- Date: 2026-06-28.
- Context: Step 47Y diagnosed the local production-like API container restart loop after Step 47X-Resume. The prior non-sensitive logs pointed to Nest dependency resolution involving `LocalAttachmentStorageAdapter`.
- Decision:
  - Fix the attachment storage DI root cause using an explicit `LOCAL_ATTACHMENT_STORAGE_ROOT` injection token.
  - Add a focused Nest provider-graph test so this dependency resolution path is covered.
  - Retry the independent local production-like Compose stack after the fix.
  - Record the remaining startup blocker as `BLOCKED_BY_LOCAL_PRODUCTION_DATABASE_UNAVAILABLE_AFTER_ATTACHMENT_WIRING_FIX` because sanitized logs show Prisma `P1003`; do not infer or print database names or connection strings.
  - Do not run migration, seed/backfill, real email smoke, push, deploy, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or artifact removal.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.
  - DirectMail default sending strategy remains unchanged.

## D159 - Step 47X-Resume stops on API unhealthy after compose build succeeds

- Date: 2026-06-28.
- Context: Step 47X-Resume retried the independent local `docker-compose.production.yml` startup after `.env.production` existed locally and `node:22-alpine`, `postgres:16-alpine`, and `nginx:1.27-alpine` were available locally. Docker and Compose were available.
- Decision:
  - Record `BLOCKED_BY_LOCAL_PRODUCTION_LIKE_API_UNHEALTHY`.
  - Do not run migration, seed/backfill, real email smoke, push, deploy, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or artifact removal.
  - Do not modify Dockerfile, compose, dependencies, or DirectMail default sending strategy in this Step.
  - Do not treat this as database schema missing because sanitized diagnostics did not confirm missing relation, table, or column.
  - Next work should be a separate local diagnosis/fix Step for the `LocalAttachmentStorageAdapter` Nest dependency resolution failure.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.

## D158 - Step 47X retry remains blocked by Docker registry timeout

- Date: 2026-06-28.
- Context: Step 47X retried the independent local `docker-compose.production.yml` startup after the env template was restored and `.env.production` existed locally. Docker and Compose were available, but `node:22-alpine` was not available locally.
- Decision:
  - Record `BLOCKED_BY_DOCKER_REGISTRY_TIMEOUT_NO_STACK_START`.
  - Do not retry automatically.
  - Do not modify Dockerfile, compose, dependencies, or DirectMail default sending strategy.
  - Do not run migration, seed/backfill, real email smoke, push, deploy, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or artifact removal.
  - Retry only after Docker registry/network access is available or `node:22-alpine` is available locally.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.

## D157 - Step 47W-Resume stops on Docker registry timeout

- Date: 2026-06-28.
- Context: Step 47W-Resume restored the missing env template and attempted to start the local production-like Compose stack using `docker-compose.production.yml`. The local `.env.production` file existed, but values were not read or output.
- Decision:
  - Record `BLOCKED_BY_DOCKER_REGISTRY_TIMEOUT_NO_STACK_START`.
  - Do not retry automatically.
  - Do not run migration, seed/backfill, real email smoke, push, deploy, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or artifact removal.
  - Keep DirectMail production sending strategy unchanged.
  - Retry only after Docker registry/network access is available or required base images are available locally.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.

## D156 - Step 47V stack startup remains blocked by missing env file

- Date: 2026-06-28.
- Context: Step 47V was opened after Step 47U documented local production-like env variable names. The Step required a user-created private `.env.production`, but the local workspace still did not contain that file.
- Decision:
  - Record `BLOCKED_BY_LOCAL_ENV_PRODUCTION_MISSING_NO_STACK_START`.
  - Do not build or start the local production-like Compose stack.
  - Do not read or infer `.env.production` values.
  - Do not check local API/Web health because the stack was not started.
  - Do not check DirectMail production-like config presence.
  - Do not run migration, seed/backfill, real email smoke, push, deploy, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or artifact removal.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.

## D155 - Step 47U records local production-like env names without real values

- Date: 2026-06-28.
- Context: Step 47T was blocked because `.env.production` was missing. Step 47U was opened to document the required local production-like environment variables without creating or filling the real env file.
- Decision:
  - Update `.env.production.example` with account lifecycle delivery variable names and safe no-send defaults.
  - Add `deploy/local-production-like-env-checklist.md`.
  - Do not create `.env.production`.
  - Do not read, output, or record real env values or secrets.
  - Keep local production-like stack startup deferred until a private `.env.production` exists.
- Boundaries:
  - This decision does not authorize stack startup, migration, seed/backfill, real email smoke, push, deploy, VPS access, production DB access, cleanup, deletion, drop, reset, prune, or artifact removal.

## D154 - Step 47T local production-like acceptance is blocked by missing env file

- Date: 2026-06-28.
- Context: Step 47T was opened to build/start the local production-like Docker Compose stack and check local API/Web health. The production compose file uses `.env.production`, but the local workspace does not contain that file.
- Decision:
  - Record `BLOCKED_BY_LOCAL_ENV_PRODUCTION_MISSING_NO_STACK_START`.
  - Do not build or start the production-like Compose stack.
  - Do not read or infer `.env.production` values.
  - Do not check local production-like DirectMail config presence.
  - Do not run migration, seed/backfill, push, VPS access, production DB access, or real email smoke.
- Boundaries:
  - This decision does not alter Step 38 production acceptance, which remains deferred.

## D153 - Step 47S production enablement is blocked by missing execution channel

- Date: 2026-06-28.
- Context: The Step 47S prompt authorized production password reset DirectMail enablement, deploy/restart, one production smoke, and rollback if needed. Local review confirmed the production model is VPS Docker Compose with `.env.production` stored only on the VPS. No safe VPS/deploy execution channel or secret injection command was available in the repo context.
- Decision:
  - Do not guess production access.
  - Do not push 30 local commits without a confirmed deploy mechanism requiring that push.
  - Do not modify production runtime configuration.
  - Do not deploy/restart production API.
  - Do not attempt production password reset smoke.
  - Record `BLOCKED_BY_PRODUCTION_EXECUTION_CHANNEL_UNAVAILABLE_NO_PRODUCTION_CHANGE`.
  - Keep invite real delivery deferred.
- Boundaries:
  - This decision does not authorize reading or outputting secrets, calling Aliyun API, sending email/SMS, running smoke harness, migration, seed/backfill, production DB writes, real user account operations, deployment config changes, cleanup, deletion, drop, or reset.

## D152 - Step 47R blocks production delivery enablement pending explicit authorization

- Date: 2026-06-28.
- Context: Step 47M/47N accepted the local harness password reset DirectMail path and Step 47P/47Q implemented and accepted safe-default runtime wiring. Production real delivery is still disabled. Step 47R was opened to collect production enablement authorization, but the current prompt supplied a checklist rather than explicit approval for the required production actions.
- Decision:
  - Record `BLOCKED_BY_PRODUCTION_DELIVERY_ENABLEMENT_AUTHORIZATION_MISSING`.
  - Do not generate a production execution Prompt.
  - Keep production real delivery disabled.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Keep invite real delivery deferred.
  - Require explicit user/ops authorization before any production config change, deploy/restart, production smoke, rollback execution, push, production env presence check, or Step 47S execution.
- Boundaries:
  - This decision does not authorize Aliyun API calls, real email/SMS, smoke harness execution, secret access, source-code changes, deployment-config changes, production runtime changes, migration, seed/backfill, deploy, push, production/VPS/production DB access, cleanup, deletion, drop, or reset.

## D151 - Step 47Q accepts local runtime wiring without production enablement

- Date: 2026-06-28.
- Context: Step 47P implemented configurable account lifecycle delivery runtime wiring with a safe default. Step 47Q locally accepted that wiring before any production enablement.
- Decision:
  - Accept the default runtime path as `LOCAL_SAFE_STUB`.
  - Accept unknown provider fallback to `LOCAL_SAFE_STUB`.
  - Accept Aliyun DirectMail dry-run/default no-send behavior.
  - Accept missing live config fail-safe behavior as `SUPPRESSED` / `CONFIGURATION` without adapter construction.
  - Accept fake complete config routing through injected fake adapter only.
  - Keep production real delivery disabled.
  - Keep invite real delivery deferred.
  - Require later explicit production authorization before runtime config injection, deploy, production smoke, or rollback execution.
- Boundaries:
  - This decision does not authorize Aliyun API calls, real email/SMS, real smoke harness execution, secret access, production config injection, migration, seed/backfill, deploy, push, production/VPS/production DB access, production runtime enablement, cleanup, deletion, drop, or reset.

## D150 - Step 47P wires delivery runtime with safe default

- Date: 2026-06-28.
- Context: Step 47O accepted the Aliyun DirectMail local harness path at controlled-smoke level, but production real delivery remained disabled. The next required local step was runtime wiring with a safe default.
- Decision:
  - Implement configurable account lifecycle delivery adapter resolution.
  - Keep absent or unknown `ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER` values on local stub/no-send behavior.
  - Allow explicit `ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER=aliyun_directmail` to select the Aliyun DirectMail adapter path.
  - Keep `ALIYUN_DM_DRY_RUN !== "false"` as no-send/dry-run.
  - If live Aliyun mode is explicitly requested but required secret env values are missing, return safe `SUPPRESSED` / `CONFIGURATION` without constructing a live adapter.
  - Keep default runtime behavior on `LOCAL_SAFE_STUB`.
  - Keep production real delivery disabled until later explicit production enablement authorization.
  - Recommend password reset first; keep invite real delivery deferred.
- Boundaries:
  - This decision does not authorize Aliyun API calls, real email/SMS, smoke harness execution, secret access, production config injection, migration, seed/backfill, deploy, push, production/VPS/production DB access, production runtime enablement, cleanup, deletion, drop, or reset.

## D149 - Step 47O marks local DirectMail readiness but defers production enablement

- Date: 2026-06-28.
- Context: Step 47M completed a password reset controlled smoke retry with provider `ACCEPTED` / delivery `SENT`, and Step 47N recorded user-confirmed mailbox receipt. Default runtime still uses `LOCAL_SAFE_STUB`; there has been no production runtime wiring, deploy, production smoke, or rollback execution.
- Decision:
  - Treat Aliyun DirectMail as accepted for local harness controlled smoke.
  - Do not treat production real delivery as enabled.
  - Do not switch default runtime from `LOCAL_SAFE_STUB` to Aliyun adapter in this Step.
  - Recommend Step 47P to implement runtime wiring with safe default and config switch, keeping default no-send/local-stub behavior.
  - Recommend enabling password reset real delivery before invite; keep invite deferred.
  - Require separate authorization for production enablement, deploy, smoke, and rollback.
- Boundaries:
  - This decision does not authorize source-code changes in Step 47O, runtime wiring changes, production config injection, Aliyun API calls, real email/SMS, smoke harness execution, provider raw full payload recording, secret output, raw token output, full reset link output, plaintext recipient logging, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D148 - Step 47N confirms mailbox receipt but keeps production enablement separate

- Date: 2026-06-28.
- Context: Step 47M completed one authorized password reset controlled smoke retry with provider `ACCEPTED` / delivery `SENT`. The user manually confirmed that the QQ mailbox received the test email. The screenshot reportedly contains a full reset link/token, which must not be read or recorded.
- Decision:
  - Record mailbox receipt confirmation for masked recipient `246****571@qq.com`.
  - Treat the Aliyun DirectMail local harness path as ready at controlled-smoke level.
  - Do not treat this as production deployment, production acceptance, or default runtime provider wiring.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Require separate authorized Steps for runtime wiring, production config injection, deploy, production smoke, and rollback/recovery planning.
- Boundaries:
  - This decision does not authorize screenshot OCR, link/token capture, Aliyun API calls, real email/SMS, smoke harness execution, provider raw full payload recording, secret output, raw token output, full reset link output, plaintext recipient logging, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D147 - Step 47M post-ops controlled smoke is accepted by DirectMail

- Date: 2026-06-28.
- Context: After Step 47L diagnosed `Forbidden`, the user reported Aliyun-side manual checks and fixes, including RAM permission and sender/domain/account status. Step 47M then performed one authorized password-reset-only controlled smoke retry through the local harness.
- Decision:
  - Record `CONTROLLED_SMOKE_RETRY_ACCEPTED_SENT`.
  - Treat provider status `ACCEPTED` and delivery status `SENT` as the provider-side smoke success.
  - Record total attempts as 1 and total accepted/sent as 1.
  - Record safe normalized providerMessageId `61B5C05C-E9C6-5DC3-BC3C-3DEA8A256F9A`.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Require user-side manual mailbox receipt confirmation separately.
- Boundaries:
  - This decision does not authorize production runtime switching, default runtime provider wiring, another real-send retry, provider raw full payload recording, secret output, raw token output, full reset link output, plaintext recipient logging, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, cleanup, deletion, drop, or reset.

## D146 - Step 47L treats Forbidden as Aliyun-side configuration until ops checklist is completed

- Date: 2026-06-28.
- Context: Step 47K performed one authorized password-reset controlled smoke retry after endpoint correction. The provider returned safe normalized providerErrorCode `Forbidden`, provider status `FAILED`, failure category `CONFIGURATION`, and accepted/sent count `0`. Step 47L reviewed local adapter parameters and Aliyun official DirectMail/RAM documentation without another API call or send.
- Decision:
  - Treat `Forbidden` as an Aliyun-side configuration or authorization blocker unless ops proves otherwise.
  - Do not retry again until RAM permissions, sender address status, domain/account binding, DirectMail activation/status, region/endpoint, quota, and risk-control checks are complete.
  - Keep adapter parameter mapping unchanged for now.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
- Boundaries:
  - This decision does not authorize another real-send retry, Aliyun API call, console login, provider raw full payload recording, secret output, raw token output, full reset link output, plaintext recipient logging, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D145 - Step 47K controlled smoke retry stops on Aliyun configuration failure

- Date: 2026-06-28.
- Context: Step 47K executed the authorized password-reset-only controlled smoke retry after the endpoint mapping fix. The harness used process-local non-sensitive overlay and kept default runtime wiring on `LOCAL_SAFE_STUB`.
- Decision:
  - Record `CONTROLLED_SMOKE_RETRY_PROVIDER_FAILED_NO_ACCEPTED_SEND`.
  - Treat the single password reset attempt as provider status `FAILED`, delivery status `FAILED`, and failure category `CONFIGURATION`.
  - Record safe normalized providerErrorCode `Forbidden`.
  - Record total attempts as 1 and total accepted/sent as 0.
  - Do not retry again in this Step.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
- Boundaries:
  - This decision does not authorize another real-send retry, provider raw full payload recording, secret output, raw token output, full reset link output, plaintext recipient logging, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D144 - Step 47K controlled smoke retry authorization collected for one password-reset email

- Date: 2026-06-28.
- Context: Step 47K-Auth previously blocked a real-send retry because the prompt only supplied a recommended authorization scope. The user then explicitly authorized a later separate controlled smoke retry after Step 47J-Fix corrected endpoint mapping and safe error diagnostics.
- Decision:
  - Record `CONTROLLED_SMOKE_RETRY_AUTHORIZATION_COLLECTED_NO_SEND`.
  - Allow a later separate Step to retry controlled real send for password reset only.
  - Limit the later retry to at most 1 email.
  - Record recipient only as `246****571@qq.com`.
  - Allow secret environment variable presence checks only, without outputting values.
  - Allow process-local `ALIYUN_DM_DRY_RUN=false` for this single controlled retry only.
  - Allow process-local non-sensitive Aliyun DirectMail env overlay.
  - Allow safe normalized `providerMessageId` and `providerErrorCode` recording.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
- Boundaries:
  - This decision does not authorize Aliyun API calls or real email/SMS in this authorization-record Step itself.
  - The later smoke Step must not perform deploy, migration, seed/backfill, DB writes, real user account operations, production/VPS/production DB access, production runtime switching, default runtime provider wiring, provider raw full payload recording, cleanup, deletion, drop, or reset.

## D143 - Step 47K controlled smoke retry remains blocked pending explicit retry authorization

- Date: 2026-06-28.
- Context: Step 47J-Fix corrected the Aliyun DirectMail endpoint mapping for `cn-hangzhou` and added safe provider error-code classification. A future controlled smoke retry would still send a real test email and therefore requires explicit renewed user/ops authorization. The current prompt provided a recommended retry scope, but did not explicitly grant all required retry permissions.
- Decision:
  - Record `BLOCKED_BY_CONTROLLED_SMOKE_RETRY_AUTHORIZATION_MISSING`.
  - Do not generate a retry execution Prompt.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Require explicit authorization before any future real-send retry, including recipient reuse, secret-presence-only checks, process-local `ALIYUN_DM_DRY_RUN=false`, non-sensitive env overlay, password-reset-only scope, one-email limit, safe provider diagnostic recording, and prohibited production actions.
- Boundaries:
  - This decision does not authorize Aliyun API calls, real email/SMS, smoke harness execution, secret output, raw token output, full link output, plaintext recipient logging, provider raw full payload recording, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D142 - Step 47J-Fix patches DirectMail endpoint mapping and safe error diagnostics

- Date: 2026-06-28.
- Context: Step 47J diagnosed the Step 47I-Resume permanent failure as likely endpoint mapping plus insufficient safe error classification. The adapter previously derived `dm.cn-hangzhou.aliyuncs.com`, while official DirectMail docs list `dm.aliyuncs.com` for `cn-hangzhou`.
- Decision:
  - Add an Aliyun DirectMail endpoint resolver.
  - Map `cn-hangzhou` to `dm.aliyuncs.com`.
  - Keep unknown safe region fallback explicit but unvalidated.
  - Add safe provider error-code normalization and propagation through delivery safe projection.
  - Map provider diagnostics into existing failure categories without expanding schema.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Do not retry smoke until a later Step 47K-Auth explicitly authorizes it.
- Boundaries:
  - This decision does not authorize Aliyun API calls, real email/SMS, smoke harness execution, secret output, raw token output, full link output, plaintext recipient logging, provider raw full payload recording, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D141 - Step 47J diagnoses Aliyun permanent failure as likely endpoint/error-classification issue

- Date: 2026-06-28.
- Context: Step 47I-Resume attempted a controlled password-reset smoke through `AliyunDirectMailAdapter` and received `FAILED` / `PERMANENT` with no accepted send and no safe provider message id. Step 47J reviewed adapter code, tests, delivery boundary, the local smoke harness structure, local SDK type definitions, and Aliyun official DirectMail documentation without calling Aliyun APIs or sending email.
- Decision:
  - Treat the current result as not actionable enough for another smoke retry.
  - Prefer `Step 47J-Fix` before any future controlled send.
  - Patch focus should be adapter endpoint mapping and safe provider error-code classification.
  - Current endpoint derivation for `cn-hangzhou` is likely wrong because official DirectMail endpoint docs list China Hangzhou public endpoint as `dm.aliyuncs.com`.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Require new `Step 47K-Auth` before another real-send controlled smoke.
- Boundaries:
  - This decision does not authorize code changes in Step 47J, Aliyun API calls, real email/SMS, secret output, raw token output, full link output, plaintext recipient logging, provider raw full payload recording, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D140 - Step 47I-Resume stops after provider permanent failure on first controlled smoke attempt

- Date: 2026-06-28.
- Context: Step 47I-Resume retried controlled smoke after the non-secret Aliyun DirectMail runtime variables were supplied as a process-local overlay. Secret environment variable presence was confirmed without printing values. The default runtime remained `LOCAL_SAFE_STUB`. The local smoke harness called `AliyunDirectMailAdapter` directly for the first password reset attempt.
- Decision:
  - Record `CONTROLLED_SMOKE_RETRY_PROVIDER_FAILED_NO_ACCEPTED_SEND`.
  - Treat the password reset result as provider status `FAILED` with failure category `PERMANENT`.
  - Record total accepted/sent count as 0.
  - Do not attempt the invite smoke after the first provider failure.
  - Do not retry in this Step.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Keep the non-secret env overlay process-local only.
- Boundaries:
  - This decision does not authorize secret output, raw token output, full link output, plaintext recipient logging, provider raw full payload recording, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D139 - Step 47I controlled smoke stops on missing runtime configuration

- Date: 2026-06-28.
- Context: Step 47I was authorized to send at most one password reset and one invite email through a controlled local harness. Pre-send checks confirmed default runtime remained `LOCAL_SAFE_STUB`, but required Aliyun DirectMail runtime configuration names were incomplete.
- Decision:
  - Stop controlled smoke before any send.
  - Record `BLOCKED_BY_MISSING_CONFIG_NO_SEND`.
  - Record missing non-secret configuration variable names only: `ALIYUN_DM_ACCOUNT_NAME`, `ALIYUN_DM_FROM_ALIAS`, `ALIYUN_DM_REGION`.
  - Do not call Aliyun API.
  - Do not send password reset.
  - Do not send invite.
  - Do not retry in this Step.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
- Boundaries:
  - This decision does not authorize secret reading, secret output, raw token output, full link output, plaintext recipient logging, provider raw full payload recording, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.

## D138 - Step 47I controlled smoke authorization collected without execution

- Date: 2026-06-28.
- Context: Step 47I-Auth previously blocked controlled smoke because key authorization inputs were missing. The user later authorized a separate controlled smoke Step, supplied a controlled recipient mailbox, allowed one-time dry-run override, chose both password reset and invite smoke, set a two-email maximum, and defined success/failure and logging boundaries.
- Decision:
  - Record `CONTROLLED_SMOKE_AUTHORIZATION_COLLECTED_NO_SEND`.
  - Store only masked recipient evidence in memory-bank: `246****571@qq.com`.
  - Authorize a later separate smoke Step to send at most two test emails: one password reset and one invite.
  - Authorize that later Step to check required runtime env var presence without printing values.
  - Authorize that later Step to set `ALIYUN_DM_DRY_RUN=false` for one controlled smoke run only.
  - Authorize safe-normalized `providerMessageId` recording.
  - Require a controlled harness that directly calls `AliyunDirectMailAdapter`, without switching production runtime or wiring the provider into default runtime.
  - Keep the current Step as no-send documentation only.
- Boundaries:
  - This decision does not execute smoke and does not authorize secret output, raw token output, full link output, plaintext recipient logging, provider raw full payload recording, deploy, migration, seed/backfill, production/VPS/production DB access, DB writes, real user account operations, production runtime switching, default runtime provider wiring, cleanup, deletion, drop, or reset.
  - Bounce/complaint handling remains out of scope and requires a separate Step.

## D137 - Step 47I controlled smoke remains blocked until explicit smoke authorization is complete

- Date: 2026-06-28.
- Context: Step 47H added Aliyun DirectMail no-send / local dry-run support and Step 47H-R committed it. Step 47I-Auth was opened to collect authorization for a later controlled real-send smoke, but no explicit real-send authorization, recipient mailbox, dry-run override permission, smoke mail-type selection, send-count limit, failure policy, or providerMessageId recording permission was supplied in this Step.
- Decision:
  - Output `BLOCKED_BY_CONTROLLED_SMOKE_AUTHORIZATION_MISSING`.
  - Do not generate a smoke execution Prompt.
  - Keep controlled smoke deferred.
  - Keep default runtime on `LOCAL_SAFE_STUB`.
  - Require a later explicit user/ops authorization bundle before any real email smoke can be executed.
- Boundaries:
  - This decision does not authorize real email/SMS, secret reading, Aliyun API calls, provider runtime wiring, migration, seed/backfill, deploy, push, production/VPS/production DB access, DB writes, real user account operations, cleanup, deletion, drop, or reset.

## D136 - Step 47H adds Aliyun DirectMail adapter as no-send dry-run only

- Date: 2026-06-28.
- Context: Step 47H-Auth-Collect selected Aliyun DirectMail and allowed the official SDK. Real smoke remains deferred, and Step 47G chose synchronous post-commit adapter first with outbox deferred.
- Decision:
  - Install `@alicloud/dm20151123` for provider-specific adapter implementation.
  - Add Aliyun DirectMail adapter as a local no-send / dry-run capability.
  - Keep default runtime on `LOCAL_SAFE_STUB`; do not wire Aliyun adapter into `AccountLifecycleModule` in this Step.
  - Keep `ALIYUN_DM_DRY_RUN` default-safe: real send remains disabled unless a later Step explicitly authorizes controlled smoke or production sending.
  - Document environment variable names only; do not record or read secret values.
  - Continue to avoid outbox schema, worker, queue, scheduler, or durable retry in this Step.
- Boundaries:
  - This decision does not authorize real email/SMS, controlled smoke, production migration, production seed/backfill, deploy, push, production/VPS/production DB access, sensitive-config access, cleanup, deletion, drop, or reset.

## D135 - Step 47H selects Aliyun DirectMail for no-send implementation planning

- Date: 2026-06-28.
- Context: Provider/ops input collection resumed after Step 47H-Auth was blocked. The user selected Aliyun DirectMail, confirmed DNS records are managed in Cloudflare and Aliyun DirectMail DKIM/SPF/DMARC/MX verification passed, allowed Aliyun official SDK usage, selected the production public base URL, and deferred real smoke recipient authorization.
- Decision:
  - Provider / relay type is managed email API.
  - Concrete provider is Aliyun DirectMail / 阿里云邮件推送.
  - Aliyun official SDK is allowed for a future provider-specific implementation.
  - Sender domain/address are `wzunew.uk` and `system@wzunew.uk`.
  - Production public base URL is `https://production.wangyimin.cn/`.
  - Secret values must remain outside repo, memory-bank, logs, and chat. Future implementation may reference environment variable names only.
  - Real email smoke remains deferred until user separately provides a controlled test mailbox and explicit send authorization.
- Boundaries:
  - This decision does not authorize provider implementation, dependency installation in this Step, SMTP/API config, secret reading, real email/SMS, production migration, production seed/backfill, deploy, push, production/VPS/production DB access, cleanup, deletion, drop, or reset.

## D134 - Step 47H provider implementation remains blocked until provider/ops inputs are complete

- Date: 2026-06-27.
- Context: Step 47R committed local readiness and delivery-gate work. Step 47H-Auth was opened to collect provider/ops authorization before any provider-specific implementation. No concrete provider, relay plan, sender domain, production base URL, secret injection policy, rate-limit policy, failure semantics, template approval, smoke authorization, or rollout authorization was supplied in this Step.
- Decision:
  - Output `BLOCKED_BY_PROVIDER_OPS_AUTHORIZATION_MISSING`.
  - Do not generate a Step 47H provider-specific implementation Prompt.
  - Keep runtime on `LOCAL_SAFE_STUB`.
  - Require explicit user/ops authorization for all required provider, secret-management, abuse-control, failure-policy, template, smoke, and rollout inputs before implementation.
- Boundaries:
  - This decision does not authorize provider implementation, dependency installation, SMTP/API config, real email/SMS, production migration, production seed/backfill, deploy, push, production/VPS/production DB access, sensitive-config access, cleanup, deletion, drop, or reset.

## D133 - Step 47R approves local Step 47A-47G readiness changes for commit

- Date: 2026-06-27.
- Context: Step 47A-47G completed local readiness, migration rehearsal, permission rehearsal, provider decision, delivery contract design, fake-provider no-send tests, and outbox-vs-synchronous decision work. The work remained local and non-production.
- Decision:
  - Commit the reviewed Step 47A-47G local changes as `chore: record password reset delivery readiness`.
  - Include only seed/backfill, delivery contract/test, account-lifecycle service test, and memory-bank records.
  - Exclude local artifacts and preview/test files that were intentionally left untracked.
- Review basis:
  - `account:invite` and `account:reset_password` are seeded and granted only to `SYSTEM_ADMIN`.
  - Fake provider remains test-only.
  - Runtime remains `LOCAL_SAFE_STUB`.
  - No provider SDK, SMTP/API config, dependency, or network send path was added.
  - Outbox schema remains deferred; first real implementation should be synchronous post-commit adapter only after explicit provider/ops authorization.
  - Step 47B limitation remains known: Prisma `_prisma_migrations` history was not covered by local SQL rehearsal.
- Boundaries:
  - No production migration, production seed/backfill, deploy, push, provider selection, dependency installation, real email/SMS, production/VPS/production DB access, sensitive-config access, cleanup, deletion, drop, or reset is authorized by this decision.

## D132 - Step 47G starts with synchronous post-commit delivery and defers outbox schema

- Date: 2026-06-27.
- Context: Step 47E designed the adapter/outbox contract and Step 47F proved local fake-provider no-send behavior. A real provider is not selected, queue/worker/schema work is not authorized, and raw token persistence remains prohibited.
- Decision:
  - Choose `SYNCHRONOUS_POST_COMMIT_ADAPTER_FIRST_OUTBOX_DEFERRED`.
  - First real provider implementation should call the delivery adapter after token creation commits, using raw token only transiently in process memory.
  - Do not add outbox schema, migration, queue, worker, scheduler, or durable retry in this Step.
  - Defer outbox schema to a separate authorized Step only if durable retry is required.
- Rationale:
  - Synchronous post-commit delivery avoids storing raw token or full links.
  - Failed delivery can be handled by safe status and manual resend, which creates a fresh token and revokes/replaces the old active same-purpose token.
  - Adding outbox now would increase schema, worker, retry, and operations complexity before provider/ops authorization exists.
  - A durable worker cannot reconstruct a link after process loss without raw token persistence, which is intentionally forbidden.
- Failure semantics:
  - Accepted provider result maps to `SENT`.
  - Missing/invalid provider config maps to `SUPPRESSED`.
  - Permanent provider failure maps to `FAILED`.
  - Temporary/rate-limited results may map to `QUEUED` only if a retry owner exists; before worker authorization, prefer `FAILED` or `SUPPRESSED` and require resend.
- Resend policy:
  - Admin resend is allowed and must issue a new token through the existing invite/admin reset flow.
  - Public reset request may be repeated with enumeration-safe response behavior.
  - No retry path may persist raw token or full reset/invite URL.
- Production inputs still required:
  - Provider/relay selection.
  - Sender domain/address and DNS verification.
  - Production public base URL.
  - Secret storage and rotation process.
  - Timeout/failure/rate-limit policy.
  - Template approval.
  - Controlled production smoke recipient and explicit send authorization.
- Boundaries:
  - No schema/migration, runtime code change, provider selection, dependency install, SMTP/API config, email/SMS send, migration/seed/backfill execution, production/VPS/production DB access, deploy/push, cleanup, deletion, drop, reset, or sensitive-config access occurred.

## D131 - Step 47F keeps fake provider as test-only no-send boundary

- Date: 2026-06-27.
- Context: Step 47E designed a provider-agnostic adapter/outbox contract without implementation. Step 47F needed local fake-provider tests and no-send dry run while keeping runtime on `LOCAL_SAFE_STUB` and avoiding provider selection, dependencies, credentials, network, migration, seed/backfill, deploy, or production access.
- Decision:
  - Add provider-agnostic delivery contract helpers in API source.
  - Keep fake provider implementations in tests only.
  - Keep `AccountLifecycleMailer` runtime default as `LOCAL_SAFE_STUB`.
  - Normalize provider outcomes into existing safe `AccountLifecycleDeliveryStatus` values.
  - Drop unsafe provider message ids instead of storing or exposing them.
- Rationale:
  - Tests need a concrete fake adapter to prove the contract without opening a real delivery channel.
  - Runtime should not accidentally switch from no-send stub to fake/provider behavior.
  - Provider message ids can leak PII or provider URLs if accepted blindly.
- Consequences:
  - Local no-send dry-run coverage now exists for accepted, failed, suppressed, and rate-limited outcomes.
  - Real provider integration remains blocked on explicit provider/config authorization.
  - Durable retry/outbox schema is still a separate Step 47G decision.
- Boundaries:
  - No provider selected, dependency added, SMTP/API configured, email/SMS sent, schema/migration added, migration/seed/backfill executed, production/VPS/production DB accessed, deploy/push, cleanup, deletion, drop, reset, or sensitive-config access occurred.

## D130 - Step 47E designs delivery outbox without persisting raw tokens

- Date: 2026-06-27.
- Context: Step 47D kept real delivery behind explicit provider authorization. Step 47E defines the adapter/outbox contract before implementation. Password reset and invite links require raw token only at the delivery boundary, while existing token persistence stores only token hashes.
- Decision:
  - Future real delivery should use a provider-agnostic `AccountLifecycleDeliveryAdapter`.
  - A future outbox may persist delivery work metadata keyed by `token_id`, but must not persist raw token, full URL, plaintext recipient email, provider credentials, or full provider payloads.
  - The outbox idempotency key should be `token_id`.
  - Durable async delivery must not store raw tokens; if raw token is unavailable after process loss, mark delivery failed/suppressed and require resend.
  - First implementation may use synchronous post-commit send plus safe delivery status if durable retry is not yet authorized.
- Rationale:
  - Persisting raw tokens would turn the outbox into credential storage and weaken the hash-only token design.
  - Token id idempotency prevents duplicate delivery work for one issued token.
  - Separating adapter contract from provider choice keeps SMTP/API providers replaceable and testable.
- Consequences:
  - Durable background retry has an explicit limitation: it cannot reconstruct a reset/invite link unless a new token is issued.
  - True retry without reissue would require a separate security decision about encrypted secret storage, which is not approved.
  - Future provider implementation must prove no raw token/full link leakage in logs, audit, outbox, or API responses.
- Boundaries:
  - No provider selected, dependency added, schema/migration added, runtime source changed, email/SMS sent, production migration/backfill, production/VPS/production DB access, deploy, push, cleanup, deletion, drop, reset, or sensitive-config access occurred.

## D129 - Step 47D keeps real delivery behind explicit provider authorization

- Date: 2026-06-27.
- Context: Password reset and invite flows now have local schema, backend, Web, migration rehearsal, and permission seed/backfill rehearsal. Delivery still uses `AccountLifecycleMailer` with `LOCAL_SAFE_STUB`; no provider dependency, production sender, domain verification, SMTP/API credential, production base URL, or delivery-failure policy is configured.
- Decision:
  - Do not select, install, configure, or connect a real email/SMS provider in Step 47D.
  - Keep the local safe stub as the only current delivery adapter.
  - Require explicit user/operations authorization before any real delivery implementation.
  - Next implementation should first define a provider-agnostic adapter/outbox contract; SMTP is acceptable as a generic first integration path only after the user confirms provider/relay details.
- Rationale:
  - Real delivery is an external-service and security boundary: it involves credentials, sender reputation, DNS/domain verification, production base URL, rate limits, retries, bounces, complaints, and user-visible messages.
  - Picking a provider without organization input could create cost, deliverability, compliance, or operational obligations.
  - A provider-agnostic boundary keeps token/link construction transient and makes provider replacement feasible.
- Required authorization inputs:
  - Provider type and vendor/relay.
  - Sender domain/address and DNS verification ownership.
  - Production public base URL.
  - Secret storage and rotation process.
  - Rate limit, retry, timeout, bounce/complaint, and escalation policy.
  - Template copy and localization policy.
- Consequences:
  - Production invite/reset cannot be claimed end-to-end until real delivery is implemented and smoke-tested.
  - Migration/backfill readiness does not imply delivery readiness.
  - Full reset/invite links must remain unlogged and unpersisted; raw token may exist only transiently at the delivery boundary.
- Boundaries:
  - No provider selected, dependency added, email/SMS sent, production migration/backfill, production/VPS/production DB access, deploy, push, cleanup, deletion, drop, reset, or sensitive-config access occurred.

## D128 - Step 47C grants lifecycle permissions only to SYSTEM_ADMIN through idempotent seed/backfill

- Date: 2026-06-27.
- Context: Step 46D/46E added runtime gates for `account:invite` and `account:reset_password`, while Step 47A found the seed surfaces did not create or grant those permissions. Step 47B rehearsed migration SQL locally but did not run seed/backfill.
- Decision:
  - Add `account:invite` and `account:reset_password` to both seed surfaces.
  - Grant both permissions to `SYSTEM_ADMIN` only.
  - Keep other roles unchanged.
  - Use idempotent insert/upsert semantics and `role_permissions` duplicate skipping / conflict avoidance.
- Rationale:
  - Backend account lifecycle endpoints require dedicated permissions; without seed/backfill, existing system admins would not pass those gates after rollout.
  - Granting only `SYSTEM_ADMIN` is the narrowest current production-ready policy and avoids expanding invite/reset authority to department, researcher, secretary, auditor, leader, or secret-manager roles.
  - Idempotence is required because seed/backfill may be rerun during rehearsal or recovery.
- Consequences:
  - Production authorization still must run a controlled backfill; this Step only rehearsed locally.
  - Future product policy may introduce delegated account lifecycle roles, but that requires a separate access-control decision.
- Rollback / recovery:
  - Assignment rollback can remove the two `SYSTEM_ADMIN` role-permission rows for the lifecycle permissions.
  - Permission rows should normally remain for auditability and future policy consistency unless a separate rollback explicitly removes unused permission vocabulary.
  - If a production backfill partially fails, stop deployment, preserve logs, inspect partial permission rows/assignments, and retry only after review.
- Boundaries:
  - No production seed/backfill, production migration, production/VPS/production DB access, deploy, push, real email/SMS, cleanup, deletion, drop, reset, or sensitive-config access occurred.

## D127 - Step 47B uses SQL-only local rehearsal because Prisma deploy would require forbidden local DB credentials

- Date: 2026-06-27.
- Context: Step 47B required local migration rehearsal without production access, seed/backfill, destructive reset/drop/cleanup, or sensitive credential exposure. A local non-production PostgreSQL container was available, but host-side `prisma migrate deploy` would require constructing a `DATABASE_URL` from local DB credentials. The Step explicitly forbids reading local test passwords and full connection strings.
- Decision:
  - Use a new local rehearsal database in the existing local PostgreSQL container.
  - Apply committed migration SQL files in order with container-local `psql`, relying on the container's own environment without printing credentials.
  - Record that full Prisma `_prisma_migrations` history verification is not covered by this rehearsal.
  - Keep production authorization blocked on either credential-safe Prisma deploy rehearsal evidence or explicit user-provided disposable local DB connection authorization.
- Rationale:
  - SQL-only rehearsal validates the actual DDL chain, enum additions, column default/not-null behavior, table creation, indexes, and foreign keys without violating the no-password/no-connection-string boundary.
  - Avoiding `drop`, `reset`, and seed/backfill preserves the Step's non-destructive boundary.
- Consequences:
  - SQL structure readiness is confirmed locally.
  - Prisma migration-history behavior remains a known gap and must not be claimed as production-ready.
  - Future production migration authorization still needs backup/recovery evidence and preferably a true `prisma migrate deploy` rehearsal under an explicitly safe disposable connection.
- Boundaries:
  - No production/VPS/production DB access, seed/backfill, deploy, push, real email/SMS, cleanup, deletion, drop, reset, or sensitive-config access occurred.

## D126 - Step 47A splits migration, permission backfill, and real delivery into separate gates

- Date: 2026-06-27.
- Context: Step 46R committed the local password reset / invite flow at `83d2d4fa06c81a4ab4502f2725fed28a73e4479d`, but migration execution, permission seed/backfill, production access, deploy, and real email/SMS remained out of scope. Step 47A reviewed readiness without touching production or executing data changes.
- Decision:
  - Execute the account lifecycle migration only in a dedicated Step after local migration rehearsal and rollback / recovery planning.
  - Execute permission seed/backfill only in a dedicated Step after local rehearsal confirms `account:invite` and `account:reset_password` are inserted and granted to `SYSTEM_ADMIN`.
  - Keep real delivery/email provider selection as a separate decision gate before production user-facing rollout.
  - Keep production migration, production permission backfill, deploy, and smoke as separately authorized work.
- Rationale:
  - The migration changes PostgreSQL enum types, adds a defaulted column to an existing credential table, creates lifecycle token storage, creates indexes, and adds foreign keys; it deserves its own rehearsal and recovery evidence.
  - The runtime now requires dedicated lifecycle permissions, but current seed surfaces do not grant them; mixing seed/backfill with migration would obscure authorization and rollback boundaries.
  - Real email/SMS changes introduce provider, secret, deliverability, rate limit, and abuse-control decisions outside the local safe stub boundary.
- Consequences:
  - Until permission seed/backfill is applied, existing system-admin accounts with only prior permissions may not see or pass the dedicated invite/reset backend gates.
  - Until migration is applied, runtime database use of lifecycle token storage and `must_change_password` depends on schema drift being resolved.
  - Until real delivery is chosen, production invite/reset links should not be claimed as end-to-end deliverable.
- Rollback / recovery expectation:
  - Step 47B must document local migration rehearsal evidence and a production recovery approach before production authorization.
  - Step 47C must document idempotent permission insert/grant and a backout approach for only the new permission assignments before production authorization.
- Boundaries:
  - No migration execution, seed/backfill, real email/SMS, production/VPS/production DB access, deploy, push, cleanup, deletion, or sensitive-config access occurred in Step 47A.

## D124 - Step 46G keeps public lifecycle URL tokens out of form DOM values

- Date: 2026-06-27.
- Context: Step 46G local browser acceptance used browser-layer interception to test public password reset and invite acceptance flows. Browser DOM inspection showed that copying a URL token into an Ant Design form field can make the value serializable from page HTML. Successful submit also left password input values in the DOM until navigation or manual clearing.
- Decision:
  - Do not prefill reset/invite token fields from URL query values.
  - Keep URL token values only as in-memory component fallback for submit.
  - Preserve manual token entry when no URL token is present.
  - Clear token/password fields immediately after successful reset or invite acceptance before showing success state.
- Rationale:
  - The public link remains usable while avoiding token exposure through static DOM serialization, screenshots, or debugging snapshots.
  - Clearing successful forms reduces the time sensitive field values remain available in the browser DOM.
- Consequences:
  - Users following a delivered link may see an empty token field, but submit still uses the token carried by the link unless the user manually types a replacement.
  - Browser acceptance now covers the DOM-level leakage case that static render tests did not catch.
- Verification:
  - Focused AccountLifecycleAccess tests passed.
  - Web typecheck and build passed.
  - Step 46G browser acceptance passed with synthetic browser-layer interception.
- Boundaries:
  - No migration execution, seed, real email/SMS, production/VPS/production DB access, deploy, push, cleanup, deletion, production acceptance, or real token/password/full-link output occurred.

## D123 - Step 46E exposes lifecycle UI without rendering secrets or replacing backend permission checks

- Date: 2026-06-27.
- Context: Step 46D implemented backend local lifecycle endpoints behind hash-only token storage and a local safe delivery stub. Step 46E was authorized for Web UI local implementation only; migration execution, seed, production access, browser acceptance, real delivery, and real token/full-link output remained out of scope.
- Decision:
  - Extend the existing single-page Web app rather than adding a router dependency.
  - Use lightweight URL intent parsing for public lifecycle modes:
    - `flow=forgot-password`.
    - `flow=reset-password`.
    - `flow=invite-accept`.
  - Keep public reset request copy enumeration-safe and never disclose whether an email exists.
  - Do not render token query values into static markup; set token form state after mount and keep the field as a password-style input.
  - Add admin lifecycle controls in account management gated by `account:invite` and `account:reset_password` for visibility only.
  - Keep backend controllers as the final security boundary.
  - Keep invite create separate from legacy direct create-user with `initialPassword`; the invite form has no temporary password field.
- Rationale:
  - A local URL-intent approach fits the current no-router app and keeps the change small.
  - Avoiding static token rendering prevents accidental snapshot/log leakage.
  - Frontend permission gates improve ergonomics, but the backend must continue to enforce the actual policy.
- Consequences:
  - Browser acceptance remains required before claiming end-to-end UX acceptance.
  - Real delivered links are still not available because Step 46D uses a safe local mailer stub.
  - Dedicated permission seed/backfill still needs a separate authorized step.
- Verification:
  - Web typecheck, targeted tests, Web build, and diff whitespace check passed.
- Boundaries:
  - No migration execution, seed, real email/SMS, production/VPS/production DB access, deploy, push, cleanup, deletion, or real token/password/full-link output occurred.

## D122 - Step 46D implements local backend lifecycle flows behind a safe delivery stub

- Date: 2026-06-27.
- Context: Step 46C applied the account lifecycle schema delta and migration file but did not execute the migration. Step 46D was authorized as backend local implementation only, with Web UI, migration execution, seed, production access, deploy, real email/SMS, and real token/password/full-link output out of scope.
- Decision:
  - Add a dedicated `AccountLifecycleModule` under `apps/api/src/account-lifecycle`.
  - Use `account_lifecycle_tokens` as the single backend token persistence boundary for invite acceptance and password reset.
  - Store only token hashes; raw tokens remain transient for delivery and are not returned by API responses.
  - Use a local `LOCAL_SAFE_STUB` mailer boundary that records delivery status but does not send real email/SMS.
  - Make public password reset requests enumeration-safe by always returning accepted and auditing unknown/ineligible targets with safe metadata only.
  - Require `account:invite` for invite create/resend and `account:reset_password` for admin reset/revoke.
  - Preserve legacy direct `initialPassword` account creation only as a transitional path and mark created credentials `mustChangePassword: true`.
- Rationale:
  - Keeping lifecycle logic in one module reduces duplication across invite and reset while preserving clear controller boundaries.
  - Hash-only token storage and one-time consume semantics match the Step 46B contract and avoid persisting usable secrets.
  - A safe local stub lets backend tests verify issuance/delivery state without violating the no-real-email boundary.
  - Dedicated permissions avoid widening all account-management operations through `system:config`.
- Consequences:
  - Runtime use still depends on the Step 46C migration being executed in a separately authorized environment.
  - System-admin permission seed/backfill for the new permission codes remains separate work.
  - Web UI has no affordances yet; users cannot exercise the full flow from the browser until a later Step.
- Verification:
  - API typecheck passed.
  - Targeted API tests passed for account-lifecycle, account-management, and auth controller areas.
- Boundaries:
  - No migration execution, seed, real email/SMS, production/VPS/production DB access, deploy, push, cleanup, deletion, or real token/password/full-link output occurred.

## D121 - Step 46C applies account lifecycle schema delta without executing migration

- Date: 2026-06-27.
- Context: Step 46B selected a single `account_lifecycle_tokens` schema contract and deferred schema patching to Step 46C. Step 46C was authorized as schema delta patch only, with migration file generation allowed but migration execution, seed, runtime API/UI implementation, production access, and real email/token/password/link generation forbidden.
- Decision:
  - Patch `prisma/schema.prisma` with lifecycle token enums/model, `UserStatus.PENDING_ACTIVATION`, `UserCredential.mustChangePassword`, user lifecycle token relations, and persisted invite/reset audit actions.
  - Add reviewable migration SQL under `prisma/migrations/20260627103000_add_account_lifecycle_tokens/migration.sql`.
  - Keep `emailHash`, delivery channel, and delivery status nullable in the applied model to support both admin and public flows and to keep token issuance separate from delivery.
  - Use `SetNull` foreign keys for token target/creator users so historical token/audit correlation can remain when user references are unavailable.
  - Sync only schema-adjacent constants and mapper entries needed for type consistency.
  - Do not add seed/backfill role-permission assignments in this Step.
- Rationale:
  - The table provides one hash-only, replay-safe persistence shape for invite and reset.
  - `PENDING_ACTIVATION` prevents invited users from being represented as active before acceptance.
  - `mustChangePassword` supports transitional admin-created credentials without expanding runtime behavior in this Step.
  - The migration remains reviewable and separate from execution, preserving the production database boundary.
- Verification:
  - Prisma validation passed with a one-shot placeholder datasource value.
  - Prisma client generation passed with a one-shot placeholder datasource value.
  - API typecheck passed.
  - Targeted authorization constants and audit repository tests passed.
- Consequences:
  - Schema is ready for local backend implementation in a later Step.
  - The database has not been migrated.
  - Permission seed/backfill and runtime behavior remain future work.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No migration execution, seed, deploy, push, production access, VPS access, production DB access, cleanup, deletion, real email/SMS, real token/password/full link generation, or real account creation occurred.
  - No `.env`, real `DATABASE_URL`, token value, cookie value, certificate, private key, credential secret, local test password, full reset/invite link, or full connection string was read or recorded.

## D120 - Step 46B selects a single account lifecycle token schema contract and defers schema patch to Step 46C

- Date: 2026-06-27.
- Context: Step 46B reviewed Step 46A password reset / invite design against the existing auth, account-management, audit, authorization, Prisma schema, migration naming, and test patterns. Existing schema has users, credentials, sessions, login attempts, audit logs, notifications, and API integration config, but no invite/reset lifecycle token model. Current account creation still supports optional administrator-provided `initialPassword`.
- Decision:
  - Use a single future `account_lifecycle_tokens` table for invite acceptance and password reset tokens.
  - Add purpose/status/delivery enums for lifecycle tokens.
  - Add `PENDING_ACTIVATION` to `UserStatus` for invited users instead of adding a separate independent activation field.
  - Add `mustChangePassword` to `UserCredential` so transitional admin-created credentials can be forced through password change.
  - Add dedicated permissions `account:invite` and `account:reset_password`, initially mapped to system-admin seed policy in a later schema/seed-aware Step.
  - Expand domain and persisted audit actions for invite/reset lifecycle events in the schema patch, rather than overloading all lifecycle events as generic `UPDATE`.
  - Use a mail adapter interface and safe local stub for the first implementation; do not add a separate mail outbox table in the initial schema patch.
  - Defer actual `prisma/schema.prisma` edits and migration file generation to Step 46C as a schema delta patch only.
- Rationale:
  - One token table keeps hash-only storage, one-time use, revoke/replace, cleanup, replay prevention, delivery state, and audit correlation consistent across invite and reset.
  - Split tables would duplicate sensitive lifecycle logic without clear current benefit.
  - Adapter-only without token persistence cannot meet replay-prevention or audit requirements.
  - `PENDING_ACTIVATION` keeps invite pending as a single account lifecycle state and avoids contradictory `ACTIVE` plus pending activation combinations.
  - `mustChangePassword` belongs on credentials because it constrains a credential's authentication behavior.
  - A separate mail outbox can be added later if retry/delivery durability requirements exceed the lifecycle token delivery-status fields.
- Consequences:
  - Step 46B is complete as contract review only; no runtime capability is implemented.
  - Schema delta and migration file are required but remain future work.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No business code, Web UI, Prisma schema, migration, seed, deploy, push, production access, VPS access, production DB access, cleanup, deletion, real email/SMS, real token/password/full link generation, or real account creation occurred.
  - No `.env`, `DATABASE_URL`, token value, cookie value, certificate, private key, credential secret, local test password, full reset/invite link, or full connection string was read or recorded.

## D119 - Step 46A separates invite from password reset and requires hash-only account lifecycle tokens

- Date: 2026-06-27.
- Context: Step 46A needed local design confirmation for Phase 2 password reset / invite capability. Existing auth supports login/logout/bootstrap/session hashing. Existing account management supports admin user creation and optional `initialPassword`, disable/enable, roles, departments, and audit. There is no dedicated invite/reset token model, no mail outbox/adapter, no first-login forced password change flag, and no dedicated account lifecycle permissions/audit actions.
- Decision:
  - Treat invite and password reset as separate capabilities:
    - Invite creates or activates a new account through admin-authorized onboarding.
    - Password reset replaces credentials for an existing identity and must not imply account creation.
  - Prefer invite-first onboarding over administrator-set temporary passwords.
  - If administrator temporary passwords remain during transition, require a future forced-password-change state and do not display generated passwords after creation.
  - Future tokens must be high-entropy, purpose-scoped, expiry-bound, revocable, one-time, and hash-only at rest.
  - Public password-reset request responses must be user-enumeration safe.
  - Real production email delivery is required for usable invite/reset, but must be isolated behind a replaceable adapter/outbox and separately authorized before real sending.
  - Future implementation likely requires schema/migration design for account lifecycle token persistence, pending invite/user lifecycle state, forced password change, dedicated permissions, and dedicated audit action/target semantics.
- Rationale:
  - Invite and reset have different business meanings, actors, target eligibility, and audit semantics.
  - Admin-visible or admin-chosen passwords create avoidable custody and audit risk.
  - Hash-only, one-time token persistence follows the existing session-token pattern and avoids storing secrets.
  - Enumeration-safe reset requests are required for public unauthenticated flows.
  - Adapter isolation lets local implementation remain safe while allowing production email replacement later.
- Consequences:
  - Step 46A is a design closure only; no runtime capability is implemented.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
  - Step 46B should handle schema/API contract review or schema delta implementation before backend work.
- Boundary:
  - No business code, Web UI, Prisma schema, migration, seed, deploy, push, production access, VPS access, production DB access, cleanup, deletion, real email/SMS, real token/password generation, or real account creation occurred.
  - No `.env`, `DATABASE_URL`, token value, cookie value, certificate, private key, credential secret, local test password, full reset/invite link, or full connection string was read or recorded.

## D118 - Step 45C-4 accepts attachment UI behavior with browser-layer interception until migration execution is authorized

- Date: 2026-06-27.
- Context: Step 45C-4 needed local browser acceptance for attachment UI behavior after Step 45C-3R committed Web integration. Step 45C-1R generated the Attachment metadata migration file but migration execution remains explicitly forbidden in the current boundary.
- Decision:
  - Perform browser acceptance against the existing local frontend at `http://127.0.0.1:5176/`.
  - Use real local Chrome for UI interaction.
  - Use browser-layer `/api/*` interception with synthetic users, achievement, attachment metadata, upload, and download responses.
  - Do not execute real local API/DB upload in this Step because the required Attachment metadata migration has not been applied and migration execution is out of scope.
  - Treat this as local browser/UI acceptance only, not production acceptance and not real DB/storage acceptance.
- Rationale:
  - The Step's goal is to verify the user-facing attachment UI workflow without violating the no-migration/no-production/no-real-business-file boundary.
  - Browser-layer interception exercises the actual rendered UI, client-side validation, permission gating, request routing, success/error states, and safe metadata display.
  - Real API/DB upload acceptance should wait for a separately authorized migration/database Step.
- Verification:
  - Permitted owner path passed for attachment visibility, upload visibility, empty state, invalid type rejection, oversize rejection, synthetic allowed upload, list refresh, safe metadata display, authenticated download route call, and download success feedback.
  - Read-only/no-download path passed for upload hidden, notice visible, list visible, intercepted 403, and safe permission error display.
  - UI did not expose `storageKey`, checksum, raw path, or file body content.
- Consequences:
  - Attachments first-stage local browser/UI capability is accepted at browser layer.
  - Real local API/DB upload, migration execution, production deploy/smoke, archive/delete, virus scanning, and object storage remain future work.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No Prisma schema/migration change, migration execution, seed, production DB access, production write, VPS connection, deploy, push, cleanup, deletion, real business file upload, user private file read, or sensitive-config access occurred.

## D117 - Step 45C-3 uses authenticated Web multipart upload and blob download without exposing storage internals

- Date: 2026-06-27.
- Context: Step 45C-2R committed the local backend attachment multipart upload/download/storage implementation. Step 45C-3 needed to connect achievement detail UI to that backend while staying local and avoiding schema/migration, backend scope expansion, production access, real business files, push, deploy, cleanup, or deletion.
- Decision:
  - Add `postForm` to the Web API client for attachment multipart upload and let the browser set the multipart `Content-Type` boundary.
  - Add `downloadBlob` to the Web API client for authenticated attachment download.
  - Keep achievement detail UI focused on safe attachment metadata, upload controls, and download actions.
  - Gate upload UI by achievement ownership plus `achievement:update_own`.
  - Keep download authorization at the backend route and surface user-facing frontend errors for unauthorized/forbidden/not-found/server failures.
  - Do not display storage keys, checksums, local paths, or file body contents in Web metadata.
  - Do not add archive/delete, virus scanning, object storage, production deployment, production smoke, migration execution, or seed behavior in this Step.
- Rationale:
  - The browser must own multipart boundaries; manually setting `Content-Type` would break real uploads.
  - Blob downloads preserve the backend authorization and response-header contract without exposing storage implementation details to the frontend.
  - Upload gating in UI improves ergonomics, but backend permission checks remain the security boundary.
- Verification:
  - Web typecheck passed.
  - AchievementDetail, api-client, and broader Achievement tests passed.
  - Web build passed with only the Vite chunk-size warning.
  - `git diff --check` passed with line-ending warnings only.
- Consequences:
  - Achievement detail now has local attachment list/upload/download UI wired to the backend contract.
  - Production storage acceptance, archive/delete, virus scanning, object storage, migration execution, and production smoke remain future work.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No Prisma schema/migration change, migration execution, seed, backend feature expansion, production DB access, production write, VPS connection, deploy, push, cleanup, deletion, real business file upload, or sensitive-config access occurred.

## D116 - Map fee waive/cancel domain audit actions to persisted UPDATE until AuditActionType is expanded

- Date: 2026-06-27.
- Context: Step 45C-2Fix needed to unblock local API typecheck without changing Prisma schema, generating a migration, executing migration, or expanding attachment feature scope. The domain `AuditActionCode` includes `WAIVE_FEE` and `CANCEL_FEE`, but the current Prisma `AuditActionType` enum does not.
- Decision:
  - Add a complete domain-to-Prisma audit action mapping in `audit-prisma.mapper`.
  - Keep `WAIVE_FEE` and `CANCEL_FEE` in the domain enum.
  - Persist those two fee status actions as Prisma `UPDATE` for the current no-schema-change local phase.
  - Preserve the domain action values inside fee audit JSON summaries so masked audit details can still distinguish waive/cancel semantics.
  - Do not modify `prisma/schema.prisma` or migration files in this Step.
- Rationale:
  - Directly assigning the wider domain action union to Prisma inputs makes typecheck fail when domain actions intentionally exceed the current database enum.
  - Schema enum expansion requires a separate database/migration decision and is outside Step 45C-2Fix.
  - Mapping to `UPDATE` keeps audit writes compatible with the current persisted enum while preserving semantic details in payload data.
- Verification:
  - API typecheck passed.
  - Audit, fee, and attachment backend tests passed.
  - `git diff --check` passed.
- Consequences:
  - Step 45C-2 can proceed to review/commit gate with API typecheck restored.
  - A future schema/migration Step may add `WAIVE_FEE` and `CANCEL_FEE` to `AuditActionType` and then change the mapping to one-to-one persistence.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No Prisma schema/migration change, migration execution, seed, production DB access, production write, VPS connection, deploy, push, cleanup, deletion, attachment feature expansion, Web UI implementation, or sensitive-config access occurred.

## D115 - Step 45C-2 implements local backend multipart storage and defers production storage concerns

- Date: 2026-06-27.
- Context: Step 45C-1R committed the Attachment metadata schema delta needed for local upload/download/storage. Step 45C-2 was authorized as backend-only local implementation and validation, with migration execution, seed, Web UI, production access, archive/delete, virus scanning, and object storage explicitly out of scope.
- Decision:
  - Implement achievement attachment upload as multipart `file` input at the API boundary.
  - Store uploaded bytes through a local disk storage adapter for this local phase.
  - Keep local storage rooted under `deploy/artifacts/` for non-production usage, with path traversal protection and safe object-key resolution.
  - Validate file presence, size, extension, MIME type, and basic content signatures before writing storage.
  - Return downloads as streamed file responses with safe `Content-Type`, `Content-Length`, and `Content-Disposition` headers.
  - Propagate safe metadata fields to repository records and metadata DTOs.
  - Keep archive/delete, virus scanning, provider enum, object storage/S3, Web UI, production migration application, and production acceptance deferred.
- Rationale:
  - Multipart upload is the real backend boundary needed by future UI work; JSON object bodies are not a valid production-like attachment contract.
  - A local disk adapter provides a concrete storage implementation for local validation without claiming production storage readiness.
  - Explicit validation and path-safety checks reduce immediate local security risk while preserving future object-storage migration options.
- Verification:
  - Attachment backend tests passed: 6 files / 54 tests.
  - `git diff --check` passed.
  - API typecheck is blocked by an existing non-Step audit Prisma enum mismatch for `WAIVE_FEE`, not by attachment code after local fixes.
- Consequences:
  - Step 45C-2 provides local backend upload/download/storage behavior for attachments.
  - Web UI and production storage acceptance still require separate Steps.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No migration execution, seed, production DB access, production write, VPS connection, deploy, push, cleanup, deletion, Web UI implementation, archive/delete implementation, virus scan, object storage/S3, or sensitive-config access occurred.
  - `.local-step44h/` and `local-prod-preview-proxy.cjs` remain untracked local artifacts outside this decision.

## D114 - Step 45C-1 adds Attachment storage metadata schema fields without migration execution

- Date: 2026-06-27.
- Context: Step 45B concluded that real local attachment multipart upload/download and local storage need additional Attachment metadata fields before implementation. The user authorized modifying `prisma/schema.prisma` and generating a migration file, but not executing migration, seed, API/storage/UI implementation, production access, push, deploy, or cleanup.
- Decision:
  - Add five Attachment metadata fields:
    - `mimeType`.
    - `sizeBytes`.
    - `storageProvider`.
    - `originalName`.
    - `storedName`.
  - Keep the fields nullable/default-compatible for existing rows.
  - Use `storageProvider` as a string with default `LOCAL_DISK` instead of a provider enum for this Step to reduce future provider expansion migration cost.
  - Preserve existing `fileName`, `storageKey`, `checksum`, `status`, `secretLevel`, `archivedAt`, unique constraint, and indexes.
  - Add a new migration file with only additive `ADD COLUMN` statements.
  - Do not execute the migration.
  - Defer `deletedAt`, `scanStatus`, provider enum, data backfill, API implementation, storage implementation, UI implementation, tests, seed changes, and production acceptance.
- Rationale:
  - The new fields are the minimum metadata needed for later safe multipart upload, download headers, local disk adapter compatibility, and future object-storage provider routing.
  - Nullable/default additive columns avoid destructive migration risk and preserve compatibility with existing Attachment rows.
  - Keeping old fields avoids breaking current metadata-only UI and backend fake-storage tests.
- Verification:
  - Prisma schema format and validate passed.
  - Migration SQL was inspected and contains only additive column changes.
  - Safety scan found no destructive SQL or sensitive connection information.
- Consequences:
  - Step 45C can implement local multipart/local storage against explicit metadata fields after separate authorization.
  - Applying the migration remains a future, explicitly authorized database operation.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No migration execution, seed, production DB access, production write, VPS connection, deploy, push, cleanup, deletion, API/storage/UI/test implementation, or sensitive-config access occurred.
  - `.local-step44h/` and `local-prod-preview-proxy.cjs` remain untracked local artifacts outside this decision.

## D113 - Step 44H closes fee local browser acceptance without production acceptance

- Date: 2026-06-27.
- Context: Step 44B-44F completed local fee create/mark-paid hardening and waive/cancel implementation. Step 44G recommended browser/UI acceptance before treating the fee/payment-state local phase as ready to move on.
- Decision:
  - Treat fee create / mark-paid / waive / cancel local UI behavior as browser-accepted for the current local scope.
  - Use local browser API interception and synthetic `LOCAL_STEP44H` records for this acceptance to avoid production access, real DB writes, and sensitive local configuration exposure.
  - Keep archive, voucher attachment, `/fees/warnings`, finance review/approval, persisted reason history, production deploy/smoke, and Step 38 production acceptance deferred.
- Rationale:
  - Production preview plus real browser interaction validates the frontend permission gates, drawers, validation feedback, and refresh behavior that unit tests cannot fully prove.
  - API interception is appropriate for this Step because the requested boundary forbids production access and sensitive configuration exposure.
  - Existing API and web tests already covered service/controller/client logic for the fee endpoints before this browser acceptance.
- Consequences:
  - Fee/payment-state can locally move past browser/UI acceptance for the implemented create / mark-paid / waive / cancel scope.
  - Remaining fee items are still not complete and must not be represented as implemented or production accepted.
  - Phase 2 remains incomplete.
  - Step 38 production acceptance remains deferred.
- Boundary:
  - No push, VPS connection, production DB access, production write, production deploy, migration, seed, cleanup, deletion, batch cleanup, or sensitive-config access occurred.
  - `local-prod-preview-proxy.cjs` remains an untracked local helper outside this decision.

## D112 - Step 44E implements local waive/cancel and keeps archive deferred

- Date: 2026-06-27.
- Context: Step 44D confirmed that fee `WAIVED` and `CANCELLED` should become explicit local user actions, while archive should remain separate and deferred. Existing schema already has `PayStatus.WAIVED`, `PayStatus.CANCELLED`, and `archivedAt`, and the state machine already permits `PENDING` / `OVERDUE` to transition to `WAIVED` or `CANCELLED`.
- Decision:
  - Implement local `POST /fees/:id/waive` and `POST /fees/:id/cancel` actions.
  - Reuse `fee:manage_department` for both actions.
  - Require a trimmed reason with length 1-500.
  - Store the reason only in audit payload for this Step; do not add schema fields or a status-history table.
  - Add audit action codes `WAIVE_FEE` and `CANCEL_FEE`.
  - Include old status, new status, and reason in the fee audit payload.
  - Keep archive deferred and separate from `PayStatus`.
  - Do not add voucher attachment, warnings API, finance review/approval, production deploy, production DB access, production write, migration, seed, cleanup, or Phase 2 completion.
- Rationale:
  - The existing data model and state machine already support the two terminal statuses, so no schema migration is needed for a minimal local implementation.
  - Reusing the existing transaction, permission, and department-scope patterns limits blast radius.
  - Audit-only reason storage satisfies the Step 44E scope without introducing migration risk.
  - Archive has different semantics from pay status and should remain deferred until a separate lifecycle decision is made.
- Verification:
  - `corepack pnpm --filter @research-ip/api test -- fee`: PASS, 6 files / 70 tests.
  - `corepack pnpm --filter @research-ip/web test -- Fee`: PASS, 1 file / 40 tests.
  - `$env:VITE_API_BASE_URL='/api'; corepack pnpm --filter @research-ip/web build`: PASS with existing Vite chunk-size warning.
- Consequences:
  - Local fee users with manage permission can explicitly waive or cancel eligible fees.
  - `PAID`, `WAIVED`, and `CANCELLED` remain terminal.
  - Production acceptance is still not complete.
  - Archive, voucher attachments, warnings API, finance review, production deploy/smoke, and Step 38 production acceptance remain deferred.
  - Phase 2 remains incomplete.
- Boundary:
  - No push, VPS connection, production DB access, production write, production deploy, migration, seed, cleanup, deletion, batch cleanup, or sensitive-config access occurred.
  - `local-prod-preview-proxy.cjs` remains an untracked local helper outside this decision.

## D111 - Step 44B keeps fee write hardening local and permission-scoped

- Date: 2026-06-26.
- Context: Step 44A confirmed the local fee/payment-state scope. Existing backend APIs already expose `POST /fees` and `POST /fees/:id/mark-paid`, with PayStatus limited to `PENDING`, `PAID`, `OVERDUE`, `WAIVED`, and `CANCELLED`. Step 44B needed local validation and hardening without expanding into production, voucher attachments, warnings API, finance approval, or additional state APIs.
- Decision:
  - Keep Step 44B limited to local create / mark-paid validation and test hardening.
  - Reuse existing fee API and UI contracts.
  - Require explicit `fee:manage_department` permission context for frontend fee create / mark-paid visibility.
  - Treat missing frontend auth context as not authorized for fee write entries.
  - Add service-level regression coverage so read-only fee users cannot trigger create or mark-paid service write paths.
  - Do not add finance approval / review states.
  - Do not add waive/cancel/archive API.
  - Do not add voucher upload/download/storage.
  - Do not add `/fees/warnings`.
  - Do not run migration, seed, cleanup, production deploy, production smoke, production DB access, or production write.
- Rationale:
  - Step 44A identified the real current business surface as existing fee ledger create and mark-paid, not a broader finance workflow.
  - Frontend write-entry visibility should not be permissive when auth context is unavailable.
  - Service-level permission tests protect the write path even if controller routing is bypassed in future internal usage.
  - Keeping the state model unchanged avoids schema/migration risk and avoids implying unconfirmed finance approval semantics.
- Verification:
  - `corepack pnpm --filter @research-ip/api test -- fee`: PASS, 6 files / 56 tests.
  - `corepack pnpm --filter @research-ip/web test -- Fee`: PASS, 1 file / 37 tests.
  - `$env:VITE_API_BASE_URL='/api'; corepack pnpm --filter @research-ip/web build`: PASS with existing Vite chunk-size warning.
- Consequences:
  - Local fee write/payment-state behavior is better permission-hardened.
  - Production acceptance is still not complete.
  - Voucher attachments, warnings API, finance review, waive/cancel/archive APIs, production deploy/smoke, and Step 38 production acceptance remain deferred.
  - Phase 2 remains incomplete.
- Boundary:
  - No push, VPS connection, production DB access, production write, production deploy, migration, seed, cleanup, deletion, batch cleanup, or sensitive-config access occurred.
  - `local-prod-preview-proxy.cjs` remains an untracked local helper outside this decision.

## D110 - Local production-like regression becomes the pre-VPS verification path

- Date: 2026-06-26.
- Context: After Step 42 closure in the authoritative project memory-bank, the user shifted the workflow back to local production-like validation and asked to use `http://localhost:5176/` for repeated testing before any later VPS upload/deploy. During this local regression, an Account management department selector bug was fixed and validated in this GitHub-main local clone.
- Decision:
  - Record `http://localhost:5176/` as the preferred local production-like regression target before future GitHub / VPS deploy work.
  - Treat the Account management department selector fix in `apps/web/src/AccountManagement.tsx` as locally validated.
  - Treat `local-prod-preview-proxy.cjs` as a local test helper unless the user separately decides it should be committed.
  - Treat the imported `admin@production.local`, `auditor@production.local`, `research_secretary@production.local`, and `smoke-user-1@production.local` records as local production-like test accounts only.
  - Do not record local test passwords in memory-bank.
  - Treat Step 38 negative write-path as locally retested and passed in the production-like environment, not as production acceptance.
  - Keep production deploy, production smoke, production DB access, and production write acceptance gated by later explicit authorization.
- Rationale:
  - Local production-like testing catches production-build/session/cookie/form-binding issues before VPS deploy without expanding production access.
  - The reported UI issue was caused by form-state binding, so a production-build local UI regression is the right verification layer before deployment.
  - Step 38 negative write-path requires a controlled archived-department fixture; reproducing this locally avoids mutating real production data.
- Consequences:
  - Future work should first run local production-like regression on `http://localhost:5176/` when feasible.
  - The current local regression can support a later commit/deploy decision.
  - Production acceptance remains incomplete until separately executed or explicitly deferred.
  - Phase 2 remains incomplete.
- Boundary:
  - No VPS connection, production DB access, direct production DB query, production write, production deploy, cleanup, migration, seed, file deletion, or batch cleanup was executed.
  - No `.env`, `DATABASE_URL`, token, cookie value, certificate, private key, credential secret, session secret, local test password, or full connection string was recorded.

## D099 - Step 41B is blocked until explicit production authorization is provided

- Date: 2026-06-25.
- Context: Step 41B is the authorized production deploy and GET-only smoke substep after Step 41A. The Step 41B instructions require explicit Chinese user authorization before any VPS connection, production deploy, or GET-only production smoke. The user message attached Step 41B instructions but did not include the required authorization statement.
- Decision:
  - Set Step 41B result to `BLOCKED_BY_PRODUCTION_AUTHORIZATION`.
  - Do not connect to VPS.
  - Do not access production DB.
  - Do not deploy.
  - Do not run GET-only production smoke.
  - Do not execute production writes, migration, seed, smoke-account cleanup, synthetic-data cleanup, prompt-history cleanup, commit, tag, artifact packaging, or new Phase 2 work.
  - Keep Step 41A / D098 deploy-candidate scope as the current readiness basis.
- Rationale:
  - Step 41B has an explicit authorization gate for production connection/deploy/smoke.
  - Production actions are high-risk and must be explicitly authorized by the user with target environment/domain and boundaries.
  - Local checks found no schema / migration / seed / deployment-config diff and no scope conflict, so the blocker is authorization, not local readiness.
- Evidence:
  - Step 41A / D098 exists and records `READY_FOR_STEP_41B_AUTHORIZED_DEPLOY_AND_GET_SMOKE`.
  - `git diff -- prisma/schema.prisma prisma/migrations prisma/seed.cjs prisma/seed-foundation.cjs`: no output / no diff.
  - `git diff -- package.json pnpm-lock.yaml pnpm-workspace.yaml docker-compose.yml docker-compose.prod.yml docker-compose.production.yml Dockerfile.api Dockerfile.web deploy README.md README* nginx*`: no output / no diff.
  - No production action was executed.
- Consequences:
  - Step 41B remains blocked until the user provides the required explicit authorization.
  - Production deploy and GET-only smoke are not completed.
  - GET-only smoke must not be represented as write acceptance when eventually performed.
  - Phase 2 remains incomplete.
- Resume requirement:
  - The next user authorization must explicitly allow connecting to the target VPS / production environment, executing production deploy, and running GET-only production smoke.
  - It must also explicitly forbid production writes, migration/seed, smoke-account cleanup, synthetic-data cleanup, and sensitive-config output, name the target environment/domain, and acknowledge that local validation is not production acceptance.

## D098 - Step 41A confirms deploy candidate scope and excludes prompt-history file

- Date: 2026-06-25.
- Context: Step 41 concluded `NEEDS_SUBSTEP_SPLIT_BEFORE_DEPLOY` and recommended Step 41A as pre-deploy packaging / commit-scope confirmation. Step 41A rechecked the working tree, deploy candidate scope, excluded files, schema / migration / seed diff, deployment config diff, and lightweight local gates without executing production actions.
- Decision:
  - Set Step 41A judgment to `READY_FOR_STEP_41B_AUTHORIZED_DEPLOY_AND_GET_SMOKE`.
  - Include the accumulated deploy candidate from Step 36Fix, Step 37, Step 38, Step 40, and Step 41 / Step 41A memory-bank records.
  - Treat the untracked Department management source/test files as required deploy-candidate files.
  - Exclude `prompt历史记录_按Step拆分/Step 34.md` or the equivalent mojibake prompt-history path from commit, tag, artifact, and deployment scope unless the user separately authorizes handling it.
  - Do not execute commit, tag, artifact packaging, VPS connection, production deploy, production DB access, production write, migration, seed, smoke-account cleanup, synthetic-data cleanup, or new Phase 2 work in Step 41A.
- Rationale:
  - No schema / migration / seed implementation diff was found.
  - No deployment configuration diff was found.
  - Lightweight local gates passed after Step 41.
  - The remaining prompt-history file is unrelated to deployable application behavior and should not enter the deploy package by accident.
  - Step 41B has a different risk boundary because it requires VPS connection, production deployment, and GET-only production smoke.
- Verification:
  - `corepack pnpm lint`: PASS.
  - `corepack pnpm --filter @research-ip/api typecheck`: PASS.
  - `corepack pnpm --filter @research-ip/web typecheck`: PASS.
  - `corepack pnpm test:seed:foundation`: PASS, 1 suite / 4 tests.
  - Step 41 API/Web full tests and builds remain the current full local evidence because Step 41A did not change business code.
- Consequences:
  - Step 41A is complete as pre-deploy scope confirmation only.
  - Step 41B may proceed only with explicit user authorization for VPS connection, production deploy, and GET-only smoke.
  - Production writes, migration, seed, smoke-account cleanup, and synthetic-data cleanup remain out of scope and forbidden unless separately authorized.
  - Local validation remains local evidence only and must not be represented as production acceptance.
- Rollback / correction path:
  - If the working tree changes before Step 41B, rerun Step 41A scope confirmation and lightweight gates.
  - If the prompt-history file must be preserved, handle it in a separate documentation step rather than mixing it into production deploy scope.
  - If a later production deploy audit finds a migration / seed / production write requirement, stop and open a separately authorized high-risk production action step.

## D097 - Step 41 requires substep split before production deploy

- Date: 2026-06-25.
- Context: Step 41 audited production deploy / acceptance readiness after Step 40. The deploy candidate accumulates Step 36Fix local UI tightening, Step 37 Department maintenance backend / UI, Step 38 ACTIVE department write-path hardening, and Step 40 root lint cleanup. The current diff has no schema / migration / seed implementation change and no deployment configuration change, and fresh local gates pass.
- Decision:
  - Set Step 41 judgment to `NEEDS_SUBSTEP_SPLIT_BEFORE_DEPLOY`.
  - Do not execute production deploy, VPS connection, production DB access, production writes, migration, seed, smoke-account cleanup, synthetic-data cleanup, or new Phase 2 feature work in Step 41.
  - Split the follow-up chain before actual deployment:
    - Step 41A: pre-deploy packaging / commit-scope confirmation.
    - Step 41B: explicitly authorized production deploy plus GET-only smoke.
    - Step 41C: explicitly authorized production write acceptance only if the user approves production writes.
  - Keep smoke-account cleanup and `[SYNTHETIC-PROD-ROLE-ACCEPTANCE]` cleanup in a later separate production data cleanup step.
- Rationale:
  - Local gates are clean and there is no migration/seed/deploy-config blocker.
  - The candidate still spans multiple local steps and includes a new administrative Department management write surface plus backend write-path behavior changes.
  - GET-only production smoke and production write acceptance have different risk boundaries and authorization requirements.
  - The unrelated untracked prompt-history file should be excluded or separately handled before packaging / commit-scope confirmation.
- Verification:
  - `corepack pnpm lint`: PASS.
  - `corepack pnpm --filter @research-ip/api typecheck`: PASS.
  - `corepack pnpm --filter @research-ip/web typecheck`: PASS.
  - `corepack pnpm test:seed:foundation`: PASS, 1 suite / 4 tests.
  - `corepack pnpm --filter @research-ip/api test`: PASS, 64 files / 558 tests.
  - `corepack pnpm --filter @research-ip/web test`: PASS, 15 files / 231 tests.
  - `corepack pnpm --filter @research-ip/api build`: PASS.
  - `corepack pnpm --filter @research-ip/web build`: PASS with existing Vite large chunk warning.
- Consequences:
  - Step 41 is complete only as a planning / authorization gate.
  - Production deploy and production acceptance are not completed.
  - User authorization must explicitly name allowed production actions and boundaries before any production operation.
  - Local validation must not be described as production acceptance.
  - A larger production deploy / acceptance chain needs an explicit closure archive after execution.
- Rollback / correction path:
  - If local scope changes before deployment, rerun Step 41A-style scope confirmation and local gates.
  - If a later audit discovers a required migration / seed / production data write, stop and open a high-risk production action step with separate authorization.
  - If production deploy fails after authorization, use the production runbook rollback path and record only redacted evidence.

## D096 - Step 40 resolves inherited root lint failures as local-only cleanup

- Date: 2026-06-25.
- Context: Step 39 classified inherited root lint failures as a dedicated local quality-gate cleanup item after Step 38 was closed locally with production and cleanup deferred. The failures were limited to an unused account-management import, an unused legacy frontend function, and CommonJS lint compatibility in the seed-foundation node:test script.
- Decision:
  - Treat Step 40 as the canonical local cleanup for those inherited root lint failures.
  - Keep the cleanup behavior-preserving:
    - Remove the unused account-management import.
    - Preserve `LegacyDemoApp` and suppress only its unused-symbol lint warning.
    - Preserve the CommonJS seed-foundation test script and add narrow lint compatibility comments.
  - Do not use Step 40 to perform production deploy / acceptance, production DB access, production writes, smoke-account disable, synthetic data cleanup, migration, seed execution, schema changes, or Phase 2 feature implementation.
- Rationale:
  - The initial Step 40 root lint output matched the archived inherited unrelated failures exactly.
  - Removing the unused import and using narrow lint compatibility comments clears the quality gate without rewriting legacy/demo code paths or changing seed test execution semantics.
  - Production and data cleanup routes require separate authorization and evidence.
- Verification:
  - `corepack pnpm lint`: PASS.
  - `corepack pnpm --filter @research-ip/api typecheck`: PASS.
  - `corepack pnpm --filter @research-ip/web typecheck`: PASS.
  - `corepack pnpm test:seed:foundation`: PASS, 1 suite / 4 tests.
- Consequences:
  - Root lint no longer fails on the inherited unrelated items.
  - Phase 2 remains incomplete.
  - Production deploy / acceptance and production cleanup routes remain deferred.
- Rollback / correction path:
  - If a later review wants the legacy demo function removed instead of lint-suppressed, open a separate behavior-neutral cleanup step and verify web typecheck plus root lint.
  - If the seed-foundation test is converted to ESM later, keep that as a separate test-harness refactor with root lint and `test:seed:foundation` evidence.

## D095 - Step 39 plans remaining Phase 2 routes after Step 38 local closure

- Date: 2026-06-25.
- Context: Step 38-Closure closed Step 38 locally as `CLOSED_LOCALLY_WITH_PRODUCTION_AND_CLEANUP_DEFERRED` after local backend ACTIVE department guard hardening. Step 36, Step 37, and Step 38 each left production, cleanup, lint, and broader Phase 2 routes deferred. Step 39 was opened as a planning step only, with explicit boundaries against business code changes, production access, production writes, deployment, migration, seed, and sensitive configuration access.
- Decision:
  - Treat Step 39 as the canonical post-Step38 remaining-route planning archive.
  - Keep Step 39 documentation-only.
  - Do not execute Step 36Fix-Sync, production deploy / acceptance, smoke-account disable, synthetic achievement cleanup, root lint cleanup, migration, seed, or any remaining Phase 2 feature route in Step 39.
  - Classify the remaining work into:
    - Production / deploy / acceptance.
    - Synthetic data / smoke-account cleanup.
    - Root lint unrelated cleanup.
    - Remaining Phase 2 feature routes.
    - High-risk routes requiring explicit authorization.
  - Preserve Step 38 as local implementation / local verification only.
  - Preserve P-001 / P-002 / P-003 as smoke accounts, not real business users.
  - Preserve `[SYNTHETIC-PROD-ROLE-ACCEPTANCE]` as synthetic production data, not real business data.
- Rationale:
  - The memory-bank state is consistent: Step 38-Closure, D094, D093, D092, and D091 agree on completed scope and deferred items.
  - Production deployment and production writes require explicit user authorization and fresh evidence.
  - Smoke-account cleanup and synthetic-data cleanup are production writes and should not be mixed with deployment, migration, seed, or feature implementation.
  - Root lint inherited failures are local quality-gate cleanup items and must not be reclassified as Step 38 failure.
  - Remaining Phase 2 routes are feature/product work and should be implemented as separate, locally verifiable steps before any production acceptance.
- Consequences:
  - Phase 2 remains incomplete after Step 39.
  - The recommended route is:
    - Dedicated local root-lint cleanup first if deploy gates require root lint.
    - Separately authorized production deploy / acceptance for accumulated local changes.
    - Separately authorized smoke-account and synthetic-data cleanup after production baseline is clear.
    - Then separate local implementation steps for remaining Phase 2 routes.
  - Future steps must not treat local Step 37 / Step 38 validation as production acceptance.
  - Future steps must not combine production writes with unrelated local feature implementation.
- Rollback / correction path:
  - If a later review finds missing deferred items, append a Step 39 correction archive rather than editing Step 36 / Step 37 / Step 38 completion evidence retroactively.
  - If production action is requested, open a separately authorized production step with explicit scope, risk, evidence, and rollback notes.

## D094 - Step 38 final closure is local-only with production and cleanup deferred

- Date: 2026-06-25.
- Context: Step 38 implemented local backend business write path ACTIVE department guard hardening and was recorded in D093. A follow-up completion verification confirmed the Step 38 archive, code guard locations, and local quality gates, with result `PASS_WITH_KNOWN_UNRELATED_ROOT_LINT_FAILURES`. There was numbering ambiguity around a Step 38A readiness prompt and later Step numbering; this decision closes Step 38 without starting Step 39.
- Decision:
  - Record `Step 38 closure: CLOSED_LOCALLY_WITH_PRODUCTION_AND_CLEANUP_DEFERRED`.
  - Treat Step 38 as locally implemented and locally verified.
  - Treat the earlier Step 38A readiness prompt as superseded and not to be executed.
  - Keep D093 as the canonical implementation decision for Step 38.
  - Keep this closure as Step 38 final closure archive, not Step 39 and not a new Phase 2 planning step.
  - Do not generate a Step 39 prompt in this closure.
- Rationale:
  - The Step 38 memory-bank archive, D093, and completion verification are consistent.
  - Local verification is sufficient for local closure.
  - Root lint failures remain inherited unrelated issues and do not invalidate Step 38 local hardening.
  - Step 38 did not require schema, migration, or seed changes.
- Consequences:
  - Step 38 is closed locally.
  - Step 38 is not production deployed or production accepted.
  - Phase 2 is not complete.
  - Future work must not treat the superseded Step 38A readiness prompt as pending required execution.
- Deferred items:
  - Production deploy / acceptance.
  - Step 36Fix-Sync.
  - P-001 / P-002 / P-003 smoke-account disable.
  - `[SYNTHETIC-PROD-ROLE-ACCEPTANCE]` archive / cleanup.
  - Root lint unrelated cleanup.
  - Broader Phase 2 routes.

## D093 - Step 38 hardens business write paths against ARCHIVED departments locally

- Date: 2026-06-25.
- Context: Step 37 introduced Department soft disable through ACTIVE / ARCHIVED without physical delete, cascade disable, or department scope expansion. Step 37 explicitly deferred business write path ACTIVE department guard hardening. Step 38 audited and hardened local backend write paths that create achievement drafts, submit achievements into workflow review, assign workflow reviewers/tasks, and create fee records.
- Decision:
  - Close Step 38 as `DONE_WITH_UNRELATED_VALIDATION_FAILURES: Step 38 business write path ACTIVE department guard hardening implemented locally, with root lint still failing only on inherited unrelated items.`
  - Keep the change local-backend scoped.
  - Do not change schema, migrations, seed, department hierarchy semantics, or exact `departmentId` authorization scope.
  - Block new business writes, submission, workflow assignment, and fee creation when the target department is ARCHIVED or unavailable.
  - Do not block historical read/list/detail access to existing achievements or fees.
  - Leave account-management unchanged because the backend already validates ACTIVE departments for create user, department change, and DEPARTMENT role scope assignment.
- Rationale:
  - Service/write-orchestration guards stop unsafe writes regardless of frontend selector state.
  - Workflow submit preparation is the correct boundary for review assignment because it runs before achievement state transition and before workflow task creation.
  - Fee creation derives `departmentId` from the related achievement, so the achievement parent read must carry Department status facts before writing the fee record.
  - Preserving exact `departmentId` scope avoids expanding Step 37 hierarchy semantics.
  - Avoiding schema/migration keeps this Step within the requested local hardening boundary.
- Validation:
  - Targeted achievements, workflow, fees, and account-management tests passed.
  - API full test suite passed: 64 files / 558 tests.
  - API typecheck and build passed.
  - Scoped eslint on touched Step 38 API files passed.
  - Root lint still fails only on inherited unrelated account-management/web/seed-foundation issues recorded in Step 37G.
- Consequences:
  - ARCHIVED departments cannot receive new achievement draft writes from users still bound to that department.
  - Achievements already tied to ARCHIVED departments cannot be submitted into department review.
  - Workflow review tasks are not created for ARCHIVED target departments.
  - Fee records cannot be newly created for achievements whose department is ARCHIVED.
  - Historical data remains readable according to existing authorization policies.
- Deferred items:
  - Production deploy and production acceptance.
  - Step 36Fix-Sync.
  - P-001 / P-002 / P-003 smoke-account disable.
  - Synthetic achievement archive / cleanup.
  - Root lint unrelated cleanup.
  - Broader Phase 2 routes such as attachments, settings/config CRUD, monitoring/backup, and real data import readiness.
- Rollback / correction path:
  - If local regressions appear, revert or patch only the Step 38 API hardening files and rerun targeted achievements/workflow/fees tests plus API typecheck.
  - If production acceptance is needed, open a separately authorized deploy/acceptance step and do not reuse this local evidence as production proof.

## D091 - Step 36 closes the user / role / department / permission chain with deferred cleanup and later Phase 2 routes

- Date: 2026-06-25.
- Context: Step 36 was the first Phase 2 business-foundation chain after Phase 1 production cutover was closed as `PHASE_1_PRODUCTION_CUTOVER_GO_WITH_DEFERRED_ITEMS`. It planned and implemented real production account-management foundations, role/department/permission boundaries, local account-management UI, production smoke account creation, and minimum researcher / secretary / auditor role acceptance. Step 36Fix then tightened role-based frontend UI entries locally after production smoke revealed over-visible UI actions.
- Decision:
  - Mark Step 36K-Archive as DONE for `Step 36 memory-bank closure for user / role / department / permission chain`.
  - Set Step 36 final status to `DONE_WITH_DEFERRED_ITEMS: Step 36 user / role / department / permission chain completed with documented boundaries.`
  - Treat Step 36 as a Phase 2 business-foundation chain, not as all of Phase 2.
  - Accept account-management backend/API and frontend UI as implemented locally and manually smoke-accepted for production account creation.
  - Accept admin / researcher / secretary / auditor minimum core role-chain production smoke as manually verified by user-provided redacted UI evidence.
  - Accept Step 36Fix as local UI permission-entry tightening only until separately synced/deployed.
  - Keep `[SYNTHETIC-PROD-ROLE-ACCEPTANCE]` and P-001 / P-002 / P-003 as synthetic/smoke artifacts, not real business data or real business users.
  - Defer synthetic achievement cleanup and smoke-account disable to a separate cleanup step.
- Rationale:
  - Backend account-management now covers the minimum operational account lifecycle needed for Phase 2 role acceptance: list, detail, create, disable, enable, role assignment/revoke, and department binding.
  - `CREATE + USER` and `UPDATE + USER` audit semantics avoided an unnecessary schema/migration expansion while preserving account-management audit traceability.
  - Production smoke acceptance verified the core business-role chain with real session auth and manually created smoke accounts, while avoiding credential exposure to Codex.
  - Step 36Fix addressed frontend over-visible write/action entries using existing permission codes rather than role-name checks or invented permissions.
  - The explicit deferred list avoids overclaiming incomplete Phase 2 capabilities.
- Consequences:
  - Future work must not use admin as a substitute for researcher / secretary / auditor acceptance.
  - `X-Demo-User-Id` and demo user switcher must not be restored as production auth.
  - Synthetic production data must remain marked and must not be treated as real business data.
  - P-001 / P-002 / P-003 must not be treated as real business users or long-term accounts.
  - Production UI should not be considered tightened by Step 36Fix until the local changes are committed, pushed, deployed, and verified.
  - Phase 2 should continue through explicit follow-up steps for cleanup, department maintenance, approval closure, fee write/payment-state, attachments, settings/config, monitoring/backup, and real data import readiness.
- Deferred items:
  - Step 36Fix sync / deploy if not yet completed.
  - Synthetic production achievement archive/retain/mark decision.
  - P-001 / P-002 / P-003 smoke-account disable.
  - Password reset / invite.
  - Department CRUD.
  - Real business user batch creation.
  - Full approval archive closure.
  - Fee write / payment-state acceptance.
  - Attachment upload / download / storage boundary.
  - Settings/config CRUD.
  - Monitoring / backup hardening.
  - Real business data import readiness.
- Rollback / correction path:
  - If production role smoke regressions appear, open a dedicated Step 36 production role-acceptance fix or production incident step.
  - If Step 36Fix has not been deployed, use a dedicated sync/deploy step; do not rewrite the local acceptance evidence.
  - If synthetic data or smoke accounts need cleanup, use a separate synthetic production data and smoke-account cleanup step with explicit user authorization.

## D092 - Step 37 closes department maintenance backend / UI locally with deferred production and hardening items

- Date: 2026-06-25.
- Context: Step 37 continued Phase 2 after Step 36 closed the user / role / department / permission chain with deferred items. Step 36 provided department binding but not Department CRUD. Step 37A audited Department maintenance readiness, Step 37B planned the backend API, Step 37C implemented the backend locally, Step 37E implemented the frontend locally, Step 37E-Followup linked AccountManagement to ACTIVE department selectors, and Step 37F completed local frontend/backend integrated acceptance. Root lint still has inherited unrelated failures.
- Decision:
  - Close Step 37 as `DONE_WITH_UNRELATED_VALIDATION_FAILURES: Step 37 department maintenance backend / UI locally implemented, locally accepted, and archived with production/deploy and unrelated lint items deferred.`
  - Treat Department maintenance backend / UI as locally implemented and locally accepted, not production deployed or production accepted.
  - Keep Step 37 within Phase 2 continuation; it does not complete Phase 2 overall.
  - Do not require schema or migration for Step 37.
  - Keep department authorization scope as exact `departmentId`; `parentId` hierarchy does not expand scope to child departments.
  - Treat department disable as soft disable / archival state, not physical delete.
  - Do not cascade disable to child departments, users, achievements, workflow tasks, fees, or audit records.
  - Block department disable when active users, active department role scopes, or pending workflow tasks exist.
  - Retain historical achievements, fee records, approvals, and audit records when a department is disabled.
  - Use ACTIVE department selectors in AccountManagement for create user, department change, and department-scoped role assignment.
  - Defer production deploy, production acceptance, business write path ACTIVE department guard hardening, Step 36Fix-Sync, smoke-account cleanup, synthetic data cleanup, and unrelated root lint fixes.
- Rationale:
  - Existing Department schema already supports the Step 37 local maintenance surface without a schema/migration expansion.
  - Reusing `system:config` aligns Department maintenance with administrative account-management boundaries.
  - Reusing CONFIG_UPDATE / SYSTEM_CONFIG audit semantics preserves traceability without adding new enum migrations.
  - Exact `departmentId` scope avoids surprising access expansion from hierarchy and matches Step 36 authorization boundaries.
  - Soft disable protects historical business records while blocking unsafe new bindings or scoped operations through frontend selectors and disable rules.
  - Separating production deploy/acceptance and business write path hardening avoids overclaiming local evidence as production evidence.
- Consequences:
  - Future work must not represent Step 37 as production Department maintenance acceptance until a separately authorized production step deploys and verifies it.
  - Business write paths that create achievements, workflow assignments, fees, or other department-bound data still need a separate ACTIVE department guard hardening step.
  - AccountManagement department selector linkage should be described as account binding support, not Department CRUD.
  - Parent department hierarchy is organization metadata only unless a future step explicitly designs, tests, and accepts parent-includes-child scope semantics.
  - Root lint unrelated failures remain outside Step 37 and should be fixed in a dedicated cleanup step if desired.
- Deferred items:
  - Production deploy and production Department maintenance acceptance.
  - Business write path ACTIVE department guard hardening.
  - Step 36Fix-Sync if local UI tightening still needs commit / push / deploy / verification.
  - P-001 / P-002 / P-003 smoke-account disable.
  - `[SYNTHETIC-PROD-ROLE-ACCEPTANCE]` archive / cleanup.
  - Root lint unrelated failures.
  - Remaining Phase 2 routes such as fee write/payment-state, attachments, settings/config CRUD, monitoring/backup, and real data import readiness.
- Rollback / correction path:
  - If local department-management regressions are found, open a focused Step 37 fix with targeted backend/frontend tests before production deployment.
  - If production acceptance is required, open a separate production deploy / acceptance step with explicit authorization and fresh production boundaries.
  - If hierarchy-based authorization is later required, open a separate schema/rule/test planning step instead of changing the Step 37 exact-scope decision retroactively.
  - If root lint cleanup is required, fix the inherited lint failures in a separate cleanup step and do not rewrite Step 37 acceptance evidence.

## D090 - Step 34 closes Phase 1 as production cutover GO with deferred items

- Date: 2026-06-24.
- Context: Step 34 / Prompt 26 moved Phase 1 from demo/staging deployment to a single-VPS production cutover on `production.wangyimin.cn`. The work included production auth hardening, production config fail-fast, production Docker deployment, migration, foundation seed, bootstrap admin, Nginx reverse proxy, GET-only smoke, minimal synthetic write acceptance, and final browser verification.
- Decision:
  - Mark Step 34F-Q2 as DONE for `Phase 1 production cutover final checklist and closure`.
  - Set final status to `PHASE_1_PRODUCTION_CUTOVER_GO_WITH_DEFERRED_ITEMS`.
  - Treat `production.wangyimin.cn` as the Phase 1 production entry.
  - Treat production auth as session-based local account auth, not demo header auth.
  - Keep bootstrap closed after first admin initialization.
  - Treat foundation seed as production foundation data only, not business data.
  - Accept minimal synthetic achievement draft create/update as the only production write acceptance completed in Phase 1.
  - Carry complete approval, real production users, fees write, attachments, real data import, settings/config CRUD, department maintenance, monitoring, and backup automation into Phase 2 or later confirmed steps.
- Rationale:
  - The production cutover core chain is verified: HTTPS/Web/API access, frontend assets, production auth, Docker/Nginx/DB health, migrations, foundation seed, GET-only smoke, and minimal synthetic create/update all passed.
  - The remaining work is real business expansion and operational hardening beyond the minimum Phase 1 production cutover acceptance.
  - Labeling the result as GO_WITH_DEFERRED_ITEMS avoids overclaiming Phase 2 capability completion.
- Consequences:
  - Future planning should continue from Step 35A - Phase 2 scope confirmation.
  - Step 34 should not be reopened unless there is a production incident, rollback need, security issue, or explicit user request.
  - Production evidence must remain separated from old demo/staging evidence.
  - `X-Demo-User-Id` must not be reintroduced as production auth.
  - Synthetic data must remain clearly marked and must not be represented as real business data.
- Rollback / correction path:
  - If a production cutover regression is found, open a dedicated production incident or hotfix step rather than rewriting Step 34 completion.
  - If a deferred feature becomes required for launch acceptance, scope it as a Phase 2 or post-cutover acceptance step with separate evidence.

## D089 - Step 23A aligns frontend search targetTypes with the backend array query contract

- Date: 2026-06-21.
- Context: Step 23 plan confirmation selected the array `targetTypes` / API client array query technical debt route. The backend `GET /search` DTO already treats `targetTypes` as an array, while the frontend search contract and `api-client` query serializer still modeled query values as scalar-only. Step 23A needed to close that local contract mismatch without entering live backend smoke, backend semantic changes, `search_logs`, Meilisearch, writes, or data setup.
- Decision:
  - Extend the web API client query model to support scalar string/number/boolean values, readonly arrays of those scalars, null, and undefined.
  - Serialize array values as repeated query parameters.
  - Preserve existing scalar query serialization behavior.
  - Omit undefined, null, empty string, and empty array values.
  - Change frontend `SearchQuery.targetTypes` from a single value to a readonly array.
  - Keep the current UI single-target filter for Step 23A, shaping it into a one-item `targetTypes` array.
  - Allow explicit multi-target arrays in search request shaping so later UI/request boundary work can use the backend array contract without changing the API client again.
  - Do not change backend source, backend search semantics, Prisma schema, migrations, seeds, data, `search_logs`, Meilisearch/external sync, settings/config, warnings, attachments, or fee writes.
- Rationale:
  - The backend contract already accepts array `targetTypes`; aligning the frontend client is a local, testable technical debt fix.
  - Repeated query parameters match the backend DTO behavior and avoid inventing a comma-separated convention.
  - Keeping UI expansion out of Step 23A keeps this step small and leaves browser/request boundary validation to Step 23B.
- Consequences:
  - Step 23A should be evaluated as a frontend contract and serialization foundation, not as a new search feature or backend search rewrite.
  - Step 23B must run full gates and request/browser boundary acceptance.
  - Future multi-select UI, search logging, Meilisearch/external sync, live smoke, and any write/data setup work require separate confirmation.

## D088 - Step 21A implements only attachment detail metadata readonly frontend foundation

- Date: 2026-06-21.
- Context: Step 21 plan confirmation accepted `attachment detail metadata readonly frontend closure` as the next phase-one direction. Step 19A already exposed attachment metadata list display over `GET /achievements/:achievementId/attachments`, while the backend already had a readonly detail metadata contract at `GET /achievements/:achievementId/attachments/:attachmentId`. Step 21A needed to close the frontend foundation without entering upload/download/object-storage or fee voucher attachment work.
- Decision:
  - Step 21A adds only a frontend readonly attachment detail metadata view.
  - Reuse existing `GET /achievements/:achievementId/attachments/:attachmentId`.
  - Trigger detail metadata loading only after the user explicitly selects an attachment from the metadata list.
  - Require demo user, achievement ID, and attachment ID before loading detail metadata.
  - Display only safe metadata fields: id, fileName, relationType, relationId, version, uploaderId, secretLevel, status, createdAt, updatedAt, and archivedAt.
  - Map 401/403/404/400/422/500/network failures to attachment-detail-specific user-facing copy.
  - Do not call or implement `GET /achievements/:achievementId/attachments/:attachmentId/download`.
  - Do not add upload, download, delete, archive action, version-change, object-storage, fee voucher attachment, warnings API, `search_logs`, Meilisearch/external sync, settings/config, Step 14 DataGap, Step 15 real fee write, seed, migrate, data backfill, or data cleanup.
- Rationale:
  - Attachment detail metadata is a clear remaining phase-one gap with an existing GET-only backend contract.
  - Keeping detail metadata user-triggered prevents background fan-out and keeps no-demo-user no-request behavior explicit.
  - Avoiding download and object-storage paths prevents download audit writes, storage reads, and data-retention concerns from being mixed into a readonly frontend step.
- Consequences:
  - Step 21A should be judged as a frontend readonly detail metadata foundation, not as complete attachment management.
  - Step 21B must separately perform browser/API boundary acceptance.
  - Future upload/download/object storage, fee voucher attachments, live backend attachment smoke, real writes, data setup, or cleanup require separate confirmation.

## D087 - Step 20B implements only a system configuration boundary and readonly capability inventory

- Date: 2026-06-21.
- Context: Step 20A confirmed that `settings` was the remaining main-navigation BoundaryPage gap, while no backend `settings/config` readonly contract was found. Phase-one scope includes role permissions, departments, dictionaries, reminder rules, and interface adapters, but those areas require separate contracts before any real configuration management can be claimed.
- Decision:
  - Step 20B adds only a frontend system configuration boundary / readonly capability inventory page.
  - Connect the `settings` navigation item to the dedicated page instead of the generic BoundaryPage.
  - Display the five phase-one configuration areas: role permissions, departments, dictionaries, reminder rules, and interface adapters.
  - State that `system:config` is only a permission-code signal or future boundary cue, not a completed `settings/config` API.
  - Do not call any business API from the settings boundary page.
  - Do not provide create, edit, delete, save, sync, import, export, or download entry points.
  - Do not implement settings/config backend controllers, configuration CRUD, schema, migration, seed, permission seed, real SSO, external interfaces, object storage, Meilisearch, attachment upload/download/detail, fee voucher attachments, warnings API, `search_logs`, Step 14 DataGap, Step 15 real fee writes, seed/migrate, data backfill, or data cleanup.
- Rationale:
  - A dedicated boundary page closes the main-navigation placeholder without pretending that configuration management exists.
  - Keeping the page API-free avoids reading environment configuration or exposing secrets while still documenting the phase-one configuration surface.
  - Real configuration management touches permissions, audit, external adapters, and operational data, so it must remain a separate confirmed route.
- Consequences:
  - Step 20B should be judged as a frontend-only settings boundary closure, not as settings/config implementation.
  - Step 20C can separately run final gates and archive Step 20.
  - Future real configuration API or CRUD work requires separate confirmation and likely a higher task classification.

## D086 - Step 19 archives achievement attachment metadata readonly frontend closure

- Date: 2026-06-21.
- Context: Step 19 plan confirmation selected achievement attachment metadata readonly as the next phase-one closure direction, and Step 19A completed the frontend metadata section plus clean browser recheck. The archive needed to close Step 19 without turning it into complete attachment management or mixing in higher-risk write/storage/data routes.
- Decision:
  - Archive Step 19 as `DONE`.
  - Treat Step 19 as achievement attachment metadata readonly frontend closure.
  - Completed Step 19 scope is limited to the Step 19A frontend metadata foundation inside achievement detail.
  - Reuse only the existing attachment list contract, `GET /achievements/:achievementId/attachments?take=50`.
  - Reuse Step 19A gate evidence and supplemental clean browser acceptance instead of rerunning gates during archive.
  - Do not expand Step 19 into upload, download, attachment detail, delete, archive, version change, object storage, fee voucher attachment, settings, Step 14 DataGap, Step 15 real fee write, warnings API, `search_logs`, Meilisearch/external sync, array `targetTypes`/API client query expansion, seed, migrate, data backfill, or data cleanup.
- Rationale:
  - Step 19A already passed web tests, typecheck, build, root lint, and clean browser/API boundary checks.
  - The archive pass is documentation-only, so rerunning quality gates would not add meaningful evidence.
  - Keeping the archive metadata-only preserves the low-risk phase-one boundary and prevents attachment write/storage concerns from being implied as complete.
- Consequences:
  - Step 19 should be referenced as achievement attachment metadata readonly frontend closure, not as complete attachment management.
  - Future live backend/database attachment smoke, upload/download/detail, object storage, fee voucher attachment, settings, real writes, data setup, or cleanup require separate confirmation.
  - The next action returns to Prompt orchestration; no Step 19B or Step 19C starts automatically.

## D085 - Step 19A implements only achievement attachment metadata readonly frontend foundation

- Date: 2026-06-21.
- Context: Step 19 plan confirmation selected achievement attachment metadata readonly as the next low-risk phase-one closure candidate. The backend already exposed attachment list/detail/download/upload routes, but Step 19A needed to avoid upload/download/detail/object-storage and fee-voucher expansion while giving achievement detail a real metadata-only frontend loop.
- Decision:
  - Step 19A adds only a frontend readonly attachment metadata section inside achievement detail.
  - Reuse existing `GET /achievements/:achievementId/attachments`.
  - Default frontend metadata list loading uses `take=50`.
  - Pass `demoUserId` into management, search, and approval achievement detail contexts so no-demo-user no-request behavior is enforced before attachment metadata loading.
  - Display only safe metadata fields: `id`, `fileName`, `version`, `uploaderId`, `relationId`, `secretLevel`, `status`, `createdAt`, `updatedAt`, and `archivedAt`.
  - Map attachment metadata 401/403/404/400/422/500/network failures to attachment-specific user-facing copy.
  - Do not call or implement `POST /achievements/:id/attachments`.
  - Do not call or implement `GET /achievements/:id/attachments/:attachmentId/download`.
  - Do not add attachment detail GET, upload, download, delete, archive, version-change, object-storage, fee voucher attachment, settings, Step 14 DataGap, Step 15 real fee write, warnings API, `search_logs`, Meilisearch/external sync, array `targetTypes`/API-client query expansion, seed, migrate, data backfill, or data cleanup.
- Rationale:
  - Attachment metadata is a phase-one scope gap with an existing backend readonly contract, so it can improve the achievement detail loop without entering write or storage risk.
  - Keeping Step 19A metadata-only avoids confusing voucher numbers with real fee attachment lifecycle and avoids expanding into object storage.
  - Avoiding attachment detail/download prevents download audit writes and storage reads from being mixed into a frontend foundation step.
- Consequences:
  - Step 19A should be judged as an achievement attachment metadata readonly frontend foundation, not a complete attachment management capability.
  - Future attachment upload/download/detail, real object storage, fee voucher attachment, live backend attachment smoke, settings, real writes, data setup, or data cleanup require separate confirmation.

## D084 - Step 18 archives masked readonly audit-log closure without expanding into full audit platform

- Date: 2026-06-21.
- Context: Step 18A completed the backend masked readonly `GET /audit-logs` API and Step 18B completed the frontend `AuditLogs` masked readonly page. Step 18C needed to archive the overall Step 18 route without mixing in export, unmasked review, analytics, settings, attachments, or write validation.
- Decision:
  - Archive Step 18 as `DONE_WITH_MOCK_BROWSER_RISK`.
  - Treat Step 18 as a masked readonly audit-log closure.
  - The completed Step 18 scope is:
    - backend `GET /audit-logs`;
    - backend `audit:read_masked` authorization;
    - backend `AuditService.listMasked(context, query)` reuse;
    - frontend `AuditLogs` page connected from the `audit` navigation entry;
    - frontend readonly filters for `action`, `targetType`, `targetId`, `actorUserId`, `traceId`, and `take`;
    - no-demo-user no-request behavior;
    - masked-only display and raw audit-field ignore behavior.
  - Reuse Step 18A and Step 18B gate evidence instead of rerunning full gates in Step 18C because Step 18C is documentation-only.
  - Record the Step 18B browser mock risk rather than blocking archive.
  - Do not delete or clean `apps/api/dist/**`, `apps/web/dist/**`, `.playwright-cli/**`, or prior backend dev log append output during archive.
  - Do not expand Step 18 into export, download, raw JSON copy, unmasked audit read, audit analytics, settings, attachments, real fee write, Step 14 DataGap, warnings API, search log write, Meilisearch/external sync, seed, migrate, data backfill, or data cleanup.
- Rationale:
  - Backend tests already verify the live API contract, authorization, validation, and masked response shape.
  - Frontend tests and browser acceptance already verify request shape, page states, no-user no-request behavior, masked display, and responsive behavior.
  - The only remaining evidence gap is live browser success/403 over a real database dataset, which is useful but not necessary for archiving the masked readonly closure.
  - Keeping Step 18C documentation-only prevents unrelated high-risk routes from being mixed into a completed audit-log closure.
- Consequences:
  - Step 18 should be referenced as a masked readonly audit-log closure, not as a complete audit platform.
  - Future live readonly smoke can be planned separately and limited to `GET /api/health` and `GET /api/audit-logs?take=50`.
  - Future export/download, unmasked review, advanced filters, audit analytics, system configuration, attachments, real fee write validation, Step 14 DataGap closure, seed/migrate, and data cleanup require separate confirmation.

## D083 - Step 18B implements frontend masked readonly audit-log page over existing GET-only API

- Date: 2026-06-21.
- Context: Step 18A exposed the backend masked readonly `GET /audit-logs` API, while `apps/web/src/App.tsx` still routed `audit` to a boundary page. Step 18B needed to close the phase-one frontend loop without widening backend contracts or audit semantics.
- Decision:
  - Step 18B adds only a frontend masked readonly audit-log page.
  - Reuse existing `GET /audit-logs`.
  - Connect `activeKey === "audit"` to the new `AuditLogs` page.
  - Support first frontend filters: `action`, `targetType`, `targetId`, `actorUserId`, `traceId`, and `take`.
  - Validate `targetId` and `actorUserId` as UUIDs, traceId as at most 120 characters, and `take` as 1..100 before sending requests.
  - Keep no-demo-user behavior request-free.
  - Render only masked fields and safe summary fields.
  - Ignore raw `oldValue`, `newValue`, `ipAddress`, and `userAgent` even if malformed responses contain them.
  - Do not add backend changes, unmasked audit read, export, download, raw JSON copy, write routes, settings, attachment work, Step 14 DataGap, Step 15 real writes, seed, migrate, data backfill, or data cleanup.
- Rationale:
  - The backend is already the source of truth for `audit:read_masked` permission and redaction.
  - A frontend-only page completes the phase-one audit viewing loop with low data-change risk.
  - Keeping department/date filters out of the first page pass reduces UI complexity while preserving the backend API contract for later expansion.
  - Defensive frontend formatting reduces accidental plaintext display risk from malformed masked payloads without changing backend semantics.
- Consequences:
  - Step 18B should be judged as a masked readonly frontend closure, not a complete audit platform.
  - Future unmasked audit review, export/download, advanced audit filters, audit analytics, settings, attachments, and real write validation remain separate confirmed routes.
  - Step 18C or later work must be generated by Prompt orchestration; do not continue automatically.

## D082 - Step 18A exposes only masked readonly audit-log API

- Date: 2026-06-21.
- Context: Step 18 plan confirmation selected the audit-log route because phase-one scope includes operation audit, the frontend audit page remained a boundary page, and the backend audit core already had repository/service/policy/redactor support but no public `GET /audit-logs` controller.
- Decision:
  - Step 18A adds only the backend masked readonly audit-log API contract.
  - Expose `GET /audit-logs` through an `AuditController`.
  - Reuse existing `AuditService.listMasked(context, query)`.
  - Require `UserContextGuard`, `PermissionGuard`, `@CurrentUser()`, and static `audit:read_masked` permission.
  - Support first-pass readonly filters: `actorUserId`, `actorDepartmentId`, `action`, `targetType`, `targetId`, `targetDepartmentId`, `traceId`, `createdFrom`, `createdTo`, and `take`.
  - Validate HTTP query input before service calls; `take` is constrained to 1..100 and date filters must be valid ISO date strings.
  - Return only masked audit list fields and never expose raw `oldValue`, `newValue`, `ipAddress`, or `userAgent`.
  - Do not add unmasked audit read, export, download, write routes, frontend audit page, settings, attachment work, Step 14 DataGap, Step 15 real writes, seed, migrate, data backfill, or data cleanup.
- Rationale:
  - The backend already centralizes masked read authorization and redaction, so a narrow controller can expose the phase-one audit read capability without changing audit semantics.
  - A dedicated route avoids relying on transitive `AuditModule` imports from write-capable modules.
  - Query validation keeps the public API contract explicit and prevents arbitrary repository input.
- Consequences:
  - Step 18B can separately build the frontend audit-log page over `GET /audit-logs`.
  - Future unmasked audit review, export/download, advanced audit analytics, and configuration audit UI require separate confirmation.
  - Step 18A should be judged as a backend readonly API contract, not a complete audit platform.

## D081 - Step 17 archives readonly dashboard frontend completion

- Date: 2026-06-21.
- Context: Step 17A completed the readonly dashboard summary foundation and Step 17B completed existing summary bucket display plus the constrained 7 / 30 / 90 due-soon window. Step 17C needed to close the overall Step 17 route without adding new dashboard functionality or widening backend/API scope.
- Decision:
  - Step 17 is archived as readonly dashboard frontend completion.
  - The archived dashboard uses only existing `GET /dashboard/summary`.
  - The archived dashboard keeps no-demo-user no-request behavior.
  - The default dashboard query remains `dueSoonDays=30`.
  - The only exposed due-soon windows are 7 / 30 / 90 days; unsupported values normalize to 30 and `today` is not exposed.
  - The archived dashboard displays basic summary metrics, `generatedAt`, `scope.userId`, `scope.departmentId`, and five existing summary bucket groups:
    - achievement type.
    - achievement status.
    - fee pay status.
    - workflow task status.
    - reminder task status.
  - Empty buckets keep an explicit empty state, and unknown bucket keys fall back to raw key display.
  - Step 17 does not include backend expansion, new endpoints, write interfaces, `today` custom input, audit-log/settings pages, annual trends, department ranking, amount summaries, patent legal-status statistics, drilldowns, exports, cache, or a full reporting platform.
- Rationale:
  - The phase-one dashboard now has a complete readonly frontend loop over the existing backend summary endpoint.
  - Final gates and browser/API acceptance confirmed the route stays within dashboard summary GET-only boundaries.
  - Archiving now prevents analytics/reporting expansion from being mixed into the Step 17 frontend closure.
- Consequences:
  - Future dashboard analytics beyond the existing summary endpoint must be separately planned and confirmed.
  - Any backend dashboard contract work, writes, audit logs, settings, real fee writes, attachments, warnings API, `search_logs`, Meilisearch/external search sync, data setup, or reporting-platform feature remains an independent route.
  - Step 17 should be referenced as a readonly dashboard frontend completion, not as full analytics/BI completion.

## D080 - Step 17B keeps dashboard distributions readonly over existing summary buckets

- Date: 2026-06-21.
- Context: Step 17A completed a readonly dashboard summary frontend foundation over existing `GET /dashboard/summary`. Step 17B needed to add useful statistics dimensions and a due-soon window without widening backend contracts or pretending to provide a full reporting platform.
- Decision:
  - Step 17B remains a readonly frontend-only enhancement over existing `GET /dashboard/summary`.
  - The only dashboard request parameter exposed by Step 17B is `dueSoonDays`, constrained to 7 / 30 / 90 with default 30.
  - Unsupported dueSoonDays values are normalized to 30 before request shaping.
  - Step 17B does not expose `today` input.
  - Step 17B renders only existing summary bucket fields:
    - `achievement.byType.value.buckets`.
    - `achievement.byStatus.value.buckets`.
    - `fee.byPayStatus.value.buckets`.
    - `workflowTasks.byStatus.value.buckets`.
    - `reminderTasks.byStatus.value.buckets`.
  - Empty buckets show an explicit empty state, and unknown bucket keys fall back to raw key display.
  - Do not change backend APIs or semantics, add new dashboard endpoints, add writes, add audit-log/settings pages, implement Step 14 DataGap, Step 15 real writes, voucher attachments, independent warnings API, `search_logs`, Meilisearch/external sync, seed/migrate/data backfill/data cleanup, annual trends, department ranking, amount summaries, patent legal-status statistics, drilldowns, exports, cache, or a full reporting platform.
- Rationale:
  - The existing endpoint already returns enough bucket data for a meaningful phase-one dashboard dimension view.
  - Constraining dueSoonDays to three presets avoids arbitrary query values and keeps browser/API acceptance simple.
  - Excluding `today` avoids date-simulation ambiguity and keeps Step 17B focused on real summary display.
  - Showing empty and unknown buckets safely prevents the UI from inventing data or failing on future backend enum additions.
- Consequences:
  - Step 17C can separately archive/finalize Step 17.
  - Expanded analytics such as trends, rankings, financial summaries, legal-status statistics, drilldowns, exports, and caching require a separate confirmed route and likely backend contract work.
  - Step 17B completion should be judged as a readonly summary-bucket dashboard enhancement, not as a complete reporting/BI implementation.

## D079 - Step 17A implements a readonly dashboard summary frontend foundation

- Date: 2026-06-21.
- Context: Step 17 plan confirmation selected the statistics dashboard frontend because phase-one scope includes a basic dashboard, the backend already exposes `GET /dashboard/summary`, and the frontend "统计看板" navigation entry was still a BoundaryPage after Step 16 archived the readonly search center.
- Decision:
  - Step 17A implements only a readonly dashboard summary frontend foundation.
  - The dashboard page reuses existing `GET /dashboard/summary` with default `dueSoonDays=30`.
  - No demo user means no business API request.
  - The page displays only summary fields already returned by the existing endpoint: achievement total, overdue fees, due-soon fees, pending workflow tasks, pending reminders, generated time, user scope, and department scope.
  - The page states that permission cropping is enforced by the backend.
  - Annual trends, department ranking, amount summaries, patent legal-status statistics, dashboard distribution/filtering UX, and final Step 17 archive are left to separately confirmed follow-up work.
  - Do not change backend APIs or semantics, add write behavior, add audit-log/settings pages, implement Step 14 DataGap, Step 15 real writes, voucher attachments, independent warnings API, `search_logs`, Meilisearch/external sync, seed/migrate/data backfill/data cleanup, or API client array query serialization.
- Rationale:
  - Existing backend summary data is sufficient for a safe frontend-only Step 17A foundation.
  - Keeping the page summary-only prevents the UI from fabricating phase-one dashboard metrics that are not yet returned by the backend.
  - The no-user no-request behavior matches prior frontend safety boundaries from workbench and search.
- Consequences:
  - Step 17B can separately add distribution display and any confirmed filtering/slicing experience.
  - Any annual trends, department ranking, amount summaries, patent legal-status statistics, or expanded dashboard endpoint work must be planned as a separate route.
  - Step 17A completion is a readonly dashboard summary frontend foundation, not a full analytics/reporting implementation.

## D078 - Step 16 archives readonly search center frontend completion

- Date: 2026-06-21.
- Context: Step 16A completed the readonly search center foundation, Step 16B added advanced filters and result grouping, Step 16C added ACHIEVEMENT readonly detail linking, and Step 16D added FEE_RECORD readonly-only fee detail linking. Final archive needed to close Step 16 without widening backend, write, logging, external search, or data routes.
- Decision:
  - Step 16 is archived as DONE for the readonly search center frontend.
  - The archived capability includes readonly `GET /search`, keyword search, single-value `targetTypes`, supported advanced filters, department UUID validation, result summary, ACHIEVEMENT / FEE_RECORD grouping, ACHIEVEMENT readonly detail through `GET /achievements/:id`, and FEE_RECORD readonly-only fee detail through `GET /fees/:id`.
  - The search center keeps no-user no-request behavior and preserves backend permission/redaction semantics.
  - Fee search cards remain limited to search-index fields; amount and `voucherNo` may appear only in the readonly fee detail response, with `voucherNo` treated as a voucher number rather than an attachment file.
  - Step 16 archive does not include search_logs, Meilisearch/external search sync, array `targetTypes`, API client array query serialization, backend API or semantic changes, write interfaces, real fee writes, real voucher attachment capability, independent warnings API, Step 14 DataGap, seed/migrate, data backfill, data cleanup, dashboard, audit-log page, or settings implementation.
- Rationale:
  - The frontend search center now provides a complete readonly user loop over existing backend endpoints while keeping every write-adjacent and platform-expansion route explicitly separate.
  - Final gates and browser/API checks confirmed the route stays within GET-only request boundaries.
  - Archiving now prevents further feature creep from being mixed into Step 16.
- Consequences:
  - Future work must be separately planned and confirmed for any write behavior, search logging, external indexing, array query behavior, analytics, dashboard/audit/settings, real voucher attachment lifecycle, warnings API, data setup, or Step 14 DataGap closure.
  - Step 16 should be referenced as a readonly frontend completion, not as full search-platform completion.

## D077 - Step 16D links search fee results to readonly fee detail only

- Date: 2026-06-20.
- Context: Step 16A completed the readonly search center foundation, Step 16B added advanced filters and result grouping, and Step 16C added ACHIEVEMENT readonly detail linking. Fee detail in `Fees.tsx` was write-adjacent because normal fee management can expose mark-paid behavior, so search needed an isolated readonly path.
- Decision:
  - Step 16D implements only FEE_RECORD search-result readonly detail linking.
  - The search fee detail drawer reuses the existing `GET /fees/:id` detail loading path and existing fee detail error/state helpers.
  - Search uses a readonly-only fee detail drawer/mode that suppresses mark-paid, create-fee, voucher attachment upload/download, warnings API, POST, PATCH, and DELETE capabilities.
  - Search fee result cards remain limited to search-index fields and do not show amount, `voucherNo`, upload/download, or attachment capability.
  - The readonly detail drawer may show backend-returned `amount` and `voucherNo`; `voucherNo` is presented only as a voucher number, not as an attachment file.
  - Do not change backend APIs or semantics, add API client array query serialization, write `search_logs`, implement Meilisearch/external search sync, add dashboard/audit/settings work, or mix in Step 14 DataGap, Step 15 real writes, voucher attachments, independent warnings API, seed/migrate, data backfill, or data cleanup.
- Rationale:
  - Fee detail linking completes readonly search-result detail parity while keeping write-adjacent fee management actions isolated from the search center.
  - A readonly-only drawer/mode avoids reusing fee management UI that can expose mark-paid behavior.
  - Keeping fee search cards index-only preserves the Step 16A/16B field boundary while still allowing authorized users to inspect richer readonly detail.
- Consequences:
  - Step 16 can now move to a separate archive plan confirmation.
  - Real fee writes, true voucher attachment lifecycle, warnings API, search logging, external search indexing, array `targetTypes`, analytics, and large-data performance remain independent routes.
  - Search remains a readonly frontend loop over existing backend endpoints.

## D076 - Step 16C links search achievement results to readonly achievement detail only

- Date: 2026-06-20.
- Context: Step 16A completed the readonly search center foundation, and Step 16B added advanced filters plus result grouping while explicitly deferring detail linking. Existing `AchievementDetail.tsx` already exposed `ReadonlyAchievementDetail` and `GET /achievements/:id`, while fee detail remained embedded in `Fees.tsx` with write-adjacent mark-paid UI.
- Decision:
  - Step 16C implements only ACHIEVEMENT search-result readonly detail linking.
  - The search detail drawer reuses existing `ReadonlyAchievementDetail` and existing `GET /achievements/:id`.
  - `ReadonlyAchievementDetail` supports a search readonly context so search-opened detail copy does not mention approval context.
  - Fee detail linking remains deferred to Step 16D or a separately confirmed plan.
  - Search result cards continue to preserve redaction: redacted cards do not fabricate titles or expose identifiers.
  - Do not add write actions, backend APIs, backend semantic changes, API client array query serialization, `search_logs`, Meilisearch/external search sync, dashboard/audit/settings work, Step 14 DataGap, Step 15 real writes, voucher attachments, independent warnings API, seed/migrate, data补录, or data cleanup.
- Rationale:
  - Achievement detail linking can safely reuse an existing readonly component and endpoint with a small frontend integration.
  - Fee detail requires a separate readonly extraction or mode to avoid bringing mark-paid/write-adjacent capability into the search center.
  - Search-context copy prevents users from seeing approval-specific guidance in the search center.
- Consequences:
  - Step 16D can separately plan fee detail linking or Step 16 final archive.
  - Search remains a readonly frontend loop over existing backend endpoints.
  - Full search platform concerns such as logging, external indexing, array `targetTypes`, analytics, and large-data performance remain separate routes.

## D075 - Step 16B keeps search advanced filters readonly and defers detail linking

- Date: 2026-06-20.
- Context: Step 16A completed the readonly search center frontend loop on top of existing `GET /search`. Step 16B needed to strengthen phase-one search filtering and result readability without widening backend, write, logging, or external search scope.
- Decision:
  - Step 16B only adds frontend advanced filters supported by existing `GET /search`: `achievementType`, `achievementStatus`, `feeType`, `payStatus`, `departmentId`, and `take`.
  - `targetTypes` remains single-value (`ACHIEVEMENT` / `FEE_RECORD`) or omitted for all results; Step 16B does not extend array query serialization in the frontend API client.
  - Non-empty `departmentId` must pass frontend UUID validation before requesting `GET /search`; invalid values show a boundary message and do not call the business API.
  - Results show total, achievement count, fee count, redacted achievement count, active filter summary, and clear achievement / fee grouping while preserving redaction and fee-field boundaries.
  - Achievement detail and fee detail linking remain deferred to Step 16C or a separately confirmed plan.
  - Do not change backend search semantics, add backend APIs, write `search_logs`, implement Meilisearch/external search sync, add dashboard/audit/settings work, or mix in Step 14 DataGap, Step 15 real writes, voucher attachments, independent warnings API, seed/migrate, data补录, or data cleanup.
- Rationale:
  - The existing backend contract already supports the required advanced query fields, so frontend-only strengthening closes the next search UX gap with low data risk.
  - Keeping `targetTypes` single-value avoids unrelated API-client serialization changes.
  - Deferring detail linking keeps Step 16B focused on search and avoids accidental cross-feature expansion.
- Consequences:
  - Step 16C can separately confirm detail-entry behavior and any readonly achievement / fee detail integration.
  - Array `targetTypes`, search logs, external search engines, backend search redesign, and operational search analytics remain out of scope for Step 16B.
  - Step 16B completion is judged as an advanced readonly frontend search experience, not a full search-platform implementation.

## D074 - Step 16A search center reuses existing GET /search as a readonly frontend loop

- Date: 2026-06-20.
- Context: Step 16 plan confirmation selected the search center frontend because phase-one scope includes basic full-text search, the backend already exposes `GET /search`, and the frontend `search` navigation entry was still a boundary page after Step 15 closed fee management as `DONE_WITHOUT_REAL_WRITE_RISK`.
- Decision:
  - Step 16A implements only a readonly search center frontend backed by existing `GET /search`.
  - Step 16A supports keyword search, default `take=20`, and a single-value result type filter (`ACHIEVEMENT` or `FEE_RECORD`), or omits `targetTypes` for all results.
  - Step 16A does not extend the frontend API client for array query serialization.
  - Achievement search results must preserve backend redaction: if `redacted=true`, the frontend shows explicit redaction copy and does not fabricate titles or identifiers.
  - Fee search results are limited to backend-returned readonly search fields and must not show or imply amount, `voucherNo`, upload/download, or voucher attachment capability.
  - Do not change backend search semantics, add backend APIs, write `search_logs`, implement Meilisearch/external search sync, add dashboard/audit/settings work, or mix in Step 14 DataGap, Step 15 real writes, voucher attachments, independent warnings API, seed/migrate, data补录, or data cleanup.
- Rationale:
  - Reusing `GET /search` closes the next phase-one frontend gap without widening backend behavior or data risk.
  - Keeping `targetTypes` single-value fits the current `api-client` query contract and avoids unnecessary serialization changes in Step 16A.
  - Explicit redaction and fee-field boundaries prevent the UI from presenting unavailable or unauthorized data as real capability.
- Consequences:
  - Step 16B can separately plan advanced filters, richer result interactions, and any need for array `targetTypes`.
  - Future search logging, external search engine sync, large data performance, dashboard, audit logs, and settings remain separate planned routes.
  - Step 16A completion must be judged as a readonly frontend loop, not as full search-platform completion.

## D073 - Step 15D closes voucher attachment boundary and archives Step 15 without real writes

- Date: 2026-06-20.
- Context: Step 15A delivered the fee ledger, Step 15B delivered readonly fee detail and frontend-derived warning groups, and Step 15C delivered fee-create / mark-paid frontend entries without real local data writes. Step 15D needed to close the voucher attachment boundary and archive Step 15.
- Decision:
  - Step 15D only clarifies voucher attachment boundaries and archives Step 15.
  - `voucherNo` is treated as a voucher number field and must not be presented as uploaded/downloadable voucher attachment capability.
  - Step 15D does not implement real fee voucher attachment upload/download, generated download links, attachment API reuse, backend API changes, schema/migration/seed/dependency changes, or `GET /fees/warnings`.
  - Step 15D does not perform real `POST /fees` or `POST /fees/:id/mark-paid`.
  - Step 14 DataGap remains outside Step 15D.
  - Step 15 overall is archived as `DONE_WITHOUT_REAL_WRITE_RISK`.
- Rationale:
  - The fee frontend loop is usable and clearly bounded, while persisted write acceptance and true voucher attachment capability still need explicit data/API route confirmation.
  - Avoiding fake attachment wording prevents users from mistaking `voucherNo` for a real file lifecycle.
  - Keeping Step 14 DataGap separate avoids mixing workflow acceptance data setup into fee-management closure.
- Consequences:
  - Future real-write acceptance must separately confirm demo user, target achievement / fee data, allowed writes, and data-retention/cleanup policy.
  - Future fee voucher attachment work must separately confirm API contract, authorization, storage route, audit behavior, upload/download UX, and data safety.
  - Step 15 should not be reopened for write or attachment implementation without a new explicit user-confirmed route.

## D072 - Step 15C fee write entries are frontend-only and do not perform real local data writes

- Date: 2026-06-20.
- Context: Step 15C needed to add fee creation and mark-paid frontend entries after Step 15A readonly ledger and Step 15B readonly detail / warning groups. The user confirmed this execution step must not write local demo business data.
- Decision:
  - Step 15C reuses existing `POST /fees` and `POST /fees/:id/mark-paid` contracts only through frontend helpers and fake-client tests.
  - This step does not perform real local business data writes.
  - Browser acceptance is limited to opening forms, filling fields, checking boundary copy, closing/canceling, and responsive layout.
  - Browser acceptance must not click final create or mark-paid submit buttons.
  - Write success behavior is verified only with fake frontend clients that simulate successful responses and refreshed `GET /fees` / `GET /fees/:id` reads.
  - Do not add backend APIs, do not implement voucher attachment upload/download, do not add or pretend to call `GET /fees/warnings`, and do not mix in Step 14 DataGap, seed, migrate, data setup, data cleanup, or rollback routes.
- Rationale:
  - The write UI can be made ready and testable without mutating local demo business data.
  - Fake-client coverage verifies endpoint and payload contracts while respecting the user's explicit no-real-write boundary.
  - Keeping browser validation non-submitting prevents accidental fee creation, mark-paid transitions, and audit-event writes.
- Consequences:
  - Real persisted write acceptance remains unverified until a separately confirmed data-write route.
  - Step 15D or any voucher attachment entry must be planned and confirmed separately.
  - Future API/browser write smoke must explicitly name the demo user, target data, allowed writes, and whether resulting local records may remain.

## D071 - Step 15B fee detail reuses GET /fees/:id and keeps warnings frontend-derived

- Date: 2026-06-20.
- Context: Step 15A delivered the readonly fee ledger using existing `GET /fees`. Step 15B needed to add readonly detail and improve warning-list experience while preserving the confirmed no-write boundary.
- Decision:
  - Step 15B fee detail uses only the existing backend `GET /fees/:id`.
  - The frontend must open detail with fee record `id`, not `achievementId`.
  - Detail display is limited to fields returned by the fee record response and must not fabricate achievement title, attachments, approval, audit, voucher file, or other related-resource capability.
  - Warning groups remain frontend-derived from the current `GET /fees` list `dueDate` and `payStatus`.
  - Do not add or pretend to call `GET /fees/warnings`.
  - Do not create fees, mark fees paid, upload/download voucher attachments, or mix in Step 14 DataGap, workflow task data setup, seed, migrate, or any business data write route.
- Rationale:
  - Reusing `GET /fees/:id` completes the readonly fee detail loop without widening backend semantics.
  - Fee-id based detail prevents accidental coupling to achievement ids and matches the backend route contract.
  - Keeping warning groups frontend-derived gives users a clearer readonly workflow while avoiding claims that an independent warnings API exists.
- Consequences:
  - Step 15C or later must be separately confirmed before any write action, local business data write, fee creation, mark-paid flow, voucher handling, seed/migrate, or data route.
  - Browser coverage for 403 / 404 / 500 / network can remain test-backed unless a future confirmed route safely provisions those states without mutating business data.

## D070 - Step 15A fee frontend readonly foundation reuses existing GET /fees

- Date: 2026-06-20.
- Context: Step 15 direction was confirmed as fee management frontend / phase-one loop after Step 14 overall closed as `DONE_WITH_DATAGAP_RISK` and Step 14E completed. Existing backend fee capability already exposes `GET /fees`, `GET /fees/:id`, `POST /fees`, and `POST /fees/:id/mark-paid`, but Step 15A is scoped to readonly frontend foundation only.
- Decision:
  - Step 15A implements only a readonly fee-management frontend page backed by existing `GET /fees`.
  - The frontend treats `GET /fees` as an array response and must not assume achievement-style pagination.
  - Step 15A may provide pay-status, fee-type, and exact achievement-id filters using existing backend query fields.
  - Basic warning summary is derived in the frontend from the current fee list's `dueDate` and `payStatus`, and must be labeled as frontend-derived.
  - Do not add or pretend to call `GET /fees/warnings`.
  - Do not create fees, mark fees paid, upload/download voucher attachments, or fabricate voucher attachment capability.
  - Do not mix in Step 14 DataGap, workflow task data setup, seed, migrate, or any real data route.
- Rationale:
  - Reusing `GET /fees` turns the existing fee backend into a visible phase-one ledger without widening backend semantics.
  - Keeping warning summary frontend-derived avoids presenting a nonexistent warnings endpoint as real backend capability.
  - Keeping write actions and voucher attachment out of Step 15A preserves the confirmed readonly boundary and avoids business data mutation.
- Consequences:
  - Step 15B can separately plan fee detail and warning-list experience.
  - Step 15C or later must be separately confirmed before any fee write action or business data mutation is tested in browser/API.
  - Voucher attachment work remains a later attachment/fee integration boundary and cannot be claimed complete from Step 15A.

## D069 - Service controller and adapter provider injection is explicit under the tsx dev runtime

- Date: 2026-06-20.
- Context: Step 14B-API500 exposed dependency-undefined failures under `api dev` / `tsx watch` when backend providers relied on constructor type metadata. Step 14E-3 audited service/controller/adapter providers after repository and authorization policy explicit-injection audits.
- Decision:
  - Service/controller/adapter providers that depend on other providers should declare those dependencies with explicit `@Inject(...)` tokens.
  - Existing token-based dependencies, such as `ATTACHMENT_STORAGE_ADAPTER` and `SEARCH_ADAPTER`, should continue to use their token constants.
  - The change is limited to Nest DI metadata stability and must not alter service method logic, controller decorators, guards, permissions, DTO or response contracts, adapter behavior, repository query semantics, authorization policy behavior, workflow state machine behavior, schema, migration, seed, package files, or dependencies.
  - Service/controller/adapter DI changes should be covered by metadata / DI regression tests that assert explicit injection tokens.
- Rationale:
  - Explicit injection tokens keep provider wiring stable in the current `tsx watch` dev runtime, where implicit constructor type metadata already caused real API500 failures.
  - Metadata tests make the DI rule visible and guard against future regression.
- Consequences:
  - Future service/controller/adapter providers should follow explicit injection when they depend on other providers.
  - Step 14E-4 should focus on final gates and readonly smoke, not business behavior expansion or data setup.

## D068 - Authorization policy provider injection is explicit under the tsx dev runtime

- Date: 2026-06-20.
- Context: Step 14B-API500 exposed dependency-undefined failures under `api dev` / `tsx watch` when backend providers relied on constructor type metadata. Step 14E-2 audited authorization policy providers after the already repaired policy query factory and secret access policy.
- Decision:
  - Authorization policy providers that depend on other policy services should declare those dependencies with explicit `@Inject(...)` tokens.
  - The change is limited to Nest DI metadata stability and must not alter permission, policy, redaction, scope, grant, audit-read behavior, repository query semantics, DTOs, workflow state machine behavior, schema, migration, seed, package files, or dependencies.
  - Authorization policy DI changes should be covered by metadata / DI regression tests that assert the explicit injection tokens.
- Rationale:
  - Explicit injection tokens keep policy provider wiring stable in the current `tsx watch` dev runtime, where implicit constructor type metadata already caused real API500 failures in adjacent providers.
  - Metadata tests make the policy DI rule visible and guard against future regression.
- Consequences:
  - Future authorization policy providers should follow the explicit injection pattern when they depend on other providers.
  - Step 14E-3 should separately audit service/controller/adapter providers without mixing policy behavior or authorization semantic changes into the DI audit.

## D067 - Repository PrismaService injection is explicit under the tsx dev runtime

- Date: 2026-06-20.
- Context: Step 14B-API500 exposed dependency-undefined failures under `api dev` / `tsx watch` when backend providers relied on constructor type metadata. Step 14E-1 audited repository constructors that inject `PrismaService` after the already repaired achievement, workflow, dashboard, and search repositories.
- Decision:
  - Repository providers that inject `PrismaService` should declare the dependency with explicit `@Inject(PrismaService)`.
  - The change is limited to Nest DI metadata stability and must not alter repository method logic, Prisma query shape, include/select/filter/order, transactions, DTOs, permission/policy/redaction semantics, workflow state machine behavior, schema, migration, seed, package files, or dependencies.
  - Repository DI changes should be covered by metadata / DI regression tests that assert the explicit `PrismaService` injection token.
- Rationale:
  - Explicit injection tokens keep repository wiring stable in the current `tsx watch` dev runtime, where implicit constructor type metadata already caused real API500 failures in adjacent providers.
  - Metadata tests make this mechanical rule visible and guard against future regression.
- Consequences:
  - Future repository providers using `PrismaService` should follow the explicit injection pattern.
  - Step 14E-2 and Step 14E-3 should separately audit policy/service/controller/adapter providers without mixing repository query or business-semantics changes into the DI audit.

## D066 - Step 14 closes as DONE_WITH_DATAGAP_RISK and prioritizes Backend DI audit before Step 15

- Date: 2026-06-20.
- Context: Step 14 approval-task linked achievement detail mainline has completed Step 14A scope/contract confirmation, Step 14B linked achievement readonly foundation, API500 DI repairs, Step 14C experience hardening, and Step 14C-Browser-Recheck. Real API checks now pass for health, achievement list, workflow task list, no-user state, empty workflow list, backend-unavailable state, and 390px no-overflow states. However, the real local workflow task list is empty, so the real task detail -> linked achievement detail success path cannot be covered without creating or importing workflow task data.
- Decision:
  - Accept Step 14 overall status as `DONE_WITH_DATAGAP_RISK`.
  - Treat the remaining missing real task detail -> linked achievement success path as DataGap, not as API500, backend business failure, or Step 14 implementation failure.
  - Defer the real success path to phase-one integrated acceptance or a separately confirmed data route.
  - Do not create workflow task data, run seed/migrate, or use fake/mock/seed data to force Step 14 success-path evidence.
  - Reuse recent web/api gate evidence for Step 14D instead of rerunning all gates during the final closure.
  - Prioritize Step 14E Backend DI Explicit Inject Audit as the next quality step before Step 15.
- Rationale:
  - Step 14 delivered its frontend and backend-enabling scope while preserving the no-data-write and no-schema-change boundary.
  - The only remaining uncovered path requires suitable real workflow task data, which is an acceptance data condition rather than a code-path regression.
  - Closing as `DONE_WITH_DATAGAP_RISK` keeps the evidence honest and prevents fake data from being mistaken for real backend acceptance.
- Consequences:
  - Step 14 final archive must clearly report PASS / PARTIAL browser evidence and carry DataGap into phase-one integrated acceptance.
  - Step 14E can audit backend explicit DI patterns without expanding Step 14D or entering Step 15.
  - Any future attempt to cover the real success path must use a user-confirmed real data route or integrated acceptance plan.

## D065 - Step 14 approval-task achievement detail uses existing achievement detail contract in read-only approval context

- Date: 2026-06-19.
- Context: Step 14 direction is confirmed as approval-task achievement detail linking. Step 13 delivered approval task list/detail/approve/reject, but its task-detail drawer explicitly did not display achievement detail or cross-module achievement-detail entry. Existing Step 12D capability already reads achievement detail through `GET /achievements/:id` and has frontend achievement detail types/display behavior. Step 14A is memory-bank-only scope and contract archiving, with no UI/API/business implementation.
- Decision:
  - Step 14 will use the existing achievement detail contract as the basis for linked achievement viewing from approval task detail.
  - The linked achievement entry is enabled only when workflow instance `targetType === "ACHIEVEMENT"` and `targetId` exists.
  - The approval-task context must remain read-only for achievement details.
  - Do not bring achievement `submit`, `void`, or `archive` actions into the approval-task detail flow.
  - Authorization, redaction, 403, 404, and returned fields remain controlled by backend responses.
  - Do not add backend semantics, workflow state-machine behavior, Prisma schema changes, migrations, seeds, package changes, lockfile changes, dependencies, fake data, or mock data.
- Rationale:
  - Reusing the existing `GET /achievements/:id` detail contract avoids inventing a second achievement-detail pathway for approval tasks.
  - Keeping the approval context read-only prevents Step 14 from mixing approval review with achievement owner actions.
  - Gating the entry by `targetType` and `targetId` makes the frontend depend only on the stable workflow instance contract already exposed by Step 13.
- Consequences:
  - Step 14B should solve the frontend component contract for loading/displaying detail from `targetId` without requiring a full `AchievementListItem` from the workflow task.
  - Step 14B must avoid exposing submit/void/archive buttons in the approval-task context even if it reuses existing detail display code.
  - Real browser success acceptance may require a running backend and suitable workflow/achievement data; no migrate, seed, or fake-data path should be used to force success.
  - Step 14B remains TODO / not started after Step 14A.

## D064 - Step 12D frontend detail and action entries reuse existing Achievement APIs without expanding workflow boundaries

- Date: 2026-06-19.
- Context: Step 12D needed to close the Step 12 achievement-management first loop after Step 12A list API, Step 12B frontend list, and Step 12C create/edit draft form. Existing backend APIs already expose detail read and achievement actions: `GET /achievements/:id`, `POST /achievements/:id/submit`, `POST /achievements/:id/void`, and `POST /achievements/:id/archive`. Step 12D was not allowed to implement workflow approve/reject, attachments, fee CRUD, search/dashboard/audit expansion, backend semantic changes, schema changes, migrations, seed data, or new dependencies.
- Decision:
  - Add a frontend detail drawer that consumes `GET /achievements/:id`.
  - Add frontend action entries only for the states supported by the current backend contract:
    - `DRAFT`: submit and void.
    - `PENDING_ARCHIVE`: archive.
  - Require a nonblank reason before sending void.
  - Keep `DEPARTMENT_REJECTED`, `PENDING_DEPARTMENT_REVIEW`, `ARCHIVED`, and `VOIDED` read-only in Step 12D.
  - Reuse the existing API client `post` method for submit, void, and archive action calls.
  - Refresh detail and list after successful actions.
  - Keep final authorization, state transition, workflow readiness, and secret-detail access controlled by the backend.
  - Do not call workflow approve/reject routes or add fake workflow, attachment, fee, search, dashboard, or audit data.
- Rationale:
  - The existing backend action contract is sufficient for a first frontend achievement-management loop.
  - Keeping unsupported states read-only avoids silently widening the state machine from the browser.
  - Reusing the API client avoids new abstractions while preserving the existing demo-user header and error mapping behavior.
- Consequences:
  - Step 12 can close as DONE for list, registration/edit, detail, and supported action entries.
  - Future workflow approval, attachment handling, fee management, search, dashboard, and audit work must start from separate Step 13/14/15 plan confirmations.
  - Browser acceptance with backend unavailable can verify no-user/error/layout states, but real action success and permission/status failures require a running backend and suitable data.

## D063 - Step 12C frontend draft form follows existing backend draft contract without widening workflow semantics

- Date: 2026-06-19.
- Context: Step 12C needed to add frontend registration and draft-edit form capability after Step 12B delivered the real achievement list page. The backend already exposes `POST /achievements`, `GET /achievements/:id`, and `PATCH /achievements/:id`, but the current update path only supports `DRAFT` and rejects contributor changes. Step 12C was not allowed to change backend semantics, schema, migration, seed data, dependencies, submit/void/archive actions, approvals, attachments, or real detail-page behavior.
- Decision:
  - Add a drawer-based frontend achievement form for create and draft edit only.
  - Use `POST /achievements` for create mode and `GET /achievements/:id` plus `PATCH /achievements/:id` for edit mode.
  - Expose `编辑草稿` only for `DRAFT` list rows.
  - Keep `DEPARTMENT_REJECTED` edit disabled with explicit boundary copy instead of pretending the backend supports rejected-state editing.
  - Include contributors in create payloads, but make contributors read-only in edit mode and exclude them from PATCH payloads.
  - Keep `查看详情` as a Step 12D boundary entry and do not call submit, void, archive, approval, rejection, or attachment APIs.
  - Preserve backend ownership of validation, authorization, department assignment, and redaction; the frontend only performs user-friendly required-field checks and payload shaping.
- Rationale:
  - This keeps Step 12C useful for real draft creation/editing while respecting the backend contract that already exists.
  - Disabling unsupported edit states is safer than adding frontend affordances that would predictably fail or require hidden backend behavior changes.
  - Excluding contributors from PATCH prevents the UI from sending payloads the service explicitly rejects.
- Consequences:
  - Step 12D can implement real detail viewing separately without entangling it with create/edit form behavior.
  - Future support for editing rejected achievements or contributor updates requires a separate backend/frontend step and explicit plan confirmation.
  - Browser acceptance can verify frontend form behavior without backend availability, but real create/update success and backend error status paths require a running backend and suitable data.

## D062 - Step 12B frontend achievement list consumes backend list and redaction results without client-side authorization

- Date: 2026-06-19.
- Context: Step 12B needed to turn the frontend achievement boundary page into a real list page after Step 12A added `GET /achievements`. The backend list API already owns resource visibility through policy filtering and marks restricted rows with `isRestricted` / `isRedacted`, with `title` possibly returned as null. Step 12B was not allowed to implement registration, editing, real details, action APIs, backend semantic changes, fake data, or new dependencies.
- Decision:
  - Add a frontend `Achievements` page that consumes only `GET /achievements`.
  - Keep final authorization and redaction decisions owned by the backend.
  - Use `createApiClient(demoUserId)` so demo identity is passed through the existing `X-Demo-User-Id` flow.
  - Support keyword, status, type, page, and pageSize as list query inputs.
  - Display backend-redacted rows as redacted placeholders when `title` is null and `isRedacted` is true.
  - Keep registration and detail entries as explicit Step 12C / Step 12D boundary modals.
  - Do not introduce fake data, frontend-only permission filtering, POST/PATCH support, submit/void/archive calls, or new dependencies.
- Rationale:
  - The frontend should not duplicate or override backend authorization. It should render exactly the shape and redaction state returned by Step 12A.
  - Using a real GET list keeps Step 12B useful for future Step 12C/12D work while preserving the one-substep boundary.
  - Boundary modals make future actions discoverable without pretending that form or detail workflows are implemented.
- Consequences:
  - Step 12C can build registration/edit forms from this page without changing the list API consumption contract.
  - Step 12D can replace the detail boundary with a real detail workflow in a separate step.
  - Browser acceptance with backend unavailable can verify frontend no-user/error/control states, but real success, empty, 403, pagination, and restricted-row redaction need backend availability and real data in a later validation context.

## D061 - Step 12A Achievement list API uses user-context static permission and service-layer policy filtering

- Date: 2026-06-19.
- Context: Step 12A needed a real minimal `GET /achievements` API for future frontend list work. Existing achievement detail and action routes were already available, but no list route existed. `PolicyQueryFactory.achievementReadableWhere(context)` already expresses own and department readable scopes, while `PermissionGuard` uses all-permissions semantics and cannot express `achievement:read_own OR achievement:read_department` as static route metadata.
- Decision:
  - Add `GET /achievements` as the only Step 12A HTTP route.
  - Use `PermissionCode.userContextRead` as the static controller permission for the list route.
  - Keep final achievement visibility in `AchievementService.list(...)` by using `PolicyQueryFactory.achievementReadableWhere(context)`.
  - Treat no achievement read scope as an empty list through the existing no-access policy where, not as a business-resource 403.
  - Add `AchievementListQueryDto` with `status`, `type`, `keyword`, `page`, and `pageSize`.
  - Limit keyword search to title only.
  - Return only summary list fields and never return typed details, contributors, identifiers, grant facts, workflow comments, attachment storage facts, audit payloads, fee amount, or next fee date from the list API.
  - Redact `SECRET` / `CONFIDENTIAL` titles to `null` unless an effective secret read grant is present; keep stable non-detail facts plus `isRestricted` / `isRedacted`.
- Rationale:
  - `user_context:read` mirrors existing Search/Dashboard route style: route entry requires a loaded authorized context, while resource visibility remains service-owned.
  - Reusing `achievementReadableWhere` avoids widening data access and preserves the Step 4 rule that business queries must not fetch broad data and filter in memory.
  - A summary `select` makes sensitive-field leakage structurally harder than fetching aggregates and trimming later.
- Consequences:
  - Step 12B can consume `GET /achievements` for a real frontend list without fake data.
  - Any future richer list, full-text search, export, detail expansion, attachment facts, or frontend behavior requires a separate step.
  - No permission seed, Prisma schema, migration, package, lockfile, or external service change is introduced by Step 12A.

## D060 - Future sub-steps require separate plan, execution, validation, and archive cycles

- Date: 2026-06-19.
- Context: Step 11A / Step 11B / Step 11C / Step 11D were functionally completed and validated, but they were executed and archived in one continuous implementation round. This violated the Vibe Coding expectation that meaningful sub-steps move through plan, execute, verify, review, and record as separate loops.
- Decision:
  - Keep Step 11 overall as DONE because the post-completion process audit found each sub-step's functional completion definition supported by evidence.
  - Record the one-pass Step 11A-D execution as a process granularity defect.
  - For future M/L work, each named sub-step must have its own:
    - plan confirmation,
    - bounded execution scope,
    - validation evidence,
    - boundary review,
    - memory-bank record before the next sub-step begins.
  - Step 12 must begin with Step 12A plan confirmation only.
  - Step 12A / Step 12B / Step 12C / Step 12D must not be executed or archived in a single combined round.
- Rationale:
  - Separate sub-step loops keep scope smaller, make evidence easier to review, and prevent accidental progression into unconfirmed future work.
  - Process defects should be recorded transparently without rolling back functionally valid code.
- Consequences:
  - Future prompts and memory-bank startup controls must explicitly constrain the next action to the current sub-step.
  - If a future response attempts to batch multiple sub-steps, it should stop after the current sub-step and ask for the next plan confirmation.
  - Step 12 remains TODO / not started.

## D059 - Step 11 frontend shell uses local demo context, centralized API client, and non-router navigation

- Date: 2026-06-19.
- Context: Step 11 needed a runnable first-phase frontend base while keeping the existing React + Vite + Ant Design stack, adding no npm dependency, avoiding React Router, avoiding backend changes, and keeping unfinished modules visibly out of scope.
- Decision:
  - Use local React state for single-page navigation instead of adding React Router.
  - Keep 工作台 as the only Step 11 primary business view.
  - Render 成果管理, 审批管理, 费用管理, 检索中心, 统计看板, 审计日志, and 系统配置 as boundary pages until their future steps are separately planned and confirmed.
  - Centralize frontend API access in `apps/web/src/api-client.ts`.
  - Send `X-Demo-User-Id` from the selected local demo context on frontend API requests.
  - Store the selected demo user id in local storage for dev/test refresh recovery.
  - Clearly label the UI as "本地演示上下文 / 非真实 SSO".
  - Use a Vite dev-server `/api` proxy to `http://localhost:3000` for local development without changing backend source or package dependencies.
- Rationale:
  - This keeps Step 11 small, runnable, and aligned with the confirmed no-new-dependency / no-router boundary.
  - A centralized API client gives later frontend steps one place for header injection and error mapping.
  - Explicit boundary pages prevent unfinished modules from appearing production-complete.
- Consequences:
  - Later routing can be introduced only after a separate decision if the app outgrows local navigation state.
  - Frontend permission hints are informational only; Search, Dashboard, Workflow, Fee, and future Achievement access remain backend-enforced.
  - Local demo context must not be treated as real SSO or production authentication.
  - Step 12 remains TODO / not started and must begin with separate plan confirmation.

## D058 - Step 10 closes with memory-bank-only archive and next-step startup control

- Date: 2026-06-19.
- Context: Step 10 completed final quality gates, consistency checks, boundary scans, and evidence packaging after Step 9 overall was already DONE. Step 10D is a closure step and must avoid application source changes, schema changes, migrations, seed changes, package or lockfile changes, credential exposure, real database access, and future-step implementation.
- Decision:
  - Treat Step 10D as memory-bank-only closure.
  - Record Step 10A, Step 10B, Step 10C, Step 10D, and Step 10 overall as DONE.
  - Keep future steps TODO / not started.
  - Require the next step to start with a separate plan confirmation before implementation, command execution, or memory-bank update.
  - Record Step 10C's missing separate pre-execution plan-confirmation turn as a workflow flaw, not a blocker for Step 10 closure.
  - Record the lack of Git repository status/diff evidence as a verification limitation.
- Rationale:
  - Final closure should preserve stable evidence and boundaries without reopening implementation scope.
  - A separate next-step plan confirmation prevents accidental continuation from quality closure into new product work.
- Consequences:
  - Step 10 is closed as a final quality and evidence package step.
  - Future work must not infer that any post-Step-10 implementation has started.
  - Later validation should account for the missing Git diff/status evidence and use a fresh boundary check when a Git repository or alternative diff mechanism is available.

## D057 - Step 9D-2 imports DashboardModule at root and closes Step 9

- Date: 2026-06-18.
- Context: Step 9D-1 completed module-local `GET /dashboard/summary` while keeping root `AppModule` unchanged. Step 9D-2 must make Dashboard root reachable, verify root composition, and close Step 9 without adding endpoints, institute-wide semantics, new permission seed work, SearchLog writes, Meilisearch, frontend work, schema changes, package changes, lockfile changes, or real database execution.
- Decision:
  - Import `DashboardModule` explicitly into root `AppModule`.
  - Register `DashboardModule` after `SearchModule` in the root imports array.
  - Add AppModule-level Dashboard HTTP tests for `/health`, root `GET /dashboard/summary`, 401, 403, successful delegation, query transform, and invalid query validation.
  - Override `DashboardService`, `PrismaService`, and `IDENTITY_ADAPTER` in AppModule tests.
  - Keep real `UserContextGuard`, `PermissionGuard`, route permission metadata, and controller validation active in AppModule tests.
  - Keep static Dashboard HTTP permission as `user_context:read`; do not use `dashboard:read_institute`.
  - Mark Step 9A, Step 9B, Step 9C, Step 9D-1, Step 9D-2, Step 9D overall, and Step 9 overall as DONE after validation.
  - Keep Step 10 as TODO and require a separate quality gate and evidence package plan confirmation before Step 10 implementation.
- Rationale:
  - Root wiring is the smallest change needed to expose the already-reviewed module-local Dashboard route.
  - Provider overrides prove root route composition and guard metadata without touching real DashboardRepository, policy aggregation, Prisma, or dev identity database behavior.
  - `dashboard:read_institute` remains a separate institute-wide Dashboard scope decision with side-channel and scope implications.
- Consequences:
  - Step 9 is complete for backend Search and Dashboard foundation plus HTTP/root reachability.
  - Step 10 must begin from a separate quality gate and evidence package plan confirmation.
  - Future institute-wide Dashboard, frontend Dashboard, SearchLog, Meilisearch, cache, ranking, trends, exports, and custom reports remain separately planned work.

## D056 - Step 9D-1 Dashboard HTTP stays module-local and uses user context read

- Date: 2026-06-18.
- Context: Step 9C completed the Dashboard domain, repository, and service foundation without HTTP or root wiring. Step 9D-1 must expose the minimum Dashboard HTTP boundary while avoiding root `AppModule` wiring, AppModule-level tests, institute-wide semantics, new permission seed work, SearchLog writes, Meilisearch, frontend work, schema changes, package changes, lockfile changes, and real database execution.
- Decision:
  - Add only `GET /dashboard/summary` in a module-local `DashboardController`.
  - Register `DashboardController` only in `DashboardModule`.
  - Import `IdentityModule` into `DashboardModule` so `UserContextGuard` can resolve `IDENTITY_ADAPTER`.
  - Use explicit `UserContextGuard`, `PermissionGuard`, `@CurrentUser()`, and `@RequirePermissions(PermissionCode.userContextRead)`.
  - Do not use `dashboard:read_institute` for this route in Step 9D-1.
  - Allow only `today` and `dueSoonDays` query options.
  - Keep resource-level visibility, department scope, current-user Workflow/Reminder scope, and count/bucket summary construction inside `DashboardService`.
  - Keep root `AppModule` wiring and Step 9 final closure deferred to Step 9D-2.
- Rationale:
  - `user_context:read` is enough for a current-user visible summary because Step 9C service orchestration still applies Achievement/Fee policy scopes and current-user task scopes.
  - `dashboard:read_institute` should remain reserved for a separately planned institute-wide dashboard with explicit side-channel and scope rules.
  - Keeping root wiring separate preserves the Step 9 pattern of proving module-local HTTP behavior before exposing the route through root `AppModule`.
- Consequences:
  - Step 9D-1 is complete for module-local Dashboard HTTP boundary.
  - Step 9D-2 must separately import `DashboardModule` into root `AppModule`, add AppModule-level tests, and perform Step 9 final closure.
  - Future Dashboard detail/list/drilldown/export, frontend, cache, ranking, trends, institute-wide scope, amount summaries, or custom report work remains out of Step 9D-1.

## D055 - Step 9C-2 Dashboard repository/service uses policy where and current-user scopes

- Date: 2026-06-18.
- Context: Step 9C-1 fixed the Dashboard contract as count/bucket only. Step 9C-2 must implement repository/service aggregation while avoiding HTTP routes, root `AppModule` wiring, frontend, cache, ranking, trend, amount summaries, patent-depth metrics, custom reports, SearchLog writes, schema changes, seed changes, package changes, lockfile changes, and real database execution.
- Decision:
  - Add `DashboardRepository` methods for policy-scoped Achievement counts and buckets, policy-scoped Fee buckets/deadline counts, current-user WorkflowTask buckets, and current-user ReminderTask buckets.
  - Require caller-provided Achievement and Fee policy `where` filters rather than letting the repository widen or derive access.
  - Reuse `PolicyQueryFactory.achievementReadableWhere(context)` for Achievement metrics.
  - Reuse `PolicyQueryFactory.feeReadableWhere(context)` for Fee metrics and add the active Fee condition inside Dashboard aggregation.
  - Scope WorkflowTask and ReminderTask dashboard metrics to `context.userId`.
  - Add `DashboardService` as the service owner for context validation, policy filter construction, date-only due-soon boundaries, and mapping to the Step 9C-1 `DashboardSummary` shape.
  - Register `DashboardRepository` and `DashboardService` in standalone `DashboardModule`; do not import `DashboardModule` into root `AppModule` in Step 9C-2.
  - Keep Dashboard output count/bucket only and exclude sensitive business detail payloads.
- Rationale:
  - Passing policy filters into the repository keeps Dashboard aligned with Step 4 access-control boundaries and avoids broad-read-then-filter behavior.
  - Current-user WorkflowTask and ReminderTask scopes keep the first Dashboard foundation narrow until institute/department-level permissions are explicitly planned.
  - Count/bucket-only aggregation gives useful backend statistics while reducing detail leakage risk.
- Consequences:
  - Step 9C is complete for Dashboard domain, repository, service, and fake tests.
  - Step 9D must separately plan Dashboard HTTP permission, root `AppModule` wiring, AppModule-level tests, and Step 9 closure.
  - Any institute-wide Dashboard route, cache, ranking, trend, amount summary, SearchLog, or frontend work remains a separate future decision.

## D054 - Step 9C-1 Dashboard contract is count/bucket only

- Date: 2026-06-18.
- Context: Step 9C was split into 9C-1 Dashboard domain / metric contract and 9C-2 Dashboard repository/service foundation. Dashboard spans Achievement, Fee, WorkflowTask, and ReminderTask data, so the first slice must fix the metric contract and sensitive-field boundary before any Prisma aggregation exists.
- Decision:
  - Add a standalone `DashboardModule` skeleton without root `AppModule` wiring.
  - Define Dashboard metric section/key constants and result types as count/bucket contracts only.
  - Include only the minimum metric contracts: Achievement total, Achievement type distribution, Achievement status distribution, Fee pay-status distribution, Fee overdue/due-soon overview, WorkflowTask status overview, and ReminderTask status overview.
  - Define Dashboard request options with fixed `today` and `dueSoonDays`.
  - Default `dueSoonDays` to 30 and allow only integer values from 1 through 90.
  - Keep DashboardRepository, DashboardService aggregation, Prisma queries, HTTP routes, and root `AppModule` wiring out of Step 9C-1.
  - Keep sensitive business detail fields out of Dashboard runtime contract shapes.
- Rationale:
  - A pure contract slice lets Step 9C-2 implement policy-scoped aggregation against a stable shape.
  - Count/bucket-only contracts reduce statistical side-channel risk and prevent business-detail payloads from creeping into Dashboard responses.
  - Fixed `today` support makes due-soon tests deterministic without relying on wall-clock time.
- Consequences:
  - Step 9C-1 is complete for Dashboard domain / metric contract.
  - Step 9C-2 must implement repository/service foundation using this contract and must reuse policy-scoped where filters for Achievement and Fee statistics.
  - Dashboard HTTP routes and root reachability remain deferred to Step 9D.

## D053 - Step 9B-2 imports SearchModule at root with provider-overridden tests

- Date: 2026-06-18.
- Context: Step 9B-1 completed the module-local `GET /search` HTTP boundary while keeping root `AppModule` unchanged. Step 9B-2 must make the Search route root reachable without adding endpoints, new permissions, SearchLog writes, Meilisearch, Dashboard, schema changes, seed changes, package changes, lockfile changes, or real database execution.
- Decision:
  - Import `SearchModule` explicitly into root `AppModule`.
  - Add AppModule-level Search HTTP tests for `/health`, root `GET /search`, 401, 403, successful delegation, query transform, and invalid query validation.
  - Override `SearchService`, `PrismaService`, and `IDENTITY_ADAPTER` in AppModule tests.
  - Keep real `UserContextGuard`, `PermissionGuard`, and route permission metadata active in AppModule tests.
  - Keep static Search HTTP permission as `user_context:read`; do not add `search:read`.
  - Keep SearchLog writes out of Step 9B-2.
- Rationale:
  - Root `AppModule` wiring is the smallest change needed to make the already-reviewed module-local Search route reachable.
  - Provider overrides prove root route composition and guard metadata without touching real database-backed SearchRepository or DatabaseSearchAdapter behavior.
  - A new Search-specific permission remains a separate permission master-data and seed decision, and is not required for root reachability.
- Consequences:
  - Step 9B is complete for Search HTTP boundary and root reachability.
  - Step 9C remains TODO and must start with Dashboard foundation plan confirmation.
  - Future SearchLog, Meilisearch, or `search:read` work must be separately planned with redaction, permission, indexing, and stale-result behavior.

## D052 - Step 9B-1 Search HTTP uses user context read and stays module-local

- Date: 2026-06-18.
- Context: Step 9A completed a standalone Search foundation without HTTP routes or root wiring. Step 9B was split into 9B-1 module-local Search HTTP boundary and 9B-2 root `AppModule` wiring. Step 9B-1 must avoid root wiring, new permission seed/schema work, SearchLog writes, Meilisearch, Dashboard, frontend, package changes, lockfile changes, and real database execution.
- Decision:
  - Add only `GET /search` in a module-local `SearchController`.
  - Register `SearchController` only in `SearchModule`.
  - Import `IdentityModule` into `SearchModule` so `UserContextGuard` can resolve `IDENTITY_ADAPTER` for module-local HTTP tests and runtime composition.
  - Use explicit `UserContextGuard`, `PermissionGuard`, `@CurrentUser()`, and `@RequirePermissions(PermissionCode.userContextRead)`.
  - Do not add a new `search:read` permission in Step 9B-1.
  - Keep per-resource Achievement/Fee visibility, department scope, and secret redaction inside `SearchService`.
  - Keep Step 9A safe response shape: no restricted Achievement title/identifiers without effective `SECRET_READ`, no Achievement full detail/abstract/contributors, and no Fee amount/voucher number.
  - Do not write `SearchLog` in Step 9B-1.
- Rationale:
  - `user_context:read` is an existing seeded permission that allows the HTTP entry point to require an authenticated/authorized user context without introducing permission master-data changes.
  - Search spans multiple resource types, so a new `search:read` permission would require separate permission/seed planning and would still not replace resource-level policy filters.
  - Keeping root wiring out of 9B-1 preserves a small reviewable boundary and leaves AppModule reachability to 9B-2.
- Consequences:
  - Step 9B-1 is complete for module-local Search HTTP behavior.
  - Step 9B-2 must separately plan root `AppModule` import and AppModule-level route tests with provider overrides.
  - Future SearchLog or `search:read` work must be separately planned with a logging/permission seed strategy and redaction rules.

## D051 - Step 9A Search foundation uses database adapter and redacted policy results

- Date: 2026-06-18.
- Context: Step 9 was split into 9A Search foundation, 9B Search HTTP/root wiring, 9C Dashboard foundation, and 9D Dashboard HTTP/root wiring + Step 9 closure. Step 9A must avoid real Meilisearch, SearchLog writes, HTTP routes, root wiring, Dashboard, frontend, schema changes, migrations, seed changes, package changes, lockfile changes, and real database execution.
- Decision:
  - Add `SearchModule` as a standalone module only; do not import it into root `AppModule` in Step 9A.
  - Add a `SearchAdapter` token with `DatabaseSearchAdapter` as the first implementation.
  - Use Prisma-backed repository methods for Achievement and Fee search, but require caller-provided policy where filters.
  - Use `PolicyQueryFactory.achievementReadableWhere(...)` for Achievement search and `PolicyQueryFactory.feeReadableWhere(...)` for Fee search.
  - Apply `SecretAccessPolicyService.canReadResource(...)` after base Achievement scope is matched.
  - For restricted Achievements without effective `SECRET_READ`, return only stable scope/state facts and omit title and identifiers.
  - Do not write `SearchLog` in Step 9A.
  - Exclude Achievement full detail, abstract, contributors, Fee amount, Fee voucher number, attachment storage facts, audit raw values, workflow comments, notification content, credentials, tokens, cookies, environment values, and connection strings from Search results and tests.
- Rationale:
  - The database adapter creates a real search boundary without introducing external service consistency, indexing, or operational risk.
  - Caller-provided policy where filters preserve the Step 4 rule that business queries must not fetch broad data and then filter in memory.
  - Redacted restricted results avoid returning business detail before secret grants are proven.
- Consequences:
  - Step 9A is complete for backend Search foundation only.
  - Step 9B must explicitly plan Search HTTP controller permissions, response shape, root `AppModule` wiring, and AppModule-level tests.
  - Future Meilisearch integration must be a separate confirmed plan covering index sync, stale-index behavior, and permission filtering.

## D050 - Step 8D-3 Reminder confirm is the only root Reminder HTTP route

- Date: 2026-06-18.
- Context: Step 8D-2 completed Reminder send/confirm orchestration and audit transactions while leaving HTTP and root wiring out of scope. Step 8D-3 exposes the minimal confirmed HTTP boundary and closes Step 8.
- Decision:
  - Add only `POST /reminders/:id/confirm` for Reminder HTTP in Step 8D-3.
  - Use the existing `reminder:read_department` static permission because no new confirm-specific permission exists in the current seed/schema boundary.
  - Keep receiver-only confirmation enforcement inside `ReminderService.confirmReminder(...)`.
  - Do not expose a Reminder send HTTP route; send remains an internal service capability for a later scheduler/internal trigger design.
  - Import `RemindersModule` into root `AppModule` and keep `NotificationsModule` as a nested dependency rather than a direct root import.
- Rationale:
  - The route is intentionally narrow and matches the existing permission vocabulary without seed or schema changes.
  - Receiver-only service enforcement prevents department-wide users from confirming another receiver's reminder.
  - Avoiding a send route prevents a public HTTP path from driving mock notification sends before scheduler/internal-trigger policy is designed.
- Consequences:
  - Step 8D is complete for Notification mock, Reminder send/confirm orchestration, audit transaction behavior, and confirm HTTP/root reachability.
  - Step 8 is complete.
  - Step 9 remains TODO and requires a separate plan confirmation.
  - Notification mock remains `IN_APP` only and does not use an EMAIL channel.
  - No schema, migration, seed, package, lockfile, real database, real search integration, queue, mail, finance, scheduler, or frontend change is required.

## D049 - Step 8D-2 Reminder send and confirm share audit transactions

- Date: 2026-06-18.
- Context: Step 8D-1 completed in-app Notification mock persistence without Reminder orchestration or audit integration. Step 8D-2 adds Reminder send/confirm service orchestration while keeping HTTP and root wiring out of scope.
- Decision:
  - Import `NotificationsModule` and `AuditModule` into `RemindersModule` but do not import `RemindersModule` into root `AppModule`.
  - Use a light system actor for Reminder send orchestration and real `UserContext` for confirmation.
  - Keep Reminder send success in one transaction: Notification create, ReminderTask `PENDING -> SENT`, Reminder audit, and Notification audit.
  - Keep Reminder send failure in one transaction: ReminderTask `PENDING -> FAILED` and Reminder audit, without creating a failed Notification.
  - Keep Reminder confirm in one transaction: receiver-only `SENT -> CONFIRMED` and Reminder audit.
  - Reuse existing audit enum values: `REMINDER_TASK / UPDATE`, `NOTIFICATION / CREATE`, and `REMINDER_TASK / CONFIRM_REMINDER`.
  - Do not add a `SEND_NOTIFICATION` enum or migration.
  - Do not include Notification content or Fee/Achievement/Attachment sensitive fields in audit payloads.
- Rationale:
  - Shared transactions preserve the existing Step 7 and Step 8B rule that audited business writes either commit together or fail together.
  - Receiver-only confirmation avoids department-wide users confirming another user's reminder.
  - Existing schema and audit enum values are sufficient for the backend mock reminder lifecycle.
- Consequences:
  - Step 8D-3 remains responsible for Reminder HTTP routes, root `AppModule` wiring, AppModule tests, and Step 8 closure.
  - No schema, migration, seed, package, lockfile, real database, queue, mail, finance, HTTP route, or root `AppModule` change is required for Step 8D-2.

## D048 - Step 8D-1 Notification mock is in-app only

- Date: 2026-06-18.
- Context: Step 8C completed Reminder task generation but intentionally left Notification mock, Reminder send/confirm orchestration, and audit integration for Step 8D. Step 8D is split into smaller slices so Notification persistence can be stabilized before Reminder status transactions.
- Decision:
  - Implement Step 8D-1 as Notification mock foundation only.
  - Add `NotificationsModule`, `NotificationRepository`, `NotificationService`, domain mapper/types/errors, and `MockNotificationAdapter`.
  - Support only in-app notification behavior.
  - Persist Notification rows with receiver id, channel, title, content, `SENT` status, and `sentAt`.
  - Do not add or require a reminder task id because the current schema has no such relation.
  - Do not add a new notification-send audit enum or migration.
  - Keep Reminder send/confirm orchestration and AuditService integration out of Step 8D-1.
- Rationale:
  - The existing `Notification` table is sufficient for mock in-app persistence without schema changes.
  - Keeping Step 8D-1 standalone prevents notification persistence from being mixed with Reminder state transitions before the transaction boundary is confirmed.
  - Avoiding external-provider concepts keeps this step free of real mail, queue, scheduler, or integration side effects.
- Consequences:
  - Step 8D-2 must wire Reminder send/confirm orchestration and audit transaction behavior explicitly.
  - Step 8D-3 remains responsible for HTTP/root wiring if confirmed.
  - No schema, migration, seed, package, lockfile, real database, queue, mail, finance, HTTP route, or root `AppModule` change is required for Step 8D-1.

## D047 - Step 8C-2 Reminder task generation is summary-only and idempotent

- Date: 2026-06-18.
- Context: Step 8C-1 fixed Reminder date rules, eligible Fee status rules, receiver fallback, and overdue-daily semantics without persistence. Step 8C-2 adds the repository/service foundation while keeping Notification, reminder confirm, scheduler, queue, HTTP, and audit work out of scope.
- Decision:
  - Add `ReminderRepository` and `ReminderService` under `apps/api/src/reminders`.
  - Add `RemindersModule` but do not import it into root `AppModule`.
  - Query only narrow Fee facts plus Achievement owner user id for reminder generation.
  - Use default `take: 500` for eligible Fee scans.
  - Use the existing `ReminderTask` unique key for idempotency.
  - Deduplicate generated candidates in memory before calling `createMany({ skipDuplicates: true })`.
  - Return summary counts and skipped Fee facts from `generateFeeDueReminders(...)`; do not return created task rows.
- Rationale:
  - The reminder generation path is batch-oriented and should not reuse Fee HTTP/read repository behavior that is scoped for user-facing Fee access.
  - Summary-only output avoids exposing unnecessary persistence rows before HTTP or Notification behavior is designed.
  - `createMany + skipDuplicates` uses the existing schema guarantee without adding migrations.
- Consequences:
  - Step 8C is complete for rule plus repository/service foundation.
  - Step 8D remains responsible for Notification mock, reminder confirm, and audit integration.
  - No schema, migration, seed, package, lockfile, real database, queue, mail, finance, HTTP route, or root `AppModule` change is required for Step 8C-2.

## D046 - Step 8C-1 Reminder rules stay domain-only

- Date: 2026-06-18.
- Context: Step 8B completed Fee backend service, audit transaction integration, HTTP boundary, and root reachability. Step 8C is split so the Reminder date and receiver rules can be fixed before persistence/service orchestration.
- Decision:
  - Implement Step 8C-1 as domain-only Reminder rule and state-machine code.
  - Normalize `today` and Fee `dueDate` to UTC date-only midnight before comparing dates.
  - Generate `DAYS_30`, `DAYS_15`, and `DAYS_7` only when `dueDate - today` equals 30, 15, or 7 days.
  - Generate `OVERDUE` when normalized today is after normalized due date.
  - Use normalized today as `remindDate` for overdue candidates, allowing one overdue reminder per day when Step 8C-2 applies the existing ReminderTask uniqueness key.
  - Allow only `PENDING` and `OVERDUE` Fee statuses to generate Reminder candidates; skip `PAID`, `WAIVED`, `CANCELLED`, and archived Fee facts.
  - Resolve receiver by deterministic fallback: Fee `createdById`, then `updatedById`, then Achievement owner user id; missing receiver returns a skipped reason.
  - Keep department research secretary or fee manager receiver selection out of Step 8C-1.
- Rationale:
  - Date-only normalization avoids time-of-day ambiguity in fee due-date reminders.
  - Domain-only rules can be tested without real database access, scheduler, queue, Notification, or audit side effects.
  - The existing `ReminderTask` unique key can later provide idempotency when repository writes are added.
- Consequences:
  - Step 8C-2 must add ReminderRepository and ReminderService before Reminder tasks are persisted.
  - Step 8D remains responsible for Notification mock, reminder confirm, and audit integration.
  - No schema, migration, seed, package, lockfile, real database, queue, mail, finance, Notification, HTTP route, or root `AppModule` change is required for Step 8C-1.

## D045 - Step 8B-3 Fee routes are explicitly root-reachable

- Date: 2026-06-18.
- Context: Step 8B-2 completed Fee module-local HTTP routes and tests. Step 8B-3 exposes those routes through the root API module and closes Step 8B.
- Decision:
  - Import `FeesModule` explicitly into root `AppModule`.
  - Keep Fee route protection at the controller level through explicit `UserContextGuard`, `PermissionGuard`, `@CurrentUser()`, and `@RequirePermissions()`.
  - Add AppModule-level Fee tests that override `FeeService`, `PrismaService`, and `IDENTITY_ADAPTER`.
  - Use `IDENTITY_ADAPTER` override rather than dev identity Prisma lookup for Fee root wiring tests.
  - Do not modify `main.ts`, register global guards, or add global validation pipes.
- Rationale:
  - Explicit root import makes Fee route exposure intentional and auditable.
  - Provider overrides prove root reachability and guard behavior without executing real database access, Fee transactions, or audit writes.
  - Keeping guards explicit avoids changing unrelated route behavior.
- Consequences:
  - Fee routes are now reachable through root `AppModule`.
  - Step 8B is complete for Fee backend service, audit transaction integration, module-local HTTP boundary, and root reachability.
  - Reminder and Notification remain separate Step 8C/8D work.
  - No schema, migration, seed, package, lockfile, real database, queue, mail, finance, Reminder, Notification, or frontend change is required.

## D044 - Step 8B-2 Fee HTTP boundary stays module-local

- Date: 2026-06-18.
- Context: Step 8B-1 completed FeeService orchestration and audit transaction behavior. Step 8B-2 exposes the Fee controller only inside `FeesModule`; root `AppModule` wiring remains a later confirmed step.
- Decision:
  - Add `FeeController` with only `GET /fees`, `GET /fees/:id`, `POST /fees`, and `POST /fees/:id/mark-paid`.
  - Use `@HttpCode(200)` for `POST /fees/:id/mark-paid`.
  - Do not add `PATCH /fees/:id`, DELETE, archive, cancel, or waive routes in this step.
  - Keep route protection explicit with `UserContextGuard`, `PermissionGuard`, `@CurrentUser()`, and `@RequirePermissions()`.
  - Use `fee:read_department` for Fee read routes and `fee:manage_department` for Fee write routes.
  - Keep resource and department enforcement in `FeeService` and its policy query boundaries; the controller only validates HTTP input and delegates to `FeeService`.
  - Map Fee service errors at the controller boundary: access/permission denied to 403, not found to 404, and conflict/invalid transition to 409.
  - Import `IdentityModule` into `FeesModule` so module-local controller tests can resolve explicit guard dependencies without global guards.
- Rationale:
  - Module-local HTTP tests prove the Fee route boundary before exposing it through root `AppModule`.
  - Keeping resource scope in `FeeService` avoids duplicating department filtering in the controller.
  - Deferring root wiring preserves a clear Step 8B-3 review point for public API reachability.
- Consequences:
  - Fee routes are testable inside `FeesModule` but are not yet root-app reachable.
  - No global `APP_GUARD`, `useGlobalPipes`, or `useGlobalGuards` is introduced.
  - No schema, migration, seed, package, lockfile, real database, queue, mail, finance, Reminder, Notification, or frontend change is required.

## D043 - Step 8B-1 Fee service writes share audit transactions

- Date: 2026-06-18.
- Context: Step 8A completed Fee domain and repository foundations. Step 8B-1 adds FeeService orchestration only, while Fee HTTP routes and root AppModule wiring remain later steps.
- Decision:
  - Add `FeeService` with list, detail, create, and mark-paid methods.
  - Keep `FeesModule` out of root `AppModule` in Step 8B-1.
  - Use `RbacPolicyService` and `PolicyQueryFactory` for Fee read/manage boundaries.
  - For `createFee`, use `FeeRepository.findAchievementParentByIdWhere(...)` with `fee:manage_department` scoped Achievement where and use the parent `departmentId` for the Fee record.
  - For `markFeePaid`, use a fee department-scoped state lookup and allow only `PENDING -> PAID` and `OVERDUE -> PAID`.
  - Make `FeeService` the outer transaction owner for Fee create and mark-paid writes.
  - Write `FEE_RECORD / CREATE` and `FEE_RECORD / MARK_FEE_PAID` audit events with `AuditService.recordEventInTransaction(...)` inside the same transaction callback as the Fee write.
  - Keep audit summaries limited to stable facts and exclude amount, voucher number, Achievement business details, attachment storage facts, credentials, tokens, connection strings, and environment values.
- Rationale:
  - Shared transactions prevent successful Fee writes without the required audit fact.
  - Achievement parent narrow facts prevent Fee creation from reading or leaking Achievement details.
  - Keeping HTTP and root wiring out of Step 8B-1 reduces the blast radius while service semantics are fixed by unit tests.
- Consequences:
  - Fee writes now depend on `AuditService` availability.
  - `FeesModule` now imports `AuditModule`, `AuthorizationModule`, and `DatabaseModule`, but Fee routes are still unreachable from root until Step 8B-2/8B-3.
  - No schema, migration, seed, package, lockfile, controller, HTTP route, root `AppModule`, real database, queue, mail, finance, Reminder, or Notification change is required.

## D042 - Step 7 closes attachment and audit foundation without production storage hardening

- Date: 2026-06-12.
- Context: Step 7A through Step 7D-3 are complete. The system now has audit foundations, attachment metadata/fake storage foundations, attachment HTTP/root reachability, and core audit integration for Achievement, Workflow, and Attachment actions in scope.
- Decision:
  - Mark Step 7 overall as DONE.
  - Treat Step 7A, 7B, 7C, and 7D as DONE.
  - Keep Step 8 as TODO and require a separate Step 8 pre-plan confirmation before any fee or reminder implementation.
  - Keep audit payloads limited to stable facts and redacted summaries.
  - Keep fake in-memory storage as the only storage implementation in Step 7.
  - Defer real object storage cleanup/compensation design and Attachment schema hardening to later confirmed work.
- Final delivered scope:
  - Audit foundation: `AuditModule`, repository/service/domain/DTO/tests, append-only writes, masked query reservation, and in-transaction write methods.
  - Attachment foundation: `AttachmentsModule`, repository/service/domain/DTO/storage boundary/tests, fake storage, metadata creation, version increment, object-key generation.
  - Attachment HTTP/root wiring: upload/list/detail/download routes, explicit root `AppModule` import, root route reachability, 401/403 guard verification.
  - Core audit integration: Achievement create/update/submit/void/archive, Workflow approve/reject/archive closure, Attachment upload/download.
- Final boundaries:
  - No global `APP_GUARD`, `useGlobalPipes`, or `useGlobalGuards`.
  - `main.ts` remains unchanged.
  - No schema, migration, seed, package, or lockfile change.
  - No real database access, migrate, or seed command.
  - No real object storage, file system storage, network storage, multipart upload, or stream download.
  - No Step 8 implementation.
- Security constraints:
  - Do not record attachment content, object key, storage key, checksum, real path, credentials, tokens, cookies, API keys, private keys, connection strings, environment values, raw IP, full user agent, or full Achievement business detail in audit.
- Consequences:
  - Step 7 is backend-capable for attachment metadata/fake download and audit integration but not production-hardened for real object storage.
  - A later schema/migration plan is still needed for `contentType`, `sizeBytes`, `storageProvider`, object-key uniqueness, production download headers, and multi-backend storage.
  - Real storage integration must handle cleanup, compensation, outbox, or pre-write status for failed metadata/audit transactions after object writes.

## D041 - Step 7D-3 Attachment audit writes keep upload metadata and audit transactional

- Date: 2026-06-12.
- Context: Step 7D-1 and 7D-2 integrated Achievement and Workflow audit writes. Step 7D-3 integrates Attachment upload/download audit without changing HTTP routes, response shapes, schema, or real storage.
- Decision:
  - Import `AuditModule` into `AttachmentsModule`.
  - Inject `AuditService` and `PrismaService` into `AttachmentService`.
  - For upload, write an `ATTACHMENT / UPLOAD_ATTACHMENT` audit event inside the same Prisma transaction as attachment metadata creation.
  - Keep fake storage write before and outside the metadata/audit transaction.
  - Treat upload audit failure as business failure for metadata creation, so the transaction rejects.
  - For download, write an `ATTACHMENT / DOWNLOAD_ATTACHMENT` audit event after authorization and fake storage read succeed, before returning the fake body.
  - Treat download audit failure as request failure, so the fake body is not returned.
  - Do not record fake body, object key, storage key, checksum, credentials, environment values, raw IP, user agent, connection strings, or parent Achievement business detail in audit summaries.
- Rationale:
  - Upload metadata and audit are both database facts and should commit or fail together.
  - The current fake storage adapter has no durable external side effects, so keeping it outside the transaction preserves the existing storage boundary without introducing cleanup infrastructure in Step 7D-3.
  - Download has no business mutation to roll back, but returning content without the required audit event would violate the audit contract.
- Consequences:
  - Attachment writes now depend on `AuditService` availability.
  - If fake storage succeeds and the later metadata/audit transaction fails, a fake in-memory object may remain without metadata; real storage should add cleanup/compensation before production object storage integration.
  - No schema, migration, seed, root `AppModule`, controller, HTTP response, AuditService, AuditRepository, or package change is required.

## D040 - Step 7D-2 Workflow audit writes share workflow transactions

- Date: 2026-06-12.
- Context: Step 7D-1 integrated Achievement audit writes. Step 7D-2 integrates Workflow approve/reject and archive workflow closure audit writes while keeping Attachment audit for Step 7D-3.
- Decision:
  - Import `AuditModule` into `WorkflowModule`.
  - Inject `AuditService` into `WorkflowService`.
  - For department review approve, write a `WORKFLOW_TASK / APPROVE` audit event inside the existing approve transaction after task/action, workflow instance, and Achievement status updates succeed.
  - For department review reject, write a `WORKFLOW_TASK / REJECT` audit event inside the existing reject transaction after task/action, workflow instance, and Achievement status updates succeed.
  - For system-admin archive workflow closure, keep `AchievementService.archiveAchievement` as the outer transaction owner and pass the same transaction/audit client plus stable target facts to `WorkflowService.completeAchievementArchiveInTransaction(...)`.
  - Write a `WORKFLOW_INSTANCE / ARCHIVE` audit event in the workflow closure helper after the instance-level archive action and workflow instance completion succeed.
  - Treat workflow audit write failure as business failure for these Workflow write actions, so the shared transaction rejects.
  - Do not record approve/reject comment text or business detail payloads in audit summaries.
- Rationale:
  - Workflow approve/reject are primarily task/action/instance operations, so WorkflowService should construct their audit facts.
  - Archive workflow closure is a workflow semantic, but AchievementService remains the transaction owner to preserve the existing archive permission and state boundary.
  - Separate `ACHIEVEMENT / ARCHIVE` and `WORKFLOW_INSTANCE / ARCHIVE` events make the archive state change and workflow closure independently auditable without adding HTTP surface.
- Consequences:
  - Workflow writes now depend on `AuditService` availability.
  - Archive completion produces two audit events in one transaction: one for Achievement state archive and one for Workflow instance closure.
  - No schema, migration, seed, root `AppModule`, controller, HTTP response, or package change is required.

## D039 - Step 7D-1 Achievement audit writes share business transactions

- Date: 2026-06-12.
- Context: Step 7D begins audit integration after the standalone Audit foundation and attachment HTTP/root wiring. The user confirmed Step 7D is split into 7D-1 / 7D-2 / 7D-3 and that 7D-1 covers Achievement actions only.
- Decision:
  - Import `AuditModule` into `AchievementsModule`.
  - Inject `AuditService` into `AchievementService`.
  - For create draft, update draft, submit, void, and archive, write an `ACHIEVEMENT` audit event with `AuditService.recordEventInTransaction(...)`.
  - For create/update/void, make `AchievementService` the outer transaction owner and call repository `...InTransaction` methods.
  - For submit/archive, keep the existing outer business transaction and add the audit write inside that transaction.
  - Treat audit write failure as business failure for Achievement write actions, so the shared transaction rolls back.
  - Leave Workflow instance/archive audit and Attachment upload/download audit to 7D-2 and 7D-3.
- Rationale:
  - Shared transactions prevent successful Achievement writes without the required audit event.
  - Caller-provided transaction-client methods avoid nested Prisma transactions.
  - Keeping 7D-1 scoped to Achievement avoids mixing Workflow and Attachment audit semantics in one change.
- Consequences:
  - Achievement writes now depend on `AuditService` availability.
  - Achievement audit summaries must remain stable and redacted: ids, action, status, version, secret level target fact, and timestamps only.
  - No schema, migration, seed, root `AppModule`, controller, HTTP response, or package change is required.

## D038 - Step 7C-3 explicitly imports AttachmentsModule in root AppModule

- Date: 2026-06-12.
- Context: Step 7C completed module-local attachment HTTP routes inside `AttachmentsModule`. Step 7C-3 closes root reachability without changing attachment business semantics.
- Decision:
  - Import `AttachmentsModule` explicitly in root `AppModule`.
  - Do not modify `main.ts`.
  - Do not register global `APP_GUARD`, global pipes, or global guards.
  - Add AppModule-level HTTP wiring tests for `/health` and all four attachment routes.
  - Use provider overrides for `AttachmentService`, `PrismaService`, `AchievementService`, and `WorkflowService`; keep real `UserContextGuard`, `PermissionGuard`, RBAC policy, and decorator metadata active.
  - Keep `AuditService` and Step 7D out of this root wiring step.
- Rationale:
  - Explicit root import makes attachment route exposure intentional and auditable.
  - AppModule-level tests prove root reachability while avoiding real database, storage, and unrelated business service execution.
  - Keeping guards real verifies the same request protection chain used by runtime routes.
- Consequences:
  - Attachment routes are now root-app reachable.
  - Step 7C is root reachable DONE.
  - Step 7D remains separate and must plan audit writes before implementation.

## D037 - Step 7C keeps attachment HTTP local and download-only grants narrow

- Date: 2026-06-12.
- Context: Step 7C exposes the first attachment HTTP boundary after Step 7B's standalone attachment foundation. The user confirmed no root `AppModule` wiring, no real object storage, no audit integration, and no schema or dependency changes.
- Decision:
  - Register `AttachmentController` only inside `AttachmentsModule`.
  - Keep root `AppModule` wiring as a separate later confirmation step.
  - Use `achievement:update_own` for upload without additionally requiring `attachment:read_metadata`.
  - Require `attachment:read_metadata` for list/detail.
  - Require `attachment:download` for download.
  - Treat direct `ATTACHMENT_DOWNLOAD` grant as a download-only exception; it does not grant metadata list/detail or Achievement business detail.
  - Use `PrismaService`, `PolicyQueryFactory`, and `SecretAccessPolicyService` directly in the attachment service/repository boundary for minimum parent Achievement facts instead of importing `AchievementsModule`.
- Rationale:
  - Attachment HTTP routes need resource-level policy sequencing before root reachability.
  - Download grants must not become a back door into Achievement detail or attachment metadata.
  - Avoiding `AchievementsModule` import keeps the attachment module independent and reduces circular module risk.
- Consequences:
  - Step 7C routes are tested module-locally but are not root-app reachable until a separate root wiring step.
  - Step 7D can later add audit writes around stable upload/download facts without changing the HTTP response boundary.

## D036 - Step 7B uses current Attachment schema and fake storage only

- Date: 2026-06-11
- Context: Step 7B implements Attachment foundation and storage adapter after Step 7A Audit foundation. The user confirmed no migration, no real object storage, no HTTP route, no root `AppModule` import, and no audit integration in Step 7B.
- Decision:
  - Use the existing `Attachment` schema for Step 7B metadata foundation.
  - Defer `contentType`, `sizeBytes`, `storageProvider`, and object-key uniqueness to a later confirmed schema/migration plan.
  - Support ACHIEVEMENT relation in service orchestration; keep FEE_RECORD and WORKFLOW_ACTION as domain/schema constants only.
  - Use an in-memory fake storage adapter that does not access disk, network, or real object storage.
  - Return metadata-only DTOs and do not expose object keys or checksums from service public results.
  - Do not integrate `AuditService` in Step 7B.
- Reason:
  - The existing schema is enough to test versioning, metadata persistence, object-key generation, and access-policy sequencing without changing executed migrations.
  - Real storage, HTTP streaming, audit writes, and production metadata fields are higher-risk boundaries that need their own plan.
- Consequences:
  - Step 7C can build HTTP upload/download/list on a tested service/repository foundation.
  - Production-ready file response metadata and provider routing still require later schema review.
- Rollback:
  - If production attachment metadata requirements are expanded, add a new migration and update attachment repository/service tests; do not modify executed migrations.

## D035 - Step 6 final archive boundary

- Date: 2026-06-11
- Context: Step 6A, 6B, 6C, and 6D are complete. The final archive should preserve stable facts and evidence without synchronizing the chat transcript or expanding into Step 7.
- Decision:
  - Treat Step 6 as DONE.
  - Treat Step 7 as TODO and not started.
  - Keep the final archive limited to stable workflow facts, key decisions, verification evidence, boundaries, and next-step guidance.
  - Do not record temporary discussion, repeated planning text, full command logs, secrets, environment contents, database connection strings, or unrelated details.
  - Require Step 7 to begin with plan confirmation before implementing attachment or audit code.
- Reason:
  - Step 6 has a complete backend approval workflow closure and should be easy to resume from memory-bank without reading the full conversation.
  - Step 7 has different risk and scope, especially attachments and audit, and should not be implied by Step 6 completion.
- Consequences:
  - Future work should use the Step 6 final archive entries as the authoritative workflow baseline.
  - Any attachment, audit, frontend, fees, reminders, search, dashboard, schema, migration, seed, dependency, or real database work requires a new confirmed step plan.
- Rollback:
  - If Step 6 scope is reopened, add a new progress/evidence/decision entry describing the reopened scope instead of rewriting this final archive.

## D034 - Step 6D explicitly imports WorkflowModule in root AppModule

- Date: 2026-06-11
- Context: Step 6C completed workflow HTTP routes inside `WorkflowModule`, and `AchievementsModule` already imports `WorkflowModule` for submit/archive service orchestration. Step 6D needs root API reachability and Step 6 closure evidence.
- Decision:
  - Import `WorkflowModule` explicitly in root `AppModule`.
  - Keep the existing `WorkflowModule` import inside `AchievementsModule`.
  - Do not modify `main.ts`.
  - Do not register global `APP_GUARD`, global pipes, or global guards.
  - Add AppModule-level HTTP wiring tests for `/health` and all four workflow routes.
  - Use provider overrides for `WorkflowService`, `AchievementService`, and `PrismaService`; keep real request guards active.
- Reason:
  - Explicit root import makes workflow route exposure intentional instead of relying on the module graph through `AchievementsModule`.
  - Keeping the `AchievementsModule` import preserves the existing submit/archive dependency on `WorkflowService`.
  - AppModule-level tests prove root reachability while avoiding real database access.
- Consequences:
  - Workflow routes are now part of the root API module.
  - Step 6 is complete at the backend basic approval workflow level.
  - Step 7 must begin with a separate plan and must not be inferred from Step 6 closure.
- Rollback:
  - If workflow route exposure must be paused later, remove `WorkflowModule` from root `AppModule` in a dedicated patch while preserving workflow service dependencies until an alternative module boundary is planned.

## D033 - Step 6C-2 workflow todo APIs expose workflow target only

- Date: 2026-06-11
- Context: Step 6C-1 exposed workflow approve/reject actions inside `WorkflowModule`. Step 6C-2 adds workflow todo list/detail HTTP reads without connecting workflow to root `AppModule`.
- Decision:
  - Add `GET /workflow/tasks/my` and `GET /workflow/tasks/:taskId` only to `WorkflowController`.
  - Require `achievement:review_department` and explicit `UserContextGuard` / `PermissionGuard` on both routes.
  - Make `GET /workflow/tasks/my` default to `PENDING`, while allowing explicit `status` and optional `achievementId` filtering.
  - Scope all list reads to the current assignee.
  - Scope detail reads to the current assignee and map missing/non-assignee tasks to access-denied semantics.
  - Return only workflow task fields and workflow instance target fields.
  - Do not include workflow actions or Achievement business details in workflow todo responses.
  - Keep Achievement business detail reads behind `GET /achievements/:id` and its existing Step 4/Step 5 policy checks.
- Reason:
  - Workflow todo APIs should help the client find and act on assigned workflow tasks without becoming a bypass around Achievement detail authorization.
  - Assignee-scoped reads match the Step 6 concrete task assignment model.
  - Keeping payloads narrow avoids duplicating Achievement resource policy and secret-access rules in workflow read endpoints.
- Consequences:
  - Frontend todo screens can show workflow metadata and target ids first, then call the Achievement detail API when business detail is needed.
  - Step 6C is complete at the module-local HTTP level.
  - Step 6D can focus on root `AppModule` integration and Step 6 closure.
- Rollback:
  - If richer todo cards are required later, add a dedicated read model that explicitly reuses Achievement resource policies; do not join or expose Achievement details directly from workflow without a new plan.

## D032 - Step 6C-1 exposes workflow approve/reject only inside WorkflowModule

- Date: 2026-06-11
- Context: Step 6B completed backend service orchestration for submit, department approve/reject, and archive closure. Step 6C-1 exposes only the department review approve/reject actions over HTTP, while root `AppModule` integration is reserved for Step 6D.
- Decision:
  - Add `WorkflowController` only to `WorkflowModule`.
  - Expose only `POST /workflow/tasks/:taskId/approve` and `POST /workflow/tasks/:taskId/reject` in Step 6C-1.
  - Require `achievement:review_department` on both routes.
  - Use explicit `UserContextGuard` and `PermissionGuard`, not global `APP_GUARD`.
  - Import `IdentityModule` into `WorkflowModule` so the module-local controller can resolve the `UserContextGuard` dependency on `IDENTITY_ADAPTER`.
  - Keep todo list/detail APIs for Step 6C-2 and root AppModule wiring for Step 6D.
- Reason:
  - Approve/reject service orchestration already exists and is ready for HTTP exposure.
  - Todo list/detail requires a separate read-model boundary and should not be mixed into the action-controller step.
  - Keeping controller registration module-local allows HTTP tests without exposing workflow routes through root `AppModule` yet.
- Consequences:
  - Step 6C-1 adds route decorators under `apps/api/src/workflow`, but those routes are not root-app reachable until Step 6D.
  - Existing achievement AppModule tests continue to compile because `WorkflowModule` now has its local identity dependency satisfied.
  - Step 6C-2 can focus on assignee todo list/detail semantics without changing approve/reject routes.

## D031 - Step 6B-4 archive workflow closure stays behind Achievement archive boundary

- Date: 2026-06-11
- Context: After department approval, the Workflow instance remains `ACTIVE` with `currentStep=ARCHIVE`, while the existing Achievement archive route can already move `PENDING_ARCHIVE -> ARCHIVED`.
- Decision:
  - Keep the public archive operation in `AchievementService.archiveAchievement`.
  - Let `AchievementService.archiveAchievement` own the cross-repository Prisma transaction.
  - Add no-HTTP WorkflowService in-transaction helpers for archive readiness validation and workflow closure.
  - Write the `ARCHIVE` Workflow action as an instance-level action with `taskId=null`.
  - Reuse only `achievement:archive`; do not add a new permission code or policy scope.
- Reason:
  - Archive is an Achievement action already guarded by Step 4 RBAC and Step 5 HTTP mapping.
  - Workflow closure is a consistency side effect of the archive action, not a separate HTTP-facing operation in Step 6B-4.
  - Keeping the transaction owner in AchievementService avoids nested transactions and prevents archive from bypassing Step 4 permission checks.
- Consequences:
  - Missing active Workflow instance or wrong Workflow step/target is treated as 409-class invalid state.
  - No Workflow controller, new HTTP route, or root AppModule wiring is required for Step 6B-4.
  - Step 6C can focus on controller / HTTP API exposure for workflow tasks and todo behavior.

## D030 - Step 6B-3 department review orchestration stays in WorkflowService

- Date: 2026-06-11
- Context: Step 6B-3 implements department research secretary approve/reject after Step 6B-2 submit workflow creation. The user confirmed no HTTP route, no root AppModule change, no archive workflow closure, non-assignee/cross-department 403-class semantics, direct `AchievementRepository` provider in `WorkflowModule`, minimal return shape, required reject comment, and optional approve comment.
- Decision:
  - Implement `approveDepartmentReviewTask` and `rejectDepartmentReviewTask` in `WorkflowService`.
  - Let each method own one Prisma transaction across workflow task/action, workflow instance, and Achievement status transition.
  - Use assignee-scoped task lookup first, then Step 4 department policy with `achievement:review_department` before reading the target Achievement state.
  - Treat missing task by assignee and missing achievement by department policy as `WorkflowAccessDeniedError`.
  - Keep approve/reject return shape minimal: updated workflow task plus updated achievement state.
  - Require a trim-nonempty reject comment before opening the transaction; allow optional approve comment.
  - Provide `AchievementRepository` directly from `WorkflowModule` and import `AuthorizationModule` there, avoiding an `AchievementsModule` circular dependency.
- Reason:
  - Workflow approval is primarily a task/action/instance concern, but it must coordinate Achievement state atomically.
  - Keeping orchestration in `WorkflowService` avoids spreading workflow rules across the Achievement service while still reusing Achievement repository and Step 4 policy boundaries.
  - One transaction prevents partial states such as approved task with unadvanced Achievement, or rejected Achievement with a still-pending task.
- Consequences:
  - Step 6B-3 remains backend service-only; no external HTTP surface exists yet for approve/reject.
  - A later HTTP/API step must map `WorkflowAccessDeniedError`, `WorkflowInvalidStateError`, and `WorkflowInvalidPayloadError` explicitly.
  - Archive workflow completion remains a separate step because approve intentionally leaves workflow `ACTIVE/currentStep=ARCHIVE`.
- Rollback:
  - If the orchestration owner changes later, move the public entry methods behind a new application service in a dedicated step while keeping the repository transaction-client boundary and tests intact; do not alter schema or executed migrations without a new migration plan.

## D029 - Step 6B-2 submit owns workflow creation transaction

- Date: 2026-06-11
- Context: Step 6B-2 connects existing achievement submit behavior to workflow instance/task/action creation. The user confirmed that `AchievementsModule` may import `WorkflowModule`, root `AppModule` must not be changed, missing department reviewer should be 422-class business failure, active workflow conflict should be 409, and the single transaction should be owned by `AchievementService.submitDraft`.
- Decision:
  - Keep the existing `POST /achievements/:id/submit` route and change only its service behavior.
  - Add `WorkflowService` as a no-HTTP service for workflow-side submit preparation and creation.
  - Let `AchievementService.submitDraft` own one Prisma transaction and call AchievementRepository plus WorkflowService inside that transaction.
  - Import `WorkflowModule` into `AchievementsModule`, but do not modify root `AppModule`.
  - Select the first active department research secretary from stable ordering by `createdAt asc` and `id asc`.
  - Map missing department reviewer to `AchievementUnsupportedOperationError`, preserving existing 422-class controller behavior.
  - Map existing active workflow instance to `AchievementConflictError`, preserving existing 409-class controller behavior.
- Reason:
  - Achievement submit is the external API boundary and owns permissions, owner scope, and Achievement state semantics.
  - WorkflowService keeps workflow-specific lookup and creation logic out of AchievementService while avoiding new HTTP surface.
  - One outer transaction prevents partial submit states where Achievement is submitted but workflow records are missing, or workflow records exist without the status transition.
- Consequences:
  - Step 6B-3 can build department approve/reject orchestration on the established single-transaction pattern.
  - Existing submit route now has a stronger precondition: the submitter's department must have an active research secretary.
  - Root app wiring remains stable because workflow is only imported through `AchievementsModule`.
- Rollback:
  - If submit workflow creation must be disabled later, revert the `AchievementService.submitDraft` orchestration to the Step 5 behavior and keep `WorkflowService` unused until a new plan is approved; do not change schema or executed migrations.

## D028 - Step 6B-1 transaction-client repository boundary

- Date: 2026-06-10
- Context: Step 6B service orchestration will need to update Achievement status and Workflow instance/task/action records in one consistency boundary. Step 6B-1 intentionally does not implement service orchestration, but it must prepare repositories so future orchestration does not open nested Prisma transactions.
- Decision:
  - Keep public repository methods as standalone, transaction-owning methods for existing callers and focused repository tests.
  - Add `...InTransaction` variants that accept a caller-provided Prisma transaction client for Achievement and Workflow writes/reads needed by Step 6B.
  - Allow Achievement state transitions from `PENDING_DEPARTMENT_REVIEW` to `PENDING_ARCHIVE` and `DEPARTMENT_REJECTED`.
  - Allow Workflow instance `ACTIVE -> ACTIVE` transitions so approval can advance `currentStep` to `ARCHIVE` while the instance remains active.
  - Keep schema, migrations, seed, dependencies, AppModule wiring, controllers, and HTTP APIs unchanged in Step 6B-1.
- Reason:
  - Later submit/approve/reject service orchestration must keep Achievement, workflow task, workflow action, and workflow instance state consistent.
  - A caller-provided transaction client gives the service layer one outer transaction boundary while preserving repository encapsulation.
  - The state-machine additions are prerequisites for later approve/reject orchestration but do not execute business flow by themselves.
- Consequences:
  - Step 6B-2 can plan `AchievementService.submitDraft` workflow creation without changing repository transaction shape again.
  - Step 6B-3 can plan department approve/reject orchestration using the same transaction boundary.
  - Tests use fake Prisma clients with explicit casts where necessary; production repository transaction-client types remain strict.
- Rollback:
  - If the orchestration strategy changes, add new repository methods or service adapters in a follow-up step; do not modify executed migrations or weaken production transaction typing without a new decision.

## D027 - Step 6A workflow concrete assignee foundation

- Date: 2026-06-10
- Context: Step 6 begins the basic approval workflow. The user confirmed the minimal model: generate tasks for concrete department research secretary users, do not introduce role-pool or candidate-group tasks, and do not add a migration in Step 6A.
- Decision:
  - Use `WorkflowTask.assigneeId` as the Step 6 concrete todo assignee.
  - Keep the existing schema unchanged; no new candidate role/department fields are added.
  - Add workflow domain, DTO, repository, and fake Prisma tests only in Step 6A.
  - Keep `WorkflowModule` standalone and do not import it into `AppModule` until a later confirmed substep.
  - Do not implement service orchestration, controller, HTTP API, department approve/reject flow, or Achievement status advancement in Step 6A.
- Reason:
  - The current schema already supports concrete assignee tasks and active instance uniqueness.
  - Avoiding role-pool tasks keeps Step 6A small, testable, and migration-free.
  - Service orchestration needs a separate plan because it will coordinate workflow writes, Achievement state transitions, permissions, and concurrency.
- Consequences:
  - Step 6B must decide how to pick one or more concrete department research secretary users when creating review tasks.
  - If future requirements need pooled department tasks, a new migration and policy review will be required.
  - Step 6A repository tests remain fake-Prisma-only and do not prove real database writes.
- Rollback:
  - If concrete assignee tasks are rejected later, add a new migration for candidate assignee modeling and update workflow repository/service tests; do not modify the already executed initial migration.

## D026 - Step 5 final archive review boundary

- Date: 2026-06-10
- Context: Step 5A, 5B-1, 5B-2, 5C, 5D-1, and 5D-2 are complete. The final archive review checks memory-bank consistency without changing application source, Prisma files, dependencies, migrations, seed, or runtime configuration.
- Decision:
  - Treat the Step 5D-2 / Step 5 closure sections in `progress.md` and `evidence.md` as the authoritative current status.
  - Keep older dated progress and evidence sections as historical substep records.
  - Record Step 5 as DONE and Step 6 as TODO.
  - Keep workflow, department review/reject/approve/todo, fees, reminders, attachments, search, dashboard, frontend, and real login/SSO out of Step 5.
  - Do not run migrate or seed during final archive review.
- Reason:
  - Step 5 is a backend phase-one achievement registration slice; Step 6 workflow must remain a separate planning and implementation boundary.
  - Historical substep notes are useful evidence, but the current status must be explicit to avoid resuming from stale next-step text.
- Consequences:
  - Future work should start with Step 6 pre-plan confirmation, not direct workflow implementation.
  - Any workflow module, workflow instance/task/action write, department review, rejection, approval, or todo behavior requires a new Step 6 plan.
- Rollback:
  - If Step 5 scope is reopened, add a new decision and progress entry rather than rewriting historical evidence.

## D025 - Step 5D-2 Achievement root module integration boundary

- Date: 2026-06-10
- Context: Step 5D-1 completed the `AchievementController` inside `AchievementsModule`, but the module was not yet connected to the root application. Step 5D-2 closes Step 5 by exposing the module through `AppModule` and verifying the root module wiring.
- Decision:
  - Import `AchievementsModule` in root `AppModule`.
  - Do not register global `APP_GUARD`.
  - Do not modify `main.ts`.
  - Do not introduce a global `ValidationPipe`; keep achievement DTO validation local to `AchievementController`.
  - Use AppModule-level HTTP tests with `AchievementService` and `PrismaService` provider overrides.
  - Keep real `UserContextGuard` and `PermissionGuard` active in the AppModule-level tests.
  - Mark Step 5 overall DONE after AppModule integration and verification.
  - Keep Step 6 workflow TODO and out of scope.
- Reason:
  - Root module import is the narrowest change required to expose the already tested achievement routes.
  - Avoiding global guards and global pipes prevents accidental behavior changes to unrelated routes.
  - Provider overrides verify Nest wiring and HTTP behavior without accessing a real database.
- Consequences:
  - The six achievement routes are now part of the root API module.
  - `/health` remains available.
  - Future workflow behavior must be introduced separately in Step 6.
- Rollback:
  - Remove `AchievementsModule` from `AppModule` imports in a dedicated patch if route exposure must be paused; leave domain, repository, service, controller, tests, schema, migrations, and seed unchanged.

## D024 - Step 5D-1 Achievement HTTP error mapping and guard boundary

- Date: 2026-06-10
- Context: Step 5D was split into 5D-1 and 5D-2. Step 5D-1 exposes the achievements controller inside `AchievementsModule` only, while leaving `AppModule` integration and Step 5 closure for a later confirmation.
- Decision:
  - Use explicit `UserContextGuard` and `PermissionGuard` on `AchievementController`.
  - Do not register global `APP_GUARD`.
  - Do not modify `main.ts`; use controller-local `ValidationPipe` for DTO validation.
  - Use `achievement:read_own` as the static permission for `GET /achievements/:id`; resource visibility and secret access remain in `AchievementService`.
  - Map missing user context to 401.
  - Map static permission denial, `AchievementPermissionDeniedError`, and `AchievementAccessDeniedError` to 403.
  - Map `AchievementNotFoundError` to 404.
  - Map `AchievementConflictError` and `AchievementInvalidStateError` to 409.
  - Map `AchievementUnsupportedOperationError` and `AchievementInvalidPayloadError` to 422.
  - Map DTO validation errors to 400.
- Reason:
  - Keeps the route layer explicit and testable without changing global application behavior.
  - Preserves service-layer resource policy semantics, including secret access denial as 403.
  - Avoids prematurely exposing the module through `AppModule` before Step 5D-2 planning.
- Consequences:
  - Achievements routes exist in the module and tests, but are not active in the application root until 5D-2.
  - HTTP tests must override providers and avoid real repository/database access.
  - Future Step 5D-2 must decide the final `AppModule` integration and Step 5 closure evidence.
- Rollback:
  - Remove controller registration from `AchievementsModule` and the controller file changes in a dedicated follow-up patch if the route boundary changes; do not alter schema, migrations, seed, or global guards.

## D001 - 任务等级判定为 L

- 日期：2026-06-08
- 背景：项目是新建生产级业务系统，覆盖多角色、多模块、数据库、权限、安全、审批、费用、附件、审计和外部接口。
- 选项：
  - M：按完整功能处理，但文档和专项检查较轻。
  - L：按专业级、多模块、数据库和安全系统处理。
- 选择：L。
- 原因：涉及 RBAC、部门数据隔离、涉密访问、附件权限、审计日志、数据库 schema 和生产级质量门禁。
- 后果：必须维护 memory-bank，走 SDD，补充架构、质量门禁和证据。
- 回滚方案：如果后续只做静态原型，可降级为 M，但必须先更新 product/feature/implementation 计划。

## D002 - 一期/二期范围拆分

- 日期：2026-06-08
- 背景：原需求覆盖成果全生命周期、转化、费用、报表、移动端、外部接口和运维能力，范围较大。
- 选择：一期做基础刚需版，二期做全流程深化版。
- 一期包含：成果登记、基础审批、RBAC 与部门隔离、费用台账与预警、基础检索、基础看板、审计、附件、DOI/邮件 adapter。
- 二期包含：成果转化、完整财务审批、自定义报表、引文分析、真实外部接口、移动端、监控灾备、十万级压测。
- 原因：优先解决人工台账、缴费逾期、基础统计三大痛点。
- 后果：一期交付更聚焦，但需要清楚标注延后能力。

## D003 - 推荐技术栈

- 日期：2026-06-08
- 背景：需要企业级管理 UI、模块化后端、可靠关系型数据库、权限安全和搜索能力。
- 选择：React + TypeScript + Vite + Ant Design；NestJS + TypeScript；PostgreSQL + Prisma；Redis + BullMQ；Meilisearch；S3-compatible storage adapter；Playwright。
- 原因：成熟、可维护、适合管理系统和模块化业务；便于测试、迁移和 adapter 隔离。
- 后果：需要 Node/TypeScript 工程能力，后续脚手架初始化时确认 pnpm 和本地环境。
- 回滚方案：如院内已有强制技术栈，更新 `tech-stack.md` 和 `architecture.md`，保留领域边界和 adapter 原则。

## D004 - 外部 API 一期采用 adapter/mock

- 日期：2026-06-08
- 背景：DOI、邮件、HR/SSO、财务、专利状态等接口依赖外部系统和账号权限，可能阻塞一期。
- 选择：一期实现接口契约、配置、调用日志、失败降级和 mock provider；真实联调延后。
- 原因：不让外部系统阻塞核心台账、审批、费用预警和权限闭环。
- 后果：一期演示可用，但验收时需明确哪些接口是 mock。
- 回滚方案：真实接口可替换 adapter，不修改核心业务模型。

## D005 - 业务数据不硬删除

- 日期：2026-06-08
- 背景：需求要求操作留痕、历史归档、合规审计和成果注销/作废。
- 选择：成果、费用、附件等业务数据不硬删除；使用状态流转、作废原因、版本和审计日志表达变化。
- 原因：符合审计和合规要求，降低误删风险。
- 后果：查询必须默认过滤作废/归档状态，审计和导出需注意权限。
- 回滚方案：如未来确需删除，必须设计单独的合规销毁流程，并经用户明确确认。

## D006 - 根脚本显式使用 Corepack pnpm

- 日期：2026-06-08
- 背景：Step 2 依赖安装和门禁验证时，本机 `pnpm` 不存在全局命令，但 `corepack pnpm --version` 可返回 `9.15.9`。
- 选择：根 `package.json` 的 `dev`、`typecheck`、`test`、`build` 脚本显式使用 `corepack pnpm`。
- 原因：保证项目命令依赖 `packageManager` 和 Corepack，不要求用户全局安装 pnpm，也不切换 npm/yarn。
- 后果：执行根命令时需要 Corepack 可用；当前已验证 `corepack pnpm install`、`lint`、`typecheck`、`test`、`build` 均通过。
- 回滚方案：如果未来开发环境统一安装全局 pnpm，可保留当前写法；如需改回裸 `pnpm`，必须先确认所有开发/CI 环境均可用并更新 `tech-stack.md`。

## D007 - Step 3 拆分为 3A / 3B / 3C / 3D

- 日期：2026-06-08
- 背景：原 Step 3 同时包含 schema 设计、Prisma model、migration、领域类型和 seed，范围过大且容易混入后续业务逻辑。
- 选择：拆成 3A schema 边界确认、3B Prisma 建模、3C migration 生成与审查、3D 小样本 seed 与证据。
- 原因：数据库基础属于高风险 L 级任务，必须分离设计确认、建模、迁移和数据初始化。
- 后果：每个子步骤都有单独验证和人工确认点；截至 Step 3 收尾归档，3A/3B/3C/3D 均已完成。
- 回滚方案：如后续发现拆分过细，可合并执行 3B/3C，但必须先确认 `DATABASE_URL` 和迁移风险。

## D008 - 数据库命名采用 snake_case，Prisma 采用 TypeScript 友好命名

- 日期：2026-06-08
- 背景：PostgreSQL 表字段需要稳定、清晰，TypeScript 代码需要 PascalCase/camelCase 可读性。
- 选择：数据库表名和字段名使用 snake_case；Prisma Model 和字段使用 PascalCase/camelCase，通过 `@@map`、`@map` 映射。
- 原因：兼顾数据库规范和 TypeScript 开发体验。
- 后果：3B 建模时需要完整维护映射，避免数据库命名和 Prisma 命名漂移。
- 回滚方案：不建议回滚；如院内 DBA 有强制规范，再统一调整并记录迁移影响。

## D009 - 本地账号凭证独立建表

- 日期：2026-06-08
- 背景：一期需要预留本地账号，但当前不实现登录逻辑。
- 选择：设计 `user_credentials` 或等价独立凭证表，不把 `password_hash` 直接放入 `users`。
- 原因：用户主数据和认证凭证生命周期不同，后续接入 SSO 或禁用本地登录时更容易隔离。
- 后果：Step 3 只建数据结构；Step 4 再实现 Auth/RBAC。
- 回滚方案：如果一期最终完全不需要本地账号，可保留空表或在后续迁移中停用，不硬删已建结构。

## D010 - 业务唯一键基于 normalized 字段

- 日期：2026-06-08
- 背景：DOI、专利申请号、授权号、软著登记号可能存在大小写、空格、分隔符等录入差异。
- 选择：为 DOI、申请号、授权号、登记号增加 normalized 字段，并基于 normalized 字段设计唯一约束。
- 原因：降低重复登记风险，避免直接用原始输入做唯一判断。
- 后果：Step 3B 先建字段和约束；具体 normalized 生成规则在后续业务层实现。
- 回滚方案：如某类编号存在合法重复，需要在 3B 前调整唯一约束范围。

## D011 - 涉密授权独立建 resource_access_grants

- 日期：2026-06-08
- 背景：一期需要涉密成果和附件授权访问，但 Step 3 不实现权限逻辑。
- 选择：建立 `resource_access_grants` 作为涉密或专项授权预留表。
- 原因：避免把授权例外分散写入成果、附件或用户表，便于 Step 4 统一 policy 处理。
- 后果：Step 3 只建数据结构；授权判断、过期处理和审计在后续步骤实现。
- 回滚方案：如一期涉密授权简化为角色级访问，可保留该表作为未来扩展。

## D012 - Step 3 seed 只做小样本

- 日期：2026-06-08
- 背景：1 万条数据主要服务基础检索性能验证，不是 schema 建模的必要前提。
- 选择：Step 3D seed 只做小样本基础数据，1 万条检索验证数据延后到 Step 9。
- 原因：降低 Step 3 复杂度，避免性能数据污染早期业务验证。
- 后果：Step 4/5 可用小样本做权限和流程开发；检索性能证据后置。
- 回滚方案：如 Step 4/5 需要更多覆盖数据，可追加中等规模 seed，但仍不在 3D 做 1 万条性能集。

## D013 - 3C 前再检查 DATABASE_URL 和本地 PostgreSQL

- 日期：2026-06-08
- 背景：当前不假设本地 PostgreSQL 和 `DATABASE_URL` 已准备好。
- 选择：3A/3B 可先进行；3C 创建 migration 前再检查本地 PostgreSQL 和连接串。
- 原因：schema 设计和 Prisma validate 不应被数据库连接准备情况阻塞，但 migration 必须依赖真实连接。
- 后果：3B 只运行 schema validate、lint 和 typecheck；3C 单独处理数据库连接风险。
- 回滚方案：如 3B 前就发现 Prisma validate 需要环境变量，可使用非敏感本地占位连接串并记录原因。

## D014 - user_roles 使用 scope_key 保证作用域唯一性

- 日期：2026-06-08
- 背景：`user_roles.department_id` 在全局角色时为空；PostgreSQL 的普通唯一约束允许多个 `NULL`，会导致 `user_id + role_id + scope_type + department_id` 无法可靠防止重复全局角色。
- 选择：在 `user_roles` 中增加非空 `scope_key`，全局作用域默认为 `GLOBAL`，部门作用域由业务层写入稳定部门标识；唯一约束使用 `user_id + role_id + scope_type + scope_key`。
- 原因：这个约束可由 Prisma 直接表达，不需要依赖 partial unique index。
- 后果：Step 4 实现角色分配时必须维护 `scope_key` 和 `department_id` 的一致性。
- 回滚方案：如后续决定完全用 SQL partial unique index 表达角色作用域唯一性，可迁移移除 `scope_key`，但需要同时补充 DB checklist 和兼容策略。

## D015 - 本项目使用独立本地开发 PostgreSQL 容器

- 日期：2026-06-08
- 背景：本机已有 n8n compose 使用的 PostgreSQL 容器，不能复用、修改、停止或读取其敏感配置。
- 选择：为本项目创建独立 `docker-compose.dev.yml`、独立服务名 `research-postgres-dev`、独立容器名 `research-achievement-postgres-dev`、独立 volume `research_achievement_pgdata_dev`，宿主机使用非默认端口 `55432`。
- 原因：避免和现有 n8n/content-postgre 数据库冲突，降低误操作风险。
- 后果：3C migration 只面向本项目本地开发数据库；进入 3C 前必须确认 `DATABASE_URL` 指向 localhost:55432 的开发库。
- 回滚方案：如未来接入院内开发数据库，先停止使用该 compose 配置并更新 `.env`，不得自动迁移或删除本地 volume。

## D016 - init_core_schema 使用手写 partial unique index 补足 Prisma 表达能力

- 日期：2026-06-08
- 背景：Prisma schema 不能准确表达 PostgreSQL partial unique index，例如只约束未撤销授权或 active 审批实例。
- 选择：在 `20260608080155_init_core_schema/migration.sql` 中手写两个 partial unique index：
  - `resource_access_grants_active_unique_idx`：同一资源、授权对象和授权类型在 `revoked_at IS NULL` 时唯一。
  - `workflow_instances_active_target_unique_idx`：同一目标对象在 `status = ACTIVE` 时只允许一个审批实例。
- 原因：这些约束属于数据库一致性边界，不能只依赖后续业务逻辑。
- 后果：后续 Prisma schema 无法完整表示这两个约束，migration SQL review 必须把它们列为保留项。
- 回滚方案：如未来业务规则变化，必须新增 migration 调整或删除对应 index，不修改已执行 migration。

## D017 - 添加 @prisma/client 作为运行依赖

- 日期：2026-06-08
- 背景：首次执行 `prisma migrate dev` 时，migration 已应用成功，但自动 generate 阶段尝试调用裸 `pnpm add @prisma/client`，因当前环境无全局 pnpm 导致命令失败。
- 选择：使用 `corepack pnpm add @prisma/client@6.19.3 -w` 显式添加 Prisma Client 依赖，并重新执行 `prisma generate`。
- 原因：项目使用 Prisma Client 生成器，`@prisma/client` 是 schema/migration 后续开发的必要依赖；使用 Corepack 可避免全局 pnpm 依赖。
- 后果：`package.json` 和 `pnpm-lock.yaml` 更新；后续 `prisma generate` 可稳定通过。
- 回滚方案：不建议回滚；如未来升级 Prisma，应同步升级 `prisma` 和 `@prisma/client` 并重新运行门禁。

## D018 - Step 3D 使用最小 CJS seed 脚本

- 日期：2026-06-08
- 背景：Step 3D 只需要本地开发最小演示数据，不需要引入新的 TypeScript runner。
- 选择：新增 `prisma/seed.cjs`，并在 `package.json#prisma.seed` 配置 `node prisma/seed.cjs`。
- 原因：复用 Node 和 Prisma Client 即可执行 seed，避免新增 `tsx` 等额外工具链。
- 后果：Prisma 6 会提示 `package.json#prisma` seed 配置在 Prisma 7 中弃用；当前不阻塞。seed 文件为 CJS，使用文件级 ESLint 例外允许 `require()`。
- 回滚方案：升级 Prisma 7 或统一 ESM/TypeScript seed 时，迁移到 `prisma.config.ts` 和对应 seed runner。

## D019 - Step 3 数据库基础整体归档

- 日期：2026-06-08
- 背景：Step 3A/3B/3C/3D 已完成，需要形成明确边界，避免下一步误把 Step 4 业务逻辑混入数据库收尾。
- 选择：Step 3 整体标记 DONE；归档 Prisma schema、`20260608080155_init_core_schema` migration、`prisma/seed.cjs` seed、本项目专用 PostgreSQL 容器信息和验证证据。
- 原因：Step 3 的交付物已经满足一期数据库基础要求，下一步应先做 Step 4 计划确认，而不是直接实现 RBAC/Auth。
- 后果：后续不得直接修改已执行 migration；数据库变更必须新增 migration。Step 4 前需要重新审查 Auth/RBAC、部门隔离、涉密授权和审计边界。
- 回滚方案：如 Step 4 前发现 schema 缺口，先评估是否新增 Step 3E/补充 migration；不得使用 reset 或清空数据方式处理。

## D020 - Step 4A 权限基础主数据与用户上下文边界

- 日期：2026-06-08
- 背景：Step 4 总体计划确认后复查发现仍是方向稿，需要先锁定 Step 4A 的可执行边界，避免直接进入完整 RBAC、涉密、附件、审计或业务 API。
- 选择：
  - 新增 `DEPARTMENT_ADMIN` 角色，作用域仅 `DEPARTMENT`。
  - 新增细粒度权限点：`user_context:read`、`attachment:read_metadata`、`attachment:download`、`audit:read_masked`、`department:read_department`、`fee:read_department`、`resource_grant:create`、`resource_grant:revoke`。
  - 不新增全局 `secret:read`，涉密读取主要通过 `resource_access_grants` 的 `SECRET_READ` 授权。
  - `SYSTEM_ADMIN` 拥有 `system:config`、`achievement:archive`、`audit:read_masked`，不默认拥有 `secret:grant`。
  - 审计人员只能看脱敏日志，不能直接看业务详情。
  - Step 4 测试场景数据使用测试内 fixture，不污染 seed。
  - Step 4A 可改 `seed.cjs`，但仅补角色、权限和角色权限主数据。
- 原因：权限和数据隔离是高风险安全边界，必须先形成可测试的用户上下文与权限常量，再进入 4B/4C 策略实现。
- 后果：
  - 旧 `audit:read` 与 `secret:grant` 在 seed 中保留但标记为 `ARCHIVED`，不删除历史主数据。
  - dev/test identity adapter 可通过 `X-Demo-User-Id` 加载演示用户上下文，但生产环境不得依赖该 header。
  - 后续 4B/4C 必须只使用 active permissions 构建权限集合。
- 回滚方案：如角色或权限命名需要调整，新增或归档主数据，不删除历史权限记录；如生产认证接入，替换 identity adapter，不改变 `UserContext` 契约。

## D021 - Step 4B RBAC 与部门隔离策略边界

- 日期：2026-06-08
- 背景：Step 4B 需要把 4A 的 `UserContext` 和权限常量转成实际策略判断，同时避免提前进入涉密、附件、审计或 API guard。
- 选择：
  - `RbacPolicyService` 只按 `UserContext.permissionCodes` 做显式权限判断，`SYSTEM_ADMIN` 不走超级管理员绕过。
  - `DepartmentScopeService` 只做精确 `departmentId` 匹配，不展开下级部门。
  - `PolicyQueryFactory` 只覆盖 achievement / fee / department 这类直接带本人或部门字段的资源。
  - 无权限 where 统一返回 `{ id: { in: [] } }`，避免返回全量数据。
  - `achievement:archive` 在 Step 4B 只作为动作权限存在，不赋予系统管理员全量业务详情读取能力。
  - `AuthorizationModule` 可创建但不接入 `AppModule`，guard/decorator 和 API 集成测试留到 Step 4D。
- 原因：权限策略属于高风险安全边界，需要先以纯服务和单元测试固定行为，再分步骤叠加涉密、附件、审计和 API 接入。
- 后果：
  - Step 4B policy 不访问数据库、不修改 seed、不依赖测试场景数据。
  - 后续业务查询必须复用 `PolicyQueryFactory` 或同等策略，不允许先查全量再内存过滤。
  - Step 4C 必须在现有基础 where 之上叠加 `resource_access_grants`、附件和审计脱敏策略。
- 回滚方案：如未来需要部门继承，应新增明确的部门树展开服务和测试矩阵，不直接改变现有精确部门匹配语义。

## D022 - Step 4C 涉密、附件和审计只读策略边界

- 日期：2026-06-08
- 背景：Step 4C 需要在 4B 的基础权限和部门过滤之上叠加 `resource_access_grants`、附件下载例外和审计脱敏策略，同时避免提前进入 guard/decorator、API 集成或业务模块。
- 选择：
  - `UserContext` 增加 `roleIds`，用于支持 `ROLE` 类型 `resource_access_grants`。
  - `ResourceGrantPolicyService` 统一判断 grant 是否有效：资源类型、资源 ID、授权类型、授权对象、`ACTIVE` 状态、未撤销、已开始、未过期均必须满足。
  - `DEPARTMENT` grant 只匹配用户当前 `departmentId`，不匹配 `scopedDepartmentIds`，避免把角色管理范围误当组织成员关系。
  - `SECRET` / `CONFIDENTIAL` 资源 owner 不自动可读，仍需有效 `SECRET_READ` 授权。
  - 涉密附件下载允许单附件 `ATTACHMENT_DOWNLOAD` 窄授权；该授权只允许下载指定附件，不代表可读业务详情、附件元数据或其他附件，也不等于 `SECRET_READ`。
  - 审计读取只允许 `audit:read_masked`，未脱敏审计读取在 Step 4C 统一拒绝。
  - 审计脱敏采用严格策略：不返回原始 `oldValue` / `newValue`，默认隐藏业务值，只保留字段名、必要 ID、时间、安全枚举和脱敏摘要。
- 原因：涉密、附件和审计都属于高风险安全边界，必须以集中 policy 和单元测试固定语义，再由 Step 4D 接入请求链路。
- 后果：
  - Step 4C 不访问数据库、不修改 seed、不新增测试场景数据；业务服务后续需要把数据库读取到的 grant 记录传入 policy。
  - Step 4D 接入 guard/decorator 时必须保留这些语义，不能用系统管理员、owner 或部门 scoped role 绕过涉密授权。
  - 附件下载 API 后续必须区分 metadata、download、business detail 三类访问，不得用 `ATTACHMENT_DOWNLOAD` 扩权。
- 回滚方案：如未来需要 owner 可读或部门 grant 继承，必须新增明确需求、更新测试矩阵和决策记录，不直接改变现有默认拒绝语义。

## D023 - Step 4D Guard / Decorator 接入与测试边界

- 日期：2026-06-10
- 背景：Step 4D 需要把 4A-4C 的用户上下文、RBAC 和 policy 能力接入 Nest 请求链路，同时不能提前实现成果登记、附件下载、审计页面或真实登录/SSO。
- 选择：
  - 新增 `@CurrentUser()` 和 `@RequirePermissions()` 作为 controller 层显式声明入口。
  - 新增 `UserContextGuard` 和 `PermissionGuard`，分别负责加载用户上下文和检查静态权限。
  - `AuthorizationModule` 接入 `AppModule`，但不注册全局 `APP_GUARD`；后续业务 API 必须显式使用 `@UseGuards`。
  - HTTP 集成测试使用 spec 内 test-only controller，不新增运行时 `/me` 或其他正式业务 API。
  - 新增 `@nestjs/testing`、`supertest`、`@types/supertest` 作为 API 测试 devDependencies。
  - `ResourcePolicyGuard` 本步骤不实现，只记录边界，留到成果、附件、审计真实 API 按资源接入时实现。
  - guard/identity 运行时依赖采用显式 `@Inject(...)`，避免在测试模块和运行模块中依赖解析不稳定。
- 原因：Step 4D 的目标是验证权限内核能进入真实 HTTP 请求链路，而不是引入业务 API；显式 guard 可以避免早期全局拦截器影响尚未设计的路由和健康检查。
- 后果：
  - Step 4 已具备用户上下文、权限 metadata、401/403 和 allow 的基础请求链路证据。
  - 后续 Step 5/7 等业务 API 仍必须单独接入 resource policy、where factory 和审计策略，不能假设当前 guard 自动完成资源级隔离。
  - 生产环境仍不得依赖 `X-Demo-User-Id`；真实登录/SSO 需要替换或扩展 identity adapter。
- 回滚方案：如未来决定使用全局 guard，应先设计公开路由白名单、健康检查例外、真实认证 adapter 和 API 级测试矩阵，再修改 `AppModule` provider 注册方式。
## D125 - Step 46R commit scope excludes local evidence/helper artifacts

- Date: 2026-06-27
- Context: Step 46R authorizes a local commit after review, while the working tree also contains old local evidence/helper artifacts and Step 46G browser screenshots/scripts.
- Decision:
  - Commit only Step 46 source, schema, migration, tests, and memory-bank records.
  - Exclude `.local-step44h/`, `.local-step45c4/`, `.local-step46g/`, `apps/api/deploy/artifacts/test-attachment-storage/**`, and `local-prod-preview-proxy.cjs`.
  - Keep the local artifacts in the working tree; do not delete or clean them in this Step.
- Reason:
  - Local screenshots and helper scripts are evidence artifacts, not production source.
  - The Step explicitly forbids deletion/cleanup and does not require committing local artifacts.
- Consequence:
  - The local commit remains focused on account lifecycle implementation and review records.
  - Untracked local artifacts remain visible after the commit for manual inspection or later cleanup under a separately authorized Step.
