import { PermissionCode } from "../authorization/constants/permission-code";

export class AccountManagementAccessDeniedError extends Error {
  constructor(message = "User context with department is required.") {
    super(message);
    this.name = "AccountManagementAccessDeniedError";
  }
}

export class AccountManagementPermissionDeniedError extends Error {
  constructor(permission: PermissionCode) {
    super(`Required permission is missing: ${permission}.`);
    this.name = "AccountManagementPermissionDeniedError";
  }
}

export class AccountManagementNotFoundError extends Error {
  constructor(message = "Account management resource was not found.") {
    super(message);
    this.name = "AccountManagementNotFoundError";
  }
}

export class AccountManagementConflictError extends Error {
  constructor(message = "Account management resource already exists.") {
    super(message);
    this.name = "AccountManagementConflictError";
  }
}
