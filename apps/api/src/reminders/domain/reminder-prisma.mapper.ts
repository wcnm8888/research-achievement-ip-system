import { Prisma } from "@prisma/client";
import {
  ReminderCandidate,
  ReminderFeeFact,
  ReminderStatusCode,
} from "./reminder-domain.types";
import {
  ReminderTaskStateRecord,
  ReminderTaskStatusTransitionInput,
} from "./reminder-repository.types";

export type ReminderEligibleFeeRow = {
  id: string;
  achievementId: string;
  departmentId: string;
  dueDate: Date;
  payStatus: ReminderFeeFact["payStatus"];
  createdById: string | null;
  updatedById: string | null;
  archivedAt: Date | null;
  achievement: {
    ownerUserId: string | null;
  } | null;
};

export type ReminderTaskStateRow = ReminderTaskStateRecord;

export const toReminderFeeFact = (
  row: ReminderEligibleFeeRow,
): ReminderFeeFact => ({
  id: row.id,
  achievementId: row.achievementId,
  departmentId: row.departmentId,
  dueDate: row.dueDate,
  payStatus: row.payStatus,
  createdById: row.createdById,
  updatedById: row.updatedById,
  archivedAt: row.archivedAt,
  achievement: row.achievement
    ? {
        ownerUserId: row.achievement.ownerUserId,
      }
    : null,
});

export const toReminderTaskCreateManyInput = (
  candidate: ReminderCandidate,
): Prisma.ReminderTaskCreateManyInput => ({
  targetType: candidate.targetType,
  targetId: candidate.targetId,
  remindDate: candidate.remindDate,
  remindLevel: candidate.remindLevel,
  receiverId: candidate.receiverId,
  status: ReminderStatusCode.pending,
});

export const toReminderTaskStateRecord = (
  row: ReminderTaskStateRow,
): ReminderTaskStateRecord => ({
  id: row.id,
  targetType: row.targetType,
  targetId: row.targetId,
  remindDate: row.remindDate,
  remindLevel: row.remindLevel,
  receiverId: row.receiverId,
  status: row.status,
  sentAt: row.sentAt,
  confirmedAt: row.confirmedAt,
});

export const toReminderTaskStatusTransitionData = (
  input: ReminderTaskStatusTransitionInput,
): Prisma.ReminderTaskUncheckedUpdateInput => ({
  status: input.nextStatus,
  ...(input.sentAt !== undefined ? { sentAt: input.sentAt } : {}),
  ...(input.confirmedAt !== undefined
    ? { confirmedAt: input.confirmedAt }
    : {}),
});

export const getReminderCandidateUniqueKey = (
  candidate: ReminderCandidate,
): string =>
  [
    candidate.targetType,
    candidate.targetId,
    candidate.remindDate.toISOString(),
    candidate.remindLevel,
    candidate.receiverId,
  ].join("|");

export const uniqueReminderCandidates = (
  candidates: readonly ReminderCandidate[],
): ReminderCandidate[] => {
  const seen = new Set<string>();
  const unique: ReminderCandidate[] = [];

  for (const candidate of candidates) {
    const key = getReminderCandidateUniqueKey(candidate);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(candidate);
    }
  }

  return unique;
};
