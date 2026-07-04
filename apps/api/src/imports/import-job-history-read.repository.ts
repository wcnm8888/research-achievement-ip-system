import { Inject, Injectable } from "@nestjs/common";
import {
  AchievementType,
  ImportFamily,
  ImportJobStatus,
  ImportMode,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

export type ImportJobHistoryListInput = {
  family?: ImportFamily;
  mode?: ImportMode;
  achievementType?: AchievementType;
  status?: ImportJobStatus;
  createdFrom?: Date;
  createdTo?: Date;
  page: number;
  pageSize: number;
};

export type ImportJobHistoryLatestRunRecord = {
  status: string;
  failureCode: string | null;
  failureStage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type ImportJobHistoryListRecord = {
  id: string;
  family: string;
  mode: string;
  achievementType: string | null;
  status: string;
  acceptedRowCount: number;
  createdBusinessCount: number;
  createdCompanionCount: number;
  auditCount: number;
  safeErrorCodes: Prisma.JsonValue | null;
  createdAt: Date;
  completedAt: Date | null;
  latestRun: ImportJobHistoryLatestRunRecord | null;
};

export type ImportJobHistoryListResult = {
  items: ImportJobHistoryListRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type ImportJobHistoryRunRecord = {
  attemptNo: number;
  trigger: string;
  status: string;
  failureCode: string | null;
  failureStage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  completedBusinessTransactionAt: Date | null;
  validationSummary: Prisma.JsonValue | null;
  applySummary: Prisma.JsonValue | null;
  auditCount: number;
};

export type ImportJobHistoryDetailRecord = ImportJobHistoryListRecord & {
  safeSummary: Prisma.JsonValue | null;
  runs: ImportJobHistoryRunRecord[];
};

const importJobListSelect = {
  id: true,
  importFamily: true,
  mode: true,
  achievementType: true,
  status: true,
  acceptedRowCount: true,
  createdBusinessCount: true,
  createdCompanionCount: true,
  auditCount: true,
  safeErrorCodes: true,
  createdAt: true,
  completedAt: true,
  runs: {
    orderBy: { attemptNo: "desc" as const },
    take: 1,
    select: {
      status: true,
      failureCode: true,
      failureStage: true,
      startedAt: true,
      finishedAt: true,
    },
  },
} satisfies Prisma.ImportJobSelect;

const importJobDetailSelect = {
  ...importJobListSelect,
  safeSummary: true,
  runs: {
    orderBy: { attemptNo: "asc" as const },
    select: {
      attemptNo: true,
      trigger: true,
      status: true,
      failureCode: true,
      failureStage: true,
      startedAt: true,
      finishedAt: true,
      completedBusinessTransactionAt: true,
      validationSummary: true,
      applySummary: true,
      auditLogIds: true,
    },
  },
} satisfies Prisma.ImportJobSelect;

type ImportJobListRow = Prisma.ImportJobGetPayload<{
  select: typeof importJobListSelect;
}>;

type ImportJobDetailRow = Prisma.ImportJobGetPayload<{
  select: typeof importJobDetailSelect;
}>;

@Injectable()
export class ImportJobHistoryReadRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(
    input: ImportJobHistoryListInput,
  ): Promise<ImportJobHistoryListResult> {
    const where = toImportJobWhere(input);
    const [items, total] = await Promise.all([
      this.prisma.importJob.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        select: importJobListSelect,
      }),
      this.prisma.importJob.count({ where }),
    ]);

    return {
      items: items.map(toListRecord),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }

  async findById(id: string): Promise<ImportJobHistoryDetailRecord | null> {
    const job = await this.prisma.importJob.findUnique({
      where: { id },
      select: importJobDetailSelect,
    });

    return job ? toDetailRecord(job) : null;
  }
}

const toImportJobWhere = (
  input: ImportJobHistoryListInput,
): Prisma.ImportJobWhereInput => ({
  ...(input.family ? { importFamily: input.family } : {}),
  ...(input.mode ? { mode: input.mode } : {}),
  ...(input.achievementType ? { achievementType: input.achievementType } : {}),
  ...(input.status ? { status: input.status } : {}),
  ...(input.createdFrom || input.createdTo
    ? {
        createdAt: {
          ...(input.createdFrom ? { gte: input.createdFrom } : {}),
          ...(input.createdTo ? { lte: input.createdTo } : {}),
        },
      }
    : {}),
});

const toListRecord = (row: ImportJobListRow): ImportJobHistoryListRecord => ({
  id: row.id,
  family: row.importFamily,
  mode: row.mode,
  achievementType: row.achievementType,
  status: row.status,
  acceptedRowCount: row.acceptedRowCount,
  createdBusinessCount: row.createdBusinessCount,
  createdCompanionCount: row.createdCompanionCount,
  auditCount: row.auditCount,
  safeErrorCodes: row.safeErrorCodes,
  createdAt: row.createdAt,
  completedAt: row.completedAt,
  latestRun: row.runs[0]
    ? {
        status: row.runs[0].status,
        failureCode: row.runs[0].failureCode,
        failureStage: row.runs[0].failureStage,
        startedAt: row.runs[0].startedAt,
        finishedAt: row.runs[0].finishedAt,
      }
    : null,
});

const toDetailRecord = (
  row: ImportJobDetailRow,
): ImportJobHistoryDetailRecord => ({
  ...toListRecord(row),
  safeSummary: row.safeSummary,
  runs: row.runs.map((run) => ({
    attemptNo: run.attemptNo,
    trigger: run.trigger,
    status: run.status,
    failureCode: run.failureCode,
    failureStage: run.failureStage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    completedBusinessTransactionAt: run.completedBusinessTransactionAt,
    validationSummary: run.validationSummary,
    applySummary: run.applySummary,
    auditCount: Array.isArray(run.auditLogIds) ? run.auditLogIds.length : 0,
  })),
});
