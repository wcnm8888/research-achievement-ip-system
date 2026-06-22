export const ResourceTypeCode = {
  achievement: "ACHIEVEMENT",
  attachment: "ATTACHMENT",
  feeRecord: "FEE_RECORD",
  workflowInstance: "WORKFLOW_INSTANCE",
  auditLog: "AUDIT_LOG",
} as const;

export type ResourceTypeCode = (typeof ResourceTypeCode)[keyof typeof ResourceTypeCode];
