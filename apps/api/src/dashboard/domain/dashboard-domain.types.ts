import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
} from "../../achievement-conversions/domain/achievement-conversion-domain.types";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../../achievements/domain/achievement-domain.types";
import { PayStatusCode } from "../../fees/domain/fee-domain.types";
import { ReminderStatusCode } from "../../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../../workflow/domain/workflow-domain.types";

export const DashboardApiCallStatusCode = {
  success: "SUCCESS",
  failed: "FAILED",
  timeout: "TIMEOUT",
  retried: "RETRIED",
  skipped: "SKIPPED",
} as const;

export type DashboardApiCallStatusCode =
  (typeof DashboardApiCallStatusCode)[keyof typeof DashboardApiCallStatusCode];

export const DashboardMetricSectionCode = {
  achievement: "ACHIEVEMENT",
  conversion: "CONVERSION",
  fee: "FEE",
  workflow: "WORKFLOW",
  reminder: "REMINDER",
  integrationMock: "INTEGRATION_MOCK",
} as const;

export type DashboardMetricSectionCode =
  (typeof DashboardMetricSectionCode)[keyof typeof DashboardMetricSectionCode];

export const DashboardMetricKeyCode = {
  achievementTotal: "ACHIEVEMENT_TOTAL",
  achievementTypeDistribution: "ACHIEVEMENT_TYPE_DISTRIBUTION",
  achievementStatusDistribution: "ACHIEVEMENT_STATUS_DISTRIBUTION",
  achievementDepartmentRanking: "ACHIEVEMENT_DEPARTMENT_RANKING",
  conversionTotal: "CONVERSION_TOTAL",
  conversionAmountSummary: "CONVERSION_AMOUNT_SUMMARY",
  conversionStatusFunnel: "CONVERSION_STATUS_FUNNEL",
  conversionContractStatusDistribution: "CONVERSION_CONTRACT_STATUS_DISTRIBUTION",
  conversionRevenueStatusDistribution: "CONVERSION_REVENUE_STATUS_DISTRIBUTION",
  conversionLocalRiskSummary: "CONVERSION_LOCAL_RISK_SUMMARY",
  conversionEvaluationEffectDistribution: "CONVERSION_EVALUATION_EFFECT_DISTRIBUTION",
  feePayStatusDistribution: "FEE_PAY_STATUS_DISTRIBUTION",
  feeDeadlineOverview: "FEE_DEADLINE_OVERVIEW",
  feeRiskSummary: "FEE_RISK_SUMMARY",
  workflowTaskStatusOverview: "WORKFLOW_TASK_STATUS_OVERVIEW",
  workflowApprovalEfficiency: "WORKFLOW_APPROVAL_EFFICIENCY",
  reminderTaskStatusOverview: "REMINDER_TASK_STATUS_OVERVIEW",
  integrationMockRecentCalls: "INTEGRATION_MOCK_RECENT_CALLS",
  integrationMockStatusDistribution: "INTEGRATION_MOCK_STATUS_DISTRIBUTION",
  integrationMockByIntegration: "INTEGRATION_MOCK_BY_INTEGRATION",
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

export type DashboardDepartmentRankBucket = DashboardCount & {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
};

export type DashboardIntegrationCallBucket = DashboardCount & {
  integrationCode: string;
  provider: string;
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
  departmentRanking: DashboardMetric<
    typeof DashboardMetricKeyCode.achievementDepartmentRanking,
    { buckets: DashboardDepartmentRankBucket[] }
  >;
};

export type DashboardFeeDeadlineOverview = {
  overdue: DashboardBucket<typeof DashboardOverviewBucketCode.overdue>;
  dueSoon: DashboardBucket<typeof DashboardOverviewBucketCode.dueSoon>;
};

export type DashboardFeeRiskSummary = {
  overdue: DashboardBucket<typeof DashboardOverviewBucketCode.overdue>;
  dueSoon: DashboardBucket<typeof DashboardOverviewBucketCode.dueSoon>;
  pending: DashboardBucket<typeof DashboardOverviewBucketCode.pending>;
  paid: DashboardBucket<typeof PayStatusCode.paid>;
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
  byContractStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.conversionContractStatusDistribution,
    DashboardDistribution<AchievementConversionContractStatusCode>
  >;
  byRevenueStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.conversionRevenueStatusDistribution,
    DashboardDistribution<AchievementConversionRevenueStatusCode>
  >;
  localRisk: DashboardMetric<
    typeof DashboardMetricKeyCode.conversionLocalRiskSummary,
    { overdue: DashboardBucket<typeof DashboardOverviewBucketCode.overdue> }
  >;
  byEvaluationEffect: DashboardMetric<
    typeof DashboardMetricKeyCode.conversionEvaluationEffectDistribution,
    DashboardDistribution<AchievementConversionEvaluationEffectCode>
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
  risk: DashboardMetric<
    typeof DashboardMetricKeyCode.feeRiskSummary,
    DashboardFeeRiskSummary
  >;
};

export type DashboardWorkflowApprovalEfficiency = {
  total: DashboardBucket<typeof DashboardOverviewBucketCode.total>;
  pending: DashboardBucket<typeof WorkflowTaskStatusCode.pending>;
  approved: DashboardBucket<typeof WorkflowTaskStatusCode.approved>;
  rejected: DashboardBucket<typeof WorkflowTaskStatusCode.rejected>;
  cancelled: DashboardBucket<typeof WorkflowTaskStatusCode.cancelled>;
};

export type DashboardWorkflowTaskSummary = {
  byStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.workflowTaskStatusOverview,
    DashboardDistribution<WorkflowTaskStatusCode>
  >;
  efficiency: DashboardMetric<
    typeof DashboardMetricKeyCode.workflowApprovalEfficiency,
    DashboardWorkflowApprovalEfficiency
  >;
};

export type DashboardReminderTaskSummary = {
  byStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.reminderTaskStatusOverview,
    DashboardDistribution<ReminderStatusCode>
  >;
};

export type DashboardIntegrationMockSummary = {
  recentCalls: DashboardMetric<
    typeof DashboardMetricKeyCode.integrationMockRecentCalls,
    DashboardCount & { windowDays: number }
  >;
  byStatus: DashboardMetric<
    typeof DashboardMetricKeyCode.integrationMockStatusDistribution,
    DashboardDistribution<DashboardApiCallStatusCode>
  >;
  byIntegration: DashboardMetric<
    typeof DashboardMetricKeyCode.integrationMockByIntegration,
    { buckets: DashboardIntegrationCallBucket[] }
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
  integrationMock: DashboardIntegrationMockSummary;
};

export type DashboardRequestOptions = {
  today?: Date;
  dueSoonDays?: number;
};
