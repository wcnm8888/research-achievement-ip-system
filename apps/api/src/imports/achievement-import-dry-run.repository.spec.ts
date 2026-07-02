import { DepartmentStatus, UserStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { AchievementImportDryRunRepository } from "./achievement-import-dry-run.repository";

describe("AchievementImportDryRunRepository", () => {
  it("uses only read queries and never writes achievement-related business data", async () => {
    const prisma = {
      department: {
        findMany: vi.fn().mockResolvedValue([{ id: "department-id", code: "RD" }]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "user-id",
            email: "owner@example.org",
            departmentId: "department-id",
            status: UserStatus.ACTIVE,
            archivedAt: null,
          },
        ]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      paperDetail: {
        findMany: vi.fn().mockResolvedValue([{ doiNormalized: "10.1000/a" }]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      patentDetail: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ applicationNoNormalized: "APP001" }])
          .mockResolvedValueOnce([{ grantNoNormalized: "CN001" }]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      softwareCopyrightDetail: {
        findMany: vi.fn().mockResolvedValue([{ registrationNoNormalized: "SW001" }]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      achievement: {
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      achievementContributor: {
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
      },
      attachment: {
        create: vi.fn(),
      },
      feeRecord: {
        create: vi.fn(),
      },
      workflowInstance: {
        create: vi.fn(),
      },
      workflowTask: {
        create: vi.fn(),
      },
      workflowAction: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    const repository = new AchievementImportDryRunRepository(
      prisma as unknown as PrismaService,
    );

    await expect(repository.findActiveDepartmentsByCodes(["RD", "RD"])).resolves.toEqual([
      { id: "department-id", code: "RD" },
    ]);
    await expect(repository.findUsersByEmails(["owner@example.org"])).resolves.toEqual([
      {
        id: "user-id",
        email: "owner@example.org",
        departmentId: "department-id",
        status: UserStatus.ACTIVE,
        archivedAt: null,
      },
    ]);
    await expect(
      repository.findNormalizedConflicts({
        doiNormalizedValues: ["10.1000/a"],
        applicationNoNormalizedValues: ["APP001"],
        patentNoNormalizedValues: ["CN001"],
        registrationNoNormalizedValues: ["SW001"],
      }),
    ).resolves.toEqual([
      { field: "doi", normalizedValue: "10.1000/a" },
      { field: "applicationNo", normalizedValue: "APP001" },
      { field: "patentNo", normalizedValue: "CN001" },
      { field: "registrationNo", normalizedValue: "SW001" },
    ]);

    expect(prisma.department.findMany).toHaveBeenCalledWith({
      where: {
        code: { in: ["RD"] },
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true, code: true },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { email: { in: ["owner@example.org"] } },
      select: {
        id: true,
        email: true,
        departmentId: true,
        status: true,
        archivedAt: true,
      },
    });
    expect(prisma.achievement.create).not.toHaveBeenCalled();
    expect(prisma.achievement.update).not.toHaveBeenCalled();
    expect(prisma.achievement.upsert).not.toHaveBeenCalled();
    expect(prisma.paperDetail.create).not.toHaveBeenCalled();
    expect(prisma.paperDetail.update).not.toHaveBeenCalled();
    expect(prisma.patentDetail.create).not.toHaveBeenCalled();
    expect(prisma.patentDetail.update).not.toHaveBeenCalled();
    expect(prisma.softwareCopyrightDetail.create).not.toHaveBeenCalled();
    expect(prisma.softwareCopyrightDetail.update).not.toHaveBeenCalled();
    expect(prisma.achievementContributor.create).not.toHaveBeenCalled();
    expect(prisma.achievementContributor.createMany).not.toHaveBeenCalled();
    expect(prisma.attachment.create).not.toHaveBeenCalled();
    expect(prisma.feeRecord.create).not.toHaveBeenCalled();
    expect(prisma.workflowInstance.create).not.toHaveBeenCalled();
    expect(prisma.workflowTask.create).not.toHaveBeenCalled();
    expect(prisma.workflowAction.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("writes only PAPER draft import data through the provided transaction client", async () => {
    const createdAchievement = {
      id: "achievement-id",
      type: "PAPER",
      status: "DRAFT",
      secretLevel: "INTERNAL",
      departmentId: "department-id",
      ownerUserId: "owner-id",
      createdById: "admin-id",
      updatedById: "admin-id",
      version: 1,
      paperDetail: { achievementId: "achievement-id", doiNormalized: "10.1000/a" },
      softwareCopyrightDetail: null,
      contributors: [{ id: "contributor-row-id" }],
    };
    const tx = {
      department: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "department-id",
            code: "RD",
            status: DepartmentStatus.ACTIVE,
            archivedAt: null,
          },
        ]),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "owner-id",
            email: "owner@example.org",
            departmentId: "department-id",
            status: UserStatus.ACTIVE,
            archivedAt: null,
          },
        ]),
      },
      paperDetail: {
        findMany: vi.fn().mockResolvedValue([{ doiNormalized: "10.1000/a" }]),
        create: vi.fn(),
      },
      achievement: {
        create: vi.fn().mockResolvedValue({ id: "achievement-id" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(createdAchievement),
        update: vi.fn(),
        upsert: vi.fn(),
        updateMany: vi.fn(),
      },
      achievementContributor: {
        createMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      patentDetail: {
        create: vi.fn(),
      },
      softwareCopyrightDetail: {
        findMany: vi.fn().mockResolvedValue([{ registrationNoNormalized: "SW001" }]),
        create: vi.fn(),
      },
      attachment: {
        create: vi.fn(),
      },
      feeRecord: {
        create: vi.fn(),
      },
      workflowInstance: {
        create: vi.fn(),
      },
      workflowTask: {
        create: vi.fn(),
      },
      workflowAction: {
        create: vi.fn(),
      },
      resourceAccessGrant: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };
    const repository = new AchievementImportDryRunRepository({} as PrismaService);

    await expect(
      repository.findApplyDepartmentsByCodesInTransaction(tx as never, ["RD"]),
    ).resolves.toEqual([
      {
        id: "department-id",
        code: "RD",
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
    ]);
    await expect(
      repository.findApplyUsersByEmailsInTransaction(tx as never, ["owner@example.org"]),
    ).resolves.toEqual([
      {
        id: "owner-id",
        email: "owner@example.org",
        departmentId: "department-id",
        status: UserStatus.ACTIVE,
        archivedAt: null,
      },
    ]);
    await expect(
      repository.findApplyPaperDoiConflictsInTransaction(tx as never, ["10.1000/a"]),
    ).resolves.toEqual([{ field: "doi", normalizedValue: "10.1000/a" }]);
    await expect(
      repository.findApplySoftwareRegistrationConflictsInTransaction(tx as never, ["SW001"]),
    ).resolves.toEqual([{ field: "registrationNo", normalizedValue: "SW001" }]);

    await expect(
      repository.createPaperDraftInTransaction(tx as never, {
        type: "PAPER",
        title: "Paper draft",
        secretLevel: "INTERNAL",
        departmentId: "department-id",
        ownerUserId: "owner-id",
        createdById: "admin-id",
        updatedById: "admin-id",
        paperDetail: {
          doi: "10.1000/a",
          doiNormalized: "10.1000/a",
          journal: "Journal",
        },
        contributors: [
          {
            name: "Author",
            userId: "owner-id",
            contributorType: "AUTHOR",
            contributorRole: "FIRST_AUTHOR",
            sortOrder: 1,
          },
        ],
      }),
    ).resolves.toEqual(createdAchievement);

    expect(tx.achievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "PAPER",
        status: "DRAFT",
        title: "Paper draft",
        departmentId: "department-id",
        ownerUserId: "owner-id",
      }),
      select: { id: true },
    });
    expect(tx.paperDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        achievementId: "achievement-id",
        doiNormalized: "10.1000/a",
      }),
    });
    expect(tx.achievementContributor.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          achievementId: "achievement-id",
          name: "Author",
          userId: "owner-id",
          contributorType: "AUTHOR",
          contributorRole: "FIRST_AUTHOR",
          sortOrder: 1,
        }),
      ],
    });
    expect(tx.achievement.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "achievement-id" },
      select: expect.objectContaining({
        id: true,
        paperDetail: expect.any(Object),
        contributors: expect.any(Object),
      }),
    });
    expect(tx.patentDetail.create).not.toHaveBeenCalled();
    expect(tx.softwareCopyrightDetail.create).not.toHaveBeenCalled();
    expect(tx.attachment.create).not.toHaveBeenCalled();
    expect(tx.feeRecord.create).not.toHaveBeenCalled();
    expect(tx.workflowInstance.create).not.toHaveBeenCalled();
    expect(tx.workflowTask.create).not.toHaveBeenCalled();
    expect(tx.workflowAction.create).not.toHaveBeenCalled();
    expect(tx.resourceAccessGrant.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("writes only SOFTWARE_COPYRIGHT draft import data through the provided transaction client", async () => {
    const createdAchievement = {
      id: "achievement-id",
      type: "SOFTWARE_COPYRIGHT",
      status: "DRAFT",
      secretLevel: "INTERNAL",
      departmentId: "department-id",
      ownerUserId: "owner-id",
      createdById: "admin-id",
      updatedById: "admin-id",
      version: 1,
      paperDetail: null,
      softwareCopyrightDetail: {
        achievementId: "achievement-id",
        registrationNoNormalized: "SW001",
      },
      contributors: [{ id: "contributor-row-id" }],
    };
    const tx = {
      paperDetail: {
        create: vi.fn(),
      },
      softwareCopyrightDetail: {
        create: vi.fn(),
      },
      achievement: {
        create: vi.fn().mockResolvedValue({ id: "achievement-id" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(createdAchievement),
        update: vi.fn(),
        upsert: vi.fn(),
        updateMany: vi.fn(),
      },
      achievementContributor: {
        createMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      patentDetail: {
        create: vi.fn(),
      },
      attachment: {
        create: vi.fn(),
      },
      feeRecord: {
        create: vi.fn(),
      },
      workflowInstance: {
        create: vi.fn(),
      },
      workflowTask: {
        create: vi.fn(),
      },
      workflowAction: {
        create: vi.fn(),
      },
      resourceAccessGrant: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };
    const repository = new AchievementImportDryRunRepository({} as PrismaService);

    await expect(
      repository.createSoftwareCopyrightDraftInTransaction(tx as never, {
        type: "SOFTWARE_COPYRIGHT",
        title: "Software draft",
        secretLevel: "INTERNAL",
        departmentId: "department-id",
        ownerUserId: "owner-id",
        createdById: "admin-id",
        updatedById: "admin-id",
        softwareCopyrightDetail: {
          registrationNo: "SW-001",
          registrationNoNormalized: "SW001",
          softwareVersion: "1.0",
          softwareType: "APPLICATION",
          publishDate: "2026-01-02",
          registerDate: "2026-02-03",
          runEnv: "Runtime",
        },
        contributors: [
          {
            name: "Owner",
            userId: "owner-id",
            contributorType: "COPYRIGHT_OWNER",
            contributorRole: "OWNER",
            sortOrder: 1,
          },
        ],
      }),
    ).resolves.toEqual(createdAchievement);

    expect(tx.achievement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "SOFTWARE_COPYRIGHT",
        status: "DRAFT",
        title: "Software draft",
        departmentId: "department-id",
        ownerUserId: "owner-id",
      }),
      select: { id: true },
    });
    expect(tx.softwareCopyrightDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        achievementId: "achievement-id",
        registrationNoNormalized: "SW001",
      }),
    });
    expect(tx.achievementContributor.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          achievementId: "achievement-id",
          name: "Owner",
          userId: "owner-id",
          contributorType: "COPYRIGHT_OWNER",
          contributorRole: "OWNER",
          sortOrder: 1,
        }),
      ],
    });
    expect(tx.achievement.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "achievement-id" },
      select: expect.objectContaining({
        id: true,
        softwareCopyrightDetail: expect.any(Object),
        contributors: expect.any(Object),
      }),
    });
    expect(tx.paperDetail.create).not.toHaveBeenCalled();
    expect(tx.patentDetail.create).not.toHaveBeenCalled();
    expect(tx.attachment.create).not.toHaveBeenCalled();
    expect(tx.feeRecord.create).not.toHaveBeenCalled();
    expect(tx.workflowInstance.create).not.toHaveBeenCalled();
    expect(tx.workflowTask.create).not.toHaveBeenCalled();
    expect(tx.workflowAction.create).not.toHaveBeenCalled();
    expect(tx.resourceAccessGrant.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("maps Prisma unique conflicts safely", () => {
    const repository = new AchievementImportDryRunRepository({} as PrismaService);
    const error = { code: "P2002", meta: { target: ["doi_normalized"] } };

    expect(repository.isPrismaUniqueConflict(error)).toBe(true);
    expect(repository.getPrismaUniqueConflictTarget(error)).toEqual(["doi_normalized"]);
    expect(repository.isPrismaUniqueConflict({ code: "P2025" })).toBe(false);
  });
});
