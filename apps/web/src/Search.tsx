import { Alert, Button, Card, Input, InputNumber, Select, Space, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ReadonlyAchievementDetail } from "./AchievementDetail";
import { createApiClient, isApiError, type ApiClient, type ApiError } from "./api-client";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { ReadonlyFeeDetailDrawer } from "./Fees";
import type {
  AchievementStatusCode,
  AchievementTypeCode,
  FeeTypeCode,
  PayStatusCode,
  SearchAchievementIdentifiers,
  SearchAchievementResultItem,
  SearchFeeResultItem,
  SearchQuery,
  SearchResult,
  SearchResultItem,
  SearchTargetTypeCode,
  SecretLevelCode,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type SearchProps = {
  demoUserId: string | null;
};

export type SearchFilters = {
  keyword?: string;
  targetType?: SearchTargetFilter;
  targetTypes?: readonly SearchTargetTypeCode[];
  achievementType?: AchievementTypeCode;
  achievementStatus?: AchievementStatusCode;
  feeType?: FeeTypeCode;
  payStatus?: PayStatusCode;
  departmentId?: string;
  take?: number;
};

export type SearchTargetFilter = "ALL" | SearchTargetTypeCode;

export type SearchListStateKind = "loading" | "error" | "empty" | "ready";

export type SearchQueryBuildResult =
  | {
      valid: true;
      query: SearchQuery;
      filters: SearchFilters;
    }
  | {
      valid: false;
      error: ApiError;
      filters: SearchFilters;
    };

export type SearchSummary = {
  total: number;
  achievementCount: number;
  feeCount: number;
  redactedAchievementCount: number;
};

export type SearchResultGroups = {
  achievements: SearchAchievementResultItem[];
  fees: SearchFeeResultItem[];
};

export type SearchAchievementDisplayModel = {
  kind: "achievement";
  id: string;
  title: string | null;
  redacted: boolean;
  identifiers: Array<{ label: string; value: string }>;
};

export type SearchFeeDisplayModel = {
  kind: "fee";
  id: string;
  achievementId: string;
  feeTypeLabel: string;
  payStatusLabel: string;
  dueDate: string;
  paidDate: string;
  departmentId: string;
};

const defaultTake = 20;
const maxTake = 50;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const defaultSearchFilters: SearchFilters = {
  targetType: "ALL",
  take: defaultTake,
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const targetTypeSelectOptions: Array<{ label: string; value: SearchTargetTypeCode }> = [
  { label: "成果", value: "ACHIEVEMENT" },
  { label: "费用", value: "FEE_RECORD" },
];

const targetTypeOptions: Array<{ label: string; value: SearchTargetFilter }> = [
  { label: "全部", value: "ALL" },
  ...targetTypeSelectOptions,
];

const achievementTypeOptions: Array<{ label: string; value: AchievementTypeCode }> = [
  { label: "论文", value: "PAPER" },
  { label: "专利", value: "PATENT" },
  { label: "软件著作权", value: "SOFTWARE_COPYRIGHT" },
];

const achievementStatusOptions: Array<{ label: string; value: AchievementStatusCode }> = [
  { label: "草稿", value: "DRAFT" },
  { label: "待院系审核", value: "PENDING_DEPARTMENT_REVIEW" },
  { label: "院系驳回", value: "DEPARTMENT_REJECTED" },
  { label: "待归档", value: "PENDING_ARCHIVE" },
  { label: "已归档", value: "ARCHIVED" },
  { label: "已作废", value: "VOIDED" },
];

const achievementTypeLabels = Object.fromEntries(
  achievementTypeOptions.map((option) => [option.value, option.label]),
) as Record<AchievementTypeCode, string>;

const achievementStatusLabels = Object.fromEntries(
  achievementStatusOptions.map((option) => [option.value, option.label]),
) as Record<AchievementStatusCode, string>;

const secretLevelLabels: Record<SecretLevelCode, string> = {
  PUBLIC: "公开",
  INTERNAL: "内部",
  SECRET: "秘密",
  CONFIDENTIAL: "机密",
};

const feeTypeOptions: Array<{ label: string; value: FeeTypeCode }> = [
  { label: "专利申请费", value: "PATENT_APPLICATION" },
  { label: "专利年费", value: "PATENT_ANNUAL" },
  { label: "软著费用", value: "SOFTWARE_COPYRIGHT" },
  { label: "代理服务费", value: "AGENCY" },
  { label: "其他费用", value: "OTHER" },
];

const payStatusOptions: Array<{ label: string; value: PayStatusCode }> = [
  { label: "待缴", value: "PENDING" },
  { label: "已缴", value: "PAID" },
  { label: "逾期", value: "OVERDUE" },
  { label: "已减免", value: "WAIVED" },
  { label: "已取消", value: "CANCELLED" },
];

const feeTypeLabels = Object.fromEntries(
  feeTypeOptions.map((option) => [option.value, option.label]),
) as Record<FeeTypeCode, string>;

const payStatusLabels = Object.fromEntries(
  payStatusOptions.map((option) => [option.value, option.label]),
) as Record<PayStatusCode, string>;

const payStatusColors: Record<PayStatusCode, string> = {
  PENDING: "processing",
  PAID: "success",
  OVERDUE: "error",
  WAIVED: "default",
  CANCELLED: "default",
};

export function Search({ demoUserId }: SearchProps) {
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(defaultSearchFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(defaultSearchFilters);
  const [searchState, setSearchState] = useState<Loadable<SearchResult>>(emptyLoadable);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const queryResult = useMemo(() => buildSearchQueryResult(appliedFilters), [appliedFilters]);

  const loadSearch = useCallback(() => {
    if (!demoUserId) {
      setSearchState(emptyLoadable);
      return;
    }

    if (!queryResult.valid) {
      setSearchState({
        loading: false,
        data: null,
        error: queryResult.error,
      });
      return;
    }

    setSearchState({ loading: true, data: null, error: null });
    void fetchSearchResults(apiClient, queryResult.query)
      .then((data) => setSearchState({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setSearchState({
          loading: false,
          data: null,
          error: mapSearchErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [apiClient, demoUserId, queryResult]);

  useEffect(() => {
    loadSearch();
  }, [loadSearch]);

  const applyFilters = () => {
    setAppliedFilters(trimSearchFilters(draftFilters));
  };

  const resetFilters = () => {
    const nextFilters: SearchFilters = defaultSearchFilters;
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };
  const openAchievementDetail = useCallback((item: SearchAchievementResultItem) => {
    setSelectedAchievementId(buildAchievementDetailOpenRequest(item));
  }, []);
  const closeAchievementDetail = () => {
    setSelectedAchievementId(null);
  };
  const openFeeDetail = useCallback((item: SearchFeeResultItem) => {
    setSelectedFeeId(buildSearchFeeDetailOpenRequest(item));
  }, []);
  const closeFeeDetail = () => {
    setSelectedFeeId(null);
  };

  const items = searchState.data?.items ?? [];
  const stateKind = getSearchListState(searchState.loading, searchState.error, searchState.data);
  const summary = useMemo(
    () => summarizeSearchResults(items, searchState.data?.total ?? 0),
    [items, searchState.data?.total],
  );
  const groups = useMemo(() => groupSearchResults(items), [items]);
  const filterSummary = useMemo(
    () => buildSearchFilterSummary(appliedFilters),
    [appliedFilters],
  );

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="检索中心"
          description="选择本地演示用户后，前端才会请求后端检索接口。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，检索中心不会加载业务数据。请选择有权限的用户后继续。"
        />
        <BoundaryNotice
          title="等待演示上下文"
          description="选择用户后即可查看权限范围内的检索结果。"
          step="检索中心"
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="检索中心"
        description="按关键词和类型筛选当前权限范围内的成果与费用记录。"
      />
      <PermissionHint description="系统已按当前账号权限过滤可检索的数据范围。" />

      <Card className="shell-card">
        <Space className="search-filter-bar" size={12} wrap>
          <Input.Search
            allowClear
            className="search-keyword"
            placeholder="按标题、DOI、申请号、登记号等关键词检索"
            enterButton="检索"
            maxLength={120}
            value={draftFilters.keyword}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
            }
            onSearch={applyFilters}
          />
          <Select
            mode="multiple"
            allowClear
            className="search-target-select"
            maxTagCount="responsive"
            placeholder="结果类型（默认全部）"
            options={targetTypeSelectOptions}
            value={[...(getSearchTargetTypes(draftFilters) ?? [])]}
            onChange={(value: SearchTargetTypeCode[]) =>
              setDraftFilters((current) => ({
                ...current,
                targetType: value.length === 1 ? value[0] : "ALL",
                targetTypes: value.length > 0 ? value : undefined,
              }))
            }
          />
          <Select
            allowClear
            className="search-filter-select"
            placeholder="成果类型"
            options={achievementTypeOptions}
            value={draftFilters.achievementType}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, achievementType: value }))
            }
          />
          <Select
            allowClear
            className="search-filter-select"
            placeholder="成果状态"
            options={achievementStatusOptions}
            value={draftFilters.achievementStatus}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, achievementStatus: value }))
            }
          />
          <Select
            allowClear
            className="search-filter-select"
            placeholder="费用类型"
            options={feeTypeOptions}
            value={draftFilters.feeType}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, feeType: value }))
            }
          />
          <Select
            allowClear
            className="search-filter-select"
            placeholder="缴费状态"
            options={payStatusOptions}
            value={draftFilters.payStatus}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, payStatus: value }))
            }
          />
          <Input
            allowClear
            className="search-department-input"
            placeholder="部门 ID（UUID）"
            value={draftFilters.departmentId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                departmentId: event.target.value,
              }))
            }
          />
          <InputNumber
            className="search-take-input"
            min={1}
            max={maxTake}
            precision={0}
            value={draftFilters.take ?? defaultTake}
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                take: typeof value === "number" ? value : undefined,
              }))
            }
          />
          <Button type="primary" onClick={applyFilters}>
            检索
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={loadSearch}>刷新</Button>
          <Tag>最多 50 条</Tag>
        </Space>
        {!queryResult.valid ? (
          <Alert
            className="search-validation-alert"
            showIcon
            type="warning"
            message={queryResult.error.message}
            description={queryResult.error.detail}
          />
        ) : null}
      </Card>

      <Card
        className="shell-card"
        title="检索结果"
        extra={
          <Space size={8} wrap>
            <Tag color={stateKind === "ready" ? "blue" : "default"}>
              total {searchState.data?.total ?? 0}
            </Tag>
          </Space>
        }
      >
        <SearchSummaryPanel summary={summary} filters={filterSummary} />
        <Alert
          className="search-detail-boundary"
          type="info"
          showIcon
          message="只读详情边界"
          description="检索结果可联动查看只读详情，不在检索页提供费用写入、附件操作或系统日志入口。"
        />
        <DataState
          loading={searchState.loading}
          error={searchState.error}
          empty={stateKind === "empty"}
          emptyText={hasActiveSearchFilters(appliedFilters) ? "没有匹配的检索结果" : "暂无可展示检索结果"}
          onRetry={loadSearch}
        >
          <SearchResultGroupList
            groups={groups}
            onOpenAchievementDetail={openAchievementDetail}
            onOpenFeeDetail={openFeeDetail}
          />
        </DataState>
      </Card>
      {selectedAchievementId ? (
        <ReadonlyAchievementDetail
          achievementId={selectedAchievementId}
          apiClient={apiClient}
          context="search"
          demoUserId={demoUserId}
          open={Boolean(selectedAchievementId)}
          onClose={closeAchievementDetail}
        />
      ) : null}
      {selectedFeeId ? (
        <ReadonlyFeeDetailDrawer
          apiClient={apiClient}
          demoUserId={demoUserId}
          feeRecordId={selectedFeeId}
          open={Boolean(selectedFeeId)}
          onClose={closeFeeDetail}
        />
      ) : null}
    </Space>
  );
}

export const buildSearchQuery = (
  filters: SearchFilters,
  take = defaultTake,
): SearchQuery => {
  const result = buildSearchQueryResult({
    ...filters,
    take: filters.take ?? take,
  });

  return result.valid ? result.query : toSearchQuery(result.filters);
};

export const buildSearchQueryResult = (
  filters: SearchFilters,
  take = defaultTake,
): SearchQueryBuildResult => {
  const trimmed = trimSearchFilters({
    ...filters,
    take: filters.take ?? take,
  });

  if (trimmed.departmentId && !isUuid(trimmed.departmentId)) {
    return {
      valid: false,
      filters: trimmed,
      error: createInvalidDepartmentError(trimmed.departmentId),
    };
  }

  return {
    valid: true,
    filters: trimmed,
    query: toSearchQuery(trimmed),
  };
};

export const fetchSearchResults = async (
  client: ApiClient,
  query: SearchQuery,
): Promise<SearchResult> => {
  const result = await client.get<Partial<SearchResult>>("/search", query);
  const items = Array.isArray(result.items) ? result.items : [];

  return {
    items,
    total: typeof result.total === "number" ? result.total : items.length,
  };
};

export const loadSearchForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  query: SearchQuery,
): Promise<SearchResult | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  return fetchSearchResults(client, query);
};

export const loadValidatedSearchForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  filters: SearchFilters,
): Promise<SearchResult | null> => {
  if (!demoUserId?.trim()) {
    return null;
  }

  const result = buildSearchQueryResult(filters);

  if (!result.valid) {
    throw result.error;
  }

  return fetchSearchResults(client, result.query);
};

export const getSearchListState = (
  loading: boolean,
  error: ApiError | null,
  result: SearchResult | null,
): SearchListStateKind => {
  if (loading) {
    return "loading";
  }

  if (error) {
    return "error";
  }

  if (!result || result.items.length === 0) {
    return "empty";
  }

  return "ready";
};

export const mapSearchErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 400) {
    return { ...error, message: "检索条件格式不正确" };
  }

  if (error.status === 401 || error.kind === "unauthorized") {
    return { ...error, message: "请选择或切换演示用户" };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return { ...error, message: "当前角色无检索权限" };
  }

  if (error.status !== undefined && error.status >= 500) {
    return { ...error, message: "检索服务暂不可用" };
  }

  if (error.kind === "network") {
    return { ...error, message: "无法连接检索服务" };
  }

  return error;
};

export const buildAchievementDisplayModel = (
  item: SearchAchievementResultItem,
): SearchAchievementDisplayModel => ({
  kind: "achievement",
  id: item.id,
  title: item.redacted ? null : item.title,
  redacted: item.redacted,
  identifiers: item.redacted ? [] : formatIdentifiers(item.identifiers),
});

export const buildFeeDisplayModel = (
  item: SearchFeeResultItem,
): SearchFeeDisplayModel => ({
  kind: "fee",
  id: item.id,
  achievementId: item.achievementId,
  feeTypeLabel: feeTypeLabels[item.feeType] ?? item.feeType,
  payStatusLabel: payStatusLabels[item.payStatus] ?? item.payStatus,
  dueDate: formatDate(item.dueDate),
  paidDate: formatDate(item.paidDate),
  departmentId: item.departmentId,
});

export const buildAchievementDetailOpenRequest = (
  item: SearchAchievementResultItem,
): string => item.id;

export const buildSearchFeeDetailOpenRequest = (item: SearchFeeResultItem): string => item.id;

export const summarizeSearchResults = (
  items: readonly SearchResultItem[],
  total = items.length,
): SearchSummary => {
  const groups = groupSearchResults(items);

  return {
    total,
    achievementCount: groups.achievements.length,
    feeCount: groups.fees.length,
    redactedAchievementCount: groups.achievements.filter((item) => item.redacted).length,
  };
};

export const groupSearchResults = (
  items: readonly SearchResultItem[],
): SearchResultGroups => ({
  achievements: items.filter(
    (item): item is SearchAchievementResultItem => item.targetType === "ACHIEVEMENT",
  ),
  fees: items.filter((item): item is SearchFeeResultItem => item.targetType === "FEE_RECORD"),
});

export const buildSearchFilterSummary = (filters: SearchFilters): string[] => {
  const trimmed = trimSearchFilters(filters);
  const targetTypes = getSearchTargetTypes(trimmed);
  const labels = [
    trimmed.keyword ? `关键词：${trimmed.keyword}` : "关键词：全部",
    `结果类型：${getTargetTypesSummaryLabel(targetTypes)}`,
    targetTypes && targetTypes.length > 1 ? "目标类型：前端 request shaping，不证明后端搜索语义" : null,
    trimmed.achievementType
      ? `成果类型：${achievementTypeLabels[trimmed.achievementType] ?? trimmed.achievementType}`
      : null,
    trimmed.achievementStatus
      ? `成果状态：${achievementStatusLabels[trimmed.achievementStatus] ?? trimmed.achievementStatus}`
      : null,
    trimmed.feeType ? `费用类型：${feeTypeLabels[trimmed.feeType] ?? trimmed.feeType}` : null,
    trimmed.payStatus
      ? `缴费状态：${payStatusLabels[trimmed.payStatus] ?? trimmed.payStatus}`
      : null,
    trimmed.departmentId ? `部门：${trimmed.departmentId}` : null,
    `数量：${trimmed.take ?? defaultTake}`,
  ];

  return labels.filter((label): label is string => Boolean(label));
};

const SearchSummaryPanel = ({
  summary,
  filters,
}: {
  summary: SearchSummary;
  filters: string[];
}) => (
  <div className="search-summary-panel">
    <div className="search-summary-metrics">
      <SummaryMetric label="总数" value={summary.total} />
      <SummaryMetric label="成果" value={summary.achievementCount} />
      <SummaryMetric label="费用" value={summary.feeCount} />
      <SummaryMetric label="脱敏成果" value={summary.redactedAchievementCount} />
    </div>
    <div className="search-filter-summary">
      <Typography.Text type="secondary">当前筛选</Typography.Text>
      <Space size={6} wrap>
        {filters.map((filter) => (
          <Tag key={filter}>{filter}</Tag>
        ))}
      </Space>
    </div>
  </div>
);

const SummaryMetric = ({ label, value }: { label: string; value: number }) => (
  <div className="search-summary-metric">
    <Typography.Text type="secondary">{label}</Typography.Text>
    <Typography.Text strong>{value}</Typography.Text>
  </div>
);

const SearchResultGroupList = ({
  groups,
  onOpenAchievementDetail,
  onOpenFeeDetail,
}: {
  groups: SearchResultGroups;
  onOpenAchievementDetail: (item: SearchAchievementResultItem) => void;
  onOpenFeeDetail: (item: SearchFeeResultItem) => void;
}) => (
  <div className="search-result-groups">
    {groups.achievements.length > 0 ? (
      <SearchResultSection
        title="成果结果"
        count={groups.achievements.length}
        items={groups.achievements}
        onOpenAchievementDetail={onOpenAchievementDetail}
        onOpenFeeDetail={onOpenFeeDetail}
      />
    ) : null}
    {groups.fees.length > 0 ? (
      <SearchResultSection
        title="费用结果"
        count={groups.fees.length}
        items={groups.fees}
        onOpenAchievementDetail={onOpenAchievementDetail}
        onOpenFeeDetail={onOpenFeeDetail}
      />
    ) : null}
  </div>
);

const SearchResultSection = ({
  title,
  count,
  items,
  onOpenAchievementDetail,
  onOpenFeeDetail,
}: {
  title: string;
  count: number;
  items: SearchResultItem[];
  onOpenAchievementDetail: (item: SearchAchievementResultItem) => void;
  onOpenFeeDetail: (item: SearchFeeResultItem) => void;
}) => (
  <section className="search-result-section">
    <div className="search-result-section-header">
      <Typography.Title level={5}>{title}</Typography.Title>
      <Tag>{count} 条</Tag>
    </div>
    <div className="search-result-list">
      {items.map((item) => (
        <SearchResultCard
          key={`${item.targetType}:${item.id}`}
          item={item}
          onOpenAchievementDetail={onOpenAchievementDetail}
          onOpenFeeDetail={onOpenFeeDetail}
        />
      ))}
    </div>
  </section>
);

const SearchResultCard = ({
  item,
  onOpenAchievementDetail,
  onOpenFeeDetail,
}: {
  item: SearchResultItem;
  onOpenAchievementDetail: (item: SearchAchievementResultItem) => void;
  onOpenFeeDetail: (item: SearchFeeResultItem) => void;
}) => {
  if (item.targetType === "ACHIEVEMENT") {
    return <AchievementResultCard item={item} onOpenDetail={onOpenAchievementDetail} />;
  }

  return <FeeResultCard item={item} onOpenDetail={onOpenFeeDetail} />;
};

const AchievementResultCard = ({
  item,
  onOpenDetail,
}: {
  item: SearchAchievementResultItem;
  onOpenDetail: (item: SearchAchievementResultItem) => void;
}) => {
  const display = buildAchievementDisplayModel(item);

  return (
    <div className="search-result-card">
      <div className="search-result-main">
        <Space size={8} wrap>
          <Tag color="blue">成果</Tag>
          <Tag>{achievementTypeLabels[item.type] ?? item.type}</Tag>
          <Tag>{achievementStatusLabels[item.status] ?? item.status}</Tag>
          <Tag>{secretLevelLabels[item.secretLevel] ?? item.secretLevel}</Tag>
          {item.redacted ? <Tag color="warning">后端脱敏</Tag> : null}
        </Space>
        {display.redacted ? (
          <Alert
            className="search-redacted-alert"
            type="warning"
            showIcon
            message="成果标题和标识符已由后端脱敏"
          />
        ) : (
          <Typography.Title level={5}>{display.title ?? "未返回标题"}</Typography.Title>
        )}
        {display.identifiers.length > 0 ? (
          <Space size={8} wrap>
            {display.identifiers.map((identifier) => (
              <Tag key={identifier.label}>{`${identifier.label}: ${identifier.value}`}</Tag>
            ))}
          </Space>
        ) : null}
      </div>
      <div className="search-result-meta">
        <MetaLine label="成果 ID" value={item.id} />
        <MetaLine label="部门 ID" value={item.departmentId} />
        <MetaLine label="更新时间" value={formatDateTime(item.updatedAt)} />
        <div className="search-result-actions">
          <Button size="small" onClick={() => onOpenDetail(item)}>
            查看详情
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeeResultCard = ({
  item,
  onOpenDetail,
}: {
  item: SearchFeeResultItem;
  onOpenDetail: (item: SearchFeeResultItem) => void;
}) => {
  const display = buildFeeDisplayModel(item);

  return (
    <div className="search-result-card">
      <div className="search-result-main">
        <Space size={8} wrap>
          <Tag color="green">费用</Tag>
          <Tag>{display.feeTypeLabel}</Tag>
          <Tag color={payStatusColors[item.payStatus]}>{display.payStatusLabel}</Tag>
        </Space>
        <Typography.Title level={5}>费用记录 {display.id}</Typography.Title>
        <Typography.Text type="secondary">
          费用检索结果仅展示后端返回的只读索引字段。
        </Typography.Text>
      </div>
      <div className="search-result-meta">
        <MetaLine label="费用 ID" value={display.id} />
        <MetaLine label="成果 ID" value={display.achievementId} />
        <MetaLine label="部门 ID" value={display.departmentId} />
        <MetaLine label="应缴日期" value={display.dueDate} />
        <MetaLine label="缴费日期" value={display.paidDate} />
        <div className="search-result-actions">
          <Button size="small" onClick={() => onOpenDetail(item)}>
            查看详情
          </Button>
        </div>
      </div>
    </div>
  );
};

const MetaLine = ({ label, value }: { label: string; value: string }) => (
  <div className="search-meta-line">
    <Typography.Text type="secondary">{label}</Typography.Text>
    <Typography.Text ellipsis copyable={value !== "未返回"}>
      {value}
    </Typography.Text>
  </div>
);

const trimSearchFilters = (filters: SearchFilters): SearchFilters => {
  const keyword = filters.keyword?.trim();
  const departmentId = filters.departmentId?.trim();

  return {
    keyword: keyword || undefined,
    targetType: filters.targetType ?? "ALL",
    targetTypes: filters.targetTypes?.filter(Boolean),
    achievementType: filters.achievementType,
    achievementStatus: filters.achievementStatus,
    feeType: filters.feeType,
    payStatus: filters.payStatus,
    departmentId: departmentId || undefined,
    take: clampTake(filters.take ?? defaultTake),
  };
};

const hasActiveSearchFilters = (filters: SearchFilters): boolean =>
  Boolean(
    filters.keyword?.trim() ||
      (filters.targetType && filters.targetType !== "ALL") ||
      Boolean(filters.targetTypes && filters.targetTypes.length > 0) ||
      filters.achievementType ||
      filters.achievementStatus ||
      filters.feeType ||
      filters.payStatus ||
      filters.departmentId?.trim() ||
      (filters.take !== undefined && filters.take !== defaultTake),
  );

const toSearchQuery = (filters: SearchFilters): SearchQuery => {
  const trimmed = trimSearchFilters(filters);

  return {
    keyword: trimmed.keyword,
    targetTypes: getSearchTargetTypes(trimmed),
    achievementType: trimmed.achievementType,
    achievementStatus: trimmed.achievementStatus,
    feeType: trimmed.feeType,
    payStatus: trimmed.payStatus,
    departmentId: trimmed.departmentId,
    take: trimmed.take,
  };
};

export const getSearchTargetTypes = (
  filters: SearchFilters,
): readonly SearchTargetTypeCode[] | undefined => {
  if (filters.targetTypes) {
    const explicitTargetTypes = Array.from(new Set(filters.targetTypes.filter(Boolean)));

    return explicitTargetTypes.length > 0 ? explicitTargetTypes : undefined;
  }

  return filters.targetType && filters.targetType !== "ALL" ? [filters.targetType] : undefined;
};

const createInvalidDepartmentError = (departmentId: string): ApiError => ({
  kind: "bad-request",
  status: 400,
  message: "部门 ID 必须是 UUID",
  detail: `当前输入：${departmentId}。请清空该筛选，或输入形如 10000000-0000-4000-8000-000000000002 的 UUID。`,
});

const isUuid = (value: string): boolean => uuidPattern.test(value);

const getTargetTypeLabel = (value: SearchTargetFilter): string =>
  targetTypeOptions.find((option) => option.value === value)?.label ?? value;

const getTargetTypesSummaryLabel = (
  targetTypes: readonly SearchTargetTypeCode[] | undefined,
): string => {
  if (!targetTypes || targetTypes.length === 0) {
    return getTargetTypeLabel("ALL");
  }

  return targetTypes.map((targetType) => getTargetTypeLabel(targetType)).join("、");
};

const clampTake = (take: number): number => {
  if (!Number.isFinite(take)) {
    return defaultTake;
  }

  return Math.min(Math.max(Math.trunc(take), 1), maxTake);
};

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "请求失败",
    detail: error instanceof Error ? error.message : undefined,
  };
};

const formatIdentifiers = (
  identifiers: SearchAchievementIdentifiers,
): Array<{ label: string; value: string }> =>
  [
    identifiers.doi ? { label: "DOI", value: identifiers.doi } : null,
    identifiers.patentApplicationNo
      ? { label: "申请号", value: identifiers.patentApplicationNo }
      : null,
    identifiers.patentGrantNo ? { label: "授权号", value: identifiers.patentGrantNo } : null,
    identifiers.softwareRegistrationNo
      ? { label: "登记号", value: identifiers.softwareRegistrationNo }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "未返回";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
  }).format(date);
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "未返回";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
