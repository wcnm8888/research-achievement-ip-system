import { Button, Card, Col, Row, Segmented, Space, Statistic, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient, isApiError, type ApiClient, type ApiError } from "./api-client";
import { DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import type {
  DashboardBucket,
  DashboardDepartmentRankBucket,
  DashboardIntegrationCallBucket,
  DashboardSummary,
} from "./types";

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
  conversionLocalOverdue: number;
  overdueFees: number;
  dueSoonFees: number;
  pendingFees: number;
  paidFees: number;
  pendingWorkflowTasks: number;
  approvedWorkflowTasks: number;
  rejectedWorkflowTasks: number;
  cancelledWorkflowTasks: number;
  pendingReminders: number;
  integrationMockRecentCalls: number;
  integrationMockWindowDays: number;
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
          description="请选择业务用户后查看统计摘要。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，统计看板不会加载业务数据。请选择有权限的用户后继续。"
        />
        <Card className="shell-card">
          <Space direction="vertical" size={8}>
            <Typography.Text strong>请选择业务用户</Typography.Text>
            <Typography.Text type="secondary">
              未选择用户时不会加载统计摘要。
            </Typography.Text>
            <Typography.Text type="secondary">
              选择用户后，页面会展示当前权限范围内的统计摘要。
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
        description="快速查看成果规模、费用风险、审批效率、转化趋势和接口调用概览。"
        extra={
          <Button onClick={loadDashboard} loading={dashboard.loading}>
            刷新
          </Button>
        }
      />

      <PermissionHint description="统计范围已按当前账号权限过滤。" />

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
  conversionLocalOverdue: summary?.conversion.localRisk?.value.overdue.count ?? 0,
  overdueFees: summary?.fee.deadline.value.overdue.count ?? 0,
  dueSoonFees: summary?.fee.deadline.value.dueSoon.count ?? 0,
  pendingFees:
    summary?.fee.risk.value.pending.count ??
    countDashboardBucket(summary?.fee.byPayStatus.value.buckets, "PENDING"),
  paidFees:
    summary?.fee.risk.value.paid.count ??
    countDashboardBucket(summary?.fee.byPayStatus.value.buckets, "PAID"),
  pendingWorkflowTasks: countDashboardBucket(
    summary?.workflowTasks.byStatus.value.buckets,
    "PENDING",
  ),
  approvedWorkflowTasks:
    summary?.workflowTasks.efficiency.value.approved.count ??
    countDashboardBucket(summary?.workflowTasks.byStatus.value.buckets, "APPROVED"),
  rejectedWorkflowTasks:
    summary?.workflowTasks.efficiency.value.rejected.count ??
    countDashboardBucket(summary?.workflowTasks.byStatus.value.buckets, "REJECTED"),
  cancelledWorkflowTasks:
    summary?.workflowTasks.efficiency.value.cancelled.count ??
    countDashboardBucket(summary?.workflowTasks.byStatus.value.buckets, "CANCELLED"),
  pendingReminders: countDashboardBucket(
    summary?.reminderTasks.byStatus.value.buckets,
    "PENDING",
  ),
  integrationMockRecentCalls: summary?.integrationMock.recentCalls.value.count ?? 0,
  integrationMockWindowDays: summary?.integrationMock.recentCalls.value.windowDays ?? 7,
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
    title: "成果转化漏斗",
    metricKey: summary?.conversion.funnel.key ?? "CONVERSION_STATUS_FUNNEL",
    items: buildDashboardDistributionItems(
      summary?.conversion.funnel.value.buckets,
      conversionStatusLabels,
    ),
  },
  {
    title: "转化合同状态",
    metricKey: summary?.conversion.byContractStatus.key ?? "CONVERSION_CONTRACT_STATUS_DISTRIBUTION",
    items: buildDashboardDistributionItems(
      summary?.conversion.byContractStatus.value.buckets,
      conversionContractStatusLabels,
    ),
  },
  {
    title: "转化到账状态",
    metricKey: summary?.conversion.byRevenueStatus.key ?? "CONVERSION_REVENUE_STATUS_DISTRIBUTION",
    items: buildDashboardDistributionItems(
      summary?.conversion.byRevenueStatus.value.buckets,
      conversionRevenueStatusLabels,
    ),
  },
  {
    title: "转化评价效果",
    metricKey: summary?.conversion.byEvaluationEffect.key ?? "CONVERSION_EVALUATION_EFFECT_DISTRIBUTION",
    items: buildDashboardDistributionItems(
      summary?.conversion.byEvaluationEffect.value.buckets,
      conversionEvaluationEffectLabels,
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
  {
    title: "Mock 接口调用状态",
    metricKey: summary?.integrationMock.byStatus.key ?? "INTEGRATION_MOCK_STATUS_DISTRIBUTION",
    items: buildDashboardDistributionItems(
      summary?.integrationMock.byStatus.value.buckets,
      apiCallStatusLabels,
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
  unavailableMetrics: ["年度趋势引擎", "专利法律状态专项统计"],
});

export const getStep17BReadOnlyBoundary = () => ({
  endpoint: "/dashboard/summary",
  method: "GET",
  allowedDueSoonDays: [...allowedDashboardDueSoonDays],
  excludedQuery: ["today"],
  unavailableMetrics: [
    "年度趋势引擎",
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
    "年度趋势引擎",
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
        仅控制统计摘要的到期天数范围；页面不提供自定义日期输入或趋势引擎。
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
  const departmentRanking = summary?.achievement.departmentRanking.value.buckets ?? [];
  const integrationBuckets = summary?.integrationMock.byIntegration.value.buckets ?? [];

  return (
    <Card
      className="shell-card"
      title="评分摘要"
      extra={
        <Space size={8} wrap>
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
            <MetricTile title="转化记录" value={metrics.conversionTotal} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile
              title="合同总额"
              value={formatDashboardMoney(metrics.conversionContractTotal)}
            />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile
              title="收入总额"
              value={formatDashboardMoney(metrics.conversionRevenueTotal)}
            />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile
              title="转化本地逾期"
              value={metrics.conversionLocalOverdue}
              danger={metrics.conversionLocalOverdue > 0}
            />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="费用逾期" value={metrics.overdueFees} danger={metrics.overdueFees > 0} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="费用即将到期" value={metrics.dueSoonFees} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="费用待缴" value={metrics.pendingFees} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="费用已缴" value={metrics.paidFees} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="待处理审批任务" value={metrics.pendingWorkflowTasks} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="已通过审批任务" value={metrics.approvedWorkflowTasks} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="已驳回审批任务" value={metrics.rejectedWorkflowTasks} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="已取消审批任务" value={metrics.cancelledWorkflowTasks} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile title="待处理提醒" value={metrics.pendingReminders} />
          </Col>
          <Col xs={24} sm={12} xl={5}>
            <MetricTile
              title={`Mock 调用 ${metrics.integrationMockWindowDays} 天`}
              value={metrics.integrationMockRecentCalls}
            />
          </Col>
        </Row>

        <div className="summary-meta dashboard-scope-meta">
          <Typography.Text type="secondary">
            成果转化指标为当前权限范围内的统计摘要。
          </Typography.Text>
          <Typography.Text type="secondary">
            生成时间：{formatDashboardDateTime(summary?.generatedAt)}
          </Typography.Text>
          <Typography.Text type="secondary">用户范围：{summary?.scope.userId ?? "未返回"}</Typography.Text>
          <Typography.Text type="secondary">
            部门范围：{summary?.scope.departmentId ?? "未返回"}
          </Typography.Text>
        </div>

        <DashboardRankingGrid
          departments={departmentRanking}
          integrations={integrationBuckets}
        />

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

const DashboardRankingGrid = ({
  departments,
  integrations,
}: {
  departments: DashboardDepartmentRankBucket[];
  integrations: DashboardIntegrationCallBucket[];
}) => (
  <div className="dashboard-distribution-grid">
    <DashboardDepartmentRankingCard departments={departments} />
    <DashboardIntegrationRankingCard integrations={integrations} />
  </div>
);

const DashboardDepartmentRankingCard = ({
  departments,
}: {
  departments: DashboardDepartmentRankBucket[];
}) => (
  <div className="dashboard-distribution-card">
    <div className="dashboard-distribution-header">
      <Typography.Text strong>部门成果排行</Typography.Text>
      <Tag color="default">部门排行</Tag>
    </div>
    {departments.length === 0 ? (
      <Typography.Text type="secondary">暂无当前权限范围内部门聚合</Typography.Text>
    ) : (
      <div className="dashboard-distribution-list">
        {departments.map((department, index) => (
          <div className="dashboard-distribution-line" key={department.departmentId}>
            <Typography.Text strong ellipsis>
              {index + 1}. {department.departmentName}
            </Typography.Text>
            <Typography.Text type="secondary">
              {department.departmentCode} · {department.count} 项
            </Typography.Text>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DashboardIntegrationRankingCard = ({
  integrations,
}: {
  integrations: DashboardIntegrationCallBucket[];
}) => (
  <div className="dashboard-distribution-card">
    <div className="dashboard-distribution-header">
      <Typography.Text strong>外部接口 mock 调用</Typography.Text>
      <Tag color="default">接口调用聚合</Tag>
    </div>
    {integrations.length === 0 ? (
      <Typography.Text type="secondary">暂无最近 mock 调用聚合</Typography.Text>
    ) : (
      <div className="dashboard-distribution-list">
        {integrations.map((integration) => (
          <div className="dashboard-distribution-line" key={integration.integrationCode}>
            <Typography.Text strong ellipsis>
              {integration.integrationCode}
            </Typography.Text>
            <Typography.Text type="secondary">
              {integration.provider} · {integration.count} 次
            </Typography.Text>
          </div>
        ))}
      </div>
    )}
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

const conversionContractStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SIGNED: "Signed",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const conversionRevenueStatusLabels: Record<string, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  WAIVED: "Waived",
};

const conversionEvaluationEffectLabels: Record<string, string> = {
  NOT_EVALUATED: "Not evaluated",
  POSITIVE: "Positive",
  NEUTRAL: "Neutral",
  NEGATIVE: "Negative",
  MIXED: "Mixed",
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

const apiCallStatusLabels: Record<string, string> = {
  SUCCESS: "成功",
  FAILED: "失败",
  TIMEOUT: "超时",
  RETRIED: "重试",
  SKIPPED: "跳过",
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
