import { describe, expect, it } from "vitest";
import {
  normalizeDoi,
  normalizePatentApplicationNo,
  normalizePatentGrantNo,
  normalizeSoftwareRegistrationNo,
} from "./achievement-normalizer";

describe("achievement business key normalizers", () => {
  it("normalizes DOI prefixes, casing, and whitespace", () => {
    expect(normalizeDoi(" HTTPS://doi.org/ 10.1234/ABC Def ")).toBe("10.1234/abcdef");
    expect(normalizeDoi("doi:10.5555/Some.Paper")).toBe("10.5555/some.paper");
    expect(normalizeDoi("http://dx.doi.org/10.1000/XYZ")).toBe("10.1000/xyz");
  });

  it("returns null for empty DOI values", () => {
    expect(normalizeDoi(undefined)).toBeNull();
    expect(normalizeDoi(null)).toBeNull();
    expect(normalizeDoi("   ")).toBeNull();
  });

  it("normalizes patent application numbers without stripping meaningful separators", () => {
    expect(normalizePatentApplicationNo(" cn 2024-123.4 / a ")).toBe("CN2024123.4/A");
    expect(normalizePatentApplicationNo("ＣＮ 2024－123")).toBe("ＣＮ2024123");
  });

  it("normalizes patent grant numbers idempotently", () => {
    const normalized = normalizePatentGrantNo(" zl-2024 / 001.2 ");

    expect(normalized).toBe("ZL2024/001.2");
    expect(normalizePatentGrantNo(normalized)).toBe(normalized);
  });

  it("normalizes software copyright registration numbers while preserving parentheses", () => {
    expect(normalizeSoftwareRegistrationNo(" 2024-sr 001 (a) ")).toBe("2024SR001(A)");
  });

  it("returns null for empty patent and software copyright values", () => {
    expect(normalizePatentApplicationNo("")).toBeNull();
    expect(normalizePatentGrantNo(" \u3000 ")).toBeNull();
    expect(normalizeSoftwareRegistrationNo(null)).toBeNull();
  });
});
