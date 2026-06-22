import { IsOptional, IsString, Length } from "class-validator";

export class ApproveWorkflowTaskDto {
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  comment?: string;
}

export class RejectWorkflowTaskDto {
  @IsString()
  @Length(1, 1000)
  comment!: string;
}
