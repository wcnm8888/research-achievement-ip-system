import { describe, expect, it, vi } from "vitest";
import type { ApiClient, ApiError } from "./api-client";
import {
  buildAttachmentDetailMetadataViewModel,
  buildAchievementAttachmentFormData,
  buildConversionInput,
  buildAttachmentMetadataViewModel,
  buildVoidActionPayload,
  canUploadAchievementAttachment,
  createAchievementConversion,
  downloadAchievementAttachment,
  fetchAchievementConversions,
  fetchAchievementAttachmentDetailMetadata,
  fetchAchievementAttachmentMetadata,
  fetchAchievementDetailById,
  formatAttachmentSize,
  formatBenefitDistributionJson,
  getActionConfirmConfig,
  getAvailableAchievementActions,
  getAttachmentDetailMetadataReadonlyBoundary,
  getAttachmentMetadataReadonlyBoundary,
  getDetailDisplayTitle,
  getReadonlyAchievementErrorState,
  getReadonlyAchievementActions,
  mapAttachmentDetailMetadataErrorToDisplay,
  mapAttachmentDownloadErrorToDisplay,
  mapAttachmentMetadataErrorToDisplay,
  mapAttachmentPreviewErrorToDisplay,
  previewAchievementAttachment,
  uploadAchievementAttachment,
  updateAchievementConversion,
  validateAttachmentUploadFile,
  shouldLoadAttachmentDetailMetadata,
  shouldLoadAttachmentMetadata,
  shouldLoadAchievementConversions,
  getTypeDetailFields,
  toConversionForm,
} from "./AchievementDetail";
import type { AchievementConversionRecord, AchievementDetail, AttachmentMetadata } from "./types";

const baseDetail: AchievementDetail = {
  id: "achievement-id",
  type: "PAPER",
  status: "DRAFT",
  secretLevel: "INTERNAL",
  departmentId: "department-id",
  ownerUserId: "owner-id",
  title: "Visible title",
  createdAt: "2026-06-19T00:00:00.000Z",
  updatedAt: "2026-06-19T00:00:00.000Z",
  submittedAt: null,
  archivedAt: null,
  voidedAt: null,
  isRestricted: false,
  isRedacted: false,
  contributors: [],
};

describe("getAvailableAchievementActions", () => {
  it("exposes only actions supported by the current backend state contract", () => {
    expect(getAvailableAchievementActions("DRAFT")).toEqual(["submit", "void"]);
    expect(getAvailableAchievementActions("DEPARTMENT_REJECTED")).toEqual([]);
    expect(getAvailableAchievementActions("PENDING_DEPARTMENT_REVIEW")).toEqual([]);
    expect(getAvailableAchievementActions("PENDING_ARCHIVE")).toEqual(["archive"]);
    expect(getAvailableAchievementActions("ARCHIVED")).toEqual([]);
    expect(getAvailableAchievementActions("VOIDED")).toEqual([]);
  });
});

describe("getReadonlyAchievementActions", () => {
  it("keeps approval-context achievement detail read-only", () => {
    expect(getReadonlyAchievementActions()).toEqual([]);
    expect(getReadonlyAchievementActions()).not.toContain("submit");
    expect(getReadonlyAchievementActions()).not.toContain("void");
    expect(getReadonlyAchievementActions()).not.toContain("archive");
  });
});

describe("getReadonlyAchievementErrorState", () => {
  it("sanitizes permission failures for approval-context detail", () => {
    const error: ApiError = {
      kind: "forbidden",
      status: 403,
      message: "Forbidden",
      detail: "internal policy details",
    };

    expect(getReadonlyAchievementErrorState(error)).toMatchObject({
      kind: "forbidden",
      status: 403,
      message: "当前账号无权查看关联成果",
    });
    expect(getReadonlyAchievementErrorState(error).detail).not.toContain("internal");
  });

  it("uses search-context copy without approval wording", () => {
    const error: ApiError = {
      kind: "unauthorized",
      status: 401,
      message: "Unauthorized",
      detail: "session details",
    };

    const state = getReadonlyAchievementErrorState(error, "search");

    expect(state).toMatchObject({
      kind: "unauthorized",
      status: 401,
      message: "请选择或切换业务用户",
      detail: "检索中心需要有效用户后才能读取成果详情。",
    });
    expect(state.detail).not.toContain("审批上下文");
  });

  it("uses search-result wording for missing readonly details", () => {
    const error: ApiError = {
      kind: "unknown",
      status: 404,
      message: "Not Found",
      detail: "route detail",
    };

    const state = getReadonlyAchievementErrorState(error, "search");

    expect(state).toMatchObject({
      status: 404,
      message: "成果不存在或已不可用",
      detail: "请确认检索结果返回的成果 ID 仍指向可读取的科研成果。",
    });
    expect(state.detail).not.toContain("审批任务");
  });

  it("sanitizes missing linked achievements without leaking backend detail", () => {
    const error: ApiError = {
      kind: "unknown",
      status: 404,
      message: "Not Found",
      detail: "stack or route detail",
    };

    expect(getReadonlyAchievementErrorState(error)).toMatchObject({
      status: 404,
      message: "关联成果不存在或已不可用",
    });
    expect(getReadonlyAchievementErrorState(error).detail).not.toContain("stack");
  });

  it("keeps service and network failures retryable and generic", () => {
    const error: ApiError = {
      kind: "server",
      status: 500,
      message: "Internal server error",
      detail: "database connection string details",
    };

    expect(getReadonlyAchievementErrorState(error)).toMatchObject({
      kind: "server",
      status: 500,
      message: "成果详情服务暂不可用",
    });
    expect(getReadonlyAchievementErrorState(error).detail).not.toContain("database");
  });
});

describe("fetchAchievementDetailById", () => {
  it("uses the existing achievement detail endpoint contract", async () => {
    const calls: string[] = [];
    const client: ApiClient = {
      get: async <T,>(path: string) => {
        calls.push(path);
        return baseDetail as T;
      },
      post: async <T,>() => undefined as T,
      patch: async <T,>() => undefined as T,
    };

    await expect(fetchAchievementDetailById(client, "achievement-id")).resolves.toEqual(
      baseDetail,
    );
    expect(calls).toEqual(["/achievements/achievement-id"]);
  });
});

describe("Step 84 achievement conversion helpers", () => {
  const conversion: AchievementConversionRecord = {
    id: "conversion-id",
    achievementId: "achievement-id",
    departmentId: "department-id",
    conversionType: "LICENSE",
    counterpartyName: "Example Company",
    contractAmount: "100000.00",
    revenueAmount: "60000.00",
    status: "SIGNED",
    conversionDate: "2026-07-01T00:00:00.000Z",
    contractStatus: "ACTIVE",
    revenueStatus: "PARTIAL",
    revenueDueDate: "2026-08-01T00:00:00.000Z",
    revenueReceivedDate: "2026-08-15T00:00:00.000Z",
    benefitDistributionJson: [
      { category: "TEAM", label: "Core team", amount: 36000, ratio: 0.6, note: "hidden note" },
      { category: "UNIT", label: "Institute", amount: 24000, ratio: 0.4 },
    ],
    evaluationEffect: "POSITIVE",
    evaluationSummary: "Local evaluation summary",
    evaluationDate: "2026-09-01T00:00:00.000Z",
    benefitDistributionSummary: "Team 60%, institute 40%",
    remarks: "Internal ledger note",
    createdById: "user-id",
    updatedById: "user-id",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    achievement: {
      id: "achievement-id",
      status: "ARCHIVED",
    },
  };

  it("uses nested achievement conversion ledger endpoints only", async () => {
    const calls: Array<{ method: string; path: string; body?: unknown }> = [];
    const client: ApiClient = {
      get: async <T,>(path: string) => {
        calls.push({ method: "GET", path });
        return [conversion] as T;
      },
      post: async <T,>(path: string, body?: unknown) => {
        calls.push({ method: "POST", path, body });
        return conversion as T;
      },
      patch: async <T,>(path: string, body?: unknown) => {
        calls.push({ method: "PATCH", path, body });
        return { ...conversion, status: "PAID" } as T;
      },
    };

    await expect(fetchAchievementConversions(client, "achievement-id")).resolves.toEqual([
      conversion,
    ]);
    await createAchievementConversion(client, "achievement-id", {
      conversionType: "LICENSE",
      counterpartyName: "Example Company",
      contractAmount: 100000,
      revenueAmount: 60000,
      status: "SIGNED",
      conversionDate: "2026-07-01",
      benefitDistributionSummary: "Team 60%, institute 40%",
      remarks: "Internal ledger note",
    });
    await updateAchievementConversion(client, "achievement-id", "conversion-id", {
      status: "PAID",
      revenueAmount: 60000,
    });

    expect(calls).toEqual([
      {
        method: "GET",
        path: "/achievements/achievement-id/conversions",
      },
      {
        method: "POST",
        path: "/achievements/achievement-id/conversions",
        body: expect.objectContaining({ status: "SIGNED" }),
      },
      {
        method: "PATCH",
        path: "/achievements/achievement-id/conversions/conversion-id",
        body: expect.objectContaining({ status: "PAID" }),
      },
    ]);
  });

  it("builds Step 109 conversion deepening create and update payload fields", () => {
    const form = toConversionForm(conversion);
    const input = buildConversionInput({
      ...form,
      counterpartyName: " Example Company ",
      contractAmount: "100000",
      revenueAmount: "60000",
      benefitDistributionJson: [
        { category: "TEAM", label: " Core team ", amount: "36000", ratio: "0.6" },
        { category: "UNIT", label: "Institute", amount: "24000", ratio: "0.4" },
      ],
    });

    expect(input).toEqual(
      expect.objectContaining({
        contractStatus: "ACTIVE",
        revenueStatus: "PARTIAL",
        revenueDueDate: "2026-08-01",
        revenueReceivedDate: "2026-08-15",
        evaluationEffect: "POSITIVE",
        evaluationSummary: "Local evaluation summary",
        evaluationDate: "2026-09-01",
        benefitDistributionJson: [
          { category: "TEAM", label: "Core team", amount: 36000, ratio: 0.6 },
          { category: "UNIT", label: "Institute", amount: 24000, ratio: 0.4 },
        ],
      }),
    );

    expect(
      buildConversionInput({
        ...form,
        benefitDistributionJson: [
          { category: "TEAM", label: "Core team", amount: "36000", ratio: "2" },
        ],
      }),
    ).toBeNull();
  });

  it("renders safe benefit allocation summaries without raw notes or payload labels", () => {
    const summary = formatBenefitDistributionJson(conversion.benefitDistributionJson);

    expect(summary).toContain("Team / Core team");
    expect(summary).toContain("Unit / Institute");
    expect(summary).toContain("60%");
    expect(summary).toContain("40%");
    expect(summary).not.toContain("hidden note");
    expect(summary).not.toContain("raw");
  });

  it("does not load conversion records without a demo user or achievement id", () => {
    expect(shouldLoadAchievementConversions(null, "achievement-id")).toBe(false);
    expect(shouldLoadAchievementConversions("demo-user", "")).toBe(false);
    expect(shouldLoadAchievementConversions("demo-user", "achievement-id")).toBe(true);
  });
});

describe("Step 19A attachment metadata helpers", () => {
  const attachment: AttachmentMetadata = {
    id: "attachment-id",
    relationType: "ACHIEVEMENT",
    relationId: "achievement-id",
    fileName: "paper.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    storageProvider: "LOCAL_DISK",
    originalName: "original-paper.pdf",
    storedName: "stored-paper.pdf",
    version: 2,
    uploaderId: "uploader-id",
    secretLevel: "INTERNAL",
    status: "ACTIVE",
    createdAt: "2026-06-21T08:00:00.000Z",
    updatedAt: "2026-06-21T09:00:00.000Z",
    archivedAt: null,
  };

  it("uses only the achievement attachment metadata list endpoint", async () => {
    const result = [attachment];
    const calls: Array<{ path: string; query?: Record<string, string | number | undefined> }> = [];
    const client: ApiClient = {
      get: async <T,>(
        path: string,
        query?: Record<string, string | number | undefined>,
      ) => {
        calls.push({ path, query });
        return result as T;
      },
      post: vi.fn(),
      patch: vi.fn(),
    };

    await expect(
      fetchAchievementAttachmentMetadata(client, "achievement-id"),
    ).resolves.toEqual(result);

    expect(calls).toEqual([
      {
        path: "/achievements/achievement-id/attachments",
        query: {
          take: 50,
        },
      },
    ]);
    expect(calls.map((call) => call.path).join(" ")).not.toContain("/download");
    expect(client.post).not.toHaveBeenCalled();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it("does not allow attachment metadata loading without a demo user or achievement id", () => {
    expect(shouldLoadAttachmentMetadata(null, "achievement-id")).toBe(false);
    expect(shouldLoadAttachmentMetadata("   ", "achievement-id")).toBe(false);
    expect(shouldLoadAttachmentMetadata("demo-user", "")).toBe(false);
    expect(shouldLoadAttachmentMetadata("demo-user", "achievement-id")).toBe(true);
  });

  it("maps attachment metadata errors to user-facing copy", () => {
    const forbidden = mapAttachmentMetadataErrorToDisplay({
      kind: "forbidden",
      status: 403,
      message: "Forbidden",
    });
    const missing = mapAttachmentMetadataErrorToDisplay({
      kind: "unknown",
      status: 404,
      message: "Not Found",
    });
    const server = mapAttachmentMetadataErrorToDisplay({
      kind: "server",
      status: 500,
      message: "Internal server error",
    });

    expect(forbidden.message).toBe("当前角色无附件安全摘要读取权限");
    expect(missing.message).toBe("成果附件安全摘要不存在或不可用");
    expect(server.message).toBe("附件安全摘要服务暂不可用");
  });

  it("builds display-safe metadata without storage internals", () => {
    const model = buildAttachmentMetadataViewModel(attachment);

    expect(model).toMatchObject({
      id: "attachment-id",
      relationId: "achievement-id",
      fileName: "paper.pdf",
      originalName: "original-paper.pdf",
      mimeType: "application/pdf",
      sizeLabel: "2.0 KB",
      version: 2,
      uploaderId: "uploader-id",
      secretLevelLabel: "内部",
      statusLabel: "有效",
      archivedAt: "未返回",
    });
    expect(model).not.toHaveProperty("objectKey");
    expect(model).not.toHaveProperty("checksum");
  });

  it("states the Step 45C-3 local UI boundary without storage internals", () => {
    const boundary = getAttachmentMetadataReadonlyBoundary();

    expect(boundary.allowedRequest).toBe("附件列表");
    expect(boundary.allowedRequest).not.toContain("download");
    expect(boundary.title).toContain("附件管理");
    expect(boundary.description).toContain("权限允许时上传和下载");
    expect(boundary.description).toContain("内部存储标识");
    expect(boundary.description).toContain("校验值");
  });

  it("builds multipart upload payloads without storage internals", async () => {
    const file = new File(["paper"], "paper.pdf", { type: "application/pdf" });
    const uploaded = { ...attachment, id: "uploaded-attachment-id" };
    const postForm = vi.fn().mockResolvedValue(uploaded);
    const client: ApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      postForm,
    };

    const formData = buildAchievementAttachmentFormData({
      file,
      displayName: "  Paper proof  ",
      secretLevel: "INTERNAL",
    });
    const uploadResult = await uploadAchievementAttachment(client, "achievement-id", {
      file,
      displayName: "  Paper proof  ",
      secretLevel: "INTERNAL",
    });

    expect(formData.get("file")).toBe(file);
    expect(formData.get("displayName")).toBe("Paper proof");
    expect(formData.get("secretLevel")).toBe("INTERNAL");
    expect(formData.has("storageKey")).toBe(false);
    expect(formData.has("checksum")).toBe(false);
    expect(postForm).toHaveBeenCalledWith("/achievements/achievement-id/attachments", expect.any(FormData));
    expect(uploadResult).toBe(uploaded);
  });

  it("downloads attachment blobs through the authenticated backend route", async () => {
    const blob = new Blob(["paper"], { type: "application/pdf" });
    const downloadBlob = vi.fn().mockResolvedValue(blob);
    const client: ApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      downloadBlob,
    };

    const result = await downloadAchievementAttachment(client, "achievement-id", "attachment-id");

    expect(downloadBlob).toHaveBeenCalledWith(
      "/achievements/achievement-id/attachments/attachment-id/download",
    );
    expect(result).toBe(blob);
  });

  it("previews attachment blobs through the authenticated backend route", async () => {
    const blob = new Blob(["preview"], { type: "application/pdf" });
    const downloadBlob = vi.fn().mockResolvedValue(blob);
    const client: ApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      downloadBlob,
    };

    const result = await previewAchievementAttachment(client, "achievement-id", "attachment-id");

    expect(downloadBlob).toHaveBeenCalledWith(
      "/achievements/achievement-id/attachments/attachment-id/preview",
    );
    expect(result).toBe(blob);
  });

  it("maps preview errors to safe user-facing copy", () => {
    const unsupported = mapAttachmentPreviewErrorToDisplay({
      kind: "unknown",
      status: 415,
      message: "Unsupported route /internal/object-key",
      detail: "raw path /storage/object-key token password cookie",
    });
    const forbidden = mapAttachmentPreviewErrorToDisplay({
      kind: "forbidden",
      status: 403,
      message: "Forbidden",
      detail: "policy route detail",
    });

    expect(unsupported.message).toBe("附件格式暂不支持在线预览");
    expect(unsupported.detail).toBe("当前仅支持 PDF、PNG、JPG。");
    expect(forbidden.message).toBe("当前角色无附件预览权限");
    expect(JSON.stringify([unsupported, forbidden]).toLowerCase()).not.toContain("token");
    expect(JSON.stringify([unsupported, forbidden]).toLowerCase()).not.toContain("password");
    expect(JSON.stringify([unsupported, forbidden]).toLowerCase()).not.toContain("cookie");
    expect(JSON.stringify([unsupported, forbidden])).not.toContain("/internal/object-key");
  });

  it("gates attachment upload to the owner with update-own permission", () => {
    expect(
      canUploadAchievementAttachment(
        { id: "owner-id", permissionCodes: ["achievement:update_own"] },
        baseDetail,
      ),
    ).toBe(true);
    expect(
      canUploadAchievementAttachment(
        { id: "other-user-id", permissionCodes: ["achievement:update_own"] },
        baseDetail,
      ),
    ).toBe(false);
    expect(
      canUploadAchievementAttachment(
        { id: "owner-id", permissionCodes: [] },
        baseDetail,
      ),
    ).toBe(false);
  });

  it("prechecks local file type and size before upload", () => {
    expect(
      validateAttachmentUploadFile({
        name: "paper.pdf",
        size: 1024,
        type: "application/pdf",
      }),
    ).toEqual({ ok: true });
    expect(
      validateAttachmentUploadFile({
        name: "page.html",
        size: 1024,
        type: "text/html",
      }).ok,
    ).toBe(false);
    expect(
      validateAttachmentUploadFile({
        name: "paper.pdf",
        size: 10 * 1024 * 1024 + 1,
        type: "application/pdf",
      }).ok,
    ).toBe(false);
  });

  it("formats attachment size and maps download permission failures", () => {
    expect(formatAttachmentSize(512)).toBe("512 B");
    expect(formatAttachmentSize(2048)).toBe("2.0 KB");
    expect(formatAttachmentSize(2 * 1024 * 1024)).toBe("2.0 MB");

    const mapped = mapAttachmentDownloadErrorToDisplay({
      kind: "forbidden",
      status: 403,
      message: "Forbidden",
    });

    expect(mapped.status).toBe(403);
    expect(mapped.message).not.toBe("Forbidden");
  });
});

describe("Step 21A attachment detail metadata helpers", () => {
  const detailAttachment: AttachmentMetadata = {
    id: "attachment-detail-id",
    relationType: "ACHIEVEMENT",
    relationId: "achievement-id",
    fileName: "detail.pdf",
    version: 3,
    uploaderId: "uploader-id",
    secretLevel: "SECRET",
    status: "ACTIVE",
    createdAt: "2026-06-21T08:00:00.000Z",
    updatedAt: "2026-06-21T09:00:00.000Z",
    archivedAt: null,
  };

  it("uses only the achievement attachment detail metadata endpoint", async () => {
    const calls: Array<{ method: string; path?: string }> = [];
    const post = async <T,>() => {
      calls.push({ method: "POST" });
      return undefined as T;
    };
    const patch = async <T,>() => {
      calls.push({ method: "PATCH" });
      return undefined as T;
    };
    const client: ApiClient = {
      get: async <T,>(path: string) => {
        calls.push({ method: "GET", path });
        return detailAttachment as T;
      },
      post,
      patch,
    };

    await expect(
      fetchAchievementAttachmentDetailMetadata(
        client,
        "achievement-id",
        "attachment-detail-id",
      ),
    ).resolves.toEqual(detailAttachment);

    expect(calls).toEqual([
      {
        method: "GET",
        path: "/achievements/achievement-id/attachments/attachment-detail-id",
      },
    ]);
    expect(calls.map((call) => call.path ?? "").join(" ")).not.toContain("/download");
    expect(calls.some((call) => call.method === "POST")).toBe(false);
    expect(calls.some((call) => call.method === "PATCH")).toBe(false);
  });

  it("does not allow detail metadata loading without a demo user, achievement id, or attachment id", () => {
    expect(
      shouldLoadAttachmentDetailMetadata(null, "achievement-id", "attachment-id"),
    ).toBe(false);
    expect(
      shouldLoadAttachmentDetailMetadata("   ", "achievement-id", "attachment-id"),
    ).toBe(false);
    expect(shouldLoadAttachmentDetailMetadata("demo-user", "", "attachment-id")).toBe(
      false,
    );
    expect(
      shouldLoadAttachmentDetailMetadata("demo-user", "achievement-id", ""),
    ).toBe(false);
    expect(
      shouldLoadAttachmentDetailMetadata(
        "demo-user",
        "achievement-id",
        "attachment-id",
      ),
    ).toBe(true);
  });

  it("maps detail metadata 403, 404, server, and network errors to attachment-specific copy", () => {
    const forbidden = mapAttachmentDetailMetadataErrorToDisplay({
      kind: "forbidden",
      status: 403,
      message: "Forbidden",
    });
    const missing = mapAttachmentDetailMetadataErrorToDisplay({
      kind: "unknown",
      status: 404,
      message: "Not Found",
    });
    const server = mapAttachmentDetailMetadataErrorToDisplay({
      kind: "server",
      status: 500,
      message: "Internal server error",
    });
    const network = mapAttachmentDetailMetadataErrorToDisplay({
      kind: "network",
      message: "Network request failed",
    });

    expect(forbidden.message).toBe("当前角色无附件详情摘要读取权限");
    expect(missing.message).toBe("附件详情摘要不存在或不可用");
    expect(server.message).toBe("附件详情摘要服务暂不可用");
    expect(network.message).toBe("附件详情摘要服务暂不可用");
  });

  it("builds display-safe detail metadata without storage internals or object body", () => {
    const model = buildAttachmentDetailMetadataViewModel({
      ...detailAttachment,
      fileName: " detail.pdf ",
    });

    expect(model).toMatchObject({
      id: "attachment-detail-id",
      relationType: "ACHIEVEMENT",
      relationId: "achievement-id",
      fileName: " detail.pdf ",
      version: 3,
      uploaderId: "uploader-id",
      secretLevelLabel: "秘密",
      statusLabel: "有效",
      archivedAt: "未返回",
    });
    expect(model).not.toHaveProperty("storageKey");
    expect(model).not.toHaveProperty("checksum");
    expect(model).not.toHaveProperty("objectBody");
    expect(model).not.toHaveProperty("body");
    expect(JSON.stringify(model).toLowerCase()).not.toContain("storage/path");
  });

  it("keeps Step 21A boundary detail-readonly and excludes write, download, and storage routes", () => {
    const boundary = getAttachmentDetailMetadataReadonlyBoundary();
    const serialized = JSON.stringify(boundary).toLowerCase();

    expect(boundary.allowedRequest).toBe("基础信息");
    expect(boundary.allowedRequest).not.toContain("/download");
    expect(boundary.description).toContain("展示附件基础信息");
    expect(boundary.description).toContain("不提供删除、归档");
    expect(serialized).not.toContain("post ");
    expect(serialized).not.toContain("patch ");
    expect(serialized).not.toContain("delete ");
    expect(serialized).not.toContain("objectkey");
    expect(serialized).not.toContain("checksum");
    expect(serialized).not.toContain("meilisearch");
    expect(serialized).not.toContain("search_logs");
    expect(serialized).not.toContain("/fees/warnings");
  });
});

describe("getActionConfirmConfig", () => {
  it("returns user-facing confirmation labels for each action", () => {
    expect(getActionConfirmConfig("submit")).toMatchObject({
      buttonLabel: "提交审批",
      okText: "提交",
    });
    expect(getActionConfirmConfig("void")).toMatchObject({
      buttonLabel: "作废",
      okText: "作废",
    });
    expect(getActionConfirmConfig("archive")).toMatchObject({
      buttonLabel: "归档",
      okText: "归档",
    });
  });
});

describe("buildVoidActionPayload", () => {
  it("trims reason and rejects blank reason", () => {
    expect(buildVoidActionPayload("  重复登记  ")).toEqual({ reason: "重复登记" });
    expect(buildVoidActionPayload("   ")).toBeUndefined();
  });
});

describe("getDetailDisplayTitle", () => {
  it("does not invent redacted titles", () => {
    expect(getDetailDisplayTitle({ title: null, isRedacted: true })).toBe("已脱敏成果");
    expect(getDetailDisplayTitle({ title: null, isRedacted: false })).toBe("成果详情");
    expect(getDetailDisplayTitle({ title: "真实标题", isRedacted: true })).toBe("真实标题");
  });
});

describe("getTypeDetailFields", () => {
  it("builds PAPER fields from the returned paper detail", () => {
    const fields = getTypeDetailFields({
      ...baseDetail,
      paperDetail: {
        doi: "10.1/example",
        journal: "Journal",
        issnCn: "ISSN",
        publishYear: 2026,
        includedType: "SCI",
        impactFactor: "5.2",
        partition: "Q1",
        abstract: "Abstract",
      },
    });

    expect(fields.map((field) => field.label)).toEqual([
      "DOI",
      "期刊",
      "ISSN/CN",
      "发表年份",
      "收录类型",
      "影响因子",
      "分区",
      "摘要",
    ]);
    expect(fields.find((field) => field.label === "DOI")?.value).toBe("10.1/example");
  });

  it("builds PATENT fields from the returned patent detail", () => {
    const fields = getTypeDetailFields({
      ...baseDetail,
      type: "PATENT",
      patentDetail: {
        applicationNo: "APP-1",
        grantNo: "GRANT-1",
        patentType: "INVENTION",
        filingDate: null,
        grantDate: null,
        nextFeeDate: null,
        feeAmount: "1000",
        legalStatus: "GRANTED",
      },
    });

    expect(fields.find((field) => field.label === "专利类型")?.value).toBe("发明");
    expect(fields.find((field) => field.label === "法律状态")?.value).toBe("已授权");
  });

  it("builds SOFTWARE_COPYRIGHT fields from the returned software detail", () => {
    const fields = getTypeDetailFields({
      ...baseDetail,
      type: "SOFTWARE_COPYRIGHT",
      softwareCopyrightDetail: {
        registrationNo: "REG-1",
        softwareVersion: "1.0",
        softwareType: "APPLICATION",
        publishDate: null,
        registerDate: null,
        runEnv: "Windows",
      },
    });

    expect(fields.find((field) => field.label === "软件类型")?.value).toBe("应用软件");
    expect(fields.find((field) => field.label === "运行环境")?.value).toBe("Windows");
  });
});
