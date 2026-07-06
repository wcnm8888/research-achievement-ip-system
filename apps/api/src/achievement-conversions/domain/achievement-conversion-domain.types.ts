export const AchievementConversionTypeCode = {
  license: "LICENSE",
  transfer: "TRANSFER",
  cooperation: "COOPERATION",
  industrialization: "INDUSTRIALIZATION",
  other: "OTHER",
} as const;

export type AchievementConversionTypeCode =
  (typeof AchievementConversionTypeCode)[keyof typeof AchievementConversionTypeCode];

export const AchievementConversionStatusCode = {
  leadIntent: "LEAD_INTENT",
  contracting: "CONTRACTING",
  signed: "SIGNED",
  paid: "PAID",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
} as const;

export type AchievementConversionStatusCode =
  (typeof AchievementConversionStatusCode)[keyof typeof AchievementConversionStatusCode];

export const AchievementConversionContractStatusCode = {
  draft: "DRAFT",
  signed: "SIGNED",
  active: "ACTIVE",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
} as const;

export type AchievementConversionContractStatusCode =
  (typeof AchievementConversionContractStatusCode)[keyof typeof AchievementConversionContractStatusCode];

export const AchievementConversionRevenueStatusCode = {
  unpaid: "UNPAID",
  partial: "PARTIAL",
  paid: "PAID",
  overdue: "OVERDUE",
  waived: "WAIVED",
} as const;

export type AchievementConversionRevenueStatusCode =
  (typeof AchievementConversionRevenueStatusCode)[keyof typeof AchievementConversionRevenueStatusCode];

export const AchievementConversionEvaluationEffectCode = {
  notEvaluated: "NOT_EVALUATED",
  positive: "POSITIVE",
  neutral: "NEUTRAL",
  negative: "NEGATIVE",
  mixed: "MIXED",
} as const;

export type AchievementConversionEvaluationEffectCode =
  (typeof AchievementConversionEvaluationEffectCode)[keyof typeof AchievementConversionEvaluationEffectCode];

export const AchievementConversionBenefitCategoryCode = {
  unit: "UNIT",
  team: "TEAM",
  person: "PERSON",
  platform: "PLATFORM",
  other: "OTHER",
} as const;

export type AchievementConversionBenefitCategoryCode =
  (typeof AchievementConversionBenefitCategoryCode)[keyof typeof AchievementConversionBenefitCategoryCode];

export type AchievementConversionBenefitDistributionItem = {
  category: AchievementConversionBenefitCategoryCode;
  label: string;
  amount?: number | null;
  ratio?: number | null;
  note?: string | null;
};

export type AchievementConversionBenefitDistributionJson =
  AchievementConversionBenefitDistributionItem[];
