import { Alert, Button, Card, Descriptions, Drawer, Empty, Input, Select, Space, Table, Tag, Typography } from "antd";
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
  ImportJobItemHistoryListQuery,
  ImportJobItemHistoryListResponse,
  ImportJobItemHistoryRow,
  ImportRunHistorySummary,
} from "./types";

export type ImportJobHistoryFilters = {
  family: ImportJobHistoryFamily;
  mode: ImportJobHistoryMode;
  achievementType?: AchievementTypeCode;
};

type ImportJobHistoryClient = Pick<
  AccountManagementApiClient,
  "listImportJobHistory" | "getImportJobHistoryDetail" | "listImportJobHistoryItems"
>;

type ImportJobItemHistoryClient = Pick<AccountManagementApiClient, "listImportJobHistoryItems">;

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
  itemHistoryClient?: ImportJobItemHistoryClient;
};

const defaultPageSize = 10;
const defaultItemPageSize = 10;

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
      itemHistoryClient={apiClient}
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
  itemHistoryClient,
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
              placeholder="全部成果类型"
              value={selectedAchievementType}
              options={achievementTypeOptions}
              onChange={onAchievementTypeChange}
            />
          ) : null}
          <Button onClick={onRefresh}>刷新</Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} className="import-job-history-stack">
        <Typography.Text type="secondary">
          只读导入记录。系统配置权限仍由后端校验。
        </Typography.Text>

        {list.loading ? (
          <Alert type="info" showIcon message="正在加载导入记录" />
        ) : null}

        {list.error ? (
          <Alert
            type="error"
            showIcon
            message="导入记录暂不可用"
            description={list.error.detail ?? list.error.message}
          />
        ) : null}

        {isEmpty ? <Empty description="暂无导入记录" /> : null}

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
        title="导入任务详情"
        width={720}
        open={detailOpen}
        onClose={onCloseDetail}
        destroyOnClose
      >
        <ImportJobHistoryDetailView detail={detail} itemHistoryClient={itemHistoryClient} />
      </Drawer>
    </Card>
  );
}

export function ImportJobHistoryDetailView({
  detail,
  itemHistoryClient,
}: {
  detail: Loadable<ImportJobHistoryDetail>;
  itemHistoryClient?: ImportJobItemHistoryClient;
}) {
  if (detail.loading) {
    return <Alert type="info" showIcon message="正在加载导入任务详情" />;
  }

  if (detail.error) {
    return (
      <Alert
        type="error"
        showIcon
        message="导入任务详情暂不可用"
        description={detail.error.detail ?? detail.error.message}
      />
    );
  }

  if (!detail.data) {
    return <Empty description="未选择导入任务" />;
  }

  const summaryRows = collectSafeSummaryRows(detail.data.safeSummary);
  const runRows = detail.data.runs;

  return (
    <Space direction="vertical" size={16} className="import-job-history-detail">
      <Descriptions size="small" bordered column={2}>
        <Descriptions.Item label="导入类型">{detail.data.family}</Descriptions.Item>
        <Descriptions.Item label="执行模式">{detail.data.mode}</Descriptions.Item>
        <Descriptions.Item label="成果类型">
          {detail.data.achievementType ?? "未返回"}
        </Descriptions.Item>
        <Descriptions.Item label="状态">{detail.data.status}</Descriptions.Item>
        <Descriptions.Item label="受理行数">
          {detail.data.acceptedRowCount}
        </Descriptions.Item>
        <Descriptions.Item label="创建业务记录数">
          {detail.data.createdBusinessCount}
        </Descriptions.Item>
        <Descriptions.Item label="创建伴随记录数">
          {detail.data.createdCompanionCount}
        </Descriptions.Item>
        <Descriptions.Item label="审计记录数">{detail.data.auditCount}</Descriptions.Item>
        <Descriptions.Item label="安全错误码" span={2}>
          {renderSafeErrorCodes(detail.data)}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatImportJobTimestamp(detail.data.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="完成时间">
          {formatImportJobTimestamp(detail.data.completedAt)}
        </Descriptions.Item>
      </Descriptions>

      <Alert
        type="info"
        showIcon
        message="状态说明"
        description={getImportJobStatusExplanation(detail.data.status)}
      />

      <Card size="small" title="安全摘要">
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

      {itemHistoryClient ? (
        <ImportJobItemHistoryPanel
          importJobId={detail.data.id}
          apiClient={itemHistoryClient}
          enabled
        />
      ) : null}
    </Space>
  );
}

type ImportJobItemHistoryPanelProps = {
  importJobId: string;
  apiClient: ImportJobItemHistoryClient;
  enabled?: boolean;
};

type ImportJobItemHistoryFilters = Pick<
  ImportJobItemHistoryListQuery,
  "status" | "plannedAction" | "targetType" | "safeCode"
>;

type ImportJobItemHistoryPanelViewProps = {
  filters: ImportJobItemHistoryFilters;
  itemList: Loadable<ImportJobItemHistoryListResponse>;
  page: number;
  pageSize: number;
  onFilterChange?: <K extends keyof ImportJobItemHistoryFilters>(
    key: K,
    value: ImportJobItemHistoryFilters[K] | undefined,
  ) => void;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  onPageChange?: (page: number, pageSize: number) => void;
};

const emptyItemHistoryLoadable: Loadable<ImportJobItemHistoryListResponse> = {
  loading: false,
  data: null,
  error: null,
};

export function ImportJobItemHistoryPanel({
  importJobId,
  apiClient,
  enabled = true,
}: ImportJobItemHistoryPanelProps) {
  const [filters, setFilters] = useState<ImportJobItemHistoryFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultItemPageSize);
  const [itemList, setItemList] =
    useState<Loadable<ImportJobItemHistoryListResponse>>(emptyItemHistoryLoadable);
  const query = useMemo(
    () => buildImportJobItemHistoryPanelQuery(filters, page, pageSize),
    [filters, page, pageSize],
  );

  const loadItems = useCallback(() => {
    if (!enabled) {
      setItemList(emptyItemHistoryLoadable);
      return;
    }

    setItemList({ loading: true, data: null, error: null });
    void apiClient
      .listImportJobHistoryItems(importJobId, query)
      .then((data) => setItemList({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setItemList({ loading: false, data: null, error: normalizeApiError(error) }),
      );
  }, [apiClient, enabled, importJobId, query]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const changeFilter = useCallback(
    <K extends keyof ImportJobItemHistoryFilters>(
      key: K,
      value: ImportJobItemHistoryFilters[K] | undefined,
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: normalizeItemFilterValue(value),
      }));
      setPage(1);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(1);
    setPageSize(defaultItemPageSize);
  }, []);

  const changePage = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }, []);

  return (
    <ImportJobItemHistoryPanelView
      filters={filters}
      itemList={itemList}
      page={page}
      pageSize={pageSize}
      onFilterChange={changeFilter}
      onResetFilters={resetFilters}
      onRefresh={loadItems}
      onPageChange={changePage}
    />
  );
}

export function ImportJobItemHistoryPanelView({
  filters,
  itemList,
  page,
  pageSize,
  onFilterChange,
  onResetFilters,
  onRefresh,
  onPageChange,
}: ImportJobItemHistoryPanelViewProps) {
  const rows = itemList.data?.items ?? [];
  const isEmpty = !itemList.loading && !itemList.error && rows.length === 0;

  return (
    <Card size="small" title="导入行记录">
      <Space direction="vertical" size={12} className="import-job-history-stack">
        <Space size={8} wrap>
          <Tag>安全摘要</Tag>
          <Button onClick={onRefresh}>刷新明细</Button>
        </Space>

        <Alert
          className="safe-row-history-boundary"
          type="info"
          showIcon
          message="仅展示导入行安全摘要"
          description="页面只展示行号、计划动作、状态、安全代码和目标类型，不展示原始 CSV 或原始明细内容。"
        />

        <Space size={8} wrap>
          <Input
            className="import-job-history-item-filter"
            aria-label="item status"
            placeholder="状态"
            value={filters.status}
            onChange={(event) => onFilterChange?.("status", event.target.value)}
          />
          <Input
            className="import-job-history-item-filter"
            aria-label="item planned action"
            placeholder="计划动作"
            value={filters.plannedAction}
            onChange={(event) => onFilterChange?.("plannedAction", event.target.value)}
          />
          <Input
            className="import-job-history-item-filter"
            aria-label="item target type"
            placeholder="目标类型"
            value={filters.targetType}
            onChange={(event) => onFilterChange?.("targetType", event.target.value)}
          />
          <Input
            className="import-job-history-item-filter"
            aria-label="item safe code"
            placeholder="安全代码"
            value={filters.safeCode}
            onChange={(event) => onFilterChange?.("safeCode", event.target.value)}
          />
          <Button onClick={onResetFilters}>重置筛选</Button>
        </Space>

        {itemList.loading ? (
          <Alert type="info" showIcon message="正在加载导入行记录" />
        ) : null}

        {itemList.error ? (
          <Alert
            type="error"
            showIcon
            message="导入行记录暂不可用"
            description={getSafeImportJobItemErrorMessage(itemList.error)}
          />
        ) : null}

        {isEmpty ? (
          <Empty
            description={
              <Space direction="vertical" size={4}>
                <Typography.Text>
                  当前导入任务暂无安全行记录。
                </Typography.Text>
                <Typography.Text type="secondary">
                  这不代表原始源行不存在；原始数据不在当前页面展示边界内。
                </Typography.Text>
              </Space>
            }
          />
        ) : null}

        {rows.length > 0 ? (
          <Table<ImportJobItemHistoryRow>
            size="small"
            rowKey={buildSafeImportJobItemRowKey}
            dataSource={rows}
            columns={importJobItemHistoryColumns}
            pagination={{
              current: itemList.data?.page ?? page,
              pageSize: itemList.data?.pageSize ?? pageSize,
              total: itemList.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条安全行记录`,
              onChange: (nextPage, nextPageSize) => {
                onPageChange?.(nextPage, nextPageSize);
              },
            }}
          />
        ) : null}
      </Space>
    </Card>
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

export const buildImportJobItemHistoryPanelQuery = (
  filters: ImportJobItemHistoryFilters,
  page = 1,
  pageSize = defaultItemPageSize,
): ImportJobItemHistoryListQuery => ({
  status: normalizeItemFilterValue(filters.status),
  plannedAction: normalizeItemFilterValue(filters.plannedAction),
  targetType: normalizeItemFilterValue(filters.targetType),
  safeCode: normalizeItemFilterValue(filters.safeCode),
  page,
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
    render: formatImportJobTimestamp,
  },
  {
    title: "completedAt",
    dataIndex: "completedAt",
    key: "completedAt",
    render: formatImportJobTimestamp,
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

export const safeSummaryColumns: TableProps<SafeSummaryRow>["columns"] = [
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

export const runSummaryColumns: TableProps<ImportRunHistorySummary>["columns"] = [
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
    render: formatImportJobTimestamp,
  },
  {
    title: "finishedAt",
    dataIndex: "finishedAt",
    key: "finishedAt",
    render: formatImportJobTimestamp,
  },
  {
    title: "completedBusinessTransactionAt",
    dataIndex: "completedBusinessTransactionAt",
    key: "completedBusinessTransactionAt",
    render: formatImportJobTimestamp,
  },
  {
    title: "审计记录数",
    dataIndex: "auditCount",
    key: "auditCount",
  },
];

export const importJobItemHistoryColumns: TableProps<ImportJobItemHistoryRow>["columns"] = [
  {
    title: "行号",
    dataIndex: "rowNumber",
    key: "rowNumber",
  },
  {
    title: "计划动作",
    dataIndex: "plannedAction",
    key: "plannedAction",
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    render: (value: string) => <Tag color={getStatusTagColor(value)}>{value}</Tag>,
  },
  {
    title: "安全错误码",
    dataIndex: "safeCode",
    key: "safeCode",
    render: (value?: string | null) => value ?? "未返回",
  },
  {
    title: "目标类型",
    dataIndex: "targetType",
    key: "targetType",
  },
];

export type SafeSummaryRow = {
  key: string;
  value: string;
};

export const collectSafeSummaryRows = (summary: unknown, prefix = ""): SafeSummaryRow[] => {
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

export const renderSafeErrorCodes = (job: Pick<ImportJobHistoryListItem, "safeErrorCodes" | "latestRun">) => {
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

export const getStatusTagColor = (status: string): string | undefined => {
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

export function formatImportJobTimestamp(value?: string | null): string {
  return value ?? "N/A";
}

const normalizeItemFilterValue = <T extends string | undefined>(
  value: T,
): T | undefined => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return (trimmed || undefined) as T | undefined;
};

const buildSafeImportJobItemRowKey = (row: ImportJobItemHistoryRow): string =>
  [
    row.rowNumber,
    row.plannedAction,
    row.status,
    row.safeCode ?? "NOT_RETURNED",
    row.targetType,
  ].join(":");

export const getSafeImportJobItemErrorMessage = (error: ApiError): string => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return "请选择或切换当前业务用户。";
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return "当前角色无权读取安全导入行记录。";
  }

  if (error.status === 404) {
    return "未找到导入任务，或当前页面不可见该任务。";
  }

  if (error.status === 400 || error.status === 422 || error.kind === "bad-request") {
    return "导入行筛选参数无效。";
  }

  if (error.kind === "server" || error.kind === "network") {
    return "安全导入行记录服务暂不可用。";
  }

  return "安全导入行记录请求失败。";
};

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
