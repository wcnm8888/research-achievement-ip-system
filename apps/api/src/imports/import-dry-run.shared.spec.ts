import { describe, expect, it } from "vitest";
import {
  appendColumnValidationIssues,
  buildImportDryRunFileMetadata,
  buildValuesByHeader,
  isFormulaLikeCell,
  normalizeImportHeaderToken,
  parseImportCsv,
  summarizeImportDryRunRows,
} from "./import-dry-run.shared";

describe("import dry-run shared helpers", () => {
  it("parses the common narrow CSV boundary with stable row numbers", () => {
    const csv = parseImportCsv(
      Buffer.from("code,name\r\nD1,\"Research, Lab\"\r\n\nD2,Finance\r\n"),
      {
        maxRows: 10,
        createError: (message) => new Error(message),
      },
    );

    expect(csv.headers).toEqual(["code", "name"]);
    expect(csv.records).toEqual([
      { rowNumber: 2, values: ["D1", "Research, Lab"] },
      { rowNumber: 4, values: ["D2", "Finance"] },
    ]);
    expect(buildValuesByHeader(csv.headers, csv.records[0]!.values)).toEqual(
      new Map([
        ["code", "D1"],
        ["name", "Research, Lab"],
      ]),
    );
  });

  it("keeps existing CSV parse error messages configurable", () => {
    expect(() =>
      parseImportCsv(Buffer.from("code,name\n\"D1,Lab\n"), {
        maxRows: 10,
        createError: (message) => new Error(`custom: ${message}`),
      }),
    ).toThrow("custom: CSV contains an unclosed quoted field.");
  });

  it("builds shared column issues without changing issue shape", () => {
    const rows = [{ errors: [] as { field: string; code: string; message: string }[] }];
    appendColumnValidationIssues(rows, ["email", "password", "extra"], {
      allowedColumns: new Set(["email"]),
      requiredColumns: ["email", "displayName"],
      isForbiddenColumn: (header) => normalizeImportHeaderToken(header) === "password",
      unknownCode: "UNKNOWN_COLUMN",
      forbiddenCode: "FORBIDDEN_SENSITIVE_COLUMN",
      requiredCode: "REQUIRED",
      forbiddenMessage: "Sensitive columns are not supported.",
    });

    expect(rows[0]!.errors).toEqual([
      {
        field: "extra",
        code: "UNKNOWN_COLUMN",
        message: "Column is not supported: extra.",
      },
      {
        field: "(sensitive)",
        code: "FORBIDDEN_SENSITIVE_COLUMN",
        message: "Sensitive columns are not supported.",
      },
      {
        field: "displayName",
        code: "REQUIRED",
        message: "Required column is missing: displayName.",
      },
    ]);
  });

  it("builds shared file metadata and base summary", () => {
    expect(
      buildImportDryRunFileMetadata(
        {
          originalName: "..\\departments.csv",
          mimeType: "text/csv",
          size: 42,
        },
        "fallback.csv",
      ),
    ).toEqual({
      name: "..-departments.csv",
      size: 42,
      mimeType: "text/csv",
      encoding: "utf-8",
    });

    expect(
      summarizeImportDryRunRows([
        { errors: [], warnings: [] },
        { errors: [{ code: "REQUIRED" }], warnings: [] },
        { errors: [], warnings: [{ code: "EXISTING" }] },
      ]),
    ).toEqual({
      totalRows: 3,
      validRows: 2,
      errorRows: 1,
      warningRows: 1,
    });
    expect(isFormulaLikeCell("=1+1")).toBe(true);
  });
});
