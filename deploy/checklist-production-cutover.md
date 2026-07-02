# Production Cutover Checklist

Production domain: `production.wangyimin.cn`

This checklist is for a single VPS production cutover. It must not contain real secrets, passwords, cookies, tokens, certificates, private keys, or full connection strings.

## 1. Environment Preparation

- [ ] `NODE_ENV=production` is set on the VPS.
- [ ] `PORT=3000` is set for the API container.
- [ ] `POSTGRES_DB=<PRODUCTION_DATABASE_NAME>` is set only on the VPS.
- [ ] `POSTGRES_USER=<PRODUCTION_DATABASE_USER>` is set only on the VPS.
- [ ] `POSTGRES_PASSWORD=<GENERATED_ON_VPS>` is generated and stored only on the VPS.
- [ ] `DATABASE_URL=<VPS_LOCAL_DATABASE_URL>` is set only on the VPS.
- [ ] `SESSION_SECRET=<GENERATED_ON_VPS>` is generated and stored only on the VPS.
- [ ] `AUTH_BOOTSTRAP_ENABLED=false` by default.
- [ ] `CORS_ALLOWED_ORIGIN=https://production.wangyimin.cn` if CORS is explicitly enabled.
- [ ] `VITE_API_BASE_URL=/api`.
- [ ] `LOG_LEVEL=info` or another reviewed non-debug production level.
- [ ] Full env values have not been copied into chat, docs, screenshots, logs, or commits.

## 2. Docker Production Stack

- [ ] `docker-compose.production.yml` is used for production.
- [ ] Compose project name is `research-achievement-production`.
- [ ] API port mapping is `127.0.0.1:13001:3000`.
- [ ] Web port mapping is `127.0.0.1:18081:80`.
- [ ] Production Postgres has no public port binding.
- [ ] Production DB volume is separate from demo/staging volume.
- [ ] `.env.production` exists only on the VPS and is not printed or committed.
- [ ] `docker-compose.demo.yml` is not used for production.
- [ ] Demo ports `13000` and `18080` are not reused by production.

## 3. Backup

- [ ] `deploy/production-backup-readiness-checklist.md` reviewed.
- [ ] Current demo/staging application directory backup completed if rollback to demo/staging is required.
- [ ] Production database backup completed.
- [ ] Production attachment binary archive completed as part of the same backup set.
- [ ] Manifest and artifact-list include DB dump, attachment archive, and attachment manifest categories.
- [ ] Backup retention class recorded.
- [ ] Encryption status recorded with redacted evidence.
- [ ] Offsite status recorded with redacted evidence.
- [ ] Restore-drill plan status recorded; actual restore remains separately authorized.
- [ ] Restore path is known without exposing credentials.
- [ ] Backup evidence is脱敏 and contains no passwords or connection strings.

## 4. Migration Target Confirmation

- [ ] Migration target is confirmed as production DB using脱敏 summary only.
- [ ] Migration files reviewed.
- [ ] No demo users or demo business data will be imported as production data.
- [ ] `prisma migrate deploy` is authorized for the production migration step.
- [ ] Migration command is run through the production Compose stack, not demo/staging.
- [ ] Command shape reviewed: `docker compose -f docker-compose.production.yml run --rm api corepack pnpm exec prisma migrate deploy`.
- [ ] Rollback path is available before migration begins.

## 5. Foundation Seed

- [ ] Foundation seed command ready: `docker compose -f docker-compose.production.yml run --rm api corepack pnpm run prisma:seed:foundation`.
- [ ] Seed target is confirmed as production DB by non-sensitive summary.
- [ ] Full `DATABASE_URL` has not been printed, pasted, logged, or screenshotted.
- [ ] Run foundation seed.
- [ ] Verify counts: departments / roles / permissions / rolePermissions.
- [ ] Verify seed does not create users / credentials / sessions / login attempts.
- [ ] Verify seed does not create achievements / fees / workflow tasks / attachments.
- [ ] Record only redacted counts and conclusion.
- [ ] If foundation seed fails, mark `NO_GO` and stop before bootstrap.

## 6. Deployment

- [ ] Current demo/staging service stop window is approved.
- [ ] Production Docker build artifact or deployment package is ready.
- [ ] Production API container starts on `127.0.0.1:13001`.
- [ ] Production Web container starts on `127.0.0.1:18081`.
- [ ] Reverse proxy routes `https://production.wangyimin.cn/api` to the local API port.
- [ ] Web app serves from `https://production.wangyimin.cn`.
- [ ] HTTP is redirected to HTTPS or not used as the formal production entry.

## 7. Bootstrap

- [ ] Initialization window approved.
- [ ] `AUTH_BOOTSTRAP_ENABLED=true` set temporarily on the VPS.
- [ ] First admin created.
- [ ] Admin password was not recorded in docs, chat, logs, screenshots, or commits.
- [ ] Cookie/session token was not recorded.

## 8. Bootstrap Close

- [ ] `AUTH_BOOTSTRAP_ENABLED=false` after first admin creation.
- [ ] API restarted or reloaded after closing bootstrap.
- [ ] Bootstrap close verified by expected disabled error or duplicate 409.
- [ ] Evidence records only status code and脱敏 conclusion.

## 9. Health

- [ ] `GET /api/health` returns 200.
- [ ] Web page loads at `https://production.wangyimin.cn`.
- [ ] API base is same-origin `/api`.

## 10. HTTPS Cookie Smoke

- [ ] Login returns `Set-Cookie` for `research_ip_session`.
- [ ] Cookie has `HttpOnly`.
- [ ] Cookie has `Secure`.
- [ ] Cookie has `SameSite=Lax`.
- [ ] Cookie has `Path=/`.
- [ ] Cookie `Domain` is not set unless separately reviewed.
- [ ] Browser automatically sends cookie to `GET /api/auth/me`.
- [ ] Logout invalidates session.
- [ ] No cookie value or session token is recorded.

## 11. GET-only Production Smoke

- [ ] Scope confirmed as GET-only.
- [ ] `GET /api/auth/me` returns脱敏 current user after login.
- [ ] Readonly dashboard/summary endpoint checked.
- [ ] Readonly achievement list endpoint checked.
- [ ] Readonly search endpoint checked.
- [ ] Readonly workflow tasks endpoint checked if authorized.
- [ ] Readonly masked audit logs endpoint checked if authorized.
- [ ] `X-Demo-User-Id` without session cannot bypass auth.
- [ ] No POST/PATCH/PUT/DELETE executed in readonly smoke.

## 12. Write Acceptance Separate Authorization

- [ ] Write acceptance is not included in GET-only smoke.
- [ ] Any production write path requires separate explicit authorization.
- [ ] Write path list and rollback expectations are documented before execution.

## 13. Rollback Trigger

Rollback must be considered if any item occurs:

- [ ] Health check fails.
- [ ] Login/session/logout chain fails.
- [ ] Secure cookie is not returned over HTTPS.
- [ ] Browser does not return Secure cookie under HTTPS.
- [ ] `X-Demo-User-Id` bypass succeeds.
- [ ] Sensitive values appear in response, logs, screenshots, or audit evidence.
- [ ] Migration failure blocks startup or data integrity.
- [ ] Foundation seed fails or writes data outside Department / Role / Permission / RolePermission.

## 14. Final GO / NO_GO

- [ ] Backup evidence reviewed.
- [ ] Migration evidence reviewed.
- [ ] Foundation seed evidence reviewed.
- [ ] Bootstrap closed evidence reviewed.
- [ ] HTTPS cookie smoke evidence reviewed.
- [ ] GET-only smoke evidence reviewed.
- [ ] Write acceptance status explicitly recorded as completed, deferred, or separately blocked.
- [ ] Final decision recorded as `GO`, `CONDITIONAL_GO`, `NO_GO`, or `ROLLBACK`.

## 15. Post-GO Demo Cleanup

- [ ] Production `GO` recorded.
- [ ] User separately confirms demo cleanup.
- [ ] Demo containers stopped.
- [ ] Demo containers removed.
- [ ] Demo images removed only if no rollback dependency remains.
- [ ] Demo volumes removed only after DB backup verification and separate confirmation.
- [ ] `/www/wwwroot/research-demo` archived or removed only after final explicit confirmation.
