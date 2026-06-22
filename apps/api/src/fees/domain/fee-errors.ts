import { PayStatusCode } from "./fee-domain.types";

export class InvalidFeeTransitionError extends Error {
  constructor(from: PayStatusCode, to: PayStatusCode) {
    super(`Invalid fee status transition from ${from} to ${to}.`);
    this.name = "InvalidFeeTransitionError";
  }
}

