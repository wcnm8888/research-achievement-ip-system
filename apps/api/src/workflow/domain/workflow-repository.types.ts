import { Prisma } from "@prisma/client";
import {
  WorkflowActionTypeCode,
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "./workflow-domain.types";

export const workflowInstanceInclude = {
  tasks: {
    orderBy: {
      createdAt: "asc",
    },
  },
  actions: {
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.WorkflowInstanceInclude;

export type WorkflowInstanceAggregate = Prisma.WorkflowInstanceGetPayload<{
  include: typeof workflowInstanceInclude;
}>;

export const workflowTaskWithInstanceInclude = {
  instance: true,
} satisfies Prisma.WorkflowTaskInclude;

export type WorkflowTaskWithInstance = Prisma.WorkflowTaskGetPayload<{
  include: typeof workflowTaskWithInstanceInclude;
}>;

export const workflowTaskRecordSelect = {
  id: true,
  instanceId: true,
  assigneeId: true,
  stepCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  claimedAt: true,
  completedAt: true,
} satisfies Prisma.WorkflowTaskSelect;

export type WorkflowTaskRecord = Prisma.WorkflowTaskGetPayload<{
  select: typeof workflowTaskRecordSelect;
}>;

export type CreateAchievementReviewWorkflowInput = {
  achievementId: string;
  submittedById: string;
  departmentReviewerId: string;
  submittedAt?: Date;
  submitComment?: string | null;
};

export type CreateFeeReviewWorkflowInput = {
  feeRecordId: string;
  requestedById: string;
  reviewerIds: readonly string[];
  requestedAt?: Date;
  submitComment?: string | null;
};

export type WorkflowTaskTransitionInput = {
  taskId: string;
  instanceId: string;
  actorId: string;
  action: WorkflowActionTypeCode;
  expectedTaskStatus: WorkflowTaskStatusCode;
  nextTaskStatus: WorkflowTaskStatusCode;
  comment?: string | null;
  completedAt?: Date;
};

export type WorkflowInstanceTransitionInput = {
  instanceId: string;
  expectedStatus: WorkflowInstanceStatusCode;
  nextStatus: WorkflowInstanceStatusCode;
  currentStep?: WorkflowStepCode | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
};

export type CreateWorkflowTaskInput = {
  instanceId: string;
  assigneeId: string;
  stepCode: WorkflowStepCode;
};

export type CreateWorkflowActionInput = {
  instanceId: string;
  taskId?: string | null;
  actorId: string;
  action: WorkflowActionTypeCode;
  comment?: string | null;
};

export type WorkflowTargetRef = {
  targetType: WorkflowTargetTypeCode;
  targetId: string;
};

export type FindWorkflowTasksForAssigneeInput = {
  assigneeId: string;
  status?: WorkflowTaskStatusCode;
  targetType?: WorkflowTargetTypeCode;
  targetTypes?: readonly WorkflowTargetTypeCode[];
  achievementId?: string;
  feeRecordId?: string;
};
