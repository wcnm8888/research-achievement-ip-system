import { Inject, Injectable } from "@nestjs/common";
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
  ApiIntegrationRecord,
  ApiIntegrationSettingsRepository,
  ApiIntegrationSettingsTransactionClient,
} from "./api-integration-settings.repository";
import {
  ApiIntegrationReasonDto,
  CreateApiIntegrationDto,
  ListApiIntegrationsQueryDto,
  UpdateApiIntegrationDto,
} from "./dto/api-integration-settings.dto";
import {
  SettingsAccessDeniedError,
  SettingsConflictError,
  SettingsNotFoundError,
  SettingsPermissionDeniedError,
} from "./settings.errors";

type ApiIntegrationAuditOperation =
  | "API_INTEGRATION_CREATE"
  | "API_INTEGRATION_UPDATE"
  | "API_INTEGRATION_ARCHIVE"
  | "API_INTEGRATION_RESTORE";

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
