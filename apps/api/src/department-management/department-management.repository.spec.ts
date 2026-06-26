import { DepartmentStatus, UserStatus, WorkflowTargetType, WorkflowTaskStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { PrismaService } from "../database/prisma.service";
import {
  DepartmentManagementRepository,
  DepartmentManagementTransactionClient,
} from "./department-management.repository";

const ids = {
  department: "10000000-0000-4000-8000-000000000001",
  parent: "10000000-0000-4000-8000-000000000010",
  achievement: "30000000-0000-4000-8000-000000000001",
};

const now = new Date("2026-06-25T00:00:00.000Z");

const makeDepartmentRow = (overrides: Record<string, unknown> = {}) => ({
  id: ids.department,
  code: "AI_RESEARCH",
  name: "AI Research",
  parentId: ids.parent,
  status: DepartmentStatus.ACTIVE,
  createdAt: now,
  updatedAt: now,
  archivedAt: null,
  ...overrides,
});

const createFakePrisma = () => ({
  $transaction: vi.fn(async (operations: unknown) => {
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    }

    if (typeof operations === "function") {
      return operations(createFakePrisma());
    }

    return operations;
  }),
  department: {
    findMany: vi.fn().mockResolvedValue([makeDepartmentRow()]),
    count: vi.fn().mockResolvedValue(1),
    findUnique: vi.fn().mockResolvedValue(makeDepartmentRow()),
    create: vi.fn().mockResolvedValue(makeDepartmentRow()),
    update: vi.fn().mockResolvedValue(makeDepartmentRow()),
  },
  achievement: {
    findMany: vi.fn().mockResolvedValue([{ id: ids.achievement }]),
    count: vi.fn().mockResolvedValue(2),
  },
  user: {
    count: vi.fn().mockResolvedValue(0),
  },
  userRole: {
    count: vi.fn().mockResolvedValue(0),
  },
  workflowTask: {
    count: vi.fn().mockResolvedValue(0),
  },
  feeRecord: {
    count: vi.fn().mockResolvedValue(3),
  },
});

const createRepository = () => {
  const prisma = createFakePrisma();
  const repository = new DepartmentManagementRepository(
    prisma as unknown as PrismaService,
  );

  return { prisma, repository };
};

describe("DepartmentManagementRepository", () => {
  it("lists departments with filters and pagination", async () => {
    const { prisma, repository } = createRepository();

    await repository.findMany({
      keyword: "research",
      status: DepartmentStatus.ACTIVE,
      parentId: ids.parent,
      page: 2,
      pageSize: 10,
    });

    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { code: { contains: "research", mode: "insensitive" } },
            { name: { contains: "research", mode: "insensitive" } },
          ],
          status: DepartmentStatus.ACTIVE,
          parentId: ids.parent,
          archivedAt: null,
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(prisma.department.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        archivedAt: null,
      }),
    });
  });

  it("keeps archived rows visible only when includeArchived is true", async () => {
    const { prisma, repository } = createRepository();

    await repository.findTreeRows({ includeArchived: true });

    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it("creates, updates, disables, and enables without physical delete helpers", async () => {
    const { prisma, repository } = createRepository();

    const tx = prisma as unknown as DepartmentManagementTransactionClient;

    await repository.createInTransaction(tx, {
      code: "NEW_DEPT",
      name: "New Department",
      parentId: ids.parent,
    });
    await repository.updateInTransaction(tx, ids.department, {
      name: "Updated",
      parentId: null,
    });
    await repository.disableInTransaction(tx, ids.department, now);
    await repository.enableInTransaction(tx, ids.department);

    expect(prisma.department.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { code: "NEW_DEPT", name: "New Department", parentId: ids.parent },
      }),
    );
    expect(prisma.department.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: DepartmentStatus.ARCHIVED, archivedAt: now },
      }),
    );
    expect(prisma.department.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: { status: DepartmentStatus.ACTIVE, archivedAt: null },
      }),
    );
    expect("delete" in repository).toBe(false);
  });

  it("computes disable impact summary without writing business data", async () => {
    const { prisma, repository } = createRepository();

    await expect(repository.getDisableImpactSummary(ids.department)).resolves.toEqual({
      activeUsersCount: 0,
      activeUserRoleScopesCount: 0,
      pendingWorkflowTasksCount: 0,
      activeOrUnarchivedAchievementsCount: 2,
      feeRecordsCount: 3,
    });

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        departmentId: ids.department,
        status: UserStatus.ACTIVE,
        archivedAt: null,
      },
    });
    expect(prisma.workflowTask.count).toHaveBeenCalledWith({
      where: {
        status: WorkflowTaskStatus.PENDING,
        instance: {
          targetType: WorkflowTargetType.ACHIEVEMENT,
          targetId: { in: [ids.achievement] },
        },
      },
    });
  });
});
