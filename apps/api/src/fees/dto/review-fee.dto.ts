import { Transform } from "class-transformer";
import { IsString, Length, ValidateIf } from "class-validator";

export class ApproveFeeReviewDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @ValidateIf((_dto: ApproveFeeReviewDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 500)
  reason?: string | null;
}

export class RejectFeeReviewDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, 500)
  reason!: string;
}
