import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString, Length, ValidateNested } from "class-validator";
import { SecretLevelCode } from "../domain/achievement-domain.types";
import { achievementTitleMaxLength } from "./achievement-common.dto";
import { AchievementContributorDto } from "./contributor.dto";
import { PaperDetailDto } from "./paper-detail.dto";
import { PatentDetailDto } from "./patent-detail.dto";
import { SoftwareCopyrightDetailDto } from "./software-copyright-detail.dto";

export class UpdateAchievementDto {
  @IsOptional()
  @IsString()
  @Length(1, achievementTitleMaxLength)
  title?: string;

  @IsOptional()
  @IsEnum(SecretLevelCode)
  secretLevel?: SecretLevelCode;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaperDetailDto)
  paperDetail?: PaperDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatentDetailDto)
  patentDetail?: PatentDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SoftwareCopyrightDetailDto)
  softwareCopyrightDetail?: SoftwareCopyrightDetailDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AchievementContributorDto)
  contributors?: AchievementContributorDto[];
}
