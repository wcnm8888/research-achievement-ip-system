import {
  MockInAppNotificationInput,
  NotificationRecord,
} from "./notification-domain.types";

export type CreateInAppNotificationInput = Required<MockInAppNotificationInput>;

export type SendFeeReminderNotificationInput = {
  receiverId: string;
  sentAt?: Date;
};

export type NotificationRepositoryPort = {
  createInAppNotification: (
    input: CreateInAppNotificationInput,
  ) => Promise<NotificationRecord>;
};
