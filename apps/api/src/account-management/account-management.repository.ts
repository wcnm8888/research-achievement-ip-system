import { Inject, Injectable } from "@nestjs/common";
import {
  CredentialStatus,
  DepartmentStatus,
  Prisma,
  RoleStatus,
  UserStatus,
} from "@prisma/client";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PrismaService } from "../database/prisma.service";

const defaultPage = 1;
const defaultPageSize = 20;

export type AccountUserListInput = {
  keyword?: string;
  status?: string;
  departmentId?: string;
  roleCode?: string;
  page?: number;
  pageSize?: number;
};

export type CreateAccountUserInput = {
  email: string;
  name: string;
  departmentId: string;
  credential?: {
    passwordHash: string;
    passwordUpdatedAt: Date;
    status: CredentialStatus;
    mustChangePassword: boolean;
  } | null;
  roles: {
    roleId: string;
    scopeType: "GLOBAL" | "DEPARTMENT";
    scopeKey: string;
    departmentId: string | null;
  }[];
};

export type AccountManagementTransactionClient = Pick<
  Prisma.TransactionClient,
  "user" | "userCredential" | "userRole" | "userSession"
>;

export type AccountDepartmentRecord = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type AccountRoleRecord = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type AccountUserRecord = ReturnType<typeof toAccountUserRecord>;

export type AccountUserRoleAssignmentRecord = {
  id: string;
  revokedAt: Date | null;
  role: AccountRoleRecord;
  scopeType: "GLOBAL" | "DEPARTMENT";
  scopeKey: string;
  departmentId: string | null;
};

type AccountLoginEligibilityReasonCode =
  | "ACTIVE_CREDENTIAL"
  | "PENDING_ACTIVATION"
  | "USER_DISABLED"
  | "USER_ARCHIVED"
  | "NO_CREDENTIAL"
  | "CREDENTIAL_DISABLED";

type AccountLoginEligibility = {
  canLogin: boolean;
  reasonCode: AccountLoginEligibilityReasonCode;
  reasonLabel: string;
  blockingFactors: string[];
};

type AccountLifecycleActionSummary = {
  latestActionAt: Date | null;
  disabledCount: number;
  enabledCount: number;
  inviteCreatedCount: number;
  inviteResentCount: number;
  resetRequestedCount: number;
  resetRevokedCount: number;
  latestDeliveryStatus: string | null;
  latestDeliveryAdapter: string | null;
  caveats: string[];
};

type AccountRoleChangeAuditSummary = {
  latestRoleChangeAt: Date | null;
  assignedCount: number;
  revokedCount: number;
  recentRoleChanges: {
    operation: "USER_ROLE_ASSIGN" | "USER_ROLE_REVOKE";
    roleCode: string;
    scopeType: "GLOBAL" | "DEPARTMENT";
    departmentId: string | null;
    reasonProvided: boolean;
    createdAt: Date;
  }[];
};

type AccountAuditSummaries = {
  lifecycleActionSummary: AccountLifecycleActionSummary;
  roleChangeAuditSummary: AccountRoleChangeAuditSummary;
};

@Injectable()
export class AccountManagementRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(input: AccountUserListInput): Promise<{
    items: AccountUserRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = input.page ?? defaultPage;
    const pageSize = input.pageSize ?? defaultPageSize;
    const where = toUserFindManyWhere(input);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: accountUserSelect,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    const auditSummariesByUserId = await this.findAuditSummariesForUsers(
      rows.map((row) => row.id),
    );

    return {
      items: rows.map((row) =>
        toAccountUserRecord(row, auditSummariesByUserId.get(row.id)),
      ),
      total,
      page,
      pageSize,
    };
  }

  async findById(userId: string): Promise<AccountUserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: accountUserSelect,
    });

    if (!row) {
      return null;
    }

    const auditSummariesByUserId = await this.findAuditSummariesForUsers([row.id]);
    return toAccountUserRecord(row, auditSummariesByUserId.get(row.id));
  }

  async findActiveDepartmentById(
    departmentId: string,
  ): Promise<AccountDepartmentRecord | null> {
    const row = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: accountDepartmentSelect,
    });

    return row;
  }

  async findActiveDepartmentsByIds(
    departmentIds: readonly string[],
  ): Promise<AccountDepartmentRecord[]> {
    if (departmentIds.length === 0) {
      return [];
    }

    return this.prisma.department.findMany({
      where: {
        id: { in: [...new Set(departmentIds)] },
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: accountDepartmentSelect,
    });
  }

  async findActiveRolesByCodes(roleCodes: readonly string[]): Promise<AccountRoleRecord[]> {
    if (roleCodes.length === 0) {
      return [];
    }

    return this.prisma.role.findMany({
      where: {
        code: { in: [...new Set(roleCodes)] },
        status: RoleStatus.ACTIVE,
        archivedAt: null,
      },
      select: accountRoleSelect,
    });
  }

  async createUserInTransaction(
    client: AccountManagementTransactionClient,
    input: CreateAccountUserInput,
  ): Promise<AccountUserRecord> {
    const row = await client.user.create({
      data: {
        email: input.email,
        name: input.name,
        departmentId: input.departmentId,
        ...(input.credential
          ? {
              credential: {
                create: input.credential,
              },
            }
          : {}),
        userRoles: {
          create: input.roles.map((role) => ({
            roleId: role.roleId,
            scopeType: role.scopeType,
            scopeKey: role.scopeKey,
            departmentId: role.departmentId,
          })),
        },
      },
      select: accountUserSelect,
    });

    return toAccountUserRecord(row);
  }

  async updateUserStatusInTransaction(
    client: AccountManagementTransactionClient,
    userId: string,
    status: UserStatus,
  ): Promise<AccountUserRecord> {
    const row = await client.user.update({
      where: { id: userId },
      data: { status },
      select: accountUserSelect,
    });

    return toAccountUserRecord(row);
  }

  async disableCredentialInTransaction(
    client: AccountManagementTransactionClient,
    userId: string,
    disabledAt: Date,
  ): Promise<number> {
    const result = await client.userCredential.updateMany({
      where: {
        userId,
        status: CredentialStatus.ACTIVE,
      },
      data: {
        status: CredentialStatus.DISABLED,
        disabledAt,
      },
    });

    return result.count;
  }

  async revokeSessionsInTransaction(
    client: AccountManagementTransactionClient,
    userId: string,
    revokedAt: Date,
    revokedReason: string,
  ): Promise<number> {
    const result = await client.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt,
        revokedReason,
      },
    });

    return result.count;
  }

  async findUserRoleByAssignment(input: {
    userId: string;
    roleId: string;
    scopeType: "GLOBAL" | "DEPARTMENT";
    scopeKey: string;
  }): Promise<AccountUserRoleAssignmentRecord | null> {
    const row = await this.prisma.userRole.findFirst({
      where: {
        userId: input.userId,
        roleId: input.roleId,
        scopeType: input.scopeType,
        scopeKey: input.scopeKey,
      },
      select: accountUserRoleAssignmentSelect,
    });

    return row;
  }

  async assignUserRoleInTransaction(
    client: AccountManagementTransactionClient,
    input: {
      userId: string;
      roleId: string;
      scopeType: "GLOBAL" | "DEPARTMENT";
      scopeKey: string;
      departmentId: string | null;
      existingUserRoleId?: string;
    },
  ): Promise<{ userRoleId: string; user: AccountUserRecord }> {
    const userRole = input.existingUserRoleId
      ? await client.userRole.update({
          where: { id: input.existingUserRoleId },
          data: { revokedAt: null },
          select: { id: true },
        })
      : await client.userRole.create({
          data: {
            userId: input.userId,
            roleId: input.roleId,
            scopeType: input.scopeType,
            scopeKey: input.scopeKey,
            departmentId: input.departmentId,
          },
          select: { id: true },
        });

    return {
      userRoleId: userRole.id,
      user: await this.findByIdInTransaction(client, input.userId),
    };
  }

  async findActiveUserRoleById(
    userId: string,
    userRoleId: string,
  ): Promise<AccountUserRoleAssignmentRecord | null> {
    const row = await this.prisma.userRole.findFirst({
      where: {
        id: userRoleId,
        userId,
        revokedAt: null,
      },
      select: accountUserRoleAssignmentSelect,
    });

    return row;
  }

  async revokeUserRoleInTransaction(
    client: AccountManagementTransactionClient,
    userId: string,
    userRoleId: string,
    revokedAt: Date,
  ): Promise<AccountUserRecord> {
    await client.userRole.update({
      where: { id: userRoleId },
      data: { revokedAt },
    });

    return this.findByIdInTransaction(client, userId);
  }

  async changeUserDepartmentInTransaction(
    client: AccountManagementTransactionClient,
    userId: string,
    departmentId: string,
  ): Promise<AccountUserRecord> {
    const row = await client.user.update({
      where: { id: userId },
      data: { departmentId },
      select: accountUserSelect,
    });

    return toAccountUserRecord(row);
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }

  isPrismaRecordNotFound(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2025";
  }

  private async findByIdInTransaction(
    client: AccountManagementTransactionClient,
    userId: string,
  ): Promise<AccountUserRecord> {
    const row = await client.user.findUniqueOrThrow({
      where: { id: userId },
      select: accountUserSelect,
    });

    return toAccountUserRecord(row);
  }

  private async findAuditSummariesForUsers(
    userIds: readonly string[],
  ): Promise<Map<string, AccountAuditSummaries>> {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.auditLog.findMany({
      where: {
        targetType: AuditTargetTypeCode.user,
        targetId: { in: uniqueUserIds },
      },
      select: accountAuditSummarySelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const rowsByUserId = new Map<string, AccountAuditSummaryRow[]>();
    for (const row of rows) {
      if (!row.targetId) {
        continue;
      }

      rowsByUserId.set(row.targetId, [...(rowsByUserId.get(row.targetId) ?? []), row]);
    }

    return new Map(
      uniqueUserIds.map((userId) => [
        userId,
        buildAuditSummaries(rowsByUserId.get(userId) ?? []),
      ]),
    );
  }
}

const accountDepartmentSelect = {
  id: true,
  code: true,
  name: true,
  status: true,
} satisfies Prisma.DepartmentSelect;

const accountRoleSelect = {
  id: true,
  code: true,
  name: true,
  status: true,
} satisfies Prisma.RoleSelect;

const accountUserSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: accountDepartmentSelect,
  },
  credential: {
    select: {
      status: true,
      passwordUpdatedAt: true,
      mustChangePassword: true,
      disabledAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  userRoles: {
    where: {
      revokedAt: null,
    },
    select: {
      id: true,
      scopeType: true,
      scopeKey: true,
      departmentId: true,
      createdAt: true,
      role: {
        select: accountRoleSelect,
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  },
  sessions: {
    select: {
      createdAt: true,
      expiresAt: true,
      revokedAt: true,
      lastSeenAt: true,
    },
    orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    take: 1,
  },
  accountLifecycleTokens: {
    select: {
      purpose: true,
      status: true,
      deliveryChannel: true,
      deliveryStatus: true,
      deliveryAdapter: true,
      expiresAt: true,
      usedAt: true,
      revokedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 1,
  },
} satisfies Prisma.UserSelect;

const accountAuditSummarySelect = {
  targetId: true,
  action: true,
  newValue: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

const accountUserRoleAssignmentSelect = {
  id: true,
  revokedAt: true,
  scopeType: true,
  scopeKey: true,
  departmentId: true,
  role: {
    select: accountRoleSelect,
  },
} satisfies Prisma.UserRoleSelect;

type AccountUserRow = Prisma.UserGetPayload<{ select: typeof accountUserSelect }>;
type AccountAuditSummaryRow = Prisma.AuditLogGetPayload<{
  select: typeof accountAuditSummarySelect;
}>;

const toAccountUserRecord = (
  row: AccountUserRow,
  auditSummaries?: AccountAuditSummaries,
) => {
  const recentDelivery = row.accountLifecycleTokens[0] ?? null;
  const lifecycleActionSummary =
    auditSummaries?.lifecycleActionSummary ??
    buildLifecycleActionSummary([], recentDelivery);

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    department: row.department,
    roles: row.userRoles.map((userRole) => ({
      id: userRole.id,
      role: userRole.role,
      scopeType: userRole.scopeType,
      scopeKey: userRole.scopeKey,
      departmentId: userRole.departmentId,
      createdAt: userRole.createdAt,
    })),
    credential: row.credential
      ? {
          status: row.credential.status,
          passwordUpdatedAt: row.credential.passwordUpdatedAt,
          mustChangePassword: row.credential.mustChangePassword,
          disabledAt: row.credential.disabledAt,
          createdAt: row.credential.createdAt,
          updatedAt: row.credential.updatedAt,
        }
      : null,
    lastLogin: row.sessions[0]
      ? {
          createdAt: row.sessions[0].createdAt,
          expiresAt: row.sessions[0].expiresAt,
          revokedAt: row.sessions[0].revokedAt,
          lastSeenAt: row.sessions[0].lastSeenAt,
        }
      : null,
    recentLifecycleDelivery: recentDelivery
      ? {
          purpose: recentDelivery.purpose,
          tokenStatus: recentDelivery.status,
          deliveryChannel: recentDelivery.deliveryChannel,
          deliveryStatus: recentDelivery.deliveryStatus,
          deliveryAdapter: recentDelivery.deliveryAdapter,
          failureCategory: null,
          maskedEmail: maskEmail(row.email),
          expiresAt: recentDelivery.expiresAt,
          usedAt: recentDelivery.usedAt,
          revokedAt: recentDelivery.revokedAt,
          createdAt: recentDelivery.createdAt,
          updatedAt: recentDelivery.updatedAt,
        }
      : null,
    loginEligibility: buildLoginEligibility(row.status, row.credential?.status ?? null),
    lifecycleActionSummary: {
      ...lifecycleActionSummary,
      latestDeliveryStatus:
        recentDelivery?.deliveryStatus ?? lifecycleActionSummary.latestDeliveryStatus,
      latestDeliveryAdapter:
        recentDelivery?.deliveryAdapter ?? lifecycleActionSummary.latestDeliveryAdapter,
    },
    roleChangeAuditSummary:
      auditSummaries?.roleChangeAuditSummary ?? buildRoleChangeAuditSummary([]),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const toUserFindManyWhere = (input: AccountUserListInput): Prisma.UserWhereInput => ({
  ...(input.keyword
    ? {
        OR: [
          { email: { contains: input.keyword, mode: "insensitive" } },
          { name: { contains: input.keyword, mode: "insensitive" } },
        ],
      }
    : {}),
  ...(input.status ? { status: input.status as Prisma.EnumUserStatusFilter } : {}),
  ...(input.departmentId ? { departmentId: input.departmentId } : {}),
  ...(input.roleCode
    ? {
        userRoles: {
          some: {
            revokedAt: null,
            role: {
              code: input.roleCode,
              status: RoleStatus.ACTIVE,
            },
          },
        },
      }
    : {}),
});

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};

const buildLoginEligibility = (
  userStatus: UserStatus,
  credentialStatus: CredentialStatus | null,
): AccountLoginEligibility => {
  if (userStatus === UserStatus.PENDING_ACTIVATION) {
    return {
      canLogin: false,
      reasonCode: "PENDING_ACTIVATION",
      reasonLabel: "Pending activation; invite acceptance is required.",
      blockingFactors: ["USER_PENDING_ACTIVATION", "CREDENTIAL_NOT_ACTIVE"],
    };
  }

  if (userStatus === UserStatus.DISABLED) {
    return {
      canLogin: false,
      reasonCode: "USER_DISABLED",
      reasonLabel: "User status is disabled.",
      blockingFactors: ["USER_DISABLED"],
    };
  }

  if (userStatus === UserStatus.ARCHIVED) {
    return {
      canLogin: false,
      reasonCode: "USER_ARCHIVED",
      reasonLabel: "User is archived.",
      blockingFactors: ["USER_ARCHIVED"],
    };
  }

  if (!credentialStatus) {
    return {
      canLogin: false,
      reasonCode: "NO_CREDENTIAL",
      reasonLabel: "Active user has no local credential.",
      blockingFactors: ["NO_CREDENTIAL"],
    };
  }

  if (credentialStatus !== CredentialStatus.ACTIVE) {
    return {
      canLogin: false,
      reasonCode: "CREDENTIAL_DISABLED",
      reasonLabel: "Local credential is disabled.",
      blockingFactors: ["CREDENTIAL_DISABLED"],
    };
  }

  return {
    canLogin: true,
    reasonCode: "ACTIVE_CREDENTIAL",
    reasonLabel: "User and credential are active.",
    blockingFactors: [],
  };
};

const buildAuditSummaries = (rows: readonly AccountAuditSummaryRow[]): AccountAuditSummaries => ({
  lifecycleActionSummary: buildLifecycleActionSummary(rows, null),
  roleChangeAuditSummary: buildRoleChangeAuditSummary(rows),
});

const buildLifecycleActionSummary = (
  rows: readonly AccountAuditSummaryRow[],
  recentDelivery: AccountUserRow["accountLifecycleTokens"][number] | null,
): AccountLifecycleActionSummary => {
  const operations = rows.map((row) => ({
    operation: getAuditOperation(row),
    createdAt: row.createdAt,
  }));

  return {
    latestActionAt: operations[0]?.createdAt ?? null,
    disabledCount: countOperations(operations, ["USER_DISABLE"]),
    enabledCount: countOperations(operations, ["USER_ENABLE"]),
    inviteCreatedCount: countOperations(operations, ["INVITE_CREATED"]),
    inviteResentCount: countOperations(operations, ["INVITE_RESENT"]),
    resetRequestedCount: countOperations(operations, [
      "PASSWORD_RESET_REQUESTED_ADMIN",
      "PASSWORD_RESET_REQUESTED_SELF",
    ]),
    resetRevokedCount: countOperations(operations, ["PASSWORD_RESET_REVOKED"]),
    latestDeliveryStatus: recentDelivery?.deliveryStatus ?? null,
    latestDeliveryAdapter: recentDelivery?.deliveryAdapter ?? null,
    caveats: [
      "AUDIT_SUMMARY_DERIVED_FROM_SAFE_OPERATION_CODES",
      "DELIVERY_FAILURE_CATEGORY_NOT_PERSISTED",
    ],
  };
};

const buildRoleChangeAuditSummary = (
  rows: readonly AccountAuditSummaryRow[],
): AccountRoleChangeAuditSummary => {
  const roleRows = rows
    .map((row) => {
      const newValue = toRecord(row.newValue);
      const operation = getAuditOperation(row);
      if (operation !== "USER_ROLE_ASSIGN" && operation !== "USER_ROLE_REVOKE") {
        return null;
      }

      const roleCode = getStringValue(newValue, "roleCode");
      const scopeType = getStringValue(newValue, "scopeType");
      if (!roleCode || (scopeType !== "GLOBAL" && scopeType !== "DEPARTMENT")) {
        return null;
      }

      return {
        operation,
        roleCode,
        scopeType,
        departmentId: getStringValue(newValue, "departmentId"),
        reasonProvided:
          getBooleanValue(newValue, "reasonProvided") ??
          Boolean(getStringValue(newValue, "reason")),
        createdAt: row.createdAt,
      };
    })
    .filter((row): row is AccountRoleChangeAuditSummary["recentRoleChanges"][number] =>
      Boolean(row),
    );

  return {
    latestRoleChangeAt: roleRows[0]?.createdAt ?? null,
    assignedCount: roleRows.filter((row) => row.operation === "USER_ROLE_ASSIGN").length,
    revokedCount: roleRows.filter((row) => row.operation === "USER_ROLE_REVOKE").length,
    recentRoleChanges: roleRows.slice(0, 5),
  };
};

const countOperations = (
  operations: readonly { operation: string | null }[],
  expected: readonly string[],
): number =>
  operations.filter((item) => item.operation && expected.includes(item.operation)).length;

const getAuditOperation = (row: AccountAuditSummaryRow): string | null => {
  const newValue = toRecord(row.newValue);
  return (
    getStringValue(newValue, "operation") ??
    getStringValue(newValue, "result") ??
    row.action
  );
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const getStringValue = (
  source: Record<string, unknown>,
  key: string,
): string | null => {
  const value = source[key];
  return typeof value === "string" ? value : null;
};

const getBooleanValue = (
  source: Record<string, unknown>,
  key: string,
): boolean | null => {
  const value = source[key];
  return typeof value === "boolean" ? value : null;
};

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "[masked-email]";
  }

  return `${localPart.slice(0, 1)}***@${domainPart}`;
};
