# Custom Reports MVP Technical Plan

Date: 2026-07-06

Scope: Step 102-B docs-only technical plan and API/Web contract for the Route B first implementation slice: custom reports / advanced reports MVP. This plan does not implement business code, does not change API/Web/Prisma files, and does not enter production, VPS, production DB, real external systems, or real credentials.

## 1. MVP Scope

The MVP is a read-only custom report summary feature.

Included:

- 3 to 5 static report templates.
- Read-only API execution for selected template and filters.
- Web template selector, filters, summary cards, result table, loading/error/empty states.
- Existing user context, RBAC, department isolation, achievement visibility, fee visibility, and safe aggregate output.

Excluded:

- Saved report templates.
- Scheduled report delivery.
- Raw CSV export.
- Raw JSON export.
- Sensitive detail drilldown.
- Production monitoring.
- Production/VPS/production DB access.
- Real HR/SSO, email/SMS, finance/payment/reconciliation, DOI/literature/patent provider integration, or real credentials.

## 2. Selected Report Templates

Recommended first 5 templates:

| Template id | Template | Include in MVP | Source data | Primary filters | Output shape | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `achievement-distribution` | Department achievement count and type distribution | Yes | Achievements, Departments | `dateFrom`, `dateTo`, `departmentId`, `achievementType`, `status` | Department/type rows plus totals | Highest value for leadership and department review; reuse achievement readable policy. |
| `achievement-trend` | Annual/monthly achievement trend | Yes | Achievements | `dateFrom`, `dateTo`, `departmentId`, `achievementType`, `status`, `groupBy=year|month` | Time buckets plus totals | Addresses original statistics pain; first version should use archive/create date chosen explicitly in implementation. |
| `fee-risk-summary` | Fee risk and payment status summary | Yes | Fee records | `dateFrom`, `dateTo`, `departmentId`, `status`, `dueSoonDays` | Status/risk rows plus totals | Reuses fee readable policy; no voucher/raw finance data. |
| `workflow-efficiency` | Approval efficiency and pending task summary | Yes | Workflow tasks | `dateFrom`, `dateTo`, `departmentId`, `status` | Pending/approved/rejected/cancelled rows | Keep aggregate-only; no task detail or reviewer private notes. |
| `conversion-funnel` | Achievement conversion contract/revenue/status funnel summary | Yes | Achievement conversions joined through visible achievements | `dateFrom`, `dateTo`, `departmentId`, `status` | Count, contract/revenue totals, status funnel | Uses local conversion ledger summaries only; not real contract/legal/payment acceptance. |

Deferred templates:

| Template | Reason deferred |
| --- | --- |
| External interface mock call overview | Dashboard already exposes safe mock aggregate overview; can be a later template if template engine needs a mock-data example. |
| ImportJob aggregate history summary | Useful for operators, but less central to custom report value than achievement/fee/workflow/conversion; keep for a second report wave. |

## 3. Backend API Contract

Recommended endpoint shape:

- `GET /reports/templates`
- `GET /reports/templates/:templateId/run`

Alternative acceptable single endpoint:

- `GET /reports/custom/summary?templateId=...`

Recommendation: use `GET /reports/templates/:templateId/run` because it keeps template identity in the route and query parameters focused on filters.

### Query Parameters

Supported for `GET /reports/templates/:templateId/run`:

| Parameter | Type | Required | Applies to | Notes |
| --- | --- | --- | --- | --- |
| `dateFrom` | ISO date string | No | All templates | Inclusive lower bound. Reject invalid dates. |
| `dateTo` | ISO date string | No | All templates | Inclusive upper bound. Reject invalid dates and `dateFrom > dateTo`. |
| `departmentId` | UUID | No | Achievement, fee, workflow, conversion | Must be intersected with current user's scoped departments; never broaden access. |
| `achievementType` | enum | No | Achievement distribution/trend | `PAPER`, `PATENT`, `SOFTWARE_COPYRIGHT`. |
| `status` | enum/string | No | Template-specific | Validate against the selected template's allowed statuses. |
| `groupBy` | enum | No | Trend template | `year` or `month`; default `month` for date ranges under 24 months, otherwise `year`. |
| `dueSoonDays` | integer | No | Fee risk | Reuse Dashboard-style 1-90 validation; default 30. |

Do not accept raw SQL, arbitrary field lists, arbitrary joins, raw JSON filter blobs, or unrestricted sort expressions in the MVP.

### Response Shape

```ts
type CustomReportRunResponse = {
  metadata: {
    templateId: string;
    templateName: string;
    description: string;
    generatedAt: string;
    localDemoOnly: boolean;
    notProductionMonitoring: boolean;
  };
  filters: {
    dateFrom?: string;
    dateTo?: string;
    departmentId?: string;
    achievementType?: string;
    status?: string;
    groupBy?: "year" | "month";
    dueSoonDays?: number;
  };
  scopeSummary: {
    userId: string;
    departmentId: string;
    scopedDepartmentIds: string[];
    policy: "achievement-readable" | "fee-readable" | "workflow-assignee" | "conversion-through-achievement-readable";
  };
  columns: Array<{
    key: string;
    label: string;
    valueType: "text" | "number" | "money" | "date" | "percent";
  }>;
  rows: Array<Record<string, string | number | null>>;
  totals: Record<string, string | number | null>;
};
```

### Permissions and Isolation

Use the existing guard pattern:

- `@UseGuards(UserContextGuard, PermissionGuard)`.
- `@RequirePermissions(PermissionCode.userContextRead)` for the MVP.
- `@CurrentUser() currentUser: UserContext`.

Policy rules:

- Achievement templates must use `PolicyQueryFactory.achievementReadableWhere(currentUser)`.
- Fee templates must use `PolicyQueryFactory.feeReadableWhere(currentUser)`.
- Conversion templates must aggregate conversions only through visible achievements, matching current Dashboard conversion policy.
- Workflow templates must not expose all workflow tasks by default. MVP should either use current user's assigned workflow-task aggregation or explicitly intersect department-scoped targets with achievement/fee visibility.
- `departmentId` filters must narrow the policy result, never replace it.

Security output rules:

- Do not return raw payload, raw JSON, raw CSV, token, cookie, session, `DATABASE_URL`, connection string, secret, API key, complete external request/response, raw audit value, raw log, or sensitive row-level details.
- Do not return attachment object keys, checksums, file bodies, complete invite/reset links, provider credentials, or raw ImportJob rows.
- Return aggregate rows only.

### Backend Structure

Recommended implementation shape for the next Step:

- `apps/api/src/reports/reports.module.ts`
- `apps/api/src/reports/reports.controller.ts`
- `apps/api/src/reports/reports.service.ts`
- `apps/api/src/reports/reports.repository.ts`
- `apps/api/src/reports/dto/custom-report-query.dto.ts`
- `apps/api/src/reports/domain/custom-report-domain.types.ts`

Alternative: implement under `apps/api/src/dashboard` only if the team intentionally treats custom reports as a Dashboard subdomain. A separate `reports` module is cleaner because the feature is no longer just fixed Dashboard scoring.

## 4. Web Plan

Recommended entry:

- Add a new `Custom Reports` page reachable from side nav near Dashboard, or add a Dashboard subpage/tab named `Custom Reports`.
- Prefer a new page if routing/nav already supports page-level entries; use a Dashboard tab only if adding a route is disproportionate.

Page structure:

- Header: "Custom Reports" with copy: "local/demo/custom report summary, not full BI or production monitoring."
- Template selector: 5 static templates with short descriptions.
- Filter panel: date range, department selector/input, achievement type, status, groupBy, dueSoonDays where applicable.
- Summary cards: generatedAt, row count, total count/amount, scope summary.
- Result table: columns from the API response; no row drilldown links in MVP.
- Empty state: "No aggregate rows match these filters."
- Error state: map 401/403/400/server/network similarly to Dashboard error wording.
- Loading state: table/card skeleton or existing `DataState` pattern.

Client/types:

- Add typed client call such as `runCustomReport(templateId, query)`.
- Add types mirroring `CustomReportRunResponse`.
- Reuse `ApiClient.get<T>(path, query)` and existing query serialization.

UI safety copy:

> This page shows local/demo/custom report summaries only. It is not complete BI, not production monitoring, and does not provide raw export, raw JSON, raw logs, sensitive drilldown, or real external-system evidence.

## 5. DB / Schema Decision

First MVP recommendation: **no DB/schema change**.

Reason:

- Templates are static and versioned in code.
- No saved user templates.
- No scheduled reports.
- No delivery history.
- No persistence of report definitions or user preferences.

If saved templates, scheduled delivery, report subscriptions, or audit history become required, create a later schema-specific Step. That later Step must define report template ownership, permissions, delivery state, retention, audit logging, and migration safety. Do not mix that persistence work into this MVP.

## 6. Test Plan

API tests:

- Module/controller tests for `GET /reports/templates` and `GET /reports/templates/:templateId/run`.
- Service tests for each selected template mapping.
- Repository tests using fake Prisma or existing project pattern for aggregate queries.
- Invalid template, invalid date, `dateFrom > dateTo`, invalid enum, invalid UUID, and out-of-range `dueSoonDays`.

Permission tests:

- 401 when user context is missing.
- 403 when `user_context:read` is missing.
- Department filter narrows but never broadens scope.
- Achievement/conversion reports use achievement visibility.
- Fee reports use fee visibility.
- Workflow report does not expose unrelated users' task details.

Web tests:

- API client builds `GET /reports/templates/:templateId/run` with selected filters.
- Component renders template selector, filter controls, loading, empty, error, summary, and result table states.
- Page copy states local/demo/custom report summary and not full BI/production monitoring.
- No UI action exposes export, raw JSON, raw log, or drilldown.

Not required:

- Production DB validation.
- VPS validation.
- Real external-system calls.
- UI screenshot recheck.
- Docker startup or cleanup.

## 7. Next Implementation Step

Recommended next Step:

- **Step 103-B: implement custom reports MVP backend read-only API.**

Scope for Step 103-B:

- Add backend reports module/controller/service/repository/domain/dto.
- Implement `GET /reports/templates` and `GET /reports/templates/:templateId/run`.
- Implement the 5 selected static templates.
- Keep all outputs aggregate-only and policy-filtered.
- Add API unit/module tests and permission/invalid-parameter tests.
- Do not implement Web page yet.
- Do not add DB/schema migration.

Then:

- **Step 104-B: implement Web Custom Reports page.**

Reason for splitting:

- The backend contract and permission boundaries are the main risk.
- Splitting avoids a broad backend+Web change that could hide policy or response-shape mistakes.
- A combined backend+Web Step is possible only if limited to 1 or 2 templates, but that would undercut the MVP value and increase review risk.
