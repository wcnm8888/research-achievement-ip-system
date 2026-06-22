import { describe, expect, it } from "vitest";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../../achievements/domain/achievement-domain.types";
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
  },
  workflowTasks: {
    byStatus: {
      key: DashboardMetricKeyCode.workflowTaskStatusOverview,
      section: DashboardMetricSectionCode.workflow,
      value: {
        buckets: [{ key: WorkflowTaskStatusCode.pending, count: 4 }],
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
});

describe("Dashboard metric contract", () => {
  it("keeps the minimum Dashboard summary shape stable", () => {
    const summary = makeDashboardSummary();

    expect(summary.achievement.total.key).toBe(DashboardMetricKeyCode.achievementTotal);
    expect(summary.achievement.byType.value.buckets[0]).toEqual({
      key: AchievementTypeCode.paper,
      count: 2,
    });
    expect(summary.fee.deadline.value.dueSoon).toEqual({
      key: DashboardOverviewBucketCode.dueSoon,
      count: 2,
    });
    expect(summary.workflowTasks.byStatus.value.buckets[0]?.key).toBe(
      WorkflowTaskStatusCode.pending,
    );
    expect(summary.reminderTasks.byStatus.value.buckets[0]?.key).toBe(
      ReminderStatusCode.sent,
    );
  });

  it("keeps bucket keys limited to non-sensitive enum facts", () => {
    expect(Object.values(DashboardMetricKeyCode)).toEqual([
      "ACHIEVEMENT_TOTAL",
      "ACHIEVEMENT_TYPE_DISTRIBUTION",
      "ACHIEVEMENT_STATUS_DISTRIBUTION",
      "FEE_PAY_STATUS_DISTRIBUTION",
      "FEE_DEADLINE_OVERVIEW",
      "WORKFLOW_TASK_STATUS_OVERVIEW",
      "REMINDER_TASK_STATUS_OVERVIEW",
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
