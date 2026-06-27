import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { RoleCode } from "../../authorization/constants/role-code";
import { ScopeType } from "../../authorization/constants/scope-type";

export class PasswordResetRequestDto {
  @IsEmail()
  @Length(3, 255)
  email!: string;
}

export class PasswordResetConfirmDto {
  @IsString()
  @Length(20, 512)
  token!: string;

  @IsString()
  @Length(12, 128)
  newPassword!: string;
}

export class InviteAcceptDto {
  @IsString()
  @Length(20, 512)
  token!: string;

  @IsString()
  @Length(12, 128)
  password!: string;
}

export class AccountLifecycleRoleDto {
  @IsEnum(RoleCode)
  roleCode!: RoleCode;

  @IsEnum(ScopeType)
  scopeType!: ScopeType;

  @ValidateIf((dto: AccountLifecycleRoleDto) => dto.scopeType === ScopeType.department)
  @IsUUID()
  departmentId?: string;
}

export class CreateInviteDto {
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
  @Type(() => AccountLifecycleRoleDto)
  roles!: AccountLifecycleRoleDto[];

  @ValidateIf((_dto: CreateInviteDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 300)
  reason?: string | null;
}

export class AccountLifecycleReasonDto {
  @IsOptional()
  @IsString()
  @Length(1, 300)
  reason?: string;
}
