import { DepartmentStatus, RoleStatus, UserStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { RoleCode } from "../authorization/constants/role-code";
import { PrismaService } from "../database/prisma.service";
import { UserAccountImportDryRunRepository } from "./user-account-import-dry-run.repository";

describe("UserAccountImportDryRunRepository", () => {
  it("uses only read queries and never writes users, credentials, roles, tokens, sessions, or audits", async () => {
    const prisma = {
      department: {
        findMany: vi.fn().mockResolvedValue([{ id: "department-id", code: "RD" }]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      role: {
        findMany: vi.fn().mockResolvedValue([{ id: "role-id", code: RoleCode.researcher }]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "user-id",
            email: "existing@example.org",
            status: UserStatus.ACTIVE,
            userRoles: [],
          },
        ]),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      userCredential: {
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      userRole: {
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      accountLifecycleToken: {
        create: vi.fn(),
        update: vi.fn(),
      },
      userSession: {
        create: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    const repository = new UserAccountImportDryRunRepository(
      prisma as unknown as PrismaService,
    );

    await expect(repository.findActiveDepartmentsByCodes(["RD", "RD"])).resolves.toEqual([
      { id: "department-id", code: "RD" },
    ]);
    await expect(repository.findActiveRolesByCodes([RoleCode.researcher])).resolves.toEqual([
      { id: "role-id", code: RoleCode.researcher },
    ]);
    await expect(repository.findUsersByEmails(["existing@example.org"])).resolves.toEqual([
      {
        id: "user-id",
        email: "existing@example.org",
        status: UserStatus.ACTIVE,
        userRoles: [],
      },
    ]);

    expect(prisma.department.findMany).toHaveBeenCalledWith({
      where: {
        code: { in: ["RD"] },
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true, code: true },
    });
    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: {
        code: { in: [RoleCode.researcher] },
        status: RoleStatus.ACTIVE,
        archivedAt: null,
      },
      select: { id: true, code: true },
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        email: { in: ["existing@example.org"] },
      },
      select: expect.objectContaining({
        id: true,
        email: true,
        status: true,
        userRoles: expect.any(Object),
      }),
    });

    expect(prisma.department.create).not.toHaveBeenCalled();
    expect(prisma.department.update).not.toHaveBeenCalled();
    expect(prisma.department.upsert).not.toHaveBeenCalled();
    expect(prisma.role.create).not.toHaveBeenCalled();
    expect(prisma.role.update).not.toHaveBeenCalled();
    expect(prisma.role.upsert).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.upsert).not.toHaveBeenCalled();
    expect(prisma.userCredential.create).not.toHaveBeenCalled();
    expect(prisma.userCredential.update).not.toHaveBeenCalled();
    expect(prisma.userCredential.upsert).not.toHaveBeenCalled();
    expect(prisma.userRole.create).not.toHaveBeenCalled();
    expect(prisma.userRole.update).not.toHaveBeenCalled();
    expect(prisma.userRole.upsert).not.toHaveBeenCalled();
    expect(prisma.accountLifecycleToken.create).not.toHaveBeenCalled();
    expect(prisma.accountLifecycleToken.update).not.toHaveBeenCalled();
    expect(prisma.userSession.create).not.toHaveBeenCalled();
    expect(prisma.userSession.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
