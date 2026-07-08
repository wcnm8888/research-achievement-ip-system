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
          "当前接口类型尚未配置启用的接口元数据，已返回不可用降级说明；可继续手工处理。",
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
            errorSummary: "预演跳过：接口配置已停用。",
          },
        ),
      );

      return buildUnavailableMockDemoResult({
        definition,
        dto,
        integration,
        log,
        reason:
          "接口配置已停用，已返回不可用降级说明；未模拟外部服务调用。",
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
      syntheticSubject: buildPreviewSubject(definition, dto),
      safeResult: result.safeResult,
      safetyNotice:
        "本地预演结果仅用于评审演示；未访问真实 DOI、文献库、专利、财务、HR、SSO、邮件或短信系统。",
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
    title: "DOI 自动补全预演",
    syntheticSubject: "DOI 10.0000/local-preview-2026",
    successSummary:
      "已生成 DOI 元数据预演摘要，可作为论文成果登记的人工录入参考；未自动改写成果记录。",
    failureSummary:
      "DOI 自动补全通道返回失败预演，当前降级为手工录入，不影响成果登记。",
    degradedSummary:
      "DOI 自动补全通道进入降级预演，返回可人工确认的基础字段，未访问外部文献库。",
    successData: {
      title: "科研成果知识产权协同管理方法研究",
      authors: ["第一作者", "通讯作者"],
      journal: "科研管理与知识产权研究",
      publishYear: 2026,
      citationSource: "本地预留 DOI 适配器",
      citationSummary: "预演摘要显示该 DOI 可映射题名、作者、期刊和发表年份。",
      fieldMapping: "题名、作者、期刊/会议、发表年份",
      source: "本地预演适配器",
      writesBusinessRecord: false,
    },
    degradedData: {
      title: "待人工确认的 DOI 元数据",
      journal: "需手工录入期刊或会议",
      publishYear: 2026,
      citationSource: "手工录入降级方案",
      citationSummary: "自动补全不可用时保留 DOI 字段，由登记人补录论文信息。",
      source: "本地降级策略",
      confidence: "低",
      writesBusinessRecord: false,
    },
  },
  [ApiIntegrationMockScenario.emailNotification]: {
    provider: ApiIntegrationProvider.EMAIL,
    title: "邮件通知预演",
    syntheticSubject: "成果审核待处理提醒 EMAIL-PREVIEW-2026-0001",
    successSummary:
      "已生成邮件通知预演内容，仅展示接收范围、主题、摘要和发送策略；未发送外部邮件。",
    failureSummary:
      "邮件通知通道返回失败预演，系统降级为站内提醒和人工跟进。",
    degradedSummary:
      "邮件通知进入降级预演，优先保留站内提醒和人工跟进路径。",
    successData: {
      recipientScope: "部门审核人员",
      subject: "成果审核待处理提醒",
      summary: "1 条成果审核任务等待处理",
      channel: "邮件通道预留",
      deliveryStatus: "仅生成预演",
      retryPolicySummary: "最多 2 次重试，失败后转站内提醒",
      timeoutMs: 3000,
      fallback: "站内提醒与人工跟进",
      writesBusinessRecord: false,
      sendsExternalMessage: false,
    },
    degradedData: {
      recipientScope: "部门审核人员",
      channel: "站内提醒",
      deliveryStatus: "人工降级",
      retryPolicySummary: "外部邮件不可用时不重试外部服务",
      timeoutMs: 3000,
      fallback: "人工跟进",
      writesBusinessRecord: false,
      sendsExternalMessage: false,
    },
  },
  [ApiIntegrationMockScenario.patentStatusSync]: {
    provider: ApiIntegrationProvider.PATENT,
    title: "专利状态同步预演",
    syntheticSubject: "专利申请 CN-PREVIEW-2026-0001",
    successSummary:
      "已生成专利状态同步预演摘要，仅映射内部展示状态；未同步官方专利数据。",
    failureSummary:
      "专利状态同步通道返回失败预演，当前记录保持不变。",
    degradedSummary:
      "专利状态同步进入降级预演，使用人工复核路径。",
    successData: {
      patentStatus: "审查中",
      annualFeeNode: "第 2 年年费节点",
      source: "本地预演适配器",
      writesBusinessRecord: false,
    },
    degradedData: {
      patentStatus: "需人工复核",
      source: "本地降级策略",
      confidence: "低",
      writesBusinessRecord: false,
    },
  },
  [ApiIntegrationMockScenario.financeReconcile]: {
    provider: ApiIntegrationProvider.FINANCE,
    title: "财务回调与对账预演",
    syntheticSubject: "财务凭证 FIN-PREVIEW-2026-0001",
    successSummary:
      "已生成财务回调与对账预演摘要；未创建付款、发票、收据或凭证。",
    failureSummary:
      "财务对账通道返回失败预演，费用台账和付款状态未变更。",
    degradedSummary:
      "财务回调进入人工对账降级预演。",
    successData: {
      voucherStatus: "已匹配",
      amountCny: 0,
      source: "本地预演适配器",
      writesBusinessRecord: false,
    },
    degradedData: {
      voucherStatus: "需人工对账",
      amountCny: 0,
      source: "本地降级策略",
      writesBusinessRecord: false,
    },
  },
  [ApiIntegrationMockScenario.hrSync]: {
    provider: ApiIntegrationProvider.HR,
    title: "HR 同步预演",
    syntheticSubject: "部门人员变更 HR-PREVIEW-2026-0001",
    successSummary:
      "已生成 HR 人员变更预演摘要；未创建账号、凭证、SSO 会话或生产身份。",
    failureSummary:
      "HR 同步通道返回失败预演，本地身份数据保持不变。",
    degradedSummary:
      "HR 同步进入人工账号维护降级预演。",
    successData: {
      anonymizedStaffCount: 3,
      departmentAction: "仅预演",
      source: "本地预演适配器",
      createsCredentials: false,
    },
    degradedData: {
      anonymizedStaffCount: 0,
      departmentAction: "人工复核",
      source: "本地降级策略",
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
      errorSummary: `预演失败：${definition.title} 返回通道异常。`,
      summary: definition.failureSummary,
      safeResult: {
        mode: "失败",
        fallback: "手工录入或人工跟进",
        writesBusinessRecord: false,
      },
    };
  }

  if (resultMode === ApiIntegrationMockResultMode.degraded) {
    return {
      runStatus: "DEGRADED",
      durationMs: 412,
      errorSummary: `预演降级：${definition.title} 使用降级数据。`,
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
  syntheticSubject: buildPreviewSubject(definition, dto),
  safeResult: {
    mode: "不可用",
    fallback: "手工录入或人工跟进",
    writesBusinessRecord: false,
  },
  safetyNotice:
    "本地预演结果仅用于评审演示；未访问真实 DOI、文献库、专利、财务、HR、SSO、邮件或短信系统。",
  callLog: log ? toApiCallLogSummary(log) : null,
});

const buildPreviewSubject = (
  definition: ApiIntegrationMockScenarioDefinition,
  dto: RunApiIntegrationMockDemoDto,
): string => {
  const subject = dto.subject?.trim();
  return subject ? subject : definition.syntheticSubject;
};

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

const createMockRequestId = (): string => `preview-${randomUUID()}`;

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
