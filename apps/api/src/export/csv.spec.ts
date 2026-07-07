import { describe, expect, it } from "vitest";
import { createCsv, escapeCsvCell } from "./csv";

describe("CSV export helper", () => {
  it("escapes commas, line breaks, and double quotes", () => {
    expect(escapeCsvCell('alpha,"beta"\ngamma')).toBe('"alpha,""beta""\ngamma"');
  });

  it("renders null and undefined cells as empty values", () => {
    expect(createCsv([{ key: "a", header: "A" }, { key: "b", header: "B" }], [
      { a: null, b: undefined },
    ])).toBe("A,B\r\n,\r\n");
  });

  it("prefixes formula-like cells to avoid spreadsheet execution", () => {
    expect(escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell("+cmd")).toBe("'+cmd");
    expect(escapeCsvCell("-10+20")).toBe("'-10+20");
    expect(escapeCsvCell("@lookup")).toBe("'@lookup");
    expect(escapeCsvCell("  =hidden")).toBe("'  =hidden");
  });
});
