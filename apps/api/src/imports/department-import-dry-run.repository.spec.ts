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

  it("creates departments only through the provided transaction client", async () => {
    const prisma = {};
    const tx = {
      department: {
        create: vi.fn().mockResolvedValue({
          id: "10000000-0000-4000-8000-000000000020",
          code: "AI_RESEARCH",
          name: "AI Research",
          parentId: null,
          status: DepartmentStatus.ACTIVE,
          createdAt: new Date("2026-07-02T00:00:00.000Z"),
          updatedAt: new Date("2026-07-02T00:00:00.000Z"),
          archivedAt: null,
        }),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
      },
    };
    const repository = new DepartmentImportDryRunRepository(
      prisma as unknown as PrismaService,
    );

    const created = await repository.createDepartmentInTransaction(tx as never, {
      code: "AI_RESEARCH",
      name: "AI Research",
      parentId: null,
    });

    expect(created.code).toBe("AI_RESEARCH");
    expect(tx.department.create).toHaveBeenCalledWith({
      data: {
        code: "AI_RESEARCH",
        name: "AI Research",
        parentId: null,
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
    expect(tx.department.update).not.toHaveBeenCalled();
    expect(tx.department.upsert).not.toHaveBeenCalled();
    expect(tx.department.delete).not.toHaveBeenCalled();
  });

  it("rechecks department code and parent rows through the transaction client", async () => {
    const prisma = {};
    const tx = {
      department: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "10000000-0000-4000-8000-000000000010",
            code: "ROOT",
            parentId: null,
            status: DepartmentStatus.ACTIVE,
            archivedAt: null,
          },
        ]),
      },
    };
    const repository = new DepartmentImportDryRunRepository(
      prisma as unknown as PrismaService,
    );

    const rows = await repository.findApplyDepartmentsByCodesInTransaction(tx as never, [
      "ROOT",
      "ROOT",
      "CHILD",
    ]);

    expect(rows).toHaveLength(1);
    expect(tx.department.findMany).toHaveBeenCalledWith({
      where: { code: { in: ["ROOT", "CHILD"] } },
      select: {
        id: true,
        code: true,
        parentId: true,
        status: true,
        archivedAt: true,
      },
    });
  });
});
