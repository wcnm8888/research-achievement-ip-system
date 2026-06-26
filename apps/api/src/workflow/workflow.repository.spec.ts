import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { DepartmentStatus, RoleStatus, UserStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import {
  WorkflowActionTypeCode,
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
  WorkflowRepository,
  type WorkflowTransactionClient,
} from "./workflow.repository";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  instance: "50000000-0000-4000-8000-000000000001",
  task: "60000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  submitter: "40000000-0000-4000-8000-000000000001",
  reviewer: "40000000-0000-4000-8000-000000000002",
};

const makeInstanceAggregate = () => ({
  id: ids.instance,
  targetType: "ACHIEVEMENT",
  targetId: ids.achievement,
  status: "ACTIVE",
  currentStep: WorkflowStepCode.departmentReview,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  completedAt: null,
  cancelledAt: null,
  tasks: [],
  actions: [],
});

const makeTask = () => ({
  id: ids.task,
  instanceId: ids.instance,
  assigneeId: ids.reviewer,
  stepCode: WorkflowStepCode.departmentReview,
  status: WorkflowTaskStatusCode.pending,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  claimedAt: null,
  completedAt: null,
});

const createFakePrisma = () => {
  const tx = {
    workflowInstance: {
      create: vi.fn().mockResolvedValue({ id: ids.instance }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(makeInstanceAggregate()),
      findFirst: vi.fn(),
    },
    workflowTask: {
      create: vi.fn().mockResolvedValue({ id: ids.task }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(makeTask()),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    workflowAction: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
    },
  };

  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    workflowInstance: {
      findFirst: vi.fn(),
    },
    workflowTask: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
    },
  };

  return { prisma, tx };
};

const createRepository = () => {
  const { prisma, tx } = createFakePrisma();
  const repository = new WorkflowRepository(prisma as unknown as PrismaService);

  return { repository, prisma, tx };
};

describe("WorkflowRepository dependency injection", () => {
  it("declares explicit PrismaService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(WorkflowRepository)).toEqual([PrismaService]);
  });
});

describe("WorkflowRepository.createAchievementReviewWorkflow", () => {
  it("creates an active achievement workflow, department review task, and submit action in one transaction", async () => {
    const { repository, prisma, tx } = createRepository();
    const submittedAt = new Date("2026-01-02T00:00:00.000Z");

    await repository.createAchievementReviewWorkflow({
      achievementId: ids.achievement,
      submittedById: ids.submitter,
      departmentReviewerId: ids.reviewer,
      submittedAt,
      submitComment: "Submitted for review.",
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.workflowInstance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetType: "ACHIEVEMENT",
        targetId: ids.achievement,
        status: "ACTIVE",
        currentStep: WorkflowStepCode.departmentReview,
      }),
      select: { id: true },
    });
    expect(tx.workflowTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        assigneeId: ids.reviewer,
        stepCode: WorkflowStepCode.departmentReview,
      }),
    });
    expect(tx.workflowAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        taskId: null,
        actorId: ids.submitter,
        action: "SUBMIT",
        comment: "Submitted for review.",
        createdAt: submittedAt,
      }),
    });
    expect(tx.workflowInstance.findUnique).toHaveBeenCalledWith({
      where: { id: ids.instance },
      include: expect.objectContaining({
        tasks: expect.any(Object),
        actions: expect.any(Object),
      }),
    });
  });

  it("can create an achievement review workflow with a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as WorkflowTransactionClient;

    await repository.createAchievementReviewWorkflowInTransaction(transactionClient, {
      achievementId: ids.achievement,
      submittedById: ids.submitter,
      departmentReviewerId: ids.reviewer,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.workflowInstance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetType: "ACHIEVEMENT",
        targetId: ids.achievement,
        status: "ACTIVE",
        currentStep: WorkflowStepCode.departmentReview,
      }),
      select: { id: true },
    });
    expect(tx.workflowTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        assigneeId: ids.reviewer,
      }),
    });
    expect(tx.workflowAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        actorId: ids.submitter,
        action: WorkflowActionTypeCode.submit,
      }),
    });
  });
});

describe("WorkflowRepository read helpers", () => {
  it("finds an active workflow instance for an achievement", async () => {
    const { repository, prisma } = createRepository();

    await repository.findActiveInstanceForAchievement(ids.achievement);

    expect(prisma.workflowInstance.findFirst).toHaveBeenCalledWith({
      where: {
        targetType: "ACHIEVEMENT",
        targetId: ids.achievement,
        status: "ACTIVE",
      },
      include: expect.any(Object),
    });
  });

  it("finds tasks by id, assignee, and pending assignee list", async () => {
    const { repository, prisma } = createRepository();

    await repository.findTaskById(ids.task);
    await repository.findTaskByIdForAssignee(ids.task, ids.reviewer);
    await repository.findPendingTasksForAssignee(ids.reviewer);

    expect(prisma.workflowTask.findUnique).toHaveBeenCalledWith({
      where: { id: ids.task },
      include: expect.any(Object),
    });
    expect(prisma.workflowTask.findFirst).toHaveBeenCalledWith({
      where: {
        id: ids.task,
        assigneeId: ids.reviewer,
      },
      include: expect.any(Object),
    });
    expect(prisma.workflowTask.findMany).toHaveBeenCalledWith({
      where: {
        assigneeId: ids.reviewer,
        status: WorkflowTaskStatusCode.pending,
      },
      include: expect.any(Object),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  });

  it("finds assignee tasks with optional status and achievement target filters", async () => {
    const { repository, prisma } = createRepository();

    await repository.findTasksForAssignee({
      assigneeId: ids.reviewer,
      status: WorkflowTaskStatusCode.approved,
      achievementId: ids.achievement,
    });

    expect(prisma.workflowTask.findMany).toHaveBeenCalledWith({
      where: {
        assigneeId: ids.reviewer,
        status: WorkflowTaskStatusCode.approved,
        instance: {
          targetType: WorkflowTargetTypeCode.achievement,
          targetId: ids.achievement,
        },
      },
      include: expect.any(Object),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  });

  it("finds active department research secretary users for concrete task assignment", async () => {
    const { repository, prisma } = createRepository();
    prisma.user.findMany.mockResolvedValue([{ id: ids.reviewer }]);

    await expect(repository.findDepartmentReviewerUserIds(ids.department)).resolves.toEqual([
      ids.reviewer,
    ]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        departmentId: ids.department,
        status: UserStatus.ACTIVE,
        department: {
          status: DepartmentStatus.ACTIVE,
          archivedAt: null,
        },
        userRoles: {
          some: {
            revokedAt: null,
            scopeType: ScopeType.department,
            departmentId: ids.department,
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
  });

  it("finds active departments for workflow write guards", async () => {
    const { repository, tx } = createRepository();
    tx.department.findFirst.mockResolvedValue({ id: ids.department });

    await expect(
      repository.findActiveDepartmentByIdInTransaction(
        tx as unknown as WorkflowTransactionClient,
        ids.department,
      ),
    ).resolves.toEqual({ id: ids.department });

    expect(tx.department.findFirst).toHaveBeenCalledWith({
      where: {
        id: ids.department,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true },
    });
  });

  it("can read workflow data with a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as WorkflowTransactionClient;
    tx.user.findMany.mockResolvedValue([{ id: ids.reviewer }]);

    await repository.findActiveInstanceForAchievementInTransaction(
      transactionClient,
      ids.achievement,
    );
    await repository.findTaskByIdForAssigneeInTransaction(
      transactionClient,
      ids.task,
      ids.reviewer,
    );
    await expect(
      repository.findDepartmentReviewerUserIdsInTransaction(transactionClient, ids.department),
    ).resolves.toEqual([ids.reviewer]);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.workflowInstance.findFirst).toHaveBeenCalledWith({
      where: {
        targetType: "ACHIEVEMENT",
        targetId: ids.achievement,
        status: "ACTIVE",
      },
      include: expect.any(Object),
    });
    expect(tx.workflowTask.findFirst).toHaveBeenCalledWith({
      where: {
        id: ids.task,
        assigneeId: ids.reviewer,
      },
      include: expect.any(Object),
    });
    expect(tx.user.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        departmentId: ids.department,
        status: UserStatus.ACTIVE,
        department: {
          status: DepartmentStatus.ACTIVE,
          archivedAt: null,
        },
      }),
      select: { id: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  });
});

describe("WorkflowRepository.transitionTaskWithAction", () => {
  it("updates a task with expected-status guard and writes the action", async () => {
    const { repository, prisma, tx } = createRepository();
    const completedAt = new Date("2026-01-03T00:00:00.000Z");

    await repository.transitionTaskWithAction({
      taskId: ids.task,
      instanceId: ids.instance,
      actorId: ids.reviewer,
      action: WorkflowActionTypeCode.approve,
      expectedTaskStatus: WorkflowTaskStatusCode.pending,
      nextTaskStatus: WorkflowTaskStatusCode.approved,
      comment: "Approved.",
      completedAt,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.workflowTask.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.task,
        instanceId: ids.instance,
        status: WorkflowTaskStatusCode.pending,
      },
      data: expect.objectContaining({
        status: WorkflowTaskStatusCode.approved,
        completedAt,
      }),
    });
    expect(tx.workflowAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        taskId: ids.task,
        actorId: ids.reviewer,
        action: WorkflowActionTypeCode.approve,
        comment: "Approved.",
      }),
    });
    expect(tx.workflowTask.findUnique).toHaveBeenCalledWith({
      where: { id: ids.task },
      select: expect.objectContaining({
        id: true,
        status: true,
        completedAt: true,
      }),
    });
  });

  it("raises a task transition conflict when expected status does not match", async () => {
    const { repository, tx } = createRepository();
    tx.workflowTask.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.transitionTaskWithAction({
        taskId: ids.task,
        instanceId: ids.instance,
        actorId: ids.reviewer,
        action: WorkflowActionTypeCode.reject,
        expectedTaskStatus: WorkflowTaskStatusCode.pending,
        nextTaskStatus: WorkflowTaskStatusCode.rejected,
      }),
    ).rejects.toBeInstanceOf(WorkflowTaskTransitionConflictError);
    expect(tx.workflowAction.create).not.toHaveBeenCalled();
  });

  it("can transition a task with action using a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as WorkflowTransactionClient;

    await repository.transitionTaskWithActionInTransaction(transactionClient, {
      taskId: ids.task,
      instanceId: ids.instance,
      actorId: ids.reviewer,
      action: WorkflowActionTypeCode.reject,
      expectedTaskStatus: WorkflowTaskStatusCode.pending,
      nextTaskStatus: WorkflowTaskStatusCode.rejected,
      comment: "Needs revision.",
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.workflowTask.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.task,
        instanceId: ids.instance,
        status: WorkflowTaskStatusCode.pending,
      },
      data: expect.objectContaining({
        status: WorkflowTaskStatusCode.rejected,
        completedAt: expect.any(Date),
      }),
    });
    expect(tx.workflowAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        taskId: ids.task,
        actorId: ids.reviewer,
        action: WorkflowActionTypeCode.reject,
        comment: "Needs revision.",
      }),
    });
  });
});

describe("WorkflowRepository.createAction", () => {
  it("writes an instance-level action in a repository-owned transaction", async () => {
    const { repository, prisma, tx } = createRepository();

    await repository.createAction({
      instanceId: ids.instance,
      taskId: null,
      actorId: ids.submitter,
      action: WorkflowActionTypeCode.archive,
      comment: "Archived.",
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.workflowAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        taskId: null,
        actorId: ids.submitter,
        action: WorkflowActionTypeCode.archive,
        comment: "Archived.",
      }),
    });
  });

  it("can write an action using a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as WorkflowTransactionClient;

    await repository.createActionInTransaction(transactionClient, {
      instanceId: ids.instance,
      actorId: ids.submitter,
      action: WorkflowActionTypeCode.archive,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.workflowAction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instanceId: ids.instance,
        taskId: null,
        actorId: ids.submitter,
        action: WorkflowActionTypeCode.archive,
        comment: null,
      }),
    });
  });
});

describe("WorkflowRepository.transitionInstance", () => {
  it("updates an active instance with expected-status guard", async () => {
    const { repository, tx } = createRepository();
    const completedAt = new Date("2026-01-04T00:00:00.000Z");

    await repository.transitionInstance({
      instanceId: ids.instance,
      expectedStatus: WorkflowInstanceStatusCode.active,
      nextStatus: WorkflowInstanceStatusCode.completed,
      currentStep: null,
      completedAt,
    });

    expect(tx.workflowInstance.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.instance,
        status: WorkflowInstanceStatusCode.active,
      },
      data: expect.objectContaining({
        status: WorkflowInstanceStatusCode.completed,
        currentStep: null,
        completedAt,
      }),
    });
    expect(tx.workflowInstance.findUnique).toHaveBeenCalledWith({
      where: { id: ids.instance },
      include: expect.any(Object),
    });
  });

  it("raises an instance transition conflict when expected status does not match", async () => {
    const { repository, tx } = createRepository();
    tx.workflowInstance.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.transitionInstance({
        instanceId: ids.instance,
        expectedStatus: WorkflowInstanceStatusCode.active,
        nextStatus: WorkflowInstanceStatusCode.cancelled,
      }),
    ).rejects.toBeInstanceOf(WorkflowInstanceTransitionConflictError);
    expect(tx.workflowInstance.findUnique).not.toHaveBeenCalled();
  });

  it("can transition an instance using a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as WorkflowTransactionClient;

    await repository.transitionInstanceInTransaction(transactionClient, {
      instanceId: ids.instance,
      expectedStatus: WorkflowInstanceStatusCode.active,
      nextStatus: WorkflowInstanceStatusCode.active,
      currentStep: WorkflowStepCode.archive,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.workflowInstance.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.instance,
        status: WorkflowInstanceStatusCode.active,
      },
      data: expect.objectContaining({
        status: WorkflowInstanceStatusCode.active,
        currentStep: WorkflowStepCode.archive,
      }),
    });
  });
});
