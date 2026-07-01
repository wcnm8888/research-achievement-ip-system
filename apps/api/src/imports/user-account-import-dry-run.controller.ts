import {
  BadRequestException,
  Controller,
  Inject,
  PayloadTooLargeException,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PermissionCode } from "../authorization/constants/permission-code";
import { CurrentUser } from "../authorization/decorators/current-user.decorator";
import { RequirePermissions } from "../authorization/decorators/require-permissions.decorator";
import { PermissionGuard } from "../authorization/guards/permission.guard";
import { UserContextGuard } from "../authorization/guards/user-context.guard";
import { UserContext } from "../identity/user-context";
import {
  InvalidUserAccountImportCsvError,
  UserAccountImportDryRunFile,
  UserAccountImportDryRunService,
} from "./user-account-import-dry-run.service";
import { importDryRunMaxFileBytes } from "./import-dry-run.shared";

const importFileMaxBytes = importDryRunMaxFileBytes;
const allowedMimeTypes = new Set(["text/csv", "application/vnd.ms-excel"]);

type UploadedImportFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
};

@Controller("users/import")
@UseGuards(UserContextGuard, PermissionGuard)
export class UserAccountImportDryRunController {
  constructor(
    @Inject(UserAccountImportDryRunService)
    private readonly userAccountImportDryRunService: UserAccountImportDryRunService,
  ) {}

  @Post("dry-run")
  @RequirePermissions(PermissionCode.systemConfig)
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: importFileMaxBytes },
    }),
  )
  async dryRunUserAccountImport(
    @CurrentUser() currentUser: UserContext,
    @UploadedFile() file?: UploadedImportFile,
  ) {
    try {
      return await this.userAccountImportDryRunService.dryRunUserAccountCsv(
        currentUser,
        toUserAccountImportDryRunFile(file),
      );
    } catch (error) {
      throw mapUserAccountImportDryRunError(error);
    }
  }
}

const toUserAccountImportDryRunFile = (
  file?: UploadedImportFile,
): UserAccountImportDryRunFile => {
  if (!file?.buffer) {
    throw new BadRequestException("Import CSV file is required.");
  }

  if (file.size > importFileMaxBytes) {
    throw new PayloadTooLargeException("Import CSV file is too large.");
  }

  if (!isAllowedCsvFile(file.originalname, file.mimetype, file.buffer)) {
    throw new UnsupportedMediaTypeException("Only CSV files are supported.");
  }

  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  };
};

const isAllowedCsvFile = (
  originalName: string,
  mimeType: string,
  body: Buffer,
): boolean => {
  const lowerName = originalName.toLowerCase();
  if (!lowerName.endsWith(".csv") || !allowedMimeTypes.has(mimeType)) {
    return false;
  }

  return body.subarray(0, 2).toString("ascii") !== "PK";
};

const mapUserAccountImportDryRunError = (error: unknown): Error => {
  if (
    error instanceof BadRequestException ||
    error instanceof PayloadTooLargeException ||
    error instanceof UnsupportedMediaTypeException
  ) {
    return error;
  }

  if (isMulterFileSizeError(error)) {
    return new PayloadTooLargeException("Import CSV file is too large.");
  }

  if (error instanceof InvalidUserAccountImportCsvError) {
    return new BadRequestException(error.message);
  }

  return error instanceof Error
    ? error
    : new Error("Unknown user account import dry-run controller error.");
};

const isMulterFileSizeError = (
  error: unknown,
): error is { code: "LIMIT_FILE_SIZE" } =>
  Boolean(error && typeof error === "object" && (error as { code?: unknown }).code === "LIMIT_FILE_SIZE");
