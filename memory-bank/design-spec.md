# Design Spec - 一期基础刚需版

## Step 47P - Runtime Wiring With Safe Default - 2026-06-28

### Runtime Selection

- `AccountLifecycleModule` owns account lifecycle delivery adapter selection.
- Default behavior without configuration is `LOCAL_SAFE_STUB`.
- Unknown `ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER` values fall back to `LOCAL_SAFE_STUB`.
- Explicit `ACCOUNT_LIFECYCLE_DELIVERY_PROVIDER=aliyun_directmail` selects the Aliyun DirectMail adapter path.
- Aliyun DirectMail remains no-send by default because `ALIYUN_DM_DRY_RUN !== "false"` means dry-run.
- Explicit live Aliyun mode with missing required secret env values returns safe `SUPPRESSED` / `CONFIGURATION` and does not construct the live adapter.

### Safe Projection

- `AccountLifecycleMailer` returns only:
  - delivery status.
  - adapter name.
  - template.
- The mail result must not include raw token, full reset/invite link, plaintext recipient email, provider credentials, or provider raw full payload.
- Tests cover default stub, unknown provider fallback, Aliyun dry-run, missing live config suppression, fake live factory routing, and safe projection.

### Production Boundary

- Step 47P does not enable production real delivery.
- Default runtime remains `LOCAL_SAFE_STUB`.
- Password reset is the recommended first production enablement target.
- Invite real delivery remains deferred until password reset production wiring, deploy, smoke, rollback, and support process are accepted.
- Production deploy/smoke remains a later explicit authorization boundary.

## Step 46G - Password Reset / Invite Local Browser Acceptance - 2026-06-27

### Browser Acceptance Scope

- Step identity: Step 46G, local browser acceptance only.
- This Step validates the Step 46E Web UI against the Step 46D API contract using local Web preview and browser-layer API interception.
- This Step does not run migrations, run seeds, send real email/SMS, expose real token/password/full links, access production/VPS/production DB, deploy, push, cleanup, deletion, run production acceptance, or close Phase 2.

### Browser-Accepted Behavior

- Public forgot-password:
  - Entry is available from the production sign-in panel.
  - Successful request uses enumeration-safe accepted copy and does not reveal whether the target email exists.
- Public reset-password and invite-accept:
  - URL token values are not copied into token input field values.
  - URL token values remain an in-memory submit fallback.
  - Manual token entry remains available when no URL token is present.
  - Successful submit clears token/password fields before showing return-to-sign-in guidance.
  - Invalid, used, revoked, expired, or otherwise ineligible token failures share a safe public error category.
  - Success does not auto-login.
- Account management:
  - Users with `account:invite` see invite create and resend invite affordances.
  - Users with `account:reset_password` see issue reset and revoke reset affordances.
  - Users without these dedicated lifecycle permissions do not see the corresponding action buttons.
  - Invite create payload does not include a temporary password field.
  - Reset/invite operation feedback shows delivery/revocation status only, never raw token or full links.

### Browser Evidence

- Screenshots and browser acceptance script are under `.local-step46g/`.
- Acceptance used browser-layer `/api/*` interception with synthetic data only.
- Browser checks covered page text, static HTML, console messages, and intercepted API responses for sensitive marker leakage.

## Step 46E - Password Reset / Invite Web UI Local Implementation - 2026-06-27

### Scope

- Step identity: Step 46E, Web UI local implementation only.
- This Step implements frontend API client methods and local UI affordances for the Step 46D backend contract.
- This Step does not run migrations, run seeds, send real email/SMS, expose real token/password/full links, access production/VPS/production DB, deploy, push, cleanup, deletion, run browser acceptance, or close Phase 2.

### Public UI Surface

- Production unauthenticated auth screen can show:
  - Forgot-password request panel.
  - Reset-password confirmation panel.
  - Invite-accept panel.
- URL intent parsing recognizes:
  - `flow=forgot-password`.
  - `flow=reset-password`.
  - `flow=invite-accept`.
- Public reset request copy remains enumeration-safe.
- Reset/invite success instructs the user to return to sign in; the UI does not auto-login.
- Invalid, used, revoked, or expired token failures share one safe user-facing error category.
- Token values from URL intent are not emitted into static HTML output and are not printed in UI copy.

### Account Management UI Surface

- Admin account-management adds:
  - Invite user action.
  - Per-user resend invite action for pending activation users.
  - Per-user admin password reset issue action for active users.
  - Per-user password reset revoke action for active users.
- Frontend visibility gates use:
  - `account:invite`.
  - `account:reset_password`.
- Backend remains the final authorization and validation boundary.
- Invite create form collects email, name, department, roles, and optional reason. It does not collect or display a temporary password.
- Existing direct create-user remains available as a transitional path and remains separate from invite-first onboarding.

### Client Contract

- Public auth client methods:
  - `requestPasswordReset`.
  - `confirmPasswordReset`.
  - `acceptInvite`.
- Account-management client methods:
  - `createInvite`.
  - `resendInvite`.
  - `requestAdminPasswordReset`.
  - `revokePasswordResetTokens`.
- API client tests assert no token/full-link material is expected in response shapes.

## Step 46D - Password Reset / Invite Backend Local Implementation - 2026-06-27

### Scope

- Step identity: Step 46D, backend local implementation only.
- This Step implements local API/service behavior for the Step 46B/46C password reset and invite contract.
- This Step does not implement Web UI, run migrations, run seeds, send real email/SMS, expose real token/password/full links, access production/VPS/production DB, deploy, push, cleanup, deletion, or close Phase 2.

### Backend API Surface

- Public auth endpoints:
  - `POST /auth/password-reset/request`.
  - `POST /auth/password-reset/confirm`.
  - `POST /auth/invites/accept`.
- Admin account-management endpoints:
  - `POST /account-management/invites`.
  - `POST /account-management/users/:id/invite/resend`.
  - `POST /account-management/users/:id/password-reset`.
  - `POST /account-management/users/:id/password-reset/revoke`.

### Behavior Implemented

- `AccountLifecycleService` owns token issuance, token consume, invite acceptance, password reset confirmation, admin reset issuance, reset revocation, permission checks, and audit records.
- `AccountLifecycleRepository` owns local Prisma access to users, credentials, sessions, roles, departments, and lifecycle tokens.
- Tokens are created as opaque transient values, stored only as hashes, and marked `USED` or `REVOKED` through lifecycle operations.
- Public password reset request is enumeration-safe:
  - Unknown or ineligible users still receive the same accepted response.
  - Audit records only safe metadata such as failure category and email hash.
- Invite acceptance:
  - Requires an active, unexpired, unused invite token.
  - Revalidates pending user, active department, and active roles.
  - Creates/updates credential with the user's chosen password.
  - Activates the user and marks the token used.
- Password reset confirmation:
  - Accepts self-service and admin-issued reset token purposes.
  - Requires active eligible user and active credential.
  - Replaces credential password hash, clears forced-change for that reset, revokes active sessions, and marks the token used.
- Admin invite/reset operations:
  - Require `account:invite` or `account:reset_password` through `RbacPolicyService`.
  - Replace active same-purpose tokens when issuing a new token.
  - Return only target user id and delivery status; never raw token or full link.
- Delivery:
  - Uses `AccountLifecycleMailer` as a local `LOCAL_SAFE_STUB` boundary.
  - No real email/SMS adapter is connected in this Step.
- Transitional direct account creation:
  - Existing `initialPassword` remains available.
  - Credentials created through that path now persist `mustChangePassword: true`.

### Contract Notes

- Runtime database compatibility requires the Step 46C migration to be applied later in an explicitly authorized environment.
- Permission seed/backfill for `account:invite` and `account:reset_password` remains separate work.
- Web UX for forgot password, reset confirm, invite accept, and admin lifecycle controls remains a later Step.
- The backend module is intentionally local-safe: no real delivery, no full links, no raw-token response contract.

## Step 46C - Password Reset / Invite Schema Delta Patch - 2026-06-27

### Scope

- Step identity: Step 46C, schema delta patch only.
- This Step implements the Step 46B schema contract in Prisma schema, migration SQL, and schema-adjacent constants/mappers.
- This Step does not implement backend runtime API, Web UI, seed, migration execution, email/SMS sending, real account creation, real token/password/full link generation, production access, VPS access, production DB access, deploy, push, cleanup, deletion, or stale-workspace work.

### Applied Schema Delta

- `UserStatus` now includes `PENDING_ACTIVATION`.
- New lifecycle enums:
  - `AccountLifecycleTokenPurpose`: `INVITE_ACCEPT`, `PASSWORD_RESET_SELF`, `PASSWORD_RESET_ADMIN`.
  - `AccountLifecycleTokenStatus`: `ACTIVE`, `USED`, `REVOKED`.
  - `AccountLifecycleDeliveryChannel`: `EMAIL`.
  - `AccountLifecycleDeliveryStatus`: `PENDING`, `QUEUED`, `SENT`, `FAILED`, `SUPPRESSED`.
- `UserCredential` now has:
  - `mustChangePassword Boolean @default(false) @map("must_change_password")`.
- New `AccountLifecycleToken` model maps to `account_lifecycle_tokens`.
- `User` now has target/creator lifecycle-token relation arrays.
- `AuditActionType` now includes invite/reset lifecycle actions:
  - `INVITE_CREATED`, `INVITE_RESENT`, `INVITE_ACCEPTED`, `INVITE_REVOKED`.
  - `PASSWORD_RESET_REQUESTED_SELF`, `PASSWORD_RESET_REQUESTED_ADMIN`, `PASSWORD_RESET_CONFIRMED`, `PASSWORD_RESET_REVOKED`, `PASSWORD_RESET_FAILED`.
  - `CREDENTIAL_CHANGED`.

### Applied Token Table Contract

- `tokenHash` is unique and never stores raw token values.
- `targetUserId` and `createdByUserId` are nullable foreign keys to `User` with `onDelete: SetNull`.
- `emailHash` is nullable so admin flows can target a user without persisting a separate email correlation when not needed.
- Delivery channel/status are nullable because token creation and delivery are separate lifecycle moments in later backend work.
- `revokedReason` uses `VarChar(500)` to support categorized operational reasons without storing secrets.
- Indexes:
  - unique `token_hash`.
  - `[targetUserId, purpose, status]`.
  - `[emailHash, purpose, status]`.
  - `[status, expiresAt]`.
  - `[createdByUserId]`.

### Schema-Adjacent Contracts Applied

- Permission constants now include:
  - `account:invite`.
  - `account:reset_password`.
- Audit domain constants and Prisma mapper now include persisted invite/reset lifecycle actions.
- Audit target constants now include `ACCOUNT_LIFECYCLE_TOKEN`.
- No seed or role-permission assignment was added in this Step; system-admin permission assignment remains future seed/backfill work.

### Migration Boundary

- Added migration file:
  - `prisma/migrations/20260627103000_add_account_lifecycle_tokens/migration.sql`.
- Migration was generated/written for review only.
- Migration was not executed.
- Production rollout still requires a separate authorized migration execution Step with backup/rollback review.

## Step 46B - Password Reset / Invite Schema and API Contract Review - 2026-06-27

### Review Scope

- Step identity: Step 46B, schema and API contract review only.
- This Step converts Step 46A design into an implementation-ready contract.
- This Step does not implement backend runtime behavior, Web UI, Prisma schema changes, migration generation/execution, seed, deploy, push, production access, VPS access, production DB access, real email/SMS, real token/password/link generation, cleanup, deletion, or stale-workspace work.

### Schema Options Reviewed

- Option A: one `account_lifecycle_tokens` table plus minimal user/credential state fields.
  - Pros: shared token lifecycle for invite and reset; one replay-prevention path; one cleanup query path; consistent audit correlation; avoids duplicated reset/invite tables.
  - Cons: requires clear purpose/status enums and service-level validation so invite-only fields are not misused by reset flows.
  - Production assessment: recommended.
- Option B: split invite tokens and password reset tokens into separate tables.
  - Pros: per-flow schemas are simple.
  - Cons: duplicate token hash, expiry, revocation, delivery, replay, cleanup, audit, and rate-limit logic; harder to enforce one security model.
  - Production assessment: not recommended unless flows diverge substantially later.
- Option C: adapter-only first, no token schema yet.
  - Pros: smallest database change.
  - Cons: cannot safely support one-time token use, replay prevention, audit correlation, resend/revoke, cleanup, or production-grade reset.
  - Production assessment: rejected for real invite/reset. It can only be used for UI-only prototypes, which is not this feature's target.

### Recommended Schema Contract

- Add new enums:
  - `AccountLifecycleTokenPurpose`: `INVITE_ACCEPT`, `PASSWORD_RESET_SELF`, `PASSWORD_RESET_ADMIN`.
  - `AccountLifecycleTokenStatus`: `ACTIVE`, `USED`, `REVOKED`.
  - `AccountLifecycleDeliveryChannel`: `EMAIL`.
  - `AccountLifecycleDeliveryStatus`: `PENDING`, `QUEUED`, `SENT`, `FAILED`, `SUPPRESSED`.
- Add new model `AccountLifecycleToken` mapped to `account_lifecycle_tokens`:
  - `id String @id @default(uuid()) @db.Uuid`.
  - `purpose AccountLifecycleTokenPurpose`.
  - `tokenHash String @unique @map("token_hash") @db.VarChar(128)`.
  - `targetUserId String? @map("target_user_id") @db.Uuid`.
  - `emailHash String @map("email_hash") @db.VarChar(128)`.
  - `status AccountLifecycleTokenStatus @default(ACTIVE)`.
  - `expiresAt DateTime @map("expires_at")`.
  - `usedAt DateTime? @map("used_at")`.
  - `revokedAt DateTime? @map("revoked_at")`.
  - `revokedReason String? @map("revoked_reason") @db.VarChar(120)`.
  - `createdByUserId String? @map("created_by_user_id") @db.Uuid`.
  - `createdByIpHash String? @map("created_by_ip_hash") @db.VarChar(128)`.
  - `createdUserAgentHash String? @map("created_user_agent_hash") @db.VarChar(128)`.
  - `deliveryChannel AccountLifecycleDeliveryChannel @default(EMAIL) @map("delivery_channel")`.
  - `deliveryStatus AccountLifecycleDeliveryStatus @default(PENDING) @map("delivery_status")`.
  - `deliveryAdapter String? @map("delivery_adapter") @db.VarChar(80)`.
  - `auditCorrelationId String? @map("audit_correlation_id") @db.VarChar(120)`.
  - `createdAt DateTime @default(now()) @map("created_at")`.
  - `updatedAt DateTime @updatedAt @map("updated_at")`.
  - relation `targetUser` to `User` with `onDelete: SetNull`.
  - relation `createdByUser` to `User` with `onDelete: SetNull`.
- Add relation fields to `User`:
  - `accountLifecycleTokens AccountLifecycleToken[]` as target relation.
  - `createdAccountLifecycleTokens AccountLifecycleToken[]` as creator relation.
- Add `PENDING_ACTIVATION` to `UserStatus`.
  - Rationale: invite pending is a primary account lifecycle state, not just credential metadata.
  - Safer than a separate independent user activation field because it avoids contradictory states such as `User.status=ACTIVE` with `activationStatus=PENDING`.
  - Existing login already requires `User.status === ACTIVE`, so pending invite users remain unable to log in.
- Add credential forced-change field:
  - `mustChangePassword Boolean @default(false) @map("must_change_password")` on `UserCredential`.
  - Optional later field: `passwordChangeRequiredAt DateTime?`; not required for first schema patch unless backend needs timestamped forced-change policy.
- Keep `CreateAccountUserDto.initialPassword` during transitional compatibility, but constrain future behavior:
  - If `initialPassword` is used, create credential with `mustChangePassword=true`.
  - Preferred invite flow creates `PENDING_ACTIVATION` user with no active credential until invite acceptance.

### Recommended Indexes and Constraints

- `tokenHash` must be unique for direct token lookup by hash.
- Add index `[targetUserId, purpose, status, expiresAt]` for replacement/revoke and active-token lookup.
- Add index `[emailHash, purpose, createdAt]` for user-enumeration-safe rate limiting and repeated public reset requests.
- Add index `[status, expiresAt]` for cleanup of expired active tokens.
- Add index `[createdByUserId, createdAt]` for admin/audit review.
- Do not add a broad unique constraint like `[targetUserId, purpose, status]`; multiple historical used/revoked rows must remain possible. Active-token uniqueness should be enforced by transactional replacement and, if PostgreSQL partial indexes are desired later, by a manually reviewed partial unique index outside Prisma's basic unique syntax.

### API Contract Review

- Public:
  - `POST /auth/password-reset/request`
    - Body: `{ email: string }`.
    - Response: `202 Accepted` with generic message.
    - Never reveals whether the user exists, is disabled, archived, or has no credential.
  - `POST /auth/password-reset/confirm`
    - Body: `{ token: string, newPassword: string }`.
    - Response: generic success or invalid/expired.
    - Does not auto-login in first implementation.
  - `POST /auth/invites/accept`
    - Body: `{ token: string, password: string }`.
    - Response: acceptance success and instruction to log in.
- Admin:
  - `POST /account-management/invites`.
  - `POST /account-management/users/:id/invite/resend`.
  - `POST /account-management/users/:id/password-reset`.
  - `POST /account-management/users/:id/password-reset/revoke`.
- DTO validation:
  - Email normalized and validated.
  - Token accepted only as opaque string with max length and no logging.
  - Password policy should reuse existing length/hash path initially and later centralize complexity policy if needed.
  - Reason fields should follow current `AccountManagementReasonDto` style.

### Permission and Audit Contract

- Add permissions:
  - `account:invite`.
  - `account:reset_password`.
- Transitional seed policy:
  - Assign both to system admin role first.
  - Do not grant department-scoped invite/reset until a later department-admin boundary decision.
- Add domain audit actions:
  - `INVITE_CREATED`, `INVITE_RESENT`, `INVITE_ACCEPTED`, `INVITE_REVOKED`.
  - `PASSWORD_RESET_REQUESTED_SELF`, `PASSWORD_RESET_REQUESTED_ADMIN`, `PASSWORD_RESET_CONFIRMED`, `PASSWORD_RESET_REVOKED`, `PASSWORD_RESET_FAILED`.
  - `CREDENTIAL_CHANGED`.
- Persisted Prisma `AuditActionType` should be expanded in the schema patch so lifecycle events are queryable without overloading `UPDATE`.
- Existing D116 fee mapping to `UPDATE` should remain as-is unless a separate audit enum cleanup Step expands fee actions.
- Target types can continue using existing string-based `AuditTargetTypeCode.auth`, `user`, and `userSession`. A new `ACCOUNT_LIFECYCLE_TOKEN` target type is optional because `AuditLog.targetType` is string, but adding a domain constant improves consistency.
- Audit payload must include purpose, result, token record id, target user id when known, delivery status, failure category, reason, and session revoke count.
- Audit payload must not include raw token, password, password hash, full link, cookie, provider credential, or sensitive config.

### Mail Adapter and Outbox Contract

- Recommended first implementation: adapter interface plus safe local stub; do not add a separate outbox table in the first schema patch.
- Rationale:
  - `account_lifecycle_tokens.deliveryStatus` records lifecycle delivery state enough for local/backend implementation.
  - Existing `Notification` is user-bound and not suitable for unauthenticated email reset delivery.
  - Existing `ApiIntegration` can represent enabled external providers later, but should not store secrets.
- Interface shape:
  - `enqueueInviteAcceptedLink(input)` and `enqueuePasswordResetLink(input)` or equivalent.
  - Inputs use token plain value only transiently in process memory.
  - Adapter returns delivery status and adapter code, not raw links.
- Future production email provider integration should be a separate authorized Step with provider config and no secret output.

### Transaction and Security Contract

- Token issuance transaction:
  - Validate actor permission and target eligibility.
  - Revoke previous active token rows for same target/purpose.
  - Create new lifecycle token row with hashed token.
  - Record audit event.
  - Hand off transient token to mail adapter after DB state is durable, or use a retryable adapter boundary with safe failure status.
- Token consumption transaction:
  - Hash submitted token.
  - Find token by hash and purpose.
  - Require `status=ACTIVE`, `usedAt=null`, `revokedAt=null`, `expiresAt > now`.
  - Revalidate user status, department status, role status, and credential rules.
  - Create/update credential with hashed new password and `mustChangePassword=false`.
  - For reset, revoke active sessions with reason `PASSWORD_RESET`.
  - Mark token `USED` with `usedAt`.
  - Record audit event.
- Replay prevention:
  - A used/revoked/expired token never mutates credentials again.
  - Race conditions are handled by a transaction and an update condition on active token state.
- Disabled/archived users:
  - Public reset request remains generic.
  - Archived users never receive usable tokens.
  - Disabled users do not regain login by reset unless a later policy explicitly pairs reset with enable.
- Role/department changes after invite issuance:
  - Accept path must revalidate current active department and role assignments. If invalid, fail safely and require reissue.

### Step 46B Decision

- Schema delta is required.
- A migration file is required in a later schema patch Step.
- Step 46B does not modify `prisma/schema.prisma` and does not generate migration files.
- Recommended next Step is Step 46C as schema delta patch only: Prisma schema + generated migration file + schema validation/generation if available, but still no migration execution.

## Step 46A - Password Reset / Invite Scope Confirmation and Design - 2026-06-27

### Scope

- Step identity: Step 46A, local scope confirmation and design only.
- Feature area: account lifecycle capability for `password reset` and `invite`.
- Task level: L because the design touches accounts, authentication, tokens, permissions, audit, and future database migration.
- Non-goals:
  - No API implementation.
  - No Web UI implementation.
  - No Prisma schema or migration change.
  - No migration, seed, deploy, push, production access, VPS access, production DB access, cleanup, deletion, real email/SMS sending, real account creation, or real token/password generation.
  - No sensitive configuration, `.env`, connection string, cookie, credential, certificate, private key, token value, local test password, or full reset/invite link read or recorded.

### Existing Capability Summary

- Current auth module supports bootstrap, login, logout, and me.
- Current session tokens are opaque and stored by hash in `UserSession.sessionHash`.
- Current passwords use scrypt hashes in `UserCredential.passwordHash`.
- Current account-management module supports admin list/detail/create/disable/enable/role assignment/role revoke/department change.
- `CreateAccountUserDto.initialPassword` currently lets an administrator directly set an initial password.
- Creating a user without `initialPassword` creates a user with no credential.
- Disabling a user disables active credentials and revokes active sessions.
- Enabling a user does not restore disabled credentials.
- Account management currently uses `system:config`; there are no dedicated invite/reset permissions.
- Audit exists, but there are no dedicated invite/password-reset audit action codes.
- There is no invite token model, password reset token model, email outbox/adapter contract, first-login forced password change flag, or replay-prevention table for account lifecycle tokens.

### Business Distinction

- Invite:
  - Purpose: create or activate a new account through admin-authorized onboarding.
  - Target: a user record that is not yet fully activated for password login, or a user with no active credential.
  - Primary actor: an authorized administrator.
  - Result: invited user accepts the invite, sets their own password, and activates usable credentials.
  - Business semantics: invitation proves that the organization wants this person to join the system.
- Password reset:
  - Purpose: recover access for an existing account or force credential replacement after an admin/security event.
  - Target: an existing account.
  - Primary actors: the user through a public forgot-password request, or an authorized administrator for managed reset.
  - Result: existing user sets a new password and prior active sessions are revoked.
  - Business semantics: reset replaces credentials for an existing identity; it must not imply new account creation.

### Permission Rules

- Who can invite:
  - Recommended: only users with a new dedicated permission such as `account:invite`.
  - Transitional compatibility may map this permission to system administrators, but the API contract should not remain coupled to broad `system:config`.
  - Department-scoped invite should stay disabled unless a later decision allows department admins to invite only into their active department and assign only approved roles.
- Who can trigger password reset:
  - Public unauthenticated request may request a reset by email, but the response must be identical whether the email exists or not.
  - Authenticated users may request reset for self only.
  - Authorized administrators may trigger reset for an existing mutable user with a dedicated permission such as `account:reset_password`.
  - Administrators must not reset archived users. Recommended default: disabled users require a separate enable action before login.
- Permission boundary:
  - Backend is the security boundary; frontend visibility is only ergonomics.
  - Role, department, user status, and credential eligibility must be rechecked when a token is consumed.
  - Department-scoped admins, if later allowed, may not invite/reset outside their effective department scope.

### User State Machines

- Invited user recommended states:
  - `No user` -> `INVITED/PENDING_ACTIVATION user shell` -> `ACTIVE user with ACTIVE credential`.
  - `ACTIVE` -> `DISABLED` when disabled.
  - `ACTIVE/DISABLED` -> `ARCHIVED` when retired.
- Current `UserStatus` only has `ACTIVE`, `DISABLED`, and `ARCHIVED`; future implementation should add an explicit invite/pending activation state or a separate activation state. Recommended: add explicit lifecycle state so unaccepted invitees are not treated as active users.
- Invited users must not be able to log in before password setup creates an active credential.
- Invite acceptance must validate token purpose, unused state, expiry, revocation, target user mutability, active department, active roles, and password policy before activating credentials.
- Existing user password reset states:
  - `ACTIVE user + ACTIVE credential` -> `reset token issued` -> `password changed, token used, sessions revoked`.
  - `ACTIVE user + disabled credential` -> admin reset may create replacement credential only if policy explicitly allows.
  - `DISABLED user` -> public request response is generic; no usable token by default.
  - `ARCHIVED user` -> public request response is generic; never issue usable token.
- Password reset must not change account roles, department, or identity.

### Token Lifecycle

- Token purposes:
  - `INVITE_ACCEPT`.
  - `PASSWORD_RESET_SELF`.
  - `PASSWORD_RESET_ADMIN`.
- Token creation:
  - Generate a high-entropy opaque value only at the service boundary.
  - Plain value exists only transiently for delivery adapter handoff.
  - Persist only a keyed hash, never the plain value and never the full link.
- Token fields:
  - purpose, target user, creator, expiresAt, usedAt, revokedAt, revokedReason, delivery status, and audit correlation.
- Expiry:
  - Invite: recommended 7 days.
  - User-initiated password reset: recommended 30-60 minutes.
  - Admin-triggered reset: recommended 24 hours or shorter if policy requires.
- One-time use:
  - Required.
  - Consumption must be transactional: validate active token, update credential, mark token used, revoke sessions, record audit.
  - Reissuing for the same target/purpose should revoke previous active tokens.
  - Replay of used/revoked/expired tokens returns a safe invalid/expired response and records categorized audit.
- Storage:
  - Use HMAC/hash storage with an application secret separate from sessions when possible.
  - Add indexes for token hash lookup, target/purpose/expiry lookup, and cleanup.
  - Never store raw token, full link, password, provider credential, or sensitive config.

### API Contract Draft

- `POST /auth/password-reset/request`
  - Body: email.
  - Response: always accepted with generic copy.
  - Behavior: if eligible user exists, create/replace token and enqueue delivery; otherwise record safe generic/rate-limit signal without revealing existence.
- `POST /auth/password-reset/confirm`
  - Body: token and new password.
  - Behavior: validate token, set password, mark token used, revoke sessions, audit.
- `POST /auth/invites/accept`
  - Body: token and password.
  - Behavior: validate invite token, activate credential, mark token used, audit.
  - Recommended first implementation: no auto-login; require explicit login after acceptance.
- `POST /account-management/invites`
  - Permission: `account:invite` or transitional system-admin mapping.
  - Body: email, name, department, roles, optional reason.
  - Response: invited user summary and delivery status; never token/link.
- `POST /account-management/users/:id/invite/resend`
  - Permission: `account:invite`.
  - Behavior: only pending invite users.
- `POST /account-management/users/:id/password-reset`
  - Permission: `account:reset_password`.
  - Response: generic reset delivery status; never token/link.
- `POST /account-management/users/:id/password-reset/revoke`
  - Permission: `account:reset_password`.
  - Body: reason.
  - Behavior: revoke active reset tokens for target user.

### Data Structure Draft

- Future schema/migration is required; Step 46A does not modify or execute it.
- Recommended new table: `account_lifecycle_tokens`.
- Recommended fields:
  - id, targetUserId, emailHash, purpose, tokenHash, status, expiresAt, usedAt, revokedAt, revokedReason, createdByUserId, createdByIpHash, createdUserAgentHash, deliveryChannel, deliveryStatus, deliveryAdapter, auditCorrelationId, createdAt, updatedAt.
- Recommended outbox/adapter boundary:
  - A later Step may add `notification_outbox` or auth-specific mail outbox.
  - Store template key, recipient reference or masked email, delivery status, attempt count, next retry time, and provider message id if any.
  - Do not store the full link or raw token.
- Recommended user/credential schema changes:
  - Add explicit invite/pending lifecycle state or a separate activation state.
  - Add `mustChangePassword` or equivalent if admin-created temporary password remains supported.
  - Consider deprecating direct `initialPassword` in admin UI after invite flow lands.

### Error Semantics

- User enumeration: password reset request always returns the same accepted response.
- Expired link: public response is invalid/expired; audit category `TOKEN_EXPIRED`.
- Duplicate request: replace/revoke previous active token or throttle; public response remains accepted.
- Used token: public response is invalid/expired; audit category `TOKEN_ALREADY_USED`.
- Revoked token: public response is invalid/expired; audit category `TOKEN_REVOKED`.
- Disabled user: public request response remains accepted; token consumption fails unless policy explicitly allows reset while disabled.
- Archived user: never issue usable token; public response remains accepted.
- Role/department changed after invite issue: revalidate on accept; if invalid, fail safely and require admin reissue.

### Audit Requirements

- Record invite created, resent/replaced, accepted, revoked, and expired cleanup.
- Record password reset requested by user, requested by admin, confirmed, revoked/replaced, and failed by category.
- Record credential changed by invite/reset and session revocation count after reset.
- Include actor, target user, target department, purpose, result, token record id, delivery status, failure category, and reason where applicable.
- Do not include raw token, password, password hash, full link, cookie, provider credential, full connection string, or sensitive config.
- Prefer hashed IP/UA for rate-limit correlation. Raw IP/UA retention requires a separate privacy/security decision.

### Email Adapter Boundary

- Production-grade invite/reset requires email delivery because users must set/reset their own passwords without admins seeing passwords.
- Step 46A does not implement or connect real email.
- Later local implementation should introduce a safe adapter/outbox boundary with methods for invite and password-reset delivery.
- Local safe stub should record template key and status without sending or printing token/link.
- Production adapter must be replaceable and separately authorized/configured.
- Full links should be constructed only transiently at delivery boundary and never logged or persisted.

## Step 47E - Real Delivery Adapter/Outbox Contract Design - 2026-06-27

### Scope

- Step identity: Step 47E, contract design only.
- This Step does not implement a provider, add dependencies, add schema/migration files, send email/SMS, read provider credentials, deploy, push, or access production.
- Current runtime remains `AccountLifecycleMailer` with `LOCAL_SAFE_STUB`.

### Contract Goals

- Keep account lifecycle token persistence separate from provider delivery.
- Keep raw token and full reset/invite URL transient, in process memory only.
- Provide a retryable delivery boundary that can move from local fake provider to SMTP/API provider without changing account lifecycle service semantics.
- Preserve enumeration-safe reset request behavior: delivery status must not reveal whether a target email exists to public callers.
- Make failures visible through safe status and audit metadata without logging secrets.

### Adapter Interface

Recommended TypeScript shape for a future implementation:

```ts
export type AccountLifecycleDeliveryTemplate = "INVITE_ACCEPT" | "PASSWORD_RESET";

export type AccountLifecycleDeliveryInput = {
  deliveryId: string;
  tokenId: string;
  purpose: AccountLifecycleTokenPurpose;
  template: AccountLifecycleDeliveryTemplate;
  targetUserId: string;
  emailHash: string | null;
  recipientEmail: string;
  expiresAt: Date;
  rawToken: string;
  publicBaseUrl: string;
  correlationId: string;
};

export type AccountLifecycleDeliveryResult = {
  status: AccountLifecycleDeliveryStatus;
  adapter: string;
  providerMessageId?: string;
  failureCategory?: "CONFIGURATION" | "RATE_LIMITED" | "TEMPORARY" | "PERMANENT" | "SUPPRESSED";
};

export interface AccountLifecycleDeliveryAdapter {
  send(input: AccountLifecycleDeliveryInput): Promise<AccountLifecycleDeliveryResult>;
}
```

Security notes:

- `recipientEmail`, `rawToken`, and full URL must not be persisted in outbox rows, logs, audit payloads, or API responses.
- `providerMessageId` is allowed only if it is not a credential and does not embed recipient PII.
- `publicBaseUrl` must come from validated configuration, not request headers.

### Outbox Contract

Recommended table for a later schema Step: `account_lifecycle_delivery_outbox`.

Fields:

- `id` UUID primary key.
- `token_id` UUID foreign key to `account_lifecycle_tokens`.
- `purpose` enum or string matching token purpose.
- `template` string.
- `recipient_email_hash` varchar(128), nullable for suppressed/unknown targets.
- `status` enum: `PENDING`, `PROCESSING`, `SENT`, `FAILED`, `SUPPRESSED`.
- `adapter` varchar(64), nullable until attempted.
- `provider_message_id` varchar(255), nullable and non-sensitive.
- `attempt_count` integer default 0.
- `next_attempt_at` timestamp nullable.
- `last_attempt_at` timestamp nullable.
- `failure_category` varchar(64), nullable.
- `failure_summary` varchar(500), safe and redacted.
- `correlation_id` varchar(128).
- `created_at`, `updated_at`.

Indexes:

- Unique idempotency index on `token_id`.
- Worker index on `(status, next_attempt_at)`.
- Lookup index on `correlation_id`.

Do not store:

- Raw token.
- Full URL.
- Recipient plaintext email.
- SMTP/API credentials.
- Provider request payloads.

### Status Semantics

- `PENDING`: durable delivery work exists but has not been attempted.
- `PROCESSING`: worker has claimed the item with a short lease or transaction boundary.
- `SENT`: provider accepted delivery.
- `FAILED`: terminal or currently unretriable failure after policy is exhausted.
- `SUPPRESSED`: intentionally not sent, for example missing provider config, ineligible target, or abuse-control suppression.

Retry policy:

- Retry only `TEMPORARY` and `RATE_LIMITED` categories.
- Use bounded exponential backoff with a max attempt count.
- Never create a new lifecycle token just to retry provider delivery.
- Manual resend should revoke/replace previous active token through the existing lifecycle flow.

### Transaction Boundary

Preferred flow:

1. Validate actor/target eligibility.
2. Revoke previous active token rows for same target/purpose.
3. Create new lifecycle token row with hash only.
4. Create one outbox row keyed by token id.
5. Commit.
6. Worker or post-commit dispatcher calls adapter with transient raw token only if raw token is still available; otherwise manual resend creates a new token.

Design implication:

- For first real implementation without durable raw-token storage, synchronous post-commit send is acceptable if failure status is recorded safely.
- A durable async worker must not persist raw tokens; if the process loses raw token before send, mark delivery `FAILED`/`SUPPRESSED` and require resend.

### Observability and Audit

- Account lifecycle token row keeps safe delivery status and adapter.
- Outbox row keeps safe operational status and provider message id if available.
- Audit payload may include token id, target user id, delivery status, adapter, failure category, and correlation id.
- Audit/log payload must not include plaintext email, raw token, full link, provider credentials, full provider response, or full connection string.

### Required Future Gates

- Step 47F: local fake-provider adapter tests and no-send dry run.
- Step 47G: schema design for outbox if durable retry is required, or explicit decision to start with synchronous adapter only.
- Step 47H: provider-specific implementation after provider, sender domain, production base URL, and secret storage are authorized.

## Step 47G - Outbox vs Synchronous Adapter Decision Gate - 2026-06-27

### Decision

Choose `SYNCHRONOUS_POST_COMMIT_ADAPTER_FIRST_OUTBOX_DEFERRED`.

### Rationale

- No real provider has been selected.
- No queue, worker, scheduler, or outbox schema has been authorized.
- Durable retry would require an outbox table and worker ownership model, but storing raw token remains prohibited.
- A durable worker cannot reconstruct reset/invite links after process loss unless raw token is persisted, which is intentionally forbidden.
- The current lifecycle token table already records safe delivery status and adapter, enough for a first provider implementation.
- Manual resend already follows the safer model: revoke/replace the active token and issue a new raw token transiently.

### Synchronous Adapter Semantics

Future first real provider implementation should:

1. Commit lifecycle token creation with hash-only token persistence.
2. Call provider adapter after commit with raw token held only in process memory.
3. Construct full reset/invite link only inside delivery boundary.
4. Update token delivery status and adapter with a safe result.
5. Return only target id and delivery status to admin callers, or enumeration-safe accepted response to public callers.

Status mapping:

- Provider accepted: `SENT`.
- Provider temporary failure or rate limit: `QUEUED` or `FAILED` depending on policy; first implementation should prefer safe `FAILED` if there is no worker to retry.
- Provider suppressed or missing/invalid config: `SUPPRESSED`.
- Provider permanent failure: `FAILED`.

### Failure and Resend Policy

- Failed/suppressed delivery does not invalidate the token by itself.
- The raw token is not recoverable after the process loses it.
- Admin resend is allowed and should create a new token through the existing invite/reset issue path, revoking/replacing the previous active same-purpose token.
- Public reset request may be repeated by the user; it should issue a replacement token only for eligible users while preserving enumeration-safe response behavior.
- Do not retry indefinitely in process.

### Deferred Outbox Conditions

Add outbox schema only if a later authorized Step requires:

- Durable background retry after process restarts.
- Queue/worker ownership and operational monitoring.
- Bounded retry/backoff independent of request latency.
- Provider callback/bounce/complaint reconciliation.

If outbox is later required, create a separate Step 47G-schema / Step 47I with schema, migration, worker, and recovery planning. The outbox still must not persist raw token, full URL, plaintext email, provider credentials, or provider payloads.

### Production Readiness Inputs Still Required

- Provider/relay selection.
- Sender domain/address and DNS verification.
- Production public base URL.
- Secret storage and rotation plan.
- Timeout, failure category, and support escalation rules.
- Rate limiting and abuse-control policy.
- Template copy approval.
- Controlled production smoke recipient and explicit send authorization.
- Production smoke: single controlled invite/reset delivery to an approved test recipient after migration/backfill/deploy authorization.

### Temporary Password Policy

- Recommended decision: do not allow administrators to directly set or view temporary passwords once invite/reset is implemented.
- Existing `initialPassword` is a legacy/bootstrap/local account-creation capability and should be replaced by invite-first onboarding or constrained.
- If temporarily retained:
  - require forced password change on first login.
  - never display generated password after creation.
  - audit credential mode without recording the password.

## Step 47H - Aliyun DirectMail No-Send Adapter - 2026-06-28

### Scope

- Provider-specific adapter for Aliyun DirectMail / 阿里云邮件推送.
- Local no-send / dry-run only.
- No controlled smoke, no real email/SMS, no production access, no outbox schema, no worker, no queue, no scheduler.

### Runtime Boundary

- Default runtime remains `AccountLifecycleMailer` with `LOCAL_SAFE_STUB`.
- `AliyunDirectMailAdapter` is not registered in `AccountLifecycleModule` in this Step.
- Future controlled-smoke wiring must be a separate authorization Step.

### Environment Contract

Variable names only:

- `ALIBABA_CLOUD_ACCESS_KEY_ID`
- `ALIBABA_CLOUD_ACCESS_KEY_SECRET`
- `ALIYUN_DM_ACCOUNT_NAME`
- `ALIYUN_DM_FROM_ALIAS`
- `ALIYUN_DM_REGION`
- `ACCOUNT_LIFECYCLE_PUBLIC_BASE_URL`
- `ALIYUN_DM_DRY_RUN`

`ALIYUN_DM_DRY_RUN` defaults to no-send unless explicitly set to `false` in a later authorized Step.

### Safety Rules

- Raw token may exist only in process memory while building the provider request.
- Full reset/invite link may exist only in the transient provider request.
- Do not persist or log raw token, full link, plaintext recipient email, provider credentials, or full provider payload.
- Missing config returns `SUPPRESSED` with configuration failure category.
  - revoke sessions when forced reset is issued.
- Invite flow sets the user's chosen password before login, so invite acceptance does not need first-login forced change.

### Security Constraints

- Tokens are one-time, high entropy, and hash-only at rest.
- Reset request must be rate-limited by hashed email and hashed IP.
- Confirmation must be transactional and replay-safe.
- Successful reset/acceptance must revoke relevant prior sessions.
- Backend must re-check status, credential, roles, department, and permissions at consumption time.
- No logs, audit payloads, UI, tests, or docs may include raw token, password, credential hash, cookie, full link, or sensitive configuration.

## 概述

- 功能：成果登记、基础审批流、RBAC 与部门隔离、费用台账与预警、基础全文检索、基础统计看板、审计日志、附件管理。
- 用户：科研人员、科研秘书、部门管理员、主管/院领导、涉密成果管理员、内审/审计人员、系统管理员。
- 目标：让一期系统能够替代基础 Excel 台账，完成从成果录入到审批归档、费用预警、查询统计和审计留痕的核心闭环。

## 用户故事

```text
作为科研人员，
我希望登记论文、专利或软著并提交审批，
以便成果信息被部门和院级统一归档管理。
```

```text
作为部门科研秘书，
我希望只看到本部门成果、审批待办和费用台账，
以便完成部门级审核和风险预警处理。
```

```text
作为系统管理员，
我希望配置角色、部门、字典、预警规则和接口 adapter，
以便系统可持续运维且不篡改业务数据。
```

```text
作为审计人员，
我希望只读查看成果、审批、附件和操作日志，
以便完成合规核查。
```

## 页面信息架构

- 登录页：账号登录，后续预留统一身份登录入口。
- 工作台：首页待办、费用预警、我的成果、部门概览、系统消息。
- 成果管理：成果列表、成果详情、论文登记、专利登记、软著登记、草稿、作废。
- 审批管理：我的待办、已办记录、审批详情。
- 费用管理：费用台账、预警列表、缴费记录、凭证附件。
- 检索中心：关键词搜索、筛选、结果列表、权限提示。
- 统计看板：年度趋势、类型分布、部门排行、专利状态、费用汇总。
- 审计日志：操作日志查询、对象详情、导出预留。
- 系统配置：角色权限、部门、字典、预警规则、接口配置。

## 用户流程

1. 登录：用户登录后加载角色、部门和权限集合。
2. 登记：用户选择成果类型，填写表单，上传附件，保存草稿或提交。
3. 校验：系统检查必填、格式、唯一性、权限和附件策略。
4. 审批：部门科研秘书处理本部门待办，系统管理员完成归档。
5. 费用：专利/软著可创建费用记录，系统根据截止日期生成预警。
6. 检索：用户输入关键词和筛选条件，系统返回权限范围内结果。
7. 看板：用户查看个人、部门或全院视角统计，后端按权限裁剪。
8. 审计：核心操作写入审计日志，审计人员只读查询。

## 数据模型

| 名称 | 字段 | 类型 | 说明 | 约束 |
| --- | --- | --- | --- | --- |
| users | id, name, email, dept_id, status | entity | 用户 | email 唯一，关联部门 |
| departments | id, name, parent_id, status | entity | 部门 | 支持层级 |
| roles | id, code, name | entity | 角色 | code 唯一 |
| permissions | id, code, name, resource, action | entity | 权限点 | code 唯一 |
| user_roles | user_id, role_id | relation | 用户角色 | 组合唯一 |
| achievements | id, type, title, status, secret_level, dept_id, owner_user_id, submitted_by, version, created_at, updated_at | aggregate root | 统一成果主表 | status 合法集合，dept_id 索引 |
| paper_details | achievement_id, doi, journal, issn_cn, publish_year, included_type, impact_factor, partition, abstract | detail | 论文详情 | doi 唯一，可为空但不允许重复非空 |
| patent_details | achievement_id, application_no, grant_no, patent_type, filing_date, grant_date, next_fee_date, fee_amount, legal_status | detail | 专利详情 | application_no 唯一，grant_no 唯一非空 |
| software_copyright_details | achievement_id, registration_no, version, software_type, publish_date, register_date, run_env | detail | 软著详情 | registration_no 唯一 |
| achievement_contributors | achievement_id, name, user_id, organization, contributor_type, role, sort_order | relation | 作者/发明人/著作权人 | achievement_id 索引 |
| workflow_instances | id, target_type, target_id, status, current_step | entity | 审批实例 | target 唯一活动实例 |
| workflow_tasks | id, instance_id, assignee_id, status, step_code | entity | 审批待办 | assignee_id/status 索引 |
| workflow_actions | id, instance_id, task_id, actor_id, action, comment, created_at | entity | 审批动作 | 不可删除 |
| fee_records | id, relation_type, relation_id, fee_type, fund_source, amount, due_date, paid_date, pay_status, voucher_no | entity | 费用台账 | due_date/pay_status 索引 |
| reminder_tasks | id, target_type, target_id, remind_date, remind_level, receiver_id, status, confirm_time | entity | 预警提醒 | receiver/status 索引 |
| notifications | id, receiver_id, channel, title, content, status, sent_at | entity | 通知 | 支持站内和邮件 mock |
| attachments | id, relation_type, relation_id, file_name, storage_key, version, upload_user, secret_level, checksum | entity | 附件元数据 | 不暴露真实路径 |
| audit_logs | id, user_id, operate_type, table_name, record_id, old_value, new_value, ip_address, operate_time | append-only | 审计日志 | 不提供删除入口 |
| api_integrations | id, code, provider, enabled, timeout_ms, config_ref | entity | 外部接口配置 | 敏感值只引用环境变量 |
| api_call_logs | id, integration_code, request_id, status, duration_ms, error_summary, created_at | entity | 接口调用日志 | 不记录密钥和完整敏感响应 |
| search_logs | id, user_id, keyword, filters, result_count, created_at | entity | 检索日志 | keyword 需脱敏审查 |

## Step 3A 数据库 Schema 边界最终版

### 一期包含实体

- 组织与账号：`users`、`user_credentials`、`departments`。
- 角色权限结构：`roles`、`permissions`、`role_permissions`、`user_roles`。
- 涉密授权结构：`resource_access_grants`，仅建数据结构，授权判断延后到 Step 4。
- 成果主数据：`achievements`、`paper_details`、`patent_details`、`software_copyright_details`、`achievement_contributors`。
- 基础审批：`workflow_instances`、`workflow_tasks`、`workflow_actions`。
- 费用与提醒：`fee_records`、`reminder_tasks`、`notifications`。
- 附件元数据：`attachments`。
- 审计与日志：`audit_logs`、`api_integrations`、`api_call_logs`、`search_logs`。

### 一期不包含实体

- 成果转化、转化合同、转化收益、收益分配、转化后评估。
- 完整财务线上审批、批量缴费单、财务对账明细。
- 引文分析、论文引用指标快照、外部文献库同步任务。
- 真实 HR/SSO 同步表、真实专利法律状态同步表、真实短信推送表。
- 自定义报表模板、定时报表订阅、复杂可视化配置。
- 移动端推送设备、运维监控、灾备演练和十万级压测专用数据结构。

### 实体分组

| 分组 | 表 | 目的 | Step 3 边界 |
| --- | --- | --- | --- |
| 组织账号 | `departments`、`users`、`user_credentials` | 本地账号、部门树和用户归属 | 只建结构，不实现登录 |
| RBAC 结构 | `roles`、`permissions`、`role_permissions`、`user_roles` | 角色、权限点和分配关系 | 只建结构，不实现鉴权 |
| 授权预留 | `resource_access_grants` | 涉密或特定资源授权 | 只建结构，不实现授权逻辑 |
| 成果主数据 | `achievements`、三类详情、`achievement_contributors` | 论文、专利、软著统一台账 | 建唯一约束、索引和状态字段 |
| 审批 | `workflow_instances`、`workflow_tasks`、`workflow_actions` | 固定基础审批流的数据基础 | 不实现状态机逻辑 |
| 费用提醒 | `fee_records`、`reminder_tasks`、`notifications` | 缴费台账、预警任务和站内通知 | 不实现队列和发送逻辑 |
| 附件 | `attachments` | 附件元数据、版本和权限预留 | 不接对象存储真实 API |
| 审计日志 | `audit_logs` | 核心操作留痕 | append-only 设计，不提供删除入口 |
| 外部接口日志 | `api_integrations`、`api_call_logs` | adapter 配置引用和调用摘要 | 不接真实外部 API |
| 检索日志 | `search_logs` | 基础检索行为记录 | 不实现 Meilisearch 同步 |

### 表设计清单

| 表 | 核心字段 | 唯一约束 | 索引 | 外键/关系 | 状态与时间字段 |
| --- | --- | --- | --- | --- | --- |
| `departments` | `id`, `code`, `name`, `parent_id` | `code` | `parent_id`, `status` | 自关联 `parent_id` | `status`, `created_at`, `updated_at`, `archived_at` |
| `users` | `id`, `email`, `name`, `department_id` | `email` | `department_id`, `status` | `department_id -> departments.id` | `status`, `created_at`, `updated_at`, `archived_at` |
| `user_credentials` | `id`, `user_id`, `password_hash`, `password_updated_at` | `user_id` | `user_id` | `user_id -> users.id` | `status`, `created_at`, `updated_at`, `disabled_at` |
| `roles` | `id`, `code`, `name`, `description` | `code` | `status` | - | `status`, `created_at`, `updated_at`, `archived_at` |
| `permissions` | `id`, `code`, `resource`, `action`, `name` | `code` | `resource`, `action` | - | `status`, `created_at`, `updated_at` |
| `role_permissions` | `role_id`, `permission_id` | `role_id + permission_id` | `permission_id` | FK to roles/permissions | `created_at` |
| `user_roles` | `user_id`, `role_id`, `scope_type`, `scope_key`, `department_id` | `user_id + role_id + scope_type + scope_key` | `user_id`, `role_id`, `department_id` | FK to users/roles/departments | `created_at`, `revoked_at` |
| `resource_access_grants` | `resource_type`, `resource_id`, `grantee_type`, `grantee_id`, `grant_type` | 待 3B 确认是否增加活动授权唯一键 | `resource_type + resource_id`, `grantee_type + grantee_id` | 应用层统一解释资源目标 | `status`, `starts_at`, `expires_at`, `created_at`, `revoked_at` |
| `achievements` | `type`, `title`, `status`, `secret_level`, `department_id`, `owner_user_id`, `submitted_by_id`, `version` | 待各详情表提供业务唯一键 | `department_id + status`, `owner_user_id + status`, `type + status`, `secret_level` | FK to departments/users | `status`, `created_at`, `updated_at`, `submitted_at`, `archived_at`, `voided_at` |
| `paper_details` | `achievement_id`, `doi`, `doi_normalized`, `journal`, `publish_year`, `abstract` | `achievement_id`, `doi_normalized` | `publish_year`, `journal` | `achievement_id -> achievements.id` | `created_at`, `updated_at` |
| `patent_details` | `achievement_id`, `application_no`, `application_no_normalized`, `grant_no`, `grant_no_normalized`, `legal_status`, `next_fee_date` | `achievement_id`, `application_no_normalized`, `grant_no_normalized` | `legal_status`, `next_fee_date` | `achievement_id -> achievements.id` | `created_at`, `updated_at` |
| `software_copyright_details` | `achievement_id`, `registration_no`, `registration_no_normalized`, `software_version`, `software_type` | `achievement_id`, `registration_no_normalized` | `software_type`, `register_date` | `achievement_id -> achievements.id` | `created_at`, `updated_at` |
| `achievement_contributors` | `achievement_id`, `name`, `user_id`, `organization`, `contributor_type`, `contributor_role`, `sort_order` | `achievement_id + contributor_type + sort_order` | `achievement_id`, `user_id` | FK to achievements/users | `created_at`, `updated_at` |
| `workflow_instances` | `target_type`, `target_id`, `status`, `current_step` | 活动实例唯一键待 3B 确认 | `target_type + target_id`, `status` | 应用层解释 target | `created_at`, `updated_at`, `completed_at`, `cancelled_at` |
| `workflow_tasks` | `instance_id`, `assignee_id`, `step_code`, `status` | 幂等唯一键待 3B 确认 | `assignee_id + status`, `instance_id + status` | FK to workflow_instances/users | `created_at`, `updated_at`, `claimed_at`, `completed_at` |
| `workflow_actions` | `instance_id`, `task_id`, `actor_id`, `action`, `comment` | - | `instance_id`, `actor_id`, `created_at` | FK to workflow_instances/tasks/users | `created_at` |
| `fee_records` | `achievement_id`, `fee_type`, `amount`, `due_date`, `paid_date`, `pay_status`, `voucher_no` | 可选 `achievement_id + fee_type + due_date` | `due_date + pay_status`, `achievement_id`, `department_id` | FK to achievements/departments/users | `pay_status`, `created_at`, `updated_at`, `archived_at` |
| `reminder_tasks` | `target_type`, `target_id`, `remind_date`, `remind_level`, `receiver_id`, `status` | `target_type + target_id + remind_date + remind_level + receiver_id` | `receiver_id + status`, `remind_date + status` | FK to users | `status`, `created_at`, `updated_at`, `sent_at`, `confirmed_at` |
| `notifications` | `receiver_id`, `channel`, `title`, `content`, `status` | - | `receiver_id + status`, `channel + status` | FK to users | `status`, `created_at`, `sent_at`, `read_at` |
| `attachments` | `relation_type`, `relation_id`, `file_name`, `storage_key`, `version`, `uploader_id`, `secret_level`, `checksum` | `relation_type + relation_id + file_name + version` | `relation_type + relation_id`, `uploader_id`, `secret_level` | FK to users，资源关系应用层解释 | `status`, `created_at`, `updated_at`, `archived_at` |
| `audit_logs` | `actor_user_id`, `actor_department_id`, `action`, `target_type`, `target_id`, `old_value`, `new_value`, `trace_id` | - | `actor_user_id`, `target_type + target_id`, `created_at`, `trace_id` | FK to users/departments 可为空保留历史 | `created_at` |
| `api_integrations` | `code`, `provider`, `enabled`, `timeout_ms`, `config_ref` | `code` | `enabled`, `provider` | - | `created_at`, `updated_at`, `archived_at` |
| `api_call_logs` | `integration_code`, `request_id`, `status`, `duration_ms`, `error_summary` | `request_id` | `integration_code + created_at`, `status` | 逻辑关联 `api_integrations.code` | `created_at` |
| `search_logs` | `user_id`, `keyword`, `filters`, `result_count` | - | `user_id + created_at`, `created_at` | FK to users | `created_at` |

### 命名规范

- 数据库表名和字段名使用 snake_case。
- Prisma Model 使用 PascalCase，字段使用 camelCase，通过 `@@map` 和 `@map` 映射数据库命名。
- 主键统一使用 `id`，Prisma 字段为 `id`，数据库字段为 `id`。
- 外键字段 Prisma 使用 `departmentId`、`ownerUserId`，数据库使用 `department_id`、`owner_user_id`。
- 枚举名使用 PascalCase，枚举值使用大写 snake case 或稳定业务码，3B 建模时统一。
- 业务唯一键使用 normalized 字段：`doi_normalized`、`application_no_normalized`、`grant_no_normalized`、`registration_no_normalized`。

### 软删除与归档策略

- 不硬删除业务数据；成果、附件、费用、角色、部门等使用 `status` 和 `archived_at` 表达停用、归档或隐藏。
- 成果作废使用 `voided_at`、`voided_by_id`、`void_reason`，不使用 `deleted_at`。
- 附件不删除对象存储真实文件路径信息，使用 `archived_at` 和 `status` 隐藏，并通过审计保留操作记录。
- 审批动作、审计日志、接口调用日志不提供软删除字段，按 append-only 处理。
- 真实合规销毁流程不在一期实现；如未来需要，必须单独设计并经过确认。

### 审计策略

- `audit_logs` 记录新增、修改、提交、审批、驳回、归档、作废、附件上传/下载、费用处理、提醒确认和配置变更。
- 审计字段包括操作者、操作者部门、目标对象、目标部门、目标密级、动作、变更前后摘要、IP、User-Agent、trace_id 和时间。
- 审计日志不记录密钥、Token、密码、Cookie、完整附件内容、完整外部响应或其他敏感明文。
- `old_value` 和 `new_value` 使用 JSON 摘要，3B 仅建字段，字段脱敏规则在业务层实现。
- 审计表不提供删除入口，不加 `deleted_at`。

### 权限隔离字段策略

- 所有核心业务资源预留 `department_id`、`owner_user_id`、`created_by_id`、`updated_by_id`、`secret_level`、`status`。
- 成果主表是权限判断的主事实来源，费用、附件、提醒、审计保留必要部门或目标对象字段，便于 Step 4 做统一策略。
- `resource_access_grants` 作为涉密或专项授权表，支持按用户、角色或部门授权，但 Step 3 不实现授权判断。
- 列表、详情、搜索、看板、附件下载和审计查询的最终权限裁剪在 Step 4+ 后端策略层完成，前端不作为安全边界。

## API 契约

### 输入

- 认证：账号密码或后续 SSO token。
- 成果：成果主字段、类型详情字段、贡献者、附件引用、草稿/提交动作。
- 审批：任务 ID、审批动作、审批意见。
- 费用：关联对象、费用类型、金额、截止日期、缴费状态、凭证附件。
- 检索：关键词、成果类型、部门、年份、密级、状态等筛选条件。
- 看板：视角、部门、时间范围和指标集合。

### 输出

- 统一返回业务对象、分页信息、状态码、错误语义和权限提示。
- 列表和看板只返回当前用户权限范围内数据。
- 附件下载返回短期有效下载响应或后端流式响应，不返回真实存储路径。

### 公开 API 草案

- `POST /auth/login`、`GET /me`
- `GET/POST /achievements`、`GET/PATCH /achievements/:id`
- `POST /achievements/:id/submit`、`POST /achievements/:id/void`
- `GET /approval/tasks`、`POST /approval/tasks/:id/approve`、`POST /approval/tasks/:id/reject`
- `POST /achievements/:id/attachments`、`GET /attachments/:id/download`
- `GET/POST /fees`、`POST /fees/:id/mark-paid`、`GET /fees/warnings`
- `GET /search`、`GET /dashboard/summary`
- `GET /audit-logs`
- `POST /integrations/doi/lookup`、`POST /notifications/test-email`

### 错误语义

- 400：字段缺失、格式错误、状态不允许流转。
- 401：未登录或会话失效。
- 403：无角色权限、跨部门越权、涉密未授权、附件下载越权。
- 404：对象不存在或对当前用户不可见。
- 409：唯一性冲突、重复提交、审批任务已处理。
- 422：业务规则不满足，例如已归档成果不能直接修改。
- 500：服务端异常；必须写入错误日志和 trace_id。
- 503：外部接口不可用；使用手工录入降级路径。

## 状态清单

- 默认：展示用户权限范围内的数据和可执行操作。
- 加载：列表、详情、看板、附件上传、审批提交均有加载状态。
- 空：无成果、无待办、无费用预警、无搜索结果时显示明确空状态。
- 错误：字段错误、唯一冲突、接口失败、附件失败均显示可理解错误。
- 成功：保存、提交、审批、归档、缴费、上传、下载准备完成后有成功反馈。
- 权限不足：隐藏不可执行按钮；直接访问无权资源时显示权限不足，不泄露敏感详情。

## 权限规则

- 科研人员：本人数据可读写，提交后按状态限制编辑。
- 科研秘书：本部门数据可读写，可审核本部门待办，可管理部门费用。
- 部门管理员：本部门基础数据和成果只读为主。
- 主管/院领导：可看全院汇总，详情下钻按授权控制。
- 涉密管理员：可访问授权范围内涉密成果和附件。
- 审计人员：只读归档数据和日志。
- 系统管理员：可配置系统，不允许绕过业务流程直接篡改业务数据。

## 架构边界

- 核心业务：成果状态机、审批状态机、权限策略、费用预警规则、审计记录。
- UI / 展示：表单、列表、看板和用户交互，不承载最终权限判断。
- 数据访问：Repository/ORM 层封装数据库，不在控制器中拼接数据规则。
- 外部依赖：DOI、邮件、HR、财务、专利状态、对象存储通过 adapter。
- 可替换点：认证、搜索引擎、对象存储、通知渠道、外部数据源。

## 验收标准

- [ ] 科研人员可创建论文、专利、软著草稿并提交审批。
- [ ] DOI、申请号、授权号、软著登记号等唯一性校验生效。
- [ ] 部门科研秘书只能处理本部门待办。
- [ ] 系统管理员可归档通过初审的成果。
- [ ] 跨部门访问、涉密访问、附件下载均受权限控制。
- [ ] 费用记录可创建、标记缴费、生成预警。
- [ ] 基础搜索结果按权限过滤。
- [ ] 看板按个人、部门、全院视角返回不同数据。
- [ ] 核心写操作和附件下载均写入审计日志。
- [ ] DOI 和邮件 adapter 可 mock 演示失败降级。

## 非目标

- 不实现真实短信。
- 不实现完整移动端。
- 不实现完整成果转化闭环。
- 不实现复杂自定义报表引擎。
- 不实现真实财务、CNIPA、Scopus、Dimensions 联调。

## 开放问题

- 一期是否要求真实 SSO 登录。
- 涉密附件是否需要一期实际加密落地。
- 一期部署环境和备份策略是否已有院内标准。
