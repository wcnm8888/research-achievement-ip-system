import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { DepartmentStatus } from "@prisma/client";

const departmentCodePattern = /^[A-Z0-9_]+$/;

export class ListDepartmentsQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  keyword?: string;

  @IsOptional()
  @IsEnum(DepartmentStatus)
  status?: DepartmentStatus;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;

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

export class CreateDepartmentDto {
  @IsString()
  @Length(1, 64)
  @Matches(departmentCodePattern)
  code!: string;

  @IsString()
  @Length(1, 200)
  name!: string;

  @ValidateIf((_dto: CreateDepartmentDto, value) => value !== null && value !== undefined)
  @IsUUID()
  parentId?: string | null;
}

@ValidatorConstraint({ name: "departmentUpdateHasField", async: false })
class DepartmentUpdateHasFieldConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as UpdateDepartmentDto;
    return dto.code !== undefined || dto.name !== undefined || dto.parentId !== undefined;
  }

  defaultMessage(): string {
    return "At least one department update field is required.";
  }
}

export class UpdateDepartmentDto {
  @Validate(DepartmentUpdateHasFieldConstraint)
  private readonly updateFieldMarker?: never;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  @Matches(departmentCodePattern)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @ValidateIf((_dto: UpdateDepartmentDto, value) => value !== null && value !== undefined)
  @IsUUID()
  parentId?: string | null;
}

export class DepartmentManagementReasonDto {
  @ValidateIf((_dto: DepartmentManagementReasonDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 300)
  reason?: string | null;
}

export type DepartmentResponseDto = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  status: DepartmentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  archivedAt: Date | string | null;
};

export type DepartmentTreeResponseDto = DepartmentResponseDto & {
  children: DepartmentTreeResponseDto[];
};
