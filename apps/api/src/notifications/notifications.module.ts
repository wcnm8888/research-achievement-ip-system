import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { MockNotificationAdapter } from "./adapters/mock-notification.adapter";
import { NotificationRepository } from "./notification.repository";
import { NotificationService } from "./notification.service";

@Module({
  imports: [DatabaseModule],
  providers: [MockNotificationAdapter, NotificationRepository, NotificationService],
  exports: [NotificationRepository, NotificationService],
})
export class NotificationsModule {}
