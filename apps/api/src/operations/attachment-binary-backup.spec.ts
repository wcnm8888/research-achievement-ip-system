import { describe, expect, it } from "vitest";
import { AttachmentRelationTypeCode } from "../attachments/domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "../attachments/domain/attachment-status-code";
import {
  AttachmentBackupArtifactType,
  AttachmentBackupRecord,
  AttachmentBackupStorage,
  buildAttachmentBinaryBackup,
} from "./attachment-binary-backup";

describe("attachment binary backup", () => {
  it("builds an attachment archive, manifest, and artifact list without exposing storage internals", async () => {
    const result = await buildAttachmentBinaryBackup({
      attachments: [
        makeAttachment({
          id: "10000000-0000-4000-8000-000000000001",
          relationType: AttachmentRelationTypeCode.achievement,
          storageKey: "attachments/ACHIEVEMENT/achievement-id/raw-key/v1/paper.pdf",
        }),
        makeAttachment({
          id: "20000000-0000-4000-8000-000000000002",
          relationType: AttachmentRelationTypeCode.feeRecord,
          storageKey: "attachments/FEE_RECORD/fee-id/raw-key/v1/voucher.pdf",
        }),
        makeAttachment({
          id: "30000000-0000-4000-8000-000000000003",
          relationType: AttachmentRelationTypeCode.workflowAction,
          storageKey: "attachments/WORKFLOW_ACTION/action-id/raw-key/v1/action.pdf",
        }),
      ],
      storage: makeMemoryStorage({
        "attachments/ACHIEVEMENT/achievement-id/raw-key/v1/paper.pdf": "PDF_CONTENT_SHOULD_NOT_APPEAR",
        "attachments/FEE_RECORD/fee-id/raw-key/v1/voucher.pdf": "VOUCHER_CONTENT_SHOULD_NOT_APPEAR",
        "attachments/WORKFLOW_ACTION/action-id/raw-key/v1/action.pdf": "UNSUPPORTED_CONTENT",
        "attachments/ACHIEVEMENT/orphan/raw-key/v1/orphan.pdf": "ORPHAN_CONTENT",
      }),
      createdAt: new Date("2026-07-01T08:00:00.000Z"),
      archiveBasename: "step62b",
      existingArtifacts: [
        {
          type: AttachmentBackupArtifactType.postgresDump,
          basename: "existing-db.dump",
          bytes: 128,
          digest: "sha256:db-dump-digest",
        },
      ],
    });

    expect(result.manifest.counts).toEqual({
      fileCount: 2,
      totalBytes: Buffer.byteLength("PDF_CONTENT_SHOULD_NOT_APPEAR") +
        Buffer.byteLength("VOUCHER_CONTENT_SHOULD_NOT_APPEAR"),
      relationTypeCounts: {
        ACHIEVEMENT: 1,
        FEE_RECORD: 1,
      },
      missingBinaryCount: 0,
      extraBinaryCount: 1,
      unsupportedRelationCount: 1,
    });
    expect(result.manifest.consistency.status).toBe("WARNING");
    expect(result.artifactList.artifacts.map((artifact) => artifact.type)).toEqual([
      AttachmentBackupArtifactType.postgresDump,
      AttachmentBackupArtifactType.attachmentBinaryArchive,
      AttachmentBackupArtifactType.attachmentBackupManifest,
    ]);

    const manifestText = result.manifestBody.toString("utf8");
    const artifactListText = result.artifactListBody.toString("utf8");
    expect(manifestText).not.toContain("storageKey");
    expect(manifestText).not.toContain("raw-key");
    expect(manifestText).not.toContain("PDF_CONTENT_SHOULD_NOT_APPEAR");
    expect(manifestText).not.toContain("VOUCHER_CONTENT_SHOULD_NOT_APPEAR");
    expect(manifestText).not.toContain("checksum");
    expect(manifestText).not.toContain("voucherNo");
    expect(manifestText).not.toContain("amount");
    expect(artifactListText).not.toContain("storageKey");
    expect(artifactListText).not.toContain("raw-key");
    expect(artifactListText).not.toContain("PDF_CONTENT_SHOULD_NOT_APPEAR");
    expect(artifactListText).not.toContain("VOUCHER_CONTENT_SHOULD_NOT_APPEAR");
    expect(artifactListText).not.toContain("checksum");
    expect(artifactListText).not.toContain("voucherNo");
    expect(artifactListText).not.toContain("amount");
  });

  it("marks the manifest failed when metadata references a missing binary", async () => {
    const result = await buildAttachmentBinaryBackup({
      attachments: [
        makeAttachment({
          id: "10000000-0000-4000-8000-000000000001",
          relationType: AttachmentRelationTypeCode.achievement,
          storageKey: "attachments/ACHIEVEMENT/achievement-id/raw-key/v1/paper.pdf",
        }),
        makeAttachment({
          id: "20000000-0000-4000-8000-000000000002",
          relationType: AttachmentRelationTypeCode.feeRecord,
          storageKey: "attachments/FEE_RECORD/fee-id/raw-key/v1/voucher.pdf",
        }),
      ],
      storage: makeMemoryStorage({
        "attachments/ACHIEVEMENT/achievement-id/raw-key/v1/paper.pdf": "PDF_BYTES",
      }),
      createdAt: new Date("2026-07-01T08:00:00.000Z"),
      archiveBasename: "step62b-missing",
    });

    expect(result.manifest.counts.fileCount).toBe(1);
    expect(result.manifest.counts.missingBinaryCount).toBe(1);
    expect(result.manifest.counts.extraBinaryCount).toBe(0);
    expect(result.manifest.consistency).toEqual({
      status: "FAILED",
      issueSummary: [{ code: "MISSING_BINARY", count: 1 }],
    });

    const manifestText = result.manifestBody.toString("utf8");
    expect(manifestText).not.toContain("raw-key");
    expect(manifestText).not.toContain("voucher.pdf");
  });
});

const makeAttachment = (
  overrides: Pick<AttachmentBackupRecord, "id" | "relationType" | "storageKey">,
): AttachmentBackupRecord => ({
  ...overrides,
  sizeBytes: null,
  status: AttachmentStatusCode.active,
});

const makeMemoryStorage = (objects: Record<string, string>): AttachmentBackupStorage => ({
  async statObject(storageKey) {
    const body = objects[storageKey];
    return {
      exists: body !== undefined,
      sizeBytes: body === undefined ? null : Buffer.byteLength(body),
    };
  },
  async readObject(storageKey) {
    const body = objects[storageKey];
    return body === undefined ? null : Buffer.from(body);
  },
  async listObjectKeys() {
    return Object.keys(objects);
  },
});
