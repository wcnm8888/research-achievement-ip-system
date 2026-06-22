import { Prisma } from "@prisma/client";
import { SecretLevelCode } from "../../authorization/constants/secret-level-code";
import { AuditActionCode } from "./audit-action-code";
import { AuditTargetTypeCode } from "./audit-target-type-code";

export type AuditLogRecord = {
  id: string;
  actorUserId: string | null;
  actorDepartmentId: string | null;
  action: AuditActionCode;
  targetType: AuditTargetTypeCode;
  targetId: string | null;
  targetDepartmentId: string | null;
  targetSecretLevel: SecretLevelCode | null;
  oldValue: Prisma.JsonValue | null;
  newValue: Prisma.JsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  traceId: string | null;
  createdAt: Date;
};

export type AuditFindManyInput = {
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
