import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

export type DepartmentCodeLookup = {
  code: string;
  status: DepartmentStatus;
};

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
}
