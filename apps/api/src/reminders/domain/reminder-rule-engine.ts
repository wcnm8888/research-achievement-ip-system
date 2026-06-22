import { PayStatusCode } from "../../fees/domain/fee-domain.types";
import {
  ReminderCandidate,
  ReminderCandidateGenerationResult,
  ReminderFeeFact,
  ReminderLevelCode,
  ReminderSkippedFee,
  ReminderSkipReasonCode,
  ReminderTargetTypeCode,
} from "./reminder-domain.types";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

const daysBeforeDueLevelMap = new Map<number, ReminderLevelCode>([
  [30, ReminderLevelCode.days30],
  [15, ReminderLevelCode.days15],
  [7, ReminderLevelCode.days7],
]);

export const generateReminderCandidatesForFees = (
  fees: readonly ReminderFeeFact[],
  today: Date | string,
): ReminderCandidateGenerationResult => {
  const candidates: ReminderCandidate[] = [];
  const skipped: ReminderSkippedFee[] = [];

  for (const fee of fees) {
    const result = generateReminderCandidateForFee(fee, today);

    if ("candidate" in result) {
      candidates.push(result.candidate);
    } else {
      skipped.push(result.skipped);
    }
  }

  return { candidates, skipped };
};

export const generateReminderCandidateForFee = (
  fee: ReminderFeeFact,
  today: Date | string,
): { candidate: ReminderCandidate } | { skipped: ReminderSkippedFee } => {
  if (fee.archivedAt) {
    return skippedFee(fee.id, ReminderSkipReasonCode.archivedFee);
  }

  if (!canGenerateReminderForFeeStatus(fee.payStatus)) {
    return skippedFee(fee.id, ReminderSkipReasonCode.ineligibleFeeStatus);
  }

  const todayDate = normalizeToUtcDateOnly(today);
  const dueDate = normalizeToUtcDateOnly(fee.dueDate);
  const remindLevel = getReminderLevelForDate(dueDate, todayDate);

  if (!remindLevel) {
    return skippedFee(fee.id, ReminderSkipReasonCode.noMatchingRule);
  }

  const receiverId = resolveReminderReceiverId(fee);
  if (!receiverId) {
    return skippedFee(fee.id, ReminderSkipReasonCode.missingReceiver);
  }

  return {
    candidate: {
      targetType: ReminderTargetTypeCode.feeRecord,
      targetId: fee.id,
      achievementId: fee.achievementId,
      departmentId: fee.departmentId,
      remindDate: todayDate,
      remindLevel,
      receiverId,
      dueDate,
    },
  };
};

export const canGenerateReminderForFeeStatus = (
  payStatus: PayStatusCode,
): boolean =>
  payStatus === PayStatusCode.pending || payStatus === PayStatusCode.overdue;

export const getReminderLevelForDate = (
  dueDateInput: Date | string,
  todayInput: Date | string,
): ReminderLevelCode | null => {
  const dueDate = normalizeToUtcDateOnly(dueDateInput);
  const today = normalizeToUtcDateOnly(todayInput);
  const daysUntilDue = Math.round(
    (dueDate.getTime() - today.getTime()) / millisecondsPerDay,
  );

  if (daysUntilDue < 0) {
    return ReminderLevelCode.overdue;
  }

  return daysBeforeDueLevelMap.get(daysUntilDue) ?? null;
};

export const resolveReminderReceiverId = (
  fee: ReminderFeeFact,
): string | null =>
  firstNonBlankString([
    fee.createdById,
    fee.updatedById,
    fee.achievement?.ownerUserId,
  ]);

export const normalizeToUtcDateOnly = (input: Date | string): Date => {
  if (typeof input === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
    if (match) {
      return new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
      );
    }
  }

  const date = input instanceof Date ? input : new Date(input);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const skippedFee = (
  feeRecordId: string,
  reason: ReminderSkipReasonCode,
): { skipped: ReminderSkippedFee } => ({
  skipped: {
    feeRecordId,
    reason,
  },
});

const firstNonBlankString = (
  values: readonly (string | null | undefined)[],
): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
};
