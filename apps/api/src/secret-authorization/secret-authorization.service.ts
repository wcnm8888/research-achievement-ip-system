import { Inject, Injectable } from "@nestjs/common";
import { GrantStatusCode } from "../authorization/constants/grant-status-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { UserContext } from "../identity/user-context";
import {
  SecretAuthorizationAuditSummaryDto,
  SecretAuthorizationGrantSummaryDto,
  SecretAuthorizationOverviewDto,
  SecretAuthorizationResourceDetailDto,
  SecretAuthorizationResourceListDto,
  SecretAuthorizationResourceSummaryDto,
} from "./dto/secret-authorization.dto";
import {
  SecretAuthorizationAuditRecord,
  SecretAuthorizationGrantRecord,
  SecretAuthorizationRepository,
  SecretAuthorizationResourceRecord,
} from "./secret-authorization.repository";

export class SecretAuthorizationPermissionDeniedError extends Error {
  constructor() {
    super("system:config permission is required for secret authorization management.");
  }
}

export class SecretAuthorizationResourceNotFoundError extends Error {
  constructor(resourceType: string, resourceId: string) {
    super(`Secret authorization resource ${resourceType}/${resourceId} was not found.`);
  }
}

export class SecretAuthorizationInvalidResourceTypeError extends Error {
  constructor(resourceType: string) {
    super(`Unsupported secret authorization resource type: ${resourceType}.`);
  }
}

const detailRowLimit = 5;
const expiringSoonDays = 30;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

const baseCaveats = [
  "READ_ONLY_SAFE_PROJECTION",
  "LOCAL_DEMO_SYNTHETIC_NOT_PRODUCTION_AUTHORIZATION",
  "GRANT_MUTATION_NOT_IMPLEMENTED",
] as const;

const supportedResourceTypes = new Set<string>(Object.values(ResourceTypeCode));

@Injectable()
export class SecretAuthorizationService {
  constructor(
    @Inject(SecretAuthorizationRepository)
    private readonly repository: SecretAuthorizationRepository,
  ) {}

  async getOverview(context: UserContext): Promise<SecretAuthorizationOverviewDto> {
    this.assertSystemConfig(context);

    const [resources, grants] = await Promise.all([
      this.repository.listRestrictedResources(),
      this.repository.listAllResourceGrants(),
    ]);
    const now = new Date();
    const grantStates = grants.map((grant) => classifyGrant(grant, now));

    return {
      restrictedResourceCount: resources.length,
      restrictedResourceCountsByType: countBy(resources, (resource) => resource.resourceType),
      restrictedResourceCountsBySecretLevel: countBy(
        resources,
        (resource) => resource.secretLevel,
      ),
      grantCountsByStatus: countBy(grants, (grant) => grant.status),
      grantCountsByType: countBy(grants, (grant) => grant.grantType),
      grantCountsByGranteeType: countBy(grants, (grant) => grant.granteeType),
      activeGrantCount: grantStates.filter((state) => state === "ACTIVE").length,
      expiredGrantCount: grantStates.filter((state) => state === "EXPIRED").length,
      revokedGrantCount: grantStates.filter((state) => state === "REVOKED").length,
      futureDatedGrantCount: grantStates.filter((state) => state === "FUTURE_DATED").length,
      expiringSoonCount: grants.filter((grant) => isExpiringSoonGrant(grant, now)).length,
      generatedAt: now.toISOString(),
      caveats: [...baseCaveats],
    };
  }

  async listResources(context: UserContext): Promise<SecretAuthorizationResourceListDto> {
    this.assertSystemConfig(context);

    const [resources, grants] = await Promise.all([
      this.repository.listRestrictedResources(),
      this.repository.listAllResourceGrants(),
    ]);
    const grantsByResource = groupGrantsByResource(grants);
    const now = new Date();
    const items = resources.map((resource) =>
      toResourceSummary(resource, grantsByResource.get(resourceKey(resource)) ?? [], now),
    );

    return {
      items,
      total: items.length,
      caveats: [...baseCaveats],
    };
  }

  async getResourceGrantDetail(
    context: UserContext,
    resourceType: string,
    resourceId: string,
  ): Promise<SecretAuthorizationResourceDetailDto> {
    this.assertSystemConfig(context);
    this.assertSupportedResourceType(resourceType);

    const [resources, allGrants, detailGrants, audits] = await Promise.all([
      this.repository.listRestrictedResources(),
      this.repository.listAllResourceGrants(),
      this.repository.listResourceGrants({
        resourceType,
        resourceId,
        take: detailRowLimit,
      }),
      this.repository.listResourceAudits({
        resourceType,
        resourceId,
        take: detailRowLimit,
      }),
    ]);
    const resource =
      resources.find(
        (item) => item.resourceType === resourceType && item.resourceId === resourceId,
      ) ?? synthesizeResourceFromGrants(resourceType, resourceId, allGrants);

    if (!resource) {
      throw new SecretAuthorizationResourceNotFoundError(resourceType, resourceId);
    }

    const now = new Date();
    const resourceGrants = allGrants.filter(
      (grant) => grant.resourceType === resourceType && grant.resourceId === resourceId,
    );
    const auditSummaries = audits.slice(0, detailRowLimit).map(toAuditSummary);

    return {
      resource: toResourceSummary(resource, resourceGrants, now),
      grants: detailGrants.slice(0, detailRowLimit).map((grant) =>
        toGrantSummary(grant, resource.safeResourceLabel),
      ),
      audits: auditSummaries,
      limits: {
        grantRows: detailRowLimit,
        auditRows: detailRowLimit,
      },
      caveats: [
        ...baseCaveats,
        ...(auditSummaries.length === 0
          ? ["AUDIT_SUMMARY_EMPTY_OR_NOT_GRANT_SPECIFIC"]
          : []),
      ],
    };
  }

  private assertSystemConfig(
    context: UserContext | null | undefined,
  ): asserts context is UserContext {
    if (!context?.permissionCodes.includes(PermissionCode.systemConfig)) {
      throw new SecretAuthorizationPermissionDeniedError();
    }
  }

  private assertSupportedResourceType(resourceType: string): void {
    if (!supportedResourceTypes.has(resourceType)) {
      throw new SecretAuthorizationInvalidResourceTypeError(resourceType);
    }
  }
}

const toResourceSummary = (
  resource: SecretAuthorizationResourceRecord,
  grants: readonly SecretAuthorizationGrantRecord[],
  now: Date,
): SecretAuthorizationResourceSummaryDto => {
  const activeGrants = grants.filter((grant) => classifyGrant(grant, now) === "ACTIVE");
  const latestGrantCreatedAt = maxDate(grants.map((grant) => grant.createdAt));
  const latestGrantRevokedAt = maxDate(
    grants.map((grant) => grant.revokedAt).filter((date): date is Date => Boolean(date)),
  );
  const nearestGrantExpiresAt = minDate(
    activeGrants
      .map((grant) => grant.expiresAt)
      .filter((date): date is Date => Boolean(date)),
  );

  return {
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    safeResourceLabel: resource.safeResourceLabel,
    departmentId: resource.departmentId,
    secretLevel: resource.secretLevel,
    isRestricted: isRestrictedSecretLevel(resource.secretLevel),
    contentRedacted: isRestrictedSecretLevel(resource.secretLevel),
    activeGrantCount: activeGrants.length,
    grantCountsByType: countBy(grants, (grant) => grant.grantType),
    grantCountsByGranteeType: countBy(grants, (grant) => grant.granteeType),
    latestGrantCreatedAt: latestGrantCreatedAt?.toISOString() ?? null,
    latestGrantRevokedAt: latestGrantRevokedAt?.toISOString() ?? null,
    nearestGrantExpiresAt: nearestGrantExpiresAt?.toISOString() ?? null,
    caveats: [...baseCaveats],
  };
};

const toGrantSummary = (
  grant: SecretAuthorizationGrantRecord,
  safeResourceLabel: string,
): SecretAuthorizationGrantSummaryDto => ({
  resourceType: grant.resourceType,
  resourceId: grant.resourceId,
  safeResourceLabel,
  granteeType: grant.granteeType,
  granteeSafeLabel: `${grant.granteeType}:${maskIdentifier(grant.granteeId)}`,
  grantType: grant.grantType,
  status: grant.status,
  startsAt: grant.startsAt?.toISOString() ?? null,
  expiresAt: grant.expiresAt?.toISOString() ?? null,
  revokedAt: grant.revokedAt?.toISOString() ?? null,
  createdAt: grant.createdAt.toISOString(),
});

const toAuditSummary = (
  audit: SecretAuthorizationAuditRecord,
): SecretAuthorizationAuditSummaryDto => ({
  operation: audit.action,
  resourceType: audit.targetType,
  targetSecretLevel: audit.targetSecretLevel,
  grantType: findStringValue(audit.newValue, "grantType") ?? findStringValue(audit.oldValue, "grantType"),
  granteeType:
    findStringValue(audit.newValue, "granteeType") ?? findStringValue(audit.oldValue, "granteeType"),
  reasonProvided:
    hasNonEmptyString(audit.newValue, "reason") || hasNonEmptyString(audit.oldValue, "reason"),
  createdAt: audit.createdAt.toISOString(),
});

type EffectiveGrantState = "ACTIVE" | "EXPIRED" | "REVOKED" | "FUTURE_DATED";

const classifyGrant = (
  grant: SecretAuthorizationGrantRecord,
  now: Date,
): EffectiveGrantState => {
  if (grant.revokedAt || grant.status === GrantStatusCode.revoked) {
    return "REVOKED";
  }

  if (grant.status === GrantStatusCode.expired) {
    return "EXPIRED";
  }

  if (grant.startsAt && grant.startsAt.getTime() > now.getTime()) {
    return "FUTURE_DATED";
  }

  if (grant.expiresAt && grant.expiresAt.getTime() <= now.getTime()) {
    return "EXPIRED";
  }

  return "ACTIVE";
};

const isExpiringSoonGrant = (
  grant: SecretAuthorizationGrantRecord,
  now: Date,
): boolean => {
  if (classifyGrant(grant, now) !== "ACTIVE" || !grant.expiresAt) {
    return false;
  }

  const threshold = now.getTime() + expiringSoonDays * millisecondsPerDay;

  return grant.expiresAt.getTime() <= threshold;
};

const isRestrictedSecretLevel = (secretLevel: string): boolean =>
  secretLevel === SecretLevelCode.secret || secretLevel === SecretLevelCode.confidential;

const countBy = <T>(
  items: readonly T[],
  getKey: (item: T) => string | null | undefined,
): Record<string, number> =>
  items.reduce<Record<string, number>>((counts, item) => {
    const key = getKey(item) ?? "UNKNOWN";
    counts[key] = (counts[key] ?? 0) + 1;

    return counts;
  }, {});

const groupGrantsByResource = (
  grants: readonly SecretAuthorizationGrantRecord[],
): Map<string, SecretAuthorizationGrantRecord[]> => {
  const grouped = new Map<string, SecretAuthorizationGrantRecord[]>();

  for (const grant of grants) {
    const key = `${grant.resourceType}:${grant.resourceId}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.push(grant);
    } else {
      grouped.set(key, [grant]);
    }
  }

  return grouped;
};

const resourceKey = (resource: SecretAuthorizationResourceRecord): string =>
  `${resource.resourceType}:${resource.resourceId}`;

const synthesizeResourceFromGrants = (
  resourceType: string,
  resourceId: string,
  grants: readonly SecretAuthorizationGrantRecord[],
): SecretAuthorizationResourceRecord | null => {
  const hasGrant = grants.some(
    (grant) => grant.resourceType === resourceType && grant.resourceId === resourceId,
  );

  if (!hasGrant) {
    return null;
  }

  const now = new Date();

  return {
    resourceType,
    resourceId,
    safeResourceLabel: `${resourceType} grant target`,
    departmentId: null,
    secretLevel: "UNKNOWN",
    status: "UNKNOWN",
    createdAt: now,
    updatedAt: now,
  };
};

const maxDate = (dates: readonly Date[]): Date | null =>
  dates.reduce<Date | null>(
    (max, date) => (!max || date.getTime() > max.getTime() ? date : max),
    null,
  );

const minDate = (dates: readonly Date[]): Date | null =>
  dates.reduce<Date | null>(
    (min, date) => (!min || date.getTime() < min.getTime() ? date : min),
    null,
  );

const maskIdentifier = (value: string): string => {
  if (value.length <= 8) {
    return "masked";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const findStringValue = (value: unknown, key: string): string | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = (value as Record<string, unknown>)[key];

  return typeof candidate === "string" && candidate.trim() ? candidate : null;
};

const hasNonEmptyString = (value: unknown, key: string): boolean =>
  findStringValue(value, key) !== null;
