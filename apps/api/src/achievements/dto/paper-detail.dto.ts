import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";
import {
  ValidateOptionalNonBlankString,
  longTextMaxLength,
  mediumTextMaxLength,
} from "./achievement-common.dto";

export class PaperDetailDto {
  @ValidateOptionalNonBlankString(1, mediumTextMaxLength)
  doi?: string;

  @ValidateOptionalNonBlankString(1, mediumTextMaxLength)
  journal?: string;

  @ValidateOptionalNonBlankString(1, 64)
  issnCn?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  publishYear?: number;

  @ValidateOptionalNonBlankString(1, 80)
  includedType?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  impactFactor?: number;

  @ValidateOptionalNonBlankString(1, 80)
  partition?: string;

  @ValidateOptionalNonBlankString(1, longTextMaxLength)
  abstract?: string;
}
