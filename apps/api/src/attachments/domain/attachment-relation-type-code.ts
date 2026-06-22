export const AttachmentRelationTypeCode = {
  achievement: "ACHIEVEMENT",
  feeRecord: "FEE_RECORD",
  workflowAction: "WORKFLOW_ACTION",
} as const;

export type AttachmentRelationTypeCode =
  (typeof AttachmentRelationTypeCode)[keyof typeof AttachmentRelationTypeCode];
