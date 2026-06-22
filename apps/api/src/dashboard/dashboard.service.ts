import { Inject, Injectable } from "@nestjs/common";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { UserContext } from "../identity/user-context";
import { DashboardRepository } from "./dashboard.repository";
import {
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
    const achievementWhere =
      this.policyQueryFactory.achievementReadableWhere(context);
    const feeWhere = this.policyQueryFactory.feeReadableWhere(context);

    const [
      achievementTotal,
      achievementTypeBuckets,
      achievementStatusBuckets,
      feePayStatusBuckets,
      overdueFeeCount,
      dueSoonFeeCount,
      workflowTaskStatusBuckets,
      reminderTaskStatusBuckets,
    ] = await Promise.all([
      this.repository.countAchievements(achievementWhere),
      this.repository.groupAchievementsByType(achievementWhere),
      this.repository.groupAchievementsByStatus(achievementWhere),
      this.repository.groupFeesByPayStatus(feeWhere),
      this.repository.countOverdueFees(feeWhere, todayDateOnly),
      this.repository.countDueSoonFees(
        feeWhere,
        todayDateOnly,
        dueSoonEndDateOnly,
      ),
      this.repository.groupWorkflowTasksByStatus(context.userId),
      this.repository.groupReminderTasksByStatus(context.userId),
    ]);

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
      },
      workflowTasks: {
        byStatus: {
          key: DashboardMetricKeyCode.workflowTaskStatusOverview,
          section: DashboardMetricSectionCode.workflow,
          value: { buckets: workflowTaskStatusBuckets },
        },
      },
      reminderTasks: {
        byStatus: {
          key: DashboardMetricKeyCode.reminderTaskStatusOverview,
          section: DashboardMetricSectionCode.reminder,
          value: { buckets: reminderTaskStatusBuckets },
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
