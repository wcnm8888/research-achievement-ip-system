import { describe, expect, it, vi } from "vitest";
import type { ApiError, AuthClient, AuthUser } from "./api-client";
import {
  getBusinessContextId,
  getDemoAuthUser,
  getDemoPermissionCodes,
  getVisibleNavItems,
  loginAndRefreshCurrentUser,
  logoutAndClearCurrentUser,
  mapAuthCheckErrorToStatus,
  mapLoginErrorMessage,
  navItems,
  shouldShowDemoIdentityControls,
} from "./App";

const authUser: AuthUser = {
  id: "40000000-0000-4000-8000-000000000003",
  email: "admin@example.com",
  name: "Admin",
  departmentId: "10000000-0000-4000-8000-000000000001",
  roleCodes: ["SYSTEM_ADMIN"],
  permissionCodes: ["user_context:read"],
  scopedDepartmentIds: ["10000000-0000-4000-8000-000000000001"],
};

describe("production auth mode helpers", () => {
  it("hides demo identity controls in production mode", () => {
    expect(shouldShowDemoIdentityControls(true)).toBe(false);
    expect(shouldShowDemoIdentityControls(false)).toBe(true);
  });

  it("uses session auth user id as the business context marker in production", () => {
    expect(
      getBusinessContextId({
        productionAuthMode: true,
        demoUserId: "demo-user-id",
        authUser,
      }),
    ).toBe(authUser.id);
    expect(
      getBusinessContextId({
        productionAuthMode: true,
        demoUserId: "demo-user-id",
        authUser: null,
      }),
    ).toBeNull();
    expect(
      getBusinessContextId({
        productionAuthMode: false,
        demoUserId: "demo-user-id",
        authUser,
      }),
    ).toBe("demo-user-id");
  });

  it("maps 401 auth checks to the anonymous state", () => {
    const unauthorized: ApiError = {
      kind: "unauthorized",
      status: 401,
      message: "Please sign in.",
    };
    const forbidden: ApiError = {
      kind: "forbidden",
      status: 403,
      message: "Forbidden.",
    };

    expect(mapAuthCheckErrorToStatus(unauthorized)).toBe("anonymous");
    expect(mapAuthCheckErrorToStatus(forbidden)).toBe("error");
    expect(mapAuthCheckErrorToStatus(new Error("network"))).toBe("error");
  });

  it("maps production login 401 to an account-password error", () => {
    const unauthorized: ApiError = {
      kind: "unauthorized",
      status: 401,
      message: "请选择或切换演示用户",
    };
    const forbidden: ApiError = {
      kind: "forbidden",
      status: 403,
      message: "当前角色无权限",
    };

    expect(mapLoginErrorMessage(unauthorized)).toBe("邮箱或密码错误。");
    expect(mapLoginErrorMessage(forbidden)).toBe("当前角色无权限");
    expect(mapLoginErrorMessage(new Error("network"))).toBe("Login failed.");
  });

  it("shows account management navigation only to system config users", () => {
    const accountNavigationKey = "account-management";

    expect(
      getVisibleNavItems(navItems, {
        ...authUser,
        permissionCodes: ["system:config"],
      }).some((item) => item.key === accountNavigationKey),
    ).toBe(true);
    expect(
      getVisibleNavItems(navItems, {
        ...authUser,
        permissionCodes: ["audit:read"],
      }).some((item) => item.key === accountNavigationKey),
    ).toBe(false);
    expect(getVisibleNavItems(navItems, null).some((item) => item.key === accountNavigationKey)).toBe(
      false,
    );
  });

  it("shows custom reports navigation to ordinary demo users", () => {
    const customReportsNavigationKey = "custom-reports";

    expect(
      getVisibleNavItems(navItems, {
        ...authUser,
        permissionCodes: ["user_context:read"],
      }).some((item) => item.key === customReportsNavigationKey),
    ).toBe(true);
    expect(navItems.find((item) => item.key === customReportsNavigationKey)).toMatchObject({
      label: "Custom Reports",
      step: "Step 104-B",
    });
  });

  it("shows department maintenance navigation only to system config users", () => {
    const departmentNavigationKey = "department-management";

    expect(
      getVisibleNavItems(navItems, {
        ...authUser,
        permissionCodes: ["system:config"],
      }).some((item) => item.key === departmentNavigationKey),
    ).toBe(true);
    expect(
      getVisibleNavItems(navItems, {
        ...authUser,
        permissionCodes: ["audit:read"],
      }).some((item) => item.key === departmentNavigationKey),
    ).toBe(false);
    expect(
      getVisibleNavItems(navItems, null).some((item) => item.key === departmentNavigationKey),
    ).toBe(false);
  });

  it("derives a frontend-only permission context from demo user presets", () => {
    expect(getDemoAuthUser("40000000-0000-4000-8000-000000000003")).toMatchObject({
      id: "40000000-0000-4000-8000-000000000003",
      roleCodes: ["SYSTEM_ADMIN"],
      permissionCodes: expect.arrayContaining([
        "achievement:archive",
        "fee:review_department",
        "system:config",
        "account:invite",
        "account:reset_password",
      ]),
    });
    expect(getDemoAuthUser("40000000-0000-4000-8000-000000000001")).toMatchObject({
      roleCodes: ["RESEARCHER"],
      permissionCodes: expect.arrayContaining([
        "achievement:create",
        "achievement:submit",
        "achievement:update_own",
      ]),
    });
    expect(getDemoAuthUser(null)).toBeNull();
  });

  it("keeps phase-one demo role projections aligned with visible walkthrough actions", () => {
    expect(getDemoPermissionCodes("RESEARCH_SECRETARY")).toEqual(
      expect.arrayContaining([
        "achievement:read_department",
        "achievement:review_department",
        "fee:manage_department",
        "fee:read_department",
      ]),
    );
    expect(getDemoPermissionCodes("SYSTEM_ADMIN")).toEqual(
      expect.arrayContaining([
        "achievement:archive",
        "fee:review_department",
        "system:config",
        "account:invite",
        "account:reset_password",
      ]),
    );
    expect(getDemoPermissionCodes("FINANCE_REVIEWER")).toEqual([]);
  });
});

describe("loginAndRefreshCurrentUser", () => {
  it("logs in and then refreshes /auth/me without exposing cookie state", async () => {
    const authClient: AuthClient = {
      login: vi.fn(async () => ({ user: authUser })),
      me: vi.fn(async () => ({ user: authUser })),
      logout: vi.fn(async () => undefined),
      requestPasswordReset: vi.fn(async () => ({ accepted: true as const })),
      confirmPasswordReset: vi.fn(async () => ({ reset: true as const })),
      acceptInvite: vi.fn(async () => ({ accepted: true as const })),
    };

    await expect(
      loginAndRefreshCurrentUser(authClient, {
        email: "admin@example.com",
        password: "safe-password-123",
      }),
    ).resolves.toEqual(authUser);

    expect(authClient.login).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "safe-password-123",
    });
    expect(authClient.me).toHaveBeenCalledOnce();
    expect(authClient.logout).not.toHaveBeenCalled();
  });

  it("logs out and returns an empty user state", async () => {
    const authClient: AuthClient = {
      login: vi.fn(async () => ({ user: authUser })),
      me: vi.fn(async () => ({ user: authUser })),
      logout: vi.fn(async () => undefined),
      requestPasswordReset: vi.fn(async () => ({ accepted: true as const })),
      confirmPasswordReset: vi.fn(async () => ({ reset: true as const })),
      acceptInvite: vi.fn(async () => ({ accepted: true as const })),
    };

    await expect(logoutAndClearCurrentUser(authClient)).resolves.toBeNull();

    expect(authClient.logout).toHaveBeenCalledOnce();
    expect(authClient.login).not.toHaveBeenCalled();
    expect(authClient.me).not.toHaveBeenCalled();
  });
});
