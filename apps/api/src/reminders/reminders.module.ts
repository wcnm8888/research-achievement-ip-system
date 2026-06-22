import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { DatabaseModule } from "../database/database.module";
import { IdentityModule } from "../identity/identity.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ReminderController } from "./reminder.controller";
import { ReminderRepository } from "./reminder.repository";
import { ReminderService } from "./reminder.service";

@Module({
  imports: [
    AuditModule,
    AuthorizationModule,
    DatabaseModule,
    IdentityModule,
    NotificationsModule,
  ],
  controllers: [ReminderController],
  providers: [ReminderRepository, ReminderService],
  exports: [ReminderRepository, ReminderService],
})
export class RemindersModule {}
