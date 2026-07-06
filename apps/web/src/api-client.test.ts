import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildImportJobItemHistoryQuery,
  createApiClient,
  createAuthClient,
  mapApiErrorMessage,
  serializeQuery,
  shouldSendDemoUserHeader,
} from "./api-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("mapApiErrorMessage", () => {
  it("maps supported HTTP errors to user-facing messages", () => {
    expect(mapApiErrorMessage(401)).toEqual({
      kind: "unauthorized",
      message: "请选择或切换演示用户",
    });
    expect(mapApiErrorMessage(403)).toEqual({
      kind: "forbidden",
      message: "当前角色无权限",
    });
    expect(mapApiErrorMessage(400)).toEqual({
      kind: "bad-request",
      message: "请求参数错误",
    });
    expect(mapApiErrorMessage(404)).toEqual({
      kind: "unknown",
      message: "资源不存在",
    });
    expect(mapApiErrorMessage(409)).toEqual({
      kind: "unknown",
      message: "数据状态冲突",
    });
    expect(mapApiErrorMessage(422)).toEqual({
      kind: "bad-request",
      message: "提交内容不符合业务规则",
    });
    expect(mapApiErrorMessage(503)).toEqual({
      kind: "server",
      message: "服务不可用",
    });
  });
});

describe("serializeQuery", () => {
  it("serializes achievement list filters and pagination", () => {
    expect(
      serializeQuery({
        status: "ARCHIVED",
        type: "PAPER",
        keyword: "quantum",
        page: 2,
        pageSize: 50,
      }),
    ).toBe("status=ARCHIVED&type=PAPER&keyword=quantum&page=2&pageSize=50");
  });

  it("serializes boolean and array query values as repeated parameters", () => {
    expect(
      serializeQuery({
        keyword: "demo",
        targetTypes: ["ACHIEVEMENT", "FEE_RECORD"],
        includeArchived: false,
        strict: true,
        take: 20,
      }),
    ).toBe(
      "keyword=demo&targetTypes=ACHIEVEMENT&targetTypes=FEE_RECORD&includeArchived=false&strict=true&take=20",
    );
  });

  it("omits empty, null, undefined, and empty array query values", () => {
    expect(
      serializeQuery({
        status: undefined,
        targetTypes: [],
        ownerId: null,
        type: "",
        keyword: "",
        page: 1,
        pageSize: 20,
      }),
    ).toBe("page=1&pageSize=20");
  });
});

describe("createApiClient writes JSON requests", () => {
  it("sends POST JSON body with the demo user header", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient(" demo-user-id ");
    await expect(client.post("/achievements", { title: "Draft" })).resolves.toEqual({
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe("http://localhost/api/achievements");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.body).toBe(JSON.stringify({ title: "Draft" }));
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Demo-User-Id")).toBe("demo-user-id");
  });

  it("does not send the demo user header when production mode disables it", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient(" demo-user-id ", { allowDemoUserHeader: false });
    await expect(client.get("/dashboard/summary")).resolves.toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(init.credentials).toBe("include");
    expect(headers.get("X-Demo-User-Id")).toBeNull();
  });

  it("requests the custom report template list", async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("demo-user-id");
    await expect(client.listCustomReportTemplates()).resolves.toEqual([]);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe("http://localhost/api/reports/templates");
    expect(init.method).toBe("GET");
    expect(headers.get("X-Demo-User-Id")).toBe("demo-user-id");
  });

  it("runs a custom report template with serialized safe filters", async () => {
    const response = {
      metadata: {
        templateId: "achievement-trend",
        name: "Trend",
        description: "Trend",
        generatedAt: "2026-07-06T00:00:00.000Z",
        localDemoOnly: true,
        notProductionMonitoring: true,
      },
      filters: {},
      scopeSummary: {
        userId: "demo-user-id",
        departmentId: "department-id",
        departmentScope: { departmentIds: ["department-id"] },
        policy: "achievement-readable",
      },
      columns: [],
      rows: [],
      totals: {},
      caveats: [],
    };
    const fetchMock = vi.fn(async () => Response.json(response));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("demo-user-id");
    await expect(
      client.runCustomReport("achievement-trend", {
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        departmentId: "10000000-0000-4000-8000-000000000001",
        achievementType: "PAPER",
        status: "ARCHIVED",
        groupBy: "month",
        dueSoonDays: undefined,
      }),
    ).resolves.toEqual(response);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe(
      "http://localhost/api/reports/templates/achievement-trend/run?dateFrom=2026-01-01&dateTo=2026-12-31&departmentId=10000000-0000-4000-8000-000000000001&achievementType=PAPER&status=ARCHIVED&groupBy=month",
    );
    expect(init.method).toBe("GET");
    expect(headers.get("X-Demo-User-Id")).toBe("demo-user-id");
  });

  it("sends PATCH without content type when body is absent and accepts 204", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 204,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient(null);
    await expect(client.patch("/achievements/id")).resolves.toBeUndefined();

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(init.method).toBe("PATCH");
    expect(init.credentials).toBe("include");
    expect(init.body).toBeUndefined();
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBeNull();
  });

  it("preserves server error detail for unprocessable payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          Response.json(
            { message: "Updating achievement contributors is not supported." },
            { status: 422 },
          ),
      ),
    );
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("user-id");

    await expect(client.patch("/achievements/id", { contributors: [] })).rejects.toMatchObject({
      kind: "bad-request",
      message: "提交内容不符合业务规则",
      status: 422,
      detail: "Updating achievement contributors is not supported.",
    });
  });

  it("sends achievement submit and archive action POST requests without a body", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("user-id");
    await client.post("/achievements/achievement-id/submit");
    await client.post("/achievements/achievement-id/archive");

    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mock.calls.forEach((call) => {
      const [, init] = call as unknown as [string, RequestInit];
      const headers = init.headers as Headers;

      expect(init.method).toBe("POST");
      expect(init.body).toBeUndefined();
      expect(headers.get("Content-Type")).toBeNull();
    });
  });

  it("sends achievement void action POST requests with a reason body", async () => {
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("user-id");
    await client.post("/achievements/achievement-id/void", { reason: "重复登记" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe("http://localhost/api/achievements/achievement-id/void");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ reason: "重复登记" }));
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("sends multipart form data without overriding the content type", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "attachment-id" }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const formData = new FormData();
    formData.append("file", new Blob(["%PDF synthetic"]), "paper.pdf");

    const client = createApiClient("user-id");
    await expect(
      client.postForm?.("/achievements/achievement-id/attachments", formData),
    ).resolves.toEqual({ id: "attachment-id" });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe("http://localhost/api/achievements/achievement-id/attachments");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.body).toBe(formData);
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBe("user-id");
  });

  it("sends department import dry-run as multipart form data", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        importType: "DEPARTMENT_METADATA",
        dryRun: true,
        file: {
          name: "departments.csv",
          size: 25,
          mimeType: "text/csv",
          encoding: "utf-8",
        },
        columns: {
          required: ["code", "name"],
          optional: ["parentCode"],
          received: ["code", "name", "parentCode"],
        },
        summary: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          warningRows: 0,
          createCandidates: 1,
          existingCodeRows: 0,
        },
        rows: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const file = new File(["code,name\nRD,Research"], "departments.csv", {
      type: "text/csv",
    });
    const client = createApiClient("admin-user-id");
    await expect(client.dryRunDepartmentImport({ file })).resolves.toMatchObject({
      importType: "DEPARTMENT_METADATA",
      dryRun: true,
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const body = init.body as FormData;

    expect(url).toBe("http://localhost/api/imports/departments/dry-run");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("sends department import apply as CREATE_ONLY multipart form data", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        importType: "DEPARTMENT_METADATA",
        dryRun: false,
        mode: "CREATE_ONLY",
        file: {
          name: "departments.csv",
          size: 25,
          mimeType: "text/csv",
          encoding: "utf-8",
        },
        summary: {
          totalRows: 1,
          createdRows: 1,
          skippedRows: 0,
          failedRows: 0,
          errorCount: 0,
          warningCount: 0,
        },
        errors: [],
        rows: [
          {
            rowNumber: 2,
            code: "RD",
            status: "CREATED",
            createdDepartmentId: "10000000-0000-4000-8000-000000000001",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const file = new File(["code,name\nRD,Research"], "departments.csv", {
      type: "text/csv",
    });
    const client = createApiClient("admin-user-id");
    await expect(
      client.applyDepartmentImport({ file, mode: "CREATE_ONLY" }),
    ).resolves.toMatchObject({
      importType: "DEPARTMENT_METADATA",
      dryRun: false,
      mode: "CREATE_ONLY",
      summary: {
        createdRows: 1,
      },
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const body = init.body as FormData;

    expect(url).toBe("http://localhost/api/imports/departments/apply");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
    expect(body.get("mode")).toBe("CREATE_ONLY");
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("lists import job history through the /api import-jobs read endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.listImportJobHistory({
        family: "ACHIEVEMENT",
        mode: "CREATE_DRAFT_ONLY",
        achievementType: "PAPER",
        page: 1,
        pageSize: 10,
      }),
    ).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe(
      "http://localhost/api/import-jobs?family=ACHIEVEMENT&mode=CREATE_DRAFT_ONLY&achievementType=PAPER&page=1&pageSize=10",
    );
    expect(init.method).toBe("GET");
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("loads import job history detail through the /api import-jobs read endpoint", async () => {
    const importJobId = "10000000-0000-4000-8000-000000000073";
    const fetchMock = vi.fn(async () =>
      Response.json({
        id: importJobId,
        family: "DEPARTMENT",
        mode: "CREATE_ONLY",
        achievementType: null,
        status: "SUCCESS",
        acceptedRowCount: 1,
        createdBusinessCount: 1,
        createdCompanionCount: 0,
        auditCount: 1,
        safeErrorCodes: [],
        createdAt: "2026-07-04T00:00:00.000Z",
        completedAt: "2026-07-04T00:00:01.000Z",
        safeSummary: { totalRows: 1 },
        runs: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(client.getImportJobHistoryDetail(importJobId)).resolves.toMatchObject({
      id: importJobId,
      family: "DEPARTMENT",
      mode: "CREATE_ONLY",
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe(`http://localhost/api/import-jobs/${importJobId}`);
    expect(init.method).toBe("GET");
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("lists safe import job item history through the route-scoped items endpoint", async () => {
    const importJobId = "10000000-0000-4000-8000-000000000073";
    const fetchMock = vi.fn(async () =>
      Response.json({
        items: [
          {
            rowNumber: 2,
            plannedAction: "CREATE_DRAFT",
            status: "SUCCESS",
            safeCode: null,
            targetType: "ACHIEVEMENT",
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.listImportJobHistoryItems(importJobId, {
        status: " SUCCESS ",
        plannedAction: " CREATE_DRAFT ",
        targetType: " ACHIEVEMENT ",
        safeCode: "  ",
        page: 1,
        pageSize: 10,
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          rowNumber: 2,
          plannedAction: "CREATE_DRAFT",
          status: "SUCCESS",
          safeCode: null,
          targetType: "ACHIEVEMENT",
        },
      ],
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe(
      `http://localhost/api/import-jobs/${importJobId}/items?status=SUCCESS&plannedAction=CREATE_DRAFT&targetType=ACHIEVEMENT&page=1&pageSize=10`,
    );
    expect(init.method).toBe("GET");
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("builds safe import job item queries without unsupported fields", () => {
    const query = buildImportJobItemHistoryQuery({
      status: " FAILED ",
      plannedAction: " SKIP ",
      targetType: " USER_ACCOUNT ",
      safeCode: " SAFE_VALIDATION_ERROR ",
      page: 2,
      pageSize: 25,
      runId: "should-not-pass",
      targetId: "should-not-pass",
      rawJson: "should-not-pass",
    } as unknown as Parameters<typeof buildImportJobItemHistoryQuery>[0]);

    expect(query).toEqual({
      status: "FAILED",
      plannedAction: "SKIP",
      targetType: "USER_ACCOUNT",
      safeCode: "SAFE_VALIDATION_ERROR",
      page: 2,
      pageSize: 25,
    });
    expect(serializeQuery(query)).not.toContain("runId");
    expect(serializeQuery(query)).not.toContain("targetId");
    expect(serializeQuery(query)).not.toContain("rawJson");
  });

  it("sends user account import dry-run as multipart form data", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        importType: "USER_ACCOUNT",
        dryRun: true,
        file: {
          name: "users.csv",
          size: 96,
          mimeType: "text/csv",
          encoding: "utf-8",
        },
        columns: {
          required: ["email", "displayName", "departmentCode", "roleCode"],
          optional: ["employeeNo", "scopeType", "scopeDepartmentCode", "status"],
          received: ["email", "displayName", "departmentCode", "roleCode"],
        },
        summary: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          warningRows: 0,
          createCandidates: 1,
          existingUserRows: 0,
          existingEmployeeNoRows: 0,
          existingRoleAssignmentRows: 0,
          reactivationCandidateRows: 0,
          employeeNoDbConflictCheck: "AVAILABLE",
        },
        rows: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const file = new File(
      ["email,displayName,departmentCode,roleCode\nresearcher@example.com,Researcher,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv" },
    );
    const client = createApiClient("admin-user-id");
    await expect(client.dryRunUserAccountImport({ file })).resolves.toMatchObject({
      importType: "USER_ACCOUNT",
      dryRun: true,
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const body = init.body as FormData;

    expect(url).toBe("http://localhost/api/users/import/dry-run");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("sends user account import apply as pending no-credential multipart form data", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        importType: "USER_ACCOUNT",
        dryRun: false,
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
        file: {
          name: "users.csv",
          size: 96,
          mimeType: "text/csv",
          encoding: "utf-8",
        },
        summary: {
          totalRows: 1,
          createdUsersCount: 1,
          createdRolesCount: 1,
          skippedRows: 0,
          failedRows: 0,
          errorCount: 0,
          warningCount: 0,
          auditOperation: "USER_ACCOUNT_IMPORT_CREATE_PENDING_NO_CREDENTIAL",
        },
        errors: [],
        rows: [
          {
            rowNumber: 2,
            emailMasked: "r***@example.com",
            status: "CREATED",
            createdUserId: "40000000-0000-4000-8000-000000000099",
            createdUserRoleIds: ["50000000-0000-4000-8000-000000000099"],
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const file = new File(
      ["email,displayName,departmentCode,roleCode\nresearcher@example.com,Researcher,D001,RESEARCHER"],
      "users.csv",
      { type: "text/csv" },
    );
    const client = createApiClient("admin-user-id");
    await expect(
      client.applyUserAccountImport({
        file,
        mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      }),
    ).resolves.toMatchObject({
      importType: "USER_ACCOUNT",
      dryRun: false,
      mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      summary: {
        createdUsersCount: 1,
        createdRolesCount: 1,
      },
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const body = init.body as FormData;

    expect(url).toBe("http://localhost/api/users/import/apply");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
    expect(body.get("mode")).toBe("CREATE_ONLY_PENDING_NO_CREDENTIAL");
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("sends achievement import dry-run as multipart form data", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        importType: "ACHIEVEMENT",
        dryRun: true,
        file: {
          name: "achievements.csv",
          size: 128,
          mimeType: "text/csv",
          encoding: "utf-8",
        },
        columns: {
          required: ["type", "title", "departmentCode", "contributors"],
          optional: ["ownerEmail", "ownerEmployeeNo", "status", "DOI"],
          received: ["type", "title", "ownerEmail", "departmentCode", "contributors"],
        },
        summary: {
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          warningRows: 0,
          createDraftCandidates: 1,
          duplicateIdentifierRows: 0,
          dbConflictRows: 0,
          ownerEmployeeNoLookup: "NOT_AVAILABLE",
        },
        rows: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const file = new File(
      ["type,title,ownerEmail,departmentCode,contributors\nPAPER,Paper,owner@example.org,RD,A|AUTHOR||owner@example.org|Lab"],
      "achievements.csv",
      { type: "text/csv" },
    );
    const client = createApiClient("admin-user-id");
    await expect(client.dryRunAchievementImport({ file })).resolves.toMatchObject({
      importType: "ACHIEVEMENT",
      dryRun: true,
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const body = init.body as FormData;

    expect(url).toBe("http://localhost/api/achievements/import/dry-run");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("sends achievement import apply as CREATE_DRAFT_ONLY multipart form data", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        importType: "ACHIEVEMENT",
        dryRun: false,
        mode: "CREATE_DRAFT_ONLY",
        file: {
          name: "achievements.csv",
          size: 128,
          mimeType: "text/csv",
          encoding: "utf-8",
        },
        summary: {
          totalRows: 1,
          createdAchievementsCount: 1,
          createdPaperDetailsCount: 1,
          createdPatentDetailsCount: 0,
          createdSoftwareCopyrightDetailsCount: 0,
          createdContributorsCount: 2,
          skippedRows: 0,
          failedRows: 0,
          errorCount: 0,
          warningCount: 0,
          auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
        },
        errors: [],
        rows: [
          {
            rowNumber: 2,
            status: "CREATED",
            createdAchievementId: "70000000-0000-4000-8000-000000000001",
            type: "PAPER",
            achievementStatus: "DRAFT",
            departmentId: "20000000-0000-4000-8000-000000000001",
            ownerUserId: "30000000-0000-4000-8000-000000000001",
            contributorCount: 2,
            auditOperation: "ACHIEVEMENT_IMPORT_CREATE_DRAFT",
          },
        ],
      }),
    );
    const origin = ["http", "://localhost"].join("");
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin } });

    const file = new File(["type,title\nPAPER,Paper"], "achievements.csv", {
      type: "text/csv",
    });
    const client = createApiClient("admin-user-id");
    await expect(
      client.applyAchievementImport({ file, mode: "CREATE_DRAFT_ONLY" }),
    ).resolves.toMatchObject({
      importType: "ACHIEVEMENT",
      dryRun: false,
      mode: "CREATE_DRAFT_ONLY",
      summary: {
        createdAchievementsCount: 1,
        createdPaperDetailsCount: 1,
        createdPatentDetailsCount: 0,
        createdSoftwareCopyrightDetailsCount: 0,
      },
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;
    const body = init.body as FormData;

    expect(url).toBe([origin, "/api/achievements/import/apply"].join(""));
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("file")).toBe(file);
    expect(body.get("mode")).toBe("CREATE_DRAFT_ONLY");
    expect(headers.get("Content-Type")).toBeNull();
    expect(headers.get("X-Demo-User-Id")).toBe("admin-user-id");
  });

  it("downloads attachment blobs with credentials and demo user context", async () => {
    const blob = new Blob(["download body"], { type: "application/pdf" });
    const fetchMock = vi.fn(async () => new Response(blob, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("user-id");
    await expect(
      client.downloadBlob?.("/achievements/achievement-id/attachments/attachment-id/download"),
    ).resolves.toBeInstanceOf(Blob);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe(
      "http://localhost/api/achievements/achievement-id/attachments/attachment-id/download",
    );
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("include");
    expect(headers.get("X-Demo-User-Id")).toBe("user-id");
    expect(headers.get("Content-Type")).toBeNull();
  });

  it("posts fee review approve and reject actions with JSON payloads", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          id: "fee-id",
          reviewStatus: "APPROVED",
          payStatus: "PENDING",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          id: "fee-id",
          reviewStatus: "REJECTED",
          payStatus: "PENDING",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("reviewer-user-id");
    await expect(client.approveFeeReview("fee-id", { reason: "finance checked" }))
      .resolves.toMatchObject({ reviewStatus: "APPROVED" });
    await expect(client.rejectFeeReview("fee-id", { reason: "missing support" }))
      .resolves.toMatchObject({ reviewStatus: "REJECTED" });

    const [approveUrl, approveInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [rejectUrl, rejectInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];

    expect(approveUrl).toBe("http://localhost/api/fees/fee-id/review/approve");
    expect(approveInit.method).toBe("POST");
    expect(approveInit.body).toBe(JSON.stringify({ reason: "finance checked" }));
    expect(rejectUrl).toBe("http://localhost/api/fees/fee-id/review/reject");
    expect(rejectInit.method).toBe("POST");
    expect(rejectInit.body).toBe(JSON.stringify({ reason: "missing support" }));

    const serializedPayloads = JSON.stringify([approveInit.body, rejectInit.body]);
    expect(serializedPayloads).not.toContain("amount");
    expect(serializedPayloads).not.toContain("voucherNo");
    expect(serializedPayloads).not.toContain("VOUCHER");
  });

  it("gets fee review history through the backend timeline route", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      Response.json([
        {
          id: "history-id",
          feeRecordId: "fee-id",
          departmentId: "department-id",
          reviewerId: "reviewer-id",
          action: "APPROVE",
          fromStatus: "PENDING",
          toStatus: "APPROVED",
          reason: "finance checked",
          createdAt: "2026-07-01T08:00:00.000Z",
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("reviewer-user-id");
    const result = await client.listFeeReviewHistory("fee-id");

    expect(result).toEqual([
      expect.objectContaining({
        feeRecordId: "fee-id",
        action: "APPROVE",
        fromStatus: "PENDING",
        toStatus: "APPROVED",
        reason: "finance checked",
      }),
    ]);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe("http://localhost/api/fees/fee-id/review-history");
    expect(init.method).toBe("GET");
    expect(headers.get("X-Demo-User-Id")).toBe("reviewer-user-id");

    const serializedResponse = JSON.stringify(result);
    expect(serializedResponse).not.toContain("amount");
    expect(serializedResponse).not.toContain("voucherNo");
    expect(serializedResponse).not.toContain("storageKey");
    expect(serializedResponse).not.toContain("checksum");
  });
});

describe("account management API client", () => {
  it("serializes listAccountUsers filters and pagination", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        items: [makeAccountUserResponse()],
        total: 1,
        page: 2,
        pageSize: 20,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    const result = await client.listAccountUsers({
      keyword: "researcher",
      status: "ACTIVE",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roleCode: "RESEARCHER",
      page: 2,
      pageSize: 20,
    });

    expect(result.total).toBe(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "http://localhost/api/account-management/users?keyword=researcher&status=ACTIVE&departmentId=10000000-0000-4000-8000-000000000001&roleCode=RESEARCHER&page=2&pageSize=20",
    );
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("include");
  });

  it("gets account user detail with the correct path", async () => {
    const fetchMock = vi.fn(async () => Response.json(makeAccountUserResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(client.getAccountUser("user-1")).resolves.toMatchObject({
      id: "user-1",
      email: "researcher@example.com",
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost/api/account-management/users/user-1");
    expect(init.method).toBe("GET");
  });

  it("creates an account user without expecting sensitive response fields", async () => {
    const fetchMock = vi.fn(async () => Response.json(makeAccountUserResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    const result = await client.createAccountUser({
      email: "researcher@example.com",
      name: "Researcher",
      departmentId: "10000000-0000-4000-8000-000000000001",
      roles: [
        {
          roleCode: "RESEARCHER",
          scopeType: "DEPARTMENT",
          departmentId: "10000000-0000-4000-8000-000000000001",
        },
      ],
      initialPassword: "safe-password-123",
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost/api/account-management/users");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({
        email: "researcher@example.com",
        name: "Researcher",
        departmentId: "10000000-0000-4000-8000-000000000001",
        roles: [
          {
            roleCode: "RESEARCHER",
            scopeType: "DEPARTMENT",
            departmentId: "10000000-0000-4000-8000-000000000001",
          },
        ],
        initialPassword: "safe-password-123",
      }),
    );
    const serializedResult = JSON.stringify(result);
    expect(serializedResult).not.toContain("safe-password-123");
    expect(serializedResult).not.toContain("passwordHash");
    expect(serializedResult).not.toContain("token");
    expect(serializedResult).not.toContain("credentialSecret");
  });

  it("posts disable and enable account user actions with reason payloads", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          user: makeAccountUserResponse({ status: "DISABLED" }),
          revokedSessionCount: 2,
        }),
      )
      .mockResolvedValueOnce(Response.json(makeAccountUserResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.disableAccountUser("user-1", { reason: "offboarding" }),
    ).resolves.toMatchObject({ revokedSessionCount: 2 });
    await expect(
      client.enableAccountUser("user-1", { reason: "returned" }),
    ).resolves.toMatchObject({ status: "ACTIVE" });

    const [disableUrl, disableInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [enableUrl, enableInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];

    expect(disableUrl).toBe("http://localhost/api/account-management/users/user-1/disable");
    expect(disableInit.method).toBe("POST");
    expect(disableInit.body).toBe(JSON.stringify({ reason: "offboarding" }));
    expect(enableUrl).toBe("http://localhost/api/account-management/users/user-1/enable");
    expect(enableInit.method).toBe("POST");
    expect(enableInit.body).toBe(JSON.stringify({ reason: "returned" }));
  });

  it("posts role assignment and revoke account user actions", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          user: makeAccountUserResponse(),
          userRoleId: "user-role-1",
        }),
      )
      .mockResolvedValueOnce(Response.json(makeAccountUserResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.assignAccountUserRole("user-1", {
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        departmentId: "10000000-0000-4000-8000-000000000001",
        reason: "department onboarding",
      }),
    ).resolves.toMatchObject({ userRoleId: "user-role-1" });
    await expect(
      client.revokeAccountUserRole("user-1", "user-role-1", {
        reason: "role changed",
      }),
    ).resolves.toMatchObject({ id: "user-1" });

    const [assignUrl, assignInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [revokeUrl, revokeInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];

    expect(assignUrl).toBe("http://localhost/api/account-management/users/user-1/roles");
    expect(assignInit.method).toBe("POST");
    expect(assignInit.body).toBe(
      JSON.stringify({
        roleCode: "RESEARCHER",
        scopeType: "DEPARTMENT",
        departmentId: "10000000-0000-4000-8000-000000000001",
        reason: "department onboarding",
      }),
    );
    expect(revokeUrl).toBe(
      "http://localhost/api/account-management/users/user-1/roles/user-role-1/revoke",
    );
    expect(revokeInit.method).toBe("POST");
    expect(revokeInit.body).toBe(JSON.stringify({ reason: "role changed" }));
  });

  it("posts account user department changes", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        makeAccountUserResponse({
          departmentId: "10000000-0000-4000-8000-000000000002",
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.changeAccountUserDepartment("user-1", {
        departmentId: "10000000-0000-4000-8000-000000000002",
        reason: "transfer",
      }),
    ).resolves.toMatchObject({
      department: {
        id: "10000000-0000-4000-8000-000000000002",
      },
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost/api/account-management/users/user-1/department");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({
        departmentId: "10000000-0000-4000-8000-000000000002",
        reason: "transfer",
      }),
    );
  });

  it("posts account lifecycle admin actions without returning token material", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          userId: "user-1",
          deliveryStatus: "QUEUED",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          userId: "user-1",
          deliveryStatus: "QUEUED",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          userId: "user-1",
          deliveryStatus: "QUEUED",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          revokedTokenCount: 1,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    const invite = await client.createInvite({
      email: "invited@example.com",
      name: "Invited User",
      departmentId: "department-1",
      roles: [{ roleCode: "RESEARCHER", scopeType: "GLOBAL" }],
      reason: "onboarding",
    });
    const resend = await client.resendInvite("user-1");
    const reset = await client.requestAdminPasswordReset("user-1", {
      reason: "manual reset",
    });
    const revoke = await client.revokePasswordResetTokens("user-1", {
      reason: "stale",
    });

    expect(invite).toEqual({ userId: "user-1", deliveryStatus: "QUEUED" });
    expect(resend).toEqual({ userId: "user-1", deliveryStatus: "QUEUED" });
    expect(reset).toEqual({ userId: "user-1", deliveryStatus: "QUEUED" });
    expect(revoke).toEqual({ revokedTokenCount: 1 });

    const [inviteUrl, inviteInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [resendUrl, resendInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];
    const [resetUrl, resetInit] = fetchMock.mock.calls[2] as unknown as [
      string,
      RequestInit,
    ];
    const [revokeUrl, revokeInit] = fetchMock.mock.calls[3] as unknown as [
      string,
      RequestInit,
    ];

    expect(inviteUrl).toBe("http://localhost/api/account-management/invites");
    expect(inviteInit.method).toBe("POST");
    expect(inviteInit.body).toBe(
      JSON.stringify({
        email: "invited@example.com",
        name: "Invited User",
        departmentId: "department-1",
        roles: [{ roleCode: "RESEARCHER", scopeType: "GLOBAL" }],
        reason: "onboarding",
      }),
    );
    expect(resendUrl).toBe("http://localhost/api/account-management/users/user-1/invite/resend");
    expect(resendInit.method).toBe("POST");
    expect(resetUrl).toBe("http://localhost/api/account-management/users/user-1/password-reset");
    expect(resetInit.body).toBe(JSON.stringify({ reason: "manual reset" }));
    expect(revokeUrl).toBe(
      "http://localhost/api/account-management/users/user-1/password-reset/revoke",
    );
    expect(revokeInit.body).toBe(JSON.stringify({ reason: "stale" }));

    const serialized = JSON.stringify([invite, resend, reset, revoke]);
    expect(serialized).not.toContain("raw-token");
    expect(serialized).not.toContain("http://");
    expect(serialized).not.toContain("password");
  });

  it("passes account management API errors through the existing ApiError mechanism", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ message: "User role assignment already exists." }, { status: 409 }),
      ),
    );
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.assignAccountUserRole("user-1", {
        roleCode: "RESEARCHER",
        scopeType: "GLOBAL",
      }),
    ).rejects.toMatchObject({
      kind: "unknown",
      status: 409,
      detail: "User role assignment already exists.",
    });
  });

  it("does not add production demo header behavior for account management methods", async () => {
    const fetchMock = vi.fn(async () => Response.json(makeAccountUserResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient(" demo-user-id ", { allowDemoUserHeader: false });
    await client.getAccountUser("user-1");

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Headers).get("X-Demo-User-Id")).toBeNull();
    expect(init.credentials).toBe("include");
  });
});

describe("settings API integration API client", () => {
  it("serializes listApiIntegrations filters and pagination", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        items: [makeApiIntegrationResponse()],
        total: 1,
        page: 2,
        pageSize: 20,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    const result = await client.listApiIntegrations({
      keyword: "doi",
      provider: "DOI",
      enabled: true,
      includeArchived: true,
      page: 2,
      pageSize: 20,
    });

    expect(result.total).toBe(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "http://localhost/api/settings/api-integrations?keyword=doi&provider=DOI&enabled=true&includeArchived=true&page=2&pageSize=20",
    );
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("include");
  });

  it("calls create, update, archive, and restore paths without sensitive response fields", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(makeApiIntegrationResponse()))
      .mockResolvedValueOnce(Response.json(makeApiIntegrationResponse({ timeoutMs: 5000 })))
      .mockResolvedValueOnce(
        Response.json(
          makeApiIntegrationResponse({
            enabled: false,
            archivedAt: "2026-06-29T01:00:00.000Z",
          }),
        ),
      )
      .mockResolvedValueOnce(Response.json(makeApiIntegrationResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    const created = await client.createApiIntegration({
      code: "DOI_LOOKUP",
      provider: "DOI",
      enabled: true,
      timeoutMs: 3000,
      configRef: "doi.lookup.default",
    });
    const updated = await client.updateApiIntegration("integration-1", {
      timeoutMs: 5000,
      configRef: null,
    });
    const archived = await client.archiveApiIntegration("integration-1", {
      reason: "unused",
    });
    const restored = await client.restoreApiIntegration("integration-1", {
      reason: "restore",
    });

    expect(created.code).toBe("DOI_LOOKUP");
    expect(updated.timeoutMs).toBe(5000);
    expect(archived.archivedAt).toBeTruthy();
    expect(restored.archivedAt).toBeNull();

    const [createUrl, createInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [updateUrl, updateInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];
    const [archiveUrl, archiveInit] = fetchMock.mock.calls[2] as unknown as [
      string,
      RequestInit,
    ];
    const [restoreUrl, restoreInit] = fetchMock.mock.calls[3] as unknown as [
      string,
      RequestInit,
    ];

    expect(createUrl).toBe("http://localhost/api/settings/api-integrations");
    expect(createInit.method).toBe("POST");
    expect(createInit.body).toBe(
      JSON.stringify({
        code: "DOI_LOOKUP",
        provider: "DOI",
        enabled: true,
        timeoutMs: 3000,
        configRef: "doi.lookup.default",
      }),
    );
    expect(updateUrl).toBe("http://localhost/api/settings/api-integrations/integration-1");
    expect(updateInit.method).toBe("PATCH");
    expect(updateInit.body).toBe(JSON.stringify({ timeoutMs: 5000, configRef: null }));
    expect(archiveUrl).toBe(
      "http://localhost/api/settings/api-integrations/integration-1/archive",
    );
    expect(archiveInit.body).toBe(JSON.stringify({ reason: "unused" }));
    expect(restoreUrl).toBe(
      "http://localhost/api/settings/api-integrations/integration-1/restore",
    );
    expect(restoreInit.body).toBe(JSON.stringify({ reason: "restore" }));

    const serialized = JSON.stringify([created, updated, archived, restored]);
    expect(serialized).not.toContain("raw-provider-value");
  });

  it("calls mock demo run and recent safe ApiCallLog paths", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(makeApiIntegrationMockRunResponse()))
      .mockResolvedValueOnce(
        Response.json({
          items: [makeApiCallLogSummary()],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    const run = await client.runApiIntegrationMockDemo({
      provider: "DOI",
      scenario: "DOI_LOOKUP",
      resultMode: "SUCCESS",
    });
    const logs = await client.listApiCallLogs({ limit: 10 });

    expect(run.mockOnly).toBe(true);
    expect(logs.items).toHaveLength(1);
    const [firstLog] = logs.items;
    expect(firstLog?.requestId).toBe("mock-request-1");

    const [runUrl, runInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [logsUrl, logsInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];

    expect(runUrl).toBe(
      "http://localhost/api/settings/api-integrations/mock-demo/run",
    );
    expect(runInit.method).toBe("POST");
    expect(runInit.body).toBe(
      JSON.stringify({
        provider: "DOI",
        scenario: "DOI_LOOKUP",
        resultMode: "SUCCESS",
      }),
    );
    expect(logsUrl).toBe(
      "http://localhost/api/settings/api-integrations/mock-demo/logs?limit=10",
    );
    expect(logsInit.method).toBe("GET");
    expect(JSON.stringify([run, logs])).not.toContain("token");
    expect(JSON.stringify([run, logs])).not.toContain("rawResponse");
  });
});

describe("account lifecycle public auth API client", () => {
  it("posts reset request, reset confirm, and invite accept without demo identity headers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ accepted: true }))
      .mockResolvedValueOnce(Response.json({ reset: true }))
      .mockResolvedValueOnce(Response.json({ accepted: true }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createAuthClient();
    await expect(client.requestPasswordReset({ email: "user@example.com" })).resolves.toEqual({
      accepted: true,
    });
    await expect(
      client.confirmPasswordReset({
        token: "safe-test-reset-token-value",
        newPassword: "new-password-123",
      }),
    ).resolves.toEqual({ reset: true });
    await expect(
      client.acceptInvite({
        token: "safe-test-invite-token-value",
        password: "new-password-123",
      }),
    ).resolves.toEqual({ accepted: true });

    const [requestUrl, requestInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [confirmUrl, confirmInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];
    const [inviteUrl, inviteInit] = fetchMock.mock.calls[2] as unknown as [
      string,
      RequestInit,
    ];

    expect(requestUrl).toBe("http://localhost/api/auth/password-reset/request");
    expect(confirmUrl).toBe("http://localhost/api/auth/password-reset/confirm");
    expect(inviteUrl).toBe("http://localhost/api/auth/invites/accept");
    [requestInit, confirmInit, inviteInit].forEach((init) => {
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("include");
      expect((init.headers as Headers).get("X-Demo-User-Id")).toBeNull();
    });
  });
});

describe("department management API client", () => {
  it("serializes listDepartments filters and pagination including includeArchived", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        items: [makeDepartmentResponse()],
        total: 1,
        page: 2,
        pageSize: 20,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    const result = await client.listDepartments({
      keyword: "research",
      status: "ACTIVE",
      parentId: "10000000-0000-4000-8000-000000000001",
      includeArchived: true,
      page: 2,
      pageSize: 20,
    });

    expect(result.total).toBe(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      "http://localhost/api/departments?keyword=research&status=ACTIVE&parentId=10000000-0000-4000-8000-000000000001&includeArchived=true&page=2&pageSize=20",
    );
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("include");
  });

  it("gets department tree with filters", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        items: [{ ...makeDepartmentResponse(), children: [] }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.getDepartmentTree({ keyword: "center", includeArchived: false }),
    ).resolves.toMatchObject({ items: [{ code: "RESEARCH_CENTER" }] });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost/api/departments/tree?keyword=center&includeArchived=false");
    expect(init.method).toBe("GET");
  });

  it("gets department detail with the correct path", async () => {
    const fetchMock = vi.fn(async () => Response.json(makeDepartmentResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(client.getDepartmentDetail("department-1")).resolves.toMatchObject({
      id: "department-1",
      code: "RESEARCH_CENTER",
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://localhost/api/departments/department-1");
    expect(init.method).toBe("GET");
  });

  it("creates and updates departments with JSON payloads", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(makeDepartmentResponse()))
      .mockResolvedValueOnce(Response.json(makeDepartmentResponse({ name: "Updated Center" })));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.createDepartment({
        code: "RESEARCH_CENTER",
        name: "Research Center",
        parentId: null,
      }),
    ).resolves.toMatchObject({ name: "Research Center" });
    await expect(
      client.updateDepartment("department-1", {
        name: "Updated Center",
        parentId: "10000000-0000-4000-8000-000000000001",
      }),
    ).resolves.toMatchObject({ name: "Updated Center" });

    const [createUrl, createInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [updateUrl, updateInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];

    expect(createUrl).toBe("http://localhost/api/departments");
    expect(createInit.method).toBe("POST");
    expect(createInit.body).toBe(
      JSON.stringify({
        code: "RESEARCH_CENTER",
        name: "Research Center",
        parentId: null,
      }),
    );
    expect(updateUrl).toBe("http://localhost/api/departments/department-1");
    expect(updateInit.method).toBe("PATCH");
    expect(updateInit.body).toBe(
      JSON.stringify({
        name: "Updated Center",
        parentId: "10000000-0000-4000-8000-000000000001",
      }),
    );
  });

  it("posts disable and enable department actions with reason payloads", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          department: makeDepartmentResponse({ status: "ARCHIVED" }),
          impactSummary: {
            activeUsersCount: 0,
            activeUserRoleScopesCount: 0,
            pendingWorkflowTasksCount: 0,
            activeOrUnarchivedAchievementsCount: 2,
            feeRecordsCount: 3,
          },
        }),
      )
      .mockResolvedValueOnce(Response.json(makeDepartmentResponse()));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(
      client.disableDepartment("department-1", { reason: "merge" }),
    ).resolves.toMatchObject({
      impactSummary: { activeOrUnarchivedAchievementsCount: 2 },
    });
    await expect(
      client.enableDepartment("department-1", { reason: "restore" }),
    ).resolves.toMatchObject({ status: "ACTIVE" });

    const [disableUrl, disableInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const [enableUrl, enableInit] = fetchMock.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ];

    expect(disableUrl).toBe("http://localhost/api/departments/department-1/disable");
    expect(disableInit.method).toBe("POST");
    expect(disableInit.body).toBe(JSON.stringify({ reason: "merge" }));
    expect(enableUrl).toBe("http://localhost/api/departments/department-1/enable");
    expect(enableInit.method).toBe("POST");
    expect(enableInit.body).toBe(JSON.stringify({ reason: "restore" }));
  });

  it("passes department API 403 and 409 errors through the existing ApiError mechanism", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ message: "Missing required permission: system:config." }, { status: 403 }),
      )
      .mockResolvedValueOnce(
        Response.json({ message: "Department has active users or pending workflow tasks." }, { status: 409 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createApiClient("admin-user-id");
    await expect(client.listDepartments()).rejects.toMatchObject({
      kind: "forbidden",
      status: 403,
      detail: "Missing required permission: system:config.",
    });
    await expect(client.disableDepartment("department-1")).rejects.toMatchObject({
      kind: "unknown",
      status: 409,
      detail: "Department has active users or pending workflow tasks.",
    });
  });
});

describe("demo header policy", () => {
  it("allows demo headers only when the caller explicitly permits them", () => {
    expect(shouldSendDemoUserHeader(" demo-user-id ", true)).toBe(true);
    expect(shouldSendDemoUserHeader(" demo-user-id ", false)).toBe(false);
    expect(shouldSendDemoUserHeader("   ", true)).toBe(false);
    expect(shouldSendDemoUserHeader(null, true)).toBe(false);
  });
});

describe("createAuthClient", () => {
  it("calls auth endpoints with credentials and without demo headers", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ user: { id: "user-1" } }))
      .mockResolvedValueOnce(Response.json({ user: { id: "user-1" } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin: "http://localhost" } });

    const client = createAuthClient();
    await client.me();
    await client.login({ email: "admin@example.com", password: "safe-password-123" });
    await expect(client.logout()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [meUrl, meInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const [loginUrl, loginInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    const [logoutUrl, logoutInit] = fetchMock.mock.calls[2] as unknown as [string, RequestInit];

    expect(meUrl).toBe("http://localhost/api/auth/me");
    expect(loginUrl).toBe("http://localhost/api/auth/login");
    expect(logoutUrl).toBe("http://localhost/api/auth/logout");
    expect(meInit.credentials).toBe("include");
    expect(loginInit.credentials).toBe("include");
    expect(logoutInit.credentials).toBe("include");
    expect((meInit.headers as Headers).get("X-Demo-User-Id")).toBeNull();
    expect((loginInit.headers as Headers).get("X-Demo-User-Id")).toBeNull();
    expect((logoutInit.headers as Headers).get("X-Demo-User-Id")).toBeNull();
    expect(JSON.stringify(loginInit.body)).not.toContain("cookie");
    expect(JSON.stringify(logoutInit)).not.toContain("safe-password-123");
  });
});

const makeAccountUserResponse = (
  overrides: {
    status?: string;
    departmentId?: string;
  } = {},
) => ({
  id: "user-1",
  email: "researcher@example.com",
  name: "Researcher",
  status: overrides.status ?? "ACTIVE",
  department: {
    id: overrides.departmentId ?? "10000000-0000-4000-8000-000000000001",
    code: "INSTITUTE_ROOT",
    name: "Institute",
    status: "ACTIVE",
  },
  roles: [
    {
      id: "user-role-1",
      role: {
        id: "role-1",
        code: "RESEARCHER",
        name: "Researcher",
        status: "ACTIVE",
      },
      scopeType: "DEPARTMENT",
      scopeKey: "10000000-0000-4000-8000-000000000001",
      departmentId: "10000000-0000-4000-8000-000000000001",
      createdAt: "2026-06-24T00:00:00.000Z",
    },
  ],
  credential: {
    status: "ACTIVE",
    passwordUpdatedAt: "2026-06-24T00:00:00.000Z",
    disabledAt: null,
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
  },
  lastLogin: null,
  createdAt: "2026-06-24T00:00:00.000Z",
  updatedAt: "2026-06-24T00:00:00.000Z",
});

const makeDepartmentResponse = (
  overrides: {
    name?: string;
    status?: string;
  } = {},
) => ({
  id: "department-1",
  code: "RESEARCH_CENTER",
  name: overrides.name ?? "Research Center",
  parentId: null,
  status: overrides.status ?? "ACTIVE",
  createdAt: "2026-06-24T00:00:00.000Z",
  updatedAt: "2026-06-24T00:00:00.000Z",
  archivedAt: overrides.status === "ARCHIVED" ? "2026-06-25T00:00:00.000Z" : null,
});

const makeApiIntegrationResponse = (
  overrides: {
    enabled?: boolean;
    timeoutMs?: number;
    archivedAt?: string | null;
  } = {},
) => ({
  id: "integration-1",
  code: "DOI_LOOKUP",
  provider: "DOI",
  enabled: overrides.enabled ?? true,
  timeoutMs: overrides.timeoutMs ?? 3000,
  configRef: "doi.lookup.default",
  createdAt: "2026-06-29T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
  archivedAt: overrides.archivedAt ?? null,
});

const makeApiCallLogSummary = () => ({
  integrationCode: "DOI_LOOKUP",
  requestId: "mock-request-1",
  status: "SUCCESS",
  durationMs: 126,
  errorSummary: null,
  createdAt: "2026-06-29T00:00:00.000Z",
});

const makeApiIntegrationMockRunResponse = () => ({
  mockOnly: true,
  provider: "DOI",
  scenario: "DOI_LOOKUP",
  requestedResultMode: "SUCCESS",
  runStatus: "SUCCESS",
  integration: {
    code: "DOI_LOOKUP",
    provider: "DOI",
    enabled: true,
    archivedAt: null,
  },
  summary: "Synthetic DOI metadata was normalized for preview only.",
  syntheticSubject: "Synthetic DOI 10.0000/mock-demo-2026",
  safeResult: {
    source: "mock-adapter",
    writesBusinessRecord: false,
  },
  safetyNotice: "Mock demo only.",
  callLog: makeApiCallLogSummary(),
});
