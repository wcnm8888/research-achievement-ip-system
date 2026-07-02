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
import { AchievementImportDryRunService } from "./achievement-import-dry-run.service";
import { DepartmentImportDryRunService } from "./department-import-dry-run.service";
import { UserAccountImportDryRunService } from "./user-account-import-dry-run.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

type DepartmentImportDryRunServiceMock = {
  applyDepartmentCsv: ReturnType<typeof vi.fn>;
  dryRunDepartmentCsv: ReturnType<typeof vi.fn>;
};

type UserAccountImportDryRunServiceMock = {
  applyUserAccountCsv: ReturnType<typeof vi.fn>;
  dryRunUserAccountCsv: ReturnType<typeof vi.fn>;
};

type AchievementImportDryRunServiceMock = {
  applyAchievementCsv: ReturnType<typeof vi.fn>;
  dryRunAchievementCsv: ReturnType<typeof vi.fn>;
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
  applyDepartmentCsv: vi.fn().mockResolvedValue({
    importType: "DEPARTMENT_METADATA",
    dryRun: false,
    mode: "CREATE_ONLY",
    file: {
      name: "departments.csv",
      size: 35,
      mimeType: "text/csv",
      encoding: "utf-8",
    },
    summary: {
      totalRows: 1,
      createdRows: 1,
      skippedRows: 0,
      failedRows: 0,
      errorCount: 0,
      warningCount: 0,
    },
    errors: [],
    rows: [
      {
        rowNumber: 2,
        code: "AI_RESEARCH",
        status: "CREATED",
        createdDepartmentId: "10000000-0000-4000-8000-000000000010",
      },
    ],
  }),
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
  applyUserAccountCsv: vi.fn().mockResolvedValue({
    importType: "USER_ACCOUNT",
    dryRun: false,
    mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    file: {
      name: "user-accounts.csv",
      size: 75,
      mimeType: "text/csv",
      encoding: "utf-8",
    },
    summary: {
      totalRows: 1,
      createdUsersCount: 1,
      createdRolesCount: 1,
      skippedRows: 0,
      failedRows: 0,
      errorCount: 0,
      warningCount: 0,
      auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
    },
    errors: [],
    rows: [
      {
        rowNumber: 2,
        emailMasked: "a***@example.org",
        status: "CREATED",
        createdUserId: "40000000-0000-4000-8000-000000000010",
        createdUserRoleIds: ["60000000-0000-4000-8000-000000000010"],
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
      },
    ],
  }),
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
      existingEmployeeNoRows: 0,
      existingRoleAssignmentRows: 0,
      reactivationCandidateRows: 0,
      employeeNoDbConflictCheck: "AVAILABLE",
    },
    rows: [],
  }),
});

const createAchievementServiceMock = (): AchievementImportDryRunServiceMock => ({
  applyAchievementCsv: vi.fn().mockResolvedValue({
    importType: "ACHIEVEMENT",
    dryRun: false,
    mode: "CREATE_DRAFT_ONLY",
    file: {
      name: "achievements.csv",
      size: 120,
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
        createdAchievementId: "30000000-0000-4000-8000-000000000010",
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
      size: 95,
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

  it("exposes department import create-only apply through AppModule", async () => {
    await withAppModule(async (app, services) => {
      await request(app.getHttpServer() as Server)
        .post("/imports/departments/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "CREATE_ONLY")
        .attach("file", Buffer.from("code,name\nAI_RESEARCH,AI Research\n"), {
          filename: "departments.csv",
          contentType: "text/csv",
        })
        .expect(201);

      expect(services.department.applyDepartmentCsv).toHaveBeenCalledOnce();
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

  it("exposes user account pending no-credential apply through AppModule", async () => {
    await withAppModule(async (app, services) => {
      await request(app.getHttpServer() as Server)
        .post("/users/import/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "CREATE_ONLY_PENDING_NO_CREDENTIAL")
        .attach(
          "file",
          Buffer.from("email,displayName,departmentCode,roleCode\nalice@example.org,Alice,RD,RESEARCHER\n"),
          {
            filename: "user-accounts.csv",
            contentType: "text/csv",
          },
        )
        .expect(201);

      expect(services.userAccount.applyUserAccountCsv).toHaveBeenCalledOnce();
    });
  });

  it("exposes achievement import dry-run through AppModule", async () => {
    await withAppModule(async (app, services) => {
      await request(app.getHttpServer() as Server)
        .post("/achievements/import/dry-run")
        .set("X-Demo-User-Id", ids.user)
        .attach(
          "file",
          Buffer.from(
            "type,title,ownerEmail,departmentCode,contributors\nPAPER,Paper,owner@example.org,RD,A|AUTHOR|||Lab\n",
          ),
          {
            filename: "achievements.csv",
            contentType: "text/csv",
          },
        )
        .expect(201);

      expect(services.achievement.dryRunAchievementCsv).toHaveBeenCalledOnce();
    });
  });

  it("exposes achievement PAPER create-draft apply through AppModule", async () => {
    await withAppModule(async (app, services) => {
      await request(app.getHttpServer() as Server)
        .post("/achievements/import/apply")
        .set("X-Demo-User-Id", ids.user)
        .field("mode", "CREATE_DRAFT_ONLY")
        .attach(
          "file",
          Buffer.from(
            "type,title,ownerEmail,departmentCode,contributors,doi\nPAPER,Paper,owner@example.org,RD,A|AUTHOR|||Lab,10.1000/new\n",
          ),
          {
            filename: "achievements.csv",
            contentType: "text/csv",
          },
        )
        .expect(201);

      expect(services.achievement.applyAchievementCsv).toHaveBeenCalledOnce();
    });
  });
});

const withAppModule = async (
  callback: (
    app: INestApplication,
    services: {
      achievement: AchievementImportDryRunServiceMock;
      department: DepartmentImportDryRunServiceMock;
      userAccount: UserAccountImportDryRunServiceMock;
    },
  ) => Promise<void>,
): Promise<void> => {
  let app: INestApplication | null = null;
  const service = createServiceMock();
  const userAccountService = createUserAccountServiceMock();
  const achievementService = createAchievementServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(makeUserContext()),
  };

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AchievementImportDryRunService)
      .useValue(achievementService)
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
      achievement: achievementService,
      department: service,
      userAccount: userAccountService,
    });
  } finally {
    if (app) {
      await app.close();
    }
  }
};
