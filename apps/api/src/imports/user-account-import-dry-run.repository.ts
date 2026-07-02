import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus, Prisma, RoleStatus, UserStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

export type UserAccountImportDepartmentLookup = {
  id: string;
  code: string;
};

export type UserAccountImportRoleLookup = {
  id: string;
  code: string;
};

export type UserAccountImportUserLookup = {
  id: string;
  email: string;
  status: UserStatus;
  userRoles: {
    revokedAt: Date | null;
    scopeType: "GLOBAL" | "DEPARTMENT";
    scopeKey: string;
    departmentId: string | null;
    role: {
      id: string;
      code: string;
    };
  }[];
};

export type UserAccountImportEmployeeNoLookup = {
  id: string;
  employeeNoNormalized: string | null;
};

export type UserAccountImportApplyDepartmentLookup = {
  id: string;
  code: string;
  status: DepartmentStatus;
  archivedAt: Date | null;
};

export type UserAccountImportApplyRoleLookup = {
  id: string;
  code: string;
  status: RoleStatus;
  archivedAt: Date | null;
};

export type UserAccountImportApplyUserLookup = {
  id: string;
  email: string;
  employeeNoNormalized: string | null;
};

export type UserAccountImportCreateUserInput = {
  email: string;
  employeeNo: string | null;
  employeeNoNormalized: string | null;
  name: string;
  departmentId: string;
  role: {
    roleId: string;
    scopeType: "DEPARTMENT";
    scopeKey: string;
    departmentId: string;
  };
};

export type UserAccountImportCreatedUser = {
  id: string;
  email: string;
  employeeNo: string | null;
  employeeNoNormalized: string | null;
  name: string;
  departmentId: string;
  status: UserStatus;
  credential: unknown | null;
  sessions: unknown[];
  userRoles: {
    id: string;
    roleId: string;
    scopeType: "GLOBAL" | "DEPARTMENT";
    scopeKey: string;
    departmentId: string | null;
    role: {
      code: string;
    };
  }[];
};

export type UserAccountImportApplyTransactionClient = Pick<
  Prisma.TransactionClient,
  "department" | "role" | "user"
>;

@Injectable()
export class UserAccountImportDryRunRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findActiveDepartmentsByCodes(
    codes: readonly string[],
  ): Promise<UserAccountImportDepartmentLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return this.prisma.department.findMany({
      where: {
        code: { in: uniqueCodes },
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: {
        id: true,
        code: true,
      },
    });
  }

  async findActiveRolesByCodes(
    codes: readonly string[],
  ): Promise<UserAccountImportRoleLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return this.prisma.role.findMany({
      where: {
        code: { in: uniqueCodes },
        status: RoleStatus.ACTIVE,
        archivedAt: null,
      },
      select: {
        id: true,
        code: true,
      },
    });
  }

  async findUsersByEmails(
    emails: readonly string[],
  ): Promise<UserAccountImportUserLookup[]> {
    const uniqueEmails = [...new Set(emails.filter(Boolean))];
    if (uniqueEmails.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        email: { in: uniqueEmails },
      },
      select: {
        id: true,
        email: true,
        status: true,
        userRoles: {
          select: {
            revokedAt: true,
            scopeType: true,
            scopeKey: true,
            departmentId: true,
            role: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
      },
    });
  }

  async findUsersByEmployeeNoNormalized(
    employeeNoNormalizedValues: readonly string[],
  ): Promise<UserAccountImportEmployeeNoLookup[]> {
    const uniqueEmployeeNos = [...new Set(employeeNoNormalizedValues.filter(Boolean))];
    if (uniqueEmployeeNos.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        employeeNoNormalized: { in: uniqueEmployeeNos },
      },
      select: {
        id: true,
        employeeNoNormalized: true,
      },
    });
  }

  async findApplyDepartmentsByCodesInTransaction(
    client: UserAccountImportApplyTransactionClient,
    codes: readonly string[],
  ): Promise<UserAccountImportApplyDepartmentLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return client.department.findMany({
      where: { code: { in: uniqueCodes } },
      select: {
        id: true,
        code: true,
        status: true,
        archivedAt: true,
      },
    });
  }

  async findApplyRolesByCodesInTransaction(
    client: UserAccountImportApplyTransactionClient,
    codes: readonly string[],
  ): Promise<UserAccountImportApplyRoleLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return client.role.findMany({
      where: { code: { in: uniqueCodes } },
      select: {
        id: true,
        code: true,
        status: true,
        archivedAt: true,
      },
    });
  }

  async findApplyUsersByEmailsInTransaction(
    client: UserAccountImportApplyTransactionClient,
    emails: readonly string[],
  ): Promise<UserAccountImportApplyUserLookup[]> {
    const uniqueEmails = [...new Set(emails.filter(Boolean))];
    if (uniqueEmails.length === 0) {
      return [];
    }

    return client.user.findMany({
      where: { email: { in: uniqueEmails } },
      select: {
        id: true,
        email: true,
        employeeNoNormalized: true,
      },
    });
  }

  async findApplyUsersByEmployeeNoNormalizedInTransaction(
    client: UserAccountImportApplyTransactionClient,
    employeeNoNormalizedValues: readonly string[],
  ): Promise<UserAccountImportApplyUserLookup[]> {
    const uniqueEmployeeNos = [...new Set(employeeNoNormalizedValues.filter(Boolean))];
    if (uniqueEmployeeNos.length === 0) {
      return [];
    }

    return client.user.findMany({
      where: { employeeNoNormalized: { in: uniqueEmployeeNos } },
      select: {
        id: true,
        email: true,
        employeeNoNormalized: true,
      },
    });
  }

  async createPendingNoCredentialUserInTransaction(
    client: UserAccountImportApplyTransactionClient,
    input: UserAccountImportCreateUserInput,
  ): Promise<UserAccountImportCreatedUser> {
    return client.user.create({
      data: {
        email: input.email,
        employeeNo: input.employeeNo,
        employeeNoNormalized: input.employeeNoNormalized,
        name: input.name,
        departmentId: input.departmentId,
        status: UserStatus.PENDING_ACTIVATION,
        userRoles: {
          create: [
            {
              roleId: input.role.roleId,
              scopeType: input.role.scopeType,
              scopeKey: input.role.scopeKey,
              departmentId: input.role.departmentId,
            },
          ],
        },
      },
      select: {
        id: true,
        email: true,
        employeeNo: true,
        employeeNoNormalized: true,
        name: true,
        departmentId: true,
        status: true,
        credential: true,
        sessions: true,
        userRoles: {
          select: {
            id: true,
            roleId: true,
            scopeType: true,
            scopeKey: true,
            departmentId: true,
            role: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }

  getPrismaUniqueConflictTarget(error: unknown): string[] {
    if (!this.isPrismaUniqueConflict(error) || !("meta" in (error as object))) {
      return [];
    }

    const meta = (error as { meta?: { target?: unknown } }).meta;
    if (Array.isArray(meta?.target)) {
      return meta.target.filter((item): item is string => typeof item === "string");
    }
    if (typeof meta?.target === "string") {
      return [meta.target];
    }

    return [];
  }
}

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};
