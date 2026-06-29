import { PermissionCode } from "../authorization/constants/permission-code";

export class SettingsAccessDeniedError extends Error {
  constructor(message = "User context with department is required.") {
    super(message);
    this.name = "SettingsAccessDeniedError";
  }
}

export class SettingsPermissionDeniedError extends Error {
  constructor(permission: PermissionCode) {
    super(`Required permission is missing: ${permission}.`);
    this.name = "SettingsPermissionDeniedError";
  }
}

export class SettingsNotFoundError extends Error {
  constructor(message = "Settings resource was not found.") {
    super(message);
    this.name = "SettingsNotFoundError";
  }
}

export class SettingsConflictError extends Error {
  constructor(message = "Settings resource conflict.") {
    super(message);
    this.name = "SettingsConflictError";
  }
}
