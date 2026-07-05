import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  toAchievementConversionCreateData,
  toAchievementConversionParentRecord,
  toAchievementConversionRecord,
  toAchievementConversionUpdateData,
} from "./domain/achievement-conversion-prisma.mapper";
import {
  AchievementConversionParentRecord,
  AchievementConversionRecord,
  CreateAchievementConversionInput,
  FindAchievementConversionInput,
  ListAchievementConversionsInput,
  UpdateAchievementConversionInput,
  achievementConversionParentSelect,
  achievementConversionSelect,
} from "./domain/achievement-conversion-repository.types";

export type AchievementConversionTransactionClient = Pick<
  Prisma.TransactionClient,
  "achievementConversion" | "achievement"
>;

@Injectable()
export class AchievementConversionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findAchievementParentByIdWhere(
    achievementId: string,
    where: Prisma.AchievementWhereInput,
  ): Promise<AchievementConversionParentRecord | null> {
    const row = await this.prisma.achievement.findFirst({
      where: {
        AND: [{ id: achievementId }, where],
      },
      select: achievementConversionParentSelect,
    });

    return row
      ? toAchievementConversionParentRecord(
          row as AchievementConversionParentRecord,
        )
      : null;
  }

  async listByAchievementWhere(
    input: ListAchievementConversionsInput,
  ): Promise<AchievementConversionRecord[]> {
    const rows = await this.prisma.achievementConversion.findMany({
      where: {
        achievementId: input.achievementId,
        achievement: input.achievementWhere,
      },
      orderBy: [{ conversionDate: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
      select: achievementConversionSelect,
    });

    return rows.map((row) =>
      toAchievementConversionRecord(
        row as Parameters<typeof toAchievementConversionRecord>[0],
      ),
    );
  }

  async findByIdWhere(
    input: FindAchievementConversionInput,
  ): Promise<AchievementConversionRecord | null> {
    const row = await this.prisma.achievementConversion.findFirst({
      where: {
        id: input.conversionId,
        achievement: input.achievementWhere,
      },
      select: achievementConversionSelect,
    });

    return row
      ? toAchievementConversionRecord(
          row as Parameters<typeof toAchievementConversionRecord>[0],
        )
      : null;
  }

  async createInTransaction(
    client: AchievementConversionTransactionClient,
    input: CreateAchievementConversionInput,
  ): Promise<AchievementConversionRecord> {
    const row = await client.achievementConversion.create({
      data: toAchievementConversionCreateData(input),
      select: achievementConversionSelect,
    });

    return toAchievementConversionRecord(
      row as Parameters<typeof toAchievementConversionRecord>[0],
    );
  }

  async updateInTransaction(
    client: AchievementConversionTransactionClient,
    input: UpdateAchievementConversionInput,
  ): Promise<AchievementConversionRecord> {
    const row = await client.achievementConversion.update({
      where: { id: input.conversionId },
      data: toAchievementConversionUpdateData(input),
      select: achievementConversionSelect,
    });

    return toAchievementConversionRecord(
      row as Parameters<typeof toAchievementConversionRecord>[0],
    );
  }
}
