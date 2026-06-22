import { InvalidReminderTransitionError } from "./reminder-errors";
import { ReminderStatusCode } from "./reminder-domain.types";

const transitionMap: Record<ReminderStatusCode, readonly ReminderStatusCode[]> = {
  [ReminderStatusCode.pending]: [
    ReminderStatusCode.sent,
    ReminderStatusCode.failed,
    ReminderStatusCode.cancelled,
  ],
  [ReminderStatusCode.sent]: [
    ReminderStatusCode.confirmed,
    ReminderStatusCode.failed,
    ReminderStatusCode.cancelled,
  ],
  [ReminderStatusCode.failed]: [
    ReminderStatusCode.pending,
    ReminderStatusCode.cancelled,
  ],
  [ReminderStatusCode.confirmed]: [],
  [ReminderStatusCode.cancelled]: [],
};

export const getAllowedReminderTransitions = (
  status: ReminderStatusCode,
): readonly ReminderStatusCode[] => transitionMap[status];

export const canTransitionReminderStatus = (
  from: ReminderStatusCode,
  to: ReminderStatusCode,
): boolean => transitionMap[from].includes(to);

export const assertReminderTransition = (
  from: ReminderStatusCode,
  to: ReminderStatusCode,
): void => {
  if (!canTransitionReminderStatus(from, to)) {
    throw new InvalidReminderTransitionError(from, to);
  }
};

export const isTerminalReminderStatus = (status: ReminderStatusCode): boolean =>
  status === ReminderStatusCode.confirmed ||
  status === ReminderStatusCode.cancelled;
