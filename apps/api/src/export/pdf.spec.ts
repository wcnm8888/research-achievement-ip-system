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
    expect(serialized).toContain("/STSong-Light");
    expect(serialized).toContain(toUtf16BeHex("Custom Report Export"));
    expect(serialized).toContain(toUtf16BeHex("Department | Count"));
    expect(serialized).toContain(toUtf16BeHex("RD | 2"));
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain("password");
  });

  it("keeps Chinese export text in encoded PDF content instead of replacing it", () => {
    const pdf = createSimplePdf(
      "自定义报表导出",
      [{ key: "title", header: "题名" }],
      [{ title: "科研成果知识产权协同管理方法研究" }],
    );
    const serialized = pdf.toString("utf8");

    expect(serialized).toContain(toUtf16BeHex("自定义报表导出"));
    expect(serialized).toContain(toUtf16BeHex("题名"));
    expect(serialized).toContain(toUtf16BeHex("科研成果知识产权协同管理方法研究"));
    expect(serialized).not.toContain("????");
  });
});

const toUtf16BeHex = (value: string): string => {
  const buffer = Buffer.from(value, "utf16le");

  for (let index = 0; index < buffer.length; index += 2) {
    const low = buffer[index];
    buffer[index] = buffer[index + 1] ?? 0;
    buffer[index + 1] = low ?? 0;
  }

  return buffer.toString("hex").toUpperCase();
};
