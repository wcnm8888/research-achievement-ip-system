import { Prisma } from "@prisma/client";
import { AuditLogLike } from "../../authorization/policy/audit-redactor.service";
import { CreateAuditEventInput } from "./audit-event.types";
import { AuditFindManyInput, AuditLogRecord } from "./audit-repository.types";

export const toAuditLogCreateData = (
  input: CreateAuditEventInput,
): Prisma.AuditLogUncheckedCreateInput => ({
  actorUserId: input.actor?.userId ?? null,
  actorDepartmentId: input.actor?.departmentId ?? null,
  action: input.action,
  targetType: input.target.type,
  targetId: input.target.id ?? null,
  targetDepartmentId: input.target.departmentId ?? null,
  targetSecretLevel: input.target.secretLevel ?? null,
  oldValue: normalizeAuditJsonValue(input.oldValue),
  newValue: normalizeAuditJsonValue(input.newValue),
  traceId: input.traceId ?? null,
  ...(input.createdAt ? { createdAt: input.createdAt } : {}),
});

export const toAuditFindManyWhere = (
  input: AuditFindManyInput,
): Prisma.AuditLogWhereInput => ({
  ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
  ...(input.actorDepartmentId
    ? { actorDepartmentId: input.actorDepartmentId }
    : {}),
  ...(input.action ? { action: input.action } : {}),
  ...(input.targetType ? { targetType: input.targetType } : {}),
  ...(input.targetId ? { targetId: input.targetId } : {}),
  ...(input.targetDepartmentId
    ? { targetDepartmentId: input.targetDepartmentId }
    : {}),
  ...(input.traceId ? { traceId: input.traceId } : {}),
  ...(input.createdFrom || input.createdTo
    ? {
        createdAt: {
          ...(input.createdFrom ? { gte: input.createdFrom } : {}),
          ...(input.createdTo ? { lte: input.createdTo } : {}),
        },
      }
    : {}),
});

export const toAuditLogLike = (record: AuditLogRecord): AuditLogLike => ({
  id: record.id,
  actorUserId: record.actorUserId,
  actorDepartmentId: record.actorDepartmentId,
  action: record.action,
  targetType: record.targetType,
  targetId: record.targetId,
  targetDepartmentId: record.targetDepartmentId,
  targetSecretLevel: record.targetSecretLevel,
  oldValue: record.oldValue,
  newValue: record.newValue,
  ipAddress: record.ipAddress,
  userAgent: record.userAgent,
  traceId: record.traceId,
  createdAt: record.createdAt,
});

export const normalizeAuditJsonValue = (
  value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value;
};
