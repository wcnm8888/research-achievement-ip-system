import { Inject, Injectable } from "@nestjs/common";
import { DepartmentStatus } from "@prisma/client";
import { UserContext } from "../identity/user-context";
import {
  DepartmentCodeLookup,
  DepartmentImportDryRunRepository,
} from "./department-import-dry-run.repository";

export const departmentImportType = "DEPARTMENT_METADATA" as const;

const requiredColumns = ["code", "name"] as const;
const optionalColumns = ["parentCode"] as const;
const allowedColumns = new Set<string>([...requiredColumns, ...optionalColumns]);
const departmentCodePattern = /^[A-Z0-9_]+$/;
const maxRows = 500;
const formulaLikePattern = /^[=+\-@]/;

export type DepartmentImportDryRunFile = {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

export type DepartmentImportDryRunIssueCode =
  | "REQUIRED"
  | "INVALID_FORMAT"
  | "DUPLICATE_IN_FILE"
  | "UNKNOWN_PARENT"
  | "PARENT_CYCLE"
  | "EXISTING_CODE"
  | "UNKNOWN_COLUMN"
  | "FORMULA_LIKE_VALUE";

export type DepartmentImportDryRunIssue = {
  field: string;
  code: DepartmentImportDryRunIssueCode;
  message: string;
};

export type DepartmentImportDryRunRowStatus = "VALID" | "WARNING" | "ERROR";
export type DepartmentImportDryRunCandidateAction =
  | "CREATE"
  | "REVIEW_EXISTING"
  | "SKIP";

export type DepartmentImportDryRunRow = {
  rowNumber: number;
  parsed: {
    code: string | null;
    name: string | null;
    parentCode: string | null;
  };
  status: DepartmentImportDryRunRowStatus;
  candidateAction: DepartmentImportDryRunCandidateAction;
  errors: DepartmentImportDryRunIssue[];
  warnings: DepartmentImportDryRunIssue[];
};

export type DepartmentImportDryRunResult = {
  importType: typeof departmentImportType;
  dryRun: true;
  file: {
    name: string;
    size: number;
    mimeType: string;
    encoding: "utf-8";
  };
  columns: {
    required: string[];
    optional: string[];
    received: string[];
  };
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    createCandidates: number;
    existingCodeRows: number;
  };
  rows: DepartmentImportDryRunRow[];
};

type ParsedCsvRecord = {
  rowNumber: number;
  values: string[];
};

type CsvParseResult = {
  headers: string[];
  records: ParsedCsvRecord[];
};

type WorkingRow = {
  rowNumber: number;
  valuesByHeader: Map<string, string>;
  parsed: {
    code: string | null;
    name: string | null;
    parentCode: string | null;
  };
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
    const csv = parseCsv(file.buffer);
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
      file: {
        name: sanitizeFileName(file.originalName),
        size: file.size,
        mimeType: file.mimeType,
        encoding: "utf-8",
      },
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

const parseCsv = (buffer: Buffer): CsvParseResult => {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  if (text.includes("\uFFFD")) {
    throw new InvalidImportCsvError("CSV must be valid UTF-8.");
  }

  const records = parseCsvRecords(text);
  const nonEmptyRecords = records.filter((record) =>
    record.values.some((value) => value.trim() !== ""),
  );
  const headerRecord = nonEmptyRecords[0];
  if (!headerRecord) {
    throw new InvalidImportCsvError("CSV header row is required.");
  }

  const dataRecords = nonEmptyRecords.slice(1);
  if (dataRecords.length > maxRows) {
    throw new InvalidImportCsvError(`CSV data row limit exceeded: ${maxRows}.`);
  }

  return {
    headers: headerRecord.values.map((header) => header.trim()),
    records: dataRecords,
  };
};

// Intentionally narrow CSV support: UTF-8, comma delimiter, double-quote
// escaping, one header row, no delimiter autodetection, no Excel workbook parsing.
const parseCsvRecords = (text: string): ParsedCsvRecord[] => {
  const records: ParsedCsvRecord[] = [];
  let values: string[] = [];
  let value = "";
  let inQuotes = false;
  let rowNumber = 1;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === "\"") {
        if (text[index + 1] === "\"") {
          value += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += character;
      }
      continue;
    }

    if (character === "\"") {
      if (value.length === 0) {
        inQuotes = true;
      } else {
        value += character;
      }
      continue;
    }

    if (character === ",") {
      values.push(value);
      value = "";
      continue;
    }

    if (character === "\n" || character === "\r") {
      values.push(value);
      records.push({ rowNumber, values });
      values = [];
      value = "";
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      rowNumber += 1;
      continue;
    }

    value += character;
  }

  if (inQuotes) {
    throw new InvalidImportCsvError("CSV contains an unclosed quoted field.");
  }

  if (value.length > 0 || values.length > 0) {
    values.push(value);
    records.push({ rowNumber, values });
  }

  return records;
};

const toWorkingRows = (csv: CsvParseResult): WorkingRow[] =>
  csv.records.map((record) => {
    const valuesByHeader = new Map<string, string>();
    csv.headers.forEach((header, index) => {
      valuesByHeader.set(header, record.values[index] ?? "");
    });

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
): void => {
  const unknownHeaders = headers.filter((header) => !allowedColumns.has(header));
  const missingRequiredHeaders = requiredColumns.filter(
    (column) => !headers.includes(column),
  );

  for (const row of rows) {
    for (const header of unknownHeaders) {
      row.errors.push({
        field: header || "(empty)",
        code: "UNKNOWN_COLUMN",
        message: `Column is not supported: ${header || "(empty)"}.`,
      });
    }

    for (const column of missingRequiredHeaders) {
      row.errors.push({
        field: column,
        code: "REQUIRED",
        message: `Required column is missing: ${column}.`,
      });
    }
  }
};

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
    if (value && formulaLikePattern.test(value)) {
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
  totalRows: rows.length,
  validRows: rows.filter((row) => row.errors.length === 0).length,
  errorRows: rows.filter((row) => row.errors.length > 0).length,
  warningRows: rows.filter((row) => row.warnings.length > 0).length,
  createCandidates: rows.filter((row) => row.candidateAction === "CREATE").length,
  existingCodeRows: rows.filter((row) =>
    row.warnings.some((warning) => warning.code === "EXISTING_CODE"),
  ).length,
});

const normalizeCell = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const sanitizeFileName = (name: string): string =>
  name.replace(/[\\/]/g, "-").slice(0, 255) || "departments.csv";
