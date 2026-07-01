# Import Dry-Run Shared Contract Plan

## Step 61A Scope

- Date: 2026-07-01.
- Purpose: consolidate the current department, user/account, and achievement import dry-run patterns into a shared contract and refactor plan.
- This file is documentation-only. It does not authorize API behavior changes, Web behavior changes, Prisma schema edits, migrations, seed/backfill, real import writes, account password work, invite/reset issuance, attachment/fee/workflow import, production/VPS access, package changes, cleanup/deletion/reset/drop/prune, or existing untracked-artifact handling.

## Current Endpoints

| Import | Endpoint behind API prefix | Import type | Permission | Current write boundary |
| --- | --- | --- | --- | --- |
| Department metadata | `POST /api/imports/departments/dry-run` | `DEPARTMENT_METADATA` | `system:config` | Read-only department lookup; no department or audit write |
| User account | `POST /api/users/import/dry-run` | `USER_ACCOUNT` | `system:config` | Read-only user, department, role lookup; no user, credential, role, session, lifecycle-token, or audit write |
| Achievement | `POST /api/achievements/import/dry-run` | `ACHIEVEMENT` | `system:config` | Read-only department, user, normalized identifier lookup; no achievement, detail, contributor, attachment, fee, workflow, audit, or search write |

## Common Response Contract

The three current dry-runs already share this shape:

```ts
type ImportDryRunResult<TImportType, TSummary, TRow> = {
  importType: TImportType;
  dryRun: true;
  file: {
    name: string;
    size: number;
    mimeType: string;
    encoding: "utf-8";
  };
  columns: {
    required: string[];
    optional: string[];
    received: string[];
  };
  summary: TSummary;
  rows: TRow[];
};

type ImportDryRunIssue<TCode extends string> = {
  field: string;
  code: TCode;
  message: string;
};

type ImportDryRunRow<TParsed, TCandidateAction, TIssue> = {
  rowNumber: number;
  parsed: TParsed;
  status: "VALID" | "WARNING" | "ERROR";
  candidateAction: TCandidateAction;
  errors: TIssue[];
  warnings: TIssue[];
};
```

Current shape notes:

- There is no top-level `errors` array.
- There is no top-level `warnings` array.
- There is no top-level `preview` field. Safe preview is `rows[].parsed`.
- There is no top-level `conflicts` field. Conflict information is represented by issue codes inside `rows[].errors` or `rows[].warnings`, plus import-specific summary counters.
- `summary` always has `totalRows`, `validRows`, `errorRows`, and `warningRows`, then appends domain counters.
- `columns.received` must be sanitized when a header is sensitive or forbidden.
- `file.name` is sanitized and file contents are never echoed.

## Import-Specific Summary Fields

- Department:
  - `createCandidates`.
  - `existingCodeRows`.
- User/account:
  - `createCandidates`.
  - `existingUserRows`.
  - `existingRoleAssignmentRows`.
  - `reactivationCandidateRows`.
  - `employeeNoDbConflictCheck: "NOT_AVAILABLE"`.
- Achievement:
  - `createDraftCandidates`.
  - `duplicateIdentifierRows`.
  - `dbConflictRows`.
  - `ownerEmployeeNoLookup: "NOT_AVAILABLE"`.

## Shared Backend Candidates

Recommended shared backend surface for Step 61B:

- `import-dry-run.contract.ts`
  - Shared result, file, column, summary base, issue, row-status, and row-base types.
  - Shared constants for `dryRun=true`, UTF-8 encoding, 1 MB upload limit, row-status values, and common issue codes.
- `import-dry-run-file.ts`
  - Shared `UploadedImportFile` adapter.
  - Shared CSV-only check for extension, MIME type, workbook-like `PK` body rejection, missing-file error, and upload-size error mapping.
  - Keep endpoint paths and permission decorators unchanged.
- `import-dry-run-csv.ts`
  - Shared narrow CSV parser with the current semantics: UTF-8, one header row, comma delimiter, double-quote escaping, no workbook parsing, no delimiter autodetection.
  - Keep import-specific row cap and validation messages configurable so current behavior can be preserved.
- `import-dry-run-validation.ts`
  - Shared header validation helpers for required, unknown, forbidden/sensitive columns, and safe `columns.received`.
  - Shared formula-like value detection.
  - Shared issue builder with `field`, `code`, `message`, and later optional `severity`.
- `import-dry-run-summary.ts`
  - Shared base row summary builder for total/valid/error/warning counts.
  - Import-specific summary counters remain local.
- Test helpers only:
  - Shared no-write assertion helpers can reduce repository spec duplication, but should stay under test utilities and not become runtime code.

Step 61B should avoid changing controller routes, response JSON field names, issue messages, existing issue codes, permission policy, row ordering, validation strictness, or Web rendering behavior.

## Web Shared Component Candidates

Recommended Web consolidation after backend contract/types are stable:

- CSV upload panel shell:
  - One-file selection.
  - `.csv` extension validation.
  - 1 MB validation.
  - loading, empty, local validation error, and backend error states.
  - route tag and dry-run-only banner.
- Summary cards/descriptions:
  - Shared rendering for total, valid, error, and warning row counts.
  - Import-specific counters supplied by configuration.
- Row preview table shell:
  - Shared status tag, candidate action tag, row number, errors, and warnings columns.
  - Import-specific parsed preview columns remain supplied by each feature.
- Issue list renderer:
  - Shared code/message rendering for errors and warnings.
- Dry-run-only warning banner:
  - Shared wording pattern that states no write/import action is exposed.

Do not force a single generic table that hides domain-specific detail. Department hierarchy, account security, and achievement contributor/identifier previews need their own columns.

## Differences That Must Remain Local

Department dry-run:

- Required/optional fields: `code`, `name`, `parentCode`.
- Department code format and parent hierarchy checks.
- Parent not found and parent cycle validation.
- Existing department code warning/review behavior.

User/account dry-run:

- Sensitive credential/token/session/link/secret column rejection.
- `credentialAction: "NO_CREDENTIAL"` in safe preview.
- Department and role resolution.
- Department-scoped role assignment boundary.
- `GLOBAL` scope and `SYSTEM_ADMIN` import denial.
- `ACTIVE` status denial because activation must remain behind invite/reset lifecycle.
- `employeeNo` remains source-only until a schema decision.

Achievement dry-run:

- Type-specific detail fields for `PAPER`, `PATENT`, and `SOFTWARE_COPYRIGHT`.
- Contributor parsing and type-fit validation.
- Owner resolution by `ownerEmail`; `ownerEmployeeNo` remains not available.
- Normalized identifier preview and conflict checks.
- Attachment, storage, fee, workflow, audit, raw payload, and direct-id column rejection.
- `DRAFT`-only candidate boundary and deferred workflow/submitted import.

## Error Code Direction

Step 61B can introduce shared type names for common issue codes without renaming existing output codes:

- Common hard errors: `REQUIRED`, `INVALID_FORMAT`, `UNKNOWN_COLUMN`, `FORMULA_LIKE_VALUE`, `DUPLICATE_IN_FILE`.
- Common forbidden-header error: `FORBIDDEN_SENSITIVE_COLUMN` should stay for user/account and achievement. Department currently has no forbidden-sensitive column path; do not add behavior in Step 61B unless tests prove no output change.
- Reference errors remain domain-specific: `UNKNOWN_PARENT`, `UNKNOWN_DEPARTMENT`, `UNKNOWN_ROLE`, `OWNER_NOT_FOUND`, `CONTRIBUTOR_USER_NOT_FOUND`.
- Conflict markers remain domain-specific: `EXISTING_CODE`, `EXISTING_USER`, `EXISTING_ROLE_ASSIGNMENT`, `REVOKED_ROLE_ASSIGNMENT`, `DB_CONFLICT`.
- Candidate action values remain domain-specific.

Future contract version can add explicit `severity: "ERROR" | "WARNING"` to issues, but Step 61B should not add it to API responses unless all Web/API tests and acceptance fixtures are intentionally updated.

## Permission and Acceptance Direction

- Keep all three dry-runs under `system:config` for now.
- A shared permission hint can be documented or rendered, but Step 61B must not alter backend permission policy.
- Browser acceptance should standardize fixture naming:
  - `stepXX-import-dry-run-admin.csv`.
  - `stepXX-import-dry-run-limited.csv` when needed.
  - named sessions like `stepXX-admin` and `stepXX-limited`.
  - local proxy ports and transient sessions should remain step-scoped and should never record auth material.
- No-write acceptance should consistently compare relevant business table counts before and after dry-run calls.

## Step 61B Recommendation

Do Step 61B as shared contract/types plus a small no-behavior backend refactor:

- Add shared backend contract/types and pure helpers.
- Migrate only duplicated controller file validation and CSV parsing if exact test output remains unchanged.
- Keep service business validation local.
- Keep Web components unchanged in Step 61B unless type extraction requires minor import-only updates.
- Run focused API import tests, API typecheck, `git diff --check`, and added-lines sensitive scan.

Do not include:

- Real write import.
- Invite/reset lifecycle execution.
- Account password changes.
- Achievement attachment/fee/workflow import.
- Audit writes for dry-run.
- Prisma schema or migration changes.
- Production/VPS access.
- Web UI redesign or generic component rewrite.
