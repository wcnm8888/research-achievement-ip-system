import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  toInAppNotificationCreateData,
  toNotificationRecord,
} from "./domain/notification-prisma.mapper";
import {
  CreateInAppNotificationInput,
  NotificationRepositoryPort,
} from "./domain/notification-repository.types";
import { NotificationRecord } from "./domain/notification-domain.types";

export type NotificationTransactionClient = Pick<
  Prisma.TransactionClient,
  "notification"
>;

@Injectable()
export class NotificationRepository implements NotificationRepositoryPort {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createInAppNotification(
    input: CreateInAppNotificationInput,
  ): Promise<NotificationRecord> {
    return this.createInAppNotificationInTransaction(this.prisma, input);
  }

  async createInAppNotificationInTransaction(
    client: NotificationTransactionClient,
    input: CreateInAppNotificationInput,
  ): Promise<NotificationRecord> {
    const row = await client.notification.create({
      data: toInAppNotificationCreateData(input),
    });

    return toNotificationRecord(row as Parameters<typeof toNotificationRecord>[0]);
  }
}
