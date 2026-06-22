import { describe, expect, it, vi } from "vitest";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { AuditReadPolicyService } from "../authorization/policy/audit-read-policy.service";
import { AuditRedactorService } from "../authorization/policy/audit-redactor.service";
import {
  allowDecision,
  denyDecision,
} from "../authorization/policy/policy-decision";
import { UserContext } from "../identity/user-context";
import { AuditRepository, AuditTransactionClient } from "./audit.repository";
import { AuditService } from "./audit.service";
import { AuditActionCode } from "./domain/audit-action-code";
import { AuditAccessDeniedError } from "./domain/audit-errors";
import { AuditTargetTypeCode } from "./domain/audit-target-type-code";

const ids = {
  actor: "40000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  achievement: "30000000-0000-4000-8000-000000000001",
  auditLog: "90000000-0000-4000-8000-000000000001",
};

const context: UserContext = {
  userId: ids.actor,
  departmentId: ids.department,
  roleIds: [],
  roleCodes: [RoleCode.systemAdmin],
  permissionCodes: [PermissionCode.auditReadMasked],
  roleScopes: [],
  scopedDepartmentIds: [ids.department],
};

const makeAuditLogRecord = () => ({
  id: ids.auditLog,
  actorUserId: ids.actor,
  actorDepartmentId: ids.department,
  action: AuditActionCode.submit,
  targetType: AuditTargetTypeCode.achievement,
  targetId: ids.achievement,
  targetDepartmentId: ids.department,
  targetSecretLevel: SecretLevelCode.internal,
  oldValue: {
    status: "DRAFT",
    credential: "raw-credential",
    token: "raw-token",
    cookie: "raw-cookie",
    password: "raw-password",
    apiKey: "raw-api-key",
    storageKey: "raw-storage-key",
    checksum: "raw-checksum",
    configRef: "raw-config-ref",
  },
  newValue: {
    status: "SUBMITTED",
    credential: "raw-credential",
    token: "raw-token",
    cookie: "raw-cookie",
    password: "raw-password",
    apiKey: "raw-api-key",
    storageKey: "raw-storage-key",
    checksum: "raw-checksum",
    configRef: "raw-config-ref",
    secretLevel: SecretLevelCode.internal,
  },
  ipAddress: "10.0.0.1",
  userAgent: "Full browser user agent",
  traceId: "trace-001",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
});

const createService = () => {
  const repository = {
    create: vi.fn().mockResolvedValue(makeAuditLogRecord()),
    createInTransaction: vi.fn().mockResolvedValue(makeAuditLogRecord()),
    findMany: vi.fn().mockResolvedValue([makeAuditLogRecord()]),
  } as unknown as AuditRepository;

  const readPolicy = {
    canReadMaskedAudit: vi.fn().mockReturnValue(allowDecision("allowed")),
  } as unknown as AuditReadPolicyService;

  const service = new AuditService(
    repository,
    readPolicy,
    new AuditRedactorService(),
  );

  return { service, repository, readPolicy };
};

describe("AuditService.recordEvent", () => {
  it("records an append-only audit event through the repository", async () => {
    const { service, repository } = createService();

    await service.recordEvent({
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.submit,
      target: {
        type: AuditTargetTypeCode.achievement,
        id: ids.achievement,
        departmentId: ids.department,
        secretLevel: SecretLevelCode.internal,
      },
      oldValue: { status: "DRAFT" },
      newValue: { status: "SUBMITTED", version: 2 },
      traceId: "trace-001",
    });

    expect(repository.create).toHaveBeenCalledWith({
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.submit,
      target: {
        type: AuditTargetTypeCode.achievement,
        id: ids.achievement,
        departmentId: ids.department,
        secretLevel: SecretLevelCode.internal,
      },
      oldValue: { status: "DRAFT" },
      newValue: { status: "SUBMITTED", version: 2 },
      traceId: "trace-001",
    });
    expect("update" in service).toBe(false);
    expect("delete" in service).toBe(false);
  });

  it("records an audit event with a caller-provided transaction client", async () => {
    const { service, repository } = createService();
    const client = { auditLog: { create: vi.fn() } } as unknown as AuditTransactionClient;

    await service.recordEventInTransaction(client, {
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.approve,
      target: { type: AuditTargetTypeCode.workflowTask, id: ids.achievement },
    });

    expect(repository.createInTransaction).toHaveBeenCalledWith(client, {
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.approve,
      target: { type: AuditTargetTypeCode.workflowTask, id: ids.achievement },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("redacts change summaries before handing them to the repository", async () => {
    const { service, repository } = createService();

    await service.recordEvent({
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.update,
      target: { type: AuditTargetTypeCode.achievement, id: ids.achievement },
      oldValue: { status: "DRAFT", credential: "raw-value" },
      newValue: { status: "SUBMITTED", credential: "raw-value" },
    });

    expect(repository.create).toHaveBeenCalledWith({
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.update,
      target: { type: AuditTargetTypeCode.achievement, id: ids.achievement },
      oldValue: { status: "DRAFT", credential: "[REDACTED_SENSITIVE]" },
      newValue: { status: "SUBMITTED", credential: "[REDACTED_SENSITIVE]" },
    });
  });
});

describe("AuditService.listMasked", () => {
  it("requires masked audit read permission before querying", async () => {
    const { service, repository, readPolicy } = createService();
    vi.mocked(readPolicy.canReadMaskedAudit).mockReturnValueOnce(
      denyDecision("missing permission", [PermissionCode.auditReadMasked]),
    );

    await expect(service.listMasked(context, {})).rejects.toBeInstanceOf(
      AuditAccessDeniedError,
    );
    expect(repository.findMany).not.toHaveBeenCalled();
  });

  it("returns only redacted audit data and never exposes raw sensitive fields", async () => {
    const { service, repository, readPolicy } = createService();

    const result = await service.listMasked(context, {
      targetType: AuditTargetTypeCode.achievement,
      targetId: ids.achievement,
    });

    expect(readPolicy.canReadMaskedAudit).toHaveBeenCalledWith(context);
    expect(repository.findMany).toHaveBeenCalledWith({
      targetType: AuditTargetTypeCode.achievement,
      targetId: ids.achievement,
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        id: ids.auditLog,
        actorUserId: ids.actor,
        actorDepartmentId: ids.department,
        action: AuditActionCode.submit,
        targetType: AuditTargetTypeCode.achievement,
        targetId: ids.achievement,
        targetDepartmentId: ids.department,
        targetSecretLevel: SecretLevelCode.internal,
        traceId: "trace-001",
        ipAddressMasked: "[REDACTED_IP]",
        userAgentMasked: "[REDACTED_USER_AGENT]",
      }),
    ]);
    expect(result.items[0]).not.toHaveProperty("oldValue");
    expect(result.items[0]).not.toHaveProperty("newValue");
    expect(result.items[0]).not.toHaveProperty("ipAddress");
    expect(result.items[0]).not.toHaveProperty("userAgent");
    const item = result.items[0]!;
    expect(item.oldValueMasked).toEqual({
      status: "DRAFT",
      credential: "[REDACTED_SENSITIVE]",
      token: "[REDACTED_SENSITIVE]",
      cookie: "[REDACTED_SENSITIVE]",
      password: "[REDACTED_SENSITIVE]",
      apiKey: "[REDACTED_SENSITIVE]",
      storageKey: "[REDACTED_SENSITIVE]",
      checksum: "[REDACTED_SENSITIVE]",
      configRef: "[REDACTED_SENSITIVE]",
    });
    expect(item.newValueMasked).toEqual({
      status: "SUBMITTED",
      credential: "[REDACTED_SENSITIVE]",
      token: "[REDACTED_SENSITIVE]",
      cookie: "[REDACTED_SENSITIVE]",
      password: "[REDACTED_SENSITIVE]",
      apiKey: "[REDACTED_SENSITIVE]",
      storageKey: "[REDACTED_SENSITIVE]",
      checksum: "[REDACTED_SENSITIVE]",
      configRef: "[REDACTED_SENSITIVE]",
      secretLevel: SecretLevelCode.internal,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("raw-credential");
    expect(serialized).not.toContain("raw-token");
    expect(serialized).not.toContain("raw-cookie");
    expect(serialized).not.toContain("raw-password");
    expect(serialized).not.toContain("raw-api-key");
    expect(serialized).not.toContain("raw-storage-key");
    expect(serialized).not.toContain("raw-checksum");
    expect(serialized).not.toContain("raw-config-ref");
  });
});
