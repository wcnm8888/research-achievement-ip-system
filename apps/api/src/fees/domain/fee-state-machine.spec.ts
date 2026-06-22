import { describe, expect, it } from "vitest";
import { InvalidFeeTransitionError } from "./fee-errors";
import { PayStatusCode } from "./fee-domain.types";
import {
  assertFeeTransition,
  canTransitionFeeStatus,
  getEffectivePayStatus,
  isFeeOverdueOnDate,
  isTerminalFeeStatus,
} from "./fee-state-machine";

describe("fee state machine", () => {
  it("allows pending fees to become paid, overdue, waived, or cancelled", () => {
    expect(canTransitionFeeStatus(PayStatusCode.pending, PayStatusCode.paid)).toBe(true);
    expect(canTransitionFeeStatus(PayStatusCode.pending, PayStatusCode.overdue)).toBe(true);
    expect(canTransitionFeeStatus(PayStatusCode.pending, PayStatusCode.waived)).toBe(true);
    expect(canTransitionFeeStatus(PayStatusCode.pending, PayStatusCode.cancelled)).toBe(true);
  });

  it("allows overdue fees to be settled or closed", () => {
    expect(canTransitionFeeStatus(PayStatusCode.overdue, PayStatusCode.paid)).toBe(true);
    expect(canTransitionFeeStatus(PayStatusCode.overdue, PayStatusCode.waived)).toBe(true);
    expect(canTransitionFeeStatus(PayStatusCode.overdue, PayStatusCode.cancelled)).toBe(true);
  });

  it("treats paid, waived, and cancelled fees as terminal", () => {
    expect(isTerminalFeeStatus(PayStatusCode.paid)).toBe(true);
    expect(isTerminalFeeStatus(PayStatusCode.waived)).toBe(true);
    expect(isTerminalFeeStatus(PayStatusCode.cancelled)).toBe(true);
    expect(canTransitionFeeStatus(PayStatusCode.paid, PayStatusCode.overdue)).toBe(false);
  });

  it("throws for invalid transitions", () => {
    expect(() => assertFeeTransition(PayStatusCode.paid, PayStatusCode.pending)).toThrow(
      InvalidFeeTransitionError,
    );
  });

  it("derives overdue status by date without mutating terminal states", () => {
    const dueDate = new Date("2026-06-10T00:00:00.000Z");
    const today = new Date("2026-06-18T12:00:00.000Z");

    expect(isFeeOverdueOnDate(PayStatusCode.pending, dueDate, today)).toBe(true);
    expect(getEffectivePayStatus(PayStatusCode.pending, dueDate, today)).toBe(
      PayStatusCode.overdue,
    );
    expect(getEffectivePayStatus(PayStatusCode.paid, dueDate, today)).toBe(
      PayStatusCode.paid,
    );
  });
});

