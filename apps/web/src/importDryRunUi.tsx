import { Alert, Button, Card, Descriptions, Space, Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import type { ChangeEvent, ReactNode } from "react";
import type { ApiError } from "./api-client";

export const importDryRunCsvFileSizeLimitBytes = 1024 * 1024;

export type ImportDryRunIssueTone = "error" | "warning";

export type ImportDryRunIssueLike = {
  code: string;
  field: string;
  message: string;
};

export type ImportDryRunRowStatus = "VALID" | "WARNING" | "ERROR";

export type ImportDryRunColumnsMetadata = {
  required: string[];
  optional: string[];
  received: string[];
};

export type ImportDryRunCommonSummary = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
};

export type ImportDryRunResultShellData<TRow> = {
  importType: string;
  dryRun: boolean;
  file: {
    name: string;
    size: number;
    encoding: string;
  };
  columns: ImportDryRunColumnsMetadata;
  summary: ImportDryRunCommonSummary;
  rows: TRow[];
};

export type ImportDryRunSummaryItem = {
  label: ReactNode;
  value: ReactNode;
};

export const validateImportDryRunCsvFile = (
  file: Pick<File, "name" | "size" | "type">,
): string | null => {
  const fileName = file.name.trim().toLowerCase();

  if (!fileName.endsWith(".csv")) {
    return "Only .csv files are supported for this dry-run.";
  }

  if (file.size > importDryRunCsvFileSizeLimitBytes) {
    return "CSV file must be 1 MB or smaller.";
  }

  return null;
};

export const formatImportDryRunFileSize = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) {
    return "0 B";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const kilobytes = value / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
};

export const getImportDryRunStatusColor = (status: ImportDryRunRowStatus) => {
  if (status === "ERROR") {
    return "red";
  }
  if (status === "WARNING") {
    return "gold";
  }
  return "green";
};

export function ImportDryRunStatusTag({ status }: { status: ImportDryRunRowStatus }) {
  return <Tag color={getImportDryRunStatusColor(status)}>{status}</Tag>;
}

export function renderImportDryRunIssueList(
  issues: readonly ImportDryRunIssueLike[],
  tone: ImportDryRunIssueTone,
) {
  if (issues.length === 0) {
    return <Typography.Text type="secondary">None</Typography.Text>;
  }

  return (
    <Space direction="vertical" size={4}>
      {issues.map((issue, index) => (
        <span key={`${issue.field}-${issue.code}-${index}`}>
          <Tag color={tone === "error" ? "red" : "gold"}>{issue.code}</Tag>
          <Typography.Text>{`${issue.field}: ${issue.message}`}</Typography.Text>
        </span>
      ))}
    </Space>
  );
}

export function ImportDryRunPanelShell<TResult>({
  className,
  title,
  endpoint,
  noticeMessage,
  noticeDescription,
  fileAriaLabel,
  file,
  loading,
  error,
  result,
  emptyHint,
  onFileChange,
  onRunDryRun,
  renderResult,
  controlsDisabled = false,
  extraActions,
  afterResult,
}: {
  className: string;
  title: string;
  endpoint: string;
  noticeMessage: ReactNode;
  noticeDescription: ReactNode;
  fileAriaLabel: string;
  file: File | null;
  loading: boolean;
  error: ApiError | null;
  result: TResult | null;
  emptyHint: ReactNode;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRunDryRun: () => void;
  renderResult: (result: TResult) => ReactNode;
  controlsDisabled?: boolean;
  extraActions?: ReactNode;
  afterResult?: ReactNode;
}) {
  return (
    <Card className={className} title={title} extra={<Tag>{endpoint}</Tag>}>
      <Space direction="vertical" size={12} className="full-width">
        <Alert type="info" showIcon message={noticeMessage} description={noticeDescription} />
        <Space size={10} wrap>
          <input
            aria-label={fileAriaLabel}
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            disabled={controlsDisabled}
            onChange={onFileChange}
          />
          <Button
            type="primary"
            loading={loading}
            disabled={!file || loading || controlsDisabled}
            onClick={onRunDryRun}
          >
            Run dry-run
          </Button>
          {extraActions}
          <Tag color={file ? "processing" : "default"}>
            {file ? `${file.name} (${formatImportDryRunFileSize(file.size)})` : "No CSV selected"}
          </Tag>
        </Space>
        {!file && !result && !error ? (
          <Typography.Text type="secondary">{emptyHint}</Typography.Text>
        ) : null}
        {error ? (
          <Alert type="error" showIcon message={error.message} description={error.detail} />
        ) : null}
        {result ? renderResult(result) : null}
        {afterResult}
      </Space>
    </Card>
  );
}

export function ImportDryRunResultShell<TRow>({
  result,
  writeSafetyDescription,
  extraAlerts,
  summaryItems,
  tableColumns,
  tableScrollX,
  receivedColumnColor,
}: {
  result: ImportDryRunResultShellData<TRow>;
  writeSafetyDescription: string;
  extraAlerts?: ReactNode;
  summaryItems: ImportDryRunSummaryItem[];
  tableColumns: TableProps<TRow>["columns"];
  tableScrollX: number;
  receivedColumnColor?: (column: string) => string;
}) {
  return (
    <Space direction="vertical" size={12} className="full-width">
      <Alert
        type={result.summary.errorRows > 0 ? "warning" : "success"}
        showIcon
        message="Dry-run report ready"
        description={`importType=${result.importType}; dryRun=${String(result.dryRun)}; ${writeSafetyDescription}`}
      />
      {extraAlerts}
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
        <Descriptions.Item label="File">{result.file.name}</Descriptions.Item>
        <Descriptions.Item label="Size">
          {formatImportDryRunFileSize(result.file.size)}
        </Descriptions.Item>
        <Descriptions.Item label="Encoding">{result.file.encoding}</Descriptions.Item>
        <Descriptions.Item label="Total rows">{result.summary.totalRows}</Descriptions.Item>
        <Descriptions.Item label="Valid rows">{result.summary.validRows}</Descriptions.Item>
        <Descriptions.Item label="Error rows">{result.summary.errorRows}</Descriptions.Item>
        <Descriptions.Item label="Warning rows">{result.summary.warningRows}</Descriptions.Item>
        {summaryItems.map((item, index) => (
          <Descriptions.Item key={`${String(item.label)}-${index}`} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
      <Space size={[6, 6]} wrap>
        <Typography.Text strong>Required</Typography.Text>
        {result.columns.required.map((column) => (
          <Tag key={`required-${column}`} color="blue">
            {column}
          </Tag>
        ))}
        <Typography.Text strong>Optional</Typography.Text>
        {result.columns.optional.map((column) => (
          <Tag key={`optional-${column}`}>{column}</Tag>
        ))}
        <Typography.Text strong>Received</Typography.Text>
        {result.columns.received.map((column) => (
          <Tag key={`received-${column}`} color={receivedColumnColor?.(column) ?? "geekblue"}>
            {column}
          </Tag>
        ))}
      </Space>
      <Table<TRow>
        size="small"
        rowKey={(row) => String((row as { rowNumber: number }).rowNumber)}
        pagination={false}
        dataSource={result.rows}
        columns={tableColumns}
        scroll={{ x: tableScrollX }}
      />
    </Space>
  );
}
