import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { DepartmentStatus, Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { SecretLevelCode } from "../authorization/constants/secret-level-code";
import { AchievementStatusCode } from "../achievements/domain/achievement-domain.types";
import { PrismaService } from "../database/prisma.service";
import { FeeRepository, FeeTransactionClient } from "./fee.repository";
import {
  FeeReviewTransitionConflictError,
  FeeStatusTransitionConflictError,
} from "./domain/fee-repository.errors";
import {
  FeeReviewHistoryActionCode,
  FeeReviewStatusCode,
  FeeTypeCode,
  FeeWarningTypeCode,
  FundSourceCode,
  PayStatusCode,
} from "./domain/fee-domain.types";

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
  reviewer: "40000000-0000-4000-8000-000000000002",
};

const createdAt = new Date("2026-06-01T00:00:00.000Z");
const updatedAt = new Date("2026-06-01T00:00:00.000Z");
const dueDate = new Date("2026-07-01T00:00:00.000Z");
const reviewedAt = new Date("2026-06-22T00:00:00.000Z");

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
  reviewStatus: FeeReviewStatusCode.pending,
  reviewedById: null,
  reviewedAt: null,
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
  reviewStatus: FeeReviewStatusCode.pending,
  reviewedById: null,
  reviewedAt: null,
  updatedById: ids.user,
  archivedAt: null,
});

const makeAchievementParentRow = () => ({
  id: ids.achievement,
  status: AchievementStatusCode.archived,
  departmentId: ids.department,
  department: {
    status: DepartmentStatus.ACTIVE,
    archivedAt: null,
  },
  ownerUserId: ids.user,
  secretLevel: SecretLevelCode.internal,
});

const makeReviewHistoryRow = () => ({
  id: "81000000-0000-4000-8000-000000000001",
  feeRecordId: ids.feeRecord,
  departmentId: ids.department,
  reviewerId: ids.reviewer,
  action: FeeReviewHistoryActionCode.approve,
  fromStatus: FeeReviewStatusCode.pending,
  toStatus: FeeReviewStatusCode.approved,
  reason: "finance checked",
  createdAt: reviewedAt,
});

const createFakePrisma = () => {
  const tx = {
    feeRecord: {
      create: vi.fn().mockResolvedValue(makeRow()),
      findFirst: vi.fn().mockResolvedValue(makeStateRow()),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue(makeStateRow()),
    },
    feeReviewHistory: {
      create: vi.fn().mockResolvedValue(makeReviewHistoryRow()),
    },
  };

  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    feeRecord: {
      findMany: vi.fn().mockResolvedValue([makeRow()]),
      findFirst: vi.fn().mockResolvedValue(makeRow()),
    },
    feeReviewHistory: {
      findMany: vi.fn().mockResolvedValue([makeReviewHistoryRow()]),
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

  it("maps the default pending review contract when creating fee records", async () => {
    const { repository } = createRepository();

    const result = await repository.create({
      achievementId: ids.achievement,
      departmentId: ids.department,
      feeType: FeeTypeCode.patentAnnual,
      amount: "1200.50",
      dueDate,
    });

    expect(result).toEqual(
      expect.objectContaining({
        reviewStatus: FeeReviewStatusCode.pending,
        reviewedById: null,
        reviewedAt: null,
      }),
    );
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

  it("normalizes HTTP date strings before writing fee records", async () => {
    const { repository, tx } = createRepository();

    await repository.createInTransaction(tx as unknown as FeeTransactionClient, {
      achievementId: ids.achievement,
      departmentId: ids.department,
      feeType: FeeTypeCode.patentAnnual,
      amount: 1200.5,
      dueDate: "2026-07-01",
    });

    expect(tx.feeRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dueDate: new Date("2026-07-01"),
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
    prisma.feeRecord.findFirst.mockResolvedValueOnce({
      ...makeRow(),
      reviewStatus: FeeReviewStatusCode.approved,
      reviewedById: ids.reviewer,
      reviewedAt,
    });

    await expect(
      repository.findByIdWhere(ids.feeRecord, { departmentId: { in: [ids.department] } }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: ids.feeRecord,
        reviewStatus: FeeReviewStatusCode.approved,
        reviewedById: ids.reviewer,
        reviewedAt,
      }),
    );

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

  it("finds active due warnings with pending/overdue status and stable ordering", async () => {
    const { repository, prisma } = createRepository();
    prisma.feeRecord.findMany.mockResolvedValueOnce([
      {
        ...makeRow(),
        dueDate: new Date("2026-06-17T00:00:00.000Z"),
        payStatus: PayStatusCode.pending,
      },
      {
        ...makeRow(),
        id: "80000000-0000-4000-8000-000000000002",
        dueDate: new Date("2026-06-25T00:00:00.000Z"),
        payStatus: PayStatusCode.pending,
      },
    ]);

    const result = await repository.findWarnings({
      where: { departmentId: { in: [ids.department] } },
      today: new Date("2026-06-18T08:00:00.000Z"),
      dueSoonDays: 7,
      take: 10,
    });

    expect(prisma.feeRecord.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { departmentId: { in: [ids.department] } },
          { archivedAt: null },
          { payStatus: { in: [PayStatusCode.pending, PayStatusCode.overdue] } },
          { dueDate: { lte: new Date("2026-06-25T00:00:00.000Z") } },
        ],
      },
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: 10,
    });
    expect(result).toEqual([
      expect.objectContaining({
        warningType: FeeWarningTypeCode.overdue,
        daysUntilDue: -1,
      }),
      expect.objectContaining({
        warningType: FeeWarningTypeCode.dueSoon,
        daysUntilDue: 7,
      }),
    ]);
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
      select: expect.objectContaining({
        payStatus: true,
        dueDate: true,
        reviewStatus: true,
        reviewedById: true,
        reviewedAt: true,
      }),
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
        department: {
          select: {
            status: true,
            archivedAt: true,
          },
        },
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
      select: expect.objectContaining({
        payStatus: true,
        reviewStatus: true,
        reviewedById: true,
        reviewedAt: true,
      }),
    });
  });

  it("normalizes HTTP paid-date strings before writing fee transitions", async () => {
    const { repository, tx } = createRepository();

    await repository.transitionPayStatusInTransaction(tx as unknown as FeeTransactionClient, {
      feeRecordId: ids.feeRecord,
      expectedStatus: PayStatusCode.pending,
      nextStatus: PayStatusCode.paid,
      paidDate: "2026-06-18",
    });

    expect(tx.feeRecord.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.feeRecord,
        payStatus: PayStatusCode.pending,
        archivedAt: null,
      },
      data: expect.objectContaining({
        paidDate: new Date("2026-06-18"),
      }),
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

describe("FeeRepository.transitionReviewStatusInTransaction", () => {
  it("transitions pending review with department scope and archived guards", async () => {
    const { repository, tx } = createRepository();
    tx.feeRecord.findUnique.mockResolvedValueOnce({
      ...makeStateRow(),
      reviewStatus: FeeReviewStatusCode.approved,
      reviewedById: ids.reviewer,
      reviewedAt,
    });

    const result = await repository.transitionReviewStatusInTransaction(
      tx as unknown as FeeTransactionClient,
      {
        feeRecordId: ids.feeRecord,
        where: { departmentId: { in: [ids.department] } },
        expectedReviewStatus: FeeReviewStatusCode.pending,
        nextReviewStatus: FeeReviewStatusCode.approved,
        reviewedById: ids.reviewer,
        reviewedAt,
      },
    );

    expect(tx.feeRecord.updateMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { id: ids.feeRecord },
          { departmentId: { in: [ids.department] } },
          { reviewStatus: FeeReviewStatusCode.pending },
          { archivedAt: null },
        ],
      },
      data: {
        reviewStatus: FeeReviewStatusCode.approved,
        reviewedById: ids.reviewer,
        reviewedAt,
      },
    });
    expect(tx.feeRecord.updateMany.mock.calls[0]![0].data).not.toHaveProperty("payStatus");
    expect(tx.feeRecord.updateMany.mock.calls[0]![0].data).not.toHaveProperty("paidDate");
    expect(tx.feeRecord.updateMany.mock.calls[0]![0].data).not.toHaveProperty("voucherNo");
    expect(tx.feeRecord.updateMany.mock.calls[0]![0].data).not.toHaveProperty("archivedAt");
    expect(result).toEqual(
      expect.objectContaining({
        payStatus: PayStatusCode.pending,
        reviewStatus: FeeReviewStatusCode.approved,
        reviewedById: ids.reviewer,
        reviewedAt,
      }),
    );
  });

  it("maps stale review updates to a review transition conflict", async () => {
    const { repository, tx } = createRepository();
    tx.feeRecord.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      repository.transitionReviewStatusInTransaction(
        tx as unknown as FeeTransactionClient,
        {
          feeRecordId: ids.feeRecord,
          where: { departmentId: { in: [ids.department] } },
          expectedReviewStatus: FeeReviewStatusCode.pending,
          nextReviewStatus: FeeReviewStatusCode.rejected,
          reviewedById: ids.reviewer,
          reviewedAt,
        },
      ),
    ).rejects.toBeInstanceOf(FeeReviewTransitionConflictError);
  });
});

describe("FeeRepository fee review history", () => {
  it("appends review history with only safe timeline fields", async () => {
    const { repository, tx } = createRepository();

    const result = await repository.appendReviewHistoryInTransaction(
      tx as unknown as FeeTransactionClient,
      {
        feeRecordId: ids.feeRecord,
        departmentId: ids.department,
        reviewerId: ids.reviewer,
        action: FeeReviewHistoryActionCode.approve,
        fromStatus: FeeReviewStatusCode.pending,
        toStatus: FeeReviewStatusCode.approved,
        reason: "finance checked",
        createdAt: reviewedAt,
      },
    );

    expect(tx.feeReviewHistory.create).toHaveBeenCalledWith({
      data: {
        feeRecordId: ids.feeRecord,
        departmentId: ids.department,
        reviewerId: ids.reviewer,
        action: FeeReviewHistoryActionCode.approve,
        fromStatus: FeeReviewStatusCode.pending,
        toStatus: FeeReviewStatusCode.approved,
        reason: "finance checked",
        createdAt: reviewedAt,
      },
      select: expect.objectContaining({
        feeRecordId: true,
        departmentId: true,
        reviewerId: true,
        reason: true,
      }),
    });
    expect(result).toEqual(makeReviewHistoryRow());
    expectHistoryHasNoSensitiveFeeFields(result);
  });

  it("lists review history chronologically for one fee record", async () => {
    const { repository, prisma } = createRepository();

    const result = await repository.findReviewHistoryByFeeRecordId(ids.feeRecord);

    expect(prisma.feeReviewHistory.findMany).toHaveBeenCalledWith({
      where: { feeRecordId: ids.feeRecord },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: expect.objectContaining({
        feeRecordId: true,
        departmentId: true,
        reviewerId: true,
        action: true,
        fromStatus: true,
        toStatus: true,
        reason: true,
        createdAt: true,
      }),
    });
    expect(result).toEqual([makeReviewHistoryRow()]);
    expectHistoryHasNoSensitiveFeeFields(result);
  });
});

describe("FeeRepository.archiveFee", () => {
  it("soft archives active fee records with an optimistic status guard", async () => {
    const { repository, tx } = createRepository();
    const archivedAt = new Date("2026-06-20T00:00:00.000Z");
    tx.feeRecord.findUnique.mockResolvedValueOnce({
      ...makeStateRow(),
      archivedAt,
    });

    const result = await repository.archiveFeeInTransaction(
      tx as unknown as FeeTransactionClient,
      {
        feeRecordId: ids.feeRecord,
        expectedStatus: PayStatusCode.pending,
        archivedAt,
        updatedById: ids.user,
      },
    );

    expect(tx.feeRecord.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.feeRecord,
        payStatus: PayStatusCode.pending,
        archivedAt: null,
      },
      data: {
        archivedAt,
        updatedById: ids.user,
      },
    });
    expect(result.archivedAt).toEqual(archivedAt);
  });

  it("maps stale archive updates to a transition conflict", async () => {
    const { repository, tx } = createRepository();
    tx.feeRecord.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.archiveFeeInTransaction(tx as unknown as FeeTransactionClient, {
        feeRecordId: ids.feeRecord,
        expectedStatus: PayStatusCode.pending,
        archivedAt: new Date("2026-06-20T00:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(FeeStatusTransitionConflictError);
  });
});

const expectHistoryHasNoSensitiveFeeFields = (input: unknown): void => {
  const serialized = JSON.stringify(input);

  expect(serialized).not.toContain("amount");
  expect(serialized).not.toContain("voucherNo");
  expect(serialized).not.toContain("VOUCHER");
  expect(serialized).not.toContain("paidDate");
  expect(serialized).not.toContain("dueDate");
  expect(serialized).not.toContain("storageKey");
  expect(serialized).not.toContain("checksum");
  expect(serialized).not.toContain("raw");
  expect(serialized).not.toContain("cookie");
  expect(serialized).not.toContain("token");
};
