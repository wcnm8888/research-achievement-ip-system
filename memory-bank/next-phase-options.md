# Next Phase Options

Date: 2026-07-05

Scope: Step 81A documentation-only route confirmation plan.

This document summarizes the archived import-history mainline and lays out
optional next routes for user selection. It is not authorization to execute
production work, database work, migrations, imports, runbooks, Web row-level
display, or local artifact cleanup.

## Current Default State

- No DB, production, VPS, or production DB access is authorized or performed.
- No migration, import, production runbook, service startup, or real-data apply
  is authorized or performed.
- `.env` and `.env.production` content remains unread.
- Existing untracked local artifacts remain untouched, unclassified, unmoved,
  unstaged, undeleted, and uncleaned.
- Runtime/API/Web/schema/migration/package/lockfile/config files remain out of
  scope for this Step.

## Archived Mainline

The current archived mainline includes:

- Import real-write first phase archive, with production execution and real-data
  apply kept as separate authorization decisions.
- `ImportJob` / `ImportRun` history and idempotency for Department,
  Achievement, and User account import families.
- Web aggregate-only import-history entries and settings/system overview.
- `ImportJobItem` safe row-level history line:
  - Safe-field allowlist and forbidden-field boundary.
  - Schema plan and additive schema/migration archive.
  - Department, Achievement, and User account success-path item writers.
  - Backend-only safe item read DTO and `GET /api/import-jobs/:id/items`.
  - Web aggregate-only history decision.
  - Local synthetic backend-only acceptance.
  - Production read-only preflight documentation.
- Prompt 39 handoff archive in `memory-bank/prompt-39-handoff.md`.

## Route A - Production Read-Only Preflight Preparation

### Goal

Prepare a separately authorized production read-only preflight execution plan
for the existing import-history and `ImportJobItem` documentation. The route is
limited to readiness checks, operator checklist preparation, evidence boundary
definition, and a final go/no-go prompt before any production access.

### Risk

- Accidental exposure of production identifiers, source values, credentials,
  connection strings, or personal data in evidence.
- Confusing documentation readiness with authorization to access production.
- Running a runbook or command before explicit user approval.

### Required Authorization

- Explicit user approval to prepare the preflight execution package.
- Separate explicit user approval before any DB, production, VPS, production DB,
  credential, connection-string, or runbook execution step.
- Explicit confirmation of what evidence may be recorded and what must be
  redacted or omitted.

### First Suggested Step

Step 81B-A: create a production read-only preflight execution preparation
checklist that references existing runbooks, defines safe evidence boundaries,
and stops before any production access or command execution.

### Explicitly Forbidden

- Do not access DB, production, VPS, production DB, or remote hosts.
- Do not read `.env`, `.env.production`, credentials, tokens, cookies, private
  keys, or connection strings.
- Do not run migrations, imports, runbooks, service startup commands, or
  production queries.
- Do not record raw IDs, raw source values, raw CSV, personal identifiers,
  secrets, or connection strings.

## Route B - Web Row-Level Display Plan Only

### Goal

Draft a Web row-level display plan for safe `ImportJobItem` visibility without
implementing UI or API changes. The plan should re-evaluate the product and
privacy boundary and keep Web history aggregate-only unless the user separately
approves a later implementation Step.

### Risk

- Turning a planning Step into implementation without authorization.
- Expanding row-level display into sensitive details or operational actions.
- Accidentally allowing `targetId`, raw source data, export, copy controls, or
  business-object drilldown.

### Required Authorization

- Explicit user approval to plan Web row-level display.
- Separate explicit user approval for any later runtime/API/Web/schema work.
- Separate explicit approval before changing the current aggregate-only Web
  boundary.

### First Suggested Step

Step 81B-B: write a Web row-level display design plan that covers allowed
columns, forbidden fields, empty/loading/error states, access boundaries, and
acceptance criteria, with no code changes.

### Explicitly Forbidden

- Do not implement Web row-level display.
- Do not expose `targetId`, raw CSV, raw source values, personal identifiers,
  raw JSON, downloads, exports, copy controls, or business-object drilldown.
- Do not add global `/import-job-items` routes.
- Do not modify runtime/API/Web/schema/migration/package/lockfile/config files
  during the planning Step.

## Route C - Existing Untracked Local Artifact Safety Audit

### Goal

Create a non-destructive safety audit plan for existing untracked local
artifacts so the user can decide whether they should be archived, ignored,
classified, or handled manually in a later authorized Step.

### Risk

- Accidentally deleting, moving, staging, or modifying local artifacts.
- Reading unrelated private or sensitive artifact content.
- Treating artifact presence as permission to clean or commit it.

### Required Authorization

- Explicit user approval to audit the existing untracked local artifacts.
- Explicit scope for which artifact paths may be inspected.
- Separate explicit approval for any later move, archive, deletion, staging, or
  cleanup action.

### First Suggested Step

Step 81B-C: produce a read-only artifact safety audit plan that lists the
current untracked paths from `git status --short`, defines minimal inspection
rules, and proposes non-destructive handling options.

### Explicitly Forbidden

- Do not delete, move, rename, archive, stage, or clean untracked artifacts.
- Do not run batch cleanup commands.
- Do not read unrelated personal files, credentials, `.env`, or production
  secrets.
- Do not commit untracked artifacts unless a later Step explicitly authorizes a
  specific path and purpose.

## Route D - New Business Feature Line

### Goal

Start a new product, import, or operational capability line selected by the
user. This route should begin from task classification, scoped context reading,
and a plan appropriate to the requested feature.

### Risk

- Carrying over old import-history assumptions as authorization for new writes,
  production access, or sensitive data handling.
- Reading too much unrelated context before the new feature is defined.
- Starting implementation before success criteria and boundaries are clear.

### Required Authorization

- User-selected feature theme and desired outcome.
- Explicit scope for allowed files, systems, data, and verification level.
- Separate explicit approval for production, DB, migration, import, credential,
  or sensitive-data work if the new feature needs any of those.

### First Suggested Step

Step 81B-D: classify the requested feature, read only directly relevant
context, and create a feature brief plus implementation plan before code work.

### Explicitly Forbidden

- Do not infer production, DB, migration, import, or credential authorization
  from previous completed work.
- Do not modify unrelated runtime/API/Web/schema/migration/package/lockfile/
  config files.
- Do not expose raw CSV, personal identifiers, credentials, connection strings,
  or hidden operational data.
- Do not handle existing untracked local artifacts unless the new route
  explicitly includes a separately authorized artifact Step.

## Selection Guidance

- Choose Route A if the next priority is getting ready for a carefully bounded
  production read-only preflight, with execution still gated.
- Choose Route B if the next priority is product/design clarity for Web
  row-level visibility, with implementation still prohibited.
- Choose Route C if the next priority is understanding existing untracked local
  artifacts without cleaning them.
- Choose Route D if the next priority is a new user-defined feature line.
