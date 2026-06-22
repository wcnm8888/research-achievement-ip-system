export const GranteeTypeCode = {
  user: "USER",
  role: "ROLE",
  department: "DEPARTMENT",
} as const;

export type GranteeTypeCode = (typeof GranteeTypeCode)[keyof typeof GranteeTypeCode];
