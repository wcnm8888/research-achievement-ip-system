import { DepartmentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { allowDecision, denyDecision } from "../authorization/policy/policy-decision";
import { UserContext } from "../identity/user-context";
import {
  DepartmentManagementConflictError,
  DepartmentManagementPermissionDeniedError,
} from "./department-management.errors";
import {
  DepartmentManagementRepository,
  DepartmentRecord,
} from "./department-management.repository";
import { DepartmentManagementService } from "./department-management.service";

const ids = {
  actor: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  parent: "10000000-0000-4000-8000-000000000010",
  child: "10000000-0000-4000-8000-000000000011",
};

const now = new Date("2026-06-25T00:00:00.000Z");

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

const makeDepartment = (overrides: Partial<DepartmentRecord> = {}): DepartmentRecord => ({
  ...makeBaseDepartment(),
  ...overrides,
});

const makeBaseDepartment = (): DepartmentRecord => ({
  id: ids.department,
  code: "AI_RESEARCH",
  name: "AI Research",
  parentId: null,
  status: DepartmentStatus.ACTIVE,
  createdAt: now,
  updatedAt: now,
  archivedAt: null,
});

const emptyImpactSummary = {
  activeUsersCount: 0,
  activeUserRoleScopesCount: 0,
  pendingWorkflowTasksCount: 0,
  activeOrUnarchivedAchievementsCount: 2,
  feeRecordsCount: 3,
};

describe("DepartmentManagementService", () => {
  it("lists and reads departments only after system config permission check", async () => {
    const { service, repository, rbacPolicy } = createService();

    await service.listDepartments(adminContext, { page: 2, pageSize: 10 });
    await service.getDepartment(adminContext, ids.department);

    expect(rbacPolicy.hasPermission).toHaveBeenCalledWith(
      adminContext,
      PermissionCode.systemConfig,
    );
    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10 }),
    );
    expect(repository.findById).toHaveBeenCalledWith(ids.department);
  });

  it("builds department trees without changing department scope semantics", async () => {
    const { service, repository } = createService();
    repository.findTreeRows.mockResolvedValueOnce([
      makeDepartment({ id: ids.parent, code: "ROOT", parentId: null }),
      makeDepartment({ id: ids.child, code: "CHILD", parentId: ids.parent }),
    ]);

    const result = await service.listDepartmentTree(adminContext, {});

    expect(result.items[0]?.id).toBe(ids.parent);
    expect(result.items[0]?.children[0]?.id).toBe(ids.child);
    expect(JSON.stringify(result)).not.toContain("includeChildrenScope");
  });

  it("denies non-admin callers before repository access", async () => {
    const { service, repository, rbacPolicy } = createService();
    rbacPolicy.hasPermission.mockReturnValueOnce(
      denyDecision("Required permissions are missing.", [PermissionCode.systemConfig]),
    );

    await expect(service.listDepartments(adminContext, {})).rejects.toBeInstanceOf(
      DepartmentManagementPermissionDeniedError,
    );

    expect(repository.findMany).not.toHaveBeenCalled();
  });

  it("creates a department and records CONFIG_UPDATE audit metadata", async () => {
    const { service, repository, prisma, auditService } = createService();

    await service.createDepartment(adminContext, {
      code: "NEW_DEPT",
      name: " New Department ",
      parentId: ids.parent,
    });

    expect(repository.findById).toHaveBeenCalledWith(ids.parent);
    expect(repository.createInTransaction).toHaveBeenCalledWith(prisma.tx, {
      code: "NEW_DEPT",
      name: "New Department",
      parentId: ids.parent,
    });
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.configUpdate,
        target: {
          type: AuditTargetTypeCode.systemConfig,
          id: ids.department,
          departmentId: ids.department,
        },
        newValue: expect.objectContaining({
          operation: "DEPARTMENT_CREATE",
          code: "AI_RESEARCH",
          name: "AI Research",
        }),
      }),
    );
  });

  it("updates a department and rejects parent self-cycle", async () => {
    const { service, repository } = createService();

    await service.updateDepartment(adminContext, ids.department, {
      name: "Updated Department",
      parentId: null,
    });

    expect(repository.updateInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.department,
      { name: "Updated Department", parentId: null },
    );

    await expect(
      service.updateDepartment(adminContext, ids.department, { parentId: ids.department }),
    ).rejects.toBeInstanceOf(DepartmentManagementConflictError);
  });

  it("rejects missing, archived, and cyclic parents", async () => {
    const { service, repository } = createService();
    repository.findById.mockImplementation(async (departmentId: string) => {
      if (departmentId === "10000000-0000-4000-8000-000000000099") {
        return null;
      }

      if (departmentId === ids.parent) {
        return makeDepartment({
          id: ids.parent,
          status: DepartmentStatus.ARCHIVED,
          archivedAt: now,
        });
      }

      return makeDepartment({ id: departmentId, parentId: ids.department });
    });

    await expect(
      service.createDepartment(adminContext, {
        code: "MISSING_PARENT",
        name: "Missing Parent",
        parentId: "10000000-0000-4000-8000-000000000099",
      }),
    ).rejects.toThrow("Parent department was not found");

    await expect(
      service.createDepartment(adminContext, {
        code: "ARCHIVED_PARENT",
        name: "Archived Parent",
        parentId: ids.parent,
      }),
    ).rejects.toThrow("Parent department must be active");

    await expect(
      service.updateDepartment(adminContext, ids.department, { parentId: ids.child }),
    ).rejects.toThrow("cycle");
  });

  it("maps duplicate department code conflicts", async () => {
    const { service, repository, auditService } = createService();
    repository.createInTransaction.mockRejectedValueOnce({ code: "P2002" });

    await expect(
      service.createDepartment(adminContext, { code: "DUP", name: "Duplicate" }),
    ).rejects.toBeInstanceOf(DepartmentManagementConflictError);

    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("blocks disable for active users, active role scopes, or pending tasks", async () => {
    const { service, repository } = createService();
    repository.getDisableImpactSummary.mockResolvedValueOnce({
      ...emptyImpactSummary,
      activeUsersCount: 1,
    });

    await expect(
      service.disableDepartment(adminContext, ids.department, { reason: "inactive" }),
    ).rejects.toBeInstanceOf(DepartmentManagementConflictError);

    repository.getDisableImpactSummary.mockResolvedValueOnce({
      ...emptyImpactSummary,
      activeUserRoleScopesCount: 1,
    });
    await expect(service.disableDepartment(adminContext, ids.department, {})).rejects.toThrow(
      "cannot be disabled",
    );

    repository.getDisableImpactSummary.mockResolvedValueOnce({
      ...emptyImpactSummary,
      pendingWorkflowTasksCount: 1,
    });
    await expect(service.disableDepartment(adminContext, ids.department, {})).rejects.toThrow(
      "cannot be disabled",
    );
  });

  it("allows disable with historical achievements and fees and records impact summary", async () => {
    const { service, repository, prisma, auditService } = createService();

    const result = await service.disableDepartment(adminContext, ids.department, {
      reason: "restructure",
    });

    expect(repository.disableInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      ids.department,
      expect.any(Date),
    );
    expect(result.impactSummary.activeOrUnarchivedAchievementsCount).toBe(2);
    expect(result.impactSummary.feeRecordsCount).toBe(3);
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        newValue: expect.objectContaining({
          operation: "DEPARTMENT_DISABLE",
          reason: "restructure",
          impactSummary: emptyImpactSummary,
        }),
      }),
    );
  });

  it("enables a department and records safe audit metadata", async () => {
    const { service, repository, auditService } = createService();
    repository.findById.mockResolvedValueOnce(
      makeDepartment({
        status: DepartmentStatus.ARCHIVED,
        archivedAt: now,
      }),
    );

    await service.enableDepartment(adminContext, ids.department, { reason: "restored" });

    expect(repository.enableInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.department,
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        newValue: expect.objectContaining({
          operation: "DEPARTMENT_ENABLE",
          reason: "restored",
        }),
      }),
    );
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).not.toContain(
      "password",
    );
  });
});

const createService = () => {
  const repository = {
    findMany: vi.fn().mockResolvedValue({ items: [makeDepartment()], total: 1, page: 1, pageSize: 20 }),
    findTreeRows: vi.fn().mockResolvedValue([makeDepartment()]),
    findById: vi.fn().mockImplementation(async (departmentId: string) =>
      makeDepartment({
        id: departmentId,
        code: departmentId === ids.parent ? "ROOT" : "AI_RESEARCH",
        parentId: null,
      }),
    ),
    createInTransaction: vi.fn().mockResolvedValue(makeDepartment()),
    updateInTransaction: vi.fn().mockResolvedValue(makeDepartment({ name: "Updated Department" })),
    disableInTransaction: vi.fn().mockResolvedValue(
      makeDepartment({ status: DepartmentStatus.ARCHIVED, archivedAt: now }),
    ),
    enableInTransaction: vi.fn().mockResolvedValue(makeDepartment()),
    getDisableImpactSummary: vi.fn().mockResolvedValue(emptyImpactSummary),
    isPrismaUniqueConflict: vi.fn((error: unknown) =>
      Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002"),
    ),
    isPrismaRecordNotFound: vi.fn((error: unknown) =>
      Boolean(error && typeof error === "object" && "code" in error && error.code === "P2025"),
    ),
  };

  const rbacPolicy = {
    hasPermission: vi.fn().mockReturnValue(allowDecision("allowed")),
  };

  const prisma = {
    tx: { department: {}, auditLog: {} },
    $transaction: vi.fn(async (callback) => callback(prisma.tx)),
  };

  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-1" }),
  };

  const service = new DepartmentManagementService(
    repository as unknown as DepartmentManagementRepository,
    rbacPolicy as never,
    prisma as never,
    auditService as never,
  );

  return { service, repository, rbacPolicy, prisma, auditService };
};
