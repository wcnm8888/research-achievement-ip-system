import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus, UserStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

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
