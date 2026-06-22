import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it, vi } from "vitest";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { PrismaService } from "../database/prisma.service";
import { AuditRepository, AuditTransactionClient } from "./audit.repository";
import { AuditActionCode } from "./domain/audit-action-code";
import { AuditTargetTypeCode } from "./domain/audit-target-type-code";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  actor: "40000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  achievement: "30000000-0000-4000-8000-000000000001",
};

const createdAt = new Date("2026-01-01T00:00:00.000Z");

const makeAuditLog = () => ({
  id: "90000000-0000-4000-8000-000000000001",
  actorUserId: ids.actor,
  actorDepartmentId: ids.department,
  action: AuditActionCode.submit,
  targetType: AuditTargetTypeCode.achievement,
  targetId: ids.achievement,
  targetDepartmentId: ids.department,
  targetSecretLevel: SecretLevelCode.internal,
  oldValue: { status: "DRAFT" },
  newValue: { status: "SUBMITTED" },
  ipAddress: null,
  userAgent: null,
  traceId: "trace-001",
  createdAt,
});

const createFakePrisma = () => {
  const tx = {
    auditLog: {
      create: vi.fn().mockResolvedValue(makeAuditLog()),
    },
  };

  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    auditLog: {
      findMany: vi.fn().mockResolvedValue([makeAuditLog()]),
    },
  };

  return { prisma, tx };
};

const createRepository = () => {
  const { prisma, tx } = createFakePrisma();
  const repository = new AuditRepository(prisma as unknown as PrismaService);

  return { repository, prisma, tx };
};

describe("AuditRepository dependency injection", () => {
  it("declares explicit PrismaService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(AuditRepository)).toEqual([PrismaService]);
  });
});

describe("AuditRepository.create", () => {
  it("creates an audit log in a repository-owned transaction", async () => {
    const { repository, prisma, tx } = createRepository();

    await repository.create({
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.submit,
      target: {
        type: AuditTargetTypeCode.achievement,
        id: ids.achievement,
        departmentId: ids.department,
        secretLevel: SecretLevelCode.internal,
      },
      oldValue: { status: "DRAFT" },
      newValue: {
        status: "SUBMITTED",
        version: 2,
        fileName: "paper.pdf",
      },
      traceId: "trace-001",
      createdAt,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: ids.actor,
        actorDepartmentId: ids.department,
        action: AuditActionCode.submit,
        targetType: AuditTargetTypeCode.achievement,
        targetId: ids.achievement,
        targetDepartmentId: ids.department,
        targetSecretLevel: SecretLevelCode.internal,
        oldValue: {
          status: "DRAFT",
        },
        newValue: {
          status: "SUBMITTED",
          version: 2,
          fileName: "paper.pdf",
        },
        traceId: "trace-001",
        createdAt,
      }),
    });
  });

  it("can create an audit log with a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();
    const transactionClient = tx as unknown as AuditTransactionClient;

    await repository.createInTransaction(transactionClient, {
      actor: { userId: ids.actor, departmentId: ids.department },
      action: AuditActionCode.approve,
      target: { type: AuditTargetTypeCode.workflowTask, id: ids.achievement },
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: ids.actor,
        actorDepartmentId: ids.department,
        action: AuditActionCode.approve,
        targetType: AuditTargetTypeCode.workflowTask,
        targetId: ids.achievement,
        targetDepartmentId: null,
        targetSecretLevel: null,
      }),
    });
  });

  it("does not expose update or delete mutation helpers", () => {
    const { repository } = createRepository();
    const multiChangeMethod = ["update", "Many"].join("");
    const multiRemoveMethod = ["delete", "Many"].join("");

    expect("update" in repository).toBe(false);
    expect(multiChangeMethod in repository).toBe(false);
    expect("delete" in repository).toBe(false);
    expect(multiRemoveMethod in repository).toBe(false);
  });
});

describe("AuditRepository.findMany", () => {
  it("finds audit logs with masked-query filters and default ordering", async () => {
    const { repository, prisma } = createRepository();
    const createdFrom = new Date("2026-01-01T00:00:00.000Z");
    const createdTo = new Date("2026-01-31T23:59:59.999Z");

    await repository.findMany({
      actorUserId: ids.actor,
      actorDepartmentId: ids.department,
      action: AuditActionCode.submit,
      targetType: AuditTargetTypeCode.achievement,
      targetId: ids.achievement,
      targetDepartmentId: ids.department,
      traceId: "trace-001",
      createdFrom,
      createdTo,
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        actorUserId: ids.actor,
        actorDepartmentId: ids.department,
        action: AuditActionCode.submit,
        targetType: AuditTargetTypeCode.achievement,
        targetId: ids.achievement,
        targetDepartmentId: ids.department,
        traceId: "trace-001",
        createdAt: {
          gte: createdFrom,
          lte: createdTo,
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    });
  });

  it("honors an explicit take value without count", async () => {
    const { repository, prisma } = createRepository();

    await repository.findMany({ take: 10 });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
    });
  });
});
