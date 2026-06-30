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
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import { FeeTypeCode, PayStatusCode } from "../fees/domain/fee-domain.types";
import { SearchTargetTypeCode } from "./domain/search-domain.types";
import { SearchService } from "./search.service";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type SearchServiceMock = {
  search: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: SearchServiceMock,
  identityAdapter: { loadUserContext: ReturnType<typeof vi.fn> },
) => Promise<void>;

const createdAt = new Date("2026-06-18T00:00:00.000Z");
const updatedAt = new Date("2026-06-18T01:00:00.000Z");

const makeUserContext = (
  permissions: readonly PermissionCode[],
): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.researcher],
  permissionCodes: permissions,
  roleScopes: [
    {
      roleCode: RoleCode.researcher,
      scopeType: ScopeType.department,
      scopeKey: ids.department,
      departmentId: ids.department,
    },
  ],
  scopedDepartmentIds: [ids.department],
});

const makeSearchResult = () => ({
  items: [
    {
      targetType: SearchTargetTypeCode.achievement,
      id: ids.achievement,
      type: AchievementTypeCode.paper,
      status: AchievementStatusCode.archived,
      departmentId: ids.department,
      secretLevel: "SECRET",
      title: null,
      identifiers: {},
      redacted: true,
      createdAt,
      updatedAt,
    },
    {
      targetType: SearchTargetTypeCode.feeRecord,
      id: ids.feeRecord,
      achievementId: ids.achievement,
      departmentId: ids.department,
      feeType: FeeTypeCode.patentAnnual,
      payStatus: PayStatusCode.pending,
      dueDate: new Date("2026-07-01T00:00:00.000Z"),
      paidDate: null,
      createdAt,
      updatedAt,
    },
  ],
  total: 2,
});

const createServiceMock = (): SearchServiceMock => ({
  search: vi.fn().mockResolvedValue(makeSearchResult()),
});

describe("Search routes through AppModule", () => {
  it("keeps the health route available after search module integration", async () => {
    await withAppModule(null, async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/health")
        .expect(200);

      expect(response.body).toEqual({
        service: "research-achievement-ip-api",
        status: "ok",
      });
    });
  });

  it("exposes search through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .query({
          keyword: " paper ",
          targetTypes: SearchTargetTypeCode.achievement,
          achievementType: AchievementTypeCode.paper,
          achievementStatus: AchievementStatusCode.archived,
          departmentId: ids.department,
          take: "5",
        })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(service.search).toHaveBeenCalledOnce();
      expect(service.search).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        expect.objectContaining({
          keyword: " paper ",
          targetTypes: [SearchTargetTypeCode.achievement],
          achievementType: AchievementTypeCode.paper,
          achievementStatus: AchievementStatusCode.archived,
          departmentId: ids.department,
          take: 5,
        }),
      );
    });
  });

  it("allows keyword search through AppModule without target type filter", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .query({
          keyword: "healthcheck",
        })
        .expect(200);

      expect(service.search).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        expect.objectContaining({
          keyword: "healthcheck",
        }),
      );
      expect(service.search.mock.calls[0]?.[1].targetTypes).toBeUndefined();
    });
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule(null, async (app, service, identityAdapter) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(identityAdapter.loadUserContext).toHaveBeenCalledOnce();
      expect(service.search).not.toHaveBeenCalled();
    });
  });

  it("returns 403 through AppModule when user_context:read is missing", async () => {
    await withAppModule([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.search).not.toHaveBeenCalled();
    });
  });

  it("rejects invalid query values through AppModule", async () => {
    await withAppModule([PermissionCode.userContextRead], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .query({ targetTypes: "UNKNOWN" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .query({ achievementType: "UNKNOWN" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .query({ departmentId: "not-a-uuid" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .query({ take: "51" })
        .expect(400);

      expect(service.search).not.toHaveBeenCalled();
    });
  });
});

const withAppModule = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(
      permissions === null ? null : makeUserContext(permissions),
    ),
  };

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SearchService)
      .useValue(service)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, identityAdapter);
  } finally {
    if (app) {
      await app.close();
    }
  }
};
