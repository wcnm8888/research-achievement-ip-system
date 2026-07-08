import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  AchievementConversionContractStatusCode,
  AchievementConversionEvaluationEffectCode,
  AchievementConversionRevenueStatusCode,
  AchievementConversionStatusCode,
} from "../achievement-conversions/domain/achievement-conversion-domain.types";
import { AchievementStatusCode, AchievementTypeCode } from "../achievements/domain/achievement-domain.types";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { ReminderStatusCode } from "../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { CitationAchievementInput } from "./domain/citation-analytics";
import {
  DashboardApiCallStatusCode,
  DashboardBucket,
  DashboardDepartmentRankBucket,
  DashboardIntegrationCallBucket,
} from "./domain/dashboard-domain.types";

@Injectable()
export class DashboardRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async countAchievements(
    policyWhere: Prisma.AchievementWhereInput,
  ): Promise<number> {
    return this.prisma.achievement.count({ where: policyWhere });
  }

  async groupAchievementsByType(
    policyWhere: Prisma.AchievementWhereInput,
  ): Promise<DashboardBucket<AchievementTypeCode>[]> {
    const rows = await this.prisma.achievement.groupBy({
      by: ["type"],
      where: policyWhere,
      _count: { _all: true },
    });

    return rows.map((row) => ({ key: row.type as AchievementTypeCode, count: row._count._all }));
  }

  async groupAchievementsByStatus(
    policyWhere: Prisma.AchievementWhereInput,
  ): Promise<DashboardBucket<AchievementStatusCode>[]> {
    const rows = await this.prisma.achievement.groupBy({
      by: ["status"],
      where: policyWhere,
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status as AchievementStatusCode,
      count: row._count._all,
    }));
  }

  async countConversions(
    achievementPolicyWhere: Prisma.AchievementWhereInput,
  ): Promise<number> {
    try {
      return await this.prisma.achievementConversion.count({
        where: toConversionWhere(achievementPolicyWhere),
      });
    } catch (error) {
      return fallbackForMissingConversionTable(error, 0);
    }
  }

  async sumConversionAmounts(
    achievementPolicyWhere: Prisma.AchievementWhereInput,
  ): Promise<{ contractTotal: string; revenueTotal: string }> {
    const result = await withMissingConversionTableFallback(errorSafeZeroAmounts, () =>
      this.prisma.achievementConversion.aggregate({
        where: toConversionWhere(achievementPolicyWhere),
        _sum: {
          contractAmount: true,
          revenueAmount: true,
        },
      }),
    );

    return {
      contractTotal: result._sum.contractAmount?.toFixed(2) ?? "0.00",
      revenueTotal: result._sum.revenueAmount?.toFixed(2) ?? "0.00",
    };
  }

  async groupConversionsByStatus(
    achievementPolicyWhere: Prisma.AchievementWhereInput,
  ): Promise<DashboardBucket<AchievementConversionStatusCode>[]> {
    try {
      const rows = await this.prisma.achievementConversion.groupBy({
        by: ["status"],
        where: toConversionWhere(achievementPolicyWhere),
        _count: { _all: true },
      });

      return rows.map((row) => ({
        key: row.status as AchievementConversionStatusCode,
        count: row._count._all,
      }));
    } catch (error) {
      return fallbackForMissingConversionTable(error, []);
    }
  }

  async groupConversionsByContractStatus(
    achievementPolicyWhere: Prisma.AchievementWhereInput,
  ): Promise<DashboardBucket<AchievementConversionContractStatusCode>[]> {
    try {
      const rows = await this.prisma.achievementConversion.groupBy({
        by: ["contractStatus"],
        where: toConversionWhere(achievementPolicyWhere),
        _count: { _all: true },
      });

      return rows.map((row) => ({
        key: row.contractStatus as AchievementConversionContractStatusCode,
        count: row._count._all,
      }));
    } catch (error) {
      return fallbackForMissingConversionTable(error, []);
    }
  }

  async groupConversionsByRevenueStatus(
    achievementPolicyWhere: Prisma.AchievementWhereInput,
  ): Promise<DashboardBucket<AchievementConversionRevenueStatusCode>[]> {
    try {
      const rows = await this.prisma.achievementConversion.groupBy({
        by: ["revenueStatus"],
        where: toConversionWhere(achievementPolicyWhere),
        _count: { _all: true },
      });

      return rows.map((row) => ({
        key: row.revenueStatus as AchievementConversionRevenueStatusCode,
        count: row._count._all,
      }));
    } catch (error) {
      return fallbackForMissingConversionTable(error, []);
    }
  }

  async countOverdueConversions(
    achievementPolicyWhere: Prisma.AchievementWhereInput,
    todayDateOnly: Date,
  ): Promise<number> {
    try {
      return await this.prisma.achievementConversion.count({
        where: {
          AND: [
            toConversionWhere(achievementPolicyWhere),
            {
              OR: [
                { revenueStatus: AchievementConversionRevenueStatusCode.overdue },
                {
                  revenueStatus: {
                    in: [
                      AchievementConversionRevenueStatusCode.unpaid,
                      AchievementConversionRevenueStatusCode.partial,
                    ],
                  },
                  revenueDueDate: { lt: todayDateOnly },
                },
              ],
            },
          ],
        },
      });
    } catch (error) {
      return fallbackForMissingConversionTable(error, 0);
    }
  }

  async groupConversionsByEvaluationEffect(
    achievementPolicyWhere: Prisma.AchievementWhereInput,
  ): Promise<DashboardBucket<AchievementConversionEvaluationEffectCode>[]> {
    try {
      const rows = await this.prisma.achievementConversion.groupBy({
        by: ["evaluationEffect"],
        where: toConversionWhere(achievementPolicyWhere),
        _count: { _all: true },
      });

      return rows.map((row) => ({
        key: row.evaluationEffect as AchievementConversionEvaluationEffectCode,
        count: row._count._all,
      }));
    } catch (error) {
      return fallbackForMissingConversionTable(error, []);
    }
  }

  async groupAchievementsByDepartment(
    policyWhere: Prisma.AchievementWhereInput,
    take: number,
  ): Promise<DashboardDepartmentRankBucket[]> {
    const rows = await this.prisma.achievement.groupBy({
      by: ["departmentId"],
      where: policyWhere,
      _count: { _all: true },
    });

    const rankedRows = rows
      .map((row) => ({ departmentId: row.departmentId, count: row._count._all }))
      .sort((left, right) => right.count - left.count)
      .slice(0, take);
    const departmentIds = rankedRows.map((row) => row.departmentId);

    if (departmentIds.length === 0) {
      return [];
    }

    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, code: true, name: true },
    });
    const departmentById = new Map(departments.map((department) => [department.id, department]));

    return rankedRows.map((row) => {
      const department = departmentById.get(row.departmentId);

      return {
        departmentId: row.departmentId,
        departmentCode: department?.code ?? "UNKNOWN",
        departmentName: department?.name ?? "未知部门",
        count: row.count,
      };
    });
  }

  async groupFeesByPayStatus(
    policyWhere: Prisma.FeeRecordWhereInput,
  ): Promise<DashboardBucket<PayStatusCode>[]> {
    const rows = await this.prisma.feeRecord.groupBy({
      by: ["payStatus"],
      where: toActiveFeeWhere(policyWhere),
      _count: { _all: true },
    });

    return rows.map((row) => ({ key: row.payStatus as PayStatusCode, count: row._count._all }));
  }

  async countOverdueFees(
    policyWhere: Prisma.FeeRecordWhereInput,
    todayDateOnly: Date,
  ): Promise<number> {
    return this.prisma.feeRecord.count({
      where: {
        AND: [
          toActiveFeeWhere(policyWhere),
          { dueDate: { lt: todayDateOnly } },
          { payStatus: { in: [PayStatusCode.pending, PayStatusCode.overdue] } },
        ],
      },
    });
  }

  async countDueSoonFees(
    policyWhere: Prisma.FeeRecordWhereInput,
    todayDateOnly: Date,
    dueSoonEndDateOnly: Date,
  ): Promise<number> {
    return this.prisma.feeRecord.count({
      where: {
        AND: [
          toActiveFeeWhere(policyWhere),
          { dueDate: { gte: todayDateOnly, lte: dueSoonEndDateOnly } },
          { payStatus: PayStatusCode.pending },
        ],
      },
    });
  }

  async groupWorkflowTasksByStatus(
    userId: string,
  ): Promise<DashboardBucket<WorkflowTaskStatusCode>[]> {
    const rows = await this.prisma.workflowTask.groupBy({
      by: ["status"],
      where: { assigneeId: userId },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status as WorkflowTaskStatusCode,
      count: row._count._all,
    }));
  }

  async groupReminderTasksByStatus(
    userId: string,
  ): Promise<DashboardBucket<ReminderStatusCode>[]> {
    const rows = await this.prisma.reminderTask.groupBy({
      by: ["status"],
      where: { receiverId: userId },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status as ReminderStatusCode,
      count: row._count._all,
    }));
  }

  async countRecentApiCallLogs(since: Date): Promise<number> {
    return this.prisma.apiCallLog.count({
      where: { createdAt: { gte: since } },
    });
  }

  async groupRecentApiCallLogsByStatus(
    since: Date,
  ): Promise<DashboardBucket<DashboardApiCallStatusCode>[]> {
    const rows = await this.prisma.apiCallLog.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      key: row.status as DashboardApiCallStatusCode,
      count: row._count._all,
    }));
  }

  async groupRecentApiCallLogsByIntegration(
    since: Date,
    take: number,
  ): Promise<DashboardIntegrationCallBucket[]> {
    const rows = await this.prisma.apiCallLog.groupBy({
      by: ["integrationCode"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    const rankedRows = rows
      .map((row) => ({
        integrationCode: row.integrationCode,
        count: row._count._all,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, take);
    const integrationCodes = rankedRows.map((row) => row.integrationCode);

    if (integrationCodes.length === 0) {
      return [];
    }

    const integrations = await this.prisma.apiIntegration.findMany({
      where: { code: { in: integrationCodes } },
      select: { code: true, provider: true },
    });
    const integrationByCode = new Map(
      integrations.map((integration) => [integration.code, integration]),
    );

    return rankedRows.map((row) => ({
      integrationCode: row.integrationCode,
      provider: integrationByCode.get(row.integrationCode)?.provider ?? "UNKNOWN",
      count: row.count,
    }));
  }

  async listCitationAnalysisAchievements(
    policyWhere: Prisma.AchievementWhereInput,
  ): Promise<CitationAchievementInput[]> {
    const rows = await this.prisma.achievement.findMany({
      where: policyWhere,
      select: {
        id: true,
        type: true,
        status: true,
        departmentId: true,
        ownerUserId: true,
        department: {
          select: {
            code: true,
            name: true,
          },
        },
        ownerUser: {
          select: {
            name: true,
          },
        },
        paperDetail: {
          select: {
            doi: true,
            publishYear: true,
            includedType: true,
            impactFactor: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      departmentId: row.departmentId,
      departmentCode: row.department.code,
      departmentName: row.department.name,
      ownerUserId: row.ownerUserId,
      ownerName: row.ownerUser.name,
      paperDetail: row.paperDetail,
    }));
  }
}

const toActiveFeeWhere = (
  policyWhere: Prisma.FeeRecordWhereInput,
): Prisma.FeeRecordWhereInput => ({
  AND: [policyWhere, { archivedAt: null }],
});

const toConversionWhere = (
  achievementPolicyWhere: Prisma.AchievementWhereInput,
): Prisma.AchievementConversionWhereInput => ({
  achievement: achievementPolicyWhere,
});

const errorSafeZeroAmounts = {
  _sum: {
    contractAmount: null,
    revenueAmount: null,
  },
};

const withMissingConversionTableFallback = async <T>(
  fallback: T,
  query: () => Promise<T>,
): Promise<T> => {
  try {
    return await query();
  } catch (error) {
    return fallbackForMissingConversionTable(error, fallback);
  }
};

const fallbackForMissingConversionTable = <T>(error: unknown, fallback: T): T => {
  if (isMissingConversionTableError(error)) {
    return fallback;
  }

  throw error;
};

const isMissingConversionTableError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const record = error as { code?: unknown; meta?: { table?: unknown } };
  const table = typeof record.meta?.table === "string" ? record.meta.table : "";

  return record.code === "P2021" && table.includes("achievement_conversions");
};
