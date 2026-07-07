import {
  Body,
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UnprocessableEntityException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import {
  RequireAnyPermission,
  RequirePermissions,
} from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import { ExportFieldSelectionError } from "../export/fields";
import { AchievementService } from "./achievement.service";
import {
  AchievementAccessDeniedError,
  AchievementConflictError,
  AchievementInvalidPayloadError,
  AchievementInvalidStateError,
  AchievementNotFoundError,
  AchievementPermissionDeniedError,
  AchievementUnsupportedOperationError,
} from "./domain/achievement-service.errors";
import { VoidAchievementDto } from "./dto/achievement-action.dto";
import { AchievementListQueryDto } from "./dto/achievement-list-query.dto";
import { CreateAchievementDto } from "./dto/create-achievement.dto";
import { UpdateAchievementDto } from "./dto/update-achievement.dto";

const achievementValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const achievementValidationPipe = new ValidationPipe(achievementValidationOptions);
const createAchievementValidationPipe = new ValidationPipe({
  ...achievementValidationOptions,
  expectedType: CreateAchievementDto,
});
const achievementListQueryValidationPipe = new ValidationPipe({
  ...achievementValidationOptions,
  expectedType: AchievementListQueryDto,
});
const updateAchievementValidationPipe = new ValidationPipe({
  ...achievementValidationOptions,
  expectedType: UpdateAchievementDto,
});
const voidAchievementValidationPipe = new ValidationPipe({
  ...achievementValidationOptions,
  expectedType: VoidAchievementDto,
});

type HeaderResponse = {
  setHeader(name: string, value: string | number): void;
};

@Controller("achievements")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(achievementValidationPipe)
export class AchievementController {
  constructor(
    @Inject(AchievementService)
    private readonly achievementService: AchievementService,
  ) {}

  @Post()
  @RequirePermissions(PermissionCode.achievementCreate)
  async createDraft(
    @CurrentUser() currentUser: UserContext,
    @Body(createAchievementValidationPipe) dto: CreateAchievementDto,
  ) {
    try {
      return await this.achievementService.createDraft(currentUser, dto);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Get()
  @RequirePermissions(PermissionCode.userContextRead)
  async list(
    @CurrentUser() currentUser: UserContext,
    @Query(achievementListQueryValidationPipe) query: AchievementListQueryDto,
  ) {
    try {
      return await this.achievementService.list(currentUser, query);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Get("export.csv")
  @RequirePermissions(PermissionCode.userContextRead)
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="achievements.csv"')
  async exportCsv(
    @CurrentUser() currentUser: UserContext,
    @Query(achievementListQueryValidationPipe) query: AchievementListQueryDto,
  ) {
    try {
      return await this.achievementService.exportCsv(currentUser, query);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Get("export.xlsx")
  @RequirePermissions(PermissionCode.userContextRead)
  async exportXlsx(
    @CurrentUser() currentUser: UserContext,
    @Query(achievementListQueryValidationPipe) query: AchievementListQueryDto,
    @Res({ passthrough: true }) response: HeaderResponse,
  ): Promise<StreamableFile> {
    try {
      const body = await this.achievementService.exportXlsx(currentUser, query);
      setDownloadHeaders(response, "achievements.xlsx", body);

      return new StreamableFile(body);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Get(":id")
  @RequireAnyPermission(
    PermissionCode.achievementReadOwn,
    PermissionCode.achievementReadDepartment,
  )
  async getDetail(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) achievementId: string,
  ) {
    try {
      return await this.achievementService.getDetail(currentUser, achievementId);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Patch(":id")
  @RequirePermissions(PermissionCode.achievementUpdateOwn)
  async updateDraft(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Body(updateAchievementValidationPipe) dto: UpdateAchievementDto,
  ) {
    try {
      return await this.achievementService.updateDraft(currentUser, achievementId, dto);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Post(":id/submit")
  @RequirePermissions(PermissionCode.achievementSubmit)
  async submitDraft(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) achievementId: string,
  ) {
    try {
      return await this.achievementService.submitDraft(currentUser, achievementId);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Post(":id/void")
  @RequirePermissions(PermissionCode.achievementUpdateOwn)
  async voidAchievement(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Body(voidAchievementValidationPipe) dto: VoidAchievementDto,
  ) {
    try {
      return await this.achievementService.voidAchievement(currentUser, achievementId, dto);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }

  @Post(":id/archive")
  @RequirePermissions(PermissionCode.achievementArchive)
  async archiveAchievement(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) achievementId: string,
  ) {
    try {
      return await this.achievementService.archiveAchievement(currentUser, achievementId);
    } catch (error) {
      throw mapAchievementServiceError(error);
    }
  }
}

const mapAchievementServiceError = (error: unknown): Error => {
  if (error instanceof ExportFieldSelectionError) {
    return new BadRequestException("unsupported export fields");
  }

  if (
    error instanceof AchievementPermissionDeniedError ||
    error instanceof AchievementAccessDeniedError
  ) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof AchievementNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof AchievementConflictError ||
    error instanceof AchievementInvalidStateError
  ) {
    return new ConflictException(error.message);
  }

  if (
    error instanceof AchievementUnsupportedOperationError ||
    error instanceof AchievementInvalidPayloadError
  ) {
    return new UnprocessableEntityException(error.message);
  }

  return error instanceof Error ? error : new Error("Unknown achievement service error.");
};

const setDownloadHeaders = (
  response: HeaderResponse,
  fileName: string,
  body: Buffer,
): void => {
  response.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  response.setHeader("Content-Length", body.byteLength);
  response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
};
