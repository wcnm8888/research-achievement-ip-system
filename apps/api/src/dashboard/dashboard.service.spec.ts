import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
} from "../achievement-conversions/domain/achievement-conversion-domain.types";
import { AchievementStatusCode, AchievementTypeCode } from "../achievements/domain/achievement-domain.types";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { ReminderStatusCode } from "../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { DashboardRepository } from "./dashboard.repository";
import {
  DashboardService,
  addUtcDays,
  dashboardDepartmentRankingLimit,
  dashboardIntegrationRankingLimit,
  toUtcDateOnly,
} from "./dashboard.service";
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
  groupAchievementsByDepartment: ReturnType<typeof vi.fn>;
  listCitationAnalysisAchievements: ReturnType<typeof vi.fn>;
  countConversions: ReturnType<typeof vi.fn>;
  sumConversionAmounts: ReturnType<typeof vi.fn>;
  groupConversionsByStatus: ReturnType<typeof vi.fn>;
  groupConversionsByContractStatus: ReturnType<typeof vi.fn>;
  groupConversionsByRevenueStatus: ReturnType<typeof vi.fn>;
  countOverdueConversions: ReturnType<typeof vi.fn>;
  groupConversionsByEvaluationEffect: ReturnType<typeof vi.fn>;
  groupFeesByPayStatus: ReturnType<typeof vi.fn>;
  countOverdueFees: ReturnType<typeof vi.fn>;
  countDueSoonFees: ReturnType<typeof vi.fn>;
  groupWorkflowTasksByStatus: ReturnType<typeof vi.fn>;
  groupReminderTasksByStatus: ReturnType<typeof vi.fn>;
  countRecentApiCallLogs: ReturnType<typeof vi.fn>;
  groupRecentApiCallLogsByStatus: ReturnType<typeof vi.fn>;
  groupRecentApiCallLogsByIntegration: ReturnType<typeof vi.fn>;
};

const createRepositoryMock = (): DashboardRepositoryMock => ({
  countAchievements: vi.fn().mockResolvedValue(3),
  groupAchievementsByType: vi
    .fn()
    .mockResolvedValue([{ key: AchievementTypeCode.paper, count: 2 }]),
  groupAchievementsByStatus: vi
    .fn()
    .mockResolvedValue([{ key: AchievementStatusCode.archived, count: 1 }]),
  groupAchievementsByDepartment: vi.fn().mockResolvedValue([
    {
      departmentId: ids.department,
      departmentCode: "BIO",
      departmentName: "生命科学学院",
      count: 3,
    },
  ]),
  listCitationAnalysisAchievements: vi.fn().mockResolvedValue([
    {
      id: "paper-1",
      type: AchievementTypeCode.paper,
      status: AchievementStatusCode.archived,
      departmentId: ids.department,
      departmentCode: "BIO",
      departmentName: "生命科学学院",
      ownerUserId: ids.user,
      ownerName: "张三",
      paperDetail: {
        doi: "10.1234/example",
        publishYear: 2021,
        includedType: "SCI",
        impactFactor: "5.25",
      },
    },
  ]),
  countConversions: vi.fn().mockResolvedValue(2),
  sumConversionAmounts: vi
    .fn()
    .mockResolvedValue({ contractTotal: "100000.00", revenueTotal: "60000.00" }),
  groupConversionsByStatus: vi
    .fn()
    .mockResolvedValue([{ key: AchievementConversionStatusCode.signed, count: 1 }]),
  groupConversionsByContractStatus: vi
    .fn()
    .mockResolvedValue([{ key: AchievementConversionContractStatusCode.active, count: 1 }]),
  groupConversionsByRevenueStatus: vi
    .fn()
    .mockResolvedValue([{ key: AchievementConversionRevenueStatusCode.partial, count: 1 }]),
  countOverdueConversions: vi.fn().mockResolvedValue(1),
  groupConversionsByEvaluationEffect: vi
    .fn()
    .mockResolvedValue([{ key: AchievementConversionEvaluationEffectCode.positive, count: 1 }]),
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
  countRecentApiCallLogs: vi.fn().mockResolvedValue(4),
  groupRecentApiCallLogsByStatus: vi
    .fn()
    .mockResolvedValue([{ key: "SUCCESS", count: 3 }]),
  groupRecentApiCallLogsByIntegration: vi.fn().mockResolvedValue([
    {
      integrationCode: "DOI_PRIMARY",
      provider: "DOI",
      count: 3,
    },
  ]),
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
    const recentApiCallLogSince = new Date("2026-06-11T00:00:00.000Z");

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
    expect(repository.groupAchievementsByDepartment).toHaveBeenCalledWith(
      { departmentId: { in: [ids.department] } },
      dashboardDepartmentRankingLimit,
    );
    expect(repository.listCitationAnalysisAchievements).toHaveBeenCalledWith({
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
    expect(repository.groupConversionsByContractStatus).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.groupConversionsByRevenueStatus).toHaveBeenCalledWith({
      departmentId: { in: [ids.department] },
    });
    expect(repository.countOverdueConversions).toHaveBeenCalledWith(
      { departmentId: { in: [ids.department] } },
      todayDateOnly,
    );
    expect(repository.groupConversionsByEvaluationEffect).toHaveBeenCalledWith({
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
    expect(repository.countRecentApiCallLogs).toHaveBeenCalledWith(recentApiCallLogSince);
    expect(repository.groupRecentApiCallLogsByStatus).toHaveBeenCalledWith(
      recentApiCallLogSince,
    );
    expect(repository.groupRecentApiCallLogsByIntegration).toHaveBeenCalledWith(
      recentApiCallLogSince,
      dashboardIntegrationRankingLimit,
    );

    expect(summary.scope).toEqual({ userId: ids.user, departmentId: ids.department });
    expect(summary.generatedAt).toEqual(today);
    expect(summary.generatedAt).not.toBe(today);
    expect(summary.achievement.total).toEqual({
      key: DashboardMetricKeyCode.achievementTotal,
      section: "ACHIEVEMENT",
      value: { count: 3 },
    });
    expect(summary.achievement.departmentRanking.value.buckets).toEqual([
      {
        departmentId: ids.department,
        departmentCode: "BIO",
        departmentName: "生命科学学院",
        count: 3,
      },
    ]);
    expect(summary.citationImpact.summary).toMatchObject({
      key: DashboardMetricKeyCode.citationImpactSummary,
      section: "ACHIEVEMENT",
      value: {
        source: "LOCAL_DERIVED",
        externalSourceStatus: "RESERVED_INTERFACE",
        overview: {
          achievementCount: 1,
          citableAchievementCount: 1,
          totalCitations: 59,
          averageCitations: 59,
          hIndex: 1,
        },
      },
    });
    expect(summary.fee.deadline.value).toEqual({
      overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
      dueSoon: { key: DashboardOverviewBucketCode.dueSoon, count: 2 },
    });
    expect(summary.fee.risk.value).toEqual({
      overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
      dueSoon: { key: DashboardOverviewBucketCode.dueSoon, count: 2 },
      pending: { key: DashboardOverviewBucketCode.pending, count: 4 },
      paid: { key: PayStatusCode.paid, count: 0 },
    });
    expect(summary.conversion.total.value.count).toBe(2);
    expect(summary.conversion.totals.value).toEqual({
      contractTotal: "100000.00",
      revenueTotal: "60000.00",
    });
    expect(summary.conversion.funnel.value.buckets).toEqual([
      { key: AchievementConversionStatusCode.signed, count: 1 },
    ]);
    expect(summary.conversion.byContractStatus.value.buckets).toEqual([
      { key: AchievementConversionContractStatusCode.active, count: 1 },
    ]);
    expect(summary.conversion.byRevenueStatus.value.buckets).toEqual([
      { key: AchievementConversionRevenueStatusCode.partial, count: 1 },
    ]);
    expect(summary.conversion.localRisk.value.overdue).toEqual({
      key: DashboardOverviewBucketCode.overdue,
      count: 1,
    });
    expect(summary.conversion.byEvaluationEffect.value.buckets).toEqual([
      { key: AchievementConversionEvaluationEffectCode.positive, count: 1 },
    ]);
    expect(summary.workflowTasks.byStatus.value.buckets).toEqual([
      { key: WorkflowTaskStatusCode.pending, count: 5 },
    ]);
    expect(summary.workflowTasks.efficiency.value).toEqual({
      total: { key: DashboardOverviewBucketCode.total, count: 5 },
      pending: { key: WorkflowTaskStatusCode.pending, count: 5 },
      approved: { key: WorkflowTaskStatusCode.approved, count: 0 },
      rejected: { key: WorkflowTaskStatusCode.rejected, count: 0 },
      cancelled: { key: WorkflowTaskStatusCode.cancelled, count: 0 },
    });
    expect(summary.reminderTasks.byStatus.value.buckets).toEqual([
      { key: ReminderStatusCode.sent, count: 2 },
    ]);
    expect(summary.integrationMock.recentCalls.value).toEqual({
      count: 4,
      windowDays: 7,
    });
    expect(summary.integrationMock.byStatus.value.buckets).toEqual([
      { key: "SUCCESS", count: 3 },
    ]);
    expect(summary.integrationMock.byIntegration.value.buckets).toEqual([
      {
        integrationCode: "DOI_PRIMARY",
        provider: "DOI",
        count: 3,
      },
    ]);
  });

  it("keeps no-access policy filters scoped to empty dashboard results", async () => {
    const { policyQueryFactory, repository, service } = createService();
    policyQueryFactory.achievementReadableWhere.mockReturnValue({ id: { in: [] } });
    policyQueryFactory.feeReadableWhere.mockReturnValue({ id: { in: [] } });
    repository.countAchievements.mockResolvedValue(0);
    repository.groupAchievementsByType.mockResolvedValue([]);
    repository.groupAchievementsByStatus.mockResolvedValue([]);
    repository.groupAchievementsByDepartment.mockResolvedValue([]);
    repository.listCitationAnalysisAchievements.mockResolvedValue([]);
    repository.countConversions.mockResolvedValue(0);
    repository.sumConversionAmounts.mockResolvedValue({
      contractTotal: "0.00",
      revenueTotal: "0.00",
    });
    repository.groupConversionsByStatus.mockResolvedValue([]);
    repository.groupConversionsByContractStatus.mockResolvedValue([]);
    repository.groupConversionsByRevenueStatus.mockResolvedValue([]);
    repository.countOverdueConversions.mockResolvedValue(0);
    repository.groupConversionsByEvaluationEffect.mockResolvedValue([]);
    repository.groupFeesByPayStatus.mockResolvedValue([]);
    repository.countOverdueFees.mockResolvedValue(0);
    repository.countDueSoonFees.mockResolvedValue(0);
    repository.groupWorkflowTasksByStatus.mockResolvedValue([]);
    repository.groupReminderTasksByStatus.mockResolvedValue([]);
    repository.countRecentApiCallLogs.mockResolvedValue(0);
    repository.groupRecentApiCallLogsByStatus.mockResolvedValue([]);
    repository.groupRecentApiCallLogsByIntegration.mockResolvedValue([]);

    const summary = await service.getDashboardSummary(context, {
      today: new Date("2026-06-18T00:00:00.000Z"),
    });

    expect(repository.countAchievements).toHaveBeenCalledWith({ id: { in: [] } });
    expect(repository.countConversions).toHaveBeenCalledWith({ id: { in: [] } });
    expect(repository.groupFeesByPayStatus).toHaveBeenCalledWith({ id: { in: [] } });
    expect(summary.achievement.total.value.count).toBe(0);
    expect(summary.achievement.departmentRanking.value.buckets).toEqual([]);
    expect(summary.citationImpact.summary.value.overview).toEqual({
      achievementCount: 0,
      citableAchievementCount: 0,
      totalCitations: 0,
      averageCitations: 0,
      hIndex: 0,
    });
    expect(summary.conversion.total.value.count).toBe(0);
    expect(summary.conversion.totals.value.contractTotal).toBe("0.00");
    expect(summary.conversion.funnel.value.buckets).toEqual([]);
    expect(summary.conversion.byContractStatus.value.buckets).toEqual([]);
    expect(summary.conversion.byRevenueStatus.value.buckets).toEqual([]);
    expect(summary.conversion.localRisk.value.overdue.count).toBe(0);
    expect(summary.conversion.byEvaluationEffect.value.buckets).toEqual([]);
    expect(summary.achievement.byType.value.buckets).toEqual([]);
    expect(summary.fee.deadline.value.overdue.count).toBe(0);
    expect(summary.fee.deadline.value.dueSoon.count).toBe(0);
    expect(summary.workflowTasks.byStatus.value.buckets).toEqual([]);
    expect(summary.workflowTasks.efficiency.value.total.count).toBe(0);
    expect(summary.reminderTasks.byStatus.value.buckets).toEqual([]);
    expect(summary.integrationMock.recentCalls.value.count).toBe(0);
    expect(summary.integrationMock.byStatus.value.buckets).toEqual([]);
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
