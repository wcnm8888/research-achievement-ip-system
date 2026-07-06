import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  AchievementConversionEvaluationEffectCode,
  AchievementConversionStatusCode,
} from "../achievement-conversions/domain/achievement-conversion-domain.types";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import {
  maxCustomReportDueSoonDays,
  minCustomReportDueSoonDays,
} from "./dto/custom-report-run-query.dto";
import {
  CountBucket,
  ConversionAggregateStatusCode,
  CustomReportGroupBy,
  CustomReportRunFilters,
  CustomReportRunOptions,
  CustomReportRunResult,
  CustomReportTemplate,
  CustomReportTemplateId,
  CustomReportTemplateIdCode,
  customReportCaveats,
  customReportTemplates,
} from "./domain/custom-report-domain.types";
import {
  CustomReportAccessDeniedError,
  CustomReportInvalidQueryError,
  CustomReportTemplateNotFoundError,
} from "./domain/custom-report-errors";
import { ReportsRepository } from "./reports.repository";

const defaultDueSoonDays = 30;
const dateOnlyLength = 10;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ReportsRepository)
    private readonly repository: ReportsRepository,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
  ) {}

  listTemplates(context: UserContext): readonly CustomReportTemplate[] {
    this.assertUserContext(context);

    return customReportTemplates;
  }

  async runTemplate(
    context: UserContext,
    templateId: string,
    options: CustomReportRunOptions = {},
  ): Promise<CustomReportRunResult> {
    this.assertUserContext(context);

    const template = getTemplate(templateId);
    const normalizedOptions = normalizeOptions(template.templateId, options);
    const generatedAt = new Date();

    switch (template.templateId) {
      case CustomReportTemplateIdCode.achievementDistribution:
        return this.runAchievementDistribution(context, template, normalizedOptions, generatedAt);
      case CustomReportTemplateIdCode.achievementTrend:
        return this.runAchievementTrend(context, template, normalizedOptions, generatedAt);
      case CustomReportTemplateIdCode.feeRiskSummary:
        return this.runFeeRiskSummary(context, template, normalizedOptions, generatedAt);
      case CustomReportTemplateIdCode.workflowEfficiency:
        return this.runWorkflowEfficiency(context, template, normalizedOptions, generatedAt);
      case CustomReportTemplateIdCode.conversionFunnel:
        return this.runConversionFunnel(context, template, normalizedOptions, generatedAt);
    }
  }

  private async runAchievementDistribution(
    context: UserContext,
    template: CustomReportTemplate,
    options: NormalizedOptions,
    generatedAt: Date,
  ): Promise<CustomReportRunResult> {
    const achievementWhere = buildAchievementWhere(
      this.policyQueryFactory.achievementReadableWhere(context),
      options,
    );
    const buckets =
      await this.repository.groupAchievementsByDepartmentAndType(achievementWhere);
    const rows = buckets.map((bucket) => ({
      departmentId: bucket.departmentId,
      departmentCode: bucket.departmentCode,
      departmentName: bucket.departmentName,
      achievementType: bucket.achievementType,
      count: bucket.count,
    }));

    return baseReportResult(context, template, options, generatedAt, "achievement-readable", {
      columns: [
        { key: "departmentCode", label: "Department code", type: "text" },
        { key: "departmentName", label: "Department name", type: "text" },
        { key: "achievementType", label: "Achievement type", type: "text" },
        { key: "count", label: "Count", type: "number" },
      ],
      rows,
      totals: { count: sumRows(rows, "count") },
    });
  }

  private async runAchievementTrend(
    context: UserContext,
    template: CustomReportTemplate,
    options: NormalizedOptions,
    generatedAt: Date,
  ): Promise<CustomReportRunResult> {
    const groupBy = options.groupBy ?? "month";
    const achievementWhere = buildAchievementWhere(
      this.policyQueryFactory.achievementReadableWhere(context),
      { ...options, status: undefined },
    );
    const items = await this.repository.listAchievementTrendItems(achievementWhere);
    const bucketMap = new Map<string, { period: string; achievementType: string; count: number }>();

    for (const item of items) {
      const period = formatPeriod(item.createdAt, groupBy);
      const key = `${period}:${item.type}`;
      const existing = bucketMap.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        bucketMap.set(key, {
          period,
          achievementType: item.type,
          count: 1,
        });
      }
    }

    const rows = [...bucketMap.values()].sort((left, right) =>
      left.period === right.period
        ? left.achievementType.localeCompare(right.achievementType)
        : left.period.localeCompare(right.period),
    );

    return baseReportResult(
      context,
      template,
      { ...options, groupBy },
      generatedAt,
      "achievement-readable",
      {
        columns: [
          { key: "period", label: "Period", type: "text" },
          { key: "achievementType", label: "Achievement type", type: "text" },
          { key: "count", label: "Count", type: "number" },
        ],
        rows,
        totals: { count: sumRows(rows, "count") },
      },
    );
  }

  private async runFeeRiskSummary(
    context: UserContext,
    template: CustomReportTemplate,
    options: NormalizedOptions,
    generatedAt: Date,
  ): Promise<CustomReportRunResult> {
    const dueSoonDays = options.dueSoonDays ?? defaultDueSoonDays;
    const todayDateOnly = toUtcDateOnly(generatedAt);
    const dueSoonEndDateOnly = addUtcDays(todayDateOnly, dueSoonDays);
    const feeWhere = buildFeeWhere(
      this.policyQueryFactory.feeReadableWhere(context),
      options,
    );
    const [statusBuckets, overdueCount, dueSoonCount] = await Promise.all([
      this.repository.groupFeesByPayStatus(feeWhere),
      this.repository.countOverdueFees(feeWhere, todayDateOnly),
      this.repository.countDueSoonFees(feeWhere, todayDateOnly, dueSoonEndDateOnly),
    ]);
    const rows = [
      ...statusBuckets.map((bucket) => ({
        bucket: bucket.key,
        count: bucket.count,
      })),
      { bucket: "OVERDUE_RISK", count: overdueCount },
      { bucket: "DUE_SOON_RISK", count: dueSoonCount },
    ];

    return baseReportResult(
      context,
      template,
      { ...options, dueSoonDays },
      generatedAt,
      "fee-readable",
      {
        columns: [
          { key: "bucket", label: "Bucket", type: "text" },
          { key: "count", label: "Count", type: "number" },
        ],
        rows,
        totals: {
          count: sumRows(statusBuckets, "count"),
          overdue: overdueCount,
          dueSoon: dueSoonCount,
        },
      },
    );
  }

  private async runWorkflowEfficiency(
    context: UserContext,
    template: CustomReportTemplate,
    options: NormalizedOptions,
    generatedAt: Date,
  ): Promise<CustomReportRunResult> {
    const workflowWhere = buildWorkflowWhere(context, options);
    const buckets = await this.repository.groupWorkflowTasksByStatus(workflowWhere);
    const rows = buckets.map((bucket) => ({
      status: bucket.key,
      count: bucket.count,
    }));

    return baseReportResult(context, template, options, generatedAt, "current-assignee", {
      columns: [
        { key: "status", label: "Task status", type: "text" },
        { key: "count", label: "Count", type: "number" },
      ],
      rows,
      totals: {
        count: sumRows(rows, "count"),
        pending: countBucket(buckets, WorkflowTaskStatusCode.pending),
        approved: countBucket(buckets, WorkflowTaskStatusCode.approved),
        rejected: countBucket(buckets, WorkflowTaskStatusCode.rejected),
        cancelled: countBucket(buckets, WorkflowTaskStatusCode.cancelled),
      },
    });
  }

  private async runConversionFunnel(
    context: UserContext,
    template: CustomReportTemplate,
    options: NormalizedOptions,
    generatedAt: Date,
  ): Promise<CustomReportRunResult> {
    const achievementWhere = buildAchievementWhere(
      this.policyQueryFactory.achievementReadableWhere(context),
      { ...options, status: undefined },
    );
    const conversionWhere = buildConversionWhere(achievementWhere, options);
    const todayDateOnly = toUtcDateOnly(generatedAt);
    const [
      statusBuckets,
      contractStatusBuckets,
      revenueStatusBuckets,
      overdueCount,
      evaluationEffectBuckets,
      amountSummary,
    ] = await Promise.all([
      this.repository.groupConversionsByStatus(conversionWhere),
      this.repository.groupConversionsByContractStatus(conversionWhere),
      this.repository.groupConversionsByRevenueStatus(conversionWhere),
      this.repository.countOverdueConversions(conversionWhere, todayDateOnly),
      this.repository.groupConversionsByEvaluationEffect(conversionWhere),
      this.repository.sumConversionAmounts(conversionWhere),
    ]);
    const rows = [
      ...toConversionAggregateRows("conversionStatus", statusBuckets),
      ...toConversionAggregateRows("contractStatus", contractStatusBuckets),
      ...toConversionAggregateRows("revenueStatus", revenueStatusBuckets),
      ...toConversionAggregateRows("evaluationEffect", evaluationEffectBuckets),
    ];

    return baseReportResult(context, template, options, generatedAt, "achievement-readable", {
      columns: [
        { key: "dimension", label: "Dimension", type: "text" },
        { key: "status", label: "Status", type: "text" },
        { key: "count", label: "Count", type: "number" },
      ],
      rows,
      totals: {
        count: sumRows(statusBuckets, "count"),
        contractTotal: amountSummary.contractTotal,
        revenueTotal: amountSummary.revenueTotal,
        localOverdue: overdueCount,
        evaluated: countEvaluatedConversions(evaluationEffectBuckets),
      },
    });
  }

  private assertUserContext(context: UserContext | null | undefined): asserts context is UserContext {
    if (!context) {
      throw new CustomReportAccessDeniedError();
    }
  }
}

type NormalizedOptions = Omit<CustomReportRunOptions, "status"> & {
  status?: CustomReportRunFilters["status"];
};

const getTemplate = (templateId: string): CustomReportTemplate => {
  const template = customReportTemplates.find((item) => item.templateId === templateId);

  if (!template) {
    throw new CustomReportTemplateNotFoundError(templateId);
  }

  return template;
};

const normalizeOptions = (
  templateId: CustomReportTemplateId,
  options: CustomReportRunOptions,
): NormalizedOptions => {
  if (options.dateFrom && Number.isNaN(options.dateFrom.getTime())) {
    throw new CustomReportInvalidQueryError("dateFrom must be a valid date.");
  }

  if (options.dateTo && Number.isNaN(options.dateTo.getTime())) {
    throw new CustomReportInvalidQueryError("dateTo must be a valid date.");
  }

  if (options.dateFrom && options.dateTo && options.dateFrom > options.dateTo) {
    throw new CustomReportInvalidQueryError("dateFrom must be before or equal to dateTo.");
  }

  if (options.groupBy !== undefined && templateId !== CustomReportTemplateIdCode.achievementTrend) {
    throw new CustomReportInvalidQueryError("groupBy is only supported by achievement-trend.");
  }

  if (options.dueSoonDays !== undefined && templateId !== CustomReportTemplateIdCode.feeRiskSummary) {
    throw new CustomReportInvalidQueryError(
      "dueSoonDays is only supported by fee-risk-summary.",
    );
  }

  if (
    options.dueSoonDays !== undefined &&
    (options.dueSoonDays < minCustomReportDueSoonDays ||
      options.dueSoonDays > maxCustomReportDueSoonDays)
  ) {
    throw new CustomReportInvalidQueryError("dueSoonDays must be between 1 and 90.");
  }

  return {
    ...options,
    status: normalizeStatus(templateId, options.status),
  };
};

const normalizeStatus = (
  templateId: CustomReportTemplateId,
  status: string | undefined,
): NormalizedOptions["status"] => {
  if (status === undefined) {
    return undefined;
  }

  const allowedStatuses = getAllowedStatuses(templateId);

  if (!allowedStatuses.includes(status)) {
    throw new CustomReportInvalidQueryError(
      `status is not supported by ${templateId}.`,
    );
  }

  return status as NormalizedOptions["status"];
};

const getAllowedStatuses = (templateId: CustomReportTemplateId): readonly string[] => {
  switch (templateId) {
    case CustomReportTemplateIdCode.achievementDistribution:
    case CustomReportTemplateIdCode.achievementTrend:
      return Object.values(AchievementStatusCode);
    case CustomReportTemplateIdCode.feeRiskSummary:
      return Object.values(PayStatusCode);
    case CustomReportTemplateIdCode.workflowEfficiency:
      return Object.values(WorkflowTaskStatusCode);
    case CustomReportTemplateIdCode.conversionFunnel:
      return Object.values(AchievementConversionStatusCode);
  }
};

const baseReportResult = (
  context: UserContext,
  template: CustomReportTemplate,
  options: NormalizedOptions,
  generatedAt: Date,
  policy: CustomReportRunResult["scopeSummary"]["policy"],
  result: Pick<CustomReportRunResult, "columns" | "rows" | "totals">,
): CustomReportRunResult => ({
  metadata: {
    templateId: template.templateId,
    name: template.name,
    description: template.description,
    generatedAt: generatedAt.toISOString(),
    localDemoOnly: true,
    notProductionMonitoring: true,
  },
  filters: toResponseFilters(options),
  scopeSummary: {
    userId: context.userId,
    departmentId: context.departmentId,
    departmentScope: {
      departmentIds: context.scopedDepartmentIds,
    },
    policy,
  },
  columns: result.columns,
  rows: result.rows,
  totals: result.totals,
  caveats: [...customReportCaveats],
});

const toResponseFilters = (options: NormalizedOptions): CustomReportRunFilters => ({
  dateFrom: options.dateFrom ? toDateOnlyString(options.dateFrom) : undefined,
  dateTo: options.dateTo ? toDateOnlyString(options.dateTo) : undefined,
  departmentId: options.departmentId,
  achievementType: options.achievementType,
  status: options.status,
  groupBy: options.groupBy,
  dueSoonDays: options.dueSoonDays,
});

const buildAchievementWhere = (
  policyWhere: Prisma.AchievementWhereInput,
  options: NormalizedOptions,
): Prisma.AchievementWhereInput => ({
  AND: [
    policyWhere,
    options.departmentId === undefined ? {} : { departmentId: options.departmentId },
    options.achievementType === undefined ? {} : { type: options.achievementType },
    options.status === undefined
      ? {}
      : { status: options.status as AchievementStatusCode },
    buildCreatedAtWhere(options),
  ],
});

const buildFeeWhere = (
  policyWhere: Prisma.FeeRecordWhereInput,
  options: NormalizedOptions,
): Prisma.FeeRecordWhereInput => ({
  AND: [
    policyWhere,
    options.departmentId === undefined ? {} : { departmentId: options.departmentId },
    options.achievementType === undefined
      ? {}
      : { achievement: { type: options.achievementType } },
    options.status === undefined ? {} : { payStatus: options.status as PayStatusCode },
    buildDueDateWhere(options),
  ],
});

const buildWorkflowWhere = (
  context: UserContext,
  options: NormalizedOptions,
): Prisma.WorkflowTaskWhereInput => ({
  AND: [
    { assigneeId: context.userId },
    options.departmentId === undefined || context.scopedDepartmentIds.includes(options.departmentId)
      ? {}
      : { id: { in: [] } },
    options.status === undefined
      ? {}
      : { status: options.status as WorkflowTaskStatusCode },
    buildCreatedAtWhere(options),
  ],
});

const buildConversionWhere = (
  achievementWhere: Prisma.AchievementWhereInput,
  options: NormalizedOptions,
): Prisma.AchievementConversionWhereInput => ({
  AND: [
    { achievement: achievementWhere },
    options.departmentId === undefined ? {} : { departmentId: options.departmentId },
    options.status === undefined
      ? {}
      : { status: options.status as AchievementConversionStatusCode },
    buildConversionDateWhere(options),
  ],
});

const buildCreatedAtWhere = <T extends { createdAt?: Prisma.DateTimeFilter }>(
  options: NormalizedOptions,
): T => {
  const range = buildDateTimeRange(options);

  return range === undefined ? ({} as T) : ({ createdAt: range } as T);
};

const buildDueDateWhere = (
  options: NormalizedOptions,
): Prisma.FeeRecordWhereInput => {
  const range = buildDateTimeRange(options);

  return range === undefined ? {} : { dueDate: range };
};

const buildConversionDateWhere = (
  options: NormalizedOptions,
): Prisma.AchievementConversionWhereInput => {
  const range = buildDateTimeRange(options);

  return range === undefined ? {} : { conversionDate: range };
};

const buildDateTimeRange = (
  options: Pick<NormalizedOptions, "dateFrom" | "dateTo">,
): Prisma.DateTimeFilter | undefined => {
  if (!options.dateFrom && !options.dateTo) {
    return undefined;
  }

  return {
    gte: options.dateFrom,
    lte: options.dateTo,
  };
};

const sumRows = <T extends Record<string, unknown>>(rows: readonly T[], key: keyof T): number =>
  rows.reduce((sum, row) => sum + (typeof row[key] === "number" ? row[key] : 0), 0);

const countBucket = <T extends string>(
  buckets: readonly CountBucket<T>[],
  key: T,
): number => buckets.find((bucket) => bucket.key === key)?.count ?? 0;

const toConversionAggregateRows = <T extends ConversionAggregateStatusCode>(
  dimension: string,
  buckets: readonly CountBucket<T>[],
) =>
  buckets.map((bucket) => ({
    dimension,
    status: bucket.key,
    count: bucket.count,
  }));

const countEvaluatedConversions = (
  buckets: readonly CountBucket<AchievementConversionEvaluationEffectCode>[],
): number =>
  buckets
    .filter((bucket) => bucket.key !== AchievementConversionEvaluationEffectCode.notEvaluated)
    .reduce((sum, bucket) => sum + bucket.count, 0);

const formatPeriod = (date: Date, groupBy: CustomReportGroupBy): string => {
  const year = date.getUTCFullYear().toString();

  if (groupBy === "year") {
    return year;
  }

  return `${year}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
};

const toUtcDateOnly = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);

  return result;
};

const toDateOnlyString = (date: Date): string =>
  date.toISOString().slice(0, dateOnlyLength);
