import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";
import { UserContext } from "../../identity/user-context";
import { PermissionCode } from "../constants/permission-code";
import { RoleCode } from "../constants/role-code";
import { ScopeType } from "../constants/scope-type";
import { DepartmentScopeService } from "./department-scope.service";
import { PolicyQueryFactory } from "./policy-query.factory";
import { RbacPolicyService } from "./rbac-policy.service";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  users: {
    researcher: "40000000-0000-4000-8000-000000000001",
    secretary: "40000000-0000-4000-8000-000000000002",
    admin: "40000000-0000-4000-8000-000000000003",
    leader: "40000000-0000-4000-8000-000000000004",
    other: "40000000-0000-4000-8000-000000000005",
  },
  departments: {
    ai: "10000000-0000-4000-8000-000000000002",
    aiChild: "10000000-0000-4000-8000-000000000012",
    materials: "10000000-0000-4000-8000-000000000003",
  },
};

const makeContext = (overrides: Partial<UserContext> = {}): UserContext => ({
  userId: ids.users.researcher,
  departmentId: ids.departments.ai,
  roleIds: [],
  roleCodes: [RoleCode.researcher],
  permissionCodes: [],
  roleScopes: [],
  scopedDepartmentIds: [],
  ...overrides,
});

const makeDepartmentScopedContext = (
  overrides: Partial<UserContext> = {},
): UserContext =>
  makeContext({
    roleCodes: [RoleCode.researchSecretary],
    permissionCodes: [
      PermissionCode.achievementReadDepartment,
      PermissionCode.feeReadDepartment,
      PermissionCode.departmentReadDepartment,
    ],
    roleScopes: [
      {
        roleCode: RoleCode.researchSecretary,
        scopeType: ScopeType.department,
        scopeKey: ids.departments.ai,
        departmentId: ids.departments.ai,
      },
    ],
    scopedDepartmentIds: [ids.departments.ai],
    ...overrides,
  });

const createServices = () => {
  const rbacPolicy = new RbacPolicyService();
  const departmentScope = new DepartmentScopeService(rbacPolicy);
  const queryFactory = new PolicyQueryFactory(rbacPolicy, departmentScope);

  return {
    rbacPolicy,
    departmentScope,
    queryFactory,
  };
};

describe("RbacPolicyService", () => {
  it("allows a granted permission", () => {
    const { rbacPolicy } = createServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.achievementCreate],
    });

    expect(rbacPolicy.hasPermission(context, PermissionCode.achievementCreate)).toEqual({
      effect: "ALLOW",
      reason: "All required permissions are granted.",
    });
  });

  it("denies a missing permission", () => {
    const { rbacPolicy } = createServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.achievementCreate],
    });

    expect(rbacPolicy.hasPermission(context, PermissionCode.achievementReadDepartment)).toEqual({
      effect: "DENY",
      reason: "Required permissions are missing.",
      missingPermissions: [PermissionCode.achievementReadDepartment],
    });
  });

  it("allows any permission when one required permission is granted", () => {
    const { rbacPolicy } = createServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.feeManageDepartment],
    });

    expect(
      rbacPolicy.hasAnyPermission(context, [
        PermissionCode.feeReadDepartment,
        PermissionCode.feeManageDepartment,
      ]),
    ).toEqual({
      effect: "ALLOW",
      reason: `Permission granted: ${PermissionCode.feeManageDepartment}.`,
    });
  });

  it("denies all permissions when one required permission is missing", () => {
    const { rbacPolicy } = createServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.achievementReadOwn],
    });

    expect(
      rbacPolicy.hasAllPermissions(context, [
        PermissionCode.achievementReadOwn,
        PermissionCode.achievementUpdateOwn,
      ]),
    ).toEqual({
      effect: "DENY",
      reason: "Required permissions are missing.",
      missingPermissions: [PermissionCode.achievementUpdateOwn],
    });
  });

  it("denies empty permission requirements", () => {
    const { rbacPolicy } = createServices();

    expect(rbacPolicy.hasAnyPermission(makeContext(), [])).toEqual({
      effect: "DENY",
      reason: "No permission requirement was provided.",
      missingPermissions: [],
    });
  });

  it("denies when user context is missing", () => {
    const { rbacPolicy } = createServices();

    expect(rbacPolicy.hasPermission(null, PermissionCode.userContextRead)).toEqual({
      effect: "DENY",
      reason: "User context is required.",
      missingPermissions: [PermissionCode.userContextRead],
    });
  });

  it("does not grant system admin a permission bypass", () => {
    const { rbacPolicy } = createServices();
    const context = makeContext({
      roleCodes: [RoleCode.systemAdmin],
      permissionCodes: [PermissionCode.systemConfig, PermissionCode.achievementArchive],
    });

    expect(rbacPolicy.hasPermission(context, PermissionCode.achievementReadDepartment).effect).toBe(
      "DENY",
    );
  });
});

describe("DepartmentScopeService", () => {
  it("declares explicit RbacPolicyService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(DepartmentScopeService)).toEqual([RbacPolicyService]);
  });

  it("allows the current user to access an owned resource", () => {
    const { departmentScope } = createServices();

    expect(departmentScope.canAccessOwnResource(makeContext(), ids.users.researcher).effect).toBe(
      "ALLOW",
    );
  });

  it("denies another user's owned resource", () => {
    const { departmentScope } = createServices();

    expect(departmentScope.canAccessOwnResource(makeContext(), ids.users.other).effect).toBe(
      "DENY",
    );
  });

  it("allows a department resource only inside the exact scoped department", () => {
    const { departmentScope } = createServices();
    const context = makeDepartmentScopedContext();

    expect(
      departmentScope.canAccessDepartmentResource(
        context,
        ids.departments.ai,
        PermissionCode.achievementReadDepartment,
      ).effect,
    ).toBe("ALLOW");
  });

  it("does not inherit child departments from a scoped department", () => {
    const { departmentScope } = createServices();
    const context = makeDepartmentScopedContext();

    expect(
      departmentScope.canAccessDepartmentResource(
        context,
        ids.departments.aiChild,
        PermissionCode.achievementReadDepartment,
      ).effect,
    ).toBe("DENY");
  });

  it("denies a scoped department when the required permission is missing", () => {
    const { departmentScope } = createServices();
    const context = makeDepartmentScopedContext({
      permissionCodes: [PermissionCode.userContextRead],
    });

    expect(
      departmentScope.canAccessDepartmentResource(
        context,
        ids.departments.ai,
        PermissionCode.achievementReadDepartment,
      ),
    ).toEqual({
      effect: "DENY",
      reason: "Required permissions are missing.",
      missingPermissions: [PermissionCode.achievementReadDepartment],
    });
  });

  it("does not give leaders department detail scope from dashboard permission", () => {
    const { departmentScope } = createServices();
    const context = makeContext({
      roleCodes: [RoleCode.leader],
      permissionCodes: [PermissionCode.dashboardReadInstitute],
      roleScopes: [
        {
          roleCode: RoleCode.leader,
          scopeType: ScopeType.global,
          scopeKey: "GLOBAL",
          departmentId: null,
        },
      ],
      scopedDepartmentIds: [],
    });

    expect(
      departmentScope.canAccessDepartmentResource(
        context,
        ids.departments.ai,
        PermissionCode.departmentReadDepartment,
      ).effect,
    ).toBe("DENY");
  });

  it("does not give system admins department detail scope from archive permission", () => {
    const { departmentScope } = createServices();
    const context = makeContext({
      roleCodes: [RoleCode.systemAdmin],
      permissionCodes: [PermissionCode.achievementArchive, PermissionCode.systemConfig],
      scopedDepartmentIds: [],
    });

    expect(
      departmentScope.canAccessDepartmentResource(
        context,
        ids.departments.ai,
        PermissionCode.achievementReadDepartment,
      ).effect,
    ).toBe("DENY");
  });
});

describe("PolicyQueryFactory dependency injection", () => {
  it("declares explicit constructor injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(PolicyQueryFactory)).toEqual([
      RbacPolicyService,
      DepartmentScopeService,
    ]);
  });
});

describe("PolicyQueryFactory", () => {
  it("builds an achievement owner-only read filter for researchers", () => {
    const { queryFactory } = createServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.achievementReadOwn],
    });

    expect(queryFactory.achievementReadableWhere(context)).toEqual({
      OR: [{ ownerUserId: ids.users.researcher }],
    });
  });

  it("builds a department achievement read filter for scoped department users", () => {
    const { queryFactory } = createServices();

    expect(queryFactory.achievementReadableWhere(makeDepartmentScopedContext())).toEqual({
      OR: [{ departmentId: { in: [ids.departments.ai] } }],
    });
  });

  it("combines own and department achievement read filters without broadening scope", () => {
    const { queryFactory } = createServices();
    const context = makeDepartmentScopedContext({
      userId: ids.users.secretary,
      permissionCodes: [
        PermissionCode.achievementReadOwn,
        PermissionCode.achievementReadDepartment,
      ],
    });

    expect(queryFactory.achievementReadableWhere(context)).toEqual({
      OR: [
        { ownerUserId: ids.users.secretary },
        { departmentId: { in: [ids.departments.ai] } },
      ],
    });
  });

  it("returns an empty id filter when achievement read access is denied", () => {
    const { queryFactory } = createServices();
    const context = makeContext({
      roleCodes: [RoleCode.systemAdmin],
      permissionCodes: [PermissionCode.achievementArchive],
    });

    expect(queryFactory.achievementReadableWhere(context)).toEqual({
      id: { in: [] },
    });
  });

  it("builds an own achievement update filter only when update-own is granted", () => {
    const { queryFactory } = createServices();

    expect(
      queryFactory.achievementOwnedWhere(
        makeContext({ permissionCodes: [PermissionCode.achievementUpdateOwn] }),
        PermissionCode.achievementUpdateOwn,
      ),
    ).toEqual({ ownerUserId: ids.users.researcher });

    expect(
      queryFactory.achievementOwnedWhere(makeContext(), PermissionCode.achievementUpdateOwn),
    ).toEqual({ id: { in: [] } });
  });

  it("builds a fee read filter from read or manage department permission", () => {
    const { queryFactory } = createServices();

    expect(queryFactory.feeReadableWhere(makeDepartmentScopedContext())).toEqual({
      departmentId: { in: [ids.departments.ai] },
    });

    expect(
      queryFactory.feeReadableWhere(
        makeDepartmentScopedContext({
          permissionCodes: [PermissionCode.feeManageDepartment],
        }),
      ),
    ).toEqual({
      departmentId: { in: [ids.departments.ai] },
    });
  });

  it("builds a department read filter only for scoped department readers", () => {
    const { queryFactory } = createServices();

    expect(queryFactory.departmentReadableWhere(makeDepartmentScopedContext())).toEqual({
      id: { in: [ids.departments.ai] },
    });

    expect(
      queryFactory.departmentReadableWhere(
        makeDepartmentScopedContext({
          permissionCodes: [PermissionCode.dashboardReadInstitute],
        }),
      ),
    ).toEqual({
      id: { in: [] },
    });
  });
});
