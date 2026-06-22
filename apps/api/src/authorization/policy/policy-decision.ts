import { PermissionCode } from "../constants/permission-code";

export type PolicyDecision =
  | {
      effect: "ALLOW";
      reason: string;
    }
  | {
      effect: "DENY";
      reason: string;
      missingPermissions?: readonly PermissionCode[];
    };

export const allowDecision = (reason: string): PolicyDecision => ({
  effect: "ALLOW",
  reason,
});

export const denyDecision = (
  reason: string,
  missingPermissions: readonly PermissionCode[] = [],
): PolicyDecision => ({
  effect: "DENY",
  reason,
  missingPermissions,
});
