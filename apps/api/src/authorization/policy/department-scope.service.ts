import { Inject, Injectable } from "@nestjs/common";
import { UserContext } from "../../identity/user-context";
import { PermissionCode } from "../constants/permission-code";
import { ScopeType } from "../constants/scope-type";
import { PolicyDecision, allowDecision, denyDecision } from "./policy-decision";
import { RbacPolicyService } from "./rbac-policy.service";

@Injectable()
export class DepartmentScopeService {
  constructor(@Inject(RbacPolicyService) private readonly rbacPolicy: RbacPolicyService) {}

  getScopedDepartmentIds(context: UserContext | null | undefined): readonly string[] {
    if (!context) {
      return [];
    }

    const departmentIds = [
      ...context.scopedDepartmentIds,
      ...context.roleScopes
        .filter((roleScope) => roleScope.scopeType === ScopeType.department)
        .map((roleScope) => roleScope.departmentId)
        .filter((departmentId): departmentId is string => departmentId !== null),
    ];

    return [...new Set(departmentIds)];
  }

  isInScopedDepartment(
    context: UserContext | null | undefined,
    departmentId: string,
  ): boolean {
    return this.getScopedDepartmentIds(context).includes(departmentId);
  }

  canAccessOwnResource(
    context: UserContext | null | undefined,
    ownerUserId: string,
  ): PolicyDecision {
    if (!context) {
      return denyDecision("User context is required.");
    }

    if (context.userId !== ownerUserId) {
      return denyDecision("Resource owner is outside the current user scope.");
    }

    return allowDecision("Resource owner matches the current user.");
  }

  canAccessDepartmentResource(
    context: UserContext | null | undefined,
    departmentId: string,
    requiredPermission: PermissionCode,
  ): PolicyDecision {
    const permissionDecision = this.rbacPolicy.hasPermission(context, requiredPermission);

    if (permissionDecision.effect === "DENY") {
      return permissionDecision;
    }

    if (!this.isInScopedDepartment(context, departmentId)) {
      return denyDecision("Department is outside the current user's exact department scope.");
    }

    return allowDecision("Department is inside the current user's exact department scope.");
  }
}
