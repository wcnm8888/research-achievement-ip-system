# Conversion Deepening MVP Technical Plan

Date: 2026-07-06

Scope: Step 107-B-C docs-only technical plan for the Route B achievement
conversion deepening MVP. This plan extends the existing Step 84 local
`AchievementConversion` ledger into a more reviewable local/demo slice. It does
not connect to real contract, legal, payment, invoice, settlement, finance,
bank, reconciliation, or external transaction systems.

## 1. Current Baseline

Step 84 already delivered a local conversion ledger:

- Prisma model `AchievementConversion` with conversion type, counterparty name,
  contract amount, revenue amount, status, conversion date, benefit distribution
  summary, remarks, achievement link, department link, and creator/updater
  references.
- Nested API:
  - `GET /achievements/:achievementId/conversions`.
  - `POST /achievements/:achievementId/conversions`.
  - `PATCH /achievements/:achievementId/conversions/:conversionId`.
- Creation is limited to archived achievements; list/update are filtered through
  existing achievement department visibility.
- Audit records stable masked facts and booleans only. It does not persist raw
  contract text, counterparty detail text, benefit summary text, remarks text,
  payment evidence, or external payloads in audit values.
- Web `AchievementDetail` has an internal conversion ledger panel with list,
  create/edit form, local empty/error/read-only states, and explicit caveat copy.
- Dashboard already exposes conversion record count, contract/revenue totals,
  and conversion status funnel.
- Custom Reports already exposes aggregate-only `conversion-funnel` with
  contract/revenue totals through readable achievements.

Current limits:

- Existing `status` is a coarse conversion funnel status:
  `LEAD_INTENT`, `CONTRACTING`, `SIGNED`, `PAID`, `COMPLETED`, `CANCELLED`.
- There is no separate contract lifecycle state such as draft/signed/active.
- There is no separate revenue collection state such as unpaid/partial/overdue.
- Benefit distribution is only one free-text summary, not structured allocation.
- There is no post-evaluation record for conversion effect, social benefit,
  economic benefit, evaluation time, or reviewer note.
- There is no milestone/history table for intent, negotiation, signing,
  payment, or post-evaluation events.

Therefore Step 84 is a local/demo ledger MVP. It is not a real contract, legal,
payment, settlement, benefit-distribution, or post-evaluation workflow.

## 2. Candidate Capability Assessment

| Candidate | Value | Cost / risk | MVP decision |
| --- | --- | --- | --- |
| Contract detail status: `DRAFT`, `SIGNED`, `ACTIVE`, `COMPLETED`, `CANCELLED` | Makes the conversion card look closer to a real management process without changing the achievement lifecycle. | Low-medium. Additive enum/field. Must avoid implying real contract signing or legal review. | Include. Use a local contract-state field, not a contract system integration. |
| Revenue collection status: `UNPAID`, `PARTIAL`, `PAID`, `OVERDUE`, `WAIVED` | Directly answers whether recorded revenue has arrived and enables visible risk badges. | Low-medium. Additive enum/field plus optional due/received dates. Must avoid real payment/reconciliation claims. | Include. Local status only. |
| Structured benefit allocation | Replaces one vague summary with reviewable unit/team/person/platform allocation rows or JSON. | Medium. A child table is more queryable but costs more API/UI work; JSON is cheaper and enough for local demo. | Include as JSON for MVP, defer normalized allocation table. |
| Post-evaluation record | Shows conversion effect, social/economic benefit, remarks, and evaluation time. | Low-medium if stored on conversion record; higher if modeled as review workflow. | Include as nullable local evaluation fields. |
| Conversion milestones | Good timeline story: intent, negotiation, signing, collection, evaluation. | Medium-high if stored as a separate event table with ordering and audit semantics. | Defer first implementation. Derive a lightweight display from statuses/dates in MVP. |
| Risk / overdue reminders | Useful local risk cue for unpaid/overdue conversions. | Low if computed from local revenue status and due date; high if scheduled reminders are added. | Include computed local warning only; no scheduler. |
| Dashboard / Custom Reports aggregate enhancement | Makes the deeper data visible beyond detail page. | Medium. Requires repository/service/report additions and tests. | Include narrow aggregates: revenue collection status and evaluated count. |

## 3. Recommended MVP Scope

Recommended first implementation slice:

**A. Extend each conversion ledger record with local status detail fields,
structured allocation JSON, and one post-evaluation summary.**

Include:

- `contractStatus`: local contract lifecycle status.
- `revenueStatus`: local collection status.
- `revenueDueDate`: optional local due date for overdue/risk display.
- `revenueReceivedDate`: optional local received date.
- `benefitAllocations`: optional JSON array of local aggregate allocations.
- `evaluationEffect`: optional enum for local post-evaluation outcome.
- `evaluationSocialBenefit`: optional text.
- `evaluationEconomicBenefit`: optional text.
- `evaluationRemarks`: optional text.
- `evaluatedAt`: optional local evaluation date/time.

Why this slice:

- It deepens the existing Step 84 ledger without creating a broad new workflow.
- It is visible in the current `AchievementDetail` panel and can be summarized
  in Dashboard/Custom Reports.
- It is additive and can preserve all existing conversion rows.
- It does not require contract files, finance payment proof, real legal review,
  bank reconciliation, or external APIs.

Explicitly defer:

- Real contract drafting, signing, legal approval, contract file upload, seal
  management, and document versioning.
- Real payment, invoice, settlement, bank, finance, or reconciliation systems.
- Normalized allocation table with per-person settlement workflow.
- Milestone/event history table and scheduled reminder engine.
- Export/download/raw JSON/sensitive drilldown.
- Production migration execution or production acceptance.

## 4. DB / Schema Plan

This MVP should use an additive Prisma schema and migration.

Reason:

- The recommended slice adds durable fields that must be visible in Web, API,
  Dashboard, and Custom Reports.
- Storing the data only in existing `remarks` or `benefitDistributionSummary`
  would make aggregation, validation, and review acceptance weak.
- Additive nullable fields preserve existing Step 84 records and avoid breaking
  current API clients.

Recommended enums:

```prisma
enum AchievementConversionContractStatus {
  DRAFT
  SIGNED
  ACTIVE
  COMPLETED
  CANCELLED
}

enum AchievementConversionRevenueStatus {
  UNPAID
  PARTIAL
  PAID
  OVERDUE
  WAIVED
}

enum AchievementConversionEvaluationEffect {
  NOT_EVALUATED
  POSITIVE
  NEUTRAL
  NEGATIVE
}
```

Recommended additive fields on `AchievementConversion`:

| Field | Type | Nullable / default | Index / constraint | Notes |
| --- | --- | --- | --- | --- |
| `contractStatus` | `AchievementConversionContractStatus` | `@default(DRAFT)` | `@@index([departmentId, contractStatus])` | Local lifecycle status only; does not mean legal contract exists. |
| `revenueStatus` | `AchievementConversionRevenueStatus` | `@default(UNPAID)` | `@@index([departmentId, revenueStatus])` | Local collection status only; not bank/payment truth. |
| `revenueDueDate` | `DateTime? @db.Date` | nullable | `@@index([revenueDueDate])` | Used for local overdue/risk cues. |
| `revenueReceivedDate` | `DateTime? @db.Date` | nullable | no first-step index | Local bookkeeping date only. |
| `benefitAllocations` | `Json?` | nullable | none | Array of aggregate allocation rows. |
| `evaluationEffect` | `AchievementConversionEvaluationEffect` | `@default(NOT_EVALUATED)` | `@@index([departmentId, evaluationEffect])` | Dashboard/report aggregate input. |
| `evaluationSocialBenefit` | `String? @db.VarChar(1000)` | nullable | none | No sensitive evidence payload. |
| `evaluationEconomicBenefit` | `String? @db.VarChar(1000)` | nullable | none | Narrative summary, not finance payload. |
| `evaluationRemarks` | `String? @db.VarChar(1000)` | nullable | none | Local note only. |
| `evaluatedAt` | `DateTime?` | nullable | `@@index([evaluatedAt])` | Local evaluation timestamp/date. |

Suggested JSON shape for `benefitAllocations`:

```json
[
  {
    "category": "UNIT",
    "label": "Institute",
    "amount": "30000.00",
    "ratio": "0.50",
    "note": "Aggregate local allocation"
  }
]
```

Validation rules:

- `category` allowlist: `UNIT`, `TEAM`, `PERSON`, `PLATFORM`, `OTHER`.
- `label`: 1 to 120 characters.
- `amount`: optional non-negative decimal with two places.
- `ratio`: optional number from 0 to 1.
- At least one of `amount` or `ratio` should be present for each row.
- Optional aggregate validation: sum of ratios must be <= 1; sum of amounts
  must not exceed `revenueAmount` when `revenueAmount` is present.

Security and privacy:

- Do not store contract file content, payment proof, invoice image, bank account,
  raw finance payload, external response, token, cookie, credential, object key,
  checksum, or legal document text in these fields.
- Audit should keep masked summaries only: status changes, booleans indicating
  evaluation/allocation presence, allocation count, due/received/evaluated dates,
  and amount-provided booleans.
- Existing readable/update policy must continue to scope all rows through the
  parent achievement.

## 5. API Plan

Keep the existing nested conversion API and extend its DTOs/response shape:

- `GET /achievements/:achievementId/conversions`.
- `POST /achievements/:achievementId/conversions`.
- `PATCH /achievements/:achievementId/conversions/:conversionId`.

No new endpoint is required for the first MVP. Extending the existing resource is
the smallest coherent path because evaluation, allocation, contract status, and
collection status are local attributes of the ledger record.

DTO additions:

- Accept optional `contractStatus`.
- Accept optional `revenueStatus`.
- Accept optional `revenueDueDate`.
- Accept optional `revenueReceivedDate`.
- Accept optional `benefitAllocations`.
- Accept optional `evaluationEffect`.
- Accept optional `evaluationSocialBenefit`.
- Accept optional `evaluationEconomicBenefit`.
- Accept optional `evaluationRemarks`.
- Accept optional `evaluatedAt`.

Policy:

- Continue using `UserContextGuard` and `PermissionGuard`.
- Continue requiring `achievement:read_department` for the current MVP unless a
  later authorization step introduces a separate update permission.
- Continue filtering list/update through the parent achievement policy.
- Continue allowing creation only for archived achievements.

Response exclusions:

- Do not return real contract files.
- Do not return payment vouchers or invoice attachments.
- Do not return raw finance payloads, external provider responses, credentials,
  tokens, cookies, connection strings, object keys, or checksums.

Future endpoint candidates, deferred:

- `POST /achievements/:achievementId/conversions/:conversionId/milestones`.
- `GET /achievements/:achievementId/conversions/:conversionId/milestones`.
- `POST /achievements/:achievementId/conversions/:conversionId/evaluations`
  if evaluation later becomes a multi-record review history.

## 6. Web Plan

Extend the existing `AchievementDetail` conversion ledger panel:

- Add compact tags for `contractStatus`, `revenueStatus`, and `evaluationEffect`.
- Add local due/received/evaluated dates to the card details.
- Add a small allocation summary block showing allocation category, label,
  amount/ratio, and note.
- Add a post-evaluation block with effect, social benefit, economic benefit, and
  remarks.
- Add create/edit form controls for the new fields:
  - Selects for contract/revenue/evaluation statuses.
  - Date inputs for due/received/evaluated dates.
  - A simple repeatable local allocation editor for 0 to 5 aggregate rows.
  - Text areas for social/economic/evaluation remarks.

Dashboard additions:

- Add conversion revenue-status distribution.
- Add local overdue conversion count computed from `revenueStatus = OVERDUE` or
  from `revenueDueDate < today` with unpaid/partial status.
- Add evaluated conversion count or evaluation-effect distribution.

Custom Reports additions:

- Extend `conversion-funnel` with revenue-status buckets and evaluated count, or
  add a new aggregate-only static template named `conversion-deepening-summary`.
- Keep output aggregate-only; no row-level contract/payment/evaluation details.

UI state requirements:

- Empty state: "No conversion records" remains valid; new fields should render
  as "not recorded" when absent.
- Error state: reuse current conversion error mapping for forbidden, invalid
  state, and validation failures.
- Permission state: keep read-only notice when current context cannot create or
  update conversion records.
- Boundary copy must explicitly say this is a local/demo conversion deepening
  ledger and not real contract, legal, payment, finance, invoice, settlement, or
  external-system acceptance.

## 7. Test Plan

Backend:

- API/service/controller tests for create/update/list with the new fields.
- Validation tests for enum values, date strings, text length, allocation JSON
  shape, ratio/amount bounds, and revenue amount constraints.
- Permission tests proving list/update are still scoped by readable achievements.
- Audit tests proving no raw contract, payment, finance, allocation text,
  evaluation text, or external payload is written into audit values.
- Dashboard repository/service tests for revenue-status and evaluation summary.
- Reports tests for aggregate-only conversion deepening output.

Schema:

- `corepack pnpm prisma:validate` with an explicit local synthetic
  `DATABASE_URL`.
- `corepack pnpm exec prisma generate` with an explicit local synthetic
  `DATABASE_URL`.
- No production migration execution in the implementation step.

Web:

- `AchievementDetail` tests for rendering new fields, create/edit payloads,
  validation errors, empty state, forbidden/read-only state, and boundary copy.
- `Dashboard` tests for new conversion aggregate metrics.
- `CustomReports` tests if the report response or template list changes.

Local acceptance:

- Use localhost/local-demo/synthetic data only.
- Seed or create a conversion showing:
  - signed/active contract status,
  - partial or overdue local revenue status,
  - structured aggregate benefit allocations,
  - post-evaluation summary.
- Capture local UI evidence in an untracked `.local-step110-conversion-deepening-acceptance/`
  directory only if Step 110-B-C requests screenshots/logs.

Not required:

- Typecheck/test/build in this docs-only Step 107-B-C.
- Production/VPS/production DB access.
- Real finance/payment/contract/legal provider calls.
- Real contract files, invoices, vouchers, settlement records, or bank data.

## 8. Next Implementation Steps

Recommended sequence:

1. Step 108-B-C: Prisma schema + backend extension.
   Add additive enums/fields/migration, extend DTO/domain/repository/service,
   preserve parent achievement policy, add Dashboard/Reports aggregate support,
   and run API plus Prisma validation/generation gates.
2. Step 109-B-C: Web extension.
   Extend `AchievementDetail`, Dashboard, and Custom Reports UI as needed, with
   local/demo boundary copy and Web tests.
3. Step 110-B-C: local UI acceptance / closure.
   Run localhost/local-demo/synthetic browser acceptance, archive the local
   evidence, update memory-bank closure docs, and keep screenshots/logs
   untracked.

If Step 108-B-C needs to reduce scope, keep `contractStatus`, `revenueStatus`,
`benefitAllocations`, and one evaluation summary first; defer Dashboard/Custom
Reports aggregate enhancement to Step 109-B-C.
