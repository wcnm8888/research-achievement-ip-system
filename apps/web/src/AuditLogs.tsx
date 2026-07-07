import { Alert, Button, Card, Input, InputNumber, Select, Space, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createApiClient,
  isApiError,
  type ApiClient,
  type ApiError,
  type ApiQuery,
} from "./api-client";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { downloadCsvExport } from "./export-download";
import type {
  AuditActionCode,
  AuditLogListResult,
  AuditLogQuery,
  AuditTargetTypeCode,
  MaskedAuditLog,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type AuditLogsProps = {
  demoUserId: string | null;
};

export type AuditActionFilter = "ALL" | AuditActionCode;
export type AuditTargetTypeFilter = "ALL" | AuditTargetTypeCode;

export type AuditLogFilters = {
  action?: AuditActionFilter;
  targetType?: AuditTargetTypeFilter;
  targetId?: string;
  actorUserId?: string;
  traceId?: string;
  take?: number;
};

export type AuditLogQueryBuildResult =
  | {
      valid: true;
      filters: AuditLogFilters;
      query: AuditLogQuery;
    }
  | {
      valid: false;
      filters: AuditLogFilters;
      error: ApiError;
    };

export type AuditLogListStateKind = "loading" | "error" | "empty" | "ready";

export type AuditLogDisplayModel = {
  id: string;
  action: string;
  actionLabel: string;
  targetType: string;
  targetTypeLabel: string;
  targetId: string;
  actorUserId: string;
  traceId: string;
  createdAt: string;
  targetSecretLevel: string;
  oldValuePreview: string;
  newValuePreview: string;
  ipAddressMasked: string;
  userAgentMasked: string;
};

export const defaultAuditTake = 50;
export const maxAuditTake = 100;
export const maxAuditTraceIdLength = 120;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

const actionOptions: Array<{ label: string; value: AuditActionFilter }> = [
  { label: "全部动作", value: "ALL" },
  { label: "创建", value: "CREATE" },
  { label: "更新", value: "UPDATE" },
  { label: "提交", value: "SUBMIT" },
  { label: "审批通过", value: "APPROVE" },
  { label: "驳回", value: "REJECT" },
  { label: "归档", value: "ARCHIVE" },
  { label: "作废", value: "VOID" },
  { label: "上传附件", value: "UPLOAD_ATTACHMENT" },
  { label: "下载附件", value: "DOWNLOAD_ATTACHMENT" },
  { label: "标记缴费", value: "MARK_FEE_PAID" },
  { label: "确认提醒", value: "CONFIRM_REMINDER" },
  { label: "配置更新", value: "CONFIG_UPDATE" },
];

const targetTypeOptions: Array<{ label: string; value: AuditTargetTypeFilter }> = [
  { label: "全部对象", value: "ALL" },
  { label: "成果", value: "ACHIEVEMENT" },
  { label: "流程实例", value: "WORKFLOW_INSTANCE" },
  { label: "流程任务", value: "WORKFLOW_TASK" },
  { label: "流程动作", value: "WORKFLOW_ACTION" },
  { label: "附件", value: "ATTACHMENT" },
  { label: "费用记录", value: "FEE_RECORD" },
  { label: "提醒任务", value: "REMINDER_TASK" },
  { label: "通知", value: "NOTIFICATION" },
  { label: "系统配置", value: "SYSTEM_CONFIG" },
  { label: "审计日志", value: "AUDIT_LOG" },
];

const actionLabels = Object.fromEntries(
  actionOptions.filter((option) => option.value !== "ALL").map((option) => [option.value, option.label]),
) as Record<AuditActionCode, string>;

const targetTypeLabels = Object.fromEntries(
  targetTypeOptions
    .filter((option) => option.value !== "ALL")
    .map((option) => [option.value, option.label]),
) as Record<AuditTargetTypeCode, string>;

const defaultAuditFilters: AuditLogFilters = {
  action: "ALL",
  targetType: "ALL",
  take: defaultAuditTake,
};

export function AuditLogs({ demoUserId }: AuditLogsProps) {
  const [draftFilters, setDraftFilters] = useState<AuditLogFilters>(defaultAuditFilters);
  const [appliedFilters, setAppliedFilters] = useState<AuditLogFilters>(defaultAuditFilters);
  const [auditState, setAuditState] = useState<Loadable<AuditLogListResult>>(emptyLoadable);
  const [exportState, setExportState] = useState<{ loading: boolean; error: ApiError | null }>({
    loading: false,
    error: null,
  });
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);
  const queryResult = useMemo(() => buildAuditLogQueryResult(appliedFilters), [appliedFilters]);

  const loadAuditLogs = useCallback(() => {
    if (!hasDemoUser(demoUserId)) {
      setAuditState(emptyLoadable);
      return;
    }

    if (!queryResult.valid) {
      setAuditState({ loading: false, data: null, error: queryResult.error });
      return;
    }

    setAuditState({ loading: true, data: null, error: null });
    void fetchAuditLogs(apiClient, queryResult.query)
      .then((data) => setAuditState({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setAuditState({
          loading: false,
          data: null,
          error: mapAuditLogErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [apiClient, demoUserId, queryResult]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const applyFilters = () => {
    setAppliedFilters(trimAuditLogFilters(draftFilters));
  };

  const resetFilters = () => {
    setDraftFilters(defaultAuditFilters);
    setAppliedFilters(defaultAuditFilters);
  };

  const exportCsv = () => {
    setExportState({ loading: true, error: null });
    void exportAuditLogsCsv(apiClient, appliedFilters)
      .then(() => setExportState({ loading: false, error: null }))
      .catch((error: unknown) =>
        setExportState({
          loading: false,
          error: mapAuditLogErrorToDisplay(normalizeError(error)),
        }),
      );
  };

  if (!hasDemoUser(demoUserId)) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="审计日志"
          description="请选择业务用户后查看脱敏审计日志。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，审计日志页面不会加载业务数据。"
        />
        <BoundaryNotice
          title="请选择业务用户"
          description="选择有权限的用户后，可查看经脱敏处理的审计记录。"
          step="审计日志"
        />
      </Space>
    );
  }

  const stateKind = getAuditLogListState(auditState.loading, auditState.error, auditState.data);
  const items = auditState.data?.items ?? [];
  const filterSummary = buildAuditLogFilterSummary(appliedFilters);

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="审计日志"
        description="只读展示经脱敏处理的审计列表，权限和范围由系统统一控制。"
        extra={
          <Space size={8} wrap>
            <Button onClick={loadAuditLogs} loading={auditState.loading}>
              刷新
            </Button>
            <Button onClick={exportCsv} loading={exportState.loading}>
              导出 CSV
            </Button>
          </Space>
        }
      />

      <PermissionHint description="审计记录已脱敏展示，当前页面只提供只读查询。" />
      {exportState.error ? (
        <Typography.Text type="danger">{exportState.error.message}</Typography.Text>
      ) : null}

      <Card className="shell-card">
        <Space className="audit-filter-bar" size={12} wrap>
          <Select
            className="audit-filter-select"
            options={actionOptions}
            value={draftFilters.action ?? "ALL"}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, action: value }))
            }
          />
          <Select
            className="audit-filter-select"
            options={targetTypeOptions}
            value={draftFilters.targetType ?? "ALL"}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, targetType: value }))
            }
          />
          <Input
            allowClear
            className="audit-uuid-input"
            placeholder="对象 ID（UUID）"
            value={draftFilters.targetId}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, targetId: event.target.value }))
            }
          />
          <Input
            allowClear
            className="audit-uuid-input"
            placeholder="操作人 ID（UUID）"
            value={draftFilters.actorUserId}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, actorUserId: event.target.value }))
            }
          />
          <Input
            allowClear
            className="audit-trace-input"
            maxLength={maxAuditTraceIdLength + 1}
            placeholder="Trace ID"
            value={draftFilters.traceId}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, traceId: event.target.value }))
            }
          />
          <InputNumber
            className="audit-take-input"
            min={1}
            max={maxAuditTake}
            precision={0}
            value={draftFilters.take ?? defaultAuditTake}
            onChange={(value) =>
              setDraftFilters((current) => ({
                ...current,
                take: typeof value === "number" ? value : undefined,
              }))
            }
          />
          <Button type="primary" onClick={applyFilters}>
            查询
          </Button>
          <Button onClick={resetFilters}>重置</Button>
          <Button onClick={loadAuditLogs}>刷新</Button>
          <Tag color="gold">脱敏展示</Tag>
          <Tag>最多 100 条</Tag>
        </Space>
        {!queryResult.valid ? (
          <Alert
            className="audit-validation-alert"
            showIcon
            type="warning"
            message={queryResult.error.message}
            description={queryResult.error.detail}
          />
        ) : null}
      </Card>

      <Card
        className="shell-card"
        title="审计日志列表"
        extra={
          <Space size={8} wrap>
            <Tag color={stateKind === "ready" ? "blue" : "default"}>{items.length} 条</Tag>
            <Tag color="gold">脱敏审计权限</Tag>
          </Space>
        }
      >
        <AuditSummaryPanel filters={filterSummary} count={items.length} />
        <DataState
          loading={auditState.loading}
          error={auditState.error}
          empty={stateKind === "empty"}
          emptyText="暂无可展示的脱敏审计日志"
          onRetry={loadAuditLogs}
        >
          <AuditLogList items={items} />
        </DataState>
      </Card>
    </Space>
  );
}

export const buildAuditLogQueryResult = (
  filters: AuditLogFilters,
): AuditLogQueryBuildResult => {
  const trimmed = trimAuditLogFilters(filters);

  if (trimmed.targetId && !isUuid(trimmed.targetId)) {
    return {
      valid: false,
      filters: trimmed,
      error: createInvalidUuidError("对象 ID", trimmed.targetId),
    };
  }

  if (trimmed.actorUserId && !isUuid(trimmed.actorUserId)) {
    return {
      valid: false,
      filters: trimmed,
      error: createInvalidUuidError("操作人 ID", trimmed.actorUserId),
    };
  }

  if (trimmed.traceId && trimmed.traceId.length > maxAuditTraceIdLength) {
    return {
      valid: false,
      filters: trimmed,
      error: {
        kind: "bad-request",
        status: 400,
        message: "Trace ID 不能超过 120 个字符",
        detail: `当前长度：${trimmed.traceId.length}`,
      },
    };
  }

  if (!isValidAuditTake(trimmed.take)) {
    return {
      valid: false,
      filters: trimmed,
      error: {
        kind: "bad-request",
        status: 400,
        message: "审计日志数量范围必须是 1-100",
        detail: `当前输入：${String(trimmed.take)}`,
      },
    };
  }

  return {
    valid: true,
    filters: trimmed,
    query: toAuditLogQuery(trimmed),
  };
};

export const buildAuditLogQuery = (filters: AuditLogFilters): AuditLogQuery => {
  const result = buildAuditLogQueryResult(filters);

  return result.valid ? result.query : toAuditLogQuery(result.filters);
};

export const fetchAuditLogs = async (
  client: ApiClient,
  query: AuditLogQuery,
): Promise<AuditLogListResult> => {
  const result = await client.get<Partial<AuditLogListResult>>("/audit-logs", query);
  const items = Array.isArray(result.items)
    ? result.items.map(toMaskedAuditLog).filter((item): item is MaskedAuditLog => item !== null)
    : [];

  return { items };
};

export const loadAuditLogsForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  query: AuditLogQuery,
): Promise<AuditLogListResult | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  return fetchAuditLogs(client, query);
};

export const loadValidatedAuditLogsForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  filters: AuditLogFilters,
): Promise<AuditLogListResult | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  const result = buildAuditLogQueryResult(filters);

  if (!result.valid) {
    throw result.error;
  }

  return fetchAuditLogs(client, result.query);
};

export const exportAuditLogsCsv = async (
  client: Pick<ApiClient, "downloadBlob">,
  filters: AuditLogFilters,
): Promise<void> => {
  const result = buildAuditLogQueryResult(filters);

  if (!result.valid) {
    throw result.error;
  }

  await downloadCsvExport(
    client,
    "/audit-logs/export.csv",
    result.query as ApiQuery,
    "audit-logs.csv",
  );
};

export const getAuditLogListState = (
  loading: boolean,
  error: ApiError | null,
  result: AuditLogListResult | null,
): AuditLogListStateKind => {
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

export const mapAuditLogErrorToDisplay = (error: ApiError): ApiError => {
  if (error.status === 401 || error.kind === "unauthorized") {
    return { ...error, message: "请选择或切换业务用户" };
  }

  if (error.status === 403 || error.kind === "forbidden") {
    return { ...error, message: "当前角色无审计日志读取权限" };
  }

  if (error.status === 400 || error.kind === "bad-request") {
    return { ...error, message: "审计日志筛选条件格式不正确" };
  }

  if (error.status !== undefined && error.status >= 500) {
    return { ...error, message: "审计日志服务暂不可用" };
  }

  if (error.kind === "network") {
    return { ...error, message: "无法连接审计日志服务" };
  }

  return error;
};

export const buildAuditDisplayModel = (log: MaskedAuditLog): AuditLogDisplayModel => ({
  id: log.id,
  action: log.action,
  actionLabel: getActionLabel(log.action),
  targetType: log.targetType,
  targetTypeLabel: getTargetTypeLabel(log.targetType),
  targetId: formatMissing(log.targetId),
  actorUserId: formatMissing(log.actorUserId),
  traceId: formatMissing(log.traceId),
  createdAt: formatDateTime(log.createdAt),
  targetSecretLevel: formatMissing(log.targetSecretLevel),
  oldValuePreview: formatMaskedValue(log.oldValueMasked),
  newValuePreview: formatMaskedValue(log.newValueMasked),
  ipAddressMasked: formatMissing(log.ipAddressMasked),
  userAgentMasked: formatMissing(log.userAgentMasked),
});

export const formatMaskedValue = (value: unknown): string => {
  const sanitized = sanitizeMaskedValue(value);

  if (sanitized === undefined || sanitized === null) {
    return "未返回";
  }

  if (typeof sanitized === "string") {
    return sanitized;
  }

  try {
    return JSON.stringify(sanitized, null, 2);
  } catch {
    return "[UNSERIALIZABLE_MASKED_VALUE]";
  }
};

export const buildAuditLogFilterSummary = (filters: AuditLogFilters): string[] => {
  const trimmed = trimAuditLogFilters(filters);

  return [
    `动作：${trimmed.action && trimmed.action !== "ALL" ? getActionLabel(trimmed.action) : "全部"}`,
    `对象：${
      trimmed.targetType && trimmed.targetType !== "ALL"
        ? getTargetTypeLabel(trimmed.targetType)
        : "全部"
    }`,
    trimmed.targetId ? `对象 ID：${trimmed.targetId}` : null,
    trimmed.actorUserId ? `操作人：${trimmed.actorUserId}` : null,
    trimmed.traceId ? `Trace：${trimmed.traceId}` : null,
    `数量：${trimmed.take ?? defaultAuditTake}`,
  ].filter((item): item is string => Boolean(item));
};

export const getStep18BReadOnlyBoundary = () => ({
  endpoint: "/audit-logs",
  method: "GET",
  permission: "audit:read_masked",
  allowedFilters: ["action", "targetType", "targetId", "actorUserId", "traceId", "take"],
  unavailableFeatures: [
    "未脱敏查看或导出",
    "写入",
    "附件能力",
    "系统配置",
    "真实费用写入",
    "本地数据重置或清理",
  ],
});

const AuditSummaryPanel = ({ filters, count }: { filters: string[]; count: number }) => (
  <div className="audit-summary-panel">
    <div className="audit-summary-count">
      <Typography.Text type="secondary">当前返回</Typography.Text>
      <Typography.Text strong>{count} 条脱敏记录</Typography.Text>
    </div>
    <div className="audit-filter-summary">
      <Typography.Text type="secondary">当前筛选</Typography.Text>
      <Space size={6} wrap>
        {filters.map((filter) => (
          <Tag key={filter}>{filter}</Tag>
        ))}
      </Space>
    </div>
  </div>
);

const AuditLogList = ({ items }: { items: MaskedAuditLog[] }) => (
  <div className="audit-log-list">
    {items.map((item) => (
      <AuditLogCard key={item.id} log={item} />
    ))}
  </div>
);

const AuditLogCard = ({ log }: { log: MaskedAuditLog }) => {
  const display = buildAuditDisplayModel(log);

  return (
    <article className="audit-log-card">
      <div className="audit-log-main">
        <Space size={8} wrap>
          <Tag color="blue">{display.actionLabel}</Tag>
          <Tag>{display.targetTypeLabel}</Tag>
          <Tag color="gold">已脱敏</Tag>
        </Space>
        <Typography.Title level={5}>{display.id}</Typography.Title>
        <div className="audit-meta-grid">
          <MetaLine label="操作人" value={display.actorUserId} />
          <MetaLine label="对象 ID" value={display.targetId} />
          <MetaLine label="链路标识" value={display.traceId} />
          <MetaLine label="时间" value={display.createdAt} />
          <MetaLine label="密级" value={display.targetSecretLevel} />
          <MetaLine label="IP" value={display.ipAddressMasked} />
          <MetaLine label="UA" value={display.userAgentMasked} />
        </div>
      </div>
      <div className="audit-masked-values">
        <MaskedValueBlock title="变更前脱敏摘要" value={display.oldValuePreview} />
        <MaskedValueBlock title="变更后脱敏摘要" value={display.newValuePreview} />
      </div>
    </article>
  );
};

const MetaLine = ({ label, value }: { label: string; value: string }) => (
  <div className="audit-meta-line">
    <Typography.Text type="secondary">{label}</Typography.Text>
    <Typography.Text ellipsis>{value}</Typography.Text>
  </div>
);

const MaskedValueBlock = ({ title, value }: { title: string; value: string }) => (
  <div className="audit-masked-block">
    <Typography.Text strong>{title}</Typography.Text>
    <pre>{value}</pre>
  </div>
);

const trimAuditLogFilters = (filters: AuditLogFilters): AuditLogFilters => {
  const targetId = filters.targetId?.trim();
  const actorUserId = filters.actorUserId?.trim();
  const traceId = filters.traceId?.trim();

  return {
    action: filters.action ?? "ALL",
    targetType: filters.targetType ?? "ALL",
    targetId: targetId || undefined,
    actorUserId: actorUserId || undefined,
    traceId: traceId || undefined,
    take: filters.take ?? defaultAuditTake,
  };
};

const toAuditLogQuery = (filters: AuditLogFilters): AuditLogQuery => {
  const trimmed = trimAuditLogFilters(filters);

  return {
    action: trimmed.action && trimmed.action !== "ALL" ? trimmed.action : undefined,
    targetType:
      trimmed.targetType && trimmed.targetType !== "ALL" ? trimmed.targetType : undefined,
    targetId: trimmed.targetId,
    actorUserId: trimmed.actorUserId,
    traceId: trimmed.traceId,
    take: trimmed.take,
  };
};

const toMaskedAuditLog = (value: unknown): MaskedAuditLog | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = readString(record.id);
  const action = readString(record.action);
  const targetType = readString(record.targetType);
  const createdAt = readString(record.createdAt);

  if (!id || !action || !targetType || !createdAt) {
    return null;
  }

  return {
    id,
    action,
    targetType,
    createdAt,
    actorUserId: readNullableString(record.actorUserId),
    actorDepartmentId: readNullableString(record.actorDepartmentId),
    targetId: readNullableString(record.targetId),
    targetDepartmentId: readNullableString(record.targetDepartmentId),
    targetSecretLevel: readNullableString(record.targetSecretLevel),
    traceId: readNullableString(record.traceId),
    oldValueMasked: record.oldValueMasked,
    newValueMasked: record.newValueMasked,
    ipAddressMasked: readOptionalString(record.ipAddressMasked),
    userAgentMasked: readOptionalString(record.userAgentMasked),
  };
};

const sanitizeMaskedValue = (value: unknown, key: string | null = null): unknown => {
  if (value === null || value === undefined) {
    return "未返回";
  }

  if (isSensitiveKey(key)) {
    return "[REDACTED_SENSITIVE]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMaskedValue(item, key));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeMaskedValue(entryValue, entryKey),
      ]),
    );
  }

  return value;
};

const isSensitiveKey = (key: string | null): boolean => {
  if (!key) {
    return false;
  }

  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (normalizedKey === "secretlevel" || normalizedKey === "targetsecretlevel") {
    return false;
  }

  return [
    "password",
    "passwordhash",
    "token",
    "cookie",
    "apikey",
    "api_key",
    "secret",
    "credential",
    "storagekey",
    "checksum",
    "connection",
    "databaseurl",
    "authorization",
    "configref",
  ].some((pattern) => normalizedKey.includes(pattern));
};

const createInvalidUuidError = (label: string, value: string): ApiError => ({
  kind: "bad-request",
  status: 400,
  message: `${label} 必须是 UUID`,
  detail: `当前输入：${value}`,
});

const isValidAuditTake = (take: number | undefined): boolean =>
  typeof take === "number" && Number.isInteger(take) && take >= 1 && take <= maxAuditTake;

const isUuid = (value: string): boolean => uuidPattern.test(value);

const hasDemoUser = (demoUserId: string | null): boolean => Boolean(demoUserId?.trim());

const getActionLabel = (value: string): string =>
  actionLabels[value as AuditActionCode] ?? value;

const getTargetTypeLabel = (value: string): string =>
  targetTypeLabels[value as AuditTargetTypeCode] ?? value;

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

const formatMissing = (value: string | null | undefined): string => value?.trim() || "未返回";

const readString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const readOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const readNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  return readOptionalString(value);
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
