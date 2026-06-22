export const AttachmentStatusCode = {
  active: "ACTIVE",
  archived: "ARCHIVED",
  blocked: "BLOCKED",
} as const;

export type AttachmentStatusCode =
  (typeof AttachmentStatusCode)[keyof typeof AttachmentStatusCode];
