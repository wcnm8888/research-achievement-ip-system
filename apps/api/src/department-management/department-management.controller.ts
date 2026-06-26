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
import {
  DepartmentManagementAccessDeniedError,
  DepartmentManagementConflictError,
  DepartmentManagementNotFoundError,
  DepartmentManagementPermissionDeniedError,
} from "./department-management.errors";
import { DepartmentManagementService } from "./department-management.service";
import {
  CreateDepartmentDto,
  DepartmentManagementReasonDto,
  ListDepartmentsQueryDto,
  UpdateDepartmentDto,
} from "./dto/department-management.dto";

const departmentManagementValidationOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
};

const departmentManagementValidationPipe = new ValidationPipe(
  departmentManagementValidationOptions,
);
const listDepartmentsQueryValidationPipe = new ValidationPipe({
  ...departmentManagementValidationOptions,
  expectedType: ListDepartmentsQueryDto,
});
const createDepartmentValidationPipe = new ValidationPipe({
  ...departmentManagementValidationOptions,
  expectedType: CreateDepartmentDto,
});
const updateDepartmentValidationPipe = new ValidationPipe({
  ...departmentManagementValidationOptions,
  expectedType: UpdateDepartmentDto,
});
const departmentManagementReasonValidationPipe = new ValidationPipe({
  ...departmentManagementValidationOptions,
  expectedType: DepartmentManagementReasonDto,
});

@Controller("departments")
@UseGuards(UserContextGuard, PermissionGuard)
@UsePipes(departmentManagementValidationPipe)
export class DepartmentManagementController {
  constructor(
    @Inject(DepartmentManagementService)
    private readonly departmentManagementService: DepartmentManagementService,
  ) {}

  @Get()
  @RequirePermissions(PermissionCode.systemConfig)
  async listDepartments(
    @CurrentUser() currentUser: UserContext,
    @Query(listDepartmentsQueryValidationPipe) query: ListDepartmentsQueryDto = {},
  ) {
    try {
      return await this.departmentManagementService.listDepartments(
        currentUser,
        query,
      );
    } catch (error) {
      throw mapDepartmentManagementError(error);
    }
  }

  @Get("tree")
  @RequirePermissions(PermissionCode.systemConfig)
  async listDepartmentTree(
    @CurrentUser() currentUser: UserContext,
    @Query(listDepartmentsQueryValidationPipe) query: ListDepartmentsQueryDto = {},
  ) {
    try {
      return await this.departmentManagementService.listDepartmentTree(
        currentUser,
        query,
      );
    } catch (error) {
      throw mapDepartmentManagementError(error);
    }
  }

  @Get(":id")
  @RequirePermissions(PermissionCode.systemConfig)
  async getDepartment(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) departmentId: string,
  ) {
    try {
      return await this.departmentManagementService.getDepartment(
        currentUser,
        departmentId,
      );
    } catch (error) {
      throw mapDepartmentManagementError(error);
    }
  }

  @Post()
  @RequirePermissions(PermissionCode.systemConfig)
  async createDepartment(
    @CurrentUser() currentUser: UserContext,
    @Body(createDepartmentValidationPipe) dto: CreateDepartmentDto,
  ) {
    try {
      return await this.departmentManagementService.createDepartment(
        currentUser,
        dto,
      );
    } catch (error) {
      throw mapDepartmentManagementError(error);
    }
  }

  @Patch(":id")
  @RequirePermissions(PermissionCode.systemConfig)
  async updateDepartment(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) departmentId: string,
    @Body(updateDepartmentValidationPipe) dto: UpdateDepartmentDto,
  ) {
    try {
      return await this.departmentManagementService.updateDepartment(
        currentUser,
        departmentId,
        dto,
      );
    } catch (error) {
      throw mapDepartmentManagementError(error);
    }
  }

  @Post(":id/disable")
  @RequirePermissions(PermissionCode.systemConfig)
  async disableDepartment(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) departmentId: string,
    @Body(departmentManagementReasonValidationPipe) dto: DepartmentManagementReasonDto = {},
  ) {
    try {
      return await this.departmentManagementService.disableDepartment(
        currentUser,
        departmentId,
        dto,
      );
    } catch (error) {
      throw mapDepartmentManagementError(error);
    }
  }

  @Post(":id/enable")
  @RequirePermissions(PermissionCode.systemConfig)
  async enableDepartment(
    @CurrentUser() currentUser: UserContext,
    @Param("id", new ParseUUIDPipe({ version: "4" })) departmentId: string,
    @Body(departmentManagementReasonValidationPipe) dto: DepartmentManagementReasonDto = {},
  ) {
    try {
      return await this.departmentManagementService.enableDepartment(
        currentUser,
        departmentId,
        dto,
      );
    } catch (error) {
      throw mapDepartmentManagementError(error);
    }
  }
}

const mapDepartmentManagementError = (error: unknown): Error => {
  if (error instanceof DepartmentManagementAccessDeniedError) {
    return new UnauthorizedException(error.message);
  }

  if (error instanceof DepartmentManagementPermissionDeniedError) {
    return new ForbiddenException(error.message);
  }

  if (error instanceof DepartmentManagementNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof DepartmentManagementConflictError) {
    return new ConflictException(error.message);
  }

  return error instanceof Error
    ? error
    : new BadRequestException("Unknown department management controller error.");
};
