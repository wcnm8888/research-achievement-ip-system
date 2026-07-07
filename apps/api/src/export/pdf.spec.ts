import { describe, expect, it } from "vitest";
import { createSimplePdf } from "./pdf";

describe("PDF export helper", () => {
  it("creates a minimal PDF without unsafe raw fields", () => {
    const pdf = createSimplePdf(
      "Custom Report Export",
      [
        { key: "department", header: "Department" },
        { key: "count", header: "Count" },
      ],
      [{ department: "RD", count: 2 }],
    );
    const serialized = pdf.toString("utf8");

    expect(serialized.startsWith("%PDF-1.4")).toBe(true);
    expect(serialized).toContain("Custom Report Export");
    expect(serialized).toContain("Department | Count");
    expect(serialized).toContain("RD | 2");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("password");
  });
});
