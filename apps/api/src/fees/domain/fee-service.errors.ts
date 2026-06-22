import { PermissionCode } from "../../authorization/constants/permission-code";
import { PayStatusCode } from "./fee-domain.types";

export class FeeAccessDeniedError extends Error {
  constructor(message = "Fee access is denied.") {
    super(message);
    this.name = "FeeAccessDeniedError";
  }
}

export class FeePermissionDeniedError extends FeeAccessDeniedError {
  constructor(permission: PermissionCode | readonly PermissionCode[]) {
    const permissions = Array.isArray(permission) ? permission.join(", ") : permission;
    super(`Required fee permission is missing: ${permissions}.`);
    this.name = "FeePermissionDeniedError";
  }
}

export class FeeNotFoundError extends Error {
  constructor(message = "Fee record was not found.") {
    super(message);
    this.name = "FeeNotFoundError";
  }
}

export class FeeConflictError extends Error {
  constructor(message = "Fee record conflict.") {
    super(message);
    this.name = "FeeConflictError";
  }
}

export class FeeInvalidTransitionError extends FeeConflictError {
  constructor(from: PayStatusCode, to: PayStatusCode) {
    super(`Invalid fee status transition from ${from} to ${to}.`);
    this.name = "FeeInvalidTransitionError";
  }
}

