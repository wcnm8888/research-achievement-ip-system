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
import { DepartmentImportDryRunService } from "./department-import-dry-run.service";
import { ImportsModule } from "./imports.module";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

type DepartmentImportDryRunServiceMock = {
  dryRunDepartmentCsv: ReturnType<typeof vi.fn>;
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

const createServiceMock = (): DepartmentImportDryRunServiceMock => ({
  dryRunDepartmentCsv: vi.fn().mockResolvedValue({
    importType: "DEPARTMENT_METADATA",
    dryRun: true,
    file: {
      name: "departments.csv",
      size: 35,
      mimeType: "text/csv",
      encoding: "utf-8",
    },
    columns: {
      required: ["code", "name"],
      optional: ["parentCode"],
      received: ["code", "name"],
    },
    summary: {
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      warningRows: 0,
      createCandidates: 1,
      existingCodeRows: 0,
    },
    rows: [],
  }),
});

describe("DepartmentImportDryRunController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/imports/departments/dry-run")
        .attach("file", csvBuffer(), {
          filename: "departments.csv",
          contentType: "text/csv",
        })
        .expect(401);

      expect(service.dryRunDepartmentCsv).not.toHaveBeenCalled();
    });
  });

  it("returns 403 before parsing or service execution when permission is missing", async () => {
    await withTestApp([PermissionCode.achievementCreate], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/imports/departments/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach("file", Buffer.from("PK not a csv workbook"), {
          filename: "departments.csv",
          contentType: "text/csv",
        })
        .expect(403);

      expect(service.dryRunDepartmentCsv).not.toHaveBeenCalled();
    });
  });

  it("accepts CSV multipart files and delegates to the dry-run service", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/imports/departments/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach("file", csvBuffer(), {
          filename: "departments.csv",
          contentType: "text/csv",
        })
        .expect(201);

      expect(response.body.importType).toBe("DEPARTMENT_METADATA");
      expect(response.body.dryRun).toBe(true);
      expect(service.dryRunDepartmentCsv).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        expect.objectContaining({
          originalName: "departments.csv",
          mimeType: "text/csv",
          size: csvBuffer().byteLength,
          buffer: expect.any(Buffer),
        }),
      );
    });
  });

  it("rejects missing files and unsupported non-CSV uploads", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post("/imports/departments/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/imports/departments/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach("file", csvBuffer(), {
          filename: "departments.xlsx",
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        .expect(415);

      expect(service.dryRunDepartmentCsv).not.toHaveBeenCalled();
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: (
    app: INestApplication,
    service: DepartmentImportDryRunServiceMock,
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
      .overrideProvider(DepartmentImportDryRunService)
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

const csvBuffer = (): Buffer => Buffer.from("code,name\nAI_RESEARCH,AI Research\n", "utf8");
