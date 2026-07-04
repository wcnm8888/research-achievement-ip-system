import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  AchievementType,
  ImportFamily,
  ImportJobStatus,
  ImportMode,
} from "@prisma/client";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { ImportJobHistoryReadController } from "./import-job-history-read.controller";
import {
  ImportJobHistoryNotFoundError,
  ImportJobHistoryReadService,
} from "./import-job-history-read.service";
import { ImportsModule } from "./imports.module";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  job: "70000000-0000-4000-8000-000000000001",
};

type ImportJobHistoryReadServiceMock = {
  getImportJob: ReturnType<typeof vi.fn>;
  listImportJobs: ReturnType<typeof vi.fn>;
};

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

const createServiceMock = (): ImportJobHistoryReadServiceMock => ({
  getImportJob: vi.fn().mockResolvedValue({
    id: ids.job,
    family: "ACHIEVEMENT",
    mode: "CREATE_DRAFT_ONLY",
    achievementType: "PAPER",
    status: "SUCCESS",
    acceptedRowCount: 2,
    createdBusinessCount: 2,
    createdCompanionCount: 4,
    auditCount: 2,
    safeErrorCodes: [],
    createdAt: new Date("2026-07-04T01:00:00.000Z"),
    completedAt: new Date("2026-07-04T01:01:00.000Z"),
    latestRun: {
      status: "SUCCESS",
      failureCode: null,
      failureStage: null,
      startedAt: new Date("2026-07-04T01:00:00.000Z"),
      finishedAt: new Date("2026-07-04T01:01:00.000Z"),
    },
    safeSummary: { totalRows: 2 },
    runs: [
      {
        attemptNo: 1,
        trigger: "INITIAL_SUBMIT",
        status: "SUCCESS",
        failureCode: null,
        failureStage: null,
        startedAt: new Date("2026-07-04T01:00:00.000Z"),
        finishedAt: new Date("2026-07-04T01:01:00.000Z"),
        completedBusinessTransactionAt: new Date("2026-07-04T01:01:00.000Z"),
        validationSummary: null,
        applySummary: { totalRows: 2 },
        auditCount: 2,
      },
    ],
  }),
  listImportJobs: vi.fn().mockResolvedValue({
    items: [
      {
        id: ids.job,
        family: "ACHIEVEMENT",
        mode: "CREATE_DRAFT_ONLY",
        achievementType: "PAPER",
        status: "SUCCESS",
        acceptedRowCount: 2,
        createdBusinessCount: 2,
        createdCompanionCount: 4,
        auditCount: 2,
        safeErrorCodes: [],
        createdAt: new Date("2026-07-04T01:00:00.000Z"),
        completedAt: new Date("2026-07-04T01:01:00.000Z"),
        latestRun: {
          status: "SUCCESS",
          failureCode: null,
          failureStage: null,
          startedAt: new Date("2026-07-04T01:00:00.000Z"),
          finishedAt: new Date("2026-07-04T01:01:00.000Z"),
        },
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  }),
});

describe("ImportJobHistoryReadController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses UserContextGuard and PermissionGuard with system:config", () => {
    const guards = Reflect.getMetadata(
      "__guards__",
      ImportJobHistoryReadController,
    ) as unknown[];
    expect(guards).toHaveLength(2);
  });

  it("returns 403 before service execution when system:config is missing", async () => {
    await withTestApp([PermissionCode.achievementCreate], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/import-jobs")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(service.listImportJobs).not.toHaveBeenCalled();
      expect(service.getImportJob).not.toHaveBeenCalled();
    });
  });

  it("lists import jobs for system:config users with parsed filters", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/import-jobs")
        .set("X-Demo-User-Id", ids.user)
        .query({
          family: ImportFamily.ACHIEVEMENT,
          mode: ImportMode.CREATE_DRAFT_ONLY,
          achievementType: AchievementType.PAPER,
          status: ImportJobStatus.SUCCESS,
          createdFrom: "2026-07-04T00:00:00.000Z",
          createdTo: "2026-07-05T00:00:00.000Z",
          page: "1",
          pageSize: "20",
        })
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(service.listImportJobs).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        {
          family: ImportFamily.ACHIEVEMENT,
          mode: ImportMode.CREATE_DRAFT_ONLY,
          achievementType: AchievementType.PAPER,
          status: ImportJobStatus.SUCCESS,
          createdFrom: new Date("2026-07-04T00:00:00.000Z"),
          createdTo: new Date("2026-07-05T00:00:00.000Z"),
          page: 1,
          pageSize: 20,
        },
      );
    });
  });

  it("rejects invalid enum filters and excessive pageSize with 400", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/import-jobs")
        .set("X-Demo-User-Id", ids.user)
        .query({ family: "UNKNOWN" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/import-jobs")
        .set("X-Demo-User-Id", ids.user)
        .query({ pageSize: "101" })
        .expect(400);

      expect(service.listImportJobs).not.toHaveBeenCalled();
      expect(service.getImportJob).not.toHaveBeenCalled();
    });
  });

  it("returns 404 for missing detail rows", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      service.getImportJob.mockRejectedValueOnce(
        new ImportJobHistoryNotFoundError(ids.job),
      );

      await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(404);
    });
  });

  it("returns detail DTO without raw audit ids or forbidden fields", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      const serialized = JSON.stringify(response.body);
      expect(response.body.runs[0].auditCount).toBe(2);
      expect(serialized).not.toContain("auditLogIds");
      expect(serialized).not.toContain("idempotencyKeyHash");
      expect(serialized).not.toContain("scopeHash");
      expect(serialized).not.toContain("fileFingerprint");
      expect(serialized).not.toContain("operatorUserId");
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: (
    app: INestApplication,
    service: ImportJobHistoryReadServiceMock,
  ) => Promise<void>,
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
      imports: [ImportsModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(ImportJobHistoryReadService)
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
