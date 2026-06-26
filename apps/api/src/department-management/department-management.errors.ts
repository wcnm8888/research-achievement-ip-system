import { PermissionCode } from "../authorization/constants/permission-code";

export class DepartmentManagementAccessDeniedError extends Error {
  constructor(message = "User context with department is required.") {
    super(message);
    this.name = "DepartmentManagementAccessDeniedError";
  }
}

export class DepartmentManagementPermissionDeniedError extends Error {
  constructor(permission: PermissionCode) {
    super(`Required permission is missing: ${permission}.`);
    this.name = "DepartmentManagementPermissionDeniedError";
  }
}

export class DepartmentManagementNotFoundError extends Error {
  constructor(message = "Department management resource was not found.") {
    super(message);
    this.name = "DepartmentManagementNotFoundError";
  }
}

export class DepartmentManagementConflictError extends Error {
  constructor(message = "Department management resource conflict.") {
    super(message);
    this.name = "DepartmentManagementConflictError";
  }
}
