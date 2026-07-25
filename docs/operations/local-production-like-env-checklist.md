# Local Production-Like Environment Checklist

This checklist is for starting the local `docker-compose.production.yml` stack only.
It is not VPS production acceptance and not Step 38 production acceptance.

Do not commit `.env.production`. Do not paste real secrets, passwords, cookies,
tokens, private keys, full reset links, provider payloads, or full connection
strings into chat, docs, logs, screenshots, or commits.

## Required File

- `.env.production` must exist locally before starting the local production-like stack.
- Use `.env.production.example` only as a variable-name template.
- Fill real local values manually outside git.

## Core Runtime Variables

- `NODE_ENV`
- `PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `SESSION_SECRET`
- `AUTH_BOOTSTRAP_ENABLED`
- `CORS_ALLOWED_ORIGIN`
- `VITE_API_BASE_URL`
- `LOG_LEVEL`

## Account Lifecycle Delivery Variables

Safe no-send default:

- `ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER=local_stub`
- `ALIYUN_DM_DRY_RUN=true`

DirectMail variable names for later authorized local production-like checks:

- `ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER`
- `ALIYUN_DM_DRY_RUN`
- `ALIYUN_DM_ACCOUNT_NAME`
- `ALIYUN_DM_FROM_ALIAS`
- `ALIYUN_DM_REGION`
- `ALIBABA_CLOUD_ACCESS_KEY_ID`
- `ALIBABA_CLOUD_ACCESS_KEY_SECRET`

## Local Acceptance URLs

After the stack starts successfully:

- API health: `http://127.0.0.1:14001/api/health`
- Web root: `http://127.0.0.1:18081/`

## Explicitly Out Of Scope

- Migration.
- Seed/backfill.
- Real email smoke.
- VPS deploy.
- Production DB access.
- Cleanup, deletion, drop, reset, prune, or artifact removal.
