import { Inject, Injectable } from "@nestjs/common";
import {
  CredentialStatus,
  DepartmentStatus,
  Prisma,
  RoleStatus,
  UserStatus,
} from "@prisma/client";
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

    return {
      items: rows.map(toAccountUserRecord),
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

    return row ? toAccountUserRecord(row) : null;
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
      id: true,
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
      targetUserId: true,
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

const toAccountUserRecord = (row: AccountUserRow) => ({
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
        sessionId: row.sessions[0].id,
        createdAt: row.sessions[0].createdAt,
        expiresAt: row.sessions[0].expiresAt,
        revokedAt: row.sessions[0].revokedAt,
        lastSeenAt: row.sessions[0].lastSeenAt,
      }
    : null,
  recentLifecycleDelivery: row.accountLifecycleTokens[0]
    ? {
        purpose: row.accountLifecycleTokens[0].purpose,
        tokenStatus: row.accountLifecycleTokens[0].status,
        deliveryChannel: row.accountLifecycleTokens[0].deliveryChannel,
        deliveryStatus: row.accountLifecycleTokens[0].deliveryStatus,
        deliveryAdapter: row.accountLifecycleTokens[0].deliveryAdapter,
        failureCategory: null,
        targetUserId: row.accountLifecycleTokens[0].targetUserId,
        maskedEmail: maskEmail(row.email),
        expiresAt: row.accountLifecycleTokens[0].expiresAt,
        usedAt: row.accountLifecycleTokens[0].usedAt,
        revokedAt: row.accountLifecycleTokens[0].revokedAt,
        createdAt: row.accountLifecycleTokens[0].createdAt,
        updatedAt: row.accountLifecycleTokens[0].updatedAt,
      }
    : null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

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

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) {
    return "[masked-email]";
  }

  return `${localPart.slice(0, 1)}***@${domainPart}`;
};
