import { DepartmentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import { DepartmentImportDryRunRepository } from "./department-import-dry-run.repository";

describe("DepartmentImportDryRunRepository", () => {
  it("uses only read queries and never writes or audits", async () => {
    const prisma = {
      department: {
        findMany: vi.fn().mockResolvedValue([
          { code: "AI_RESEARCH", status: DepartmentStatus.ACTIVE },
        ]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    const repository = new DepartmentImportDryRunRepository(
      prisma as unknown as PrismaService,
    );

    const rows = await repository.findDepartmentsByCodes([
      "AI_RESEARCH",
      "AI_RESEARCH",
      "ROOT",
    ]);

    expect(rows).toEqual([
      { code: "AI_RESEARCH", status: DepartmentStatus.ACTIVE },
    ]);
    expect(prisma.department.findMany).toHaveBeenCalledWith({
      where: { code: { in: ["AI_RESEARCH", "ROOT"] } },
      select: { code: true, status: true },
    });
    expect(prisma.department.create).not.toHaveBeenCalled();
    expect(prisma.department.update).not.toHaveBeenCalled();
    expect(prisma.department.upsert).not.toHaveBeenCalled();
    expect(prisma.department.delete).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
