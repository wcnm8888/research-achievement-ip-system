import {
  Controller,
  Get,
  INestApplication,
  Module,
  UseGuards,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { AppModule } from "../../app.module";
import { PrismaService } from "../../database/prisma.service";
import { IdentityModule } from "../../identity/identity.module";
import { UserContext } from "../../identity/user-context";
import { AuthorizationModule } from "../authorization.module";
import { PermissionCode } from "../constants/permission-code";
import { RoleCode } from "../constants/role-code";
import { ScopeType } from "../constants/scope-type";
import { CurrentUser } from "../decorators/current-user.decorator";
import {
  RequireAnyPermission,
  RequirePermissions,
} from "../decorators/require-permissions.decorator";
import { PermissionGuard } from "./permission.guard";
import { UserContextGuard } from "./user-context.guard";

const ids = {
  users: {
    researcher: "40000000-0000-4000-8000-000000000001",
  },
  roles: {
    researcher: "50000000-0000-4000-8000-000000000001",
  },
  departments: {
    ai: "10000000-0000-4000-8000-000000000002",
  },
};

type LoadedUserFixture = {
  id: string;
  departmentId: string;
  userRoles: Array<{
    departmentId: string | null;
    scopeKey: string;
    scopeType: ScopeType;
    role: {
      id: string;
      code: RoleCode;
      rolePermissions: Array<{
        permission: {
          code: PermissionCode;
          status: "ACTIVE";
        };
      }>;
    };
  }>;
};

type TestAppOptions = {
  user: LoadedUserFixture | null;
  nodeEnv?: string;
};

type TestCallback = (
  app: INestApplication,
  getFindFirstCallCount: () => number,
) => Promise<void>;

@Controller("step-4d-test")
class Step4DTestController {
  @Get("me")
  @UseGuards(UserContextGuard)
  getMe(@CurrentUser() currentUser: UserContext) {
    return {
      userId: currentUser.userId,
      departmentId: currentUser.departmentId,
      roleIds: currentUser.roleIds,
      permissionCodes: currentUser.permissionCodes,
    };
  }

  @Get("protected")
  @UseGuards(UserContextGuard, PermissionGuard)
  @RequirePermissions(PermissionCode.userContextRead)
  getProtected(@CurrentUser() currentUser: UserContext) {
    return {
      ok: true,
      userId: currentUser.userId,
    };
  }

  @Get("protected-any")
  @UseGuards(UserContextGuard, PermissionGuard)
  @RequireAnyPermission(
    PermissionCode.achievementReadOwn,
    PermissionCode.achievementReadDepartment,
  )
  getProtectedAny(@CurrentUser() currentUser: UserContext) {
    return {
      ok: true,
      userId: currentUser.userId,
    };
  }
}

@Module({
  imports: [AppModule, AuthorizationModule, IdentityModule],
  controllers: [Step4DTestController],
})
class Step4DTestModule {}

describe("authorization HTTP guards and decorators", () => {
  it("returns 401 when no user context can be loaded", async () => {
    await withTestApp({ user: makeLoadedUser([PermissionCode.userContextRead]) }, async (
      app,
      getFindFirstCallCount,
    ) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/step-4d-test/me")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
      expect(getFindFirstCallCount()).toBe(0);
    });
  });

  it("returns 403 when required permissions are missing", async () => {
    await withTestApp({ user: makeLoadedUser() }, async (app, getFindFirstCallCount) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/step-4d-test/protected")
        .set("X-Demo-User-Id", ids.users.researcher)
        .expect(403);

      expect(response.body.message).toBe("Required permissions are missing.");
      expect(getFindFirstCallCount()).toBe(1);
    });
  });

  it("allows a request with a loaded context and required permission", async () => {
    await withTestApp({ user: makeLoadedUser([PermissionCode.userContextRead]) }, async (
      app,
      getFindFirstCallCount,
    ) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/step-4d-test/protected")
        .set("X-Demo-User-Id", ids.users.researcher)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        userId: ids.users.researcher,
      });
      expect(getFindFirstCallCount()).toBe(1);
    });
  });

  it("allows a request when any one declared permission is granted", async () => {
    await withTestApp(
      { user: makeLoadedUser([PermissionCode.achievementReadDepartment]) },
      async (app, getFindFirstCallCount) => {
        const response = await request(app.getHttpServer() as Server)
          .get("/step-4d-test/protected-any")
          .set("X-Demo-User-Id", ids.users.researcher)
          .expect(200);

        expect(response.body).toEqual({
          ok: true,
          userId: ids.users.researcher,
        });
        expect(getFindFirstCallCount()).toBe(1);
      },
    );
  });

  it("returns 403 when none of the declared any-permissions are granted", async () => {
    await withTestApp({ user: makeLoadedUser([PermissionCode.userContextRead]) }, async (
      app,
      getFindFirstCallCount,
    ) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/step-4d-test/protected-any")
        .set("X-Demo-User-Id", ids.users.researcher)
        .expect(403);

      expect(response.body.message).toBe("None of the required permissions are granted.");
      expect(getFindFirstCallCount()).toBe(1);
    });
  });

  it("passes the loaded context through @CurrentUser", async () => {
    await withTestApp({ user: makeLoadedUser([PermissionCode.userContextRead]) }, async (app) => {
      const response = await request(app.getHttpServer() as Server)
        .get("/step-4d-test/me")
        .set("X-Demo-User-Id", ids.users.researcher)
        .expect(200);

      expect(response.body).toEqual({
        userId: ids.users.researcher,
        departmentId: ids.departments.ai,
        roleIds: [ids.roles.researcher],
        permissionCodes: [PermissionCode.userContextRead],
      });
    });
  });

  it("rejects X-Demo-User-Id in production before database lookup", async () => {
    await withTestApp(
      {
        user: makeLoadedUser([PermissionCode.userContextRead]),
        nodeEnv: "production",
      },
      async (app, getFindFirstCallCount) => {
        const response = await request(app.getHttpServer() as Server)
          .get("/step-4d-test/protected")
          .set("X-Demo-User-Id", ids.users.researcher)
          .expect(401);

        expect(response.body.message).toBe("User context is required.");
        expect(getFindFirstCallCount()).toBe(0);
      },
    );
  });
});

const withTestApp = async (
  options: TestAppOptions,
  callback: TestCallback,
): Promise<void> => {
  const previousNodeEnv = process.env.NODE_ENV;
  setNodeEnv(options.nodeEnv ?? "test");

  let findFirstCallCount = 0;
  let app: INestApplication | null = null;

  try {
    const moduleRef = await Test.createTestingModule({
      imports: [Step4DTestModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: async (): Promise<LoadedUserFixture | null> => {
            findFirstCallCount += 1;
            return options.user;
          },
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await callback(app, () => findFirstCallCount);
  } finally {
    if (app) {
      await app.close();
    }

    setNodeEnv(previousNodeEnv);
  }
};

const setNodeEnv = (value: string | undefined): void => {
  if (value === undefined) {
    delete process.env.NODE_ENV;
    return;
  }

  process.env.NODE_ENV = value;
};

const makeLoadedUser = (
  permissions: readonly PermissionCode[] = [],
): LoadedUserFixture => ({
  id: ids.users.researcher,
  departmentId: ids.departments.ai,
  userRoles: [
    {
      departmentId: null,
      scopeKey: "GLOBAL",
      scopeType: ScopeType.global,
      role: {
        id: ids.roles.researcher,
        code: RoleCode.researcher,
        rolePermissions: permissions.map((permission) => ({
          permission: {
            code: permission,
            status: "ACTIVE",
          },
        })),
      },
    },
  ],
});
