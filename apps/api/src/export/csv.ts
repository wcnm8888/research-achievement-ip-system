export type CsvColumn<T> = {
  key: string;
  header: string;
  value?: (row: T) => unknown;
};

export const createCsv = <T>(
  columns: readonly CsvColumn<T>[],
  rows: readonly T[],
): string => {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) =>
        escapeCsvCell(column.value ? column.value(row) : readRecordValue(row, column.key)),
      )
      .join(","),
  );

  return [header, ...body].join("\r\n") + "\r\n";
};

export const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = sanitizeFormulaCell(formatCsvValue(value));
  const escaped = text.replace(/"/g, '""');

  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const formatCsvValue = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
};

const sanitizeFormulaCell = (text: string): string =>
  /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;

const readRecordValue = <T>(row: T, key: string): unknown =>
  typeof row === "object" && row !== null
    ? (row as Record<string, unknown>)[key]
    : undefined;
