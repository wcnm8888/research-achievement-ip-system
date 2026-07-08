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
} from "./report-email-delivery.service";
import {
  createScheduledReportEmailSchedulerConfig,
  ScheduledReportEmailSchedulerProvider,
  SCHEDULED_REPORT_EMAIL_SCHEDULER_CONFIG,
} from "./scheduled-report-email-scheduler.provider";
import { ReportsController } from "./reports.controller";
import { ReportsRepository } from "./reports.repository";
import { ReportsService } from "./reports.service";

@Module({
  imports: [
    AuditModule,
    AuthorizationModule,
    DatabaseModule,
    IdentityModule,
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsRepository,
    ReportsService,
    ReportEmailDeliveryService,
    {
      provide: reportEmailConfigToken,
      useFactory: createReportEmailConfigFromEnv,
    },
    {
      provide: SCHEDULED_REPORT_EMAIL_SCHEDULER_CONFIG,
      useFactory: () => createScheduledReportEmailSchedulerConfig(process.env),
    },
    ScheduledReportEmailSchedulerProvider,
  ],
  exports: [ReportEmailDeliveryService],
})
export class ReportsModule {}
