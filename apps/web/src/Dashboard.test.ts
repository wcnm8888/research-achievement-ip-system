import { describe, expect, it, vi } from "vitest";
import type { ApiClient, ApiError } from "./api-client";
import {
  allowedDashboardDueSoonDays,
  buildDashboardDistributionItems,
  buildDashboardDistributionSections,
  buildDashboardSummaryQuery,
  countDashboardBucket,
  extractDashboardBasicMetrics,
  formatDashboardDateTime,
  getStep17ReadOnlyBoundary,
  getStep17AReadOnlyBoundary,
  getStep17BReadOnlyBoundary,
  loadDashboardSummaryForDemoUser,
  mapDashboardErrorToDisplay,
  normalizeDashboardDueSoonDays,
} from "./Dashboard";
import type { DashboardSummary } from "./types";

const dashboardSummary: DashboardSummary = {
  generatedAt: "2026-06-21T08:30:00.000Z",
  scope: {
    userId: "40000000-0000-4000-8000-000000000002",
    departmentId: "10000000-0000-4000-8000-000000000002",
  },
  achievement: {
    total: {
      key: "ACHIEVEMENT_TOTAL",
      section: "ACHIEVEMENT",
      value: { count: 42 },
    },
    byType: {
      key: "ACHIEVEMENT_TYPE_DISTRIBUTION",
      section: "ACHIEVEMENT",
      value: {
        buckets: [
          { key: "PATENT", count: 20 },
          { key: "PAPER", count: 12 },
          { key: "SOFTWARE_COPYRIGHT", count: 10 },
        ],
      },
    },
    byStatus: {
      key: "ACHIEVEMENT_STATUS_DISTRIBUTION",
      section: "ACHIEVEMENT",
      value: {
        buckets: [
          { key: "ARCHIVED", count: 30 },
          { key: "EXPERIMENTAL_STATUS", count: 12 },
        ],
      },
    },
    departmentRanking: {
      key: "ACHIEVEMENT_DEPARTMENT_RANKING",
      section: "ACHIEVEMENT",
      value: {
        buckets: [
          {
            departmentId: "10000000-0000-4000-8000-000000000002",
            departmentCode: "BIO",
            departmentName: "生命科学学院",
            count: 24,
          },
          {
            departmentId: "10000000-0000-4000-8000-000000000003",
            departmentCode: "CHEM",
            departmentName: "化学学院",
            count: 18,
          },
        ],
      },
    },
  },
  conversion: {
    total: {
      key: "CONVERSION_TOTAL",
      section: "CONVERSION",
      value: { count: 6 },
    },
    totals: {
      key: "CONVERSION_AMOUNT_SUMMARY",
      section: "CONVERSION",
      value: {
        contractTotal: "250000.00",
        revenueTotal: "180000.00",
      },
    },
    funnel: {
      key: "CONVERSION_STATUS_FUNNEL",
      section: "CONVERSION",
      value: {
        buckets: [
          { key: "SIGNED", count: 3 },
          { key: "PAID", count: 2 },
          { key: "COMPLETED", count: 1 },
        ],
      },
    },
    byContractStatus: {
      key: "CONVERSION_CONTRACT_STATUS_DISTRIBUTION",
      section: "CONVERSION",
      value: {
        buckets: [
          { key: "ACTIVE", count: 4 },
          { key: "COMPLETED", count: 2 },
        ],
      },
    },
    byRevenueStatus: {
      key: "CONVERSION_REVENUE_STATUS_DISTRIBUTION",
      section: "CONVERSION",
      value: {
        buckets: [
          { key: "PARTIAL", count: 3 },
          { key: "OVERDUE", count: 1 },
          { key: "PAID", count: 2 },
        ],
      },
    },
    localRisk: {
      key: "CONVERSION_LOCAL_RISK_SUMMARY",
      section: "CONVERSION",
      value: {
        overdue: { key: "OVERDUE", count: 1 },
      },
    },
    byEvaluationEffect: {
      key: "CONVERSION_EVALUATION_EFFECT_DISTRIBUTION",
      section: "CONVERSION",
      value: {
        buckets: [
          { key: "POSITIVE", count: 2 },
          { key: "NOT_EVALUATED", count: 4 },
        ],
      },
    },
  },
  fee: {
    byPayStatus: {
      key: "FEE_PAY_STATUS_DISTRIBUTION",
      section: "FEE",
      value: {
        buckets: [
          { key: "PENDING", count: 7 },
          { key: "PAID", count: 21 },
        ],
      },
    },
    deadline: {
      key: "FEE_DEADLINE_OVERVIEW",
      section: "FEE",
      value: {
        overdue: { key: "OVERDUE", count: 3 },
        dueSoon: { key: "DUE_SOON", count: 7 },
      },
    },
    risk: {
      key: "FEE_RISK_SUMMARY",
      section: "FEE",
      value: {
        overdue: { key: "OVERDUE", count: 3 },
        dueSoon: { key: "DUE_SOON", count: 7 },
        pending: { key: "PENDING", count: 7 },
        paid: { key: "PAID", count: 21 },
      },
    },
  },
  workflowTasks: {
    byStatus: {
      key: "WORKFLOW_TASK_STATUS_OVERVIEW",
      section: "WORKFLOW",
      value: {
        buckets: [
          { key: "PENDING", count: 5 },
          { key: "APPROVED", count: 9 },
        ],
      },
    },
    efficiency: {
      key: "WORKFLOW_APPROVAL_EFFICIENCY",
      section: "WORKFLOW",
      value: {
        total: { key: "TOTAL", count: 16 },
        pending: { key: "PENDING", count: 5 },
        approved: { key: "APPROVED", count: 9 },
        rejected: { key: "REJECTED", count: 2 },
        cancelled: { key: "CANCELLED", count: 0 },
      },
    },
  },
  reminderTasks: {
    byStatus: {
      key: "REMINDER_TASK_STATUS_OVERVIEW",
      section: "REMINDER",
      value: {
        buckets: [
          { key: "PENDING", count: 4 },
          { key: "SENT", count: 8 },
        ],
      },
    },
  },
  integrationMock: {
    recentCalls: {
      key: "INTEGRATION_MOCK_RECENT_CALLS",
      section: "INTEGRATION_MOCK",
      value: {
        count: 12,
        windowDays: 7,
      },
    },
    byStatus: {
      key: "INTEGRATION_MOCK_STATUS_DISTRIBUTION",
      section: "INTEGRATION_MOCK",
      value: {
        buckets: [
          { key: "SUCCESS", count: 9 },
          { key: "FAILED", count: 2 },
          { key: "SKIPPED", count: 1 },
        ],
      },
    },
    byIntegration: {
      key: "INTEGRATION_MOCK_BY_INTEGRATION",
      section: "INTEGRATION_MOCK",
      value: {
        buckets: [
          { integrationCode: "DOI_PRIMARY", provider: "DOI", count: 8 },
          { integrationCode: "FINANCE_PRIMARY", provider: "FINANCE", count: 4 },
        ],
      },
    },
  },
};

const createClient = (result: unknown): ApiClient => ({
  get: vi.fn(async () => result) as unknown as ApiClient["get"],
  post: vi.fn(),
  patch: vi.fn(),
});

const collectCalledPaths = (client: ApiClient): string[] => {
  const getCalls = (client.get as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  const postCalls = (client.post as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  const patchCalls = (client.patch as unknown as { mock: { calls: unknown[][] } }).mock.calls;

  return [...getCalls, ...postCalls, ...patchCalls].map(([path]) => String(path));
};

const expectReadonlyDashboardSummaryOnly = (client: ApiClient): void => {
  const calledPaths = collectCalledPaths(client);

  expect(client.post).not.toHaveBeenCalled();
  expect(client.patch).not.toHaveBeenCalled();
  expect(calledPaths.every((path) => path === "/dashboard/summary")).toBe(true);
  expect(calledPaths.some((path) => path.includes("/audit-logs"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("/fees/warnings"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("attachments"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("search_logs"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("meilisearch"))).toBe(false);
};

describe("loadDashboardSummaryForDemoUser", () => {
  it("does not request dashboard summary without a demo user", async () => {
    const client = createClient(dashboardSummary);

    await expect(loadDashboardSummaryForDemoUser(client, null)).resolves.toBeNull();
    await expect(loadDashboardSummaryForDemoUser(client, "   ")).resolves.toBeNull();

    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it("requests GET /dashboard/summary with the default dueSoonDays", async () => {
    const client = createClient(dashboardSummary);

    await expect(loadDashboardSummaryForDemoUser(client, "demo-user-id")).resolves.toEqual(
      dashboardSummary,
    );

    expect(client.get).toHaveBeenCalledWith("/dashboard/summary", { dueSoonDays: 30 });
    expectReadonlyDashboardSummaryOnly(client);
  });

  it("requests only the supported 7 and 90 day dashboard windows", async () => {
    const client = createClient(dashboardSummary);

    await loadDashboardSummaryForDemoUser(client, "demo-user-id", 7);
    await loadDashboardSummaryForDemoUser(client, "demo-user-id", 90);

    expect(client.get).toHaveBeenNthCalledWith(1, "/dashboard/summary", { dueSoonDays: 7 });
    expect(client.get).toHaveBeenNthCalledWith(2, "/dashboard/summary", { dueSoonDays: 90 });
    expectReadonlyDashboardSummaryOnly(client);
  });

  it("does not send arbitrary unsupported dueSoonDays values", async () => {
    const client = createClient(dashboardSummary);

    await loadDashboardSummaryForDemoUser(client, "demo-user-id", 15);

    expect(buildDashboardSummaryQuery(15)).toEqual({ dueSoonDays: 30 });
    expect(normalizeDashboardDueSoonDays(15)).toBe(30);
    expect(client.get).toHaveBeenCalledWith("/dashboard/summary", { dueSoonDays: 30 });
    expect(allowedDashboardDueSoonDays).toEqual([7, 30, 90]);
    expectReadonlyDashboardSummaryOnly(client);
  });
});

describe("dashboard summary helpers", () => {
  it("extracts Step 17 basic metrics from dashboard summary", () => {
    expect(extractDashboardBasicMetrics(dashboardSummary)).toEqual({
      achievementTotal: 42,
      conversionTotal: 6,
      conversionContractTotal: "250000.00",
      conversionRevenueTotal: "180000.00",
      conversionLocalOverdue: 1,
      overdueFees: 3,
      dueSoonFees: 7,
      pendingFees: 7,
      paidFees: 21,
      pendingWorkflowTasks: 5,
      approvedWorkflowTasks: 9,
      rejectedWorkflowTasks: 2,
      cancelledWorkflowTasks: 0,
      pendingReminders: 4,
      integrationMockRecentCalls: 12,
      integrationMockWindowDays: 7,
    });
  });

  it("falls back to zero for missing buckets or summary", () => {
    expect(countDashboardBucket(undefined, "PENDING")).toBe(0);
    expect(extractDashboardBasicMetrics(null)).toEqual({
      achievementTotal: 0,
      conversionTotal: 0,
      conversionContractTotal: "0.00",
      conversionRevenueTotal: "0.00",
      conversionLocalOverdue: 0,
      overdueFees: 0,
      dueSoonFees: 0,
      pendingFees: 0,
      paidFees: 0,
      pendingWorkflowTasks: 0,
      approvedWorkflowTasks: 0,
      rejectedWorkflowTasks: 0,
      cancelledWorkflowTasks: 0,
      pendingReminders: 0,
      integrationMockRecentCalls: 0,
      integrationMockWindowDays: 7,
    });
  });

  it("formats valid generatedAt values and preserves invalid values", () => {
    expect(formatDashboardDateTime(undefined)).toBe("未返回");
    expect(formatDashboardDateTime("not-a-date")).toBe("not-a-date");
    expect(formatDashboardDateTime("2026-06-21T08:30:00.000Z")).not.toBe(
      "2026-06-21T08:30:00.000Z",
    );
  });

  it("builds all Step 17 distribution sections from existing summary buckets", () => {
    const sections = buildDashboardDistributionSections(dashboardSummary);

    expect(sections.map((section) => section.title)).toEqual([
      "成果类型分布",
      "成果状态分布",
      "成果转化漏斗",
      "转化合同状态",
      "转化到账状态",
      "转化评价效果",
      "费用缴费状态",
      "审批任务状态",
      "提醒任务状态",
      "预留接口调用状态",
    ]);
    expect(sections).toHaveLength(10);
    expect(sections[0]?.items).toEqual([
      { key: "PATENT", label: "专利", count: 20, percent: 48 },
      { key: "PAPER", label: "论文", count: 12, percent: 29 },
      { key: "SOFTWARE_COPYRIGHT", label: "软件著作权", count: 10, percent: 24 },
    ]);
    expect(sections[1]?.items).toEqual([
      { key: "ARCHIVED", label: "已归档", count: 30, percent: 71 },
      { key: "EXPERIMENTAL_STATUS", label: "EXPERIMENTAL_STATUS", count: 12, percent: 29 },
    ]);
    expect(sections[2]?.items.map((item) => item.label)).toEqual([
      "Signed",
      "Paid",
      "Completed",
    ]);
    expect(sections[3]?.items.map((item) => item.label)).toEqual(["Active", "Completed"]);
    expect(sections[4]?.items.map((item) => item.label)).toEqual([
      "Partial",
      "Overdue",
      "Paid",
    ]);
    expect(sections[5]?.items.map((item) => item.label)).toEqual([
      "Positive",
      "Not evaluated",
    ]);
    expect(sections[6]?.items.map((item) => item.label)).toEqual(["待缴", "已缴"]);
    expect(sections[7]?.items.map((item) => item.label)).toEqual(["待处理", "已通过"]);
    expect(sections[8]?.items.map((item) => item.label)).toEqual(["待发送", "已发送"]);
    expect(sections[9]?.items.map((item) => item.label)).toEqual([
      "成功",
      "失败",
      "跳过",
    ]);
  });

  it("returns empty display items for empty buckets without inventing data", () => {
    expect(buildDashboardDistributionItems([], { PENDING: "待处理" })).toEqual([]);
    expect(buildDashboardDistributionSections(null).every((section) => section.items.length === 0)).toBe(
      true,
    );
  });

  it("safely falls back to raw keys for unknown buckets", () => {
    expect(buildDashboardDistributionItems([{ key: "NEW_STATUS", count: 2 }], {})).toEqual([
      { key: "NEW_STATUS", label: "NEW_STATUS", count: 2, percent: 100 },
    ]);
  });
});

describe("dashboard errors and scope boundary", () => {
  it("maps dashboard-specific error copy for display", () => {
    const cases: Array<[ApiError, string]> = [
      [{ kind: "unauthorized", status: 401, message: "请选择或切换演示用户" }, "请选择或切换演示用户"],
      [{ kind: "forbidden", status: 403, message: "当前角色无权限" }, "当前角色无统计看板权限"],
      [{ kind: "bad-request", status: 400, message: "请求参数错误" }, "统计看板参数不正确"],
      [{ kind: "server", status: 500, message: "服务不可用" }, "统计看板服务暂不可用"],
      [{ kind: "network", message: "服务不可用" }, "无法连接统计看板服务"],
    ];

    cases.forEach(([error, message]) => {
      expect(mapDashboardErrorToDisplay(error).message).toBe(message);
    });
  });

  it("keeps Step 17 foundation metrics inside the readonly available surface", () => {
    const boundary = getStep17AReadOnlyBoundary();

    expect(boundary).toEqual({
      endpoint: "/dashboard/summary",
      method: "GET",
      allowedDueSoonDays: [7, 30, 90],
      defaultQuery: { dueSoonDays: 30 },
      unavailableMetrics: ["年度趋势引擎", "专利法律状态专项统计"],
    });
  });

  it("keeps Step 17 readonly and excludes today plus unavailable reporting features", () => {
    expect(getStep17ReadOnlyBoundary()).toEqual({
      endpoint: "/dashboard/summary",
      method: "GET",
      allowedDueSoonDays: [7, 30, 90],
      defaultQuery: { dueSoonDays: 30 },
      excludedQuery: ["today"],
      unavailableMetrics: [
        "年度趋势引擎",
        "专利法律状态专项统计",
        "钻取详情",
        "导出",
        "缓存",
        "完整报表平台",
      ],
    });
    expect(getStep17BReadOnlyBoundary().excludedQuery).toEqual(["today"]);
  });
});
