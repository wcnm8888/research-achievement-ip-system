import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  AccountLifecycleConflictError,
  AccountLifecycleInvalidTokenError,
  AccountLifecyclePermissionDeniedError,
  AccountLifecycleTargetNotFoundError,
} from "../account-lifecycle/account-lifecycle.errors";
import { AccountLifecycleService } from "../account-lifecycle/account-lifecycle.service";
import {
  AccountLifecycleReasonDto,
  CreateInviteDto,
} from "../account-lifecycle/dto/account-lifecycle.dto";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import {
  AccountManagementAccessDeniedError,
  AccountManagementConflictError,
  AccountManagementNotFoundError,
  AccountManagementPermissionDeniedError,
} from "./account-management.errors";
import { AccountManagementService } from "./account-management.service";
import {
  AccountUserListQueryDto,
  AccountManagementReasonDto,
  AssignAccountUserRoleDto,
  ChangeAccountUserDepartmentDto,
  CreateAccountUserDto,
} from "./dto/account-management.dto";

const accountManagementValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const accountManagementValidationPipe = new ValidationPipe(
  accountManagementValidationOptions,
);
const accountUserListQueryValidationPipe = new ValidationPipe({
  ...accountManagementValidationOptions,
  expectedType: AccountUserListQueryDto,
});
const createAccountUserValidationPipe = new ValidationPipe({
  ...accountManagementValidationOptions,
  expectedType: CreateAccountUserDto,
});
const accountManagementReasonValidationPipe = new ValidationPipe({
  ...accountManagementValidationOptions,
  expectedType: AccountManagementReasonDto,
});
const assignAccountUserRoleValidationPipe = new ValidationPipe({
  ...accountManagementValidationOptions,
  expectedType: AssignAccountUserRoleDto,
});
const changeAccountUserDepartmentValidationPipe = new ValidationPipe({
  ...accountManagementValidationOptions,
  expectedType: ChangeAccountUserDepartmentDto,
});
const createInviteValidationPipe = new ValidationPipe({
  ...accountManagementValidationOptions,
  expectedType: CreateInviteDto,
});
const accountLifecycleReasonValidationPipe = new ValidationPipe({
  ...accountManagementValidationOptions,
  expectedType: AccountLifecycleReasonDto,
});

@Controller("account-management")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(accountManagementValidationPipe)
export class AccountManagementController {
  constructor(
    @Inject(AccountManagementService)
    private readonly accountManagementService: AccountManagementService,
    @Inject(AccountLifecycleService)
    private readonly accountLifecycleService: AccountLifecycleService,
  ) {}

  @Get("users")
  @RequirePermissions(PermissionCode.systemConfig)
  async listUsers(
    @CurrentUser() currentUser: UserContext,
    @Query(accountUserListQueryValidationPipe) query: AccountUserListQueryDto = {},
  ) {
    try {
      return await this.accountManagementService.listUsers(currentUser, query);
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Get("users/:id")
  @RequirePermissions(PermissionCode.systemConfig)
  async getUser(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
  ) {
    try {
      return await this.accountManagementService.getUser(currentUser, userId);
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users")
  @RequirePermissions(PermissionCode.systemConfig)
  async createUser(
    @CurrentUser() currentUser: UserContext,
    @Body(createAccountUserValidationPipe) dto: CreateAccountUserDto,
  ) {
    try {
      return await this.accountManagementService.createUser(currentUser, dto);
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("invites")
  @RequirePermissions(PermissionCode.accountInvite)
  async createInvite(
    @CurrentUser() currentUser: UserContext,
    @Body(createInviteValidationPipe) dto: CreateInviteDto,
  ) {
    try {
      return await this.accountLifecycleService.createInvite(currentUser, dto);
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/invite/resend")
  @RequirePermissions(PermissionCode.accountInvite)
  async resendInvite(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
  ) {
    try {
      return await this.accountLifecycleService.resendInvite(currentUser, userId);
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/password-reset")
  @RequirePermissions(PermissionCode.accountResetPassword)
  async requestAdminPasswordReset(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Body(accountLifecycleReasonValidationPipe) dto: AccountLifecycleReasonDto = {},
  ) {
    try {
      return await this.accountLifecycleService.requestAdminPasswordReset(
        currentUser,
        userId,
        dto.reason,
      );
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/password-reset/revoke")
  @RequirePermissions(PermissionCode.accountResetPassword)
  async revokePasswordResetTokens(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Body(accountLifecycleReasonValidationPipe) dto: AccountLifecycleReasonDto = {},
  ) {
    try {
      return await this.accountLifecycleService.revokePasswordResetTokens(
        currentUser,
        userId,
        dto.reason,
      );
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/disable")
  @RequirePermissions(PermissionCode.systemConfig)
  async disableUser(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Body(accountManagementReasonValidationPipe) dto: AccountManagementReasonDto = {},
  ) {
    try {
      return await this.accountManagementService.disableUser(currentUser, userId, dto);
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/enable")
  @RequirePermissions(PermissionCode.systemConfig)
  async enableUser(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Body(accountManagementReasonValidationPipe) dto: AccountManagementReasonDto = {},
  ) {
    try {
      return await this.accountManagementService.enableUser(currentUser, userId, dto);
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/roles")
  @RequirePermissions(PermissionCode.systemConfig)
  async assignUserRole(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Body(assignAccountUserRoleValidationPipe) dto: AssignAccountUserRoleDto,
  ) {
    try {
      return await this.accountManagementService.assignUserRole(
        currentUser,
        userId,
        dto,
      );
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/roles/:userRoleId/revoke")
  @RequirePermissions(PermissionCode.systemConfig)
  async revokeUserRole(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Param("userRoleId", new ParseUUIDPipe({ version: "4" })) userRoleId: string,
    @Body(accountManagementReasonValidationPipe) dto: AccountManagementReasonDto = {},
  ) {
    try {
      return await this.accountManagementService.revokeUserRole(
        currentUser,
        userId,
        userRoleId,
        dto,
      );
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }

  @Post("users/:id/department")
  @RequirePermissions(PermissionCode.systemConfig)
  async changeUserDepartment(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Body(changeAccountUserDepartmentValidationPipe) dto: ChangeAccountUserDepartmentDto,
  ) {
    try {
      return await this.accountManagementService.changeUserDepartment(
        currentUser,
        userId,
        dto,
      );
    } catch (error) {
      throw mapAccountManagementError(error);
    }
  }
}

const mapAccountManagementError = (error: unknown): Error => {
  if (
    error instanceof AccountManagementAccessDeniedError ||
    error instanceof AccountManagementPermissionDeniedError ||
    error instanceof AccountLifecyclePermissionDeniedError
  ) {
    return new ForbiddenException(error.message);
  }

  if (
    error instanceof AccountManagementNotFoundError ||
    error instanceof AccountLifecycleTargetNotFoundError
  ) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof AccountManagementConflictError ||
    error instanceof AccountLifecycleConflictError ||
    error instanceof AccountLifecycleInvalidTokenError
  ) {
    return new ConflictException(error.message);
  }

  return error instanceof Error
    ? error
    : new Error("Unknown account management controller error.");
};
