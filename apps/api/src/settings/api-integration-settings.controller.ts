import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import { ApiIntegrationSettingsService } from "./api-integration-settings.service";
import {
  ApiIntegrationReasonDto,
  CreateApiIntegrationDto,
  ListApiCallLogsQueryDto,
  ListApiIntegrationsQueryDto,
  RunApiIntegrationMockDemoDto,
  UpdateApiIntegrationDto,
} from "./dto/api-integration-settings.dto";
import {
  SettingsAccessDeniedError,
  SettingsConflictError,
  SettingsNotFoundError,
  SettingsPermissionDeniedError,
  SettingsValidationError,
} from "./settings.errors";

const settingsValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const settingsValidationPipe = new ValidationPipe(settingsValidationOptions);
const listApiIntegrationsQueryValidationPipe = new ValidationPipe({
  ...settingsValidationOptions,
  expectedType: ListApiIntegrationsQueryDto,
});
const createApiIntegrationValidationPipe = new ValidationPipe({
  ...settingsValidationOptions,
  expectedType: CreateApiIntegrationDto,
});
const updateApiIntegrationValidationPipe = new ValidationPipe({
  ...settingsValidationOptions,
  expectedType: UpdateApiIntegrationDto,
});
const runApiIntegrationMockDemoValidationPipe = new ValidationPipe({
  ...settingsValidationOptions,
  expectedType: RunApiIntegrationMockDemoDto,
});
const listApiCallLogsQueryValidationPipe = new ValidationPipe({
  ...settingsValidationOptions,
  expectedType: ListApiCallLogsQueryDto,
});
const apiIntegrationReasonValidationPipe = new ValidationPipe({
  ...settingsValidationOptions,
  expectedType: ApiIntegrationReasonDto,
});

@Controller("settings/api-integrations")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(settingsValidationPipe)
export class ApiIntegrationSettingsController {
  constructor(
    @Inject(ApiIntegrationSettingsService)
    private readonly apiIntegrationSettingsService: ApiIntegrationSettingsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.systemConfig)
  async listApiIntegrations(
    @CurrentUser() currentUser: UserContext,
    @Query(listApiIntegrationsQueryValidationPipe)
    query: ListApiIntegrationsQueryDto = {},
  ) {
    try {
      return await this.apiIntegrationSettingsService.listApiIntegrations(
        currentUser,
        query,
      );
    } catch (error) {
      throw mapSettingsError(error);
    }
  }

  @Get("mock-demo/logs")
  @RequirePermissions(PermissionCode.systemConfig)
  async listRecentApiCallLogs(
    @CurrentUser() currentUser: UserContext,
    @Query(listApiCallLogsQueryValidationPipe)
    query: ListApiCallLogsQueryDto = {},
  ) {
    try {
      return await this.apiIntegrationSettingsService.listRecentApiCallLogs(
        currentUser,
        query,
      );
    } catch (error) {
      throw mapSettingsError(error);
    }
  }

  @Post("mock-demo/run")
  @RequirePermissions(PermissionCode.systemConfig)
  async runMockDemo(
    @CurrentUser() currentUser: UserContext,
    @Body(runApiIntegrationMockDemoValidationPipe) dto: RunApiIntegrationMockDemoDto,
  ) {
    try {
      return await this.apiIntegrationSettingsService.runMockDemo(currentUser, dto);
    } catch (error) {
      throw mapSettingsError(error);
    }
  }

  @Get(":id")
  @RequirePermissions(PermissionCode.systemConfig)
  async getApiIntegration(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) apiIntegrationId: string,
  ) {
    try {
      return await this.apiIntegrationSettingsService.getApiIntegration(
        currentUser,
        apiIntegrationId,
      );
    } catch (error) {
      throw mapSettingsError(error);
    }
  }

  @Post()
  @RequirePermissions(PermissionCode.systemConfig)
  async createApiIntegration(
    @CurrentUser() currentUser: UserContext,
    @Body(createApiIntegrationValidationPipe) dto: CreateApiIntegrationDto,
  ) {
    try {
      return await this.apiIntegrationSettingsService.createApiIntegration(
        currentUser,
        dto,
      );
    } catch (error) {
      throw mapSettingsError(error);
    }
  }

  @Patch(":id")
  @RequirePermissions(PermissionCode.systemConfig)
  async updateApiIntegration(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) apiIntegrationId: string,
    @Body(updateApiIntegrationValidationPipe) dto: UpdateApiIntegrationDto,
  ) {
    try {
      return await this.apiIntegrationSettingsService.updateApiIntegration(
        currentUser,
        apiIntegrationId,
        dto,
      );
    } catch (error) {
      throw mapSettingsError(error);
    }
  }

  @Post(":id/archive")
  @RequirePermissions(PermissionCode.systemConfig)
  async archiveApiIntegration(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) apiIntegrationId: string,
    @Body(apiIntegrationReasonValidationPipe) dto: ApiIntegrationReasonDto = {},
  ) {
    try {
      return await this.apiIntegrationSettingsService.archiveApiIntegration(
        currentUser,
        apiIntegrationId,
        dto,
      );
    } catch (error) {
      throw mapSettingsError(error);
    }
  }

  @Post(":id/restore")
  @RequirePermissions(PermissionCode.systemConfig)
  async restoreApiIntegration(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) apiIntegrationId: string,
    @Body(apiIntegrationReasonValidationPipe) dto: ApiIntegrationReasonDto = {},
  ) {
    try {
      return await this.apiIntegrationSettingsService.restoreApiIntegration(
        currentUser,
        apiIntegrationId,
        dto,
      );
    } catch (error) {
      throw mapSettingsError(error);
    }
  }
}

const mapSettingsError = (error: unknown): Error => {
  if (error instanceof SettingsAccessDeniedError) {
    return new UnauthorizedException(error.message);
  }

  if (error instanceof SettingsPermissionDeniedError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof SettingsNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof SettingsConflictError) {
    return new ConflictException(error.message);
  }

  if (error instanceof SettingsValidationError) {
    return new BadRequestException(error.message);
  }

  return error instanceof Error
    ? error
    : new BadRequestException("Unknown settings controller error.");
};
