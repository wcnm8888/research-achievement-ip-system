import { describe, expect, it } from "vitest";
import {
  ExportFieldSelectionError,
  parseExportFields,
  selectExportColumns,
} from "./fields";

const columns = [
  { key: "id", header: "ID" },
  { key: "title", header: "Title" },
  { key: "status", header: "Status" },
];

describe("export field selection", () => {
  it("returns the full safe field set by default", () => {
    expect(selectExportColumns(columns).map((column) => column.key)).toEqual([
      "id",
      "title",
      "status",
    ]);
  });

  it("returns fields in request order", () => {
    expect(selectExportColumns(columns, "status,id").map((column) => column.key)).toEqual([
      "status",
      "id",
    ]);
  });

  it("deduplicates repeated fields", () => {
    expect(parseExportFields("id,title,id")).toEqual(["id", "title"]);
  });

  it("treats empty fields as the default selection", () => {
    expect(selectExportColumns(columns, " , ").map((column) => column.key)).toEqual([
      "id",
      "title",
      "status",
    ]);
  });

  it("rejects unsupported fields", () => {
    expect(() => selectExportColumns(columns, "id,password")).toThrow(
      ExportFieldSelectionError,
    );
  });
});
