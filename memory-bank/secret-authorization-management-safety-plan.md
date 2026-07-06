# Secret Authorization Management Safety Plan

Date: 2026-07-06

Status: docs-only safety plan for the next Route B product slice.

## Scope

This plan defines a conservative local/demo/synthetic path for Secret
authorization management enhancement. It does not implement APIs, Web UI,
schema changes, migrations, services, Docker operations, production access, or
real external-system integration.

The first version should prioritize safe read-only projection and reviewer
visibility. It should show authorization posture and grant summaries without
showing classified resource content, attachment bodies, raw storage metadata,
or broad grant consoles.

## Current Capability Inventory

Existing capabilities found by targeted read-only inspection:

- `ResourceAccessGrant` stores exact resource grants by `resourceType`,
  `resourceId`, `granteeType`, `granteeId`, `grantType`, `status`,
  `startsAt`, `expiresAt`, `createdById`, `createdAt`, and `revokedAt`.
- `Achievement.secretLevel` and `Attachment.secretLevel` provide current
  resource sensitivity markers. `SECRET` and `CONFIDENTIAL` are restricted by
  the existing secret policy.
- `AuditLog.targetSecretLevel`, action, target type, timestamps, and masked
  old/new values can support safe audit summaries. Raw audit JSON must not be
  exposed in a management surface.
- Permission constants already include `resource_grant:create` and
  `resource_grant:revoke`; the old broad `secret:grant` seed permission is
  archived in the local seed.
- Grant type constants include `SECRET_READ`, `SECRET_WRITE`,
  `ATTACHMENT_DOWNLOAD`, and `AUDIT_READ`.
- Grantee type constants include `USER`, `ROLE`, and `DEPARTMENT`.
- Resource type constants include `ACHIEVEMENT`, `ACHIEVEMENT_CONVERSION`,
  `ATTACHMENT`, `FEE_RECORD`, `WORKFLOW_INSTANCE`, and `AUDIT_LOG`.
- `SecretAccessPolicyService` requires base resource visibility before checking
  restricted secret access.
- `AttachmentAccessPolicyService` requires static attachment permissions,
  active attachment status, parent visibility or direct attachment grant, and
  restricted secret grant checks for restricted attachments.
- Achievement list already redacts restricted titles for users without an
  effective `SECRET_READ` grant.
- Web types already expose secret-level labels, redaction flags, attachment
  metadata, and masked audit log shapes; there is no dedicated secret
  authorization management page yet.

## Existing Data Model And Permission Boundary

The current model is sufficient for a read-only management summary:

- Base visibility remains RBAC and department isolation. Resource grants do not
  bypass the initial department/owner policy for normal resource discovery.
- Restricted access is additive: a user must first have base resource
  visibility, then an effective grant for restricted resource reads.
- Effective grants require matching resource type, resource id, grant type,
  active status, not revoked, valid time window, and matching grantee.
- User grants match exact user id, role grants match role ids in the user
  context, and department grants match the user's current department id.
- Attachment download is separate from metadata visibility and remains bounded
  by `attachment:download` plus direct attachment grant or parent access.
- Audit visibility should use masked audit read behavior only. The management
  surface should project audit aggregates and bounded recent summaries, not raw
  audit records.

Primary permission boundary recommendation:

- Read-only secret authorization management should be gated by
  `system:config` for the first local/demo slice unless a later additive
  `resource_grant:read` permission is explicitly designed.
- Grant mutation is out of first-slice scope. If a later slice adds mutation,
  it should require `resource_grant:create` or `resource_grant:revoke` plus
  scoped resource visibility and audit reason capture.
- `resource_grant:create` and `resource_grant:revoke` must not imply access to
  classified resource content, attachment bodies, object keys, or download
  material.

## Local Demo MVP Goal

The first review-visible MVP should be read-only:

- Show a safe overview of restricted resources and current grant posture.
- Show aggregate counts by resource type, secret level, grant type, grantee
  type, grant status, and expiry bucket.
- Show recent grant/audit activity as bounded safe summaries.
- Show per-resource authorization posture without revealing restricted titles
  when the viewer lacks content access.
- Show stable empty states and caveats when local seed data lacks representative
  grants.
- Avoid creating, revoking, extending, exporting, downloading, or batch-editing
  grants.

## Threat Model

Primary threats for this slice:

- Sensitive content leakage through management projections, including
  classified achievement body, attachment body, file name misuse, object key,
  storage path, checksum, or direct download material.
- Privilege expansion through a global grant console, cross-department grant
  creation, or batch grant assignment.
- Confusing grant management visibility with permission to read the underlying
  restricted resource.
- Exposing raw permission graph, raw audit JSON, actor profile data, debug
  state, export payloads, or download links.
- Stale or future-dated grants being counted as effective.
- Department grants being interpreted as broader than the current exact
  department match behavior.
- Role grants creating a larger blast radius than user grants without clear
  labeling.
- Local/demo/synthetic acceptance being overstated as production authorization
  acceptance.

## Permission Matrix

| Persona / permission state | Read safe overview | Read per-resource safe grant summary | Create grant | Revoke grant | Read content | Download attachment |
| --- | --- | --- | --- | --- | --- | --- |
| `system:config` user | Yes, first MVP | Yes, first MVP | No, first MVP | No, first MVP | No extra right from this page | No extra right from this page |
| `resource_grant:create` only | No first-MVP management entry unless also gated by `system:config` | No first-MVP management entry | Future only | No | No extra right | No extra right |
| `resource_grant:revoke` only | No first-MVP management entry unless also gated by `system:config` | No first-MVP management entry | No | Future only | No extra right | No extra right |
| `audit:read_masked` auditor | Future masked audit-only summary if explicitly scoped | Future masked audit-only summary | No | No | No extra right | No extra right |
| Resource owner / department reader | No management entry by default | No management entry by default | No | No | Existing policy only | Existing policy only |
| User without system/config or grant permissions | No | No | No | No | Existing policy only | Existing policy only |

If later product requirements need a non-system-admin management persona, add a
dedicated read permission such as `resource_grant:read` in a separate schema or
seed plan. Do not overload create/revoke permissions as read-all management
access without review.

## Safe Projection Field Design

Recommended overview DTO:

```ts
type SecretAuthorizationOverview = {
  restrictedResourceCount: number;
  restrictedResourceCountsByType: Record<string, number>;
  restrictedResourceCountsBySecretLevel: Record<string, number>;
  grantCountsByStatus: Record<string, number>;
  grantCountsByType: Record<string, number>;
  grantCountsByGranteeType: Record<string, number>;
  activeGrantCount: number;
  expiredGrantCount: number;
  revokedGrantCount: number;
  expiringSoonCount: number;
  caveats: string[];
};
```

Recommended per-resource safe summary DTO:

```ts
type SecretAuthorizationResourceSummary = {
  resourceType: string;
  resourceId: string;
  safeResourceLabel: string;
  departmentId: string | null;
  secretLevel: string;
  isRestricted: boolean;
  contentRedacted: boolean;
  activeGrantCount: number;
  grantCountsByType: Record<string, number>;
  grantCountsByGranteeType: Record<string, number>;
  latestGrantCreatedAt: string | null;
  latestGrantRevokedAt: string | null;
  nearestGrantExpiresAt: string | null;
  caveats: string[];
};
```

Recommended bounded grant summary DTO:

```ts
type SecretAuthorizationGrantSummary = {
  resourceType: string;
  resourceId: string;
  safeResourceLabel: string;
  granteeType: string;
  granteeSafeLabel: string;
  grantType: string;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};
```

Recommended audit summary DTO:

```ts
type SecretAuthorizationAuditSummary = {
  operation: string;
  resourceType: string;
  targetSecretLevel: string | null;
  grantType: string | null;
  granteeType: string | null;
  reasonProvided: boolean;
  createdAt: string;
};
```

Projection rules:

- Use bounded recent rows, for example the latest 5 or 10 rows per detail
  surface.
- Use safe labels such as role code, department id, masked user display label,
  resource type, and redaction state.
- Preserve resource ids only when they are already Web-facing identifiers in
  the surrounding UI; otherwise prefer safe labels and counts.
- Never include the grant creator's email, raw actor profile, raw audit JSON,
  raw permission graph, content body, attachment body, or storage internals.

## Forbidden Display Fields

The management surface must not display or serialize:

- Classified achievement body, private notes, or other sensitive resource
  content.
- Attachment original file body or private attachment content.
- Object key, storage key, internal storage path, provider path, direct
  download URL, pre-signed URL, checksum, hash, or raw storage metadata.
- Raw permission graph, raw RBAC join rows, raw audit JSON, debug data, export
  payloads, download panels, or unbounded drilldown.
- Raw actor profile, operator email, user credential material, session id,
  cookie, password, token, API key, connection string, or environment-derived
  value.
- Batch authorization console, global grant console, cross-department
  grant-all action, or bulk revoke/extend action.

## API Slice Recommendation

First implementation slice after this plan should be read-only and
no-schema-change:

- Add a dedicated API module such as `secret-authorization` only if approved.
- Endpoints should be safe projections only:
  - `GET /secret-authorization/overview`
  - `GET /secret-authorization/resources`
  - `GET /secret-authorization/resources/:resourceType/:resourceId/grants`
- Gate the first MVP with `system:config`.
- Query existing `ResourceAccessGrant`, `Achievement`, `Attachment`, and
  masked audit sources only.
- Do not return attachment bodies, download DTOs, storage fields, raw audit
  payloads, or grant mutation forms.
- Include negative serialization tests for every forbidden field family.

Mutation endpoints should be deferred to a separate safety plan and should not
be added in the same slice as the first read-only management view.

## Web Slice Recommendation

The Web first slice should add a read-only management view:

- Show overview cards for restricted resource count, active grant count,
  revoked/expired count, expiring-soon count, and caveats.
- Show a table of safe resource summaries with resource type, safe label,
  department id, secret level, restricted/redacted flag, and aggregate grants.
- Show bounded recent safe grant/audit summaries in detail.
- Hide the navigation entry and avoid API calls when the user lacks
  `system:config`.
- Show explicit non-sensitive empty states when there are no restricted
  resources, no grants, or no audit rows.
- Do not render raw JSON, debug, export, download, batch action, or mutation
  controls in the first version.

## Schema And Migration Judgment

Step 120 does not need schema or migration changes.

The first read-only MVP should not need schema or migration changes because the
existing `ResourceAccessGrant`, secret-level fields, department/owner fields,
and masked audit infrastructure are enough for safe summaries.

Possible later additive schema work, only if a mutation workflow is explicitly
selected:

- Dedicated `resource_grant:read` permission or equivalent seed/config update.
- Grant request/approval table with reason, reviewer, decision, and expiry
  policy.
- Required reason field for create/revoke operations.
- Stronger uniqueness or active-window constraints if current DB constraints
  are insufficient.
- Structured audit operation codes for grant create/revoke/expire events.
- Optional safety lock/version fields for concurrent grant mutation.

Those are future design items only and must not be mixed into the read-only
local/demo MVP without a separate prompt.

## Follow-up Step Split

Recommended sequence:

1. Step 121 - Secret authorization read-only API projection hardening.
   Implement safe overview/list/detail DTOs using existing data only, no schema
   or migration, and no mutation endpoints.
2. Step 122 - Secret authorization Web read-only management view.
   Add reviewer-visible summaries, permission boundary display, empty states,
   and forbidden-field tests.
3. Step 123 - Secret authorization local UI acceptance and closure.
   Run localhost/local-demo/synthetic acceptance, archive screenshots/notes,
   scan for forbidden fields, and record caveats.
4. Optional later step - Grant mutation workflow safety plan.
   Design create/revoke/approval only after read-only projections are closed.

## Test Matrix

API tests:

- Deny overview/list/detail without `system:config`.
- Return only safe fields for users with `system:config`.
- Count active, expired, revoked, future-dated, and expiring-soon grants
  correctly.
- Separate counts by `resourceType`, `secretLevel`, `grantType`,
  `granteeType`, and `status`.
- Preserve base resource visibility and department isolation assumptions.
- Never serialize attachment body, object key, storage key, internal path,
  checksum, direct download link, raw audit JSON, raw permission graph, actor
  email, credential material, session/cookie material, token material,
  password material, environment-derived values, or connection strings.

Policy tests:

- Effective grant requires active status, not revoked, valid time window,
  exact resource, exact grant type, and matching grantee.
- `SECRET` and `CONFIDENTIAL` require `SECRET_READ`; `PUBLIC` and `INTERNAL`
  do not require extra secret grant.
- Attachment download remains bounded by `attachment:download` and direct
  attachment or parent grant rules.
- Department grants match current department only.

Web tests:

- Hide navigation and avoid API calls without `system:config`.
- Show overview, resource summary, grant summary, and audit summary for allowed
  users.
- Show stable empty states with no `undefined` or `null` text.
- Do not render raw JSON/debug/export/download panels or mutation controls in
  the first read-only version.
- Negative assertions for forbidden words and field families.

Acceptance tests:

- Local/demo/synthetic only.
- Use available seeded roles and data if present; record caveat if local data
  lacks representative restricted resources or grants.
- No production identity, production authorization, production DB, VPS, Docker,
  or real external-system acceptance claim.

## Local UI Acceptance Plan

Acceptance should be a separate later step after implementation:

- Reuse already available local services if running. Do not start, stop,
  create, delete, or clean Docker.
- Open the read-only management page with a `system:config` demo persona and
  capture safe overview/detail screenshots.
- Switch to a non-system-config demo persona and verify the page entry is not
  visible and the API is not called.
- Verify empty states if local seed lacks grant rows.
- Scan page text, console output, screenshots, and evidence notes for forbidden
  sensitive field families.
- Record the result as local/demo/synthetic PASS, PASS with caveat, or BLOCKED.
  Do not convert caveats into production PASS.

## Non-production Boundary

This line is not production authorization acceptance. It does not prove real
HR/SSO identity lifecycle, production RBAC correctness, production storage
safety, production audit completeness, production incident readiness, or
production data isolation.

All claims must stay local/demo/synthetic until a separately authorized
production readiness route exists.
