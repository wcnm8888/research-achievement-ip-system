export class AccountLifecycleInvalidTokenError extends Error {
  constructor(message = "The account lifecycle token is invalid or expired.") {
    super(message);
    this.name = "AccountLifecycleInvalidTokenError";
  }
}

export class AccountLifecycleTargetNotFoundError extends Error {
  constructor(message = "Account lifecycle target was not found.") {
    super(message);
    this.name = "AccountLifecycleTargetNotFoundError";
  }
}

export class AccountLifecycleConflictError extends Error {
  constructor(message = "Account lifecycle operation cannot be completed.") {
    super(message);
    this.name = "AccountLifecycleConflictError";
  }
}

export class AccountLifecyclePermissionDeniedError extends Error {
  constructor(message = "Account lifecycle permission is missing.") {
    super(message);
    this.name = "AccountLifecyclePermissionDeniedError";
  }
}
