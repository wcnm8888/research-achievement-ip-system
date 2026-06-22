import { AchievementStatusCode } from "./achievement-domain.types";
import { InvalidAchievementTransitionError } from "./achievement-errors";

const transitionMap: Record<AchievementStatusCode, readonly AchievementStatusCode[]> = {
  [AchievementStatusCode.draft]: [
    AchievementStatusCode.draft,
    AchievementStatusCode.pendingDepartmentReview,
    AchievementStatusCode.voided,
  ],
  [AchievementStatusCode.pendingDepartmentReview]: [
    AchievementStatusCode.pendingArchive,
    AchievementStatusCode.departmentRejected,
    AchievementStatusCode.voided,
  ],
  [AchievementStatusCode.departmentRejected]: [
    AchievementStatusCode.draft,
    AchievementStatusCode.pendingDepartmentReview,
    AchievementStatusCode.voided,
  ],
  [AchievementStatusCode.pendingArchive]: [
    AchievementStatusCode.archived,
    AchievementStatusCode.voided,
  ],
  [AchievementStatusCode.archived]: [],
  [AchievementStatusCode.voided]: [],
};

export const getAllowedAchievementTransitions = (
  status: AchievementStatusCode,
): readonly AchievementStatusCode[] => transitionMap[status];

export const canTransitionAchievementStatus = (
  from: AchievementStatusCode,
  to: AchievementStatusCode,
): boolean => transitionMap[from].includes(to);

export const assertAchievementTransition = (
  from: AchievementStatusCode,
  to: AchievementStatusCode,
): void => {
  if (!canTransitionAchievementStatus(from, to)) {
    throw new InvalidAchievementTransitionError(from, to);
  }
};

export const isEditableAchievementStatus = (status: AchievementStatusCode): boolean =>
  status === AchievementStatusCode.draft || status === AchievementStatusCode.departmentRejected;

export const isTerminalAchievementStatus = (status: AchievementStatusCode): boolean =>
  status === AchievementStatusCode.archived || status === AchievementStatusCode.voided;
