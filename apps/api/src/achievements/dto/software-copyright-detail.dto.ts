import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { SoftwareTypeCode } from "../domain/achievement-domain.types";
import {
  ValidateOptionalNonBlankString,
  mediumTextMaxLength,
} from "./achievement-common.dto";

export class SoftwareCopyrightDetailDto {
  @ValidateOptionalNonBlankString(1, 120)
  registrationNo?: string;

  @ValidateOptionalNonBlankString(1, 80)
  softwareVersion?: string;

  @IsOptional()
  @IsEnum(SoftwareTypeCode)
  softwareType?: SoftwareTypeCode;

  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @IsOptional()
  @IsDateString()
  registerDate?: string;

  @ValidateOptionalNonBlankString(1, mediumTextMaxLength)
  runEnv?: string;
}
