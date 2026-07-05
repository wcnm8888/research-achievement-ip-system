import { Inject, Injectable } from "@nestjs/common";
import { ApiCallStatus, ApiIntegrationProvider } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  ApiCallLogSafeRecord,
  ApiIntegrationRecord,
  ApiIntegrationSettingsRepository,
  ApiIntegrationSettingsTransactionClient,
} from "./api-integration-settings.repository";
import {
  ApiIntegrationReasonDto,
  ApiIntegrationMockResultMode,
  ApiIntegrationMockScenario,
  ListApiCallLogsQueryDto,
  CreateApiIntegrationDto,
  ListApiIntegrationsQueryDto,
  RunApiIntegrationMockDemoDto,
  UpdateApiIntegrationDto,
} from "./dto/api-integration-settings.dto";
import {
  SettingsAccessDeniedError,
  SettingsConflictError,
  SettingsNotFoundError,
  SettingsPermissionDeniedError,
  SettingsValidationError,
} from "./settings.errors";

type ApiIntegrationAuditOperation =
  | "API_INTEGRATION_CREATE"
  | "API_INTEGRATION_UPDATE"
  | "API_INTEGRATION_ARCHIVE"
  | "API_INTEGRATION_RESTORE";

type ApiIntegrationMockRunStatus =
  | "SUCCESS"
  | "FAILED"
  | "DEGRADED"
  | "UNAVAILABLE";

type ApiIntegrationMockScenarioDefinition = {
  provider: ApiIntegrationProvider;
  title: string;
  syntheticSubject: string;
  successSummary: string;
  failureSummary: string;
  degradedSummary: string;
  successData: Record<string, string | number | boolean | string[]>;
  degradedData: Record<string, string | number | boolean | string[]>;
};

type ApiCallLogSummary = {
  integrationCode: string;
  requestId: string;
  status: string;
  durationMs: number | null;
  errorSummary: string | null;
  createdAt: Date;
};

@Injectable()
export class ApiIntegrationSettingsService {
  constructor(
    @Inject(ApiIntegrationSettingsRepository)
    private readonly repository: ApiIntegrationSettingsRepository,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async listApiIntegrations(
    context: UserContext,
    query: ListApiIntegrationsQueryDto = {},
  ) {
    this.assertCanManageSettings(context);

    return this.repository.findMany({
      keyword: query.keyword?.trim(),
      provider: query.provider,
      enabled: query.enabled,
      includeArchived: query.includeArchived,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async getApiIntegration(
    context: UserContext,
    apiIntegrationId: string,
  ): Promise<ApiIntegrationRecord> {
    this.assertCanManageSettings(context);

    return this.requireApiIntegration(apiIntegrationId);
  }

  async createApiIntegration(
    context: UserContext,
    dto: CreateApiIntegrationDto,
  ): Promise<ApiIntegrationRecord> {
    this.assertCanManageSettings(context);
    const input = {
      code: dto.code.trim(),
      provider: dto.provider,
      enabled: dto.enabled,
      timeoutMs: dto.timeoutMs,
      configRef: normalizeConfigRef(dto.configRef),
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const settingsClient = tx as ApiIntegrationSettingsTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const integration = await this.repository.createInTransaction(
          settingsClient,
          input,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toApiIntegrationAuditEvent(
            context,
            integration,
            "API_INTEGRATION_CREATE",
            {
              oldValue: null,
              newValue: toAuditMetadata(integration),
            },
          ),
        );

        return integration;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async updateApiIntegration(
    context: UserContext,
    apiIntegrationId: string,
    dto: UpdateApiIntegrationDto,
  ): Promise<ApiIntegrationRecord> {
    this.assertCanManageSettings(context);
    const current = await this.requireApiIntegration(apiIntegrationId);
    const input = {
      ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
      ...(dto.provider !== undefined ? { provider: dto.provider } : {}),
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.timeoutMs !== undefined ? { timeoutMs: dto.timeoutMs } : {}),
      ...(dto.configRef !== undefined
        ? { configRef: normalizeConfigRef(dto.configRef) }
        : {}),
    };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const settingsClient = tx as ApiIntegrationSettingsTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const integration = await this.repository.updateInTransaction(
          settingsClient,
          apiIntegrationId,
          input,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toApiIntegrationAuditEvent(
            context,
            integration,
            "API_INTEGRATION_UPDATE",
            {
              oldValue: toAuditMetadata(current),
              newValue: toAuditMetadata(integration),
            },
          ),
        );

        return integration;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async archiveApiIntegration(
    context: UserContext,
    apiIntegrationId: string,
    dto: ApiIntegrationReasonDto = {},
  ): Promise<ApiIntegrationRecord> {
    this.assertCanManageSettings(context);
    const current = await this.requireApiIntegration(apiIntegrationId);
    if (current.archivedAt !== null) {
      throw new SettingsConflictError("API integration is already archived.");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const settingsClient = tx as ApiIntegrationSettingsTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const integration = await this.repository.archiveInTransaction(
          settingsClient,
          apiIntegrationId,
          new Date(),
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toApiIntegrationAuditEvent(
            context,
            integration,
            "API_INTEGRATION_ARCHIVE",
            {
              oldValue: toAuditMetadata(current),
              newValue: {
                ...toAuditMetadata(integration),
                reason: normalizeReason(dto.reason),
              },
            },
          ),
        );

        return integration;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async restoreApiIntegration(
    context: UserContext,
    apiIntegrationId: string,
    dto: ApiIntegrationReasonDto = {},
  ): Promise<ApiIntegrationRecord> {
    this.assertCanManageSettings(context);
    const current = await this.requireApiIntegration(apiIntegrationId, {
      includeArchived: true,
    });
    if (current.archivedAt === null) {
      throw new SettingsConflictError("API integration is already active.");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const settingsClient = tx as ApiIntegrationSettingsTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const integration = await this.repository.restoreInTransaction(
          settingsClient,
          apiIntegrationId,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toApiIntegrationAuditEvent(
            context,
            integration,
            "API_INTEGRATION_RESTORE",
            {
              oldValue: toAuditMetadata(current),
              newValue: {
                ...toAuditMetadata(integration),
                reason: normalizeReason(dto.reason),
              },
            },
          ),
        );

        return integration;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async runMockDemo(context: UserContext, dto: RunApiIntegrationMockDemoDto) {
    this.assertCanManageSettings(context);
    const definition = getMockScenarioDefinition(dto.scenario);

    if (definition.provider !== dto.provider) {
      throw new SettingsValidationError(
        `Scenario ${dto.scenario} requires provider ${definition.provider}.`,
      );
    }

    const integration = await this.repository.findFirstByProvider(dto.provider);
    if (!integration) {
      return buildUnavailableMockDemoResult({
        definition,
        dto,
        reason:
          "No active API integration metadata exists for this provider. Mock demo did not write ApiCallLog because there is no safe integrationCode foreign key.",
      });
    }

    if (!integration.enabled) {
      const log = await this.prisma.$transaction(async (tx) =>
        this.repository.createApiCallLogInTransaction(
          tx as ApiIntegrationSettingsTransactionClient,
          {
            integrationCode: integration.code,
            requestId: createMockRequestId(),
            status: ApiCallStatus.SKIPPED,
            durationMs: 0,
            errorSummary: "Mock skipped: integration is disabled.",
          },
        ),
      );

      return buildUnavailableMockDemoResult({
        definition,
        dto,
        integration,
        log,
        reason:
          "Integration metadata is disabled. Mock demo returned an unavailable fallback and did not simulate an external provider call.",
      });
    }

    const result = buildEnabledMockDemoResult(definition, dto.resultMode);
    const log = await this.prisma.$transaction(async (tx) =>
      this.repository.createApiCallLogInTransaction(
        tx as ApiIntegrationSettingsTransactionClient,
        {
          integrationCode: integration.code,
          requestId: createMockRequestId(),
          status: toApiCallStatus(dto.resultMode),
          durationMs: result.durationMs,
          errorSummary: result.errorSummary,
        },
      ),
    );

    return {
      mockOnly: true,
      provider: dto.provider,
      scenario: dto.scenario,
      requestedResultMode: dto.resultMode,
      runStatus: result.runStatus,
      integration: toMockIntegrationSummary(integration),
      summary: result.summary,
      syntheticSubject: definition.syntheticSubject,
      safeResult: result.safeResult,
      safetyNotice:
        "Mock demo only. No real DOI, literature, patent, finance, HR, SSO, email, or SMS system was contacted.",
      callLog: toApiCallLogSummary(log),
    };
  }

  async listRecentApiCallLogs(
    context: UserContext,
    query: ListApiCallLogsQueryDto = {},
  ): Promise<{ items: ApiCallLogSummary[] }> {
    this.assertCanManageSettings(context);
    const logs = await this.repository.findRecentApiCallLogs(query.limit ?? 10);

    return { items: logs.map(toApiCallLogSummary) };
  }

  private assertCanManageSettings(context: UserContext | null | undefined): void {
    if (!context?.userId || !context.departmentId) {
      throw new SettingsAccessDeniedError();
    }

    const decision = this.rbacPolicy.hasPermission(context, PermissionCode.systemConfig);
    if (decision.effect === "DENY") {
      throw new SettingsPermissionDeniedError(PermissionCode.systemConfig);
    }
  }

  private async requireApiIntegration(
    apiIntegrationId: string,
    options: { includeArchived?: boolean } = {},
  ): Promise<ApiIntegrationRecord> {
    const integration = await this.repository.findById(apiIntegrationId, options);
    if (!integration) {
      throw new SettingsNotFoundError("API integration was not found.");
    }

    return integration;
  }

  private mapRepositoryError(error: unknown): Error {
    if (this.repository.isPrismaUniqueConflict(error)) {
      return new SettingsConflictError("API integration code already exists.");
    }

    if (this.repository.isPrismaRecordNotFound(error)) {
      return new SettingsNotFoundError("API integration was not found.");
    }

    return error instanceof Error
      ? error
      : new Error("Unknown API integration settings service error.");
  }

  private toApiIntegrationAuditEvent(
    context: UserContext,
    integration: ApiIntegrationRecord,
    operation: ApiIntegrationAuditOperation,
    values: {
      oldValue: Record<string, unknown> | null;
      newValue: Record<string, unknown>;
    },
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.configUpdate,
      target: {
        type: AuditTargetTypeCode.systemConfig,
        id: integration.id,
        departmentId: context.departmentId,
      },
      oldValue: values.oldValue
        ? {
            operation,
            apiIntegrationId: integration.id,
            ...values.oldValue,
          }
        : null,
      newValue: {
        operation,
        apiIntegrationId: integration.id,
        ...values.newValue,
      },
    };
  }
}

const mockScenarioDefinitions: Record<
  ApiIntegrationMockScenario,
  ApiIntegrationMockScenarioDefinition
> = {
  [ApiIntegrationMockScenario.doiLookup]: {
    provider: ApiIntegrationProvider.DOI,
    title: "DOI lookup mock",
    syntheticSubject: "Synthetic DOI 10.0000/mock-demo-2026",
    successSummary:
      "Synthetic DOI metadata was normalized for preview only; no paper was updated.",
    failureSummary:
      "Synthetic DOI provider failure was returned; manual entry remains the fallback.",
    degradedSummary:
      "Synthetic DOI lookup used cached/manual fallback fields; no external lookup happened.",
    successData: {
      title: "Synthetic research output metadata",
      authors: ["Synthetic Author A", "Synthetic Author B"],
      source: "mock-adapter",
      writesBusinessRecord: false,
    },
    degradedData: {
      title: "Manual-entry DOI metadata placeholder",
      source: "mock-fallback",
      confidence: "low",
      writesBusinessRecord: false,
    },
  },
  [ApiIntegrationMockScenario.patentStatusSync]: {
    provider: ApiIntegrationProvider.PATENT,
    title: "Patent status sync mock",
    syntheticSubject: "Synthetic patent application CN-MOCK-2026-0001",
    successSummary:
      "Synthetic patent status was mapped to an internal preview state; no official data was synchronized.",
    failureSummary:
      "Synthetic patent status provider failure was returned; current records remain unchanged.",
    degradedSummary:
      "Synthetic patent status used stale/manual fallback data for preview only.",
    successData: {
      patentStatus: "UNDER_REVIEW",
      annualFeeNode: "mock-year-2",
      source: "mock-adapter",
      writesBusinessRecord: false,
    },
    degradedData: {
      patentStatus: "MANUAL_REVIEW_REQUIRED",
      source: "mock-fallback",
      confidence: "low",
      writesBusinessRecord: false,
    },
  },
  [ApiIntegrationMockScenario.financeReconcile]: {
    provider: ApiIntegrationProvider.FINANCE,
    title: "Finance callback/reconcile mock",
    syntheticSubject: "Synthetic finance voucher FIN-MOCK-2026-0001",
    successSummary:
      "Synthetic finance callback was reconciled into a preview summary; no payment, invoice, receipt, or voucher was created.",
    failureSummary:
      "Synthetic finance reconciliation failure was returned; no ledger or payment state changed.",
    degradedSummary:
      "Synthetic finance callback entered manual reconciliation fallback for preview only.",
    successData: {
      voucherStatus: "MATCHED",
      amountCny: 0,
      source: "mock-adapter",
      writesBusinessRecord: false,
    },
    degradedData: {
      voucherStatus: "MANUAL_RECONCILE_REQUIRED",
      amountCny: 0,
      source: "mock-fallback",
      writesBusinessRecord: false,
    },
  },
  [ApiIntegrationMockScenario.hrSync]: {
    provider: ApiIntegrationProvider.HR,
    title: "HR sync mock",
    syntheticSubject: "Synthetic department staff delta HR-MOCK-2026-0001",
    successSummary:
      "Synthetic HR delta was validated for preview only; no account, credential, SSO session, or production identity was created.",
    failureSummary:
      "Synthetic HR sync failure was returned; local identities remain unchanged.",
    degradedSummary:
      "Synthetic HR sync used manual account-maintenance fallback for preview only.",
    successData: {
      anonymizedStaffCount: 3,
      departmentAction: "preview-only",
      source: "mock-adapter",
      createsCredentials: false,
    },
    degradedData: {
      anonymizedStaffCount: 0,
      departmentAction: "manual-review",
      source: "mock-fallback",
      createsCredentials: false,
    },
  },
};

const getMockScenarioDefinition = (
  scenario: ApiIntegrationMockScenario,
): ApiIntegrationMockScenarioDefinition => mockScenarioDefinitions[scenario];

const buildEnabledMockDemoResult = (
  definition: ApiIntegrationMockScenarioDefinition,
  resultMode: ApiIntegrationMockResultMode,
): {
  runStatus: ApiIntegrationMockRunStatus;
  durationMs: number;
  errorSummary: string | null;
  summary: string;
  safeResult: Record<string, unknown>;
} => {
  if (resultMode === ApiIntegrationMockResultMode.failure) {
    return {
      runStatus: "FAILED",
      durationMs: 248,
      errorSummary: `Mock failure: ${definition.title} returned a synthetic adapter error.`,
      summary: definition.failureSummary,
      safeResult: {
        mode: "failure",
        fallback: "manual-entry",
        writesBusinessRecord: false,
      },
    };
  }

  if (resultMode === ApiIntegrationMockResultMode.degraded) {
    return {
      runStatus: "DEGRADED",
      durationMs: 412,
      errorSummary: `Mock degraded: ${definition.title} used fallback data.`,
      summary: definition.degradedSummary,
      safeResult: definition.degradedData,
    };
  }

  return {
    runStatus: "SUCCESS",
    durationMs: 126,
    errorSummary: null,
    summary: definition.successSummary,
    safeResult: definition.successData,
  };
};

const buildUnavailableMockDemoResult = ({
  definition,
  dto,
  integration,
  log,
  reason,
}: {
  definition: ApiIntegrationMockScenarioDefinition;
  dto: RunApiIntegrationMockDemoDto;
  integration?: ApiIntegrationRecord;
  log?: ApiCallLogSafeRecord;
  reason: string;
}) => ({
  mockOnly: true,
  provider: dto.provider,
  scenario: dto.scenario,
  requestedResultMode: dto.resultMode,
  runStatus: "UNAVAILABLE" as const,
  integration: integration ? toMockIntegrationSummary(integration) : null,
  summary: reason,
  syntheticSubject: definition.syntheticSubject,
  safeResult: {
    mode: "unavailable",
    fallback: "manual-entry",
    writesBusinessRecord: false,
  },
  safetyNotice:
    "Mock demo only. No real DOI, literature, patent, finance, HR, SSO, email, or SMS system was contacted.",
  callLog: log ? toApiCallLogSummary(log) : null,
});

const toApiCallStatus = (
  resultMode: ApiIntegrationMockResultMode,
): ApiCallStatus => {
  if (resultMode === ApiIntegrationMockResultMode.failure) {
    return ApiCallStatus.FAILED;
  }

  if (resultMode === ApiIntegrationMockResultMode.degraded) {
    return ApiCallStatus.RETRIED;
  }

  return ApiCallStatus.SUCCESS;
};

const toMockIntegrationSummary = (integration: ApiIntegrationRecord) => ({
  code: integration.code,
  provider: integration.provider,
  enabled: integration.enabled,
  archivedAt: integration.archivedAt,
});

const toApiCallLogSummary = (log: ApiCallLogSafeRecord) => ({
  integrationCode: log.integrationCode,
  requestId: log.requestId,
  status: log.status,
  durationMs: log.durationMs,
  errorSummary: log.errorSummary,
  createdAt: log.createdAt,
});

const createMockRequestId = (): string => `mock-${randomUUID()}`;

const normalizeConfigRef = (configRef: string | null | undefined): string | null => {
  const normalized = configRef?.trim();
  return normalized ? normalized : null;
};

const normalizeReason = (reason: string | null | undefined): string | null => {
  const normalized = reason?.trim();
  return normalized ? normalized : null;
};

const toAuditMetadata = (
  integration: ApiIntegrationRecord,
): Record<string, unknown> => ({
  code: integration.code,
  provider: integration.provider,
  enabled: integration.enabled,
  timeoutMs: integration.timeoutMs,
  configRef: integration.configRef,
  archivedAt: integration.archivedAt,
});
