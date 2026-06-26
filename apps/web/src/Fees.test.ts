import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "./api-client";
import {
  buildCreateFeeRecordPayload,
  buildFeeDetailOpenRequest,
  buildFeeQuery,
  buildMarkFeePaidPayload,
  canManageDepartmentFees,
  canMarkFeePaid,
  classifyFeeWarningRecords,
  createFeeRecord,
  createFeeRecordForDemoUser,
  deriveFeeWarningSummary,
  feeVoucherAttachmentBoundary,
  fetchFeeDetail,
  fetchFeeRecords,
  getFeeDetailState,
  getFeeListState,
  getFeeTypeLabel,
  getPayStatusLabel,
  groupFeeWarnings,
  loadFeeRecordsForDemoUser,
  loadFeeDetailForDemoUser,
  markFeePaid,
  markFeePaidForDemoUser,
  mapFeeDetailErrorToDisplay,
  mapFeeMutationErrorToDisplay,
  refreshFeesAfterMutation,
  shouldShowFeeDetailMarkPaidAction,
  validateCreateFeeForm,
  validateMarkFeePaidForm,
} from "./Fees";
import type { FeeRecord } from "./types";

const baseFee: FeeRecord = {
  id: "fee-id",
  achievementId: "achievement-id",
  departmentId: "department-id",
  feeType: "PATENT_ANNUAL",
  fundSource: "DEPARTMENT",
  amount: "1200.50",
  dueDate: "2026-07-01T00:00:00.000Z",
  paidDate: null,
  payStatus: "PENDING",
  voucherNo: null,
  createdById: "creator-id",
  updatedById: "updater-id",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  archivedAt: null,
};

const createClient = (result: unknown, postResult?: unknown): ApiClient => {
  const get = vi.fn(async () => result) as unknown as ApiClient["get"];
  const post = vi.fn(async () => postResult) as unknown as ApiClient["post"];

  return {
    get,
    post,
    patch: vi.fn(),
  };
};

const collectCalledPaths = (client: ApiClient): string[] => {
  const getCalls = (client.get as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  const postCalls = (client.post as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  const patchCalls = (client.patch as unknown as { mock: { calls: unknown[][] } }).mock.calls;

  return [...getCalls, ...postCalls, ...patchCalls].map(([path]) => String(path));
};

const expectNoAttachmentOrWarningsCalls = (client: ApiClient): void => {
  const calledPaths = collectCalledPaths(client);

  expect(calledPaths.some((path) => path.includes("/fees/warnings"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("attachments"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("upload"))).toBe(false);
  expect(calledPaths.some((path) => path.includes("download"))).toBe(false);
};

describe("buildFeeQuery", () => {
  it("trims exact achievement id and keeps fee filters without pagination assumptions", () => {
    expect(
      buildFeeQuery({
        achievementId: " achievement-id ",
        feeType: "PATENT_ANNUAL",
        payStatus: "OVERDUE",
      }),
    ).toEqual({
      achievementId: "achievement-id",
      feeType: "PATENT_ANNUAL",
      payStatus: "OVERDUE",
      take: 100,
    });
  });

  it("omits blank achievement id", () => {
    expect(buildFeeQuery({ achievementId: "   ", payStatus: "PAID" })).toEqual({
      achievementId: undefined,
      feeType: undefined,
      payStatus: "PAID",
      take: 100,
    });
  });
});

describe("fetchFeeRecords", () => {
  it("requests GET /fees and treats the real response as an array", async () => {
    const client = createClient([baseFee]);

    await expect(fetchFeeRecords(client, { payStatus: "PENDING", take: 100 })).resolves.toEqual([
      baseFee,
    ]);
    expect(client.get).toHaveBeenCalledWith("/fees", { payStatus: "PENDING", take: 100 });
  });

  it("does not pretend a paginated object is a fee list", async () => {
    const client = createClient({ items: [baseFee], total: 1 });

    await expect(fetchFeeRecords(client, { take: 100 })).resolves.toEqual([]);
  });
});

describe("fetchFeeDetail", () => {
  it("requests GET /fees/:id with the fee record id", async () => {
    const client = createClient(baseFee);

    await expect(fetchFeeDetail(client, "fee-id")).resolves.toEqual(baseFee);
    expect(client.get).toHaveBeenCalledWith("/fees/fee-id");
  });

  it("does not request when the detail id is empty", async () => {
    const client = createClient(baseFee);

    await expect(fetchFeeDetail(client, null)).resolves.toBeNull();
    await expect(fetchFeeDetail(client, "   ")).resolves.toBeNull();
    expect(client.get).not.toHaveBeenCalled();
  });

  it("opens detail by fee id instead of achievement id", () => {
    expect(
      buildFeeDetailOpenRequest({
        ...baseFee,
        id: "fee-record-id",
        achievementId: "achievement-id",
      }),
    ).toBe("fee-record-id");
  });

  it("does not call write endpoints or warnings API while reading list and detail", async () => {
    const client = createClient([baseFee]);

    await fetchFeeRecords(client, { take: 100 });
    await fetchFeeDetail(client, baseFee.id);

    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
    expectNoAttachmentOrWarningsCalls(client);
  });
});

describe("fee write helpers", () => {
  it("requests POST /fees with shaped create payload through a fake client", async () => {
    const payload = {
      achievementId: "10000000-0000-4000-8000-000000000001",
      feeType: "PATENT_ANNUAL" as const,
      fundSource: "DEPARTMENT" as const,
      amount: 1200.5,
      dueDate: "2026-07-01",
      voucherNo: "VOUCHER-001",
    };
    const client = createClient([], baseFee);

    await expect(createFeeRecord(client, payload)).resolves.toEqual(baseFee);
    expect(client.post).toHaveBeenCalledWith("/fees", payload);
    expectNoAttachmentOrWarningsCalls(client);
  });

  it("does not request POST /fees without a demo user", async () => {
    const client = createClient([], baseFee);
    const payload = {
      achievementId: "10000000-0000-4000-8000-000000000001",
      feeType: "PATENT_ANNUAL" as const,
      amount: 1200.5,
      dueDate: "2026-07-01",
    };

    await expect(createFeeRecordForDemoUser(client, null, payload)).resolves.toBeNull();
    await expect(createFeeRecordForDemoUser(client, "   ", payload)).resolves.toBeNull();
    expect(client.post).not.toHaveBeenCalled();
  });

  it("requests POST /fees/:id/mark-paid with shaped mark-paid payload through a fake client", async () => {
    const updated = {
      id: "fee-id",
      achievementId: "achievement-id",
      departmentId: "department-id",
      feeType: "PATENT_ANNUAL" as const,
      dueDate: "2026-07-01T00:00:00.000Z",
      paidDate: "2026-07-02T00:00:00.000Z",
      payStatus: "PAID" as const,
      voucherNo: "VOUCHER-PAID",
      updatedById: "updater-id",
      archivedAt: null,
    };
    const payload = { paidDate: "2026-07-02", voucherNo: "VOUCHER-PAID" };
    const client = createClient([], updated);

    await expect(markFeePaid(client, "fee-id", payload)).resolves.toEqual(updated);
    expect(client.post).toHaveBeenCalledWith("/fees/fee-id/mark-paid", payload);
    expectNoAttachmentOrWarningsCalls(client);
  });

  it("does not request mark-paid without a demo user or fee id", async () => {
    const client = createClient([], baseFee);
    const payload = { paidDate: "2026-07-02" };

    await expect(markFeePaid(client, "   ", payload)).resolves.toBeNull();
    await expect(markFeePaidForDemoUser(client, null, "fee-id", payload)).resolves.toBeNull();
    await expect(markFeePaidForDemoUser(client, "   ", "fee-id", payload)).resolves.toBeNull();
    expect(client.post).not.toHaveBeenCalled();
  });
});

describe("loadFeeRecordsForDemoUser", () => {
  it("does not request GET /fees without a demo user", async () => {
    const client = createClient([baseFee]);

    await expect(loadFeeRecordsForDemoUser(client, null, { take: 100 })).resolves.toEqual([]);
    await expect(loadFeeRecordsForDemoUser(client, "   ", { take: 100 })).resolves.toEqual([]);
    expect(client.get).not.toHaveBeenCalled();
  });

  it("requests fee records when a demo user is available", async () => {
    const client = createClient([baseFee]);

    await expect(
      loadFeeRecordsForDemoUser(client, "demo-user-id", { payStatus: "PENDING", take: 100 }),
    ).resolves.toEqual([baseFee]);
    expect(client.get).toHaveBeenCalledOnce();
  });
});

describe("loadFeeDetailForDemoUser", () => {
  it("does not request fee detail without a demo user or detail id", async () => {
    const client = createClient(baseFee);

    await expect(loadFeeDetailForDemoUser(client, null, "fee-id")).resolves.toBeNull();
    await expect(loadFeeDetailForDemoUser(client, "   ", "fee-id")).resolves.toBeNull();
    await expect(loadFeeDetailForDemoUser(client, "demo-user-id", "   ")).resolves.toBeNull();
    expect(client.get).not.toHaveBeenCalled();
  });

  it("requests fee detail when a demo user and fee id are available", async () => {
    const client = createClient(baseFee);

    await expect(loadFeeDetailForDemoUser(client, "demo-user-id", "fee-id")).resolves.toEqual(
      baseFee,
    );
    expect(client.get).toHaveBeenCalledWith("/fees/fee-id");
  });
});

describe("getFeeListState", () => {
  it("reports loading, error, empty, and ready states", () => {
    expect(getFeeListState({ loading: true, data: null, error: null }, false)).toEqual({
      kind: "loading",
    });
    expect(
      getFeeListState(
        {
          loading: false,
          data: null,
          error: { kind: "server", message: "服务不可用" },
        },
        false,
      ),
    ).toEqual({ kind: "error" });
    expect(getFeeListState({ loading: false, data: [], error: null }, false)).toEqual({
      kind: "empty",
      emptyText: "暂无费用记录",
    });
    expect(getFeeListState({ loading: false, data: [], error: null }, true)).toEqual({
      kind: "empty",
      emptyText: "没有匹配的费用记录",
    });
    expect(getFeeListState({ loading: false, data: [baseFee], error: null }, false)).toEqual({
      kind: "ready",
    });
  });
});

describe("getFeeDetailState", () => {
  it("reports loading, error, empty, and ready states", () => {
    expect(getFeeDetailState({ loading: true, data: null, error: null })).toEqual({
      kind: "loading",
    });
    expect(
      getFeeDetailState({
        loading: false,
        data: null,
        error: { kind: "forbidden", message: "Forbidden", status: 403 },
      }),
    ).toEqual({ kind: "error" });
    expect(getFeeDetailState({ loading: false, data: null, error: null })).toEqual({
      kind: "empty",
      emptyText: "请选择一条费用记录查看详情",
    });
    expect(getFeeDetailState({ loading: false, data: baseFee, error: null })).toEqual({
      kind: "ready",
    });
  });
});

describe("fee form validation and payload shaping", () => {
  it("validates required create-fee fields, UUID, amount, date, and voucher length", () => {
    const errors = validateCreateFeeForm({
      achievementId: "not-a-uuid",
      feeType: undefined,
      fundSource: undefined,
      amount: "12.345",
      dueDate: "2026-02-31",
      voucherNo: "x".repeat(121),
    });

    expect(errors).toEqual({
      achievementId: "成果 ID 必须是 UUID。",
      feeType: "请选择费用类型。",
      amount: "金额必须为不小于 0 且最多 2 位小数的数字。",
      dueDate: "截止日期必须是有效日期。",
      voucherNo: "凭证编号不能超过 120 个字符。",
    });
  });

  it("builds create-fee payload with trimmed optional voucher number", () => {
    expect(
      buildCreateFeeRecordPayload({
        achievementId: " 10000000-0000-4000-8000-000000000001 ",
        feeType: "PATENT_ANNUAL",
        fundSource: "DEPARTMENT",
        amount: "1200.50",
        dueDate: "2026-07-01",
        voucherNo: " VOUCHER-001 ",
      }),
    ).toEqual({
      errors: {},
      payload: {
        achievementId: "10000000-0000-4000-8000-000000000001",
        feeType: "PATENT_ANNUAL",
        fundSource: "DEPARTMENT",
        amount: 1200.5,
        dueDate: "2026-07-01",
        voucherNo: "VOUCHER-001",
      },
    });
  });

  it("validates optional mark-paid date and voucher number", () => {
    expect(
      validateMarkFeePaidForm({
        paidDate: "2026-02-31",
        voucherNo: "x".repeat(121),
      }),
    ).toEqual({
      paidDate: "缴费日期必须是有效日期。",
      voucherNo: "凭证编号不能超过 120 个字符。",
    });
  });

  it("builds mark-paid payload and allows backend default paidDate", () => {
    expect(
      buildMarkFeePaidPayload({
        paidDate: "",
        voucherNo: " VOUCHER-PAID ",
      }),
    ).toEqual({
      errors: {},
      payload: {
        paidDate: undefined,
        voucherNo: "VOUCHER-PAID",
      },
    });
  });
});

describe("mark-paid visibility", () => {
  it("uses fee:manage_department for fee write entry visibility", () => {
    expect(
      canManageDepartmentFees({
        permissionCodes: ["fee:manage_department"],
      }),
    ).toBe(true);
    expect(
      canManageDepartmentFees({
        permissionCodes: ["fee:read_department"],
      }),
    ).toBe(false);
    expect(canManageDepartmentFees(undefined)).toBe(false);
    expect(
      shouldShowFeeDetailMarkPaidAction(baseFee, "management", false),
    ).toBe(false);
    expect(shouldShowFeeDetailMarkPaidAction(baseFee, "management", true)).toBe(true);
  });

  it("shows mark-paid only for pending and overdue fee records", () => {
    expect(canMarkFeePaid({ payStatus: "PENDING" })).toBe(true);
    expect(canMarkFeePaid({ payStatus: "OVERDUE" })).toBe(true);
    expect(canMarkFeePaid({ payStatus: "PAID" })).toBe(false);
    expect(canMarkFeePaid({ payStatus: "WAIVED" })).toBe(false);
    expect(canMarkFeePaid({ payStatus: "CANCELLED" })).toBe(false);
  });

  it("hides mark-paid in search readonly fee detail mode", () => {
    expect(shouldShowFeeDetailMarkPaidAction(baseFee, "management")).toBe(true);
    expect(shouldShowFeeDetailMarkPaidAction(baseFee, "search-readonly")).toBe(false);
    expect(
      shouldShowFeeDetailMarkPaidAction({ ...baseFee, payStatus: "OVERDUE" }, "search-readonly"),
    ).toBe(false);
    expect(
      shouldShowFeeDetailMarkPaidAction({ ...baseFee, payStatus: "PAID" }, "management"),
    ).toBe(false);
  });
});

describe("voucher attachment boundary", () => {
  it("states voucherNo is a voucher number, not a voucher attachment feature", () => {
    expect(feeVoucherAttachmentBoundary.title).toBe("凭证附件能力边界");
    expect(feeVoucherAttachmentBoundary.description).toContain("voucherNo");
    expect(feeVoucherAttachmentBoundary.description).toContain("凭证编号");
    expect(feeVoucherAttachmentBoundary.description).toContain("不等于凭证附件文件");
    expect(feeVoucherAttachmentBoundary.description).toContain("不提供费用凭证附件上传/下载");
    expect(feeVoucherAttachmentBoundary.description).toContain("后续单独确认费用凭证附件接口与数据路线");
  });

  it("does not claim fake voucher attachment success or download capability", () => {
    const copy = `${feeVoucherAttachmentBoundary.title} ${feeVoucherAttachmentBoundary.description}`;

    expect(copy).not.toContain("上传成功");
    expect(copy).not.toContain("可下载凭证文件");
    expect(copy).not.toContain("凭证文件已上传");
    expect(copy).not.toContain("下载地址");
    expect(copy).not.toContain("上传控件");
  });
});

describe("refreshFeesAfterMutation", () => {
  it("refreshes list and currently opened detail after a simulated write success", async () => {
    const detail = { ...baseFee, id: "fee-id", payStatus: "PAID" as const };
    const get = vi
      .fn()
      .mockResolvedValueOnce([baseFee])
      .mockResolvedValueOnce(detail) as unknown as ApiClient["get"];
    const client: ApiClient = {
      get,
      post: vi.fn(),
      patch: vi.fn(),
    };
    const onFees = vi.fn();
    const onDetail = vi.fn();

    await refreshFeesAfterMutation({
      client,
      demoUserId: "demo-user-id",
      query: { take: 100 },
      selectedFeeId: "fee-id",
      onFees,
      onDetail,
    });

    expect(client.get).toHaveBeenCalledWith("/fees", { take: 100 });
    expect(client.get).toHaveBeenCalledWith("/fees/fee-id");
    expect(onFees).toHaveBeenCalledWith([baseFee]);
    expect(onDetail).toHaveBeenCalledWith(detail);
    expect(client.post).not.toHaveBeenCalled();
    expectNoAttachmentOrWarningsCalls(client);
  });
});

describe("classifyFeeWarningRecords", () => {
  it("classifies fee records from dueDate and payStatus with terminal statuses taking precedence", () => {
    const today = new Date("2026-06-20T08:00:00.000Z");
    const records: FeeRecord[] = [
      {
        ...baseFee,
        id: "overdue-status",
        payStatus: "OVERDUE",
        dueDate: "2026-08-01T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "overdue-date",
        payStatus: "PENDING",
        dueDate: "2026-06-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "due-soon",
        payStatus: "PENDING",
        dueDate: "2026-07-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "pending-later",
        payStatus: "PENDING",
        dueDate: "2026-08-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "pending-invalid-date",
        payStatus: "PENDING",
        dueDate: "not-a-date",
      },
      {
        ...baseFee,
        id: "paid-past-due",
        payStatus: "PAID",
        dueDate: "2026-06-01T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "waived-past-due",
        payStatus: "WAIVED",
        dueDate: "2026-06-01T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "cancelled-past-due",
        payStatus: "CANCELLED",
        dueDate: "2026-06-01T00:00:00.000Z",
      },
    ];

    expect(
      classifyFeeWarningRecords(records, today).map(({ key, record }) => [record.id, key]),
    ).toEqual([
      ["overdue-status", "overdue"],
      ["overdue-date", "overdue"],
      ["due-soon", "dueSoon"],
      ["pending-later", "pendingLater"],
      ["pending-invalid-date", "pendingLater"],
      ["paid-past-due", "terminal"],
      ["waived-past-due", "terminal"],
      ["cancelled-past-due", "terminal"],
    ]);
  });

  it("keeps summary counts and warning groups consistent with the shared classification", () => {
    const today = new Date("2026-06-20T08:00:00.000Z");
    const records: FeeRecord[] = [
      { ...baseFee, id: "overdue-status", payStatus: "OVERDUE" },
      { ...baseFee, id: "overdue-date", payStatus: "PENDING", dueDate: "2026-06-10T00:00:00.000Z" },
      { ...baseFee, id: "due-soon", payStatus: "PENDING", dueDate: "2026-07-10T00:00:00.000Z" },
      { ...baseFee, id: "pending-later", payStatus: "PENDING", dueDate: "2026-08-10T00:00:00.000Z" },
      { ...baseFee, id: "paid", payStatus: "PAID", dueDate: "2026-06-01T00:00:00.000Z" },
      { ...baseFee, id: "cancelled", payStatus: "CANCELLED", dueDate: "2026-06-01T00:00:00.000Z" },
    ];
    const classifications = classifyFeeWarningRecords(records, today);
    const idsFor = (key: string) =>
      classifications
        .filter((classification) => classification.key === key)
        .map((classification) => classification.record.id);
    const groups = groupFeeWarnings(records, today);
    const summary = deriveFeeWarningSummary(records, today);

    expect(summary.overdue).toBe(idsFor("overdue").length);
    expect(summary.dueSoon).toBe(idsFor("dueSoon").length);
    expect(groups.find((group) => group.key === "overdue")?.records.map((record) => record.id)).toEqual(
      idsFor("overdue"),
    );
    expect(groups.find((group) => group.key === "dueSoon")?.records.map((record) => record.id)).toEqual(
      idsFor("dueSoon"),
    );
    expect(
      groups.find((group) => group.key === "pendingLater")?.records.map((record) => record.id),
    ).toEqual(idsFor("pendingLater"));
    expect(groups.find((group) => group.key === "terminal")?.records.map((record) => record.id)).toEqual(
      idsFor("terminal"),
    );
  });
});

describe("deriveFeeWarningSummary", () => {
  it("derives overdue, due-soon, paid, and pending summaries from dueDate and payStatus", () => {
    const today = new Date("2026-06-20T08:00:00.000Z");
    const records: FeeRecord[] = [
      {
        ...baseFee,
        id: "overdue-status",
        payStatus: "OVERDUE",
        dueDate: "2026-08-01T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "overdue-date",
        payStatus: "PENDING",
        dueDate: "2026-06-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "due-soon",
        payStatus: "PENDING",
        dueDate: "2026-07-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "paid",
        payStatus: "PAID",
        dueDate: "2026-06-01T00:00:00.000Z",
        paidDate: "2026-05-30T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "cancelled",
        payStatus: "CANCELLED",
        dueDate: "2026-06-01T00:00:00.000Z",
      },
    ];

    expect(deriveFeeWarningSummary(records, today)).toEqual({
      total: 5,
      overdue: 2,
      dueSoon: 1,
      paid: 1,
      pending: 2,
    });
  });
});

describe("groupFeeWarnings", () => {
  it("groups overdue, due-soon, pending-later, and terminal fee records", () => {
    const today = new Date("2026-06-20T08:00:00.000Z");
    const records: FeeRecord[] = [
      {
        ...baseFee,
        id: "overdue-status",
        payStatus: "OVERDUE",
        dueDate: "2026-08-01T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "overdue-date",
        payStatus: "PENDING",
        dueDate: "2026-06-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "due-soon",
        payStatus: "PENDING",
        dueDate: "2026-07-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "pending-later",
        payStatus: "PENDING",
        dueDate: "2026-08-10T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "paid",
        payStatus: "PAID",
        dueDate: "2026-06-01T00:00:00.000Z",
        paidDate: "2026-05-30T00:00:00.000Z",
      },
      {
        ...baseFee,
        id: "waived",
        payStatus: "WAIVED",
      },
      {
        ...baseFee,
        id: "cancelled",
        payStatus: "CANCELLED",
      },
    ];

    const grouped = groupFeeWarnings(records, today);

    expect(grouped.find((group) => group.key === "overdue")?.records.map((record) => record.id)).toEqual([
      "overdue-status",
      "overdue-date",
    ]);
    expect(grouped.find((group) => group.key === "dueSoon")?.records.map((record) => record.id)).toEqual([
      "due-soon",
    ]);
    expect(
      grouped.find((group) => group.key === "pendingLater")?.records.map((record) => record.id),
    ).toEqual(["pending-later"]);
    expect(grouped.find((group) => group.key === "terminal")?.records.map((record) => record.id)).toEqual([
      "paid",
      "waived",
      "cancelled",
    ]);
  });
});

describe("mapFeeDetailErrorToDisplay", () => {
  it("maps 403 detail errors to no-permission copy", () => {
    expect(
      mapFeeDetailErrorToDisplay({ kind: "forbidden", message: "Forbidden", status: 403 })
        .message,
    ).toBe("当前用户无权查看该费用详情");
  });

  it("maps 404 detail errors to invisible-or-missing copy", () => {
    expect(
      mapFeeDetailErrorToDisplay({ kind: "unknown", message: "Not found", status: 404 })
        .message,
    ).toBe("费用记录不存在或不可见");
  });

  it("maps 500 and network detail errors to retryable service copy", () => {
    expect(
      mapFeeDetailErrorToDisplay({ kind: "server", message: "Server error", status: 500 })
        .message,
    ).toBe("服务暂不可用，可重试");
    expect(mapFeeDetailErrorToDisplay({ kind: "network", message: "Network error" }).message).toBe(
      "服务暂不可用，可重试",
    );
  });
});

describe("mapFeeMutationErrorToDisplay", () => {
  it("maps write validation, permission, not-found, conflict, server, and network errors", () => {
    expect(
      mapFeeMutationErrorToDisplay({ kind: "bad-request", message: "Bad request", status: 400 })
        .message,
    ).toBe("费用表单内容不符合要求");
    expect(
      mapFeeMutationErrorToDisplay({ kind: "forbidden", message: "Forbidden", status: 403 })
        .message,
    ).toBe("当前用户无权执行费用写操作");
    expect(
      mapFeeMutationErrorToDisplay({ kind: "unknown", message: "Not found", status: 404 })
        .message,
    ).toBe("相关成果或费用记录不存在或不可见");
    expect(
      mapFeeMutationErrorToDisplay({ kind: "unknown", message: "Conflict", status: 409 })
        .message,
    ).toBe("费用记录状态冲突，请刷新后重试");
    expect(
      mapFeeMutationErrorToDisplay({ kind: "server", message: "Server", status: 500 }).message,
    ).toBe("服务暂不可用，可重试");
    expect(mapFeeMutationErrorToDisplay({ kind: "network", message: "Network" }).message).toBe(
      "服务暂不可用，可重试",
    );
  });
});

describe("fee labels", () => {
  it("keeps backend enums visible with user-facing labels", () => {
    expect(getFeeTypeLabel("PATENT_ANNUAL")).toBe("专利年费");
    expect(getPayStatusLabel("PENDING")).toBe("待缴");
    expect(getPayStatusLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});
