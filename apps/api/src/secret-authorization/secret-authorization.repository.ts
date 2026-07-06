import { Inject, Injectable } from "@nestjs/common";
import { Prisma, ResourceType, SecretLevel } from "@prisma/client";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { PrismaService } from "../database/prisma.service";

const restrictedSecretLevels = [
  SecretLevelCode.secret,
  SecretLevelCode.confidential,
] as const;

const grantSelect = {
  resourceType: true,
  resourceId: true,
  granteeType: true,
  granteeId: true,
  grantType: true,
  status: true,
  startsAt: true,
  expiresAt: true,
  revokedAt: true,
  createdAt: true,
} satisfies Prisma.ResourceAccessGrantSelect;

const achievementResourceSelect = {
  id: true,
  type: true,
  status: true,
  departmentId: true,
  secretLevel: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AchievementSelect;

const attachmentResourceSelect = {
  id: true,
  relationType: true,
  relationId: true,
  secretLevel: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AttachmentSelect;

const auditSummarySelect = {
  action: true,
  targetType: true,
  targetSecretLevel: true,
  oldValue: true,
  newValue: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

type ResourceAccessGrantRow = Prisma.ResourceAccessGrantGetPayload<{
  select: typeof grantSelect;
}>;

type AchievementResourceRow = Prisma.AchievementGetPayload<{
  select: typeof achievementResourceSelect;
}>;

type AttachmentResourceRow = Prisma.AttachmentGetPayload<{
  select: typeof attachmentResourceSelect;
}>;

type AuditSummaryRow = Prisma.AuditLogGetPayload<{
  select: typeof auditSummarySelect;
}>;

export type SecretAuthorizationGrantRecord = {
  resourceType: string;
  resourceId: string;
  granteeType: string;
  granteeId: string;
  grantType: string;
  status: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export type SecretAuthorizationResourceRecord = {
  resourceType: string;
  resourceId: string;
  safeResourceLabel: string;
  departmentId: string | null;
  secretLevel: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SecretAuthorizationAuditRecord = {
  action: string;
  targetType: string;
  targetSecretLevel: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: Date;
};

@Injectable()
export class SecretAuthorizationRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async listRestrictedResources(): Promise<SecretAuthorizationResourceRecord[]> {
    const [achievements, attachments] = await Promise.all([
      this.prisma.achievement.findMany({
        where: { secretLevel: { in: [...restrictedSecretLevels] as SecretLevel[] } },
        select: achievementResourceSelect,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
      this.prisma.attachment.findMany({
        where: { secretLevel: { in: [...restrictedSecretLevels] as SecretLevel[] } },
        select: attachmentResourceSelect,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
    ]);

    return [
      ...achievements.map(toAchievementResourceRecord),
      ...attachments.map(toAttachmentResourceRecord),
    ];
  }

  async listAllResourceGrants(): Promise<SecretAuthorizationGrantRecord[]> {
    const rows = await this.prisma.resourceAccessGrant.findMany({
      select: grantSelect,
      orderBy: [{ createdAt: "desc" }, { resourceId: "asc" }],
    });

    return rows.map(toGrantRecord);
  }

  async listResourceGrants(input: {
    resourceType: string;
    resourceId: string;
    take: number;
  }): Promise<SecretAuthorizationGrantRecord[]> {
    const rows = await this.prisma.resourceAccessGrant.findMany({
      where: {
        resourceType: input.resourceType as ResourceType,
        resourceId: input.resourceId,
      },
      select: grantSelect,
      orderBy: [{ createdAt: "desc" }],
      take: input.take,
    });

    return rows.map(toGrantRecord);
  }

  async listResourceAudits(input: {
    resourceType: string;
    resourceId: string;
    take: number;
  }): Promise<SecretAuthorizationAuditRecord[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        targetType: input.resourceType,
        targetId: input.resourceId,
      },
      select: auditSummarySelect,
      orderBy: [{ createdAt: "desc" }],
      take: input.take,
    });

    return rows.map(toAuditRecord);
  }
}

const toGrantRecord = (
  row: ResourceAccessGrantRow,
): SecretAuthorizationGrantRecord => ({
  resourceType: row.resourceType,
  resourceId: row.resourceId,
  granteeType: row.granteeType,
  granteeId: row.granteeId,
  grantType: row.grantType,
  status: row.status,
  startsAt: row.startsAt,
  expiresAt: row.expiresAt,
  revokedAt: row.revokedAt,
  createdAt: row.createdAt,
});

const toAchievementResourceRecord = (
  row: AchievementResourceRow,
): SecretAuthorizationResourceRecord => ({
  resourceType: ResourceTypeCode.achievement,
  resourceId: row.id,
  safeResourceLabel: `Restricted ${row.type} achievement`,
  departmentId: row.departmentId,
  secretLevel: row.secretLevel,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toAttachmentResourceRecord = (
  row: AttachmentResourceRow,
): SecretAuthorizationResourceRecord => ({
  resourceType: ResourceTypeCode.attachment,
  resourceId: row.id,
  safeResourceLabel: `Restricted ${row.relationType} attachment metadata`,
  departmentId: null,
  secretLevel: row.secretLevel,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toAuditRecord = (row: AuditSummaryRow): SecretAuthorizationAuditRecord => ({
  action: row.action,
  targetType: row.targetType,
  targetSecretLevel: row.targetSecretLevel,
  oldValue: row.oldValue,
  newValue: row.newValue,
  createdAt: row.createdAt,
});
