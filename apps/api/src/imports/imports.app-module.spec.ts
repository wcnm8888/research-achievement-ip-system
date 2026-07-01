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
import { DepartmentImportDryRunService } from "./department-import-dry-run.service";
import { UserAccountImportDryRunService } from "./user-account-import-dry-run.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

type DepartmentImportDryRunServiceMock = {
  dryRunDepartmentCsv: ReturnType<typeof vi.fn>;
};

type UserAccountImportDryRunServiceMock = {
  dryRunUserAccountCsv: ReturnType<typeof vi.fn>;
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

const createUserAccountServiceMock = (): UserAccountImportDryRunServiceMock => ({
  dryRunUserAccountCsv: vi.fn().mockResolvedValue({
    importType: "USER_ACCOUNT",
    dryRun: true,
    file: {
      name: "user-accounts.csv",
      size: 75,
      mimeType: "text/csv",
      encoding: "utf-8",
    },
    columns: {
      required: ["email", "displayName", "departmentCode", "roleCode"],
      optional: ["employeeNo", "scopeType", "scopeDepartmentCode", "status"],
      received: ["email", "displayName", "departmentCode", "roleCode"],
    },
    summary: {
      totalRows: 1,
      validRows: 1,
      errorRows: 0,
      warningRows: 0,
      createCandidates: 1,
      existingUserRows: 0,
      existingRoleAssignmentRows: 0,
      reactivationCandidateRows: 0,
      employeeNoDbConflictCheck: "NOT_AVAILABLE",
    },
    rows: [],
  }),
});

describe("Import routes through AppModule", () => {
  it("exposes department import dry-run through AppModule", async () => {
    await withAppModule(async (app, services) => {
      await request(app.getHttpServer() as Server)
        .post("/imports/departments/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach("file", Buffer.from("code,name\nAI_RESEARCH,AI Research\n"), {
          filename: "departments.csv",
          contentType: "text/csv",
        })
        .expect(201);

      expect(services.department.dryRunDepartmentCsv).toHaveBeenCalledOnce();
    });
  });

  it("exposes user account import dry-run through AppModule", async () => {
    await withAppModule(async (app, services) => {
      await request(app.getHttpServer() as Server)
        .post("/users/import/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach(
          "file",
          Buffer.from("email,displayName,departmentCode,roleCode\nalice@example.org,Alice,RD,RESEARCHER\n"),
          {
            filename: "user-accounts.csv",
            contentType: "text/csv",
          },
        )
        .expect(201);

      expect(services.userAccount.dryRunUserAccountCsv).toHaveBeenCalledOnce();
    });
  });
});

const withAppModule = async (
  callback: (
    app: INestApplication,
    services: {
      department: DepartmentImportDryRunServiceMock;
      userAccount: UserAccountImportDryRunServiceMock;
    },
  ) => Promise<void>,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const userAccountService = createUserAccountServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(makeUserContext()),
  };

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DepartmentImportDryRunService)
      .useValue(service)
      .overrideProvider(UserAccountImportDryRunService)
      .useValue(userAccountService)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, {
      department: service,
      userAccount: userAccountService,
    });
  } finally {
    if (app) {
      await app.close();
    }
  }
};
