import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { SelectProps, TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { hasSystemConfigPermission } from "./AccountManagement";
import {
  isApiError,
  createApiClient,
  type AccountManagementApiClient,
  type ApiError,
  type AuthUser,
} from "./api-client";
import {
  formatImportJobTimestamp,
  getStatusTagColor,
  ImportJobHistoryDetailView,
  renderSafeErrorCodes,
} from "./ImportJobHistoryPanel";
import type {
  AchievementTypeCode,
  ImportJobHistoryDetail,
  ImportJobHistoryFamily,
  ImportJobHistoryListItem,
  ImportJobHistoryListQuery,
  ImportJobHistoryListResponse,
  ImportJobHistoryMode,
  ImportJobHistoryStatus,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

export type SettingsImportJobHistoryFilters = {
  family?: ImportJobHistoryFamily;
  mode?: ImportJobHistoryMode | string;
  achievementType?: AchievementTypeCode;
  status?: ImportJobHistoryStatus;
  createdFrom?: string;
  createdTo?: string;
};

type SettingsImportJobHistoryClient = Pick<
  AccountManagementApiClient,
  "listImportJobHistory" | "getImportJobHistoryDetail" | "listImportJobHistoryItems"
>;

type SettingsImportJobHistoryOverviewProps = {
  demoUserId: string | null;
  authUser: Pick<AuthUser, "permissionCodes"> | null;
  apiClient?: SettingsImportJobHistoryClient;
};

type SettingsImportJobHistoryOverviewViewProps = {
  filters: SettingsImportJobHistoryFilters;
  list: Loadable<ImportJobHistoryListResponse>;
  detail: Loadable<ImportJobHistoryDetail>;
  detailOpen: boolean;
  page: number;
  pageSize: number;
  onFilterChange?: <K extends keyof SettingsImportJobHistoryFilters>(
    key: K,
    value: SettingsImportJobHistoryFilters[K] | undefined,
  ) => void;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onOpenDetail?: (jobId: string) => void;
  onCloseDetail?: () => void;
  itemHistoryClient?: Pick<AccountManagementApiClient, "listImportJobHistoryItems">;
};

export const settingsImportJobHistoryDefaultPage = 1;
export const settingsImportJobHistoryDefaultPageSize = 20;

const familyOptions: SelectProps<ImportJobHistoryFamily>["options"] = [
  { label: "DEPARTMENT", value: "DEPARTMENT" },
  { label: "USER_ACCOUNT", value: "USER_ACCOUNT" },
  { label: "ACHIEVEMENT", value: "ACHIEVEMENT" },
];

const modeOptions: SelectProps<string>["options"] = [
  { label: "CREATE_ONLY", value: "CREATE_ONLY" },
  {
    label: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
    value: "CREATE_ONLY_PENDING_NO_CREDENTIAL",
  },
  { label: "CREATE_DRAFT_ONLY", value: "CREATE_DRAFT_ONLY" },
];

const achievementTypeOptions: SelectProps<AchievementTypeCode>["options"] = [
  { label: "PAPER", value: "PAPER" },
  { label: "SOFTWARE_COPYRIGHT", value: "SOFTWARE_COPYRIGHT" },
  { label: "PATENT", value: "PATENT" },
];

const statusOptions: SelectProps<ImportJobHistoryStatus>["options"] = [
  { label: "PENDING", value: "PENDING" },
  { label: "RUNNING", value: "RUNNING" },
  { label: "SUCCESS", value: "SUCCESS" },
  { label: "FAILED", value: "FAILED" },
  { label: "REJECTED", value: "REJECTED" },
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

export function SettingsImportJobHistoryOverview({
  demoUserId,
  authUser,
  apiClient,
}: SettingsImportJobHistoryOverviewProps) {
  const [filters, setFilters] = useState<SettingsImportJobHistoryFilters>({});
  const [page, setPage] = useState(settingsImportJobHistoryDefaultPage);
  const [pageSize, setPageSize] = useState(settingsImportJobHistoryDefaultPageSize);
  const [list, setList] = useState<Loadable<ImportJobHistoryListResponse>>(
    emptyListLoadable,
  );
  const [detail, setDetail] = useState<Loadable<ImportJobHistoryDetail>>(
    emptyDetailLoadable,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const canReadOverview = hasSystemConfigPermission(authUser);
  const defaultApiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const historyClient = apiClient ?? defaultApiClient;
  const query = useMemo(
    () => buildSettingsImportJobHistoryQuery(filters, page, pageSize),
    [filters, page, pageSize],
  );

  const loadList = useCallback(() => {
    if (!canReadOverview || !demoUserId) {
      setList(emptyListLoadable);
      return;
    }

    setList({ loading: true, data: null, error: null });
    void fetchSettingsImportJobHistory(historyClient, query)
      .then((data) => setList({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setList({ loading: false, data: null, error: normalizeImportHistoryError(error) }),
      );
  }, [canReadOverview, demoUserId, historyClient, query]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const changeFilter = useCallback(
    <K extends keyof SettingsImportJobHistoryFilters>(
      key: K,
      value: SettingsImportJobHistoryFilters[K] | undefined,
    ) => {
      const next = applySettingsImportJobHistoryFilterChange(filters, key, value);
      setFilters(next.filters);
      setPage(next.page);
    },
    [filters],
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setPage(settingsImportJobHistoryDefaultPage);
    setPageSize(settingsImportJobHistoryDefaultPageSize);
  }, []);

  const changePage = useCallback((nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  }, []);

  const openDetail = useCallback(
    (jobId: string) => {
      if (!canReadOverview || !demoUserId) {
        return;
      }

      setDetailOpen(true);
      setDetail({ loading: true, data: null, error: null });
      void historyClient
        .getImportJobHistoryDetail(jobId)
        .then((data) => setDetail({ loading: false, data, error: null }))
        .catch((error: unknown) =>
          setDetail({
            loading: false,
            data: null,
            error: normalizeImportHistoryError(error),
          }),
        );
    },
    [canReadOverview, demoUserId, historyClient],
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetail(emptyDetailLoadable);
  }, []);

  if (!canReadOverview) {
    return null;
  }

  return (
    <SettingsImportJobHistoryOverviewView
      filters={filters}
      list={list}
      detail={detail}
      detailOpen={detailOpen}
      page={page}
      pageSize={pageSize}
      onFilterChange={changeFilter}
      onResetFilters={resetFilters}
      onRefresh={loadList}
      onPageChange={changePage}
      onOpenDetail={openDetail}
      onCloseDetail={closeDetail}
      itemHistoryClient={historyClient}
    />
  );
}

export function SettingsImportJobHistoryOverviewView({
  filters,
  list,
  detail,
  detailOpen,
  page,
  pageSize,
  onFilterChange,
  onResetFilters,
  onRefresh,
  onPageChange,
  onOpenDetail,
  onCloseDetail,
  itemHistoryClient,
}: SettingsImportJobHistoryOverviewViewProps) {
  const rows = list.data?.items ?? [];
  const hasRows = rows.length > 0;
  const isEmpty = !list.loading && !list.error && !hasRows;

  return (
    <Card
      className="shell-card settings-import-history-overview"
      title="导入记录概览"
      extra={
        <Space size={8} wrap>
          <Tag>system:config</Tag>
          <Tag>只读索引</Tag>
          <Button onClick={onRefresh}>刷新记录</Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} className="full-width">
        <Typography.Text type="secondary">
          这里展示导入任务历史的只读索引，后端权限校验仍是最终边界。
        </Typography.Text>

        <Space className="settings-import-history-filter-bar" size={12} wrap>
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="导入类型"
            options={familyOptions}
            value={filters.family}
            onChange={(value) => onFilterChange?.("family", value)}
          />
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="执行模式"
            options={modeOptions}
            value={filters.mode}
            onChange={(value) => onFilterChange?.("mode", value)}
          />
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="成果类型"
            options={achievementTypeOptions}
            value={filters.achievementType}
            onChange={(value) => onFilterChange?.("achievementType", value)}
          />
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="状态"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => onFilterChange?.("status", value)}
          />
          <Input
            className="settings-api-filter-select"
            type="date"
            aria-label="createdFrom"
            value={filters.createdFrom}
            onChange={(event) => onFilterChange?.("createdFrom", event.target.value)}
          />
          <Input
            className="settings-api-filter-select"
            type="date"
            aria-label="createdTo"
            value={filters.createdTo}
            onChange={(event) => onFilterChange?.("createdTo", event.target.value)}
          />
          <Button onClick={onResetFilters}>重置筛选</Button>
        </Space>

        {list.loading ? (
          <Alert type="info" showIcon message="正在加载导入记录概览" />
        ) : null}

        {list.error ? (
          <Alert
            type="error"
            showIcon
            message="导入记录概览暂不可用"
            description={list.error.detail ?? list.error.message}
          />
        ) : null}

        {isEmpty ? <Empty description="暂无导入记录" /> : null}

        {hasRows ? (
          <Table<ImportJobHistoryListItem>
            className="settings-import-history-table"
            size="small"
            rowKey={buildSafeSettingsImportHistoryRowKey}
            dataSource={rows}
            columns={createSettingsImportJobHistoryColumns(onOpenDetail)}
            pagination={{
              current: list.data?.page ?? page,
              pageSize: list.data?.pageSize ?? pageSize,
              total: list.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条导入记录`,
              onChange: (nextPage, nextPageSize) => {
                onPageChange?.(nextPage, nextPageSize);
              },
            }}
            scroll={{ x: 1180 }}
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

export const buildSettingsImportJobHistoryQuery = (
  filters: SettingsImportJobHistoryFilters,
  page = settingsImportJobHistoryDefaultPage,
  pageSize = settingsImportJobHistoryDefaultPageSize,
): ImportJobHistoryListQuery => ({
  ...trimSettingsImportJobHistoryFilters(filters),
  page,
  pageSize,
});

export const applySettingsImportJobHistoryFilterChange = <
  K extends keyof SettingsImportJobHistoryFilters,
>(
  filters: SettingsImportJobHistoryFilters,
  key: K,
  value: SettingsImportJobHistoryFilters[K] | undefined,
): { filters: SettingsImportJobHistoryFilters; page: number } => ({
  filters: trimSettingsImportJobHistoryFilters({
    ...filters,
    [key]: normalizeFilterValue(value),
  }),
  page: settingsImportJobHistoryDefaultPage,
});

export const applySettingsImportJobHistoryPaginationChange = (
  page: number,
  pageSize: number,
): { page: number; pageSize: number } => ({ page, pageSize });

export const fetchSettingsImportJobHistory = async (
  client: Pick<AccountManagementApiClient, "listImportJobHistory">,
  query: ImportJobHistoryListQuery,
): Promise<ImportJobHistoryListResponse> => {
  const result = await client.listImportJobHistory(query);

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : query.page ?? 1,
    pageSize:
      typeof result.pageSize === "number"
        ? result.pageSize
        : query.pageSize ?? settingsImportJobHistoryDefaultPageSize,
  };
};

const createSettingsImportJobHistoryColumns = (
  onOpenDetail?: (jobId: string) => void,
): TableProps<ImportJobHistoryListItem>["columns"] => [
  {
    title: "导入类型",
    dataIndex: "family",
    key: "family",
    width: 140,
    render: (value: string) => <Tag>{value}</Tag>,
  },
  {
    title: "执行模式",
    dataIndex: "mode",
    key: "mode",
    width: 240,
  },
  {
    title: "成果类型",
    dataIndex: "achievementType",
    key: "achievementType",
    width: 180,
    render: (value?: string | null) => value ?? "未返回",
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 112,
    render: (value: string) => <Tag color={getStatusTagColor(value)}>{value}</Tag>,
  },
  {
    title: "受理行数",
    dataIndex: "acceptedRowCount",
    key: "acceptedRowCount",
    width: 150,
  },
  {
    title: "创建业务记录数",
    dataIndex: "createdBusinessCount",
    key: "createdBusinessCount",
    width: 180,
  },
  {
    title: "创建伴随记录数",
    dataIndex: "createdCompanionCount",
    key: "createdCompanionCount",
    width: 190,
  },
  {
    title: "审计记录数",
    dataIndex: "auditCount",
    key: "auditCount",
    width: 120,
  },
  {
    title: "安全错误码",
    key: "safeErrorCode",
    width: 180,
    render: (_, row) => renderSafeErrorCodes(row),
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 210,
    render: formatImportJobTimestamp,
  },
  {
    title: "完成时间",
    dataIndex: "completedAt",
    key: "completedAt",
    width: 210,
    render: formatImportJobTimestamp,
  },
  {
    title: "详情",
    key: "detail",
    fixed: "right",
    width: 96,
    render: (_, row) => (
      <Button size="small" onClick={() => onOpenDetail?.(row.id)}>
        查看
      </Button>
    ),
  },
];

const trimSettingsImportJobHistoryFilters = (
  filters: SettingsImportJobHistoryFilters,
): SettingsImportJobHistoryFilters => ({
  family: filters.family,
  mode: normalizeFilterValue(filters.mode),
  achievementType: filters.achievementType,
  status: filters.status,
  createdFrom: normalizeFilterValue(filters.createdFrom),
  createdTo: normalizeFilterValue(filters.createdTo),
});

const normalizeFilterValue = <T extends string | undefined>(value: T): T | undefined => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return (trimmed || undefined) as T | undefined;
};

const buildSafeSettingsImportHistoryRowKey = (row: ImportJobHistoryListItem): string =>
  [
    row.family,
    row.mode,
    row.achievementType ?? "N_A",
    row.status,
    row.createdAt,
    row.completedAt ?? "N_A",
  ].join(":");

const normalizeImportHistoryError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "Import history request failed.",
    detail: error instanceof Error ? error.message : undefined,
  };
};
