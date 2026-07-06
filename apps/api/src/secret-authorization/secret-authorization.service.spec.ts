import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GrantStatusCode } from "../authorization/constants/grant-status-code";
import { GrantTypeCode } from "../authorization/constants/grant-type-code";
import { GranteeTypeCode } from "../authorization/constants/grantee-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { UserContext } from "../identity/user-context";
import {
  SecretAuthorizationPermissionDeniedError,
  SecretAuthorizationService,
} from "./secret-authorization.service";
import {
  SecretAuthorizationAuditRecord,
  SecretAuthorizationGrantRecord,
  SecretAuthorizationRepository,
  SecretAuthorizationResourceRecord,
} from "./secret-authorization.repository";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  achievement: "20000000-0000-4000-8000-000000000001",
  attachment: "30000000-0000-4000-8000-000000000001",
  granteeUser: "40000000-0000-4000-8000-000000000002",
};

const now = new Date("2026-07-01T00:00:00.000Z");

const systemConfigContext: UserContext = {
  userId: ids.user,
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

const grantMutationOnlyContext: UserContext = {
  ...systemConfigContext,
  roleCodes: [RoleCode.secretManager],
  permissionCodes: [
    PermissionCode.resourceGrantCreate,
    PermissionCode.resourceGrantRevoke,
  ],
};

type RepositoryMock = {
  listRestrictedResources: ReturnType<typeof vi.fn>;
  listAllResourceGrants: ReturnType<typeof vi.fn>;
  listResourceGrants: ReturnType<typeof vi.fn>;
  listResourceAudits: ReturnType<typeof vi.fn>;
};

const resources: SecretAuthorizationResourceRecord[] = [
  {
    resourceType: ResourceTypeCode.achievement,
    resourceId: ids.achievement,
    safeResourceLabel: "Restricted PAPER achievement",
    departmentId: ids.department,
    secretLevel: "SECRET",
    status: "ARCHIVED",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  },
  {
    resourceType: ResourceTypeCode.attachment,
    resourceId: ids.attachment,
    safeResourceLabel: "Restricted ACHIEVEMENT attachment metadata",
    departmentId: null,
    secretLevel: "CONFIDENTIAL",
    status: "ACTIVE",
    createdAt: new Date("2026-05-02T00:00:00.000Z"),
    updatedAt: new Date("2026-06-02T00:00:00.000Z"),
  },
];

const makeGrant = (
  overrides: Partial<SecretAuthorizationGrantRecord>,
): SecretAuthorizationGrantRecord => ({
  resourceType: ResourceTypeCode.achievement,
  resourceId: ids.achievement,
  granteeType: GranteeTypeCode.user,
  granteeId: ids.granteeUser,
  grantType: GrantTypeCode.secretRead,
  status: GrantStatusCode.active,
  startsAt: new Date("2026-06-01T00:00:00.000Z"),
  expiresAt: null,
  revokedAt: null,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  ...overrides,
});

const grants: SecretAuthorizationGrantRecord[] = [
  makeGrant({
    expiresAt: new Date("2026-07-10T00:00:00.000Z"),
    createdAt: new Date("2026-06-20T00:00:00.000Z"),
  }),
  makeGrant({
    granteeType: GranteeTypeCode.role,
    granteeId: ids.role,
    createdAt: new Date("2026-06-19T00:00:00.000Z"),
  }),
  makeGrant({
    expiresAt: new Date("2026-06-01T00:00:00.000Z"),
    createdAt: new Date("2026-06-18T00:00:00.000Z"),
  }),
  makeGrant({
    status: GrantStatusCode.expired,
    createdAt: new Date("2026-06-17T00:00:00.000Z"),
  }),
  makeGrant({
    revokedAt: new Date("2026-06-16T00:00:00.000Z"),
    createdAt: new Date("2026-06-16T00:00:00.000Z"),
  }),
  makeGrant({
    status: GrantStatusCode.revoked,
    createdAt: new Date("2026-06-15T00:00:00.000Z"),
  }),
  makeGrant({
    startsAt: new Date("2026-07-10T00:00:00.000Z"),
    createdAt: new Date("2026-06-14T00:00:00.000Z"),
  }),
  makeGrant({
    resourceType: ResourceTypeCode.attachment,
    resourceId: ids.attachment,
    granteeType: GranteeTypeCode.department,
    granteeId: ids.department,
    grantType: GrantTypeCode.attachmentDownload,
    createdAt: new Date("2026-06-13T00:00:00.000Z"),
  }),
  makeGrant({
    resourceType: ResourceTypeCode.auditLog,
    resourceId: "90000000-0000-4000-8000-000000000001",
    grantType: GrantTypeCode.auditRead,
    createdAt: new Date("2026-06-12T00:00:00.000Z"),
  }),
];

const audits: SecretAuthorizationAuditRecord[] = Array.from({ length: 8 }, (_, index) => ({
  action: index === 0 ? "CONFIG_UPDATE" : "UPDATE",
  targetType: ResourceTypeCode.achievement,
  targetSecretLevel: "SECRET",
  oldValue: index === 0 ? null : { grantType: GrantTypeCode.secretRead },
  newValue:
    index === 0
      ? {
          grantType: GrantTypeCode.secretRead,
          granteeType: GranteeTypeCode.user,
          reason: "local safety review",
          storageKey: "must-not-return",
          checksum: "must-not-return",
        }
      : { granteeType: GranteeTypeCode.role },
  createdAt: new Date(`2026-06-${(20 - index).toString().padStart(2, "0")}T00:00:00.000Z`),
}));

const createRepositoryMock = (): RepositoryMock => ({
  listRestrictedResources: vi.fn().mockResolvedValue(resources),
  listAllResourceGrants: vi.fn().mockResolvedValue(grants),
  listResourceGrants: vi.fn().mockResolvedValue(grants.slice(0, 8)),
  listResourceAudits: vi.fn().mockResolvedValue(audits),
});

const createService = () => {
  const repository = createRepositoryMock();
  const service = new SecretAuthorizationService(
    repository as unknown as SecretAuthorizationRepository,
  );

  return { repository, service };
};

describe("SecretAuthorizationService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects users without system:config, including grant mutation permissions", async () => {
    const { service } = createService();

    await expect(service.getOverview(grantMutationOnlyContext)).rejects.toThrow(
      SecretAuthorizationPermissionDeniedError,
    );
    await expect(service.listResources(grantMutationOnlyContext)).rejects.toThrow(
      SecretAuthorizationPermissionDeniedError,
    );
    await expect(
      service.getResourceGrantDetail(
        grantMutationOnlyContext,
        ResourceTypeCode.achievement,
        ids.achievement,
      ),
    ).rejects.toThrow(SecretAuthorizationPermissionDeniedError);
  });

  it("returns overview counts for restricted resources and grant states", async () => {
    const { service } = createService();

    const overview = await service.getOverview(systemConfigContext);

    expect(overview).toEqual(
      expect.objectContaining({
        restrictedResourceCount: 2,
        activeGrantCount: 4,
        expiredGrantCount: 2,
        revokedGrantCount: 2,
        futureDatedGrantCount: 1,
        expiringSoonCount: 1,
        generatedAt: "2026-07-01T00:00:00.000Z",
      }),
    );
    expect(overview.restrictedResourceCountsByType).toEqual({
      ACHIEVEMENT: 1,
      ATTACHMENT: 1,
    });
    expect(overview.restrictedResourceCountsBySecretLevel).toEqual({
      SECRET: 1,
      CONFIDENTIAL: 1,
    });
    expect(overview.grantCountsByStatus).toEqual({
      ACTIVE: 7,
      EXPIRED: 1,
      REVOKED: 1,
    });
    expect(overview.grantCountsByType).toEqual({
      SECRET_READ: 7,
      ATTACHMENT_DOWNLOAD: 1,
      AUDIT_READ: 1,
    });
    expect(overview.grantCountsByGranteeType).toEqual({
      USER: 7,
      ROLE: 1,
      DEPARTMENT: 1,
    });
  });

  it("returns safe resource summaries without content fields", async () => {
    const { service } = createService();

    const result = await service.listResources(systemConfigContext);
    const firstItem = result.items[0];

    expect(result.total).toBe(2);
    expect(firstItem).toBeDefined();
    expect(firstItem).toEqual(
      expect.objectContaining({
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.achievement,
        safeResourceLabel: "Restricted PAPER achievement",
        departmentId: ids.department,
        secretLevel: "SECRET",
        isRestricted: true,
        contentRedacted: true,
        activeGrantCount: 2,
        nearestGrantExpiresAt: "2026-07-10T00:00:00.000Z",
      }),
    );
    expect(firstItem?.grantCountsByType).toEqual({ SECRET_READ: 7 });
  });

  it("bounds detail grants and audit summaries to five rows", async () => {
    const { repository, service } = createService();

    const detail = await service.getResourceGrantDetail(
      systemConfigContext,
      ResourceTypeCode.achievement,
      ids.achievement,
    );

    expect(repository.listResourceGrants).toHaveBeenCalledWith({
      resourceType: ResourceTypeCode.achievement,
      resourceId: ids.achievement,
      take: 5,
    });
    expect(repository.listResourceAudits).toHaveBeenCalledWith({
      resourceType: ResourceTypeCode.achievement,
      resourceId: ids.achievement,
      take: 5,
    });
    expect(detail.grants).toHaveLength(5);
    expect(detail.audits).toHaveLength(5);
    expect(detail.limits).toEqual({ grantRows: 5, auditRows: 5 });
    expect(detail.audits[0]).toEqual({
      operation: "CONFIG_UPDATE",
      resourceType: ResourceTypeCode.achievement,
      targetSecretLevel: "SECRET",
      grantType: GrantTypeCode.secretRead,
      granteeType: GranteeTypeCode.user,
      reasonProvided: true,
      createdAt: "2026-06-20T00:00:00.000Z",
    });
  });

  it("does not serialize forbidden sensitive or raw fields", async () => {
    const { service } = createService();

    const payload = {
      overview: await service.getOverview(systemConfigContext),
      resources: await service.listResources(systemConfigContext),
      detail: await service.getResourceGrantDetail(
        systemConfigContext,
        ResourceTypeCode.achievement,
        ids.achievement,
      ),
    };
    const serialized = JSON.stringify(payload);

    for (const forbidden of [
      "attachmentBody",
      "objectKey",
      "storageKey",
      "internalPath",
      "providerPath",
      "checksum",
      "downloadUrl",
      "preSignedUrl",
      "rawAuditJson",
      "permissionGraph",
      "debug",
      "exportUrl",
      "operatorEmail",
      "password",
      "passwordHash",
      "token",
      "tokenHash",
      "sessionId",
      "cookie",
      "DATABASE_URL",
      "connectionString",
      "clientSecret",
      "secretValue",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
