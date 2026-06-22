import { Prisma } from "@prisma/client";
import { ResourceAccessGrantRecord } from "../../authorization/policy/resource-grant-policy.service";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  PatentLegalStatusCode,
  SecretLevelCode,
} from "../../achievements/domain/achievement-domain.types";
import { FeeTypeCode, PayStatusCode } from "../../fees/domain/fee-domain.types";

export const SearchTargetTypeCode = {
  achievement: "ACHIEVEMENT",
  feeRecord: "FEE_RECORD",
} as const;

export type SearchTargetTypeCode =
  (typeof SearchTargetTypeCode)[keyof typeof SearchTargetTypeCode];

export type SearchQueryInput = {
  keyword?: string;
  targetTypes?: readonly SearchTargetTypeCode[];
  achievementType?: AchievementTypeCode;
  achievementStatus?: AchievementStatusCode;
  feeType?: FeeTypeCode;
  payStatus?: PayStatusCode;
  departmentId?: string;
  take?: number;
};

export type SearchAchievementRecord = {
  id: string;
  type: AchievementTypeCode;
  title: string;
  status: AchievementStatusCode;
  secretLevel: SecretLevelCode;
  departmentId: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
  paperDetail: { doi: string | null } | null;
  patentDetail: {
    applicationNo: string | null;
    grantNo: string | null;
    legalStatus: PatentLegalStatusCode;
  } | null;
  softwareCopyrightDetail: { registrationNo: string | null } | null;
};

export type SearchFeeRecord = {
  id: string;
  achievementId: string;
  departmentId: string;
  feeType: FeeTypeCode;
  dueDate: Date;
  paidDate: Date | null;
  payStatus: PayStatusCode;
  createdAt: Date;
  updatedAt: Date;
};

export type SearchAdapterInput = {
  query: SearchQueryInput;
  achievementWhere?: Prisma.AchievementWhereInput;
  feeWhere?: Prisma.FeeRecordWhereInput;
};

export type SearchAdapterResult = {
  achievements: SearchAchievementRecord[];
  fees: SearchFeeRecord[];
  achievementGrants: ResourceAccessGrantRecord[];
};

export type SearchResultItem =
  | {
      targetType: typeof SearchTargetTypeCode.achievement;
      id: string;
      type: AchievementTypeCode;
      status: AchievementStatusCode;
      departmentId: string;
      secretLevel: SecretLevelCode;
      title: string | null;
      identifiers: {
        doi?: string;
        patentApplicationNo?: string;
        patentGrantNo?: string;
        softwareRegistrationNo?: string;
      };
      redacted: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  | {
      targetType: typeof SearchTargetTypeCode.feeRecord;
      id: string;
      achievementId: string;
      departmentId: string;
      feeType: FeeTypeCode;
      payStatus: PayStatusCode;
      dueDate: Date;
      paidDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };

export type SearchResult = {
  items: SearchResultItem[];
  total: number;
};
