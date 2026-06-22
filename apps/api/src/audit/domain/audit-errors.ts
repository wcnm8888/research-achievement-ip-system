export class AuditAccessDeniedError extends Error {
  constructor(reason: string) {
    super(`Masked audit read is not allowed: ${reason}`);
    this.name = "AuditAccessDeniedError";
  }
}

export class AuditInvalidPayloadError extends Error {
  constructor(reason: string) {
    super(`Invalid audit payload: ${reason}`);
    this.name = "AuditInvalidPayloadError";
  }
}
