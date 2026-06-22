import { IsDateString, IsEnum, IsNumber, IsOptional, Min } from "class-validator";
import {
  PatentLegalStatusCode,
  PatentTypeCode,
} from "../domain/achievement-domain.types";
import { ValidateOptionalNonBlankString } from "./achievement-common.dto";

export class PatentDetailDto {
  @ValidateOptionalNonBlankString(1, 120)
  applicationNo?: string;

  @ValidateOptionalNonBlankString(1, 120)
  grantNo?: string;

  @IsOptional()
  @IsEnum(PatentTypeCode)
  patentType?: PatentTypeCode;

  @IsOptional()
  @IsDateString()
  filingDate?: string;

  @IsOptional()
  @IsDateString()
  grantDate?: string;

  @IsOptional()
  @IsDateString()
  nextFeeDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  feeAmount?: number;

  @IsOptional()
  @IsEnum(PatentLegalStatusCode)
  legalStatus?: PatentLegalStatusCode;
}
