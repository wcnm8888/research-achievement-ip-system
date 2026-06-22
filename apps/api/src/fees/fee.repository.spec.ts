import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { AchievementStatusCode } from "../achievements/domain/achievement-domain.types";
import { PrismaService } from "../database/prisma.service";
import { FeeRepository, FeeTransactionClient } from "./fee.repository";
import { FeeStatusTransitionConflictError } from "./domain/fee-repository.errors";
import { FeeTypeCode, FundSourceCode, PayStatusCode } from "./domain/fee-domain.types";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  feeRecord: "80000000-0000-4000-8000-000000000001",
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  user: "40000000-0000-4000-8000-000000000001",
};

const createdAt = new Date("2026-06-01T00:00:00.000Z");
const updatedAt = new Date("2026-06-01T00:00:00.000Z");
const dueDate = new Date("2026-07-01T00:00:00.000Z");

const makeRow = () => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  fundSource: FundSourceCode.department,
  amount: new Prisma.Decimal("1200.50"),
  dueDate,
  paidDate: null,
  payStatus: PayStatusCode.pending,
  voucherNo: null,
  createdById: ids.user,
  updatedById: ids.user,
  createdAt,
  updatedAt,
  archivedAt: null,
});

const makeStateRow = () => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  feeType: FeeTypeCode.patentAnnual,
  dueDate,
  paidDate: null,
  payStatus: PayStatusCode.pending,
  voucherNo: null,
  updatedById: ids.user,
  archivedAt: null,
});

const makeAchievementParentRow = () => ({
  id: ids.achievement,
  status: AchievementStatusCode.archived,
  departmentId: ids.department,
  ownerUserId: ids.user,
  secretLevel: SecretLevelCode.internal,
});

const createFakePrisma = () => {
  const tx = {
    feeRecord: {
      create: vi.fn().mockResolvedValue(makeRow()),
      findFirst: vi.fn().mockResolvedValue(makeStateRow()),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(makeStateRow()),
    },
  };

  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    feeRecord: {
      findMany: vi.fn().mockResolvedValue([makeRow()]),
      findFirst: vi.fn().mockResolvedValue(makeRow()),
    },
    achievement: {
      findFirst: vi.fn().mockResolvedValue(makeAchievementParentRow()),
    },
  };

  return { prisma, tx };
};

const createRepository = () => {
  const { prisma, tx } = createFakePrisma();
  const repository = new FeeRepository(prisma as unknown as PrismaService);

  return { repository, prisma, tx };
};

describe("FeeRepository dependency injection", () => {
  it("declares explicit PrismaService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(FeeRepository)).toEqual([PrismaService]);
  });
});

describe("FeeRepository.create", () => {
  it("creates fee records in a repository-owned transaction", async () => {
    const { repository, prisma, tx } = createRepository();

    const result = await repository.create({
      achievementId: ids.achievement,
      departmentId: ids.department,
      feeType: FeeTypeCode.patentAnnual,
      fundSource: FundSourceCode.department,
      amount: "1200.50",
      dueDate,
      voucherNo: "V-001",
      createdById: ids.user,
      updatedById: ids.user,
      createdAt,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.feeRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        achievementId: ids.achievement,
        departmentId: ids.department,
        feeType: FeeTypeCode.patentAnnual,
        fundSource: FundSourceCode.department,
        amount: "1200.50",
        dueDate,
        voucherNo: "V-001",
      }),
    });
    expect(result).toEqual(expect.objectContaining({ id: ids.feeRecord }));
  });

  it("can create fee records with a caller-provided transaction client", async () => {
    const { repository, prisma, tx } = createRepository();

    await repository.createInTransaction(tx as unknown as FeeTransactionClient, {
      achievementId: ids.achievement,
      departmentId: ids.department,
      feeType: FeeTypeCode.agency,
      amount: 500,
      dueDate,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.feeRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        feeType: FeeTypeCode.agency,
        fundSource: null,
        voucherNo: null,
        createdById: null,
        updatedById: null,
      }),
    });
  });

  it("does not expose broad mutation or removal helpers", () => {
    const { repository } = createRepository();
    const multiChangeMethod = ["update", "Many"].join("");
    const multiRemoveMethod = ["delete", "Many"].join("");

    expect("update" in repository).toBe(false);
    expect(multiChangeMethod in repository).toBe(false);
    expect("delete" in repository).toBe(false);
    expect(multiRemoveMethod in repository).toBe(false);
  });
});

describe("FeeRepository reads", () => {
  it("finds fee records with policy where, active filter, and stable ordering", async () => {
    const { repository, prisma } = createRepository();

    await repository.findMany({
      where: { departmentId: { in: [ids.department] } },
      feeType: FeeTypeCode.patentAnnual,
      payStatus: PayStatusCode.pending,
      take: 20,
    });

    expect(prisma.feeRecord.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { departmentId: { in: [ids.department] } },
          { feeType: FeeTypeCode.patentAnnual },
          { payStatus: PayStatusCode.pending },
          { archivedAt: null },
        ],
      },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: 20,
    });
  });

  it("finds a fee record by id through caller-provided policy where", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.findByIdWhere(ids.feeRecord, { departmentId: { in: [ids.department] } }),
    ).resolves.toEqual(expect.objectContaining({ id: ids.feeRecord }));

    expect(prisma.feeRecord.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: ids.feeRecord },
          { departmentId: { in: [ids.department] } },
          { archivedAt: null },
        ],
      },
    });
  });

  it("finds fee state with a caller-provided policy where", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.findStateByIdWhere(ids.feeRecord, {
        departmentId: { in: [ids.department] },
      }),
    ).resolves.toEqual(expect.objectContaining({ payStatus: PayStatusCode.pending }));

    expect(prisma.feeRecord.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: ids.feeRecord },
          { departmentId: { in: [ids.department] } },
          { archivedAt: null },
        ],
      },
      select: expect.objectContaining({ payStatus: true, dueDate: true }),
    });
  });

  it("finds achievement parent facts through caller-provided Achievement scope", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.findAchievementParentByIdWhere(ids.achievement, {
        departmentId: { in: [ids.department] },
      }),
    ).resolves.toEqual(makeAchievementParentRow());

    expect(prisma.achievement.findFirst).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: ids.achievement },
          { departmentId: { in: [ids.department] } },
        ],
      },
      select: expect.objectContaining({
        id: true,
        departmentId: true,
        secretLevel: true,
      }),
    });
  });
});

describe("FeeRepository.transitionPayStatus", () => {
  it("transitions pay status using optimistic status guard", async () => {
    const { repository, prisma, tx } = createRepository();
    const paidDate = new Date("2026-06-18T00:00:00.000Z");

    await repository.transitionPayStatus({
      feeRecordId: ids.feeRecord,
      expectedStatus: PayStatusCode.pending,
      nextStatus: PayStatusCode.paid,
      paidDate,
      voucherNo: "PAY-001",
      updatedById: ids.user,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.feeRecord.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.feeRecord,
        payStatus: PayStatusCode.pending,
        archivedAt: null,
      },
      data: expect.objectContaining({
        payStatus: PayStatusCode.paid,
        paidDate,
        voucherNo: "PAY-001",
        updatedById: ids.user,
      }),
    });
    expect(tx.feeRecord.findUnique).toHaveBeenCalledWith({
      where: { id: ids.feeRecord },
      select: expect.objectContaining({ payStatus: true }),
    });
  });

  it("maps stale status updates to a transition conflict", async () => {
    const { repository, tx } = createRepository();
    tx.feeRecord.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.transitionPayStatus({
        feeRecordId: ids.feeRecord,
        expectedStatus: PayStatusCode.pending,
        nextStatus: PayStatusCode.paid,
      }),
    ).rejects.toBeInstanceOf(FeeStatusTransitionConflictError);
  });
});
