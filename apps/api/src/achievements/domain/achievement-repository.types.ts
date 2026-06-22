import { Prisma } from "@prisma/client";
import { ResourceAccessGrantRecord } from "../../authorization/policy/resource-grant-policy.service";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  ContributorRoleCode,
  ContributorTypeCode,
  PatentLegalStatusCode,
  PatentTypeCode,
  SecretLevelCode,
  SoftwareTypeCode,
} from "./achievement-domain.types";

export const achievementAggregateInclude = {
  paperDetail: true,
  patentDetail: true,
  softwareCopyrightDetail: true,
  contributors: {
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.AchievementInclude;

export type AchievementAggregate = Prisma.AchievementGetPayload<{
  include: typeof achievementAggregateInclude;
}>;

export const achievementStateSelect = {
  id: true,
  status: true,
  secretLevel: true,
  departmentId: true,
  ownerUserId: true,
  submittedById: true,
  updatedById: true,
  archivedById: true,
  voidedById: true,
  version: true,
  submittedAt: true,
  archivedAt: true,
  voidedAt: true,
  voidReason: true,
} satisfies Prisma.AchievementSelect;

export type AchievementStateRecord = Prisma.AchievementGetPayload<{
  select: typeof achievementStateSelect;
}>;

export type AchievementStateResult = AchievementStateRecord;

export const achievementListItemSelect = {
  id: true,
  type: true,
  title: true,
  status: true,
  secretLevel: true,
  departmentId: true,
  ownerUserId: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  archivedAt: true,
  voidedAt: true,
} satisfies Prisma.AchievementSelect;

export type AchievementListRecord = Prisma.AchievementGetPayload<{
  select: typeof achievementListItemSelect;
}>;

export type AchievementListFilters = {
  status?: AchievementStatusCode;
  type?: AchievementTypeCode;
  keyword?: string;
};

export type ListAchievementsInput = {
  where: Prisma.AchievementWhereInput;
  filters: AchievementListFilters;
  page: number;
  pageSize: number;
};

export type AchievementListPage = {
  items: AchievementListRecord[];
  total: number;
};

export type AchievementListItem = {
  id: string;
  type: AchievementTypeCode;
  status: AchievementStatusCode;
  secretLevel: SecretLevelCode;
  departmentId: string;
  ownerUserId: string;
  title: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  submittedAt: Date | string | null;
  archivedAt: Date | string | null;
  voidedAt: Date | string | null;
  isRestricted: boolean;
  isRedacted: boolean;
};

export type AchievementListResult = {
  items: AchievementListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreatePaperDetailDraftInput = {
  doi?: string | null;
  doiNormalized?: string | null;
  journal?: string | null;
  issnCn?: string | null;
  publishYear?: number | null;
  includedType?: string | null;
  impactFactor?: number | string | null;
  partition?: string | null;
  abstract?: string | null;
};

export type CreatePatentDetailDraftInput = {
  applicationNo?: string | null;
  applicationNoNormalized?: string | null;
  grantNo?: string | null;
  grantNoNormalized?: string | null;
  patentType?: PatentTypeCode | null;
  filingDate?: Date | string | null;
  grantDate?: Date | string | null;
  nextFeeDate?: Date | string | null;
  feeAmount?: number | string | null;
  legalStatus?: PatentLegalStatusCode | null;
};

export type CreateSoftwareCopyrightDetailDraftInput = {
  registrationNo?: string | null;
  registrationNoNormalized?: string | null;
  softwareVersion?: string | null;
  softwareType?: SoftwareTypeCode | null;
  publishDate?: Date | string | null;
  registerDate?: Date | string | null;
  runEnv?: string | null;
};

export type CreateAchievementContributorDraftInput = {
  name: string;
  userId?: string | null;
  organization?: string | null;
  contributorType: ContributorTypeCode;
  contributorRole?: ContributorRoleCode | null;
  sortOrder: number;
};

export type CreateAchievementDraftInput = {
  type: AchievementTypeCode;
  title: string;
  secretLevel: SecretLevelCode;
  departmentId: string;
  ownerUserId: string;
  createdById: string;
  updatedById: string;
  paperDetail?: CreatePaperDetailDraftInput;
  patentDetail?: CreatePatentDetailDraftInput;
  softwareCopyrightDetail?: CreateSoftwareCopyrightDetailDraftInput;
  contributors: readonly CreateAchievementContributorDraftInput[];
};

export type UpdateAchievementDraftInput = {
  achievementId: string;
  type: AchievementTypeCode;
  title?: string;
  secretLevel?: SecretLevelCode;
  updatedById: string;
  paperDetail?: CreatePaperDetailDraftInput;
  patentDetail?: CreatePatentDetailDraftInput;
  softwareCopyrightDetail?: CreateSoftwareCopyrightDetailDraftInput;
};

export type AchievementStatusTransitionInput = {
  achievementId: string;
  expectedStatus: AchievementStatusCode;
  nextStatus: AchievementStatusCode;
  updatedById: string;
  submittedById?: string | null;
  submittedAt?: Date | null;
  voidedById?: string | null;
  voidedAt?: Date | null;
  voidReason?: string | null;
  archivedById?: string | null;
  archivedAt?: Date | null;
};

export type NormalizedAchievementConflictInput = {
  doiNormalized?: string | null;
  applicationNoNormalized?: string | null;
  grantNoNormalized?: string | null;
  registrationNoNormalized?: string | null;
};

export type NormalizedAchievementConflictField =
  | "doi"
  | "applicationNo"
  | "grantNo"
  | "registrationNo";

export type NormalizedAchievementConflict = {
  field: NormalizedAchievementConflictField;
  normalizedValue: string;
  achievementId: string;
};

export type PrismaUniqueConflict = {
  code: "P2002";
  meta?: {
    target?: readonly string[];
  };
};

export type AchievementResourceGrant = ResourceAccessGrantRecord;
