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
import { ExportFieldSelectionError } from "../export/fields";
import { UserContext } from "../identity/user-context";
import {
  WorkflowActionTypeCode,
  WorkflowTaskStatusCode,
} from "../workflow/domain/workflow-domain.types";
import {
  FeeReviewerNotFoundError,
  WorkflowInvalidStateError,
} from "../workflow/domain/workflow-errors";
import { WorkflowService } from "../workflow/workflow.service";
import { FeeRepository } from "./fee.repository";
import { FeeService } from "./fee.service";
import {
  FeeReviewHistoryActionCode,
  FeeReviewStatusCode,
  FeeTypeCode,
  FeeWarningTypeCode,
  FundSourceCode,
  PayStatusCode,
} from "./domain/fee-domain.types";
import {
  FeeAchievementParentRecord,
  FeeRecordRecord,
  FeeReviewHistoryRecord,
  FeeStateRecord,
} from "./domain/fee-repository.types";
import {
  FeeConflictError,
  FeeDepartmentUnavailableError,
  FeeInvalidTransitionError,
  FeeNotFoundError,
  FeePermissionDeniedError,
  FeeWorkflowUnavailableError,
} from "./domain/fee-service.errors";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const dueDate = new Date("2026-07-01T00:00:00.000Z");
const paidDate = new Date("2026-06-18T00:00:00.000Z");
const reviewedAt = new Date("2026-06-19T00:00:00.000Z");
const tx = { feeRecord: {}, feeReviewHistory: {}, auditLog: {} };
const feeReadableWhere = { departmentId: { in: [ids.department] } };
const feeManageWhere = { departmentId: { in: [ids.department] } };
const feeReviewWhere = { departmentId: { in: [ids.department] } };
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
  reviewStatus: FeeReviewStatusCode.pending,
  reviewedById: null,
  reviewedAt: null,
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
  reviewStatus: FeeReviewStatusCode.pending,
  reviewedById: null,
  reviewedAt: null,
  updatedById: ids.user,
  archivedAt: null,
  ...overrides,
});

const makeReviewHistory = (
  overrides: Partial<FeeReviewHistoryRecord> = {},
): FeeReviewHistoryRecord => ({
  id: "81000000-0000-4000-8000-000000000001",
  feeRecordId: ids.feeRecord,
  departmentId: ids.department,
  reviewerId: ids.user,
  action: FeeReviewHistoryActionCode.approve,
  fromStatus: FeeReviewStatusCode.pending,
  toStatus: FeeReviewStatusCode.approved,
  reason: "finance checked",
  createdAt: reviewedAt,
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
    findWarnings: vi.fn().mockResolvedValue([
      {
        ...makeFeeRecord(),
        warningType: FeeWarningTypeCode.dueSoon,
        daysUntilDue: 13,
      },
    ]),
    findByIdWhere: vi.fn().mockResolvedValue(makeFeeRecord()),
    findStateByIdWhere: vi.fn().mockResolvedValue(makeFeeState()),
    findReviewHistoryByFeeRecordId: vi.fn().mockResolvedValue([makeReviewHistory()]),
    findAchievementParentByIdWhere: vi.fn().mockResolvedValue(makeParent()),
    createInTransaction: vi.fn().mockResolvedValue(makeFeeRecord()),
    findStateByIdWhereInTransaction: vi.fn().mockResolvedValue(makeFeeState()),
    transitionPayStatusInTransaction: vi
      .fn()
      .mockResolvedValue(makeFeeState({ payStatus: PayStatusCode.paid, paidDate })),
    transitionReviewStatusInTransaction: vi
      .fn()
      .mockResolvedValue(
        makeFeeState({
          reviewStatus: FeeReviewStatusCode.approved,
          reviewedById: ids.user,
          reviewedAt,
        }),
      ),
    appendReviewHistoryInTransaction: vi.fn().mockResolvedValue(makeReviewHistory()),
    archiveFeeInTransaction: vi
      .fn()
      .mockResolvedValue(
        makeFeeState({ archivedAt: new Date("2026-06-20T00:00:00.000Z") }),
      ),
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
    feeDepartmentWhere: vi.fn(
      (_context: UserContext | null | undefined, permission?: PermissionCode) =>
        permission === PermissionCode.feeReviewDepartment
          ? feeReviewWhere
          : feeManageWhere,
    ),
    achievementDepartmentWhere: vi.fn().mockReturnValue(achievementManageWhere),
  };
  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };
  const auditService = {
    recordEvent: vi.fn().mockResolvedValue({ id: "audit-log" }),
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-log" }),
  };
  const workflowService = {
    ensureFeeReviewWorkflowInTransaction: vi.fn().mockResolvedValue({ id: "workflow-instance" }),
    completeFeeReviewTaskInTransaction: vi.fn().mockResolvedValue({ id: "workflow-task" }),
  };

  const service = new FeeService(
    repository as unknown as FeeRepository,
    rbacPolicy as unknown as RbacPolicyService,
    policyQueryFactory as unknown as PolicyQueryFactory,
    prisma as unknown as PrismaService,
    auditService as unknown as AuditService,
    workflowService as unknown as WorkflowService,
  );

  return {
    auditService,
    policyQueryFactory,
    prisma,
    repository,
    rbacPolicy,
    service,
    workflowService,
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

  it("exports a safe fee ledger CSV through the readable policy", async () => {
    const { auditService, repository, service } = createService();

    const csv = await service.exportCsv(makeContext([PermissionCode.feeReadDepartment]), {
      payStatus: PayStatusCode.pending,
    });

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: feeReadableWhere,
        payStatus: PayStatusCode.pending,
        take: 1000,
      }),
    );
    expect(csv).toContain("ID,Achievement ID,Department ID,Fee type");
    expect(csv).toContain(`${ids.feeRecord},${ids.achievement},${ids.department},PATENT_ANNUAL`);
    expect(csv).not.toContain("createdById");
    expect(csv).not.toContain("updatedById");
    expect(csv).not.toContain("reviewedById");
    expect(csv).not.toContain("password");
    expect(csv).not.toContain("token");
    expect(csv).not.toContain("cookie");
    expect(csv).not.toContain("raw");
    expect(auditService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        newValue: expect.objectContaining({
          operation: "EXPORT_CSV",
          exportType: "FEE_LEDGER",
          rowLimit: 1000,
        }),
      }),
    );
  });

  it("exports a safe fee ledger XLSX through the readable policy", async () => {
    const { auditService, repository, service } = createService();

    const xlsx = await service.exportXlsx(makeContext([PermissionCode.feeReadDepartment]), {
      payStatus: PayStatusCode.pending,
    });
    const serialized = xlsx.toString("utf8");

    expect(repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: feeReadableWhere,
        payStatus: PayStatusCode.pending,
        take: 1000,
      }),
    );
    expect(xlsx.subarray(0, 2).toString("utf8")).toBe("PK");
    expect(serialized).toContain("Achievement ID");
    expect(serialized).toContain("PATENT_ANNUAL");
    expect(serialized).not.toContain("createdById");
    expect(serialized).not.toContain("updatedById");
    expect(serialized).not.toContain("reviewedById");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("raw");
    expect(auditService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        newValue: expect.objectContaining({
          operation: "EXPORT_XLSX",
          exportType: "FEE_LEDGER",
          rowLimit: 1000,
        }),
      }),
    );
  });

  it("limits fee CSV export to requested safe fields in request order", async () => {
    const { service } = createService();

    const csv = await service.exportCsv(makeContext([PermissionCode.feeReadDepartment]), {
      fields: "payStatus,id,amount",
    });

    expect(csv).toContain("Pay status,ID,Amount\r\nPENDING,");
    expect(csv).not.toContain("Achievement ID");
    expect(csv).not.toContain("createdById");
    expect(csv).not.toContain("updatedById");
    expect(csv).not.toContain("reviewedById");
  });

  it("limits fee XLSX export to requested safe fields", async () => {
    const { service } = createService();

    const xlsx = await service.exportXlsx(makeContext([PermissionCode.feeReadDepartment]), {
      fields: "id,payStatus",
    });
    const serialized = xlsx.toString("utf8");

    expect(serialized).toContain("ID");
    expect(serialized).toContain("Pay status");
    expect(serialized).not.toContain("Achievement ID");
    expect(serialized).not.toContain("createdById");
    expect(serialized).not.toContain("updatedById");
    expect(serialized).not.toContain("reviewedById");
  });

  it("rejects unsupported fee export fields", async () => {
    const { service } = createService();

    await expect(
      service.exportCsv(makeContext([PermissionCode.feeReadDepartment]), {
        fields: "id,createdById",
      }),
    ).rejects.toBeInstanceOf(ExportFieldSelectionError);
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

describe("FeeService.listFeeReviewHistory", () => {
  it.each([
    [PermissionCode.feeReadDepartment],
    [PermissionCode.feeManageDepartment],
  ])("lists history for scoped fee readers with %s", async (permission) => {
    const { policyQueryFactory, repository, service } = createService();
    const context = makeContext([permission]);

    const result = await service.listFeeReviewHistory(context, ids.feeRecord);

    expect(policyQueryFactory.feeReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.findStateByIdWhere).toHaveBeenCalledWith(
      ids.feeRecord,
      feeReadableWhere,
    );
    expect(repository.findReviewHistoryByFeeRecordId).toHaveBeenCalledWith(
      ids.feeRecord,
    );
    expect(result).toEqual([makeReviewHistory()]);
    expectHistoryHasNoSensitiveFeeFields(result);
  });

  it("lists history for scoped fee reviewers without requiring fee read", async () => {
    const { policyQueryFactory, repository, service } = createService();
    const context = makeContext([PermissionCode.feeReviewDepartment]);

    await service.listFeeReviewHistory(context, ids.feeRecord);

    expect(policyQueryFactory.feeDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.feeReviewDepartment,
    );
    expect(repository.findStateByIdWhere).toHaveBeenCalledWith(
      ids.feeRecord,
      feeReviewWhere,
    );
    expect(repository.findReviewHistoryByFeeRecordId).toHaveBeenCalledWith(
      ids.feeRecord,
    );
  });

  it("denies history reads without fee read, manage, or review permission", async () => {
    const { repository, service } = createService();

    await expect(
      service.listFeeReviewHistory(makeContext([]), ids.feeRecord),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    expect(repository.findStateByIdWhere).not.toHaveBeenCalled();
    expect(repository.findReviewHistoryByFeeRecordId).not.toHaveBeenCalled();
  });

  it("returns not found for missing, archived, or out-of-scope history parent fee", async () => {
    const { repository, service } = createService();
    repository.findStateByIdWhere.mockResolvedValueOnce(null);

    await expect(
      service.listFeeReviewHistory(
        makeContext([PermissionCode.feeReviewDepartment]),
        ids.feeRecord,
      ),
    ).rejects.toBeInstanceOf(FeeNotFoundError);
    expect(repository.findReviewHistoryByFeeRecordId).not.toHaveBeenCalled();
  });
});

describe("FeeService.getFeeWarnings", () => {
  it("uses readable scope and returns warning counts", async () => {
    const { repository, policyQueryFactory, service } = createService();
    const context = makeContext([PermissionCode.feeReadDepartment]);

    const result = await service.getFeeWarnings(context, {
      today: "2026-06-18",
      dueSoonDays: 15,
      take: 10,
    });

    expect(policyQueryFactory.feeReadableWhere).toHaveBeenCalledWith(context);
    expect(repository.findWarnings).toHaveBeenCalledWith({
      where: feeReadableWhere,
      today: new Date("2026-06-18T00:00:00.000Z"),
      dueSoonDays: 15,
      take: 10,
    });
    expect(result).toEqual(
      expect.objectContaining({
        today: "2026-06-18",
        dueSoonDays: 15,
        total: 1,
        overdueCount: 0,
        dueSoonCount: 1,
      }),
    );
  });

  it("denies warning reads when neither fee read nor manage permission is present", async () => {
    const { repository, service } = createService();

    await expect(service.getFeeWarnings(makeContext([]), {})).rejects.toBeInstanceOf(
      FeePermissionDeniedError,
    );
    expect(repository.findWarnings).not.toHaveBeenCalled();
  });
});

describe("FeeService.createFee", () => {
  it("denies create when the user only has fee read permission", async () => {
    const { auditService, repository, service, workflowService } = createService();

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
    const {
      auditService,
      policyQueryFactory,
      prisma,
      repository,
      service,
      workflowService,
    } = createService();
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
    expect(workflowService.ensureFeeReviewWorkflowInTransaction).toHaveBeenCalledWith(
      tx,
      {
        feeRecordId: ids.feeRecord,
        departmentId: ids.department,
        requestedById: ids.user,
        requestedAt: makeFeeRecord().createdAt,
      },
    );
    expectAuditPayloadHasNoSensitiveFeeFields(
      auditService.recordEventInTransaction.mock.calls[0]![1],
    );
  });

  it("maps missing fee reviewers to a workflow unavailable error", async () => {
    const { repository, service, workflowService } = createService();
    workflowService.ensureFeeReviewWorkflowInTransaction.mockRejectedValueOnce(
      new FeeReviewerNotFoundError(ids.department),
    );

    await expect(
      service.createFee(makeContext([PermissionCode.feeManageDepartment]), {
        achievementId: ids.achievement,
        feeType: FeeTypeCode.patentAnnual,
        amount: 1200.5,
        dueDate: "2026-07-01",
      }),
    ).rejects.toBeInstanceOf(FeeWorkflowUnavailableError);
    expect(repository.createInTransaction).toHaveBeenCalledOnce();
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
    const { auditService, repository, service, workflowService } = createService();
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
    expect(workflowService.ensureFeeReviewWorkflowInTransaction).not.toHaveBeenCalled();
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
    const {
      auditService,
      policyQueryFactory,
      repository,
      service,
      workflowService,
    } = createService();
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

describe("FeeService.waiveFee", () => {
  it("denies waive when the user only has fee read permission", async () => {
    const { auditService, repository, service } = createService();

    await expect(
      service.waiveFee(makeContext([PermissionCode.feeReadDepartment]), ids.feeRecord, {
        reason: "approved waiver",
      }),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    expect(repository.findStateByIdWhereInTransaction).not.toHaveBeenCalled();
    expect(repository.transitionPayStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("waives pending fees with reason in the shared audit transaction", async () => {
    const { auditService, policyQueryFactory, repository, service } = createService();
    const context = makeContext([PermissionCode.feeManageDepartment]);
    repository.transitionPayStatusInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus: PayStatusCode.waived }),
    );

    await service.waiveFee(context, ids.feeRecord, { reason: "policy exemption" });

    expect(policyQueryFactory.feeDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.feeManageDepartment,
    );
    expect(repository.transitionPayStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        feeRecordId: ids.feeRecord,
        expectedStatus: PayStatusCode.pending,
        nextStatus: PayStatusCode.waived,
        updatedById: ids.user,
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.waiveFee,
        newValue: expect.objectContaining({
          oldStatus: PayStatusCode.pending,
          newStatus: PayStatusCode.waived,
          reason: "policy exemption",
        }),
      }),
    );
    expectAuditPayloadHasNoSensitiveFeeFields(
      auditService.recordEventInTransaction.mock.calls[0]![1],
    );
  });

  it("waives overdue fees", async () => {
    const { repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus: PayStatusCode.overdue }),
    );
    repository.transitionPayStatusInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus: PayStatusCode.waived }),
    );

    await service.waiveFee(
      makeContext([PermissionCode.feeManageDepartment]),
      ids.feeRecord,
      { reason: "overdue waived by policy" },
    );

    expect(repository.transitionPayStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        expectedStatus: PayStatusCode.overdue,
        nextStatus: PayStatusCode.waived,
      }),
    );
  });

  it.each([
    PayStatusCode.paid,
    PayStatusCode.waived,
    PayStatusCode.cancelled,
  ])("rejects waive from terminal status %s", async (payStatus) => {
    const { auditService, repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus }),
    );

    await expect(
      service.waiveFee(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        { reason: "terminal status cannot change" },
      ),
    ).rejects.toBeInstanceOf(FeeInvalidTransitionError);
    expect(repository.transitionPayStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("fails the shared transaction when waive audit write fails", async () => {
    const { auditService, repository, service } = createService();
    repository.transitionPayStatusInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus: PayStatusCode.waived }),
    );
    auditService.recordEventInTransaction.mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      service.waiveFee(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        { reason: "audit should be atomic" },
      ),
    ).rejects.toThrow("audit failed");
    expect(repository.transitionPayStatusInTransaction).toHaveBeenCalledOnce();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledOnce();
  });
});

describe("FeeService.cancelFee", () => {
  it("denies cancel when the user only has fee read permission", async () => {
    const { auditService, repository, service } = createService();

    await expect(
      service.cancelFee(makeContext([PermissionCode.feeReadDepartment]), ids.feeRecord, {
        reason: "invalid fee",
      }),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    expect(repository.findStateByIdWhereInTransaction).not.toHaveBeenCalled();
    expect(repository.transitionPayStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("cancels pending fees with reason in the shared audit transaction", async () => {
    const { auditService, repository, service } = createService();
    repository.transitionPayStatusInTransaction.mockResolvedValueOnce(
      makeFeeState({ payStatus: PayStatusCode.cancelled }),
    );

    await service.cancelFee(
      makeContext([PermissionCode.feeManageDepartment]),
      ids.feeRecord,
      { reason: "duplicate fee record" },
    );

    expect(repository.transitionPayStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        expectedStatus: PayStatusCode.pending,
        nextStatus: PayStatusCode.cancelled,
        updatedById: ids.user,
      }),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.cancelFee,
        newValue: expect.objectContaining({
          oldStatus: PayStatusCode.pending,
          newStatus: PayStatusCode.cancelled,
          reason: "duplicate fee record",
        }),
      }),
    );
  });

  it("returns not found for missing or out-of-scope fee records", async () => {
    const { auditService, repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(null);

    await expect(
      service.cancelFee(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        { reason: "not found path" },
      ),
    ).rejects.toBeInstanceOf(FeeNotFoundError);
    expect(repository.transitionPayStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });
});

describe("FeeService fee review", () => {
  it("denies review when fee:review_department is missing", async () => {
    const { auditService, repository, service } = createService();

    await expect(
      service.approveFeeReview(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        {},
      ),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    await expect(
      service.rejectFeeReview(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        { reason: "missing support" },
      ),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    expect(repository.findStateByIdWhereInTransaction).not.toHaveBeenCalled();
    expect(repository.transitionReviewStatusInTransaction).not.toHaveBeenCalled();
    expect(repository.appendReviewHistoryInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("approves pending fee review in the shared audit transaction", async () => {
    const {
      auditService,
      policyQueryFactory,
      repository,
      service,
      workflowService,
    } = createService();
    const context = makeContext([PermissionCode.feeReviewDepartment]);

    const result = await service.approveFeeReview(context, ids.feeRecord, {
      reason: "finance checked",
    });

    expect(policyQueryFactory.feeDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.feeReviewDepartment,
    );
    expect(repository.findStateByIdWhereInTransaction).toHaveBeenCalledWith(
      tx,
      ids.feeRecord,
      feeReviewWhere,
    );
    expect(workflowService.completeFeeReviewTaskInTransaction).toHaveBeenCalledWith(
      tx,
      {
        context,
        feeRecordId: ids.feeRecord,
        action: WorkflowActionTypeCode.approve,
        nextTaskStatus: WorkflowTaskStatusCode.approved,
        reviewedAt: expect.any(Date),
        comment: "finance checked",
      },
    );
    expect(repository.transitionReviewStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        feeRecordId: ids.feeRecord,
        where: feeReviewWhere,
        expectedReviewStatus: FeeReviewStatusCode.pending,
        nextReviewStatus: FeeReviewStatusCode.approved,
        reviewedById: ids.user,
        reviewedAt: expect.any(Date),
      }),
    );
    expect(repository.appendReviewHistoryInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        feeRecordId: ids.feeRecord,
        departmentId: ids.department,
        reviewerId: ids.user,
        action: FeeReviewHistoryActionCode.approve,
        fromStatus: FeeReviewStatusCode.pending,
        toStatus: FeeReviewStatusCode.approved,
        reason: "finance checked",
        createdAt: expect.any(Date),
      }),
    );
    expect(result.payStatus).toBe(PayStatusCode.pending);
    expect(result.reviewStatus).toBe(FeeReviewStatusCode.approved);
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.approve,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.feeRecord,
          id: ids.feeRecord,
          departmentId: ids.department,
        }),
        newValue: expect.objectContaining({
          oldReviewStatus: FeeReviewStatusCode.pending,
          newReviewStatus: FeeReviewStatusCode.approved,
          payStatus: PayStatusCode.pending,
          reason: "finance checked",
        }),
      }),
    );
    expectAuditPayloadHasNoSensitiveFeeFields(
      auditService.recordEventInTransaction.mock.calls[0]![1],
    );
    expectHistoryHasNoSensitiveFeeFields(
      repository.appendReviewHistoryInTransaction.mock.calls[0]![1],
    );
  });

  it("rejects pending fee review with a required reason and does not change pay status", async () => {
    const { auditService, repository, service, workflowService } = createService();
    repository.transitionReviewStatusInTransaction.mockResolvedValueOnce(
      makeFeeState({
        payStatus: PayStatusCode.pending,
        reviewStatus: FeeReviewStatusCode.rejected,
        reviewedById: ids.user,
        reviewedAt,
      }),
    );

    const result = await service.rejectFeeReview(
      makeContext([PermissionCode.feeReviewDepartment]),
      ids.feeRecord,
      { reason: "missing payment evidence" },
    );

    expect(repository.transitionReviewStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        expectedReviewStatus: FeeReviewStatusCode.pending,
        nextReviewStatus: FeeReviewStatusCode.rejected,
      }),
    );
    expect(workflowService.completeFeeReviewTaskInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        feeRecordId: ids.feeRecord,
        action: WorkflowActionTypeCode.reject,
        nextTaskStatus: WorkflowTaskStatusCode.rejected,
        comment: "missing payment evidence",
      }),
    );
    expect(repository.appendReviewHistoryInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        feeRecordId: ids.feeRecord,
        action: FeeReviewHistoryActionCode.reject,
        fromStatus: FeeReviewStatusCode.pending,
        toStatus: FeeReviewStatusCode.rejected,
        reason: "missing payment evidence",
      }),
    );
    expect(result.payStatus).toBe(PayStatusCode.pending);
    expect(result.reviewStatus).toBe(FeeReviewStatusCode.rejected);
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.reject,
        newValue: expect.objectContaining({
          oldReviewStatus: FeeReviewStatusCode.pending,
          newReviewStatus: FeeReviewStatusCode.rejected,
          reason: "missing payment evidence",
        }),
      }),
    );
    expectAuditPayloadHasNoSensitiveFeeFields(
      auditService.recordEventInTransaction.mock.calls[0]![1],
    );
    expectHistoryHasNoSensitiveFeeFields(
      repository.appendReviewHistoryInTransaction.mock.calls[0]![1],
    );
  });

  it.each([FeeReviewStatusCode.approved, FeeReviewStatusCode.rejected])(
    "rejects repeated review when current review status is %s",
    async (reviewStatus) => {
      const { auditService, repository, service, workflowService } = createService();
      repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(
        makeFeeState({ reviewStatus, reviewedById: ids.user, reviewedAt }),
      );

      await expect(
        service.approveFeeReview(
          makeContext([PermissionCode.feeReviewDepartment]),
          ids.feeRecord,
          {},
        ),
      ).rejects.toBeInstanceOf(FeeConflictError);
      expect(repository.transitionReviewStatusInTransaction).not.toHaveBeenCalled();
      expect(repository.appendReviewHistoryInTransaction).not.toHaveBeenCalled();
      expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
      expect(workflowService.completeFeeReviewTaskInTransaction).not.toHaveBeenCalled();
    },
  );

  it("rejects review when the pending fee workflow task is missing or completed", async () => {
    const { auditService, repository, service, workflowService } = createService();
    workflowService.completeFeeReviewTaskInTransaction.mockRejectedValueOnce(
      new WorkflowInvalidStateError("Active pending fee review workflow task is required."),
    );

    await expect(
      service.approveFeeReview(
        makeContext([PermissionCode.feeReviewDepartment]),
        ids.feeRecord,
        {},
      ),
    ).rejects.toBeInstanceOf(FeeConflictError);
    expect(repository.transitionReviewStatusInTransaction).not.toHaveBeenCalled();
    expect(repository.appendReviewHistoryInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("returns not found for missing, out-of-scope, or archived fee records", async () => {
    const { auditService, repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(null);

    await expect(
      service.rejectFeeReview(
        makeContext([PermissionCode.feeReviewDepartment]),
        ids.feeRecord,
        { reason: "not found path" },
      ),
    ).rejects.toBeInstanceOf(FeeNotFoundError);
    expect(repository.transitionReviewStatusInTransaction).not.toHaveBeenCalled();
    expect(repository.appendReviewHistoryInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("fails the shared transaction when review audit write fails", async () => {
    const { auditService, repository, service } = createService();
    auditService.recordEventInTransaction.mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      service.approveFeeReview(
        makeContext([PermissionCode.feeReviewDepartment]),
        ids.feeRecord,
        {},
      ),
    ).rejects.toThrow("audit failed");
    expect(repository.transitionReviewStatusInTransaction).toHaveBeenCalledOnce();
    expect(repository.appendReviewHistoryInTransaction).toHaveBeenCalledOnce();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledOnce();
  });
});

describe("FeeService.archiveFee", () => {
  it("denies archive when the user only has fee read permission", async () => {
    const { auditService, repository, service } = createService();

    await expect(
      service.archiveFee(makeContext([PermissionCode.feeReadDepartment]), ids.feeRecord, {
        reason: "local soft archive",
      }),
    ).rejects.toBeInstanceOf(FeePermissionDeniedError);
    expect(repository.findStateByIdWhereInTransaction).not.toHaveBeenCalled();
    expect(repository.archiveFeeInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("soft archives fees with reason in the shared audit transaction", async () => {
    const { auditService, policyQueryFactory, repository, service } = createService();
    const context = makeContext([PermissionCode.feeManageDepartment]);

    const result = await service.archiveFee(context, ids.feeRecord, {
      reason: "local soft archive",
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
    expect(repository.archiveFeeInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        feeRecordId: ids.feeRecord,
        expectedStatus: PayStatusCode.pending,
        updatedById: ids.user,
      }),
    );
    expect(result.archivedAt).toEqual(new Date("2026-06-20T00:00:00.000Z"));
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: AuditActionCode.archive,
        newValue: expect.objectContaining({
          oldStatus: PayStatusCode.pending,
          newStatus: PayStatusCode.pending,
          reason: "local soft archive",
          archivedAt: "2026-06-20T00:00:00.000Z",
        }),
      }),
    );
    expectAuditPayloadHasNoSensitiveFeeFields(
      auditService.recordEventInTransaction.mock.calls[0]![1],
    );
  });

  it("returns not found for missing, out-of-scope, or already archived fee records", async () => {
    const { auditService, repository, service } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValueOnce(null);

    await expect(
      service.archiveFee(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        { reason: "not found path" },
      ),
    ).rejects.toBeInstanceOf(FeeNotFoundError);
    expect(repository.archiveFeeInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("fails the shared transaction when archive audit write fails", async () => {
    const { auditService, repository, service } = createService();
    auditService.recordEventInTransaction.mockRejectedValueOnce(new Error("audit failed"));

    await expect(
      service.archiveFee(
        makeContext([PermissionCode.feeManageDepartment]),
        ids.feeRecord,
        { reason: "audit should be atomic" },
      ),
    ).rejects.toThrow("audit failed");
    expect(repository.archiveFeeInTransaction).toHaveBeenCalledOnce();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledOnce();
  });
});

const expectAuditPayloadHasNoSensitiveFeeFields = (input: unknown): void => {
  const serialized = JSON.stringify(input);

  expect(serialized).not.toContain("amount");
  expect(serialized).not.toContain("voucherNo");
  expect(serialized).not.toContain("VOUCHER-001");
  expect(serialized).not.toContain("title");
  expect(serialized).not.toContain("abstract");
  expect(serialized).not.toContain("storageKey");
  expect(serialized).not.toContain("checksum");
  expect(serialized).not.toContain("contributors");
};

const expectHistoryHasNoSensitiveFeeFields = (input: unknown): void => {
  const serialized = JSON.stringify(input);

  expect(serialized).not.toContain("amount");
  expect(serialized).not.toContain("voucherNo");
  expect(serialized).not.toContain("VOUCHER-001");
  expect(serialized).not.toContain("paidDate");
  expect(serialized).not.toContain("dueDate");
  expect(serialized).not.toContain("storageKey");
  expect(serialized).not.toContain("checksum");
  expect(serialized).not.toContain("raw");
  expect(serialized).not.toContain("cookie");
  expect(serialized).not.toContain("token");
  expect(serialized).not.toContain("databaseUrl");
};
