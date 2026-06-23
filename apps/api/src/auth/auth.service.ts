import { Inject, Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { RoleCode } from "../authorization/constants/role-code";
import { isBootstrapEnabled } from "../config/production-config";
import { PrismaService } from "../database/prisma.service";
import { buildUserContext } from "../identity/dev-identity.adapter";
import { UserContext } from "../identity/user-context";
import {
  AuthBootstrapAlreadyCompletedError,
  AuthBootstrapDisabledError,
  AuthInvalidCredentialsError,
} from "./auth.errors";
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  requireSessionSecret,
  verifyPassword,
} from "./auth-crypto";
import { BootstrapAdminDto } from "./dto/bootstrap-admin.dto";
import { LoginDto } from "./dto/login.dto";

const sessionTtlMs = 24 * 60 * 60 * 1000;
const invalidCredentialsReason = "INVALID_CREDENTIALS";
const logoutReason = "LOGOUT";

export type AuthUserResponse = {
  id: string;
  email: string;
  name: string;
  departmentId: string;
  roleCodes: readonly string[];
  permissionCodes: readonly string[];
  scopedDepartmentIds: readonly string[];
};

export type AuthSessionResult = {
  user: AuthUserResponse;
  sessionToken: string;
  expiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async bootstrapAdmin(dto: BootstrapAdminDto): Promise<{ bootstrapped: true; user: AuthUserResponse }> {
    if (!isBootstrapEnabled()) {
      throw new AuthBootstrapDisabledError();
    }

    if (await this.hasActiveSystemAdmin()) {
      throw new AuthBootstrapAlreadyCompletedError();
    }

    const systemAdminRole = await this.prisma.role.findFirst({
      where: {
        code: RoleCode.systemAdmin,
        status: "ACTIVE",
      },
    });
    if (!systemAdminRole) {
      throw new AuthBootstrapDisabledError();
    }

    const passwordHash = await hashPassword(dto.password);
    const normalizedEmail = normalizeEmail(dto.email);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name.trim(),
        departmentId: dto.departmentId,
        credential: {
          create: {
            passwordHash,
            passwordUpdatedAt: new Date(),
          },
        },
        userRoles: {
          create: {
            roleId: systemAdminRole.id,
            scopeType: "GLOBAL",
            scopeKey: "GLOBAL",
          },
        },
      },
      include: loadedUserInclude,
    });

    await this.auditService.recordEvent({
      actor: null,
      action: AuditActionCode.bootstrapAdmin,
      target: {
        type: AuditTargetTypeCode.user,
        id: user.id,
        departmentId: user.departmentId,
      },
      newValue: {
        result: "BOOTSTRAPPED",
        userId: user.id,
        departmentId: user.departmentId,
        roleCode: RoleCode.systemAdmin,
      },
    });

    return {
      bootstrapped: true,
      user: toAuthUserResponse(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthSessionResult> {
    const sessionSecret = requireSessionSecret();
    const normalizedEmail = normalizeEmail(dto.email);
    const emailHash = hashOpaqueToken(normalizedEmail, sessionSecret);

    const user = await this.findUserByEmail(normalizedEmail);
    if (!user || user.status !== "ACTIVE" || !user.credential || user.credential.status !== "ACTIVE") {
      await this.recordFailedLogin(emailHash, invalidCredentialsReason, user?.id ?? null);
      throw new AuthInvalidCredentialsError();
    }

    const passwordMatches = await verifyPassword(dto.password, user.credential.passwordHash);
    if (!passwordMatches) {
      await this.recordFailedLogin(emailHash, invalidCredentialsReason, user.id);
      throw new AuthInvalidCredentialsError();
    }

    const sessionToken = createOpaqueToken();
    const sessionHash = hashOpaqueToken(sessionToken, sessionSecret);
    const expiresAt = new Date(Date.now() + sessionTtlMs);

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        sessionHash,
        expiresAt,
      },
    });

    await this.prisma.loginAttempt.create({
      data: {
        emailHash,
        success: true,
        userId: user.id,
      },
    });

    await this.auditService.recordEvent({
      actor: {
        userId: user.id,
        departmentId: user.departmentId,
      },
      action: AuditActionCode.login,
      target: {
        type: AuditTargetTypeCode.userSession,
        id: session.id,
        departmentId: user.departmentId,
      },
      newValue: {
        result: "LOGIN_SUCCESS",
        userId: user.id,
      },
    });

    return {
      user: toAuthUserResponse(user),
      sessionToken,
      expiresAt,
    };
  }

  async logout(sessionToken: string | null): Promise<void> {
    const sessionSecret = process.env.SESSION_SECRET?.trim();
    if (!sessionToken || !sessionSecret) {
      return;
    }

    const sessionHash = hashOpaqueToken(sessionToken, sessionSecret);
    const session = await this.prisma.userSession.findFirst({
      where: {
        sessionHash,
        revokedAt: null,
      },
      include: {
        user: true,
      },
    });
    if (!session) {
      return;
    }

    const revokedAt = new Date();
    await this.prisma.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt,
        revokedReason: logoutReason,
      },
    });

    await this.auditService.recordEvent({
      actor: {
        userId: session.user.id,
        departmentId: session.user.departmentId,
      },
      action: AuditActionCode.logout,
      target: {
        type: AuditTargetTypeCode.userSession,
        id: session.id,
        departmentId: session.user.departmentId,
      },
      newValue: {
        result: "LOGOUT",
        userId: session.user.id,
        revokedReason: logoutReason,
      },
    });
  }

  async getMe(context: UserContext): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: context.userId,
        status: "ACTIVE",
      },
      include: loadedUserInclude,
    });
    if (!user) {
      throw new AuthInvalidCredentialsError();
    }

    return toAuthUserResponse(user);
  }

  private async hasActiveSystemAdmin(): Promise<boolean> {
    const existingAdmin = await this.prisma.userRole.findFirst({
      where: {
        revokedAt: null,
        role: {
          code: RoleCode.systemAdmin,
          status: "ACTIVE",
        },
        user: {
          status: "ACTIVE",
        },
      },
      select: {
        id: true,
      },
    });

    return existingAdmin !== null;
  }

  private async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: loadedUserInclude,
    });
  }

  private async recordFailedLogin(
    emailHash: string,
    failureReason: string,
    userId: string | null,
  ): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        emailHash,
        success: false,
        failureReason,
        userId,
      },
    });

    await this.auditService.recordEvent({
      actor: userId ? { userId } : null,
      action: AuditActionCode.loginFailed,
      target: {
        type: AuditTargetTypeCode.auth,
        id: userId,
      },
      newValue: {
        result: "LOGIN_FAILED",
        failureReason,
        emailHash,
        userId,
      },
    });
  }
}

const loadedUserInclude = {
  credential: true,
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
} as const;

type LoadedAuthUser = NonNullable<
  Awaited<ReturnType<PrismaService["user"]["findUnique"]>>
> & {
  credential?: unknown;
  userRoles: Parameters<typeof buildUserContext>[0]["userRoles"];
};

const toAuthUserResponse = (user: LoadedAuthUser): AuthUserResponse => {
  const context = buildUserContext(user);
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    departmentId: user.departmentId,
    roleCodes: context.roleCodes,
    permissionCodes: context.permissionCodes,
    scopedDepartmentIds: context.scopedDepartmentIds,
  };
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
