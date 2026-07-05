import { PermissionCode } from "../../authorization/constants/permission-code";

export class AchievementConversionAccessDeniedError extends Error {
  constructor(message = "Achievement conversion access is denied.") {
    super(message);
  }
}

export class AchievementConversionPermissionDeniedError extends Error {
  constructor(permission: PermissionCode | readonly PermissionCode[]) {
    const permissions = Array.isArray(permission) ? permission.join(", ") : permission;
    super(`Required achievement conversion permission is missing: ${permissions}.`);
  }
}

export class AchievementConversionNotFoundError extends Error {
  constructor(message = "Achievement conversion was not found.") {
    super(message);
  }
}

export class AchievementConversionInvalidPayloadError extends Error {
  constructor(message = "Achievement conversion payload is invalid.") {
    super(message);
  }
}

export class AchievementConversionInvalidStateError extends Error {
  constructor(message = "Achievement conversion state is invalid.") {
    super(message);
  }
}
