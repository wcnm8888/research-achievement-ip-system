export const GrantStatusCode = {
  active: "ACTIVE",
  revoked: "REVOKED",
  expired: "EXPIRED",
} as const;

export type GrantStatusCode = (typeof GrantStatusCode)[keyof typeof GrantStatusCode];
