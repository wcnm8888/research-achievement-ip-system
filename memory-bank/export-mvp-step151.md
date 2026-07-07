# Step151 Excel/PDF Export Enhancement MVP

## Scope Implemented

- Custom report Excel export: `GET /reports/templates/:templateId/export.xlsx`
- Custom report PDF export: `GET /reports/templates/:templateId/export.pdf`
- Achievement ledger Excel export: `GET /achievements/export.xlsx`
- Fee ledger Excel export: `GET /fees/export.xlsx`
- Web export entries were added for:
  - Custom Reports: CSV, Excel, PDF
  - Achievements: CSV, Excel
  - Fees: CSV, Excel

## Export Field Scope

Step151 reuses the Step150 export datasets and field allowlists:

- Custom report exports use the selected report template columns and the existing report execution path.
- Achievement ledger exports include the same safe achievement ledger fields as Step150 CSV.
- Fee ledger exports include the same safe fee ledger fields as Step150 CSV.

## Permission And Redaction Boundary

- Export APIs remain backend APIs and do not rely on frontend-only filtering.
- Export data is still capped to at most 1000 rows.
- Achievement and fee Excel exports reuse the same readable policy paths as CSV.
- Custom report Excel/PDF exports reuse the same custom report run path and query validation as CSV.
- Restricted achievement rows continue to use the existing redacted list projection.
- Export audit events record only operation format, export type, row count, row limit, and template ID where applicable.
- Export audit events do not record exported file content.

## Format Implementation Notes

- `.xlsx` is generated as a minimal OpenXML workbook package with inline strings.
- `.xlsx` cells guard against spreadsheet formula injection for values beginning with `=`, `+`, `-`, or `@` after leading whitespace.
- `.pdf` is a minimal text PDF intended for custom report summary preview only.
- PDF output is limited to a compact text table and is not a full BI/paginated reporting engine.

## Explicit Non-Scope

- Audit log Excel/PDF export is not implemented in Step151.
- Achievement and fee PDF export is not implemented in Step151.
- Async large export jobs are not implemented.
- Scheduled report delivery is not implemented.
- User-configurable export field templates are not implemented.
- Attachment original content export is not implemented.
- Raw JSON export is not implemented.
- Excel styling, merged cells, charts, and multi-sheet workbooks are not implemented.
- PDF custom fonts, Chinese font embedding, pagination, charts, and print-grade layout are not implemented.

## Validation

- `corepack pnpm --filter @research-ip/api test -- export reports achievements fees` passed: 18 files, 256 tests.
- `corepack pnpm --filter @research-ip/web test -- CustomReports Achievements Fees api-client` passed: 4 files, 151 tests.
- `corepack pnpm --filter @research-ip/api typecheck` passed.
- `corepack pnpm --filter @research-ip/web typecheck` passed.

## Schema And Environment

- Schema changes: no.
- Migration changes: no.
- `.env` / `.env.production` contents read: no.
- Secrets, Cookie, Token, password, or connection string read or recorded: no.
- Production, VPS, or production database accessed: no.
- Real HR/SSO, email/SMS, finance, DOI, patent, or other external production system called: no.
