export class AchievementRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AchievementRepositoryError";
  }
}

export class CreatedAchievementNotFoundError extends AchievementRepositoryError {
  constructor(achievementId: string) {
    super(`Created achievement ${achievementId} could not be loaded.`);
    this.name = "CreatedAchievementNotFoundError";
  }
}

export class AchievementStatusTransitionConflictError extends AchievementRepositoryError {
  constructor(
    readonly achievementId: string,
    readonly expectedStatus: string,
  ) {
    super(
      `Achievement ${achievementId} could not transition because status was not ${expectedStatus}.`,
    );
    this.name = "AchievementStatusTransitionConflictError";
  }
}
