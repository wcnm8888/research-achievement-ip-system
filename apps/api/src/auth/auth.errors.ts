export class AuthBootstrapDisabledError extends Error {
  constructor() {
    super("Bootstrap is not enabled.");
    this.name = "AuthBootstrapDisabledError";
  }
}

export class AuthBootstrapAlreadyCompletedError extends Error {
  constructor() {
    super("Bootstrap has already been completed.");
    this.name = "AuthBootstrapAlreadyCompletedError";
  }
}

export class AuthInvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "AuthInvalidCredentialsError";
  }
}
