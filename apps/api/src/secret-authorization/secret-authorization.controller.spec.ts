import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { SecretAuthorizationModule } from "./secret-authorization.module";
import { SecretAuthorizationService } from "./secret-authorization.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  achievement: "20000000-0000-4000-8000-000000000001",
};

type ServiceMock = {
  getOverview: ReturnType<typeof vi.fn>;
  listResources: ReturnType<typeof vi.fn>;
  getResourceGrantDetail: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: ServiceMock,
) => Promise<void>;

const makeUserContext = (permissions: readonly PermissionCode[]): UserContext => {
  const isAdmin = permissions.includes(PermissionCode.systemConfig);

  return {
    userId: ids.user,
    departmentId: ids.department,
    roleIds: [ids.role],
    roleCodes: [isAdmin ? RoleCode.systemAdmin : RoleCode.secretManager],
    permissionCodes: permissions,
    roleScopes: [
      {
        roleCode: isAdmin ? RoleCode.systemAdmin : RoleCode.secretManager,
        scopeType: isAdmin ? ScopeType.global : ScopeType.department,
        scopeKey: isAdmin ? "GLOBAL" : ids.department,
        departmentId: isAdmin ? null : ids.department,
      },
    ],
    scopedDepartmentIds: [ids.department],
  };
};

const createServiceMock = (): ServiceMock => ({
  getOverview: vi.fn().mockResolvedValue({
    restrictedResourceCount: 1,
    restrictedResourceCountsByType: { ACHIEVEMENT: 1 },
    restrictedResourceCountsBySecretLevel: { SECRET: 1 },
    grantCountsByStatus: { ACTIVE: 1 },
    grantCountsByType: { SECRET_READ: 1 },
    grantCountsByGranteeType: { USER: 1 },
    activeGrantCount: 1,
    expiredGrantCount: 0,
    revokedGrantCount: 0,
    futureDatedGrantCount: 0,
    expiringSoonCount: 1,
    generatedAt: "2026-07-01T00:00:00.000Z",
    caveats: ["READ_ONLY_SAFE_PROJECTION"],
  }),
  listResources: vi.fn().mockResolvedValue({
    items: [
      {
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.achievement,
        safeResourceLabel: "Restricted PAPER achievement",
        departmentId: ids.department,
        secretLevel: "SECRET",
        isRestricted: true,
        contentRedacted: true,
        activeGrantCount: 1,
        grantCountsByType: { SECRET_READ: 1 },
        grantCountsByGranteeType: { USER: 1 },
        latestGrantCreatedAt: "2026-06-20T00:00:00.000Z",
        latestGrantRevokedAt: null,
        nearestGrantExpiresAt: "2026-07-10T00:00:00.000Z",
        caveats: ["READ_ONLY_SAFE_PROJECTION"],
      },
    ],
    total: 1,
    caveats: ["READ_ONLY_SAFE_PROJECTION"],
  }),
  getResourceGrantDetail: vi.fn().mockResolvedValue({
    resource: {
      resourceType: ResourceTypeCode.achievement,
      resourceId: ids.achievement,
      safeResourceLabel: "Restricted PAPER achievement",
      departmentId: ids.department,
      secretLevel: "SECRET",
      isRestricted: true,
      contentRedacted: true,
      activeGrantCount: 1,
      grantCountsByType: { SECRET_READ: 1 },
      grantCountsByGranteeType: { USER: 1 },
      latestGrantCreatedAt: "2026-06-20T00:00:00.000Z",
      latestGrantRevokedAt: null,
      nearestGrantExpiresAt: "2026-07-10T00:00:00.000Z",
      caveats: ["READ_ONLY_SAFE_PROJECTION"],
    },
    grants: [
      {
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.achievement,
        safeResourceLabel: "Restricted PAPER achievement",
        granteeType: "USER",
        granteeSafeLabel: "USER:4000...0002",
        grantType: "SECRET_READ",
        status: "ACTIVE",
        startsAt: "2026-06-01T00:00:00.000Z",
        expiresAt: "2026-07-10T00:00:00.000Z",
        revokedAt: null,
        createdAt: "2026-06-20T00:00:00.000Z",
      },
    ],
    audits: [],
    limits: { grantRows: 5, auditRows: 5 },
    caveats: ["READ_ONLY_SAFE_PROJECTION"],
  }),
});

describe("SecretAuthorizationController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/secret-authorization/overview")
        .expect(401);

      expect(service.getOverview).not.toHaveBeenCalled();
    });
  });

  it("returns 403 without system:config, including grant mutation permissions", async () => {
    await withTestApp(
      [PermissionCode.resourceGrantCreate, PermissionCode.resourceGrantRevoke],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .get("/secret-authorization/overview")
          .set("X-Demo-User-Id", ids.user)
          .expect(403);

        await request(app.getHttpServer() as Server)
          .get("/secret-authorization/resources")
          .set("X-Demo-User-Id", ids.user)
          .expect(403);

        await request(app.getHttpServer() as Server)
          .get(`/secret-authorization/resources/${ResourceTypeCode.achievement}/${ids.achievement}/grants`)
          .set("X-Demo-User-Id", ids.user)
          .expect(403);

        expect(service.getOverview).not.toHaveBeenCalled();
        expect(service.listResources).not.toHaveBeenCalled();
        expect(service.getResourceGrantDetail).not.toHaveBeenCalled();
      },
    );
  });

  it("lets system:config read overview, resources, and resource grant detail", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const overview = await request(app.getHttpServer() as Server)
        .get("/secret-authorization/overview")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      const resources = await request(app.getHttpServer() as Server)
        .get("/secret-authorization/resources")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      const detail = await request(app.getHttpServer() as Server)
        .get(`/secret-authorization/resources/${ResourceTypeCode.achievement}/${ids.achievement}/grants`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(overview.body.restrictedResourceCount).toBe(1);
      expect(resources.body.items[0].safeResourceLabel).toBe("Restricted PAPER achievement");
      expect(detail.body.grants[0].grantType).toBe("SECRET_READ");
      expect(service.getOverview).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
      );
      expect(service.listResources).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
      );
      expect(service.getResourceGrantDetail).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        ResourceTypeCode.achievement,
        ids.achievement,
      );

      const serialized = JSON.stringify({
        overview: overview.body,
        resources: resources.body,
        detail: detail.body,
      });
      expect(serialized).not.toContain("storageKey");
      expect(serialized).not.toContain("objectKey");
      expect(serialized).not.toContain("checksum");
      expect(serialized).not.toContain("downloadUrl");
      expect(serialized).not.toContain("rawAuditJson");
      expect(serialized).not.toContain("permissionGraph");
      expect(serialized).not.toContain("operatorEmail");
      expect(serialized).not.toContain("passwordHash");
      expect(serialized).not.toContain("tokenHash");
      expect(serialized).not.toContain("sessionId");
      expect(serialized).not.toContain("cookie");
      expect(serialized).not.toContain("DATABASE_URL");
      expect(serialized).not.toContain("connectionString");
      expect(serialized).not.toContain("clientSecret");
    });
  });

  it("rejects invalid resource ids before calling the service", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get(`/secret-authorization/resources/${ResourceTypeCode.achievement}/not-a-uuid/grants`)
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      expect(service.getResourceGrantDetail).not.toHaveBeenCalled();
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const previousNodeEnv = process.env.NODE_ENV;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(
      permissions === null ? null : makeUserContext(permissions),
    ),
  };

  process.env.NODE_ENV = "test";

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [SecretAuthorizationModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(SecretAuthorizationService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service);
  } finally {
    if (app) {
      await app.close();
    }

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
};
