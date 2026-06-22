import { describe, expect, it, vi } from "vitest";
import { MockNotificationAdapter } from "./adapters/mock-notification.adapter";
import {
  NotificationChannelCode,
  NotificationStatusCode,
} from "./domain/notification-domain.types";
import { InvalidNotificationInputError } from "./domain/notification-errors";
import { NotificationRepository } from "./notification.repository";
import { NotificationService } from "./notification.service";

const ids = {
  notification: "90000000-0000-4000-8000-000000000001",
  receiver: "40000000-0000-4000-8000-000000000001",
};

const sentAt = new Date("2026-06-18T10:01:00.000Z");

const createRepository = () =>
  ({
    createInAppNotification: vi.fn().mockResolvedValue({
      id: ids.notification,
      receiverId: ids.receiver,
      channel: NotificationChannelCode.inApp,
      title: "Fee reminder",
      content: "A fee reminder is due.",
      status: NotificationStatusCode.sent,
      createdAt: new Date("2026-06-18T10:00:00.000Z"),
      sentAt,
      readAt: null,
    }),
  }) as unknown as NotificationRepository;

const createAdapter = () =>
  ({
    sendInApp: vi.fn().mockReturnValue({
      receiverId: ids.receiver,
      channel: NotificationChannelCode.inApp,
      title: "Fee reminder",
      content: "A fee reminder is due.",
      status: NotificationStatusCode.sent,
      sentAt,
    }),
  }) as unknown as MockNotificationAdapter;

const createService = () => {
  const repository = createRepository();
  const adapter = createAdapter();
  const service = new NotificationService(repository, adapter);

  return { service, repository, adapter };
};

describe("NotificationService.sendInAppNotification", () => {
  it("uses the mock adapter and persists a sent in-app notification", async () => {
    const { service, repository, adapter } = createService();

    const result = await service.sendInAppNotification({
      receiverId: ids.receiver,
      title: "Fee reminder",
      content: "A fee reminder is due.",
      sentAt,
    });

    expect(adapter.sendInApp).toHaveBeenCalledWith({
      receiverId: ids.receiver,
      title: "Fee reminder",
      content: "A fee reminder is due.",
      sentAt,
    });
    expect(repository.createInAppNotification).toHaveBeenCalledWith({
      receiverId: ids.receiver,
      title: "Fee reminder",
      content: "A fee reminder is due.",
      sentAt,
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: ids.notification,
        receiverId: ids.receiver,
        channel: NotificationChannelCode.inApp,
        status: NotificationStatusCode.sent,
      }),
    );
  });

  it("uses a predictable mock result timestamp when one is provided", async () => {
    const adapter = new MockNotificationAdapter();

    expect(
      adapter.sendInApp({
        receiverId: ids.receiver,
        title: "Fee reminder",
        content: "A fee reminder is due.",
        sentAt,
      }),
    ).toEqual({
      receiverId: ids.receiver,
      channel: NotificationChannelCode.inApp,
      title: "Fee reminder",
      content: "A fee reminder is due.",
      status: NotificationStatusCode.sent,
      sentAt,
    });
  });

  it("rejects blank notification fields before calling the adapter", async () => {
    const { service, repository, adapter } = createService();

    await expect(
      service.sendInAppNotification({
        receiverId: ids.receiver,
        title: " ",
        content: "A fee reminder is due.",
      }),
    ).rejects.toBeInstanceOf(InvalidNotificationInputError);

    expect(adapter.sendInApp).not.toHaveBeenCalled();
    expect(repository.createInAppNotification).not.toHaveBeenCalled();
  });

  it("does not depend on reminder, audit, or HTTP collaborators", () => {
    const { service } = createService();

    expect("reminderService" in service).toBe(false);
    expect("auditService" in service).toBe(false);
    expect("controller" in service).toBe(false);
  });
});
