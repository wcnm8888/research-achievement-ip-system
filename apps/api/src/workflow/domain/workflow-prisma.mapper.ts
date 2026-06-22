import { Prisma } from "@prisma/client";
import {
  WorkflowActionTypeCode,
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTargetTypeCode,
} from "./workflow-domain.types";
import {
  CreateAchievementReviewWorkflowInput,
  CreateWorkflowActionInput,
  CreateWorkflowTaskInput,
  WorkflowInstanceTransitionInput,
  WorkflowTaskTransitionInput,
} from "./workflow-repository.types";

export const toAchievementWorkflowInstanceCreateData = (
  input: CreateAchievementReviewWorkflowInput,
): Prisma.WorkflowInstanceUncheckedCreateInput => ({
  targetType: WorkflowTargetTypeCode.achievement,
  targetId: input.achievementId,
  status: WorkflowInstanceStatusCode.active,
  currentStep: WorkflowStepCode.departmentReview,
});

export const toWorkflowTaskCreateData = (
  input: CreateWorkflowTaskInput,
): Prisma.WorkflowTaskUncheckedCreateInput => ({
  instanceId: input.instanceId,
  assigneeId: input.assigneeId,
  stepCode: input.stepCode,
});

export const toWorkflowSubmitActionCreateData = (
  instanceId: string,
  input: CreateAchievementReviewWorkflowInput,
): Prisma.WorkflowActionUncheckedCreateInput => ({
  instanceId,
  taskId: null,
  actorId: input.submittedById,
  action: WorkflowActionTypeCode.submit,
  comment: input.submitComment ?? null,
  createdAt: input.submittedAt,
});

export const toWorkflowActionCreateData = (
  input: CreateWorkflowActionInput,
): Prisma.WorkflowActionUncheckedCreateInput => ({
  instanceId: input.instanceId,
  taskId: input.taskId ?? null,
  actorId: input.actorId,
  action: input.action,
  comment: input.comment ?? null,
});

export const toWorkflowTaskTransitionData = (
  input: WorkflowTaskTransitionInput,
): Prisma.WorkflowTaskUncheckedUpdateManyInput => ({
  status: input.nextTaskStatus,
  completedAt: input.completedAt ?? new Date(),
});

export const toWorkflowTaskTransitionActionData = (
  input: WorkflowTaskTransitionInput,
): Prisma.WorkflowActionUncheckedCreateInput => ({
  instanceId: input.instanceId,
  taskId: input.taskId,
  actorId: input.actorId,
  action: input.action,
  comment: input.comment ?? null,
});

export const toWorkflowInstanceTransitionData = (
  input: WorkflowInstanceTransitionInput,
): Prisma.WorkflowInstanceUncheckedUpdateManyInput => ({
  status: input.nextStatus,
  ...(input.currentStep !== undefined ? { currentStep: input.currentStep } : {}),
  ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
  ...(input.cancelledAt !== undefined ? { cancelledAt: input.cancelledAt } : {}),
});
