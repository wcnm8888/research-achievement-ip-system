import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import {
  SecretAuthorizationInvalidResourceTypeError,
  SecretAuthorizationPermissionDeniedError,
  SecretAuthorizationResourceNotFoundError,
  SecretAuthorizationService,
} from "./secret-authorization.service";

@Controller("secret-authorization")
@UseGuards(UserContextGuard, PermissionGuard)
@RequirePermissions(PermissionCode.systemConfig)
export class SecretAuthorizationController {
  constructor(
    @Inject(SecretAuthorizationService)
    private readonly secretAuthorizationService: SecretAuthorizationService,
  ) {}

  @Get("overview")
  async getOverview(@CurrentUser() currentUser: UserContext) {
    try {
      return await this.secretAuthorizationService.getOverview(currentUser);
    } catch (error) {
      throw mapSecretAuthorizationError(error);
    }
  }

  @Get("resources")
  async listResources(@CurrentUser() currentUser: UserContext) {
    try {
      return await this.secretAuthorizationService.listResources(currentUser);
    } catch (error) {
      throw mapSecretAuthorizationError(error);
    }
  }

  @Get("resources/:resourceType/:resourceId/grants")
  async getResourceGrantDetail(
    @CurrentUser() currentUser: UserContext,
    @Param("resourceType") resourceType: string,
    @Param("resourceId", new ParseUUIDPipe({ version: "4" })) resourceId: string,
  ) {
    try {
      return await this.secretAuthorizationService.getResourceGrantDetail(
        currentUser,
        resourceType,
        resourceId,
      );
    } catch (error) {
      throw mapSecretAuthorizationError(error);
    }
  }
}

const mapSecretAuthorizationError = (error: unknown): Error => {
  if (error instanceof SecretAuthorizationPermissionDeniedError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof SecretAuthorizationResourceNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof SecretAuthorizationInvalidResourceTypeError) {
    return new BadRequestException(error.message);
  }

  return error instanceof Error
    ? error
    : new BadRequestException("Unknown secret authorization controller error.");
};
