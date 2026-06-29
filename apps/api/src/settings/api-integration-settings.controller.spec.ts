import { ApiIntegrationProvider } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { ApiIntegrationSettingsService } from "./api-integration-settings.service";
import { SettingsModule } from "./settings.module";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  integration: "70000000-0000-4000-8000-000000000001",
};

const now = new Date("2026-06-29T00:00:00.000Z");

type ApiIntegrationSettingsServiceMock = {
  listApiIntegrations: ReturnType<typeof vi.fn>;
  getApiIntegration: ReturnType<typeof vi.fn>;
  createApiIntegration: ReturnType<typeof vi.fn>;
  updateApiIntegration: ReturnType<typeof vi.fn>;
  archiveApiIntegration: ReturnType<typeof vi.fn>;
  restoreApiIntegration: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: ApiIntegrationSettingsServiceMock,
) => Promise<void>;

const makeUserContext = (permissions: readonly PermissionCode[]): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: permissions.includes(PermissionCode.systemConfig)
    ? [RoleCode.systemAdmin]
    : [RoleCode.researcher],
  permissionCodes: permissions,
  roleScopes: [
    {
      roleCode: permissions.includes(PermissionCode.systemConfig)
        ? RoleCode.systemAdmin
        : RoleCode.researcher,
      scopeType: permissions.includes(PermissionCode.systemConfig)
        ? ScopeType.global
        : ScopeType.department,
      scopeKey: permissions.includes(PermissionCode.systemConfig)
        ? "GLOBAL"
        : ids.department,
      departmentId: permissions.includes(PermissionCode.systemConfig)
        ? null
        : ids.department,
    },
  ],
  scopedDepartmentIds: [ids.department],
});

const makeApiIntegration = (overrides = {}) => ({
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

const createServiceMock = (): ApiIntegrationSettingsServiceMock => ({
  listApiIntegrations: vi.fn().mockResolvedValue({
    items: [makeApiIntegration()],
    total: 1,
    page: 1,
    pageSize: 20,
  }),
  getApiIntegration: vi.fn().mockResolvedValue(makeApiIntegration()),
  createApiIntegration: vi.fn().mockResolvedValue(makeApiIntegration()),
  updateApiIntegration: vi.fn().mockResolvedValue(
    makeApiIntegration({ timeoutMs: 5000 }),
  ),
  archiveApiIntegration: vi.fn().mockResolvedValue(
    makeApiIntegration({ enabled: false, archivedAt: now }),
  ),
  restoreApiIntegration: vi.fn().mockResolvedValue(makeApiIntegration()),
});

describe("ApiIntegrationSettingsController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/settings/api-integrations")
        .expect(401);

      expect(service.listApiIntegrations).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when system config permission is missing", async () => {
    await withTestApp([PermissionCode.achievementCreate], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      await request(app.getHttpServer() as Server)
        .post("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .send({ code: "DOI_LOOKUP", provider: ApiIntegrationProvider.DOI })
        .expect(403);

      expect(service.listApiIntegrations).not.toHaveBeenCalled();
      expect(service.createApiIntegration).not.toHaveBeenCalled();
    });
  });

  it("lets admin list, read, create, update, archive, and restore integrations", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .query({
          keyword: "DOI",
          provider: ApiIntegrationProvider.DOI,
          enabled: "true",
          includeArchived: "false",
          page: "1",
          pageSize: "20",
        })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .get(`/settings/api-integrations/${ids.integration}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      await request(app.getHttpServer() as Server)
        .post("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .send({
          code: "DOI_LOOKUP",
          provider: ApiIntegrationProvider.DOI,
          enabled: true,
          timeoutMs: 3000,
          configRef: "doi.lookup.default",
        })
        .expect(201);

      await request(app.getHttpServer() as Server)
        .patch(`/settings/api-integrations/${ids.integration}`)
        .set("X-Demo-User-Id", ids.user)
        .send({ timeoutMs: 5000, configRef: null })
        .expect(200);

      await request(app.getHttpServer() as Server)
        .post(`/settings/api-integrations/${ids.integration}/archive`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "local acceptance" })
        .expect(201);

      await request(app.getHttpServer() as Server)
        .post(`/settings/api-integrations/${ids.integration}/restore`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "local acceptance" })
        .expect(201);

      expect(service.listApiIntegrations).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        expect.objectContaining({ page: 1, pageSize: 20, enabled: true }),
      );
      expect(service.getApiIntegration).toHaveBeenCalledWith(
        expect.any(Object),
        ids.integration,
      );
      expect(service.createApiIntegration).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ code: "DOI_LOOKUP" }),
      );
      expect(service.updateApiIntegration).toHaveBeenCalledWith(
        expect.any(Object),
        ids.integration,
        expect.objectContaining({ timeoutMs: 5000, configRef: null }),
      );
      expect(service.archiveApiIntegration).toHaveBeenCalledWith(
        expect.any(Object),
        ids.integration,
        { reason: "local acceptance" },
      );
      expect(service.restoreApiIntegration).toHaveBeenCalledWith(
        expect.any(Object),
        ids.integration,
        { reason: "local acceptance" },
      );
    });
  });

  it("rejects invalid provider, timeout, empty code, and extra fields", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .send({ code: "DOI_LOOKUP", provider: "NOT_A_PROVIDER" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .send({ code: "DOI_LOOKUP", provider: ApiIntegrationProvider.DOI, timeoutMs: 50 })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .send({ code: "", provider: ApiIntegrationProvider.DOI })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .patch(`/settings/api-integrations/${ids.integration}`)
        .set("X-Demo-User-Id", ids.user)
        .send({ unexpectedField: "not-allowed" })
        .expect(400);

      expect(service.createApiIntegration).not.toHaveBeenCalled();
      expect(service.updateApiIntegration).not.toHaveBeenCalled();
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
      imports: [SettingsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(ApiIntegrationSettingsService)
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
