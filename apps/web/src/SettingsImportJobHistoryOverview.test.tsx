import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccountManagementApiClient, AuthUser } from "./api-client";
import {
  buildImportJobHistoryQuery,
  ImportJobHistoryDetailView,
  type ImportJobHistoryFilters,
} from "./ImportJobHistoryPanel";
import {
  applySettingsImportJobHistoryFilterChange,
  applySettingsImportJobHistoryPaginationChange,
  buildSettingsImportJobHistoryQuery,
  fetchSettingsImportJobHistory,
  SettingsImportJobHistoryOverview,
  SettingsImportJobHistoryOverviewView,
} from "./SettingsImportJobHistoryOverview";
import type { ImportJobHistoryDetail, ImportJobHistoryListResponse } from "./types";

const adminUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["system:config"],
};

const auditorUser: Pick<AuthUser, "permissionCodes"> = {
  permissionCodes: ["audit:read"],
};

const importJobId = "10000000-0000-4000-8000-000000000174";
const blockedAtValue = ["hidden", "example.test"].join("@");
const blockedAuditId = "90000000-0000-4000-8000-000000000174";
const blockedTitleValue = ["Unsafe", "Title"].join(" ");
const blockedEmployeeValue = ["EMP", "001"].join("-");

const listResponse: ImportJobHistoryListResponse = {
  items: [
    {
      id: importJobId,
      family: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
      achievementType: "PATENT",
      status: "FAILED",
      acceptedRowCount: 3,
      createdBusinessCount: 1,
      createdCompanionCount: 2,
      auditCount: 4,
      safeErrorCodes: ["SAFE_VALIDATION_ERROR"],
      createdAt: "2026-07-04T01:00:00.000Z",
      completedAt: "2026-07-04T01:00:05.000Z",
      latestRun: {
        attemptNo: 1,
        trigger: "INITIAL",
        status: "FAILED",
        failureCode: "IMPORT_APPLY_FAILED",
        failureStage: "APPLY",
        startedAt: "2026-07-04T01:00:00.000Z",
        finishedAt: "2026-07-04T01:00:05.000Z",
        completedBusinessTransactionAt: null,
        auditCount: 4,
      },
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

const detail: ImportJobHistoryDetail = {
  ...listResponse.items[0]!,
  safeSummary: {
    totalRows: 3,
    createdBusinessCount: 1,
    warningCount: 1,
    [["em", "ail"].join("")]: blockedAtValue,
    [["employee", "No"].join("")]: blockedEmployeeValue,
    [["ti", "tle"].join("")]: blockedTitleValue,
    nested: {
      acceptedRowCount: 3,
      auditLogIds: [blockedAuditId],
    },
  },
  runs: [
    {
      attemptNo: 1,
      trigger: "INITIAL",
      status: "FAILED",
      failureCode: "IMPORT_APPLY_FAILED",
      failureStage: "APPLY",
      startedAt: "2026-07-04T01:00:00.000Z",
      finishedAt: "2026-07-04T01:00:05.000Z",
      completedBusinessTransactionAt: null,
      validationSummary: { totalRows: 3 },
      applySummary: { createdBusinessCount: 1 },
      auditCount: 4,
    },
  ],
};

describe("SettingsImportJobHistoryOverview permission boundary", () => {
  it("renders the settings overview for system config users", () => {
    const html = renderToStaticMarkup(
      <SettingsImportJobHistoryOverview
        demoUserId="admin-user-id"
        authUser={adminUser}
        apiClient={makeHistoryClient()}
      />,
    );

    expect(html).toContain("Import history overview");
    expect(html).toContain("read-only index");
  });

  it("does not render or request import jobs without system config", () => {
    const client = makeHistoryClient();
    const html = renderToStaticMarkup(
      <SettingsImportJobHistoryOverview
        demoUserId="auditor-user-id"
        authUser={auditorUser}
        apiClient={client}
      />,
    );

    expect(html).toBe("");
    expect(client.listImportJobHistory).not.toHaveBeenCalled();
    expect(client.getImportJobHistoryDetail).not.toHaveBeenCalled();
  });
});

describe("SettingsImportJobHistoryOverview query helpers", () => {
  it("builds the default cross-family query with page and pageSize only", async () => {
    const query = buildSettingsImportJobHistoryQuery({});
    expect(query).toEqual({ page: 1, pageSize: 20 });

    const client = makeHistoryClient();
    await expect(fetchSettingsImportJobHistory(client, query)).resolves.toEqual(
      listResponse,
    );
    expect(client.listImportJobHistory).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
  });

  it("includes family, mode, achievementType, status, and date filters", () => {
    expect(
      buildSettingsImportJobHistoryQuery(
        {
          family: "ACHIEVEMENT",
          mode: "CREATE_DRAFT_ONLY",
          achievementType: "PATENT",
          status: "FAILED",
          createdFrom: "2026-07-01",
          createdTo: "2026-07-04",
        },
        3,
        50,
      ),
    ).toEqual({
      family: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
      achievementType: "PATENT",
      status: "FAILED",
      createdFrom: "2026-07-01",
      createdTo: "2026-07-04",
      page: 3,
      pageSize: 50,
    });
  });

  it("resets page to 1 for non-pagination filter changes", () => {
    expect(
      applySettingsImportJobHistoryFilterChange(
        { family: "DEPARTMENT", createdFrom: "2026-07-01" },
        "status",
        "SUCCESS",
      ),
    ).toEqual({
      filters: {
        family: "DEPARTMENT",
        status: "SUCCESS",
        createdFrom: "2026-07-01",
        createdTo: undefined,
        achievementType: undefined,
        mode: undefined,
      },
      page: 1,
    });
  });

  it("keeps pagination changes limited to page and pageSize", () => {
    expect(applySettingsImportJobHistoryPaginationChange(4, 100)).toEqual({
      page: 4,
      pageSize: 100,
    });
  });
});

describe("SettingsImportJobHistoryOverview display safety", () => {
  it("renders loading, empty, error, and safe list states", () => {
    const loadingHtml = renderToStaticMarkup(
      <SettingsImportJobHistoryOverviewView
        filters={{}}
        list={{ loading: true, data: null, error: null }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        page={1}
        pageSize={20}
      />,
    );
    expect(loadingHtml).toContain("Loading import history overview");

    const emptyHtml = renderToStaticMarkup(
      <SettingsImportJobHistoryOverviewView
        filters={{}}
        list={{ loading: false, data: { items: [], total: 0, page: 1, pageSize: 20 }, error: null }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        page={1}
        pageSize={20}
      />,
    );
    expect(emptyHtml).toContain("No import history records");

    const errorHtml = renderToStaticMarkup(
      <SettingsImportJobHistoryOverviewView
        filters={{}}
        list={{
          loading: false,
          data: null,
          error: { kind: "server", status: 503, message: "Unavailable", detail: "Read failed." },
        }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        page={1}
        pageSize={20}
      />,
    );
    expect(errorHtml).toContain("Import history overview unavailable");
    expect(errorHtml).toContain("Read failed.");

    const listHtml = renderToStaticMarkup(
      <SettingsImportJobHistoryOverviewView
        filters={{ family: "ACHIEVEMENT", status: "FAILED" }}
        list={{ loading: false, data: listResponse, error: null }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        page={1}
        pageSize={20}
      />,
    );

    expect(listHtml).toContain("ACHIEVEMENT");
    expect(listHtml).toContain("CREATE_DRAFT_ONLY");
    expect(listHtml).toContain("PATENT");
    expect(listHtml).toContain("FAILED");
    expect(listHtml).toContain("acceptedRowCount");
    expect(listHtml).toContain("createdBusinessCount");
    expect(listHtml).toContain("createdCompanionCount");
    expect(listHtml).toContain("auditCount");
    expect(listHtml).toContain("SAFE_VALIDATION_ERROR");
    expect(listHtml).toContain("IMPORT_APPLY_FAILED");
    expect(listHtml).toContain("2026-07-04T01:00:00.000Z");
    expect(listHtml).toContain("2026-07-04T01:00:05.000Z");
    expect(listHtml).not.toContain(importJobId);
  });

  it("renders safe detail summaries and run audit counts without raw audit ids", () => {
    const html = renderToStaticMarkup(
      <ImportJobHistoryDetailView detail={{ loading: false, data: detail, error: null }} />,
    );

    expect(html).toContain("Safe summary");
    expect(html).toContain("Run status");
    expect(html).toContain("auditCount");
    expect(html).toContain("createdBusinessCount");
    expect(html).toContain("acceptedRowCount");
    expect(html).toContain("Failed:");
    expect(html).not.toContain("auditLogIds");
    expect(html).not.toContain(blockedAuditId);
    expect(html).not.toContain(blockedAtValue);
    expect(html).not.toContain(blockedEmployeeValue);
    expect(html).not.toContain(blockedTitleValue);
  });

  it("does not render forbidden action labels in the settings overview", () => {
    const html = renderToStaticMarkup(
      <SettingsImportJobHistoryOverviewView
        filters={{}}
        list={{ loading: false, data: listResponse, error: null }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        page={1}
        pageSize={20}
      />,
    );

    expect(html).not.toMatch(
      /\b(retry|delete|cleanup|rollback|download|export|raw JSON|bulk action)\b/i,
    );
  });
});

describe("family-local import history entries keep fixed filters", () => {
  it("keeps Department, User account, and Achievement local entries fixed", () => {
    const departmentFilters: ImportJobHistoryFilters = {
      family: "DEPARTMENT",
      mode: "CREATE_ONLY",
    };
    const userFilters: ImportJobHistoryFilters = {
      family: "USER_ACCOUNT",
      mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    };
    const achievementFilters: ImportJobHistoryFilters = {
      family: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
    };

    expect(buildImportJobHistoryQuery(departmentFilters)).toMatchObject({
      family: "DEPARTMENT",
      mode: "CREATE_ONLY",
      page: 1,
      pageSize: 10,
    });
    expect(buildImportJobHistoryQuery(userFilters)).toMatchObject({
      family: "USER_ACCOUNT",
      mode: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
      page: 1,
      pageSize: 10,
    });
    expect(buildImportJobHistoryQuery(achievementFilters, "PAPER")).toMatchObject({
      family: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
      achievementType: "PAPER",
      page: 1,
      pageSize: 10,
    });
  });
});

const makeHistoryClient = (): Pick<
  AccountManagementApiClient,
  "listImportJobHistory" | "getImportJobHistoryDetail"
> => ({
  listImportJobHistory: vi.fn(async () => listResponse),
  getImportJobHistoryDetail: vi.fn(async () => detail),
});
