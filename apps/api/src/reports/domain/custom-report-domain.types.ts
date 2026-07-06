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
import { WorkflowTaskStatusCode } from "../../workflow/domain/workflow-domain.types";

export const CustomReportTemplateIdCode = {
  achievementDistribution: "achievement-distribution",
  achievementTrend: "achievement-trend",
  feeRiskSummary: "fee-risk-summary",
  workflowEfficiency: "workflow-efficiency",
  conversionFunnel: "conversion-funnel",
} as const;

export type CustomReportTemplateId =
  (typeof CustomReportTemplateIdCode)[keyof typeof CustomReportTemplateIdCode];

export const CustomReportColumnTypeCode = {
  text: "text",
  number: "number",
  money: "money",
  date: "date",
} as const;

export type CustomReportColumnType =
  (typeof CustomReportColumnTypeCode)[keyof typeof CustomReportColumnTypeCode];

export type CustomReportTemplate = {
  templateId: CustomReportTemplateId;
  name: string;
  description: string;
};

export type CustomReportColumn = {
  key: string;
  label: string;
  type: CustomReportColumnType;
};

export type CustomReportRowValue = string | number | null;

export type CustomReportRow = Record<string, CustomReportRowValue>;

export type CustomReportTotals = Record<string, CustomReportRowValue>;

export type CustomReportGroupBy = "year" | "month";

export type CustomReportRunFilters = {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  achievementType?: AchievementTypeCode;
  status?:
    | AchievementStatusCode
    | PayStatusCode
    | WorkflowTaskStatusCode
    | AchievementConversionStatusCode;
  groupBy?: CustomReportGroupBy;
  dueSoonDays?: number;
};

export type CustomReportRunOptions = {
  dateFrom?: Date;
  dateTo?: Date;
  departmentId?: string;
  achievementType?: AchievementTypeCode;
  status?: string;
  groupBy?: CustomReportGroupBy;
  dueSoonDays?: number;
};

export type CustomReportScopeSummary = {
  userId: string;
  departmentId: string;
  departmentScope: {
    departmentIds: readonly string[];
  };
  policy: "achievement-readable" | "fee-readable" | "current-assignee";
};

export type CustomReportRunResult = {
  metadata: {
    templateId: CustomReportTemplateId;
    name: string;
    description: string;
    generatedAt: string;
    localDemoOnly: true;
    notProductionMonitoring: true;
  };
  filters: CustomReportRunFilters;
  scopeSummary: CustomReportScopeSummary;
  columns: CustomReportColumn[];
  rows: CustomReportRow[];
  totals: CustomReportTotals;
  caveats: string[];
};

export type AchievementDistributionBucket = {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  achievementType: AchievementTypeCode;
  count: number;
};

export type AchievementTrendItem = {
  createdAt: Date;
  type: AchievementTypeCode;
};

export type CountBucket<T extends string = string> = {
  key: T;
  count: number;
};

export type ConversionAmountSummary = {
  contractTotal: string;
  revenueTotal: string;
};

export type ConversionAggregateStatusCode =
  | AchievementConversionStatusCode
  | AchievementConversionContractStatusCode
  | AchievementConversionRevenueStatusCode
  | AchievementConversionEvaluationEffectCode;

export const customReportTemplates: readonly CustomReportTemplate[] = [
  {
    templateId: CustomReportTemplateIdCode.achievementDistribution,
    name: "部门成果数量与类型分布",
    description: "按部门和成果类型汇总当前可读成果数量。",
  },
  {
    templateId: CustomReportTemplateIdCode.achievementTrend,
    name: "年度/月度成果趋势",
    description: "按年份或月份汇总当前可读成果创建趋势。",
  },
  {
    templateId: CustomReportTemplateIdCode.feeRiskSummary,
    name: "费用风险与缴费状态摘要",
    description: "按缴费状态和到期风险汇总当前可读费用记录。",
  },
  {
    templateId: CustomReportTemplateIdCode.workflowEfficiency,
    name: "审批效率与待办状态摘要",
    description: "按当前用户待办状态汇总工作流处理概览。",
  },
  {
    templateId: CustomReportTemplateIdCode.conversionFunnel,
    name: "成果转化合同/收入/状态漏斗摘要",
    description: "按转化状态汇总当前可读成果范围内的合同与到账概览。",
  },
];

export const customReportCaveats = [
  "local/demo/custom report summary",
  "not full BI",
  "not production monitoring",
] as const;
