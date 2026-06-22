import { Prisma } from "@prisma/client";
import {
  NotificationChannelCode,
  NotificationRecord,
  NotificationStatusCode,
} from "./notification-domain.types";
import { CreateInAppNotificationInput } from "./notification-repository.types";

type NotificationPersistenceRow = NotificationRecord;

export const toInAppNotificationCreateData = (
  input: CreateInAppNotificationInput,
): Prisma.NotificationUncheckedCreateInput => ({
  receiverId: input.receiverId,
  channel: NotificationChannelCode.inApp,
  title: input.title,
  content: input.content,
  status: NotificationStatusCode.sent,
  sentAt: input.sentAt,
});

export const toNotificationRecord = (
  row: NotificationPersistenceRow,
): NotificationRecord => ({
  id: row.id,
  receiverId: row.receiverId,
  channel: row.channel,
  title: row.title,
  content: row.content,
  status: row.status,
  createdAt: row.createdAt,
  sentAt: row.sentAt,
  readAt: row.readAt,
});
