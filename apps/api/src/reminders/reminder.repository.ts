import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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
  ReminderTaskStateRecord,
  ReminderTaskStatusTransitionInput,
  ReminderTaskCreateSummary,
} from "./domain/reminder-repository.types";
import { normalizeToUtcDateOnly } from "./domain/reminder-rule-engine";
import { ReminderTaskStatusTransitionConflictError } from "./domain/reminder-errors";

export const defaultReminderFeeScanTake = 500;

export type ReminderTransactionClient = Pick<
  Prisma.TransactionClient,
  "feeRecord" | "reminderTask"
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

const addUtcDays = (date: Date, days: number): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days),
  );
