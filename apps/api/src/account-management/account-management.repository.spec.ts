import {
  AccountLifecycleDeliveryStatus,
  AccountLifecycleTokenPurpose,
  AccountLifecycleTokenStatus,
  CredentialStatus,
  UserStatus,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ScopeType } from "../authorization/constants/scope-type";
import { AccountManagementRepository } from "./account-management.repository";

const ids = {
  user: "40000000-0000-4000-8000-000000000002",
  role: "50000000-0000-4000-8000-000000000001",
  userRole: "60000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
};

describe("AccountManagementRepository projections", () => {
  it("returns list and detail projections without session ids or lifecycle target user ids", async () => {
    const row = makeUserRow({
      lastLogin: {
        id: "session-should-not-leak",
        sessionHash: "session-hash-should-not-leak",
      },
      lifecycleToken: {
        targetUserId: "target-user-should-not-leak",
        tokenHash: "token-hash-should-not-leak",
        rawToken: "raw-token-should-not-leak",
      },
    });
    const prisma = makePrisma([row], makeAuditRows());
    const repository = new AccountManagementRepository(prisma as never);

    const list = await repository.findMany({ page: 1, pageSize: 20 });
    const detail = await repository.findById(ids.user);
    const firstItem = list.items[0];

    expect(firstItem).toBeDefined();
    expect(firstItem?.loginEligibility).toEqual({
      canLogin: true,
      reasonCode: "ACTIVE_CREDENTIAL",
      reasonLabel: "User and credential are active.",
      blockingFactors: [],
    });
    expect(firstItem?.lastLogin).not.toHaveProperty("sessionId");
    expect(detail?.recentLifecycleDelivery).not.toHaveProperty("targetUserId");
    expect(detail?.lifecycleActionSummary).toMatchObject({
      disabledCount: 1,
      enabledCount: 1,
      inviteCreatedCount: 1,
      inviteResentCount: 1,
      resetRequestedCount: 1,
      resetRevokedCount: 1,
      latestDeliveryStatus: AccountLifecycleDeliveryStatus.QUEUED,
      latestDeliveryAdapter: "LOCAL_SAFE_STUB",
    });

    const serialized = JSON.stringify({ list, detail });
    expect(serialized).not.toContain("passwordHash");
    expect(serialized).not.toContain("safe-password-123");
    expect(serialized).not.toContain("token-hash-should-not-leak");
    expect(serialized).not.toContain("raw-token-should-not-leak");
    expect(serialized).not.toContain("https://example.test/reset");
    expect(serialized).not.toContain("session-should-not-leak");
    expect(serialized).not.toContain("session-hash-should-not-leak");
    expect(serialized).not.toContain("cookie-should-not-leak");
    expect(serialized).not.toContain("DATABASE_URL");
    expect(serialized).not.toContain("postgres://");
    expect(serialized).not.toContain("secret-should-not-leak");
    expect(serialized).not.toContain("rawAuditJson");
    expect(serialized).not.toContain("debug");
    expect(serialized).not.toContain("exportUrl");
    expect(serialized).not.toContain("downloadUrl");
  });

  it.each([
    [
      "active user with active credential",
      UserStatus.ACTIVE,
      CredentialStatus.ACTIVE,
      true,
      "ACTIVE_CREDENTIAL",
      [],
    ],
    [
      "pending activation",
      UserStatus.PENDING_ACTIVATION,
      null,
      false,
      "PENDING_ACTIVATION",
      ["USER_PENDING_ACTIVATION", "CREDENTIAL_NOT_ACTIVE"],
    ],
    [
      "disabled user",
      UserStatus.DISABLED,
      CredentialStatus.ACTIVE,
      false,
      "USER_DISABLED",
      ["USER_DISABLED"],
    ],
    [
      "archived user",
      UserStatus.ARCHIVED,
      CredentialStatus.ACTIVE,
      false,
      "USER_ARCHIVED",
      ["USER_ARCHIVED"],
    ],
    [
      "active user without credential",
      UserStatus.ACTIVE,
      null,
      false,
      "NO_CREDENTIAL",
      ["NO_CREDENTIAL"],
    ],
    [
      "active user with disabled credential",
      UserStatus.ACTIVE,
      CredentialStatus.DISABLED,
      false,
      "CREDENTIAL_DISABLED",
      ["CREDENTIAL_DISABLED"],
    ],
  ])(
    "derives loginEligibility for %s",
    async (_name, userStatus, credentialStatus, canLogin, reasonCode, blockingFactors) => {
      const prisma = makePrisma([
        makeUserRow({
          status: userStatus,
          credentialStatus,
        }),
      ]);
      const repository = new AccountManagementRepository(prisma as never);

      const detail = await repository.findById(ids.user);

      expect(detail?.loginEligibility).toMatchObject({
        canLogin,
        reasonCode,
        blockingFactors,
      });
    },
  );

  it("limits role change summaries to safe fields and the latest five rows", async () => {
    const prisma = makePrisma([makeUserRow()], [
      makeAuditRow("USER_ROLE_ASSIGN", "2026-07-06T06:00:00.000Z", {
        roleCode: "SYSTEM_ADMIN",
        scopeType: ScopeType.global,
        departmentId: null,
        reason: "temporary admin",
        operatorEmail: "operator@example.com",
        rawActorProfile: { email: "operator@example.com" },
        permissionGraph: ["system:config", "secret:read"],
      }),
      makeAuditRow("USER_ROLE_REVOKE", "2026-07-06T05:00:00.000Z", {
        roleCode: "AUDITOR",
        scopeType: ScopeType.department,
        departmentId: ids.department,
        reasonProvided: true,
        rawAuditJson: { unsafe: true },
      }),
      makeAuditRow("USER_ROLE_ASSIGN", "2026-07-06T04:00:00.000Z", {
        roleCode: "RESEARCHER",
        scopeType: ScopeType.department,
        departmentId: ids.department,
      }),
      makeAuditRow("USER_ROLE_REVOKE", "2026-07-06T03:00:00.000Z", {
        roleCode: "RESEARCH_SECRETARY",
        scopeType: ScopeType.department,
        departmentId: ids.department,
      }),
      makeAuditRow("USER_ROLE_ASSIGN", "2026-07-06T02:00:00.000Z", {
        roleCode: "LEADER",
        scopeType: ScopeType.department,
        departmentId: ids.department,
      }),
      makeAuditRow("USER_ROLE_REVOKE", "2026-07-06T01:00:00.000Z", {
        roleCode: "SECRET_MANAGER",
        scopeType: ScopeType.department,
        departmentId: ids.department,
      }),
    ]);
    const repository = new AccountManagementRepository(prisma as never);

    const detail = await repository.findById(ids.user);

    expect(detail?.roleChangeAuditSummary).toMatchObject({
      assignedCount: 3,
      revokedCount: 3,
    });
    expect(detail?.roleChangeAuditSummary.recentRoleChanges).toHaveLength(5);
    expect(detail?.roleChangeAuditSummary.recentRoleChanges[0]).toEqual({
      operation: "USER_ROLE_ASSIGN",
      roleCode: "SYSTEM_ADMIN",
      scopeType: ScopeType.global,
      departmentId: null,
      reasonProvided: true,
      createdAt: new Date("2026-07-06T06:00:00.000Z"),
    });
    expect(Object.keys(detail?.roleChangeAuditSummary.recentRoleChanges[0] ?? {})).toEqual([
      "operation",
      "roleCode",
      "scopeType",
      "departmentId",
      "reasonProvided",
      "createdAt",
    ]);

    const serialized = JSON.stringify(detail);
    expect(serialized).not.toContain("operator@example.com");
    expect(serialized).not.toContain("rawActorProfile");
    expect(serialized).not.toContain("rawAuditJson");
    expect(serialized).not.toContain("permissionGraph");
  });
});

const makePrisma = (rows: unknown[], auditRows: unknown[] = []) => ({
  $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
  user: {
    findMany: vi.fn(async () => rows),
    count: vi.fn(async () => rows.length),
    findUnique: vi.fn(async () => rows[0] ?? null),
  },
  auditLog: {
    findMany: vi.fn(async () => auditRows),
  },
});

const makeUserRow = (
  overrides: {
    status?: UserStatus;
    credentialStatus?: CredentialStatus | null;
    lastLogin?: Record<string, unknown>;
    lifecycleToken?: Record<string, unknown>;
  } = {},
) => {
  const now = new Date("2026-07-06T00:00:00.000Z");
  const credentialStatus = Object.prototype.hasOwnProperty.call(
    overrides,
    "credentialStatus",
  )
    ? overrides.credentialStatus
    : CredentialStatus.ACTIVE;

  return {
    id: ids.user,
    email: "researcher@example.com",
    name: "Researcher",
    status: overrides.status ?? UserStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    department: {
      id: ids.department,
      code: "INSTITUTE_ROOT",
      name: "Institute",
      status: "ACTIVE",
    },
    credential: credentialStatus
      ? {
          status: credentialStatus,
          passwordUpdatedAt: now,
          mustChangePassword: false,
          disabledAt:
            credentialStatus === CredentialStatus.DISABLED
              ? new Date("2026-07-06T01:00:00.000Z")
              : null,
          createdAt: now,
          updatedAt: now,
        }
      : null,
    userRoles: [
      {
        id: ids.userRole,
        scopeType: ScopeType.department,
        scopeKey: ids.department,
        departmentId: ids.department,
        createdAt: now,
        role: {
          id: ids.role,
          code: "RESEARCHER",
          name: "Researcher",
          status: "ACTIVE",
        },
      },
    ],
    sessions: [
      {
        createdAt: new Date("2026-07-06T02:00:00.000Z"),
        expiresAt: new Date("2026-07-07T02:00:00.000Z"),
        revokedAt: null,
        lastSeenAt: new Date("2026-07-06T03:00:00.000Z"),
        ...overrides.lastLogin,
      },
    ],
    accountLifecycleTokens: [
      {
        purpose: AccountLifecycleTokenPurpose.PASSWORD_RESET_ADMIN,
        status: AccountLifecycleTokenStatus.ACTIVE,
        deliveryChannel: "EMAIL",
        deliveryStatus: AccountLifecycleDeliveryStatus.QUEUED,
        deliveryAdapter: "LOCAL_SAFE_STUB",
        expiresAt: new Date("2026-07-07T00:00:00.000Z"),
        usedAt: null,
        revokedAt: null,
        createdAt: now,
        updatedAt: now,
        ...overrides.lifecycleToken,
      },
    ],
  };
};

const makeAuditRows = () => [
  makeAuditRow("PASSWORD_RESET_REVOKED", "2026-07-06T06:00:00.000Z", {
    revokedTokenCount: 1,
  }),
  makeAuditRow("PASSWORD_RESET_REQUESTED_ADMIN", "2026-07-06T05:00:00.000Z", {
    tokenId: "token-id-should-not-leak",
    fullLink: "https://example.test/reset?token=raw-token-should-not-leak",
  }),
  makeAuditRow("INVITE_RESENT", "2026-07-06T04:00:00.000Z"),
  makeAuditRow("INVITE_CREATED", "2026-07-06T03:00:00.000Z"),
  makeAuditRow("USER_ENABLE", "2026-07-06T02:00:00.000Z"),
  makeAuditRow("USER_DISABLE", "2026-07-06T01:00:00.000Z", {
    revokedSessionCount: 2,
    sessionId: "session-should-not-leak",
    cookie: "cookie-should-not-leak",
    DATABASE_URL: "postgres://user:secret-should-not-leak@example/db",
    debug: { rawAuditJson: true },
    exportUrl: "https://example.test/export",
    downloadUrl: "https://example.test/download",
  }),
];

const makeAuditRow = (
  operation: string,
  createdAt: string,
  extraNewValue: Record<string, unknown> = {},
) => ({
  id: `audit-${operation}-${createdAt}`,
  targetId: ids.user,
  action: operation,
  newValue: {
    operation,
    ...extraNewValue,
  },
  createdAt: new Date(createdAt),
});
