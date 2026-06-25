import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { UserStatus } from "@prisma/client";
import { RoleCode } from "../../authorization/constants/role-code";
import { ScopeType } from "../../authorization/constants/scope-type";

export class AccountUserListQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  keyword?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsEnum(RoleCode)
  roleCode?: RoleCode;

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

export class AccountUserRoleDto {
  @IsEnum(RoleCode)
  roleCode!: RoleCode;

  @IsEnum(ScopeType)
  scopeType!: ScopeType;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class CreateAccountUserDto {
  @IsEmail()
  @Length(3, 255)
  email!: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsUUID()
  departmentId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AccountUserRoleDto)
  roles!: AccountUserRoleDto[];

  @IsOptional()
  @IsString()
  @Length(12, 128)
  initialPassword?: string;
}

export class AccountManagementReasonDto {
  @ValidateIf((_dto: AccountManagementReasonDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 300)
  reason?: string | null;
}

export class AssignAccountUserRoleDto {
  @IsEnum(RoleCode)
  roleCode!: RoleCode;

  @IsEnum(ScopeType)
  scopeType!: ScopeType;

  @ValidateIf((dto: AssignAccountUserRoleDto) => dto.scopeType === ScopeType.department)
  @IsUUID()
  departmentId?: string;

  @ValidateIf((_dto: AssignAccountUserRoleDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 300)
  reason?: string | null;
}

export class ChangeAccountUserDepartmentDto {
  @IsUUID()
  departmentId!: string;

  @ValidateIf((_dto: ChangeAccountUserDepartmentDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 300)
  reason?: string | null;
}
