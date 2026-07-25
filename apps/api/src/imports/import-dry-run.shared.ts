export const importDryRunEncoding = "utf-8" as const;
export const importDryRunMaxFileBytes = 1024 * 1024;
export const importDryRunStatuses = ["VALID", "WARNING", "ERROR"] as const;

export type ImportDryRunStatus = (typeof importDryRunStatuses)[number];

export type ImportDryRunFile = {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

export type ImportDryRunFileMetadata = {
  name: string;
  size: number;
  mimeType: string;
  encoding: typeof importDryRunEncoding;
};

export type ImportDryRunColumnsMetadata = {
  required: string[];
  optional: string[];
  received: string[];
};

export type ImportDryRunIssue<TCode extends string> = {
  field: string;
  code: TCode;
  message: string;
};

export type ImportDryRunRow<
  TParsed,
  TCandidateAction extends string,
  TIssue extends ImportDryRunIssue<string>,
> = {
  rowNumber: number;
  parsed: TParsed;
  status: ImportDryRunStatus;
  candidateAction: TCandidateAction;
  errors: TIssue[];
  warnings: TIssue[];
};

export type ImportDryRunBaseSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
};

export type ImportDryRunResult<
  TImportType extends string,
  TSummary extends ImportDryRunBaseSummary,
  TRow,
> = {
  importType: TImportType;
  dryRun: true;
  file: ImportDryRunFileMetadata;
  columns: ImportDryRunColumnsMetadata;
  summary: TSummary;
  rows: TRow[];
};

export type ParsedImportCsvRecord = {
  rowNumber: number;
  values: string[];
};

export type ImportCsvParseResult = {
  headers: string[];
  records: ParsedImportCsvRecord[];
};

export type ImportDryRunIssueContainer<TIssue extends ImportDryRunIssue<string>> = {
  errors: TIssue[];
};

export const parseImportCsv = (
  buffer: Buffer,
  options: {
    maxRows: number;
    createError: (message: string) => Error;
  },
): ImportCsvParseResult => {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  if (text.includes("\uFFFD")) {
    throw options.createError("CSV must be valid UTF-8.");
  }

  const records = parseImportCsvRecords(text, options.createError);
  const nonEmptyRecords = records.filter((record) =>
    record.values.some((value) => value.trim() !== ""),
  );
  const headerRecord = nonEmptyRecords[0];
  if (!headerRecord) {
    throw options.createError("CSV header row is required.");
  }

  const dataRecords = nonEmptyRecords.slice(1);
  if (dataRecords.length > options.maxRows) {
    throw options.createError(`CSV data row limit exceeded: ${options.maxRows}.`);
  }

  return {
    headers: headerRecord.values.map((header) => header.trim()),
    records: dataRecords,
  };
};

const parseImportCsvRecords = (
  text: string,
  createError: (message: string) => Error,
): ParsedImportCsvRecord[] => {
  const records: ParsedImportCsvRecord[] = [];
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
    throw createError("CSV contains an unclosed quoted field.");
  }

  if (value.length > 0 || values.length > 0) {
    values.push(value);
    records.push({ rowNumber, values });
  }

  return records;
};

export const buildValuesByHeader = (
  headers: readonly string[],
  values: readonly string[],
): Map<string, string> => {
  const valuesByHeader = new Map<string, string>();
  headers.forEach((header, index) => {
    valuesByHeader.set(header, values[index] ?? "");
  });
  return valuesByHeader;
};

export const appendColumnValidationIssues = <
  TIssue extends ImportDryRunIssue<string>,
  TRow extends ImportDryRunIssueContainer<TIssue>,
>(
  rows: TRow[],
  headers: readonly string[],
  options: {
    allowedColumns: ReadonlySet<string>;
    requiredColumns: readonly string[];
    isForbiddenColumn?: (header: string) => boolean;
    unknownCode: TIssue["code"];
    forbiddenCode?: TIssue["code"];
    requiredCode: TIssue["code"];
    forbiddenMessage?: string;
  },
): void => {
  const unknownHeaders = headers.filter(
    (header) =>
      !options.allowedColumns.has(header) &&
      !(options.isForbiddenColumn?.(header) ?? false),
  );
  const forbiddenHeaders = options.isForbiddenColumn
    ? headers.filter(options.isForbiddenColumn)
    : [];
  const missingRequiredHeaders = options.requiredColumns.filter(
    (column) => !headers.includes(column),
  );

  for (const row of rows) {
    for (const header of unknownHeaders) {
      row.errors.push({
        field: header || "(empty)",
        code: options.unknownCode,
        message: `Column is not supported: ${header || "(empty)"}.`,
      } as TIssue);
    }

    if (options.forbiddenCode && options.forbiddenMessage) {
      for (let index = 0; index < forbiddenHeaders.length; index += 1) {
        row.errors.push({
          field: "(sensitive)",
          code: options.forbiddenCode,
          message: options.forbiddenMessage,
        } as TIssue);
      }
    }

    for (const column of missingRequiredHeaders) {
      row.errors.push({
        field: column,
        code: options.requiredCode,
        message: `Required column is missing: ${column}.`,
      } as TIssue);
    }
  }
};

export const normalizeImportHeaderToken = (header: string): string =>
  header.replace(/[^A-Za-z0-9]/g, "").toLowerCase();

export const isFormulaLikeCell = (value: string | null): boolean =>
  Boolean(value && /^[=+\-@]/.test(value));

export const summarizeImportDryRunRows = (
  rows: readonly {
    errors: readonly unknown[];
    warnings: readonly unknown[];
  }[],
): ImportDryRunBaseSummary => ({
  totalRows: rows.length,
  validRows: rows.filter((row) => row.errors.length === 0).length,
  errorRows: rows.filter((row) => row.errors.length > 0).length,
  warningRows: rows.filter((row) => row.warnings.length > 0).length,
});

export const buildImportDryRunFileMetadata = (
  file: Pick<ImportDryRunFile, "originalName" | "mimeType" | "size">,
  fallbackName: string,
): ImportDryRunFileMetadata => ({
  name: sanitizeImportDryRunFileName(file.originalName, fallbackName),
  size: file.size,
  mimeType: file.mimeType,
  encoding: importDryRunEncoding,
});

export const sanitizeImportDryRunFileName = (
  name: string,
  fallbackName: string,
): string => name.replace(/[\\/]/g, "-").slice(0, 255) || fallbackName;
