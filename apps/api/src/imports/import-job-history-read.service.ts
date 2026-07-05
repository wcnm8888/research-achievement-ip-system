import { Inject, Injectable } from "@nestjs/common";
import {
  AchievementType,
  ImportFamily,
  ImportJobStatus,
  ImportJobItemPlannedAction,
  ImportJobItemStatus,
  ImportJobItemTargetType,
  ImportMode,
  Prisma,
} from "@prisma/client";
import { UserContext } from "../identity/user-context";
import {
  ImportJobHistoryDetailRecord,
  ImportJobHistoryListInput,
  ImportJobHistoryListRecord,
  ImportJobHistoryReadRepository,
  ImportJobHistoryRunRecord,
  ImportJobItemHistoryListInput,
  ImportJobItemHistoryListRecord,
} from "./import-job-history-read.repository";

export type ImportJobHistoryQueryInput = {
  family?: ImportFamily;
  mode?: ImportMode;
  achievementType?: AchievementType;
  status?: ImportJobStatus;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  pageSize?: number;
};

export type ImportJobItemHistoryQueryInput = {
  runId?: string;
  status?: ImportJobItemStatus;
  plannedAction?: ImportJobItemPlannedAction;
  targetType?: ImportJobItemTargetType;
  safeCode?: string;
  page?: number;
  pageSize?: number;
};

export type ImportJobHistoryLatestRunDto = {
  status: string;
  failureCode: string | null;
  failureStage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type ImportJobHistoryListItemDto = {
  id: string;
  family: string;
  mode: string;
  achievementType: string | null;
  status: string;
  acceptedRowCount: number;
  createdBusinessCount: number;
  createdCompanionCount: number;
  auditCount: number;
  safeErrorCodes: string[];
  createdAt: Date;
  completedAt: Date | null;
  latestRun: ImportJobHistoryLatestRunDto | null;
};

export type ImportJobHistoryListDto = {
  items: ImportJobHistoryListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type ImportJobHistoryRunDto = {
  attemptNo: number;
  trigger: string;
  status: string;
  failureCode: string | null;
  failureStage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  completedBusinessTransactionAt: Date | null;
  validationSummary: SafeSummaryDto | null;
  applySummary: SafeSummaryDto | null;
  auditCount: number;
};

export type ImportJobHistoryDetailDto = ImportJobHistoryListItemDto & {
  safeSummary: SafeSummaryDto | null;
  runs: ImportJobHistoryRunDto[];
};

export type ImportJobItemHistoryListItemDto = {
  rowNumber: number;
  plannedAction: string;
  status: string;
  safeCode: string | null;
  targetType: string;
};

export type ImportJobItemHistoryListDto = {
  items: ImportJobItemHistoryListItemDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type SafeSummaryDto =
  | string
  | number
  | boolean
  | null
  | SafeSummaryDto[]
  | { [key: string]: SafeSummaryDto };

export class ImportJobHistoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Import job ${id} was not found.`);
  }
}

const defaultPage = 1;
const defaultPageSize = 20;

@Injectable()
export class ImportJobHistoryReadService {
  constructor(
    @Inject(ImportJobHistoryReadRepository)
    private readonly repository: ImportJobHistoryReadRepository,
  ) {}

  async listImportJobs(
    currentUser: UserContext,
    query: ImportJobHistoryQueryInput = {},
  ): Promise<ImportJobHistoryListDto> {
    void currentUser;
    const page = query.page ?? defaultPage;
    const pageSize = query.pageSize ?? defaultPageSize;
    const result = await this.repository.findMany({
      family: query.family,
      mode: query.mode,
      achievementType: query.achievementType,
      status: query.status,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      page,
      pageSize,
    } satisfies ImportJobHistoryListInput);

    return {
      items: result.items.map(toListItemDto),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  async getImportJob(
    currentUser: UserContext,
    id: string,
  ): Promise<ImportJobHistoryDetailDto> {
    void currentUser;
    const job = await this.repository.findById(id);
    if (!job) {
      throw new ImportJobHistoryNotFoundError(id);
    }

    return toDetailDto(job);
  }

  async listImportJobItems(
    currentUser: UserContext,
    jobId: string,
    query: ImportJobItemHistoryQueryInput = {},
  ): Promise<ImportJobItemHistoryListDto> {
    void currentUser;
    const parent = await this.repository.findItemParentById(jobId);
    if (!parent) {
      throw new ImportJobHistoryNotFoundError(jobId);
    }

    const page = query.page ?? defaultPage;
    const pageSize = query.pageSize ?? defaultPageSize;
    const result = await this.repository.findItems({
      jobId,
      runId: query.runId,
      status: query.status,
      plannedAction: query.plannedAction,
      targetType: query.targetType,
      safeCode: query.safeCode,
      page,
      pageSize,
    } satisfies ImportJobItemHistoryListInput);

    return {
      items: result.items.map(toItemDto),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }
}

const toListItemDto = (
  record: ImportJobHistoryListRecord,
): ImportJobHistoryListItemDto => ({
  id: record.id,
  family: record.family,
  mode: record.mode,
  achievementType: record.achievementType,
  status: record.status,
  acceptedRowCount: record.acceptedRowCount,
  createdBusinessCount: record.createdBusinessCount,
  createdCompanionCount: record.createdCompanionCount,
  auditCount: record.auditCount,
  safeErrorCodes: toSafeErrorCodes(record.safeErrorCodes),
  createdAt: record.createdAt,
  completedAt: record.completedAt,
  latestRun: record.latestRun ? { ...record.latestRun } : null,
});

const toDetailDto = (
  record: ImportJobHistoryDetailRecord,
): ImportJobHistoryDetailDto => ({
  ...toListItemDto(record),
  safeSummary: sanitizeSafeSummary(record.safeSummary),
  runs: record.runs.map(toRunDto),
});

const toRunDto = (record: ImportJobHistoryRunRecord): ImportJobHistoryRunDto => ({
  attemptNo: record.attemptNo,
  trigger: record.trigger,
  status: record.status,
  failureCode: record.failureCode,
  failureStage: record.failureStage,
  startedAt: record.startedAt,
  finishedAt: record.finishedAt,
  completedBusinessTransactionAt: record.completedBusinessTransactionAt,
  validationSummary: sanitizeSafeSummary(record.validationSummary),
  applySummary: sanitizeSafeSummary(record.applySummary),
  auditCount: record.auditCount,
});

const toItemDto = (
  record: ImportJobItemHistoryListRecord,
): ImportJobItemHistoryListItemDto => ({
  rowNumber: record.rowNumber,
  plannedAction: record.plannedAction,
  status: record.status,
  safeCode: record.safeCode,
  targetType: record.targetType,
});

const safeSummaryKeys = new Set([
  "acceptedRowCount",
  "achievementType",
  "auditCount",
  "auditOperation",
  "code",
  "createdAchievementsCount",
  "createdBusinessCount",
  "createdCompanionCount",
  "createdContributorsCount",
  "createdDepartmentsCount",
  "createdPaperDetailsCount",
  "createdPatentDetailsCount",
  "createdRolesCount",
  "createdRows",
  "createdSoftwareCopyrightDetailsCount",
  "createdUserRolesCount",
  "createdUsersCount",
  "credentialCreatedCount",
  "credentialMode",
  "dryRun",
  "errorCount",
  "errors",
  "failedRows",
  "family",
  "field",
  "importType",
  "lifecycleTokenCreatedCount",
  "mailDeliveryCount",
  "mode",
  "operation",
  "roleScope",
  "rowNumber",
  "safeErrorCodes",
  "sessionCreatedCount",
  "skippedRows",
  "status",
  "targetStatus",
  "totalRows",
  "warningCount",
]);

const safeStringPattern = /^[A-Za-z0-9_:.:-]+$/;

export const sanitizeSafeSummary = (
  value: Prisma.JsonValue | null,
): SafeSummaryDto | null => {
  const sanitized = sanitizeJsonValue(value);
  return sanitized === undefined ? null : sanitized;
};

const sanitizeJsonValue = (value: unknown): SafeSummaryDto | undefined => {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return isSafeString(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map(sanitizeJsonValue)
      .filter((item): item is SafeSummaryDto => item !== undefined);
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const result: { [key: string]: SafeSummaryDto } = {};
  for (const [key, item] of Object.entries(value)) {
    if (!safeSummaryKeys.has(key)) {
      continue;
    }

    const sanitized = sanitizeJsonValue(item);
    if (sanitized !== undefined) {
      result[key] = sanitized;
    }
  }

  return result;
};

const toSafeErrorCodes = (value: Prisma.JsonValue | null): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && isSafeString(item),
  );
};

const isSafeString = (value: string): boolean =>
  value.length <= 120 && safeStringPattern.test(value);
