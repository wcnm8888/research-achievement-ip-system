import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from "class-validator";
import { FeeTypeCode, FundSourceCode } from "../domain/fee-domain.types";

export class UpdateFeeRecordDto {
  @IsOptional()
  @IsEnum(FeeTypeCode)
  feeType?: FeeTypeCode;

  @ValidateIf((_dto: UpdateFeeRecordDto, value) => value !== null && value !== undefined)
  @IsEnum(FundSourceCode)
  fundSource?: FundSourceCode | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ValidateIf((_dto: UpdateFeeRecordDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 120)
  voucherNo?: string | null;
}

