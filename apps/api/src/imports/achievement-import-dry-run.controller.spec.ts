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
  AchievementImportApplyRejectedError,
  AchievementImportDryRunService,
  InvalidAchievementImportApplyModeError,
} from "./achievement-import-dry-run.service";
import { ImportsModule } from "./imports.module";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

type AchievementImportDryRunServiceMock = {
  applyAchievementCsv: ReturnType<typeof vi.fn>;
  dryRunAchievementCsv: ReturnType<typeof vi.fn>;
};

const makeUserContext = (permissions: readonly PermissionCode[]): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: permissions.includes(PermissionCode.systemConfig)
    ? [RoleCode.systemAdmin]
    : [RoleCode.departmentAdmin],
  permissionCodes: permissions,
  roleScopes: [
    {
      roleCode: permissions.includes(PermissionCode.systemConfig)
        ? RoleCode.systemAdmin
        : RoleCode.departmentAdmin,
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

const createServiceMock = (): AchievementImportDryRunServiceMock => ({
  applyAchievementCsv: vi.fn().mockResolvedValue({
    importType: "ACHIEVEMENT",
    dryRun: false,
    mode: "CREATE_DRAFT_ONLY",
    file: {
      name: "achievements.csv",
      size: csvBuffer().byteLength,
      mimeType: "text/csv",
      encoding: "utf-8",
    },
    summary: {
      totalRows: 1,
      createdAchievementsCount: 1,
      createdPaperDetailsCount: 1,
      createdContributorsCount: 1,
      skippedRows: 0,
      failedRows: 0,
      errorCount: 0,
      warningCount: 0,
      auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
    },
    errors: [],
    rows: [
      {
        rowNumber: 2,
        status: "CREATED",
        createdAchievementId: "30000000-0000-4000-8000-000000000001",
        type: "PAPER",
        achievementStatus: "DRAFT",
        departmentId: ids.department,
        ownerUserId: ids.user,
        contributorCount: 1,
        auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
      },
    ],
  }),
  dryRunAchievementCsv: vi.fn().mockResolvedValue({
    importType: "ACHIEVEMENT",
    dryRun: true,
    file: {
      name: "achievements.csv",
      size: csvBuffer().byteLength,
      mimeType: "text/csv",
      encoding: "utf-8",
    },
    columns: {
      required: ["type", "title", "departmentCode", "contributors"],
      optional: ["ownerEmail", "ownerEmployeeNo"],
      received: ["type", "title", "ownerEmail", "departmentCode", "contributors"],
    },
    summary: {
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      warningRows: 0,
      createDraftCandidates: 1,
      duplicateIdentifierRows: 0,
      dbConflictRows: 0,
      ownerEmployeeNoLookup: "NOT_AVAILABLE",
    },
    rows: [],
  }),
});

describe("AchievementImportDryRunController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/achievements/import/dry-run")
        .attach("file", csvBuffer(), {
          filename: "achievements.csv",
          contentType: "text/csv",
        })
        .expect(401);

      expect(service.dryRunAchievementCsv).not.toHaveBeenCalled();
      expect(service.applyAchievementCsv).not.toHaveBeenCalled();
    });
  });

  it("returns 403 before parsing or service execution when system config permission is missing", async () => {
    await withTestApp([PermissionCode.achievementCreate], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/achievements/import/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach("file", Buffer.from("PK not a csv workbook"), {
          filename: "achievements.csv",
          contentType: "text/csv",
        })
        .expect(403);

      expect(service.dryRunAchievementCsv).not.toHaveBeenCalled();
      expect(service.applyAchievementCsv).not.toHaveBeenCalled();
    });
  });

  it("accepts CSV multipart files and delegates to the dry-run service", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/achievements/import/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach("file", csvBuffer(), {
          filename: "achievements.csv",
          contentType: "text/csv",
        })
        .expect(201);

      expect(response.body.importType).toBe("ACHIEVEMENT");
      expect(response.body.dryRun).toBe(true);
      expect(service.dryRunAchievementCsv).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        expect.objectContaining({
          originalName: "achievements.csv",
          mimeType: "text/csv",
          size: csvBuffer().byteLength,
          buffer: expect.any(Buffer),
        }),
      );
      expect(service.applyAchievementCsv).not.toHaveBeenCalled();
    });
  });

  it("rejects missing files and unsupported non-CSV uploads", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/achievements/import/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/achievements/import/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach("file", csvBuffer(), {
          filename: "achievements.xlsx",
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        .expect(415);

      expect(service.dryRunAchievementCsv).not.toHaveBeenCalled();
      expect(service.applyAchievementCsv).not.toHaveBeenCalled();
    });
  });

  it("accepts CSV multipart files and delegates to the apply service", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/achievements/import/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "CREATE_DRAFT_ONLY")
        .attach("file", csvBuffer(), {
          filename: "achievements.csv",
          contentType: "text/csv",
        })
        .expect(201);

      expect(response.body.importType).toBe("ACHIEVEMENT");
      expect(response.body.dryRun).toBe(false);
      expect(response.body.mode).toBe("CREATE_DRAFT_ONLY");
      expect(service.applyAchievementCsv).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        expect.objectContaining({
          originalName: "achievements.csv",
          mimeType: "text/csv",
          size: csvBuffer().byteLength,
          buffer: expect.any(Buffer),
        }),
        "CREATE_DRAFT_ONLY",
      );
    });
  });

  it("returns 400 for rejected apply summaries and unsupported modes", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      service.applyAchievementCsv.mockRejectedValueOnce(
        new AchievementImportApplyRejectedError(
          "Achievement import apply requires only PAPER CREATE_DRAFT candidates with DOI.",
          {
            importType: "ACHIEVEMENT",
            dryRun: false,
            mode: "CREATE_DRAFT_ONLY",
            file: {
              name: "achievements.csv",
              size: csvBuffer().byteLength,
              mimeType: "text/csv",
              encoding: "utf-8",
            },
            rows: [],
            summary: {
              totalRows: 1,
              createdAchievementsCount: 0,
              createdPaperDetailsCount: 0,
              createdContributorsCount: 0,
              skippedRows: 0,
              failedRows: 1,
              errorCount: 1,
              warningCount: 0,
              auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
            },
            errors: [
              {
                rowNumber: 2,
                field: "doi",
                code: "REQUIRED",
                message: "missing",
              },
            ],
          } as never,
        ),
      );

      await request(app.getHttpServer() as Server)
        .post("/achievements/import/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "CREATE_DRAFT_ONLY")
        .attach("file", csvBuffer(), {
          filename: "achievements.csv",
          contentType: "text/csv",
        })
        .expect(400);

      service.applyAchievementCsv.mockRejectedValueOnce(
        new InvalidAchievementImportApplyModeError("NOPE"),
      );
      await request(app.getHttpServer() as Server)
        .post("/achievements/import/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "NOPE")
        .attach("file", csvBuffer(), {
          filename: "achievements.csv",
          contentType: "text/csv",
        })
        .expect(400);
    });
  });

  it("rejects apply missing files and unsupported non-CSV uploads", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/achievements/import/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "CREATE_DRAFT_ONLY")
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/achievements/import/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "CREATE_DRAFT_ONLY")
        .attach("file", csvBuffer(), {
          filename: "achievements.xlsx",
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        .expect(415);

      expect(service.applyAchievementCsv).not.toHaveBeenCalled();
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: (
    app: INestApplication,
    service: AchievementImportDryRunServiceMock,
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
      .overrideProvider(AchievementImportDryRunService)
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

const csvBuffer = (): Buffer =>
  Buffer.from(
    "type,title,ownerEmail,departmentCode,contributors\nPAPER,Paper,owner@example.org,RD,A|AUTHOR|||Lab\n",
    "utf8",
  );
