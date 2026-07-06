import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
} from "../achievement-conversions/domain/achievement-conversion-domain.types";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import { PermissionCode } from "../authorization/constants/permission-code";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import {
  CustomReportTemplateIdCode,
  customReportTemplates,
} from "./domain/custom-report-domain.types";
import {
  CustomReportInvalidQueryError,
  CustomReportTemplateNotFoundError,
} from "./domain/custom-report-errors";
import { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  otherDepartment: "10000000-0000-4000-8000-000000000002",
  user: "40000000-0000-4000-8000-000000000001",
};

const context: UserContext = {
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [],
  permissionCodes: [PermissionCode.userContextRead],
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
};

type ReportsRepositoryMock = {
  groupAchievementsByDepartmentAndType: ReturnType<typeof vi.fn>;
  listAchievementTrendItems: ReturnType<typeof vi.fn>;
  groupFeesByPayStatus: ReturnType<typeof vi.fn>;
  countOverdueFees: ReturnType<typeof vi.fn>;
  countDueSoonFees: ReturnType<typeof vi.fn>;
  groupWorkflowTasksByStatus: ReturnType<typeof vi.fn>;
  groupConversionsByStatus: ReturnType<typeof vi.fn>;
  groupConversionsByContractStatus: ReturnType<typeof vi.fn>;
  groupConversionsByRevenueStatus: ReturnType<typeof vi.fn>;
  countOverdueConversions: ReturnType<typeof vi.fn>;
  groupConversionsByEvaluationEffect: ReturnType<typeof vi.fn>;
  sumConversionAmounts: ReturnType<typeof vi.fn>;
};

const createRepositoryMock = (): ReportsRepositoryMock => ({
  groupAchievementsByDepartmentAndType: vi.fn().mockResolvedValue([
    {
      departmentId: ids.department,
      departmentCode: "BIO",
      departmentName: "生命科学学院",
      achievementType: AchievementTypeCode.paper,
      count: 2,
    },
  ]),
  listAchievementTrendItems: vi.fn().mockResolvedValue([
    { createdAt: new Date("2026-01-15T00:00:00.000Z"), type: AchievementTypeCode.paper },
    {
      createdAt: new Date("2026-01-20T00:00:00.000Z"),
      type: AchievementTypeCode.patent,
    },
  ]),
  groupFeesByPayStatus: vi.fn().mockResolvedValue([
    { key: PayStatusCode.pending, count: 4 },
    { key: PayStatusCode.paid, count: 1 },
  ]),
  countOverdueFees: vi.fn().mockResolvedValue(1),
  countDueSoonFees: vi.fn().mockResolvedValue(2),
  groupWorkflowTasksByStatus: vi.fn().mockResolvedValue([
    { key: WorkflowTaskStatusCode.pending, count: 3 },
    { key: WorkflowTaskStatusCode.approved, count: 2 },
  ]),
  groupConversionsByStatus: vi.fn().mockResolvedValue([
    { key: AchievementConversionStatusCode.signed, count: 1 },
  ]),
  groupConversionsByContractStatus: vi.fn().mockResolvedValue([
    { key: AchievementConversionContractStatusCode.active, count: 1 },
  ]),
  groupConversionsByRevenueStatus: vi.fn().mockResolvedValue([
    { key: AchievementConversionRevenueStatusCode.partial, count: 1 },
  ]),
  countOverdueConversions: vi.fn().mockResolvedValue(1),
  groupConversionsByEvaluationEffect: vi.fn().mockResolvedValue([
    { key: AchievementConversionEvaluationEffectCode.positive, count: 1 },
  ]),
  sumConversionAmounts: vi.fn().mockResolvedValue({
    contractTotal: "100000.00",
    revenueTotal: "60000.00",
  }),
});

const createPolicyQueryFactory = () => ({
  achievementReadableWhere: vi.fn().mockReturnValue({
    departmentId: { in: [ids.department] },
  } satisfies Prisma.AchievementWhereInput),
  feeReadableWhere: vi.fn().mockReturnValue({
    departmentId: { in: [ids.department] },
  } satisfies Prisma.FeeRecordWhereInput),
});

const createService = () => {
  const repository = createRepositoryMock();
  const policyQueryFactory = createPolicyQueryFactory();
  const service = new ReportsService(
    repository as unknown as ReportsRepository,
    policyQueryFactory as unknown as PolicyQueryFactory,
  );

  return { policyQueryFactory, repository, service };
};

describe("ReportsService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-18T10:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns five stable custom report templates", () => {
    const { service } = createService();

    expect(service.listTemplates(context)).toEqual(customReportTemplates);
    expect(service.listTemplates(context).map((template) => template.templateId)).toEqual([
      CustomReportTemplateIdCode.achievementDistribution,
      CustomReportTemplateIdCode.achievementTrend,
      CustomReportTemplateIdCode.feeRiskSummary,
      CustomReportTemplateIdCode.workflowEfficiency,
      CustomReportTemplateIdCode.conversionFunnel,
    ]);
  });

  it.each([
    CustomReportTemplateIdCode.achievementDistribution,
    CustomReportTemplateIdCode.achievementTrend,
    CustomReportTemplateIdCode.feeRiskSummary,
    CustomReportTemplateIdCode.workflowEfficiency,
    CustomReportTemplateIdCode.conversionFunnel,
  ])("runs %s with a stable aggregate-only response shape", async (templateId) => {
    const { service } = createService();

    const report = await service.runTemplate(context, templateId);

    expect(report.metadata).toEqual(
      expect.objectContaining({
        templateId,
        generatedAt: "2026-06-18T10:30:00.000Z",
        localDemoOnly: true,
        notProductionMonitoring: true,
      }),
    );
    expect(report.scopeSummary).toEqual({
      userId: ids.user,
      departmentId: ids.department,
      departmentScope: { departmentIds: [ids.department] },
      policy:
        templateId === CustomReportTemplateIdCode.feeRiskSummary
          ? "fee-readable"
          : templateId === CustomReportTemplateIdCode.workflowEfficiency
            ? "current-assignee"
            : "achievement-readable",
    });
    expect(report.columns.length).toBeGreaterThan(0);
    expect(Array.isArray(report.rows)).toBe(true);
    expect(report.totals).toEqual(expect.any(Object));
    expect(report.caveats).toEqual([
      "local/demo/custom report summary",
      "not full BI",
      "not production monitoring",
    ]);
  });

  it("rejects an unknown template id", async () => {
    const { service } = createService();

    await expect(service.runTemplate(context, "unknown-template")).rejects.toThrow(
      CustomReportTemplateNotFoundError,
    );
  });

  it("rejects invalid date ranges and template-specific parameters", async () => {
    const { service } = createService();

    await expect(
      service.runTemplate(context, CustomReportTemplateIdCode.achievementTrend, {
        dateFrom: new Date("2026-06-19"),
        dateTo: new Date("2026-06-18"),
      }),
    ).rejects.toThrow(CustomReportInvalidQueryError);

    await expect(
      service.runTemplate(context, CustomReportTemplateIdCode.feeRiskSummary, {
        dueSoonDays: 91,
      }),
    ).rejects.toThrow(CustomReportInvalidQueryError);

    await expect(
      service.runTemplate(context, CustomReportTemplateIdCode.feeRiskSummary, {
        groupBy: "month",
      }),
    ).rejects.toThrow(CustomReportInvalidQueryError);

    await expect(
      service.runTemplate(context, CustomReportTemplateIdCode.achievementDistribution, {
        status: "NOT_A_STATUS",
      }),
    ).rejects.toThrow(CustomReportInvalidQueryError);
  });

  it("keeps department filters as narrowing predicates on achievement reports", async () => {
    const { policyQueryFactory, repository, service } = createService();

    await service.runTemplate(context, CustomReportTemplateIdCode.achievementDistribution, {
      departmentId: ids.otherDepartment,
      achievementType: AchievementTypeCode.paper,
      status: AchievementStatusCode.archived,
    });

    expect(policyQueryFactory.achievementReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.groupAchievementsByDepartmentAndType).toHaveBeenCalledWith({
      AND: [
        { departmentId: { in: [ids.department] } },
        { departmentId: ids.otherDepartment },
        { type: AchievementTypeCode.paper },
        { status: AchievementStatusCode.archived },
        {},
      ],
    });
  });

  it("uses the achievement readable policy for conversion funnel queries", async () => {
    const { repository, service } = createService();

    await service.runTemplate(context, CustomReportTemplateIdCode.conversionFunnel, {
      achievementType: AchievementTypeCode.patent,
      status: AchievementConversionStatusCode.signed,
    });

    expect(repository.groupConversionsByStatus).toHaveBeenCalledWith({
      AND: [
        {
          achievement: {
            AND: [
              { departmentId: { in: [ids.department] } },
              {},
              { type: AchievementTypeCode.patent },
              {},
              {},
            ],
          },
        },
        {},
        { status: AchievementConversionStatusCode.signed },
        {},
      ],
    });
    expect(repository.groupConversionsByContractStatus).toHaveBeenCalledWith({
      AND: [
        {
          achievement: {
            AND: [
              { departmentId: { in: [ids.department] } },
              {},
              { type: AchievementTypeCode.patent },
              {},
              {},
            ],
          },
        },
        {},
        { status: AchievementConversionStatusCode.signed },
        {},
      ],
    });
    expect(repository.groupConversionsByRevenueStatus).toHaveBeenCalledWith(
      expect.any(Object),
    );
    expect(repository.countOverdueConversions).toHaveBeenCalledWith(
      expect.any(Object),
      new Date("2026-06-18T00:00:00.000Z"),
    );
    expect(repository.groupConversionsByEvaluationEffect).toHaveBeenCalledWith(
      expect.any(Object),
    );
  });

  it("adds aggregate-only conversion deepening totals to conversion funnel", async () => {
    const { service } = createService();

    const report = await service.runTemplate(
      context,
      CustomReportTemplateIdCode.conversionFunnel,
    );

    expect(report.columns).toEqual([
      { key: "dimension", label: "Dimension", type: "text" },
      { key: "status", label: "Status", type: "text" },
      { key: "count", label: "Count", type: "number" },
    ]);
    expect(report.rows).toEqual([
      { dimension: "conversionStatus", status: AchievementConversionStatusCode.signed, count: 1 },
      {
        dimension: "contractStatus",
        status: AchievementConversionContractStatusCode.active,
        count: 1,
      },
      {
        dimension: "revenueStatus",
        status: AchievementConversionRevenueStatusCode.partial,
        count: 1,
      },
      {
        dimension: "evaluationEffect",
        status: AchievementConversionEvaluationEffectCode.positive,
        count: 1,
      },
    ]);
    expect(report.totals).toEqual({
      count: 1,
      contractTotal: "100000.00",
      revenueTotal: "60000.00",
      localOverdue: 1,
      evaluated: 1,
    });
  });

  it("uses the fee readable policy for fee risk queries", async () => {
    const { policyQueryFactory, repository, service } = createService();

    await service.runTemplate(context, CustomReportTemplateIdCode.feeRiskSummary, {
      status: PayStatusCode.pending,
      dueSoonDays: 7,
    });

    expect(policyQueryFactory.feeReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.groupFeesByPayStatus).toHaveBeenCalledWith({
      AND: [
        { departmentId: { in: [ids.department] } },
        {},
        {},
        { payStatus: PayStatusCode.pending },
        {},
      ],
    });
    expect(repository.countDueSoonFees).toHaveBeenCalledWith(
      expect.any(Object),
      new Date("2026-06-18T00:00:00.000Z"),
      new Date("2026-06-25T00:00:00.000Z"),
    );
  });

  it("does not include raw or secret-bearing response field names", async () => {
    const { service } = createService();

    const report = await service.runTemplate(
      context,
      CustomReportTemplateIdCode.conversionFunnel,
    );
    const serialized = JSON.stringify(report);

    for (const forbidden of [
      "raw",
      "source",
      "token",
      "cookie",
      "password",
      "connectionString",
      "DATABASE_URL",
      "objectKey",
      "checksum",
      "payment",
      "legal",
      "externalPayload",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
