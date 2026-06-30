import { Prisma } from "@prisma/client";
import {
  FeeAchievementParentRecord,
  FeeRecordQueryInput,
  FeeRecordRecord,
  FeeReviewTransitionInput,
  FeeStateRecord,
  FeeStatusTransitionInput,
  CreateFeeRecordInput,
} from "./fee-repository.types";

type FeePersistenceRow = FeeRecordRecord;
type FeeStatePersistenceRow = FeeStateRecord;
type FeeAchievementParentPersistenceRow = FeeAchievementParentRecord;

export const toFeeRecordCreateData = (
  input: CreateFeeRecordInput,
): Prisma.FeeRecordUncheckedCreateInput => ({
  achievementId: input.achievementId,
  departmentId: input.departmentId,
  feeType: input.feeType,
  fundSource: input.fundSource ?? null,
  amount: input.amount,
  dueDate: toPrismaDate(input.dueDate),
  voucherNo: input.voucherNo ?? null,
  createdById: input.createdById ?? null,
  updatedById: input.updatedById ?? null,
  ...(input.createdAt ? { createdAt: input.createdAt } : {}),
});

export const toFeeFindManyWhere = (
  input: FeeRecordQueryInput,
): Prisma.FeeRecordWhereInput => ({
  AND: [
    input.where,
    ...(input.achievementId ? [{ achievementId: input.achievementId }] : []),
    ...(input.departmentId ? [{ departmentId: input.departmentId }] : []),
    ...(input.feeType ? [{ feeType: input.feeType }] : []),
    ...(input.payStatus ? [{ payStatus: input.payStatus }] : []),
    ...(input.dueDateFrom || input.dueDateTo
      ? [
          {
            dueDate: {
              ...(input.dueDateFrom ? { gte: input.dueDateFrom } : {}),
              ...(input.dueDateTo ? { lte: input.dueDateTo } : {}),
            },
          },
        ]
      : []),
    ...(input.includeArchived ? [] : [{ archivedAt: null }]),
  ],
});

export const toFeeStatusTransitionData = (
  input: FeeStatusTransitionInput,
): Prisma.FeeRecordUncheckedUpdateInput => ({
  payStatus: input.nextStatus,
  updatedById: input.updatedById ?? null,
  ...(input.paidDate !== undefined
    ? { paidDate: input.paidDate === null ? null : toPrismaDate(input.paidDate) }
    : {}),
  ...(input.voucherNo !== undefined ? { voucherNo: input.voucherNo } : {}),
  ...(input.archivedAt !== undefined ? { archivedAt: input.archivedAt } : {}),
});

export const toFeeReviewTransitionData = (
  input: FeeReviewTransitionInput,
): Prisma.FeeRecordUncheckedUpdateInput => ({
  reviewStatus: input.nextReviewStatus,
  reviewedById: input.reviewedById,
  reviewedAt: input.reviewedAt,
});

export const toFeeRecord = (row: FeePersistenceRow): FeeRecordRecord => ({
  id: row.id,
  achievementId: row.achievementId,
  departmentId: row.departmentId,
  feeType: row.feeType,
  fundSource: row.fundSource,
  amount: row.amount,
  dueDate: row.dueDate,
  paidDate: row.paidDate,
  payStatus: row.payStatus,
  voucherNo: row.voucherNo,
  reviewStatus: row.reviewStatus,
  reviewedById: row.reviewedById,
  reviewedAt: row.reviewedAt,
  createdById: row.createdById,
  updatedById: row.updatedById,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  archivedAt: row.archivedAt,
});

export const toFeeStateRecord = (row: FeeStatePersistenceRow): FeeStateRecord => ({
  id: row.id,
  achievementId: row.achievementId,
  departmentId: row.departmentId,
  feeType: row.feeType,
  dueDate: row.dueDate,
  paidDate: row.paidDate,
  payStatus: row.payStatus,
  voucherNo: row.voucherNo,
  reviewStatus: row.reviewStatus,
  reviewedById: row.reviewedById,
  reviewedAt: row.reviewedAt,
  updatedById: row.updatedById,
  archivedAt: row.archivedAt,
});

export const toFeeAchievementParentRecord = (
  row: FeeAchievementParentPersistenceRow,
): FeeAchievementParentRecord => ({
  id: row.id,
  status: row.status,
  departmentId: row.departmentId,
  department: row.department,
  ownerUserId: row.ownerUserId,
  secretLevel: row.secretLevel,
});

const toPrismaDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);
