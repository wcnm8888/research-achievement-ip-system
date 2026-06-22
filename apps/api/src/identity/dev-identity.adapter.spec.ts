import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { DevIdentityAdapter, buildUserContext, isProductionEnvironment, readHeader } from "./dev-identity.adapter";

describe("DevIdentityAdapter", () => {
  it("reads the demo user id header case-insensitively", () => {
    expect(readHeader({ "X-Demo-User-Id": "user-1" }, "x-demo-user-id")).toBe("user-1");
  });

  it("does not allow the demo header in production", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn(),
      },
    };
    const adapter = new DevIdentityAdapter(prisma as never);

    await expect(
      adapter.loadUserContext({
        headers: { "x-demo-user-id": "user-1" },
        environment: "production",
      }),
    ).resolves.toBeNull();
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("builds user context from active roles and active permissions", () => {
    const context = buildUserContext({
      id: "user-1",
      departmentId: "department-1",
      userRoles: [
        {
          departmentId: "department-1",
          scopeKey: "department-1",
          scopeType: "DEPARTMENT",
          role: {
            id: "role-1",
            code: "DEPARTMENT_ADMIN",
            rolePermissions: [
              {
                permission: {
                  code: PermissionCode.userContextRead,
                  status: "ACTIVE",
                },
              },
              {
                permission: {
                  code: "audit:read",
                  status: "ARCHIVED",
                },
              },
            ],
          },
        },
      ],
    });

    expect(context).toEqual({
      userId: "user-1",
      departmentId: "department-1",
      roleIds: ["role-1"],
      roleCodes: ["DEPARTMENT_ADMIN"],
      permissionCodes: [PermissionCode.userContextRead],
      roleScopes: [
        {
          roleCode: "DEPARTMENT_ADMIN",
          scopeType: "DEPARTMENT",
          scopeKey: "department-1",
          departmentId: "department-1",
        },
      ],
      scopedDepartmentIds: ["department-1"],
    });
  });

  it("identifies only production as production environment", () => {
    expect(isProductionEnvironment("production")).toBe(true);
    expect(isProductionEnvironment("development")).toBe(false);
    expect(isProductionEnvironment("test")).toBe(false);
  });
});
