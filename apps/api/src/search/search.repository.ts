import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { PrismaService } from "../database/prisma.service";
import {
  SearchAchievementRecord,
  SearchFeeRecord,
  SearchQueryInput,
} from "./domain/search-domain.types";

const defaultSearchTake = 20;

@Injectable()
export class SearchRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async searchAchievements(
    policyWhere: Prisma.AchievementWhereInput,
    query: SearchQueryInput,
  ): Promise<SearchAchievementRecord[]> {
    return this.prisma.achievement.findMany({
      where: toAchievementSearchWhere(policyWhere, query),
      select: achievementSearchSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: query.take ?? defaultSearchTake,
    }) as Promise<SearchAchievementRecord[]>;
  }

  async searchFees(
    policyWhere: Prisma.FeeRecordWhereInput,
    query: SearchQueryInput,
  ): Promise<SearchFeeRecord[]> {
    return this.prisma.feeRecord.findMany({
      where: toFeeSearchWhere(policyWhere, query),
      select: feeSearchSelect,
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      take: query.take ?? defaultSearchTake,
    }) as Promise<SearchFeeRecord[]>;
  }

  async findAchievementGrants(achievementIds: readonly string[]) {
    if (achievementIds.length === 0) {
      return [];
    }

    return this.prisma.resourceAccessGrant.findMany({
      where: {
        resourceType: ResourceTypeCode.achievement,
        resourceId: { in: [...achievementIds] },
      },
      select: {
        resourceType: true,
        resourceId: true,
        granteeType: true,
        granteeId: true,
        grantType: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
  }
}

export const toAchievementSearchWhere = (
  policyWhere: Prisma.AchievementWhereInput,
  query: SearchQueryInput,
): Prisma.AchievementWhereInput => {
  const filters: Prisma.AchievementWhereInput[] = [policyWhere];
  const keyword = normalizeKeyword(query.keyword);

  if (query.achievementType) {
    filters.push({ type: query.achievementType });
  }

  if (query.achievementStatus) {
    filters.push({ status: query.achievementStatus });
  }

  if (query.departmentId) {
    filters.push({ departmentId: query.departmentId });
  }

  if (keyword) {
    filters.push({
      OR: [
        { title: { contains: keyword, mode: "insensitive" } },
        { paperDetail: { is: { doi: { contains: keyword, mode: "insensitive" } } } },
        {
          patentDetail: {
            is: { applicationNo: { contains: keyword, mode: "insensitive" } },
          },
        },
        {
          patentDetail: {
            is: { grantNo: { contains: keyword, mode: "insensitive" } },
          },
        },
        {
          softwareCopyrightDetail: {
            is: { registrationNo: { contains: keyword, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  return { AND: filters };
};

export const toFeeSearchWhere = (
  policyWhere: Prisma.FeeRecordWhereInput,
  query: SearchQueryInput,
): Prisma.FeeRecordWhereInput => {
  const filters: Prisma.FeeRecordWhereInput[] = [policyWhere, { archivedAt: null }];
  const keyword = normalizeKeyword(query.keyword);

  if (query.feeType) {
    filters.push({ feeType: query.feeType });
  }

  if (query.payStatus) {
    filters.push({ payStatus: query.payStatus });
  }

  if (query.departmentId) {
    filters.push({ departmentId: query.departmentId });
  }

  if (keyword) {
    filters.push(
      isUuid(keyword)
        ? {
            OR: [{ id: keyword }, { achievementId: keyword }],
          }
        : { id: { in: [] } },
    );
  }

  return { AND: filters };
};

const normalizeKeyword = (keyword: string | null | undefined): string | null => {
  const trimmed = keyword?.trim();
  return trimmed ? trimmed : null;
};

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const achievementSearchSelect = {
  id: true,
  type: true,
  title: true,
  status: true,
  secretLevel: true,
  departmentId: true,
  ownerUserId: true,
  createdAt: true,
  updatedAt: true,
  paperDetail: {
    select: {
      doi: true,
    },
  },
  patentDetail: {
    select: {
      applicationNo: true,
      grantNo: true,
      legalStatus: true,
    },
  },
  softwareCopyrightDetail: {
    select: {
      registrationNo: true,
    },
  },
} satisfies Prisma.AchievementSelect;

const feeSearchSelect = {
  id: true,
  achievementId: true,
  departmentId: true,
  feeType: true,
  dueDate: true,
  paidDate: true,
  payStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FeeRecordSelect;
