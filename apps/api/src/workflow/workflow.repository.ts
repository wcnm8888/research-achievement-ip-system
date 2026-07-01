import { Inject, Injectable } from "@nestjs/common";
import {
  DepartmentStatus,
  PermissionStatus,
  Prisma,
  RoleStatus,
  UserStatus,
} from "@prisma/client";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import {
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "./domain/workflow-domain.types";
import {
  WorkflowInstanceTransitionConflictError,
  WorkflowTaskTransitionConflictError,
} from "./domain/workflow-errors";
import {
  toAchievementWorkflowInstanceCreateData,
  toFeeWorkflowInstanceCreateData,
  toFeeWorkflowSubmitActionCreateData,
  toWorkflowActionCreateData,
  toWorkflowInstanceTransitionData,
  toWorkflowSubmitActionCreateData,
  toWorkflowTaskCreateData,
  toWorkflowTaskTransitionActionData,
  toWorkflowTaskTransitionData,
} from "./domain/workflow-prisma.mapper";
import {
  CreateAchievementReviewWorkflowInput,
  CreateFeeReviewWorkflowInput,
  CreateWorkflowActionInput,
  FindWorkflowTasksForAssigneeInput,
  WorkflowInstanceAggregate,
  WorkflowInstanceTransitionInput,
  WorkflowTaskRecord,
  WorkflowTaskTransitionInput,
  WorkflowTaskWithInstance,
  workflowInstanceInclude,
  workflowTaskRecordSelect,
  workflowTaskWithInstanceInclude,
} from "./domain/workflow-repository.types";

export type WorkflowTransactionClient = Pick<
  Prisma.TransactionClient,
  "workflowInstance" | "workflowTask" | "workflowAction" | "user" | "department"
>;

export type WorkflowDepartmentRecord = {
  id: string;
};

@Injectable()
export class WorkflowRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async createAchievementReviewWorkflow(
    input: CreateAchievementReviewWorkflowInput,
  ): Promise<WorkflowInstanceAggregate> {
    return this.prisma.$transaction((tx) =>
      this.createAchievementReviewWorkflowInTransaction(
        tx as WorkflowTransactionClient,
        input,
      ),
    );
  }

  async createAchievementReviewWorkflowInTransaction(
    client: WorkflowTransactionClient,
    input: CreateAchievementReviewWorkflowInput,
  ): Promise<WorkflowInstanceAggregate> {
    const instance = await client.workflowInstance.create({
      data: toAchievementWorkflowInstanceCreateData(input),
      select: { id: true },
    });

    await client.workflowTask.create({
      data: toWorkflowTaskCreateData({
        instanceId: instance.id,
        assigneeId: input.departmentReviewerId,
        stepCode: WorkflowStepCode.departmentReview,
      }),
    });

    await client.workflowAction.create({
      data: toWorkflowSubmitActionCreateData(instance.id, input),
    });

    const aggregate = await client.workflowInstance.findUnique({
      where: { id: instance.id },
      include: workflowInstanceInclude,
    });

    if (!aggregate) {
      throw new Error(`Created workflow instance was not found: ${instance.id}.`);
    }

    return aggregate;
  }

  async createFeeReviewWorkflowInTransaction(
    client: WorkflowTransactionClient,
    input: CreateFeeReviewWorkflowInput,
  ): Promise<WorkflowInstanceAggregate> {
    const instance = await client.workflowInstance.create({
      data: toFeeWorkflowInstanceCreateData(input),
      select: { id: true },
    });

    for (const reviewerId of input.reviewerIds) {
      await client.workflowTask.create({
        data: toWorkflowTaskCreateData({
          instanceId: instance.id,
          assigneeId: reviewerId,
          stepCode: WorkflowStepCode.feeReview,
        }),
      });
    }

    await client.workflowAction.create({
      data: toFeeWorkflowSubmitActionCreateData(instance.id, input),
    });

    const aggregate = await client.workflowInstance.findUnique({
      where: { id: instance.id },
      include: workflowInstanceInclude,
    });

    if (!aggregate) {
      throw new Error(`Created workflow instance was not found: ${instance.id}.`);
    }

    return aggregate;
  }

  findActiveInstanceForAchievement(
    achievementId: string,
  ): Promise<WorkflowInstanceAggregate | null> {
    return this.findActiveInstanceForAchievementInTransaction(this.prisma, achievementId);
  }

  findActiveInstanceForAchievementInTransaction(
    client: WorkflowTransactionClient,
    achievementId: string,
  ): Promise<WorkflowInstanceAggregate | null> {
    return client.workflowInstance.findFirst({
      where: {
        targetType: WorkflowTargetTypeCode.achievement,
        targetId: achievementId,
        status: WorkflowInstanceStatusCode.active,
      },
      include: workflowInstanceInclude,
    });
  }

  findActiveInstanceForFeeRecordInTransaction(
    client: WorkflowTransactionClient,
    feeRecordId: string,
  ): Promise<WorkflowInstanceAggregate | null> {
    return client.workflowInstance.findFirst({
      where: {
        targetType: WorkflowTargetTypeCode.feeRecord,
        targetId: feeRecordId,
        status: WorkflowInstanceStatusCode.active,
      },
      include: workflowInstanceInclude,
    });
  }

  findTaskById(taskId: string): Promise<WorkflowTaskWithInstance | null> {
    return this.findTaskByIdInTransaction(this.prisma, taskId);
  }

  findTaskByIdInTransaction(
    client: WorkflowTransactionClient,
    taskId: string,
  ): Promise<WorkflowTaskWithInstance | null> {
    return client.workflowTask.findUnique({
      where: { id: taskId },
      include: workflowTaskWithInstanceInclude,
    });
  }

  findTaskByIdForAssignee(
    taskId: string,
    assigneeId: string,
  ): Promise<WorkflowTaskWithInstance | null> {
    return this.findTaskByIdForAssigneeInTransaction(this.prisma, taskId, assigneeId);
  }

  findTaskByIdForAssigneeInTransaction(
    client: WorkflowTransactionClient,
    taskId: string,
    assigneeId: string,
  ): Promise<WorkflowTaskWithInstance | null> {
    return client.workflowTask.findFirst({
      where: {
        id: taskId,
        assigneeId,
      },
      include: workflowTaskWithInstanceInclude,
    });
  }

  findPendingFeeReviewTaskForAssigneeInTransaction(
    client: WorkflowTransactionClient,
    feeRecordId: string,
    assigneeId: string,
  ): Promise<WorkflowTaskWithInstance | null> {
    return client.workflowTask.findFirst({
      where: {
        assigneeId,
        status: WorkflowTaskStatusCode.pending,
        stepCode: WorkflowStepCode.feeReview,
        instance: {
          targetType: WorkflowTargetTypeCode.feeRecord,
          targetId: feeRecordId,
          status: WorkflowInstanceStatusCode.active,
          currentStep: WorkflowStepCode.feeReview,
        },
      },
      include: workflowTaskWithInstanceInclude,
    });
  }

  findPendingTasksForAssignee(assigneeId: string): Promise<WorkflowTaskWithInstance[]> {
    return this.findPendingTasksForAssigneeInTransaction(this.prisma, assigneeId);
  }

  findPendingTasksForAssigneeInTransaction(
    client: WorkflowTransactionClient,
    assigneeId: string,
  ): Promise<WorkflowTaskWithInstance[]> {
    return this.findTasksForAssigneeInTransaction(client, {
      assigneeId,
      status: WorkflowTaskStatusCode.pending,
    });
  }

  findTasksForAssignee(
    input: FindWorkflowTasksForAssigneeInput,
  ): Promise<WorkflowTaskWithInstance[]> {
    return this.findTasksForAssigneeInTransaction(this.prisma, input);
  }

  findTasksForAssigneeInTransaction(
    client: WorkflowTransactionClient,
    input: FindWorkflowTasksForAssigneeInput,
  ): Promise<WorkflowTaskWithInstance[]> {
    const instanceWhere: Prisma.WorkflowInstanceWhereInput = {};

    if (input.targetType) {
      instanceWhere.targetType = input.targetType;
    } else if (input.targetTypes?.length) {
      instanceWhere.targetType = { in: [...input.targetTypes] };
    }

    if (input.achievementId) {
      instanceWhere.targetType = WorkflowTargetTypeCode.achievement;
      instanceWhere.targetId = input.achievementId;
    }

    if (input.feeRecordId) {
      instanceWhere.targetType = WorkflowTargetTypeCode.feeRecord;
      instanceWhere.targetId = input.feeRecordId;
    }

    return client.workflowTask.findMany({
      where: {
        assigneeId: input.assigneeId,
        ...(input.status ? { status: input.status } : {}),
        ...(Object.keys(instanceWhere).length ? { instance: instanceWhere } : {}),
      },
      include: workflowTaskWithInstanceInclude,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }

  async findDepartmentReviewerUserIds(departmentId: string): Promise<string[]> {
    return this.findDepartmentReviewerUserIdsInTransaction(this.prisma, departmentId);
  }

  async findActiveDepartmentByIdInTransaction(
    client: WorkflowTransactionClient,
    departmentId: string,
  ): Promise<WorkflowDepartmentRecord | null> {
    return client.department.findFirst({
      where: {
        id: departmentId,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true },
    });
  }

  async findDepartmentReviewerUserIdsInTransaction(
    client: WorkflowTransactionClient,
    departmentId: string,
  ): Promise<string[]> {
    const users = await client.user.findMany({
      where: {
        departmentId,
        status: UserStatus.ACTIVE,
        department: {
          status: DepartmentStatus.ACTIVE,
          archivedAt: null,
        },
        userRoles: {
          some: {
            revokedAt: null,
            scopeType: ScopeType.department,
            departmentId,
            role: {
              code: RoleCode.researchSecretary,
              status: RoleStatus.ACTIVE,
            },
          },
        },
      },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return users.map((user) => user.id);
  }

  async findFeeReviewerUserIdsInTransaction(
    client: WorkflowTransactionClient,
    departmentId: string,
  ): Promise<string[]> {
    const users = await client.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        department: {
          status: DepartmentStatus.ACTIVE,
          archivedAt: null,
        },
        userRoles: {
          some: {
            revokedAt: null,
            scopeType: ScopeType.department,
            departmentId,
            role: {
              code: RoleCode.financeReviewer,
              status: RoleStatus.ACTIVE,
              rolePermissions: {
                some: {
                  permission: {
                    code: PermissionCode.feeReviewDepartment,
                    status: PermissionStatus.ACTIVE,
                  },
                },
              },
            },
          },
        },
      },
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return users.map((user) => user.id);
  }

  async transitionTaskWithAction(
    input: WorkflowTaskTransitionInput,
  ): Promise<WorkflowTaskRecord> {
    return this.prisma.$transaction((tx) =>
      this.transitionTaskWithActionInTransaction(
        tx as WorkflowTransactionClient,
        input,
      ),
    );
  }

  async transitionTaskWithActionInTransaction(
    client: WorkflowTransactionClient,
    input: WorkflowTaskTransitionInput,
  ): Promise<WorkflowTaskRecord> {
    const result = await client.workflowTask.updateMany({
      where: {
        id: input.taskId,
        instanceId: input.instanceId,
        status: input.expectedTaskStatus,
      },
      data: toWorkflowTaskTransitionData(input),
    });

    if (result.count !== 1) {
      throw new WorkflowTaskTransitionConflictError(
        input.taskId,
        input.expectedTaskStatus,
      );
    }

    await client.workflowAction.create({
      data: toWorkflowTaskTransitionActionData(input),
    });

    const task = await client.workflowTask.findUnique({
      where: { id: input.taskId },
      select: workflowTaskRecordSelect,
    });

    if (!task) {
      throw new Error(`Updated workflow task was not found: ${input.taskId}.`);
    }

    return task;
  }

  async createAction(input: CreateWorkflowActionInput): Promise<void> {
    await this.prisma.$transaction((tx) =>
      this.createActionInTransaction(tx as WorkflowTransactionClient, input),
    );
  }

  async createActionInTransaction(
    client: WorkflowTransactionClient,
    input: CreateWorkflowActionInput,
  ): Promise<void> {
    await client.workflowAction.create({
      data: toWorkflowActionCreateData(input),
    });
  }

  async cancelPendingTasksForInstanceExceptInTransaction(
    client: WorkflowTransactionClient,
    input: {
      instanceId: string;
      exceptTaskId: string;
      stepCode: WorkflowStepCode;
      completedAt: Date;
    },
  ): Promise<number> {
    const result = await client.workflowTask.updateMany({
      where: {
        instanceId: input.instanceId,
        id: { not: input.exceptTaskId },
        stepCode: input.stepCode,
        status: WorkflowTaskStatusCode.pending,
      },
      data: {
        status: WorkflowTaskStatusCode.cancelled,
        completedAt: input.completedAt,
      },
    });

    return result.count;
  }

  async transitionInstance(
    input: WorkflowInstanceTransitionInput,
  ): Promise<WorkflowInstanceAggregate> {
    return this.prisma.$transaction((tx) =>
      this.transitionInstanceInTransaction(tx as WorkflowTransactionClient, input),
    );
  }

  async transitionInstanceInTransaction(
    client: WorkflowTransactionClient,
    input: WorkflowInstanceTransitionInput,
  ): Promise<WorkflowInstanceAggregate> {
    const result = await client.workflowInstance.updateMany({
      where: {
        id: input.instanceId,
        status: input.expectedStatus,
      },
      data: toWorkflowInstanceTransitionData(input),
    });

    if (result.count !== 1) {
      throw new WorkflowInstanceTransitionConflictError(
        input.instanceId,
        input.expectedStatus,
      );
    }

    const instance = await client.workflowInstance.findUnique({
      where: { id: input.instanceId },
      include: workflowInstanceInclude,
    });

    if (!instance) {
      throw new Error(`Updated workflow instance was not found: ${input.instanceId}.`);
    }

    return instance;
  }
}
