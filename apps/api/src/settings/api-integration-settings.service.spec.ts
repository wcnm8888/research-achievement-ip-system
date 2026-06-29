import { ApiIntegrationProvider } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { allowDecision, denyDecision } from "../authorization/policy/policy-decision";
import { UserContext } from "../identity/user-context";
import {
  ApiIntegrationRecord,
  ApiIntegrationSettingsRepository,
} from "./api-integration-settings.repository";
import { ApiIntegrationSettingsService } from "./api-integration-settings.service";
import {
  SettingsConflictError,
  SettingsPermissionDeniedError,
} from "./settings.errors";

const ids = {
  actor: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  integration: "70000000-0000-4000-8000-000000000001",
};

const now = new Date("2026-06-29T00:00:00.000Z");

const adminContext: UserContext = {
  userId: ids.actor,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.systemAdmin],
  permissionCodes: [PermissionCode.systemConfig],
  roleScopes: [
    {
      roleCode: RoleCode.systemAdmin,
      scopeType: ScopeType.global,
      scopeKey: "GLOBAL",
      departmentId: null,
    },
  ],
  scopedDepartmentIds: [ids.department],
};

const makeApiIntegration = (
  overrides: Partial<ApiIntegrationRecord> = {},
): ApiIntegrationRecord => ({
  id: ids.integration,
  code: "DOI_LOOKUP",
  provider: ApiIntegrationProvider.DOI,
  enabled: true,
  timeoutMs: 3000,
  configRef: "doi.lookup.default",
  createdAt: now,
  updatedAt: now,
  archivedAt: null,
  ...overrides,
});

describe("ApiIntegrationSettingsService", () => {
  it("lists and reads integrations only after system config permission check", async () => {
    const { service, repository, rbacPolicy } = createService();

    await service.listApiIntegrations(adminContext, {
      keyword: " DOI ",
      provider: ApiIntegrationProvider.DOI,
      enabled: true,
      page: 2,
      pageSize: 10,
    });
    await service.getApiIntegration(adminContext, ids.integration);

    expect(rbacPolicy.hasPermission).toHaveBeenCalledWith(
      adminContext,
      PermissionCode.systemConfig,
    );
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: "DOI",
        provider: ApiIntegrationProvider.DOI,
        enabled: true,
        page: 2,
        pageSize: 10,
      }),
    );
    expect(repository.findById).toHaveBeenCalledWith(ids.integration, {});
  });

  it("denies non-admin callers before repository access", async () => {
    const { service, repository, rbacPolicy } = createService();
    rbacPolicy.hasPermission.mockReturnValueOnce(
      denyDecision("Required permissions are missing.", [PermissionCode.systemConfig]),
    );

    await expect(service.listApiIntegrations(adminContext, {})).rejects.toBeInstanceOf(
      SettingsPermissionDeniedError,
    );

    expect(repository.findMany).not.toHaveBeenCalled();
  });

  it("creates an integration and records CONFIG_UPDATE metadata", async () => {
    const { service, repository, prisma, auditService } = createService();

    await service.createApiIntegration(adminContext, {
      code: " DOI_LOOKUP ",
      provider: ApiIntegrationProvider.DOI,
      enabled: true,
      timeoutMs: 3000,
      configRef: " doi.lookup.default ",
    });

    expect(repository.createInTransaction).toHaveBeenCalledWith(prisma.tx, {
      code: "DOI_LOOKUP",
      provider: ApiIntegrationProvider.DOI,
      enabled: true,
      timeoutMs: 3000,
      configRef: "doi.lookup.default",
    });
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.configUpdate,
        target: {
          type: AuditTargetTypeCode.systemConfig,
          id: ids.integration,
          departmentId: ids.department,
        },
        oldValue: null,
        newValue: expect.objectContaining({
          operation: "API_INTEGRATION_CREATE",
          code: "DOI_LOOKUP",
          provider: ApiIntegrationProvider.DOI,
          timeoutMs: 3000,
          configRef: "doi.lookup.default",
        }),
      }),
    );
  });

  it("updates only non-sensitive metadata and records old/new audit summary", async () => {
    const { service, repository, auditService } = createService();

    await service.updateApiIntegration(adminContext, ids.integration, {
      enabled: false,
      timeoutMs: 5000,
      configRef: null,
    });

    expect(repository.updateInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.integration,
      { enabled: false, timeoutMs: 5000, configRef: null },
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        oldValue: expect.objectContaining({
          operation: "API_INTEGRATION_UPDATE",
          code: "DOI_LOOKUP",
          configRef: "doi.lookup.default",
        }),
        newValue: expect.objectContaining({
          operation: "API_INTEGRATION_UPDATE",
          enabled: false,
          timeoutMs: 5000,
          configRef: null,
        }),
      }),
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).not.toContain(
      "apiKey",
    );
  });

  it("archives by disabling and setting archivedAt, then restores archived metadata", async () => {
    const { service, repository, auditService } = createService();
    repository.findById.mockResolvedValueOnce(makeApiIntegration());

    await service.archiveApiIntegration(adminContext, ids.integration, {
      reason: "unused",
    });

    expect(repository.archiveInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.integration,
      expect.any(Date),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        newValue: expect.objectContaining({
          operation: "API_INTEGRATION_ARCHIVE",
          enabled: false,
          reason: "unused",
        }),
      }),
    );

    repository.findById.mockResolvedValueOnce(
      makeApiIntegration({ enabled: false, archivedAt: now }),
    );
    await service.restoreApiIntegration(adminContext, ids.integration, {
      reason: "restored",
    });

    expect(repository.findById).toHaveBeenCalledWith(ids.integration, {
      includeArchived: true,
    });
    expect(repository.restoreInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.integration,
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        newValue: expect.objectContaining({
          operation: "API_INTEGRATION_RESTORE",
          reason: "restored",
        }),
      }),
    );
  });

  it("rejects duplicate create and invalid lifecycle transitions", async () => {
    const { service, repository, auditService } = createService();
    repository.createInTransaction.mockRejectedValueOnce({ code: "P2002" });

    await expect(
      service.createApiIntegration(adminContext, {
        code: "DUPLICATE",
        provider: ApiIntegrationProvider.OTHER,
      }),
    ).rejects.toBeInstanceOf(SettingsConflictError);

    repository.findById.mockResolvedValueOnce(
      makeApiIntegration({ archivedAt: now }),
    );
    await expect(
      service.archiveApiIntegration(adminContext, ids.integration, {}),
    ).rejects.toThrow("already archived");

    repository.findById.mockResolvedValueOnce(makeApiIntegration());
    await expect(
      service.restoreApiIntegration(adminContext, ids.integration, {}),
    ).rejects.toThrow("already active");

    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });
});

const createService = () => {
  const repository = {
    findMany: vi.fn().mockResolvedValue({
      items: [makeApiIntegration()],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
    findById: vi.fn().mockResolvedValue(makeApiIntegration()),
    createInTransaction: vi.fn().mockResolvedValue(makeApiIntegration()),
    updateInTransaction: vi.fn().mockResolvedValue(
      makeApiIntegration({ enabled: false, timeoutMs: 5000, configRef: null }),
    ),
    archiveInTransaction: vi.fn().mockResolvedValue(
      makeApiIntegration({ enabled: false, archivedAt: now }),
    ),
    restoreInTransaction: vi.fn().mockResolvedValue(makeApiIntegration()),
    isPrismaUniqueConflict: vi.fn((error: unknown) =>
      Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002"),
    ),
    isPrismaRecordNotFound: vi.fn((error: unknown) =>
      Boolean(error && typeof error === "object" && "code" in error && error.code === "P2025"),
    ),
  };

  const rbacPolicy = {
    hasPermission: vi.fn().mockReturnValue(allowDecision("allowed")),
  };

  const prisma = {
    tx: { apiIntegration: {}, auditLog: {} },
    $transaction: vi.fn(async (callback) => callback(prisma.tx)),
  };

  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-1" }),
  };

  const service = new ApiIntegrationSettingsService(
    repository as unknown as ApiIntegrationSettingsRepository,
    rbacPolicy as never,
    prisma as never,
    auditService as never,
  );

  return { service, repository, rbacPolicy, prisma, auditService };
};
