import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { SecretLevelCode } from "../../authorization/constants/secret-level-code";

export class UploadAchievementAttachmentDto {
  @IsOptional()
  @IsEnum(SecretLevelCode)
  secretLevel?: SecretLevelCode;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  checksum?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  displayName?: string;
}
