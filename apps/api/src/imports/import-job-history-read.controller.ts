import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  AchievementType,
  ImportFamily,
  ImportJobStatus,
  ImportJobItemPlannedAction,
  ImportJobItemStatus,
  ImportJobItemTargetType,
  ImportMode,
} from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import {
  ImportJobHistoryNotFoundError,
  ImportJobItemHistoryQueryInput,
  ImportJobHistoryQueryInput,
  ImportJobHistoryReadService,
} from "./import-job-history-read.service";

export class ImportJobHistoryListQueryDto {
  @IsOptional()
  @IsEnum(ImportFamily)
  family?: ImportFamily;

  @IsOptional()
  @IsEnum(ImportMode)
  mode?: ImportMode;

  @IsOptional()
  @IsEnum(AchievementType)
  achievementType?: AchievementType;

  @IsOptional()
  @IsEnum(ImportJobStatus)
  status?: ImportJobStatus;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class ImportJobItemHistoryListQueryDto {
  @IsOptional()
  @IsUUID("4")
  runId?: string;

  @IsOptional()
  @IsEnum(ImportJobItemStatus)
  status?: ImportJobItemStatus;

  @IsOptional()
  @IsEnum(ImportJobItemPlannedAction)
  plannedAction?: ImportJobItemPlannedAction;

  @IsOptional()
  @IsEnum(ImportJobItemTargetType)
  targetType?: ImportJobItemTargetType;

  @IsOptional()
  @MaxLength(120)
  @Matches(/^[A-Za-z0-9_:.:-]+$/)
  safeCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

const importJobHistoryValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const importJobHistoryValidationPipe = new ValidationPipe(
  importJobHistoryValidationOptions,
);
const importJobHistoryListQueryValidationPipe = new ValidationPipe({
  ...importJobHistoryValidationOptions,
  expectedType: ImportJobHistoryListQueryDto,
});
const importJobItemHistoryListQueryValidationPipe = new ValidationPipe({
  ...importJobHistoryValidationOptions,
  expectedType: ImportJobItemHistoryListQueryDto,
});

@Controller("import-jobs")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(importJobHistoryValidationPipe)
export class ImportJobHistoryReadController {
  constructor(
    @Inject(ImportJobHistoryReadService)
    private readonly importJobHistoryReadService: ImportJobHistoryReadService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.systemConfig)
  async listImportJobs(
    @CurrentUser() currentUser: UserContext,
    @Query(importJobHistoryListQueryValidationPipe)
    query: ImportJobHistoryListQueryDto = {},
  ) {
    return this.importJobHistoryReadService.listImportJobs(
      currentUser,
      toImportJobHistoryQueryInput(query),
    );
  }

  @Get(":id/items")
  @RequirePermissions(PermissionCode.systemConfig)
  async listImportJobItems(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Query(importJobItemHistoryListQueryValidationPipe)
    query: ImportJobItemHistoryListQueryDto = {},
  ) {
    try {
      return await this.importJobHistoryReadService.listImportJobItems(
        currentUser,
        id,
        toImportJobItemHistoryQueryInput(query),
      );
    } catch (error) {
      throw mapImportJobHistoryReadError(error);
    }
  }

  @Get(":id")
  @RequirePermissions(PermissionCode.systemConfig)
  async getImportJob(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ) {
    try {
      return await this.importJobHistoryReadService.getImportJob(currentUser, id);
    } catch (error) {
      throw mapImportJobHistoryReadError(error);
    }
  }
}

const toImportJobHistoryQueryInput = (
  query: ImportJobHistoryListQueryDto,
): ImportJobHistoryQueryInput => ({
  family: query.family,
  mode: query.mode,
  achievementType: query.achievementType,
  status: query.status,
  createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined,
  createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
  page: query.page,
  pageSize: query.pageSize,
});

const toImportJobItemHistoryQueryInput = (
  query: ImportJobItemHistoryListQueryDto,
): ImportJobItemHistoryQueryInput => ({
  runId: query.runId,
  status: query.status,
  plannedAction: query.plannedAction,
  targetType: query.targetType,
  safeCode: query.safeCode,
  page: query.page,
  pageSize: query.pageSize,
});

const mapImportJobHistoryReadError = (error: unknown): Error => {
  if (error instanceof ImportJobHistoryNotFoundError) {
    return new NotFoundException(error.message);
  }

  return error instanceof Error
    ? error
    : new Error("Unknown import job history read controller error.");
};
