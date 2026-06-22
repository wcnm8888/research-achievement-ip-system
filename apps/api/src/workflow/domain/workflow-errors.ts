import {
  WorkflowInstanceStatusCode,
  WorkflowTaskStatusCode,
} from "./workflow-domain.types";

export class WorkflowDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowDomainError";
  }
}

export class InvalidWorkflowTaskTransitionError extends WorkflowDomainError {
  constructor(
    readonly from: WorkflowTaskStatusCode,
    readonly to: WorkflowTaskStatusCode,
  ) {
    super(`Workflow task cannot transition from ${from} to ${to}.`);
    this.name = "InvalidWorkflowTaskTransitionError";
  }
}

export class InvalidWorkflowInstanceTransitionError extends WorkflowDomainError {
  constructor(
    readonly from: WorkflowInstanceStatusCode,
    readonly to: WorkflowInstanceStatusCode,
  ) {
    super(`Workflow instance cannot transition from ${from} to ${to}.`);
    this.name = "InvalidWorkflowInstanceTransitionError";
  }
}

export class WorkflowTaskTransitionConflictError extends WorkflowDomainError {
  constructor(
    readonly taskId: string,
    readonly expectedStatus: WorkflowTaskStatusCode,
  ) {
    super(`Workflow task ${taskId} was not in expected status ${expectedStatus}.`);
    this.name = "WorkflowTaskTransitionConflictError";
  }
}

export class WorkflowInstanceTransitionConflictError extends WorkflowDomainError {
  constructor(
    readonly instanceId: string,
    readonly expectedStatus: WorkflowInstanceStatusCode,
  ) {
    super(`Workflow instance ${instanceId} was not in expected status ${expectedStatus}.`);
    this.name = "WorkflowInstanceTransitionConflictError";
  }
}

export class ActiveWorkflowInstanceAlreadyExistsError extends WorkflowDomainError {
  constructor(readonly achievementId: string) {
    super(`Active workflow instance already exists for achievement: ${achievementId}.`);
    this.name = "ActiveWorkflowInstanceAlreadyExistsError";
  }
}

export class DepartmentReviewerNotFoundError extends WorkflowDomainError {
  constructor(readonly departmentId: string) {
    super(`No active department research secretary was found for department: ${departmentId}.`);
    this.name = "DepartmentReviewerNotFoundError";
  }
}

export class WorkflowAccessDeniedError extends WorkflowDomainError {
  constructor(message = "Workflow access is denied.") {
    super(message);
    this.name = "WorkflowAccessDeniedError";
  }
}

export class WorkflowInvalidStateError extends WorkflowDomainError {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowInvalidStateError";
  }
}

export class WorkflowInvalidPayloadError extends WorkflowDomainError {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowInvalidPayloadError";
  }
}
