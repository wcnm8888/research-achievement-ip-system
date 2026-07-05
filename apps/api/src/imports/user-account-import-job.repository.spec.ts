import {
  ImportJobItemPlannedAction,
  ImportJobItemStatus,
  ImportJobItemTargetType,
  ImportJobStatus,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { UserAccountImportJobRepository } from "./user-account-import-job.repository";

const claimInput = {
  idempotencyKeyHash: "hash-key",
  targetEnvironment: "test",
  scopeType: "GLOBAL_OPERATOR_SCOPE",
  scopeHash: "scope-hash",
  fileFingerprint: "file-hash",
  fileSizeBytes: 42,
  operatorUserId: "40000000-0000-4000-8000-000000000001",
  requestFingerprint: "request-hash",
};

describe("UserAccountImportJobRepository", () => {
  it("creates a running USER_ACCOUNT pending no-credential job and first run for a first same-key claim", async () => {
    const tx = {
      importJob: {
        create: vi.fn().mockResolvedValue({ id: "job-1" }),
        update: vi.fn().mockResolvedValue({ id: "job-1" }),
      },
      importRun: {
        create: vi.fn().mockResolvedValue({ id: "run-1" }),
      },
      importJobItem: {
        createMany: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
      importJob: {
        findFirst: vi.fn(),
      },
    };
    const repository = new UserAccountImportJobRepository(prisma as never);

    const result = await repository.claimUserAccountPendingNoCredentialJob(claimInput);

    expect(result).toEqual({
      disposition: "RUNNER",
      jobId: "job-1",
      runId: "run-1",
    });
    expect(tx.importJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        importFamily: "USER_ACCOUNT",
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        achievementType: null,
        status: "RUNNING",
      }),
      select: { id: true },
    });
    expect(tx.importRun.create).toHaveBeenCalledOnce();
    expect(tx.importJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: { latestRunId: "run-1" },
      select: { id: true },
    });
    expect(prisma.importJob.findFirst).not.toHaveBeenCalled();
  });

  it("resolves a same-key unique conflict as in-progress without creating another run", async () => {
    const tx = {
      importJob: {
        create: vi.fn().mockRejectedValue({ code: "P2002" }),
        update: vi.fn(),
      },
      importRun: {
        create: vi.fn(),
      },
      importJobItem: {
        createMany: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
      importJob: {
        findFirst: vi.fn().mockResolvedValue({
          id: "job-1",
          latestRunId: "run-1",
          status: ImportJobStatus.RUNNING,
          safeSummary: null,
        }),
      },
    };
    const repository = new UserAccountImportJobRepository(prisma as never);

    const result = await repository.claimUserAccountPendingNoCredentialJob(claimInput);

    expect(result).toEqual({
      disposition: "IMPORT_IN_PROGRESS",
      jobId: "job-1",
      latestRunId: "run-1",
      safeSummary: null,
    });
    expect(tx.importJob.create).toHaveBeenCalledOnce();
    expect(tx.importRun.create).not.toHaveBeenCalled();
    expect(tx.importJob.update).not.toHaveBeenCalled();
    expect(tx.importJobItem.createMany).not.toHaveBeenCalled();
    expect(prisma.importJob.findFirst).toHaveBeenCalledWith({
      where: {
        targetEnvironment: "test",
        scopeType: "GLOBAL_OPERATOR_SCOPE",
        scopeHash: "scope-hash",
        idempotencyKeyHash: "hash-key",
      },
      select: {
        id: true,
        latestRunId: true,
        status: true,
        safeSummary: true,
      },
    });
  });

  it("writes only allowlisted user item data when marking a runner success", async () => {
    const tx = {
      importJob: {
        update: vi.fn().mockResolvedValue({ id: "job-1" }),
      },
      importRun: {
        update: vi.fn().mockResolvedValue({ id: "run-1" }),
      },
      importJobItem: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const repository = new UserAccountImportJobRepository({} as never);

    await repository.markSucceededInTransaction(tx as never, {
      jobId: "job-1",
      runId: "run-1",
      acceptedRowCount: 2,
      createdUsersCount: 2,
      createdUserRolesCount: 2,
      auditCount: 2,
      warningCount: 0,
      errorCount: 0,
      safeErrorCodes: [],
      safeSummary: {
        importType: "USER_ACCOUNT",
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        totalRows: 2,
      },
      auditLogIds: ["audit-1", "audit-2"],
      items: [
        { rowNumber: 2, safeCode: null, targetId: "user-1" },
        { rowNumber: 3, safeCode: null, targetId: "user-2" },
      ],
    });

    expect(tx.importJobItem.createMany).toHaveBeenCalledWith({
      data: [
        {
          jobId: "job-1",
          runId: "run-1",
          rowNumber: 2,
          plannedAction: ImportJobItemPlannedAction.CREATE_PENDING_USER,
          status: ImportJobItemStatus.APPLIED,
          safeCode: null,
          targetType: ImportJobItemTargetType.USER,
          targetId: "user-1",
        },
        {
          jobId: "job-1",
          runId: "run-1",
          rowNumber: 3,
          plannedAction: ImportJobItemPlannedAction.CREATE_PENDING_USER,
          status: ImportJobItemStatus.APPLIED,
          safeCode: null,
          targetType: ImportJobItemTargetType.USER,
          targetId: "user-2",
        },
      ],
    });
    const itemData = tx.importJobItem.createMany.mock.calls[0]![0].data;
    for (const item of itemData) {
      expect(Object.keys(item).sort()).toEqual([
        "jobId",
        "plannedAction",
        "rowNumber",
        "runId",
        "safeCode",
        "status",
        "targetId",
        "targetType",
      ]);
      expect(item).not.toHaveProperty("email");
      expect(item).not.toHaveProperty("employeeNo");
      expect(item).not.toHaveProperty("name");
      expect(item).not.toHaveProperty("departmentCode");
      expect(item).not.toHaveProperty("role");
      expect(item).not.toHaveProperty("credential");
      expect(item).not.toHaveProperty("invite");
      expect(item).not.toHaveProperty("password");
      expect(item).not.toHaveProperty("safeSummary");
      expect(item).not.toHaveProperty("auditLogIds");
    }
    expect(tx.importRun.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "run-1" } }),
    );
    expect(tx.importJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "job-1" } }),
    );
  });

  it("does not write item rows when marking rejected or failed jobs", async () => {
    const tx = {
      importJob: {
        update: vi.fn().mockResolvedValue({ id: "job-1" }),
      },
      importRun: {
        update: vi.fn().mockResolvedValue({ id: "run-1" }),
      },
      importJobItem: {
        createMany: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };
    const repository = new UserAccountImportJobRepository(prisma as never);

    await repository.markRejected({
      jobId: "job-1",
      runId: "run-1",
      acceptedRowCount: 0,
      warningCount: 0,
      errorCount: 1,
      safeErrorCodes: ["REQUIRED"],
      safeSummary: {
        importType: "USER_ACCOUNT",
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        totalRows: 1,
      },
    });
    await repository.markFailed({
      jobId: "job-1",
      runId: "run-1",
      failureCode: "UNEXPECTED_EXCEPTION",
      failureStage: "TRANSACTION",
    });

    expect(tx.importJobItem.createMany).not.toHaveBeenCalled();
  });
});
