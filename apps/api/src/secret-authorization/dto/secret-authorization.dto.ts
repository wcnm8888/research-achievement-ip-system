export type CountMap = Record<string, number>;

export type SecretAuthorizationOverviewDto = {
  restrictedResourceCount: number;
  restrictedResourceCountsByType: CountMap;
  restrictedResourceCountsBySecretLevel: CountMap;
  grantCountsByStatus: CountMap;
  grantCountsByType: CountMap;
  grantCountsByGranteeType: CountMap;
  activeGrantCount: number;
  expiredGrantCount: number;
  revokedGrantCount: number;
  futureDatedGrantCount: number;
  expiringSoonCount: number;
  generatedAt: string;
  caveats: string[];
};

export type SecretAuthorizationResourceSummaryDto = {
  resourceType: string;
  resourceId: string;
  safeResourceLabel: string;
  departmentId: string | null;
  secretLevel: string;
  isRestricted: boolean;
  contentRedacted: boolean;
  activeGrantCount: number;
  grantCountsByType: CountMap;
  grantCountsByGranteeType: CountMap;
  latestGrantCreatedAt: string | null;
  latestGrantRevokedAt: string | null;
  nearestGrantExpiresAt: string | null;
  caveats: string[];
};

export type SecretAuthorizationResourceListDto = {
  items: SecretAuthorizationResourceSummaryDto[];
  total: number;
  caveats: string[];
};

export type SecretAuthorizationGrantSummaryDto = {
  resourceType: string;
  resourceId: string;
  safeResourceLabel: string;
  granteeType: string;
  granteeSafeLabel: string;
  grantType: string;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type SecretAuthorizationAuditSummaryDto = {
  operation: string;
  resourceType: string;
  targetSecretLevel: string | null;
  grantType: string | null;
  granteeType: string | null;
  reasonProvided: boolean;
  createdAt: string;
};

export type SecretAuthorizationResourceDetailDto = {
  resource: SecretAuthorizationResourceSummaryDto;
  grants: SecretAuthorizationGrantSummaryDto[];
  audits: SecretAuthorizationAuditSummaryDto[];
  limits: {
    grantRows: number;
    auditRows: number;
  };
  caveats: string[];
};
