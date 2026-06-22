import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, Max, Min } from "class-validator";
import { DashboardRequestOptions } from "../domain/dashboard-domain.types";
import {
  maxDashboardDueSoonDays,
  minDashboardDueSoonDays,
} from "../domain/dashboard-options";

export class DashboardSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  today?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(minDashboardDueSoonDays)
  @Max(maxDashboardDueSoonDays)
  dueSoonDays?: number;
}

export const toDashboardRequestOptions = (
  query: DashboardSummaryQueryDto,
): DashboardRequestOptions => ({
  today: query.today === undefined ? undefined : new Date(query.today),
  dueSoonDays: query.dueSoonDays,
});
