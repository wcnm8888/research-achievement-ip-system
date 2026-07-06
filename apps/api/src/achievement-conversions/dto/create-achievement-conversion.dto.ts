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
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import {
  AchievementConversionBenefitCategoryCode,
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
} from "../domain/achievement-conversion-domain.types";

@ValidatorConstraint({ name: "benefitDistributionItemHasValue", async: false })
class BenefitDistributionItemHasValueConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const item = args.object as AchievementConversionBenefitDistributionItemDto;

    return item.amount !== undefined || item.ratio !== undefined;
  }

  defaultMessage(): string {
    return "Each benefit distribution item requires amount or ratio.";
  }
}

export class AchievementConversionBenefitDistributionItemDto {
  @IsEnum(AchievementConversionBenefitCategoryCode)
  @Validate(BenefitDistributionItemHasValueConstraint)
  category!: AchievementConversionBenefitCategoryCode;

  @IsString()
  @Length(1, 120)
  label!: string;

  @ValidateIf((_dto: AchievementConversionBenefitDistributionItemDto, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number | null;

  @ValidateIf((_dto: AchievementConversionBenefitDistributionItemDto, value) => value !== null && value !== undefined)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  ratio?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  note?: string | null;
}

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
  @IsEnum(AchievementConversionContractStatusCode)
  contractStatus?: AchievementConversionContractStatusCode;

  @IsOptional()
  @IsEnum(AchievementConversionRevenueStatusCode)
  revenueStatus?: AchievementConversionRevenueStatusCode;

  @ValidateIf((_dto: CreateAchievementConversionDto, value) => value !== null && value !== undefined)
  @IsDateString()
  revenueDueDate?: string | null;

  @ValidateIf((_dto: CreateAchievementConversionDto, value) => value !== null && value !== undefined)
  @IsDateString()
  revenueReceivedDate?: string | null;

  @ValidateIf((_dto: CreateAchievementConversionDto, value) => value !== null && value !== undefined)
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

  @ValidateIf((_dto: CreateAchievementConversionDto, value) => value !== null && value !== undefined)
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
