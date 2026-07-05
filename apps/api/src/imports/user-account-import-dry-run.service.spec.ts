import { DepartmentStatus, RoleStatus, UserStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
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
  secondUser: "40000000-0000-4000-8000-000000000002",
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
    employeeNoNormalized?: string | null;
    status: UserStatus;
    userRoles: Array<{
      revokedAt: Date | null;
      scopeType: "GLOBAL" | "DEPARTMENT";
      scopeKey: string;
      departmentId: string | null;
      role: { id: string; code: string };
    }>;
  }>;
  employeeNoUsers?: Array<{
    id: string;
    employeeNoNormalized: string | null;
  }>;
} = {}) => {
  const tx = { department: {}, role: {}, user: {}, auditLog: {} };
  const repository = {
    findActiveDepartmentsByCodes: vi.fn().mockResolvedValue(input.departments ?? []),
    findActiveRolesByCodes: vi.fn().mockResolvedValue(input.roles ?? []),
    findUsersByEmails: vi.fn().mockResolvedValue(input.users ?? []),
    findUsersByEmployeeNoNormalized: vi.fn().mockResolvedValue(input.employeeNoUsers ?? []),
    findApplyDepartmentsByCodesInTransaction: vi.fn().mockResolvedValue(
      (input.departments ?? []).map((department) => ({
        ...department,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      })),
    ),
    findApplyRolesByCodesInTransaction: vi.fn().mockResolvedValue(
      (input.roles ?? []).map((role) => ({
        ...role,
        status: RoleStatus.ACTIVE,
        archivedAt: null,
      })),
    ),
    findApplyUsersByEmailsInTransaction: vi.fn().mockResolvedValue([]),
    findApplyUsersByEmployeeNoNormalizedInTransaction: vi.fn().mockResolvedValue([]),
    createPendingNoCredentialUserInTransaction: vi.fn().mockImplementation(async (_tx, createInput) => ({
      id: createInput.email.startsWith("bob@") ? ids.secondUser : ids.user,
      email: createInput.email,
      employeeNo: createInput.employeeNo,
      employeeNoNormalized: createInput.employeeNoNormalized,
      name: createInput.name,
      departmentId: createInput.departmentId,
      status: UserStatus.PENDING_ACTIVATION,
      credential: null,
      sessions: [],
      userRoles: [
        {
          id: createInput.email.startsWith("bob@")
            ? "60000000-0000-4000-8000-000000000002"
            : "60000000-0000-4000-8000-000000000001",
          roleId: createInput.role.roleId,
          scopeType: createInput.role.scopeType,
          scopeKey: createInput.role.scopeKey,
          departmentId: createInput.role.departmentId,
          role: { code: RoleCode.researcher },
        },
      ],
    })),
    isPrismaUniqueConflict: vi.fn((error: unknown) =>
      Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002"),
    ),
    getPrismaUniqueConflictTarget: vi.fn((error: unknown) => {
      if (!error || typeof error !== "object" || !("meta" in error)) {
        return [];
      }
      const target = (error as { meta?: { target?: unknown } }).meta?.target;
      return Array.isArray(target)
        ? target.filter((item): item is string => typeof item === "string")
        : typeof target === "string"
          ? [target]
          : [];
    }),
  };
  const prisma = {
    tx,
    $transaction: vi.fn(async (callback) => callback(tx)),
  };
  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-1" }),
  };
  const importJobRepository = {
    claimUserAccountPendingNoCredentialJob: vi.fn().mockResolvedValue({
      disposition: "RUNNER",
      jobId: "job-1",
      runId: "run-1",
    }),
    markSucceededInTransaction: vi.fn().mockResolvedValue(undefined),
    markRejected: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };

  return {
    auditService,
    importJobRepository,
    prisma,
    repository,
    service: new UserAccountImportDryRunService(
      repository as unknown as UserAccountImportDryRunRepository,
      importJobRepository as never,
      prisma as never,
      auditService as never,
    ),
  };
};

const expectUserAccountItemInput = (
  item: Record<string, unknown>,
  expected: { rowNumber: number; targetId: string },
) => {
  expect(item).toEqual({
    rowNumber: expected.rowNumber,
    safeCode: null,
    targetId: expected.targetId,
  });
  expect(Object.keys(item).sort()).toEqual(["rowNumber", "safeCode", "targetId"]);
  expect(item).not.toHaveProperty("jobId");
  expect(item).not.toHaveProperty("runId");
  expect(item).not.toHaveProperty("email");
  expect(item).not.toHaveProperty("employeeNo");
  expect(item).not.toHaveProperty("name");
  expect(item).not.toHaveProperty("departmentCode");
  expect(item).not.toHaveProperty("role");
  expect(item).not.toHaveProperty("credential");
  expect(item).not.toHaveProperty("invite");
  expect(item).not.toHaveProperty("password");
  expect(item).not.toHaveProperty("safeSummary");
  expect(item).not.toHaveProperty("auditLogIds");
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
        employeeNoDbConflictCheck: "AVAILABLE",
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
    expect(repository.findUsersByEmployeeNoNormalized).toHaveBeenCalledWith(["E001"]);
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
          "dup@example.org,Dup Two,e002,RD,RESEARCHER",
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

  it("reports existing employee numbers by normalized database lookup", async () => {
    const { service, repository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
      employeeNoUsers: [
        {
          id: ids.user,
          employeeNoNormalized: "E001",
        },
      ],
    });

    const result = await service.dryRunUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,employeeNo,departmentCode,roleCode",
          "new@example.org,New User, e001 ,RD,RESEARCHER",
        ].join("\n"),
      ),
    );

    expect(repository.findUsersByEmployeeNoNormalized).toHaveBeenCalledWith(["E001"]);
    expect(result.summary).toMatchObject({
      errorRows: 1,
      existingEmployeeNoRows: 1,
      createCandidates: 0,
      employeeNoDbConflictCheck: "AVAILABLE",
    });
    expect(result.rows[0]!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "employeeNo",
          code: "EXISTING_EMPLOYEE_NO",
        }),
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

  it("applies CREATE_ONLY_PENDING_NO_CREDENTIAL users and department-scoped roles with audit in the same transaction", async () => {
    const { service, repository, importJobRepository, prisma, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });

    const result = await service.applyUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,departmentCode,roleCode",
          "alice@example.org,Alice,RD,RESEARCHER",
          "bob@example.org,Bob,RD,RESEARCHER",
        ].join("\n"),
      ),
      "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    );

    expect(result).toMatchObject({
      importType: "USER_ACCOUNT",
      dryRun: false,
      mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      summary: {
        totalRows: 2,
        createdUsersCount: 2,
        createdRolesCount: 2,
        skippedRows: 0,
        failedRows: 0,
        auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
      },
      job: {
        disposition: "EXECUTED",
        jobId: "job-1",
        runId: "run-1",
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(repository.createPendingNoCredentialUserInTransaction).toHaveBeenNthCalledWith(
      1,
      prisma.tx,
      {
        email: "alice@example.org",
        employeeNo: null,
        employeeNoNormalized: null,
        name: "Alice",
        departmentId: ids.department,
        role: {
          roleId: ids.researcherRole,
          scopeType: ScopeType.department,
          scopeKey: ids.department,
          departmentId: ids.department,
        },
      },
    );
    expect(repository.createPendingNoCredentialUserInTransaction).toHaveBeenNthCalledWith(
      2,
      prisma.tx,
      expect.objectContaining({
        email: "bob@example.org",
        name: "Bob",
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.create,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.user,
          id: ids.user,
          departmentId: ids.department,
        }),
        newValue: expect.objectContaining({
          operation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
          credentialMode: "NO_CREDENTIAL",
          status: UserStatus.PENDING_ACTIVATION,
          roleCodes: [RoleCode.researcher],
          scopeType: ScopeType.department,
        }),
      }),
    );
    const serializedAudit = JSON.stringify(auditService.recordEventInTransaction.mock.calls);
    expect(serializedAudit).not.toContain("passwordHash");
    expect(serializedAudit).not.toContain("sessionHash");
    expect(serializedAudit).not.toContain("tokenHash");
    expect(serializedAudit).not.toContain("invite");
    expect(serializedAudit).not.toContain("reset");
    expect(importJobRepository.markSucceededInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        jobId: "job-1",
        runId: "run-1",
        acceptedRowCount: 2,
        createdUsersCount: 2,
        createdUserRolesCount: 2,
        auditCount: 2,
        safeErrorCodes: [],
        auditLogIds: ["audit-1", "audit-1"],
      }),
    );
    const successInput =
      importJobRepository.markSucceededInTransaction.mock.calls[0]![1];
    expect(successInput.items).toHaveLength(2);
    expectUserAccountItemInput(successInput.items[0], {
      rowNumber: 2,
      targetId: ids.user,
    });
    expectUserAccountItemInput(successInput.items[1], {
      rowNumber: 3,
      targetId: ids.secondUser,
    });
    const successSummaryJson = JSON.stringify(
      importJobRepository.markSucceededInTransaction.mock.calls[0]![1].safeSummary,
    );
    expect(successSummaryJson).toContain("NO_CREDENTIAL");
    expect(successSummaryJson).toContain("PENDING_ACTIVATION");
    expect(successSummaryJson).toContain("DEPARTMENT");
    expect(successSummaryJson).not.toContain("alice@example.org");
    expect(successSummaryJson).not.toContain("Alice");
    expect(successSummaryJson).not.toContain("bob@example.org");
    expect(successSummaryJson).not.toContain("Bob");
    expect(successSummaryJson).not.toContain("RESEARCHER");
    expect(successSummaryJson).not.toContain("RD");
    expect(successSummaryJson).not.toContain("session");
    expect(successSummaryJson).not.toContain("token");
    expect(successSummaryJson).not.toContain("password");
  });

  it("replays same-key successful user account imports without business writes", async () => {
    const { service, repository, importJobRepository, prisma, auditService } = createService();
    importJobRepository.claimUserAccountPendingNoCredentialJob.mockResolvedValueOnce({
      disposition: "REPLAYED_SUCCESS",
      jobId: "job-1",
      latestRunId: "run-1",
      safeSummary: {
        importType: "USER_ACCOUNT",
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        operation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
        totalRows: 2,
        acceptedRowCount: 2,
        createdUsersCount: 2,
        createdUserRolesCount: 2,
        auditCount: 2,
        warningCount: 0,
        errorCount: 0,
        credentialMode: "NO_CREDENTIAL",
        targetStatus: "PENDING_ACTIVATION",
        roleScope: "DEPARTMENT",
        errors: [],
      },
    });

    const result = await service.applyUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,employeeNo,departmentCode,roleCode",
          "alice@example.org,Alice,e001,RD,RESEARCHER",
        ].join("\n"),
      ),
      "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    );

    expect(result).toMatchObject({
      summary: {
        totalRows: 2,
        createdUsersCount: 2,
        createdRolesCount: 2,
        auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
      },
      job: {
        disposition: "REPLAYED_SUCCESS",
        jobId: "job-1",
        runId: "run-1",
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markSucceededInTransaction).not.toHaveBeenCalled();
  });

  it("returns in-progress for same-key running user account imports without business writes", async () => {
    const { service, repository, importJobRepository, prisma, auditService } = createService();
    importJobRepository.claimUserAccountPendingNoCredentialJob.mockResolvedValueOnce({
      disposition: "IMPORT_IN_PROGRESS",
      jobId: "job-1",
      latestRunId: "run-1",
      safeSummary: null,
    });

    const result = await service.applyUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,departmentCode,roleCode",
          "alice@example.org,Alice,RD,RESEARCHER",
        ].join("\n"),
      ),
      "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    );

    expect(result).toMatchObject({
      summary: {
        totalRows: 0,
        createdUsersCount: 0,
        createdRolesCount: 0,
      },
      job: {
        disposition: "IMPORT_IN_PROGRESS",
        jobId: "job-1",
        runId: "run-1",
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markSucceededInTransaction).not.toHaveBeenCalled();
  });

  it("persists employee number display and normalized values during apply", async () => {
    const { service, repository, prisma } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });

    const result = await service.applyUserAccountCsv(
      adminContext,
      makeFile(
        [
          "email,displayName,employeeNo,departmentCode,roleCode",
          "alice@example.org,Alice, e001 ,RD,RESEARCHER",
        ].join("\n"),
      ),
      "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    );

    expect(result.summary.createdUsersCount).toBe(1);
    expect(repository.findApplyUsersByEmployeeNoNormalizedInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      ["E001"],
    );
    expect(repository.createPendingNoCredentialUserInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        email: "alice@example.org",
        employeeNo: "e001",
        employeeNoNormalized: "E001",
      }),
    );
  });

  it("rejects duplicate email and employee number before opening a write transaction", async () => {
    const { service, importJobRepository, prisma, repository, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile(
          [
            "email,displayName,employeeNo,departmentCode,roleCode",
            "dup@example.org,Dup One,E001,RD,RESEARCHER",
            "dup@example.org,Dup Two,E001,RD,RESEARCHER",
          ].join("\n"),
        ),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        summary: expect.objectContaining({ createdUsersCount: 0 }),
      }),
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markSucceededInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markRejected).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedRowCount: 0,
        warningCount: 0,
        errorCount: expect.any(Number),
        safeErrorCodes: expect.arrayContaining(["DUPLICATE_IN_FILE"]),
      }),
    );
  });

  it("rejects missing departments before opening a write transaction", async () => {
    const { service, importJobRepository, prisma, repository } = createService({
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile("email,displayName,departmentCode,roleCode\nalice@example.org,Alice,MISSING,RESEARCHER\n"),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "departmentCode", code: "UNKNOWN_DEPARTMENT" }),
        ]),
      }),
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markRejected).toHaveBeenCalledWith(
      expect.objectContaining({
        safeErrorCodes: expect.arrayContaining(["UNKNOWN_DEPARTMENT"]),
      }),
    );
  });

  it("rejects transaction-time inactive departments without creating rows", async () => {
    const { service, repository, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });
    repository.findApplyDepartmentsByCodesInTransaction.mockResolvedValueOnce([
      {
        id: ids.department,
        code: "RD",
        status: DepartmentStatus.ARCHIVED,
        archivedAt: null,
      },
    ]);

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile("email,displayName,departmentCode,roleCode\nalice@example.org,Alice,RD,RESEARCHER\n"),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "departmentCode", code: "UNKNOWN_DEPARTMENT" }),
        ]),
      }),
    });

    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects SYSTEM_ADMIN and global scope before opening a write transaction", async () => {
    const { service, importJobRepository, prisma, repository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [
        { id: ids.researcherRole, code: RoleCode.researcher },
        { id: ids.role, code: RoleCode.systemAdmin },
      ],
    });

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile(
          [
            "email,displayName,departmentCode,roleCode,scopeType",
            "global@example.org,Global,RD,RESEARCHER,GLOBAL",
            "admin@example.org,Admin,RD,SYSTEM_ADMIN,DEPARTMENT",
          ].join("\n"),
        ),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "scopeType", code: "GLOBAL_SCOPE_NOT_ALLOWED" }),
          expect.objectContaining({ field: "roleCode", code: "ROLE_NOT_IMPORTABLE" }),
        ]),
      }),
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markRejected).toHaveBeenCalledWith(
      expect.objectContaining({
        safeErrorCodes: expect.arrayContaining([
          "GLOBAL_SCOPE_NOT_ALLOWED",
          "ROLE_NOT_IMPORTABLE",
        ]),
      }),
    );
  });

  it("rejects dry-run warnings for existing users before opening a write transaction", async () => {
    const { service, importJobRepository, prisma, repository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
      users: [
        {
          id: ids.user,
          email: "existing@example.org",
          status: UserStatus.ACTIVE,
          userRoles: [],
        },
      ],
    });

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile("email,displayName,departmentCode,roleCode\nexisting@example.org,Existing,RD,RESEARCHER\n"),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "email", code: "EXISTING_USER" }),
        ]),
      }),
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markRejected).toHaveBeenCalledWith(
      expect.objectContaining({
        safeErrorCodes: expect.arrayContaining(["EXISTING_USER"]),
      }),
    );
    const rejectedSummaryJson = JSON.stringify(
      importJobRepository.markRejected.mock.calls[0]![0].safeSummary,
    );
    expect(rejectedSummaryJson).toContain("EXISTING_USER");
    expect(rejectedSummaryJson).not.toContain("existing@example.org");
    expect(rejectedSummaryJson).not.toContain("email");
    expect(rejectedSummaryJson).not.toContain("employeeNo");
    expect(rejectedSummaryJson).not.toContain("Existing");
    expect(rejectedSummaryJson).not.toContain("RESEARCHER");
    expect(rejectedSummaryJson).not.toContain("RD");
  });

  it("rejects transaction-time duplicate email rechecks without creating rows", async () => {
    const { service, repository, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });
    repository.findApplyUsersByEmailsInTransaction.mockResolvedValueOnce([
      { id: ids.user, email: "alice@example.org", employeeNoNormalized: null },
    ]);

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile("email,displayName,departmentCode,roleCode\nalice@example.org,Alice,RD,RESEARCHER\n"),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "email", code: "EXISTING_USER" }),
        ]),
      }),
    });

    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects transaction-time duplicate employee number rechecks without creating rows", async () => {
    const { service, repository, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });
    repository.findApplyUsersByEmployeeNoNormalizedInTransaction.mockResolvedValueOnce([
      { id: ids.user, email: "existing@example.org", employeeNoNormalized: "E001" },
    ]);

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile(
          "email,displayName,employeeNo,departmentCode,roleCode\nalice@example.org,Alice,e001,RD,RESEARCHER\n",
        ),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "employeeNo", code: "EXISTING_EMPLOYEE_NO" }),
        ]),
      }),
    });

    expect(repository.createPendingNoCredentialUserInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("keeps user create and audit inside one transaction for rollback on partial failure", async () => {
    const { service, repository, importJobRepository, prisma, auditService } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });
    repository.createPendingNoCredentialUserInTransaction
      .mockResolvedValueOnce({
        id: ids.user,
        email: "alice@example.org",
        employeeNo: null,
        employeeNoNormalized: null,
        name: "Alice",
        departmentId: ids.department,
        status: UserStatus.PENDING_ACTIVATION,
        credential: null,
        sessions: [],
        userRoles: [
          {
            id: "60000000-0000-4000-8000-000000000001",
            roleId: ids.researcherRole,
            scopeType: ScopeType.department,
            scopeKey: ids.department,
            departmentId: ids.department,
            role: { code: RoleCode.researcher },
          },
        ],
      })
      .mockRejectedValueOnce(new Error("insert failed"));

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile(
          [
            "email,displayName,departmentCode,roleCode",
            "alice@example.org,Alice,RD,RESEARCHER",
            "bob@example.org,Bob,RD,RESEARCHER",
          ].join("\n"),
        ),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toThrow("insert failed");

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(repository.createPendingNoCredentialUserInTransaction).toHaveBeenCalledTimes(2);
    expect(auditService.recordEventInTransaction).toHaveBeenCalledTimes(1);
    expect(importJobRepository.markSucceededInTransaction).not.toHaveBeenCalled();
  });

  it("rejects non CREATE_ONLY_PENDING_NO_CREDENTIAL modes", async () => {
    const { service, repository, prisma } = createService();

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile("email,displayName,departmentCode,roleCode\nalice@example.org,Alice,RD,RESEARCHER\n"),
        "UPSERT",
      ),
    ).rejects.toThrow("Unsupported user account import apply mode");

    expect(repository.findActiveDepartmentsByCodes).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects repository uniqueness conflicts with a safe conflict report", async () => {
    const { service, repository, importJobRepository } = createService({
      departments: [{ id: ids.department, code: "RD" }],
      roles: [{ id: ids.researcherRole, code: RoleCode.researcher }],
    });
    repository.createPendingNoCredentialUserInTransaction.mockRejectedValueOnce({
      code: "P2002",
      meta: { target: ["email"] },
    });

    await expect(
      service.applyUserAccountCsv(
        adminContext,
        makeFile("email,displayName,departmentCode,roleCode\nalice@example.org,Alice,RD,RESEARCHER\n"),
        "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      ),
    ).rejects.toMatchObject({
      result: expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "email", code: "EXISTING_USER" }),
        ]),
      }),
    });
    expect(importJobRepository.markSucceededInTransaction).not.toHaveBeenCalled();
  });
});
