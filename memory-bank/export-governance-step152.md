# Step152 Export Governance And Field Configuration MVP

## Scope Implemented

- Export field selection helper for backend allowlist-based column selection.
- Achievement ledger CSV and Excel exports support `fields` query selection.
- Fee ledger CSV and Excel exports support `fields` query selection.
- Export audit event summary API: `GET /audit-logs/export-events`.
- Audit Logs page now shows a recent export records block.
- Achievements and Fees pages now provide export field multi-select controls.

## Field Configuration Coverage

Field selection is implemented for:

- `GET /achievements/export.csv`
- `GET /achievements/export.xlsx`
- `GET /fees/export.csv`
- `GET /fees/export.xlsx`

Custom report exports are not changed in Step152 because their export columns are already determined by report templates.

## Backend Allowlist Boundary

Achievements allowlist:

- `id`
- `type`
- `title`
- `status`
- `secretLevel`
- `departmentId`
- `createdAt`
- `updatedAt`
- `submittedAt`
- `archivedAt`
- `voidedAt`
- `isRestricted`
- `isRedacted`

Fees allowlist:

- `id`
- `achievementId`
- `departmentId`
- `feeType`
- `fundSource`
- `amount`
- `dueDate`
- `paidDate`
- `payStatus`
- `voucherNo`
- `reviewStatus`
- `reviewedAt`
- `createdAt`
- `updatedAt`
- `archivedAt`

Empty or missing `fields` keeps the full safe field set. Requested fields keep request order, duplicate fields are removed, and unsupported fields return `400 Bad Request` with `unsupported export fields`.

## Export Audit Dashboard Safe Fields

`GET /audit-logs/export-events` returns only safe summary fields:

- `id`
- `actorUserId`
- `actorDepartmentId`
- `operation`
- `exportType`
- `templateId`
- `rowCount`
- `rowLimit`
- `createdAt`

It filters to `EXPORT_*` operations and does not return raw `oldValue` or `newValue` JSON.

## Explicit Non-Scope

- Async large export jobs are not implemented.
- Scheduled report delivery is not implemented.
- User-saved export field templates are not implemented.
- Excel/PDF advanced styling is not implemented.
- Attachment original content export is not implemented.
- Raw JSON export is not implemented.

## Validation

- `corepack pnpm --filter @research-ip/api test -- export achievements fees audit` passed: 20 files, 270 tests.
- `corepack pnpm --filter @research-ip/web test -- Achievements Fees AuditLogs api-client` passed: 4 files, 155 tests.
- `corepack pnpm --filter @research-ip/api typecheck` passed.
- `corepack pnpm --filter @research-ip/web typecheck` passed.

## Schema And Environment

- Schema changes: no.
- Migration changes: no.
- `.env` / `.env.production` contents read: no.
- Secrets, Cookie, Token, password, connection string, or credential contents read or recorded: no.
- Production, VPS, or production database accessed: no.
- Real HR/SSO, email/SMS, finance, DOI, patent, or other external production system called: no.
