import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ApiError } from "./api-client";
import {
  buildCustomReportRunQuery,
  CustomReports,
  CustomReportsView,
  getDefaultCustomReportTemplateId,
  loadCustomReportTemplatesForDemoUser,
  mapCustomReportErrorToDisplay,
  normalizeDueSoonDays,
  runCustomReportForDemoUser,
} from "./CustomReports";
import type {
  CustomReportRunResponse,
  CustomReportTemplate,
  CustomReportTemplateId,
} from "./types";

const templates: CustomReportTemplate[] = [
  {
    templateId: "achievement-distribution",
    name: "部门成果数量与类型分布",
    description: "按部门和成果类型汇总当前可读成果数量。",
  },
  {
    templateId: "achievement-trend",
    name: "年度/月度成果趋势",
    description: "按年份或月份汇总当前可读成果创建趋势。",
  },
  {
    templateId: "fee-risk-summary",
    name: "费用风险与缴费状态摘要",
    description: "按缴费状态和到期风险汇总当前可读费用记录。",
  },
  {
    templateId: "workflow-efficiency",
    name: "审批效率与待办状态摘要",
    description: "按当前用户待办状态汇总工作流处理概览。",
  },
  {
    templateId: "conversion-funnel",
    name: "成果转化合同/收入/状态漏斗摘要",
    description: "按转化状态汇总当前可读成果范围内的合同与到账概览。",
  },
];

const runResponse: CustomReportRunResponse = {
  metadata: {
    templateId: "achievement-distribution",
    name: "部门成果数量与类型分布",
    description: "按部门和成果类型汇总当前可读成果数量。",
    generatedAt: "2026-07-06T00:00:00.000Z",
    localDemoOnly: true,
    notProductionMonitoring: true,
  },
  filters: {
    dateFrom: "2026-01-01",
    dateTo: "2026-12-31",
    achievementType: "PAPER",
    status: "ARCHIVED",
  },
  scopeSummary: {
    userId: "40000000-0000-4000-8000-000000000001",
    departmentId: "10000000-0000-4000-8000-000000000001",
    departmentScope: {
      departmentIds: ["10000000-0000-4000-8000-000000000001"],
    },
    policy: "achievement-readable",
  },
  columns: [
    { key: "departmentCode", label: "Department code", type: "text" },
    { key: "achievementType", label: "Achievement type", type: "text" },
    { key: "count", label: "Count", type: "number" },
  ],
  rows: [
    {
      departmentCode: "BIO",
      achievementType: "PAPER",
      count: 2,
    },
  ],
  totals: {
    count: 2,
  },
  caveats: [
    "仅展示聚合摘要",
    "不展示明细敏感数据",
    "不展示原始记录",
  ],
};

const makeClient = () => ({
  listCustomReportTemplates: vi.fn(async () => templates),
  runCustomReport: vi.fn(async () => runResponse),
});

describe("CustomReports request boundaries", () => {
  it("does not request APIs without a demo user", async () => {
    const client = makeClient();

    await expect(loadCustomReportTemplatesForDemoUser(client, null)).resolves.toBeNull();
    await expect(
      runCustomReportForDemoUser(client, "   ", "achievement-distribution", {}),
    ).resolves.toBeNull();

    const html = renderToStaticMarkup(
      <CustomReports demoUserId={null} apiClient={client} />,
    );

    expect(html).toContain("自定义报表");
    expect(html).toContain("当前没有可用的业务用户");
    expect(client.listCustomReportTemplates).not.toHaveBeenCalled();
    expect(client.runCustomReport).not.toHaveBeenCalled();
  });

  it("loads templates and keeps the default selection on the first template", async () => {
    const client = makeClient();

    await expect(loadCustomReportTemplatesForDemoUser(client, "demo-user-id")).resolves.toEqual(
      templates,
    );

    expect(client.listCustomReportTemplates).toHaveBeenCalledOnce();
    expect(getDefaultCustomReportTemplateId(templates, null)).toBe(
      "achievement-distribution",
    );
    expect(getDefaultCustomReportTemplateId(templates, "fee-risk-summary")).toBe(
      "fee-risk-summary",
    );
  });

  it("builds run queries with only safe supported filter parameters", () => {
    expect(
      buildCustomReportRunQuery("achievement-trend", {
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        departmentId: "10000000-0000-4000-8000-000000000001",
        achievementType: "PAPER",
        status: "ARCHIVED",
        groupBy: "year",
        dueSoonDays: 45,
      }),
    ).toEqual({
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      departmentId: "10000000-0000-4000-8000-000000000001",
      achievementType: "PAPER",
      status: "ARCHIVED",
      groupBy: "year",
    });

    expect(
      buildCustomReportRunQuery("fee-risk-summary", {
        groupBy: "month",
        dueSoonDays: 120,
      }),
    ).toEqual({ dueSoonDays: 90 });
    expect(normalizeDueSoonDays(0)).toBe(1);
  });

  it("runs the selected report endpoint through the injected client", async () => {
    const client = makeClient();

    await expect(
      runCustomReportForDemoUser(client, "demo-user-id", "achievement-distribution", {
        achievementType: "PAPER",
      }),
    ).resolves.toEqual(runResponse);

    expect(client.runCustomReport).toHaveBeenCalledWith("achievement-distribution", {
      achievementType: "PAPER",
    });
  });
});

describe("CustomReportsView display states", () => {
  it("renders templates, metadata, totals, columns, rows, and caveats", () => {
    const html = renderView("achievement-distribution", runResponse);

    for (const template of templates) {
      expect(html).toContain(template.templateId);
    }

    expect(html).toContain("自定义报表");
    expect(html).toContain("仅展示权限范围内的聚合报表摘要");
    expect(html).toContain("仅展示聚合摘要");
    expect(html).toContain("不展示明细敏感数据");
    expect(html).toContain("不展示原始记录");
    expect(html).not.toContain("local/demo");
    expect(html).not.toContain("not production");
    expect(html).not.toContain("raw export");
    expect(html).toContain("achievement-distribution");
    expect(html).toContain("报表模板");
    expect(html).toContain("汇总指标");
    expect(html).toContain("Department code");
    expect(html).toContain("BIO");
    expect(html).toContain("PAPER");
    expect(html).toContain("2");
  });

  it("renders template-specific controls for trend and fee risk reports", () => {
    const trendHtml = renderView("achievement-trend", null);
    const feeHtml = renderView("fee-risk-summary", null);

    expect(trendHtml).toContain("统计粒度");
    expect(trendHtml).toContain("按月");
    expect(feeHtml).toContain("临近天数");
    expect(feeHtml).toContain("30");
  });

  it("renders the aggregate empty state when no rows match", () => {
    const html = renderView("achievement-distribution", {
      ...runResponse,
      rows: [],
      totals: { count: 0 },
    });

    expect(html).toContain("当前筛选条件下没有汇总行。");
  });

  it("renders conversion-funnel aggregate-only rows and totals", () => {
    const html = renderView("conversion-funnel", {
      ...runResponse,
      metadata: {
        ...runResponse.metadata,
        templateId: "conversion-funnel",
        name: "成果转化合同/收入/状态漏斗摘要",
      },
      columns: [
        { key: "dimension", label: "Dimension", type: "text" },
        { key: "status", label: "Status", type: "text" },
        { key: "count", label: "Count", type: "number" },
      ],
      rows: [
        { dimension: "conversionStatus", status: "SIGNED", count: 3 },
        { dimension: "contractStatus", status: "ACTIVE", count: 4 },
        { dimension: "revenueStatus", status: "OVERDUE", count: 1 },
        { dimension: "evaluationEffect", status: "POSITIVE", count: 2 },
      ],
      totals: {
        count: 6,
        contractTotal: "250000.00",
        revenueTotal: "180000.00",
        localOverdue: 1,
        evaluated: 2,
      },
      caveats: [
        "仅展示聚合摘要",
        "转化数据按汇总口径展示",
        "财务状态以授权数据为准",
      ],
    });

    expect(html).toContain("conversion-funnel");
    expect(html).toContain("Dimension");
    expect(html).toContain("contractStatus");
    expect(html).toContain("revenueStatus");
    expect(html).toContain("evaluationEffect");
    expect(html).toContain("localOverdue");
    expect(html).toContain("evaluated");
    expect(html).toContain("转化数据按汇总口径展示");

    for (const forbidden of ["Export", "Download", "Raw JSON"]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("renders safe error messages without leaking raw or secret-bearing details", () => {
    const unsafeDetail = [
      "raw payload",
      "token",
      "cookie",
      "password",
      "connection string",
    ].join(" / ");
    const error = mapCustomReportErrorToDisplay({
      kind: "server",
      status: 500,
      message: "Server failed",
      detail: unsafeDetail,
    });
    const html = renderToStaticMarkup(
      <CustomReportsView
        templates={{ loading: false, data: templates, error: null }}
        report={{ loading: false, data: null, error }}
        selectedTemplateId="achievement-distribution"
        filters={{}}
      />,
    );

    expect(html).toContain("报表服务暂不可用。");
    for (const forbidden of ["raw payload", "token", "cookie", "password", "connection string"]) {
      expect(html).not.toContain(forbidden);
    }
  });

  it("does not render disabled feature entry points", () => {
    const html = renderView("achievement-distribution", runResponse);

    for (const forbidden of [
      "Export",
      "Download",
      "Raw JSON",
      "Save template",
      "Schedule",
    ]) {
      expect(html).not.toContain(forbidden);
    }
  });
});

const renderView = (
  selectedTemplateId: CustomReportTemplateId,
  report: CustomReportRunResponse | null,
): string =>
  renderToStaticMarkup(
    <CustomReportsView
      templates={{ loading: false, data: templates, error: null }}
      report={{ loading: false, data: report, error: null }}
      selectedTemplateId={selectedTemplateId}
      filters={{ groupBy: "month", dueSoonDays: 30 }}
    />,
  );
