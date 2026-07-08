import { Alert, Button, Card, Descriptions, Space, Table, Tag, Typography, message } from "antd";
import type { TableProps } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient, type ApiError } from "./api-client";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import { getDemoSafeErrorDetail, getDemoSafeErrorMessage } from "./error-display";
import {
  confirmReminder,
  enqueueReminderSlaScan,
  escalateReminder,
  escalateReminderToDepartment,
  fetchReminderCenter,
  fetchReminderEscalationHistory,
  fetchReminderSlaPolicy,
  fetchReminderSlaQueue,
  fetchReminderSlaScanHealth,
  fetchReminderSlaScanMetrics,
  fetchReminderSlaScanRuns,
  formatReminderSlaScanRun,
  formatReminderSlaSuccessRate,
  formatReminderSlaPolicy,
  formatReminderDate,
  getEscalationBlockedReasonLabel,
  getEscalationTargetLabel,
  getReminderGovernanceText,
  getReminderSeverityColor,
  getReminderSlaHealthStatusColor,
  getReminderSlaHealthStatusLabel,
  getReminderSlaScanRunStatusLabel,
  getReminderSlaStatusLabel,
  getReminderSlaTriggerTypeLabel,
  getReminderStatusLabel,
  getReminderTypeLabel,
  normalizeReminderError,
  processNextReminderSlaScan,
  runFullReminderSlaScan,
  runReminderSlaScan,
  updateReminderSlaPolicy,
} from "./reminder-center";
import type {
  ReminderCenterItem,
  ReminderCenterResponse,
  ReminderEscalationHistoryResponse,
  ReminderSlaPolicy,
  ReminderSlaQueueItem,
  ReminderSlaQueueResponse,
  ReminderSlaScanHealthResponse,
  ReminderSlaScanMetricsResponse,
  ReminderSlaScanRunsResponse,
  ReminderSlaScanResult,
} from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type RemindersProps = {
  demoUserId: string | null;
};

type ReminderAction = "confirm" | "escalate" | "escalate-to-department";

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

export function Reminders({ demoUserId }: RemindersProps) {
  const [center, setCenter] =
    useState<Loadable<ReminderCenterResponse>>(emptyLoadable);
  const [slaQueue, setSlaQueue] =
    useState<Loadable<ReminderSlaQueueResponse>>(emptyLoadable);
  const [history, setHistory] =
    useState<Loadable<ReminderEscalationHistoryResponse>>(emptyLoadable);
  const [slaPolicy, setSlaPolicy] =
    useState<Loadable<ReminderSlaPolicy>>(emptyLoadable);
  const [scanRuns, setScanRuns] =
    useState<Loadable<ReminderSlaScanRunsResponse>>(emptyLoadable);
  const [scanMetrics, setScanMetrics] =
    useState<Loadable<ReminderSlaScanMetricsResponse>>(emptyLoadable);
  const [scanHealth, setScanHealth] =
    useState<Loadable<ReminderSlaScanHealthResponse>>(emptyLoadable);
  const [scanResult, setScanResult] = useState<ReminderSlaScanResult | null>(null);
  const [operationError, setOperationError] = useState<ApiError | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);

  const loadCenter = useCallback(async () => {
    if (!demoUserId) {
      setCenter(emptyLoadable);
      setSlaQueue(emptyLoadable);
      setSlaPolicy(emptyLoadable);
      setScanRuns(emptyLoadable);
      setScanMetrics(emptyLoadable);
      setScanHealth(emptyLoadable);
      return;
    }

    setCenter({ loading: true, data: null, error: null });
    setSlaQueue({ loading: true, data: null, error: null });
    setSlaPolicy({ loading: true, data: null, error: null });
    setScanRuns({ loading: true, data: null, error: null });
    setScanMetrics({ loading: true, data: null, error: null });
    setScanHealth({ loading: true, data: null, error: null });
    try {
      const [data, queue, policy, runs, metrics, health] = await Promise.all([
        fetchReminderCenter(apiClient),
        fetchReminderSlaQueue(apiClient),
        fetchReminderSlaPolicy(apiClient),
        fetchReminderSlaScanRuns(apiClient),
        fetchReminderSlaScanMetrics(apiClient),
        fetchReminderSlaScanHealth(apiClient),
      ]);
      setCenter({ loading: false, data, error: null });
      setSlaQueue({ loading: false, data: queue, error: null });
      setSlaPolicy({ loading: false, data: policy, error: null });
      setScanRuns({ loading: false, data: runs, error: null });
      setScanMetrics({ loading: false, data: metrics, error: null });
      setScanHealth({ loading: false, data: health, error: null });
    } catch (error) {
      const normalizedError = normalizeReminderError(error);
      setCenter({
        loading: false,
        data: null,
        error: normalizedError,
      });
      setSlaQueue({ loading: false, data: null, error: normalizedError });
      setSlaPolicy({ loading: false, data: null, error: normalizedError });
      setScanRuns({ loading: false, data: null, error: normalizedError });
      setScanMetrics({ loading: false, data: null, error: normalizedError });
      setScanHealth({ loading: false, data: null, error: normalizedError });
    }
  }, [apiClient, demoUserId]);

  useEffect(() => {
    void loadCenter();
  }, [loadCenter]);

  useEffect(() => {
    if (!demoUserId) {
      setOperationError(null);
      setActingId(null);
    }
  }, [demoUserId]);

  useEffect(() => {
    const firstReminderId = center.data?.items.find(
      (item) => item.itemType === "FEE_REMINDER",
    )?.id;

    if (!demoUserId || !firstReminderId) {
      setHistory(emptyLoadable);
      return;
    }

    setHistory({ loading: true, data: null, error: null });
    fetchReminderEscalationHistory(apiClient, firstReminderId)
      .then((data) => setHistory({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setHistory({
          loading: false,
          data: null,
          error: normalizeReminderError(error),
        }),
      );
  }, [apiClient, center.data?.items, demoUserId]);

  const runSlaScan = useCallback(async () => {
    setActingId("sla-scan");
    setOperationError(null);

    try {
      const result = await runReminderSlaScan(apiClient);
      setScanResult(result);
      void message.success("SLA 扫描已完成");
      await loadCenter();
    } catch (error) {
      setOperationError(normalizeReminderError(error));
    } finally {
      setActingId(null);
    }
  }, [apiClient, loadCenter]);

  const runFullSlaScan = useCallback(async () => {
    setActingId("sla-scan-all");
    setOperationError(null);

    try {
      const result = await runFullReminderSlaScan(apiClient);
      setScanResult(result);
      void message.success("SLA 全量扫描已完成");
      await loadCenter();
    } catch (error) {
      setOperationError(normalizeReminderError(error));
    } finally {
      setActingId(null);
    }
  }, [apiClient, loadCenter]);

  const enqueueSlaScan = useCallback(async () => {
    setActingId("sla-scan-enqueue");
    setOperationError(null);

    try {
      const result = await enqueueReminderSlaScan(apiClient, {
        triggerType: "MANUAL",
      });
      void message.success(
        result.status === "EXISTING" ? "扫描任务已在队列中" : "扫描任务已加入队列",
      );
      await loadCenter();
    } catch (error) {
      setOperationError(normalizeReminderError(error));
    } finally {
      setActingId(null);
    }
  }, [apiClient, loadCenter]);

  const processNextSlaScan = useCallback(async () => {
    setActingId("sla-scan-process-next");
    setOperationError(null);

    try {
      const result = await processNextReminderSlaScan(apiClient);
      if (result.result) {
        setScanResult(result.result);
      }
      void message.success(
        result.status === "NO_TASK" ? "暂无待处理扫描任务" : "扫描队列处理完成",
      );
      await loadCenter();
    } catch (error) {
      setOperationError(normalizeReminderError(error));
    } finally {
      setActingId(null);
    }
  }, [apiClient, loadCenter]);

  const saveSlaPolicy = useCallback(async () => {
    if (!slaPolicy.data) {
      return;
    }

    setActingId("sla-policy-save");
    setOperationError(null);

    try {
      const policy = await updateReminderSlaPolicy(apiClient, slaPolicy.data);
      setSlaPolicy({ loading: false, data: policy, error: null });
      void message.success("SLA 策略已保存");
      await loadCenter();
    } catch (error) {
      setOperationError(normalizeReminderError(error));
    } finally {
      setActingId(null);
    }
  }, [apiClient, loadCenter, slaPolicy.data]);

  const runAction = useCallback(
    async (item: ReminderCenterItem, action: ReminderAction) => {
      setActingId(`${action}:${item.id}`);
      setOperationError(null);

      try {
        if (action === "confirm") {
          await confirmReminder(apiClient, item.id);
          void message.success("提醒已确认");
        } else if (action === "escalate") {
          await escalateReminder(apiClient, item.id);
          void message.success("催办已发送");
        } else {
          await escalateReminderToDepartment(apiClient, item.id);
          void message.success("升级催办已发送");
        }

        await loadCenter();
      } catch (error) {
        setOperationError(normalizeReminderError(error));
      } finally {
        setActingId(null);
      }
    },
    [apiClient, loadCenter],
  );

  const columns = useMemo(
    () => createReminderColumns(runAction, actingId),
    [actingId, runAction],
  );
  const items = center.data?.items ?? [];

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="提醒中心"
        description="集中查看费用提醒和我的审批待办，并完成确认或站内催办。"
        extra={<Button onClick={loadCenter}>刷新</Button>}
      />

      <PermissionHint description="提醒中心只展示当前业务用户可访问的安全摘要；附件原文、通知正文和内部审计明细不在此处展示。" />

      {center.data ? <ReminderSummary response={center.data} /> : null}

      {operationError ? (
        <Alert
          showIcon
          type="error"
          message={getDemoSafeErrorMessage(operationError)}
          description={getDemoSafeErrorDetail(operationError)}
        />
      ) : null}

      <Card
        className="shell-card"
        title="SLA 策略与扫描"
        extra={
          <Button onClick={runSlaScan} loading={actingId === "sla-scan"}>
            运行扫描
          </Button>
        }
      >
        <DataState
          loading={slaPolicy.loading}
          error={slaPolicy.error}
          empty={!slaPolicy.loading && !slaPolicy.error && !slaPolicy.data}
          emptyText="暂无 SLA 策略"
          onRetry={loadCenter}
        >
          <Space direction="vertical" size={8} className="full-width">
            <Typography.Text>
              {slaPolicy.data ? formatReminderSlaPolicy(slaPolicy.data) : "-"}
            </Typography.Text>
            <DataState
              loading={scanMetrics.loading}
              error={scanMetrics.error}
              empty={
                !scanMetrics.loading &&
                !scanMetrics.error &&
                !scanMetrics.data
              }
              emptyText="暂无扫描指标"
              onRetry={loadCenter}
            >
              <Descriptions bordered size="small" column={{ xs: 1, md: 4 }}>
                <Descriptions.Item label="样本数">
                  {scanMetrics.data?.sampleSize ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="排队">
                  {scanMetrics.data?.backlog.queuedCount ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="运行中">
                  {scanMetrics.data?.backlog.runningCount ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="成功率">
                  {formatReminderSlaSuccessRate(
                    scanMetrics.data?.totals.successRate ?? 0,
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="已完成">
                  {scanMetrics.data?.totals.completed ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="失败">
                  {scanMetrics.data?.totals.failed ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="升级数">
                  {scanMetrics.data?.totals.totalEscalated ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label="最早排队">
                  {formatReminderDate(scanMetrics.data?.backlog.oldestQueuedAt)}
                </Descriptions.Item>
              </Descriptions>
            </DataState>
            <DataState
              loading={scanHealth.loading}
              error={scanHealth.error}
              empty={
                !scanHealth.loading &&
                !scanHealth.error &&
                !scanHealth.data
              }
              emptyText="暂无健康状态"
              onRetry={loadCenter}
            >
              <Space direction="vertical" size={8} className="full-width">
                <Space size={8} wrap>
                  <Typography.Text strong>健康状态</Typography.Text>
                  <Tag
                    color={getReminderSlaHealthStatusColor(
                      scanHealth.data?.status ?? "HEALTHY",
                    )}
                  >
                    {getReminderSlaHealthStatusLabel(
                      scanHealth.data?.status ?? "HEALTHY",
                    )}
                  </Tag>
                </Space>
                {scanHealth.data?.reasons.length ? (
                  <Space direction="vertical" size={4}>
                    {scanHealth.data.reasons.map((reason) => (
                      <Typography.Text key={reason.code}>
                        {reason.code}：{reason.message}
                      </Typography.Text>
                    ))}
                  </Space>
                ) : (
                  <Typography.Text type="secondary">暂无告警原因</Typography.Text>
                )}
                {scanHealth.data?.recommendedActions.length ? (
                  <Space direction="vertical" size={4}>
                    {scanHealth.data.recommendedActions.map((action) => (
                      <Typography.Text key={action}>{action}</Typography.Text>
                    ))}
                  </Space>
                ) : null}
              </Space>
            </DataState>
            <Space size={8} wrap>
              <Button
                onClick={saveSlaPolicy}
                loading={actingId === "sla-policy-save"}
                disabled={!slaPolicy.data}
              >
                保存策略
              </Button>
              <Button
                onClick={runFullSlaScan}
                loading={actingId === "sla-scan-all"}
              >
                全量扫描
              </Button>
              <Button
                onClick={enqueueSlaScan}
                loading={actingId === "sla-scan-enqueue"}
              >
                加入扫描队列
              </Button>
              <Button
                onClick={processNextSlaScan}
                loading={actingId === "sla-scan-process-next"}
              >
                处理下一条任务
              </Button>
            </Space>
            <DataState
              loading={scanRuns.loading}
              error={scanRuns.error}
              empty={
                !scanRuns.loading &&
                !scanRuns.error &&
                (scanRuns.data?.items.length ?? 0) === 0
              }
              emptyText="暂无扫描执行记录"
              onRetry={loadCenter}
            >
              <Space direction="vertical" size={6} className="full-width">
                {(scanRuns.data?.items ?? []).slice(0, 5).map((run) => (
                  <div className="business-note" key={run.id}>
                    <Space size={6} wrap>
                      <Tag>{getReminderSlaScanRunStatusLabel(run.status)}</Tag>
                      <Tag>{getReminderSlaTriggerTypeLabel(run.triggerType)}</Tag>
                      <Typography.Text>{formatReminderSlaScanRun(run)}</Typography.Text>
                    </Space>
                    <Typography.Text type="secondary">
                      排队 {formatReminderDate(run.queuedAt)} / 开始 {formatReminderDate(run.startedAt)} / 完成 {formatReminderDate(run.completedAt)}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      尝试 {run.attemptCount} 次
                      {run.failureReason ? ` / ${run.failureReason}` : ""}
                    </Typography.Text>
                  </div>
                ))}
              </Space>
            </DataState>
            {scanResult ? (
              <Typography.Text type="secondary">
                扫描 {scanResult.scannedCount} 条，升级 {scanResult.escalatedCount} 条，跳过 {scanResult.skippedCount} 条
              </Typography.Text>
            ) : null}
          </Space>
        </DataState>
      </Card>

      <Card className="shell-card" title="待处理提醒">
        <DataState
          loading={center.loading}
          error={center.error}
          empty={!center.loading && !center.error && items.length === 0}
          emptyText="暂无待处理提醒"
          onRetry={loadCenter}
        >
          <Table<ReminderCenterItem>
            rowKey={(item) => `${item.itemType}:${item.id}`}
            columns={columns}
            dataSource={items}
            pagination={{ pageSize: 10 }}
          />
        </DataState>
      </Card>

      <Card className="shell-card" title="SLA 队列">
        <DataState
          loading={slaQueue.loading}
          error={slaQueue.error}
          empty={!slaQueue.loading && !slaQueue.error && (slaQueue.data?.items.length ?? 0) === 0}
          emptyText="暂无 SLA 队列项"
          onRetry={loadCenter}
        >
          <Table<ReminderSlaQueueItem>
            rowKey={(item) => `sla:${item.id}`}
            columns={createReminderSlaColumns()}
            dataSource={slaQueue.data?.items ?? []}
            pagination={{ pageSize: 5 }}
          />
        </DataState>
      </Card>

      <Card className="shell-card" title="最近升级历史">
        <DataState
          loading={history.loading}
          error={history.error}
          empty={!history.loading && !history.error && (history.data?.items.length ?? 0) === 0}
          emptyText="暂无升级历史"
        >
          <Space direction="vertical" size={8} className="full-width">
            {(history.data?.items ?? []).map((item) => (
              <div className="business-note" key={item.id}>
                <Space size={8} wrap>
                  <Tag>{item.operation}</Tag>
                  <Tag>{getEscalationTargetLabel(item.escalationTarget)}</Tag>
                  <Typography.Text type="secondary">
                    {formatReminderDate(item.createdAt)}
                  </Typography.Text>
                </Space>
                <Typography.Text type="secondary">
                  {item.resolverStrategy ?? "-"}
                </Typography.Text>
              </div>
            ))}
          </Space>
        </DataState>
      </Card>
    </Space>
  );
}

function ReminderSummary({ response }: { response: ReminderCenterResponse }) {
  return (
    <Card className="shell-card" title="闭环摘要">
      <Descriptions bordered size="small" column={{ xs: 1, md: 3 }}>
        <Descriptions.Item label="总数">{response.summary.total}</Descriptions.Item>
        <Descriptions.Item label="费用提醒">
          {response.summary.feeReminderCount}
        </Descriptions.Item>
        <Descriptions.Item label="审批待办">
          {response.summary.workflowTaskCount}
        </Descriptions.Item>
        <Descriptions.Item label="待发送">
          {response.summary.pendingCount}
        </Descriptions.Item>
        <Descriptions.Item label="已发送">
          {response.summary.sentCount}
        </Descriptions.Item>
        <Descriptions.Item label="可催办">
          {response.summary.escalationEligibleCount}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

const createReminderColumns = (
  onAction: (item: ReminderCenterItem, action: ReminderAction) => void,
  actingId: string | null,
): TableProps<ReminderCenterItem>["columns"] => [
  {
    title: "类型",
    dataIndex: "itemType",
    render: (_value, item) => (
      <Space size={8} wrap>
        <Tag color={getReminderSeverityColor(item.severity)}>
          {getReminderTypeLabel(item)}
        </Tag>
        <Tag>{getReminderStatusLabel(item.status)}</Tag>
      </Space>
    ),
  },
  {
    title: "事项",
    dataIndex: "title",
    render: (_value, item) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{item.title}</Typography.Text>
        <Typography.Text type="secondary">{item.description}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "目标",
    dataIndex: "targetId",
    render: (_value, item) => (
      <Space direction="vertical" size={2}>
        <Typography.Text>{item.targetType}</Typography.Text>
        <Typography.Text type="secondary" copyable>
          {item.targetId}
        </Typography.Text>
      </Space>
    ),
  },
  {
    title: "时间",
    dataIndex: "dueAt",
    render: (_value, item) => formatReminderDate(item.dueAt ?? item.remindDate),
  },
  {
    title: "治理",
    key: "governance",
    render: (_value, item) => (
      <Space direction="vertical" size={2}>
        <Typography.Text type="secondary">
          {getReminderGovernanceText(item)}
        </Typography.Text>
        {!item.canEscalate && item.escalationBlockedReason ? (
          <Tag>{getEscalationBlockedReasonLabel(item.escalationBlockedReason)}</Tag>
        ) : null}
      </Space>
    ),
  },
  {
    title: "操作",
    key: "actions",
    render: (_value, item) => (
      <Space size={8} wrap>
        {item.canConfirm ? (
          <Button
            size="small"
            onClick={() => onAction(item, "confirm")}
            loading={actingId === `confirm:${item.id}`}
          >
            确认
          </Button>
        ) : null}
        {item.canEscalate ? (
          <Button
            size="small"
            onClick={() => onAction(item, "escalate")}
            loading={actingId === `escalate:${item.id}`}
          >
            催办
          </Button>
        ) : null}
        {item.canEscalateToDepartment ? (
          <Button
            size="small"
            onClick={() => onAction(item, "escalate-to-department")}
            loading={actingId === `escalate-to-department:${item.id}`}
          >
            升级催办
          </Button>
        ) : null}
        {!item.canConfirm && !item.canEscalate && !item.canEscalateToDepartment ? (
          <Typography.Text type="secondary">无需操作</Typography.Text>
        ) : null}
      </Space>
    ),
  },
];

const createReminderSlaColumns = (): TableProps<ReminderSlaQueueItem>["columns"] => [
  {
    title: "SLA",
    dataIndex: "slaStatus",
    render: (_value, item) => <Tag>{getReminderSlaStatusLabel(item.slaStatus)}</Tag>,
  },
  {
    title: "事项",
    dataIndex: "title",
    render: (_value, item) => (
      <Space direction="vertical" size={2}>
        <Typography.Text strong>{item.title}</Typography.Text>
        <Typography.Text type="secondary">{item.description}</Typography.Text>
      </Space>
    ),
  },
  {
    title: "升级接收",
    dataIndex: "escalationTarget",
    render: (_value, item) => getEscalationTargetLabel(item.escalationTarget),
  },
  {
    title: "下次可催办",
    dataIndex: "nextEscalationAvailableAt",
    render: (_value, item) => formatReminderDate(item.nextEscalationAvailableAt),
  },
];
