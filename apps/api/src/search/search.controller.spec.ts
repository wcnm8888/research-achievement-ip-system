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
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import { FeeTypeCode, PayStatusCode } from "../fees/domain/fee-domain.types";
import { SearchTargetTypeCode } from "./domain/search-domain.types";
import { SearchAccessDeniedError } from "./domain/search-errors";
import { SearchService } from "./search.service";
import { SearchModule } from "./search.module";

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

describe("SearchController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.search).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when user_context:read is missing", async () => {
    await withTestApp([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.search).not.toHaveBeenCalled();
    });
  });

  it("delegates search to SearchService with validated query", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .query({
          keyword: " paper ",
          targetTypes: [SearchTargetTypeCode.achievement],
          achievementType: AchievementTypeCode.paper,
          achievementStatus: AchievementStatusCode.archived,
          departmentId: ids.department,
          take: "5",
        })
        .expect(200);

      expect(response.body.total).toBe(2);
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

  it("allows keyword search without target type filter", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
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

  it("rejects invalid enum, invalid UUID, and excessive take query values with 400", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
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

  it("preserves Step 9A redacted response shape", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body.items[0]).toEqual(
        expect.objectContaining({
          targetType: SearchTargetTypeCode.achievement,
          id: ids.achievement,
          title: null,
          identifiers: {},
          redacted: true,
        }),
      );
      expect(response.body.items[0]).not.toHaveProperty("contributors");
      expect(response.body.items[0]).not.toHaveProperty("abstract");
      expect(response.body.items[1]).not.toHaveProperty("amount");
      expect(response.body.items[1]).not.toHaveProperty("voucherNo");
    });
  });

  it("maps SearchAccessDeniedError to 403", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
      service.search.mockRejectedValueOnce(
        new SearchAccessDeniedError("Search access denied."),
      );

      const response = await request(app.getHttpServer() as Server)
        .get("/search")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(response.body.message).toBe("Search access denied.");
    });
  });

  it("uses the identity adapter context at the HTTP boundary", async () => {
    await withTestApp(
      [PermissionCode.userContextRead],
      async (app, service, identityAdapter) => {
        await request(app.getHttpServer() as Server)
          .get("/search")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        expect(identityAdapter.loadUserContext).toHaveBeenCalledWith({
          headers: expect.objectContaining({
            "x-demo-user-id": ids.user,
          }),
        });
        expect(service.search).toHaveBeenCalledTimes(1);
      },
    );
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
      imports: [SearchModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(SearchService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, identityAdapter);
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
