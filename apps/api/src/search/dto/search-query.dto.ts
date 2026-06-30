import { Transform, Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../../achievements/domain/achievement-domain.types";
import { FeeTypeCode, PayStatusCode } from "../../fees/domain/fee-domain.types";
import { SearchTargetTypeCode } from "../domain/search-domain.types";

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalArray(value))
  @IsArray()
  @ArrayUnique()
  @IsEnum(SearchTargetTypeCode, { each: true })
  targetTypes?: SearchTargetTypeCode[];

  @IsOptional()
  @IsEnum(AchievementTypeCode)
  achievementType?: AchievementTypeCode;

  @IsOptional()
  @IsEnum(AchievementStatusCode)
  achievementStatus?: AchievementStatusCode;

  @IsOptional()
  @IsEnum(FeeTypeCode)
  feeType?: FeeTypeCode;

  @IsOptional()
  @IsEnum(PayStatusCode)
  payStatus?: PayStatusCode;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;
}

const toOptionalArray = (value: unknown): unknown[] | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    const filtered = value.filter((item) => item !== undefined && item !== null && item !== "");
    return filtered.length ? filtered : undefined;
  }

  return [value];
};
