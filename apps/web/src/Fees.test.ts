import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "./api-client";
import {
  approveFeeReview,
  approveFeeReviewForDemoUser,
  buildCreateFeeRecordPayload,
  buildFeeDetailOpenRequest,
  buildFeeQuery,
  buildFeeReviewActionPayload,
  buildFeeReviewHistoryColumns,
  buildFeeReviewHistoryRefreshKey,
  buildFeeReviewWorkflowTaskRefreshKey,
  buildFeeStatusActionPayload,
  buildFeeVoucherAttachmentFormData,
  buildMarkFeePaidPayload,
  fetchFeeReviewWorkflowTasks,
  findPendingFeeReviewWorkflowTask,
  canManageDepartmentFees,
  canMarkFeePaid,
  canReadFeeReviewHistory,
  canReadFeeVoucherAttachments,
  canReviewDepartmentFees,
  canReviewFee,
  canUploadFeeVoucherAttachments,
  canWaiveOrCancelFee,
  classifyFeeWarningRecords,
  cancelFee,
  cancelFeeForDemoUser,
  createFeeRecord,
  createFeeRecordForDemoUser,
  deriveFeeWarningSummary,
  downloadFeeVoucherAttachment,
  feeVoucherAttachmentBoundary,
  exportFeeCsv,
  exportFeeXlsx,
  fetchFeeDetail,
  fetchFeeRecords,
  fetchFeeReviewHistory,
  fetchFeeVoucherAttachmentDetail,
  fetchFeeVoucherAttachments,
  getFeeDetailState,
  getFeeListState,
  getFeeReviewHistoryActionLabel,
  getFeeReviewHistoryState,
  getFeeReviewStatusLabel,
  getFeeTypeLabel,
  getPayStatusLabel,
  groupFeeWarnings,
  loadFeeRecordsForDemoUser,
  loadFeeDetailForDemoUser,
  loadFeeReviewHistoryForDemoUser,
  markFeePaid,
  markFeePaidForDemoUser,
  mapFeeDetailErrorToDisplay,
  mapFeeReviewHistoryErrorToDisplay,
  mapFeeMutationErrorToDisplay,
  previewFeeVoucherAttachment,
  refreshFeesAfterMutation,
  rejectFeeReview,
  rejectFeeReviewForDemoUser,
  shouldShowFeeDetailMarkPaidAction,
  shouldShowFeeDetailReviewActions,
  shouldLoadFeeReviewWorkflowTasks,
  shouldLoadFeeReviewHistory,
  shouldShowFeeDetailStatusActions,
  shouldLoadFeeVoucherAttachmentDetail,
  shouldLoadFeeVoucherAttachments,
  uploadFeeVoucherAttachment,
  validateCreateFeeForm,
  validateFeeReviewActionForm,
  validateFeeStatusActionForm,
  validateMarkFeePaidForm,
  waiveFee,
  waiveFeeForDemoUser,
} from "./Fees";
import type { AttachmentMetadata, FeeRecord, FeeReviewHistoryEntry, WorkflowTask } from "./types";

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
  reviewStatus: "PENDING",
  reviewedById: null,
  reviewedAt: null,
  createdById: "creator-id",
  updatedById: "updater-id",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  archivedAt: null,
};

const baseFeeAttachment: AttachmentMetadata = {
  id: "attachment-id",
  relationType: "FEE_RECORD",
  relationId: "fee-id",
  fileName: "receipt.pdf",
  mimeType: "application/pdf",
  sizeBytes: 1024,
  storageProvider: "LOCAL",
  originalName: "receipt.pdf",
  storedName: null,
  version: 1,
  uploaderId: "uploader-id",
  secretLevel: "INTERNAL",
  status: "ACTIVE",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
  archivedAt: null,
};

const baseFeeReviewHistory: FeeReviewHistoryEntry = {
  id: "history-id",
  feeRecordId: "fee-id",
  departmentId: "department-id",
  reviewerId: "12345678-0000-4000-8000-00000000abcd",
  action: "APPROVE",
  fromStatus: "PENDING",
  toStatus: "APPROVED",
  reason: "finance checked",
  createdAt: "2026-07-01T08:00:00.000Z",
};

const baseFeeReviewWorkflowTask: WorkflowTask = {
  id: "task-id",
  instanceId: "instance-id",
  assigneeId: "12345678-0000-4000-8000-00000000abcd",
  stepCode: "FEE_REVIEW",
  status: "PENDING",
  createdAt: "2026-07-01T08:00:00.000Z",
  updatedAt: "2026-07-01T08:05:00.000Z",
  claimedAt: null,
  completedAt: null,
  instance: {
    targetType: "FEE_RECORD",
    targetId: "fee-id",
    status: "ACTIVE",
    currentStep: "FEE_REVIEW",
  },
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

describe("fee CSV export", () => {
  it("downloads the fee ledger with applied filters only", async () => {
    const downloadBlob = vi.fn(async () => new Blob(["csv"]));

    await exportFeeCsv(
      { downloadBlob },
      {
        achievementId: " achievement-id ",
        feeType: "PATENT_ANNUAL",
        payStatus: "OVERDUE",
      },
      ["payStatus", "id", "amount"],
    );

    expect(downloadBlob).toHaveBeenCalledWith("/fees/export.csv", {
      achievementId: "achievement-id",
      feeType: "PATENT_ANNUAL",
      payStatus: "OVERDUE",
      fields: "payStatus,id,amount",
    });
  });

  it("downloads the fee ledger Excel with applied filters only", async () => {
    const downloadBlob = vi.fn(async () => new Blob(["xlsx"]));

    await exportFeeXlsx(
      { downloadBlob },
      {
        achievementId: " achievement-id ",
        feeType: "PATENT_ANNUAL",
        payStatus: "OVERDUE",
      },
      ["id", "payStatus"],
    );

    expect(downloadBlob).toHaveBeenCalledWith("/fees/export.xlsx", {
      achievementId: "achievement-id",
      feeType: "PATENT_ANNUAL",
      payStatus: "OVERDUE",
      fields: "id,payStatus",
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

describe("fee voucher attachment client", () => {
  it("lists and reads fee voucher attachment metadata through Step 56B routes", async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce([baseFeeAttachment])
      .mockResolvedValueOnce(baseFeeAttachment) as unknown as ApiClient["get"];
    const client: ApiClient = {
      get,
      post: vi.fn(),
      patch: vi.fn(),
    };

    await expect(fetchFeeVoucherAttachments(client, "fee-id")).resolves.toEqual([
      baseFeeAttachment,
    ]);
    await expect(
      fetchFeeVoucherAttachmentDetail(client, "fee-id", "attachment-id"),
    ).resolves.toEqual(baseFeeAttachment);

    expect(client.get).toHaveBeenCalledWith("/fees/fee-id/voucher-attachments", {
      take: 50,
    });
    expect(client.get).toHaveBeenCalledWith(
      "/fees/fee-id/voucher-attachments/attachment-id",
    );
  });

  it("uploads fee voucher attachments as multipart form data", async () => {
    const postForm = vi.fn().mockResolvedValue(baseFeeAttachment) as unknown as NonNullable<
      ApiClient["postForm"]
    >;
    const client: ApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      postForm,
    };
    const file = new File(["synthetic"], "receipt.pdf", { type: "application/pdf" });
    const formData = buildFeeVoucherAttachmentFormData({
      file,
      displayName: " receipt ",
      secretLevel: "INTERNAL",
    });

    expect(formData.get("file")).toBe(file);
    expect(formData.get("displayName")).toBe("receipt");
    expect(formData.get("secretLevel")).toBe("INTERNAL");

    await expect(
      uploadFeeVoucherAttachment(client, "fee-id", {
        file,
        displayName: "receipt",
        secretLevel: "INTERNAL",
      }),
    ).resolves.toEqual(baseFeeAttachment);
    expect(postForm).toHaveBeenCalledWith(
      "/fees/fee-id/voucher-attachments",
      expect.any(FormData),
    );
  });

  it("downloads fee voucher attachment blobs through the authenticated route", async () => {
    const blob = new Blob(["synthetic"], { type: "application/pdf" });
    const downloadBlob = vi.fn().mockResolvedValue(blob) as unknown as NonNullable<
      ApiClient["downloadBlob"]
    >;
    const client: ApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      downloadBlob,
    };

    await expect(
      downloadFeeVoucherAttachment(client, "fee-id", "attachment-id"),
    ).resolves.toBe(blob);
    expect(downloadBlob).toHaveBeenCalledWith(
      "/fees/fee-id/voucher-attachments/attachment-id/download",
    );
  });

  it("previews fee voucher attachment blobs through the authenticated route", async () => {
    const blob = new Blob(["synthetic"], { type: "image/png" });
    const downloadBlob = vi.fn().mockResolvedValue(blob) as unknown as NonNullable<
      ApiClient["downloadBlob"]
    >;
    const client: ApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      downloadBlob,
    };

    await expect(
      previewFeeVoucherAttachment(client, "fee-id", "attachment-id"),
    ).resolves.toBe(blob);
    expect(downloadBlob).toHaveBeenCalledWith(
      "/fees/fee-id/voucher-attachments/attachment-id/preview",
    );
  });

  it("does not issue fee voucher attachment calls without required ids or demo user", async () => {
    const client = createClient([]);

    await expect(fetchFeeVoucherAttachments(client, "   ")).resolves.toEqual([]);
    await expect(fetchFeeVoucherAttachmentDetail(client, "fee-id", "   ")).resolves.toBeNull();
    await expect(downloadFeeVoucherAttachment(client, "fee-id", "")).resolves.toBeNull();
    await expect(previewFeeVoucherAttachment(client, "fee-id", "")).resolves.toBeNull();
    expect(shouldLoadFeeVoucherAttachments(null, "fee-id")).toBe(false);
    expect(shouldLoadFeeVoucherAttachments("demo-user-id", "fee-id")).toBe(true);
    expect(
      shouldLoadFeeVoucherAttachmentDetail("demo-user-id", "fee-id", "attachment-id"),
    ).toBe(true);
    expect(
      shouldLoadFeeVoucherAttachmentDetail("demo-user-id", "fee-id", "   "),
    ).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe("fee review history client and display helpers", () => {
  it("requests GET /fees/:id/review-history and keeps the response as safe timeline metadata", async () => {
    const client = createClient([baseFeeReviewHistory]);

    await expect(fetchFeeReviewHistory(client, " fee-id ")).resolves.toEqual([
      baseFeeReviewHistory,
    ]);

    expect(client.get).toHaveBeenCalledWith("/fees/fee-id/review-history");
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();

    const serialized = JSON.stringify(baseFeeReviewHistory);
    expect(serialized).toContain("action");
    expect(serialized).toContain("fromStatus");
    expect(serialized).toContain("toStatus");
    expect(serialized).toContain("reason");
    expect(serialized).toContain("reviewerId");
    expect(serialized).toContain("createdAt");
    expect(serialized).not.toContain("amount");
    expect(serialized).not.toContain("voucherNo");
    expect(serialized).not.toContain("storageKey");
    expect(serialized).not.toContain("checksum");
    expect(serialized).not.toContain("rawPayload");
  });

  it("does not request review history without a demo user or fee id", async () => {
    const client = createClient([baseFeeReviewHistory]);

    await expect(fetchFeeReviewHistory(client, "   ")).resolves.toEqual([]);
    await expect(loadFeeReviewHistoryForDemoUser(client, null, "fee-id")).resolves.toEqual([]);
    await expect(loadFeeReviewHistoryForDemoUser(client, "   ", "fee-id")).resolves.toEqual([]);
    await expect(loadFeeReviewHistoryForDemoUser(client, "demo-user-id", "   ")).resolves.toEqual(
      [],
    );
    expect(shouldLoadFeeReviewHistory(null, "fee-id")).toBe(false);
    expect(shouldLoadFeeReviewHistory("demo-user-id", "fee-id")).toBe(true);
    expect(client.get).not.toHaveBeenCalled();
  });

  it("reports review history loading, empty, error, and ready states", () => {
    expect(getFeeReviewHistoryState({ loading: true, data: null, error: null })).toEqual({
      kind: "loading",
    });
    expect(
      getFeeReviewHistoryState({
        loading: false,
        data: null,
        error: { kind: "server", message: "Server" },
      }),
    ).toEqual({ kind: "error" });
    expect(getFeeReviewHistoryState({ loading: false, data: [], error: null })).toEqual({
      kind: "empty",
      emptyText: "暂无审核历史",
    });
    expect(
      getFeeReviewHistoryState({
        loading: false,
        data: [baseFeeReviewHistory],
        error: null,
      }),
    ).toEqual({ kind: "ready" });
  });

  it("allows scoped read, manage, review, and readonly-search users to load history", () => {
    expect(
      canReadFeeReviewHistory({
        permissionCodes: ["fee:read_department"],
      }),
    ).toBe(true);
    expect(
      canReadFeeReviewHistory({
        permissionCodes: ["fee:manage_department"],
      }),
    ).toBe(true);
    expect(
      canReadFeeReviewHistory({
        permissionCodes: ["fee:review_department"],
      }),
    ).toBe(true);
    expect(canReadFeeReviewHistory({ permissionCodes: [] })).toBe(false);
    expect(canReadFeeReviewHistory(undefined, "search-readonly")).toBe(true);
  });

  it("builds readonly display columns without write entry points or sensitive fee fields", () => {
    const columns = buildFeeReviewHistoryColumns();
    const serializedColumns = JSON.stringify(
      columns?.map((column) => ({
        title: column.title,
        key: column.key,
        dataIndex: "dataIndex" in column ? column.dataIndex : undefined,
      })),
    );

    expect(serializedColumns).toContain("动作");
    expect(serializedColumns).toContain("状态变化");
    expect(serializedColumns).toContain("审核原因");
    expect(serializedColumns).toContain("审核人");
    expect(serializedColumns).toContain("时间");
    expect(serializedColumns).not.toContain("amount");
    expect(serializedColumns).not.toContain("voucherNo");
    expect(serializedColumns).not.toContain("storageKey");
    expect(serializedColumns).not.toContain("checksum");
    expect(serializedColumns).not.toContain("actions");
    expect(serializedColumns).not.toContain("onClick");
  });

  it("changes the review history refresh key after approve or reject updates", () => {
    const pendingKey = buildFeeReviewHistoryRefreshKey(baseFee, 0);
    const approvedKey = buildFeeReviewHistoryRefreshKey(
      {
        ...baseFee,
        reviewStatus: "APPROVED",
        reviewedAt: "2026-07-01T08:00:00.000Z",
      },
      1,
    );
    const rejectedKey = buildFeeReviewHistoryRefreshKey(
      {
        ...baseFee,
        reviewStatus: "REJECTED",
        reviewedAt: "2026-07-01T09:00:00.000Z",
      },
      2,
    );

    expect(approvedKey).not.toBe(pendingKey);
    expect(rejectedKey).not.toBe(approvedKey);
  });

  it("changes the workflow task refresh key after approve or reject updates", () => {
    const pendingKey = buildFeeReviewWorkflowTaskRefreshKey(baseFee, 0);
    const approvedKey = buildFeeReviewWorkflowTaskRefreshKey(
      {
        ...baseFee,
        reviewStatus: "APPROVED",
        reviewedAt: "2026-07-01T08:00:00.000Z",
      },
      1,
    );
    const rejectedKey = buildFeeReviewWorkflowTaskRefreshKey(
      {
        ...baseFee,
        reviewStatus: "REJECTED",
        reviewedAt: "2026-07-01T09:00:00.000Z",
      },
      2,
    );

    expect(approvedKey).not.toBe(pendingKey);
    expect(rejectedKey).not.toBe(approvedKey);
  });
});

describe("fee review workflow task client and display helpers", () => {
  it("requests fee review workflow tasks through target-aware workflow task filters", async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ items: [baseFeeReviewWorkflowTask] })
      .mockResolvedValue({ items: [] }) as unknown as ApiClient["get"];
    const client: ApiClient = {
      get,
      post: vi.fn(),
      patch: vi.fn(),
    };

    await expect(fetchFeeReviewWorkflowTasks(client, " fee-id ")).resolves.toEqual([
      baseFeeReviewWorkflowTask,
    ]);

    expect(client.get).toHaveBeenCalledWith("/workflow/tasks/my", {
      status: "PENDING",
      targetType: "FEE_RECORD",
      achievementId: undefined,
      feeRecordId: "fee-id",
    });
    expect(client.get).toHaveBeenCalledTimes(5);
  });

  it("does not load workflow tasks without a fee id, review permission, or management mode", async () => {
    const client = createClient({ items: [baseFeeReviewWorkflowTask] });

    await expect(fetchFeeReviewWorkflowTasks(client, "   ")).resolves.toEqual([]);
    expect(shouldLoadFeeReviewWorkflowTasks("   ", "management", true)).toBe(false);
    expect(shouldLoadFeeReviewWorkflowTasks("fee-id", "management", false)).toBe(false);
    expect(shouldLoadFeeReviewWorkflowTasks("fee-id", "search-readonly", true)).toBe(false);
    expect(shouldLoadFeeReviewWorkflowTasks("fee-id", "management", true)).toBe(true);
    expect(client.get).not.toHaveBeenCalled();
  });

  it("shows review actions only with a current pending FEE_REVIEW task", () => {
    expect(findPendingFeeReviewWorkflowTask([baseFeeReviewWorkflowTask], "fee-id")).toEqual(
      baseFeeReviewWorkflowTask,
    );
    expect(
      shouldShowFeeDetailReviewActions(
        baseFee,
        "management",
        true,
        baseFeeReviewWorkflowTask,
      ),
    ).toBe(true);
    expect(shouldShowFeeDetailReviewActions(baseFee, "management", true, null)).toBe(false);
    expect(
      shouldShowFeeDetailReviewActions(
        baseFee,
        "management",
        false,
        baseFeeReviewWorkflowTask,
      ),
    ).toBe(false);
    expect(
      shouldShowFeeDetailReviewActions(
        baseFee,
        "search-readonly",
        true,
        baseFeeReviewWorkflowTask,
      ),
    ).toBe(false);
  });

  it("keeps completed and cancelled fee workflow tasks readonly", () => {
    const completedTask = {
      ...baseFeeReviewWorkflowTask,
      status: "APPROVED" as const,
      completedAt: "2026-07-01T09:00:00.000Z",
      instance: {
        ...baseFeeReviewWorkflowTask.instance!,
        status: "COMPLETED",
        currentStep: null,
      },
    };
    const cancelledTask = {
      ...baseFeeReviewWorkflowTask,
      id: "task-cancelled",
      status: "CANCELLED" as const,
      completedAt: "2026-07-01T09:00:00.000Z",
    };

    expect(findPendingFeeReviewWorkflowTask([completedTask], "fee-id")).toBeNull();
    expect(findPendingFeeReviewWorkflowTask([cancelledTask], "fee-id")).toBeNull();
    expect(shouldShowFeeDetailReviewActions(baseFee, "management", true, completedTask))
      .toBe(false);
    expect(shouldShowFeeDetailReviewActions(baseFee, "management", true, cancelledTask))
      .toBe(false);
  });

  it("does not expose fee business fields in workflow task metadata fixtures", () => {
    const serialized = JSON.stringify(baseFeeReviewWorkflowTask);

    expect(serialized).toContain("status");
    expect(serialized).toContain("stepCode");
    expect(serialized).toContain("assigneeId");
    expect(serialized).toContain("createdAt");
    expect(serialized).toContain("updatedAt");
    expect(serialized).not.toContain("amount");
    expect(serialized).not.toContain("voucherNo");
    expect(serialized).not.toContain("storageKey");
    expect(serialized).not.toContain("checksum");
    expect(serialized).not.toContain("rawPayload");
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
      reviewStatus: "PENDING" as const,
      reviewedById: null,
      reviewedAt: null,
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

  it("requests explicit waive and cancel endpoints with required reason", async () => {
    const waived = {
      id: "fee-id",
      achievementId: "achievement-id",
      departmentId: "department-id",
      feeType: "PATENT_ANNUAL" as const,
      dueDate: "2026-07-01T00:00:00.000Z",
      paidDate: null,
      payStatus: "WAIVED" as const,
      voucherNo: null,
      reviewStatus: "PENDING" as const,
      reviewedById: null,
      reviewedAt: null,
      updatedById: "updater-id",
      archivedAt: null,
    };
    const cancelled = { ...waived, payStatus: "CANCELLED" as const };
    const waiveClient = createClient([], waived);
    const cancelClient = createClient([], cancelled);

    await expect(waiveFee(waiveClient, "fee-id", { reason: "policy exemption" }))
      .resolves.toEqual(waived);
    await expect(cancelFee(cancelClient, "fee-id", { reason: "duplicate fee" }))
      .resolves.toEqual(cancelled);

    expect(waiveClient.post).toHaveBeenCalledWith("/fees/fee-id/waive", {
      reason: "policy exemption",
    });
    expect(cancelClient.post).toHaveBeenCalledWith("/fees/fee-id/cancel", {
      reason: "duplicate fee",
    });
    expectNoAttachmentOrWarningsCalls(waiveClient);
    expectNoAttachmentOrWarningsCalls(cancelClient);
  });

  it("does not request waive or cancel without a demo user or fee id", async () => {
    const client = createClient([], baseFee);
    const payload = { reason: "policy exemption" };

    await expect(waiveFee(client, "   ", payload)).resolves.toBeNull();
    await expect(cancelFee(client, "   ", payload)).resolves.toBeNull();
    await expect(waiveFeeForDemoUser(client, null, "fee-id", payload)).resolves.toBeNull();
    await expect(cancelFeeForDemoUser(client, "   ", "fee-id", payload)).resolves.toBeNull();
    expect(client.post).not.toHaveBeenCalled();
  });

  it("requests fee review approve and reject endpoints with review-only payloads", async () => {
    const approved = {
      id: "fee-id",
      achievementId: "achievement-id",
      departmentId: "department-id",
      feeType: "PATENT_ANNUAL" as const,
      dueDate: "2026-07-01T00:00:00.000Z",
      paidDate: null,
      payStatus: "PENDING" as const,
      voucherNo: null,
      reviewStatus: "APPROVED" as const,
      reviewedById: "reviewer-id",
      reviewedAt: "2026-07-02T00:00:00.000Z",
      updatedById: "updater-id",
      archivedAt: null,
    };
    const rejected = { ...approved, reviewStatus: "REJECTED" as const };
    const approveClient = createClient([], approved);
    const rejectClient = createClient([], rejected);

    await expect(approveFeeReview(approveClient, "fee-id", {})).resolves.toEqual(approved);
    await expect(
      rejectFeeReview(rejectClient, "fee-id", { reason: "missing support" }),
    ).resolves.toEqual(rejected);

    expect(approveClient.post).toHaveBeenCalledWith("/fees/fee-id/review/approve", {});
    expect(rejectClient.post).toHaveBeenCalledWith("/fees/fee-id/review/reject", {
      reason: "missing support",
    });
    const serializedPayloads = JSON.stringify([
      (approveClient.post as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[1],
      (rejectClient.post as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[1],
    ]);
    expect(serializedPayloads).not.toContain("amount");
    expect(serializedPayloads).not.toContain("voucherNo");
    expect(serializedPayloads).not.toContain("VOUCHER");
    expectNoAttachmentOrWarningsCalls(approveClient);
    expectNoAttachmentOrWarningsCalls(rejectClient);
  });

  it("does not request review endpoints without a demo user or fee id", async () => {
    const client = createClient([], baseFee);

    await expect(approveFeeReview(client, "   ", {})).resolves.toBeNull();
    await expect(rejectFeeReview(client, "   ", { reason: "missing support" })).resolves.toBeNull();
    await expect(approveFeeReviewForDemoUser(client, null, "fee-id", {})).resolves.toBeNull();
    await expect(
      rejectFeeReviewForDemoUser(client, "   ", "fee-id", { reason: "missing support" }),
    ).resolves.toBeNull();
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

  it("validates and builds waive/cancel reason payload", () => {
    expect(validateFeeStatusActionForm({ reason: "   " })).toEqual({
      reason: "请输入原因。",
    });
    expect(validateFeeStatusActionForm({ reason: "x".repeat(501) })).toEqual({
      reason: "原因不能超过 500 个字符。",
    });
    expect(buildFeeStatusActionPayload({ reason: "  policy exemption  " })).toEqual({
      errors: {},
      payload: {
        reason: "policy exemption",
      },
    });
  });

  it("validates and builds fee review action payloads", () => {
    expect(validateFeeReviewActionForm("approve", { reason: "   " })).toEqual({});
    expect(validateFeeReviewActionForm("reject", { reason: "   " })).toEqual({
      reason: "请输入审核拒绝原因。",
    });
    expect(validateFeeReviewActionForm("approve", { reason: "x".repeat(501) })).toEqual({
      reason: "审核原因不能超过 500 个字符。",
    });
    expect(buildFeeReviewActionPayload("approve", { reason: "   " })).toEqual({
      errors: {},
      payload: {},
    });
    expect(buildFeeReviewActionPayload("approve", { reason: "  finance checked  " })).toEqual({
      errors: {},
      payload: {
        reason: "finance checked",
      },
    });
    expect(buildFeeReviewActionPayload("reject", { reason: " missing support " })).toEqual({
      errors: {},
      payload: {
        reason: "missing support",
      },
    });
  });
});

describe("fee write visibility", () => {
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
      canUploadFeeVoucherAttachments({
        permissionCodes: ["fee:manage_department"],
      }),
    ).toBe(true);
    expect(
      canUploadFeeVoucherAttachments({
        permissionCodes: ["fee:review_department"],
      }),
    ).toBe(false);
    expect(
      canReadFeeVoucherAttachments({
        permissionCodes: ["fee:read_department"],
      }),
    ).toBe(true);
    expect(
      canReadFeeVoucherAttachments({
        permissionCodes: ["fee:review_department"],
      }),
    ).toBe(true);
    expect(canReadFeeVoucherAttachments(undefined, "search-readonly")).toBe(true);
    expect(
      shouldShowFeeDetailMarkPaidAction(baseFee, "management", false),
    ).toBe(false);
    expect(shouldShowFeeDetailMarkPaidAction(baseFee, "management", true)).toBe(true);
    expect(shouldShowFeeDetailStatusActions(baseFee, "management", false)).toBe(false);
    expect(shouldShowFeeDetailStatusActions(baseFee, "management", true)).toBe(true);
  });

  it("shows write actions only for pending and overdue fee records", () => {
    expect(canMarkFeePaid({ payStatus: "PENDING" })).toBe(true);
    expect(canMarkFeePaid({ payStatus: "OVERDUE" })).toBe(true);
    expect(canMarkFeePaid({ payStatus: "PAID" })).toBe(false);
    expect(canMarkFeePaid({ payStatus: "WAIVED" })).toBe(false);
    expect(canMarkFeePaid({ payStatus: "CANCELLED" })).toBe(false);
    expect(canWaiveOrCancelFee({ payStatus: "PENDING" })).toBe(true);
    expect(canWaiveOrCancelFee({ payStatus: "OVERDUE" })).toBe(true);
    expect(canWaiveOrCancelFee({ payStatus: "PAID" })).toBe(false);
    expect(canWaiveOrCancelFee({ payStatus: "WAIVED" })).toBe(false);
    expect(canWaiveOrCancelFee({ payStatus: "CANCELLED" })).toBe(false);
  });

  it("hides write actions in search readonly fee detail mode", () => {
    expect(shouldShowFeeDetailMarkPaidAction(baseFee, "management")).toBe(true);
    expect(shouldShowFeeDetailMarkPaidAction(baseFee, "search-readonly")).toBe(false);
    expect(shouldShowFeeDetailStatusActions(baseFee, "management")).toBe(true);
    expect(shouldShowFeeDetailStatusActions(baseFee, "search-readonly")).toBe(false);
    expect(
      shouldShowFeeDetailMarkPaidAction({ ...baseFee, payStatus: "OVERDUE" }, "search-readonly"),
    ).toBe(false);
    expect(
      shouldShowFeeDetailMarkPaidAction({ ...baseFee, payStatus: "PAID" }, "management"),
    ).toBe(false);
    expect(
      shouldShowFeeDetailStatusActions({ ...baseFee, payStatus: "PAID" }, "management"),
    ).toBe(false);
  });

  it("uses fee:review_department, pending review status, and pending task for review action visibility", () => {
    expect(
      canReviewDepartmentFees({
        permissionCodes: ["fee:review_department"],
      }),
    ).toBe(true);
    expect(
      canReviewDepartmentFees({
        permissionCodes: ["fee:manage_department"],
      }),
    ).toBe(false);
    expect(canReviewDepartmentFees(undefined)).toBe(false);
    expect(canReviewFee(baseFee)).toBe(true);
    expect(canReviewFee({ ...baseFee, reviewStatus: "APPROVED" })).toBe(false);
    expect(canReviewFee({ ...baseFee, reviewStatus: "REJECTED" })).toBe(false);
    expect(
      shouldShowFeeDetailReviewActions(
        baseFee,
        "management",
        true,
        baseFeeReviewWorkflowTask,
      ),
    ).toBe(true);
    expect(shouldShowFeeDetailReviewActions(baseFee, "management", true, null)).toBe(false);
    expect(
      shouldShowFeeDetailReviewActions(
        baseFee,
        "management",
        false,
        baseFeeReviewWorkflowTask,
      ),
    ).toBe(false);
    expect(
      shouldShowFeeDetailReviewActions(
        baseFee,
        "search-readonly",
        true,
        baseFeeReviewWorkflowTask,
      ),
    ).toBe(false);
    expect(
      shouldShowFeeDetailReviewActions(
        { ...baseFee, reviewStatus: "APPROVED" },
        "management",
        true,
        baseFeeReviewWorkflowTask,
      ),
    ).toBe(false);
  });
});

describe("voucher attachment boundary", () => {
  it("states the fee voucher attachment API integration boundary", () => {
    expect(feeVoucherAttachmentBoundary.title).toBe("凭证附件");
    expect(feeVoucherAttachmentBoundary.description).toContain("当前记录关联的凭证附件");
    expect(feeVoucherAttachmentBoundary.description).toContain("查看和维护");
  });

  it("keeps the boundary copy free of fake local-only capability claims", () => {
    const copy = `${feeVoucherAttachmentBoundary.title} ${feeVoucherAttachmentBoundary.description}`;

    expect(copy).not.toContain("本地假数据");
    expect(copy).not.toContain("下载地址");
    expect(copy).not.toContain("绕过权限");
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

describe("mapFeeReviewHistoryErrorToDisplay", () => {
  it("maps review history permission, not-found, server, and network errors", () => {
    expect(
      mapFeeReviewHistoryErrorToDisplay({
        kind: "forbidden",
        message: "Forbidden",
        status: 403,
      }).message,
    ).toBe("当前用户无权查看审核历史");
    expect(
      mapFeeReviewHistoryErrorToDisplay({
        kind: "unknown",
        message: "Not found",
        status: 404,
      }).message,
    ).toBe("审核历史不可见");
    expect(
      mapFeeReviewHistoryErrorToDisplay({
        kind: "server",
        message: "Server",
        status: 500,
      }).message,
    ).toBe("审核历史暂时不可用，可重试");
    expect(
      mapFeeReviewHistoryErrorToDisplay({ kind: "network", message: "Network" }).message,
    ).toBe("审核历史暂时不可用，可重试");
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
    expect(getFeeReviewStatusLabel("PENDING")).toBe("待审核");
    expect(getFeeReviewStatusLabel("APPROVED")).toBe("已通过");
    expect(getFeeReviewStatusLabel("REJECTED")).toBe("已拒绝");
    expect(getFeeReviewHistoryActionLabel("APPROVE")).toBe("审核通过");
    expect(getFeeReviewHistoryActionLabel("REJECT")).toBe("审核拒绝");
    expect(getPayStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(getFeeReviewStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(getFeeReviewHistoryActionLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});
