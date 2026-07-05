import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  AchievementType,
  ImportFamily,
  ImportJobStatus,
  ImportJobItemPlannedAction,
  ImportJobItemStatus,
  ImportJobItemTargetType,
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
  run: "71000000-0000-4000-8000-000000000001",
};

type ImportJobHistoryReadServiceMock = {
  getImportJob: ReturnType<typeof vi.fn>;
  listImportJobItems: ReturnType<typeof vi.fn>;
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
  listImportJobItems: vi.fn().mockResolvedValue({
    items: [
      {
        rowNumber: 2,
        plannedAction: "CREATE_DRAFT",
        status: "APPLIED",
        safeCode: "ROW_APPLIED",
        targetType: "ACHIEVEMENT",
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
      expect(service.listImportJobItems).not.toHaveBeenCalled();

      await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}/items`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(service.listImportJobs).not.toHaveBeenCalled();
      expect(service.getImportJob).not.toHaveBeenCalled();
      expect(service.listImportJobItems).not.toHaveBeenCalled();
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

  it("lists import job items for system:config users with parsed safe filters", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}/items`)
        .set("X-Demo-User-Id", ids.user)
        .query({
          runId: ids.run,
          status: ImportJobItemStatus.APPLIED,
          plannedAction: ImportJobItemPlannedAction.CREATE_DRAFT,
          targetType: ImportJobItemTargetType.ACHIEVEMENT,
          safeCode: "ROW_APPLIED",
          page: "2",
          pageSize: "10",
        })
        .expect(200);

      expect(response.body).toEqual({
        items: [
          {
            rowNumber: 2,
            plannedAction: "CREATE_DRAFT",
            status: "APPLIED",
            safeCode: "ROW_APPLIED",
            targetType: "ACHIEVEMENT",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      });
      expect(JSON.stringify(response.body)).not.toContain("targetId");
      expect(JSON.stringify(response.body)).not.toContain("jobId");
      expect(JSON.stringify(response.body)).not.toContain("runId");
      expect(service.listImportJobItems).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        ids.job,
        {
          runId: ids.run,
          status: ImportJobItemStatus.APPLIED,
          plannedAction: ImportJobItemPlannedAction.CREATE_DRAFT,
          targetType: ImportJobItemTargetType.ACHIEVEMENT,
          safeCode: "ROW_APPLIED",
          page: 2,
          pageSize: 10,
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
      expect(service.listImportJobItems).not.toHaveBeenCalled();
    });
  });

  it("rejects invalid item route params, filters, and extra query fields with 400", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/import-jobs/not-a-uuid/items")
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}/items`)
        .set("X-Demo-User-Id", ids.user)
        .query({ status: "UNKNOWN" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}/items`)
        .set("X-Demo-User-Id", ids.user)
        .query({ extra: "blocked" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}/items`)
        .set("X-Demo-User-Id", ids.user)
        .query({ safeCode: "unsafe value with spaces" })
        .expect(400);

      expect(service.listImportJobs).not.toHaveBeenCalled();
      expect(service.getImportJob).not.toHaveBeenCalled();
      expect(service.listImportJobItems).not.toHaveBeenCalled();
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

  it("returns 404 for missing item parent job", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      service.listImportJobItems.mockRejectedValueOnce(
        new ImportJobHistoryNotFoundError(ids.job),
      );

      await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}/items`)
        .set("X-Demo-User-Id", ids.user)
        .expect(404);
    });
  });

  it("returns empty item lists without forbidden fields", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      service.listImportJobItems.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });

      const response = await request(app.getHttpServer() as Server)
        .get(`/import-jobs/${ids.job}/items`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("targetId");
      expect(serialized).not.toContain("jobId");
      expect(serialized).not.toContain("runId");
      expect(serialized).not.toContain("safeSummary");
      expect(serialized).not.toContain("auditLogIds");
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
