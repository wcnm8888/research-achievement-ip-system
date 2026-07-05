import { Inject, Injectable } from "@nestjs/common";
import { ApiIntegrationProvider, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

const defaultPage = 1;
const defaultPageSize = 20;

export type ApiIntegrationListInput = {
  keyword?: string;
  provider?: ApiIntegrationProvider;
  enabled?: boolean;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
};

export type ApiIntegrationCreateInput = {
  code: string;
  provider: ApiIntegrationProvider;
  enabled?: boolean;
  timeoutMs?: number;
  configRef: string | null;
};

export type ApiIntegrationUpdateInput = Partial<ApiIntegrationCreateInput>;

export type ApiIntegrationSettingsTransactionClient = Pick<
  Prisma.TransactionClient,
  "apiIntegration" | "apiCallLog"
>;

export type ApiIntegrationRecord = {
  id: string;
  code: string;
  provider: ApiIntegrationProvider;
  enabled: boolean;
  timeoutMs: number;
  configRef: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type ApiCallLogCreateInput = {
  integrationCode: string;
  requestId: string;
  status: Prisma.ApiCallLogCreateInput["status"];
  durationMs: number | null;
  errorSummary: string | null;
};

export type ApiCallLogSafeRecord = {
  integrationCode: string;
  requestId: string;
  status: Prisma.ApiCallLogCreateInput["status"];
  durationMs: number | null;
  errorSummary: string | null;
  createdAt: Date;
};

@Injectable()
export class ApiIntegrationSettingsRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(input: ApiIntegrationListInput): Promise<{
    items: ApiIntegrationRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = input.page ?? defaultPage;
    const pageSize = input.pageSize ?? defaultPageSize;
    const where = toApiIntegrationFindManyWhere(input);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.apiIntegration.findMany({
        where,
        select: apiIntegrationSelect,
        orderBy: [{ code: "asc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.apiIntegration.count({ where }),
    ]);

    return {
      items: rows.map(toApiIntegrationRecord),
      total,
      page,
      pageSize,
    };
  }

  async findById(
    apiIntegrationId: string,
    options: { includeArchived?: boolean } = {},
  ): Promise<ApiIntegrationRecord | null> {
    const row = await this.prisma.apiIntegration.findFirst({
      where: {
        id: apiIntegrationId,
        ...(options.includeArchived ? {} : { archivedAt: null }),
      },
      select: apiIntegrationSelect,
    });

    return row ? toApiIntegrationRecord(row) : null;
  }

  async findFirstByProvider(
    provider: ApiIntegrationProvider,
    options: { includeArchived?: boolean } = {},
  ): Promise<ApiIntegrationRecord | null> {
    const row = await this.prisma.apiIntegration.findFirst({
      where: {
        provider,
        ...(options.includeArchived ? {} : { archivedAt: null }),
      },
      select: apiIntegrationSelect,
      orderBy: [{ enabled: "desc" }, { code: "asc" }, { id: "asc" }],
    });

    return row ? toApiIntegrationRecord(row) : null;
  }

  async createInTransaction(
    client: ApiIntegrationSettingsTransactionClient,
    input: ApiIntegrationCreateInput,
  ): Promise<ApiIntegrationRecord> {
    const row = await client.apiIntegration.create({
      data: {
        code: input.code,
        provider: input.provider,
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.timeoutMs !== undefined ? { timeoutMs: input.timeoutMs } : {}),
        configRef: input.configRef,
      },
      select: apiIntegrationSelect,
    });

    return toApiIntegrationRecord(row);
  }

  async updateInTransaction(
    client: ApiIntegrationSettingsTransactionClient,
    apiIntegrationId: string,
    input: ApiIntegrationUpdateInput,
  ): Promise<ApiIntegrationRecord> {
    const row = await client.apiIntegration.update({
      where: { id: apiIntegrationId },
      data: input,
      select: apiIntegrationSelect,
    });

    return toApiIntegrationRecord(row);
  }

  async archiveInTransaction(
    client: ApiIntegrationSettingsTransactionClient,
    apiIntegrationId: string,
    archivedAt: Date,
  ): Promise<ApiIntegrationRecord> {
    const row = await client.apiIntegration.update({
      where: { id: apiIntegrationId },
      data: {
        enabled: false,
        archivedAt,
      },
      select: apiIntegrationSelect,
    });

    return toApiIntegrationRecord(row);
  }

  async restoreInTransaction(
    client: ApiIntegrationSettingsTransactionClient,
    apiIntegrationId: string,
  ): Promise<ApiIntegrationRecord> {
    const row = await client.apiIntegration.update({
      where: { id: apiIntegrationId },
      data: {
        archivedAt: null,
      },
      select: apiIntegrationSelect,
    });

    return toApiIntegrationRecord(row);
  }

  async createApiCallLogInTransaction(
    client: ApiIntegrationSettingsTransactionClient,
    input: ApiCallLogCreateInput,
  ): Promise<ApiCallLogSafeRecord> {
    const row = await client.apiCallLog.create({
      data: {
        integrationCode: input.integrationCode,
        requestId: input.requestId,
        status: input.status,
        durationMs: input.durationMs,
        errorSummary: input.errorSummary,
      },
      select: apiCallLogSafeSelect,
    });

    return toApiCallLogSafeRecord(row);
  }

  async findRecentApiCallLogs(limit: number): Promise<ApiCallLogSafeRecord[]> {
    const rows = await this.prisma.apiCallLog.findMany({
      select: apiCallLogSafeSelect,
      orderBy: [{ createdAt: "desc" }, { requestId: "asc" }],
      take: limit,
    });

    return rows.map(toApiCallLogSafeRecord);
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }

  isPrismaRecordNotFound(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2025";
  }
}

const apiIntegrationSelect = {
  id: true,
  code: true,
  provider: true,
  enabled: true,
  timeoutMs: true,
  configRef: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
} satisfies Prisma.ApiIntegrationSelect;

const apiCallLogSafeSelect = {
  integrationCode: true,
  requestId: true,
  status: true,
  durationMs: true,
  errorSummary: true,
  createdAt: true,
} satisfies Prisma.ApiCallLogSelect;

type ApiIntegrationRow = Prisma.ApiIntegrationGetPayload<{
  select: typeof apiIntegrationSelect;
}>;

type ApiCallLogSafeRow = Prisma.ApiCallLogGetPayload<{
  select: typeof apiCallLogSafeSelect;
}>;

const toApiIntegrationRecord = (row: ApiIntegrationRow): ApiIntegrationRecord => ({
  id: row.id,
  code: row.code,
  provider: row.provider,
  enabled: row.enabled,
  timeoutMs: row.timeoutMs,
  configRef: row.configRef,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  archivedAt: row.archivedAt,
});

const toApiCallLogSafeRecord = (row: ApiCallLogSafeRow): ApiCallLogSafeRecord => ({
  integrationCode: row.integrationCode,
  requestId: row.requestId,
  status: row.status,
  durationMs: row.durationMs,
  errorSummary: row.errorSummary,
  createdAt: row.createdAt,
});

const toApiIntegrationFindManyWhere = (
  input: ApiIntegrationListInput,
): Prisma.ApiIntegrationWhereInput => ({
  ...(input.keyword
    ? {
        OR: [
          { code: { contains: input.keyword, mode: "insensitive" } },
          { configRef: { contains: input.keyword, mode: "insensitive" } },
        ],
      }
    : {}),
  ...(input.provider ? { provider: input.provider } : {}),
  ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
  ...(input.includeArchived ? {} : { archivedAt: null }),
});

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};
