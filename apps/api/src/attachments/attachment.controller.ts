import {
  BadGatewayException,
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
import { AttachmentService } from "./attachment.service";
import {
  AttachmentAccessDeniedError,
  AttachmentInvalidPayloadError,
  AttachmentNotFoundError,
  AttachmentStorageError,
  AttachmentUnsupportedRelationError,
  AttachmentVersionConflictError,
} from "./domain/attachment-errors";
import { AttachmentListQueryDto } from "./dto/attachment-list-query.dto";
import { UploadAchievementAttachmentDto } from "./dto/upload-achievement-attachment.dto";

const attachmentValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const attachmentValidationPipe = new ValidationPipe(attachmentValidationOptions);
const uploadAttachmentValidationPipe = new ValidationPipe({
  ...attachmentValidationOptions,
  expectedType: UploadAchievementAttachmentDto,
});
const attachmentListQueryValidationPipe = new ValidationPipe({
  ...attachmentValidationOptions,
  expectedType: AttachmentListQueryDto,
});

@Controller("achievements/:achievementId/attachments")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(attachmentValidationPipe)
export class AttachmentController {
  constructor(
    @Inject(AttachmentService)
    private readonly attachmentService: AttachmentService,
  ) {}

  @Post()
  @RequirePermissions(PermissionCode.achievementUpdateOwn)
  async uploadAchievementAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Body(uploadAttachmentValidationPipe) dto: UploadAchievementAttachmentDto,
  ) {
    try {
      return await this.attachmentService.createAchievementAttachmentForUser(
        currentUser,
        achievementId,
        dto,
      );
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get()
  @RequirePermissions(PermissionCode.attachmentReadMetadata)
  async listAchievementAttachments(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Query(attachmentListQueryValidationPipe) query: AttachmentListQueryDto,
  ) {
    try {
      return await this.attachmentService.listAchievementMetadata(
        currentUser,
        achievementId,
        query ?? {},
      );
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get(":attachmentId")
  @RequirePermissions(PermissionCode.attachmentReadMetadata)
  async getAchievementAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Param("attachmentId", new ParseUUIDPipe({ version: "4" })) attachmentId: string,
  ) {
    try {
      return await this.attachmentService.getAchievementAttachmentMetadata(
        currentUser,
        achievementId,
        attachmentId,
      );
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get(":attachmentId/download")
  @RequirePermissions(PermissionCode.attachmentDownload)
  async downloadAchievementAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Param("attachmentId", new ParseUUIDPipe({ version: "4" })) attachmentId: string,
  ) {
    try {
      return await this.attachmentService.downloadAchievementAttachment(
        currentUser,
        achievementId,
        attachmentId,
      );
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }
}

const mapAttachmentServiceError = (error: unknown): Error => {
  if (error instanceof AttachmentAccessDeniedError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof AttachmentNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof AttachmentVersionConflictError) {
    return new ConflictException(error.message);
  }

  if (
    error instanceof AttachmentInvalidPayloadError ||
    error instanceof AttachmentUnsupportedRelationError
  ) {
    return new UnprocessableEntityException(error.message);
  }

  if (error instanceof AttachmentStorageError) {
    return new BadGatewayException(error.message);
  }

  return error instanceof Error ? error : new Error("Unknown attachment service error.");
};
