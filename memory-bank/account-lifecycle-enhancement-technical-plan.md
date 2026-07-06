# Account Lifecycle Enhancement Technical Plan

Date: 2026-07-06

Status: docs-only technical plan for Step 115.

Recommended next implementation step: Step 116 - account lifecycle API
projection hardening, no schema/migration.

## Goals

Build a more review-visible local/demo account lifecycle slice on top of the
existing account-management and account-lifecycle modules.

The first implementation should make account state and login eligibility easier
to review, without expanding into real identity-provider integration or
credential handling.

## Non-Goals

- Do not connect real HR/SSO.
- Do not send real email or SMS.
- Do not handle real token delivery as acceptance evidence.
- Do not claim production identity acceptance.
- Do not export accounts, credentials, sessions, links, or lifecycle tokens.
- Do not display passwords, password hashes, token hashes, raw tokens, session
  IDs, cookies, `DATABASE_URL`, connection strings, or provider credentials.
- Do not start or manage Docker, migrations, production runbooks, production DB,
  VPS, or real external systems.

## Current Capability Inventory

### API

Current account-management routes are already guarded with `UserContextGuard`
and `PermissionGuard`.

| Capability | Current API surface | Permission | Current notes |
| --- | --- | --- | --- |
| Account list | `GET /account-management/users` | `system:config` | Supports keyword, status, department, role, page, pageSize. |
| Account detail | `GET /account-management/users/:id` | `system:config` | Returns user, department, active roles, credential summary, last login summary, recent lifecycle delivery. |
| Create account | `POST /account-management/users` | `system:config` | Can create with initial password or no credential; response omits credential secrets. |
| Invite account | `POST /account-management/invites` | `account:invite` | Creates `PENDING_ACTIVATION` user and lifecycle token. |
| Resend invite | `POST /account-management/users/:id/invite/resend` | `account:invite` | Only for `PENDING_ACTIVATION`; queues local/simulated delivery. |
| Accept invite | `POST /auth/invites/accept` | public token flow | Sets password, activates pending user, consumes token. |
| Self password reset request | `POST /auth/password-reset/request` | public accepted response | Does not reveal whether the target exists or is eligible. |
| Reset confirmation | `POST /auth/password-reset/confirm` | public token flow | Sets password and revokes sessions. |
| Admin password reset | `POST /account-management/users/:id/password-reset` | `account:reset_password` | Queues local/simulated reset delivery. |
| Revoke reset links | `POST /account-management/users/:id/password-reset/revoke` | `account:reset_password` | Revokes active reset tokens for the target user. |
| Disable account | `POST /account-management/users/:id/disable` | `system:config` | Sets `User.status=DISABLED`, disables active credential, revokes active sessions, audits count. |
| Enable account | `POST /account-management/users/:id/enable` | `system:config` | Sets `User.status=ACTIVE`; does not automatically restore disabled credential. |
| Assign role | `POST /account-management/users/:id/roles` | `system:config` | Creates or reactivates a role assignment and audits role code/scope. |
| Revoke role | `POST /account-management/users/:id/roles/:userRoleId/revoke` | `system:config` | Soft-revokes `UserRole` and audits role code/scope. |
| Change department | `POST /account-management/users/:id/department` | `system:config` | Changes primary department; does not migrate scoped roles or historical business data. |

### Web

`apps/web/src/AccountManagement.tsx` already provides:

- `system:config` page gate; non-admin users do not request account-management
  APIs.
- User list and detail drawer.
- `ACTIVE`, `PENDING_ACTIVATION`, `DISABLED`, and `ARCHIVED` status display.
- Credential status display.
- Basic login access text derived from user status and credential status.
- Invite create and resend invite affordances gated by `account:invite`.
- Admin password reset and reset revoke affordances gated by
  `account:reset_password`.
- Disable/enable, assign/revoke role, and change department affordances.
- Operation result refresh for the current detail and list.
- Recent lifecycle delivery summary using safe fields such as delivery status,
  adapter, purpose, masked email, token status, and failure category.

Current safe-projection gaps to fix in Step 116/117:

- `lastLogin` currently includes `sessionId` in the API projection even though
  the Web only needs timestamps. Step 116 should remove it from the safe
  account-management response or replace it with a non-identifying
  `hasRecentLogin` summary.
- `recentLifecycleDelivery.targetUserId` is currently returned and the Web
  renders it. The detail route is already scoped to the current user, so Step
  116/117 should remove it from user-facing projection/display.
- The current Web login access text is useful but coarse; Step 116 should make
  it a typed API-derived explanation so list/detail and tests share the same
  semantics.

### Delivery

`AccountLifecycleMailer` defaults to `LOCAL_SAFE_STUB`.

The module can choose Aliyun DirectMail only from explicit runtime environment
configuration. Step 115 does not read environment files or call the provider.
The local/default path remains simulated delivery and not real email/SMS.

### Login Eligibility

Current login/session identity checks require:

- `User.status === ACTIVE`.
- `UserCredential` exists.
- `UserCredential.status === ACTIVE`.
- Session is not expired/revoked for session-based identity.

This means the existing model can already explain "can log in" vs "cannot log
in" without adding schema.

## Recommended MVP

Step 116 should not introduce a new state machine. It should turn the existing
state into a clearer safe projection.

Recommended API-side projection additions:

- `loginEligibility`:
  - `canLogin: boolean`.
  - `reasonCode`: `ACTIVE_CREDENTIAL`, `PENDING_ACTIVATION`, `USER_DISABLED`,
    `USER_ARCHIVED`, `NO_CREDENTIAL`, `CREDENTIAL_DISABLED`, or
    `SESSION_REFRESH_REQUIRED`.
  - `label`: admin-facing short text.
  - `blockingFactors`: safe enum values only.
- `lifecycleActionSummary`:
  - counts and latest timestamps for safe lifecycle operations derived from
    audit logs and lifecycle token metadata.
  - include operation codes such as `USER_DISABLE`, `USER_ENABLE`,
    `USER_ROLE_ASSIGN`, `USER_ROLE_REVOKE`, `INVITE_CREATED`, `INVITE_RESENT`,
    `PASSWORD_RESET_REQUESTED_ADMIN`, and `PASSWORD_RESET_REVOKED`.
  - do not include raw audit JSON, token IDs, token hashes, session IDs, links,
    email addresses beyond existing masked email, or provider diagnostics that
    failed normalization.
- `roleChangeAuditSummary`:
  - latest role assign/revoke operations by role code, scope type, departmentId,
    timestamp, and reason-present boolean.
  - do not return operator email, raw actor profile, raw audit payload, or
    unbounded history.
- `recentLifecycleDelivery` hardening:
  - keep delivery status, adapter, purpose, token status, failure category,
    masked email, expiresAt/usedAt/revokedAt/createdAt/updatedAt.
  - remove internal `targetUserId` from the public account-management response
    if no caller needs it; otherwise avoid Web display of it as a user-facing
    lifecycle detail because the detail route is already scoped to the current
    user.
- `lastLogin` hardening:
  - keep timestamp fields needed for "last seen" display.
  - remove `sessionId` from the account-management API response and Web types,
    because lifecycle review does not require a session identifier.

Recommended Web-side changes:

- Add a compact "Login eligibility" block in account list and detail.
- Show exact disabled-state reasons for action buttons:
  - resend invite hidden/disabled unless `PENDING_ACTIVATION` and
    `account:invite`.
  - issue reset hidden/disabled unless `ACTIVE`, active credential, and
    `account:reset_password`.
  - restore/enable warning remains explicit: enabling user status does not
    restore disabled credentials.
  - role and department actions stay `system:config`.
- Add "Lifecycle history summary" and "Role change summary" sections in the
  detail drawer.
- Replace "target {targetUserId}" delivery copy with safer wording such as
  "target: current user" or omit the target line.
- Keep all operations in the existing AccountManagement route; do not add a new
  navigation entry.

## Data Model Decision

First implementation recommendation: **no schema/migration**.

Existing models are enough for the Step 116/117 MVP:

| Model | Reuse |
| --- | --- |
| `User` / `UserStatus` | `ACTIVE`, `PENDING_ACTIVATION`, `DISABLED`, and `ARCHIVED` already express active, pending, disabled, and archived account states. |
| `UserCredential` / `CredentialStatus` | `ACTIVE` and `DISABLED` already express local credential eligibility. |
| `UserSession` | Existing `revokedAt` and `revokedReason` support safe session revocation counts and login refresh explanations. |
| `UserRole` | Active vs revoked role assignments already support role change operations. |
| `AuditLog` | Existing safe `newValue.operation` records account status, role, and department changes. |
| `AccountLifecycleToken` | Existing purpose/status/delivery fields support recent delivery and token lifecycle summary without exposing token hash. |
| `Notification` | Not required for the first account lifecycle enhancement; local/simulated lifecycle delivery is already represented by token delivery status. |

Schema is only needed if product requirements demand a distinct persistent lock
state separate from disabled user status and disabled credential status.

If a later step needs true lock/unlock, use an additive migration only after a
new plan, for example:

- Add `LOCKED` to `UserStatus`; or
- Add `lockReason`, `lockedAt`, and `lockedByUserId` fields; or
- Add a dedicated account lifecycle event/history table.

Do not run production migration in any local/demo implementation step.

## API Draft

### Preferred Step 116 Surface

No new top-level route is required for the first version.

Update `GET /account-management/users` and
`GET /account-management/users/:id` projections to include safe derived fields:

```ts
type AccountLoginEligibility = {
  canLogin: boolean;
  reasonCode:
    | "ACTIVE_CREDENTIAL"
    | "PENDING_ACTIVATION"
    | "USER_DISABLED"
    | "USER_ARCHIVED"
    | "NO_CREDENTIAL"
    | "CREDENTIAL_DISABLED"
    | "SESSION_REFRESH_REQUIRED";
  label: string;
  blockingFactors: string[];
};

type AccountLifecycleActionSummary = {
  latestActionAt: string | null;
  disabledCount: number;
  restoredCount: number;
  inviteIssuedCount: number;
  resetIssuedCount: number;
  resetRevokedCount: number;
  latestDeliveryStatus: string | null;
  latestDeliveryAdapter: string | null;
};

type AccountRoleChangeAuditSummary = {
  latestRoleChangeAt: string | null;
  assignedCount: number;
  revokedCount: number;
  recentRoleChanges: Array<{
    operation: "USER_ROLE_ASSIGN" | "USER_ROLE_REVOKE";
    roleCode: string;
    scopeType: "GLOBAL" | "DEPARTMENT";
    departmentId: string | null;
    reasonProvided: boolean;
    createdAt: string;
  }>;
};
```

### Optional Endpoint Alternative

If list projection cost becomes too high, keep the list light and add a
detail-only scoped endpoint:

- `GET /account-management/users/:id/lifecycle-summary`.

This route must still use `UserContextGuard`, `PermissionGuard`, and
`system:config`; it must not be a global lifecycle browser.

### Permission Recommendation

Use existing permissions for Step 116:

| Operation | Recommended permission | Reason |
| --- | --- | --- |
| list/detail lifecycle projections | `system:config` | Same account-management visibility boundary. |
| disable/restore | `system:config` | Already implemented and broad admin-only. |
| role assign/revoke | `system:config` | Already implemented; role changes affect authorization. |
| department change | `system:config` | Already implemented and affects access scope. |
| invite create/resend | `account:invite` | Already dedicated; keep least privilege. |
| admin reset/revoke | `account:reset_password` | Already dedicated; keep least privilege. |

Do not add `account:disable`, `account:restore`, `account:lock`,
`account:unlock`, or `account:role_update` in Step 116 unless a separate
permission-seed/migration plan is approved. Dedicated permissions can be useful
later, but adding them now increases schema/seed and acceptance scope.

## Web UX Draft

### List

Add or refine columns:

- Status.
- Login eligibility.
- Credential state.
- Last lifecycle action summary.
- Actions.

The list should not show user IDs, session IDs, token IDs, token hashes, raw
audit JSON, or provider raw diagnostics.

### Detail Drawer

Add sections:

- Account state:
  - status;
  - credential status;
  - login eligibility reason;
  - last login timestamp only, no session id.
- Lifecycle actions:
  - resend invite;
  - issue reset;
  - revoke reset links;
  - disable;
  - restore/enable;
  - disabled buttons should explain the reason when useful.
- Lifecycle history summary:
  - latest action time;
  - counts by safe operation category;
  - latest local/simulated delivery status and adapter.
- Role change summary:
  - assign/revoke counts;
  - latest safe role changes by role code and scope.

Non-admin or missing-permission behavior:

- Without `system:config`, render the existing permission denied state and make
  no account-management requests.
- Without `account:invite`, do not show invite creation/resend execution entry.
- Without `account:reset_password`, do not show reset/revoke execution entry.
- Frontend gates are affordance boundaries only; backend guards remain
  authoritative.

## Audit And Safe Summary Matrix

| Action | Existing or planned audit fields | Must not record or return |
| --- | --- | --- |
| Disable user | `operation=USER_DISABLE`, target user id, old/new status, reason, revoked session count | session ID, session hash, cookie, raw IP, password, token |
| Restore user | `operation=USER_ENABLE`, target user id, old/new status, reason, credential restore policy | password hash, credential secret, implicit password restore |
| Assign role | `operation=USER_ROLE_ASSIGN`, role code, scope type, departmentId, reason, assignment mode | full role permission graph, operator email, raw audit JSON |
| Revoke role | `operation=USER_ROLE_REVOKE`, role code, scope type, departmentId, reason | raw previous payload, sensitive actor details |
| Invite create/resend | result code, token id internally, masked email, role codes, reason-present boolean, delivery status/adapter | raw token, token hash, full invite link, recipient raw email in Web evidence |
| Admin reset/revoke | result code, target user id, revoked token count, reason-present boolean, delivery status/adapter | raw token, token hash, full reset link, password, password hash |
| Login eligibility projection | reason code and safe blocking factors | raw credential, password hash, session ID, cookie, connection string |

Step 116 should add tests that serialize API responses and Web rendered output
and assert forbidden strings are absent:

- password, passwordHash, token, tokenHash, session, sessionHash, cookie;
- raw invite/reset link, full URL with token;
- `DATABASE_URL`, connection string, secret;
- raw audit JSON, debug panel, export/download.

## Test Plan

Step 116 API tests:

- Existing list/detail still require `system:config`.
- New login eligibility projection for:
  - active user with active credential;
  - pending activation;
  - disabled user;
  - active user without credential;
  - active user with disabled credential.
- Disable still disables credential, revokes sessions, records safe audit, and
  returns only count.
- Enable still restores user status only and does not restore credential.
- Role assign/revoke summaries include role code and scope only.
- Serialized responses do not include password/hash/token/session/cookie/link
  material.

Step 117 Web tests:

- Non-`system:config` user sees no execution entry and does not call account
  management APIs.
- List/detail render login eligibility explanations.
- Missing `account:invite` hides invite/resend execution entries.
- Missing `account:reset_password` hides reset/revoke execution entries.
- Operation success refreshes detail and list.
- Lifecycle delivery summary does not render target user id, token id, token
  hash, raw token, full link, password/hash, session id, cookie, or debug panel.

Step 118 local UI acceptance:

- localhost/local-demo/synthetic only.
- Reuse existing local stack if available; do not create a new Docker stack.
- Verify account list/detail state explanations, disable/restore, invite
  summary, reset summary, role change summary, missing-permission boundaries,
  and forbidden-sensitive-text scan.
- Archive as local/demo acceptance, not production identity acceptance.

## Step Split

### Step 116 - API projection hardening

Recommended scope:

- No schema/migration.
- Add safe derived `loginEligibility`, `lifecycleActionSummary`, and
  `roleChangeAuditSummary` to account detail; optionally add a light
  `loginEligibility` to list.
- Remove or deprecate `lastLogin.sessionId` from account-management response
  and Web types.
- Remove or stop rendering `recentLifecycleDelivery.targetUserId`.
- Reuse `User`, `UserCredential`, `UserSession`, `UserRole`, `AuditLog`, and
  `AccountLifecycleToken`.
- Keep existing guards and permissions.
- Add API tests and response safety assertions.

If implementation discovers audit summaries cannot be derived reliably from
existing `AuditLog.newValue.operation`, stop and document the gap instead of
adding schema without a new plan.

### Step 117 - Web management enhancement

Recommended scope:

- Show login eligibility in AccountManagement list/detail.
- Add lifecycle and role-change safe summary sections.
- Hide or disable operations with explicit reasons.
- Remove user-facing display of internal target id/session id style details
  from lifecycle summary.
- Add UI tests for permission and sensitive-field boundaries.

### Step 118 - Local UI acceptance and closure

Recommended scope:

- Run localhost/local-demo/synthetic acceptance only if a local stack is
  available under the user's Docker/service constraints.
- Do not create/clean Docker containers.
- Archive evidence and closure docs.

## Caveats

- The first MVP provides login eligibility explanation, not a distinct lock/
  unlock product state.
- `DISABLED` account status and disabled credential status already block login,
  but they do not encode who locked an account or an unlock deadline.
- A future production-grade lock/unlock workflow needs a separate additive
  schema and production migration plan.
- Local/simulated lifecycle delivery remains review evidence only; it is not
  real email/SMS delivery acceptance.
