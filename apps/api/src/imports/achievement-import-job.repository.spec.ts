import { ImportJobStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AchievementImportJobRepository } from "./achievement-import-job.repository";

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

describe("AchievementImportJobRepository", () => {
  it("creates a running ACHIEVEMENT PAPER job and first run for a first same-key claim", async () => {
    const tx = {
      importJob: {
        create: vi.fn().mockResolvedValue({ id: "job-1" }),
        update: vi.fn().mockResolvedValue({ id: "job-1" }),
      },
      importRun: {
        create: vi.fn().mockResolvedValue({ id: "run-1" }),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
      importJob: {
        findFirst: vi.fn(),
      },
    };
    const repository = new AchievementImportJobRepository(prisma as never);

    const result = await repository.claimPaperCreateDraftJob(claimInput);

    expect(result).toEqual({
      disposition: "RUNNER",
      jobId: "job-1",
      runId: "run-1",
    });
    expect(tx.importJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        importFamily: "ACHIEVEMENT",
        mode: "CREATE_DRAFT_ONLY",
        achievementType: "PAPER",
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
    const repository = new AchievementImportJobRepository(prisma as never);

    const result = await repository.claimPaperCreateDraftJob(claimInput);

    expect(result).toEqual({
      disposition: "IMPORT_IN_PROGRESS",
      jobId: "job-1",
      latestRunId: "run-1",
      safeSummary: null,
    });
    expect(tx.importJob.create).toHaveBeenCalledOnce();
    expect(tx.importRun.create).not.toHaveBeenCalled();
    expect(tx.importJob.update).not.toHaveBeenCalled();
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
});
