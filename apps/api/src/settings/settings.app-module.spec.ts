import { ApiIntegrationProvider } from "@prisma/client";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppModule } from "../app.module";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { ApiIntegrationSettingsService } from "./api-integration-settings.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  integration: "70000000-0000-4000-8000-000000000001",
};

type ApiIntegrationSettingsServiceMock = {
  listApiIntegrations: ReturnType<typeof vi.fn>;
};

const makeUserContext = (): UserContext => ({
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
});

const createServiceMock = (): ApiIntegrationSettingsServiceMock => ({
  listApiIntegrations: vi.fn().mockResolvedValue({
    items: [
      {
        id: ids.integration,
        code: "DOI_LOOKUP",
        provider: ApiIntegrationProvider.DOI,
        enabled: true,
        timeoutMs: 3000,
        configRef: "doi.lookup.default",
        createdAt: new Date("2026-06-29T00:00:00.000Z"),
        updatedAt: new Date("2026-06-29T00:00:00.000Z"),
        archivedAt: null,
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  }),
});

describe("Settings routes through AppModule", () => {
  it("keeps health route available after settings module integration", async () => {
    await withAppModule(async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/health")
        .expect(200);

      expect(response.body.status).toBe("ok");
    });
  });

  it("exposes api integration settings through AppModule", async () => {
    await withAppModule(async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/settings/api-integrations")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(service.listApiIntegrations).toHaveBeenCalledOnce();
    });
  });
});

const withAppModule = async (
  callback: (
    app: INestApplication,
    service: ApiIntegrationSettingsServiceMock,
  ) => Promise<void>,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(makeUserContext()),
  };

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ApiIntegrationSettingsService)
      .useValue(service)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service);
  } finally {
    if (app) {
      await app.close();
    }
  }
};
