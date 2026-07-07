import { Inject, Injectable } from "@nestjs/common";
import { MaskedAuditLog } from "../authorization/policy/audit-redactor.service";
import { AuditReadPolicyService } from "../authorization/policy/audit-read-policy.service";
import { AuditRedactorService } from "../authorization/policy/audit-redactor.service";
import { createCsv } from "../export/csv";
import { UserContext } from "../identity/user-context";
import { AuditRepository, AuditTransactionClient } from "./audit.repository";
import { AuditAccessDeniedError } from "./domain/audit-errors";
import { AuditActionCode } from "./domain/audit-action-code";
import { AuditJsonValue, CreateAuditEventInput } from "./domain/audit-event.types";
import { toAuditLogLike } from "./domain/audit-prisma.mapper";
import { AuditLogRecord } from "./domain/audit-repository.types";
import { AuditTargetTypeCode } from "./domain/audit-target-type-code";
import { AuditExportEventQueryInput, AuditMaskedQueryInput } from "./dto/audit-query.dto";

export type MaskedAuditListResult = {
  items: MaskedAuditLog[];
};

export type AuditExportEventSummary = {
  id: string;
  actorUserId: string | null;
  actorDepartmentId: string | null;
  operation: string;
  exportType: string | null;
  templateId: string | null;
  rowCount: number | null;
  rowLimit: number | null;
  createdAt: Date | string;
};

export type AuditExportEventListResult = {
  items: AuditExportEventSummary[];
};

const auditSummaryScalarKeys = new Set([
  "version",
  "fileName",
  "stepCode",
  "currentStep",
  "emailMasked",
  "roleCodes",
  "credentialMode",
  "operation",
  "reason",
  "reasonProvided",
  "roleCode",
  "rowCount",
  "rowLimit",
  "revokedSessionCount",
  "scopeMigration",
]);
const exportRowLimit = 1000;

@Injectable()
export class AuditService {
  constructor(
    @Inject(AuditRepository)
    private readonly auditRepository: AuditRepository,
    @Inject(AuditReadPolicyService)
    private readonly auditReadPolicy: AuditReadPolicyService,
    @Inject(AuditRedactorService)
    private readonly auditRedactor: AuditRedactorService,
  ) {}

  recordEvent(input: CreateAuditEventInput): Promise<AuditLogRecord> {
    return this.auditRepository.create(this.sanitizeEventInput(input));
  }

  recordEventInTransaction(
    client: AuditTransactionClient,
    input: CreateAuditEventInput,
  ): Promise<AuditLogRecord> {
    return this.auditRepository.createInTransaction(
      client,
      this.sanitizeEventInput(input),
    );
  }

  async listMasked(
    context: UserContext | null | undefined,
    query: AuditMaskedQueryInput = {},
  ): Promise<MaskedAuditListResult> {
    const decision = this.auditReadPolicy.canReadMaskedAudit(context);
    if (decision.effect !== "ALLOW") {
      throw new AuditAccessDeniedError(decision.reason);
    }

    const records = await this.auditRepository.findMany(query);

    return {
      items: records.map((record) =>
        this.auditRedactor.redactAuditLog(toAuditLogLike(record)),
      ),
    };
  }

  async exportMaskedCsv(
    context: UserContext | null | undefined,
    query: AuditMaskedQueryInput = {},
  ): Promise<string> {
    const result = await this.listMasked(context, {
      ...query,
      take: exportRowLimit,
    });
    const rows = result.items.slice(0, exportRowLimit);
    const csv = createCsv(
      [
        { key: "id", header: "ID" },
        { key: "actorUserId", header: "Actor user ID" },
        { key: "actorDepartmentId", header: "Actor department ID" },
        { key: "action", header: "Action" },
        { key: "targetType", header: "Target type" },
        { key: "targetId", header: "Target ID" },
        { key: "targetDepartmentId", header: "Target department ID" },
        { key: "targetSecretLevel", header: "Target secret level" },
        { key: "traceId", header: "Trace ID" },
        { key: "createdAt", header: "Created at", value: (row) => toExportDate(row.createdAt) },
        {
          key: "hasOldValue",
          header: "Has old value",
          value: (row) => hasMaskedValue(row.oldValueMasked),
        },
        {
          key: "hasNewValue",
          header: "Has new value",
          value: (row) => hasMaskedValue(row.newValueMasked),
        },
        { key: "ipAddressMasked", header: "IP masked" },
        { key: "userAgentMasked", header: "User agent masked" },
      ],
      rows,
    );

    if (context) {
      await this.recordEvent({
        actor: {
          userId: context.userId,
          departmentId: context.departmentId,
        },
        action: AuditActionCode.configUpdate,
        target: {
          type: AuditTargetTypeCode.auditLog,
        },
        oldValue: null,
        newValue: {
          operation: "EXPORT_CSV",
          exportType: "AUDIT_LOG_MASKED",
          rowCount: rows.length,
          rowLimit: exportRowLimit,
        },
      });
    }

    return csv;
  }

  async listExportEvents(
    context: UserContext | null | undefined,
    query: AuditExportEventQueryInput = {},
  ): Promise<AuditExportEventListResult> {
    const decision = this.auditReadPolicy.canReadMaskedAudit(context);
    if (decision.effect !== "ALLOW") {
      throw new AuditAccessDeniedError(decision.reason);
    }

    const records = await this.auditRepository.findMany({
      action: AuditActionCode.configUpdate,
      take: query.take ?? 50,
    });

    return {
      items: records
        .map(toExportEventSummary)
        .filter((item): item is AuditExportEventSummary => item !== null),
    };
  }

  private sanitizeEventInput(input: CreateAuditEventInput): CreateAuditEventInput {
    return {
      ...input,
      oldValue: this.sanitizeAuditValue(input.oldValue),
      newValue: this.sanitizeAuditValue(input.newValue),
    };
  }

  private sanitizeAuditValue(value: AuditJsonValue | undefined): AuditJsonValue {
    const redactedValue = this.auditRedactor.redactValue(value);
    return restoreStableAuditSummaryScalars(value, redactedValue) as AuditJsonValue;
  }
}

const restoreStableAuditSummaryScalars = (
  source: unknown,
  redacted: unknown,
  key: string | null = null,
): unknown => {
  if (source === null || source === undefined) {
    return redacted;
  }

  if (Array.isArray(source) && Array.isArray(redacted)) {
    return source.map((item, index) =>
      restoreStableAuditSummaryScalars(item, redacted[index], key),
    );
  }

  if (typeof source === "object" && typeof redacted === "object" && redacted !== null) {
    return Object.fromEntries(
      Object.entries(redacted as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        restoreStableAuditSummaryScalars(
          (source as Record<string, unknown>)[entryKey],
          entryValue,
          entryKey,
        ),
      ]),
    );
  }

  if (key && auditSummaryScalarKeys.has(key)) {
    return source;
  }

  return redacted;
};

const toExportDate = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : value;

const hasMaskedValue = (value: unknown): boolean =>
  value !== null && value !== undefined;

const toExportEventSummary = (record: AuditLogRecord): AuditExportEventSummary | null => {
  const newValue = asRecord(record.newValue);
  const operation = readString(newValue.operation);

  if (!operation?.startsWith("EXPORT_")) {
    return null;
  }

  return {
    id: record.id,
    actorUserId: record.actorUserId,
    actorDepartmentId: record.actorDepartmentId,
    operation,
    exportType: readString(newValue.exportType),
    templateId: readString(newValue.templateId),
    rowCount: readNumber(newValue.rowCount),
    rowLimit: readNumber(newValue.rowLimit),
    createdAt: record.createdAt,
  };
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
