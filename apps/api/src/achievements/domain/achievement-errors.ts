import { AchievementStatusCode, AchievementTypeCode } from "./achievement-domain.types";

export class AchievementDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AchievementDomainError";
  }
}

export class InvalidAchievementTransitionError extends AchievementDomainError {
  constructor(from: AchievementStatusCode, to: AchievementStatusCode) {
    super(`Achievement status cannot transition from ${from} to ${to}.`);
    this.name = "InvalidAchievementTransitionError";
  }
}

export class InvalidAchievementTypeDetailError extends AchievementDomainError {
  constructor(type: AchievementTypeCode) {
    super(`Achievement detail payload does not match achievement type ${type}.`);
    this.name = "InvalidAchievementTypeDetailError";
  }
}

export class InvalidNormalizedBusinessKeyError extends AchievementDomainError {
  constructor(reason: string) {
    super(`Invalid normalized business key: ${reason}.`);
    this.name = "InvalidNormalizedBusinessKeyError";
  }
}
