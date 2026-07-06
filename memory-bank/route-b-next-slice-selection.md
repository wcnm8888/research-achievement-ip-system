# Route B Next Slice Selection

Date: 2026-07-06

Status: recommended next Route B slice selected.

## Context

The first Route B local loops are now closed:

- Custom Reports MVP: closed as local/demo aggregate-only reports.
- Achievement Conversion Deepening MVP: closed as localhost/local-demo/synthetic
  conversion detail, Dashboard, and Custom Reports aggregate enhancement.
- ImportJobItem Web Safe Row Display: closed as route-scoped safe row display
  inside ImportJob detail.

This document selects the next scoped product slice. It is docs-only. It does
not authorize implementation, service startup, Docker changes, production
access, real external-system integration, migrations, or secret handling.

## Selection Criteria

Scores use this scale:

- Value: 5 is strongest review/demo value.
- Cost: 1 is cheapest, 5 is most expensive.
- Risk: 1 is lowest safety/privacy risk, 5 is highest.
- Local closure: 5 is easiest to close with localhost/local-demo/synthetic
  evidence.

## Candidate Matrix

| Candidate slice | Original requirement link | Current state | Review-visible value | Implementation cost | Risk | Needs DB/schema? | Needs Docker/local service? | Needs production/real external system? | Local closure fit | Recommended priority | Recommended next Step | Explicit non-scope |
| --- | --- | --- | ---: | ---: | ---: | --- | --- | --- | ---: | --- | --- | --- |
| More complete account lifecycle | Account management, RBAC, HR/SSO reservation, lifecycle notification | Local lifecycle and simulated notification are visible; account management remains partial | 5 | 3 | 3 | Maybe, depending on lock/state depth | No new Docker; existing local API/Web only when implementation starts | No for local MVP; real HR/SSO/email/SMS remains Route C | 5 | P0 | Step 115: account lifecycle enhancement technical plan | No real HR/SSO, no real email/SMS, no raw token/link/password display, no production identity acceptance |
| Secret authorization management enhancement | RBAC, department isolation, secret data authorization, audit | `ResourceAccessGrant` and secret read policy exist; full grant workflow/admin console is partial | 4 | 4 | 5 | Likely yes for richer grant workflow/history | No new Docker for plan; implementation may use existing local stack | No | 3 | P1 | Step 115 alternative: secret grant management security plan | No secret attachment encryption production design, no sensitive content exposure, no broad grant tool without security review |
| Attachment management enhancement | Attachment versions, permissions, secret level, storage adapter | Basic attachment model/API/Web entry and audit exist | 3 | 4 | 4 | Maybe for version/preview metadata | No new Docker for plan | No for local adapter; real object storage is Route C/D | 3 | P2 | Step 115 alternative: attachment boundary design | No real object storage, no object key/checksum exposure, no raw download expansion without safety plan |
| Scheduled reminders / planned task enhancement | Fee reminders, scheduled reports, notification pipeline | ReminderTask/Notification and mock/in-app boundaries exist; scheduler/cron/queue not closed | 3 | 3 | 3 | Maybe for schedule policy/history | No new Docker for plan; avoid production cron/queue | No for local mock scheduler | 4 | P2 | Step 115 alternative: local scheduler/mock queue plan | No real email/SMS, no production cron/queue operations, no external delivery |
| Custom report enhancement templates | Advanced/custom reports, dashboard decision support | MVP has 5 aggregate templates; ImportJob aggregate/external mock overview templates remain optional | 3 | 2 | 2 | No if static aggregate templates | No | No | 5 | P2 | Step 115 alternative: aggregate template extension plan | Aggregate-only; no export, raw JSON, saved templates, scheduled delivery, or drilldown |
| Mobile / responsive demand reassessment | Mobile is listed as phase-two/deferred scope | No full mobile line exists; first version excludes full mobile | 2 | 1 for research, 5 for implementation | 2 for research, 4 for implementation | No for reassessment | No | No | 4 for research only | P3 | Step 115 alternative: mobile/responsive needs assessment | No direct mobile implementation, no new client, no broad responsive rebuild |
| Local Docker / untracked artifact read-only inventory | Housekeeping and local environment safety | Existing untracked directories and local Docker containers persist | 2 | 1 | 2 | No | Read-only Docker inspection only | No | 5 | Housekeeping, not product P0 | Separate housekeeping Step, not Route B product line | Inventory only; no stop, delete, clean, prune, move, or archive |

## Recommended Slice

Recommended next Route B product slice:

**More complete account lifecycle local/demo enhancement.**

Recommended next Step:

**Step 115 - Account lifecycle enhancement technical plan.**

Suggested scope for Step 115:

- Define a local/demo account lifecycle enhancement MVP.
- Cover disable/restore, lock state, role change audit summary, lifecycle
  delivery safety summary, and administrator-facing status explanations.
- Keep it Web/API local-demo scoped and review-visible.
- Decide whether the first implementation can avoid schema changes by using
  existing account/user/session/lifecycle fields and audit records.
- Define tests and UI acceptance for system-admin vs non-system-config users.
- Explicitly exclude real HR/SSO, real email/SMS, raw token/link/password
  display, production identity acceptance, and credential export.

## Why This Beats The Alternatives

Account lifecycle is the best next slice because it balances visible product
value and local safety:

- It is easy for reviewers to understand: administrators can see account
  states, lifecycle actions, role changes, and safety summaries.
- It continues a partially completed area instead of opening a broad new client
  surface.
- It can stay local/demo/synthetic and avoid real HR/SSO or email/SMS.
- It strengthens security posture if the plan keeps token/password/session
  material out of UI, logs, docs, and evidence.

Secret authorization is important but higher risk and should start with a
dedicated security design. Attachment enhancement is operationally useful but
quickly touches storage/download/encryption boundaries. Scheduled reminders are
useful, but real queue/cron/email/SMS wording is easy to overclaim. Mobile
reassessment is cheap but less immediately demonstrable. Custom report template
enhancement is safe but incremental after the MVP. Docker/untracked inventory is
worth doing as safety housekeeping, not as the primary Route B product slice.

## Next-Step Boundary

Step 115 should remain a technical plan unless the user explicitly asks for
implementation. It should not:

- read `.env` or `.env.production`;
- access production, VPS, or production DB;
- call real HR/SSO, email, SMS, finance, DOI, or patent systems;
- start, create, stop, delete, or clean Docker containers/volumes;
- touch existing untracked artifacts or `.local-*` evidence directories;
- expose passwords, password hashes, reset/invite tokens, session IDs, cookies,
  `DATABASE_URL`, connection strings, API keys, or provider credentials.
