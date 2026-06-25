import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import {
  hashSessionToken,
  readCookie,
  sessionCookieName,
  SessionIdentityAdapter,
} from "./session-identity.adapter";

const sessionSecret = "test-session-secret";
const rawSessionToken = "raw-session-token";
const sessionHash = hashSessionToken(rawSessionToken, sessionSecret);

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000002",
};

describe("SessionIdentityAdapter", () => {
  it("reads the configured session cookie without exposing other cookies", () => {
    expect(
      readCookie(
        {
          headers: {
            cookie: `other=value; ${sessionCookieName}=${encodeURIComponent(rawSessionToken)}`,
          },
        },
        sessionCookieName,
      ),
    ).toBe(rawSessionToken);
  });

  it("returns null when no cookie is present", async () => {
    const prisma = makePrisma();
    const adapter = new SessionIdentityAdapter(prisma as never);

    await expect(adapter.loadUserContext({ headers: {} })).resolves.toBeNull();
    expect(prisma.userSession.findFirst).not.toHaveBeenCalled();
  });

  it("returns null when the session hash does not exist", async () => {
    await withSessionSecret(async () => {
      const prisma = makePrisma(null);
      const adapter = new SessionIdentityAdapter(prisma as never);

      await expect(adapter.loadUserContext(makeCookieRequest())).resolves.toBeNull();
      expect(prisma.userSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sessionHash,
          }),
        }),
      );
      expect(sessionHash).not.toBe(rawSessionToken);
    });
  });

  it("returns null when the session is expired or revoked because the query finds no active session", async () => {
    await withSessionSecret(async () => {
      const prisma = makePrisma(null);
      const adapter = new SessionIdentityAdapter(prisma as never);

      await expect(adapter.loadUserContext(makeCookieRequest())).resolves.toBeNull();
      expect(prisma.userSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            revokedAt: null,
            expiresAt: {
              gt: expect.any(Date),
            },
          }),
        }),
      );
    });
  });

  it("returns a UserContext for a valid active session", async () => {
    await withSessionSecret(async () => {
      const prisma = makePrisma(makeSession());
      const adapter = new SessionIdentityAdapter(prisma as never);

      await expect(adapter.loadUserContext(makeCookieRequest())).resolves.toEqual({
        userId: ids.user,
        departmentId: ids.department,
        roleIds: [ids.role],
        roleCodes: [RoleCode.researcher],
        permissionCodes: [PermissionCode.userContextRead],
        roleScopes: [
          {
            roleCode: RoleCode.researcher,
            scopeType: ScopeType.department,
            scopeKey: ids.department,
            departmentId: ids.department,
          },
        ],
        scopedDepartmentIds: [ids.department],
      });
    });
  });

  it("returns null for disabled users or disabled credentials", async () => {
    await withSessionSecret(async () => {
      const disabledUserAdapter = new SessionIdentityAdapter(
        makePrisma(makeSession({ user: { status: "DISABLED" } })) as never,
      );
      const disabledCredentialAdapter = new SessionIdentityAdapter(
        makePrisma(makeSession({ credential: { status: "DISABLED" } })) as never,
      );

      await expect(disabledUserAdapter.loadUserContext(makeCookieRequest())).resolves.toBeNull();
      await expect(disabledCredentialAdapter.loadUserContext(makeCookieRequest())).resolves.toBeNull();
    });
  });

  it("returns null when SESSION_SECRET is missing and does not query by the raw token", async () => {
    const previousSecret = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    const prisma = makePrisma(makeSession());
    const adapter = new SessionIdentityAdapter(prisma as never);

    try {
      await expect(adapter.loadUserContext(makeCookieRequest())).resolves.toBeNull();
      expect(prisma.userSession.findFirst).not.toHaveBeenCalled();
    } finally {
      setOptionalEnv("SESSION_SECRET", previousSecret);
    }
  });
});

const makeCookieRequest = () => ({
  headers: {
    cookie: `${sessionCookieName}=${encodeURIComponent(rawSessionToken)}`,
  },
});

const makePrisma = (session: ReturnType<typeof makeSession> | null = makeSession()) => ({
  userSession: {
    findFirst: vi.fn(async () => session),
  },
});

const makeSession = (
  overrides: {
    user?: { status?: string };
    credential?: { status?: string | null };
  } = {},
) => ({
  id: "session-1",
  userId: ids.user,
  user: {
    id: ids.user,
    departmentId: ids.department,
    status: overrides.user?.status ?? "ACTIVE",
    credential:
      overrides.credential?.status === null
        ? null
        : {
            status: overrides.credential?.status ?? "ACTIVE",
          },
    userRoles: [
      {
        departmentId: ids.department,
        scopeKey: ids.department,
        scopeType: ScopeType.department,
        role: {
          id: ids.role,
          code: RoleCode.researcher,
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

const withSessionSecret = async (callback: () => Promise<void>): Promise<void> => {
  const previousSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = sessionSecret;
  try {
    await callback();
  } finally {
    setOptionalEnv("SESSION_SECRET", previousSecret);
  }
};

const setOptionalEnv = (name: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
};
