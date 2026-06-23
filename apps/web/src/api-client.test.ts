import { afterEach, describe, expect, it, vi } from "vitest";
import {
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
