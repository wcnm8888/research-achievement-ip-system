export const WorkflowTargetTypeCode = {
  achievement: "ACHIEVEMENT",
} as const;

export type WorkflowTargetTypeCode =
  (typeof WorkflowTargetTypeCode)[keyof typeof WorkflowTargetTypeCode];

export const WorkflowInstanceStatusCode = {
  active: "ACTIVE",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
} as const;

export type WorkflowInstanceStatusCode =
  (typeof WorkflowInstanceStatusCode)[keyof typeof WorkflowInstanceStatusCode];

export const WorkflowTaskStatusCode = {
  pending: "PENDING",
  claimed: "CLAIMED",
  approved: "APPROVED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
} as const;

export type WorkflowTaskStatusCode =
  (typeof WorkflowTaskStatusCode)[keyof typeof WorkflowTaskStatusCode];

export const WorkflowActionTypeCode = {
  submit: "SUBMIT",
  approve: "APPROVE",
  reject: "REJECT",
  archive: "ARCHIVE",
  void: "VOID",
  cancel: "CANCEL",
} as const;

export type WorkflowActionTypeCode =
  (typeof WorkflowActionTypeCode)[keyof typeof WorkflowActionTypeCode];

export const WorkflowStepCode = {
  departmentReview: "DEPARTMENT_REVIEW",
  archive: "ARCHIVE",
} as const;

export type WorkflowStepCode = (typeof WorkflowStepCode)[keyof typeof WorkflowStepCode];
