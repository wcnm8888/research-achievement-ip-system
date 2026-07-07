import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { AuditActionCode } from "../domain/audit-action-code";
import { AuditTargetTypeCode } from "../domain/audit-target-type-code";

export class AuditMaskedQueryDto {
  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsOptional()
  @IsUUID()
  actorDepartmentId?: string;

  @IsOptional()
  @IsEnum(AuditActionCode)
  action?: AuditActionCode;

  @IsOptional()
  @IsEnum(AuditTargetTypeCode)
  targetType?: AuditTargetTypeCode;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsUUID()
  targetDepartmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  traceId?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

export class AuditExportEventQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}

export type AuditMaskedQueryInput = {
  actorUserId?: string;
  actorDepartmentId?: string;
  action?: AuditActionCode;
  targetType?: AuditTargetTypeCode;
  targetId?: string;
  targetDepartmentId?: string;
  traceId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  take?: number;
};

export type AuditExportEventQueryInput = {
  take?: number;
};

export const toAuditMaskedQueryInput = (
  query: AuditMaskedQueryDto,
): AuditMaskedQueryInput => ({
  actorUserId: query.actorUserId,
  actorDepartmentId: query.actorDepartmentId,
  action: query.action,
  targetType: query.targetType,
  targetId: query.targetId,
  targetDepartmentId: query.targetDepartmentId,
  traceId: query.traceId,
  createdFrom: query.createdFrom ? new Date(query.createdFrom) : undefined,
  createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
  take: query.take,
});
