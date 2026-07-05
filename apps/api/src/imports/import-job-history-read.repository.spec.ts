import {
  AchievementType,
  ImportFamily,
  ImportJobStatus,
  ImportJobItemPlannedAction,
  ImportJobItemStatus,
  ImportJobItemTargetType,
  ImportMode,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { ImportJobHistoryReadRepository } from "./import-job-history-read.repository";

const ids = {
  job: "70000000-0000-4000-8000-000000000001",
  run: "71000000-0000-4000-8000-000000000001",
};

const createPrisma = () => ({
  importJob: {
    count: vi.fn().mockResolvedValue(1),
    findMany: vi.fn().mockResolvedValue([
      {
        id: ids.job,
        importFamily: ImportFamily.DEPARTMENT,
        mode: ImportMode.CREATE_ONLY,
        achievementType: null,
        status: ImportJobStatus.SUCCESS,
        acceptedRowCount: 2,
        createdBusinessCount: 2,
        createdCompanionCount: 0,
        auditCount: 2,
        safeErrorCodes: [],
        createdAt: new Date("2026-07-04T01:00:00.000Z"),
        completedAt: new Date("2026-07-04T01:01:00.000Z"),
        runs: [
          {
            status: "SUCCESS",
            failureCode: null,
            failureStage: null,
            startedAt: new Date("2026-07-04T01:00:00.000Z"),
            finishedAt: new Date("2026-07-04T01:01:00.000Z"),
          },
        ],
      },
    ]),
    findUnique: vi.fn().mockResolvedValue({
      id: ids.job,
      importFamily: ImportFamily.ACHIEVEMENT,
      mode: ImportMode.CREATE_DRAFT_ONLY,
      achievementType: AchievementType.PATENT,
      status: ImportJobStatus.SUCCESS,
      acceptedRowCount: 1,
      createdBusinessCount: 1,
      createdCompanionCount: 2,
      auditCount: 1,
      safeErrorCodes: [],
      safeSummary: { totalRows: 1 },
      createdAt: new Date("2026-07-04T01:00:00.000Z"),
      completedAt: new Date("2026-07-04T01:01:00.000Z"),
      runs: [
        {
          id: ids.run,
          attemptNo: 1,
          trigger: "INITIAL_SUBMIT",
          status: "SUCCESS",
          failureCode: null,
          failureStage: null,
          startedAt: new Date("2026-07-04T01:00:00.000Z"),
          finishedAt: new Date("2026-07-04T01:01:00.000Z"),
          completedBusinessTransactionAt: new Date("2026-07-04T01:01:00.000Z"),
          validationSummary: null,
          applySummary: { totalRows: 1 },
          auditLogIds: [
            "90000000-0000-4000-8000-000000000001",
            "90000000-0000-4000-8000-000000000002",
          ],
        },
      ],
    }),
  },
  importJobItem: {
    count: vi.fn().mockResolvedValue(1),
    findMany: vi.fn().mockResolvedValue([
      {
        rowNumber: 2,
        plannedAction: ImportJobItemPlannedAction.CREATE_DRAFT,
        status: ImportJobItemStatus.APPLIED,
        safeCode: "ROW_APPLIED",
        targetType: ImportJobItemTargetType.ACHIEVEMENT,
      },
    ]),
  },
});

describe("ImportJobHistoryReadRepository", () => {
  it("queries list rows with filters, pagination, stable ordering, and select allowlist", async () => {
    const prisma = createPrisma();
    const repository = new ImportJobHistoryReadRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.findMany({
      family: ImportFamily.ACHIEVEMENT,
      mode: ImportMode.CREATE_DRAFT_ONLY,
      achievementType: AchievementType.PAPER,
      status: ImportJobStatus.SUCCESS,
      createdFrom: new Date("2026-07-04T00:00:00.000Z"),
      createdTo: new Date("2026-07-05T00:00:00.000Z"),
      page: 2,
      pageSize: 10,
    });

    expect(prisma.importJob.findMany).toHaveBeenCalledWith({
      where: {
        importFamily: ImportFamily.ACHIEVEMENT,
        mode: ImportMode.CREATE_DRAFT_ONLY,
        achievementType: AchievementType.PAPER,
        status: ImportJobStatus.SUCCESS,
        createdAt: {
          gte: new Date("2026-07-04T00:00:00.000Z"),
          lte: new Date("2026-07-05T00:00:00.000Z"),
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 10,
      take: 10,
      select: expect.objectContaining({
        id: true,
        importFamily: true,
        mode: true,
        status: true,
        acceptedRowCount: true,
        createdBusinessCount: true,
        safeErrorCodes: true,
        runs: expect.objectContaining({
          take: 1,
          select: expect.not.objectContaining({
            auditLogIds: true,
            requestFingerprint: true,
            operatorUserId: true,
          }),
        }),
      }),
    });
    expect(prisma.importJob.findMany.mock.calls[0]?.[0].select).not.toHaveProperty(
      "idempotencyKeyHash",
    );
    expect(prisma.importJob.findMany.mock.calls[0]?.[0].select).not.toHaveProperty(
      "scopeHash",
    );
    expect(prisma.importJob.findMany.mock.calls[0]?.[0].select).not.toHaveProperty(
      "fileFingerprint",
    );
    expect(prisma.importJob.count).toHaveBeenCalledWith({
      where: prisma.importJob.findMany.mock.calls[0]?.[0].where,
    });
    expect(result.items[0]?.latestRun?.status).toBe("SUCCESS");
    expect(result).toMatchObject({ total: 1, page: 2, pageSize: 10 });
  });

  it("returns detail rows with auditCount and without raw audit ids", async () => {
    const prisma = createPrisma();
    const repository = new ImportJobHistoryReadRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.findById(ids.job);

    expect(prisma.importJob.findUnique).toHaveBeenCalledWith({
      where: { id: ids.job },
      select: expect.objectContaining({
        safeSummary: true,
        runs: expect.objectContaining({
          select: expect.objectContaining({
            auditLogIds: true,
          }),
        }),
      }),
    });
    const runSelect = prisma.importJob.findUnique.mock.calls[0]?.[0].select.runs
      .select;
    expect(runSelect).not.toHaveProperty("requestFingerprint");
    expect(runSelect).not.toHaveProperty("operatorUserId");
    expect(result?.runs[0]).toEqual(
      expect.objectContaining({
        attemptNo: 1,
        status: "SUCCESS",
        auditCount: 2,
      }),
    );
    expect(JSON.stringify(result)).not.toContain("auditLogIds");
    expect(JSON.stringify(result)).not.toContain("90000000-0000-4000-8000");
  });

  it("checks item parent jobs with a safe select allowlist", async () => {
    const prisma = createPrisma();
    const repository = new ImportJobHistoryReadRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.findItemParentById(ids.job);

    expect(prisma.importJob.findUnique).toHaveBeenCalledWith({
      where: { id: ids.job },
      select: {
        id: true,
        importFamily: true,
        mode: true,
        achievementType: true,
        status: true,
      },
    });
    const select = prisma.importJob.findUnique.mock.calls[0]?.[0].select;
    expect(select).not.toHaveProperty("safeSummary");
    expect(select).not.toHaveProperty("runs");
    expect(select).not.toHaveProperty("auditLogIds");
    expect(select).not.toHaveProperty("idempotencyKeyHash");
    expect(select).not.toHaveProperty("scopeHash");
    expect(select).not.toHaveProperty("fileFingerprint");
    expect(select).not.toHaveProperty("requestFingerprint");
    expect(select).not.toHaveProperty("operatorUserId");
    expect(result).toEqual({
      id: ids.job,
      family: ImportFamily.ACHIEVEMENT,
      mode: ImportMode.CREATE_DRAFT_ONLY,
      achievementType: AchievementType.PATENT,
      status: ImportJobStatus.SUCCESS,
    });
  });

  it("queries item rows with job scope, filters, pagination, ordering, and select allowlist", async () => {
    const prisma = createPrisma();
    const repository = new ImportJobHistoryReadRepository(
      prisma as unknown as PrismaService,
    );

    const result = await repository.findItems({
      jobId: ids.job,
      runId: ids.run,
      status: ImportJobItemStatus.APPLIED,
      plannedAction: ImportJobItemPlannedAction.CREATE_DRAFT,
      targetType: ImportJobItemTargetType.ACHIEVEMENT,
      safeCode: "ROW_APPLIED",
      page: 2,
      pageSize: 10,
    });

    expect(prisma.importJobItem.findMany).toHaveBeenCalledWith({
      where: {
        jobId: ids.job,
        runId: ids.run,
        status: ImportJobItemStatus.APPLIED,
        plannedAction: ImportJobItemPlannedAction.CREATE_DRAFT,
        targetType: ImportJobItemTargetType.ACHIEVEMENT,
        safeCode: "ROW_APPLIED",
      },
      orderBy: [{ rowNumber: "asc" }],
      skip: 10,
      take: 10,
      select: {
        rowNumber: true,
        plannedAction: true,
        status: true,
        safeCode: true,
        targetType: true,
      },
    });
    expect(prisma.importJobItem.count).toHaveBeenCalledWith({
      where: prisma.importJobItem.findMany.mock.calls[0]?.[0].where,
    });
    const select = prisma.importJobItem.findMany.mock.calls[0]?.[0].select;
    expect(select).not.toHaveProperty("targetId");
    expect(select).not.toHaveProperty("jobId");
    expect(select).not.toHaveProperty("runId");
    expect(select).not.toHaveProperty("safeSummary");
    expect(select).not.toHaveProperty("auditLogIds");
    expect(result).toEqual({
      items: [
        {
          rowNumber: 2,
          plannedAction: "CREATE_DRAFT",
          status: "APPLIED",
          safeCode: "ROW_APPLIED",
          targetType: "ACHIEVEMENT",
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it("uses runId as an ordering tie-breaker only when item queries span runs", async () => {
    const prisma = createPrisma();
    const repository = new ImportJobHistoryReadRepository(
      prisma as unknown as PrismaService,
    );

    await repository.findItems({
      jobId: ids.job,
      page: 1,
      pageSize: 20,
    });

    expect(prisma.importJobItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jobId: ids.job },
        orderBy: [{ rowNumber: "asc" }, { runId: "asc" }],
        select: expect.not.objectContaining({
          targetId: true,
          jobId: true,
          runId: true,
        }),
      }),
    );
  });
});
