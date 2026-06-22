import { IsString, Length } from "class-validator";

export class VoidAchievementDto {
  @IsString()
  @Length(1, 1000)
  reason!: string;
}
