import {
  AccountLifecycleDeliveryStatus,
  AccountLifecycleTokenPurpose,
  AccountLifecycleTokenStatus,
  UserStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { allowDecision, denyDecision } from "../authorization/policy/policy-decision";
import { UserContext } from "../identity/user-context";
import { AccountLifecycleInvalidTokenError } from "./account-lifecycle.errors";
import { AccountLifecycleMailer } from "./account-lifecycle-mailer";
import { AccountLifecycleRepository } from "./account-lifecycle.repository";
import { AccountLifecycleService } from "./account-lifecycle.service";

vi.mock("../auth/auth-crypto", () => ({
  hashPassword: vi.fn(async (password: string) => `hashed-password:${password}`),
}));

vi.mock("./account-lifecycle-crypto", () => ({
  createAccountLifecycleToken: vi.fn(() => "raw-lifecycle-token"),
  hashAccountLifecycleEmail: vi.fn((email: string) => `email-hash:${email}`),
  hashAccountLifecycleToken: vi.fn((token: string) => `token-hash:${token}`),
}));

const ids = {
  actor: "40000000-0000-4000-8000-000000000001",
  targetUser: "40000000-0000-4000-8000-000000000002",
  role: "50000000-0000-4000-8000-000000000001",
  userRole: "60000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  token: "70000000-0000-4000-8000-000000000001",
};

const adminContext: UserContext = {
  userId: ids.actor,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.systemAdmin],
  permissionCodes: [
    PermissionCode.accountInvite,
    PermissionCode.accountResetPassword,
  ],
  roleScopes: [
    {
      roleCode: RoleCode.systemAdmin,
      scopeType: ScopeType.global,
      scopeKey: "GLOBAL",
      departmentId: null,
    },
  ],
  scopedDepartmentIds: [ids.department],
};

describe("AccountLifecycleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts public reset requests for unknown users without sending a token", async () => {
    const { service, repository, mailer, auditService } = createService();
    repository.findUserByEmail.mockResolvedValueOnce(null);

    const result = await service.requestPasswordResetByEmail(" Missing@Example.COM ");

    expect(result).toEqual({ accepted: true });
    expect(mailer.enqueue).not.toHaveBeenCalled();
    expect(auditService.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditActionCode.passwordResetFailed,
        newValue: expect.objectContaining({
          failureCategory: "TARGET_INELIGIBLE_OR_UNKNOWN",
          emailHash: "email-hash:missing@example.com",
        }),
      }),
    );
    expect(JSON.stringify(auditService.recordEvent.mock.calls)).not.toContain(
      "Missing@Example.COM",
    );
  });

  it("creates an invite with a stored token hash and a token-free response", async () => {
    const { service, repository, mailer, auditService } = createService();

    const result = await service.createInvite(adminContext, {
      email: " Invitee@Example.COM ",
      name: " Invitee ",
      departmentId: ids.department,
      roles: [
        {
          roleCode: RoleCode.researcher,
          scopeType: ScopeType.department,
          departmentId: ids.department,
        },
      ],
      reason: "onboarding",
    });

    expect(result).toEqual({
      userId: ids.targetUser,
      deliveryStatus: AccountLifecycleDeliveryStatus.QUEUED,
    });
    expect(repository.createPendingUserInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        email: "invitee@example.com",
        name: "Invitee",
      }),
    );
    expect(repository.createTokenInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        purpose: AccountLifecycleTokenPurpose.INVITE_ACCEPT,
        tokenHash: "token-hash:raw-lifecycle-token",
      }),
    );
    expect(mailer.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "raw-lifecycle-token",
        template: "INVITE_ACCEPT",
      }),
    );

    const serializedResponse = JSON.stringify(result);
    expect(serializedResponse).not.toContain("raw-lifecycle-token");
    expect(serializedResponse).not.toContain("token-hash");
    expect(JSON.stringify(auditService.recordEventInTransaction.mock.calls)).not.toContain(
      "raw-lifecycle-token",
    );
  });

  it("accepts an invite by activating the pending user and consuming the token", async () => {
    const { service, repository, auditService } = createService();
    repository.findTokenByHashInTransaction.mockResolvedValueOnce(
      makeToken(AccountLifecycleTokenPurpose.INVITE_ACCEPT, makeUser(UserStatus.PENDING_ACTIVATION, false)),
    );

    await expect(
      service.acceptInvite("raw-invite-token", "new-password-123"),
    ).resolves.toEqual({ accepted: true });

    expect(repository.upsertCredentialInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: ids.targetUser,
        passwordHash: "hashed-password:new-password-123",
        mustChangePassword: false,
      }),
    );
    expect(repository.activatePendingUserInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.targetUser,
    );
    expect(repository.markTokenUsedInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.token,
      expect.any(Date),
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ action: AuditActionCode.inviteAccepted }),
    );
  });

  it("confirms password reset, revokes sessions, and never audits raw secrets", async () => {
    const { service, repository, auditService } = createService();
    repository.findTokenByHashInTransaction.mockResolvedValueOnce(
      makeToken(AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF, makeUser(UserStatus.ACTIVE, true)),
    );

    await expect(
      service.confirmPasswordReset("raw-reset-token", "new-password-123"),
    ).resolves.toEqual({ reset: true });

    expect(repository.upsertCredentialInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: ids.targetUser,
        passwordHash: "hashed-password:new-password-123",
        mustChangePassword: false,
      }),
    );
    expect(repository.revokeSessionsInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: ids.targetUser,
        revokedReason: "PASSWORD_RESET",
      }),
    );
    expect(repository.markTokenUsedInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.token,
      expect.any(Date),
    );

    const serializedAudit = JSON.stringify(auditService.recordEventInTransaction.mock.calls);
    expect(serializedAudit).not.toContain("raw-reset-token");
    expect(serializedAudit).not.toContain("new-password-123");
    expect(serializedAudit).not.toContain("hashed-password");
  });

  it("rejects used, revoked, or expired reset tokens before credential changes", async () => {
    const { service, repository } = createService();
    repository.findTokenByHashInTransaction.mockResolvedValueOnce({
      ...makeToken(AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF, makeUser(UserStatus.ACTIVE, true)),
      usedAt: new Date("2026-06-27T00:00:00.000Z"),
    });

    await expect(
      service.confirmPasswordReset("used-token", "new-password-123"),
    ).rejects.toBeInstanceOf(AccountLifecycleInvalidTokenError);

    expect(repository.upsertCredentialInTransaction).not.toHaveBeenCalled();
    expect(repository.markTokenUsedInTransaction).not.toHaveBeenCalled();
  });

  it("requires the dedicated admin reset permission", async () => {
    const { service, repository, rbacPolicy } = createService();
    rbacPolicy.hasPermission.mockReturnValueOnce(
      denyDecision("Required permissions are missing.", [PermissionCode.accountResetPassword]),
    );

    await expect(
      service.requestAdminPasswordReset(adminContext, ids.targetUser, "manual reset"),
    ).rejects.toThrow("Required permissions are missing.");

    expect(repository.findUserById).not.toHaveBeenCalled();
  });

  it.each([
    AccountLifecycleDeliveryStatus.FAILED,
    AccountLifecycleDeliveryStatus.SUPPRESSED,
    AccountLifecycleDeliveryStatus.QUEUED,
  ])("persists safe fake-provider delivery status %s without exposing token material", async (deliveryStatus) => {
    const { service, repository, mailer, auditService } = createService();
    mailer.enqueue.mockResolvedValueOnce({
      deliveryStatus,
      adapter: "LOCAL_FAKE_PROVIDER",
      template: "PASSWORD_RESET",
    });

    const result = await service.requestAdminPasswordReset(
      adminContext,
      ids.targetUser,
      "dry-run",
    );

    expect(result).toEqual({
      userId: ids.targetUser,
      deliveryStatus,
    });
    expect(repository.updateTokenDeliveryInTransaction).toHaveBeenCalledWith(
      expect.any(Object),
      ids.token,
      {
        deliveryAdapter: "LOCAL_FAKE_PROVIDER",
        deliveryStatus,
      },
    );

    const serialized = JSON.stringify({
      result,
      deliveryUpdates: repository.updateTokenDeliveryInTransaction.mock.calls,
      audit: auditService.recordEventInTransaction.mock.calls,
    });
    expect(serialized).not.toContain("raw-lifecycle-token");
    expect(serialized).not.toContain("token-hash:raw-lifecycle-token");
    expect(serialized).not.toContain("https://");
  });
});

const createService = () => {
  const tx = { accountLifecycleToken: {}, auditLog: {} };
  const repository = {
    transaction: vi.fn(async (callback) => callback(tx)),
    findUserByEmail: vi.fn().mockResolvedValue(makeUser(UserStatus.ACTIVE, true)),
    findUserById: vi.fn().mockResolvedValue(makeUser(UserStatus.ACTIVE, true)),
    findActiveDepartmentById: vi.fn().mockResolvedValue({ id: ids.department }),
    findActiveRolesByCodes: vi.fn().mockResolvedValue([
      { id: ids.role, code: RoleCode.researcher },
    ]),
    createPendingUserInTransaction: vi.fn().mockResolvedValue(
      makeUser(UserStatus.PENDING_ACTIVATION, false, "invitee@example.com"),
    ),
    revokeActiveTokensInTransaction: vi.fn().mockResolvedValue({ count: 1 }),
    createTokenInTransaction: vi.fn().mockResolvedValue({ id: ids.token }),
    updateTokenDeliveryInTransaction: vi.fn().mockResolvedValue({ id: ids.token }),
    findTokenByHashInTransaction: vi.fn().mockResolvedValue(null),
    markTokenUsedInTransaction: vi.fn().mockResolvedValue({ id: ids.token }),
    activatePendingUserInTransaction: vi.fn().mockResolvedValue(makeUser(UserStatus.ACTIVE, true)),
    upsertCredentialInTransaction: vi.fn().mockResolvedValue({ userId: ids.targetUser }),
    revokeSessionsInTransaction: vi.fn().mockResolvedValue({ count: 2 }),
  };
  const auditService = {
    recordEvent: vi.fn().mockResolvedValue({ id: "audit-1" }),
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-2" }),
  };
  const rbacPolicy = {
    hasPermission: vi.fn().mockReturnValue(allowDecision("allowed")),
  };
  const mailer = {
    enqueue: vi.fn().mockResolvedValue({
      deliveryStatus: AccountLifecycleDeliveryStatus.QUEUED,
      adapter: "LOCAL_SAFE_STUB",
      template: "INVITE_ACCEPT",
    }),
  };

  const service = new AccountLifecycleService(
    repository as unknown as AccountLifecycleRepository,
    auditService as never,
    rbacPolicy as never,
    mailer as unknown as AccountLifecycleMailer,
  );

  return { service, repository, auditService, rbacPolicy, mailer };
};

const makeUser = (
  status: UserStatus,
  hasCredential: boolean,
  email = "target@example.com",
) => ({
  id: ids.targetUser,
  email,
  name: "Target User",
  status,
  departmentId: ids.department,
  department: {
    id: ids.department,
    code: "INSTITUTE_ROOT",
    name: "Institute",
    status: "ACTIVE",
    archivedAt: null,
  },
  credential: hasCredential
    ? {
        status: "ACTIVE",
        passwordUpdatedAt: new Date("2026-06-24T00:00:00.000Z"),
      }
    : null,
  userRoles: [
    {
      id: ids.userRole,
      roleId: ids.role,
      role: {
        id: ids.role,
        code: RoleCode.researcher,
        name: "Researcher",
        status: "ACTIVE",
        archivedAt: null,
      },
      scopeType: ScopeType.department,
      scopeKey: ids.department,
      departmentId: ids.department,
      revokedAt: null,
    },
  ],
});

const makeToken = (
  purpose: AccountLifecycleTokenPurpose,
  targetUser: ReturnType<typeof makeUser>,
) => ({
  id: ids.token,
  purpose,
  status: AccountLifecycleTokenStatus.ACTIVE,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  usedAt: null,
  revokedAt: null,
  targetUser,
});
