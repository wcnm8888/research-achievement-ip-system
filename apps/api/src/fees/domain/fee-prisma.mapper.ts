import { Prisma } from "@prisma/client";
import {
  FeeAchievementParentRecord,
  FeeRecordQueryInput,
  FeeRecordRecord,
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
  dueDate: input.dueDate,
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
  ...(input.paidDate !== undefined ? { paidDate: input.paidDate } : {}),
  ...(input.voucherNo !== undefined ? { voucherNo: input.voucherNo } : {}),
  ...(input.archivedAt !== undefined ? { archivedAt: input.archivedAt } : {}),
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
  updatedById: row.updatedById,
  archivedAt: row.archivedAt,
});

export const toFeeAchievementParentRecord = (
  row: FeeAchievementParentPersistenceRow,
): FeeAchievementParentRecord => ({
  id: row.id,
  status: row.status,
  departmentId: row.departmentId,
  ownerUserId: row.ownerUserId,
  secretLevel: row.secretLevel,
});
