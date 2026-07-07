import type { CsvColumn } from "./csv";

export class ExportFieldSelectionError extends Error {
  constructor(public readonly fields: readonly string[]) {
    super(`Unsupported export fields: ${fields.join(", ")}`);
    this.name = "ExportFieldSelectionError";
  }
}

export const parseExportFields = (fields?: string | null): string[] => {
  const parsed = (fields ?? "")
    .split(",")
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  return [...new Set(parsed)];
};

export const selectExportColumns = <T>(
  columns: readonly CsvColumn<T>[],
  fields?: string | null,
): CsvColumn<T>[] => {
  const selectedFields = parseExportFields(fields);

  if (selectedFields.length === 0) {
    return [...columns];
  }

  const columnsByKey = new Map(columns.map((column) => [column.key, column]));
  const unsupported = selectedFields.filter((field) => !columnsByKey.has(field));

  if (unsupported.length > 0) {
    throw new ExportFieldSelectionError(unsupported);
  }

  return selectedFields.map((field) => columnsByKey.get(field) as CsvColumn<T>);
};
