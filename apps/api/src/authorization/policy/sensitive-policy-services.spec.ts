import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it } from "vitest";
import { UserContext } from "../../identity/user-context";
import { AttachmentStatusCode } from "../constants/attachment-status-code";
import { GrantStatusCode } from "../constants/grant-status-code";
import { GrantTypeCode } from "../constants/grant-type-code";
import { GranteeTypeCode } from "../constants/grantee-type-code";
import { PermissionCode } from "../constants/permission-code";
import { ResourceTypeCode } from "../constants/resource-type-code";
import { RoleCode } from "../constants/role-code";
import { SecretLevelCode } from "../constants/secret-level-code";
import { AttachmentAccessPolicyService, AttachmentDescriptor } from "./attachment-access-policy.service";
import { AuditReadPolicyService } from "./audit-read-policy.service";
import { AuditRedactorService } from "./audit-redactor.service";
import { allowDecision, denyDecision } from "./policy-decision";
import { RbacPolicyService } from "./rbac-policy.service";
import {
  ResourceAccessGrantRecord,
  ResourceGrantPolicyService,
} from "./resource-grant-policy.service";
import {
  SecretAccessPolicyService,
  SecretResourceDescriptor,
} from "./secret-access-policy.service";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  users: {
    researcher: "40000000-0000-4000-8000-000000000001",
    owner: "40000000-0000-4000-8000-000000000006",
  },
  roles: {
    researcher: "50000000-0000-4000-8000-000000000001",
    auditor: "50000000-0000-4000-8000-000000000002",
  },
  departments: {
    ai: "10000000-0000-4000-8000-000000000002",
    materials: "10000000-0000-4000-8000-000000000003",
  },
  resources: {
    achievement: "60000000-0000-4000-8000-000000000001",
    attachment: "70000000-0000-4000-8000-000000000001",
  },
};

const now = new Date("2026-06-10T08:00:00.000Z");

const makeContext = (overrides: Partial<UserContext> = {}): UserContext => ({
  userId: ids.users.researcher,
  departmentId: ids.departments.ai,
  roleIds: [ids.roles.researcher],
  roleCodes: [RoleCode.researcher],
  permissionCodes: [],
  roleScopes: [],
  scopedDepartmentIds: [],
  ...overrides,
});

const makeGrant = (
  overrides: Partial<ResourceAccessGrantRecord> = {},
): ResourceAccessGrantRecord => ({
  resourceType: ResourceTypeCode.achievement,
  resourceId: ids.resources.achievement,
  granteeType: GranteeTypeCode.user,
  granteeId: ids.users.researcher,
  grantType: GrantTypeCode.secretRead,
  status: GrantStatusCode.active,
  ...overrides,
});

const makeParentResource = (
  overrides: Partial<SecretResourceDescriptor> = {},
): SecretResourceDescriptor => ({
  resourceType: ResourceTypeCode.achievement,
  resourceId: ids.resources.achievement,
  secretLevel: SecretLevelCode.secret,
  ownerUserId: ids.users.owner,
  ...overrides,
});

const makeAttachment = (overrides: Partial<AttachmentDescriptor> = {}): AttachmentDescriptor => ({
  id: ids.resources.attachment,
  status: AttachmentStatusCode.active,
  secretLevel: SecretLevelCode.internal,
  uploaderId: ids.users.owner,
  ...overrides,
});

const createSensitiveServices = () => {
  const rbacPolicy = new RbacPolicyService();
  const resourceGrantPolicy = new ResourceGrantPolicyService();
  const secretAccessPolicy = new SecretAccessPolicyService(resourceGrantPolicy);
  const attachmentAccessPolicy = new AttachmentAccessPolicyService(
    rbacPolicy,
    resourceGrantPolicy,
  );
  const auditReadPolicy = new AuditReadPolicyService(rbacPolicy);
  const auditRedactor = new AuditRedactorService();

  return {
    resourceGrantPolicy,
    secretAccessPolicy,
    attachmentAccessPolicy,
    auditReadPolicy,
    auditRedactor,
  };
};

describe("ResourceGrantPolicyService", () => {
  it("allows an active user grant for the exact resource and grant type", () => {
    const { resourceGrantPolicy } = createSensitiveServices();

    expect(
      resourceGrantPolicy.hasEffectiveGrant(makeContext(), [makeGrant()], {
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.resources.achievement,
        grantType: GrantTypeCode.secretRead,
      }, now).effect,
    ).toBe("ALLOW");
  });

  it("denies revoked, expired, future, wrong-resource, and wrong-grant records", () => {
    const { resourceGrantPolicy } = createSensitiveServices();
    const inactiveGrants = [
      makeGrant({ status: GrantStatusCode.revoked }),
      makeGrant({ revokedAt: "2026-06-09T08:00:00.000Z" }),
      makeGrant({ expiresAt: "2026-06-10T08:00:00.000Z" }),
      makeGrant({ startsAt: "2026-06-11T08:00:00.000Z" }),
      makeGrant({ resourceId: "60000000-0000-4000-8000-000000000099" }),
      makeGrant({ grantType: GrantTypeCode.attachmentDownload }),
    ];

    expect(
      resourceGrantPolicy.hasEffectiveGrant(makeContext(), inactiveGrants, {
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.resources.achievement,
        grantType: GrantTypeCode.secretRead,
      }, now).effect,
    ).toBe("DENY");
  });

  it("matches ROLE grants through UserContext roleIds", () => {
    const { resourceGrantPolicy } = createSensitiveServices();

    expect(
      resourceGrantPolicy.hasEffectiveGrant(
        makeContext({ roleIds: [ids.roles.auditor] }),
        [makeGrant({ granteeType: GranteeTypeCode.role, granteeId: ids.roles.auditor })],
        {
          resourceType: ResourceTypeCode.achievement,
          resourceId: ids.resources.achievement,
          grantType: GrantTypeCode.secretRead,
        },
        now,
      ).effect,
    ).toBe("ALLOW");
  });

  it("matches DEPARTMENT grants only against the current departmentId", () => {
    const { resourceGrantPolicy } = createSensitiveServices();
    const context = makeContext({
      departmentId: ids.departments.ai,
      scopedDepartmentIds: [ids.departments.materials],
    });
    const departmentGrant = makeGrant({
      granteeType: GranteeTypeCode.department,
      granteeId: ids.departments.materials,
    });

    expect(
      resourceGrantPolicy.hasEffectiveGrant(context, [departmentGrant], {
        resourceType: ResourceTypeCode.achievement,
        resourceId: ids.resources.achievement,
        grantType: GrantTypeCode.secretRead,
      }, now).effect,
    ).toBe("DENY");
  });
});

describe("SecretAccessPolicyService dependency injection", () => {
  it("declares explicit ResourceGrantPolicyService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(SecretAccessPolicyService)).toEqual([
      ResourceGrantPolicyService,
    ]);
  });
});

describe("AttachmentAccessPolicyService dependency injection", () => {
  it("declares explicit policy service injection tokens for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AttachmentAccessPolicyService)).toEqual([
      RbacPolicyService,
      ResourceGrantPolicyService,
    ]);
  });
});

describe("AuditReadPolicyService dependency injection", () => {
  it("declares explicit RbacPolicyService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AuditReadPolicyService)).toEqual([RbacPolicyService]);
  });
});

describe("SecretAccessPolicyService", () => {
  it("allows non-restricted resources after base access is granted", () => {
    const { secretAccessPolicy } = createSensitiveServices();

    expect(
      secretAccessPolicy.canReadResource(
        makeContext(),
        makeParentResource({ secretLevel: SecretLevelCode.internal }),
        allowDecision("base"),
        [],
        now,
      ).effect,
    ).toBe("ALLOW");
  });

  it("denies when base resource access is denied", () => {
    const { secretAccessPolicy } = createSensitiveServices();

    expect(
      secretAccessPolicy.canReadResource(
        makeContext(),
        makeParentResource({ secretLevel: SecretLevelCode.public }),
        denyDecision("base denied"),
        [makeGrant()],
        now,
      ).effect,
    ).toBe("DENY");
  });

  it("does not let the owner read SECRET or CONFIDENTIAL resources without SECRET_READ", () => {
    const { secretAccessPolicy } = createSensitiveServices();
    const ownerContext = makeContext({ userId: ids.users.owner });

    expect(
      secretAccessPolicy.canReadResource(
        ownerContext,
        makeParentResource({ ownerUserId: ids.users.owner }),
        allowDecision("base"),
        [],
        now,
      ).effect,
    ).toBe("DENY");
  });

  it("allows restricted resources with an effective SECRET_READ grant", () => {
    const { secretAccessPolicy } = createSensitiveServices();

    expect(
      secretAccessPolicy.canReadResource(
        makeContext(),
        makeParentResource({ secretLevel: SecretLevelCode.confidential }),
        allowDecision("base"),
        [makeGrant()],
        now,
      ).effect,
    ).toBe("ALLOW");
  });
});

describe("AttachmentAccessPolicyService", () => {
  it("allows active attachment metadata with metadata permission and parent access", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.attachmentReadMetadata],
    });

    expect(
      attachmentAccessPolicy.canReadMetadata(
        context,
        makeAttachment(),
        makeParentResource({ secretLevel: SecretLevelCode.internal }),
        allowDecision("parent"),
        [],
        now,
      ).effect,
    ).toBe("ALLOW");
  });

  it("denies metadata when the static metadata permission is missing", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();

    expect(
      attachmentAccessPolicy.canReadMetadata(
        makeContext(),
        makeAttachment(),
        makeParentResource(),
        allowDecision("parent"),
        [],
        now,
      ).effect,
    ).toBe("DENY");
  });

  it("denies metadata and download for inactive attachments", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();
    const context = makeContext({
      permissionCodes: [
        PermissionCode.attachmentReadMetadata,
        PermissionCode.attachmentDownload,
      ],
    });
    const blockedAttachment = makeAttachment({ status: AttachmentStatusCode.blocked });

    expect(
      attachmentAccessPolicy.canReadMetadata(
        context,
        blockedAttachment,
        makeParentResource(),
        allowDecision("parent"),
        [makeGrant()],
        now,
      ).effect,
    ).toBe("DENY");
    expect(
      attachmentAccessPolicy.canDownload(
        context,
        blockedAttachment,
        makeParentResource(),
        allowDecision("parent"),
        [makeAttachmentDownloadGrant()],
        now,
      ).effect,
    ).toBe("DENY");
  });

  it("requires SECRET_READ for secret attachment metadata", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.attachmentReadMetadata],
    });

    expect(
      attachmentAccessPolicy.canReadMetadata(
        context,
        makeAttachment({ secretLevel: SecretLevelCode.secret }),
        makeParentResource(),
        allowDecision("parent"),
        [],
        now,
      ).effect,
    ).toBe("DENY");

    expect(
      attachmentAccessPolicy.canReadMetadata(
        context,
        makeAttachment({ secretLevel: SecretLevelCode.secret }),
        makeParentResource(),
        allowDecision("parent"),
        [makeGrant()],
        now,
      ).effect,
    ).toBe("ALLOW");
  });

  it("allows public/internal downloads with download permission and parent access", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.attachmentDownload],
    });

    expect(
      attachmentAccessPolicy.canDownload(
        context,
        makeAttachment({ secretLevel: SecretLevelCode.internal }),
        makeParentResource({ secretLevel: SecretLevelCode.internal }),
        allowDecision("parent"),
        [],
        now,
      ).effect,
    ).toBe("ALLOW");
  });

  it("requires SECRET_READ or direct ATTACHMENT_DOWNLOAD for secret attachment downloads", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.attachmentDownload],
    });
    const secretAttachment = makeAttachment({ secretLevel: SecretLevelCode.secret });

    expect(
      attachmentAccessPolicy.canDownload(
        context,
        secretAttachment,
        makeParentResource(),
        allowDecision("parent"),
        [],
        now,
      ).effect,
    ).toBe("DENY");

    expect(
      attachmentAccessPolicy.canDownload(
        context,
        secretAttachment,
        makeParentResource(),
        allowDecision("parent"),
        [makeGrant()],
        now,
      ).effect,
    ).toBe("ALLOW");
  });

  it("allows a direct ATTACHMENT_DOWNLOAD grant for one attachment without parent access", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();
    const context = makeContext({
      permissionCodes: [PermissionCode.attachmentDownload],
    });

    expect(
      attachmentAccessPolicy.canDownload(
        context,
        makeAttachment({ secretLevel: SecretLevelCode.secret }),
        makeParentResource(),
        denyDecision("parent denied"),
        [makeAttachmentDownloadGrant()],
        now,
      ).effect,
    ).toBe("ALLOW");
  });

  it("does not let ATTACHMENT_DOWNLOAD grant read metadata or other attachments", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();
    const context = makeContext({
      permissionCodes: [
        PermissionCode.attachmentReadMetadata,
        PermissionCode.attachmentDownload,
      ],
    });

    expect(
      attachmentAccessPolicy.canReadMetadata(
        context,
        makeAttachment({ secretLevel: SecretLevelCode.secret }),
        makeParentResource(),
        allowDecision("parent"),
        [makeAttachmentDownloadGrant()],
        now,
      ).effect,
    ).toBe("DENY");
    expect(
      attachmentAccessPolicy.canDownload(
        context,
        makeAttachment({
          id: "70000000-0000-4000-8000-000000000099",
          secretLevel: SecretLevelCode.secret,
        }),
        makeParentResource(),
        denyDecision("parent denied"),
        [makeAttachmentDownloadGrant()],
        now,
      ).effect,
    ).toBe("DENY");
  });

  it("still requires static download permission when a direct grant exists", () => {
    const { attachmentAccessPolicy } = createSensitiveServices();

    expect(
      attachmentAccessPolicy.canDownload(
        makeContext(),
        makeAttachment({ secretLevel: SecretLevelCode.secret }),
        makeParentResource(),
        denyDecision("parent denied"),
        [makeAttachmentDownloadGrant()],
        now,
      ).effect,
    ).toBe("DENY");
  });
});

describe("AuditReadPolicyService", () => {
  it("allows masked audit reads only with audit:read_masked permission", () => {
    const { auditReadPolicy } = createSensitiveServices();

    expect(
      auditReadPolicy.canReadMaskedAudit(
        makeContext({ permissionCodes: [PermissionCode.auditReadMasked] }),
      ).effect,
    ).toBe("ALLOW");
    expect(auditReadPolicy.canReadMaskedAudit(makeContext()).effect).toBe("DENY");
  });

  it("always denies unmasked audit reads", () => {
    const { auditReadPolicy } = createSensitiveServices();

    expect(auditReadPolicy.canReadUnmaskedAudit().effect).toBe("DENY");
  });
});

describe("AuditRedactorService", () => {
  it("does not return raw oldValue, newValue, ipAddress, or userAgent fields", () => {
    const { auditRedactor } = createSensitiveServices();
    const masked = auditRedactor.redactAuditLog({
      id: "80000000-0000-4000-8000-000000000001",
      actorUserId: ids.users.researcher,
      action: "UPDATE",
      targetType: "ACHIEVEMENT",
      targetId: ids.resources.achievement,
      oldValue: { title: "Original title" },
      newValue: { title: "New title" },
      ipAddress: "192.0.2.1",
      userAgent: "browser details",
      createdAt: now,
    });

    expect("oldValue" in masked).toBe(false);
    expect("newValue" in masked).toBe(false);
    expect("ipAddress" in masked).toBe(false);
    expect("userAgent" in masked).toBe(false);
    expect(masked.ipAddressMasked).toBe("[REDACTED_IP]");
    expect(masked.userAgentMasked).toBe("[REDACTED_USER_AGENT]");
  });

  it("keeps safe field names and safe scalar values while hiding business values", () => {
    const { auditRedactor } = createSensitiveServices();

    expect(
      auditRedactor.redactValue({
        id: ids.resources.achievement,
        ownerUserId: ids.users.owner,
        status: "SUBMITTED",
        action: "UPDATE",
        secretLevel: "SECRET",
        createdAt: now,
        title: "Sensitive project title",
        description: "Sensitive details",
      }),
    ).toEqual({
      id: ids.resources.achievement,
      ownerUserId: ids.users.owner,
      status: "SUBMITTED",
      action: "UPDATE",
      secretLevel: "SECRET",
      createdAt: "2026-06-10T08:00:00.000Z",
      title: "[REDACTED]",
      description: "[REDACTED]",
    });
  });

  it("marks known sensitive keys as sensitive instead of returning their values", () => {
    const { auditRedactor } = createSensitiveServices();

    expect(
      auditRedactor.redactValue({
        storageKey: "object-store/key",
        checksum: "checksum-value",
        passwordHash: "hash",
        apiKey: "api-key",
        databaseUrl: "postgres://example",
        configRef: "secret-config-ref",
      }),
    ).toEqual({
      storageKey: "[REDACTED_SENSITIVE]",
      checksum: "[REDACTED_SENSITIVE]",
      passwordHash: "[REDACTED_SENSITIVE]",
      apiKey: "[REDACTED_SENSITIVE]",
      databaseUrl: "[REDACTED_SENSITIVE]",
      configRef: "[REDACTED_SENSITIVE]",
    });
  });

  it("redacts nested objects and arrays without mutating the source value", () => {
    const { auditRedactor } = createSensitiveServices();
    const source = {
      reviewers: [
        {
          reviewerUserId: ids.users.researcher,
          comment: "private review note",
        },
      ],
      tags: ["commercial", "partner"],
    };

    expect(auditRedactor.redactValue(source)).toEqual({
      reviewers: [
        {
          reviewerUserId: ids.users.researcher,
          comment: "[REDACTED]",
        },
      ],
      tags: ["[REDACTED]", "[REDACTED]"],
    });
    expect(source.reviewers[0]?.comment).toBe("private review note");
  });
});

const makeAttachmentDownloadGrant = (
  overrides: Partial<ResourceAccessGrantRecord> = {},
): ResourceAccessGrantRecord =>
  makeGrant({
    resourceType: ResourceTypeCode.attachment,
    resourceId: ids.resources.attachment,
    grantType: GrantTypeCode.attachmentDownload,
    ...overrides,
  });
