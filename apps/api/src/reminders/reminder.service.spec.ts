import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { UserContext } from "../identity/user-context";
import { NotificationChannelCode, NotificationStatusCode } from "../notifications/domain/notification-domain.types";
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
    ...overrides,
  };

  return repository as unknown as ReminderRepositoryPort & {
    findTaskStateByIdInTransaction: ReturnType<typeof vi.fn>;
    transitionTaskStatusInTransaction: ReturnType<typeof vi.fn>;
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
});

const createService = (repository: ReminderRepositoryPort = createRepository()) => {
  const prisma = createPrisma();
  const notificationService = createNotificationService();
  const auditService = createAuditService();
  const service = new ReminderService(
    repository as never,
    prisma as never,
    notificationService as never,
    auditService as never,
  );

  return { service, repository, prisma, notificationService, auditService };
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
