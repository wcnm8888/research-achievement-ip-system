import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { NotificationChannelCode, NotificationStatusCode } from "../notifications/domain/notification-domain.types";
import { WorkflowAccessDeniedError } from "../workflow/domain/workflow-errors";
import {
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "../workflow/domain/workflow-domain.types";
import {
  ReminderLevelCode,
  ReminderSkipReasonCode,
  ReminderStatusCode,
  ReminderTargetTypeCode,
} from "./domain/reminder-domain.types";
import {
  ReminderConflictError,
  ReminderNotFoundError,
} from "./domain/reminder-errors";
import {
  ReminderRepositoryPort,
  ReminderTaskStateRecord,
} from "./domain/reminder-repository.types";
import { ReminderService } from "./reminder.service";

const ids = {
  feeRecord: "80000000-0000-4000-8000-000000000001",
  feeRecord2: "80000000-0000-4000-8000-000000000002",
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  receiver: "40000000-0000-4000-8000-000000000001",
  otherUser: "40000000-0000-4000-8000-000000000002",
  notification: "90000000-0000-4000-8000-000000000001",
  workflowTask: "70000000-0000-4000-8000-000000000001",
};

const remindDate = new Date("2026-06-18T00:00:00.000Z");
const sentAt = new Date("2026-06-18T10:00:00.000Z");
const confirmedAt = new Date("2026-06-18T10:05:00.000Z");

const systemActor = {
  actorType: "SYSTEM",
} as const;

const userContext: UserContext = {
  userId: ids.receiver,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [],
  permissionCodes: [],
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
};

const makeTaskState = (
  status: ReminderStatusCode = ReminderStatusCode.pending,
  overrides: Partial<ReminderTaskStateRecord> = {},
): ReminderTaskStateRecord => ({
  id: ids.feeRecord,
  targetType: ReminderTargetTypeCode.feeRecord,
  targetId: ids.feeRecord,
  remindDate,
  remindLevel: ReminderLevelCode.days30,
  receiverId: ids.receiver,
  status,
  sentAt: status === ReminderStatusCode.sent ? sentAt : null,
  confirmedAt: status === ReminderStatusCode.confirmed ? confirmedAt : null,
  ...overrides,
});

const createRepository = (overrides: Partial<ReminderRepositoryPort> = {}) => {
  const repository = {
    findEligibleFeeFactsForReminder: vi.fn().mockResolvedValue([
      {
        id: ids.feeRecord,
        achievementId: ids.achievement,
        departmentId: ids.department,
        dueDate: new Date("2026-07-18T00:00:00.000Z"),
        payStatus: PayStatusCode.pending,
        createdById: ids.receiver,
        updatedById: null,
        archivedAt: null,
        achievement: { ownerUserId: null },
      },
    ]),
    createTasksForCandidates: vi.fn().mockResolvedValue({
      uniqueCandidateCount: 1,
      createdCount: 1,
      duplicateCount: 0,
    }),
    findTasksForReceiver: vi.fn().mockResolvedValue([makeTaskState(ReminderStatusCode.sent)]),
    findSlaQueueForReceiver: vi.fn().mockResolvedValue([
      makeTaskState(ReminderStatusCode.pending, {
        remindLevel: ReminderLevelCode.overdue,
      }),
    ]),
    findSlaQueue: vi.fn().mockResolvedValue([
      {
        ...makeTaskState(ReminderStatusCode.pending, {
          remindLevel: ReminderLevelCode.overdue,
        }),
        receiverDepartmentId: ids.department,
      },
    ]),
    getActiveSlaPolicyConfig: vi.fn().mockResolvedValue(null),
    upsertSlaPolicyConfig: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        ...input,
        enabled: input.enabled ?? true,
        createdAt: sentAt,
        updatedAt: sentAt,
      }),
    ),
    enqueueSlaScanRun: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        id: "99000000-0000-4000-8000-000000000002",
        policyCode: input.policyCode,
        actorUserId: input.actorUserId,
        actorDepartmentId: input.actorDepartmentId,
        scanScope: input.scanScope,
        status: "QUEUED",
        triggerType: input.triggerType,
        idempotencyKey: input.idempotencyKey ?? null,
        lockKey: input.lockKey,
        lockedAt: null,
        lockedUntil: null,
        attemptCount: 0,
        failureReason: null,
        requestedAt: input.requestedAt,
        queuedAt: input.queuedAt,
        scannedCount: 0,
        escalatedCount: 0,
        skippedCount: 0,
        safeSummary: null,
        startedAt: input.queuedAt,
        completedAt: null,
        createdAt: input.queuedAt,
        updatedAt: input.queuedAt,
      }),
    ),
    findSlaScanRunByIdempotencyKey: vi.fn().mockResolvedValue(null),
    findNextQueuedSlaScanRun: vi.fn().mockResolvedValue({
      id: "99000000-0000-4000-8000-000000000002",
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      actorUserId: ids.receiver,
      actorDepartmentId: ids.department,
      scanScope: "ALL_RECEIVERS",
      status: "QUEUED",
      triggerType: "API_QUEUE",
      idempotencyKey: "manual-key",
      lockKey: "REMINDER_SLA_FULL_SCAN",
      lockedAt: null,
      lockedUntil: null,
      attemptCount: 0,
      failureReason: null,
      requestedAt: sentAt,
      queuedAt: sentAt,
      scannedCount: 0,
      escalatedCount: 0,
      skippedCount: 0,
      safeSummary: null,
      startedAt: sentAt,
      completedAt: null,
      createdAt: sentAt,
      updatedAt: sentAt,
    }),
    findActiveSlaScanLock: vi.fn().mockResolvedValue(null),
    skipExpiredSlaScanLocks: vi.fn().mockResolvedValue(0),
    claimSlaScanRun: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        id: input.id,
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: ids.receiver,
        actorDepartmentId: ids.department,
        scanScope: "ALL_RECEIVERS",
        status: "RUNNING",
        triggerType: "API_QUEUE",
        idempotencyKey: "manual-key",
        lockKey: input.lockKey,
        lockedAt: input.lockedAt,
        lockedUntil: input.lockedUntil,
        attemptCount: 1,
        failureReason: null,
        requestedAt: sentAt,
        queuedAt: sentAt,
        scannedCount: 0,
        escalatedCount: 0,
        skippedCount: 0,
        safeSummary: null,
        startedAt: input.startedAt,
        completedAt: null,
        createdAt: sentAt,
        updatedAt: input.startedAt,
      }),
    ),
    createSlaScanRun: vi.fn().mockResolvedValue({
      id: "99000000-0000-4000-8000-000000000001",
      policyCode: "REMINDER_SLA_DEFAULT_MVP",
      actorUserId: ids.receiver,
      actorDepartmentId: ids.department,
      scanScope: "ALL_RECEIVERS",
      status: "RUNNING",
      triggerType: "MANUAL",
      idempotencyKey: null,
      lockKey: "REMINDER_SLA_FULL_SCAN",
      lockedAt: sentAt,
      lockedUntil: new Date(sentAt.getTime() + 15 * 60 * 1000),
      attemptCount: 1,
      failureReason: null,
      requestedAt: sentAt,
      queuedAt: null,
      scannedCount: 0,
      escalatedCount: 0,
      skippedCount: 0,
      safeSummary: null,
      startedAt: sentAt,
      completedAt: null,
      createdAt: sentAt,
      updatedAt: sentAt,
    }),
    completeSlaScanRun: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        id: input.id,
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: ids.receiver,
        actorDepartmentId: ids.department,
        scanScope: "ALL_RECEIVERS",
        status: input.status,
        triggerType: "API_QUEUE",
        idempotencyKey: "manual-key",
        lockKey: "REMINDER_SLA_FULL_SCAN",
        lockedAt: sentAt,
        lockedUntil: new Date(sentAt.getTime() + 15 * 60 * 1000),
        attemptCount: 1,
        failureReason: input.failureReason ?? null,
        requestedAt: sentAt,
        queuedAt: sentAt,
        scannedCount: input.scannedCount,
        escalatedCount: input.escalatedCount,
        skippedCount: input.skippedCount,
        safeSummary: input.safeSummary,
        startedAt: sentAt,
        completedAt: input.completedAt,
        createdAt: sentAt,
        updatedAt: input.completedAt,
      }),
    ),
    listSlaScanRuns: vi.fn().mockResolvedValue([]),
    findDepartmentEscalationReceiverInTransaction: vi.fn().mockResolvedValue(null),
    findTaskStateById: vi.fn().mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    findTaskStateByIdInTransaction: vi.fn().mockResolvedValue(makeTaskState()),
    transitionTaskStatusInTransaction: vi.fn().mockImplementation(
      (
        _client: unknown,
        input: {
          nextStatus: ReminderStatusCode;
          sentAt?: Date;
          confirmedAt?: Date;
        },
      ) =>
        Promise.resolve({
          ...makeTaskState(input.nextStatus),
          sentAt:
            input.sentAt ??
            (input.nextStatus === ReminderStatusCode.sent ? sentAt : null),
          confirmedAt:
            input.confirmedAt ??
            (input.nextStatus === ReminderStatusCode.confirmed
              ? confirmedAt
              : null),
        }),
    ),
    updateTaskSentAtInTransaction: vi.fn().mockImplementation(
      (
        _client: unknown,
        input: {
          expectedStatus: ReminderStatusCode;
          sentAt: Date;
        },
      ) =>
        Promise.resolve({
          ...makeTaskState(input.expectedStatus),
          sentAt: input.sentAt,
        }),
    ),
    ...overrides,
  };

  return repository as unknown as ReminderRepositoryPort & {
    findTasksForReceiver: ReturnType<typeof vi.fn>;
    findSlaQueueForReceiver: ReturnType<typeof vi.fn>;
    findSlaQueue: ReturnType<typeof vi.fn>;
    getActiveSlaPolicyConfig: ReturnType<typeof vi.fn>;
    upsertSlaPolicyConfig: ReturnType<typeof vi.fn>;
    enqueueSlaScanRun: ReturnType<typeof vi.fn>;
    findSlaScanRunByIdempotencyKey: ReturnType<typeof vi.fn>;
    findNextQueuedSlaScanRun: ReturnType<typeof vi.fn>;
    findActiveSlaScanLock: ReturnType<typeof vi.fn>;
    skipExpiredSlaScanLocks: ReturnType<typeof vi.fn>;
    claimSlaScanRun: ReturnType<typeof vi.fn>;
    createSlaScanRun: ReturnType<typeof vi.fn>;
    completeSlaScanRun: ReturnType<typeof vi.fn>;
    listSlaScanRuns: ReturnType<typeof vi.fn>;
    findDepartmentEscalationReceiverInTransaction: ReturnType<typeof vi.fn>;
    findTaskStateById: ReturnType<typeof vi.fn>;
    findTaskStateByIdInTransaction: ReturnType<typeof vi.fn>;
    transitionTaskStatusInTransaction: ReturnType<typeof vi.fn>;
    updateTaskSentAtInTransaction: ReturnType<typeof vi.fn>;
  };
};

const createPrisma = () => {
  const tx = {
    reminderTask: {},
    notification: {},
    auditLog: {},
  };
  return {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    tx,
  };
};

const createNotificationService = () => ({
  sendFeeReminderInTransaction: vi.fn().mockResolvedValue({
    id: ids.notification,
    receiverId: ids.receiver,
    channel: NotificationChannelCode.inApp,
    title: "费用提醒",
    content: "有一条费用提醒待处理。",
    status: NotificationStatusCode.sent,
    createdAt: sentAt,
    sentAt,
    readAt: null,
  }),
});

const createAuditService = () => ({
  recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-id" }),
  listReminderEscalationHistory: vi.fn().mockResolvedValue({
    items: [
      {
        id: "audit-id",
        actorUserId: ids.receiver,
        actorDepartmentId: ids.department,
        operation: "ESCALATE_REMINDER_TO_DEPARTMENT",
        reminderTaskId: ids.feeRecord,
        escalationReceiverId: ids.otherUser,
        escalationTarget: "DEPARTMENT_ROLE",
        resolverStrategy: "ROLE:DEPARTMENT_ADMIN",
        notificationId: ids.notification,
        status: ReminderStatusCode.sent,
        sentAt: sentAt.toISOString(),
        nextEscalationAvailableAt: null,
        createdAt: sentAt,
      },
    ],
  }),
});

const createWorkflowService = () => ({
  listMyWorkflowTasks: vi.fn().mockResolvedValue({
    items: [
      {
        id: ids.workflowTask,
        instanceId: "71000000-0000-4000-8000-000000000001",
        assigneeId: ids.receiver,
        stepCode: "DEPARTMENT_REVIEW",
        status: WorkflowTaskStatusCode.pending,
        createdAt: new Date("2026-06-17T08:00:00.000Z"),
        updatedAt: new Date("2026-06-17T08:00:00.000Z"),
        claimedAt: null,
        completedAt: null,
        instance: {
          id: "71000000-0000-4000-8000-000000000001",
          targetType: WorkflowTargetTypeCode.achievement,
          targetId: ids.achievement,
          status: "ACTIVE",
          currentStep: "DEPARTMENT_REVIEW",
          createdAt: new Date("2026-06-17T08:00:00.000Z"),
          updatedAt: new Date("2026-06-17T08:00:00.000Z"),
          completedAt: null,
          cancelledAt: null,
        },
      },
    ],
  }),
});

const createService = (repository: ReminderRepositoryPort = createRepository()) => {
  const prisma = createPrisma();
  const notificationService = createNotificationService();
  const auditService = createAuditService();
  const workflowService = createWorkflowService();
  const service = new ReminderService(
    repository as never,
    prisma as never,
    notificationService as never,
    auditService as never,
    workflowService as never,
  );

  return { service, repository, prisma, notificationService, auditService, workflowService };
};

describe("ReminderService.generateFeeDueReminders", () => {
  it("normalizes explicit today, creates candidates, and returns a summary only", async () => {
    const repository = createRepository();
    const { service } = createService(repository);

    const result = await service.generateFeeDueReminders(
      "2026-06-18T23:30:00+08:00",
    );

    expect(repository.findEligibleFeeFactsForReminder).toHaveBeenCalledWith(
      new Date("2026-06-18T00:00:00.000Z"),
      {},
    );
    expect(repository.createTasksForCandidates).toHaveBeenCalledWith([
      expect.objectContaining({
        targetType: ReminderTargetTypeCode.feeRecord,
        targetId: ids.feeRecord,
        remindDate: new Date("2026-06-18T00:00:00.000Z"),
        remindLevel: ReminderLevelCode.days30,
        receiverId: ids.receiver,
      }),
    ]);
    expect(result).toEqual({
      today: new Date("2026-06-18T00:00:00.000Z"),
      scannedFeeCount: 1,
      candidateCount: 1,
      createdCount: 1,
      duplicateCount: 0,
      skipped: [],
    });
    expect(result).not.toHaveProperty("tasks");
  });

  it("passes custom take to the repository", async () => {
    const repository = createRepository();
    const { service } = createService(repository);

    await service.generateFeeDueReminders("2026-06-18", { take: 25 });

    expect(repository.findEligibleFeeFactsForReminder).toHaveBeenCalledWith(
      new Date("2026-06-18T00:00:00.000Z"),
      { take: 25 },
    );
  });

  it("uses repository default take when no custom take is provided", async () => {
    const repository = createRepository();
    const { service } = createService(repository);

    await service.generateFeeDueReminders("2026-06-18");

    expect(repository.findEligibleFeeFactsForReminder).toHaveBeenCalledWith(
      new Date("2026-06-18T00:00:00.000Z"),
      {},
    );
  });

  it("keeps missing receiver in skipped and does not create a task for it", async () => {
    const repository = createRepository({
      findEligibleFeeFactsForReminder: vi.fn().mockResolvedValue([
        {
          id: ids.feeRecord,
          achievementId: ids.achievement,
          departmentId: ids.department,
          dueDate: new Date("2026-07-18T00:00:00.000Z"),
          payStatus: PayStatusCode.pending,
          createdById: null,
          updatedById: null,
          archivedAt: null,
          achievement: { ownerUserId: null },
        },
      ]),
    });
    const { service } = createService(repository);

    const result = await service.generateFeeDueReminders("2026-06-18");

    expect(repository.createTasksForCandidates).not.toHaveBeenCalled();
    expect(result).toEqual({
      today: new Date("2026-06-18T00:00:00.000Z"),
      scannedFeeCount: 1,
      candidateCount: 0,
      createdCount: 0,
      duplicateCount: 0,
      skipped: [
        {
          feeRecordId: ids.feeRecord,
          reason: ReminderSkipReasonCode.missingReceiver,
        },
      ],
    });
  });

  it("does not write when there are no candidates", async () => {
    const repository = createRepository({
      findEligibleFeeFactsForReminder: vi.fn().mockResolvedValue([
        {
          id: ids.feeRecord,
          achievementId: ids.achievement,
          departmentId: ids.department,
          dueDate: new Date("2026-06-18T00:00:00.000Z"),
          payStatus: PayStatusCode.pending,
          createdById: ids.receiver,
          updatedById: null,
          archivedAt: null,
          achievement: { ownerUserId: null },
        },
      ]),
    });
    const { service } = createService(repository);

    const result = await service.generateFeeDueReminders("2026-06-18");

    expect(repository.createTasksForCandidates).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        scannedFeeCount: 1,
        candidateCount: 0,
        createdCount: 0,
        duplicateCount: 0,
      }),
    );
  });

  it("returns duplicate summary from repository writes", async () => {
    const repository = createRepository({
      createTasksForCandidates: vi.fn().mockResolvedValue({
        uniqueCandidateCount: 1,
        createdCount: 0,
        duplicateCount: 1,
      }),
    });
    const { service } = createService(repository);

    const result = await service.generateFeeDueReminders("2026-06-18");

    expect(result).toEqual(
      expect.objectContaining({
        candidateCount: 1,
        createdCount: 0,
        duplicateCount: 1,
      }),
    );
  });
});

describe("ReminderService.sendPendingReminder", () => {
  it("creates a notification, marks reminder sent, and writes two audit records in one transaction", async () => {
    const repository = createRepository();
    const { service, prisma, notificationService, auditService } =
      createService(repository);

    const result = await service.sendPendingReminder(systemActor, ids.feeRecord, {
      now: sentAt,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        receiverId: ids.receiver,
        sentAt,
      },
    );
    expect(repository.transitionTaskStatusInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.pending,
        nextStatus: ReminderStatusCode.sent,
        sentAt,
      },
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledTimes(2);
    expect(auditService.recordEventInTransaction).toHaveBeenNthCalledWith(
      1,
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.update,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.reminderTask,
          id: ids.feeRecord,
        }),
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenNthCalledWith(
      2,
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.create,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.notification,
          id: ids.notification,
        }),
      }),
    );
    expect(result.notification).toEqual(expect.objectContaining({ id: ids.notification }));
  });

  it("marks reminder failed and writes audit without creating a notification", async () => {
    const repository = createRepository();
    const { service, notificationService, auditService } = createService(repository);

    const result = await service.sendPendingReminder(systemActor, ids.feeRecord, {
      deliveryOutcome: "FAILED",
      now: sentAt,
    });

    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
    expect(repository.transitionTaskStatusInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.pending,
        nextStatus: ReminderStatusCode.failed,
      },
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledTimes(1);
    expect(result.notification).toBeNull();
  });

  it("rejects invalid send status before notification or audit writes", async () => {
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    } as never);
    const { service, notificationService, auditService } = createService(repository);

    await expect(
      service.sendPendingReminder(systemActor, ids.feeRecord, { now: sentAt }),
    ).rejects.toBeInstanceOf(ReminderConflictError);

    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("propagates audit failures so the transaction rejects", async () => {
    const repository = createRepository();
    const { service, auditService } = createService(repository);
    auditService.recordEventInTransaction.mockRejectedValueOnce(
      new Error("audit failed"),
    );

    await expect(
      service.sendPendingReminder(systemActor, ids.feeRecord, { now: sentAt }),
    ).rejects.toThrow("audit failed");
  });

  it("does not include notification content or sensitive fee and achievement fields in audit payloads", async () => {
    const repository = createRepository();
    const { service, auditService } = createService(repository);

    await service.sendPendingReminder(systemActor, ids.feeRecord, { now: sentAt });

    const auditPayload = JSON.stringify(
      auditService.recordEventInTransaction.mock.calls.map((call) => call[1]),
    );
    expect(auditPayload).not.toContain("有一条费用提醒待处理。");
    expect(auditPayload).not.toContain("amount");
    expect(auditPayload).not.toContain("voucherNo");
    expect(auditPayload).not.toContain("abstract");
    expect(auditPayload).not.toContain("storageKey");
    expect(auditPayload).not.toContain("checksum");
  });
});

describe("ReminderService.confirmReminder", () => {
  it("confirms a sent reminder for its receiver and writes audit in one transaction", async () => {
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    } as never);
    const { service, prisma, auditService } = createService(repository);

    const result = await service.confirmReminder(userContext, ids.feeRecord, {
      now: confirmedAt,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.transitionTaskStatusInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.sent,
        nextStatus: ReminderStatusCode.confirmed,
        confirmedAt,
      },
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.confirmReminder,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.reminderTask,
          id: ids.feeRecord,
        }),
      }),
    );
    expect(result.status).toBe(ReminderStatusCode.confirmed);
  });

  it("returns not found semantics for non-receivers and writes no audit", async () => {
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    } as never);
    const { service, auditService } = createService(repository);

    await expect(
      service.confirmReminder(
        {
          ...userContext,
          userId: ids.otherUser,
        },
        ids.feeRecord,
        { now: confirmedAt },
      ),
    ).rejects.toBeInstanceOf(ReminderNotFoundError);

    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects invalid confirm status", async () => {
    const repository = createRepository();
    const { service, auditService } = createService(repository);

    await expect(
      service.confirmReminder(userContext, ids.feeRecord, { now: confirmedAt }),
    ).rejects.toBeInstanceOf(ReminderConflictError);

    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });
});

describe("ReminderService.getReminderCenter", () => {
  it("returns safe fee reminders and workflow task projections for the current user", async () => {
    const repository = createRepository();
    const { service, workflowService } = createService(repository);

    const result = await service.getReminderCenter(userContext);

    expect(repository.findTasksForReceiver).toHaveBeenCalledWith({
      receiverId: ids.receiver,
      statuses: [
        ReminderStatusCode.pending,
        ReminderStatusCode.sent,
        ReminderStatusCode.failed,
      ],
      take: 50,
    });
    expect(workflowService.listMyWorkflowTasks).toHaveBeenCalledWith(userContext, {
      status: WorkflowTaskStatusCode.pending,
    });
    expect(result.summary).toEqual(
      expect.objectContaining({
        feeReminderCount: 1,
        workflowTaskCount: 1,
        sentCount: 1,
      }),
    );
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          itemType: "FEE_REMINDER",
          targetId: ids.feeRecord,
          canConfirm: true,
          canEscalate: true,
          nextEscalationAvailableAt: "2026-06-19T10:00:00.000Z",
          lastSentAt: "2026-06-18T10:00:00.000Z",
          canEscalateToDepartment: false,
        }),
        expect.objectContaining({
          itemType: "WORKFLOW_TASK",
          targetId: ids.achievement,
          canConfirm: false,
          canEscalate: false,
          canEscalateToDepartment: false,
        }),
      ]),
    );

    const payload = JSON.stringify(result);
    expect(payload).not.toContain("amount");
    expect(payload).not.toContain("voucherNo");
    expect(payload).not.toContain("content");
    expect(payload).not.toContain("oldValue");
    expect(payload).not.toContain("newValue");
  });

  it("still returns fee reminders when workflow permissions are not available", async () => {
    const { service, workflowService } = createService();
    workflowService.listMyWorkflowTasks.mockRejectedValueOnce(
      new WorkflowAccessDeniedError("Workflow task access is denied."),
    );

    const result = await service.getReminderCenter(userContext);

    expect(result.summary.feeReminderCount).toBe(1);
    expect(result.summary.workflowTaskCount).toBe(0);
  });

  it("returns governance rate-limit fields for recently sent reminders", async () => {
    const recentSentAt = new Date();
    const repository = createRepository({
      findTasksForReceiver: vi.fn().mockResolvedValue([
        makeTaskState(ReminderStatusCode.sent, {
          sentAt: recentSentAt,
        }),
      ]),
    });
    const { service } = createService(repository);

    const result = await service.getReminderCenter(userContext);
    const feeItem = result.items.find((item) => item.itemType === "FEE_REMINDER");

    expect(feeItem).toEqual(
      expect.objectContaining({
        canEscalate: false,
        escalationBlockedReason: "RATE_LIMITED",
        lastSentAt: recentSentAt.toISOString(),
        nextEscalationAvailableAt: new Date(
          recentSentAt.getTime() + 24 * 60 * 60 * 1000,
        ).toISOString(),
      }),
    );
  });

  it("marks overdue actionable reminders as department-escalation eligible", async () => {
    const repository = createRepository({
      findTasksForReceiver: vi.fn().mockResolvedValue([
        makeTaskState(ReminderStatusCode.pending, {
          remindLevel: ReminderLevelCode.overdue,
        }),
      ]),
    });
    const { service } = createService(repository);

    const result = await service.getReminderCenter(userContext);
    const feeItem = result.items.find((item) => item.itemType === "FEE_REMINDER");

    expect(feeItem).toEqual(
      expect.objectContaining({
        canEscalateToDepartment: true,
        canEscalate: true,
      }),
    );
  });
});

describe("ReminderService.escalateReminder", () => {
  it("sends an in-app notification, marks pending reminder sent, and writes safe audit", async () => {
    const repository = createRepository();
    const { service, prisma, notificationService, auditService } =
      createService(repository);

    const result = await service.escalateReminder(userContext, ids.feeRecord, {
      now: sentAt,
    });

    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        receiverId: ids.receiver,
        sentAt,
      },
    );
    expect(repository.transitionTaskStatusInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.pending,
        nextStatus: ReminderStatusCode.sent,
        sentAt,
      },
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).toContain(
      "ESCALATE_REMINDER",
    );
    expect(result.reminderTask.status).toBe(ReminderStatusCode.sent);
  });

  it("rate limits recently sent reminders, writes safe audit, and sends no notification", async () => {
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    } as never);
    const { service, notificationService, auditService } = createService(repository);

    await expect(
      service.escalateReminder(userContext, ids.feeRecord, { now: sentAt }),
    ).rejects.toBeInstanceOf(ReminderConflictError);

    expect(repository.transitionTaskStatusInTransaction).not.toHaveBeenCalled();
    expect(repository.updateTaskSentAtInTransaction).not.toHaveBeenCalled();
    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).toContain(
      "ESCALATE_REMINDER_RATE_LIMITED",
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).not.toContain(
      "content",
    );
  });

  it("allows re-escalating sent reminders after 24 hours and refreshes sentAt", async () => {
    const nextSentAt = new Date("2026-06-19T10:00:01.000Z");
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    } as never);
    const { service, prisma, notificationService } = createService(repository);

    const result = await service.escalateReminder(userContext, ids.feeRecord, {
      now: nextSentAt,
    });

    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        receiverId: ids.receiver,
        sentAt: nextSentAt,
      },
    );
    expect(repository.transitionTaskStatusInTransaction).not.toHaveBeenCalled();
    expect(repository.updateTaskSentAtInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.sent,
        sentAt: nextSentAt,
      },
    );
    expect(result.reminderTask.sentAt).toBe(nextSentAt);
  });

  it("returns not found semantics for non-receivers and writes no notification", async () => {
    const repository = createRepository();
    const { service, notificationService } = createService(repository);

    await expect(
      service.escalateReminder(
        {
          ...userContext,
          userId: ids.otherUser,
        },
        ids.feeRecord,
      ),
    ).rejects.toBeInstanceOf(ReminderNotFoundError);

    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
  });

  it("rejects confirmed reminders before notification writes", async () => {
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.confirmed)),
    } as never);
    const { service, notificationService } = createService(repository);

    await expect(
      service.escalateReminder(userContext, ids.feeRecord),
    ).rejects.toBeInstanceOf(ReminderConflictError);

    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
  });
});

describe("ReminderService.escalateReminderToDepartment", () => {
  it("rejects non-receivers before notification writes", async () => {
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(
          makeTaskState(ReminderStatusCode.sent, {
            remindLevel: ReminderLevelCode.overdue,
          }),
        ),
    } as never);
    const { service, notificationService } = createService(repository);

    await expect(
      service.escalateReminderToDepartment(
        {
          ...userContext,
          userId: ids.otherUser,
        },
        ids.feeRecord,
      ),
    ).rejects.toBeInstanceOf(ReminderNotFoundError);

    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
  });

  it("rejects non-overdue reminders before notification writes", async () => {
    const repository = createRepository();
    const { service, notificationService } = createService(repository);

    await expect(
      service.escalateReminderToDepartment(userContext, ids.feeRecord),
    ).rejects.toBeInstanceOf(ReminderConflictError);

    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
  });

  it("escalates overdue reminders with self fallback and writes safe audit", async () => {
    const repository = createRepository({
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(
          makeTaskState(ReminderStatusCode.sent, {
            remindLevel: ReminderLevelCode.overdue,
            sentAt: new Date("2026-06-17T10:00:00.000Z"),
          }),
        ),
    } as never);
    const { service, prisma, notificationService, auditService } =
      createService(repository);

    const result = await service.escalateReminderToDepartment(
      userContext,
      ids.feeRecord,
      {
        now: sentAt,
      },
    );

    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        receiverId: ids.receiver,
        sentAt,
      },
    );
    expect(result.escalationTarget).toBe("SELF_MVP_FALLBACK");
    expect(result.escalationReceiverId).toBe(ids.receiver);
    expect(auditService.recordEventInTransaction).toHaveBeenCalledTimes(2);

    const auditPayload = JSON.stringify(
      auditService.recordEventInTransaction.mock.calls.map((call) => call[1]),
    );
    expect(auditPayload).toContain("ESCALATE_REMINDER_TO_DEPARTMENT");
    expect(auditPayload).toContain("SELF_MVP_FALLBACK");
    expect(auditPayload).not.toContain("content");
    expect(auditPayload).not.toContain("raw");
    expect(auditPayload).not.toContain("password");
    expect(auditPayload).not.toContain("token");
  });

  it("resolves a formal department role receiver before falling back to self", async () => {
    const repository = createRepository({
      findDepartmentEscalationReceiverInTransaction: vi.fn().mockResolvedValue({
        userId: ids.otherUser,
        departmentId: ids.department,
        roleCode: "DEPARTMENT_ADMIN",
      }),
      findTaskStateByIdInTransaction: vi
        .fn()
        .mockResolvedValue(
          makeTaskState(ReminderStatusCode.sent, {
            remindLevel: ReminderLevelCode.overdue,
            sentAt: new Date("2026-06-17T10:00:00.000Z"),
          }),
        ),
    } as never);
    const { service, prisma, notificationService, auditService } =
      createService(repository);

    const result = await service.escalateReminderToDepartment(
      userContext,
      ids.feeRecord,
      { now: sentAt },
    );

    expect(repository.findDepartmentEscalationReceiverInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        departmentId: ids.department,
        excludedUserId: ids.receiver,
        roleCodes: expect.arrayContaining(["DEPARTMENT_ADMIN"]),
      }),
    );
    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      {
        receiverId: ids.otherUser,
        sentAt,
      },
    );
    expect(result.escalationTarget).toBe("DEPARTMENT_ROLE");
    expect(result.escalationReceiverId).toBe(ids.otherUser);
    expect(result.resolverStrategy).toBe("ROLE:DEPARTMENT_ADMIN");
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).toContain(
      "ROLE:DEPARTMENT_ADMIN",
    );
  });
});

describe("ReminderService.listReminderSlaQueue", () => {
  it("returns a safe SLA queue projection for current receiver reminders", async () => {
    const repository = createRepository();
    const { service } = createService(repository);

    const result = await service.listReminderSlaQueue(userContext);

    expect(repository.findSlaQueueForReceiver).toHaveBeenCalledWith({
      receiverId: ids.receiver,
      statuses: [
        ReminderStatusCode.pending,
        ReminderStatusCode.sent,
        ReminderStatusCode.failed,
      ],
      take: 100,
    });
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        itemType: "FEE_REMINDER",
        slaStatus: "OVERDUE",
        canEscalateToDepartment: true,
        escalationTarget: "DEPARTMENT_ROLE",
      }),
    );
    expect(JSON.stringify(result)).not.toContain("content");
    expect(JSON.stringify(result)).not.toContain("oldValue");
    expect(JSON.stringify(result)).not.toContain("newValue");
  });
});

describe("ReminderService.listReminderEscalationHistory", () => {
  it("returns safe escalation history for the reminder receiver", async () => {
    const repository = createRepository({
      findTaskStateById: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    } as never);
    const { service, auditService } = createService(repository);

    const result = await service.listReminderEscalationHistory(
      userContext,
      ids.feeRecord,
    );

    expect(auditService.listReminderEscalationHistory).toHaveBeenCalledWith(
      ids.feeRecord,
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        operation: "ESCALATE_REMINDER_TO_DEPARTMENT",
        escalationReceiverId: ids.otherUser,
        escalationTarget: "DEPARTMENT_ROLE",
        resolverStrategy: "ROLE:DEPARTMENT_ADMIN",
      }),
    );
  });

  it("returns not found semantics for non-receivers", async () => {
    const repository = createRepository({
      findTaskStateById: vi
        .fn()
        .mockResolvedValue(makeTaskState(ReminderStatusCode.sent)),
    } as never);
    const { service, auditService } = createService(repository);

    await expect(
      service.listReminderEscalationHistory(
        {
          ...userContext,
          userId: ids.otherUser,
        },
        ids.feeRecord,
      ),
    ).rejects.toBeInstanceOf(ReminderNotFoundError);

    expect(auditService.listReminderEscalationHistory).not.toHaveBeenCalled();
  });
});

describe("ReminderService.runReminderSlaScan", () => {
  it("returns the configurable default SLA policy", async () => {
    const { service } = createService();

    await expect(service.getReminderSlaPolicy()).resolves.toEqual(
      expect.objectContaining({
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        cooldownHours: 24,
        levels: expect.arrayContaining([
          expect.objectContaining({
            level: 1,
            code: "DEPARTMENT_COORDINATOR",
          }),
          expect.objectContaining({
            level: 3,
            scope: "GLOBAL",
          }),
        ]),
      }),
    );
  });

  it("returns persisted SLA policy when configured", async () => {
    const repository = createRepository({
      getActiveSlaPolicyConfig: vi.fn().mockResolvedValue({
        policyCode: "REMINDER_SLA_CUSTOM",
        enabled: true,
        scanWindowHours: 12,
        cooldownHours: 6,
        levels: [
          {
            level: 1,
            code: "CUSTOM_DEPARTMENT",
            afterHours: 0,
            roleCodes: ["DEPARTMENT_ADMIN"],
            scope: "DEPARTMENT",
          },
        ],
      }),
    });
    const { service } = createService(repository);

    await expect(service.getReminderSlaPolicy()).resolves.toEqual(
      expect.objectContaining({
        policyCode: "REMINDER_SLA_CUSTOM",
        scanWindowHours: 12,
        cooldownHours: 6,
      }),
    );
  });

  it("persists SLA policy updates with validation", async () => {
    const repository = createRepository();
    const { service } = createService(repository);

    const result = await service.updateReminderSlaPolicy(userContext, {
      policyCode: "REMINDER_SLA_CUSTOM",
      scanWindowHours: 12,
      cooldownHours: 6,
      levels: [
        {
          level: 1,
          code: "CUSTOM_DEPARTMENT",
          afterHours: 0,
          roleCodes: ["DEPARTMENT_ADMIN"],
          scope: "DEPARTMENT",
        },
      ],
    });

    expect(repository.upsertSlaPolicyConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        policyCode: "REMINDER_SLA_CUSTOM",
        scanWindowHours: 12,
        cooldownHours: 6,
      }),
    );
    expect(result.policyCode).toBe("REMINDER_SLA_CUSTOM");
  });

  it("skips non-overdue and rate-limited reminders during scan", async () => {
    const recentSentAt = new Date("2026-06-18T09:30:00.000Z");
    const repository = createRepository({
      findSlaQueueForReceiver: vi.fn().mockResolvedValue([
        makeTaskState(ReminderStatusCode.pending, {
          remindLevel: ReminderLevelCode.days7,
        }),
        makeTaskState(ReminderStatusCode.sent, {
          remindLevel: ReminderLevelCode.overdue,
          sentAt: recentSentAt,
        }),
      ]),
    });
    const { service, notificationService } = createService(repository);

    const result = await service.runReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(result).toEqual(
      expect.objectContaining({
        scannedCount: 2,
        escalatedCount: 0,
        skippedCount: 2,
      }),
    );
    expect(result.skipped).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: "NOT_OVERDUE" }),
        expect.objectContaining({ reason: "RATE_LIMITED" }),
      ]),
    );
    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
  });

  it("escalates old overdue reminders to the matching multi-level role", async () => {
    const oldSentAt = new Date("2026-06-15T10:00:00.000Z");
    const repository = createRepository({
      findSlaQueueForReceiver: vi.fn().mockResolvedValue([
        makeTaskState(ReminderStatusCode.sent, {
          remindLevel: ReminderLevelCode.overdue,
          sentAt: oldSentAt,
        }),
      ]),
      findDepartmentEscalationReceiverInTransaction: vi.fn().mockResolvedValue({
        userId: ids.otherUser,
        departmentId: ids.department,
        roleCode: "SYSTEM_ADMIN",
      }),
      findTaskStateByIdInTransaction: vi.fn().mockResolvedValue(
        makeTaskState(ReminderStatusCode.sent, {
          remindLevel: ReminderLevelCode.overdue,
          sentAt: oldSentAt,
        }),
      ),
    } as never);
    const { service, notificationService, auditService } = createService(repository);

    const result = await service.runReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(repository.findDepartmentEscalationReceiverInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roleCodes: ["SYSTEM_ADMIN"],
        allowGlobalScope: true,
      }),
    );
    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalledWith(
      expect.anything(),
      {
        receiverId: ids.otherUser,
        sentAt,
      },
    );
    expect(result.escalated[0]).toEqual(
      expect.objectContaining({
        escalationLevel: 3,
        escalationTarget: "GLOBAL_ROLE",
        resolverStrategy: "SLA_LEVEL_3:ROLE:SYSTEM_ADMIN",
      }),
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).toContain(
      "ESCALATE_REMINDER_SLA_SCAN",
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).toContain(
      "REMINDER_SLA_DEFAULT_MVP",
    );
  });

  it("runs a full-system SLA scan and writes execution records", async () => {
    const oldSentAt = new Date("2026-06-15T10:00:00.000Z");
    const repository = createRepository({
      findSlaQueue: vi.fn().mockResolvedValue([
        {
          ...makeTaskState(ReminderStatusCode.sent, {
            remindLevel: ReminderLevelCode.overdue,
            sentAt: oldSentAt,
          }),
          receiverDepartmentId: ids.department,
        },
      ]),
      findDepartmentEscalationReceiverInTransaction: vi.fn().mockResolvedValue({
        userId: ids.otherUser,
        departmentId: ids.department,
        roleCode: "SYSTEM_ADMIN",
      }),
      findTaskStateByIdInTransaction: vi.fn().mockResolvedValue(
        makeTaskState(ReminderStatusCode.sent, {
          remindLevel: ReminderLevelCode.overdue,
          sentAt: oldSentAt,
        }),
      ),
    } as never);
    const { service, notificationService } = createService(repository);

    const result = await service.runFullReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(repository.createSlaScanRun).toHaveBeenCalledWith(
      expect.objectContaining({
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: ids.receiver,
        actorDepartmentId: ids.department,
        scanScope: "ALL_RECEIVERS",
      }),
    );
    expect(repository.findSlaQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 500,
      }),
    );
    expect(repository.completeSlaScanRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "COMPLETED",
        scannedCount: 1,
        escalatedCount: 1,
        skippedCount: 0,
        safeSummary: expect.objectContaining({
          escalatedCount: 1,
        }),
      }),
    );
    expect(result.scanRun.scanScope).toBe("ALL_RECEIVERS");
    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalled();
  });
});

describe("ReminderService SLA async queue", () => {
  it("enqueues a queued full scan task", async () => {
    const repository = createRepository();
    const { service } = createService(repository);

    const result = await service.enqueueReminderSlaScan(
      userContext,
      { idempotencyKey: " manual-key ", triggerType: "MANUAL" },
      { now: sentAt },
    );

    expect(repository.enqueueSlaScanRun).toHaveBeenCalledWith(
      expect.objectContaining({
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: ids.receiver,
        actorDepartmentId: ids.department,
        triggerType: "MANUAL",
        idempotencyKey: "manual-key",
        lockKey: "REMINDER_SLA_FULL_SCAN",
      }),
    );
    expect(result.status).toBe("QUEUED");
    expect(result.scanRun.status).toBe("QUEUED");
  });

  it("returns an existing scan task for duplicate idempotency keys", async () => {
    const repository = createRepository({
      findSlaScanRunByIdempotencyKey: vi.fn().mockResolvedValue({
        id: "99000000-0000-4000-8000-000000000002",
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: ids.receiver,
        actorDepartmentId: ids.department,
        scanScope: "ALL_RECEIVERS",
        status: "QUEUED",
        triggerType: "API_QUEUE",
        idempotencyKey: "manual-key",
        lockKey: "REMINDER_SLA_FULL_SCAN",
        lockedAt: null,
        lockedUntil: null,
        attemptCount: 0,
        failureReason: null,
        requestedAt: sentAt,
        queuedAt: sentAt,
        scannedCount: 0,
        escalatedCount: 0,
        skippedCount: 0,
        safeSummary: null,
        startedAt: sentAt,
        completedAt: null,
        createdAt: sentAt,
        updatedAt: sentAt,
      }),
    } as never);
    const { service } = createService(repository);

    const result = await service.enqueueReminderSlaScan(
      userContext,
      { idempotencyKey: "manual-key" },
      { now: sentAt },
    );

    expect(result.status).toBe("EXISTING");
    expect(repository.enqueueSlaScanRun).not.toHaveBeenCalled();
  });

  it("returns a safe empty result when process-next has no queued tasks", async () => {
    const repository = createRepository({
      findNextQueuedSlaScanRun: vi.fn().mockResolvedValue(null),
    } as never);
    const { service, notificationService } = createService(repository);

    const result = await service.processNextReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(result).toEqual({ status: "NO_TASK", reason: "NO_QUEUED_SCAN" });
    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
  });

  it("processes one queued task and completes it", async () => {
    const repository = createRepository();
    const { service, notificationService } = createService(repository);

    const result = await service.processNextReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(repository.claimSlaScanRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "99000000-0000-4000-8000-000000000002",
        lockKey: "REMINDER_SLA_FULL_SCAN",
      }),
    );
    expect(repository.completeSlaScanRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "COMPLETED",
        scannedCount: 1,
        escalatedCount: 1,
      }),
    );
    expect(result.status).toBe("COMPLETED");
    expect(notificationService.sendFeeReminderInTransaction).toHaveBeenCalled();
  });

  it("skips the queued task when a non-expired lock is active", async () => {
    const repository = createRepository({
      findActiveSlaScanLock: vi.fn().mockResolvedValue({
        id: "99000000-0000-4000-8000-000000000099",
        policyCode: "REMINDER_SLA_DEFAULT_MVP",
        actorUserId: ids.receiver,
        actorDepartmentId: ids.department,
        scanScope: "ALL_RECEIVERS",
        status: "RUNNING",
        triggerType: "MANUAL",
        idempotencyKey: null,
        lockKey: "REMINDER_SLA_FULL_SCAN",
        lockedAt: sentAt,
        lockedUntil: new Date(sentAt.getTime() + 60_000),
        attemptCount: 1,
        failureReason: null,
        requestedAt: sentAt,
        queuedAt: null,
        scannedCount: 0,
        escalatedCount: 0,
        skippedCount: 0,
        safeSummary: null,
        startedAt: sentAt,
        completedAt: null,
        createdAt: sentAt,
        updatedAt: sentAt,
      }),
    } as never);
    const { service, notificationService } = createService(repository);

    const result = await service.processNextReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(result.status).toBe("SKIPPED");
    expect(result.reason).toBe("LOCK_ACTIVE");
    expect(repository.claimSlaScanRun).not.toHaveBeenCalled();
    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
    expect(repository.completeSlaScanRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "SKIPPED",
        failureReason: "LOCK_ACTIVE",
      }),
    );
  });

  it("releases expired running locks before claiming the next queued task", async () => {
    const repository = createRepository();
    const { service } = createService(repository);

    await service.processNextReminderSlaScan(userContext, { now: sentAt });

    expect(repository.skipExpiredSlaScanLocks).toHaveBeenCalledWith(
      "REMINDER_SLA_FULL_SCAN",
      sentAt,
    );
    expect(repository.claimSlaScanRun).toHaveBeenCalled();
  });

  it("does not process a task when another worker claims it first", async () => {
    const repository = createRepository({
      claimSlaScanRun: vi.fn().mockRejectedValue(new Error("already claimed")),
    } as never);
    const { service, notificationService } = createService(repository);

    const result = await service.processNextReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(result).toEqual({ status: "SKIPPED", reason: "CLAIM_CONFLICT" });
    expect(repository.findSlaQueue).not.toHaveBeenCalled();
    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
  });

  it("marks failed scans with safe failure reason only", async () => {
    const repository = createRepository({
      findSlaQueue: vi.fn().mockRejectedValue(new Error("raw stack token password cookie")),
    } as never);
    const { service, notificationService } = createService(repository);

    const result = await service.processNextReminderSlaScan(userContext, {
      now: sentAt,
    });

    expect(result.status).toBe("FAILED");
    expect(result.reason).toBe("SCAN_FAILED");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("token");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("password");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("cookie");
    expect(notificationService.sendFeeReminderInTransaction).not.toHaveBeenCalled();
    expect(repository.completeSlaScanRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "FAILED",
        failureReason: "SCAN_FAILED",
        safeSummary: expect.objectContaining({ reason: "SCAN_FAILED" }),
      }),
    );
  });
});
