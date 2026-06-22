import { PayStatusCode } from "../../fees/domain/fee-domain.types";

export const ReminderTargetTypeCode = {
  feeRecord: "FEE_RECORD",
} as const;

export type ReminderTargetTypeCode =
  (typeof ReminderTargetTypeCode)[keyof typeof ReminderTargetTypeCode];

export const ReminderLevelCode = {
  days30: "DAYS_30",
  days15: "DAYS_15",
  days7: "DAYS_7",
  overdue: "OVERDUE",
} as const;

export type ReminderLevelCode =
  (typeof ReminderLevelCode)[keyof typeof ReminderLevelCode];

export const ReminderStatusCode = {
  pending: "PENDING",
  sent: "SENT",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  failed: "FAILED",
} as const;

export type ReminderStatusCode =
  (typeof ReminderStatusCode)[keyof typeof ReminderStatusCode];

export const ReminderSkipReasonCode = {
  archivedFee: "ARCHIVED_FEE",
  ineligibleFeeStatus: "INELIGIBLE_FEE_STATUS",
  missingReceiver: "MISSING_RECEIVER",
  noMatchingRule: "NO_MATCHING_RULE",
} as const;

export type ReminderSkipReasonCode =
  (typeof ReminderSkipReasonCode)[keyof typeof ReminderSkipReasonCode];

export type ReminderAchievementOwnerFact = {
  ownerUserId: string | null;
};

export type ReminderFeeFact = {
  id: string;
  achievementId: string;
  departmentId: string;
  dueDate: Date | string;
  payStatus: PayStatusCode;
  createdById?: string | null;
  updatedById?: string | null;
  archivedAt?: Date | string | null;
  achievement?: ReminderAchievementOwnerFact | null;
};

export type ReminderCandidate = {
  targetType: ReminderTargetTypeCode;
  targetId: string;
  achievementId: string;
  departmentId: string;
  remindDate: Date;
  remindLevel: ReminderLevelCode;
  receiverId: string;
  dueDate: Date;
};

export type ReminderSkippedFee = {
  feeRecordId: string;
  reason: ReminderSkipReasonCode;
};

export type ReminderCandidateGenerationResult = {
  candidates: ReminderCandidate[];
  skipped: ReminderSkippedFee[];
};
