import { isApiError, type ApiClient, type ApiError } from "./api-client";
import type {
  ReminderActionResult,
  ReminderCenterItem,
  ReminderCenterResponse,
  ReminderCenterSeverity,
  ReminderEscalationHistoryResponse,
  ReminderSlaFullScanResult,
  ReminderSlaPolicy,
  ReminderSlaPolicyUpdateInput,
  ReminderSlaProcessNextResult,
  ReminderSlaQueueResponse,
  ReminderSlaHealthStatus,
  ReminderSlaScanHealthResponse,
  ReminderSlaScanEnqueueInput,
  ReminderSlaScanEnqueueResult,
  ReminderSlaScanMetricsResponse,
  ReminderSlaScanRunsResponse,
  ReminderSlaScanResult,
} from "./types";

export const fetchReminderCenter = (
  apiClient: ApiClient,
): Promise<ReminderCenterResponse> => apiClient.get("/reminders/center");

export const fetchReminderSlaQueue = (
  apiClient: ApiClient,
): Promise<ReminderSlaQueueResponse> => apiClient.get("/reminders/sla-queue");

export const fetchReminderEscalationHistory = (
  apiClient: ApiClient,
  reminderTaskId: string,
): Promise<ReminderEscalationHistoryResponse> =>
  apiClient.get(
    `/reminders/${encodeURIComponent(reminderTaskId)}/escalation-history`,
  );

export const fetchReminderSlaPolicy = (
  apiClient: ApiClient,
): Promise<ReminderSlaPolicy> => apiClient.get("/reminders/sla-policy");

export const updateReminderSlaPolicy = (
  apiClient: ApiClient,
  payload: ReminderSlaPolicyUpdateInput,
): Promise<ReminderSlaPolicy> => {
  if (!apiClient.put) {
    throw new Error("API client does not support PUT requests.");
  }

  return apiClient.put("/reminders/sla-policy", payload);
};

export const runReminderSlaScan = (
  apiClient: ApiClient,
): Promise<ReminderSlaScanResult> => apiClient.post("/reminders/sla-scan/run");

export const runFullReminderSlaScan = (
  apiClient: ApiClient,
): Promise<ReminderSlaFullScanResult> =>
  apiClient.post("/reminders/sla-scan/run-all");

export const enqueueReminderSlaScan = (
  apiClient: ApiClient,
  payload: ReminderSlaScanEnqueueInput = {},
): Promise<ReminderSlaScanEnqueueResult> =>
  apiClient.post("/reminders/sla-scan/enqueue", payload);

export const processNextReminderSlaScan = (
  apiClient: ApiClient,
): Promise<ReminderSlaProcessNextResult> =>
  apiClient.post("/reminders/sla-scan/process-next");

export const fetchReminderSlaScanRuns = (
  apiClient: ApiClient,
): Promise<ReminderSlaScanRunsResponse> => apiClient.get("/reminders/sla-scan/runs");

export const fetchReminderSlaScanMetrics = (
  apiClient: ApiClient,
): Promise<ReminderSlaScanMetricsResponse> =>
  apiClient.get("/reminders/sla-scan/metrics");

export const fetchReminderSlaScanHealth = (
  apiClient: ApiClient,
): Promise<ReminderSlaScanHealthResponse> =>
  apiClient.get("/reminders/sla-scan/health");

export const confirmReminder = (
  apiClient: ApiClient,
  reminderTaskId: string,
): Promise<ReminderActionResult> =>
  apiClient.post(`/reminders/${encodeURIComponent(reminderTaskId)}/confirm`);

export const escalateReminder = (
  apiClient: ApiClient,
  reminderTaskId: string,
): Promise<ReminderActionResult> =>
  apiClient.post(`/reminders/${encodeURIComponent(reminderTaskId)}/escalate`);

export const escalateReminderToDepartment = (
  apiClient: ApiClient,
  reminderTaskId: string,
): Promise<ReminderActionResult> =>
  apiClient.post(
    `/reminders/${encodeURIComponent(reminderTaskId)}/escalate-to-department`,
  );

export const getReminderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PENDING: "待发送",
    SENT: "已发送",
    CONFIRMED: "已确认",
    CANCELLED: "已取消",
    FAILED: "发送失败",
  };

  return labels[status] ?? (status || "未知状态");
};

export const getReminderTypeLabel = (item: ReminderCenterItem): string =>
  item.itemType === "FEE_REMINDER" ? "费用提醒" : "审批待办";

export const getReminderSeverityColor = (
  severity: ReminderCenterSeverity,
): string => {
  const colors: Record<ReminderCenterSeverity, string> = {
    CRITICAL: "red",
    WARNING: "orange",
    INFO: "blue",
  };

  return colors[severity];
};

export const getEscalationBlockedReasonLabel = (reason?: string): string => {
  const labels: Record<string, string> = {
    RATE_LIMITED: "24 小时内已催办",
    TERMINAL_STATUS: "提醒已闭环",
    NOT_OVERDUE: "未逾期",
    NOT_APPLICABLE: "不适用",
  };

  return reason ? labels[reason] ?? reason : "";
};

export const getReminderGovernanceText = (item: ReminderCenterItem): string => {
  const parts = [
    item.lastSentAt ? `最近催办：${formatReminderDate(item.lastSentAt)}` : null,
    item.nextEscalationAvailableAt
      ? `下次可催办：${formatReminderDate(item.nextEscalationAvailableAt)}`
      : null,
    !item.canEscalate && item.escalationBlockedReason
      ? getEscalationBlockedReasonLabel(item.escalationBlockedReason)
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : item.governanceNote ?? "-";
};

export const getReminderSlaStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    OVERDUE: "已逾期",
    DUE_SOON: "处理中",
    PENDING: "待处理",
  };

  return labels[status] ?? status;
};

export const getEscalationTargetLabel = (target?: string | null): string => {
  const labels: Record<string, string> = {
    DEPARTMENT_ROLE: "部门角色",
    SELF_MVP_FALLBACK: "本人兜底",
    GLOBAL_ROLE: "系统角色",
  };

  return target ? labels[target] ?? target : "-";
};

export const formatReminderSlaPolicy = (policy: ReminderSlaPolicy): string =>
  `${policy.policyCode} / 冷却 ${policy.cooldownHours}h / ${policy.levels.length} 级升级`;

export const getReminderSlaScanRunStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    QUEUED: "排队中",
    RUNNING: "执行中",
    COMPLETED: "已完成",
    FAILED: "已失败",
    SKIPPED: "已跳过",
  };

  return labels[status] ?? status;
};

export const getReminderSlaTriggerTypeLabel = (triggerType?: string | null): string => {
  const labels: Record<string, string> = {
    MANUAL: "手动",
    SCHEDULED: "定时",
    API_QUEUE: "队列",
  };

  return triggerType ? labels[triggerType] ?? triggerType : "-";
};

export const formatReminderSlaScanRun = (
  run: ReminderSlaScanRunsResponse["items"][number],
): string =>
  `${getReminderSlaScanRunStatusLabel(run.status)} / ${run.scanScope} / ${getReminderSlaTriggerTypeLabel(run.triggerType)} / 尝试 ${run.attemptCount} / 扫描 ${run.scannedCount} / 升级 ${run.escalatedCount} / 跳过 ${run.skippedCount}`;

export const formatReminderSlaSuccessRate = (value: number): string =>
  `${Math.round(value * 100)}%`;

export const getReminderSlaHealthStatusLabel = (
  status: ReminderSlaHealthStatus | string,
): string => {
  const labels: Record<ReminderSlaHealthStatus, string> = {
    HEALTHY: "正常",
    WARNING: "预警",
    CRITICAL: "严重",
  };

  return labels[status as ReminderSlaHealthStatus] ?? status;
};

export const getReminderSlaHealthStatusColor = (
  status: ReminderSlaHealthStatus | string,
): string => {
  const colors: Record<ReminderSlaHealthStatus, string> = {
    HEALTHY: "green",
    WARNING: "orange",
    CRITICAL: "red",
  };

  return colors[status as ReminderSlaHealthStatus] ?? "default";
};

export const formatReminderDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const normalizeReminderError = (error: unknown): ApiError => {
  if (isApiError(error)) {
    return error;
  }

  return {
    kind: "unknown",
    message: "提醒操作失败",
  };
};
