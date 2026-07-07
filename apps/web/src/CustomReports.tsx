import {
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { SelectProps, TableProps } from "antd";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createApiClient,
  isApiError,
  type AccountManagementApiClient,
  type ApiError,
} from "./api-client";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import type {
  CustomReportColumn,
  CustomReportRow,
  CustomReportRunQuery,
  CustomReportRunResponse,
  CustomReportTemplate,
  CustomReportTemplateId,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type CustomReportsClient = Pick<
  AccountManagementApiClient,
  "listCustomReportTemplates" | "runCustomReport"
>;

type CustomReportsProps = {
  demoUserId: string | null;
  apiClient?: CustomReportsClient;
};

type CustomReportsViewProps = {
  templates: Loadable<CustomReportTemplate[]>;
  report: Loadable<CustomReportRunResponse>;
  selectedTemplateId: string | null;
  filters: CustomReportRunQuery;
  onTemplateChange?: (templateId: string) => void;
  onFilterChange?: <K extends keyof CustomReportRunQuery>(
    key: K,
    value: CustomReportRunQuery[K] | undefined,
  ) => void;
  onRun?: () => void;
  onReloadTemplates?: () => void;
};

export const customReportTemplateIds: readonly CustomReportTemplateId[] = [
  "achievement-distribution",
  "achievement-trend",
  "fee-risk-summary",
  "workflow-efficiency",
  "conversion-funnel",
];

export const customReportBoundaryText =
  "本页面仅展示权限范围内的聚合报表摘要，不展示明细敏感数据或原始记录。";

const emptyTemplates: Loadable<CustomReportTemplate[]> = {
  loading: false,
  data: null,
  error: null,
};

const emptyReport: Loadable<CustomReportRunResponse> = {
  loading: false,
  data: null,
  error: null,
};

const achievementTypeOptions: SelectProps<string>["options"] = [
  { label: "PAPER", value: "PAPER" },
  { label: "PATENT", value: "PATENT" },
  { label: "SOFTWARE_COPYRIGHT", value: "SOFTWARE_COPYRIGHT" },
];

const statusOptionsByTemplate: Record<string, SelectProps<string>["options"]> = {
  "achievement-distribution": [
    { label: "DRAFT", value: "DRAFT" },
    { label: "PENDING_DEPARTMENT_REVIEW", value: "PENDING_DEPARTMENT_REVIEW" },
    { label: "DEPARTMENT_REJECTED", value: "DEPARTMENT_REJECTED" },
    { label: "PENDING_ARCHIVE", value: "PENDING_ARCHIVE" },
    { label: "ARCHIVED", value: "ARCHIVED" },
    { label: "VOIDED", value: "VOIDED" },
  ],
  "achievement-trend": [
    { label: "DRAFT", value: "DRAFT" },
    { label: "PENDING_DEPARTMENT_REVIEW", value: "PENDING_DEPARTMENT_REVIEW" },
    { label: "DEPARTMENT_REJECTED", value: "DEPARTMENT_REJECTED" },
    { label: "PENDING_ARCHIVE", value: "PENDING_ARCHIVE" },
    { label: "ARCHIVED", value: "ARCHIVED" },
    { label: "VOIDED", value: "VOIDED" },
  ],
  "fee-risk-summary": [
    { label: "PENDING", value: "PENDING" },
    { label: "PAID", value: "PAID" },
    { label: "OVERDUE", value: "OVERDUE" },
    { label: "WAIVED", value: "WAIVED" },
    { label: "CANCELLED", value: "CANCELLED" },
  ],
  "workflow-efficiency": [
    { label: "PENDING", value: "PENDING" },
    { label: "CLAIMED", value: "CLAIMED" },
    { label: "APPROVED", value: "APPROVED" },
    { label: "REJECTED", value: "REJECTED" },
    { label: "CANCELLED", value: "CANCELLED" },
  ],
  "conversion-funnel": [
    { label: "LEAD_INTENT", value: "LEAD_INTENT" },
    { label: "CONTRACTING", value: "CONTRACTING" },
    { label: "SIGNED", value: "SIGNED" },
    { label: "PAID", value: "PAID" },
    { label: "COMPLETED", value: "COMPLETED" },
    { label: "CANCELLED", value: "CANCELLED" },
  ],
};

export function CustomReports({ demoUserId, apiClient }: CustomReportsProps) {
  const defaultApiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const reportsClient = apiClient ?? defaultApiClient;
  const [templates, setTemplates] = useState<Loadable<CustomReportTemplate[]>>(
    emptyTemplates,
  );
  const [report, setReport] = useState<Loadable<CustomReportRunResponse>>(emptyReport);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [filters, setFilters] = useState<CustomReportRunQuery>({
    groupBy: "month",
    dueSoonDays: 30,
  });

  const loadTemplates = useCallback(() => {
    if (!hasDemoUser(demoUserId)) {
      setTemplates(emptyTemplates);
      setReport(emptyReport);
      setSelectedTemplateId(null);
      return;
    }

    setTemplates({ loading: true, data: null, error: null });
    void loadCustomReportTemplatesForDemoUser(reportsClient, demoUserId)
      .then((items) => {
        const nextTemplates = items ?? [];
        setTemplates({ loading: false, data: nextTemplates, error: null });
        setSelectedTemplateId((current) =>
          getDefaultCustomReportTemplateId(nextTemplates, current),
        );
      })
      .catch((error: unknown) =>
        setTemplates({
          loading: false,
          data: null,
          error: mapCustomReportErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [demoUserId, reportsClient]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const changeTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setReport(emptyReport);
  }, []);

  const changeFilter = useCallback(
    <K extends keyof CustomReportRunQuery>(
      key: K,
      value: CustomReportRunQuery[K] | undefined,
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const runReport = useCallback(() => {
    if (!hasDemoUser(demoUserId) || !selectedTemplateId) {
      setReport(emptyReport);
      return;
    }

    setReport({ loading: true, data: null, error: null });
    void runCustomReportForDemoUser(
      reportsClient,
      demoUserId,
      selectedTemplateId,
      buildCustomReportRunQuery(selectedTemplateId, filters),
    )
      .then((data) => setReport({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setReport({
          loading: false,
          data: null,
          error: mapCustomReportErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [demoUserId, filters, reportsClient, selectedTemplateId]);

  if (!hasDemoUser(demoUserId)) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="自定义报表"
          description="请选择当前业务用户后查看可用报表模板。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，页面不会加载报表数据。"
        />
      </Space>
    );
  }

  return (
    <CustomReportsView
      templates={templates}
      report={report}
      selectedTemplateId={selectedTemplateId}
      filters={filters}
      onTemplateChange={changeTemplate}
      onFilterChange={changeFilter}
      onRun={runReport}
      onReloadTemplates={loadTemplates}
    />
  );
}

export const loadCustomReportTemplatesForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
): Promise<CustomReportTemplate[] | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  return client.listCustomReportTemplates();
};

export const runCustomReportForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
  templateId: string,
  query: CustomReportRunQuery,
): Promise<CustomReportRunResponse | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  return client.runCustomReport(templateId, query);
};

export const buildCustomReportRunQuery = (
  templateId: string,
  filters: CustomReportRunQuery,
): CustomReportRunQuery => {
  const query: CustomReportRunQuery = {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    departmentId: filters.departmentId,
    achievementType: filters.achievementType,
    status: filters.status,
  };

  if (templateId === "achievement-trend") {
    query.groupBy = filters.groupBy ?? "month";
  }

  if (templateId === "fee-risk-summary") {
    query.dueSoonDays = normalizeDueSoonDays(filters.dueSoonDays);
  }

  return compactCustomReportQuery(query);
};

export const compactCustomReportQuery = (
  query: CustomReportRunQuery,
): CustomReportRunQuery =>
  Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ""),
  ) as CustomReportRunQuery;

export const normalizeDueSoonDays = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) {
    return 30;
  }

  return Math.min(Math.max(Math.trunc(value), 1), 90);
};

export const getDefaultCustomReportTemplateId = (
  templates: readonly CustomReportTemplate[],
  currentTemplateId: string | null,
): string | null =>
  currentTemplateId && templates.some((template) => template.templateId === currentTemplateId)
    ? currentTemplateId
    : templates[0]?.templateId ?? null;

export const mapCustomReportErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "unauthorized") {
    return { ...error, message: "请先选择或切换有权限的用户。", detail: undefined };
  }

  if (error.kind === "forbidden") {
    return { ...error, message: "当前角色无权查看自定义报表。", detail: undefined };
  }

  if (error.kind === "bad-request") {
    return { ...error, message: "报表筛选条件无效。", detail: undefined };
  }

  if (error.kind === "server") {
    return { ...error, message: "报表服务暂不可用。", detail: undefined };
  }

  if (error.kind === "network") {
    return { ...error, message: "无法连接报表服务。", detail: undefined };
  }

  return { ...error, message: "报表请求失败。", detail: undefined };
};

export function CustomReportsView({
  templates,
  report,
  selectedTemplateId,
  filters,
  onTemplateChange,
  onFilterChange,
  onRun,
  onReloadTemplates,
}: CustomReportsViewProps) {
  const templateItems = templates.data ?? [];
  const selectedTemplate = templateItems.find(
    (template) => template.templateId === selectedTemplateId,
  );
  const rows = report.data?.rows ?? [];
  const isTrend = selectedTemplateId === "achievement-trend";
  const isFeeRisk = selectedTemplateId === "fee-risk-summary";

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="自定义报表"
        description="按模板查看当前权限范围内的聚合统计结果。"
        extra={
          <Space size={8} wrap>
            <Button onClick={onReloadTemplates} loading={templates.loading}>
              刷新模板
            </Button>
            <Button type="primary" onClick={onRun} loading={report.loading} disabled={!selectedTemplateId}>
              生成报表
            </Button>
          </Space>
        }
      />

      <PermissionHint description={customReportBoundaryText} />

      <DataState
        loading={templates.loading}
        error={templates.error}
        empty={templateItems.length === 0}
        emptyText="暂无可用报表模板。"
        onRetry={onReloadTemplates}
      >
        <Card className="shell-card" title="报表模板">
          <Space direction="vertical" size={12} className="full-width">
            <Select
              className="full-width"
              aria-label="Report template"
              value={selectedTemplateId ?? undefined}
              placeholder="选择报表模板"
              options={templateItems.map((template) => ({
                label: `${template.templateId} - ${template.name}`,
                value: template.templateId,
              }))}
              onChange={onTemplateChange}
            />
            <Space size={8} wrap>
              {templateItems.map((template) => (
                <Tag key={template.templateId}>{template.templateId}</Tag>
              ))}
            </Space>
            {selectedTemplate ? (
              <Typography.Text type="secondary">
                {selectedTemplate.name}: {selectedTemplate.description}
              </Typography.Text>
            ) : null}
          </Space>
        </Card>

        <Card className="shell-card" title="筛选条件">
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <FilterLabel label="开始日期">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => onFilterChange?.("dateFrom", event.target.value || undefined)}
                />
              </FilterLabel>
            </Col>
            <Col xs={24} md={8}>
              <FilterLabel label="结束日期">
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => onFilterChange?.("dateTo", event.target.value || undefined)}
                />
              </FilterLabel>
            </Col>
            <Col xs={24} md={8}>
              <FilterLabel label="所属部门">
                <Input
                  value={filters.departmentId}
                  placeholder="输入部门标识"
                  onChange={(event) =>
                    onFilterChange?.("departmentId", event.target.value || undefined)
                  }
                />
              </FilterLabel>
            </Col>
            <Col xs={24} md={8}>
              <FilterLabel label="成果类型">
                <Select
                  className="full-width"
                  allowClear
                  value={filters.achievementType}
                  options={achievementTypeOptions}
                  onChange={(value) => onFilterChange?.("achievementType", value)}
                />
              </FilterLabel>
            </Col>
            <Col xs={24} md={8}>
              <FilterLabel label="状态">
                <Select
                  className="full-width"
                  allowClear
                  value={filters.status}
                  options={statusOptionsByTemplate[selectedTemplateId ?? ""] ?? []}
                  onChange={(value) => onFilterChange?.("status", value)}
                />
              </FilterLabel>
            </Col>
            {isTrend ? (
              <Col xs={24} md={8}>
                <FilterLabel label="统计粒度">
                  <Select
                    className="full-width"
                    value={filters.groupBy ?? "month"}
                    options={[
                      { label: "按年", value: "year" },
                      { label: "按月", value: "month" },
                    ]}
                    onChange={(value) => onFilterChange?.("groupBy", value)}
                  />
                </FilterLabel>
              </Col>
            ) : null}
            {isFeeRisk ? (
              <Col xs={24} md={8}>
                <FilterLabel label="临近天数">
                  <InputNumber
                    className="full-width"
                    min={1}
                    max={90}
                    value={filters.dueSoonDays ?? 30}
                    onChange={(value) =>
                      onFilterChange?.("dueSoonDays", value === null ? undefined : Number(value))
                    }
                  />
                </FilterLabel>
              </Col>
            ) : null}
          </Row>
        </Card>

        <CustomReportResult report={report} onRetry={onRun} rows={rows} />
      </DataState>
    </Space>
  );
}

const CustomReportResult = ({
  report,
  rows,
  onRetry,
}: {
  report: Loadable<CustomReportRunResponse>;
  rows: CustomReportRow[];
  onRetry?: () => void;
}) => (
  <Card className="shell-card" title="汇总结果">
    <DataState
      loading={report.loading}
      error={report.error}
      empty={!report.data}
      emptyText="请选择筛选条件并运行报表模板。"
      onRetry={onRetry}
    >
      {report.data ? (
        <Space direction="vertical" size={16} className="full-width">
          <Descriptions size="small" bordered column={1}>
            <Descriptions.Item label="报表模板">
              {report.data.metadata.templateId}
            </Descriptions.Item>
            <Descriptions.Item label="模板名称">{report.data.metadata.name}</Descriptions.Item>
            <Descriptions.Item label="生成时间">
              {formatCustomReportDateTime(report.data.metadata.generatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="当前用户">
              {report.data.scopeSummary.userId}
            </Descriptions.Item>
            <Descriptions.Item label="部门范围">
              {report.data.scopeSummary.departmentScope.departmentIds.join(", ") || "无部门范围"}
            </Descriptions.Item>
            <Descriptions.Item label="权限策略">
              {report.data.scopeSummary.policy}
            </Descriptions.Item>
          </Descriptions>

          <KeyValueBlock title="已用筛选" values={report.data.filters} />
          <KeyValueBlock title="汇总指标" values={report.data.totals} />

          {rows.length === 0 ? (
            <div className="state-box">
              <Typography.Text type="secondary">
                当前筛选条件下没有汇总行。
              </Typography.Text>
            </div>
          ) : (
            <Table
              size="small"
              rowKey="__rowKey"
              columns={buildCustomReportTableColumns(report.data.columns)}
              dataSource={rows.map((row, index) => ({
                ...row,
                __rowKey: `custom-report-row-${index}`,
              }))}
              pagination={false}
            />
          )}

          <Space size={8} wrap>
            {report.data.caveats.map((caveat) => (
              <Tag key={caveat} color="gold">
                {caveat}
              </Tag>
            ))}
          </Space>
        </Space>
      ) : null}
    </DataState>
  </Card>
);

const KeyValueBlock = ({
  title,
  values,
}: {
  title: string;
  values: Record<string, unknown>;
}) => (
  <div>
    <Typography.Text strong>{title}</Typography.Text>
    <div className="summary-meta">
      {Object.entries(values).length === 0 ? (
        <Typography.Text type="secondary">暂无</Typography.Text>
      ) : (
        Object.entries(values).map(([key, value]) => (
          <Tag key={key}>
            {key}: {String(value)}
          </Tag>
        ))
      )}
    </div>
  </div>
);

const FilterLabel = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Space direction="vertical" size={4} className="full-width">
    <Typography.Text strong>{label}</Typography.Text>
    {children}
  </Space>
);

export const buildCustomReportTableColumns = (
  columns: CustomReportColumn[],
): TableProps<CustomReportRow>["columns"] =>
  columns.map((column) => ({
    title: column.label,
    dataIndex: column.key,
    key: column.key,
    render: (value: unknown) => formatCustomReportCell(value),
  }));

export const formatCustomReportCell = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
};

export const formatCustomReportDateTime = (value: string | undefined): string => {
  if (!value) {
    return "not returned";
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

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "Custom report request failed.",
  };
};

const hasDemoUser = (demoUserId: string | null | undefined): demoUserId is string =>
  Boolean(demoUserId?.trim());
