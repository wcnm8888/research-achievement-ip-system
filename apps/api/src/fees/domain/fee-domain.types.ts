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

