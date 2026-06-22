import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { PrismaService } from "../database/prisma.service";
import {
  AchievementRepository,
  type AchievementTransactionClient,
} from "./achievement.repository";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  ContributorRoleCode,
  ContributorTypeCode,
  PatentTypeCode,
  SecretLevelCode,
  SoftwareTypeCode,
} from "./domain/achievement-domain.types";
import { AchievementStatusTransitionConflictError } from "./domain/achievement-repository.errors";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
  conflict: "30000000-0000-4000-8000-000000000099",
};

const makeAggregate = (type: AchievementTypeCode) => ({
  id: ids.achievement,
  type,
  title: "成果草稿",
  status: "DRAFT",
  secretLevel: "INTERNAL",
  departmentId: ids.department,
  ownerUserId: ids.user,
  submittedById: null,
  createdById: ids.user,
  updatedById: ids.user,
  archivedById: null,
  voidedById: null,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  submittedAt: null,
  archivedAt: null,
  voidedAt: null,
  voidReason: null,
  paperDetail: type === AchievementTypeCode.paper ? {} : null,
  patentDetail: type === AchievementTypeCode.patent ? {} : null,
  softwareCopyrightDetail: type === AchievementTypeCode.softwareCopyright ? {} : null,
  contributors: [],
});

const createFakePrisma = () => {
  const tx = {
    achievement: {
      create: vi.fn().mockResolvedValue({ id: ids.achievement }),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(makeAggregate(AchievementTypeCode.paper)),
      findFirst: vi.fn(),
    },
    paperDetail: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    patentDetail: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    softwareCopyrightDetail: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    achievementContributor: {
      createMany: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    achievement: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    paperDetail: {
      findFirst: vi.fn(),
    },
    patentDetail: {
      findFirst: vi.fn(),
    },
    softwareCopyrightDetail: {
      findFirst: vi.fn(),
    },
    resourceAccessGrant: {
      findMany: vi.fn(),
    },
  };

  return { prisma, tx };
};

const createRepository = () => {
  const { prisma, tx } = createFakePrisma();
  const repository = new AchievementRepository(prisma as unknown as PrismaService);

  return { repository, prisma, tx };
};

describe("AchievementRepository dependency injection", () => {
  it("declares explicit PrismaService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AchievementRepository)).toEqual([PrismaService]);
  });
});

describe("AchievementRepository.createDraft", () => {
  it("writes paper draft aggregate inside a Prisma transaction", async () => {
    const { repository, prisma, tx } = createRepository();

    await repository.createDraft({
      type: AchievementTypeCode.paper,
      title: "论文草稿",
      secretLevel: SecretLevelCode.internal,
      departmentId: ids.department,
      ownerUserId: ids.user,
      createdById: ids.user,
      updatedById: ids.user,
      paperDetail: {
        doi: "10.1234/example",
        doiNormalized: "10.1234/example",
        journal: "Journal",
      },
      contributors: [
        {
          name: "作者一",
          contributorType: ContributorTypeCode.author,
          contributorRole: ContributorRoleCode.firstAuthor,
          sortOrder: 1,
        },
      ],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.achievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "PAPER",
        title: "论文草稿",
        status: "DRAFT",
        departmentId: ids.department,
        ownerUserId: ids.user,
      }),
      select: { id: true },
    });
    expect(tx.paperDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        achievementId: ids.achievement,
        doiNormalized: "10.1234/example",
      }),
    });
    expect(tx.achievementContributor.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          achievementId: ids.achievement,
          name: "作者一",
          contributorType: "AUTHOR",
          sortOrder: 1,
        }),
      ],
    });
    expect(tx.achievement.findUnique).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      include: expect.objectContaining({
        paperDetail: true,
        contributors: expect.any(Object),
      }),
    });
  });

  it("writes patent detail for patent drafts", async () => {
    const { repository, tx } = createRepository();
    tx.achievement.findUnique.mockResolvedValue(makeAggregate(AchievementTypeCode.patent));

    await repository.createDraft({
      type: AchievementTypeCode.patent,
      title: "专利草稿",
      secretLevel: SecretLevelCode.internal,
      departmentId: ids.department,
      ownerUserId: ids.user,
      createdById: ids.user,
      updatedById: ids.user,
      patentDetail: {
        applicationNo: "CN 2026-001",
        applicationNoNormalized: "CN2026001",
        patentType: PatentTypeCode.invention,
      },
      contributors: [],
    });

    expect(tx.patentDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        achievementId: ids.achievement,
        applicationNoNormalized: "CN2026001",
      }),
    });
    expect(tx.paperDetail.create).not.toHaveBeenCalled();
    expect(tx.softwareCopyrightDetail.create).not.toHaveBeenCalled();
  });

  it("writes software copyright detail for software copyright drafts", async () => {
    const { repository, tx } = createRepository();
    tx.achievement.findUnique.mockResolvedValue(
      makeAggregate(AchievementTypeCode.softwareCopyright),
    );

    await repository.createDraft({
      type: AchievementTypeCode.softwareCopyright,
      title: "软著草稿",
      secretLevel: SecretLevelCode.internal,
      departmentId: ids.department,
      ownerUserId: ids.user,
      createdById: ids.user,
      updatedById: ids.user,
      softwareCopyrightDetail: {
        registrationNo: "2026SR001",
        registrationNoNormalized: "2026SR001",
        softwareType: SoftwareTypeCode.application,
      },
      contributors: [],
    });

    expect(tx.softwareCopyrightDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        achievementId: ids.achievement,
        registrationNoNormalized: "2026SR001",
      }),
    });
    expect(tx.paperDetail.create).not.toHaveBeenCalled();
    expect(tx.patentDetail.create).not.toHaveBeenCalled();
  });
});

describe("AchievementRepository.updateDraft", () => {
  it("updates paper draft aggregate and increments version inside a Prisma transaction", async () => {
    const { repository, prisma, tx } = createRepository();

    await repository.updateDraft({
      achievementId: ids.achievement,
      type: AchievementTypeCode.paper,
      title: "Updated paper draft",
      secretLevel: SecretLevelCode.secret,
      updatedById: ids.user,
      paperDetail: {
        doi: "10.1234/updated",
        doiNormalized: "10.1234/updated",
        journal: "Updated Journal",
      },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.achievement.update).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      data: expect.objectContaining({
        title: "Updated paper draft",
        secretLevel: "SECRET",
        updatedById: ids.user,
        version: { increment: 1 },
      }),
    });
    expect(tx.paperDetail.update).toHaveBeenCalledWith({
      where: { achievementId: ids.achievement },
      data: expect.objectContaining({
        doiNormalized: "10.1234/updated",
        journal: "Updated Journal",
      }),
    });
    expect(tx.achievementContributor.createMany).not.toHaveBeenCalled();
    expect(tx.achievement.findUnique).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      include: expect.any(Object),
    });
  });

  it("updates only the typed patent detail when a patent draft changes", async () => {
    const { repository, tx } = createRepository();
    tx.achievement.findUnique.mockResolvedValue(makeAggregate(AchievementTypeCode.patent));

    await repository.updateDraft({
      achievementId: ids.achievement,
      type: AchievementTypeCode.patent,
      updatedById: ids.user,
      patentDetail: {
        applicationNo: "CN 2026-002",
        applicationNoNormalized: "CN2026002",
      },
    });

    expect(tx.patentDetail.update).toHaveBeenCalledWith({
      where: { achievementId: ids.achievement },
      data: expect.objectContaining({
        applicationNoNormalized: "CN2026002",
      }),
    });
    expect(tx.paperDetail.update).not.toHaveBeenCalled();
    expect(tx.softwareCopyrightDetail.update).not.toHaveBeenCalled();
  });
});

describe("AchievementRepository read helpers", () => {
  it("lists achievement summaries with caller-provided policy where, filters, pagination, and safe select", async () => {
    const { repository, prisma } = createRepository();
    const policyWhere: Prisma.AchievementWhereInput = { ownerUserId: ids.user };
    prisma.achievement.findMany.mockResolvedValue([
      makeAggregate(AchievementTypeCode.paper),
    ]);
    prisma.achievement.count.mockResolvedValue(1);

    await expect(
      repository.list({
        where: policyWhere,
        filters: {
          status: AchievementStatusCode.draft,
          type: AchievementTypeCode.paper,
          keyword: "Paper",
        },
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toEqual({
      items: [makeAggregate(AchievementTypeCode.paper)],
      total: 1,
    });

    expect(prisma.achievement.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          policyWhere,
          { status: AchievementStatusCode.draft },
          { type: AchievementTypeCode.paper },
          { title: { contains: "Paper", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        type: true,
        title: true,
        status: true,
        secretLevel: true,
        departmentId: true,
        ownerUserId: true,
        createdAt: true,
        updatedAt: true,
        submittedAt: true,
        archivedAt: true,
        voidedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: 10,
      take: 10,
    });
    expect(prisma.achievement.count).toHaveBeenCalledWith({
      where: {
        AND: [
          policyWhere,
          { status: AchievementStatusCode.draft },
          { type: AchievementTypeCode.paper },
          { title: { contains: "Paper", mode: "insensitive" } },
        ],
      },
    });
  });

  it("finds detail by id with aggregate include", async () => {
    const { repository, prisma } = createRepository();
    prisma.achievement.findUnique.mockResolvedValue(makeAggregate(AchievementTypeCode.paper));

    await repository.findDetailById(ids.achievement);

    expect(prisma.achievement.findUnique).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      include: expect.objectContaining({
        paperDetail: true,
        patentDetail: true,
        softwareCopyrightDetail: true,
      }),
    });
  });

  it("finds detail by id and caller-provided policy where", async () => {
    const { repository, prisma } = createRepository();
    const policyWhere: Prisma.AchievementWhereInput = { ownerUserId: ids.user };

    await repository.findDetailByIdWhere(ids.achievement, policyWhere);

    expect(prisma.achievement.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: ids.achievement }, policyWhere],
      },
      include: expect.any(Object),
    });
  });

  it("finds minimal state by id and caller-provided policy where", async () => {
    const { repository, prisma } = createRepository();
    const policyWhere: Prisma.AchievementWhereInput = { ownerUserId: ids.user };

    await repository.findStateById(ids.achievement);
    await repository.findStateByIdWhere(ids.achievement, policyWhere);

    expect(prisma.achievement.findUnique).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      select: expect.objectContaining({
        id: true,
        status: true,
        version: true,
      }),
    });
    expect(prisma.achievement.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: ids.achievement }, policyWhere],
      },
      select: expect.objectContaining({
        id: true,
        status: true,
        version: true,
      }),
    });
  });

  it("finds achievement grants and maps them to policy records", async () => {
    const { repository, prisma } = createRepository();
    prisma.resourceAccessGrant.findMany.mockResolvedValue([
      {
        resourceType: "ACHIEVEMENT",
        resourceId: ids.achievement,
        granteeType: "USER",
        granteeId: ids.user,
        grantType: "SECRET_READ",
        status: "ACTIVE",
        startsAt: null,
        expiresAt: null,
        revokedAt: null,
      },
    ]);

    await expect(repository.findResourceGrantsForAchievement(ids.achievement)).resolves.toEqual([
      {
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.achievement,
        granteeType: "USER",
        granteeId: ids.user,
        grantType: "SECRET_READ",
        status: "ACTIVE",
        startsAt: null,
        expiresAt: null,
        revokedAt: null,
      },
    ]);
    expect(prisma.resourceAccessGrant.findMany).toHaveBeenCalledWith({
      where: {
        resourceType: "ACHIEVEMENT",
        resourceId: ids.achievement,
      },
    });
  });

  it("finds grants for multiple achievements without returning grant details from list items", async () => {
    const { repository, prisma } = createRepository();
    prisma.resourceAccessGrant.findMany.mockResolvedValue([
      {
        resourceType: "ACHIEVEMENT",
        resourceId: ids.achievement,
        granteeType: "USER",
        granteeId: ids.user,
        grantType: "SECRET_READ",
        status: "ACTIVE",
        startsAt: null,
        expiresAt: null,
        revokedAt: null,
      },
    ]);

    await repository.findResourceGrantsForAchievements([ids.achievement, ids.conflict]);

    expect(prisma.resourceAccessGrant.findMany).toHaveBeenCalledWith({
      where: {
        resourceType: "ACHIEVEMENT",
        resourceId: { in: [ids.achievement, ids.conflict] },
      },
    });
  });
});

describe("AchievementRepository.transitionStatus", () => {
  it("updates status with expectedStatus guard and increments version", async () => {
    const { repository, prisma, tx } = createRepository();

    await repository.transitionStatus({
      achievementId: ids.achievement,
      expectedStatus: AchievementStatusCode.draft,
      nextStatus: AchievementStatusCode.pendingDepartmentReview,
      submittedById: ids.user,
      submittedAt: new Date("2026-01-02T00:00:00.000Z"),
      updatedById: ids.user,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.achievement.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.achievement,
        status: "DRAFT",
      },
      data: expect.objectContaining({
        status: "PENDING_DEPARTMENT_REVIEW",
        submittedById: ids.user,
        submittedAt: new Date("2026-01-02T00:00:00.000Z"),
        updatedById: ids.user,
        version: { increment: 1 },
      }),
    });
    expect(tx.achievement.findUnique).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      select: expect.objectContaining({
        id: true,
        status: true,
        version: true,
      }),
    });
  });

  it("raises a transition conflict when expectedStatus does not match", async () => {
    const { repository, tx } = createRepository();
    tx.achievement.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.transitionStatus({
        achievementId: ids.achievement,
        expectedStatus: AchievementStatusCode.draft,
        nextStatus: AchievementStatusCode.voided,
        voidedById: ids.user,
        voidedAt: new Date("2026-01-02T00:00:00.000Z"),
        voidReason: "Duplicate draft.",
        updatedById: ids.user,
      }),
    ).rejects.toBeInstanceOf(AchievementStatusTransitionConflictError);
    expect(tx.achievement.findUnique).not.toHaveBeenCalled();
  });

  it("can transition status with a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as AchievementTransactionClient;

    await repository.transitionStatusInTransaction(transactionClient, {
      achievementId: ids.achievement,
      expectedStatus: AchievementStatusCode.pendingDepartmentReview,
      nextStatus: AchievementStatusCode.pendingArchive,
      updatedById: ids.user,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.achievement.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.achievement,
        status: "PENDING_DEPARTMENT_REVIEW",
      },
      data: expect.objectContaining({
        status: "PENDING_ARCHIVE",
        updatedById: ids.user,
        version: { increment: 1 },
      }),
    });
  });

  it("can read state with a caller-provided transaction client and policy where", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as AchievementTransactionClient;

    await repository.findStateByIdInTransaction(transactionClient, ids.achievement);
    await repository.findStateByIdWhereInTransaction(transactionClient, ids.achievement, {
      departmentId: ids.department,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.achievement.findUnique).toHaveBeenCalledWith({
      where: { id: ids.achievement },
      select: expect.objectContaining({
        id: true,
        status: true,
        version: true,
      }),
    });
    expect(tx.achievement.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [{ id: ids.achievement }, { departmentId: ids.department }],
      },
      select: expect.objectContaining({
        id: true,
        status: true,
        version: true,
      }),
    });
  });
});

describe("AchievementRepository normalized conflicts", () => {
  it("returns the first normalized DOI conflict", async () => {
    const { repository, prisma } = createRepository();
    prisma.paperDetail.findFirst.mockResolvedValue({ achievementId: ids.conflict });

    await expect(
      repository.findNormalizedConflict({ doiNormalized: "10.1234/example" }),
    ).resolves.toEqual({
      field: "doi",
      normalizedValue: "10.1234/example",
      achievementId: ids.conflict,
    });
  });

  it("excludes the current achievement while checking patent conflicts", async () => {
    const { repository, prisma } = createRepository();
    prisma.paperDetail.findFirst.mockResolvedValue(null);
    prisma.patentDetail.findFirst.mockResolvedValue({ achievementId: ids.conflict });

    await expect(
      repository.findNormalizedConflict(
        {
          applicationNoNormalized: "CN2026001",
        },
        ids.achievement,
      ),
    ).resolves.toEqual({
      field: "applicationNo",
      normalizedValue: "CN2026001",
      achievementId: ids.conflict,
    });

    expect(prisma.patentDetail.findFirst).toHaveBeenCalledWith({
      where: {
        applicationNoNormalized: "CN2026001",
        achievementId: { not: ids.achievement },
      },
      select: { achievementId: true },
    });
  });

  it("returns null when no normalized values are provided", async () => {
    const { repository, prisma } = createRepository();

    await expect(repository.findNormalizedConflict({})).resolves.toBeNull();
    expect(prisma.paperDetail.findFirst).not.toHaveBeenCalled();
    expect(prisma.patentDetail.findFirst).not.toHaveBeenCalled();
    expect(prisma.softwareCopyrightDetail.findFirst).not.toHaveBeenCalled();
  });

  it("identifies Prisma P2002 unique conflicts and extracts targets", () => {
    const { repository } = createRepository();
    const error = {
      code: "P2002",
      meta: {
        target: ["doi_normalized"],
      },
    };

    expect(repository.isPrismaUniqueConflict(error)).toBe(true);
    expect(repository.getPrismaUniqueConflictTarget(error)).toEqual(["doi_normalized"]);
    expect(repository.isPrismaUniqueConflict({ code: "P2025" })).toBe(false);
  });
});
