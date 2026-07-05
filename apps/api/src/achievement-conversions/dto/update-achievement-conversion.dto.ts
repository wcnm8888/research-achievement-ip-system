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
import {
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
} from "../domain/achievement-conversion-domain.types";

export class UpdateAchievementConversionDto {
  @IsOptional()
  @IsEnum(AchievementConversionTypeCode)
  conversionType?: AchievementConversionTypeCode;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  counterpartyName?: string;

  @ValidateIf((_dto: UpdateAchievementConversionDto, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contractAmount?: number | null;

  @ValidateIf((_dto: UpdateAchievementConversionDto, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  revenueAmount?: number | null;

  @IsOptional()
  @IsEnum(AchievementConversionStatusCode)
  status?: AchievementConversionStatusCode;

  @ValidateIf((_dto: UpdateAchievementConversionDto, value) => value !== null && value !== undefined)
  @IsDateString()
  conversionDate?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  benefitDistributionSummary?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  remarks?: string | null;
}
