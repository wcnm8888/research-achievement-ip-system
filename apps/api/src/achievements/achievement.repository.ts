import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { PrismaService } from "../database/prisma.service";
import { AchievementTypeCode } from "./domain/achievement-domain.types";
import {
  getRequiredDetailForType,
  toAchievementCreateData,
  toAchievementStatusTransitionData,
  toAchievementUpdateData,
  toContributorCreateManyData,
  toPaperDetailCreateData,
  toPaperDetailUpdateData,
  toPatentDetailCreateData,
  toPatentDetailUpdateData,
  toResourceAccessGrantRecord,
  toSoftwareCopyrightDetailCreateData,
  toSoftwareCopyrightDetailUpdateData,
} from "./domain/achievement-prisma.mapper";
import {
  AchievementStatusTransitionConflictError,
  CreatedAchievementNotFoundError,
} from "./domain/achievement-repository.errors";
import {
  AchievementAggregate,
  AchievementListPage,
  AchievementResourceGrant,
  AchievementStateRecord,
  AchievementStatusTransitionInput,
  CreateAchievementDraftInput,
  ListAchievementsInput,
  NormalizedAchievementConflict,
  NormalizedAchievementConflictInput,
  PrismaUniqueConflict,
  UpdateAchievementDraftInput,
  achievementAggregateInclude,
  achievementListItemSelect,
  achievementStateSelect,
} from "./domain/achievement-repository.types";

export type AchievementTransactionClient = Pick<
  Prisma.TransactionClient,
  "achievement" | "paperDetail" | "patentDetail" | "softwareCopyrightDetail" | "achievementContributor"
>;

@Injectable()
export class AchievementRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async createDraft(input: CreateAchievementDraftInput): Promise<AchievementAggregate> {
    return this.prisma.$transaction((tx) =>
      this.createDraftInTransaction(tx as AchievementTransactionClient, input),
    );
  }

  async createDraftInTransaction(
    client: AchievementTransactionClient,
    input: CreateAchievementDraftInput,
  ): Promise<AchievementAggregate> {
    const created = await client.achievement.create({
      data: toAchievementCreateData(input),
      select: { id: true },
    });

    await this.createTypedDetail(client, created.id, input);

    if (input.contributors.length > 0) {
      await client.achievementContributor.createMany({
        data: toContributorCreateManyData(created.id, input.contributors),
      });
    }

    const aggregate = await client.achievement.findUnique({
      where: { id: created.id },
      include: achievementAggregateInclude,
    });

    if (!aggregate) {
      throw new CreatedAchievementNotFoundError(created.id);
    }

    return aggregate;
  }

  async updateDraft(input: UpdateAchievementDraftInput): Promise<AchievementAggregate> {
    return this.prisma.$transaction((tx) =>
      this.updateDraftInTransaction(tx as AchievementTransactionClient, input),
    );
  }

  async updateDraftInTransaction(
    client: AchievementTransactionClient,
    input: UpdateAchievementDraftInput,
  ): Promise<AchievementAggregate> {
    await client.achievement.update({
      where: { id: input.achievementId },
      data: toAchievementUpdateData(input),
    });

    await this.updateTypedDetail(client, input);

    const aggregate = await client.achievement.findUnique({
      where: { id: input.achievementId },
      include: achievementAggregateInclude,
    });

    if (!aggregate) {
      throw new CreatedAchievementNotFoundError(input.achievementId);
    }

    return aggregate;
  }

  findDetailById(achievementId: string): Promise<AchievementAggregate | null> {
    return this.prisma.achievement.findUnique({
      where: { id: achievementId },
      include: achievementAggregateInclude,
    });
  }

  findDetailByIdWhere(
    achievementId: string,
    where: Prisma.AchievementWhereInput,
  ): Promise<AchievementAggregate | null> {
    return this.prisma.achievement.findFirst({
      where: {
        AND: [{ id: achievementId }, where],
      },
      include: achievementAggregateInclude,
    });
  }

  async list(input: ListAchievementsInput): Promise<AchievementListPage> {
    const where = toAchievementListWhere(input.where, input.filters);
    const skip = (input.page - 1) * input.pageSize;

    const [items, total] = await Promise.all([
      this.prisma.achievement.findMany({
        where,
        select: achievementListItemSelect,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: input.pageSize,
      }),
      this.prisma.achievement.count({
        where,
      }),
    ]);

    return { items, total };
  }

  findStateById(achievementId: string): Promise<AchievementStateRecord | null> {
    return this.findStateByIdInTransaction(this.prisma, achievementId);
  }

  findStateByIdInTransaction(
    client: AchievementTransactionClient,
    achievementId: string,
  ): Promise<AchievementStateRecord | null> {
    return client.achievement.findUnique({
      where: { id: achievementId },
      select: achievementStateSelect,
    });
  }

  findStateByIdWhere(
    achievementId: string,
    where: Prisma.AchievementWhereInput,
  ): Promise<AchievementStateRecord | null> {
    return this.findStateByIdWhereInTransaction(this.prisma, achievementId, where);
  }

  findStateByIdWhereInTransaction(
    client: AchievementTransactionClient,
    achievementId: string,
    where: Prisma.AchievementWhereInput,
  ): Promise<AchievementStateRecord | null> {
    return client.achievement.findFirst({
      where: {
        AND: [{ id: achievementId }, where],
      },
      select: achievementStateSelect,
    });
  }

  async transitionStatus(
    input: AchievementStatusTransitionInput,
  ): Promise<AchievementStateRecord> {
    return this.prisma.$transaction((tx) =>
      this.transitionStatusInTransaction(tx as AchievementTransactionClient, input),
    );
  }

  async transitionStatusInTransaction(
    client: AchievementTransactionClient,
    input: AchievementStatusTransitionInput,
  ): Promise<AchievementStateRecord> {
    const result = await client.achievement.updateMany({
      where: {
        id: input.achievementId,
        status: input.expectedStatus,
      },
      data: toAchievementStatusTransitionData(input),
    });

    if (result.count !== 1) {
      throw new AchievementStatusTransitionConflictError(
        input.achievementId,
        input.expectedStatus,
      );
    }

    const state = await client.achievement.findUnique({
      where: { id: input.achievementId },
      select: achievementStateSelect,
    });

    if (!state) {
      throw new CreatedAchievementNotFoundError(input.achievementId);
    }

    return state;
  }

  async findResourceGrantsForAchievement(
    achievementId: string,
  ): Promise<AchievementResourceGrant[]> {
    const grants = await this.prisma.resourceAccessGrant.findMany({
      where: {
        resourceType: ResourceTypeCode.achievement,
        resourceId: achievementId,
      },
    });

    return grants.map(toResourceAccessGrantRecord);
  }

  async findResourceGrantsForAchievements(
    achievementIds: readonly string[],
  ): Promise<AchievementResourceGrant[]> {
    if (achievementIds.length === 0) {
      return [];
    }

    const grants = await this.prisma.resourceAccessGrant.findMany({
      where: {
        resourceType: ResourceTypeCode.achievement,
        resourceId: { in: [...achievementIds] },
      },
    });

    return grants.map(toResourceAccessGrantRecord);
  }

  async findNormalizedConflict(
    input: NormalizedAchievementConflictInput,
    excludeAchievementId?: string,
  ): Promise<NormalizedAchievementConflict | null> {
    const achievementExclusion = excludeAchievementId
      ? { achievementId: { not: excludeAchievementId } }
      : {};

    if (input.doiNormalized) {
      const conflict = await this.prisma.paperDetail.findFirst({
        where: {
          doiNormalized: input.doiNormalized,
          ...achievementExclusion,
        },
        select: { achievementId: true },
      });

      if (conflict) {
        return {
          field: "doi",
          normalizedValue: input.doiNormalized,
          achievementId: conflict.achievementId,
        };
      }
    }

    if (input.applicationNoNormalized) {
      const conflict = await this.prisma.patentDetail.findFirst({
        where: {
          applicationNoNormalized: input.applicationNoNormalized,
          ...achievementExclusion,
        },
        select: { achievementId: true },
      });

      if (conflict) {
        return {
          field: "applicationNo",
          normalizedValue: input.applicationNoNormalized,
          achievementId: conflict.achievementId,
        };
      }
    }

    if (input.grantNoNormalized) {
      const conflict = await this.prisma.patentDetail.findFirst({
        where: {
          grantNoNormalized: input.grantNoNormalized,
          ...achievementExclusion,
        },
        select: { achievementId: true },
      });

      if (conflict) {
        return {
          field: "grantNo",
          normalizedValue: input.grantNoNormalized,
          achievementId: conflict.achievementId,
        };
      }
    }

    if (input.registrationNoNormalized) {
      const conflict = await this.prisma.softwareCopyrightDetail.findFirst({
        where: {
          registrationNoNormalized: input.registrationNoNormalized,
          ...achievementExclusion,
        },
        select: { achievementId: true },
      });

      if (conflict) {
        return {
          field: "registrationNo",
          normalizedValue: input.registrationNoNormalized,
          achievementId: conflict.achievementId,
        };
      }
    }

    return null;
  }

  isPrismaUniqueConflict(error: unknown): error is PrismaUniqueConflict {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }

  getPrismaUniqueConflictTarget(error: unknown): readonly string[] {
    if (!this.isPrismaUniqueConflict(error)) {
      return [];
    }

    return error.meta?.target ?? [];
  }

  private async createTypedDetail(
    client: AchievementTransactionClient,
    achievementId: string,
    input: CreateAchievementDraftInput,
  ): Promise<void> {
    getRequiredDetailForType(input);

    if (input.type === AchievementTypeCode.paper) {
      await client.paperDetail.create({
        data: toPaperDetailCreateData(achievementId, input.paperDetail!),
      });
      return;
    }

    if (input.type === AchievementTypeCode.patent) {
      await client.patentDetail.create({
        data: toPatentDetailCreateData(achievementId, input.patentDetail!),
      });
      return;
    }

    await client.softwareCopyrightDetail.create({
      data: toSoftwareCopyrightDetailCreateData(achievementId, input.softwareCopyrightDetail!),
    });
  }

  private async updateTypedDetail(
    client: AchievementTransactionClient,
    input: UpdateAchievementDraftInput,
  ): Promise<void> {
    if (input.type === AchievementTypeCode.paper && input.paperDetail) {
      await client.paperDetail.update({
        where: { achievementId: input.achievementId },
        data: toPaperDetailUpdateData(input.paperDetail),
      });
      return;
    }

    if (input.type === AchievementTypeCode.patent && input.patentDetail) {
      await client.patentDetail.update({
        where: { achievementId: input.achievementId },
        data: toPatentDetailUpdateData(input.patentDetail),
      });
      return;
    }

    if (
      input.type === AchievementTypeCode.softwareCopyright &&
      input.softwareCopyrightDetail
    ) {
      await client.softwareCopyrightDetail.update({
        where: { achievementId: input.achievementId },
        data: toSoftwareCopyrightDetailUpdateData(input.softwareCopyrightDetail),
      });
    }
  }
}

const isPrismaKnownRequestError = (
  error: unknown,
): error is PrismaUniqueConflict => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  const maybeError = error as { code?: unknown; meta?: { target?: unknown } };

  return (
    maybeError.code === "P2002" &&
    Array.isArray(maybeError.meta?.target) &&
    maybeError.meta.target.every((target) => typeof target === "string")
  );
};

const toAchievementListWhere = (
  policyWhere: Prisma.AchievementWhereInput,
  filters: ListAchievementsInput["filters"],
): Prisma.AchievementWhereInput => {
  const conditions: Prisma.AchievementWhereInput[] = [policyWhere];

  if (filters.status) {
    conditions.push({ status: filters.status });
  }

  if (filters.type) {
    conditions.push({ type: filters.type });
  }

  const keyword = filters.keyword?.trim();

  if (keyword) {
    conditions.push({
      title: {
        contains: keyword,
        mode: "insensitive",
      },
    });
  }

  return { AND: conditions };
};
