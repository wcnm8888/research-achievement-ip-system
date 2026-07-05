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
  { label: "Email", value: "EMAIL" },
  { label: "HR", value: "HR" },
  { label: "Finance", value: "FINANCE" },
  { label: "Patent", value: "PATENT" },
  { label: "Storage", value: "STORAGE" },
  { label: "Search", value: "SEARCH" },
  { label: "Other", value: "OTHER" },
];

const providerLabels = Object.fromEntries(
  apiIntegrationProviderOptions.map((option) => [option.value, option.label]),
) as Record<ApiIntegrationProvider, string>;

const mockScenarioOptions: Array<{
  label: string;
  value: ApiIntegrationMockScenario;
  provider: ApiIntegrationProvider;
}> = [
  { label: "DOI lookup mock", value: "DOI_LOOKUP", provider: "DOI" },
  {
    label: "Patent status sync mock",
    value: "PATENT_STATUS_SYNC",
    provider: "PATENT",
  },
  {
    label: "Finance callback/reconcile mock",
    value: "FINANCE_RECONCILE",
    provider: "FINANCE",
  },
  { label: "HR sync mock", value: "HR_SYNC", provider: "HR" },
];

const mockScenarioProviderMap = Object.fromEntries(
  mockScenarioOptions.map((option) => [option.value, option.provider]),
) as Record<ApiIntegrationMockScenario, ApiIntegrationProvider>;

const mockResultModeOptions: Array<{
  label: string;
  value: ApiIntegrationMockResultMode;
}> = [
  { label: "Success", value: "SUCCESS" },
  { label: "Failure", value: "FAILURE" },
  { label: "Degraded", value: "DEGRADED" },
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
          ? "API integration created."
          : "API integration updated.",
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
          ? "API integration archived."
          : "API integration restored.",
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
      message.success("Mock demo completed.");
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
          title="Settings"
          description="API integration metadata management is available only to system:config users."
        />
        <DataState
          error={{
            kind: "forbidden",
            status: 403,
            message: "Current account cannot access Settings.",
            detail:
              "Use an administrator with system:config. Without that permission, the frontend does not request /settings/api-integrations.",
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
          title="Settings"
          description="A valid session context is required before Settings APIs are requested."
        />
        <PermissionHint description="No active business context is available. The page will not request API integration metadata until a session is present." />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack settings-api-page">
      <SectionHeader
        title="Settings"
        description="Manage API integration metadata only. Config reference is a non-sensitive reference name, not a secret value."
        extra={
          <Space size={8} wrap>
            <Button onClick={refresh}>Refresh</Button>
            <Button type="primary" onClick={openCreate}>
              New integration
            </Button>
          </Space>
        }
      />

      <PermissionHint description="This page stores metadata only: code, provider, enabled flag, timeout and config reference name. It does not read environment files, store provider credentials, or switch runtime adapters." />

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
            placeholder="Search code or config reference"
            enterButton="Search"
            value={draftFilters.keyword}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
            }
            onSearch={applyFilters}
          />
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="Provider"
            options={apiIntegrationProviderOptions}
            value={draftFilters.provider}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, provider: value }))
            }
          />
          <Select
            allowClear
            className="settings-api-filter-select"
            placeholder="Enabled"
            options={[
              { label: "Enabled", value: true },
              { label: "Disabled", value: false },
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
            <Typography.Text>Include archived</Typography.Text>
          </Space>
          <Button type="primary" onClick={applyFilters}>
            Search
          </Button>
          <Button onClick={resetFilters}>Reset</Button>
        </Space>
      </Card>

      <Card
        className="shell-card"
        title="API integrations"
        extra={<Tag>GET /settings/api-integrations</Tag>}
      >
        <DataState
          loading={integrations.loading}
          error={integrations.error}
          empty={!integrations.loading && !integrations.error && rows.length === 0}
          emptyText={hasFilters ? "No matching integrations." : "No integrations yet."}
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
              showTotal: (total) => `${total} integrations`,
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
        title="API integration detail"
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
    title: "Integration",
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
    title: "Provider",
    dataIndex: "provider",
    key: "provider",
    width: 112,
    render: (provider: ApiIntegrationProvider) => (
      <Tag>{providerLabels[provider] ?? provider}</Tag>
    ),
  },
  {
    title: "State",
    key: "state",
    width: 160,
    render: (_, integration) => renderIntegrationState(integration),
  },
  {
    title: "Timeout",
    dataIndex: "timeoutMs",
    key: "timeoutMs",
    width: 112,
    render: (timeoutMs: number) => `${timeoutMs} ms`,
  },
  {
    title: "Config reference",
    dataIndex: "configRef",
    key: "configRef",
    width: 260,
    render: (configRef: string | null) => configRef || "Not configured",
  },
  {
    title: "Updated",
    dataIndex: "updatedAt",
    key: "updatedAt",
    width: 176,
    render: (value: string) => formatDateTime(value),
  },
  {
    title: "Actions",
    key: "actions",
    fixed: "right",
    width: 260,
    render: (_, integration) => (
      <Space size={8} wrap>
        <Button size="small" onClick={() => onViewDetail(integration.id)}>
          View
        </Button>
        <Button size="small" onClick={() => onEdit(integration)}>
          Edit
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
      title="External interface mock demo center"
      extra={<Tag color="orange">Mock demo only / 非真实外部联调</Tag>}
    >
      <Space direction="vertical" size={16} className="full-width">
        <Alert
          type="warning"
          showIcon
          message="Mock demo only / 非真实外部联调"
          description="Runs use synthetic adapter responses only. They do not call DOI, literature, patent, finance, HR, SSO, email, SMS, production, or VPS systems, and they do not create real payments, invoices, accounts, credentials, or business updates."
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
            Run mock
          </Button>
          <Button onClick={onReloadLogs}>Reload logs</Button>
        </Space>

        {providerMismatch ? (
          <Alert
            type="error"
            showIcon
            message="Provider/scenario mismatch"
            description={`Selected scenario expects ${expectedProvider}. The backend will reject mismatched mock demo requests before logging.`}
          />
        ) : null}

        <DataState loading={result.loading} error={result.error}>
          {result.data ? <MockDemoResultView result={result.data} /> : null}
        </DataState>

        <Card
          className="shell-card"
          title="Recent safe API call logs"
          extra={<Tag>GET /settings/api-integrations/mock-demo/logs</Tag>}
        >
          <DataState
            loading={logs.loading}
            error={logs.error}
            empty={!logs.loading && !logs.error && callLogRows.length === 0}
            emptyText="No API call logs yet."
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
      title="Mock run result"
      extra={renderMockRunStatus(result.runStatus)}
    >
      <Space direction="vertical" size={12} className="full-width">
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label="Scenario">{result.scenario}</Descriptions.Item>
          <Descriptions.Item label="Provider">{result.provider}</Descriptions.Item>
          <Descriptions.Item label="Requested mode">
            {result.requestedResultMode}
          </Descriptions.Item>
          <Descriptions.Item label="Integration">
            {result.integration
              ? `${result.integration.code} (${result.integration.enabled ? "enabled" : "disabled"})`
              : "Missing integration metadata"}
          </Descriptions.Item>
          <Descriptions.Item label="Synthetic subject">
            {result.syntheticSubject}
          </Descriptions.Item>
          <Descriptions.Item label="Summary">{result.summary}</Descriptions.Item>
          <Descriptions.Item label="Call log">
            {result.callLog
              ? `${result.callLog.integrationCode} / ${result.callLog.requestId}`
              : "No log was written"}
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
    title: "Integration",
    dataIndex: "integrationCode",
    key: "integrationCode",
    width: 180,
  },
  {
    title: "Request ID",
    dataIndex: "requestId",
    key: "requestId",
    width: 260,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (status: ApiCallLogSummary["status"]) => renderApiCallStatus(status),
  },
  {
    title: "Duration",
    dataIndex: "durationMs",
    key: "durationMs",
    width: 120,
    render: (durationMs: number | null) =>
      durationMs === null ? "Not returned" : `${durationMs} ms`,
  },
  {
    title: "Error summary",
    dataIndex: "errorSummary",
    key: "errorSummary",
    width: 280,
    render: (errorSummary: string | null) => errorSummary || "None",
  },
  {
    title: "Created",
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
        <Descriptions.Item label="Code">{integration.code}</Descriptions.Item>
        <Descriptions.Item label="Provider">
          {providerLabels[integration.provider] ?? integration.provider}
        </Descriptions.Item>
        <Descriptions.Item label="State">
          {renderIntegrationState(integration)}
        </Descriptions.Item>
        <Descriptions.Item label="Timeout">{integration.timeoutMs} ms</Descriptions.Item>
        <Descriptions.Item label="Config reference name">
          {integration.configRef || "Not configured"}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDateTime(integration.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Updated">
          {formatDateTime(integration.updatedAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Archived">
          {formatDateTime(integration.archivedAt)}
        </Descriptions.Item>
      </Descriptions>

      <Alert
        type="info"
        showIcon
        message="Metadata only"
        description="Config reference is a lookup label for backend runtime configuration. Do not enter provider credentials or runtime keys here."
      />

      <Card className="shell-card" title="Actions">
        <Space size={8} wrap>
          <Button onClick={() => onEdit(integration)}>Edit metadata</Button>
          {integration.archivedAt ? (
            <Button onClick={() => onOperation({ kind: "restore", integration })}>
              Restore
            </Button>
          ) : (
            <Button danger onClick={() => onOperation({ kind: "archive", integration })}>
              Archive
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
      title={isEdit ? "Edit API integration" : "New API integration"}
      width={560}
      open={Boolean(mode)}
      onClose={onClose}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            Save
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="full-width">
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        <Alert
          type="warning"
          showIcon
          message="Do not enter sensitive values"
          description="Config reference is a non-sensitive reference name, for example provider.profile.default. It is not a place for credentials."
        />
        <Form<ApiIntegrationFormValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onFinish}
        >
          <Form.Item
            label="Code"
            name="code"
            rules={[
              { required: true, message: "Enter an integration code." },
              {
                pattern: /^[A-Z0-9_:-]+$/,
                message: "Use uppercase letters, numbers, underscore, colon, or dash.",
              },
            ]}
          >
            <Input autoComplete="off" placeholder="DOI_LOOKUP" />
          </Form.Item>
          <Form.Item
            label="Provider"
            name="provider"
            rules={[{ required: true, message: "Select a provider." }]}
          >
            <Select options={apiIntegrationProviderOptions} placeholder="Provider" />
          </Form.Item>
          <Form.Item
            label="Enabled"
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Timeout"
            name="timeoutMs"
            rules={[{ required: true, message: "Enter a timeout." }]}
          >
            <InputNumber min={100} max={120000} addonAfter="ms" className="full-width" />
          </Form.Item>
          <Form.Item
            label="Config reference name"
            name="configRef"
            extra="Non-sensitive reference name only. Leave blank if no backend reference is assigned."
            rules={[
              {
                pattern: /^[A-Za-z0-9_.:/-]+$/,
                message: "Use letters, numbers, underscore, dot, colon, slash, or dash.",
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
      okText="Confirm"
      cancelText="Cancel"
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
              ? "Archive keeps metadata for history."
              : "Restore only clears archived status."
          }
          description={
            operation?.kind === "archive"
              ? "The backend disables the integration and sets archivedAt. It does not delete records."
              : "Restore does not enable the integration automatically if it was disabled."
          }
        />
        {error ? <Alert type="error" showIcon message={error.message} description={error.detail} /> : null}
        <Form<ReasonFormValues> form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Reason (optional)" name="reason">
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
      {integration.enabled ? "Enabled" : "Disabled"}
    </Tag>
    {integration.archivedAt ? <Tag color="orange">Archived</Tag> : <Tag>Active</Tag>}
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
    return value ? "true" : "false";
  }

  if (value === null || value === undefined) {
    return "Not returned";
  }

  return String(value);
};

const getOperationTitle = (operation: ApiIntegrationOperation): string =>
  operation.kind === "archive"
    ? `Archive ${operation.integration.code}`
    : `Restore ${operation.integration.code}`;

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "Request failed.",
    detail: error instanceof Error ? error.message : undefined,
  };
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return "Not returned";
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
