import { describe, expect, it } from "vitest";
import { AchievementStatusCode } from "./achievement-domain.types";
import { InvalidAchievementTransitionError } from "./achievement-errors";
import {
  assertAchievementTransition,
  canTransitionAchievementStatus,
  getAllowedAchievementTransitions,
  isEditableAchievementStatus,
  isTerminalAchievementStatus,
} from "./achievement-state-machine";

describe("achievement state machine", () => {
  it("allows draft save, submit, and void transitions", () => {
    expect(getAllowedAchievementTransitions(AchievementStatusCode.draft)).toEqual([
      AchievementStatusCode.draft,
      AchievementStatusCode.pendingDepartmentReview,
      AchievementStatusCode.voided,
    ]);
    expect(
      canTransitionAchievementStatus(
        AchievementStatusCode.draft,
        AchievementStatusCode.pendingDepartmentReview,
      ),
    ).toBe(true);
  });

  it("keeps department rejected transitions as Step 6-compatible reserved rules", () => {
    expect(getAllowedAchievementTransitions(AchievementStatusCode.departmentRejected)).toEqual([
      AchievementStatusCode.draft,
      AchievementStatusCode.pendingDepartmentReview,
      AchievementStatusCode.voided,
    ]);
  });

  it("allows department review to approve toward archive or reject back for editing", () => {
    expect(
      getAllowedAchievementTransitions(AchievementStatusCode.pendingDepartmentReview),
    ).toEqual([
      AchievementStatusCode.pendingArchive,
      AchievementStatusCode.departmentRejected,
      AchievementStatusCode.voided,
    ]);
    expect(
      canTransitionAchievementStatus(
        AchievementStatusCode.pendingDepartmentReview,
        AchievementStatusCode.pendingArchive,
      ),
    ).toBe(true);
    expect(
      canTransitionAchievementStatus(
        AchievementStatusCode.pendingDepartmentReview,
        AchievementStatusCode.departmentRejected,
      ),
    ).toBe(true);
  });

  it("allows pending archive to archive or void only", () => {
    expect(getAllowedAchievementTransitions(AchievementStatusCode.pendingArchive)).toEqual([
      AchievementStatusCode.archived,
      AchievementStatusCode.voided,
    ]);
  });

  it("does not allow jumping from review directly to archived", () => {
    expect(
      canTransitionAchievementStatus(
        AchievementStatusCode.pendingDepartmentReview,
        AchievementStatusCode.archived,
      ),
    ).toBe(false);
  });

  it("treats archived and voided as terminal statuses", () => {
    expect(isTerminalAchievementStatus(AchievementStatusCode.archived)).toBe(true);
    expect(isTerminalAchievementStatus(AchievementStatusCode.voided)).toBe(true);
    expect(getAllowedAchievementTransitions(AchievementStatusCode.archived)).toEqual([]);
    expect(getAllowedAchievementTransitions(AchievementStatusCode.voided)).toEqual([]);
  });

  it("marks only draft and department rejected as editable", () => {
    expect(isEditableAchievementStatus(AchievementStatusCode.draft)).toBe(true);
    expect(isEditableAchievementStatus(AchievementStatusCode.departmentRejected)).toBe(true);
    expect(isEditableAchievementStatus(AchievementStatusCode.pendingDepartmentReview)).toBe(false);
  });

  it("throws a domain error for invalid transitions", () => {
    expect(() =>
      assertAchievementTransition(AchievementStatusCode.archived, AchievementStatusCode.draft),
    ).toThrow(InvalidAchievementTransitionError);
  });
});
