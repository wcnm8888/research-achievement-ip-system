import { Inject, Injectable } from "@nestjs/common";
import { CredentialStatus, UserStatus } from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { hashPassword } from "../auth/auth-crypto";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { RbacPolicyService } from "../authorization/policy/rbac-policy.service";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  AccountManagementAccessDeniedError,
  AccountManagementConflictError,
  AccountManagementNotFoundError,
  AccountManagementPermissionDeniedError,
} from "./account-management.errors";
import {
  AccountManagementRepository,
  AccountManagementTransactionClient,
  AccountRoleRecord,
  AccountUserRecord,
} from "./account-management.repository";
import {
  AccountManagementReasonDto,
  AccountUserListQueryDto,
  AccountUserRoleDto,
  AssignAccountUserRoleDto,
  ChangeAccountUserDepartmentDto,
  CreateAccountUserDto,
} from "./dto/account-management.dto";

type CreateUserCredentialMode = "INITIAL_PASSWORD" | "NO_CREDENTIAL";
type AccountAuditOperation =
  | "USER_DISABLE"
  | "USER_ENABLE"
  | "USER_ROLE_ASSIGN"
  | "USER_ROLE_REVOKE"
  | "USER_DEPARTMENT_CHANGE";

@Injectable()
export class AccountManagementService {
  constructor(
    @Inject(AccountManagementRepository)
    private readonly repository: AccountManagementRepository,
    @Inject(RbacPolicyService)
    private readonly rbacPolicy: RbacPolicyService,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async listUsers(context: UserContext, query: AccountUserListQueryDto = {}) {
    this.assertCanManageAccounts(context);

    return this.repository.findMany({
      keyword: query.keyword?.trim(),
      status: query.status,
      departmentId: query.departmentId,
      roleCode: query.roleCode,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async getUser(context: UserContext, userId: string): Promise<AccountUserRecord> {
    this.assertCanManageAccounts(context);

    const user = await this.repository.findById(userId);
    if (!user) {
      throw new AccountManagementNotFoundError("User was not found.");
    }

    return user;
  }

  async createUser(
    context: UserContext,
    dto: CreateAccountUserDto,
  ): Promise<AccountUserRecord> {
    this.assertCanManageAccounts(context);

    const normalizedEmail = normalizeEmail(dto.email);
    const name = dto.name.trim();
    const department = await this.repository.findActiveDepartmentById(dto.departmentId);
    if (!department) {
      throw new AccountManagementNotFoundError("Department was not found or is not active.");
    }

    const roleCodes = [...new Set(dto.roles.map((role) => role.roleCode))];
    const roles = await this.repository.findActiveRolesByCodes(roleCodes);
    const rolesByCode = new Map(roles.map((role) => [role.code, role]));
    const missingRoleCode = roleCodes.find((roleCode) => !rolesByCode.has(roleCode));
    if (missingRoleCode) {
      throw new AccountManagementNotFoundError(`Role was not found or is not active: ${missingRoleCode}.`);
    }

    const scopedDepartmentIds = [
      ...new Set(
        dto.roles
          .filter((role) => role.scopeType === ScopeType.department)
          .map((role) => role.departmentId ?? dto.departmentId),
      ),
    ];
    const scopedDepartments = await this.repository.findActiveDepartmentsByIds(scopedDepartmentIds);
    const activeScopedDepartmentIds = new Set(scopedDepartments.map((item) => item.id));
    const missingScopedDepartmentId = scopedDepartmentIds.find(
      (departmentId) => !activeScopedDepartmentIds.has(departmentId),
    );
    if (missingScopedDepartmentId) {
      throw new AccountManagementNotFoundError(
        "Role scope department was not found or is not active.",
      );
    }

    const credentialMode: CreateUserCredentialMode = dto.initialPassword
      ? "INITIAL_PASSWORD"
      : "NO_CREDENTIAL";
    const passwordHash = dto.initialPassword
      ? await hashPassword(dto.initialPassword)
      : null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const accountClient = tx as AccountManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const user = await this.repository.createUserInTransaction(accountClient, {
          email: normalizedEmail,
          name,
          departmentId: dto.departmentId,
          credential: passwordHash
            ? {
                passwordHash,
                passwordUpdatedAt: new Date(),
                status: CredentialStatus.ACTIVE,
                mustChangePassword: true,
              }
            : null,
          roles: dto.roles.map((requestedRole) =>
            toUserRoleCreateInput(requestedRole, rolesByCode, dto.departmentId),
          ),
        });

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toUserCreateAuditEvent(context, user, credentialMode),
        );

        return user;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async disableUser(
    context: UserContext,
    userId: string,
    dto: AccountManagementReasonDto = {},
  ): Promise<{ user: AccountUserRecord; revokedSessionCount: number }> {
    this.assertCanManageAccounts(context);
    const current = await this.requireExistingMutableUser(userId);
    const now = new Date();
    const reason = normalizeReason(dto.reason);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const accountClient = tx as AccountManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const user = await this.repository.updateUserStatusInTransaction(
          accountClient,
          userId,
          UserStatus.DISABLED,
        );
        await this.repository.disableCredentialInTransaction(accountClient, userId, now);
        const revokedSessionCount = await this.repository.revokeSessionsInTransaction(
          accountClient,
          userId,
          now,
          "ACCOUNT_DISABLED",
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toUserUpdateAuditEvent(context, user, "USER_DISABLE", {
            oldStatus: current.status,
            newStatus: UserStatus.DISABLED,
            reason,
            revokedSessionCount,
          }),
        );

        return { user, revokedSessionCount };
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async enableUser(
    context: UserContext,
    userId: string,
    dto: AccountManagementReasonDto = {},
  ): Promise<AccountUserRecord> {
    this.assertCanManageAccounts(context);
    const current = await this.requireExistingMutableUser(userId);
    const reason = normalizeReason(dto.reason);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const accountClient = tx as AccountManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const user = await this.repository.updateUserStatusInTransaction(
          accountClient,
          userId,
          UserStatus.ACTIVE,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toUserUpdateAuditEvent(context, user, "USER_ENABLE", {
            oldStatus: current.status,
            newStatus: UserStatus.ACTIVE,
            reason,
            credentialRestorePolicy: "USER_STATUS_ONLY",
          }),
        );

        return user;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async assignUserRole(
    context: UserContext,
    userId: string,
    dto: AssignAccountUserRoleDto,
  ): Promise<{ user: AccountUserRecord; userRoleId: string }> {
    this.assertCanManageAccounts(context);
    await this.requireActiveUser(userId);
    const role = await this.requireActiveRole(dto.roleCode);
    const scope = await this.resolveRoleScope(dto);
    const existing = await this.repository.findUserRoleByAssignment({
      userId,
      roleId: role.id,
      scopeType: scope.scopeType,
      scopeKey: scope.scopeKey,
    });

    if (existing?.revokedAt === null) {
      throw new AccountManagementConflictError("User role assignment already exists.");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const accountClient = tx as AccountManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const result = await this.repository.assignUserRoleInTransaction(
          accountClient,
          {
            userId,
            roleId: role.id,
            scopeType: scope.scopeType,
            scopeKey: scope.scopeKey,
            departmentId: scope.departmentId,
            existingUserRoleId: existing?.id,
          },
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toUserUpdateAuditEvent(context, result.user, "USER_ROLE_ASSIGN", {
            userRoleId: result.userRoleId,
            roleCode: role.code,
            scopeType: scope.scopeType,
            departmentId: scope.departmentId,
            reason: normalizeReason(dto.reason),
            assignmentMode: existing ? "REACTIVATED" : "CREATED",
          }),
        );

        return result;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async revokeUserRole(
    context: UserContext,
    userId: string,
    userRoleId: string,
    dto: AccountManagementReasonDto = {},
  ): Promise<AccountUserRecord> {
    this.assertCanManageAccounts(context);
    await this.requireExistingMutableUser(userId);
    const currentRole = await this.repository.findActiveUserRoleById(userId, userRoleId);
    if (!currentRole) {
      throw new AccountManagementNotFoundError("Active user role was not found.");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const accountClient = tx as AccountManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const user = await this.repository.revokeUserRoleInTransaction(
          accountClient,
          userId,
          userRoleId,
          new Date(),
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toUserUpdateAuditEvent(context, user, "USER_ROLE_REVOKE", {
            userRoleId,
            roleCode: currentRole.role.code,
            scopeType: currentRole.scopeType,
            departmentId: currentRole.departmentId,
            reason: normalizeReason(dto.reason),
          }),
        );

        return user;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  async changeUserDepartment(
    context: UserContext,
    userId: string,
    dto: ChangeAccountUserDepartmentDto,
  ): Promise<AccountUserRecord> {
    this.assertCanManageAccounts(context);
    const current = await this.requireExistingMutableUser(userId);
    const department = await this.repository.findActiveDepartmentById(dto.departmentId);
    if (!department) {
      throw new AccountManagementNotFoundError("Department was not found or is not active.");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const accountClient = tx as AccountManagementTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const user = await this.repository.changeUserDepartmentInTransaction(
          accountClient,
          userId,
          dto.departmentId,
        );

        await this.auditService.recordEventInTransaction(
          auditClient,
          this.toUserUpdateAuditEvent(context, user, "USER_DEPARTMENT_CHANGE", {
            oldDepartmentId: current.department.id,
            newDepartmentId: department.id,
            reason: normalizeReason(dto.reason),
            scopeMigration: "NONE",
          }),
        );

        return user;
      });
    } catch (error) {
      throw this.mapRepositoryError(error);
    }
  }

  private assertCanManageAccounts(context: UserContext | null | undefined): void {
    if (!context?.userId || !context.departmentId) {
      throw new AccountManagementAccessDeniedError();
    }

    const decision = this.rbacPolicy.hasPermission(context, PermissionCode.systemConfig);
    if (decision.effect === "DENY") {
      throw new AccountManagementPermissionDeniedError(PermissionCode.systemConfig);
    }
  }

  private mapRepositoryError(error: unknown): Error {
    if (this.repository.isPrismaUniqueConflict(error)) {
      return new AccountManagementConflictError("User email already exists.");
    }

    if (this.repository.isPrismaRecordNotFound(error)) {
      return new AccountManagementNotFoundError("Account management resource was not found.");
    }

    return error instanceof Error
      ? error
      : new Error("Unknown account management service error.");
  }

  private async requireExistingMutableUser(userId: string): Promise<AccountUserRecord> {
    const user = await this.repository.findById(userId);
    if (!user || user.status === UserStatus.ARCHIVED) {
      throw new AccountManagementNotFoundError("User was not found.");
    }

    return user;
  }

  private async requireActiveUser(userId: string): Promise<AccountUserRecord> {
    const user = await this.requireExistingMutableUser(userId);
    if (user.status !== UserStatus.ACTIVE) {
      throw new AccountManagementConflictError("User must be active for this operation.");
    }

    return user;
  }

  private async requireActiveRole(roleCode: string): Promise<AccountRoleRecord> {
    const roles = await this.repository.findActiveRolesByCodes([roleCode]);
    const role = roles[0];
    if (!role) {
      throw new AccountManagementNotFoundError(`Role was not found or is not active: ${roleCode}.`);
    }

    return role;
  }

  private async resolveRoleScope(dto: AssignAccountUserRoleDto): Promise<{
    scopeType: "GLOBAL" | "DEPARTMENT";
    scopeKey: string;
    departmentId: string | null;
  }> {
    if (dto.scopeType === ScopeType.global) {
      return {
        scopeType: ScopeType.global,
        scopeKey: "GLOBAL",
        departmentId: null,
      };
    }

    if (!dto.departmentId) {
      throw new AccountManagementNotFoundError("Role scope department is required.");
    }

    const department = await this.repository.findActiveDepartmentById(dto.departmentId);
    if (!department) {
      throw new AccountManagementNotFoundError(
        "Role scope department was not found or is not active.",
      );
    }

    return {
      scopeType: ScopeType.department,
      scopeKey: department.id,
      departmentId: department.id,
    };
  }

  private toUserCreateAuditEvent(
    context: UserContext,
    user: AccountUserRecord,
    credentialMode: CreateUserCredentialMode,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.create,
      target: {
        type: AuditTargetTypeCode.user,
        id: user.id,
        departmentId: user.department.id,
      },
      oldValue: null,
      newValue: {
        targetUserId: user.id,
        departmentId: user.department.id,
        emailMasked: maskEmail(user.email),
        roleCodes: user.roles.map((role) => role.role.code),
        credentialMode,
      },
    };
  }

  private toUserUpdateAuditEvent(
    context: UserContext,
    user: AccountUserRecord,
    operation: AccountAuditOperation,
    metadata: Record<string, unknown>,
  ): CreateAuditEventInput {
    return {
      actor: {
        userId: context.userId,
        departmentId: context.departmentId,
      },
      action: AuditActionCode.update,
      target: {
        type: AuditTargetTypeCode.user,
        id: user.id,
        departmentId: user.department.id,
      },
      oldValue: null,
      newValue: {
        operation,
        targetUserId: user.id,
        departmentId: user.department.id,
        ...metadata,
      },
    };
  }
}

const toUserRoleCreateInput = (
  requestedRole: AccountUserRoleDto,
  rolesByCode: ReadonlyMap<string, AccountRoleRecord>,
  defaultDepartmentId: string,
) => {
  const role = rolesByCode.get(requestedRole.roleCode);
  if (!role) {
    throw new AccountManagementNotFoundError(
      `Role was not found or is not active: ${requestedRole.roleCode}.`,
    );
  }

  if (requestedRole.scopeType === ScopeType.department) {
    const departmentId = requestedRole.departmentId ?? defaultDepartmentId;

    return {
      roleId: role.id,
      scopeType: ScopeType.department,
      scopeKey: departmentId,
      departmentId,
    };
  }

  return {
    roleId: role.id,
    scopeType: ScopeType.global,
    scopeKey: "GLOBAL",
    departmentId: null,
  };
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizeReason = (reason: string | null | undefined): string | null => {
  const normalized = reason?.trim();
  return normalized ? normalized : null;
};

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "[masked-email]";
  }

  const localPrefix = localPart.slice(0, 1);
  return `${localPrefix}***@${domainPart}`;
};
