import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DepartmentStatus, Prisma, UserStatus } from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import {
  AchievementStatusCode,
  AchievementTypeCode,
  ContributorRoleCode,
  ContributorTypeCode,
  PatentLegalStatusCode,
  PatentTypeCode,
  SecretLevelCode,
  SoftwareTypeCode,
} from "../achievements/domain/achievement-domain.types";
import {
  normalizeDoi,
  normalizePatentApplicationNo,
  normalizePatentGrantNo,
  normalizeSoftwareRegistrationNo,
} from "../achievements/domain/achievement-normalizer";
import {
  CreateAchievementContributorDraftInput,
  CreatePaperDetailDraftInput,
  CreatePatentDetailDraftInput,
  CreateSoftwareCopyrightDetailDraftInput,
} from "../achievements/domain/achievement-repository.types";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  AchievementImportApplyDepartmentLookup,
  AchievementImportApplyTransactionClient,
  AchievementImportApplyUserLookup,
  AchievementImportCreatedDraft,
  AchievementImportDepartmentLookup,
  AchievementImportDryRunRepository,
  AchievementImportNormalizedConflict,
  AchievementImportUserLookup,
} from "./achievement-import-dry-run.repository";
import {
  AchievementImportJobRepository,
  AchievementImportJobClaimInput,
  AchievementImportJobClaimResult,
  AchievementImportJobExistingClaim,
  AchievementImportJobTransactionClient,
} from "./achievement-import-job.repository";
import {
  appendColumnValidationIssues,
  buildImportDryRunFileMetadata,
  buildValuesByHeader,
  ImportCsvParseResult,
  ImportDryRunFile,
  ImportDryRunIssue,
  ImportDryRunResult,
  ImportDryRunRow,
  ImportDryRunStatus,
  isFormulaLikeCell,
  normalizeImportHeaderToken,
  parseImportCsv,
  summarizeImportDryRunRows,
} from "./import-dry-run.shared";

export const achievementImportType = "ACHIEVEMENT" as const;

const requiredColumns = ["type", "title", "departmentCode", "contributors"] as const;
const optionalColumns = [
  "ownerEmail",
  "ownerEmployeeNo",
  "secretLevel",
  "status",
  "doi",
  "DOI",
  "journal",
  "issnCn",
  "publishYear",
  "includedType",
  "impactFactor",
  "partition",
  "abstract",
  "applicationNo",
  "patentNo",
  "grantNo",
  "patentType",
  "filingDate",
  "grantDate",
  "nextFeeDate",
  "feeAmount",
  "legalStatus",
  "registrationNo",
  "softwareRegistrationNo",
  "softwareVersion",
  "softwareType",
  "publishDate",
  "registerDate",
  "runEnv",
] as const;
const allowedColumns = new Set<string>([...requiredColumns, ...optionalColumns]);
const sensitiveColumns = new Set([
  "password",
  "initialpassword",
  "passwordhash",
  "credentialstatus",
  "token",
  "invitelink",
  "resetlink",
  "session",
  "cookie",
  "secret",
  "accesskey",
  "privatekey",
  "connectionstring",
  "storagekey",
  "objectkey",
  "checksum",
  "rawpayload",
  "payload",
]);
const forbiddenColumns = new Set([
  "id",
  "achievementid",
  "owneruserid",
  "departmentid",
  "createdbyid",
  "updatedbyid",
  "submittedbyid",
  "workflowid",
  "attachmentid",
  "feerecordid",
]);
const paperFields = new Set([
  "doi",
  "DOI",
  "journal",
  "issnCn",
  "publishYear",
  "includedType",
  "impactFactor",
  "partition",
  "abstract",
]);
const patentFields = new Set([
  "applicationNo",
  "patentNo",
  "grantNo",
  "patentType",
  "filingDate",
  "grantDate",
  "nextFeeDate",
  "feeAmount",
  "legalStatus",
]);
const softwareFields = new Set([
  "registrationNo",
  "softwareRegistrationNo",
  "softwareVersion",
  "softwareType",
  "publishDate",
  "registerDate",
  "runEnv",
]);
const departmentCodePattern = /^[A-Z0-9_]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const maxRows = 500;
const defaultStatus = AchievementStatusCode.draft;
const defaultSecretLevel = SecretLevelCode.internal;
const allowedAchievementTypes = new Set<string>(Object.values(AchievementTypeCode));
const allowedAchievementStatuses = new Set<string>(Object.values(AchievementStatusCode));
const allowedSecretLevels = new Set<string>(Object.values(SecretLevelCode));
const allowedContributorTypes = new Set<string>(Object.values(ContributorTypeCode));
const allowedContributorRoles = new Set<string>(Object.values(ContributorRoleCode));
const allowedPatentTypes = new Set<string>(Object.values(PatentTypeCode));
const allowedPatentLegalStatuses = new Set<string>(Object.values(PatentLegalStatusCode));
const allowedSoftwareTypes = new Set<string>(Object.values(SoftwareTypeCode));

export type AchievementImportDryRunFile = ImportDryRunFile;

export type AchievementImportDryRunIssueCode =
  | "REQUIRED"
  | "INVALID_FORMAT"
  | "INVALID_ENUM"
  | "UNSUPPORTED_STATUS"
  | "UNKNOWN_COLUMN"
  | "FORBIDDEN_SENSITIVE_COLUMN"
  | "FORMULA_LIKE_VALUE"
  | "DETAIL_TYPE_MISMATCH"
  | "DUPLICATE_IN_FILE"
  | "DB_CONFLICT"
  | "UNKNOWN_DEPARTMENT"
  | "OWNER_NOT_FOUND"
  | "OWNER_DEPARTMENT_MISMATCH"
  | "CONTRIBUTOR_FORMAT_INVALID"
  | "CONTRIBUTOR_USER_NOT_FOUND"
  | "CONTRIBUTOR_TYPE_MISMATCH"
  | "OWNER_EMPLOYEE_NO_LOOKUP_NOT_AVAILABLE";

export type AchievementImportDryRunIssue = ImportDryRunIssue<AchievementImportDryRunIssueCode>;

export type AchievementImportDryRunRowStatus = ImportDryRunStatus;
export type AchievementImportDryRunCandidateAction = "CREATE_DRAFT" | "SKIP";

export type AchievementImportContributorPreview = {
  name: string | null;
  contributorType: string | null;
  contributorRole: string | null;
  userEmail: string | null;
  organization: string | null;
  sortOrder: number;
};

export type AchievementImportDryRunIdentifiers = {
  doi: string | null;
  applicationNo: string | null;
  patentNo: string | null;
  registrationNo: string | null;
};

export type AchievementImportDryRunParsedRow = {
  type: string | null;
  title: string | null;
  ownerEmail: string | null;
  ownerEmployeeNo: string | null;
  departmentCode: string | null;
  secretLevel: string | null;
  status: string | null;
  contributors: AchievementImportContributorPreview[];
  identifiers: AchievementImportDryRunIdentifiers;
  normalizedIdentifiers: AchievementImportDryRunIdentifiers;
};

export type AchievementImportDryRunRow = ImportDryRunRow<
  AchievementImportDryRunParsedRow,
  AchievementImportDryRunCandidateAction,
  AchievementImportDryRunIssue
>;

export type AchievementImportDryRunSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  createDraftCandidates: number;
  duplicateIdentifierRows: number;
  dbConflictRows: number;
  ownerEmployeeNoLookup: "NOT_AVAILABLE";
};

export type AchievementImportDryRunResult = ImportDryRunResult<
  typeof achievementImportType,
  AchievementImportDryRunSummary,
  AchievementImportDryRunRow
>;

export type AchievementImportApplyMode = "CREATE_DRAFT_ONLY";

export type AchievementImportApplyErrorSummary = {
  rowNumber: number | null;
  field: string;
  code: string;
  message: string;
};

export type AchievementImportApplyRow = {
  rowNumber: number;
  status: "CREATED";
  createdAchievementId: string;
  type:
    | typeof AchievementTypeCode.paper
    | typeof AchievementTypeCode.patent
    | typeof AchievementTypeCode.softwareCopyright;
  achievementStatus: typeof AchievementStatusCode.draft;
  departmentId: string;
  ownerUserId: string;
  contributorCount: number;
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
};

export type AchievementImportApplySummary = {
  totalRows: number;
  createdAchievementsCount: number;
  createdPaperDetailsCount: number;
  createdPatentDetailsCount: number;
  createdSoftwareCopyrightDetailsCount: number;
  createdContributorsCount: number;
  skippedRows: number;
  failedRows: number;
  errorCount: number;
  warningCount: number;
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
};

export type AchievementImportApplyJobDisposition =
  | "EXECUTED"
  | "REPLAYED_SUCCESS"
  | "IMPORT_IN_PROGRESS";

export type AchievementImportApplyJobSummary = {
  disposition: AchievementImportApplyJobDisposition;
  jobId: string;
  runId: string | null;
};

export type AchievementImportApplyResult = {
  importType: typeof achievementImportType;
  dryRun: false;
  mode: AchievementImportApplyMode;
  file: ReturnType<typeof buildImportDryRunFileMetadata>;
  summary: AchievementImportApplySummary;
  errors: AchievementImportApplyErrorSummary[];
  rows: AchievementImportApplyRow[];
  job?: AchievementImportApplyJobSummary;
};

type AchievementImportPlan = {
  file: AchievementImportDryRunResult["file"];
  columns: AchievementImportDryRunResult["columns"];
  summary: AchievementImportDryRunSummary;
  rows: AchievementImportDryRunRow[];
  resolvedRows: AchievementImportResolvedPlanRow[];
};

type AchievementImportResolvedPlanRow = {
  rowNumber: number;
  parsed: AchievementImportDryRunParsedRow;
  resolved: {
    departmentId: string | null;
    ownerUserId: string | null;
  };
  paperDetail: CreatePaperDetailDraftInput;
  patentDetail: CreatePatentDetailDraftInput;
  softwareCopyrightDetail: CreateSoftwareCopyrightDetailDraftInput;
};

type WorkingRow = {
  rowNumber: number;
  valuesByHeader: Map<string, string>;
  parsed: AchievementImportDryRunParsedRow;
  resolved: {
    departmentId: string | null;
    ownerUserId: string | null;
  };
  errors: AchievementImportDryRunIssue[];
  warnings: AchievementImportDryRunIssue[];
};

export class InvalidAchievementImportCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAchievementImportCsvError";
  }
}

export class InvalidAchievementImportApplyModeError extends Error {
  constructor(mode: string) {
    super(`Unsupported achievement import apply mode: ${mode}.`);
    this.name = "InvalidAchievementImportApplyModeError";
  }
}

export class AchievementImportApplyRejectedError extends Error {
  constructor(
    message: string,
    readonly result: AchievementImportApplyResult,
  ) {
    super(message);
    this.name = "AchievementImportApplyRejectedError";
  }
}

@Injectable()
export class AchievementImportDryRunService {
  constructor(
    @Inject(AchievementImportDryRunRepository)
    private readonly repository: AchievementImportDryRunRepository,
    @Inject(AchievementImportJobRepository)
    private readonly importJobRepository: AchievementImportJobRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async dryRunAchievementCsv(
    _context: UserContext,
    file: AchievementImportDryRunFile,
  ): Promise<AchievementImportDryRunResult> {
    const plan = await this.buildAchievementImportPlan(file);

    return {
      importType: achievementImportType,
      dryRun: true,
      file: plan.file,
      columns: plan.columns,
      summary: plan.summary,
      rows: plan.rows,
    };
  }

  async applyAchievementCsv(
    context: UserContext,
    file: AchievementImportDryRunFile,
    mode: string | undefined = "CREATE_DRAFT_ONLY",
  ): Promise<AchievementImportApplyResult> {
    if (mode !== "CREATE_DRAFT_ONLY") {
      throw new InvalidAchievementImportApplyModeError(mode ?? "(missing)");
    }

    const plan = await this.buildAchievementImportPlan(file);
    const importJobAchievementType = getImportJobAchievementType(plan);
    if (!importJobAchievementType) {
      assertPlanCanApply(plan);
      return this.applyAchievementPlanWithoutJob(context, plan);
    }

    const idempotency = buildAchievementImportIdempotency(
      context,
      file,
      importJobAchievementType,
    );
    const claim = await this.importJobRepository.claimAchievementCreateDraftJob({
      ...idempotency,
      fileSizeBytes: file.size,
      operatorUserId: context.userId,
    });
    if (claim.disposition !== "RUNNER") {
      const existingResult = toExistingAchievementImportJobApplyResult(file, claim);
      if (claim.disposition === "REJECTED" || claim.disposition === "FAILED") {
        throw new AchievementImportApplyRejectedError(
          claim.disposition === "FAILED"
            ? "Achievement import job is failed and retry is not enabled."
            : "Achievement import apply was already rejected.",
          existingResult,
        );
      }

      return existingResult;
    }

    try {
      assertPlanCanApply(plan);
    } catch (error) {
      if (error instanceof AchievementImportApplyRejectedError) {
        await this.importJobRepository.markRejected(
          toRejectedAchievementImportJobInput(claim, error.result, importJobAchievementType),
        );
      }

      throw error;
    }

    try {
      const appliedRows = await this.executeAchievementApplyTransaction(
        context,
        plan,
        claim,
      );

      return withJobSummary(buildSuccessfulApplyResult(plan, appliedRows), {
        disposition: "EXECUTED",
        jobId: claim.jobId,
        runId: claim.runId,
      });
    } catch (error) {
      if (error instanceof AchievementImportApplyRejectedError) {
        await this.importJobRepository.markRejected(
          toRejectedAchievementImportJobInput(claim, error.result, importJobAchievementType),
        );
        throw error;
      }

      if (this.repository.isPrismaUniqueConflict(error)) {
        const rejected = new AchievementImportApplyRejectedError(
          "Achievement import apply encountered a uniqueness conflict.",
          buildRejectedApplyResult(plan, [
            toUniqueConflictApplyError(this.repository.getPrismaUniqueConflictTarget(error)),
          ]),
        );
        await this.importJobRepository.markRejected(
          toRejectedAchievementImportJobInput(
            claim,
            rejected.result,
            importJobAchievementType,
          ),
        );
        throw rejected;
      }

      await this.importJobRepository.markFailed({
        jobId: claim.jobId,
        runId: claim.runId,
        failureCode: "UNEXPECTED_EXCEPTION",
        failureStage: "TRANSACTION",
      });

      throw error instanceof Error
        ? error
        : new Error("Unknown achievement import apply error.");
    }
  }

  private async applyAchievementPlanWithoutJob(
    context: UserContext,
    plan: AchievementImportPlan,
  ): Promise<AchievementImportApplyResult> {
    try {
      const appliedRows = await this.executeAchievementApplyTransaction(context, plan);

      return buildSuccessfulApplyResult(plan, appliedRows);
    } catch (error) {
      if (error instanceof AchievementImportApplyRejectedError) {
        throw error;
      }

      if (this.repository.isPrismaUniqueConflict(error)) {
        throw new AchievementImportApplyRejectedError(
          "Achievement import apply encountered a uniqueness conflict.",
          buildRejectedApplyResult(plan, [
            toUniqueConflictApplyError(this.repository.getPrismaUniqueConflictTarget(error)),
          ]),
        );
      }

      throw error instanceof Error
        ? error
        : new Error("Unknown achievement import apply error.");
    }
  }

  private async executeAchievementApplyTransaction(
    context: UserContext,
    plan: AchievementImportPlan,
    claim?: AchievementImportJobClaimResult & { disposition: "RUNNER" },
  ): Promise<AchievementImportApplyRow[]> {
    const rowsToCreate = plan.resolvedRows;

    return this.prisma.$transaction(async (tx) => {
      const importClient = tx as AchievementImportApplyTransactionClient;
      const auditClient = tx as AuditTransactionClient;
      const importJobClient = tx as AchievementImportJobTransactionClient;

      const [
        departments,
        users,
        doiConflicts,
        applicationNoConflicts,
        patentNoConflicts,
        registrationNoConflicts,
      ] = await Promise.all([
        this.repository.findApplyDepartmentsByCodesInTransaction(
          importClient,
          collectDepartmentCodesFromResolvedRows(rowsToCreate),
        ),
        this.repository.findApplyUsersByEmailsInTransaction(
          importClient,
          collectEmailsFromResolvedRows(rowsToCreate),
        ),
        this.repository.findApplyPaperDoiConflictsInTransaction(
          importClient,
          collectDoiNormalizedFromResolvedRows(rowsToCreate),
        ),
        this.repository.findApplyPatentApplicationConflictsInTransaction(
          importClient,
          collectApplicationNoNormalizedFromResolvedRows(rowsToCreate),
        ),
        this.repository.findApplyPatentNoConflictsInTransaction(
          importClient,
          collectPatentNoNormalizedFromResolvedRows(rowsToCreate),
        ),
        this.repository.findApplySoftwareRegistrationConflictsInTransaction(
          importClient,
          collectRegistrationNoNormalizedFromResolvedRows(rowsToCreate),
        ),
      ]);

      const blockingErrors = toTransactionRecheckErrors(
        rowsToCreate,
        departments,
        users,
        [
          ...doiConflicts,
          ...applicationNoConflicts,
          ...patentNoConflicts,
          ...registrationNoConflicts,
        ],
      );
      if (blockingErrors.length > 0) {
        throw new AchievementImportApplyRejectedError(
          "Achievement import apply failed transaction-time revalidation.",
          buildRejectedApplyResult(plan, blockingErrors),
        );
      }

      const departmentByCode = new Map(departments.map((department) => [department.code, department]));
      const userByEmail = new Map(users.map((user) => [user.email, user]));
      const resultRows: AchievementImportApplyRow[] = [];
      const auditLogIds: string[] = [];

      for (const row of rowsToCreate) {
        const department = departmentByCode.get(row.parsed.departmentCode!);
        const owner = userByEmail.get(row.parsed.ownerEmail!);
        if (!department || !owner) {
          throw new Error("Achievement import apply invariant failed after revalidation.");
        }

        const contributors = toContributorInputs(row, userByEmail);
        const rowType = toApplySupportedType(row.parsed.type);
        const commonInput = {
          title: row.parsed.title!,
          secretLevel: row.parsed.secretLevel as SecretLevelCode,
          departmentId: department.id,
          ownerUserId: owner.id,
          createdById: context.userId,
          updatedById: context.userId,
          contributors,
        };
        const created =
          rowType === AchievementTypeCode.paper
            ? await this.repository.createPaperDraftInTransaction(importClient, {
                ...commonInput,
                type: AchievementTypeCode.paper,
                paperDetail: row.paperDetail,
              })
            : rowType === AchievementTypeCode.patent
              ? await this.repository.createPatentDraftInTransaction(importClient, {
                  ...commonInput,
                  type: AchievementTypeCode.patent,
                  patentDetail: row.patentDetail,
                })
              : await this.repository.createSoftwareCopyrightDraftInTransaction(
                  importClient,
                  {
                    ...commonInput,
                    type: AchievementTypeCode.softwareCopyright,
                    softwareCopyrightDetail: row.softwareCopyrightDetail,
                  },
                );

        assertCreatedAchievementIsExpectedDraft(created, rowType);

        const auditLog = await this.auditService.recordEventInTransaction(
          auditClient,
          toAchievementImportCreateAuditEvent(context, created, row, plan),
        );
        auditLogIds.push(auditLog.id);

        resultRows.push({
          rowNumber: row.rowNumber,
          status: "CREATED",
          createdAchievementId: created.id,
          type: rowType,
          achievementStatus: AchievementStatusCode.draft,
          departmentId: created.departmentId,
          ownerUserId: created.ownerUserId,
          contributorCount: created.contributors.length,
          auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
        });
      }

      if (claim) {
        await this.importJobRepository.markSucceededInTransaction(
          importJobClient,
          toSuccessfulAchievementImportJobInput(claim, plan, resultRows, auditLogIds),
        );
      }

      return resultRows;
    });
  }

  private async buildAchievementImportPlan(
    file: AchievementImportDryRunFile,
  ): Promise<AchievementImportPlan> {
    const csv = parseImportCsv(file.buffer, {
      maxRows,
      createError: (message) => new InvalidAchievementImportCsvError(message),
    });
    const rows = toWorkingRows(csv);
    applyColumnValidation(rows, csv.headers);
    applyRowValidation(rows);
    applyDuplicateValidation(rows);

    const [departments, users, conflicts] = await Promise.all([
      this.repository.findActiveDepartmentsByCodes(collectDepartmentCodes(rows)),
      this.repository.findUsersByEmails(collectEmails(rows)),
      this.repository.findNormalizedConflicts(collectNormalizedIdentifierInput(rows)),
    ]);

    const departmentByCode = new Map(departments.map((department) => [department.code, department]));
    const userByEmail = new Map(users.map((user) => [user.email, user]));
    const conflictKeys = toConflictKeySet(conflicts);

    applyReferenceValidation(rows, departmentByCode, userByEmail);
    applyDbConflictValidation(rows, conflictKeys);

    const resultRows = rows.map(toResultRow);

    return {
      file: buildImportDryRunFileMetadata(file, "achievements.csv"),
      columns: {
        required: [...requiredColumns],
        optional: [...optionalColumns],
        received: csv.headers.map(sanitizeHeaderForOutput),
      },
      summary: summarizeRows(resultRows),
      rows: resultRows,
      resolvedRows: rows.map(toResolvedPlanRow),
    };
  }
}

const assertPlanCanApply = (plan: AchievementImportPlan): void => {
  const blockingErrors = toApplyErrorSummaries(plan.rows);
  const supportedTypes = new Set<string>();
  const applyOnlyErrors = plan.rows.flatMap((row) => {
    const errors: AchievementImportApplyErrorSummary[] = [];

    if (row.status !== "VALID") {
      return errors;
    }

    if (row.candidateAction !== "CREATE_DRAFT") {
      errors.push({
        rowNumber: row.rowNumber,
        field: "candidateAction",
        code: "UNSUPPORTED_CANDIDATE_ACTION",
        message: "Apply supports only CREATE_DRAFT candidates.",
      });
    }

    if (isApplySupportedType(row.parsed.type)) {
      supportedTypes.add(row.parsed.type);
    } else {
      errors.push({
        rowNumber: row.rowNumber,
        field: "type",
        code: "UNSUPPORTED_TYPE",
        message: "Apply supports only PAPER, PATENT, or SOFTWARE_COPYRIGHT rows in this slice.",
      });
      return errors;
    }

    if (row.parsed.type === AchievementTypeCode.paper && !row.parsed.normalizedIdentifiers.doi) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "doi",
        code: "REQUIRED",
        message: "Apply requires a normalized DOI for PAPER rows.",
      });
    }

    if (
      row.parsed.type === AchievementTypeCode.softwareCopyright &&
      !row.parsed.normalizedIdentifiers.registrationNo
    ) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "registrationNo",
        code: "REQUIRED",
        message:
          "Apply requires a normalized software registration number for SOFTWARE_COPYRIGHT rows.",
      });
    }

    if (row.parsed.type === AchievementTypeCode.patent) {
      if (!row.parsed.normalizedIdentifiers.applicationNo) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "applicationNo",
          code: "REQUIRED",
          message: "Apply requires a normalized application number for PATENT rows.",
        });
      }
    }

    return errors;
  });
  const mixedTypeErrors =
    supportedTypes.size > 1
      ? [
          {
            rowNumber: null,
            field: "type",
            code: "MIXED_TYPE_BATCH",
            message:
              "Apply supports all-PAPER, all-PATENT, or all-SOFTWARE_COPYRIGHT rows in one batch.",
          },
        ]
      : [];

  if (
    blockingErrors.length > 0 ||
    applyOnlyErrors.length > 0 ||
    mixedTypeErrors.length > 0
  ) {
    throw new AchievementImportApplyRejectedError(
      "Achievement import apply requires one supported CREATE_DRAFT type with a durable identifier.",
      buildRejectedApplyResult(plan, [
        ...blockingErrors,
        ...applyOnlyErrors,
        ...mixedTypeErrors,
      ]),
    );
  }
};

const buildSuccessfulApplyResult = (
  plan: AchievementImportPlan,
  rows: AchievementImportApplyRow[],
): AchievementImportApplyResult => ({
  importType: achievementImportType,
  dryRun: false,
  mode: "CREATE_DRAFT_ONLY",
  file: plan.file,
  summary: {
    totalRows: plan.summary.totalRows,
    createdAchievementsCount: rows.length,
    createdPaperDetailsCount: rows.filter((row) => row.type === AchievementTypeCode.paper).length,
    createdPatentDetailsCount: rows.filter((row) => row.type === AchievementTypeCode.patent).length,
    createdSoftwareCopyrightDetailsCount: rows.filter(
      (row) => row.type === AchievementTypeCode.softwareCopyright,
    ).length,
    createdContributorsCount: rows.reduce(
      (count, row) => count + row.contributorCount,
      0,
    ),
    skippedRows: 0,
    failedRows: 0,
    errorCount: 0,
    warningCount: 0,
    auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
  },
  errors: [],
  rows,
});

const buildRejectedApplyResult = (
  plan: AchievementImportPlan,
  errors: AchievementImportApplyErrorSummary[],
): AchievementImportApplyResult => ({
  importType: achievementImportType,
  dryRun: false,
  mode: "CREATE_DRAFT_ONLY",
  file: plan.file,
  summary: {
    totalRows: plan.summary.totalRows,
    createdAchievementsCount: 0,
    createdPaperDetailsCount: 0,
    createdPatentDetailsCount: 0,
    createdSoftwareCopyrightDetailsCount: 0,
    createdContributorsCount: 0,
    skippedRows: plan.summary.warningRows,
    failedRows: plan.summary.errorRows || errors.length,
    errorCount: errors.length,
    warningCount: plan.summary.warningRows,
    auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
  },
  errors,
  rows: [],
});

type StoredAchievementImportSafeError = {
  rowNumber: number | null;
  field: string;
  code: string;
};

type ImportJobAchievementType =
  | typeof AchievementTypeCode.paper
  | typeof AchievementTypeCode.patent
  | typeof AchievementTypeCode.softwareCopyright;

type StoredAchievementImportSafeSummary = {
  importType: typeof achievementImportType;
  mode: AchievementImportApplyMode;
  achievementType: ImportJobAchievementType;
  operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT";
  totalRows: number;
  acceptedRowCount: number;
  createdAchievementsCount: number;
  createdPaperDetailsCount: number;
  createdPatentDetailsCount: number;
  createdSoftwareCopyrightDetailsCount: number;
  createdContributorsCount: number;
  auditCount: number;
  warningCount: number;
  errorCount: number;
  errors: StoredAchievementImportSafeError[];
};

const buildAchievementImportIdempotency = (
  context: UserContext,
  file: AchievementImportDryRunFile,
  achievementType: ImportJobAchievementType,
): Omit<AchievementImportJobClaimInput, "fileSizeBytes" | "operatorUserId"> => {
  const targetEnvironment = toSafeTargetEnvironment(process.env.NODE_ENV);
  const scopeType = "GLOBAL_OPERATOR_SCOPE";
  const scopeHash = sha256Hex(
    JSON.stringify({
      operatorUserId: context.userId,
      operatorDepartmentId: context.departmentId,
      scopeType,
    }),
  );
  const fileFingerprint = sha256Hex(file.buffer);
  const keyMaterial = {
    family: "ACHIEVEMENT",
    mode: "CREATE_DRAFT_ONLY",
    achievementType,
    fileFingerprint,
    targetEnvironment,
    scopeType,
    scopeHash,
  };

  return {
    achievementType: toPrismaImportJobAchievementType(achievementType),
    idempotencyKeyHash: sha256Hex(JSON.stringify(keyMaterial)),
    targetEnvironment,
    scopeType,
    scopeHash,
    fileFingerprint,
    requestFingerprint: sha256Hex(JSON.stringify(keyMaterial)),
  };
};

const toSafeTargetEnvironment = (value: string | undefined): string => {
  const normalized = (value || "development")
    .replace(/[^A-Za-z0-9_-]/g, "_")
    .slice(0, 64);

  return normalized || "development";
};

const sha256Hex = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const toExistingAchievementImportJobApplyResult = (
  file: AchievementImportDryRunFile,
  claim: AchievementImportJobExistingClaim,
): AchievementImportApplyResult => {
  const safeSummary = toStoredAchievementImportSafeSummary(claim.safeSummary);
  const baseSummary = safeSummary
    ? toApplySummaryFromStoredAchievementSafeSummary(safeSummary)
    : emptyApplySummary();
  const errors =
    claim.disposition === "REJECTED" && safeSummary
      ? safeSummary.errors.map(toStoredSafeErrorResult)
      : claim.disposition === "FAILED"
        ? [
            {
              rowNumber: null,
              field: "importJob",
              code: "IMPORT_JOB_FAILED",
              message: "Import job failed and automatic retry is not enabled.",
            },
          ]
        : [];

  return {
    importType: achievementImportType,
    dryRun: false,
    mode: "CREATE_DRAFT_ONLY",
    file: buildImportDryRunFileMetadata(file, "achievements.csv"),
    summary: baseSummary,
    errors,
    rows: [],
    job: {
      disposition:
        claim.disposition === "REPLAYED_SUCCESS"
          ? "REPLAYED_SUCCESS"
          : "IMPORT_IN_PROGRESS",
      jobId: claim.jobId,
      runId: claim.latestRunId,
    },
  };
};

const toSuccessfulAchievementImportJobInput = (
  claim: AchievementImportJobClaimResult & { disposition: "RUNNER" },
  plan: AchievementImportPlan,
  rows: readonly AchievementImportApplyRow[],
  auditLogIds: readonly string[],
) => {
  const achievementType = getImportJobAchievementType(plan);
  if (!achievementType) {
    throw new Error("Achievement import job invariant failed for unsupported type.");
  }

  const safeSummary: StoredAchievementImportSafeSummary = {
    importType: achievementImportType,
    mode: "CREATE_DRAFT_ONLY",
    achievementType,
    operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
    totalRows: plan.summary.totalRows,
    acceptedRowCount: plan.summary.createDraftCandidates,
    createdAchievementsCount: rows.length,
    createdPaperDetailsCount: rows.filter((row) => row.type === AchievementTypeCode.paper).length,
    createdPatentDetailsCount: rows.filter((row) => row.type === AchievementTypeCode.patent).length,
    createdSoftwareCopyrightDetailsCount: rows.filter(
      (row) => row.type === AchievementTypeCode.softwareCopyright,
    ).length,
    createdContributorsCount: rows.reduce(
      (count, row) => count + row.contributorCount,
      0,
    ),
    auditCount: auditLogIds.length,
    warningCount: 0,
    errorCount: 0,
    errors: [],
  };

  return {
    jobId: claim.jobId,
    runId: claim.runId,
    acceptedRowCount: safeSummary.acceptedRowCount,
    createdAchievementsCount: safeSummary.createdAchievementsCount,
    createdPaperDetailsCount: safeSummary.createdPaperDetailsCount,
    createdPatentDetailsCount: safeSummary.createdPatentDetailsCount,
    createdSoftwareCopyrightDetailsCount:
      safeSummary.createdSoftwareCopyrightDetailsCount,
    createdContributorsCount: safeSummary.createdContributorsCount,
    auditCount: safeSummary.auditCount,
    warningCount: safeSummary.warningCount,
    errorCount: safeSummary.errorCount,
    safeErrorCodes: [],
    safeSummary: safeSummary as unknown as Prisma.InputJsonValue,
    auditLogIds: [...auditLogIds],
  };
};

const toRejectedAchievementImportJobInput = (
  claim: AchievementImportJobClaimResult & { disposition: "RUNNER" },
  result: AchievementImportApplyResult,
  achievementType: ImportJobAchievementType,
) => {
  const safeErrors = result.errors.map(toStoredSafeError);
  const safeSummary: StoredAchievementImportSafeSummary = {
    importType: achievementImportType,
    mode: "CREATE_DRAFT_ONLY",
    achievementType,
    operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
    totalRows: result.summary.totalRows,
    acceptedRowCount: 0,
    createdAchievementsCount: 0,
    createdPaperDetailsCount: 0,
    createdPatentDetailsCount: 0,
    createdSoftwareCopyrightDetailsCount: 0,
    createdContributorsCount: 0,
    auditCount: 0,
    warningCount: result.summary.warningCount,
    errorCount: result.summary.errorCount,
    errors: safeErrors,
  };

  return {
    jobId: claim.jobId,
    runId: claim.runId,
    acceptedRowCount: 0,
    warningCount: result.summary.warningCount,
    errorCount: result.summary.errorCount,
    safeErrorCodes: [...new Set(safeErrors.map((error) => error.code))],
    safeSummary: safeSummary as unknown as Prisma.InputJsonValue,
  };
};

const withJobSummary = (
  result: AchievementImportApplyResult,
  job: AchievementImportApplyJobSummary,
): AchievementImportApplyResult => ({
  ...result,
  job,
});

const toStoredSafeError = (
  error: AchievementImportApplyErrorSummary,
): StoredAchievementImportSafeError => ({
  rowNumber: error.rowNumber,
  field: toSafeStoredErrorField(error.field),
  code: error.code,
});

const toSafeStoredErrorField = (field: string): string =>
  field === "nextFeeDate" || field === "feeAmount" ? "patentFeeBoundary" : field;

const toStoredSafeErrorResult = (
  error: StoredAchievementImportSafeError,
): AchievementImportApplyErrorSummary => ({
  ...error,
  message: `Stored achievement import rejection code: ${error.code}.`,
});

const toStoredAchievementImportSafeSummary = (
  value: Prisma.JsonValue | null,
): StoredAchievementImportSafeSummary | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const summary = value as Partial<StoredAchievementImportSafeSummary>;
  if (
    summary.importType !== achievementImportType ||
    summary.mode !== "CREATE_DRAFT_ONLY" ||
    !isImportJobAchievementType(summary.achievementType) ||
    summary.operation !== "ACHIEVEMENT_IMPORT_CREATE_DRAFT"
  ) {
    return null;
  }

  return {
    importType: achievementImportType,
    mode: "CREATE_DRAFT_ONLY",
    achievementType: summary.achievementType,
    operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
    totalRows: safeNumber(summary.totalRows),
    acceptedRowCount: safeNumber(summary.acceptedRowCount),
    createdAchievementsCount: safeNumber(summary.createdAchievementsCount),
    createdPaperDetailsCount: safeNumber(summary.createdPaperDetailsCount),
    createdPatentDetailsCount: safeNumber(summary.createdPatentDetailsCount),
    createdSoftwareCopyrightDetailsCount: safeNumber(
      summary.createdSoftwareCopyrightDetailsCount,
    ),
    createdContributorsCount: safeNumber(summary.createdContributorsCount),
    auditCount: safeNumber(summary.auditCount),
    warningCount: safeNumber(summary.warningCount),
    errorCount: safeNumber(summary.errorCount),
    errors: Array.isArray(summary.errors)
      ? summary.errors.map(toStoredSafeErrorFromJson)
      : [],
  };
};

const toStoredSafeErrorFromJson = (
  value: unknown,
): StoredAchievementImportSafeError => {
  const error =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<StoredAchievementImportSafeError>)
      : {};

  return {
    rowNumber:
      typeof error.rowNumber === "number" || error.rowNumber === null
        ? error.rowNumber
        : null,
    field: typeof error.field === "string" ? error.field : "importJob",
    code: typeof error.code === "string" ? error.code : "UNKNOWN",
  };
};

const toApplySummaryFromStoredAchievementSafeSummary = (
  summary: StoredAchievementImportSafeSummary,
): AchievementImportApplySummary => ({
  totalRows: summary.totalRows,
  createdAchievementsCount: summary.createdAchievementsCount,
  createdPaperDetailsCount: summary.createdPaperDetailsCount,
  createdPatentDetailsCount: summary.createdPatentDetailsCount,
  createdSoftwareCopyrightDetailsCount: summary.createdSoftwareCopyrightDetailsCount,
  createdContributorsCount: summary.createdContributorsCount,
  skippedRows: summary.warningCount,
  failedRows: summary.errorCount,
  errorCount: summary.errorCount,
  warningCount: summary.warningCount,
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
});

const emptyApplySummary = (): AchievementImportApplySummary => ({
  totalRows: 0,
  createdAchievementsCount: 0,
  createdPaperDetailsCount: 0,
  createdPatentDetailsCount: 0,
  createdSoftwareCopyrightDetailsCount: 0,
  createdContributorsCount: 0,
  skippedRows: 0,
  failedRows: 0,
  errorCount: 0,
  warningCount: 0,
  auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
});

const safeNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const getImportJobAchievementType = (
  plan: AchievementImportPlan,
): ImportJobAchievementType | null => {
  if (plan.rows.length === 0) {
    return null;
  }

  if (plan.rows.every((row) => row.parsed.type === AchievementTypeCode.paper)) {
    return AchievementTypeCode.paper;
  }

  if (plan.rows.every((row) => row.parsed.type === AchievementTypeCode.patent)) {
    return AchievementTypeCode.patent;
  }

  if (
    plan.rows.every(
      (row) => row.parsed.type === AchievementTypeCode.softwareCopyright,
    )
  ) {
    return AchievementTypeCode.softwareCopyright;
  }

  return null;
};

const isImportJobAchievementType = (
  value: unknown,
): value is ImportJobAchievementType =>
  value === AchievementTypeCode.paper ||
  value === AchievementTypeCode.patent ||
  value === AchievementTypeCode.softwareCopyright;

const toPrismaImportJobAchievementType = (
  achievementType: ImportJobAchievementType,
): "PAPER" | "PATENT" | "SOFTWARE_COPYRIGHT" =>
  achievementType === AchievementTypeCode.paper
    ? "PAPER"
    : achievementType === AchievementTypeCode.patent
      ? "PATENT"
    : "SOFTWARE_COPYRIGHT";

const toApplyErrorSummaries = (
  rows: readonly AchievementImportDryRunRow[],
): AchievementImportApplyErrorSummary[] =>
  rows.flatMap((row) => [
    ...row.errors.map((error) => ({
      rowNumber: row.rowNumber,
      field: error.field,
      code: error.code,
      message: error.message,
    })),
    ...row.warnings.map((warning) => ({
      rowNumber: row.rowNumber,
      field: warning.field,
      code: warning.code,
      message: warning.message,
    })),
  ]);

const toResolvedPlanRow = (row: WorkingRow): AchievementImportResolvedPlanRow => ({
  rowNumber: row.rowNumber,
  parsed: row.parsed,
  resolved: row.resolved,
  paperDetail: {
    doi: row.parsed.identifiers.doi,
    doiNormalized: row.parsed.normalizedIdentifiers.doi,
    journal: normalizeCell(row.valuesByHeader.get("journal")),
    issnCn: normalizeCell(row.valuesByHeader.get("issnCn")),
    publishYear: parseOptionalInteger(row.valuesByHeader.get("publishYear")),
    includedType: normalizeCell(row.valuesByHeader.get("includedType")),
    impactFactor: normalizeCell(row.valuesByHeader.get("impactFactor")),
    partition: normalizeCell(row.valuesByHeader.get("partition")),
    abstract: normalizeCell(row.valuesByHeader.get("abstract")),
  },
  patentDetail: {
    applicationNo: row.parsed.identifiers.applicationNo,
    applicationNoNormalized: row.parsed.normalizedIdentifiers.applicationNo,
    grantNo: row.parsed.identifiers.patentNo,
    grantNoNormalized: row.parsed.normalizedIdentifiers.patentNo,
    patentType: normalizeEnumCell(row.valuesByHeader.get("patentType")) as PatentTypeCode | null,
    filingDate: parseOptionalIsoDate(row.valuesByHeader.get("filingDate")),
    grantDate: parseOptionalIsoDate(row.valuesByHeader.get("grantDate")),
    legalStatus: normalizeEnumCell(row.valuesByHeader.get("legalStatus")) as PatentLegalStatusCode | null,
  },
  softwareCopyrightDetail: {
    registrationNo: row.parsed.identifiers.registrationNo,
    registrationNoNormalized: row.parsed.normalizedIdentifiers.registrationNo,
    softwareVersion: normalizeCell(row.valuesByHeader.get("softwareVersion")),
    softwareType: normalizeEnumCell(row.valuesByHeader.get("softwareType")) as SoftwareTypeCode | null,
    publishDate: parseOptionalIsoDate(row.valuesByHeader.get("publishDate")),
    registerDate: parseOptionalIsoDate(row.valuesByHeader.get("registerDate")),
    runEnv: normalizeCell(row.valuesByHeader.get("runEnv")),
  },
});

const toTransactionRecheckErrors = (
  rows: readonly AchievementImportResolvedPlanRow[],
  departments: readonly AchievementImportApplyDepartmentLookup[],
  users: readonly AchievementImportApplyUserLookup[],
  identifierConflicts: readonly AchievementImportNormalizedConflict[],
): AchievementImportApplyErrorSummary[] => {
  const errors: AchievementImportApplyErrorSummary[] = [];
  const departmentByCode = new Map(departments.map((department) => [department.code, department]));
  const userByEmail = new Map(users.map((user) => [user.email, user]));
  const conflictKeys = toConflictKeySet(identifierConflicts);

  for (const row of rows) {
    const department = row.parsed.departmentCode
      ? departmentByCode.get(row.parsed.departmentCode)
      : null;
    if (!isActiveApplyDepartment(department)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "departmentCode",
        code: "UNKNOWN_DEPARTMENT",
        message: "departmentCode was not found as active data during apply.",
      });
    }

    const owner = row.parsed.ownerEmail ? userByEmail.get(row.parsed.ownerEmail) : null;
    if (!isActiveApplyUser(owner)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "ownerEmail",
        code: "OWNER_NOT_FOUND",
        message: "ownerEmail was not found as active data during apply.",
      });
    } else if (department && owner.departmentId !== department.id) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "ownerEmail",
        code: "OWNER_DEPARTMENT_MISMATCH",
        message: "ownerEmail does not belong to the target department during apply.",
      });
    }

    for (const contributor of row.parsed.contributors) {
      if (!contributor.userEmail) {
        continue;
      }
      const user = userByEmail.get(contributor.userEmail);
      if (!isActiveApplyUser(user)) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "contributors",
          code: "CONTRIBUTOR_USER_NOT_FOUND",
          message: "Contributor userEmail was not found as active data during apply.",
        });
      }
    }

    if (row.parsed.type === AchievementTypeCode.paper) {
      const normalizedDoi = row.parsed.normalizedIdentifiers.doi;
      if (!normalizedDoi) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "doi",
          code: "REQUIRED",
          message: "Apply requires a normalized DOI for PAPER rows.",
        });
      } else if (conflictKeys.has(toConflictKey("doi", normalizedDoi))) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "doi",
          code: "DB_CONFLICT",
          message: "doi already exists and cannot be imported as a new draft.",
        });
      }
    }

    if (row.parsed.type === AchievementTypeCode.softwareCopyright) {
      const normalizedRegistrationNo = row.parsed.normalizedIdentifiers.registrationNo;
      if (!normalizedRegistrationNo) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "registrationNo",
          code: "REQUIRED",
          message:
            "Apply requires a normalized software registration number for SOFTWARE_COPYRIGHT rows.",
        });
      } else if (conflictKeys.has(toConflictKey("registrationNo", normalizedRegistrationNo))) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "registrationNo",
          code: "DB_CONFLICT",
          message:
            "registrationNo already exists and cannot be imported as a new draft.",
        });
      }
    }

    if (row.parsed.type === AchievementTypeCode.patent) {
      const normalizedApplicationNo = row.parsed.normalizedIdentifiers.applicationNo;
      const normalizedPatentNo = row.parsed.normalizedIdentifiers.patentNo;
      if (!normalizedApplicationNo) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "applicationNo",
          code: "REQUIRED",
          message: "Apply requires a normalized application number for PATENT rows.",
        });
      } else if (conflictKeys.has(toConflictKey("applicationNo", normalizedApplicationNo))) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "applicationNo",
          code: "DB_CONFLICT",
          message:
            "applicationNo already exists and cannot be imported as a new draft.",
        });
      }

      if (normalizedPatentNo && conflictKeys.has(toConflictKey("patentNo", normalizedPatentNo))) {
        errors.push({
          rowNumber: row.rowNumber,
          field: "patentNo",
          code: "DB_CONFLICT",
          message: "patentNo already exists and cannot be imported as a new draft.",
        });
      }
    }

    if (!isApplySupportedType(row.parsed.type)) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "type",
        code: "UNSUPPORTED_TYPE",
        message: "Apply supports only PAPER, PATENT, or SOFTWARE_COPYRIGHT rows in this slice.",
      });
    }

    if (row.parsed.status !== AchievementStatusCode.draft) {
      errors.push({
        rowNumber: row.rowNumber,
        field: "status",
        code: "UNSUPPORTED_STATUS",
        message: "Apply supports only DRAFT rows.",
      });
    }
  }

  return errors;
};

const toContributorInputs = (
  row: AchievementImportResolvedPlanRow,
  userByEmail: ReadonlyMap<string, AchievementImportApplyUserLookup>,
): CreateAchievementContributorDraftInput[] =>
  row.parsed.contributors.map((contributor) => ({
    name: contributor.name!,
    userId: contributor.userEmail ? userByEmail.get(contributor.userEmail)?.id ?? null : null,
    organization: contributor.organization,
    contributorType: contributor.contributorType as ContributorTypeCode,
    contributorRole: contributor.contributorRole as ContributorRoleCode | null,
    sortOrder: contributor.sortOrder,
  }));

const assertCreatedAchievementIsExpectedDraft = (
  achievement: AchievementImportCreatedDraft,
  expectedType: string | null,
): void => {
  const hasExpectedDetail =
    expectedType === AchievementTypeCode.paper
      ? Boolean(achievement.paperDetail)
      : expectedType === AchievementTypeCode.patent
        ? Boolean(achievement.patentDetail)
      : expectedType === AchievementTypeCode.softwareCopyright
        ? Boolean(achievement.softwareCopyrightDetail)
        : false;

  if (
    achievement.type !== expectedType ||
    achievement.status !== AchievementStatusCode.draft ||
    !hasExpectedDetail ||
    achievement.secretLevel === null
  ) {
    throw new Error("Achievement import created a record outside the draft boundary.");
  }
};

const toAchievementImportCreateAuditEvent = (
  context: UserContext,
  achievement: AchievementImportCreatedDraft,
  row: AchievementImportResolvedPlanRow,
  plan: AchievementImportPlan,
): CreateAuditEventInput => ({
  actor: {
    userId: context.userId,
    departmentId: context.departmentId,
  },
  action: AuditActionCode.create,
  target: {
    type: AuditTargetTypeCode.achievement,
    id: achievement.id,
    departmentId: achievement.departmentId,
    secretLevel: achievement.secretLevel as SecretLevelCode,
  },
  oldValue: null,
  newValue: {
    operation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
    importType: achievementImportType,
    mode: "CREATE_DRAFT_ONLY",
    rowNumber: row.rowNumber,
    achievementId: achievement.id,
    type: row.parsed.type,
    status: AchievementStatusCode.draft,
    departmentId: achievement.departmentId,
    ownerUserId: achievement.ownerUserId,
    contributorCount: achievement.contributors.length,
    identifierFieldsPresent:
      row.parsed.type === AchievementTypeCode.paper
        ? ["doi"]
        : row.parsed.type === AchievementTypeCode.patent
          ? [
              "applicationNo",
              ...(row.parsed.normalizedIdentifiers.patentNo ? ["grantNo"] : []),
            ]
          : ["registrationNo"],
    totalRows: plan.summary.totalRows,
    createdAchievementsCount: plan.summary.createDraftCandidates,
  },
});

const toUniqueConflictApplyError = (
  target: readonly string[],
): AchievementImportApplyErrorSummary => {
  const normalizedTargets = target.map((field) =>
    field.replace(/[^a-z0-9]/gi, "").toLowerCase(),
  );

  if (normalizedTargets.some((field) => field.includes("doinormalized"))) {
    return {
      rowNumber: null,
      field: "doi",
      code: "DB_CONFLICT",
      message: "doi already exists and cannot be imported as a new draft.",
    };
  }

  if (
    normalizedTargets.some((field) =>
      field.includes("registrationnonormalized"),
    )
  ) {
    return {
      rowNumber: null,
      field: "registrationNo",
      code: "DB_CONFLICT",
      message: "registrationNo already exists and cannot be imported as a new draft.",
    };
  }

  if (normalizedTargets.some((field) => field.includes("applicationnonormalized"))) {
    return {
      rowNumber: null,
      field: "applicationNo",
      code: "DB_CONFLICT",
      message: "applicationNo already exists and cannot be imported as a new draft.",
    };
  }

  if (normalizedTargets.some((field) => field.includes("grantnonormalized"))) {
    return {
      rowNumber: null,
      field: "patentNo",
      code: "DB_CONFLICT",
      message: "patentNo already exists and cannot be imported as a new draft.",
    };
  }

  return {
    rowNumber: null,
    field: "identifier",
    code: "DB_CONFLICT",
    message: "Achievement identifier already exists.",
  };
};

const collectDepartmentCodesFromResolvedRows = (
  rows: readonly AchievementImportResolvedPlanRow[],
): string[] =>
  [...new Set(rows.map((row) => row.parsed.departmentCode).filter((code): code is string => Boolean(code)))];

const collectEmailsFromResolvedRows = (
  rows: readonly AchievementImportResolvedPlanRow[],
): string[] => {
  const emails: string[] = [];
  for (const row of rows) {
    if (row.parsed.ownerEmail) {
      emails.push(row.parsed.ownerEmail);
    }
    for (const contributor of row.parsed.contributors) {
      if (contributor.userEmail) {
        emails.push(contributor.userEmail);
      }
    }
  }
  return [...new Set(emails)];
};

const collectDoiNormalizedFromResolvedRows = (
  rows: readonly AchievementImportResolvedPlanRow[],
): string[] =>
  [
    ...new Set(
      rows
        .map((row) => row.parsed.normalizedIdentifiers.doi)
        .filter((doi): doi is string => Boolean(doi)),
    ),
  ];

const collectApplicationNoNormalizedFromResolvedRows = (
  rows: readonly AchievementImportResolvedPlanRow[],
): string[] =>
  [
    ...new Set(
      rows
        .map((row) => row.parsed.normalizedIdentifiers.applicationNo)
        .filter((applicationNo): applicationNo is string => Boolean(applicationNo)),
    ),
  ];

const collectPatentNoNormalizedFromResolvedRows = (
  rows: readonly AchievementImportResolvedPlanRow[],
): string[] =>
  [
    ...new Set(
      rows
        .map((row) => row.parsed.normalizedIdentifiers.patentNo)
        .filter((patentNo): patentNo is string => Boolean(patentNo)),
    ),
  ];

const collectRegistrationNoNormalizedFromResolvedRows = (
  rows: readonly AchievementImportResolvedPlanRow[],
): string[] =>
  [
    ...new Set(
      rows
        .map((row) => row.parsed.normalizedIdentifiers.registrationNo)
        .filter((registrationNo): registrationNo is string => Boolean(registrationNo)),
    ),
  ];

const isApplySupportedType = (
  type: string | null,
): type is
  | typeof AchievementTypeCode.paper
  | typeof AchievementTypeCode.patent
  | typeof AchievementTypeCode.softwareCopyright =>
  type === AchievementTypeCode.paper ||
  type === AchievementTypeCode.patent ||
  type === AchievementTypeCode.softwareCopyright;

const toApplySupportedType = (
  type: string | null,
):
  | typeof AchievementTypeCode.paper
  | typeof AchievementTypeCode.patent
  | typeof AchievementTypeCode.softwareCopyright => {
  if (isApplySupportedType(type)) {
    return type;
  }

  throw new Error("Achievement import apply invariant failed for unsupported type.");
};

const isActiveApplyDepartment = (
  department: AchievementImportApplyDepartmentLookup | null | undefined,
): department is AchievementImportApplyDepartmentLookup =>
  Boolean(
    department &&
      department.status === DepartmentStatus.ACTIVE &&
      department.archivedAt === null,
  );

const isActiveApplyUser = (
  user: AchievementImportApplyUserLookup | null | undefined,
): user is AchievementImportApplyUserLookup =>
  Boolean(user && user.status === UserStatus.ACTIVE && user.archivedAt === null);

const parseOptionalInteger = (value: string | undefined): number | null => {
  const normalized = normalizeCell(value);
  return normalized ? Number(normalized) : null;
};

const toWorkingRows = (csv: ImportCsvParseResult): WorkingRow[] =>
  csv.records.map((record) => {
    const valuesByHeader = buildValuesByHeader(csv.headers, record.values);

    const doi = normalizeCell(getCell(valuesByHeader, "doi") ?? getCell(valuesByHeader, "DOI"));
    const patentNo = normalizeCell(
      getCell(valuesByHeader, "patentNo") ?? getCell(valuesByHeader, "grantNo"),
    );
    const registrationNo = normalizeCell(
      getCell(valuesByHeader, "softwareRegistrationNo") ??
        getCell(valuesByHeader, "registrationNo"),
    );

    return {
      rowNumber: record.rowNumber,
      valuesByHeader,
      parsed: {
        type: normalizeEnumCell(valuesByHeader.get("type")),
        title: normalizeCell(valuesByHeader.get("title")),
        ownerEmail: normalizeEmailCell(valuesByHeader.get("ownerEmail")),
        ownerEmployeeNo: normalizeCell(valuesByHeader.get("ownerEmployeeNo")),
        departmentCode: normalizeCell(valuesByHeader.get("departmentCode")),
        secretLevel: normalizeEnumCell(valuesByHeader.get("secretLevel")) ?? defaultSecretLevel,
        status: normalizeEnumCell(valuesByHeader.get("status")) ?? defaultStatus,
        contributors: parseContributors(valuesByHeader.get("contributors")),
        identifiers: {
          doi,
          applicationNo: normalizeCell(valuesByHeader.get("applicationNo")),
          patentNo,
          registrationNo,
        },
        normalizedIdentifiers: {
          doi: normalizeDoi(doi),
          applicationNo: normalizePatentApplicationNo(valuesByHeader.get("applicationNo")),
          patentNo: normalizePatentGrantNo(patentNo),
          registrationNo: normalizeSoftwareRegistrationNo(registrationNo),
        },
      },
      resolved: {
        departmentId: null,
        ownerUserId: null,
      },
      errors: [],
      warnings: [],
    };
  });

const applyColumnValidation = (
  rows: WorkingRow[],
  headers: readonly string[],
): void =>
  appendColumnValidationIssues(rows, headers, {
    allowedColumns,
    requiredColumns,
    isForbiddenColumn,
    unknownCode: "UNKNOWN_COLUMN",
    forbiddenCode: "FORBIDDEN_SENSITIVE_COLUMN",
    requiredCode: "REQUIRED",
    forbiddenMessage:
      "Sensitive, raw payload, storage, workflow, fee, and direct id columns are not supported.",
  });

const applyRowValidation = (rows: WorkingRow[]): void => {
  for (const row of rows) {
    validateFormulaLikeValues(row);
    validateCommonFields(row);
    validateTypeSpecificFields(row);
    validateContributors(row);
  }
};

const validateFormulaLikeValues = (row: WorkingRow): void => {
  for (const field of allowedColumns) {
    const value = normalizeCell(row.valuesByHeader.get(field));
    if (isFormulaLikeCell(value)) {
      row.errors.push({
        field,
        code: "FORMULA_LIKE_VALUE",
        message: "Formula-like cell values are not allowed.",
      });
    }
  }
};

const validateCommonFields = (row: WorkingRow): void => {
  validateRequiredEnum(row, "type", row.parsed.type, allowedAchievementTypes);
  validateRequiredText(row, "title", row.parsed.title, 500);
  validateRequiredCode(row, "departmentCode", row.parsed.departmentCode, departmentCodePattern);

  if (!row.parsed.ownerEmail && !row.parsed.ownerEmployeeNo) {
    row.errors.push({
      field: "ownerEmail",
      code: "REQUIRED",
      message: "ownerEmail is required unless a supported ownerEmployeeNo lookup exists.",
    });
  }

  if (row.parsed.ownerEmail && !isValidEmail(row.parsed.ownerEmail)) {
    row.errors.push({
      field: "ownerEmail",
      code: "INVALID_FORMAT",
      message: "ownerEmail must be a valid address.",
    });
  }

  if (row.parsed.ownerEmployeeNo) {
    row.errors.push({
      field: "ownerEmployeeNo",
      code: "OWNER_EMPLOYEE_NO_LOOKUP_NOT_AVAILABLE",
      message: "ownerEmployeeNo lookup is not available in the current schema.",
    });
  }

  if (!row.parsed.secretLevel || !allowedSecretLevels.has(row.parsed.secretLevel)) {
    row.errors.push({
      field: "secretLevel",
      code: "INVALID_ENUM",
      message: "secretLevel must be a supported secret level.",
    });
  }

  if (!row.parsed.status || !allowedAchievementStatuses.has(row.parsed.status)) {
    row.errors.push({
      field: "status",
      code: "INVALID_ENUM",
      message: "status is not supported.",
    });
    return;
  }

  if (row.parsed.status !== AchievementStatusCode.draft) {
    row.errors.push({
      field: "status",
      code: "UNSUPPORTED_STATUS",
      message: "Only DRAFT status is supported by achievement import dry-run.",
    });
  }
};

const validateTypeSpecificFields = (row: WorkingRow): void => {
  const type = row.parsed.type;
  validateDetailFieldMismatch(row);

  if (type === AchievementTypeCode.paper) {
    validateIntegerRange(row, "publishYear", 1900, 2100);
    validateDecimal(row, "impactFactor", 3);
  }

  if (type === AchievementTypeCode.patent) {
    validateOptionalEnum(row, "patentType", allowedPatentTypes);
    validateOptionalEnum(row, "legalStatus", allowedPatentLegalStatuses);
    validateDate(row, "filingDate");
    validateDate(row, "grantDate");
    validateDate(row, "nextFeeDate");
    validateDecimal(row, "feeAmount", 2);
  }

  if (type === AchievementTypeCode.softwareCopyright) {
    validateOptionalEnum(row, "softwareType", allowedSoftwareTypes);
    validateDate(row, "publishDate");
    validateDate(row, "registerDate");
  }
};

const validateDetailFieldMismatch = (row: WorkingRow): void => {
  const type = row.parsed.type;
  if (!type || !allowedAchievementTypes.has(type)) {
    return;
  }

  const allowedForType =
    type === AchievementTypeCode.paper
      ? paperFields
      : type === AchievementTypeCode.patent
        ? patentFields
        : softwareFields;

  for (const field of [...paperFields, ...patentFields, ...softwareFields]) {
    if (!allowedForType.has(field) && normalizeCell(row.valuesByHeader.get(field))) {
      row.errors.push({
        field,
        code: "DETAIL_TYPE_MISMATCH",
        message: "Detail field does not match achievement type.",
      });
    }
  }
};

const validateContributors = (row: WorkingRow): void => {
  if (row.parsed.contributors.length === 0) {
    row.errors.push({
      field: "contributors",
      code: "REQUIRED",
      message: "At least one contributor is required.",
    });
    return;
  }

  const expectedType = expectedContributorType(row.parsed.type);
  for (const contributor of row.parsed.contributors) {
    if (!contributor.name || !contributor.contributorType) {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_FORMAT_INVALID",
        message: "Contributor entries must include name and contributorType.",
      });
    }

    if (contributor.organization === "__INVALID_EXTRA_SEGMENT__") {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_FORMAT_INVALID",
        message: "Contributor entries must use name|contributorType|contributorRole|userEmail|organization.",
      });
    }

    if (
      contributor.contributorType &&
      !allowedContributorTypes.has(contributor.contributorType)
    ) {
      row.errors.push({
        field: "contributors",
        code: "INVALID_ENUM",
        message: "Contributor type is not supported.",
      });
    }

    if (
      contributor.contributorRole &&
      !allowedContributorRoles.has(contributor.contributorRole)
    ) {
      row.errors.push({
        field: "contributors",
        code: "INVALID_ENUM",
        message: "Contributor role is not supported.",
      });
    }

    if (contributor.userEmail && !isValidEmail(contributor.userEmail)) {
      row.errors.push({
        field: "contributors",
        code: "INVALID_FORMAT",
        message: "Contributor userEmail must be a valid address.",
      });
    }

    if (
      expectedType &&
      contributor.contributorType &&
      allowedContributorTypes.has(contributor.contributorType) &&
      contributor.contributorType !== expectedType
    ) {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_TYPE_MISMATCH",
        message: "Contributor type does not match achievement type.",
      });
    }
  }
};

const validateRequiredEnum = (
  row: WorkingRow,
  field: "type",
  value: string | null,
  allowed: ReadonlySet<string>,
): void => {
  if (!value) {
    row.errors.push({
      field,
      code: "REQUIRED",
      message: `${field} is required.`,
    });
    return;
  }

  if (!allowed.has(value)) {
    row.errors.push({
      field,
      code: "INVALID_ENUM",
      message: `${field} is not supported.`,
    });
  }
};

const validateRequiredText = (
  row: WorkingRow,
  field: "title",
  value: string | null,
  maxLength: number,
): void => {
  if (!value) {
    row.errors.push({
      field,
      code: "REQUIRED",
      message: `${field} is required.`,
    });
    return;
  }

  if (value.length > maxLength) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} is too long.`,
    });
  }
};

const validateRequiredCode = (
  row: WorkingRow,
  field: "departmentCode",
  value: string | null,
  pattern: RegExp,
): void => {
  if (!value) {
    row.errors.push({
      field,
      code: "REQUIRED",
      message: `${field} is required.`,
    });
    return;
  }

  if (value.length > 64 || !pattern.test(value)) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} must use uppercase letters, numbers, or underscore.`,
    });
  }
};

const validateOptionalEnum = (
  row: WorkingRow,
  field: string,
  allowed: ReadonlySet<string>,
): void => {
  const value = normalizeEnumCell(row.valuesByHeader.get(field));
  if (value && !allowed.has(value)) {
    row.errors.push({
      field,
      code: "INVALID_ENUM",
      message: `${field} is not supported.`,
    });
  }
};

const validateDate = (row: WorkingRow, field: string): void => {
  const value = normalizeCell(row.valuesByHeader.get(field));
  if (value && !isoDatePattern.test(value)) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} must be an ISO date string.`,
    });
  }
};

const parseOptionalIsoDate = (value: string | undefined): Date | null => {
  const normalized = normalizeCell(value);
  return normalized ? new Date(`${normalized}T00:00:00.000Z`) : null;
};

const validateIntegerRange = (
  row: WorkingRow,
  field: string,
  min: number,
  max: number,
): void => {
  const value = normalizeCell(row.valuesByHeader.get(field));
  if (!value) {
    return;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} is outside the supported range.`,
    });
  }
};

const validateDecimal = (row: WorkingRow, field: string, maxDecimalPlaces: number): void => {
  const value = normalizeCell(row.valuesByHeader.get(field));
  if (!value) {
    return;
  }

  const parsed = Number(value);
  const decimals = value.includes(".") ? value.split(".")[1]!.length : 0;
  if (!Number.isFinite(parsed) || parsed < 0 || decimals > maxDecimalPlaces) {
    row.errors.push({
      field,
      code: "INVALID_FORMAT",
      message: `${field} must be a nonnegative decimal with supported precision.`,
    });
  }
};

const applyDuplicateValidation = (rows: WorkingRow[]): void => {
  const countsByField = new Map<string, Map<string, number>>();
  for (const field of ["doi", "applicationNo", "patentNo", "registrationNo"] as const) {
    countsByField.set(field, new Map<string, number>());
  }

  for (const row of rows) {
    for (const [field, value] of Object.entries(row.parsed.normalizedIdentifiers)) {
      if (!value) {
        continue;
      }
      const counts = countsByField.get(field)!;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  for (const row of rows) {
    for (const [field, value] of Object.entries(row.parsed.normalizedIdentifiers)) {
      if (value && (countsByField.get(field)?.get(value) ?? 0) > 1) {
        row.errors.push({
          field,
          code: "DUPLICATE_IN_FILE",
          message: `${field} is duplicated in this file.`,
        });
      }
    }
  }
};

const applyReferenceValidation = (
  rows: WorkingRow[],
  departmentByCode: ReadonlyMap<string, AchievementImportDepartmentLookup>,
  userByEmail: ReadonlyMap<string, AchievementImportUserLookup>,
): void => {
  for (const row of rows) {
    const department = row.parsed.departmentCode
      ? departmentByCode.get(row.parsed.departmentCode)
      : null;
    if (row.parsed.departmentCode && isValidDepartmentCode(row.parsed.departmentCode) && !department) {
      row.errors.push({
        field: "departmentCode",
        code: "UNKNOWN_DEPARTMENT",
        message: "departmentCode was not found as an active department.",
      });
    }
    row.resolved.departmentId = department?.id ?? null;

    validateOwner(row, userByEmail);
    validateContributorUsers(row, userByEmail);
  }
};

const validateOwner = (
  row: WorkingRow,
  userByEmail: ReadonlyMap<string, AchievementImportUserLookup>,
): void => {
  if (!row.parsed.ownerEmail || !isValidEmail(row.parsed.ownerEmail)) {
    return;
  }

  const owner = userByEmail.get(row.parsed.ownerEmail);
  if (!isActiveUser(owner)) {
    row.errors.push({
      field: "ownerEmail",
      code: "OWNER_NOT_FOUND",
      message: "ownerEmail was not found as an active user.",
    });
    return;
  }

  row.resolved.ownerUserId = owner.id;

  if (row.resolved.departmentId && owner.departmentId !== row.resolved.departmentId) {
    row.errors.push({
      field: "ownerEmail",
      code: "OWNER_DEPARTMENT_MISMATCH",
      message: "ownerEmail does not belong to the target department.",
    });
  }
};

const validateContributorUsers = (
  row: WorkingRow,
  userByEmail: ReadonlyMap<string, AchievementImportUserLookup>,
): void => {
  for (const contributor of row.parsed.contributors) {
    if (!contributor.userEmail || !isValidEmail(contributor.userEmail)) {
      continue;
    }

    if (!isActiveUser(userByEmail.get(contributor.userEmail))) {
      row.errors.push({
        field: "contributors",
        code: "CONTRIBUTOR_USER_NOT_FOUND",
        message: "Contributor userEmail was not found as an active user.",
      });
    }
  }
};

const applyDbConflictValidation = (
  rows: WorkingRow[],
  conflictKeys: ReadonlySet<string>,
): void => {
  for (const row of rows) {
    for (const [field, value] of Object.entries(row.parsed.normalizedIdentifiers)) {
      if (value && conflictKeys.has(toConflictKey(field, value))) {
        row.warnings.push({
          field,
          code: "DB_CONFLICT",
          message: `${field} already exists and requires review before real import.`,
        });
      }
    }
  }
};

const toResultRow = (row: WorkingRow): AchievementImportDryRunRow => {
  if (row.errors.length > 0) {
    return {
      rowNumber: row.rowNumber,
      parsed: row.parsed,
      status: "ERROR",
      candidateAction: "SKIP",
      errors: row.errors,
      warnings: row.warnings,
    };
  }

  if (row.warnings.length > 0) {
    return {
      rowNumber: row.rowNumber,
      parsed: row.parsed,
      status: "WARNING",
      candidateAction: "CREATE_DRAFT",
      errors: row.errors,
      warnings: row.warnings,
    };
  }

  return {
    rowNumber: row.rowNumber,
    parsed: row.parsed,
    status: "VALID",
    candidateAction: "CREATE_DRAFT",
    errors: row.errors,
    warnings: row.warnings,
  };
};

const summarizeRows = (rows: readonly AchievementImportDryRunRow[]) => ({
  ...summarizeImportDryRunRows(rows),
  createDraftCandidates: rows.filter((row) => row.candidateAction === "CREATE_DRAFT").length,
  duplicateIdentifierRows: rows.filter((row) =>
    row.errors.some((error) => error.code === "DUPLICATE_IN_FILE"),
  ).length,
  dbConflictRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "DB_CONFLICT"),
  ).length,
  ownerEmployeeNoLookup: "NOT_AVAILABLE" as const,
});

const parseContributors = (
  value: string | undefined,
): AchievementImportContributorPreview[] => {
  const normalized = normalizeCell(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const [name, contributorType, contributorRole, userEmail, organization, extra] =
        entry.split("|").map((part) => part.trim());
      return {
        name: name || null,
        contributorType: normalizeEnumValue(contributorType),
        contributorRole: normalizeEnumValue(contributorRole),
        userEmail: normalizeEmailCell(userEmail),
        organization: organization || (extra ? "__INVALID_EXTRA_SEGMENT__" : null),
        sortOrder: index + 1,
      };
    });
};

const collectDepartmentCodes = (rows: readonly WorkingRow[]): string[] =>
  [...new Set(rows.map((row) => row.parsed.departmentCode).filter((code): code is string => Boolean(code)))];

const collectEmails = (rows: readonly WorkingRow[]): string[] => {
  const emails: string[] = [];
  for (const row of rows) {
    if (row.parsed.ownerEmail) {
      emails.push(row.parsed.ownerEmail);
    }
    for (const contributor of row.parsed.contributors) {
      if (contributor.userEmail) {
        emails.push(contributor.userEmail);
      }
    }
  }
  return [...new Set(emails)];
};

const collectNormalizedIdentifierInput = (rows: readonly WorkingRow[]) => ({
  doiNormalizedValues: collectNormalizedValues(rows, "doi"),
  applicationNoNormalizedValues: collectNormalizedValues(rows, "applicationNo"),
  patentNoNormalizedValues: collectNormalizedValues(rows, "patentNo"),
  registrationNoNormalizedValues: collectNormalizedValues(rows, "registrationNo"),
});

const collectNormalizedValues = (
  rows: readonly WorkingRow[],
  field: keyof AchievementImportDryRunParsedRow["normalizedIdentifiers"],
): string[] =>
  [
    ...new Set(
      rows
        .map((row) => row.parsed.normalizedIdentifiers[field])
        .filter((value): value is string => Boolean(value)),
    ),
  ];

const toConflictKeySet = (
  conflicts: readonly AchievementImportNormalizedConflict[],
): Set<string> => {
  const keys = new Set<string>();
  for (const conflict of conflicts) {
    keys.add(toConflictKey(conflict.field, conflict.normalizedValue));
    if (conflict.field === "grantNo") {
      keys.add(toConflictKey("patentNo", conflict.normalizedValue));
    }
  }
  return keys;
};

const toConflictKey = (field: string, normalizedValue: string): string =>
  `${field}:${normalizedValue}`;

const expectedContributorType = (type: string | null): string | null => {
  if (type === AchievementTypeCode.paper) {
    return ContributorTypeCode.author;
  }
  if (type === AchievementTypeCode.patent) {
    return ContributorTypeCode.inventor;
  }
  if (type === AchievementTypeCode.softwareCopyright) {
    return ContributorTypeCode.copyrightOwner;
  }
  return null;
};

const isActiveUser = (user: AchievementImportUserLookup | undefined): user is AchievementImportUserLookup =>
  Boolean(user && user.status === UserStatus.ACTIVE && user.archivedAt === null);

const isValidDepartmentCode = (code: string): boolean =>
  code.length <= 64 && departmentCodePattern.test(code);

const isValidEmail = (email: string): boolean =>
  email.length <= 255 && emailPattern.test(email);

const getCell = (
  valuesByHeader: ReadonlyMap<string, string>,
  field: string,
): string | undefined => valuesByHeader.get(field);

const normalizeCell = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const normalizeEmailCell = (value: string | undefined): string | null => {
  const normalized = normalizeCell(value);
  return normalized ? normalized.toLowerCase() : null;
};

const normalizeEnumCell = (value: string | undefined): string | null => {
  const normalized = normalizeCell(value);
  return normalized ? normalized.toUpperCase() : null;
};

const normalizeEnumValue = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized.toUpperCase() : null;
};

const isForbiddenColumn = (header: string): boolean => {
  const normalized = normalizeImportHeaderToken(header);
  return sensitiveColumns.has(normalized) || forbiddenColumns.has(normalized);
};

const sanitizeHeaderForOutput = (header: string): string =>
  isForbiddenColumn(header) ? "(sensitive)" : header;
