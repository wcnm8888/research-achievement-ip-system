import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, AuthUser } from "./api-client";
import {
  SecretAuthorization,
  SecretAuthorizationOverviewCards,
  SecretAuthorizationOverviewEmpty,
  SecretAuthorizationResourceDetailPanel,
  SecretAuthorizationResourceTable,
  fetchSecretAuthorizationResourceDetail,
  fetchSecretAuthorizationResources,
  shouldLoadSecretAuthorization,
} from "./SecretAuthorization";
import type {
  SecretAuthorizationOverview,
  SecretAuthorizationResourceDetail,
  SecretAuthorizationResourceList,
  SecretAuthorizationResourceSummary,
} from "./types";

const adminUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["system:config"],
};

const auditorUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["audit:read"],
};

const overview: SecretAuthorizationOverview = {
  restrictedResourceCount: 2,
  restrictedResourceCountsByType: { ACHIEVEMENT: 1, ATTACHMENT: 1 },
  restrictedResourceCountsBySecretLevel: { SECRET: 1, CONFIDENTIAL: 1 },
  grantCountsByStatus: { ACTIVE: 1, REVOKED: 1, EXPIRED: 1, EXPIRING_SOON: 1 },
  grantCountsByType: { READ_METADATA: 2, READ_SUMMARY: 1 },
  grantCountsByGranteeType: { USER: 2, ROLE: 1 },
  activeGrantCount: 1,
  expiredGrantCount: 1,
  revokedGrantCount: 1,
  futureDatedGrantCount: 0,
  expiringSoonCount: 1,
  generatedAt: "2026-07-07T00:00:00.000Z",
  caveats: ["LOCAL_DEMO_SYNTHETIC_ONLY"],
};

const resource: SecretAuthorizationResourceSummary = {
  resourceType: "ACHIEVEMENT",
  resourceId: "achievement-1",
  safeResourceLabel: "Achievement restricted summary",
  departmentId: "department-1",
  secretLevel: "SECRET",
  isRestricted: true,
  contentRedacted: true,
  activeGrantCount: 1,
  grantCountsByType: { READ_METADATA: 1 },
  grantCountsByGranteeType: { USER: 1 },
  latestGrantCreatedAt: "2026-07-07T00:00:00.000Z",
  latestGrantRevokedAt: null,
  nearestGrantExpiresAt: "2026-07-14T00:00:00.000Z",
  caveats: ["RESOURCE_CONTENT_REDACTED"],
};

const detail: SecretAuthorizationResourceDetail = {
  resource,
  grants: [
    {
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      safeResourceLabel: resource.safeResourceLabel,
      granteeType: "USER",
      granteeSafeLabel: "User grant holder",
      grantType: "READ_METADATA",
      status: "ACTIVE",
      startsAt: "2026-07-07T00:00:00.000Z",
      expiresAt: "2026-07-14T00:00:00.000Z",
      revokedAt: null,
      createdAt: "2026-07-07T00:00:00.000Z",
    },
  ],
  audits: [
    {
      operation: "RESOURCE_GRANT_VIEWED",
      resourceType: resource.resourceType,
      targetSecretLevel: "SECRET",
      grantType: "READ_METADATA",
      granteeType: "USER",
      reasonProvided: true,
      createdAt: "2026-07-07T00:01:00.000Z",
    },
  ],
  limits: {
    grantRows: 5,
    auditRows: 5,
  },
  caveats: ["AUDIT_SUMMARY_BOUNDED"],
};

const forbiddenTerms = [
  "sessionId",
  "sessionHash",
  "cookie",
  "targetUserId",
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "raw token",
  "DATABASE_URL",
  "connection string",
  "clientSecret",
  "storageKey",
  "objectKey",
  "internalPath",
  "providerPath",
  "checksum",
  "downloadUrl",
  "preSignedUrl",
  "rawAuditJson",
  "permissionGraph",
  "operatorEmail",
  "debug",
  "export",
  "batch",
  "Create grant",
  "Revoke grant",
  "Approve grant",
];

describe("secret authorization permission boundary", () => {
  it("renders a boundary and does not request secret authorization APIs without system:config", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const client = {
      getSecretAuthorizationOverview: vi.fn(),
      listSecretAuthorizationResources: vi.fn(),
      getSecretAuthorizationResourceGrants: vi.fn(),
    } satisfies Pick<
      AccountManagementApiClient,
      | "getSecretAuthorizationOverview"
      | "listSecretAuthorizationResources"
      | "getSecretAuthorizationResourceGrants"
    >;

    const html = renderToStaticMarkup(
      <SecretAuthorization
        demoUserId="auditor-user-id"
        authUser={auditorUser}
        apiClient={client}
      />,
    );

    expect(html).toContain("当前账号无权访问涉密授权管理");
    expect(html).toContain("请联系系统管理员确认账号权限");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(client.getSecretAuthorizationOverview).not.toHaveBeenCalled();
    expect(client.listSecretAuthorizationResources).not.toHaveBeenCalled();
    expect(client.getSecretAuthorizationResourceGrants).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("allows loading only with system:config and an active context", () => {
    expect(shouldLoadSecretAuthorization(true, "admin-user-id")).toBe(true);
    expect(shouldLoadSecretAuthorization(false, "admin-user-id")).toBe(false);
    expect(shouldLoadSecretAuthorization(true, null)).toBe(false);
    expect(shouldLoadSecretAuthorization(true, "   ")).toBe(false);
  });

  it("renders the operational shell for system config users", () => {
    const html = renderToStaticMarkup(
      <SecretAuthorization demoUserId="admin-user-id" authUser={adminUser} />,
    );

    expect(html).toContain("secret-authorization-page");
    expect(html).toContain("涉密授权管理");
    expect(html).toContain("涉密资源");
    expect(html).not.toContain("Local/demo/synthetic");
    expect(html).not.toContain("not production authorization acceptance");
    expect(html).not.toContain("GET /secret-authorization/resources");
  });
});

describe("secret authorization safe projection display", () => {
  it("renders overview cards and caveats from safe summary fields", () => {
    const html = renderToStaticMarkup(<SecretAuthorizationOverviewCards overview={overview} />);

    expect(html).toContain("涉密资源");
    expect(html).toContain("有效授权");
    expect(html).toContain("已撤销/已过期");
    expect(html).toContain("即将到期");
    expect(html).toContain("ACHIEVEMENT: 1");
    expect(html).toContain("LOCAL_DEMO_SYNTHETIC_ONLY");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain("null");
  });

  it("renders resource summaries without protected resource material", () => {
    const html = renderToStaticMarkup(
      <SecretAuthorizationResourceTable resources={[resource]} selectedResourceKey="ACHIEVEMENT:achievement-1" />,
    );

    expect(html).toContain("Achievement restricted summary");
    expect(html).toContain("department-1");
    expect(html).toContain("SECRET");
    expect(html).toContain("Restricted");
    expect(html).toContain("Redacted");
    expectNoForbiddenTerms(html);
  });

  it("renders bounded grant and audit summaries using safe fields only", () => {
    const html = renderToStaticMarkup(<SecretAuthorizationResourceDetailPanel detail={detail} />);

    expect(html).toContain("Safe detail projection");
    expect(html).toContain("Grant rows are bounded to 5");
    expect(html).toContain("User grant holder");
    expect(html).toContain("READ_METADATA");
    expect(html).toContain("RESOURCE_GRANT_VIEWED");
    expect(html).toContain("已填写");
    expect(html).toContain("AUDIT_SUMMARY_BOUNDED");
    expectNoForbiddenTerms(html);
  });

  it("renders stable empty states without undefined or null text", () => {
    const emptyDetail: SecretAuthorizationResourceDetail = {
      ...detail,
      grants: [],
      audits: [],
      caveats: [],
      resource: {
        ...resource,
        departmentId: null,
        latestGrantRevokedAt: null,
        nearestGrantExpiresAt: null,
        caveats: [],
      },
    };

    const html = [
      renderToStaticMarkup(<SecretAuthorizationOverviewEmpty />),
      renderToStaticMarkup(<SecretAuthorizationResourceDetailPanel detail={emptyDetail} />),
    ].join("");

    expect(html).toContain("暂无涉密授权概览");
    expect(html).toContain("No safe grant summaries returned.");
    expect(html).toContain("No safe audit summaries returned.");
    expect(html).toContain("No department");
    expect(html).not.toContain("undefined");
    expect(html).not.toContain(">null<");
  });
});

describe("secret authorization API fetch helpers", () => {
  it("normalizes resource list shape and fetches detail by safe resource identifier", async () => {
    const listResponse: SecretAuthorizationResourceList = {
      items: [resource],
      total: 1,
      caveats: ["LOCAL_DEMO_SYNTHETIC_ONLY"],
    };
    const client = {
      listSecretAuthorizationResources: vi.fn(async () => listResponse),
      getSecretAuthorizationResourceGrants: vi.fn(async () => detail),
    };

    await expect(fetchSecretAuthorizationResources(client)).resolves.toEqual(listResponse);
    await expect(fetchSecretAuthorizationResourceDetail(client, resource)).resolves.toEqual(detail);
    expect(client.getSecretAuthorizationResourceGrants).toHaveBeenCalledWith(
      "ACHIEVEMENT",
      "achievement-1",
    );
  });
});

const expectNoForbiddenTerms = (html: string) => {
  forbiddenTerms.forEach((term) => {
    expect(html).not.toContain(term);
  });
};
