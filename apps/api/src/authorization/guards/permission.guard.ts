import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Inject,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionCode } from "../constants/permission-code";
import {
  requiredAnyPermissionsMetadataKey,
  requiredPermissionsMetadataKey,
} from "../decorators/authorization-metadata";
import { RbacPolicyService } from "../policy/rbac-policy.service";
import {
  getRequestUserContext,
  UserContextRequest,
} from "./user-context-request";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<readonly PermissionCode[]>(
        requiredPermissionsMetadataKey,
        [context.getHandler(), context.getClass()],
      );
    const requiredAnyPermissions =
      this.reflector.getAllAndOverride<readonly PermissionCode[]>(
        requiredAnyPermissionsMetadataKey,
        [context.getHandler(), context.getClass()],
      );

    if (
      (!requiredPermissions || requiredPermissions.length === 0) &&
      (!requiredAnyPermissions || requiredAnyPermissions.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<UserContextRequest>();
    const userContext = getRequestUserContext(request);

    if (!userContext) {
      throw new UnauthorizedException("User context is required.");
    }

    const allDecision =
      requiredPermissions && requiredPermissions.length > 0
        ? this.rbacPolicy.hasAllPermissions(userContext, requiredPermissions)
        : null;

    if (allDecision?.effect === "DENY") {
      throw new ForbiddenException(allDecision.reason);
    }

    const anyDecision =
      requiredAnyPermissions && requiredAnyPermissions.length > 0
        ? this.rbacPolicy.hasAnyPermission(userContext, requiredAnyPermissions)
        : null;

    if (anyDecision?.effect === "DENY") {
      throw new ForbiddenException(anyDecision.reason);
    }

    return true;
  }
}
