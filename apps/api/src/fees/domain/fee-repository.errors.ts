import { FeeReviewStatusCode, PayStatusCode } from "./fee-domain.types";

export class CreatedFeeRecordNotFoundError extends Error {
  constructor(feeRecordId: string) {
    super(`Created fee record ${feeRecordId} was not found.`);
    this.name = "CreatedFeeRecordNotFoundError";
  }
}

export class FeeStatusTransitionConflictError extends Error {
  constructor(feeRecordId: string, expectedStatus: PayStatusCode) {
    super(
      `Fee record ${feeRecordId} could not transition from expected status ${expectedStatus}.`,
    );
    this.name = "FeeStatusTransitionConflictError";
  }
}

export class FeeReviewTransitionConflictError extends Error {
  constructor(feeRecordId: string, expectedReviewStatus: FeeReviewStatusCode) {
    super(
      `Fee record ${feeRecordId} could not transition from expected review status ${expectedReviewStatus}.`,
    );
    this.name = "FeeReviewTransitionConflictError";
  }
}

