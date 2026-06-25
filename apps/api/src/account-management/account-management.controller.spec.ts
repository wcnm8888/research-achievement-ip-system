import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IDENTITY_ADAPTER } from "../identity/identity-adapter.token";
import { UserContext } from "../identity/user-context";
import { AccountManagementService } from "./account-management.service";
import { AccountManagementModule } from "./account-management.module";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  createdUser: "40000000-0000-4000-8000-000000000002",
  userRole: "60000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  department2: "10000000-0000-4000-8000-000000000002",
};

const researcherPermissionProfile = [
  PermissionCode.achievementCreate,
  PermissionCode.achievementReadOwn,
  PermissionCode.achievementUpdateOwn,
  PermissionCode.achievementSubmit,
] as const;

type AccountManagementServiceMock = {
  listUsers: ReturnType<typeof vi.fn>;
  getUser: ReturnType<typeof vi.fn>;
  createUser: ReturnType<typeof vi.fn>;
  disableUser: ReturnType<typeof vi.fn>;
  enableUser: ReturnType<typeof vi.fn>;
  assignUserRole: ReturnType<typeof vi.fn>;
  revokeUserRole: ReturnType<typeof vi.fn>;
  changeUserDepartment: ReturnType<typeof vi.fn>;
};

type TestCallback = (
  app: INestApplication,
  service: AccountManagementServiceMock,
  identityAdapter: { loadUserContext: ReturnType<typeof vi.fn> },
) => Promise<void>;

const makeUserContext = (
  permissions: readonly PermissionCode[],
): UserContext => {
  const isSystemAdmin = permissions.includes(PermissionCode.systemConfig);
  const roleCode = isSystemAdmin ? RoleCode.systemAdmin : RoleCode.researcher;
  const scopeType = isSystemAdmin ? ScopeType.global : ScopeType.department;
  const scopeKey = isSystemAdmin ? "GLOBAL" : ids.department;
  const departmentId = isSystemAdmin ? null : ids.department;

  return {
    userId: ids.user,
    departmentId: ids.department,
    roleIds: [ids.role],
    roleCodes: [roleCode],
    permissionCodes: permissions,
    roleScopes: [
      {
        roleCode,
        scopeType,
        scopeKey,
        departmentId,
      },
    ],
    scopedDepartmentIds: [ids.department],
  };
};

const makeAccountUser = () => ({
  id: ids.createdUser,
  email: "researcher@example.com",
  name: "Researcher",
  status: "ACTIVE",
  department: {
    id: ids.department,
    code: "INSTITUTE_ROOT",
    name: "Institute",
    status: "ACTIVE",
  },
  roles: [
    {
      id: ids.userRole,
      role: {
        id: ids.role,
        code: RoleCode.researcher,
        name: "Researcher",
        status: "ACTIVE",
      },
      scopeType: ScopeType.department,
      scopeKey: ids.department,
      departmentId: ids.department,
      createdAt: new Date("2026-06-24T00:00:00.000Z"),
    },
  ],
  credential: {
    status: "ACTIVE",
    passwordUpdatedAt: new Date("2026-06-24T00:00:00.000Z"),
    disabledAt: null,
    createdAt: new Date("2026-06-24T00:00:00.000Z"),
    updatedAt: new Date("2026-06-24T00:00:00.000Z"),
  },
  lastLogin: null,
  createdAt: new Date("2026-06-24T00:00:00.000Z"),
  updatedAt: new Date("2026-06-24T00:00:00.000Z"),
});

const makeCreatePayload = () => ({
  email: "Researcher@Example.COM",
  name: " Researcher ",
  departmentId: ids.department,
  roles: [
    {
      roleCode: RoleCode.researcher,
      scopeType: ScopeType.department,
      departmentId: ids.department,
    },
  ],
  initialPassword: "safe-password-123",
});

const createServiceMock = (): AccountManagementServiceMock => ({
  listUsers: vi.fn().mockResolvedValue({
    items: [makeAccountUser()],
    total: 1,
    page: 1,
    pageSize: 20,
  }),
  getUser: vi.fn().mockResolvedValue(makeAccountUser()),
  createUser: vi.fn().mockResolvedValue(makeAccountUser()),
  disableUser: vi.fn().mockResolvedValue({
    user: makeAccountUser(),
    revokedSessionCount: 2,
  }),
  enableUser: vi.fn().mockResolvedValue(makeAccountUser()),
  assignUserRole: vi.fn().mockResolvedValue({
    user: makeAccountUser(),
    userRoleId: ids.userRole,
  }),
  revokeUserRole: vi.fn().mockResolvedValue(makeAccountUser()),
  changeUserDepartment: vi.fn().mockResolvedValue(makeAccountUser()),
});

describe("AccountManagementController HTTP", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no user context is loaded", async () => {
    await withTestApp(null, async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/account-management/users")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(service.listUsers).not.toHaveBeenCalled();

      await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/disable`)
        .send({ reason: "offboarding" })
        .expect(401);

      expect(service.disableUser).not.toHaveBeenCalled();
    });
  });

  it("returns 403 when system config permission is missing", async () => {
    await withTestApp([], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/account-management/users")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(service.listUsers).not.toHaveBeenCalled();

      await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/disable`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "offboarding" })
        .expect(403);

      expect(service.disableUser).not.toHaveBeenCalled();
    });
  });

  it("rejects researcher account management access without system config", async () => {
    await withTestApp(researcherPermissionProfile, async (app, service, identityAdapter) => {
      await request(app.getHttpServer() as Server)
        .get("/account-management/users")
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      await request(app.getHttpServer() as Server)
        .get(`/account-management/users/${ids.createdUser}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(403);

      expect(identityAdapter.loadUserContext).toHaveBeenCalled();
      expect(service.listUsers).not.toHaveBeenCalled();
      expect(service.getUser).not.toHaveBeenCalled();
    });
  });

  it("lets admin list users with validated query", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/account-management/users")
        .set("X-Demo-User-Id", ids.user)
        .query({
          keyword: "researcher",
          status: "ACTIVE",
          departmentId: ids.department,
          roleCode: RoleCode.researcher,
          page: "1",
          pageSize: "20",
        })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.items[0].id).toBe(ids.createdUser);
      expect(service.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        expect.objectContaining({ page: 1, pageSize: 20 }),
      );
    });
  });

  it("lets admin read user detail", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/account-management/users/${ids.createdUser}`)
        .set("X-Demo-User-Id", ids.user)
        .expect(200);

      expect(response.body.id).toBe(ids.createdUser);
      expect(service.getUser).toHaveBeenCalledWith(expect.any(Object), ids.createdUser);
    });
  });

  it("lets admin create a user and never returns credential secrets", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post("/account-management/users")
        .set("X-Demo-User-Id", ids.user)
        .send(makeCreatePayload())
        .expect(201);

      expect(response.body.id).toBe(ids.createdUser);
      expect(service.createUser).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          email: "Researcher@Example.COM",
          departmentId: ids.department,
        }),
      );
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("safe-password-123");
      expect(serialized).not.toContain("passwordHash");
      expect(serialized).not.toContain("token");
      expect(serialized).not.toContain("secret");
    });
  });

  it("lets admin disable and enable a user", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const disableResponse = await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/disable`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "offboarding" })
        .expect(201);

      expect(disableResponse.body.revokedSessionCount).toBe(2);
      expect(service.disableUser).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        ids.createdUser,
        { reason: "offboarding" },
      );

      await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/enable`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "returned" })
        .expect(201);

      expect(service.enableUser).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        ids.createdUser,
        { reason: "returned" },
      );
    });
  });

  it("lets admin assign and revoke roles", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/roles`)
        .set("X-Demo-User-Id", ids.user)
        .send({
          roleCode: RoleCode.researcher,
          scopeType: ScopeType.department,
          departmentId: ids.department,
          reason: "department onboarding",
        })
        .expect(201);

      expect(service.assignUserRole).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        ids.createdUser,
        expect.objectContaining({
          roleCode: RoleCode.researcher,
          scopeType: ScopeType.department,
          departmentId: ids.department,
        }),
      );

      await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/roles/${ids.userRole}/revoke`)
        .set("X-Demo-User-Id", ids.user)
        .send({ reason: "role changed" })
        .expect(201);

      expect(service.revokeUserRole).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        ids.createdUser,
        ids.userRole,
        { reason: "role changed" },
      );
    });
  });

  it("lets admin change user primary department without returning secrets", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/department`)
        .set("X-Demo-User-Id", ids.user)
        .send({ departmentId: ids.department2, reason: "transfer" })
        .expect(201);

      expect(service.changeUserDepartment).toHaveBeenCalledWith(
        expect.objectContaining({ userId: ids.user }),
        ids.createdUser,
        { departmentId: ids.department2, reason: "transfer" },
      );
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("passwordHash");
      expect(serialized).not.toContain("token");
      expect(serialized).not.toContain("sessionHash");
      expect(serialized).not.toContain("secret");
    });
  });

  it("rejects invalid params, query, and body payloads", async () => {
    await withTestApp([PermissionCode.systemConfig], async (app, service) => {
      await request(app.getHttpServer() as Server)
        .get("/account-management/users/not-a-uuid")
        .set("X-Demo-User-Id", ids.user)
        .expect(400);

      await request(app.getHttpServer() as Server)
        .get("/account-management/users")
        .set("X-Demo-User-Id", ids.user)
        .query({ roleCode: "UNKNOWN_ROLE", page: "0" })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post("/account-management/users")
        .set("X-Demo-User-Id", ids.user)
        .send({
          ...makeCreatePayload(),
          departmentId: "not-a-uuid",
          unexpectedField: true,
        })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/roles`)
        .set("X-Demo-User-Id", ids.user)
        .send({ roleCode: "UNKNOWN_ROLE", scopeType: ScopeType.global })
        .expect(400);

      await request(app.getHttpServer() as Server)
        .post(`/account-management/users/${ids.createdUser}/department`)
        .set("X-Demo-User-Id", ids.user)
        .send({ departmentId: "not-a-uuid" })
        .expect(400);

      expect(service.getUser).not.toHaveBeenCalled();
      expect(service.listUsers).not.toHaveBeenCalled();
      expect(service.createUser).not.toHaveBeenCalled();
      expect(service.assignUserRole).not.toHaveBeenCalled();
      expect(service.changeUserDepartment).not.toHaveBeenCalled();
    });
  });

  it("does not let X-Demo-User-Id bypass missing production user context", async () => {
    await withTestApp(null, async (app, service) => {
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      try {
        await request(app.getHttpServer() as Server)
          .get("/account-management/users")
          .set("X-Demo-User-Id", ids.user)
          .expect(401);

        expect(service.listUsers).not.toHaveBeenCalled();
      } finally {
        if (previousNodeEnv === undefined) {
          delete process.env.NODE_ENV;
        } else {
          process.env.NODE_ENV = previousNodeEnv;
        }
      }
    });
  });
});

const withTestApp = async (
  permissions: readonly PermissionCode[] | null,
  callback: TestCallback,
): Promise<void> => {
  let app: INestApplication | null = null;
  const previousNodeEnv = process.env.NODE_ENV;
  const service = createServiceMock();
  const identityAdapter = {
    loadUserContext: vi.fn().mockResolvedValue(
      permissions === null ? null : makeUserContext(permissions),
    ),
  };

  process.env.NODE_ENV = "test";

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [AccountManagementModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IDENTITY_ADAPTER)
      .useValue(identityAdapter)
      .overrideProvider(AccountManagementService)
      .useValue(service)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, service, identityAdapter);
  } finally {
    if (app) {
      await app.close();
    }

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
};
