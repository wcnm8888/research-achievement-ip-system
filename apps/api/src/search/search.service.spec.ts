import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { GrantStatusCode } from "../authorization/constants/grant-status-code";
import { GrantTypeCode } from "../authorization/constants/grant-type-code";
import { GranteeTypeCode } from "../authorization/constants/grantee-type-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { ResourceGrantPolicyService } from "../authorization/policy/resource-grant-policy.service";
import { SecretAccessPolicyService } from "../authorization/policy/secret-access-policy.service";
import {
  AchievementStatusCode,
  AchievementTypeCode,
} from "../achievements/domain/achievement-domain.types";
import { UserContext } from "../identity/user-context";
import { FeeTypeCode, PayStatusCode } from "../fees/domain/fee-domain.types";
import { SearchAdapter } from "./adapters/search-adapter";
import { SearchService } from "./search.service";
import { SearchAccessDeniedError } from "./domain/search-errors";
import { SearchTargetTypeCode } from "./domain/search-domain.types";

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  feeRecord: "80000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const now = new Date("2026-06-18T00:00:00.000Z");

const context: UserContext = {
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [],
  permissionCodes: [PermissionCode.achievementReadDepartment, PermissionCode.feeReadDepartment],
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
};

const makeAchievement = () => ({
  id: ids.achievement,
  type: AchievementTypeCode.paper,
  title: "Sensitive paper title",
  status: AchievementStatusCode.archived,
  secretLevel: "SECRET" as const,
  departmentId: ids.department,
  ownerUserId: ids.user,
  createdAt: now,
  updatedAt: now,
  paperDetail: { doi: "10.1000/demo" },
  patentDetail: null,
  softwareCopyrightDetail: null,
});

const makeFee = () => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  dueDate: now,
  paidDate: null,
  payStatus: PayStatusCode.pending,
  createdAt: now,
  updatedAt: now,
});

const createPolicyQueryFactory = () => ({
  achievementReadableWhere: vi.fn().mockReturnValue({ departmentId: { in: [ids.department] } }),
  feeReadableWhere: vi.fn().mockReturnValue({ departmentId: { in: [ids.department] } }),
});

const createService = (adapterResult = {}) => {
  const adapter: SearchAdapter = {
    search: vi.fn().mockResolvedValue({
      achievements: [],
      fees: [],
      achievementGrants: [],
      ...adapterResult,
    }),
  };
  const policyQueryFactory = createPolicyQueryFactory();
  const service = new SearchService(
    adapter,
    policyQueryFactory as never,
    new SecretAccessPolicyService(new ResourceGrantPolicyService()),
  );

  return { adapter, policyQueryFactory, service };
};

describe("SearchService", () => {
  it("builds adapter input from Step 4 policy where factories", async () => {
    const { adapter, policyQueryFactory, service } = createService();

    await service.search(context, {
      keyword: "paper",
      targetTypes: [SearchTargetTypeCode.achievement],
      take: 10,
    });

    expect(policyQueryFactory.achievementReadableWhere).toHaveBeenCalledWith(context);
    expect(policyQueryFactory.feeReadableWhere).not.toHaveBeenCalled();
    expect(adapter.search).toHaveBeenCalledWith({
      query: {
        keyword: "paper",
        targetTypes: [SearchTargetTypeCode.achievement],
        take: 10,
      },
      achievementWhere: { departmentId: { in: [ids.department] } },
      feeWhere: undefined,
    });
  });

  it("redacts restricted achievement business details without an effective secret grant", async () => {
    const { service } = createService({ achievements: [makeAchievement()] });

    const result = await service.search(context, {
      targetTypes: [SearchTargetTypeCode.achievement],
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        targetType: SearchTargetTypeCode.achievement,
        id: ids.achievement,
        title: null,
        identifiers: {},
        redacted: true,
      }),
    ]);
  });

  it("returns limited achievement details when an effective SECRET_READ grant exists", async () => {
    const { service } = createService({
      achievements: [makeAchievement()],
      achievementGrants: [
        {
          resourceType: ResourceTypeCode.achievement,
          resourceId: ids.achievement,
          granteeType: GranteeTypeCode.user,
          granteeId: ids.user,
          grantType: GrantTypeCode.secretRead,
          status: GrantStatusCode.active,
          startsAt: null,
          expiresAt: null,
          revokedAt: null,
        },
      ],
    });

    const result = await service.search(context, {
      targetTypes: [SearchTargetTypeCode.achievement],
    });

    expect(result.items).toEqual([
      expect.objectContaining({
        title: "Sensitive paper title",
        identifiers: { doi: "10.1000/demo" },
        redacted: false,
      }),
    ]);
  });

  it("returns fee search results without amount or voucher fields", async () => {
    const { service } = createService({ fees: [makeFee()] });

    const result = await service.search(context, {
      targetTypes: [SearchTargetTypeCode.feeRecord],
    });

    expect(result.items).toEqual([
      {
        targetType: SearchTargetTypeCode.feeRecord,
        id: ids.feeRecord,
        achievementId: ids.achievement,
        departmentId: ids.department,
        feeType: FeeTypeCode.patentAnnual,
        payStatus: PayStatusCode.pending,
        dueDate: now,
        paidDate: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    expect(result.items[0]).not.toHaveProperty("amount");
    expect(result.items[0]).not.toHaveProperty("voucherNo");
  });

  it("requires a user context with a department", async () => {
    const { service } = createService();

    await expect(service.search(null as never, {})).rejects.toBeInstanceOf(SearchAccessDeniedError);
  });
});
