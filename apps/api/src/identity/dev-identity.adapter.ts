import { Inject, Injectable } from "@nestjs/common";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { PrismaService } from "../database/prisma.service";
import { IdentityAdapter, IdentityHeaders, IdentityRequest } from "./identity-adapter.interface";
import { RoleScope, UserContext } from "./user-context";

const demoUserIdHeader = "x-demo-user-id";

type LoadedUser = {
  id: string;
  departmentId: string;
  userRoles: Array<{
    departmentId: string | null;
    scopeKey: string;
    scopeType: string;
    role: {
      id: string;
      code: string;
      rolePermissions: Array<{
        permission: {
          code: string;
          status: string;
        };
      }>;
    };
  }>;
};

@Injectable()
export class DevIdentityAdapter implements IdentityAdapter {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async loadUserContext(request: IdentityRequest): Promise<UserContext | null> {
    if (isProductionEnvironment(request.environment ?? process.env.NODE_ENV)) {
      return null;
    }

    const userId = readHeader(request.headers, demoUserIdHeader);
    if (!userId) {
      return null;
    }

    const user = await this.findActiveUser(userId);
    if (!user) {
      return null;
    }

    return buildUserContext(user);
  }

  async findActiveUser(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        status: "ACTIVE",
      },
      include: {
        userRoles: {
          where: {
            revokedAt: null,
            role: {
              status: "ACTIVE",
            },
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

export const readHeader = (headers: IdentityHeaders, name: string): string | null => {
  const requested = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === requested);
  const value = entry?.[1];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export const isProductionEnvironment = (environment: string | undefined): boolean =>
  environment === "production";

export const buildUserContext = (user: LoadedUser): UserContext => {
  const roleScopes: RoleScope[] = user.userRoles.map((userRole) => ({
    roleCode: userRole.role.code as RoleCode,
    scopeType: userRole.scopeType as ScopeType,
    scopeKey: userRole.scopeKey,
    departmentId: userRole.departmentId,
  }));

  const permissionCodes = user.userRoles.flatMap((userRole) =>
    userRole.role.rolePermissions
      .filter((rolePermission) => rolePermission.permission.status === "ACTIVE")
      .map((rolePermission) => rolePermission.permission.code as PermissionCode),
  );

  const scopedDepartmentIds = user.userRoles
    .map((userRole) => userRole.departmentId)
    .filter((departmentId): departmentId is string => departmentId !== null);

  return {
    userId: user.id,
    departmentId: user.departmentId,
    roleIds: unique(user.userRoles.map((userRole) => userRole.role.id)),
    roleCodes: unique(roleScopes.map((roleScope) => roleScope.roleCode)),
    permissionCodes: unique(permissionCodes),
    roleScopes,
    scopedDepartmentIds: unique(scopedDepartmentIds),
  };
};

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];
