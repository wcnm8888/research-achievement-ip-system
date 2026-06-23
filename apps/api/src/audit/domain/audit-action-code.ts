export const AuditActionCode = {
  create: "CREATE",
  update: "UPDATE",
  submit: "SUBMIT",
  approve: "APPROVE",
  reject: "REJECT",
  archive: "ARCHIVE",
  void: "VOID",
  uploadAttachment: "UPLOAD_ATTACHMENT",
  downloadAttachment: "DOWNLOAD_ATTACHMENT",
  markFeePaid: "MARK_FEE_PAID",
  confirmReminder: "CONFIRM_REMINDER",
  configUpdate: "CONFIG_UPDATE",
  bootstrapAdmin: "BOOTSTRAP_ADMIN",
  login: "LOGIN",
  loginFailed: "LOGIN_FAILED",
  logout: "LOGOUT",
  sessionRevoked: "SESSION_REVOKED",
  authMeDenied: "AUTH_ME_DENIED",
} as const;

export type AuditActionCode =
  (typeof AuditActionCode)[keyof typeof AuditActionCode];
