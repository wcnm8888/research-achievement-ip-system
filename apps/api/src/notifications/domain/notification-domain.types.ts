export const NotificationChannelCode = {
  inApp: "IN_APP",
} as const;

export type NotificationChannelCode =
  (typeof NotificationChannelCode)[keyof typeof NotificationChannelCode];

export const NotificationStatusCode = {
  pending: "PENDING",
  sent: "SENT",
  read: "READ",
  failed: "FAILED",
  cancelled: "CANCELLED",
} as const;

export type NotificationStatusCode =
  (typeof NotificationStatusCode)[keyof typeof NotificationStatusCode];

export type MockInAppNotificationInput = {
  receiverId: string;
  title: string;
  content: string;
  sentAt?: Date;
};

export type MockInAppNotificationResult = {
  receiverId: string;
  channel: typeof NotificationChannelCode.inApp;
  title: string;
  content: string;
  status: typeof NotificationStatusCode.sent;
  sentAt: Date;
};

export type NotificationRecord = {
  id: string;
  receiverId: string;
  channel: NotificationChannelCode;
  title: string;
  content: string;
  status: NotificationStatusCode;
  createdAt: Date;
  sentAt: Date | null;
  readAt: Date | null;
};
