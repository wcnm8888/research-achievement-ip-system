import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { allowDecision, denyDecision } from "../authorization/policy/policy-decision";
import { UserContext } from "../identity/user-context";
import { AccountManagementConflictError } from "./account-management.errors";
import { AccountManagementRepository } from "./account-management.repository";
import { AccountManagementService } from "./account-management.service";

const ids = {
  actor: "40000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000002",
  userRole: "60000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  department2: "10000000-0000-4000-8000-000000000002",
};

const adminContext: UserContext = {
  userId: ids.actor,
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

const createPayload = {
  email: "New.User@Example.COM",
  name: " New User ",
  departmentId: ids.department,
  roles: [
    {
      roleCode: RoleCode.researcher,
      scopeType: ScopeType.department,
      departmentId: ids.department,
    },
  ],
  initialPassword: "safe-password-123",
};

describe("AccountManagementService", () => {
  it("lists and reads users only after system config permission check", async () => {
    const { service, repository, rbacPolicy } = createService();

    await service.listUsers(adminContext, { page: 2, pageSize: 10 });
    await service.getUser(adminContext, ids.user);

    expect(rbacPolicy.hasPermission).toHaveBeenCalledWith(
      adminContext,
      PermissionCode.systemConfig,
    );
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10 }),
    );
    expect(repository.findById).toHaveBeenCalledWith(ids.user);
  });

  it("creates a user, roles, credential, and CREATE + USER audit event in one transaction", async () => {
    const { service, repository, prisma, auditService } = createService();

    const result = await service.createUser(adminContext, createPayload);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.createUserInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        email: "new.user@example.com",
        name: "New User",
        departmentId: ids.department,
        credential: expect.objectContaining({
          passwordHash: expect.stringContaining("scrypt$"),
        }),
        roles: [
          expect.objectContaining({
            roleId: ids.role,
            scopeType: ScopeType.department,
            scopeKey: ids.department,
            departmentId: ids.department,
          }),
        ],
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.create,
        target: {
          type: AuditTargetTypeCode.user,
          id: ids.user,
          departmentId: ids.department,
        },
        newValue: {
          targetUserId: ids.user,
          departmentId: ids.department,
          emailMasked: "n***@example.com",
          roleCodes: [RoleCode.researcher],
          credentialMode: "INITIAL_PASSWORD",
        },
      }),
    );
    expect(result.id).toBe(ids.user);

    const serializedResult = JSON.stringify(result);
    expect(serializedResult).not.toContain("safe-password-123");
    expect(serializedResult).not.toContain("passwordHash");
    expect(serializedResult).not.toContain("token");
    expect(serializedResult).not.toContain("secret");

    const serializedAudit = JSON.stringify(
      auditService.recordEventInTransaction.mock.calls,
    );
    expect(serializedAudit).not.toContain("safe-password-123");
    expect(serializedAudit).not.toContain("passwordHash");
    expect(serializedAudit).not.toContain("token");
    expect(serializedAudit).not.toContain("cookie");
    expect(serializedAudit).not.toContain("sessionHash");
  });

  it("maps duplicate email conflicts and does not record audit after create failure", async () => {
    const { service, repository, auditService } = createService();
    repository.createUserInTransaction.mockRejectedValueOnce({ code: "P2002" });

    await expect(service.createUser(adminContext, createPayload)).rejects.toBeInstanceOf(
      AccountManagementConflictError,
    );

    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("can create a user without credential material when initial password is absent", async () => {
    const { service, repository, auditService } = createService();

    await service.createUser(adminContext, {
      ...createPayload,
      initialPassword: undefined,
    });

    expect(repository.createUserInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        credential: null,
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        newValue: expect.objectContaining({
          credentialMode: "NO_CREDENTIAL",
        }),
      }),
    );
  });

  it("denies non-admin callers before repository access", async () => {
    const { service, repository, rbacPolicy } = createService();
    rbacPolicy.hasPermission.mockReturnValueOnce(
      denyDecision("Required permissions are missing.", [PermissionCode.systemConfig]),
    );

    await expect(service.listUsers(adminContext, {})).rejects.toThrow(
      "Required permission is missing",
    );

    expect(repository.findMany).not.toHaveBeenCalled();
  });

  it("disables a user, disables credentials, revokes sessions, and records UPDATE + USER audit", async () => {
    const { service, repository, prisma, auditService } = createService();

    const result = await service.disableUser(adminContext, ids.user, {
      reason: "offboarding",
    });

    expect(repository.updateUserStatusInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      ids.user,
      "DISABLED",
    );
    expect(repository.disableCredentialInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      ids.user,
      expect.any(Date),
    );
    expect(repository.revokeSessionsInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      ids.user,
      expect.any(Date),
      "ACCOUNT_DISABLED",
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.update,
        target: {
          type: AuditTargetTypeCode.user,
          id: ids.user,
          departmentId: ids.department,
        },
        newValue: expect.objectContaining({
          operation: "USER_DISABLE",
          targetUserId: ids.user,
          revokedSessionCount: 2,
          reason: "offboarding",
        }),
      }),
    );
    expect(result.revokedSessionCount).toBe(2);
  });

  it("enables only the user status and does not restore disabled credentials implicitly", async () => {
    const { service, repository, prisma, auditService } = createService();

    await service.enableUser(adminContext, ids.user, { reason: "returned" });

    expect(repository.updateUserStatusInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      ids.user,
      "ACTIVE",
    );
    expect(repository.disableCredentialInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        newValue: expect.objectContaining({
          operation: "USER_ENABLE",
          credentialRestorePolicy: "USER_STATUS_ONLY",
        }),
      }),
    );
  });

  it("assigns GLOBAL and DEPARTMENT roles and records safe audit metadata", async () => {
    const { service, repository, auditService } = createService();

    await service.assignUserRole(adminContext, ids.user, {
      roleCode: RoleCode.researcher,
      scopeType: ScopeType.global,
      reason: "institute role",
    });

    expect(repository.assignUserRoleInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: ids.user,
        roleId: ids.role,
        scopeType: ScopeType.global,
        scopeKey: "GLOBAL",
        departmentId: null,
      }),
    );

    await service.assignUserRole(adminContext, ids.user, {
      roleCode: RoleCode.researcher,
      scopeType: ScopeType.department,
      departmentId: ids.department,
      reason: "department role",
    });

    expect(repository.assignUserRoleInTransaction).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({
        scopeType: ScopeType.department,
        scopeKey: ids.department,
        departmentId: ids.department,
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({
        action: AuditActionCode.update,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.user,
          id: ids.user,
        }),
        newValue: expect.objectContaining({
          operation: "USER_ROLE_ASSIGN",
          userRoleId: ids.userRole,
          roleCode: RoleCode.researcher,
          scopeType: ScopeType.department,
          departmentId: ids.department,
        }),
      }),
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).not.toContain(
      "passwordHash",
    );
  });

  it("rejects duplicate active role assignments before writing", async () => {
    const { service, repository, auditService } = createService();
    repository.findUserRoleByAssignment.mockResolvedValueOnce({
      id: ids.userRole,
      revokedAt: null,
      role: makeRole(),
      scopeType: ScopeType.global,
      scopeKey: "GLOBAL",
      departmentId: null,
    });

    await expect(
      service.assignUserRole(adminContext, ids.user, {
        roleCode: RoleCode.researcher,
        scopeType: ScopeType.global,
      }),
    ).rejects.toBeInstanceOf(AccountManagementConflictError);

    expect(repository.assignUserRoleInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("soft revokes roles and records UPDATE + USER audit", async () => {
    const { service, repository, auditService } = createService();

    await service.revokeUserRole(adminContext, ids.user, ids.userRole, {
      reason: "role changed",
    });

    expect(repository.revokeUserRoleInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.user,
      ids.userRole,
      expect.any(Date),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        action: AuditActionCode.update,
        newValue: expect.objectContaining({
          operation: "USER_ROLE_REVOKE",
          userRoleId: ids.userRole,
          roleCode: RoleCode.researcher,
          reason: "role changed",
        }),
      }),
    );
  });

  it("changes the primary department without migrating scoped roles or historical business data", async () => {
    const { service, repository, auditService } = createService();

    await service.changeUserDepartment(adminContext, ids.user, {
      departmentId: ids.department2,
      reason: "transfer",
    });

    expect(repository.changeUserDepartmentInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.user,
      ids.department2,
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        action: AuditActionCode.update,
        newValue: expect.objectContaining({
          operation: "USER_DEPARTMENT_CHANGE",
          oldDepartmentId: ids.department,
          newDepartmentId: ids.department2,
          scopeMigration: "NONE",
        }),
      }),
    );
  });
});

const createService = () => {
  const repository = {
    findMany: vi.fn().mockResolvedValue({
      items: [makeAccountUser()],
      total: 1,
      page: 1,
      pageSize: 20,
    }),
    findById: vi.fn().mockResolvedValue(makeAccountUser()),
    findActiveDepartmentById: vi.fn().mockImplementation(async (departmentId: string) => ({
      id: departmentId,
      code: departmentId === ids.department2 ? "RESEARCH_ADMIN_OFFICE" : "INSTITUTE_ROOT",
      name: departmentId === ids.department2 ? "Research Admin" : "Institute",
      status: "ACTIVE",
    })),
    findActiveDepartmentsByIds: vi.fn().mockResolvedValue([
      {
        id: ids.department,
        code: "INSTITUTE_ROOT",
        name: "Institute",
        status: "ACTIVE",
      },
    ]),
    findActiveRolesByCodes: vi.fn().mockResolvedValue([
      makeRole(),
    ]),
    createUserInTransaction: vi.fn().mockResolvedValue(makeAccountUser()),
    updateUserStatusInTransaction: vi.fn().mockResolvedValue(makeAccountUser()),
    disableCredentialInTransaction: vi.fn().mockResolvedValue(1),
    revokeSessionsInTransaction: vi.fn().mockResolvedValue(2),
    findUserRoleByAssignment: vi.fn().mockResolvedValue(null),
    assignUserRoleInTransaction: vi.fn().mockResolvedValue({
      userRoleId: ids.userRole,
      user: makeAccountUser(),
    }),
    findActiveUserRoleById: vi.fn().mockResolvedValue({
      id: ids.userRole,
      revokedAt: null,
      role: makeRole(),
      scopeType: ScopeType.department,
      scopeKey: ids.department,
      departmentId: ids.department,
    }),
    revokeUserRoleInTransaction: vi.fn().mockResolvedValue(makeAccountUser()),
    changeUserDepartmentInTransaction: vi.fn().mockResolvedValue(
      makeAccountUser({
        department: {
          id: ids.department2,
          code: "RESEARCH_ADMIN_OFFICE",
          name: "Research Admin",
          status: "ACTIVE",
        },
      }),
    ),
    isPrismaUniqueConflict: vi.fn((error: unknown) => {
      return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
    }),
    isPrismaRecordNotFound: vi.fn((error: unknown) => {
      return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2025");
    }),
  };

  const rbacPolicy = {
    hasPermission: vi.fn().mockReturnValue(allowDecision("allowed")),
  };

  const prisma = {
    tx: { user: {}, auditLog: {} },
    $transaction: vi.fn(async (callback) => callback(prisma.tx)),
  };

  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-1" }),
  };

  const service = new AccountManagementService(
    repository as unknown as AccountManagementRepository,
    rbacPolicy as never,
    prisma as never,
    auditService as never,
  );

  return { service, repository, rbacPolicy, prisma, auditService };
};

const makeRole = () => ({
  id: ids.role,
  code: RoleCode.researcher,
  name: "Researcher",
  status: "ACTIVE",
});

const makeAccountUser = (
  overrides: {
    status?: string;
    department?: {
      id: string;
      code: string;
      name: string;
      status: string;
    };
  } = {},
) => ({
  id: ids.user,
  email: "new.user@example.com",
  name: "New User",
  status: overrides.status ?? "ACTIVE",
  department: overrides.department ?? {
    id: ids.department,
    code: "INSTITUTE_ROOT",
    name: "Institute",
    status: "ACTIVE",
  },
  roles: [
    {
      id: ids.userRole,
      role: makeRole(),
      scopeType: ScopeType.department,
      scopeKey: ids.department,
      departmentId: ids.department,
      createdAt: new Date("2026-06-24T00:00:00.000Z"),
    },
  ],
  credential: {
    status: "ACTIVE",
    passwordUpdatedAt: new Date("2026-06-24T00:00:00.000Z"),
    disabledAt: null,
    createdAt: new Date("2026-06-24T00:00:00.000Z"),
    updatedAt: new Date("2026-06-24T00:00:00.000Z"),
  },
  lastLogin: null,
  createdAt: new Date("2026-06-24T00:00:00.000Z"),
  updatedAt: new Date("2026-06-24T00:00:00.000Z"),
});
