import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, AuthUser } from "./api-client";
import {
  buildApiIntegrationMockDemoPayload,
  buildApiIntegrationListQuery,
  buildApiIntegrationReasonPayload,
  buildCreateApiIntegrationPayload,
  buildUpdateApiIntegrationPayload,
  createApiIntegrationFromForm,
  executeApiIntegrationOperation,
  fetchApiIntegrationDetail,
  fetchApiIntegrations,
  fetchRecentApiCallLogs,
  runApiIntegrationMockDemo,
  SettingsApiIntegrations,
  updateApiIntegrationFromForm,
} from "./SettingsApiIntegrations";
import type {
  ApiCallLogListResponse,
  ApiIntegrationListResponse,
  ApiIntegrationMetadata,
  ApiIntegrationMockRunResponse,
} from "./types";

const adminUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["system:config"],
};

const auditorUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["audit:read"],
};

const integration: ApiIntegrationMetadata = {
  id: "70000000-0000-4000-8000-000000000001",
  code: "DOI_LOOKUP",
  provider: "DOI",
  enabled: true,
  timeoutMs: 3000,
  configRef: "doi.lookup.default",
  createdAt: "2026-06-29T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
  archivedAt: null,
};

const archivedIntegration: ApiIntegrationMetadata = {
  ...integration,
  enabled: false,
  archivedAt: "2026-06-29T01:00:00.000Z",
};

describe("settings api integrations permission boundary", () => {
  it("renders a permission boundary and does not request APIs without system:config", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const html = renderToStaticMarkup(
      <SettingsApiIntegrations demoUserId="auditor-user-id" authUser={auditorUser} />,
    );

    expect(html).toContain("Current account cannot access Settings.");
    expect(html).toContain("does not request /settings/api-integrations");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("renders the operational page for system config users", () => {
    const html = renderToStaticMarkup(
      <SettingsApiIntegrations demoUserId="admin-user-id" authUser={adminUser} />,
    );

    expect(html).toContain("settings-api-page");
    expect(html).toContain("Import history overview");
    expect(html).toContain("read-only index");
    expect(html).toContain("API integrations");
    expect(html).toContain("External interface mock demo center");
    expect(html).toContain("Mock demo only / 非真实外部联调");
    expect(html).toContain("Config reference is a non-sensitive reference name");
    expect(html).not.toContain("API key");
  });
});

describe("settings api integration query helpers", () => {
  it("trims list filters and preserves pagination", () => {
    expect(
      buildApiIntegrationListQuery(
        {
          keyword: "  DOI  ",
          provider: "DOI",
          enabled: true,
          includeArchived: true,
        },
        2,
        50,
      ),
    ).toEqual({
      keyword: "DOI",
      provider: "DOI",
      enabled: true,
      includeArchived: true,
      page: 2,
      pageSize: 50,
    });
  });

  it("omits blank filters and false includeArchived", () => {
    expect(
      buildApiIntegrationListQuery(
        {
          keyword: " ",
          includeArchived: false,
        },
        1,
        20,
      ),
    ).toEqual({ page: 1, pageSize: 20 });
  });
});

describe("settings api integration API helpers", () => {
  it("loads list and detail through the settings client", async () => {
    const listResponse: ApiIntegrationListResponse = {
      items: [integration],
      total: 1,
      page: 1,
      pageSize: 20,
    };
    const client = {
      listApiIntegrations: vi.fn(async () => listResponse),
      getApiIntegration: vi.fn(async () => integration),
    } as unknown as Pick<
      AccountManagementApiClient,
      "listApiIntegrations" | "getApiIntegration"
    >;

    await expect(
      fetchApiIntegrations(client, { page: 1, pageSize: 20 }),
    ).resolves.toEqual(listResponse);
    await expect(fetchApiIntegrationDetail(client, integration.id)).resolves.toEqual(
      integration,
    );

    expect(client.listApiIntegrations).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(client.getApiIntegration).toHaveBeenCalledWith(integration.id);
  });

  it("runs mock demos and loads recent safe call logs through the settings client", async () => {
    const runResponse: ApiIntegrationMockRunResponse = {
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
      callLog: {
        integrationCode: "DOI_LOOKUP",
        requestId: "mock-request-1",
        status: "SUCCESS",
        durationMs: 126,
        errorSummary: null,
        createdAt: "2026-06-29T00:00:00.000Z",
      },
    };
    const logResponse: ApiCallLogListResponse = {
      items: [runResponse.callLog!],
    };
    const client = {
      runApiIntegrationMockDemo: vi.fn(async () => runResponse),
      listApiCallLogs: vi.fn(async () => logResponse),
    } as unknown as Pick<
      AccountManagementApiClient,
      "runApiIntegrationMockDemo" | "listApiCallLogs"
    >;

    await expect(
      runApiIntegrationMockDemo(client, {
        provider: "DOI",
        scenario: "DOI_LOOKUP",
        resultMode: "SUCCESS",
      }),
    ).resolves.toEqual(runResponse);
    await expect(fetchRecentApiCallLogs(client, { limit: 10 })).resolves.toEqual(
      logResponse,
    );

    expect(client.runApiIntegrationMockDemo).toHaveBeenCalledWith({
      provider: "DOI",
      scenario: "DOI_LOOKUP",
      resultMode: "SUCCESS",
    });
    expect(client.listApiCallLogs).toHaveBeenCalledWith({ limit: 10 });
    expect(JSON.stringify(runResponse)).not.toContain("token");
    expect(JSON.stringify(runResponse)).not.toContain("rawResponse");
  });

  it("normalizes malformed list responses into stable shapes", async () => {
    const client = {
      listApiIntegrations: vi.fn(async () => ({ items: null, total: null })),
    } as unknown as Pick<AccountManagementApiClient, "listApiIntegrations">;

    await expect(
      fetchApiIntegrations(client, { page: 3, pageSize: 10 }),
    ).resolves.toEqual({
      items: [],
      total: 0,
      page: 3,
      pageSize: 10,
    });
  });
});

describe("settings api integration payload helpers", () => {
  it("builds create payloads with trimmed code and config reference", () => {
    expect(
      buildCreateApiIntegrationPayload({
        code: " DOI_LOOKUP ",
        provider: "DOI",
        enabled: true,
        timeoutMs: 5000,
        configRef: " doi.lookup.default ",
      }),
    ).toEqual({
      code: "DOI_LOOKUP",
      provider: "DOI",
      enabled: true,
      timeoutMs: 5000,
      configRef: "doi.lookup.default",
    });
  });

  it("builds update payloads and rejects empty updates", () => {
    expect(
      buildUpdateApiIntegrationPayload({
        code: " DOI_LOOKUP_V2 ",
        enabled: false,
        configRef: " ",
      }),
    ).toEqual({
      code: "DOI_LOOKUP_V2",
      enabled: false,
      configRef: null,
    });

    expect(() => buildUpdateApiIntegrationPayload({})).toThrow(
      "At least one API integration update field is required.",
    );
  });

  it("trims optional operation reasons", () => {
    expect(buildApiIntegrationReasonPayload({ reason: "  unused  " })).toEqual({
      reason: "unused",
    });
    expect(buildApiIntegrationReasonPayload({ reason: "   " })).toEqual({});
  });

  it("builds mock demo payloads without adding external request data", () => {
    expect(
      buildApiIntegrationMockDemoPayload({
        provider: "FINANCE",
        scenario: "FINANCE_RECONCILE",
        resultMode: "DEGRADED",
      }),
    ).toEqual({
      provider: "FINANCE",
      scenario: "FINANCE_RECONCILE",
      resultMode: "DEGRADED",
    });
  });
});

describe("settings api integration operation helpers", () => {
  it("creates and updates integrations through client methods", async () => {
    const client = {
      createApiIntegration: vi.fn(async () => integration),
      updateApiIntegration: vi.fn(async () => ({ ...integration, timeoutMs: 5000 })),
    } as unknown as Pick<
      AccountManagementApiClient,
      "createApiIntegration" | "updateApiIntegration"
    >;

    await expect(
      createApiIntegrationFromForm(client, {
        code: "DOI_LOOKUP",
        provider: "DOI",
        enabled: true,
        timeoutMs: 3000,
        configRef: "doi.lookup.default",
      }),
    ).resolves.toEqual(integration);
    await expect(
      updateApiIntegrationFromForm(client, integration.id, {
        timeoutMs: 5000,
      }),
    ).resolves.toMatchObject({ timeoutMs: 5000 });

    expect(client.createApiIntegration).toHaveBeenCalledWith({
      code: "DOI_LOOKUP",
      provider: "DOI",
      enabled: true,
      timeoutMs: 3000,
      configRef: "doi.lookup.default",
    });
    expect(client.updateApiIntegration).toHaveBeenCalledWith(integration.id, {
      timeoutMs: 5000,
    });
  });

  it("archives and restores integrations with reason payloads", async () => {
    const client = {
      archiveApiIntegration: vi.fn(async () => archivedIntegration),
      restoreApiIntegration: vi.fn(async () => integration),
    } as unknown as Pick<
      AccountManagementApiClient,
      "archiveApiIntegration" | "restoreApiIntegration"
    >;

    await expect(
      executeApiIntegrationOperation({
        apiClient: client,
        operation: { kind: "archive", integration },
        reasonValues: { reason: " unused " },
      }),
    ).resolves.toEqual(archivedIntegration);
    await expect(
      executeApiIntegrationOperation({
        apiClient: client,
        operation: { kind: "restore", integration: archivedIntegration },
        reasonValues: { reason: " restore " },
      }),
    ).resolves.toEqual(integration);

    expect(client.archiveApiIntegration).toHaveBeenCalledWith(integration.id, {
      reason: "unused",
    });
    expect(client.restoreApiIntegration).toHaveBeenCalledWith(integration.id, {
      reason: "restore",
    });
  });
});
