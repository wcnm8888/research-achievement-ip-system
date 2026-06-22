import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Length,
  Min,
  ValidateIf,
  IsString,
} from "class-validator";
import { FeeTypeCode, FundSourceCode } from "../domain/fee-domain.types";

export class CreateFeeRecordDto {
  @IsUUID()
  achievementId!: string;

  @IsEnum(FeeTypeCode)
  feeType!: FeeTypeCode;

  @IsOptional()
  @IsEnum(FundSourceCode)
  fundSource?: FundSourceCode;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsDateString()
  dueDate!: string;

  @ValidateIf((_dto: CreateFeeRecordDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 120)
  voucherNo?: string | null;
}

