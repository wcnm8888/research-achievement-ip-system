# Demo/Staging Deployment Runbook

This runbook is for a Baota VPS demo/staging deployment only. It is not a
production deployment guide, and `X-Demo-User-Id` is not production
authentication.

## Target VPS

- OS: Ubuntu 24
- CPU/RAM: 2 cores / 1.6 GB RAM
- Disk: 39 GB
- Swap: 1024 MB
- Baota Nginx: 1.24.0
- Docker: 28.3.2
- Docker Compose: v2.38.2
- Domains:
  - `demo.wangyimin.cn`
  - `api-demo.wangyimin.cn`

## Architecture

- Baota Nginx terminates domain traffic and SSL.
- Docker Compose runs `postgres`, `api`, and `web`.
- `postgres` stays on the Docker network and is not exposed publicly.
- `api` binds to `127.0.0.1:13000` for Baota reverse proxy only.
- `web` binds to `127.0.0.1:18080` for Baota reverse proxy only.
- The web app should use same-origin `/api`; Baota proxies `/api/` to the API.

## Files

- `Dockerfile.api`: builds and runs the NestJS API.
- `Dockerfile.web`: builds the Vite web app and serves it with nginx.
- `docker-compose.demo.yml`: runs the demo/staging stack.
- `.env.demo.example`: template for VPS-only `.env.demo`.
- `deploy/nginx/*.conf.example`: Baota Nginx reverse proxy examples.

## Prepare `.env.demo`

On the VPS, copy the example file:

```bash
cp .env.demo.example .env.demo
```

Fill only the VPS-local demo/staging values. Do not commit `.env.demo`.

Required variable names:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `PORT`
- `NODE_ENV`
- `VITE_API_BASE_URL`

For demo/staging with `X-Demo-User-Id`, keep `NODE_ENV=staging`, not
`production`. If `NODE_ENV=production`, the current dev identity adapter does
not accept the demo user header.

## Build and Start Order

Use serialized builds on the small VPS to reduce peak memory:

```bash
docker compose -f docker-compose.demo.yml build --no-parallel
docker compose -f docker-compose.demo.yml up -d postgres
```

Run migrations after Postgres is healthy:

```bash
docker compose -f docker-compose.demo.yml run --rm api pnpm prisma migrate deploy
```

Seed demo data once for the demo/staging environment:

```bash
docker compose -f docker-compose.demo.yml run --rm api pnpm prisma db seed
```

Then start the API and web services:

```bash
docker compose -f docker-compose.demo.yml up -d api web
```

Do not run seed against production data. The seed data is for demo/staging.

## Baota Nginx

Create two Baota sites and enable SSL in Baota:

- `demo.wangyimin.cn`
- `api-demo.wangyimin.cn`

Use these examples as reviewable references:

- `deploy/nginx/demo.wangyimin.cn.conf.example`
- `deploy/nginx/api-demo.wangyimin.cn.conf.example`

The intended proxy targets are:

- `demo.wangyimin.cn/` -> `http://127.0.0.1:18080`
- `demo.wangyimin.cn/api/` -> `http://127.0.0.1:13000/api/`
- `api-demo.wangyimin.cn/api/` -> `http://127.0.0.1:13000/api/`

## Step 22 Readonly Smoke

After deployment and explicit approval, use readonly `GET` requests only.
Do not perform create/update/delete/submit/approve/reject/mark-paid/upload or
download operations during readonly smoke.

Suggested readonly paths:

- `GET /api/health`
- `GET /api/achievements`
- `GET /api/dashboard/summary`
- `GET /api/search`
- `GET /api/fees`
- `GET /api/workflow/tasks/my`
- `GET /api/audit-logs` only with explicit audit-read approval
- attachment metadata `GET` only when it does not download file content

Use demo user context only for demo/staging smoke. The preset demo user IDs live
in `apps/web/src/demo-users.ts` and seed data is created by `prisma/seed.cjs`.

## Resource Notes

The VPS has 1.6 GB RAM and 1 GB swap, so builds may run out of memory.

Recommended mitigations:

- Build with `--no-parallel`.
- Keep only the demo stack running during builds.
- If builds OOM, increase swap before retrying.
- Consider building images elsewhere and pushing them to a registry if the VPS
  cannot build reliably.
- Avoid broad Docker prune commands unless explicitly approved.

## Safety Notes

- This is demo/staging, not production.
- Do not place real secrets in repo files.
- Do not expose Postgres publicly.
- Do not use `X-Demo-User-Id` as production authentication.
- Do not treat readonly smoke as write-path acceptance.

