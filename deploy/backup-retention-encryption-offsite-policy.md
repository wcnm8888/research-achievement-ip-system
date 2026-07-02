# Backup Retention, Encryption, Offsite, And Restore Drill Policy

## Scope

This document defines the backup policy boundary for local, local production-like, and production backup sets.

It is policy and planning only. It is not evidence that a backup was created, encrypted, uploaded, restored, or accepted.

## Hard Boundaries

- Do not run a backup, encryption, upload, restore, cleanup, deletion, prune, reset, or production operation from this policy document alone.
- Do not read or record `.env`, `.env.production`, database credentials, passwords, cookies, session tokens, API tokens, AccessKeys, private keys, certificates, or full connection strings.
- Do not write encryption passphrases, key IDs with secret material, recovery codes, object-store credentials, or provider secrets to git, evidence, logs, screenshots, or chat.
- Do not treat local artifact acceptance, including Step 62C synthetic attachment backup acceptance, as production backup acceptance or VPS acceptance.
- Any production or VPS operation needs a separate authorized Step with target, operator, evidence boundary, rollback boundary, and stop conditions.

## Backup Set Definition

A complete application backup set must include:

- Postgres custom-format DB dump artifact.
- Attachment binary archive artifact for supported `Attachment` relation types.
- Attachment backup manifest with aggregate non-sensitive metadata only.
- Artifact-list metadata for the backup set.
- Optional redacted operator note recording target summary, timestamp, command category, result, and retention class.

The backup set is incomplete if DB metadata and attachment binaries are not captured as the same named set or if manifest consistency reports missing referenced binaries.

## Retention Policy

### Local Synthetic Artifacts

- Scope: synthetic local artifacts such as Step-specific `.local-step*/` acceptance outputs.
- Retention: keep only long enough for current Step review unless the user explicitly asks to preserve them.
- Cleanup: no automatic cleanup. Removing, moving, or pruning local artifacts requires explicit confirmation and an exact affected path list.
- Evidence: record only artifact basenames, sizes, aggregate counts, and pass/fail summaries.

### Local Production-like Backups

- Scope: local Docker production-like DB dump and local attachment archive sets that may contain real local test data.
- Retention target: keep the latest accepted set for immediate rollback rehearsal and up to 3 recent accepted sets or 14 calendar days, whichever is smaller.
- Cleanup: never clean old sets automatically. Before any cleanup, present candidate basenames, locations, age, size, and whether each set has a restore-list or manifest result.
- Acceptance boundary: local production-like evidence is local-only and does not prove VPS production backup readiness.
- Storage boundary: artifacts must stay under ignored local artifact storage or another explicitly chosen E-drive location outside git.

### Production Backups

- Scope: VPS production DB dump, production attachment binary archive, manifest, and artifact-list sets.
- Retention target:
  - Daily backups: 14 days.
  - Weekly backups: 8 weeks.
  - Monthly backups: 6 months.
  - Pre-migration and pre-cutover backups: keep until the user confirms the rollback window is closed.
- Cleanup: production cleanup is a separate high-risk operation. It requires explicit user approval, an exact candidate list, current restore coverage status, and offsite confirmation before anything is removed.
- Hold rule: if a migration, incident, audit request, or data-integrity concern is open, suspend deletion until the hold is released.

## Encryption Policy

- Production backup sets must be encrypted before leaving the VPS or any trusted local operator machine.
- Local production-like backup sets containing real local data should be encrypted before being moved outside the workspace or operator machine.
- Purely synthetic local artifacts may remain unencrypted if they contain no real business data, credentials, storage keys, or user-provided files.
- Encryption keys must be generated and stored outside the repository. Acceptable later choices include an operator-managed offline key, a reviewed password-manager secret, or a cloud KMS key with least-privilege access.
- Do not commit key material, passphrases, key export files, recovery material, or decrypted production backup artifacts.
- Do not print encryption command lines if they contain secret material. Evidence may record only tool family, encrypted artifact basename, byte size, digest, and success/failure.
- If encryption fails, stop the offsite path. Keep the unencrypted artifact only on the authorized source host until a separately approved cleanup or retry decision is made.

## Offsite Policy

- Production backups need an offsite target before production `GO`; local production-like backups do not satisfy this requirement.
- Offsite target selection is deferred until a separate authorized operations Step. Acceptable target classes are object storage with versioning/retention controls, a managed backup vault, or another reviewed encrypted storage service.
- Offsite permissions should be least privilege:
  - normal backup operator can write new encrypted artifacts and read/list only the required prefix;
  - delete or retention-policy changes require a separate break-glass role or explicit confirmation;
  - credentials are stored only on the operator/VPS side, never in git.
- Upload evidence must be redacted: target class, bucket/prefix alias, artifact basename, size, digest, timestamp, and result only.
- If upload fails, mark offsite status `FAILED`, keep the encrypted local artifact for retry, do not delete local source artifacts, and do not declare production backup acceptance.
- Partial uploads must be treated as failed unless the provider confirms an atomic completed object with the expected size and digest.

## Restore Drill Policy

Restore drill is required for backup credibility but is not authorized by this document.

Future restore drill prerequisites:

- Separate explicit Step authorization.
- Exact backup set basename and retention class.
- Confirmation that the target is isolated and not production, not the current production-like working database, and not any live user-facing service.
- Confirmation of allowed artifact creation and whether any cleanup is requested after the drill.
- Stop condition for any destructive command. If a restore, drop, reset, prune, delete, or cleanup command is needed, present affected resources and wait for explicit approval.

Future restore drill acceptance evidence:

- DB restore-list or restore command category result, without credentials.
- Attachment archive/manifest consistency result, using aggregate counts only.
- Read-only schema/table-count sanity checks.
- Optional local GET-only application smoke against the isolated target.
- Redacted result summary with no passwords, cookies, tokens, AccessKeys, private keys, storage keys, file contents, full paths containing secrets, or full connection strings.

Prohibited during restore drill:

- Restoring into production or the current production-like working database without a separate rollback plan.
- Running app writes, imports, migrations, seed/backfill, notifications, or account password changes.
- Recording raw attachment names, storage object keys, per-file checksums, voucher numbers, amounts, credential values, or session values.

## Production Readiness Gate

Before production `GO`, backup readiness must have:

- One current production backup set plan covering DB plus attachment binaries.
- Encryption method selected and key-management owner confirmed without exposing key material.
- Offsite target selected and least-privilege permissions reviewed.
- Redacted backup evidence format agreed.
- Restore drill plan accepted, even if the first production restore drill is scheduled as a separate post-cutover Step.

Until those items are accepted, the status is at most `CONDITIONAL_GO` for backup readiness.
