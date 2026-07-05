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
