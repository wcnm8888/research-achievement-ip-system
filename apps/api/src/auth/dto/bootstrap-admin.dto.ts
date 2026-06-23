import { IsEmail, IsString, IsUUID, MinLength } from "class-validator";

export class BootstrapAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsUUID("4")
  departmentId!: string;
}
