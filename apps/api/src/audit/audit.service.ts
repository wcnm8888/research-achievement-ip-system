import { Inject, Injectable } from "@nestjs/common";
import { MaskedAuditLog } from "../authorization/policy/audit-redactor.service";
import { AuditReadPolicyService } from "../authorization/policy/audit-read-policy.service";
import { AuditRedactorService } from "../authorization/policy/audit-redactor.service";
import { UserContext } from "../identity/user-context";
import { AuditRepository, AuditTransactionClient } from "./audit.repository";
import { AuditAccessDeniedError } from "./domain/audit-errors";
import { AuditJsonValue, CreateAuditEventInput } from "./domain/audit-event.types";
import { toAuditLogLike } from "./domain/audit-prisma.mapper";
import { AuditLogRecord } from "./domain/audit-repository.types";
import { AuditMaskedQueryInput } from "./dto/audit-query.dto";

export type MaskedAuditListResult = {
  items: MaskedAuditLog[];
};

const auditSummaryScalarKeys = new Set(["version", "fileName", "stepCode", "currentStep"]);

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
