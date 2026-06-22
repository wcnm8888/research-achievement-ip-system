import { ReminderStatusCode } from "./reminder-domain.types";

export class ReminderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidReminderTransitionError extends Error {
  constructor(from: ReminderStatusCode, to: ReminderStatusCode) {
    super(`Invalid reminder status transition from ${from} to ${to}.`);
    this.name = "InvalidReminderTransitionError";
  }
}

export class ReminderTaskStatusTransitionConflictError extends ReminderError {
  constructor(reminderTaskId: string, expectedStatus: ReminderStatusCode) {
    super(
      `Reminder task ${reminderTaskId} could not transition from expected status ${expectedStatus}.`,
    );
  }
}

export class ReminderAccessDeniedError extends ReminderError {}

export class ReminderNotFoundError extends ReminderError {
  constructor(message = "Reminder task was not found.") {
    super(message);
  }
}

export class ReminderConflictError extends ReminderError {}

export class ReminderInvalidTransitionError extends ReminderConflictError {
  constructor(from: ReminderStatusCode, to: ReminderStatusCode) {
    super(`Reminder task cannot transition from ${from} to ${to}.`);
  }
}
