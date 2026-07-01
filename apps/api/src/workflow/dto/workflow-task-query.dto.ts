import { IsEnum, IsOptional, IsUUID } from "class-validator";
import {
  WorkflowTargetTypeCode,
  WorkflowTaskStatusCode,
} from "../domain/workflow-domain.types";

export class WorkflowTaskQueryDto {
  @IsOptional()
  @IsEnum(WorkflowTaskStatusCode)
  status?: WorkflowTaskStatusCode;

  @IsOptional()
  @IsEnum(WorkflowTargetTypeCode)
  targetType?: WorkflowTargetTypeCode;

  @IsOptional()
  @IsUUID("4")
  achievementId?: string;

  @IsOptional()
  @IsUUID("4")
  feeRecordId?: string;
}
