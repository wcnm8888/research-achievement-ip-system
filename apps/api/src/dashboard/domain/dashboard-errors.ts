export class DashboardAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DashboardAccessDeniedError";
  }
}
