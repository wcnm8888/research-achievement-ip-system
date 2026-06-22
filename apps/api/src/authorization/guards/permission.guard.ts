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
import { requiredPermissionsMetadataKey } from "../decorators/authorization-metadata";
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

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<UserContextRequest>();
    const userContext = getRequestUserContext(request);

    if (!userContext) {
      throw new UnauthorizedException("User context is required.");
    }

    const decision = this.rbacPolicy.hasAllPermissions(
      userContext,
      requiredPermissions,
    );

    if (decision.effect === "DENY") {
      throw new ForbiddenException(decision.reason);
    }

    return true;
  }
}
