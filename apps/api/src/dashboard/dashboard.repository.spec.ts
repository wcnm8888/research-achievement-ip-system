import { describe, expect, it, vi } from "vitest";
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
