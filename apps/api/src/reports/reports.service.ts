import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  AchievementConversionEvaluationEffectCode,
  AchievementConversionStatusCode,
} from "../achievement-conversions/domain/achievement-conversion-domain.types";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import { PermissionCode } from "../authorization/constants/permission-code";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { createCsv, CsvColumn } from "../export/csv";
import { createSimplePdf } from "../export/pdf";
import { createXlsx } from "../export/xlsx";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { NotificationService } from "../notifications/notification.service";
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
  ScheduledReportEmailResult,
  ScheduledReportPlan,
  ScheduledReportPreviewResult,
  customReportCaveats,
  customReportTemplates,
} from "./domain/custom-report-domain.types";
import {
  CustomReportAccessDeniedError,
  CustomReportInvalidQueryError,
  CustomReportTemplateNotFoundError,
} from "./domain/custom-report-errors";
import {
  ReportEmailDeliveryResult,
  ReportEmailDeliveryService,
} from "./report-email-delivery.service";
import { ReportsRepository } from "./reports.repository";

const defaultDueSoonDays = 30;
const dateOnlyLength = 10;
const exportRowLimit = 1000;
const scheduledReportPreviewCaveats = [
  "本地定时报表预演",
  "站内信为本地摘要",
  "邮件通道为后续可接入能力",
] as const;
const scheduledReportEmailCaveats = [
  "手动邮件推送",
  "摘要正文发送，不附带原始明细",
  "真实外发取决于服务器邮件环境变量和 dry-run 开关",
] as const;

const scheduledReportPlans: readonly ScheduledReportPlan[] = [
  {
    planId: "monthly-achievement-distribution",
    name: "科研成果月报",
    cadence: "MONTHLY",
    templateId: CustomReportTemplateIdCode.achievementDistribution,
    recipientScope: "DEPARTMENT_MANAGERS",
    nextPeriodLabel: "下月初",
    channels: ["IN_APP", "EMAIL_RESERVED"],
    inAppDelivery: "LOCAL_PREVIEW",
    emailDelivery: "RESERVED_INTERFACE",
  },
  {
    planId: "quarterly-fee-risk-summary",
    name: "费用风险季报",
    cadence: "QUARTERLY",
    templateId: CustomReportTemplateIdCode.feeRiskSummary,
    recipientScope: "INSTITUTE_REVIEWERS",
    nextPeriodLabel: "下季度首月",
    channels: ["IN_APP", "EMAIL_RESERVED"],
    inAppDelivery: "LOCAL_PREVIEW",
    emailDelivery: "RESERVED_INTERFACE",
  },
  {
    planId: "yearly-workflow-efficiency",
    name: "审批效率年报",
    cadence: "YEARLY",
    templateId: CustomReportTemplateIdCode.workflowEfficiency,
    recipientScope: "CURRENT_USER",
    nextPeriodLabel: "下一年度初",
    channels: ["IN_APP", "EMAIL_RESERVED"],
    inAppDelivery: "LOCAL_PREVIEW",
    emailDelivery: "RESERVED_INTERFACE",
  },
];

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ReportsRepository)
    private readonly repository: ReportsRepository,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(ReportEmailDeliveryService)
    private readonly reportEmailDeliveryService: ReportEmailDeliveryService,
  ) {}

  listTemplates(context: UserContext): readonly CustomReportTemplate[] {
    this.assertUserContext(context);

    return customReportTemplates;
  }

  listScheduledPlans(context: UserContext): readonly ScheduledReportPlan[] {
    this.assertUserContext(context);

    return scheduledReportPlans;
  }

  async previewScheduledPlan(
    context: UserContext,
    planId: string,
  ): Promise<ScheduledReportPreviewResult> {
    this.assertUserContext(context);

    const plan = getScheduledReportPlan(planId);
    const report = await this.runTemplate(
      context,
      plan.templateId,
      getScheduledReportPreviewOptions(plan.cadence),
    );
    const generatedAt = new Date().toISOString();
    const notificationTitle = `${plan.name}生成预演`;
    const notificationContent = buildScheduledReportNotificationContent(plan, report);
    const notification = await this.notificationService.sendInAppNotification({
      receiverId: context.userId,
      title: notificationTitle,
      content: notificationContent,
      sentAt: new Date(generatedAt),
    });

    return {
      plan,
      generatedAt,
      report,
      delivery: {
        inApp: {
          status: "LOCAL_PREVIEW_CREATED",
          notificationId: notification.id,
          title: notificationTitle,
          content: notificationContent,
        },
        email: {
          status: "RESERVED_INTERFACE",
          message: "邮件通道预留，当前本地预演不连接真实邮件服务。",
        },
      },
      caveats: [...scheduledReportPreviewCaveats],
    };
  }

  async sendScheduledPlanEmail(
    context: UserContext,
    planId: string,
  ): Promise<ScheduledReportEmailResult> {
    this.assertUserContext(context);

    const plan = getScheduledReportPlan(planId);
    const report = await this.runTemplate(
      context,
      plan.templateId,
      getScheduledReportPreviewOptions(plan.cadence),
    );
    const generatedAt = new Date().toISOString();
    const recipients = await this.resolveReportEmailRecipients(context);
    const deliveryResults = recipients.length === 0
      ? [createNoRecipientReportEmailResult()]
      : await Promise.all(
          recipients.map((recipient) =>
            this.reportEmailDeliveryService.send({
              deliveryId: `${plan.planId}-${generatedAt}-${recipient.maskedEmail}`,
              toAddress: recipient.email,
              subject: buildScheduledReportEmailSubject(plan),
              textBody: buildScheduledReportEmailTextBody(plan, report, generatedAt),
              htmlBody: buildScheduledReportEmailHtmlBody(plan, report, generatedAt),
            }),
          ),
        );
    const emailSummary = summarizeReportEmailDelivery(deliveryResults, recipients);

    await this.recordTemplateEmailEvent(context, plan, report, emailSummary);

    return {
      plan,
      generatedAt,
      report,
      delivery: {
        email: {
          ...emailSummary,
          message: buildReportEmailDeliveryMessage(emailSummary),
        },
      },
      caveats: [...scheduledReportEmailCaveats],
    };
  }

  async sendDueScheduledReportEmails(
    options: { now?: Date } = {},
  ): Promise<ScheduledReportEmailResult[]> {
    const now = options.now ?? new Date();
    const duePlans = scheduledReportPlans.filter((plan) =>
      isScheduledReportDue(plan, now),
    );
    const context = buildScheduledReportSystemContext();
    const results: ScheduledReportEmailResult[] = [];

    for (const plan of duePlans) {
      results.push(await this.sendScheduledPlanEmail(context, plan.planId));
    }

    return results;
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

  async exportTemplateCsv(
    context: UserContext,
    templateId: string,
    options: CustomReportRunOptions = {},
  ): Promise<string> {
    const dataset = await this.buildTemplateExportDataset(context, templateId, options);

    await this.recordTemplateExportEvent(context, dataset, "CSV");

    return createCsv(dataset.columns, dataset.rows);
  }

  async exportTemplateXlsx(
    context: UserContext,
    templateId: string,
    options: CustomReportRunOptions = {},
  ): Promise<Buffer> {
    const dataset = await this.buildTemplateExportDataset(context, templateId, options);

    await this.recordTemplateExportEvent(context, dataset, "XLSX");

    return createXlsx(dataset.columns, dataset.rows, "Custom Report");
  }

  async exportTemplatePdf(
    context: UserContext,
    templateId: string,
    options: CustomReportRunOptions = {},
  ): Promise<Buffer> {
    const dataset = await this.buildTemplateExportDataset(context, templateId, options);

    await this.recordTemplateExportEvent(context, dataset, "PDF");

    return createSimplePdf("Custom Report Export", dataset.columns, dataset.rows);
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

  private async buildTemplateExportDataset(
    context: UserContext,
    templateId: string,
    options: CustomReportRunOptions,
  ): Promise<CustomReportExportDataset> {
    const report = await this.runTemplate(context, templateId, options);

    return {
      templateId: report.metadata.templateId,
      columns: report.columns.map((column) => ({
        key: column.key,
        header: column.label,
      })),
      rows: report.rows.slice(0, exportRowLimit),
    };
  }

  private async recordTemplateExportEvent(
    context: UserContext,
    dataset: CustomReportExportDataset,
    format: ExportFormat,
  ): Promise<void> {
    await this.auditService.recordEvent({
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.configUpdate,
      target: {
        type: AuditTargetTypeCode.systemConfig,
      },
      oldValue: null,
      newValue: {
        operation: `EXPORT_${format}`,
        exportType: "CUSTOM_REPORT",
        templateId: dataset.templateId,
        rowCount: dataset.rows.length,
        rowLimit: exportRowLimit,
      },
    });
  }

  private async recordTemplateEmailEvent(
    context: UserContext,
    plan: ScheduledReportPlan,
    report: CustomReportRunResult,
    emailSummary: Omit<ScheduledReportEmailResult["delivery"]["email"], "message">,
  ): Promise<void> {
    await this.auditService.recordEvent({
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.configUpdate,
      target: {
        type: AuditTargetTypeCode.systemConfig,
      },
      oldValue: null,
      newValue: {
        operation: "SEND_EMAIL",
        exportType: "CUSTOM_REPORT_EMAIL",
        templateId: report.metadata.templateId,
        planId: plan.planId,
        rowCount: report.rows.length,
        recipientScope: plan.recipientScope,
        recipientCount: emailSummary.recipientCount,
        emailMasked: emailSummary.recipientMasks.join(","),
        adapter: emailSummary.adapter,
        status: emailSummary.status,
        dryRun: emailSummary.dryRun,
        attemptCount: emailSummary.attemptCount,
      },
    });
  }

  private async resolveReportEmailRecipients(
    context: UserContext,
  ): Promise<ReportEmailRecipient[]> {
    const configuredRecipients = parseConfiguredReportEmailRecipients(process.env.REPORT_EMAIL_RECIPIENTS);
    if (configuredRecipients.length > 0) {
      return configuredRecipients;
    }

    const currentUser = await this.repository.findUserEmailById(context.userId);
    if (!currentUser?.email) {
      return [];
    }

    return [
      {
        email: currentUser.email,
        maskedEmail: maskEmail(currentUser.email),
      },
    ];
  }
}

type ExportFormat = "CSV" | "XLSX" | "PDF";

type CustomReportExportDataset = {
  templateId: CustomReportTemplateId;
  columns: CsvColumn<CustomReportRunResult["rows"][number]>[];
  rows: CustomReportRunResult["rows"];
};

type ReportEmailRecipient = {
  email: string;
  maskedEmail: string;
};

type NormalizedOptions = Omit<CustomReportRunOptions, "status"> & {
  status?: CustomReportRunFilters["status"];
};

const getScheduledReportPlan = (planId: string): ScheduledReportPlan => {
  const plan = scheduledReportPlans.find((item) => item.planId === planId);

  if (!plan) {
    throw new CustomReportTemplateNotFoundError(planId);
  }

  return plan;
};

const isScheduledReportDue = (plan: ScheduledReportPlan, now: Date): boolean => {
  if (process.env.REPORT_EMAIL_SCHEDULER_SEND_ALL_ON_TICK === "true") {
    return true;
  }

  const dayOfMonth = now.getUTCDate();
  const month = now.getUTCMonth();
  if (plan.cadence === "MONTHLY") {
    return dayOfMonth === 1;
  }
  if (plan.cadence === "QUARTERLY") {
    return dayOfMonth === 1 && [0, 3, 6, 9].includes(month);
  }
  return dayOfMonth === 1 && month === 0;
};

const buildScheduledReportSystemContext = (): UserContext => {
  const userId =
    process.env.REPORT_EMAIL_SCHEDULER_ACTOR_USER_ID ??
    "00000000-0000-4000-8000-000000000000";
  const departmentId =
    process.env.REPORT_EMAIL_SCHEDULER_ACTOR_DEPARTMENT_ID ??
    "00000000-0000-4000-8000-000000000000";

  return {
    userId,
    departmentId,
    roleIds: [],
    roleCodes: [],
    permissionCodes: [
      PermissionCode.userContextRead,
      PermissionCode.achievementReadDepartment,
      PermissionCode.feeReadDepartment,
      PermissionCode.reminderReadDepartment,
    ],
    roleScopes: [],
    scopedDepartmentIds: [departmentId],
  };
};

const getTemplate = (templateId: string): CustomReportTemplate => {
  const template = customReportTemplates.find((item) => item.templateId === templateId);

  if (!template) {
    throw new CustomReportTemplateNotFoundError(templateId);
  }

  return template;
};

const getScheduledReportPreviewOptions = (
  cadence: ScheduledReportPlan["cadence"],
): CustomReportRunOptions => {
  const today = new Date();
  const dateTo = toUtcDateOnly(today);
  const dateFrom = new Date(dateTo);

  if (cadence === "MONTHLY") {
    dateFrom.setUTCMonth(dateFrom.getUTCMonth() - 1);
    return { dateFrom, dateTo };
  }

  if (cadence === "QUARTERLY") {
    dateFrom.setUTCMonth(dateFrom.getUTCMonth() - 3);
    return { dateFrom, dateTo, dueSoonDays: defaultDueSoonDays };
  }

  dateFrom.setUTCFullYear(dateFrom.getUTCFullYear() - 1);
  return { dateFrom, dateTo };
};

const buildScheduledReportNotificationContent = (
  plan: ScheduledReportPlan,
  report: CustomReportRunResult,
): string => {
  const rowCount = report.rows.length;
  const totalCount = report.totals.count;
  const countSummary = typeof totalCount === "number" ? `，汇总数量 ${totalCount}` : "";

  return `${plan.name}已完成本地生成预演：${report.metadata.name}，汇总行 ${rowCount}${countSummary}。邮件通道为预留接口，当前不发送外部邮件。`;
};

const buildScheduledReportEmailSubject = (plan: ScheduledReportPlan): string =>
  `Research IP System - ${formatScheduledCadenceEn(plan.cadence)} Report Summary`;

const buildScheduledReportEmailTextBody = (
  plan: ScheduledReportPlan,
  report: CustomReportRunResult,
  generatedAt: string,
): string => {
  const totalCount = report.totals.count;
  return [
    "研究院科研成果与知识产权管理系统报表推送",
    "",
    `报表计划：${plan.name}`,
    `报表模板：${report.metadata.name}`,
    `生成时间：${generatedAt}`,
    `汇总行数：${report.rows.length}`,
    `汇总数量：${typeof totalCount === "number" ? totalCount : "未返回"}`,
    `接收范围：${plan.recipientScope}`,
    "",
    "本邮件为一期本地评审提交版的手动报表推送摘要。",
    "当前邮件正文只包含聚合摘要，不附带原始明细或敏感附件；如需 CSV/Excel/PDF，请登录系统按权限导出。",
  ].join("\n");
};

const buildScheduledReportEmailHtmlBody = (
  plan: ScheduledReportPlan,
  report: CustomReportRunResult,
  generatedAt: string,
): string => {
  const totalCount = report.totals.count;
  const rows: Array<[string, string]> = [
    ["报表计划", plan.name],
    ["报表模板", report.metadata.name],
    ["生成时间", generatedAt],
    ["统计周期", formatScheduledCadence(plan.cadence)],
    ["汇总行数", String(report.rows.length)],
    ["汇总数量", typeof totalCount === "number" ? String(totalCount) : "未返回"],
    ["接收范围", formatScheduledRecipientScope(plan.recipientScope)],
    ["发送方式", "手动触发邮件推送"],
  ];

  return [
    '<!doctype html><html><head><meta charset="UTF-8"></head>',
    '<body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">',
    '<div style="max-width:720px;margin:0 auto;padding:24px;">',
    '<div style="background:#ffffff;border:1px solid #d8e0ea;border-radius:8px;overflow:hidden;">',
    '<div style="background:#0f5f7a;color:#ffffff;padding:18px 22px;">',
    `<div style="font-size:18px;font-weight:700;">${htmlEscape("研究院科研成果与知识产权管理系统")}</div>`,
    `<div style="font-size:13px;margin-top:6px;opacity:.9;">${htmlEscape("一期本地评审提交版 / local-demo / 邮件通道真实发送验证")}</div>`,
    '</div>',
    '<div style="padding:22px;">',
    `<h2 style="margin:0 0 12px;font-size:20px;color:#0f172a;">${htmlEscape("报表推送摘要")}</h2>`,
    `<p style="margin:0 0 18px;line-height:1.7;">${htmlEscape("系统已生成一份聚合报表摘要。邮件正文只包含汇总信息，不包含成果明细、涉密数据或附件。")}</p>`,
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">',
    ...rows.map(([label, value]) =>
      [
        '<tr>',
        `<td style="width:128px;padding:10px 12px;border:1px solid #e5e7eb;background:#f8fafc;color:#475569;">${htmlEscape(label)}</td>`,
        `<td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111827;">${htmlEscape(value)}</td>`,
        '</tr>',
      ].join(""),
    ),
    '</table>',
    `<p style="margin:18px 0 0;line-height:1.7;color:#475569;">${htmlEscape("如需查看 CSV、Excel 或 PDF 文件，请登录系统并按当前账号权限导出。")}</p>`,
    '</div>',
    '<div style="border-top:1px solid #e5e7eb;padding:14px 22px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6;">',
    htmlEscape("本邮件由本地评审环境自动发送，用于验证邮件通知 API 对接能力；请勿直接回复。"),
    '</div>',
    '</div>',
    '</div>',
    '</body></html>',
  ].join("");
};

const formatScheduledCadence = (cadence: ScheduledReportPlan["cadence"]): string => {
  if (cadence === "MONTHLY") {
    return "月报";
  }
  if (cadence === "QUARTERLY") {
    return "季报";
  }
  return "年报";
};

const formatScheduledCadenceEn = (cadence: ScheduledReportPlan["cadence"]): string => {
  if (cadence === "MONTHLY") {
    return "Monthly";
  }
  if (cadence === "QUARTERLY") {
    return "Quarterly";
  }
  return "Yearly";
};

const formatScheduledRecipientScope = (
  scope: ScheduledReportPlan["recipientScope"],
): string => {
  if (scope === "CURRENT_USER") {
    return "当前用户";
  }
  if (scope === "DEPARTMENT_MANAGERS") {
    return "部门负责人";
  }
  return "院级评审人员";
};

const htmlEscape = (value: string): string =>
  Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0);
      if (!codePoint) {
        return "";
      }
      if (character === "&") {
        return "&amp;";
      }
      if (character === "<") {
        return "&lt;";
      }
      if (character === ">") {
        return "&gt;";
      }
      if (character === '"') {
        return "&quot;";
      }
      return codePoint > 127 ? `&#${codePoint};` : character;
    })
    .join("");

const parseConfiguredReportEmailRecipients = (
  value: string | undefined,
): ReportEmailRecipient[] =>
  [...new Set((value ?? "").split(/[;,]/).map((item) => item.trim()).filter(Boolean))]
    .filter(isValidEmailAddress)
    .map((email) => ({ email, maskedEmail: maskEmail(email) }));

const isValidEmailAddress = (email: string): boolean =>
  email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const summarizeReportEmailDelivery = (
  results: readonly ReportEmailDeliveryResult[],
  recipients: readonly ReportEmailRecipient[],
): Omit<ScheduledReportEmailResult["delivery"]["email"], "message"> => ({
  status: pickReportEmailSummaryStatus(results),
  adapter: [...new Set(results.map((result) => result.adapter))].join(","),
  recipientCount: recipients.length,
  recipientMasks: recipients.map((recipient) => recipient.maskedEmail),
  dryRun: results.every((result) => result.dryRun),
  attemptCount: results.reduce((sum, result) => sum + result.attemptCount, 0),
  providerMessageIds: results
    .map((result) => result.providerMessageId)
    .filter((value): value is string => Boolean(value)),
});

const pickReportEmailSummaryStatus = (
  results: readonly ReportEmailDeliveryResult[],
): ScheduledReportEmailResult["delivery"]["email"]["status"] => {
  if (results.some((result) => result.status === "SENT")) {
    return "SENT";
  }
  if (results.some((result) => result.status === "DRY_RUN")) {
    return "DRY_RUN";
  }
  if (results.some((result) => result.status === "TEMPORARY_FAILURE")) {
    return "TEMPORARY_FAILURE";
  }
  if (results.some((result) => result.status === "RATE_LIMITED")) {
    return "RATE_LIMITED";
  }
  if (results.some((result) => result.status === "FAILED")) {
    return "FAILED";
  }
  return "SUPPRESSED";
};

const buildReportEmailDeliveryMessage = (
  summary: Omit<ScheduledReportEmailResult["delivery"]["email"], "message">,
): string => {
  if (summary.status === "SENT") {
    return `邮件已提交真实发信通道，收件人 ${summary.recipientCount} 个。`;
  }
  if (summary.status === "DRY_RUN") {
    return "邮件发送已走到报表推送链路，但当前为 dry-run/本地安全模式，未真实外发。";
  }
  if (summary.status === "SUPPRESSED") {
    return "邮件未发送：缺少可用收件人或真实发信配置未满足。";
  }
  return "邮件发送失败，已记录脱敏审计；可检查邮件服务配置和服务商返回码。";
};

const createNoRecipientReportEmailResult = (): ReportEmailDeliveryResult => ({
  status: "SUPPRESSED",
  adapter: "REPORT_EMAIL_RECIPIENT_RESOLVER",
  failureCategory: "CONFIGURATION",
  attemptCount: 1,
  dryRun: true,
});

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "[masked-email]";
  }
  return `${localPart.slice(0, 1)}***@${domainPart}`;
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
