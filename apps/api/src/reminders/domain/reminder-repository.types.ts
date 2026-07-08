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

export type ReminderSlaQueueRecord = ReminderTaskStateRecord & {
  receiverDepartmentId: string;
};

export type ReminderSlaPolicyLevelRecord = {
  level: number;
  code: string;
  afterHours: number;
  roleCodes: readonly string[];
  scope: "DEPARTMENT" | "GLOBAL";
};

export type ReminderSlaPolicyConfigRecord = {
  id?: string;
  policyCode: string;
  enabled: boolean;
  scanWindowHours: number;
  cooldownHours: number;
  levels: readonly ReminderSlaPolicyLevelRecord[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type UpsertReminderSlaPolicyConfigInput = {
  policyCode: string;
  enabled?: boolean;
  scanWindowHours: number;
  cooldownHours: number;
  levels: readonly ReminderSlaPolicyLevelRecord[];
};

export type ReminderSlaScanRunStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export type ReminderSlaScanTriggerType = "MANUAL" | "SCHEDULED" | "API_QUEUE";

export type ReminderSlaScanRunRecord = {
  id: string;
  policyCode: string;
  actorUserId: string | null;
  actorDepartmentId: string | null;
  scanScope: string;
  status: ReminderSlaScanRunStatus | string;
  triggerType: ReminderSlaScanTriggerType | string;
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

export type CreateReminderSlaScanRunInput = {
  policyCode: string;
  actorUserId: string;
  actorDepartmentId: string;
  scanScope: string;
  triggerType?: ReminderSlaScanTriggerType;
  idempotencyKey?: string | null;
  lockKey?: string | null;
  startedAt: Date;
};

export type EnqueueReminderSlaScanRunInput = {
  policyCode: string;
  actorUserId: string | null;
  actorDepartmentId: string | null;
  scanScope: string;
  triggerType: ReminderSlaScanTriggerType;
  idempotencyKey?: string | null;
  lockKey: string;
  requestedAt: Date;
  queuedAt: Date;
};

export type ClaimReminderSlaScanRunInput = {
  id: string;
  lockKey: string;
  lockedAt: Date;
  lockedUntil: Date;
  startedAt: Date;
};

export type CompleteReminderSlaScanRunInput = {
  id: string;
  status: ReminderSlaScanRunStatus;
  scannedCount: number;
  escalatedCount: number;
  skippedCount: number;
  safeSummary: unknown;
  completedAt: Date;
  failureReason?: string | null;
};

export type ReminderTaskStatusTransitionInput = {
  reminderTaskId: string;
  expectedStatus: ReminderStatusCode;
  nextStatus: ReminderStatusCode;
  sentAt?: Date | null;
  confirmedAt?: Date | null;
};

export type ReminderTaskSentAtUpdateInput = {
  reminderTaskId: string;
  expectedStatus: ReminderStatusCode;
  sentAt: Date;
};

export type FindReminderTasksForReceiverInput = {
  receiverId: string;
  statuses?: readonly ReminderStatusCode[];
  take?: number;
};

export type FindReminderSlaQueueInput = {
  receiverId?: string;
  statuses?: readonly ReminderStatusCode[];
  take?: number;
};

export type ReminderEscalationReceiverCandidate = {
  userId: string;
  departmentId: string;
  roleCode: string;
};

export type FindReminderEscalationReceiverInput = {
  departmentId?: string;
  excludedUserId?: string;
  roleCodes: readonly string[];
  allowGlobalScope?: boolean;
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
  findTasksForReceiver?: (
    input: FindReminderTasksForReceiverInput,
  ) => Promise<ReminderTaskStateRecord[]>;
  findSlaQueueForReceiver?: (
    input: FindReminderSlaQueueInput,
  ) => Promise<ReminderTaskStateRecord[]>;
  findSlaQueue?: (
    input: FindReminderSlaQueueInput,
  ) => Promise<ReminderSlaQueueRecord[]>;
  getActiveSlaPolicyConfig?: () => Promise<ReminderSlaPolicyConfigRecord | null>;
  upsertSlaPolicyConfig?: (
    input: UpsertReminderSlaPolicyConfigInput,
  ) => Promise<ReminderSlaPolicyConfigRecord>;
  enqueueSlaScanRun?: (
    input: EnqueueReminderSlaScanRunInput,
  ) => Promise<ReminderSlaScanRunRecord>;
  findSlaScanRunByIdempotencyKey?: (
    idempotencyKey: string,
  ) => Promise<ReminderSlaScanRunRecord | null>;
  findNextQueuedSlaScanRun?: (
    lockKey: string,
  ) => Promise<ReminderSlaScanRunRecord | null>;
  findActiveSlaScanLock?: (
    lockKey: string,
    now: Date,
  ) => Promise<ReminderSlaScanRunRecord | null>;
  skipExpiredSlaScanLocks?: (
    lockKey: string,
    now: Date,
  ) => Promise<number>;
  claimSlaScanRun?: (
    input: ClaimReminderSlaScanRunInput,
  ) => Promise<ReminderSlaScanRunRecord>;
  createSlaScanRun?: (
    input: CreateReminderSlaScanRunInput,
  ) => Promise<ReminderSlaScanRunRecord>;
  completeSlaScanRun?: (
    input: CompleteReminderSlaScanRunInput,
  ) => Promise<ReminderSlaScanRunRecord>;
  listSlaScanRuns?: (take?: number) => Promise<ReminderSlaScanRunRecord[]>;
  findDepartmentEscalationReceiverInTransaction?: (
    client: unknown,
    input: FindReminderEscalationReceiverInput,
  ) => Promise<ReminderEscalationReceiverCandidate | null>;
};
