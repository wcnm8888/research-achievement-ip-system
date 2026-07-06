import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { UserContext } from "../identity/user-context";
import { AchievementConversionRepository } from "./achievement-conversion.repository";
import { AchievementConversionService } from "./achievement-conversion.service";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
} from "./domain/achievement-conversion-domain.types";
import {
  AchievementConversionInvalidPayloadError,
  AchievementConversionInvalidStateError,
  AchievementConversionPermissionDeniedError,
} from "./domain/achievement-conversion-service.errors";
import { AchievementConversionRecord } from "./domain/achievement-conversion-repository.types";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  conversion: "31000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const context: UserContext = {
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [],
  permissionCodes: [PermissionCode.achievementReadDepartment],
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
};

const makeConversion = (
  overrides: Partial<AchievementConversionRecord> = {},
): AchievementConversionRecord => ({
  id: ids.conversion,
  achievementId: ids.achievement,
  departmentId: ids.department,
  conversionType: AchievementConversionTypeCode.license,
  counterpartyName: "Example Company",
  contractAmount: "100000.00",
  revenueAmount: "60000.00",
  status: AchievementConversionStatusCode.signed,
  conversionDate: new Date("2026-07-01T00:00:00.000Z"),
  benefitDistributionSummary: "Team 60%, institute 40%",
  contractStatus: AchievementConversionContractStatusCode.signed,
  revenueStatus: AchievementConversionRevenueStatusCode.partial,
  revenueDueDate: new Date("2026-08-01T00:00:00.000Z"),
  revenueReceivedDate: new Date("2026-07-15T00:00:00.000Z"),
  benefitDistributionJson: [
    {
      category: "TEAM",
      label: "Research team",
      amount: 30000,
      ratio: 0.5,
      note: "Internal allocation note",
    },
  ],
  evaluationEffect: AchievementConversionEvaluationEffectCode.positive,
  evaluationSummary: "Local evaluation summary",
  evaluationDate: new Date("2026-09-01T00:00:00.000Z"),
  remarks: "Internal ledger note",
  createdById: ids.user,
  updatedById: ids.user,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  achievement: {
    id: ids.achievement,
    status: "ARCHIVED",
  },
  ...overrides,
});

const makeService = (permissionAllowed = true) => {
  const conversion = makeConversion();
  const repository = {
    findAchievementParentByIdWhere: vi.fn().mockResolvedValue({
      id: ids.achievement,
      status: "ARCHIVED",
      departmentId: ids.department,
      ownerUserId: ids.user,
      secretLevel: "INTERNAL",
    }),
    listByAchievementWhere: vi.fn().mockResolvedValue([conversion]),
    findByIdWhere: vi.fn().mockResolvedValue(conversion),
    createInTransaction: vi.fn().mockResolvedValue(conversion),
    updateInTransaction: vi.fn().mockResolvedValue({
      ...conversion,
      status: AchievementConversionStatusCode.paid,
      revenueAmount: "80000.00",
      revenueStatus: AchievementConversionRevenueStatusCode.paid,
    }),
  };
  const rbacPolicy = {
    hasPermission: vi.fn().mockReturnValue(
      permissionAllowed
        ? { effect: "ALLOW" }
        : { effect: "DENY", reason: "denied" },
    ),
  };
  const policyQueryFactory = {
    achievementDepartmentWhere: vi.fn().mockReturnValue({
      departmentId: { in: [ids.department] },
    }),
  };
  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-id" }),
  };
  const prisma = {
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        achievementConversion: {},
        achievement: {},
        auditLog: {},
      }),
    ),
  };
  const service = new AchievementConversionService(
    repository as unknown as AchievementConversionRepository,
    rbacPolicy as never,
    policyQueryFactory as never,
    prisma as never,
    auditService as never,
  );

  return { auditService, policyQueryFactory, prisma, repository, rbacPolicy, service };
};

describe("AchievementConversionService", () => {
  it("lists conversion records through department-scoped achievement policy", async () => {
    const { policyQueryFactory, repository, service } = makeService();

    await expect(service.listByAchievement(context, ids.achievement)).resolves.toEqual([
      makeConversion(),
    ]);

    expect(policyQueryFactory.achievementDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.achievementReadDepartment,
    );
    expect(repository.listByAchievementWhere).toHaveBeenCalledWith({
      achievementId: ids.achievement,
      achievementWhere: { departmentId: { in: [ids.department] } },
    });
  });

  it("rejects create for non-archived achievements", async () => {
    const { repository, service } = makeService();
    repository.findAchievementParentByIdWhere.mockResolvedValueOnce({
      id: ids.achievement,
      status: "PENDING_ARCHIVE",
      departmentId: ids.department,
      ownerUserId: ids.user,
      secretLevel: "INTERNAL",
    });

    await expect(
      service.createConversion(context, ids.achievement, {
        conversionType: AchievementConversionTypeCode.license,
        counterpartyName: "Example Company",
        contractAmount: 100000,
        revenueAmount: 60000,
        status: AchievementConversionStatusCode.signed,
      }),
    ).rejects.toBeInstanceOf(AchievementConversionInvalidStateError);

    expect(repository.createInTransaction).not.toHaveBeenCalled();
  });

  it("creates archived achievement conversion records with masked audit summary", async () => {
    const { auditService, repository, service } = makeService();

    await service.createConversion(context, ids.achievement, {
      conversionType: AchievementConversionTypeCode.license,
      counterpartyName: "Example Company",
      contractAmount: 100000,
      revenueAmount: 60000,
      status: AchievementConversionStatusCode.signed,
      conversionDate: "2026-07-01",
      benefitDistributionSummary: "Team 60%, institute 40%",
      contractStatus: AchievementConversionContractStatusCode.active,
      revenueStatus: AchievementConversionRevenueStatusCode.partial,
      revenueDueDate: "2026-08-01",
      revenueReceivedDate: "2026-07-15",
      benefitDistributionJson: [
        {
          category: "TEAM",
          label: " Research team ",
          amount: 30000,
          ratio: 0.5,
          note: " Internal allocation note ",
        },
      ],
      evaluationEffect: AchievementConversionEvaluationEffectCode.positive,
      evaluationSummary: "Local evaluation summary",
      evaluationDate: "2026-09-01",
      remarks: "Internal ledger note",
    });

    expect(repository.createInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        achievementId: ids.achievement,
        departmentId: ids.department,
        counterpartyName: "Example Company",
        contractStatus: AchievementConversionContractStatusCode.active,
        revenueStatus: AchievementConversionRevenueStatusCode.partial,
        revenueDueDate: new Date("2026-08-01"),
        revenueReceivedDate: new Date("2026-07-15"),
        benefitDistributionJson: [
          {
            category: "TEAM",
            label: "Research team",
            amount: 30000,
            ratio: 0.5,
            note: "Internal allocation note",
          },
        ],
        evaluationEffect: AchievementConversionEvaluationEffectCode.positive,
        evaluationSummary: "Local evaluation summary",
        evaluationDate: new Date("2026-09-01"),
        createdById: ids.user,
      }),
    );
    const auditInput = auditService.recordEventInTransaction.mock.calls[0]?.[1];
    expect(auditInput.target.type).toBe("ACHIEVEMENT_CONVERSION");
    expect(JSON.stringify(auditInput)).not.toContain("Example Company");
    expect(JSON.stringify(auditInput)).not.toContain("Team 60%");
    expect(JSON.stringify(auditInput)).not.toContain("Internal ledger note");
    expect(JSON.stringify(auditInput)).not.toContain("Research team");
    expect(JSON.stringify(auditInput)).not.toContain("Local evaluation summary");
    expect(auditInput.newValue).toMatchObject({
      achievementConversionId: ids.conversion,
      achievementId: ids.achievement,
      contractStatus: AchievementConversionContractStatusCode.signed,
      revenueStatus: AchievementConversionRevenueStatusCode.partial,
      evaluationEffect: AchievementConversionEvaluationEffectCode.positive,
      contractAmountProvided: true,
      revenueAmountProvided: true,
      benefitDistributionSummaryProvided: true,
      benefitDistributionJsonProvided: true,
      benefitDistributionItemCount: 1,
      evaluationSummaryProvided: true,
      remarksProvided: true,
    });
  });

  it("updates archived achievement conversion records through department-scoped policy", async () => {
    const { auditService, policyQueryFactory, repository, service } = makeService();

    await expect(
      service.updateConversion(context, ids.conversion, {
        status: AchievementConversionStatusCode.paid,
        revenueAmount: 80000,
        revenueStatus: AchievementConversionRevenueStatusCode.paid,
        evaluationEffect: AchievementConversionEvaluationEffectCode.mixed,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: ids.conversion,
        status: AchievementConversionStatusCode.paid,
        revenueAmount: "80000.00",
      }),
    );

    expect(policyQueryFactory.achievementDepartmentWhere).toHaveBeenCalledWith(
      context,
      PermissionCode.achievementReadDepartment,
    );
    expect(repository.findByIdWhere).toHaveBeenCalledWith({
      conversionId: ids.conversion,
      achievementWhere: { departmentId: { in: [ids.department] } },
    });
    expect(repository.updateInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        conversionId: ids.conversion,
        revenueAmount: 80000,
        revenueStatus: AchievementConversionRevenueStatusCode.paid,
        evaluationEffect: AchievementConversionEvaluationEffectCode.mixed,
        updatedById: ids.user,
      }),
    );
    const auditInput = auditService.recordEventInTransaction.mock.calls[0]?.[1];
    expect(auditInput.action).toBe("UPDATE");
    expect(JSON.stringify(auditInput)).not.toContain("Example Company");
    expect(JSON.stringify(auditInput)).not.toContain("Internal allocation note");
  });

  it("rejects list, create, and update when department read permission is missing", async () => {
    const { repository, service } = makeService(false);

    await expect(
      service.listByAchievement(context, ids.achievement),
    ).rejects.toBeInstanceOf(AchievementConversionPermissionDeniedError);
    await expect(
      service.createConversion(context, ids.achievement, {
        conversionType: AchievementConversionTypeCode.license,
        counterpartyName: "Example Company",
        contractAmount: 100000,
        revenueAmount: 60000,
        status: AchievementConversionStatusCode.signed,
      }),
    ).rejects.toBeInstanceOf(AchievementConversionPermissionDeniedError);
    await expect(
      service.updateConversion(context, ids.conversion, {
        status: AchievementConversionStatusCode.paid,
      }),
    ).rejects.toBeInstanceOf(AchievementConversionPermissionDeniedError);

    expect(repository.listByAchievementWhere).not.toHaveBeenCalled();
    expect(repository.findAchievementParentByIdWhere).not.toHaveBeenCalled();
    expect(repository.findByIdWhere).not.toHaveBeenCalled();
  });

  it("rejects updates that would make revenue exceed contract total", async () => {
    const { repository, service } = makeService();
    repository.findByIdWhere.mockResolvedValueOnce(makeConversion({
      contractAmount: "100000.00",
      revenueAmount: "60000.00",
    }));

    await expect(
      service.updateConversion(context, ids.conversion, {
        revenueAmount: 120000,
      }),
    ).rejects.toBeInstanceOf(AchievementConversionInvalidPayloadError);

    expect(repository.updateInTransaction).not.toHaveBeenCalled();
  });

  it("rejects benefit distribution totals above the stored revenue amount", async () => {
    const { service } = makeService();

    await expect(
      service.createConversion(context, ids.achievement, {
        conversionType: AchievementConversionTypeCode.license,
        counterpartyName: "Example Company",
        contractAmount: 100000,
        revenueAmount: 60000,
        status: AchievementConversionStatusCode.signed,
        benefitDistributionJson: [
          { category: "TEAM", label: "Research team", amount: 70000 },
        ],
      }),
    ).rejects.toBeInstanceOf(AchievementConversionInvalidPayloadError);
  });

  it("rejects benefit distribution ratios above one", async () => {
    const { service } = makeService();

    await expect(
      service.updateConversion(context, ids.conversion, {
        benefitDistributionJson: [
          { category: "TEAM", label: "Research team", ratio: 0.7 },
          { category: "UNIT", label: "Institute", ratio: 0.4 },
        ],
      }),
    ).rejects.toBeInstanceOf(AchievementConversionInvalidPayloadError);
  });
});
