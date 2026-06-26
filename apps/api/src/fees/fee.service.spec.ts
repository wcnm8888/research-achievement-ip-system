import { describe, expect, it, vi } from "vitest";
import { DepartmentStatus } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import { FeeRepository } from "./fee.repository";
import { FeeService } from "./fee.service";
import { FeeTypeCode, FundSourceCode, PayStatusCode } from "./domain/fee-domain.types";
import {
  FeeAchievementParentRecord,
  FeeRecordRecord,
  FeeStateRecord,
} from "./domain/fee-repository.types";
import {
  FeeConflictError,
  FeeDepartmentUnavailableError,
  FeeInvalidTransitionError,
  FeeNotFoundError,
  FeePermissionDeniedError,
} from "./domain/fee-service.errors";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const dueDate = new Date("2026-07-01T00:00:00.000Z");
const paidDate = new Date("2026-06-18T00:00:00.000Z");
const tx = { feeRecord: {}, auditLog: {} };
const feeReadableWhere = { departmentId: { in: [ids.department] } };
const feeManageWhere = { departmentId: { in: [ids.department] } };
const achievementManageWhere = { departmentId: { in: [ids.department] } };

const makeContext = (
  permissionCodes: readonly PermissionCode[] = [
    PermissionCode.feeReadDepartment,
    PermissionCode.feeManageDepartment,
  ],
): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [RoleCode.researcher],
  permissionCodes,
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
});

const makeFeeRecord = (overrides: Partial<FeeRecordRecord> = {}): FeeRecordRecord => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  fundSource: FundSourceCode.department,
  amount: "1200.50",
  dueDate,
  paidDate: null,
  payStatus: PayStatusCode.pending,
  voucherNo: "VOUCHER-001",
  createdById: ids.user,
  updatedById: ids.user,
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  archivedAt: null,
  ...overrides,
});

const makeFeeState = (overrides: Partial<FeeStateRecord> = {}): FeeStateRecord => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  dueDate,
  paidDate: null,
  payStatus: PayStatusCode.pending,
  voucherNo: "VOUCHER-001",
  updatedById: ids.user,
  archivedAt: null,
  ...overrides,
});

const makeParent = (
  overrides: Partial<FeeAchievementParentRecord> = {},
): FeeAchievementParentRecord => ({
  id: ids.achievement,
  status: "ARCHIVED",
  departmentId: ids.department,
  department: {
    status: DepartmentStatus.ACTIVE,
    archivedAt: null,
  },
  ownerUserId: ids.user,
  secretLevel: SecretLevelCode.internal,
  ...overrides,
});

const createService = () => {
  const repository = {
    findMany: vi.fn().mockResolvedValue([makeFeeRecord()]),
    findByIdWhere: vi.fn().mockResolvedValue(makeFeeRecord()),
    findAchievementParentByIdWhere: vi.fn().mockResolvedValue(makeParent()),
    createInTransaction: vi.fn().mockResolvedValue(makeFeeRecord()),
    findStateByIdWhereInTransaction: vi.fn().mockResolvedValue(makeFeeState()),
    transitionPayStatusInTransaction: vi
      .fn()
      .mockResolvedValue(makeFeeState({ payStatus: PayStatusCode.paid, paidDate })),
    isPrismaUniqueConflict: vi.fn((error: unknown) => (error as { code?: string })?.code === "P2002"),
  };
  const rbacPolicy = {
    hasPermission: vi.fn((context: UserContext | null | undefined, permission: PermissionCode) =>
      context?.permissionCodes.includes(permission)
        ? { effect: "ALLOW" as const, reason: "allowed" }
        : { effect: "DENY" as const, reason: "denied", missingPermissions: [permission] },
    ),
    hasAnyPermission: vi.fn((context: UserContext | null | undefined, permissions: readonly PermissionCode[]) =>
      permissions.some((permission) => context?.permissionCodes.includes(permission))
        ? { effect: "ALLOW" as const, reason: "allowed" }
        : { effect: "DENY" as const, reason: "denied", missingPermissions: permissions },
    ),
  };
  const policyQueryFactory = {
    feeReadableWhere: vi.fn().mockReturnValue(feeReadableWhere),
    feeDepartmentWhere: vi.fn().mockReturnValue(feeManageWhere),
    achievementDepartmentWhere: vi.fn().mockReturnValue(achievementManageWhere),
  };
  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };
  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-log" }),
  };

  const service = new FeeService(
    repository as unknown as FeeRepository,
    rbacPolicy as unknown as RbacPolicyService,
    policyQueryFactory as unknown as PolicyQueryFactory,
    prisma as unknown as PrismaService,
    auditService as unknown as AuditService,
  );

  return {
    auditService,
    policyQueryFactory,
    prisma,
    repository,
    rbacPolicy,
    service,
  };
};

describe("FeeService.listFees", () => {
  it("uses the fee readable scope and query filters", async () => {
    const { repository, policyQueryFactory, service } = createService();
    const context = makeContext([PermissionCode.feeReadDepartment]);

    await service.listFees(context, {
      achievementId: ids.achievement,
      feeType: FeeTypeCode.patentAnnual,
      payStatus: PayStatusCode.pending,
      dueDateFrom: "2026-06-01",
      dueDateTo: "2026-12-31",
      take: 20,
    });

    expect(policyQueryFactory.feeReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.findMany).toHaveBeenCalledWith({
      where: feeReadableWhere,
      achievementId: ids.achievement,
      departmentId: undefined,
      feeType: FeeTypeCode.patentAnnual,
      payStatus: PayStatusCode.pending,
      dueDateFrom: new Date("2026-06-01"),
      dueDateTo: new Date("2026-12-31"),
      includeArchived: undefined,
      take: 20,
    });
  });

  it("denies reads when neither fee read nor manage permission is present", async () => {
    const { repository, service } = createService();

    await expect(service.listFees(makeContext([]), {})).rejects.toBeInstanceOf(
      FeePermissionDeniedError,
    );
    expect(repository.findMany).not.toHaveBeenCalled();
  });
});

describe("FeeService.getFee", () => {
  it("uses scoped fee where for detail reads", async () => {
    const { repository, policyQueryFactory, service } = createService();
    const context = makeContext([PermissionCode.feeReadDepartment]);

    await service.getFee(context, ids.feeRecord);

    expect(policyQueryFactory.feeReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.findByIdWhere).toHaveBeenCalledWith(ids.feeRecord, feeReadableWhere);
  });

  it("returns not found for missing or out-of-scope fee records", async () => {
    const { repository, service } = createService();
    repository.findByIdWhere.mockResolvedValueOnce(null);

    await expect(service.getFee(makeContext(), ids.feeRecord)).rejects.toBeInstanceOf(
      FeeNotFoundError,
    );
  });
});

describe("FeeService.createFee", () => {
  it("denies create when the user only has fee read permission", async () => {
    const { auditService, repository, service } = createService();

    await expect(
      service.createFee(makeContext([PermissionCode.feeReadDepartment]), {
        achievementId: ids.achievement,
        feeType: FeeTypeCode.patentAnnual,
        amount: 1200.5,
        dueDate: "2026-07-01",
      }),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    expect(repository.findAchievementParentByIdWhere).not.toHaveBeenCalled();
    expect(repository.createInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("uses achievement parent facts, parent department, and shared audit transaction", async () => {
    const { auditService, policyQueryFactory, prisma, repository, service } = createService();
    const context = makeContext([PermissionCode.feeManageDepartment]);

    await service.createFee(context, {
      achievementId: ids.achievement,
      feeType: FeeTypeCode.patentAnnual,
      fundSource: FundSourceCode.department,
      amount: 1200.5,
      dueDate: "2026-07-01",
      voucherNo: "VOUCHER-001",
    });

    expect(policyQueryFactory.achievementDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.feeManageDepartment,
    );
    expect(repository.findAchievementParentByIdWhere).toHaveBeenCalledWith(
      ids.achievement,
      achievementManageWhere,
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.createInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        achievementId: ids.achievement,
        departmentId: ids.department,
        amount: 1200.5,
        voucherNo: "VOUCHER-001",
        createdById: ids.user,
        updatedById: ids.user,
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.create,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.feeRecord,
          id: ids.feeRecord,
          departmentId: ids.department,
        }),
      }),
    );
    expectAuditPayloadHasNoSensitiveFeeFields(
      auditService.recordEventInTransaction.mock.calls[0]![1],
    );
  });

  it("does not create fees when the related achievement is missing or out of scope", async () => {
    const { auditService, repository, service } = createService();
    repository.findAchievementParentByIdWhere.mockResolvedValueOnce(null);

    await expect(
      service.createFee(makeContext([PermissionCode.feeManageDepartment]), {
        achievementId: ids.achievement,
        feeType: FeeTypeCode.patentAnnual,
        amount: 1200.5,
        dueDate: "2026-07-01",
      }),
    ).rejects.toBeInstanceOf(FeeNotFoundError);
    expect(repository.createInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("does not create fees when the related achievement department is archived", async () => {
    const { auditService, repository, service } = createService();
    repository.findAchievementParentByIdWhere.mockResolvedValueOnce(
      makeParent({
        department: {
          status: DepartmentStatus.ARCHIVED,
          archivedAt: new Date("2026-06-25T00:00:00.000Z"),
        },
      }),
    );

    await expect(
      service.createFee(makeContext([PermissionCode.feeManageDepartment]), {
        achievementId: ids.achievement,
        feeType: FeeTypeCode.patentAnnual,
        amount: 1200.5,
        dueDate: "2026-07-01",
      }),
    ).rejects.toBeInstanceOf(FeeDepartmentUnavailableError);
    expect(repository.createInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("maps unique conflicts to fee conflict errors", async () => {
    const { repository, service } = createService();
    repository.createInTransaction.mockRejectedValueOnce({ code: "P2002" });

    await expect(
      service.createFee(makeContext([PermissionCode.feeManageDepartment]), {
        achievementId: ids.achievement,
        feeType: FeeTypeCode.patentAnnual,
        amount: 1200.5,
        dueDate: "2026-07-01",
      }),
    ).rejects.toBeInstanceOf(FeeConflictError);
  });

  it("fails the shared transaction when audit write fails", async () => {
    const { auditService, repository, service } = createService();
    auditService.recordEventInTransaction.mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      service.createFee(makeContext([PermissionCode.feeManageDepartment]), {
        achievementId: ids.achievement,
        feeType: FeeTypeCode.patentAnnual,
        amount: 1200.5,
        dueDate: "2026-07-01",
      }),
    ).rejects.toThrow("audit failed");
    expect(repository.createInTransaction).toHaveBeenCalledOnce();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledOnce();
  });
});

describe("FeeService.markFeePaid", () => {
  it("denies mark-paid when the user only has fee read permission", async () => {
    const { auditService, repository, service } = createService();

    await expect(
      service.markFeePaid(makeContext([PermissionCode.feeReadDepartment]), ids.feeRecord, {}),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    expect(repository.findStateByIdWhereInTransaction).not.toHaveBeenCalled();
    expect(repository.transitionPayStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("marks pending fees as paid in the shared audit transaction", async () => {
    const { auditService, policyQueryFactory, repository, service } = createService();
    const context = makeContext([PermissionCode.feeManageDepartment]);

    await service.markFeePaid(context, ids.feeRecord, {
      paidDate: "2026-06-18",
      voucherNo: "PAY-001",
    });

    expect(policyQueryFactory.feeDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.feeManageDepartment,
    );
    expect(repository.findStateByIdWhereInTransaction).toHaveBeenCalledWith(
      tx,
      ids.feeRecord,
      feeManageWhere,
    );
    expect(repository.transitionPayStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        feeRecordId: ids.feeRecord,
        expectedStatus: PayStatusCode.pending,
        nextStatus: PayStatusCode.paid,
        paidDate: "2026-06-18",
        voucherNo: "PAY-001",
        updatedById: ids.user,
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.markFeePaid,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.feeRecord,
          id: ids.feeRecord,
          departmentId: ids.department,
        }),
      }),
    );
    expectAuditPayloadHasNoSensitiveFeeFields(
      auditService.recordEventInTransaction.mock.calls[0]![1],
    );
  });

  it("marks overdue fees as paid", async () => {
    const { repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus: PayStatusCode.overdue }),
    );

    await service.markFeePaid(
      makeContext([PermissionCode.feeManageDepartment]),
      ids.feeRecord,
      {},
    );

    expect(repository.transitionPayStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        expectedStatus: PayStatusCode.overdue,
        nextStatus: PayStatusCode.paid,
      }),
    );
  });

  it.each([
    PayStatusCode.paid,
    PayStatusCode.waived,
    PayStatusCode.cancelled,
  ])("rejects mark-paid from terminal status %s", async (payStatus) => {
    const { auditService, repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus }),
    );

    await expect(
      service.markFeePaid(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        {},
      ),
    ).rejects.toBeInstanceOf(FeeInvalidTransitionError);
    expect(repository.transitionPayStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("returns not found for missing or out-of-scope fee records", async () => {
    const { auditService, repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(null);

    await expect(
      service.markFeePaid(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        {},
      ),
    ).rejects.toBeInstanceOf(FeeNotFoundError);
    expect(repository.transitionPayStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("fails the shared transaction when mark-paid audit write fails", async () => {
    const { auditService, repository, service } = createService();
    auditService.recordEventInTransaction.mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      service.markFeePaid(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        {},
      ),
    ).rejects.toThrow("audit failed");
    expect(repository.transitionPayStatusInTransaction).toHaveBeenCalledOnce();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledOnce();
  });
});

const expectAuditPayloadHasNoSensitiveFeeFields = (input: unknown): void => {
  const serialized = JSON.stringify(input);

  expect(serialized).not.toContain("amount");
  expect(serialized).not.toContain("voucherNo");
  expect(serialized).not.toContain("title");
  expect(serialized).not.toContain("abstract");
  expect(serialized).not.toContain("storageKey");
  expect(serialized).not.toContain("checksum");
  expect(serialized).not.toContain("contributors");
};
