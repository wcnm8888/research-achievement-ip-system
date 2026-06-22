import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from "class-validator";
import {
  ContributorRoleCode,
  ContributorTypeCode,
} from "../domain/achievement-domain.types";
import { mediumTextMaxLength, shortTextMaxLength } from "./achievement-common.dto";

export class AchievementContributorDto {
  @IsString()
  @Length(1, shortTextMaxLength)
  name!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @Length(1, mediumTextMaxLength)
  organization?: string;

  @IsEnum(ContributorTypeCode)
  contributorType!: ContributorTypeCode;

  @IsOptional()
  @IsEnum(ContributorRoleCode)
  contributorRole?: ContributorRoleCode;

  @IsInt()
  @Min(1)
  sortOrder!: number;
}
