import { describe, expect, it, vi } from "vitest";
import { GrantStatusCode } from "../authorization/constants/grant-status-code";
import { GrantTypeCode } from "../authorization/constants/grant-type-code";
import { GranteeTypeCode } from "../authorization/constants/grantee-type-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { AchievementStatusCode, AchievementTypeCode } from "../achievements/domain/achievement-domain.types";
import { PrismaService } from "../database/prisma.service";
import { FeeTypeCode, PayStatusCode } from "../fees/domain/fee-domain.types";
import { SearchRepository } from "./search.repository";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const createFakePrisma = () => ({
  achievement: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  feeRecord: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  resourceAccessGrant: {
    findMany: vi.fn().mockResolvedValue([]),
  },
});

const createRepository = () => {
  const prisma = createFakePrisma();
  const repository = new SearchRepository(prisma as unknown as PrismaService);

  return { prisma, repository };
};

describe("SearchRepository.searchAchievements", () => {
  it("uses caller-provided policy where before keyword and filter conditions", async () => {
    const { prisma, repository } = createRepository();

    await repository.searchAchievements(
      { departmentId: { in: [ids.department] } },
      {
        keyword: "paper",
        achievementType: AchievementTypeCode.paper,
        achievementStatus: AchievementStatusCode.archived,
        departmentId: ids.department,
        take: 10,
      },
    );

    expect(prisma.achievement.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { departmentId: { in: [ids.department] } },
          { type: AchievementTypeCode.paper },
          { status: AchievementStatusCode.archived },
          { departmentId: ids.department },
          {
            OR: [
              { title: { contains: "paper", mode: "insensitive" } },
              { paperDetail: { is: { doi: { contains: "paper", mode: "insensitive" } } } },
              {
                patentDetail: {
                  is: { applicationNo: { contains: "paper", mode: "insensitive" } },
                },
              },
              {
                patentDetail: {
                  is: { grantNo: { contains: "paper", mode: "insensitive" } },
                },
              },
              {
                softwareCopyrightDetail: {
                  is: { registrationNo: { contains: "paper", mode: "insensitive" } },
                },
              },
            ],
          },
        ],
      },
      select: expect.objectContaining({
        id: true,
        title: true,
        secretLevel: true,
        paperDetail: { select: { doi: true } },
      }),
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 10,
    });
    expect(prisma.achievement.findMany.mock.calls[0]![0].select).not.toHaveProperty(
      "contributors",
    );
  });

  it("loads only resource grant facts needed for secret policy", async () => {
    const { prisma, repository } = createRepository();
    prisma.resourceAccessGrant.findMany.mockResolvedValue([
      {
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.achievement,
        granteeType: GranteeTypeCode.user,
        granteeId: ids.user,
        grantType: GrantTypeCode.secretRead,
        status: GrantStatusCode.active,
        startsAt: null,
        expiresAt: null,
        revokedAt: null,
      },
    ]);

    await expect(repository.findAchievementGrants([ids.achievement])).resolves.toHaveLength(1);

    expect(prisma.resourceAccessGrant.findMany).toHaveBeenCalledWith({
      where: {
        resourceType: ResourceTypeCode.achievement,
        resourceId: { in: [ids.achievement] },
      },
      select: {
        resourceType: true,
        resourceId: true,
        granteeType: true,
        granteeId: true,
        grantType: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  });
});

describe("SearchRepository.searchFees", () => {
  it("uses caller-provided fee policy where and excludes sensitive amount/voucher fields", async () => {
    const { prisma, repository } = createRepository();

    await repository.searchFees(
      { departmentId: { in: [ids.department] } },
      {
        keyword: ids.achievement,
        feeType: FeeTypeCode.patentAnnual,
        payStatus: PayStatusCode.pending,
        departmentId: ids.department,
        take: 5,
      },
    );

    expect(prisma.feeRecord.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { departmentId: { in: [ids.department] } },
          { archivedAt: null },
          { feeType: FeeTypeCode.patentAnnual },
          { payStatus: PayStatusCode.pending },
          { departmentId: ids.department },
          { OR: [{ id: ids.achievement }, { achievementId: ids.achievement }] },
        ],
      },
      select: expect.objectContaining({
        id: true,
        achievementId: true,
        feeType: true,
        payStatus: true,
      }),
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: 5,
    });
    expect(prisma.feeRecord.findMany.mock.calls[0]![0].select).not.toHaveProperty("amount");
    expect(prisma.feeRecord.findMany.mock.calls[0]![0].select).not.toHaveProperty("voucherNo");
  });

  it("does not search fee UUID columns with non-UUID keywords", async () => {
    const { prisma, repository } = createRepository();

    await repository.searchFees({ departmentId: { in: [ids.department] } }, { keyword: "annual", take: 5 });

    expect(prisma.feeRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { departmentId: { in: [ids.department] } },
            { archivedAt: null },
            { id: { in: [] } },
          ],
        },
      }),
    );
  });

  it("does not expose broad mutation or removal helpers", () => {
    const { repository } = createRepository();
    const multiRemoveMethod = ["delete", "Many"].join("");

    expect("create" in repository).toBe(false);
    expect("update" in repository).toBe(false);
    expect("delete" in repository).toBe(false);
    expect(multiRemoveMethod in repository).toBe(false);
  });
});
