import { Prisma } from "@prisma/client";
import {
  AchievementConversionStatusCode,
  AchievementConversionTypeCode,
} from "./achievement-conversion-domain.types";
import { AchievementStatusCode, SecretLevelCode } from "../../achievements/domain/achievement-domain.types";

export type AchievementConversionRecord = {
  id: string;
  achievementId: string;
  departmentId: string;
  conversionType: AchievementConversionTypeCode;
  counterpartyName: string;
  contractAmount: string | null;
  revenueAmount: string | null;
  status: AchievementConversionStatusCode;
  conversionDate: Date | null;
  benefitDistributionSummary: string | null;
  remarks: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  achievement: {
    id: string;
    status: AchievementStatusCode;
  };
};

export type AchievementConversionParentRecord = {
  id: string;
  status: AchievementStatusCode;
  departmentId: string;
  ownerUserId: string;
  secretLevel: SecretLevelCode;
};

export type CreateAchievementConversionInput = {
  achievementId: string;
  departmentId: string;
  conversionType: AchievementConversionTypeCode;
  counterpartyName: string;
  contractAmount?: number | null;
  revenueAmount?: number | null;
  status: AchievementConversionStatusCode;
  conversionDate?: Date | null;
  benefitDistributionSummary?: string | null;
  remarks?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
};

export type UpdateAchievementConversionInput = Partial<
  Pick<
    CreateAchievementConversionInput,
    | "conversionType"
    | "counterpartyName"
    | "contractAmount"
    | "revenueAmount"
    | "status"
    | "conversionDate"
    | "benefitDistributionSummary"
    | "remarks"
    | "updatedById"
  >
> & {
  conversionId: string;
};

export type ListAchievementConversionsInput = {
  achievementId: string;
  achievementWhere: Prisma.AchievementWhereInput;
};

export type FindAchievementConversionInput = {
  conversionId: string;
  achievementWhere: Prisma.AchievementWhereInput;
};

export const achievementConversionSelect = {
  id: true,
  achievementId: true,
  departmentId: true,
  conversionType: true,
  counterpartyName: true,
  contractAmount: true,
  revenueAmount: true,
  status: true,
  conversionDate: true,
  benefitDistributionSummary: true,
  remarks: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  achievement: {
    select: {
      id: true,
      status: true,
    },
  },
} satisfies Prisma.AchievementConversionSelect;

export const achievementConversionParentSelect = {
  id: true,
  status: true,
  departmentId: true,
  ownerUserId: true,
  secretLevel: true,
} satisfies Prisma.AchievementSelect;
