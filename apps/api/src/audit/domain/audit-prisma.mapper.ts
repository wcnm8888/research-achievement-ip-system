import { AuditActionType, Prisma } from "@prisma/client";
import { AuditLogLike } from "../../authorization/policy/audit-redactor.service";
import { AuditActionCode } from "./audit-action-code";
import { CreateAuditEventInput } from "./audit-event.types";
import { AuditFindManyInput, AuditLogRecord } from "./audit-repository.types";

export const toAuditLogCreateData = (
  input: CreateAuditEventInput,
): Prisma.AuditLogUncheckedCreateInput => ({
  actorUserId: input.actor?.userId ?? null,
  actorDepartmentId: input.actor?.departmentId ?? null,
  action: toPersistedAuditAction(input.action),
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
  ...(input.action ? { action: toPersistedAuditAction(input.action) } : {}),
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

const persistedAuditActionByDomainAction = {
  [AuditActionCode.create]: AuditActionType.CREATE,
  [AuditActionCode.update]: AuditActionType.UPDATE,
  [AuditActionCode.submit]: AuditActionType.SUBMIT,
  [AuditActionCode.approve]: AuditActionType.APPROVE,
  [AuditActionCode.reject]: AuditActionType.REJECT,
  [AuditActionCode.archive]: AuditActionType.ARCHIVE,
  [AuditActionCode.void]: AuditActionType.VOID,
  [AuditActionCode.uploadAttachment]: AuditActionType.UPLOAD_ATTACHMENT,
  [AuditActionCode.downloadAttachment]: AuditActionType.DOWNLOAD_ATTACHMENT,
  [AuditActionCode.markFeePaid]: AuditActionType.MARK_FEE_PAID,
  [AuditActionCode.waiveFee]: AuditActionType.UPDATE,
  [AuditActionCode.cancelFee]: AuditActionType.UPDATE,
  [AuditActionCode.confirmReminder]: AuditActionType.CONFIRM_REMINDER,
  [AuditActionCode.configUpdate]: AuditActionType.CONFIG_UPDATE,
  [AuditActionCode.bootstrapAdmin]: AuditActionType.BOOTSTRAP_ADMIN,
  [AuditActionCode.login]: AuditActionType.LOGIN,
  [AuditActionCode.loginFailed]: AuditActionType.LOGIN_FAILED,
  [AuditActionCode.logout]: AuditActionType.LOGOUT,
  [AuditActionCode.sessionRevoked]: AuditActionType.SESSION_REVOKED,
  [AuditActionCode.authMeDenied]: AuditActionType.AUTH_ME_DENIED,
  [AuditActionCode.inviteCreated]: AuditActionType.INVITE_CREATED,
  [AuditActionCode.inviteResent]: AuditActionType.INVITE_RESENT,
  [AuditActionCode.inviteAccepted]: AuditActionType.INVITE_ACCEPTED,
  [AuditActionCode.inviteRevoked]: AuditActionType.INVITE_REVOKED,
  [AuditActionCode.passwordResetRequestedSelf]: AuditActionType.PASSWORD_RESET_REQUESTED_SELF,
  [AuditActionCode.passwordResetRequestedAdmin]: AuditActionType.PASSWORD_RESET_REQUESTED_ADMIN,
  [AuditActionCode.passwordResetConfirmed]: AuditActionType.PASSWORD_RESET_CONFIRMED,
  [AuditActionCode.passwordResetRevoked]: AuditActionType.PASSWORD_RESET_REVOKED,
  [AuditActionCode.passwordResetFailed]: AuditActionType.PASSWORD_RESET_FAILED,
  [AuditActionCode.credentialChanged]: AuditActionType.CREDENTIAL_CHANGED,
} satisfies Record<AuditActionCode, AuditActionType>;

const toPersistedAuditAction = (action: AuditActionCode): AuditActionType =>
  persistedAuditActionByDomainAction[action];
