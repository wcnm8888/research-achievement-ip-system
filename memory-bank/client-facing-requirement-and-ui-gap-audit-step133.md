# Step 133 - Client-Facing Requirement and UI Gap Audit

Date: 2026-07-07

## Conclusion

The project should **not** be frozen yet from a client-facing acceptance
perspective.

The backend and local/demo/synthetic feature closure are relatively mature, but
the Web UI and delivery documents still expose development, API, Step, and
local-acceptance language directly to business users. That makes the product
look like an internal engineering demo rather than a client-ready research
achievement and intellectual property management system.

This audit does not change source code. It identifies the remaining work before
code freeze.

## Requirement Coverage Judgment

Current project evidence supports this narrower claim:

- Phase-one core workflows are implemented for local/demo/synthetic review.
- Route B enhancements are implemented for local/demo/synthetic review:
  Custom Reports, Conversion Deepening, ImportJobItem safe display, Account
  Lifecycle, and Secret Authorization.
- Secret Authorization has seeded local Docker authenticated evidence with
  non-empty resources and read-only detail rows.

Current evidence does **not** support these broader claims:

- Production launch readiness.
- VPS / production DB acceptance.
- Real HR/SSO, real email/SMS, real finance, real DOI/literature/patent
  provider integration.
- Real object storage, production attachment preview/download governance, or
  storage retention proof.
- Full BI platform, scheduled reports, saved report templates, exports, or
  sensitive drilldown.
- Secret authorization mutation workflow such as grant create, revoke, approve,
  batch operation, export, or download.
- Complete mobile acceptance.

Therefore, if the client's expectation is "production system fully delivered",
the project is incomplete. If the expectation is "competition/reviewer local
demo delivery", the functional foundation is mostly complete, but the frontend
presentation still needs correction.

## P0 - Must Fix Before Client-Facing Freeze

### 1. Remove API and engineering labels from business pages

Observed examples:

- `GET /achievements`
- `POST /achievements/import/dry-run`
- `GET /workflow/tasks/my`
- `GET /secret-authorization/resources`
- `GET /import-jobs/:id/items`
- `Endpoint`
- `dryRun=true`
- `Step 12`, `Step 104-B`, `Step 122`

Client-facing replacement:

- Use Chinese business labels such as `成果列表`, `导入预检`, `审批待办`,
  `涉密资源列表`, `导入明细`.
- Move API endpoint names into developer documentation or hidden diagnostics,
  not default UI.

Primary files to review:

- `apps/web/src/App.tsx`
- `apps/web/src/Achievements.tsx`
- `apps/web/src/WorkflowTasks.tsx`
- `apps/web/src/Workbench.tsx`
- `apps/web/src/ImportJobHistoryPanel.tsx`
- `apps/web/src/SecretAuthorization.tsx`
- `apps/web/src/AccountManagement.tsx`
- `apps/web/src/DepartmentManagement.tsx`

### 2. Translate visible English UI into Chinese

Observed examples:

- `Custom Reports`
- `Secret Authorization`
- `Achievement CSV dry-run`
- `Achievement import history`
- `Department CSV dry-run`
- `User account CSV dry-run`
- `Run dry-run`
- `Apply draft-only import`
- `No CSV selected`
- `Restricted resources`

Client-facing replacement examples:

- `自定义报表`
- `涉密授权管理`
- `成果导入预检`
- `成果导入记录`
- `部门导入预检`
- `账号导入预检`
- `开始预检`
- `导入为草稿`
- `未选择 CSV 文件`
- `涉密资源`

Primary files to review:

- `apps/web/src/App.tsx`
- `apps/web/src/importDryRunUi.tsx`
- `apps/web/src/Achievements.tsx`
- `apps/web/src/CustomReports.tsx`
- `apps/web/src/SecretAuthorization.tsx`
- `apps/web/src/AccountManagement.tsx`
- `apps/web/src/DepartmentManagement.tsx`

### 3. Remove local/demo/synthetic disclaimers from normal user UI

Observed examples:

- `local/demo/synthetic read-only management view`
- `not production authorization acceptance`
- `not production import acceptance`
- `This is not SSO or production acceptance`
- `production-like acceptance is not production/VPS readiness`

These phrases are useful in evidence documents, but they are not appropriate in
normal business screens. They make the application appear unfinished.

Client-facing replacement:

- Use neutral Chinese operational hints:
  `当前页面展示经权限过滤后的安全摘要。`
  `如需调整授权，请联系系统管理员。`
  `当前账号仅能查看授权范围内的数据。`

Keep production boundary language in:

- `memory-bank/*`
- acceptance reports
- internal runbooks

Do not show it by default in:

- main navigation
- page headers
- business cards
- common permission hints

### 4. Hide demo identity implementation details

Observed examples:

- `X-Demo-User-Id`
- `选择或输入演示用户`
- `前端只负责传递 X-Demo-User-Id`

Client-facing replacement:

- `当前登录用户`
- `当前账号`
- `权限由系统后台统一校验`

The UI may still use local demo users internally, but the business page should
not reveal request-header implementation details.

Primary files to review:

- `apps/web/src/App.tsx`
- `apps/web/src/Workbench.tsx`
- `apps/web/src/Achievements.tsx`
- `apps/web/src/WorkflowTasks.tsx`
- `apps/web/src/CustomReports.tsx`

### 5. Fix delivery document entry quality

`memory-bank/project-requirement-completion-matrix.md` currently starts with
garbled legacy Chinese content and the newer authoritative English section only
appears later in the file. This is risky for final delivery because a reviewer
or client opening the file sees stale/garbled content first.

Required cleanup:

- Rewrite the matrix into a clean UTF-8 Chinese document.
- Put the current final conclusion at the top.
- Keep the distinction between:
  `已完成 - 本地演示`, `已完成但有 caveat`, `延期`, `不属于生产验收`.
- Remove stale step-forward recommendations that no longer match current HEAD.

## P1 - Strongly Recommended Before Final Demo

### 1. Reframe import panels as business import tools

Current import panels look like API test harnesses because of terms such as
`dry-run`, endpoint tags, mode constants, and English notices.

Recommended UI:

- `导入预检`
- `选择 CSV 文件`
- `检查文件`
- `导入草稿`
- `导入记录`
- `错误行`
- `警告行`
- `可导入行`

Keep technical constants in data models and tests, not visible labels.

### 2. Add negative UI regression tests

After cleanup, add or adjust Web tests to ensure normal rendered pages do not
contain:

- `GET /`
- `POST /`
- `X-Demo-User-Id`
- `Step `
- `local/demo`
- `synthetic`
- `not production`
- `dryRun=true`
- `debug`
- `export`
- `download` as a button/link/control unless explicitly allowed

This will prevent the same issue from reappearing in later changes.

### 3. Improve Chinese terminology consistency

Recommended naming:

- Achievement -> `成果`
- Custom Reports -> `自定义报表`
- Secret Authorization -> `涉密授权管理`
- Account Management -> `账号管理`
- Department Management -> `部门维护`
- Import dry-run -> `导入预检`
- Import history -> `导入记录`
- Resource grant -> `资源授权`
- Safe summary -> `安全摘要`

### 4. Client-facing final closure docs should be Chinese

`memory-bank/final-local-demo-delivery-closure.md` is useful internally, but it
is currently English-first. For a Chinese client/reviewer package, produce a
clean Chinese-facing version or replace it with a bilingual summary.

## P2 - Defer Unless Time Allows

- Complete responsive/mobile polish.
- Full visual redesign beyond terminology cleanup.
- Advanced report export/scheduled delivery.
- Secret authorization mutation workflow.
- Real external integrations.
- Production deployment readiness.

These are real gaps, but they are larger than a one-day client-facing cleanup.

## Suggested Next Steps

### Step 134 - Web client-facing terminology cleanup

Scope:

- Modify Web UI only.
- Remove visible API endpoint tags, Step labels, demo header names, and
  local/demo production-disclaimer language from normal pages.
- Translate visible English labels into Chinese.
- Update affected Web tests.

Suggested files:

- `apps/web/src/App.tsx`
- `apps/web/src/importDryRunUi.tsx`
- `apps/web/src/Achievements.tsx`
- `apps/web/src/WorkflowTasks.tsx`
- `apps/web/src/Workbench.tsx`
- `apps/web/src/CustomReports.tsx`
- `apps/web/src/SecretAuthorization.tsx`
- `apps/web/src/ImportJobHistoryPanel.tsx`
- `apps/web/src/AccountManagement.tsx`
- `apps/web/src/DepartmentManagement.tsx`

Validation:

- `corepack pnpm --filter @research-ip/web test -- App Achievement WorkflowTasks SecretAuthorization CustomReports AccountManagement DepartmentManagement`
- `corepack pnpm --filter @research-ip/web typecheck`
- `git diff --check`

### Step 135 - Requirement matrix Chinese cleanup

Scope:

- Rewrite `memory-bank/project-requirement-completion-matrix.md` into a clean
  Chinese final matrix.
- Keep caveats honest.
- Do not claim production acceptance.

Validation:

- `git diff --check`

### Step 136 - Final client-facing UI acceptance

Scope:

- Use the local Docker/demo environment if already available.
- Capture screenshots of the cleaned Chinese UI.
- Verify no visible engineering labels, no sensitive fields, and no mutation /
  export / download controls where not intended.

Validation:

- Browser walkthrough.
- DOM text scan for forbidden terms.
- Evidence archive under a new local `.local-step136-*` directory.

## Current Freeze Decision

Do **not** freeze client-facing code yet.

Freeze can be considered after:

1. The Web UI no longer exposes development/API/local-acceptance language in
   normal business pages.
2. Visible labels and messages are Chinese and business-oriented.
3. The requirement completion matrix is clean, current, and readable.
4. A final UI acceptance pass confirms the cleaned presentation.
