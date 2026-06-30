export const FeeTypeCode = {
  patentApplication: "PATENT_APPLICATION",
  patentAnnual: "PATENT_ANNUAL",
  softwareCopyright: "SOFTWARE_COPYRIGHT",
  agency: "AGENCY",
  other: "OTHER",
} as const;

export type FeeTypeCode = (typeof FeeTypeCode)[keyof typeof FeeTypeCode];

export const FundSourceCode = {
  project: "PROJECT",
  department: "DEPARTMENT",
  institute: "INSTITUTE",
  other: "OTHER",
} as const;

export type FundSourceCode = (typeof FundSourceCode)[keyof typeof FundSourceCode];

export const PayStatusCode = {
  pending: "PENDING",
  paid: "PAID",
  overdue: "OVERDUE",
  waived: "WAIVED",
  cancelled: "CANCELLED",
} as const;

export type PayStatusCode = (typeof PayStatusCode)[keyof typeof PayStatusCode];

export const FeeReviewStatusCode = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
} as const;

export type FeeReviewStatusCode =
  (typeof FeeReviewStatusCode)[keyof typeof FeeReviewStatusCode];

export const FeeWarningTypeCode = {
  overdue: "OVERDUE",
  dueSoon: "DUE_SOON",
} as const;

export type FeeWarningTypeCode =
  (typeof FeeWarningTypeCode)[keyof typeof FeeWarningTypeCode];

