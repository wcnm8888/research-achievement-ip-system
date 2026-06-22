import { Injectable } from "@nestjs/common";
import {
  MockInAppNotificationInput,
  MockInAppNotificationResult,
  NotificationChannelCode,
  NotificationStatusCode,
} from "../domain/notification-domain.types";

@Injectable()
export class MockNotificationAdapter {
  sendInApp(input: MockInAppNotificationInput): MockInAppNotificationResult {
    return {
      receiverId: input.receiverId,
      channel: NotificationChannelCode.inApp,
      title: input.title,
      content: input.content,
      status: NotificationStatusCode.sent,
      sentAt: input.sentAt ?? new Date(),
    };
  }
}
