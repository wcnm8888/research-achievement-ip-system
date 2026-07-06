export class CustomReportAccessDeniedError extends Error {
  constructor() {
    super("User context is required.");
  }
}

export class CustomReportTemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Unknown custom report template: ${templateId}`);
  }
}

export class CustomReportInvalidQueryError extends Error {
  constructor(message: string) {
    super(message);
  }
}
