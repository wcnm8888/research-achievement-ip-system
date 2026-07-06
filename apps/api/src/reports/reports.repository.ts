import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AchievementConversionStatusCode } from "../achievement-conversions/domain/achievement-conversion-domain.types";
import { AchievementTypeCode } from "../achievements/domain/achievement-domain.types";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import {
  AchievementDistributionBucket,
  AchievementTrendItem,
  ConversionAmountSummary,
  CountBucket,
} from "./domain/custom-report-domain.types";

@Injectable()
export class ReportsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async groupAchievementsByDepartmentAndType(
    where: Prisma.AchievementWhereInput,
  ): Promise<AchievementDistributionBucket[]> {
    const rows = await this.prisma.achievement.groupBy({
      by: ["departmentId", "type"],
      where,
      _count: { _all: true },
    });
    const departmentIds = [...new Set(rows.map((row) => row.departmentId))];
    const departments =
      departmentIds.length === 0
        ? []
        : await this.prisma.department.findMany({
            where: { id: { in: departmentIds } },
            select: { id: true, code: true, name: true },
          });
    const departmentById = new Map(
      departments.map((department) => [department.id, department]),
    );

    return rows.map((row) => {
      const department = departmentById.get(row.departmentId);

      return {
        departmentId: row.departmentId,
        departmentCode: department?.code ?? "UNKNOWN",
        departmentName: department?.name ?? "Unknown department",
        achievementType: row.type as AchievementTypeCode,
        count: row._count._all,
      };
    });
  }

  async listAchievementTrendItems(
    where: Prisma.AchievementWhereInput,
  ): Promise<AchievementTrendItem[]> {
    const rows = await this.prisma.achievement.findMany({
      where,
      select: { createdAt: true, type: true },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      createdAt: row.createdAt,
      type: row.type as AchievementTypeCode,
    }));
  }

  async groupFeesByPayStatus(
    where: Prisma.FeeRecordWhereInput,
  ): Promise<CountBucket<PayStatusCode>[]> {
    const rows = await this.prisma.feeRecord.groupBy({
      by: ["payStatus"],
      where: toActiveFeeWhere(where),
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.payStatus as PayStatusCode,
      count: row._count._all,
    }));
  }

  async countOverdueFees(
    where: Prisma.FeeRecordWhereInput,
    todayDateOnly: Date,
  ): Promise<number> {
    return this.prisma.feeRecord.count({
      where: {
        AND: [
          toActiveFeeWhere(where),
          { dueDate: { lt: todayDateOnly } },
          { payStatus: { not: PayStatusCode.paid } },
        ],
      },
    });
  }

  async countDueSoonFees(
    where: Prisma.FeeRecordWhereInput,
    todayDateOnly: Date,
    dueSoonEndDateOnly: Date,
  ): Promise<number> {
    return this.prisma.feeRecord.count({
      where: {
        AND: [
          toActiveFeeWhere(where),
          { dueDate: { gte: todayDateOnly, lte: dueSoonEndDateOnly } },
          { payStatus: { not: PayStatusCode.paid } },
        ],
      },
    });
  }

  async groupWorkflowTasksByStatus(
    where: Prisma.WorkflowTaskWhereInput,
  ): Promise<CountBucket<WorkflowTaskStatusCode>[]> {
    const rows = await this.prisma.workflowTask.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status as WorkflowTaskStatusCode,
      count: row._count._all,
    }));
  }

  async groupConversionsByStatus(
    where: Prisma.AchievementConversionWhereInput,
  ): Promise<CountBucket<AchievementConversionStatusCode>[]> {
    const rows = await this.prisma.achievementConversion.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status as AchievementConversionStatusCode,
      count: row._count._all,
    }));
  }

  async sumConversionAmounts(
    where: Prisma.AchievementConversionWhereInput,
  ): Promise<ConversionAmountSummary> {
    const result = await this.prisma.achievementConversion.aggregate({
      where,
      _sum: {
        contractAmount: true,
        revenueAmount: true,
      },
    });

    return {
      contractTotal: result._sum.contractAmount?.toFixed(2) ?? "0.00",
      revenueTotal: result._sum.revenueAmount?.toFixed(2) ?? "0.00",
    };
  }
}

const toActiveFeeWhere = (
  where: Prisma.FeeRecordWhereInput,
): Prisma.FeeRecordWhereInput => ({
  AND: [where, { archivedAt: null }],
});
