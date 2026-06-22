import { Prisma } from "@prisma/client";
import { SecretLevelCode } from "../../authorization/constants/secret-level-code";
import { AchievementStatusCode } from "../../achievements/domain/achievement-domain.types";
import { FeeTypeCode, FundSourceCode, PayStatusCode } from "./fee-domain.types";

export type FeeRecordRecord = {
  id: string;
  achievementId: string;
  departmentId: string;
  feeType: FeeTypeCode;
  fundSource: FundSourceCode | null;
  amount: Prisma.Decimal | number | string;
  dueDate: Date;
  paidDate: Date | null;
  payStatus: PayStatusCode;
  voucherNo: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type FeeStateRecord = Pick<
  FeeRecordRecord,
  | "id"
  | "achievementId"
  | "departmentId"
  | "feeType"
  | "dueDate"
  | "paidDate"
  | "payStatus"
  | "voucherNo"
  | "updatedById"
  | "archivedAt"
>;

export type FeeAchievementParentRecord = {
  id: string;
  status: AchievementStatusCode;
  departmentId: string;
  ownerUserId: string;
  secretLevel: SecretLevelCode;
};

export type CreateFeeRecordInput = {
  achievementId: string;
  departmentId: string;
  feeType: FeeTypeCode;
  fundSource?: FundSourceCode | null;
  amount: number | string;
  dueDate: Date | string;
  voucherNo?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt?: Date;
};

export type FeeRecordQueryInput = {
  where: Prisma.FeeRecordWhereInput;
  achievementId?: string;
  departmentId?: string;
  feeType?: FeeTypeCode;
  payStatus?: PayStatusCode;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  includeArchived?: boolean;
  take?: number;
};

export type FeeStatusTransitionInput = {
  feeRecordId: string;
  expectedStatus: PayStatusCode;
  nextStatus: PayStatusCode;
  updatedById?: string | null;
  paidDate?: Date | string | null;
  voucherNo?: string | null;
  archivedAt?: Date | null;
};
