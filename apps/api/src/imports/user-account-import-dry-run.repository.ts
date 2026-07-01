import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus, RoleStatus, UserStatus } from "@prisma/client";
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
}
