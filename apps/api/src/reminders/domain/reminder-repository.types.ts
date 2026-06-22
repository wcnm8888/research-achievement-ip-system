import {
  ReminderCandidate,
  ReminderFeeFact,
  ReminderSkippedFee,
  ReminderStatusCode,
  ReminderTargetTypeCode,
  ReminderLevelCode,
} from "./reminder-domain.types";

export type ReminderEligibleFeeQueryOptions = {
  take?: number;
};

export type ReminderTaskCreateSummary = {
  uniqueCandidateCount: number;
  createdCount: number;
  duplicateCount: number;
};

export type ReminderTaskStateRecord = {
  id: string;
  targetType: ReminderTargetTypeCode;
  targetId: string;
  remindDate: Date;
  remindLevel: ReminderLevelCode;
  receiverId: string;
  status: ReminderStatusCode;
  sentAt: Date | null;
  confirmedAt: Date | null;
};

export type ReminderTaskStatusTransitionInput = {
  reminderTaskId: string;
  expectedStatus: ReminderStatusCode;
  nextStatus: ReminderStatusCode;
  sentAt?: Date | null;
  confirmedAt?: Date | null;
};

export type GenerateFeeDueReminderOptions = ReminderEligibleFeeQueryOptions;

export type GenerateFeeDueReminderSummary = {
  today: Date;
  scannedFeeCount: number;
  candidateCount: number;
  createdCount: number;
  duplicateCount: number;
  skipped: ReminderSkippedFee[];
};

export type ReminderRepositoryPort = {
  findEligibleFeeFactsForReminder: (
    today: Date | string,
    options?: ReminderEligibleFeeQueryOptions,
  ) => Promise<ReminderFeeFact[]>;
  createTasksForCandidates: (
    candidates: readonly ReminderCandidate[],
  ) => Promise<ReminderTaskCreateSummary>;
};
