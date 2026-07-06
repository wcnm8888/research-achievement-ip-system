import { Inject, Injectable } from "@nestjs/common";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { DashboardRepository } from "./dashboard.repository";
import {
  DashboardBucket,
  DashboardMetricKeyCode,
  DashboardMetricSectionCode,
  DashboardOverviewBucketCode,
  DashboardRequestOptions,
  DashboardSummary,
} from "./domain/dashboard-domain.types";
import { DashboardAccessDeniedError } from "./domain/dashboard-errors";
import { normalizeDashboardOptions } from "./domain/dashboard-options";

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DashboardRepository)
    private readonly repository: DashboardRepository,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
  ) {}

  async getDashboardSummary(
    context: UserContext,
    options: DashboardRequestOptions = {},
  ): Promise<DashboardSummary> {
    this.assertUserContext(context);

    const normalizedOptions = normalizeDashboardOptions(options);
    const todayDateOnly = toUtcDateOnly(normalizedOptions.today);
    const dueSoonEndDateOnly = addUtcDays(
      todayDateOnly,
      normalizedOptions.dueSoonDays,
    );
    const recentApiCallLogSince = addUtcDays(
      todayDateOnly,
      -dashboardRecentApiCallWindowDays,
    );
    const achievementWhere =
      this.policyQueryFactory.achievementReadableWhere(context);
    const feeWhere = this.policyQueryFactory.feeReadableWhere(context);

    const [
      achievementTotal,
      achievementTypeBuckets,
      achievementStatusBuckets,
      achievementDepartmentBuckets,
      conversionTotal,
      conversionAmountSummary,
      conversionStatusBuckets,
      conversionContractStatusBuckets,
      conversionRevenueStatusBuckets,
      overdueConversionCount,
      conversionEvaluationEffectBuckets,
      feePayStatusBuckets,
      overdueFeeCount,
      dueSoonFeeCount,
      workflowTaskStatusBuckets,
      reminderTaskStatusBuckets,
      recentApiCallLogCount,
      recentApiCallStatusBuckets,
      recentApiCallIntegrationBuckets,
    ] = await Promise.all([
      this.repository.countAchievements(achievementWhere),
      this.repository.groupAchievementsByType(achievementWhere),
      this.repository.groupAchievementsByStatus(achievementWhere),
      this.repository.groupAchievementsByDepartment(
        achievementWhere,
        dashboardDepartmentRankingLimit,
      ),
      this.repository.countConversions(achievementWhere),
      this.repository.sumConversionAmounts(achievementWhere),
      this.repository.groupConversionsByStatus(achievementWhere),
      this.repository.groupConversionsByContractStatus(achievementWhere),
      this.repository.groupConversionsByRevenueStatus(achievementWhere),
      this.repository.countOverdueConversions(achievementWhere, todayDateOnly),
      this.repository.groupConversionsByEvaluationEffect(achievementWhere),
      this.repository.groupFeesByPayStatus(feeWhere),
      this.repository.countOverdueFees(feeWhere, todayDateOnly),
      this.repository.countDueSoonFees(
        feeWhere,
        todayDateOnly,
        dueSoonEndDateOnly,
      ),
      this.repository.groupWorkflowTasksByStatus(context.userId),
      this.repository.groupReminderTasksByStatus(context.userId),
      this.repository.countRecentApiCallLogs(recentApiCallLogSince),
      this.repository.groupRecentApiCallLogsByStatus(recentApiCallLogSince),
      this.repository.groupRecentApiCallLogsByIntegration(
        recentApiCallLogSince,
        dashboardIntegrationRankingLimit,
      ),
    ]);
    const pendingFeeCount = countBucket(feePayStatusBuckets, PayStatusCode.pending);
    const paidFeeCount = countBucket(feePayStatusBuckets, PayStatusCode.paid);
    const pendingWorkflowTaskCount = countBucket(
      workflowTaskStatusBuckets,
      WorkflowTaskStatusCode.pending,
    );
    const approvedWorkflowTaskCount = countBucket(
      workflowTaskStatusBuckets,
      WorkflowTaskStatusCode.approved,
    );
    const rejectedWorkflowTaskCount = countBucket(
      workflowTaskStatusBuckets,
      WorkflowTaskStatusCode.rejected,
    );
    const cancelledWorkflowTaskCount = countBucket(
      workflowTaskStatusBuckets,
      WorkflowTaskStatusCode.cancelled,
    );
    const workflowTaskTotal = workflowTaskStatusBuckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0,
    );

    return {
      generatedAt: normalizedOptions.today,
      scope: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      achievement: {
        total: {
          key: DashboardMetricKeyCode.achievementTotal,
          section: DashboardMetricSectionCode.achievement,
          value: { count: achievementTotal },
        },
        byType: {
          key: DashboardMetricKeyCode.achievementTypeDistribution,
          section: DashboardMetricSectionCode.achievement,
          value: { buckets: achievementTypeBuckets },
        },
        byStatus: {
          key: DashboardMetricKeyCode.achievementStatusDistribution,
          section: DashboardMetricSectionCode.achievement,
          value: { buckets: achievementStatusBuckets },
        },
        departmentRanking: {
          key: DashboardMetricKeyCode.achievementDepartmentRanking,
          section: DashboardMetricSectionCode.achievement,
          value: { buckets: achievementDepartmentBuckets },
        },
      },
      fee: {
        byPayStatus: {
          key: DashboardMetricKeyCode.feePayStatusDistribution,
          section: DashboardMetricSectionCode.fee,
          value: { buckets: feePayStatusBuckets },
        },
        deadline: {
          key: DashboardMetricKeyCode.feeDeadlineOverview,
          section: DashboardMetricSectionCode.fee,
          value: {
            overdue: {
              key: DashboardOverviewBucketCode.overdue,
              count: overdueFeeCount,
            },
            dueSoon: {
              key: DashboardOverviewBucketCode.dueSoon,
              count: dueSoonFeeCount,
            },
          },
        },
        risk: {
          key: DashboardMetricKeyCode.feeRiskSummary,
          section: DashboardMetricSectionCode.fee,
          value: {
            overdue: {
              key: DashboardOverviewBucketCode.overdue,
              count: overdueFeeCount,
            },
            dueSoon: {
              key: DashboardOverviewBucketCode.dueSoon,
              count: dueSoonFeeCount,
            },
            pending: {
              key: DashboardOverviewBucketCode.pending,
              count: pendingFeeCount,
            },
            paid: {
              key: PayStatusCode.paid,
              count: paidFeeCount,
            },
          },
        },
      },
      conversion: {
        total: {
          key: DashboardMetricKeyCode.conversionTotal,
          section: DashboardMetricSectionCode.conversion,
          value: { count: conversionTotal },
        },
        totals: {
          key: DashboardMetricKeyCode.conversionAmountSummary,
          section: DashboardMetricSectionCode.conversion,
          value: conversionAmountSummary,
        },
        funnel: {
          key: DashboardMetricKeyCode.conversionStatusFunnel,
          section: DashboardMetricSectionCode.conversion,
          value: { buckets: conversionStatusBuckets },
        },
        byContractStatus: {
          key: DashboardMetricKeyCode.conversionContractStatusDistribution,
          section: DashboardMetricSectionCode.conversion,
          value: { buckets: conversionContractStatusBuckets },
        },
        byRevenueStatus: {
          key: DashboardMetricKeyCode.conversionRevenueStatusDistribution,
          section: DashboardMetricSectionCode.conversion,
          value: { buckets: conversionRevenueStatusBuckets },
        },
        localRisk: {
          key: DashboardMetricKeyCode.conversionLocalRiskSummary,
          section: DashboardMetricSectionCode.conversion,
          value: {
            overdue: {
              key: DashboardOverviewBucketCode.overdue,
              count: overdueConversionCount,
            },
          },
        },
        byEvaluationEffect: {
          key: DashboardMetricKeyCode.conversionEvaluationEffectDistribution,
          section: DashboardMetricSectionCode.conversion,
          value: { buckets: conversionEvaluationEffectBuckets },
        },
      },
      workflowTasks: {
        byStatus: {
          key: DashboardMetricKeyCode.workflowTaskStatusOverview,
          section: DashboardMetricSectionCode.workflow,
          value: { buckets: workflowTaskStatusBuckets },
        },
        efficiency: {
          key: DashboardMetricKeyCode.workflowApprovalEfficiency,
          section: DashboardMetricSectionCode.workflow,
          value: {
            total: {
              key: DashboardOverviewBucketCode.total,
              count: workflowTaskTotal,
            },
            pending: {
              key: WorkflowTaskStatusCode.pending,
              count: pendingWorkflowTaskCount,
            },
            approved: {
              key: WorkflowTaskStatusCode.approved,
              count: approvedWorkflowTaskCount,
            },
            rejected: {
              key: WorkflowTaskStatusCode.rejected,
              count: rejectedWorkflowTaskCount,
            },
            cancelled: {
              key: WorkflowTaskStatusCode.cancelled,
              count: cancelledWorkflowTaskCount,
            },
          },
        },
      },
      reminderTasks: {
        byStatus: {
          key: DashboardMetricKeyCode.reminderTaskStatusOverview,
          section: DashboardMetricSectionCode.reminder,
          value: { buckets: reminderTaskStatusBuckets },
        },
      },
      integrationMock: {
        recentCalls: {
          key: DashboardMetricKeyCode.integrationMockRecentCalls,
          section: DashboardMetricSectionCode.integrationMock,
          value: {
            count: recentApiCallLogCount,
            windowDays: dashboardRecentApiCallWindowDays,
          },
        },
        byStatus: {
          key: DashboardMetricKeyCode.integrationMockStatusDistribution,
          section: DashboardMetricSectionCode.integrationMock,
          value: { buckets: recentApiCallStatusBuckets },
        },
        byIntegration: {
          key: DashboardMetricKeyCode.integrationMockByIntegration,
          section: DashboardMetricSectionCode.integrationMock,
          value: { buckets: recentApiCallIntegrationBuckets },
        },
      },
    };
  }

  private assertUserContext(
    context: UserContext | null | undefined,
  ): asserts context is UserContext {
    if (!context?.userId || !context.departmentId) {
      throw new DashboardAccessDeniedError("User context with department is required.");
    }
  }
}

export const toUtcDateOnly = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

export const addUtcDays = (value: Date, days: number): Date => {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const dashboardDepartmentRankingLimit = 5;
export const dashboardIntegrationRankingLimit = 5;
export const dashboardRecentApiCallWindowDays = 7;

const countBucket = <Key extends string>(
  buckets: DashboardBucket<Key>[],
  key: Key,
): number => buckets.find((bucket) => bucket.key === key)?.count ?? 0;
