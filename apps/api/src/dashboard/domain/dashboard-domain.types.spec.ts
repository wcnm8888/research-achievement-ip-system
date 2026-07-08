import { describe, expect, it } from "vitest";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../../achievements/domain/achievement-domain.types";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
} from "../../achievement-conversions/domain/achievement-conversion-domain.types";
import { PayStatusCode } from "../../fees/domain/fee-domain.types";
import { ReminderStatusCode } from "../../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../../workflow/domain/workflow-domain.types";
import {
  DashboardMetricKeyCode,
  DashboardMetricSectionCode,
  DashboardOverviewBucketCode,
  DashboardSummary,
} from "./dashboard-domain.types";
import {
  defaultDashboardDueSoonDays,
  maxDashboardDueSoonDays,
  minDashboardDueSoonDays,
  normalizeDashboardOptions,
  normalizeDueSoonDays,
} from "./dashboard-options";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const makeDashboardSummary = (): DashboardSummary => ({
  generatedAt: new Date("2026-06-18T00:00:00.000Z"),
  scope: {
    userId: ids.user,
    departmentId: ids.department,
  },
  achievement: {
    total: {
      key: DashboardMetricKeyCode.achievementTotal,
      section: DashboardMetricSectionCode.achievement,
      value: { count: 3 },
    },
    byType: {
      key: DashboardMetricKeyCode.achievementTypeDistribution,
      section: DashboardMetricSectionCode.achievement,
      value: {
        buckets: [{ key: AchievementTypeCode.paper, count: 2 }],
      },
    },
    byStatus: {
      key: DashboardMetricKeyCode.achievementStatusDistribution,
      section: DashboardMetricSectionCode.achievement,
      value: {
        buckets: [{ key: AchievementStatusCode.archived, count: 1 }],
      },
    },
    departmentRanking: {
      key: DashboardMetricKeyCode.achievementDepartmentRanking,
      section: DashboardMetricSectionCode.achievement,
      value: {
        buckets: [
          {
            departmentId: ids.department,
            departmentCode: "BIO",
            departmentName: "生命科学学院",
            count: 3,
          },
        ],
      },
    },
  },
  citationImpact: {
    summary: {
      key: DashboardMetricKeyCode.citationImpactSummary,
      section: DashboardMetricSectionCode.achievement,
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
        byDepartment: [],
        byResearcher: [],
        topAchievements: [],
        note: "本地引文影响力基于成果台账字段派生；DOI/Crossref/Scopus/OpenAlex 为后续可接入能力。",
      },
    },
  },
  conversion: {
    total: {
      key: DashboardMetricKeyCode.conversionTotal,
      section: DashboardMetricSectionCode.conversion,
      value: { count: 2 },
    },
    totals: {
      key: DashboardMetricKeyCode.conversionAmountSummary,
      section: DashboardMetricSectionCode.conversion,
      value: {
        contractTotal: "100000.00",
        revenueTotal: "60000.00",
      },
    },
    funnel: {
      key: DashboardMetricKeyCode.conversionStatusFunnel,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionStatusCode.signed, count: 1 }],
      },
    },
    byContractStatus: {
      key: DashboardMetricKeyCode.conversionContractStatusDistribution,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionContractStatusCode.active, count: 1 }],
      },
    },
    byRevenueStatus: {
      key: DashboardMetricKeyCode.conversionRevenueStatusDistribution,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionRevenueStatusCode.partial, count: 1 }],
      },
    },
    localRisk: {
      key: DashboardMetricKeyCode.conversionLocalRiskSummary,
      section: DashboardMetricSectionCode.conversion,
      value: {
        overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
      },
    },
    byEvaluationEffect: {
      key: DashboardMetricKeyCode.conversionEvaluationEffectDistribution,
      section: DashboardMetricSectionCode.conversion,
      value: {
        buckets: [{ key: AchievementConversionEvaluationEffectCode.positive, count: 1 }],
      },
    },
  },
  fee: {
    byPayStatus: {
      key: DashboardMetricKeyCode.feePayStatusDistribution,
      section: DashboardMetricSectionCode.fee,
      value: {
        buckets: [{ key: PayStatusCode.pending, count: 2 }],
      },
    },
    deadline: {
      key: DashboardMetricKeyCode.feeDeadlineOverview,
      section: DashboardMetricSectionCode.fee,
      value: {
        overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
        dueSoon: { key: DashboardOverviewBucketCode.dueSoon, count: 2 },
      },
    },
    risk: {
      key: DashboardMetricKeyCode.feeRiskSummary,
      section: DashboardMetricSectionCode.fee,
      value: {
        overdue: { key: DashboardOverviewBucketCode.overdue, count: 1 },
        dueSoon: { key: DashboardOverviewBucketCode.dueSoon, count: 2 },
        pending: { key: DashboardOverviewBucketCode.pending, count: 2 },
        paid: { key: PayStatusCode.paid, count: 0 },
      },
    },
  },
  workflowTasks: {
    byStatus: {
      key: DashboardMetricKeyCode.workflowTaskStatusOverview,
      section: DashboardMetricSectionCode.workflow,
      value: {
        buckets: [{ key: WorkflowTaskStatusCode.pending, count: 4 }],
      },
    },
    efficiency: {
      key: DashboardMetricKeyCode.workflowApprovalEfficiency,
      section: DashboardMetricSectionCode.workflow,
      value: {
        total: { key: DashboardOverviewBucketCode.total, count: 4 },
        pending: { key: WorkflowTaskStatusCode.pending, count: 4 },
        approved: { key: WorkflowTaskStatusCode.approved, count: 0 },
        rejected: { key: WorkflowTaskStatusCode.rejected, count: 0 },
        cancelled: { key: WorkflowTaskStatusCode.cancelled, count: 0 },
      },
    },
  },
  reminderTasks: {
    byStatus: {
      key: DashboardMetricKeyCode.reminderTaskStatusOverview,
      section: DashboardMetricSectionCode.reminder,
      value: {
        buckets: [{ key: ReminderStatusCode.sent, count: 1 }],
      },
    },
  },
  integrationMock: {
    recentCalls: {
      key: DashboardMetricKeyCode.integrationMockRecentCalls,
      section: DashboardMetricSectionCode.integrationMock,
      value: {
        count: 4,
        windowDays: 7,
      },
    },
    byStatus: {
      key: DashboardMetricKeyCode.integrationMockStatusDistribution,
      section: DashboardMetricSectionCode.integrationMock,
      value: {
        buckets: [{ key: "SUCCESS", count: 3 }],
      },
    },
    byIntegration: {
      key: DashboardMetricKeyCode.integrationMockByIntegration,
      section: DashboardMetricSectionCode.integrationMock,
      value: {
        buckets: [{ integrationCode: "DOI_PRIMARY", provider: "DOI", count: 3 }],
      },
    },
  },
});

describe("Dashboard metric contract", () => {
  it("keeps the minimum Dashboard summary shape stable", () => {
    const summary = makeDashboardSummary();

    expect(summary.achievement.total.key).toBe(DashboardMetricKeyCode.achievementTotal);
    expect(summary.achievement.byType.value.buckets[0]).toEqual({
      key: AchievementTypeCode.paper,
      count: 2,
    });
    expect(summary.achievement.departmentRanking.value.buckets[0]).toEqual({
      departmentId: ids.department,
      departmentCode: "BIO",
      departmentName: "生命科学学院",
      count: 3,
    });
    expect(summary.fee.deadline.value.dueSoon).toEqual({
      key: DashboardOverviewBucketCode.dueSoon,
      count: 2,
    });
    expect(summary.conversion.totals.value).toEqual({
      contractTotal: "100000.00",
      revenueTotal: "60000.00",
    });
    expect(summary.conversion.funnel.value.buckets[0]?.key).toBe(
      AchievementConversionStatusCode.signed,
    );
    expect(summary.conversion.byContractStatus.value.buckets[0]?.key).toBe(
      AchievementConversionContractStatusCode.active,
    );
    expect(summary.conversion.byRevenueStatus.value.buckets[0]?.key).toBe(
      AchievementConversionRevenueStatusCode.partial,
    );
    expect(summary.conversion.localRisk.value.overdue.count).toBe(1);
    expect(summary.conversion.byEvaluationEffect.value.buckets[0]?.key).toBe(
      AchievementConversionEvaluationEffectCode.positive,
    );
    expect(summary.workflowTasks.byStatus.value.buckets[0]?.key).toBe(
      WorkflowTaskStatusCode.pending,
    );
    expect(summary.workflowTasks.efficiency.value.pending.count).toBe(4);
    expect(summary.reminderTasks.byStatus.value.buckets[0]?.key).toBe(
      ReminderStatusCode.sent,
    );
    expect(summary.integrationMock.recentCalls.value).toEqual({
      count: 4,
      windowDays: 7,
    });
  });

  it("keeps bucket keys limited to non-sensitive enum facts", () => {
    expect(Object.values(DashboardMetricKeyCode)).toEqual([
      "ACHIEVEMENT_TOTAL",
      "ACHIEVEMENT_TYPE_DISTRIBUTION",
      "ACHIEVEMENT_STATUS_DISTRIBUTION",
      "ACHIEVEMENT_DEPARTMENT_RANKING",
      "CITATION_IMPACT_SUMMARY",
      "CITATION_DEPARTMENT_RANKING",
      "CITATION_RESEARCHER_RANKING",
      "CONVERSION_TOTAL",
      "CONVERSION_AMOUNT_SUMMARY",
      "CONVERSION_STATUS_FUNNEL",
      "CONVERSION_CONTRACT_STATUS_DISTRIBUTION",
      "CONVERSION_REVENUE_STATUS_DISTRIBUTION",
      "CONVERSION_LOCAL_RISK_SUMMARY",
      "CONVERSION_EVALUATION_EFFECT_DISTRIBUTION",
      "FEE_PAY_STATUS_DISTRIBUTION",
      "FEE_DEADLINE_OVERVIEW",
      "FEE_RISK_SUMMARY",
      "WORKFLOW_TASK_STATUS_OVERVIEW",
      "WORKFLOW_APPROVAL_EFFICIENCY",
      "REMINDER_TASK_STATUS_OVERVIEW",
      "INTEGRATION_MOCK_RECENT_CALLS",
      "INTEGRATION_MOCK_STATUS_DISTRIBUTION",
      "INTEGRATION_MOCK_BY_INTEGRATION",
    ]);
    expect(Object.values(DashboardOverviewBucketCode)).toEqual([
      "TOTAL",
      "OVERDUE",
      "DUE_SOON",
      "PENDING",
    ]);
  });

  it("keeps known sensitive field names out of the result shape", () => {
    const summary = makeDashboardSummary();
    const serialized = JSON.stringify(summary);
    const forbiddenFieldNames = [
      "title",
      "identifier",
      "abstract",
      "contributors",
      "amount",
      "voucherNo",
      "comment",
      "content",
      "oldValue",
      "newValue",
      "ipAddress",
      "userAgent",
      "request",
      "response",
      "token",
      "cookie",
      "connectionString",
    ];

    for (const fieldName of forbiddenFieldNames) {
      expect(serialized).not.toContain(fieldName);
    }
  });
});

describe("Dashboard request options contract", () => {
  it("defaults due-soon days and clones the fixed today value", () => {
    const today = new Date("2026-06-18T00:00:00.000Z");
    const normalized = normalizeDashboardOptions({ today });

    expect(normalized.dueSoonDays).toBe(defaultDashboardDueSoonDays);
    expect(normalized.today).toEqual(today);
    expect(normalized.today).not.toBe(today);
  });

  it("accepts due-soon days within the supported range", () => {
    expect(normalizeDueSoonDays(minDashboardDueSoonDays)).toBe(
      minDashboardDueSoonDays,
    );
    expect(normalizeDueSoonDays(maxDashboardDueSoonDays)).toBe(
      maxDashboardDueSoonDays,
    );
  });

  it("rejects non-integer or out-of-range due-soon days", () => {
    expect(() => normalizeDueSoonDays(0)).toThrow(RangeError);
    expect(() => normalizeDueSoonDays(maxDashboardDueSoonDays + 1)).toThrow(
      RangeError,
    );
    expect(() => normalizeDueSoonDays(1.5)).toThrow(RangeError);
  });
});
