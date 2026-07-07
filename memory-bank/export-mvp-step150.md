# Step150 Export MVP

## Scope Implemented

- Custom report CSV export: `GET /reports/templates/:templateId/export.csv`
- Achievement ledger CSV export: `GET /achievements/export.csv`
- Fee ledger CSV export: `GET /fees/export.csv`
- Masked audit log CSV export: `GET /audit-logs/export.csv`
- Web export entries were added to Custom Reports, Achievements, Fees, and Audit Logs pages with loading and error states.

## CSV Field Scope

Custom report export uses the selected report template columns and reuses the existing report execution path.

Achievement ledger export includes:

- ID
- Type
- Title
- Status
- Secret level
- Department ID
- Created at
- Updated at
- Submitted at
- Archived at
- Voided at
- Restricted
- Redacted

Fee ledger export includes:

- ID
- Achievement ID
- Department ID
- Fee type
- Fund source
- Amount
- Due date
- Paid date
- Pay status
- Voucher no
- Review status
- Reviewed at
- Created at
- Updated at
- Archived at

Masked audit log export includes:

- ID
- Actor user ID
- Actor department ID
- Action
- Target type
- Target ID
- Target department ID
- Target secret level
- Trace ID
- Created at
- Has old value
- Has new value
- IP masked
- User agent masked

## Permission And Redaction Boundary

- Export APIs are backend APIs and do not rely on frontend-only filtering.
- Each export path reuses the existing authenticated user context and permission/policy path for its domain.
- Each export is capped to at most 1000 rows for the MVP.
- CSV generation escapes commas, newlines, and double quotes.
- CSV generation guards against spreadsheet formula injection for cells beginning with `=`, `+`, `-`, or `@` after leading whitespace.
- Audit log export only includes masked/safe summary fields and does not export raw `oldValue` or `newValue` JSON.
- Export audit events record that an export occurred, export type, row count, and row limit. They do not record exported CSV content.

## Explicit Non-Scope

- Excel export is not implemented in Step150.
- PDF export is not implemented in Step150.
- Attachment original content export is not implemented.
- Raw JSON export is not implemented.
- Sensitive fields such as Cookie, Token, password, password hash, token hash, session, secret keys, connection strings, and attachment body content are not part of the export field scope.

## Validation

- `corepack pnpm --filter @research-ip/api test -- export reports achievements fees audit` passed: 19 files, 270 tests.
- `corepack pnpm --filter @research-ip/web test -- CustomReports Achievements Fees AuditLogs api-client` passed: 5 files, 163 tests.
- `corepack pnpm --filter @research-ip/api typecheck` passed.
- `corepack pnpm --filter @research-ip/web typecheck` passed.

## Schema And Environment

- Schema changes: no.
- Migration changes: no.
- `.env` / `.env.production` contents read: no.
- Secrets, Cookie, Token, password, or connection string read or recorded: no.
- Production, VPS, or production database accessed: no.
- Real HR/SSO, email/SMS, finance, DOI, patent, or other external production system called: no.
