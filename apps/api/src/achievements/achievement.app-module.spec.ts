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
import { AchievementService } from "./achievement.service";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  ContributorTypeCode,
  SecretLevelCode,
} from "./domain/achievement-domain.types";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

type LoadedUserFixture = {
  id: string;
  departmentId: string;
  userRoles: Array<{
    departmentId: string | null;
    scopeKey: string;
    scopeType: ScopeType;
    role: {
      id: string;
      code: RoleCode;
      rolePermissions: Array<{
        permission: {
          code: PermissionCode;
          status: "ACTIVE";
        };
      }>;
    };
  }>;
};

type AchievementServiceMock = {
  list: ReturnType<typeof vi.fn>;
  createDraft: ReturnType<typeof vi.fn>;
  getDetail: ReturnType<typeof vi.fn>;
  updateDraft: ReturnType<typeof vi.fn>;
  submitDraft: ReturnType<typeof vi.fn>;
  voidAchievement: ReturnType<typeof vi.fn>;
  archiveAchievement: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: AchievementServiceMock,
  getFindFirstCallCount: () => number,
) => Promise<void>;

const makeAggregate = () => ({
  id: ids.achievement,
  type: AchievementTypeCode.paper,
  title: "Paper draft",
  status: AchievementStatusCode.draft,
  secretLevel: SecretLevelCode.internal,
  departmentId: ids.department,
  ownerUserId: ids.user,
  submittedById: null,
  createdById: ids.user,
  updatedById: ids.user,
  archivedById: null,
  voidedById: null,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  submittedAt: null,
  archivedAt: null,
  voidedAt: null,
  voidReason: null,
  paperDetail: { doi: "10.1234/example" },
  patentDetail: null,
  softwareCopyrightDetail: null,
  contributors: [],
});

const makeStateResult = (
  status: AchievementStatusCode = AchievementStatusCode.pendingDepartmentReview,
) => ({
  id: ids.achievement,
  status,
  departmentId: ids.department,
  ownerUserId: ids.user,
  submittedById: ids.user,
  updatedById: ids.user,
  archivedById: null,
  voidedById: null,
  version: 2,
  submittedAt: "2026-01-02T00:00:00.000Z",
  archivedAt: null,
  voidedAt: null,
  voidReason: null,
});

const makeCreatePayload = () => ({
  type: AchievementTypeCode.paper,
  title: "Paper draft",
  secretLevel: SecretLevelCode.internal,
  paperDetail: {
    doi: "10.1234/example",
  },
  contributors: [
    {
      name: "Author One",
      contributorType: ContributorTypeCode.author,
      sortOrder: 1,
    },
  ],
});

const makeListResult = () => ({
  items: [
    {
      id: ids.achievement,
      type: AchievementTypeCode.paper,
      title: "Paper draft",
      status: AchievementStatusCode.draft,
      secretLevel: SecretLevelCode.internal,
      departmentId: ids.department,
      ownerUserId: ids.user,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      submittedAt: null,
      archivedAt: null,
      voidedAt: null,
      isRestricted: false,
      isRedacted: false,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
});

const createServiceMock = (): AchievementServiceMock => ({
  list: vi.fn().mockResolvedValue(makeListResult()),
  createDraft: vi.fn().mockResolvedValue(makeAggregate()),
  getDetail: vi.fn().mockResolvedValue(makeAggregate()),
  updateDraft: vi.fn().mockResolvedValue({ ...makeAggregate(), version: 2 }),
  submitDraft: vi.fn().mockResolvedValue(makeStateResult()),
  voidAchievement: vi.fn().mockResolvedValue(makeStateResult(AchievementStatusCode.voided)),
  archiveAchievement: vi.fn().mockResolvedValue(makeStateResult(AchievementStatusCode.archived)),
});

describe("Achievement routes through AppModule", () => {
  it("keeps the health route available after achievements module integration", async () => {
    await withAppModule([], async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/health")
        .expect(200);

      expect(response.body).toEqual({
        service: "research-achievement-ip-api",
        status: "ok",
      });
    });
  });

  it("exposes all achievement routes through AppModule", async () => {
    await withAppModule(
      [
        PermissionCode.userContextRead,
        PermissionCode.achievementCreate,
        PermissionCode.achievementReadOwn,
        PermissionCode.achievementUpdateOwn,
        PermissionCode.achievementSubmit,
        PermissionCode.achievementArchive,
      ],
      async (app, service) => {
        await request(app.getHttpServer() as Server)
          .get("/achievements")
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .post("/achievements")
          .set("X-Demo-User-Id", ids.user)
          .send(makeCreatePayload())
          .expect(201);

        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}`)
          .set("X-Demo-User-Id", ids.user)
          .expect(200);

        await request(app.getHttpServer() as Server)
          .patch(`/achievements/${ids.achievement}`)
          .set("X-Demo-User-Id", ids.user)
          .send({ title: "Updated paper draft" })
          .expect(200);

        await request(app.getHttpServer() as Server)
          .post(`/achievements/${ids.achievement}/submit`)
          .set("X-Demo-User-Id", ids.user)
          .expect(201);

        await request(app.getHttpServer() as Server)
          .post(`/achievements/${ids.achievement}/void`)
          .set("X-Demo-User-Id", ids.user)
          .send({ reason: "Duplicate draft." })
          .expect(201);

        await request(app.getHttpServer() as Server)
          .post(`/achievements/${ids.achievement}/archive`)
          .set("X-Demo-User-Id", ids.user)
          .expect(201);

        expect(service.list).toHaveBeenCalledOnce();
        expect(service.createDraft).toHaveBeenCalledOnce();
        expect(service.getDetail).toHaveBeenCalledOnce();
        expect(service.updateDraft).toHaveBeenCalledOnce();
        expect(service.submitDraft).toHaveBeenCalledOnce();
        expect(service.voidAchievement).toHaveBeenCalledOnce();
        expect(service.archiveAchievement).toHaveBeenCalledOnce();
      },
    );
  });

  it("returns 401 through AppModule when user context is missing", async () => {
    await withAppModule([PermissionCode.achievementCreate], async (
      app,
      service,
      getFindFirstCallCount,
    ) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/achievements")
        .send(makeCreatePayload())
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.createDraft).not.toHaveBeenCalled();
      expect(getFindFirstCallCount()).toBe(0);
    });
  });

  it("returns 403 through AppModule when achievement list static permission is missing", async () => {
    await withAppModule([PermissionCode.achievementReadOwn], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/achievements")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(service.list).not.toHaveBeenCalled();
    });
  });

  it("returns 403 through AppModule when static permission is missing", async () => {
    await withAppModule([], async (app, service, getFindFirstCallCount) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/achievements")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.createDraft).not.toHaveBeenCalled();
      expect(getFindFirstCallCount()).toBe(1);
    });
  });
});

const withAppModule = async (
  permissions: readonly PermissionCode[],
  callback: TestCallback,
): Promise<void> => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "test";

  let findFirstCallCount = 0;
  let app: INestApplication | null = null;
  const service = createServiceMock();

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AchievementService)
      .useValue(service)
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: async (): Promise<LoadedUserFixture | null> => {
            findFirstCallCount += 1;
            return makeLoadedUser(permissions);
          },
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, () => findFirstCallCount);
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

const makeLoadedUser = (
  permissions: readonly PermissionCode[],
): LoadedUserFixture => ({
  id: ids.user,
  departmentId: ids.department,
  userRoles: [
    {
      departmentId: null,
      scopeKey: "GLOBAL",
      scopeType: ScopeType.global,
      role: {
        id: ids.role,
        code: RoleCode.researcher,
        rolePermissions: permissions.map((permission) => ({
          permission: {
            code: permission,
            status: "ACTIVE",
          },
        })),
      },
    },
  ],
});
