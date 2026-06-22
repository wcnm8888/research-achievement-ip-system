import { IsDateString, IsOptional, IsString, Length, ValidateIf } from "class-validator";

export class MarkFeePaidDto {
  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @ValidateIf((_dto: MarkFeePaidDto, value) => value !== null && value !== undefined)
  @IsString()
  @Length(1, 120)
  voucherNo?: string | null;
}

