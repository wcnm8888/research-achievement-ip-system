# Production Cutover Runbook

## Scope

This runbook covers the single VPS production cutover route for the research achievement management system.

- Production domain: `production.wangyimin.cn`
- API route strategy: same-origin `/api`
- Deployment model: Docker Compose production stack.
- Production compose file: `docker-compose.production.yml`
- Production API local port: `127.0.0.1:14001 -> 3000`
- Production Web local port: `127.0.0.1:18081 -> 80`
- Current demo/staging deployment will be replaced by production during cutover.
- This document is a runbook only. It is not evidence that production is configured, deployed, or accepted.

## Hard Boundaries

- Do not use `X-Demo-User-Id` as production authentication.
- Do not output real secrets, passwords, cookies, session tokens, certificates, private keys, or full connection strings.
- Do not commit `.env.production` or any real VPS environment file.
- Do not run production writes unless a separate write-acceptance step is explicitly authorized.
- Do not treat demo/staging evidence as production/live smoke evidence.
- Do not run `docker-compose.demo.yml` as the production stack.
- Do not remove demo containers, images, volumes, or directories until production `GO` and explicit cleanup confirmation.
- Do not treat `memory-bank/import-job-history-production-readonly-preflight-runbook.md` as production apply authorization, production/VPS access authorization, or migration execution authorization.
- Do not treat `memory-bank/import-job-item-production-readonly-preflight-runbook.md` as production apply authorization, production/VPS/DB access authorization, or migration execution authorization.

## Production Environment Preparation

Prepare production environment variables locally on the VPS only.

Required values:

- `NODE_ENV=production`
- `PORT=3000`
- `POSTGRES_DB=<PRODUCTION_DATABASE_NAME>`
- `POSTGRES_USER=<PRODUCTION_DATABASE_USER>`
- `POSTGRES_PASSWORD=<GENERATED_ON_VPS>`
- `DATABASE_URL=<VPS_LOCAL_DATABASE_URL>`
- `SESSION_SECRET=<GENERATED_ON_VPS>`
- `AUTH_BOOTSTRAP_ENABLED=false`
- `CORS_ALLOWED_ORIGIN=https://production.wangyimin.cn`
- `VITE_API_BASE_URL=/api`
- `LOG_LEVEL=info`

Rules:

- Generate `SESSION_SECRET` on the VPS.
- Generate `POSTGRES_PASSWORD` on the VPS.
- Store `DATABASE_URL` only on the VPS. For Compose, it should target the production Postgres service on the internal Docker network.
- Keep `VITE_API_BASE_URL=/api` for same-origin production routing.
- If CORS is enabled, allow only `https://production.wangyimin.cn`.
- Do not set a cookie domain unless a later reviewed design requires it.

## Docker Compose Production Stack

Use `docker-compose.production.yml` for production.

Expected stack properties:

- Compose project name: `research-achievement-production`.
- Production API: `127.0.0.1:14001 -> 3000`.
- Production Web: `127.0.0.1:18081 -> 80`.
- Production Postgres: internal Docker network only, no public port binding.
- Production database volume: `research_achievement_production_pgdata`.
- Production network: `research_achievement_production`.
- Web build arg: `VITE_API_BASE_URL=/api`.
- Env file: `.env.production`, stored only on the VPS.

Do not reuse demo ports, demo env files, demo database volumes, or demo Compose project names for production.

## Backup Prerequisites

Retention, encryption, offsite storage, and restore-drill boundaries are defined in
`deploy/backup-retention-encryption-offsite-policy.md`. That policy is required
reading before any production backup acceptance, offsite upload, production cleanup,
or restore drill Step.

Production backup readiness levels and acceptance checklist are defined in
`deploy/production-backup-readiness-checklist.md`. Do not claim production
backup-ready until that checklist is satisfied with redacted production/VPS evidence.

Before migration or deployment:

- Confirm the target is the production VPS and production database.
- Create a production database backup.
- Confirm the backup set covers both the Postgres dump and attachment binary artifacts, or record the gap as a `NO_GO` / `CONDITIONAL_GO` backup-readiness issue.
- Confirm production backup encryption and offsite status using redacted evidence only.
- Back up the current demo/staging application directory and service configuration if rollback to demo/staging is required.
- Record only脱敏 backup evidence: timestamp, target summary, result, and operator confirmation.
- Do not record database passwords, full paths containing secrets, or full connection strings.

## Migration Prerequisites

Before running production migration:

- Confirm `DATABASE_URL` points to the intended production database using a脱敏 target summary.
- Confirm backup exists and restore path is known.
- Confirm migration files have been reviewed.
- For the employee-number migration, review `deploy/employee-no-production-migration-readiness.md` before any production `prisma migrate deploy`, real-data preflight, or backfill.
- Confirm no demo/staging seed data will be imported as production data.
- Run `prisma migrate deploy` only in the authorized production migration step.
- With Docker Compose, prefer running migration through the production API image after the production env file is in place:

```bash
docker compose -f docker-compose.production.yml run --rm api corepack pnpm exec prisma migrate deploy
```

Do not run migration against demo/staging Compose or any unconfirmed database target.

## Import Job History Readonly Preflight Reference

If import task history readiness is in scope for a production readiness review,
first review `memory-bank/import-job-history-production-readonly-preflight-runbook.md`.

That document is a read-only preflight runbook for `ImportJob` / `ImportRun`,
history API health, `system:config` permission confirmation, and Web visibility
checks. It is a reference for discovery and boundary alignment only.

It is not:

- production apply authorization;
- production/VPS access authorization;
- production DB access authorization;
- migration execution authorization;
- real-data import authorization;
- retry, delete, cleanup, rollback, download, or export authorization.

Do not paste or record `DATABASE_URL`, passwords, tokens, cookies, connection
strings, raw production sample ids, raw audit ids, raw CSV, personal identifiers,
or credentials in chat, docs, logs, screenshots, or commits while using that
runbook.

If `ImportJobItem` row-level safe history readiness is separately in scope,
also review `memory-bank/import-job-item-production-readonly-preflight-runbook.md`.

That document is distinct from the aggregate import-history runbook above:

- `memory-bank/import-job-history-production-readonly-preflight-runbook.md`
  covers `ImportJob` / `ImportRun` aggregate history readiness.
- `memory-bank/import-job-item-production-readonly-preflight-runbook.md`
  covers `ImportJobItem` row-level safe history readiness only.

The `ImportJobItem` runbook is a read-only reference for migration-state,
`import_job_items` table-structure, GET-only item API, response allowlist, and
Web aggregate-only boundary checks. It is not production apply authorization,
production/VPS/DB access authorization, migration execution authorization, DB
write authorization, real import authorization, Web row-level display
authorization, cleanup/rollback authorization, or export/download
authorization.

While using the `ImportJobItem` runbook, do not paste or record `DATABASE_URL`,
passwords, tokens, cookies, connection strings, raw production sample ids, raw
item ids, `targetId`, `jobId`, `runId`, raw CSV, personal identifiers,
achievement identifiers, account identifiers, or credentials in chat, docs,
logs, screenshots, or commits.

## Foundation Seed

After migration succeeds and before bootstrap admin initialization, run the production foundation seed.

Command:

```bash
docker compose -f docker-compose.production.yml run --rm api corepack pnpm run prisma:seed:foundation
```

Rules:

- Confirm `DATABASE_URL` points to the intended production database using a non-sensitive target summary.
- Do not output the full `DATABASE_URL`.
- Foundation seed writes only Department, Role, Permission, and RolePermission data.
- Foundation seed must not create users, credentials, sessions, login attempts, achievements, fees, workflow tasks, attachments, or demo business data.
- Foundation seed must be idempotent.
- Record only redacted counts after success: departments, roles, permissions, rolePermissions, users, sessions, and business data counts.
- If foundation seed fails, mark `NO_GO` immediately and do not continue to bootstrap.

## Bootstrap Admin Flow

Use bootstrap only for first admin initialization.

1. Temporarily set `AUTH_BOOTSTRAP_ENABLED=true` on the VPS.
2. Start or reload the API with production env.
3. Create the first admin through `POST /api/auth/bootstrap`.
4. Do not record the admin password, session token, cookie, or raw request body.
5. Set `AUTH_BOOTSTRAP_ENABLED=false`.
6. Restart or reload the API.

## Bootstrap Close Verification

After closing bootstrap:

- Verify bootstrap is no longer usable.
- Acceptable evidence:
  - bootstrap disabled error, or
  - duplicate bootstrap returns 409 because active `SYSTEM_ADMIN` exists.
- Record only status code and脱敏 conclusion.

## HTTPS And Secure Cookie Smoke

Production must use HTTPS.

Verify:

- `https://production.wangyimin.cn` loads over HTTPS.
- Login returns `Set-Cookie` for `research_ip_session`.
- Cookie attributes include `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`.
- Browser automatically sends the cookie on `GET /api/auth/me`.
- Logout invalidates the session and `GET /api/auth/me` returns 401.

Do not record cookie values or session tokens.

## GET-only Production Readonly Smoke

Readonly smoke must be explicitly authorized before execution.

Suggested GET-only checks:

- `GET /api/health`
- `GET /api/auth/me`
- readonly dashboard or summary endpoint
- readonly achievement list endpoint
- readonly search endpoint
- readonly workflow tasks endpoint
- readonly masked audit logs endpoint for authorized admin

If import task history readonly checks are explicitly authorized as part of
production smoke, use `memory-bank/import-job-history-production-readonly-preflight-runbook.md`
as the boundary reference. Keep the check GET-only, record only aggregate status,
counts, HTTP status, and safe machine codes, and skip detail checks unless a safe
sample alias is separately authorized.

If `ImportJobItem` row-level safe history readonly checks are explicitly
authorized as part of production smoke, use
`memory-bank/import-job-item-production-readonly-preflight-runbook.md` as the
separate boundary reference. Keep the check read-only and limited to
migration-state, table-structure, GET-only item API, response allowlist, and Web
aggregate-only checks. Do not execute migrations, run real imports, write to the
database, enable Web row-level display, export, download, or record raw item
identifiers.

Do not run POST, PATCH, PUT, DELETE, imports, exports, notifications, approvals, or production writes in readonly smoke.

## Write Acceptance Boundary

Necessary production write acceptance requires a separate authorization step.

Examples:

- creating an achievement draft
- submitting an approval
- approving or rejecting workflow tasks
- creating fees
- marking fees paid
- uploading or downloading attachments
- changing settings/config

Do not include write acceptance in GET-only smoke.

## Rollback Principles

Rollback triggers:

- API or Web cannot start.
- Production health check fails.
- Auth login/session/logout chain fails.
- `X-Demo-User-Id` can bypass production auth.
- Sensitive values appear in responses, logs, screenshots, or audit evidence.
- Migration failure cannot be corrected safely within the cutover window.
- Foundation seed fails or writes data outside Department, Role, Permission, and RolePermission.

Rollback preference:

- Restore the previous demo/staging deployment if cutover fails before production acceptance.
- Restore database from backup only under an explicit rollback plan.
- Record rollback evidence with脱敏 status only.

## Post-GO Demo Cleanup

The user has chosen to remove demo traces after production cutover. Cleanup is allowed only after production `GO` and a separate explicit confirmation.

Recommended order:

1. Confirm production `GO`.
2. Confirm demo backup and rollback window status.
3. Stop demo containers.
4. Remove demo containers.
5. Remove demo images only if no rollback image dependency remains.
6. Remove demo volumes only after DB backup is verified and the user reconfirms.
7. Archive or remove `/www/wwwroot/research-demo` only after a final explicit confirmation.

Do not perform demo cleanup during artifact preparation, migration, seed, bootstrap, or smoke.

## Final Decision

Final state must be one of:

- `GO`
- `CONDITIONAL_GO`
- `NO_GO`
- `ROLLBACK`

Do not declare `GO` until production/live smoke, auth checks, backup/rollback readiness, and authorized write acceptance boundaries are satisfied.
