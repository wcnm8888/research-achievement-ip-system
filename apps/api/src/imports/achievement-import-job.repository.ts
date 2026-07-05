import { Inject, Injectable } from "@nestjs/common";
import {
  ImportFamily,
  ImportJobItemPlannedAction,
  ImportJobItemStatus,
  ImportJobItemTargetType,
  ImportJobStatus,
  ImportMode,
  ImportRunStatus,
  ImportRunTrigger,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../database/prisma.service";

export type AchievementImportJobClaimInput = {
  achievementType: "PAPER" | "PATENT" | "SOFTWARE_COPYRIGHT";
  idempotencyKeyHash: string;
  targetEnvironment: string;
  scopeType: string;
  scopeHash: string;
  fileFingerprint: string;
  fileSizeBytes: number;
  operatorUserId: string | null;
  requestFingerprint: string;
};

export type AchievementImportJobRunnerClaim = {
  disposition: "RUNNER";
  jobId: string;
  runId: string;
};

export type AchievementImportJobExistingClaim = {
  disposition: "REPLAYED_SUCCESS" | "IMPORT_IN_PROGRESS" | "REJECTED" | "FAILED";
  jobId: string;
  latestRunId: string | null;
  safeSummary: Prisma.JsonValue | null;
};

export type AchievementImportJobClaimResult =
  | AchievementImportJobRunnerClaim
  | AchievementImportJobExistingClaim;

export type AchievementImportJobTransactionClient = Pick<
  Prisma.TransactionClient,
  "importJob" | "importRun" | "importJobItem"
>;

export type AchievementImportJobSuccessItemInput = {
  rowNumber: number;
  safeCode: string | null;
  targetId: string;
};

export type AchievementImportJobSuccessInput = {
  jobId: string;
  runId: string;
  acceptedRowCount: number;
  createdAchievementsCount: number;
  createdPaperDetailsCount: number;
  createdPatentDetailsCount: number;
  createdSoftwareCopyrightDetailsCount: number;
  createdContributorsCount: number;
  auditCount: number;
  warningCount: number;
  errorCount: number;
  safeErrorCodes: string[];
  safeSummary: Prisma.InputJsonValue;
  auditLogIds: string[];
  items: AchievementImportJobSuccessItemInput[];
};

export type AchievementImportJobRejectedInput = {
  jobId: string;
  runId: string;
  acceptedRowCount: number;
  warningCount: number;
  errorCount: number;
  safeErrorCodes: string[];
  safeSummary: Prisma.InputJsonValue;
};

export type AchievementImportJobFailedInput = {
  jobId: string;
  runId: string;
  failureCode: string;
  failureStage: "TRANSACTION" | "RESPONSE";
};

@Injectable()
export class AchievementImportJobRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async claimAchievementCreateDraftJob(
    input: AchievementImportJobClaimInput,
  ): Promise<AchievementImportJobClaimResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const client = tx as AchievementImportJobTransactionClient;
        const job = await client.importJob.create({
          data: {
            idempotencyKeyHash: input.idempotencyKeyHash,
            importFamily: ImportFamily.ACHIEVEMENT,
            mode: ImportMode.CREATE_DRAFT_ONLY,
            achievementType: input.achievementType,
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
    client: AchievementImportJobTransactionClient,
    input: AchievementImportJobSuccessInput,
  ): Promise<void> {
    const now = new Date();
    if (input.items.length > 0) {
      await client.importJobItem.createMany({
        data: input.items.map((item) => ({
          jobId: input.jobId,
          runId: input.runId,
          rowNumber: item.rowNumber,
          plannedAction: ImportJobItemPlannedAction.CREATE_DRAFT,
          status: ImportJobItemStatus.APPLIED,
          safeCode: item.safeCode,
          targetType: ImportJobItemTargetType.ACHIEVEMENT,
          targetId: item.targetId,
        })),
      });
    }
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
        createdBusinessCount: input.createdAchievementsCount,
        createdCompanionCount:
          input.createdPaperDetailsCount +
          input.createdPatentDetailsCount +
          input.createdSoftwareCopyrightDetailsCount +
          input.createdContributorsCount,
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

  async markRejected(input: AchievementImportJobRejectedInput): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const client = tx as AchievementImportJobTransactionClient;
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

  async markFailed(input: AchievementImportJobFailedInput): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const client = tx as AchievementImportJobTransactionClient;
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
    input: AchievementImportJobClaimInput,
  ): Promise<AchievementImportJobExistingClaim> {
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
): AchievementImportJobExistingClaim["disposition"] => {
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
