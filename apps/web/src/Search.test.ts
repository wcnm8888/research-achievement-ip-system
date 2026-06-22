import { describe, expect, it, vi } from "vitest";
import type { ApiClient, ApiError } from "./api-client";
import {
  buildAchievementDetailOpenRequest,
  buildAchievementDisplayModel,
  buildFeeDisplayModel,
  buildSearchFeeDetailOpenRequest,
  buildSearchFilterSummary,
  buildSearchQuery,
  buildSearchQueryResult,
  fetchSearchResults,
  getSearchListState,
  getSearchTargetTypes,
  groupSearchResults,
  loadSearchForDemoUser,
  loadValidatedSearchForDemoUser,
  mapSearchErrorToDisplay,
  summarizeSearchResults,
} from "./Search";
import type {
  SearchAchievementResultItem,
  SearchFeeResultItem,
  SearchResult,
} from "./types";

const visibleAchievement: SearchAchievementResultItem = {
  targetType: "ACHIEVEMENT",
  id: "achievement-id",
  type: "PATENT",
  status: "ARCHIVED",
  departmentId: "department-id",
  secretLevel: "INTERNAL",
  title: "高可靠检索专利",
  identifiers: {
    patentApplicationNo: "CN202600001",
    patentGrantNo: "ZL202600001",
  },
  redacted: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const redactedAchievement: SearchAchievementResultItem = {
  ...visibleAchievement,
  id: "redacted-achievement-id",
  title: null,
  identifiers: {},
  redacted: true,
};

const feeResult: SearchFeeResultItem = {
  targetType: "FEE_RECORD",
  id: "fee-id",
  achievementId: "achievement-id",
  departmentId: "department-id",
  feeType: "PATENT_ANNUAL",
  payStatus: "PENDING",
  dueDate: "2026-07-01T00:00:00.000Z",
  paidDate: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
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

const expectReadonlySearchOnly = (client: ApiClient): void => {
  const calledPaths = collectCalledPaths(client);

  expect(client.post).not.toHaveBeenCalled();
  expect(client.patch).not.toHaveBeenCalled();
  expect(calledPaths.every((path) => path === "/search")).toBe(true);
  expect(calledPaths.some((path) => path.includes("/fees/warnings"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("search_logs"))).toBe(false);
  expect(calledPaths.some((path) => path.toLowerCase().includes("meilisearch"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("settings/config"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("attachments"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("upload"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("download"))).toBe(false);
};

describe("buildSearchQuery", () => {
  it("trims keyword, keeps take, and sends targetTypes as an array", () => {
    expect(
      buildSearchQuery({
        keyword: "  demo patent  ",
        targetType: "ACHIEVEMENT",
      }),
    ).toEqual({
      keyword: "demo patent",
      targetTypes: ["ACHIEVEMENT"],
      achievementType: undefined,
      achievementStatus: undefined,
      feeType: undefined,
      payStatus: undefined,
      departmentId: undefined,
      take: 20,
    });
  });

  it("omits blank keyword and targetTypes for all results", () => {
    expect(buildSearchQuery({ keyword: "   ", targetType: "ALL" })).toEqual({
      keyword: undefined,
      targetTypes: undefined,
      achievementType: undefined,
      achievementStatus: undefined,
      feeType: undefined,
      payStatus: undefined,
      departmentId: undefined,
      take: 20,
    });
  });

  it("clamps take to the backend-supported 1-50 range", () => {
    expect(buildSearchQuery({ targetType: "FEE_RECORD" }, 99)).toEqual({
      keyword: undefined,
      targetTypes: ["FEE_RECORD"],
      achievementType: undefined,
      achievementStatus: undefined,
      feeType: undefined,
      payStatus: undefined,
      departmentId: undefined,
      take: 50,
    });
    expect(buildSearchQuery({}, 0).take).toBe(1);
  });

  it("keeps explicit multiple targetTypes for GET /search request shaping", () => {
    expect(
      buildSearchQuery({
        keyword: " demo ",
        targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
        take: 10,
      }),
    ).toEqual({
      keyword: "demo",
      targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
      achievementType: undefined,
      achievementStatus: undefined,
      feeType: undefined,
      payStatus: undefined,
      departmentId: undefined,
      take: 10,
    });
  });

  it("treats an empty target type selection as all results", () => {
    expect(
      buildSearchQuery({
        targetType: "FEE_RECORD",
        targetTypes: [],
      }),
    ).toEqual({
      keyword: undefined,
      targetTypes: undefined,
      achievementType: undefined,
      achievementStatus: undefined,
      feeType: undefined,
      payStatus: undefined,
      departmentId: undefined,
      take: 20,
    });
  });

  it("normalizes UI target type selections for request shaping", () => {
    expect(getSearchTargetTypes({ targetTypes: ["ACHIEVEMENT", "FEE_RECORD"] })).toEqual([
      "ACHIEVEMENT",
      "FEE_RECORD",
    ]);
    expect(getSearchTargetTypes({ targetTypes: [] })).toBeUndefined();
    expect(getSearchTargetTypes({ targetType: "ACHIEVEMENT" })).toEqual(["ACHIEVEMENT"]);
    expect(getSearchTargetTypes({ targetType: "ALL" })).toBeUndefined();
  });

  it("shapes advanced readonly filters supported by GET /search", () => {
    expect(
      buildSearchQuery({
        keyword: " demo ",
        targetType: "ACHIEVEMENT",
        achievementType: "PATENT",
        achievementStatus: "ARCHIVED",
        feeType: "PATENT_ANNUAL",
        payStatus: "PENDING",
        departmentId: " 10000000-0000-4000-8000-000000000002 ",
        take: 12,
      }),
    ).toEqual({
      keyword: "demo",
      targetTypes: ["ACHIEVEMENT"],
      achievementType: "PATENT",
      achievementStatus: "ARCHIVED",
      feeType: "PATENT_ANNUAL",
      payStatus: "PENDING",
      departmentId: "10000000-0000-4000-8000-000000000002",
      take: 12,
    });
  });

  it("returns a validation error for invalid department UUID", () => {
    const result = buildSearchQueryResult({ departmentId: "not-a-uuid" });

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.error).toMatchObject({
        kind: "bad-request",
        status: 400,
        message: "部门 ID 必须是 UUID",
      });
    }
  });
});

describe("fetchSearchResults", () => {
  it("requests GET /search with keyword, take, and targetTypes", async () => {
    const response: SearchResult = {
      items: [visibleAchievement],
      total: 1,
    };
    const client = createClient(response);

    await expect(
      fetchSearchResults(client, {
        keyword: "demo",
        targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
        take: 20,
      }),
    ).resolves.toEqual(response);

    expect(client.get).toHaveBeenCalledWith("/search", {
      keyword: "demo",
      targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
      take: 20,
    });
    expectReadonlySearchOnly(client);
  });

  it("normalizes malformed response totals without inventing items", async () => {
    const client = createClient({ items: [visibleAchievement] });

    await expect(fetchSearchResults(client, { take: 20 })).resolves.toEqual({
      items: [visibleAchievement],
      total: 1,
    });
  });
});

describe("loadSearchForDemoUser", () => {
  it("does not request search without a demo user", async () => {
    const client = createClient({ items: [visibleAchievement], total: 1 });

    await expect(loadSearchForDemoUser(client, null, { take: 20 })).resolves.toBeNull();
    await expect(loadSearchForDemoUser(client, "   ", { take: 20 })).resolves.toBeNull();
    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it("requests search when a demo user is available", async () => {
    const client = createClient({ items: [visibleAchievement], total: 1 });

    await expect(loadSearchForDemoUser(client, "demo-user-id", { take: 20 })).resolves.toEqual({
      items: [visibleAchievement],
      total: 1,
    });
    expect(client.get).toHaveBeenCalledWith("/search", { take: 20 });
    expectReadonlySearchOnly(client);
  });

  it("requests validated advanced filters for a demo user", async () => {
    const client = createClient({ items: [visibleAchievement], total: 1 });

    await expect(
      loadValidatedSearchForDemoUser(client, "demo-user-id", {
        keyword: " demo ",
        targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
        achievementType: "PATENT",
        achievementStatus: "ARCHIVED",
        departmentId: "10000000-0000-4000-8000-000000000002",
        take: 8,
      }),
    ).resolves.toEqual({
      items: [visibleAchievement],
      total: 1,
    });

    expect(client.get).toHaveBeenCalledWith("/search", {
      keyword: "demo",
      targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
      achievementType: "PATENT",
      achievementStatus: "ARCHIVED",
      feeType: undefined,
      payStatus: undefined,
      departmentId: "10000000-0000-4000-8000-000000000002",
      take: 8,
    });
    expectReadonlySearchOnly(client);
  });

  it("does not request search when department id is invalid", async () => {
    const client = createClient({ items: [visibleAchievement], total: 1 });

    await expect(
      loadValidatedSearchForDemoUser(client, "demo-user-id", {
        departmentId: "not-a-uuid",
      }),
    ).rejects.toMatchObject({
      kind: "bad-request",
      status: 400,
      message: "部门 ID 必须是 UUID",
    });
    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
  });
});

describe("search states and errors", () => {
  it("classifies loading, empty, error, and ready states", () => {
    expect(getSearchListState(true, null, null)).toBe("loading");
    expect(
      getSearchListState(false, { kind: "server", message: "服务不可用" }, null),
    ).toBe("error");
    expect(getSearchListState(false, null, null)).toBe("empty");
    expect(getSearchListState(false, null, { items: [], total: 0 })).toBe("empty");
    expect(getSearchListState(false, null, { items: [visibleAchievement], total: 1 })).toBe(
      "ready",
    );
  });

  it("maps search HTTP and network errors to page-specific copy", () => {
    const cases: Array<[ApiError, string]> = [
      [{ kind: "bad-request", status: 400, message: "请求参数错误" }, "检索条件格式不正确"],
      [{ kind: "unauthorized", status: 401, message: "请选择或切换演示用户" }, "请选择或切换演示用户"],
      [{ kind: "forbidden", status: 403, message: "当前角色无权限" }, "当前角色无检索权限"],
      [{ kind: "server", status: 500, message: "服务不可用" }, "检索服务暂不可用"],
      [{ kind: "network", message: "服务不可用" }, "无法连接检索服务"],
    ];

    cases.forEach(([error, message]) => {
      expect(mapSearchErrorToDisplay(error).message).toBe(message);
    });
  });
});

describe("search result display models", () => {
  it("shows visible achievement titles and identifiers", () => {
    expect(buildAchievementDisplayModel(visibleAchievement)).toEqual({
      kind: "achievement",
      id: "achievement-id",
      title: "高可靠检索专利",
      redacted: false,
      identifiers: [
        { label: "申请号", value: "CN202600001" },
        { label: "授权号", value: "ZL202600001" },
      ],
    });
  });

  it("does not leak redacted achievement titles or identifiers", () => {
    expect(buildAchievementDisplayModel(redactedAchievement)).toEqual({
      kind: "achievement",
      id: "redacted-achievement-id",
      title: null,
      redacted: true,
      identifiers: [],
    });
  });

  it("opens achievement detail from the achievement result id only", () => {
    expect(buildAchievementDetailOpenRequest(visibleAchievement)).toBe("achievement-id");
    expect(buildAchievementDetailOpenRequest(redactedAchievement)).toBe(
      "redacted-achievement-id",
    );
  });

  it("keeps fee display limited to readonly search fields", () => {
    const model = buildFeeDisplayModel(feeResult);

    expect(model).toEqual(
      expect.objectContaining({
        kind: "fee",
        id: "fee-id",
        achievementId: "achievement-id",
        feeTypeLabel: "专利年费",
        payStatusLabel: "待缴",
        paidDate: "未返回",
        departmentId: "department-id",
      }),
    );
    expect(model).not.toHaveProperty("amount");
    expect(model).not.toHaveProperty("voucherNo");
    expect(model).not.toHaveProperty("attachment");
    expect(model).not.toHaveProperty("downloadUrl");
    expect(model).not.toHaveProperty("detailOpenRequest");
  });

  it("opens fee detail from the fee record result id only", () => {
    expect(buildSearchFeeDetailOpenRequest(feeResult)).toBe("fee-id");
    expect(
      buildSearchFeeDetailOpenRequest({
        ...feeResult,
        id: "fee-record-id",
        achievementId: "achievement-id",
      }),
    ).toBe("fee-record-id");
  });

  it("covers mixed ACHIEVEMENT and FEE_RECORD result payloads", async () => {
    const client = createClient({
      items: [visibleAchievement, feeResult],
      total: 2,
    });

    const result = await fetchSearchResults(client, { keyword: "demo", take: 20 });

    expect(result.items.map((item) => item.targetType)).toEqual(["ACHIEVEMENT", "FEE_RECORD"]);
    expectReadonlySearchOnly(client);
  });

  it("summarizes and groups result payloads without changing field boundaries", () => {
    const items = [visibleAchievement, redactedAchievement, feeResult];

    expect(summarizeSearchResults(items, 5)).toEqual({
      total: 5,
      achievementCount: 2,
      feeCount: 1,
      redactedAchievementCount: 1,
    });
    expect(groupSearchResults(items)).toEqual({
      achievements: [visibleAchievement, redactedAchievement],
      fees: [feeResult],
    });
  });

  it("builds a readable filter summary", () => {
    expect(
      buildSearchFilterSummary({
        keyword: " demo ",
        targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
        feeType: "PATENT_ANNUAL",
        payStatus: "PENDING",
        take: 10,
      }),
    ).toEqual([
      "关键词：demo",
      "结果类型：成果、费用",
      "目标类型：前端 request shaping，不证明后端搜索语义",
      "费用类型：专利年费",
      "缴费状态：待缴",
      "数量：10",
    ]);
  });
});
