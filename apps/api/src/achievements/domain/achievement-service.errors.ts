import { PermissionCode } from "../../authorization/constants/permission-code";
import { NormalizedAchievementConflictField } from "./achievement-repository.types";

export const AchievementServiceErrorCode = {
  permissionDenied: "ACHIEVEMENT_PERMISSION_DENIED",
  accessDenied: "ACHIEVEMENT_ACCESS_DENIED",
  notFound: "ACHIEVEMENT_NOT_FOUND",
  conflict: "ACHIEVEMENT_CONFLICT",
  invalidState: "ACHIEVEMENT_INVALID_STATE",
  unsupportedOperation: "ACHIEVEMENT_UNSUPPORTED_OPERATION",
  invalidPayload: "ACHIEVEMENT_INVALID_PAYLOAD",
} as const;

export type AchievementServiceErrorCode =
  (typeof AchievementServiceErrorCode)[keyof typeof AchievementServiceErrorCode];

export class AchievementServiceError extends Error {
  constructor(
    message: string,
    readonly code: AchievementServiceErrorCode,
  ) {
    super(message);
    this.name = "AchievementServiceError";
  }
}

export class AchievementPermissionDeniedError extends AchievementServiceError {
  constructor(readonly permission: PermissionCode) {
    super(
      `Permission is required for this achievement operation: ${permission}.`,
      AchievementServiceErrorCode.permissionDenied,
    );
    this.name = "AchievementPermissionDeniedError";
  }
}

export class AchievementAccessDeniedError extends AchievementServiceError {
  constructor(message = "Achievement access is denied.") {
    super(message, AchievementServiceErrorCode.accessDenied);
    this.name = "AchievementAccessDeniedError";
  }
}

export class AchievementNotFoundError extends AchievementServiceError {
  constructor(readonly achievementId: string) {
    super(`Achievement was not found: ${achievementId}.`, AchievementServiceErrorCode.notFound);
    this.name = "AchievementNotFoundError";
  }
}

export class AchievementConflictError extends AchievementServiceError {
  constructor(
    readonly field: NormalizedAchievementConflictField | "unknown",
    readonly normalizedValue?: string | null,
    readonly conflictAchievementId?: string,
  ) {
    super(`Achievement normalized unique field is already used: ${field}.`, AchievementServiceErrorCode.conflict);
    this.name = "AchievementConflictError";
  }
}

export class AchievementInvalidStateError extends AchievementServiceError {
  constructor(
    readonly currentStatus: string,
    readonly expectedStatus: string,
  ) {
    super(
      `Achievement status must be ${expectedStatus}, but current status is ${currentStatus}.`,
      AchievementServiceErrorCode.invalidState,
    );
    this.name = "AchievementInvalidStateError";
  }
}

export class AchievementUnsupportedOperationError extends AchievementServiceError {
  constructor(message: string) {
    super(message, AchievementServiceErrorCode.unsupportedOperation);
    this.name = "AchievementUnsupportedOperationError";
  }
}

export class AchievementInvalidPayloadError extends AchievementServiceError {
  constructor(message: string) {
    super(message, AchievementServiceErrorCode.invalidPayload);
    this.name = "AchievementInvalidPayloadError";
  }
}
