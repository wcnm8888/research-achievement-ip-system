import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { FeeTypeCode, PayStatusCode } from "../domain/fee-domain.types";

export class FeeQueryDto {
  @IsOptional()
  @IsUUID()
  achievementId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsEnum(FeeTypeCode)
  feeType?: FeeTypeCode;

  @IsOptional()
  @IsEnum(PayStatusCode)
  payStatus?: PayStatusCode;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  fields?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

