import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from "class-validator";
import {
  AchievementTypeCode,
  SecretLevelCode,
} from "../domain/achievement-domain.types";

export const achievementTitleMaxLength = 500;
export const shortTextMaxLength = 120;
export const mediumTextMaxLength = 255;
export const longTextMaxLength = 5000;

export class AchievementBaseDto {
  @IsEnum(AchievementTypeCode)
  type!: AchievementTypeCode;

  @IsString()
  @Length(1, achievementTitleMaxLength)
  title!: string;

  @IsOptional()
  @IsEnum(SecretLevelCode)
  secretLevel?: SecretLevelCode;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export const ValidateOptionalNonBlankString = (
  minLength: number,
  maxLength: number,
): PropertyDecorator => {
  return (target, propertyKey) => {
    ValidateIf((_object, value) => value !== null && value !== undefined)(target, propertyKey);
    IsString()(target, propertyKey);
    Length(minLength, maxLength)(target, propertyKey);
  };
};
