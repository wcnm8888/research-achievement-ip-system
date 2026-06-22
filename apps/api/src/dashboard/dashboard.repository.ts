import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AchievementStatusCode, AchievementTypeCode } from "../achievements/domain/achievement-domain.types";
import { PrismaService } from "../database/prisma.service";
import { PayStatusCode } from "../fees/domain/fee-domain.types";
import { ReminderStatusCode } from "../reminders/domain/reminder-domain.types";
import { WorkflowTaskStatusCode } from "../workflow/domain/workflow-domain.types";
import { DashboardBucket } from "./domain/dashboard-domain.types";

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
}

const toActiveFeeWhere = (
  policyWhere: Prisma.FeeRecordWhereInput,
): Prisma.FeeRecordWhereInput => ({
  AND: [policyWhere, { archivedAt: null }],
});
