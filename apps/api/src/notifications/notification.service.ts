import { Inject, Injectable } from "@nestjs/common";
import { MockNotificationAdapter } from "./adapters/mock-notification.adapter";
import {
  MockInAppNotificationInput,
  NotificationRecord,
} from "./domain/notification-domain.types";
import { InvalidNotificationInputError } from "./domain/notification-errors";
import {
  NotificationRepository,
  NotificationTransactionClient,
} from "./notification.repository";
import { SendFeeReminderNotificationInput } from "./domain/notification-repository.types";

const feeReminderNotification = {
  title: "费用提醒",
  content: "有一条费用提醒待处理。",
} as const;

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NotificationRepository)
    private readonly repository: NotificationRepository,
    @Inject(MockNotificationAdapter)
    private readonly mockAdapter: MockNotificationAdapter,
  ) {}

  async sendInAppNotification(
    input: MockInAppNotificationInput,
  ): Promise<NotificationRecord> {
    this.assertNonBlank(input.receiverId, "receiverId");
    this.assertNonBlank(input.title, "title");
    this.assertNonBlank(input.content, "content");

    const mockResult = this.mockAdapter.sendInApp(input);

    return this.repository.createInAppNotification({
      receiverId: mockResult.receiverId,
      title: mockResult.title,
      content: mockResult.content,
      sentAt: mockResult.sentAt,
    });
  }

  async sendFeeReminderInTransaction(
    client: NotificationTransactionClient,
    input: SendFeeReminderNotificationInput,
  ): Promise<NotificationRecord> {
    this.assertNonBlank(input.receiverId, "receiverId");

    const mockResult = this.mockAdapter.sendInApp({
      receiverId: input.receiverId,
      ...feeReminderNotification,
      sentAt: input.sentAt,
    });

    return this.repository.createInAppNotificationInTransaction(client, {
      receiverId: mockResult.receiverId,
      title: mockResult.title,
      content: mockResult.content,
      sentAt: mockResult.sentAt,
    });
  }

  private assertNonBlank(value: string, field: string): void {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new InvalidNotificationInputError(`${field} is required.`);
    }
  }
}
