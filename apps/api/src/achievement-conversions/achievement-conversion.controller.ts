import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UnprocessableEntityException,
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
import { AchievementConversionService } from "./achievement-conversion.service";
import {
  AchievementConversionAccessDeniedError,
  AchievementConversionInvalidPayloadError,
  AchievementConversionInvalidStateError,
  AchievementConversionNotFoundError,
  AchievementConversionPermissionDeniedError,
} from "./domain/achievement-conversion-service.errors";
import { CreateAchievementConversionDto } from "./dto/create-achievement-conversion.dto";
import { UpdateAchievementConversionDto } from "./dto/update-achievement-conversion.dto";

const conversionValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const conversionValidationPipe = new ValidationPipe(conversionValidationOptions);
const createConversionValidationPipe = new ValidationPipe({
  ...conversionValidationOptions,
  expectedType: CreateAchievementConversionDto,
});
const updateConversionValidationPipe = new ValidationPipe({
  ...conversionValidationOptions,
  expectedType: UpdateAchievementConversionDto,
});

@Controller("achievements/:achievementId/conversions")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(conversionValidationPipe)
export class AchievementConversionController {
  constructor(
    @Inject(AchievementConversionService)
    private readonly conversionService: AchievementConversionService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.achievementReadDepartment)
  async listByAchievement(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" }))
    achievementId: string,
  ) {
    try {
      return await this.conversionService.listByAchievement(currentUser, achievementId);
    } catch (error) {
      throw mapConversionServiceError(error);
    }
  }

  @Post()
  @RequirePermissions(PermissionCode.achievementReadDepartment)
  async createConversion(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" }))
    achievementId: string,
    @Body(createConversionValidationPipe) dto: CreateAchievementConversionDto,
  ) {
    try {
      return await this.conversionService.createConversion(
        currentUser,
        achievementId,
        dto,
      );
    } catch (error) {
      throw mapConversionServiceError(error);
    }
  }

  @Patch(":conversionId")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.achievementReadDepartment)
  async updateConversion(
    @CurrentUser() currentUser: UserContext,
    @Param("conversionId", new ParseUUIDPipe({ version: "4" }))
    conversionId: string,
    @Body(updateConversionValidationPipe) dto: UpdateAchievementConversionDto,
  ) {
    try {
      return await this.conversionService.updateConversion(
        currentUser,
        conversionId,
        dto,
      );
    } catch (error) {
      throw mapConversionServiceError(error);
    }
  }
}

const mapConversionServiceError = (error: unknown): Error => {
  if (
    error instanceof AchievementConversionAccessDeniedError ||
    error instanceof AchievementConversionPermissionDeniedError
  ) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof AchievementConversionNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof AchievementConversionInvalidStateError) {
    return new ConflictException(error.message);
  }

  if (error instanceof AchievementConversionInvalidPayloadError) {
    return new UnprocessableEntityException(error.message);
  }

  return error instanceof Error
    ? error
    : new Error("Unknown achievement conversion service error.");
};
