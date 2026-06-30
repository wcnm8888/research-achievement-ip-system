import { describe, expect, it, vi } from "vitest";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { GrantStatusCode } from "../authorization/constants/grant-status-code";
import { GrantTypeCode } from "../authorization/constants/grant-type-code";
import { GranteeTypeCode } from "../authorization/constants/grantee-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { RoleCode } from "../authorization/constants/role-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { AttachmentAccessPolicyService } from "../authorization/policy/attachment-access-policy.service";
import { allowDecision, denyDecision } from "../authorization/policy/policy-decision";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { SecretAccessPolicyService } from "../authorization/policy/secret-access-policy.service";
import { UserContext } from "../identity/user-context";
import {
  AttachmentRepository,
  AttachmentTransactionClient,
} from "./attachment.repository";
import { AttachmentService } from "./attachment.service";
import {
  AttachmentAccessDeniedError,
  AttachmentNotFoundError,
  AttachmentUnsupportedRelationError,
  AttachmentVersionConflictError,
} from "./domain/attachment-errors";
import { AttachmentRelationTypeCode } from "./domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "./domain/attachment-status-code";
import { AttachmentStorageAdapter } from "./storage/attachment-storage.adapter";
import { PrismaService } from "../database/prisma.service";

const ids = {
  attachment: "70000000-0000-4000-8000-000000000001",
  achievement: "30000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  uploader: "40000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

const context: UserContext = {
  userId: ids.uploader,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [RoleCode.researcher],
  permissionCodes: [],
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
};

const now = new Date("2026-01-01T00:00:00.000Z");

const makeRecord = (overrides = {}) => ({
  id: ids.attachment,
  relationType: AttachmentRelationTypeCode.achievement,
  relationId: ids.achievement,
  fileName: "paper.pdf",
  objectKey:
    "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v4/paper.pdf",
  mimeType: "application/pdf",
  sizeBytes: 128,
  storageProvider: "LOCAL_DISK",
  originalName: "paper.pdf",
  storedName: "paper.pdf",
  version: 4,
  uploaderId: ids.uploader,
  secretLevel: SecretLevelCode.internal,
  checksum: "fake-digest",
  status: AttachmentStatusCode.active,
  createdAt: now,
  updatedAt: now,
  archivedAt: null,
  ...overrides,
});

const createService = () => {
  const repository = {
    create: vi.fn().mockResolvedValue(makeRecord()),
    createInTransaction: vi.fn().mockResolvedValue(makeRecord()),
    findLatestVersion: vi.fn().mockResolvedValue(3),
    findLatestVersionInTransaction: vi.fn().mockResolvedValue(3),
    findManyByRelation: vi.fn().mockResolvedValue([makeRecord()]),
    findById: vi.fn().mockResolvedValue(makeRecord()),
    findAchievementParentById: vi.fn().mockResolvedValue({
      id: ids.achievement,
      departmentId: ids.department,
      ownerUserId: ids.uploader,
      secretLevel: SecretLevelCode.internal,
    }),
    findAchievementParentByIdWhere: vi.fn().mockResolvedValue({
      id: ids.achievement,
      departmentId: ids.department,
      ownerUserId: ids.uploader,
      secretLevel: SecretLevelCode.internal,
    }),
    findFeeParentByIdWhere: vi.fn().mockResolvedValue({
      id: ids.feeRecord,
      departmentId: ids.department,
    }),
    findResourceGrantsForAchievementAndAttachment: vi.fn().mockResolvedValue([]),
    findResourceGrantsForFeeAndAttachment: vi.fn().mockResolvedValue([]),
    isPrismaUniqueConflict: vi.fn((error: unknown) => Boolean((error as { code?: string })?.code === "P2002")),
  } as unknown as AttachmentRepository;

  const accessPolicy = {
    canReadMetadata: vi.fn().mockReturnValue(allowDecision("allowed")),
    canDownload: vi.fn().mockReturnValue(allowDecision("download allowed")),
  } as unknown as AttachmentAccessPolicyService;

  const policyQueryFactory = {
    achievementReadableWhere: vi.fn().mockReturnValue({ id: ids.achievement }),
    achievementOwnedWhere: vi.fn().mockReturnValue({ ownerUserId: ids.uploader }),
    feeDepartmentWhere: vi.fn((_context, permission) => ({
      departmentId: { in: [ids.department] },
      permission,
    })),
  } as unknown as PolicyQueryFactory;

  const secretAccessPolicy = {
    canReadResource: vi.fn().mockReturnValue(allowDecision("secret allowed")),
  } as unknown as SecretAccessPolicyService;

  const rbacPolicy = {
    hasAnyPermission: vi.fn().mockReturnValue(allowDecision("fee visible")),
  } as unknown as RbacPolicyService;

  const storage = {
    putObject: vi.fn(async (input: {
      objectKey: string;
      checksum?: string | null;
      body?: string | Uint8Array | null;
      storedName?: string | null;
    }) => ({
      objectKey: input.objectKey,
      checksum: input.checksum ?? "fake-digest",
      storedName: input.storedName ?? input.objectKey.split("/").pop() ?? null,
      sizeBytes:
        typeof input.body === "string"
          ? Buffer.byteLength(input.body)
          : input.body?.byteLength ?? null,
    })),
    getObject: vi.fn(),
  } as unknown as AttachmentStorageAdapter;

  const tx = {
    attachment: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  } as unknown as PrismaService;

  const auditService = {
    recordEvent: vi.fn().mockResolvedValue({ id: "audit-log" }),
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-log" }),
  } as unknown as AuditService;

  const service = new AttachmentService(
    repository,
    accessPolicy,
    policyQueryFactory,
    secretAccessPolicy,
    rbacPolicy,
    prisma,
    auditService,
    storage,
  );

  return {
    service,
    repository,
    accessPolicy,
    policyQueryFactory,
    secretAccessPolicy,
    rbacPolicy,
    storage,
    prisma,
    auditService,
    tx,
  };
};

describe("AttachmentService.createMetadata", () => {
  it("calculates the next version, writes to fake storage, and returns public metadata only", async () => {
    const { service, repository, storage } = createService();

    const result = await service.createMetadata({
      relationId: ids.achievement,
      fileName: "paper.pdf",
      uploaderId: ids.uploader,
      secretLevel: SecretLevelCode.secret,
      checksum: "fake-digest",
      objectBody: "fake body",
    });

    expect(repository.findLatestVersion).toHaveBeenCalledWith({
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      fileName: "paper.pdf",
    });
    expect(storage.putObject).toHaveBeenCalledWith({
      objectKey: expect.stringMatching(
        /^attachments\/ACHIEVEMENT\/30000000-0000-4000-8000-000000000001\/[^/]+\/v4\/paper.pdf$/,
      ),
      body: "fake body",
      checksum: "fake-digest",
      mimeType: undefined,
      originalName: undefined,
      storedName: undefined,
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
        fileName: "paper.pdf",
        mimeType: null,
        sizeBytes: 9,
        storageProvider: "LOCAL_DISK",
        originalName: "paper.pdf",
        storedName: "paper.pdf",
        version: 4,
        uploaderId: ids.uploader,
        secretLevel: SecretLevelCode.secret,
        checksum: "fake-digest",
      }),
    );
    expect(result).toEqual({
      id: ids.attachment,
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      fileName: "paper.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128,
      storageProvider: "LOCAL_DISK",
      originalName: "paper.pdf",
      storedName: "paper.pdf",
      version: 4,
      uploaderId: ids.uploader,
      secretLevel: SecretLevelCode.internal,
      status: AttachmentStatusCode.active,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    });
    expect(result).not.toHaveProperty("objectKey");
    expect(result).not.toHaveProperty("checksum");
  });

  it("starts at version 1 when no previous metadata exists", async () => {
    const { service, repository } = createService();
    vi.mocked(repository.findLatestVersion).mockResolvedValueOnce(null);

    await service.createMetadata({
      relationId: ids.achievement,
      fileName: "first.pdf",
      uploaderId: ids.uploader,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "first.pdf",
        version: 1,
        secretLevel: SecretLevelCode.internal,
      }),
    );
  });

  it("can create metadata with a caller-provided transaction client", async () => {
    const { service, repository } = createService();
    const client = { attachment: { create: vi.fn(), findFirst: vi.fn() } } as unknown as AttachmentTransactionClient;

    await service.createMetadataInTransaction(client, {
      relationId: ids.achievement,
      fileName: "paper.pdf",
      uploaderId: ids.uploader,
    });

    expect(repository.findLatestVersionInTransaction).toHaveBeenCalledWith(client, {
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      fileName: "paper.pdf",
    });
    expect(repository.createInTransaction).toHaveBeenCalledWith(
      client,
      expect.objectContaining({
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
        fileName: "paper.pdf",
        version: 4,
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("maps unique create conflicts to attachment version conflicts", async () => {
    const { service, repository } = createService();
    vi.mocked(repository.create).mockRejectedValueOnce({ code: "P2002" });

    await expect(
      service.createMetadata({
        relationId: ids.achievement,
        fileName: "paper.pdf",
        uploaderId: ids.uploader,
      }),
    ).rejects.toBeInstanceOf(AttachmentVersionConflictError);
  });
});

describe("AttachmentService metadata access preparation", () => {
  const parentAccess = {
    context,
    parentResource: {
      resourceType: ResourceTypeCode.achievement,
      resourceId: ids.achievement,
      secretLevel: SecretLevelCode.internal,
      ownerUserId: ids.uploader,
    },
    parentAccessDecision: allowDecision("parent visible"),
    grants: [],
    now,
  };

  it("lists metadata through the attachment access policy", async () => {
    const { service, repository, accessPolicy } = createService();

    await expect(
      service.listMetadataForRelation({
        ...parentAccess,
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
      }),
    ).resolves.toHaveLength(1);

    expect(repository.findManyByRelation).toHaveBeenCalledWith({
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      status: AttachmentStatusCode.active,
      take: undefined,
    });
    expect(accessPolicy.canReadMetadata).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        id: ids.attachment,
        status: AttachmentStatusCode.active,
        secretLevel: SecretLevelCode.internal,
      }),
      parentAccess.parentResource,
      parentAccess.parentAccessDecision,
      [],
      now,
    );
  });

  it("filters metadata denied by the attachment access policy", async () => {
    const { service, accessPolicy } = createService();
    vi.mocked(accessPolicy.canReadMetadata).mockReturnValueOnce(
      denyDecision("not allowed"),
    );

    await expect(
      service.listMetadataForRelation({
        ...parentAccess,
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
      }),
    ).resolves.toEqual([]);
  });

  it("gets one metadata record for later access checks", async () => {
    const { service, repository } = createService();

    await expect(
      service.getMetadataForAccessCheck({
        ...parentAccess,
        attachmentId: ids.attachment,
      }),
    ).resolves.toEqual(expect.objectContaining({ id: ids.attachment }));

    expect(repository.findById).toHaveBeenCalledWith(ids.attachment);
  });

  it("rejects one-record metadata access when policy denies", async () => {
    const { service, accessPolicy } = createService();
    vi.mocked(accessPolicy.canReadMetadata).mockReturnValueOnce(
      denyDecision("not allowed"),
    );

    await expect(
      service.getMetadataForAccessCheck({
        ...parentAccess,
        attachmentId: ids.attachment,
      }),
    ).rejects.toBeInstanceOf(AttachmentAccessDeniedError);
  });

  it("keeps unsupported relations rejected", async () => {
    const { service } = createService();

    await expect(
      service.listMetadataForRelation({
        ...parentAccess,
        relationType: AttachmentRelationTypeCode.workflowAction,
        relationId: ids.achievement,
      }),
    ).rejects.toBeInstanceOf(AttachmentUnsupportedRelationError);
  });
});

describe("AttachmentService fee voucher boundary", () => {
  const feeRecord = () =>
    makeRecord({
      relationType: AttachmentRelationTypeCode.feeRecord,
      relationId: ids.feeRecord,
      objectKey:
        "attachments/FEE_RECORD/80000000-0000-4000-8000-000000000001/object/v4/voucher.pdf",
      fileName: "voucher.pdf",
      originalName: "voucher.pdf",
      storedName: "voucher.pdf",
    });

  it("uploads voucher metadata for a scoped fee record without leaking fee or storage internals to audit", async () => {
    const {
      service,
      repository,
      policyQueryFactory,
      storage,
      auditService,
      prisma,
      tx,
    } = createService();
    vi.mocked(repository.createInTransaction).mockResolvedValueOnce(feeRecord());

    await service.createFeeVoucherAttachmentForUser(context, ids.feeRecord, {
      fileName: "voucher.pdf",
      secretLevel: SecretLevelCode.internal,
      objectBody: "voucher body",
      checksum: "hidden-checksum",
      traceId: "trace-fee-voucher-upload",
    });

    expect(policyQueryFactory.feeDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.feeManageDepartment,
    );
    expect(repository.findFeeParentByIdWhere).toHaveBeenCalledWith(
      ids.feeRecord,
      expect.objectContaining({ permission: PermissionCode.feeManageDepartment }),
    );
    expect(vi.mocked(storage.putObject).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.$transaction).mock.invocationCallOrder[0]!,
    );
    expect(repository.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        relationType: AttachmentRelationTypeCode.feeRecord,
        relationId: ids.feeRecord,
        fileName: "voucher.pdf",
        storageProvider: "LOCAL_DISK",
        uploaderId: ids.uploader,
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.uploadAttachment,
        target: {
          type: AuditTargetTypeCode.attachment,
          id: ids.attachment,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
        traceId: "trace-fee-voucher-upload",
      }),
    );

    const serializedAudit = JSON.stringify(
      vi.mocked(auditService.recordEventInTransaction).mock.calls[0]![1],
    );
    expect(serializedAudit).toContain(ids.feeRecord);
    expect(serializedAudit).not.toMatch(
      /objectKey|storageKey|checksum|voucher body|hidden-checksum|amount|voucherNo|dueDate|paidDate|raw fee/i,
    );
  });

  it("lists and gets scoped fee voucher metadata for a read-only finance reviewer", async () => {
    const { service, repository, rbacPolicy, accessPolicy } = createService();
    vi.mocked(repository.findManyByRelation).mockResolvedValueOnce([feeRecord()]);
    vi.mocked(repository.findById).mockResolvedValueOnce(feeRecord());

    await expect(
      service.listFeeVoucherMetadata(context, ids.feeRecord, { take: 10 }),
    ).resolves.toHaveLength(1);
    await expect(
      service.getFeeVoucherAttachmentMetadata(context, ids.feeRecord, ids.attachment),
    ).resolves.toEqual(expect.objectContaining({
      relationType: AttachmentRelationTypeCode.feeRecord,
      relationId: ids.feeRecord,
    }));

    expect(rbacPolicy.hasAnyPermission).toHaveBeenCalledWith(context, [
      PermissionCode.feeReadDepartment,
      PermissionCode.feeManageDepartment,
      PermissionCode.feeReviewDepartment,
    ]);
    expect(repository.findManyByRelation).toHaveBeenCalledWith({
      relationType: AttachmentRelationTypeCode.feeRecord,
      relationId: ids.feeRecord,
      status: AttachmentStatusCode.active,
      take: 10,
    });
    expect(accessPolicy.canReadMetadata).toHaveBeenCalled();
  });

  it("rejects fee voucher metadata when the fee record is outside department scope", async () => {
    const { service, repository } = createService();
    vi.mocked(repository.findFeeParentByIdWhere).mockResolvedValueOnce(null);

    await expect(
      service.listFeeVoucherMetadata(context, ids.feeRecord),
    ).rejects.toBeInstanceOf(AttachmentNotFoundError);
  });

  it("keeps fee voucher download behind the attachment download policy", async () => {
    const { service, repository, accessPolicy, storage, auditService } = createService();
    vi.mocked(repository.findById).mockResolvedValueOnce(feeRecord());
    vi.mocked(accessPolicy.canDownload).mockReturnValueOnce(denyDecision("no download"));

    await expect(
      service.downloadFeeVoucherAttachment(context, ids.feeRecord, ids.attachment),
    ).rejects.toBeInstanceOf(AttachmentAccessDeniedError);
    expect(storage.getObject).not.toHaveBeenCalled();
    expect(auditService.recordEvent).not.toHaveBeenCalled();
  });

  it("downloads fee voucher content and audits only safe metadata", async () => {
    const { service, repository, storage, auditService } = createService();
    vi.mocked(repository.findById).mockResolvedValueOnce(feeRecord());
    vi.mocked(storage.getObject).mockResolvedValueOnce({
      objectKey: "internal-fee-voucher-object",
      body: Buffer.from("download body"),
      checksum: "hidden",
      sizeBytes: 13,
    });

    await expect(
      service.downloadFeeVoucherAttachment(context, ids.feeRecord, ids.attachment),
    ).resolves.toEqual({
      id: ids.attachment,
      fileName: "voucher.pdf",
      version: 4,
      mimeType: "application/pdf",
      sizeBytes: 128,
      body: Buffer.from("download body"),
    });

    const serializedAudit = JSON.stringify(
      vi.mocked(auditService.recordEvent).mock.calls[0]![0],
    );
    expect(serializedAudit).toContain(ids.feeRecord);
    expect(serializedAudit).not.toMatch(
      /objectKey|storageKey|checksum|download body|internal-fee-voucher-object|hidden|amount|voucherNo|dueDate|paidDate|raw fee/i,
    );
  });
});

describe("AttachmentService achievement HTTP boundary preparation", () => {
  const makeGrant = () => ({
    resourceType: ResourceTypeCode.attachment,
    resourceId: ids.attachment,
    granteeType: GranteeTypeCode.user,
    granteeId: ids.uploader,
    grantType: GrantTypeCode.attachmentDownload,
    status: GrantStatusCode.active,
    startsAt: null,
    expiresAt: null,
    revokedAt: null,
  });

  it("uploads for the current user after checking writable parent access", async () => {
    const {
      service,
      repository,
      policyQueryFactory,
      secretAccessPolicy,
      storage,
      auditService,
      prisma,
      tx,
    } = createService();

    await service.createAchievementAttachmentForUser(context, ids.achievement, {
      fileName: "appendix.pdf",
      secretLevel: SecretLevelCode.internal,
      objectBody: "fake body",
      checksum: "hidden-checksum",
      traceId: "trace-attachment-upload",
    });

    expect(policyQueryFactory.achievementOwnedWhere).toHaveBeenCalledWith(
      context,
      "achievement:update_own",
    );
    expect(repository.findAchievementParentByIdWhere).toHaveBeenCalledWith(
      ids.achievement,
      { ownerUserId: ids.uploader },
    );
    expect(secretAccessPolicy.canReadResource).toHaveBeenCalled();
    expect(vi.mocked(storage.putObject).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.$transaction).mock.invocationCallOrder[0]!,
    );
    expect(repository.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        relationId: ids.achievement,
        fileName: "appendix.pdf",
        mimeType: null,
        sizeBytes: 9,
        storageProvider: "LOCAL_DISK",
        originalName: "appendix.pdf",
        storedName: "appendix.pdf",
        uploaderId: ids.uploader,
      }),
    );
    expect(repository.create).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.uploadAttachment,
        target: {
          type: AuditTargetTypeCode.attachment,
          id: ids.attachment,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
        traceId: "trace-attachment-upload",
      }),
    );
    expect(JSON.stringify(vi.mocked(auditService.recordEventInTransaction).mock.calls[0]![1]))
      .not.toMatch(/objectKey|checksum|body|download body|hidden-checksum/);
  });

  it("rejects upload when audit write fails in the metadata transaction", async () => {
    const { service, repository, auditService } = createService();
    const auditError = new Error("audit failed");
    vi.mocked(auditService.recordEventInTransaction).mockRejectedValueOnce(auditError);

    await expect(
      service.createAchievementAttachmentForUser(context, ids.achievement, {
        fileName: "appendix.pdf",
        objectBody: "fake body",
      }),
    ).rejects.toThrow(auditError);

    expect(repository.createInTransaction).toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalled();
  });

  it("does not write metadata or audit when upload storage fails", async () => {
    const { service, repository, storage, auditService } = createService();
    vi.mocked(storage.putObject).mockRejectedValueOnce(new Error("storage failed"));

    await expect(
      service.createAchievementAttachmentForUser(context, ids.achievement, {
        fileName: "appendix.pdf",
        objectBody: "fake body",
      }),
    ).rejects.toThrow("storage failed");

    expect(repository.createInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("lists achievement metadata only after parent read and secret checks", async () => {
    const { service, repository, policyQueryFactory, secretAccessPolicy } = createService();

    await expect(
      service.listAchievementMetadata(context, ids.achievement, { take: 10 }),
    ).resolves.toHaveLength(1);

    expect(policyQueryFactory.achievementReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.findAchievementParentByIdWhere).toHaveBeenCalledWith(
      ids.achievement,
      { id: ids.achievement },
    );
    expect(secretAccessPolicy.canReadResource).toHaveBeenCalled();
    expect(repository.findManyByRelation).toHaveBeenCalledWith({
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      status: AttachmentStatusCode.active,
      take: 10,
    });
  });

  it("rejects list access when parent achievement secret policy denies", async () => {
    const { service, secretAccessPolicy, repository } = createService();
    vi.mocked(secretAccessPolicy.canReadResource).mockReturnValueOnce(
      denyDecision("secret denied"),
    );

    await expect(
      service.listAchievementMetadata(context, ids.achievement),
    ).rejects.toBeInstanceOf(AttachmentAccessDeniedError);
    expect(repository.findManyByRelation).not.toHaveBeenCalled();
  });

  it("rejects detail when the attachment does not belong to the path achievement", async () => {
    const { service, repository } = createService();
    vi.mocked(repository.findById).mockResolvedValueOnce(
      makeRecord({ relationId: "30000000-0000-4000-8000-000000000099" }),
    );

    await expect(
      service.getAchievementAttachmentMetadata(context, ids.achievement, ids.attachment),
    ).rejects.toBeInstanceOf(AttachmentNotFoundError);
  });

  it("allows a direct download grant without exposing parent achievement detail", async () => {
    const { service, repository, accessPolicy, storage, auditService } = createService();
    vi.mocked(repository.findAchievementParentByIdWhere).mockResolvedValueOnce(null);
    vi.mocked(repository.findResourceGrantsForAchievementAndAttachment).mockResolvedValueOnce([
      makeGrant(),
    ]);
    vi.mocked(accessPolicy.canDownload).mockImplementationOnce(
      (_context, _attachment, _parent, parentAccessDecision, grants) => {
        expect(parentAccessDecision.effect).toBe("DENY");
        expect(grants).toEqual([makeGrant()]);
        return allowDecision("direct grant");
      },
    );
    vi.mocked(storage.getObject).mockResolvedValueOnce({
      objectKey: "internal-only",
      body: Buffer.from("download body"),
      checksum: "hidden",
      sizeBytes: 13,
    });

    await expect(
      service.downloadAchievementAttachment(context, ids.achievement, ids.attachment),
    ).resolves.toEqual({
      id: ids.attachment,
      fileName: "paper.pdf",
      version: 4,
      mimeType: "application/pdf",
      sizeBytes: 128,
      body: Buffer.from("download body"),
    });
    expect(auditService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditActionCode.downloadAttachment,
        target: {
          type: AuditTargetTypeCode.attachment,
          id: ids.attachment,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
      }),
    );
    expect(JSON.stringify(vi.mocked(auditService.recordEvent).mock.calls[0]![0]))
      .not.toMatch(/objectKey|checksum|body|download body|internal-only|hidden/);
  });

  it("does not call storage when download policy denies", async () => {
    const { service, accessPolicy, storage, auditService } = createService();
    vi.mocked(accessPolicy.canDownload).mockReturnValueOnce(denyDecision("no download"));

    await expect(
      service.downloadAchievementAttachment(context, ids.achievement, ids.attachment),
    ).rejects.toBeInstanceOf(AttachmentAccessDeniedError);
    expect(storage.getObject).not.toHaveBeenCalled();
    expect(auditService.recordEvent).not.toHaveBeenCalled();
  });

  it("does not write download audit when storage read fails", async () => {
    const { service, storage, auditService } = createService();
    vi.mocked(storage.getObject).mockRejectedValueOnce(new Error("storage failed"));

    await expect(
      service.downloadAchievementAttachment(context, ids.achievement, ids.attachment),
    ).rejects.toThrow("storage failed");

    expect(auditService.recordEvent).not.toHaveBeenCalled();
  });

  it("rejects download before returning body when audit write fails", async () => {
    const { service, storage, auditService } = createService();
    vi.mocked(storage.getObject).mockResolvedValueOnce({
      objectKey: "internal-only",
      body: Buffer.from("download body"),
      checksum: "hidden",
    });
    const auditError = new Error("audit failed");
    vi.mocked(auditService.recordEvent).mockRejectedValueOnce(auditError);

    await expect(
      service.downloadAchievementAttachment(context, ids.achievement, ids.attachment),
    ).rejects.toThrow(auditError);

    expect(storage.getObject).toHaveBeenCalled();
    expect(auditService.recordEvent).toHaveBeenCalled();
  });
});
