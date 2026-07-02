import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus, Prisma, UserStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import {
  AchievementTypeCode,
  SecretLevelCode,
} from "../achievements/domain/achievement-domain.types";
import {
  CreateAchievementContributorDraftInput,
  CreatePaperDetailDraftInput,
  CreateSoftwareCopyrightDetailDraftInput,
} from "../achievements/domain/achievement-repository.types";
import {
  toAchievementCreateData,
  toContributorCreateManyData,
  toPaperDetailCreateData,
  toSoftwareCopyrightDetailCreateData,
} from "../achievements/domain/achievement-prisma.mapper";

export type AchievementImportDepartmentLookup = {
  id: string;
  code: string;
};

export type AchievementImportUserLookup = {
  id: string;
  email: string;
  departmentId: string;
  status: UserStatus;
  archivedAt: Date | null;
};

export type AchievementImportNormalizedConflict = {
  field: "doi" | "applicationNo" | "patentNo" | "grantNo" | "registrationNo";
  normalizedValue: string;
};

export type AchievementImportApplyDepartmentLookup = {
  id: string;
  code: string;
  status: DepartmentStatus;
  archivedAt: Date | null;
};

export type AchievementImportApplyUserLookup = {
  id: string;
  email: string;
  departmentId: string;
  status: UserStatus;
  archivedAt: Date | null;
};

export type AchievementImportCreatePaperDraftInput = {
  type: typeof AchievementTypeCode.paper;
  title: string;
  secretLevel: SecretLevelCode;
  departmentId: string;
  ownerUserId: string;
  createdById: string;
  updatedById: string;
  paperDetail: CreatePaperDetailDraftInput;
  contributors: readonly CreateAchievementContributorDraftInput[];
};

export type AchievementImportCreateSoftwareCopyrightDraftInput = {
  type: typeof AchievementTypeCode.softwareCopyright;
  title: string;
  secretLevel: SecretLevelCode;
  departmentId: string;
  ownerUserId: string;
  createdById: string;
  updatedById: string;
  softwareCopyrightDetail: CreateSoftwareCopyrightDetailDraftInput;
  contributors: readonly CreateAchievementContributorDraftInput[];
};

export type AchievementImportCreatedDraft = {
  id: string;
  type: string;
  status: string;
  secretLevel: string;
  departmentId: string;
  ownerUserId: string;
  createdById: string | null;
  updatedById: string | null;
  version: number;
  paperDetail: { achievementId: string; doiNormalized: string | null } | null;
  softwareCopyrightDetail: {
    achievementId: string;
    registrationNoNormalized: string | null;
  } | null;
  contributors: Array<{ id: string }>;
};

export type AchievementImportApplyTransactionClient = Pick<
  Prisma.TransactionClient,
  | "department"
  | "user"
  | "achievement"
  | "paperDetail"
  | "softwareCopyrightDetail"
  | "achievementContributor"
>;

@Injectable()
export class AchievementImportDryRunRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findActiveDepartmentsByCodes(
    codes: readonly string[],
  ): Promise<AchievementImportDepartmentLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return this.prisma.department.findMany({
      where: {
        code: { in: uniqueCodes },
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: {
        id: true,
        code: true,
      },
    });
  }

  async findUsersByEmails(
    emails: readonly string[],
  ): Promise<AchievementImportUserLookup[]> {
    const uniqueEmails = [...new Set(emails.filter(Boolean))];
    if (uniqueEmails.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        email: { in: uniqueEmails },
      },
      select: {
        id: true,
        email: true,
        departmentId: true,
        status: true,
        archivedAt: true,
      },
    });
  }

  async findNormalizedConflicts(input: {
    doiNormalizedValues: readonly string[];
    applicationNoNormalizedValues: readonly string[];
    patentNoNormalizedValues: readonly string[];
    registrationNoNormalizedValues: readonly string[];
  }): Promise<AchievementImportNormalizedConflict[]> {
    const [
      paperConflicts,
      applicationConflicts,
      patentNoConflicts,
      softwareConflicts,
    ] = await Promise.all([
      this.findPaperDoiConflicts(input.doiNormalizedValues),
      this.findPatentApplicationConflicts(input.applicationNoNormalizedValues),
      this.findPatentNoConflicts(input.patentNoNormalizedValues),
      this.findSoftwareRegistrationConflicts(input.registrationNoNormalizedValues),
    ]);

    return [
      ...paperConflicts,
      ...applicationConflicts,
      ...patentNoConflicts,
      ...softwareConflicts,
    ];
  }

  async findApplyDepartmentsByCodesInTransaction(
    client: AchievementImportApplyTransactionClient,
    codes: readonly string[],
  ): Promise<AchievementImportApplyDepartmentLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return client.department.findMany({
      where: { code: { in: uniqueCodes } },
      select: {
        id: true,
        code: true,
        status: true,
        archivedAt: true,
      },
    });
  }

  async findApplyUsersByEmailsInTransaction(
    client: AchievementImportApplyTransactionClient,
    emails: readonly string[],
  ): Promise<AchievementImportApplyUserLookup[]> {
    const uniqueEmails = [...new Set(emails.filter(Boolean))];
    if (uniqueEmails.length === 0) {
      return [];
    }

    return client.user.findMany({
      where: { email: { in: uniqueEmails } },
      select: {
        id: true,
        email: true,
        departmentId: true,
        status: true,
        archivedAt: true,
      },
    });
  }

  async findApplyPaperDoiConflictsInTransaction(
    client: AchievementImportApplyTransactionClient,
    doiNormalizedValues: readonly string[],
  ): Promise<AchievementImportNormalizedConflict[]> {
    const uniqueValues = [...new Set(doiNormalizedValues.filter(Boolean))];
    if (uniqueValues.length === 0) {
      return [];
    }

    const rows = await client.paperDetail.findMany({
      where: { doiNormalized: { in: uniqueValues } },
      select: { doiNormalized: true },
    });

    return rows
      .map((row) => row.doiNormalized)
      .filter((value): value is string => Boolean(value))
      .map((normalizedValue) => ({
        field: "doi",
        normalizedValue,
      }));
  }

  async findApplySoftwareRegistrationConflictsInTransaction(
    client: AchievementImportApplyTransactionClient,
    registrationNoNormalizedValues: readonly string[],
  ): Promise<AchievementImportNormalizedConflict[]> {
    const uniqueValues = [...new Set(registrationNoNormalizedValues.filter(Boolean))];
    if (uniqueValues.length === 0) {
      return [];
    }

    const rows = await client.softwareCopyrightDetail.findMany({
      where: { registrationNoNormalized: { in: uniqueValues } },
      select: { registrationNoNormalized: true },
    });

    return rows
      .map((row) => row.registrationNoNormalized)
      .filter((value): value is string => Boolean(value))
      .map((normalizedValue) => ({
        field: "registrationNo",
        normalizedValue,
      }));
  }

  async createPaperDraftInTransaction(
    client: AchievementImportApplyTransactionClient,
    input: AchievementImportCreatePaperDraftInput,
  ): Promise<AchievementImportCreatedDraft> {
    const created = await client.achievement.create({
      data: toAchievementCreateData({
        ...input,
        type: AchievementTypeCode.paper,
        paperDetail: input.paperDetail,
      }),
      select: { id: true },
    });

    await client.paperDetail.create({
      data: toPaperDetailCreateData(created.id, input.paperDetail),
    });

    if (input.contributors.length > 0) {
      await client.achievementContributor.createMany({
        data: toContributorCreateManyData(created.id, input.contributors),
      });
    }

    return client.achievement.findUniqueOrThrow({
      where: { id: created.id },
      select: {
        id: true,
        type: true,
        status: true,
        secretLevel: true,
        departmentId: true,
        ownerUserId: true,
        createdById: true,
        updatedById: true,
        version: true,
        paperDetail: {
          select: {
            achievementId: true,
            doiNormalized: true,
          },
        },
        softwareCopyrightDetail: {
          select: {
            achievementId: true,
            registrationNoNormalized: true,
          },
        },
        contributors: {
          select: { id: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async createSoftwareCopyrightDraftInTransaction(
    client: AchievementImportApplyTransactionClient,
    input: AchievementImportCreateSoftwareCopyrightDraftInput,
  ): Promise<AchievementImportCreatedDraft> {
    const created = await client.achievement.create({
      data: toAchievementCreateData({
        ...input,
        type: AchievementTypeCode.softwareCopyright,
        softwareCopyrightDetail: input.softwareCopyrightDetail,
      }),
      select: { id: true },
    });

    await client.softwareCopyrightDetail.create({
      data: toSoftwareCopyrightDetailCreateData(
        created.id,
        input.softwareCopyrightDetail,
      ),
    });

    if (input.contributors.length > 0) {
      await client.achievementContributor.createMany({
        data: toContributorCreateManyData(created.id, input.contributors),
      });
    }

    return client.achievement.findUniqueOrThrow({
      where: { id: created.id },
      select: {
        id: true,
        type: true,
        status: true,
        secretLevel: true,
        departmentId: true,
        ownerUserId: true,
        createdById: true,
        updatedById: true,
        version: true,
        paperDetail: {
          select: {
            achievementId: true,
            doiNormalized: true,
          },
        },
        softwareCopyrightDetail: {
          select: {
            achievementId: true,
            registrationNoNormalized: true,
          },
        },
        contributors: {
          select: { id: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }

  getPrismaUniqueConflictTarget(error: unknown): string[] {
    if (!this.isPrismaUniqueConflict(error) || !("meta" in (error as object))) {
      return [];
    }

    const meta = (error as { meta?: { target?: unknown } }).meta;
    if (Array.isArray(meta?.target)) {
      return meta.target.filter((item): item is string => typeof item === "string");
    }
    if (typeof meta?.target === "string") {
      return [meta.target];
    }

    return [];
  }

  private async findPaperDoiConflicts(
    values: readonly string[],
  ): Promise<AchievementImportNormalizedConflict[]> {
    const uniqueValues = [...new Set(values.filter(Boolean))];
    if (uniqueValues.length === 0) {
      return [];
    }

    const rows = await this.prisma.paperDetail.findMany({
      where: { doiNormalized: { in: uniqueValues } },
      select: { doiNormalized: true },
    });

    return rows
      .map((row) => row.doiNormalized)
      .filter((value): value is string => Boolean(value))
      .map((normalizedValue) => ({
        field: "doi",
        normalizedValue,
      }));
  }

  private async findPatentApplicationConflicts(
    values: readonly string[],
  ): Promise<AchievementImportNormalizedConflict[]> {
    const uniqueValues = [...new Set(values.filter(Boolean))];
    if (uniqueValues.length === 0) {
      return [];
    }

    const rows = await this.prisma.patentDetail.findMany({
      where: { applicationNoNormalized: { in: uniqueValues } },
      select: { applicationNoNormalized: true },
    });

    return rows
      .map((row) => row.applicationNoNormalized)
      .filter((value): value is string => Boolean(value))
      .map((normalizedValue) => ({
        field: "applicationNo",
        normalizedValue,
      }));
  }

  private async findPatentNoConflicts(
    values: readonly string[],
  ): Promise<AchievementImportNormalizedConflict[]> {
    const uniqueValues = [...new Set(values.filter(Boolean))];
    if (uniqueValues.length === 0) {
      return [];
    }

    const rows = await this.prisma.patentDetail.findMany({
      where: { grantNoNormalized: { in: uniqueValues } },
      select: { grantNoNormalized: true },
    });

    return rows
      .map((row) => row.grantNoNormalized)
      .filter((value): value is string => Boolean(value))
      .map((normalizedValue) => ({
        field: "patentNo",
        normalizedValue,
      }));
  }

  private async findSoftwareRegistrationConflicts(
    values: readonly string[],
  ): Promise<AchievementImportNormalizedConflict[]> {
    const uniqueValues = [...new Set(values.filter(Boolean))];
    if (uniqueValues.length === 0) {
      return [];
    }

    const rows = await this.prisma.softwareCopyrightDetail.findMany({
      where: { registrationNoNormalized: { in: uniqueValues } },
      select: { registrationNoNormalized: true },
    });

    return rows
      .map((row) => row.registrationNoNormalized)
      .filter((value): value is string => Boolean(value))
      .map((normalizedValue) => ({
        field: "registrationNo",
        normalizedValue,
      }));
  }
}

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};
