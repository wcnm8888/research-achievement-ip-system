import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

