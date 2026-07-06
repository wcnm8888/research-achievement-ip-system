import { Prisma } from "@prisma/client";
import {
  CreateAchievementConversionInput,
  AchievementConversionParentRecord,
  AchievementConversionRecord,
  UpdateAchievementConversionInput,
} from "./achievement-conversion-repository.types";
import { AchievementConversionBenefitDistributionJson } from "./achievement-conversion-domain.types";

type AchievementConversionRow = Omit<
  AchievementConversionRecord,
  "contractAmount" | "revenueAmount" | "benefitDistributionJson"
> & {
  contractAmount: Prisma.Decimal | null;
  revenueAmount: Prisma.Decimal | null;
  benefitDistributionJson: Prisma.JsonValue | null;
};

export const toAchievementConversionRecord = (
  row: AchievementConversionRow,
): AchievementConversionRecord => ({
  ...row,
  contractAmount: row.contractAmount?.toFixed(2) ?? null,
  revenueAmount: row.revenueAmount?.toFixed(2) ?? null,
  benefitDistributionJson:
    row.benefitDistributionJson as AchievementConversionBenefitDistributionJson | null,
});

export const toAchievementConversionParentRecord = (
  row: AchievementConversionParentRecord,
): AchievementConversionParentRecord => row;

export const toAchievementConversionCreateData = (
  input: CreateAchievementConversionInput,
): Prisma.AchievementConversionCreateInput => ({
  achievement: { connect: { id: input.achievementId } },
  department: { connect: { id: input.departmentId } },
  conversionType: input.conversionType,
  counterpartyName: input.counterpartyName,
  contractAmount: input.contractAmount ?? null,
  revenueAmount: input.revenueAmount ?? null,
  status: input.status,
  conversionDate: input.conversionDate ?? null,
  benefitDistributionSummary: input.benefitDistributionSummary ?? null,
  contractStatus: input.contractStatus,
  revenueStatus: input.revenueStatus,
  revenueDueDate: input.revenueDueDate ?? null,
  revenueReceivedDate: input.revenueReceivedDate ?? null,
  benefitDistributionJson:
    input.benefitDistributionJson === undefined
      ? undefined
      : input.benefitDistributionJson === null
        ? Prisma.JsonNull
        : input.benefitDistributionJson,
  evaluationEffect: input.evaluationEffect,
  evaluationSummary: input.evaluationSummary ?? null,
  evaluationDate: input.evaluationDate ?? null,
  remarks: input.remarks ?? null,
  createdBy: input.createdById ? { connect: { id: input.createdById } } : undefined,
  updatedBy: input.updatedById ? { connect: { id: input.updatedById } } : undefined,
});

export const toAchievementConversionUpdateData = (
  input: UpdateAchievementConversionInput,
): Prisma.AchievementConversionUpdateInput => ({
  ...(input.conversionType !== undefined ? { conversionType: input.conversionType } : {}),
  ...(input.counterpartyName !== undefined ? { counterpartyName: input.counterpartyName } : {}),
  ...(input.contractAmount !== undefined ? { contractAmount: input.contractAmount } : {}),
  ...(input.revenueAmount !== undefined ? { revenueAmount: input.revenueAmount } : {}),
  ...(input.status !== undefined ? { status: input.status } : {}),
  ...(input.conversionDate !== undefined ? { conversionDate: input.conversionDate } : {}),
  ...(input.benefitDistributionSummary !== undefined
    ? { benefitDistributionSummary: input.benefitDistributionSummary }
    : {}),
  ...(input.contractStatus !== undefined ? { contractStatus: input.contractStatus } : {}),
  ...(input.revenueStatus !== undefined ? { revenueStatus: input.revenueStatus } : {}),
  ...(input.revenueDueDate !== undefined ? { revenueDueDate: input.revenueDueDate } : {}),
  ...(input.revenueReceivedDate !== undefined
    ? { revenueReceivedDate: input.revenueReceivedDate }
    : {}),
  ...(input.benefitDistributionJson !== undefined
    ? {
        benefitDistributionJson:
          input.benefitDistributionJson === null
            ? Prisma.JsonNull
            : input.benefitDistributionJson,
      }
    : {}),
  ...(input.evaluationEffect !== undefined ? { evaluationEffect: input.evaluationEffect } : {}),
  ...(input.evaluationSummary !== undefined
    ? { evaluationSummary: input.evaluationSummary }
    : {}),
  ...(input.evaluationDate !== undefined ? { evaluationDate: input.evaluationDate } : {}),
  ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
  ...(input.updatedById !== undefined
    ? {
        updatedBy: input.updatedById
          ? { connect: { id: input.updatedById } }
          : { disconnect: true },
      }
    : {}),
});
