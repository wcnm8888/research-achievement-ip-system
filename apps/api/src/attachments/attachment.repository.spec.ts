import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it, vi } from "vitest";
import { GrantStatusCode } from "../authorization/constants/grant-status-code";
import { GrantTypeCode } from "../authorization/constants/grant-type-code";
import { GranteeTypeCode } from "../authorization/constants/grantee-type-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { PrismaService } from "../database/prisma.service";
import {
  AttachmentRepository,
  AttachmentTransactionClient,
} from "./attachment.repository";
import { AttachmentRelationTypeCode } from "./domain/attachment-relation-type-code";
import { AttachmentStatusCode } from "./domain/attachment-status-code";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const objectKeyField = ["storage", "Key"].join("");

const ids = {
  attachment: "70000000-0000-4000-8000-000000000001",
  achievement: "30000000-0000-4000-8000-000000000001",
  uploader: "40000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-01T00:00:00.000Z");

const makeRow = () => ({
  id: ids.attachment,
  relationType: AttachmentRelationTypeCode.achievement,
  relationId: ids.achievement,
  fileName: "paper.pdf",
  [objectKeyField]:
    "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
  version: 1,
  uploaderId: ids.uploader,
  secretLevel: SecretLevelCode.internal,
  checksum: "fake-digest",
  status: AttachmentStatusCode.active,
  createdAt,
  updatedAt,
  archivedAt: null,
});

const makeParentRow = () => ({
  id: ids.achievement,
  departmentId: ids.department,
  ownerUserId: ids.uploader,
  secretLevel: SecretLevelCode.internal,
});

const makeGrantRow = () => ({
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

const createFakePrisma = () => {
  const tx = {
    attachment: {
      create: vi.fn().mockResolvedValue(makeRow()),
    },
  };

  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    attachment: {
      findFirst: vi.fn().mockResolvedValue({ version: 3 }),
      findMany: vi.fn().mockResolvedValue([makeRow()]),
      findUnique: vi.fn().mockResolvedValue(makeRow()),
    },
    achievement: {
      findUnique: vi.fn().mockResolvedValue(makeParentRow()),
      findFirst: vi.fn().mockResolvedValue(makeParentRow()),
    },
    resourceAccessGrant: {
      findMany: vi.fn().mockResolvedValue([makeGrantRow()]),
    },
  };

  return { prisma, tx };
};

const createRepository = () => {
  const { prisma, tx } = createFakePrisma();
  const repository = new AttachmentRepository(prisma as unknown as PrismaService);

  return { repository, prisma, tx };
};

describe("AttachmentRepository dependency injection", () => {
  it("declares explicit PrismaService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AttachmentRepository)).toEqual([PrismaService]);
  });
});

describe("AttachmentRepository.create", () => {
  it("creates attachment metadata in a repository-owned transaction", async () => {
    const { repository, prisma, tx } = createRepository();

    const result = await repository.create({
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      fileName: "paper.pdf",
      objectKey:
        "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
      version: 1,
      uploaderId: ids.uploader,
      secretLevel: SecretLevelCode.internal,
      checksum: "fake-digest",
      createdAt,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.attachment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
        fileName: "paper.pdf",
        version: 1,
        uploaderId: ids.uploader,
        secretLevel: SecretLevelCode.internal,
        checksum: "fake-digest",
        createdAt,
      }),
    });
    const createCall = tx.attachment.create.mock.calls[0]!;
    expect((createCall[0].data as Record<string, unknown>)[objectKeyField]).toBe(
      "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: ids.attachment,
        objectKey:
          "attachments/ACHIEVEMENT/30000000-0000-4000-8000-000000000001/object/v1/paper.pdf",
      }),
    );
  });

  it("can create metadata with a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as AttachmentTransactionClient;

    await repository.createInTransaction(transactionClient, {
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      fileName: "paper.pdf",
      objectKey: "attachments/key",
      version: 2,
      uploaderId: ids.uploader,
      secretLevel: SecretLevelCode.secret,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.attachment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
        fileName: "paper.pdf",
        version: 2,
        uploaderId: ids.uploader,
        secretLevel: SecretLevelCode.secret,
        checksum: null,
      }),
    });
  });

  it("does not expose extra mutation helpers", () => {
    const { repository } = createRepository();
    const multiChangeMethod = ["update", "Many"].join("");
    const multiRemoveMethod = ["delete", "Many"].join("");

    expect("update" in repository).toBe(false);
    expect(multiChangeMethod in repository).toBe(false);
    expect("delete" in repository).toBe(false);
    expect(multiRemoveMethod in repository).toBe(false);
  });
});

describe("AttachmentRepository reads", () => {
  it("finds the latest version for a relation and file name", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.findLatestVersion({
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
        fileName: "paper.pdf",
      }),
    ).resolves.toBe(3);

    expect(prisma.attachment.findFirst).toHaveBeenCalledWith({
      where: {
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
        fileName: "paper.pdf",
      },
      select: { version: true },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    });
  });

  it("finds metadata by relation with stable ordering and default take", async () => {
    const { repository, prisma } = createRepository();

    await repository.findManyByRelation({
      relationType: AttachmentRelationTypeCode.achievement,
      relationId: ids.achievement,
      status: AttachmentStatusCode.active,
    });

    expect(prisma.attachment.findMany).toHaveBeenCalledWith({
      where: {
        relationType: AttachmentRelationTypeCode.achievement,
        relationId: ids.achievement,
        status: AttachmentStatusCode.active,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    });
  });

  it("finds metadata by id", async () => {
    const { repository, prisma } = createRepository();

    await expect(repository.findById(ids.attachment)).resolves.toEqual(
      expect.objectContaining({ id: ids.attachment }),
    );
    expect(prisma.attachment.findUnique).toHaveBeenCalledWith({
      where: { id: ids.attachment },
    });
  });

  it("finds achievement parent minimum facts by id", async () => {
    const { repository, prisma } = createRepository();

    await expect(repository.findAchievementParentById(ids.achievement)).resolves.toEqual({
      id: ids.achievement,
      departmentId: ids.department,
      ownerUserId: ids.uploader,
      secretLevel: SecretLevelCode.internal,
    });
    expect(prisma.achievement.findUnique).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      select: {
        id: true,
        departmentId: true,
        ownerUserId: true,
        secretLevel: true,
      },
    });
  });

  it("finds achievement parent minimum facts through a policy where", async () => {
    const { repository, prisma } = createRepository();

    await repository.findAchievementParentByIdWhere(ids.achievement, {
      ownerUserId: ids.uploader,
    });

    expect(prisma.achievement.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: ids.achievement }, { ownerUserId: ids.uploader }],
      },
      select: {
        id: true,
        departmentId: true,
        ownerUserId: true,
        secretLevel: true,
      },
    });
  });

  it("finds achievement and attachment grants for access checks", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.findResourceGrantsForAchievementAndAttachment({
        achievementId: ids.achievement,
        attachmentId: ids.attachment,
      }),
    ).resolves.toEqual([makeGrantRow()]);

    expect(prisma.resourceAccessGrant.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            resourceType: ResourceTypeCode.achievement,
            resourceId: ids.achievement,
          },
          {
            resourceType: ResourceTypeCode.attachment,
            resourceId: ids.attachment,
          },
        ],
      },
    });
  });

  it("identifies Prisma unique conflicts", () => {
    const { repository } = createRepository();

    expect(repository.isPrismaUniqueConflict({ code: "P2002" })).toBe(true);
    expect(repository.isPrismaUniqueConflict({ code: "P2025" })).toBe(false);
  });
});
