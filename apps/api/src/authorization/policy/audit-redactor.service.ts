import { Injectable } from "@nestjs/common";

export type AuditLogLike = {
  id: string;
  actorUserId?: string | null;
  actorDepartmentId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  targetDepartmentId?: string | null;
  targetSecretLevel?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  traceId?: string | null;
  createdAt: Date | string;
};

export type MaskedAuditLog = {
  id: string;
  actorUserId?: string | null;
  actorDepartmentId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  targetDepartmentId?: string | null;
  targetSecretLevel?: string | null;
  traceId?: string | null;
  createdAt: Date | string;
  oldValueMasked: unknown;
  newValueMasked: unknown;
  ipAddressMasked?: string;
  userAgentMasked?: string;
};

const redactedValue = "[REDACTED]";
const redactedSensitiveValue = "[REDACTED_SENSITIVE]";
const redactedIpValue = "[REDACTED_IP]";
const redactedUserAgentValue = "[REDACTED_USER_AGENT]";

const sensitiveKeyPatterns = [
  "password",
  "passwordhash",
  "token",
  "cookie",
  "apikey",
  "api_key",
  "secret",
  "credential",
  "storagekey",
  "checksum",
  "connection",
  "databaseurl",
  "authorization",
  "configref",
];

@Injectable()
export class AuditRedactorService {
  redactAuditLog(log: AuditLogLike): MaskedAuditLog {
    return {
      id: log.id,
      actorUserId: log.actorUserId,
      actorDepartmentId: log.actorDepartmentId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      targetDepartmentId: log.targetDepartmentId,
      targetSecretLevel: log.targetSecretLevel,
      traceId: log.traceId,
      createdAt: log.createdAt,
      oldValueMasked: this.redactValue(log.oldValue),
      newValueMasked: this.redactValue(log.newValue),
      ...(log.ipAddress ? { ipAddressMasked: redactedIpValue } : {}),
      ...(log.userAgent ? { userAgentMasked: redactedUserAgentValue } : {}),
    };
  }

  redactValue(value: unknown): unknown {
    return redactUnknownValue(value, null);
  }
}

const redactUnknownValue = (value: unknown, key: string | null): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (isSensitiveKey(key)) {
    return redactedSensitiveValue;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactUnknownValue(item, key));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactUnknownValue(entryValue, entryKey),
      ]),
    );
  }

  if (isSafeScalarKey(key)) {
    return value;
  }

  return redactedValue;
};

const isSensitiveKey = (key: string | null): boolean => {
  if (!key) {
    return false;
  }

  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (normalizedKey === "secretlevel" || normalizedKey === "targetsecretlevel") {
    return false;
  }

  return sensitiveKeyPatterns.some((pattern) => normalizedKey.includes(pattern));
};

const isSafeScalarKey = (key: string | null): boolean => {
  if (!key) {
    return false;
  }

  const normalizedKey = key.toLowerCase();

  return (
    normalizedKey === "id" ||
    normalizedKey.endsWith("id") ||
    key.endsWith("At") ||
    normalizedKey.endsWith("_at") ||
    normalizedKey.endsWith("date") ||
    normalizedKey.endsWith("type") ||
    normalizedKey.endsWith("status") ||
    normalizedKey.endsWith("action") ||
    normalizedKey.endsWith("level")
  );
};
