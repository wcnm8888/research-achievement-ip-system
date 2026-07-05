import { Button, Card, Col, Row, Segmented, Space, Statistic, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient, isApiError, type ApiClient, type ApiError } from "./api-client";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import type { DashboardBucket, DashboardSummary } from "./types";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type DashboardProps = {
  demoUserId: string | null;
};

export type DashboardBasicMetrics = {
  achievementTotal: number;
  conversionTotal: number;
  conversionContractTotal: string;
  conversionRevenueTotal: string;
  overdueFees: number;
  dueSoonFees: number;
  pendingWorkflowTasks: number;
  pendingReminders: number;
};

export type DashboardDueSoonDays = (typeof allowedDashboardDueSoonDays)[number];

export type DashboardDistributionItem = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type DashboardDistributionSection = {
  title: string;
  metricKey: string;
  items: DashboardDistributionItem[];
};

export const allowedDashboardDueSoonDays = [7, 30, 90] as const;
const defaultDashboardDueSoonDays: DashboardDueSoonDays = 30;

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

export function Dashboard({ demoUserId }: DashboardProps) {
  const [dashboard, setDashboard] = useState<Loadable<DashboardSummary>>(emptyLoadable);
  const [dueSoonDays, setDueSoonDays] = useState<DashboardDueSoonDays>(
    defaultDashboardDueSoonDays,
  );
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);

  const loadDashboard = useCallback(() => {
    if (!hasDemoUser(demoUserId)) {
      setDashboard(emptyLoadable);
      return;
    }

    setDashboard({ loading: true, data: null, error: null });
    void loadDashboardSummaryForDemoUser(apiClient, demoUserId, dueSoonDays)
      .then((data) => setDashboard({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setDashboard({
          loading: false,
          data: null,
          error: mapDashboardErrorToDisplay(normalizeError(error)),
        }),
      );
  }, [apiClient, demoUserId, dueSoonDays]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!hasDemoUser(demoUserId)) {
    return (
      <Space direction="vertical" size={16} className="page-stack">
        <SectionHeader
          title="统计看板"
          description="请选择本地演示用户后读取后端 dashboard summary。"
        />
        <PermissionHint description="当前没有 X-Demo-User-Id，统计看板不会发起业务请求。选择或输入演示用户后，只读请求会统一带上本地演示上下文 header；这不是正式 SSO。" />
        <Card className="shell-card">
          <Space direction="vertical" size={8}>
            <Typography.Text strong>等待演示上下文</Typography.Text>
            <Typography.Text type="secondary">
              Step 17 只读统计看板前端闭环要求没有演示用户时不调用 GET /dashboard/summary。
            </Typography.Text>
            <Typography.Text type="secondary">
              选择演示用户后，页面只读取 dashboard summary 的基础摘要和现有 buckets。
            </Typography.Text>
          </Space>
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack">
      <SectionHeader
        title="统计看板"
        description="Step 17 只读展示 dashboard summary 的 count 与 bucket 指标；权限裁剪以后端策略为准。"
        extra={
          <Button onClick={loadDashboard} loading={dashboard.loading}>
            刷新
          </Button>
        }
      />

      <PermissionHint description="Step 17 当前页面仅使用 GET /dashboard/summary 返回的 count/bucket 指标，不实现年度趋势、部门排行、金额汇总、专利法律状态专项统计、钻取详情、导出、缓存、完整报表平台、审计日志或系统配置。" />

      <DashboardControls dueSoonDays={dueSoonDays} onDueSoonDaysChange={setDueSoonDays} />

      <DashboardSummaryCard dashboard={dashboard} dueSoonDays={dueSoonDays} onRetry={loadDashboard} />
    </Space>
  );
}

export const loadDashboardSummaryForDemoUser = async (
  client: ApiClient,
  demoUserId: string | null,
  dueSoonDays: number = defaultDashboardDueSoonDays,
): Promise<DashboardSummary | null> => {
  if (!hasDemoUser(demoUserId)) {
    return null;
  }

  return client.get<DashboardSummary>("/dashboard/summary", buildDashboardSummaryQuery(dueSoonDays));
};

export const buildDashboardSummaryQuery = (
  dueSoonDays: number = defaultDashboardDueSoonDays,
): { dueSoonDays: DashboardDueSoonDays } => ({
  dueSoonDays: normalizeDashboardDueSoonDays(dueSoonDays),
});

export const normalizeDashboardDueSoonDays = (value: number): DashboardDueSoonDays => {
  const allowedValues: readonly number[] = allowedDashboardDueSoonDays;
  return allowedValues.includes(value) ? (value as DashboardDueSoonDays) : defaultDashboardDueSoonDays;
};

export const extractDashboardBasicMetrics = (
  summary: DashboardSummary | null | undefined,
): DashboardBasicMetrics => ({
  achievementTotal: summary?.achievement.total.value.count ?? 0,
  conversionTotal: summary?.conversion.total.value.count ?? 0,
  conversionContractTotal: summary?.conversion.totals.value.contractTotal ?? "0.00",
  conversionRevenueTotal: summary?.conversion.totals.value.revenueTotal ?? "0.00",
  overdueFees: summary?.fee.deadline.value.overdue.count ?? 0,
  dueSoonFees: summary?.fee.deadline.value.dueSoon.count ?? 0,
  pendingWorkflowTasks: countDashboardBucket(
    summary?.workflowTasks.byStatus.value.buckets,
    "PENDING",
  ),
  pendingReminders: countDashboardBucket(
    summary?.reminderTasks.byStatus.value.buckets,
    "PENDING",
  ),
});

export const countDashboardBucket = (
  buckets: DashboardBucket[] | undefined,
  key: string,
): number => buckets?.find((bucket) => bucket.key === key)?.count ?? 0;

export const buildDashboardDistributionItems = (
  buckets: DashboardBucket[] | undefined,
  labelMap: Record<string, string>,
): DashboardDistributionItem[] => {
  const validBuckets = (buckets ?? []).filter((bucket) => bucket.count > 0);
  const total = validBuckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return validBuckets.map((bucket) => ({
    key: bucket.key,
    label: labelMap[bucket.key] ?? bucket.key,
    count: bucket.count,
    percent: total > 0 ? Math.round((bucket.count / total) * 100) : 0,
  }));
};

export const buildDashboardDistributionSections = (
  summary: DashboardSummary | null | undefined,
): DashboardDistributionSection[] => [
  {
    title: "成果类型分布",
    metricKey: summary?.achievement.byType.key ?? "ACHIEVEMENT_TYPE_DISTRIBUTION",
    items: buildDashboardDistributionItems(
      summary?.achievement.byType.value.buckets,
      achievementTypeLabels,
    ),
  },
  {
    title: "成果状态分布",
    metricKey: summary?.achievement.byStatus.key ?? "ACHIEVEMENT_STATUS_DISTRIBUTION",
    items: buildDashboardDistributionItems(
      summary?.achievement.byStatus.value.buckets,
      achievementStatusLabels,
    ),
  },
  {
    title: "Conversion funnel",
    metricKey: summary?.conversion.funnel.key ?? "CONVERSION_STATUS_FUNNEL",
    items: buildDashboardDistributionItems(
      summary?.conversion.funnel.value.buckets,
      conversionStatusLabels,
    ),
  },
  {
    title: "费用缴费状态",
    metricKey: summary?.fee.byPayStatus.key ?? "FEE_PAY_STATUS_DISTRIBUTION",
    items: buildDashboardDistributionItems(summary?.fee.byPayStatus.value.buckets, payStatusLabels),
  },
  {
    title: "审批任务状态",
    metricKey: summary?.workflowTasks.byStatus.key ?? "WORKFLOW_TASK_STATUS_OVERVIEW",
    items: buildDashboardDistributionItems(
      summary?.workflowTasks.byStatus.value.buckets,
      workflowTaskStatusLabels,
    ),
  },
  {
    title: "提醒任务状态",
    metricKey: summary?.reminderTasks.byStatus.key ?? "REMINDER_TASK_STATUS_OVERVIEW",
    items: buildDashboardDistributionItems(
      summary?.reminderTasks.byStatus.value.buckets,
      reminderTaskStatusLabels,
    ),
  },
];

export const formatDashboardDateTime = (value: string | undefined): string => {
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

export const mapDashboardErrorToDisplay = (error: ApiError): ApiError => {
  if (error.kind === "forbidden") {
    return { ...error, message: "当前角色无统计看板权限" };
  }

  if (error.kind === "bad-request") {
    return { ...error, message: "统计看板参数不正确" };
  }

  if (error.kind === "server") {
    return { ...error, message: "统计看板服务暂不可用" };
  }

  if (error.kind === "network") {
    return { ...error, message: "无法连接统计看板服务" };
  }

  return error;
};

export const getStep17AReadOnlyBoundary = () => ({
  endpoint: "/dashboard/summary",
  method: "GET",
  allowedDueSoonDays: [...allowedDashboardDueSoonDays],
  defaultQuery: { dueSoonDays: defaultDashboardDueSoonDays },
  unavailableMetrics: ["年度趋势", "部门排行", "金额汇总", "专利法律状态专项统计"],
});

export const getStep17BReadOnlyBoundary = () => ({
  endpoint: "/dashboard/summary",
  method: "GET",
  allowedDueSoonDays: [...allowedDashboardDueSoonDays],
  excludedQuery: ["today"],
  unavailableMetrics: [
    "年度趋势",
    "部门排行",
    "金额汇总",
    "专利法律状态专项统计",
    "钻取详情",
    "导出",
    "缓存",
    "完整报表平台",
  ],
});

export const getStep17ReadOnlyBoundary = () => ({
  endpoint: "/dashboard/summary",
  method: "GET",
  allowedDueSoonDays: [...allowedDashboardDueSoonDays],
  defaultQuery: { dueSoonDays: defaultDashboardDueSoonDays },
  excludedQuery: ["today"],
  unavailableMetrics: [
    "年度趋势",
    "部门排行",
    "金额汇总",
    "专利法律状态专项统计",
    "钻取详情",
    "导出",
    "缓存",
    "完整报表平台",
  ],
});

const DashboardControls = ({
  dueSoonDays,
  onDueSoonDaysChange,
}: {
  dueSoonDays: DashboardDueSoonDays;
  onDueSoonDaysChange: (value: DashboardDueSoonDays) => void;
}) => (
  <Card className="shell-card dashboard-control-card">
    <Space direction="vertical" size={8}>
      <Typography.Text strong>到期窗口</Typography.Text>
      <Segmented
        value={dueSoonDays}
        options={allowedDashboardDueSoonDays.map((value) => ({
          label: `${value} 天`,
          value,
        }))}
        onChange={(value) => onDueSoonDaysChange(normalizeDashboardDueSoonDays(Number(value)))}
      />
      <Typography.Text type="secondary">
        仅控制 dashboard summary 的 dueSoonDays 参数；Step 17 不提供 today 自定义输入。
      </Typography.Text>
    </Space>
  </Card>
);

const DashboardSummaryCard = ({
  dashboard,
  dueSoonDays,
  onRetry,
}: {
  dashboard: Loadable<DashboardSummary>;
  dueSoonDays: DashboardDueSoonDays;
  onRetry: () => void;
}) => {
  const summary = dashboard.data;
  const metrics = extractDashboardBasicMetrics(summary);
  const distributionSections = buildDashboardDistributionSections(summary);

  return (
    <Card
      className="shell-card"
      title="基础摘要"
      extra={
        <Space size={8} wrap>
          <Tag color="processing">GET /dashboard/summary</Tag>
          <Tag>{dueSoonDays} 天</Tag>
        </Space>
      }
    >
      <DataState
        loading={dashboard.loading}
        error={dashboard.error}
        empty={!summary}
        emptyText="暂无统计摘要"
        onRetry={onRetry}
      >
        <Row gutter={[16, 16]} className="dashboard-metric-grid">
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="成果总量" value={metrics.achievementTotal} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="Conversion records" value={metrics.conversionTotal} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile
              title="Contract total"
              value={formatDashboardMoney(metrics.conversionContractTotal)}
            />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile
              title="Revenue total"
              value={formatDashboardMoney(metrics.conversionRevenueTotal)}
            />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="费用逾期" value={metrics.overdueFees} danger={metrics.overdueFees > 0} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="费用即将到期" value={metrics.dueSoonFees} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="待处理审批任务" value={metrics.pendingWorkflowTasks} />
          </Col>
          <Col xs={24} sm={12} xl={4}>
            <MetricTile title="待处理提醒" value={metrics.pendingReminders} />
          </Col>
        </Row>

        <div className="summary-meta dashboard-scope-meta">
          <Typography.Text type="secondary">
            生成时间：{formatDashboardDateTime(summary?.generatedAt)}
          </Typography.Text>
          <Typography.Text type="secondary">用户范围：{summary?.scope.userId ?? "未返回"}</Typography.Text>
          <Typography.Text type="secondary">
            部门范围：{summary?.scope.departmentId ?? "未返回"}
          </Typography.Text>
        </div>

        <DashboardDistributionGrid sections={distributionSections} />
      </DataState>
    </Card>
  );
};

const MetricTile = ({
  title,
  value,
  danger,
}: {
  title: string;
  value: number | string;
  danger?: boolean;
}) => (
  <div className="dashboard-metric-tile">
    <Statistic title={title} value={value} valueStyle={{ color: danger ? "#b42318" : undefined }} />
  </div>
);

const DashboardDistributionGrid = ({ sections }: { sections: DashboardDistributionSection[] }) => (
  <div className="dashboard-distribution-grid">
    {sections.map((section) => (
      <DashboardDistributionCard key={section.metricKey} section={section} />
    ))}
  </div>
);

const DashboardDistributionCard = ({ section }: { section: DashboardDistributionSection }) => (
  <div className="dashboard-distribution-card">
    <div className="dashboard-distribution-header">
      <Typography.Text strong>{section.title}</Typography.Text>
      <Tag color="default">{section.metricKey}</Tag>
    </div>
    {section.items.length === 0 ? (
      <Typography.Text type="secondary">暂无该维度数据</Typography.Text>
    ) : (
      <div className="dashboard-distribution-list">
        {section.items.map((item) => (
          <div className="dashboard-distribution-item" key={item.key}>
            <div className="dashboard-distribution-line">
              <Typography.Text strong ellipsis>
                {item.label}
              </Typography.Text>
              <Typography.Text type="secondary">{item.count} 条</Typography.Text>
            </div>
            <div className="dashboard-distribution-bar" aria-hidden="true">
              <div
                className="dashboard-distribution-bar-fill"
                style={{ width: `${Math.max(item.percent, 4)}%` }}
              />
            </div>
            <Typography.Text type="secondary">{item.percent}%</Typography.Text>
          </div>
        ))}
      </div>
    )}
  </div>
);

const achievementTypeLabels: Record<string, string> = {
  PAPER: "论文",
  PATENT: "专利",
  SOFTWARE_COPYRIGHT: "软件著作权",
};

const achievementStatusLabels: Record<string, string> = {
  DRAFT: "草稿",
  PENDING_DEPARTMENT_REVIEW: "待部门审核",
  DEPARTMENT_REJECTED: "部门驳回",
  PENDING_ARCHIVE: "待归档",
  ARCHIVED: "已归档",
  VOIDED: "已作废",
};

const conversionStatusLabels: Record<string, string> = {
  LEAD_INTENT: "Lead / intent",
  CONTRACTING: "Contracting",
  SIGNED: "Signed",
  PAID: "Paid",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const formatDashboardMoney = (value: string): string =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(Number(value));

const payStatusLabels: Record<string, string> = {
  PENDING: "待缴",
  PAID: "已缴",
  OVERDUE: "逾期",
  WAIVED: "免缴",
  CANCELLED: "已取消",
};

const workflowTaskStatusLabels: Record<string, string> = {
  PENDING: "待处理",
  CLAIMED: "已领取",
  APPROVED: "已通过",
  REJECTED: "已驳回",
  CANCELLED: "已取消",
};

const reminderTaskStatusLabels: Record<string, string> = {
  PENDING: "待发送",
  SENT: "已发送",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
};

const hasDemoUser = (demoUserId: string | null): boolean => Boolean(demoUserId?.trim());

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
