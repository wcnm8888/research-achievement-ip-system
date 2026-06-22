import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { AchievementTypeCode } from "../domain/achievement-domain.types";
import { AchievementBaseDto } from "./achievement-common.dto";
import { AchievementContributorDto } from "./contributor.dto";
import { PaperDetailDto } from "./paper-detail.dto";
import { PatentDetailDto } from "./patent-detail.dto";
import { SoftwareCopyrightDetailDto } from "./software-copyright-detail.dto";

export class CreateAchievementDto extends AchievementBaseDto {
  @ValidateIf((dto: CreateAchievementDto) => dto.type === AchievementTypeCode.paper)
  @IsDefined()
  @ValidateNested()
  @Type(() => PaperDetailDto)
  paperDetail?: PaperDetailDto;

  @ValidateIf((dto: CreateAchievementDto) => dto.type === AchievementTypeCode.patent)
  @IsDefined()
  @ValidateNested()
  @Type(() => PatentDetailDto)
  patentDetail?: PatentDetailDto;

  @ValidateIf((dto: CreateAchievementDto) => dto.type === AchievementTypeCode.softwareCopyright)
  @IsDefined()
  @ValidateNested()
  @Type(() => SoftwareCopyrightDetailDto)
  softwareCopyrightDetail?: SoftwareCopyrightDetailDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AchievementContributorDto)
  contributors!: AchievementContributorDto[];
}
