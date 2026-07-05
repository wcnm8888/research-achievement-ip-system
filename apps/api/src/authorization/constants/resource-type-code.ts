export const ResourceTypeCode = {
  achievement: "ACHIEVEMENT",
  achievementConversion: "ACHIEVEMENT_CONVERSION",
  attachment: "ATTACHMENT",
  feeRecord: "FEE_RECORD",
  workflowInstance: "WORKFLOW_INSTANCE",
  auditLog: "AUDIT_LOG",
} as const;

export type ResourceTypeCode = (typeof ResourceTypeCode)[keyof typeof ResourceTypeCode];
