import { Alert, Button, Card, Descriptions, Drawer, Empty, Select, Space, Table, Tag, Typography } from "antd";
import type { SelectProps, TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isApiError, type AccountManagementApiClient, type ApiError } from "./api-client";
import type {
  AchievementTypeCode,
  ImportJobHistoryDetail,
  ImportJobHistoryFamily,
  ImportJobHistoryListItem,
  ImportJobHistoryListQuery,
  ImportJobHistoryListResponse,
  ImportJobHistoryMode,
  ImportRunHistorySummary,
} from "./types";

export type ImportJobHistoryFilters = {
  family: ImportJobHistoryFamily;
  mode: ImportJobHistoryMode;
  achievementType?: AchievementTypeCode;
};

type ImportJobHistoryClient = Pick<
  AccountManagementApiClient,
  "listImportJobHistory" | "getImportJobHistoryDetail"
>;

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type ImportJobHistoryPanelProps = {
  apiClient: ImportJobHistoryClient;
  title: string;
  filters: ImportJobHistoryFilters;
  enabled?: boolean;
  achievementTypeFilter?: boolean;
};

type ImportJobHistoryPanelViewProps = {
  title: string;
  filters: ImportJobHistoryFilters;
  list: Loadable<ImportJobHistoryListResponse>;
  detail: Loadable<ImportJobHistoryDetail>;
  detailOpen: boolean;
  selectedAchievementType?: AchievementTypeCode;
  achievementTypeFilter?: boolean;
  onAchievementTypeChange?: (achievementType?: AchievementTypeCode) => void;
  onRefresh?: () => void;
  onOpenDetail?: (jobId: string) => void;
  onCloseDetail?: () => void;
};

const defaultPageSize = 10;

const achievementTypeOptions: SelectProps<AchievementTypeCode>["options"] = [
  { label: "PAPER", value: "PAPER" },
  { label: "SOFTWARE_COPYRIGHT", value: "SOFTWARE_COPYRIGHT" },
  { label: "PATENT", value: "PATENT" },
];

const emptyListLoadable: Loadable<ImportJobHistoryListResponse> = {
  loading: false,
  data: null,
  error: null,
};

const emptyDetailLoadable: Loadable<ImportJobHistoryDetail> = {
  loading: false,
  data: null,
  error: null,
};

export function ImportJobHistoryPanel({
  apiClient,
  title,
  filters,
  enabled = true,
  achievementTypeFilter = false,
}: ImportJobHistoryPanelProps) {
  const [selectedAchievementType, setSelectedAchievementType] =
    useState<AchievementTypeCode | undefined>(filters.achievementType);
  const [list, setList] = useState<Loadable<ImportJobHistoryListResponse>>(emptyListLoadable);
  const [detail, setDetail] = useState<Loadable<ImportJobHistoryDetail>>(emptyDetailLoadable);
  const [detailOpen, setDetailOpen] = useState(false);

  const query = useMemo(
    () => buildImportJobHistoryQuery(filters, selectedAchievementType, defaultPageSize),
    [filters, selectedAchievementType],
  );

  const loadList = useCallback(() => {
    if (!enabled) {
      setList(emptyListLoadable);
      return;
    }

    setList({ loading: true, data: null, error: null });
    void apiClient
      .listImportJobHistory(query)
      .then((data) => setList({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setList({ loading: false, data: null, error: normalizeApiError(error) }),
      );
  }, [apiClient, enabled, query]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDetail = useCallback(
    (jobId: string) => {
      if (!enabled) {
        return;
      }

      setDetailOpen(true);
      setDetail({ loading: true, data: null, error: null });
      void apiClient
        .getImportJobHistoryDetail(jobId)
        .then((data) => setDetail({ loading: false, data, error: null }))
        .catch((error: unknown) =>
          setDetail({ loading: false, data: null, error: normalizeApiError(error) }),
        );
    },
    [apiClient, enabled],
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetail(emptyDetailLoadable);
  }, []);

  return (
    <ImportJobHistoryPanelView
      title={title}
      filters={filters}
      list={list}
      detail={detail}
      detailOpen={detailOpen}
      selectedAchievementType={selectedAchievementType}
      achievementTypeFilter={achievementTypeFilter}
      onAchievementTypeChange={setSelectedAchievementType}
      onRefresh={loadList}
      onOpenDetail={openDetail}
      onCloseDetail={closeDetail}
    />
  );
}

export function ImportJobHistoryPanelView({
  title,
  filters,
  list,
  detail,
  detailOpen,
  selectedAchievementType,
  achievementTypeFilter = false,
  onAchievementTypeChange,
  onRefresh,
  onOpenDetail,
  onCloseDetail,
}: ImportJobHistoryPanelViewProps) {
  const items = list.data?.items ?? [];
  const isEmpty = !list.loading && !list.error && items.length === 0;

  return (
    <Card
      className="shell-card import-job-history-panel"
      title={title}
      extra={
        <Space size={8} wrap>
          <Tag>{filters.family}</Tag>
          <Tag>{filters.mode}</Tag>
          {achievementTypeFilter ? (
            <Select
              allowClear
              className="import-job-history-achievement-type"
              placeholder="All achievement types"
              value={selectedAchievementType}
              options={achievementTypeOptions}
              onChange={onAchievementTypeChange}
            />
          ) : null}
          <Button onClick={onRefresh}>Refresh</Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} className="import-job-history-stack">
        <Typography.Text type="secondary">
          Read-only history. Backend system:config guard remains authoritative.
        </Typography.Text>

        {list.loading ? (
          <Alert type="info" showIcon message="Loading import history" />
        ) : null}

        {list.error ? (
          <Alert
            type="error"
            showIcon
            message="Import history unavailable"
            description={list.error.detail ?? list.error.message}
          />
        ) : null}

        {isEmpty ? <Empty description="No import history yet" /> : null}

        {items.length > 0 ? (
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={items}
            columns={buildImportJobHistoryColumns(onOpenDetail)}
          />
        ) : null}
      </Space>

      <Drawer
        title="Import job detail"
        width={720}
        open={detailOpen}
        onClose={onCloseDetail}
        destroyOnClose
      >
        <ImportJobHistoryDetailView detail={detail} />
      </Drawer>
    </Card>
  );
}

export function ImportJobHistoryDetailView({
  detail,
}: {
  detail: Loadable<ImportJobHistoryDetail>;
}) {
  if (detail.loading) {
    return <Alert type="info" showIcon message="Loading import job detail" />;
  }

  if (detail.error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Import job detail unavailable"
        description={detail.error.detail ?? detail.error.message}
      />
    );
  }

  if (!detail.data) {
    return <Empty description="No import job selected" />;
  }

  const summaryRows = collectSafeSummaryRows(detail.data.safeSummary);
  const runRows = detail.data.runs;

  return (
    <Space direction="vertical" size={16} className="import-job-history-detail">
      <Descriptions size="small" bordered column={2}>
        <Descriptions.Item label="family">{detail.data.family}</Descriptions.Item>
        <Descriptions.Item label="mode">{detail.data.mode}</Descriptions.Item>
        <Descriptions.Item label="achievementType">
          {detail.data.achievementType ?? "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="status">{detail.data.status}</Descriptions.Item>
        <Descriptions.Item label="acceptedRowCount">
          {detail.data.acceptedRowCount}
        </Descriptions.Item>
        <Descriptions.Item label="createdBusinessCount">
          {detail.data.createdBusinessCount}
        </Descriptions.Item>
        <Descriptions.Item label="createdCompanionCount">
          {detail.data.createdCompanionCount}
        </Descriptions.Item>
        <Descriptions.Item label="auditCount">{detail.data.auditCount}</Descriptions.Item>
        <Descriptions.Item label="safeErrorCode" span={2}>
          {renderSafeErrorCodes(detail.data)}
        </Descriptions.Item>
        <Descriptions.Item label="createdAt">{formatTimestamp(detail.data.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="completedAt">
          {formatTimestamp(detail.data.completedAt)}
        </Descriptions.Item>
      </Descriptions>

      <Alert
        type="info"
        showIcon
        message="Status explanation"
        description={getImportJobStatusExplanation(detail.data.status)}
      />

      <Card size="small" title="Safe summary">
        {summaryRows.length > 0 ? (
          <Table
            size="small"
            rowKey="key"
            pagination={false}
            dataSource={summaryRows}
            columns={safeSummaryColumns}
          />
        ) : (
          <Empty description="No safe summary fields" />
        )}
      </Card>

      <Card size="small" title="Run status">
        <Table
          size="small"
          rowKey={(run) => String(run.attemptNo)}
          pagination={false}
          dataSource={runRows}
          columns={runSummaryColumns}
        />
      </Card>
    </Space>
  );
}

export const buildImportJobHistoryQuery = (
  filters: ImportJobHistoryFilters,
  selectedAchievementType?: AchievementTypeCode,
  pageSize = defaultPageSize,
): ImportJobHistoryListQuery => ({
  family: filters.family,
  mode: filters.mode,
  achievementType: selectedAchievementType ?? filters.achievementType,
  page: 1,
  pageSize,
});

export const getImportJobStatusExplanation = (status: string): string => {
  if (status === "SUCCESS") {
    return "Replay: this request already completed successfully. Stored safe counts are shown; no new write was started for the same request.";
  }

  if (status === "RUNNING" || status === "PENDING") {
    return "In-flight: this request is running or was claimed recently. No second write was started; check again later.";
  }

  if (status === "REJECTED") {
    return "Rejected: validation or safety rules blocked the request. Only safe reason codes and counts are shown.";
  }

  if (status === "FAILED") {
    return "Failed: the claimed attempt ended with an error. This read-only view does not start a new write.";
  }

  return "This import job is shown as read-only history.";
};

const buildImportJobHistoryColumns = (
  onOpenDetail?: (jobId: string) => void,
): TableProps<ImportJobHistoryListItem>["columns"] => [
  {
    title: "family",
    dataIndex: "family",
    key: "family",
    render: (value: string) => <Tag>{value}</Tag>,
  },
  {
    title: "mode",
    dataIndex: "mode",
    key: "mode",
  },
  {
    title: "achievementType",
    dataIndex: "achievementType",
    key: "achievementType",
    render: (value?: string | null) => value ?? "N/A",
  },
  {
    title: "status",
    dataIndex: "status",
    key: "status",
    render: (value: string) => <Tag color={getStatusTagColor(value)}>{value}</Tag>,
  },
  {
    title: "created counts",
    key: "createdCounts",
    render: (_, row) =>
      `accepted ${row.acceptedRowCount} / business ${row.createdBusinessCount} / companion ${row.createdCompanionCount} / audit ${row.auditCount}`,
  },
  {
    title: "safe error code",
    key: "safeErrorCode",
    render: (_, row) => renderSafeErrorCodes(row),
  },
  {
    title: "createdAt",
    dataIndex: "createdAt",
    key: "createdAt",
    render: formatTimestamp,
  },
  {
    title: "completedAt",
    dataIndex: "completedAt",
    key: "completedAt",
    render: formatTimestamp,
  },
  {
    title: "detail",
    key: "detail",
    render: (_, row) => (
      <Button size="small" onClick={() => onOpenDetail?.(row.id)}>
        Details
      </Button>
    ),
  },
];

const safeSummaryColumns: TableProps<SafeSummaryRow>["columns"] = [
  {
    title: "field",
    dataIndex: "key",
    key: "key",
  },
  {
    title: "value",
    dataIndex: "value",
    key: "value",
  },
];

const runSummaryColumns: TableProps<ImportRunHistorySummary>["columns"] = [
  {
    title: "attemptNo",
    dataIndex: "attemptNo",
    key: "attemptNo",
  },
  {
    title: "trigger",
    dataIndex: "trigger",
    key: "trigger",
  },
  {
    title: "status",
    dataIndex: "status",
    key: "status",
  },
  {
    title: "failureCode",
    dataIndex: "failureCode",
    key: "failureCode",
    render: (value?: string | null) => value ?? "N/A",
  },
  {
    title: "failureStage",
    dataIndex: "failureStage",
    key: "failureStage",
    render: (value?: string | null) => value ?? "N/A",
  },
  {
    title: "startedAt",
    dataIndex: "startedAt",
    key: "startedAt",
    render: formatTimestamp,
  },
  {
    title: "finishedAt",
    dataIndex: "finishedAt",
    key: "finishedAt",
    render: formatTimestamp,
  },
  {
    title: "completedBusinessTransactionAt",
    dataIndex: "completedBusinessTransactionAt",
    key: "completedBusinessTransactionAt",
    render: formatTimestamp,
  },
  {
    title: "auditCount",
    dataIndex: "auditCount",
    key: "auditCount",
  },
];

type SafeSummaryRow = {
  key: string;
  value: string;
};

const collectSafeSummaryRows = (summary: unknown, prefix = ""): SafeSummaryRow[] => {
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return [];
  }

  return Object.entries(summary).flatMap(([key, value]) => {
    if (!isSafeSummaryKey(key)) {
      return [];
    }

    const rowKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectSafeSummaryRows(value, rowKey);
    }

    const displayValue = toSafeSummaryDisplayValue(value);
    return displayValue === null ? [] : [{ key: rowKey, value: displayValue }];
  });
};

const isSafeSummaryKey = (key: string): boolean => {
  const normalized = key.toLowerCase();
  const blockedFragments = [
    "email",
    "employee",
    "doi",
    "registration",
    "applicationno",
    "grantno",
    "patentno",
    "patentnumber",
    "title",
    "name",
    "person",
    "owner",
    "contributor",
    "credential",
    "session",
    "token",
    "cookie",
    "password",
    "connection",
    "raw",
    "csv",
    "auditlogids",
  ];

  if (normalized === "id" || normalized.endsWith("id") || normalized.endsWith("ids")) {
    return false;
  }

  return !blockedFragments.some((fragment) => normalized.includes(fragment));
};

const toSafeSummaryDisplayValue = (value: unknown): string | null => {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    if (!/^[A-Z0-9_:-]{1,80}$/.test(value)) {
      return null;
    }

    const lowered = value.toLowerCase();
    if (
      lowered.includes("password") ||
      lowered.includes("token") ||
      lowered.includes("cookie") ||
      lowered.includes("session") ||
      lowered.includes("credential") ||
      value.includes("@")
    ) {
      return null;
    }

    return value;
  }

  return null;
};

const renderSafeErrorCodes = (job: Pick<ImportJobHistoryListItem, "safeErrorCodes" | "latestRun">) => {
  const codes = [
    ...job.safeErrorCodes,
    ...(job.latestRun?.failureCode ? [job.latestRun.failureCode] : []),
  ].filter(Boolean);
  const uniqueCodes = Array.from(new Set(codes));

  if (uniqueCodes.length === 0) {
    return "N/A";
  }

  return (
    <Space size={4} wrap>
      {uniqueCodes.slice(0, 3).map((code) => (
        <Tag key={code}>{code}</Tag>
      ))}
      {uniqueCodes.length > 3 ? <Tag>+{uniqueCodes.length - 3}</Tag> : null}
    </Space>
  );
};

const getStatusTagColor = (status: string): string | undefined => {
  if (status === "SUCCESS") {
    return "green";
  }

  if (status === "FAILED" || status === "REJECTED") {
    return "red";
  }

  if (status === "RUNNING" || status === "PENDING") {
    return "blue";
  }

  return undefined;
};

function formatTimestamp(value?: string | null): string {
  return value ?? "N/A";
}

const normalizeApiError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "Import history request failed.",
    detail: error instanceof Error ? error.message : undefined,
  };
};
