import { InvalidFeeTransitionError } from "./fee-errors";
import { PayStatusCode } from "./fee-domain.types";

const transitionMap: Record<PayStatusCode, readonly PayStatusCode[]> = {
  [PayStatusCode.pending]: [
    PayStatusCode.paid,
    PayStatusCode.overdue,
    PayStatusCode.waived,
    PayStatusCode.cancelled,
  ],
  [PayStatusCode.overdue]: [
    PayStatusCode.paid,
    PayStatusCode.waived,
    PayStatusCode.cancelled,
  ],
  [PayStatusCode.paid]: [],
  [PayStatusCode.waived]: [],
  [PayStatusCode.cancelled]: [],
};

export const getAllowedFeeTransitions = (
  status: PayStatusCode,
): readonly PayStatusCode[] => transitionMap[status];

export const canTransitionFeeStatus = (
  from: PayStatusCode,
  to: PayStatusCode,
): boolean => transitionMap[from].includes(to);

export const assertFeeTransition = (
  from: PayStatusCode,
  to: PayStatusCode,
): void => {
  if (!canTransitionFeeStatus(from, to)) {
    throw new InvalidFeeTransitionError(from, to);
  }
};

export const isTerminalFeeStatus = (status: PayStatusCode): boolean =>
  status === PayStatusCode.paid ||
  status === PayStatusCode.waived ||
  status === PayStatusCode.cancelled;

export const isFeeOverdueOnDate = (
  status: PayStatusCode,
  dueDate: Date,
  today: Date,
): boolean =>
  status === PayStatusCode.pending &&
  toDateOnlyTime(dueDate) < toDateOnlyTime(today);

export const getEffectivePayStatus = (
  status: PayStatusCode,
  dueDate: Date,
  today: Date,
): PayStatusCode =>
  isFeeOverdueOnDate(status, dueDate, today) ? PayStatusCode.overdue : status;

const toDateOnlyTime = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

