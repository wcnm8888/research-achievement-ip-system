import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { NotificationsModule } from "../notifications/notifications.module";
import {
  createReportEmailConfigFromEnv,
  reportEmailConfigToken,
  ReportEmailDeliveryService,
} from "../reports/report-email-delivery.service";
import { WorkflowModule } from "../workflow/workflow.module";
import { ReminderController } from "./reminder.controller";
import { ReminderRepository } from "./reminder.repository";
import {
  createReminderSlaSchedulerConfig,
  REMINDER_SLA_SCHEDULER_CONFIG,
  ReminderSlaSchedulerProvider,
} from "./reminder-sla-scheduler.provider";
import { ReminderService } from "./reminder.service";

@Module({
  imports: [
    AuditModule,
    AuthorizationModule,
    DatabaseModule,
    IdentityModule,
    NotificationsModule,
    WorkflowModule,
  ],
  controllers: [ReminderController],
  providers: [
    ReminderRepository,
    ReminderService,
    ReportEmailDeliveryService,
    {
      provide: reportEmailConfigToken,
      useFactory: createReportEmailConfigFromEnv,
    },
    {
      provide: REMINDER_SLA_SCHEDULER_CONFIG,
      useFactory: () => createReminderSlaSchedulerConfig(process.env),
    },
    ReminderSlaSchedulerProvider,
  ],
  exports: [ReminderRepository, ReminderService],
})
export class RemindersModule {}
