import { DepartmentStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PermissionCode } from "../authorization/constants/permission-code";
import { RoleCode } from "../authorization/constants/role-code";
import { ScopeType } from "../authorization/constants/scope-type";
import { UserContext } from "../identity/user-context";
import { DepartmentImportJobRepository } from "./department-import-job.repository";
import { DepartmentImportDryRunRepository } from "./department-import-dry-run.repository";
import {
  DepartmentImportApplyRejectedError,
  DepartmentImportDryRunService,
  InvalidDepartmentImportApplyModeError,
} from "./department-import-dry-run.service";

const ids = {
  user: "40000000-0000-4000-8000-000000000001",
  role: "50000000-0000-4000-8000-000000000001",
  department: "10000000-0000-4000-8000-000000000001",
  root: "10000000-0000-4000-8000-000000000010",
  child: "10000000-0000-4000-8000-000000000011",
};

const adminContext: UserContext = {
  userId: ids.user,
  departmentId: ids.department,
  roleIds: [ids.role],
  roleCodes: [RoleCode.systemAdmin],
  permissionCodes: [PermissionCode.systemConfig],
  roleScopes: [
    {
      roleCode: RoleCode.systemAdmin,
      scopeType: ScopeType.global,
      scopeKey: "GLOBAL",
      departmentId: null,
    },
  ],
  scopedDepartmentIds: [ids.department],
};

const makeFile = (content: string) => ({
  originalName: "departments.csv",
  mimeType: "text/csv",
  size: Buffer.byteLength(content),
  buffer: Buffer.from(content, "utf8"),
});

const createService = (
  existing: Array<{ code: string; status: DepartmentStatus }> = [],
) => {
  const tx = { department: {}, auditLog: {} };
  const repository = {
    findDepartmentsByCodes: vi.fn().mockResolvedValue(existing),
    findApplyDepartmentsByCodesInTransaction: vi.fn().mockResolvedValue([]),
    createDepartmentInTransaction: vi.fn().mockImplementation(async (_tx, input) => ({
      id: input.code === "ROOT_NEW" ? ids.root : ids.child,
      code: input.code,
      name: input.name,
      parentId: input.parentId,
      status: DepartmentStatus.ACTIVE,
      createdAt: new Date("2026-07-02T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z"),
      archivedAt: null,
    })),
    isPrismaUniqueConflict: vi.fn((error: unknown) =>
      Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002"),
    ),
  };
  const prisma = {
    tx,
    $transaction: vi.fn(async (callback) => callback(tx)),
  };
  const auditService = {
    recordEventInTransaction: vi.fn().mockResolvedValue({ id: "audit-1" }),
  };
  const importJobRepository = {
    claimDepartmentCreateOnlyJob: vi.fn().mockResolvedValue({
      disposition: "RUNNER",
      jobId: "90000000-0000-4000-8000-000000000001",
      runId: "90000000-0000-4000-8000-000000000101",
    }),
    markSucceededInTransaction: vi.fn().mockResolvedValue(undefined),
    markRejected: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };

  return {
    auditService,
    importJobRepository,
    prisma,
    repository,
    service: new DepartmentImportDryRunService(
      repository as unknown as DepartmentImportDryRunRepository,
      importJobRepository as unknown as DepartmentImportJobRepository,
      prisma as never,
      auditService as never,
    ),
  };
};

describe("DepartmentImportDryRunService", () => {
  it("returns a valid department metadata report for CSV rows", async () => {
    const { service, repository } = createService([
      { code: "ROOT", status: DepartmentStatus.ACTIVE },
    ]);

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name,parentCode\nAI_RESEARCH,AI Research,ROOT\n"),
    );

    expect(result).toMatchObject({
      importType: "DEPARTMENT_METADATA",
      dryRun: true,
      summary: {
        totalRows: 1,
        validRows: 1,
        errorRows: 0,
        warningRows: 0,
        createCandidates: 1,
        existingCodeRows: 0,
      },
    });
    expect(result.file).toMatchObject({
      name: "departments.csv",
      mimeType: "text/csv",
      encoding: "utf-8",
    });
    expect(result.columns.received).toEqual(["code", "name", "parentCode"]);
    expect(result.rows[0]!).toMatchObject({
      rowNumber: 2,
      parsed: {
        code: "AI_RESEARCH",
        name: "AI Research",
        parentCode: "ROOT",
      },
      status: "VALID",
      candidateAction: "CREATE",
      errors: [],
      warnings: [],
    });
    expect(repository.findDepartmentsByCodes).toHaveBeenCalledWith([
      "AI_RESEARCH",
      "ROOT",
    ]);
  });

  it("reports missing required field errors", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,\n"),
    );

    expect(result.summary.errorRows).toBe(1);
    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "name", code: "REQUIRED" }),
    );
  });

  it("reports invalid department code format", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nbad-code,Bad Code\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "code", code: "INVALID_FORMAT" }),
    );
  });

  it("reports duplicate codes inside the file", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,AI One\nAI_RESEARCH,AI Two\n"),
    );

    expect(result.summary.errorRows).toBe(2);
    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_IN_FILE" }),
    );
    expect(result.rows[1]!.errors).toContainEqual(
      expect.objectContaining({ code: "DUPLICATE_IN_FILE" }),
    );
  });

  it("reports unknown parent codes", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name,parentCode\nAI_RESEARCH,AI Research,MISSING_PARENT\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "parentCode", code: "UNKNOWN_PARENT" }),
    );
  });

  it("reports self parent and file-local parent cycles", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile(
        [
          "code,name,parentCode",
          "SELF,Self,SELF",
          "CYCLE_A,Cycle A,CYCLE_B",
          "CYCLE_B,Cycle B,CYCLE_A",
        ].join("\n"),
      ),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ code: "PARENT_CYCLE" }),
    );
    expect(result.rows[1]!.errors).toContainEqual(
      expect.objectContaining({ code: "PARENT_CYCLE" }),
    );
    expect(result.rows[2]!.errors).toContainEqual(
      expect.objectContaining({ code: "PARENT_CYCLE" }),
    );
  });

  it("returns existing DB codes as warning review rows", async () => {
    const { service } = createService([
      { code: "AI_RESEARCH", status: DepartmentStatus.ACTIVE },
    ]);

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,AI Research\n"),
    );

    expect(result.summary).toMatchObject({
      validRows: 1,
      warningRows: 1,
      createCandidates: 0,
      existingCodeRows: 1,
    });
    expect(result.rows[0]!).toMatchObject({
      status: "WARNING",
      candidateAction: "REVIEW_EXISTING",
    });
    expect(result.rows[0]!.warnings).toContainEqual(
      expect.objectContaining({ field: "code", code: "EXISTING_CODE" }),
    );
  });

  it("reports unknown columns strictly", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name,status\nAI_RESEARCH,AI Research,ACTIVE\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "status", code: "UNKNOWN_COLUMN" }),
    );
  });

  it("rejects formula-like values", async () => {
    const { service } = createService();

    const result = await service.dryRunDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,=cmd\n"),
    );

    expect(result.rows[0]!.errors).toContainEqual(
      expect.objectContaining({ field: "name", code: "FORMULA_LIKE_VALUE" }),
    );
  });

  it("applies create-only department tree in parent-before-child order with audit in the same transaction", async () => {
    const { service, repository, prisma, auditService, importJobRepository } = createService();

    const result = await service.applyDepartmentCsv(
      adminContext,
      makeFile(
        [
          "code,name,parentCode",
          "CHILD_NEW,Child Department,ROOT_NEW",
          "ROOT_NEW,Root Department,",
        ].join("\n"),
      ),
      "CREATE_ONLY",
    );

    expect(result).toMatchObject({
      importType: "DEPARTMENT_METADATA",
      dryRun: false,
      mode: "CREATE_ONLY",
      summary: {
        totalRows: 2,
        createdRows: 2,
        skippedRows: 0,
        failedRows: 0,
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(repository.createDepartmentInTransaction).toHaveBeenNthCalledWith(
      1,
      prisma.tx,
      { code: "ROOT_NEW", name: "Root Department", parentId: null },
    );
    expect(repository.createDepartmentInTransaction).toHaveBeenNthCalledWith(
      2,
      prisma.tx,
      { code: "CHILD_NEW", name: "Child Department", parentId: ids.root },
    );
    expect(auditService.recordEventInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        action: AuditActionCode.configUpdate,
        target: expect.objectContaining({
          type: AuditTargetTypeCode.systemConfig,
          id: ids.root,
          departmentId: ids.root,
        }),
        newValue: expect.objectContaining({
          operation: "DEPARTMENT_IMPORT_CREATE",
          importType: "DEPARTMENT_METADATA",
          mode: "CREATE_ONLY",
          code: "ROOT_NEW",
        }),
      }),
    );
    expect(importJobRepository.markSucceededInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      expect.objectContaining({
        jobId: "90000000-0000-4000-8000-000000000001",
        runId: "90000000-0000-4000-8000-000000000101",
        acceptedRowCount: 2,
        createdDepartmentsCount: 2,
        auditCount: 2,
        safeErrorCodes: [],
      }),
    );
    const successSummary = JSON.stringify(
      importJobRepository.markSucceededInTransaction.mock.calls[0]![1],
    );
    expect(successSummary).not.toContain("Root Department");
    expect(successSummary).not.toContain("Child Department");
    expect(successSummary).not.toContain("code,name");
    expect(successSummary).not.toContain("credential");
    expect(successSummary).not.toContain("session");
    expect(successSummary).not.toContain("token");
  });

  it("returns a safe replay result for a same-key successful job without opening the business transaction", async () => {
    const { service, repository, prisma, importJobRepository } = createService();
    importJobRepository.claimDepartmentCreateOnlyJob.mockResolvedValueOnce({
      disposition: "REPLAYED_SUCCESS",
      jobId: "90000000-0000-4000-8000-000000000001",
      latestRunId: "90000000-0000-4000-8000-000000000101",
      safeSummary: {
        importType: "DEPARTMENT_METADATA",
        mode: "CREATE_ONLY",
        operation: "DEPARTMENT_IMPORT_CREATE",
        totalRows: 2,
        acceptedRowCount: 2,
        createdDepartmentsCount: 2,
        auditCount: 2,
        warningCount: 0,
        errorCount: 0,
        errors: [],
      },
    });

    const result = await service.applyDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,AI Research\n"),
      "CREATE_ONLY",
    );

    expect(result.job).toEqual({
      disposition: "REPLAYED_SUCCESS",
      jobId: "90000000-0000-4000-8000-000000000001",
      runId: "90000000-0000-4000-8000-000000000101",
    });
    expect(result.summary).toMatchObject({
      totalRows: 2,
      createdRows: 2,
      errorCount: 0,
      warningCount: 0,
    });
    expect(result.rows).toEqual([]);
    expect(repository.findDepartmentsByCodes).not.toHaveBeenCalled();
    expect(repository.createDepartmentInTransaction).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns in-progress for a same-key running job without opening the business transaction", async () => {
    const { service, repository, prisma, importJobRepository } = createService();
    importJobRepository.claimDepartmentCreateOnlyJob.mockResolvedValueOnce({
      disposition: "IMPORT_IN_PROGRESS",
      jobId: "90000000-0000-4000-8000-000000000001",
      latestRunId: "90000000-0000-4000-8000-000000000101",
      safeSummary: null,
    });

    const result = await service.applyDepartmentCsv(
      adminContext,
      makeFile("code,name\nAI_RESEARCH,AI Research\n"),
      "CREATE_ONLY",
    );

    expect(result.job).toEqual({
      disposition: "IMPORT_IN_PROGRESS",
      jobId: "90000000-0000-4000-8000-000000000001",
      runId: "90000000-0000-4000-8000-000000000101",
    });
    expect(result.summary.createdRows).toBe(0);
    expect(repository.findDepartmentsByCodes).not.toHaveBeenCalled();
    expect(repository.createDepartmentInTransaction).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects duplicate codes before opening a write transaction", async () => {
    const { service, prisma, repository, auditService, importJobRepository } = createService();

    await expect(
      service.applyDepartmentCsv(
        adminContext,
        makeFile("code,name\nDUP,First\nDUP,Second\n"),
        "CREATE_ONLY",
      ),
    ).rejects.toBeInstanceOf(DepartmentImportApplyRejectedError);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createDepartmentInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markRejected).toHaveBeenCalledOnce();
    const rejectedSummary = JSON.stringify(
      importJobRepository.markRejected.mock.calls[0]![0],
    );
    expect(rejectedSummary).toContain("DUPLICATE_IN_FILE");
    expect(rejectedSummary).not.toContain("First");
    expect(rejectedSummary).not.toContain("Second");
    expect(rejectedSummary).not.toContain("code,name");
  });

  it("rejects missing parents before opening a write transaction", async () => {
    const { service, prisma, repository } = createService();

    await expect(
      service.applyDepartmentCsv(
        adminContext,
        makeFile("code,name,parentCode\nCHILD,Child,MISSING_PARENT\n"),
        "CREATE_ONLY",
      ),
    ).rejects.toBeInstanceOf(DepartmentImportApplyRejectedError);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.createDepartmentInTransaction).not.toHaveBeenCalled();
  });

  it("rejects non CREATE_ONLY modes", async () => {
    const { service, repository, prisma } = createService();

    await expect(
      service.applyDepartmentCsv(
        adminContext,
        makeFile("code,name\nAI_RESEARCH,AI Research\n"),
        "UPSERT",
      ),
    ).rejects.toBeInstanceOf(InvalidDepartmentImportApplyModeError);

    expect(repository.findDepartmentsByCodes).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects transaction-time duplicate code rechecks without creating rows", async () => {
    const { service, repository, auditService, importJobRepository } = createService();
    repository.findApplyDepartmentsByCodesInTransaction.mockResolvedValueOnce([
      {
        id: ids.root,
        code: "AI_RESEARCH",
        parentId: null,
        status: DepartmentStatus.ACTIVE,
        archivedAt: null,
      },
    ]);

    await expect(
      service.applyDepartmentCsv(
        adminContext,
        makeFile("code,name\nAI_RESEARCH,AI Research\n"),
        "CREATE_ONLY",
      ),
    ).rejects.toBeInstanceOf(DepartmentImportApplyRejectedError);

    expect(repository.createDepartmentInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
    expect(importJobRepository.markRejected).toHaveBeenCalledOnce();
  });

  it("rejects transaction-time missing parent rechecks without creating rows", async () => {
    const { service, repository, auditService } = createService([
      { code: "ROOT", status: DepartmentStatus.ACTIVE },
    ]);
    repository.findApplyDepartmentsByCodesInTransaction
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await expect(
      service.applyDepartmentCsv(
        adminContext,
        makeFile("code,name,parentCode\nCHILD_NEW,Child Department,ROOT\n"),
        "CREATE_ONLY",
      ),
    ).rejects.toBeInstanceOf(DepartmentImportApplyRejectedError);

    expect(repository.createDepartmentInTransaction).not.toHaveBeenCalled();
    expect(auditService.recordEventInTransaction).not.toHaveBeenCalled();
  });

  it("keeps create and audit work inside one transaction for rollback on partial failure", async () => {
    const { service, repository, prisma, importJobRepository } = createService();
    repository.createDepartmentInTransaction.mockRejectedValueOnce(new Error("insert failed"));

    await expect(
      service.applyDepartmentCsv(
        adminContext,
        makeFile("code,name\nAI_RESEARCH,AI Research\n"),
        "CREATE_ONLY",
      ),
    ).rejects.toThrow("insert failed");

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(repository.createDepartmentInTransaction).toHaveBeenCalledWith(
      prisma.tx,
      { code: "AI_RESEARCH", name: "AI Research", parentId: null },
    );
    expect(importJobRepository.markFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "90000000-0000-4000-8000-000000000001",
        runId: "90000000-0000-4000-8000-000000000101",
        failureCode: "UNEXPECTED_EXCEPTION",
      }),
    );
  });
});
