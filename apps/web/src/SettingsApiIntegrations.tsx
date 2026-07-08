import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
  type FormInstance,
} from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createApiClient,
  isApiError,
  type AccountManagementApiClient,
  type ApiError,
  type AuthUser,
} from "./api-client";
import { hasSystemConfigPermission } from "./AccountManagement";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { SettingsImportJobHistoryOverview } from "./SettingsImportJobHistoryOverview";
import type {
  ApiIntegrationListResponse,
  ApiIntegrationMetadata,
  ApiIntegrationMockResultMode,
  ApiIntegrationMockRunInput,
  ApiIntegrationMockRunResponse,
  ApiIntegrationMockScenario,
  ApiIntegrationProvider,
  ApiIntegrationReasonInput,
  ApiCallLogListResponse,
  ApiCallLogSummary,
  CreateApiIntegrationInput,
  ListApiCallLogsQuery,
  ListApiIntegrationsQuery,
  UpdateApiIntegrationInput,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type SettingsApiIntegrationsProps = {
  demoUserId: string | null;
  authUser: Pick<AuthUser, "permissionCodes"> | null;
};

type ApiIntegrationFilters = {
  keyword?: string;
  provider?: ApiIntegrationProvider;
  enabled?: boolean;
  includeArchived?: boolean;
};

type ApiIntegrationFormValues = {
  code?: string;
  provider?: ApiIntegrationProvider;
  enabled?: boolean;
  timeoutMs?: number;
  configRef?: string | null;
};

type ReasonFormValues = {
  reason?: string;
};

type ApiIntegrationMockDemoValues = {
  provider: ApiIntegrationProvider;
  scenario: ApiIntegrationMockScenario;
  resultMode: ApiIntegrationMockResultMode;
};

type ApiIntegrationFormMode =
  | { kind: "create" }
  | { kind: "edit"; integration: ApiIntegrationMetadata };

type ApiIntegrationOperation =
  | { kind: "archive"; integration: ApiIntegrationMetadata }
  | { kind: "restore"; integration: ApiIntegrationMetadata };

const defaultPageSize = 20;
const defaultTimeoutMs = 3000;
const defaultMockDemoValues: ApiIntegrationMockDemoValues = {
  provider: "DOI",
  scenario: "DOI_LOOKUP",
  resultMode: "SUCCESS",
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

export const apiIntegrationProviderOptions: Array<{
  label: string;
  value: ApiIntegrationProvider;
}> = [
  { label: "DOI", value: "DOI" },
  { label: "邮件", value: "EMAIL" },
  { label: "HR", value: "HR" },
  { label: "财务", value: "FINANCE" },
  { label: "专利", value: "PATENT" },
  { label: "存储", value: "STORAGE" },
  { label: "检索", value: "SEARCH" },
  { label: "其他", value: "OTHER" },
];

const providerLabels = Object.fromEntries(
  apiIntegrationProviderOptions.map((option) => [option.value, option.label]),
) as Record<ApiIntegrationProvider, string>;

const mockScenarioOptions: Array<{
  label: string;
  value: ApiIntegrationMockScenario;
  provider: ApiIntegrationProvider;
}> = [
  { label: "DOI 查询预演", value: "DOI_LOOKUP", provider: "DOI" },
  {
    label: "专利状态同步预演",
    value: "PATENT_STATUS_SYNC",
    provider: "PATENT",
  },
  {
    label: "财务回调与对账预演",
    value: "FINANCE_RECONCILE",
    provider: "FINANCE",
  },
  { label: "HR 同步预演", value: "HR_SYNC", provider: "HR" },
];

const mockScenarioProviderMap = Object.fromEntries(
  mockScenarioOptions.map((option) => [option.value, option.provider]),
) as Record<ApiIntegrationMockScenario, ApiIntegrationProvider>;

const mockResultModeOptions: Array<{
  label: string;
  value: ApiIntegrationMockResultMode;
}> = [
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILURE" },
  { label: "降级", value: "DEGRADED" },
];

export function SettingsApiIntegrations({
  demoUserId,
  authUser,
}: SettingsApiIntegrationsProps) {
  const [draftFilters, setDraftFilters] = useState<ApiIntegrationFilters>({
    includeArchived: false,
  });
  const [appliedFilters, setAppliedFilters] = useState<ApiIntegrationFilters>({
    includeArchived: false,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [integrations, setIntegrations] =
    useState<Loadable<ApiIntegrationListResponse>>(emptyLoadable);
  const [mockDemoValues, setMockDemoValues] =
    useState<ApiIntegrationMockDemoValues>(defaultMockDemoValues);
  const [mockDemoRun, setMockDemoRun] =
    useState<Loadable<ApiIntegrationMockRunResponse>>(emptyLoadable);
  const [apiCallLogs, setApiCallLogs] =
    useState<Loadable<ApiCallLogListResponse>>(emptyLoadable);
  const [detailIntegrationId, setDetailIntegrationId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Loadable<ApiIntegrationMetadata>>(emptyLoadable);
  const [formMode, setFormMode] = useState<ApiIntegrationFormMode | null>(null);
  const [operation, setOperation] = useState<ApiIntegrationOperation | null>(null);
  const [operationError, setOperationError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [integrationForm] = Form.useForm<ApiIntegrationFormValues>();
  const [reasonForm] = Form.useForm<ReasonFormValues>();
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const canManageSettings = hasSystemConfigPermission(authUser);
  const query = useMemo(
    () => buildApiIntegrationListQuery(appliedFilters, page, pageSize),
    [appliedFilters, page, pageSize],
  );

  const loadIntegrations = useCallback(() => {
    if (!canManageSettings || !demoUserId) {
      setIntegrations(emptyLoadable);
      return;
    }

    setIntegrations({ loading: true, data: null, error: null });
    void fetchApiIntegrations(apiClient, query)
      .then((data) => setIntegrations({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setIntegrations({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, canManageSettings, demoUserId, query]);

  const loadDetail = useCallback(
    (integrationId: string) => {
      if (!canManageSettings || !demoUserId) {
        setDetail(emptyLoadable);
        return;
      }

      setDetailIntegrationId(integrationId);
      setDetail({ loading: true, data: null, error: null });
      void fetchApiIntegrationDetail(apiClient, integrationId)
        .then((data) => setDetail({ loading: false, data, error: null }))
        .catch((error: unknown) =>
          setDetail({ loading: false, data: null, error: normalizeError(error) }),
        );
    },
    [apiClient, canManageSettings, demoUserId],
  );

  const loadApiCallLogs = useCallback(() => {
    if (!canManageSettings || !demoUserId) {
      setApiCallLogs(emptyLoadable);
      return;
    }

    setApiCallLogs({ loading: true, data: null, error: null });
    void fetchRecentApiCallLogs(apiClient, { limit: 10 })
      .then((data) => setApiCallLogs({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setApiCallLogs({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, canManageSettings, demoUserId]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    loadApiCallLogs();
  }, [loadApiCallLogs]);

  const refresh = useCallback(() => {
    loadIntegrations();
    loadApiCallLogs();
    if (detailIntegrationId) {
      loadDetail(detailIntegrationId);
    }
  }, [detailIntegrationId, loadApiCallLogs, loadDetail, loadIntegrations]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(trimApiIntegrationFilters(draftFilters));
  };

  const resetFilters = () => {
    const nextFilters = { includeArchived: false };
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(1);
    setPageSize(defaultPageSize);
  };

  const openCreate = () => {
    integrationForm.resetFields();
    integrationForm.setFieldsValue({ enabled: false, timeoutMs: defaultTimeoutMs });
    setOperationError(null);
    setFormMode({ kind: "create" });
  };

  const openEdit = (integration: ApiIntegrationMetadata) => {
    integrationForm.resetFields();
    integrationForm.setFieldsValue({
      code: integration.code,
      provider: integration.provider,
      enabled: integration.enabled,
      timeoutMs: integration.timeoutMs,
      configRef: integration.configRef,
    });
    setOperationError(null);
    setFormMode({ kind: "edit", integration });
  };

  const closeForm = () => {
    integrationForm.resetFields();
    setFormMode(null);
    setOperationError(null);
  };

  const handleFormFinish = async (values: ApiIntegrationFormValues) => {
    if (!formMode) {
      return;
    }

    setSubmitting(true);
    setOperationError(null);

    try {
      const updatedIntegration =
        formMode.kind === "create"
          ? await createApiIntegrationFromForm(apiClient, values)
          : await updateApiIntegrationFromForm(
              apiClient,
              formMode.integration.id,
              values,
            );

      message.success(
        formMode.kind === "create"
          ? "接口配置已创建。"
          : "接口配置已更新。",
      );
      closeForm();
      setDetailIntegrationId(updatedIntegration.id);
      setDetail({ loading: false, data: updatedIntegration, error: null });
      refresh();
    } catch (error) {
      setOperationError(normalizeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const openOperation = (request: ApiIntegrationOperation) => {
    setOperation(request);
    setOperationError(null);
    reasonForm.resetFields();
  };

  const closeOperation = () => {
    setOperation(null);
    setOperationError(null);
    reasonForm.resetFields();
  };

  const handleOperationOk = async () => {
    if (!operation) {
      return;
    }

    setSubmitting(true);
    setOperationError(null);

    try {
      const updatedIntegration = await executeApiIntegrationOperation({
        apiClient,
        operation,
        reasonValues: reasonForm.getFieldsValue(),
      });

      message.success(
        operation.kind === "archive"
          ? "接口配置已停用。"
          : "接口配置已恢复。",
      );
      setDetailIntegrationId(updatedIntegration.id);
      setDetail({ loading: false, data: updatedIntegration, error: null });
      closeOperation();
      refresh();
    } catch (error) {
      setOperationError(normalizeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMockScenarioChange = (scenario: ApiIntegrationMockScenario) => {
    setMockDemoValues((current) => ({
      ...current,
      scenario,
      provider: mockScenarioProviderMap[scenario],
    }));
  };

  const handleMockDemoRun = async () => {
    setMockDemoRun({ loading: true, data: null, error: null });

    try {
      const result = await runApiIntegrationMockDemo(apiClient, mockDemoValues);
      setMockDemoRun({ loading: false, data: result, error: null });
      message.success("接口预演已完成。");
      loadApiCallLogs();
    } catch (error) {
      setMockDemoRun({ loading: false, data: null, error: normalizeError(error) });
    }
  };

  const rows = integrations.data?.items ?? [];
  const hasFilters = hasActiveApiIntegrationFilters(appliedFilters);

  if (!canManageSettings) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="系统接口配置"
          description="接口配置元数据管理仅对具备系统配置权限的账号开放。"
        />
        <DataState
          error={{
            kind: "forbidden",
            status: 403,
            message: "当前账号无权访问系统接口配置。",
            detail:
              "请使用具备系统配置权限的管理员账号。",
          }}
        >
          <span />
        </DataState>
      </Space>
    );
  }

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="系统接口配置"
          description="需要有效登录会话后才能查看接口配置元数据。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用业务上下文；系统接口配置不会加载业务数据。"
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack settings-api-page">
      <SectionHeader
        title="系统接口配置"
        description="管理外部接口配置元数据；配置引用只是非敏感名称，不是密钥值。"
        extra={
          <Space size={8} wrap>
            <Button onClick={refresh}>刷新</Button>
            <Button type="primary" onClick={openCreate}>
              新增接口配置
            </Button>
          </Space>
        }
      />

      <PermissionHint description="本页维护接口编码、供应商、启用状态、超时设置和配置引用名称。" />

      <SettingsImportJobHistoryOverview demoUserId={demoUserId} authUser={authUser} />

      <ApiIntegrationMockDemoCenter
        values={mockDemoValues}
        result={mockDemoRun}
        logs={apiCallLogs}
        submitting={mockDemoRun.loading}
        onProviderChange={(provider) =>
          setMockDemoValues((current) => ({ ...current, provider }))
        }
        onScenarioChange={handleMockScenarioChange}
        onResultModeChange={(resultMode) =>
          setMockDemoValues((current) => ({ ...current, resultMode }))
        }
        onRun={handleMockDemoRun}
        onReloadLogs={loadApiCallLogs}
      />

      <Card className="shell-card">
        <Space className="settings-api-filter-bar" size={12} wrap>
          <Input.Search
            allowClear
            className="settings-api-keyword"
            placeholder="搜索编码或配置引用"
            enterButton="查询"
            value={draftFilters.keyword}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
            }
            onSearch={applyFilters}
          />
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="供应商"
            options={apiIntegrationProviderOptions}
            value={draftFilters.provider}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, provider: value }))
            }
          />
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="启用状态"
            options={[
              { label: "已启用", value: true },
              { label: "已停用", value: false },
            ]}
            value={draftFilters.enabled}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, enabled: value }))
            }
          />
          <Space size={8}>
            <Switch
              checked={Boolean(draftFilters.includeArchived)}
              onChange={(checked) =>
                setDraftFilters((current) => ({
                  ...current,
                  includeArchived: checked,
                }))
              }
            />
            <Typography.Text>包含已归档</Typography.Text>
          </Space>
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
        </Space>
      </Card>

      <Card
        className="shell-card"
        title="接口集成配置"
      >
        <DataState
          loading={integrations.loading}
          error={integrations.error}
          empty={!integrations.loading && !integrations.error && rows.length === 0}
          emptyText={hasFilters ? "没有匹配的接口配置。" : "暂无接口配置。"}
          onRetry={loadIntegrations}
        >
          <Table<ApiIntegrationMetadata>
            className="settings-api-table"
            rowKey="id"
            columns={createApiIntegrationColumns({
              onEdit: openEdit,
              onOperation: openOperation,
              onViewDetail: loadDetail,
            })}
            dataSource={rows}
            pagination={{
              current: integrations.data?.page ?? page,
              pageSize: integrations.data?.pageSize ?? pageSize,
              total: integrations.data?.total ?? 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
            scroll={{ x: 1080 }}
          />
        </DataState>
      </Card>

      <Drawer
        className="settings-api-detail-drawer"
        title="接口集成详情"
        width={640}
        open={Boolean(detailIntegrationId)}
        onClose={() => {
          setDetailIntegrationId(null);
          setDetail(emptyLoadable);
        }}
      >
        <DataState
          loading={detail.loading}
          error={detail.error}
          onRetry={() => {
            if (detailIntegrationId) {
              loadDetail(detailIntegrationId);
            }
          }}
        >
          {detail.data ? (
            <ApiIntegrationDetailView
              integration={detail.data}
              onEdit={openEdit}
              onOperation={openOperation}
            />
          ) : null}
        </DataState>
      </Drawer>

      <ApiIntegrationFormDrawer
        form={integrationForm}
        mode={formMode}
        submitting={submitting}
        error={operationError}
        onClose={closeForm}
        onFinish={handleFormFinish}
      />

      <ApiIntegrationOperationModal
        operation={operation}
        form={reasonForm}
        submitting={submitting}
        error={operationError}
        onCancel={closeOperation}
        onOk={handleOperationOk}
      />
    </Space>
  );
}

export const buildApiIntegrationListQuery = (
  filters: ApiIntegrationFilters,
  page: number,
  pageSize: number,
): ListApiIntegrationsQuery => ({
  ...trimApiIntegrationFilters(filters),
  page,
  pageSize,
});

export const fetchApiIntegrations = async (
  client: Pick<AccountManagementApiClient, "listApiIntegrations">,
  query: ListApiIntegrationsQuery,
): Promise<ApiIntegrationListResponse> => {
  const result = await client.listApiIntegrations(query);

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: typeof result.total === "number" ? result.total : 0,
    page: typeof result.page === "number" ? result.page : query.page ?? 1,
    pageSize:
      typeof result.pageSize === "number" ? result.pageSize : query.pageSize ?? defaultPageSize,
  };
};

export const fetchApiIntegrationDetail = async (
  client: Pick<AccountManagementApiClient, "getApiIntegration">,
  integrationId: string,
): Promise<ApiIntegrationMetadata> => client.getApiIntegration(integrationId);

export const fetchRecentApiCallLogs = async (
  client: Pick<AccountManagementApiClient, "listApiCallLogs">,
  query: ListApiCallLogsQuery,
): Promise<ApiCallLogListResponse> => {
  const result = await client.listApiCallLogs(query);

  return {
    items: Array.isArray(result.items) ? result.items : [],
  };
};

export const buildApiIntegrationMockDemoPayload = (
  values: ApiIntegrationMockDemoValues,
): ApiIntegrationMockRunInput => ({
  provider: values.provider,
  scenario: values.scenario,
  resultMode: values.resultMode,
});

export const runApiIntegrationMockDemo = async (
  client: Pick<AccountManagementApiClient, "runApiIntegrationMockDemo">,
  values: ApiIntegrationMockDemoValues,
): Promise<ApiIntegrationMockRunResponse> =>
  client.runApiIntegrationMockDemo(buildApiIntegrationMockDemoPayload(values));

export const buildCreateApiIntegrationPayload = (
  values: ApiIntegrationFormValues,
): CreateApiIntegrationInput => {
  const code = values.code?.trim();

  if (!code || !values.provider) {
    throw new Error("Integration code and provider are required.");
  }

  return {
    code,
    provider: values.provider,
    enabled: Boolean(values.enabled),
    timeoutMs: values.timeoutMs ?? defaultTimeoutMs,
    configRef: normalizeConfigRef(values.configRef),
  };
};

export const buildUpdateApiIntegrationPayload = (
  values: ApiIntegrationFormValues,
): UpdateApiIntegrationInput => {
  const payload: UpdateApiIntegrationInput = {};
  const code = values.code?.trim();

  if (code) {
    payload.code = code;
  }

  if (values.provider) {
    payload.provider = values.provider;
  }

  if (values.enabled !== undefined) {
    payload.enabled = Boolean(values.enabled);
  }

  if (values.timeoutMs !== undefined) {
    payload.timeoutMs = values.timeoutMs;
  }

  if ("configRef" in values) {
    payload.configRef = normalizeConfigRef(values.configRef);
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("At least one API integration update field is required.");
  }

  return payload;
};

export const buildApiIntegrationReasonPayload = (
  values: ReasonFormValues,
): ApiIntegrationReasonInput => {
  const reason = values.reason?.trim();
  return reason ? { reason } : {};
};

export const createApiIntegrationFromForm = async (
  client: Pick<AccountManagementApiClient, "createApiIntegration">,
  values: ApiIntegrationFormValues,
): Promise<ApiIntegrationMetadata> =>
  client.createApiIntegration(buildCreateApiIntegrationPayload(values));

export const updateApiIntegrationFromForm = async (
  client: Pick<AccountManagementApiClient, "updateApiIntegration">,
  integrationId: string,
  values: ApiIntegrationFormValues,
): Promise<ApiIntegrationMetadata> =>
  client.updateApiIntegration(integrationId, buildUpdateApiIntegrationPayload(values));

export const executeApiIntegrationOperation = async ({
  apiClient,
  operation,
  reasonValues = {},
}: {
  apiClient: Pick<
    AccountManagementApiClient,
    "archiveApiIntegration" | "restoreApiIntegration"
  >;
  operation: ApiIntegrationOperation;
  reasonValues?: ReasonFormValues;
}): Promise<ApiIntegrationMetadata> => {
  const reasonPayload = buildApiIntegrationReasonPayload(reasonValues);

  return operation.kind === "archive"
    ? apiClient.archiveApiIntegration(operation.integration.id, reasonPayload)
    : apiClient.restoreApiIntegration(operation.integration.id, reasonPayload);
};

const trimApiIntegrationFilters = (
  filters: ApiIntegrationFilters,
): ApiIntegrationFilters => {
  const keyword = filters.keyword?.trim();

  return {
    keyword: keyword || undefined,
    provider: filters.provider,
    enabled: filters.enabled,
    includeArchived: Boolean(filters.includeArchived) || undefined,
  };
};

const hasActiveApiIntegrationFilters = (filters: ApiIntegrationFilters): boolean =>
  Boolean(
    filters.keyword?.trim() ||
      filters.provider ||
      filters.enabled !== undefined ||
      filters.includeArchived,
  );

const normalizeConfigRef = (configRef: string | null | undefined): string | null => {
  const trimmed = configRef?.trim();
  return trimmed || null;
};

const createApiIntegrationColumns = ({
  onEdit,
  onOperation,
  onViewDetail,
}: {
  onEdit: (integration: ApiIntegrationMetadata) => void;
  onOperation: (request: ApiIntegrationOperation) => void;
  onViewDetail: (integrationId: string) => void;
}): TableProps<ApiIntegrationMetadata>["columns"] => [
  {
    title: "接口配置",
    key: "integration",
    width: 240,
    render: (_, integration) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{integration.code}</Typography.Text>
        <Typography.Text type="secondary">{integration.id}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "供应商",
    dataIndex: "provider",
    key: "provider",
    width: 112,
    render: (provider: ApiIntegrationProvider) => (
      <Tag>{providerLabels[provider] ?? provider}</Tag>
    ),
  },
  {
    title: "状态",
    key: "state",
    width: 160,
    render: (_, integration) => renderIntegrationState(integration),
  },
  {
    title: "超时时间",
    dataIndex: "timeoutMs",
    key: "timeoutMs",
    width: 112,
    render: (timeoutMs: number) => `${timeoutMs} ms`,
  },
  {
    title: "配置引用",
    dataIndex: "configRef",
    key: "configRef",
    width: 260,
    render: (configRef: string | null) => configRef || "未配置",
  },
  {
    title: "更新时间",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: "操作",
    key: "actions",
    fixed: "right",
    width: 260,
    render: (_, integration) => (
      <Space size={8} wrap>
        <Button size="small" onClick={() => onViewDetail(integration.id)}>
          查看
        </Button>
        <Button size="small" onClick={() => onEdit(integration)}>
          编辑
        </Button>
        {integration.archivedAt ? (
          <Button
            size="small"
            onClick={() => onOperation({ kind: "restore", integration })}
          >
            Restore
          </Button>
        ) : (
          <Button
            danger
            size="small"
            onClick={() => onOperation({ kind: "archive", integration })}
          >
            Archive
          </Button>
        )}
      </Space>
    ),
  },
];

function ApiIntegrationMockDemoCenter({
  values,
  result,
  logs,
  submitting,
  onProviderChange,
  onScenarioChange,
  onResultModeChange,
  onRun,
  onReloadLogs,
}: {
  values: ApiIntegrationMockDemoValues;
  result: Loadable<ApiIntegrationMockRunResponse>;
  logs: Loadable<ApiCallLogListResponse>;
  submitting: boolean;
  onProviderChange: (provider: ApiIntegrationProvider) => void;
  onScenarioChange: (scenario: ApiIntegrationMockScenario) => void;
  onResultModeChange: (resultMode: ApiIntegrationMockResultMode) => void;
  onRun: () => void | Promise<void>;
  onReloadLogs: () => void;
}) {
  const expectedProvider = mockScenarioProviderMap[values.scenario];
  const providerMismatch = values.provider !== expectedProvider;
  const callLogRows = logs.data?.items ?? [];

  return (
    <Card
      className="shell-card settings-api-mock-demo"
      title="外部接口预留能力中心"
      extra={<Tag color="orange">预演模式</Tag>}
    >
      <Space direction="vertical" size={16} className="full-width">
        <Alert
          type="warning"
          showIcon
          message="预留接口调用预演"
          description="本区域用于展示外部接口适配器的预演结果，不会创建付款、账号、凭证或其他业务写入。"
        />

        <Space size={12} wrap>
          <Select<ApiIntegrationProvider>
            className="settings-api-filter-select"
            value={values.provider}
            options={apiIntegrationProviderOptions.filter((option) =>
              ["DOI", "PATENT", "FINANCE", "HR"].includes(option.value),
            )}
            onChange={onProviderChange}
          />
          <Select<ApiIntegrationMockScenario>
            className="settings-api-filter-select"
            value={values.scenario}
            options={mockScenarioOptions}
            onChange={onScenarioChange}
          />
          <Select<ApiIntegrationMockResultMode>
            className="settings-api-filter-select"
            value={values.resultMode}
            options={mockResultModeOptions}
            onChange={onResultModeChange}
          />
          <Button type="primary" loading={submitting} onClick={onRun}>
            运行预演
          </Button>
          <Button onClick={onReloadLogs}>刷新日志</Button>
        </Space>

        {providerMismatch ? (
          <Alert
            type="error"
            showIcon
            message="接口类型与场景不匹配"
            description={`当前场景需要 ${expectedProvider} 类型接口，请调整后重试。`}
          />
        ) : null}

        <DataState loading={result.loading} error={result.error}>
          {result.data ? <MockDemoResultView result={result.data} /> : null}
        </DataState>

        <Card
          className="shell-card"
          title="近期安全调用日志"
        >
          <DataState
            loading={logs.loading}
            error={logs.error}
            empty={!logs.loading && !logs.error && callLogRows.length === 0}
            emptyText="暂无接口调用日志。"
            onRetry={onReloadLogs}
          >
            <Table<ApiCallLogSummary>
              rowKey="requestId"
              size="small"
              columns={apiCallLogColumns}
              dataSource={callLogRows}
              pagination={false}
              scroll={{ x: 960 }}
            />
          </DataState>
        </Card>
      </Space>
    </Card>
  );
}

function MockDemoResultView({ result }: { result: ApiIntegrationMockRunResponse }) {
  return (
    <Card
      className="shell-card"
      title="接口预演结果"
      extra={renderMockRunStatus(result.runStatus)}
    >
      <Space direction="vertical" size={12} className="full-width">
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="场景">{result.scenario}</Descriptions.Item>
          <Descriptions.Item label="接口类型">{result.provider}</Descriptions.Item>
          <Descriptions.Item label="请求模式">
            {result.requestedResultMode}
          </Descriptions.Item>
          <Descriptions.Item label="接口配置">
            {result.integration
              ? `${result.integration.code} (${result.integration.enabled ? "已启用" : "已停用"})`
              : "缺少接口配置"}
          </Descriptions.Item>
          <Descriptions.Item label="预演对象">
            {result.syntheticSubject.replace(/^Synthetic\s+/i, "预演")}
          </Descriptions.Item>
          <Descriptions.Item label="摘要">{result.summary}</Descriptions.Item>
          <Descriptions.Item label="调用日志">
            {result.callLog
              ? `${result.callLog.integrationCode} / ${result.callLog.requestId}`
              : "未写入日志"}
          </Descriptions.Item>
        </Descriptions>

        <Alert type="info" showIcon message={result.safetyNotice} />

        <Descriptions bordered size="small" column={1}>
          {Object.entries(result.safeResult).map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {formatSafeResultValue(value)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Space>
    </Card>
  );
}

const apiCallLogColumns: TableProps<ApiCallLogSummary>["columns"] = [
  {
    title: "接口配置",
    dataIndex: "integrationCode",
    key: "integrationCode",
    width: 180,
  },
  {
    title: "请求编号",
    dataIndex: "requestId",
    key: "requestId",
    width: 260,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: ApiCallLogSummary["status"]) => renderApiCallStatus(status),
  },
  {
    title: "耗时",
    dataIndex: "durationMs",
    key: "durationMs",
    width: 120,
    render: (durationMs: number | null) =>
      durationMs === null ? "未返回" : `${durationMs} ms`,
  },
  {
    title: "错误摘要",
    dataIndex: "errorSummary",
    key: "errorSummary",
    width: 280,
    render: (errorSummary: string | null) => errorSummary || "无",
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
];

function ApiIntegrationDetailView({
  integration,
  onEdit,
  onOperation,
}: {
  integration: ApiIntegrationMetadata;
  onEdit: (integration: ApiIntegrationMetadata) => void;
  onOperation: (request: ApiIntegrationOperation) => void;
}) {
  return (
    <Space direction="vertical" size={16} className="full-width">
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="ID">{integration.id}</Descriptions.Item>
        <Descriptions.Item label="编码">{integration.code}</Descriptions.Item>
        <Descriptions.Item label="供应商">
          {providerLabels[integration.provider] ?? integration.provider}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {renderIntegrationState(integration)}
        </Descriptions.Item>
        <Descriptions.Item label="超时时间">{integration.timeoutMs} ms</Descriptions.Item>
        <Descriptions.Item label="配置引用名称">
          {integration.configRef || "未配置"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {formatDateTime(integration.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {formatDateTime(integration.updatedAt)}
        </Descriptions.Item>
        <Descriptions.Item label="归档时间">
          {formatDateTime(integration.archivedAt)}
        </Descriptions.Item>
      </Descriptions>

      <Alert
        type="info"
        showIcon
        message="仅维护元数据"
        description="配置引用用于匹配运行配置，请勿在此输入供应商凭证或运行密钥。"
      />

      <Card className="shell-card" title="操作">
        <Space size={8} wrap>
          <Button onClick={() => onEdit(integration)}>编辑元数据</Button>
          {integration.archivedAt ? (
            <Button onClick={() => onOperation({ kind: "restore", integration })}>
              恢复
            </Button>
          ) : (
            <Button danger onClick={() => onOperation({ kind: "archive", integration })}>
              归档
            </Button>
          )}
        </Space>
      </Card>
    </Space>
  );
}

function ApiIntegrationFormDrawer({
  form,
  mode,
  submitting,
  error,
  onClose,
  onFinish,
}: {
  form: FormInstance<ApiIntegrationFormValues>;
  mode: ApiIntegrationFormMode | null;
  submitting: boolean;
  error: ApiError | null;
  onClose: () => void;
  onFinish: (values: ApiIntegrationFormValues) => void | Promise<void>;
}) {
  const isEdit = mode?.kind === "edit";

  return (
    <Drawer
      className="settings-api-form-drawer"
      title={isEdit ? "编辑接口配置" : "新增接口配置"}
      width={560}
      open={Boolean(mode)}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            保存
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        <div className="business-note">
          <Typography.Text strong className="business-note-title">
            配置引用
          </Typography.Text>
          <Typography.Text type="secondary">
            仅填写配置引用名称，例如 provider.profile.default。
          </Typography.Text>
        </div>
        <Form<ApiIntegrationFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
        >
          <Form.Item
            label="编码"
            name="code"
            rules={[
              { required: true, message: "请输入接口配置编码。" },
              {
                pattern: /^[A-Z0-9_:-]+$/,
                message: "请使用大写字母、数字、下划线、冒号或短横线。",
              },
            ]}
          >
            <Input autoComplete="off" placeholder="DOI_LOOKUP" />
          </Form.Item>
          <Form.Item
            label="供应商"
            name="provider"
            rules={[{ required: true, message: "请选择供应商。" }]}
          >
            <Select options={apiIntegrationProviderOptions} placeholder="选择供应商" />
          </Form.Item>
          <Form.Item
            label="是否启用"
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="超时时间"
            name="timeoutMs"
            rules={[{ required: true, message: "请输入超时时间。" }]}
          >
            <InputNumber min={100} max={120000} addonAfter="ms" className="full-width" />
          </Form.Item>
          <Form.Item
            label="配置引用名称"
            name="configRef"
            extra="仅填写非敏感引用名称；如未分配引用可留空。"
            rules={[
              {
                pattern: /^[A-Za-z0-9_.:/-]+$/,
                message: "请使用字母、数字、下划线、点、冒号、斜杠或短横线。",
              },
            ]}
          >
            <Input autoComplete="off" placeholder="provider.profile.default" />
          </Form.Item>
        </Form>
      </Space>
    </Drawer>
  );
}

function ApiIntegrationOperationModal({
  operation,
  form,
  submitting,
  error,
  onCancel,
  onOk,
}: {
  operation: ApiIntegrationOperation | null;
  form: FormInstance<ReasonFormValues>;
  submitting: boolean;
  error: ApiError | null;
  onCancel: () => void;
  onOk: () => void | Promise<void>;
}) {
  return (
    <Modal
      title={operation ? getOperationTitle(operation) : ""}
      open={Boolean(operation)}
      okText="确认"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onOk}
      destroyOnHidden
    >
      <Space direction="vertical" size={12} className="full-width">
        <Alert
          type={operation?.kind === "archive" ? "warning" : "info"}
          showIcon
          message={
            operation?.kind === "archive"
              ? "归档会保留历史记录。"
              : "恢复只会清除归档状态。"
          }
          description={
            operation?.kind === "archive"
              ? "系统会停用该接口配置并记录归档时间，不会删除历史记录。"
              : "如果该接口配置此前已停用，恢复归档状态不会自动启用。"
          }
        />
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        <Form<ReasonFormValues> form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="原因（可选）" name="reason">
            <Input.TextArea maxLength={300} rows={3} />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}

const renderIntegrationState = (integration: ApiIntegrationMetadata) => (
  <Space size={6} wrap>
    <Tag color={integration.enabled ? "green" : "default"}>
      {integration.enabled ? "已启用" : "已停用"}
    </Tag>
    {integration.archivedAt ? <Tag color="orange">已归档</Tag> : <Tag>正常</Tag>}
  </Space>
);

const renderMockRunStatus = (status: ApiIntegrationMockRunResponse["runStatus"]) => {
  const colorByStatus: Record<ApiIntegrationMockRunResponse["runStatus"], string> = {
    SUCCESS: "green",
    FAILED: "red",
    DEGRADED: "gold",
    UNAVAILABLE: "default",
  };

  return <Tag color={colorByStatus[status]}>{status}</Tag>;
};

const renderApiCallStatus = (status: ApiCallLogSummary["status"]) => {
  const colorByStatus: Record<string, string> = {
    SUCCESS: "green",
    FAILED: "red",
    TIMEOUT: "red",
    RETRIED: "gold",
    SKIPPED: "default",
  };

  return <Tag color={colorByStatus[status] ?? "default"}>{status}</Tag>;
};

const formatSafeResultValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "是" : "否";
  }

  if (value === null || value === undefined) {
    return "未返回";
  }

  return String(value);
};

const getOperationTitle = (operation: ApiIntegrationOperation): string =>
  operation.kind === "archive"
    ? `归档 ${operation.integration.code}`
    : `恢复 ${operation.integration.code}`;

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "请求失败。",
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
