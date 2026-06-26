import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  toFeeAchievementParentRecord,
  toFeeFindManyWhere,
  toFeeRecord,
  toFeeRecordCreateData,
  toFeeStateRecord,
  toFeeStatusTransitionData,
} from "./domain/fee-prisma.mapper";
import {
  CreatedFeeRecordNotFoundError,
  FeeStatusTransitionConflictError,
} from "./domain/fee-repository.errors";
import {
  CreateFeeRecordInput,
  FeeAchievementParentRecord,
  FeeRecordQueryInput,
  FeeRecordRecord,
  FeeStateRecord,
  FeeStatusTransitionInput,
} from "./domain/fee-repository.types";

const defaultFeeTake = 50;

export type FeeTransactionClient = Pick<Prisma.TransactionClient, "feeRecord">;

@Injectable()
export class FeeRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateFeeRecordInput): Promise<FeeRecordRecord> {
    return this.prisma.$transaction((tx) =>
      this.createInTransaction(tx as FeeTransactionClient, input),
    );
  }

  async createInTransaction(
    client: FeeTransactionClient,
    input: CreateFeeRecordInput,
  ): Promise<FeeRecordRecord> {
    const row = await client.feeRecord.create({
      data: toFeeRecordCreateData(input),
    });

    return toFeeRecord(row as Parameters<typeof toFeeRecord>[0]);
  }

  async findMany(input: FeeRecordQueryInput): Promise<FeeRecordRecord[]> {
    const rows = await this.prisma.feeRecord.findMany({
      where: toFeeFindManyWhere(input),
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: input.take ?? defaultFeeTake,
    });

    return rows.map((row) => toFeeRecord(row as Parameters<typeof toFeeRecord>[0]));
  }

  async findByIdWhere(
    feeRecordId: string,
    where: Prisma.FeeRecordWhereInput,
  ): Promise<FeeRecordRecord | null> {
    const row = await this.prisma.feeRecord.findFirst({
      where: {
        AND: [{ id: feeRecordId }, where, { archivedAt: null }],
      },
    });

    return row ? toFeeRecord(row as Parameters<typeof toFeeRecord>[0]) : null;
  }

  async findStateByIdWhere(
    feeRecordId: string,
    where: Prisma.FeeRecordWhereInput,
  ): Promise<FeeStateRecord | null> {
    return this.findStateByIdWhereInTransaction(this.prisma, feeRecordId, where);
  }

  async findStateByIdWhereInTransaction(
    client: FeeTransactionClient,
    feeRecordId: string,
    where: Prisma.FeeRecordWhereInput,
  ): Promise<FeeStateRecord | null> {
    const row = await client.feeRecord.findFirst({
      where: {
        AND: [{ id: feeRecordId }, where, { archivedAt: null }],
      },
      select: feeStateSelect,
    });

    return row ? toFeeStateRecord(row as Parameters<typeof toFeeStateRecord>[0]) : null;
  }

  async transitionPayStatus(
    input: FeeStatusTransitionInput,
  ): Promise<FeeStateRecord> {
    return this.prisma.$transaction((tx) =>
      this.transitionPayStatusInTransaction(tx as FeeTransactionClient, input),
    );
  }

  async transitionPayStatusInTransaction(
    client: FeeTransactionClient,
    input: FeeStatusTransitionInput,
  ): Promise<FeeStateRecord> {
    const result = await client.feeRecord.updateMany({
      where: {
        id: input.feeRecordId,
        payStatus: input.expectedStatus,
        archivedAt: null,
      },
      data: toFeeStatusTransitionData(input),
    });

    if (result.count !== 1) {
      throw new FeeStatusTransitionConflictError(
        input.feeRecordId,
        input.expectedStatus,
      );
    }

    const row = await client.feeRecord.findUnique({
      where: { id: input.feeRecordId },
      select: feeStateSelect,
    });

    if (!row) {
      throw new CreatedFeeRecordNotFoundError(input.feeRecordId);
    }

    return toFeeStateRecord(row as Parameters<typeof toFeeStateRecord>[0]);
  }

  async findAchievementParentByIdWhere(
    achievementId: string,
    where: Prisma.AchievementWhereInput,
  ): Promise<FeeAchievementParentRecord | null> {
    const row = await this.prisma.achievement.findFirst({
      where: {
        AND: [{ id: achievementId }, where],
      },
      select: feeAchievementParentSelect,
    });

    return row
      ? toFeeAchievementParentRecord(
          row as Parameters<typeof toFeeAchievementParentRecord>[0],
        )
      : null;
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }
}

const feeStateSelect = {
  id: true,
  achievementId: true,
  departmentId: true,
  feeType: true,
  dueDate: true,
  paidDate: true,
  payStatus: true,
  voucherNo: true,
  updatedById: true,
  archivedAt: true,
} satisfies Prisma.FeeRecordSelect;

const feeAchievementParentSelect = {
  id: true,
  status: true,
  departmentId: true,
  department: {
    select: {
      status: true,
      archivedAt: true,
    },
  },
  ownerUserId: true,
  secretLevel: true,
} satisfies Prisma.AchievementSelect;

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};
