import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { AchievementConversionStatusCode } from "../achievement-conversions/domain/achievement-conversion-domain.types";
import { AchievementStatusCode, AchievementTypeCode } from "../achievements/domain/achievement-domain.types";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { ReminderStatusCode } from "../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { DashboardRepository } from "./dashboard.repository";
import { DashboardService, addUtcDays, toUtcDateOnly } from "./dashboard.service";
import {
  DashboardMetricKeyCode,
  DashboardOverviewBucketCode,
} from "./domain/dashboard-domain.types";
import { DashboardAccessDeniedError } from "./domain/dashboard-errors";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const context: UserContext = {
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [],
  permissionCodes: [PermissionCode.achievementReadDepartment, PermissionCode.feeReadDepartment],
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
};

type DashboardRepositoryMock = {
  countAchievements: ReturnType<typeof vi.fn>;
  groupAchievementsByType: ReturnType<typeof vi.fn>;
  groupAchievementsByStatus: ReturnType<typeof vi.fn>;
  countConversions: ReturnType<typeof vi.fn>;
  sumConversionAmounts: ReturnType<typeof vi.fn>;
  groupConversionsByStatus: ReturnType<typeof vi.fn>;
  groupFeesByPayStatus: ReturnType<typeof vi.fn>;
  countOverdueFees: ReturnType<typeof vi.fn>;
  countDueSoonFees: ReturnType<typeof vi.fn>;
  groupWorkflowTasksByStatus: ReturnType<typeof vi.fn>;
  groupReminderTasksByStatus: ReturnType<typeof vi.fn>;
};

const createRepositoryMock = (): DashboardRepositoryMock => ({
  countAchievements: vi.fn().mockResolvedValue(3),
  groupAchievementsByType: vi
    .fn()
    .mockResolvedValue([{ key: AchievementTypeCode.paper, count: 2 }]),
  groupAchievementsByStatus: vi
    .fn()
    .mockResolvedValue([{ key: AchievementStatusCode.archived, count: 1 }]),
  countConversions: vi.fn().mockResolvedValue(2),
  sumConversionAmounts: vi
    .fn()
    .mockResolvedValue({ contractTotal: "100000.00", revenueTotal: "60000.00" }),
  groupConversionsByStatus: vi
    .fn()
    .mockResolvedValue([{ key: AchievementConversionStatusCode.signed, count: 1 }]),
  groupFeesByPayStatus: vi
    .fn()
    .mockResolvedValue([{ key: PayStatusCode.pending, count: 4 }]),
  countOverdueFees: vi.fn().mockResolvedValue(1),
  countDueSoonFees: vi.fn().mockResolvedValue(2),
  groupWorkflowTasksByStatus: vi
    .fn()
    .mockResolvedValue([{ key: WorkflowTaskStatusCode.pending, count: 5 }]),
  groupReminderTasksByStatus: vi
    .fn()
    .mockResolvedValue([{ key: ReminderStatusCode.sent, count: 2 }]),
});

const createPolicyQueryFactory = () => ({
  achievementReadableWhere: vi.fn().mockReturnValue({
    departmentId: { in: [ids.department] },
  }),
  feeReadableWhere: vi.fn().mockReturnValue({
    departmentId: { in: [ids.department] },
  }),
});

const createService = () => {
  const repository = createRepositoryMock();
  const policyQueryFactory = createPolicyQueryFactory();
  const service = new DashboardService(
    repository as unknown as DashboardRepository,
    policyQueryFactory as never,
  );

  return { policyQueryFactory, repository, service };
};

describe("DashboardService", () => {
  it("builds DashboardSummary from policy-scoped repository aggregations", async () => {
    const { policyQueryFactory, repository, service } = createService();
    const today = new Date("2026-06-18T15:30:00.000Z");

    const summary = await service.getDashboardSummary(context, {
      today,
      dueSoonDays: 15,
    });

    const todayDateOnly = new Date("2026-06-18T00:00:00.000Z");
    const dueSoonEndDateOnly = new Date("2026-07-03T00:00:00.000Z");

    expect(policyQueryFactory.achievementReadableWhere).toHaveBeenCalledWith(context);
    expect(policyQueryFactory.feeReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.countAchievements).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.groupAchievementsByType).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.groupAchievementsByStatus).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.countConversions).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.sumConversionAmounts).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.groupConversionsByStatus).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.groupFeesByPayStatus).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.countOverdueFees).toHaveBeenCalledWith(
      { departmentId: { in: [ids.department] } },
      todayDateOnly,
    );
    expect(repository.countDueSoonFees).toHaveBeenCalledWith(
      { departmentId: { in: [ids.department] } },
      todayDateOnly,
      dueSoonEndDateOnly,
    );
    expect(repository.groupWorkflowTasksByStatus).toHaveBeenCalledWith(ids.user);
    expect(repository.groupReminderTasksByStatus).toHaveBeenCalledWith(ids.user);

    expect(summary.scope).toEqual({ userId: ids.user, departmentId: ids.department });
    expect(summary.generatedAt).toEqual(today);
    expect(summary.generatedAt).not.toBe(today);
    expect(summary.achievement.total).toEqual({
      key: DashboardMetricKeyCode.achievementTotal,
      section: "ACHIEVEMENT",
      value: { count: 3 },
    });
    expect(summary.fee.deadline.value).toEqual({
      overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
      dueSoon: { key: DashboardOverviewBucketCode.dueSoon, count: 2 },
    });
    expect(summary.conversion.total.value.count).toBe(2);
    expect(summary.conversion.totals.value).toEqual({
      contractTotal: "100000.00",
      revenueTotal: "60000.00",
    });
    expect(summary.conversion.funnel.value.buckets).toEqual([
      { key: AchievementConversionStatusCode.signed, count: 1 },
    ]);
    expect(summary.workflowTasks.byStatus.value.buckets).toEqual([
      { key: WorkflowTaskStatusCode.pending, count: 5 },
    ]);
    expect(summary.reminderTasks.byStatus.value.buckets).toEqual([
      { key: ReminderStatusCode.sent, count: 2 },
    ]);
  });

  it("keeps no-access policy filters scoped to empty dashboard results", async () => {
    const { policyQueryFactory, repository, service } = createService();
    policyQueryFactory.achievementReadableWhere.mockReturnValue({ id: { in: [] } });
    policyQueryFactory.feeReadableWhere.mockReturnValue({ id: { in: [] } });
    repository.countAchievements.mockResolvedValue(0);
    repository.groupAchievementsByType.mockResolvedValue([]);
    repository.groupAchievementsByStatus.mockResolvedValue([]);
    repository.countConversions.mockResolvedValue(0);
    repository.sumConversionAmounts.mockResolvedValue({
      contractTotal: "0.00",
      revenueTotal: "0.00",
    });
    repository.groupConversionsByStatus.mockResolvedValue([]);
    repository.groupFeesByPayStatus.mockResolvedValue([]);
    repository.countOverdueFees.mockResolvedValue(0);
    repository.countDueSoonFees.mockResolvedValue(0);
    repository.groupWorkflowTasksByStatus.mockResolvedValue([]);
    repository.groupReminderTasksByStatus.mockResolvedValue([]);

    const summary = await service.getDashboardSummary(context, {
      today: new Date("2026-06-18T00:00:00.000Z"),
    });

    expect(repository.countAchievements).toHaveBeenCalledWith({ id: { in: [] } });
    expect(repository.countConversions).toHaveBeenCalledWith({ id: { in: [] } });
    expect(repository.groupFeesByPayStatus).toHaveBeenCalledWith({ id: { in: [] } });
    expect(summary.achievement.total.value.count).toBe(0);
    expect(summary.conversion.total.value.count).toBe(0);
    expect(summary.conversion.totals.value.contractTotal).toBe("0.00");
    expect(summary.conversion.funnel.value.buckets).toEqual([]);
    expect(summary.achievement.byType.value.buckets).toEqual([]);
    expect(summary.fee.deadline.value.overdue.count).toBe(0);
    expect(summary.fee.deadline.value.dueSoon.count).toBe(0);
    expect(summary.workflowTasks.byStatus.value.buckets).toEqual([]);
    expect(summary.reminderTasks.byStatus.value.buckets).toEqual([]);
  });

  it("requires user context with a department", async () => {
    const { service } = createService();

    await expect(service.getDashboardSummary(null as never)).rejects.toBeInstanceOf(
      DashboardAccessDeniedError,
    );
    await expect(
      service.getDashboardSummary({ ...context, departmentId: "" }),
    ).rejects.toBeInstanceOf(DashboardAccessDeniedError);
  });
});

describe("DashboardService date helpers", () => {
  it("normalizes dates to UTC date-only midnight", () => {
    expect(toUtcDateOnly(new Date("2026-06-18T23:59:59.000Z"))).toEqual(
      new Date("2026-06-18T00:00:00.000Z"),
    );
  });

  it("adds days in UTC date space", () => {
    expect(addUtcDays(new Date("2026-06-18T00:00:00.000Z"), 30)).toEqual(
      new Date("2026-07-18T00:00:00.000Z"),
    );
  });
});
