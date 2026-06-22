export const GrantTypeCode = {
  secretRead: "SECRET_READ",
  secretWrite: "SECRET_WRITE",
  attachmentDownload: "ATTACHMENT_DOWNLOAD",
  auditRead: "AUDIT_READ",
} as const;

export type GrantTypeCode = (typeof GrantTypeCode)[keyof typeof GrantTypeCode];
