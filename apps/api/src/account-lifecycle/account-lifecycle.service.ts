import { Inject, Injectable } from "@nestjs/common";
import {
  AccountLifecycleDeliveryChannel,
  AccountLifecycleDeliveryStatus,
  AccountLifecycleTokenPurpose,
  AccountLifecycleTokenStatus,
  UserStatus,
} from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { hashPassword } from "../auth/auth-crypto";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { UserContext } from "../identity/user-context";
import {
  AccountLifecycleConflictError,
  AccountLifecycleInvalidTokenError,
  AccountLifecyclePermissionDeniedError,
  AccountLifecycleTargetNotFoundError,
} from "./account-lifecycle.errors";
import {
  createAccountLifecycleToken,
  hashAccountLifecycleEmail,
  hashAccountLifecycleToken,
} from "./account-lifecycle-crypto";
import { AccountLifecycleMailer } from "./account-lifecycle-mailer";
import {
  AccountLifecycleRepository,
  AccountLifecycleTransactionClient,
  LifecycleTokenRecord,
  LifecycleUserRecord,
} from "./account-lifecycle.repository";
import { CreateInviteDto } from "./dto/account-lifecycle.dto";

const inviteTtlMs = 7 * 24 * 60 * 60 * 1000;
const passwordResetTtlMs = 60 * 60 * 1000;
const adminPasswordResetTtlMs = 24 * 60 * 60 * 1000;
const passwordResetSessionReason = "PASSWORD_RESET";

export type GenericAcceptedResponse = { accepted: true };

export type InviteIssueResult = {
  userId: string;
  deliveryStatus: AccountLifecycleDeliveryStatus;
};

export type PasswordResetIssueResult = {
  userId: string;
  deliveryStatus: AccountLifecycleDeliveryStatus;
};

@Injectable()
export class AccountLifecycleService {
  constructor(
    @Inject(AccountLifecycleRepository)
    private readonly repository: AccountLifecycleRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(AccountLifecycleMailer)
    private readonly mailer: AccountLifecycleMailer,
  ) {}

  async requestPasswordResetByEmail(email: string): Promise<GenericAcceptedResponse> {
    const normalizedEmail = normalizeEmail(email);
    const emailHash = hashAccountLifecycleEmail(normalizedEmail);
    const user = await this.repository.findUserByEmail(normalizedEmail);

    if (!isPasswordResetEligible(user)) {
      await this.auditService.recordEvent({
        actor: null,
        action: AuditActionCode.passwordResetFailed,
        target: {
          type: AuditTargetTypeCode.auth,
        },
        newValue: {
          result: "PASSWORD_RESET_REQUEST_ACCEPTED_WITHOUT_TOKEN",
          failureCategory: "TARGET_INELIGIBLE_OR_UNKNOWN",
          emailHash,
        },
      });
      return { accepted: true };
    }

    await this.issueTokenAndDeliver({
      purpose: AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF,
      targetUser: user,
      actor: null,
      emailHash,
      expiresAt: new Date(Date.now() + passwordResetTtlMs),
      reason: null,
    });

    return { accepted: true };
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ reset: true }> {
    const tokenHash = hashAccountLifecycleToken(token);
    const passwordHash = await hashPassword(newPassword);
    const now = new Date();

    await this.repository.transaction(async (tx) => {
      const record = await this.findResetTokenInTransaction(tx, tokenHash);
      this.assertConsumableToken(record, now);
      const user = this.requireTokenTarget(record);
      this.assertActiveUserForReset(user);

      await this.repository.upsertCredentialInTransaction(tx, {
        userId: user.id,
        passwordHash,
        passwordUpdatedAt: now,
        mustChangePassword: false,
      });
      const revokedSessions = await this.repository.revokeSessionsInTransaction(tx, {
        userId: user.id,
        revokedAt: now,
        revokedReason: passwordResetSessionReason,
      });
      await this.repository.markTokenUsedInTransaction(tx, record.id, now);

      await this.auditService.recordEventInTransaction(tx, {
        actor: {
          userId: user.id,
          departmentId: user.departmentId,
        },
        action: AuditActionCode.passwordResetConfirmed,
        target: {
          type: AuditTargetTypeCode.user,
          id: user.id,
          departmentId: user.departmentId,
        },
        newValue: {
          result: "PASSWORD_RESET_CONFIRMED",
          tokenId: record.id,
          purpose: record.purpose,
          targetUserId: user.id,
          revokedSessionCount: revokedSessions.count,
        },
      });
    });

    return { reset: true };
  }

  async acceptInvite(token: string, password: string): Promise<{ accepted: true }> {
    const tokenHash = hashAccountLifecycleToken(token);
    const passwordHash = await hashPassword(password);
    const now = new Date();

    await this.repository.transaction(async (tx) => {
      const record = await this.repository.findTokenByHashInTransaction(
        tx,
        tokenHash,
        AccountLifecycleTokenPurpose.INVITE_ACCEPT,
      );
      this.assertConsumableToken(record, now);
      const user = this.requireTokenTarget(record);
      this.assertPendingInviteUser(user);

      await this.repository.upsertCredentialInTransaction(tx, {
        userId: user.id,
        passwordHash,
        passwordUpdatedAt: now,
        mustChangePassword: false,
      });
      await this.repository.activatePendingUserInTransaction(tx, user.id);
      await this.repository.markTokenUsedInTransaction(tx, record.id, now);

      await this.auditService.recordEventInTransaction(tx, {
        actor: {
          userId: user.id,
          departmentId: user.departmentId,
        },
        action: AuditActionCode.inviteAccepted,
        target: {
          type: AuditTargetTypeCode.user,
          id: user.id,
          departmentId: user.departmentId,
        },
        newValue: {
          result: "INVITE_ACCEPTED",
          tokenId: record.id,
          targetUserId: user.id,
        },
      });
    });

    return { accepted: true };
  }

  async createInvite(
    actor: UserContext,
    dto: CreateInviteDto,
  ): Promise<InviteIssueResult> {
    this.assertPermission(actor, PermissionCode.accountInvite);
    const normalizedEmail = normalizeEmail(dto.email);
    const emailHash = hashAccountLifecycleEmail(normalizedEmail);

    const result = await this.repository.transaction(async (tx) => {
      const user = await this.createPendingUserInTransaction(tx, actor, {
        ...dto,
        email: normalizedEmail,
      });
      const issue = await this.createLifecycleTokenInTransaction(tx, {
        actor,
        targetUser: user,
        purpose: AccountLifecycleTokenPurpose.INVITE_ACCEPT,
        emailHash,
        expiresAt: new Date(Date.now() + inviteTtlMs),
        reason: normalizeReason(dto.reason),
      });

      await this.auditService.recordEventInTransaction(tx, {
        actor: {
          userId: actor.userId,
          departmentId: actor.departmentId,
        },
        action: AuditActionCode.inviteCreated,
        target: {
          type: AuditTargetTypeCode.user,
          id: user.id,
          departmentId: user.departmentId,
        },
        newValue: {
          result: "INVITE_CREATED",
          tokenId: issue.tokenId,
          targetUserId: user.id,
          emailMasked: maskEmail(user.email),
          roleCodes: user.userRoles.map((role) => role.role.code),
          reasonProvided: Boolean(normalizeReason(dto.reason)),
        },
      });

      return {
        user,
        issue,
      };
    });

    const deliveryStatus = await this.deliverLifecycleToken(result.issue);
    return {
      userId: result.user.id,
      deliveryStatus,
    };
  }

  async resendInvite(actor: UserContext, userId: string): Promise<InviteIssueResult> {
    this.assertPermission(actor, PermissionCode.accountInvite);
    const user = await this.requireExistingUser(userId);
    this.assertPendingInviteUser(user);
    const emailHash = hashAccountLifecycleEmail(user.email);

    const issue = await this.repository.transaction(async (tx) => {
      const tokenIssue = await this.createLifecycleTokenInTransaction(tx, {
        actor,
        targetUser: user,
        purpose: AccountLifecycleTokenPurpose.INVITE_ACCEPT,
        emailHash,
        expiresAt: new Date(Date.now() + inviteTtlMs),
        reason: "INVITE_RESENT",
      });

      await this.auditService.recordEventInTransaction(tx, {
        actor: {
          userId: actor.userId,
          departmentId: actor.departmentId,
        },
        action: AuditActionCode.inviteResent,
        target: {
          type: AuditTargetTypeCode.user,
          id: user.id,
          departmentId: user.departmentId,
        },
        newValue: {
          result: "INVITE_RESENT",
          tokenId: tokenIssue.tokenId,
          targetUserId: user.id,
        },
      });

      return tokenIssue;
    });

    return {
      userId: user.id,
      deliveryStatus: await this.deliverLifecycleToken(issue),
    };
  }

  async requestAdminPasswordReset(
    actor: UserContext,
    userId: string,
    reason?: string | null,
  ): Promise<PasswordResetIssueResult> {
    this.assertPermission(actor, PermissionCode.accountResetPassword);
    const user = await this.requireExistingUser(userId);
    this.assertActiveUserForReset(user);
    const emailHash = hashAccountLifecycleEmail(user.email);

    const issue = await this.repository.transaction(async (tx) => {
      const tokenIssue = await this.createLifecycleTokenInTransaction(tx, {
        actor,
        targetUser: user,
        purpose: AccountLifecycleTokenPurpose.PASSWORD_RESET_ADMIN,
        emailHash,
        expiresAt: new Date(Date.now() + adminPasswordResetTtlMs),
        reason: normalizeReason(reason),
      });

      await this.auditService.recordEventInTransaction(tx, {
        actor: {
          userId: actor.userId,
          departmentId: actor.departmentId,
        },
        action: AuditActionCode.passwordResetRequestedAdmin,
        target: {
          type: AuditTargetTypeCode.user,
          id: user.id,
          departmentId: user.departmentId,
        },
        newValue: {
          result: "PASSWORD_RESET_REQUESTED_ADMIN",
          tokenId: tokenIssue.tokenId,
          targetUserId: user.id,
          reasonProvided: Boolean(normalizeReason(reason)),
        },
      });

      return tokenIssue;
    });

    return {
      userId: user.id,
      deliveryStatus: await this.deliverLifecycleToken(issue),
    };
  }

  async revokePasswordResetTokens(
    actor: UserContext,
    userId: string,
    reason?: string | null,
  ): Promise<{ revokedTokenCount: number }> {
    this.assertPermission(actor, PermissionCode.accountResetPassword);
    const user = await this.requireExistingUser(userId);
    const revokedAt = new Date();

    return this.repository.transaction(async (tx) => {
      const revoked = await this.repository.revokeActiveTokensInTransaction(tx, {
        targetUserId: user.id,
        purposes: [
          AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF,
          AccountLifecycleTokenPurpose.PASSWORD_RESET_ADMIN,
        ],
        revokedAt,
        revokedReason: normalizeReason(reason) ?? "PASSWORD_RESET_REVOKED",
      });

      await this.auditService.recordEventInTransaction(tx, {
        actor: {
          userId: actor.userId,
          departmentId: actor.departmentId,
        },
        action: AuditActionCode.passwordResetRevoked,
        target: {
          type: AuditTargetTypeCode.user,
          id: user.id,
          departmentId: user.departmentId,
        },
        newValue: {
          result: "PASSWORD_RESET_REVOKED",
          targetUserId: user.id,
          revokedTokenCount: revoked.count,
          reasonProvided: Boolean(normalizeReason(reason)),
        },
      });

      return { revokedTokenCount: revoked.count };
    });
  }

  private async requireExistingUser(userId: string): Promise<LifecycleUserRecord> {
    const user = await this.repository.findUserById(userId);
    if (!user || user.status === UserStatus.ARCHIVED) {
      throw new AccountLifecycleTargetNotFoundError();
    }

    return user;
  }

  private async issueTokenAndDeliver(input: {
    purpose: AccountLifecycleTokenPurpose;
    targetUser: LifecycleUserRecord;
    actor: UserContext | null;
    emailHash: string | null;
    expiresAt: Date;
    reason: string | null;
  }): Promise<AccountLifecycleDeliveryStatus> {
    const issue = await this.repository.transaction((tx) =>
      this.createLifecycleTokenInTransaction(tx, input),
    );

    return this.deliverLifecycleToken(issue);
  }

  private async createPendingUserInTransaction(
    tx: AccountLifecycleTransactionClient,
    actor: UserContext,
    dto: CreateInviteDto,
  ): Promise<LifecycleUserRecord> {
    const department = await this.repository.findActiveDepartmentById(tx, dto.departmentId);
    if (!department) {
      throw new AccountLifecycleTargetNotFoundError("Department was not found or is not active.");
    }

    const roleCodes = [...new Set(dto.roles.map((role) => role.roleCode))];
    const roles = await this.repository.findActiveRolesByCodes(tx, roleCodes);
    const rolesByCode = new Map(roles.map((role) => [role.code, role]));
    const missingRole = roleCodes.find((roleCode) => !rolesByCode.has(roleCode));
    if (missingRole) {
      throw new AccountLifecycleTargetNotFoundError(`Role was not found or is not active: ${missingRole}.`);
    }

    const scopedDepartmentIds = [
      ...new Set(
        dto.roles
          .filter((role) => role.scopeType === ScopeType.department)
          .map((role) => role.departmentId ?? dto.departmentId),
      ),
    ];
    for (const departmentId of scopedDepartmentIds) {
      const scopedDepartment = await this.repository.findActiveDepartmentById(tx, departmentId);
      if (!scopedDepartment) {
        throw new AccountLifecycleTargetNotFoundError("Role scope department was not found or is not active.");
      }
    }

    void actor;
    return this.repository.createPendingUserInTransaction(tx, {
      email: dto.email,
      name: dto.name.trim(),
      departmentId: dto.departmentId,
      roles: dto.roles.map((role) => {
        const roleRecord = rolesByCode.get(role.roleCode);
        if (!roleRecord) {
          throw new AccountLifecycleTargetNotFoundError(`Role was not found or is not active: ${role.roleCode}.`);
        }
        if (role.scopeType === ScopeType.department) {
          const departmentId = role.departmentId ?? dto.departmentId;
          return {
            roleId: roleRecord.id,
            scopeType: ScopeType.department,
            scopeKey: departmentId,
            departmentId,
          };
        }

        return {
          roleId: roleRecord.id,
          scopeType: ScopeType.global,
          scopeKey: "GLOBAL",
          departmentId: null,
        };
      }),
    });
  }

  private async createLifecycleTokenInTransaction(
    tx: AccountLifecycleTransactionClient,
    input: {
      actor: UserContext | null;
      targetUser: LifecycleUserRecord;
      purpose: AccountLifecycleTokenPurpose;
      emailHash: string | null;
      expiresAt: Date;
      reason: string | null;
    },
  ): Promise<LifecycleTokenIssue> {
    const now = new Date();
    await this.repository.revokeActiveTokensInTransaction(tx, {
      targetUserId: input.targetUser.id,
      purposes: [input.purpose],
      revokedAt: now,
      revokedReason: "REPLACED",
    });

    const rawToken = createAccountLifecycleToken();
    const tokenHash = hashAccountLifecycleToken(rawToken);
    const token = await this.repository.createTokenInTransaction(tx, {
      purpose: input.purpose,
      tokenHash,
      targetUserId: input.targetUser.id,
      emailHash: input.emailHash,
      expiresAt: input.expiresAt,
      createdByUserId: input.actor?.userId ?? null,
      deliveryChannel: AccountLifecycleDeliveryChannel.EMAIL,
      deliveryStatus: AccountLifecycleDeliveryStatus.PENDING,
      revokedReason: input.reason,
    });

    return {
      tokenId: token.id,
      rawToken,
      purpose: input.purpose,
      targetUserId: input.targetUser.id,
      emailHash: input.emailHash,
      recipientEmail: input.targetUser.email,
      expiresAt: input.expiresAt,
    };
  }

  private async deliverLifecycleToken(issue: LifecycleTokenIssue): Promise<AccountLifecycleDeliveryStatus> {
    const result = await this.mailer.enqueue({
      tokenId: issue.tokenId,
      template:
        issue.purpose === AccountLifecycleTokenPurpose.INVITE_ACCEPT
          ? "INVITE_ACCEPT"
          : "PASSWORD_RESET",
      purpose: issue.purpose,
      targetUserId: issue.targetUserId,
      emailHash: issue.emailHash,
      recipientEmail: issue.recipientEmail,
      expiresAt: issue.expiresAt,
      token: issue.rawToken,
    });

    await this.repository.transaction(async (tx) => {
      await this.repository.updateTokenDeliveryInTransaction(tx, issue.tokenId, {
        deliveryAdapter: result.adapter,
        deliveryStatus: result.deliveryStatus,
      });
    });

    return result.deliveryStatus;
  }

  private async findResetTokenInTransaction(
    tx: AccountLifecycleTransactionClient,
    tokenHash: string,
  ): Promise<LifecycleTokenRecord | null> {
    const selfToken = await this.repository.findTokenByHashInTransaction(
      tx,
      tokenHash,
      AccountLifecycleTokenPurpose.PASSWORD_RESET_SELF,
    );
    if (selfToken) {
      return selfToken;
    }

    return this.repository.findTokenByHashInTransaction(
      tx,
      tokenHash,
      AccountLifecycleTokenPurpose.PASSWORD_RESET_ADMIN,
    );
  }

  private assertConsumableToken(
    token: LifecycleTokenRecord | null,
    now: Date,
  ): asserts token is LifecycleTokenRecord {
    if (
      !token ||
      token.status !== AccountLifecycleTokenStatus.ACTIVE ||
      token.usedAt ||
      token.revokedAt ||
      token.expiresAt <= now
    ) {
      throw new AccountLifecycleInvalidTokenError();
    }
  }

  private requireTokenTarget(token: LifecycleTokenRecord): LifecycleUserRecord {
    if (!token.targetUser) {
      throw new AccountLifecycleInvalidTokenError();
    }

    return token.targetUser;
  }

  private assertActiveUserForReset(user: LifecycleUserRecord | null): asserts user is LifecycleUserRecord {
    if (!isPasswordResetEligible(user)) {
      throw new AccountLifecycleConflictError("User is not eligible for password reset.");
    }
  }

  private assertPendingInviteUser(user: LifecycleUserRecord): void {
    if (user.status !== UserStatus.PENDING_ACTIVATION) {
      throw new AccountLifecycleConflictError("User is not pending activation.");
    }
    this.assertActiveDepartmentAndRoles(user);
  }

  private assertActiveDepartmentAndRoles(user: LifecycleUserRecord): void {
    if (user.department.status !== "ACTIVE" || user.department.archivedAt) {
      throw new AccountLifecycleConflictError("User department is not active.");
    }
    if (user.userRoles.some((role) => role.role.status !== "ACTIVE" || role.role.archivedAt)) {
      throw new AccountLifecycleConflictError("User role is not active.");
    }
  }

  private assertPermission(context: UserContext, permission: PermissionCode): void {
    const decision = this.rbacPolicy.hasPermission(context, permission);
    if (decision.effect === "DENY") {
      throw new AccountLifecyclePermissionDeniedError(decision.reason);
    }
  }
}

type LifecycleTokenIssue = {
  tokenId: string;
  rawToken: string;
  purpose: AccountLifecycleTokenPurpose;
  targetUserId: string;
  emailHash: string | null;
  recipientEmail: string;
  expiresAt: Date;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeReason = (reason: string | null | undefined): string | null => {
  const normalized = reason?.trim();
  return normalized ? normalized : null;
};

const isPasswordResetEligible = (
  user: LifecycleUserRecord | null | undefined,
): user is LifecycleUserRecord =>
  Boolean(
    user &&
      user.status === UserStatus.ACTIVE &&
      user.credential &&
      user.credential.status === "ACTIVE" &&
      user.department.status === "ACTIVE" &&
      !user.department.archivedAt,
  );

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "[masked-email]";
  }

  return `${localPart.slice(0, 1)}***@${domainPart}`;
};
