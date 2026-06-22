import { Prisma } from "@prisma/client";
import { SecretLevelCode } from "../../authorization/constants/secret-level-code";
import { AuditActionCode } from "./audit-action-code";
import { AuditTargetTypeCode } from "./audit-target-type-code";

export type AuditActorSnapshot = {
  userId?: string | null;
  departmentId?: string | null;
};

export type AuditTargetSnapshot = {
  type: AuditTargetTypeCode;
  id?: string | null;
  departmentId?: string | null;
  secretLevel?: SecretLevelCode | null;
};

export type AuditJsonValue = Prisma.InputJsonValue | null;

export type CreateAuditEventInput = {
  actor?: AuditActorSnapshot | null;
  action: AuditActionCode;
  target: AuditTargetSnapshot;
  oldValue?: AuditJsonValue;
  newValue?: AuditJsonValue;
  traceId?: string | null;
  createdAt?: Date;
};
