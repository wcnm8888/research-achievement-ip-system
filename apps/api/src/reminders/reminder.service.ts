import { Inject, Injectable } from "@nestjs/common";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditJsonValue, CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import { NotificationRecord } from "../notifications/domain/notification-domain.types";
import { NotificationService } from "../notifications/notification.service";
import { NotificationTransactionClient } from "../notifications/notification.repository";
import {
  InvalidReminderTransitionError,
  ReminderAccessDeniedError,
  ReminderConflictError,
  ReminderInvalidTransitionError,
  ReminderNotFoundError,
  ReminderTaskStatusTransitionConflictError,
} from "./domain/reminder-errors";
import { ReminderStatusCode } from "./domain/reminder-domain.types";
import {
  GenerateFeeDueReminderOptions,
  GenerateFeeDueReminderSummary,
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

export type ReminderSendResult = {
  reminderTask: ReminderTaskStateRecord;
  notification: NotificationRecord | null;
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
      return await this.prisma.$transaction(async (tx) => {
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
    extras: { notificationId?: string } = {},
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
}

type ReminderAuditSummaryExtras = {
  oldStatus?: ReminderStatusCode;
  newStatus?: ReminderStatusCode;
  notificationId?: string;
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
