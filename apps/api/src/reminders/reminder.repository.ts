import { Inject, Injectable } from "@nestjs/common";
import { Prisma, RoleStatus, UserStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import {
  ReminderCandidate,
  ReminderFeeFact,
} from "./domain/reminder-domain.types";
import {
  toReminderFeeFact,
  toReminderTaskCreateManyInput,
  toReminderTaskStateRecord,
  toReminderTaskStatusTransitionData,
  uniqueReminderCandidates,
} from "./domain/reminder-prisma.mapper";
import {
  ReminderEligibleFeeQueryOptions,
  FindReminderEscalationReceiverInput,
  FindReminderSlaQueueInput,
  FindReminderTasksForReceiverInput,
  ClaimReminderSlaScanRunInput,
  CompleteReminderSlaScanRunInput,
  CreateReminderSlaScanRunInput,
  EnqueueReminderSlaScanRunInput,
  ReminderEscalationReceiverCandidate,
  ReminderSlaPolicyConfigRecord,
  ReminderSlaQueueRecord,
  ReminderSlaScanRunRecord,
  ReminderTaskStateRecord,
  ReminderTaskSentAtUpdateInput,
  ReminderTaskStatusTransitionInput,
  ReminderTaskCreateSummary,
  UpsertReminderSlaPolicyConfigInput,
} from "./domain/reminder-repository.types";
import { normalizeToUtcDateOnly } from "./domain/reminder-rule-engine";
import { ReminderTaskStatusTransitionConflictError } from "./domain/reminder-errors";

export const defaultReminderFeeScanTake = 500;

export type ReminderTransactionClient = Pick<
  Prisma.TransactionClient,
  "feeRecord" | "reminderTask" | "user"
>;

@Injectable()
export class ReminderRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findEligibleFeeFactsForReminder(
    today: Date | string,
    options: ReminderEligibleFeeQueryOptions = {},
  ): Promise<ReminderFeeFact[]> {
    const normalizedToday = normalizeToUtcDateOnly(today);
    const dueDates = [30, 15, 7].map((days) => addUtcDays(normalizedToday, days));

    const rows = await this.prisma.feeRecord.findMany({
      where: {
        AND: [
          { archivedAt: null },
          { payStatus: { in: [PayStatusCode.pending, PayStatusCode.overdue] } },
          {
            OR: [
              { dueDate: { in: dueDates } },
              { dueDate: { lt: normalizedToday } },
            ],
          },
        ],
      },
      select: reminderEligibleFeeSelect,
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: options.take ?? defaultReminderFeeScanTake,
    });

    return rows.map((row) =>
      toReminderFeeFact(row as Parameters<typeof toReminderFeeFact>[0]),
    );
  }

  async createTasksForCandidates(
    candidates: readonly ReminderCandidate[],
  ): Promise<ReminderTaskCreateSummary> {
    const uniqueCandidates = uniqueReminderCandidates(candidates);

    if (uniqueCandidates.length === 0) {
      return {
        uniqueCandidateCount: 0,
        createdCount: 0,
        duplicateCount: 0,
      };
    }

    const result = await this.prisma.reminderTask.createMany({
      data: uniqueCandidates.map(toReminderTaskCreateManyInput),
      skipDuplicates: true,
    });

    return {
      uniqueCandidateCount: uniqueCandidates.length,
      createdCount: result.count,
      duplicateCount: uniqueCandidates.length - result.count,
    };
  }

  async findTaskStateById(
    reminderTaskId: string,
  ): Promise<ReminderTaskStateRecord | null> {
    return this.findTaskStateByIdInTransaction(this.prisma, reminderTaskId);
  }

  async findTasksForReceiver(
    input: FindReminderTasksForReceiverInput,
  ): Promise<ReminderTaskStateRecord[]> {
    const rows = await this.prisma.reminderTask.findMany({
      where: {
        receiverId: input.receiverId,
        ...(input.statuses?.length
          ? { status: { in: [...input.statuses] } }
          : {}),
      },
      select: reminderTaskStateSelect,
      orderBy: [{ remindDate: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      take: input.take ?? 50,
    });

    return rows.map((row) =>
      toReminderTaskStateRecord(
        row as Parameters<typeof toReminderTaskStateRecord>[0],
      ),
    );
  }

  async findSlaQueueForReceiver(
    input: FindReminderSlaQueueInput,
  ): Promise<ReminderTaskStateRecord[]> {
    const rows = await this.findSlaQueueRows(input);

    return rows.map((row) =>
      toReminderTaskStateRecord(
        row as Parameters<typeof toReminderTaskStateRecord>[0],
      ),
    );
  }

  async findSlaQueue(
    input: FindReminderSlaQueueInput = {},
  ): Promise<ReminderSlaQueueRecord[]> {
    const rows = await this.findSlaQueueRows(input);

    return rows.map((row) => ({
      ...toReminderTaskStateRecord(
        row as Parameters<typeof toReminderTaskStateRecord>[0],
      ),
      receiverDepartmentId: row.receiver.departmentId,
    }));
  }

  async getActiveSlaPolicyConfig(): Promise<ReminderSlaPolicyConfigRecord | null> {
    const row = await this.persistence.reminderSlaPolicyConfig.findFirst({
      where: { enabled: true },
      orderBy: [{ updatedAt: "desc" }, { policyCode: "asc" }],
    });

    return row ? toSlaPolicyConfigRecord(row) : null;
  }

  async upsertSlaPolicyConfig(
    input: UpsertReminderSlaPolicyConfigInput,
  ): Promise<ReminderSlaPolicyConfigRecord> {
    const row = await this.persistence.reminderSlaPolicyConfig.upsert({
      where: { policyCode: input.policyCode },
      create: {
        policyCode: input.policyCode,
        enabled: input.enabled ?? true,
        scanWindowHours: input.scanWindowHours,
        cooldownHours: input.cooldownHours,
        levels: input.levels as unknown,
      },
      update: {
        enabled: input.enabled ?? true,
        scanWindowHours: input.scanWindowHours,
        cooldownHours: input.cooldownHours,
        levels: input.levels as unknown,
      },
    });

    return toSlaPolicyConfigRecord(row);
  }

  async createSlaScanRun(
    input: CreateReminderSlaScanRunInput,
  ): Promise<ReminderSlaScanRunRecord> {
    const row = await this.persistence.reminderSlaScanRun.create({
      data: {
        policyCode: input.policyCode,
        actorUserId: input.actorUserId,
        actorDepartmentId: input.actorDepartmentId,
        scanScope: input.scanScope,
        triggerType: input.triggerType ?? "MANUAL",
        idempotencyKey: input.idempotencyKey ?? null,
        lockKey: input.lockKey ?? "REMINDER_SLA_FULL_SCAN",
        requestedAt: input.startedAt,
        status: "RUNNING",
        lockedAt: input.startedAt,
        lockedUntil: addMilliseconds(input.startedAt, reminderSlaScanLockMs),
        attemptCount: 1,
        startedAt: input.startedAt,
      },
    });

    return toSlaScanRunRecord(row);
  }

  async enqueueSlaScanRun(
    input: EnqueueReminderSlaScanRunInput,
  ): Promise<ReminderSlaScanRunRecord> {
    const row = await this.persistence.reminderSlaScanRun.create({
      data: {
        policyCode: input.policyCode,
        actorUserId: input.actorUserId,
        actorDepartmentId: input.actorDepartmentId,
        scanScope: input.scanScope,
        status: "QUEUED",
        triggerType: input.triggerType,
        idempotencyKey: input.idempotencyKey ?? null,
        lockKey: input.lockKey,
        requestedAt: input.requestedAt,
        queuedAt: input.queuedAt,
      },
    });

    return toSlaScanRunRecord(row);
  }

  async findSlaScanRunByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<ReminderSlaScanRunRecord | null> {
    const row = await this.persistence.reminderSlaScanRun.findUnique({
      where: { idempotencyKey },
    });

    return row ? toSlaScanRunRecord(row) : null;
  }

  async findNextQueuedSlaScanRun(
    lockKey: string,
  ): Promise<ReminderSlaScanRunRecord | null> {
    const row = await this.persistence.reminderSlaScanRun.findFirst({
      where: { status: "QUEUED", lockKey },
      orderBy: [{ queuedAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    });

    return row ? toSlaScanRunRecord(row) : null;
  }

  async findActiveSlaScanLock(
    lockKey: string,
    now: Date,
  ): Promise<ReminderSlaScanRunRecord | null> {
    const row = await this.persistence.reminderSlaScanRun.findFirst({
      where: {
        status: "RUNNING",
        lockKey,
        lockedUntil: { gt: now },
      },
      orderBy: [{ lockedUntil: "desc" }, { id: "asc" }],
    });

    return row ? toSlaScanRunRecord(row) : null;
  }

  async skipExpiredSlaScanLocks(lockKey: string, now: Date): Promise<number> {
    const result = await this.persistence.reminderSlaScanRun.updateMany({
      where: {
        status: "RUNNING",
        lockKey,
        lockedUntil: { lte: now },
      },
      data: {
        status: "SKIPPED",
        failureReason: "LOCK_EXPIRED_REPLACED",
        safeSummary: {
          reason: "LOCK_EXPIRED_REPLACED",
          lockKey,
        },
        completedAt: now,
      },
    });

    return result.count;
  }

  async claimSlaScanRun(
    input: ClaimReminderSlaScanRunInput,
  ): Promise<ReminderSlaScanRunRecord> {
    const result = await this.persistence.reminderSlaScanRun.updateMany({
      where: { id: input.id, status: "QUEUED" },
      data: {
        status: "RUNNING",
        lockKey: input.lockKey,
        lockedAt: input.lockedAt,
        lockedUntil: input.lockedUntil,
        startedAt: input.startedAt,
        attemptCount: { increment: 1 },
      },
    });

    if (result.count !== 1) {
      throw new Error("Reminder SLA scan run could not be claimed.");
    }

    const row = await this.persistence.reminderSlaScanRun.findUnique({
      where: { id: input.id },
    });
    if (!row) {
      throw new Error("Reminder SLA scan run was not found after claim.");
    }

    return toSlaScanRunRecord(row);
  }

  async completeSlaScanRun(
    input: CompleteReminderSlaScanRunInput,
  ): Promise<ReminderSlaScanRunRecord> {
    const row = await this.persistence.reminderSlaScanRun.update({
      where: { id: input.id },
      data: {
        status: input.status,
        scannedCount: input.scannedCount,
        escalatedCount: input.escalatedCount,
        skippedCount: input.skippedCount,
        safeSummary: input.safeSummary,
        failureReason: input.failureReason ?? null,
        completedAt: input.completedAt,
      },
    });

    return toSlaScanRunRecord(row);
  }

  async listSlaScanRuns(take = 20): Promise<ReminderSlaScanRunRecord[]> {
    const rows = await this.persistence.reminderSlaScanRun.findMany({
      orderBy: [{ startedAt: "desc" }, { id: "asc" }],
      take,
    });

    return rows.map(toSlaScanRunRecord);
  }

  private async findSlaQueueRows(input: FindReminderSlaQueueInput = {}) {
    return await this.prisma.reminderTask.findMany({
      where: {
        ...(input.receiverId ? { receiverId: input.receiverId } : {}),
        ...(input.statuses?.length
          ? { status: { in: [...input.statuses] } }
          : {}),
      },
      select: reminderSlaQueueSelect,
      orderBy: [{ remindLevel: "desc" }, { remindDate: "asc" }, { id: "asc" }],
      take: input.take ?? 100,
    });
  }

  async findDepartmentEscalationReceiverInTransaction(
    client: ReminderTransactionClient,
    input: FindReminderEscalationReceiverInput,
  ): Promise<ReminderEscalationReceiverCandidate | null> {
    const users = await client.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        archivedAt: null,
        ...(input.excludedUserId ? { id: { not: input.excludedUserId } } : {}),
        ...(input.departmentId && !input.allowGlobalScope
          ? { departmentId: input.departmentId }
          : {}),
        userRoles: {
          some: {
            revokedAt: null,
            OR: [
              ...(input.departmentId ? [{ departmentId: input.departmentId }] : []),
              ...(input.allowGlobalScope ? [{ departmentId: null }] : []),
            ],
            role: {
              code: { in: [...input.roleCodes] },
              status: RoleStatus.ACTIVE,
              archivedAt: null,
            },
          },
        },
      },
      select: {
        id: true,
        departmentId: true,
        userRoles: {
          where: {
            revokedAt: null,
            OR: [
              ...(input.departmentId ? [{ departmentId: input.departmentId }] : []),
              ...(input.allowGlobalScope ? [{ departmentId: null }] : []),
            ],
            role: {
              code: { in: [...input.roleCodes] },
              status: RoleStatus.ACTIVE,
              archivedAt: null,
            },
          },
          select: {
            role: {
              select: {
                code: true,
              },
            },
          },
        },
      },
      orderBy: [{ id: "asc" }],
      take: 25,
    });

    const candidates = users
      .flatMap((user) =>
        user.userRoles.map((userRole) => ({
          userId: user.id,
          departmentId: user.departmentId,
          roleCode: userRole.role.code,
        })),
      )
      .sort(
        (left, right) =>
          input.roleCodes.indexOf(left.roleCode) -
            input.roleCodes.indexOf(right.roleCode) ||
          left.userId.localeCompare(right.userId),
      );

    return candidates[0] ?? null;
  }

  async findTaskStateByIdInTransaction(
    client: ReminderTransactionClient,
    reminderTaskId: string,
  ): Promise<ReminderTaskStateRecord | null> {
    const row = await client.reminderTask.findUnique({
      where: { id: reminderTaskId },
      select: reminderTaskStateSelect,
    });

    return row
      ? toReminderTaskStateRecord(
          row as Parameters<typeof toReminderTaskStateRecord>[0],
        )
      : null;
  }

  async transitionTaskStatusInTransaction(
    client: ReminderTransactionClient,
    input: ReminderTaskStatusTransitionInput,
  ): Promise<ReminderTaskStateRecord> {
    const result = await client.reminderTask.updateMany({
      where: {
        id: input.reminderTaskId,
        status: input.expectedStatus,
      },
      data: toReminderTaskStatusTransitionData(input),
    });

    if (result.count !== 1) {
      throw new ReminderTaskStatusTransitionConflictError(
        input.reminderTaskId,
        input.expectedStatus,
      );
    }

    const row = await client.reminderTask.findUnique({
      where: { id: input.reminderTaskId },
      select: reminderTaskStateSelect,
    });

    if (!row) {
      throw new ReminderTaskStatusTransitionConflictError(
        input.reminderTaskId,
        input.expectedStatus,
      );
    }

    return toReminderTaskStateRecord(
      row as Parameters<typeof toReminderTaskStateRecord>[0],
    );
  }

  async updateTaskSentAtInTransaction(
    client: ReminderTransactionClient,
    input: ReminderTaskSentAtUpdateInput,
  ): Promise<ReminderTaskStateRecord> {
    const result = await client.reminderTask.updateMany({
      where: {
        id: input.reminderTaskId,
        status: input.expectedStatus,
      },
      data: {
        sentAt: input.sentAt,
      },
    });

    if (result.count !== 1) {
      throw new ReminderTaskStatusTransitionConflictError(
        input.reminderTaskId,
        input.expectedStatus,
      );
    }

    const row = await client.reminderTask.findUnique({
      where: { id: input.reminderTaskId },
      select: reminderTaskStateSelect,
    });

    if (!row) {
      throw new ReminderTaskStatusTransitionConflictError(
        input.reminderTaskId,
        input.expectedStatus,
      );
    }

    return toReminderTaskStateRecord(
      row as Parameters<typeof toReminderTaskStateRecord>[0],
    );
  }

  private get persistence(): ReminderPersistenceClient {
    return this.prisma as unknown as ReminderPersistenceClient;
  }
}

const reminderEligibleFeeSelect = {
  id: true,
  achievementId: true,
  departmentId: true,
  dueDate: true,
  payStatus: true,
  createdById: true,
  updatedById: true,
  archivedAt: true,
  achievement: {
    select: {
      ownerUserId: true,
    },
  },
} satisfies Prisma.FeeRecordSelect;

const reminderTaskStateSelect = {
  id: true,
  targetType: true,
  targetId: true,
  remindDate: true,
  remindLevel: true,
  receiverId: true,
  status: true,
  sentAt: true,
  confirmedAt: true,
} satisfies Prisma.ReminderTaskSelect;

const reminderSlaQueueSelect = {
  ...reminderTaskStateSelect,
  receiver: {
    select: {
      departmentId: true,
    },
  },
} satisfies Prisma.ReminderTaskSelect;

type ReminderSlaPolicyConfigRow = {
  id?: string;
  policyCode: string;
  enabled: boolean;
  scanWindowHours: number;
  cooldownHours: number;
  levels: unknown;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type ReminderSlaScanRunRow = {
  id: string;
  policyCode: string;
  actorUserId: string | null;
  actorDepartmentId: string | null;
  scanScope: string;
  status: string;
  triggerType: string;
  idempotencyKey: string | null;
  lockKey: string | null;
  lockedAt: Date | string | null;
  lockedUntil: Date | string | null;
  attemptCount: number;
  failureReason: string | null;
  requestedAt: Date | string;
  queuedAt: Date | string | null;
  scannedCount: number;
  escalatedCount: number;
  skippedCount: number;
  safeSummary: unknown;
  startedAt: Date | string;
  completedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ReminderPersistenceClient = PrismaService & {
  reminderSlaPolicyConfig: {
    findFirst: (args: unknown) => Promise<ReminderSlaPolicyConfigRow | null>;
    upsert: (args: unknown) => Promise<ReminderSlaPolicyConfigRow>;
  };
  reminderSlaScanRun: {
    create: (args: unknown) => Promise<ReminderSlaScanRunRow>;
    update: (args: unknown) => Promise<ReminderSlaScanRunRow>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
    findFirst: (args: unknown) => Promise<ReminderSlaScanRunRow | null>;
    findUnique: (args: unknown) => Promise<ReminderSlaScanRunRow | null>;
    findMany: (args: unknown) => Promise<ReminderSlaScanRunRow[]>;
  };
};

const toSlaPolicyConfigRecord = (
  row: ReminderSlaPolicyConfigRow,
): ReminderSlaPolicyConfigRecord => ({
  id: row.id,
  policyCode: row.policyCode,
  enabled: row.enabled,
  scanWindowHours: row.scanWindowHours,
  cooldownHours: row.cooldownHours,
  levels: Array.isArray(row.levels)
    ? (row.levels as ReminderSlaPolicyConfigRecord["levels"])
    : [],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toSlaScanRunRecord = (
  row: ReminderSlaScanRunRow,
): ReminderSlaScanRunRecord => ({
  id: row.id,
  policyCode: row.policyCode,
  actorUserId: row.actorUserId,
  actorDepartmentId: row.actorDepartmentId,
  scanScope: row.scanScope,
  status: row.status,
  triggerType: row.triggerType ?? "MANUAL",
  idempotencyKey: row.idempotencyKey ?? null,
  lockKey: row.lockKey ?? null,
  lockedAt: row.lockedAt ?? null,
  lockedUntil: row.lockedUntil ?? null,
  attemptCount: row.attemptCount ?? 0,
  failureReason: row.failureReason ?? null,
  requestedAt: row.requestedAt ?? row.createdAt,
  queuedAt: row.queuedAt ?? null,
  scannedCount: row.scannedCount,
  escalatedCount: row.escalatedCount,
  skippedCount: row.skippedCount,
  safeSummary: row.safeSummary,
  startedAt: row.startedAt,
  completedAt: row.completedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const addUtcDays = (date: Date, days: number): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days),
  );

const reminderSlaScanLockMs = 15 * 60 * 1000;

const addMilliseconds = (date: Date, milliseconds: number): Date =>
  new Date(date.getTime() + milliseconds);
