# Production Backup Readiness Checklist

## Scope

This checklist defines when backup readiness can be claimed for production.

It aligns `docs/operations/backup-retention-encryption-offsite-policy.md` and `docs/operations/backup-policy-implementation-gap-review.md`. It is a readiness checklist only. It does not authorize backup execution, encryption of real artifacts, offsite upload, restore, cleanup, Docker operations, VPS access, production DB access, or environment-file content reads.

## Readiness Levels

### Policy-ready

The project is policy-ready when:

- Backup scope is documented for DB dump, attachment binary archive, manifest, artifact-list metadata, retention, encryption, offsite storage, restore drill, and evidence.
- Local artifact acceptance is explicitly separated from production/VPS acceptance.
- Destructive cleanup, restore, reset, drop, prune, and deletion remain blocked without explicit approval.

Current status after Step 63C: policy-ready.

### Local Artifact-ready

The project is local artifact-ready when:

- Synthetic or local-only artifacts prove the artifact contract without production/VPS access.
- Artifact-list metadata includes expected categories for the tested local setup.
- Manifest and evidence contain only aggregate non-sensitive fields.
- Results are recorded as local-only and do not claim production/VPS readiness.

Current status after Step 63C: attachment local artifact-ready only. Complete DB-plus-attachment backup-set readiness is not yet accepted.

### Production-like Backup-ready

The project is production-like backup-ready when an explicitly authorized local production-like Step has evidence for:

- DB dump artifact created from the local production-like database.
- Attachment binary archive created from the local production-like attachment storage boundary.
- Manifest and artifact-list prove DB dump plus attachment archive plus manifest are one backup set.
- Manifest consistency is `PASS`, or a `WARNING` is accepted with a documented non-production risk; `FAILED` is not backup-ready.
- Backup artifacts remain outside git, and cleanup remains separately approved.
- Evidence is local-only and does not claim production/VPS readiness.

Current status after Step 63C: blocked/deferred until a separate local production-like backup Step is authorized.

### Production Backup-ready

The project is production backup-ready only when all production checklist sections below are accepted with redacted evidence from an explicitly authorized VPS/production Step.

Current status after Step 63C: blocked/deferred. No production backup, encryption, offsite upload, or restore drill has been executed or accepted.

## Production Backup-ready Checklist

### 1. Authorization And Target Boundary

- [ ] Production/VPS backup Step is explicitly authorized.
- [ ] Target is confirmed as the intended production VPS and production database using a redacted summary only.
- [ ] `.env.production` exists on the authorized host if needed, but its content is not printed, copied, committed, screenshotted, or written to evidence.
- [ ] Operator, start time, intended backup set id, and stop conditions are recorded without secrets.
- [ ] Any cleanup, deletion, prune, reset, drop, restore, or overwrite action is out of scope unless separately approved with exact affected resources.

Blocked/deferred before production authorization:

- Production target confirmation.
- Production env existence confirmation on VPS.
- Any command that reads production runtime state.

### 2. Backup Set Contents

- [ ] Backup set id is assigned before artifact creation.
- [ ] Postgres custom-format DB dump is included in the backup set.
- [ ] Attachment binary archive is included in the same backup set.
- [ ] Supported attachment relation types include `ACHIEVEMENT` and `FEE_RECORD`.
- [ ] Unsupported or deferred relation types are counted only in aggregate.
- [ ] DB dump and attachment archive are close enough in time to represent one coherent backup set, or the timing gap is recorded as a risk.
- [ ] Backup set is marked incomplete if either DB dump or attachment archive is missing.

Blocked/deferred before production authorization:

- Creating a production DB dump.
- Reading production attachment binaries.
- Claiming production backup set completeness.

### 3. Manifest, Artifact-list, Checksums, And Metadata

- [ ] Manifest records only aggregate non-sensitive metadata.
- [ ] Artifact-list includes at least `POSTGRES_DUMP`, `ATTACHMENT_BINARY_ARCHIVE`, and `ATTACHMENT_BACKUP_MANIFEST`.
- [ ] Artifact-list records artifact basenames, byte counts, whole-artifact digests, backup set id, created-at timestamp, and retention class.
- [ ] Whole-artifact digests are recorded for integrity verification.
- [ ] Per-file checksums, raw storage paths, storage object keys, filenames from business uploads, voucher numbers, amounts, and file contents are not recorded in committed docs, logs, screenshots, or evidence.
- [ ] Manifest consistency is `PASS` for production backup-ready.
- [ ] Any `FAILED` manifest status blocks production backup-ready.

Blocked/deferred before production authorization:

- Production artifact metadata collection.
- Production digest calculation.
- Production manifest consistency claim.

### 4. Retention And Deletion Boundary

- [ ] Retention class is recorded for the backup set.
- [ ] Production target retention is documented:
  - daily: 14 days;
  - weekly: 8 weeks;
  - monthly: 6 months;
  - pre-migration/pre-cutover: until rollback window closure is confirmed.
- [ ] Incident, migration, audit, or rollback-window hold status is checked before any cleanup proposal.
- [ ] No automatic deletion is enabled by this checklist.
- [ ] Any deletion, prune, cleanup, or move requires a separate candidate list with basename, location alias, age, size, verification status, offsite status, hold status, and explicit user approval.

Blocked/deferred before production authorization:

- Production retention inventory.
- Production cleanup candidate review.
- Any deletion, prune, cleanup, or move.

### 5. Encryption Boundary

- [ ] Encryption tool family is selected and documented before production artifacts leave the VPS or trusted operator machine.
- [ ] Key owner and recovery owner are documented without key material.
- [ ] Key injection path is documented without printing passphrases, key exports, recovery material, AccessKeys, provider credentials, or private keys.
- [ ] Encryption logs and evidence are redacted and may include only tool family, encrypted artifact basename, byte size, digest, timestamp, and result.
- [ ] If encryption fails, offsite upload is stopped and production backup-ready is blocked.
- [ ] Unencrypted production artifacts are retained only on the authorized source host until a separate retry or cleanup decision.

Blocked/deferred before production authorization:

- Choosing real production key material.
- Encrypting real production artifacts.
- Recording encrypted production artifact evidence.

### 6. Offsite Boundary

- [ ] Offsite target class is selected before production `GO`.
- [ ] Provider/bucket/prefix are recorded only as redacted aliases in repository evidence.
- [ ] Upload permissions are least privilege for write/read/list on the required prefix.
- [ ] Delete and retention-policy administration require a separate role or explicit confirmation.
- [ ] Upload evidence records target class, target alias, artifact basename, size, digest, timestamp, and result only.
- [ ] Failed or partial upload blocks production backup-ready.
- [ ] Local production-like backups do not satisfy offsite production readiness.

Blocked/deferred before production authorization:

- Selecting or configuring real offsite credentials.
- Uploading production artifacts.
- Listing or reading real offsite production objects.

### 7. Restore Drill Boundary

- [ ] Restore drill plan is accepted before production `GO`; actual restore may be scheduled as a separate authorized Step.
- [ ] Drill target is isolated and is not production, not the current production-like working database, and not any live user-facing service.
- [ ] Target guard prevents accidental production connection before restore commands are allowed.
- [ ] Restore evidence is redacted and includes command category result, DB restore/list result, attachment manifest consistency, read-only schema/table-count sanity checks, and optional GET-only local smoke.
- [ ] App writes, imports, migrations, seed/backfill, notifications, and account password changes are prohibited during drill unless separately authorized.
- [ ] Cleanup of drill artifacts is not automatic and requires separate approval.

Blocked/deferred before production authorization:

- Production restore.
- Local or production restore execution.
- Creating isolated restore infrastructure.

### 8. Evidence Requirements

- [ ] Evidence includes readiness level: `policy-ready`, `local artifact-ready`, `production-like backup-ready`, or `production backup-ready`.
- [ ] Evidence records only redacted target summary, backup set id, artifact basenames, artifact categories, byte counts, digest status, manifest status, retention class, encryption status, offsite status, restore-drill status, timestamp, and operator confirmation.
- [ ] Evidence does not include passwords, tokens, cookies, session values, secrets, AccessKeys, private keys, full connection strings, `.env` content, provider credentials, raw storage object keys, raw file paths containing sensitive data, business-upload filenames, file contents, voucher numbers, or amounts.
- [ ] Evidence distinguishes local, production-like, and production scope.
- [ ] Evidence marks any missing production/VPS execution as blocked/deferred, not accepted.

## Production Backup-ready Decision

Use these outcomes:

- `GO`: all production checklist sections are accepted with redacted evidence.
- `CONDITIONAL_GO`: backup plan is acceptable but one or more non-execution items remain scheduled and explicitly risk-accepted.
- `NO_GO`: DB dump, attachment binary archive, encryption, offsite, or manifest consistency is missing or failed.
- `BLOCKED`: production/VPS authorization, offsite decision, encryption decision, or restore-drill plan is missing.

Without explicit VPS/production authorization and evidence, the status cannot exceed `policy-ready` or `local artifact-ready`.

## Low-risk Follow-up Steps

1. Documentation-only: update production cutover checklist backup section to require this readiness checklist.
2. Metadata design: define backup set id and retention class fields for future artifact-list metadata.
3. Local-only design: plan a complete backup-set aggregator around an existing DB dump plus attachment outputs, without running `pg_dump`.
4. Documentation-only: choose an encryption tool family and redacted evidence format.
5. Documentation-only: choose an offsite target class and least-privilege permission model.
6. Documentation-only: define an isolated restore-drill target guard checklist.
