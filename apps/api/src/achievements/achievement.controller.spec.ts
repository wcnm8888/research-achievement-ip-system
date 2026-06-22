import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import { AchievementService } from "./achievement.service";
import { AchievementsModule } from "./achievements.module";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  ContributorTypeCode,
  SecretLevelCode,
} from "./domain/achievement-domain.types";
import {
  AchievementAccessDeniedError,
  AchievementConflictError,
  AchievementInvalidPayloadError,
  AchievementInvalidStateError,
  AchievementNotFoundError,
  AchievementPermissionDeniedError,
  AchievementUnsupportedOperationError,
} from "./domain/achievement-service.errors";

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

describe("AchievementController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp([], async (app, service, getFindFirstCallCount) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/achievements")
        .send(makeCreatePayload())
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.createDraft).not.toHaveBeenCalled();
      expect(getFindFirstCallCount()).toBe(0);
    });
  });

  it("returns 403 when static route permission is missing", async () => {
    await withTestApp([], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/achievements")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(service.createDraft).not.toHaveBeenCalled();
    });
  });

  it("lists achievements with user_context:read and transformed query values", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/achievements")
        .query({
          status: AchievementStatusCode.draft,
          type: AchievementTypeCode.paper,
          keyword: "Paper",
          page: "2",
          pageSize: "10",
        })
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body).toEqual(makeListResult());
      expect(service.list).toHaveBeenCalledWith(expect.any(Object), {
        status: AchievementStatusCode.draft,
        type: AchievementTypeCode.paper,
        keyword: "Paper",
        page: 2,
        pageSize: 10,
      });
      expect(service.getDetail).not.toHaveBeenCalled();
    });
  });

  it("returns 400 for invalid achievement list query values", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/achievements")
        .query({ pageSize: "101" })
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      expect(service.list).not.toHaveBeenCalled();
    });
  });

  it("returns 401 for achievement list when user context is missing", async () => {
    await withTestApp([PermissionCode.userContextRead], async (app, service) => {
      await request(app.getHttpServer() as Server).get("/achievements").expect(401);

      expect(service.list).not.toHaveBeenCalled();
    });
  });

  it("returns 403 for achievement list when user_context:read is missing", async () => {
    await withTestApp([PermissionCode.achievementReadOwn], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/achievements")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(service.list).not.toHaveBeenCalled();
    });
  });

  it("creates a draft with achievement:create and returns 201", async () => {
    await withTestApp([PermissionCode.achievementCreate], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/achievements")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
        .expect(201);

      expect(response.body.id).toBe(ids.achievement);
      expect(service.createDraft).toHaveBeenCalledWith(
        expect.objectContaining<Partial<UserContext>>({
          userId: ids.user,
          departmentId: ids.department,
        }),
        expect.objectContaining({
          title: "Paper draft",
          type: AchievementTypeCode.paper,
        }),
      );
    });
  });

  it("rejects invalid create DTO payloads with 400", async () => {
    await withTestApp([PermissionCode.achievementCreate], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/achievements")
        .set("X-Demo-User-Id", ids.user)
        .send({
          type: AchievementTypeCode.paper,
          title: "Paper draft",
          paperDetail: {},
          unexpectedField: true,
          contributors: [],
        })
        .expect(400);

      expect(service.createDraft).not.toHaveBeenCalled();
    });
  });

  it("reads detail with achievement:read_own", async () => {
    await withTestApp([PermissionCode.achievementReadOwn], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get(`/achievements/${ids.achievement}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(service.getDetail).toHaveBeenCalledWith(expect.any(Object), ids.achievement);
    });
  });

  it("updates a draft with achievement:update_own", async () => {
    await withTestApp([PermissionCode.achievementUpdateOwn], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .patch(`/achievements/${ids.achievement}`)
        .set("X-Demo-User-Id", ids.user)
        .send({ title: "Updated paper draft" })
        .expect(200);

      expect(service.updateDraft).toHaveBeenCalledWith(
        expect.any(Object),
        ids.achievement,
        expect.objectContaining({ title: "Updated paper draft" }),
      );
    });
  });

  it("submits a draft with achievement:submit", async () => {
    await withTestApp([PermissionCode.achievementSubmit], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/submit`)
        .set("X-Demo-User-Id", ids.user)
        .expect(201);

      expect(service.submitDraft).toHaveBeenCalledWith(expect.any(Object), ids.achievement);
    });
  });

  it("voids a draft with achievement:update_own", async () => {
    await withTestApp([PermissionCode.achievementUpdateOwn], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/void`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "Duplicate draft." })
        .expect(201);

      expect(service.voidAchievement).toHaveBeenCalledWith(
        expect.any(Object),
        ids.achievement,
        expect.objectContaining({ reason: "Duplicate draft." }),
      );
    });
  });

  it("rejects invalid void DTO payloads with 400", async () => {
    await withTestApp([PermissionCode.achievementUpdateOwn], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/void`)
        .set("X-Demo-User-Id", ids.user)
        .send({})
        .expect(400);

      expect(service.voidAchievement).not.toHaveBeenCalled();
    });
  });

  it("archives an achievement with achievement:archive", async () => {
    await withTestApp([PermissionCode.achievementArchive], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/achievements/${ids.achievement}/archive`)
        .set("X-Demo-User-Id", ids.user)
        .expect(201);

      expect(service.archiveAchievement).toHaveBeenCalledWith(expect.any(Object), ids.achievement);
    });
  });

  it("maps service errors to HTTP status codes", async () => {
    await withTestApp([PermissionCode.achievementReadOwn], async (app, service) => {
      const cases = [
        {
          error: new AchievementPermissionDeniedError(PermissionCode.achievementReadOwn),
          expectedStatus: 403,
        },
        {
          error: new AchievementAccessDeniedError("No secret grant."),
          expectedStatus: 403,
        },
        {
          error: new AchievementNotFoundError(ids.achievement),
          expectedStatus: 404,
        },
        {
          error: new AchievementConflictError("doi"),
          expectedStatus: 409,
        },
        {
          error: new AchievementInvalidStateError(
            AchievementStatusCode.pendingDepartmentReview,
            AchievementStatusCode.draft,
          ),
          expectedStatus: 409,
        },
        {
          error: new AchievementUnsupportedOperationError("Unsupported."),
          expectedStatus: 422,
        },
        {
          error: new AchievementInvalidPayloadError("Invalid payload."),
          expectedStatus: 422,
        },
      ];

      for (const testCase of cases) {
        service.getDetail.mockRejectedValueOnce(testCase.error);

        await request(app.getHttpServer() as Server)
          .get(`/achievements/${ids.achievement}`)
          .set("X-Demo-User-Id", ids.user)
          .expect(testCase.expectedStatus);
      }
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[],
  callback: TestCallback,
): Promise<void> => {
  let findFirstCallCount = 0;
  let app: INestApplication | null = null;
  const previousNodeEnv = process.env.NODE_ENV;
  const service = createServiceMock();

  process.env.NODE_ENV = "test";

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AchievementsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: async (): Promise<LoadedUserFixture | null> => {
            findFirstCallCount += 1;
            return makeLoadedUser(permissions);
          },
        },
      })
      .overrideProvider(AchievementService)
      .useValue(service)
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
