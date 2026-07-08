import { describe, expect, it } from "vitest";
import {
  getDemoSafeErrorDetail,
  getDemoSafeErrorMessage,
  sanitizeErrorText,
  sanitizeUnknownErrorDetail,
  toDemoSafeApiError,
} from "./error-display";
import type { ApiError } from "./api-client";

describe("demo-safe error display", () => {
  it("replaces route, raw payload, JSON, and stack details with reviewer-safe copy", () => {
    const error: ApiError = {
      kind: "unknown",
      status: 404,
      message: "Cannot GET /api/search/raw",
      detail: "raw JSON stack trace from /api/search/raw",
    };

    const safeError = toDemoSafeApiError(error);

    expect(safeError.message).toBe("请求暂未完成");
    expect(safeError.detail).toBe("当前信息暂不可用，请稍后重试或联系管理员处理。");
    expect(JSON.stringify(safeError)).not.toContain("/api/search/raw");
    expect(JSON.stringify(safeError).toLowerCase()).not.toContain("raw json");
    expect(JSON.stringify(safeError).toLowerCase()).not.toContain("stack");
  });

  it("keeps normal business validation copy", () => {
    const error: ApiError = {
      kind: "bad-request",
      status: 400,
      message: "审计日志筛选条件格式不正确",
      detail: "当前输入：bad-id",
    };

    expect(getDemoSafeErrorMessage(error)).toBe("审计日志筛选条件格式不正确");
    expect(getDemoSafeErrorDetail(error)).toBe("当前输入：bad-id");
  });

  it("sanitizes unknown Error objects before they reach page alerts", () => {
    expect(sanitizeUnknownErrorDetail(new Error("endpoint /api/audit-logs stack"))).toBe(
      "当前信息暂不可用，请稍后重试或联系管理员处理。",
    );
    expect(sanitizeErrorText("本地服务暂不可用")).toBe("本地服务暂不可用");
  });
});
