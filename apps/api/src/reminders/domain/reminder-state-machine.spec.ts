import { describe, expect, it } from "vitest";
import { ReminderStatusCode } from "./reminder-domain.types";
import { InvalidReminderTransitionError } from "./reminder-errors";
import {
  assertReminderTransition,
  canTransitionReminderStatus,
  getAllowedReminderTransitions,
  isTerminalReminderStatus,
} from "./reminder-state-machine";

describe("reminder state machine", () => {
  it("allows pending reminders to be sent, failed, or cancelled", () => {
    expect(canTransitionReminderStatus(ReminderStatusCode.pending, ReminderStatusCode.sent)).toBe(true);
    expect(canTransitionReminderStatus(ReminderStatusCode.pending, ReminderStatusCode.failed)).toBe(true);
    expect(canTransitionReminderStatus(ReminderStatusCode.pending, ReminderStatusCode.cancelled)).toBe(true);
  });

  it("allows sent reminders to be confirmed, failed, or cancelled", () => {
    expect(canTransitionReminderStatus(ReminderStatusCode.sent, ReminderStatusCode.confirmed)).toBe(true);
    expect(canTransitionReminderStatus(ReminderStatusCode.sent, ReminderStatusCode.failed)).toBe(true);
    expect(canTransitionReminderStatus(ReminderStatusCode.sent, ReminderStatusCode.cancelled)).toBe(true);
  });

  it("allows failed reminders to return to pending or be cancelled", () => {
    expect(getAllowedReminderTransitions(ReminderStatusCode.failed)).toEqual([
      ReminderStatusCode.pending,
      ReminderStatusCode.cancelled,
    ]);
  });

  it("treats confirmed and cancelled reminders as terminal", () => {
    expect(isTerminalReminderStatus(ReminderStatusCode.confirmed)).toBe(true);
    expect(isTerminalReminderStatus(ReminderStatusCode.cancelled)).toBe(true);
    expect(canTransitionReminderStatus(ReminderStatusCode.confirmed, ReminderStatusCode.pending)).toBe(false);
  });

  it("throws for invalid transitions", () => {
    expect(() =>
      assertReminderTransition(ReminderStatusCode.confirmed, ReminderStatusCode.sent),
    ).toThrow(InvalidReminderTransitionError);
  });
});
