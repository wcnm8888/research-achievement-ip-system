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
  type ApiQuery,
} from "./api-client";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { getDemoSafeErrorMessage, sanitizeUnknownErrorDetail } from "./error-display";
import {
  downloadCsvExport,
  downloadPdfExport,
  downloadXlsxExport,
} from "./export-download";
import type {
  CustomReportColumn,
  CustomReportRow,
  CustomReportRunQuery,
  CustomReportRunResponse,
  CustomReportTemplate,
  CustomReportTemplateId,
  ScheduledReportEmailResult,
  ScheduledReportPlan,
  ScheduledReportPreviewResult,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type CustomReportsClient = Pick<
  AccountManagementApiClient,
  | "listCustomReportTemplates"
  | "runCustomReport"
  | "listScheduledReportPlans"
  | "previewScheduledReportPlan"
  | "sendScheduledReportEmail"
  | "downloadBlob"
>;

type CustomReportsProps = {
  demoUserId: string | null;
  apiClient?: CustomReportsClient;
};

type CustomReportExportFormat = "csv" | "xlsx" | "pdf";

type CustomReportsViewProps = {
  templates: Loadable<CustomReportTemplate[]>;
  report: Loadable<CustomReportRunResponse>;
  scheduledPlans: Loadable<ScheduledReportPlan[]>;
  scheduledPreview: Loadable<ScheduledReportPreviewResult>;
  scheduledEmail: Loadable<ScheduledReportEmailResult>;
  selectedTemplateId: string | null;
  selectedScheduledPlanId: string | null;
  filters: CustomReportRunQuery;
  onTemplateChange?: (templateId: string) => void;
  onFilterChange?: <K extends keyof CustomReportRunQuery>(
    key: K,
    value: CustomReportRunQuery[K] | undefined,
  ) => void;
  onRun?: () => void;
  onExportCsv?: () => void;
  onExportXlsx?: () => void;
  onExportPdf?: () => void;
  onScheduledPlanChange?: (planId: string) => void;
  onPreviewScheduledPlan?: () => void;
  onSendScheduledEmail?: () => void;
  onReloadScheduledPlans?: () => void;
  onReloadTemplates?: () => void;
  exporting?: boolean;
  exportError?: ApiError | null;
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

const emptyScheduledPlans: Loadable<ScheduledReportPlan[]> = {
  loading: false,
  data: null,
  error: null,
};

const emptyScheduledPreview: Loadable<ScheduledReportPreviewResult> = {
  loading: false,
  data: null,
  error: null,
};

const emptyScheduledEmail: Loadable<ScheduledReportEmailResult> = {
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
  const [scheduledPlans, setScheduledPlans] =
    useState<Loadable<ScheduledReportPlan[]>>(emptyScheduledPlans);
  const [scheduledPreview, setScheduledPreview] =
    useState<Loadable<ScheduledReportPreviewResult>>(emptyScheduledPreview);
  const [scheduledEmail, setScheduledEmail] =
    useState<Loadable<ScheduledReportEmailResult>>(emptyScheduledEmail);
  const [exportState, setExportState] = useState<{ loading: boolean; error: ApiError | null }>({
    loading: false,
    error: null,
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedScheduledPlanId, setSelectedScheduledPlanId] = useState<string | null>(
    null,
  );
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

  const loadScheduledPlans = useCallback(() => {
    if (!hasDemoUser(demoUserId)) {
      setScheduledPlans(emptyScheduledPlans);
      setScheduledPreview(emptyScheduledPreview);
      setScheduledEmail(emptyScheduledEmail);
      setSelectedScheduledPlanId(null);
      return;
    }

    setScheduledPlans({ loading: true, data: null, error: null });
    void loadScheduledReportPlansForDemoUser(reportsClient, demoUserId)
      .then((items) => {
        const nextPlans = items ?? [];
        setScheduledPlans({ loading: false, data: nextPlans, error: null });
        setSelectedScheduledPlanId((current) =>
          getDefaultScheduledReportPlanId(nextPlans, current),
        );
      })
      .catch((error: unknown) =>
        setScheduledPlans({
          loading: false,
          data: null,
          error: mapCustomReportErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [demoUserId, reportsClient]);

  useEffect(() => {
    loadScheduledPlans();
  }, [loadScheduledPlans]);

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

  const exportReport = useCallback((format: CustomReportExportFormat) => {
    if (!hasDemoUser(demoUserId) || !selectedTemplateId) {
      return;
    }

    setExportState({ loading: true, error: null });
    void exportCustomReportForDemoUser(
      reportsClient,
      demoUserId,
      selectedTemplateId,
      buildCustomReportRunQuery(selectedTemplateId, filters),
      format,
    )
      .then(() => setExportState({ loading: false, error: null }))
      .catch((error: unknown) =>
        setExportState({
          loading: false,
          error: mapCustomReportErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [demoUserId, filters, reportsClient, selectedTemplateId]);

  const previewScheduledPlan = useCallback(() => {
    if (!hasDemoUser(demoUserId) || !selectedScheduledPlanId) {
      setScheduledPreview(emptyScheduledPreview);
      return;
    }

    setScheduledPreview({ loading: true, data: null, error: null });
    void previewScheduledReportForDemoUser(
      reportsClient,
      demoUserId,
      selectedScheduledPlanId,
    )
      .then((data) => setScheduledPreview({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setScheduledPreview({
          loading: false,
          data: null,
          error: mapCustomReportErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [demoUserId, reportsClient, selectedScheduledPlanId]);

  const sendScheduledEmail = useCallback(() => {
    if (!hasDemoUser(demoUserId) || !selectedScheduledPlanId) {
      setScheduledEmail(emptyScheduledEmail);
      return;
    }

    setScheduledEmail({ loading: true, data: null, error: null });
    void sendScheduledReportEmailForDemoUser(
      reportsClient,
      demoUserId,
      selectedScheduledPlanId,
    )
      .then((data) => setScheduledEmail({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setScheduledEmail({
          loading: false,
          data: null,
          error: mapCustomReportErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [demoUserId, reportsClient, selectedScheduledPlanId]);

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
      scheduledPlans={scheduledPlans}
      scheduledPreview={scheduledPreview}
      scheduledEmail={scheduledEmail}
      selectedTemplateId={selectedTemplateId}
      selectedScheduledPlanId={selectedScheduledPlanId}
      filters={filters}
      onTemplateChange={changeTemplate}
      onFilterChange={changeFilter}
      onRun={runReport}
      onExportCsv={() => exportReport("csv")}
      onExportXlsx={() => exportReport("xlsx")}
      onExportPdf={() => exportReport("pdf")}
      onScheduledPlanChange={setSelectedScheduledPlanId}
      onPreviewScheduledPlan={previewScheduledPlan}
      onSendScheduledEmail={sendScheduledEmail}
      onReloadScheduledPlans={loadScheduledPlans}
      onReloadTemplates={loadTemplates}
      exporting={exportState.loading}
      exportError={exportState.error}
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

export const loadScheduledReportPlansForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
): Promise<ScheduledReportPlan[] | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  return client.listScheduledReportPlans();
};

export const previewScheduledReportForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
  planId: string,
): Promise<ScheduledReportPreviewResult | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  return client.previewScheduledReportPlan(planId);
};

export const sendScheduledReportEmailForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
  planId: string,
): Promise<ScheduledReportEmailResult | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  return client.sendScheduledReportEmail(planId);
};

export const exportCustomReportCsvForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
  templateId: string,
  query: CustomReportRunQuery,
): Promise<void> => {
  await exportCustomReportForDemoUser(client, demoUserId, templateId, query, "csv");
};

export const exportCustomReportXlsxForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
  templateId: string,
  query: CustomReportRunQuery,
): Promise<void> => {
  await exportCustomReportForDemoUser(client, demoUserId, templateId, query, "xlsx");
};

export const exportCustomReportPdfForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
  templateId: string,
  query: CustomReportRunQuery,
): Promise<void> => {
  await exportCustomReportForDemoUser(client, demoUserId, templateId, query, "pdf");
};

export const exportCustomReportForDemoUser = async (
  client: CustomReportsClient,
  demoUserId: string | null,
  templateId: string,
  query: CustomReportRunQuery,
  format: CustomReportExportFormat,
): Promise<void> => {
  if (!hasDemoUser(demoUserId)) {
    return;
  }

  const encodedTemplateId = encodeURIComponent(templateId);
  const exportPath = `/reports/templates/${encodedTemplateId}/export.${format}`;
  const fileName = `${templateId}.${format}`;

  if (format === "xlsx") {
    await downloadXlsxExport(client, exportPath, query as ApiQuery, fileName);
    return;
  }

  if (format === "pdf") {
    await downloadPdfExport(client, exportPath, query as ApiQuery, fileName);
    return;
  }

  await downloadCsvExport(client, exportPath, query as ApiQuery, fileName);
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

export const getDefaultScheduledReportPlanId = (
  plans: readonly ScheduledReportPlan[],
  currentPlanId: string | null,
): string | null =>
  currentPlanId && plans.some((plan) => plan.planId === currentPlanId)
    ? currentPlanId
    : plans[0]?.planId ?? null;

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
  scheduledPlans,
  scheduledPreview,
  scheduledEmail,
  selectedTemplateId,
  selectedScheduledPlanId,
  filters,
  onTemplateChange,
  onFilterChange,
  onRun,
  onExportCsv,
  onExportXlsx,
  onExportPdf,
  onScheduledPlanChange,
  onPreviewScheduledPlan,
  onSendScheduledEmail,
  onReloadScheduledPlans,
  onReloadTemplates,
  exporting = false,
  exportError = null,
}: CustomReportsViewProps) {
  const templateItems = templates.data ?? [];
  const selectedTemplate = templateItems.find(
    (template) => template.templateId === selectedTemplateId,
  );
  const rows = report.data?.rows ?? [];
  const isTrend = selectedTemplateId === "achievement-trend";
  const isFeeRisk = selectedTemplateId === "fee-risk-summary";

  return (
    <Space direction="vertical" size={16} className="page-stack custom-report-page">
      <SectionHeader
        title="自定义报表"
        description="按预设模板生成权限范围内的聚合统计，并导出评审材料所需的 CSV、Excel 或 PDF。"
        extra={
          <Space size={8} wrap>
            <Button onClick={onReloadTemplates} loading={templates.loading}>
              刷新模板
            </Button>
            <Button type="primary" onClick={onRun} loading={report.loading} disabled={!selectedTemplateId}>
              生成报表
            </Button>
            <Button onClick={onExportCsv} loading={exporting} disabled={!selectedTemplateId}>
              导出 CSV
            </Button>
            <Button onClick={onExportXlsx} loading={exporting} disabled={!selectedTemplateId}>
              导出 Excel
            </Button>
            <Button onClick={onExportPdf} loading={exporting} disabled={!selectedTemplateId}>
              导出 PDF
            </Button>
          </Space>
        }
      />

      <PermissionHint description={customReportBoundaryText} />
      {exportError ? (
        <Typography.Text type="danger">
          {getDemoSafeErrorMessage(exportError)}
        </Typography.Text>
      ) : null}

      <ScheduledReportPreviewPanel
        plans={scheduledPlans}
        preview={scheduledPreview}
        email={scheduledEmail}
        selectedPlanId={selectedScheduledPlanId}
        onPlanChange={onScheduledPlanChange}
        onPreview={onPreviewScheduledPlan}
        onSendEmail={onSendScheduledEmail}
        onReload={onReloadScheduledPlans}
      />

      <DataState
        loading={templates.loading}
        error={templates.error}
        empty={templateItems.length === 0}
        emptyText="暂无可用报表模板。"
        onRetry={onReloadTemplates}
      >
        <Card className="shell-card report-template-card" title="报表模板" extra={<Tag>模板驱动</Tag>}>
          <Space direction="vertical" size={12} className="full-width">
            <Select
              className="full-width"
              aria-label="报表模板"
              value={selectedTemplateId ?? undefined}
              placeholder="选择报表模板"
              options={templateItems.map((template) => ({
                label: `${template.name} / ${template.templateId}`,
                value: template.templateId,
              }))}
              onChange={onTemplateChange}
            />
            <Space size={8} wrap>
              {templateItems.map((template) => (
                <Tag key={template.templateId}>
                  {template.name} / {template.templateId}
                </Tag>
              ))}
            </Space>
            {selectedTemplate ? (
              <Typography.Text type="secondary">
                {selectedTemplate.description}
              </Typography.Text>
            ) : null}
          </Space>
        </Card>

        <Card className="shell-card report-filter-card" title="筛选条件" extra={<Tag>权限内统计</Tag>}>
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

const ScheduledReportPreviewPanel = ({
  plans,
  preview,
  email,
  selectedPlanId,
  onPlanChange,
  onPreview,
  onSendEmail,
  onReload,
}: {
  plans: Loadable<ScheduledReportPlan[]>;
  preview: Loadable<ScheduledReportPreviewResult>;
  email: Loadable<ScheduledReportEmailResult>;
  selectedPlanId: string | null;
  onPlanChange?: (planId: string) => void;
  onPreview?: () => void;
  onSendEmail?: () => void;
  onReload?: () => void;
}) => {
  const planItems = plans.data ?? [];
  const selectedPlan = planItems.find((plan) => plan.planId === selectedPlanId);

  return (
    <Card
      className="shell-card scheduled-report-card"
      title="定时报表预演"
      extra={<Tag color="blue">月 / 季 / 年计划</Tag>}
    >
      <DataState
        loading={plans.loading}
        error={plans.error}
        empty={planItems.length === 0}
        emptyText="暂无可用定时报表计划。"
        onRetry={onReload}
      >
        <Space direction="vertical" size={14} className="full-width">
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={14}>
              <FilterLabel label="报表计划">
                <Select
                  className="full-width"
                  aria-label="定时报表计划"
                  value={selectedPlanId ?? undefined}
                  placeholder="选择月报、季报或年报计划"
                  options={planItems.map((plan) => ({
                    label: `${formatScheduledCadenceLabel(plan.cadence)} · ${plan.name}`,
                    value: plan.planId,
                  }))}
                  onChange={onPlanChange}
                />
              </FilterLabel>
            </Col>
            <Col xs={24} lg={10}>
              <Space size={8} wrap className="report-action-row">
                <Button
                  onClick={onSendEmail}
                  loading={email.loading}
                  disabled={!selectedPlan}
                >
                  发送邮件推送
                </Button>
                <Button onClick={onReload} loading={plans.loading}>
                  刷新计划
                </Button>
                <Button
                  type="primary"
                  onClick={onPreview}
                  loading={preview.loading}
                  disabled={!selectedPlan}
                >
                  生成预演
                </Button>
              </Space>
            </Col>
          </Row>

          {selectedPlan ? (
            <div className="scheduled-report-summary">
              <Space size={8} wrap>
                <Tag color="geekblue">{formatScheduledCadenceLabel(selectedPlan.cadence)}</Tag>
                <Tag>报表类型：{formatScheduledTemplateLabel(selectedPlan.templateId)}</Tag>
                <Tag>接收范围：{formatScheduledRecipientScope(selectedPlan.recipientScope)}</Tag>
                <Tag>下次计划周期：{selectedPlan.nextPeriodLabel}</Tag>
                <Tag color="green">
                  站内信状态：{formatScheduledDeliveryLabel(selectedPlan.inAppDelivery)}
                </Tag>
                <Tag color="gold">
                  邮件通道：{formatScheduledDeliveryLabel(selectedPlan.emailDelivery)}
                </Tag>
              </Space>
            </div>
          ) : null}

          <DataState
            loading={preview.loading}
            error={preview.error}
            empty={!preview.data}
            emptyText="选择计划后点击生成预演，页面将展示报表摘要与站内信摘要。"
            onRetry={onPreview}
          >
            {preview.data ? (
              <Space direction="vertical" size={12} className="full-width">
                <Descriptions size="small" bordered column={1}>
                  <Descriptions.Item label="预演计划">
                    {preview.data.plan.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="生成时间">
                    {formatCustomReportDateTime(preview.data.generatedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="报表类型">
                    {preview.data.report.metadata.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="汇总行数">
                    {preview.data.report.rows.length}
                  </Descriptions.Item>
                  <Descriptions.Item label="站内信摘要">
                    {preview.data.delivery.inApp.content}
                  </Descriptions.Item>
                  <Descriptions.Item label="邮件通道预留">
                    {preview.data.delivery.email.message}
                  </Descriptions.Item>
                </Descriptions>
                <Space size={8} wrap>
                  {preview.data.caveats.map((caveat) => (
                    <Tag key={caveat} color="gold">
                      {caveat}
                    </Tag>
                  ))}
                </Space>
              </Space>
            ) : null}
          </DataState>

          <DataState
            loading={email.loading}
            error={email.error}
            empty={!email.data}
            emptyText="点击发送邮件推送后，这里展示真实发信通道或 dry-run 结果。"
            onRetry={onSendEmail}
          >
            {email.data ? (
              <Descriptions size="small" bordered column={1}>
                <Descriptions.Item label="邮件发送状态">
                  {formatScheduledEmailStatus(email.data.delivery.email.status)}
                </Descriptions.Item>
                <Descriptions.Item label="发送结果">
                  {email.data.delivery.email.message}
                </Descriptions.Item>
                <Descriptions.Item label="邮件适配器">
                  {email.data.delivery.email.adapter}
                </Descriptions.Item>
                <Descriptions.Item label="收件人">
                  {email.data.delivery.email.recipientMasks.join(", ") || "未解析到收件人"}
                </Descriptions.Item>
                <Descriptions.Item label="尝试次数">
                  {email.data.delivery.email.attemptCount}
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </DataState>
        </Space>
      </DataState>
    </Card>
  );
};

const CustomReportResult = ({
  report,
  rows,
  onRetry,
}: {
  report: Loadable<CustomReportRunResponse>;
  rows: CustomReportRow[];
  onRetry?: () => void;
}) => (
  <Card className="shell-card report-result-card" title="汇总结果" extra={<Tag>可导出</Tag>}>
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

export const formatScheduledCadenceLabel = (
  cadence: ScheduledReportPlan["cadence"],
): string => {
  if (cadence === "MONTHLY") {
    return "月报";
  }

  if (cadence === "QUARTERLY") {
    return "季报";
  }

  return "年报";
};

export const formatScheduledTemplateLabel = (
  templateId: ScheduledReportPlan["templateId"],
): string => {
  const labels: Record<ScheduledReportPlan["templateId"], string> = {
    "achievement-distribution": "成果分布",
    "achievement-trend": "成果趋势",
    "fee-risk-summary": "费用风险",
    "workflow-efficiency": "审批效率",
    "conversion-funnel": "成果转化",
  };

  return labels[templateId];
};

export const formatScheduledRecipientScope = (
  scope: ScheduledReportPlan["recipientScope"],
): string => {
  if (scope === "CURRENT_USER") {
    return "当前用户";
  }

  if (scope === "DEPARTMENT_MANAGERS") {
    return "部门负责人";
  }

  return "院级评审人员";
};

export const formatScheduledDeliveryLabel = (
  delivery: ScheduledReportPlan["inAppDelivery"] | ScheduledReportPlan["emailDelivery"],
): string => {
  if (delivery === "LOCAL_PREVIEW") {
    return "本地预演";
  }

  return "预留接口";
};

export const formatScheduledEmailStatus = (
  status: ScheduledReportEmailResult["delivery"]["email"]["status"],
): string => {
  const labels: Record<ScheduledReportEmailResult["delivery"]["email"]["status"], string> = {
    SENT: "已提交真实发信",
    DRY_RUN: "Dry-run 未真实外发",
    SUPPRESSED: "已抑制发送",
    FAILED: "发送失败",
    TEMPORARY_FAILURE: "临时失败",
    RATE_LIMITED: "服务限流",
  };

  return labels[status];
};

const normalizeError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "自定义报表请求失败",
    detail: sanitizeUnknownErrorDetail(error),
  };
};

const hasDemoUser = (demoUserId: string | null | undefined): demoUserId is string =>
  Boolean(demoUserId?.trim());
