# Backup Policy Implementation Gap Review

## Scope

This review checks the implementation gap between `deploy/backup-retention-encryption-offsite-policy.md` and the current repository.

It is documentation only. It does not implement backup logic, run backups, encrypt artifacts, upload offsite, run restore drills, access VPS/production, or inspect environment file contents.

## Current Implemented Support

### DB Dump

- Current support is runbook-level only.
- `deploy/runbook-production.md` requires a production database backup before migration/deployment.
- Historical local evidence recorded a `pg_dump -Fc` artifact and `pg_restore --list` validation, but there is no committed DB backup script, package command, or typed operation module for creating a DB dump.
- Root package scripts do not expose a DB backup command.

### Attachment Binary Backup

- Current support exists as a local API ops command:
  - `apps/api/src/operations/attachment-binary-backup.ts`.
  - `apps/api/package.json` script `ops:backup:attachments`.
- It can write an attachment archive, attachment manifest, and artifact-list metadata.
- It can include an existing DB dump artifact in the artifact list through `--db-dump`, but it does not create the DB dump.
- It records aggregate manifest counts and avoids raw storage keys in manifest/artifact-list outputs.
- It has focused unit coverage for archive/manifest/list shape, missing binary status, unsupported relation counting, and redaction boundaries.

### Production Runbooks

- `deploy/runbook-production.md` links the Step 63A policy and now requires DB plus attachment binary coverage before backup readiness can be accepted.
- `deploy/checklist-production-cutover.md` still has a narrower backup section: demo/staging directory backup, production database backup, restore path known, and redacted evidence. It does not yet require attachment binary coverage, encryption status, offsite status, retention class, or restore-drill boundary review.
- `docker-compose.production.yml` defines a named Postgres volume but no dedicated API attachment-storage volume. Attachment binary durability and production backup targeting therefore still need an explicit storage design before production readiness can be claimed.

## Gap Review

### 1. DB Dump Plus Attachment Binary Coverage

Current state:

- DB dump is documented but not automated.
- Attachment archive is implemented but local/manual and not integrated with DB dump creation.
- Artifact-list can include both categories only if an operator separately supplies an existing DB dump path.

Gaps:

- No single reviewed command creates a complete backup set with a DB dump, attachment archive, manifest, and artifact-list.
- No preflight verifies that DB dump timestamp and attachment archive timestamp belong to the same backup set window.
- No production-safe wrapper exists to stop when attachment manifest consistency is `FAILED`.
- No production checklist item currently requires artifact-list verification for all required artifact categories.

Risk:

- Operators can accidentally treat a DB-only backup or attachment-only artifact as a complete application backup.

Recommended small Steps:

1. Documentation-only: update `deploy/checklist-production-cutover.md` backup section to require DB dump plus attachment archive plus manifest plus artifact-list.
2. Local-only implementation: add a non-production dry-run aggregator that validates an existing DB dump path plus attachment artifact outputs without executing `pg_dump`.
3. Separately authorized local production-like Step: create one complete local backup set and verify artifact-list categories without restore.

### 2. Retention Policy

Current state:

- Step 63A defines retention classes and target windows.
- Repository has no retention inventory, no retention metadata file, no retention command, and no cleanup proposal generator.
- Cleanup remains manual and requires explicit confirmation.

Gaps:

- No machine-readable retention class is written into artifact-list metadata.
- No command can list candidate backup sets by class, age, size, and verification status.
- No hold marker exists for incident, migration, audit, or rollback-window retention holds.
- No documented review template exists for cleanup proposals.

Risk:

- Retention decisions will remain ad hoc, and cleanup candidates may lack enough evidence for safe human approval.

Recommended small Steps:

1. Documentation-only: add a retention review template with candidate basename, class, age, size, verification status, offsite status, and hold status.
2. Metadata-only implementation: extend future artifact-list metadata with retention class and backup set id.
3. Read-only local tool: list ignored local backup artifacts and produce a cleanup proposal without deleting anything.

### 3. Encryption Policy

Current state:

- Step 63A requires encryption before production artifacts leave the VPS or trusted operator machine.
- No encryption tool family is selected in repo docs.
- No encryption command wrapper, key injection method, or encrypted-artifact naming rule exists.
- No tests verify that encryption command output or logs remain redacted.

Gaps:

- No approved tool choice such as age, GPG, OpenSSL, or cloud KMS envelope encryption.
- No key owner, key rotation, recovery, or break-glass process is documented.
- No redacted logging contract exists for encryption commands beyond the policy statement.
- No failure-state checklist distinguishes unencrypted local source artifact, encrypted artifact, partial encrypted artifact, and retry state.

Risk:

- Production operators may improvise encryption, accidentally expose command-line secrets, or create artifacts that cannot be restored later.

Recommended small Steps:

1. Documentation-only: choose an encryption tool family and define redacted command shapes without real key material.
2. Local synthetic validation: encrypt a synthetic non-sensitive text artifact and record only basename/size/digest/status.
3. Later production-prep Step: document key owner, recovery owner, and rotation cadence without committing key material.

### 4. Offsite Policy

Current state:

- Step 63A defines target classes, least-privilege principles, redacted upload evidence, and failed-upload stop behavior.
- No offsite target is selected.
- No bucket/prefix alias, provider, permission model, credential injection path, or upload command exists.
- No production checklist item requires offsite status before final `GO`.

Gaps:

- No offsite provider decision.
- No least-privilege role split between upload/read/list and delete/retention administration.
- No retry/partial-upload verification procedure tied to provider object metadata.
- No local proof exists that upload evidence can be recorded without provider secrets.

Risk:

- Backup readiness can be overclaimed from local artifacts while there is no durable offsite copy.

Recommended small Steps:

1. Documentation-only: add an offsite provider decision record with target class, permission boundary, and evidence format.
2. Local synthetic validation: simulate upload evidence using a fake provider response object, no network and no credentials.
3. Separately authorized ops Step: configure offsite target and run a dry-run/list-only permission check with redacted output.

### 5. Restore Drill

Current state:

- Step 63A defines restore drill prerequisites, acceptance evidence, and prohibited actions.
- Step 53A documented a local restore drill plan.
- No committed restore script, isolated compose project, restore target naming rule, or guard against production target exists.
- No drill has restored a complete DB plus attachment backup set.

Gaps:

- No isolated restore environment definition is committed.
- No target guard verifies "not production" and "not current production-like working database" before restore.
- No read-only verification script exists for restored schema/table counts plus attachment manifest consistency.
- No checklist verifies that app writes, migrations, seed/backfill, notifications, and password changes remain disabled during drill.

Risk:

- A future restore drill could be unsafe or ambiguous, especially if operators reuse the current production-like database.

Recommended small Steps:

1. Documentation-only: add an isolated restore drill checklist with target naming, stop conditions, and redacted evidence fields.
2. Local synthetic design Step: define a separate local restore compose project name and database volume name without running it.
3. Separately authorized local drill Step: restore a known local backup set into the isolated target and run read-only verification only.

## Cross-cutting Gaps

- The policy is stronger than the current operational implementation. Current status is planning-ready, not production-ready.
- Local synthetic acceptance remains useful for artifact contract testing only; it is not production backup acceptance and not VPS readiness.
- Production `GO` should remain blocked or conditional until complete backup set creation, encryption, offsite status, and restore-drill plan acceptance are all evidenced.
- Existing untracked local artifacts should remain out of scope unless a later Step explicitly asks for inventory or cleanup review.

## Suggested Next Step Order

1. Update production cutover checklist to mirror Step 63A backup readiness gates.
2. Add a complete backup-set artifact-list contract update, including backup set id and retention class.
3. Add a local-only complete backup-set aggregator that accepts an existing DB dump and attachment outputs, with no production access.
4. Choose and document encryption tool family and redacted evidence format.
5. Choose and document offsite target class and permission model.
6. Add isolated restore drill checklist and target guard design.

Each item should remain a separate small Step unless the user explicitly authorizes a broader operations implementation.
