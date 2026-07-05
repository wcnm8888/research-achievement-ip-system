# ImportJobItem Read DTO Plan

Date: 2026-07-05

Scope: Step 78A documentation-only backend read DTO/API design for
`ImportJobItem` row-level safe history.

This plan does not implement DTOs, API routes, controller/service/repository
code, Web UI, Prisma schema, migrations, package files, lockfiles, runtime
config, database access, migration apply/deploy/reset, production access, or
real import execution.

## Recommendation

Open a row-level read surface only as an internal support API after this plan is
accepted and Step 78B is separately authorized.

The recommended sequence is:

1. Step 78B may add a backend-only safe read DTO/API for support diagnostics.
2. Web remains aggregate-only and must not consume row-level items yet.
3. Step 78C decides whether Web should expose row-level history or explicitly
   remain aggregate-only.

This gives support staff a narrow diagnostic path without turning row history
into a user-facing drilldown, export, retry, rollback, or business-object lookup
surface.

## Route Shape

Prefer a child resource under the existing import job detail route:

`GET /import-jobs/:id/items`

This keeps every row-level read anchored to one known `ImportJob` and matches the
existing `GET /import-jobs/:id` detail shape.

Do not add a global `/import-job-items` list. A global item list would detach row
history from job/run context and makes it easier to accidentally build search,
export, cross-job browsing, or business-object drilldown around row data.

## Authorization

Use the same guard and permission model as current import job history reads:

- `UserContextGuard`
- `PermissionGuard`
- `PermissionCode.systemConfig`

Do not add a new permission for Step 78B. If a later product decision requires a
separate support permission, that must be a separate authorization plan.

## Query Filters And Pagination

Every query must be scoped by route `jobId` from `:id`.

Allowed query parameters:

- `runId`: optional UUID filter. It must still be constrained by the route
  `jobId`.
- `status`: optional `ImportJobItemStatus`.
- `plannedAction`: optional `ImportJobItemPlannedAction`.
- `targetType`: optional `ImportJobItemTargetType`.
- `safeCode`: optional machine-safe string filter.
- `page`: optional positive integer, default `1`.
- `pageSize`: optional positive integer, default `20`, max `100`.

Default ordering should be stable source-row order:

1. `rowNumber asc`
2. `runId asc` only as a tie-breaker if the query can span multiple runs

When `runId` is provided, `rowNumber asc` is sufficient because the schema uses
`@@id([runId, rowNumber])`.

Invalid enum values, invalid UUIDs, non-positive pagination, excessive page size,
and non-whitelisted query parameters should return `400`.

## Response Shape

Recommended list response:

```ts
type ImportJobItemReadListDto = {
  items: ImportJobItemReadListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

type ImportJobItemReadListItemDto = {
  rowNumber: number;
  plannedAction: string;
  status: string;
  safeCode: string | null;
  targetType: string;
};
```

`ImportJobItem` currently has no `createdAt` or `updatedAt` field in
`prisma/schema.prisma`. Do not add created facts to the DTO unless the schema is
separately changed in a future authorized Step.

Do not return `jobId` because the route already supplies it. Do not return
`runId` by default because it is either a query filter or an internal grouping
key. If Step 78B finds that `runId` is required for backend support triage, the
implementation must justify it explicitly and still keep it non-copyable and out
of Web until Step 78C.

## DTO Allowlist

The item DTO allowlist is limited to:

- `rowNumber`
- `plannedAction`
- `status`
- `safeCode`
- `targetType`

No other fields should be returned by the row-level read DTO.

## Forbidden Response Fields And Content

The row-level read API must never return:

- `targetId`
- raw CSV
- row values
- email
- `employeeNo`
- name
- `departmentCode`
- role
- title
- DOI
- registration number
- patent number
- contributors
- credentials, invite values, password, token, cookie, or connection string
- `safeSummary`
- `auditLogIds`
- `idempotencyKeyHash`
- `scopeHash`
- `fileFingerprint`
- `requestFingerprint`
- `operatorUserId`

The prohibition covers DTOs, serialized API responses, test fixtures, logs,
evidence snippets, screenshots, export/download surfaces, and Web display.

## Repository And Prisma Select Strategy

Use explicit Prisma `select` allowlists. Do not return a full Prisma record.

Recommended parent check:

```ts
select: {
  id: true,
  importFamily: true,
  mode: true,
  achievementType: true,
  status: true,
}
```

The parent check exists only to return `404` for missing or unreadable jobs and
to preserve safe route context. It must not include idempotency, fingerprint,
operator, summary, audit id, or run payload fields.

Recommended item select:

```ts
select: {
  rowNumber: true,
  plannedAction: true,
  status: true,
  safeCode: true,
  targetType: true,
}
```

The item query must include `where: { jobId: routeId, ...filters }`. If `runId`
is provided, use `where: { jobId: routeId, runId, ...filters }`.

Do not `include` `ImportJob`, `ImportRun`, or related business records in the
item query. If a later implementation needs parent context, read it through the
minimal parent `select` above, not through an item include.

## Error Semantics

- No `system:config` permission: `403`.
- Job missing or not readable: `404`.
- Job exists and has no matching items: `200` with `items: []`, `total: 0`, and
  the requested/default pagination values.
- Invalid filters, invalid pagination, invalid UUIDs, or non-whitelisted query
  parameters: `400`.

## Explicit Non-Capabilities

This read API must not provide:

- retry
- delete
- cleanup
- rollback
- download
- export
- raw JSON access
- raw CSV access
- business-object drilldown
- links to created Departments, Users, Achievements, or typed achievement detail
  records

It is a read-only support diagnostic surface, not an operation surface.

## Step 78B Implementation Notes

If Step 78B is authorized, implement it as a small extension of the existing
`import-job-history-read` backend module:

- add a query DTO with enum and pagination validation;
- add `GET /import-jobs/:id/items`;
- keep `@RequirePermissions(PermissionCode.systemConfig)`;
- add service mapping that constructs DTOs from allowlisted records only;
- add repository methods using the parent and item `select` allowlists above;
- add controller/service/repository tests for 403, 404, 400, empty list, paging,
  filtering, stable ordering, and forbidden field absence.

Runtime typecheck/test/build are intentionally not part of Step 78A because this
Step is docs-only. Step 78B should run focused backend tests and typecheck after
implementation.

## Follow-Up Split

- Step 78B: backend read DTO/API implementation plus tests, only if this plan is
  accepted.
- Step 78C: Web row-level read plan, or an explicit decision to keep Web
  aggregate-only.
- Step 78D: local synthetic acceptance, only after implementation requires it.

Step 78A does not authorize Web row-level display, migration execution, database
access, production access, real imports, exports, downloads, retries, cleanup,
rollback, or any raw/source data exposure.
