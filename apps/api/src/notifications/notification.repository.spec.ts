import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import {
  NotificationChannelCode,
  NotificationStatusCode,
} from "./domain/notification-domain.types";
import {
  NotificationRepository,
  NotificationTransactionClient,
} from "./notification.repository";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  notification: "90000000-0000-4000-8000-000000000001",
  receiver: "40000000-0000-4000-8000-000000000001",
};

const createdAt = new Date("2026-06-18T10:00:00.000Z");
const sentAt = new Date("2026-06-18T10:01:00.000Z");

const makeRow = () => ({
  id: ids.notification,
  receiverId: ids.receiver,
  channel: NotificationChannelCode.inApp,
  title: "Fee reminder",
  content: "A fee reminder is due.",
  status: NotificationStatusCode.sent,
  createdAt,
  sentAt,
  readAt: null,
});

const createFakePrisma = () => ({
  notification: {
    create: vi.fn().mockResolvedValue(makeRow()),
  },
});

const createRepository = () => {
  const prisma = createFakePrisma();
  const repository = new NotificationRepository(prisma as unknown as PrismaService);

  return { repository, prisma };
};

describe("NotificationRepository dependency injection", () => {
  it("declares explicit PrismaService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(NotificationRepository)).toEqual([PrismaService]);
  });
});

describe("NotificationRepository.createInAppNotification", () => {
  it("creates a sent in-app notification with the minimal notification fields", async () => {
    const { repository, prisma } = createRepository();

    const result = await repository.createInAppNotification({
      receiverId: ids.receiver,
      title: "Fee reminder",
      content: "A fee reminder is due.",
      sentAt,
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        receiverId: ids.receiver,
        channel: NotificationChannelCode.inApp,
        title: "Fee reminder",
        content: "A fee reminder is due.",
        status: NotificationStatusCode.sent,
        sentAt,
      },
    });
    expect(result).toEqual(makeRow());
  });

  it("can create notifications with a caller-provided transaction client", async () => {
    const { repository, prisma } = createRepository();

    await repository.createInAppNotificationInTransaction(
      prisma as unknown as NotificationTransactionClient,
      {
        receiverId: ids.receiver,
        title: "Fee reminder",
        content: "A fee reminder is due.",
        sentAt,
      },
    );

    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it("does not expose broad mutation or removal helpers", () => {
    const { repository } = createRepository();
    const multiChangeMethod = ["update", "Many"].join("");
    const multiRemoveMethod = ["delete", "Many"].join("");

    expect("update" in repository).toBe(false);
    expect(multiChangeMethod in repository).toBe(false);
    expect("delete" in repository).toBe(false);
    expect(multiRemoveMethod in repository).toBe(false);
  });
});
