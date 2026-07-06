import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { DepartmentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { PolicyQueryFactory } from "../authorization/policy/policy-query.factory";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { SecretAccessPolicyService } from "../authorization/policy/secret-access-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  ActiveWorkflowInstanceAlreadyExistsError,
  DepartmentReviewerNotFoundError,
  WorkflowDepartmentUnavailableError,
  WorkflowInvalidStateError,
} from "../workflow/domain/workflow-errors";
import { WorkflowService } from "../workflow/workflow.service";
import { AchievementRepository } from "./achievement.repository";
import { AchievementService } from "./achievement.service";
import { AchievementStatusTransitionConflictError } from "./domain/achievement-repository.errors";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  ContributorTypeCode,
  SecretLevelCode,
} from "./domain/achievement-domain.types";
import {
  AchievementAccessDeniedError,
  AchievementConflictError,
  AchievementInvalidPayloadError,
  AchievementInvalidStateError,
  AchievementPermissionDeniedError,
  AchievementUnsupportedOperationError,
} from "./domain/achievement-service.errors";
import {
  AchievementAggregate,
  AchievementListRecord,
  AchievementStateRecord,
} from "./domain/achievement-repository.types";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  achievement: "30000000-0000-4000-8000-000000000001",
  conflict: "30000000-0000-4000-8000-000000000099",
  department: "10000000-0000-4000-8000-000000000001",
  otherDepartment: "10000000-0000-4000-8000-000000000099",
  user: "40000000-0000-4000-8000-000000000001",
  reviewer: "40000000-0000-4000-8000-000000000002",
  workflowInstance: "50000000-0000-4000-8000-000000000001",
};

const localResearcherAcceptanceMarker = "[LOCAL-SYNTHETIC-ROLE-ACCEPTANCE]";
const researcherPermissionProfile = [
  PermissionCode.achievementCreate,
  PermissionCode.achievementReadOwn,
  PermissionCode.achievementUpdateOwn,
  PermissionCode.achievementSubmit,
] as const;

const makeContext = (
  permissionCodes: readonly PermissionCode[] = [
    PermissionCode.achievementCreate,
    PermissionCode.achievementReadOwn,
    PermissionCode.achievementUpdateOwn,
    PermissionCode.achievementSubmit,
    PermissionCode.achievementArchive,
  ],
): UserContext => ({
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [],
  permissionCodes,
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
});

const makeAggregate = (
  overrides: Partial<AchievementAggregate> = {},
): AchievementAggregate =>
  ({
    id: ids.achievement,
    type: AchievementTypeCode.paper,
    title: "Paper draft",
    status: AchievementStatusCode.draft,
    secretLevel: SecretLevelCode.internal,
    departmentId: ids.department,
    ownerUserId: ids.user,
    submittedById: null,
    createdById: ids.user,
    updatedById: ids.user,
    archivedById: null,
    voidedById: null,
    version: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    submittedAt: null,
    archivedAt: null,
    voidedAt: null,
    voidReason: null,
    paperDetail: {},
    patentDetail: null,
    softwareCopyrightDetail: null,
    contributors: [],
    ...overrides,
  }) as AchievementAggregate;

const makeState = (
  overrides: Partial<AchievementStateRecord> = {},
): AchievementStateRecord =>
  ({
    id: ids.achievement,
    status: AchievementStatusCode.draft,
    secretLevel: SecretLevelCode.internal,
    departmentId: ids.department,
    ownerUserId: ids.user,
    submittedById: null,
    updatedById: ids.user,
    archivedById: null,
    voidedById: null,
    version: 1,
    submittedAt: null,
    archivedAt: null,
    voidedAt: null,
    voidReason: null,
    ...overrides,
  }) as AchievementStateRecord;

const makeListRecord = (
  overrides: Partial<AchievementListRecord> = {},
): AchievementListRecord =>
  ({
    id: ids.achievement,
    type: AchievementTypeCode.paper,
    title: "Paper draft",
    status: AchievementStatusCode.draft,
    secretLevel: SecretLevelCode.internal,
    departmentId: ids.department,
    ownerUserId: ids.user,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    submittedAt: null,
    archivedAt: null,
    voidedAt: null,
    ...overrides,
  }) as AchievementListRecord;

const createService = () => {
  const tx = {};
  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    department: {
      findFirst: vi.fn().mockResolvedValue({ id: ids.department }),
    },
  };
  const repository = {
    createDraft: vi.fn().mockResolvedValue(makeAggregate()),
    createDraftInTransaction: vi.fn().mockResolvedValue(makeAggregate()),
    updateDraft: vi.fn().mockResolvedValue(makeAggregate({ version: 2 })),
    updateDraftInTransaction: vi.fn().mockResolvedValue(makeAggregate({ version: 2 })),
    transitionStatus: vi.fn().mockResolvedValue(makeState({ version: 2 })),
    transitionStatusInTransaction: vi.fn().mockResolvedValue(makeState({ version: 2 })),
    findDetailByIdWhere: vi.fn().mockResolvedValue(makeAggregate()),
    findStateById: vi.fn().mockResolvedValue(makeState()),
    findStateByIdInTransaction: vi.fn().mockResolvedValue(makeState()),
    findStateByIdWhere: vi.fn().mockResolvedValue(makeState()),
    findStateByIdWhereInTransaction: vi.fn().mockResolvedValue(makeState()),
    list: vi.fn().mockResolvedValue({ items: [makeListRecord()], total: 1 }),
    findResourceGrantsForAchievement: vi.fn().mockResolvedValue([]),
    findResourceGrantsForAchievements: vi.fn().mockResolvedValue([]),
    findNormalizedConflict: vi.fn().mockResolvedValue(null),
    isPrismaUniqueConflict: vi.fn((error: unknown) => Boolean((error as { code?: string })?.code === "P2002")),
    getPrismaUniqueConflictTarget: vi.fn((error: unknown) => (error as { meta?: { target?: string[] } })?.meta?.target ?? []),
  };
  const workflowService = {
    prepareAchievementReviewOnSubmitInTransaction: vi.fn().mockResolvedValue({
      departmentReviewerId: ids.reviewer,
    }),
    createAchievementReviewOnSubmitInTransaction: vi.fn().mockResolvedValue({ id: "workflow" }),
    prepareAchievementArchiveInTransaction: vi.fn().mockResolvedValue({
      id: ids.workflowInstance,
    }),
    completeAchievementArchiveInTransaction: vi.fn().mockResolvedValue({
      id: ids.workflowInstance,
    }),
  };
  const rbacPolicy = {
    hasPermission: vi.fn((context: UserContext | null | undefined, permission: PermissionCode) =>
      context?.permissionCodes.includes(permission)
        ? { effect: "ALLOW" as const, reason: "allowed" }
        : { effect: "DENY" as const, reason: "denied", missingPermissions: [permission] },
    ),
    hasAnyPermission: vi.fn((
      context: UserContext | null | undefined,
      permissions: readonly PermissionCode[],
    ) => {
      const matchedPermission = permissions.find((permission) =>
        context?.permissionCodes.includes(permission),
      );

      return matchedPermission
        ? { effect: "ALLOW" as const, reason: "allowed" }
        : { effect: "DENY" as const, reason: "denied", missingPermissions: permissions };
    }),
  };
  const policyQueryFactory = {
    achievementReadableWhere: vi.fn().mockReturnValue({ ownerUserId: ids.user }),
    achievementOwnedWhere: vi.fn().mockReturnValue({ ownerUserId: ids.user }),
  };
  const secretAccessPolicy = {
    canReadResource: vi.fn().mockReturnValue({ effect: "ALLOW", reason: "allowed" }),
  };
  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-log" }),
  };

  const service = new AchievementService(
    repository as unknown as AchievementRepository,
    rbacPolicy as unknown as RbacPolicyService,
    policyQueryFactory as unknown as PolicyQueryFactory,
    secretAccessPolicy as unknown as SecretAccessPolicyService,
    prisma as unknown as PrismaService,
    workflowService as unknown as WorkflowService,
    auditService as unknown as AuditService,
  );

  return {
    service,
    prisma,
    tx,
    repository,
    workflowService,
    rbacPolicy,
    policyQueryFactory,
    secretAccessPolicy,
    auditService,
  };
};

describe("AchievementService dependency injection", () => {
  it("declares explicit constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AchievementService)).toEqual([
      AchievementRepository,
      RbacPolicyService,
      PolicyQueryFactory,
      SecretAccessPolicyService,
      PrismaService,
      WorkflowService,
      AuditService,
    ]);
  });
});

describe("AchievementService.list", () => {
  it("lists achievements through the Step 4 readable policy query", async () => {
    const { service, repository, policyQueryFactory } = createService();

    const result = await service.list(makeContext(), {
      status: AchievementStatusCode.draft,
      type: AchievementTypeCode.paper,
      keyword: " Paper ",
      page: 2,
      pageSize: 10,
    });

    expect(policyQueryFactory.achievementReadableWhere).toHaveBeenCalledWith(makeContext());
    expect(repository.list).toHaveBeenCalledWith({
      where: { ownerUserId: ids.user },
      filters: {
        status: AchievementStatusCode.draft,
        type: AchievementTypeCode.paper,
        keyword: "Paper",
      },
      page: 2,
      pageSize: 10,
    });
    expect(result).toEqual({
      items: [
        expect.objectContaining({
          id: ids.achievement,
          title: "Paper draft",
          isRestricted: false,
          isRedacted: false,
        }),
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it("returns an empty page when the readable policy has no achievement scope", async () => {
    const { service, repository, policyQueryFactory } = createService();
    policyQueryFactory.achievementReadableWhere.mockReturnValue({ id: { in: [] } });
    repository.list.mockResolvedValue({ items: [], total: 0 });

    await expect(service.list(makeContext([]), {})).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });
    expect(repository.list).toHaveBeenCalledWith({
      where: { id: { in: [] } },
      filters: {
        status: undefined,
        type: undefined,
        keyword: undefined,
      },
      page: 1,
      pageSize: 20,
    });
  });

  it("passes department and own-department union scopes from the policy factory to the repository", async () => {
    const { service, repository, policyQueryFactory } = createService();
    const departmentWhere = { departmentId: { in: [ids.department] } };
    const unionWhere = {
      OR: [{ ownerUserId: ids.user }, departmentWhere],
    };

    policyQueryFactory.achievementReadableWhere.mockReturnValueOnce(departmentWhere);
    await service.list(makeContext([PermissionCode.achievementReadDepartment]), {});
    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: departmentWhere }),
    );

    policyQueryFactory.achievementReadableWhere.mockReturnValueOnce(unionWhere);
    await service.list(
      makeContext([
        PermissionCode.achievementReadOwn,
        PermissionCode.achievementReadDepartment,
      ]),
      {},
    );
    expect(repository.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: unionWhere }),
    );
  });

  it("redacts restricted list titles when no effective secret read grant exists", async () => {
    const { service, repository, secretAccessPolicy } = createService();
    repository.list.mockResolvedValue({
      items: [
        makeListRecord({
          secretLevel: SecretLevelCode.secret,
          title: "Secret paper title",
        }),
      ],
      total: 1,
    });
    secretAccessPolicy.canReadResource.mockReturnValue({
      effect: "DENY",
      reason: "No effective resource access grant matches the request.",
    });

    const result = await service.list(makeContext(), {});

    expect(repository.findResourceGrantsForAchievements).toHaveBeenCalledWith([
      ids.achievement,
    ]);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        title: null,
        isRestricted: true,
        isRedacted: true,
      }),
    );
  });

  it("keeps restricted list titles when an effective secret read grant exists", async () => {
    const { service, repository, secretAccessPolicy } = createService();
    repository.list.mockResolvedValue({
      items: [
        makeListRecord({
          secretLevel: SecretLevelCode.confidential,
          title: "Granted confidential title",
        }),
      ],
      total: 1,
    });
    secretAccessPolicy.canReadResource.mockReturnValue({
      effect: "ALLOW",
      reason: "Effective SECRET_READ grant matched.",
    });

    const result = await service.list(makeContext(), {});

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        title: "Granted confidential title",
        isRestricted: true,
        isRedacted: false,
      }),
    );
  });
});

describe("AchievementService.createDraft", () => {
  it("creates a paper draft with context-owned department and normalized DOI", async () => {
    const { service, prisma, tx, repository, auditService } = createService();

    await service.createDraft(makeContext(), {
      type: AchievementTypeCode.paper,
      title: "Paper draft",
      secretLevel: SecretLevelCode.internal,
      departmentId: ids.department,
      paperDetail: { doi: "https://doi.org/10.1234/EXAMPLE" },
      patentDetail: undefined,
      softwareCopyrightDetail: undefined,
      contributors: [
        {
          name: "Author One",
          contributorType: ContributorTypeCode.author,
          sortOrder: 1,
        },
      ],
    });

    expect(repository.findNormalizedConflict).toHaveBeenCalledWith({
      doiNormalized: "10.1234/example",
      applicationNoNormalized: undefined,
      grantNoNormalized: undefined,
      registrationNoNormalized: undefined,
    }, undefined);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.createDraftInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        departmentId: ids.department,
        ownerUserId: ids.user,
        createdById: ids.user,
        updatedById: ids.user,
      }),
    );
    expect(repository.createDraft).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.user, departmentId: ids.department },
        action: AuditActionCode.create,
        target: {
          type: AuditTargetTypeCode.achievement,
          id: ids.achievement,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
        oldValue: null,
        newValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.create,
          status: AchievementStatusCode.draft,
          version: 1,
        },
      }),
    );
  });

  it("rejects a departmentId that differs from the current context", async () => {
    const { service, repository } = createService();

    await expect(
      service.createDraft(makeContext(), {
        type: AchievementTypeCode.paper,
        title: "Paper draft",
        departmentId: ids.otherDepartment,
        paperDetail: {},
        contributors: [
          {
            name: "Author One",
            contributorType: ContributorTypeCode.author,
            sortOrder: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AchievementInvalidPayloadError);
    expect(repository.createDraft).not.toHaveBeenCalled();
    expect(repository.createDraftInTransaction).not.toHaveBeenCalled();
  });

  it("rejects create when the current user department is archived", async () => {
    const { service, prisma, repository, auditService } = createService();
    prisma.department.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createDraft(makeContext(), {
        type: AchievementTypeCode.paper,
        title: "Paper draft",
        departmentId: ids.department,
        paperDetail: {},
        contributors: [
          {
            name: "Author One",
            contributorType: ContributorTypeCode.author,
            sortOrder: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AchievementUnsupportedOperationError);

    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: {
        id: ids.department,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true },
    });
    expect(repository.createDraftInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects create without achievement:create permission", async () => {
    const { service, auditService } = createService();

    await expect(
      service.createDraft(makeContext([]), {
        type: AchievementTypeCode.paper,
        title: "Paper draft",
        paperDetail: {},
        contributors: [
          {
            name: "Author One",
            contributorType: ContributorTypeCode.author,
            sortOrder: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AchievementPermissionDeniedError);
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("maps normalized precheck conflict to a business conflict", async () => {
    const { service, repository } = createService();
    repository.findNormalizedConflict.mockResolvedValue({
      field: "doi",
      normalizedValue: "10.1234/example",
      achievementId: ids.conflict,
    });

    await expect(
      service.createDraft(makeContext(), {
        type: AchievementTypeCode.paper,
        title: "Paper draft",
        paperDetail: { doi: "10.1234/example" },
        contributors: [
          {
            name: "Author One",
            contributorType: ContributorTypeCode.author,
            sortOrder: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AchievementConflictError);
    expect(repository.createDraftInTransaction).not.toHaveBeenCalled();
  });

  it("rejects create when audit writing fails in the same transaction boundary", async () => {
    const { service, tx, repository, auditService } = createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);

    await expect(
      service.createDraft(makeContext(), {
        type: AchievementTypeCode.paper,
        title: "Paper draft",
        paperDetail: {},
        contributors: [
          {
            name: "Author One",
            contributorType: ContributorTypeCode.author,
            sortOrder: 1,
          },
        ],
      }),
    ).rejects.toBe(auditError);

    expect(repository.createDraftInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });
});

describe("AchievementService researcher local acceptance profile", () => {
  it("allows researcher draft create, update, and submit without sensitive credential data", async () => {
    const { service, repository, workflowService, auditService } = createService();
    repository.transitionStatusInTransaction.mockResolvedValue(
      makeState({
        status: AchievementStatusCode.pendingDepartmentReview,
        version: 3,
        submittedAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
    );
    const context = makeContext(researcherPermissionProfile);

    await service.createDraft(context, {
      type: AchievementTypeCode.paper,
      title: `${localResearcherAcceptanceMarker} researcher draft`,
      secretLevel: SecretLevelCode.internal,
      departmentId: ids.department,
      paperDetail: {},
      contributors: [
        {
          name: "Local Synthetic Author",
          contributorType: ContributorTypeCode.author,
          sortOrder: 1,
        },
      ],
    });
    await service.updateDraft(context, ids.achievement, {
      title: `${localResearcherAcceptanceMarker} researcher draft updated`,
    });
    const submitted = await service.submitDraft(context, ids.achievement);

    expect(repository.createDraftInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        title: `${localResearcherAcceptanceMarker} researcher draft`,
        departmentId: ids.department,
        ownerUserId: ids.user,
      }),
    );
    expect(repository.updateDraftInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        achievementId: ids.achievement,
        title: `${localResearcherAcceptanceMarker} researcher draft updated`,
        updatedById: ids.user,
      }),
    );
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        achievementId: ids.achievement,
        submittedById: ids.user,
        departmentReviewerId: ids.reviewer,
      }),
    );
    expect(submitted.status).toBe(AchievementStatusCode.pendingDepartmentReview);

    const serializedAuditCalls = JSON.stringify(auditService.recordEventInTransaction.mock.calls);
    expect(serializedAuditCalls).not.toContain("passwordHash");
    expect(serializedAuditCalls).not.toContain("sessionHash");
    expect(serializedAuditCalls).not.toContain("credentialSecret");
    expect(serializedAuditCalls).not.toContain("token");
    expect(serializedAuditCalls).not.toContain("cookie");
  });

  it("does not allow researcher to archive achievements", async () => {
    const { service, prisma, repository, workflowService, auditService } = createService();

    await expect(
      service.archiveAchievement(makeContext(researcherPermissionProfile), ids.achievement),
    ).rejects.toBeInstanceOf(AchievementPermissionDeniedError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.completeAchievementArchiveInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });
});

describe("AchievementService.getDetail", () => {
  it("reads detail through the Step 4 readable policy query", async () => {
    const { service, repository, policyQueryFactory } = createService();

    await service.getDetail(makeContext(), ids.achievement);

    expect(policyQueryFactory.achievementReadableWhere).toHaveBeenCalledWith(makeContext());
    expect(repository.findDetailByIdWhere).toHaveBeenCalledWith(ids.achievement, {
      ownerUserId: ids.user,
    });
  });

  it("reads seeded demo admin detail through department-scoped read permission", async () => {
    const { service, repository, policyQueryFactory } = createService();
    const departmentWhere = { departmentId: { in: [ids.department] } };
    policyQueryFactory.achievementReadableWhere.mockReturnValueOnce(departmentWhere);

    await service.getDetail(
      makeContext([
        PermissionCode.achievementArchive,
        PermissionCode.achievementReadDepartment,
      ]),
      ids.achievement,
    );

    expect(policyQueryFactory.achievementReadableWhere).toHaveBeenCalledWith(
      expect.objectContaining({
        permissionCodes: [
          PermissionCode.achievementArchive,
          PermissionCode.achievementReadDepartment,
        ],
      }),
    );
    expect(repository.findDetailByIdWhere).toHaveBeenCalledWith(
      ids.achievement,
      departmentWhere,
    );
  });

  it("rejects detail reads before repository access when no achievement read permission exists", async () => {
    const { service, repository } = createService();

    await expect(
      service.getDetail(makeContext([PermissionCode.achievementArchive]), ids.achievement),
    ).rejects.toBeInstanceOf(AchievementAccessDeniedError);
    expect(repository.findDetailByIdWhere).not.toHaveBeenCalled();
  });

  it("uses forbidden semantics when a restricted achievement lacks SECRET_READ grant", async () => {
    const { service, repository, secretAccessPolicy } = createService();
    repository.findDetailByIdWhere.mockResolvedValue(
      makeAggregate({ secretLevel: SecretLevelCode.secret }),
    );
    secretAccessPolicy.canReadResource.mockReturnValue({
      effect: "DENY",
      reason: "No effective resource access grant matches the request.",
    });

    await expect(service.getDetail(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementAccessDeniedError,
    );
    expect(repository.findResourceGrantsForAchievement).toHaveBeenCalledWith(ids.achievement);
  });
});

describe("AchievementService.updateDraft", () => {
  it("updates only an owner DRAFT achievement and excludes current id from conflict checks", async () => {
    const { service, prisma, tx, repository, policyQueryFactory, auditService } =
      createService();

    await service.updateDraft(makeContext(), ids.achievement, {
      title: "Updated title",
      paperDetail: { doi: "10.1234/UPDATED" },
      patentDetail: undefined,
      softwareCopyrightDetail: undefined,
      contributors: undefined,
    });

    expect(policyQueryFactory.achievementOwnedWhere).toHaveBeenCalledWith(
      makeContext(),
      PermissionCode.achievementUpdateOwn,
    );
    expect(repository.findNormalizedConflict).toHaveBeenCalledWith(
      {
        doiNormalized: "10.1234/updated",
        applicationNoNormalized: undefined,
        grantNoNormalized: undefined,
        registrationNoNormalized: undefined,
      },
      ids.achievement,
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.updateDraftInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        achievementId: ids.achievement,
        title: "Updated title",
        updatedById: ids.user,
      }),
    );
    expect(repository.updateDraft).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.user, departmentId: ids.department },
        action: AuditActionCode.update,
        target: {
          type: AuditTargetTypeCode.achievement,
          id: ids.achievement,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
        oldValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.update,
          status: AchievementStatusCode.draft,
          version: 1,
        },
        newValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.update,
          status: AchievementStatusCode.draft,
          version: 2,
        },
      }),
    );
  });

  it("rejects contributor updates in Step 5B-2", async () => {
    const { service, repository } = createService();

    await expect(
      service.updateDraft(makeContext(), ids.achievement, {
        contributors: [
          {
            name: "Author One",
            contributorType: ContributorTypeCode.author,
            sortOrder: 1,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AchievementUnsupportedOperationError);
    expect(repository.updateDraft).not.toHaveBeenCalled();
    expect(repository.updateDraftInTransaction).not.toHaveBeenCalled();
  });

  it("rejects non-DRAFT updates", async () => {
    const { service, repository } = createService();
    repository.findDetailByIdWhere.mockResolvedValue(
      makeAggregate({ status: AchievementStatusCode.pendingDepartmentReview }),
    );

    await expect(
      service.updateDraft(makeContext(), ids.achievement, {
        title: "Updated title",
      }),
    ).rejects.toBeInstanceOf(AchievementInvalidStateError);
    expect(repository.updateDraftInTransaction).not.toHaveBeenCalled();
  });

  it("maps repository P2002 conflicts to a service conflict", async () => {
    const { service, repository } = createService();
    repository.updateDraftInTransaction.mockRejectedValue({
      code: "P2002",
      meta: { target: ["doi_normalized"] },
    });

    await expect(
      service.updateDraft(makeContext(), ids.achievement, {
        title: "Updated title",
      }),
    ).rejects.toBeInstanceOf(AchievementConflictError);
  });

  it("rejects update when audit writing fails in the same transaction boundary", async () => {
    const { service, tx, repository, auditService } = createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);

    await expect(
      service.updateDraft(makeContext(), ids.achievement, {
        title: "Updated title",
      }),
    ).rejects.toBe(auditError);

    expect(repository.updateDraftInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });
});

describe("AchievementService.submitDraft", () => {
  it("submits only an owner DRAFT achievement", async () => {
    const { service, prisma, tx, repository, workflowService, policyQueryFactory, auditService } =
      createService();
    repository.transitionStatusInTransaction.mockResolvedValue(
      makeState({
        status: AchievementStatusCode.pendingDepartmentReview,
        version: 2,
        submittedAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
    );

    await service.submitDraft(makeContext(), ids.achievement);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(policyQueryFactory.achievementOwnedWhere).toHaveBeenCalledWith(
      makeContext(),
      PermissionCode.achievementSubmit,
    );
    expect(repository.findStateByIdWhereInTransaction).toHaveBeenCalledWith(
      tx,
      ids.achievement,
      { ownerUserId: ids.user },
    );
    expect(workflowService.prepareAchievementReviewOnSubmitInTransaction).toHaveBeenCalledWith(
      tx,
      {
        achievementId: ids.achievement,
        departmentId: ids.department,
      },
    );
    expect(repository.transitionStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        achievementId: ids.achievement,
        expectedStatus: AchievementStatusCode.draft,
        nextStatus: AchievementStatusCode.pendingDepartmentReview,
        submittedById: ids.user,
        updatedById: ids.user,
        submittedAt: expect.any(Date),
      }),
    );
    const transitionCall = repository.transitionStatusInTransaction.mock.calls[0];
    expect(transitionCall).toBeDefined();
    const transitionInput = transitionCall![1];
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).toHaveBeenCalledWith(
      tx,
      {
        achievementId: ids.achievement,
        submittedById: ids.user,
        departmentReviewerId: ids.reviewer,
        submittedAt: transitionInput.submittedAt,
      },
    );
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.user, departmentId: ids.department },
        action: AuditActionCode.submit,
        target: {
          type: AuditTargetTypeCode.achievement,
          id: ids.achievement,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
        oldValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.submit,
          status: AchievementStatusCode.draft,
          version: 1,
        },
        newValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.submit,
          status: AchievementStatusCode.pendingDepartmentReview,
          version: 2,
          submittedAt: "2026-01-02T00:00:00.000Z",
        },
      }),
    );
  });

  it("rejects submit without achievement:submit permission", async () => {
    const { service, prisma, repository, workflowService, auditService } = createService();

    await expect(
      service.submitDraft(makeContext([PermissionCode.achievementUpdateOwn]), ids.achievement),
    ).rejects.toBeInstanceOf(AchievementPermissionDeniedError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects submitting a non-DRAFT achievement", async () => {
    const { service, repository, workflowService, auditService } = createService();
    repository.findStateByIdWhereInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.pendingDepartmentReview }),
    );

    await expect(service.submitDraft(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementInvalidStateError,
    );
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("maps concurrent submit conflicts to invalid state", async () => {
    const { service, repository, workflowService } = createService();
    repository.transitionStatusInTransaction.mockRejectedValue(
      new AchievementStatusTransitionConflictError(
        ids.achievement,
        AchievementStatusCode.draft,
      ),
    );

    await expect(service.submitDraft(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementInvalidStateError,
    );
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).not.toHaveBeenCalled();
  });

  it("maps an existing active workflow instance to a business conflict", async () => {
    const { service, repository, workflowService } = createService();
    workflowService.prepareAchievementReviewOnSubmitInTransaction.mockRejectedValue(
      new ActiveWorkflowInstanceAlreadyExistsError(ids.achievement),
    );

    await expect(service.submitDraft(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementConflictError,
    );
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).not.toHaveBeenCalled();
  });

  it("maps missing department reviewer to an unsupported submit operation", async () => {
    const { service, repository, workflowService } = createService();
    workflowService.prepareAchievementReviewOnSubmitInTransaction.mockRejectedValue(
      new DepartmentReviewerNotFoundError(ids.department),
    );

    await expect(service.submitDraft(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementUnsupportedOperationError,
    );
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).not.toHaveBeenCalled();
  });

  it("maps archived achievement department to an unsupported submit operation", async () => {
    const { service, repository, workflowService } = createService();
    workflowService.prepareAchievementReviewOnSubmitInTransaction.mockRejectedValue(
      new WorkflowDepartmentUnavailableError(ids.department),
    );

    await expect(service.submitDraft(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementUnsupportedOperationError,
    );
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).not.toHaveBeenCalled();
  });

  it("rejects submit when audit writing fails in the same transaction boundary", async () => {
    const { service, tx, repository, workflowService, auditService } = createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);

    await expect(service.submitDraft(makeContext(), ids.achievement)).rejects.toBe(
      auditError,
    );

    expect(repository.transitionStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
    expect(workflowService.createAchievementReviewOnSubmitInTransaction).toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });
});

describe("AchievementService.voidAchievement", () => {
  it("voids only an owner DRAFT achievement with update_own permission", async () => {
    const { service, prisma, tx, repository, policyQueryFactory, auditService } =
      createService();
    repository.transitionStatusInTransaction.mockResolvedValue(
      makeState({
        status: AchievementStatusCode.voided,
        version: 2,
        voidedAt: new Date("2026-01-03T00:00:00.000Z"),
      }),
    );

    await service.voidAchievement(makeContext(), ids.achievement, {
      reason: " Duplicate draft. ",
    });

    expect(policyQueryFactory.achievementOwnedWhere).toHaveBeenCalledWith(
      makeContext(),
      PermissionCode.achievementUpdateOwn,
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.transitionStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        achievementId: ids.achievement,
        expectedStatus: AchievementStatusCode.draft,
        nextStatus: AchievementStatusCode.voided,
        voidedById: ids.user,
        voidedAt: expect.any(Date),
        voidReason: "Duplicate draft.",
        updatedById: ids.user,
      }),
    );
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.user, departmentId: ids.department },
        action: AuditActionCode.void,
        target: {
          type: AuditTargetTypeCode.achievement,
          id: ids.achievement,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
        oldValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.void,
          status: AchievementStatusCode.draft,
          version: 1,
        },
        newValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.void,
          status: AchievementStatusCode.voided,
          version: 2,
          voidedAt: "2026-01-03T00:00:00.000Z",
        },
      }),
    );
  });

  it("rejects void without achievement:update_own permission", async () => {
    const { service, repository, auditService } = createService();

    await expect(
      service.voidAchievement(makeContext([PermissionCode.achievementSubmit]), ids.achievement, {
        reason: "Duplicate draft.",
      }),
    ).rejects.toBeInstanceOf(AchievementPermissionDeniedError);
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects blank void reasons", async () => {
    const { service, repository } = createService();

    await expect(
      service.voidAchievement(makeContext(), ids.achievement, { reason: "   " }),
    ).rejects.toBeInstanceOf(AchievementInvalidPayloadError);
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
  });

  it("rejects voiding a non-DRAFT achievement", async () => {
    const { service, repository } = createService();
    repository.findStateByIdWhere.mockResolvedValue(
      makeState({ status: AchievementStatusCode.pendingDepartmentReview }),
    );

    await expect(
      service.voidAchievement(makeContext(), ids.achievement, { reason: "Duplicate draft." }),
    ).rejects.toBeInstanceOf(AchievementInvalidStateError);
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
  });

  it("rejects void when audit writing fails in the same transaction boundary", async () => {
    const { service, tx, repository, auditService } = createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);

    await expect(
      service.voidAchievement(makeContext(), ids.achievement, {
        reason: "Duplicate draft.",
      }),
    ).rejects.toBe(auditError);

    expect(repository.transitionStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });
});

describe("AchievementService.archiveAchievement", () => {
  it("archives a PENDING_ARCHIVE achievement and closes workflow in one transaction", async () => {
    const { service, prisma, tx, repository, workflowService, auditService } =
      createService();
    repository.findStateByIdInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.pendingArchive, version: 3 }),
    );
    repository.transitionStatusInTransaction.mockResolvedValue(
      makeState({
        status: AchievementStatusCode.archived,
        version: 4,
        archivedAt: new Date("2026-01-04T00:00:00.000Z"),
      }),
    );

    await service.archiveAchievement(makeContext(), ids.achievement);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(repository.findStateByIdInTransaction).toHaveBeenCalledWith(
      tx,
      ids.achievement,
    );
    expect(workflowService.prepareAchievementArchiveInTransaction).toHaveBeenCalledWith(
      tx,
      {
        achievementId: ids.achievement,
      },
    );
    expect(repository.transitionStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        achievementId: ids.achievement,
        expectedStatus: AchievementStatusCode.pendingArchive,
        nextStatus: AchievementStatusCode.archived,
        archivedById: ids.user,
        archivedAt: expect.any(Date),
        updatedById: ids.user,
      }),
    );
    const archiveInput = repository.transitionStatusInTransaction.mock.calls[0]![1];
    expect(workflowService.completeAchievementArchiveInTransaction).toHaveBeenCalledWith(
      tx,
      {
        instanceId: ids.workflowInstance,
        achievementId: ids.achievement,
        archivedById: ids.user,
        actorDepartmentId: ids.department,
        targetDepartmentId: ids.department,
        targetSecretLevel: SecretLevelCode.internal,
        archivedAt: archiveInput.archivedAt,
        auditClient: tx,
      },
    );
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        actor: { userId: ids.user, departmentId: ids.department },
        action: AuditActionCode.archive,
        target: {
          type: AuditTargetTypeCode.achievement,
          id: ids.achievement,
          departmentId: ids.department,
          secretLevel: SecretLevelCode.internal,
        },
        oldValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.archive,
          status: AchievementStatusCode.pendingArchive,
          version: 3,
        },
        newValue: {
          achievementId: ids.achievement,
          action: AuditActionCode.archive,
          status: AchievementStatusCode.archived,
          version: 4,
          archivedAt: "2026-01-04T00:00:00.000Z",
        },
      }),
    );
  });

  it("rejects archive without achievement:archive permission", async () => {
    const { service, prisma, repository, workflowService, auditService } = createService();

    await expect(
      service.archiveAchievement(makeContext([PermissionCode.achievementSubmit]), ids.achievement),
    ).rejects.toBeInstanceOf(AchievementPermissionDeniedError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.completeAchievementArchiveInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("rejects archiving achievements before PENDING_ARCHIVE", async () => {
    const { service, repository, workflowService, auditService } = createService();
    repository.findStateByIdInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.draft }),
    );

    await expect(service.archiveAchievement(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementInvalidStateError,
    );
    expect(repository.transitionStatus).not.toHaveBeenCalled();
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.prepareAchievementArchiveInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("maps missing or invalid archive workflow state to achievement invalid state", async () => {
    const { service, repository, workflowService } = createService();
    repository.findStateByIdInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.pendingArchive }),
    );
    workflowService.prepareAchievementArchiveInTransaction.mockRejectedValue(
      new WorkflowInvalidStateError("Active workflow instance is required before achievement archive."),
    );

    await expect(service.archiveAchievement(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementInvalidStateError,
    );
    expect(repository.transitionStatusInTransaction).not.toHaveBeenCalled();
    expect(workflowService.completeAchievementArchiveInTransaction).not.toHaveBeenCalled();
  });

  it("rejects archive when audit writing fails in the same transaction boundary", async () => {
    const { service, tx, repository, workflowService, auditService } = createService();
    const auditError = new Error("audit failed");
    auditService.recordEventInTransaction.mockRejectedValue(auditError);
    repository.findStateByIdInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.pendingArchive }),
    );
    repository.transitionStatusInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.archived, version: 2 }),
    );

    await expect(service.archiveAchievement(makeContext(), ids.achievement)).rejects.toBe(
      auditError,
    );

    expect(repository.transitionStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
    expect(workflowService.completeAchievementArchiveInTransaction).toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
  });

  it("rejects archive when workflow archive audit writing fails in the same transaction boundary", async () => {
    const { service, tx, repository, workflowService, auditService } = createService();
    const auditError = new Error("workflow audit failed");
    repository.findStateByIdInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.pendingArchive }),
    );
    repository.transitionStatusInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.archived, version: 2 }),
    );
    workflowService.completeAchievementArchiveInTransaction.mockRejectedValue(auditError);

    await expect(service.archiveAchievement(makeContext(), ids.achievement)).rejects.toBe(
      auditError,
    );

    expect(repository.transitionStatusInTransaction).toHaveBeenCalledWith(
      tx,
      expect.any(Object),
    );
    expect(workflowService.completeAchievementArchiveInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        instanceId: ids.workflowInstance,
        achievementId: ids.achievement,
        archivedById: ids.user,
        actorDepartmentId: ids.department,
        targetDepartmentId: ids.department,
        targetSecretLevel: SecretLevelCode.internal,
        auditClient: tx,
      }),
    );
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("maps concurrent archive conflicts to invalid state", async () => {
    const { service, repository, workflowService } = createService();
    repository.findStateByIdInTransaction.mockResolvedValue(
      makeState({ status: AchievementStatusCode.pendingArchive }),
    );
    repository.transitionStatusInTransaction.mockRejectedValue(
      new AchievementStatusTransitionConflictError(
        ids.achievement,
        AchievementStatusCode.pendingArchive,
      ),
    );

    await expect(service.archiveAchievement(makeContext(), ids.achievement)).rejects.toBeInstanceOf(
      AchievementInvalidStateError,
    );
    expect(workflowService.completeAchievementArchiveInTransaction).not.toHaveBeenCalled();
  });
});
