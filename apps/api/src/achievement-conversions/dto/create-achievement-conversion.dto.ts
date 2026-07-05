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

export class CreateAchievementConversionDto {
  @IsEnum(AchievementConversionTypeCode)
  conversionType!: AchievementConversionTypeCode;

  @IsString()
  @Length(1, 200)
  counterpartyName!: string;

  @ValidateIf((_dto: CreateAchievementConversionDto, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  contractAmount?: number | null;

  @ValidateIf((_dto: CreateAchievementConversionDto, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  revenueAmount?: number | null;

  @IsEnum(AchievementConversionStatusCode)
  status!: AchievementConversionStatusCode;

  @ValidateIf((_dto: CreateAchievementConversionDto, value) => value !== null && value !== undefined)
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
