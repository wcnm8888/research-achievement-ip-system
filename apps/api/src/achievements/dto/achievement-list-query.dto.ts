import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from "class-validator";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../domain/achievement-domain.types";

export class AchievementListQueryDto {
  @IsOptional()
  @IsEnum(AchievementStatusCode)
  status?: AchievementStatusCode;

  @IsOptional()
  @IsEnum(AchievementTypeCode)
  type?: AchievementTypeCode;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  keyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  fields?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
