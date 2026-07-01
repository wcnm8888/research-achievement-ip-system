import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus } from "@prisma/client";
import { UserContext } from "../identity/user-context";
import {
  DepartmentCodeLookup,
  DepartmentImportDryRunRepository,
} from "./department-import-dry-run.repository";
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

@Injectable()
export class DepartmentImportDryRunService {
  constructor(
    @Inject(DepartmentImportDryRunRepository)
    private readonly repository: DepartmentImportDryRunRepository,
  ) {}

  async dryRunDepartmentCsv(
    _context: UserContext,
    file: DepartmentImportDryRunFile,
  ): Promise<DepartmentImportDryRunResult> {
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
      importType: departmentImportType,
      dryRun: true,
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
