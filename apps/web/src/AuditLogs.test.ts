import { describe, expect, it, vi } from "vitest";
import type { ApiClient, ApiError } from "./api-client";
import {
  buildAuditDisplayModel,
  buildAuditLogFilterSummary,
  buildAuditLogQuery,
  buildAuditLogQueryResult,
  fetchAuditLogs,
  formatMaskedValue,
  getAuditLogListState,
  getStep18BReadOnlyBoundary,
  loadAuditLogsForDemoUser,
  loadValidatedAuditLogsForDemoUser,
  mapAuditLogErrorToDisplay,
} from "./AuditLogs";
import type { AuditLogListResult, MaskedAuditLog } from "./types";

const maskedAuditLog: MaskedAuditLog = {
  id: "90000000-0000-4000-8000-000000000001",
  actorUserId: "40000000-0000-4000-8000-000000000003",
  actorDepartmentId: "10000000-0000-4000-8000-000000000001",
  action: "UPDATE",
  targetType: "ACHIEVEMENT",
  targetId: "20000000-0000-4000-8000-000000000001",
  targetDepartmentId: "10000000-0000-4000-8000-000000000001",
  targetSecretLevel: "INTERNAL",
  traceId: "trace-step-18b",
  createdAt: "2026-06-21T08:30:00.000Z",
  oldValueMasked: {
    status: "DRAFT",
    token: "[REDACTED_SENSITIVE]",
  },
  newValueMasked: {
    status: "PENDING_ARCHIVE",
    version: 2,
    password: "[REDACTED_SENSITIVE]",
  },
  ipAddressMasked: "[REDACTED_IP]",
  userAgentMasked: "[REDACTED_USER_AGENT]",
};

const createClient = (result: unknown): ApiClient => ({
  get: vi.fn(async () => result) as unknown as ApiClient["get"],
  post: vi.fn(),
  patch: vi.fn(),
});

const collectCalledPaths = (client: ApiClient): string[] => {
  const getCalls = (client.get as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  const postCalls = (client.post as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  const patchCalls = (client.patch as unknown as { mock: { calls: unknown[][] } }).mock.calls;

  return [...getCalls, ...postCalls, ...patchCalls].map(([path]) => String(path));
};

const expectReadonlyAuditLogsOnly = (client: ApiClient): void => {
  const calledPaths = collectCalledPaths(client);

  expect(client.post).not.toHaveBeenCalled();
  expect(client.patch).not.toHaveBeenCalled();
  expect(calledPaths.every((path) => path === "/audit-logs")).toBe(true);
  expect(calledPaths.some((path) => path.includes("export"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("download"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("unmasked"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("attachments"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("/fees"))).toBe(false);
};

describe("audit log query building", () => {
  it("shapes only Step 18B readonly filters for GET /audit-logs", () => {
    expect(
      buildAuditLogQuery({
        action: "UPDATE",
        targetType: "ACHIEVEMENT",
        targetId: "20000000-0000-4000-8000-000000000001",
        actorUserId: "40000000-0000-4000-8000-000000000003",
        traceId: " trace-step-18b ",
        take: 25,
      }),
    ).toEqual({
      action: "UPDATE",
      targetType: "ACHIEVEMENT",
      targetId: "20000000-0000-4000-8000-000000000001",
      actorUserId: "40000000-0000-4000-8000-000000000003",
      traceId: "trace-step-18b",
      take: 25,
    });
  });

  it("omits ALL filters and defaults take to 50", () => {
    expect(buildAuditLogQuery({ action: "ALL", targetType: "ALL" })).toEqual({
      action: undefined,
      targetType: undefined,
      targetId: undefined,
      actorUserId: undefined,
      traceId: undefined,
      take: 50,
    });
  });

  it("returns validation errors for invalid take, UUIDs, and traceId", () => {
    expect(buildAuditLogQueryResult({ take: 0 })).toMatchObject({
      valid: false,
      error: { status: 400, message: "审计日志数量范围必须是 1-100" },
    });
    expect(buildAuditLogQueryResult({ take: 101 })).toMatchObject({
      valid: false,
      error: { status: 400, message: "审计日志数量范围必须是 1-100" },
    });
    expect(buildAuditLogQueryResult({ targetId: "not-a-uuid" })).toMatchObject({
      valid: false,
      error: { status: 400, message: "对象 ID 必须是 UUID" },
    });
    expect(buildAuditLogQueryResult({ actorUserId: "not-a-uuid" })).toMatchObject({
      valid: false,
      error: { status: 400, message: "操作人 ID 必须是 UUID" },
    });
    expect(buildAuditLogQueryResult({ traceId: "x".repeat(121) })).toMatchObject({
      valid: false,
      error: { status: 400, message: "Trace ID 不能超过 120 个字符" },
    });
  });
});

describe("audit log readonly loading", () => {
  it("does not request audit logs without a demo user", async () => {
    const client = createClient({ items: [maskedAuditLog] });

    await expect(loadAuditLogsForDemoUser(client, null, { take: 50 })).resolves.toBeNull();
    await expect(loadAuditLogsForDemoUser(client, "   ", { take: 50 })).resolves.toBeNull();

    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it("requests GET /audit-logs and returns masked list items", async () => {
    const response: AuditLogListResult = { items: [maskedAuditLog] };
    const client = createClient(response);

    await expect(fetchAuditLogs(client, { action: "UPDATE", take: 50 })).resolves.toEqual(response);

    expect(client.get).toHaveBeenCalledWith("/audit-logs", { action: "UPDATE", take: 50 });
    expectReadonlyAuditLogsOnly(client);
  });

  it("requests validated filters only when a demo user and valid query are available", async () => {
    const client = createClient({ items: [maskedAuditLog] });

    await expect(
      loadValidatedAuditLogsForDemoUser(client, "demo-user-id", {
        action: "UPDATE",
        targetType: "ACHIEVEMENT",
        targetId: "20000000-0000-4000-8000-000000000001",
        actorUserId: "40000000-0000-4000-8000-000000000003",
        traceId: "trace-step-18b",
        take: 10,
      }),
    ).resolves.toEqual({ items: [maskedAuditLog] });

    expect(client.get).toHaveBeenCalledWith("/audit-logs", {
      action: "UPDATE",
      targetType: "ACHIEVEMENT",
      targetId: "20000000-0000-4000-8000-000000000001",
      actorUserId: "40000000-0000-4000-8000-000000000003",
      traceId: "trace-step-18b",
      take: 10,
    });
    expectReadonlyAuditLogsOnly(client);
  });

  it("does not request audit logs when validation fails", async () => {
    const client = createClient({ items: [maskedAuditLog] });

    await expect(
      loadValidatedAuditLogsForDemoUser(client, "demo-user-id", { actorUserId: "bad-id" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "操作人 ID 必须是 UUID",
    });

    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it("normalizes empty and malformed responses without inventing records", async () => {
    const client = createClient({ items: [] });
    const malformedClient = createClient({});

    await expect(fetchAuditLogs(client, { take: 50 })).resolves.toEqual({ items: [] });
    await expect(fetchAuditLogs(malformedClient, { take: 50 })).resolves.toEqual({ items: [] });
  });
});

describe("audit log display boundary", () => {
  it("classifies loading, error, empty, and ready states", () => {
    expect(getAuditLogListState(true, null, null)).toBe("loading");
    expect(
      getAuditLogListState(false, { kind: "server", message: "服务不可用" }, null),
    ).toBe("error");
    expect(getAuditLogListState(false, null, null)).toBe("empty");
    expect(getAuditLogListState(false, null, { items: [] })).toBe("empty");
    expect(getAuditLogListState(false, null, { items: [maskedAuditLog] })).toBe("ready");
  });

  it("maps 401, 403, 400, 500, and network errors to page-specific copy", () => {
    const cases: Array<[ApiError, string]> = [
      [{ kind: "unauthorized", status: 401, message: "请选择用户" }, "请选择或切换演示用户"],
      [{ kind: "forbidden", status: 403, message: "无权限" }, "当前角色无审计日志读取权限"],
      [{ kind: "bad-request", status: 400, message: "参数错误" }, "审计日志筛选条件格式不正确"],
      [{ kind: "server", status: 500, message: "服务不可用" }, "审计日志服务暂不可用"],
      [{ kind: "network", message: "服务不可用" }, "无法连接审计日志服务"],
    ];

    cases.forEach(([error, message]) => {
      expect(mapAuditLogErrorToDisplay(error).message).toBe(message);
    });
  });

  it("builds display model only from masked and safe summary fields", () => {
    const rawResponseItem = {
      ...maskedAuditLog,
      oldValue: { token: "raw-old-token" },
      newValue: { password: "raw-new-password" },
      ipAddress: "10.0.0.1",
      userAgent: "Raw browser user agent",
    };

    const display = buildAuditDisplayModel(rawResponseItem);
    const rendered = JSON.stringify(display);

    expect(display.oldValuePreview).toContain("[REDACTED_SENSITIVE]");
    expect(display.newValuePreview).toContain("[REDACTED_SENSITIVE]");
    expect(rendered).not.toContain("raw-old-token");
    expect(rendered).not.toContain("raw-new-password");
    expect(rendered).not.toContain("10.0.0.1");
    expect(rendered).not.toContain("Raw browser user agent");
    expect(display).not.toHaveProperty("oldValue");
    expect(display).not.toHaveProperty("newValue");
    expect(display).not.toHaveProperty("ipAddress");
    expect(display).not.toHaveProperty("userAgent");
  });

  it("defensively redacts sensitive plaintext inside masked value previews", () => {
    const preview = formatMaskedValue({
      token: "plain-token",
      cookie: "plain-cookie",
      password: "plain-password",
      apiKey: "plain-api-key",
      storageKey: "plain-storage-key",
      checksum: "plain-checksum",
      configRef: "plain-config-ref",
      targetSecretLevel: "INTERNAL",
    });

    expect(preview).not.toContain("plain-token");
    expect(preview).not.toContain("plain-cookie");
    expect(preview).not.toContain("plain-password");
    expect(preview).not.toContain("plain-api-key");
    expect(preview).not.toContain("plain-storage-key");
    expect(preview).not.toContain("plain-checksum");
    expect(preview).not.toContain("plain-config-ref");
    expect(preview).toContain("[REDACTED_SENSITIVE]");
    expect(preview).toContain("INTERNAL");
  });

  it("keeps Step 18B boundary GET-only without export, download, or unmasked features", () => {
    expect(getStep18BReadOnlyBoundary()).toEqual({
      endpoint: "/audit-logs",
      method: "GET",
      permission: "audit:read_masked",
      allowedFilters: ["action", "targetType", "targetId", "actorUserId", "traceId", "take"],
      unavailableFeatures: [
        "导出",
        "下载",
        "unmasked 查看",
        "写入",
        "附件能力",
        "系统配置",
        "真实费用写入",
        "seed/migrate/data cleanup",
      ],
    });
  });

  it("summarizes active audit filters for the readonly page", () => {
    expect(
      buildAuditLogFilterSummary({
        action: "UPDATE",
        targetType: "ACHIEVEMENT",
        traceId: "trace-step-18b",
        take: 10,
      }),
    ).toEqual(["动作：更新", "对象：成果", "Trace：trace-step-18b", "数量：10"]);
  });
});
