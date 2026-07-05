import { describe, expect, it, vi } from "vitest";
import { AchievementConversionStatusCode } from "../achievement-conversions/domain/achievement-conversion-domain.types";
import { AchievementStatusCode, AchievementTypeCode } from "../achievements/domain/achievement-domain.types";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { ReminderStatusCode } from "../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { DashboardRepository } from "./dashboard.repository";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const createFakePrisma = () => ({
  achievement: {
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  department: {
    findMany: vi.fn().mockResolvedValue([]),
  },
  achievementConversion: {
    aggregate: vi.fn().mockResolvedValue({
      _sum: {
        contractAmount: null,
        revenueAmount: null,
      },
    }),
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  feeRecord: {
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  workflowTask: {
    groupBy: vi.fn().mockResolvedValue([]),
  },
  reminderTask: {
    groupBy: vi.fn().mockResolvedValue([]),
  },
  apiCallLog: {
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  apiIntegration: {
    findMany: vi.fn().mockResolvedValue([]),
  },
});

const createRepository = () => {
  const prisma = createFakePrisma();
  const repository = new DashboardRepository(prisma as unknown as PrismaService);

  return { prisma, repository };
};

describe("DashboardRepository achievement aggregations", () => {
  it("counts achievements with caller-provided policy where", async () => {
    const { prisma, repository } = createRepository();
    prisma.achievement.count.mockResolvedValue(3);

    await expect(
      repository.countAchievements({ departmentId: { in: [ids.department] } }),
    ).resolves.toBe(3);

    expect(prisma.achievement.count).toHaveBeenCalledWith({
      where: { departmentId: { in: [ids.department] } },
    });
  });

  it("groups achievements by type with caller-provided policy where", async () => {
    const { prisma, repository } = createRepository();
    prisma.achievement.groupBy.mockResolvedValue([
      { type: AchievementTypeCode.paper, _count: { _all: 2 } },
    ]);

    await expect(
      repository.groupAchievementsByType({
        OR: [{ ownerUserId: ids.user }, { departmentId: { in: [ids.department] } }],
      }),
    ).resolves.toEqual([{ key: AchievementTypeCode.paper, count: 2 }]);

    expect(prisma.achievement.groupBy).toHaveBeenCalledWith({
      by: ["type"],
      where: {
        OR: [{ ownerUserId: ids.user }, { departmentId: { in: [ids.department] } }],
      },
      _count: { _all: true },
    });
    expect(prisma.achievement.groupBy.mock.calls[0]![0]).not.toHaveProperty("select");
  });

  it("groups achievements by status with caller-provided policy where", async () => {
    const { prisma, repository } = createRepository();
    prisma.achievement.groupBy.mockResolvedValue([
      { status: AchievementStatusCode.archived, _count: { _all: 1 } },
    ]);

    await expect(
      repository.groupAchievementsByStatus({ id: { in: [] } }),
    ).resolves.toEqual([{ key: AchievementStatusCode.archived, count: 1 }]);

    expect(prisma.achievement.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: { id: { in: [] } },
      _count: { _all: true },
    });
  });
});

describe("DashboardRepository conversion aggregations", () => {
  it("counts conversions through the caller-provided achievement policy where", async () => {
    const { prisma, repository } = createRepository();
    prisma.achievementConversion.count.mockResolvedValue(2);

    await expect(
      repository.countConversions({ departmentId: { in: [ids.department] } }),
    ).resolves.toBe(2);

    expect(prisma.achievementConversion.count).toHaveBeenCalledWith({
      where: {
        achievement: { departmentId: { in: [ids.department] } },
      },
    });
  });

  it("sums conversion amounts without selecting ledger detail fields", async () => {
    const { prisma, repository } = createRepository();
    const decimalLike = (value: string) => ({ toFixed: () => value });
    prisma.achievementConversion.aggregate.mockResolvedValue({
      _sum: {
        contractAmount: decimalLike("120000.00"),
        revenueAmount: decimalLike("80000.00"),
      },
    });

    await expect(repository.sumConversionAmounts({ id: { in: [] } })).resolves.toEqual({
      contractTotal: "120000.00",
      revenueTotal: "80000.00",
    });

    expect(prisma.achievementConversion.aggregate).toHaveBeenCalledWith({
      where: { achievement: { id: { in: [] } } },
      _sum: {
        contractAmount: true,
        revenueAmount: true,
      },
    });
    expect(prisma.achievementConversion.aggregate.mock.calls[0]![0]).not.toHaveProperty("select");
  });

  it("groups conversion funnel by status with achievement policy where", async () => {
    const { prisma, repository } = createRepository();
    prisma.achievementConversion.groupBy.mockResolvedValue([
      { status: AchievementConversionStatusCode.paid, _count: { _all: 3 } },
    ]);

    await expect(
      repository.groupConversionsByStatus({ departmentId: { in: [ids.department] } }),
    ).resolves.toEqual([{ key: AchievementConversionStatusCode.paid, count: 3 }]);

    expect(prisma.achievementConversion.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: {
        achievement: { departmentId: { in: [ids.department] } },
      },
      _count: { _all: true },
    });
  });

  it("ranks departments by visible achievement count without selecting achievement detail", async () => {
    const { prisma, repository } = createRepository();
    prisma.achievement.groupBy.mockResolvedValue([
      { departmentId: "department-b", _count: { _all: 5 } },
      { departmentId: ids.department, _count: { _all: 9 } },
    ]);
    prisma.department.findMany.mockResolvedValue([
      {
        id: ids.department,
        code: "BIO",
        name: "生命科学学院",
      },
      {
        id: "department-b",
        code: "CHEM",
        name: "化学学院",
      },
    ]);

    await expect(
      repository.groupAchievementsByDepartment(
        { departmentId: { in: [ids.department, "department-b"] } },
        1,
      ),
    ).resolves.toEqual([
      {
        departmentId: ids.department,
        departmentCode: "BIO",
        departmentName: "生命科学学院",
        count: 9,
      },
    ]);

    expect(prisma.achievement.groupBy).toHaveBeenCalledWith({
      by: ["departmentId"],
      where: { departmentId: { in: [ids.department, "department-b"] } },
      _count: { _all: true },
    });
    expect(prisma.department.findMany).toHaveBeenCalledWith({
      where: { id: { in: [ids.department] } },
      select: { id: true, code: true, name: true },
    });
    expect(prisma.achievement.groupBy.mock.calls[0]![0]).not.toHaveProperty("select");
  });
});

describe("DashboardRepository fee aggregations", () => {
  it("groups fees by pay status with caller-provided policy where and active filter", async () => {
    const { prisma, repository } = createRepository();
    prisma.feeRecord.groupBy.mockResolvedValue([
      { payStatus: PayStatusCode.pending, _count: { _all: 4 } },
    ]);

    await expect(
      repository.groupFeesByPayStatus({ departmentId: { in: [ids.department] } }),
    ).resolves.toEqual([{ key: PayStatusCode.pending, count: 4 }]);

    expect(prisma.feeRecord.groupBy).toHaveBeenCalledWith({
      by: ["payStatus"],
      where: {
        AND: [{ departmentId: { in: [ids.department] } }, { archivedAt: null }],
      },
      _count: { _all: true },
    });
    expect(prisma.feeRecord.groupBy.mock.calls[0]![0]).not.toHaveProperty("select");
  });

  it("counts overdue fees with date and status filters", async () => {
    const { prisma, repository } = createRepository();
    const today = new Date("2026-06-18T00:00:00.000Z");

    await repository.countOverdueFees({ departmentId: { in: [ids.department] } }, today);

    expect(prisma.feeRecord.count).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            AND: [{ departmentId: { in: [ids.department] } }, { archivedAt: null }],
          },
          { dueDate: { lt: today } },
          { payStatus: { in: [PayStatusCode.pending, PayStatusCode.overdue] } },
        ],
      },
    });
  });

  it("counts due-soon fees with inclusive date window and pending status", async () => {
    const { prisma, repository } = createRepository();
    const today = new Date("2026-06-18T00:00:00.000Z");
    const dueSoonEnd = new Date("2026-07-18T00:00:00.000Z");

    await repository.countDueSoonFees(
      { departmentId: { in: [ids.department] } },
      today,
      dueSoonEnd,
    );

    expect(prisma.feeRecord.count).toHaveBeenCalledWith({
      where: {
        AND: [
          {
            AND: [{ departmentId: { in: [ids.department] } }, { archivedAt: null }],
          },
          { dueDate: { gte: today, lte: dueSoonEnd } },
          { payStatus: PayStatusCode.pending },
        ],
      },
    });
  });
});

describe("DashboardRepository user-scoped task aggregations", () => {
  it("groups workflow tasks only by current assignee id", async () => {
    const { prisma, repository } = createRepository();
    prisma.workflowTask.groupBy.mockResolvedValue([
      { status: WorkflowTaskStatusCode.pending, _count: { _all: 5 } },
    ]);

    await expect(repository.groupWorkflowTasksByStatus(ids.user)).resolves.toEqual([
      { key: WorkflowTaskStatusCode.pending, count: 5 },
    ]);

    expect(prisma.workflowTask.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: { assigneeId: ids.user },
      _count: { _all: true },
    });
  });

  it("groups reminder tasks only by current receiver id", async () => {
    const { prisma, repository } = createRepository();
    prisma.reminderTask.groupBy.mockResolvedValue([
      { status: ReminderStatusCode.sent, _count: { _all: 2 } },
    ]);

    await expect(repository.groupReminderTasksByStatus(ids.user)).resolves.toEqual([
      { key: ReminderStatusCode.sent, count: 2 },
    ]);

    expect(prisma.reminderTask.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: { receiverId: ids.user },
      _count: { _all: true },
    });
  });

  it("does not expose mutation or removal helpers", () => {
    const { repository } = createRepository();
    const multiRemoveMethod = ["delete", "Many"].join("");

    expect("create" in repository).toBe(false);
    expect("update" in repository).toBe(false);
    expect("delete" in repository).toBe(false);
    expect(multiRemoveMethod in repository).toBe(false);
  });
});

describe("DashboardRepository mock integration aggregations", () => {
  it("counts recent API call logs by safe timestamp window", async () => {
    const { prisma, repository } = createRepository();
    const since = new Date("2026-07-01T00:00:00.000Z");
    prisma.apiCallLog.count.mockResolvedValue(4);

    await expect(repository.countRecentApiCallLogs(since)).resolves.toBe(4);

    expect(prisma.apiCallLog.count).toHaveBeenCalledWith({
      where: { createdAt: { gte: since } },
    });
  });

  it("groups recent API call logs by status only", async () => {
    const { prisma, repository } = createRepository();
    const since = new Date("2026-07-01T00:00:00.000Z");
    prisma.apiCallLog.groupBy.mockResolvedValue([
      { status: "SUCCESS", _count: { _all: 3 } },
      { status: "FAILED", _count: { _all: 1 } },
    ]);

    await expect(repository.groupRecentApiCallLogsByStatus(since)).resolves.toEqual([
      { key: "SUCCESS", count: 3 },
      { key: "FAILED", count: 1 },
    ]);

    expect(prisma.apiCallLog.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
  });

  it("groups recent API call logs by integration code and provider without raw log fields", async () => {
    const { prisma, repository } = createRepository();
    const since = new Date("2026-07-01T00:00:00.000Z");
    prisma.apiCallLog.groupBy.mockResolvedValue([
      { integrationCode: "FINANCE_PRIMARY", _count: { _all: 2 } },
      { integrationCode: "DOI_PRIMARY", _count: { _all: 5 } },
    ]);
    prisma.apiIntegration.findMany.mockResolvedValue([
      { code: "DOI_PRIMARY", provider: "DOI" },
      { code: "FINANCE_PRIMARY", provider: "FINANCE" },
    ]);

    await expect(repository.groupRecentApiCallLogsByIntegration(since, 1)).resolves.toEqual([
      {
        integrationCode: "DOI_PRIMARY",
        provider: "DOI",
        count: 5,
      },
    ]);

    expect(prisma.apiCallLog.groupBy).toHaveBeenCalledWith({
      by: ["integrationCode"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    expect(prisma.apiIntegration.findMany).toHaveBeenCalledWith({
      where: { code: { in: ["DOI_PRIMARY"] } },
      select: { code: true, provider: true },
    });
    expect(prisma.apiCallLog.groupBy.mock.calls[0]![0]).not.toHaveProperty("select");
  });
});
