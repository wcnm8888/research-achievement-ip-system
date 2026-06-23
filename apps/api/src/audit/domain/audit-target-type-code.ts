export const AuditTargetTypeCode = {
  achievement: "ACHIEVEMENT",
  workflowInstance: "WORKFLOW_INSTANCE",
  workflowTask: "WORKFLOW_TASK",
  workflowAction: "WORKFLOW_ACTION",
  attachment: "ATTACHMENT",
  feeRecord: "FEE_RECORD",
  reminderTask: "REMINDER_TASK",
  notification: "NOTIFICATION",
  systemConfig: "SYSTEM_CONFIG",
  auditLog: "AUDIT_LOG",
  user: "USER",
  userSession: "USER_SESSION",
  auth: "AUTH",
} as const;

export type AuditTargetTypeCode =
  (typeof AuditTargetTypeCode)[keyof typeof AuditTargetTypeCode];
