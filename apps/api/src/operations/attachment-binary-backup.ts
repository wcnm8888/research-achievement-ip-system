import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { AttachmentRelationTypeCode } from "../attachments/domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "../attachments/domain/attachment-status-code";
import {
  LocalAttachmentStorageAdapter,
  localAttachmentStorageRoot,
} from "../attachments/storage/local-attachment-storage.adapter";

export const AttachmentBackupArtifactType = {
  postgresDump: "POSTGRES_DUMP",
  attachmentBinaryArchive: "ATTACHMENT_BINARY_ARCHIVE",
  attachmentBackupManifest: "ATTACHMENT_BACKUP_MANIFEST",
  backupArtifactList: "BACKUP_ARTIFACT_LIST",
} as const;

type AttachmentBackupArtifactType =
  (typeof AttachmentBackupArtifactType)[keyof typeof AttachmentBackupArtifactType];

const archiveMagic = "RESEARCH_IP_ATTACHMENT_BINARY_ARCHIVE_V1";
const manifestVersion = 1;
const supportedRelationTypes = [
  AttachmentRelationTypeCode.achievement,
  AttachmentRelationTypeCode.feeRecord,
] as const;

export type SupportedAttachmentBackupRelationType =
  (typeof supportedRelationTypes)[number];

export type AttachmentBackupRecord = {
  id: string;
  relationType: AttachmentRelationTypeCode;
  storageKey: string;
  sizeBytes: number | null;
  status: AttachmentStatusCode;
};

export type AttachmentBackupStorage = {
  statObject: (storageKey: string) => Promise<{ exists: boolean; sizeBytes: number | null }>;
  readObject: (storageKey: string) => Promise<Uint8Array | null>;
  listObjectKeys: () => Promise<string[]>;
};

export type ExistingBackupArtifactInput = {
  type: typeof AttachmentBackupArtifactType.postgresDump;
  basename: string;
  bytes: number;
  digest: string;
};

export type AttachmentBackupManifest = {
  artifactType: typeof AttachmentBackupArtifactType.attachmentBackupManifest;
  version: number;
  createdAt: string;
  supportedRelationTypes: SupportedAttachmentBackupRelationType[];
  attachmentArchive: {
    artifactType: typeof AttachmentBackupArtifactType.attachmentBinaryArchive;
    basename: string;
    bytes: number;
    digest: string;
  };
  counts: {
    fileCount: number;
    totalBytes: number;
    relationTypeCounts: Record<SupportedAttachmentBackupRelationType, number>;
    missingBinaryCount: number;
    extraBinaryCount: number;
    unsupportedRelationCount: number;
  };
  consistency: {
    status: "PASS" | "WARNING" | "FAILED";
    issueSummary: Array<{ code: "MISSING_BINARY" | "EXTRA_BINARY"; count: number }>;
  };
};

export type BackupArtifactList = {
  artifactType: typeof AttachmentBackupArtifactType.backupArtifactList;
  version: number;
  createdAt: string;
  artifacts: Array<{
    type: AttachmentBackupArtifactType;
    basename: string;
    bytes: number;
    digest: string;
  }>;
};

export type BuildAttachmentBinaryBackupInput = {
  attachments: AttachmentBackupRecord[];
  storage: AttachmentBackupStorage;
  createdAt?: Date;
  archiveBasename?: string;
  manifestBasename?: string;
  artifactListBasename?: string;
  existingArtifacts?: ExistingBackupArtifactInput[];
};

export type BuildAttachmentBinaryBackupResult = {
  archiveBody: Buffer;
  manifestBody: Buffer;
  artifactListBody: Buffer;
  manifest: AttachmentBackupManifest;
  artifactList: BackupArtifactList;
};

export async function buildAttachmentBinaryBackup(
  input: BuildAttachmentBinaryBackupInput,
): Promise<BuildAttachmentBinaryBackupResult> {
  const createdAt = (input.createdAt ?? new Date()).toISOString();
  const basename = input.archiveBasename ?? defaultBackupBasename(input.createdAt ?? new Date());
  const archiveBasename = ensureExtension(basename, ".attachment-archive.bin");
  const manifestBasename = input.manifestBasename ?? `${basename}.attachment-manifest.json`;
  const relationTypeCounts = makeEmptyRelationTypeCounts();
  const allReferencedKeys = new Set(input.attachments.map((attachment) => attachment.storageKey));
  const archiveChunks: Buffer[] = [Buffer.from(`${archiveMagic}\n`, "utf8")];
  let fileCount = 0;
  let totalBytes = 0;
  let missingBinaryCount = 0;
  let unsupportedRelationCount = 0;

  for (const attachment of input.attachments) {
    if (!isSupportedRelationType(attachment.relationType)) {
      unsupportedRelationCount += 1;
      continue;
    }

    relationTypeCounts[attachment.relationType] += 1;

    const objectStat = await input.storage.statObject(attachment.storageKey);
    if (!objectStat.exists) {
      missingBinaryCount += 1;
      continue;
    }

    const body = await input.storage.readObject(attachment.storageKey);
    if (!body) {
      missingBinaryCount += 1;
      continue;
    }

    const bodyBuffer = Buffer.from(body);
    const archiveEntryHeader = {
      entryType: "ATTACHMENT_BINARY",
      attachmentId: attachment.id,
      relationType: attachment.relationType,
      status: attachment.status,
      byteLength: bodyBuffer.byteLength,
    };

    archiveChunks.push(Buffer.from(`${JSON.stringify(archiveEntryHeader)}\n`, "utf8"));
    archiveChunks.push(bodyBuffer);
    archiveChunks.push(Buffer.from("\n", "utf8"));
    fileCount += 1;
    totalBytes += bodyBuffer.byteLength;
  }

  const storageKeys = await input.storage.listObjectKeys();
  const extraBinaryCount = storageKeys.filter((storageKey) => !allReferencedKeys.has(storageKey)).length;
  const archiveBody = Buffer.concat(archiveChunks);
  const archiveDigest = digestBuffer(archiveBody);
  const issueSummary = buildIssueSummary(missingBinaryCount, extraBinaryCount);
  const manifest: AttachmentBackupManifest = {
    artifactType: AttachmentBackupArtifactType.attachmentBackupManifest,
    version: manifestVersion,
    createdAt,
    supportedRelationTypes: [...supportedRelationTypes],
    attachmentArchive: {
      artifactType: AttachmentBackupArtifactType.attachmentBinaryArchive,
      basename: archiveBasename,
      bytes: archiveBody.byteLength,
      digest: archiveDigest,
    },
    counts: {
      fileCount,
      totalBytes,
      relationTypeCounts,
      missingBinaryCount,
      extraBinaryCount,
      unsupportedRelationCount,
    },
    consistency: {
      status: missingBinaryCount > 0 ? "FAILED" : extraBinaryCount > 0 ? "WARNING" : "PASS",
      issueSummary,
    },
  };
  const manifestBody = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const manifestDigest = digestBuffer(manifestBody);
  const artifactList: BackupArtifactList = {
    artifactType: AttachmentBackupArtifactType.backupArtifactList,
    version: manifestVersion,
    createdAt,
    artifacts: [
      ...(input.existingArtifacts ?? []),
      {
        type: AttachmentBackupArtifactType.attachmentBinaryArchive,
        basename: archiveBasename,
        bytes: archiveBody.byteLength,
        digest: archiveDigest,
      },
      {
        type: AttachmentBackupArtifactType.attachmentBackupManifest,
        basename: manifestBasename,
        bytes: manifestBody.byteLength,
        digest: manifestDigest,
      },
    ],
  };
  const artifactListBody = Buffer.from(`${JSON.stringify(artifactList, null, 2)}\n`, "utf8");

  return {
    archiveBody,
    manifestBody,
    artifactListBody,
    manifest,
    artifactList,
  };
}

export type WriteAttachmentBinaryBackupInput = BuildAttachmentBinaryBackupInput & {
  outputDirectory: string;
};

export type WriteAttachmentBinaryBackupResult = BuildAttachmentBinaryBackupResult & {
  archivePath: string;
  manifestPath: string;
  artifactListPath: string;
};

export async function writeAttachmentBinaryBackupArtifacts(
  input: WriteAttachmentBinaryBackupInput,
): Promise<WriteAttachmentBinaryBackupResult> {
  const result = await buildAttachmentBinaryBackup(input);
  const basename = input.archiveBasename ?? defaultBackupBasename(input.createdAt ?? new Date());
  const archiveBasename = ensureExtension(basename, ".attachment-archive.bin");
  const manifestBasename = input.manifestBasename ?? `${basename}.attachment-manifest.json`;
  const artifactListBasename =
    input.artifactListBasename ?? `${basename}.artifact-list.json`;
  const outputDirectory = path.resolve(input.outputDirectory);
  const archivePath = path.join(outputDirectory, archiveBasename);
  const manifestPath = path.join(outputDirectory, manifestBasename);
  const artifactListPath = path.join(outputDirectory, artifactListBasename);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(archivePath, result.archiveBody);
  await writeFile(manifestPath, result.manifestBody);
  await writeFile(artifactListPath, result.artifactListBody);

  return {
    ...result,
    archivePath,
    manifestPath,
    artifactListPath,
  };
}

export class LocalAttachmentBackupStorage implements AttachmentBackupStorage {
  private readonly adapter: LocalAttachmentStorageAdapter;

  constructor(private readonly storageRoot: string = localAttachmentStorageRoot) {
    this.adapter = new LocalAttachmentStorageAdapter(storageRoot);
  }

  async statObject(storageKey: string): Promise<{ exists: boolean; sizeBytes: number | null }> {
    const result = await this.adapter.statObject({ objectKey: storageKey });
    return {
      exists: result.exists,
      sizeBytes: result.sizeBytes ?? null,
    };
  }

  async readObject(storageKey: string): Promise<Uint8Array | null> {
    const result = await this.adapter.getObject({ objectKey: storageKey });
    return result.body;
  }

  async listObjectKeys(): Promise<string[]> {
    return listFilesUnderRoot(this.storageRoot);
  }
}

async function loadAttachmentBackupRecords(prisma: PrismaClient): Promise<AttachmentBackupRecord[]> {
  const rows = await prisma.attachment.findMany({
    select: {
      id: true,
      relationType: true,
      storageKey: true,
      sizeBytes: true,
      status: true,
    },
    orderBy: [{ relationType: "asc" }, { id: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    relationType: row.relationType as AttachmentRelationTypeCode,
    storageKey: row.storageKey,
    sizeBytes: row.sizeBytes,
    status: row.status as AttachmentStatusCode,
  }));
}

async function runCli(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    const attachments = await loadAttachmentBackupRecords(prisma);
    const createdAt = new Date();
    const basename = options.basename ?? defaultBackupBasename(createdAt);
    const existingArtifacts = options.dbDumpPath
      ? [await toExistingPostgresDumpArtifact(options.dbDumpPath)]
      : [];
    const result = await writeAttachmentBinaryBackupArtifacts({
      attachments,
      storage: new LocalAttachmentBackupStorage(options.storageRoot),
      outputDirectory: options.outputDirectory,
      createdAt,
      archiveBasename: basename,
      existingArtifacts,
    });

    process.stdout.write(`${JSON.stringify(toSafeCliSummary(result), null, 2)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

type CliOptions = {
  outputDirectory: string;
  storageRoot: string;
  basename?: string;
  dbDumpPath?: string;
};

function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    outputDirectory: path.resolve("deploy", "artifacts", "local-backups"),
    storageRoot: localAttachmentStorageRoot,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--output-dir" && next) {
      options.outputDirectory = path.resolve(next);
      index += 1;
    } else if (arg === "--storage-root" && next) {
      options.storageRoot = path.resolve(next);
      index += 1;
    } else if (arg === "--basename" && next) {
      options.basename = next;
      index += 1;
    } else if (arg === "--db-dump" && next) {
      options.dbDumpPath = path.resolve(next);
      index += 1;
    } else if (arg === "--help") {
      process.stdout.write(
        [
          "Usage: pnpm --filter @research-ip/api ops:backup:attachments [options]",
          "",
          "Options:",
          "  --output-dir <path>    Directory for local backup artifacts",
          "  --storage-root <path>  Local attachment storage root",
          "  --basename <name>      Artifact basename",
          "  --db-dump <path>       Existing Postgres dump artifact to list",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete option: ${arg ?? ""}`);
    }
  }

  return options;
}

async function toExistingPostgresDumpArtifact(
  artifactPath: string,
): Promise<ExistingBackupArtifactInput> {
  const fileStat = await stat(artifactPath);
  return {
    type: AttachmentBackupArtifactType.postgresDump,
    basename: path.basename(artifactPath),
    bytes: fileStat.size,
    digest: await digestFile(artifactPath),
  };
}

function toSafeCliSummary(result: WriteAttachmentBinaryBackupResult) {
  return {
    status: result.manifest.consistency.status,
    counts: result.manifest.counts,
    artifacts: result.artifactList.artifacts,
    output: {
      archive: path.basename(result.archivePath),
      manifest: path.basename(result.manifestPath),
      artifactList: path.basename(result.artifactListPath),
    },
  };
}

function makeEmptyRelationTypeCounts(): Record<SupportedAttachmentBackupRelationType, number> {
  return {
    [AttachmentRelationTypeCode.achievement]: 0,
    [AttachmentRelationTypeCode.feeRecord]: 0,
  };
}

function isSupportedRelationType(
  relationType: AttachmentRelationTypeCode,
): relationType is SupportedAttachmentBackupRelationType {
  return supportedRelationTypes.includes(relationType as SupportedAttachmentBackupRelationType);
}

function buildIssueSummary(
  missingBinaryCount: number,
  extraBinaryCount: number,
): AttachmentBackupManifest["consistency"]["issueSummary"] {
  const issues: AttachmentBackupManifest["consistency"]["issueSummary"] = [];

  if (missingBinaryCount > 0) {
    issues.push({ code: "MISSING_BINARY", count: missingBinaryCount });
  }

  if (extraBinaryCount > 0) {
    issues.push({ code: "EXTRA_BINARY", count: extraBinaryCount });
  }

  return issues;
}

function defaultBackupBasename(now: Date): string {
  return `research-achievement-local-attachments-${toTimestamp(now)}`;
}

function toTimestamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function ensureExtension(basename: string, extension: string): string {
  return basename.endsWith(extension) ? basename : `${basename}${extension}`;
}

function digestBuffer(body: Uint8Array): string {
  return `sha256:${createHash("sha256").update(body).digest("hex")}`;
}

function digestFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(`sha256:${hash.digest("hex")}`));
  });
}

async function listFilesUnderRoot(rootPath: string): Promise<string[]> {
  const root = path.resolve(rootPath);

  try {
    const rootStat = await stat(root);
    if (!rootStat.isDirectory()) {
      return [];
    }
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    throw error;
  }

  const keys: string[] = [];
  await collectFileKeys(root, root, keys);
  return keys.sort((left, right) => left.localeCompare(right));
}

async function collectFileKeys(root: string, current: string, keys: string[]): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(current, entry.name);

    if (entry.isDirectory()) {
      await collectFileKeys(root, entryPath, keys);
      continue;
    }

    if (entry.isFile()) {
      keys.push(path.relative(root, entryPath).replace(/\\/g, "/"));
    }
  }
}

function isMissingFileError(error: unknown): error is { code: "ENOENT" } {
  return Boolean(error && typeof error === "object" && (error as { code?: unknown }).code === "ENOENT");
}

if (require.main === module) {
  runCli().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Attachment backup failed."}\n`);
    process.exit(1);
  });
}
