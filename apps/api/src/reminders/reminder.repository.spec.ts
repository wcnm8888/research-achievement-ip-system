import { SELF_DECLARED_DEPS_METADATA } from "@nestjs/common/constants";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import {
  ReminderLevelCode,
  ReminderStatusCode,
  ReminderTargetTypeCode,
} from "./domain/reminder-domain.types";
import { ReminderTaskStatusTransitionConflictError } from "./domain/reminder-errors";
import { ReminderRepository, ReminderTransactionClient } from "./reminder.repository";

type ExplicitDependency = { index: number; param: unknown };

const getExplicitDependencyTokens = (target: object): unknown[] =>
  [
    ...((Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? []) as ExplicitDependency[]),
  ]
    .sort((left: ExplicitDependency, right: ExplicitDependency) => left.index - right.index)
    .map((dependency: ExplicitDependency) => dependency.param);

const ids = {
  feeRecord: "80000000-0000-4000-8000-000000000001",
  feeRecord2: "80000000-0000-4000-8000-000000000002",
  achievement: "30000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  receiver: "40000000-0000-4000-8000-000000000001",
  updater: "40000000-0000-4000-8000-000000000002",
  owner: "40000000-0000-4000-8000-000000000003",
};

const today = new Date("2026-06-18T00:00:00.000Z");
const dueIn30 = new Date("2026-07-18T00:00:00.000Z");
const sentAt = new Date("2026-06-18T10:00:00.000Z");
const confirmedAt = new Date("2026-06-18T10:05:00.000Z");

const makeEligibleFeeRow = () => ({
  id: ids.feeRecord,
  achievementId: ids.achievement,
  departmentId: ids.department,
  dueDate: dueIn30,
  payStatus: PayStatusCode.pending,
  createdById: ids.receiver,
  updatedById: ids.updater,
  archivedAt: null,
  achievement: {
    ownerUserId: ids.owner,
  },
});

const makeTaskStateRow = (
  status: ReminderStatusCode = ReminderStatusCode.pending,
) => ({
  id: ids.feeRecord,
  targetType: ReminderTargetTypeCode.feeRecord,
  targetId: ids.feeRecord,
  remindDate: today,
  remindLevel: ReminderLevelCode.days30,
  receiverId: ids.receiver,
  status,
  sentAt: status === ReminderStatusCode.sent ? sentAt : null,
  confirmedAt: status === ReminderStatusCode.confirmed ? confirmedAt : null,
});

const createFakePrisma = () => {
  const reminderTaskKeys = new Set<string>();
  let taskState = makeTaskStateRow();

  const prisma = {
    feeRecord: {
      findMany: vi.fn().mockResolvedValue([makeEligibleFeeRow()]),
    },
    reminderTask: {
      createMany: vi.fn().mockImplementation(({ data }: { data: ReminderTaskData[] }) => {
        let count = 0;

        for (const item of data) {
          const key = reminderTaskUniqueKey(item);
          if (!reminderTaskKeys.has(key)) {
            reminderTaskKeys.add(key);
            count += 1;
          }
        }

        return Promise.resolve({ count });
      }),
      findUnique: vi.fn().mockImplementation(() => Promise.resolve(taskState)),
      updateMany: vi.fn().mockImplementation(
        ({
          where,
          data,
        }: {
          where: { status?: ReminderStatusCode };
          data: {
            status?: ReminderStatusCode;
            sentAt?: Date | null;
            confirmedAt?: Date | null;
          };
        }) => {
          if (where.status !== taskState.status) {
            return Promise.resolve({ count: 0 });
          }

          taskState = {
            ...taskState,
            status: data.status ?? taskState.status,
            sentAt:
              data.sentAt !== undefined ? data.sentAt : taskState.sentAt,
            confirmedAt:
              data.confirmedAt !== undefined
                ? data.confirmedAt
                : taskState.confirmedAt,
          };

          return Promise.resolve({ count: 1 });
        },
      ),
    },
  };

  return prisma;
};

const createRepository = () => {
  const prisma = createFakePrisma();
  const repository = new ReminderRepository(prisma as unknown as PrismaService);

  return { repository, prisma };
};

describe("ReminderRepository dependency injection", () => {
  it("declares explicit PrismaService injection for the dev runtime path", () => {
    expect(getExplicitDependencyTokens(ReminderRepository)).toEqual([PrismaService]);
  });
});

describe("ReminderRepository.findEligibleFeeFactsForReminder", () => {
  it("queries eligible fee facts with due-date windows, active filter, and default take", async () => {
    const { repository, prisma } = createRepository();

    const result = await repository.findEligibleFeeFactsForReminder(today);

    expect(result).toEqual([
      expect.objectContaining({
        id: ids.feeRecord,
        achievementId: ids.achievement,
        departmentId: ids.department,
        payStatus: PayStatusCode.pending,
        achievement: { ownerUserId: ids.owner },
      }),
    ]);
    expect(prisma.feeRecord.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { archivedAt: null },
          { payStatus: { in: [PayStatusCode.pending, PayStatusCode.overdue] } },
          {
            OR: [
              {
                dueDate: {
                  in: [
                    new Date("2026-07-18T00:00:00.000Z"),
                    new Date("2026-07-03T00:00:00.000Z"),
                    new Date("2026-06-25T00:00:00.000Z"),
                  ],
                },
              },
              { dueDate: { lt: today } },
            ],
          },
        ],
      },
      select: expect.objectContaining({
        id: true,
        achievementId: true,
        departmentId: true,
        dueDate: true,
        payStatus: true,
        createdById: true,
        updatedById: true,
        archivedAt: true,
      }),
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: 500,
    });
  });

  it("accepts a custom take limit", async () => {
    const { repository, prisma } = createRepository();

    await repository.findEligibleFeeFactsForReminder("2026-06-18", { take: 25 });

    expect(prisma.feeRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25 }),
    );
  });

  it("selects only narrow fee and achievement owner facts", async () => {
    const { repository, prisma } = createRepository();

    await repository.findEligibleFeeFactsForReminder(today);

    const select = prisma.feeRecord.findMany.mock.calls[0]?.[0].select;
    expect(select).toEqual({
      id: true,
      achievementId: true,
      departmentId: true,
      dueDate: true,
      payStatus: true,
      createdById: true,
      updatedById: true,
      archivedAt: true,
      achievement: {
        select: {
          ownerUserId: true,
        },
      },
    });
    expect(select).not.toHaveProperty("amount");
    expect(select).not.toHaveProperty("voucherNo");
    expect(select.achievement.select).not.toHaveProperty("title");
    expect(select.achievement.select).not.toHaveProperty("abstract");
    expect(select.achievement.select).not.toHaveProperty("contributors");
    expect(select.achievement.select).not.toHaveProperty("paperDetail");
    expect(select.achievement.select).not.toHaveProperty("patentDetail");
    expect(select.achievement.select).not.toHaveProperty("softwareCopyrightDetail");
  });
});

describe("ReminderRepository task state transitions", () => {
  it("finds reminder task state by id with minimal state facts", async () => {
    const { repository, prisma } = createRepository();

    await expect(repository.findTaskStateById(ids.feeRecord)).resolves.toEqual(
      makeTaskStateRow(),
    );

    expect(prisma.reminderTask.findUnique).toHaveBeenCalledWith({
      where: { id: ids.feeRecord },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        remindDate: true,
        remindLevel: true,
        receiverId: true,
        status: true,
        sentAt: true,
        confirmedAt: true,
      },
    });
  });

  it("transitions pending reminders to sent with sentAt using an optimistic guard", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.transitionTaskStatusInTransaction(
        prisma as unknown as ReminderTransactionClient,
        {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.pending,
        nextStatus: ReminderStatusCode.sent,
        sentAt,
        },
      ),
    ).resolves.toEqual({
      ...makeTaskStateRow(ReminderStatusCode.sent),
      sentAt,
    });

    expect(prisma.reminderTask.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.feeRecord,
        status: ReminderStatusCode.pending,
      },
      data: {
        status: ReminderStatusCode.sent,
        sentAt,
      },
    });
  });

  it("transitions pending reminders to failed", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.transitionTaskStatusInTransaction(
        prisma as unknown as ReminderTransactionClient,
        {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.pending,
        nextStatus: ReminderStatusCode.failed,
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({ status: ReminderStatusCode.failed }),
    );
  });

  it("transitions sent reminders to confirmed with confirmedAt", async () => {
    const { repository, prisma } = createRepository();

    await repository.transitionTaskStatusInTransaction(
      prisma as unknown as ReminderTransactionClient,
      {
      reminderTaskId: ids.feeRecord,
      expectedStatus: ReminderStatusCode.pending,
      nextStatus: ReminderStatusCode.sent,
      sentAt,
      },
    );

    await expect(
      repository.transitionTaskStatusInTransaction(
        prisma as unknown as ReminderTransactionClient,
        {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.sent,
        nextStatus: ReminderStatusCode.confirmed,
        confirmedAt,
        },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        status: ReminderStatusCode.confirmed,
        confirmedAt,
      }),
    );
  });

  it("maps stale status writes to a conflict", async () => {
    const { repository, prisma } = createRepository();

    await expect(
      repository.transitionTaskStatusInTransaction(
        prisma as unknown as ReminderTransactionClient,
        {
        reminderTaskId: ids.feeRecord,
        expectedStatus: ReminderStatusCode.sent,
        nextStatus: ReminderStatusCode.confirmed,
        confirmedAt,
        },
      ),
    ).rejects.toBeInstanceOf(ReminderTaskStatusTransitionConflictError);
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

describe("ReminderRepository.createTasksForCandidates", () => {
  it("creates pending reminder tasks with skipDuplicates enabled", async () => {
    const { repository, prisma } = createRepository();

    const result = await repository.createTasksForCandidates([
      makeCandidate(ids.feeRecord),
    ]);

    expect(result).toEqual({
      uniqueCandidateCount: 1,
      createdCount: 1,
      duplicateCount: 0,
    });
    expect(prisma.reminderTask.createMany).toHaveBeenCalledWith({
      data: [
        {
          targetType: ReminderTargetTypeCode.feeRecord,
          targetId: ids.feeRecord,
          remindDate: today,
          remindLevel: ReminderLevelCode.days30,
          receiverId: ids.receiver,
          status: ReminderStatusCode.pending,
        },
      ],
      skipDuplicates: true,
    });
  });

  it("deduplicates candidates in the same batch before createMany", async () => {
    const { repository, prisma } = createRepository();

    const result = await repository.createTasksForCandidates([
      makeCandidate(ids.feeRecord),
      makeCandidate(ids.feeRecord),
    ]);

    expect(result).toEqual({
      uniqueCandidateCount: 1,
      createdCount: 1,
      duplicateCount: 0,
    });
    expect(prisma.reminderTask.createMany.mock.calls[0]?.[0].data).toHaveLength(1);
  });

  it("reports duplicates when the same task already exists", async () => {
    const { repository } = createRepository();

    await repository.createTasksForCandidates([makeCandidate(ids.feeRecord)]);
    const result = await repository.createTasksForCandidates([
      makeCandidate(ids.feeRecord),
    ]);

    expect(result).toEqual({
      uniqueCandidateCount: 1,
      createdCount: 0,
      duplicateCount: 1,
    });
  });

  it("does not call createMany when there are no candidates", async () => {
    const { repository, prisma } = createRepository();

    const result = await repository.createTasksForCandidates([]);

    expect(result).toEqual({
      uniqueCandidateCount: 0,
      createdCount: 0,
      duplicateCount: 0,
    });
    expect(prisma.reminderTask.createMany).not.toHaveBeenCalled();
  });
});

type ReminderTaskData = {
  targetType: string;
  targetId: string;
  remindDate: Date;
  remindLevel: string;
  receiverId: string;
};

const makeCandidate = (targetId: string) => ({
  targetType: ReminderTargetTypeCode.feeRecord,
  targetId,
  achievementId: ids.achievement,
  departmentId: ids.department,
  remindDate: today,
  remindLevel: ReminderLevelCode.days30,
  receiverId: ids.receiver,
  dueDate: dueIn30,
});

const reminderTaskUniqueKey = (data: ReminderTaskData): string =>
  [
    data.targetType,
    data.targetId,
    data.remindDate.toISOString(),
    data.remindLevel,
    data.receiverId,
  ].join("|");
