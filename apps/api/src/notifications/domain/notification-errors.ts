export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidNotificationInputError extends NotificationError {}
