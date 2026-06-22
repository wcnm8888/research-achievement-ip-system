import {
  InvalidWorkflowInstanceTransitionError,
  InvalidWorkflowTaskTransitionError,
} from "./workflow-errors";
import {
  WorkflowInstanceStatusCode,
  WorkflowTaskStatusCode,
} from "./workflow-domain.types";

const taskTransitionMap: Record<
  WorkflowTaskStatusCode,
  readonly WorkflowTaskStatusCode[]
> = {
  [WorkflowTaskStatusCode.pending]: [
    WorkflowTaskStatusCode.claimed,
    WorkflowTaskStatusCode.approved,
    WorkflowTaskStatusCode.rejected,
    WorkflowTaskStatusCode.cancelled,
  ],
  [WorkflowTaskStatusCode.claimed]: [
    WorkflowTaskStatusCode.approved,
    WorkflowTaskStatusCode.rejected,
    WorkflowTaskStatusCode.cancelled,
  ],
  [WorkflowTaskStatusCode.approved]: [],
  [WorkflowTaskStatusCode.rejected]: [],
  [WorkflowTaskStatusCode.cancelled]: [],
};

const instanceTransitionMap: Record<
  WorkflowInstanceStatusCode,
  readonly WorkflowInstanceStatusCode[]
> = {
  [WorkflowInstanceStatusCode.active]: [
    WorkflowInstanceStatusCode.active,
    WorkflowInstanceStatusCode.completed,
    WorkflowInstanceStatusCode.cancelled,
  ],
  [WorkflowInstanceStatusCode.completed]: [],
  [WorkflowInstanceStatusCode.cancelled]: [],
};

export const getAllowedWorkflowTaskTransitions = (
  status: WorkflowTaskStatusCode,
): readonly WorkflowTaskStatusCode[] => taskTransitionMap[status];

export const canTransitionWorkflowTaskStatus = (
  from: WorkflowTaskStatusCode,
  to: WorkflowTaskStatusCode,
): boolean => taskTransitionMap[from].includes(to);

export const assertWorkflowTaskTransition = (
  from: WorkflowTaskStatusCode,
  to: WorkflowTaskStatusCode,
): void => {
  if (!canTransitionWorkflowTaskStatus(from, to)) {
    throw new InvalidWorkflowTaskTransitionError(from, to);
  }
};

export const getAllowedWorkflowInstanceTransitions = (
  status: WorkflowInstanceStatusCode,
): readonly WorkflowInstanceStatusCode[] => instanceTransitionMap[status];

export const canTransitionWorkflowInstanceStatus = (
  from: WorkflowInstanceStatusCode,
  to: WorkflowInstanceStatusCode,
): boolean => instanceTransitionMap[from].includes(to);

export const assertWorkflowInstanceTransition = (
  from: WorkflowInstanceStatusCode,
  to: WorkflowInstanceStatusCode,
): void => {
  if (!canTransitionWorkflowInstanceStatus(from, to)) {
    throw new InvalidWorkflowInstanceTransitionError(from, to);
  }
};

export const isTerminalWorkflowTaskStatus = (status: WorkflowTaskStatusCode): boolean =>
  status === WorkflowTaskStatusCode.approved ||
  status === WorkflowTaskStatusCode.rejected ||
  status === WorkflowTaskStatusCode.cancelled;

export const isTerminalWorkflowInstanceStatus = (
  status: WorkflowInstanceStatusCode,
): boolean =>
  status === WorkflowInstanceStatusCode.completed ||
  status === WorkflowInstanceStatusCode.cancelled;
