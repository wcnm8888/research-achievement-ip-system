import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ResourceTypeCode } from "../authorization/constants/resource-type-code";
import { PrismaService } from "../database/prisma.service";
import { CreateAttachmentMetadataInput } from "./domain/attachment-event.types";
import {
  toAchievementParentRecord,
  toAttachmentCreateData,
  toAttachmentRecord,
  toAttachmentRelationWhere,
  toResourceGrantRecord,
} from "./domain/attachment-prisma.mapper";
import {
  AttachmentAchievementParentRecord,
  AttachmentLatestVersionInput,
  AttachmentRecord,
  AttachmentRelationQueryInput,
  AttachmentResourceGrantRecord,
} from "./domain/attachment-repository.types";

const defaultAttachmentTake = 50;

export type AttachmentTransactionClient = Pick<Prisma.TransactionClient, "attachment">;

@Injectable()
export class AttachmentRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(input: CreateAttachmentMetadataInput): Promise<AttachmentRecord> {
    return this.prisma.$transaction((tx) =>
      this.createInTransaction(tx as AttachmentTransactionClient, input),
    );
  }

  async createInTransaction(
    client: AttachmentTransactionClient,
    input: CreateAttachmentMetadataInput,
  ): Promise<AttachmentRecord> {
    const row = await client.attachment.create({
      data: toAttachmentCreateData(input),
    });

    return toAttachmentRecord(row as Parameters<typeof toAttachmentRecord>[0]);
  }

  async findLatestVersion(input: AttachmentLatestVersionInput): Promise<number | null> {
    return this.findLatestVersionInTransaction(this.prisma, input);
  }

  async findLatestVersionInTransaction(
    client: AttachmentTransactionClient,
    input: AttachmentLatestVersionInput,
  ): Promise<number | null> {
    const latest = await client.attachment.findFirst({
      where: {
        relationType: input.relationType,
        relationId: input.relationId,
        fileName: input.fileName,
      },
      select: { version: true },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    });

    return latest?.version ?? null;
  }

  async findManyByRelation(
    input: AttachmentRelationQueryInput,
  ): Promise<AttachmentRecord[]> {
    const rows = await this.prisma.attachment.findMany({
      where: toAttachmentRelationWhere(input),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.take ?? defaultAttachmentTake,
    });

    return rows.map((row) =>
      toAttachmentRecord(row as Parameters<typeof toAttachmentRecord>[0]),
    );
  }

  async findById(attachmentId: string): Promise<AttachmentRecord | null> {
    const row = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    return row ? toAttachmentRecord(row as Parameters<typeof toAttachmentRecord>[0]) : null;
  }

  async findAchievementParentById(
    achievementId: string,
  ): Promise<AttachmentAchievementParentRecord | null> {
    const row = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
      select: achievementParentSelect,
    });

    return row ? toAchievementParentRecord(row) : null;
  }

  async findAchievementParentByIdWhere(
    achievementId: string,
    where: Prisma.AchievementWhereInput,
  ): Promise<AttachmentAchievementParentRecord | null> {
    const row = await this.prisma.achievement.findFirst({
      where: {
        AND: [{ id: achievementId }, where],
      },
      select: achievementParentSelect,
    });

    return row ? toAchievementParentRecord(row) : null;
  }

  async findResourceGrantsForAchievementAndAttachment(input: {
    achievementId: string;
    attachmentId?: string | null;
  }): Promise<AttachmentResourceGrantRecord[]> {
    const resourceFilters: Prisma.ResourceAccessGrantWhereInput[] = [
      {
        resourceType: ResourceTypeCode.achievement,
        resourceId: input.achievementId,
      },
    ];

    if (input.attachmentId) {
      resourceFilters.push({
        resourceType: ResourceTypeCode.attachment,
        resourceId: input.attachmentId,
      });
    }

    const rows = await this.prisma.resourceAccessGrant.findMany({
      where: { OR: resourceFilters },
    });

    return rows.map((row) => toResourceGrantRecord(row));
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }
}

const achievementParentSelect = {
  id: true,
  departmentId: true,
  ownerUserId: true,
  secretLevel: true,
} satisfies Prisma.AchievementSelect;

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};
