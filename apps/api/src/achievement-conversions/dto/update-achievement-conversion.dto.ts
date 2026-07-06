import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
} from "../domain/achievement-conversion-domain.types";
import { AchievementConversionBenefitDistributionItemDto } from "./create-achievement-conversion.dto";

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
  @IsEnum(AchievementConversionContractStatusCode)
  contractStatus?: AchievementConversionContractStatusCode;

  @IsOptional()
  @IsEnum(AchievementConversionRevenueStatusCode)
  revenueStatus?: AchievementConversionRevenueStatusCode;

  @ValidateIf((_dto: UpdateAchievementConversionDto, value) => value !== null && value !== undefined)
  @IsDateString()
  revenueDueDate?: string | null;

  @ValidateIf((_dto: UpdateAchievementConversionDto, value) => value !== null && value !== undefined)
  @IsDateString()
  revenueReceivedDate?: string | null;

  @ValidateIf((_dto: UpdateAchievementConversionDto, value) => value !== null && value !== undefined)
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AchievementConversionBenefitDistributionItemDto)
  benefitDistributionJson?: AchievementConversionBenefitDistributionItemDto[] | null;

  @IsOptional()
  @IsEnum(AchievementConversionEvaluationEffectCode)
  evaluationEffect?: AchievementConversionEvaluationEffectCode;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  evaluationSummary?: string | null;

  @ValidateIf((_dto: UpdateAchievementConversionDto, value) => value !== null && value !== undefined)
  @IsDateString()
  evaluationDate?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  benefitDistributionSummary?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  remarks?: string | null;
}
