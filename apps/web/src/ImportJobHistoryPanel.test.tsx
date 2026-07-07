import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  buildImportJobItemHistoryPanelQuery,
  buildImportJobHistoryQuery,
  getSafeImportJobItemErrorMessage,
  getImportJobStatusExplanation,
  ImportJobHistoryDetailView,
  ImportJobItemHistoryPanelView,
  ImportJobHistoryPanelView,
  type ImportJobHistoryFilters,
} from "./ImportJobHistoryPanel";
import type {
  ImportJobHistoryDetail,
  ImportJobHistoryListResponse,
  ImportJobItemHistoryListResponse,
} from "./types";

const achievementFilters: ImportJobHistoryFilters = {
  family: "ACHIEVEMENT",
  mode: "CREATE_DRAFT_ONLY",
};

const listResponse: ImportJobHistoryListResponse = {
  items: [
    {
      id: "10000000-0000-4000-8000-000000000073",
      family: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
      achievementType: "PAPER",
      status: "SUCCESS",
      acceptedRowCount: 2,
      createdBusinessCount: 2,
      createdCompanionCount: 3,
      auditCount: 2,
      safeErrorCodes: [],
      createdAt: "2026-07-04T00:00:00.000Z",
      completedAt: "2026-07-04T00:00:03.000Z",
      latestRun: {
        attemptNo: 1,
        trigger: "INITIAL",
        status: "SUCCESS",
        failureCode: null,
        failureStage: null,
        startedAt: "2026-07-04T00:00:00.000Z",
        finishedAt: "2026-07-04T00:00:03.000Z",
        completedBusinessTransactionAt: "2026-07-04T00:00:02.000Z",
        auditCount: 2,
      },
    },
  ],
  total: 1,
  page: 1,
  pageSize: 10,
};

const blockedAtValue = ["hidden", "example.test"].join("@");
const blockedNumericValue = ["LOCAL", "VALUE", "001"].join("_");
const blockedLabelValue = ["Hidden", "label"].join(" ");
const blockedAuditReferenceKey = ["audit", "Log", "Ids"].join("");
const blockedAuditReferenceValue = ["LOCAL", "AUDIT", "REF"].join("_");

const detail: ImportJobHistoryDetail = {
  ...listResponse.items[0]!,
  safeSummary: {
    totalRows: 2,
    createdAchievementsCount: 2,
    [["em", "ail"].join("")]: blockedAtValue,
    [["employee", "No"].join("")]: blockedNumericValue,
    [["ti", "tle"].join("")]: blockedLabelValue,
    nested: {
      warningCount: 1,
      [blockedAuditReferenceKey]: [blockedAuditReferenceValue],
    },
  },
  runs: [
    {
      attemptNo: 1,
      trigger: "INITIAL",
      status: "SUCCESS",
      failureCode: null,
      failureStage: null,
      startedAt: "2026-07-04T00:00:00.000Z",
      finishedAt: "2026-07-04T00:00:03.000Z",
      completedBusinessTransactionAt: "2026-07-04T00:00:02.000Z",
      validationSummary: { totalRows: 2 },
      applySummary: { createdAchievementsCount: 2 },
      auditCount: 2,
    },
  ],
};

const itemHistoryResponse: ImportJobItemHistoryListResponse = {
  items: [
    {
      rowNumber: 2,
      plannedAction: "CREATE_DRAFT",
      status: "SUCCESS",
      safeCode: null,
      targetType: "ACHIEVEMENT",
    },
    {
      rowNumber: 3,
      plannedAction: "SKIP",
      status: "FAILED",
      safeCode: "SAFE_VALIDATION_ERROR",
      targetType: "ACHIEVEMENT",
    },
  ],
  total: 12,
  page: 1,
  pageSize: 10,
};

describe("ImportJobHistoryPanel", () => {
  it("builds read-only list queries with fixed family, mode, and optional achievement type", () => {
    expect(buildImportJobHistoryQuery(achievementFilters, "PATENT")).toEqual({
      family: "ACHIEVEMENT",
      mode: "CREATE_DRAFT_ONLY",
      achievementType: "PATENT",
      page: 1,
      pageSize: 10,
    });
  });

  it("renders loading, empty, error, and list states", () => {
    const loadingHtml = renderToStaticMarkup(
      <ImportJobHistoryPanelView
        title="Achievement import history"
        filters={achievementFilters}
        list={{ loading: true, data: null, error: null }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        onRefresh={vi.fn()}
      />,
    );
    expect(loadingHtml).toContain("正在加载导入记录");

    const emptyHtml = renderToStaticMarkup(
      <ImportJobHistoryPanelView
        title="Achievement import history"
        filters={achievementFilters}
        list={{ loading: false, data: { items: [], total: 0, page: 1, pageSize: 10 }, error: null }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        onRefresh={vi.fn()}
      />,
    );
    expect(emptyHtml).toContain("暂无导入记录");

    const errorHtml = renderToStaticMarkup(
      <ImportJobHistoryPanelView
        title="Achievement import history"
        filters={achievementFilters}
        list={{
          loading: false,
          data: null,
          error: { kind: "server", status: 503, message: "Unavailable", detail: "Read API failed." },
        }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        onRefresh={vi.fn()}
      />,
    );
    expect(errorHtml).toContain("导入记录暂不可用");
    expect(errorHtml).toContain("Read API failed.");

    const listHtml = renderToStaticMarkup(
      <ImportJobHistoryPanelView
        title="Achievement import history"
        filters={achievementFilters}
        list={{ loading: false, data: listResponse, error: null }}
        detail={{ loading: false, data: null, error: null }}
        detailOpen={false}
        achievementTypeFilter
        selectedAchievementType="PAPER"
        onRefresh={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );
    expect(listHtml).toContain("Achievement import history");
    expect(listHtml).toContain("ACHIEVEMENT");
    expect(listHtml).toContain("CREATE_DRAFT_ONLY");
    expect(listHtml).toContain("PAPER");
    expect(listHtml).toContain("SUCCESS");
    expect(listHtml).toContain("created counts");
    expect(listHtml).toContain("2026-07-04T00:00:03.000Z");
  });

  it("renders detail with safe summary, run status, and audit count without raw audit IDs", () => {
    const html = renderToStaticMarkup(
      <ImportJobHistoryDetailView
        detail={{ loading: false, data: detail, error: null }}
      />,
    );

    expect(html).toContain("安全摘要");
    expect(html).toContain("Run status");
    expect(html).toContain("审计记录数");
    expect(html).toContain("createdAchievementsCount");
    expect(html).toContain("warningCount");
    expect(html).toContain("Replay:");
    expect(html).not.toContain(blockedAuditReferenceKey);
    expect(html).not.toContain(blockedAuditReferenceValue);
    expect(html).not.toContain(blockedAtValue);
    expect(html).not.toContain(blockedNumericValue);
    expect(html).not.toContain(blockedLabelValue);
  });

  it("keeps detail explanations read-only and avoids forbidden control wording", () => {
    const text = [
      getImportJobStatusExplanation("SUCCESS"),
      getImportJobStatusExplanation("RUNNING"),
      getImportJobStatusExplanation("REJECTED"),
      getImportJobStatusExplanation("FAILED"),
    ].join(" ");

    expect(text).toContain("Replay:");
    expect(text).toContain("In-flight:");
    expect(text).toContain("Rejected:");
    expect(text).toContain("Failed:");
    expect(text).not.toMatch(/\b(retry|delete|cleanup|rollback|download)\b/i);
  });

  it("builds safe row history queries with only safe filters and pagination", () => {
    expect(
      buildImportJobItemHistoryPanelQuery(
        {
          status: " SUCCESS ",
          plannedAction: " CREATE_DRAFT ",
          targetType: " ACHIEVEMENT ",
          safeCode: "  ",
        },
        3,
        25,
      ),
    ).toEqual({
      status: "SUCCESS",
      plannedAction: "CREATE_DRAFT",
      targetType: "ACHIEVEMENT",
      safeCode: undefined,
      page: 3,
      pageSize: 25,
    });
  });

  it("renders safe row history states and only the five allowlisted columns", () => {
    const loadingHtml = renderToStaticMarkup(
      <ImportJobItemHistoryPanelView
        filters={{}}
        itemList={{ loading: true, data: null, error: null }}
        page={1}
        pageSize={10}
      />,
    );
    expect(loadingHtml).toContain("导入行记录");
    expect(loadingHtml).toContain("正在加载导入行记录");
    expect(loadingHtml).toContain("仅展示导入行安全摘要");
    expect(loadingHtml).not.toContain("GET /import-jobs/:id/items");
    expect(loadingHtml).not.toContain("not production import acceptance");

    const emptyHtml = renderToStaticMarkup(
      <ImportJobItemHistoryPanelView
        filters={{}}
        itemList={{
          loading: false,
          data: { items: [], total: 0, page: 1, pageSize: 10 },
          error: null,
        }}
        page={1}
        pageSize={10}
      />,
    );
    expect(emptyHtml).toContain("当前导入任务暂无安全行记录。");
    expect(emptyHtml).toContain("原始数据不在当前页面展示边界内");

    const errorHtml = renderToStaticMarkup(
      <ImportJobItemHistoryPanelView
        filters={{}}
        itemList={{
          loading: false,
          data: null,
          error: {
            kind: "forbidden",
            status: 403,
            message: "Forbidden",
            detail: "raw payload token DATABASE_URL",
          },
        }}
        page={1}
        pageSize={10}
      />,
    );
    expect(errorHtml).toContain("导入行记录暂不可用");
    expect(errorHtml).toContain("当前角色无权读取安全导入行记录。");
    expect(errorHtml).not.toContain("raw payload token DATABASE_URL");

    const listHtml = renderToStaticMarkup(
      <ImportJobItemHistoryPanelView
        filters={{
          status: "SUCCESS",
          plannedAction: "CREATE_DRAFT",
          targetType: "ACHIEVEMENT",
          safeCode: "SAFE_VALIDATION_ERROR",
        }}
        itemList={{ loading: false, data: itemHistoryResponse, error: null }}
        page={1}
        pageSize={10}
      />,
    );

    expect(listHtml).toContain("行号");
    expect(listHtml).toContain("计划动作");
    expect(listHtml).toContain("状态");
    expect(listHtml).toContain("安全错误码");
    expect(listHtml).toContain("目标类型");
    expect(listHtml).toContain("CREATE_DRAFT");
    expect(listHtml).toContain("SUCCESS");
    expect(listHtml).toContain("未返回");
    expect(listHtml).toContain("SAFE_VALIDATION_ERROR");
    expect(listHtml).toContain("ACHIEVEMENT");
    expect(listHtml).toContain("共 12 条安全行记录");
  });

  it("does not expose forbidden safe row fields or action controls outside boundary copy", () => {
    const html = renderToStaticMarkup(
      <ImportJobItemHistoryPanelView
        filters={{}}
        itemList={{ loading: false, data: itemHistoryResponse, error: null }}
        page={1}
        pageSize={10}
      />,
    );
    const boundaryCopy =
      /<div class="ant-alert-description">.*?<\/div>/.exec(html)?.[0] ?? "";
    const actionSurface = html.replace(boundaryCopy, "");

    [
      "targetId",
      "raw payload",
      "source payload",
      "safeSummary",
      "auditLogIds",
      "jobId",
      "runId",
      "operator id",
      "fingerprint",
      "hash",
      "checksum",
      "object key",
      "email",
      "phone",
      "employee id",
      "ID card",
      "password",
      "token",
      "cookie",
      "session",
      "DATABASE_URL",
      "connection string",
      "secret",
      "download",
      "delete",
      "repair",
      "debug panel",
    ].forEach((forbiddenText) => {
      expect(actionSurface).not.toContain(forbiddenText);
    });

    expect(actionSurface).not.toMatch(/\b(export|retry|rollback|cleanup|drilldown)\b/i);
  });

  it("maps safe row history errors without exposing backend detail text", () => {
    expect(
      getSafeImportJobItemErrorMessage({
        kind: "unauthorized",
        status: 401,
        message: "Unauthorized",
      }),
    ).toBe("请选择或切换当前业务用户。");
    expect(
      getSafeImportJobItemErrorMessage({
        kind: "bad-request",
        status: 422,
        message: "Invalid",
        detail: "raw request body",
      }),
    ).toBe("导入行筛选参数无效。");
    expect(
      getSafeImportJobItemErrorMessage({
        kind: "network",
        message: "Network failed",
      }),
    ).toBe("安全导入行记录服务暂不可用。");
  });
});
