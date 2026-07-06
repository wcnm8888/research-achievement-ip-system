import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";
import { AchievementTypeCode } from "../../achievements/domain/achievement-domain.types";
import {
  CustomReportGroupBy,
  CustomReportRunOptions,
} from "../domain/custom-report-domain.types";

export const minCustomReportDueSoonDays = 1;
export const maxCustomReportDueSoonDays = 90;

export class CustomReportRunQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID("4")
  departmentId?: string;

  @IsOptional()
  @IsIn(Object.values(AchievementTypeCode))
  achievementType?: AchievementTypeCode;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(["year", "month"])
  groupBy?: CustomReportGroupBy;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(minCustomReportDueSoonDays)
  @Max(maxCustomReportDueSoonDays)
  dueSoonDays?: number;
}

export const toCustomReportRunOptions = (
  query: CustomReportRunQueryDto,
): CustomReportRunOptions => ({
  dateFrom: query.dateFrom === undefined ? undefined : new Date(query.dateFrom),
  dateTo: query.dateTo === undefined ? undefined : new Date(query.dateTo),
  departmentId: query.departmentId,
  achievementType: query.achievementType,
  status: query.status,
  groupBy: query.groupBy,
  dueSoonDays: query.dueSoonDays,
});
