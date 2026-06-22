import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { WorkflowTaskStatusCode } from "../domain/workflow-domain.types";

export class WorkflowTaskQueryDto {
  @IsOptional()
  @IsEnum(WorkflowTaskStatusCode)
  status?: WorkflowTaskStatusCode;

  @IsOptional()
  @IsUUID("4")
  achievementId?: string;
}
