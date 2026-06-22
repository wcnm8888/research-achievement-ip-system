export class AttachmentDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentDomainError";
  }
}

export class AttachmentAccessDeniedError extends AttachmentDomainError {
  constructor(reason: string) {
    super(`Attachment access denied: ${reason}`);
    this.name = "AttachmentAccessDeniedError";
  }
}

export class AttachmentInvalidPayloadError extends AttachmentDomainError {
  constructor(reason: string) {
    super(`Invalid attachment payload: ${reason}`);
    this.name = "AttachmentInvalidPayloadError";
  }
}

export class AttachmentNotFoundError extends AttachmentDomainError {
  constructor(attachmentId: string) {
    super(`Attachment ${attachmentId} was not found.`);
    this.name = "AttachmentNotFoundError";
  }
}

export class AttachmentUnsupportedRelationError extends AttachmentDomainError {
  constructor(relationType: string) {
    super(`Attachment relation ${relationType} is not supported by this Step 7B service.`);
    this.name = "AttachmentUnsupportedRelationError";
  }
}

export class AttachmentVersionConflictError extends AttachmentDomainError {
  constructor(relationType: string, relationId: string, fileName: string, version: number) {
    super(
      `Attachment version conflict for ${relationType}/${relationId}/${fileName} v${version}.`,
    );
    this.name = "AttachmentVersionConflictError";
  }
}

export class AttachmentStorageError extends AttachmentDomainError {
  constructor(reason: string) {
    super(`Attachment storage operation failed: ${reason}`);
    this.name = "AttachmentStorageError";
  }
}
