import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { hashPassword } from "./auth-crypto";
import {
  AuthBootstrapAlreadyCompletedError,
  AuthInvalidCredentialsError,
} from "./auth.errors";
import { AuthService } from "./auth.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000003",
  department: "10000000-0000-4000-8000-000000000001",
  session: "70000000-0000-4000-8000-000000000001",
};

describe("AuthService", () => {
  it("bootstraps the first system admin without returning password material", async () => {
    await withAuthEnv(async () => {
      const prisma = makePrisma();
      const auditService = makeAuditService();
      const service = new AuthService(prisma as never, auditService as never);

      const result = await service.bootstrapAdmin({
        email: "Admin@Example.COM",
        name: " Admin ",
        password: "safe-password-123",
        departmentId: ids.department,
      });

      expect(prisma.userRole.findFirst).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "admin@example.com",
            name: "Admin",
            credential: {
              create: expect.objectContaining({
                passwordHash: expect.stringContaining("scrypt$"),
              }),
            },
          }),
        }),
      );
      expect(result).toEqual({
        bootstrapped: true,
        user: expect.objectContaining({
          id: ids.user,
          email: "admin@example.com",
          roleCodes: [RoleCode.systemAdmin],
        }),
      });
      expect(JSON.stringify(result)).not.toContain("safe-password-123");
      expect(JSON.stringify(result)).not.toContain("passwordHash");
      expect(auditService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditActionCode.bootstrapAdmin,
          target: expect.objectContaining({
            type: AuditTargetTypeCode.user,
            id: ids.user,
          }),
        }),
      );
      expect(JSON.stringify(auditService.recordEvent.mock.calls)).not.toContain("safe-password-123");
    });
  });

  it("rejects repeated bootstrap when an active system admin exists", async () => {
    await withAuthEnv(async () => {
      const prisma = makePrisma({ existingAdmin: true });
      const service = new AuthService(prisma as never, makeAuditService() as never);

      await expect(
        service.bootstrapAdmin({
          email: "admin@example.com",
          name: "Admin",
          password: "safe-password-123",
          departmentId: ids.department,
        }),
      ).rejects.toBeInstanceOf(AuthBootstrapAlreadyCompletedError);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  it("logs in with a valid password, creates a hashed session, and records safe audit", async () => {
    await withAuthEnv(async () => {
      const passwordHash = await hashPassword("safe-password-123");
      const prisma = makePrisma({ user: makeUser({ passwordHash }) });
      const auditService = makeAuditService();
      const service = new AuthService(prisma as never, auditService as never);

      const result = await service.login({
        email: "admin@example.com",
        password: "safe-password-123",
      });

      expect(prisma.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: ids.user,
          sessionHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      const sessionHash = prisma.userSession.create.mock.calls[0]![0].data.sessionHash;
      expect(sessionHash).not.toBe(result.sessionToken);
      expect(result.user).toEqual(
        expect.objectContaining({
          id: ids.user,
          email: "admin@example.com",
          roleCodes: [RoleCode.systemAdmin],
        }),
      );
      expect(JSON.stringify(result)).not.toContain("safe-password-123");
      expect(JSON.stringify(result)).not.toContain("passwordHash");
      expect(auditService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditActionCode.login,
          target: expect.objectContaining({
            type: AuditTargetTypeCode.userSession,
          }),
        }),
      );
    });
  });

  it("rejects invalid password and records LoginAttempt without sensitive values", async () => {
    await withAuthEnv(async () => {
      const passwordHash = await hashPassword("safe-password-123");
      const prisma = makePrisma({ user: makeUser({ passwordHash }) });
      const auditService = makeAuditService();
      const service = new AuthService(prisma as never, auditService as never);

      await expect(
        service.login({
          email: "admin@example.com",
          password: "wrong-password",
        }),
      ).rejects.toBeInstanceOf(AuthInvalidCredentialsError);

      expect(prisma.loginAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          success: false,
          failureReason: "INVALID_CREDENTIALS",
          userId: ids.user,
        }),
      });
      expect(prisma.userSession.create).not.toHaveBeenCalled();
      const serializedAudit = JSON.stringify(auditService.recordEvent.mock.calls);
      expect(serializedAudit).not.toContain("wrong-password");
      expect(serializedAudit).not.toContain("safe-password-123");
      expect(serializedAudit).not.toContain("passwordHash");
    });
  });

  it("rejects disabled users and disabled credentials", async () => {
    await withAuthEnv(async () => {
      const passwordHash = await hashPassword("safe-password-123");
      const disabledUserService = new AuthService(
        makePrisma({ user: makeUser({ passwordHash, status: "DISABLED" }) }) as never,
        makeAuditService() as never,
      );
      const disabledCredentialService = new AuthService(
        makePrisma({
          user: makeUser({ passwordHash, credentialStatus: "DISABLED" }),
        }) as never,
        makeAuditService() as never,
      );

      await expect(
        disabledUserService.login({ email: "admin@example.com", password: "safe-password-123" }),
      ).rejects.toBeInstanceOf(AuthInvalidCredentialsError);
      await expect(
        disabledCredentialService.login({
          email: "admin@example.com",
          password: "safe-password-123",
        }),
      ).rejects.toBeInstanceOf(AuthInvalidCredentialsError);
    });
  });

  it("revokes an existing session on logout and clears no raw token into audit", async () => {
    await withAuthEnv(async () => {
      const prisma = makePrisma({
        session: {
          id: ids.session,
          user: makeUser(),
        },
      });
      const auditService = makeAuditService();
      const service = new AuthService(prisma as never, auditService as never);

      await service.logout("raw-session-token");

      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: ids.session },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
          revokedReason: "LOGOUT",
        }),
      });
      expect(auditService.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditActionCode.logout,
          target: expect.objectContaining({
            type: AuditTargetTypeCode.userSession,
            id: ids.session,
          }),
        }),
      );
      expect(JSON.stringify(auditService.recordEvent.mock.calls)).not.toContain("raw-session-token");
    });
  });
});

const makePrisma = (
  options: {
    existingAdmin?: boolean;
    user?: ReturnType<typeof makeUser> | null;
    session?: { id: string; user: ReturnType<typeof makeUser> } | null;
  } = {},
) => ({
  userRole: {
    findFirst: vi.fn(async () => (options.existingAdmin ? { id: "user-role-1" } : null)),
  },
  role: {
    findFirst: vi.fn(async () => ({ id: ids.role, code: RoleCode.systemAdmin, status: "ACTIVE" })),
  },
  user: {
    create: vi.fn(async ({ data }) =>
      makeUser({
        email: data.email,
        name: data.name,
        departmentId: data.departmentId,
        roleCode: RoleCode.systemAdmin,
      }),
    ),
    findUnique: vi.fn(async () => options.user ?? null),
    findFirst: vi.fn(async () => options.user ?? makeUser()),
  },
  userSession: {
    create: vi.fn(async ({ data }) => ({ id: ids.session, ...data })),
    findFirst: vi.fn(async () => options.session ?? null),
    update: vi.fn(async ({ data }) => ({ id: ids.session, ...data })),
  },
  loginAttempt: {
    create: vi.fn(async ({ data }) => ({ id: "attempt-1", ...data })),
  },
});

const makeAuditService = () => ({
  recordEvent: vi.fn(async () => ({ id: "audit-1" })),
});

const makeUser = (
  overrides: {
    email?: string;
    name?: string;
    departmentId?: string;
    status?: string;
    credentialStatus?: string;
    passwordHash?: string;
    roleCode?: RoleCode;
  } = {},
) => ({
  id: ids.user,
  email: overrides.email ?? "admin@example.com",
  name: overrides.name ?? "Admin",
  departmentId: overrides.departmentId ?? ids.department,
  status: overrides.status ?? "ACTIVE",
  credential: {
    passwordHash: overrides.passwordHash ?? "scrypt$hash-placeholder",
    status: overrides.credentialStatus ?? "ACTIVE",
  },
  userRoles: [
    {
      departmentId: ids.department,
      scopeKey: ids.department,
      scopeType: ScopeType.department,
      role: {
        id: ids.role,
        code: overrides.roleCode ?? RoleCode.systemAdmin,
        rolePermissions: [
          {
            permission: {
              code: "user_context:read",
              status: "ACTIVE",
            },
          },
        ],
      },
    },
  ],
});

const withAuthEnv = async (callback: () => Promise<void>): Promise<void> => {
  const previousBootstrap = process.env.AUTH_BOOTSTRAP_ENABLED;
  const previousSessionSecret = process.env.SESSION_SECRET;
  process.env.AUTH_BOOTSTRAP_ENABLED = "true";
  process.env.SESSION_SECRET = "test-session-secret";
  try {
    await callback();
  } finally {
    setOptionalEnv("AUTH_BOOTSTRAP_ENABLED", previousBootstrap);
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
