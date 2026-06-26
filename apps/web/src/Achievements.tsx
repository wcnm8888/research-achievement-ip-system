import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AchievementDetail } from "./AchievementDetail";
import { AchievementForm, isEditableAchievementStatus } from "./AchievementForm";
import {
  createApiClient,
  isApiError,
  type ApiClient,
  type ApiError,
  type AuthUser,
} from "./api-client";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import type {
  AchievementListItem,
  AchievementListQuery,
  AchievementListResult,
  AchievementStatusCode,
  AchievementTypeCode,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type AchievementFilters = {
  keyword?: string;
  status?: AchievementStatusCode;
  type?: AchievementTypeCode;
};

type AchievementsProps = {
  demoUserId: string | null;
  authUser?: AchievementPermissionContext;
};

type AchievementPermissionContext = Pick<AuthUser, "id" | "permissionCodes"> | null | undefined;

type FormRequest =
  | {
      mode: "create";
    }
  | {
      achievementId: string;
      mode: "edit";
    };

const defaultPageSize = 20;

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const typeOptions: Array<{ label: string; value: AchievementTypeCode }> = [
  { label: "论文", value: "PAPER" },
  { label: "专利", value: "PATENT" },
  { label: "软件著作权", value: "SOFTWARE_COPYRIGHT" },
];

const statusOptions: Array<{ label: string; value: AchievementStatusCode }> = [
  { label: "草稿", value: "DRAFT" },
  { label: "待院系审核", value: "PENDING_DEPARTMENT_REVIEW" },
  { label: "院系驳回", value: "DEPARTMENT_REJECTED" },
  { label: "待归档", value: "PENDING_ARCHIVE" },
  { label: "已归档", value: "ARCHIVED" },
  { label: "已作废", value: "VOIDED" },
];

const typeLabels = Object.fromEntries(
  typeOptions.map((option) => [option.value, option.label]),
) as Record<AchievementTypeCode, string>;

const statusLabels = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label]),
) as Record<AchievementStatusCode, string>;

const secretLevelLabels: Record<AchievementListItem["secretLevel"], string> = {
  PUBLIC: "公开",
  INTERNAL: "内部",
  SECRET: "秘密",
  CONFIDENTIAL: "机密",
};

export function Achievements({ demoUserId, authUser }: AchievementsProps) {
  const [draftFilters, setDraftFilters] = useState<AchievementFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AchievementFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [achievements, setAchievements] =
    useState<Loadable<AchievementListResult>>(emptyLoadable);
  const [formRequest, setFormRequest] = useState<FormRequest | null>(null);
  const [detailItem, setDetailItem] = useState<AchievementListItem | null>(null);
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);

  const query = useMemo(
    () => buildAchievementListQuery(appliedFilters, page, pageSize),
    [appliedFilters, page, pageSize],
  );

  const loadAchievements = useCallback(() => {
    if (!demoUserId) {
      setAchievements(emptyLoadable);
      return;
    }

    setAchievements({ loading: true, data: null, error: null });
    void fetchAchievementList(apiClient, query)
      .then((data) => setAchievements({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setAchievements({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, demoUserId, query]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(trimFilters(draftFilters));
  };

  const resetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
    setPage(1);
    setPageSize(defaultPageSize);
  };

  const hasFilters = hasActiveFilters(appliedFilters);
  const items = achievements.data?.items ?? [];

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="成果管理"
          description="选择本地演示用户后，前端才会请求后端成果列表。"
        />
        <PermissionHint description="当前没有 X-Demo-User-Id，成果管理不会发起业务请求。选择科研人员、科研秘书或系统管理员演示上下文后，列表会统一由后端权限策略裁剪。" />
        <BoundaryNotice
          title="等待演示上下文"
          description="Step 12D 已提供真实详情和动作入口；选择演示上下文后才能读取后端业务数据。"
          step="Step 12D"
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="成果管理"
        description="读取后端 GET /achievements 的真实成果列表；筛选、分页和脱敏结果均以后端返回为准。"
        extra={
          canCreateAchievementDraft(authUser) ? (
            <Button type="primary" onClick={() => setFormRequest({ mode: "create" })}>
              登记成果
            </Button>
          ) : undefined
        }
      />
      <PermissionHint description="最终读取权限以后端策略为准。前端只负责传递 X-Demo-User-Id、展示后端返回的列表和脱敏状态，不在浏览器端承担最终鉴权。" />

      <Card className="shell-card">
        <Space className="achievement-filter-bar" size={12} wrap>
          <Input.Search
            allowClear
            className="achievement-keyword"
            placeholder="按标题关键词筛选"
            enterButton="查询"
            value={draftFilters.keyword}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
            }
            onSearch={applyFilters}
          />
          <Select
            allowClear
            className="achievement-filter-select"
            placeholder="成果类型"
            options={typeOptions}
            value={draftFilters.type}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, type: value }))
            }
          />
          <Select
            allowClear
            className="achievement-filter-select"
            placeholder="成果状态"
            options={statusOptions}
            value={draftFilters.status}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, status: value }))
            }
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={loadAchievements}>刷新</Button>
        </Space>
      </Card>

      <Card className="shell-card" title="成果列表" extra={<Tag>GET /achievements</Tag>}>
        <DataState
          loading={achievements.loading}
          error={achievements.error}
          empty={!achievements.loading && !achievements.error && items.length === 0}
          emptyText={hasFilters ? "没有匹配的成果" : "暂无成果"}
          onRetry={loadAchievements}
        >
          <Table<AchievementListItem>
            className="achievement-table"
            rowKey="id"
            columns={createColumns(
              (item) => setFormRequest({ achievementId: item.id, mode: "edit" }),
              setDetailItem,
              authUser,
            )}
            dataSource={items}
            pagination={{
              current: achievements.data?.page ?? page,
              pageSize: achievements.data?.pageSize ?? pageSize,
              total: achievements.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            scroll={{ x: 1120 }}
          />
        </DataState>
      </Card>

      {formRequest ? (
        <AchievementForm
          apiClient={apiClient}
          mode={formRequest.mode}
          open
          achievementId={
            formRequest.mode === "edit" ? formRequest.achievementId : undefined
          }
          onClose={() => setFormRequest(null)}
          onSaved={({ close }) => {
            loadAchievements();

            if (close) {
              setFormRequest(null);
            }
          }}
        />
      ) : null}

      {detailItem ? (
        <AchievementDetail
          apiClient={apiClient}
          demoUserId={demoUserId}
          listItem={detailItem}
          open
          onChanged={loadAchievements}
          onClose={() => setDetailItem(null)}
        />
      ) : null}
    </Space>
  );
}

export const buildAchievementListQuery = (
  filters: AchievementFilters,
  page: number,
  pageSize: number,
): AchievementListQuery => {
  const trimmed = trimFilters(filters);

  return {
    ...trimmed,
    page,
    pageSize,
  };
};

export const getAchievementDisplayTitle = (item: Pick<AchievementListItem, "title" | "isRedacted">) => {
  if (item.title) {
    return item.title;
  }

  return item.isRedacted ? "已脱敏成果" : "未命名成果";
};

export const isAchievementTitleRedacted = (
  item: Pick<AchievementListItem, "title" | "isRedacted">,
): boolean => item.title === null && item.isRedacted;

const hasAchievementPermission = (
  authUser: AchievementPermissionContext,
  permissionCode: string,
): boolean => !authUser || authUser.permissionCodes.includes(permissionCode);

export const canCreateAchievementDraft = (
  authUser: AchievementPermissionContext,
): boolean => hasAchievementPermission(authUser, "achievement:create");

export const canEditAchievementDraft = (
  authUser: AchievementPermissionContext,
  item: Pick<AchievementListItem, "ownerUserId" | "status">,
): boolean =>
  hasAchievementPermission(authUser, "achievement:update_own") &&
  (!authUser || item.ownerUserId === authUser.id) &&
  isEditableAchievementStatus(item.status);

const canSeeRejectedDraftEditBoundary = (
  authUser: AchievementPermissionContext,
  item: Pick<AchievementListItem, "ownerUserId" | "status">,
): boolean =>
  hasAchievementPermission(authUser, "achievement:update_own") &&
  (!authUser || item.ownerUserId === authUser.id) &&
  item.status === "DEPARTMENT_REJECTED";

const fetchAchievementList = async (
  client: ApiClient,
  query: AchievementListQuery,
): Promise<AchievementListResult> => {
  const result = await client.get<Partial<AchievementListResult>>("/achievements", query);

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : query.page,
    pageSize: typeof result.pageSize === "number" ? result.pageSize : query.pageSize,
  };
};

const trimFilters = (filters: AchievementFilters): AchievementFilters => {
  const keyword = filters.keyword?.trim();

  return {
    keyword: keyword || undefined,
    status: filters.status,
    type: filters.type,
  };
};

const hasActiveFilters = (filters: AchievementFilters): boolean =>
  Boolean(filters.keyword?.trim() || filters.status || filters.type);

const createColumns = (
  onEdit: (item: AchievementListItem) => void,
  onViewDetail: (item: AchievementListItem) => void,
  authUser?: AchievementPermissionContext,
): TableProps<AchievementListItem>["columns"] => [
  {
    title: "标题",
    dataIndex: "title",
    key: "title",
    width: 280,
    render: (_value, item) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong={!isAchievementTitleRedacted(item)}>
          {getAchievementDisplayTitle(item)}
        </Typography.Text>
        {item.isRedacted ? <Tag color="warning">后端脱敏</Tag> : null}
      </Space>
    ),
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
    width: 136,
    render: (value: AchievementTypeCode) => typeLabels[value] ?? value,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 152,
    render: (value: AchievementStatusCode) => <Tag>{statusLabels[value] ?? value}</Tag>,
  },
  {
    title: "密级",
    dataIndex: "secretLevel",
    key: "secretLevel",
    width: 112,
    render: (value: AchievementListItem["secretLevel"], item) => (
      <Tag color={item.isRestricted ? "orange" : "default"}>
        {secretLevelLabels[value] ?? value}
      </Tag>
    ),
  },
  {
    title: "所属部门",
    dataIndex: "departmentId",
    key: "departmentId",
    width: 220,
    render: (value: string) => <Typography.Text ellipsis>{value}</Typography.Text>,
  },
  {
    title: "负责人",
    dataIndex: "ownerUserId",
    key: "ownerUserId",
    width: 220,
    render: (value: string) => <Typography.Text ellipsis>{value}</Typography.Text>,
  },
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: "状态时间",
    key: "stateTime",
    width: 176,
    render: (_, item) => formatDateTime(item.archivedAt ?? item.submittedAt ?? item.voidedAt),
  },
  {
    title: "操作入口",
    key: "actions",
    fixed: "right",
    width: 180,
    render: (_, item) => (
      <Space>
        {renderEditAction(item, onEdit, authUser)}
        <Button size="small" onClick={() => onViewDetail(item)}>
          查看详情
        </Button>
      </Space>
    ),
  },
];

const renderEditAction = (
  item: AchievementListItem,
  onEdit: (item: AchievementListItem) => void,
  authUser?: AchievementPermissionContext,
) => {
  if (canEditAchievementDraft(authUser, item)) {
    return (
      <Button size="small" type="link" onClick={() => onEdit(item)}>
        编辑草稿
      </Button>
    );
  }

  if (canSeeRejectedDraftEditBoundary(authUser, item)) {
    return (
      <Tooltip title="当前后端暂不支持驳回后编辑">
        <Button disabled size="small" type="link">
          编辑
        </Button>
      </Tooltip>
    );
  }

  return null;
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
