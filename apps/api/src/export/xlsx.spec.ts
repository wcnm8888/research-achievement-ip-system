import { describe, expect, it } from "vitest";
import { createXlsx } from "./xlsx";

describe("XLSX export helper", () => {
  it("creates an OpenXML workbook package with escaped safe cells", () => {
    const workbook = createXlsx(
      [
        { key: "name", header: "Name" },
        { key: "note", header: "Note" },
      ],
      [
        { name: "Alpha & Beta", note: "line <one>" },
        { name: "Formula", note: "=SUM(A1:A2)" },
      ],
    );
    const serialized = workbook.toString("utf8");

    expect(workbook.subarray(0, 2).toString("utf8")).toBe("PK");
    expect(serialized).toContain("xl/worksheets/sheet1.xml");
    expect(serialized).toContain("Alpha &amp; Beta");
    expect(serialized).toContain("line &lt;one&gt;");
    expect(serialized).toContain("'=SUM(A1:A2)");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("password");
  });
});
