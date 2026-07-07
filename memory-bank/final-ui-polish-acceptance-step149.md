# Step 149 - Final UI polish acceptance archive

Date: 2026-07-07

Starting HEAD: `1e8b0a6 fix: polish remaining deep UI states`

## Result

PASS with caveat.

This step is a local Docker production-like / synthetic UI acceptance archive
for final client-facing polish. It is not production/VPS acceptance, not
production database acceptance, and not real external-system acceptance.

## Scope

- Confirmed the real local Web entry at `http://127.0.0.1:18081/` is reachable.
- Confirmed the real local API health endpoint at
  `http://127.0.0.1:14001/api/health` is reachable.
- Confirmed the active `18081` HTML references:
  - `assets/index-CvilrjNR.js`
  - `assets/index-CAZwwqOa.css`
- Captured the real unauthenticated `18081` login page because no reusable
  authenticated browser session was available and no credential, Cookie, Token,
  or password was read.
- Ran a Playwright synthetic front-end authenticated-state sweep against the
  active `18081` bundle by intercepting local `/api/**` responses in the
  browser session. This verifies the Web display layer with synthetic data only;
  it does not prove real Docker session-cookie login or backend authorization.

## Browser Evidence

Evidence directory:

- `.local-step149-final-ui-acceptance/`

Real `18081` login evidence:

- `real-18081-login-page.png`
- `real-18081-login-page-report.json`

Synthetic authenticated-state page screenshots:

- `page-1-工作台.png`
- `page-2-成果管理.png`
- `page-3-审批管理.png`
- `page-4-费用管理.png`
- `page-5-检索中心.png`
- `page-6-统计看板.png`
- `page-7-自定义报表.png`
- `page-8-审计日志.png`
- `page-9-系统配置.png`
- `page-10-涉密授权管理.png`
- `page-11-账号管理.png`
- `page-12-部门维护.png`

Synthetic deep-surface screenshots:

- `deep-1-成果详情.png`
- `deep-extra-fee-detail.png`
- `deep-extra-fee-review-history.png`
- `deep-extra-account-precheck.png`
- `deep-extra-department-precheck.png`
- `deep-extra-settings-edit.png`
- `deep-4-涉密授权资源详情.png`

Synthetic scan reports:

- `synthetic-ui-text-scan-report.json`
- `synthetic-deep-extra-scan-report.json`

## Visible Copy Scan

The synthetic main-page text scan covered:

- 工作台
- 成果管理
- 审批管理
- 费用管理
- 检索中心
- 统计看板
- 自定义报表
- 审计日志
- 系统配置
- 涉密授权管理
- 账号管理
- 部门维护

No main-page hits were found for:

- `权限与边界提示`
- `dry-run`
- `Internal server error`
- `undefined`
- `null`
- `LOCAL_DEMO_SYNTHETIC`
- `NOT_PRODUCTION`
- `backend`
- `debug`
- `export`
- `download`
- `batch mutation`
- `Cookie`
- `Token`
- `连接串`

Observed caveats from the visible text scan:

- 系统配置 contains the word `密钥` only in the business explanation
  `配置引用只是非敏感名称，不是密钥值`; no secret value was displayed.
- 账号管理 contains the word `密码` as part of account lifecycle/password-reset
  business controls; no password value was displayed or read.

## Caveats

- No real authenticated local Docker session was available in the browser.
  The live `18081` authenticated page sweep therefore used a browser-level
  synthetic auth/API projection and must not be described as real session-cookie
  acceptance.
- The synthetic deep sweep covered representative surfaces, but it is not an
  exhaustive proof of every validation error, every pagination state, every
  attachment sub-action, or every nested modal in the app.
- The Playwright run initially produced synthetic fixture-shape errors while
  building the test harness. Those were corrected in the local evidence script;
  the latest console log for the completed synthetic sweep only contained the
  expected unauthenticated `/api/auth/me` 401 from the pre-route page open.

## Boundaries

- No Web source code changed.
- No API source code changed.
- No Prisma schema changed.
- No migration was added.
- No `.env` or `.env.production` content was read.
- No Cookie, Token, password, connection string, API key, or secret value was
  read, displayed, recorded, or committed.
- No production/VPS/production DB was accessed.
- No real HR/SSO, email/SMS, finance, patent, DOI, storage, or other external
  system was called.
- No Docker build/up was required in this step; existing local services were
  only checked by HTTP.
- No Docker prune, volume deletion, `down -v`, orphan cleanup, git reset,
  git clean, or file deletion was performed.
