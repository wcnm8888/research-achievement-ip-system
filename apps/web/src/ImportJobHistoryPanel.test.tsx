import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  buildImportJobHistoryQuery,
  getImportJobStatusExplanation,
  ImportJobHistoryDetailView,
  ImportJobHistoryPanelView,
  type ImportJobHistoryFilters,
} from "./ImportJobHistoryPanel";
import type { ImportJobHistoryDetail, ImportJobHistoryListResponse } from "./types";

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
    expect(loadingHtml).toContain("Loading import history");

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
    expect(emptyHtml).toContain("No import history yet");

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
    expect(errorHtml).toContain("Import history unavailable");
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

    expect(html).toContain("Safe summary");
    expect(html).toContain("Run status");
    expect(html).toContain("auditCount");
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
});
