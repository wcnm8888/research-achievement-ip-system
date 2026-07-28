import {
  ArrowRightOutlined,
  AuditOutlined,
  BellOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, List, Row, Space, Statistic, Tag, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createApiClient, isApiError, type ApiClient, type ApiError } from "./api-client";
import { BoundaryNotice, DataState, PermissionHint, SectionHeader } from "./components/StateBlocks";
import type { DashboardBucket, DashboardSummary, WorkflowTaskListResult } from "./types";
import {
  fetchMyWorkflowTasks,
  getWorkflowStepLabel,
  getWorkflowTaskStatusLabel,
} from "./workflow-tasks";
import { getWorkbenchWorkflowNavKey } from "./WorkflowTasks";

type Loadable<T> = {
  loading: boolean;
  data: T | null;
  error: ApiError | null;
};

type WorkbenchProps = {
  demoUserId: string | null;
  onNavigate: (key: string) => void;
  canAccessWorkflow?: boolean;
};

const emptyLoadable = <T,>(): Loadable<T> => ({
  loading: false,
  data: null,
  error: null,
});

export function Workbench({ demoUserId, onNavigate, canAccessWorkflow = true }: WorkbenchProps) {
  const [dashboard, setDashboard] = useState<Loadable<DashboardSummary>>(emptyLoadable);
  const [tasks, setTasks] = useState<Loadable<WorkflowTaskListResult>>(emptyLoadable);
  const apiClient = useMemo(() => createApiClient(demoUserId), [demoUserId]);

  const loadDashboard = useCallback(() => {
    if (!demoUserId) {
      setDashboard(emptyLoadable);
      return;
    }

    setDashboard({ loading: true, data: null, error: null });
    void apiClient
      .get<DashboardSummary>("/dashboard/summary", { dueSoonDays: 30 })
      .then((data) => setDashboard({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setDashboard({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, demoUserId]);

  const loadTasks = useCallback(() => {
    if (!demoUserId) {
      setTasks(emptyLoadable);
      return;
    }

    if (!canAccessWorkflow) {
      setTasks({
        loading: false,
        data: null,
        error: {
          kind: "forbidden",
          status: 403,
          message: "当前角色无审批待办权限。",
        },
      });
      return;
    }

    setTasks({ loading: true, data: null, error: null });
    void loadMyTasks(apiClient)
      .then((data) => setTasks({ loading: false, data, error: null }))
      .catch((error: unknown) =>
        setTasks({ loading: false, data: null, error: normalizeError(error) }),
      );
  }, [apiClient, canAccessWorkflow, demoUserId]);

  useEffect(() => {
    loadDashboard();
    loadTasks();
  }, [loadDashboard, loadTasks]);

  if (!demoUserId) {
    return (
      <Space direction="vertical" size={16} className="page-stack workbench-page workbench-v3">
        <SectionHeader
          title="工作台"
          description="请选择业务用户后加载工作台摘要和个人待办。"
        />
        <PermissionHint
          variant="alert"
          description="当前没有可用的业务用户，页面不会加载业务数据。请选择有权限的用户后继续。"
        />
        <WorkbenchSkeletonBoundary onNavigate={onNavigate} />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} className="page-stack workbench-page workbench-v3">
      <SectionHeader
        title="工作台"
        description="集中查看摘要、待办和常用业务入口。"
        extra={
          <Space size={12} wrap>
            <Tag className="workbench-status-tag" icon={<CheckCircleOutlined />}>
              系统运行正常
            </Tag>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadDashboard();
                loadTasks();
              }}
            >
              刷新数据
            </Button>
          </Space>
        }
      />

      <div className="workbench-scope-bar" role="group" aria-label="工作台数据范围">
        <div className="workbench-scope-field">
          <Typography.Text type="secondary">统计对象</Typography.Text>
          <Typography.Text strong>科研成果与审批</Typography.Text>
        </div>
        <div className="workbench-scope-field">
          <Typography.Text type="secondary">时间范围</Typography.Text>
          <Typography.Text strong>近 30 天</Typography.Text>
        </div>
        <div className="workbench-scope-field">
          <Typography.Text type="secondary">数据范围</Typography.Text>
          <Typography.Text strong>{getWorkbenchDepartmentLabel(dashboard.data)}</Typography.Text>
        </div>
        <Typography.Text type="secondary" className="workbench-scope-note">
          数据仅展示当前账号有权访问的摘要
        </Typography.Text>
      </div>

      <DashboardOverview dashboard={dashboard} onRetry={loadDashboard} />

      <Row gutter={[20, 20]} className="workbench-content-grid">
        <Col xs={24} xl={14}>
          <TaskCard tasks={tasks} onNavigate={onNavigate} onRetry={loadTasks} />
        </Col>
        <Col xs={24} xl={10}>
          <Space direction="vertical" size={16} className="full-width">
            <MyAchievementsCard onNavigate={onNavigate} />
            <FeeWarningCard dashboard={dashboard} onRetry={loadDashboard} />
          </Space>
        </Col>
      </Row>

      <SystemMessagesCard />
    </Space>
  );
}

const loadMyTasks = async (client: ApiClient): Promise<WorkflowTaskListResult> => {
  const result = await fetchMyWorkflowTasks(client, {
    status: "PENDING",
  });

  return {
    items: Array.isArray(result.items) ? result.items : [],
    total: typeof result.total === "number" ? result.total : result.items.length,
  };
};

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

function DashboardOverview({
  dashboard,
  onRetry,
}: {
  dashboard: Loadable<DashboardSummary>;
  onRetry: () => void;
}) {
  const summary = dashboard.data;
  const achievementTotal = summary?.achievement.total.value.count ?? 0;
  const pendingTasks = countBucket(summary?.workflowTasks.byStatus.value.buckets, "PENDING");
  const overdueFees = summary?.fee.deadline.value.overdue.count ?? 0;
  const dueSoonFees = summary?.fee.deadline.value.dueSoon.count ?? 0;
  const pendingReminders = countBucket(summary?.reminderTasks.byStatus.value.buckets, "PENDING");

  return (
    <Card className="shell-card workbench-summary-card" bordered={false}>
      <DataState loading={dashboard.loading} error={dashboard.error} onRetry={onRetry}>
        <Row gutter={[14, 14]} className="workbench-kpi-grid">
          <Col xs={12} lg={6}>
            <KpiTile icon={<BookOutlined />} title="成果总量" value={achievementTotal} note="归档与在研成果" />
          </Col>
          <Col xs={12} lg={6}>
            <KpiTile icon={<AuditOutlined />} title="待处理任务" value={pendingTasks} note="待审核审批事项" />
          </Col>
          <Col xs={12} lg={6}>
            <KpiTile
              icon={<WarningOutlined />}
              title="逾期费用"
              value={overdueFees}
              note="需要关注的费用项"
              tone={overdueFees > 0 ? "warning" : "default"}
            />
          </Col>
          <Col xs={12} lg={6}>
            <KpiTile
              icon={<ClockCircleOutlined />}
              title="30 天内到期"
              value={dueSoonFees + pendingReminders}
              note="费用与提醒事项"
            />
          </Col>
        </Row>
        <div className="summary-meta">
          <Typography.Text type="secondary">
            生成时间：{formatDateTime(summary?.generatedAt)}；范围：
            {getWorkbenchDepartmentLabel(summary)}
          </Typography.Text>
        </div>
      </DataState>
    </Card>
  );
}

function KpiTile({
  icon,
  title,
  value,
  note,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  note: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className={`workbench-kpi-tile workbench-kpi-tile-${tone}`}>
      <div className="workbench-kpi-heading">
        <Typography.Text>{title}</Typography.Text>
        <span className="workbench-kpi-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <Statistic value={value} />
      <Typography.Text className="workbench-kpi-note">{note}</Typography.Text>
    </div>
  );
}

function TaskCard({
  tasks,
  onNavigate,
  onRetry,
}: {
  tasks: Loadable<WorkflowTaskListResult>;
  onNavigate: (key: string) => void;
  onRetry: () => void;
}) {
  const taskItems = tasks.data?.items ?? [];

  return (
    <Card
      className="shell-card workbench-task-card"
      title={<span className="workbench-card-title"><AuditOutlined /> 我的审批待办</span>}
    >
      <DataState
        loading={tasks.loading}
        error={tasks.error}
        empty={taskItems.length === 0}
        emptyText="当前没有待处理审批任务"
        onRetry={onRetry}
      >
        <List
          className="task-list"
          dataSource={taskItems}
          renderItem={(task) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space wrap>
                    <Typography.Text strong>{getWorkflowStepLabel(task.stepCode)}</Typography.Text>
                    <Tag>{getWorkflowTaskStatusLabel(task.status)}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">任务：{task.id}</Typography.Text>
                    <Typography.Text type="secondary">
                      目标：{task.instance?.targetType ?? "未知"} /{" "}
                      {task.instance?.targetId ?? "未返回"}
                    </Typography.Text>
                  </Space>
                }
              />
              <Typography.Text type="secondary">{formatDateTime(task.createdAt)}</Typography.Text>
            </List.Item>
          )}
        />
      </DataState>
      <Button className="boundary-action" icon={<ArrowRightOutlined />} onClick={() => onNavigate(getWorkbenchWorkflowNavKey())}>
        进入审批管理
      </Button>
    </Card>
  );
}

function MyAchievementsCard({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <Card className="shell-card workbench-entry-card" title={<span className="workbench-card-title"><FileTextOutlined /> 我的成果</span>}>
      <Space direction="vertical" size={12} className="workbench-entry-content">
        <Typography.Text>
          可在成果管理中登记、查看、编辑并提交科研成果。
        </Typography.Text>
        <BoundaryNotice
          title="成果管理入口"
          description="进入成果管理可查看成果数据，并执行当前状态允许的操作。"
          step="成果管理"
        />
        <Button icon={<ArrowRightOutlined />} onClick={() => onNavigate("achievements")}>查看成果列表</Button>
      </Space>
    </Card>
  );
}

function FeeWarningCard({
  dashboard,
  onRetry,
}: {
  dashboard: Loadable<DashboardSummary>;
  onRetry: () => void;
}) {
  const overdue = dashboard.data?.fee.deadline.value.overdue.count ?? 0;
  const dueSoon = dashboard.data?.fee.deadline.value.dueSoon.count ?? 0;

  return (
    <Card className="shell-card workbench-warning-card" title={<span className="workbench-card-title"><WarningOutlined /> 费用预警</span>} extra={<Tag color="default">摘要</Tag>}>
      <DataState loading={dashboard.loading} error={dashboard.error} onRetry={onRetry}>
        <Row gutter={12}>
          <Col span={12}>
            <Statistic title="逾期" value={overdue} />
          </Col>
          <Col span={12}>
            <Statistic title="即将到期" value={dueSoon} />
          </Col>
        </Row>
        <Typography.Paragraph type="secondary" className="card-note">
          此处只读取统计摘要中的费用期限概览，不在工作台直接维护费用台账。
        </Typography.Paragraph>
      </DataState>
    </Card>
  );
}

function SystemMessagesCard() {
  return (
    <Card className="shell-card workbench-message-card" title={<span className="workbench-card-title"><BellOutlined /> 系统消息</span>}>
      <Alert
        type="info"
        showIcon
        message="站内消息"
        description="系统消息用于展示站内提醒和业务通知摘要。"
      />
    </Card>
  );
}

function WorkbenchSkeletonBoundary({ onNavigate }: { onNavigate: (key: string) => void }) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card className="shell-card" title="工作台摘要">
          <BoundaryNotice
            title="请选择业务用户"
            description="选择用户后再读取统计摘要。"
            step="工作台"
          />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="shell-card" title="成果管理">
          <BoundaryNotice
            title="下一步入口"
            description="可进入成果管理查看列表和表单。"
            step="成果管理"
          />
          <Button className="boundary-action" onClick={() => onNavigate("achievements")}>
            查看说明
          </Button>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="shell-card" title="审批管理">
          <BoundaryNotice
            title="待办入口"
            description="选择科研秘书后可进入审批管理查看我的待办列表。"
            step="审批管理"
          />
          <Button className="boundary-action" onClick={() => onNavigate(getWorkbenchWorkflowNavKey())}>
            进入审批管理
          </Button>
        </Card>
      </Col>
    </Row>
  );
}

const countBucket = (buckets: DashboardBucket[] | undefined, key: string): number =>
  buckets?.find((bucket) => bucket.key === key)?.count ?? 0;

export const getWorkbenchDepartmentLabel = (
  summary: DashboardSummary | null | undefined,
): string => {
  const departmentId = summary?.scope.departmentId;
  if (!departmentId) {
    return "当前组织";
  }

  const rankedDepartment = summary.achievement.departmentRanking.value.buckets.find(
    (bucket) => bucket.departmentId === departmentId,
  );

  return rankedDepartment?.departmentName || "当前组织";
};

const formatDateTime = (value: string | undefined): string => {
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
