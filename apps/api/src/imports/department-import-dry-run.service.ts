import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DepartmentStatus } from "@prisma/client";
import { AuditTransactionClient } from "../audit/audit.repository";
import { AuditService } from "../audit/audit.service";
import { AuditActionCode } from "../audit/domain/audit-action-code";
import { CreateAuditEventInput } from "../audit/domain/audit-event.types";
import { AuditTargetTypeCode } from "../audit/domain/audit-target-type-code";
import { PrismaService } from "../database/prisma.service";
import { UserContext } from "../identity/user-context";
import {
  DepartmentCodeLookup,
  DepartmentImportApplyDepartmentLookup,
  DepartmentImportApplyTransactionClient,
  DepartmentImportCreatedDepartment,
  DepartmentImportDryRunRepository,
} from "./department-import-dry-run.repository";
import {
  DepartmentImportJobClaimInput,
  DepartmentImportJobExistingClaim,
  DepartmentImportJobClaimResult,
  DepartmentImportJobRepository,
  DepartmentImportJobTransactionClient,
} from "./department-import-job.repository";
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
  parseImportCsv,
  summarizeImportDryRunRows,
} from "./import-dry-run.shared";

export const departmentImportType = "DEPARTMENT_METADATA" as const;

const requiredColumns = ["code", "name"] as const;
const optionalColumns = ["parentCode"] as const;
const allowedColumns = new Set<string>([...requiredColumns, ...optionalColumns]);
const departmentCodePattern = /^[A-Z0-9_]+$/;
const maxRows = 500;

export type DepartmentImportDryRunFile = ImportDryRunFile;

export type DepartmentImportDryRunIssueCode =
  | "REQUIRED"
  | "INVALID_FORMAT"
  | "DUPLICATE_IN_FILE"
  | "UNKNOWN_PARENT"
  | "PARENT_CYCLE"
  | "EXISTING_CODE"
  | "UNKNOWN_COLUMN"
  | "FORMULA_LIKE_VALUE";

export type DepartmentImportDryRunIssue = ImportDryRunIssue<DepartmentImportDryRunIssueCode>;

export type DepartmentImportDryRunRowStatus = ImportDryRunStatus;
export type DepartmentImportDryRunCandidateAction =
  | "CREATE"
  | "REVIEW_EXISTING"
  | "SKIP";

export type DepartmentImportDryRunParsedRow = {
  code: string | null;
  name: string | null;
  parentCode: string | null;
};

export type DepartmentImportDryRunRow = ImportDryRunRow<
  DepartmentImportDryRunParsedRow,
  DepartmentImportDryRunCandidateAction,
  DepartmentImportDryRunIssue
>;

export type DepartmentImportDryRunSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  createCandidates: number;
  existingCodeRows: number;
};

export type DepartmentImportDryRunResult = ImportDryRunResult<
  typeof departmentImportType,
  DepartmentImportDryRunSummary,
  DepartmentImportDryRunRow
>;

export type DepartmentImportApplyMode = "CREATE_ONLY";

export type DepartmentImportApplyErrorSummary = {
  rowNumber: number | null;
  field: string;
  code: string;
  message: string;
};

export type DepartmentImportApplyRow = {
  rowNumber: number;
  code: string;
  status: "CREATED";
  createdDepartmentId: string;
};

export type DepartmentImportApplySummary = {
  totalRows: number;
  createdRows: number;
  skippedRows: number;
  failedRows: number;
  errorCount: number;
  warningCount: number;
};

export type DepartmentImportApplyJobDisposition =
  | "EXECUTED"
  | "REPLAYED_SUCCESS"
  | "IMPORT_IN_PROGRESS";

export type DepartmentImportApplyJobSummary = {
  disposition: DepartmentImportApplyJobDisposition;
  jobId: string;
  runId: string | null;
};

export type DepartmentImportApplyResult = {
  importType: typeof departmentImportType;
  dryRun: false;
  mode: DepartmentImportApplyMode;
  file: ReturnType<typeof buildImportDryRunFileMetadata>;
  summary: DepartmentImportApplySummary;
  errors: DepartmentImportApplyErrorSummary[];
  rows: DepartmentImportApplyRow[];
  job?: DepartmentImportApplyJobSummary;
};

type DepartmentImportPlan = {
  file: DepartmentImportDryRunResult["file"];
  columns: DepartmentImportDryRunResult["columns"];
  summary: DepartmentImportDryRunSummary;
  rows: DepartmentImportDryRunRow[];
};

type WorkingRow = {
  rowNumber: number;
  valuesByHeader: Map<string, string>;
  parsed: DepartmentImportDryRunParsedRow;
  errors: DepartmentImportDryRunIssue[];
  warnings: DepartmentImportDryRunIssue[];
};

export class InvalidImportCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidImportCsvError";
  }
}

export class InvalidDepartmentImportApplyModeError extends Error {
  constructor(mode: string) {
    super(`Unsupported department import apply mode: ${mode}.`);
    this.name = "InvalidDepartmentImportApplyModeError";
  }
}

export class DepartmentImportApplyRejectedError extends Error {
  constructor(
    message: string,
    readonly result: DepartmentImportApplyResult,
  ) {
    super(message);
    this.name = "DepartmentImportApplyRejectedError";
  }
}

@Injectable()
export class DepartmentImportDryRunService {
  constructor(
    @Inject(DepartmentImportDryRunRepository)
    private readonly repository: DepartmentImportDryRunRepository,
    @Inject(DepartmentImportJobRepository)
    private readonly importJobRepository: DepartmentImportJobRepository,
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async dryRunDepartmentCsv(
    _context: UserContext,
    file: DepartmentImportDryRunFile,
  ): Promise<DepartmentImportDryRunResult> {
    const plan = await this.buildDepartmentImportPlan(file);

    return {
      importType: departmentImportType,
      dryRun: true,
      file: plan.file,
      columns: plan.columns,
      summary: plan.summary,
      rows: plan.rows,
    };
  }

  async applyDepartmentCsv(
    context: UserContext,
    file: DepartmentImportDryRunFile,
    mode: string | undefined = "CREATE_ONLY",
  ): Promise<DepartmentImportApplyResult> {
    if (mode !== "CREATE_ONLY") {
      throw new InvalidDepartmentImportApplyModeError(mode ?? "(missing)");
    }

    const idempotency = buildDepartmentImportIdempotency(context, file);
    const claim = await this.importJobRepository.claimDepartmentCreateOnlyJob({
      ...idempotency,
      fileSizeBytes: file.size,
      operatorUserId: context.userId,
    });
    if (claim.disposition !== "RUNNER") {
      const existingResult = toExistingImportJobApplyResult(file, claim);
      if (claim.disposition === "REJECTED" || claim.disposition === "FAILED") {
        throw new DepartmentImportApplyRejectedError(
          claim.disposition === "FAILED"
            ? "Department import job is failed and retry is not enabled."
            : "Department import apply was already rejected.",
          existingResult,
        );
      }

      return existingResult;
    }

    let plan: DepartmentImportPlan;
    try {
      plan = await this.buildDepartmentImportPlan(file);
    } catch (error) {
      await this.importJobRepository.markRejected(
        toInvalidCsvRejectedImportJobInput(claim, file, error),
      );
      throw error;
    }
    try {
      assertPlanCanApply(plan);
    } catch (error) {
      if (error instanceof DepartmentImportApplyRejectedError) {
        await this.importJobRepository.markRejected(
          toRejectedImportJobInput(claim, error.result),
        );
      }

      throw error;
    }

    const orderedRows = orderRowsForCreate(plan.rows);

    try {
      const createdRows = await this.prisma.$transaction(async (tx) => {
        const departmentClient = tx as DepartmentImportApplyTransactionClient;
        const auditClient = tx as AuditTransactionClient;
        const importJobClient = tx as DepartmentImportJobTransactionClient;
        const codes = orderedRows.map((row) => row.parsed.code!);
        const existingCodes =
          await this.repository.findApplyDepartmentsByCodesInTransaction(
            departmentClient,
            codes,
          );

        if (existingCodes.length > 0) {
          throw new DepartmentImportApplyRejectedError(
            "Department import apply found existing department codes.",
            buildRejectedApplyResult(plan, existingCodes.map(toExistingCodeApplyError)),
          );
        }

        const fileCodes = new Set(codes);
        const externalParentCodes = [
          ...new Set(
            orderedRows
              .map((row) => row.parsed.parentCode)
              .filter((code): code is string => Boolean(code && !fileCodes.has(code))),
          ),
        ];
        const parentRows =
          await this.repository.findApplyDepartmentsByCodesInTransaction(
            departmentClient,
            externalParentCodes,
          );
        const parentByCode = new Map(parentRows.map((row) => [row.code, row]));
        const missingParent = externalParentCodes.find(
          (code) => !isActiveDepartment(parentByCode.get(code)),
        );

        if (missingParent) {
          throw new DepartmentImportApplyRejectedError(
            "Department import apply found a missing or inactive parent.",
            buildRejectedApplyResult(plan, [
              {
                rowNumber: findRowNumberByParentCode(orderedRows, missingParent),
                field: "parentCode",
                code: "UNKNOWN_PARENT",
                message: "Parent department code was not found as active data during apply.",
              },
            ]),
          );
        }

        const createdByCode = new Map<string, DepartmentImportCreatedDepartment>();
        const appliedRows: DepartmentImportApplyRow[] = [];
        const auditLogIds: string[] = [];

        for (const row of orderedRows) {
          const parentId = resolveParentId(row, parentByCode, createdByCode);
          const created = await this.repository.createDepartmentInTransaction(
            departmentClient,
            {
              code: row.parsed.code!,
              name: row.parsed.name!,
              parentId,
            },
          );

          const auditLog = await this.auditService.recordEventInTransaction(
            auditClient,
            toDepartmentImportCreateAuditEvent(context, created, row, plan),
          );
          auditLogIds.push(auditLog.id);

          createdByCode.set(created.code, created);
          appliedRows.push({
            rowNumber: row.rowNumber,
            code: created.code,
            status: "CREATED",
            createdDepartmentId: created.id,
          });
        }

        await this.importJobRepository.markSucceededInTransaction(
          importJobClient,
          toSuccessfulImportJobInput(claim, plan, appliedRows, auditLogIds),
        );

        return appliedRows;
      });

      return withJobSummary(buildSuccessfulApplyResult(plan, createdRows), {
        disposition: "EXECUTED",
        jobId: claim.jobId,
        runId: claim.runId,
      });
    } catch (error) {
      if (error instanceof DepartmentImportApplyRejectedError) {
        await this.importJobRepository.markRejected(
          toRejectedImportJobInput(claim, error.result),
        );
        throw error;
      }

      if (this.repository.isPrismaUniqueConflict(error)) {
        const rejected = new DepartmentImportApplyRejectedError(
          "Department import apply encountered a uniqueness conflict.",
          buildRejectedApplyResult(plan, [
            {
              rowNumber: null,
              field: "code",
              code: "EXISTING_CODE",
              message: "Department code already exists.",
            },
          ]),
        );
        await this.importJobRepository.markRejected(
          toRejectedImportJobInput(claim, rejected.result),
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
        : new Error("Unknown department import apply error.");
    }
  }

  private async buildDepartmentImportPlan(
    file: DepartmentImportDryRunFile,
  ): Promise<DepartmentImportPlan> {
    const csv = parseImportCsv(file.buffer, {
      maxRows,
      createError: (message) => new InvalidImportCsvError(message),
    });
    const rows = toWorkingRows(csv);
    applyColumnValidation(rows, csv.headers);
    applyRowValidation(rows);

    const allCodes = collectLookupCodes(rows);
    const existingRows = await this.repository.findDepartmentsByCodes(allCodes);
    const existingCodeByValue = new Map(
      existingRows.map((row) => [row.code, row]),
    );
    const activeExistingCodes = new Set(
      existingRows
        .filter((row) => row.status === DepartmentStatus.ACTIVE)
        .map((row) => row.code),
    );

    applyDuplicateValidation(rows);
    applyExistingCodeWarnings(rows, existingCodeByValue);
    applyParentValidation(rows, activeExistingCodes);

    const resultRows = rows.map(toResultRow);

    return {
      file: buildImportDryRunFileMetadata(file, "departments.csv"),
      columns: {
        required: [...requiredColumns],
        optional: [...optionalColumns],
        received: csv.headers,
      },
      summary: summarizeRows(resultRows),
      rows: resultRows,
    };
  }
}

const assertPlanCanApply = (plan: DepartmentImportPlan): void => {
  const blockingErrors = toApplyErrorSummaries(plan.rows);
  if (blockingErrors.length > 0) {
    throw new DepartmentImportApplyRejectedError(
      "Department import apply requires only CREATE candidates.",
      buildRejectedApplyResult(plan, blockingErrors),
    );
  }
};

const buildSuccessfulApplyResult = (
  plan: DepartmentImportPlan,
  rows: DepartmentImportApplyRow[],
): DepartmentImportApplyResult => ({
  importType: departmentImportType,
  dryRun: false,
  mode: "CREATE_ONLY",
  file: plan.file,
  summary: {
    totalRows: plan.summary.totalRows,
    createdRows: rows.length,
    skippedRows: 0,
    failedRows: 0,
    errorCount: 0,
    warningCount: 0,
  },
  errors: [],
  rows,
});

const buildRejectedApplyResult = (
  plan: DepartmentImportPlan,
  errors: DepartmentImportApplyErrorSummary[],
): DepartmentImportApplyResult => ({
  importType: departmentImportType,
  dryRun: false,
  mode: "CREATE_ONLY",
  file: plan.file,
  summary: {
    totalRows: plan.summary.totalRows,
    createdRows: 0,
    skippedRows: plan.summary.warningRows,
    failedRows: plan.summary.errorRows || errors.length,
    errorCount: errors.length,
    warningCount: plan.summary.warningRows,
  },
  errors,
  rows: [],
});

type StoredDepartmentImportSafeError = {
  rowNumber: number | null;
  field: string;
  code: string;
};

type StoredDepartmentImportSafeSummary = {
  importType: typeof departmentImportType;
  mode: DepartmentImportApplyMode;
  operation: "DEPARTMENT_IMPORT_CREATE";
  totalRows: number;
  acceptedRowCount: number;
  createdDepartmentsCount: number;
  auditCount: number;
  warningCount: number;
  errorCount: number;
  errors: StoredDepartmentImportSafeError[];
};

const buildDepartmentImportIdempotency = (
  context: UserContext,
  file: DepartmentImportDryRunFile,
): Omit<DepartmentImportJobClaimInput, "fileSizeBytes" | "operatorUserId"> => {
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
    family: "DEPARTMENT",
    mode: "CREATE_ONLY",
    fileFingerprint,
    targetEnvironment,
    scopeType,
    scopeHash,
  };

  return {
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

const toExistingImportJobApplyResult = (
  file: DepartmentImportDryRunFile,
  claim: DepartmentImportJobExistingClaim,
): DepartmentImportApplyResult => {
  const safeSummary = toStoredDepartmentImportSafeSummary(claim.safeSummary);
  const baseSummary = safeSummary
    ? toApplySummaryFromStoredSafeSummary(safeSummary)
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
    importType: departmentImportType,
    dryRun: false,
    mode: "CREATE_ONLY",
    file: buildImportDryRunFileMetadata(file, "departments.csv"),
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

const toSuccessfulImportJobInput = (
  claim: DepartmentImportJobClaimResult & { disposition: "RUNNER" },
  plan: DepartmentImportPlan,
  rows: DepartmentImportApplyRow[],
  auditLogIds: string[],
) => {
  const safeSummary: StoredDepartmentImportSafeSummary = {
    importType: departmentImportType,
    mode: "CREATE_ONLY",
    operation: "DEPARTMENT_IMPORT_CREATE",
    totalRows: plan.summary.totalRows,
    acceptedRowCount: plan.summary.createCandidates,
    createdDepartmentsCount: rows.length,
    auditCount: auditLogIds.length,
    warningCount: 0,
    errorCount: 0,
    errors: [],
  };

  return {
    jobId: claim.jobId,
    runId: claim.runId,
    acceptedRowCount: safeSummary.acceptedRowCount,
    createdDepartmentsCount: safeSummary.createdDepartmentsCount,
    auditCount: safeSummary.auditCount,
    warningCount: safeSummary.warningCount,
    errorCount: safeSummary.errorCount,
    safeErrorCodes: [],
    safeSummary,
    auditLogIds,
  };
};

const toRejectedImportJobInput = (
  claim: DepartmentImportJobClaimResult & { disposition: "RUNNER" },
  result: DepartmentImportApplyResult,
) => {
  const safeErrors = result.errors.map(toStoredSafeError);
  const safeSummary: StoredDepartmentImportSafeSummary = {
    importType: departmentImportType,
    mode: "CREATE_ONLY",
    operation: "DEPARTMENT_IMPORT_CREATE",
    totalRows: result.summary.totalRows,
    acceptedRowCount: 0,
    createdDepartmentsCount: 0,
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
    safeSummary,
  };
};

const toInvalidCsvRejectedImportJobInput = (
  claim: DepartmentImportJobClaimResult & { disposition: "RUNNER" },
  file: DepartmentImportDryRunFile,
  error: unknown,
) => {
  const code = error instanceof InvalidImportCsvError ? "INVALID_CSV" : "VALIDATION_ERROR";
  return toRejectedImportJobInput(
    claim,
    {
      importType: departmentImportType,
      dryRun: false,
      mode: "CREATE_ONLY",
      file: buildImportDryRunFileMetadata(file, "departments.csv"),
      summary: {
        totalRows: 0,
        createdRows: 0,
        skippedRows: 0,
        failedRows: 1,
        errorCount: 1,
        warningCount: 0,
      },
      errors: [
        {
          rowNumber: null,
          field: "file",
          code,
          message: "Import CSV could not be parsed for apply.",
        },
      ],
      rows: [],
    },
  );
};

const withJobSummary = (
  result: DepartmentImportApplyResult,
  job: DepartmentImportApplyJobSummary,
): DepartmentImportApplyResult => ({
  ...result,
  job,
});

const toStoredSafeError = (
  error: DepartmentImportApplyErrorSummary,
): StoredDepartmentImportSafeError => ({
  rowNumber: error.rowNumber,
  field: error.field,
  code: error.code,
});

const toStoredSafeErrorResult = (
  error: StoredDepartmentImportSafeError,
): DepartmentImportApplyErrorSummary => ({
  ...error,
  message: `Stored department import rejection code: ${error.code}.`,
});

const toApplySummaryFromStoredSafeSummary = (
  summary: StoredDepartmentImportSafeSummary,
): DepartmentImportApplySummary => ({
  totalRows: summary.totalRows,
  createdRows: summary.createdDepartmentsCount,
  skippedRows: summary.warningCount,
  failedRows: summary.errorCount,
  errorCount: summary.errorCount,
  warningCount: summary.warningCount,
});

const emptyApplySummary = (): DepartmentImportApplySummary => ({
  totalRows: 0,
  createdRows: 0,
  skippedRows: 0,
  failedRows: 0,
  errorCount: 0,
  warningCount: 0,
});

const toStoredDepartmentImportSafeSummary = (
  value: unknown,
): StoredDepartmentImportSafeSummary | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const summary = value as Partial<StoredDepartmentImportSafeSummary>;
  if (
    summary.importType !== departmentImportType ||
    summary.mode !== "CREATE_ONLY" ||
    typeof summary.totalRows !== "number" ||
    typeof summary.createdDepartmentsCount !== "number" ||
    typeof summary.auditCount !== "number" ||
    typeof summary.warningCount !== "number" ||
    typeof summary.errorCount !== "number"
  ) {
    return null;
  }

  return {
    importType: departmentImportType,
    mode: "CREATE_ONLY",
    operation: "DEPARTMENT_IMPORT_CREATE",
    totalRows: summary.totalRows,
    acceptedRowCount:
      typeof summary.acceptedRowCount === "number" ? summary.acceptedRowCount : 0,
    createdDepartmentsCount: summary.createdDepartmentsCount,
    auditCount: summary.auditCount,
    warningCount: summary.warningCount,
    errorCount: summary.errorCount,
    errors: Array.isArray(summary.errors)
      ? summary.errors
          .filter(isStoredSafeError)
          .map((error) => ({
            rowNumber: error.rowNumber,
            field: error.field,
            code: error.code,
          }))
      : [],
  };
};

const isStoredSafeError = (value: unknown): value is StoredDepartmentImportSafeError => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const error = value as Partial<StoredDepartmentImportSafeError>;
  return (
    (typeof error.rowNumber === "number" || error.rowNumber === null) &&
    typeof error.field === "string" &&
    typeof error.code === "string"
  );
};

const toApplyErrorSummaries = (
  rows: readonly DepartmentImportDryRunRow[],
): DepartmentImportApplyErrorSummary[] =>
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

const toExistingCodeApplyError = (
  row: DepartmentImportApplyDepartmentLookup,
): DepartmentImportApplyErrorSummary => ({
  rowNumber: null,
  field: "code",
  code: "EXISTING_CODE",
  message: `Department code already exists: ${row.code}.`,
});

const orderRowsForCreate = (
  rows: readonly DepartmentImportDryRunRow[],
): DepartmentImportDryRunRow[] => {
  const rowByCode = new Map<string, DepartmentImportDryRunRow>();
  for (const row of rows) {
    if (row.parsed.code) {
      rowByCode.set(row.parsed.code, row);
    }
  }

  const ordered: DepartmentImportDryRunRow[] = [];
  const visited = new Set<string>();

  const visit = (row: DepartmentImportDryRunRow): void => {
    const code = row.parsed.code;
    if (!code || visited.has(code)) {
      return;
    }

    const parentRow = row.parsed.parentCode
      ? rowByCode.get(row.parsed.parentCode)
      : null;
    if (parentRow) {
      visit(parentRow);
    }

    visited.add(code);
    ordered.push(row);
  };

  for (const row of rows) {
    visit(row);
  }

  return ordered;
};

const isActiveDepartment = (
  row: DepartmentImportApplyDepartmentLookup | undefined,
): row is DepartmentImportApplyDepartmentLookup =>
  Boolean(row && row.status === DepartmentStatus.ACTIVE && row.archivedAt === null);

const findRowNumberByParentCode = (
  rows: readonly DepartmentImportDryRunRow[],
  parentCode: string,
): number | null =>
  rows.find((row) => row.parsed.parentCode === parentCode)?.rowNumber ?? null;

const resolveParentId = (
  row: DepartmentImportDryRunRow,
  parentByCode: ReadonlyMap<string, DepartmentImportApplyDepartmentLookup>,
  createdByCode: ReadonlyMap<string, DepartmentImportCreatedDepartment>,
): string | null => {
  const parentCode = row.parsed.parentCode;
  if (!parentCode) {
    return null;
  }

  return createdByCode.get(parentCode)?.id ?? parentByCode.get(parentCode)?.id ?? null;
};

const toDepartmentImportCreateAuditEvent = (
  context: UserContext,
  department: DepartmentImportCreatedDepartment,
  row: DepartmentImportDryRunRow,
  plan: DepartmentImportPlan,
): CreateAuditEventInput => ({
  actor: {
    userId: context.userId,
    departmentId: context.departmentId,
  },
  action: AuditActionCode.configUpdate,
  target: {
    type: AuditTargetTypeCode.systemConfig,
    id: department.id,
    departmentId: department.id,
  },
  oldValue: null,
  newValue: {
    operation: "DEPARTMENT_IMPORT_CREATE",
    importType: departmentImportType,
    mode: "CREATE_ONLY",
    rowNumber: row.rowNumber,
    departmentId: department.id,
    code: department.code,
    name: department.name,
    parentId: department.parentId,
    totalRows: plan.summary.totalRows,
    createdRows: plan.summary.createCandidates,
  },
});

const toWorkingRows = (csv: ImportCsvParseResult): WorkingRow[] =>
  csv.records.map((record) => {
    const valuesByHeader = buildValuesByHeader(csv.headers, record.values);

    return {
      rowNumber: record.rowNumber,
      valuesByHeader,
      parsed: {
        code: normalizeCell(valuesByHeader.get("code")),
        name: normalizeCell(valuesByHeader.get("name")),
        parentCode: normalizeCell(valuesByHeader.get("parentCode")),
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
    unknownCode: "UNKNOWN_COLUMN",
    requiredCode: "REQUIRED",
  });

const applyRowValidation = (rows: WorkingRow[]): void => {
  for (const row of rows) {
    validateFormulaLikeValues(row);
    validateRequiredText(row, "code", row.parsed.code, 64);
    validateRequiredText(row, "name", row.parsed.name, 200);

    if (row.parsed.code && !departmentCodePattern.test(row.parsed.code)) {
      row.errors.push({
        field: "code",
        code: "INVALID_FORMAT",
        message: "Department code must use uppercase letters, numbers, or underscore.",
      });
    }

    if (
      row.parsed.parentCode &&
      !departmentCodePattern.test(row.parsed.parentCode)
    ) {
      row.errors.push({
        field: "parentCode",
        code: "INVALID_FORMAT",
        message: "Parent department code must use uppercase letters, numbers, or underscore.",
      });
    }
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

const validateRequiredText = (
  row: WorkingRow,
  field: "code" | "name",
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

const collectLookupCodes = (rows: readonly WorkingRow[]): string[] => {
  const values: string[] = [];
  for (const row of rows) {
    if (row.parsed.code) {
      values.push(row.parsed.code);
    }
    if (row.parsed.parentCode) {
      values.push(row.parsed.parentCode);
    }
  }
  return [...new Set(values)];
};

const applyDuplicateValidation = (rows: WorkingRow[]): void => {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.parsed.code) {
      counts.set(row.parsed.code, (counts.get(row.parsed.code) ?? 0) + 1);
    }
  }

  for (const row of rows) {
    if (row.parsed.code && (counts.get(row.parsed.code) ?? 0) > 1) {
      row.errors.push({
        field: "code",
        code: "DUPLICATE_IN_FILE",
        message: "Department code is duplicated in this file.",
      });
    }
  }
};

const applyExistingCodeWarnings = (
  rows: WorkingRow[],
  existingCodeByValue: ReadonlyMap<string, DepartmentCodeLookup>,
): void => {
  for (const row of rows) {
    if (row.parsed.code && existingCodeByValue.has(row.parsed.code)) {
      row.warnings.push({
        field: "code",
        code: "EXISTING_CODE",
        message: "Department code already exists and would need review.",
      });
    }
  }
};

const applyParentValidation = (
  rows: WorkingRow[],
  activeExistingCodes: ReadonlySet<string>,
): void => {
  const fileCodes = new Set(
    rows
      .map((row) => row.parsed.code)
      .filter((code): code is string => Boolean(code)),
  );

  for (const row of rows) {
    const { code, parentCode } = row.parsed;
    if (!parentCode) {
      continue;
    }

    if (code && parentCode === code) {
      row.errors.push({
        field: "parentCode",
        code: "PARENT_CYCLE",
        message: "Department cannot reference itself as parent.",
      });
      continue;
    }

    if (!fileCodes.has(parentCode) && !activeExistingCodes.has(parentCode)) {
      row.errors.push({
        field: "parentCode",
        code: "UNKNOWN_PARENT",
        message: "Parent department code was not found as active existing data or another file row.",
      });
    }
  }

  applyFileParentCycleValidation(rows);
};

const applyFileParentCycleValidation = (rows: WorkingRow[]): void => {
  const parentByCode = new Map<string, string>();
  for (const row of rows) {
    if (row.parsed.code && row.parsed.parentCode) {
      parentByCode.set(row.parsed.code, row.parsed.parentCode);
    }
  }

  for (const row of rows) {
    const code = row.parsed.code;
    if (!code) {
      continue;
    }

    const visited = new Set<string>();
    let next = parentByCode.get(code);
    while (next && parentByCode.has(next)) {
      if (next === code || visited.has(next)) {
        row.errors.push({
          field: "parentCode",
          code: "PARENT_CYCLE",
          message: "File-local department parent cycle was detected.",
        });
        break;
      }

      visited.add(next);
      next = parentByCode.get(next);
    }
  }
};

const toResultRow = (row: WorkingRow): DepartmentImportDryRunRow => {
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

  if (row.warnings.some((warning) => warning.code === "EXISTING_CODE")) {
    return {
      rowNumber: row.rowNumber,
      parsed: row.parsed,
      status: "WARNING",
      candidateAction: "REVIEW_EXISTING",
      errors: row.errors,
      warnings: row.warnings,
    };
  }

  return {
    rowNumber: row.rowNumber,
    parsed: row.parsed,
    status: "VALID",
    candidateAction: "CREATE",
    errors: row.errors,
    warnings: row.warnings,
  };
};

const summarizeRows = (rows: readonly DepartmentImportDryRunRow[]) => ({
  ...summarizeImportDryRunRows(rows),
  createCandidates: rows.filter((row) => row.candidateAction === "CREATE").length,
  existingCodeRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "EXISTING_CODE"),
  ).length,
});

const normalizeCell = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};
