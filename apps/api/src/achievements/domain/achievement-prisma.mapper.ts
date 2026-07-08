import { Prisma } from "@prisma/client";
import { ResourceTypeCode } from "../../authorization/constants/resource-type-code";
import { ResourceAccessGrantRecord } from "../../authorization/policy/resource-grant-policy.service";
import { AchievementStatusCode, AchievementTypeCode } from "./achievement-domain.types";
import {
  AchievementStatusTransitionInput,
  CreateAchievementContributorDraftInput,
  CreateAchievementDraftInput,
  CreatePaperDetailDraftInput,
  CreatePatentDetailDraftInput,
  CreateSoftwareCopyrightDetailDraftInput,
  UpdateAchievementDraftInput,
} from "./achievement-repository.types";

type ResourceGrantPrismaRecord = {
  resourceType: string;
  resourceId: string;
  granteeType: string;
  granteeId: string;
  grantType: string;
  status: string;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
};

export const toAchievementCreateData = (
  input: CreateAchievementDraftInput,
): Prisma.AchievementUncheckedCreateInput => ({
  type: input.type,
  title: input.title,
  status: AchievementStatusCode.draft,
  secretLevel: input.secretLevel,
  departmentId: input.departmentId,
  ownerUserId: input.ownerUserId,
  createdById: input.createdById,
  updatedById: input.updatedById,
});

export const toPaperDetailCreateData = (
  achievementId: string,
  detail: CreatePaperDetailDraftInput,
): Prisma.PaperDetailUncheckedCreateInput => ({
  achievementId,
  doi: detail.doi ?? null,
  doiNormalized: detail.doiNormalized ?? null,
  journal: detail.journal ?? null,
  issnCn: detail.issnCn ?? null,
  publishYear: detail.publishYear ?? null,
  includedType: detail.includedType ?? null,
  impactFactor: detail.impactFactor ?? null,
  partition: detail.partition ?? null,
  abstract: detail.abstract ?? null,
});

export const toPatentDetailCreateData = (
  achievementId: string,
  detail: CreatePatentDetailDraftInput,
): Prisma.PatentDetailUncheckedCreateInput => ({
  achievementId,
  applicationNo: detail.applicationNo ?? null,
  applicationNoNormalized: detail.applicationNoNormalized ?? null,
  grantNo: detail.grantNo ?? null,
  grantNoNormalized: detail.grantNoNormalized ?? null,
  patentType: detail.patentType ?? null,
  filingDate: toPrismaDateOnly(detail.filingDate),
  grantDate: toPrismaDateOnly(detail.grantDate),
  nextFeeDate: toPrismaDateOnly(detail.nextFeeDate),
  feeAmount: detail.feeAmount ?? null,
  legalStatus: detail.legalStatus ?? undefined,
});

export const toSoftwareCopyrightDetailCreateData = (
  achievementId: string,
  detail: CreateSoftwareCopyrightDetailDraftInput,
): Prisma.SoftwareCopyrightDetailUncheckedCreateInput => ({
  achievementId,
  registrationNo: detail.registrationNo ?? null,
  registrationNoNormalized: detail.registrationNoNormalized ?? null,
  softwareVersion: detail.softwareVersion ?? null,
  softwareType: detail.softwareType ?? null,
  publishDate: toPrismaDateOnly(detail.publishDate),
  registerDate: toPrismaDateOnly(detail.registerDate),
  runEnv: detail.runEnv ?? null,
});

export const toContributorCreateManyData = (
  achievementId: string,
  contributors: readonly CreateAchievementContributorDraftInput[],
): Prisma.AchievementContributorCreateManyInput[] =>
  contributors.map((contributor) => ({
    achievementId,
    name: contributor.name,
    userId: contributor.userId ?? null,
    organization: contributor.organization ?? null,
    contributorType: contributor.contributorType,
    contributorRole: contributor.contributorRole ?? null,
    sortOrder: contributor.sortOrder,
  }));

export const toAchievementUpdateData = (
  input: UpdateAchievementDraftInput,
): Prisma.AchievementUncheckedUpdateInput => ({
  ...(input.title !== undefined ? { title: input.title } : {}),
  ...(input.secretLevel !== undefined ? { secretLevel: input.secretLevel } : {}),
  updatedById: input.updatedById,
  version: { increment: 1 },
});

export const toAchievementStatusTransitionData = (
  input: AchievementStatusTransitionInput,
): Prisma.AchievementUncheckedUpdateManyInput => ({
  status: input.nextStatus,
  updatedById: input.updatedById,
  ...(input.submittedById !== undefined ? { submittedById: input.submittedById } : {}),
  ...(input.submittedAt !== undefined ? { submittedAt: input.submittedAt } : {}),
  ...(input.voidedById !== undefined ? { voidedById: input.voidedById } : {}),
  ...(input.voidedAt !== undefined ? { voidedAt: input.voidedAt } : {}),
  ...(input.voidReason !== undefined ? { voidReason: input.voidReason } : {}),
  ...(input.archivedById !== undefined ? { archivedById: input.archivedById } : {}),
  ...(input.archivedAt !== undefined ? { archivedAt: input.archivedAt } : {}),
  version: { increment: 1 },
});

export const toPaperDetailUpdateData = (
  detail: CreatePaperDetailDraftInput,
): Prisma.PaperDetailUncheckedUpdateInput => ({
  ...(detail.doi !== undefined ? { doi: detail.doi } : {}),
  ...(detail.doiNormalized !== undefined ? { doiNormalized: detail.doiNormalized } : {}),
  ...(detail.journal !== undefined ? { journal: detail.journal } : {}),
  ...(detail.issnCn !== undefined ? { issnCn: detail.issnCn } : {}),
  ...(detail.publishYear !== undefined ? { publishYear: detail.publishYear } : {}),
  ...(detail.includedType !== undefined ? { includedType: detail.includedType } : {}),
  ...(detail.impactFactor !== undefined ? { impactFactor: detail.impactFactor } : {}),
  ...(detail.partition !== undefined ? { partition: detail.partition } : {}),
  ...(detail.abstract !== undefined ? { abstract: detail.abstract } : {}),
});

export const toPatentDetailUpdateData = (
  detail: CreatePatentDetailDraftInput,
): Prisma.PatentDetailUncheckedUpdateInput => ({
  ...(detail.applicationNo !== undefined ? { applicationNo: detail.applicationNo } : {}),
  ...(detail.applicationNoNormalized !== undefined
    ? { applicationNoNormalized: detail.applicationNoNormalized }
    : {}),
  ...(detail.grantNo !== undefined ? { grantNo: detail.grantNo } : {}),
  ...(detail.grantNoNormalized !== undefined
    ? { grantNoNormalized: detail.grantNoNormalized }
    : {}),
  ...(detail.patentType !== undefined ? { patentType: detail.patentType } : {}),
  ...(detail.filingDate !== undefined ? { filingDate: toPrismaDateOnly(detail.filingDate) } : {}),
  ...(detail.grantDate !== undefined ? { grantDate: toPrismaDateOnly(detail.grantDate) } : {}),
  ...(detail.nextFeeDate !== undefined ? { nextFeeDate: toPrismaDateOnly(detail.nextFeeDate) } : {}),
  ...(detail.feeAmount !== undefined ? { feeAmount: detail.feeAmount } : {}),
  ...(detail.legalStatus !== undefined ? { legalStatus: detail.legalStatus ?? undefined } : {}),
});

export const toSoftwareCopyrightDetailUpdateData = (
  detail: CreateSoftwareCopyrightDetailDraftInput,
): Prisma.SoftwareCopyrightDetailUncheckedUpdateInput => ({
  ...(detail.registrationNo !== undefined ? { registrationNo: detail.registrationNo } : {}),
  ...(detail.registrationNoNormalized !== undefined
    ? { registrationNoNormalized: detail.registrationNoNormalized }
    : {}),
  ...(detail.softwareVersion !== undefined ? { softwareVersion: detail.softwareVersion } : {}),
  ...(detail.softwareType !== undefined ? { softwareType: detail.softwareType } : {}),
  ...(detail.publishDate !== undefined ? { publishDate: toPrismaDateOnly(detail.publishDate) } : {}),
  ...(detail.registerDate !== undefined ? { registerDate: toPrismaDateOnly(detail.registerDate) } : {}),
  ...(detail.runEnv !== undefined ? { runEnv: detail.runEnv } : {}),
});

export const toResourceAccessGrantRecord = (
  grant: ResourceGrantPrismaRecord,
): ResourceAccessGrantRecord => ({
  resourceType: grant.resourceType as ResourceTypeCode,
  resourceId: grant.resourceId,
  granteeType: grant.granteeType as ResourceAccessGrantRecord["granteeType"],
  granteeId: grant.granteeId,
  grantType: grant.grantType as ResourceAccessGrantRecord["grantType"],
  status: grant.status as ResourceAccessGrantRecord["status"],
  startsAt: grant.startsAt ?? null,
  expiresAt: grant.expiresAt ?? null,
  revokedAt: grant.revokedAt ?? null,
});

export const getRequiredDetailForType = (
  input: CreateAchievementDraftInput,
):
  | CreatePaperDetailDraftInput
  | CreatePatentDetailDraftInput
  | CreateSoftwareCopyrightDetailDraftInput => {
  if (input.type === AchievementTypeCode.paper && input.paperDetail) {
    return input.paperDetail;
  }

  if (input.type === AchievementTypeCode.patent && input.patentDetail) {
    return input.patentDetail;
  }

  if (input.type === AchievementTypeCode.softwareCopyright && input.softwareCopyrightDetail) {
    return input.softwareCopyrightDetail;
  }

  throw new Error(`Missing detail payload for achievement type ${input.type}.`);
};

const toPrismaDateOnly = (value: Date | string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  return new Date(value);
};
