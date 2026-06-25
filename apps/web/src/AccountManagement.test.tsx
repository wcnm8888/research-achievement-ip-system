import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, AuthUser } from "./api-client";
import {
  buildAssignRolePayload,
  buildChangeDepartmentPayload,
  buildCreateAccountUserPayload,
  buildAccountUserListQuery,
  buildReasonPayload,
  createAccountUserFromForm,
  executeAccountOperation,
  fetchAccountUserDetail,
  fetchAccountUsers,
  hasSystemConfigPermission,
} from "./AccountManagement";
import type {
  AccountUserDetail,
  AccountUserListResponse,
  AssignAccountUserRoleResponse,
  DisableAccountUserResponse,
} from "./types";

const adminUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["system:config", "audit:read"],
};

const accountUser: AccountUserDetail = {
  id: "40000000-0000-4000-8000-000000000011",
  email: "researcher@example.com",
  name: "Researcher",
  status: "ACTIVE",
  department: {
    id: "10000000-0000-4000-8000-000000000001",
    code: "D001",
    name: "Research Department",
    status: "ACTIVE",
  },
  roles: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      role: {
        id: "30000000-0000-4000-8000-000000000001",
        code: "RESEARCHER",
        name: "Researcher",
        status: "ACTIVE",
      },
      scopeType: "DEPARTMENT",
      scopeKey: "10000000-0000-4000-8000-000000000001",
      departmentId: "10000000-0000-4000-8000-000000000001",
      createdAt: "2026-06-01T00:00:00.000Z",
    },
  ],
  credential: {
    status: "ACTIVE",
    passwordUpdatedAt: "2026-06-01T00:00:00.000Z",
    disabledAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  lastLogin: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

describe("account management permission helpers", () => {
  it("allows only users with system:config to enter account management", () => {
    expect(hasSystemConfigPermission(adminUser)).toBe(true);
    expect(hasSystemConfigPermission({ permissionCodes: ["audit:read"] })).toBe(false);
    expect(hasSystemConfigPermission(null)).toBe(false);
  });
});

describe("buildAccountUserListQuery", () => {
  it("trims optional filters and preserves pagination", () => {
    expect(
      buildAccountUserListQuery(
        {
          keyword: "  researcher@example.com  ",
          status: "ACTIVE",
          departmentId: "  10000000-0000-4000-8000-000000000001  ",
          roleCode: "RESEARCHER",
        },
        2,
        50,
      ),
    ).toEqual({
      keyword: "researcher@example.com",
      status: "ACTIVE",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roleCode: "RESEARCHER",
      page: 2,
      pageSize: 50,
    });
  });

  it("omits blank optional filters", () => {
    expect(
      buildAccountUserListQuery(
        {
          keyword: "  ",
          departmentId: " ",
        },
        1,
        20,
      ),
    ).toEqual({
      page: 1,
      pageSize: 20,
    });
  });
});

describe("account management API helpers", () => {
  it("loads account users through the account management client", async () => {
    const response: AccountUserListResponse = {
      items: [accountUser],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    const client = {
      listAccountUsers: vi.fn(async () => response),
    } as unknown as Pick<AccountManagementApiClient, "listAccountUsers">;
    const query = buildAccountUserListQuery({ roleCode: "RESEARCHER" }, 1, 20);

    await expect(fetchAccountUsers(client, query)).resolves.toEqual(response);
    expect(client.listAccountUsers).toHaveBeenCalledWith(query);
  });

  it("loads a single account user detail without requesting sensitive fields", async () => {
    const client = {
      getAccountUser: vi.fn(async () => accountUser),
    } as unknown as Pick<AccountManagementApiClient, "getAccountUser">;

    await expect(fetchAccountUserDetail(client, accountUser.id)).resolves.toEqual(accountUser);
    expect(client.getAccountUser).toHaveBeenCalledWith(accountUser.id);
  });
});

describe("account management operation payloads", () => {
  it("builds a create user payload without echoing blank initialPassword", () => {
    expect(
      buildCreateAccountUserPayload({
        email: "  new-user@example.com  ",
        name: "  New User  ",
        departmentId: "  10000000-0000-4000-8000-000000000001  ",
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: " 10000000-0000-4000-8000-000000000001 ",
          },
          {
            roleCode: "AUDITOR",
            scopeType: "GLOBAL",
            departmentId: " should-be-ignored ",
          },
        ],
        initialPassword: "  ",
      }),
    ).toEqual({
      email: "new-user@example.com",
      name: "New User",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roles: [
        {
          roleCode: "RESEARCHER",
          scopeType: "DEPARTMENT",
          departmentId: "10000000-0000-4000-8000-000000000001",
        },
        {
          roleCode: "AUDITOR",
          scopeType: "GLOBAL",
        },
      ],
    });
  });

  it("keeps initialPassword only in the submitted create payload when provided", () => {
    expect(
      buildCreateAccountUserPayload({
        email: "new-user@example.com",
        name: "New User",
        departmentId: "10000000-0000-4000-8000-000000000001",
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: "10000000-0000-4000-8000-000000000001",
          },
        ],
        initialPassword: "  very-safe-password  ",
      }).initialPassword,
    ).toBe("very-safe-password");
  });

  it("requires departmentId for department-scoped roles", () => {
    expect(() =>
      buildAssignRolePayload({
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        departmentId: " ",
      }),
    ).toThrow("Department scope requires department id.");

    expect(
      buildAssignRolePayload({
        roleCode: "AUDITOR",
        scopeType: "GLOBAL",
        departmentId: "ignored",
        reason: "  temporary coverage  ",
      }),
    ).toEqual({
      roleCode: "AUDITOR",
      scopeType: "GLOBAL",
      reason: "temporary coverage",
    });
  });

  it("trims optional reason and department change payloads", () => {
    expect(buildReasonPayload({ reason: "  policy update  " })).toEqual({
      reason: "policy update",
    });
    expect(buildReasonPayload({ reason: "   " })).toEqual({});
    expect(
      buildChangeDepartmentPayload({
        departmentId: " 10000000-0000-4000-8000-000000000002 ",
        reason: " department correction ",
      }),
    ).toEqual({
      departmentId: "10000000-0000-4000-8000-000000000002",
      reason: "department correction",
    });
  });
});

describe("account management operation API helpers", () => {
  const disabledResponse: DisableAccountUserResponse = {
    user: {
      ...accountUser,
      status: "DISABLED",
    },
    revokedSessionCount: 2,
  };
  const assignedResponse: AssignAccountUserRoleResponse = {
    user: accountUser,
    userRoleId: "50000000-0000-4000-8000-000000000002",
  };

  it("creates users through createAccountUser", async () => {
    const client = {
      createAccountUser: vi.fn(async () => accountUser),
    } as unknown as Pick<AccountManagementApiClient, "createAccountUser">;

    await expect(
      createAccountUserFromForm(client, {
        email: "new-user@example.com",
        name: "New User",
        departmentId: "10000000-0000-4000-8000-000000000001",
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: "10000000-0000-4000-8000-000000000001",
          },
        ],
        initialPassword: "very-safe-password",
      }),
    ).resolves.toEqual(accountUser);
    expect(client.createAccountUser).toHaveBeenCalledWith({
      email: "new-user@example.com",
      name: "New User",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roles: [
        {
          roleCode: "RESEARCHER",
          scopeType: "DEPARTMENT",
          departmentId: "10000000-0000-4000-8000-000000000001",
        },
      ],
      initialPassword: "very-safe-password",
    });
  });

  it("executes disable, enable, role, revoke, and department operations through API client methods", async () => {
    const accountUserRole = accountUser.roles[0];

    if (!accountUserRole) {
      throw new Error("Account user fixture must include at least one role.");
    }

    const client = {
      disableAccountUser: vi.fn(async () => disabledResponse),
      enableAccountUser: vi.fn(async () => accountUser),
      assignAccountUserRole: vi.fn(async () => assignedResponse),
      revokeAccountUserRole: vi.fn(async () => accountUser),
      changeAccountUserDepartment: vi.fn(async () => accountUser),
    } as unknown as Pick<
      AccountManagementApiClient,
      | "disableAccountUser"
      | "enableAccountUser"
      | "assignAccountUserRole"
      | "revokeAccountUserRole"
      | "changeAccountUserDepartment"
    >;

    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "disable", user: accountUser },
      reasonValues: { reason: " offboarding " },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "enable", user: { ...accountUser, status: "DISABLED" } },
      reasonValues: { reason: " restored " },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "assign-role", user: accountUser },
      assignRoleValues: {
        roleCode: "AUDITOR",
        scopeType: "GLOBAL",
      },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: {
        kind: "revoke-role",
        user: accountUser,
        userRole: accountUserRole,
      },
      reasonValues: { reason: "scope change" },
    });
    await executeAccountOperation({
      apiClient: client,
      operation: { kind: "change-department", user: accountUser },
      departmentValues: {
        departmentId: "10000000-0000-4000-8000-000000000002",
        reason: "transfer",
      },
    });

    expect(client.disableAccountUser).toHaveBeenCalledWith(accountUser.id, {
      reason: "offboarding",
    });
    expect(client.enableAccountUser).toHaveBeenCalledWith(accountUser.id, {
      reason: "restored",
    });
    expect(client.assignAccountUserRole).toHaveBeenCalledWith(accountUser.id, {
      roleCode: "AUDITOR",
      scopeType: "GLOBAL",
    });
    expect(client.revokeAccountUserRole).toHaveBeenCalledWith(
      accountUser.id,
      accountUserRole.id,
      { reason: "scope change" },
    );
    expect(client.changeAccountUserDepartment).toHaveBeenCalledWith(accountUser.id, {
      departmentId: "10000000-0000-4000-8000-000000000002",
      reason: "transfer",
    });
  });
});
