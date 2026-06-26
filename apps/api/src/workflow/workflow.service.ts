import { Inject, Injectable } from "@nestjs/common";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { SecretLevelCode as AuthorizationSecretLevelCode } from "../authorization/constants/secret-level-code";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  AchievementRepository,
  AchievementTransactionClient,
} from "../achievements/achievement.repository";
import { AchievementStatusCode } from "../achievements/domain/achievement-domain.types";
import { AchievementStatusTransitionConflictError } from "../achievements/domain/achievement-repository.errors";
import {
  AchievementStateRecord,
  AchievementStateResult,
} from "../achievements/domain/achievement-repository.types";
import { assertAchievementTransition } from "../achievements/domain/achievement-state-machine";
import { ApproveWorkflowTaskDto, RejectWorkflowTaskDto } from "./dto/workflow-action.dto";
import { WorkflowTaskQueryDto } from "./dto/workflow-task-query.dto";
import {
  WorkflowActionTypeCode,
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "./domain/workflow-domain.types";
import {
  ActiveWorkflowInstanceAlreadyExistsError,
  DepartmentReviewerNotFoundError,
  WorkflowDepartmentUnavailableError,
  WorkflowAccessDeniedError,
  WorkflowInvalidPayloadError,
  WorkflowInvalidStateError,
} from "./domain/workflow-errors";
import {
  assertWorkflowInstanceTransition,
  assertWorkflowTaskTransition,
} from "./domain/workflow-state-machine";
import {
  WorkflowInstanceAggregate,
  WorkflowTaskRecord,
  WorkflowTaskWithInstance,
} from "./domain/workflow-repository.types";
import { WorkflowRepository, WorkflowTransactionClient } from "./workflow.repository";

export type PrepareAchievementReviewWorkflowInput = {
  achievementId: string;
  departmentId: string;
};

export type CreateAchievementReviewWorkflowOnSubmitInput = {
  achievementId: string;
  submittedById: string;
  departmentReviewerId: string;
  submittedAt: Date;
};

export type PrepareAchievementArchiveWorkflowInput = {
  achievementId: string;
};

export type CompleteAchievementArchiveWorkflowInput = {
  instanceId: string;
  achievementId: string;
  archivedById: string;
  actorDepartmentId: string;
  targetDepartmentId: string;
  targetSecretLevel: AuthorizationSecretLevelCode;
  archivedAt: Date;
  auditClient: AuditTransactionClient;
};

export type DepartmentReviewWorkflowResult = {
  task: WorkflowTaskRecord;
  achievement: AchievementStateResult;
};

export type WorkflowTaskListResult = {
  items: WorkflowTaskWithInstance[];
};

@Injectable()
export class WorkflowService {
  constructor(
    @Inject(WorkflowRepository)
    private readonly repository: WorkflowRepository,
    @Inject(AchievementRepository)
    private readonly achievementRepository: AchievementRepository,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PolicyQueryFactory)
    private readonly policyQueryFactory: PolicyQueryFactory,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async prepareAchievementReviewOnSubmitInTransaction(
    client: WorkflowTransactionClient,
    input: PrepareAchievementReviewWorkflowInput,
  ): Promise<{ departmentReviewerId: string }> {
    const activeInstance =
      await this.repository.findActiveInstanceForAchievementInTransaction(
        client,
        input.achievementId,
      );

    if (activeInstance) {
      throw new ActiveWorkflowInstanceAlreadyExistsError(input.achievementId);
    }

    const activeDepartment =
      await this.repository.findActiveDepartmentByIdInTransaction(
        client,
        input.departmentId,
      );

    if (!activeDepartment) {
      throw new WorkflowDepartmentUnavailableError(input.departmentId);
    }

    const reviewerIds =
      await this.repository.findDepartmentReviewerUserIdsInTransaction(
        client,
        input.departmentId,
      );
    const departmentReviewerId = reviewerIds[0];

    if (!departmentReviewerId) {
      throw new DepartmentReviewerNotFoundError(input.departmentId);
    }

    return { departmentReviewerId };
  }

  createAchievementReviewOnSubmitInTransaction(
    client: WorkflowTransactionClient,
    input: CreateAchievementReviewWorkflowOnSubmitInput,
  ): Promise<WorkflowInstanceAggregate> {
    return this.repository.createAchievementReviewWorkflowInTransaction(client, {
      achievementId: input.achievementId,
      submittedById: input.submittedById,
      departmentReviewerId: input.departmentReviewerId,
      submittedAt: input.submittedAt,
    });
  }

  async prepareAchievementArchiveInTransaction(
    client: WorkflowTransactionClient,
    input: PrepareAchievementArchiveWorkflowInput,
  ): Promise<WorkflowInstanceAggregate> {
    const instance = await this.repository.findActiveInstanceForAchievementInTransaction(
      client,
      input.achievementId,
    );

    if (!instance) {
      throw new WorkflowInvalidStateError(
        "Active workflow instance is required before achievement archive.",
      );
    }

    this.assertAchievementArchiveInstanceReady(instance, input.achievementId);

    return instance;
  }

  async completeAchievementArchiveInTransaction(
    client: WorkflowTransactionClient,
    input: CompleteAchievementArchiveWorkflowInput,
  ): Promise<WorkflowInstanceAggregate> {
    await this.repository.createActionInTransaction(client, {
      instanceId: input.instanceId,
      taskId: null,
      actorId: input.archivedById,
      action: WorkflowActionTypeCode.archive,
    });

    const instance = await this.repository.transitionInstanceInTransaction(client, {
      instanceId: input.instanceId,
      expectedStatus: WorkflowInstanceStatusCode.active,
      nextStatus: WorkflowInstanceStatusCode.completed,
      currentStep: null,
      completedAt: input.archivedAt,
    });

    await this.auditService.recordEventInTransaction(
      input.auditClient,
      this.toWorkflowArchiveAuditEvent(input, instance),
    );

    return instance;
  }

  async approveDepartmentReviewTask(
    context: UserContext,
    taskId: string,
    dto: ApproveWorkflowTaskDto = {},
  ): Promise<DepartmentReviewWorkflowResult> {
    this.assertReviewContext(context);
    const reviewedAt = new Date();
    const comment = dto.comment?.trim() || undefined;

    return this.reviewDepartmentTask({
      context,
      taskId,
      action: WorkflowActionTypeCode.approve,
      nextTaskStatus: WorkflowTaskStatusCode.approved,
      nextWorkflowStatus: WorkflowInstanceStatusCode.active,
      nextWorkflowStep: WorkflowStepCode.archive,
      nextAchievementStatus: AchievementStatusCode.pendingArchive,
      reviewedAt,
      comment,
    });
  }

  async rejectDepartmentReviewTask(
    context: UserContext,
    taskId: string,
    dto: RejectWorkflowTaskDto,
  ): Promise<DepartmentReviewWorkflowResult> {
    this.assertReviewContext(context);
    const comment = dto.comment?.trim();

    if (!comment) {
      throw new WorkflowInvalidPayloadError("Reject comment is required.");
    }

    const reviewedAt = new Date();

    return this.reviewDepartmentTask({
      context,
      taskId,
      action: WorkflowActionTypeCode.reject,
      nextTaskStatus: WorkflowTaskStatusCode.rejected,
      nextWorkflowStatus: WorkflowInstanceStatusCode.completed,
      nextWorkflowStep: null,
      nextAchievementStatus: AchievementStatusCode.departmentRejected,
      reviewedAt,
      comment,
    });
  }

  async listMyWorkflowTasks(
    context: UserContext,
    query: WorkflowTaskQueryDto = {},
  ): Promise<WorkflowTaskListResult> {
    this.assertReviewContext(context);

    const items = await this.repository.findTasksForAssignee({
      assigneeId: context.userId,
      status: query.status ?? WorkflowTaskStatusCode.pending,
      achievementId: query.achievementId,
    });

    return { items };
  }

  async getMyWorkflowTask(
    context: UserContext,
    taskId: string,
  ): Promise<WorkflowTaskWithInstance> {
    this.assertReviewContext(context);

    const task = await this.repository.findTaskByIdForAssignee(
      taskId,
      context.userId,
    );

    if (!task) {
      throw new WorkflowAccessDeniedError("Workflow task access is denied.");
    }

    return task;
  }

  private async reviewDepartmentTask(
    input: ReviewDepartmentTaskInput,
  ): Promise<DepartmentReviewWorkflowResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const workflowClient = tx as WorkflowTransactionClient;
        const achievementClient = tx as AchievementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const task = await this.repository.findTaskByIdForAssigneeInTransaction(
          workflowClient,
          input.taskId,
          input.context.userId,
        );

        if (!task) {
          throw new WorkflowAccessDeniedError("Workflow task access is denied.");
        }

        this.assertDepartmentReviewTaskReady(task);
        const achievementId = this.getAchievementTargetId(task);
        const achievement = await this.findReviewableAchievement(
          achievementClient,
          input.context,
          achievementId,
        );

        assertWorkflowTaskTransition(task.status, input.nextTaskStatus);
        assertWorkflowInstanceTransition(task.instance.status, input.nextWorkflowStatus);
        assertAchievementTransition(achievement.status, input.nextAchievementStatus);

        const updatedTask = await this.repository.transitionTaskWithActionInTransaction(
          workflowClient,
          {
            taskId: task.id,
            instanceId: task.instanceId,
            actorId: input.context.userId,
            action: input.action,
            expectedTaskStatus: WorkflowTaskStatusCode.pending,
            nextTaskStatus: input.nextTaskStatus,
            comment: input.comment,
            completedAt: input.reviewedAt,
          },
        );

        await this.repository.transitionInstanceInTransaction(workflowClient, {
          instanceId: task.instanceId,
          expectedStatus: WorkflowInstanceStatusCode.active,
          nextStatus: input.nextWorkflowStatus,
          currentStep: input.nextWorkflowStep,
          ...(input.nextWorkflowStatus === WorkflowInstanceStatusCode.completed
            ? { completedAt: input.reviewedAt }
            : {}),
        });

        const updatedAchievement =
          await this.achievementRepository.transitionStatusInTransaction(
            achievementClient,
            {
              achievementId,
              expectedStatus: AchievementStatusCode.pendingDepartmentReview,
              nextStatus: input.nextAchievementStatus,
              updatedById: input.context.userId,
            },
          );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toDepartmentReviewAuditEvent(
            input,
            task,
            updatedTask,
            updatedAchievement,
          ),
        );

        return {
          task: updatedTask,
          achievement: updatedAchievement,
        };
      });
    } catch (error) {
      if (error instanceof AchievementStatusTransitionConflictError) {
        throw new WorkflowInvalidStateError(
          `Achievement was not in expected status ${error.expectedStatus}.`,
        );
      }

      throw error;
    }
  }

  private assertReviewContext(
    context: UserContext | null | undefined,
  ): asserts context is UserContext {
    if (!context?.userId || !context.departmentId) {
      throw new WorkflowAccessDeniedError("User context with department is required.");
    }

    const decision = this.rbacPolicy.hasPermission(
      context,
      PermissionCode.achievementReviewDepartment,
    );

    if (decision.effect === "DENY") {
      throw new WorkflowAccessDeniedError("Department review permission is required.");
    }
  }

  private assertDepartmentReviewTaskReady(task: WorkflowTaskWithInstance): void {
    if (task.status !== WorkflowTaskStatusCode.pending) {
      throw new WorkflowInvalidStateError(
        `Workflow task must be ${WorkflowTaskStatusCode.pending}, but current status is ${task.status}.`,
      );
    }

    if (task.stepCode !== WorkflowStepCode.departmentReview) {
      throw new WorkflowInvalidStateError(
        `Workflow task step must be ${WorkflowStepCode.departmentReview}, but current step is ${task.stepCode}.`,
      );
    }

    if (task.instance.status !== WorkflowInstanceStatusCode.active) {
      throw new WorkflowInvalidStateError(
        `Workflow instance must be ${WorkflowInstanceStatusCode.active}, but current status is ${task.instance.status}.`,
      );
    }

    if (task.instance.currentStep !== WorkflowStepCode.departmentReview) {
      throw new WorkflowInvalidStateError(
        `Workflow instance step must be ${WorkflowStepCode.departmentReview}, but current step is ${task.instance.currentStep}.`,
      );
    }

    if (task.instance.targetType !== WorkflowTargetTypeCode.achievement) {
      throw new WorkflowInvalidStateError("Workflow task target must be an achievement.");
    }
  }

  private assertAchievementArchiveInstanceReady(
    instance: WorkflowInstanceAggregate,
    achievementId: string,
  ): void {
    if (instance.status !== WorkflowInstanceStatusCode.active) {
      throw new WorkflowInvalidStateError(
        `Workflow instance must be ${WorkflowInstanceStatusCode.active}, but current status is ${instance.status}.`,
      );
    }

    if (instance.currentStep !== WorkflowStepCode.archive) {
      throw new WorkflowInvalidStateError(
        `Workflow instance step must be ${WorkflowStepCode.archive}, but current step is ${instance.currentStep}.`,
      );
    }

    if (instance.targetType !== WorkflowTargetTypeCode.achievement) {
      throw new WorkflowInvalidStateError("Workflow instance target must be an achievement.");
    }

    if (instance.targetId !== achievementId) {
      throw new WorkflowInvalidStateError(
        "Workflow instance target achievement does not match the archive request.",
      );
    }

    assertWorkflowInstanceTransition(
      instance.status,
      WorkflowInstanceStatusCode.completed,
    );
  }

  private getAchievementTargetId(task: WorkflowTaskWithInstance): string {
    if (!task.instance.targetId) {
      throw new WorkflowInvalidStateError("Workflow instance target achievement is missing.");
    }

    return task.instance.targetId;
  }

  private async findReviewableAchievement(
    client: AchievementTransactionClient,
    context: UserContext,
    achievementId: string,
  ): Promise<AchievementStateRecord> {
    const where = this.policyQueryFactory.achievementDepartmentWhere(
      context,
      PermissionCode.achievementReviewDepartment,
    );
    const achievement = await this.achievementRepository.findStateByIdWhereInTransaction(
      client,
      achievementId,
      where,
    );

    if (!achievement) {
      throw new WorkflowAccessDeniedError("Achievement department review access is denied.");
    }

    if (achievement.status !== AchievementStatusCode.pendingDepartmentReview) {
      throw new WorkflowInvalidStateError(
        `Achievement must be ${AchievementStatusCode.pendingDepartmentReview}, but current status is ${achievement.status}.`,
      );
    }

    return achievement;
  }

  private toDepartmentReviewAuditEvent(
    input: ReviewDepartmentTaskInput,
    oldTask: WorkflowTaskWithInstance,
    updatedTask: WorkflowTaskRecord,
    updatedAchievement: AchievementStateRecord,
  ): CreateAuditEventInput {
    const workflowInstanceId = oldTask.instanceId;
    const achievementId = this.getAchievementTargetId(oldTask);

    return {
      actor: {
        userId: input.context.userId,
        departmentId: input.context.departmentId,
      },
      action: toAuditActionCode(input.action),
      target: {
        type: AuditTargetTypeCode.workflowTask,
        id: oldTask.id,
        departmentId: updatedAchievement.departmentId,
        secretLevel: updatedAchievement.secretLevel as AuthorizationSecretLevelCode,
      },
      oldValue: {
        workflowInstanceId,
        achievementId,
        action: input.action,
        taskStatus: oldTask.status,
        instanceStatus: oldTask.instance.status,
        currentStep: oldTask.instance.currentStep,
        achievementStatus: AchievementStatusCode.pendingDepartmentReview,
      },
      newValue: {
        workflowInstanceId,
        achievementId,
        action: input.action,
        taskStatus: updatedTask.status,
        instanceStatus: input.nextWorkflowStatus,
        currentStep: input.nextWorkflowStep,
        achievementStatus: updatedAchievement.status,
        reviewedAt: input.reviewedAt.toISOString(),
      },
    };
  }

  private toWorkflowArchiveAuditEvent(
    input: CompleteAchievementArchiveWorkflowInput,
    instance: WorkflowInstanceAggregate,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: input.archivedById,
        departmentId: input.actorDepartmentId,
      },
      action: AuditActionCode.archive,
      target: {
        type: AuditTargetTypeCode.workflowInstance,
        id: input.instanceId,
        departmentId: input.targetDepartmentId,
        secretLevel: input.targetSecretLevel,
      },
      oldValue: {
        workflowInstanceId: input.instanceId,
        achievementId: input.achievementId,
        action: WorkflowActionTypeCode.archive,
        instanceStatus: WorkflowInstanceStatusCode.active,
        currentStep: WorkflowStepCode.archive,
      },
      newValue: {
        workflowInstanceId: input.instanceId,
        achievementId: input.achievementId,
        action: WorkflowActionTypeCode.archive,
        instanceStatus: instance.status,
        currentStep: instance.currentStep,
        completedAt: input.archivedAt.toISOString(),
      },
    };
  }
}

type ReviewDepartmentTaskInput = {
  context: UserContext;
  taskId: string;
  action: WorkflowActionTypeCode;
  nextTaskStatus: WorkflowTaskStatusCode;
  nextWorkflowStatus: WorkflowInstanceStatusCode;
  nextWorkflowStep: WorkflowStepCode | null;
  nextAchievementStatus: AchievementStatusCode;
  reviewedAt: Date;
  comment?: string;
};

const toAuditActionCode = (action: WorkflowActionTypeCode): AuditActionCode => {
  if (action === WorkflowActionTypeCode.approve) {
    return AuditActionCode.approve;
  }

  if (action === WorkflowActionTypeCode.reject) {
    return AuditActionCode.reject;
  }

  if (action === WorkflowActionTypeCode.archive) {
    return AuditActionCode.archive;
  }

  throw new WorkflowInvalidStateError(`Unsupported workflow audit action: ${action}.`);
};
