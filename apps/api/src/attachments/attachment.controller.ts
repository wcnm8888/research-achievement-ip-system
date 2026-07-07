import {
  BadRequestException,
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
  PayloadTooLargeException,
  Post,
  Query,
  Res,
  StreamableFile,
  UnsupportedMediaTypeException,
  UploadedFile,
  UnprocessableEntityException,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
  AttachmentPreviewUnsupportedMediaTypeError,
  AttachmentStorageError,
  AttachmentUnsupportedRelationError,
  AttachmentVersionConflictError,
} from "./domain/attachment-errors";
import { AttachmentListQueryDto } from "./dto/attachment-list-query.dto";
import { UploadAchievementAttachmentDto } from "./dto/upload-achievement-attachment.dto";
import { toSafeFileName } from "./domain/storage-key";

const attachmentMaxBytes = 10 * 1024 * 1024;

type UploadedAttachmentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

type HeaderResponse = {
  setHeader(name: string, value: string | number): void;
};

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
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: attachmentMaxBytes },
    }),
  )
  async uploadAchievementAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Body(uploadAttachmentValidationPipe) dto: UploadAchievementAttachmentDto,
    @UploadedFile() file?: UploadedAttachmentFile,
  ) {
    try {
      return await this.attachmentService.createAchievementAttachmentForUser(
        currentUser,
        achievementId,
        toAchievementAttachmentUploadInput(dto, file),
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
    @Res({ passthrough: true }) response: HeaderResponse,
  ): Promise<StreamableFile> {
    try {
      const download = await this.attachmentService.downloadAchievementAttachment(
        currentUser,
        achievementId,
        attachmentId,
      );
      const body = Buffer.from(download.body ?? []);

      response.setHeader("Content-Type", download.mimeType ?? "application/octet-stream");
      response.setHeader("Content-Length", body.byteLength);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${toContentDispositionFileName(download.fileName)}"`,
      );

      return new StreamableFile(body);
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get(":attachmentId/preview")
  @RequirePermissions(PermissionCode.attachmentDownload)
  async previewAchievementAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("achievementId", new ParseUUIDPipe({ version: "4" })) achievementId: string,
    @Param("attachmentId", new ParseUUIDPipe({ version: "4" })) attachmentId: string,
    @Res({ passthrough: true }) response: HeaderResponse,
  ): Promise<StreamableFile> {
    try {
      const preview = await this.attachmentService.previewAchievementAttachment(
        currentUser,
        achievementId,
        attachmentId,
      );
      const body = Buffer.from(preview.body ?? []);

      response.setHeader("Content-Type", preview.mimeType ?? "application/octet-stream");
      response.setHeader("Content-Length", body.byteLength);
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader(
        "Content-Disposition",
        `inline; filename="${toContentDispositionFileName(preview.fileName)}"`,
      );

      return new StreamableFile(body);
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }
}

@Controller("fees/:feeRecordId/voucher-attachments")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(attachmentValidationPipe)
export class FeeVoucherAttachmentController {
  constructor(
    @Inject(AttachmentService)
    private readonly attachmentService: AttachmentService,
  ) {}

  @Post()
  @RequirePermissions(PermissionCode.feeManageDepartment)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: attachmentMaxBytes },
    }),
  )
  async uploadFeeVoucherAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("feeRecordId", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Body(uploadAttachmentValidationPipe) dto: UploadAchievementAttachmentDto,
    @UploadedFile() file?: UploadedAttachmentFile,
  ) {
    try {
      return await this.attachmentService.createFeeVoucherAttachmentForUser(
        currentUser,
        feeRecordId,
        toAchievementAttachmentUploadInput(dto, file),
      );
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get()
  async listFeeVoucherAttachments(
    @CurrentUser() currentUser: UserContext,
    @Param("feeRecordId", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Query(attachmentListQueryValidationPipe) query: AttachmentListQueryDto,
  ) {
    try {
      return await this.attachmentService.listFeeVoucherMetadata(
        currentUser,
        feeRecordId,
        query ?? {},
      );
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get(":attachmentId")
  async getFeeVoucherAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("feeRecordId", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Param("attachmentId", new ParseUUIDPipe({ version: "4" })) attachmentId: string,
  ) {
    try {
      return await this.attachmentService.getFeeVoucherAttachmentMetadata(
        currentUser,
        feeRecordId,
        attachmentId,
      );
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get(":attachmentId/download")
  @RequirePermissions(PermissionCode.attachmentDownload)
  async downloadFeeVoucherAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("feeRecordId", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Param("attachmentId", new ParseUUIDPipe({ version: "4" })) attachmentId: string,
    @Res({ passthrough: true }) response: HeaderResponse,
  ): Promise<StreamableFile> {
    try {
      const download = await this.attachmentService.downloadFeeVoucherAttachment(
        currentUser,
        feeRecordId,
        attachmentId,
      );
      const body = Buffer.from(download.body ?? []);

      response.setHeader("Content-Type", download.mimeType ?? "application/octet-stream");
      response.setHeader("Content-Length", body.byteLength);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="${toContentDispositionFileName(download.fileName)}"`,
      );

      return new StreamableFile(body);
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }

  @Get(":attachmentId/preview")
  @RequirePermissions(PermissionCode.attachmentDownload)
  async previewFeeVoucherAttachment(
    @CurrentUser() currentUser: UserContext,
    @Param("feeRecordId", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Param("attachmentId", new ParseUUIDPipe({ version: "4" })) attachmentId: string,
    @Res({ passthrough: true }) response: HeaderResponse,
  ): Promise<StreamableFile> {
    try {
      const preview = await this.attachmentService.previewFeeVoucherAttachment(
        currentUser,
        feeRecordId,
        attachmentId,
      );
      const body = Buffer.from(preview.body ?? []);

      response.setHeader("Content-Type", preview.mimeType ?? "application/octet-stream");
      response.setHeader("Content-Length", body.byteLength);
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.setHeader(
        "Content-Disposition",
        `inline; filename="${toContentDispositionFileName(preview.fileName)}"`,
      );

      return new StreamableFile(body);
    } catch (error) {
      throw mapAttachmentServiceError(error);
    }
  }
}

const toAchievementAttachmentUploadInput = (
  dto: UploadAchievementAttachmentDto,
  file?: UploadedAttachmentFile,
) => {
  if (!file?.buffer) {
    throw new BadRequestException("Attachment file is required.");
  }

  if (file.size > attachmentMaxBytes) {
    throw new PayloadTooLargeException("Attachment file is too large.");
  }

  if (!isAllowedAttachmentFile(file.originalname, file.mimetype, file.buffer)) {
    throw new UnsupportedMediaTypeException("Attachment file type is not allowed.");
  }

  const originalName = toDisplayFileName(file.originalname);
  const fileName = toDisplayFileName(dto.displayName ?? originalName);

  return {
    fileName,
    secretLevel: dto.secretLevel,
    checksum: dto.checksum,
    objectBody: file.buffer,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    originalName,
    storedName: toSafeFileName(fileName),
  };
};

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx"]);

const isAllowedAttachmentFile = (
  originalName: string,
  mimeType: string,
  body: Buffer,
): boolean => {
  const extension = getFileExtension(originalName);

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(mimeType)) {
    return false;
  }

  if (extension === ".pdf") {
    return body.subarray(0, 4).toString("ascii") === "%PDF";
  }

  if (extension === ".png") {
    return body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  }

  if (extension === ".docx" || extension === ".xlsx") {
    return body.subarray(0, 2).toString("ascii") === "PK";
  }

  return extension === ".doc" || extension === ".xls";
};

const getFileExtension = (fileName: string): string => {
  const safeName = toDisplayFileName(fileName);
  const dotIndex = safeName.lastIndexOf(".");

  return dotIndex >= 0 ? safeName.slice(dotIndex).toLowerCase() : "";
};

const toDisplayFileName = (fileName: string): string => {
  const safeName = toSafeFileName(fileName);

  if (!safeName.includes(".")) {
    return safeName;
  }

  return safeName;
};

const toContentDispositionFileName = (fileName: string): string =>
  toSafeFileName(fileName).replace(/["\\]/g, "-");

const mapAttachmentServiceError = (error: unknown): Error => {
  if (error instanceof BadRequestException || error instanceof UnsupportedMediaTypeException) {
    return error;
  }

  if (isMulterFileSizeError(error)) {
    return new PayloadTooLargeException("Attachment file is too large.");
  }

  if (error instanceof AttachmentAccessDeniedError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof AttachmentNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof AttachmentPreviewUnsupportedMediaTypeError) {
    return new UnsupportedMediaTypeException(error.message);
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

const isMulterFileSizeError = (error: unknown): error is { code: "LIMIT_FILE_SIZE" } =>
  Boolean(error && typeof error === "object" && (error as { code?: unknown }).code === "LIMIT_FILE_SIZE");
