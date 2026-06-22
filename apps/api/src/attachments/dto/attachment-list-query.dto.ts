import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { AttachmentStatusCode } from "../domain/attachment-status-code";

export class AttachmentListQueryDto {
  @IsOptional()
  @IsEnum(AttachmentStatusCode)
  status?: AttachmentStatusCode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
