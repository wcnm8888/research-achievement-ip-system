import { Inject, Injectable } from "@nestjs/common";
import {
  DepartmentStatus,
  Prisma,
  UserStatus,
  WorkflowTargetType,
  WorkflowTaskStatus,
} from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

const defaultPage = 1;
const defaultPageSize = 20;

export type DepartmentListInput = {
  keyword?: string;
  status?: DepartmentStatus;
  parentId?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
};

export type DepartmentCreateInput = {
  code: string;
  name: string;
  parentId: string | null;
};

export type DepartmentUpdateInput = Partial<DepartmentCreateInput>;

export type DepartmentManagementTransactionClient = Pick<
  Prisma.TransactionClient,
  "department"
>;

export type DepartmentRecord = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  status: DepartmentStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type DepartmentImpactSummary = {
  activeUsersCount: number;
  activeUserRoleScopesCount: number;
  pendingWorkflowTasksCount: number;
  activeOrUnarchivedAchievementsCount: number;
  feeRecordsCount: number;
};

@Injectable()
export class DepartmentManagementRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findMany(input: DepartmentListInput): Promise<{
    items: DepartmentRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = input.page ?? defaultPage;
    const pageSize = input.pageSize ?? defaultPageSize;
    const where = toDepartmentFindManyWhere(input);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        select: departmentSelect,
        orderBy: [{ code: "asc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      items: rows.map(toDepartmentRecord),
      total,
      page,
      pageSize,
    };
  }

  async findTreeRows(input: DepartmentListInput = {}): Promise<DepartmentRecord[]> {
    const rows = await this.prisma.department.findMany({
      where: toDepartmentFindManyWhere(input),
      select: departmentSelect,
      orderBy: [{ code: "asc" }, { id: "asc" }],
    });

    return rows.map(toDepartmentRecord);
  }

  async findById(departmentId: string): Promise<DepartmentRecord | null> {
    const row = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: departmentSelect,
    });

    return row ? toDepartmentRecord(row) : null;
  }

  async createInTransaction(
    client: DepartmentManagementTransactionClient,
    input: DepartmentCreateInput,
  ): Promise<DepartmentRecord> {
    const row = await client.department.create({
      data: {
        code: input.code,
        name: input.name,
        parentId: input.parentId,
      },
      select: departmentSelect,
    });

    return toDepartmentRecord(row);
  }

  async updateInTransaction(
    client: DepartmentManagementTransactionClient,
    departmentId: string,
    input: DepartmentUpdateInput,
  ): Promise<DepartmentRecord> {
    const row = await client.department.update({
      where: { id: departmentId },
      data: input,
      select: departmentSelect,
    });

    return toDepartmentRecord(row);
  }

  async disableInTransaction(
    client: DepartmentManagementTransactionClient,
    departmentId: string,
    archivedAt: Date,
  ): Promise<DepartmentRecord> {
    const row = await client.department.update({
      where: { id: departmentId },
      data: {
        status: DepartmentStatus.ARCHIVED,
        archivedAt,
      },
      select: departmentSelect,
    });

    return toDepartmentRecord(row);
  }

  async enableInTransaction(
    client: DepartmentManagementTransactionClient,
    departmentId: string,
  ): Promise<DepartmentRecord> {
    const row = await client.department.update({
      where: { id: departmentId },
      data: {
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: departmentSelect,
    });

    return toDepartmentRecord(row);
  }

  async getDisableImpactSummary(
    departmentId: string,
  ): Promise<DepartmentImpactSummary> {
    const achievementIds = await this.prisma.achievement.findMany({
      where: {
        departmentId,
        archivedAt: null,
      },
      select: { id: true },
    });
    const achievementIdValues = achievementIds.map((achievement) => achievement.id);

    const [
      activeUsersCount,
      activeUserRoleScopesCount,
      pendingWorkflowTasksCount,
      activeOrUnarchivedAchievementsCount,
      feeRecordsCount,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: {
          departmentId,
          status: UserStatus.ACTIVE,
          archivedAt: null,
        },
      }),
      this.prisma.userRole.count({
        where: {
          departmentId,
          revokedAt: null,
        },
      }),
      this.prisma.workflowTask.count({
        where: {
          status: WorkflowTaskStatus.PENDING,
          instance: {
            targetType: WorkflowTargetType.ACHIEVEMENT,
            targetId: { in: achievementIdValues },
          },
        },
      }),
      this.prisma.achievement.count({
        where: {
          departmentId,
          archivedAt: null,
        },
      }),
      this.prisma.feeRecord.count({
        where: {
          departmentId,
        },
      }),
    ]);

    return {
      activeUsersCount,
      activeUserRoleScopesCount,
      pendingWorkflowTasksCount,
      activeOrUnarchivedAchievementsCount,
      feeRecordsCount,
    };
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }

  isPrismaRecordNotFound(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2025";
  }
}

const departmentSelect = {
  id: true,
  code: true,
  name: true,
  parentId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
} satisfies Prisma.DepartmentSelect;

type DepartmentRow = Prisma.DepartmentGetPayload<{ select: typeof departmentSelect }>;

const toDepartmentRecord = (row: DepartmentRow): DepartmentRecord => ({
  id: row.id,
  code: row.code,
  name: row.name,
  parentId: row.parentId,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  archivedAt: row.archivedAt,
});

const toDepartmentFindManyWhere = (
  input: DepartmentListInput,
): Prisma.DepartmentWhereInput => ({
  ...(input.keyword
    ? {
        OR: [
          { code: { contains: input.keyword, mode: "insensitive" } },
          { name: { contains: input.keyword, mode: "insensitive" } },
        ],
      }
    : {}),
  ...(input.status ? { status: input.status } : {}),
  ...(input.parentId ? { parentId: input.parentId } : {}),
  ...(input.includeArchived ? {} : { archivedAt: null }),
});

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};
