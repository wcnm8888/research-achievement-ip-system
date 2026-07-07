import type { CsvColumn } from "./csv";

const maxPdfRows = 60;
const maxLineLength = 110;

export const createSimplePdf = <T>(
  title: string,
  columns: readonly CsvColumn<T>[],
  rows: readonly T[],
): Buffer => {
  const lines = [
    title,
    "",
    columns.map((column) => column.header).join(" | "),
    ...rows.slice(0, maxPdfRows).map((row) =>
      columns
        .map((column) =>
          formatPdfValue(column.value ? column.value(row) : readRecordValue(row, column.key)),
        )
        .join(" | "),
    ),
    rows.length > maxPdfRows ? `... truncated to ${maxPdfRows} rows for PDF preview` : "",
  ].filter((line) => line !== "");
  const content = [
    "BT",
    "/F1 9 Tf",
    "50 790 Td",
    ...lines.flatMap((line, index) => [
      index === 0 ? "/F1 13 Tf" : "/F1 9 Tf",
      `(${escapePdfText(truncateLine(line))}) Tj`,
      "0 -14 Td",
    ]),
    "ET",
  ].join("\n");
  const stream = Buffer.from(content, "utf8");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.byteLength} >>\nstream\n${content}\nendstream`,
  ];
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "utf8")];
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.concat(chunks).byteLength);
    chunks.push(Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`, "utf8"));
  }

  const xrefOffset = Buffer.concat(chunks).byteLength;
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  chunks.push(Buffer.from(xref, "utf8"));

  return Buffer.concat(chunks);
};

const formatPdfValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return value instanceof Date ? value.toISOString() : String(value);
};

const readRecordValue = <T>(row: T, key: string): unknown =>
  typeof row === "object" && row !== null
    ? (row as Record<string, unknown>)[key]
    : undefined;

const truncateLine = (line: string): string =>
  line.length > maxLineLength ? `${line.slice(0, maxLineLength - 3)}...` : line;

const escapePdfText = (value: string): string =>
  value
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
