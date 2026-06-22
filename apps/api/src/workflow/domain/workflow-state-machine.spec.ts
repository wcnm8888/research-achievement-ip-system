import { describe, expect, it } from "vitest";
import {
  WorkflowInstanceStatusCode,
  WorkflowTaskStatusCode,
} from "./workflow-domain.types";
import {
  assertWorkflowInstanceTransition,
  assertWorkflowTaskTransition,
  canTransitionWorkflowInstanceStatus,
  canTransitionWorkflowTaskStatus,
  getAllowedWorkflowInstanceTransitions,
  getAllowedWorkflowTaskTransitions,
  isTerminalWorkflowInstanceStatus,
  isTerminalWorkflowTaskStatus,
} from "./workflow-state-machine";
import {
  InvalidWorkflowInstanceTransitionError,
  InvalidWorkflowTaskTransitionError,
} from "./workflow-errors";

describe("workflow task state machine", () => {
  it("allows pending tasks to be claimed, approved, rejected, or cancelled", () => {
    expect(getAllowedWorkflowTaskTransitions(WorkflowTaskStatusCode.pending)).toEqual([
      WorkflowTaskStatusCode.claimed,
      WorkflowTaskStatusCode.approved,
      WorkflowTaskStatusCode.rejected,
      WorkflowTaskStatusCode.cancelled,
    ]);
    expect(
      canTransitionWorkflowTaskStatus(
        WorkflowTaskStatusCode.pending,
        WorkflowTaskStatusCode.approved,
      ),
    ).toBe(true);
  });

  it("allows claimed tasks to finish but not return to pending", () => {
    expect(
      canTransitionWorkflowTaskStatus(
        WorkflowTaskStatusCode.claimed,
        WorkflowTaskStatusCode.rejected,
      ),
    ).toBe(true);
    expect(
      canTransitionWorkflowTaskStatus(
        WorkflowTaskStatusCode.claimed,
        WorkflowTaskStatusCode.pending,
      ),
    ).toBe(false);
  });

  it("treats approved, rejected, and cancelled tasks as terminal", () => {
    expect(isTerminalWorkflowTaskStatus(WorkflowTaskStatusCode.approved)).toBe(true);
    expect(isTerminalWorkflowTaskStatus(WorkflowTaskStatusCode.rejected)).toBe(true);
    expect(isTerminalWorkflowTaskStatus(WorkflowTaskStatusCode.cancelled)).toBe(true);
    expect(getAllowedWorkflowTaskTransitions(WorkflowTaskStatusCode.approved)).toEqual([]);
  });

  it("raises a domain error for invalid task transitions", () => {
    expect(() =>
      assertWorkflowTaskTransition(
        WorkflowTaskStatusCode.approved,
        WorkflowTaskStatusCode.rejected,
      ),
    ).toThrow(InvalidWorkflowTaskTransitionError);
  });
});

describe("workflow instance state machine", () => {
  it("allows active instances to stay active for step changes, complete, or cancel", () => {
    expect(getAllowedWorkflowInstanceTransitions(WorkflowInstanceStatusCode.active)).toEqual([
      WorkflowInstanceStatusCode.active,
      WorkflowInstanceStatusCode.completed,
      WorkflowInstanceStatusCode.cancelled,
    ]);
    expect(
      canTransitionWorkflowInstanceStatus(
        WorkflowInstanceStatusCode.active,
        WorkflowInstanceStatusCode.active,
      ),
    ).toBe(true);
    expect(
      canTransitionWorkflowInstanceStatus(
        WorkflowInstanceStatusCode.active,
        WorkflowInstanceStatusCode.completed,
      ),
    ).toBe(true);
  });

  it("treats completed and cancelled instances as terminal", () => {
    expect(isTerminalWorkflowInstanceStatus(WorkflowInstanceStatusCode.completed)).toBe(true);
    expect(isTerminalWorkflowInstanceStatus(WorkflowInstanceStatusCode.cancelled)).toBe(true);
    expect(getAllowedWorkflowInstanceTransitions(WorkflowInstanceStatusCode.completed)).toEqual(
      [],
    );
  });

  it("raises a domain error for invalid instance transitions", () => {
    expect(() =>
      assertWorkflowInstanceTransition(
        WorkflowInstanceStatusCode.completed,
        WorkflowInstanceStatusCode.active,
      ),
    ).toThrow(InvalidWorkflowInstanceTransitionError);
  });
});
