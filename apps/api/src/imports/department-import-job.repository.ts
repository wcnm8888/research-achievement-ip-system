import { Inject, Injectable } from "@nestjs/common";
import {
  ImportFamily,
  ImportJobStatus,
  ImportMode,
  ImportRunStatus,
  ImportRunTrigger,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

export type DepartmentImportJobClaimInput = {
  idempotencyKeyHash: string;
  targetEnvironment: string;
  scopeType: string;
  scopeHash: string;
  fileFingerprint: string;
  fileSizeBytes: number;
  operatorUserId: string | null;
  requestFingerprint: string;
};

export type DepartmentImportJobRunnerClaim = {
  disposition: "RUNNER";
  jobId: string;
  runId: string;
};

export type DepartmentImportJobExistingClaim = {
  disposition: "REPLAYED_SUCCESS" | "IMPORT_IN_PROGRESS" | "REJECTED" | "FAILED";
  jobId: string;
  latestRunId: string | null;
  safeSummary: Prisma.JsonValue | null;
};

export type DepartmentImportJobClaimResult =
  | DepartmentImportJobRunnerClaim
  | DepartmentImportJobExistingClaim;

export type DepartmentImportJobTransactionClient = Pick<
  Prisma.TransactionClient,
  "importJob" | "importRun"
>;

export type DepartmentImportJobSuccessInput = {
  jobId: string;
  runId: string;
  acceptedRowCount: number;
  createdDepartmentsCount: number;
  auditCount: number;
  warningCount: number;
  errorCount: number;
  safeErrorCodes: string[];
  safeSummary: Prisma.InputJsonValue;
  auditLogIds: string[];
};

export type DepartmentImportJobRejectedInput = {
  jobId: string;
  runId: string;
  acceptedRowCount: number;
  warningCount: number;
  errorCount: number;
  safeErrorCodes: string[];
  safeSummary: Prisma.InputJsonValue;
};

export type DepartmentImportJobFailedInput = {
  jobId: string;
  runId: string;
  failureCode: string;
  failureStage: "TRANSACTION" | "RESPONSE";
};

@Injectable()
export class DepartmentImportJobRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async claimDepartmentCreateOnlyJob(
    input: DepartmentImportJobClaimInput,
  ): Promise<DepartmentImportJobClaimResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const client = tx as DepartmentImportJobTransactionClient;
        const job = await client.importJob.create({
          data: {
            idempotencyKeyHash: input.idempotencyKeyHash,
            importFamily: ImportFamily.DEPARTMENT,
            mode: ImportMode.CREATE_ONLY,
            achievementType: null,
            targetEnvironment: input.targetEnvironment,
            scopeType: input.scopeType,
            scopeHash: input.scopeHash,
            fileFingerprint: input.fileFingerprint,
            fileSizeBytes: input.fileSizeBytes,
            operatorUserId: input.operatorUserId,
            status: ImportJobStatus.RUNNING,
          },
          select: { id: true },
        });
        const run = await client.importRun.create({
          data: {
            jobId: job.id,
            attemptNo: 1,
            trigger: ImportRunTrigger.INITIAL_SUBMIT,
            status: ImportRunStatus.RUNNING,
            operatorUserId: input.operatorUserId,
            requestFingerprint: input.requestFingerprint,
            startedAt: new Date(),
          },
          select: { id: true },
        });

        await client.importJob.update({
          where: { id: job.id },
          data: { latestRunId: run.id },
          select: { id: true },
        });

        return {
          disposition: "RUNNER",
          jobId: job.id,
          runId: run.id,
        };
      });
    } catch (error) {
      if (!isPrismaUniqueConflict(error)) {
        throw error;
      }

      return this.findExistingClaim(input);
    }
  }

  async markSucceededInTransaction(
    client: DepartmentImportJobTransactionClient,
    input: DepartmentImportJobSuccessInput,
  ): Promise<void> {
    const now = new Date();
    await client.importRun.update({
      where: { id: input.runId },
      data: {
        status: ImportRunStatus.SUCCESS,
        applySummary: input.safeSummary,
        auditLogIds: input.auditLogIds,
        completedBusinessTransactionAt: now,
        finishedAt: now,
      },
      select: { id: true },
    });
    await client.importJob.update({
      where: { id: input.jobId },
      data: {
        latestRunId: input.runId,
        status: ImportJobStatus.SUCCESS,
        acceptedRowCount: input.acceptedRowCount,
        createdBusinessCount: input.createdDepartmentsCount,
        createdCompanionCount: 0,
        auditCount: input.auditCount,
        warningCount: input.warningCount,
        errorCount: input.errorCount,
        safeErrorCodes: input.safeErrorCodes,
        safeSummary: input.safeSummary,
        completedAt: now,
      },
      select: { id: true },
    });
  }

  async markRejected(input: DepartmentImportJobRejectedInput): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const client = tx as DepartmentImportJobTransactionClient;
      await client.importRun.update({
        where: { id: input.runId },
        data: {
          status: ImportRunStatus.REJECTED,
          validationSummary: input.safeSummary,
          failureCode: "VALIDATION_BLOCKED",
          failureStage: "VALIDATION",
          finishedAt: now,
        },
        select: { id: true },
      });
      await client.importJob.update({
        where: { id: input.jobId },
        data: {
          latestRunId: input.runId,
          status: ImportJobStatus.REJECTED,
          acceptedRowCount: input.acceptedRowCount,
          createdBusinessCount: 0,
          createdCompanionCount: 0,
          auditCount: 0,
          warningCount: input.warningCount,
          errorCount: input.errorCount,
          safeErrorCodes: input.safeErrorCodes,
          safeSummary: input.safeSummary,
          completedAt: now,
        },
        select: { id: true },
      });
    });
  }

  async markFailed(input: DepartmentImportJobFailedInput): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const client = tx as DepartmentImportJobTransactionClient;
      await client.importRun.update({
        where: { id: input.runId },
        data: {
          status: ImportRunStatus.FAILED,
          failureCode: input.failureCode,
          failureStage: input.failureStage,
          finishedAt: now,
        },
        select: { id: true },
      });
      await client.importJob.update({
        where: { id: input.jobId },
        data: {
          latestRunId: input.runId,
          status: ImportJobStatus.FAILED,
          safeErrorCodes: [input.failureCode],
          completedAt: now,
        },
        select: { id: true },
      });
    });
  }

  private async findExistingClaim(
    input: DepartmentImportJobClaimInput,
  ): Promise<DepartmentImportJobExistingClaim> {
    const job = await this.prisma.importJob.findFirst({
      where: {
        targetEnvironment: input.targetEnvironment,
        scopeType: input.scopeType,
        scopeHash: input.scopeHash,
        idempotencyKeyHash: input.idempotencyKeyHash,
      },
      select: {
        id: true,
        latestRunId: true,
        status: true,
        safeSummary: true,
      },
    });

    if (!job) {
      throw new Error("Import job unique conflict could not be resolved.");
    }

    return {
      disposition: toClaimDisposition(job.status),
      jobId: job.id,
      latestRunId: job.latestRunId,
      safeSummary: job.safeSummary,
    };
  }
}

const toClaimDisposition = (
  status: ImportJobStatus,
): DepartmentImportJobExistingClaim["disposition"] => {
  switch (status) {
    case ImportJobStatus.SUCCESS:
      return "REPLAYED_SUCCESS";
    case ImportJobStatus.REJECTED:
      return "REJECTED";
    case ImportJobStatus.FAILED:
      return "FAILED";
    case ImportJobStatus.PENDING:
    case ImportJobStatus.RUNNING:
      return "IMPORT_IN_PROGRESS";
  }
};

const isPrismaUniqueConflict = (error: unknown): boolean =>
  Boolean(error && typeof error === "object" && (error as { code?: unknown }).code === "P2002");
