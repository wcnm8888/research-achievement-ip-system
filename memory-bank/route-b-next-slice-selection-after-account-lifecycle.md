# Route B Next Slice Selection After Account Lifecycle

Date: 2026-07-06

Status: docs-only reselection after the account lifecycle local/demo loop.

## Scope

This document closes the Step 115-118 account lifecycle line and reselects the
next Route B product slice for review/demo value.

It does not authorize implementation, source changes, schema changes,
migrations, service startup, Docker operations, production access, real
external-system integration, or secret handling.

## Account Lifecycle Closure

Step 115 produced the technical plan for a local/demo account lifecycle
enhancement. It confirmed that the first MVP should avoid schema/migration,
reuse existing account, credential, session, role, audit, and lifecycle-token
models, and exclude real HR/SSO, real email/SMS, raw lifecycle delivery
material, and production identity acceptance.

Step 116 implemented API projection hardening. Account-management list/detail
responses stopped returning internal login/delivery identifiers, added
`loginEligibility`, added safe lifecycle action summaries, and added bounded
role-change summaries. Existing guards and permissions were preserved.

Step 117 added the Web management enhancement. AccountManagement now shows
login eligibility in list/detail, lifecycle action summary and role-change
summary in detail, explicit missing-permission reasons, and stable empty
states without raw debug or export surfaces.

Step 118 archived localhost/local-demo/synthetic UI acceptance. The result was
PASS with caveat. This is not production identity acceptance.

The line did not connect real HR/SSO, did not send real email/SMS, did not use
production DB/VPS, did not operate Docker, and did not claim production
identity readiness.

## Caveat Classification

These caveats are local demonstration data coverage gaps, not production
acceptance:

- The local seed lacked pending-activation, active-credential, and persistent
  disabled sample users.
- The local demo personas lacked a system-config user that is missing only the
  invite-specific or reset-specific lifecycle permission.
- The local enable operation wait timed out in the browser script, but the
  subsequent UI and API checks confirmed the user was restored to ACTIVE.

The account lifecycle line is therefore closed as local/demo/synthetic PASS
with caveat only. It must not be described as production PASS.

## Scoring Method

Scores use 1-5, where 5 is strongest or most favorable for the dimension.

For safety risk, schema need, production-overclaim risk, and Docker/local
environment risk, higher scores mean lower risk.

| Candidate | Review-visible value | Local/demo closure | Safety/privacy | No schema/migration fit | Low overclaim risk | Low Docker/env risk | Product rank |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Secret authorization management enhancement | 5 | 3 | 2 | 2 | 3 | 5 | 1 |
| Local Docker / untracked artifact read-only inventory | 2 | 5 | 5 | 5 | 5 | 3 | 2 |
| Scheduled reminders / planned task enhancement | 3 | 4 | 3 | 3 | 2 | 4 | 3 |
| Custom report enhancement templates | 3 | 5 | 4 | 5 | 4 | 5 | 4 |
| Attachment management enhancement | 4 | 3 | 2 | 2 | 3 | 4 | 5 |
| Mobile / responsive demand reassessment | 2 | 4 | 4 | 5 | 5 | 5 | 6 |

The product rank weights Route B product value above low-effort housekeeping
and avoids choosing another incremental report template pass immediately after
the custom report loop is already closed.

## Candidate Notes

### 1. Secret authorization management enhancement

Recommended next product slice, but only as a docs-only safety plan first.

Why:

- High review-visible value: it connects RBAC, department isolation, sensitive
  data authorization, and audit into a story reviewers can inspect.
- It is security-critical enough that implementation should not start without
  a threat model, safe projection plan, permission matrix, and local acceptance
  design.
- It should be scoped to local/demo/synthetic administration and audit
  visibility first, not broad production access tooling.

Recommended next step:

**Step 120 - Secret authorization management enhancement safety plan.**

Non-scope:

- No sensitive content exposure.
- No broad grant console implementation.
- No production authorization acceptance.
- No schema/migration unless a later plan proves an additive change is needed.
- No real external identity provider.

### 2. Local Docker / untracked artifact read-only inventory

Best non-product housekeeping option if the user is more concerned about local
environment sprawl.

Why:

- It can reduce ambiguity around long-lived untracked artifacts and local
  service state.
- It must remain inventory only.

Non-scope:

- No stop, delete, clean, prune, move, archive, or modification.
- No Docker operation beyond read-only inspection if explicitly allowed by the
  next prompt.
- `.local-step118-account-lifecycle-acceptance/web-dev.pid` should be recorded
  only as a local acceptance run trace, not cleaned without explicit user
  authorization.

### 3. Scheduled reminders / planned task enhancement

Useful product line, but it is easy to overstate as real scheduler, queue, or
delivery capability. It should start with a local mock scheduler/notification
plan if selected.

### 4. Custom report enhancement templates

Very feasible and low risk, but less compelling as the immediate next Route B
slice because custom reports already have a closed MVP and local acceptance.
This is a good fallback if the user wants low-risk incremental scoring.

### 5. Attachment management enhancement

Product value is real, but storage, preview, download, secret level, and
retention boundaries make it riskier than a docs-only secret authorization
plan. It should not be implemented without a dedicated safety design.

### 6. Mobile / responsive demand reassessment

Safe and cheap as research, but less valuable for the next competition-facing
product slice unless the user specifically wants mobile evidence.

## Recommendation

Primary recommendation:

**Start Step 120 with Secret authorization management enhancement as a
docs-only safety plan.**

This is the best Route B continuation after account lifecycle because it
extends the same administration/security story while keeping the next move
conservative and reviewable.

Alternative if environment control is the user's priority:

**Run a local Docker / untracked artifact read-only inventory.**

That should be treated as housekeeping, not a Route B product enhancement, and
must not clean, delete, stop, move, or archive anything without explicit
authorization.
