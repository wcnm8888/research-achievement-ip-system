import { Inject, Injectable } from "@nestjs/common";
import {
  AccountLifecycleTokenPurpose,
  AccountLifecycleTokenStatus,
  CredentialStatus,
  DepartmentStatus,
  Prisma,
  RoleStatus,
  UserStatus,
} from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { PrismaService } from "../database/prisma.service";

export type AccountLifecycleTransactionClient = Pick<
  Prisma.TransactionClient,
  | "accountLifecycleToken"
  | "auditLog"
  | "department"
  | "role"
  | "user"
  | "userCredential"
  | "userRole"
  | "userSession"
>;

export type LifecycleUserRecord = Prisma.UserGetPayload<{
  include: {
    credential: true;
    department: true;
    userRoles: {
      include: {
        role: true;
      };
    };
  };
}>;

export type LifecycleTokenRecord = Prisma.AccountLifecycleTokenGetPayload<{
  include: {
    targetUser: {
      include: {
        credential: true;
        department: true;
        userRoles: {
          include: {
            role: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class AccountLifecycleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  transaction<T>(callback: (tx: AccountLifecycleTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => callback(tx as AccountLifecycleTransactionClient));
  }

  findUserByEmail(email: string): Promise<LifecycleUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: lifecycleUserInclude,
    });
  }

  findUserById(userId: string): Promise<LifecycleUserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: lifecycleUserInclude,
    });
  }

  findActiveDepartmentById(client: AccountLifecycleTransactionClient, departmentId: string) {
    return client.department.findFirst({
      where: {
        id: departmentId,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true },
    });
  }

  findActiveRolesByCodes(client: AccountLifecycleTransactionClient, roleCodes: readonly string[]) {
    return client.role.findMany({
      where: {
        code: { in: [...new Set(roleCodes)] },
        status: RoleStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true, code: true },
    });
  }

  createPendingUserInTransaction(
    client: AccountLifecycleTransactionClient,
    input: {
      email: string;
      name: string;
      departmentId: string;
      roles: {
        roleId: string;
        scopeType: "GLOBAL" | "DEPARTMENT";
        scopeKey: string;
        departmentId: string | null;
      }[];
    },
  ): Promise<LifecycleUserRecord> {
    return client.user.create({
      data: {
        email: input.email,
        name: input.name,
        departmentId: input.departmentId,
        status: UserStatus.PENDING_ACTIVATION,
        userRoles: {
          create: input.roles,
        },
      },
      include: lifecycleUserInclude,
    });
  }

  revokeActiveTokensInTransaction(
    client: AccountLifecycleTransactionClient,
    input: {
      targetUserId: string;
      purposes: readonly AccountLifecycleTokenPurpose[];
      revokedAt: Date;
      revokedReason: string;
    },
  ): Promise<{ count: number }> {
    return client.accountLifecycleToken.updateMany({
      where: {
        targetUserId: input.targetUserId,
        purpose: { in: [...input.purposes] },
        status: AccountLifecycleTokenStatus.ACTIVE,
        usedAt: null,
        revokedAt: null,
      },
      data: {
        status: AccountLifecycleTokenStatus.REVOKED,
        revokedAt: input.revokedAt,
        revokedReason: input.revokedReason,
      },
    });
  }

  createTokenInTransaction(
    client: AccountLifecycleTransactionClient,
    data: Prisma.AccountLifecycleTokenUncheckedCreateInput,
  ) {
    return client.accountLifecycleToken.create({ data });
  }

  updateTokenDeliveryInTransaction(
    client: AccountLifecycleTransactionClient,
    tokenId: string,
    data: Pick<Prisma.AccountLifecycleTokenUncheckedUpdateInput, "deliveryAdapter" | "deliveryStatus">,
  ) {
    return client.accountLifecycleToken.update({
      where: { id: tokenId },
      data,
    });
  }

  findTokenByHashInTransaction(
    client: AccountLifecycleTransactionClient,
    tokenHash: string,
    purpose: AccountLifecycleTokenPurpose,
  ): Promise<LifecycleTokenRecord | null> {
    return client.accountLifecycleToken.findUnique({
      where: { tokenHash },
      include: {
        targetUser: {
          include: lifecycleUserInclude,
        },
      },
    }).then((token) => (token?.purpose === purpose ? token : null));
  }

  markTokenUsedInTransaction(
    client: AccountLifecycleTransactionClient,
    tokenId: string,
    usedAt: Date,
  ) {
    return client.accountLifecycleToken.update({
      where: {
        id: tokenId,
      },
      data: {
        status: AccountLifecycleTokenStatus.USED,
        usedAt,
      },
    });
  }

  activatePendingUserInTransaction(
    client: AccountLifecycleTransactionClient,
    userId: string,
  ) {
    return client.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
      include: lifecycleUserInclude,
    });
  }

  upsertCredentialInTransaction(
    client: AccountLifecycleTransactionClient,
    input: {
      userId: string;
      passwordHash: string;
      passwordUpdatedAt: Date;
      mustChangePassword: boolean;
    },
  ) {
    return client.userCredential.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        passwordHash: input.passwordHash,
        passwordUpdatedAt: input.passwordUpdatedAt,
        status: CredentialStatus.ACTIVE,
        mustChangePassword: input.mustChangePassword,
      },
      update: {
        passwordHash: input.passwordHash,
        passwordUpdatedAt: input.passwordUpdatedAt,
        status: CredentialStatus.ACTIVE,
        mustChangePassword: input.mustChangePassword,
        disabledAt: null,
      },
    });
  }

  revokeSessionsInTransaction(
    client: AccountLifecycleTransactionClient,
    input: {
      userId: string;
      revokedAt: Date;
      revokedReason: string;
    },
  ): Promise<{ count: number }> {
    return client.userSession.updateMany({
      where: {
        userId: input.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: input.revokedAt,
        revokedReason: input.revokedReason,
      },
    });
  }
}

export const lifecycleUserInclude = {
  credential: true,
  department: true,
  userRoles: {
    where: {
      revokedAt: null,
    },
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;

export type AccountLifecycleAuditClient = AuditTransactionClient;
