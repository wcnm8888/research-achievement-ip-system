import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(directory, "local-backup-artifact-list.schema.json");
const samplePath = path.join(directory, "local-backup-artifact-list.sample.json");

const requiredCategories = [
  "POSTGRES_DUMP",
  "ATTACHMENT_BINARY_ARCHIVE",
  "ATTACHMENT_BACKUP_MANIFEST",
];
const allowedEnvironmentLabels = new Set(["local-synthetic", "local-production-like"]);
const allowedScopes = new Set(["LOCAL_ONLY", "LOCAL_PRODUCTION_LIKE"]);
const allowedConsistencyStatuses = new Set(["PASS", "WARNING", "FAILED"]);
const allowedRestoreStatuses = new Set([
  "NOT_TESTED",
  "RESTORE_LIST_PASS",
  "MANIFEST_PASS",
  "LOCAL_READ_ONLY_SMOKE_PASS",
  "WARNING",
  "FAILED",
]);
const allowedEncryptionStatuses = new Set([
  "NOT_REQUIRED_SYNTHETIC",
  "NOT_ENCRYPTED_LOCAL_ONLY",
  "ENCRYPTED_SYNTHETIC",
  "BLOCKED",
]);
const forbiddenSamplePatterns = [
  /password/i,
  /token/i,
  /cookie/i,
  /secret/i,
  /private\s*key/i,
  /connection\s*string/i,
  /access\s*key/i,
  /AccessKey/,
  /\.local-step/i,
  /DATABASE_URL/i,
  /SESSION_/i,
  /AKIA[0-9A-Z]{16}/,
];

const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const sampleText = await readFile(samplePath, "utf8");
const sample = JSON.parse(sampleText);

const failures = [];
const assert = (condition, message) => {
  if (!condition) {
    failures.push(message);
  }
};
const isIsoTimestamp = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
const isDigest = (value) => typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);
const isBasename = (value) => typeof value === "string" && /^[A-Za-z0-9._-]+$/.test(value);
const isRelativePath = (value) =>
  typeof value === "string" &&
  /^[A-Za-z0-9._/-]+$/.test(value) &&
  !value.startsWith("/") &&
  !/^[A-Za-z]:/.test(value) &&
  !value.includes("..") &&
  !value.includes("\\");

assert(schema.$schema === "https://json-schema.org/draft/2020-12/schema", "schema draft marker mismatch");
assert(schema.properties?.artifactType?.const === "BACKUP_ARTIFACT_LIST", "schema artifact type const missing");
assert(schema.properties?.version?.const === 2, "schema version const must be 2");

for (const pattern of forbiddenSamplePatterns) {
  assert(!pattern.test(sampleText), `sample contains forbidden marker ${pattern}`);
}

assert(sample.artifactType === "BACKUP_ARTIFACT_LIST", "sample artifactType mismatch");
assert(sample.version === 2, "sample version mismatch");
assert(isIsoTimestamp(sample.createdAt), "sample createdAt is not an ISO timestamp");
assert(sample.backupSet && typeof sample.backupSet === "object", "backupSet object missing");
assert(/^local-backup-set-[0-9]{8}T[0-9]{6}Z-[a-z0-9-]+$/.test(sample.backupSet.id), "backupSet id shape mismatch");
assert(isIsoTimestamp(sample.backupSet.timestamp), "backupSet timestamp is not an ISO timestamp");
assert(allowedEnvironmentLabels.has(sample.backupSet.environmentLabel), "environment label is not local");
assert(allowedScopes.has(sample.backupSet.scope), "backupSet scope is not local");
assert(sample.backupSet.productionReadinessClaim === false, "sample must not claim production readiness");
assert(sample.backupSet.generatedBy?.schemaVersion === 2, "backupSet generatedBy schemaVersion mismatch");
assert(typeof sample.backupSet.localOnlyNotice === "string", "localOnlyNotice missing");

assert(Array.isArray(sample.artifacts), "artifacts must be an array");
const artifactsByType = new Map(sample.artifacts?.map((artifact) => [artifact.type, artifact]) ?? []);
for (const category of requiredCategories) {
  assert(artifactsByType.has(category), `missing required artifact category ${category}`);
}
assert(artifactsByType.size === sample.artifacts.length, "artifact types must be unique in the sample");

for (const artifact of sample.artifacts ?? []) {
  assert(requiredCategories.includes(artifact.type), `unexpected artifact category ${artifact.type}`);
  assert(isBasename(artifact.basename), `invalid basename for ${artifact.type}`);
  assert(isRelativePath(artifact.relativePath), `invalid relativePath for ${artifact.type}`);
  assert(Number.isInteger(artifact.bytes) && artifact.bytes > 0, `invalid byte count for ${artifact.type}`);
  assert(isDigest(artifact.digest), `invalid digest for ${artifact.type}`);
  assert(artifact.requiredForCompleteSet === true, `${artifact.type} must be required for complete set`);
  assert(isIsoTimestamp(artifact.createdAt), `invalid createdAt for ${artifact.type}`);
  assert(artifact.generatedBy?.schemaVersion === 2, `generatedBy schemaVersion mismatch for ${artifact.type}`);
}

const dbDump = artifactsByType.get("POSTGRES_DUMP");
assert(dbDump?.format === "postgres-custom-format", "DB dump format mismatch");
assert(["NOT_RUN", "PASS", "WARNING", "FAILED"].includes(dbDump?.restoreListStatus), "DB dump restoreListStatus mismatch");
assert(dbDump?.credentialExposure === "NOT_RECORDED", "DB dump credential exposure must be NOT_RECORDED");

const attachmentArchive = artifactsByType.get("ATTACHMENT_BINARY_ARCHIVE");
assert(Array.isArray(attachmentArchive?.supportedRelationTypes), "attachment supportedRelationTypes missing");
assert(attachmentArchive?.supportedRelationTypes?.includes("ACHIEVEMENT"), "ACHIEVEMENT relation support missing");
assert(attachmentArchive?.supportedRelationTypes?.includes("FEE_RECORD"), "FEE_RECORD relation support missing");
assert(isBasename(attachmentArchive?.manifestBasename), "attachment manifest basename invalid");
assert(Number.isInteger(attachmentArchive?.manifestVersion), "attachment manifest version invalid");
assert(
  allowedConsistencyStatuses.has(attachmentArchive?.manifestConsistencyStatus),
  "attachment manifest consistency status invalid",
);
const counts = attachmentArchive?.aggregateCounts;
assert(counts && typeof counts === "object", "attachment aggregate counts missing");
assert(Number.isInteger(counts?.fileCount) && counts.fileCount >= 0, "fileCount invalid");
assert(Number.isInteger(counts?.totalBytes) && counts.totalBytes >= 0, "totalBytes invalid");
assert(Number.isInteger(counts?.relationTypeCounts?.ACHIEVEMENT), "ACHIEVEMENT count invalid");
assert(Number.isInteger(counts?.relationTypeCounts?.FEE_RECORD), "FEE_RECORD count invalid");
assert(Number.isInteger(counts?.missingBinaryCount), "missingBinaryCount invalid");
assert(Number.isInteger(counts?.extraBinaryCount), "extraBinaryCount invalid");
assert(Number.isInteger(counts?.unsupportedRelationCount), "unsupportedRelationCount invalid");

const attachmentManifest = artifactsByType.get("ATTACHMENT_BACKUP_MANIFEST");
assert(attachmentManifest?.manifestVersion === attachmentArchive?.manifestVersion, "manifest version mismatch");
assert(attachmentManifest?.consistencyStatus === attachmentArchive?.manifestConsistencyStatus, "manifest status mismatch");
assert(Array.isArray(attachmentManifest?.issueSummary), "manifest issueSummary must be aggregate array");

assert(sample.readiness?.retention?.cleanupAllowed === false, "cleanup must not be allowed");
assert(allowedEnvironmentLabels.has(sample.readiness?.retention?.class), "retention class invalid");
assert(allowedEncryptionStatuses.has(sample.readiness?.encryption?.status), "encryption status invalid");
assert(sample.readiness?.offsite?.status === "NOT_UPLOADED_LOCAL_ONLY", "offsite status must be local-only");
assert(sample.readiness?.offsite?.targetAlias === "NONE", "offsite target alias must be NONE");
assert(allowedRestoreStatuses.has(sample.readiness?.restoreReadiness?.status), "restore readiness status invalid");
assert(allowedScopes.has(sample.readiness?.restoreReadiness?.scope), "restore readiness scope invalid");

const evidence = sample.redactedEvidence;
assert(evidence?.backupSetId === sample.backupSet.id, "redacted evidence backupSetId mismatch");
assert(evidence?.retentionClass === sample.readiness.retention.class, "redacted evidence retention class mismatch");
assert(evidence?.encryptionStatus === sample.readiness.encryption.status, "redacted evidence encryption status mismatch");
assert(evidence?.offsiteStatus === sample.readiness.offsite.status, "redacted evidence offsite status mismatch");
assert(evidence?.restoreReadinessStatus === sample.readiness.restoreReadiness.status, "redacted evidence restore status mismatch");
assert(evidence?.manifestStatus === attachmentManifest.consistencyStatus, "redacted evidence manifest status mismatch");
assert(Array.isArray(evidence?.artifactBasenames), "redacted evidence artifact basenames missing");
assert(Array.isArray(evidence?.artifactCategories), "redacted evidence artifact categories missing");
for (const artifact of sample.artifacts) {
  assert(evidence.artifactBasenames.includes(artifact.basename), `redacted evidence missing basename ${artifact.basename}`);
  assert(evidence.artifactCategories.includes(artifact.type), `redacted evidence missing category ${artifact.type}`);
  assert(evidence.byteCounts?.[artifact.basename] === artifact.bytes, `redacted evidence byte count mismatch for ${artifact.basename}`);
}

if (failures.length > 0) {
  console.error(`Local backup artifact-list sample validation FAILED (${failures.length})`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Local backup artifact-list sample validation PASS");
console.log(`Validated required categories: ${requiredCategories.join(", ")}`);
