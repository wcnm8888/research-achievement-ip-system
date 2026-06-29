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
  Post,
  Query,
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
import { ChangeFeeStatusDto } from "./dto/change-fee-status.dto";
import { CreateFeeRecordDto } from "./dto/create-fee-record.dto";
import { FeeQueryDto } from "./dto/fee-query.dto";
import { FeeWarningQueryDto } from "./dto/fee-warning-query.dto";
import { MarkFeePaidDto } from "./dto/mark-fee-paid.dto";
import { FeeService } from "./fee.service";
import {
  FeeAccessDeniedError,
  FeeConflictError,
  FeeInvalidTransitionError,
  FeeNotFoundError,
  FeePermissionDeniedError,
} from "./domain/fee-service.errors";

const feeValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const feeValidationPipe = new ValidationPipe(feeValidationOptions);
const feeQueryValidationPipe = new ValidationPipe({
  ...feeValidationOptions,
  expectedType: FeeQueryDto,
});
const feeWarningQueryValidationPipe = new ValidationPipe({
  ...feeValidationOptions,
  expectedType: FeeWarningQueryDto,
});
const createFeeValidationPipe = new ValidationPipe({
  ...feeValidationOptions,
  expectedType: CreateFeeRecordDto,
});
const markFeePaidValidationPipe = new ValidationPipe({
  ...feeValidationOptions,
  expectedType: MarkFeePaidDto,
});
const changeFeeStatusValidationPipe = new ValidationPipe({
  ...feeValidationOptions,
  expectedType: ChangeFeeStatusDto,
});

@Controller("fees")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(feeValidationPipe)
export class FeeController {
  constructor(
    @Inject(FeeService)
    private readonly feeService: FeeService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.feeReadDepartment)
  async listFees(
    @CurrentUser() currentUser: UserContext,
    @Query(feeQueryValidationPipe) query: FeeQueryDto = {},
  ) {
    try {
      return await this.feeService.listFees(currentUser, query);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }

  @Get("warnings")
  @RequirePermissions(PermissionCode.feeReadDepartment)
  async getFeeWarnings(
    @CurrentUser() currentUser: UserContext,
    @Query(feeWarningQueryValidationPipe) query: FeeWarningQueryDto = {},
  ) {
    try {
      return await this.feeService.getFeeWarnings(currentUser, query);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }

  @Get(":id")
  @RequirePermissions(PermissionCode.feeReadDepartment)
  async getFee(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
  ) {
    try {
      return await this.feeService.getFee(currentUser, feeRecordId);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }

  @Post()
  @RequirePermissions(PermissionCode.feeManageDepartment)
  async createFee(
    @CurrentUser() currentUser: UserContext,
    @Body(createFeeValidationPipe) dto: CreateFeeRecordDto,
  ) {
    try {
      return await this.feeService.createFee(currentUser, dto);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }

  @Post(":id/mark-paid")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.feeManageDepartment)
  async markFeePaid(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Body(markFeePaidValidationPipe) dto: MarkFeePaidDto = {},
  ) {
    try {
      return await this.feeService.markFeePaid(currentUser, feeRecordId, dto);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }

  @Post(":id/waive")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.feeManageDepartment)
  async waiveFee(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Body(changeFeeStatusValidationPipe) dto: ChangeFeeStatusDto,
  ) {
    try {
      return await this.feeService.waiveFee(currentUser, feeRecordId, dto);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }

  @Post(":id/cancel")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.feeManageDepartment)
  async cancelFee(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Body(changeFeeStatusValidationPipe) dto: ChangeFeeStatusDto,
  ) {
    try {
      return await this.feeService.cancelFee(currentUser, feeRecordId, dto);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }

  @Post(":id/archive")
  @HttpCode(200)
  @RequirePermissions(PermissionCode.feeManageDepartment)
  async archiveFee(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) feeRecordId: string,
    @Body(changeFeeStatusValidationPipe) dto: ChangeFeeStatusDto,
  ) {
    try {
      return await this.feeService.archiveFee(currentUser, feeRecordId, dto);
    } catch (error) {
      throw mapFeeServiceError(error);
    }
  }
}

const mapFeeServiceError = (error: unknown): Error => {
  if (
    error instanceof FeeAccessDeniedError ||
    error instanceof FeePermissionDeniedError
  ) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof FeeNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof FeeConflictError ||
    error instanceof FeeInvalidTransitionError
  ) {
    return new ConflictException(error.message);
  }

  return error instanceof Error ? error : new Error("Unknown fee service error.");
};
