import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it, vi } from "vitest";
import { AuditService } from "../audit/audit.service";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import { AchievementRepository } from "../achievements/achievement.repository";
import { AchievementStatusCode } from "../achievements/domain/achievement-domain.types";
import { AchievementStatusTransitionConflictError } from "../achievements/domain/achievement-repository.errors";
import { AchievementStateRecord } from "../achievements/domain/achievement-repository.types";
import {
  ActiveWorkflowInstanceAlreadyExistsError,
  DepartmentReviewerNotFoundError,
  FeeReviewerNotFoundError,
  WorkflowDepartmentUnavailableError,
  WorkflowAccessDeniedError,
  WorkflowInvalidPayloadError,
  WorkflowInvalidStateError,
} from "./domain/workflow-errors";
import {
  WorkflowActionTypeCode,
  WorkflowInstanceStatusCode,
  WorkflowStepCode,
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "./domain/workflow-domain.types";
import {
  WorkflowInstanceAggregate,
  WorkflowTaskRecord,
  WorkflowTaskWithInstance,
} from "./domain/workflow-repository.types";
import { WorkflowRepository, type WorkflowTransactionClient } from "./workflow.repository";
import { WorkflowService } from "./workflow.service";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  instance: "50000000-0000-4000-8000-000000000001",
  submitter: "40000000-0000-4000-8000-000000000001",
  task: "60000000-0000-4000-8000-000000000001",
  reviewerA: "40000000-0000-4000-8000-000000000002",
  reviewerB: "40000000-0000-4000-8000-000000000003",
};

const now = new Date("2026-01-02T00:00:00.000Z");
const departmentWhere = { departmentId: { in: [ids.department] } };

const makeContext = (
  permissionCodes: readonly PermissionCode[] = [
    PermissionCode.achievementReviewDepartment,
  ],
): UserContext => ({
  userId: ids.reviewerA,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [],
  permissionCodes,
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
});

const makeTask = (
  overrides: Partial<WorkflowTaskWithInstance> = {},
): WorkflowTaskWithInstance =>
  ({
    id: ids.task,
    instanceId: ids.instance,
    assigneeId: ids.reviewerA,
    stepCode: WorkflowStepCode.departmentReview,
    status: WorkflowTaskStatusCode.pending,
    createdAt: now,
    updatedAt: now,
    claimedAt: null,
    completedAt: null,
    instance: {
      id: ids.instance,
      targetType: WorkflowTargetTypeCode.achievement,
      targetId: ids.achievement,
      status: WorkflowInstanceStatusCode.active,
      currentStep: WorkflowStepCode.departmentReview,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    },
    ...overrides,
  }) as WorkflowTaskWithInstance;

const makeFeeTask = (
  overrides: Partial<WorkflowTaskWithInstance> = {},
): WorkflowTaskWithInstance =>
  makeTask({
    stepCode: WorkflowStepCode.feeReview,
    instance: {
      id: ids.instance,
      targetType: WorkflowTargetTypeCode.feeRecord,
      targetId: ids.feeRecord,
      status: WorkflowInstanceStatusCode.active,
      currentStep: WorkflowStepCode.feeReview,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    },
    ...overrides,
  });

const makeTaskRecord = (
  status: WorkflowTaskStatusCode = WorkflowTaskStatusCode.approved,
): WorkflowTaskRecord => ({
  id: ids.task,
  instanceId: ids.instance,
  assigneeId: ids.reviewerA,
  stepCode: WorkflowStepCode.departmentReview,
  status,
  createdAt: now,
  updatedAt: now,
  claimedAt: null,
  completedAt: now,
});

const makeArchiveInstance = (
  overrides: Partial<WorkflowInstanceAggregate> = {},
): WorkflowInstanceAggregate =>
  ({
    id: ids.instance,
    targetType: WorkflowTargetTypeCode.achievement,
    targetId: ids.achievement,
    status: WorkflowInstanceStatusCode.active,
    currentStep: WorkflowStepCode.archive,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelledAt: null,
    tasks: [],
    actions: [],
    ...overrides,
  }) as WorkflowInstanceAggregate;

const makeAchievementState = (
  status: AchievementStatusCode = AchievementStatusCode.pendingDepartmentReview,
): AchievementStateRecord => ({
  id: ids.achievement,
  status,
  secretLevel: "INTERNAL",
  departmentId: ids.department,
  ownerUserId: ids.submitter,
  submittedById: ids.submitter,
  updatedById: ids.submitter,
  archivedById: null,
  voidedById: null,
  version: 1,
  submittedAt: now,
  archivedAt: null,
  voidedAt: null,
  voidReason: null,
});

const createService = () => {
  const tx = {} as WorkflowTransactionClient & AuditTransactionClient;
  const repository = {
    findActiveInstanceForAchievementInTransaction: vi.fn().mockResolvedValue(null),
    findActiveInstanceForFeeRecordInTransaction: vi.fn().mockResolvedValue(null),
    findActiveDepartmentByIdInTransaction: vi.fn().mockResolvedValue({ id: ids.department }),
    findDepartmentReviewerUserIdsInTransaction: vi
      .fn()
      .mockResolvedValue([ids.reviewerA, ids.reviewerB]),
    findFeeReviewerUserIdsInTransaction: vi
      .fn()
      .mockResolvedValue([ids.reviewerA, ids.reviewerB]),
    createAchievementReviewWorkflowInTransaction: vi.fn().mockResolvedValue({
      id: "50000000-0000-4000-8000-000000000001",
    }),
    createFeeReviewWorkflowInTransaction: vi.fn().mockResolvedValue({
      id: "50000000-0000-4000-8000-000000000001",
    }),
    findTaskByIdForAssigneeInTransaction: vi.fn().mockResolvedValue(makeTask()),
    findPendingFeeReviewTaskForAssigneeInTransaction: vi
      .fn()
      .mockResolvedValue(makeFeeTask()),
    findTaskByIdForAssignee: vi.fn().mockResolvedValue(makeTask()),
    findTasksForAssignee: vi.fn().mockResolvedValue([makeTask()]),
    transitionTaskWithActionInTransaction: vi
      .fn()
      .mockResolvedValue(makeTaskRecord()),
    createActionInTransaction: vi.fn(),
    cancelPendingTasksForInstanceExceptInTransaction: vi.fn(),
    transitionInstanceInTransaction: vi.fn().mockResolvedValue(
      makeArchiveInstance({
        status: WorkflowInstanceStatusCode.completed,
        currentStep: null,
        completedAt: now,
      }),
    ),
  };
  const achievementRepository = {
    findStateByIdWhereInTransaction: vi
      .fn()
      .mockResolvedValue(makeAchievementState()),
    transitionStatusInTransaction: vi
      .fn()
      .mockResolvedValue(makeAchievementState(AchievementStatusCode.pendingArchive)),
  };
  const rbacPolicy = {
    hasPermission: vi.fn(
      (context: UserContext | null | undefined, permission: PermissionCode) =>
        context?.permissionCodes.includes(permission)
          ? { effect: "ALLOW", reason: "allowed" }
          : { effect: "DENY", reason: "denied" },
    ),
  };
  const policyQueryFactory = {
    achievementDepartmentWhere: vi.fn().mockReturnValue(departmentWhere),
  };
  const prisma = {
    $transaction: vi.fn((callback) => callback(tx)),
  };
  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-log" }),
  };
  const service = new WorkflowService(
    repository as unknown as WorkflowRepository,
    achievementRepository as unknown as AchievementRepository,
    rbacPolicy as unknown as RbacPolicyService,
    policyQueryFactory as unknown as PolicyQueryFactory,
    prisma as unknown as PrismaService,
    auditService as unknown as AuditService,
  );

  return {
    service,
    repository,
    achievementRepository,
    rbacPolicy,
    policyQueryFactory,
    prisma,
    auditService,
    tx,
  };
};

describe("WorkflowService dependency injection", () => {
  it("declares explicit constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(WorkflowService)).toEqual([
      WorkflowRepository,
      AchievementRepository,
      RbacPolicyService,
      PolicyQueryFactory,
      PrismaService,
      AuditService,
    ]);
  });
});

describe("WorkflowService.prepareAchievementReviewOnSubmitInTransaction", () => {
  it("selects the first stable-sorted department reviewer", async () => {
    const { service, repository, tx } = createService();

    await expect(
      service.prepareAchievementReviewOnSubmitInTransaction(tx, {
        achievementId: ids.achievement,
        departmentId: ids.department,
      }),
    ).resolves.toEqual({ departmentReviewerId: ids.reviewerA });
    expect(repository.findActiveInstanceForAchievementInTransaction).toHaveBeenCalledWith(
      tx,
      ids.achievement,
    );
    expect(repository.findActiveDepartmentByIdInTransaction).toHaveBeenCalledWith(
      tx,
      ids.department,
    );
    expect(repository.findDepartmentReviewerUserIdsInTransaction).toHaveBeenCalledWith(
      tx,
      ids.department,
    );
  });

  it("rejects when an active workflow instance already exists", async () => {
    const { service, repository, tx } = createService();
    repository.findActiveInstanceForAchievementInTransaction.mockResolvedValue({
      id: "50000000-0000-4000-8000-000000000001",
    });

    await expect(
      service.prepareAchievementReviewOnSubmitInTransaction(tx, {
        achievementId: ids.achievement,
        departmentId: ids.department,
      }),
    ).rejects.toBeInstanceOf(ActiveWorkflowInstanceAlreadyExistsError);
    expect(repository.findActiveDepartmentByIdInTransaction).not.toHaveBeenCalled();
    expect(repository.findDepartmentReviewerUserIdsInTransaction).not.toHaveBeenCalled();
  });

  it("rejects archived departments before reviewer lookup or task creation", async () => {
    const { service, repository, tx } = createService();
    repository.findActiveDepartmentByIdInTransaction.mockResolvedValue(null);

    await expect(
      service.prepareAchievementReviewOnSubmitInTransaction(tx, {
        achievementId: ids.achievement,
        departmentId: ids.department,
      }),
    ).rejects.toBeInstanceOf(WorkflowDepartmentUnavailableError);

    expect(repository.findDepartmentReviewerUserIdsInTransaction).not.toHaveBeenCalled();
    expect(repository.createAchievementReviewWorkflowInTransaction).not.toHaveBeenCalled();
  });

  it("rejects when no department reviewer can be assigned", async () => {
    const { service, repository, tx } = createService();
    repository.findDepartmentReviewerUserIdsInTransaction.mockResolvedValue([]);

    await expect(
      service.prepareAchievementReviewOnSubmitInTransaction(tx, {
        achievementId: ids.achievement,
        departmentId: ids.department,
      }),
    ).rejects.toBeInstanceOf(DepartmentReviewerNotFoundError);
    expect(repository.findDepartmentReviewerUserIdsInTransaction).toHaveBeenCalledWith(
      tx,
      ids.department,
    );
  });
});

describe("WorkflowService.createAchievementReviewOnSubmitInTransaction", () => {
  it("delegates workflow creation without opening its own transaction", async () => {
    const { service, repository, tx } = createService();
    const submittedAt = new Date("2026-01-02T00:00:00.000Z");

    await service.createAchievementReviewOnSubmitInTransaction(tx, {
      achievementId: ids.achievement,
      submittedById: ids.submitter,
      departmentReviewerId: ids.reviewerA,
      submittedAt,
    });

    expect(repository.createAchievementReviewWorkflowInTransaction).toHaveBeenCalledWith(tx, {
      achievementId: ids.achievement,
      submittedById: ids.submitter,
      departmentReviewerId: ids.reviewerA,
      submittedAt,
    });
  });
});

describe("WorkflowService.ensureFeeReviewWorkflowInTransaction", () => {
  it("creates fee review tasks for all eligible finance reviewers", async () => {
    const { service, repository, tx } = createService();

    await service.ensureFeeReviewWorkflowInTransaction(tx, {
      feeRecordId: ids.feeRecord,
      departmentId: ids.department,
      requestedById: ids.submitter,
      requestedAt: now,
    });

    expect(repository.findActiveInstanceForFeeRecordInTransaction).toHaveBeenCalledWith(
      tx,
      ids.feeRecord,
    );
    expect(repository.findActiveDepartmentByIdInTransaction).toHaveBeenCalledWith(
      tx,
      ids.department,
    );
    expect(repository.findFeeReviewerUserIdsInTransaction).toHaveBeenCalledWith(
      tx,
      ids.department,
    );
    expect(repository.createFeeReviewWorkflowInTransaction).toHaveBeenCalledWith(tx, {
      feeRecordId: ids.feeRecord,
      requestedById: ids.submitter,
      reviewerIds: [ids.reviewerA, ids.reviewerB],
      requestedAt: now,
    });
  });

  it("reuses an active fee workflow instance instead of creating duplicates", async () => {
    const { service, repository, tx } = createService();
    repository.findActiveInstanceForFeeRecordInTransaction.mockResolvedValueOnce(
      makeArchiveInstance({
        targetType: WorkflowTargetTypeCode.feeRecord,
        targetId: ids.feeRecord,
        currentStep: WorkflowStepCode.feeReview,
      }),
    );

    await service.ensureFeeReviewWorkflowInTransaction(tx, {
      feeRecordId: ids.feeRecord,
      departmentId: ids.department,
      requestedById: ids.submitter,
    });

    expect(repository.findActiveDepartmentByIdInTransaction).not.toHaveBeenCalled();
    expect(repository.createFeeReviewWorkflowInTransaction).not.toHaveBeenCalled();
  });

  it("rejects fee workflow creation when no finance reviewer is eligible", async () => {
    const { service, repository, tx } = createService();
    repository.findFeeReviewerUserIdsInTransaction.mockResolvedValueOnce([]);

    await expect(
      service.ensureFeeReviewWorkflowInTransaction(tx, {
        feeRecordId: ids.feeRecord,
        departmentId: ids.department,
        requestedById: ids.submitter,
      }),
    ).rejects.toBeInstanceOf(FeeReviewerNotFoundError);
    expect(repository.createFeeReviewWorkflowInTransaction).not.toHaveBeenCalled();
  });
});

describe("WorkflowService archive helpers", () => {
  it("prepares an active ARCHIVE instance for achievement archive", async () => {
    const { service, repository, tx } = createService();
    repository.findActiveInstanceForAchievementInTransaction.mockResolvedValue(
      makeArchiveInstance(),
    );

    await expect(
      service.prepareAchievementArchiveInTransaction(tx, {
        achievementId: ids.achievement,
      }),
    ).resolves.toEqual(makeArchiveInstance());

    expect(repository.findActiveInstanceForAchievementInTransaction).toHaveBeenCalledWith(
      tx,
      ids.achievement,
    );
  });

  it("rejects archive preparation when no active instance exists", async () => {
    const { service, repository, tx } = createService();
    repository.findActiveInstanceForAchievementInTransaction.mockResolvedValue(null);

    await expect(
      service.prepareAchievementArchiveInTransaction(tx, {
        achievementId: ids.achievement,
      }),
    ).rejects.toBeInstanceOf(WorkflowInvalidStateError);
  });

  it("rejects archive preparation when the instance is not at ARCHIVE step", async () => {
    const { service, repository, tx } = createService();
    repository.findActiveInstanceForAchievementInTransaction.mockResolvedValue(
      makeArchiveInstance({ currentStep: WorkflowStepCode.departmentReview }),
    );

    await expect(
      service.prepareAchievementArchiveInTransaction(tx, {
        achievementId: ids.achievement,
      }),
    ).rejects.toBeInstanceOf(WorkflowInvalidStateError);
  });

  it("writes an instance-level ARCHIVE action and completes the workflow instance", async () => {
    const { service, repository, auditService, tx } = createService();

    await service.completeAchievementArchiveInTransaction(tx, {
      instanceId: ids.instance,
      achievementId: ids.achievement,
      archivedById: ids.reviewerA,
      actorDepartmentId: ids.department,
      targetDepartmentId: ids.department,
      targetSecretLevel: "INTERNAL",
      archivedAt: now,
      auditClient: tx,
    });

    expect(repository.createActionInTransaction).toHaveBeenCalledWith(tx, {
      instanceId: ids.instance,
      taskId: null,
      actorId: ids.reviewerA,
      action: WorkflowActionTypeCode.archive,
    });
    expect(repository.transitionInstanceInTransaction).toHaveBeenCalledWith(tx, {
      instanceId: ids.instance,
      expectedStatus: WorkflowInstanceStatusCode.active,
      nextStatus: WorkflowInstanceStatusCode.completed,
      currentStep: null,
      completedAt: now,
    });
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.reviewerA, departmentId: ids.department },
        action: AuditActionCode.archive,
        target: {
          type: AuditTargetTypeCode.workflowInstance,
          id: ids.instance,
          departmentId: ids.department,
          secretLevel: "INTERNAL",
        },
        oldValue: {
          workflowInstanceId: ids.instance,
          achievementId: ids.achievement,
          action: WorkflowActionTypeCode.archive,
          instanceStatus: WorkflowInstanceStatusCode.active,
          currentStep: WorkflowStepCode.archive,
        },
        newValue: {
          workflowInstanceId: ids.instance,
          achievementId: ids.achievement,
          action: WorkflowActionTypeCode.archive,
          instanceStatus: WorkflowInstanceStatusCode.completed,
          currentStep: null,
          completedAt: now.toISOString(),
        },
      }),
    );
  });

  it("rejects archive completion when workflow instance audit writing fails", async () => {
    const { service, repository, auditService, tx } = createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);

    await expect(
      service.completeAchievementArchiveInTransaction(tx, {
        instanceId: ids.instance,
        achievementId: ids.achievement,
        archivedById: ids.reviewerA,
        actorDepartmentId: ids.department,
        targetDepartmentId: ids.department,
        targetSecretLevel: "INTERNAL",
        archivedAt: now,
        auditClient: tx,
      }),
    ).rejects.toBe(auditError);

    expect(repository.createActionInTransaction).toHaveBeenCalled();
    expect(repository.transitionInstanceInTransaction).toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });
});

describe("WorkflowService.approveDepartmentReviewTask", () => {
  it("approves the assigned department review task in one transaction", async () => {
    const {
      service,
      repository,
      achievementRepository,
      policyQueryFactory,
      prisma,
      auditService,
      tx,
    } = createService();
    const context = makeContext();

    await expect(
      service.approveDepartmentReviewTask(context, ids.task, {
        comment: " Approved ",
      }),
    ).resolves.toEqual({
      task: makeTaskRecord(),
      achievement: makeAchievementState(AchievementStatusCode.pendingArchive),
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.findTaskByIdForAssigneeInTransaction).toHaveBeenCalledWith(
      tx,
      ids.task,
      ids.reviewerA,
    );
    expect(policyQueryFactory.achievementDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.achievementReviewDepartment,
    );
    expect(achievementRepository.findStateByIdWhereInTransaction).toHaveBeenCalledWith(
      tx,
      ids.achievement,
      departmentWhere,
    );
    expect(repository.transitionTaskWithActionInTransaction).toHaveBeenCalledWith(tx, {
      taskId: ids.task,
      instanceId: ids.instance,
      actorId: ids.reviewerA,
      action: WorkflowActionTypeCode.approve,
      expectedTaskStatus: WorkflowTaskStatusCode.pending,
      nextTaskStatus: WorkflowTaskStatusCode.approved,
      comment: "Approved",
      completedAt: expect.any(Date),
    });
    expect(repository.transitionInstanceInTransaction).toHaveBeenCalledWith(tx, {
      instanceId: ids.instance,
      expectedStatus: WorkflowInstanceStatusCode.active,
      nextStatus: WorkflowInstanceStatusCode.active,
      currentStep: WorkflowStepCode.archive,
    });
    expect(achievementRepository.transitionStatusInTransaction).toHaveBeenCalledWith(tx, {
      achievementId: ids.achievement,
      expectedStatus: AchievementStatusCode.pendingDepartmentReview,
      nextStatus: AchievementStatusCode.pendingArchive,
      updatedById: ids.reviewerA,
    });
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.reviewerA, departmentId: ids.department },
        action: AuditActionCode.approve,
        target: {
          type: AuditTargetTypeCode.workflowTask,
          id: ids.task,
          departmentId: ids.department,
          secretLevel: "INTERNAL",
        },
        oldValue: {
          workflowInstanceId: ids.instance,
          achievementId: ids.achievement,
          action: WorkflowActionTypeCode.approve,
          taskStatus: WorkflowTaskStatusCode.pending,
          instanceStatus: WorkflowInstanceStatusCode.active,
          currentStep: WorkflowStepCode.departmentReview,
          achievementStatus: AchievementStatusCode.pendingDepartmentReview,
        },
        newValue: {
          workflowInstanceId: ids.instance,
          achievementId: ids.achievement,
          action: WorkflowActionTypeCode.approve,
          taskStatus: WorkflowTaskStatusCode.approved,
          instanceStatus: WorkflowInstanceStatusCode.active,
          currentStep: WorkflowStepCode.archive,
          achievementStatus: AchievementStatusCode.pendingArchive,
          reviewedAt: expect.any(String),
        },
      }),
    );
    expect(auditService.recordEventInTransaction.mock.calls[0]![1]).not.toEqual(
      expect.objectContaining({ comment: expect.anything() }),
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls[0]![1]))
      .not.toContain("Approved");
  });

  it("denies review when the user lacks department review permission", async () => {
    const { service, prisma, auditService } = createService();

    await expect(
      service.approveDepartmentReviewTask(makeContext([]), ids.task),
    ).rejects.toBeInstanceOf(WorkflowAccessDeniedError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("denies review when the task is not assigned to the actor", async () => {
    const { service, repository, auditService } = createService();
    repository.findTaskByIdForAssigneeInTransaction.mockResolvedValue(null);

    await expect(
      service.approveDepartmentReviewTask(makeContext(), ids.task),
    ).rejects.toBeInstanceOf(WorkflowAccessDeniedError);
    expect(repository.transitionTaskWithActionInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("denies review when the achievement is outside department scope", async () => {
    const { service, repository, achievementRepository, auditService } = createService();
    achievementRepository.findStateByIdWhereInTransaction.mockResolvedValue(null);

    await expect(
      service.approveDepartmentReviewTask(makeContext(), ids.task),
    ).rejects.toBeInstanceOf(WorkflowAccessDeniedError);
    expect(repository.transitionTaskWithActionInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects state conflicts before mutating workflow records", async () => {
    const { service, repository, auditService } = createService();
    repository.findTaskByIdForAssigneeInTransaction.mockResolvedValue(
      makeTask({ status: WorkflowTaskStatusCode.approved }),
    );

    await expect(
      service.approveDepartmentReviewTask(makeContext(), ids.task),
    ).rejects.toBeInstanceOf(WorkflowInvalidStateError);
    expect(repository.transitionTaskWithActionInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("maps achievement transition conflicts to workflow invalid state errors", async () => {
    const { service, achievementRepository } = createService();
    achievementRepository.transitionStatusInTransaction.mockRejectedValue(
      new AchievementStatusTransitionConflictError(
        ids.achievement,
        AchievementStatusCode.pendingDepartmentReview,
      ),
    );

    await expect(
      service.approveDepartmentReviewTask(makeContext(), ids.task),
    ).rejects.toBeInstanceOf(WorkflowInvalidStateError);
  });

  it("rejects approve when audit writing fails in the same transaction boundary", async () => {
    const { service, repository, achievementRepository, auditService, tx } =
      createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);

    await expect(
      service.approveDepartmentReviewTask(makeContext(), ids.task),
    ).rejects.toBe(auditError);

    expect(repository.transitionTaskWithActionInTransaction).toHaveBeenCalled();
    expect(repository.transitionInstanceInTransaction).toHaveBeenCalled();
    expect(achievementRepository.transitionStatusInTransaction).toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });
});

describe("WorkflowService list/detail read methods", () => {
  it("lists the current user's pending workflow tasks by default", async () => {
    const { service, repository } = createService();

    await expect(service.listMyWorkflowTasks(makeContext())).resolves.toEqual({
      items: [makeTask()],
    });

    expect(repository.findTasksForAssignee).toHaveBeenCalledWith({
      assigneeId: ids.reviewerA,
      status: WorkflowTaskStatusCode.pending,
      targetTypes: [WorkflowTargetTypeCode.achievement],
      achievementId: undefined,
      feeRecordId: undefined,
    });
  });

  it("lists the current user's workflow task history with explicit filters", async () => {
    const { service, repository } = createService();

    await service.listMyWorkflowTasks(makeContext(), {
      status: WorkflowTaskStatusCode.approved,
      achievementId: ids.achievement,
    });

    expect(repository.findTasksForAssignee).toHaveBeenCalledWith({
      assigneeId: ids.reviewerA,
      status: WorkflowTaskStatusCode.approved,
      targetTypes: [WorkflowTargetTypeCode.achievement],
      achievementId: ids.achievement,
      feeRecordId: undefined,
    });
  });

  it("lists fee review tasks when scoped fee review permission is present", async () => {
    const { service, repository } = createService();
    repository.findTasksForAssignee.mockResolvedValue([makeFeeTask()]);
    const context = makeContext([PermissionCode.feeReviewDepartment]);

    await expect(
      service.listMyWorkflowTasks(context, {
        targetType: WorkflowTargetTypeCode.feeRecord,
        feeRecordId: ids.feeRecord,
      }),
    ).resolves.toEqual({ items: [makeFeeTask()] });

    expect(repository.findTasksForAssignee).toHaveBeenCalledWith({
      assigneeId: ids.reviewerA,
      status: WorkflowTaskStatusCode.pending,
      targetType: WorkflowTargetTypeCode.feeRecord,
      achievementId: undefined,
      feeRecordId: ids.feeRecord,
    });
  });

  it("denies achievement task listing to fee-only reviewers", async () => {
    const { service, repository } = createService();

    await expect(
      service.listMyWorkflowTasks(makeContext([PermissionCode.feeReviewDepartment]), {
        targetType: WorkflowTargetTypeCode.achievement,
      }),
    ).rejects.toBeInstanceOf(WorkflowAccessDeniedError);
    expect(repository.findTasksForAssignee).not.toHaveBeenCalled();
  });

  it("denies workflow task listing without review permission", async () => {
    const { service, repository } = createService();

    await expect(service.listMyWorkflowTasks(makeContext([]))).rejects.toBeInstanceOf(
      WorkflowAccessDeniedError,
    );
    expect(repository.findTasksForAssignee).not.toHaveBeenCalled();
  });

  it("gets a current user's assignee-scoped workflow task", async () => {
    const { service, repository } = createService();

    await expect(service.getMyWorkflowTask(makeContext(), ids.task)).resolves.toEqual(
      makeTask(),
    );
    expect(repository.findTaskByIdForAssignee).toHaveBeenCalledWith(
      ids.task,
      ids.reviewerA,
    );
  });

  it("denies workflow task detail when the assignee-scoped lookup misses", async () => {
    const { service, repository } = createService();
    repository.findTaskByIdForAssignee.mockResolvedValue(null);

    await expect(
      service.getMyWorkflowTask(makeContext(), ids.task),
    ).rejects.toBeInstanceOf(WorkflowAccessDeniedError);
  });
});

describe("WorkflowService.completeFeeReviewTaskInTransaction", () => {
  it("completes the actor's pending fee review task and cancels sibling candidates", async () => {
    const { service, repository, tx } = createService();
    const context = makeContext([PermissionCode.feeReviewDepartment]);
    repository.transitionTaskWithActionInTransaction.mockResolvedValue(
      makeTaskRecord(WorkflowTaskStatusCode.approved),
    );

    await expect(
      service.completeFeeReviewTaskInTransaction(tx, {
        context,
        feeRecordId: ids.feeRecord,
        action: WorkflowActionTypeCode.approve,
        nextTaskStatus: WorkflowTaskStatusCode.approved,
        reviewedAt: now,
        comment: "finance checked",
      }),
    ).resolves.toEqual(makeTaskRecord(WorkflowTaskStatusCode.approved));

    expect(repository.findPendingFeeReviewTaskForAssigneeInTransaction).toHaveBeenCalledWith(
      tx,
      ids.feeRecord,
      ids.reviewerA,
    );
    expect(repository.transitionTaskWithActionInTransaction).toHaveBeenCalledWith(tx, {
      taskId: ids.task,
      instanceId: ids.instance,
      actorId: ids.reviewerA,
      action: WorkflowActionTypeCode.approve,
      expectedTaskStatus: WorkflowTaskStatusCode.pending,
      nextTaskStatus: WorkflowTaskStatusCode.approved,
      comment: "finance checked",
      completedAt: now,
    });
    expect(repository.cancelPendingTasksForInstanceExceptInTransaction).toHaveBeenCalledWith(
      tx,
      {
        instanceId: ids.instance,
        exceptTaskId: ids.task,
        stepCode: WorkflowStepCode.feeReview,
        completedAt: now,
      },
    );
    expect(repository.transitionInstanceInTransaction).toHaveBeenCalledWith(tx, {
      instanceId: ids.instance,
      expectedStatus: WorkflowInstanceStatusCode.active,
      nextStatus: WorkflowInstanceStatusCode.completed,
      currentStep: null,
      completedAt: now,
    });
  });

  it("denies fee task completion without fee review permission", async () => {
    const { service, repository, tx } = createService();

    await expect(
      service.completeFeeReviewTaskInTransaction(tx, {
        context: makeContext([PermissionCode.feeManageDepartment]),
        feeRecordId: ids.feeRecord,
        action: WorkflowActionTypeCode.approve,
        nextTaskStatus: WorkflowTaskStatusCode.approved,
        reviewedAt: now,
      }),
    ).rejects.toBeInstanceOf(WorkflowAccessDeniedError);
    expect(repository.findPendingFeeReviewTaskForAssigneeInTransaction).not.toHaveBeenCalled();
  });

  it("rejects completion when no pending fee task is assigned to the actor", async () => {
    const { service, repository, tx } = createService();
    repository.findPendingFeeReviewTaskForAssigneeInTransaction.mockResolvedValueOnce(null);

    await expect(
      service.completeFeeReviewTaskInTransaction(tx, {
        context: makeContext([PermissionCode.feeReviewDepartment]),
        feeRecordId: ids.feeRecord,
        action: WorkflowActionTypeCode.reject,
        nextTaskStatus: WorkflowTaskStatusCode.rejected,
        reviewedAt: now,
        comment: "missing support",
      }),
    ).rejects.toBeInstanceOf(WorkflowInvalidStateError);
    expect(repository.transitionTaskWithActionInTransaction).not.toHaveBeenCalled();
  });
});

describe("WorkflowService.rejectDepartmentReviewTask", () => {
  it("rejects the assigned department review task in one transaction", async () => {
    const { service, repository, achievementRepository, auditService, tx } =
      createService();
    repository.transitionTaskWithActionInTransaction.mockResolvedValue(
      makeTaskRecord(WorkflowTaskStatusCode.rejected),
    );
    achievementRepository.transitionStatusInTransaction.mockResolvedValue(
      makeAchievementState(AchievementStatusCode.departmentRejected),
    );

    await expect(
      service.rejectDepartmentReviewTask(makeContext(), ids.task, {
        comment: " Needs more proof ",
      }),
    ).resolves.toEqual({
      task: makeTaskRecord(WorkflowTaskStatusCode.rejected),
      achievement: makeAchievementState(AchievementStatusCode.departmentRejected),
    });

    expect(repository.transitionTaskWithActionInTransaction).toHaveBeenCalledWith(tx, {
      taskId: ids.task,
      instanceId: ids.instance,
      actorId: ids.reviewerA,
      action: WorkflowActionTypeCode.reject,
      expectedTaskStatus: WorkflowTaskStatusCode.pending,
      nextTaskStatus: WorkflowTaskStatusCode.rejected,
      comment: "Needs more proof",
      completedAt: expect.any(Date),
    });
    expect(repository.transitionInstanceInTransaction).toHaveBeenCalledWith(tx, {
      instanceId: ids.instance,
      expectedStatus: WorkflowInstanceStatusCode.active,
      nextStatus: WorkflowInstanceStatusCode.completed,
      currentStep: null,
      completedAt: expect.any(Date),
    });
    expect(achievementRepository.transitionStatusInTransaction).toHaveBeenCalledWith(tx, {
      achievementId: ids.achievement,
      expectedStatus: AchievementStatusCode.pendingDepartmentReview,
      nextStatus: AchievementStatusCode.departmentRejected,
      updatedById: ids.reviewerA,
    });
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.reviewerA, departmentId: ids.department },
        action: AuditActionCode.reject,
        target: {
          type: AuditTargetTypeCode.workflowTask,
          id: ids.task,
          departmentId: ids.department,
          secretLevel: "INTERNAL",
        },
        oldValue: {
          workflowInstanceId: ids.instance,
          achievementId: ids.achievement,
          action: WorkflowActionTypeCode.reject,
          taskStatus: WorkflowTaskStatusCode.pending,
          instanceStatus: WorkflowInstanceStatusCode.active,
          currentStep: WorkflowStepCode.departmentReview,
          achievementStatus: AchievementStatusCode.pendingDepartmentReview,
        },
        newValue: {
          workflowInstanceId: ids.instance,
          achievementId: ids.achievement,
          action: WorkflowActionTypeCode.reject,
          taskStatus: WorkflowTaskStatusCode.rejected,
          instanceStatus: WorkflowInstanceStatusCode.completed,
          currentStep: null,
          achievementStatus: AchievementStatusCode.departmentRejected,
          reviewedAt: expect.any(String),
        },
      }),
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls[0]![1]))
      .not.toContain("Needs more proof");
  });

  it("requires a non-empty reject comment before opening a transaction", async () => {
    const { service, prisma, auditService } = createService();

    await expect(
      service.rejectDepartmentReviewTask(makeContext(), ids.task, {
        comment: "   ",
      }),
    ).rejects.toBeInstanceOf(WorkflowInvalidPayloadError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects reject when audit writing fails in the same transaction boundary", async () => {
    const { service, repository, achievementRepository, auditService, tx } =
      createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);
    repository.transitionTaskWithActionInTransaction.mockResolvedValue(
      makeTaskRecord(WorkflowTaskStatusCode.rejected),
    );
    achievementRepository.transitionStatusInTransaction.mockResolvedValue(
      makeAchievementState(AchievementStatusCode.departmentRejected),
    );

    await expect(
      service.rejectDepartmentReviewTask(makeContext(), ids.task, {
        comment: "Needs more proof",
      }),
    ).rejects.toBe(auditError);

    expect(repository.transitionTaskWithActionInTransaction).toHaveBeenCalled();
    expect(repository.transitionInstanceInTransaction).toHaveBeenCalled();
    expect(achievementRepository.transitionStatusInTransaction).toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });
});
