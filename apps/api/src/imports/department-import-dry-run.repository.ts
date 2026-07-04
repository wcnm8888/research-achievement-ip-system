import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

export type DepartmentCodeLookup = {
  code: string;
  status: DepartmentStatus;
};

export type DepartmentImportApplyDepartmentLookup = {
  id: string;
  code: string;
  parentId: string | null;
  status: DepartmentStatus;
  archivedAt: Date | null;
};

export type DepartmentImportCreateInput = {
  code: string;
  name: string;
  parentId: string | null;
};

export type DepartmentImportCreatedDepartment = {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  status: DepartmentStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type DepartmentImportApplyTransactionClient = Pick<
  Prisma.TransactionClient,
  "department" | "importJob" | "importRun"
>;

@Injectable()
export class DepartmentImportDryRunRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findDepartmentsByCodes(
    codes: readonly string[],
  ): Promise<DepartmentCodeLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return this.prisma.department.findMany({
      where: { code: { in: uniqueCodes } },
      select: {
        code: true,
        status: true,
      },
    });
  }

  async findApplyDepartmentsByCodesInTransaction(
    client: DepartmentImportApplyTransactionClient,
    codes: readonly string[],
  ): Promise<DepartmentImportApplyDepartmentLookup[]> {
    const uniqueCodes = [...new Set(codes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      return [];
    }

    return client.department.findMany({
      where: { code: { in: uniqueCodes } },
      select: {
        id: true,
        code: true,
        parentId: true,
        status: true,
        archivedAt: true,
      },
    });
  }

  async createDepartmentInTransaction(
    client: DepartmentImportApplyTransactionClient,
    input: DepartmentImportCreateInput,
  ): Promise<DepartmentImportCreatedDepartment> {
    return client.department.create({
      data: {
        code: input.code,
        name: input.name,
        parentId: input.parentId,
      },
      select: {
        id: true,
        code: true,
        name: true,
        parentId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
    });
  }

  isPrismaUniqueConflict(error: unknown): boolean {
    return isPrismaKnownRequestError(error) && error.code === "P2002";
  }
}

const isPrismaKnownRequestError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  return typeof (error as { code?: unknown }).code === "string";
};
