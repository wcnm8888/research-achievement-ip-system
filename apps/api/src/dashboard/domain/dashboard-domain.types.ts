import {
  AchievementConversionStatusCode,
} from "../../achievement-conversions/domain/achievement-conversion-domain.types";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../../achievements/domain/achievement-domain.types";
import { PayStatusCode } from "../../fees/domain/fee-domain.types";
import { ReminderStatusCode } from "../../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../../workflow/domain/workflow-domain.types";

export const DashboardMetricSectionCode = {
  achievement: "ACHIEVEMENT",
  conversion: "CONVERSION",
  fee: "FEE",
  workflow: "WORKFLOW",
  reminder: "REMINDER",
} as const;

export type DashboardMetricSectionCode =
  (typeof DashboardMetricSectionCode)[keyof typeof DashboardMetricSectionCode];

export const DashboardMetricKeyCode = {
  achievementTotal: "ACHIEVEMENT_TOTAL",
  achievementTypeDistribution: "ACHIEVEMENT_TYPE_DISTRIBUTION",
  achievementStatusDistribution: "ACHIEVEMENT_STATUS_DISTRIBUTION",
  conversionTotal: "CONVERSION_TOTAL",
  conversionAmountSummary: "CONVERSION_AMOUNT_SUMMARY",
  conversionStatusFunnel: "CONVERSION_STATUS_FUNNEL",
  feePayStatusDistribution: "FEE_PAY_STATUS_DISTRIBUTION",
  feeDeadlineOverview: "FEE_DEADLINE_OVERVIEW",
  workflowTaskStatusOverview: "WORKFLOW_TASK_STATUS_OVERVIEW",
  reminderTaskStatusOverview: "REMINDER_TASK_STATUS_OVERVIEW",
} as const;

export type DashboardMetricKeyCode =
  (typeof DashboardMetricKeyCode)[keyof typeof DashboardMetricKeyCode];

export const DashboardOverviewBucketCode = {
  total: "TOTAL",
  overdue: "OVERDUE",
  dueSoon: "DUE_SOON",
  pending: "PENDING",
} as const;

export type DashboardOverviewBucketCode =
  (typeof DashboardOverviewBucketCode)[keyof typeof DashboardOverviewBucketCode];

export type DashboardCount = {
  count: number;
};

export type DashboardBucket<Key extends string> = DashboardCount & {
  key: Key;
};

export type DashboardDistribution<Key extends string> = {
  buckets: DashboardBucket<Key>[];
};

export type DashboardMetric<Key extends DashboardMetricKeyCode, Value> = {
  key: Key;
  section: DashboardMetricSectionCode;
  value: Value;
};

export type DashboardAchievementSummary = {
  total: DashboardMetric<
    typeof DashboardMetricKeyCode.achievementTotal,
    DashboardCount
  >;
  byType: DashboardMetric<
    typeof DashboardMetricKeyCode.achievementTypeDistribution,
    DashboardDistribution<AchievementTypeCode>
  >;
  byStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.achievementStatusDistribution,
    DashboardDistribution<AchievementStatusCode>
  >;
};

export type DashboardFeeDeadlineOverview = {
  overdue: DashboardBucket<typeof DashboardOverviewBucketCode.overdue>;
  dueSoon: DashboardBucket<typeof DashboardOverviewBucketCode.dueSoon>;
};

export type DashboardConversionAmountSummary = {
  contractTotal: string;
  revenueTotal: string;
};

export type DashboardConversionSummary = {
  total: DashboardMetric<
    typeof DashboardMetricKeyCode.conversionTotal,
    DashboardCount
  >;
  totals: DashboardMetric<
    typeof DashboardMetricKeyCode.conversionAmountSummary,
    DashboardConversionAmountSummary
  >;
  funnel: DashboardMetric<
    typeof DashboardMetricKeyCode.conversionStatusFunnel,
    DashboardDistribution<AchievementConversionStatusCode>
  >;
};

export type DashboardFeeSummary = {
  byPayStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.feePayStatusDistribution,
    DashboardDistribution<PayStatusCode>
  >;
  deadline: DashboardMetric<
    typeof DashboardMetricKeyCode.feeDeadlineOverview,
    DashboardFeeDeadlineOverview
  >;
};

export type DashboardWorkflowTaskSummary = {
  byStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.workflowTaskStatusOverview,
    DashboardDistribution<WorkflowTaskStatusCode>
  >;
};

export type DashboardReminderTaskSummary = {
  byStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.reminderTaskStatusOverview,
    DashboardDistribution<ReminderStatusCode>
  >;
};

export type DashboardSummary = {
  generatedAt: Date;
  scope: {
    userId: string;
    departmentId: string;
  };
  achievement: DashboardAchievementSummary;
  conversion: DashboardConversionSummary;
  fee: DashboardFeeSummary;
  workflowTasks: DashboardWorkflowTaskSummary;
  reminderTasks: DashboardReminderTaskSummary;
};

export type DashboardRequestOptions = {
  today?: Date;
  dueSoonDays?: number;
};
