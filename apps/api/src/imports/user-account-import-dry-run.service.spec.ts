import { UserStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { UserContext } from "../identity/user-context";
import { UserAccountImportDryRunRepository } from "./user-account-import-dry-run.repository";
import {
  InvalidUserAccountImportCsvError,
  UserAccountImportDryRunService,
} from "./user-account-import-dry-run.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  researcherRole: "50000000-0000-4000-8000-000000000002",
  department: "10000000-0000-4000-8000-000000000001",
};

const adminContext: UserContext = {
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
};

const makeFile = (content: string) => ({
  originalName: "user-accounts.csv",
  mimeType: "text/csv",
  size: Buffer.byteLength(content),
  buffer: Buffer.from(content, "utf8"),
});

const createService = (input: {
  departments?: Array<{ id: string; code: string }>;
  roles?: Array<{ id: string; code: string }>;
  users?: Array<{
    id: string;
    email: string;
    status: UserStatus;
    userRoles: Array<{
      revokedAt: Date | null;
      scopeType: "GLOBAL" | "DEPARTMENT";
      scopeKey: string;
      departmentId: string | null;
      role: { id: string; code: string };
    }>;
  }>;
} = {}) => {
  const repository = {
    findActiveDepartmentsByCodes: vi.fn().mockResolvedValue(input.departments ?? []),
    findActiveRolesByCodes: vi.fn().mockResolvedValue(input.roles ?? []),
    findUsersByEmails: vi.fn().mockResolvedValue(input.users ?? []),
  };

  return {
    repository,
    service: new UserAccountImportDryRunService(
      repository as unknown as UserAccountImportDryRunRepository,
    ),
  };
};

describe("UserAccountImportDryRunService", () => {
  it("returns a valid no-write user account preview for CSV rows", async () => {
    const { service, repository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });

    const result = await service.dryRunUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,employeeNo,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
          "Alice@Example.ORG,Alice,E001,RD,RESEARCHER,DEPARTMENT,RD,PENDING_ACTIVATION",
        ].join("\n"),
      ),
    );

    expect(result).toMatchObject({
      importType: "USER_ACCOUNT",
      dryRun: true,
      summary: {
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        createCandidates: 1,
        employeeNoDbConflictCheck: "NOT_AVAILABLE",
      },
    });
    expect(result.rows[0]!).toMatchObject({
      rowNumber: 2,
      parsed: {
        email: "alice@example.org",
        displayName: "Alice",
        employeeNo: "E001",
        departmentCode: "RD",
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        scopeDepartmentCode: "RD",
        status: "PENDING_ACTIVATION",
        credentialAction: "NO_CREDENTIAL",
      },
      status: "VALID",
      candidateAction: "CREATE_PENDING_USER",
      errors: [],
      warnings: [],
    });
    expect(repository.findActiveDepartmentsByCodes).toHaveBeenCalledWith(["RD"]);
    expect(repository.findActiveRolesByCodes).toHaveBeenCalledWith(["RESEARCHER"]);
    expect(repository.findUsersByEmails).toHaveBeenCalledWith(["alice@example.org"]);
  });

  it("reports sensitive columns without returning the original sensitive header", async () => {
    const { service } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });

    const result = await service.dryRunUserAccountCsv(
      adminContext,
      makeFile(
        "email,displayName,departmentCode,roleCode,password\nalice@example.org,Alice,RD,RESEARCHER,do-not-use\n",
      ),
    );

    expect(result.columns.received).toContain("(sensitive)");
    expect(result.columns.received).not.toContain("password");
    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({
        field: "(sensitive)",
        code: "FORBIDDEN_SENSITIVE_COLUMN",
      }),
    );
    expect(JSON.stringify(result)).not.toContain("do-not-use");
  });

  it("reports required fields, invalid email, duplicate email, and duplicate employee number", async () => {
    const { service } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });

    const result = await service.dryRunUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,employeeNo,departmentCode,roleCode",
          "bad-email,,E001,RD,RESEARCHER",
          "dup@example.org,Dup One,E002,RD,RESEARCHER",
          "dup@example.org,Dup Two,E002,RD,RESEARCHER",
        ].join("\n"),
      ),
    );

    expect(result.summary.errorRows).toBe(3);
    expect(result.rows[0]!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "email", code: "INVALID_FORMAT" }),
        expect.objectContaining({ field: "displayName", code: "REQUIRED" }),
      ]),
    );
    expect(result.rows[1]!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "email", code: "DUPLICATE_IN_FILE" }),
        expect.objectContaining({ field: "employeeNo", code: "DUPLICATE_IN_FILE" }),
      ]),
    );
  });

  it("reports unknown department, unknown role, scope errors, system admin, and status errors", async () => {
    const { service } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [
        { id: ids.researcherRole, code: RoleCode.researcher },
        { id: ids.role, code: RoleCode.systemAdmin },
      ],
    });

    const result = await service.dryRunUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,departmentCode,roleCode,scopeType,scopeDepartmentCode,status",
          "missing-dept@example.org,Missing Dept,MISSING,RESEARCHER,DEPARTMENT,RD,PENDING_ACTIVATION",
          "missing-role@example.org,Missing Role,RD,MISSING_ROLE,DEPARTMENT,RD,PENDING_ACTIVATION",
          "missing-scope@example.org,Missing Scope,RD,RESEARCHER,DEPARTMENT,MISSING_SCOPE,PENDING_ACTIVATION",
          "global@example.org,Global,RD,RESEARCHER,GLOBAL,RD,PENDING_ACTIVATION",
          "admin@example.org,Admin,RD,SYSTEM_ADMIN,DEPARTMENT,RD,PENDING_ACTIVATION",
          "active@example.org,Active,RD,RESEARCHER,DEPARTMENT,RD,ACTIVE",
          "invalid-status@example.org,Invalid,RD,RESEARCHER,DEPARTMENT,RD,NOPE",
        ].join("\n"),
      ),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "departmentCode", code: "UNKNOWN_DEPARTMENT" }),
    );
    expect(result.rows[1]!.errors).toContainEqual(
      expect.objectContaining({ field: "roleCode", code: "UNKNOWN_ROLE" }),
    );
    expect(result.rows[2]!.errors).toContainEqual(
      expect.objectContaining({
        field: "scopeDepartmentCode",
        code: "UNKNOWN_SCOPE_DEPARTMENT",
      }),
    );
    expect(result.rows[3]!.errors).toContainEqual(
      expect.objectContaining({ field: "scopeType", code: "GLOBAL_SCOPE_NOT_ALLOWED" }),
    );
    expect(result.rows[4]!.errors).toContainEqual(
      expect.objectContaining({ field: "roleCode", code: "ROLE_NOT_IMPORTABLE" }),
    );
    expect(result.rows[5]!.errors).toContainEqual(
      expect.objectContaining({ field: "status", code: "UNSUPPORTED_STATUS" }),
    );
    expect(result.rows[6]!.errors).toContainEqual(
      expect.objectContaining({ field: "status", code: "INVALID_STATUS" }),
    );
  });

  it("reports existing users and role assignments as no-write review warnings", async () => {
    const { service } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
      users: [
        {
          id: ids.user,
          email: "existing@example.org",
          status: UserStatus.ACTIVE,
          userRoles: [
            {
              revokedAt: null,
              scopeType: "DEPARTMENT",
              scopeKey: ids.department,
              departmentId: ids.department,
              role: { id: ids.researcherRole, code: RoleCode.researcher },
            },
          ],
        },
        {
          id: "40000000-0000-4000-8000-000000000002",
          email: "revoked@example.org",
          status: UserStatus.ACTIVE,
          userRoles: [
            {
              revokedAt: new Date("2026-01-01T00:00:00.000Z"),
              scopeType: "DEPARTMENT",
              scopeKey: ids.department,
              departmentId: ids.department,
              role: { id: ids.researcherRole, code: RoleCode.researcher },
            },
          ],
        },
      ],
    });

    const result = await service.dryRunUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,departmentCode,roleCode",
          "existing@example.org,Existing,RD,RESEARCHER",
          "revoked@example.org,Revoked,RD,RESEARCHER",
        ].join("\n"),
      ),
    );

    expect(result.summary).toMatchObject({
      warningRows: 2,
      existingUserRows: 2,
      existingRoleAssignmentRows: 1,
      reactivationCandidateRows: 1,
      createCandidates: 0,
    });
    expect(result.rows[0]!).toMatchObject({
      status: "WARNING",
      candidateAction: "REVIEW_EXISTING_USER",
    });
    expect(result.rows[0]!.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "EXISTING_USER" }),
        expect.objectContaining({ code: "EXISTING_ROLE_ASSIGNMENT" }),
      ]),
    );
    expect(result.rows[1]!).toMatchObject({
      status: "WARNING",
      candidateAction: "REACTIVATE_ROLE_REVIEW",
    });
    expect(result.rows[1]!.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "EXISTING_USER" }),
        expect.objectContaining({ code: "REVOKED_ROLE_ASSIGNMENT" }),
      ]),
    );
  });

  it("rejects files over the row limit", async () => {
    const { service } = createService();
    const rows = Array.from({ length: 501 }, (_, index) =>
      `person${index}@example.org,Person ${index},RD,RESEARCHER`,
    );

    await expect(
      service.dryRunUserAccountCsv(
        adminContext,
        makeFile(["email,displayName,departmentCode,roleCode", ...rows].join("\n")),
      ),
    ).rejects.toThrow(InvalidUserAccountImportCsvError);
  });
});
