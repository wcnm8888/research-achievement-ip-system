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
    return "仅支持上传 CSV 文件。";
  }

  if (file.size > importDryRunCsvFileSizeLimitBytes) {
    return "CSV 文件大小不能超过 1 MB。";
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
  const labelByStatus: Record<ImportDryRunRowStatus, string> = {
    VALID: "通过",
    WARNING: "需确认",
    ERROR: "有错误",
  };

  return <Tag color={getImportDryRunStatusColor(status)}>{labelByStatus[status]}</Tag>;
}

export function renderImportDryRunIssueList(
  issues: readonly ImportDryRunIssueLike[],
  tone: ImportDryRunIssueTone,
) {
  if (issues.length === 0) {
    return <Typography.Text type="secondary">无</Typography.Text>;
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
    <Card className={className} title={title}>
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
            开始预检
          </Button>
          {extraActions}
          <Tag color={file ? "processing" : "default"}>
            {file ? `${file.name} (${formatImportDryRunFileSize(file.size)})` : "未选择 CSV 文件"}
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
        message="预检报告已生成"
        description={writeSafetyDescription}
      />
      {extraAlerts}
      <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
        <Descriptions.Item label="文件">{result.file.name}</Descriptions.Item>
        <Descriptions.Item label="大小">
          {formatImportDryRunFileSize(result.file.size)}
        </Descriptions.Item>
        <Descriptions.Item label="编码">{result.file.encoding}</Descriptions.Item>
        <Descriptions.Item label="总行数">{result.summary.totalRows}</Descriptions.Item>
        <Descriptions.Item label="可导入行">{result.summary.validRows}</Descriptions.Item>
        <Descriptions.Item label="错误行">{result.summary.errorRows}</Descriptions.Item>
        <Descriptions.Item label="警告行">{result.summary.warningRows}</Descriptions.Item>
        {summaryItems.map((item, index) => (
          <Descriptions.Item key={`${String(item.label)}-${index}`} label={item.label}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
      <Space size={[6, 6]} wrap>
        <Typography.Text strong>必填列</Typography.Text>
        {result.columns.required.map((column) => (
          <Tag key={`required-${column}`} color="blue">
            {column}
          </Tag>
        ))}
        <Typography.Text strong>可选列</Typography.Text>
        {result.columns.optional.map((column) => (
          <Tag key={`optional-${column}`}>{column}</Tag>
        ))}
        <Typography.Text strong>已识别列</Typography.Text>
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
