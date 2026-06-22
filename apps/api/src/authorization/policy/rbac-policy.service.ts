import { Injectable } from "@nestjs/common";
import { UserContext } from "../../identity/user-context";
import { PermissionCode } from "../constants/permission-code";
import { PolicyDecision, allowDecision, denyDecision } from "./policy-decision";

@Injectable()
export class RbacPolicyService {
  hasPermission(
    context: UserContext | null | undefined,
    permission: PermissionCode,
  ): PolicyDecision {
    return this.hasAllPermissions(context, [permission]);
  }

  hasAnyPermission(
    context: UserContext | null | undefined,
    permissions: readonly PermissionCode[],
  ): PolicyDecision {
    if (permissions.length === 0) {
      return denyDecision("No permission requirement was provided.");
    }

    if (!context) {
      return denyDecision("User context is required.", permissions);
    }

    const grantedPermissions = new Set(context.permissionCodes);
    const matchedPermission = permissions.find((permission) => grantedPermissions.has(permission));

    if (!matchedPermission) {
      return denyDecision("None of the required permissions are granted.", permissions);
    }

    return allowDecision(`Permission granted: ${matchedPermission}.`);
  }

  hasAllPermissions(
    context: UserContext | null | undefined,
    permissions: readonly PermissionCode[],
  ): PolicyDecision {
    if (permissions.length === 0) {
      return denyDecision("No permission requirement was provided.");
    }

    if (!context) {
      return denyDecision("User context is required.", permissions);
    }

    const grantedPermissions = new Set(context.permissionCodes);
    const missingPermissions = permissions.filter((permission) => !grantedPermissions.has(permission));

    if (missingPermissions.length > 0) {
      return denyDecision("Required permissions are missing.", missingPermissions);
    }

    return allowDecision("All required permissions are granted.");
  }
}
