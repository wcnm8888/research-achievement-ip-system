# Local Backup Artifact Metadata Design

## Scope

This document defines the local-only artifact-list and metadata contract for a future backup-set aggregator.

It is design only. It does not implement a script, create a DB dump, create an attachment archive, encrypt artifacts, upload offsite, run a restore drill, access VPS/production, access a production database, read `.env` / `.env.production` contents, or authorize cleanup/deletion.

The design supports local production-like acceptance preparation only. It is not production/VPS backup readiness and must not be cited as production backup evidence.

## Compatibility With Existing Attachment Artifact-list

The current attachment binary backup implementation writes an artifact-list with this base shape:

- `artifactType`: `BACKUP_ARTIFACT_LIST`.
- `version`: currently `1`.
- `createdAt`: ISO timestamp.
- `artifacts[]`: artifact entries with `type`, `basename`, `bytes`, and whole-artifact `digest`.

The future local backup-set aggregator should extend this structure instead of introducing an unrelated format. It should continue to accept existing attachment artifact-list entries and add backup-set metadata around them.

Recommended next schema version:

- Use `version: 2` for a complete local backup-set artifact-list.
- Preserve `artifactType: BACKUP_ARTIFACT_LIST`.
- Preserve `createdAt` and `artifacts[]`.
- Preserve `type`, `basename`, `bytes`, and whole-artifact `digest` for each artifact.
- Add fields that describe backup set identity, local scope, relative artifact paths, retention, encryption, offsite, restore-readiness, and redacted evidence.

## Required Local Backup-set Fields

Top-level fields:

- `artifactType`: fixed value `BACKUP_ARTIFACT_LIST`.
- `version`: manifest/artifact-list schema version. The complete backup-set design should start at `2`.
- `createdAt`: ISO timestamp when the artifact-list metadata was generated.
- `backupSet.id`: generated non-sensitive backup set id, such as a timestamped local id. It must not contain credentials, host secrets, user names, or customer data.
- `backupSet.timestamp`: ISO timestamp representing the intended backup-set capture window.
- `backupSet.environmentLabel`: explicit local label, such as `local-synthetic` or `local-production-like`. It must not contain production hostnames, full URLs with credentials, connection strings, or private infrastructure details.
- `backupSet.scope`: fixed local scope enum, such as `LOCAL_ONLY` or `LOCAL_PRODUCTION_LIKE`.
- `backupSet.productionReadinessClaim`: fixed `false`.
- `backupSet.generatedBy`: non-sensitive generator identity, such as command family, package name, command category, and optional git commit. Do not record command arguments that include paths or credentials.
- `backupSet.localOnlyNotice`: fixed statement that the file is local acceptance metadata only and is not production/VPS readiness.

Required artifact categories:

- `POSTGRES_DUMP`.
- `ATTACHMENT_BINARY_ARCHIVE`.
- `ATTACHMENT_BACKUP_MANIFEST`.

The backup set is incomplete if any required category is missing.

## Artifact Entry Contract

Each `artifacts[]` entry should include:

- `type`: artifact category.
- `basename`: generated artifact basename only.
- `relativePath`: path relative to the local backup artifact root, using generated artifact names only.
- `bytes`: whole-artifact byte count.
- `digest`: whole-artifact digest string, preferably `sha256:<hex>`.
- `generatedBy`: non-sensitive command family or source category, for example `external-local-db-dump`, `attachment-binary-backup`, or `local-backup-set-aggregator`.
- `createdAt`: ISO timestamp when this artifact was created or observed.
- `requiredForCompleteSet`: boolean.

The design intentionally records whole-artifact digests only. It must not record per-file checksums, raw attachment storage keys, raw uploaded filenames, file contents, voucher numbers, amounts, or business payload fragments.

## DB Dump Artifact Metadata

For the `POSTGRES_DUMP` entry, record only:

- `format`: expected `postgres-custom-format`.
- `basename`.
- `relativePath`.
- `bytes`.
- `digest`.
- `generatedBy`: non-sensitive command category, such as `external-local-pg-dump`.
- `createdAt`.
- `restoreListStatus`: local status enum such as `NOT_RUN`, `PASS`, `WARNING`, or `FAILED`.
- `credentialExposure`: expected `NOT_RECORDED`.

Do not record database URL values, database user names when sensitive, host credentials, connection strings, environment variable contents, SQL data rows, table contents, or command lines containing credentials.

## Attachment Binary Artifact Metadata

For the `ATTACHMENT_BINARY_ARCHIVE` entry, record only:

- `basename`.
- `relativePath`.
- `bytes`.
- `digest`.
- `generatedBy`: `attachment-binary-backup`.
- `createdAt`.
- `supportedRelationTypes`: aggregate supported relation type codes, currently `ACHIEVEMENT` and `FEE_RECORD`.
- `manifestBasename`: generated manifest basename.
- `manifestVersion`: attachment manifest schema version read from the attachment manifest metadata.
- `manifestConsistencyStatus`: `PASS`, `WARNING`, or `FAILED`.
- `aggregateCounts`: non-sensitive counts only, such as file count, total bytes, relation type counts, missing binary count, extra binary count, and unsupported relation count.

Do not record raw attachment storage paths, object keys, uploaded filenames, per-file checksums, attachment file contents, voucher numbers, amounts, user-provided file labels, or unsupported relation identifiers beyond aggregate counts.

## Attachment Manifest Artifact Metadata

For the `ATTACHMENT_BACKUP_MANIFEST` entry, record only:

- `basename`.
- `relativePath`.
- `bytes`.
- `digest`.
- `generatedBy`: `attachment-binary-backup`.
- `createdAt`.
- `manifestVersion`.
- `consistencyStatus`.
- `issueSummary`: aggregate issue codes and counts only.

The manifest itself remains the source of aggregate attachment consistency. The complete backup-set artifact-list may repeat aggregate status fields for fast validation, but it should not expand to per-file details.

## Status Fields

The complete local artifact-list should include a `readiness` object:

- `retention.class`: one of `local-synthetic` or `local-production-like`.
- `retention.holdStatus`: `NONE`, `INCIDENT_HOLD`, `MIGRATION_HOLD`, `AUDIT_HOLD`, or `ROLLBACK_WINDOW_HOLD`.
- `retention.cleanupAllowed`: fixed `false` unless a later Step explicitly approves a cleanup candidate list.
- `encryption.status`: `NOT_REQUIRED_SYNTHETIC`, `NOT_ENCRYPTED_LOCAL_ONLY`, `ENCRYPTED_SYNTHETIC`, or `BLOCKED`.
- `encryption.evidence`: redacted status only; no key material, passphrase, key export, recovery material, or provider credential.
- `offsite.status`: for this local design, expected `NOT_UPLOADED_LOCAL_ONLY`.
- `offsite.targetAlias`: optional redacted alias only; for this Step it should remain absent or `NONE`.
- `restoreReadiness.status`: `NOT_TESTED`, `RESTORE_LIST_PASS`, `MANIFEST_PASS`, `LOCAL_READ_ONLY_SMOKE_PASS`, `WARNING`, or `FAILED`.
- `restoreReadiness.scope`: local-only status; never production restore evidence.

Local-only artifact-list metadata must not mark offsite or production restore readiness as accepted.

## Redacted Evidence Fields

The artifact-list may include `redactedEvidence` for local review:

- `readinessLevel`: expected `local artifact-ready` or `production-like backup-ready` only after a separately authorized local production-like Step supplies evidence.
- `targetSummary`: redacted local target label only.
- `backupSetId`.
- `artifactBasenames`.
- `artifactCategories`.
- `byteCounts`.
- `digestStatus`.
- `manifestStatus`.
- `retentionClass`.
- `encryptionStatus`.
- `offsiteStatus`.
- `restoreReadinessStatus`.
- `timestamp`.
- `operatorConfirmation`: non-sensitive confirmation text or boolean.

Evidence must distinguish `local-synthetic`, `local-production-like`, and `production`. For this design, production/VPS evidence remains `blocked/deferred`.

## Forbidden Values

The artifact-list, manifest, logs, committed docs, screenshots, and evidence must not record:

- Secret values, API tokens, session tokens, cookies, passwords, one-time codes, or credential hashes.
- Full connection strings, database URLs, provider URLs containing embedded credentials, or command lines containing credentials.
- AccessKeys, private keys, certificates, key exports, passphrases, recovery codes, or cloud provider credentials.
- `.env` or `.env.production` contents.
- Raw attachment storage object keys, raw storage paths, absolute paths containing sensitive account or project details, raw uploaded filenames, file contents, per-file checksums, voucher numbers, amounts, or business payload fragments.

If a future tool accidentally prints any forbidden value, the value must not be copied into evidence or committed files.

## Local-only Constraint

This design is only for local production-like acceptance preparation. It can prove that a future local aggregator understands a DB dump artifact, an attachment binary archive, an attachment manifest, checksums, sizes, relative paths, generator identity, and redacted statuses as one local backup set.

It does not prove:

- Production DB backup execution.
- Production attachment binary backup execution.
- Production encryption.
- Offsite upload.
- Production restore readiness.
- VPS readiness.
- Cleanup safety.

## Suggested Follow-up Steps

1. Step 64B: implement a local-only artifact-list schema/sample for an existing DB dump plus existing attachment outputs, without running `pg_dump`, backup execution, encryption, offsite upload, restore, Docker, VPS, or production DB access.
2. Later local-only Step: add a dry-run aggregator that validates required artifact categories, relative paths, byte counts, and whole-artifact digests from pre-existing local artifacts only.
3. Later documentation-only Step: choose an encryption tool family and redacted evidence shape without real key material.
4. Later documentation-only Step: define an offsite target class and least-privilege permission model without credentials or network operations.
5. Later restore-design Step: define an isolated restore-drill target guard without executing restore commands.
