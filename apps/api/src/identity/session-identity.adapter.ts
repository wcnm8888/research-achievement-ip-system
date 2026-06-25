import { createHmac } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { buildUserContext, readHeader } from "./dev-identity.adapter";
import { IdentityAdapter, IdentityRequest } from "./identity-adapter.interface";
import { UserContext } from "./user-context";

export const sessionCookieName = "research_ip_session";
const sessionSecretEnvName = "SESSION_SECRET";

@Injectable()
export class SessionIdentityAdapter implements IdentityAdapter {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async loadUserContext(request: IdentityRequest): Promise<UserContext | null> {
    const sessionToken = readCookie(request, sessionCookieName);
    if (!sessionToken) {
      return null;
    }

    const sessionHash = hashSessionToken(sessionToken, process.env[sessionSecretEnvName]);
    if (!sessionHash) {
      return null;
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        sessionHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
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
          },
        },
      },
    });

    if (!session || session.user.status !== "ACTIVE") {
      return null;
    }

    if (!session.user.credential || session.user.credential.status !== "ACTIVE") {
      return null;
    }

    return buildUserContext(session.user);
  }
}

export const hashSessionToken = (
  sessionToken: string,
  sessionSecret: string | undefined,
): string | null => {
  const trimmedToken = sessionToken.trim();
  const trimmedSecret = sessionSecret?.trim();
  if (!trimmedToken || !trimmedSecret) {
    return null;
  }

  return createHmac("sha256", trimmedSecret).update(trimmedToken).digest("hex");
};

export const readCookie = (
  request: IdentityRequest,
  name: string,
): string | null => {
  const cookieHeader = readHeader(request.headers, "cookie");
  if (!cookieHeader) {
    return null;
  }

  const requestedName = name.trim();
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.split("=");
    if (rawName?.trim() !== requestedName) {
      continue;
    }

    const value = rawValueParts.join("=").trim();
    return value ? decodeURIComponent(value) : null;
  }

  return null;
};
