import { Inject, Injectable, Optional } from "@nestjs/common";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditJsonValue, CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { RoleCode } from "../authorization/constants/role-code";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import { NotificationRecord } from "../notifications/domain/notification-domain.types";
import { NotificationService } from "../notifications/notification.service";
import { NotificationTransactionClient } from "../notifications/notification.repository";
import {
  ReportEmailDeliveryResult,
  ReportEmailDeliveryService,
} from "../reports/report-email-delivery.service";
import { WorkflowAccessDeniedError } from "../workflow/domain/workflow-errors";
import {
  WorkflowTaskStatusCode,
  WorkflowTargetTypeCode,
} from "../workflow/domain/workflow-domain.types";
import { WorkflowTaskWithInstance } from "../workflow/domain/workflow-repository.types";
import { WorkflowService } from "../workflow/workflow.service";
import {
  InvalidReminderTransitionError,
  ReminderAccessDeniedError,
  ReminderConflictError,
  ReminderInvalidTransitionError,
  ReminderNotFoundError,
  ReminderTaskStatusTransitionConflictError,
} from "./domain/reminder-errors";
import { ReminderLevelCode, ReminderStatusCode } from "./domain/reminder-domain.types";
import {
  GenerateFeeDueReminderOptions,
  GenerateFeeDueReminderSummary,
  ReminderSlaScanTriggerType,
  ReminderSlaPolicyConfigRecord,
  ReminderSlaPolicyLevelRecord,
  ReminderSlaQueueRecord,
  ReminderSlaScanRunRecord,
  ReminderTaskStateRecord,
} from "./domain/reminder-repository.types";
import {
  generateReminderCandidatesForFees,
  normalizeToUtcDateOnly,
} from "./domain/reminder-rule-engine";
import { assertReminderTransition } from "./domain/reminder-state-machine";
import { ReminderRepository, ReminderTransactionClient } from "./reminder.repository";

export type ReminderSystemActor = {
  actorType: "SYSTEM";
  userId?: null;
  departmentId?: null;
};

export type ReminderSendActor = ReminderSystemActor | UserContext;

export type SendPendingReminderOptions = {
  now?: Date;
  deliveryOutcome?: "SUCCESS" | "FAILED";
};

export type ConfirmReminderOptions = {
  now?: Date;
};

export type EscalateReminderOptions = {
  now?: Date;
};

export type ReminderSendResult = {
  reminderTask: ReminderTaskStateRecord;
  notification: NotificationRecord | null;
};

export type ReminderEmailDeliveryResult = {
  reminderTaskId: string;
  status: ReportEmailDeliveryResult["status"] | "NO_RECIPIENT" | "SUPPRESSED";
  adapter: string;
  dryRun: boolean;
  attemptCount: number;
  emailMasked: string | null;
};

export type ReminderDepartmentEscalationResult = ReminderSendResult & {
  escalationTarget: "DEPARTMENT_ROLE" | "SELF_MVP_FALLBACK";
  escalationReceiverId: string;
  resolverStrategy: string;
};

export type ReminderCenterItemType = "FEE_REMINDER" | "WORKFLOW_TASK";
export type ReminderCenterSeverity = "INFO" | "WARNING" | "CRITICAL";
export type ReminderEscalationBlockedReason =
  | "RATE_LIMITED"
  | "TERMINAL_STATUS"
  | "NOT_OVERDUE"
  | "NOT_APPLICABLE";

export type ReminderCenterItem = {
  id: string;
  itemType: ReminderCenterItemType;
  title: string;
  description: string;
  severity: ReminderCenterSeverity;
  status: string;
  targetType: string;
  targetId: string;
  remindDate?: string | null;
  remindLevel?: string | null;
  dueAt?: string | null;
  canConfirm: boolean;
  canEscalate: boolean;
  canEscalateToDepartment: boolean;
  escalationBlockedReason?: ReminderEscalationBlockedReason;
  lastSentAt?: string | null;
  nextEscalationAvailableAt?: string | null;
  governanceNote?: string;
};

export type ReminderCenterSummary = {
  total: number;
  feeReminderCount: number;
  workflowTaskCount: number;
  pendingCount: number;
  sentCount: number;
  overdueCount: number;
  escalationEligibleCount: number;
};

export type ReminderCenterResponse = {
  generatedAt: string;
  summary: ReminderCenterSummary;
  items: ReminderCenterItem[];
};

export type ReminderSlaQueueItem = ReminderCenterItem & {
  slaStatus: "OVERDUE" | "DUE_SOON" | "PENDING";
  escalationReceiverId?: string | null;
  escalationTarget?: "DEPARTMENT_ROLE" | "SELF_MVP_FALLBACK" | null;
};

export type ReminderSlaQueueResponse = {
  generatedAt: string;
  items: ReminderSlaQueueItem[];
};

export type ReminderEscalationHistoryItem = {
  id: string;
  actorUserId: string | null;
  actorDepartmentId: string | null;
  operation: string;
  escalationReceiverId: string | null;
  escalationTarget: string | null;
  resolverStrategy: string | null;
  policyCode: string | null;
  escalationLevel: number | null;
  slaStatus: string | null;
  notificationId: string | null;
  status: string | null;
  sentAt: string | null;
  nextEscalationAvailableAt: string | null;
  createdAt: Date | string;
};

export type ReminderEscalationHistoryResponse = {
  items: ReminderEscalationHistoryItem[];
};

export type ReminderSlaPolicyLevel = {
  level: number;
  code: string;
  afterHours: number;
  roleCodes: readonly RoleCode[];
  scope: "DEPARTMENT" | "GLOBAL";
};

export type ReminderSlaPolicy = {
  policyCode: string;
  scanWindowHours: number;
  cooldownHours: number;
  levels: readonly ReminderSlaPolicyLevel[];
};

export type ReminderSlaPolicyUpdateInput = {
  policyCode?: string;
  scanWindowHours: number;
  cooldownHours: number;
  levels: readonly ReminderSlaPolicyLevelRecord[];
};

export type ReminderSlaScanSkippedItem = {
  reminderTaskId: string;
  reason: "NOT_OVERDUE" | "RATE_LIMITED" | "NO_ACTIONABLE_STATUS";
};

export type ReminderSlaScanEscalatedItem = {
  reminderTaskId: string;
  escalationLevel: number;
  escalationReceiverId: string;
  escalationTarget: "DEPARTMENT_ROLE" | "GLOBAL_ROLE" | "SELF_MVP_FALLBACK";
  resolverStrategy: string;
};

export type ReminderSlaScanResult = {
  scannedCount: number;
  escalatedCount: number;
  skippedCount: number;
  escalated: ReminderSlaScanEscalatedItem[];
  skipped: ReminderSlaScanSkippedItem[];
  policy: ReminderSlaPolicy;
};

export type ReminderSlaScanRunItem = {
  id: string;
  policyCode: string;
  actorUserId: string | null;
  actorDepartmentId: string | null;
  scanScope: string;
  status: string;
  triggerType: string;
  idempotencyKey: string | null;
  lockKey: string | null;
  lockedAt: string | null;
  lockedUntil: string | null;
  attemptCount: number;
  failureReason: string | null;
  requestedAt: string;
  queuedAt: string | null;
  scannedCount: number;
  escalatedCount: number;
  skippedCount: number;
  safeSummary: unknown;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReminderSlaScanRunsResponse = {
  items: ReminderSlaScanRunItem[];
};

export type ReminderSlaScanMetricsResponse = {
  generatedAt: string;
  sampleSize: number;
  latestRun: ReminderSlaScanRunItem | null;
  totals: {
    queued: number;
    running: number;
    completed: number;
    failed: number;
    skipped: number;
    totalScanned: number;
    totalEscalated: number;
    totalSkippedItems: number;
    successRate: number;
  };
  triggerBreakdown: Array<{
    triggerType: string;
    count: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  backlog: {
    queuedCount: number;
    runningCount: number;
    oldestQueuedAt: string | null;
  };
  recentFailures: Array<{
    id: string;
    status: string;
    triggerType: string;
    failureReason: string | null;
    startedAt: string;
    completedAt: string | null;
  }>;
};

export type ReminderSlaScanHealthStatus = "HEALTHY" | "WARNING" | "CRITICAL";

export type ReminderSlaScanHealthReason = {
  code:
    | "STALE_RUNNING_LOCK"
    | "QUEUE_BACKLOG_HIGH"
    | "LOW_SUCCESS_RATE"
    | "REPEATED_FAILURES";
  severity: Exclude<ReminderSlaScanHealthStatus, "HEALTHY">;
  message: string;
};

export type ReminderSlaScanHealthResponse = {
  generatedAt: string;
  status: ReminderSlaScanHealthStatus;
  reasons: ReminderSlaScanHealthReason[];
  metricsSnapshot: Omit<ReminderSlaScanMetricsResponse, "latestRun">;
  recommendedActions: string[];
};

export type ReminderSlaFullScanResult = ReminderSlaScanResult & {
  scanRun: ReminderSlaScanRunItem;
};

export type EnqueueReminderSlaScanInput = {
  idempotencyKey?: string;
  triggerType?: "MANUAL" | "API_QUEUE";
};

export type ReminderSlaScanEnqueueResult = {
  status: "QUEUED" | "EXISTING";
  scanRun: ReminderSlaScanRunItem;
};

export type ReminderSlaProcessNextResult = {
  status: "NO_TASK" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";
  reason?: string;
  scanRun?: ReminderSlaScanRunItem;
  result?: ReminderSlaScanResult;
};

const reminderEscalationCooldownMs = 24 * 60 * 60 * 1000;
const reminderSlaFullScanLockKey = "REMINDER_SLA_FULL_SCAN";
const reminderSlaScanLockMs = 15 * 60 * 1000;
const defaultReminderSlaPolicy: ReminderSlaPolicy = {
  policyCode: "REMINDER_SLA_DEFAULT_MVP",
  scanWindowHours: 24,
  cooldownHours: 24,
  levels: [
    {
      level: 1,
      code: "DEPARTMENT_COORDINATOR",
      afterHours: 0,
      roleCodes: [RoleCode.departmentAdmin, RoleCode.researchSecretary],
      scope: "DEPARTMENT",
    },
    {
      level: 2,
      code: "DEPARTMENT_LEADER",
      afterHours: 48,
      roleCodes: [RoleCode.leader],
      scope: "DEPARTMENT",
    },
    {
      level: 3,
      code: "SYSTEM_ADMIN",
      afterHours: 72,
      roleCodes: [RoleCode.systemAdmin],
      scope: "GLOBAL",
    },
  ],
};

@Injectable()
export class ReminderService {
  constructor(
    @Inject(ReminderRepository)
    private readonly reminderRepository: ReminderRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(WorkflowService)
    private readonly workflowService: WorkflowService,
    @Optional()
    @Inject(ReportEmailDeliveryService)
    private readonly reportEmailDeliveryService?: ReportEmailDeliveryService,
  ) {}

  async generateFeeDueReminders(
    today: Date | string,
    options: GenerateFeeDueReminderOptions = {},
  ): Promise<GenerateFeeDueReminderSummary> {
    const normalizedToday = normalizeToUtcDateOnly(today);
    const fees =
      await this.reminderRepository.findEligibleFeeFactsForReminder(
        normalizedToday,
        options,
      );
    const { candidates, skipped } = generateReminderCandidatesForFees(
      fees,
      normalizedToday,
    );

    if (candidates.length === 0) {
      return {
        today: normalizedToday,
        scannedFeeCount: fees.length,
        candidateCount: 0,
        createdCount: 0,
        duplicateCount: 0,
        skipped,
      };
    }

    const createSummary =
      await this.reminderRepository.createTasksForCandidates(candidates);

    return {
      today: normalizedToday,
      scannedFeeCount: fees.length,
      candidateCount: candidates.length,
      createdCount: createSummary.createdCount,
      duplicateCount: createSummary.duplicateCount,
      skipped,
    };
  }

  async sendPendingReminder(
    actor: ReminderSendActor,
    reminderTaskId: string,
    options: SendPendingReminderOptions = {},
  ): Promise<ReminderSendResult> {
    const now = options.now ?? new Date();
    const deliveryOutcome = options.deliveryOutcome ?? "SUCCESS";

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const reminderClient = tx as ReminderTransactionClient;
        const notificationClient = tx as NotificationTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const current = await this.reminderRepository.findTaskStateByIdInTransaction(
          reminderClient,
          reminderTaskId,
        );

        if (!current) {
          throw new ReminderNotFoundError();
        }

        if (deliveryOutcome === "FAILED") {
          this.assertTransition(current.status, ReminderStatusCode.failed);

          const next =
            await this.reminderRepository.transitionTaskStatusInTransaction(
              reminderClient,
              {
                reminderTaskId,
                expectedStatus: current.status,
                nextStatus: ReminderStatusCode.failed,
              },
            );

          await this.auditService.recordEventInTransaction(
            auditClient,
            this.toReminderAuditEvent(
              actor,
              AuditActionCode.update,
              current,
              next,
            ),
          );

          return { reminderTask: next, notification: null };
        }

        this.assertTransition(current.status, ReminderStatusCode.sent);

        const notification =
          await this.notificationService.sendFeeReminderInTransaction(
            notificationClient,
            {
              receiverId: current.receiverId,
              sentAt: now,
            },
          );

        const next = await this.reminderRepository.transitionTaskStatusInTransaction(
          reminderClient,
          {
            reminderTaskId,
            expectedStatus: current.status,
            nextStatus: ReminderStatusCode.sent,
            sentAt: now,
          },
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toReminderAuditEvent(actor, AuditActionCode.update, current, next, {
            notificationId: notification.id,
          }),
        );
        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toNotificationAuditEvent(actor, notification, next.id),
        );

        return { reminderTask: next, notification };
      });

      await this.sendReminderEmailBestEffort(
        actor,
        result.reminderTask,
        result.reminderTask.receiverId,
        "SEND_PENDING_REMINDER",
        now,
      );

      return result;
    } catch (error) {
      throw this.mapReminderError(error);
    }
  }

  async confirmReminder(
    context: UserContext,
    reminderTaskId: string,
    options: ConfirmReminderOptions = {},
  ): Promise<ReminderTaskStateRecord> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const reminderClient = tx as ReminderTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const current = await this.reminderRepository.findTaskStateByIdInTransaction(
          reminderClient,
          reminderTaskId,
        );

        if (!current || current.receiverId !== context.userId) {
          throw new ReminderNotFoundError();
        }

        this.assertTransition(current.status, ReminderStatusCode.confirmed);

        const next = await this.reminderRepository.transitionTaskStatusInTransaction(
          reminderClient,
          {
            reminderTaskId,
            expectedStatus: current.status,
            nextStatus: ReminderStatusCode.confirmed,
            confirmedAt: now,
          },
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toReminderAuditEvent(
            context,
            AuditActionCode.confirmReminder,
            current,
            next,
          ),
        );

        return next;
      });
    } catch (error) {
      throw this.mapReminderError(error);
    }
  }

  async sendReminderEmailReminder(
    context: UserContext,
    reminderTaskId: string,
    options: { now?: Date } = {},
  ): Promise<ReminderEmailDeliveryResult> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();
    const task = await this.reminderRepository.findTaskStateById(reminderTaskId);

    if (!task || task.receiverId !== context.userId) {
      throw new ReminderNotFoundError();
    }

    if (!this.reportEmailDeliveryService) {
      return {
        reminderTaskId,
        status: "SUPPRESSED",
        adapter: "REMINDER_EMAIL_NOT_CONFIGURED",
        dryRun: true,
        attemptCount: 0,
        emailMasked: null,
      };
    }

    const recipient = await this.reminderRepository.findUserEmailById(task.receiverId);
    if (!recipient) {
      return {
        reminderTaskId,
        status: "NO_RECIPIENT",
        adapter: "NO_RECIPIENT",
        dryRun: true,
        attemptCount: 0,
        emailMasked: null,
      };
    }

    const result = await this.reportEmailDeliveryService.send({
      deliveryId: `reminder-${task.id}-MANUAL-${now.toISOString()}`,
      toAddress: recipient.email,
      subject: "Research IP System - Reminder Notification",
      textBody: buildReminderEmailTextBody(task, "MANUAL_REMINDER_EMAIL", now),
      htmlBody: buildReminderEmailHtmlBody(task, "MANUAL_REMINDER_EMAIL", now),
    });

    await this.recordReminderEmailAuditEvent(
      context,
      task,
      recipient.email,
      "MANUAL_REMINDER_EMAIL",
      result,
    );

    return {
      reminderTaskId,
      status: result.status,
      adapter: result.adapter,
      dryRun: result.dryRun,
      attemptCount: result.attemptCount,
      emailMasked: maskReminderEmail(recipient.email),
    };
  }

  async getReminderCenter(context: UserContext): Promise<ReminderCenterResponse> {
    this.assertUserContext(context);
    const generatedAt = new Date();

    const [feeReminders, workflowTasks] = await Promise.all([
      this.reminderRepository.findTasksForReceiver({
        receiverId: context.userId,
        statuses: [
          ReminderStatusCode.pending,
          ReminderStatusCode.sent,
          ReminderStatusCode.failed,
        ],
        take: 50,
      }),
      this.listWorkflowTasksForCenter(context),
    ]);

    const feeItems = feeReminders.map((task) =>
      this.toFeeReminderCenterItem(task, generatedAt),
    );
    const workflowItems = workflowTasks.map((task) =>
      this.toWorkflowCenterItem(task),
    );
    const items = [...feeItems, ...workflowItems].sort(compareReminderCenterItems);

    return {
      generatedAt: generatedAt.toISOString(),
      summary: {
        total: items.length,
        feeReminderCount: feeItems.length,
        workflowTaskCount: workflowItems.length,
        pendingCount: feeReminders.filter(
          (task) => task.status === ReminderStatusCode.pending,
        ).length,
        sentCount: feeReminders.filter(
          (task) => task.status === ReminderStatusCode.sent,
        ).length,
        overdueCount: feeReminders.filter(
          (task) => task.remindLevel === ReminderLevelCode.overdue,
        ).length,
        escalationEligibleCount: feeItems.filter((item) => item.canEscalate)
          .length,
      },
      items,
    };
  }

  async escalateReminder(
    context: UserContext,
    reminderTaskId: string,
    options: EscalateReminderOptions = {},
  ): Promise<ReminderSendResult> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const reminderClient = tx as ReminderTransactionClient;
        const notificationClient = tx as NotificationTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const current = await this.reminderRepository.findTaskStateByIdInTransaction(
          reminderClient,
          reminderTaskId,
        );

        if (!current || current.receiverId !== context.userId) {
          throw new ReminderNotFoundError();
        }

        if (
          current.status !== ReminderStatusCode.pending &&
          current.status !== ReminderStatusCode.sent
        ) {
          throw new ReminderConflictError(
            "Only pending or sent reminders can be escalated.",
          );
        }

        if (isReminderEscalationRateLimited(current, now)) {
          await this.auditService.recordEventInTransaction(
            auditClient,
            this.toReminderAuditEvent(
              context,
              AuditActionCode.update,
              current,
              current,
              {
                operation: "ESCALATE_REMINDER_RATE_LIMITED",
                nextEscalationAvailableAt: getNextEscalationAvailableAt(current),
              },
            ),
          );

          return { rateLimited: true as const };
        }

        const notification =
          await this.notificationService.sendFeeReminderInTransaction(
            notificationClient,
            {
              receiverId: current.receiverId,
              sentAt: now,
            },
          );

        const next =
          current.status === ReminderStatusCode.pending
            ? await this.reminderRepository.transitionTaskStatusInTransaction(
                reminderClient,
                {
                  reminderTaskId,
                  expectedStatus: current.status,
                  nextStatus: ReminderStatusCode.sent,
                  sentAt: now,
                },
              )
            : await this.reminderRepository.updateTaskSentAtInTransaction(
                reminderClient,
                {
                  reminderTaskId,
                  expectedStatus: current.status,
                  sentAt: now,
                },
              );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toReminderAuditEvent(context, AuditActionCode.update, current, next, {
            notificationId: notification.id,
            operation: "ESCALATE_REMINDER",
          }),
        );
        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toNotificationAuditEvent(context, notification, next.id),
        );

        return { rateLimited: false as const, reminderTask: next, notification };
      });

      if (result.rateLimited) {
        throw new ReminderConflictError("Reminder escalation is rate limited.");
      }

      const sendResult = {
        reminderTask: result.reminderTask,
        notification: result.notification,
      };

      await this.sendReminderEmailBestEffort(
        context,
        sendResult.reminderTask,
        sendResult.reminderTask.receiverId,
        "ESCALATE_REMINDER",
        now,
      );

      return sendResult;
    } catch (error) {
      throw this.mapReminderError(error);
    }
  }

  async escalateReminderToDepartment(
    context: UserContext,
    reminderTaskId: string,
    options: EscalateReminderOptions = {},
  ): Promise<ReminderDepartmentEscalationResult> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const reminderClient = tx as ReminderTransactionClient;
        const notificationClient = tx as NotificationTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const current = await this.reminderRepository.findTaskStateByIdInTransaction(
          reminderClient,
          reminderTaskId,
        );

        if (!current || current.receiverId !== context.userId) {
          throw new ReminderNotFoundError();
        }

        if (
          current.status !== ReminderStatusCode.pending &&
          current.status !== ReminderStatusCode.sent
        ) {
          throw new ReminderConflictError(
            "Only pending or sent reminders can be escalated.",
          );
        }

        if (current.remindLevel !== ReminderLevelCode.overdue) {
          throw new ReminderConflictError(
            "Only overdue reminders can be escalated to department.",
          );
        }

        const escalationReceiver = await this.resolveDepartmentEscalationReceiver(
          reminderClient,
          context,
          current,
        );
        const notification =
          await this.notificationService.sendFeeReminderInTransaction(
            notificationClient,
            {
              receiverId: escalationReceiver.receiverId,
              sentAt: now,
            },
          );

        const next =
          current.status === ReminderStatusCode.pending
            ? await this.reminderRepository.transitionTaskStatusInTransaction(
                reminderClient,
                {
                  reminderTaskId,
                  expectedStatus: current.status,
                  nextStatus: ReminderStatusCode.sent,
                  sentAt: now,
                },
              )
            : await this.reminderRepository.updateTaskSentAtInTransaction(
                reminderClient,
                {
                  reminderTaskId,
                  expectedStatus: current.status,
                  sentAt: now,
                },
              );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toReminderAuditEvent(context, AuditActionCode.update, current, next, {
            notificationId: notification.id,
            operation: "ESCALATE_REMINDER_TO_DEPARTMENT",
            escalationReceiverId: escalationReceiver.receiverId,
            escalationTarget: escalationReceiver.target,
            resolverStrategy: escalationReceiver.resolverStrategy,
          }),
        );
        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toNotificationAuditEvent(context, notification, next.id),
        );

        return {
          reminderTask: next,
          notification,
          escalationTarget: escalationReceiver.target,
          escalationReceiverId: escalationReceiver.receiverId,
          resolverStrategy: escalationReceiver.resolverStrategy,
        };
      });

      await this.sendReminderEmailBestEffort(
        context,
        result.reminderTask,
        result.escalationReceiverId,
        "ESCALATE_REMINDER_TO_DEPARTMENT",
        now,
      );

      return result;
    } catch (error) {
      throw this.mapReminderError(error);
    }
  }

  async listReminderSlaQueue(
    context: UserContext,
  ): Promise<ReminderSlaQueueResponse> {
    this.assertUserContext(context);
    const generatedAt = new Date();
    const tasks = await this.reminderRepository.findSlaQueueForReceiver({
      receiverId: context.userId,
      statuses: [
        ReminderStatusCode.pending,
        ReminderStatusCode.sent,
        ReminderStatusCode.failed,
      ],
      take: 100,
    });

    return {
      generatedAt: generatedAt.toISOString(),
      items: tasks
        .map((task) => this.toReminderSlaQueueItem(task, generatedAt))
        .sort(compareReminderCenterItems),
    };
  }

  async listReminderEscalationHistory(
    context: UserContext,
    reminderTaskId: string,
  ): Promise<ReminderEscalationHistoryResponse> {
    this.assertUserContext(context);
    const current = await this.reminderRepository.findTaskStateById(reminderTaskId);

    if (!current || current.receiverId !== context.userId) {
      throw new ReminderNotFoundError();
    }

    const result =
      await this.auditService.listReminderEscalationHistory(reminderTaskId);

    return {
      items: result.items.map((item) => ({
        id: item.id,
        actorUserId: item.actorUserId,
        actorDepartmentId: item.actorDepartmentId,
        operation: item.operation,
        escalationReceiverId: item.escalationReceiverId,
        escalationTarget: item.escalationTarget,
        resolverStrategy: item.resolverStrategy,
        policyCode: item.policyCode,
        escalationLevel: item.escalationLevel,
        slaStatus: item.slaStatus,
        notificationId: item.notificationId,
        status: item.status,
        sentAt: item.sentAt,
        nextEscalationAvailableAt: item.nextEscalationAvailableAt,
        createdAt: item.createdAt,
      })),
    };
  }

  async getReminderSlaPolicy(): Promise<ReminderSlaPolicy> {
    return await this.loadReminderSlaPolicy();
  }

  async updateReminderSlaPolicy(
    context: UserContext,
    input: ReminderSlaPolicyUpdateInput,
  ): Promise<ReminderSlaPolicy> {
    this.assertUserContext(context);
    const policy = normalizeReminderSlaPolicyInput(input);

    if (!this.reminderRepository.upsertSlaPolicyConfig) {
      throw new Error("Reminder SLA policy persistence is not available.");
    }

    const record = await this.reminderRepository.upsertSlaPolicyConfig({
      policyCode: policy.policyCode,
      enabled: true,
      scanWindowHours: policy.scanWindowHours,
      cooldownHours: policy.cooldownHours,
      levels: policy.levels,
    });

    return toReminderSlaPolicy(record);
  }

  async listReminderSlaScanRuns(): Promise<ReminderSlaScanRunsResponse> {
    const runs = this.reminderRepository.listSlaScanRuns
      ? await this.reminderRepository.listSlaScanRuns(20)
      : [];

    return {
      items: runs.map(toReminderSlaScanRunItem),
    };
  }

  async getReminderSlaScanMetrics(): Promise<ReminderSlaScanMetricsResponse> {
    const generatedAt = new Date();
    const runs = this.reminderRepository.listSlaScanRuns
      ? (await this.reminderRepository.listSlaScanRuns(200)).map(
          toReminderSlaScanRunItem,
        )
      : [];

    return buildReminderSlaScanMetrics(runs, generatedAt);
  }

  async getReminderSlaScanHealth(): Promise<ReminderSlaScanHealthResponse> {
    const generatedAt = new Date();
    const runs = this.reminderRepository.listSlaScanRuns
      ? (await this.reminderRepository.listSlaScanRuns(200)).map(
          toReminderSlaScanRunItem,
        )
      : [];
    const metrics = buildReminderSlaScanMetrics(runs, generatedAt);

    return buildReminderSlaScanHealth(metrics, runs, generatedAt);
  }

  async enqueueReminderSlaScan(
    context: UserContext,
    input: EnqueueReminderSlaScanInput = {},
    options: { now?: Date; triggerType?: ReminderSlaScanTriggerType } = {},
  ): Promise<ReminderSlaScanEnqueueResult> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();
    const policy = await this.loadReminderSlaPolicy();
    const idempotencyKey = normalizeSlaScanIdempotencyKey(input.idempotencyKey);
    const triggerType =
      options.triggerType ?? normalizeManualSlaScanTriggerType(input.triggerType);

    if (idempotencyKey && this.reminderRepository.findSlaScanRunByIdempotencyKey) {
      const existing =
        await this.reminderRepository.findSlaScanRunByIdempotencyKey(idempotencyKey);
      if (existing) {
        return {
          status: "EXISTING",
          scanRun: toReminderSlaScanRunItem(existing),
        };
      }
    }

    if (!this.reminderRepository.enqueueSlaScanRun) {
      throw new Error("Reminder SLA scan queue persistence is not available.");
    }

    const run = await this.reminderRepository.enqueueSlaScanRun({
      policyCode: policy.policyCode,
      actorUserId: context.userId,
      actorDepartmentId: context.departmentId,
      scanScope: "ALL_RECEIVERS",
      triggerType,
      idempotencyKey,
      lockKey: reminderSlaFullScanLockKey,
      requestedAt: now,
      queuedAt: now,
    });

    return {
      status: "QUEUED",
      scanRun: toReminderSlaScanRunItem(run),
    };
  }

  async enqueueScheduledReminderSlaScan(
    options: { now?: Date; idempotencyKey?: string } = {},
  ): Promise<ReminderSlaScanEnqueueResult | null> {
    const systemContext = this.toSystemSlaScanContext();
    return await this.enqueueReminderSlaScan(
      systemContext,
      {
        idempotencyKey: options.idempotencyKey,
      },
      { now: options.now, triggerType: "SCHEDULED" },
    );
  }

  async processNextReminderSlaScan(
    context: UserContext,
    options: EscalateReminderOptions = {},
  ): Promise<ReminderSlaProcessNextResult> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();
    const queued = this.reminderRepository.findNextQueuedSlaScanRun
      ? await this.reminderRepository.findNextQueuedSlaScanRun(reminderSlaFullScanLockKey)
      : null;

    if (!queued) {
      return { status: "NO_TASK", reason: "NO_QUEUED_SCAN" };
    }

    const activeLock = this.reminderRepository.findActiveSlaScanLock
      ? await this.reminderRepository.findActiveSlaScanLock(reminderSlaFullScanLockKey, now)
      : null;
    if (activeLock && this.reminderRepository.completeSlaScanRun) {
      const skipped = await this.reminderRepository.completeSlaScanRun({
        id: queued.id,
        status: "SKIPPED",
        scannedCount: 0,
        escalatedCount: 0,
        skippedCount: 0,
        failureReason: "LOCK_ACTIVE",
        safeSummary: {
          reason: "LOCK_ACTIVE",
          lockKey: reminderSlaFullScanLockKey,
          activeRunId: activeLock.id,
        },
        completedAt: now,
      });

      return {
        status: "SKIPPED",
        reason: "LOCK_ACTIVE",
        scanRun: toReminderSlaScanRunItem(skipped),
      };
    }

    if (this.reminderRepository.skipExpiredSlaScanLocks) {
      await this.reminderRepository.skipExpiredSlaScanLocks(
        reminderSlaFullScanLockKey,
        now,
      );
    }

    if (!this.reminderRepository.claimSlaScanRun || !this.reminderRepository.completeSlaScanRun) {
      throw new Error("Reminder SLA scan queue worker persistence is not available.");
    }

    const lockUntil = new Date(now.getTime() + reminderSlaScanLockMs);
    let running: ReminderSlaScanRunRecord;
    try {
      running = await this.reminderRepository.claimSlaScanRun({
        id: queued.id,
        lockKey: reminderSlaFullScanLockKey,
        lockedAt: now,
        lockedUntil: lockUntil,
        startedAt: now,
      });
    } catch {
      return { status: "SKIPPED", reason: "CLAIM_CONFLICT" };
    }
    const policy = await this.loadReminderSlaPolicy();

    try {
      const tasks = await this.reminderRepository.findSlaQueue({
        statuses: [
          ReminderStatusCode.pending,
          ReminderStatusCode.sent,
          ReminderStatusCode.failed,
        ],
        take: 500,
      });
      const result = await this.runSlaScanForTasks(context, tasks, now, policy, {
        allowAnyReceiver: true,
      });
      const completedRun = await this.reminderRepository.completeSlaScanRun({
        id: running.id,
        status: "COMPLETED",
        scannedCount: result.scannedCount,
        escalatedCount: result.escalatedCount,
        skippedCount: result.skippedCount,
        safeSummary: toReminderSlaScanSafeSummary(result),
        completedAt: now,
      });

      return {
        status: "COMPLETED",
        scanRun: toReminderSlaScanRunItem(completedRun),
        result,
      };
    } catch (error) {
      const failureReason = sanitizeSlaScanFailureReason(error);
      const failedRun = await this.reminderRepository.completeSlaScanRun({
        id: running.id,
        status: "FAILED",
        scannedCount: 0,
        escalatedCount: 0,
        skippedCount: 0,
        failureReason,
        safeSummary: {
          reason: failureReason,
          lockKey: reminderSlaFullScanLockKey,
        },
        completedAt: now,
      });

      return {
        status: "FAILED",
        reason: failureReason,
        scanRun: toReminderSlaScanRunItem(failedRun),
      };
    }
  }

  async runReminderSlaScan(
    context: UserContext,
    options: EscalateReminderOptions = {},
  ): Promise<ReminderSlaScanResult> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();
    const policy = await this.loadReminderSlaPolicy();
    const tasks = await this.reminderRepository.findSlaQueueForReceiver({
      receiverId: context.userId,
      statuses: [
        ReminderStatusCode.pending,
        ReminderStatusCode.sent,
        ReminderStatusCode.failed,
      ],
      take: 100,
    });

    return await this.runSlaScanForTasks(context, tasks, now, policy, {
      allowAnyReceiver: false,
    });
  }

  async runFullReminderSlaScan(
    context: UserContext,
    options: EscalateReminderOptions = {},
  ): Promise<ReminderSlaFullScanResult> {
    this.assertUserContext(context);
    const now = options.now ?? new Date();
    const policy = await this.loadReminderSlaPolicy();
    const scanRun = this.reminderRepository.createSlaScanRun
          ? await this.reminderRepository.createSlaScanRun({
              policyCode: policy.policyCode,
              actorUserId: context.userId,
              actorDepartmentId: context.departmentId,
              scanScope: "ALL_RECEIVERS",
              triggerType: "MANUAL",
              lockKey: reminderSlaFullScanLockKey,
              startedAt: now,
            })
      : null;

    try {
      const tasks = await this.reminderRepository.findSlaQueue({
        statuses: [
          ReminderStatusCode.pending,
          ReminderStatusCode.sent,
          ReminderStatusCode.failed,
        ],
        take: 500,
      });
      const result = await this.runSlaScanForTasks(context, tasks, now, policy, {
        allowAnyReceiver: true,
      });
      const completedRun =
        scanRun && this.reminderRepository.completeSlaScanRun
          ? await this.reminderRepository.completeSlaScanRun({
              id: scanRun.id,
              status: "COMPLETED",
              scannedCount: result.scannedCount,
              escalatedCount: result.escalatedCount,
              skippedCount: result.skippedCount,
              safeSummary: toReminderSlaScanSafeSummary(result),
              completedAt: now,
            })
          : makeEphemeralScanRun(context, policy, result, now, "COMPLETED");

      return {
        ...result,
        scanRun: toReminderSlaScanRunItem(completedRun),
      };
    } catch (error) {
      if (scanRun && this.reminderRepository.completeSlaScanRun) {
        await this.reminderRepository.completeSlaScanRun({
          id: scanRun.id,
          status: "FAILED",
          scannedCount: 0,
          escalatedCount: 0,
          skippedCount: 0,
          safeSummary: {
            policyCode: policy.policyCode,
            scanScope: "ALL_RECEIVERS",
            reason: "SCAN_FAILED",
          },
          completedAt: now,
          failureReason: "SCAN_FAILED",
        });
      }

      throw error;
    }
  }

  private async runSlaScanForTasks(
    context: UserContext,
    tasks: readonly (ReminderTaskStateRecord | ReminderSlaQueueRecord)[],
    now: Date,
    policy: ReminderSlaPolicy,
    options: {
      allowAnyReceiver: boolean;
    },
  ): Promise<ReminderSlaScanResult> {
    const escalated: ReminderSlaScanEscalatedItem[] = [];
    const skipped: ReminderSlaScanSkippedItem[] = [];

    for (const task of tasks) {
      if (task.remindLevel !== ReminderLevelCode.overdue) {
        skipped.push({ reminderTaskId: task.id, reason: "NOT_OVERDUE" });
        continue;
      }

      if (
        task.status !== ReminderStatusCode.pending &&
        task.status !== ReminderStatusCode.sent
      ) {
        skipped.push({
          reminderTaskId: task.id,
          reason: "NO_ACTIONABLE_STATUS",
        });
        continue;
      }

      if (isReminderEscalationRateLimited(task, now)) {
        skipped.push({ reminderTaskId: task.id, reason: "RATE_LIMITED" });
        continue;
      }

      const result = await this.escalateReminderBySlaPolicy(
        context,
        task,
        now,
        policy,
        {
          allowAnyReceiver: options.allowAnyReceiver,
          receiverDepartmentId: getReceiverDepartmentId(task),
        },
      );
      escalated.push(result);
    }

    return {
      scannedCount: tasks.length,
      escalatedCount: escalated.length,
      skippedCount: skipped.length,
      escalated,
      skipped,
      policy,
    };
  }

  private async listWorkflowTasksForCenter(
    context: UserContext,
  ): Promise<WorkflowTaskWithInstance[]> {
    try {
      const result = await this.workflowService.listMyWorkflowTasks(context, {
        status: WorkflowTaskStatusCode.pending,
      });

      return result.items.slice(0, 50);
    } catch (error) {
      if (error instanceof WorkflowAccessDeniedError) {
        return [];
      }

      throw error;
    }
  }

  private toFeeReminderCenterItem(
    task: ReminderTaskStateRecord,
    now: Date,
  ): ReminderCenterItem {
    const overdue = task.remindLevel === ReminderLevelCode.overdue;
    const actionable =
      task.status === ReminderStatusCode.pending ||
      task.status === ReminderStatusCode.sent;
    const rateLimited = isReminderEscalationRateLimited(task, now);
    const nextEscalationAvailableAt = getNextEscalationAvailableAt(task);
    const canEscalate = actionable && !rateLimited;

    return {
      id: task.id,
      itemType: "FEE_REMINDER",
      title: overdue ? "费用逾期提醒" : "费用到期提醒",
      description: `提醒级别：${task.remindLevel}`,
      severity: overdue ? "CRITICAL" : "WARNING",
      status: task.status,
      targetType: task.targetType,
      targetId: task.targetId,
      remindDate: toAuditDateString(task.remindDate),
      remindLevel: task.remindLevel,
      dueAt: toAuditDateString(task.remindDate),
      canConfirm: task.status === ReminderStatusCode.sent,
      canEscalate,
      canEscalateToDepartment: overdue && actionable,
      ...(rateLimited ? { escalationBlockedReason: "RATE_LIMITED" } : {}),
      lastSentAt: toAuditDateString(task.sentAt),
      nextEscalationAvailableAt,
      governanceNote: "Escalation count is not tracked in this MVP.",
    };
  }

  private toWorkflowCenterItem(task: WorkflowTaskWithInstance): ReminderCenterItem {
    const targetType = task.instance.targetType;

    return {
      id: task.id,
      itemType: "WORKFLOW_TASK",
      title:
        targetType === WorkflowTargetTypeCode.achievement
          ? "成果审批待办"
          : targetType === WorkflowTargetTypeCode.feeRecord
            ? "费用审批待办"
            : "审批待办",
      description: `当前节点：${task.stepCode}`,
      severity: "INFO",
      status: task.status,
      targetType,
      targetId: task.instance.targetId,
      dueAt: toAuditDateString(task.createdAt),
      canConfirm: false,
      canEscalate: false,
      canEscalateToDepartment: false,
      escalationBlockedReason: "NOT_APPLICABLE",
      lastSentAt: null,
      nextEscalationAvailableAt: null,
    };
  }

  private toReminderSlaQueueItem(
    task: ReminderTaskStateRecord,
    now: Date,
  ): ReminderSlaQueueItem {
    const item = this.toFeeReminderCenterItem(task, now);

    return {
      ...item,
      slaStatus:
        task.remindLevel === ReminderLevelCode.overdue
          ? "OVERDUE"
          : task.status === ReminderStatusCode.sent
            ? "DUE_SOON"
            : "PENDING",
      escalationTarget: item.canEscalateToDepartment ? "DEPARTMENT_ROLE" : null,
    };
  }

  private async resolveDepartmentEscalationReceiver(
    client: ReminderTransactionClient,
    context: UserContext,
    task: ReminderTaskStateRecord,
  ): Promise<{
    receiverId: string;
    target: "DEPARTMENT_ROLE" | "SELF_MVP_FALLBACK";
    resolverStrategy: string;
  }> {
    const policy = await this.loadReminderSlaPolicy();
    const candidate =
      await this.reminderRepository.findDepartmentEscalationReceiverInTransaction(
        client,
        {
          departmentId: context.departmentId,
          excludedUserId: task.receiverId,
          roleCodes: getFirstSlaPolicyLevel(policy).roleCodes,
        },
      );

    if (candidate) {
      return {
        receiverId: candidate.userId,
        target: "DEPARTMENT_ROLE",
        resolverStrategy: `ROLE:${candidate.roleCode}`,
      };
    }

    return {
      receiverId: task.receiverId,
      target: "SELF_MVP_FALLBACK",
      resolverStrategy: "SELF_MVP_FALLBACK:NO_DEPARTMENT_ROLE_CANDIDATE",
    };
  }

  private async escalateReminderBySlaPolicy(
    context: UserContext,
    task: ReminderTaskStateRecord,
    now: Date,
    policy: ReminderSlaPolicy,
    options: {
      allowAnyReceiver: boolean;
      receiverDepartmentId?: string;
    },
  ): Promise<ReminderSlaScanEscalatedItem> {
    const policyLevel = resolveSlaPolicyLevel(task, now, policy);

    const result = await this.prisma.$transaction(async (tx) => {
      const reminderClient = tx as ReminderTransactionClient;
      const notificationClient = tx as NotificationTransactionClient;
      const auditClient = tx as AuditTransactionClient;
      const current = await this.reminderRepository.findTaskStateByIdInTransaction(
        reminderClient,
        task.id,
      );

      if (
        !current ||
        (!options.allowAnyReceiver && current.receiverId !== context.userId)
      ) {
        throw new ReminderNotFoundError();
      }

      const escalationReceiver = await this.resolveEscalationReceiverForPolicyLevel(
        reminderClient,
        options.receiverDepartmentId ?? context.departmentId,
        current,
        policyLevel,
      );
      const notification =
        await this.notificationService.sendFeeReminderInTransaction(
          notificationClient,
          {
            receiverId: escalationReceiver.receiverId,
            sentAt: now,
          },
        );
      const next =
        current.status === ReminderStatusCode.pending
          ? await this.reminderRepository.transitionTaskStatusInTransaction(
              reminderClient,
              {
                reminderTaskId: current.id,
                expectedStatus: current.status,
                nextStatus: ReminderStatusCode.sent,
                sentAt: now,
              },
            )
          : await this.reminderRepository.updateTaskSentAtInTransaction(
              reminderClient,
              {
                reminderTaskId: current.id,
                expectedStatus: current.status,
                sentAt: now,
              },
            );

      await this.auditService.recordEventInTransaction(
        auditClient,
        this.toReminderAuditEvent(context, AuditActionCode.update, current, next, {
          notificationId: notification.id,
          operation: "ESCALATE_REMINDER_SLA_SCAN",
          escalationReceiverId: escalationReceiver.receiverId,
          escalationTarget: escalationReceiver.target,
          resolverStrategy: escalationReceiver.resolverStrategy,
          policyCode: policy.policyCode,
          escalationLevel: policyLevel.level,
          slaStatus: "OVERDUE",
        }),
      );
      await this.auditService.recordEventInTransaction(
        auditClient,
        this.toNotificationAuditEvent(context, notification, next.id),
      );

      return {
        reminderTaskId: next.id,
        escalationLevel: policyLevel.level,
        escalationReceiverId: escalationReceiver.receiverId,
        escalationTarget: escalationReceiver.target,
        resolverStrategy: escalationReceiver.resolverStrategy,
      };
    });

    await this.sendReminderEmailBestEffort(
      context,
      task,
      result.escalationReceiverId,
      "ESCALATE_REMINDER_SLA_SCAN",
      now,
    );

    return result;
  }

  private async resolveEscalationReceiverForPolicyLevel(
    client: ReminderTransactionClient,
    departmentId: string,
    task: ReminderTaskStateRecord,
    policyLevel: ReminderSlaPolicyLevel,
  ): Promise<{
    receiverId: string;
    target: "DEPARTMENT_ROLE" | "GLOBAL_ROLE" | "SELF_MVP_FALLBACK";
    resolverStrategy: string;
  }> {
    const candidate =
      await this.reminderRepository.findDepartmentEscalationReceiverInTransaction(
        client,
        {
          departmentId:
            policyLevel.scope === "DEPARTMENT" ? departmentId : undefined,
          excludedUserId: task.receiverId,
          roleCodes: policyLevel.roleCodes,
          allowGlobalScope: policyLevel.scope === "GLOBAL",
        },
      );

    if (candidate) {
      return {
        receiverId: candidate.userId,
        target: policyLevel.scope === "GLOBAL" ? "GLOBAL_ROLE" : "DEPARTMENT_ROLE",
        resolverStrategy: `SLA_LEVEL_${policyLevel.level}:ROLE:${candidate.roleCode}`,
      };
    }

    return {
      receiverId: task.receiverId,
      target: "SELF_MVP_FALLBACK",
      resolverStrategy: `SLA_LEVEL_${policyLevel.level}:SELF_MVP_FALLBACK:NO_ROLE_CANDIDATE`,
    };
  }

  private assertUserContext(
    context: UserContext | null | undefined,
  ): asserts context is UserContext {
    if (!context?.userId || !context.departmentId) {
      throw new ReminderAccessDeniedError("User context is required.");
    }
  }

  private assertTransition(
    from: ReminderStatusCode,
    to: ReminderStatusCode,
  ): void {
    try {
      assertReminderTransition(from, to);
    } catch (error) {
      if (error instanceof InvalidReminderTransitionError) {
        throw new ReminderInvalidTransitionError(from, to);
      }

      throw error;
    }
  }

  private mapReminderError(error: unknown): Error {
    if (error instanceof ReminderTaskStatusTransitionConflictError) {
      return new ReminderConflictError(error.message);
    }

    return error instanceof Error
      ? error
      : new Error("Unknown reminder service error.");
  }

  private toReminderAuditEvent(
    actor: ReminderSendActor,
    action: AuditActionCode,
    oldRecord: ReminderTaskStateRecord,
    newRecord: ReminderTaskStateRecord,
    extras: {
      notificationId?: string;
      operation?: string;
      nextEscalationAvailableAt?: string | null;
      escalationReceiverId?: string;
      escalationTarget?: string;
      resolverStrategy?: string;
      policyCode?: string;
      escalationLevel?: number;
      slaStatus?: string;
    } = {},
  ): CreateAuditEventInput {
    return {
      actor: this.toAuditActor(actor),
      action,
      target: {
        type: AuditTargetTypeCode.reminderTask,
        id: newRecord.id,
      },
      oldValue: toReminderAuditSummary(actor, action, oldRecord, {
        oldStatus: oldRecord.status,
      }),
      newValue: toReminderAuditSummary(actor, action, newRecord, {
        oldStatus: oldRecord.status,
        newStatus: newRecord.status,
        notificationId: extras.notificationId,
        operation: extras.operation,
        nextEscalationAvailableAt: extras.nextEscalationAvailableAt,
        escalationReceiverId: extras.escalationReceiverId,
        escalationTarget: extras.escalationTarget,
        resolverStrategy: extras.resolverStrategy,
        policyCode: extras.policyCode,
        escalationLevel: extras.escalationLevel,
        slaStatus: extras.slaStatus,
      }),
    };
  }

  private toNotificationAuditEvent(
    actor: ReminderSendActor,
    notification: NotificationRecord,
    reminderTaskId: string,
  ): CreateAuditEventInput {
    return {
      actor: this.toAuditActor(actor),
      action: AuditActionCode.create,
      target: {
        type: AuditTargetTypeCode.notification,
        id: notification.id,
      },
      oldValue: null,
      newValue: {
        actorType: getAuditActorType(actor),
        notificationId: notification.id,
        reminderTaskId,
        receiverId: notification.receiverId,
        channel: notification.channel,
        status: notification.status,
        sentAt: toAuditDateString(notification.sentAt),
      } as AuditJsonValue,
    };
  }

  private async sendReminderEmailBestEffort(
    actor: ReminderSendActor,
    task: ReminderTaskStateRecord | ReminderSlaQueueRecord,
    receiverId: string,
    operation: string,
    now: Date,
  ): Promise<void> {
    if (!this.reportEmailDeliveryService) {
      return;
    }

    try {
      const recipient = await this.reminderRepository.findUserEmailById(receiverId);
      if (!recipient) {
        return;
      }

      const result = await this.reportEmailDeliveryService.send({
        deliveryId: `reminder-${task.id}-${operation}-${now.toISOString()}`,
        toAddress: recipient.email,
        subject: "Research IP System - Reminder Notification",
        textBody: buildReminderEmailTextBody(task, operation, now),
        htmlBody: buildReminderEmailHtmlBody(task, operation, now),
      });

      await this.recordReminderEmailAuditEvent(
        actor,
        task,
        recipient.email,
        operation,
        result,
      );
    } catch {
      return;
    }
  }

  private async recordReminderEmailAuditEvent(
    actor: ReminderSendActor,
    task: ReminderTaskStateRecord | ReminderSlaQueueRecord,
    recipientEmail: string,
    operation: string,
    result: ReportEmailDeliveryResult,
  ): Promise<void> {
    await this.auditService.recordEvent({
      actor: this.toAuditActor(actor),
      action: AuditActionCode.update,
      target: {
        type: AuditTargetTypeCode.reminderTask,
        id: task.id,
      },
      oldValue: null,
      newValue: {
        operation: "SEND_EMAIL",
        emailType: "REMINDER",
        reminderOperation: operation,
        status: result.status,
        adapter: result.adapter,
        dryRun: result.dryRun,
        attemptCount: result.attemptCount,
        emailMasked: maskReminderEmail(recipientEmail),
        providerMessageIdPresent: Boolean(result.providerMessageId),
        failureCategory: result.failureCategory,
      } as AuditJsonValue,
    });
  }

  private toAuditActor(actor: ReminderSendActor): {
    userId?: string | null;
    departmentId?: string | null;
  } {
    if (isSystemActor(actor)) {
      return {
        userId: null,
        departmentId: null,
      };
    }

    return {
      userId: actor.userId,
      departmentId: actor.departmentId,
    };
  }

  private async loadReminderSlaPolicy(): Promise<ReminderSlaPolicy> {
    if (!this.reminderRepository.getActiveSlaPolicyConfig) {
      return defaultReminderSlaPolicy;
    }

    const record = await this.reminderRepository.getActiveSlaPolicyConfig();

    return record ? toReminderSlaPolicy(record) : defaultReminderSlaPolicy;
  }

  private toSystemSlaScanContext(): UserContext {
    return {
      userId: "00000000-0000-4000-8000-000000000000",
      departmentId: "00000000-0000-4000-8000-000000000000",
      roleIds: [],
      roleCodes: [],
      permissionCodes: [],
      roleScopes: [],
      scopedDepartmentIds: [],
    };
  }
}

type ReminderAuditSummaryExtras = {
  oldStatus?: ReminderStatusCode;
  newStatus?: ReminderStatusCode;
  notificationId?: string;
  operation?: string;
  nextEscalationAvailableAt?: string | null;
  escalationReceiverId?: string;
  escalationTarget?: string;
  resolverStrategy?: string;
  policyCode?: string;
  escalationLevel?: number;
  slaStatus?: string;
};

const buildReminderEmailTextBody = (
  task: ReminderTaskStateRecord | ReminderSlaQueueRecord,
  operation: string,
  now: Date,
): string =>
  [
    "Research IP System reminder notification.",
    `Operation: ${operation}`,
    `Reminder task: ${task.id}`,
    `Target type: ${task.targetType}`,
    `Status: ${task.status}`,
    `Remind level: ${task.remindLevel}`,
    `Generated at: ${now.toISOString()}`,
    "This email contains only a summary. Please sign in to view details.",
  ].join("\n");

const buildReminderEmailHtmlBody = (
  task: ReminderTaskStateRecord | ReminderSlaQueueRecord,
  operation: string,
  now: Date,
): string => {
  const rows: Array<[string, string]> = [
    ["提醒类型", operation],
    ["提醒任务", task.id],
    ["目标类型", task.targetType],
    ["当前状态", task.status],
    ["提醒级别", task.remindLevel],
    ["生成时间", now.toISOString()],
  ];

  return [
    '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#111827;max-width:680px;margin:0 auto;border:1px solid #dbe3ea;border-radius:8px;overflow:hidden">',
    '<div style="background:#0f6b7d;color:#fff;padding:20px 28px">',
    `<h1 style="font-size:20px;margin:0">${escapeReminderEmailHtml("研究院科研成果与知识产权管理系统")}</h1>`,
    '<p style="font-size:14px;margin:8px 0 0">local-demo / reminder email notification</p>',
    '</div>',
    '<div style="padding:24px 28px">',
    `<h2 style="font-size:18px;margin:0 0 12px">${escapeReminderEmailHtml("提醒推送摘要")}</h2>`,
    `<p>${escapeReminderEmailHtml("这是一封费用到期、逾期或升级提醒邮件。正文只包含摘要，不包含敏感业务明细或附件。")}</p>`,
    '<table style="border-collapse:collapse;width:100%;margin-top:16px">',
    ...rows.map(
      ([label, value]) =>
        `<tr><td style="border:1px solid #dbe3ea;background:#f8fafc;padding:10px 12px;width:32%">${escapeReminderEmailHtml(label)}</td><td style="border:1px solid #dbe3ea;padding:10px 12px">${escapeReminderEmailHtml(value)}</td></tr>`,
    ),
    '</table>',
    `<p style="color:#52627a;margin-top:18px">${escapeReminderEmailHtml("请登录系统查看详情并完成处理。")}</p>`,
    '</div>',
    '</div>',
  ].join("");
};

const escapeReminderEmailHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => reminderHtmlEscapeMap[char] ?? char)
    .replace(/[^\x20-\x7E]/g, (char) => `&#${char.codePointAt(0) ?? 0};`);

const reminderHtmlEscapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const maskReminderEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "[masked-email]";
  }

  return `${localPart.slice(0, 1)}***@${domainPart}`;
};

const toReminderAuditSummary = (
  actor: ReminderSendActor,
  action: AuditActionCode,
  record: ReminderTaskStateRecord,
  extras: ReminderAuditSummaryExtras,
): AuditJsonValue =>
  ({
    actorType: getAuditActorType(actor),
    reminderTaskId: record.id,
    action,
    targetType: record.targetType,
    targetId: record.targetId,
    receiverId: record.receiverId,
    remindDate: toAuditDateString(record.remindDate),
    remindLevel: record.remindLevel,
    status: record.status,
    ...(extras.oldStatus ? { oldStatus: extras.oldStatus } : {}),
    ...(extras.newStatus ? { newStatus: extras.newStatus } : {}),
    ...(extras.operation ? { operation: extras.operation } : {}),
    ...(extras.nextEscalationAvailableAt
      ? { nextEscalationAvailableAt: extras.nextEscalationAvailableAt }
      : {}),
    ...(extras.escalationReceiverId
      ? { escalationReceiverId: extras.escalationReceiverId }
      : {}),
    ...(extras.escalationTarget ? { escalationTarget: extras.escalationTarget } : {}),
    ...(extras.resolverStrategy
      ? { resolverStrategy: extras.resolverStrategy }
      : {}),
    ...(extras.policyCode ? { policyCode: extras.policyCode } : {}),
    ...(extras.escalationLevel ? { escalationLevel: extras.escalationLevel } : {}),
    ...(extras.slaStatus ? { slaStatus: extras.slaStatus } : {}),
    ...(record.sentAt ? { sentAt: toAuditDateString(record.sentAt) } : {}),
    ...(record.confirmedAt
      ? { confirmedAt: toAuditDateString(record.confirmedAt) }
      : {}),
    ...(extras.notificationId ? { notificationId: extras.notificationId } : {}),
  }) as AuditJsonValue;

const isSystemActor = (actor: ReminderSendActor): actor is ReminderSystemActor =>
  "actorType" in actor && actor.actorType === "SYSTEM";

const getAuditActorType = (actor: ReminderSendActor): "SYSTEM" | "USER" =>
  isSystemActor(actor) ? "SYSTEM" : "USER";

const toAuditDateString = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
};

const isReminderEscalationRateLimited = (
  task: ReminderTaskStateRecord,
  now: Date,
): boolean => {
  if (!task.sentAt) {
    return false;
  }

  return now.getTime() - new Date(task.sentAt).getTime() < reminderEscalationCooldownMs;
};

const getNextEscalationAvailableAt = (
  task: ReminderTaskStateRecord,
): string | null => {
  if (!task.sentAt) {
    return null;
  }

  return new Date(
    new Date(task.sentAt).getTime() + reminderEscalationCooldownMs,
  ).toISOString();
};

const resolveSlaPolicyLevel = (
  task: ReminderTaskStateRecord,
  now: Date,
  policy: ReminderSlaPolicy,
): ReminderSlaPolicyLevel => {
  const elapsedHours = task.sentAt
    ? (now.getTime() - new Date(task.sentAt).getTime()) / (60 * 60 * 1000)
    : 0;
  const eligibleLevels = policy.levels.filter(
    (level) => elapsedHours >= level.afterHours,
  );

  return eligibleLevels[eligibleLevels.length - 1] ?? getFirstSlaPolicyLevel(policy);
};

const getFirstSlaPolicyLevel = (
  policy: ReminderSlaPolicy,
): ReminderSlaPolicyLevel => {
  const firstLevel = policy.levels[0];

  if (!firstLevel) {
    throw new Error("Reminder SLA policy must define at least one level.");
  }

  return firstLevel;
};

const normalizeReminderSlaPolicyInput = (
  input: ReminderSlaPolicyUpdateInput,
): ReminderSlaPolicy => {
  const policyCode = sanitizePolicyCode(
    input.policyCode ?? defaultReminderSlaPolicy.policyCode,
  );

  if (!Number.isInteger(input.scanWindowHours) || input.scanWindowHours < 1) {
    throw new ReminderConflictError("SLA scan window hours must be a positive integer.");
  }

  if (!Number.isInteger(input.cooldownHours) || input.cooldownHours < 1) {
    throw new ReminderConflictError("SLA cooldown hours must be a positive integer.");
  }

  if (!Array.isArray(input.levels) || input.levels.length === 0) {
    throw new ReminderConflictError("SLA policy must define at least one level.");
  }

  const levels = input.levels
    .map((level) => normalizeReminderSlaPolicyLevel(level))
    .sort((left, right) => left.level - right.level);

  return {
    policyCode,
    scanWindowHours: input.scanWindowHours,
    cooldownHours: input.cooldownHours,
    levels,
  };
};

const normalizeReminderSlaPolicyLevel = (
  level: ReminderSlaPolicyLevelRecord,
): ReminderSlaPolicyLevel => {
  if (!Number.isInteger(level.level) || level.level < 1 || level.level > 5) {
    throw new ReminderConflictError("SLA policy level must be between 1 and 5.");
  }

  if (!Number.isInteger(level.afterHours) || level.afterHours < 0) {
    throw new ReminderConflictError("SLA policy afterHours must be a non-negative integer.");
  }

  if (level.scope !== "DEPARTMENT" && level.scope !== "GLOBAL") {
    throw new ReminderConflictError("SLA policy scope is not supported.");
  }

  const roleCodes = [...level.roleCodes].map((roleCode) =>
    normalizeReminderSlaRoleCode(roleCode),
  );

  if (roleCodes.length === 0) {
    throw new ReminderConflictError("SLA policy level must define role codes.");
  }

  return {
    level: level.level,
    code: sanitizePolicyCode(level.code),
    afterHours: level.afterHours,
    roleCodes,
    scope: level.scope,
  };
};

const normalizeReminderSlaRoleCode = (roleCode: string): RoleCode => {
  const supportedRoleCodes = Object.values(RoleCode);

  if (!supportedRoleCodes.includes(roleCode as RoleCode)) {
    throw new ReminderConflictError("SLA policy role code is not supported.");
  }

  return roleCode as RoleCode;
};

const sanitizePolicyCode = (value: string): string => {
  const code = value.trim();

  if (!/^[A-Z0-9_:-]{3,120}$/.test(code)) {
    throw new ReminderConflictError("SLA policy code is not supported.");
  }

  return code;
};

const normalizeSlaScanIdempotencyKey = (
  value: string | null | undefined,
): string | null => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 160);
};

const normalizeManualSlaScanTriggerType = (
  value: string | null | undefined,
): "MANUAL" | "API_QUEUE" => {
  if (value === "MANUAL" || value === "API_QUEUE") {
    return value;
  }

  return "API_QUEUE";
};

const sanitizeSlaScanFailureReason = (_error: unknown): string => "SCAN_FAILED";

const toReminderSlaPolicy = (
  record: ReminderSlaPolicyConfigRecord,
): ReminderSlaPolicy =>
  normalizeReminderSlaPolicyInput({
    policyCode: record.policyCode,
    scanWindowHours: record.scanWindowHours,
    cooldownHours: record.cooldownHours,
    levels: record.levels,
  });

const getReceiverDepartmentId = (
  task: ReminderTaskStateRecord | ReminderSlaQueueRecord,
): string | undefined =>
  "receiverDepartmentId" in task ? task.receiverDepartmentId : undefined;

const toReminderSlaScanSafeSummary = (
  result: ReminderSlaScanResult,
): AuditJsonValue => ({
  policyCode: result.policy.policyCode,
  scannedCount: result.scannedCount,
  escalatedCount: result.escalatedCount,
  skippedCount: result.skippedCount,
  escalated: result.escalated.map((item) => ({
    reminderTaskId: item.reminderTaskId,
    escalationLevel: item.escalationLevel,
    escalationReceiverId: item.escalationReceiverId,
    escalationTarget: item.escalationTarget,
    resolverStrategy: item.resolverStrategy,
  })),
  skipped: result.skipped.map((item) => ({
    reminderTaskId: item.reminderTaskId,
    reason: item.reason,
  })),
});

const toReminderSlaScanRunItem = (
  row: ReminderSlaScanRunRecord,
): ReminderSlaScanRunItem => ({
  id: row.id,
  policyCode: row.policyCode,
  actorUserId: row.actorUserId,
  actorDepartmentId: row.actorDepartmentId,
  scanScope: row.scanScope,
  status: row.status,
  scannedCount: row.scannedCount,
  escalatedCount: row.escalatedCount,
  skippedCount: row.skippedCount,
  safeSummary: row.safeSummary,
  triggerType: row.triggerType,
  idempotencyKey: row.idempotencyKey,
  lockKey: row.lockKey,
  lockedAt: toAuditDateString(row.lockedAt),
  lockedUntil: toAuditDateString(row.lockedUntil),
  attemptCount: row.attemptCount,
  failureReason: row.failureReason,
  requestedAt: toAuditDateString(row.requestedAt) ?? "",
  queuedAt: toAuditDateString(row.queuedAt),
  startedAt: toAuditDateString(row.startedAt) ?? "",
  completedAt: toAuditDateString(row.completedAt),
  createdAt: toAuditDateString(row.createdAt) ?? "",
  updatedAt: toAuditDateString(row.updatedAt) ?? "",
});

const makeEphemeralScanRun = (
  context: UserContext,
  policy: ReminderSlaPolicy,
  result: ReminderSlaScanResult,
  now: Date,
  status: "COMPLETED" | "FAILED",
): ReminderSlaScanRunRecord => ({
  id: "00000000-0000-4000-8000-000000000000",
  policyCode: policy.policyCode,
  actorUserId: context.userId,
  actorDepartmentId: context.departmentId,
  scanScope: "ALL_RECEIVERS",
  status,
  triggerType: "MANUAL",
  idempotencyKey: null,
  lockKey: reminderSlaFullScanLockKey,
  lockedAt: now,
  lockedUntil: new Date(now.getTime() + reminderSlaScanLockMs),
  attemptCount: 1,
  failureReason: status === "FAILED" ? "SCAN_FAILED" : null,
  requestedAt: now,
  queuedAt: null,
  scannedCount: result.scannedCount,
  escalatedCount: result.escalatedCount,
  skippedCount: result.skippedCount,
  safeSummary: toReminderSlaScanSafeSummary(result),
  startedAt: now,
  completedAt: now,
  createdAt: now,
  updatedAt: now,
});

const buildReminderSlaScanMetrics = (
  runs: readonly ReminderSlaScanRunItem[],
  generatedAt: Date,
): ReminderSlaScanMetricsResponse => {
  const statusCounts = countBy(runs, (run) => run.status || "UNKNOWN");
  const triggerCounts = countBy(runs, (run) => run.triggerType || "UNKNOWN");
  const completedCount = statusCounts.get("COMPLETED") ?? 0;
  const failedCount = statusCounts.get("FAILED") ?? 0;
  const terminalCount =
    completedCount + failedCount + (statusCounts.get("SKIPPED") ?? 0);
  const queuedRuns = runs.filter((run) => run.status === "QUEUED");

  return {
    generatedAt: generatedAt.toISOString(),
    sampleSize: runs.length,
    latestRun: runs[0] ?? null,
    totals: {
      queued: statusCounts.get("QUEUED") ?? 0,
      running: statusCounts.get("RUNNING") ?? 0,
      completed: completedCount,
      failed: failedCount,
      skipped: statusCounts.get("SKIPPED") ?? 0,
      totalScanned: sumBy(runs, (run) => run.scannedCount),
      totalEscalated: sumBy(runs, (run) => run.escalatedCount),
      totalSkippedItems: sumBy(runs, (run) => run.skippedCount),
      successRate:
        terminalCount > 0
          ? Number((completedCount / terminalCount).toFixed(4))
          : 0,
    },
    triggerBreakdown: toTriggerBreakdown(triggerCounts),
    statusBreakdown: toStatusBreakdown(statusCounts),
    backlog: {
      queuedCount: statusCounts.get("QUEUED") ?? 0,
      runningCount: statusCounts.get("RUNNING") ?? 0,
      oldestQueuedAt: getOldestDateString(queuedRuns.map((run) => run.queuedAt)),
    },
    recentFailures: runs
      .filter((run) => run.status === "FAILED" || run.failureReason)
      .slice(0, 5)
      .map((run) => ({
        id: run.id,
        status: run.status,
        triggerType: run.triggerType,
        failureReason: run.failureReason,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
      })),
  };
};

const buildReminderSlaScanHealth = (
  metrics: ReminderSlaScanMetricsResponse,
  runs: readonly ReminderSlaScanRunItem[],
  generatedAt: Date,
): ReminderSlaScanHealthResponse => {
  const reasons: ReminderSlaScanHealthReason[] = [];
  const now = generatedAt.getTime();
  const staleRunningLock = runs.some((run) => {
    if (run.status !== "RUNNING" || !run.lockedUntil) {
      return false;
    }

    const lockedUntil = new Date(run.lockedUntil).getTime();
    return Number.isFinite(lockedUntil) && lockedUntil < now;
  });

  if (staleRunningLock) {
    reasons.push({
      code: "STALE_RUNNING_LOCK",
      severity: "CRITICAL",
      message: "存在已过期的运行中扫描锁，需要检查 worker 是否中断或锁未释放。",
    });
  }

  if (metrics.backlog.queuedCount >= 10) {
    reasons.push({
      code: "QUEUE_BACKLOG_HIGH",
      severity: "WARNING",
      message: "SLA 扫描排队任务较多，可能存在 scheduler 入队快于 worker 处理的情况。",
    });
  }

  if (metrics.totals.failed > 0 && metrics.totals.successRate < 0.8) {
    reasons.push({
      code: "LOW_SUCCESS_RATE",
      severity: "WARNING",
      message: "最近扫描成功率低于 80%，需要检查失败原因和 worker 执行情况。",
    });
  }

  if (metrics.totals.failed >= 3) {
    reasons.push({
      code: "REPEATED_FAILURES",
      severity: "CRITICAL",
      message: "最近扫描失败次数达到 3 次或以上，需要优先排查扫描执行链路。",
    });
  }

  const { latestRun: _latestRun, ...metricsSnapshot } = metrics;

  return {
    generatedAt: generatedAt.toISOString(),
    status: getReminderSlaHealthStatus(reasons),
    reasons,
    metricsSnapshot,
    recommendedActions: buildReminderSlaRecommendedActions(reasons),
  };
};

const getReminderSlaHealthStatus = (
  reasons: readonly ReminderSlaScanHealthReason[],
): ReminderSlaScanHealthStatus => {
  if (reasons.some((reason) => reason.severity === "CRITICAL")) {
    return "CRITICAL";
  }

  if (reasons.length > 0) {
    return "WARNING";
  }

  return "HEALTHY";
};

const buildReminderSlaRecommendedActions = (
  reasons: readonly ReminderSlaScanHealthReason[],
): string[] => {
  if (reasons.length === 0) {
    return ["保持 scheduler 与 worker 运行状态巡检，确认队列持续被消费。"];
  }

  const actions = new Set<string>();
  const codes = new Set(reasons.map((reason) => reason.code));

  if (codes.has("QUEUE_BACKLOG_HIGH")) {
    actions.add("检查 scheduler 是否启用但 worker 未及时处理队列。");
    actions.add("必要时由管理员人工触发处理下一条扫描任务。");
  }

  if (codes.has("STALE_RUNNING_LOCK")) {
    actions.add("检查 stuck RUNNING 任务及锁过期原因。");
    actions.add("确认没有异常退出的 worker 持续占用扫描锁。");
  }

  if (codes.has("LOW_SUCCESS_RATE") || codes.has("REPEATED_FAILURES")) {
    actions.add("检查最近失败原因是否为 SCAN_FAILED、LOCK_ACTIVE 或 CLAIM_CONFLICT。");
    actions.add("确认提醒升级策略、接收人解析和扫描数据范围是否正常。");
  }

  return [...actions];
};

const countBy = <T>(
  items: readonly T[],
  selectKey: (item: T) => string,
): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = selectKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
};

const sumBy = <T>(items: readonly T[], selectValue: (item: T) => number): number =>
  items.reduce((total, item) => total + selectValue(item), 0);

const toStatusBreakdown = (
  counts: Map<string, number>,
): Array<{ status: string; count: number }> =>
  [...counts.entries()]
    .sort(
      ([left], [right]) =>
        getSortIndex(statusSortOrder, left) - getSortIndex(statusSortOrder, right) ||
        left.localeCompare(right),
    )
    .map(([status, count]) => ({ status, count }));

const toTriggerBreakdown = (
  counts: Map<string, number>,
): Array<{ triggerType: string; count: number }> =>
  [...counts.entries()]
    .sort(
      ([left], [right]) =>
        getSortIndex(triggerTypeSortOrder, left) -
          getSortIndex(triggerTypeSortOrder, right) ||
        left.localeCompare(right),
    )
    .map(([triggerType, count]) => ({ triggerType, count }));

const getSortIndex = (sortOrder: readonly string[], value: string): number => {
  const index = sortOrder.indexOf(value);

  return index === -1 ? sortOrder.length : index;
};

const getOldestDateString = (
  values: readonly (string | null)[],
): string | null => {
  const dates = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  return dates[0]?.toISOString() ?? null;
};

const statusSortOrder = ["QUEUED", "RUNNING", "COMPLETED", "FAILED", "SKIPPED"];
const triggerTypeSortOrder = ["MANUAL", "API_QUEUE", "SCHEDULED"];

const compareReminderCenterItems = (
  left: ReminderCenterItem,
  right: ReminderCenterItem,
): number => {
  const severityOrder: Record<ReminderCenterSeverity, number> = {
    CRITICAL: 0,
    WARNING: 1,
    INFO: 2,
  };
  const severityDiff = severityOrder[left.severity] - severityOrder[right.severity];

  if (severityDiff !== 0) {
    return severityDiff;
  }

  return (left.dueAt ?? "").localeCompare(right.dueAt ?? "");
};
