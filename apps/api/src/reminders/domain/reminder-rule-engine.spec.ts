import { describe, expect, it } from "vitest";
import { PayStatusCode } from "../../fees/domain/fee-domain.types";
import {
  ReminderFeeFact,
  ReminderLevelCode,
  ReminderSkipReasonCode,
} from "./reminder-domain.types";
import {
  generateReminderCandidateForFee,
  generateReminderCandidatesForFees,
  getReminderLevelForDate,
  normalizeToUtcDateOnly,
  resolveReminderReceiverId,
} from "./reminder-rule-engine";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  owner: "40000000-0000-4000-8000-000000000001",
  creator: "40000000-0000-4000-8000-000000000002",
  updater: "40000000-0000-4000-8000-000000000003",
};

const makeFeeFact = (
  overrides: Partial<ReminderFeeFact> = {},
): ReminderFeeFact => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  dueDate: "2026-07-18",
  payStatus: PayStatusCode.pending,
  createdById: ids.creator,
  updatedById: ids.updater,
  archivedAt: null,
  achievement: {
    ownerUserId: ids.owner,
  },
  ...overrides,
});

describe("reminder rule engine", () => {
  it("generates DAYS_30 for fees due in 30 days", () => {
    const result = generateReminderCandidateForFee(
      makeFeeFact({ dueDate: "2026-07-18" }),
      "2026-06-18",
    );

    expect("candidate" in result && result.candidate.remindLevel).toBe(
      ReminderLevelCode.days30,
    );
  });

  it("generates DAYS_15 for fees due in 15 days", () => {
    expect(getReminderLevelForDate("2026-07-03", "2026-06-18")).toBe(
      ReminderLevelCode.days15,
    );
  });

  it("generates DAYS_7 for fees due in 7 days", () => {
    expect(getReminderLevelForDate("2026-06-25", "2026-06-18")).toBe(
      ReminderLevelCode.days7,
    );
  });

  it("does not generate a due-today candidate", () => {
    const result = generateReminderCandidateForFee(
      makeFeeFact({ dueDate: "2026-06-18" }),
      "2026-06-18",
    );

    expect("skipped" in result && result.skipped.reason).toBe(
      ReminderSkipReasonCode.noMatchingRule,
    );
  });

  it("generates OVERDUE for fees due yesterday", () => {
    const result = generateReminderCandidateForFee(
      makeFeeFact({ dueDate: "2026-06-17" }),
      "2026-06-18",
    );

    expect("candidate" in result && result.candidate.remindLevel).toBe(
      ReminderLevelCode.overdue,
    );
  });

  it("normalizes dates to UTC date-only values and ignores time components", () => {
    expect(normalizeToUtcDateOnly("2026-06-18T23:59:59+08:00").toISOString()).toBe(
      "2026-06-18T00:00:00.000Z",
    );
    expect(
      getReminderLevelForDate(
        "2026-07-18T23:59:59.000Z",
        "2026-06-18T01:02:03.000Z",
      ),
    ).toBe(ReminderLevelCode.days30);
  });

  it("allows PENDING and OVERDUE fees to generate candidates", () => {
    for (const payStatus of [PayStatusCode.pending, PayStatusCode.overdue]) {
      const result = generateReminderCandidateForFee(
        makeFeeFact({ payStatus }),
        "2026-06-18",
      );

      expect("candidate" in result).toBe(true);
    }
  });

  it("skips PAID, WAIVED, and CANCELLED fees", () => {
    for (const payStatus of [
      PayStatusCode.paid,
      PayStatusCode.waived,
      PayStatusCode.cancelled,
    ]) {
      const result = generateReminderCandidateForFee(
        makeFeeFact({ payStatus }),
        "2026-06-18",
      );

      expect("skipped" in result && result.skipped.reason).toBe(
        ReminderSkipReasonCode.ineligibleFeeStatus,
      );
    }
  });

  it("skips archived fees", () => {
    const result = generateReminderCandidateForFee(
      makeFeeFact({ archivedAt: "2026-06-01" }),
      "2026-06-18",
    );

    expect("skipped" in result && result.skipped.reason).toBe(
      ReminderSkipReasonCode.archivedFee,
    );
  });

  it("skips matching fees when receiver cannot be resolved", () => {
    const result = generateReminderCandidateForFee(
      makeFeeFact({
        createdById: null,
        updatedById: null,
        achievement: { ownerUserId: null },
      }),
      "2026-06-18",
    );

    expect("skipped" in result && result.skipped.reason).toBe(
      ReminderSkipReasonCode.missingReceiver,
    );
  });

  it("uses receiver fallback order created, updated, achievement owner", () => {
    expect(resolveReminderReceiverId(makeFeeFact())).toBe(ids.creator);
    expect(resolveReminderReceiverId(makeFeeFact({ createdById: null }))).toBe(
      ids.updater,
    );
    expect(
      resolveReminderReceiverId(
        makeFeeFact({ createdById: null, updatedById: null }),
      ),
    ).toBe(ids.owner);
  });

  it("produces deterministic candidates for multiple fee facts", () => {
    const first = makeFeeFact({ id: "80000000-0000-4000-8000-000000000001" });
    const second = makeFeeFact({
      id: "80000000-0000-4000-8000-000000000002",
      dueDate: "2026-07-03",
      createdById: null,
    });

    const result = generateReminderCandidatesForFees(
      [first, second],
      "2026-06-18",
    );

    expect(result.skipped).toEqual([]);
    expect(result.candidates.map((candidate) => candidate.targetId)).toEqual([
      first.id,
      second.id,
    ]);
    expect(result.candidates.map((candidate) => candidate.remindLevel)).toEqual([
      ReminderLevelCode.days30,
      ReminderLevelCode.days15,
    ]);
    expect(result.candidates[1]).toEqual(
      expect.objectContaining({ receiverId: ids.updater }),
    );
  });
});
