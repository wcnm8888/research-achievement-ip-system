import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { Server } from "node:http";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountLifecycleService } from "../account-lifecycle/account-lifecycle.service";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { sessionCookieName } from "../identity/session-identity.adapter";
import { AuthModule } from "./auth.module";
import { AuthService } from "./auth.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000003",
  department: "10000000-0000-4000-8000-000000000001",
};

describe("AuthController", () => {
  let app: INestApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("sets an httpOnly session cookie on login without returning the token", async () => {
    const authService = makeAuthService();
    app = await makeApp({ authService });

    const response = await request(app.getHttpServer() as Server)
      .post("/auth/login")
      .send({ email: "admin@example.com", password: "safe-password-123" })
      .expect(200);

    expect(response.body).toEqual({
      user: expect.objectContaining({
        id: ids.user,
        email: "admin@example.com",
      }),
    });
    expect(JSON.stringify(response.body)).not.toContain("raw-session-token");
    const setCookie = readSetCookieHeader(response);
    expect(setCookie).toContain(`${sessionCookieName}=raw-session-token`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(authService.login).toHaveBeenCalledOnce();
  });

  it("clears the session cookie on logout and passes the cookie token to the service", async () => {
    const authService = makeAuthService();
    app = await makeApp({ authService });

    const response = await request(app.getHttpServer() as Server)
      .post("/auth/logout")
      .set("Cookie", `${sessionCookieName}=raw-session-token`)
      .expect(204);

    const setCookie = readSetCookieHeader(response);
    expect(setCookie).toContain(`${sessionCookieName}=`);
    expect(authService.logout).toHaveBeenCalledWith("raw-session-token");
  });

  it("returns 401 for me without a session cookie", async () => {
    await withProductionEnv(async () => {
      app = await makeApp({ authService: makeAuthService() });

      const response = await request(app.getHttpServer() as Server)
        .get("/auth/me")
        .expect(401);

      expect(response.body.message).toBe("User context is required.");
    });
  });

  it("returns masked current user info for me with a valid session", async () => {
    await withProductionEnv(async () => {
      const authService = makeAuthService();
      app = await makeApp({
        authService,
        prisma: makePrisma({ session: makeSession() }),
      });

      const response = await request(app.getHttpServer() as Server)
        .get("/auth/me")
        .set("Cookie", `${sessionCookieName}=raw-session-token`)
        .expect(200);

      expect(response.body).toEqual({
        user: expect.objectContaining({
          id: ids.user,
          email: "admin@example.com",
          roleCodes: [RoleCode.systemAdmin],
        }),
      });
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");
      expect(JSON.stringify(response.body)).not.toContain("raw-session-token");
      expect(authService.getMe).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: ids.user,
          permissionCodes: [PermissionCode.userContextRead],
        }),
      );
    });
  });

  it("does not let X-Demo-User-Id bypass production session auth", async () => {
    await withProductionEnv(async () => {
      app = await makeApp({ authService: makeAuthService() });

      await request(app.getHttpServer() as Server)
        .get("/auth/me")
        .set("X-Demo-User-Id", ids.user)
        .expect(401);
    });
  });
});

const makeApp = async ({
  authService,
  prisma = makePrisma(),
}: {
  authService: ReturnType<typeof makeAuthService>;
  prisma?: ReturnType<typeof makePrisma>;
}): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AuthModule],
  })
    .overrideProvider(AuthService)
    .useValue(authService)
    .overrideProvider(AccountLifecycleService)
    .useValue(makeAccountLifecycleService())
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .compile();

  const nestApp = moduleRef.createNestApplication();
  await nestApp.init();
  return nestApp;
};

const makeAuthService = () => ({
  bootstrapAdmin: vi.fn(),
  login: vi.fn(async () => ({
    user: makeAuthUserResponse(),
    sessionToken: "raw-session-token",
    expiresAt: new Date("2026-06-24T00:00:00.000Z"),
  })),
  logout: vi.fn(async () => undefined),
  getMe: vi.fn(async () => makeAuthUserResponse()),
});

const makeAccountLifecycleService = () => ({
  requestPasswordResetByEmail: vi.fn(async () => ({ accepted: true })),
  confirmPasswordReset: vi.fn(async () => ({ reset: true })),
  acceptInvite: vi.fn(async () => ({ accepted: true })),
});

const readSetCookieHeader = (response: request.Response): string => {
  const header = response.headers["set-cookie"];
  return Array.isArray(header) ? header.join(";") : String(header ?? "");
};

const makeAuthUserResponse = () => ({
  id: ids.user,
  email: "admin@example.com",
  name: "Admin",
  departmentId: ids.department,
  roleCodes: [RoleCode.systemAdmin],
  permissionCodes: [PermissionCode.userContextRead],
  scopedDepartmentIds: [ids.department],
});

const makePrisma = ({ session = null }: { session?: ReturnType<typeof makeSession> | null } = {}) => ({
  userSession: {
    findFirst: vi.fn(async () => session),
  },
});

const makeSession = () => ({
  id: "session-1",
  userId: ids.user,
  user: {
    id: ids.user,
    departmentId: ids.department,
    status: "ACTIVE",
    credential: {
      status: "ACTIVE",
    },
    userRoles: [
      {
        departmentId: ids.department,
        scopeKey: ids.department,
        scopeType: ScopeType.department,
        role: {
          id: ids.role,
          code: RoleCode.systemAdmin,
          rolePermissions: [
            {
              permission: {
                code: PermissionCode.userContextRead,
                status: "ACTIVE",
              },
            },
          ],
        },
      },
    ],
  },
});

const withProductionEnv = async (callback: () => Promise<void>): Promise<void> => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousSessionSecret = process.env.SESSION_SECRET;
  process.env.NODE_ENV = "production";
  process.env.SESSION_SECRET = "test-session-secret";
  try {
    await callback();
  } finally {
    setOptionalEnv("NODE_ENV", previousNodeEnv);
    setOptionalEnv("SESSION_SECRET", previousSessionSecret);
  }
};

const setOptionalEnv = (name: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
};
