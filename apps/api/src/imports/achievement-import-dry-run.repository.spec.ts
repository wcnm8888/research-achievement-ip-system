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
});
